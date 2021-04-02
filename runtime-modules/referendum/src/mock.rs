#![cfg(test)]

/////////////////// Configuration //////////////////////////////////////////////
use crate::{
    BalanceOf, CastVote, Error, Instance, Module, OptionResult, RawEvent, ReferendumManager,
    ReferendumStage, ReferendumStageRevealing, ReferendumStageVoting, Stage, Trait, Votes,
    WeightInfo,
};

pub use crate::DefaultInstance;

use frame_support::dispatch::DispatchResult;
use frame_support::traits::{Currency, LockIdentifier, OnFinalize, OnInitialize};
use frame_support::weights::Weight;
use frame_support::{
    impl_outer_event, impl_outer_origin, parameter_types, StorageMap, StorageValue,
};
use frame_system::{EnsureOneOf, EnsureRoot, EnsureSigned, RawOrigin};
use rand::Rng;
use sp_core::H256;
use sp_runtime::traits::One;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};
use std::cell::RefCell;
use std::collections::BTreeMap;
use std::iter::FromIterator;
use std::marker::PhantomData;

use staking_handler::LockComparator;

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
    pub const MaxWinnerTargetCount: u64 = 10;
}

thread_local! {
    pub static IS_UNSTAKE_ENABLED: RefCell<(bool, )> = RefCell::new((true, )); // global switch for stake locking features; use it to simulate lock fails
    pub static IS_OPTION_ID_VALID: RefCell<(bool, )> = RefCell::new((true, )); // global switch used to test is_valid_option_id()

    // complete intermediate results
    pub static INTERMEDIATE_RESULTS: RefCell<BTreeMap<u64, <Runtime as Trait>::VotePower>> = RefCell::new(BTreeMap::<u64, <Runtime as Trait>::VotePower>::new());
}

impl LockComparator<u64> for Runtime {
    fn are_locks_conflicting(
        _new_lock: &LockIdentifier,
        _existing_locks: &[LockIdentifier],
    ) -> bool {
        false
    }
}

impl Trait for Runtime {
    type Event = TestEvent;

    type MaxSaltLength = MaxSaltLength;

    type StakingHandler = staking_handler::StakingManager<Self, LockId>;
    type ManagerOrigin =
        EnsureOneOf<Self::AccountId, EnsureSigned<Self::AccountId>, EnsureRoot<Self::AccountId>>;

    type VotePower = u64;

    type VoteStageDuration = VoteStageDuration;
    type RevealStageDuration = RevealStageDuration;

    type MinimumStake = MinimumStake;
    type WeightInfo = ();

    type MaxWinnerTargetCount = MaxWinnerTargetCount;

    fn calculate_vote_power(
        account_id: &<Self as frame_system::Trait>::AccountId,
        stake: &BalanceOf<Self>,
    ) -> <Self as Trait<DefaultInstance>>::VotePower {
        let stake: u64 = u64::from(*stake);
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

impl WeightInfo for () {
    fn on_initialize_revealing(_: u32) -> Weight {
        0
    }
    fn on_initialize_voting() -> Weight {
        0
    }
    fn vote() -> Weight {
        0
    }
    fn reveal_vote_space_for_new_winner(_: u32) -> Weight {
        0
    }
    fn reveal_vote_space_not_in_winners(_: u32) -> Weight {
        0
    }
    fn reveal_vote_space_replace_last_winner(_: u32) -> Weight {
        0
    }
    fn reveal_vote_already_existing(_: u32) -> Weight {
        0
    }
    fn release_vote_stake() -> Weight {
        0
    }
}

// Weights info stub
pub struct Weights;
impl membership::WeightInfo for Weights {
    fn buy_membership_without_referrer(_: u32, _: u32) -> Weight {
        unimplemented!()
    }
    fn buy_membership_with_referrer(_: u32, _: u32) -> Weight {
        unimplemented!()
    }
    fn update_profile(_: u32) -> Weight {
        unimplemented!()
    }
    fn update_accounts_none() -> Weight {
        unimplemented!()
    }
    fn update_accounts_root() -> Weight {
        unimplemented!()
    }
    fn update_accounts_controller() -> Weight {
        unimplemented!()
    }
    fn update_accounts_both() -> Weight {
        unimplemented!()
    }
    fn set_referral_cut() -> Weight {
        unimplemented!()
    }
    fn transfer_invites() -> Weight {
        unimplemented!()
    }
    fn invite_member(_: u32, _: u32) -> Weight {
        unimplemented!()
    }
    fn set_membership_price() -> Weight {
        unimplemented!()
    }
    fn update_profile_verification() -> Weight {
        unimplemented!()
    }
    fn set_leader_invitation_quota() -> Weight {
        unimplemented!()
    }
    fn set_initial_invitation_balance() -> Weight {
        unimplemented!()
    }
    fn set_initial_invitation_count() -> Weight {
        unimplemented!()
    }
    fn add_staking_account_candidate() -> Weight {
        unimplemented!()
    }
    fn confirm_staking_account() -> Weight {
        unimplemented!()
    }
    fn remove_staking_account() -> Weight {
        unimplemented!()
    }
}

parameter_types! {
    pub const DefaultMembershipPrice: u64 = 100;
    pub const DefaultInitialInvitationBalance: u64 = 100;
    pub const InvitedMemberLockId: [u8; 8] = [2; 8];
    pub const ReferralCutMaximumPercent: u8 = 50;
    pub const StakingCandidateLockId: [u8; 8] = [3; 8];
    pub const CandidateStake: u64 = 100;
}

impl membership::Trait for Runtime {
    type Event = TestEvent;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type WorkingGroup = ();
    type WeightInfo = Weights;
    type DefaultInitialInvitationBalance = DefaultInitialInvitationBalance;
    type InvitedMemberStakingHandler = staking_handler::StakingManager<Self, InvitedMemberLockId>;
    type ReferralCutMaximumPercent = ReferralCutMaximumPercent;
    type StakingCandidateStakingHandler =
        staking_handler::StakingManager<Self, StakingCandidateLockId>;
    type CandidateStake = CandidateStake;
}

impl pallet_timestamp::Trait for Runtime {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

impl common::working_group::WorkingGroupBudgetHandler<Runtime> for () {
    fn get_budget() -> u64 {
        unimplemented!()
    }

    fn set_budget(_new_value: u64) {
        unimplemented!()
    }
}

impl common::working_group::WorkingGroupAuthenticator<Runtime> for () {
    fn ensure_worker_origin(
        _origin: <Runtime as frame_system::Trait>::Origin,
        _worker_id: &<Runtime as common::membership::Trait>::ActorId,
    ) -> DispatchResult {
        unimplemented!()
    }

    fn ensure_leader_origin(_origin: <Runtime as frame_system::Trait>::Origin) -> DispatchResult {
        unimplemented!()
    }

    fn get_leader_member_id() -> Option<<Runtime as common::membership::Trait>::MemberId> {
        unimplemented!()
    }

    fn is_leader_account_id(_account_id: &<Runtime as frame_system::Trait>::AccountId) -> bool {
        true
    }

    fn is_worker_account_id(
        _account_id: &<Runtime as frame_system::Trait>::AccountId,
        _worker_id: &<Runtime as common::membership::Trait>::ActorId,
    ) -> bool {
        true
    }
}

impl common::membership::Trait for Runtime {
    type MemberId = u64;
    type ActorId = u64;
}

parameter_types! {
    pub const ExistentialDeposit: u64 = 10;
    pub const MaxLocks: u32 = 50;
}

impl balances::Trait for Runtime {
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
    pub use balances::Event;
}

mod membership_mod {
    pub use membership::Event;
}

impl_outer_event! {
    pub enum TestEvent for Runtime {
        event_mod DefaultInstance <T>,
        frame_system<T>,
        tmp<T>,
        membership_mod<T>,
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
    type AccountData = balances::AccountData<u64>;
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
    let _ = balances::Module::<Runtime>::deposit_creating(&account_id, amount);
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
        let mut block_number = frame_system::Module::<T>::block_number();

        for _ in 0..increase {
            <frame_system::Module<T> as OnFinalize<T::BlockNumber>>::on_finalize(block_number);
            <Module<T, I> as OnFinalize<T::BlockNumber>>::on_finalize(block_number);
            block_number = block_number + One::one();
            frame_system::Module::<T>::set_block_number(block_number);
            <frame_system::Module<T> as OnInitialize<T::BlockNumber>>::on_initialize(block_number);
            <Module<T, I> as OnInitialize<T::BlockNumber>>::on_initialize(block_number);
        }
    }

    pub fn move_to_block(block_number: T::BlockNumber) {
        let mut current_block = frame_system::Module::<T>::block_number();
        while current_block < block_number {
            Self::increase_block_number(1);
            current_block = frame_system::Module::<T>::block_number();
        }
    }

    pub fn calculate_commitment(
        account_id: &<T as frame_system::Trait>::AccountId,
        vote_option_index: &<T as common::membership::Trait>::MemberId,
        cycle_id: &u64,
    ) -> (T::Hash, Vec<u8>) {
        Self::calculate_commitment_for_cycle(account_id, &cycle_id, vote_option_index, None)
    }

    pub fn calculate_commitment_custom_salt(
        account_id: &<T as frame_system::Trait>::AccountId,
        vote_option_index: &<T as common::membership::Trait>::MemberId,
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
        vote_option_index: &<T as common::membership::Trait>::MemberId,
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
                <T as common::membership::Trait>::MemberId,
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

    // checks that winning_target_count equals expected
    // fails if used outisde of voting stage
    pub fn check_winning_target_count(winning_target_count: u64) {
        if let ReferendumStage::Voting(stage_data) = Stage::<Runtime, DefaultInstance>::get() {
            assert_eq!(stage_data.winning_target_count, winning_target_count);
        } else {
            assert!(false);
        }
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
                <Runtime as common::membership::Trait>::MemberId,
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

    pub fn force_start(winning_target_count: u64, cycle_id: u64) -> () {
        let extra_winning_target_count = winning_target_count - 1;

        <Module<Runtime> as ReferendumManager<
            <Runtime as frame_system::Trait>::Origin,
            <Runtime as frame_system::Trait>::AccountId,
            <Runtime as common::membership::Trait>::MemberId,
            <Runtime as frame_system::Trait>::Hash,
        >>::force_start(extra_winning_target_count, cycle_id);
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
                started: block_number,
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
                <Runtime as common::membership::Trait>::MemberId,
                <Runtime as Trait>::VotePower,
            >,
        >,
        expected_referendum_result: BTreeMap<u64, <Runtime as Trait>::VotePower>,
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
            frame_system::Module::<Runtime>::events()
                .last()
                .unwrap()
                .event,
            TestEvent::event_mod_DefaultInstance(RawEvent::VoteRevealed(
                account_id,
                vote_option_index,
                salt
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
