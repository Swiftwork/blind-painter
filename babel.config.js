/*
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
        useBuiltIns: 'usage',
        corejs: 'core-js@3',
      },
    ],
    ['@babel/preset-react'],
  ],
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    [
      '@babel/plugin-transform-typescript',
      {
        isTSX: true,
        allExtensions: true,
        allowDeclareFields: true,
      },
    ],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ['@babel/plugin-proposal-object-rest-spread'],
    ['@babel/plugin-proposal-optional-chaining'],
    ['@babel/plugin-proposal-nullish-coalescing-operator'],
    ['@babel/plugin-transform-runtime'],
  ],
};
*/

module.exports = {
  plugins: [
    [
      '@babel/plugin-transform-typescript',
      {
        isTSX: true,
        allExtensions: true,
        allowDeclareFields: true,
      },
    ],
  ],
  env: {
    development: {
      presets: [['next/babel']],
    },
    production: {
      presets: [['next/babel']],
    },
    test: {
      presets: [['next/babel', { 'preset-env': { modules: 'commonjs' } }]],
    },
  },
};
