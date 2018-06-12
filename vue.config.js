const StyleLintPlugin = require('stylelint-webpack-plugin');

if (process.env.NODE_ENV === 'production') {
  // Retrieve BASE_URL for production build
  require('./src/env');

  process.env.BASE_URL = process.env.BASE_URL || '/';
  console.log(`BASE_URL = "${process.env.BASE_URL}"`);
}

module.exports = {
  configureWebpack: config => {
    const plugins = [
      new StyleLintPlugin(),
    ];
    if (process.env.NODE_ENV === 'production') {
      config.output.publicPath = process.env.BASE_URL;
    } else if (process.env.NODE_ENV === 'test') {
      // Test config writes here.
    }
    return {
      plugins,
      resolve: {
        alias: {
          // This is required because node descendants inject templates.
          'vue$': 'vue/dist/vue.esm.js',
        },
        extensions: ['.html'],
      },
      module: {
        rules: [
          {
            test: /\.html$/,
            exclude: /node_modules/,
            loader: 'html-loader?exportAsEs6Default',
          },
        ],
      },
    };
  },
  chainWebpack: config => {
    if (process.env.NODE_ENV === 'production') {
      config
      .plugin('html')
      .tap(args => {
        args[0].baseUrl = process.env.BASE_URL;
        return args;
      });
    }
  }
}
