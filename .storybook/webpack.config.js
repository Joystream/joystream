const path = require('path')
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
module.exports = ({ config }) => {

// TypeScript loader (via Babel to match polkadot/apps)
config.module.rules.push({
  test: /\.(ts|tsx)$/,
  exclude: /(node_modules)/,
  use: [
    {
      loader: require.resolve('babel-loader'),
      options: require('@polkadot/dev-react/config/babel')
    },
  ],
});
config.resolve.extensions.push('.ts', '.tsx');

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

// CSS preprocessors
config.module.rules.push(
    {
        test: /\.s[ac]ss$/i,
        use: [
            // Creates `style` nodes from JS strings
            'style-loader',
            // Translates CSS into CommonJS
            'css-loader',
            // Compiles Sass to CSS
            'sass-loader',
        ],
    },
    { 
        test: /\.less$/, 
        loaders: [ 'style-loader', 'css-loader', 'less-loader' ] 
    }
);

return config;
};
