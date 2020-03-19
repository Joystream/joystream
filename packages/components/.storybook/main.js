module.exports = {
  stories: ["../stories/**/*.stories.{js,jsx,ts,tsx}"],
  addons: [
    "@storybook/addon-actions",
    "@storybook/addon-links",
    "@storybook/addon-knobs",
    "@storybook/addon-storysource",
    "storybook-addon-jsx/register",
  ],
};
