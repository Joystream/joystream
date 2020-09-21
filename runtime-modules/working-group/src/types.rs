#![warn(missing_docs)]

use codec::{Decode, Encode};
use sp_std::collections::btree_set::BTreeSet;

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

/// Terms for slashes applied to a given role.
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

/// Must be default constructable because it indirectly is a value in a storage map.
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
    pub terminate_application_stake_unstaking_period: Option<BlockNumber>,

    /// When terminating a worke/leadr: unstaking period for role stake.
    pub terminate_role_stake_unstaking_period: Option<BlockNumber>,

    /// When a worker/lead exists: unstaking period for application stake.
    pub exit_role_application_stake_unstaking_period: Option<BlockNumber>,

    /// When a worker/lead exists: unstaking period for role stake.
    pub exit_role_stake_unstaking_period: Option<BlockNumber>,
}

/// An opening for a worker or lead role.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct Opening<OpeningId, BlockNumber, Balance, WorkerApplicationId: core::cmp::Ord> {
    /// Identifier for underlying opening in the hiring module.
    pub hiring_opening_id: OpeningId,

    /// Set of identifiers for all worker applications ever added.
    pub applications: BTreeSet<WorkerApplicationId>,

    /// Commitment to policies in opening.
    pub policy_commitment: OpeningPolicyCommitment<BlockNumber, Balance>,

    /// Defines opening type: Leader or worker.
    pub opening_type: OpeningType,
}

/// Defines type of the opening: regular working group fellow or group leader.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Clone, PartialEq, Eq, Copy)]
pub enum OpeningType {
    /// Group leader.
    Leader,

    /// Regular worker.
    Worker,
}

/// Must be default constructible because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl Default for OpeningType {
    fn default() -> Self {
        Self::Worker
    }
}

/// An application for the worker/lead role.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct Application<AccountId, OpeningId, MemberId, ApplicationId> {
    /// Account used to authenticate in this role.
    pub role_account_id: AccountId,

    /// Opening on which this application applies.
    pub opening_id: OpeningId,

    /// Member applying.
    pub member_id: MemberId,

    /// Underlying application in hiring module.
    pub hiring_application_id: ApplicationId,
}

impl<AccountId: Clone, OpeningId: Clone, MemberId: Clone, ApplicationId: Clone>
    Application<AccountId, OpeningId, MemberId, ApplicationId>
{
    /// Creates a new worker application using parameters.
    pub fn new(
        role_account_id: &AccountId,
        opening_id: &OpeningId,
        member_id: &MemberId,
        application_id: &ApplicationId,
    ) -> Self {
        Application {
            role_account_id: role_account_id.clone(),
            opening_id: opening_id.clone(),
            member_id: member_id.clone(),
            hiring_application_id: application_id.clone(),
        }
    }
}

/// Role stake information for a worker/lead.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct RoleStakeProfile<StakeId, BlockNumber> {
    /// Whether participant is staked, and if so, the identifier for this staking in the staking module.
    pub stake_id: StakeId,

    /// Unstaking period when terminated.
    pub termination_unstaking_period: Option<BlockNumber>,

    /// Unstaking period when exiting.
    pub exit_unstaking_period: Option<BlockNumber>,
}

impl<StakeId: Clone, BlockNumber: Clone> RoleStakeProfile<StakeId, BlockNumber> {
    /// Creates a new worker/lead role stake profile using stake parameters.
    pub fn new(
        stake_id: &StakeId,
        termination_unstaking_period: &Option<BlockNumber>,
        exit_unstaking_period: &Option<BlockNumber>,
    ) -> Self {
        Self {
            stake_id: stake_id.clone(),
            termination_unstaking_period: termination_unstaking_period.clone(),
            exit_unstaking_period: exit_unstaking_period.clone(),
        }
    }
}

/// Working group participant: worker/lead.
/// This role can be staked, have reward and be inducted through the hiring module.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct Worker<AccountId, RewardRelationshipId, StakeId, BlockNumber, MemberId> {
    /// Member id related to the worker/lead.
    pub member_id: MemberId,

    /// Account used to authenticate in this role.
    pub role_account_id: AccountId,

    /// Whether the role has recurring reward, and if so an identifier for this.
    pub reward_relationship: Option<RewardRelationshipId>,

    /// When set, describes role stake of the worker/lead.
    pub role_stake_profile: Option<RoleStakeProfile<StakeId, BlockNumber>>,
}

impl<
        AccountId: Clone,
        RewardRelationshipId: Clone,
        StakeId: Clone,
        BlockNumber: Clone,
        MemberId: Clone,
    > Worker<AccountId, RewardRelationshipId, StakeId, BlockNumber, MemberId>
{
    /// Creates a new _Worker_ using parameters.
    pub fn new(
        member_id: &MemberId,
        role_account_id: &AccountId,
        reward_relationship: &Option<RewardRelationshipId>,
        role_stake_profile: &Option<RoleStakeProfile<StakeId, BlockNumber>>,
    ) -> Self {
        Worker {
            member_id: member_id.clone(),
            role_account_id: role_account_id.clone(),
            reward_relationship: reward_relationship.clone(),
            role_stake_profile: role_stake_profile.clone(),
        }
    }
}

/// Origin of exit initiation.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Clone, PartialEq)]
pub enum ExitInitiationOrigin {
    /// Lead fires the worker.
    Lead,

    /// Worker leaves the position.
    Worker,

    /// Council fires the leader.
    Sudo,
}

/// The recurring reward if any to be assigned to an actor when filling in the position.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Debug)]
pub struct RewardPolicy<Balance, BlockNumber> {
    /// Balance per payout.
    pub amount_per_payout: Balance,

    /// Next payment time (in blocks).
    pub next_payment_at_block: BlockNumber,

    /// Optional payout interval.
    pub payout_interval: Option<BlockNumber>,
}
