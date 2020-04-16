# Discovery Module

## Table of Contents

- [Design](#design)
- [Dependencies](#dependencies)
- [Name](#name)
- [Concepts](#concepts)
- [State](#state)
- [Events](#events)
- [Dispatchable Methods](#dispatchable-methods)
  - [set_account_info_lifetime](#set_account_info_lifetime)
  - [set_boostrap_endpoints](#set_bootstrap_endpoints)
  - [set_ipns_peer_id](#set_ipns_peer_id)
  - [unset_ipns_peer_id](#unset_ipns_peer_id)
- [Other](#other)

## Design

### Motivation

Accessing most services requires resolving a host corresponding the public key of some service provider. This module describes the on-chain component of making this possible.

### Basic Functionality

The Actors module provides a way for member accounts to stake for becoming an
actor in the Joystream network, generating a new actor key along the way. This
actor key then is used to fulfil the role on behalf of the member.

Due to this structure, discovering a service really means discovering which
service-specific endpoint information is associated with an actor key.

The *discovery workflow*, then, is to retrieve some structured data by providing
an actor key, and being able to verify the data has been created by the actor
with the help of a cryptographic signature.

As such, the *discovery workflow* is and should be largely independent on
how discovery is performed. The *discovery workflow* is almost entirely off-chain,
but bootstraps from on-chain information.

The *publishing workflow* does require actors to understand how discovery is
performed. This current version uses [IPNS](https://docs.ipfs.io/guides/concepts/ipns/)
as a building block for discovery. The *publishing workflow* includes modifying
on-chain data, albeit relatively rarely.

<!-- This document is concerned only with *on-chain* operations. For the full,
high-level documentation see [TODO](#TODO). -->

## Name

`Discovery`

## Dependencies

None.

## Concepts

- `BootstrapEndpoints`: Identifies a URL prefix for querying the discovery system.

- `IPNSPeerId`: Identifies a peer on the IPFS network, of which IPNS is part.

## State

- `bootstrapEndpoints`: A vector of bootstrap endpoints maintained by sudo.

- `PeerIdByAccount`: A map of Account IDs to `IPNSPeerId`. The map value also
  contains lifetime parameters in order to gracefully remove outdated entries.

- `AccountInfoLifetime`: A time-to-live for entries in the `PeerIdByAccount` table.
  Configured from the genesis block.

## Events

- `AccountInfoUpdated`: A mapping from Account ID to `IPNSPeerId` was created or
  updated. Receiving this event allows client implementations to discard all data
  currently cached for the associated Account ID.

## Dispatchable Methods

### `set_account_info_lifetime`

#### Payload

- implied root origin
- `lifetime`: a new lifetime value.

#### Description

Allow root to set the lifetime for entries in the `PeerIdByAccount` mapping.
Note that setting this value does not modify
the lifetime of already existing entries, and is only applied to newly
created or updated entries.

#### Errors

- Not root origin
- Zero or negative lifetime.

#### Side effect(s)

`AccountInfoLifetime` is updated.

#### Event(s)

None.

### `set_bootstrap_endpoints`

#### Payload

- implied root origin
- `bootstrapEndpoints`: a vector of URL prefixes

#### Description

Allow root to set the current bootstrap endpoints. Note that the number of endpoints
is never expected to grow large, as new nodes are discovered from this set of
bootstrap endpoints - therefore always setting the entire vector is sufficient.

#### Errors

- Not root origin
- Empty bootstrap endpoint vector
- Empty vector entries

#### Side effect(s)

`bootstrapEndpoints` is updated.

#### Event(s)

None.

### `set_ipns_peer_id`

#### Payload

- `origin`: Actor key
- `peerId`: The IPNS peer ID.

#### Description

Allows actors to set their associated IPNS peer ID for discovery.

#### Errors

- Not actor origin
- Empty peer ID

#### Side effect(s)

`peerIdByAccount` is updated to contain the actor key as the key, and the peer
ID as the value.

#### Event(s)

- `AccountInfoUpdated`

### `unset_ipns_peer_id`

#### Payload

- `origin`: Actor key

#### Description

Allows well-behaving actors to clear their IPNS peer ID, e.g. when shutting down.

#### Errors

- Not actor origin
- No error is raised if the actor is not registered; the function simply does
  nothing.

#### Side effect(s)

`peerIdByAccount` is updated to remove any value associated with the actor key.

#### Event(s)

- `AccountInfoUpdated`

## Other

<!--  bad format, underspecified , change later to use on_initlize -->

Every block, outdated entries are removed and an `AccountInfoUpdated` event is
raised for each removed entry.
