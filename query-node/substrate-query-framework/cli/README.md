# Hydra CLI

A query node for substrate based chains, inspired by TheGraph.

USAGE

```
$ cli [COMMAND]
```

COMMANDS

```
scaffold  Generate sample project with a schema file and mappings
codegen   Generate ready to run graphql server and block indexer
```

## Using Hydra CLI

Simply run
```
$ npx @dzlzv/hydra-cli [COMMAND]
```

or install via npm:

```
npm install -g @dzlzv/hydra-cli
```
and then
```
$ hydra-cli [COMMAND]
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

Running `hydra-cli scaffold` is recommended over manual editing of the `.env` file.

Typically, your cwd should look like this:

```
├── .env
├── mappings
│   ├── index.ts
└── schema.graphql
```

## Getting Started

Run cli inside the directory where you put `mappings`, `.env`, `schema.graphql`.

### Generate Graphql Server and Block Indexer

Hydra Cli creates a folder named `generated` and puts everthing inside it.

```
$ hydra-cli codegen
```

Make sure `package.json` is in you cwd. Start graphql server with a GraphQL playground:

```
$ yarn server:start:dev
```

Start block indexer:

```
$ yarn indexer:start
```

## Examples

Check out [sample projects](https://github.com/dzhelezov/joystream/tree/qnode_dzlzv_publish/query-node/examples) for inspiration!
