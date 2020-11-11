#![cfg(test)]

/////////////////// Configuration //////////////////////////////////////////////
use crate::{
    Balance, CastVote, CurrentCycleId, Error, Instance, Module, OptionResult, RawEvent,
    ReferendumManager, ReferendumStage, ReferendumStageRevealing, ReferendumStageVoting, Stage,
    Trait, Votes,
};

use frame_support::traits::{Currency, LockIdentifier, OnFinalize};
use frame_support::{
    impl_outer_event, impl_outer_origin, parameter_types, StorageMap, StorageValue,
};
use pallet_balances;
use rand::Rng;
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};
use std::cell::RefCell;
use std::collections::BTreeMap;
use std::iter::FromIterator;
use std::marker::PhantomData;
use system::{EnsureOneOf, EnsureRoot, EnsureSigned, RawOrigin};

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
    pub const MaxSaltLength: u64 = 32; // use some multiple of 8 for ez testing
    pub const VoteStageDuration: u64 = 5;
    pub const RevealStageDuration: u64 = 7;
    pub const MinimumStake: u64 = 10000;
    pub const LockId: LockIdentifier = *b"referend";
}

thread_local! {
    pub static IS_UNSTAKE_ENABLED: RefCell<(bool, )> = RefCell::new((true, )); // global switch for stake locking features; use it to simulate lock fails
    pub static IS_OPTION_ID_VALID: RefCell<(bool, )> = RefCell::new((true, )); // global switch used to test is_valid_option_id()

    // complete intermediate results
    pub static INTERMEDIATE_RESULTS: RefCell<BTreeMap<u64, <Runtime as Trait<Instance0>>::VotePower>> = RefCell::new(BTreeMap::<u64, <Runtime as Trait<Instance0>>::VotePower>::new());
}

impl Trait<Instance0> for Runtime {
    type Event = TestEvent;

    type MaxSaltLength = MaxSaltLength;

    type Currency = pallet_balances::Module<Runtime>;
    type LockId = LockId;

    type ManagerOrigin =
        EnsureOneOf<Self::AccountId, EnsureSigned<Self::AccountId>, EnsureRoot<Self::AccountId>>;

    type VotePower = u64;

    type VoteStageDuration = VoteStageDuration;
    type RevealStageDuration = RevealStageDuration;

    type MinimumStake = MinimumStake;

    fn caclulate_vote_power(
        account_id: &<Self as system::Trait>::AccountId,
        stake: &Balance<Self, Instance0>,
    ) -> <Self as Trait<Instance0>>::VotePower {
        let stake: u64 = u64::from(*stake);
        if *account_id == USER_REGULAR_POWER_VOTES {
            return stake * POWER_VOTE_STRENGTH;
        }

        stake
    }

    fn can_release_voting_stake(_vote: &CastVote<Self::Hash, Balance<Self, Instance0>>) -> bool {
        // trigger fail when requested to do so
        if !IS_UNSTAKE_ENABLED.with(|value| value.borrow().0) {
            return false;
        }

        true
    }

    fn process_results(_winners: &[OptionResult<Self::VotePower>]) {
        // not used right now
    }

    fn is_valid_option_id(_option_index: &u64) -> bool {
        if !IS_OPTION_ID_VALID.with(|value| value.borrow().0) {
            return false;
        }

        true
    }

    fn get_option_power(option_id: &u64) -> Self::VotePower {
        INTERMEDIATE_RESULTS.with(|value| match value.borrow().get(option_id) {
            Some(vote_power) => *vote_power,
            None => 0,
        })
    }

    fn increase_option_power(option_id: &u64, amount: &Self::VotePower) {
        INTERMEDIATE_RESULTS.with(|value| {
            let current = Self::get_option_power(option_id);

            value.borrow_mut().insert(*option_id, amount + current);
        });
    }
}

parameter_types! {
    pub const ExistentialDeposit: u64 = 0;
}

impl pallet_balances::Trait for Runtime {
    type Balance = u64;
    type Event = TestEvent;
    type DustRemoval = ();
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = system::Module<Self>;
}

impl Runtime {
    pub fn feature_stack_lock(unstake_enabled: bool) -> () {
        IS_UNSTAKE_ENABLED.with(|value| {
            *value.borrow_mut() = (unstake_enabled,);
        });
    }

    pub fn feature_option_id_valid(is_valid: bool) -> () {
        IS_OPTION_ID_VALID.with(|value| {
            *value.borrow_mut() = (is_valid,);
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

mod tmp {
    pub use pallet_balances::Event;
}

impl_outer_event! {
    pub enum TestEvent for Runtime {
        event_mod Instance0 <T>,
        system<T>,
        tmp<T>,
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
    type AccountData = pallet_balances::AccountData<u64>;
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
    None,
}

/////////////////// Utility mocks //////////////////////////////////////////////s

pub fn default_genesis_config() -> GenesisConfig<Runtime, Instance0> {
    GenesisConfig::<Runtime, Instance0> {
        stage: ReferendumStage::default(),
        votes: vec![],
        current_cycle_id: 0,
    }
}

pub fn build_test_externalities(
    config: GenesisConfig<Runtime, Instance0>,
) -> sp_io::TestExternalities {
    let mut t = system::GenesisConfig::default()
        .build_storage::<Runtime>()
        .unwrap();

    config.assimilate_storage(&mut t).unwrap();

    let mut result = Into::<sp_io::TestExternalities>::into(t.clone());

    // Make sure we are not in block 0 where no events are emitted - see https://substrate.dev/recipes/2-appetizers/4-events.html#emitting-events
    result.execute_with(|| {
        // topup significant accounts
        let amount = 40000; // some high enough number to pass all test checks
        topup_account(USER_ADMIN, amount);
        topup_account(USER_REGULAR, amount);
        topup_account(USER_REGULAR_2, amount);
        topup_account(USER_REGULAR_3, amount);
        topup_account(USER_REGULAR_POWER_VOTES, amount);

        InstanceMockUtils::<Runtime, Instance0>::increase_block_number(1)
    });

    result
}

// topup currency to the account
fn topup_account(account_id: u64, amount: u64) {
    let account_id = account_id;
    let _ = pallet_balances::Module::<Runtime>::deposit_creating(&account_id, amount);
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
            OriginType::Root => RawOrigin::Root.into(),
            OriginType::None => RawOrigin::None.into(),
            //_ => panic!("not implemented"),
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

    pub fn calculate_commitment(
        account_id: &<T as system::Trait>::AccountId,
        vote_option_index: &u64,
    ) -> (T::Hash, Vec<u8>) {
        let cycle_id = CurrentCycleId::<I>::get();
        Self::calculate_commitment_for_cycle(account_id, &cycle_id, vote_option_index, None)
    }

    pub fn calculate_commitment_custom_salt(
        account_id: &<T as system::Trait>::AccountId,
        vote_option_index: &u64,
        custom_salt: &[u8],
    ) -> (T::Hash, Vec<u8>) {
        let cycle_id = CurrentCycleId::<I>::get();
        Self::calculate_commitment_for_cycle(
            account_id,
            &cycle_id,
            vote_option_index,
            Some(custom_salt),
        )
    }

    pub fn generate_salt() -> Vec<u8> {
        let mut rng = rand::thread_rng();

        rng.gen::<u64>().to_be_bytes().to_vec()
    }

    pub fn calculate_commitment_for_cycle(
        account_id: &<T as system::Trait>::AccountId,
        cycle_id: &u64,
        vote_option_index: &u64,
        custom_salt: Option<&[u8]>,
    ) -> (T::Hash, Vec<u8>) {
        let salt = match custom_salt {
            Some(tmp_salt) => tmp_salt.to_vec(),
            None => Self::generate_salt(),
        };

        (
            <Module<T, I> as ReferendumManager<
                <T as system::Trait>::Origin,
                <T as system::Trait>::AccountId,
                <T as system::Trait>::Hash,
            >>::calculate_commitment(account_id, &salt, cycle_id, vote_option_index),
            salt.to_vec(),
        )
    }

    pub fn transform_results(input: Vec<T::VotePower>) -> BTreeMap<u64, T::VotePower> {
        BTreeMap::from_iter(
            input
                .into_iter()
                .enumerate()
                .map(|(k, v)| (k as u64, v))
                .filter(|(_, v)| v != &Into::<T::VotePower>::into(0))
                .collect::<Vec<(u64, T::VotePower)>>(),
        )
    }
}

/////////////////// Mocks of Module's actions //////////////////////////////////

pub struct InstanceMocks<T: Trait<I>, I: Instance> {
    _dummy: PhantomData<(T, I)>, // 0-sized data meant only to bound generic parameters
}

impl InstanceMocks<Runtime, Instance0> {
    pub fn start_referendum_extrinsic(
        origin: OriginType<<Runtime as system::Trait>::AccountId>,
        winning_target_count: u64,
        expected_result: Result<(), ()>,
    ) -> () {
        let extra_winning_target_count = winning_target_count - 1;

        // check method returns expected result
        assert_eq!(
            Module::<Runtime, Instance0>::start_referendum(
                InstanceMockUtils::<Runtime, Instance0>::mock_origin(origin),
                extra_winning_target_count,
            ),
            expected_result,
        );

        Self::start_referendum_inner(extra_winning_target_count, expected_result)
    }

    pub fn start_referendum_manager(
        winning_target_count: u64,
        expected_result: Result<(), ()>,
    ) -> () {
        let extra_winning_target_count = winning_target_count - 1;

        // check method returns expected result
        assert_eq!(
            <Module::<Runtime, Instance0> as ReferendumManager<
                <Runtime as system::Trait>::Origin,
                <Runtime as system::Trait>::AccountId,
                <Runtime as system::Trait>::Hash,
            >>::start_referendum(
                InstanceMockUtils::<Runtime, Instance0>::mock_origin(OriginType::Root),
                extra_winning_target_count,
            )
            .is_ok(),
            expected_result.is_ok(),
        );

        Self::start_referendum_inner(extra_winning_target_count, expected_result)
    }

    fn start_referendum_inner(extra_winning_target_count: u64, expected_result: Result<(), ()>) {
        if expected_result.is_err() {
            return;
        }

        let winning_target_count = extra_winning_target_count + 1;
        let block_number = system::Module::<Runtime>::block_number();

        assert_eq!(
            Stage::<Runtime, Instance0>::get(),
            ReferendumStage::Voting(ReferendumStageVoting {
                started: block_number + 1, // actual voting starts in the next block (thats why +1)
                winning_target_count,
            }),
        );

        InstanceMockUtils::<Runtime, Instance0>::increase_block_number(1);

        assert_eq!(
            system::Module::<Runtime>::events().last().unwrap().event,
            TestEvent::from(RawEvent::ReferendumStarted(winning_target_count))
        );
    }

    pub fn check_voting_finished(winning_target_count: u64) {
        let block_number = system::Module::<Runtime>::block_number();

        assert_eq!(
            Stage::<Runtime, Instance0>::get(),
            ReferendumStage::Revealing(ReferendumStageRevealing {
                started: block_number,
                winning_target_count,
                intermediate_winners: vec![],
            }),
        );

        // check event was emitted
        assert_eq!(
            system::Module::<Runtime>::events().last().unwrap().event,
            TestEvent::event_mod_Instance0(RawEvent::RevealingStageStarted())
        );
    }

    pub fn check_revealing_finished(
        expected_winners: Vec<OptionResult<<Runtime as Trait<Instance0>>::VotePower>>,
        expected_referendum_result: BTreeMap<u64, <Runtime as Trait<Instance0>>::VotePower>,
    ) {
        assert_eq!(
            Stage::<Runtime, Instance0>::get(),
            ReferendumStage::Inactive,
        );

        // check event was emitted
        assert_eq!(
            system::Module::<Runtime>::events().last().unwrap().event,
            TestEvent::event_mod_Instance0(RawEvent::ReferendumFinished(expected_winners,))
        );

        INTERMEDIATE_RESULTS.with(|value| assert_eq!(*value.borrow(), expected_referendum_result,));
    }

    pub fn vote(
        origin: OriginType<<Runtime as system::Trait>::AccountId>,
        account_id: <Runtime as system::Trait>::AccountId,
        commitment: <Runtime as system::Trait>::Hash,
        stake: Balance<Runtime, Instance0>,
        expected_result: Result<(), Error<Runtime, Instance0>>,
    ) -> () {
        // check method returns expected result
        assert_eq!(
            Module::<Runtime, Instance0>::vote(
                InstanceMockUtils::<Runtime, Instance0>::mock_origin(origin),
                account_id,
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
            CastVote {
                commitment,
                cycle_id: CurrentCycleId::<Instance0>::get(),
                stake,
                vote_for: None,
            },
        );

        // check event was emitted
        assert_eq!(
            system::Module::<Runtime>::events().last().unwrap().event,
            TestEvent::event_mod_Instance0(RawEvent::VoteCast(
                account_id, account_id, commitment, stake
            ))
        );
    }

    pub fn reveal_vote(
        origin: OriginType<<Runtime as system::Trait>::AccountId>,
        account_id: <Runtime as system::Trait>::AccountId,
        salt: Vec<u8>,
        vote_option_index: u64,
        expected_result: Result<(), Error<Runtime, Instance0>>,
    ) -> () {
        // check method returns expected result
        assert_eq!(
            Module::<Runtime, Instance0>::reveal_vote(
                InstanceMockUtils::<Runtime, Instance0>::mock_origin(origin),
                salt,
                vote_option_index,
            ),
            expected_result,
        );

        if expected_result.is_err() {
            return;
        }

        // check event was emitted
        assert_eq!(
            system::Module::<Runtime>::events().last().unwrap().event,
            TestEvent::event_mod_Instance0(RawEvent::VoteRevealed(account_id, vote_option_index))
        );
    }

    pub fn release_stake(
        origin: OriginType<<Runtime as system::Trait>::AccountId>,
        account_id: <Runtime as system::Trait>::AccountId,
        expected_result: Result<(), Error<Runtime, Instance0>>,
    ) -> () {
        // check method returns expected result
        assert_eq!(
            Module::<Runtime, Instance0>::release_stake(
                InstanceMockUtils::<Runtime, Instance0>::mock_origin(origin),
            ),
            expected_result,
        );

        if expected_result.is_err() {
            return;
        }

        // check event was emitted
        assert_eq!(
            system::Module::<Runtime>::events().last().unwrap().event,
            TestEvent::event_mod_Instance0(RawEvent::StakeReleased(account_id))
        );
    }
}
