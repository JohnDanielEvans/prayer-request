const { override, addWebpackAlias } = require('customize-cra');
const webpack = require('webpack');

module.exports = override(
  addWebpackAlias({
    'path': require.resolve('path-browserify')
  }),
  (config) => {
    config.resolve.fallback = {
      "os": require.resolve("os-browserify/browser"),
      "path": require.resolve("path-browserify"),
      "crypto": require.resolve("crypto-browserify"),
      "buffer": require.resolve("buffer/"),
      "stream": require.resolve("stream-browserify"),
      "process": require.resolve("process/browser.js"),
      "vm": require.resolve("vm-browserify")
    };
    config.plugins = (config.plugins || []).concat([
      new webpack.ProvidePlugin({
        process: 'process/browser.js',
        Buffer: ['buffer', 'Buffer']
      })
    ]);
    config.module.rules.push({
      test: /\.m?js/,
      resolve: {
        fullySpecified: false
      }
    });
    return config;
  }
);