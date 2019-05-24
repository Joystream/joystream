# Storage Role Staking

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

`StorageStaking`

## Dependencies

- `srml::system`
- `LockableCurrency`
- `Membership`

## Design

### Motivation
The storage staking module is the gatekeeper for entry and orderly exit of platform members into and out of the `Storage Provider` role.
Entry is achieved through staking. Storage providers are rewarded periodically with new funds as incentive to maintain operational status. Storage providers can
choose to stop offering their services by un-staking. With sudo privileges designated admins can forcefully remove storage providers from active participation, and possibly punishing by slashing staked funds.

### Tranches
The module is used to configure the storage tranches available in the storage system, and for updating operational parameters associated with each tranche, such as minimum stake and storage capacity.
Tranches must always aim to maintain a minimum number of providers.
The module will prevent providers un-staking if it would result in a tranche having less than the minimum required providers. A tranche configured with zero as the minimum providers can be considered a volatile tranche without guarantees that of service.

### Role Account
Members will utilize a separate private key, which will be associated with their membership, to hold the staked funds for the role. This key, is referred to as the role key and the account holding balance for the role is referred to as the role account.
The role key is also used to sign an extrinsic sent by the storage provider software when interacting with the chain.
A role key may only only be associated with a single member at any given time.
A role key can only be used to stake into a single tranche at any given time.

### Locking Funds
Staking is achieved by locking funds in the role account. The amount locked will be equal to the stake amount parameter for the tranche the storage provider is participating in. The storage provider may transfer funds out of the role account only that are in excess of the locked amount.
The funds can still be used to pay for transactions fees.

### Entering Role
Entering a tranche is a multi-step process:
  1. A member must generate a new keypair and deposit the minimum stake funds into the corresponding account, plus the request entry fee for the tranche they wish to join.
  1. Request entry to a specific tranche using the role account, associating it with their membership account.
  1. Using their member account, approve the request.

There must be an available slot in a tranche to enter. All providers stake the same amount, and there is no preference given for staking more. This means new storage providers cannot displace existing providers.

### Rewards
At regular intervals defined by tranche parameters, a fixed award is distributed to distributors. The reward amount is a configurable parameter.
The reward will go to the member account, unless the balance in the role account is below the minimum required stake, in which case it
will go to the role account. This allows a staked storage provider to gradually add funds to their role account in order to maintain their commitment of staking a certain amount.

### Leaving Role
When a storage provider chooses to stop servicing the platform they initiate the process by un-staking. If the platform allows it this begins an un-bonding period after which the funds in the role account will be transferable.
The provider is expected to still provide minimal service (allow other provider to sync any content from them) up until the end of the un-bonding period.

## Concepts
  - `StorageProviderInfo`: Information on storage provider. Represents when the provider joined a tranche, the member identifier they are associated with, and their role account.
  - `EntryRequest`: Represents intent to join a tranche, with a certain role account and member identity. Requests have to be approved by the member account by invoking the `stake` dispatchable method to tie the member identity to the storage provider. Requests expire after `RequestLifeTime`.

## State
Tranche identifier starts at 0.

- `TrancheCount`: Number of tranches created.
- `RoleAccountIds`: List of currently staked role accounts.
- `StorageProviderInfoByRoleAccount`: Map of RoleAccount to StorageProviderInfo
- `RoleAccountsByTrancheId`: Map of tranche identifier to list of role accounts
- `RoleAccountIdsByMemberId`: Map of member identifier to list of role accounts
- `EntryRequests`: List of pending requests to enter storage provider role
- `RequestLifeTime`: Duration of time before a role entry request expires

Tranche Operational Parameters

- `StakeAmount`: Map of tranche identifier to Optional Stake Amount
- `MinSlots`: Map of tranche identifier to Optional Minimum Number of slots
- `MaxSlots`: Map of tranche identifier to Optional Maximum Number of slots
- `FixedReward`: Map of tranche identifier to Optional Reward Amount
- `FixedRewardPeriod`: Map of tranche identifier to Optional BlockNumber
- `UnbondingPeriod`: Map of tranche identifier to Optional BlockNumber
- `EntryRequestFee`: Map of tranche identifier to Optional Fee Amount

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


#### Description
Creates a new tranche with provided parameters.

#### Errors
  - Bad signature
  - origin is not Root
  - StakeAmount == 0
  - MaxSlots == 0
  - MinSlots == 0 unless we want [temporary tranches](#temporary tranches)
  - MinSlots > MaxSlots

#### Side effects
  - Increase `TrancheCount` by one
  - Set tranche operational parameter values in each corresponding parameter map
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
  - Update operational parameter values

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
  - origin still unbonding

#### Side effects
  - Add new entry request to `EntryRequests`
  - Burn entry request fee from role account balance
#### Events
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
  - Lock stake amount in role account
  - add role account to `RoleAccountIds`
  - add mapping in `StorageProviderInfoByRoleAccount`
  - Add role account to list for tranche in `RoleAccountsByTrancheId`
  - Add role account to member mapping in `RoleAccountIdsByMemberId`
  - Remove request from `EntryRequests`

#### Events
  - `ProviderJoined`
    - role account

### unstake
#### Payload
  - origin
  - role account

#### Description
Member chooses to unstake and stop providing service.

#### Errors
  - Bad signature
  - origin is not a member associated with role account
  - role account is not staked provider account
  - too few slots filled if unstaking allowed

#### Side effects
  - Update balance lock on role account to become liquid after UnbondingPeriod
  - Remove role account from `RoleAccountsByTrancheId`, `RoleAccounts`, `RoleAccountIdsByMemberId`, `StorageProviderInfoByRoleAccount`

### eject_provider

#### Payload
  - origin: call Origin
  - role_account

#### Description
Forcefully remove a storage provider from service.

#### Errors
  - Bad signature
  - origin is not Root
  - role_account is not an active storage provider

### Side effects
  - Update balance lock on role account to become liquid after UnbondingPeriod
  - Remove role account from `RoleAccountsByTrancheId`, `RoleAccounts`, `RoleAccountIdsByMemberId`, `StorageProviderInfoByRoleAccount`

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
