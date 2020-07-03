module.exports = {
  env: {
    es6: true,
  },
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2019,
    sourceType: 'module',
  },
  extends: [
    'plugin:react/recommended',
    'standard',
    'plugin:jsx-a11y/recommended',
    // Disable formatting related es-linting rules
    'plugin:prettier/recommended',
    'prettier/react',
    'prettier/standard',
  ],
  plugins: [],
  settings: {
    version: 'detect',
  },
};
