/* eslint-disable @typescript-eslint/no-var-requires */

const reactConfig = require('../../../config-overrides')

module.exports = {
  stories: ['../stories/**/*.stories.(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-actions',
    '@storybook/addon-links',
    '@storybook/addon-knobs',
    '@storybook/addon-storysource',
    'storybook-addon-jsx/register',
    '@storybook/addon-docs',
    '@storybook/preset-create-react-app',
  ],
  webpackFinal: async (config) => {
    return reactConfig.webpack(config)
  },
}
