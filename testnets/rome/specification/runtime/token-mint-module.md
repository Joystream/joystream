# Token Mint Module

## Table of Contents

- [Name](#name)
- [Design](#design)
- [Dependencies](#dependencies)
- [Concepts](#concepts)
- [State](#state)
- [Events](#events)
- [Dispatchable Methods](#dispatchable-methods)
- [Non-dispatchable Methods](#non-dispatchable-methods)
  - [add_mint](#add_mint)
  - [remove_mint](#remove_mint)
  - [transfer_tokens](#transfer_tokens)
  - [set_capacity](#set_limit)
  - [transfer_capacity](#transfer_capacity)
  - [on_finalize](#on_finalize)

## Name

`TokenMint`

## Motivation

Assume an actor is allocating tokens on behalf of others in the service of some broad goal. First, one may want to have flexibility in the _automatic_ constraints under which the allocation occurs. For example, one may want to

- limit the total quantity within a given time period.

- limit the set of possible recipients.

- limit the set of possible distributions across recipients.

These limits are cannot be enforced by simply crediting a discretionary account controlled by the allocator. Moreover, one may not want to finance the allocation by a large up-front minting, but rather mint tokens as they are required.

Second, there may be multiple such actors organized into some sort of network or hierarchy, where the goals of one actor support the goals of another, and as a result, one may want an actor to be able to finance the allocative budget of another.

## Design

The design centers around the idea of a _token mint_. A token mint has the ability to mint and transfer new tokens to an account. It has a _minting capacity_, which indicates how much can be minted currently, and this capacity is decreased with each minting action. A minting action is only valid if it respects the current capacity. The capacity can be changed at any time, and it can also be automatically adjusted at a given block interval, by either being set to some fixed value, adjusted by some fixed value (up or down). Lastly, a mint can transfer some part of its capacity to another mint.

## Usage

The module is meant to be a low-level component of a fuller reward environment, where more context-specific modules will layer contextual permissions and requirements on top of this module. This is why there are no dispatchables or events.

## Dependencies

- `Currency`: SRML currency module

## Concepts

```Rust
trait Trait : Curreny::Trait {

 /* Identifier type for a token mint. */
 type TokenMintId: INTEGER_TRAIT_CONSTRAINTS
}

enum AdjustCapacityBy {
 Setting,
 Adding,
 Reducing  
}

struct TokenMint<T: Trait> {

 id: T::TokenMintId,

 capacity: T::Balance,

 adjustment_type: AdjustCapacityBy,

 block_interval: T::BlockNumber,

 // Whether there is an upcoming block where
 // When this is not set, the mint is effectively paused.
 // There should be invariant check that Some(next_in_block) > now
 adjust_capacity_in_block_nr: Option<T::BlockNumber>,

 created: T::BlockNumber,

 /// Stats

 total_minted: T::Balance,
}

```

## State

- `mints: T::TokenMintId => TokenMint<T>`
- `nextTokenMintId: T::TokenMintId`

## Events

**None**

## Dispatchables

**None**

## Non-dispatchable Methods

### `add_mint`

Adds a new mint with a given settings to `mints`, and returns new `id`.

### `remove_mint`

Removes a mint with given `id` from `mints`

### `transfer_tokens`

Mints the given amount of tokens out of given mint and credits given account, provided it is within the current capacity, and reduces capacity correspondingly,

### `set_capacity`

Sets capacity of given mint to new given value.

### `transfer_capacity`

Given two mints, deducts from the capacity of one and credits capacity of the other, provided the amount respects the current capacity of the former.

### `on_finalize`

Updates capacity of all mints where the `adjust_capacity_in_block_nr` value match the current block number. For such mints, the value is updated by adding `block_interval`.
