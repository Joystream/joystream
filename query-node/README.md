# query-node

The query-node project contains an input schema (schema.graphql) and mappings for the Joystream `content-directory` runtime module.

## Code generation

We use Hydra-cli to generate a graphql server and a block indexer for joystream chain:

```bash
$ cd query-node
$ yarn build
```

## Starting services

To start services defined in the project docker-compose.yml, you should run docker-compose from the project root folder to use the correct .env file

## Run mapping processor

Before running mappings make sure indexer(`yarn indexer:start`) and indexer-api-server (mappings get the chain data from this graphql server) are both running:

```bash
yarn processor:start
```

## Query data

Once processor start to store event data you will be able to query this data from `http://localhost:4002/graphql`.

```graphql
query {
  channels {
    handle
  }
}
```
