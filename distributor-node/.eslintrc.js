module.exports = {
  env: {
    mocha: true,
  },
  parserOptions: {
    project: './tsconfig.json',
  },
  extends: ['@joystream/eslint-config'],
  rules: {
    'no-unused-vars': 'off', // Required by the typescript rule below
    '@typescript-eslint/no-unused-vars': ['error'],
    '@typescript-eslint/no-floating-promises': 'error',
    'no-void': 'off',
  },
}
