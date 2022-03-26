#![cfg(test)]

use frame_support::{
    impl_outer_event, impl_outer_origin, parameter_types,
    traits::{OnFinalize, OnInitialize},
};

use sp_arithmetic::{
    traits::{One, Zero},
    Perbill,
};
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
pub type Balance = <Test as Trait>::Balance;

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
    type TokenId = u64;
}

/// Genesis config builder
pub struct GenesisConfigBuilder {
    account_info_by_token_and_account: Vec<(TokenId, AccountId, AccountData)>,
    token_info_by_id: Vec<(TokenId, TokenData)>,
    next_token_id: TokenId,
}

impl GenesisConfigBuilder {
    pub fn new() -> Self {
        Self {
            token_info_by_id: vec![],
            account_info_by_token_and_account: vec![],
            next_token_id: One::one(),
        }
    }

    pub fn add_token_and_account_info(mut self) -> Self {
        let new_id = self.next_token_id;
        let new_token_info = (
            new_id,
            crate::types::TokenIssuanceParametersOf::<Test> {
                initial_issuance: Balance::from(DEFAULT_FREE_BALANCE),
                existential_deposit: Balance::from(DEFAULT_EXISTENTIAL_DEPOSIT),
                initial_state: crate::types::IssuanceState::Idle,
                symbol: (),
            }
            .try_build::<Test>()
            .unwrap(),
        );
        let new_account_info = AccountData {
            free_balance: Balance::from(DEFAULT_FREE_BALANCE),
            reserved_balance: Balance::zero(),
        };

        self.next_token_id = new_id.saturating_add(One::one());
        self.token_info_by_id.push(new_token_info);
        self.account_info_by_token_and_account.push((
            new_id,
            AccountId::from(DEFAULT_ACCOUNT_ID),
            new_account_info,
        ));

        self
    }

    pub fn build(self) -> GenesisConfig<Test> {
        GenesisConfig::<Test> {
            account_info_by_token_and_account: self.account_info_by_token_and_account,
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

pub const DEFAULT_EXISTENTIAL_DEPOSIT: u64 = 5;
pub const DEFAULT_FREE_BALANCE: u64 = 10;
pub const DEFAULT_ACCOUNT_ID: u64 = 1;
