const ActivityLog = require('../models/ActivityLog');

// Middleware to log activity
const logActivity = (action, resource, details) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log activity after response is sent
      if (req.user && res.statusCode < 400) {
        ActivityLog.logActivity({
          user: req.user._id,
          action,
          resource,
          resourceId: req.params.id || null,
          details,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        }).catch(err => {
          console.error('Error logging activity:', err);
        });
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Specific activity loggers
const logUserActivity = (action, details) => logActivity(action, 'user', details);
const logAlbumActivity = (action, details) => logActivity(action, 'album', details);
const logImageActivity = (action, details) => logActivity(action, 'image', details);
const logSystemActivity = (action, details) => logActivity(action, 'system', details);

// Login/logout specific loggers
const logLogin = logActivity('login', 'system', 'User logged in');
const logLogout = logActivity('logout', 'system', 'User logged out');

module.exports = {
  logActivity,
  logUserActivity,
  logAlbumActivity,
  logImageActivity,
  logSystemActivity,
  logLogin,
  logLogout
}; 