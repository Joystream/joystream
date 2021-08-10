use frame_support::parameter_types;
use frame_support::traits::LockIdentifier;
use frame_support::traits::{OnFinalize, OnInitialize};
use frame_support::weights::Weight;
use frame_system;
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
};
use staking_handler::LockComparator;

use crate as working_group;
use crate::{Config, Module};
use frame_support::dispatch::DispatchError;

parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MinimumPeriod: u64 = 5;
    pub const ExistentialDeposit: u32 = 10;
    pub const DefaultMembershipPrice: u64 = 0;
    pub const DefaultInitialInvitationBalance: u64 = 100;
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
        System: frame_system::{Module, Call, Storage, Event<T>},
        Balances: balances::{Module, Call, Storage, Config<T>, Event<T>},
        Membership: membership::{Module, Call, Storage, Event<T>},
        Timestamp: pallet_timestamp::{Module, Call, Storage, Inherent},
        TestWorkingGroup: working_group::{Module, Call, Storage, Event<T>},
    }
);

impl frame_system::Config for Test {
    type BaseCallFilter = ();
    type BlockWeights = ();
    type BlockLength = ();
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
    type BlockHashCount = BlockHashCount;
    type DbWeight = ();
    type Version = ();
    type AccountData = balances::AccountData<u64>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type PalletInfo = PalletInfo;
    type SystemWeightInfo = ();
    type SS58Prefix = ();
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
    type Event = Event;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type WeightInfo = ();
    type MaxLocks = ();
}

impl common::membership::Config for Test {
    type MemberId = u64;
    type ActorId = u64;
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

impl membership::Config for Test {
    type Event = Event;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type WorkingGroup = Module<Test>;
    type WeightInfo = Weights;
    type DefaultInitialInvitationBalance = ();
    type InvitedMemberStakingHandler = staking_handler::StakingManager<Self, InvitedMemberLockId>;
    type ReferralCutMaximumPercent = ReferralCutMaximumPercent;
    type StakingCandidateStakingHandler =
        staking_handler::StakingManager<Self, StakingCandidateLockId>;
    type CandidateStake = CandidateStake;
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
    type Event = Event;
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

impl crate::WeightInfo for () {
    fn on_initialize_leaving(_: u32) -> Weight {
        0
    }
    fn on_initialize_rewarding_with_missing_reward(_: u32) -> Weight {
        0
    }
    fn on_initialize_rewarding_with_missing_reward_cant_pay(_: u32) -> Weight {
        0
    }
    fn on_initialize_rewarding_without_missing_reward(_: u32) -> Weight {
        0
    }
    fn apply_on_opening(_: u32) -> Weight {
        0
    }
    fn fill_opening_lead() -> Weight {
        0
    }
    fn fill_opening_worker(_: u32) -> Weight {
        0
    }
    fn update_role_account() -> Weight {
        0
    }
    fn cancel_opening() -> Weight {
        0
    }
    fn withdraw_application() -> Weight {
        0
    }
    fn slash_stake(_: u32) -> Weight {
        0
    }
    fn terminate_role_worker(_: u32) -> Weight {
        0
    }
    fn terminate_role_lead(_: u32) -> Weight {
        0
    }
    fn increase_stake() -> Weight {
        0
    }
    fn decrease_stake() -> Weight {
        0
    }
    fn spend_from_budget() -> Weight {
        0
    }
    fn update_reward_amount() -> Weight {
        0
    }
    fn set_status_text(_: u32) -> Weight {
        0
    }
    fn update_reward_account() -> Weight {
        0
    }
    fn set_budget() -> Weight {
        0
    }
    fn add_opening(_: u32) -> Weight {
        0
    }
    fn leave_role(_: u32) -> Weight {
        0
    }
}

pub const ACTOR_ORIGIN_ERROR: &'static str = "Invalid membership";

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
