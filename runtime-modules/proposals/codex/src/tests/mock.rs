#![cfg(test)]

use frame_support::{impl_outer_dispatch, impl_outer_origin, parameter_types};
use sp_core::H256;
use sp_runtime::curve::PiecewiseLinear;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};
use sp_staking::SessionIndex;
pub use system;

use crate::{ProposalDetailsOf, ProposalEncoder};
use proposals_engine::VotersParameters;
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
    pub const StakePoolId: [u8; 8] = *b"joystake";
}

impl_outer_dispatch! {
    pub enum Call for Test where origin: Origin {
        codex::ProposalCodex,
        proposals::ProposalsEngine,
        staking::Staking,
        system::System,
    }
}

impl common::currency::GovernanceCurrency for Test {
    type Currency = balances::Module<Self>;
}

impl membership::Trait for Test {
    type Event = ();
    type MemberId = u64;
    type PaidTermId = u64;
    type SubscriptionId = u64;
    type ActorId = u64;
}

parameter_types! {
    pub const ExistentialDeposit: u32 = 0;
}

impl balances::Trait for Test {
    type Balance = u64;
    type DustRemoval = ();
    type Event = ();
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
}

impl stake::Trait for Test {
    type Currency = Balances;
    type StakePoolId = StakePoolId;
    type StakingEventsHandler = ();
    type StakeId = u64;
    type SlashId = u64;
}

parameter_types! {
    pub const CancellationFee: u64 = 5;
    pub const RejectionFee: u64 = 3;
    pub const TitleMaxLength: u32 = 100;
    pub const DescriptionMaxLength: u32 = 10000;
    pub const MaxActiveProposalLimit: u32 = 100;
}

impl proposals_engine::Trait for Test {
    type Event = ();
    type ProposerOriginValidator = ();
    type VoterOriginValidator = ();
    type TotalVotersCounter = MockVotersParameters;
    type ProposalId = u32;
    type StakeHandlerProvider = proposals_engine::DefaultStakeHandlerProvider;
    type CancellationFee = CancellationFee;
    type RejectionFee = RejectionFee;
    type TitleMaxLength = TitleMaxLength;
    type DescriptionMaxLength = DescriptionMaxLength;
    type MaxActiveProposalLimit = MaxActiveProposalLimit;
    type DispatchableCallCode = crate::Call<Test>;
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

impl governance::council::Trait for Test {
    type Event = ();
    type CouncilTermEnded = ();
}

impl common::origin::ActorOriginValidator<Origin, u64, u64> for () {
    fn ensure_actor_origin(origin: Origin, _: u64) -> Result<u64, &'static str> {
        let account_id = system::ensure_signed(origin)?;

        Ok(account_id)
    }
}

parameter_types! {
    pub const MaxPostEditionNumber: u32 = 5;
    pub const MaxThreadInARowNumber: u32 = 3;
    pub const ThreadTitleLengthLimit: u32 = 200;
    pub const PostLengthLimit: u32 = 2000;
}

impl proposals_discussion::Trait for Test {
    type Event = ();
    type PostAuthorOriginValidator = ();
    type ThreadId = u64;
    type PostId = u64;
    type MaxPostEditionNumber = MaxPostEditionNumber;
    type ThreadTitleLengthLimit = ThreadTitleLengthLimit;
    type PostLengthLimit = PostLengthLimit;
    type MaxThreadInARowNumber = MaxThreadInARowNumber;
}

pub struct MockVotersParameters;
impl VotersParameters for MockVotersParameters {
    fn total_voters_count() -> u32 {
        4
    }
}

parameter_types! {
    pub const TextProposalMaxLength: u32 = 20_000;
    pub const RuntimeUpgradeWasmProposalMaxLength: u32 = 20_000;
}

impl governance::election::Trait for Test {
    type Event = ();
    type CouncilElected = ();
}

impl content_working_group::Trait for Test {
    type Event = ();
}

impl recurring_rewards::Trait for Test {
    type PayoutStatusHandler = ();
    type RecipientId = u64;
    type RewardRelationshipId = u64;
}

impl versioned_store_permissions::Trait for Test {
    type Credential = u64;
    type CredentialChecker = ();
    type CreateClassPermissionsChecker = ();
}

impl versioned_store::Trait for Test {
    type Event = ();
}

impl hiring::Trait for Test {
    type OpeningId = u64;
    type ApplicationId = u64;
    type ApplicationDeactivatedHandler = ();
    type StakeHandlerProvider = hiring::Module<Self>;
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
    type SlashCancelOrigin = system::EnsureRoot<Self::AccountId>;
    type SessionInterface = Self;
    type RewardCurve = RewardCurve;
    type NextNewSession = ();
    type ElectionLookahead = ();
    type Call = Call;
    type MaxIterations = ();
    type MinSolutionScoreBump = ();
    type MaxNominatorRewardedPerValidator = ();
    type UnsignedPriority = ();
}

impl<LocalCall> system::offchain::SendTransactionTypes<LocalCall> for Test
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

impl crate::Trait for Test {
    type TextProposalMaxLength = TextProposalMaxLength;
    type RuntimeUpgradeWasmProposalMaxLength = RuntimeUpgradeWasmProposalMaxLength;
    type MembershipOriginValidator = ();
    type ProposalEncoder = ();
}

impl ProposalEncoder<Test> for () {
    fn encode_proposal(_proposal_details: ProposalDetailsOf<Test>) -> Vec<u8> {
        Vec::new()
    }
}

impl system::Trait for Test {
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
    type ModuleToIndex = ();
    type AccountData = balances::AccountData<u64>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
}

impl pallet_timestamp::Trait for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
}

pub fn initial_test_ext() -> sp_io::TestExternalities {
    let t = system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    t.into()
}

pub type Staking = staking::Module<Test>;
pub type ProposalCodex = crate::Module<Test>;
pub type ProposalsEngine = proposals_engine::Module<Test>;
pub type Balances = balances::Module<Test>;
pub type Timestamp = pallet_timestamp::Module<Test>;
pub type System = system::Module<Test>;
