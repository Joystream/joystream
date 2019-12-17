use crate::{hiring, ApplicationRationingPolicy, StakingPolicy};

use codec::{Decode, Encode};
use rstd::collections::btree_set::BTreeSet;

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

/// The stage at which an `Opening` may be at.
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone)]
pub enum OpeningStage<BlockNumber, ApplicationId> {
    // ..
    WaitingToBegin {
        begins_at_block: BlockNumber,
    },

    // TODO: Fix this bad name
    //
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
        // equals the total number of applications ever added to the openig via `add_application`.
        /// Active NOW
        active_application_count: u32,

        /// Unstaking NOW
        unstaking_application_count: u32,

        /// Deactivated at any time for any cause.
        deactivated_application_count: u32, // Removed at any time.
                                            //removed_application_count: u32
    },
}

impl<BlockNumber: Clone, ApplicationId> OpeningStage<BlockNumber, ApplicationId> {
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


    /// Ensures that an opening is waiting to begin.
    pub fn ensure_opening_stage_is_waiting_to_begin<Err>(&self, error: Err) -> Result<BlockNumber, Err> {
        if let OpeningStage::WaitingToBegin { begins_at_block} = self {
            return Ok(begins_at_block.clone());
        }

        Err(error)
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

