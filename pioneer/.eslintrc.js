const base = require('@polkadot/dev-react/config/eslint');
console.log('Using eslintrc from pioneer folder')
// add override for any (a metric ton of them, initial conversion)
module.exports = {
  ...base,
  parserOptions: {
    ...base.parserOptions,
    project: [
      './tsconfig.json'
    ]
  },
  rules: {
    ...base.rules,
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/camelcase': 'off',
    'react/prop-types': 'off',
    'new-cap': 'off',
    '@typescript-eslint/interface-name-prefix': 'off'
  },
  extends: base.extends.concat([
    // disable formatting rules - incase we decide to apply code style rules
    // to our linter settings.
    'prettier',
    'prettier/@typescript-eslint',
    'prettier/react',
    'prettier/standard',
  ])
};
