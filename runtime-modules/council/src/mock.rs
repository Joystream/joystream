#![cfg(test)]

/////////////////// Configuration //////////////////////////////////////////////
use crate::{Error, Event, Module, CouncilElectionStage, GenesisConfig, Trait};

use sp_core::H256;
use sp_io;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};
use frame_support::{impl_outer_event, impl_outer_origin, parameter_types, StorageValue, StorageMap};
use std::marker::PhantomData;
use system::RawOrigin;
use codec::{Encode};

pub const USER_ADMIN: u64 = 1;
pub const USER_REGULAR: u64 = 2;
pub const USER_REGULAR_POWER_VOTES: u64 = 3;
pub const USER_REGULAR_2: u64 = 4;
pub const USER_REGULAR_3: u64 = 5;

pub const POWER_VOTE_STRENGTH: u64 = 10;


/////////////////// Runtime and Instances //////////////////////////////////////
// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Runtime;

parameter_types! {
    pub const MinNumberOfCandidates: u64 = 2;
    pub const AnnouncingPeriodDuration: u64 = 10;
    pub const IdlePeriodDuration: u64 = 10;
    pub const CouncilSize: u64 = 3;
}

impl Trait for Runtime {
    type Event = TestEvent;

    type Tmp = u64;

    type MinNumberOfCandidates = MinNumberOfCandidates;
    type CouncilSize = CouncilSize;
    type AnnouncingPeriodDuration = AnnouncingPeriodDuration;
    type IdlePeriodDuration = IdlePeriodDuration;

    fn is_super_user(account_id: &<Self as system::Trait>::AccountId) -> bool {
        *account_id == USER_ADMIN
    }
}

/////////////////// Module implementation //////////////////////////////////////

impl_outer_origin! {
    pub enum Origin for Runtime {}
}

mod event_mod {
    pub use crate::Event;
}

mod referendum_mod {
    pub use referendum::Instance0;
    pub use referendum::Event;
}

impl_outer_event! {
    pub enum TestEvent for Runtime {
        event_mod<T>,
        referendum_mod Instance0 <T>,
        system<T>,
    }
}

parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
}

impl system::Trait for Runtime {
    type BaseCallFilter = ();
    type Origin = Origin;
    type Index = u64;
    type BlockNumber = u64;
    type Call = ();
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
    type ModuleToIndex = ();
    type AccountData = ();
    type OnNewAccount = ();
    type OnKilledAccount = ();
}


/////////////////// Election module ////////////////////////////////////////////

type Instance0 = referendum::Instance0;


parameter_types! {
    pub const MaxReferendumOptions: u64 = 10;
    pub const VoteStageDuration: u64 = 5;
    pub const RevealStageDuration: u64 = 5;
    pub const MinimumStake: u64 = 10000;
}

impl referendum::Trait<Instance0> for Runtime {
    type Event = TestEvent;

    type MaxReferendumOptions = MaxReferendumOptions;
    type ReferendumOption = u64;

    type CurrencyBalance = u64;
    type VotePower = u64;

    type VoteStageDuration = VoteStageDuration;
    type RevealStageDuration = RevealStageDuration;

    type MinimumStake = MinimumStake;

    fn is_super_user(account_id: &<Self as system::Trait>::AccountId) -> bool {
        *account_id == USER_ADMIN
    }

    fn caclulate_vote_power(
        account_id: &<Self as system::Trait>::AccountId,
        stake: <Self as referendum::Trait<Instance0>>::CurrencyBalance,
    ) -> <Self as referendum::Trait<Instance0>>::VotePower {
        let stake: u64 = stake.into();
        if *account_id == USER_REGULAR_POWER_VOTES {
            return stake * POWER_VOTE_STRENGTH;
        }

        stake
    }

    fn has_sufficient_balance(
        account_id: &<Self as system::Trait>::AccountId,
        _balance: &Self::CurrencyBalance,
    ) -> bool {
        match *account_id {
            USER_ADMIN => true,
            USER_REGULAR => true,
            USER_REGULAR_POWER_VOTES => true,
            USER_REGULAR_2 => true,
            USER_REGULAR_3 => true,
            _ => false,
        }
    }

    fn lock_currency(
        account_id: &<Self as system::Trait>::AccountId,
        balance: &Self::CurrencyBalance,
    ) -> bool {
        // simple mock reusing can_lock check
        <Self as referendum::Trait<Instance0>>::has_sufficient_balance(account_id, balance)
    }

    fn free_currency(
        account_id: &<Self as system::Trait>::AccountId,
        balance: &Self::CurrencyBalance,
    ) -> bool {
        // simple mock reusing can_lock check
        <Self as referendum::Trait<Instance0>>::has_sufficient_balance(account_id, balance)
    }
}


/////////////////// Data structures ////////////////////////////////////////////

#[allow(dead_code)]
#[derive(Clone)]
pub enum OriginType<AccountId> {
    Signed(AccountId),
    //Inherent, <== did not find how to make such an origin yet
    Root,
}

/////////////////// Utility mocks //////////////////////////////////////////////

pub fn default_genesis_config() -> GenesisConfig<Runtime> {
    GenesisConfig::<Runtime> {
        stage: (CouncilElectionStage::default(), 0),
        council_members: vec![],
    }
}

pub fn build_test_externalities(
    config: GenesisConfig<Runtime>,
) -> sp_io::TestExternalities {
    let mut t = system::GenesisConfig::default()
        .build_storage::<Runtime>()
        .unwrap();

    config.assimilate_storage(&mut t).unwrap();

    t.into()
}

pub struct InstanceMockUtils<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> InstanceMockUtils<T> {

    pub fn mock_origin(origin: OriginType<T::AccountId>) -> T::Origin {
        match origin {
            OriginType::Signed(account_id) => T::Origin::from(RawOrigin::Signed(account_id)),
            _ => panic!("not implemented"),
        }
    }

    pub fn origin_access<F: Fn(OriginType<T::AccountId>) -> ()>(
        origin_account_id: T::AccountId,
        f: F,
    ) {
        let config = default_genesis_config();

        build_test_externalities(config).execute_with(|| {
            let origin = OriginType::Signed(origin_account_id);

            f(origin)
        });
    }
}

/////////////////// Mocks of Module's actions //////////////////////////////////

pub struct InstanceMocks<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> InstanceMocks<T> {

    pub fn start_announcing_period(
        origin: OriginType<T::AccountId>,
        expected_result: Result<(), Error<T>>,
    ) -> () {
        // check method returns expected result
        assert_eq!(
            Module::<T>::start_announcing_period(InstanceMockUtils::<T>::mock_origin(origin),),
            expected_result,
        );
    }
}
