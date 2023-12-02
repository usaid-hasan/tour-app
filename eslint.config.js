/* eslint-disable quote-props */
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import * as eslintRules from 'eslint-rules';

export default [
  { ignores: ['public/**/*.js', 'data/**/*.js'] },
  {
    files: ['**/*.js'],
    plugins: {
      'import': importPlugin,
    },
    rules: {
      ...eslintRules.default,
      ...eslintRules.importPlugin,
      'import/extensions': ['error', 'always', { ignorePackages: true }],
      'no-magic-numbers': 'off',
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
            '#models': './src/models',
            '#routes': './src/routes',
            '#handlers': './src/handlers',
            '#utils': './src/utils',
          },
        },
      },
    },
  },
  {
    files: ['src/web/**/*.js'],
    rules: {
      'import/no-extraneous-dependencies': ['error', { packageDir: ['./src/web/'] }],
      'import/extensions': ['error', 'never', { ignorePackages: true }],
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
      },
      globals: {
        ...globals.browser,
        'Stripe': 'readonly',
      },
    },
  },
];
