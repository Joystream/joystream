module.exports = {
  env: {
    mocha: true,
  },
  parserOptions: {
    project: './tsconfig.json'
  },
  extends: [
    '@joystream/eslint-config'
  ],
  rules: {
    'no-unused-vars': 'off', // Required by the typescript rule below
    '@typescript-eslint/no-unused-vars': ['error'],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/ban-types': ['error',
    {
        'types': {
            'String': false,
            'Boolean': false,
            'Number': false,
            'Symbol': false,
            '{}': false,
            'Object': false,
            'object': false,
            'Function': false,
        },
        'extendDefaults': true
    }
]
  },
}
