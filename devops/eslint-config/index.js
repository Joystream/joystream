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

    // Turns off all rules that are unnecessary or might conflict with Prettier.
    // Allows us to do formatting separately from linting.
    'prettier',
    'prettier/@typescript-eslint',
    'prettier/react',
    'prettier/standard',
    // To Display prettier errors as ESLint errors, enable the following configuration,
    // And make sure it is the last configuration in the extends array.
    'plugin:prettier/recommended',
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
  },
  plugins: ['standard', '@typescript-eslint', 'react', 'react-hooks'],
}
