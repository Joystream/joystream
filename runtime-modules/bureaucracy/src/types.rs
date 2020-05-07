use codec::{Decode, Encode};
use rstd::collections::btree_set::BTreeSet;
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

/// Terms for slashings applied to a given role
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Clone, PartialEq, Eq)]
pub struct SlashableTerms {
    /// Maximum number of slashes.
    pub max_count: u16,

    /// Maximum percentage points of remaining stake which may be slashed in a single slash.
    pub max_percent_pts_per_time: u16,
}

/// Terms for what slashing can be applied in some context
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Clone, PartialEq, Eq)]
pub enum SlashingTerms {
    Unslashable,
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
    /// Rationing to be used
    pub application_rationing_policy: Option<hiring::ApplicationRationingPolicy>,

    /// Maximum length of review period of applications
    pub max_review_period_length: BlockNumber,

    /// Staking policy for application
    pub application_staking_policy: Option<hiring::StakingPolicy<Balance, BlockNumber>>,

    /// Staking policy for role itself
    pub role_staking_policy: Option<hiring::StakingPolicy<Balance, BlockNumber>>,

    // Slashing terms during application
    // pub application_slashing_terms: SlashingTerms,

    // Slashing terms during role, NOT application itself!
    pub role_slashing_terms: SlashingTerms,

    /// When filling an opening: Unstaking period for application stake of successful applicants
    pub fill_opening_successful_applicant_application_stake_unstaking_period: Option<BlockNumber>,

    /// When filling an opening:
    pub fill_opening_failed_applicant_application_stake_unstaking_period: Option<BlockNumber>,

    /// When filling an opening:
    pub fill_opening_failed_applicant_role_stake_unstaking_period: Option<BlockNumber>,

    /// When terminating a curator:
    pub terminate_curator_application_stake_unstaking_period: Option<BlockNumber>,

    /// When terminating a curator:
    pub terminate_curator_role_stake_unstaking_period: Option<BlockNumber>,

    /// When a curator exists: ..
    pub exit_curator_role_application_stake_unstaking_period: Option<BlockNumber>,

    /// When a curator exists: ..
    pub exit_curator_role_stake_unstaking_period: Option<BlockNumber>,
}

/// An opening for a curator role.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct CuratorOpening<OpeningId, BlockNumber, Balance, CuratorApplicationId: core::cmp::Ord> {
    /// Identifer for underlying opening in the hiring module.
    pub opening_id: OpeningId,

    /// Set of identifiers for all curator applications ever added
    pub curator_applications: BTreeSet<CuratorApplicationId>,

    /// Commitment to policies in opening.
    pub policy_commitment: OpeningPolicyCommitment<BlockNumber, Balance>,
}

/// Working group lead: curator lead
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct Lead<MemberId, AccountId> {
    /// Member id of the leader
    pub member_id: MemberId,

    /// Account used to authenticate in this role,
    pub role_account_id: AccountId,
}

/// An application for the curator role.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct CuratorApplication<AccountId, CuratorOpeningId, MemberId, ApplicationId> {
    /// Account used to authenticate in this role,
    pub role_account: AccountId,

    /// Opening on which this application applies
    pub curator_opening_id: CuratorOpeningId,

    /// Member applying
    pub member_id: MemberId,

    /// Underlying application in hiring module
    pub application_id: ApplicationId,
}

impl<AccountId: Clone, CuratorOpeningId: Clone, MemberId: Clone, ApplicationId: Clone>
    CuratorApplication<AccountId, CuratorOpeningId, MemberId, ApplicationId>
{
    pub fn new(
        role_account: &AccountId,
        curator_opening_id: &CuratorOpeningId,
        member_id: &MemberId,
        application_id: &ApplicationId,
    ) -> Self {
        CuratorApplication {
            role_account: (*role_account).clone(),
            curator_opening_id: (*curator_opening_id).clone(),
            member_id: (*member_id).clone(),
            application_id: (*application_id).clone(),
        }
    }
}

/// Role stake information for a curator.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct CuratorRoleStakeProfile<StakeId, BlockNumber> {
    /// Whether participant is staked, and if so, the identifier for this staking in the staking module.
    pub stake_id: StakeId,

    /// Unstaking period when terminated.
    pub termination_unstaking_period: Option<BlockNumber>,

    /// Unstaking period when exiting.
    pub exit_unstaking_period: Option<BlockNumber>,
}

impl<StakeId: Clone, BlockNumber: Clone> CuratorRoleStakeProfile<StakeId, BlockNumber> {
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

/// Working group participant: curator
/// This role can be staked, have reward and be inducted through the hiring module.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct Curator<
    AccountId,
    //    RewardRelationshipId,
    //    StakeId,
    //    BlockNumber,
    //    LeadId,
    //    CuratorApplicationId,
    //    PrincipalId,
> {
    /// Account used to authenticate in this role,
    pub role_account: AccountId,
    //    /// Whether the role has recurring reward, and if so an identifier for this.
    //    pub reward_relationship: Option<RewardRelationshipId>,
    //    /// When set, describes role stake of curator.
    //    pub role_stake_profile: Option<CuratorRoleStakeProfile<StakeId, BlockNumber>>,
    //    /// The stage of this curator in the working group.
    //    pub stage: CuratorRoleStage<BlockNumber>,

    //    /// How the curator was inducted into the working group.
    //    pub induction: CuratorInduction<LeadId, CuratorApplicationId, BlockNumber>,

    //    /// Permissions module principal id
    //    pub principal_id: PrincipalId,
}

impl<
        AccountId: Clone,
        //    RewardRelationshipId: Clone,
        //        StakeId: Clone,
        //        BlockNumber: Clone,
        //    LeadId: Clone,
        //    ApplicationId: Clone,
        //    PrincipalId: Clone,
    >
    Curator<
        AccountId,
        //    RewardRelationshipId,
        //        StakeId,
        //        BlockNumber,
        //    LeadId,
        //    ApplicationId,
        //    PrincipalId,
    >
{
    pub fn new(
        role_account: &AccountId,
        //        reward_relationship: &Option<RewardRelationshipId>,
        //        role_stake_profile: &Option<CuratorRoleStakeProfile<StakeId, BlockNumber>>,
        //        stage: &CuratorRoleStage<BlockNumber>,
        //        induction: &CuratorInduction<LeadId, ApplicationId, BlockNumber>,
        //        principal_id: &PrincipalId,
    ) -> Self {
        Curator {
            role_account: (*role_account).clone(),
            //            reward_relationship: (*reward_relationship).clone(),
            //            role_stake_profile: (*role_stake_profile).clone(),
            //            stage: (*stage).clone(),
            //            induction: (*induction).clone(),
            //            principal_id: (*principal_id).clone(),
        }
    }
}
