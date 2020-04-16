# Storage Staking Module

## Table Of Contents

- [Name](#name)
- [Dependencies](#dependencies)
- [Design](#design)
- [Concepts](#concepts)
- [State](#state)
- [Events](#events)
- [Dispatchable Methods](#dispatchable-methods)
  - [create_tranche](#create_tranche)
  - [update_tranche_parameters](#update_tranche_parameters)
  - [request_entry](#request_entry)
  - [stake](#stake)
  - [unstake](#unstake)
  - [eject_provider](#eject_provider)

## Name

`Actors`

## Dependencies

- `srml::system`
- `LockableCurrency`
- `Membership`

## Design

### Motivation
The storage staking module is the gatekeeper for entry and orderly exit of platform members into and out of the `Storage Provider` role.
Entry is achieved through staking funds. Storage providers are rewarded periodically with new funds as incentive to maintain operational status. Storage providers can choose to stop offering their services by un-staking. System sudo account can forcefully remove storage providers from active participation, and optionally punish provider by slashing staked funds.

### Tranches
The module is used to configure the storage tranches available in the storage system, and for updating operational parameters associated with each tranche, such as minimum stake and storage capacity.
Tranches must always aim to maintain a minimum number of providers `MinSlots`.
The module will prevent un-staking when it would result in `MinSlots` no longer being filled. Once tranches are created they cannot be destroyed, however their operational parameters can be adjusted. If at anytime the maximum number of slots `MaxSlots` for a tranche is update to be less than the number of active providers `N` in the tranche, no new providers can be allowed to join until the number drops below `MaxSlots` again.

### Role Account
Members will utilize a separate account, referred to as the role account, which will be associated with their membership, to hold the staked funds. This corresponding key, is referred to as the role key.
The role key is also used to sign a extrinsics sent by the storage provider software when interacting with the chain.
A role account may only only be associated with a single member at any given time.
A role account can only be used to stake into a single tranche at any given time.

### Locking Funds
Staking is achieved by locking funds in the role account. The amount locked will be equal to the `StakeAmount` parameter for the tranche the storage provider is participating in. The storage provider may transfer funds out of the role account only that are in excess of the locked amount.
For convenience, the locked funds can still be used to pay for transactions fees. This means the balance may fall below the locked amount.

### Entering Role
Entering a tranche is a multi-step process:
  1. A member must generate a new keypair and deposit at least the StakeAmount funds into the corresponding account, plus the request entry fee for the tranche they plus some extra to cover transaction fees.
  1. Request entry into a specific tranche using the role account, associating it with their membership account.
  1. Using their member account, approve the request.

There must be an available slot in a tranche to enter. All providers stake the same amount of funds, this means it's not possible for a new storage provider to displace an existing provider.

### Rewards
At regular intervals defined by tranche parameters, a fixed award is distributed to distributors. The reward amount is a configurable parameter.
The reward will go to the member account, unless the balance in the role account is below the `StakeAmount`, in which case it
will go to the role account. This forces storage providers to gradually add funds to their role account in order to maintain their commitment of staking a certain amount.

### Leaving Role
When a storage provider decides to leave a tranche, they can initiate the process by un-staking. If the platform allows it, the provider goes immediately out of service.
An un-bonding period follows after which the funds in the role account become transferable.


## Concepts
  - `StorageProviderInfo`: Represents when the provider joined a tranche, the member identifier they are associated with, and their role account identifier.
  - `EntryRequest`: Represents intent to join a specific tranche, with a certain role account and member identity. Requests have a lifetime `RequestLifeTime`. If not approved before expiry they are cleared from state.

## State

- `TrancheCount`: Number of tranches created.
- `RoleAccountIds`: List of currently staked role accounts.
- `StorageProviderInfoByRoleAccount`: Map of RoleAccount to StorageProviderInfo
- `RoleAccountsByTrancheId`: Map of tranche identifier to list of role accounts
- `RoleAccountIdsByMemberId`: Map of member identifier to list of role accounts
- `EntryRequests`: List of pending requests to enter storage provider role
- `RequestLifeTime`: Duration of time before a role entry request expires
- `TrancheIdsByDataObjectTypeId`: Mapping of tranches available for a `DataObjectType`

Tranche Operational Parameters

- `StakeAmount`: Map of tranche identifier to Optional Stake Amount
- `MinSlots`: Map of tranche identifier to Optional Minimum Number of slots
- `MaxSlots`: Map of tranche identifier to Optional Maximum Number of slots
- `FixedReward`: Map of tranche identifier to Optional Reward Amount
- `FixedRewardPeriod`: Map of tranche identifier to Optional BlockNumber
- `UnbondingPeriod`: Map of tranche identifier to Optional BlockNumber
- `EntryRequestFee`: Map of tranche identifier to Optional Fee Amount
- `DataObjectTypeId`: The `DataObjectType` for which this tranche is created.

Tranche identifier starts at 0. So if TrancheCount = 4, the identifiers of the created tranches are 0, 1, 2, and 3.

**Note:** Currently, tranches are not limited in size. When good tooling for
monitoring and creating tranches is available, the intend is to limit tranches
in size, and add new ones before storage space runs out.

## Events
Each event has payload as sublist

  - `TrancheCreated`: A new tranche was created
    - Tranche identifier
  - `TrancheUpdated`: Some tranche parameters were changed
    - Tranche identifier
  - `EntryRequested`: A new role key
    - Role account identifier
    - Member identifier
    - Tranche Identifier
  - `ProviderJoined`: A new storage provider joined a tranche
    - Tranche identifier
    - Role account identifier
  - `ProviderLeft`: A storage provider un-staked
    - Tranche identifier
    - Role account identifier
  - `ProviderEjected`: A storage provider was forcefully removed
    - Tranche Identifier
    - Role account


## Dispatchable Methods

### create_tranche

#### Payload
- `origin`: call origin
- `parameters`: List of operational parameters
  - `stake_amount`
  - `min_providers`
  - `max_providers`
  - `fixed_reward`
  - `fixed_reward_period`
  - `unbonding_period`
  - `entry_request_fee`
  - `data_object_type_id`


#### Description
Creates a new tranche with provided parameters.

#### Errors
  - Bad signature
  - origin is not Root
  - StakeAmount == 0
  - MaxSlots == 0
  - MinSlots == 0 unless we want [temporary tranches](#temporary tranches)
  - MinSlots > MaxSlots
  - No matching `DataObjectType`.

#### Side effects
  - `TrancheCount` increased by one
  - Tranche operational parameter values set in each corresponding parameter map
#### Event(s)
  - TrancheCreated
    - TrancheCount - 1

### update_tranche_parameters
#### Payload
  - `origin`
  - Tranche Identifier
  - List of tranche operational parameters
    - `stake_amount`
    - `min_providers`
    - `max_providers`
    - `fixed_reward`
    - `fixed_reward_period`
    - `unbonding_period`
    - `entry_request_fee`

#### Description
Change tranche operational parameters

#### Errors
  - Bad signature
  - origin is not Root
  - Tranche Identifier < TrancheCount
  - StakeAmount == 0
  - MaxProviders == 0
  - MinSlots == 0 unless we want [temporary tranches](#temporary tranches)
  - MinSlots > MaxSlots

#### Side effects
  - Operational parameter values updated

#### Event(s)
  - `TrancheUpdated`

### request_entry
#### Payload
 - `origin`: role account
 - Tranche identifier
 - membership identifier

#### Description
Member creating request to join a tranche

#### Errors
  - Bad signature
  - origin is a member account
  - origin already in a tranche
  - origin already made a request
  - tranche identifier >= TrancheCount (invalid tranche)
  - not enough balance in role account to pay entry request fee
  - membership identifier invalid
  - no available slots in tranche
  - origin still un-bonding

#### Side effects
  - Entry request fee burned from role account balance
  - If no errors
    - `EntryRequests` List has new request

#### Event(s)
  - `EntryRequested`

### stake
#### Payload
  - origin: member account
  - tranche identifier
  - role account

#### Description
Member approves a pending request to stake and join a tranche using the role account.

#### Errors
  - Bad signature
  - No matching request found
  - no available slot in tranche (availability may have changed since request was made)
  - not enough balance in role account to stake

#### Side effects
  - Stake amount locked in role account
  - Role account added to `RoleAccountIds`
  - `StorageProviderInfoByRoleAccount` map
  - Role account added to list for tranche in `RoleAccountsByTrancheId`
  - Role account added to member mapping in `RoleAccountIdsByMemberId`
  - Request removed from `EntryRequests`

#### Events
  - `ProviderJoined`
    - role account

### unstake
#### Payload
  - origin
  - role account

#### Description
Member chooses to un-stake and stop providing service.

#### Errors
  - Bad signature
  - origin is not a member associated with role account
  - role account is not staked provider account
  - too few slots filled if un-staking allowed

#### Side effects
  - Balance lock updated on role account, so funds become liquid after UnbondingPeriod
  - Role account removed from `RoleAccountsByTrancheId`, `RoleAccounts`, `RoleAccountIdsByMemberId`, `StorageProviderInfoByRoleAccount`

### eject_provider

#### Payload
  - origin: call Origin
  - role_account
  - punish: bool

#### Description
Forcefully remove a storage provider from service. And optionally slash staked balance.

#### Errors
  - Bad signature
  - origin is not Root
  - role_account is not an active storage provider

### Side effects
  - Balance lock updated on role account, so funds become liquid after UnbondingPeriod
  - Remove role account from `RoleAccountsByTrancheId`, `RoleAccounts`, `RoleAccountIdsByMemberId`, `StorageProviderInfoByRoleAccount`
  - If `punish` is true, slash stake amount from role account

## On Initialize
Clear expired entry requests.

## On Finalize
Make reward payouts.

#### Temporary Tranches
A tranche that has MinSlots = 0, where content is not guaranteed to persist. Suitable for short lived data?

#### Idea for improvements:
- The actor account private key is used on a live system, and is considered a 'hot wallet'. We should look at supporting cold wallet similar to the stash/controller model in validator staking module.
- Limit destination of transfer of funds from actor account to only the member account. This can limit loss of funds in the event of a key compromise.
- Have a List of banned member id. Members can be optionally banned when ejected.
