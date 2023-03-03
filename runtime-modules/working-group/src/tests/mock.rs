use frame_support::parameter_types;
use frame_support::traits::{ConstU16, ConstU32, ConstU64, LockIdentifier};
use frame_support::traits::{OnFinalize, OnInitialize};

use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
};
use staking_handler::LockComparator;
use std::convert::{TryFrom, TryInto};

use crate as working_group;
use crate::{Config, Module};
use frame_support::dispatch::DispatchError;

parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MinimumPeriod: u64 = 5;
    pub const ExistentialDeposit: u32 = 10;
    pub const DefaultMembershipPrice: u64 = 0;
    pub const DefaultInitialInvitationBalance: u64 = 100;
    pub const DefaultMemberInvitesCount: u32 = 2;
    pub const InvitedMemberLockId: [u8; 8] = [2; 8];
    pub const ReferralCutMaximumPercent: u8 = 50;
    pub const StakingCandidateLockId: [u8; 8] = [3; 8];
    pub const CandidateStake: u64 = 100;
}

type UncheckedExtrinsic = frame_system::mocking::MockUncheckedExtrinsic<Test>;
type Block = frame_system::mocking::MockBlock<Test>;

frame_support::construct_runtime!(
    pub enum Test where
        Block = Block,
        NodeBlock = Block,
        UncheckedExtrinsic = UncheckedExtrinsic,
    {
        System: frame_system,
        Balances: balances,
        Membership: membership::{Pallet, Call, Storage, Event<T>},
        Timestamp: pallet_timestamp,
        TestWorkingGroup: working_group::{Pallet, Call, Storage, Event<T>},
    }
);

impl frame_system::Config for Test {
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

impl pallet_timestamp::Config for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

impl balances::Config for Test {
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

impl common::membership::MembershipTypes for Test {
    type MemberId = u64;
    type ActorId = u64;
}

impl membership::Config for Test {
    type RuntimeEvent = RuntimeEvent;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type WorkingGroup = Module<Test>;
    type WeightInfo = ();
    type DefaultInitialInvitationBalance = ();
    type InvitedMemberStakingHandler = staking_handler::StakingManager<Self, InvitedMemberLockId>;
    type ReferralCutMaximumPercent = ReferralCutMaximumPercent;
    type StakingCandidateStakingHandler =
        staking_handler::StakingManager<Self, StakingCandidateLockId>;
    type CandidateStake = CandidateStake;
    type DefaultMemberInvitesCount = DefaultMemberInvitesCount;
}

impl LockComparator<<Test as balances::Config>::Balance> for Test {
    fn are_locks_conflicting(new_lock: &LockIdentifier, existing_locks: &[LockIdentifier]) -> bool {
        existing_locks.to_vec().contains(new_lock)
    }
}

parameter_types! {
    pub const RewardPeriod: u32 = 2;
    pub const MaxWorkerNumberLimit: u32 = 3;
    pub const MinUnstakingPeriodLimit: u64 = 3;
    pub const MinimumApplicationStake: u64 = 50;
    pub const LockId: [u8; 8] = [1; 8];
    pub const LeaderOpeningStake: u64 = 20;
}

impl Config for Test {
    type RuntimeEvent = RuntimeEvent;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = staking_handler::StakingManager<Self, LockId>;
    type StakingAccountValidator = ();
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = RewardPeriod;
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl common::StakingAccountValidator<Test> for () {
    fn is_member_staking_account(_: &u64, account_id: &u64) -> bool {
        *account_id != STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER
    }
}

pub const ACTOR_ORIGIN_ERROR: &str = "Invalid membership";

impl common::membership::MemberOriginValidator<Origin, u64, u64> for () {
    fn ensure_member_controller_account_origin(
        origin: Origin,
        member_id: u64,
    ) -> Result<u64, DispatchError> {
        let signed_account_id = frame_system::ensure_signed(origin)?;

        if member_id > 10 {
            return Err(DispatchError::Other(ACTOR_ORIGIN_ERROR));
        }

        Ok(signed_account_id)
    }

    fn is_member_controller_account(_member_id: &u64, _account_id: &u64) -> bool {
        unimplemented!()
    }
}

pub const DEFAULT_WORKER_ACCOUNT_ID: u64 = 2;
pub const STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER: u64 = 222;
pub const STAKING_ACCOUNT_ID_FOR_CONFLICTING_STAKES: u64 = 333;

pub fn build_test_externalities() -> sp_io::TestExternalities {
    let t = frame_system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    t.into()
}

// Recommendation from Parity on testing on_finalize
// https://substrate.dev/docs/en/next/development/module/tests
pub fn run_to_block(n: u64) {
    while System::block_number() < n {
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        <TestWorkingGroup as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
        <TestWorkingGroup as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}
