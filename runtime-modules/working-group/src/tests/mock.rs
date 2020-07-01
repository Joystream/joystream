use crate::{BalanceOf, Module, NegativeImbalance, Trait};
use common::constraints::InputValidationLengthConstraint;
use primitives::H256;
use sr_primitives::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};
use srml_support::{
    impl_outer_event, impl_outer_origin, parameter_types, StorageLinkedMap, StorageMap,
};
use std::marker::PhantomData;

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

parameter_types! {
    pub const MinimumStakeBalance: u64 = 1; // just non-zero
}

impl hiring::Trait for Test {
    type OpeningId = u64;
    type ApplicationId = u64;
    type ApplicationDeactivatedHandler = ();
    type StakeHandlerProvider = hiring::Module<Self>;
    type MinimumStakeBalance = MinimumStakeBalance;
}

impl minting::Trait for Test {
    type Currency = Balances;
    type MintId = u64;
}

impl stake::Trait for Test {
    type Currency = Balances;
    type StakePoolId = StakePoolId;
    type StakingEventsHandler = StakingEventsHandler<Test>;
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

parameter_types! {
    pub const MaxWorkerNumberLimit: u32 = 3;
}

impl Trait<TestWorkingGroupInstance> for Test {
    type Event = TestEvent;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
}

pub type Membership = membership::members::Module<Test>;

pub type TestWorkingGroupInstance = crate::Instance1;
pub type TestWorkingGroup = Module<Test, TestWorkingGroupInstance>;

pub(crate) const WORKING_GROUP_MINT_CAPACITY: u64 = 40000;
pub(crate) const WORKING_GROUP_CONSTRAINT_MIN: u16 = 1;
pub(crate) const WORKING_GROUP_CONSTRAINT_DIFF: u16 = 40;

pub fn build_test_externalities() -> runtime_io::TestExternalities {
    let mut t = system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    crate::GenesisConfig::<Test, TestWorkingGroupInstance> {
        phantom: Default::default(),
        storage_working_group_mint_capacity: WORKING_GROUP_MINT_CAPACITY,
        opening_human_readable_text_constraint: InputValidationLengthConstraint::new(
            WORKING_GROUP_CONSTRAINT_MIN,
            WORKING_GROUP_CONSTRAINT_DIFF,
        ),
        worker_application_human_readable_text_constraint: InputValidationLengthConstraint::new(
            WORKING_GROUP_CONSTRAINT_MIN,
            WORKING_GROUP_CONSTRAINT_DIFF,
        ),
        worker_exit_rationale_text_constraint: InputValidationLengthConstraint::new(
            WORKING_GROUP_CONSTRAINT_MIN,
            WORKING_GROUP_CONSTRAINT_DIFF,
        ),
    }
    .assimilate_storage(&mut t)
    .unwrap();

    t.into()
}

pub struct StakingEventsHandler<T> {
    pub marker: PhantomData<T>,
}

impl<T: stake::Trait + crate::Trait<TestWorkingGroupInstance>> stake::StakingEventsHandler<T>
    for StakingEventsHandler<T>
{
    /// Unstake remaining sum back to the source_account_id
    fn unstaked(
        stake_id: &<T as stake::Trait>::StakeId,
        _unstaked_amount: BalanceOf<T>,
        remaining_imbalance: NegativeImbalance<T>,
    ) -> NegativeImbalance<T> {
        // Stake not related to a staked role managed by the hiring module.
        if !hiring::ApplicationIdByStakingId::<T>::exists(*stake_id) {
            return remaining_imbalance;
        }

        let hiring_application_id = hiring::ApplicationIdByStakingId::<T>::get(*stake_id);

        if crate::MemberIdByHiringApplicationId::<T, TestWorkingGroupInstance>::exists(
            hiring_application_id,
        ) {
            return <crate::Module<T, TestWorkingGroupInstance>>::refund_working_group_stake(
                *stake_id,
                remaining_imbalance,
            );
        }

        remaining_imbalance
    }

    /// Empty handler for slashing
    fn slashed(
        _: &<T as stake::Trait>::StakeId,
        _: Option<<T as stake::Trait>::SlashId>,
        _: BalanceOf<T>,
        _: BalanceOf<T>,
        remaining_imbalance: NegativeImbalance<T>,
    ) -> NegativeImbalance<T> {
        remaining_imbalance
    }
}
