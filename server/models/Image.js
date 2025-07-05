const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required']
  },
  path: {
    type: String,
    required: [true, 'File path is required']
  },
  caption: {
    type: String,
    trim: true,
    maxlength: [200, 'Caption cannot exceed 200 characters']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  dimensions: {
    width: Number,
    height: Number
  },
  isProcessed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
imageSchema.index({ uploadedBy: 1 });
imageSchema.index({ uploadedAt: -1 });
imageSchema.index({ isProcessed: 1 });

// Virtual for file size in MB
imageSchema.virtual('fileSizeMB').get(function() {
  return (this.fileSize / (1024 * 1024)).toFixed(2);
});

// Virtual for formatted upload date
imageSchema.virtual('formattedUploadDate').get(function() {
  return this.uploadedAt ? this.uploadedAt.toLocaleDateString() : 'Unknown';
});

// Ensure virtual fields are serialized
imageSchema.set('toJSON', { virtuals: true });
imageSchema.set('toObject', { virtuals: true });

// Method to update caption
imageSchema.methods.updateCaption = function(caption) {
  this.caption = caption;
  return this.save();
};

// Method to mark as processed
imageSchema.methods.markAsProcessed = function() {
  this.isProcessed = true;
  return this.save();
};

// Static method to get images by user
imageSchema.statics.getImagesByUser = function(userId) {
  return this.find({ uploadedBy: userId })
    .populate('uploadedBy', 'username')
    .sort({ uploadedAt: -1 });
};

// Static method to get recent images
imageSchema.statics.getRecentImages = function(limit = 20) {
  return this.find()
    .populate('uploadedBy', 'username')
    .sort({ uploadedAt: -1 })
    .limit(limit);
};

// Static method to get unprocessed images
imageSchema.statics.getUnprocessedImages = function() {
  return this.find({ isProcessed: false })
    .sort({ uploadedAt: 1 });
};

module.exports = mongoose.model('Image', imageSchema); 