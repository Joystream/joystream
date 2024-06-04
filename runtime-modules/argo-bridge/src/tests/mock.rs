#![cfg(test)]

use crate as argo_bridge;
use crate::*;

use frame_support::{
    parameter_types,
    traits::{OnFinalize, OnInitialize},
};

use frame_support::traits::{ConstU16, ConstU32, ConstU64};
use sp_runtime::testing::{Header, H256};
use sp_runtime::traits::{BlakeTwo256, IdentityLookup};
use sp_std::convert::{TryFrom, TryInto};

// Crate aliases
type BalanceOf<T> = <T as balances::Config>::Balance;
pub type Balance = BalanceOf<Test>;
type UncheckedExtrinsic = frame_system::mocking::MockUncheckedExtrinsic<Test>;
type Block = frame_system::mocking::MockBlock<Test>;
pub type AccountId = <Test as frame_system::Config>::AccountId;
pub type BlockNumber = <Test as frame_system::Config>::BlockNumber;

parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MinimumPeriod: u64 = 5;
    pub const ExistentialDeposit: u64 = 10;
    pub const DefaultMembershipPrice: u64 = 100;
    pub const DefaultInitialInvitationBalance: u64 = 100;
    pub const DefaultMemberInvitesCount: u32 = 2;
}

// Config constants
parameter_types! {
    pub const MaxPauserAccounts: u32 = 10;
    pub const DefaultBridgingFee: Balance = 1;
}

#[macro_export]
macro_rules! last_event_eq {
    ($e:expr) => {
        assert_eq!(
            System::events().last().unwrap().event,
            RuntimeEvent::ArgoBridge($e)
        )
    };
}

frame_support::construct_runtime!(
    pub enum Test where
        Block = Block,
        NodeBlock = Block,
        UncheckedExtrinsic = UncheckedExtrinsic,
    {
        System: frame_system,
        Balances: balances,
        Timestamp: pallet_timestamp::{Pallet, Call, Storage, Inherent},
        ArgoBridge: argo_bridge::{Pallet, Call, Storage, Event<T>},
    }
);

impl frame_system::Config for Test {
    type BaseCallFilter = frame_support::traits::Everything;
    type BlockWeights = ();
    type BlockLength = ();
    type DbWeight = ();
    type RuntimeOrigin = RuntimeOrigin;
    type RuntimeCall = RuntimeCall;
    type Index = u64;
    type BlockNumber = u64;
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u64;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type RuntimeEvent = RuntimeEvent;
    type BlockHashCount = ConstU64<250>;
    type Version = ();
    type PalletInfo = PalletInfo;
    type AccountData = balances::AccountData<u64>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type SystemWeightInfo = ();
    type SS58Prefix = ConstU16<42>;
    type OnSetCode = ();
    type MaxConsumers = frame_support::traits::ConstU32<16>;
}

impl pallet_timestamp::Config for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

impl balances::Config for Test {
    type Balance = u64;
    type DustRemoval = ();
    type RuntimeEvent = RuntimeEvent;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type MaxLocks = ();
    type MaxReserves = ConstU32<2>;
    type ReserveIdentifier = [u8; 8];
    type WeightInfo = ();
}

impl Config for Test {
    type RuntimeEvent = RuntimeEvent;
    type MaxPauserAccounts = MaxPauserAccounts;
    type WeightInfo = argo_bridge::weights::SubstrateWeight<Test>;
    type DefaultBridgingFee = DefaultBridgingFee;
}

pub fn default_genesis_config() -> argo_bridge::GenesisConfig<Test> {
    argo_bridge::GenesisConfig::<Test> {
        status: BridgeStatus::Paused,
        mint_allowance: 0,
        bridging_fee: DefaultBridgingFee::get(),
        thawn_duration: 1,
    }
}

pub fn build_test_externalities(mint_allowance: Balance) -> sp_io::TestExternalities {
    let mut t = frame_system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    let mut configs = default_genesis_config();
    configs.mint_allowance = mint_allowance;
    configs.assimilate_storage(&mut t).unwrap();

    t.into()
}

/// Generate enviroment with test externalities
pub fn with_test_externalities<R, F: FnOnce() -> R>(f: F) -> R {
    /*
        Events are not emitted on block 0.
        So any dispatchable calls made during genesis block formation will have no events emitted.
        https://substrate.dev/recipes/2-appetizers/4-events.html
    */
    let func = || {
        increase_block_number_by(1);
        f()
    };

    build_test_externalities(0).execute_with(func)
}

pub fn with_test_externalities_custom_mint_allowance<R, F: FnOnce() -> R>(
    mint_allowance: Balance,
    f: F,
) -> R {
    /*
        Events are not emitted on block 0.
        So any dispatchable calls made during genesis block formation will have no events emitted.
        https://substrate.dev/recipes/2-appetizers/4-events.html
    */
    let func = || {
        increase_block_number_by(1);
        f()
    };

    build_test_externalities(mint_allowance).execute_with(func)
}

/// Moving past n blocks
pub fn increase_block_number_by(n: u64) {
    let init_block = System::block_number();
    (0..=n).for_each(|offset| {
        <ArgoBridge as OnFinalize<u64>>::on_finalize(System::block_number());
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(init_block.saturating_add(offset));
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
        <ArgoBridge as OnInitialize<u64>>::on_initialize(System::block_number());
    })
}

#[macro_export]
macro_rules! joy {
    ($bal:expr) => {
        Balance::from($bal as u64)
    };
}

#[macro_export]
macro_rules! account {
    ($acc:expr) => {
        AccountId::from($acc as u64)
    };
}
