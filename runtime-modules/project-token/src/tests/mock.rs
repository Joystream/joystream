#![cfg(test)]

use frame_support::{
    impl_outer_event, impl_outer_origin, parameter_types,
    traits::{OnFinalize, OnInitialize},
};

use sp_arithmetic::{traits::One, Perbill};
use sp_io::TestExternalities;
use sp_runtime::testing::{Header, H256};
use sp_runtime::traits::{BlakeTwo256, IdentityLookup};
use sp_std::ops::Rem;

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
    pub fn new_empty() -> Self {
        Self {
            token_info_by_id: vec![],
            account_info_by_token_and_account: vec![],
            next_token_id: One::one(),
        }
    }

    pub fn add_default_token_info(self) -> Self {
        let next_token_id = DEFAULT_TOKENS_NUMBER.saturating_add(TokenId::one());
        let token_info_by_id = (1..next_token_id)
            .map(|id| {
                (
                    id,
                    crate::types::TokenIssuanceParametersOf::<Test> {
                        initial_issuance: total_issuance_for_token(id),
                        existential_deposit: existential_deposit_for_token(id),
                        initial_state: crate::types::IssuanceState::Idle,
                        owner_account: owner_for_token(id),
                        symbol: (),
                    }
                    .try_build::<Test>()
                    .unwrap(),
                )
            })
            .collect::<Vec<(TokenId, TokenData)>>();
        Self {
            next_token_id,
            token_info_by_id,
            ..self
        }
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

pub const DEFAULT_TOKENS_NUMBER: u64 = 10;
pub const DEFAULT_USERS_NUMBER: u64 = 7;

// Reference chain state for tests
pub(crate) fn existential_deposit_for_token(id: TokenId) -> Balance {
    // existential deposit 1/4
    total_issuance_for_token(id)
        .checked_div(TokenId::from(4u32))
        .unwrap()
        .checked_div(DEFAULT_USERS_NUMBER)
        .unwrap()
}

pub(crate) fn total_issuance_for_token(id: TokenId) -> Balance {
    id.saturating_sub(TokenId::one())
        .saturating_mul(TokenId::from(40u32))
        .saturating_mul(TokenId::from(DEFAULT_USERS_NUMBER))
}

pub(crate) fn owner_for_token(id: TokenId) -> Balance {
    id.rem(DEFAULT_USERS_NUMBER)
}

pub(crate) fn config_for_token_and_account(id: TokenId) -> AccountData {
    let balance_for_user = total_issuance_for_token(id)
        .checked_div(DEFAULT_USERS_NUMBER)
        .unwrap();

    // reserved, free = (1/4, 3/4)
    let reserved_balance = balance_for_user.checked_div(Balance::from(4u32)).unwrap();
    let free_balance = balance_for_user.saturating_mul(Balance::from(3u32));

    AccountData {
        reserved_balance,
        free_balance,
    }
}

impl Default for GenesisConfigBuilder {
    fn default() -> Self {
        let next_token_id = DEFAULT_TOKENS_NUMBER.saturating_add(1u64);
        let token_info_by_id = (1..next_token_id)
            .map(|id| {
                (
                    id,
                    crate::types::TokenIssuanceParametersOf::<Test> {
                        initial_issuance: total_issuance_for_token(id),
                        existential_deposit: existential_deposit_for_token(id),
                        initial_state: crate::types::IssuanceState::Idle,
                        owner_account: owner_for_token(id),
                        symbol: (),
                    }
                    .try_build::<Test>()
                    .unwrap(),
                )
            })
            .collect::<Vec<(TokenId, TokenData)>>();

        let account_info_by_token_and_account = (1..next_token_id)
            .map(|id| {
                (1..=DEFAULT_USERS_NUMBER)
                    .map(move |account| (id, account, config_for_token_and_account(id)))
            })
            .flatten()
            .collect::<Vec<(TokenId, AccountId, AccountData)>>();

        Self {
            account_info_by_token_and_account,
            token_info_by_id,
            next_token_id,
        }
    }
}
