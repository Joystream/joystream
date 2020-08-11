// At some point don't depend on @polkadot rules and use @joystream/eslint-config
const base = require('@polkadot/dev/config/eslint');

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
    'react/prop-types': 'off',
    'new-cap': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/ban-ts-comment': 'error',
    // why only required in VSCode!?!? is eslint plugin not working like eslint commandline?
    // Or are we having to add this because of new versions of eslint-config-* ?
    'no-console': 'off',
    'header/header': 'off' // Temporary disable polkadot's rule
  },
  // isolate pioneer from monorepo eslint rules
  root: true
};
