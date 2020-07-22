module.exports = {
  rules: {
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/class-name-casing': 'off',
    'no-unused-vars': 'off', // Required by the typescript rule below
    '@typescript-eslint/no-unused-vars': ['error']
  }
}
