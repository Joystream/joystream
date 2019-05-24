# Storage Role Staking

## Table Of Contents

- [Name](#name)
- [Dependencies](#dependencies)
- [Concepts](#concepts)
- [Design](#design)
- [State](#state)
- [Events](#events)
- [Dispatchable Methods](#dispatchable-methods)
  - [entry_request](#entry_request)
  - [stake](#stake)
  - [unstake](#unstake)

## Name

`StorageStaking`

## Dependencies

- `srml::system`
- `LockableCurrency`
- `Membership`

## Concepts

  - _

## Design

### Motivation
The storage staking module is the gatekeeper for entry and orderly exit of platform members into and out of the `Storage Provider` role.
Entry is achieved through staking. Storage providers are rewarded periodically with new funds as incentive to maintain operational status. Storage providers can
choose to stop offering their services by un-staking. With sudo privileges designated admins can forcefully remove storage providers from active participation, and possibly punishing by slashing staked funds.

### Tranches
The module is used to configure the storage tranches available in the storage system, and for updating operational parameters associated with each tranche, such as minimum stake and storage capacity.
Tranches are permanent and when they are live must always maintain at minimum number of providers.
The module will prevent providers un-staking if it would result in a tranche having less than the minimum required providers.

### Role Key
Members will utilize a separate private key, which will be associated with their membership, to hold the staked funds for the role. This key, is referred to as the role key and the account holding balance for the role is referred to as the role account.
The role key is also used to sign extrinsics sent by the storage provider software when interacting with the chain.
A role key may only be used by one provider at a time and can only be associated with a single member at any given time.

### Locking Funds
Staking is acheived by locking funds in the role account. The amount locked will be equal to the minimum stake parameter for the tranche the storage provider is participating in. The storage provider may transfer funds from the role account as long as at least the minimum stake remains as balance.
The funds can be used to pay for transactions fees.

### Entering Role
Entering a tranche is a multi-step process:
  1. A member must create a new role keypair and deposit the minimum stake funds into the corresponding role account.
  1. Request entry to a specific tranche using the role account, associating it with their membership account.
  1. Using their member account, approve the request.

### Rewards
At regular intervals defined by tranche parameters, a fixed award is distributed to distributors. The reward amount is a configurable parameter.
The reward will go to the member account, unless the balance in the role account is below the minimum required stake, in which case it
will go to the role account. This allows a staked storage provider to gradually add funds to their role account in order to maintain their commitment of staking a minimum amount.

### Leaving Role
When a storage provider chooses to stop servicing the platform they initiate the process by un-staking. If the platform allows it this begins an un-bonding period after which the funds in the role account will be transferable.
The provider is expected to still provide minimal service (allow other provider to sync any content from them) up until the end of the un-bonding period.

## State
ParameterA: map trancheId => Option<ParameterType>
MinMaxParameterB: map trancheId => Option<(MinType1, MaxType2)> // when values are related?

Idea for improvements:
- The actor account private key is used on a live system, and is considered a 'hot wallet'. We should look at supporting offline wallet
similar to the stash/controller model in validator staking module.
- Limit destination of transfer of funds from actor account to only the member account. This can limit loss of funds in case of key compromise.
