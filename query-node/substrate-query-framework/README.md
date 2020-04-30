# Substrate Query Node

This repository is a package that you can use to build a query node. It contains source code Block Indexer and CLI tool.

## Data Store

Block indexer store event data into a postgresql database. You can run the database with docker.

```
$ docker-compose up -d
```

## CLI Tool

CLI generates a GraphQL Server and a Block Indexer for Substrate based chains. How to use CLI [CLI](./cli/README.md)
