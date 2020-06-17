use crate::{Module, Trait};
use common::constraints::InputValidationLengthConstraint;
use primitives::H256;
use sr_primitives::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};
use srml_support::{impl_outer_event, impl_outer_origin, parameter_types};

impl_outer_origin! {
        pub enum Origin for Test {}
}

mod working_group {
    pub use super::TestWorkingGroupInstance;
    pub use crate::Event;
}

mod membership_mod {
    pub use membership::members::Event;
}

impl_outer_event! {
    pub enum TestEvent for Test {
        balances<T>,
        working_group TestWorkingGroupInstance <T>,
        membership_mod<T>,
    }
}

parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
    pub const InitialMembersBalance: u64 = 2000;
    pub const StakePoolId: [u8; 8] = *b"joystake";
    pub const ExistentialDeposit: u32 = 0;
    pub const TransferFee: u32 = 0;
    pub const CreationFee: u32 = 0;
}

// Workaround for https://github.com/rust-lang/rust/issues/26925 - remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Test;

impl system::Trait for Test {
    type Origin = Origin;
    type Call = ();
    type Index = u64;
    type BlockNumber = u64;
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u64;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type Event = TestEvent;
    type BlockHashCount = BlockHashCount;
    type MaximumBlockWeight = MaximumBlockWeight;
    type MaximumBlockLength = MaximumBlockLength;
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = ();
}

impl hiring::Trait for Test {
    type OpeningId = u64;
    type ApplicationId = u64;
    type ApplicationDeactivatedHandler = ();
    type StakeHandlerProvider = hiring::Module<Self>;
}

impl minting::Trait for Test {
    type Currency = Balances;
    type MintId = u64;
}

impl stake::Trait for Test {
    type Currency = Balances;
    type StakePoolId = StakePoolId;
    type StakingEventsHandler = ();
    type StakeId = u64;
    type SlashId = u64;
}

impl membership::members::Trait for Test {
    type Event = TestEvent;
    type MemberId = u64;
    type PaidTermId = u64;
    type SubscriptionId = u64;
    type ActorId = u64;
    type InitialMembersBalance = InitialMembersBalance;
}

impl common::currency::GovernanceCurrency for Test {
    type Currency = Balances;
}

impl timestamp::Trait for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
}

impl balances::Trait for Test {
    type Balance = u64;
    type OnFreeBalanceZero = ();
    type OnNewAccount = ();
    type TransferPayment = ();
    type DustRemoval = ();
    type Event = TestEvent;
    type ExistentialDeposit = ExistentialDeposit;
    type TransferFee = TransferFee;
    type CreationFee = CreationFee;
}

impl recurringrewards::Trait for Test {
    type PayoutStatusHandler = ();
    type RecipientId = u64;
    type RewardRelationshipId = u64;
}

pub type Balances = balances::Module<Test>;
pub type System = system::Module<Test>;

impl Trait<TestWorkingGroupInstance> for Test {
    type Event = TestEvent;
}

pub type Membership = membership::members::Module<Test>;

pub type TestWorkingGroupInstance = crate::Instance1;
pub type TestWorkingGroup = Module<Test, TestWorkingGroupInstance>;

pub(crate) const STORAGE_WORKING_GROUP_MINT_CAPACITY: u64 = 40000;
pub(crate) const STORAGE_WORKING_GROUP_CONSTRAINT_MIN: u16 = 1;
pub(crate) const STORAGE_WORKING_GROUP_CONSTRAINT_DIFF: u16 = 40;

pub fn build_test_externalities() -> runtime_io::TestExternalities {
    let mut t = system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    crate::GenesisConfig::<Test, TestWorkingGroupInstance> {
        phantom: Default::default(),
        storage_working_group_mint_capacity: STORAGE_WORKING_GROUP_MINT_CAPACITY,
        opening_human_readable_text_constraint: InputValidationLengthConstraint::new(
            STORAGE_WORKING_GROUP_CONSTRAINT_MIN,
            STORAGE_WORKING_GROUP_CONSTRAINT_DIFF,
        ),
        worker_application_human_readable_text_constraint: InputValidationLengthConstraint::new(
            STORAGE_WORKING_GROUP_CONSTRAINT_MIN,
            STORAGE_WORKING_GROUP_CONSTRAINT_DIFF,
        ),
        worker_exit_rationale_text_constraint: InputValidationLengthConstraint::new(
            STORAGE_WORKING_GROUP_CONSTRAINT_MIN,
            STORAGE_WORKING_GROUP_CONSTRAINT_DIFF,
        ),
    }
    .assimilate_storage(&mut t)
    .unwrap();

    t.into()
}
