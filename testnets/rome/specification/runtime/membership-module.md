# Membership Module

## Table Of Contents

- [Design](#design)
- [Dependencies](#dependencies)
- [Name](#name)
- [Concepts](#concepts)
- [State](#state)
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
  - [primary_account_by_member_id](#`primary_account_by_member_id`)
  - [can_register_role_on_member](#`can_register_role_on_member`)
  - [can_unregister_role_on_member](#`can_unregister_role_on_member`)
  - [register_role_on_member](#`register_role_on_member`)
  - [unregister_role_on_member](#`unregister_role_on_member`)  

## Name

`Membership`

## Motivation

The membership module is supposed to represent the current set of members on the platform, and manage corresponding rich profiles and what roles they occupy, as well as the entry of new members.

## Design

### Membership

Each membership corresponds to an account, but not all accounts will have a membership. An account may only be associated with a single membership. A membership has a corresponding rich profile, including practical user facing information, such as a unique immutable handle, an avatar URI and a short descriptive text.

A membership can also be active or inactive.

### Terms

A membership is established in the context of membership terms, which describe the price of admission and human readable conditions being agreed to. At any given time there may be a range of different terms available, and the set may change over time.

### Adding members

A member can be introduced in two ways. Either way depends on the module either being open or closed for accepting new members.

The first way is for a member to simply pay for getting entry, with a reference to a given set of terms. In this case, the membership will have a reference to the terms under which it was established.

The second is for a screening authority, which is a designated account, to simply add the new member. In this case, the membership will have a reference to the screening authority.

## Usage

Used as a simple membership and role registry.

## Dependencies

- `Currency`

## Concepts

```Rust

trait Trait {
  type RoleActorId : INTEGER_TRAIT_CONSTRAINTS;
  type MemberId : INTEGER_TRAIT_CONSTRAINTS;
  type PaidTermId :  INTEGER_TRAIT_CONSTRAINTS;
  type SubscriptionId : INTEGER_TRAIT_CONSTRAINTS;
}

pub struct PaidMembershipTerms<T: Trait> {
    /// Quantity of native tokens which must be provably burned
    pub fee: BalanceOf<T>,
    /// String of capped length describing human readable conditions which are being agreed upon
    pub text: Vec<u8>,
}

enum RoleType {
 ForumUser,
 Curator,
 CurationLead,
...
}

struct ActorInRole {
 role_type: RoleType,
 role_id: RoleActorId
}

struct Profile<T: Trait> {

   pub handle: Vec<u8>,
   pub avatar_uri: Vec<u8>,
   pub about: Vec<u8>,
   pub registered_at_block: T::BlockNumber,
   pub registered_at_time: T::Moment,
   pub entry: EntryMethod<T>,
   pub suspended: bool,
   pub subscription: Option<T::SubscriptionId>,
   pub controller_account: T::AccountId,
   pub roles: BTreeMap<RoleId, Vec<ActorId>>,

}

pub struct UserInfo {
    pub handle: Option<Vec<u8>>,
    pub avatar_uri: Option<Vec<u8>>,
    pub about: Option<Vec<u8>>,
}
```

## State

- `membershipByActorInRole: Map ActorInRole => MemberId`

- `NextMemberId`: Unique identifier for next member, should equal total number of members ever created.

- `AccountIdByMemberId`: Maps member id to an account id.

- `MemberIdByAccountId`: Maps account id to optional member id.

- `MemberProfile`: Maps member id to `Profile` of member.

- `Handles`: Maps handle to corresponding member id.

- `NextPaidMembershipTermsId`: Next paid membership terms id.

- `PaidMembershipTermsById`: Maps paid terms id to actual terms.

- `ActivePaidMembershipTerms`: Set of active paid term ids.

- `NewMembershipsAllowed`: Whether new memberships can currently be established.

- `ScreeningAuthority`: Optional account of screener.

- `MinHandleLength`, `MaxHandleLength`, `MaxAvatarUriLength`, `MaxAboutTextLength`: Mutable constraint variables

## Events

- `MemberRegistered`: A member was registered with a given id and account.
- `MemberUpdatedAboutText`: A member, with given id, had text updated.
- `MemberUpdatedAvatar`: A member, with given id, had avatar URI updated.
- `MemberUpdatedHandle`: A member, with given id, had handle updated.

## Dispatchable Methods

### `buy_membership`

Establish new membership through payment.

### `change_member_about_text`

Change about text on membership.

### `change_member_avatar`

Change the avatar of a member.

### `change_member_handle`

Change the unqiue handle of a member.

### `update_profile`

Update the profile of a member.

### `add_screened_member`

Introduce a new screend member.

### `set_screening_authority`

Update the screening authority.

## Non-dispatchable Methods

### `is_active_member`

Check whether member is active.

### `primary_account_by_member_id`

Returns primary account of given member by id.

### `can_register_role_on_member`

Whether a given member can step into a given role at this time.

### `can_unregister_role_on_member`

Whether a given member can step out of a role at this time.

### `register_role_on_member`

Register a member in a role.

### `unregister_role_on_member`

Unregister a member in a role.
