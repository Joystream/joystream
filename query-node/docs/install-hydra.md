# Install Hydra

## Prerequisites

* Both Hydra-CLI and the generated project files have dependencies that require Node v10.16 or higher
* `npm` and \(optional, but recommended\) [`npx`](https://www.npmjs.com/package/npx)
* Hydra stores the substrate data in an external PostgresSQL 12 instance. The scaffolding tool provides a convenient shortcut for running the database instance from a Docker image. In this case the standard docker environment \(`docker` and `docker-compose`\) should be available.
* \(Optional\) [Docker engine](https://docs.docker.com/engine/install/). The scaffolding tool provides targets for building Docker images for external deployment.

## Installation

{% hint style="warning" %}
The npm repository and the`hydra-cli`version will likely change in the near future. In such a case simply replace `@dzlzv/hydra-cli`with`<npm_repo>/hydra-cli@<version>` in the instructions below ``
{% endhint %}

_Global installation:_

```bash
npm install -g @dzlzv/hydra-cli
```

The path to `hydra-cli` binaries will be added to the system-wide `$PATH`.

_Local installation:_

```bash
npm install @dzlzv/hydra-cli
```

The binaries will be installed to the local `.bin` folder. You can execute `hydra-cli` commands by adding the`.bin`folder within your local `node_modules` to `$PATH`.

_Isolated set-up:_

Execute `hydra-cli` commands directly by typing

```bash
npx @dzlzv/hydra-cli <command>
```

This provides an isolated way to execute `hydra-cli` commands. 

{% hint style="success" %}
Run `hydra-cli --version` to check your installation
{% endhint %}

{% hint style="info" %}
It may be convenient to create an alias for quick access to `hydra-cli` e.g.

```text
alias hydra-cli='npx @dzlzv/hydra-cli@0.0.5-alpha'
```
{% endhint %}

