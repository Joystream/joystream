module.exports = {
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {
    'no-unused-vars': 'off', // Required by the typescript rule below
    '@typescript-eslint/no-unused-vars': ['error'],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error'
  },
}
