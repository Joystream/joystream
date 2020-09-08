use sp_std::clone::Clone;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::prelude::*;
use sp_std::vec::Vec;

use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

use crate::hiring;
use crate::hiring::*;

/// An opening represents the process of hiring one or more new actors into some available role
#[derive(Encode, Decode, Default, Debug, Eq, PartialEq, Clone)]
pub struct Opening<Balance, BlockNumber, ApplicationId> {
    /// Block at which opening was added
    pub created: BlockNumber,

    /// Current stage for this opening
    pub stage: OpeningStage<BlockNumber, ApplicationId>,

    /// Maximum length of the review stage.
    pub max_review_period_length: BlockNumber,

    /// Whether, and if so how, to limit the number of active applicants....
    pub application_rationing_policy: Option<ApplicationRationingPolicy>,

    /// Whether any staking is required just to apply, and if so, how that stake is managed.
    pub application_staking_policy: Option<StakingPolicy<Balance, BlockNumber>>,

    /// Whether any staking is required for the role, and if so, how that stake is managed.
    pub role_staking_policy: Option<StakingPolicy<Balance, BlockNumber>>,

    /// Description of opening
    pub human_readable_text: Vec<u8>,
}

impl<Balance, BlockNumber, ApplicationId> Opening<Balance, BlockNumber, ApplicationId>
where
    Balance: PartialOrd + Clone,
    BlockNumber: PartialOrd + Clone,
    ApplicationId: Ord + Clone,
{
    ///Creates new instance of Opening
    pub(crate) fn new(
        current_block_height: BlockNumber,
        activate_at: ActivateOpeningAt<BlockNumber>,
        max_review_period_length: BlockNumber,
        application_rationing_policy: Option<ApplicationRationingPolicy>,
        application_staking_policy: Option<StakingPolicy<Balance, BlockNumber>>,
        role_staking_policy: Option<StakingPolicy<Balance, BlockNumber>>,
        human_readable_text: Vec<u8>,
    ) -> Self {
        // Construct new opening
        let opening_stage = match activate_at {
            ActivateOpeningAt::CurrentBlock => hiring::OpeningStage::Active {
                // We immediately start accepting applications
                stage: hiring::ActiveOpeningStage::AcceptingApplications {
                    started_accepting_applicants_at_block: current_block_height.clone(),
                },

                // Empty set of applicants
                applications_added: BTreeSet::new(),

                // All counters set to 0
                active_application_count: 0,
                unstaking_application_count: 0,
                deactivated_application_count: 0,
            },

            ActivateOpeningAt::ExactBlock(block_number) => hiring::OpeningStage::WaitingToBegin {
                begins_at_block: block_number,
            },
        };

        hiring::Opening {
            created: current_block_height,
            stage: opening_stage,
            max_review_period_length,
            application_rationing_policy,
            application_staking_policy,
            role_staking_policy,
            human_readable_text,
        }
    }

    pub(crate) fn clone_with_new_active_opening_stage(
        self,
        active_opening_stage: hiring::ActiveOpeningStage<BlockNumber>,
    ) -> Self {
        //TODO: hiring::OpeningStage::Active params should be changed to struct
        //Copy parameters from previous active stage if any or set defaults
        let (
            applications_added,
            active_application_count,
            unstaking_application_count,
            deactivated_application_count,
        ) = if let hiring::OpeningStage::Active {
            applications_added,
            active_application_count,
            unstaking_application_count,
            deactivated_application_count,
            ..
        } = self.stage
        {
            //Active opening stage
            (
                applications_added,
                active_application_count,
                unstaking_application_count,
                deactivated_application_count,
            )
        } else {
            //Not active opening stage
            (BTreeSet::new(), 0, 0, 0)
        };

        hiring::Opening {
            stage: hiring::OpeningStage::Active {
                stage: active_opening_stage,
                applications_added,
                active_application_count,
                unstaking_application_count,
                deactivated_application_count,
            },
            ..self
        }
    }

    pub(crate) fn change_opening_stage_after_application_unstaked(&mut self) {
        if let OpeningStage::Active {
            ref stage,
            ref applications_added,
            active_application_count,
            unstaking_application_count,
            deactivated_application_count,
        } = self.stage
        {
            self.stage = hiring::OpeningStage::Active {
                stage: stage.clone(),
                applications_added: applications_added.clone(),
                active_application_count,
                unstaking_application_count: unstaking_application_count - 1,
                deactivated_application_count: deactivated_application_count + 1,
            };
        } else {
            panic!("stage MUST be active")
        }
    }
}

/// The stage at which an `Opening` may be at.
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone)]
pub enum OpeningStage<BlockNumber, ApplicationId> {
    /// Opening is not active yet. Will be activated at 'begins_at_block' block number
    WaitingToBegin {
        /// Becomes active at block number
        begins_at_block: BlockNumber,
    },

    /// Active opening stage
    Active {
        /// Active stage
        stage: hiring::ActiveOpeningStage<BlockNumber>,

        /// Set of identifiers for all applications which have been added, but not removed, for this opening.
        /// Is required for timely on-chain lookup of all applications associated with an opening.
        applications_added: BTreeSet<ApplicationId>, //BTreeMap<ApplicationId, ()>, //Vec<T::ApplicationId>,

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
        // equals the total number of applications ever added to the opening via `add_application`.
        /// Active NOW
        active_application_count: u32,

        /// Unstaking NOW
        unstaking_application_count: u32,

        /// Deactivated at any time for any cause.
        deactivated_application_count: u32,
    },
}

impl<BlockNumber: Clone, ApplicationId: Ord + Clone> OpeningStage<BlockNumber, ApplicationId> {
    /// The number of applications ever added to the opening via
    /// `add_opening` extrinsic.
    pub fn number_of_applications_ever_added(&self) -> u32 {
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

    /// Ensures that an opening is waiting to begin.
    pub(crate) fn ensure_opening_stage_is_waiting_to_begin<Err>(
        &self,
        error: Err,
    ) -> Result<BlockNumber, Err> {
        if let OpeningStage::WaitingToBegin { begins_at_block } = self {
            return Ok(begins_at_block.clone());
        }

        Err(error)
    }

    // Clones current stage. Panics if not Active.
    // Adds application_id to applications_added collection.
    // Increments 'active_application_count' counter.
    pub(crate) fn clone_with_added_active_application(
        self,
        new_application_id: ApplicationId,
    ) -> Self {
        if let hiring::OpeningStage::Active {
            stage,
            active_application_count,
            unstaking_application_count,
            deactivated_application_count,
            mut applications_added,
        } = self
        {
            applications_added.insert(new_application_id);

            hiring::OpeningStage::Active {
                stage,
                applications_added,
                active_application_count: active_application_count + 1,
                unstaking_application_count,
                deactivated_application_count,
            }
        } else {
            panic!("updated opening should be in active stage");
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

/// Substages of an active opening stage
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone)]
pub enum ActiveOpeningStage<BlockNumber> {
    /// Active opening accepts application
    AcceptingApplications {
        ///Start accepting applications at block number
        started_accepting_applicants_at_block: BlockNumber,
    },

    /// Active opening is in review period
    ReviewPeriod {
        /// Start accepting applications at block number
        started_accepting_applicants_at_block: BlockNumber,
        /// Start review application at block number
        started_review_period_at_block: BlockNumber,
    },

    /// Active opening was deactivated
    Deactivated {
        /// Deactivation cause
        cause: OpeningDeactivationCause,

        /// Deactivated at block number
        deactivated_at_block: BlockNumber,

        /// Start accepting applications at block number
        started_accepting_applicants_at_block: BlockNumber,

        /// Whether the review period had ever been started, and if so, at what block.
        /// Deactivation can also occur directly from the AcceptingApplications stage.
        started_review_period_at_block: Option<BlockNumber>,
    },
}

impl<BlockNumber: Clone> ActiveOpeningStage<BlockNumber> {
    // Ensures that active opening stage is accepting applications.
    pub(crate) fn ensure_active_opening_is_accepting_applications<Err>(
        &self,
        error: Err,
    ) -> Result<BlockNumber, Err> {
        if let ActiveOpeningStage::AcceptingApplications {
            started_accepting_applicants_at_block,
        } = self
        {
            return Ok(started_accepting_applicants_at_block.clone());
        }

        Err(error)
    }

    // Ensures that active opening stage is in review period.
    pub(crate) fn ensure_active_opening_is_in_review_period<Err>(
        &self,
        error: Err,
    ) -> Result<(BlockNumber, BlockNumber), Err> {
        match self {
            ActiveOpeningStage::ReviewPeriod {
                started_accepting_applicants_at_block,
                started_review_period_at_block,
            } => Ok((
                started_accepting_applicants_at_block.clone(),
                started_review_period_at_block.clone(),
            )), // <= need proper type here in the future, not param
            _ => Err(error),
        }
    }

    // Creates new active opening stage on cancel opening
    pub(crate) fn new_stage_on_cancelling(
        self,
        current_block_height: BlockNumber,
    ) -> Result<ActiveOpeningStage<BlockNumber>, CancelOpeningError> {
        match self {
            ActiveOpeningStage::AcceptingApplications {
                started_accepting_applicants_at_block,
            } => Ok(ActiveOpeningStage::Deactivated {
                cause: OpeningDeactivationCause::CancelledAcceptingApplications,
                deactivated_at_block: current_block_height,
                started_accepting_applicants_at_block,
                started_review_period_at_block: None,
            }),
            ActiveOpeningStage::ReviewPeriod {
                started_accepting_applicants_at_block,
                started_review_period_at_block,
            } => Ok(ActiveOpeningStage::Deactivated {
                cause: OpeningDeactivationCause::CancelledInReviewPeriod,
                deactivated_at_block: current_block_height,
                started_accepting_applicants_at_block,
                started_review_period_at_block: Some(started_review_period_at_block),
            }),
            ActiveOpeningStage::Deactivated { .. } => {
                Err(CancelOpeningError::OpeningNotInCancellableStage)
            }
        }
    }
}

/// Opening deactivation cause
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone)]
pub enum OpeningDeactivationCause {
    /// Opening was cancelled before activation
    CancelledBeforeActivation,

    /// Opening was cancelled during accepting application stage
    CancelledAcceptingApplications,

    /// Opening was cancelled during accepting application stage
    CancelledInReviewPeriod,

    /// Opening was cancelled after review period expired.
    ReviewPeriodExpired,

    /// Opening was filled.
    Filled,
}

/// Defines the moment of the opening activation.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub enum ActivateOpeningAt<BlockNumber> {
    /// Activate opening now (current block).
    CurrentBlock,

    /// Activate opening at block number.
    ExactBlock(BlockNumber),
}

/// How to limit the number of eligible applicants
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone)]
pub struct ApplicationRationingPolicy {
    /// The maximum number of applications that can be on the list at any time.
    pub max_active_applicants: u32,
}
