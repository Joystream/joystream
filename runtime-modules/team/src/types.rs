#![warn(missing_docs)]

use codec::{Decode, Encode};
use sp_std::collections::btree_set::BTreeSet;

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

/// Job opening for the normal or leader position.
/// An opening represents the process of hiring one or more new actors into some available role.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Default, Clone, PartialEq, Eq)]
pub struct JobOpening<BlockNumber, ApplicationId: Ord> {
    /// Set of identifiers for all worker applications ever added.
    pub applications: BTreeSet<ApplicationId>,

    /// Defines opening type: Leader or worker.
    pub opening_type: JobOpeningType,

    /// Block at which opening was added.
    pub created: BlockNumber,

    /// Hash of the opening description.
    pub description_hash: Vec<u8>,

    /// Opening status.
    pub is_active: bool,
}

/// Defines type of the opening: regular working group fellow or group leader.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Clone, PartialEq, Eq, Copy)]
pub enum JobOpeningType {
    /// Group leader.
    Leader,

    /// Regular worker.
    Regular,
}

/// Must be default constructible because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl Default for JobOpeningType {
    fn default() -> Self {
        Self::Regular
    }
}

/// An application for the regular worker/lead role opening.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct JobApplication<AccountId, OpeningId, MemberId> {
    /// Account used to authenticate in this role.
    pub role_account_id: AccountId,

    /// Opening on which this application applies.
    pub opening_id: OpeningId,

    /// Member applying.
    pub member_id: MemberId,
}

impl<AccountId: Clone, OpeningId: Clone, MemberId: Clone>
    JobApplication<AccountId, OpeningId, MemberId>
{
    /// Creates a new job application using parameters.
    pub fn new(role_account_id: &AccountId, opening_id: &OpeningId, member_id: &MemberId) -> Self {
        JobApplication {
            role_account_id: role_account_id.clone(),
            opening_id: opening_id.clone(),
            member_id: member_id.clone(),
        }
    }
}
