#![cfg(test)]

use frame_support::dispatch::{DispatchError, DispatchResult};
pub use frame_support::traits::LockIdentifier;
use frame_support::weights::Weight;
use frame_support::{ensure, impl_outer_event, impl_outer_origin, parameter_types};
use frame_system::ensure_signed;
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    ModuleId, Perbill,
};
use sp_std::cell::RefCell;
use staking_handler::LockComparator;

// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Test;

impl_outer_origin! {
    pub enum Origin for Test {}
}

mod storage {
    pub use crate::Event;
}

mod membership_mod {
    pub use membership::Event;
}

impl_outer_event! {
    pub enum TestEvent for Test {
        balances<T>,
        storage<T>,
        frame_system<T>,
        membership_mod<T>,
        working_group Instance2 <T>,
        working_group Instance9 <T>,
    }
}

parameter_types! {
    pub const ExistentialDeposit: u32 = 0;
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

parameter_types! {
    pub const MaxDistributionBucketFamilyNumber: u64 = 80;
    pub const DataObjectDeletionPrize: u64 = 10;
    pub const StorageModuleId: ModuleId = ModuleId(*b"mstorage"); // module storage
    pub const BlacklistSizeLimit: u64 = 200;
    pub const MaxNumberOfPendingInvitationsPerDistributionBucket: u64 = 1;
    pub const StorageBucketsPerBagValueConstraint: crate::StorageBucketsPerBagValueConstraint =
        crate::StorageBucketsPerBagValueConstraint {min: 3, max_min_diff: 7};
    pub const InitialStorageBucketsNumberForDynamicBag: u64 = 3;
    pub const MaxRandomIterationNumber: u64 = 3;
    pub const DefaultMemberDynamicBagNumberOfStorageBuckets: u64 = 3;
    pub const DefaultChannelDynamicBagNumberOfStorageBuckets: u64 = 4;
    pub const DistributionBucketsPerBagValueConstraint: crate::DistributionBucketsPerBagValueConstraint =
        crate::StorageBucketsPerBagValueConstraint {min: 3, max_min_diff: 7};
    pub const MaxDataObjectSize: u64 = 400;
}

pub const STORAGE_WG_LEADER_ACCOUNT_ID: u64 = 100001;
pub const DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID: u64 = 100002;
pub const DEFAULT_BENCHMARKING_STORAGE_PROVIDER_ACCOUNT_ID: u64 = 1;
pub const DEFAULT_BENCHMARKING_DISTRIBUTION_PROVIDER_ACCOUNT_ID1: u64 = 100003;
pub const DEFAULT_BENCHMARKING_DISTRIBUTION_PROVIDER_ACCOUNT_ID2: u64 = 100004;
pub const DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID: u64 = 100003;
pub const DISTRIBUTION_WG_LEADER_ACCOUNT_ID: u64 = 100004;
pub const DEFAULT_STORAGE_PROVIDER_ID: u64 = 10;
pub const ANOTHER_STORAGE_PROVIDER_ID: u64 = 11;
pub const BENCHMARKING_STORAGE_PROVIDER_ID1: u64 = 0;
pub const BENCHMARKING_STORAGE_PROVIDER_ID2: u64 = 1;
pub const BENCHMARKING_DISTRIBUTION_PROVIDER_ID1: u64 = 0;
pub const BENCHMARKING_DISTRIBUTION_PROVIDER_ID2: u64 = 1;
pub const DEFAULT_DISTRIBUTION_PROVIDER_ID: u64 = 12;
pub const ANOTHER_DISTRIBUTION_PROVIDER_ID: u64 = 13;
pub const INITIAL_BALANCE: u64 = 10_000;
pub const BAG_DELETION_PRIZE_VALUE: u64 = 100;
pub const VOUCHER_SIZE_LIMIT: u64 = 100;
pub const VOUCHER_OBJECTS_LIMIT: u64 = 20;
pub const DEFAULT_STORAGE_BUCKET_SIZE_LIMIT: u64 = 100;
pub const DEFAULT_STORAGE_BUCKET_OBJECTS_LIMIT: u64 = 10;
pub const DEFAULT_STORAGE_BUCKETS_NUMBER: u64 = 10;

impl crate::Trait for Test {
    type Event = TestEvent;
    type DataObjectId = u64;
    type StorageBucketId = u64;
    type DistributionBucketIndex = u64;
    type DistributionBucketFamilyId = u64;
    type DistributionBucketOperatorId = u64;
    type ChannelId = u64;
    type DataObjectDeletionPrize = DataObjectDeletionPrize;
    type BlacklistSizeLimit = BlacklistSizeLimit;
    type ModuleId = StorageModuleId;
    type StorageBucketsPerBagValueConstraint = StorageBucketsPerBagValueConstraint;
    type DefaultMemberDynamicBagNumberOfStorageBuckets =
        DefaultMemberDynamicBagNumberOfStorageBuckets;
    type DefaultChannelDynamicBagNumberOfStorageBuckets =
        DefaultChannelDynamicBagNumberOfStorageBuckets;
    type Randomness = CollectiveFlip;
    type MaxRandomIterationNumber = MaxRandomIterationNumber;
    type MaxDistributionBucketFamilyNumber = MaxDistributionBucketFamilyNumber;
    type DistributionBucketsPerBagValueConstraint = DistributionBucketsPerBagValueConstraint;
    type MaxNumberOfPendingInvitationsPerDistributionBucket =
        MaxNumberOfPendingInvitationsPerDistributionBucket;
    type MaxDataObjectSize = MaxDataObjectSize;
    type ContentId = u64;

    fn ensure_storage_working_group_leader_origin(origin: Self::Origin) -> DispatchResult {
        let account_id = ensure_signed(origin)?;

        if account_id != STORAGE_WG_LEADER_ACCOUNT_ID {
            Err(DispatchError::BadOrigin)
        } else {
            Ok(())
        }
    }

    fn ensure_storage_worker_origin(origin: Self::Origin, _: u64) -> DispatchResult {
        let account_id = ensure_signed(origin)?;

        let allowed_accounts = vec![
            DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID,
            DEFAULT_BENCHMARKING_STORAGE_PROVIDER_ACCOUNT_ID,
        ];

        if !allowed_accounts.contains(&account_id) {
            Err(DispatchError::BadOrigin)
        } else {
            Ok(())
        }
    }

    fn ensure_storage_worker_exists(worker_id: &u64) -> DispatchResult {
        let allowed_storage_providers = vec![
            DEFAULT_STORAGE_PROVIDER_ID,
            ANOTHER_STORAGE_PROVIDER_ID,
            BENCHMARKING_STORAGE_PROVIDER_ID1,
            BENCHMARKING_STORAGE_PROVIDER_ID2,
        ];

        if !allowed_storage_providers.contains(worker_id) {
            Err(DispatchError::Other("Invalid worker"))
        } else {
            Ok(())
        }
    }

    fn ensure_distribution_working_group_leader_origin(origin: Self::Origin) -> DispatchResult {
        let account_id = ensure_signed(origin)?;

        let allowed_providers = vec![
            DISTRIBUTION_WG_LEADER_ACCOUNT_ID,
            DEFAULT_BENCHMARKING_DISTRIBUTION_PROVIDER_ACCOUNT_ID1,
            DEFAULT_BENCHMARKING_DISTRIBUTION_PROVIDER_ACCOUNT_ID2,
        ];

        if !allowed_providers.contains(&account_id) {
            Err(DispatchError::BadOrigin)
        } else {
            Ok(())
        }
    }

    fn ensure_distribution_worker_origin(origin: Self::Origin, _: u64) -> DispatchResult {
        let account_id = ensure_signed(origin)?;

        let allowed_accounts = vec![
            DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID,
            DEFAULT_BENCHMARKING_DISTRIBUTION_PROVIDER_ACCOUNT_ID1,
            DEFAULT_BENCHMARKING_DISTRIBUTION_PROVIDER_ACCOUNT_ID2,
        ];

        if !allowed_accounts.contains(&account_id) {
            Err(DispatchError::BadOrigin)
        } else {
            Ok(())
        }
    }

    fn ensure_distribution_worker_exists(worker_id: &u64) -> DispatchResult {
        let allowed_providers = vec![
            DEFAULT_DISTRIBUTION_PROVIDER_ID,
            ANOTHER_DISTRIBUTION_PROVIDER_ID,
            BENCHMARKING_DISTRIBUTION_PROVIDER_ID1,
            BENCHMARKING_DISTRIBUTION_PROVIDER_ID2,
        ];

        if !allowed_providers.contains(worker_id) {
            Err(DispatchError::Other("Invalid worker"))
        } else {
            Ok(())
        }
    }

    type WeightInfo = ();
}

pub const DEFAULT_MEMBER_ID: u64 = 100;
pub const DEFAULT_MEMBER_ACCOUNT_ID: u64 = 101;

parameter_types! {
    pub const ScreenedMemberMaxInitialBalance: u64 = 5000;
}

impl common::MembershipTypes for Test {
    type MemberId = u64;
    type ActorId = u64;
}

impl pallet_timestamp::Trait for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

impl common::currency::GovernanceCurrency for Test {
    type Currency = balances::Module<Self>;
}

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
    type AccountData = balances::AccountData<u64>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type PalletInfo = ();
    type SystemWeightInfo = ();
}

parameter_types! {
    pub const MaxWorkerNumberLimit: u32 = 3;
    pub const LockId: [u8; 8] = [9; 8];
    pub const LockId2: [u8; 8] = [10; 8];
    pub const MinimumApplicationStake: u32 = 50;
    pub const LeaderOpeningStake: u32 = 20;
}

// The storage working group instance alias.
pub type StorageWorkingGroupInstance = working_group::Instance2;

impl working_group::Trait<StorageWorkingGroupInstance> for Test {
    type Event = TestEvent;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingAccountValidator = membership::Module<Test>;
    type StakingHandler = staking_handler::StakingManager<Self, LockId>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = Weights;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}
// The distribution working group instance alias.
pub type DistributionWorkingGroupInstance = working_group::Instance9;

impl working_group::Trait<DistributionWorkingGroupInstance> for Test {
    type Event = TestEvent;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingAccountValidator = membership::Module<Test>;
    type StakingHandler = staking_handler::StakingManager<Self, LockId2>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = Weights;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl common::membership::MemberOriginValidator<Origin, u64, u64> for () {
    fn ensure_member_controller_account_origin(
        origin: Origin,
        member_id: u64,
    ) -> Result<u64, DispatchError> {
        let account_id = ensure_signed(origin).unwrap();
        ensure!(
            Self::is_member_controller_account(&member_id, &account_id),
            DispatchError::BadOrigin
        );
        Ok(account_id)
    }

    fn is_member_controller_account(_member_id: &u64, _account_id: &u64) -> bool {
        return true;
    }
}

pub const WORKING_GROUP_BUDGET: u64 = 100;

thread_local! {
    pub static WG_BUDGET: RefCell<u64> = RefCell::new(WORKING_GROUP_BUDGET);
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
        _origin: <Test as frame_system::Trait>::Origin,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        unimplemented!()
    }

    fn ensure_leader_origin(_origin: <Test as frame_system::Trait>::Origin) -> DispatchResult {
        unimplemented!()
    }

    fn get_leader_member_id() -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn is_leader_account_id(_account_id: &<Test as frame_system::Trait>::AccountId) -> bool {
        true
    }

    fn is_worker_account_id(
        _account_id: &<Test as frame_system::Trait>::AccountId,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> bool {
        true
    }

    fn worker_exists(_worker_id: &<Test as common::membership::MembershipTypes>::ActorId) -> bool {
        unimplemented!();
    }

    fn ensure_worker_exists(
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        unimplemented!();
    }
}

impl LockComparator<<Test as balances::Trait>::Balance> for Test {
    fn are_locks_conflicting(
        _new_lock: &LockIdentifier,
        _existing_locks: &[LockIdentifier],
    ) -> bool {
        false
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

impl membership::Trait for Test {
    type Event = TestEvent;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type DefaultInitialInvitationBalance = DefaultInitialInvitationBalance;
    type WorkingGroup = ();
    type WeightInfo = Weights;
    type InvitedMemberStakingHandler = staking_handler::StakingManager<Self, InviteMemberLockId>;
    type ReferralCutMaximumPercent = ReferralCutMaximumPercent;
    type StakingCandidateStakingHandler =
        staking_handler::StakingManager<Self, StakingCandidateLockId>;
    type CandidateStake = CandidateStake;
}

parameter_types! {
    pub const ReferralCutMaximumPercent: u8 = 50;
    pub const PostDeposit: u64 = 10;
    pub const CandidateStake: u64 = 100;
    pub const StakingCandidateLockId: [u8; 8] = [10; 8];
    pub const InviteMemberLockId: [u8; 8] = [9; 8];
    pub const DefaultMembershipPrice: u64 = 100;
    pub const DefaultInitialInvitationBalance: u64 = 100;
}

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

pub fn build_test_externalities() -> sp_io::TestExternalities {
    let t = frame_system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    t.into()
}

pub type Storage = crate::Module<Test>;
pub type System = frame_system::Module<Test>;
pub type Balances = balances::Module<Test>;
pub type CollectiveFlip = randomness_collective_flip::Module<Test>;
