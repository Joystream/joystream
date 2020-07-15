const path = require('path')
const { override, addBabelPreset, addWebpackAlias, disableEsLint } = require('customize-cra')
const eslintConfig = require('../../.eslintrc.js')

// based on https://github.com/arackaf/customize-cra/issues/175#issuecomment-610023655
const useEslintConfig = (configRules) => (config) => {
	const updatedRules = config.module.rules.map((rule) => {
		// Only target rules that have defined a `useEslintrc` parameter in their options
		if (rule.use && rule.use.some((use) => use.options && use.options.useEslintrc !== void 0)) {
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

module.exports = {
	webpack: override(
		addBabelPreset('@emotion/babel-preset-css-prop'),
		addWebpackAlias({
			['@']: path.resolve(__dirname, 'src/'),
		}),

		// once project is cleaned up we can remove disable and enable the config again
		// useEslintConfig(eslintConfig),
		disableEsLint()
	),
	paths: (paths) => {
		paths.appBuild = path.resolve(__dirname, '..', '..', 'dist')
		return paths
	},
}
