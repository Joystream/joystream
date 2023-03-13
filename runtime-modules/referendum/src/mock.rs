#![cfg(test)]

/////////////////// Configuration //////////////////////////////////////////////
use crate::{
    AccountsOptedOut, BalanceOf, CastVote, Config, Error, Instance, Module, OptionResult, RawEvent,
    ReferendumManager, ReferendumStage, ReferendumStageRevealing, ReferendumStageVoting, Stage,
    Votes,
};

pub use crate::DefaultInstance;

use frame_support::dispatch::DispatchResult;
use frame_support::traits::{
    ConstU16, ConstU32, Currency, LockIdentifier, OnFinalize, OnInitialize,
};
use frame_support::{
    parameter_types, storage::weak_bounded_vec::WeakBoundedVec, traits::EnsureOneOf, StorageMap,
    StorageValue,
};
use frame_system::{ensure_signed, EnsureRoot, EnsureSigned, RawOrigin};
use rand::Rng;
use sp_core::H256;
use sp_runtime::traits::One;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
};
use sp_std::convert::{TryFrom, TryInto};
use std::cell::RefCell;
use std::collections::BTreeMap;
use std::iter::FromIterator;
use std::marker::PhantomData;

use staking_handler::LockComparator;

use crate as referendum;

pub const USER_ADMIN: u64 = 1;
pub const USER_REGULAR: u64 = 2;
pub const USER_REGULAR_POWER_VOTES: u64 = 3;
pub const USER_REGULAR_2: u64 = 4;
pub const USER_REGULAR_3: u64 = 5;
pub const USER_REGULAR_4: u64 = 6;
pub const USER_REGULAR_5: u64 = 7;

pub const POWER_VOTE_STRENGTH: u64 = 10;

parameter_types! {
    pub const MaxSaltLength: u64 = 32; // use some multiple of 8 for ez testing
    pub const VoteStageDuration: u64 = 5;
    pub const RevealStageDuration: u64 = 7;
    pub const MinimumStake: u64 = 10000;
    pub const LockId: LockIdentifier = *b"referend";
    pub const MaxWinnerTargetCount: u32 = 10;
}

thread_local! {
    pub static IS_UNSTAKE_ENABLED: RefCell<(bool, )> = RefCell::new((true, )); // global switch for stake locking features; use it to simulate lock fails
    pub static IS_OPTION_ID_VALID: RefCell<(bool, )> = RefCell::new((true, )); // global switch used to test is_valid_option_id()

    // complete intermediate results
    pub static INTERMEDIATE_RESULTS: RefCell<BTreeMap<u64, <Runtime as Config>::VotePower>> = RefCell::new(BTreeMap::<u64, <Runtime as Config>::VotePower>::new());
}

impl LockComparator<u64> for Runtime {
    fn are_locks_conflicting(
        _new_lock: &LockIdentifier,
        _existing_locks: &[LockIdentifier],
    ) -> bool {
        false
    }
}

impl Config for Runtime {
    type Event = Event;

    type MaxSaltLength = MaxSaltLength;

    type StakingHandler = staking_handler::StakingManager<Self, LockId>;
    type ManagerOrigin = EnsureOneOf<EnsureSigned<Self::AccountId>, EnsureRoot<Self::AccountId>>;

    type VotePower = u64;

    type VoteStageDuration = VoteStageDuration;
    type RevealStageDuration = RevealStageDuration;

    type MinimumStake = MinimumStake;
    type WeightInfo = ();

    type MaxWinnerTargetCount = MaxWinnerTargetCount;

    fn calculate_vote_power(
        account_id: &<Self as frame_system::Config>::AccountId,
        stake: &BalanceOf<Self>,
    ) -> <Self as Config<DefaultInstance>>::VotePower {
        let stake: u64 = *stake;
        if *account_id == USER_REGULAR_POWER_VOTES {
            return stake * POWER_VOTE_STRENGTH;
        }

        stake
    }

    fn can_unlock_vote_stake(
        _vote: &CastVote<Self::Hash, BalanceOf<Self>, Self::MemberId>,
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

parameter_types! {
    pub const DefaultMembershipPrice: u64 = 100;
    pub const DefaultInitialInvitationBalance: u64 = 100;
    pub const DefaultMemberInvitesCount: u32 = 2;
    pub const InvitedMemberLockId: [u8; 8] = [2; 8];
    pub const ReferralCutMaximumPercent: u8 = 50;
    pub const StakingCandidateLockId: [u8; 8] = [3; 8];
    pub const CandidateStake: u64 = 100;
}

impl membership::Config for Runtime {
    type Event = Event;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type WorkingGroup = Wg;
    type WeightInfo = ();
    type DefaultInitialInvitationBalance = DefaultInitialInvitationBalance;
    type InvitedMemberStakingHandler = staking_handler::StakingManager<Self, InvitedMemberLockId>;
    type ReferralCutMaximumPercent = ReferralCutMaximumPercent;
    type StakingCandidateStakingHandler =
        staking_handler::StakingManager<Self, StakingCandidateLockId>;
    type CandidateStake = CandidateStake;
    type DefaultMemberInvitesCount = DefaultMemberInvitesCount;
}

impl pallet_timestamp::Config for Runtime {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

pub struct Wg;
impl common::working_group::WorkingGroupBudgetHandler<u64, u64> for Wg {
    fn get_budget() -> u64 {
        unimplemented!()
    }

    fn set_budget(_new_value: u64) {
        unimplemented!()
    }

    fn try_withdraw(_account_id: &u64, _amount: u64) -> DispatchResult {
        unimplemented!()
    }
}

impl common::working_group::WorkingGroupAuthenticator<Runtime> for Wg {
    fn ensure_worker_origin(
        _origin: <Runtime as frame_system::Config>::Origin,
        _worker_id: &<Runtime as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        unimplemented!()
    }

    fn ensure_leader_origin(_origin: <Runtime as frame_system::Config>::Origin) -> DispatchResult {
        unimplemented!()
    }

    fn get_leader_member_id() -> Option<<Runtime as common::membership::MembershipTypes>::MemberId>
    {
        unimplemented!()
    }

    fn get_worker_member_id(
        _: &<Runtime as common::membership::MembershipTypes>::ActorId,
    ) -> Option<<Runtime as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn is_leader_account_id(_account_id: &<Runtime as frame_system::Config>::AccountId) -> bool {
        true
    }

    fn is_worker_account_id(
        _account_id: &<Runtime as frame_system::Config>::AccountId,
        _worker_id: &<Runtime as common::membership::MembershipTypes>::ActorId,
    ) -> bool {
        true
    }

    fn worker_exists(
        _worker_id: &<Runtime as common::membership::MembershipTypes>::ActorId,
    ) -> bool {
        unimplemented!();
    }

    fn ensure_worker_exists(
        _worker_id: &<Runtime as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        unimplemented!();
    }
}

impl common::membership::MembershipTypes for Runtime {
    type MemberId = u64;
    type ActorId = u64;
}

parameter_types! {
    pub const ExistentialDeposit: u64 = 10;
    pub const MaxLocks: u32 = 50;
}

impl balances::Config for Runtime {
    type Balance = u64;
    type DustRemoval = ();
    type Event = Event;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type MaxLocks = ();
    type MaxReserves = ConstU32<2>;
    type ReserveIdentifier = [u8; 8];
    type WeightInfo = ();
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

type UncheckedExtrinsic = frame_system::mocking::MockUncheckedExtrinsic<Runtime>;
type Block = frame_system::mocking::MockBlock<Runtime>;

frame_support::construct_runtime!(
    pub enum Runtime where
        Block = Block,
        NodeBlock = Block,
        UncheckedExtrinsic = UncheckedExtrinsic,
    {
        System: frame_system::{Pallet, Call, Storage, Event<T>},
        Balances: balances::{Pallet, Call, Storage, Config<T>, Event<T>},
        Membership: membership::{Pallet, Call, Storage, Event<T>},
        Timestamp: pallet_timestamp::{Pallet, Call, Storage, Inherent},
        Referendum: referendum::{Pallet, Call, Storage, Event<T>},
    }
);

parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MinimumPeriod: u64 = 5;
}

impl frame_system::Config for Runtime {
    type BaseCallFilter = frame_support::traits::Everything;
    type BlockWeights = ();
    type BlockLength = ();
    type DbWeight = ();
    type Origin = Origin;
    type Call = Call;
    type Index = u64;
    type BlockNumber = u64;
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u64;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type Event = Event;
    type BlockHashCount = BlockHashCount; // ConstU64<250>;
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

/////////////////// Data structures ////////////////////////////////////////////

#[allow(dead_code)]
#[derive(Clone)]
pub enum OriginType<AccountId> {
    Signed(AccountId),
    //Inherent, <== did not find how to make such an origin yet
    Root,
    None,
}

/////////////////// Utility mocks //////////////////////////////////////////////

pub fn build_test_externalities() -> sp_io::TestExternalities {
    let t = frame_system::GenesisConfig::default()
        .build_storage::<Runtime>()
        .unwrap();

    let mut result = Into::<sp_io::TestExternalities>::into(t.clone());

    // Make sure we are not in block 0 where no events are emitted - see https://substrate.dev/recipes/2-appetizers/4-events.html#emitting-events
    result.execute_with(|| {
        // topup significant accounts
        let amount = 40000; // some high enough number to pass all test checks
        topup_account(USER_ADMIN, amount);
        topup_account(USER_REGULAR, amount);
        topup_account(USER_REGULAR_2, amount);
        topup_account(USER_REGULAR_3, amount);
        topup_account(USER_REGULAR_4, amount);
        topup_account(USER_REGULAR_5, amount);
        topup_account(USER_REGULAR_POWER_VOTES, amount);

        InstanceMockUtils::<Runtime, DefaultInstance>::increase_block_number(1)
    });

    result
}

// topup currency to the account
fn topup_account(account_id: u64, amount: u64) {
    let account_id = account_id;
    let _ = balances::Pallet::<Runtime>::deposit_creating(&account_id, amount);
}

pub struct InstanceMockUtils<T: Config<I>, I: Instance> {
    _dummy: PhantomData<(T, I)>, // 0-sized data meant only to bound generic parameters
}

impl<T: Config<I>, I: Instance> InstanceMockUtils<T, I>
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
        build_test_externalities().execute_with(|| {
            let origin = OriginType::Signed(origin_account_id);

            f(origin)
        });
    }

    pub fn increase_block_number(increase: u64) -> () {
        let mut block_number = frame_system::Pallet::<T>::block_number();

        for _ in 0..increase {
            <frame_system::Pallet<T> as OnFinalize<T::BlockNumber>>::on_finalize(block_number);
            <Module<T, I> as OnFinalize<T::BlockNumber>>::on_finalize(block_number);
            block_number += One::one();
            frame_system::Pallet::<T>::set_block_number(block_number);
            <frame_system::Pallet<T> as OnInitialize<T::BlockNumber>>::on_initialize(block_number);
            <Module<T, I> as OnInitialize<T::BlockNumber>>::on_initialize(block_number);
        }
    }

    pub fn move_to_block(block_number: T::BlockNumber) {
        let mut current_block = frame_system::Pallet::<T>::block_number();
        while current_block < block_number {
            Self::increase_block_number(1);
            current_block = frame_system::Pallet::<T>::block_number();
        }
    }

    pub fn calculate_commitment(
        account_id: &<T as frame_system::Config>::AccountId,
        vote_option_index: &<T as common::membership::MembershipTypes>::MemberId,
        cycle_id: &u64,
    ) -> (T::Hash, Vec<u8>) {
        Self::calculate_commitment_for_cycle(account_id, cycle_id, vote_option_index, None)
    }

    pub fn calculate_commitment_custom_salt(
        account_id: &<T as frame_system::Config>::AccountId,
        vote_option_index: &<T as common::membership::MembershipTypes>::MemberId,
        custom_salt: &[u8],
        cycle_id: &u64,
    ) -> (T::Hash, Vec<u8>) {
        Self::calculate_commitment_for_cycle(
            account_id,
            cycle_id,
            vote_option_index,
            Some(custom_salt),
        )
    }

    pub fn generate_salt() -> Vec<u8> {
        let mut rng = rand::thread_rng();

        rng.gen::<u64>().to_be_bytes().to_vec()
    }

    pub fn calculate_commitment_for_cycle(
        account_id: &<T as frame_system::Config>::AccountId,
        cycle_id: &u64,
        vote_option_index: &<T as common::membership::MembershipTypes>::MemberId,
        custom_salt: Option<&[u8]>,
    ) -> (T::Hash, Vec<u8>) {
        let salt = match custom_salt {
            Some(tmp_salt) => tmp_salt.to_vec(),
            None => Self::generate_salt(),
        };

        (
            <Module<T, I> as ReferendumManager<
                <T as frame_system::Config>::Origin,
                <T as frame_system::Config>::AccountId,
                <T as common::membership::MembershipTypes>::MemberId,
                <T as frame_system::Config>::Hash,
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

pub struct InstanceMocks<T: Config<I>, I: Instance> {
    _dummy: PhantomData<(T, I)>, // 0-sized data meant only to bound generic parameters
}

impl InstanceMocks<Runtime, DefaultInstance> {
    pub fn start_referendum_extrinsic(
        origin: OriginType<<Runtime as frame_system::Config>::AccountId>,
        winning_target_count: u32,
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

    // checks that winning_target_count equals expected
    // fails if used outisde of voting stage
    pub fn check_winning_target_count(winning_target_count: u32) {
        if let ReferendumStage::Voting(stage_data) = Stage::<Runtime, DefaultInstance>::get() {
            assert_eq!(stage_data.winning_target_count, winning_target_count);
        } else {
            assert!(false);
        }
    }

    pub fn start_referendum_manager(
        winning_target_count: u32,
        cycle_id: u64,
        expected_result: Result<(), ()>,
    ) -> () {
        let extra_winning_target_count = winning_target_count - 1;

        // check method returns expected result
        assert_eq!(
            <Module::<Runtime> as ReferendumManager<
                <Runtime as frame_system::Config>::Origin,
                <Runtime as frame_system::Config>::AccountId,
                <Runtime as common::membership::MembershipTypes>::MemberId,
                <Runtime as frame_system::Config>::Hash,
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

    pub fn force_start(winning_target_count: u32, cycle_id: u64) -> () {
        let extra_winning_target_count = winning_target_count - 1;

        <Module<Runtime> as ReferendumManager<
            <Runtime as frame_system::Config>::Origin,
            <Runtime as frame_system::Config>::AccountId,
            <Runtime as common::membership::MembershipTypes>::MemberId,
            <Runtime as frame_system::Config>::Hash,
        >>::force_start(extra_winning_target_count, cycle_id);
    }

    fn start_referendum_inner(
        extra_winning_target_count: u32,
        cycle_id: u64,
        expected_result: Result<(), ()>,
    ) {
        if expected_result.is_err() {
            return;
        }

        let winning_target_count = extra_winning_target_count + 1;
        let block_number = frame_system::Pallet::<Runtime>::block_number();
        let voting_ends_at = block_number + <Runtime as Config>::VoteStageDuration::get();

        assert_eq!(
            Stage::<Runtime, DefaultInstance>::get(),
            ReferendumStage::Voting(ReferendumStageVoting {
                started: block_number,
                winning_target_count,
                current_cycle_id: cycle_id,
                ends_at: voting_ends_at
            }),
        );

        InstanceMockUtils::<Runtime, DefaultInstance>::increase_block_number(1);

        assert_eq!(
            frame_system::Pallet::<Runtime>::events()
                .last()
                .unwrap()
                .event,
            Event::from(RawEvent::ReferendumStarted(
                winning_target_count,
                voting_ends_at
            ))
        );
    }

    pub fn check_voting_finished(winning_target_count: u32, cycle_id: u64) {
        let block_number = frame_system::Pallet::<Runtime>::block_number();
        let revealing_ends_at = block_number + <Runtime as Config>::RevealStageDuration::get();

        assert_eq!(
            Stage::<Runtime, DefaultInstance>::get(),
            ReferendumStage::Revealing(ReferendumStageRevealing {
                started: block_number,
                winning_target_count,
                intermediate_winners: WeakBoundedVec::default(),
                current_cycle_id: cycle_id,
                ends_at: revealing_ends_at
            }),
        );

        // check event was emitted
        assert_eq!(
            frame_system::Pallet::<Runtime>::events()
                .last()
                .unwrap()
                .event,
            Event::Referendum(RawEvent::RevealingStageStarted(revealing_ends_at))
        );
    }

    pub fn check_revealing_finished(
        expected_winners: Vec<
            OptionResult<
                <Runtime as common::membership::MembershipTypes>::MemberId,
                <Runtime as Config>::VotePower,
            >,
        >,
        expected_referendum_result: BTreeMap<u64, <Runtime as Config>::VotePower>,
    ) {
        Self::check_revealing_finished_winners(expected_winners);
        Self::check_revealing_finished_referendum_results(expected_referendum_result);
    }

    pub fn check_revealing_finished_winners(
        expected_winners: Vec<
            OptionResult<
                <Runtime as common::membership::MembershipTypes>::MemberId,
                <Runtime as Config>::VotePower,
            >,
        >,
    ) {
        assert_eq!(
            Stage::<Runtime, DefaultInstance>::get(),
            ReferendumStage::Inactive,
        );

        // check event was emitted
        assert_eq!(
            frame_system::Pallet::<Runtime>::events()
                .last()
                .unwrap()
                .event,
            Event::Referendum(RawEvent::ReferendumFinished(expected_winners,))
        );
    }

    pub fn check_revealing_finished_referendum_results(
        expected_referendum_result: BTreeMap<u64, <Runtime as Config>::VotePower>,
    ) {
        assert_eq!(
            Stage::<Runtime, DefaultInstance>::get(),
            ReferendumStage::Inactive,
        );

        INTERMEDIATE_RESULTS.with(|value| assert_eq!(*value.borrow(), expected_referendum_result,));
    }

    pub fn vote(
        origin: OriginType<<Runtime as frame_system::Config>::AccountId>,
        account_id: <Runtime as frame_system::Config>::AccountId,
        commitment: <Runtime as frame_system::Config>::Hash,
        stake: BalanceOf<Runtime>,
        cycle_id: u64,
        expected_result: Result<(), Error<Runtime, DefaultInstance>>,
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
                cycle_id,
                stake,
                vote_for: None,
            },
        );

        // check event was emitted
        assert_eq!(
            frame_system::Pallet::<Runtime>::events()
                .last()
                .unwrap()
                .event,
            Event::Referendum(RawEvent::VoteCast(account_id, commitment, stake))
        );
    }

    pub fn reveal_vote(
        origin: OriginType<<Runtime as frame_system::Config>::AccountId>,
        account_id: <Runtime as frame_system::Config>::AccountId,
        salt: Vec<u8>,
        vote_option_index: u64,
        expected_result: Result<(), Error<Runtime, DefaultInstance>>,
    ) -> () {
        // check method returns expected result
        assert_eq!(
            Module::<Runtime>::reveal_vote(
                InstanceMockUtils::<Runtime, DefaultInstance>::mock_origin(origin),
                salt.clone(),
                vote_option_index,
            ),
            expected_result,
        );

        if expected_result.is_err() {
            return;
        }

        // check event was emitted
        assert_eq!(
            frame_system::Pallet::<Runtime>::events()
                .last()
                .unwrap()
                .event,
            Event::Referendum(RawEvent::VoteRevealed(account_id, vote_option_index, salt))
        );
    }

    pub fn release_stake(
        origin: OriginType<<Runtime as frame_system::Config>::AccountId>,
        account_id: <Runtime as frame_system::Config>::AccountId,
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
            frame_system::Pallet::<Runtime>::events()
                .last()
                .unwrap()
                .event,
            Event::Referendum(RawEvent::StakeReleased(account_id))
        );
    }

    pub fn opt_out_of_voting(
        origin: OriginType<<Runtime as frame_system::Config>::AccountId>,
        expected_result: Result<(), Error<Runtime, DefaultInstance>>,
    ) -> () {
        let mock_origin = InstanceMockUtils::<Runtime, DefaultInstance>::mock_origin(origin);
        assert_eq!(
            Module::<Runtime>::opt_out_of_voting(mock_origin.clone()),
            expected_result,
        );

        if expected_result.is_err() {
            return;
        }

        // check if the account was added to AccountsOptedOut
        let account_id = ensure_signed(mock_origin).unwrap();
        assert!(AccountsOptedOut::<Runtime, DefaultInstance>::contains_key(
            &account_id
        ));

        // check event was emitted
        assert_eq!(
            frame_system::Pallet::<Runtime>::events()
                .last()
                .unwrap()
                .event,
            Event::Referendum(RawEvent::AccountOptedOutOfVoting(account_id))
        );
    }
}

#[cfg(feature = "runtime-benchmarks")]
impl
    crate::OptionCreator<
        <Runtime as frame_system::Config>::AccountId,
        <Runtime as common::membership::MembershipTypes>::MemberId,
    > for Runtime
{
    fn create_option(
        _: <Runtime as frame_system::Config>::AccountId,
        option_id: <Runtime as common::membership::MembershipTypes>::MemberId,
    ) {
        // clear saved option power from previous cycle
        INTERMEDIATE_RESULTS.with(|value| {
            value.borrow_mut().insert(option_id, 0);
        });
    }
}
