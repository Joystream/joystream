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
    'new-cap': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/ban-ts-comment': 'error',
    // why only required in VSCode!?!? is eslint plugin not working like eslint commandline?
    // Or are we having to add this because of new versions of eslint-config-* ?
    'no-console': 'off',
    // Override some extended config rules:
    'camelcase': 'off',
    'header/header': 'off',
    'sort-keys': 'off',
    'react/jsx-sort-props': 'off',
    'react/jsx-max-props-per-line': 'off',
    'sort-destructure-keys/sort-destructure-keys': 'off',
    '@typescript-eslint/unbound-method': 'warn', // Doesn't work well with our version of Formik, see: https://github.com/formium/formik/issues/2589
    'react-hooks/exhaustive-deps': 'warn', // Causes more issues than it solves currently
    'no-void': 'off' // Otherwise we cannot mark unhandles promises
  },
  // isolate pioneer from monorepo eslint rules
  root: true
};
