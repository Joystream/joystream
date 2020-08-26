#![cfg(test)]

/////////////////// Configuration //////////////////////////////////////////////
use crate::{
    Balance, CurrentCycle, Error, Instance, Module, RawEvent, ReferendumManager, ReferendumResult,
    ReferendumStage, ReferendumStageRevealing, ReferendumStageVoting, SealedVote, Stage, Trait,
    Votes,
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
    pub const LockId: LockIdentifier = *b"referend";
}

thread_local! {
    pub static IS_LOCKING_ENABLED: RefCell<(bool, bool, bool)> = RefCell::new((true, true, true)); // global switch for stake locking features; use it to simulate lock fails
}

impl Trait<Instance0> for Runtime {
    type Event = TestEvent;

    type MaxReferendumOptions = MaxReferendumOptions;

    type Currency = pallet_balances::Module<Runtime>;
    type LockId = LockId;

    type VotePower = u64;

    type VoteStageDuration = VoteStageDuration;
    type RevealStageDuration = RevealStageDuration;

    type MinimumStake = MinimumStake;

    fn is_super_user(account_id: &<Self as system::Trait>::AccountId) -> bool {
        *account_id == USER_ADMIN
    }

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

    fn can_stake_for_vote(
        account_id: &<Self as system::Trait>::AccountId,
        _stake: &Balance<Self, Instance0>,
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
}

/////////////////// Utility mocks //////////////////////////////////////////////s

pub fn default_genesis_config() -> GenesisConfig<Runtime, Instance0> {
    GenesisConfig::<Runtime, Instance0> {
        stage: ReferendumStage::default(),
        votes: vec![],
        current_cycle: 0,
        previous_cycle_result: ReferendumResult::default(),
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

    // Make sure we are not in block 1 where no events are emitted - see https://substrate.dev/recipes/2-appetizers/4-events.html#emitting-events
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

    pub fn calculate_commitment(
        account_id: &<T as system::Trait>::AccountId,
        vote_option_index: &u64,
    ) -> (T::Hash, Vec<u8>) {
        let cycle_id = CurrentCycle::<I>::get();
        Self::calculate_commitment_for_cycle(account_id, &cycle_id, vote_option_index)
    }

    pub fn calculate_commitment_for_cycle(
        account_id: &<T as system::Trait>::AccountId,
        cycle_id: &u64,
        vote_option_index: &u64,
    ) -> (T::Hash, Vec<u8>) {
        let mut rng = rand::thread_rng();
        let salt = rng.gen::<u64>().to_be_bytes().to_vec();
        (
            <Module<T, I> as ReferendumManager<T, I>>::calculate_commitment(
                account_id,
                &salt,
                cycle_id,
                vote_option_index,
            ),
            salt,
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
        options_count: u64,
        winning_target_count: u64,
        expected_result: Result<(), Error<Runtime, Instance0>>,
    ) -> () {
        // check method returns expected result
        assert_eq!(
            Module::<Runtime, Instance0>::start_referendum(
                InstanceMockUtils::<Runtime, Instance0>::mock_origin(origin),
                options_count,
                winning_target_count,
            ),
            expected_result,
        );

        Self::start_referendum_inner(options_count, winning_target_count, expected_result)
    }

    pub fn start_referendum_manager(
        options: u64,
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
        options_count: u64,
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
                options_count,
            }),
        );

        assert_eq!(
            system::Module::<Runtime>::events().last().unwrap().event,
            TestEvent::from(RawEvent::ReferendumStarted(
                options_count,
                winning_target_count,
            ))
        );
    }

    pub fn check_voting_finished(options_count: u64, winning_target_count: u64) {
        let block_number = system::Module::<Runtime>::block_number();

        assert_eq!(
            Stage::<Runtime, Instance0>::get(),
            ReferendumStage::Revealing(ReferendumStageRevealing {
                start: block_number - 1,
                winning_target_count,
                options_count,
                revealed_votes: (0..options_count).map(|_| 0).collect(),
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
            ReferendumResult<u64, <Runtime as Trait<Instance0>>::VotePower>,
        >,
    ) {
        assert_eq!(
            Stage::<Runtime, Instance0>::get(),
            ReferendumStage::Inactive,
        );

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
        commitment: <Runtime as system::Trait>::Hash,
        balance: Balance<Runtime, Instance0>,
        expected_result: Result<(), Error<Runtime, Instance0>>,
    ) -> () {
        // check method returns expected result
        assert_eq!(
            Module::<Runtime, Instance0>::vote(
                InstanceMockUtils::<Runtime, Instance0>::mock_origin(origin),
                commitment,
                balance,
            ),
            expected_result,
        );

        if expected_result.is_err() {
            return;
        }

        assert_eq!(
            Votes::<Runtime, Instance0>::get(account_id),
            SealedVote {
                commitment,
                cycle_id: CurrentCycle::<Instance0>::get(),
                balance,
                vote_for: None,
            },
        );

        // check event was emitted
        assert_eq!(
            system::Module::<Runtime>::events().last().unwrap().event,
            TestEvent::event_mod_Instance0(RawEvent::VoteCasted(account_id, commitment, balance))
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
