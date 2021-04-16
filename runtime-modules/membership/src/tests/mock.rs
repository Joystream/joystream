#![cfg(test)]

pub use crate::{GenesisConfig, Trait, Weight, WeightInfo};

pub use frame_support::traits::{Currency, LockIdentifier};
use frame_support::{impl_outer_event, impl_outer_origin, parameter_types};
use sp_std::cell::RefCell;
use staking_handler::LockComparator;

use crate::tests::fixtures::ALICE_MEMBER_ID;
pub use frame_system;
use frame_system::RawOrigin;
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    DispatchError, DispatchResult, Perbill,
};

pub(crate) type MembershipWorkingGroupInstance = working_group::Instance4;

impl_outer_origin! {
    pub enum Origin for Test {}
}

mod membership_mod {
    pub use crate::Event;
}

impl_outer_event! {
    pub enum TestEvent for Test {
        membership_mod<T>,
        frame_system<T>,
        balances<T>,
        working_group Instance4 <T>,
    }
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

parameter_types! {
    pub const ExistentialDeposit: u32 = 10;
    pub const DefaultMembershipPrice: u64 = 100;
    pub const InvitedMemberLockId: [u8; 8] = [2; 8];
    pub const StakingCandidateLockId: [u8; 8] = [3; 8];
    pub const CandidateStake: u64 = 100;
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

impl common::membership::Trait for Test {
    type MemberId = u64;
    type ActorId = u64;
}

parameter_types! {
    pub const MaxWorkerNumberLimit: u32 = 3;
    pub const LockId: LockIdentifier = [9; 8];
    pub const DefaultInitialInvitationBalance: u64 = 100;
    pub const ReferralCutMaximumPercent: u8 = 50;
    pub const MinimumStakeForOpening: u32 = 50;
    pub const MinimumApplicationStake: u32 = 50;
    pub const LeaderOpeningStake: u32 = 20;
}

impl working_group::Trait<MembershipWorkingGroupInstance> for Test {
    type Event = TestEvent;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = staking_handler::StakingManager<Self, LockId>;
    type StakingAccountValidator = Membership;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = Weights;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl LockComparator<u64> for Test {
    fn are_locks_conflicting(new_lock: &LockIdentifier, existing_locks: &[LockIdentifier]) -> bool {
        if *new_lock == InvitedMemberLockId::get() {
            existing_locks.contains(new_lock)
        } else {
            false
        }
    }
}

// Weights info stub
pub struct Weights;
impl working_group::WeightInfo for Weights {
    fn on_initialize_leaving(_: u32) -> u64 {
        unimplemented!()
    }

    fn on_initialize_rewarding_with_missing_reward(_: u32) -> u64 {
        unimplemented!()
    }

    fn on_initialize_rewarding_with_missing_reward_cant_pay(_: u32) -> u64 {
        unimplemented!()
    }

    fn on_initialize_rewarding_without_missing_reward(_: u32) -> u64 {
        unimplemented!()
    }

    fn apply_on_opening(_: u32) -> u64 {
        unimplemented!()
    }

    fn fill_opening_lead() -> u64 {
        unimplemented!()
    }

    fn fill_opening_worker(_: u32) -> u64 {
        unimplemented!()
    }

    fn update_role_account() -> u64 {
        unimplemented!()
    }

    fn cancel_opening() -> u64 {
        unimplemented!()
    }

    fn withdraw_application() -> u64 {
        unimplemented!()
    }

    fn slash_stake(_: u32) -> u64 {
        unimplemented!()
    }

    fn terminate_role_worker(_: u32) -> u64 {
        unimplemented!()
    }

    fn terminate_role_lead(_: u32) -> u64 {
        unimplemented!()
    }

    fn increase_stake() -> u64 {
        unimplemented!()
    }

    fn decrease_stake() -> u64 {
        unimplemented!()
    }

    fn spend_from_budget() -> u64 {
        unimplemented!()
    }

    fn update_reward_amount() -> u64 {
        unimplemented!()
    }

    fn set_status_text(_: u32) -> u64 {
        unimplemented!()
    }

    fn update_reward_account() -> u64 {
        unimplemented!()
    }

    fn set_budget() -> u64 {
        unimplemented!()
    }

    fn add_opening(_: u32) -> u64 {
        unimplemented!()
    }

    fn leave_role(_: u32) -> u64 {
        unimplemented!()
    }
}

impl WeightInfo for () {
    fn buy_membership_without_referrer(_: u32, _: u32) -> Weight {
        0
    }
    fn buy_membership_with_referrer(_: u32, _: u32) -> Weight {
        0
    }
    fn update_profile(_: u32) -> Weight {
        0
    }
    fn update_accounts_none() -> Weight {
        0
    }
    fn update_accounts_root() -> Weight {
        0
    }
    fn update_accounts_controller() -> Weight {
        0
    }
    fn update_accounts_both() -> Weight {
        0
    }
    fn set_referral_cut() -> Weight {
        0
    }
    fn transfer_invites() -> Weight {
        0
    }
    fn invite_member(_: u32, _: u32) -> Weight {
        0
    }
    fn set_membership_price() -> Weight {
        0
    }
    fn update_profile_verification() -> Weight {
        0
    }
    fn set_leader_invitation_quota() -> Weight {
        0
    }
    fn set_initial_invitation_balance() -> Weight {
        0
    }
    fn set_initial_invitation_count() -> Weight {
        0
    }
    fn add_staking_account_candidate() -> Weight {
        0
    }
    fn confirm_staking_account() -> Weight {
        0
    }
    fn remove_staking_account() -> Weight {
        0
    }
}

impl common::membership::MemberOriginValidator<Origin, u64, u64> for () {
    fn ensure_member_controller_account_origin(
        origin: Origin,
        _: u64,
    ) -> Result<u64, DispatchError> {
        let account_id = frame_system::ensure_signed(origin)?;

        Ok(account_id)
    }

    fn is_member_controller_account(_member_id: &u64, _account_id: &u64) -> bool {
        unimplemented!()
    }
}

impl Trait for Test {
    type Event = TestEvent;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type ReferralCutMaximumPercent = ReferralCutMaximumPercent;
    type WorkingGroup = ();
    type DefaultInitialInvitationBalance = DefaultInitialInvitationBalance;
    type InvitedMemberStakingHandler = staking_handler::StakingManager<Self, InvitedMemberLockId>;
    type StakingCandidateStakingHandler =
        staking_handler::StakingManager<Self, StakingCandidateLockId>;
    type CandidateStake = CandidateStake;
    type WeightInfo = ();
}

pub const WORKING_GROUP_BUDGET: u64 = 100;

thread_local! {
    pub static WG_BUDGET: RefCell<u64> = RefCell::new(WORKING_GROUP_BUDGET);
    pub static LEAD_SET: RefCell<bool> = RefCell::new(bool::default());
}

impl common::working_group::WorkingGroupBudgetHandler<Test> for () {
    fn get_budget() -> u64 {
        WG_BUDGET.with(|val| *val.borrow())
    }

    fn set_budget(new_value: u64) {
        WG_BUDGET.with(|val| {
            *val.borrow_mut() = new_value;
        });
    }
}

impl common::working_group::WorkingGroupAuthenticator<Test> for () {
    fn ensure_worker_origin(
        origin: <Test as frame_system::Trait>::Origin,
        worker_id: &<Test as common::membership::Trait>::ActorId,
    ) -> DispatchResult {
        let raw_origin: Result<RawOrigin<u64>, <Test as frame_system::Trait>::Origin> =
            origin.into();

        if let RawOrigin::Signed(_) = raw_origin.unwrap() {
            if *worker_id == 1 || *worker_id == 0 {
                Ok(())
            } else {
                Err(working_group::Error::<Test, MembershipWorkingGroupInstance>::WorkerDoesNotExist.into())
            }
        } else {
            Err(DispatchError::BadOrigin)
        }
    }

    fn ensure_leader_origin(_origin: <Test as frame_system::Trait>::Origin) -> DispatchResult {
        unimplemented!()
    }

    fn get_leader_member_id() -> Option<<Test as common::membership::Trait>::MemberId> {
        LEAD_SET.with(|lead_set| {
            if *lead_set.borrow() {
                Some(ALICE_MEMBER_ID)
            } else {
                None
            }
        })
    }

    fn is_leader_account_id(_account_id: &<Test as frame_system::Trait>::AccountId) -> bool {
        unimplemented!()
    }

    fn is_worker_account_id(
        _account_id: &<Test as frame_system::Trait>::AccountId,
        _worker_id: &<Test as common::membership::Trait>::ActorId,
    ) -> bool {
        unimplemented!()
    }
}

#[cfg(feature = "runtime-benchmarks")]
impl
    crate::MembershipWorkingGroupHelper<
        <Test as frame_system::Trait>::AccountId,
        <Test as common::membership::Trait>::MemberId,
        <Test as common::membership::Trait>::ActorId,
    > for Test
{
    fn insert_a_lead(
        _opening_id: u32,
        _caller_id: &<Test as frame_system::Trait>::AccountId,
        _member_id: <Test as common::membership::Trait>::MemberId,
    ) -> <Test as common::membership::Trait>::ActorId {
        ALICE_MEMBER_ID
    }
}

pub struct TestExternalitiesBuilder<T: Trait> {
    system_config: Option<frame_system::GenesisConfig>,
    membership_config: Option<GenesisConfig<T>>,
}

impl<T: Trait> Default for TestExternalitiesBuilder<T> {
    fn default() -> Self {
        Self {
            system_config: None,
            membership_config: None,
        }
    }
}

impl<T: Trait> TestExternalitiesBuilder<T> {
    pub fn set_membership_config(mut self, membership_config: GenesisConfig<T>) -> Self {
        self.membership_config = Some(membership_config);
        self
    }

    pub fn build(self) -> sp_io::TestExternalities {
        // Add system
        let mut t = self
            .system_config
            .unwrap_or(frame_system::GenesisConfig::default())
            .build_storage::<T>()
            .unwrap();

        // Add membership
        self.membership_config
            .unwrap_or(GenesisConfig::default())
            .assimilate_storage(&mut t)
            .unwrap();

        t.into()
    }

    pub fn with_lead(self) -> Self {
        LEAD_SET.with(|lead_set| {
            *lead_set.borrow_mut() = true;
        });

        self
    }
}

pub fn build_test_externalities() -> sp_io::TestExternalities {
    TestExternalitiesBuilder::<Test>::default().build()
}

pub fn build_test_externalities_with_initial_members(
    initial_members: Vec<(u64, u64)>,
) -> sp_io::TestExternalities {
    TestExternalitiesBuilder::<Test>::default()
        .set_membership_config(
            crate::genesis::GenesisConfigBuilder::default()
                .members(initial_members)
                .build(),
        )
        .with_lead()
        .build()
}

pub type Balances = balances::Module<Test>;
pub type Membership = crate::Module<Test>;
pub type System = frame_system::Module<Test>;
