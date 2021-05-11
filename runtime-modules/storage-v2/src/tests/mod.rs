#![cfg(test)]

mod fixtures;
pub(crate) mod mocks;

use frame_support::dispatch::DispatchError;
use frame_support::traits::Currency;
use frame_support::StorageMap;
use frame_system::RawOrigin;
use sp_runtime::SaturatedConversion;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::iter::FromIterator;

use common::working_group::WorkingGroup;

use crate::{
    AssignedDataObject, BagId, DataObject, DataObjectCreationParameters, DynamicBagId, Error,
    ModuleAccount, ObjectsInBagParams, RawEvent, StaticBagId, StorageBucketOperatorStatus,
    StorageTreasury, UpdateStorageBucketForBagsParams, UploadParameters, Voucher,
};

use mocks::{
    build_test_externalities, Balances, DataObjectDeletionPrize, MaxNumberOfDataObjectsPerBag,
    Storage, Test, DEFAULT_MEMBER_ACCOUNT_ID, DEFAULT_MEMBER_ID,
    DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID, WG_LEADER_ACCOUNT_ID,
};

use fixtures::{
    create_data_object_candidates, create_single_data_object, increase_account_balance,
    run_to_block, AcceptPendingDataObjectsFixture, AcceptStorageBucketInvitationFixture,
    CancelStorageBucketInvitationFixture, CreateStorageBucketFixture, DeleteDataObjectsFixture,
    DeleteDynamicBagsFixture, EventFixture, InviteStorageBucketOperatorFixture,
    MoveDataObjectsFixture, SetStorageOperatorMetadataFixture, UpdateBlacklistFixture,
    UpdateStorageBucketForBagsFixture, UpdateStorageBucketStatusFixture,
    UpdateUploadingBlockedStatusFixture, UploadFixture,
};

#[test]
fn create_storage_bucket_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let accepting_new_bags = true;
        let size_limit = 20;
        let objects_limit = 1;

        let invite_worker = None;

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_accepting_new_bags(accepting_new_bags)
            .with_invite_worker(invite_worker)
            .with_size_limit(size_limit)
            .with_objects_limit(objects_limit)
            .call_and_assert(Ok(()))
            .unwrap();

        let storage_bucket = Storage::storage_bucket_by_id(bucket_id);

        assert_eq!(
            storage_bucket.operator_status,
            StorageBucketOperatorStatus::Missing
        );

        EventFixture::assert_last_crate_event(RawEvent::StorageBucketCreated(
            bucket_id,
            invite_worker,
            accepting_new_bags,
            size_limit,
            objects_limit,
        ));
    });
}

#[test]
fn create_storage_bucket_fails_with_invalid_voucher_params() {
    build_test_externalities().execute_with(|| {
        let size_limit = 2000;
        let objects_limit = 10;

        CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_size_limit(size_limit)
            .call_and_assert(Err(Error::<Test>::VoucherMaxObjectSizeLimitExceeded.into()));

        CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_objects_limit(objects_limit)
            .call_and_assert(Err(
                Error::<Test>::VoucherMaxObjectNumberLimitExceeded.into()
            ));
    });
}

#[test]
fn create_storage_bucket_succeeded_with_invited_member() {
    build_test_externalities().execute_with(|| {
        let invited_worker_id = 10;
        let accepting_new_bags = true;
        let invite_worker = Some(invited_worker_id);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_accepting_new_bags(accepting_new_bags)
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        let storage_bucket = Storage::storage_bucket_by_id(bucket_id);

        assert_eq!(
            storage_bucket.operator_status,
            StorageBucketOperatorStatus::InvitedStorageWorker(invited_worker_id)
        );
    });
}

#[test]
fn create_storage_bucket_fails_with_non_signed_origin() {
    build_test_externalities().execute_with(|| {
        CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn create_storage_bucket_fails_with_non_leader_origin() {
    build_test_externalities().execute_with(|| {
        let non_leader_account_id = 1;

        CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(non_leader_account_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn create_storage_bucket_fails_with_exceeding_max_storage_bucket_limit() {
    build_test_externalities().execute_with(|| {
        CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()));

        CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()));

        CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(
                Error::<Test>::MaxStorageBucketNumberLimitExceeded.into()
            ));
    });
}

#[test]
fn accept_storage_bucket_invitation_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let storage_provider_id = 10;
        let invite_worker = Some(storage_provider_id);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::StorageBucketInvitationAccepted(
            bucket_id,
            storage_provider_id,
        ));
    });
}

#[test]
fn accept_storage_bucket_invitation_fails_with_non_leader_origin() {
    build_test_externalities().execute_with(|| {
        let non_storage_provider_id = 1;

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(non_storage_provider_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn accept_storage_bucket_invitation_fails_with_non_existing_storage_bucket() {
    build_test_externalities().execute_with(|| {
        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::StorageBucketDoesntExist.into()));
    });
}

#[test]
fn accept_storage_bucket_invitation_fails_with_non_invited_storage_provider() {
    build_test_externalities().execute_with(|| {
        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(None)
            .call_and_assert(Ok(()))
            .unwrap();

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .call_and_assert(Err(Error::<Test>::NoStorageBucketInvitation.into()));
    });
}

#[test]
fn accept_storage_bucket_invitation_fails_with_different_invited_storage_provider() {
    build_test_externalities().execute_with(|| {
        let different_storage_provider_id = 122;

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(Some(different_storage_provider_id))
            .call_and_assert(Ok(()))
            .unwrap();

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .call_and_assert(Err(Error::<Test>::DifferentStorageProviderInvited.into()));
    });
}

#[test]
fn accept_storage_bucket_invitation_fails_with_already_set_storage_provider() {
    build_test_externalities().execute_with(|| {
        let storage_provider_id = 122;

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(Some(storage_provider_id))
            .call_and_assert(Ok(()))
            .unwrap();

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Ok(()));

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Err(Error::<Test>::StorageProviderAlreadySet.into()));
    });
}

#[test]
fn update_storage_buckets_for_bags_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let storage_provider_id = 10;
        let invite_worker = Some(storage_provider_id);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        let mut buckets = BTreeSet::new();
        buckets.insert(bucket_id);

        let mut params = UpdateStorageBucketForBagsParams::<Test>::default();
        params.bags.insert(
            BagId::<Test>::StaticBag(StaticBagId::Council),
            buckets.clone(),
        );

        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_params(params.clone())
            .call_and_assert(Ok(()));

        let bag = Storage::council_bag();
        assert_eq!(bag.stored_by, buckets);

        EventFixture::assert_last_crate_event(RawEvent::StorageBucketsUpdatedForBags(params));
    });
}

#[test]
fn update_storage_buckets_for_bags_succeeded_with_voucher_usage() {
    build_test_externalities().execute_with(|| {
        let bag_id = BagId::<Test>::StaticBag(StaticBagId::Council);

        let objects_limit = 1;
        let size_limit = 100;
        let storage_provider_id = 10;

        let old_bucket_id = create_storage_bucket_and_assign_to_bag(
            bag_id.clone(),
            storage_provider_id,
            objects_limit,
            size_limit,
        );

        let object_creation_list = create_single_data_object();

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let upload_params = UploadParameters::<Test> {
            bag_id: bag_id.clone(),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        let new_bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_objects_limit(objects_limit)
            .with_size_limit(size_limit)
            .call_and_assert(Ok(()))
            .unwrap();

        let new_buckets = BTreeSet::from_iter(vec![new_bucket_id]);

        let mut params = UpdateStorageBucketForBagsParams::<Test>::default();
        params.bags.insert(bag_id, new_buckets.clone());

        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_params(params.clone())
            .call_and_assert(Ok(()));

        let bag = Storage::council_bag();
        assert_eq!(bag.stored_by, new_buckets);

        //// Check vouchers
        let old_bucket = Storage::storage_bucket_by_id(old_bucket_id);

        assert_eq!(old_bucket.voucher.objects_used, 0);
        assert_eq!(old_bucket.voucher.size_used, 0);

        let new_bucket = Storage::storage_bucket_by_id(new_bucket_id);
        assert_eq!(new_bucket.voucher.objects_used, 1);
        assert_eq!(new_bucket.voucher.size_used, object_creation_list[0].size);
    });
}

#[test]
fn update_storage_buckets_for_bags_fails_with_exceeding_the_voucher_objects_number_limit() {
    build_test_externalities().execute_with(|| {
        let bag_id = BagId::<Test>::StaticBag(StaticBagId::Council);

        let objects_limit = 1;
        let size_limit = 100;
        let storage_provider_id = 10;

        create_storage_bucket_and_assign_to_bag(
            bag_id.clone(),
            storage_provider_id,
            objects_limit,
            size_limit,
        );

        let object_creation_list = create_single_data_object();

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let upload_params = UploadParameters::<Test> {
            bag_id: bag_id.clone(),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        let new_bucket_objects_limit = 0;
        let new_bucket_size_limit = 100;
        let new_bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_objects_limit(new_bucket_objects_limit)
            .with_size_limit(new_bucket_size_limit)
            .call_and_assert(Ok(()))
            .unwrap();

        let new_buckets = BTreeSet::from_iter(vec![new_bucket_id]);

        let mut params = UpdateStorageBucketForBagsParams::<Test>::default();
        params.bags.insert(bag_id, new_buckets.clone());

        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_params(params.clone())
            .call_and_assert(Err(
                Error::<Test>::StorageBucketObjectNumberLimitReached.into()
            ));
    });
}

#[test]
fn update_storage_buckets_for_bags_fails_with_exceeding_the_voucher_objects_total_size_limit() {
    build_test_externalities().execute_with(|| {
        let bag_id = BagId::<Test>::StaticBag(StaticBagId::Council);

        let objects_limit = 1;
        let size_limit = 100;
        let storage_provider_id = 10;

        create_storage_bucket_and_assign_to_bag(
            bag_id.clone(),
            storage_provider_id,
            objects_limit,
            size_limit,
        );

        let object_creation_list = create_single_data_object();

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let upload_params = UploadParameters::<Test> {
            bag_id: bag_id.clone(),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        let new_bucket_objects_limit = 1;
        let new_bucket_size_limit = 5;
        let new_bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_objects_limit(new_bucket_objects_limit)
            .with_size_limit(new_bucket_size_limit)
            .call_and_assert(Ok(()))
            .unwrap();

        let new_buckets = BTreeSet::from_iter(vec![new_bucket_id]);

        let mut params = UpdateStorageBucketForBagsParams::<Test>::default();
        params.bags.insert(bag_id, new_buckets.clone());

        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_params(params.clone())
            .call_and_assert(Err(
                Error::<Test>::StorageBucketObjectSizeLimitReached.into()
            ));
    });
}

#[test]
fn update_storage_buckets_for_working_group_static_bags_succeeded() {
    build_test_externalities().execute_with(|| {
        let storage_provider_id = 10;
        let invite_worker = Some(storage_provider_id);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        let mut buckets = BTreeSet::new();
        buckets.insert(bucket_id);

        let static_bag_id = StaticBagId::WorkingGroup(WorkingGroup::Storage);
        let bag_id = BagId::<Test>::StaticBag(static_bag_id.clone());
        let mut params = UpdateStorageBucketForBagsParams::<Test>::default();
        params.bags.insert(bag_id.clone(), buckets.clone());

        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_params(params.clone())
            .call_and_assert(Ok(()));

        let bag = Storage::static_bag(&static_bag_id);
        assert_eq!(bag.stored_by, buckets);
    });
}

#[test]
fn update_storage_buckets_for_dynamic_bags_succeeded() {
    build_test_externalities().execute_with(|| {
        let storage_provider_id = 10;
        let invite_worker = Some(storage_provider_id);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        let mut buckets = BTreeSet::new();
        buckets.insert(bucket_id);

        let member_id = 10;
        let dynamic_bag_id = DynamicBagId::<Test>::Member(member_id);
        let bag_id = BagId::<Test>::DynamicBag(dynamic_bag_id.clone());
        let mut params = UpdateStorageBucketForBagsParams::<Test>::default();
        params.bags.insert(bag_id.clone(), buckets.clone());

        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_params(params.clone())
            .call_and_assert(Ok(()));

        let bag = Storage::dynamic_bag(&dynamic_bag_id);
        assert_eq!(bag.stored_by, buckets);
    });
}

#[test]
fn update_storage_buckets_for_bags_fails_with_non_leader_origin() {
    build_test_externalities().execute_with(|| {
        let non_leader_id = 1;

        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(non_leader_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn update_storage_buckets_for_bags_fails_with_empty_params() {
    build_test_externalities().execute_with(|| {
        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(
                Error::<Test>::UpdateStorageBucketForBagsParamsIsEmpty.into()
            ));
    });
}

#[test]
fn update_storage_buckets_for_bags_fails_with_non_existing_storage_buckets() {
    build_test_externalities().execute_with(|| {
        let invalid_bucket_id = 11000;
        let mut buckets = BTreeSet::new();
        buckets.insert(invalid_bucket_id);

        let mut params = UpdateStorageBucketForBagsParams::<Test>::default();
        params.bags.insert(
            BagId::<Test>::StaticBag(StaticBagId::Council),
            buckets.clone(),
        );

        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_params(params)
            .call_and_assert(Err(Error::<Test>::StorageBucketDoesntExist.into()));
    });
}

#[test]
fn upload_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let upload_params = UploadParameters::<Test> {
            bag_id: BagId::<Test>::StaticBag(StaticBagId::Council),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        // check bag content
        let data_object_id = 0u64;
        let bag = Storage::council_bag();
        assert_eq!(
            bag.objects.iter().collect::<Vec<_>>(),
            vec![(
                &data_object_id,
                &DataObject {
                    size: upload_params.object_creation_list[0].size,
                    deletion_prize: DataObjectDeletionPrize::get(),
                    accepted: false,
                }
            )]
        );

        // check balances
        assert_eq!(
            Balances::usable_balance(&DEFAULT_MEMBER_ACCOUNT_ID),
            initial_balance - DataObjectDeletionPrize::get()
        );
        assert_eq!(
            Balances::usable_balance(&<StorageTreasury<Test>>::module_account_id()),
            DataObjectDeletionPrize::get()
        );

        EventFixture::assert_last_crate_event(RawEvent::DataObjectdUploaded(
            vec![data_object_id],
            upload_params,
        ));
    });
}

#[test]
fn deletion_prize_changed_event_fired() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let dynamic_bag = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);

        let upload_params = UploadParameters::<Test> {
            bag_id: BagId::<Test>::DynamicBag(dynamic_bag.clone()),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        EventFixture::contains_crate_event(RawEvent::DeletionPrizeChanged(
            dynamic_bag,
            DataObjectDeletionPrize::get(),
        ));
    });
}

#[test]
fn storage_bucket_voucher_changed_event_fired() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let dynamic_bag = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);

        let bag_id = BagId::<Test>::DynamicBag(dynamic_bag.clone());
        let objects_limit = 1;
        let size_limit = 100;
        let storage_provider_id = 10;

        let bucket_id = create_storage_bucket_and_assign_to_bag(
            bag_id.clone(),
            storage_provider_id,
            objects_limit,
            size_limit,
        );

        let object_creation_list = create_single_data_object();

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let upload_params = UploadParameters::<Test> {
            bag_id: bag_id.clone(),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        EventFixture::contains_crate_event(RawEvent::VoucherChanged(
            bucket_id,
            Voucher {
                objects_limit,
                size_limit,
                objects_used: 1,
                size_used: object_creation_list[0].size,
            },
        ));
    });
}

#[test]
fn upload_succeeded_with_active_storage_bucket_having_voucher() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let bag_id = BagId::<Test>::StaticBag(StaticBagId::Council);
        let objects_limit = 1;
        let size_limit = 100;
        let storage_provider_id = 10;

        let bucket_id = create_storage_bucket_and_assign_to_bag(
            bag_id.clone(),
            storage_provider_id,
            objects_limit,
            size_limit,
        );

        let object_creation_list = create_single_data_object();

        let upload_params = UploadParameters::<Test> {
            bag_id,
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        //// Check voucher

        let bucket = Storage::storage_bucket_by_id(bucket_id);

        assert_eq!(bucket.voucher.objects_used, 1);
        assert_eq!(bucket.voucher.size_used, object_creation_list[0].size);
    });
}

#[test]
fn upload_fails_with_active_storage_bucket_with_voucher_object_number_limit_exceeding() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let bag_id = BagId::<Test>::StaticBag(StaticBagId::Council);
        let objects_limit = 1;
        let size_limit = 100;
        let storage_provider_id = 10;

        create_storage_bucket_and_assign_to_bag(
            bag_id.clone(),
            storage_provider_id,
            objects_limit,
            size_limit,
        );

        let object_creation_list = create_single_data_object();

        let upload_params = UploadParameters::<Test> {
            bag_id,
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        // Check storage bucket voucher: object number limit.
        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Err(
                Error::<Test>::StorageBucketObjectNumberLimitReached.into()
            ));
    });
}

#[test]
fn upload_fails_with_active_storage_bucket_with_voucher_object_size_limit_exceeding() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let bag_id = BagId::<Test>::StaticBag(StaticBagId::Council);
        let objects_limit = 1;
        let size_limit = 1;
        let storage_provider_id = 10;

        create_storage_bucket_and_assign_to_bag(
            bag_id.clone(),
            storage_provider_id,
            objects_limit,
            size_limit,
        );

        let object_creation_list = create_single_data_object();

        let upload_params = UploadParameters::<Test> {
            bag_id,
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
        };

        // Check storage bucket voucher: object size limit.
        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Err(
                Error::<Test>::StorageBucketObjectSizeLimitReached.into()
            ));
    });
}

#[test]
fn upload_succeeded_with_dynamic_bag() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);

        let upload_params = UploadParameters::<Test> {
            bag_id: BagId::<Test>::DynamicBag(dynamic_bag_id.clone()),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        // check bag content
        let data_object_id = 0u64;
        let bag = Storage::dynamic_bag(&dynamic_bag_id);

        assert_eq!(
            bag.objects.iter().collect::<Vec<_>>(),
            vec![(
                &data_object_id,
                &DataObject {
                    size: upload_params.object_creation_list[0].size,
                    deletion_prize: DataObjectDeletionPrize::get(),
                    accepted: false,
                }
            )]
        );

        assert_eq!(bag.deletion_prize, DataObjectDeletionPrize::get());
    });
}

#[test]
fn upload_succeeded_with_non_empty_bag() {
    build_test_externalities().execute_with(|| {
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, 1000);

        let upload_params1 = UploadParameters::<Test> {
            bag_id: BagId::<Test>::StaticBag(StaticBagId::Council),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_data_object_candidates(1, 2),
        };

        UploadFixture::default()
            .with_params(upload_params1.clone())
            .call_and_assert(Ok(()));

        let upload_params2 = UploadParameters::<Test> {
            bag_id: BagId::<Test>::StaticBag(StaticBagId::Council),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_data_object_candidates(3, 2),
        };

        UploadFixture::default()
            .with_params(upload_params2.clone())
            .call_and_assert(Ok(()));

        let bag = Storage::council_bag();
        assert_eq!(bag.objects.len(), 4);
    });
}

#[test]
fn upload_fails_with_empty_params_object() {
    build_test_externalities().execute_with(|| {
        let upload_params = UploadParameters::<Test>::default();

        UploadFixture::default()
            .with_params(upload_params)
            .call_and_assert(Err(Error::<Test>::NoObjectsOnUpload.into()));
    });
}

#[test]
fn upload_fails_with_zero_object_size() {
    build_test_externalities().execute_with(|| {
        let upload_params = UploadParameters::<Test> {
            bag_id: BagId::<Test>::StaticBag(StaticBagId::Council),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: vec![DataObjectCreationParameters {
                ipfs_content_id: vec![1],
                size: 0,
            }],
        };

        UploadFixture::default()
            .with_params(upload_params)
            .call_and_assert(Err(Error::<Test>::ZeroObjectSize.into()));
    });
}

#[test]
fn upload_fails_with_empty_object_cid() {
    build_test_externalities().execute_with(|| {
        let upload_params = UploadParameters::<Test> {
            bag_id: BagId::<Test>::StaticBag(StaticBagId::Council),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: vec![DataObjectCreationParameters {
                ipfs_content_id: Vec::new(),
                size: 220,
            }],
        };

        UploadFixture::default()
            .with_params(upload_params)
            .call_and_assert(Err(Error::<Test>::EmptyContentId.into()));
    });
}

#[test]
fn upload_fails_with_max_data_object_size_exceeded() {
    build_test_externalities().execute_with(|| {
        let max_object_size = MaxNumberOfDataObjectsPerBag::get();
        let invalid_object_number: u8 = (max_object_size + 1).saturated_into();

        let upload_params = UploadParameters::<Test> {
            bag_id: BagId::<Test>::StaticBag(StaticBagId::Council),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_data_object_candidates(1, invalid_object_number),
        };

        UploadFixture::default()
            .with_params(upload_params)
            .call_and_assert(Err(Error::<Test>::DataObjectsPerBagLimitExceeded.into()));
    });
}

#[test]
fn upload_fails_with_insufficient_balance_for_deletion_prize() {
    build_test_externalities().execute_with(|| {
        let upload_params = UploadParameters::<Test> {
            bag_id: BagId::<Test>::StaticBag(StaticBagId::Council),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
        };

        UploadFixture::default()
            .with_params(upload_params)
            .call_and_assert(Err(Error::<Test>::InsufficientBalance.into()));
    });
}

#[test]
fn upload_failed_with_blocked_uploading() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let upload_params = UploadParameters::<Test> {
            bag_id: BagId::<Test>::StaticBag(StaticBagId::Council),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
        };

        let new_blocking_status = true;
        UpdateUploadingBlockedStatusFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_new_status(new_blocking_status)
            .call_and_assert(Ok(()));

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Err(Error::<Test>::UploadingBlocked.into()));
    });
}

#[test]
fn upload_failed_with_blacklisted_data_object() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let object_creation_list = create_single_data_object();
        let hash = object_creation_list[0].ipfs_content_id.clone();
        let add_hashes = BTreeSet::from_iter(vec![hash]);

        UpdateBlacklistFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_add_hashes(add_hashes)
            .call_and_assert(Ok(()));

        let upload_params = UploadParameters::<Test> {
            bag_id: BagId::<Test>::StaticBag(StaticBagId::Council),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list,
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Err(Error::<Test>::DataObjectBlacklisted.into()));
    });
}

#[test]
fn set_storage_operator_metadata_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let storage_provider_id = 10;
        let invite_worker = Some(storage_provider_id);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Ok(()));

        let metadata = b"http://localhost:4000".to_vec();

        SetStorageOperatorMetadataFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_worker_id(storage_provider_id)
            .with_storage_bucket_id(bucket_id)
            .with_metadata(metadata.clone())
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::StorageOperatorMetadataSet(
            bucket_id,
            storage_provider_id,
            metadata,
        ));
    });
}

#[test]
fn set_storage_operator_metadata_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        SetStorageOperatorMetadataFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn set_storage_operator_metadata_fails_with_invalid_storage_bucket() {
    build_test_externalities().execute_with(|| {
        SetStorageOperatorMetadataFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::StorageBucketDoesntExist.into()));
    });
}

#[test]
fn set_storage_operator_metadata_fails_with_invalid_storage_association() {
    build_test_externalities().execute_with(|| {
        let storage_provider_id = 10;
        let invite_worker = Some(storage_provider_id);

        // Missing invitation
        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        SetStorageOperatorMetadataFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Err(Error::<Test>::InvalidStorageProvider.into()));

        // Not accepted invitation
        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        SetStorageOperatorMetadataFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Err(Error::<Test>::InvalidStorageProvider.into()));

        // Invitation accepted. Incorrect storage provider.
        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Ok(()));

        let incorrect_storage_provider_id = 888;
        SetStorageOperatorMetadataFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(incorrect_storage_provider_id)
            .call_and_assert(Err(Error::<Test>::InvalidStorageProvider.into()));
    });
}

#[test]
fn accept_pending_data_objects_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let storage_provider_id = 10;
        let invite_worker = Some(storage_provider_id);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Ok(()));

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let council_bag_id = BagId::<Test>::StaticBag(StaticBagId::Council);
        let upload_params = UploadParameters::<Test> {
            bag_id: council_bag_id.clone(),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        let data_object_id = 0; // just uploaded data object

        let mut objects = BTreeSet::new();
        objects.insert(AssignedDataObject {
            bag_id: council_bag_id,
            data_object_id,
        });

        let accept_params = ObjectsInBagParams::<Test> {
            assigned_data_objects: objects,
        };

        let bag = Storage::council_bag();
        // Check `accepted` flag for the fist data object in the bag.
        assert_eq!(bag.objects.iter().collect::<Vec<_>>()[0].1.accepted, false);

        AcceptPendingDataObjectsFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_worker_id(storage_provider_id)
            .with_params(accept_params.clone())
            .call_and_assert(Ok(()));

        let bag = Storage::council_bag();
        // Check `accepted` flag for the fist data object in the bag.
        assert_eq!(bag.objects.iter().collect::<Vec<_>>()[0].1.accepted, true);

        EventFixture::assert_last_crate_event(RawEvent::PendingDataObjectsAccepted(
            storage_provider_id,
            accept_params,
        ));
    });
}

#[test]
fn accept_pending_data_objects_succeeded_with_dynamic_bag() {
    build_test_externalities().execute_with(|| {
        let storage_provider_id = 10;
        let invite_worker = Some(storage_provider_id);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Ok(()));

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);
        let bag_id = BagId::<Test>::DynamicBag(dynamic_bag_id.clone());
        let upload_params = UploadParameters::<Test> {
            bag_id: bag_id.clone(),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        let data_object_id = 0; // just uploaded data object

        let mut objects = BTreeSet::new();
        objects.insert(AssignedDataObject {
            bag_id,
            data_object_id,
        });

        let accept_params = ObjectsInBagParams::<Test> {
            assigned_data_objects: objects,
        };

        AcceptPendingDataObjectsFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_worker_id(storage_provider_id)
            .with_params(accept_params.clone())
            .call_and_assert(Ok(()));

        let bag = Storage::dynamic_bag(&dynamic_bag_id);
        // Check `accepted` flag for the fist data object in the bag.
        assert_eq!(bag.objects.iter().collect::<Vec<_>>()[0].1.accepted, true);
    });
}

#[test]
fn accept_pending_data_objects_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        AcceptPendingDataObjectsFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn accept_pending_data_objects_fails_with_empty_params() {
    build_test_externalities().execute_with(|| {
        let accept_params = ObjectsInBagParams::<Test> {
            assigned_data_objects: BTreeSet::new(),
        };

        AcceptPendingDataObjectsFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_params(accept_params.clone())
            .call_and_assert(Err(Error::<Test>::ObjectInBagParamsAreEmpty.into()));
    });
}

#[test]
fn accept_pending_data_objects_fails_with_non_existing_data_object() {
    build_test_externalities().execute_with(|| {
        let data_object_id = 0;
        let council_bag_id = BagId::<Test>::StaticBag(StaticBagId::Council);

        let mut objects = BTreeSet::new();
        objects.insert(AssignedDataObject {
            bag_id: council_bag_id,
            data_object_id,
        });

        let accept_params = ObjectsInBagParams::<Test> {
            assigned_data_objects: objects,
        };

        AcceptPendingDataObjectsFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_params(accept_params.clone())
            .call_and_assert(Err(Error::<Test>::DataObjectDoesntExist.into()));
    });
}

#[test]
fn cancel_storage_bucket_operator_invite_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let storage_provider_id = 10;
        let invite_worker = Some(storage_provider_id);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        CancelStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::StorageBucketInvitationCancelled(
            bucket_id,
        ));
    });
}

#[test]
fn cancel_storage_bucket_operator_invite_fails_with_non_leader_origin() {
    build_test_externalities().execute_with(|| {
        let non_storage_provider_id = 1;

        CancelStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(non_storage_provider_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn cancel_storage_bucket_operator_invite_fails_with_non_existing_storage_bucket() {
    build_test_externalities().execute_with(|| {
        CancelStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::StorageBucketDoesntExist.into()));
    });
}

#[test]
fn cancel_storage_bucket_operator_invite_fails_with_non_invited_storage_provider() {
    build_test_externalities().execute_with(|| {
        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(None)
            .call_and_assert(Ok(()))
            .unwrap();

        CancelStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .call_and_assert(Err(Error::<Test>::NoStorageBucketInvitation.into()));
    });
}

#[test]
fn cancel_storage_bucket_operator_invite_fails_with_already_set_storage_provider() {
    build_test_externalities().execute_with(|| {
        let storage_provider_id = 122;

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(Some(storage_provider_id))
            .call_and_assert(Ok(()))
            .unwrap();

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Ok(()));

        CancelStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .call_and_assert(Err(Error::<Test>::StorageProviderAlreadySet.into()));
    });
}

#[test]
fn invite_storage_bucket_operator_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let storage_provider_id = 10;

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        InviteStorageBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_operator_worker_id(storage_provider_id)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::StorageBucketOperatorInvited(
            bucket_id,
            storage_provider_id,
        ));
    });
}

#[test]
fn invite_storage_bucket_operator_fails_with_non_leader_origin() {
    build_test_externalities().execute_with(|| {
        let non_leader_id = 1;

        InviteStorageBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(non_leader_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn invite_storage_bucket_operator_fails_with_non_existing_storage_bucket() {
    build_test_externalities().execute_with(|| {
        InviteStorageBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::StorageBucketDoesntExist.into()));
    });
}

#[test]
fn invite_storage_bucket_operator_fails_with_non_missing_invitation() {
    build_test_externalities().execute_with(|| {
        let invited_worker_id = 155;

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(Some(invited_worker_id))
            .call_and_assert(Ok(()))
            .unwrap();

        InviteStorageBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .call_and_assert(Err(Error::<Test>::InvitedStorageProvider.into()));
    });
}

#[test]
fn update_uploading_blocked_status_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let new_blocking_status = true;

        UpdateUploadingBlockedStatusFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_new_status(new_blocking_status)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::UploadingBlockStatusUpdated(
            new_blocking_status,
        ));
    });
}

#[test]
fn update_uploading_blocked_status_fails_with_non_leader_origin() {
    build_test_externalities().execute_with(|| {
        let non_leader_id = 1;

        UpdateUploadingBlockedStatusFixture::default()
            .with_origin(RawOrigin::Signed(non_leader_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn move_data_objects_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let src_dynamic_bag_id = DynamicBagId::<Test>::Member(1u64);
        let src_bag_id = BagId::<Test>::DynamicBag(src_dynamic_bag_id.clone());

        let dest_dynamic_bag_id = DynamicBagId::<Test>::Member(2u64);
        let dest_bag_id = BagId::<Test>::DynamicBag(dest_dynamic_bag_id.clone());

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let upload_params = UploadParameters::<Test> {
            bag_id: src_bag_id.clone(),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        let data_object_id = 0u64;
        let ids = BTreeSet::from_iter(vec![data_object_id]);

        // Pre-checks
        let src_bag = Storage::dynamic_bag(&src_dynamic_bag_id.clone());
        let dest_bag = Storage::dynamic_bag(&dest_dynamic_bag_id.clone());

        assert!(src_bag.objects.contains_key(&data_object_id));
        assert!(!dest_bag.objects.contains_key(&data_object_id));

        assert_eq!(src_bag.deletion_prize, DataObjectDeletionPrize::get());
        assert_eq!(dest_bag.deletion_prize, 0);

        MoveDataObjectsFixture::default()
            .with_src_bag_id(src_bag_id.clone())
            .with_dest_bag_id(dest_bag_id.clone())
            .with_data_object_ids(ids.clone())
            .call_and_assert(Ok(()));

        // Post-checks
        let src_bag = Storage::dynamic_bag(&src_dynamic_bag_id.clone());
        let dest_bag = Storage::dynamic_bag(&dest_dynamic_bag_id.clone());

        assert!(!src_bag.objects.contains_key(&data_object_id));
        assert!(dest_bag.objects.contains_key(&data_object_id));

        assert_eq!(src_bag.deletion_prize, 0);
        assert_eq!(dest_bag.deletion_prize, DataObjectDeletionPrize::get());

        EventFixture::assert_last_crate_event(RawEvent::DataObjectsMoved(
            src_bag_id,
            dest_bag_id,
            ids,
        ));
    });
}

#[test]
fn move_data_objects_succeeded_having_voucher() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let working_group = WorkingGroup::Storage;
        let src_bag_id = BagId::<Test>::StaticBag(StaticBagId::Council);
        let dest_bag_id = BagId::<Test>::StaticBag(StaticBagId::WorkingGroup(working_group));

        let objects_limit = 1;
        let size_limit = 100;

        let src_storage_provider_id = 10;
        let dest_storage_provider_id = 11;

        let src_bucket_id = create_storage_bucket_and_assign_to_bag(
            src_bag_id.clone(),
            src_storage_provider_id,
            objects_limit,
            size_limit,
        );
        let dest_bucket_id = create_storage_bucket_and_assign_to_bag(
            dest_bag_id.clone(),
            dest_storage_provider_id,
            objects_limit,
            size_limit,
        );

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let object_creation_list = create_single_data_object();

        let upload_params = UploadParameters::<Test> {
            bag_id: src_bag_id.clone(),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        let data_object_id = 0u64;
        let ids = BTreeSet::from_iter(vec![data_object_id]);

        let src_bucket = Storage::storage_bucket_by_id(src_bucket_id);
        let dest_bucket = Storage::storage_bucket_by_id(dest_bucket_id);
        assert_eq!(dest_bucket.voucher.objects_used, 0);
        assert_eq!(dest_bucket.voucher.size_used, 0);

        assert_eq!(src_bucket.voucher.objects_used, 1);
        assert_eq!(src_bucket.voucher.size_used, object_creation_list[0].size);

        MoveDataObjectsFixture::default()
            .with_src_bag_id(src_bag_id.clone())
            .with_dest_bag_id(dest_bag_id.clone())
            .with_data_object_ids(ids.clone())
            .call_and_assert(Ok(()));

        //// Check vouchers
        let src_bucket = Storage::storage_bucket_by_id(src_bucket_id);
        let dest_bucket = Storage::storage_bucket_by_id(dest_bucket_id);

        assert_eq!(src_bucket.voucher.objects_used, 0);
        assert_eq!(src_bucket.voucher.size_used, 0);

        assert_eq!(dest_bucket.voucher.objects_used, 1);
        assert_eq!(dest_bucket.voucher.size_used, object_creation_list[0].size);
    });
}

#[test]
fn move_data_objects_fails_with_exceeding_voucher_object_number_limit() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let working_group = WorkingGroup::Storage;
        let src_bag_id = BagId::<Test>::StaticBag(StaticBagId::Council);
        let dest_bag_id = BagId::<Test>::StaticBag(StaticBagId::WorkingGroup(working_group));

        let src_objects_limit = 1;
        let src_size_limit = 100;

        let dest_objects_limit = 0;
        let dest_size_limit = 100;

        let src_storage_provider_id = 10;
        let dest_storage_provider_id = 11;

        create_storage_bucket_and_assign_to_bag(
            src_bag_id.clone(),
            src_storage_provider_id,
            src_objects_limit,
            src_size_limit,
        );
        create_storage_bucket_and_assign_to_bag(
            dest_bag_id.clone(),
            dest_storage_provider_id,
            dest_objects_limit,
            dest_size_limit,
        );

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let object_creation_list = create_single_data_object();

        let upload_params = UploadParameters::<Test> {
            bag_id: src_bag_id.clone(),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        let data_object_id = 0u64;
        let ids = BTreeSet::from_iter(vec![data_object_id]);

        MoveDataObjectsFixture::default()
            .with_src_bag_id(src_bag_id.clone())
            .with_dest_bag_id(dest_bag_id.clone())
            .with_data_object_ids(ids.clone())
            .call_and_assert(Err(
                Error::<Test>::StorageBucketObjectNumberLimitReached.into()
            ));
    });
}

#[test]
fn move_data_objects_fails_with_exceeding_voucher_objects_size_limit() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let working_group = WorkingGroup::Storage;
        let src_bag_id = BagId::<Test>::StaticBag(StaticBagId::Council);
        let dest_bag_id = BagId::<Test>::StaticBag(StaticBagId::WorkingGroup(working_group));

        let src_objects_limit = 1;
        let src_size_limit = 100;

        let dest_objects_limit = 1;
        let dest_size_limit = 1;

        let src_storage_provider_id = 10;
        let dest_storage_provider_id = 11;

        create_storage_bucket_and_assign_to_bag(
            src_bag_id.clone(),
            src_storage_provider_id,
            src_objects_limit,
            src_size_limit,
        );
        create_storage_bucket_and_assign_to_bag(
            dest_bag_id.clone(),
            dest_storage_provider_id,
            dest_objects_limit,
            dest_size_limit,
        );

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let object_creation_list = create_single_data_object();

        let upload_params = UploadParameters::<Test> {
            bag_id: src_bag_id.clone(),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        let data_object_id = 0u64;
        let ids = BTreeSet::from_iter(vec![data_object_id]);

        MoveDataObjectsFixture::default()
            .with_src_bag_id(src_bag_id.clone())
            .with_dest_bag_id(dest_bag_id.clone())
            .with_data_object_ids(ids.clone())
            .call_and_assert(Err(
                Error::<Test>::StorageBucketObjectSizeLimitReached.into()
            ));
    });
}

#[test]
fn move_data_objects_fails_with_empty_data_collection() {
    build_test_externalities().execute_with(|| {
        let dest_bag_id =
            BagId::<Test>::StaticBag(StaticBagId::WorkingGroup(WorkingGroup::Storage));

        MoveDataObjectsFixture::default()
            .with_dest_bag_id(dest_bag_id)
            .call_and_assert(Err(Error::<Test>::DataObjectIdCollectionIsEmpty.into()));
    });
}

#[test]
fn move_data_objects_fails_with_non_existent_data() {
    build_test_externalities().execute_with(|| {
        let dest_bag_id =
            BagId::<Test>::StaticBag(StaticBagId::WorkingGroup(WorkingGroup::Storage));

        let data_object_id = 0u64;
        let ids = BTreeSet::from_iter(vec![data_object_id]);

        MoveDataObjectsFixture::default()
            .with_dest_bag_id(dest_bag_id)
            .with_data_object_ids(ids)
            .call_and_assert(Err(Error::<Test>::DataObjectDoesntExist.into()));
    });
}

#[test]
fn move_data_objects_fails_with_same_bag() {
    build_test_externalities().execute_with(|| {
        let src_bag_id = BagId::<Test>::StaticBag(StaticBagId::Council);

        let dest_bag_id = BagId::<Test>::StaticBag(StaticBagId::Council);

        MoveDataObjectsFixture::default()
            .with_src_bag_id(src_bag_id)
            .with_dest_bag_id(dest_bag_id)
            .call_and_assert(Err(Error::<Test>::SourceAndDestinationBagsAreEqual.into()));
    });
}

#[test]
fn delete_data_objects_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let storage_provider_id = 10;
        let invite_worker = Some(storage_provider_id);

        CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);
        let bag_id = BagId::<Test>::DynamicBag(dynamic_bag_id.clone());

        let upload_params = UploadParameters::<Test> {
            bag_id: bag_id.clone(),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        let data_object_id = 0; // just uploaded data object

        let objects = BTreeSet::from_iter(vec![AssignedDataObject {
            bag_id,
            data_object_id,
        }]);

        let params = ObjectsInBagParams::<Test> {
            assigned_data_objects: objects,
        };

        // pre-checks
        let bag = Storage::dynamic_bag(&dynamic_bag_id);
        assert!(bag.objects.contains_key(&data_object_id));
        assert_eq!(bag.deletion_prize, DataObjectDeletionPrize::get());

        assert_eq!(
            Balances::usable_balance(&DEFAULT_MEMBER_ACCOUNT_ID),
            initial_balance - DataObjectDeletionPrize::get()
        );
        assert_eq!(
            Balances::usable_balance(&<StorageTreasury<Test>>::module_account_id()),
            DataObjectDeletionPrize::get()
        );

        DeleteDataObjectsFixture::default()
            .with_params(params.clone())
            .with_deletion_account_id(DEFAULT_MEMBER_ACCOUNT_ID)
            .call_and_assert(Ok(()));

        // post-checks
        let bag = Storage::dynamic_bag(&dynamic_bag_id);
        assert!(!bag.objects.contains_key(&data_object_id));
        assert_eq!(bag.deletion_prize, 0);

        assert_eq!(
            Balances::usable_balance(&DEFAULT_MEMBER_ACCOUNT_ID),
            initial_balance
        );
        assert_eq!(
            Balances::usable_balance(&<StorageTreasury<Test>>::module_account_id()),
            0
        );

        EventFixture::assert_last_crate_event(RawEvent::DataObjectsDeleted(
            DEFAULT_MEMBER_ACCOUNT_ID,
            params,
        ));
    });
}

#[test]
fn delete_data_objects_fails_with_invalid_treasury_balance() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let storage_provider_id = 10;
        let invite_worker = Some(storage_provider_id);

        CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let council_bag_id = BagId::<Test>::StaticBag(StaticBagId::Council);
        let upload_params = UploadParameters::<Test> {
            bag_id: council_bag_id.clone(),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        let data_object_id = 0; // just uploaded data object

        let objects = BTreeSet::from_iter(vec![AssignedDataObject {
            bag_id: council_bag_id,
            data_object_id,
        }]);

        let params = ObjectsInBagParams::<Test> {
            assigned_data_objects: objects,
        };

        // Corrupt module balance.
        let _ = Balances::slash(
            &<StorageTreasury<Test>>::module_account_id(),
            <StorageTreasury<Test>>::usable_balance(),
        );

        DeleteDataObjectsFixture::default()
            .with_params(params.clone())
            .with_deletion_account_id(DEFAULT_MEMBER_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::InsufficientTreasuryBalance.into()));
    });
}

#[test]
fn delete_data_objects_succeeded_with_voucher_usage() {
    build_test_externalities().execute_with(|| {
        let council_bag_id = BagId::<Test>::StaticBag(StaticBagId::Council);

        let objects_limit = 1;
        let size_limit = 100;
        let storage_provider_id = 10;

        let bucket_id = create_storage_bucket_and_assign_to_bag(
            council_bag_id.clone(),
            storage_provider_id,
            objects_limit,
            size_limit,
        );

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let object_creation_list = create_single_data_object();

        let upload_params = UploadParameters::<Test> {
            bag_id: council_bag_id.clone(),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        let data_object_id = 0; // just uploaded data object

        let objects = BTreeSet::from_iter(vec![AssignedDataObject {
            bag_id: council_bag_id,
            data_object_id,
        }]);

        let params = ObjectsInBagParams::<Test> {
            assigned_data_objects: objects,
        };

        //// Pre-check voucher
        let bucket = Storage::storage_bucket_by_id(bucket_id);

        assert_eq!(bucket.voucher.objects_used, 1);
        assert_eq!(bucket.voucher.size_used, object_creation_list[0].size);

        DeleteDataObjectsFixture::default()
            .with_params(params.clone())
            .call_and_assert(Ok(()));

        let bag = Storage::council_bag();
        assert!(!bag.objects.contains_key(&data_object_id));

        //// Post-check voucher
        let bucket = Storage::storage_bucket_by_id(bucket_id);

        assert_eq!(bucket.voucher.objects_used, 0);
        assert_eq!(bucket.voucher.size_used, 0);
    });
}

#[test]
fn delete_data_objects_fails_with_empty_params() {
    build_test_externalities().execute_with(|| {
        let accept_params = ObjectsInBagParams::<Test> {
            assigned_data_objects: BTreeSet::new(),
        };

        DeleteDataObjectsFixture::default()
            .with_params(accept_params.clone())
            .call_and_assert(Err(Error::<Test>::ObjectInBagParamsAreEmpty.into()));
    });
}

#[test]
fn delete_data_objects_fails_with_non_existing_data_object() {
    build_test_externalities().execute_with(|| {
        let data_object_id = 0;
        let council_bag_id = BagId::<Test>::StaticBag(StaticBagId::Council);

        let objects = BTreeSet::from_iter(vec![AssignedDataObject {
            bag_id: council_bag_id,
            data_object_id,
        }]);

        let accept_params = ObjectsInBagParams::<Test> {
            assigned_data_objects: objects,
        };

        DeleteDataObjectsFixture::default()
            .with_params(accept_params.clone())
            .call_and_assert(Err(Error::<Test>::DataObjectDoesntExist.into()));
    });
}

#[test]
fn update_storage_bucket_status_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let storage_provider_id = 10;
        let invite_worker = Some(storage_provider_id);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Ok(()));

        let new_status = true;
        UpdateStorageBucketStatusFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_worker_id(storage_provider_id)
            .with_storage_bucket_id(bucket_id)
            .with_new_status(new_status)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::StorageBucketStatusUpdated(
            bucket_id,
            storage_provider_id,
            new_status,
        ));
    });
}

#[test]
fn update_storage_bucket_status_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        UpdateStorageBucketStatusFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn update_storage_bucket_status_fails_with_invalid_storage_bucket() {
    build_test_externalities().execute_with(|| {
        UpdateStorageBucketStatusFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::StorageBucketDoesntExist.into()));
    });
}

#[test]
fn update_storage_bucket_status_fails_with_invalid_storage_association() {
    build_test_externalities().execute_with(|| {
        let storage_provider_id = 10;
        let invite_worker = Some(storage_provider_id);

        // Missing invitation
        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        UpdateStorageBucketStatusFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Err(Error::<Test>::InvalidStorageProvider.into()));

        // Not accepted invitation
        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        UpdateStorageBucketStatusFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Err(Error::<Test>::InvalidStorageProvider.into()));

        // Invitation accepted. Incorrect storage provider.
        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Ok(()));

        let incorrect_storage_provider_id = 888;
        UpdateStorageBucketStatusFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(incorrect_storage_provider_id)
            .call_and_assert(Err(Error::<Test>::InvalidStorageProvider.into()));
    });
}

#[test]
fn update_blacklist_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let cid1 = vec![1];
        let cid2 = vec![2];

        let add_hashes = BTreeSet::from_iter(vec![cid1.clone()]);
        UpdateBlacklistFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_add_hashes(add_hashes.clone())
            .call_and_assert(Ok(()));

        assert!(crate::Blacklist::contains_key(&cid1));
        assert_eq!(Storage::current_blacklist_size(), 1);

        let remove_hashes = BTreeSet::from_iter(vec![cid1.clone()]);
        let add_hashes = BTreeSet::from_iter(vec![cid2.clone()]);

        UpdateBlacklistFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_add_hashes(add_hashes.clone())
            .with_remove_hashes(remove_hashes.clone())
            .call_and_assert(Ok(()));

        assert!(!crate::Blacklist::contains_key(&cid1));
        assert!(crate::Blacklist::contains_key(&cid2));
        assert_eq!(Storage::current_blacklist_size(), 1);

        EventFixture::assert_last_crate_event(RawEvent::UpdateBlacklist(remove_hashes, add_hashes));
    });
}

#[test]
fn update_blacklist_failed_with_exceeding_size_limit() {
    build_test_externalities().execute_with(|| {
        let cid1 = vec![1];
        let cid2 = vec![2];
        let cid3 = vec![3];

        let add_hashes = BTreeSet::from_iter(vec![cid1.clone()]);

        UpdateBlacklistFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_add_hashes(add_hashes.clone())
            .call_and_assert(Ok(()));

        let remove_hashes = BTreeSet::from_iter(vec![cid1.clone()]);
        let add_hashes = BTreeSet::from_iter(vec![cid2.clone(), cid3.clone()]);

        UpdateBlacklistFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_add_hashes(add_hashes.clone())
            .with_remove_hashes(remove_hashes.clone())
            .call_and_assert(Err(Error::<Test>::BlacklistSizeLimitExceeded.into()));

        assert!(crate::Blacklist::contains_key(&cid1));
        assert!(!crate::Blacklist::contains_key(&cid2));
        assert!(!crate::Blacklist::contains_key(&cid3));
    });
}

#[test]
fn update_blacklist_failed_with_exceeding_size_limit_with_non_existent_remove_hashes() {
    build_test_externalities().execute_with(|| {
        let cid1 = vec![1];
        let cid2 = vec![2];
        let cid3 = vec![3];

        let add_hashes = BTreeSet::from_iter(vec![cid1.clone()]);

        UpdateBlacklistFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_add_hashes(add_hashes.clone())
            .call_and_assert(Ok(()));

        let remove_hashes = BTreeSet::from_iter(vec![cid3.clone()]);
        let add_hashes = BTreeSet::from_iter(vec![cid2.clone()]);

        UpdateBlacklistFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_add_hashes(add_hashes.clone())
            .with_remove_hashes(remove_hashes.clone())
            .call_and_assert(Err(Error::<Test>::BlacklistSizeLimitExceeded.into()));

        assert!(crate::Blacklist::contains_key(&cid1));
        assert!(!crate::Blacklist::contains_key(&cid2));
        assert!(!crate::Blacklist::contains_key(&cid3));
    });
}

#[test]
fn update_blacklist_succeeds_with_existent_remove_hashes() {
    build_test_externalities().execute_with(|| {
        let cid1 = vec![1];

        let add_hashes = BTreeSet::from_iter(vec![cid1.clone()]);

        UpdateBlacklistFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_add_hashes(add_hashes.clone())
            .call_and_assert(Ok(()));

        UpdateBlacklistFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_add_hashes(add_hashes.clone())
            .call_and_assert(Ok(()));

        assert!(crate::Blacklist::contains_key(&cid1));
        assert_eq!(Storage::current_blacklist_size(), 1);
    });
}

#[test]
fn update_blacklist_fails_with_non_leader_origin() {
    build_test_externalities().execute_with(|| {
        let non_leader_id = 1;

        UpdateBlacklistFixture::default()
            .with_origin(RawOrigin::Signed(non_leader_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

fn create_storage_bucket_and_assign_to_bag(
    bag_id: BagId<Test>,
    storage_provider_id: u64,
    objects_limit: u64,
    size_limit: u64,
) -> u64 {
    let invite_worker = Some(storage_provider_id);

    let bucket_id = CreateStorageBucketFixture::default()
        .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
        .with_invite_worker(invite_worker)
        .with_objects_limit(objects_limit)
        .with_size_limit(size_limit)
        .call_and_assert(Ok(()))
        .unwrap();

    let buckets = BTreeSet::from_iter(vec![bucket_id]);

    let mut params = UpdateStorageBucketForBagsParams::<Test>::default();
    params.bags.insert(bag_id.clone(), buckets.clone());

    UpdateStorageBucketForBagsFixture::default()
        .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
        .with_params(params.clone())
        .call_and_assert(Ok(()));

    bucket_id
}

#[test]
fn delete_dynamic_bags_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);

        let upload_params = UploadParameters::<Test> {
            bag_id: BagId::<Test>::DynamicBag(dynamic_bag_id.clone()),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        // pre-check balances
        assert_eq!(
            Balances::usable_balance(&DEFAULT_MEMBER_ACCOUNT_ID),
            initial_balance - DataObjectDeletionPrize::get()
        );
        assert_eq!(
            Balances::usable_balance(&<StorageTreasury<Test>>::module_account_id()),
            DataObjectDeletionPrize::get()
        );

        let bags = BTreeSet::from_iter(vec![dynamic_bag_id]);

        DeleteDynamicBagsFixture::default()
            .with_bags(bags.clone())
            .with_deletion_account_id(DEFAULT_MEMBER_ACCOUNT_ID)
            .call_and_assert(Ok(()));

        // post-check balances
        assert_eq!(
            Balances::usable_balance(&<StorageTreasury<Test>>::module_account_id()),
            0
        );
        assert_eq!(
            Balances::usable_balance(&DEFAULT_MEMBER_ACCOUNT_ID),
            initial_balance
        );

        EventFixture::assert_last_crate_event(RawEvent::DynamicBagsDeleted(
            DEFAULT_MEMBER_ACCOUNT_ID,
            bags,
        ));
    });
}

#[test]
fn delete_dynamic_bags_succeeded_having_voucher() {
    build_test_externalities().execute_with(|| {
        let objects_limit = 1;
        let size_limit = 100;
        let storage_provider_id = 10;

        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);
        let bag_id = BagId::<Test>::DynamicBag(dynamic_bag_id.clone());

        let bucket_id = create_storage_bucket_and_assign_to_bag(
            bag_id.clone(),
            storage_provider_id,
            objects_limit,
            size_limit,
        );

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let object_creation_list = create_single_data_object();

        let upload_params = UploadParameters::<Test> {
            bag_id,
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        let bags = BTreeSet::from_iter(vec![dynamic_bag_id]);

        // Pre-checks for voucher
        let bucket = Storage::storage_bucket_by_id(bucket_id);

        assert_eq!(bucket.voucher.size_used, object_creation_list[0].size);
        assert_eq!(bucket.voucher.objects_used, 1);

        DeleteDynamicBagsFixture::default()
            .with_bags(bags.clone())
            .with_deletion_account_id(DEFAULT_MEMBER_ACCOUNT_ID)
            .call_and_assert(Ok(()));

        // Post-checks for voucher
        let bucket = Storage::storage_bucket_by_id(bucket_id);

        assert_eq!(bucket.voucher.size_used, 0);
        assert_eq!(bucket.voucher.objects_used, 0);
    });
}

#[test]
fn delete_dynamic_bags_fails_with_insufficient_balance_for_deletion_prize() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);

        let upload_params = UploadParameters::<Test> {
            bag_id: BagId::<Test>::DynamicBag(dynamic_bag_id.clone()),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        let bags = BTreeSet::from_iter(vec![dynamic_bag_id]);

        // Corrupt module balance.
        let _ = Balances::slash(
            &<StorageTreasury<Test>>::module_account_id(),
            <StorageTreasury<Test>>::usable_balance(),
        );

        DeleteDynamicBagsFixture::default()
            .with_bags(bags.clone())
            .with_deletion_account_id(DEFAULT_MEMBER_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::InsufficientTreasuryBalance.into()));
    });
}
