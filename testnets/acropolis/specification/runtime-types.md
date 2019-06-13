# Types

These are all public non-native Rust types that are part of the runtime. They are public in the sense that they are parameters exposed in the runtime metadata, due to being part of transactions, events or storage. Any other types that may appear in a particular implementation, for example generic types and traits/interfaces related to software engineering abstractions, are not included.

something about type unoacking...?

## Vec

[parity_codec::alloc::vec<T>]()

## ensure_signed

[srml_system::ensure_signed](https://crates.parity.io/srml_system/fn.ensure_signed.html)

## MemberId

u64

## PaidTermId

u64

## AccountId

**cant find!**

## BlockNumber

u64

## Moment

u64

## SubscriptionId

u64

## PaidMembershipTerms

**struct**

| Field                                 | Type                              |
| :------------------------------------ |:----------------------------------|
| `id`                                  | [`PaidTermId`](#PaidTermId)       |
| `fee`                                 | `BalanceOf<T>`                    |
| `text`                                | [`Vec<u8>`](#Vec)                 |

## CheckedUserInfo

**struct**

| Field                                 | Type                              |
| :------------------------------------ |:----------------------------------|
| `handle`                              | [`Vec`](#Vec)&lt;`u8`&gt;          |
| `avatar_uri`                          | [`Vec`](#Vec)&lt;`u8`&gt;                 |
| `about`                               | [`Vec`](#Vec)&lt;`u8`&gt;                 |

## EntryMethod

**enum**

- `Paid`([`PaidTermId`](#PaidTermId))
- `Screening`([`AccountId`](#AccountId))

## Profile

**struct**

| Field                                 | Type                              |
| :------------------------------------ |:----------------------------------|
| `id`                                  | [`MemberId`](#MemberId)           |
| `handle`                              | [`Vec`](#Vec)&lt;`u8`&gt;                 |
| `avatar_uri`                          | [`Vec`](#Vec)&lt;`u8`&gt;                 |
| `about`                               | [`Vec`](#Vec)&lt;`u8`&gt;                 |
| `registered_at_block`                 | [`BlockNumber`](#BlockNumber)     |
| `registered_at_time`                  | [`Moment`](#Moment)                       |
| `entry`                               | [`EntryMethod`](#EntryMethod)                     |
| `suspended`                           | `bool`                            |
| `subscription`                        | [`Option`](#option)&lt;[`SubscriptionId`](#SubscriptionId)&gt; |

## UserInfo

**struct**

| Field                                  | Type                          |
| :------------------------------------ |:------------------------------|
| `handle`                              | `Option<Vec<u8>>`             |
| `avatar_uri`                          | `Option<Vec<u8>>`             |
| `about`                               | `Option<Vec<u8>>`             |
