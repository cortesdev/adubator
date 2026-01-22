const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
    const config = await createExpoWebpackConfigAsync(env, argv);

    // Add CSP headers in development
    if (env.mode === 'development') {
        config.devServer = {
            ...config.devServer,
            headers: {
                "Content-Security-Policy": "script-src 'self' 'unsafe-eval' 'unsafe-inline' http://localhost:19006;"
            }
        };
    }

    return config;
};