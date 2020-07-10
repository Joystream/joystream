# Hydra Overview

Hydra is a query node for Substrate-based blockains, which allows one to query and access data not
directly available through RPC calls. For example, exprired Treasury spending proposals are pruned from the state of the Kusama blockchain (and that's of course how it should be), so quering say one year-old proposals is problematic. Indeed one has to inspect the old blocks and track the state of the proposals by looking at the events and extrinsics in each histroical block. This is exactly where Hydra get you covered, and, on top of that, it adds a convient GraphQL interface for rich data queries.

Hydra adopts the schema-first approach. Define a strongly typed [schema](schema.md) for your data, describe in TypeScript how your data is affected by the events emitted by the blockchain and Hydra will generate a blockchain indexer and a full-fledged GraphQL server for you.

The project is inspired by TheGraph protocol built for Ethereum smart contracts.

- Let me try!
- What is under the hood?
- Examples

## Architecture

Hydra query node consists of the following core parts:

- Blockchain [Indexer](indexer.md)
- PostgreSQL (Data Storage)
- GraphQL Server
- GraphQL-like data [schema](schema.md) & event [mappings](mappings.md)

Hydra takes as an input a high-level GraphQL-like schema modelling the blockchain data ("entities") to be indexed. The mappings describe the event handlers telling the indexer how the blockchain events affect the schema entities.

Once the schema and the mappings are set up, the Indexer prepares the database and starts the continuous scan of the blockchain, processing the events through the mappings and updating the entities in the database.

The GraphQL Server is a separate web server providing a [GraphQL](https://graphql.org/) API for the entities in the data store. The API requests are resolved into database queries, providing quick access to the most recent state of the entities. It supports complex filtering, entity relations, pagination and text queries. Look [here](graphql-server.md) for more details.
