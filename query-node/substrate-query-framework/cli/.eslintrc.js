module.exports = {
    extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/eslint-recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:@typescript-eslint/recommended-requiring-type-checking"
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        //debugLevel: true
	},
	plugins: ["@typescript-eslint"]
}