module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },
  extends: ['plugin:react-hooks/recommended', '../.eslintrc.js'],
  rules: {
    'react/prop-types': 'off',
  },
}
