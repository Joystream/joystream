# WIP: Rome Testnet Specification

## Table Of Content

- [Purpose](#purpose)
- [Decisions](#decisions)
- [Work In Progress](#work-in-progress)
- [Glossary](#glossary)
- [Notation](#notation)
- [Rome](#rome)
 - [Overview](#overview)
 - [Roles](#roles)
 - [Substrate Runtime](#substrate-runtime)

## Document Purpose

The life time and purpose of this docuemnt is separated into two distinct phases,

- Enable greater
- xxx
- audience
- use case
- scope
- frist ry, tierative arrive at standard, extract generalised template for joystrema and other Susbtrate teams.

## How to read this specification

Given the descrbied purpose of this document, the style of specification admits to the following constraints

- S

Take Substrate for granted, and SRML momdules, dont explicitly described.


<explain how you wille xplain different parts, what each part of the explanation does>

### Substrate

We are speicfying what:

-  explain how to intereprt speciciation, so we understand `map`, build et.
- xxxx

what bout built in stuff, like types `origin`, and functions, like `ensure_signed`.

what about block level callback?

variables
 - **origin** : instance variable for signed
 - **who**: instance variable when is signed


#### Extrinsics



##### Errors

All errors have their own precondition. The errors are listed in the order which corresponds to what order they would be invoked if _multiple_ error conditions were satisified simultanously. If this cannot be expressed as a single linear list, the section must reflect this informaiton in some other way in a fully unambigous manner.

Error scenarios, which thus have no side effects, and no events. The section title is used as error message. The full precondition for each case is not only the listed condition in the same row, but also the combined failure of all listed preconditions of prior rows.

##### Side effects

Assume that all error preconditions are simultnaously false, denoted by predicate `NO_ERROR`.

##### Terminiantion
Important to notice that its very deeply specified, where even the order of error triggering in scenarios with mulitple simultanous errors, is commited to up front, compared to a loser standard of saying that, if you have one of these problems, you will get at least one fo these errors,w hich would drop order.

- **pre-condition:** first order predicate in the runtime state and the transaction paramters which must hold _exactly_ for transaction to be accepted. e.g. that proper person has isgned?
- **post-condition**: first order predicate in the runtime state and the transaction parameters which must hold _exactly_ when the transaction is accepted. The value of state variable `X` _after_ a transaction is handled, is denoted by `X'`. Hence, as an example, the condition that an integer variable `foo` has been incremented after a transaction is captured by the following predicate: `foo' == foo + 1`. Notice that blockchain state, like event logs ands o on, are not part of this, hence they are not in post-condition. (perhaps change?). It is OK to use separately defined functions to define this predicate, but these cannot have side effects.

Notice that no _iomplementaiton_ is ever provided, only how transaction generate new state constraints. This allows us to avoid any implementation specific types, and also allows all modules to be defiend in terms of what actual types are instantioned in the parametric `T::` trait, rather than introduce lots of trait abstractions.


cponditionals are basically valid Rust code.

side ffects are pure, no

functions used can only be pure, i.e. only depend on explicit parameters, and also have 0 side effcts.


Always read stroage variables of any module through type, not varible name.

##### REsult

Here, all values are either before or after execution, using same tag symbol.

##### Events

Same as result

### Protocols

<here we write stuff about how to read and understand our protocols>


## Glossary

- **Substrate:** A blockchain SDK
- **Runtime:** Application specific consensus code written for the Substrate SDK. Includes state and transaction rules specific to the application, but excludes consensus algorithm and p2p networking.
- **Substrate Module:** A substrate rutnime is partitoned into state and corresponding transaction types .. <= bad explanation.
- **SRML:** Substrate standard runtime library (srml), is a set of highly reusable Substrate modules which come with the
- **GRANDPA:** Consensus algorthm used.

## Notation

- Code is written in Rust.
- When describing state variables, the standard storage encoding,decoding offered by Substrate `decl_storage` is used, in particular
 - xx
 - xx
 - xx
- In some cases transaction logic may be written in psuedocode, or just free form, over fully valid Rust.

## Specification

### Overview

something high level?

### Substrate Runtime

#### WIP: API

put lots of stuff here about what is in impl_runtime_apis! {}?

#### Substrate Version

`1.0.0`

#### [Types](#types)

#### functions

like snure signed_

https://crates.parity.io/srml_system/fn.ensure_signed.html

#### Modules

These are the Joystream specific modules, and thus the only ones that actually need to have implementation done or altered.

- [**Proposals**](proposal-module.md)
- [**CouncilElection**](council-election-module.md)
- [**Council**](council-module.md)
- [**Memo**](memo-module.md)
- [**Members**](members-module.md)
  -  MemberId : String
- [**Migration**](migration-module.md)
- [**Actors**](actors-module.md)
- [**DataObjectTypeRegistry**](data-object-type-registry-module.md)
- [**DataDirectory**](data-directory-module.md)
- [**DataObjectStorageRegistry**](data-object-storage-registry-module.md)
- [**DownloadSessions**](download-sessions-module.md)

##### SRML

These modules are part of the runtime, but are already implemented part of the SRML.

- [**System**](system-module.md)
- [**Timestamp**](timestamp-module.md)
- [**Consensus**](consensus-module.md)
- [**Aura**](aura-module.md)
- [**Indices**](indices-module.md)
- [**Balances**](balance-module.md)
- [**Session**](session-module.md)
- [**Staking**](proposal-module.md)
- [**Sudo**](proposal-module.md)
- [**Grandpa**](proposal-module.md)

#### MISSING STUFF

#### Migrations

list of what other runtimes one will introduce a migration from....

"HOW TO DESCRIBE A MIGRATION"

### Protocols

xxxx

#### Roles

- role 1
- role 2

#### RPC

xxxx

#### Peer To Peer

##### Messages

###### Join

xxxxx

###### Leave

xxx

###### Advertise

xxxxx


## References

1. xxxx
