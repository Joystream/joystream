// This config is used globally at the root of the repo, so it should be as thin
// as possible with rules that we absolutely require across all projects.
module.exports = {
  env: {
    es6: true
  },
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 2019,
    sourceType: 'module'
  },
  extends: [
    'plugin:react/recommended',
    'standard'

    // jsx-a11y conflicts with pioneer rules. At time of writing
    // 84 problems -> We want to avoid as much as possible changing code in pioneer at least
    // from polkadot-js code base to make it possible to pull from upstream as easily as possible.
    // So Leaving out of for now. But it is recommended to add to all joystream react projects
    // 'plugin:jsx-a11y/recommended',

    // Turns off all rules that are unnecessary or might conflict with Prettier.
    // Allows us to do formatting separately from linting.
    // 'prettier',
    // 'prettier/@typescript-eslint',
    // 'prettier/react',
    // 'prettier/standard',
  ],
  plugins: [],
  settings: {
    version: 'detect'
  }
}
