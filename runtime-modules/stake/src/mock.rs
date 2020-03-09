#![cfg(test)]

use crate::*;

use primitives::H256;

use crate::{Module, Trait};
use balances;
use runtime_primitives::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};
use srml_support::{impl_outer_origin, parameter_types};

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
    pub const ExistentialDeposit: u32 = 500;
    pub const TransferFee: u32 = 5;
    pub const CreationFee: u32 = 5;
    pub const TransactionBaseFee: u32 = 5;
    pub const TransactionByteFee: u32 = 0;
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
    type Currency = Balances;
    type StakePoolId = StakePoolId;
    type StakingEventsHandler = ();
    type StakeId = u64;
    type SlashId = u64;
}

pub fn build_test_externalities() -> runtime_io::TestExternalities {
    let t = system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    t.into()
}

pub type System = system::Module<Test>;
pub type Balances = balances::Module<Test>;
pub type StakePool = Module<Test>;

// Some helper methods for creating Stake states
pub mod fixtures {
    use super::*;
    pub type OngoingSlashes = BTreeMap<
        <Test as Trait>::SlashId,
        Slash<<Test as system::Trait>::BlockNumber, BalanceOf<Test>>,
    >;
    // pub enum StakeInState {
    //     NotStaked,
    //     StakedNormal(BalanceOf<Test>, OngoingSlashes),
    //     StakedUnstaking(BalanceOf<Test>, OngoingSlashes, <Test as system::Trait>::BlockNumber),
    // }
    // fn get_next_slash_id() -> SlashId {
    // }
    // pub fn make_stake(state: StakeInState) -> StakeId {
    //     let id = StakePool::create_stake();
    //     <Stakes<Test>>::mutate(id, |stake| {});
    //     id
    // }
    // fn stake_in_state_to_stake(StakeInState) -> StakedState {}
}
