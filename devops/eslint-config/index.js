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
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    // 'plugin:react-hooks/recommended', // this is only in newer versions

    // jsx-a11y conflicts with pioneer rules. At time of writing
    // 84 problems -> We want to avoid as much as possible changing code in pioneer at least
    // from polkadot-js code base to make it possible to pull from upstream as easily as possible.
    // pioneer has an isolated linting config so its safe to enable here.
    // Lets try to support an accessible web in future
    // 'plugin:jsx-a11y/recommended',

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
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
}
