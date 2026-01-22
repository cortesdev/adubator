// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname, {
    isCSSEnabled: true,
});

// Disable file watching in node_modules for performance
config.watcher = {
    watchman: {
        watchman: true,
    },
    healthCheck: {
        enabled: true,
    },
};

module.exports = config;