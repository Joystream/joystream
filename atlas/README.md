## Getting Started

After cloning the repo, run:

```bash
$ cd atlas
$ yarn install
$ yarn start
```

To start the app on `localhost:1234`, Storybook on `localhost:6006` and the bundler in watch mode.

To build both the component package and the app together, run

```bash
$ yarn build
```

To run tests (Currently WIP) run

```bash
$ yarn test
```

## Packages

This monorepo consists of two packages, `app` and `@joystream/components` (the components package).
This repo is managed with [yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/)

To run a command in a workspace:

```bash
$ yarn workspace YOUR_WORKSPACE_NAME YOUR_COMMAND
```

For example, to add `react-spring` to `@joystream/components`:

```bash
$ yarn workspace @joystream/components add react-spring
```

### Components Package

The components package is located under `./packages/components` and can is usually referenced by `@joystream/components`.
It is, as the name suggests, a component library and everything related to components and atomic parts of the UI belongs here.

### App package

The components package is located under `./packages/app` and is where the actual Atlas application lives.
Business logic, full pages and data fetching should all reside here.

## Deploy Previews

Each PR has deploy previews for both for Storybook and for the App on Chromia and Netlify respectively.
