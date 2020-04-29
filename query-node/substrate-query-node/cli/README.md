# cli

Create query node for substrate based chains.

USAGE

```
$ cli [COMMAND]
```

COMMANDS

```
codegen   Generate graphql server and block indexer ready to run
```

## Using CLI

Start use CLI by navigate `query-node/substrate-query-node/cli` directory then:

```
$ ./bin/run [COMMAND]
```

or

```
$ yarn link
$ cli [COMMAND]
```

## Prerequisites

CLI generates a grapqh server and a substrate block indexer.

- Graphql server uses warthog underneath and generate `model/resolver/service` from the schema you will define in the current working directory (cwd). Before starting code generation make sure you have a file named `schema.json` inside the cwd and at least one type defination inside it. Later we will see an example how to add a new type defination to our schema.
- Block indexer consumes produced blocks from a substrate based chain. Before running code generation make sure you have `.env` file inside the cwd, and `mappings` directory with `index.ts`. Which must have variables below with appropriate values:

```
WS_PROVIDER_ENDPOINT_URI=<provider>    # e.g ws://localhost:9944
TYPE_REGISTER_PACKAGE_NAME=<packname>  # name of the package to import TYPE_REGISTER_FUNCTION
TYPE_REGISTER_FUNCTION=<register_type> # name of the function that will called for type registration
```

Typical your cwd should look like this:

```
├── .env
├── mappings
│   ├── index.ts
└── schema.json
```

## Getting Started

Run cli inside the directory where you put `mappings`, `.env`, `schema.json`.

### Generate Graphql Server and Block Indexer

Cli create a folder named `generated` and put everthing inside it.

```
$ cli codegen
```

Start graphql server:

```
$ cd generated/graphql-server
$ yarn start:dev
```

Start block indexer:

```
$ cd generated/indexer
$ yarn start
```
