#  Staking Module

## Table of Contents

- [Name](#name)
- [Design](#design)
- [Dependencies](#dependencies)
- [Concepts](#concepts)
- [State](#state)
- [Events](#events)
- [Dispatchable Methods](#dispatchable-methods)
- [Non-dispatchable Methods](#non-dispatchable-methods)
  - [add_stake](#add_stake)
  - [remove_stake](#remove_stake)
  - [stake](#stake)
  - [increase_stake](#increase_stake)
  - [decrease_stake](#decrease_stake)
  - [initiate_slashing](#inititae_slashing)
  - [pause_slashing](#pause_slashing)
  - [continue_slashing](#continue_slashing)
  - [cancel_slashing](#cancel_slashing)
  - [initiate_unstaking](#initiate_unstaking)
  - [pause_unstaking](#pause_unstaking)
  - [continue_unstaking](#continue_unstaking)
  - [on_finalize](#on_finalize)

## Name

`Stake`

## Design

### Motivation

A module representing the lifecycle of the staking of platform actors. The module is meant to be a low level component of a fuller staking environment, where more context specific modules will layer contextual permissions and requirements on top of this module.

### Implementation

As a consequence of having no dispatchables, there are also no events, client code must layer this on top, possibly decorated with more context. There are autonomous state transitions, triggered at block arrival, and they are signalled through callbacks from corresponding client calls, and module level callback handlers, in this order.

### Notation

This document uses UML state machines, which are hierarchical state machines that have extended state. The event arrows have decorations `([condition])/name(/action)`, where the guts of the `()` are optional, and `condition` evaluates to a boolean and has no side effects on extended state, and the `action` may have side effects.

### Design

This module is organized around the idea of a _stake_, which refers to some amount of funds staked, or bonded, by some actor, for some specific purpose, under some constraints surrounding unstaking. This module only attempts to model the a common lifecycle found in the staking and slashing actions of a broad range of stakes on the platform.

#### Staking

The following image summarizes the key states and transitions concerning the staking.

![role_staking](https://user-images.githubusercontent.com/437292/62929919-b4b7f700-bdbb-11e9-8161-4ab37ede8084.png)

All currently staked funds live in a module owned staking account. No one can sign for spending from this account.

In the staked state, a stake holds a claim on a given amount of value in this account. This claim can rise and fall over time with slashings and explicit changes to the staking amount. The value can only be unlocked by successfully unstaking, and allowing a given amount of time to transpire in the active state.

A key design choice is to allow possibly multiple simultaneous slashing processes to take place simultaneously on the same role. The following  calls are used:

- `begin_new_slashing_stm()`: Create new slashing related state.
- `slashing_count()`: The number of currently ongoing slashings (see next section), hence no side effects.
- `unstaking_clock()`: The total number of blocks arrived in the active state, hence no side effects.

The rationale for the paused unstaking state is to allow a possibly extended slashing ordeal to take place during unstaking, without necessarily having to race against the unstaking timer.

#### Slashing

The following image summarizes the key states and transitions concerning a the life cycle of a single slashing.

![role_slashing](https://user-images.githubusercontent.com/437292/62929935-bbdf0500-bdbb-11e9-834e-d60c789bbf53.png)

The `begin_new_slashing_stm` call above involves creating a new instance of such a state machine.

The key design decision here is to not instantly slash, but to have a pausable countdown period. The pausing is ideal for allowing higher order processes around contesting a slashing action, possibly multiple times through a governance hierarchy for example.

A slashing itself involves reducing the claim of a stake on the staking fund. Multiple slashing attempts in flight will possibly compete, in that one brings the claim below the target slashing amount of the other, in which case the maximum feasible amount is slashed.

### Usage

Since all methods are non-dispatchable, the module should be used by one or more use case specific modules that introduce their own set of relevant permissions and extrinsics, as well as interleave the staking and slashing activities with any other use case specific requirements.

## Dependencies

- `Currency`: SRML module

## Concepts

```Rust

// CAN WE REPLACE THIS WITH THE WAY ONE CAN PASS VALUES TO
// MODULE TRAIT CONFIGURATION?
static const MODULE_STAKING_FUND_ACCOUNT_ID = 189;

trait StakingEventSink {

  // Type of handler which handles unstaking event.
  OnUnstakeHandler: fn(id: T::StakeId),

  // Type of handler which handles slashing event.
  // NB: actually_slashed can be less than amount of the slash itself if the
  // claim amount on the stake cannot cover it fully.
  OnSlashedHandler: fn(id: T::StakeId, slash_id: T::SlashId, actually_slashed: T::Balance)

}

trait Trait : StakingEventSink + Currency::Trait {

  // Type of identifier for stake
  type StakeId: INTEGER_TRAIT_CONSTRAINTS,

  // Type of identifier for a slashing
  type SlashId: INTEGER_TRAIT_CONSTRAINTS
}

struct Slash<T: Trait> {

  // The block slashing was initiated.
  started_at_block: T::BlockNumber,

  // Whether slashing is in active, or conversley paused state
  // Blocks are only counted towards slashing execution delay when active.
  is_active: bool,

  // The number blocks which must be finalised while in the active period before the slashing can be executed
  nr_of_blocks_remaining_in_active_period_for_slashing: T::BlockNumber
}

enum StakedStatus<T: Trait> {

  // Baseline staking status, nothing is happening.
  Normal,

  // Unstaking is under way
  Unstaking {

        // The block where the unstaking was initiated
        started_in_block: T::BlockNumber,

        // Whether unstaking is in active, or conversely paused state
        // Blocks are only counted towards unstaking period when active.
        is_active: bool,

        // The number blocks which must be finalised while in the active period before the unstaking is finished
        nr_of_blocks_remaining_in_active_period_for_unstaking: T::BlockNumber,
  }
}

enum StakingStatus<T: Trait> {

  NotStaked,

  Staked {

    // Total amount of funds at stake
    staked_amount: T::Balance,

    // All ongoing slashing process.
    // There may be some issue with BTreeMap for now in Polkadotjs,
    // consider replacing this with Vec<Slash<T>>, and remove nextSlashId from state, for now in that case,
    ongoing_slashes: BTreeMap<T::SlashId, Slash<T>>,

    // Status of the staking
    staked_status: StakedStatus<T>
  }
}

struct Stake<T: Trait> {

  // When role was created
  created: time,

  // Status of any possible ongoing staking
  staking_status: StakingStatus<T>,

}
```

## State

- `stakes: linked_map T::StakeId => Stake<T>`: Maps identifiers to a stake.
- `nextStakeId: T::StakeId`: Identifier value for next stake.
- `nextSlashId: T::SlashId`: Identifier value for next slashing.
- `staking_fund_account_id: T::AccountId`: Identifier for account of this module that holds staking funds.

## Events

**None**

## Dispatchable Methods

**None**

## Non-dispatchable Methods

### `add_stake`

- **Parameters:** **None**
- **Description:** Adds a new stake.
- **Side-effect(s):** Adds a new stake which is `NotStaked`, created at given block, into `stakes` map with id `nextStakeId`, and increments `nextStakeId`.
- **Events:** **None**
- **Returns:** New `StakeId`

### `remove_stake`

- **Parameters:**
  - `id`: Identifier of stake to be removed
- **Description:** Removes an unstaked stake.
- **Side-effect(s):** Given that stake with id `id` exists in `stakes` and is `NotStaked`, remove from `stakes`.
- **Events:** **None**
- **Returns:** **None**

### `stake`

Provided the stake exists and is in state `NotStaked` and the given account has sufficient free balance to cover the given staking amount, then the amount is transferred to the `MODULE_STAKING_FUND_ACCOUNT_ID` account, and the corresponding `staked_balance` is set to this amount in the new `Staked` state.

### `increase_stake`

Provided the stake exists and is in state `Staked.Normal`, and the given source account covers the amount, then the amount is transferred to the `MODULE_STAKING_FUND_ACCOUNT_ID` account, and the corresponding `staked_balance` is increased by the amount. New value of `staked_balance` is returned.

### `decrease_stake`

...

### `initiate_slashing`

Initiate a new slashing of a staked stake.

### `pause_slashing`

Pause an ongoing slashing.

### `continue_slashing`

Continue a currently paused ongoing slashing.

### `cancel_slashing`

Cancel an ongoing slashing (regardless of whether its active or paused).

### `initiate_unstaking`

Initiate unstaking of a staked stake.

### `pause_unstaking`

Puase an ongoing unstaking.

### `continue_unstaking`

Continue a currently paused ongoing unstaking.

### `on_finalize`

Handle timers for finalizing unstaking and slashing.

Finalised unstaking results in the `staked_balance` in the given stake to be transferred.

Finalised slashing results in the `staked_balance` in the given stake being correspondingly reduced.
