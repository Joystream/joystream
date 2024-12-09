#![cfg(test)]
// Internal substrate warning.
#![allow(non_fmt_panics)]

use frame_election_provider_support::{onchain, SequentialPhragmen, VoteWeight};
use frame_support::traits::WithdrawReasons;
use frame_support::{
    dispatch::DispatchError,
    parameter_types,
    traits::{
        ConstU32, ConstU64, Currency, EitherOfDiverse, Imbalance, LockIdentifier, OnUnbalanced,
        OneSessionHandler,
    },
    weights::constants::RocksDbWeight,
    PalletId,
};
pub use frame_system;
use frame_system::{EnsureRoot, EnsureSigned};
use sp_core::H256;
use sp_runtime::curve::PiecewiseLinear;
use sp_runtime::traits::Convert;
use sp_runtime::{
    testing::{Header, TestXt, UintAuthorityId},
    traits::{IdentityLookup, Zero},
    DispatchResult, Perbill,
};

use sp_staking::{EraIndex, SessionIndex};
use staking_handler::{LockComparator, StakingManager};

use crate as proposals_codex;
use crate::{
    AppWorkingGroupInstance, ContentWorkingGroupInstance, DistributionWorkingGroupInstance,
    ForumWorkingGroupInstance, MembershipWorkingGroupInstance, OperationsWorkingGroupInstanceAlpha,
    OperationsWorkingGroupInstanceBeta, OperationsWorkingGroupInstanceGamma, ProposalDetailsOf,
    ProposalEncoder, ProposalParameters, StorageWorkingGroupInstance,
};
use proposals_engine::VotersParameters;

use super::run_to_block;
use sp_std::collections::btree_map::BTreeMap;
use sp_std::convert::{TryFrom, TryInto};
use std::cell::RefCell;

type NegativeImbalance = <Balances as Currency<AccountId>>::NegativeImbalance;
type PositiveImbalance = <Balances as Currency<AccountId>>::PositiveImbalance;

/// The AccountId alias in this test module.
pub(crate) type AccountId = u64;
pub(crate) type AccountIndex = u64;
pub(crate) type BlockNumber = u64;
pub(crate) type Balance = u64;
pub(crate) type VestingBalance = u64;

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

type UncheckedExtrinsic = frame_system::mocking::MockUncheckedExtrinsic<Test>;
type Block = frame_system::mocking::MockBlock<Test>;

frame_support::construct_runtime!(
    pub enum Test where
        Block = Block,
        NodeBlock = Block,
        UncheckedExtrinsic = UncheckedExtrinsic,
    {
        System: frame_system::{Pallet, Call, Config, Storage, Event<T>},
        Timestamp: pallet_timestamp::{Pallet, Call, Storage, Inherent},
        Balances: balances::{Pallet, Call, Storage, Config<T>, Event<T>},
        Staking: staking::{Pallet, Call, Config<T>, Storage, Event<T>},
        BagsList: pallet_bags_list::{Pallet, Call, Storage, Event<T>},
        Vesting: vesting::{Pallet, Call, Storage, Event<T>},

        Membership: membership::{Pallet, Call, Storage, Event<T>},
        ProposalsCodex: proposals_codex::{Pallet, Call, Storage, Event<T>},
        ProposalsEngine: proposals_engine::{Pallet, Call, Storage, Event<T>},
        Referendum: referendum::<Instance1>::{Pallet, Call, Storage, Event<T>},
        ProposalsDiscussion: proposals_discussion::{Pallet, Call, Storage, Event<T>},
        ForumWorkingGroup: working_group::<Instance1>::{Pallet, Call, Storage, Event<T>},
        StorageWorkingGroup: working_group::<Instance2>::{Pallet, Call, Storage, Event<T>},
        ContentWorkingGroup: working_group::<Instance3>::{Pallet, Call, Storage, Event<T>},
        OperationsWorkingGroupAlpha: working_group::<Instance4>::{Pallet, Call, Storage, Event<T>},
        AppWorkingGroup: working_group::<Instance5>::{Pallet, Call, Storage, Event<T>},
        MembershipWorkingGroup: working_group::<Instance6>::{Pallet, Call, Storage, Event<T>},
        OperationsWorkingGroupBeta: working_group::<Instance7>::{Pallet, Call, Storage, Event<T>},
        OperationsWorkingGroupGamma: working_group::<Instance8>::{Pallet, Call, Storage, Event<T>},
        DistributionWorkingGroup: working_group::<Instance9>::{Pallet, Call, Storage, Event<T>},
        Council: council::{Pallet, Call, Storage, Event<T>},
        Storage: storage::{Pallet, Call, Storage, Event<T>},
        Token: token::{Pallet, Call, Storage, Event<T>},
        ArgoBridge: argo_bridge::{Pallet, Call, Storage, Event<T>}
    }
);

parameter_types! {
    pub BlockWeights: frame_system::limits::BlockWeights =
        frame_system::limits::BlockWeights::simple_max(
            frame_support::weights::Weight::from_parts(frame_support::weights::constants::WEIGHT_REF_TIME_PER_SECOND * 2, 0u64)
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
    type RuntimeOrigin = RuntimeOrigin;
    type Index = AccountIndex;
    type BlockNumber = BlockNumber;
    type RuntimeCall = RuntimeCall;
    type Hash = H256;
    type Hashing = ::sp_runtime::traits::BlakeTwo256;
    type AccountId = AccountId;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type RuntimeEvent = RuntimeEvent;
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
    type RuntimeEvent = RuntimeEvent;
    type DustRemoval = ();
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type WeightInfo = ();
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
    type RuntimeEvent = RuntimeEvent;
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
    type MaxWinners = ConstU32<2_000>;
    type VotersBound = ConstU32<5_000>;
    type TargetsBound = ConstU32<2_000>;
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
    type RuntimeEvent = RuntimeEvent;
    type Slash = ();
    type Reward = MockReward;
    type SessionsPerEra = SessionsPerEra;
    type SlashDeferDuration = SlashDeferDuration;
    type BondingDuration = BondingDuration;
    type SessionInterface = ();
    type EraPayout = staking::ConvertCurve<RewardCurve>;
    type NextNewSession = ();
    type MaxNominatorRewardedPerValidator = ConstU32<64>;
    type OffendingValidatorsThreshold = OffendingValidatorsThreshold;
    type ElectionProvider = onchain::OnChainExecution<OnChainSeqPhragmen>;
    type GenesisElectionProvider = Self::ElectionProvider;
    // NOTE: consider a macro and use `UseNominatorsAndValidatorsMap<Self>` as well.
    type VoterList = BagsList;
    type TargetList = staking::UseValidatorsMap<Self>;
    type MaxUnlockingChunks = ConstU32<32>;
    type OnStakerSlash = OnStakerSlashMock<Test>;
    type BenchmarkingConfig = TestBenchmarkingConfig;
    type WeightInfo = ();
    type BondingRestriction = ();
    type HistoryDepth = ConstU32<120>;
    type AdminOrigin = EnsureRoot<AccountId>;
}

impl<LocalCall> frame_system::offchain::SendTransactionTypes<LocalCall> for Test
where
    RuntimeCall: From<LocalCall>,
{
    type OverarchingCall = RuntimeCall;
    type Extrinsic = Extrinsic;
}

pub type Extrinsic = TestXt<RuntimeCall, ()>;

parameter_types! {
    pub const InvitedMemberLockId: [u8; 8] = [2; 8];
    pub const ReferralCutMaximumPercent: u8 = 50;
    pub const StakingCandidateLockId: [u8; 8] = [3; 8];
    pub const CandidateStake: u64 = 100;
    pub const DefaultMemberInvitesCount: u32 = 2;
}

impl common::membership::MembershipTypes for Test {
    type MemberId = u64;
    type ActorId = u64;
}

impl membership::Config for Test {
    type RuntimeEvent = RuntimeEvent;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type WorkingGroup = Wg;
    type WeightInfo = ();
    type DefaultInitialInvitationBalance = ();
    type InvitedMemberStakingHandler = staking_handler::StakingManager<Self, InvitedMemberLockId>;
    type ReferralCutMaximumPercent = ReferralCutMaximumPercent;
    type StakingCandidateStakingHandler =
        staking_handler::StakingManager<Self, StakingCandidateLockId>;
    type CandidateStake = CandidateStake;
    type DefaultMemberInvitesCount = DefaultMemberInvitesCount;
}

parameter_types! {
    // constants for token::Config
    pub const TokenModuleId: PalletId = PalletId(*b"m__Token");
    pub const MaxVestingSchedulesPerAccountPerToken: u32 = 3;
    pub const BlocksPerYear: u32 = 5259487; // blocks every 6s
    pub const MaxOutputs: u32 = 256;
    // constants for storage::Config
    pub const MaxNumberOfDataObjectsPerBag: u64 = 4;
    pub const MaxDistributionBucketFamilyNumber: u64 = 4;
    pub const DataObjectDeletionPrize: u64 = 15;
    pub const StorageModuleId: PalletId = PalletId(*b"mstorage"); // module storage
    pub const BlacklistSizeLimit: u64 = 1;
    pub const MaxNumberOfPendingInvitationsPerDistributionBucket: u32 = 1;
    pub const InitialStorageBucketsNumberForDynamicBag: u64 = 3;
    pub const MaxRandomIterationNumber: u64 = 3;
    pub const DefaultMemberDynamicBagNumberOfStorageBuckets: u32 = 3;
    pub const DefaultChannelDynamicBagNumberOfStorageBuckets: u32 = 4;
    pub const MaxDataObjectSize: u64 = 1_000_000_000;
    pub const MinStorageBucketsPerBag: u32 = 3;
    pub const MaxStorageBucketsPerBag: u32 = 10;
    pub const MinDistributionBucketsPerBag: u32 = 3;
    pub const MaxDistributionBucketsPerBag: u32 = 10;
    pub const MaxNumberOfOperatorsPerDistributionBucket: u32 = 5;
    /// constants for argo_bridge::config
    pub const MaxPauserAccounts: u32 = 10;
    pub const DefaultBridgingFee: Balance = 1;
}

impl storage::Config for Test {
    type RuntimeEvent = RuntimeEvent;
    type DataObjectId = u64;
    type StorageBucketId = u64;
    type DistributionBucketIndex = u64;
    type DistributionBucketFamilyId = u64;
    type DistributionBucketOperatorId = u64;
    type ChannelId = u64;
    type BlacklistSizeLimit = BlacklistSizeLimit;
    type ModuleId = StorageModuleId;
    type MinStorageBucketsPerBag = MinStorageBucketsPerBag;
    type MaxStorageBucketsPerBag = MaxStorageBucketsPerBag;
    type MinDistributionBucketsPerBag = MinDistributionBucketsPerBag;
    type MaxDistributionBucketsPerBag = MaxDistributionBucketsPerBag;
    type DefaultMemberDynamicBagNumberOfStorageBuckets =
        DefaultMemberDynamicBagNumberOfStorageBuckets;
    type DefaultChannelDynamicBagNumberOfStorageBuckets =
        DefaultChannelDynamicBagNumberOfStorageBuckets;
    type MaxDistributionBucketFamilyNumber = MaxDistributionBucketFamilyNumber;
    type MaxNumberOfPendingInvitationsPerDistributionBucket =
        MaxNumberOfPendingInvitationsPerDistributionBucket;
    type MaxNumberOfOperatorsPerDistributionBucket = MaxNumberOfOperatorsPerDistributionBucket;
    type ContentId = u64;
    type MaxDataObjectSize = MaxDataObjectSize;
    type StorageWorkingGroup = Wg;
    type DistributionWorkingGroup = Wg;
    type ModuleAccountInitialBalance = ExistentialDeposit;
    type WeightInfo = ();
}

impl token::Config for Test {
    type RuntimeEvent = RuntimeEvent;
    type Balance = u64;
    type TokenId = u64;
    type DataObjectStorage = storage::Module<Self>;
    type ModuleId = TokenModuleId;
    type JoyExistentialDeposit = ExistentialDeposit;
    type MaxVestingSchedulesPerAccountPerToken = MaxVestingSchedulesPerAccountPerToken;
    type BlocksPerYear = BlocksPerYear;
    type WeightInfo = ();
    type MemberOriginValidator = membership::Module<Self>;
    type MembershipInfoProvider = membership::Module<Self>;
    type MaxOutputs = MaxOutputs;
}

impl argo_bridge::Config for Test {
    type RuntimeEvent = RuntimeEvent;
    type MaxPauserAccounts = MaxPauserAccounts;
    type WeightInfo = argo_bridge::weights::SubstrateWeight<Test>;
    type DefaultBridgingFee = DefaultBridgingFee;
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

pub const LEADER_MEMBER_ID: u64 = 100;
pub const LEADER_ACCOUNT_ID: u64 = 100;

impl common::working_group::WorkingGroupAuthenticator<Test> for Wg {
    fn ensure_worker_origin(
        _origin: <Test as frame_system::Config>::RuntimeOrigin,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        unimplemented!();
    }

    fn ensure_leader_origin(
        _origin: <Test as frame_system::Config>::RuntimeOrigin,
    ) -> DispatchResult {
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
    pub const TitleMaxLength: u32 = 10_000;
    pub const DescriptionMaxLength: u32 = 100_000;
    pub const MaxActiveProposalLimit: u32 = 100;
    pub const LockId: LockIdentifier = [2; 8];
    pub const DispatchableCallCodeMaxLen: u32 = 1024 * 1024;
}

impl proposals_engine::Config for Test {
    type RuntimeEvent = RuntimeEvent;
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
    type WeightInfo = ();
    type StakingAccountValidator = ();
    type DispatchableCallCodeMaxLen = DispatchableCallCodeMaxLen;
}

pub const STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER: u64 = 222;

impl common::StakingAccountValidator<Test> for () {
    fn is_member_staking_account(_: &u64, account_id: &u64) -> bool {
        *account_id != STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER
    }
}

impl Default for crate::Call<Test> {
    fn default() -> Self {
        panic!("shouldn't call default for Call");
    }
}

impl common::membership::MemberOriginValidator<RuntimeOrigin, u64, u64> for () {
    fn ensure_member_controller_account_origin(
        origin: RuntimeOrigin,
        _: u64,
    ) -> Result<u64, DispatchError> {
        let account_id = frame_system::ensure_signed(origin)?;

        Ok(account_id)
    }

    fn is_member_controller_account(member_id: &u64, account_id: &u64) -> bool {
        member_id == account_id
    }
}

impl common::membership::MembershipInfoProvider<Test> for () {
    fn controller_account_id(member_id: u64) -> Result<u64, DispatchError> {
        Ok(member_id)
    }
}

impl common::council::CouncilOriginValidator<RuntimeOrigin, u64, u64> for () {
    fn ensure_member_consulate(origin: RuntimeOrigin, _: u64) -> DispatchResult {
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

impl proposals_discussion::Config for Test {
    type RuntimeEvent = RuntimeEvent;
    type AuthorOriginValidator = ();
    type MembershipInfoProvider = ();
    type CouncilOriginValidator = ();
    type ThreadId = u64;
    type PostId = u64;
    type MaxWhiteListSize = MaxWhiteListSize;
    type WeightInfo = ();
    type PostLifeTime = PostLifeTime;
    type PostDeposit = PostDeposit;
    type ModuleId = ProposalsDiscussionModuleId;
}

pub struct MockVotersParameters;
impl VotersParameters for MockVotersParameters {
    fn total_voters_count() -> u32 {
        4
    }
}

pub struct BlockNumberToBalance();
impl Convert<<Test as frame_system::Config>::BlockNumber, Balance> for BlockNumberToBalance {
    fn convert(block: <Test as frame_system::Config>::BlockNumber) -> Balance {
        block as u64
    }
}
pub struct VestingBalanceToBalance();
impl Convert<Balance, VestingBalance> for VestingBalanceToBalance {
    fn convert(balance: Balance) -> VestingBalance {
        balance as u64
    }
}

parameter_types! {
    pub const MinVestedTransfer: u64 = 10;
    pub UnvestedFundsAllowedWithdrawReasons: WithdrawReasons =
        WithdrawReasons::except(WithdrawReasons::TRANSFER | WithdrawReasons::RESERVE);
}

impl vesting::Config for Test {
    type BlockNumberToBalance = BlockNumberToBalance;
    type Currency = Balances;
    type RuntimeEvent = RuntimeEvent;
    const MAX_VESTING_SCHEDULES: u32 = 3;
    type MinVestedTransfer = MinVestedTransfer;
    type WeightInfo = ();
    type UnvestedFundsAllowedWithdrawReasons = UnvestedFundsAllowedWithdrawReasons;
}

parameter_types! {
    pub const MaxWorkerNumberLimit: u32 = 100;
    pub const LockId1: [u8; 8] = [1; 8];
    pub const LockId2: [u8; 8] = [2; 8];
    pub const LockId3: [u8; 8] = [3; 8];
    pub const LockId4: [u8; 8] = [4; 8];
    pub const LockId5: [u8; 8] = [5; 8];
    pub const LockId6: [u8; 8] = [6; 8];
    pub const LockId7: [u8; 8] = [7; 8];
    pub const LockId8: [u8; 8] = [8; 8];
    pub const LockId9: [u8; 8] = [9; 8];
    pub const MinimumApplicationStake: u32 = 50;
    pub const LeaderOpeningStake: u32 = 20;
}

impl working_group::Config<ForumWorkingGroupInstance> for Test {
    type RuntimeEvent = RuntimeEvent;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StakingManager<Self, LockId1>;
    type StakingAccountValidator = ();
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
    type VestingBalanceToBalance = VestingBalanceToBalance;
}

impl working_group::Config<StorageWorkingGroupInstance> for Test {
    type RuntimeEvent = RuntimeEvent;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StakingManager<Self, LockId2>;
    type StakingAccountValidator = ();
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
    type VestingBalanceToBalance = VestingBalanceToBalance;
}

impl working_group::Config<ContentWorkingGroupInstance> for Test {
    type RuntimeEvent = RuntimeEvent;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StakingManager<Self, LockId3>;
    type StakingAccountValidator = ();
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
    type VestingBalanceToBalance = VestingBalanceToBalance;
}

impl working_group::Config<OperationsWorkingGroupInstanceAlpha> for Test {
    type RuntimeEvent = RuntimeEvent;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StakingManager<Self, LockId4>;
    type StakingAccountValidator = ();
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
    type VestingBalanceToBalance = VestingBalanceToBalance;
}

impl working_group::Config<AppWorkingGroupInstance> for Test {
    type RuntimeEvent = RuntimeEvent;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StakingManager<Self, LockId5>;
    type StakingAccountValidator = ();
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
    type VestingBalanceToBalance = VestingBalanceToBalance;
}

impl working_group::Config<MembershipWorkingGroupInstance> for Test {
    type RuntimeEvent = RuntimeEvent;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StakingManager<Self, LockId6>;
    type StakingAccountValidator = ();
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
    type VestingBalanceToBalance = VestingBalanceToBalance;
}

impl working_group::Config<OperationsWorkingGroupInstanceBeta> for Test {
    type RuntimeEvent = RuntimeEvent;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StakingManager<Self, LockId7>;
    type StakingAccountValidator = ();
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
    type VestingBalanceToBalance = VestingBalanceToBalance;
}

impl working_group::Config<OperationsWorkingGroupInstanceGamma> for Test {
    type RuntimeEvent = RuntimeEvent;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StakingManager<Self, LockId8>;
    type StakingAccountValidator = ();
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
    type VestingBalanceToBalance = VestingBalanceToBalance;
}

impl working_group::Config<DistributionWorkingGroupInstance> for Test {
    type RuntimeEvent = RuntimeEvent;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StakingManager<Self, LockId9>;
    type StakingAccountValidator = ();
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
    type VestingBalanceToBalance = VestingBalanceToBalance;
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
    type RuntimeEvent = RuntimeEvent;
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
    type VetoProposalProposalParameters = DefaultProposalParameters;
    type UpdateGlobalNftLimitProposalParameters = DefaultProposalParameters;
    type UpdateChannelPayoutsProposalParameters = DefaultProposalParameters;
    type FundingRequestProposalMaxTotalAmount = FundingRequestProposalMaxTotalAmount;
    type FundingRequestProposalMaxAccounts = FundingRequestProposalMaxAccounts;
    type SetMaxValidatorCountProposalMaxValidators = SetMaxValidatorCountProposalMaxValidators;
    type SetPalletFozenStatusProposalParameters = DefaultProposalParameters;
    type UpdateTokenPalletTokenConstraints = DefaultProposalParameters;
    type UpdateArgoBridgeConstraints = DefaultProposalParameters;
    type SetEraPayoutDampingFactorProposalParameters = DefaultProposalParameters;
    type DecreaseCouncilBudgetProposalParameters = DefaultProposalParameters;
}

parameter_types! {
    pub const MinNumberOfExtraCandidates: u32 = 1;
    pub const AnnouncingPeriodDuration: u64 = 15;
    pub const IdlePeriodDuration: u64 = 27;
    pub const CouncilSize: u32 = 3;
    pub const MinCandidateStake: u64 = 11000;
    pub const CandidacyLockId: LockIdentifier = *b"council1";
    pub const CouncilorLockId: LockIdentifier = *b"council2";
    pub const ElectedMemberRewardPeriod: u64 = 10;
    pub const BudgetRefillAmount: u64 = 1000;
    // intentionally high number that prevents side-effecting tests other than  budget refill tests
    pub const BudgetRefillPeriod: u64 = 1000;
    pub const FundingRequestProposalMaxTotalAmount: Balance = 10_000_000_000_000;
    pub const FundingRequestProposalMaxAccounts: u32 = 100;
    pub const SetMaxValidatorCountProposalMaxValidators: u32 = 300;
}

pub type ReferendumInstance = referendum::Instance1;

impl council::Config for Test {
    type RuntimeEvent = RuntimeEvent;

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
    type WeightInfo = ();

    fn new_council_elected(_: &[council::CouncilMemberOf<Self>]) {}

    type MemberOriginValidator = ();
}

parameter_types! {
    pub const VoteStageDuration: u64 = 19;
    pub const RevealStageDuration: u64 = 23;
    pub const MinimumVotingStake: u64 = 10000;
    pub const MaxSaltLength: u64 = 32; // use some multiple of 8 for ez testing
    pub const VotingLockId: LockIdentifier = *b"referend";
    pub const MaxWinnerTargetCount: u32 = 10;
}

impl referendum::Config<ReferendumInstance> for Test {
    type RuntimeEvent = RuntimeEvent;

    type MaxSaltLength = MaxSaltLength;

    type StakingHandler = staking_handler::StakingManager<Self, VotingLockId>;
    type ManagerOrigin =
        EitherOfDiverse<EnsureSigned<Self::AccountId>, EnsureRoot<Self::AccountId>>;

    type VotePower = u64;

    type VoteStageDuration = VoteStageDuration;
    type RevealStageDuration = RevealStageDuration;

    type MinimumStake = MinimumVotingStake;

    type WeightInfo = ();

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
                vote_power: item.vote_power,
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
    fn encode_proposal(
        _proposal_details: ProposalDetailsOf<Test>,
        _account_id: <Test as frame_system::Config>::AccountId,
    ) -> Vec<u8> {
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
    let mut t = frame_system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    council::GenesisConfig::<Test>::default()
        .assimilate_storage(&mut t)
        .unwrap();

    let mut result = Into::<sp_io::TestExternalities>::into(t);

    // Make sure we are not in block 1 where no events are emitted
    // see https://substrate.dev/recipes/2-appetizers/4-events.html#emitting-events
    result.execute_with(|| {
        run_to_block(1);
    });

    result
}
