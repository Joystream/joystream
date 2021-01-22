#![cfg(test)]

pub use frame_system;

use frame_support::traits::{LockIdentifier, OnFinalize, OnInitialize};
use frame_support::{impl_outer_event, impl_outer_origin, parameter_types, weights::Weight};
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    DispatchResult, Perbill,
};

use crate::CouncilOriginValidator;
use crate::MemberOriginValidator;
use crate::WeightInfo;
use frame_support::dispatch::DispatchError;

use staking_handler::LockComparator;

impl_outer_origin! {
    pub enum Origin for Test {}
}

// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Test;
parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
}

parameter_types! {
    pub const ThreadTitleLengthLimit: u32 = 200;
    pub const PostLengthLimit: u32 = 2000;
}

mod discussion {
    pub use crate::Event;
}

mod membership_mod {
    pub use membership::Event;
}

impl_outer_event! {
    pub enum TestEvent for Test {
        discussion<T>,
        balances<T>,
        membership_mod<T>,
        frame_system<T>,
    }
}

parameter_types! {
    pub const ExistentialDeposit: u32 = 0;
    pub const TransferFee: u32 = 0;
    pub const CreationFee: u32 = 0;
    pub const MaxWhiteListSize: u32 = 4;
    pub const DefaultMembershipPrice: u64 = 100;
    pub const DefaultInitialInvitationBalance: u64 = 100;
    pub const InvitedMemberLockId: [u8; 8] = [2; 8];
}

// Weights info stub
pub struct Weights;
impl membership::WeightInfo for Weights {
    fn buy_membership_without_referrer(_: u32) -> Weight {
        unimplemented!()
    }
    fn buy_membership_with_referrer(_: u32) -> Weight {
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
    fn invite_member(_: u32) -> Weight {
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

impl balances::Trait for Test {
    type Balance = u64;
    type DustRemoval = ();
    type Event = TestEvent;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type WeightInfo = ();
    type MaxLocks = ();
}

impl common::Trait for Test {
    type MemberId = u64;
    type ActorId = u64;
}

impl membership::Trait for Test {
    type Event = TestEvent;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type WorkingGroup = ();
    type WeightInfo = Weights;
    type DefaultInitialInvitationBalance = ();
    type InvitedMemberStakingHandler = staking_handler::StakingManager<Self, InvitedMemberLockId>;
}

impl LockComparator<<Test as balances::Trait>::Balance> for Test {
    fn are_locks_conflicting(
        _new_lock: &LockIdentifier,
        _existing_locks: &[LockIdentifier],
    ) -> bool {
        false
    }
}

impl common::working_group::WorkingGroupBudgetHandler<Test> for () {
    fn get_budget() -> u64 {
        unimplemented!()
    }

    fn set_budget(_new_value: u64) {
        unimplemented!()
    }
}

impl common::working_group::WorkingGroupAuthenticator<Test> for () {
    fn ensure_worker_origin(
        _origin: <Test as frame_system::Trait>::Origin,
        _worker_id: &<Test as common::Trait>::ActorId,
    ) -> DispatchResult {
        unimplemented!();
    }

    fn ensure_leader_origin(_origin: <Test as frame_system::Trait>::Origin) -> DispatchResult {
        unimplemented!()
    }

    fn get_leader_member_id() -> Option<<Test as common::Trait>::MemberId> {
        unimplemented!();
    }

    fn is_leader_account_id(_account_id: &<Test as frame_system::Trait>::AccountId) -> bool {
        unimplemented!()
    }

    fn is_worker_account_id(
        _account_id: &<Test as frame_system::Trait>::AccountId,
        _worker_id: &<Test as common::Trait>::ActorId,
    ) -> bool {
        unimplemented!()
    }
}

impl crate::Trait for Test {
    type Event = TestEvent;
    type AuthorOriginValidator = ();
    type CouncilOriginValidator = CouncilMock;
    type ThreadId = u64;
    type PostId = u64;
    type MaxWhiteListSize = MaxWhiteListSize;
    type WeightInfo = ();
}

impl WeightInfo for () {
    fn add_post(_: u32) -> Weight {
        0
    }

    fn update_post() -> Weight {
        0
    }

    fn change_thread_mode(_: u32) -> Weight {
        0
    }
}

impl MemberOriginValidator<Origin, u64, u64> for () {
    fn ensure_member_controller_account_origin(
        origin: Origin,
        actor_id: u64,
    ) -> Result<u64, DispatchError> {
        if frame_system::ensure_none(origin.clone()).is_ok() {
            return Ok(1);
        }

        if actor_id == 1 {
            return Ok(1);
        }

        if actor_id == 2 {
            return Ok(2);
        }

        if actor_id == 11 {
            return Ok(11);
        }

        if actor_id == 12 && frame_system::ensure_signed(origin).unwrap_or_default() == 12 {
            return Ok(12);
        }

        Err(DispatchError::Other("Invalid author"))
    }

    fn is_member_controller_account(_member_id: &u64, _account_id: &u64) -> bool {
        unimplemented!()
    }
}

pub struct CouncilMock;
impl CouncilOriginValidator<Origin, u64, u64> for CouncilMock {
    fn ensure_member_consulate(origin: Origin, actor_id: u64) -> DispatchResult {
        if actor_id == 2 && frame_system::ensure_signed(origin).unwrap_or_default() == 2 {
            return Ok(());
        }

        Err(DispatchError::Other("Not a council"))
    }
}

impl frame_system::Trait for Test {
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

impl pallet_timestamp::Trait for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

pub fn initial_test_ext() -> sp_io::TestExternalities {
    let t = frame_system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    t.into()
}

pub type Discussions = crate::Module<Test>;
pub type System = frame_system::Module<Test>;

// Recommendation from Parity on testing on_finalize
// https://substrate.dev/docs/en/next/development/module/tests
pub fn run_to_block(n: u64) {
    while System::block_number() < n {
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        <Discussions as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
        <Discussions as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}
