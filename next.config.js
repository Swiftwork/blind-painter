module.exports = {
  webpack(config) {
    config.resolve.modules.unshift(process.cwd());
    config.module.rules.push(
      {
        test: /\.(mp3)$/,
        loader: 'file-loader',
      },
      {
        test: /\.svg$/,
        exclude: /\.full\.svg$/,
        use: ['@svgr/webpack', 'svgo-loader'],
      },
      {
        test: /\.svg$/,
        include: /\.full\.svg$/,
        use: ['file-loader', 'svgo-loader'],
      },
    );
    return config;
  },
};
