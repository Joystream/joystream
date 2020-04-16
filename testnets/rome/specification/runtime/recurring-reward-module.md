# Recurring Reward Module

## Table of Contents

- [Name](#name)
- [Design](#design)
- [Dependencies](#dependencies)
- [Concepts](#concepts)
- [State](#state)
- [Events](#events)
- [Dispatchable Methods](#dispatchable-methods)
- [Non-dispatchable Methods](#non-dispatchable-methods)
  - [add_recipient](#add_recipient)
  - [remove_recipient](#remove_recipient)
  - [add_reward_relationship](#add_reward_relationship)
  - [remove_reward_relationship](#remove_reward_relationship)
  - [set_reward_relationship](#set_reward_relationship)
  - [on_finalize](#on_finalize)

## Name

`RecurringReward`

## Design

### Motivation

Some actors will be in a long term role with a corresponding pre-determined recurring reward amounts and payout frequencies, being financed out of resource budget with a purpose encompassing their role.

### Design

A _recipient_ designates an actor who can receive rewards through being registered as a recipient, through a _receives from source_ relationship, from a _reward source_. Each relationship has its own amount and payout frequency, which can be in a repeated or one-off payment mode.

### Usage

The module is meant to be a low level component of a fuller reward environment, where more context specific modules will layer contextual permissions and requirements on top of this module. This is why there are no dispatchables or events.

## Dependencies

- `TokenMint` module

## Concepts

```Rust

trait Trait : TokenMint::Trait + System::Trait {

 // Type of identifier for recipients.
 type RecipientId: INTEGER_TRAIT_CONSTRAINTS,

 // Type for identifier for relationship representing that a recipient recieves recurring reward from a token mint.
 type RewardRelationshipId: INTEGER_TRAIT_CONSTRAINTS,

 // Handle for aftermath of a payout attempt
 type PayoutStatusHandler: fn(Self::RewardRelationshipId: id, bool: status, destination_account: T::AccountId, amount: T::Balance);
}

// A recipient of recurring rewards
struct Recipient<T: Trait> {

  /// stats

  // Total payout received by this recipient
  total_reward_received: T::Balance,

  // Total payout missed for this recipient
  total_reward_missed: T::Balance
}

struct RewardRelationship<T: Trait> {

  // Identifier for receiver
  recipient: T::RecipientId,

  // Identifier for reward source
  mint_id: T::TokenMintId,

  // Destination account for reward
  account: T::AccountId,

  // Paid out for
  amount_per_payout: T::Balance,

  // When set, identifies block when next payout should be processed,
  // otherwise there is no pending payout
  next_payment_in_block: Option<T::Blocknumber>,

  // When set, will be the basis for automatically setting next payment,
  // otherwise any upcoming payout will be a one off.
  payout_interval: Option<T::Blocknumber>,

  /// stats

  // Total payout received in this relationship
  total_reward_received: T::Balance,

  // Total payout failed in this relationship
  total_reward_missed: T::Balance
}

```

## State

- `recipients: map T::RecipientId => Recipient<T>`
- `nextRecipientId: T::RecipientId`
- `rewardRelationships: map T::RewardRelationshipId => RewardRelationship<T>`
- `nextRewardRelationshipId: T::RewardRelationshipId`

## Events

**None**

## Dispatchables

**None**

## Non-dispatchable Methods

### `add_recipient`

Adds a new `Recipient` recipient to `recipients`, with identifier equal to `nextRecipientId`, which is also incremented, and returns the new recipient identifier.

### `remove_recipient`

Removes a mapping from `reward_recipients` based on the given identifier.

### `add_reward_relationship`

Adds a new `RewardRelationship` to `rewardRelationships`, for a given source, recipient, account, etc., with identifier equal to current `nextRewardRelationshipId`. Also increments `nextRewardRelationshipId`.

### `remove_reward_relationship`

Removes a mapping from `depenencies` based on given identifier.

### `set_reward_relationship`

For `RecievesFromSource` found in `rewardRelationships` with given identifier, new valus for the following can be set

- `account`
- `amount_per_payout`
- `next_payment_in_block`
- `payout_interval`

### `on_finalize`

For all `RecievesFromSource` found in `rewardRelationships` where `next_payment_in_block` is set and matches current block height, a call to `pay_reward` is made for the suitable amount, recipient and source. The `next_payment_in_block` is updated based on `payout_interval`.

If the call succeeds, `total_reward_received` is incremented on both
recipient and dependency with `amount_per_payout`, and a call to `T::PayoutStatusHandler` is made. Otherwise, analogous steps for failure.
