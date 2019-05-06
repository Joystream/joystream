
# Members Module

## Table Of Content

- [Overview](#overview)
- [Constants](#constants)
- [Trait Configuration](#trait-configuration)
  - [Trait Name](#trait-name)
  - [Base Traits](#base-traits)
  - [Associated Types](#associated-types)
    - [Event](#Event)
    - [MemberId](#MemberId)
    - [PaidTermId](#PaidTermId)
    - [SubscriptionId](#SubscriptionId)
    - [Roles](#Roles)
- [Public Types](#public-types)
  - [EntryMethod](#EntryMethod)
  - [Profile](#Profile)
  - [PaidMembershipTerms](#PaidMembershipTerms)
  - [UserInfo](#UserInfo)
- [Storage](#storage)
- [Invariants](#invariants)
- [Events](#events)
- [Dispatchable Methods](#dispatchable-methods)
  - [buy_membership](#`buy_membership`)
  - [change_member_about_text](#`change_member_about_text`)
  - [change_member_avatar](#`change_member_avatar`)
  - [change_member_handle](#`change_member_handle`)
  - [update_profile](#`update_profile`)
  - [add_screened_member](#`add_screened_member`)
  - [set_screening_authority](#`set_screening_authority`)
- [Non-dispatchable Methods](#non-dispatchable-methods)
  - [is_active_member](#`is_active_member`)
  - [lookup_member_id](#`lookup_member_id`)
  - [lookup_account_by_member_id](#`lookup_account_by_member_id`)

## Overview

Manages the set of current members, their profile, status.

## Module Name

`Membership`

## Constants

These are constants that are only part of making this document legible, they are not part of the public interface of the module.

```Rust
const DEFAULT_FIRST_MEMBER_ID: u64 = 1;
const FIRST_PAID_TERMS_ID: u64 = 1;
const DEFAULT_PAID_TERM_ID: u64 = 0;
const DEFAULT_PAID_TERM_FEE: u64 = 100;
const DEFAULT_PAID_TERM_TEXT: &str = "Default Paid Term TOS...";
const DEFAULT_MIN_HANDLE_LENGTH: u32 = 5;
const DEFAULT_MAX_HANDLE_LENGTH: u32 = 40;
const DEFAULT_MAX_AVATAR_URI_LENGTH: u32 = 1024;
const DEFAULT_MAX_ABOUT_TEXT_LENGTH: u32 = 2048;
```

## Trait Configuration

### Trait Name

`Trait`

### Base Traits

These are the traits which provide the interfaces to services external to this module, such as peer modules which must run in the same runtime for example.

- **system::Trait**
- **timestamp::Trait**
- [**GovernanceCurrency**](shared-types.md#GovernanceCurrency)

### Associated Types

#### Event

Event type. ???

#### MemberId

Member identifier type.

####  PaidTermId

Paid term identifier type.

#### SubscriptionId

Subscription identifier type.

#### Roles

Roles module type. <what do we link to here!?>

## Public Types

These are the public type of the module, that is they are used in the storage system and in signature of public methods. All other types are omitted.

### EntryMethod

```Rust
pub enum EntryMethod<T: Trait> {
    Paid(T::PaidTermId),
    Screening(T::AccountId),
}
```

### Profile

```Rust
pub struct Profile<T: Trait> {
    pub id: T::MemberId,
    pub handle: Vec<u8>,
    pub avatar_uri: Vec<u8>,
    pub about: Vec<u8>,
    pub registered_at_block: T::BlockNumber,
    pub registered_at_time: T::Moment,
    pub entry: EntryMethod<T>,
    pub suspended: bool,
    pub subscription: Option<T::SubscriptionId>,
}
```

### PaidMembershipTerms

```Rust
pub struct PaidMembershipTerms<T: Trait> {
    /// Unique identifier - the term id
    pub id: T::PaidTermId,
    /// Quantity of native tokens which must be provably burned
    pub fee: BalanceOf<T>,
    /// String of capped length describing human readable conditions which are being agreed upon
    pub text: Vec<u8>,
}
```

### UserInfo

```Rust
pub struct UserInfo {
    pub handle: Option<Vec<u8>>,
    pub avatar_uri: Option<Vec<u8>>,
    pub about: Option<Vec<u8>>,
}
```

## Storage

The following is the payload used with `decl_storage`.

```Rust
/// MemberId's start at this value
pub FirstMemberId get(first_member_id) config(first_member_id): T::MemberId = T::MemberId::sa(DEFAULT_FIRST_MEMBER_ID);

/// MemberId to assign to next member that is added to the registry
pub NextMemberId get(next_member_id) build(|config: &GenesisConfig<T>| config.first_member_id): T::MemberId = T::MemberId::sa(DEFAULT_FIRST_MEMBER_ID);

/// Mapping of member ids to their corresponding primary accountid
pub AccountIdByMemberId get(account_id_by_member_id) : map T::MemberId => T::AccountId;

/// Mapping of members' account ids to their member id.
pub MemberIdByAccountId get(member_id_by_account_id) : map T::AccountId => Option<T::MemberId>;

/// Mapping of member's id to their membership profile
// Value is Option<Profile> because it is not meaningful to have a Default value for Profile
pub MemberProfile get(member_profile) : map T::MemberId => Option<Profile<T>>;

/// Registered unique handles and their mapping to their owner
pub Handles get(handles) : map Vec<u8> => Option<T::MemberId>;

/// Next paid membership terms id
pub NextPaidMembershipTermsId get(next_paid_membership_terms_id) : T::PaidTermId = T::PaidTermId::sa(FIRST_PAID_TERMS_ID);

/// Paid membership terms record
// Remember to add _genesis_phantom_data: std::marker::PhantomData{} to membership
// genesis config if not providing config() or extra_genesis
pub PaidMembershipTermsById get(paid_membership_terms_by_id) build(|config: &GenesisConfig<T>| {
    // This method only gets called when initializing storage, and is
    // compiled as native code. (Will be called when building `raw` chainspec)
    // So it can't be relied upon to initialize storage for runtimes updates.
    // Initialization for updated runtime is done in run_migration()
    let mut terms: PaidMembershipTerms<T> = Default::default();
    terms.fee = config.default_paid_membership_fee;
    vec![(terms.id, terms)]
}) : map T::PaidTermId => Option<PaidMembershipTerms<T>>;

/// Active Paid membership terms
pub ActivePaidMembershipTerms get(active_paid_membership_terms) : Vec<T::PaidTermId> = vec![T::PaidTermId::sa(DEFAULT_PAID_TERM_ID)];

/// Is the platform is accepting new members or not
pub NewMembershipsAllowed get(new_memberships_allowed) : bool = true;

pub ScreeningAuthority get(screening_authority) : Option<T::AccountId>;

// User Input Validation parameters - do these really need to be state variables
// I don't see a need to adjust these in future?
pub MinHandleLength get(min_handle_length) : u32 = DEFAULT_MIN_HANDLE_LENGTH;
pub MaxHandleLength get(max_handle_length) : u32 = DEFAULT_MAX_HANDLE_LENGTH;
pub MaxAvatarUriLength get(max_avatar_uri_length) : u32 = DEFAULT_MAX_AVATAR_URI_LENGTH;
pub MaxAboutTextLength get(max_about_text_length) : u32 = DEFAULT_MAX_ABOUT_TEXT_LENGTH;
```

## Invariants

...

## Events

The following is the payload used with `decl_events`.

```Rust
pub enum Event<T> where
      <T as system::Trait>::AccountId,
      <T as Trait>::MemberId {
        MemberRegistered(MemberId, AccountId),
        MemberUpdatedAboutText(MemberId),
        MemberUpdatedAvatar(MemberId),
        MemberUpdatedHandle(MemberId),
}
```

## Dispatchable Methods

### `buy_membership`

#### Payload

```Rust
origin: Origin, paid_terms_id: PaidTermId, user_info: UserInfo
```

#### Description

Establish new membership through payment.

#### Errors

##### 1. <what is returned?>

```Rust
!ensure_signed(origin)
```

##### 2. new members not allowed

```Rust
!<NewMembershipsAllowed<T>>::get()
```

##### 3. account already associated with a membership

```Rust
<MemberIdByAccountId<T>>::exists(origin)
```

##### 4. role key cannot be used for membership

```Rust
T::Roles::is_role_account(origin)
```

##### 5. paid terms id not active

```Rust
!<ActivePaidMembershipTerms<T>>::iter().any(|x| x == paid_terms_id)
```

##### 6. paid terms id not active

_Note: This is a bug, should not be checked_

```Rust
!<PaidMembershipTermsById<T>>::exists(paid_terms_id)
```

##### 7. not enough balance to buy membership

```Rust
!T::Currency::can_slash(who, terms.fee)
```

where

```Rust
let terms = <PaidMembershipTermsById<T>>::get(paid_terms_id);
```

##### 8. missing handle

```Rust
...
```

##### 9. handle too short

```Rust
...
```

##### 10. handle too long

```Rust
...
```

##### 11. avatar uri too long

```Rust
...
```

##### 12. Handle occupied

```Rust
...
```

#### Side effects

##### Membership established

###### Precondition

`NO_ERROR`

###### Side effect(s)

The following conditions must all hold

```Rust
[T::Currency::balance]'(who) == T::Currency::balance(who) - <PaidMembershipTermsById<T>>::get(paid_terms_id).fee &&

[<MemberIdByAccountId<T>>]' == <MemberIdByAccountId<T>> [+] (who, <NextMemberId<T>>::get()) &&
[<AccountIdByMemberId<T>>]' == <AccountIdByMemberId<T>> [+] (<NextMemberId<T>>::get(), who)) == who &&
[<MemberProfile<T>>]' == <MemberProfile<T>> [+] (<NextMemberId<T>>::get(), profile) &&
[<Handles<T>>]' == <Handles<T>> [+] (user_info.handle.clone(), <NextMemberId<T>>::get()) &&
[<NextMemberId<T>>]' == <NextMemberId<T>> + 1
```

where

```Rust
let profile = Profile {
  id: <NextMemberId<T>>::get(),
  handle: user_info.handle,
  avatar_uri: user_info.avatar_uri,
  about: user_info.about,
  registered_at_block: <system::Module<T>>::block_number(),
  registered_at_time: <timestamp::Module<T>>::now(),
  entry: EntryMethod::Paid(paid_terms_id)),
  suspended: false,
  subscription: None,
}
```

###### Result

```Rust
Ok(<NextMemberId<T>>::get())
```

###### Event(s)

```Rust
MemberRegistered(<NextMemberId<T>>::get(), who.clone())
```

### `change_member_about_text`

#### Payload

```Rust
origin: Origin, text: Vec<u8>
```

#### Description

Change about text on membership.

#### Errors

##### 1. <what is returned?>

```Rust
!ensure_signed(origin)
```

##### 2. no member id found for accountid

```Rust
!<MemberIdByAccountId<T>>::exists(who)
```

##### 3. not primary account

```Rust
!<AccountIdByMemberId<T>>::exists(member_id)
```

where

```Rust
let member_id = <MemberIdByAccountId<T>>::get(who)
```

##### 4. member profile not found

```Rust
!<MemberProfile<T>>::exists(member_id)
```

#### Side effects

##### About text updated

###### Precondition

`NO_ERROR`

###### Side effect(s)

The following conditions must all hold

```Rust
<MemberProfile<T>>::get(member_id).text ===  text.truncate(Self::max_about_text_length() as usize);
```

###### Result

```Rust
Ok()
```

###### Event(s)

`RawEvent::MemberUpdatedAboutText(id)`


### `change_member_avatar`

_fill in_

### `change_member_handle`

_fill in_

### `update_profile`

_fill in_

### `add_screened_member`

_fill in_

### `set_screening_authority`

_fill in_

## Non-dispatchable Methods

### `is_active_member`

...

### `lookup_member_id`

...

### `lookup_account_by_member_id`
