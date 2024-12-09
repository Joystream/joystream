#![cfg(test)]

/////////////////// Configuration //////////////////////////////////////////////
use crate as council;
use crate::{
    AnnouncementPeriodNr, Balance, Budget, BudgetIncrement, CandidateOf, Candidates, Config,
    CouncilMemberOf, CouncilMembers, CouncilStage, CouncilStageAnnouncing, CouncilStageElection,
    CouncilStageIdle, CouncilStageUpdate, CouncilorReward, Error, Module, NextBudgetRefill,
    RawEvent, ReferendumConnection, Stage,
};

use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::traits::{
    ConstU16, ConstU32, ConstU64, Currency, EitherOfDiverse, Get, LockIdentifier, OnFinalize,
    OnInitialize, WithdrawReasons,
};

use frame_support::{ensure, parameter_types, StorageMap, StorageValue};
use frame_system::{ensure_signed, EnsureRoot, EnsureSigned, EventRecord, Phase, RawOrigin};
use rand::Rng;
use referendum::{
    CastVote, OptionResult, ReferendumManager, ReferendumStage, ReferendumStageRevealing,
};
use sp_core::H256;

use sp_runtime::traits::Hash;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup, Zero},
    Percent,
};
use staking_handler::{LockComparator, StakingHandler, StakingManager};
use std::boxed::Box;
use std::cell::RefCell;
use std::collections::BTreeMap;
use std::convert::{TryFrom, TryInto};
use std::marker::PhantomData;

pub const USER_REGULAR_POWER_VOTES: u64 = 0;

pub const POWER_VOTE_STRENGTH: u64 = 10;

// uncomment this when this is moved back here from staking_handler.rs temporary file
pub const VOTER_BASE_ID: u64 = 4000;
pub const CANDIDATE_BASE_ID: u64 = VOTER_BASE_ID + VOTER_CANDIDATE_OFFSET;
pub const VOTER_CANDIDATE_OFFSET: u64 = 1000;

// multiplies topup value so that candidate/voter can candidate/vote multiple times
pub const TOPUP_MULTIPLIER: u64 = 10;

thread_local! {
    // new council elected recieved by `new_council_elected hook`
    pub static LAST_COUNCIL_ELECTED_OK: RefCell<(bool, )> = RefCell::new((false, ));
}

parameter_types! {
    pub const MinNumberOfExtraCandidates: u32 = 1;
    pub const AnnouncingPeriodDuration: u64 = 15;
    pub const IdlePeriodDuration: u64 = 27;
    pub const CouncilSize: u32 = 3;
    pub const MinCandidateStake: u64 = 11000;
    pub const CandidacyLockId: LockIdentifier = *b"council1";
    pub const CouncilorLockId: LockIdentifier = *b"council2";
    pub const ElectedMemberRewardPeriod: u64 = 10;
    // intentionally high number that prevents side-effecting tests other than  budget refill tests
    pub const BudgetRefillPeriod: u64 = 1000;
}

impl common::membership::MembershipTypes for Runtime {
    type MemberId = u64;
    type ActorId = u64;
}

impl Config for Runtime {
    type RuntimeEvent = RuntimeEvent;

    type Referendum = referendum::Module<Runtime, ReferendumInstance>;

    type MinNumberOfExtraCandidates = MinNumberOfExtraCandidates;
    type CouncilSize = CouncilSize;
    type AnnouncingPeriodDuration = AnnouncingPeriodDuration;
    type IdlePeriodDuration = IdlePeriodDuration;
    type MinCandidateStake = MinCandidateStake;

    type CandidacyLock = StakingManager<Self, CandidacyLockId>;
    type CouncilorLock = StakingManager<Self, CouncilorLockId>;

    type ElectedMemberRewardPeriod = ElectedMemberRewardPeriod;

    type StakingAccountValidator = ();

    type BudgetRefillPeriod = BudgetRefillPeriod;

    type WeightInfo = ();

    fn new_council_elected(elected_members: &[CouncilMemberOf<Self>]) {
        let is_ok = elected_members == CouncilMembers::<Runtime>::get().to_vec();

        LAST_COUNCIL_ELECTED_OK.with(|value| {
            *value.borrow_mut() = (is_ok,);
        });
    }

    type MemberOriginValidator = ();
}

impl common::membership::MemberOriginValidator<RuntimeOrigin, u64, u64> for () {
    fn ensure_member_controller_account_origin(
        origin: RuntimeOrigin,
        member_id: u64,
    ) -> Result<u64, DispatchError> {
        let account_id = ensure_signed(origin)?;

        ensure!(
            member_id == account_id,
            DispatchError::Other("Membership error")
        );

        Ok(account_id)
    }

    fn is_member_controller_account(member_id: &u64, account_id: &u64) -> bool {
        member_id == account_id
    }
}

impl common::StakingAccountValidator<Runtime> for () {
    fn is_member_staking_account(member_id: &u64, account_id: &u64) -> bool {
        *member_id == *account_id
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
        System: frame_system, // ::{Module, Call, Config, Storage, Event<T>},
        Council: council::{Pallet, Call, Storage, Event<T>},
        Membership: membership::{Pallet, Call, Storage, Event<T>},
        Referendum: referendum::<Instance1>::{Pallet, Call, Storage, Event<T>},
        Balances: balances::{Pallet, Call, Storage, Config<T>, Event<T>},
    }
);

parameter_types! {
    pub const BlockHashCount: u64 = 250;
}

impl frame_system::Config for Runtime {
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

/////////////////// Election module ////////////////////////////////////////////

pub type ReferendumInstance = referendum::Instance1;

thread_local! {
    // global switch for stake locking features; use it to simulate lock fails
    pub static IS_UNSTAKE_ENABLED: RefCell<(bool, )> = RefCell::new((true, ));

    // global switch used to test is_valid_option_id()
    pub static IS_OPTION_ID_VALID: RefCell<(bool, )> = RefCell::new((true, ));
}

parameter_types! {
    pub const VoteStageDuration: u64 = 19;
    pub const RevealStageDuration: u64 = 23;
    pub const MinimumVotingStake: u64 = 10000;
    pub const MaxSaltLength: u64 = 32; // use some multiple of 8 for ez testing
    pub const VotingLockId: LockIdentifier = *b"referend";
    pub const DefaultMembershipPrice: u64 = 100;
    pub const DefaultInitialInvitationBalance: u64 = 100;
    pub const DefaultMemberInvitesCount: u32 = 2;
    pub const MinimumPeriod: u64 = 5;
    pub const InvitedMemberLockId: [u8; 8] = [2; 8];
    pub const StakingCandidateLockId: [u8; 8] = [3; 8];
    pub const CandidateStake: u64 = 100;
    pub const MaxWinnerTargetCount: u32 = 10;
    pub const ReferralCutMaximumPercent: u8 = 50;
}

impl referendum::Config<ReferendumInstance> for Runtime {
    type RuntimeEvent = RuntimeEvent;

    type MaxSaltLength = MaxSaltLength;

    type ManagerOrigin =
        EitherOfDiverse<EnsureSigned<Self::AccountId>, EnsureRoot<Self::AccountId>>;

    type VotePower = u64;

    type VoteStageDuration = VoteStageDuration;
    type StakingHandler = staking_handler::StakingManager<Self, VotingLockId>;
    type RevealStageDuration = RevealStageDuration;

    type MinimumStake = MinimumVotingStake;
    type WeightInfo = ();

    type MaxWinnerTargetCount = MaxWinnerTargetCount;

    fn calculate_vote_power(
        account_id: &<Self as frame_system::Config>::AccountId,
        stake: &Balance<Self>,
    ) -> Self::VotePower {
        let stake: u64 = *stake;
        if *account_id == USER_REGULAR_POWER_VOTES {
            return stake * POWER_VOTE_STRENGTH;
        }

        stake
    }

    fn can_unlock_vote_stake(vote: &CastVote<Self::Hash, Balance<Self>, Self::MemberId>) -> bool {
        // trigger fail when requested to do so
        if !IS_UNSTAKE_ENABLED.with(|value| value.borrow().0) {
            return false;
        }

        <Module<Runtime> as ReferendumConnection<Runtime>>::can_unlock_vote_stake(vote).is_ok()
    }

    fn process_results(winners: &[OptionResult<Self::MemberId, Self::VotePower>]) {
        let tmp_winners: Vec<OptionResult<Self::MemberId, Self::VotePower>> = winners
            .iter()
            .map(|item| OptionResult {
                option_id: item.option_id,
                vote_power: item.vote_power,
            })
            .collect();
        <Module<Runtime> as ReferendumConnection<Runtime>>::recieve_referendum_results(
            tmp_winners.as_slice(),
        );
    }

    fn is_valid_option_id(option_index: &u64) -> bool {
        if !IS_OPTION_ID_VALID.with(|value| value.borrow().0) {
            return false;
        }

        <Module<Runtime> as ReferendumConnection<Runtime>>::is_valid_candidate_id(option_index)
    }

    fn get_option_power(option_id: &u64) -> Self::VotePower {
        <Module<Runtime> as ReferendumConnection<Runtime>>::get_option_power(option_id)
    }

    fn increase_option_power(option_id: &u64, amount: &Self::VotePower) {
        <Module<Runtime> as ReferendumConnection<Runtime>>::increase_option_power(
            option_id, amount,
        );
    }
}

impl balances::Config for Runtime {
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

impl membership::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
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
        _origin: <Runtime as frame_system::Config>::RuntimeOrigin,
        _worker_id: &<Runtime as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        unimplemented!();
    }

    fn get_leader_member_id() -> Option<<Runtime as common::membership::MembershipTypes>::MemberId>
    {
        unimplemented!();
    }

    fn get_worker_member_id(
        _: &<Runtime as common::membership::MembershipTypes>::ActorId,
    ) -> Option<<Runtime as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn ensure_leader_origin(
        _origin: <Runtime as frame_system::Config>::RuntimeOrigin,
    ) -> DispatchResult {
        unimplemented!()
    }

    fn is_leader_account_id(_account_id: &<Runtime as frame_system::Config>::AccountId) -> bool {
        unimplemented!()
    }

    fn is_worker_account_id(
        _account_id: &<Runtime as frame_system::Config>::AccountId,
        _worker_id: &<Runtime as common::membership::MembershipTypes>::ActorId,
    ) -> bool {
        unimplemented!()
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

impl pallet_timestamp::Config for Runtime {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

impl Runtime {
    pub fn _feature_option_id_valid(is_valid: bool) -> () {
        IS_OPTION_ID_VALID.with(|value| {
            *value.borrow_mut() = (is_valid,);
        });
    }
}

parameter_types! {
    pub const ExistentialDeposit: u64 = 10;
    pub const MaxLocks: u32 = 50;
}

impl LockComparator<<Runtime as balances::Config>::Balance> for Runtime {
    fn are_locks_conflicting(
        _new_lock: &LockIdentifier,
        _existing_locks: &[LockIdentifier],
    ) -> bool {
        false
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

#[derive(Clone)]
pub struct CandidateInfo<T: Config> {
    pub origin: OriginType<T::AccountId>,
    pub account_id: T::MemberId,
    pub membership_id: T::MemberId,
    pub candidate: CandidateOf<T>,
    pub auto_topup_amount: Balance<T>,
}

#[derive(Clone)]
pub struct VoterInfo<T: Config> {
    pub origin: OriginType<T::AccountId>,
    pub account_id: T::AccountId,
    pub commitment: T::Hash,
    pub salt: Vec<u8>,
    pub vote_for: u64,
    pub stake: Balance<T>,
}

#[derive(Clone)]
pub struct CouncilSettings<T: Config> {
    pub council_size: u32,
    pub min_candidate_count: u32,
    pub min_candidate_stake: Balance<T>,
    pub announcing_stage_duration: T::BlockNumber,
    pub voting_stage_duration: T::BlockNumber,
    pub reveal_stage_duration: T::BlockNumber,
    pub idle_stage_duration: T::BlockNumber,
    pub election_duration: T::BlockNumber,
    pub cycle_duration: T::BlockNumber,
    pub budget_refill_period: T::BlockNumber,
}

impl<T: Config> CouncilSettings<T>
where
    T::BlockNumber: From<u64>,
{
    pub fn extract_settings() -> CouncilSettings<T> {
        let council_size = T::CouncilSize::get();

        let reveal_stage_duration =
            <Runtime as referendum::Config<ReferendumInstance>>::RevealStageDuration::get().into();
        let announcing_stage_duration = <T as Config>::AnnouncingPeriodDuration::get();
        let voting_stage_duration =
            <Runtime as referendum::Config<ReferendumInstance>>::VoteStageDuration::get().into();
        let idle_stage_duration = <T as Config>::IdlePeriodDuration::get();

        CouncilSettings {
            council_size,
            min_candidate_count: council_size + <T as Config>::MinNumberOfExtraCandidates::get(),
            min_candidate_stake: T::MinCandidateStake::get(),
            announcing_stage_duration,
            voting_stage_duration,
            reveal_stage_duration,
            idle_stage_duration: <T as Config>::IdlePeriodDuration::get(),

            election_duration: reveal_stage_duration
                + announcing_stage_duration
                + voting_stage_duration,
            cycle_duration: reveal_stage_duration
                + announcing_stage_duration
                + voting_stage_duration
                + idle_stage_duration,

            budget_refill_period: <T as Config>::BudgetRefillPeriod::get(),
        }
    }
}

#[derive(Clone, PartialEq, Debug)]
pub enum CouncilCycleInterrupt {
    BeforeCandidatesAnnounce,
    AfterCandidatesAnnounce,
    BeforeVoting,
    AfterVoting,
    BeforeRevealing,
    AfterRevealing,
    AfterElectionComplete,
}

#[derive(Clone)]
pub struct CouncilCycleParams<T: Config> {
    pub council_settings: CouncilSettings<T>,
    pub cycle_start_block_number: T::BlockNumber,

    // council members
    pub expected_initial_council_members: Vec<CouncilMemberOf<T>>,

    // council members after cycle finishes
    pub expected_final_council_members: Vec<CouncilMemberOf<T>>,

    // candidates announcing their candidacy
    pub candidates_announcing: Vec<CandidateInfo<T>>,

    // expected list of candidates after announcement period is over
    pub expected_candidates: Vec<CandidateOf<T>>,

    // voters that will participate in council voting
    pub voters: Vec<VoterInfo<T>>,

    // info about when should be cycle interrupted (used to customize the test)
    pub interrupt_point: Option<CouncilCycleInterrupt>,
}

/////////////////// Util macros ////////////////////////////////////////////////
macro_rules! escape_checkpoint {
    ($item:expr, $expected_value:expr) => {
        if $item == $expected_value {
            return;
        }
    };
    ($item:expr, $expected_value:expr, $return_value:expr) => {
        if $item == $expected_value {
            return $c;
        }
    };
}

/////////////////// Utility mocks //////////////////////////////////////////////

pub fn default_genesis_config() -> council::GenesisConfig<Runtime> {
    council::GenesisConfig::<Runtime> {
        stage: CouncilStageUpdate::default(),
        announcement_period_nr: 0,
        budget: 0,
        next_reward_payments: 0,
        next_budget_refill: <Runtime as Config>::BudgetRefillPeriod::get(),
        budget_increment: 1,
        councilor_reward: 100,
        era_payout_damping_factor: Percent::from_percent(100),
    }
}

pub fn build_test_externalities(
    config: council::GenesisConfig<Runtime>,
) -> sp_io::TestExternalities {
    let mut t = frame_system::GenesisConfig::default()
        .build_storage::<Runtime>()
        .unwrap();

    config.assimilate_storage(&mut t).unwrap();

    let mut result = Into::<sp_io::TestExternalities>::into(t.clone());

    // Make sure we are not in block 1 where no events are emitted
    // see https://substrate.dev/recipes/2-appetizers/4-events.html#emitting-events
    result.execute_with(|| InstanceMockUtils::<Runtime>::increase_block_number(1));

    result
}

pub struct InstanceMockUtils<T: Config> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Config> InstanceMockUtils<T>
where
    T::AccountId: From<u64>,
    T::MemberId: From<u64>,
    T::BlockNumber: From<u64> + Into<u64>,
    Balance<T>: From<u64> + Into<u64>,
{
    pub fn mock_origin(origin: OriginType<T::AccountId>) -> T::RuntimeOrigin {
        match origin {
            OriginType::Signed(account_id) => T::RuntimeOrigin::from(RawOrigin::Signed(account_id)),
            OriginType::Root => RawOrigin::Root.into(),
            //_ => panic!("not implemented"),
        }
    }

    pub fn increase_block_number(increase: u64) -> () {
        let mut block_number = frame_system::Pallet::<T>::block_number();

        for _ in 0..increase {
            <Module<T> as OnFinalize<T::BlockNumber>>::on_finalize(block_number);
            <referendum::Module<Runtime, ReferendumInstance> as OnFinalize<
                <Runtime as frame_system::Config>::BlockNumber,
            >>::on_finalize(block_number.into());

            block_number += 1.into();
            frame_system::Pallet::<T>::set_block_number(block_number);

            <Module<T> as OnInitialize<T::BlockNumber>>::on_initialize(block_number);
            <referendum::Module<Runtime, ReferendumInstance> as OnInitialize<
                <Runtime as frame_system::Config>::BlockNumber,
            >>::on_initialize(block_number.into());
        }
    }

    // topup currency to the account
    fn topup_account(account_id: u64, amount: Balance<T>) {
        let _ = balances::Pallet::<Runtime>::deposit_creating(&account_id, amount.into());
    }

    pub fn generate_candidate(index: u64, stake: Balance<T>) -> CandidateInfo<T> {
        let account_id = CANDIDATE_BASE_ID + index;
        let origin = OriginType::Signed(account_id.into());
        let candidate = CandidateOf::<T> {
            staking_account_id: account_id.into(),
            reward_account_id: account_id.into(),
            cycle_id: AnnouncementPeriodNr::get(),
            stake,
            vote_power: 0.into(),
            note_hash: None,
        };

        let auto_topup_amount = stake * TOPUP_MULTIPLIER.into();

        Self::topup_account(account_id, auto_topup_amount);

        CandidateInfo {
            origin,
            candidate,
            membership_id: account_id.into(),
            account_id: account_id.into(),
            auto_topup_amount,
        }
    }

    pub fn generate_voter(
        index: u64,
        stake: Balance<T>,
        vote_for_index: u64,
        cycle_id: u64,
    ) -> VoterInfo<T> {
        let account_id = VOTER_BASE_ID + index;
        let origin = OriginType::Signed(account_id.into());
        let (commitment, salt) =
            Self::vote_commitment(&account_id.into(), &vote_for_index.into(), &cycle_id);

        Self::topup_account(account_id, stake);

        VoterInfo {
            origin,
            account_id: account_id.into(),
            commitment,
            salt,
            vote_for: vote_for_index,
            stake,
        }
    }

    pub fn generate_salt() -> Vec<u8> {
        let mut rng = rand::thread_rng();

        rng.gen::<u64>().to_be_bytes().to_vec()
    }

    pub fn vote_commitment(
        account_id: &<T as frame_system::Config>::AccountId,
        vote_option_index: &<T as common::membership::MembershipTypes>::MemberId,
        cycle_id: &u64,
    ) -> (T::Hash, Vec<u8>) {
        let salt = Self::generate_salt();

        (
            T::Referendum::calculate_commitment(account_id, &salt, cycle_id, vote_option_index),
            salt.to_vec(),
        )
    }
}

/////////////////// Mocks of Module's actions //////////////////////////////////

pub struct InstanceMocks<T: Config> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Config> InstanceMocks<T>
where
    T::AccountId: From<u64> + Into<u64>,
    T::MemberId: From<u64> + Into<u64>,
    T::BlockNumber: From<u64> + Into<u64>,
    Balance<T>: From<u64> + Into<u64>,

    T::Hash: From<<Runtime as frame_system::Config>::Hash>
        + Into<<Runtime as frame_system::Config>::Hash>,
    T::RuntimeOrigin: From<<Runtime as frame_system::Config>::RuntimeOrigin>
        + Into<<Runtime as frame_system::Config>::RuntimeOrigin>,
    <T::Referendum as ReferendumManager<T::RuntimeOrigin, T::AccountId, T::MemberId, T::Hash>>::VotePower:
        From<u64> + Into<u64>,
    T::MemberId: Into<T::AccountId>,
{
    pub fn check_announcing_period(
        expected_update_block_number: T::BlockNumber,
        expected_state: CouncilStageAnnouncing<T::BlockNumber>,
    ) -> () {
        // check stage is in proper state
        assert_eq!(
            Stage::<T>::get(),
            CouncilStageUpdate::<T::BlockNumber> {
                stage: CouncilStage::Announcing(expected_state),
                changed_at: expected_update_block_number,
            },
        );
    }

    pub fn check_election_period(
        expected_update_block_number: T::BlockNumber,
        expected_state: CouncilStageElection,
    ) -> () {
        // check stage is in proper state
        assert_eq!(
            Stage::<T>::get(),
            CouncilStageUpdate::<T::BlockNumber> {
                stage: CouncilStage::Election(expected_state),
                changed_at: expected_update_block_number,
            },
        );
    }

    pub fn check_idle_period(expected_update_block_number: T::BlockNumber) -> () {
        // check stage is in proper state
        assert_eq!(
            Stage::<T>::get(),
            CouncilStageUpdate::<T::BlockNumber> {
                stage: CouncilStage::Idle(CouncilStageIdle::<T::BlockNumber> {
                    ends_at: expected_update_block_number + T::IdlePeriodDuration::get()
                }),
                changed_at: expected_update_block_number,
            },
        );
    }

    pub fn check_council_members(expect_members: Vec<CouncilMemberOf<T>>) -> () {
        // check stage is in proper state
        assert_eq!(CouncilMembers::<T>::get(), expect_members,);
    }

    pub fn check_referendum_revealing(
        winning_target_count: u32,
        intermediate_winners: Vec<
            OptionResult<
                T::MemberId,
                <T::Referendum as ReferendumManager<
                    T::RuntimeOrigin,
                    T::AccountId,
                    T::MemberId,
                    T::Hash,
                >>::VotePower,
            >,
        >,
        intermediate_results: BTreeMap<
            u64,
            <T::Referendum as ReferendumManager<T::RuntimeOrigin, T::AccountId, T::MemberId, T::Hash>>::VotePower,
        >,
        expected_update_block_number: T::BlockNumber,
    ) {
        // check stage is in proper state
        assert_eq!(
            referendum::Stage::<Runtime, ReferendumInstance>::get(),
            ReferendumStage::Revealing(ReferendumStageRevealing {
                winning_target_count,
                started: expected_update_block_number.into(),
                intermediate_winners: intermediate_winners
                    .iter()
                    .map(|item| OptionResult {
                        option_id: <T::MemberId as Into<u64>>::into(item.option_id),
                        vote_power: item.vote_power.into(),
                    })
                    .collect::<Vec<_>>()
                    .try_into()
                    .unwrap(),
                current_cycle_id: AnnouncementPeriodNr::get(),
                ends_at:
                    <Runtime as referendum::Config<ReferendumInstance>>::RevealStageDuration::get()
                        + expected_update_block_number.into()
            }),
        );

        // check intermediate results
        for (key, value) in intermediate_results {
            let membership_id: T::MemberId = key.into();

            assert_eq!(
                Candidates::<T>::get(membership_id)
                    .expect("Candidate Must Exist")
                    .vote_power,
                value
            );
        }
    }

    pub fn check_announcing_stake(membership_id: &T::MemberId, amount: Balance<T>) {
        assert_eq!(
            Candidates::<T>::get(membership_id)
                .expect("Candidate Must Exist")
                .stake,
            amount
        );
    }

    pub fn check_candidacy_note(membership_id: &T::MemberId, note: Option<&[u8]>) {
        assert_eq!(Candidates::<T>::contains_key(membership_id), true);

        let note_hash = note.map(T::Hashing::hash);

        assert_eq!(
            Candidates::<T>::get(membership_id)
                .expect("Candidate Must Exist")
                .note_hash,
            note_hash,
        );
    }

    pub fn check_budget_refill(expected_balance: Balance<T>, expected_next_refill: T::BlockNumber) {
        assert_eq!(Budget::<T>::get(), expected_balance,);
        assert_eq!(NextBudgetRefill::<T>::get(), expected_next_refill,);
    }

    pub fn check_new_council_elected_hook() {
        LAST_COUNCIL_ELECTED_OK.with(|value| assert!(value.borrow().0));

        // clear election sign
        LAST_COUNCIL_ELECTED_OK.with(|value| {
            *value.borrow_mut() = (false,);
        });
    }

    pub fn set_candidacy_note(
        origin: OriginType<T::AccountId>,
        membership_id: T::MemberId,
        note: &[u8],
        expected_result: Result<(), Error<T>>,
    ) {
        // check method returns expected result
        assert_eq!(
            Module::<T>::set_candidacy_note(
                InstanceMockUtils::<T>::mock_origin(origin),
                membership_id,
                note.to_vec()
            ),
            expected_result,
        );

        if expected_result.is_err() {
            return;
        }
        assert_eq!(
            frame_system::Pallet::<Runtime>::events()
                .last()
                .unwrap()
                .event,
            RuntimeEvent::Council(RawEvent::CandidacyNoteSet(
                membership_id.into(),
                note.into()
            )),
        );

        Self::check_candidacy_note(&membership_id, Some(note));
    }

    pub fn announce_candidacy(
        origin: OriginType<T::AccountId>,
        member_id: T::MemberId,
        stake: Balance<T>,
        expected_result: DispatchResult,
    ) {
        // use member id as staking and reward accounts
        Self::announce_candidacy_raw(
            origin,
            member_id,
            member_id.into(),
            member_id.into(),
            stake,
            expected_result,
        );
    }

    pub fn announce_candidacy_raw(
        origin: OriginType<T::AccountId>,
        member_id: T::MemberId,
        staking_account_id: T::AccountId,
        reward_account_id: T::AccountId,
        stake: Balance<T>,
        expected_result: DispatchResult,
    ) {
        // check method returns expected result
        assert_eq!(
            Module::<T>::announce_candidacy(
                InstanceMockUtils::<T>::mock_origin(origin),
                member_id,
                staking_account_id.clone(),
                reward_account_id.clone(),
                stake
            ),
            expected_result,
        );

        if expected_result.is_err() {
            return;
        }

        assert_eq!(
            frame_system::Pallet::<Runtime>::events()
                .last()
                .unwrap()
                .event,
            RuntimeEvent::Council(RawEvent::NewCandidate(
                member_id.into(),
                staking_account_id.into(),
                reward_account_id.into(),
                stake.into()
            )),
        );
    }

    pub fn withdraw_candidacy(
        origin: OriginType<T::AccountId>,
        member_id: T::MemberId,
        expected_result: Result<(), Error<T>>,
    ) {
        // check method returns expected result
        assert_eq!(
            Module::<T>::withdraw_candidacy(InstanceMockUtils::<T>::mock_origin(origin), member_id,),
            expected_result,
        );

        if expected_result.is_err() {
            return;
        }

        assert_eq!(
            frame_system::Pallet::<Runtime>::events()
                .last()
                .unwrap()
                .event,
            RuntimeEvent::Council(RawEvent::CandidacyWithdraw(member_id.into(),)),
        );
    }

    pub fn release_candidacy_stake(
        origin: OriginType<T::AccountId>,
        member_id: T::MemberId,
        expected_result: Result<(), Error<T>>,
    ) {
        // check method returns expected result
        assert_eq!(
            Module::<T>::release_candidacy_stake(
                InstanceMockUtils::<T>::mock_origin(origin),
                member_id,
            ),
            expected_result,
        );

        if expected_result.is_err() {
            return;
        }

        assert_eq!(
            frame_system::Pallet::<Runtime>::events()
                .last()
                .unwrap()
                .event,
            RuntimeEvent::Council(RawEvent::CandidacyStakeRelease(member_id.into(),)),
        );
    }

    pub fn vote_for_candidate(
        origin: OriginType<T::AccountId>,
        commitment: T::Hash,
        stake: Balance<T>,
        expected_result: Result<(), ()>,
    ) -> () {
        // check method returns expected result
        assert_eq!(
            referendum::Module::<Runtime, ReferendumInstance>::vote(
                InstanceMockUtils::<T>::mock_origin(origin).into(),
                commitment.into(),
                stake.into(),
            )
            .is_ok(),
            expected_result.is_ok(),
        );
    }

    pub fn reveal_vote(
        origin: OriginType<T::AccountId>,
        salt: Vec<u8>,
        vote_option: u64,
        //expected_result: Result<(), referendum::Error<T, ReferendumInstance>>,
        expected_result: Result<(), ()>,
    ) -> () {
        // check method returns expected result
        assert_eq!(
            referendum::Module::<Runtime, ReferendumInstance>::reveal_vote(
                InstanceMockUtils::<T>::mock_origin(origin).into(),
                salt,
                vote_option,
            )
            .is_ok(),
            expected_result.is_ok(),
        );
    }

    pub fn release_vote_stake(
        origin: OriginType<<Runtime as frame_system::Config>::AccountId>,
        expected_result: Result<(), ()>,
    ) -> () {
        // check method returns expected result
        assert_eq!(
            referendum::Module::<Runtime, ReferendumInstance>::release_vote_stake(
                InstanceMockUtils::<Runtime>::mock_origin(origin),
            )
            .is_ok(),
            expected_result.is_ok(),
        );
    }

    pub fn set_budget(
        origin: OriginType<T::AccountId>,
        amount: Balance<T>,
        expected_result: Result<(), ()>,
    ) {
        // check method returns expected result
        assert_eq!(
            Module::<T>::set_budget(InstanceMockUtils::<T>::mock_origin(origin), amount,).is_ok(),
            expected_result.is_ok(),
        );

        if expected_result.is_err() {
            return;
        }

        assert_eq!(Budget::<T>::get(), amount,);

        assert_eq!(
            frame_system::Pallet::<Runtime>::events()
                .last()
                .unwrap()
                .event,
            RuntimeEvent::Council(RawEvent::BudgetBalanceSet(amount.into())),
        );
    }

    pub fn funding_request(
        origin: OriginType<T::AccountId>,
        funding_requests: Vec<common::FundingRequestParameters<Balance<T>, T::AccountId>>,
        expected_result: Result<(), Error<T>>,
    ) {
        let initial_budget = Module::<T>::budget();
        // check method returns expected result
        assert_eq!(
            Module::<T>::funding_request(
                InstanceMockUtils::<T>::mock_origin(origin),
                funding_requests.clone(),
            )
            .is_ok(),
            expected_result.is_ok(),
        );

        if expected_result.is_err() {
            return;
        }

        for funding_request in &funding_requests {
            assert!(frame_system::Pallet::<Runtime>::events()
                .iter()
                .any(|ev| ev.event
                    == RuntimeEvent::Council(RawEvent::RequestFunded(
                        funding_request.account.clone().into(),
                        funding_request.amount.into(),
                    ))));

            assert_eq!(
                balances::Pallet::<T>::free_balance(funding_request.account.clone()),
                funding_request.amount
            );
        }

        let spent_amount = funding_requests
            .iter()
            .fold(Balance::<T>::zero(), |acc, funding_request| {
                acc + funding_request.amount
            });

        assert_eq!(Module::<T>::budget(), initial_budget - spent_amount);
    }

    pub fn plan_budget_refill(
        origin: OriginType<T::AccountId>,
        next_refill: T::BlockNumber,
        expected_result: Result<(), ()>,
    ) {
        // check method returns expected result
        assert_eq!(
            Module::<T>::plan_budget_refill(
                InstanceMockUtils::<T>::mock_origin(origin),
                next_refill,
            )
            .is_ok(),
            expected_result.is_ok(),
        );

        if expected_result.is_err() {
            return;
        }

        assert_eq!(NextBudgetRefill::<T>::get(), next_refill,);

        assert_eq!(
            frame_system::Pallet::<Runtime>::events()
                .last()
                .unwrap()
                .event,
            RuntimeEvent::Council(RawEvent::BudgetRefillPlanned(next_refill.into())),
        );
    }

    pub fn set_councilor_reward(
        origin: OriginType<T::AccountId>,
        councilor_reward: T::Balance,
        expected_result: Result<(), ()>,
    ) {
        // check method returns expected result
        assert_eq!(
            Module::<T>::set_councilor_reward(
                InstanceMockUtils::<T>::mock_origin(origin),
                councilor_reward,
            )
            .is_ok(),
            expected_result.is_ok(),
        );

        if expected_result.is_err() {
            return;
        }

        assert_eq!(CouncilorReward::<T>::get(), councilor_reward);

        assert_eq!(
            frame_system::Pallet::<Runtime>::events()
                .last()
                .unwrap()
                .event,
            RuntimeEvent::Council(RawEvent::CouncilorRewardUpdated(councilor_reward.into())),
        );
    }

    pub fn set_budget_increment(
        origin: OriginType<T::AccountId>,
        budget_increment: T::Balance,
        expected_result: Result<(), ()>,
    ) {
        // check method returns expected result
        assert_eq!(
            Module::<T>::set_budget_increment(
                InstanceMockUtils::<T>::mock_origin(origin),
                budget_increment,
            )
            .is_ok(),
            expected_result.is_ok(),
        );

        if expected_result.is_err() {
            return;
        }

        assert_eq!(BudgetIncrement::<T>::get(), budget_increment,);

        assert_eq!(
            frame_system::Pallet::<Runtime>::events()
                .last()
                .unwrap()
                .event,
            RuntimeEvent::Council(RawEvent::BudgetIncrementUpdated(budget_increment.into())),
        );
    }

    // simulate one council's election cycle
    pub fn simulate_council_cycle(params: CouncilCycleParams<T>) {
        let settings = params.council_settings;

        // check initial council members
        Self::check_council_members(params.expected_initial_council_members.clone());

        // start announcing
        Self::check_announcing_period(
            params.cycle_start_block_number,
            CouncilStageAnnouncing {
                candidates_count: 0,
                ends_at: params.cycle_start_block_number + T::AnnouncingPeriodDuration::get(),
            },
        );

        escape_checkpoint!(
            params.interrupt_point,
            Some(CouncilCycleInterrupt::BeforeCandidatesAnnounce)
        );

        // announce candidacy for each candidate
        params.candidates_announcing.iter().for_each(|candidate| {
            Self::announce_candidacy(
                candidate.origin.clone(),
                candidate.account_id,
                settings.min_candidate_stake,
                Ok(()),
            );
        });

        escape_checkpoint!(
            params.interrupt_point,
            Some(CouncilCycleInterrupt::AfterCandidatesAnnounce)
        );

        // forward to election-voting period
        InstanceMockUtils::<T>::increase_block_number(settings.announcing_stage_duration.into());

        // finish announcing period / start referendum -> will cause period prolongement
        Self::check_election_period(
            params.cycle_start_block_number + settings.announcing_stage_duration,
            CouncilStageElection {
                candidates_count: params.expected_candidates.len() as u32,
            },
        );

        escape_checkpoint!(
            params.interrupt_point,
            Some(CouncilCycleInterrupt::BeforeVoting)
        );

        // vote with all voters
        params.voters.iter().for_each(|voter| {
            Self::vote_for_candidate(voter.origin.clone(), voter.commitment, voter.stake, Ok(()))
        });

        escape_checkpoint!(
            params.interrupt_point,
            Some(CouncilCycleInterrupt::AfterVoting)
        );

        // forward to election-revealing period
        InstanceMockUtils::<T>::increase_block_number(settings.voting_stage_duration.into());

        // referendum - start revealing period
        Self::check_referendum_revealing(
            settings.council_size,
            vec![],
            BTreeMap::new(), //<u64, T::VotePower>,
            params.cycle_start_block_number
                + settings.announcing_stage_duration
                + settings.voting_stage_duration,
        );

        escape_checkpoint!(
            params.interrupt_point,
            Some(CouncilCycleInterrupt::BeforeRevealing)
        );

        // reveal vote for all voters
        params.voters.iter().for_each(|voter| {
            Self::reveal_vote(
                voter.origin.clone(),
                voter.salt.clone(),
                voter.vote_for,
                Ok(()),
            );
        });

        escape_checkpoint!(
            params.interrupt_point,
            Some(CouncilCycleInterrupt::AfterRevealing)
        );

        // finish election / start idle period
        InstanceMockUtils::<T>::increase_block_number(settings.reveal_stage_duration.into());
        Self::check_idle_period(
            params.cycle_start_block_number
                + settings.reveal_stage_duration
                + settings.announcing_stage_duration
                + settings.voting_stage_duration,
        );
        Self::check_council_members(params.expected_final_council_members.clone());

        escape_checkpoint!(
            params.interrupt_point,
            Some(CouncilCycleInterrupt::AfterElectionComplete)
        );

        InstanceMockUtils::<T>::increase_block_number(settings.idle_stage_duration.into());
    }

    // Simulate one full round of council lifecycle (announcing, election, idle). Use it to
    // quickly test behavior in 2nd, 3rd, etc. cycle.
    pub fn run_full_council_cycle(
        start_block_number: T::BlockNumber,
        expected_initial_council_members: &[CouncilMemberOf<T>],
        users_offset: u64,
    ) -> CouncilCycleParams<T> {
        Self::run_council_cycle_with_interrupt(
            start_block_number,
            expected_initial_council_members,
            users_offset,
            None,
        )
    }

    pub fn run_council_cycle_with_interrupt(
        start_block_number: T::BlockNumber,
        expected_initial_council_members: &[CouncilMemberOf<T>],
        users_offset: u64,
        interrupt_point: Option<CouncilCycleInterrupt>,
    ) -> CouncilCycleParams<T> {
        // If a prior call was made with an interrupt,
        // we might need to move to desired start block, which is expected to be the begining of the
        // announcing stage.
        if start_block_number.into() > 0 {
            let current_block_number = frame_system::Pallet::<Runtime>::block_number();
            if current_block_number > start_block_number.into() + 1 {
                panic!("start_block_number is in the past!");
            }

            InstanceMockUtils::<Runtime>::increase_block_number(
                start_block_number.into() + 1 - current_block_number,
            );
        }

        let council_settings = CouncilSettings::<T>::extract_settings();
        let vote_stake = <Runtime as referendum::Config<ReferendumInstance>>::MinimumStake::get();

        // generate candidates
        let candidates: Vec<CandidateInfo<T>> = (0..(council_settings.min_candidate_count + 1)
            as u64)
            .map(|i| {
                InstanceMockUtils::<T>::generate_candidate(
                    i + users_offset,
                    council_settings.min_candidate_stake,
                )
            })
            .collect();

        // prepare candidates that are expected to get into candidacy list
        let expected_candidates = candidates
            .iter()
            .map(|item| item.candidate.clone())
            .collect();

        let expected_final_council_members: Vec<CouncilMemberOf<T>> = vec![
            (
                candidates[3].candidate.clone(),
                candidates[3].membership_id,
                start_block_number + council_settings.election_duration,
                0.into(),
            )
                .into(),
            (
                candidates[0].candidate.clone(),
                candidates[0].membership_id,
                start_block_number + council_settings.election_duration,
                0.into(),
            )
                .into(),
            (
                candidates[1].candidate.clone(),
                candidates[1].membership_id,
                start_block_number + council_settings.election_duration,
                0.into(),
            )
                .into(),
        ];

        // generate voter for each 6 voters and give: 4 votes for option D, 3 votes for option A,
        // and 2 vote for option B, and 1 for option C
        let votes_map: Vec<u64> = vec![3, 3, 3, 3, 0, 0, 0, 1, 1, 2];
        let voters = (0..votes_map.len())
            .map(|index| {
                InstanceMockUtils::<T>::generate_voter(
                    index as u64 + users_offset,
                    vote_stake.into(),
                    CANDIDATE_BASE_ID + votes_map[index] + users_offset,
                    AnnouncementPeriodNr::get(),
                )
            })
            .collect();

        let params = CouncilCycleParams {
            council_settings: CouncilSettings::<T>::extract_settings(),
            cycle_start_block_number: start_block_number,
            expected_initial_council_members: expected_initial_council_members.to_vec(),
            expected_final_council_members,
            candidates_announcing: candidates,
            expected_candidates,
            voters,

            interrupt_point,
        };

        InstanceMocks::<T>::simulate_council_cycle(params.clone());

        params
    }
}

pub const DEFAULT_ACCOUNT_ID: u64 = 1u64;
pub const DEFAULT_MEMBER_ID: u64 = 1u64;
pub struct FundCouncilBudgetFixture {
    origin: RawOrigin<u64>,
    member_id: u64,
    amount: u64,
    rationale: Vec<u8>,
}

impl Default for FundCouncilBudgetFixture {
    fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_ACCOUNT_ID),
            member_id: DEFAULT_MEMBER_ID,
            amount: 100,
            rationale: Vec::new(),
        }
    }
}

impl FundCouncilBudgetFixture {
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_member_id(self, member_id: u64) -> Self {
        Self { member_id, ..self }
    }

    pub fn with_amount(self, amount: u64) -> Self {
        Self { amount, ..self }
    }

    pub fn with_rationale(self, rationale: Vec<u8>) -> Self {
        Self { rationale, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_budget = Council::budget();

        let actual_result = Council::fund_council_budget(
            self.origin.clone().into(),
            self.member_id,
            self.amount,
            self.rationale.clone(),
        );

        assert_eq!(actual_result.clone(), expected_result);

        let new_budget = Council::budget();

        if actual_result.is_ok() {
            assert_eq!(new_budget, old_budget + self.amount);
        } else {
            assert_eq!(old_budget, new_budget);
        }
    }
}

// Recommendation from Parity on testing on_finalize
// https://substrate.dev/docs/en/next/development/module/tests
pub fn run_to_block(n: u64) {
    while System::block_number() < n {
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}

pub struct EventFixture;
impl EventFixture {
    pub fn assert_last_crate_event(expected_raw_event: RawEvent<u64, u64, u64, u64>) {
        let converted_event = RuntimeEvent::Council(expected_raw_event);

        Self::assert_last_global_event(converted_event)
    }

    pub fn assert_last_global_event(expected_event: RuntimeEvent) {
        let expected_event = EventRecord {
            phase: Phase::Initialization,
            event: expected_event,
            topics: vec![],
        };

        assert_eq!(System::events().pop().unwrap(), expected_event);
    }
}

pub fn set_invitation_lock(
    who: &<Runtime as frame_system::Config>::AccountId,
    amount: Balance<Runtime>,
) {
    <Runtime as membership::Config>::InvitedMemberStakingHandler::lock_with_reasons(
        who,
        amount,
        WithdrawReasons::except(WithdrawReasons::TRANSACTION_PAYMENT),
    );
}
