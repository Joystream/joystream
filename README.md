# atlas

## About

The components package holds the React components used in Atlas and their stories, while the app package contains the Atlas App itself.

## Getting Started

To start the app run `cd packages/app` and then `yarn start`, a server will be started on `localhost:1234` . To run the Storybook of the components run `cd packages/components` and then `yarn storybook` and storybook will be started on `localhost:6006`. To build storybook run `yarn build-storybook`

## Deploy Storybook as a static site

To deploy storybook as a static site, a `now.json` file has been setup for deployment with [Zeit Now](https://now.sh).
