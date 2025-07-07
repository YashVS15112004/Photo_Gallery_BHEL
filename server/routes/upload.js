const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { body, validationResult } = require('express-validator');
const Album = require('../models/Album');
const Image = require('../models/Image');
const { auth } = require('../middleware/auth');
const { logImageActivity } = require('../middleware/activityLogger');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Configure multer for file upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files per upload
  }
});

// Image processing function
const processImage = async (buffer, originalName) => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const baseFilename = `${timestamp}_${randomString}`;
    const uploadsWebp = path.join(uploadsDir, `${baseFilename}.webp`);
    const uploadsJpeg = path.join(uploadsDir, `${baseFilename}.jpg`);
    const TARGET_WIDTH = 800;
    const TARGET_HEIGHT = 600;
    const MAX_SIZE = 100 * 1024; // 100KB

    // Helper to try encoding with given options
    const tryEncode = async (format, quality) => {
      let sharpInstance = sharp(buffer)
        .resize(TARGET_WIDTH, TARGET_HEIGHT, {
          fit: 'cover',
          position: 'center',
        });
      if (format === 'webp') {
        sharpInstance = sharpInstance.webp({ quality, effort: 6 });
      } else if (format === 'jpeg') {
        sharpInstance = sharpInstance.jpeg({ quality, mozjpeg: true });
      }
      const outBuffer = await sharpInstance.toBuffer();
      return outBuffer;
    };

    // Try WebP at decreasing quality
    let processedBuffer = null;
    let usedFormat = 'webp';
    let usedQuality = 80;
    for (let quality of [80, 70, 60, 50, 40, 30]) {
      const buf = await tryEncode('webp', quality);
      if (buf.length <= MAX_SIZE) {
        processedBuffer = buf;
        usedQuality = quality;
        break;
      }
    }
    // If still too large, try JPEG
    if (!processedBuffer) {
      for (let quality of [80, 70, 60, 50, 40, 30]) {
        const buf = await tryEncode('jpeg', quality);
        if (buf.length <= MAX_SIZE) {
          processedBuffer = buf;
          usedFormat = 'jpeg';
          usedQuality = quality;
          break;
        }
      }
    }
    if (!processedBuffer) {
      throw new Error('Unable to compress image to ≤ 100KB. Please use a smaller or simpler image.');
    }

    // Save file
    const filename = usedFormat === 'webp' ? `${baseFilename}.webp` : `${baseFilename}.jpg`;
    const filepath = path.join(uploadsDir, filename);
    await fs.writeFile(filepath, processedBuffer);

    // Get image metadata
    const metadata = await sharp(processedBuffer).metadata();

    return {
      filename,
      path: `/uploads/${filename}`,
      fileSize: processedBuffer.length,
      dimensions: {
        width: metadata.width,
        height: metadata.height
      },
      format: usedFormat,
      quality: usedQuality
    };
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('Failed to process image');
  }
};

// @route   POST /api/upload
// @desc    Upload images to album
// @access  Private
router.post('/', [
  auth,
  upload.array('images', 10),
  body('albumId').isMongoId().withMessage('Valid album ID is required')
], async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files ? req.files.length : 'No files');
    console.log('Request headers:', req.headers);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    if (!req.files || req.files.length === 0) {
      console.log('No files provided');
      return res.status(400).json({ error: 'No images provided' });
    }

    const { albumId } = req.body;
    const captions = req.body.captions || [];

    // Verify album exists and user has access
    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    if (album.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const uploadedImages = [];
    const uploadErrors = [];

    // Process each uploaded file
    for (let i = 0; i < req.files.length; i++) {
      try {
        const file = req.files[i];
        const caption = captions[i] || '';

        // Process image
        const processedImage = await processImage(file.buffer, file.originalname);

        // Create image record
        const image = new Image({
          filename: processedImage.filename,
          originalName: file.originalname,
          path: processedImage.path,
          caption: caption.trim(),
          uploadedBy: req.user._id,
          fileSize: processedImage.fileSize,
          mimeType: 'image/webp',
          dimensions: processedImage.dimensions,
          isProcessed: true
        });

        await image.save();

        // Add image to album
        await album.addImage(image._id);

        uploadedImages.push(image);
      } catch (error) {
        console.error(`Error processing file ${i}:`, error);
        uploadErrors.push({
          index: i,
          filename: req.files[i].originalname,
          error: error.message
        });
      }
    }

    // Populate the updated album
    await album.populate('images', 'path filename caption uploadedAt');
    await album.populate('thumbnail', 'path filename');

    res.status(201).json({
      message: 'Upload completed',
      uploadedImages,
      errors: uploadErrors.length > 0 ? uploadErrors : undefined,
      album
    });
    // Log image upload activity
    if (uploadedImages.length > 0) {
      await require('../models/ActivityLog').logActivity({
        user: req.user._id,
        action: 'upload_image',
        resource: 'image',
        resourceId: albumId,
        details: `Uploaded ${uploadedImages.length} image(s) to album ${albumId}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// @route   DELETE /api/upload/:id
// @desc    Delete image
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Check if user owns the image or is admin
    if (image.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Remove image from all albums
    const albums = await Album.find({ images: image._id });
    for (const album of albums) {
      await album.removeImage(image._id);
    }

    // Delete file from disk
    const filepath = path.join(__dirname, '..', image.path);
    try {
      await fs.unlink(filepath);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Continue even if file deletion fails
    }

    // Delete image record
    await Image.findByIdAndDelete(image._id);

    res.json({ message: 'Image deleted successfully' });
    // Log image delete activity
    await require('../models/ActivityLog').logActivity({
      user: req.user._id,
      action: 'delete_image',
      resource: 'image',
      resourceId: req.params.id,
      details: `Deleted image ${req.params.id}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// @route   PUT /api/upload/:id/caption
// @desc    Update image caption
// @access  Private
router.put('/:id/caption', [
  auth,
  body('caption').trim().isLength({ max: 200 }).withMessage('Caption must be less than 200 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const image = await Image.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Check if user owns the image or is admin
    if (image.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await image.updateCaption(req.body.caption);

    res.json({
      message: 'Caption updated successfully',
      image
    });
    // Log image caption modification
    await require('../models/ActivityLog').logActivity({
      user: req.user._id,
      action: 'modify_caption',
      resource: 'image',
      resourceId: req.params.id,
      details: `Modified caption for image ${req.params.id}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    console.error('Update caption error:', error);
    res.status(500).json({ error: 'Failed to update caption' });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 10 files.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field.' });
    }
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
});

module.exports = router; 