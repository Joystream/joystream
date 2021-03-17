module.exports = {
    env: {
        node: true,
    },
  rules: {
      'no-async-promise-executor': 'off',
      'no-useless-return': 'off',
      'new-cap': 'off',
      // Disabled because of the false positive bug: https://github.com/eslint/eslint/issues/11899
      'require-atomic-updates': 'off',
  }
}
