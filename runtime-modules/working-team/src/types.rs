#![warn(missing_docs)]

use codec::{Decode, Encode};

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

/// Team job application type alias.
pub type JobApplication<T, I> =
    Application<<T as system::Trait>::AccountId, <T as crate::Trait<I>>::OpeningId, MemberId<T>>;

/// Member identifier in membership::member module.
pub type MemberId<T> = <T as membership::Trait>::MemberId;

/// Type identifier for a worker role, which must be same as membership actor identifier.
pub type TeamWorkerId<T> = <T as membership::Trait>::ActorId;

// ApplicationId - JobApplication - helper tuple.
pub(crate) type ApplicationInfo<T, I> =
    (<T as crate::Trait<I>>::ApplicationId, JobApplication<T, I>);

/// Team worker type alias.
pub type TeamWorker<T> = Worker<<T as system::Trait>::AccountId, MemberId<T>>;

/// Job opening for the normal or leader position.
/// An opening represents the process of hiring one or more new actors into some available role.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Default, Clone, PartialEq, Eq)]
pub struct JobOpening<BlockNumber: Ord> {
    /// Defines opening type: Leader or worker.
    pub opening_type: JobOpeningType,

    /// Block at which opening was added.
    pub created: BlockNumber,

    /// Hash of the opening description.
    pub description_hash: Vec<u8>,
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
pub struct Application<AccountId, OpeningId, MemberId> {
    /// Account used to authenticate in this role.
    pub role_account_id: AccountId,

    /// Opening on which this application applies.
    pub opening_id: OpeningId,

    /// Member applying.
    pub member_id: MemberId,

    /// Hash of the application description.
    pub description_hash: Vec<u8>,
}

impl<AccountId: Clone, OpeningId: Clone, MemberId: Clone>
    Application<AccountId, OpeningId, MemberId>
{
    /// Creates a new job application using parameters.
    pub fn new(
        role_account_id: &AccountId,
        opening_id: &OpeningId,
        member_id: &MemberId,
        description_hash: Vec<u8>,
    ) -> Self {
        Application {
            role_account_id: role_account_id.clone(),
            opening_id: opening_id.clone(),
            member_id: member_id.clone(),
            description_hash,
        }
    }
}

/// Working team participant: regular worker or lead.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct Worker<AccountId, MemberId> {
    /// Member id related to the worker/lead.
    pub member_id: MemberId,

    /// Account used to authenticate in this role.
    pub role_account_id: AccountId,
}

impl<AccountId: Clone, MemberId: Clone> Worker<AccountId, MemberId> {
    /// Creates a new _TeamWorker_ using parameters.
    pub fn new(member_id: &MemberId, role_account_id: &AccountId) -> Self {
        Worker {
            member_id: member_id.clone(),
            role_account_id: role_account_id.clone(),
        }
    }
}
