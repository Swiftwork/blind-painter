/* eslint-disable @typescript-eslint/no-var-requires */
'use strict';
const path = require('path');
const { HotModuleReplacementPlugin } = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const StyleLintPlugin = require('stylelint-webpack-plugin');

const context = path.join(process.cwd(), 'client');

module.exports = (_, argv) => ({
  context: context,
  entry: ['./main.tsx'],
  mode: argv.mode || 'development',
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    modules: [context, 'node_modules'],
  },
  module: {
    rules: [
      {
        // Source files and non-compiled node_modules
        test: /\.(js|ts)x?$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        // Only source files
        test: /\.(js|ts)x?$/,
        include: context,
        use: [{ loader: 'prettier-loader', options: { parser: 'typescript' } }],
      },
      {
        // All CSS files
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: process.env.NODE_ENV === 'development',
            },
          },
        ],
      },
      {
        // All CSS module files
        test: /\.css$/,
        include: /\.module\.css$/,
        use: [
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: argv.mode === 'production' ? '[hash:base64]' : '[local]_[hash:base64:7]',
              },
            },
          },
          { loader: 'postcss-loader' },
        ],
      },
      {
        // All CSS non-module files
        test: /\.css$/,
        exclude: /\.module\.css$/,
        use: ['css-loader', { loader: 'postcss-loader' }],
      },
      {
        // All CSS source files
        test: /\.css$/,
        include: context,
        use: [{ loader: 'prettier-loader', options: { parser: 'css' } }],
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack', 'svgo-loader'],
      },
      {
        test: /\.(jpe?g)$/,
        loader: 'file-loader',
      },
    ],
  },

  plugins: [
    new HotModuleReplacementPlugin(),
    //new StyleLintPlugin(),
    new MiniCssExtractPlugin(),
    new ForkTsCheckerWebpackPlugin({
      tsconfig: path.resolve('tsconfig.json'),
      eslint: true,
      checkSyntacticErrors: true,
    }),
    new HtmlWebpackPlugin({ template: 'index.html' }),
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
      new OptimizeCSSAssetsPlugin({
        cssProcessorPluginOptions: {
          preset: [
            'default',
            {
              calc: false,
            },
          ],
        },
      }),
    ],
  },

  devtool: argv.mode == 'development' ? 'cheap-module-eval-source-map' : false,
});
