# Getting started

This guide provides step-by-step instructions on how to deploy a Hydra query node from scratch.

## Prerequisites

- Both Hydra-CLI and the generated project files have dependencies that require Node v10.16 or higher

- `npm` and (optional, but recommended) [`npx`](https://www.npmjs.com/package/npx)

- Hydra stores the substrate data in an external PostgresSQL 12 instance. The scaffolding tool provides a convenient shortcut for running the database instance from a Docker image. In this case the standard docker environment (`docker` and `docker-compose`) should be available.

- (Optional) [Docker engine](https://docs.docker.com/engine/install/). The scaffolding tool provides targets for building Docker images for external deployment.

## Installation

*Global installation:*

```sh
npm install -g @joystream/hydra-cli
```

The path to `hydra-cli` binaries will be added to the system-wide `$PATH`.

*Local installation:*

```sh
npm install @joystream/hydra-cli
```

The binaries will be installed to the local `.bin` folder. You can execute `hydra-cli` commands by adding the `.bin` folder within your local `node_modules` to `$PATH`.

*Isolated set-up:*

Execute `hydra-cli` commands directly by typing

```sh
npx @joystream/hydra-cli <command>
```

This provides an isolated way to execute `hydra-cli` commands.

## Hello-hydra project

Start off by setting up a project folder

```sh
mkdir hello-hydra && cd hello-hydra
```

Next, run the scaffold command, which generates all the required files:

```sh
hydra-cli scaffold
```

Answer the prompts and the scaffoder will generate a sample backbone for our Hydra project. This includes:

- Sample graphql data schema in `schema.graphql` describing proposals in the Kusama network
  
- Sample mapping scripts in the `mapping` folder translating substrate events into the `Proposal` entity CRUD operations

- `docker-compose.yml` for running a Postgres instance locally as a Docker service.

- `.env` with all the necessary environment variables

Now all is set for generating the graphql server and the indexer for Kusama proposals:

```sh
hydra-cli codegen:all
```

The codegen tool creates two separate projects:

- `./generated/graphql-server`: this is a GraphQL for quering the proposals
 
- `./generated/indexer`: this is a background indexer tool that fetches the blocks from the Substrate chain (in this case the public Kusama network) and updates the database calling the mapping scripts.


Now it's time to set up the database:

```sh
hydra-cli db:start
```

This command simply spins up a Postgres Docker image.

```sh
hydra-cli db:bootstrap
```

This creates a DB schema for our data model described in `schema.graphql`.

Finally, we're ready to run the indexer and the GraphQL server:

```sh
hydra-cli indexer:start
```

In a separate terminal window:

```sh
hydra-cli server:start:dev
```

The last command starts the server in the dev mode, so that the GraphQL playground at `localhost:4000/graphql` opens up. It's time to explore all the GraphQL queries supported out-of-the box! Note, that it takes considerable time before the indexer processes all the outstanding blocks of the Kusama network, so it will take a while before the queries return non-empty results.

## What's next?

