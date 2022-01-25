use frame_support::dispatch::DispatchResult;
use frame_support::storage::StorageMap;
use frame_support::traits::{Currency, OnFinalize, OnInitialize};
use frame_system::{EventRecord, Phase, RawOrigin};
use sp_runtime::{traits::Zero, DispatchError};
use sp_std::collections::btree_map::BTreeMap;
use sp_std::collections::btree_set::BTreeSet;
use std::convert::TryInto;

use super::mocks::{
    Balances, CollectiveFlip, Storage, System, Test, TestEvent, DEFAULT_MEMBER_ACCOUNT_ID,
    DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID, STORAGE_WG_LEADER_ACCOUNT_ID,
};

use crate::tests::mocks::{
    DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID, DEFAULT_MEMBER_ID,
    DEFAULT_STORAGE_BUCKET_OBJECTS_LIMIT, DEFAULT_STORAGE_BUCKET_SIZE_LIMIT,
    DISTRIBUTION_WG_LEADER_ACCOUNT_ID,
};
use crate::{
    BagId, Cid, DataObjectCreationParameters, DataObjectStorage, DistributionBucket,
    DistributionBucketId, DynamicBagDeletionPrize, DynamicBagId, DynamicBagType, RawEvent,
    StaticBagId, StorageBucketOperatorStatus, UploadParameters,
};

// Recommendation from Parity on testing on_finalize
// https://substrate.dev/docs/en/next/development/module/tests
pub fn run_to_block(n: u64) {
    while System::block_number() < n {
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        <CollectiveFlip as OnFinalize<u64>>::on_finalize(System::block_number());
        <Storage as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
        <CollectiveFlip as OnInitialize<u64>>::on_initialize(System::block_number());
        <Storage as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}

pub fn increase_account_balance(account_id: &u64, balance: u64) {
    let _ = Balances::deposit_creating(&account_id, balance);
}

pub struct EventFixture;
impl EventFixture {
    pub fn assert_last_crate_event(
        expected_raw_event: RawEvent<
            u64,
            u64,
            u64,
            UploadParameters<Test>,
            BagId<Test>,
            DynamicBagId<Test>,
            u64,
            u64,
            u64,
            DistributionBucketId<Test>,
            u64,
        >,
    ) {
        let converted_event = TestEvent::storage(expected_raw_event);

        Self::assert_last_global_event(converted_event)
    }

    pub fn contains_crate_event(
        expected_raw_event: RawEvent<
            u64,
            u64,
            u64,
            UploadParameters<Test>,
            BagId<Test>,
            DynamicBagId<Test>,
            u64,
            u64,
            u64,
            DistributionBucketId<Test>,
            u64,
        >,
    ) {
        let converted_event = TestEvent::storage(expected_raw_event);

        Self::contains_global_event(converted_event)
    }

    pub fn assert_last_global_event(expected_event: TestEvent) {
        let expected_event = EventRecord {
            phase: Phase::Initialization,
            event: expected_event,
            topics: vec![],
        };

        assert_eq!(System::events().pop().unwrap(), expected_event);
    }

    fn contains_global_event(expected_event: TestEvent) {
        let expected_event = EventRecord {
            phase: Phase::Initialization,
            event: expected_event,
            topics: vec![],
        };

        assert!(System::events().iter().any(|ev| *ev == expected_event));
    }
}

const DEFAULT_ACCOUNT_ID: u64 = 1;
const DEFAULT_WORKER_ID: u64 = 1;
pub const DEFAULT_DATA_OBJECTS_NUMBER: u64 = DEFAULT_STORAGE_BUCKET_OBJECTS_LIMIT / 2;
pub const DEFAULT_DATA_OBJECTS_SIZE: u64 =
    DEFAULT_STORAGE_BUCKET_SIZE_LIMIT / DEFAULT_DATA_OBJECTS_NUMBER - 1;

pub struct CreateStorageBucketFixture {
    origin: RawOrigin<u64>,
    invite_worker: Option<u64>,
    accepting_new_bags: bool,
    size_limit: u64,
    objects_limit: u64,
}

impl CreateStorageBucketFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_ACCOUNT_ID),
            invite_worker: None,
            accepting_new_bags: true,
            size_limit: 0,
            objects_limit: 0,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_invite_worker(self, invite_worker: Option<u64>) -> Self {
        Self {
            invite_worker,
            ..self
        }
    }

    pub fn with_accepting_new_bags(self, accepting_new_bags: bool) -> Self {
        Self {
            accepting_new_bags,
            ..self
        }
    }

    pub fn with_size_limit(self, size_limit: u64) -> Self {
        Self { size_limit, ..self }
    }

    pub fn with_objects_limit(self, objects_limit: u64) -> Self {
        Self {
            objects_limit,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) -> Option<u64> {
        let next_storage_bucket_id = Storage::next_storage_bucket_id();
        let actual_result = Storage::create_storage_bucket(
            self.origin.clone().into(),
            self.invite_worker,
            self.accepting_new_bags,
            self.size_limit,
            self.objects_limit,
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                next_storage_bucket_id + 1,
                Storage::next_storage_bucket_id()
            );
            assert!(<crate::StorageBucketById<Test>>::contains_key(
                next_storage_bucket_id
            ));

            Some(next_storage_bucket_id)
        } else {
            assert_eq!(next_storage_bucket_id, Storage::next_storage_bucket_id());
            assert!(!<crate::StorageBucketById<Test>>::contains_key(
                next_storage_bucket_id
            ));

            None
        }
    }
}

pub struct AcceptStorageBucketInvitationFixture {
    origin: RawOrigin<u64>,
    worker_id: u64,
    storage_bucket_id: u64,
    transactor_account_id: u64,
}

impl AcceptStorageBucketInvitationFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_ACCOUNT_ID),
            worker_id: DEFAULT_WORKER_ID,
            storage_bucket_id: Default::default(),
            transactor_account_id: DEFAULT_ACCOUNT_ID,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_worker_id(self, worker_id: u64) -> Self {
        Self { worker_id, ..self }
    }
    pub fn with_transactor_account_id(self, transactor_account_id: u64) -> Self {
        Self {
            transactor_account_id,
            ..self
        }
    }

    pub fn with_storage_bucket_id(self, storage_bucket_id: u64) -> Self {
        Self {
            storage_bucket_id,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_bucket = Storage::storage_bucket_by_id(self.storage_bucket_id);

        let actual_result = Storage::accept_storage_bucket_invitation(
            self.origin.clone().into(),
            self.worker_id,
            self.storage_bucket_id,
            self.transactor_account_id,
        );

        assert_eq!(actual_result, expected_result);

        let new_bucket = Storage::storage_bucket_by_id(self.storage_bucket_id);
        if actual_result.is_ok() {
            assert_eq!(
                new_bucket.operator_status,
                StorageBucketOperatorStatus::StorageWorker(
                    self.worker_id,
                    self.transactor_account_id
                )
            );
        } else {
            assert_eq!(old_bucket, new_bucket);
        }
    }
}

pub struct UpdateStorageBucketForBagsFixture {
    origin: RawOrigin<u64>,
    bag_id: BagId<Test>,
    add_bucket_ids: BTreeSet<u64>,
    remove_bucket_ids: BTreeSet<u64>,
}

impl UpdateStorageBucketForBagsFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_ACCOUNT_ID),
            bag_id: Default::default(),
            add_bucket_ids: Default::default(),
            remove_bucket_ids: Default::default(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_add_bucket_ids(self, add_bucket_ids: BTreeSet<u64>) -> Self {
        Self {
            add_bucket_ids,
            ..self
        }
    }

    pub fn with_remove_bucket_ids(self, remove_bucket_ids: BTreeSet<u64>) -> Self {
        Self {
            remove_bucket_ids,
            ..self
        }
    }

    pub fn with_bag_id(self, bag_id: BagId<Test>) -> Self {
        Self { bag_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::update_storage_buckets_for_bag(
            self.origin.clone().into(),
            self.bag_id.clone(),
            self.add_bucket_ids.clone(),
            self.remove_bucket_ids.clone(),
        );

        assert_eq!(actual_result, expected_result);
    }
}

pub struct UploadFixture {
    params: UploadParameters<Test>,
}

impl UploadFixture {
    pub fn default() -> Self {
        Self {
            params: Default::default(),
        }
    }

    pub fn with_params(self, params: UploadParameters<Test>) -> Self {
        Self { params, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_next_data_object_id = Storage::next_data_object_id();
        let actual_result = Storage::upload_data_objects(self.params.clone());

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            // check next data object ID
            assert_eq!(
                Storage::next_data_object_id(),
                old_next_data_object_id + self.params.object_creation_list.len() as u64
            );
        } else {
            assert_eq!(Storage::next_data_object_id(), old_next_data_object_id);
        }
    }
}

pub fn create_data_object_candidates(
    starting_index: u8,
    number: u8,
) -> Vec<DataObjectCreationParameters> {
    let range = starting_index..(starting_index + number);

    range
        .into_iter()
        .map(|idx| DataObjectCreationParameters {
            size: DEFAULT_DATA_OBJECTS_SIZE,
            ipfs_content_id: vec![idx],
        })
        .collect()
}

pub fn create_single_data_object() -> Vec<DataObjectCreationParameters> {
    create_data_object_candidates(1, 1)
}

pub struct SetStorageOperatorMetadataFixture {
    origin: RawOrigin<u64>,
    worker_id: u64,
    storage_bucket_id: u64,
    metadata: Vec<u8>,
}

impl SetStorageOperatorMetadataFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID),
            worker_id: DEFAULT_WORKER_ID,
            storage_bucket_id: Default::default(),
            metadata: Vec::new(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_worker_id(self, worker_id: u64) -> Self {
        Self { worker_id, ..self }
    }

    pub fn with_storage_bucket_id(self, storage_bucket_id: u64) -> Self {
        Self {
            storage_bucket_id,
            ..self
        }
    }

    pub fn with_metadata(self, metadata: Vec<u8>) -> Self {
        Self { metadata, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::set_storage_operator_metadata(
            self.origin.clone().into(),
            self.worker_id,
            self.storage_bucket_id,
            self.metadata.clone(),
        );

        assert_eq!(actual_result, expected_result);
    }
}

pub struct AcceptPendingDataObjectsFixture {
    origin: RawOrigin<u64>,
    worker_id: u64,
    storage_bucket_id: u64,
    bag_id: BagId<Test>,
    data_object_ids: BTreeSet<u64>,
}

impl AcceptPendingDataObjectsFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID),
            worker_id: DEFAULT_WORKER_ID,
            storage_bucket_id: Default::default(),
            data_object_ids: Default::default(),
            bag_id: Default::default(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_worker_id(self, worker_id: u64) -> Self {
        Self { worker_id, ..self }
    }

    pub fn with_bag_id(self, bag_id: BagId<Test>) -> Self {
        Self { bag_id, ..self }
    }

    pub fn with_data_object_ids(self, data_object_ids: BTreeSet<u64>) -> Self {
        Self {
            data_object_ids,
            ..self
        }
    }

    pub fn with_storage_bucket_id(self, storage_bucket_id: u64) -> Self {
        Self {
            storage_bucket_id,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::accept_pending_data_objects(
            self.origin.clone().into(),
            self.worker_id,
            self.storage_bucket_id,
            self.bag_id.clone(),
            self.data_object_ids.clone(),
        );

        assert_eq!(actual_result, expected_result);
    }
}

pub struct CancelStorageBucketInvitationFixture {
    origin: RawOrigin<u64>,
    storage_bucket_id: u64,
}

impl CancelStorageBucketInvitationFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID),
            storage_bucket_id: Default::default(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_storage_bucket_id(self, storage_bucket_id: u64) -> Self {
        Self {
            storage_bucket_id,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_bucket = Storage::storage_bucket_by_id(self.storage_bucket_id);

        let actual_result = Storage::cancel_storage_bucket_operator_invite(
            self.origin.clone().into(),
            self.storage_bucket_id,
        );

        assert_eq!(actual_result, expected_result);

        let new_bucket = Storage::storage_bucket_by_id(self.storage_bucket_id);
        if actual_result.is_ok() {
            assert_eq!(
                new_bucket.operator_status,
                StorageBucketOperatorStatus::Missing
            );
        } else {
            assert_eq!(old_bucket, new_bucket);
        }
    }
}

pub struct InviteStorageBucketOperatorFixture {
    origin: RawOrigin<u64>,
    operator_worker_id: u64,
    storage_bucket_id: u64,
}

impl InviteStorageBucketOperatorFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_ACCOUNT_ID),
            operator_worker_id: DEFAULT_WORKER_ID,
            storage_bucket_id: Default::default(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_operator_worker_id(self, operator_worker_id: u64) -> Self {
        Self {
            operator_worker_id,
            ..self
        }
    }

    pub fn with_storage_bucket_id(self, storage_bucket_id: u64) -> Self {
        Self {
            storage_bucket_id,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_bucket = Storage::storage_bucket_by_id(self.storage_bucket_id);

        let actual_result = Storage::invite_storage_bucket_operator(
            self.origin.clone().into(),
            self.storage_bucket_id,
            self.operator_worker_id,
        );

        assert_eq!(actual_result, expected_result);

        let new_bucket = Storage::storage_bucket_by_id(self.storage_bucket_id);
        if actual_result.is_ok() {
            assert_eq!(
                new_bucket.operator_status,
                StorageBucketOperatorStatus::InvitedStorageWorker(self.operator_worker_id)
            );
        } else {
            assert_eq!(old_bucket, new_bucket);
        }
    }
}

pub struct UpdateUploadingBlockedStatusFixture {
    origin: RawOrigin<u64>,
    new_status: bool,
}

impl UpdateUploadingBlockedStatusFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID),
            new_status: false,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_new_status(self, new_status: bool) -> Self {
        Self { new_status, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_status = Storage::uploading_blocked();

        let actual_result =
            Storage::update_uploading_blocked_status(self.origin.clone().into(), self.new_status);

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(Storage::uploading_blocked(), self.new_status);
        } else {
            assert_eq!(old_status, Storage::uploading_blocked());
        }
    }
}

pub struct MoveDataObjectsFixture {
    src_bag_id: BagId<Test>,
    dest_bag_id: BagId<Test>,
    data_object_ids: BTreeSet<u64>,
}

impl MoveDataObjectsFixture {
    pub fn default() -> Self {
        Self {
            src_bag_id: BagId::<Test>::Static(StaticBagId::Council),
            dest_bag_id: BagId::<Test>::Static(StaticBagId::Council),
            data_object_ids: BTreeSet::new(),
        }
    }

    pub fn with_src_bag_id(self, src_bag_id: BagId<Test>) -> Self {
        Self { src_bag_id, ..self }
    }

    pub fn with_dest_bag_id(self, dest_bag_id: BagId<Test>) -> Self {
        Self {
            dest_bag_id,
            ..self
        }
    }

    pub fn with_data_object_ids(self, data_object_ids: BTreeSet<u64>) -> Self {
        Self {
            data_object_ids,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::move_data_objects(
            self.src_bag_id.clone(),
            self.dest_bag_id.clone(),
            self.data_object_ids.clone(),
        );

        assert_eq!(actual_result, expected_result);
    }
}

pub struct DeleteDataObjectsFixture {
    deletion_prize_account_id: u64,
    bag_id: BagId<Test>,
    data_object_ids: BTreeSet<u64>,
}

impl DeleteDataObjectsFixture {
    pub fn default() -> Self {
        Self {
            bag_id: Default::default(),
            data_object_ids: Default::default(),
            deletion_prize_account_id: DEFAULT_ACCOUNT_ID,
        }
    }

    pub fn with_bag_id(self, bag_id: BagId<Test>) -> Self {
        Self { bag_id, ..self }
    }

    pub fn with_data_object_ids(self, data_object_ids: BTreeSet<u64>) -> Self {
        Self {
            data_object_ids,
            ..self
        }
    }

    pub fn with_deletion_account_id(self, deletion_prize_account_id: u64) -> Self {
        Self {
            deletion_prize_account_id,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::delete_data_objects(
            self.deletion_prize_account_id,
            self.bag_id.clone(),
            self.data_object_ids.clone(),
        );

        assert_eq!(actual_result, expected_result);
    }
}

pub struct UpdateStorageBucketStatusFixture {
    origin: RawOrigin<u64>,
    storage_bucket_id: u64,
    new_status: bool,
}

impl UpdateStorageBucketStatusFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID),
            storage_bucket_id: Default::default(),
            new_status: false,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_storage_bucket_id(self, storage_bucket_id: u64) -> Self {
        Self {
            storage_bucket_id,
            ..self
        }
    }

    pub fn with_new_status(self, new_status: bool) -> Self {
        Self { new_status, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::update_storage_bucket_status(
            self.origin.clone().into(),
            self.storage_bucket_id,
            self.new_status,
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            let bucket = Storage::storage_bucket_by_id(self.storage_bucket_id);

            assert_eq!(bucket.accepting_new_bags, self.new_status);
        }
    }
}

pub struct UpdateBlacklistFixture {
    origin: RawOrigin<u64>,
    remove_hashes: BTreeSet<Cid>,
    add_hashes: BTreeSet<Cid>,
}

impl UpdateBlacklistFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID),
            remove_hashes: BTreeSet::new(),
            add_hashes: BTreeSet::new(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_add_hashes(self, add_hashes: BTreeSet<Cid>) -> Self {
        Self { add_hashes, ..self }
    }

    pub fn with_remove_hashes(self, remove_hashes: BTreeSet<Cid>) -> Self {
        Self {
            remove_hashes,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::update_blacklist(
            self.origin.clone().into(),
            self.remove_hashes.clone(),
            self.add_hashes.clone(),
        );

        assert_eq!(actual_result, expected_result);
    }
}

pub struct DeleteDynamicBagFixture {
    bag_id: DynamicBagId<Test>,
    deletion_account_id: u64,
}

impl DeleteDynamicBagFixture {
    pub fn default() -> Self {
        Self {
            bag_id: Default::default(),
            deletion_account_id: DEFAULT_ACCOUNT_ID,
        }
    }

    pub fn with_deletion_account_id(self, deletion_account_id: u64) -> Self {
        Self {
            deletion_account_id,
            ..self
        }
    }

    pub fn with_bag_id(self, bag_id: DynamicBagId<Test>) -> Self {
        Self { bag_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result =
            Storage::delete_dynamic_bag(self.deletion_account_id, self.bag_id.clone());

        assert_eq!(actual_result, expected_result);
    }
}

pub struct CanDeleteDynamicBagWithObjectsFixture {
    bag_id: DynamicBagId<Test>,
}

impl CanDeleteDynamicBagWithObjectsFixture {
    pub fn default() -> Self {
        Self {
            bag_id: Default::default(),
        }
    }

    pub fn with_bag_id(self, bag_id: DynamicBagId<Test>) -> Self {
        Self { bag_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::can_delete_dynamic_bag_with_objects(&self.bag_id.clone());

        assert_eq!(actual_result, expected_result);
    }
}

pub struct DeleteStorageBucketFixture {
    origin: RawOrigin<u64>,
    storage_bucket_id: u64,
}

impl DeleteStorageBucketFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_ACCOUNT_ID),
            storage_bucket_id: Default::default(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_storage_bucket_id(self, storage_bucket_id: u64) -> Self {
        Self {
            storage_bucket_id,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result =
            Storage::delete_storage_bucket(self.origin.clone().into(), self.storage_bucket_id);

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert!(!<crate::StorageBucketById<Test>>::contains_key(
                self.storage_bucket_id
            ));
        }
    }
}

pub struct RemoveStorageBucketOperatorFixture {
    origin: RawOrigin<u64>,
    storage_bucket_id: u64,
}

impl RemoveStorageBucketOperatorFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID),
            storage_bucket_id: Default::default(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_storage_bucket_id(self, storage_bucket_id: u64) -> Self {
        Self {
            storage_bucket_id,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_bucket = Storage::storage_bucket_by_id(self.storage_bucket_id);

        let actual_result = Storage::remove_storage_bucket_operator(
            self.origin.clone().into(),
            self.storage_bucket_id,
        );

        assert_eq!(actual_result, expected_result);

        let new_bucket = Storage::storage_bucket_by_id(self.storage_bucket_id);
        if actual_result.is_ok() {
            assert_eq!(
                new_bucket.operator_status,
                StorageBucketOperatorStatus::Missing
            );
        } else {
            assert_eq!(old_bucket, new_bucket);
        }
    }
}

pub struct UpdateDataObjectPerMegabyteFeeFixture {
    origin: RawOrigin<u64>,
    new_fee: u64,
}

impl UpdateDataObjectPerMegabyteFeeFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID),
            new_fee: 0,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_new_fee(self, new_fee: u64) -> Self {
        Self { new_fee, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_fee = Storage::data_object_per_mega_byte_fee();

        let actual_result = Storage::update_data_size_fee(self.origin.clone().into(), self.new_fee);

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(Storage::data_object_per_mega_byte_fee(), self.new_fee);
        } else {
            assert_eq!(old_fee, Storage::data_object_per_mega_byte_fee());
        }
    }
}

pub struct UpdateStorageBucketsPerBagLimitFixture {
    origin: RawOrigin<u64>,
    new_limit: u64,
}

impl UpdateStorageBucketsPerBagLimitFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID),
            new_limit: 0,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_new_limit(self, new_limit: u64) -> Self {
        Self { new_limit, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_fee = Storage::storage_buckets_per_bag_limit();

        let actual_result = Storage::update_storage_buckets_per_bag_limit(
            self.origin.clone().into(),
            self.new_limit,
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(Storage::storage_buckets_per_bag_limit(), self.new_limit);
        } else {
            assert_eq!(old_fee, Storage::storage_buckets_per_bag_limit());
        }
    }
}

pub struct SetStorageBucketVoucherLimitsFixture {
    origin: RawOrigin<u64>,
    storage_bucket_id: u64,
    new_objects_size_limit: u64,
    new_objects_number_limit: u64,
}

impl SetStorageBucketVoucherLimitsFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID),
            storage_bucket_id: Default::default(),
            new_objects_size_limit: 0,
            new_objects_number_limit: 0,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_storage_bucket_id(self, storage_bucket_id: u64) -> Self {
        Self {
            storage_bucket_id,
            ..self
        }
    }

    pub fn with_new_objects_size_limit(self, new_objects_size_limit: u64) -> Self {
        Self {
            new_objects_size_limit,
            ..self
        }
    }

    pub fn with_new_objects_number_limit(self, new_objects_number_limit: u64) -> Self {
        Self {
            new_objects_number_limit,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_voucher = Storage::storage_bucket_by_id(self.storage_bucket_id).voucher;
        let actual_result = Storage::set_storage_bucket_voucher_limits(
            self.origin.clone().into(),
            self.storage_bucket_id,
            self.new_objects_size_limit.clone(),
            self.new_objects_number_limit.clone(),
        );

        assert_eq!(actual_result, expected_result);
        let new_voucher = Storage::storage_bucket_by_id(self.storage_bucket_id).voucher;

        if actual_result.is_ok() {
            assert_eq!(self.new_objects_size_limit, new_voucher.size_limit);
            assert_eq!(self.new_objects_number_limit, new_voucher.objects_limit);
        } else {
            assert_eq!(old_voucher.size_limit, new_voucher.size_limit);
            assert_eq!(old_voucher.objects_limit, new_voucher.objects_limit);
        }
    }
}
pub struct UpdateStorageBucketsVoucherMaxLimitsFixture {
    origin: RawOrigin<u64>,
    new_objects_size_limit: u64,
    new_objects_number_limit: u64,
}

impl UpdateStorageBucketsVoucherMaxLimitsFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID),
            new_objects_size_limit: 0,
            new_objects_number_limit: 0,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_new_objects_size_limit(self, new_objects_size_limit: u64) -> Self {
        Self {
            new_objects_size_limit,
            ..self
        }
    }

    pub fn with_new_objects_number_limit(self, new_objects_number_limit: u64) -> Self {
        Self {
            new_objects_number_limit,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_size_limit = Storage::voucher_max_objects_size_limit();
        let old_number_limit = Storage::voucher_max_objects_number_limit();

        let actual_result = Storage::update_storage_buckets_voucher_max_limits(
            self.origin.clone().into(),
            self.new_objects_size_limit.clone(),
            self.new_objects_number_limit.clone(),
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                self.new_objects_size_limit,
                Storage::voucher_max_objects_size_limit()
            );
            assert_eq!(
                self.new_objects_number_limit,
                Storage::voucher_max_objects_number_limit()
            );
        } else {
            assert_eq!(old_size_limit, Storage::voucher_max_objects_size_limit());
            assert_eq!(
                old_number_limit,
                Storage::voucher_max_objects_number_limit()
            );
        }
    }
}

pub struct CreateDynamicBagFixture {
    bag_id: DynamicBagId<Test>,
    deletion_prize: Option<DynamicBagDeletionPrize<Test>>,
}

impl CreateDynamicBagFixture {
    pub fn default() -> Self {
        Self {
            bag_id: Default::default(),
            deletion_prize: Default::default(),
        }
    }

    pub fn with_bag_id(self, bag_id: DynamicBagId<Test>) -> Self {
        Self { bag_id, ..self }
    }

    pub fn with_deletion_prize(self, deletion_prize: DynamicBagDeletionPrize<Test>) -> Self {
        Self {
            deletion_prize: Some(deletion_prize),
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result =
            Storage::create_dynamic_bag(self.bag_id.clone(), self.deletion_prize.clone());

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            let bag_id: BagId<Test> = self.bag_id.clone().into();
            assert!(<crate::Bags<Test>>::contains_key(&bag_id));
        }
    }
}

pub struct CreateDynamicBagWithObjectsFixture {
    sender: u64,
    bag_id: DynamicBagId<Test>,
    deletion_prize: Option<DynamicBagDeletionPrize<Test>>,
    upload_parameters: UploadParameters<Test>,
}

impl CreateDynamicBagWithObjectsFixture {
    pub fn default() -> Self {
        let bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);
        let sender_acc = DEFAULT_MEMBER_ACCOUNT_ID;
        Self {
            sender: sender_acc.clone(),
            bag_id: bag_id.clone(),
            deletion_prize: None,
            upload_parameters: UploadParameters::<Test> {
                bag_id: bag_id.into(),
                expected_data_size_fee: crate::Module::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_object_candidates(
                    1,
                    DEFAULT_DATA_OBJECTS_NUMBER.try_into().unwrap(),
                ),
                deletion_prize_source_account_id: sender_acc,
            },
        }
    }

    pub fn with_expected_data_size_fee(self, expected_data_size_fee: u64) -> Self {
        Self {
            upload_parameters: UploadParameters::<Test> {
                expected_data_size_fee,
                ..self.upload_parameters
            },
            ..self
        }
    }

    pub fn with_params_bag_id(self, bag_id: BagId<Test>) -> Self {
        Self {
            upload_parameters: UploadParameters::<Test> {
                bag_id,
                ..self.upload_parameters
            },
            ..self
        }
    }

    pub fn with_objects(self, object_creation_list: Vec<DataObjectCreationParameters>) -> Self {
        Self {
            upload_parameters: UploadParameters::<Test> {
                object_creation_list,
                ..self.upload_parameters
            },
            ..self
        }
    }

    pub fn with_upload_parameters(self, upload_parameters: UploadParameters<Test>) -> Self {
        Self {
            upload_parameters,
            ..self
        }
    }

    pub fn with_objects_prize_source_account(self, deletion_prize_source_account_id: u64) -> Self {
        Self {
            upload_parameters: UploadParameters::<Test> {
                deletion_prize_source_account_id,
                ..self.upload_parameters
            },
            ..self
        }
    }

    pub fn with_bag_id(self, bag_id: DynamicBagId<Test>) -> Self {
        Self { bag_id, ..self }
    }

    pub fn with_deletion_prize(
        self,
        deletion_prize: Option<DynamicBagDeletionPrize<Test>>,
    ) -> Self {
        Self {
            deletion_prize: deletion_prize,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let balance_pre = Balances::usable_balance(self.sender);
        let bag_id: BagId<Test> = self.bag_id.clone().into();
        let total_size_required = self
            .upload_parameters
            .object_creation_list
            .iter()
            .fold(0, |acc, it| acc + it.size);

        let actual_result = Storage::create_dynamic_bag_with_objects_constraints(
            self.bag_id.clone(),
            self.deletion_prize.clone(),
            self.upload_parameters.clone(),
        );

        let balance_post = Balances::usable_balance(self.sender);

        assert_eq!(actual_result, expected_result);

        match actual_result {
            Ok(()) => {
                assert!(<crate::Bags<Test>>::contains_key(&bag_id));

                let bag = crate::Bags::<Test>::get(&bag_id);
                assert_eq!(
                    balance_pre.saturating_sub(balance_post),
                    self.deletion_prize
                        .as_ref()
                        .map_or_else(|| Zero::zero(), |dprize| dprize.prize)
                );

                let total_objects_required =
                    self.upload_parameters.object_creation_list.len() as u64;

                assert!(bag.stored_by.iter().all(|id| {
                    let bucket = crate::StorageBucketById::<Test>::get(id);
                    let enough_size =
                        bucket.voucher.size_limit >= total_size_required + bucket.voucher.size_used;
                    let enough_objects = bucket.voucher.objects_limit
                        >= total_objects_required + bucket.voucher.objects_used;
                    enough_size && enough_objects && bucket.accepting_new_bags
                }));
            }
            Err(err) => {
                assert_eq!(balance_pre, balance_post);
                if into_str(err) != "DynamicBagExists" {
                    assert!(!crate::Bags::<Test>::contains_key(&bag_id))
                }
            }
        }
    }
}

pub struct UpdateNumberOfStorageBucketsInDynamicBagCreationPolicyFixture {
    origin: RawOrigin<u64>,
    new_storage_buckets_number: u64,
    dynamic_bag_type: DynamicBagType,
}

impl UpdateNumberOfStorageBucketsInDynamicBagCreationPolicyFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID),
            new_storage_buckets_number: 0,
            dynamic_bag_type: Default::default(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_new_storage_buckets_number(self, new_storage_buckets_number: u64) -> Self {
        Self {
            new_storage_buckets_number,
            ..self
        }
    }

    pub fn with_dynamic_bag_type(self, dynamic_bag_type: DynamicBagType) -> Self {
        Self {
            dynamic_bag_type,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_policy = Storage::get_dynamic_bag_creation_policy(self.dynamic_bag_type);

        let actual_result =
            Storage::update_number_of_storage_buckets_in_dynamic_bag_creation_policy(
                self.origin.clone().into(),
                self.dynamic_bag_type,
                self.new_storage_buckets_number,
            );

        assert_eq!(actual_result, expected_result);

        let new_policy = Storage::get_dynamic_bag_creation_policy(self.dynamic_bag_type);
        if actual_result.is_ok() {
            assert_eq!(
                new_policy.number_of_storage_buckets,
                self.new_storage_buckets_number
            );
        } else {
            assert_eq!(old_policy, new_policy);
        }
    }
}

pub struct CreateDistributionBucketFamilyFixture {
    origin: RawOrigin<u64>,
}

impl CreateDistributionBucketFamilyFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_ACCOUNT_ID),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) -> Option<u64> {
        let next_family_id = Storage::next_distribution_bucket_family_id();
        let family_number = Storage::distribution_bucket_family_number();
        let actual_result = Storage::create_distribution_bucket_family(self.origin.clone().into());

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                next_family_id + 1,
                Storage::next_distribution_bucket_family_id()
            );
            assert_eq!(
                family_number + 1,
                Storage::distribution_bucket_family_number()
            );
            assert!(<crate::DistributionBucketFamilyById<Test>>::contains_key(
                next_family_id
            ));

            Some(next_family_id)
        } else {
            assert_eq!(
                next_family_id,
                Storage::next_distribution_bucket_family_id()
            );
            assert_eq!(family_number, Storage::distribution_bucket_family_number());
            assert!(!<crate::DistributionBucketFamilyById<Test>>::contains_key(
                next_family_id
            ));

            None
        }
    }
}

pub struct DeleteDistributionBucketFamilyFixture {
    origin: RawOrigin<u64>,
    family_id: u64,
}

impl DeleteDistributionBucketFamilyFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_ACCOUNT_ID),
            family_id: Default::default(),
        }
    }

    pub fn with_family_id(self, family_id: u64) -> Self {
        Self { family_id, ..self }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let family_number = Storage::distribution_bucket_family_number();
        let actual_result =
            Storage::delete_distribution_bucket_family(self.origin.clone().into(), self.family_id);

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                family_number - 1,
                Storage::distribution_bucket_family_number()
            );
            assert!(!<crate::DistributionBucketFamilyById<Test>>::contains_key(
                self.family_id
            ));
        } else {
            assert_eq!(family_number, Storage::distribution_bucket_family_number());
        }
    }
}

pub struct CreateDistributionBucketFixture {
    origin: RawOrigin<u64>,
    family_id: u64,
    accept_new_bags: bool,
}

impl CreateDistributionBucketFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_ACCOUNT_ID),
            family_id: Default::default(),
            accept_new_bags: false,
        }
    }

    pub fn with_family_id(self, family_id: u64) -> Self {
        Self { family_id, ..self }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_accept_new_bags(self, accept_new_bags: bool) -> Self {
        Self {
            accept_new_bags,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) -> Option<u64> {
        let next_bucket_index = Storage::distribution_bucket_family_by_id(self.family_id)
            .next_distribution_bucket_index;
        let actual_result = Storage::create_distribution_bucket(
            self.origin.clone().into(),
            self.family_id,
            self.accept_new_bags,
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                next_bucket_index + 1,
                Storage::distribution_bucket_family_by_id(self.family_id)
                    .next_distribution_bucket_index
            );

            let bucket: DistributionBucket<Test> =
                Storage::distribution_bucket_by_family_id_by_index(
                    self.family_id,
                    next_bucket_index,
                );

            assert_eq!(bucket.accepting_new_bags, self.accept_new_bags);

            Some(next_bucket_index)
        } else {
            assert_eq!(
                next_bucket_index,
                Storage::distribution_bucket_family_by_id(self.family_id)
                    .next_distribution_bucket_index
            );

            None
        }
    }
}

pub struct UpdateDistributionBucketStatusFixture {
    origin: RawOrigin<u64>,
    family_id: u64,
    distribution_bucket_index: u64,
    new_status: bool,
}

impl UpdateDistributionBucketStatusFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID),
            family_id: Default::default(),
            distribution_bucket_index: Default::default(),
            new_status: false,
        }
    }
    pub fn with_bucket_index(self, bucket_index: u64) -> Self {
        Self {
            distribution_bucket_index: bucket_index,
            ..self
        }
    }

    pub fn with_family_id(self, family_id: u64) -> Self {
        Self { family_id, ..self }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_new_status(self, new_status: bool) -> Self {
        Self { new_status, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::update_distribution_bucket_status(
            self.origin.clone().into(),
            Storage::create_distribution_bucket_id(self.family_id, self.distribution_bucket_index),
            self.new_status,
        );

        assert_eq!(actual_result, expected_result);
    }
}

pub struct DeleteDistributionBucketFixture {
    origin: RawOrigin<u64>,
    family_id: u64,
    distribution_bucket_index: u64,
}

impl DeleteDistributionBucketFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID),
            family_id: Default::default(),
            distribution_bucket_index: Default::default(),
        }
    }

    pub fn with_bucket_index(self, bucket_index: u64) -> Self {
        Self {
            distribution_bucket_index: bucket_index,
            ..self
        }
    }

    pub fn with_family_id(self, family_id: u64) -> Self {
        Self { family_id, ..self }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::delete_distribution_bucket(
            self.origin.clone().into(),
            Storage::create_distribution_bucket_id(self.family_id, self.distribution_bucket_index),
        );

        assert_eq!(actual_result, expected_result);
    }
}

pub struct UpdateDistributionBucketForBagsFixture {
    origin: RawOrigin<u64>,
    bag_id: BagId<Test>,
    family_id: u64,
    add_bucket_indices: BTreeSet<u64>,
    remove_bucket_indices: BTreeSet<u64>,
}

impl UpdateDistributionBucketForBagsFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_ACCOUNT_ID),
            bag_id: Default::default(),
            family_id: Default::default(),
            add_bucket_indices: Default::default(),
            remove_bucket_indices: Default::default(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_add_bucket_indices(self, add_bucket_indices: BTreeSet<u64>) -> Self {
        Self {
            add_bucket_indices,
            ..self
        }
    }

    pub fn with_remove_bucket_indices(self, remove_bucket_indices: BTreeSet<u64>) -> Self {
        Self {
            remove_bucket_indices,
            ..self
        }
    }

    pub fn with_bag_id(self, bag_id: BagId<Test>) -> Self {
        Self { bag_id, ..self }
    }

    pub fn with_family_id(self, family_id: u64) -> Self {
        Self { family_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::update_distribution_buckets_for_bag(
            self.origin.clone().into(),
            self.bag_id.clone(),
            self.family_id,
            self.add_bucket_indices.clone(),
            self.remove_bucket_indices.clone(),
        );

        assert_eq!(actual_result, expected_result);
    }
}

pub struct UpdateDistributionBucketsPerBagLimitFixture {
    origin: RawOrigin<u64>,
    new_limit: u64,
}

impl UpdateDistributionBucketsPerBagLimitFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID),
            new_limit: 0,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_new_limit(self, new_limit: u64) -> Self {
        Self { new_limit, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_limit = Storage::distribution_buckets_per_bag_limit();

        let actual_result = Storage::update_distribution_buckets_per_bag_limit(
            self.origin.clone().into(),
            self.new_limit,
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                Storage::distribution_buckets_per_bag_limit(),
                self.new_limit
            );
        } else {
            assert_eq!(old_limit, Storage::distribution_buckets_per_bag_limit());
        }
    }
}

pub struct UpdateDistributionBucketModeFixture {
    origin: RawOrigin<u64>,
    family_id: u64,
    distribution_bucket_index: u64,
    distributing: bool,
}

impl UpdateDistributionBucketModeFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID),
            family_id: Default::default(),
            distribution_bucket_index: Default::default(),
            distributing: true,
        }
    }
    pub fn with_bucket_index(self, bucket_index: u64) -> Self {
        Self {
            distribution_bucket_index: bucket_index,
            ..self
        }
    }

    pub fn with_family_id(self, family_id: u64) -> Self {
        Self { family_id, ..self }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_distributing(self, distributing: bool) -> Self {
        Self {
            distributing,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::update_distribution_bucket_mode(
            self.origin.clone().into(),
            Storage::create_distribution_bucket_id(self.family_id, self.distribution_bucket_index),
            self.distributing,
        );

        assert_eq!(actual_result, expected_result);
    }
}

pub struct UpdateFamiliesInDynamicBagCreationPolicyFixture {
    origin: RawOrigin<u64>,
    dynamic_bag_type: DynamicBagType,
    families: BTreeMap<u64, u32>,
}

impl UpdateFamiliesInDynamicBagCreationPolicyFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID),
            dynamic_bag_type: Default::default(),
            families: Default::default(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_families(self, families: BTreeMap<u64, u32>) -> Self {
        Self { families, ..self }
    }

    pub fn with_dynamic_bag_type(self, dynamic_bag_type: DynamicBagType) -> Self {
        Self {
            dynamic_bag_type,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_policy = Storage::get_dynamic_bag_creation_policy(self.dynamic_bag_type);

        let actual_result = Storage::update_families_in_dynamic_bag_creation_policy(
            self.origin.clone().into(),
            self.dynamic_bag_type,
            self.families.clone(),
        );

        assert_eq!(actual_result, expected_result);

        let new_policy = Storage::get_dynamic_bag_creation_policy(self.dynamic_bag_type);
        assert_eq!(
            old_policy.number_of_storage_buckets,
            new_policy.number_of_storage_buckets
        );

        if actual_result.is_ok() {
            assert_eq!(new_policy.families, self.families);
        } else {
            assert_eq!(old_policy, new_policy);
        }
    }
}

pub struct InviteDistributionBucketOperatorFixture {
    origin: RawOrigin<u64>,
    operator_worker_id: u64,
    family_id: u64,
    bucket_index: u64,
}

impl InviteDistributionBucketOperatorFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_ACCOUNT_ID),
            operator_worker_id: DEFAULT_WORKER_ID,
            bucket_index: Default::default(),
            family_id: Default::default(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_operator_worker_id(self, operator_worker_id: u64) -> Self {
        Self {
            operator_worker_id,
            ..self
        }
    }

    pub fn with_bucket_index(self, bucket_index: u64) -> Self {
        Self {
            bucket_index,
            ..self
        }
    }

    pub fn with_family_id(self, family_id: u64) -> Self {
        Self { family_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::invite_distribution_bucket_operator(
            self.origin.clone().into(),
            Storage::create_distribution_bucket_id(self.family_id, self.bucket_index),
            self.operator_worker_id,
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            let new_bucket: DistributionBucket<Test> =
                Storage::distribution_bucket_by_family_id_by_index(
                    self.family_id,
                    self.bucket_index,
                );

            assert!(new_bucket
                .pending_invitations
                .contains(&self.operator_worker_id),);
        }
    }
}

pub struct CancelDistributionBucketInvitationFixture {
    origin: RawOrigin<u64>,
    bucket_index: u64,
    family_id: u64,
    operator_worker_id: u64,
}

impl CancelDistributionBucketInvitationFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID),
            bucket_index: Default::default(),
            family_id: Default::default(),
            operator_worker_id: Default::default(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_bucket_index(self, bucket_index: u64) -> Self {
        Self {
            bucket_index,
            ..self
        }
    }

    pub fn with_family_id(self, family_id: u64) -> Self {
        Self { family_id, ..self }
    }

    pub fn with_operator_worker_id(self, operator_worker_id: u64) -> Self {
        Self {
            operator_worker_id,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::cancel_distribution_bucket_operator_invite(
            self.origin.clone().into(),
            Storage::create_distribution_bucket_id(self.family_id, self.bucket_index),
            self.operator_worker_id,
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            let new_bucket: DistributionBucket<Test> =
                Storage::distribution_bucket_by_family_id_by_index(
                    self.family_id,
                    self.bucket_index,
                );

            assert!(!new_bucket
                .pending_invitations
                .contains(&self.operator_worker_id));
        }
    }
}

pub struct AcceptDistributionBucketInvitationFixture {
    origin: RawOrigin<u64>,
    bucket_index: u64,
    family_id: u64,
    worker_id: u64,
}

impl AcceptDistributionBucketInvitationFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID),
            bucket_index: Default::default(),
            family_id: Default::default(),
            worker_id: Default::default(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_bucket_index(self, bucket_index: u64) -> Self {
        Self {
            bucket_index,
            ..self
        }
    }

    pub fn with_family_id(self, family_id: u64) -> Self {
        Self { family_id, ..self }
    }

    pub fn with_worker_id(self, worker_id: u64) -> Self {
        Self { worker_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::accept_distribution_bucket_invitation(
            self.origin.clone().into(),
            self.worker_id,
            Storage::create_distribution_bucket_id(self.family_id, self.bucket_index),
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            let new_bucket: DistributionBucket<Test> =
                Storage::distribution_bucket_by_family_id_by_index(
                    self.family_id,
                    self.bucket_index,
                );

            assert!(!new_bucket.pending_invitations.contains(&self.worker_id));

            assert!(new_bucket.operators.contains(&self.worker_id));
        }
    }
}

pub struct SetDistributionBucketMetadataFixture {
    origin: RawOrigin<u64>,
    bucket_index: u64,
    family_id: u64,
    worker_id: u64,
    metadata: Vec<u8>,
}

impl SetDistributionBucketMetadataFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID),
            bucket_index: Default::default(),
            family_id: Default::default(),
            worker_id: Default::default(),
            metadata: Default::default(),
        }
    }

    pub fn with_metadata(self, metadata: Vec<u8>) -> Self {
        Self { metadata, ..self }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_bucket_index(self, bucket_index: u64) -> Self {
        Self {
            bucket_index,
            ..self
        }
    }

    pub fn with_family_id(self, family_id: u64) -> Self {
        Self { family_id, ..self }
    }

    pub fn with_worker_id(self, worker_id: u64) -> Self {
        Self { worker_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::set_distribution_operator_metadata(
            self.origin.clone().into(),
            self.worker_id,
            Storage::create_distribution_bucket_id(self.family_id, self.bucket_index),
            self.metadata.clone(),
        );

        assert_eq!(actual_result, expected_result);
    }
}

pub struct RemoveDistributionBucketOperatorFixture {
    origin: RawOrigin<u64>,
    bucket_index: u64,
    family_id: u64,
    operator_worker_id: u64,
}

impl RemoveDistributionBucketOperatorFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID),
            bucket_index: Default::default(),
            family_id: Default::default(),
            operator_worker_id: Default::default(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_bucket_index(self, bucket_index: u64) -> Self {
        Self {
            bucket_index,
            ..self
        }
    }

    pub fn with_family_id(self, family_id: u64) -> Self {
        Self { family_id, ..self }
    }

    pub fn with_operator_worker_id(self, operator_worker_id: u64) -> Self {
        Self {
            operator_worker_id,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::remove_distribution_bucket_operator(
            self.origin.clone().into(),
            Storage::create_distribution_bucket_id(self.family_id, self.bucket_index),
            self.operator_worker_id,
        );

        assert_eq!(actual_result, expected_result);
        if actual_result.is_ok() {
            let new_bucket: DistributionBucket<Test> =
                Storage::distribution_bucket_by_family_id_by_index(
                    self.family_id,
                    self.bucket_index,
                );

            assert!(!new_bucket.operators.contains(&self.operator_worker_id));
        }
    }
}

pub struct SetDistributionBucketFamilyMetadataFixture {
    origin: RawOrigin<u64>,
    family_id: u64,
    metadata: Vec<u8>,
}

impl SetDistributionBucketFamilyMetadataFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID),
            family_id: Default::default(),
            metadata: Default::default(),
        }
    }

    pub fn with_metadata(self, metadata: Vec<u8>) -> Self {
        Self { metadata, ..self }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_family_id(self, family_id: u64) -> Self {
        Self { family_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::set_distribution_bucket_family_metadata(
            self.origin.clone().into(),
            self.family_id,
            self.metadata.clone(),
        );

        assert_eq!(actual_result, expected_result);
    }
}

// helper methods
impl CreateStorageBucketFixture {
    pub fn create_several(&self, bucket_number: u64) -> BTreeSet<u64> {
        let mut bucket_ids = BTreeSet::new();
        for _ in 0..bucket_number {
            let bucket_id = self.call_and_assert(Ok(())).unwrap();
            bucket_ids.insert(bucket_id);
        }
        bucket_ids
    }
}

// wrapper to silence compiler error
fn into_str(err: DispatchError) -> &'static str {
    err.into()
}
