use codec::{Decode, Encode};
//use srml_support::traits::{Currency};
//use runtime_primitives::traits::{SimpleArithmetic, Zero};
//use srml_support::ensure;
//use rstd::collections::btree_map::BTreeMap;
use rstd::collections::btree_set::BTreeSet;
use rstd::prelude::*;
//use crate::{Trait};

// Possible causes
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, Copy, PartialOrd, Ord)]
pub enum ApplicationDeactivationCause {
    External, // Add ID here for simplicity?
    Hired,
    NotHired,
    CrowdedOut,
    OpeningCancelled,
    ReviewPeriodExpired,
    OpeningFilled,
}

/*
pub enum OutstandingUnstaking {
  RoleOnly,
  ApplicationOnly,
  Both
}
*/

// Possible status of an application
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd, Ord)]
pub enum ApplicationStage<BlockNumber> {
    // Normal active state
    Active,

    //  Waiting for one or more unstakings, with a non-zero unstaking period, to complete.
    Unstaking {
        // When deactivation was initiated.
        deactivation_initiated: BlockNumber,

        // The cause of the deactivation.
        cause: ApplicationDeactivationCause,
    },

    // No longer active, can't do anything fun now.
    Inactive {
        // When deactivation was initiated.
        deactivation_initiated: BlockNumber,

        // When deactivation was completed, and the inactive state was established.
        deactivated: BlockNumber,

        // The cause of the deactivation.
        cause: ApplicationDeactivationCause,
    },
}

/// OpeningStage must be default constructible because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl<BlockNumber> Default for ApplicationStage<BlockNumber> {
    fn default() -> Self {
        ApplicationStage::Active
    }
}

// An application for an actor to occupy an opening.
#[derive(Encode, Decode, Default, Debug, Eq, PartialEq, Clone, PartialOrd, Ord)]
pub struct Application<OpeningId, BlockNumber, StakeId> {
    // Identifier for opening for which this application is for.
    pub opening_id: OpeningId,

    // Index of arrival across all applications for given opening,
    // which is needed for strictly ordering applications.
    // Starts at 0.
    pub application_index_in_opening: u32,

    // Block at which this application was added.
    pub add_to_opening_in_block: BlockNumber,

    // NB: The given staking idnetifiers have a bloated purpose,
    // and are mutable, fix this.
    // https://github.com/Joystream/substrate-hiring-module/issues/11

    // Identifier for stake that may possibly be established for role.
    // Will be set iff the role staking policy of the corresponding opening
    // states so AND application is not inactive.
    pub active_role_staking_id: Option<StakeId>,

    // Identifier for stake that may possibly be established for application
    // Will be set iff the application staking policy of the corresponding opening
    // states so.
    pub active_application_staking_id: Option<StakeId>,

    // Status of this application
    pub stage: ApplicationStage<BlockNumber>,

    // ...
    pub human_readable_text: Vec<u8>,
}

// How to limit the number of eligible applicants
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone)]
pub struct ApplicationRationingPolicy {
    // The maximum number of applications that can be on the list at any time.
    pub max_active_applicants: u32,
    // How applicants will be ranked, in order to respect the maximum simultaneous application limit
    //pub applicant_ranking: ApplicationRankingPolicy
}

#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone)]
pub enum OpeningDeactivationCause {
    CancelledBeforeActivation,
    CancelledAcceptingApplications,
    CancelledInReviewPeriod,
    ReviewPeriodExpired,
    Filled,
}

#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone)]
pub enum ActiveOpeningStage<BlockNumber> {
    AcceptingApplications {
        //
        started_accepting_applicants_at_block: BlockNumber,
    },

    //
    ReviewPeriod {
        started_accepting_applicants_at_block: BlockNumber,

        started_review_period_at_block: BlockNumber,
    },

    //
    Deactivated {
        cause: OpeningDeactivationCause,

        deactivated_at_block: BlockNumber,

        started_accepting_applicants_at_block: BlockNumber,

        started_review_period_at_block: BlockNumber,
    },
}

// The stage at which an `Opening` may be at.
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone)]
pub enum OpeningStage<BlockNumber, ApplicationId> {
    // ..
    WaitingToBegin {
        begins_at_block: BlockNumber,
    },

    // TODO: Fix this bad name
    //
    Active {
        // Active stage
        stage: ActiveOpeningStage<BlockNumber>,

        // Set of identifiers for all applications which have been added, but not removed, for this opening.
        // Is required for timely on-chain lookup of all applications associated with an opening.
        applicants: BTreeSet<ApplicationId>, //BTreeMap<ApplicationId, ()>, //Vec<T::ApplicationId>,

        // TODO: Drop these counters
        // https://github.com/Joystream/substrate-hiring-module/issues/9
        //
        // Counters over all possible application states.
        // Are needed to set `application_index_in_opening` in new applications
        // Are very useful for light clients.
        //
        // NB: Remember that _all_ state transitions in applications will require updating these variables,
        // its easy to forget!
        //
        // NB: The sum of
        // - `active_application_count`
        // - `unstaking_application_count`
        // - `deactivated_application_count`
        //
        // equals the total number of applications ever added to the openig via `add_application`.

        // Active NOW
        active_application_count: u32,

        // Unstaking NOW
        unstaking_application_count: u32,

        // Deactivated at any time for any cause.
        deactivated_application_count: u32, // Removed at any time.
                                            //removed_application_count: u32
    },
}

impl<BlockNumber, ApplicationId> OpeningStage<BlockNumber, ApplicationId> {
    /// The number of applications ever added to the opening via
    /// `add_opening` extrinsic.
    pub fn number_of_appliations_ever_added(&self) -> u32 {
        match self {
            OpeningStage::WaitingToBegin { .. } => 0,

            OpeningStage::Active {
                active_application_count,
                unstaking_application_count,
                deactivated_application_count,
                ..
            } => {
                active_application_count
                    + unstaking_application_count
                    + deactivated_application_count
            }
        }
    }
}

/// OpeningStage must be default constructible because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl<BlockNumber: Default, ApplicationId> Default for OpeningStage<BlockNumber, ApplicationId> {
    fn default() -> Self {
        OpeningStage::WaitingToBegin {
            begins_at_block: BlockNumber::default(),
        }
    }
}

// Constraints around staking amount
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone)]
pub enum StakingAmountLimitMode {
    AtLeast,
    Exact,
}

// Policy for staking
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone)]
pub struct StakingPolicy<Balance, BlockNumber> {
    // Staking amount
    pub amount: Balance,

    // How to interpret the amount requirement
    pub amount_mode: StakingAmountLimitMode,

    // The unstaking period length, if any, deactivation causes that are autonomous,
    // that is they are triggered internally to this module.
    pub crowded_out_unstaking_period_length: Option<BlockNumber>,
    pub review_period_expired_unstaking_period_length: Option<BlockNumber>,
}

/*
impl<T: Currency> StakingPolicy<T::Balance, T::BlockNumber> {

  pub fn amount_is_valid(&self) -> bool {
    self.amount >= T::Currency::minimum_balance()
  }
}
*/

impl<Balance: PartialOrd + Clone, BlockNumber> StakingPolicy<Balance, BlockNumber> {
    pub fn accepts_amount(&self, test_amount: &Balance) -> bool {
        match self.amount_mode {
            StakingAmountLimitMode::AtLeast => *test_amount >= self.amount,
            StakingAmountLimitMode::Exact => *test_amount == self.amount,
        }
    }
}

#[derive(Encode, Decode, Default, Debug, Eq, PartialEq, Clone)]
pub struct Opening<Balance, BlockNumber, ApplicationId> {
    // Block at which opening was added
    pub created: BlockNumber,

    // Current stage for this opening
    pub stage: OpeningStage<BlockNumber, ApplicationId>,

    // Maximum length of the review stage.
    pub max_review_period_length: BlockNumber,

    // Whether, and if so how, to limit the number of active applicants....
    pub application_rationing_policy: Option<ApplicationRationingPolicy>,

    // Whether any staking is required just to apply, and if so, how that stake is managed.
    pub application_staking_policy: Option<StakingPolicy<Balance, BlockNumber>>,

    // Whether any staking is required for the role, and if so, how that stake is managed.
    pub role_staking_policy: Option<StakingPolicy<Balance, BlockNumber>>,

    // Description of opening
    pub human_readable_text: Vec<u8>,
}
