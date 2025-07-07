const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Album name is required'],
    trim: true,
    maxlength: [100, 'Album name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image'
  }],
  thumbnail: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image'
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
albumSchema.index({ createdBy: 1 });
albumSchema.index({ isHidden: 1 });
albumSchema.index({ createdAt: -1 });

// Virtual for image count
albumSchema.virtual('imageCount').get(function() {
  return (this.images ? this.images.length : 0);
});

// Ensure virtual fields are serialized
albumSchema.set('toJSON', { virtuals: true });
albumSchema.set('toObject', { virtuals: true });

// Method to add image to album
albumSchema.methods.addImage = function(imageId) {
  if (!this.images.includes(imageId)) {
    this.images.push(imageId);
    // Set thumbnail if this is the first image
    if (!this.thumbnail) {
      this.thumbnail = imageId;
    }
  }
  return this.save();
};

// Method to remove image from album
albumSchema.methods.removeImage = function(imageId) {
  this.images = this.images.filter(id => id.toString() !== imageId.toString());
  
  // Update thumbnail if the removed image was the thumbnail
  if (this.thumbnail && this.thumbnail.toString() === imageId.toString()) {
    this.thumbnail = this.images.length > 0 ? this.images[0] : null;
  }
  
  return this.save();
};

// Method to set thumbnail
albumSchema.methods.setThumbnail = function(imageId) {
  // Ensure the image exists in the album
  if (!this.images.includes(imageId)) {
    throw new Error('Image not found in album');
  }
  this.thumbnail = imageId;
  return this.save();
};

// Method to toggle visibility
albumSchema.methods.toggleVisibility = function() {
  this.isHidden = !this.isHidden;
  return this.save();
};

// Static method to get visible albums
albumSchema.statics.getVisibleAlbums = function() {
  return this.find({ isHidden: false })
    .populate('images', 'path filename caption uploadedAt')
    .populate('thumbnail', 'path filename')
    .populate('createdBy', 'username')
    .sort({ createdAt: -1 });
};

// Static method to get albums by user
albumSchema.statics.getAlbumsByUser = function(userId) {
  return this.find({ createdBy: userId })
    .populate('thumbnail', 'path filename')
    .populate('images', 'path filename caption')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Album', albumSchema); 