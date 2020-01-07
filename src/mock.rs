#![cfg(test)]
use primitives::H256;
use runtime_primitives::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};
use srml_support::{impl_outer_origin, parameter_types};

use crate::{Module, StakeHandler, Trait};
use balances;
use stake;

use mocktopus::macros::*;

impl_outer_origin! {
    pub enum Origin for Test {}
}

parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
}

// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Test;

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

parameter_types! {
    pub const ExistentialDeposit: u32 = 100;
    pub const TransferFee: u32 = 0;
    pub const CreationFee: u32 = 0;
    pub const TransactionBaseFee: u32 = 1;
    pub const TransactionByteFee: u32 = 0;
    pub const InitialMembersBalance: u64 = 2000;
    pub const StakePoolId: [u8; 8] = *b"joystake";
}

impl balances::Trait for Test {
    /// The type for recording an account's balance.
    type Balance = u64;
    /// What to do if an account's free balance gets zeroed.
    type OnFreeBalanceZero = ();
    /// What to do if a new account is created.
    type OnNewAccount = ();
    /// The ubiquitous event type.
    type Event = ();

    type DustRemoval = ();
    type TransferPayment = ();
    type ExistentialDeposit = ExistentialDeposit;
    type TransferFee = TransferFee;
    type CreationFee = CreationFee;
}

impl Trait for Test {
    type OpeningId = u64;

    type ApplicationId = u64;

    type ApplicationDeactivatedHandler = ();

//    type StakeHandler = Test;
}

impl stake::Trait for Test {
    type Currency = Balances;
    type StakePoolId = StakePoolId;
    type StakingEventsHandler = ();
    type StakeId = u64;
    type SlashId = u64;
}

pub(crate) fn build_test_externalities() -> runtime_io::TestExternalities {
    let t = system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    t.into()
}

pub type Balances = balances::Module<Test>;
pub type Hiring = Module<Test>;

#[mockable]
impl StakeHandler<Test> for Test {
    fn create_stake() -> <Test as stake::Trait>::StakeId {
        <crate::Module<Test>>::create_stake()
    }

    fn stake(
        new_stake_id: &<Test as stake::Trait>::StakeId,
        imbalance: crate::NegativeImbalance<Self>,
    ) -> Result<(), stake::StakeActionError<stake::StakingError>> {
        <crate::Module<Test>>::stake(new_stake_id, imbalance)
    }

    fn stake_exists(stake_id: <Test as stake::Trait>::StakeId) -> bool {
        <crate::Module<Test>>::stake_exists(stake_id)
    }

    fn get_stake(
        stake_id: <Test as stake::Trait>::StakeId,
    ) -> stake::Stake<
        <Test as system::Trait>::BlockNumber,
        super::BalanceOf<Test>,
        <Test as stake::Trait>::SlashId,
    > {
        <crate::Module<Test>>::get_stake(stake_id)
    }

    fn initiate_unstaking(
        stake_id: &<Test as stake::Trait>::StakeId,
        unstaking_period: Option<<Test as system::Trait>::BlockNumber>,
    ) -> Result<(), stake::StakeActionError<stake::InitiateUnstakingError>> {
        <crate::Module<Test>>::initiate_unstaking(stake_id, unstaking_period)
    }
}


