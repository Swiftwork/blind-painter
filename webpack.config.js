/* eslint-disable @typescript-eslint/no-var-requires */
'use strict';
const path = require('path');
const { HotModuleReplacementPlugin } = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const context = path.join(process.cwd(), 'client');

module.exports = (_, argv) => ({
  context: context,
  entry: ['./main.ts'],
  mode: argv.mode || 'development',
  resolve: {
    extensions: ['.js', '.ts', '.json'],
    modules: [context, 'node_modules'],
  },
  module: {
    rules: [
      {
        // Source files and non-compiled node_modules
        test: /\.(js|ts)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        // Only source files
        test: /\.(js|ts)$/,
        include: context,
        use: [{ loader: 'prettier-loader', options: { parser: 'typescript' } }],
      },
      {
        test: /\.svg$/,
        use: ['svg-sprite-loader', 'svgo-loader'],
      },
    ],
  },

  plugins: [
    new HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({ template: 'index.html' }),
    new ForkTsCheckerWebpackPlugin({
      tsconfig: path.resolve('tsconfig.json'),
      eslint: true,
      checkSyntacticErrors: true,
    }),
  ],

  performance: {
    maxEntrypointSize: 512000,
  },

  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          compress: {},
          output: {
            ascii_only: true, // eslint-disable-line @typescript-eslint/camelcase
            webkit: true,
          },
          compress: {
            typeofs: false,
            inline: 3,
            pure_getters: true, // eslint-disable-line @typescript-eslint/camelcase
            passes: 3,
          },
        },
      }),
    ],
  },

  devtool: argv.mode == 'development' ? 'cheap-module-eval-source-map' : false,
});
