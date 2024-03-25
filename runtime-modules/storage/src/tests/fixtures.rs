use crate::BalanceOf;
use derive_fixture::Fixture;
use derive_new::new;
use frame_support::dispatch::DispatchResult;
use frame_support::storage::StorageMap;
use frame_support::traits::{Currency, OnFinalize, OnInitialize};
use frame_support::{assert_noop, assert_ok};
use frame_system::{EventRecord, Phase, RawOrigin};
use sp_std::collections::btree_map::BTreeMap;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::iter::FromIterator;

use crate::sp_api_hidden_includes_decl_storage::hidden_include::{
    IterableStorageDoubleMap, StorageDoubleMap, StorageValue,
};

use super::mocks::{
    create_cid, Balances, CollectiveFlip, RuntimeEvent as TestEvent, Storage, System, Test,
    DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID, DEFAULT_MEMBER_ACCOUNT_ID, DEFAULT_MEMBER_ID,
    DEFAULT_STORAGE_BUCKET_OBJECTS_LIMIT, DEFAULT_STORAGE_BUCKET_SIZE_LIMIT,
    DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID, DISTRIBUTION_WG_LEADER_ACCOUNT_ID,
    STORAGE_WG_LEADER_ACCOUNT_ID, VOUCHER_OBJECTS_LIMIT, VOUCHER_SIZE_LIMIT,
};

use crate::{
    BagId, DataObjectCreationParameters, DataObjectPerMegabyteFee, DataObjectStateBloatBondValue,
    DataObjectStorage, DistributionBucket, DistributionBucketId, DynBagCreationParameters,
    DynamicBagId, DynamicBagType, RawEvent, StorageBucketOperatorStatus, UploadParameters,
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
    let _ = Balances::deposit_creating(account_id, balance);
}

pub fn set_data_object_per_mega_byte_fee(mb_fee: u64) {
    DataObjectPerMegabyteFee::<Test>::put(mb_fee);
}

pub fn set_data_object_state_bloat_bond_value(state_bloat_bond: u64) {
    DataObjectStateBloatBondValue::<Test>::put(state_bloat_bond);
}

pub fn set_max_voucher_limits() {
    set_max_voucher_limits_with_params(VOUCHER_SIZE_LIMIT, VOUCHER_OBJECTS_LIMIT);
}

pub fn set_max_voucher_limits_with_params(size_limit: u64, objects_limit: u64) {
    UpdateStorageBucketsVoucherMaxLimitsFixture::new()
        .with_new_objects_size_limit(size_limit)
        .with_new_objects_number_limit(objects_limit)
        .call_and_assert(Ok(()));
}

pub fn create_storage_buckets(buckets_number: u32) -> BTreeSet<u64> {
    set_max_voucher_limits();
    CreateStorageBucketFixture::new()
        .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
        .with_objects_limit(DEFAULT_STORAGE_BUCKET_OBJECTS_LIMIT)
        .with_size_limit(DEFAULT_STORAGE_BUCKET_SIZE_LIMIT)
        .create_several(buckets_number)
}

pub fn create_default_storage_bucket_and_assign_to_bag(bag_id: BagId<Test>) -> u64 {
    let objects_limit = 1;
    let size_limit = 100;

    create_storage_bucket_and_assign_to_bag(bag_id, None, objects_limit, size_limit)
}

pub fn create_storage_bucket_and_assign_to_bag(
    bag_id: BagId<Test>,
    storage_provider_id: Option<u64>,
    objects_limit: u64,
    size_limit: u64,
) -> u64 {
    set_max_voucher_limits();
    set_default_update_storage_buckets_per_bag_limit();

    let bucket_id = CreateStorageBucketFixture::new()
        .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
        .with_invite_worker(storage_provider_id)
        .with_objects_limit(objects_limit)
        .with_size_limit(size_limit)
        .call_and_assert(Ok(()))
        .unwrap();

    let buckets = BTreeSet::from_iter(vec![bucket_id]);

    UpdateStorageBucketForBagsFixture::new()
        .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
        .with_bag_id(bag_id)
        .with_add_bucket_ids(buckets)
        .call_and_assert(Ok(()));

    if let Some(storage_provider_id) = storage_provider_id {
        AcceptStorageBucketInvitationFixture::new()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_transactor_account_id(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID)
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Ok(()));
    }

    bucket_id
}

pub fn set_update_storage_buckets_per_bag_limit(new_limit: u32) {
    UpdateStorageBucketsPerBagLimitFixture::new()
        .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
        .with_new_limit(new_limit)
        .call_and_assert(Ok(()))
}

pub fn set_default_update_storage_buckets_per_bag_limit() {
    let new_limit = 7;

    set_update_storage_buckets_per_bag_limit(new_limit);
}

pub fn init_module_acc_balance() -> BalanceOf<Test> {
    <Test as crate::Config>::ModuleAccountInitialBalance::get() as u64
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
            DynBagCreationParameters<Test>,
        >,
    ) {
        let converted_event = TestEvent::Storage(expected_raw_event);

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
            DynBagCreationParameters<Test>,
        >,
    ) {
        let converted_event = TestEvent::Storage(expected_raw_event);

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

pub const DEFAULT_ACCOUNT_ID: u64 = 1;
pub const DEFAULT_WORKER_ID: u64 = 1;
pub const DEFAULT_DATA_OBJECTS_NUMBER: u64 = DEFAULT_STORAGE_BUCKET_OBJECTS_LIMIT / 2;
pub const DEFAULT_DATA_OBJECTS_SIZE: u64 =
    DEFAULT_STORAGE_BUCKET_SIZE_LIMIT / DEFAULT_DATA_OBJECTS_NUMBER - 1;

#[derive(Fixture, new)]
pub struct CreateStorageBucketFixture {
    #[new(value = "RawOrigin::Signed(DEFAULT_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    invite_worker: Option<u64>,

    #[new(value = "true")]
    accepting_new_bags: bool,

    #[new(default)]
    size_limit: u64,

    #[new(default)]
    objects_limit: u64,
}

impl CreateStorageBucketFixture {
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

#[derive(Fixture, new)]
pub struct AcceptStorageBucketInvitationFixture {
    #[new(value = "RawOrigin::Signed(DEFAULT_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(value = "DEFAULT_WORKER_ID")]
    worker_id: u64,

    #[new(default)]
    storage_bucket_id: u64,

    #[new(value = "DEFAULT_ACCOUNT_ID")]
    transactor_account_id: u64,
}

impl AcceptStorageBucketInvitationFixture {
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
            let new_bucket = new_bucket.expect("Bucket Must Exist");
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

#[derive(Fixture, new)]
pub struct UpdateStorageBucketForBagsFixture {
    #[new(value = "RawOrigin::Signed(DEFAULT_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    bag_id: BagId<Test>,

    #[new(default)]
    add_bucket_ids: BTreeSet<u64>,

    #[new(default)]
    remove_bucket_ids: BTreeSet<u64>,
}

impl UpdateStorageBucketForBagsFixture {
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

#[derive(Fixture, Default)]
pub struct UploadFixture {
    params: UploadParameters<Test>,
}

impl UploadFixture {
    pub fn with_expected_data_object_state_bloat_bond(
        self,
        expected_data_object_state_bloat_bond: u64,
    ) -> Self {
        Self {
            params: UploadParameters::<Test> {
                expected_data_object_state_bloat_bond,
                ..self.params
            },
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let balance_pre = Balances::usable_balance(self.params.state_bloat_bond_source_account_id);
        let bag_pre = <crate::Bags<Test>>::get(&self.params.bag_id);
        let buckets_pre = bag_pre
            .stored_by
            .iter()
            .map(|id| <crate::StorageBucketById<Test>>::get(id).expect("Storage Bag Must Exist"))
            .clone()
            .collect::<Vec<_>>();

        let state_bloat_bond = self
            .params
            .object_creation_list
            .iter()
            .fold(0u64, |acc, _| {
                acc.saturating_add(Storage::data_object_state_bloat_bond_value())
            });
        let total_size_added = self
            .params
            .object_creation_list
            .iter()
            .fold(0u64, |acc, param| acc.saturating_add(param.size));
        let total_number_added = self.params.object_creation_list.len() as u64;
        let upload_fee = Storage::calculate_data_storage_fee(total_size_added);

        let start_id = Storage::next_data_object_id();

        let actual_result = Storage::upload_data_objects(self.params.clone());

        let balance_post = Balances::usable_balance(self.params.state_bloat_bond_source_account_id);
        let bag_post = <crate::Bags<Test>>::get(&self.params.bag_id);
        let buckets_post = bag_post
            .stored_by
            .iter()
            .map(|id| <crate::StorageBucketById<Test>>::get(id).expect("Storage Bag Must Exist"))
            .clone()
            .collect::<Vec<_>>();
        let end_id = Storage::next_data_object_id();

        if expected_result.is_ok() {
            assert_ok!(actual_result);
            // balance check
            assert_eq!(
                balance_pre.saturating_sub(balance_post),
                upload_fee.saturating_add(state_bloat_bond)
            );

            // bag size increased
            assert_eq!(
                bag_post
                    .objects_total_size
                    .saturating_sub(bag_pre.objects_total_size),
                total_size_added
            );

            // bag object number increased
            assert_eq!(
                bag_post
                    .objects_number
                    .saturating_sub(bag_pre.objects_number),
                total_number_added
            );

            // storage bucket vouchers have size increased
            assert!(buckets_pre
                .iter()
                .zip(buckets_post.iter())
                .all(
                    |(pre, post)| post.voucher.size_used.saturating_sub(pre.voucher.size_used)
                        == total_size_added
                ));

            // storage bucket voucher have obj number increased
            assert!(buckets_pre
                .iter()
                .zip(buckets_post.iter())
                .all(|(pre, post)| post
                    .voucher
                    .objects_used
                    .saturating_sub(pre.voucher.objects_used)
                    == total_number_added));

            // check next data object ID
            assert_eq!(end_id.saturating_sub(start_id), total_number_added);

            // objects existing on storage
            assert!((start_id..end_id)
                .all(|id| <crate::DataObjectsById<Test>>::contains_key(&self.params.bag_id, id)));
        } else {
            assert_noop!(actual_result, expected_result.err().unwrap());
            assert_eq!(start_id, end_id);
            assert_eq!(balance_pre, balance_post);

            // bag size NOT increased
            assert_eq!(bag_post.objects_total_size, bag_pre.objects_total_size);

            // bag object number NOT increased
            assert_eq!(bag_post.objects_number, bag_pre.objects_number);

            // storage bucket vouchers do NOT have size increased
            assert!(buckets_pre
                .iter()
                .zip(buckets_post.iter())
                .all(|(pre, post)| post.voucher.size_used == pre.voucher.size_used));

            // storage bucket vouchers do NOT have obj number increased
            assert!(buckets_pre
                .iter()
                .zip(buckets_post.iter())
                .all(|(pre, post)| post.voucher.objects_used == pre.voucher.objects_used));
        }
    }
}

pub fn create_data_object_candidates_with_size(
    starting_index: u8,
    number: u8,
    size: u64,
) -> Vec<DataObjectCreationParameters> {
    let range = starting_index..(starting_index + number);

    range
        .into_iter()
        .map(|idx| {
            let ipfs_content_id = create_cid(idx.into());

            DataObjectCreationParameters {
                size,
                ipfs_content_id,
            }
        })
        .collect()
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
            ipfs_content_id: create_cid(idx.into()),
        })
        .collect()
}

pub fn create_single_data_object() -> Vec<DataObjectCreationParameters> {
    create_data_object_candidates(1, 1)
}

#[derive(Fixture, new)]
pub struct SetStorageOperatorMetadataFixture {
    #[new(value = "RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(value = "DEFAULT_WORKER_ID")]
    worker_id: u64,

    #[new(default)]
    storage_bucket_id: u64,

    #[new(default)]
    metadata: Vec<u8>,
}

impl SetStorageOperatorMetadataFixture {
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

#[derive(Fixture, new)]
pub struct AcceptPendingDataObjectsFixture {
    #[new(value = "RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(value = "DEFAULT_WORKER_ID")]
    worker_id: u64,

    #[new(default)]
    storage_bucket_id: u64,

    #[new(default)]
    bag_id: BagId<Test>,

    #[new(default)]
    data_object_ids: BTreeSet<u64>,
}

impl AcceptPendingDataObjectsFixture {
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

#[derive(Fixture, new)]
pub struct CancelStorageBucketInvitationFixture {
    #[new(value = "RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    storage_bucket_id: u64,
}

impl CancelStorageBucketInvitationFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_bucket = Storage::storage_bucket_by_id(self.storage_bucket_id);

        let actual_result = Storage::cancel_storage_bucket_operator_invite(
            self.origin.clone().into(),
            self.storage_bucket_id,
        );

        assert_eq!(actual_result, expected_result);

        let new_bucket = Storage::storage_bucket_by_id(self.storage_bucket_id);
        if actual_result.is_ok() {
            let new_bucket = new_bucket.expect("Bucket Must Exist");
            assert_eq!(
                new_bucket.operator_status,
                StorageBucketOperatorStatus::Missing
            );
        } else {
            assert_eq!(old_bucket, new_bucket);
        }
    }
}

#[derive(Fixture, new)]
pub struct InviteStorageBucketOperatorFixture {
    #[new(value = "RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(value = "DEFAULT_WORKER_ID")]
    operator_worker_id: u64,

    #[new(default)]
    storage_bucket_id: u64,
}

impl InviteStorageBucketOperatorFixture {
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
            let new_bucket = new_bucket.expect("Bucket Must Exist");
            assert_eq!(
                new_bucket.operator_status,
                StorageBucketOperatorStatus::InvitedStorageWorker(self.operator_worker_id)
            );
        } else {
            assert_eq!(old_bucket, new_bucket);
        }
    }
}

#[derive(Fixture, new)]
pub struct UpdateUploadingBlockedStatusFixture {
    #[new(value = "RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    new_status: bool,
}

impl UpdateUploadingBlockedStatusFixture {
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

#[derive(Fixture, Default)]
pub struct MoveDataObjectsFixture {
    src_bag_id: BagId<Test>,
    dest_bag_id: BagId<Test>,
    data_object_ids: BTreeSet<u64>,
}

impl MoveDataObjectsFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::move_data_objects(
            self.src_bag_id.clone(),
            self.dest_bag_id.clone(),
            self.data_object_ids.clone(),
        );

        assert_eq!(actual_result, expected_result);
    }
}

#[derive(Fixture, new)]
pub struct DeleteDataObjectsFixture {
    #[new(value = "DEFAULT_ACCOUNT_ID")]
    state_bloat_bond_account_id: u64,

    #[new(default)]
    bag_id: BagId<Test>,

    #[new(default)]
    data_object_ids: BTreeSet<u64>,
}

impl DeleteDataObjectsFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let balance_pre = Balances::usable_balance(self.state_bloat_bond_account_id);
        let bag_pre = <crate::Bags<Test>>::get(&self.bag_id);
        let buckets_pre = bag_pre
            .stored_by
            .iter()
            .map(|id| <crate::StorageBucketById<Test>>::get(id).expect("Storage Bag Must Exist"))
            .clone()
            .collect::<Vec<_>>();

        let state_bloat_bond = self.data_object_ids.iter().fold(0u64, |acc, id| {
            acc.saturating_add(
                Storage::data_object_by_id(&self.bag_id, id)
                    .state_bloat_bond
                    .amount,
            )
        });

        let total_size_removed = self.data_object_ids.iter().fold(0u64, |acc, id| {
            acc.saturating_add(Storage::data_object_by_id(&self.bag_id, id).size)
        });

        let total_number_removed = self.data_object_ids.len() as u64;

        let actual_result = Storage::delete_data_objects(
            self.state_bloat_bond_account_id,
            self.bag_id.clone(),
            self.data_object_ids.clone(),
        );

        assert_eq!(actual_result, expected_result);

        let balance_post = Balances::usable_balance(self.state_bloat_bond_account_id);
        let bag_post = <crate::Bags<Test>>::get(&self.bag_id);
        let buckets_post = bag_post
            .stored_by
            .iter()
            .map(|id| <crate::StorageBucketById<Test>>::get(id).expect("Storage Bag Must Exist"))
            .clone()
            .collect::<Vec<_>>();

        if actual_result.is_ok() {
            // state bloat bond is given back

            assert_eq!(balance_post.saturating_sub(balance_pre), state_bloat_bond);

            // objects are removed
            assert!(self
                .data_object_ids
                .iter()
                .all(|id| !<crate::DataObjectsById<Test>>::contains_key(&self.bag_id, id)));

            // bag used capacity updated
            assert_eq!(
                bag_pre
                    .objects_total_size
                    .saturating_sub(bag_post.objects_total_size),
                total_size_removed
            );

            assert_eq!(
                bag_pre
                    .objects_number
                    .saturating_sub(bag_post.objects_number),
                total_number_removed
            );

            // storage used capacity updated
            assert!(buckets_pre
                .iter()
                .zip(buckets_post.iter())
                .all(
                    |(lhs, rhs)| lhs.voucher.size_used.saturating_sub(rhs.voucher.size_used)
                        == total_size_removed
                ));

            assert!(buckets_pre
                .iter()
                .zip(buckets_post.iter())
                .all(|(lhs, rhs)| lhs
                    .voucher
                    .objects_used
                    .saturating_sub(rhs.voucher.objects_used)
                    == total_number_removed));
        }
    }
}

#[derive(Fixture, new)]
pub struct UpdateStorageBucketStatusFixture {
    #[new(value = "RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    storage_bucket_id: u64,

    #[new(default)]
    new_status: bool,
}

impl UpdateStorageBucketStatusFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::update_storage_bucket_status(
            self.origin.clone().into(),
            self.storage_bucket_id,
            self.new_status,
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            let bucket =
                Storage::storage_bucket_by_id(self.storage_bucket_id).expect("Bucket Must Exist");

            assert_eq!(bucket.accepting_new_bags, self.new_status);
        }
    }
}

#[derive(Fixture, new)]
pub struct UpdateBlacklistFixture {
    #[new(value = "RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    remove_hashes: BTreeSet<Vec<u8>>,

    #[new(default)]
    add_hashes: BTreeSet<Vec<u8>>,
}

impl UpdateBlacklistFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::update_blacklist(
            self.origin.clone().into(),
            self.remove_hashes.clone(),
            self.add_hashes.clone(),
        );

        assert_eq!(actual_result, expected_result);
    }
}

#[derive(Fixture, new)]
pub struct DeleteDynamicBagFixture {
    #[new(default)]
    bag_id: DynamicBagId<Test>,

    #[new(value = "DEFAULT_ACCOUNT_ID")]
    deletion_account_id: u64,
}

impl DeleteDynamicBagFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let bag_id: BagId<Test> = self.bag_id.clone().into();
        let balance_pre = Balances::usable_balance(self.deletion_account_id);
        let bag = <crate::Bags<Test>>::get(&bag_id);
        let s_buckets_pre = bag
            .stored_by
            .iter()
            .map(|id| <crate::StorageBucketById<Test>>::get(id).expect("Storage Bag Must Exist"))
            .clone()
            .collect::<Vec<_>>();

        let d_buckets_pre = bag
            .distributed_by
            .iter()
            .map(|id| {
                <crate::DistributionBucketByFamilyIdById<Test>>::get(
                    id.distribution_bucket_family_id,
                    id.distribution_bucket_index,
                )
            })
            .clone()
            .collect::<Vec<_>>();

        let state_bloat_bond = <crate::DataObjectsById<Test>>::iter_prefix(&bag_id)
            .fold(0, |acc: u64, (_, obj)| {
                acc.saturating_add(obj.state_bloat_bond.amount)
            });

        let total_size_removed = bag.objects_total_size;
        let total_number_removed = bag.objects_number;

        let actual_result =
            Storage::delete_dynamic_bag(&self.deletion_account_id, self.bag_id.clone());

        assert_eq!(actual_result, expected_result);

        let balance_post = Balances::usable_balance(self.deletion_account_id);
        let s_buckets_post = bag
            .stored_by
            .iter()
            .map(|id| <crate::StorageBucketById<Test>>::get(id).expect("Storage Bag Must Exist"))
            .clone()
            .collect::<Vec<_>>();

        let d_buckets_post = bag
            .distributed_by
            .iter()
            .map(|id| {
                <crate::DistributionBucketByFamilyIdById<Test>>::get(
                    id.distribution_bucket_family_id,
                    id.distribution_bucket_index,
                )
            })
            .clone()
            .collect::<Vec<_>>();

        if actual_result.is_ok() {
            assert!(!<crate::Bags<Test>>::contains_key(&bag_id));

            assert_eq!(balance_post.saturating_sub(balance_pre), state_bloat_bond);

            assert!(s_buckets_post
                .iter()
                .zip(s_buckets_pre.iter())
                .all(|(pre, post)| post.assigned_bags.saturating_sub(pre.assigned_bags) == 1));
            assert!(d_buckets_post
                .iter()
                .zip(d_buckets_pre.iter())
                .all(|(pre, post)| post.assigned_bags.saturating_sub(pre.assigned_bags) == 1));

            // every bucket has voucher.size_used decreased by total_size_removed
            assert!(s_buckets_post
                .iter()
                .zip(s_buckets_pre.iter())
                .all(
                    |(pre, post)| post.voucher.size_used.saturating_sub(pre.voucher.size_used)
                        == total_size_removed
                ));

            // every bucket has voucher.objects_used decreased by total_number_removed
            assert!(s_buckets_post
                .iter()
                .zip(s_buckets_pre.iter())
                .all(|(pre, post)| post
                    .voucher
                    .objects_used
                    .saturating_sub(pre.voucher.objects_used)
                    == total_number_removed));
        }
    }
}

#[derive(Fixture, new)]
pub struct DeleteStorageBucketFixture {
    #[new(value = "RawOrigin::Signed(DEFAULT_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    storage_bucket_id: u64,
}

impl DeleteStorageBucketFixture {
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

#[derive(Fixture, new)]
pub struct RemoveStorageBucketOperatorFixture {
    #[new(value = "RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    storage_bucket_id: u64,
}

impl RemoveStorageBucketOperatorFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_bucket = Storage::storage_bucket_by_id(self.storage_bucket_id);

        let actual_result = Storage::remove_storage_bucket_operator(
            self.origin.clone().into(),
            self.storage_bucket_id,
        );

        assert_eq!(actual_result, expected_result);

        let new_bucket = Storage::storage_bucket_by_id(self.storage_bucket_id);
        if actual_result.is_ok() {
            let new_bucket = new_bucket.expect("Bucket Must Exist");
            assert_eq!(
                new_bucket.operator_status,
                StorageBucketOperatorStatus::Missing
            );
        } else {
            assert_eq!(old_bucket, new_bucket);
        }
    }
}

#[derive(Fixture, new)]
pub struct UpdateDataObjectPerMegabyteFeeFixture {
    #[new(value = "RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    new_fee: u64,
}

impl UpdateDataObjectPerMegabyteFeeFixture {
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

#[derive(Fixture, new)]
pub struct UpdateStorageBucketsPerBagLimitFixture {
    #[new(value = "RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    new_limit: u32,
}

impl UpdateStorageBucketsPerBagLimitFixture {
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

#[derive(Fixture, new)]
pub struct SetStorageBucketVoucherLimitsFixture {
    #[new(value = "RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    storage_bucket_id: u64,

    #[new(default)]
    new_objects_size_limit: u64,

    #[new(default)]
    new_objects_number_limit: u64,
}

impl SetStorageBucketVoucherLimitsFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_bucket = Storage::storage_bucket_by_id(self.storage_bucket_id);

        let actual_result = Storage::set_storage_bucket_voucher_limits(
            self.origin.clone().into(),
            self.storage_bucket_id,
            self.new_objects_size_limit,
            self.new_objects_number_limit,
        );

        assert_eq!(actual_result, expected_result);
        let new_bucket = Storage::storage_bucket_by_id(self.storage_bucket_id);

        if actual_result.is_ok() {
            let new_voucher = new_bucket.expect("Bucket Must Exist").voucher;
            assert_eq!(self.new_objects_size_limit, new_voucher.size_limit);
            assert_eq!(self.new_objects_number_limit, new_voucher.objects_limit);
        } else {
            assert_eq!(old_bucket, new_bucket);
        }
    }
}

#[derive(Fixture, new)]
pub struct UpdateStorageBucketsVoucherMaxLimitsFixture {
    #[new(value = "RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    new_objects_size_limit: u64,

    #[new(default)]
    new_objects_number_limit: u64,
}

impl UpdateStorageBucketsVoucherMaxLimitsFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_size_limit = Storage::voucher_max_objects_size_limit();
        let old_number_limit = Storage::voucher_max_objects_number_limit();

        let actual_result = Storage::update_storage_buckets_voucher_max_limits(
            self.origin.clone().into(),
            self.new_objects_size_limit,
            self.new_objects_number_limit,
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

#[derive(Fixture, Default)]
pub struct CreateDynamicBagFixture {
    params: DynBagCreationParameters<Test>,
}

impl CreateDynamicBagFixture {
    pub fn default() -> Self {
        Self {
            params: DynBagCreationParameters::<Test> {
                bag_id: DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID),
                state_bloat_bond_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
                expected_data_object_state_bloat_bond: Storage::data_object_state_bloat_bond_value(
                ),
                expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
                ..Default::default()
            },
        }
    }

    pub fn with_state_bloat_bond_account_id(self, state_bloat_bond_account_id: u64) -> Self {
        Self {
            params: DynBagCreationParameters::<Test> {
                state_bloat_bond_source_account_id: state_bloat_bond_account_id,
                ..self.params
            },
        }
    }

    pub fn with_storage_buckets(self, storage_buckets: BTreeSet<u64>) -> Self {
        Self {
            params: DynBagCreationParameters::<Test> {
                storage_buckets,
                ..self.params
            },
        }
    }

    pub fn with_distribution_buckets(
        self,
        distribution_buckets: BTreeSet<crate::DistributionBucketId<Test>>,
    ) -> Self {
        Self {
            params: DynBagCreationParameters::<Test> {
                distribution_buckets,
                ..self.params
            },
        }
    }

    pub fn with_bag_id(self, bag_id: DynamicBagId<Test>) -> Self {
        Self {
            params: DynBagCreationParameters::<Test> {
                bag_id,
                ..self.params
            },
            ..self
        }
    }

    pub fn with_objects(self, object_creation_list: Vec<DataObjectCreationParameters>) -> Self {
        Self {
            params: DynBagCreationParameters::<Test> {
                object_creation_list,
                ..self.params
            },
            ..self
        }
    }

    pub fn with_expected_data_size_fee(self, expected_data_size_fee: u64) -> Self {
        Self {
            params: DynBagCreationParameters::<Test> {
                expected_data_size_fee,
                ..self.params
            },
            ..self
        }
    }

    pub fn with_expected_data_object_state_bloat_bond(
        self,
        expected_data_object_state_bloat_bond: u64,
    ) -> Self {
        Self {
            params: DynBagCreationParameters::<Test> {
                expected_data_object_state_bloat_bond,
                ..self.params
            },
            ..self
        }
    }

    pub fn get_params(&self) -> DynBagCreationParameters<Test> {
        self.params.clone()
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::create_dynamic_bag(self.params.clone());

        if expected_result.is_ok() {
            assert_ok!(actual_result);
            let bag_id: BagId<Test> = self.params.bag_id.clone().into();
            assert!(<crate::Bags<Test>>::contains_key(&bag_id));

            let bag = <crate::Bags<Test>>::get(&bag_id);
            assert!(!bag.stored_by.is_empty());
        } else {
            assert_noop!(actual_result, expected_result.err().unwrap());
        }
    }
}

#[derive(Fixture, new)]
pub struct UpdateNumberOfStorageBucketsInDynamicBagCreationPolicyFixture {
    #[new(value = "RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    new_storage_buckets_number: u32,

    #[new(default)]
    dynamic_bag_type: DynamicBagType,
}

impl UpdateNumberOfStorageBucketsInDynamicBagCreationPolicyFixture {
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

#[derive(Fixture, new)]
pub struct CreateDistributionBucketFamilyFixture {
    #[new(value = "RawOrigin::Signed(DEFAULT_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,
}

impl CreateDistributionBucketFamilyFixture {
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

#[derive(Fixture, new)]
pub struct DeleteDistributionBucketFamilyFixture {
    #[new(value = "RawOrigin::Signed(DEFAULT_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    family_id: u64,
}

impl DeleteDistributionBucketFamilyFixture {
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

#[derive(Fixture, new)]
pub struct CreateDistributionBucketFixture {
    #[new(value = "RawOrigin::Signed(DEFAULT_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    family_id: u64,

    #[new(default)]
    accept_new_bags: bool,
}

impl CreateDistributionBucketFixture {
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

#[derive(Fixture, new)]
pub struct UpdateDistributionBucketStatusFixture {
    #[new(value = "RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    family_id: u64,

    #[new(default)]
    distribution_bucket_index: u64,

    #[new(default)]
    new_status: bool,
}

impl UpdateDistributionBucketStatusFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::update_distribution_bucket_status(
            self.origin.clone().into(),
            Storage::create_distribution_bucket_id(self.family_id, self.distribution_bucket_index),
            self.new_status,
        );

        assert_eq!(actual_result, expected_result);
    }
}

#[derive(Fixture, new)]
pub struct DeleteDistributionBucketFixture {
    #[new(value = "RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    family_id: u64,

    #[new(default)]
    distribution_bucket_index: u64,
}

impl DeleteDistributionBucketFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::delete_distribution_bucket(
            self.origin.clone().into(),
            Storage::create_distribution_bucket_id(self.family_id, self.distribution_bucket_index),
        );

        assert_eq!(actual_result, expected_result);
    }
}

#[derive(Fixture, new)]
pub struct UpdateDistributionBucketForBagsFixture {
    #[new(value = "RawOrigin::Signed(DEFAULT_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    bag_id: BagId<Test>,

    #[new(default)]
    family_id: u64,

    #[new(default)]
    add_bucket_indices: BTreeSet<u64>,

    #[new(default)]
    remove_bucket_indices: BTreeSet<u64>,
}

impl UpdateDistributionBucketForBagsFixture {
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

#[derive(Fixture, new)]
pub struct UpdateDistributionBucketsPerBagLimitFixture {
    #[new(value = "RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    new_limit: u32,
}

impl UpdateDistributionBucketsPerBagLimitFixture {
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

#[derive(Fixture, new)]
pub struct UpdateDistributionBucketModeFixture {
    #[new(value = "RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    family_id: u64,

    #[new(default)]
    distribution_bucket_index: u64,

    #[new(value = "true")]
    distributing: bool,
}

impl UpdateDistributionBucketModeFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Storage::update_distribution_bucket_mode(
            self.origin.clone().into(),
            Storage::create_distribution_bucket_id(self.family_id, self.distribution_bucket_index),
            self.distributing,
        );

        assert_eq!(actual_result, expected_result);
    }
}

#[derive(Fixture, new)]
pub struct UpdateFamiliesInDynamicBagCreationPolicyFixture {
    #[new(value = "RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    dynamic_bag_type: DynamicBagType,

    #[new(default)]
    families: BTreeMap<u64, u32>,
}

impl UpdateFamiliesInDynamicBagCreationPolicyFixture {
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

#[derive(Fixture, new)]
pub struct InviteDistributionBucketOperatorFixture {
    #[new(value = "RawOrigin::Signed(DEFAULT_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(value = "DEFAULT_WORKER_ID")]
    operator_worker_id: u64,

    #[new(default)]
    family_id: u64,

    #[new(default)]
    bucket_index: u64,
}

impl InviteDistributionBucketOperatorFixture {
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

#[derive(Fixture, new)]
pub struct CancelDistributionBucketInvitationFixture {
    #[new(value = "RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    bucket_index: u64,

    #[new(default)]
    family_id: u64,

    #[new(default)]
    operator_worker_id: u64,
}

impl CancelDistributionBucketInvitationFixture {
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

#[derive(Fixture, new)]
pub struct AcceptDistributionBucketInvitationFixture {
    #[new(value = "RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    bucket_index: u64,

    #[new(default)]
    family_id: u64,

    #[new(default)]
    worker_id: u64,
}

impl AcceptDistributionBucketInvitationFixture {
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

#[derive(Fixture, new)]
pub struct SetDistributionBucketMetadataFixture {
    #[new(value = "RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    bucket_index: u64,

    #[new(default)]
    family_id: u64,

    #[new(default)]
    worker_id: u64,

    #[new(default)]
    metadata: Vec<u8>,
}

impl SetDistributionBucketMetadataFixture {
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

#[derive(new, Fixture)]
pub struct RemoveDistributionBucketOperatorFixture {
    #[new(value = "RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    bucket_index: u64,

    #[new(default)]
    family_id: u64,

    #[new(default)]
    operator_worker_id: u64,
}

impl RemoveDistributionBucketOperatorFixture {
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

#[derive(Fixture, new)]
pub struct SetDistributionBucketFamilyMetadataFixture {
    #[new(value = "RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID)")]
    origin: RawOrigin<u64>,

    #[new(default)]
    family_id: u64,

    #[new(default)]
    metadata: Vec<u8>,
}

impl SetDistributionBucketFamilyMetadataFixture {
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
    pub fn create_several(&self, bucket_number: u32) -> BTreeSet<u64> {
        let mut bucket_ids = BTreeSet::new();
        for _ in 0..bucket_number {
            let bucket_id = self.call_and_assert(Ok(())).unwrap();
            bucket_ids.insert(bucket_id);
        }
        bucket_ids
    }
}

pub struct UpdateDataObjectStateBloatBondValueFixture {
    origin: RawOrigin<u64>,
    state_bloat_bond: u64,
}

impl UpdateDataObjectStateBloatBondValueFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID),
            state_bloat_bond: 0,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_state_bloat_bond(self, state_bloat_bond: u64) -> Self {
        Self {
            state_bloat_bond,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_state_bloat_bond = Storage::data_object_state_bloat_bond_value();

        let actual_result = Storage::update_data_object_state_bloat_bond(
            self.origin.clone().into(),
            self.state_bloat_bond,
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                self.state_bloat_bond,
                Storage::data_object_state_bloat_bond_value()
            );
        } else {
            assert_eq!(
                old_state_bloat_bond,
                Storage::data_object_state_bloat_bond_value()
            );
        }
    }
}
