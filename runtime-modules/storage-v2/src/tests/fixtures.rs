use frame_support::dispatch::DispatchResult;
use frame_support::storage::StorageMap;
use frame_support::traits::{Currency, OnFinalize, OnInitialize};
use frame_system::{EventRecord, Phase, RawOrigin};
use sp_std::collections::btree_set::BTreeSet;

use super::mocks::{
    Balances, Storage, System, Test, TestEvent, DEFAULT_MEMBER_ACCOUNT_ID,
    DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID, WG_LEADER_ACCOUNT_ID,
};

use crate::{
    BagId, ContentId, DataObjectCreationParameters, DataObjectStorage, DynamicBagId,
    ObjectsInBagParams, RawEvent, StaticBagId, StorageBucketOperatorStatus,
    UpdateStorageBucketForBagsParams, UploadParameters,
};

// Recommendation from Parity on testing on_finalize
// https://substrate.dev/docs/en/next/development/module/tests
pub fn run_to_block(n: u64) {
    while System::block_number() < n {
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        <Storage as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
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
            UpdateStorageBucketForBagsParams<Test>,
            u64,
            UploadParameters<Test>,
            ObjectsInBagParams<Test>,
            BagId<Test>,
            DynamicBagId<Test>,
            u64,
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
            UpdateStorageBucketForBagsParams<Test>,
            u64,
            UploadParameters<Test>,
            ObjectsInBagParams<Test>,
            BagId<Test>,
            DynamicBagId<Test>,
            u64,
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
            accepting_new_bags: false,
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
        let buckets_number = Storage::storage_buckets_number();
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
            assert_eq!(buckets_number + 1, Storage::storage_buckets_number());
            assert!(<crate::StorageBucketById<Test>>::contains_key(
                next_storage_bucket_id
            ));

            Some(next_storage_bucket_id)
        } else {
            assert_eq!(next_storage_bucket_id, Storage::next_storage_bucket_id());
            assert_eq!(buckets_number, Storage::storage_buckets_number());
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
}

impl AcceptStorageBucketInvitationFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_ACCOUNT_ID),
            worker_id: DEFAULT_WORKER_ID,
            storage_bucket_id: Default::default(),
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

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_bucket = Storage::storage_bucket_by_id(self.storage_bucket_id);

        let actual_result = Storage::accept_storage_bucket_invitation(
            self.origin.clone().into(),
            self.worker_id,
            self.storage_bucket_id,
        );

        assert_eq!(actual_result, expected_result);

        let new_bucket = Storage::storage_bucket_by_id(self.storage_bucket_id);
        if actual_result.is_ok() {
            assert_eq!(
                new_bucket.operator_status,
                StorageBucketOperatorStatus::StorageWorker(self.worker_id)
            );
        } else {
            assert_eq!(old_bucket, new_bucket);
        }
    }
}

pub struct UpdateStorageBucketForBagsFixture {
    origin: RawOrigin<u64>,
    params: UpdateStorageBucketForBagsParams<Test>,
}

impl UpdateStorageBucketForBagsFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_ACCOUNT_ID),
            params: Default::default(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_params(self, params: UpdateStorageBucketForBagsParams<Test>) -> Self {
        Self { params, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::update_storage_buckets_for_bags(
            self.origin.clone().into(),
            self.params.clone(),
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
            size: 10 * idx as u64,
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
        let old_metadata = Storage::storage_bucket_by_id(self.storage_bucket_id).metadata;
        let actual_result = Storage::set_storage_operator_metadata(
            self.origin.clone().into(),
            self.worker_id,
            self.storage_bucket_id,
            self.metadata.clone(),
        );

        assert_eq!(actual_result, expected_result);
        let new_metadata = Storage::storage_bucket_by_id(self.storage_bucket_id).metadata;

        if actual_result.is_ok() {
            assert_eq!(new_metadata, self.metadata);
        } else {
            assert_eq!(old_metadata, new_metadata);
        }
    }
}

pub struct AcceptPendingDataObjectsFixture {
    origin: RawOrigin<u64>,
    worker_id: u64,
    storage_bucket_id: u64,
    params: ObjectsInBagParams<Test>,
}

impl AcceptPendingDataObjectsFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID),
            worker_id: DEFAULT_WORKER_ID,
            storage_bucket_id: Default::default(),
            params: Default::default(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_worker_id(self, worker_id: u64) -> Self {
        Self { worker_id, ..self }
    }

    pub fn with_params(self, params: ObjectsInBagParams<Test>) -> Self {
        Self { params, ..self }
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
            self.params.clone(),
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
            origin: RawOrigin::Signed(WG_LEADER_ACCOUNT_ID),
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
            origin: RawOrigin::Signed(WG_LEADER_ACCOUNT_ID),
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
            src_bag_id: BagId::<Test>::StaticBag(StaticBagId::Council),
            dest_bag_id: BagId::<Test>::StaticBag(StaticBagId::Council),
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
    worker_id: u64,
    storage_bucket_id: u64,
    new_status: bool,
}

impl UpdateStorageBucketStatusFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID),
            worker_id: DEFAULT_WORKER_ID,
            storage_bucket_id: Default::default(),
            new_status: false,
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

    pub fn with_new_status(self, new_status: bool) -> Self {
        Self { new_status, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::update_storage_bucket_status(
            self.origin.clone().into(),
            self.worker_id,
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
    remove_hashes: BTreeSet<ContentId>,
    add_hashes: BTreeSet<ContentId>,
}

impl UpdateBlacklistFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(WG_LEADER_ACCOUNT_ID),
            remove_hashes: BTreeSet::new(),
            add_hashes: BTreeSet::new(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_add_hashes(self, add_hashes: BTreeSet<ContentId>) -> Self {
        Self { add_hashes, ..self }
    }

    pub fn with_remove_hashes(self, remove_hashes: BTreeSet<ContentId>) -> Self {
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

pub struct DeleteDynamicBagsFixture {
    bag_id: DynamicBagId<Test>,
    deletion_account_id: u64,
}

impl DeleteDynamicBagsFixture {
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
