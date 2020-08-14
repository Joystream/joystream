---
description: A more in-depth look at how Hydra works under the hood
---

# Architecture

A Hydra query node consists of the following core parts:

* Blockchain Indexer
* PostgreSQL \(Data Storage\)
* GraphQL Server
* GraphQL-like data [schema](https://github.com/dzhelezov/joystream/tree/f07cb27a73ec74292811648cee8a92d8fab3b6c9/query-node/docs/schema.md) & event [mappings](https://github.com/dzhelezov/joystream/tree/f07cb27a73ec74292811648cee8a92d8fab3b6c9/query-node/docs/mappings.md)

Hydra takes as an input a high-level GraphQL-like schema modeling the blockchain data \("entities"\) to be indexed. The mappings describe the event handlers telling the indexer how the blockchain events affect the schema entities.

Once the schema and the mappings are set up, the Indexer prepares the database and starts the continuous scan of the blockchain, processing the events through the mappings and updating the entities in the database.

The GraphQL Server is a separate web server providing a [GraphQL](https://graphql.org/) API for the entities in the data store. The API requests are resolved into database queries, providing quick access to the most recent state of the entities. It supports complex filtering, entity relations, pagination, and text queries.

