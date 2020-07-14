const path = require("path");

const IconsDir = path.join(__dirname, "..", "icons");

module.exports = {
	stories: ["../stories/**/*.stories.(js|jsx|ts|tsx|mdx)"],
	addons: [
		"@storybook/addon-actions",
		"@storybook/addon-links",
		"@storybook/addon-knobs",
		"@storybook/addon-storysource",
		"storybook-addon-jsx/register",
		"@storybook/addon-docs",
	],
	webpackFinal: async (config) => {
		// Disable the Storybook internal-`.svg`-rule for components loaded from our app.
		const svgRule = config.module.rules.find((rule) => "test.svg".match(rule.test));
		svgRule.exclude = [IconsDir];
		config.module.rules.push({
			test: /\.svg$/i,
			include: [IconsDir],
			use: [
				{
					loader: "@svgr/webpack",
					options: {},
				},
			],
		});

		config.module.rules.push({
			test: /\.(ts|tsx)$/,
			use: [
				{
					loader: require.resolve("babel-loader"),
					options: {
						rootMode: "upward",
					},
				},
				// Optional
				{
					loader: require.resolve("react-docgen-typescript-loader"),
				},
			],
		});
		config.resolve.extensions.push(".ts", ".tsx");
		return config;
	},
};
