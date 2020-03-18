module.exports = {
  webpack(config, { isServer }) {
    config.resolve.modules.unshift(config.context);
    config.module.rules.push(
      {
        test: /\.(png|jpe?g|woff2?|mp3)$/,
        use: {
          loader: 'url-loader',
          options: {
            emitFile: isServer,
            name: '[name]-[hash].[ext]',
            limit: 8192,
            publicPath: `/_next/static/`,
            outputPath: `${isServer ? '../' : ''}static/`,
            esModule: false,
          },
        },
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack', 'svgo-loader'],
      },
      {
        // All script source files
        test: /\.(js|ts)x?$/,
        exclude: /node_modules/,
        use: [{ loader: 'prettier-loader', options: { parser: 'typescript' } }],
      },
      {
        // All style module source files
        test: /(\.module)\.css$/,
        exclude: /node_modules/,
        use: [{ loader: 'prettier-loader', options: { parser: 'css' } }],
      },
    );
    return config;
  },
};
