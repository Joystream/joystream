#![warn(missing_docs)]

use codec::{Decode, Encode};
use rstd::borrow::ToOwned;
use rstd::collections::btree_set::BTreeSet;
use rstd::vec::Vec;

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

/// Terms for slashings applied to a given role.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Clone, PartialEq, Eq)]
pub struct SlashableTerms {
    /// Maximum number of slashes.
    pub max_count: u16,

    /// Maximum percentage points of remaining stake which may be slashed in a single slash.
    pub max_percent_pts_per_time: u16,
}

/// Terms for what slashing can be applied in some context.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Clone, PartialEq, Eq)]
pub enum SlashingTerms {
    /// Cannot be slashed.
    Unslashable,

    /// Can be slashed.
    Slashable(SlashableTerms),
}

/// Must be default constructible because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl Default for SlashingTerms {
    fn default() -> Self {
        Self::Unslashable
    }
}

/// A commitment to the set of policy variables relevant to an opening.
/// An applicant can observe this commitment and be secure that the terms
/// of the application process cannot be changed ex-post.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Clone, Default, PartialEq, Eq)]
pub struct OpeningPolicyCommitment<BlockNumber, Balance> {
    /// Rationing to be used.
    pub application_rationing_policy: Option<hiring::ApplicationRationingPolicy>,

    /// Maximum length of review period of applications.
    pub max_review_period_length: BlockNumber,

    /// Staking policy for application.
    pub application_staking_policy: Option<hiring::StakingPolicy<Balance, BlockNumber>>,

    /// Staking policy for role itself.
    pub role_staking_policy: Option<hiring::StakingPolicy<Balance, BlockNumber>>,

    /// Slashing terms during role, NOT application itself!
    pub role_slashing_terms: SlashingTerms,

    /// When filling an opening: unstaking period for application stake of successful applicants.
    pub fill_opening_successful_applicant_application_stake_unstaking_period: Option<BlockNumber>,

    /// When filling an opening: unstaking period for the application stake of failed applicants.
    pub fill_opening_failed_applicant_application_stake_unstaking_period: Option<BlockNumber>,

    /// When filling an opening: unstaking period for the role stake of failed applicants.
    pub fill_opening_failed_applicant_role_stake_unstaking_period: Option<BlockNumber>,

    /// When terminating a worker: unstaking period for application stake.
    pub terminate_worker_application_stake_unstaking_period: Option<BlockNumber>,

    /// When terminating a worker: unstaking period for role stake.
    pub terminate_worker_role_stake_unstaking_period: Option<BlockNumber>,

    /// When a worker exists: unstaking period for application stake.
    pub exit_worker_role_application_stake_unstaking_period: Option<BlockNumber>,

    /// When a worker exists: unstaking period for role stake.
    pub exit_worker_role_stake_unstaking_period: Option<BlockNumber>,
}

/// An opening for a worker role.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct WorkerOpening<OpeningId, BlockNumber, Balance, WorkerApplicationId: core::cmp::Ord> {
    /// Identifer for underlying opening in the hiring module.
    pub opening_id: OpeningId,

    /// Set of identifiers for all worker applications ever added.
    pub worker_applications: BTreeSet<WorkerApplicationId>,

    /// Commitment to policies in opening.
    pub policy_commitment: OpeningPolicyCommitment<BlockNumber, Balance>,
}

/// Working group lead: worker lead.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct Lead<MemberId, AccountId> {
    /// Member id of the leader.
    pub member_id: MemberId,

    /// Account used to authenticate in this role.
    pub role_account_id: AccountId,
}

/// An application for the worker role.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct WorkerApplication<AccountId, WorkerOpeningId, MemberId, ApplicationId> {
    /// Account used to authenticate in this role.
    pub role_account: AccountId,

    /// Opening on which this application applies.
    pub worker_opening_id: WorkerOpeningId,

    /// Member applying.
    pub member_id: MemberId,

    /// Underlying application in hiring module.
    pub application_id: ApplicationId,
}

impl<AccountId: Clone, WorkerOpeningId: Clone, MemberId: Clone, ApplicationId: Clone>
    WorkerApplication<AccountId, WorkerOpeningId, MemberId, ApplicationId>
{
    /// Creates a new worker application using parameters.
    pub fn new(
        role_account: &AccountId,
        worker_opening_id: &WorkerOpeningId,
        member_id: &MemberId,
        application_id: &ApplicationId,
    ) -> Self {
        WorkerApplication {
            role_account: (*role_account).clone(),
            worker_opening_id: (*worker_opening_id).clone(),
            member_id: (*member_id).clone(),
            application_id: (*application_id).clone(),
        }
    }
}

/// Role stake information for a worker.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct WorkerRoleStakeProfile<StakeId, BlockNumber> {
    /// Whether participant is staked, and if so, the identifier for this staking in the staking module.
    pub stake_id: StakeId,

    /// Unstaking period when terminated.
    pub termination_unstaking_period: Option<BlockNumber>,

    /// Unstaking period when exiting.
    pub exit_unstaking_period: Option<BlockNumber>,
}

impl<StakeId: Clone, BlockNumber: Clone> WorkerRoleStakeProfile<StakeId, BlockNumber> {
    /// Creates a new worker role stake profile using stake parameters.
    pub fn new(
        stake_id: &StakeId,
        termination_unstaking_period: &Option<BlockNumber>,
        exit_unstaking_period: &Option<BlockNumber>,
    ) -> Self {
        Self {
            stake_id: (*stake_id).clone(),
            termination_unstaking_period: (*termination_unstaking_period).clone(),
            exit_unstaking_period: (*exit_unstaking_period).clone(),
        }
    }
}

/// Working group participant: worker.
/// This role can be staked, have reward and be inducted through the hiring module.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct Worker<AccountId, RewardRelationshipId, StakeId, BlockNumber> {
    /// Account used to authenticate in this role.
    pub role_account: AccountId,
    /// Whether the role has recurring reward, and if so an identifier for this.
    pub reward_relationship: Option<RewardRelationshipId>,
    /// When set, describes role stake of worker.
    pub role_stake_profile: Option<WorkerRoleStakeProfile<StakeId, BlockNumber>>,
    /// The stage of this worker in the working group.
    pub stage: WorkerRoleStage<BlockNumber>,
}

impl<AccountId: Clone, RewardRelationshipId: Clone, StakeId: Clone, BlockNumber: Clone>
    Worker<AccountId, RewardRelationshipId, StakeId, BlockNumber>
{
    /// Creates a new _Worker_ using parameters.
    pub fn new(
        role_account: &AccountId,
        reward_relationship: &Option<RewardRelationshipId>,
        role_stake_profile: &Option<WorkerRoleStakeProfile<StakeId, BlockNumber>>,
        stage: &WorkerRoleStage<BlockNumber>,
    ) -> Self {
        Worker {
            role_account: (*role_account).clone(),
            reward_relationship: (*reward_relationship).clone(),
            role_stake_profile: (*role_stake_profile).clone(),
            stage: (*stage).clone(),
        }
    }
}

/// The stage of the involvement of a curator in the working group.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Clone, PartialEq)]
pub enum WorkerRoleStage<BlockNumber> {
    /// Currently active.
    Active,

    /// Currently unstaking.
    Unstaking(WorkerExitSummary<BlockNumber>),

    /// No longer active and unstaked.
    Exited(WorkerExitSummary<BlockNumber>),
}

/// Must be default constructible because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl<BlockNumber> Default for WorkerRoleStage<BlockNumber> {
    fn default() -> Self {
        WorkerRoleStage::Active
    }
}

/// The exit stage of a curators involvement in the working group.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Clone, PartialEq)]
pub struct WorkerExitSummary<BlockNumber> {
    /// Origin for exit.
    pub origin: WorkerExitInitiationOrigin,

    /// When exit was initiated.
    pub initiated_at_block_number: BlockNumber,

    /// Explainer for why exit was initiated.
    pub rationale_text: Vec<u8>,
}

impl<BlockNumber: Clone> WorkerExitSummary<BlockNumber> {
    pub fn new(
        origin: &WorkerExitInitiationOrigin,
        initiated_at_block_number: &BlockNumber,
        rationale_text: &[u8],
    ) -> Self {
        WorkerExitSummary {
            origin: (*origin).clone(),
            initiated_at_block_number: (*initiated_at_block_number).clone(),
            rationale_text: rationale_text.to_owned(),
        }
    }
}

/// Origin of exit initiation on behalf of a curator.'
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Clone, PartialEq)]
pub enum WorkerExitInitiationOrigin {
    /// Lead is origin.
    Lead,

    /// The curator exiting is the origin.
    Worker,
}

/// The recurring reward if any to be assigned to an actor when filling in the position.
#[derive(Encode, Decode, Clone, Eq, PartialEq, Debug)]
pub struct RewardPolicy<Balance, BlockNumber> {
    /// Balance per payout.
    pub amount_per_payout: Balance,

    /// Next payment time (in blocks).
    pub next_payment_at_block: BlockNumber,

    /// Optional payout interval.
    pub payout_interval: Option<BlockNumber>,
}

/// Represents a possible unstaker in working group.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd)]
pub enum WorkingGroupUnstaker<MemberId, WorkerId> {
    /// Lead unstaker.
    Lead(MemberId),

    /// Worker unstaker.
    Worker(WorkerId),
}

/// Must be default constructable because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl<MemberId: Default, WorkerId> Default for WorkingGroupUnstaker<MemberId, WorkerId> {
    fn default() -> Self {
        Self::Lead(MemberId::default())
    }
}
