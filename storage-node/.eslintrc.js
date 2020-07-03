module.exports = {
    env: {
        node: true,
        es6: true,
		mocha: true,
    },
    globals: {
        Atomics: "readonly",
        SharedArrayBuffer: "readonly",
    },
    extends: [
        "esnext",
        "esnext/style-guide",
        "plugin:prettier/recommended"
    ],
	"rules": {
		"import/no-commonjs": "off", // remove after converting to TS.
		// Disabling Rules because of monorepo environment:
		// https://github.com/benmosher/eslint-plugin-import/issues/1174
		"import/no-extraneous-dependencies": "off"
	},
	"overrides": [
		{
			"files": ["**/test/ranges.js", ],
			"rules": {
				// Disabling Rules because of used chai lib:
				// https://stackoverflow.com/questions/45079454/no-unused-expressions-in-mocha-chai-unit-test-using-standardjs
				"no-unused-expressions": "off",
			}
		}
	]
};
