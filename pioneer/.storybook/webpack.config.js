const path = require('path')
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
module.exports = ({ config }) => {
  // Styles (replace the provided rule):
  const originalCssRuleIndex = config.module.rules.findIndex(rule => rule.test.source.includes('.css'));
  config.module.rules[originalCssRuleIndex] = {
    test: /\.(sa|sc|c)ss$/i,
    use: [
      // Creates `style` nodes from JS strings
      'style-loader',
      // Translates CSS into CommonJS
      'css-loader',
      // Compiles Sass to CSS
      'sass-loader'
    ]
  };

  // TypeScript loader (via Babel to match polkadot/apps)
  config.module.rules.push({
    test: /\.(js|ts|tsx)$/,
    exclude: /(node_modules)/,
    use: [
      {
        loader: require.resolve('babel-loader'),
        options: require('@polkadot/dev/config/babel')
      },
    ],
  });
  config.resolve.extensions.push('.js', '.ts', '.tsx');

  // TSConfig, uses the same file as packages
  config.resolve.plugins = config.resolve.plugins || [];
  config.resolve.plugins.push(
    new TsconfigPathsPlugin({
      configFile: path.resolve(__dirname, '../tsconfig.json'),
    })
  );

  // Stories parser
  config.module.rules.push({
      test: /\.stories\.tsx?$/,
      loaders: [require.resolve('@storybook/source-loader')],
      enforce: 'pre',
  });

  return config;
};
