Storage Nodes for Joystream
===========================

Installation
------------

This project uses **yarn** as Node package manager.

```bash
$ yarn install
```

To make the `js_storage` script available globally, run:

```bash
$ npm install -g
```

This might be best if used within e.g. an [nvm](https://github.com/creationix/nvm)
environment.

Development
-----------

Run a development server:

```bash
$ yarn run dev
```

Run tests:
```bash
$ yarn run test
```

Run linter:
```bash
$ yarn run lint
```

API Packages
------------

Since it's not entirely clear yet how APIs will develop in future, the approach
taken here is to package individual APIs up individually. That is, instead of
providing an overall API version in `api-base.yml`, it should be part of each
API package's path.

For example, for a `foo` API in its version `v1`, its definitions should live
in `./paths/foo/v1.js` and `./paths/foo/v1/*.js` respectively.

*Note:* until a reasonably stable API is reached, this project uses a `v0`
version prefix.

Interface/implementation
------------------------

For reusability across API versions, it's best to keep files in the `paths`
subfolder very thin, and instead inject implementations via the `dependencies`
configuration value of `express-openapi`.

These implementations line to the `./lib` subfolder. Adjust `server.js` as
needed to make them available to API packages.
