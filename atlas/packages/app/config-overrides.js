/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const { override, addBabelPreset, addWebpackAlias, disableEsLint, addWebpackModuleRule } = require('customize-cra')
const eslintConfig = require('../../.eslintrc.js')

const modifiedEslintConfig = {
  ...eslintConfig,
  rules: {
    ...eslintConfig.rules,
    // mark prettier rule as a warning in config passed to webpack so wrong code formatting won't make dev server fail
    'prettier/prettier': 'warn',
  },
}

// based on https://github.com/arackaf/customize-cra/issues/175#issuecomment-610023655
const customEslintConfig = (configRules) => {
  if (process.env.CI) {
    return disableEsLint()
  }

  return (config) => {
    const updatedRules = config.module.rules.map((rule) => {
      // Only target rules that have defined a `useEslintrc` parameter in their options
      if (rule.use && rule.use.some((use) => use.options && use.options.useEslintrc !== undefined)) {
        const ruleUse = rule.use[0]
        const baseOptions = ruleUse.options
        const baseConfig = baseOptions.baseConfig || {}
        const newOptions = {
          useEslintrc: false,
          ignore: true,
          baseConfig: { ...baseConfig, ...configRules },
        }
        ruleUse.options = newOptions
        return rule

        // Rule not using eslint. Do not modify.
      } else {
        return rule
      }
    })

    config.module.rules = updatedRules
    return config
  }
}

module.exports = {
  webpack: override(
    addBabelPreset('@emotion/babel-preset-css-prop'),
    addWebpackAlias({
      '@': path.resolve(__dirname, 'src/'),
    }),
    addWebpackModuleRule({
      test: /\.(graphql|gql)$/,
      exclude: /node_modules/,
      loader: 'graphql-tag/loader',
    }),
    customEslintConfig(modifiedEslintConfig)
  ),
  paths: (paths) => {
    paths.appBuild = path.resolve(__dirname, '..', '..', 'dist')
    return paths
  },
}
