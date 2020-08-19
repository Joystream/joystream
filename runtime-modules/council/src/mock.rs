#![cfg(test)]

/////////////////// Configuration //////////////////////////////////////////////
use crate::{
    Candidate, CouncilElectionStage, Error, Event, GenesisConfig, Module, RawEvent, Trait,
};

use codec::Encode;
use frame_support::{
    impl_outer_event, impl_outer_origin, parameter_types, StorageMap, StorageValue,
};
use rand::Rng;
use sp_core::H256;
use sp_io;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};
use std::marker::PhantomData;
use system::RawOrigin;

pub const USER_ADMIN: u64 = 1;
pub const USER_REGULAR: u64 = 2;
pub const USER_REGULAR_POWER_VOTES: u64 = 3;
pub const USER_REGULAR_2: u64 = 4;
pub const USER_REGULAR_3: u64 = 5;

pub const POWER_VOTE_STRENGTH: u64 = 10;

pub const VOTER_BASE_ID: u64 = 4000;
pub const CANDIDATE_BASE_ID: u64 = 5000;

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
    pub use referendum::Event;
    pub use referendum::Instance0;
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

type ReferendumInstance = referendum::Instance0;

parameter_types! {
    pub const MaxReferendumOptions: u64 = 10;
    pub const VoteStageDuration: u64 = 5;
    pub const RevealStageDuration: u64 = 5;
    pub const MinimumStake: u64 = 10000;
}

impl referendum::Trait<ReferendumInstance> for Runtime {
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
        stake: <Self as referendum::Trait<ReferendumInstance>>::CurrencyBalance,
    ) -> <Self as referendum::Trait<ReferendumInstance>>::VotePower {
        let stake: u64 = stake.into();
        if *account_id == USER_REGULAR_POWER_VOTES {
            return stake * POWER_VOTE_STRENGTH;
        }

        stake
    }

    fn can_stake_for_vote(
        account_id: &<Self as system::Trait>::AccountId,
        _balance: &Self::CurrencyBalance,
    ) -> bool {
        match *account_id {
            USER_ADMIN => true,
            USER_REGULAR => true,
            USER_REGULAR_POWER_VOTES => true,
            USER_REGULAR_2 => true,
            USER_REGULAR_3 => true,
            _ if account_id >= &4000u64 && account_id < &5000u64 => true, // generated voter accounts
            _ => false,
        }
    }

    fn lock_currency(
        account_id: &<Self as system::Trait>::AccountId,
        balance: &Self::CurrencyBalance,
    ) -> bool {
        // simple mock reusing can_lock check
        <Self as referendum::Trait<ReferendumInstance>>::can_stake_for_vote(account_id, balance)
    }

    fn free_currency(
        account_id: &<Self as system::Trait>::AccountId,
        balance: &Self::CurrencyBalance,
    ) -> bool {
        // simple mock reusing can_lock check
        <Self as referendum::Trait<ReferendumInstance>>::can_stake_for_vote(account_id, balance)
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
        candidates: vec![],
    }
}

pub fn build_test_externalities(config: GenesisConfig<Runtime>) -> sp_io::TestExternalities {
    let mut t = system::GenesisConfig::default()
        .build_storage::<Runtime>()
        .unwrap();

    config.assimilate_storage(&mut t).unwrap();

    let mut result = Into::<sp_io::TestExternalities>::into(t.clone());

    // Make sure we are not in block 1 where no events are emitted - see https://substrate.dev/recipes/2-appetizers/4-events.html#emitting-events
    result.execute_with(|| InstanceMockUtils::<Runtime>::increase_block_number(1));

    result
}

pub struct InstanceMockUtils<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> InstanceMockUtils<T>
where
    T::AccountId: From<u64>,
{
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

    pub fn increase_block_number(increase: T::BlockNumber) -> () {
        let block_number = system::Module::<T>::block_number();
        system::Module::<T>::set_block_number(block_number + increase);
    }

    pub fn generate_candidate(index: u64) -> (OriginType<T::AccountId>, Candidate) {
        let account_id = CANDIDATE_BASE_ID + index;
        let origin = OriginType::Signed(account_id.into());
        let candidate = Candidate { tmp: 0 };

        (origin, candidate)
    }

    pub fn generate_voter(
        index: u64,
        vote_for_index: u64,
    ) -> (OriginType<T::AccountId>, T::Hash, Vec<u8>) {
        let account_id = VOTER_BASE_ID + index;
        let origin = OriginType::Signed(account_id.into());
        let (commitment, salt) = Self::vote_commitment(account_id.into(), vote_for_index.into());

        (origin, commitment, salt)
    }

    pub fn vote_commitment(
        account_id: <T as system::Trait>::AccountId,
        option: T::ReferendumOption,
    ) -> (T::Hash, Vec<u8>) {
        let mut rng = rand::thread_rng();
        let salt = rng.gen::<u64>().to_be_bytes().to_vec();
        let mut salt_tmp = salt.clone();

        let mut payload = account_id.encode();
        payload.append(&mut salt_tmp);
        payload.append(&mut option.into().to_be_bytes().to_vec());

        let commitment = <T::Hashing as sp_runtime::traits::Hash>::hash(&payload);

        (commitment, salt)
    }
}

/////////////////// Mocks of Module's actions //////////////////////////////////

pub struct InstanceMocks<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> InstanceMocks<T>
where
    T::AccountId: From<u64>,
{
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

    pub fn candidate(
        origin: OriginType<T::AccountId>,
        stake: T::CurrencyBalance,
        expected_result: Result<(), Error<T>>,
    ) -> () {
        // check method returns expected result
        assert_eq!(
            Module::<T>::candidate(InstanceMockUtils::<T>::mock_origin(origin), stake),
            expected_result,
        );
    }

    pub fn finalize_announcing_period(
        origin: OriginType<T::AccountId>,
        expected_result: Result<(), Error<T>>,
        expect_candidates: Option<Vec<Candidate>>,
    ) -> () {
        // check method returns expected result
        assert_eq!(
            Module::<T>::finalize_announcing_period(InstanceMockUtils::<T>::mock_origin(origin),),
            expected_result,
        );

        if expected_result.is_err() {
            return;
        }

        if expect_candidates.is_none() {
            // check event was emitted
            assert_eq!(
                system::Module::<Runtime>::events().last().unwrap().event,
                TestEvent::event_mod(RawEvent::NotEnoughCandidates())
            );
            return;
        }

        // check event was emitted
        assert_eq!(
            system::Module::<Runtime>::events().last().unwrap().event,
            TestEvent::event_mod(RawEvent::VotingPeriodStarted(expect_candidates.unwrap()))
        );
    }

    pub fn vote_for_candidate(
        origin: OriginType<T::AccountId>,
        commitment: T::Hash,
        stake: T::CurrencyBalance,
        expected_result: Result<(), Error<T>>,
    ) -> () {
        // check method returns expected result
        assert_eq!(
            Module::<T>::vote(
                InstanceMockUtils::<T>::mock_origin(origin),
                commitment,
                stake
            ),
            expected_result,
        );
    }

    pub fn reveal_vote(
        origin: OriginType<T::AccountId>,
        salt: Vec<u8>,
        vote_option: <T as referendum::Trait<ReferendumInstance>>::ReferendumOption,
        expected_result: Result<(), Error<T>>,
    ) -> () {
        // check method returns expected result
        assert_eq!(
            Module::<T>::reveal_vote(
                InstanceMockUtils::<T>::mock_origin(origin),
                salt,
                vote_option,
            ),
            expected_result,
        );
    }

    pub fn finish_voting_start_revealing(
        origin: OriginType<T::AccountId>,
        expected_result: Result<(), Error<T>>,
    ) -> () {
        assert_eq!(
            Module::<T>::finish_voting_start_revealing(InstanceMockUtils::<T>::mock_origin(origin)),
            expected_result,
        );
    }

    pub fn finish_revealing_period(
        origin: OriginType<T::AccountId>,
        expected_result: Result<(), Error<T>>,
    ) -> () {
        assert_eq!(
            Module::<T>::finish_revealing_period(InstanceMockUtils::<T>::mock_origin(origin)),
            expected_result,
        );
    }
}
