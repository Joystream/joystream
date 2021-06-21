#![warn(missing_docs)]

use codec::{Decode, Encode};
use sp_std::vec::Vec;

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_std::marker::PhantomData;

use common::{ActorId, MemberId};

/// Working group job application type alias.
pub type Application<T> = JobApplication<<T as frame_system::Trait>::AccountId, MemberId<T>>;

/// Type identifier for a worker role, which must be same as membership actor identifier.
pub type WorkerId<T> = ActorId<T>;

/// Type for an application id.
pub type ApplicationId = u64;

/// Type for an opening id.
pub type OpeningId = u64;

// ApplicationId - Application - helper struct.
pub(crate) struct ApplicationInfo<T: crate::Trait<I>, I: crate::Instance> {
    pub application_id: ApplicationId,
    pub application: Application<T>,
    pub marker: PhantomData<I>,
}

// WorkerId - Worker - helper struct.
pub(crate) struct WorkerInfo<T: common::membership::MembershipTypes + frame_system::Trait + balances::Trait> {
    pub worker_id: WorkerId<T>,
    pub worker: Worker<T>,
}

impl<T: common::membership::MembershipTypes + frame_system::Trait + balances::Trait>
    From<(WorkerId<T>, Worker<T>)> for WorkerInfo<T>
{
    fn from((worker_id, worker): (WorkerId<T>, Worker<T>)) -> Self {
        WorkerInfo { worker_id, worker }
    }
}

/// Group worker type alias.
pub type Worker<T> = GroupWorker<
    <T as frame_system::Trait>::AccountId,
    MemberId<T>,
    <T as frame_system::Trait>::BlockNumber,
    BalanceOf<T>,
>;

/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as balances::Trait>::Balance;

/// Job opening for the normal or leader position.
/// An opening represents the process of hiring one or more new actors into some available role.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Default, Clone, PartialEq, Eq)]
pub struct Opening<BlockNumber: Ord, Balance> {
    /// Defines opening type: Leader or worker.
    pub opening_type: OpeningType,

    /// Block at which opening was added.
    pub created: BlockNumber,

    /// Hash of the opening description.
    pub description_hash: Vec<u8>,

    /// Stake policy for the job opening.
    pub stake_policy: StakePolicy<BlockNumber, Balance>,

    /// Reward per block for the job opening.
    pub reward_per_block: Option<Balance>,

    /// Stake used to create the opening.
    pub creation_stake: Balance,
}

/// Defines type of the opening: regular working group fellow or group leader.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Clone, PartialEq, Eq, Copy)]
pub enum OpeningType {
    /// Group leader.
    Leader,

    /// Regular worker.
    Regular,
}

/// Must be default constructible because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl Default for OpeningType {
    fn default() -> Self {
        Self::Regular
    }
}

/// An application for the regular worker/lead role opening.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct JobApplication<AccountId, MemberId> {
    /// Account used to authenticate in this role.
    pub role_account_id: AccountId,

    /// Reward account id.
    pub reward_account_id: AccountId,

    /// Account used to stake in this role.
    pub staking_account_id: AccountId,

    /// Member applying.
    pub member_id: MemberId,

    /// Hash of the application description.
    pub description_hash: Vec<u8>,

    /// Opening ID for the application
    pub opening_id: OpeningId,
}

impl<AccountId: Clone, MemberId: Clone> JobApplication<AccountId, MemberId> {
    /// Creates a new job application using parameters.
    pub fn new(
        role_account_id: &AccountId,
        reward_account_id: &AccountId,
        staking_account_id: &AccountId,
        member_id: &MemberId,
        opening_id: OpeningId,
        description_hash: Vec<u8>,
    ) -> Self {
        JobApplication {
            role_account_id: role_account_id.clone(),
            reward_account_id: reward_account_id.clone(),
            staking_account_id: staking_account_id.clone(),
            member_id: member_id.clone(),
            opening_id,
            description_hash,
        }
    }
}

/// Working group participant: regular worker or lead.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct GroupWorker<AccountId, MemberId, BlockNumber, Balance> {
    /// Member id related to the worker/lead.
    pub member_id: MemberId,

    /// Account used to authenticate in this role.
    pub role_account_id: AccountId,

    /// Account used to stake in this role.
    pub staking_account_id: AccountId,

    /// Reward account id.
    pub reward_account_id: AccountId,

    /// Specifies the block when the worker chose to leave.
    pub started_leaving_at: Option<BlockNumber>,

    /// Unstaking period when the worker chooses to leave the role.
    ///
    /// It is defined by the job opening.
    pub job_unstaking_period: BlockNumber,

    /// Optional reward setting for the worker.
    pub reward_per_block: Option<Balance>,

    /// Total missed reward amount.
    pub missed_reward: Option<Balance>,

    /// Specifies the block when the worker was created.
    pub created_at: BlockNumber,
}

impl<AccountId: Clone, MemberId: Clone, BlockNumber, Balance>
    GroupWorker<AccountId, MemberId, BlockNumber, Balance>
{
    /// Creates a new _GroupWorker_ using parameters.
    pub fn new(
        member_id: &MemberId,
        role_account_id: &AccountId,
        reward_account_id: &AccountId,
        staking_account_id: &AccountId,
        job_unstaking_period: BlockNumber,
        reward_per_block: Option<Balance>,
        created_at: BlockNumber,
    ) -> Self {
        GroupWorker {
            member_id: member_id.clone(),
            role_account_id: role_account_id.clone(),
            reward_account_id: reward_account_id.clone(),
            staking_account_id: staking_account_id.clone(),
            started_leaving_at: None,
            job_unstaking_period,
            reward_per_block,
            missed_reward: None,
            created_at,
        }
    }

    /// Defines whether the worker is leaving the role.
    pub fn is_leaving(&self) -> bool {
        self.started_leaving_at.is_some()
    }
}

/// Stake policy for the job opening.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Clone, Default, PartialEq, Eq)]
pub struct StakePolicy<BlockNumber, Balance> {
    /// Stake amount for applicants.
    pub stake_amount: Balance,

    /// Unstaking period for the stake. Zero means no unstaking period.
    pub leaving_unstaking_period: BlockNumber,
}

/// Parameters container for the apply_on_opening extrinsic.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Clone, Default, PartialEq, Eq)]
pub struct ApplyOnOpeningParams<MemberId, OpeningId, AccountId, Balance> {
    /// Applying member id.
    pub member_id: MemberId,

    /// Opening id to apply on.
    pub opening_id: OpeningId,

    /// Role account id.
    pub role_account_id: AccountId,

    /// Reward account id.
    pub reward_account_id: AccountId,

    /// Application description.
    pub description: Vec<u8>,

    /// Stake information for the application.
    pub stake_parameters: StakeParameters<AccountId, Balance>,
}

/// Contains information for the stakes when applying for opening.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Clone, Default, PartialEq, Eq)]
pub struct StakeParameters<AccountId, Balance> {
    /// Stake balance.
    pub stake: Balance,

    /// Staking account id.
    pub staking_account_id: AccountId,
}

/// ApplyOnOpeningParams type alias.
pub type ApplyOnOpeningParameters<T> = ApplyOnOpeningParams<
    MemberId<T>,
    OpeningId,
    <T as frame_system::Trait>::AccountId,
    BalanceOf<T>,
>;

/// Reward payment type enum.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Clone, PartialEq, Eq, Copy)]
pub enum RewardPaymentType {
    /// The reward was missed.
    MissedReward,

    /// The reward was paid in time.
    RegularReward,
}
