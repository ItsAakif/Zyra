const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push('db', 'mp3', 'ttf', 'obj', 'png', 'jpg');

// Enable symlinks
config.resolver.unstable_enableSymlinks = true;

// Increase timeout for slow connections
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Set longer timeout for Android devices
      res.setTimeout(120000); // 2 minutes
      return middleware(req, res, next);
    };
  },
};

module.exports = config;