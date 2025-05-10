const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Find the HtmlWebpackPlugin
      const htmlWebpackPlugin = webpackConfig.plugins.find(
        (plugin) => plugin.constructor.name === 'HtmlWebpackPlugin'
      );
      
      if (htmlWebpackPlugin) {
        // Update the HtmlWebpackPlugin options
        htmlWebpackPlugin.options.inject = true;
        htmlWebpackPlugin.options.template = './public/index.html';
      }
      
      return webpackConfig;
    },
  },
}; 