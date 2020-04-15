#![cfg(test)]
// srml_staking_reward_curve::build! - substrate macro produces a warning.
// TODO: remove after post-Rome substrate upgrade
#![allow(array_into_iter)]

pub use primitives::{Blake2Hasher, H256};
use proposal_engine::VotersParameters;
use sr_primitives::curve::PiecewiseLinear;
pub use sr_primitives::{
    testing::{Digest, DigestItem, Header, UintAuthorityId},
    traits::{BlakeTwo256, Convert, IdentityLookup, OnFinalize},
    weights::Weight,
    BuildStorage, DispatchError, Perbill,
};
use sr_staking_primitives::SessionIndex;
use srml_support::{impl_outer_dispatch, impl_outer_origin, parameter_types};
pub use system;

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
    }
}

impl common::currency::GovernanceCurrency for Test {
    type Currency = balances::Module<Self>;
}

impl membership::members::Trait for Test {
    type Event = ();
    type MemberId = u64;
    type PaidTermId = u64;
    type SubscriptionId = u64;
    type ActorId = u64;
    type InitialMembersBalance = ();
}

parameter_types! {
    pub const ExistentialDeposit: u32 = 0;
    pub const TransferFee: u32 = 0;
    pub const CreationFee: u32 = 0;
}

impl balances::Trait for Test {
    /// The type for recording an account's balance.
    type Balance = u64;
    /// What to do if an account's free balance gets zeroed.
    type OnFreeBalanceZero = ();
    /// What to do if a new account is created.
    type OnNewAccount = ();

    type Event = ();

    type DustRemoval = ();
    type TransferPayment = ();
    type ExistentialDeposit = ExistentialDeposit;
    type TransferFee = TransferFee;
    type CreationFee = CreationFee;
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

impl proposal_engine::Trait for Test {
    type Event = ();
    type ProposerOriginValidator = ();
    type VoterOriginValidator = ();
    type TotalVotersCounter = MockVotersParameters;
    type ProposalId = u32;
    type StakeHandlerProvider = proposal_engine::DefaultStakeHandlerProvider;
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

impl mint::Trait for Test {
    type Currency = Balances;
    type MintId = u64;
}

impl governance::council::Trait for Test {
    type Event = ();
    type CouncilTermEnded = ();
}

impl common::origin_validator::ActorOriginValidator<Origin, u64, u64> for () {
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

impl proposal_discussion::Trait for Test {
    type Event = ();
    type PostAuthorOriginValidator = ();
    type ThreadId = u32;
    type PostId = u32;
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

impl roles::actors::Trait for Test {
    type Event = ();
    type OnActorRemoved = ();
}

impl roles::actors::ActorRemoved<Test> for () {
    fn actor_removed(_: &u64) {}
}

srml_staking_reward_curve::build! {
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
    type Currency = balances::Module<Self>;
    type Time = timestamp::Module<Self>;
    type CurrencyToVote = ();
    type RewardRemainder = ();
    type Event = ();
    type Slash = ();
    type Reward = ();
    type SessionsPerEra = SessionsPerEra;
    type BondingDuration = BondingDuration;
    type SessionInterface = Self;
    type RewardCurve = RewardCurve;
}

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
}

impl system::Trait for Test {
    type Origin = Origin;
    type Index = u64;
    type BlockNumber = u64;
    type Call = ();
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u64;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type Event = ();
    type BlockHashCount = BlockHashCount;
    type MaximumBlockWeight = MaximumBlockWeight;
    type MaximumBlockLength = MaximumBlockLength;
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = ();
}

impl timestamp::Trait for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
}

pub fn initial_test_ext() -> runtime_io::TestExternalities {
    let t = system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    t.into()
}

pub type ProposalCodex = crate::Module<Test>;
pub type ProposalsEngine = proposal_engine::Module<Test>;
pub type Balances = balances::Module<Test>;
