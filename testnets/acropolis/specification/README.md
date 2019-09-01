# Acropolis Testnet Specification

## Table Of Contents

- [Document](#document)
- [Caveat](#caveat)
- [Glossary](#glossary)
- [Overview](#overview)
- [Substrate Runtime](#substrate-runtime)
  - [Runtime Version](#runtime-version)
  - [Native Version](#native-version)
  - [Substrate Version](#substrate-version)
  - [Modules](#modules)
    - [Forum](#forum)
    - [Proposals](#proposals)
    - [CouncilElection](#councilelection)
    - [Council](#council)
    - [Memo](#memo)
    - [Membership](#membership)
    - [Migration](#migration)
    - [Actors](#actors)
    - [DataObjectTypeRegistry](#dataobjecttyperegistry)
    - [DataDirectory](#datadirectory)
    - [DataObjectStorageRegistry](#dataobjectstorageregistry)
    - [DownloadSessions](#downloadsessions)
  - [SRML Modules](#srml-modules)
  - [Runtime API](#runtime-apis)
<!-- - [Communication Protocols](#communication-protocols) -->

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

The Acropolis testnet features the following roles

- **Validator**: Block producer and validator.
- **Council Member:** Council participant, currently only involved in voting on runtime upgrades.
- **Storage Provider**: Does storage and distribution of content, peer provider synchronisation, as well as upload liaison.
- **Forum Moderator**: A single actor role for managing the new on-chain forum.

This release also sees the introduction of a new storage infrastructure based on IPFS for distribution and synchronisation, and IPNS for host resolution. A generalised host resolution module is also introduced as part of making the latter functionality possible, and it will be reused for host resolution across the platform.

A full featured hierarchical topic based, and single moderator, membership forum is also introduced.

## Substrate Runtime

### Runtime Version

- **spec_name:** `joystream-node`
- **impl_name:** `joystream-node`
- **authoring_version:** `5`
- **spec_version:** `4`
- **impl_version:** `0`
- **apis:** `RUNTIME_API_VERSIONS`

### Native Version

- **runtime_version:** [Runtime Version](#runtime-version)
<!-- - **can_author_with:** Default::default() -->

### Substrate Version

`1.0.0`

### Modules

These are the Joystream specific modules, for each module, there is either a link to a module specification document, or no link, for already implemented modules (see [caveat](#caveat)). Standard configurations, for example based on values from the System module, are omitted.

An integrated explanation of the modules constituting the storage system is found [here](runtime/storage-modules.md).

#### Forum

- **Description**: An on-chain discussion forum for members.
- **Specification**: [**READ HERE**](runtime/forum-module.md)
- **Status:** New.
- **Configuration:**
  - _ForumUserRegistry_: Proxy call to `get_profile` on [Membership](#membership) module.

#### Proposals

- **Description**: Proposal system, currently only supports runtime upgrades.
- **Specification**: [**NA**](#)
- **Status:** Unchanged from Athens.
- **Configuration:**
  - _Members_ : [Membership](#membership) module.

#### CouncilElection

- **Description**: Council election manager for council system.
- **Specification**: [**NA**](#)
- **Status:** Unchanged from Athens.
- **Configuration:**
  - _CouncilElected_: [Council](#council) module
  - _Members_: [Membership](#membership) module.

#### Council

- **Description**: Council system.
- **Specification**: [**NA**](#)
- **Status:** Unchanged from Athens.
- **Configuration:**
  - _CouncilTermEnded_: [CouncilElection](#councilelection) module.

#### Memo

- **Description**: Account based public message field.
- **Specification**: [**NA**](#)
- **Status:** Unchanged from Athens.
- **Configuration:** Standard only.

#### Membership

- **Description**: Membership registry.
- **Specification**: [**NA**](#)
- **Status:** Unchanged from Athens.
- **Configuration:**
  - _Roles_: [Actors](#actors) module
  - _MemberId_: `u64`
  - _PaidTermId_: `u64`
  - _SubscriptionId_: `u64`

#### Discovery

- **Description**: Host resolution system for public keys.
- **Specification**: [**READ-HERE**](runtime/discovery-module.md)
- **Status:** New.
- **Configuration:**
  - _Roles_: Shim trait which enables account lookup and by proxying to [Actors](#actors) module. Keeping this brief, since it will change.

#### Migration

- **Description**: Runs migration & initialisation routines after on-chain upgrade from past testnet (Athens).
- **Specification**: [**READ HERE**](runtime/migration-module.md)
- **Status:** Updated to include initialisation of new forum after upgrade.
- **Configuration:** Standard only.

#### Actors

- **Description**: Staking manager for storage system.
- **Specification**: [**READ HERE**](runtime/actors-module.md)
- **Status:** Unchanged from Athens.
- **Configuration:**
  - _Members_: [Membership](#membership) module.
  - _OnActorRemoved_: Proxy call to `remove_account_info` on [Discovery](#discovery).

#### DataObjectTypeRegistry

- **Description**:
- **Specification**: [**READ HERE**](runtime/data-object-type-registry-module.md)
- **Status:** Unchanged from Athens.
- **Configuration:**
  - _DataObjectTypeId_: `u64`

#### DataDirectory

- **Description**:
- **Specification**: [**READ HERE**](runtime/data-directory-module.md)
- **Status:** Unchanged from Athens.
- **Configuration:**
  - _ContentId_: `primitives::H256`
  - _SchemaId_: `u64`
  - _Members_: [Membership](#membership) module.
  - _Roles_: same as `Roles` configuration of [Discovery](#discovery) module.
  - _IsActiveDataObjectType_: [DataObjectTypeRegistry](#dataobjecttyperegistry)

#### DataObjectStorageRegistry

- **Description**:
- **Specification**: [**READ HERE**](runtime/data-object-storage-registry-module.md)
- **Status:** Unchanged from Athens.
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
