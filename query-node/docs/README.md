---
description: 'Introducing Hydra, a GraphQL query node for substrate chains'
---

# Overview

Hydra is inspired by [TheGraph](http://thegraph.com/) protocol but targets Substrate chains.‌

Hydra is a query node for Substrate-based blockchains. A query node ingests data from a substrate chain and provides rich, domain-specific, and highly customizable access to the blockchain data, far beyond the scope of direct RPC calls. For example, expired [Kusama Treasury](https://wiki.polkadot.network/docs/en/learn-treasury) spending [proposals](https://kusama.subscan.io/event?module=Treasury&event=Proposed) are pruned from the state of the[ Kusama blockchain](https://polkascan.io/kusama), so querying, say, one-year-old proposals becomes problematic. Indeed, one has to track the evolution of the state by sequentially applying the Treasury events and extrinsics in each historical block.

That's where Hydra gets you covered. Define your data model and the Hydra indexer will get it in sync with the chain. On top of that, you get a batteries-included GraphQL server with comprehensive filtering, pagination, and even full-text search capabilities. 

## What's next?

* Explore live Hydra GraphQL server [playground](https://hakusama.joystream.app/graphql) and query historical Kusama Treasury proposals 
* [Install](install-hydra.md) Hydra toolkit 
* Hydra [tutorial](quick-start.md): spin a Hydra Indexer and GraphQL server in under five minutes
* Look at the [examples](../examples/) 
* Learn how to define your own data [schema](schema-spec/) and [mappings](mappings/) to run a Hydra Indexer

