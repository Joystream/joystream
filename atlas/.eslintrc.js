module.exports = {
	env: {
		browser: true,
		node: true,
		es6: true,
		jest: true,
	},
	globals: {
		Atomics: 'readonly',
		SharedArrayBuffer: 'readonly',
	},
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 2019,
		sourceType: 'module',
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:react/recommended',
		'plugin:react-hooks/recommended',
		'plugin:prettier/recommended',
	],
	plugins: ['@typescript-eslint', 'react', 'react-hooks'],
	rules: {
		'react/prop-types': 'off',
	},
	settings: {
		react: {
			version: 'detect',
		},
	},
}
