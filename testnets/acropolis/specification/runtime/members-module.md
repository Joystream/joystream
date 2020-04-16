# Members Module: is not part of Acropolis spec, only kept for future purposes.

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
  - [lookup_member_id](#`lookup_member_id`)
  - [lookup_account_by_member_id](#`lookup_account_by_member_id`)

## Design

### Motivation

The membership module is supposed to represent the current set of members on the platform, and manage corresponding rich profiles, as well as the entry of new members.

### Membership

Each membership corresponds to an account, but not all accounts will have a membership. An account may only be associated with a single membership. A membership has a corresponding rich profile, including practical user facing information, such as a unique immutable handle, an avatar URI and a short descriptive text.

A membership can also be active or inactive.

### Terms

A membership is established in the context of membership terms, which describe the price of admission and human readable conditions being agreed to. At any given time there may be a range of different terms available, and the set may change over time.

### Adding members

A member can be introduced in two ways. Either way depends on the module either being open or closed for accepting new members.

The first way is for a member to simply pay for getting entry, with a reference to a given set of terms. In this case, the membership will have a reference to the terms under which it was established.

The second is for a screening authority, which is a designated account, to simply add the new member. In this case, the membership will have a reference to the screening authority.

## Name

`Membership`

## Dependencies

- `Currency`: An external currency module which supports altering balances and total issuance.

## Concepts

- `Profile`: Describes core properties and status of a membership, like a unique handle and avatar URI. Is identified with unique integer identifier, called _member id_.

- `PaidMembershipTerms`: Terms for becoming a member, like price and terms. Is identified with a unique integer identifier called a _paid terms id_.

- `UserInfo`: Information required to establish a new profile.

## State

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

#### Payload

- `paid_terms_id`: Id of terms
- `user_info`: UserInfo

#### Description

Establish new membership through payment.

#### Errors

- Bad signature.
- New members not allowed.
- Account already associated with a membership.
- Role key cannot be used for membership.
- Paid terms id not active.
- Not enough balance to buy membership.
- Missing handle.
- Handle too short.
- Handle too long.
- Avatar URI too long.
- Handle occupied.

#### Side effects

##### Membership established

###### Precondition

`NO_ERROR`

###### Side effect(s)

- `Currency` has decreased primary account balance and total issuance by terms fee.
- `MemberIdByAccountId` extended.
- `AccountIdByMemberId` extended.
- `MemberProfile` extended with new profile created with payload values.
- `Handles` extended with handle.
- `NextMemberId` incremented.

###### Event(s)

- `MemberRegistered` for new member

### `change_member_about_text`

#### Payload

- `text`: New about text

#### Description

Change about text on membership.

#### Errors

- Bad signature.
- No member id found for account id.
- Not primary account.
- Member profile not found.

#### Side effects

##### About text updated

###### Precondition

`NO_ERROR`

###### Side effect(s)

- The text of profile of member corresponding to origin account is set to truncated `text`


###### Event(s)

- `MemberUpdatedAboutText`

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

_fill in_

### `lookup_member_id`

_fill in_

### `lookup_account_by_member_id`

_fill in_
