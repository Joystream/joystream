#![cfg(test)]

/////////////////// Configuration //////////////////////////////////////////////
use crate::{
    Balance, CastVote, Error, Instance, Module, OptionResult, RawEvent, ReferendumManager,
    ReferendumStage, ReferendumStageRevealing, ReferendumStageVoting, Stage, Trait, Votes,
};

pub use crate::DefaultInstance;

use frame_support::traits::{Currency, LockIdentifier, OnFinalize};
use frame_support::weights::Weight;
use frame_support::{
    impl_outer_event, impl_outer_origin, parameter_types, StorageMap, StorageValue,
};
use frame_system::{EnsureOneOf, EnsureRoot, EnsureSigned, RawOrigin};
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
    pub static INTERMEDIATE_RESULTS: RefCell<BTreeMap<u64, <Runtime as Trait>::VotePower>> = RefCell::new(BTreeMap::<u64, <Runtime as Trait>::VotePower>::new());
}

impl Trait for Runtime {
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
    type WeightInfo = ();

    fn calculate_vote_power(
        account_id: &<Self as frame_system::Trait>::AccountId,
        stake: &Balance<Self, DefaultInstance>,
    ) -> <Self as Trait<DefaultInstance>>::VotePower {
        let stake: u64 = u64::from(*stake);
        if *account_id == USER_REGULAR_POWER_VOTES {
            return stake * POWER_VOTE_STRENGTH;
        }

        stake
    }

    fn can_unlock_vote_stake(
        _vote: &CastVote<Self::Hash, Balance<Self, Instance0>, Self::MemberId>,
    ) -> bool {
        // trigger fail when requested to do so
        if !IS_UNSTAKE_ENABLED.with(|value| value.borrow().0) {
            return false;
        }

        true
    }

    fn process_results(_winners: &[OptionResult<Self::MemberId, Self::VotePower>]) {
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

impl common::Trait for Runtime {
    type MemberId = u64;
    type ActorId = u64;
}

parameter_types! {
    pub const ExistentialDeposit: u64 = 0;
    pub const MaxLocks: u32 = 50;
}

impl pallet_balances::Trait for Runtime {
    type Balance = u64;
    type Event = TestEvent;
    type DustRemoval = ();
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = frame_system::Module<Self>;
    type WeightInfo = ();
    type MaxLocks = MaxLocks;
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
    pub use super::DefaultInstance;
    pub use crate::Event;
}

mod tmp {
    pub use pallet_balances::Event;
}

impl_outer_event! {
    pub enum TestEvent for Runtime {
        event_mod DefaultInstance <T>,
        frame_system<T>,
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

impl frame_system::Trait for Runtime {
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
    type PalletInfo = ();
    type AccountData = pallet_balances::AccountData<u64>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type SystemWeightInfo = ();
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

pub fn default_genesis_config() -> GenesisConfig<Runtime, DefaultInstance> {
    GenesisConfig::<Runtime, DefaultInstance> {
        stage: ReferendumStage::default(),
        votes: vec![],
    }
}

pub fn build_test_externalities(
    config: GenesisConfig<Runtime, DefaultInstance>,
) -> sp_io::TestExternalities {
    let mut t = frame_system::GenesisConfig::default()
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

        InstanceMockUtils::<Runtime, DefaultInstance>::increase_block_number(1)
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
        let block_number = frame_system::Module::<T>::block_number();

        for i in 0..increase {
            let tmp_index: T::BlockNumber = block_number + i.into();

            <Module<T, I> as OnFinalize<T::BlockNumber>>::on_finalize(tmp_index);
            frame_system::Module::<T>::set_block_number(tmp_index + 1.into());
        }
    }

    pub fn calculate_commitment(
        account_id: &<T as frame_system::Trait>::AccountId,
        vote_option_index: &<T as common::Trait>::MemberId,
        cycle_id: &u64,
    ) -> (T::Hash, Vec<u8>) {
        Self::calculate_commitment_for_cycle(account_id, &cycle_id, vote_option_index, None)
    }

    pub fn calculate_commitment_custom_salt(
        account_id: &<T as frame_system::Trait>::AccountId,
        vote_option_index: &<T as common::Trait>::MemberId,
        custom_salt: &[u8],
        cycle_id: &u64,
    ) -> (T::Hash, Vec<u8>) {
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
        account_id: &<T as frame_system::Trait>::AccountId,
        cycle_id: &u64,
        vote_option_index: &<T as common::Trait>::MemberId,
        custom_salt: Option<&[u8]>,
    ) -> (T::Hash, Vec<u8>) {
        let salt = match custom_salt {
            Some(tmp_salt) => tmp_salt.to_vec(),
            None => Self::generate_salt(),
        };

        (
            <Module<T, I> as ReferendumManager<
                <T as frame_system::Trait>::Origin,
                <T as frame_system::Trait>::AccountId,
                <T as common::Trait>::MemberId,
                <T as frame_system::Trait>::Hash,
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

impl InstanceMocks<Runtime, DefaultInstance> {
    pub fn start_referendum_extrinsic(
        origin: OriginType<<Runtime as frame_system::Trait>::AccountId>,
        winning_target_count: u64,
        cycle_id: u64,
        expected_result: Result<(), ()>,
    ) -> () {
        let extra_winning_target_count = winning_target_count - 1;

        // check method returns expected result
        assert_eq!(
            Module::<Runtime>::start_referendum(
                InstanceMockUtils::<Runtime, DefaultInstance>::mock_origin(origin),
                extra_winning_target_count,
                cycle_id,
            ),
            expected_result,
        );

        Self::start_referendum_inner(extra_winning_target_count, cycle_id, expected_result)
    }

    pub fn start_referendum_manager(
        winning_target_count: u64,
        cycle_id: u64,
        expected_result: Result<(), ()>,
    ) -> () {
        let extra_winning_target_count = winning_target_count - 1;

        // check method returns expected result
        assert_eq!(
            <Module::<Runtime> as ReferendumManager<
                <Runtime as frame_system::Trait>::Origin,
                <Runtime as frame_system::Trait>::AccountId,
                <Runtime as common::Trait>::MemberId,
                <Runtime as frame_system::Trait>::Hash,
            >>::start_referendum(
                InstanceMockUtils::<Runtime, DefaultInstance>::mock_origin(OriginType::Root),
                extra_winning_target_count,
                cycle_id,
            )
            .is_ok(),
            expected_result.is_ok(),
        );

        Self::start_referendum_inner(extra_winning_target_count, cycle_id, expected_result)
    }

    fn start_referendum_inner(
        extra_winning_target_count: u64,
        cycle_id: u64,
        expected_result: Result<(), ()>,
    ) {
        if expected_result.is_err() {
            return;
        }

        let winning_target_count = extra_winning_target_count + 1;
        let block_number = frame_system::Module::<Runtime>::block_number();

        assert_eq!(
            Stage::<Runtime, DefaultInstance>::get(),
            ReferendumStage::Voting(ReferendumStageVoting {
                started: block_number + 1, // actual voting starts in the next block (thats why +1)
                winning_target_count,
                current_cycle_id: cycle_id,
            }),
        );

        InstanceMockUtils::<Runtime, DefaultInstance>::increase_block_number(1);

        assert_eq!(
            frame_system::Module::<Runtime>::events()
                .last()
                .unwrap()
                .event,
            TestEvent::from(RawEvent::ReferendumStarted(winning_target_count))
        );
    }

    pub fn check_voting_finished(winning_target_count: u64, cycle_id: u64) {
        let block_number = frame_system::Module::<Runtime>::block_number();

        assert_eq!(
            Stage::<Runtime, DefaultInstance>::get(),
            ReferendumStage::Revealing(ReferendumStageRevealing {
                started: block_number,
                winning_target_count,
                intermediate_winners: vec![],
                current_cycle_id: cycle_id,
            }),
        );

        // check event was emitted
        assert_eq!(
            frame_system::Module::<Runtime>::events()
                .last()
                .unwrap()
                .event,
            TestEvent::event_mod_DefaultInstance(RawEvent::RevealingStageStarted())
        );
    }

    pub fn check_revealing_finished(
        expected_winners: Vec<
            OptionResult<
                <Runtime as common::Trait>::MemberId,
                <Runtime as Trait<Instance0>>::VotePower,
            >,
        >,
        expected_referendum_result: BTreeMap<u64, <Runtime as Trait<Instance0>>::VotePower>,
    ) {
        assert_eq!(
            Stage::<Runtime, DefaultInstance>::get(),
            ReferendumStage::Inactive,
        );

        // check event was emitted
        assert_eq!(
            frame_system::Module::<Runtime>::events()
                .last()
                .unwrap()
                .event,
            TestEvent::event_mod_DefaultInstance(RawEvent::ReferendumFinished(expected_winners,))
        );

        INTERMEDIATE_RESULTS.with(|value| assert_eq!(*value.borrow(), expected_referendum_result,));
    }

    pub fn vote(
        origin: OriginType<<Runtime as frame_system::Trait>::AccountId>,
        account_id: <Runtime as frame_system::Trait>::AccountId,
        commitment: <Runtime as frame_system::Trait>::Hash,
        stake: Balance<Runtime, Instance0>,
        cycle_id: u64,
        expected_result: Result<(), Error<Runtime, Instance0>>,
    ) -> () {
        // check method returns expected result
        assert_eq!(
            Module::<Runtime>::vote(
                InstanceMockUtils::<Runtime, DefaultInstance>::mock_origin(origin),
                commitment,
                stake,
            ),
            expected_result,
        );

        if expected_result.is_err() {
            return;
        }

        assert_eq!(
            Votes::<Runtime, DefaultInstance>::get(account_id),
            CastVote {
                commitment,
                cycle_id: cycle_id.clone(),
                stake,
                vote_for: None,
            },
        );

        // check event was emitted
        assert_eq!(
            frame_system::Module::<Runtime>::events()
                .last()
                .unwrap()
                .event,
            TestEvent::event_mod_DefaultInstance(RawEvent::VoteCast(account_id, commitment, stake))
        );
    }

    pub fn reveal_vote(
        origin: OriginType<<Runtime as frame_system::Trait>::AccountId>,
        account_id: <Runtime as frame_system::Trait>::AccountId,
        salt: Vec<u8>,
        vote_option_index: u64,
        expected_result: Result<(), Error<Runtime, DefaultInstance>>,
    ) -> () {
        // check method returns expected result
        assert_eq!(
            Module::<Runtime>::reveal_vote(
                InstanceMockUtils::<Runtime, DefaultInstance>::mock_origin(origin),
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
            frame_system::Module::<Runtime>::events()
                .last()
                .unwrap()
                .event,
            TestEvent::event_mod_DefaultInstance(RawEvent::VoteRevealed(
                account_id,
                vote_option_index
            ))
        );
    }

    pub fn release_stake(
        origin: OriginType<<Runtime as frame_system::Trait>::AccountId>,
        account_id: <Runtime as frame_system::Trait>::AccountId,
        expected_result: Result<(), Error<Runtime, DefaultInstance>>,
    ) -> () {
        // check method returns expected result
        assert_eq!(
            Module::<Runtime>::release_vote_stake(
                InstanceMockUtils::<Runtime, DefaultInstance>::mock_origin(origin),
            ),
            expected_result,
        );

        if expected_result.is_err() {
            return;
        }

        // check event was emitted
        assert_eq!(
            frame_system::Module::<Runtime>::events()
                .last()
                .unwrap()
                .event,
            TestEvent::event_mod_DefaultInstance(RawEvent::StakeReleased(account_id))
        );
    }
}
