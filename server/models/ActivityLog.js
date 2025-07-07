const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'create', 'update', 'delete', 'login', 'logout', 'upload', 'download', 'view',
      'toggle_visibility', 'delete_album', 'upload_image', 'delete_image', 'modify_caption', 'modify_thumbnail'
    ]
  },
  resource: {
    type: String,
    required: true,
    enum: ['user', 'album', 'image', 'system']
  },
  resourceId: {
    type: String,
    required: false
  },
  details: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
activityLogSchema.index({ user: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ resource: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 });

// Static method to log activity
activityLogSchema.statics.logActivity = async function(data) {
  try {
    console.log('Logging activity:', data); // Debug log
    const log = new this(data);
    await log.save();
    return log;
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
};

// Static method to get logs with filters
activityLogSchema.statics.getLogs = async function(filters = {}) {
  const query = {};
  
  if (filters.user) {
    if (Array.isArray(filters.user)) {
      query.user = { $in: filters.user };
    } else {
      query.user = filters.user;
    }
  }
  
  if (filters.action) {
    query.action = filters.action;
  }
  
  if (filters.resource) {
    query.resource = filters.resource;
  }
  
  if (filters.search) {
    query.$or = [
      { details: { $regex: filters.search, $options: 'i' } },
      { 'user.username': { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  if (filters.dateFrom || filters.dateTo) {
    query.timestamp = {};
    if (filters.dateFrom) {
      query.timestamp.$gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      query.timestamp.$lte = new Date(filters.dateTo + 'T23:59:59.999Z');
    }
  }
  
  return this.find(query)
    .populate('user', 'username email')
    .sort({ timestamp: -1 })
    .limit(filters.limit || 100);
};

module.exports = mongoose.model('ActivityLog', activityLogSchema); 