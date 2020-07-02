module.exports = {
    env: {
        node: true,
        es6: true,
    },
    globals: {
        Atomics: "readonly",
        SharedArrayBuffer: "readonly",
    },
    extends: [
        "esnext",
        "esnext/style-guide",
        "plugin:prettier/recommended"
    ]
};