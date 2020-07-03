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
		"import/no-commonjs": "off" // remove after converting to TS.
	}
};
