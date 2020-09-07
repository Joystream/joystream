#![cfg(test)]

/////////////////// Configuration //////////////////////////////////////////////
use crate::{
    CouncilMembers, CouncilStage, CouncilStageInfo, Error, EzCandidate, EzCouncilStageAnnouncing,
    EzCouncilStageElection, EzCouncilStageInfo, GenesisConfig, Module, Stage, Trait,
};

use frame_support::traits::{Currency, LockIdentifier, OnFinalize};
use frame_support::{impl_outer_event, impl_outer_origin, parameter_types, StorageValue};
use pallet_balances;
use rand::Rng;
use referendum::{
    Balance, CastVote, CurrentCycleId, ReferendumManager, ReferendumStage, ReferendumStageRevealing,
};
use sp_core::H256;
use sp_io;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};
use std::cell::RefCell;
use std::marker::PhantomData;
use system::{EnsureOneOf, EnsureRoot, EnsureSigned, RawOrigin};

pub const USER_REGULAR_POWER_VOTES: u64 = 0;

pub const POWER_VOTE_STRENGTH: u64 = 10;

pub const VOTER_BASE_ID: u64 = 4000;
pub const CANDIDATE_BASE_ID: u64 = 5000;

/////////////////// Runtime and Instances //////////////////////////////////////
// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Runtime;

parameter_types! {
    pub const MinNumberOfExtraCandidates: u64 = 1;
    pub const AnnouncingPeriodDuration: u64 = 15;
    pub const IdlePeriodDuration: u64 = 15;
    pub const CouncilSize: u64 = 3;
    pub const MinCandidateStake: u64 = 10;
    pub const CouncilLockId: LockIdentifier = *b"council_";
}

impl Trait for Runtime {
    type Event = TestEvent;

    type LockId = CouncilLockId;
    type MinNumberOfExtraCandidates = MinNumberOfExtraCandidates;
    type CouncilSize = CouncilSize;
    type AnnouncingPeriodDuration = AnnouncingPeriodDuration;
    type IdlePeriodDuration = IdlePeriodDuration;
    type MinCandidateStake = MinCandidateStake;
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

mod balances_mod {
    pub use pallet_balances::Event;
}

impl_outer_event! {
    pub enum TestEvent for Runtime {
        event_mod<T>,
        referendum_mod Instance0 <T>,
        balances_mod<T>,
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
    type AccountData = pallet_balances::AccountData<u64>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
}

/////////////////// Election module ////////////////////////////////////////////

type ReferendumInstance = referendum::Instance0;

thread_local! {
    pub static IS_UNSTAKE_ENABLED: RefCell<(bool, )> = RefCell::new((true, )); // global switch for stake locking features; use it to simulate lock fails
}

parameter_types! {
    pub const MaxReferendumOptions: u64 = 10;
    pub const VoteStageDuration: u64 = 15;
    pub const RevealStageDuration: u64 = 15;
    pub const MinimumStake: u64 = 10000;
    pub const MaxSaltLength: u64 = 32; // use some multiple of 8 for ez testing
    pub const ReferendumLockId: LockIdentifier = *b"referend";
}

impl referendum::Trait<ReferendumInstance> for Runtime {
    type Event = TestEvent;

    type MaxReferendumOptions = MaxReferendumOptions;
    type MaxSaltLength = MaxSaltLength;

    type Currency = pallet_balances::Module<Runtime>;
    type LockId = ReferendumLockId;

    type ManagerOrigin =
        EnsureOneOf<Self::AccountId, EnsureSigned<Self::AccountId>, EnsureRoot<Self::AccountId>>;

    type VotePower = u64;

    type VoteStageDuration = VoteStageDuration;
    type RevealStageDuration = RevealStageDuration;

    type MinimumStake = MinimumStake;

    fn caclulate_vote_power(
        account_id: &<Self as system::Trait>::AccountId,
        stake: &Balance<Self, ReferendumInstance>,
    ) -> <Self as referendum::Trait<ReferendumInstance>>::VotePower {
        let stake: u64 = u64::from(*stake);
        if *account_id == USER_REGULAR_POWER_VOTES {
            return stake * POWER_VOTE_STRENGTH;
        }

        stake
    }

    fn can_unstake(_vote: &CastVote<Self::Hash, Balance<Self, ReferendumInstance>>) -> bool {
        // trigger fail when requested to do so
        if !IS_UNSTAKE_ENABLED.with(|value| value.borrow().0) {
            return false;
        }

        true
    }

    fn process_results(all_options_results: &[Self::VotePower]) {
        let origin = InstanceMockUtils::<Self>::mock_origin(OriginType::Root);

        <Module<Self>>::recieve_referendum_results(origin, all_options_results.to_vec()).unwrap();
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
        stage: CouncilStageInfo::default(),
        council_members: vec![],
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
    T::BlockNumber: From<u64> + Into<u64>,
    Balance<T, ReferendumInstance>: From<u64> + Into<u64>,
{
    pub fn mock_origin(origin: OriginType<T::AccountId>) -> T::Origin {
        match origin {
            OriginType::Signed(account_id) => T::Origin::from(RawOrigin::Signed(account_id)),
            OriginType::Root => RawOrigin::Root.into(),
            //_ => panic!("not implemented"),
        }
    }

    pub fn increase_block_number(increase: u64) -> () {
        let block_number = system::Module::<T>::block_number();

        for i in 0..increase {
            let tmp_index: T::BlockNumber = block_number + i.into();

            <Module<T> as OnFinalize<T::BlockNumber>>::on_finalize(tmp_index);
            <referendum::Module<T, ReferendumInstance> as OnFinalize<T::BlockNumber>>::on_finalize(
                tmp_index,
            );
            system::Module::<T>::set_block_number(tmp_index + 1.into());
        }
    }

    // topup currency to the account
    fn topup_account(account_id: u64, amount: Balance<T, ReferendumInstance>) {
        let _ = pallet_balances::Module::<Runtime>::deposit_creating(&account_id, amount.into());
    }

    pub fn generate_candidate(
        index: u64,
        stake: Balance<T, ReferendumInstance>,
    ) -> (OriginType<T::AccountId>, EzCandidate<T>) {
        let account_id = CANDIDATE_BASE_ID + index;
        let origin = OriginType::Signed(account_id.into());
        let candidate = EzCandidate::<T> {
            account_id: account_id.into(),
            stake,
        };

        Self::topup_account(account_id.into(), stake);

        (origin, candidate)
    }

    pub fn generate_voter(
        index: u64,
        balance: Balance<T, ReferendumInstance>,
        vote_for_index: u64,
    ) -> (OriginType<T::AccountId>, T::Hash, Vec<u8>) {
        let account_id = VOTER_BASE_ID + index;
        let origin = OriginType::Signed(account_id.into());
        let (commitment, salt) = Self::vote_commitment(&account_id.into(), &vote_for_index.into());

        Self::topup_account(account_id.into(), balance);

        (origin, commitment, salt)
    }

    pub fn generate_salt() -> Vec<u8> {
        let mut rng = rand::thread_rng();

        rng.gen::<u64>().to_be_bytes().to_vec()
    }

    pub fn vote_commitment(
        account_id: &<T as system::Trait>::AccountId,
        vote_option_index: &u64,
    ) -> (T::Hash, Vec<u8>) {
        let cycle_id = CurrentCycleId::<ReferendumInstance>::get();
        let salt = Self::generate_salt();

        (
            <referendum::Module<T, ReferendumInstance> as ReferendumManager<
                T,
                ReferendumInstance,
            >>::calculate_commitment(account_id, &salt, &cycle_id, vote_option_index),
            salt.to_vec(),
        )
    }
}

/////////////////// Mocks of Module's actions //////////////////////////////////

pub struct InstanceMocks<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> InstanceMocks<T>
where
    T::AccountId: From<u64>,
    T::BlockNumber: From<u64> + Into<u64>,
    Balance<T, ReferendumInstance>: From<u64> + Into<u64>,
{
    pub fn check_announcing_period(
        expected_update_block_number: T::BlockNumber,
        expected_state: EzCouncilStageAnnouncing<T>,
    ) -> () {
        // check stage is in proper state
        assert_eq!(
            Stage::<T>::get(),
            EzCouncilStageInfo::<T> {
                stage: CouncilStage::Announcing(expected_state),
                changed_at: expected_update_block_number,
            },
        );
    }

    pub fn check_election_period(
        expected_update_block_number: T::BlockNumber,
        expected_state: EzCouncilStageElection<T>,
    ) -> () {
        // check stage is in proper state
        assert_eq!(
            Stage::<T>::get(),
            EzCouncilStageInfo::<T> {
                stage: CouncilStage::Election(expected_state),
                changed_at: expected_update_block_number,
            },
        );
    }

    pub fn check_idle_period(expected_update_block_number: T::BlockNumber) -> () {
        // check stage is in proper state
        assert_eq!(
            Stage::<T>::get(),
            EzCouncilStageInfo::<T> {
                stage: CouncilStage::Idle,
                changed_at: expected_update_block_number,
            },
        );
    }

    pub fn check_council_members(expect_members: Vec<EzCandidate<T>>) -> () {
        // check stage is in proper state
        assert_eq!(CouncilMembers::<T>::get(), expect_members,);
    }

    pub fn check_referendum_revealing(
        candidate_count: u64,
        expected_update_block_number: T::BlockNumber,
    ) {
        // check stage is in proper state
        assert_eq!(
            referendum::Stage::<T, ReferendumInstance>::get(),
            ReferendumStage::Revealing(ReferendumStageRevealing {
                started: expected_update_block_number,
                intermediate_results: (0..candidate_count).map(|_| 0.into()).collect(),
            }),
        );
    }

    pub fn candidate(
        origin: OriginType<T::AccountId>,
        stake: Balance<T, ReferendumInstance>,
        expected_result: Result<(), Error<T>>,
    ) {
        // check method returns expected result
        assert_eq!(
            Module::<T>::candidate(InstanceMockUtils::<T>::mock_origin(origin), stake),
            expected_result,
        );
    }

    pub fn vote_for_candidate(
        origin: OriginType<T::AccountId>,
        commitment: T::Hash,
        stake: Balance<T, ReferendumInstance>,
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
        vote_option: u64,
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
}
