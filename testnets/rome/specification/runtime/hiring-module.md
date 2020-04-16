# Hiring Module

## Table of Contents

- [Name](#name)
- [Design](#design)
- [Dependencies](#dependencies)
- [Concepts](#concepts)
- [State](#state)
- [Events](#events)
- [Dispatchables](#dispatchables)
- [Non-dispatchables](#non-dispatchables)
  - [add_opening](#add_opening)
  - [begin_accepting_applications](#begin_accepting_applications)
  - [fill_opening](#fill_opening)
  - [cancel_opening](#cancel_opening)
  - [remove_opening](#remove_opening)
  - [add_application](#add_application)
  - [deactivate_application](#deactivate_application)
  - [remove_application](#remove_application)
  - [unstaked](#unstaked)
  - [on_finalize](#on_finalize)

## Name

`Hiring`

## Motivation

A variety of roles will require a set of candidates to express, possibly staked, interest in joining, to some authority, whom is then tasked with selecting a subset of winners to enter the given role. While this sort of interaction could be facilitated off chain, the benefit of avoiding possibly faulty authority nodes and a more robust evidentiary trail. It also makes it easier to organise more complex hiring business logic, such as the outcome of some group decision making process where stakeholders may act asynchronously.

## Design

There are two core concepts in this module, _an opening_ and an _application_.

An opening represents the process of hiring one or more new actors into some available role, and the core states and state transitions are sketched in the following figure.

![hiring_opening](https://user-images.githubusercontent.com/437292/63675509-4296d780-c7e9-11e9-8512-05b71a8646b9.png)

An application represents the bid of some actor to occupy the position opened for in a given opening , and the core states and state transitions are sketched in the following figure.

![hiring_application](https://user-images.githubusercontent.com/437292/63675514-46c2f500-c7e9-11e9-9c46-7a89e6a2645f.png)

As part of hiring, applicants may have to stake both for the application and for the role. This module presumes that some external module exists to manage staking, slashing and unstaking. It expects to be able to invoke these actions, and also to be notified about the completion of unstaking actions which have h had an unstaking period.

## Usage

In many contexts, stepping into a role may have extraneous informational or economic constraints that are not embodied in this module. In this case those should be modelled on top of this module.

## Dependencies

- `Staking`: The staking module

## Concepts

```Rust

trait Trait {
 type ApplicationId: .. ,
 type OpeningId: ...,

 /* OnApplicationDeactivated(id, cause) : ... */

}

// Possible causes
enum ApplicationDeactivationCause {
  External, // Add ID here for simplicity?
  Hired,
  NotHired
  CrowdedOut,
  OpeningCancelled,
  ReviewPeriodExpired,
  OpeningFilled,
}

// Possible status of an application
enum ApplicationStage {

  // Normal active state
  Active,

  //  Waiting for one or more unstakings, with a non-zero unstaking period, to complete.
  Unstaking {

    // When deactivation was initiated.
    deactivation_initiated: BlockNumber,

    // The cause of the deactivation.
    cause: ApplicationDeactivationCause
  },

  // No longer active, can't do anything fun now.
  Inactive {

    // When deactivation was initiated.
    deactivation_initiated: BlockNumber,

    // When deactivation was completed, and the inactive state was established.
    deactivated: BlockNumber,

    // The cause of the deactivation.
    cause: ApplicationDeactivationCause

  }
}

// An application for an actor to occupy an opening.
struct Application {

  // Application identifier
  id: ApplicationId,

  // Identifier for opening for which this application is for.
  opening_id: OpeningId,

  // Index of arrival across all applications for given opening.
  applicant_arrival_index: u32,

  // Block at which this application was submitted.
  activated: BlockNumber,

  // Identifier for stake that may possibly be established for role
  // May possibly no longer be valid, depending on stage.
  initial_role_staking_id: Option<StakeId>,

  // Identifier for stake that may possibly be established for application
  // May possibly no longer be valid, depending on stage.
  initial_application_staking_id: Option<StakeId>,

  // Status of this application
  stage: ApplicationStage,

 //
 human_readable_text: Vec<u8>
}

// How one may automatically rank different outstanding applications. This is require to enforce a limited application pool.
enum ApplicationRankingPolicy {

  // Rank on arrival time of application
  RankOnArrivalTime {

    // Wether to rank arrival times in ascending or descending order
    ascending: bool
  },

  // Rank on staked quantity in application
  RankOnApplicationStake {

    // Whether to do secondary tie break on the quantity staked for the role itself
    tie_break_on_role_stake: bool,
  },

  // Rank on staked quantity for role itself
  RankOnRoleStake {

    // Whether to do secondary tie break on the quantity staked in for the application itself
    tie_break_on_application_stake: bool
  }
}

// How to limit the number of eligible applicants
struct ApplicationRationingPolicy {

  // The maximum number of applications that can be on the list at any time.
  max_active_applicants: u32,

  // How applicants will be ranked, in order to respect the maximum simultaneous application limit
  applicant_ranking: ApplicationRankingPolicy

}

enum OpeningDeactivationCause {
  CancelledBeforeActivation,
  CancelledAcceptingApplications,
  CancelledInReviewPeriod,
  ReviewPeriodExpired,
  Filled
}

enum ActiveOpeningStage {

    AcceptingApplications {

      //
      started_accepting_applicants_at_block: BlockNumber,
    }

    //
    ReviewPeriod {

      started_accepting_applicants_at_block: BlockNumber,

      started_review_period_at_block: BlockNumber,
    }

    //
    Deactivated {

      cause: OpeningDeactivationCause,

      deactivated_at_block: BlockNumber,

      started_accepting_applicants_at_block: BlockNumber,

      started_review_period_at_block: BlockNumber,

    }
}

// The stage at which an `Opening` may be at.
enum OpeningStage {

  // ..
  WaitingToBegin {
    begins_at_block: BlockNumber
  },

  // ..
  Active {

    // Active stage
    stage: ActiveOpeningStage,

    // Identifiers for all applications which have been added, but not removed, for this opening.
    applicants: Vec<ApplicationId>,

    // Identifiers for applications that are still Began. These are the only applications which
    // still in the running for getting hired while the opening is still no deactivated.-.
    active_applicants: Vec<ApplicationId>,

    // Counters over all possible application states. Are very useful
    // for light clients.
    // NB: The sum of all of the below is the total number of applications ever activated.
    active_application_count: u64,
    unstaking_application_count: u64,
    deactivated_application_count: u64, // for any reason.
    removed_application_count: u64
  }

}

// Constraints around staking amount
enum StakingAmountMode {
  AtLeast,
  Exact
}

type UnstakingPeriodLength: Option<BlockNumber>;

// Policy for staking
struct StakingPolicy {

  // Staking amount
  amount: Balance,

  // How to interpret the amount requirement
  amount_mode: StakingAmountLimitMode,

  // The unstaking period length, if any, deactivation causes that are autonomous,
  // that is they are triggered internally to this module.
  crowded_out_unstaking_period_length: UnstakingPeriodLength,
  review_period_expired_unstaking_period_length: UnstakingPeriodLength,
}

// An opening
struct Opening {

  // Identifier for opening
  id: OpeningId,

  // Block at which opening was added
  created: BlockNumber,

  // Current stage for this opening
  stage: OpeningStage,

  // Maximum length of the review stage.
  max_review_period_length: BlockNumber,

  // Whether, and if so how, to limit the number of active applicants....
  application_rationing_policy: Option<ApplicationRationingPolicy>,

  // Whether any staking is required just to apply, and if so, how that stake is managed.
  application_staking_policy: Option<StakingPolicy>,

  // Whether any staking is required for the role, and if so, how that stake is managed.
  role_staking_policy: Option<StakingPolicy>,

  // Description of opening
  human_readable_text: Vec<u8>
}

enum StakeType {
  Role,
  Application
}

// The purpose of some staked funds.
struct StakePurpose {

  // Application to which the stake corresponds
  application_id: ApplicationId,

  // Type of
  type: StakeType
}

```

## State

- `openingsById: Map OpeningID => Opening`: Openings.
- `nextOpeningId: OpeningId`: Identifier for next opening to be added.
- `applicationsById: Map ApplicationId => Application`: Applications.
- `nextApplicationId: ApplicationId`: Identifier for next application to be added.
- `stakePurposeByStakingId: StakeId => StakePurpose`: Internal purpose of given stake, i.e. fro what application, and whether for the role or for the application.

## Events

**None**

## Dispatchables

**None**

## Non-dispatchables

**Explain how an application is deactivated... callback `OnApplicationDeactivated`, synch vs. async.**

### `add_opening`

Add new opening based on given inputs policies. The new `Opening` instance has stage `WaitingToBegin`, and is added to `openingsById`, and has identifier equal to `nextOpeningId`. The latter is incremented. The used identifier is returned.

### `begin_accepting_applications`

Applies when given opening is in `WaitingToBegin` stage. The stage is updated to `Began.AcceptingApplications` stage. Returns nothing.

### `fill_opening`

Applies when given opening is in `ReviewPeriod` stage. Given list of applications are deactivated to under the `Hired`, all other active applicants are `NotHired`. Separately for each group, unstaking periods for any applicable application and/or role stake must be provided. Returns nothing.

### `begin_review`

Applies when given opening is in `Began.AcceptingApplications` stage. The stage is updated to `Began.ReviewPeriod`. Returns nothing.

### `cancel_opening`

Applies when given opening is in stage `Began.AcceptingApplications` or `Began.ReviewPeriod`. The stage is updated to `Began.Inactive` in all cases. There may be active applications, in which case deactivation of all is initiated. The number of applications which had deactivation initiated is returned.

### `remove_opening`

Applies when a given opening is in stage `WaitingToBegin` or `Began.Inactive`. In the latter it is also required that all applications are inactive. Opening, and all associated applications, are removed from `openingsById` and `applicationsById`. The number of applications removed is returned.

### `add_application`

Applies when a given opening is in stage `Began.AcceptingApplications`. If the `application_rationing_policy` of the opening has a restrictive policy, and space has ran out, then possibly deactivate another application which may get bumped out. If the new application does not make it, then return `false`. Otherwise move forward. Create a new `Application` instance, with identifier value equal to `nextApplicationId`, which is incremented, and adds to `applicationsById`. Do possible initial staking based on policy of opening and given inputs, and update `stakePurposeByStakingId` correspondingly.

### `deactivate_application`

Applies when a given opening is in stage `Began.AcceptingApplications`, and the application is in stage `Active`. If the application has any staking associated with it, unstaking is initiated, and the application is set to stage `Unstaking`.  Otherwise, the stage is set directly to `Inactive`. The `cause` is set to `External`. An invocation of `OnApplicationDeactivated` is lastly made. Returns the resulting stage of the application during the call.

### `remove_application`

Applies when an application is in the stage `Inactive`. Results in removing instance from `applicationsById`, and from the corresponding opening. Returns nothing.

### `unstaked`

Checks whether staking identifier is key in `stakePurposeByStakingId`, if so, removes mapping and recovers the relevant application and triggers `unstaked` on it. Returns a boolean indicating whether there was a match.

### `on_finalize`

Manages the following autonomous events across all applications:

- beginning to accept applications
- review period expiry
