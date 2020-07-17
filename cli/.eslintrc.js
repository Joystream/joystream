module.exports = {
  env: {
    mocha: true,
  },
  extends: [
    // The oclif rules have some code-style/formatting rules which may conflict with
    // our prettier global settings. Disabling for now
    // I suggest to only add essential rules absolutely required to make the cli work with oclif
    // at the end of this file.
    // "oclif",
    // "oclif-typescript",
  ],
  rules: {
    "no-unused-vars": "off", // Required by the typescript rule below
    "@typescript-eslint/no-unused-vars": ["error"]
  }
}
