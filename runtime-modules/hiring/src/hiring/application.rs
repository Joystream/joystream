use codec::{Decode, Encode};
use sp_std::clone::Clone;
use sp_std::vec::Vec;

use crate::hiring::StakePurpose;

/// An application for an actor to occupy an opening.
#[derive(Encode, Decode, Default, Debug, Eq, PartialEq, Clone, PartialOrd, Ord)]
pub struct Application<OpeningId, BlockNumber, StakeId> {
    /// Identifier for opening for which this application is for.
    pub opening_id: OpeningId,

    /// Index of arrival across all applications for given opening,
    /// which is needed for strictly ordering applications.
    /// Starts at 0.
    pub application_index_in_opening: u32,

    /// Block at which this application was added.
    pub add_to_opening_in_block: BlockNumber,

    // NB: The given staking identifiers have a bloated purpose,
    // and are mutable, fix this.
    // https://github.com/Joystream/substrate-hiring-module/issues/11
    /// Identifier for stake that may possibly be established for role.
    /// Will be set iff the role staking policy of the corresponding opening
    /// states so AND application is not inactive.
    pub active_role_staking_id: Option<StakeId>,

    /// Identifier for stake that may possibly be established for application
    /// Will be set iff the application staking policy of the corresponding opening
    /// states so.
    pub active_application_staking_id: Option<StakeId>,

    /// Status of this application
    pub stage: ApplicationStage<BlockNumber>,

    /// Application note
    pub human_readable_text: Vec<u8>,
}

impl<OpeningId, BlockNumber, StakeId: PartialEq + Clone>
    Application<OpeningId, BlockNumber, StakeId>
{
    /// Compares provided stake_id with internal stake defined by stake_purpose.
    /// Returns None on equality, Some(stake_id) otherwise.
    pub fn toggle_stake_id(
        &self,
        stake_id: StakeId,
        stake_purpose: StakePurpose,
    ) -> Option<StakeId> {
        let active_staking_id = match stake_purpose {
            StakePurpose::Application => self.active_application_staking_id.clone(),
            StakePurpose::Role => self.active_role_staking_id.clone(),
        };

        match active_staking_id {
            // If there is a match, toggle.
            Some(id) => {
                if id == stake_id {
                    None
                } else {
                    Some(id)
                }
            }
            _ => None,
        }
    }

    /// Modifies an application and unstake provided stake_id.
    /// If last stake unstaked - app stage becomes Inactive
    pub(crate) fn unstake_application(
        &mut self,
        current_block_height: BlockNumber,
        deactivation_initiated: BlockNumber,
        cause: ApplicationDeactivationCause,
        stake_id: StakeId,
    ) -> bool {
        // New values for application stakes
        let new_active_role_staking_id = self.toggle_stake_id(stake_id.clone(), StakePurpose::Role);
        let new_active_application_staking_id =
            self.toggle_stake_id(stake_id, StakePurpose::Application);

        // Are we now done unstaking?
        // Is the case if thereare no application stakes set.
        let is_now_done_unstaking =
            new_active_role_staking_id.is_none() && new_active_application_staking_id.is_none();

        self.active_role_staking_id = new_active_role_staking_id;
        self.active_application_staking_id = new_active_application_staking_id;

        // If we are done unstaking, then we go to the inactive stage
        if is_now_done_unstaking {
            self.stage = ApplicationStage::Inactive {
                deactivation_initiated,
                deactivated: current_block_height,
                cause,
            }
        };

        is_now_done_unstaking
    }
}

/// Possible status of an application
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd, Ord)]
pub enum ApplicationStage<BlockNumber> {
    /// Normal active state
    Active,

    /// Waiting for one or more unstakings, with a non-zero unstaking period, to complete.
    Unstaking {
        /// When deactivation was initiated.
        deactivation_initiated: BlockNumber,

        /// The cause of the deactivation.
        cause: ApplicationDeactivationCause,
    },

    ///  No longer active, can't do anything fun now.
    Inactive {
        /// When deactivation was initiated.
        deactivation_initiated: BlockNumber,

        /// When deactivation was completed, and the inactive state was established.
        deactivated: BlockNumber,

        /// The cause of the deactivation.
        cause: ApplicationDeactivationCause,
    },
}

/// Possible application deactivation causes
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, Copy, PartialOrd, Ord)]
pub enum ApplicationDeactivationCause {
    /// Deactivation initiated from outside
    External, // Add ID here for simplicity?

    /// Applicant was hired
    Hired,

    /// Applicant was not hired
    NotHired,

    /// Application was crowded out by another applicaiton
    CrowdedOut,

    /// Opening was cancelled
    OpeningCancelled,

    /// Review period expired
    ReviewPeriodExpired,

    /// Opening was filled
    OpeningFilled,
}

/// OpeningStage must be default constructible because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl<BlockNumber> Default for ApplicationStage<BlockNumber> {
    fn default() -> Self {
        ApplicationStage::Active
    }
}
