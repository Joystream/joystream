#![cfg(test)]

/////////////////// Configuration //////////////////////////////////////////////
use crate::{
    Error, Instance, Module, RawEvent, ReferendumManager, ReferendumOptions, ReferendumResult,
    ReferendumStage, ReferendumStageRevealing, ReferendumStageVoting, SealedVote, Stage, Trait,
    Votes,
};

use codec::Encode;
use rand::Rng;
use sp_core::H256;
//use sp_io;
use frame_support::traits::OnFinalize;
use frame_support::{
    impl_outer_event, impl_outer_origin, parameter_types, StorageMap, StoragePrefixedMap,
    StorageValue,
};
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};
use std::cell::RefCell;
use std::marker::PhantomData;
use system::RawOrigin;

use crate::GenesisConfig;

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

// module instances

#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Instance0;

parameter_types! {
    pub const MaxReferendumOptions: u64 = 10;
    pub const VoteStageDuration: u64 = 5;
    pub const RevealStageDuration: u64 = 5;
    pub const MinimumStake: u64 = 10000;
}

thread_local! {
    pub static IS_LOCKING_ENABLED: RefCell<(bool, bool, bool)> = RefCell::new((true, true, true)); // global switch for stake locking features; use it to simulate lock fails
}

impl Trait<Instance0> for Runtime {
    type Event = TestEvent;

    type MaxReferendumOptions = MaxReferendumOptions;
    type ReferendumOption = u64;

    type CurrencyBalance = u64;
    type VotePower = u64;
    type ReferendumUserId = u64;

    type VoteStageDuration = VoteStageDuration;
    type RevealStageDuration = RevealStageDuration;

    type MinimumStake = MinimumStake;

    fn is_super_user(account_id: &<Self as system::Trait>::AccountId) -> bool {
        *account_id == USER_ADMIN
    }

    fn is_referendum_member(
        account_id: &<Self as system::Trait>::AccountId,
        referendum_user_id: &Self::ReferendumUserId,
    ) -> bool {
        account_id == referendum_user_id
    }

    fn caclulate_vote_power(
        account_id: &<Self as system::Trait>::AccountId,
        stake: <Self as Trait<Instance0>>::CurrencyBalance,
    ) -> <Self as Trait<Instance0>>::VotePower {
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
        // trigger fail when requested to do so
        if !IS_LOCKING_ENABLED.with(|value| value.borrow().0) {
            return false;
        }

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
        // trigger fail when requested to do so
        if !IS_LOCKING_ENABLED.with(|value| value.borrow().1) {
            return false;
        }

        // simple mock reusing can_lock check
        <Self as Trait<Instance0>>::has_sufficient_balance(account_id, balance)
    }

    fn free_currency(
        account_id: &<Self as system::Trait>::AccountId,
        balance: &Self::CurrencyBalance,
    ) -> bool {
        if !IS_LOCKING_ENABLED.with(|value| value.borrow().2) {
            return false;
        }

        // simple mock reusing can_lock check
        <Self as Trait<Instance0>>::has_sufficient_balance(account_id, balance)
    }
}

impl Runtime {
    pub fn feature_stack_lock(
        ensure_check_enabled: bool,
        lock_enabled: bool,
        free_enabled: bool,
    ) -> () {
        IS_LOCKING_ENABLED.with(|value| {
            *value.borrow_mut() = (ensure_check_enabled, lock_enabled, free_enabled);
        });
    }
}

/////////////////// Module implementation //////////////////////////////////////

impl_outer_origin! {
    pub enum Origin for Runtime {}
}

mod event_mod {
    pub use super::Instance0;
    pub use crate::Event;
}

impl_outer_event! {
    pub enum TestEvent for Runtime {
        event_mod Instance0 <T>,
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

//#[allow(non_upper_case_globals)] // `decl_storage` macro defines this weird name
impl Instance for Instance0 {
    const PREFIX: &'static str = "Instance0";
}

impl system::Trait for Runtime {
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
    type ModuleToIndex = ();
    type AccountData = ();
    type OnNewAccount = ();
    type OnKilledAccount = ();
}

/////////////////// Data structures ////////////////////////////////////////////

#[allow(dead_code)]
#[derive(Clone)]
pub enum OriginType<AccountId> {
    Signed(AccountId),
    //Inherent, <== did not find how to make such an origin yet
    Root,
}

/////////////////// Utility mocks //////////////////////////////////////////////s

pub fn default_genesis_config() -> GenesisConfig<Runtime, Instance0> {
    GenesisConfig::<Runtime, Instance0> {
        stage: ReferendumStage::default(),
        //referendum_options: None
        referendum_options: vec![], // not sure why it doesn't accept `None` here
        votes: vec![],
    }
}

pub fn build_test_externalities(
    config: GenesisConfig<Runtime, Instance0>,
) -> sp_io::TestExternalities {
    let mut t = system::GenesisConfig::default()
        .build_storage::<Runtime>()
        .unwrap();

    config.assimilate_storage(&mut t).unwrap();

    // reset the static lock feature state
    Runtime::feature_stack_lock(true, true, true);

    let mut result = Into::<sp_io::TestExternalities>::into(t.clone());

    // Make sure we are not in block 1 where no events are emitted - see https://substrate.dev/recipes/2-appetizers/4-events.html#emitting-events
    result.execute_with(|| InstanceMockUtils::<Runtime, Instance0>::increase_block_number(1));

    result
}

pub struct InstanceMockUtils<T: Trait<I>, I: Instance> {
    _dummy: PhantomData<(T, I)>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait<I>, I: Instance> InstanceMockUtils<T, I>
where
    T::BlockNumber: From<u64> + Into<u64>,
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

    pub fn increase_block_number(increase: u64) -> () {
        let block_number = system::Module::<T>::block_number();

        for i in 0..increase {
            let tmp_index: T::BlockNumber = block_number + i.into();

            <Module<T, I> as OnFinalize<T::BlockNumber>>::on_finalize(tmp_index);
            system::Module::<T>::set_block_number(tmp_index + 1.into());
        }
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

pub struct InstanceMocks<T: Trait<I>, I: Instance> {
    _dummy: PhantomData<(T, I)>, // 0-sized data meant only to bound generic parameters
}

impl InstanceMocks<Runtime, Instance0> {
    pub fn start_referendum_extrinsic(
        origin: OriginType<<Runtime as system::Trait>::AccountId>,
        options: Vec<<Runtime as Trait<Instance0>>::ReferendumOption>,
        winning_target_count: u64,
        expected_result: Result<(), Error<Runtime, Instance0>>,
    ) -> () {
        // check method returns expected result
        assert_eq!(
            Module::<Runtime, Instance0>::start_referendum(
                InstanceMockUtils::<Runtime, Instance0>::mock_origin(origin),
                options.clone(),
                winning_target_count
            ),
            expected_result,
        );

        Self::start_referendum_inner(options, winning_target_count, expected_result)
    }

    pub fn start_referendum_manager(
        options: Vec<<Runtime as Trait<Instance0>>::ReferendumOption>,
        winning_target_count: u64,
        expected_result: Result<(), Error<Runtime, Instance0>>,
    ) -> () {
        // check method returns expected result
        assert_eq!(
            <Module::<Runtime, Instance0> as ReferendumManager<Runtime, Instance0>>::start_referendum(
                options.clone(),
                winning_target_count
            ),
            expected_result,
        );

        Self::start_referendum_inner(options, winning_target_count, expected_result)
    }

    fn start_referendum_inner(
        options: Vec<<Runtime as Trait<Instance0>>::ReferendumOption>,
        winning_target_count: u64,
        expected_result: Result<(), Error<Runtime, Instance0>>,
    ) {
        if expected_result.is_err() {
            return;
        }

        let block_number = system::Module::<Runtime>::block_number();

        assert_eq!(
            Stage::<Runtime, Instance0>::get(),
            ReferendumStage::Voting(ReferendumStageVoting {
                start: block_number,
                winning_target_count,
            }),
        );

        assert_eq!(
            ReferendumOptions::<Runtime, Instance0>::get(),
            Some(options.clone()),
        );

        assert_eq!(
            system::Module::<Runtime>::events().last().unwrap().event,
            TestEvent::from(RawEvent::ReferendumStarted(options, winning_target_count,))
        );
    }

    pub fn check_voting_finished(winning_target_count: u64) {
        let block_number = system::Module::<Runtime>::block_number();
        let options_len = ReferendumOptions::<Runtime, Instance0>::get()
            .unwrap()
            .len();

        assert_eq!(
            Stage::<Runtime, Instance0>::get(),
            ReferendumStage::Revealing(ReferendumStageRevealing {
                start: block_number - 1,
                winning_target_count,
                revealed_votes: (0..options_len).map(|_| 0).collect(),
            }),
        );

        // check event was emitted
        assert_eq!(
            system::Module::<Runtime>::events().last().unwrap().event,
            TestEvent::event_mod_Instance0(RawEvent::RevealingStageStarted())
        );
    }

    pub fn check_revealing_finished(
        expected_referendum_result: Option<
            ReferendumResult<
                <Runtime as Trait<Instance0>>::ReferendumOption,
                <Runtime as Trait<Instance0>>::VotePower,
            >,
        >,
    ) {
        assert_eq!(
            Stage::<Runtime, Instance0>::get(),
            ReferendumStage::Inactive,
        );
        assert_eq!(ReferendumOptions::<Runtime, Instance0>::get(), None,);
        assert_eq!(Votes::<Runtime, Instance0>::iter_values().count(), 0,);

        // check event was emitted
        assert_eq!(
            system::Module::<Runtime>::events().last().unwrap().event,
            TestEvent::event_mod_Instance0(RawEvent::ReferendumFinished(
                expected_referendum_result.unwrap()
            ))
        );
    }

    pub fn vote(
        origin: OriginType<<Runtime as system::Trait>::AccountId>,
        account_id: <Runtime as system::Trait>::AccountId,
        referendum_user_id: <Runtime as Trait<Instance0>>::ReferendumUserId,
        commitment: <Runtime as system::Trait>::Hash,
        stake: <Runtime as Trait<Instance0>>::CurrencyBalance,
        expected_result: Result<(), Error<Runtime, Instance0>>,
    ) -> () {
        // check method returns expected result
        assert_eq!(
            Module::<Runtime, Instance0>::vote(
                InstanceMockUtils::<Runtime, Instance0>::mock_origin(origin),
                referendum_user_id,
                commitment,
                stake,
            ),
            expected_result,
        );

        if expected_result.is_err() {
            return;
        }

        assert_eq!(
            Votes::<Runtime, Instance0>::get(account_id),
            SealedVote { commitment, stake },
        );

        // check event was emitted
        assert_eq!(
            system::Module::<Runtime>::events().last().unwrap().event,
            TestEvent::event_mod_Instance0(RawEvent::VoteCasted(commitment, stake))
        );
    }

    pub fn reveal_vote(
        origin: OriginType<<Runtime as system::Trait>::AccountId>,
        account_id: <Runtime as system::Trait>::AccountId,
        referendum_user_id: <Runtime as Trait<Instance0>>::ReferendumUserId,
        salt: Vec<u8>,
        vote_option: <Runtime as Trait<Instance0>>::ReferendumOption,
        expected_result: Result<(), Error<Runtime, Instance0>>,
    ) -> () {
        // check method returns expected result
        assert_eq!(
            Module::<Runtime, Instance0>::reveal_vote(
                InstanceMockUtils::<Runtime, Instance0>::mock_origin(origin),
                referendum_user_id,
                salt,
                vote_option,
            ),
            expected_result,
        );

        if expected_result.is_err() {
            return;
        }

        // check event was emitted
        assert_eq!(
            system::Module::<Runtime>::events().last().unwrap().event,
            TestEvent::event_mod_Instance0(RawEvent::VoteRevealed(account_id, vote_option))
        );
    }
}
