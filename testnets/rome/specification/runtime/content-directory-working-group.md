# Content Directory Working Group Module

## Table of Contents

- [Name](#name)
- [Design](#design)
- [Dependencies](#dependencies)
- [Concepts](#concepts)
- [State](#state)
- [Events](#events)
- [Dispatchable Methods](#dispatchable-methods)
  - [update_lead_role_account](#update_lead_role_account)
  - [update_lead_reward_account](#update_lead_reward_account)
  - [add_permission_group](#add_permission_group)
  - [update_permission_group](#update_permission_group)
  - [add_curator_opening](#add_curator_opening)
  - [accept_curator_applications](#accept_curator_applications)
  - [begin_curator_applicant_review](#begin_curator_applicant_review)
  - [fill_curator_opening](#fill_curator_opening)
  - [update_curator_reward](#update_curator_reward)
  - [slash_curator](#slash_curator)
  - [terminate_curator](#terminate_curator)
  - [apply_on_curator_opening](#apply_on_curator_opening)
  - [update_curator_role_account](#update_curator_role_account)
  - [update_curator_reward_account](#update_curator_reward_account)
  - [exit_curator_role](#exit_curator_role)  
- [Non-dispatchable Methods](#non-dispatchable-methods)
  - [set_lead](#set_lead)
  - [unset_lead](#unset_lead)
  - [set_opening_policy](#set_opening_policy)
  - [update_lead_reward](#update_lead_reward)
  - [account_is_in_group](#account_is_in_group)

## Name

`ContentDirectoryWorkingGroup`

## Motivation

The working groups solves the problems of how to administrate the write access permissions to the content directory state.

## Design

The working group has two types of participants. A _lead_, which is inducted by root. The lead is involved in two activities. First, hiring and managing the second participant type, namely _curators_. Second, creating and managing the actor groups, called _permission groups_, for the content directory. These groups are defined by some criteria for what accounts belong to them at any given time, and in particular they may defined to include the account(s) of one of the following

- the led,
- a specific curator
- a specific member
- a specific publisher
- any curator
- any member
- any publisher.

These permission groups are presumed to be used with the [permission module](#) and the [version store module](#). Both leads and curators are possibly staked and rewarded. The staking is managed by the [staking module](#), and the rewards are managed by the [recurring rewards module](#). All rewards in the group flow from a single group mint.

## Usage

I used in concert with a range of other modules described in the next section.

## Dependencies

 - `RecurringReward` module
 - `Hiring` module
 - `Membership` module
 - `VersionedStorePermissions` module

## Concepts

```Rust

trait Trait : RecurringReward::Trait + Hiring::Trait + Membership::Trait VersionedStorePermissions::Trait {

  // Type of identifier for permissions groups.
  type PermissionGroupId : INTEGER_TRAIT_CONSTRAINTS;

}

// Type of identifier for lead.
type LeadId = Trait::RoleActorId;

// Type of identifier for curators.
type CuratorId = Trait::RoleActorId;

// Type of identifier for publishers.
type PublisherId = Trait::MemberId;

enum LeadRoleState {
  Active,
  Exited {
    initiated_at_block_number: T::BlockNumber,
  }
}

// Working group lead: curator lead
// For now this role is not staked or inducted through an structured process, like the hiring module,
// hence information about this is missing. Recurring rewards is included, somewhat arbitrarily!
struct Lead<T: Trait> {

  // Account used to authenticate in this role,
  role_account: T::AccountId,

  // Whether the role has recurring reward, and if so an identifier for this.
  reward_relationship: Option<T::RewardRelationshipId>,

  // When was inducted
  // TODO: Add richer information about circumstances of induction
  inducted: T::BlockNumber,

  //
  stage: LeadRoleState

}

enum CuratorExitInitiationOrigin {
  Lead,
  Curator
}

enum CuratorRoleStage<T: Trait> {

  Active,

  Exited {

    origin: CuratorExitInitiationOrigin,

    initiated_at_block_number: T::BlockNumber,

    rationale_text: Vec<u8>

  }

}

struct CuratorInduction<T: Trait> {

  // Lead responsible
  lead: LeadId,

  // Application through which curator was inducted
  application: T::ApplicationId,

  // When induction occurred
  at_block: T::BlockNumber
}

// Working group participant: curator
// This role can be staked, have reward and be inducted through the hiring module.
struct Curator<T: Trait> {

  // Account used to authenticate in this role,
  role_account: T::AccountId,

  // Whether the role has recurring reward, and if so an identifier for this.
  reward_relationship: Option<T::RewardRelationshipId>,

  // Whether participant is staked, and if so, the identifier for this staking in the staking module.
  stake: Option<T::StakeId>,

  //
  stage: CuratorRoleStage<T>,

  //
  induction: CuratorInduction<T>
}

// The type of permission groups supported
enum PermissionGroupType<T: Trait> {

  CurrentLead,

  Curator(T::CuratorId),

  Member(T::MemberId),

  Publisher(T::PublisherId),

  AnyCurator,

  AnyMember,

  AnyPublisher
}

// Represents a group as understood by the VersionedStorePermissions module
struct PermissionGroup<T: Trait> {

  // ..
  type: PermissionGroupType<T>,

  // ..
  is_active: bool,

  // ..
  created: T::BlockNumber,

  // ..
  description: Vec<u8>
}

// Policy governing any curator opening which can be made by lead.
struct OpeningPolicy<T: Trait> {

 /**
  * // Whether there should be a number of active curators which would block the
  * // creation of new openings, and if so what value.
  * active_curator_count_blocking_new_openings: Option<u16>,
  */

  // Maximum length of review period of applications
  max_review_period_length: BlockNumber,

  // Staking policy for application
  application_staking_policy: Option<T::StakingPolicy>,

  // Staking policy for role itself
  role_staking_policy: Option<T::StakingPolicy>
}

```

## State

- `mint: T::TokenMintId`: The mint currently funding the rewards for this module.
- `current_lead: Option<T::LeadId>`: The current lead.
- `leadById: linked_map T::LeadId => Lead<T>`: Maps identifier to corresponding lead.
- `nextLeadId: T::LeadId`: Next identifier for new current lead.
- `openings_policy: Option<OpeningPolicy<T>>`: The constraints lead must respect when creating a new curator opening. Lack of policy is interpreted as blocking any new openings at all.
- `openings: linked_map T::OpeningId => ()`: set of identifiers for all openings originated from this group.
- `curatorById: linked_map T::CuratorId => Curator<T>`: Maps identifier to corresponding curator.
- `nextCuratorId: T::CuratorId`: Next identifier for new curator.
- `permissionGroupById: linked_map T::PermissionGroupId => PermissionGroup<T>`: Maps identifier to corresponding permission group.
- `nextPermissionGroupId: T::PermissionGroupId`: Next identifier for new permission group.
- `maxPermissionGroupDescriptionLength: u16`: Upper bound for character length of `description` field of any new or updated `PermissionGroup`
- `maxCuratorExitRationaleTextLength: u16`: Upper bound for character length of the `rationale_text` field of any new `CuratorRoleStage`.

## Events

- `LeadSet`
- `LeadUnset`
- `OpeningPolicySet`
- `LeadRewardUpdated`
- `LeadRoleAccountUpdated`
- `LeadRewardAccountUpdated`
- `PermissionGroupAdded`
- `PermissionGroupUpdated`
- `CuratorOpeningAdded`
- `AcceptedCuratorApplications`
- `BeganCuratorApplicationReview`
- `CuratorOpeningFilled`
- `CuratorSlashed`
- `TerminatedCurator`
- `AppliedOnCuratorOpening`
- `CuratorRewardUpdated`
- `CuratorRoleAccountUpdated`
- `CuratorRewardAccountUpdated`
- `CuratorExited`


## Implemented Traits

Module implements `VersionedStorePermissions::GroupMembershipChecker`, and sets `GroupMembershipChecker::GroupdId` to `T::PermissionGroupId`.

## Dispatchables

### `update_lead_role_account`

Can only be called by **Signed** origin, and caller must pass test on membership module of `key_can_sign_for_role` for the `current_lead`.

Updates `role_account` of `current_lead` to given new value.

Emits `LeadRoleAccountUpdated`.

### `update_lead_reward_account`

Can only be called by **Signed** origin, and caller must match `role_account` of set `current_lead`. Also, `reward_relationship` must be set on `current_lead`.

Updates `account` on `reward_relationship` to given new value.

Emits `LeadRewardAccountUpdated`.

### `add_permission_group`

Can only be called by **Signed** origin, and caller must match `role_account` of set `current_lead`.

Creates and adds new permission group.

Emits `PermissionGroupAdded`.

### `update_permission_group`

Can only be called by **Signed** origin, and caller must match `role_account` of set `current_lead`.

Updates a given permission group, based on its identifier. Field `created` is not mutable.

Emits `PermissionGroupUpdated`.

### `add_curator_opening`

Can only be called by **Signed** origin, and caller must match `role_account` of set `current_lead`.
Also requires that `openings_policy` is set, and if so, a new application is added to the `Hiring` module using relevant parameter values from this policy. The new opening identifier is added to `openings`.

Emits `CuratorOpeningAdded`.

### `accept_curator_applications`

Can only be called by **Signed** origin, and caller must match `role_account` of set `current_lead`.
Given opening identifier must be in `openings`. If so, `begin_accepting_applications` is called on the corresponding opening the `Opening` module.

Emits `AcceptedCuratorApplications`

### `begin_curator_applicant_review`

Can only be called by **Signed** origin, and caller must match `role_account` of set `current_lead`. Given opening identifier must be in `openings`. If so, `begin_review` is called on the corresponding opening the `Opening` module.

Emits `BeganCuratorApplicationReview`

### `fill_curator_opening`

Can only be called by **Signed** origin, and caller must match `role_account` of set `current_lead`. Given opening identifier must be in `openings`. Checks with the `Membership` module that all hires still can step into the role as curator at this time. If so, `fill_opening` is called on the corresponding opening the `Opening` module.
All hired curators are turned into new `Curator` instances, with identifiers based on `nextCuratorId`, and added to `curatorsById`.

Emits `CuratorOpeningFilled` and `CuratorAdded` for each curator hired.

### `update_curator_reward`

Can only be called by **Signed** origin, and caller must match `role_account` of set `current_lead`. Updates `reward_relationship` on given curator.

Emits `CuratorRewardUpdated`.

### `slash_curator`

Can only be called by **Signed** origin, and caller must match `role_account` of set `current_lead`.
Also requires that `stake` is set on given curator, if so, `initiate_slashing` is called on the `Stake` module on the stake for this curator.

Emits `CuratorSlashed`.

### `terminate_curator`

Can only be called by **Signed** origin, and caller must match `role_account` of set `current_lead`.
Also requires that given curator is found in `curatorsById` in the `Active` stage. If so, the stage is updated `Exited`, with suitable other parameters, and any `reward_relationship` set is disabled. Lastly, unstaking is initiated if present.

Emits `TerminatedCurator`.

### `apply_on_curator_opening`

Can only be called by **Signed** origin, and caller must pass test on `Membership` module of whether they can occupy a curator role at this time. Next, provided parameters must match staking and other requirements of opening. If so, `add_application` is on `Hiring` module. Return value is returned.

Emits `AppliedOnCuratorOpening`.

### `update_curator_role_account`

Can only be called by **Signed** origin, and account must match `role_account` of provided curator identifier. Also requires that given curator is found in `curatorsById` in the `Active` stage.

Updates `role_account` on given curator.

Emits `CuratorRoleAccountUpdated`.

### `update_curator_reward_account`

Can only be called by **Signed** origin, and account must match `role_account` of provided curator identifier. Also requires that given curator is found in `curatorsById` in the `Active` stage. Also, given curator must also have `reward_relationship` set.

Updates `account` on given curator `reward_relationship`.

Emits `CuratorRewardAccountUpdated`.

### `exit_curator_role`

Can only be called by **Signed** origin, and account must match `role_account` of provided curator identifier. Also requires that given curator is found in `curatorsById` in the `Active` stage. If so, the stage is updated `Exited`, with suitable other parameters, and any `reward_relationship` set is disabled. Lastly, unstaking is initiated if present.

Emits `CuratorExited`.

## Non-dispatchable Methods

### `set_lead`

Can only be called by **Root** origin, and requires that `current_lead` is not set. Membership module is consulted as to whether the given signing account can be setup as the curator lead with id `nextLeadId`, if no, then method terminates. Otherwise continues as follows.

A new recipient and reward relationship is added to the reward module, and a new `current_lead` instance is created with corresponding values and id `nextLeadId`, added to `leadById` undert this id, and `current_lead` i also set to this key. Lastly, `nextLeadId` is incremented.

Emits event `LeadSet`. Returns nothing.

### `unset_lead`

Can only be called by **Root** origin, and requires that `current_lead` is set. Membership module is informed to unregister the lead as playing the role of a curator lead. If `reward_relationship` is set on lead, then disable it to any further rewards. Lastly set `exited` to the current block number.

Emits event `LeadUnset`. Returns nothing.

### `set_opening_policy`

Can only be called by **Root** origin. Updates `opening_policy`.

Emits event `OpeningPolicySet`. Returns nothing.

### `update_lead_reward`

Can only be called by **Root** origin, and requires that `current_lead` is set. The lead must also have `reward_relationship` set. If so, then `amount_per_payout`, `next_payment_in_block` and `payout_interval` of the reward relationship can be updated.

Emits event `LeadRewardUpdated`. Returns nothing.

### `account_is_in_group`

Takes group id and looks up `permissionGroupById`, lack of match results in `false` being returned. A match is then used to evaluate the given account as follows

- `CurrentLead`: Account matches `role_account` of `current_lead` which is set.
- `Curator(id)`: ..
- `Member(id)`: ..
- `Publisher(id)`: .
- `AnyCurator`: ..
- `AnyMember`: ..
- `AnyPublisher`: ..
