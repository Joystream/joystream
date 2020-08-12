# Install Hydra

## Prerequisites

* Both Hydra-CLI and the generated project files have dependencies that require Node v10.16 or higher
* `npm` and \(optional, but recommended\) [`npx`](https://www.npmjs.com/package/npx)
* Hydra stores the substrate data in an external PostgresSQL 12 instance. The scaffolding tool provides a convenient shortcut for running the database instance from a Docker image. In this case the standard docker environment \(`docker` and `docker-compose`\) should be available.
* \(Optional\) [Docker engine](https://docs.docker.com/engine/install/). The scaffolding tool provides targets for building Docker images for external deployment.

## Installation

_Global installation:_

```bash
npm install -g @joystream/hydra-cli
```

The path to `hydra-cli` binaries will be added to the system-wide `$PATH`.

_Local installation:_

```bash
npm install @joystream/hydra-cli
```

The binaries will be installed to the local `.bin` folder. You can execute `hydra-cli` commands by adding the`.bin`folder within your local `node_modules` to `$PATH`.

_Isolated set-up:_

Execute `hydra-cli` commands directly by typing

```bash
npx @joystream/hydra-cli <command>
```

This provides an isolated way to execute `hydra-cli` commands.

{% hint style="success" %}
Run `hydra-cli --version` to check your installation
{% endhint %}

