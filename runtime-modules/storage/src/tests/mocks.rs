#![cfg(test)]

pub use frame_support::traits::LockIdentifier;

use frame_support::{
    ensure, parameter_types,
    traits::{ConstU16, ConstU32, ConstU64},
    PalletId,
};
use frame_system::ensure_signed;
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    DispatchError, DispatchResult, Perbill,
};
use sp_std::{
    cell::RefCell,
    convert::{TryFrom, TryInto},
};
use staking_handler::LockComparator;

parameter_types! {
    pub const ExistentialDeposit: u32 = 1;
}
parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
}

// The storage working group instance alias.
pub type StorageWorkingGroupInstance = working_group::Instance2;
// The distribution working group instance alias.
pub type DistributionWorkingGroupInstance = working_group::Instance9;

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
        CollectiveFlip: randomness_collective_flip,
        Timestamp: pallet_timestamp,
        Membership: membership::{Pallet, Call, Storage, Event<T>},
        Storage: crate::{Pallet, Call, Storage, Config<T>, Event<T>},
        // Need to be added for benchmarks to work
        Wg2: working_group::<Instance2>::{Pallet, Call, Storage, Event<T, I>},
        Wg9: working_group::<Instance9>::{Pallet, Call, Storage, Event<T, I>},
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
    type Event = Event;
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
    type Event = Event;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type MaxLocks = ();
    type MaxReserves = ConstU32<2>;
    type ReserveIdentifier = [u8; 8];
    type WeightInfo = ();
}

impl randomness_collective_flip::Config for Test {}

parameter_types! {
    pub const MaxDistributionBucketFamilyNumber: u64 = 80;
    pub const DataObjectStateBloatBond: u64 = 10;
    pub const StorageModuleId: PalletId = PalletId(*b"mstorage"); // module storage
    pub const BlacklistSizeLimit: u64 = 200;
    pub const MaxNumberOfPendingInvitationsPerDistributionBucket: u64 = 1;
    pub const StorageBucketsPerBagValueConstraint: crate::StorageBucketsPerBagValueConstraint =
        crate::StorageBucketsPerBagValueConstraint {min: 3, max_min_diff: 7};
    pub const InitialStorageBucketsNumberForDynamicBag: u64 = 3;
    pub const DefaultMemberDynamicBagNumberOfStorageBuckets: u64 = 3;
    pub const DefaultChannelDynamicBagNumberOfStorageBuckets: u64 = 4;
    pub const DistributionBucketsPerBagValueConstraint: crate::DistributionBucketsPerBagValueConstraint =
        crate::DistributionBucketsPerBagValueConstraint {min: 2, max_min_diff: 7};
    pub const MaxDataObjectSize: u64 = u64::MAX - 1000;
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
pub const VOUCHER_SIZE_LIMIT: u64 = 100;
pub const VOUCHER_OBJECTS_LIMIT: u64 = 20;
pub const DEFAULT_STORAGE_BUCKET_SIZE_LIMIT: u64 = 100;
pub const DEFAULT_STORAGE_BUCKET_OBJECTS_LIMIT: u64 = 10;
pub const DEFAULT_STORAGE_BUCKETS_NUMBER: u64 = 3;
pub const ONE_MB: u64 = 1_048_576;

impl crate::Config for Test {
    type Event = Event;
    type DataObjectId = u64;
    type StorageBucketId = u64;
    type DistributionBucketIndex = u64;
    type DistributionBucketFamilyId = u64;
    type DistributionBucketOperatorId = u64;
    type ChannelId = u64;
    type BlacklistSizeLimit = BlacklistSizeLimit;
    type ModuleId = StorageModuleId;
    type StorageBucketsPerBagValueConstraint = StorageBucketsPerBagValueConstraint;
    type DefaultMemberDynamicBagNumberOfStorageBuckets =
        DefaultMemberDynamicBagNumberOfStorageBuckets;
    type DefaultChannelDynamicBagNumberOfStorageBuckets =
        DefaultChannelDynamicBagNumberOfStorageBuckets;
    type MaxDistributionBucketFamilyNumber = MaxDistributionBucketFamilyNumber;
    type DistributionBucketsPerBagValueConstraint = DistributionBucketsPerBagValueConstraint;
    type MaxNumberOfPendingInvitationsPerDistributionBucket =
        MaxNumberOfPendingInvitationsPerDistributionBucket;
    type MaxDataObjectSize = MaxDataObjectSize;
    type ContentId = u64;
    type WeightInfo = ();
    type StorageWorkingGroup = StorageWG;
    type DistributionWorkingGroup = DistributionWG;
    type ModuleAccountInitialBalance = ExistentialDeposit;
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

parameter_types! {
    pub const MaxWorkerNumberLimit: u32 = 3;
    pub const LockId: [u8; 8] = [9; 8];
    pub const LockId2: [u8; 8] = [10; 8];
    pub const LockId3: [u8; 8] = [11; 8];
    pub const MinimumApplicationStake: u32 = 50;
    pub const LeaderOpeningStake: u32 = 20;
}

// implemented for benchmarks features to work
impl working_group::Config<StorageWorkingGroupInstance> for Test {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingAccountValidator = membership::Module<Test>;
    type StakingHandler = staking_handler::StakingManager<Self, LockId2>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

// implemented for benchmarks only
impl working_group::Config<DistributionWorkingGroupInstance> for Test {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingAccountValidator = membership::Module<Test>;
    type StakingHandler = staking_handler::StakingManager<Self, LockId3>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
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
        true
    }
}

pub const WORKING_GROUP_BUDGET: u64 = 100;

thread_local! {
    pub static WG_BUDGET: RefCell<u64> = RefCell::new(WORKING_GROUP_BUDGET);
}

pub struct MembershipWG;
impl common::working_group::WorkingGroupBudgetHandler<u64, u64> for MembershipWG {
    fn get_budget() -> u64 {
        WG_BUDGET.with(|val| *val.borrow())
    }

    fn set_budget(new_value: u64) {
        WG_BUDGET.with(|val| {
            *val.borrow_mut() = new_value;
        });
    }

    fn try_withdraw(_account_id: &u64, _amount: u64) -> DispatchResult {
        unimplemented!()
    }
}

impl common::working_group::WorkingGroupAuthenticator<Test> for MembershipWG {
    fn ensure_worker_origin(
        _origin: <Test as frame_system::Config>::Origin,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        unimplemented!()
    }

    fn ensure_leader_origin(_origin: <Test as frame_system::Config>::Origin) -> DispatchResult {
        unimplemented!()
    }

    fn get_leader_member_id() -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn get_worker_member_id(
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn is_leader_account_id(_account_id: &<Test as frame_system::Config>::AccountId) -> bool {
        true
    }

    fn is_worker_account_id(
        _account_id: &<Test as frame_system::Config>::AccountId,
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

impl LockComparator<<Test as balances::Config>::Balance> for Test {
    fn are_locks_conflicting(
        _new_lock: &LockIdentifier,
        _existing_locks: &[LockIdentifier],
    ) -> bool {
        false
    }
}

impl membership::Config for Test {
    type Event = Event;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type DefaultInitialInvitationBalance = DefaultInitialInvitationBalance;
    type WorkingGroup = MembershipWG;
    type WeightInfo = ();
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

pub fn build_test_externalities() -> sp_io::TestExternalities {
    let t = frame_system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    t.into()
}

pub fn build_test_externalities_with_genesis() -> sp_io::TestExternalities {
    let mut t = frame_system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    crate::GenesisConfig::<Test>::default()
        .assimilate_storage(&mut t)
        .unwrap();

    t.into()
}

// working group integration
pub struct StorageWG;
pub struct DistributionWG;

impl common::working_group::WorkingGroupAuthenticator<Test> for StorageWG {
    fn ensure_worker_origin(
        origin: <Test as frame_system::Config>::Origin,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
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

    fn ensure_leader_origin(origin: <Test as frame_system::Config>::Origin) -> DispatchResult {
        let account_id = ensure_signed(origin)?;
        ensure!(
            account_id == STORAGE_WG_LEADER_ACCOUNT_ID,
            DispatchError::BadOrigin,
        );
        Ok(())
    }

    fn get_leader_member_id() -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn get_worker_member_id(
        _: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn is_leader_account_id(_account_id: &<Test as frame_system::Config>::AccountId) -> bool {
        unimplemented!()
    }

    fn is_worker_account_id(
        _account_id: &<Test as frame_system::Config>::AccountId,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> bool {
        unimplemented!()
    }

    fn worker_exists(worker_id: &<Test as common::membership::MembershipTypes>::ActorId) -> bool {
        Self::ensure_worker_exists(worker_id).is_ok()
    }

    fn ensure_worker_exists(
        worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
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
}

impl common::working_group::WorkingGroupAuthenticator<Test> for DistributionWG {
    fn ensure_worker_origin(
        origin: <Test as frame_system::Config>::Origin,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
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

    fn ensure_leader_origin(origin: <Test as frame_system::Config>::Origin) -> DispatchResult {
        let account_id = ensure_signed(origin)?;

        ensure!(
            account_id == DISTRIBUTION_WG_LEADER_ACCOUNT_ID,
            DispatchError::BadOrigin,
        );
        Ok(())
    }

    fn get_leader_member_id() -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn get_worker_member_id(
        _: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn is_leader_account_id(_account_id: &<Test as frame_system::Config>::AccountId) -> bool {
        unimplemented!()
    }

    fn is_worker_account_id(
        _account_id: &<Test as frame_system::Config>::AccountId,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> bool {
        unimplemented!()
    }

    fn worker_exists(worker_id: &<Test as common::membership::MembershipTypes>::ActorId) -> bool {
        Self::ensure_worker_exists(worker_id).is_ok()
    }

    fn ensure_worker_exists(
        worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
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
}

impl common::working_group::WorkingGroupBudgetHandler<u64, u64> for StorageWG {
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

impl common::working_group::WorkingGroupBudgetHandler<u64, u64> for DistributionWG {
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

pub(crate) fn create_cid(i: u32) -> crate::Cid {
    let bytes = i.to_be_bytes();
    let mut buffer = Vec::new();

    // Total CID = 46 bytes
    // 44 bytes
    for _ in 0..11 {
        buffer.append(&mut bytes.to_vec());
    }
    // + 2 bytes
    buffer.append(&mut vec![0, 0]);

    buffer
}
