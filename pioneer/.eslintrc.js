const base = require('@polkadot/dev-react/config/eslint');

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
    '@typescript-eslint/interface-name-prefix': 'off',
    // why only required in VSCode!?!? is eslint plugin not working like eslint commandline?
    // Or are we having to add this because of new versions of eslint-config-* ?
    'no-console': 'off',
  },
  // isolate pioneer from monorepo eslint rules
  root: true
};
