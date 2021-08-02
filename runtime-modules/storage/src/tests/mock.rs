#![cfg(test)]

use frame_support::storage::StorageMap;
use frame_support::traits::{LockIdentifier, OnFinalize, OnInitialize};
use frame_support::weights::Weight;
use frame_support::{impl_outer_event, impl_outer_origin, parameter_types};
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};
use staking_handler::LockComparator;

use crate::data_directory::ContentIdExists;
use crate::data_object_type_registry::IsActiveDataObjectType;

pub use crate::{data_directory, data_object_storage_registry, data_object_type_registry};
use frame_support::sp_runtime::DispatchResult;

use frame_support::dispatch::DispatchError;
use membership;

pub type StorageWorkingGroupInstance = working_group::Instance2;

mod working_group_mod {
    pub use super::StorageWorkingGroupInstance;
    pub use working_group::Event;
}

mod members {
    pub use membership::Event;
}

impl_outer_origin! {
    pub enum Origin for Test {}
}

impl_outer_event! {
    pub enum MetaEvent for Test {
        data_object_type_registry<T>,
        data_directory<T>,
        data_object_storage_registry<T>,
        balances<T>,
        members<T>,
        working_group_mod StorageWorkingGroupInstance <T>,
        frame_system<T>,
    }
}

pub const TEST_FIRST_DATA_OBJECT_TYPE_ID: u64 = 1000;
pub const TEST_FIRST_CONTENT_ID: u64 = 2000;
pub const TEST_FIRST_RELATIONSHIP_ID: u64 = 3000;
pub const TEST_FIRST_METADATA_ID: u64 = 4000;

pub const TEST_MOCK_LIAISON_STORAGE_PROVIDER_ID: u32 = 1;
pub const TEST_MOCK_EXISTING_CID: u64 = 42;

pub struct AnyDataObjectTypeIsActive {}
impl<T: data_object_type_registry::Config> IsActiveDataObjectType<T> for AnyDataObjectTypeIsActive {
    fn is_active_data_object_type(_which: &T::DataObjectTypeId) -> bool {
        true
    }
}

pub struct MockContent {}
impl ContentIdExists<Test> for MockContent {
    fn has_content(which: &<Test as data_directory::Config>::ContentId) -> bool {
        *which == TEST_MOCK_EXISTING_CID
    }

    fn get_data_object(
        which: &<Test as data_directory::Config>::ContentId,
    ) -> Result<data_directory::DataObject<Test>, &'static str> {
        match *which {
            TEST_MOCK_EXISTING_CID => Ok(data_directory::DataObjectInternal {
                type_id: 1,
                size: 1234,
                added_at: data_directory::BlockAndTime {
                    block: 10,
                    time: 1024,
                },
                owner: 1,
                liaison: TEST_MOCK_LIAISON_STORAGE_PROVIDER_ID,
                liaison_judgement: data_directory::LiaisonJudgement::Pending,
                ipfs_content_id: vec![],
            }),
            _ => Err("nope, missing"),
        }
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
    pub const MaxObjectsPerInjection: u32 = 5;
    pub const ReferralCutMaximumPercent: u8 = 50;
}

impl frame_system::Config for Test {
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
    type Event = MetaEvent;
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

impl pallet_timestamp::Config for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

parameter_types! {
    pub const ExistentialDeposit: u32 = 10;
}

impl balances::Config for Test {
    type Balance = u64;
    type DustRemoval = ();
    type Event = MetaEvent;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type WeightInfo = ();
    type MaxLocks = ();
}

parameter_types! {
    pub const MaxWorkerNumberLimit: u32 = 3;
    pub const LockId: LockIdentifier = [2; 8];
    pub const DefaultMembershipPrice: u64 = 100;
    pub const DefaultInitialInvitationBalance: u64 = 100;
    pub const InvitedMemberLockId: [u8; 8] = [2; 8];
    pub const StakingCandidateLockId: [u8; 8] = [3; 8];
    pub const CandidateStake: u64 = 100;
    pub const MinimumApplicationStake: u32 = 50;
    pub const LeaderOpeningStake: u64 = 20;
}

pub struct WorkingGroupWeightInfo;
impl working_group::Config<StorageWorkingGroupInstance> for Test {
    type Event = MetaEvent;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = staking_handler::StakingManager<Self, LockId>;
    type StakingAccountValidator = membership::Module<Test>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = WorkingGroupWeightInfo;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl working_group::WeightInfo for WorkingGroupWeightInfo {
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

impl data_object_type_registry::Config for Test {
    type Event = MetaEvent;
    type DataObjectTypeId = u64;
    type WorkingGroup = StorageWorkingGroup;
}

impl data_directory::Config for Test {
    type Event = MetaEvent;
    type ContentId = u64;
    type StorageProviderHelper = ();
    type IsActiveDataObjectType = AnyDataObjectTypeIsActive;
    type MemberOriginValidator = ();
    type MaxObjectsPerInjection = MaxObjectsPerInjection;
}

impl crate::data_directory::StorageProviderHelper<Test> for () {
    fn get_random_storage_provider() -> Result<u32, &'static str> {
        Ok(1)
    }
}

impl data_object_storage_registry::Config for Test {
    type Event = MetaEvent;
    type DataObjectStorageRelationshipId = u64;
    type ContentIdExists = MockContent;
}

impl common::membership::Config for Test {
    type MemberId = u64;
    type ActorId = u32;
}

impl membership::Config for Test {
    type Event = MetaEvent;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type WorkingGroup = ();
    type WeightInfo = Weights;
    type DefaultInitialInvitationBalance = ();
    type InvitedMemberStakingHandler = staking_handler::StakingManager<Self, InvitedMemberLockId>;
    type ReferralCutMaximumPercent = ReferralCutMaximumPercent;
    type StakingCandidateStakingHandler =
        staking_handler::StakingManager<Self, StakingCandidateLockId>;
    type CandidateStake = CandidateStake;
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
        _origin: <Test as frame_system::Config>::Origin,
        _worker_id: &<Test as common::membership::Config>::ActorId,
    ) -> DispatchResult {
        unimplemented!();
    }

    fn ensure_leader_origin(_origin: <Test as frame_system::Config>::Origin) -> DispatchResult {
        unimplemented!()
    }

    fn get_leader_member_id() -> Option<<Test as common::membership::Config>::MemberId> {
        unimplemented!();
    }

    fn is_leader_account_id(_account_id: &<Test as frame_system::Config>::AccountId) -> bool {
        unimplemented!()
    }

    fn is_worker_account_id(
        _account_id: &<Test as frame_system::Config>::AccountId,
        _worker_id: &<Test as common::membership::Config>::ActorId,
    ) -> bool {
        unimplemented!()
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

pub struct ExtBuilder {
    first_data_object_type_id: u64,
    first_content_id: u64,
    first_relationship_id: u64,
    first_metadata_id: u64,
}

impl Default for ExtBuilder {
    fn default() -> Self {
        Self {
            first_data_object_type_id: 1,
            first_content_id: 2,
            first_relationship_id: 3,
            first_metadata_id: 4,
        }
    }
}

impl ExtBuilder {
    pub fn first_data_object_type_id(mut self, first_data_object_type_id: u64) -> Self {
        self.first_data_object_type_id = first_data_object_type_id;
        self
    }
    pub fn first_content_id(mut self, first_content_id: u64) -> Self {
        self.first_content_id = first_content_id;
        self
    }
    pub fn first_relationship_id(mut self, first_relationship_id: u64) -> Self {
        self.first_relationship_id = first_relationship_id;
        self
    }
    pub fn first_metadata_id(mut self, first_metadata_id: u64) -> Self {
        self.first_metadata_id = first_metadata_id;
        self
    }
    pub fn build(self) -> sp_io::TestExternalities {
        let mut t = frame_system::GenesisConfig::default()
            .build_storage::<Test>()
            .unwrap();

        data_object_type_registry::GenesisConfig::<Test> {
            first_data_object_type_id: self.first_data_object_type_id,
        }
        .assimilate_storage(&mut t)
        .unwrap();

        data_object_storage_registry::GenesisConfig::<Test> {
            first_relationship_id: self.first_relationship_id,
        }
        .assimilate_storage(&mut t)
        .unwrap();

        membership::GenesisConfig::<Test> {
            members: vec![membership::genesis::Member {
                member_id: 0,
                root_account: 1,
                controller_account: 1,
                handle: "alice".into(),
                avatar_uri: "".into(),
                about: "".into(),
                name: "".into(),
            }],
        }
        .assimilate_storage(&mut t)
        .unwrap();

        t.into()
    }
}

pub type TestDataObjectType = data_object_type_registry::DataObjectType;

pub type StorageWorkingGroup = working_group::Module<Test, StorageWorkingGroupInstance>;
pub type System = frame_system::Module<Test>;
pub type TestDataObjectTypeRegistry = data_object_type_registry::Module<Test>;
pub type TestDataDirectory = data_directory::Module<Test>;
pub type TestDataObjectStorageRegistry = data_object_storage_registry::Module<Test>;

pub fn with_default_mock_builder<R, F: FnOnce() -> R>(f: F) -> R {
    ExtBuilder::default()
        .first_data_object_type_id(TEST_FIRST_DATA_OBJECT_TYPE_ID)
        .first_content_id(TEST_FIRST_CONTENT_ID)
        .first_relationship_id(TEST_FIRST_RELATIONSHIP_ID)
        .first_metadata_id(TEST_FIRST_METADATA_ID)
        .build()
        .execute_with(|| f())
}

pub(crate) fn hire_storage_provider() -> (u64, u32) {
    let storage_provider_id = 1;
    let role_account_id = 1;

    let storage_provider = working_group::Worker::<Test> {
        member_id: 1,
        role_account_id,
        staking_account_id: 1,
        reward_account_id: role_account_id,
        started_leaving_at: None,
        job_unstaking_period: 0,
        reward_per_block: None,
        missed_reward: None,
        created_at: 1,
    };

    <working_group::WorkerById<Test, StorageWorkingGroupInstance>>::insert(
        storage_provider_id,
        storage_provider,
    );

    (role_account_id, storage_provider_id)
}

// Recommendation from Parity on testing on_finalize
// https://substrate.dev/docs/en/next/development/module/tests
pub fn run_to_block(n: u64) {
    while System::block_number() < n {
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        <TestDataObjectTypeRegistry as OnFinalize<u64>>::on_finalize(System::block_number());
        <TestDataDirectory as OnFinalize<u64>>::on_finalize(System::block_number());
        <TestDataObjectStorageRegistry as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
        <TestDataObjectTypeRegistry as OnInitialize<u64>>::on_initialize(System::block_number());
        <TestDataDirectory as OnInitialize<u64>>::on_initialize(System::block_number());
        <TestDataObjectStorageRegistry as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}
