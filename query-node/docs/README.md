---
description: 'Introducing Hydra, a GraphQL query node for substrate chains'
---

# Overview

Hydra is inspired by [TheGraph](http://thegraph.com/) protocol but targets Substrate chains.‌

Hydra is a query node for Substrate-based blockchains. A query node ingests data from a substrate chain and provides rich, domain-specific, and highly customizable access to the blockchain data, far beyond the scope of direct RPC calls. For example, expired Kusama Treasury spending proposals are pruned from the state of the Kusama blockchain, so querying, say, one-year-old proposals becomes problematic. Indeed, one has to track the evolution of the state by sequentially applying the Treasury events and extrinsics in each historical block.

This is exactly where Hydra gets you covered. Define your data model and the Hydra indexer will get it in sync with the chain. On top of that, you get a batteries-included GraphQL server with comprehensive filtering, pagination, and even full-text search capabilities. 

## What's next?

* [Hydra tutorial](../): spin a Hydra indexer and GraphQL server in under five minutes
* 


Hydra adopts the schema-first approach. Define a strongly typed [schema](https://github.com/dzhelezov/joystream/tree/f07cb27a73ec74292811648cee8a92d8fab3b6c9/query-node/docs/schema.md) for your data, describe in TypeScript how your data is affected by the events emitted by the blockchain and Hydra will generate a blockchain indexer and a full-fledged GraphQL server for you.

* Let me try!
* What is under the hood?
* Examples

## Architecture



