Rome Testnet Specification
==========================

## Document

The purpose of this document is to serve as a starting point for the implementation phase of the given testnet. It is only a starting point in the sense that the implementation effort will always depart from the up front specification to some, possibly substantial, extent, but no effort is made to synchronise the specification at any time. Instead, the any such synchronisation would be done in the specification of a future network. The value of such a specification is primarily to establish a relatively precise shared understanding among all contributors to a testnet release.

## Caveat

Parts of the specification are not well harmonised with the rest, in particular the storage system, due to time constraints. Read graciously, this will be resolved later. Also, a substantial number of modules are not yet specced, as already implemented modules from prior testnets are being reused. Full specs will eventually be available as future networks are released where changes are made to these modules. Lastly, a number off communication protocols are not captured in this spec due to time constraints, they will be introduced for later networks.

## Glossary

- **Substrate:** A blockchain SDK, used for this testnet, that abstracts away concerns about consensus and p2p communication.

- **Runtime:** Application specific consensus code written for the Substrate SDK. Includes state and transaction rules specific to the application, but excludes consensus algorithm and p2p networking.

- **Substrate Module:** A substrate runtime is partitioned into functionality integrated units, called modules, which have their own local state, transaction types and events.

- **SRML:** Substrate standard runtime library (SRML), is a set of highly reusable Substrate modules.

- **AURA:** Component of consensus responsible for block authoring.

- **GRANDPA:** Component of consensus responsible for block finality.

<!--
## Format

[Read here to understand the format of this specification.](specification-format.md)

-->

## Overview

### Roles

This testnet includes the following roles

1. **Curator (NEW)**: A worker role, which is open, staked and rewarded, which gives administrative access to the new content directory being launched.
2. **Curator Lead (NEW)**: A worker role which gives responsibility to hire, fire and administrate the current set of curators. Currently set to be occupied by Core team trusted actor in this release, hence not staked or rewarded.
3. **Validator**: Block producer and validator.
4. **Council Member:** Council participant, currently only involved in voting on runtime upgrades.
5. **Storage Provider**: Does storage and distribution of content, peer provider synchronisation, as well as upload liaison.
6. **Forum Moderator**: A single actor role for managing the new on-chain forum.

### Functionality

#### Content Directory

A new model for the organisation and operation of the content directory is introduced. The underlying representation is made into a type safe, versioned, linked structured data object store. A new permission system is introduced to model basic write control that mirrors the sort of objects and relationships we expect to capture. Lastly, the first working group is introduced, for organising the collaboration of the curators for the content directory.

Read the relevant module specifications for more information.

### Working Group Runtime Modules

A set of new modules, as well as some changes to the existing membership module, are introduced, and these lay the foundations for how we see us organising the runtime side of our working groups in the future. A first working group is also deployed, namely the curation working group. These modules are written to be very general purpose, hopefully useful in other runtimes in the future. They are

1. **Minting:** Transferrable capacity constrained token minting.
2. **Recurring Rewards:** Recurring periodic minting of rewards for recipients.
3. **Staking:** Managed staking, unstaking and slashing.
4. **Hiring:** Hiring lifecycle management.

We hope that experience will show us how to factor out a reusable working group module itself in the future.

### Blockchain

A new chain is launched, where we will use a genesis state that transfers memberships, accounts and the forum, from the Acropolis testnet at some announced block height.

We also move to use the Substrate 2.0 framework.

## Substrate Runtime

### Runtime Version

- **spec_name:** `joystream-node`
- **impl_name:** `joystream-node`
- **authoring_version:** `6`
- **spec_version:** `5`
- **impl_version:** `0`
- **apis:** `RUNTIME_API_VERSIONS`

### Native Version

- **runtime_version:** [Runtime Version](#runtime-version)
<!-- - **can_author_with:** Default::default() -->

### Substrate Version

`2.0`

### Modules

These are the Joystream specific modules, for each module, there is either a link to a module specification document, or no link, for already implemented modules (see [caveat](#caveat)). Standard configurations, for example based on values from the System module, are omitted.

An integrated explanation of the modules constituting the storage system is found [here](runtime/storage-modules.md).

#### TokenMint

- **Description**: Transferrable capacity constrained token minting.
- **Specification**: [**READ HERE**](runtime/token-mint-module.md)
- **Status:** New.
- **Configuration:**
  - _TokenMintId_: `u64`

#### RecurringReward

- **Description**: Recurring periodic minting of rewards for recipients.
- **Specification**: [**READ HERE**](runtime/recurring-reward-module.md)
- **Status:** New.
- **Configuration:**
  - _RecipientId_: `u64`
  - _RewardRelationshipId_: `u64`
  - _PayoutStatusHandler_: `()`

#### Staking

- **Description**: Managed staking, unstaking and slashing.
- **Specification**: [**READ HERE**](runtime/staking-module.md)
- **Status:** New.
- **Configuration:**
  - _StakeId_: `u64`
  - _SlashId_: `u64`

#### Hiring

- **Description**: Hiring lifecycle management.
- **Specification**: [**READ HERE**](runtime/hiring-module.md)
- **Status:** New.
- **Configuration:**
  - _OpeningId_: `u64`
  - _ApplicationId_: `u64`

#### VersionedStore

- **Description**: A versioned linked data store.
- **Specification**: [**READ HERE**](runtime/versioned-store.md)
- **Status:** New.
- **Configuration:**
  - _ClassId_: `u64`
  - _EntityId_: `u64`

#### VersionedStorePermissions

- **Description**: A flexible permission system for writing to the versioned store.
- **Specification**: [**READ HERE**](runtime/versioned-store-permissions.md)
- **Status:** New.
- **Configuration:**
  - _GroupMembershipChecker_: Implemented by `ContentDirectoryWorkingGroup`

#### ContentDirectoryWorkingGroup

- **Description**: A working group for the content directory.
- **Specification**: [**READ HERE**](runtime/content-directory-working-group.md)
- **Status:** New.
- **Configuration:**
  - _PermissionGroupId_: `u64`

#### Forum

- **Description**: An on-chain discussion forum for members.
- **Specification**: [**READ HERE**](runtime/forum-module.md)
- **Status:** Unchanged from Acropolis.
- **Configuration:**
  - _ForumUserRegistry_: Proxy call to `get_profile` on [Membership](#membership) module.

#### Proposals

- **Description**: Proposal system, currently only supports runtime upgrades.
- **Specification**: [**NA**](#)
- **Status:** Unchanged from Acropolis.
- **Configuration:**
  - _Members_ : [Membership](#membership) module.

#### CouncilElection

- **Description**: Council election manager for council system.
- **Specification**: [**NA**](#)
- **Status:** Unchanged from Acropolis.
- **Configuration:**
  - _CouncilElected_: [Council](#council) module
  - _Members_: [Membership](#membership) module.

#### Council

- **Description**: Council system.
- **Specification**: [**NA**](#)
- **Status:** Unchanged from Acropolis.
- **Configuration:**
  - _CouncilTermEnded_: [CouncilElection](#councilelection) module.

#### Memo

- **Description**: Account based public message field.
- **Specification**: [**NA**](#)
- **Status:** Unchanged from Acropolis.
- **Configuration:** Standard only.

#### Membership

- **Description**: Membership registry.
- **Specification**: [**NA**](#)
- **Status:** Updated
- **Configuration:**
  - _RoleActorId_: `u64`
  - _MemberId_: `u64`
  - _PaidTermId_: `u64`
  - _SubscriptionId_: `u64`

#### Discovery

- **Description**: Host resolution system for public keys.
- **Specification**: [**READ-HERE**](runtime/discovery-module.md)
- **Status:** Unchanged from Acropolis.
- **Configuration:**
  - _Roles_: Shim trait which enables account lookup and by proxying to [Actors](#actors) module. Keeping this brief, since it will change.

#### Migration

- **Description**: Runs migration & initialisation routines after on-chain upgrade from past testnet (Acropolis).
- **Specification**: [**NA**](#)
- **Status:** Missing.
- **Configuration:** Standard only.

#### Actors

- **Description**: Staking manager for storage system.
- **Specification**: [**READ HERE**](runtime/actors-module.md)
- **Status:** Unchanged from Acropolis.
- **Configuration:**
  - _Members_: [Membership](#membership) module.
  - _OnActorRemoved_: Proxy call to `remove_account_info` on [Discovery](#discovery).

#### DataObjectTypeRegistry

- **Description**:
- **Specification**: [**READ HERE**](runtime/data-object-type-registry-module.md)
- **Status:** Unchanged from Acropolis.
- **Configuration:**
  - _DataObjectTypeId_: `u64`

#### DataDirectory

- **Description**:
- **Specification**: [**READ HERE**](runtime/data-directory-module.md)
- **Status:** Unchanged from Acropolis.
- **Configuration:**
  - _ContentId_: `primitives::H256`
  - _SchemaId_: `u64`
  - _Members_: [Membership](#membership) module.
  - _Roles_: same as `Roles` configuration of [Discovery](#discovery) module.
  - _IsActiveDataObjectType_: [DataObjectTypeRegistry](#dataobjecttyperegistry)

#### DataObjectStorageRegistry

- **Description**:
- **Specification**: [**READ HERE**](runtime/data-object-storage-registry-module.md)
- **Status:** Unchanged from Acropolis.
- **Configuration:**
  - _DataObjectStorageRelationshipId_: `u64`
  - _Members_: [Membership](#membership) module.
  - _Roles_: same as `Roles` configuration of [Discovery](#discovery) module.
  - _ContentIdExists_: [DataDirectory](#datadirectory)

#### DownloadSessions

- **Description**: Manages download sessions in storage system.
- **Specification**: [**NA**](#)
- **Status:** Not used.
- **Configuration:**
  - _DownloadSessionId_: `u64`
  - _ContentHasStorage_: [DataObjectStorageRegistry](#dataobjectstorageregistry)

### SRML Modules

These modules are part of the runtime, but are already implemented part of the SRML.

- **System**: The system module provides low-level access to core types and cross-cutting utilities.
- **Timestamp**: The Timestamp module provides functionality to get and set the on-chain time.
- **Consensus**: The consensus module manages the authority set for the native code.
- **Aura**: The Aura module extends Aura consensus by managing offline reporting.
- **Indices**: An index is a short form of an address. This module handles allocation of indices for a newly created accounts.
- **Balances**: The balances module provides functionality for handling accounts and balances.
- **Session**: Is told the validators and allows them to manage their session keys for the consensus module.
- **Staking**: The staking module is the means by which a set of network maintainers (known as _authorities_ in some contexts and _validators_ in others) are chosen based upon those who voluntarily place funds under deposit.
- **Sudo**: The sudo module allows for a single account (called the "sudo key") to execute dispatchable functions that require a `Root` call or designate a new account to replace them as the sudo key.
- **Grandpa**: This manages the GRANDPA authority set ready for the native code.

### Runtime APIs

The runtime implements the following set of APIs.

#### [Core](https://crates.parity.io/substrate_client/runtime_api/trait.Core.html)

- **version**: Return [Runtime Version](#runtime-version)
- **execute_block**: Executive module `execute_block` routine.
- **initialize_block**: Executive module `initialize_block` routine.
- **authorities**: Executive module `apply_extrinsic` routine.

#### [Metadata](https://crates.parity.io/substrate_client/runtime_api/trait.Metadata.html)

- **metadata**: Runtime `metadata` routine.

#### [BlockBuilder](https://crates.parity.io/substrate_client/block_builder/api/trait.BlockBuilder.html)

- **apply_extrinsic**: Executive module `apply_extrinsic` routine.
- **finalize_block**: Executive module `finalize_block` routine.
- **inherent_extrinsics**: `create_extrinsics` routine on inherent data.
- **check_inherents**: Inherent `check_extrinsics` routine on block.
- **random_seed**: System module `random_seed` routine.

#### [TaggedTransactionQueue](https://crates.parity.io/substrate_client/runtime_api/trait.TaggedTransactionQueue.html)

- **validate_transaction**: Executive module `validate_transaction` routine.

#### [OffchainWorkerApi](https://crates.parity.io/substrate_offchain/trait.OffchainWorkerApi.html)

- **offchain_worker**: Executive module `offchain_worker` routine.

#### [GrandpaApi](https://crates.parity.io/substrate_finality_grandpa_primitives/trait.GrandpaApi.html)

- **grandpa_pending_change**, **grandpa_forced_change**, **grandpa_authorities**: Default.

#### [AuraApi](https://crates.parity.io/substrate_consensus_aura/trait.AuraApi.html)

- **slot_duration**: Aura module `slot_duration` routine.

#### [AuthoritiesApi](#)

- **authorities**: Consensus module `authorities` routine.

<!--

## Communication Protocols

**TBD.**

-->
