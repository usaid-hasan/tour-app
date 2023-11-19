/* eslint-disable quote-props */
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import * as eslintRules from 'eslint-rules';

export default [
  {
    files: ['**/*.js'],
    plugins: {
      'import': importPlugin,
    },
    rules: {
      ...eslintRules.default,
      ...eslintRules.importPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
      },
      globals: {
        ...globals.node,
      },
    },
    settings: {
      'import/extensions': ['.js'],
      'import/parsers': { espree: ['.js'] },
      'import/ignore': [],
      'import/resolver': {
        'eslint-import-resolver-custom-alias': {
          alias: {
            '#utils': './src/utils',
            '#server': './src/server',
            '#app': './src/app',
          },
        },
      },
    },
  },
];
