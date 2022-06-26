#![cfg(test)]
// Internal substrate warning.
#![allow(non_fmt_panics)]

use frame_election_provider_support::{
    onchain, SequentialPhragmen, SortedListProvider, VoteWeight,
};
use frame_support::{
    dispatch::DispatchError,
    parameter_types,
    traits::{
        ConstU16, ConstU32, ConstU64, Currency, EnsureOneOf, FindAuthor, Imbalance, LockIdentifier,
        OnFinalize, OnInitialize, OnUnbalanced, OneSessionHandler,
    },
    weights::{constants::RocksDbWeight, Weight},
    PalletId,
};
pub use frame_system;
use frame_system::{EnsureRoot, EnsureSigned};
use sp_core::H256;
use sp_runtime::curve::PiecewiseLinear;
use sp_runtime::{
    testing::{Header, TestXt, UintAuthorityId},
    traits::{BlakeTwo256, IdentityLookup, Zero},
    DispatchResult, Perbill,
};

use sp_staking::{
    offence::{DisableStrategy, OffenceDetails, OnOffenceHandler},
    EraIndex, SessionIndex,
};
use staking_handler::{LockComparator, StakingManager};

use crate as proposals_codex;
use crate::{ProposalDetailsOf, ProposalEncoder, ProposalParameters};
use proposals_engine::VotersParameters;

use sp_std::collections::btree_map::BTreeMap;
use sp_std::convert::{TryFrom, TryInto};
use std::cell::RefCell;

type NegativeImbalance = <Balances as Currency<AccountId>>::NegativeImbalance;
type PositiveImbalance = <Balances as Currency<AccountId>>::PositiveImbalance;

pub const INIT_TIMESTAMP: u64 = 30_000;
pub const BLOCK_TIME: u64 = 1000;

/// The AccountId alias in this test module.
pub(crate) type AccountId = u64;
pub(crate) type AccountIndex = u64;
pub(crate) type BlockNumber = u64;
pub(crate) type Balance = u64;

/// Another session handler struct to test on_disabled.
pub struct OtherSessionHandler;
impl OneSessionHandler<AccountId> for OtherSessionHandler {
    type Key = UintAuthorityId;

    fn on_genesis_session<'a, I: 'a>(_: I)
    where
        I: Iterator<Item = (&'a AccountId, Self::Key)>,
        AccountId: 'a,
    {
    }

    fn on_new_session<'a, I: 'a>(_: bool, _: I, _: I)
    where
        I: Iterator<Item = (&'a AccountId, Self::Key)>,
        AccountId: 'a,
    {
    }

    fn on_disabled(_validator_index: u32) {}
}

impl sp_runtime::BoundToRuntimeAppPublic for OtherSessionHandler {
    type Public = UintAuthorityId;
}

pub fn is_disabled(controller: AccountId) -> bool {
    let stash = Staking::ledger(&controller).unwrap().stash;
    let validator_index = match Session::validators().iter().position(|v| *v == stash) {
        Some(index) => index as u32,
        None => return false,
    };

    Session::disabled_validators().contains(&validator_index)
}

type UncheckedExtrinsic = frame_system::mocking::MockUncheckedExtrinsic<Test>;
type Block = frame_system::mocking::MockBlock<Test>;

frame_support::construct_runtime!(
    pub enum Test where
        Block = Block,
        NodeBlock = Block,
        UncheckedExtrinsic = UncheckedExtrinsic,
    {
        System: frame_system::{Pallet, Call, Config, Storage, Event<T>},
        Authorship: pallet_authorship::{Pallet, Call, Storage, Inherent},
        Timestamp: pallet_timestamp::{Pallet, Call, Storage, Inherent},
        Balances: balances::{Pallet, Call, Storage, Config<T>, Event<T>},
        Staking: staking::{Pallet, Call, Config<T>, Storage, Event<T>},
        Session: pallet_session::{Pallet, Call, Storage, Event, Config<T>},
        Historical: pallet_session::historical::{Pallet, Storage},
        BagsList: pallet_bags_list::{Pallet, Call, Storage, Event<T>},

        Membership: membership::{Pallet, Call, Storage, Event<T>},
        ProposalsCodex: proposals_codex::{Pallet, Call, Storage, Event<T>},
        ProposalsEngine: proposals_engine::{Pallet, Call, Storage, Event<T>},
        Council: council::{Pallet, Call, Storage, Event<T>},
        Referendum: referendum::<Instance1>::{Pallet, Call, Storage, Event<T>},
        ProposalsDiscussion: proposals_discussion::{Pallet, Call, Storage, Event<T>},
        ForumWorkingGroup: working_group::<Instance1>::{Pallet, Call, Storage, Event<T>},
        StorageWorkingGroup: working_group::<Instance2>::{Pallet, Call, Storage, Event<T>},
        ContentDirectoryWorkingGroup: working_group::<Instance3>::{Pallet, Call, Storage, Event<T>},
        MembershipWorkingGroup: working_group::<Instance6>::{Pallet, Call, Storage, Event<T>},
    }
);

/// Author of block is always 11
pub struct Author11;
impl FindAuthor<AccountId> for Author11 {
    fn find_author<'a, I>(_digests: I) -> Option<AccountId>
    where
        I: 'a + IntoIterator<Item = (frame_support::ConsensusEngineId, &'a [u8])>,
    {
        Some(11)
    }
}

parameter_types! {
    pub BlockWeights: frame_system::limits::BlockWeights =
        frame_system::limits::BlockWeights::simple_max(
            frame_support::weights::constants::WEIGHT_PER_SECOND * 2
        );
    pub static SessionsPerEra: SessionIndex = 3;
    pub static ExistentialDeposit: Balance = 1;
    pub static SlashDeferDuration: EraIndex = 0;
    pub static Period: BlockNumber = 5;
    pub static Offset: BlockNumber = 0;
}

impl frame_system::Config for Test {
    type BaseCallFilter = frame_support::traits::Everything;
    type BlockWeights = ();
    type BlockLength = ();
    type DbWeight = RocksDbWeight;
    type Origin = Origin;
    type Index = AccountIndex;
    type BlockNumber = BlockNumber;
    type Call = Call;
    type Hash = H256;
    type Hashing = ::sp_runtime::traits::BlakeTwo256;
    type AccountId = AccountId;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type Event = Event;
    type BlockHashCount = frame_support::traits::ConstU64<250>;
    type Version = ();
    type PalletInfo = PalletInfo;
    type AccountData = balances::AccountData<Balance>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type SystemWeightInfo = ();
    type SS58Prefix = ();
    type OnSetCode = ();
    type MaxConsumers = frame_support::traits::ConstU32<16>;
}
impl balances::Config for Test {
    type MaxLocks = frame_support::traits::ConstU32<1024>;
    type MaxReserves = ();
    type ReserveIdentifier = [u8; 8];
    type Balance = Balance;
    type Event = Event;
    type DustRemoval = ();
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type WeightInfo = ();
}

sp_runtime::impl_opaque_keys! {
    pub struct SessionKeys {
        pub other: OtherSessionHandler,
    }
}
impl pallet_session::Config for Test {
    type SessionManager = pallet_session::historical::NoteHistoricalRoot<Test, Staking>;
    type Keys = SessionKeys;
    type ShouldEndSession = pallet_session::PeriodicSessions<Period, Offset>;
    type SessionHandler = (OtherSessionHandler,);
    type Event = Event;
    type ValidatorId = AccountId;
    type ValidatorIdOf = staking::StashOf<Test>;
    type NextSessionRotation = pallet_session::PeriodicSessions<Period, Offset>;
    type WeightInfo = ();
}

impl pallet_session::historical::Config for Test {
    type FullIdentification = staking::Exposure<AccountId, Balance>;
    type FullIdentificationOf = staking::ExposureOf<Test>;
}
impl pallet_authorship::Config for Test {
    type FindAuthor = Author11;
    type UncleGenerations = ConstU64<0>;
    type FilterUncle = ();
    type EventHandler = staking::Pallet<Test>;
}

impl pallet_timestamp::Config for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = ConstU64<5>;
    type WeightInfo = ();
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
    pub const BondingDuration: EraIndex = 3;
    pub const RewardCurve: &'static PiecewiseLinear<'static> = &I_NPOS;
    pub const OffendingValidatorsThreshold: Perbill = Perbill::from_percent(75);
}

thread_local! {
    pub static REWARD_REMAINDER_UNBALANCED: RefCell<u64> = RefCell::new(0);
}

pub struct RewardRemainderMock;

impl OnUnbalanced<NegativeImbalance> for RewardRemainderMock {
    fn on_nonzero_unbalanced(amount: NegativeImbalance) {
        REWARD_REMAINDER_UNBALANCED.with(|v| {
            *v.borrow_mut() += amount.peek();
        });
        drop(amount);
    }
}

const THRESHOLDS: [sp_npos_elections::VoteWeight; 9] =
    [10, 20, 30, 40, 50, 60, 1_000, 2_000, 10_000];

parameter_types! {
    pub static BagThresholds: &'static [sp_npos_elections::VoteWeight] = &THRESHOLDS;
    pub static MaxNominations: u32 = 16;
    pub static RewardOnUnbalanceWasCalled: bool = false;
    pub static LedgerSlashPerEra: (crate::BalanceOf<Test>, BTreeMap<EraIndex, crate::BalanceOf<Test>>) = (Zero::zero(), BTreeMap::new());
}

impl pallet_bags_list::Config for Test {
    type Event = Event;
    type WeightInfo = ();
    type ScoreProvider = Staking;
    type BagThresholds = BagThresholds;
    type Score = VoteWeight;
}

pub struct OnChainSeqPhragmen;
impl onchain::Config for OnChainSeqPhragmen {
    type System = Test;
    type Solver = SequentialPhragmen<AccountId, Perbill>;
    type DataProvider = Staking;
    type WeightInfo = ();
}

pub struct MockReward {}
impl OnUnbalanced<PositiveImbalance> for MockReward {
    fn on_unbalanced(_: PositiveImbalance) {
        RewardOnUnbalanceWasCalled::set(true);
    }
}

pub struct OnStakerSlashMock<T: staking::Config>(core::marker::PhantomData<T>);
impl<T: staking::Config> sp_staking::OnStakerSlash<AccountId, Balance> for OnStakerSlashMock<T> {
    fn on_slash(
        _pool_account: &AccountId,
        slashed_bonded: Balance,
        slashed_chunks: &BTreeMap<EraIndex, Balance>,
    ) {
        LedgerSlashPerEra::set((slashed_bonded, slashed_chunks.clone()));
    }
}

pub struct TestBenchmarkingConfig;
impl staking::BenchmarkingConfig for TestBenchmarkingConfig {
    type MaxValidators = frame_support::traits::ConstU32<100>;
    type MaxNominators = frame_support::traits::ConstU32<100>;
}

impl staking::Config for Test {
    type MaxNominations = MaxNominations;
    type Currency = Balances;
    type CurrencyBalance = <Self as balances::Config>::Balance;
    type UnixTime = Timestamp;
    type CurrencyToVote = frame_support::traits::SaturatingCurrencyToVote;
    type RewardRemainder = RewardRemainderMock;
    type Event = Event;
    type Slash = ();
    type Reward = MockReward;
    type SessionsPerEra = SessionsPerEra;
    type SlashDeferDuration = SlashDeferDuration;
    type SlashCancelOrigin = frame_system::EnsureRoot<Self::AccountId>;
    type BondingDuration = BondingDuration;
    type SessionInterface = Self;
    type EraPayout = staking::ConvertCurve<RewardCurve>;
    type NextNewSession = Session;
    type MaxNominatorRewardedPerValidator = ConstU32<64>;
    type OffendingValidatorsThreshold = OffendingValidatorsThreshold;
    type ElectionProvider = onchain::UnboundedExecution<OnChainSeqPhragmen>;
    type GenesisElectionProvider = Self::ElectionProvider;
    // NOTE: consider a macro and use `UseNominatorsAndValidatorsMap<Self>` as well.
    type VoterList = BagsList;
    type MaxUnlockingChunks = ConstU32<32>;
    type OnStakerSlash = OnStakerSlashMock<Test>;
    type BenchmarkingConfig = TestBenchmarkingConfig;
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
pub(crate) type StakingCall = staking::Call<Test>;
pub(crate) type TestRuntimeCall = <Test as frame_system::Config>::Call;

//////////

parameter_types! {
    pub const InvitedMemberLockId: [u8; 8] = [2; 8];
    pub const ReferralCutMaximumPercent: u8 = 50;
    pub const StakingCandidateLockId: [u8; 8] = [3; 8];
    pub const CandidateStake: u64 = 100;
}

impl common::membership::MembershipTypes for Test {
    type MemberId = u64;
    type ActorId = u64;
}

// Weights info stub
pub struct Weights;
impl membership::WeightInfo for Weights {
    fn buy_membership_without_referrer(_: u32, _: u32) -> Weight {
        unimplemented!()
    }
    fn buy_membership_with_referrer(_: u32, _: u32) -> Weight {
        unimplemented!()
    }
    fn update_profile(_: u32) -> Weight {
        unimplemented!()
    }
    fn update_accounts_none() -> Weight {
        unimplemented!()
    }
    fn update_accounts_root() -> Weight {
        unimplemented!()
    }
    fn update_accounts_controller() -> Weight {
        unimplemented!()
    }
    fn update_accounts_both() -> Weight {
        unimplemented!()
    }
    fn set_referral_cut() -> Weight {
        unimplemented!()
    }
    fn transfer_invites() -> Weight {
        unimplemented!()
    }
    fn invite_member(_: u32, _: u32) -> Weight {
        unimplemented!()
    }
    fn set_membership_price() -> Weight {
        unimplemented!()
    }
    fn update_profile_verification() -> Weight {
        unimplemented!()
    }
    fn set_leader_invitation_quota() -> Weight {
        unimplemented!()
    }
    fn set_initial_invitation_balance() -> Weight {
        unimplemented!()
    }
    fn set_initial_invitation_count() -> Weight {
        unimplemented!()
    }
    fn add_staking_account_candidate() -> Weight {
        unimplemented!()
    }
    fn confirm_staking_account() -> Weight {
        unimplemented!()
    }
    fn remove_staking_account() -> Weight {
        unimplemented!()
    }
    fn member_remark() -> Weight {
        unimplemented!()
    }
}

impl membership::Config for Test {
    type Event = Event;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type WorkingGroup = Wg;
    type WeightInfo = Weights;
    type DefaultInitialInvitationBalance = ();
    type InvitedMemberStakingHandler = staking_handler::StakingManager<Self, InvitedMemberLockId>;
    type ReferralCutMaximumPercent = ReferralCutMaximumPercent;
    type StakingCandidateStakingHandler =
        staking_handler::StakingManager<Self, StakingCandidateLockId>;
    type CandidateStake = CandidateStake;
}

pub struct Wg;
impl common::working_group::WorkingGroupBudgetHandler<u64, u64> for Wg {
    fn get_budget() -> u64 {
        unimplemented!()
    }

    fn set_budget(_new_value: u64) {
        unimplemented!()
    }

    fn try_withdraw(_account_id: &u64, _amount: u64) -> DispatchResult {
        unimplemented!()
    }
}

impl common::working_group::WorkingGroupAuthenticator<Test> for Wg {
    fn ensure_worker_origin(
        _origin: <Test as frame_system::Config>::Origin,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        unimplemented!();
    }

    fn ensure_leader_origin(_origin: <Test as frame_system::Config>::Origin) -> DispatchResult {
        unimplemented!()
    }

    fn get_leader_member_id() -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn get_worker_member_id(
        _: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn is_leader_account_id(_account_id: &<Test as frame_system::Config>::AccountId) -> bool {
        unimplemented!()
    }

    fn is_worker_account_id(
        _account_id: &<Test as frame_system::Config>::AccountId,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> bool {
        unimplemented!()
    }

    fn worker_exists(_worker_id: &<Test as common::membership::MembershipTypes>::ActorId) -> bool {
        unimplemented!();
    }

    fn ensure_worker_exists(
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        unimplemented!();
    }
}

parameter_types! {
    pub const DefaultMembershipPrice: u64 = 100;
    pub const DefaultInitialInvitationBalance: u64 = 100;
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

impl proposals_engine::Config for Test {
    type Event = Event;
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
    type StakingAccountValidator = ();
}

pub const STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER: u64 = 222;

impl common::StakingAccountValidator<Test> for () {
    fn is_member_staking_account(_: &u64, account_id: &u64) -> bool {
        *account_id != STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER
    }
}

impl proposals_engine::WeightInfo for MockProposalsEngineWeight {
    fn vote(_: u32) -> Weight {
        0
    }

    fn cancel_proposal() -> Weight {
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

    fn cancel_active_and_pending_proposals(_: u32) -> u64 {
        0
    }

    fn proposer_remark() -> u64 {
        0
    }
}

impl Default for crate::Call<Test> {
    fn default() -> Self {
        panic!("shouldn't call default for Call");
    }
}

impl common::membership::MemberOriginValidator<Origin, u64, u64> for () {
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

impl common::council::CouncilOriginValidator<Origin, u64, u64> for () {
    fn ensure_member_consulate(origin: Origin, _: u64) -> DispatchResult {
        frame_system::ensure_signed(origin)?;

        Ok(())
    }
}

parameter_types! {
    pub const ThreadTitleLengthLimit: u32 = 200;
    pub const PostLengthLimit: u32 = 2000;
    pub const MaxWhiteListSize: u32 = 20;
    pub const PostLifeTime: u64 = 10;
    pub const PostDeposit: u64 = 100;
    pub const ProposalsDiscussionModuleId: PalletId = PalletId(*b"mo:propo");
}

pub struct MockProposalsDiscussionWeight;

impl proposals_discussion::Config for Test {
    type Event = Event;
    type AuthorOriginValidator = ();
    type CouncilOriginValidator = ();
    type ThreadId = u64;
    type PostId = u64;
    type MaxWhiteListSize = MaxWhiteListSize;
    type WeightInfo = MockProposalsDiscussionWeight;
    type PostLifeTime = PostLifeTime;
    type PostDeposit = PostDeposit;
    type ModuleId = ProposalsDiscussionModuleId;
}

impl proposals_discussion::WeightInfo for MockProposalsDiscussionWeight {
    fn add_post(_: u32) -> Weight {
        0
    }

    fn update_post(_: u32) -> Weight {
        0
    }

    fn delete_post() -> Weight {
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

// The forum working group instance alias.
pub type ForumWorkingGroupInstance = working_group::Instance1;

// The storage working group instance alias.
pub type StorageWorkingGroupInstance = working_group::Instance2;

// The content directory working group instance alias.
pub type ContentDirectoryWorkingGroupInstance = working_group::Instance3;

// The membership working group instance alias.
pub type MembershipWorkingGroupInstance = working_group::Instance6;

parameter_types! {
    pub const MaxWorkerNumberLimit: u32 = 100;
    pub const LockId1: [u8; 8] = [1; 8];
    pub const LockId2: [u8; 8] = [2; 8];
    pub const MinimumApplicationStake: u32 = 50;
    pub const LeaderOpeningStake: u32 = 20;
}

pub struct WorkingGroupWeightInfo;
impl working_group::Config<ContentDirectoryWorkingGroupInstance> for Test {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StakingManager<Self, LockId1>;
    type StakingAccountValidator = ();
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = WorkingGroupWeightInfo;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
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
    fn leave_role(_: u32) -> Weight {
        0
    }
    fn fund_working_group_budget() -> Weight {
        0
    }
    fn lead_remark() -> Weight {
        0
    }
    fn worker_remark() -> Weight {
        0
    }
}

impl working_group::Config<StorageWorkingGroupInstance> for Test {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StakingManager<Self, LockId2>;
    type StakingAccountValidator = ();
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = WorkingGroupWeightInfo;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl working_group::Config<ForumWorkingGroupInstance> for Test {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = staking_handler::StakingManager<Self, LockId2>;
    type StakingAccountValidator = ();
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = WorkingGroupWeightInfo;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl working_group::Config<MembershipWorkingGroupInstance> for Test {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StakingManager<Self, LockId2>;
    type StakingAccountValidator = ();
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = WorkingGroupWeightInfo;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
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

impl crate::Config for Test {
    type Event = Event;
    type MembershipOriginValidator = ();
    type ProposalEncoder = ();
    type WeightInfo = ();
    type SetMaxValidatorCountProposalParameters = DefaultProposalParameters;
    type RuntimeUpgradeProposalParameters = DefaultProposalParameters;
    type SignalProposalParameters = DefaultProposalParameters;
    type FundingRequestProposalParameters = DefaultProposalParameters;
    type CreateWorkingGroupLeadOpeningProposalParameters = DefaultProposalParameters;
    type FillWorkingGroupLeadOpeningProposalParameters = DefaultProposalParameters;
    type UpdateWorkingGroupBudgetProposalParameters = DefaultProposalParameters;
    type DecreaseWorkingGroupLeadStakeProposalParameters = DefaultProposalParameters;
    type SlashWorkingGroupLeadProposalParameters = DefaultProposalParameters;
    type SetWorkingGroupLeadRewardProposalParameters = DefaultProposalParameters;
    type TerminateWorkingGroupLeadProposalParameters = DefaultProposalParameters;
    type AmendConstitutionProposalParameters = DefaultProposalParameters;
    type CancelWorkingGroupLeadOpeningProposalParameters = DefaultProposalParameters;
    type SetMembershipPriceProposalParameters = DefaultProposalParameters;
    type SetCouncilBudgetIncrementProposalParameters = DefaultProposalParameters;
    type SetCouncilorRewardProposalParameters = DefaultProposalParameters;
    type SetInitialInvitationBalanceProposalParameters = DefaultProposalParameters;
    type SetInvitationCountProposalParameters = DefaultProposalParameters;
    type SetMembershipLeadInvitationQuotaProposalParameters = DefaultProposalParameters;
    type SetReferralCutProposalParameters = DefaultProposalParameters;
    type CreateBlogPostProposalParameters = DefaultProposalParameters;
    type EditBlogPostProoposalParamters = DefaultProposalParameters;
    type LockBlogPostProposalParameters = DefaultProposalParameters;
    type UnlockBlogPostProposalParameters = DefaultProposalParameters;
    type VetoProposalProposalParameters = DefaultProposalParameters;
    type UpdateGlobalNftLimitProposalParameters = DefaultProposalParameters;
    type UpdateChannelPayoutsProposalParameters = DefaultProposalParameters;
}

parameter_types! {
    pub const MinNumberOfExtraCandidates: u64 = 1;
    pub const AnnouncingPeriodDuration: u64 = 15;
    pub const IdlePeriodDuration: u64 = 27;
    pub const CouncilSize: u64 = 3;
    pub const MinCandidateStake: u64 = 11000;
    pub const CandidacyLockId: LockIdentifier = *b"council1";
    pub const CouncilorLockId: LockIdentifier = *b"council2";
    pub const ElectedMemberRewardPeriod: u64 = 10;
    pub const BudgetRefillAmount: u64 = 1000;
    // intentionally high number that prevents side-effecting tests other than  budget refill tests
    pub const BudgetRefillPeriod: u64 = 1000;
}

pub type ReferendumInstance = referendum::Instance1;

impl council::Config for Test {
    type Event = Event;

    type Referendum = referendum::Module<Test, ReferendumInstance>;

    type MinNumberOfExtraCandidates = MinNumberOfExtraCandidates;
    type CouncilSize = CouncilSize;
    type AnnouncingPeriodDuration = AnnouncingPeriodDuration;
    type IdlePeriodDuration = IdlePeriodDuration;
    type MinCandidateStake = MinCandidateStake;

    type CandidacyLock = StakingManager<Self, CandidacyLockId>;
    type CouncilorLock = StakingManager<Self, CouncilorLockId>;

    type ElectedMemberRewardPeriod = ElectedMemberRewardPeriod;

    type BudgetRefillPeriod = BudgetRefillPeriod;

    type StakingAccountValidator = ();
    type WeightInfo = CouncilWeightInfo;

    fn new_council_elected(_: &[council::CouncilMemberOf<Self>]) {}

    type MemberOriginValidator = ();
}

pub struct CouncilWeightInfo;
impl council::WeightInfo for CouncilWeightInfo {
    fn try_process_budget() -> Weight {
        0
    }
    fn try_progress_stage_idle() -> Weight {
        0
    }
    fn try_progress_stage_announcing_start_election(_: u32) -> Weight {
        0
    }
    fn try_progress_stage_announcing_restart() -> Weight {
        0
    }
    fn announce_candidacy() -> Weight {
        0
    }
    fn release_candidacy_stake() -> Weight {
        0
    }
    fn set_candidacy_note(_: u32) -> Weight {
        0
    }
    fn withdraw_candidacy() -> Weight {
        0
    }
    fn set_budget() -> Weight {
        0
    }
    fn plan_budget_refill() -> Weight {
        0
    }
    fn set_budget_increment() -> Weight {
        0
    }
    fn set_councilor_reward() -> Weight {
        0
    }
    fn funding_request(_: u32) -> Weight {
        0
    }
    fn fund_council_budget() -> Weight {
        0
    }
    fn councilor_remark() -> Weight {
        0
    }
    fn candidate_remark() -> Weight {
        0
    }
}

parameter_types! {
    pub const VoteStageDuration: u64 = 19;
    pub const RevealStageDuration: u64 = 23;
    pub const MinimumVotingStake: u64 = 10000;
    pub const MaxSaltLength: u64 = 32; // use some multiple of 8 for ez testing
    pub const VotingLockId: LockIdentifier = *b"referend";
    pub const MaxWinnerTargetCount: u64 = 10;
}

impl referendum::Config<ReferendumInstance> for Test {
    type Event = Event;

    type MaxSaltLength = MaxSaltLength;

    type StakingHandler = staking_handler::StakingManager<Self, VotingLockId>;
    type ManagerOrigin = EnsureOneOf<EnsureSigned<Self::AccountId>, EnsureRoot<Self::AccountId>>;

    type VotePower = u64;

    type VoteStageDuration = VoteStageDuration;
    type RevealStageDuration = RevealStageDuration;

    type MinimumStake = MinimumVotingStake;

    type WeightInfo = ReferendumWeightInfo;

    type MaxWinnerTargetCount = MaxWinnerTargetCount;

    fn calculate_vote_power(
        _: &<Self as frame_system::Config>::AccountId,
        _: &Self::Balance,
    ) -> Self::VotePower {
        1
    }

    fn can_unlock_vote_stake(
        _: &referendum::CastVote<Self::Hash, Self::Balance, Self::MemberId>,
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

pub struct ReferendumWeightInfo;
impl referendum::WeightInfo for ReferendumWeightInfo {
    fn on_initialize_revealing(_: u32) -> Weight {
        0
    }
    fn on_initialize_voting() -> Weight {
        0
    }
    fn vote() -> Weight {
        0
    }
    fn reveal_vote_space_for_new_winner(_: u32) -> Weight {
        0
    }
    fn reveal_vote_space_not_in_winners(_: u32) -> Weight {
        0
    }
    fn reveal_vote_space_replace_last_winner(_: u32) -> Weight {
        0
    }
    fn reveal_vote_already_existing(_: u32) -> Weight {
        0
    }
    fn release_vote_stake() -> Weight {
        0
    }
}

impl crate::WeightInfo for () {
    fn create_proposal_signal(_: u32, _: u32, _: u32) -> Weight {
        0
    }
    fn create_proposal_runtime_upgrade(_: u32, _: u32, _: u32) -> Weight {
        0
    }
    fn create_proposal_funding_request(_: u32, _: u32) -> Weight {
        0
    }
    fn create_proposal_set_max_validator_count(_: u32, _: u32) -> Weight {
        0
    }
    fn create_proposal_create_working_group_lead_opening(_: u32, _: u32, _: u32) -> Weight {
        0
    }
    fn create_proposal_fill_working_group_lead_opening(_: u32, _: u32) -> Weight {
        0
    }
    fn create_proposal_update_working_group_budget(_: u32, _: u32) -> Weight {
        0
    }
    fn create_proposal_decrease_working_group_lead_stake(_: u32, _: u32) -> Weight {
        0
    }
    fn create_proposal_slash_working_group_lead(_: u32) -> Weight {
        0
    }
    fn create_proposal_set_working_group_lead_reward(_: u32, _: u32) -> Weight {
        0
    }
    fn create_proposal_terminate_working_group_lead(_: u32, _: u32) -> Weight {
        0
    }
    fn create_proposal_amend_constitution(_: u32, _: u32) -> Weight {
        0
    }
    fn create_proposal_cancel_working_group_lead_opening(_: u32) -> Weight {
        0
    }
    fn create_proposal_set_membership_price(_: u32, _: u32) -> Weight {
        0
    }
    fn create_proposal_set_council_budget_increment(_: u32, _: u32) -> Weight {
        0
    }
    fn create_proposal_set_councilor_reward(_: u32, _: u32) -> Weight {
        0
    }
    fn create_proposal_set_initial_invitation_balance(_: u32, _: u32) -> Weight {
        0
    }
    fn create_proposal_set_initial_invitation_count(_: u32, _: u32) -> Weight {
        0
    }
    fn create_proposal_set_membership_lead_invitation_quota(_: u32) -> Weight {
        0
    }
    fn create_proposal_set_referral_cut(_: u32, _: u32) -> Weight {
        0
    }
    fn create_proposal_create_blog_post(_: u32, _: u32, _: u32, _: u32) -> Weight {
        0
    }
    fn create_proposal_edit_blog_post(_: u32, _: u32, _: u32, _: u32) -> Weight {
        0
    }
    fn create_proposal_lock_blog_post(_: u32, _: u32) -> Weight {
        0
    }
    fn create_proposal_unlock_blog_post(_: u32, _: u32) -> Weight {
        0
    }
    fn create_proposal_veto_proposal(_: u32, _: u32) -> Weight {
        0
    }
    fn create_proposal_update_global_nft_limit(_: u32, _: u32) -> Weight {
        0
    }
    fn create_proposal_update_channel_payouts(_: u32, _: u32, _: u32) -> Weight {
        0
    }
}

impl ProposalEncoder<Test> for () {
    fn encode_proposal(_proposal_details: ProposalDetailsOf<Test>) -> Vec<u8> {
        Vec::new()
    }
}

impl LockComparator<<Test as balances::Config>::Balance> for Test {
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

    let mut result = Into::<sp_io::TestExternalities>::into(t.clone());

    // Make sure we are not in block 1 where no events are emitted
    // see https://substrate.dev/recipes/2-appetizers/4-events.html#emitting-events
    result.execute_with(|| {
        let mut block_number = frame_system::Pallet::<Test>::block_number();
        <System as OnFinalize<u64>>::on_finalize(block_number);
        block_number = block_number + 1;
        System::set_block_number(block_number);
        <System as OnInitialize<u64>>::on_initialize(block_number);
    });

    result
}
