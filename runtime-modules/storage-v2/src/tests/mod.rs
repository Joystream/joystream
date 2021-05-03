#![cfg(test)]

mod fixtures;
pub(crate) mod mocks;

use frame_support::dispatch::DispatchError;
use frame_system::RawOrigin;
use sp_runtime::SaturatedConversion;
use sp_std::collections::btree_set::BTreeSet;

use common::working_group::WorkingGroup;

use crate::{
    AcceptPendingDataObjectsParams, AssignedDataObject, BagId, DataObject,
    DataObjectCreationParameters, DynamicBagId, Error, ModuleAccount, RawEvent, StaticBagId,
    StorageBucketOperatorStatus, StorageTreasury, UpdateStorageBucketForBagsParams,
    UploadParameters, Voucher,
};

use mocks::{
    build_test_externalities, Balances, DataObjectDeletionPrize, MaxNumberOfDataObjectsPerBag,
    Storage, Test, DEFAULT_MEMBER_ACCOUNT_ID, DEFAULT_MEMBER_ID,
    DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID, WG_LEADER_ACCOUNT_ID,
};

use fixtures::{
    create_data_object_candidates, create_single_data_object, increase_account_balance,
    run_to_block, AcceptPendingDataObjectsFixture, AcceptStorageBucketInvitationFixture,
    CancelStorageBucketInvitationFixture, CreateStorageBucketFixture, EventFixture,
    InviteStorageBucketOperatorFixture, SetStorageOperatorMetadataFixture,
    UpdateStorageBucketForBagsFixture, UpdateUploadingBlockedStatusFixture, UploadFixture,
};

#[test]
fn create_storage_bucket_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let accepting_new_data_objects = true;
        let voucher = Voucher::default();
        let invite_worker = None;

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_accepting_new_data_objects(accepting_new_data_objects)
            .with_invite_worker(invite_worker)
            .with_voucher(voucher.clone())
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
            accepting_new_data_objects,
            voucher,
        ));
    });
}

#[test]
fn create_storage_bucket_succeeded_with_invited_member() {
    build_test_externalities().execute_with(|| {
        let invited_worker_id = 10;
        let accepting_new_data_objects = true;
        let voucher = Voucher::default();
        let invite_worker = Some(invited_worker_id);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(WG_LEADER_ACCOUNT_ID))
            .with_accepting_new_data_objects(accepting_new_data_objects)
            .with_invite_worker(invite_worker)
            .with_voucher(voucher.clone())
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
                    ipfs_content_id: upload_params.object_creation_list[0]
                        .clone()
                        .ipfs_content_id,
                    size: upload_params.object_creation_list[0].clone().size,
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
                    ipfs_content_id: upload_params.object_creation_list[0]
                        .clone()
                        .ipfs_content_id,
                    size: upload_params.object_creation_list[0].clone().size,
                    deletion_prize: DataObjectDeletionPrize::get(),
                    accepted: false,
                }
            )]
        );
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
fn upload_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        UploadFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::Other("Bad origin")));

        let invalid_member_id = 555;
        UploadFixture::default()
            .with_member_id(invalid_member_id)
            .call_and_assert(Err(DispatchError::Other("Bad origin")));
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
fn upload_fails_with_invalid_deletion_prize_account() {
    build_test_externalities().execute_with(|| {
        let invalid_account_id = 13300;
        let upload_params = UploadParameters::<Test> {
            bag_id: BagId::<Test>::StaticBag(StaticBagId::Council),
            authentication_key: Vec::new(),
            deletion_prize_source_account_id: invalid_account_id,
            object_creation_list: create_single_data_object(),
        };

        UploadFixture::default()
            .with_params(upload_params)
            .call_and_assert(Err(Error::<Test>::InvalidDeletionPrizeSourceAccount.into()));
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

        let accept_params = AcceptPendingDataObjectsParams::<Test> {
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

        let accept_params = AcceptPendingDataObjectsParams::<Test> {
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
        let accept_params = AcceptPendingDataObjectsParams::<Test> {
            assigned_data_objects: BTreeSet::new(),
        };

        AcceptPendingDataObjectsFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_params(accept_params.clone())
            .call_and_assert(Err(
                Error::<Test>::AcceptPendingDataObjectsParamsAreEmpty.into()
            ));
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

        let accept_params = AcceptPendingDataObjectsParams::<Test> {
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
fn update_uploading_blocked_status_non_leader_origin() {
    build_test_externalities().execute_with(|| {
        let non_leader_id = 1;

        UpdateUploadingBlockedStatusFixture::default()
            .with_origin(RawOrigin::Signed(non_leader_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}
