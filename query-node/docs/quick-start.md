---
description: Build a Hydra Indexer and GraphQL server from scratch under five minutes
---

# Tutorial

{% hint style="info" %}
Before starting, make sure`hydra-cli`is [installed](install-hydra.md) on your machine together with all the prerequisites. 
{% endhint %}

## 0. Hello Hydra!

Start off by setting up a project folder

```bash
mkdir hello-hydra && cd hello-hydra
```

## 1. From zero to one

Next, run the scaffold command, which generates all the required files:

```bash
hydra-cli scaffold
```

Answer the prompts and the scaffolder will generate a sample backbone for our Hydra project. This includes:

* Sample GraphQL data [schema](schema-spec/) in `schema.graphql` describing proposals in the Kusama network
* Sample [mapping](mappings/) scripts in the `./mapping` folder translating substrate events into the `Proposal` entity CRUD operations
* `docker-compose.yml` for running a Postgres instance locally as a Docker service.
* `.env` with all the necessary environment variables.
* `package.json` with a few utility yarn scripts to be used later on.

## 2. Codegen

Now all is set for generating the Graphql server and the indexer for Kusama proposals:

```bash
hydra-cli codegen
```

The codegen command creates two separate projects:

* `./generated/graphql-server`: this is a GraphQL for querying the proposals
* `./generated/indexer`: this is a background indexer tool that fetches the blocks from the Substrate chain \(in this case the public Kusama network\) and updates the database calling the mapping scripts

## 3. Set up the database

Now it's time to set up the database:

```bash
yarn db:start
```

This command simply spins up a Postgres Docker image.

```bash
yarn db:bootstrap
```

This creates a DB schema for our data model described in `schema.graphql`.

## 4. Start Hydra Indexer

Finally, we're ready to run the indexer and the GraphQL server:

```bash
yarn indexer:start
```

Keep an eye on the output to keep track of the indexer's progress.

## 5. Start Hydra GraphQL server

In a separate terminal window:

```bash
yarn server:start:dev
```

The last command starts the server in the dev mode and you will see a GraphQL playground opening in your browser \(if not, navigate manually to `localhost:4000/graphql`\). It's time to explore all the GraphQL queries supported out-of-the-box! Note, that depending on the starting block it may take a considerable time for the indexer to catch up with the Kusama network, and until then queries may return empty results.

## 6. Dockerize

Among other things, the scaffolder generates a top-level `package.json`with a bunch of convenient `yarn` targets. For example, putting your Hydra Indexer and GraphQL server is easy as running the following targets:

```bash
yarn docker:indexer:build
```

```bash
yarn docker:server:build
```

This will create Docker images named `hydra-indexer` and `hydra-graphql-server`

## What to do next?

* Explore more [examples](../examples/)
* Describe your own [schema](schema-spec/) in `schema.graphql`
* Write your indexer [mappings](mappings/)
* Push your Hydra indexer and GraphQL Docker images to [Docker Hub](https://hub.docker.com/) and deploy  



