# cli

Query node cli

USAGE

```sh-session
  $ cli [COMMAND]
```

COMMANDS

```sh-session
codegen   Generate graphql server and block indexer ready to run
```

# Using CLI

Start use CLI by navigate `query-node/substrate-query-node/cli` directory then:

```sh-session
$ ./bin/run [COMMAND]
```

or

```sh-session
$ yarn link
$ cli [COMMAND]
```

## Generate Grapql Server and Block Indexer for Joystream query node

1. Code generation

```sh-session
$ cd query-node/joystream-query-node
$ cli codegen
```

2. Run graphql server

```sh-session
$ cd generated/graphql-server
$ yarn start:dev
```

3. Run block indexer
   Before running block indexer we need to install `@joystream/types`.

```sh-session
$ cd generated/indexer
$ yarn add @joystream/types
$ yarn start
```

## Joystream query node mappings

Whenever you update `joystream-query-node/mappings` you need to restart indexer.
