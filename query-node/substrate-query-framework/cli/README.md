# Hydra CLI

A query node for substrate based chains, inspired by TheGraph.

USAGE

```bash
$ hydra-cli [COMMAND]
```

COMMANDS

```bash
scaffold  Generate sample project with a schema file and mappings
codegen   Generate ready to run graphql server and block indexer
```

## Using Hydra CLI

Using `npx`:

```bash
$ alias hydra-cli='npx @dzlzv/hydra-cli'
```

or install via npm:

```bash
npm install -g @dzlzv/hydra-cli
```
and then

```bash
$ hydra-cli [COMMAND]
```

## Getting Started

Run

```
$ hydra-cli scaffold
```
and answer the prompts. The scaffolder will generate the following files:
Typically, your cwd should look like this:

```
├── .env
├── docker-compose.yml
├── docker
├── mappings
├── package.json
└── schema.graphql
```

By defualt the scaffolder generates mappings and a schema describing Kusama Treasury proposals.
Generate the indexer and the server:

```bash
$ hydra-cli codegen
```

The indexer and server files will be generated in `./generated/indexer` and `./generated/graphql-server` respectively.

In order to run them, a Postges database should be up and running and accept connections. The credentials should be provided in `.env` file. By default, the scaffolder generates a database service  `docker-compose.yml` with the credentials provided. Run 

```bash
$ yarn db:start
$ yarn db:bootstrap
```

to create the database and set up the schema (if the database already exists, skip the first one).

Now spin up the server and the indexer:

```bash
$ yarn indexer:start
```

```bash
$ yarn server:start:dev
```

### Generate Graphql Server and Block Indexer

Hydra Cli creates a folder named `generated` and puts everthing inside it.

```bash
$ hydra-cli codegen
```

Make sure `package.json` is in you cwd. Start graphql server with a GraphQL playground:

```bash
$ yarn server:start:dev
```

Start block indexer:

```bash
$ yarn indexer:start
```

## Prerequisites

Hydra CLI generates a grapqh server and a substrate block indexer.

- Graphql server uses warthog underneath. Hydra generates `model/resolver/service` from the schema that you define in the current working directory (cwd) in a file named `schema.graphql`. For a guide on how to write a schema, follow the [docs](https://app.gitbook.com/@dzhelezov/s/hydra-docs/v/query_node_spec/query-node/docs).
  
- Block indexer consumes produced blocks from a substrate based chain. Before running code generation make sure you have `.env` file inside the cwd, and `mappings` directory with `index.ts`. All mapping functions should be exported
  
- Which must have variables below with appropriate values:

```
# Project name
PROJECT_NAME=test

# Substrate endpoint to source events from
WS_PROVIDER_ENDPOINT_URI=
# block height to start the indexer from
BLOCK_HEIGHT=0

# DB config to create a database (use db tools only for development!)
DB_NAME=test
DB_USER=postgres
DB_PASS=postgres
DB_HOST=localhost
DB_PORT=5432

# GraphQL server HOST and PORT
GRAPHQL_SERVER_PORT=4000
GRAPHQL_SERVER_HOST=localhost
WARTHOG_APP_PORT=4000
WARTHOG_APP_HOST=localhost

WS_PROVIDER_ENDPOINT_URI=<provider>    # e.g ws://localhost:9944
TYPE_REGISTER_PACKAGE_NAME=<packname>  # name of the package to import TYPE_REGISTER_FUNCTION
TYPE_REGISTER_FUNCTION=<register_type> # name of the function that will called for type registration
```

## Examples

Check out [sample projects](https://github.com/dzhelezov/joystream/tree/qnode_dzlzv_publish/query-node/examples) for inspiration!
