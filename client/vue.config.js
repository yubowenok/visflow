const StyleLintPlugin = require('stylelint-webpack-plugin');
const webpack = require('webpack');

const env = require('./env');
let baseUrl = env.BASE_URL;

if (env.ENVIRONMENT === 'production') {
  baseUrl = baseUrl || '/';
  console.log(`BASE_URL = "${baseUrl}"`);
}

module.exports = {
  baseUrl,
  configureWebpack: config => {
    const plugins = [
      new StyleLintPlugin(),
      new webpack.DefinePlugin({
        'process.env.TIME_ZONE': JSON.stringify(env.TIME_ZONE),
        'process.env.VERSION': JSON.stringify(env.VERSION),
        'process.env.FLOWSENSE_ENABLED': JSON.stringify(env.FLOWSENSE_ENABLED),
      }),
    ];
    if (env.ENVIRONMENT === 'production') {
      // config.output.publicPath = baseUrl;
    } else if (env.ENVIRONMENT === 'test') {
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
    if (env.ENVIRONMENT === 'production') {
      config
        .plugin('html')
        .tap(args => {
          args[0].baseUrl = baseUrl;
          return args;
        });
    }
  }
}
