#![cfg(test)]

use frame_support::{
    impl_outer_event, impl_outer_origin, parameter_types,
    traits::{OnFinalize, OnInitialize},
};

use sp_arithmetic::Perbill;
use sp_io::TestExternalities;
use sp_runtime::testing::{Header, H256};
use sp_runtime::traits::{BlakeTwo256, IdentityLookup};

// crate import
use crate::{AccountDataOf, GenesisConfig, TokenDataOf, Trait};

// Crate aliases
pub type TokenId = <Test as Trait>::TokenId;
pub type TokenData = TokenDataOf<Test>;
pub type AccountData = AccountDataOf<Test>;
pub type AccountId = <Test as frame_system::Trait>::AccountId;

#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Test;

impl_outer_origin! {
    pub enum Origin for Test {}
}

mod event_mod {
    pub use crate::Event;
}

impl_outer_event! {
    pub enum TestEvent for Test {
        event_mod<T>,
        frame_system<T>,
    }
}

parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
}

impl frame_system::Trait for Test {
    type BaseCallFilter = ();
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
    type DbWeight = ();
    type BlockExecutionWeight = ();
    type ExtrinsicBaseWeight = ();
    type MaximumExtrinsicWeight = ();
    type MaximumBlockLength = MaximumBlockLength;
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = ();
    type AccountData = balances::AccountData<u64>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type PalletInfo = ();
    type SystemWeightInfo = ();
}

impl Trait for Test {
    type Event = TestEvent;
    type Balance = u64;
    type TokenId = u32;
}

/// Genesis config builder
pub struct GenesisConfigBuilder {
    account_info_by_account_and_token: Vec<(TokenId, AccountId, AccountData)>,
    token_info_by_id: Vec<(TokenId, TokenData)>,
    next_token_id: TokenId,
}

impl GenesisConfigBuilder {
    fn new() -> Self {
        Self {
            account_info_by_account_and_token: vec![],
            token_info_by_id: vec![],
            next_token_id: 1u32,
        }
    }

    fn build(self) -> GenesisConfig<Test> {
        GenesisConfig::<Test> {
            account_info_by_account_and_token: self.account_info_by_account_and_token,
            token_info_by_id: self.token_info_by_id,
            next_token_id: self.next_token_id,
        }
    }
}

/// test externalities
pub fn build_test_externalities(config: GenesisConfig<Test>) -> TestExternalities {
    let mut t = frame_system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    config.assimilate_storage(&mut t).unwrap();

    let mut test_scenario = Into::<sp_io::TestExternalities>::into(t.clone());

    // Make sure we are not in block 1 where no events are emitted
    test_scenario.execute_with(|| increase_block_number_by(1));

    test_scenario
}

/// Moving past n blocks
pub fn increase_block_number_by(n: u64) {
    let init_block = System::block_number();
    (0..n).for_each(|offset| {
        <Token as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(init_block.saturating_add(offset));
        <Token as OnInitialize<u64>>::on_initialize(System::block_number());
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
    })
}

// Modules aliases
pub type Token = crate::Module<Test>;
pub type System = frame_system::Module<Test>;
