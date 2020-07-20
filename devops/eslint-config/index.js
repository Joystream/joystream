// This config is used globally at the root of the repo, so it should be as thin
// as possible with rules that we absolutely require across all projects.
module.exports = {
  env: {
    es6: true,
  },
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  // We are relying on version that comes with @polkadot/dev
  // Newest version is breaking pioneer!
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2019,
    sourceType: 'module',
  },
  extends: [
    'standard',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    // this is only in newer versions of eslint-plugin-react-hooks
    // 'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
    'prettier/@typescript-eslint',
    'prettier/react',
    'prettier/standard',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // drop these when using newer versions of eslint-plugin-react-hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    // only cli projects should really have this rule, web apps
    // should prefer using 'debug' package at least to allow control of
    // output verbosity if logging to console.
    'no-console': 'off',
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'default',
        format: ['camelCase'],
      },
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE'],
      },
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
      {
        selector: 'property',
        format: [], // Don't force format of object properties, so they can be ie.: { "Some thing": 123 }, { some_thing: 123 } etc.
      },
      {
        selector: 'enumMember',
        format: ['PascalCase'],
      },
    ],
  },
  plugins: ['standard', '@typescript-eslint', 'react', 'react-hooks', 'prettier'],
}
