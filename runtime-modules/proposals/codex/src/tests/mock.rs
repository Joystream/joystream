#![cfg(test)]

use frame_support::traits::LockIdentifier;
use frame_support::{impl_outer_dispatch, impl_outer_origin, parameter_types, weights::Weight};
pub use frame_system;
use frame_system::{EnsureOneOf, EnsureRoot, EnsureSigned};
use sp_core::H256;
use sp_runtime::curve::PiecewiseLinear;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    DispatchResult, Perbill,
};
use sp_staking::SessionIndex;
use staking_handler::{LockComparator, StakingManager};

use crate::{ProposalDetailsOf, ProposalEncoder, ProposalParameters};
use frame_support::dispatch::DispatchError;
use proposals_engine::VotersParameters;
use referendum::Balance as BalanceReferendum;
use sp_runtime::testing::TestXt;

impl_outer_origin! {
    pub enum Origin for Test {}
}

// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Test;
parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
}

impl_outer_dispatch! {
    pub enum Call for Test where origin: Origin {
        codex::ProposalCodex,
        proposals::ProposalsEngine,
        staking::Staking,
        frame_system::System,
    }
}

impl common::Trait for Test {
    type MemberId = u64;
    type ActorId = u64;
}

impl membership::Trait for Test {
    type Event = ();
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type WorkingGroup = ();
    type DefaultInitialInvitationBalance = ();
}

impl common::working_group::WorkingGroupIntegration<Test> for () {
    fn ensure_worker_origin(
        _origin: <Test as frame_system::Trait>::Origin,
        _worker_id: &<Test as common::Trait>::ActorId,
    ) -> DispatchResult {
        unimplemented!();
    }

    fn ensure_leader_origin(_origin: <Test as frame_system::Trait>::Origin) -> DispatchResult {
        unimplemented!()
    }

    fn get_leader_member_id() -> Option<<Test as common::Trait>::MemberId> {
        unimplemented!();
    }

    fn is_leader_account_id(_account_id: &<Test as frame_system::Trait>::AccountId) -> bool {
        unimplemented!()
    }

    fn is_worker_account_id(
        _account_id: &<Test as frame_system::Trait>::AccountId,
        _worker_id: &<Test as common::Trait>::ActorId,
    ) -> bool {
        unimplemented!()
    }
}

parameter_types! {
    pub const DefaultMembershipPrice: u64 = 100;
    pub const ExistentialDeposit: u32 = 0;
    pub const DefaultInitialInvitationBalance: u64 = 100;
}

impl balances::Trait for Test {
    type Balance = u64;
    type DustRemoval = ();
    type Event = ();
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type WeightInfo = ();
    type MaxLocks = ();
}

parameter_types! {
    pub const CancellationFee: u64 = 5;
    pub const RejectionFee: u64 = 3;
    pub const TitleMaxLength: u32 = 100;
    pub const DescriptionMaxLength: u32 = 10000;
    pub const MaxActiveProposalLimit: u32 = 100;
    pub const LockId: LockIdentifier = [2; 8];
}

pub struct MockProposalsEngineWeight;

impl proposals_engine::Trait for Test {
    type Event = ();
    type ProposerOriginValidator = ();
    type CouncilOriginValidator = ();
    type TotalVotersCounter = MockVotersParameters;
    type ProposalId = u32;
    type StakingHandler = StakingManager<Test, LockId>;
    type CancellationFee = CancellationFee;
    type RejectionFee = RejectionFee;
    type TitleMaxLength = TitleMaxLength;
    type DescriptionMaxLength = DescriptionMaxLength;
    type MaxActiveProposalLimit = MaxActiveProposalLimit;
    type DispatchableCallCode = crate::Call<Test>;
    type ProposalObserver = crate::Module<Test>;
    type WeightInfo = MockProposalsEngineWeight;
}

impl proposals_engine::WeightInfo for MockProposalsEngineWeight {
    fn vote(_: u32) -> Weight {
        0
    }

    fn cancel_proposal(_: u32) -> Weight {
        0
    }

    fn veto_proposal() -> Weight {
        0
    }

    fn on_initialize_immediate_execution_decode_fails(_: u32) -> Weight {
        0
    }

    fn on_initialize_pending_execution_decode_fails(_: u32) -> Weight {
        0
    }

    fn on_initialize_approved_pending_constitutionality(_: u32) -> Weight {
        0
    }

    fn on_initialize_rejected(_: u32) -> Weight {
        0
    }

    fn on_initialize_slashed(_: u32) -> Weight {
        0
    }
}

impl Default for crate::Call<Test> {
    fn default() -> Self {
        panic!("shouldn't call default for Call");
    }
}

impl minting::Trait for Test {
    type Currency = Balances;
    type MintId = u64;
}

impl common::origin::MemberOriginValidator<Origin, u64, u64> for () {
    fn ensure_member_controller_account_origin(
        origin: Origin,
        _: u64,
    ) -> Result<u64, DispatchError> {
        let account_id = frame_system::ensure_signed(origin)?;

        Ok(account_id)
    }

    fn is_member_controller_account(member_id: &u64, account_id: &u64) -> bool {
        member_id == account_id
    }
}

impl common::origin::CouncilOriginValidator<Origin, u64, u64> for () {
    fn ensure_member_consulate(origin: Origin, _: u64) -> DispatchResult {
        frame_system::ensure_signed(origin)?;

        Ok(())
    }
}

parameter_types! {
    pub const ThreadTitleLengthLimit: u32 = 200;
    pub const PostLengthLimit: u32 = 2000;
    pub const MaxWhiteListSize: u32 = 20;
}

pub struct MockProposalsDiscussionWeight;

impl proposals_discussion::Trait for Test {
    type Event = ();
    type AuthorOriginValidator = ();
    type CouncilOriginValidator = ();
    type ThreadId = u64;
    type PostId = u64;
    type MaxWhiteListSize = MaxWhiteListSize;
    type WeightInfo = MockProposalsDiscussionWeight;
}

impl proposals_discussion::WeightInfo for MockProposalsDiscussionWeight {
    fn add_post(_: u32) -> Weight {
        0
    }

    fn update_post() -> Weight {
        0
    }

    fn change_thread_mode(_: u32) -> Weight {
        0
    }
}

pub struct MockVotersParameters;
impl VotersParameters for MockVotersParameters {
    fn total_voters_count() -> u32 {
        4
    }
}

// The content directory working group instance alias.
pub type ContentDirectoryWorkingGroupInstance = working_group::Instance3;

// The storage working group instance alias.
pub type StorageWorkingGroupInstance = working_group::Instance2;

parameter_types! {
    pub const MaxWorkerNumberLimit: u32 = 100;
    pub const LockId1: [u8; 8] = [1; 8];
    pub const LockId2: [u8; 8] = [2; 8];
}

pub struct WorkingGroupWeightInfo;
impl working_group::Trait<ContentDirectoryWorkingGroupInstance> for Test {
    type Event = ();
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StakingManager<Self, LockId1>;
    type StakingAccountValidator = membership::Module<Test>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = WorkingGroupWeightInfo;
}

impl working_group::WeightInfo for WorkingGroupWeightInfo {
    fn on_initialize_leaving(_: u32) -> Weight {
        0
    }
    fn on_initialize_rewarding_with_missing_reward(_: u32) -> Weight {
        0
    }
    fn on_initialize_rewarding_with_missing_reward_cant_pay(_: u32) -> Weight {
        0
    }
    fn on_initialize_rewarding_without_missing_reward(_: u32) -> Weight {
        0
    }
    fn apply_on_opening(_: u32) -> Weight {
        0
    }
    fn fill_opening_lead() -> Weight {
        0
    }
    fn fill_opening_worker(_: u32) -> Weight {
        0
    }
    fn update_role_account() -> Weight {
        0
    }
    fn cancel_opening() -> Weight {
        0
    }
    fn withdraw_application() -> Weight {
        0
    }
    fn slash_stake(_: u32) -> Weight {
        0
    }
    fn terminate_role_worker(_: u32) -> Weight {
        0
    }
    fn terminate_role_lead(_: u32) -> Weight {
        0
    }
    fn increase_stake() -> Weight {
        0
    }
    fn decrease_stake() -> Weight {
        0
    }
    fn spend_from_budget() -> Weight {
        0
    }
    fn update_reward_amount() -> Weight {
        0
    }
    fn set_status_text(_: u32) -> Weight {
        0
    }
    fn update_reward_account() -> Weight {
        0
    }
    fn set_budget() -> Weight {
        0
    }
    fn add_opening(_: u32) -> Weight {
        0
    }
    fn leave_role_immediatly() -> Weight {
        0
    }
    fn leave_role_later() -> Weight {
        0
    }
}

impl working_group::Trait<StorageWorkingGroupInstance> for Test {
    type Event = ();
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StakingManager<Self, LockId2>;
    type StakingAccountValidator = membership::Module<Test>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = WorkingGroupWeightInfo;
}

impl recurring_rewards::Trait for Test {
    type PayoutStatusHandler = ();
    type RecipientId = u64;
    type RewardRelationshipId = u64;
}

pallet_staking_reward_curve::build! {
    const I_NPOS: PiecewiseLinear<'static> = curve!(
        min_inflation: 0_025_000,
        max_inflation: 0_100_000,
        ideal_stake: 0_500_000,
        falloff: 0_050_000,
        max_piece_count: 40,
        test_precision: 0_005_000,
    );
}

parameter_types! {
    pub const SessionsPerEra: SessionIndex = 3;
    pub const BondingDuration: staking::EraIndex = 3;
    pub const RewardCurve: &'static PiecewiseLinear<'static> = &I_NPOS;
}
impl staking::Trait for Test {
    type Currency = Balances;
    type UnixTime = Timestamp;
    type CurrencyToVote = ();
    type RewardRemainder = ();
    type Event = ();
    type Slash = ();
    type Reward = ();
    type SessionsPerEra = SessionsPerEra;
    type BondingDuration = BondingDuration;
    type SlashDeferDuration = ();
    type SlashCancelOrigin = frame_system::EnsureRoot<Self::AccountId>;
    type SessionInterface = Self;
    type RewardCurve = RewardCurve;
    type NextNewSession = ();
    type ElectionLookahead = ();
    type Call = Call;
    type MaxIterations = ();
    type MinSolutionScoreBump = ();
    type MaxNominatorRewardedPerValidator = ();
    type UnsignedPriority = ();
    type WeightInfo = ();
}

impl<LocalCall> frame_system::offchain::SendTransactionTypes<LocalCall> for Test
where
    Call: From<LocalCall>,
{
    type OverarchingCall = Call;
    type Extrinsic = Extrinsic;
}

pub type Extrinsic = TestXt<Call, ()>;

impl staking::SessionInterface<u64> for Test {
    fn disable_validator(_: &u64) -> Result<bool, ()> {
        unimplemented!()
    }

    fn validators() -> Vec<u64> {
        unimplemented!()
    }

    fn prune_historical_up_to(_: u32) {
        unimplemented!()
    }
}

parameter_types! {
    pub DefaultProposalParameters: ProposalParameters<u64, u64> = default_proposal_parameters();
}

pub(crate) fn default_proposal_parameters() -> ProposalParameters<u64, u64> {
    ProposalParameters {
        voting_period: 43200,
        grace_period: 0,
        approval_quorum_percentage: 66,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(100_000),
        constitutionality: 1,
    }
}

impl common::currency::GovernanceCurrency for Test {
    type Currency = balances::Module<Self>;
}

impl crate::Trait for Test {
    type MembershipOriginValidator = ();
    type ProposalEncoder = ();
    type SetValidatorCountProposalParameters = DefaultProposalParameters;
    type RuntimeUpgradeProposalParameters = DefaultProposalParameters;
    type TextProposalParameters = DefaultProposalParameters;
    type SpendingProposalParameters = DefaultProposalParameters;
    type AddWorkingGroupOpeningProposalParameters = DefaultProposalParameters;
    type FillWorkingGroupOpeningProposalParameters = DefaultProposalParameters;
    type SetWorkingGroupBudgetCapacityProposalParameters = DefaultProposalParameters;
    type DecreaseWorkingGroupLeaderStakeProposalParameters = DefaultProposalParameters;
    type SlashWorkingGroupLeaderStakeProposalParameters = DefaultProposalParameters;
    type SetWorkingGroupLeaderRewardProposalParameters = DefaultProposalParameters;
    type TerminateWorkingGroupLeaderRoleProposalParameters = DefaultProposalParameters;
    type AmendConstitutionProposalParameters = DefaultProposalParameters;
}

parameter_types! {
    pub const MinNumberOfExtraCandidates: u64 = 1;
    pub const AnnouncingPeriodDuration: u64 = 15;
    pub const IdlePeriodDuration: u64 = 27;
    pub const CouncilSize: u64 = 3;
    pub const MinCandidateStake: u64 = 11000;
    pub const CandidacyLockId: LockIdentifier = *b"council1";
    pub const CouncilorLockId: LockIdentifier = *b"council2";
    pub const ElectedMemberRewardPerBlock: u64 = 100;
    pub const ElectedMemberRewardPeriod: u64 = 10;
    pub const BudgetRefillAmount: u64 = 1000;
    // intentionally high number that prevents side-effecting tests other than  budget refill tests
    pub const BudgetRefillPeriod: u64 = 1000;
}

pub type ReferendumInstance = referendum::Instance0;

impl council::Trait for Test {
    type Event = ();

    type Referendum = referendum::Module<Test, ReferendumInstance>;

    type MinNumberOfExtraCandidates = MinNumberOfExtraCandidates;
    type CouncilSize = CouncilSize;
    type AnnouncingPeriodDuration = AnnouncingPeriodDuration;
    type IdlePeriodDuration = IdlePeriodDuration;
    type MinCandidateStake = MinCandidateStake;

    type CandidacyLock = StakingManager<Self, CandidacyLockId>;
    type CouncilorLock = StakingManager<Self, CouncilorLockId>;

    type ElectedMemberRewardPerBlock = ElectedMemberRewardPerBlock;
    type ElectedMemberRewardPeriod = ElectedMemberRewardPeriod;

    type BudgetRefillAmount = BudgetRefillAmount;
    type BudgetRefillPeriod = BudgetRefillPeriod;

    type StakingAccountValidator = ();

    fn new_council_elected(_: &[council::CouncilMemberOf<Self>]) {}

    type MemberOriginValidator = ();
}

impl common::StakingAccountValidator<Test> for () {
    fn is_member_staking_account(_: &u64, _: &u64) -> bool {
        true
    }
}

parameter_types! {
    pub const VoteStageDuration: u64 = 19;
    pub const RevealStageDuration: u64 = 23;
    pub const MinimumVotingStake: u64 = 10000;
    pub const MaxSaltLength: u64 = 32; // use some multiple of 8 for ez testing
    pub const VotingLockId: LockIdentifier = *b"referend";
}

impl referendum::Trait<ReferendumInstance> for Test {
    type Event = ();

    type MaxSaltLength = MaxSaltLength;

    type Currency = balances::Module<Self>;
    type LockId = VotingLockId;

    type ManagerOrigin =
        EnsureOneOf<Self::AccountId, EnsureSigned<Self::AccountId>, EnsureRoot<Self::AccountId>>;

    type VotePower = u64;

    type VoteStageDuration = VoteStageDuration;
    type RevealStageDuration = RevealStageDuration;

    type MinimumStake = MinimumVotingStake;

    fn calculate_vote_power(
        _: &<Self as frame_system::Trait>::AccountId,
        _: &BalanceReferendum<Self, ReferendumInstance>,
    ) -> Self::VotePower {
        1
    }

    fn can_unlock_vote_stake(
        _: &referendum::CastVote<
            Self::Hash,
            BalanceReferendum<Self, ReferendumInstance>,
            Self::MemberId,
        >,
    ) -> bool {
        true
    }

    fn process_results(winners: &[referendum::OptionResult<Self::MemberId, Self::VotePower>]) {
        let tmp_winners: Vec<referendum::OptionResult<Self::MemberId, Self::VotePower>> = winners
            .iter()
            .map(|item| referendum::OptionResult {
                option_id: item.option_id,
                vote_power: item.vote_power.into(),
            })
            .collect();
        <council::Module<Test> as council::ReferendumConnection<Test>>::recieve_referendum_results(
            tmp_winners.as_slice(),
        );
    }

    fn is_valid_option_id(option_index: &u64) -> bool {
        <council::Module<Test> as council::ReferendumConnection<Test>>::is_valid_candidate_id(
            option_index,
        )
    }

    fn get_option_power(option_id: &u64) -> Self::VotePower {
        <council::Module<Test> as council::ReferendumConnection<Test>>::get_option_power(option_id)
    }

    fn increase_option_power(option_id: &u64, amount: &Self::VotePower) {
        <council::Module<Test> as council::ReferendumConnection<Test>>::increase_option_power(
            option_id, amount,
        );
    }
}

impl ProposalEncoder<Test> for () {
    fn encode_proposal(_proposal_details: ProposalDetailsOf<Test>) -> Vec<u8> {
        Vec::new()
    }
}

impl frame_system::Trait for Test {
    type BaseCallFilter = ();
    type Origin = Origin;
    type Call = Call;
    type Index = u64;
    type BlockNumber = u64;
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u64;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type Event = ();
    type BlockHashCount = BlockHashCount;
    type MaximumBlockWeight = MaximumBlockWeight;
    type DbWeight = ();
    type BlockExecutionWeight = ();
    type ExtrinsicBaseWeight = ();
    type MaximumExtrinsicWeight = ();
    type MaximumBlockLength = MaximumBlockLength;
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = ();
    type PalletInfo = ();
    type AccountData = balances::AccountData<u64>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type SystemWeightInfo = ();
}

impl pallet_timestamp::Trait for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

impl LockComparator<<Test as balances::Trait>::Balance> for Test {
    fn are_locks_conflicting(
        _new_lock: &LockIdentifier,
        _existing_locks: &[LockIdentifier],
    ) -> bool {
        false
    }
}

pub fn initial_test_ext() -> sp_io::TestExternalities {
    let t = frame_system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    t.into()
}

pub type Staking = staking::Module<Test>;
pub type ProposalCodex = crate::Module<Test>;
pub type ProposalsEngine = proposals_engine::Module<Test>;
pub type Balances = balances::Module<Test>;
pub type Timestamp = pallet_timestamp::Module<Test>;
pub type System = frame_system::Module<Test>;
