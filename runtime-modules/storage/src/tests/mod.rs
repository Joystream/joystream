#![cfg(test)]

mod fixtures;
pub(crate) mod mocks;

use frame_support::dispatch::DispatchError;
use frame_support::traits::Currency;
use frame_support::{assert_err, assert_ok, StorageDoubleMap, StorageMap, StorageValue};
use frame_system::RawOrigin;
use sp_std::collections::btree_map::BTreeMap;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::convert::TryInto;
use sp_std::iter::{repeat, FromIterator};

use common::working_group::WorkingGroup;

use crate::{
    BagId, DataObject, DataObjectCreationParameters, DistributionBucketFamily,
    DistributionBucketId, DynamicBagId, DynamicBagType, Error, ModuleAccount, RawEvent,
    StaticBagId, StorageBucketOperatorStatus, StorageTreasury, UploadParameters, Voucher,
};

use mocks::{
    build_test_externalities, create_cid, Balances, BlacklistSizeLimit,
    DefaultChannelDynamicBagNumberOfStorageBuckets, DefaultMemberDynamicBagNumberOfStorageBuckets,
    MaxDataObjectSize, MaxDistributionBucketFamilyNumber, Storage, Test,
    ANOTHER_DISTRIBUTION_PROVIDER_ID, ANOTHER_STORAGE_PROVIDER_ID, BAG_DELETION_PRIZE_VALUE,
    DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID, DEFAULT_DISTRIBUTION_PROVIDER_ID,
    DEFAULT_MEMBER_ACCOUNT_ID, DEFAULT_MEMBER_ID, DEFAULT_STORAGE_BUCKETS_NUMBER,
    DEFAULT_STORAGE_BUCKET_OBJECTS_LIMIT, DEFAULT_STORAGE_BUCKET_SIZE_LIMIT,
    DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID, DEFAULT_STORAGE_PROVIDER_ID,
    DISTRIBUTION_WG_LEADER_ACCOUNT_ID, INITIAL_BALANCE, STORAGE_WG_LEADER_ACCOUNT_ID,
    VOUCHER_OBJECTS_LIMIT, VOUCHER_SIZE_LIMIT,
};

use fixtures::*;
use sp_arithmetic::traits::SaturatedConversion;

// helper

fn create_storage_buckets(buckets_number: u64) -> BTreeSet<u64> {
    set_max_voucher_limits();
    CreateStorageBucketFixture::default()
        .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
        .with_objects_limit(DEFAULT_STORAGE_BUCKET_OBJECTS_LIMIT)
        .with_size_limit(DEFAULT_STORAGE_BUCKET_SIZE_LIMIT)
        .create_several(buckets_number)
}

#[test]
fn create_storage_bucket_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        set_max_voucher_limits();

        let accepting_new_bags = true;
        let size_limit = 20;
        let objects_limit = 1;

        let invite_worker = None;

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
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
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_size_limit(size_limit)
            .call_and_assert(Err(Error::<Test>::VoucherMaxObjectSizeLimitExceeded.into()));

        CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
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
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
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
fn create_storage_bucket_fails_with_invalid_storage_provider_id() {
    build_test_externalities().execute_with(|| {
        let invalid_storage_provider_id = 155;

        CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(Some(invalid_storage_provider_id))
            .call_and_assert(Err(Error::<Test>::StorageProviderOperatorDoesntExist.into()));
    });
}

#[test]
fn accept_storage_bucket_invitation_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let invite_worker = Some(storage_provider_id);
        let transactor_id = DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID;

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .with_transactor_account_id(transactor_id)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::StorageBucketInvitationAccepted(
            bucket_id,
            storage_provider_id,
            transactor_id,
        ));
    });
}

#[test]
fn accept_storage_bucket_invitation_fails_with_non_leader_origin() {
    build_test_externalities().execute_with(|| {
        let non_storage_provider_id = 51;

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
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
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
        let different_storage_provider_id = ANOTHER_STORAGE_PROVIDER_ID;

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
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
        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
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

        set_default_update_storage_buckets_per_bag_limit();

        let static_bag_id = StaticBagId::Council;
        let bag_id = BagId::<Test>::Static(static_bag_id.clone());

        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let invite_worker = Some(storage_provider_id);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        let add_buckets = BTreeSet::from_iter(vec![bucket_id]);

        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_bag_id(bag_id.clone())
            .with_add_bucket_ids(add_buckets.clone())
            .call_and_assert(Ok(()));

        let bag = Storage::static_bag(&static_bag_id);
        assert_eq!(bag.stored_by, add_buckets);

        EventFixture::assert_last_crate_event(RawEvent::StorageBucketsUpdatedForBag(
            bag_id,
            add_buckets,
            BTreeSet::new(),
        ));
    });
}

#[test]
fn update_storage_buckets_for_bags_succeeded_with_additioonal_checks_on_adding_and_removing() {
    build_test_externalities().execute_with(|| {
        set_default_update_storage_buckets_per_bag_limit();

        let static_bag_id = StaticBagId::Council;
        let bag_id: BagId<Test> = static_bag_id.into();

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let add_buckets_ids = BTreeSet::from_iter(vec![bucket_id]);

        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_bag_id(bag_id.clone())
            .with_add_bucket_ids(add_buckets_ids.clone())
            .call_and_assert(Ok(()));

        // Add check
        let bag = Storage::bag(&bag_id);
        assert_eq!(bag.stored_by, add_buckets_ids);

        let bucket = Storage::storage_bucket_by_id(&bucket_id);
        assert_eq!(bucket.assigned_bags, 1);

        // ******
        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_bag_id(bag_id.clone())
            .with_remove_bucket_ids(add_buckets_ids.clone())
            .call_and_assert(Ok(()));

        let bag = Storage::bag(&bag_id);
        assert_eq!(bag.stored_by.len(), 0);

        let bucket = Storage::storage_bucket_by_id(&bucket_id);
        assert_eq!(bucket.assigned_bags, 0);
    });
}

#[test]
fn update_storage_buckets_for_bags_fails_with_non_existing_dynamic_bag() {
    build_test_externalities().execute_with(|| {
        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);
        let bag_id = BagId::<Test>::Dynamic(dynamic_bag_id.clone());

        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let invite_worker = Some(storage_provider_id);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        let add_buckets = BTreeSet::from_iter(vec![bucket_id]);

        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_bag_id(bag_id.clone())
            .with_add_bucket_ids(add_buckets.clone())
            .call_and_assert(Err(Error::<Test>::DynamicBagDoesntExist.into()));
    });
}

#[test]
fn update_storage_buckets_for_bags_fails_with_non_accepting_new_bags_bucket() {
    build_test_externalities().execute_with(|| {
        let static_bag_id = StaticBagId::Council;
        let bag_id = BagId::<Test>::Static(static_bag_id.clone());

        set_default_update_storage_buckets_per_bag_limit();

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(None)
            .with_accepting_new_bags(false)
            .call_and_assert(Ok(()))
            .unwrap();

        let add_buckets = BTreeSet::from_iter(vec![bucket_id]);

        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_bag_id(bag_id.clone())
            .with_add_bucket_ids(add_buckets.clone())
            .call_and_assert(Err(Error::<Test>::StorageBucketDoesntAcceptNewBags.into()));
    });
}

#[test]
fn update_storage_buckets_for_bags_succeeded_with_voucher_usage() {
    build_test_externalities().execute_with(|| {
        let bag_id = BagId::<Test>::Static(StaticBagId::Council);

        set_default_update_storage_buckets_per_bag_limit();
        let old_bucket_id = create_default_storage_bucket_and_assign_to_bag(bag_id.clone());

        let object_creation_list = create_single_data_object();

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let upload_params = UploadParameters::<Test> {
            bag_id: bag_id.clone(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        let objects_limit = 1;
        let size_limit = 100;

        let new_bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_objects_limit(objects_limit)
            .with_size_limit(size_limit)
            .call_and_assert(Ok(()))
            .unwrap();

        let old_buckets = BTreeSet::from_iter(vec![old_bucket_id]);
        let new_buckets = BTreeSet::from_iter(vec![new_bucket_id]);

        let bag = Storage::static_bag(&StaticBagId::Council);
        assert_eq!(bag.stored_by, old_buckets);

        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_bag_id(bag_id.clone())
            .with_add_bucket_ids(new_buckets.clone())
            .with_remove_bucket_ids(old_buckets.clone())
            .call_and_assert(Ok(()));

        let bag = Storage::static_bag(&StaticBagId::Council);
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
        set_default_update_storage_buckets_per_bag_limit();

        let bag_id = BagId::<Test>::Static(StaticBagId::Council);

        create_default_storage_bucket_and_assign_to_bag(bag_id.clone());

        let object_creation_list = create_single_data_object();

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let upload_params = UploadParameters::<Test> {
            bag_id: bag_id.clone(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        let new_bucket_objects_limit = 0;
        let new_bucket_size_limit = 100;
        let new_bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_objects_limit(new_bucket_objects_limit)
            .with_size_limit(new_bucket_size_limit)
            .call_and_assert(Ok(()))
            .unwrap();

        let new_buckets = BTreeSet::from_iter(vec![new_bucket_id]);

        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_bag_id(bag_id.clone())
            .with_add_bucket_ids(new_buckets.clone())
            .call_and_assert(Err(
                Error::<Test>::StorageBucketObjectNumberLimitReached.into()
            ));
    });
}

#[test]
fn update_storage_buckets_for_bags_fails_with_exceeding_the_voucher_objects_total_size_limit() {
    build_test_externalities().execute_with(|| {
        let bag_id = BagId::<Test>::Static(StaticBagId::Council);

        set_default_update_storage_buckets_per_bag_limit();
        create_default_storage_bucket_and_assign_to_bag(bag_id.clone());

        let object_creation_list = create_single_data_object();

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let upload_params = UploadParameters::<Test> {
            bag_id: bag_id.clone(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        let new_bucket_objects_limit = 1;
        let new_bucket_size_limit = 5;
        let new_bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_objects_limit(new_bucket_objects_limit)
            .with_size_limit(new_bucket_size_limit)
            .call_and_assert(Ok(()))
            .unwrap();

        let new_buckets = BTreeSet::from_iter(vec![new_bucket_id]);

        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_bag_id(bag_id.clone())
            .with_add_bucket_ids(new_buckets.clone())
            .call_and_assert(Err(
                Error::<Test>::StorageBucketObjectSizeLimitReached.into()
            ));
    });
}

#[test]
fn update_storage_buckets_for_working_group_static_bags_succeeded() {
    build_test_externalities().execute_with(|| {
        set_default_update_storage_buckets_per_bag_limit();

        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let invite_worker = Some(storage_provider_id);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        let buckets = BTreeSet::from_iter(vec![bucket_id]);

        let static_bag_id = StaticBagId::WorkingGroup(WorkingGroup::Storage);
        let bag_id = BagId::<Test>::Static(static_bag_id.clone());

        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_bag_id(bag_id.clone())
            .with_add_bucket_ids(buckets.clone())
            .call_and_assert(Ok(()));

        let bag = Storage::static_bag(&static_bag_id);
        assert_eq!(bag.stored_by, buckets);
    });
}

#[test]
fn update_storage_buckets_for_dynamic_bags_succeeded() {
    build_test_externalities().execute_with(|| {
        set_default_update_storage_buckets_per_bag_limit();

        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let invite_worker = Some(storage_provider_id);

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER - 1);
        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        let mut buckets = BTreeSet::from_iter(storage_buckets.into_iter());
        buckets.insert(bucket_id);

        let member_id = 10;
        let dynamic_bag_id = DynamicBagId::<Test>::Member(member_id);
        let bag_id = BagId::<Test>::Dynamic(dynamic_bag_id.clone());
        create_dynamic_bag(&dynamic_bag_id, buckets.clone());

        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_bag_id(bag_id.clone())
            .with_remove_bucket_ids(buckets.clone())
            .call_and_assert(Ok(()));

        let bag_id: BagId<Test> = dynamic_bag_id.clone().into();
        let bag: crate::Bag<Test> = <crate::Bags<Test>>::get(bag_id);
        assert_eq!(bag.stored_by, BTreeSet::new());
    });
}

#[test]
fn update_storage_buckets_for_bags_fails_with_non_leader_origin() {
    build_test_externalities().execute_with(|| {
        let non_leader_id = 11;

        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(non_leader_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn update_storage_buckets_for_bags_fails_with_empty_params() {
    build_test_externalities().execute_with(|| {
        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::StorageBucketIdCollectionsAreEmpty.into()));
    });
}

#[test]
fn update_storage_buckets_for_bags_fails_with_non_existing_storage_buckets() {
    build_test_externalities().execute_with(|| {
        set_default_update_storage_buckets_per_bag_limit();

        let invalid_bucket_id = 11000;
        let buckets = BTreeSet::from_iter(vec![invalid_bucket_id]);
        let bag_id = BagId::<Test>::Static(StaticBagId::Council);

        // Invalid added bucket ID.
        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_bag_id(bag_id.clone())
            .with_add_bucket_ids(buckets.clone())
            .call_and_assert(Err(Error::<Test>::StorageBucketDoesntExist.into()));

        // Invalid removed bucket ID.
        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_bag_id(bag_id.clone())
            .with_remove_bucket_ids(buckets.clone())
            .call_and_assert(Err(Error::<Test>::StorageBucketDoesntExist.into()));
    });
}
#[test]
fn update_storage_buckets_for_bags_fails_with_going_beyond_the_buckets_per_bag_limit() {
    build_test_externalities().execute_with(|| {
        let limit = 3;
        set_update_storage_buckets_per_bag_limit(limit);

        let buckets = BTreeSet::from_iter((0..=limit).into_iter());
        let bag_id = BagId::<Test>::Static(StaticBagId::Council);

        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_bag_id(bag_id.clone())
            .with_add_bucket_ids(buckets.clone())
            .call_and_assert(Err(Error::<Test>::StorageBucketPerBagLimitExceeded.into()));
    });
}

#[test]
fn update_storage_buckets_succeeds_with_add_remove_within_limits() {
    build_test_externalities().execute_with(|| {
        let bag_id = BagId::<Test>::Static(StaticBagId::Council);

        let bucket1 = create_default_storage_bucket_and_assign_to_bag(bag_id.clone());
        let _bucket2 = create_default_storage_bucket_and_assign_to_bag(bag_id.clone());
        let _bucket3 = create_default_storage_bucket_and_assign_to_bag(bag_id.clone());

        let bucket4 = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let limit = 3;
        set_update_storage_buckets_per_bag_limit(limit);

        let add_buckets = BTreeSet::from_iter(vec![bucket4]);

        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_bag_id(bag_id.clone())
            .with_add_bucket_ids(add_buckets.clone())
            .call_and_assert(Err(Error::<Test>::StorageBucketPerBagLimitExceeded.into()));

        let remove_buckets = BTreeSet::from_iter(vec![bucket1]);

        UpdateStorageBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_bag_id(bag_id.clone())
            .with_add_bucket_ids(add_buckets)
            .with_remove_bucket_ids(remove_buckets)
            .call_and_assert(Ok(()));
    });
}

#[test]
fn upload_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let data_object_deletion_prize = 10;
        set_data_object_deletion_prize_value(data_object_deletion_prize);

        let upload_params = UploadParameters::<Test> {
            bag_id: BagId::<Test>::Static(StaticBagId::Council),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        // check bag content
        let data_object_id = 0u64;
        let bag_id: BagId<Test> = StaticBagId::Council.into();
        let bag = Storage::bag(&bag_id);

        assert_eq!(bag.objects_number, 1);
        assert_eq!(
            bag.objects_total_size,
            upload_params.object_creation_list[0].size
        );
        assert_eq!(
            Storage::data_object_by_id(&bag_id, &data_object_id),
            DataObject {
                size: upload_params.object_creation_list[0].size,
                ipfs_content_id: upload_params.object_creation_list[0]
                    .ipfs_content_id
                    .clone(),
                deletion_prize: data_object_deletion_prize,
                accepted: false,
            }
        );

        // check balances
        assert_eq!(
            Balances::usable_balance(&DEFAULT_MEMBER_ACCOUNT_ID),
            initial_balance - data_object_deletion_prize
        );
        assert_eq!(
            Balances::usable_balance(&<StorageTreasury<Test>>::module_account_id()),
            data_object_deletion_prize
        );

        EventFixture::assert_last_crate_event(RawEvent::DataObjectsUploaded(
            vec![data_object_id],
            upload_params,
            data_object_deletion_prize,
        ));
    });
}

#[test]
fn upload_failed_with_exceeding_the_data_object_max_size() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let mut data_object_list = create_single_data_object();
        data_object_list[0].size = MaxDataObjectSize::get() + 1;

        let upload_params = UploadParameters::<Test> {
            bag_id: BagId::<Test>::Static(StaticBagId::Council),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: data_object_list,
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Err(Error::<Test>::MaxDataObjectSizeExceeded.into()));
    });
}

#[test]
fn upload_succeeded_with_data_size_fee() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let data_size_fee = 100;

        let data_object_deletion_prize = 10;
        set_data_object_deletion_prize_value(data_object_deletion_prize);

        UpdateDataObjectPerMegabyteFeeFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_new_fee(data_size_fee)
            .call_and_assert(Ok(()));

        let upload_params = UploadParameters::<Test> {
            bag_id: BagId::<Test>::Static(StaticBagId::Council),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        // check balances
        assert_eq!(
            Balances::usable_balance(&DEFAULT_MEMBER_ACCOUNT_ID),
            initial_balance - data_object_deletion_prize - data_size_fee
        );
        assert_eq!(
            Balances::usable_balance(&<StorageTreasury<Test>>::module_account_id()),
            data_object_deletion_prize
        );
    });
}

#[test]
fn upload_succeeded_with_active_storage_bucket_having_voucher() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let bag_id = BagId::<Test>::Static(StaticBagId::Council);

        let bucket_id = create_default_storage_bucket_and_assign_to_bag(bag_id.clone());

        let object_creation_list = create_single_data_object();

        let upload_params = UploadParameters::<Test> {
            bag_id,
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
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

        let bag_id = BagId::<Test>::Static(StaticBagId::Council);
        let objects_limit = 1;
        let size_limit = 100;

        create_storage_bucket_and_assign_to_bag(bag_id.clone(), None, objects_limit, size_limit);

        let object_creation_list = create_single_data_object();

        let upload_params = UploadParameters::<Test> {
            bag_id,
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
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

        let bag_id = BagId::<Test>::Static(StaticBagId::Council);
        let objects_limit = 1;
        let size_limit = 1;

        create_storage_bucket_and_assign_to_bag(bag_id.clone(), None, objects_limit, size_limit);

        let object_creation_list = create_single_data_object();

        let upload_params = UploadParameters::<Test> {
            bag_id,
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
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

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);
        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);
        create_dynamic_bag(&dynamic_bag_id, storage_buckets);

        let data_object_deletion_prize = 10;
        set_data_object_deletion_prize_value(data_object_deletion_prize);

        let upload_params = UploadParameters::<Test> {
            bag_id: BagId::<Test>::Dynamic(dynamic_bag_id.clone()),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        // check bag content
        let data_object_id = 0u64;
        let bag_id: BagId<Test> = dynamic_bag_id.into();
        let bag = <crate::Bags<Test>>::get(&bag_id);

        assert_eq!(bag.objects_number, 1);
        assert_eq!(
            bag.objects_total_size,
            upload_params.object_creation_list[0].size
        );
        assert_eq!(
            Storage::data_object_by_id(&bag_id, &data_object_id),
            DataObject {
                size: upload_params.object_creation_list[0].size,
                ipfs_content_id: upload_params.object_creation_list[0]
                    .ipfs_content_id
                    .clone(),
                deletion_prize: data_object_deletion_prize,
                accepted: false,
            }
        );
    });
}

#[test]
fn upload_fails_with_non_existent_dynamic_bag() {
    build_test_externalities().execute_with(|| {
        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);

        let upload_params = UploadParameters::<Test> {
            bag_id: BagId::<Test>::Dynamic(dynamic_bag_id.clone()),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Err(Error::<Test>::DynamicBagDoesntExist.into()));
    });
}

#[test]
fn upload_succeeded_with_non_empty_bag() {
    build_test_externalities().execute_with(|| {
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, 1000);

        let upload_params1 = UploadParameters::<Test> {
            bag_id: BagId::<Test>::Static(StaticBagId::Council),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_data_object_candidates(1, 2),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        UploadFixture::default()
            .with_params(upload_params1.clone())
            .call_and_assert(Ok(()));

        let upload_params2 = UploadParameters::<Test> {
            bag_id: BagId::<Test>::Static(StaticBagId::Council),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_data_object_candidates(3, 2),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        UploadFixture::default()
            .with_params(upload_params2.clone())
            .call_and_assert(Ok(()));

        let bag = Storage::static_bag(&StaticBagId::Council);
        assert_eq!(bag.objects_number, 4);
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
            bag_id: BagId::<Test>::Static(StaticBagId::Council),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: vec![DataObjectCreationParameters {
                ipfs_content_id: vec![1],
                size: 0,
            }],
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
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
            bag_id: BagId::<Test>::Static(StaticBagId::Council),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: vec![DataObjectCreationParameters {
                ipfs_content_id: Vec::new(),
                size: 220,
            }],
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        UploadFixture::default()
            .with_params(upload_params)
            .call_and_assert(Err(Error::<Test>::EmptyContentId.into()));
    });
}

#[test]
fn upload_fails_with_insufficient_balance_for_deletion_prize() {
    build_test_externalities().execute_with(|| {
        let upload_params = UploadParameters::<Test> {
            bag_id: BagId::<Test>::Static(StaticBagId::Council),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        let data_object_deletion_prize = 10;
        set_data_object_deletion_prize_value(data_object_deletion_prize);

        UploadFixture::default()
            .with_params(upload_params)
            .with_expected_data_object_deletion_prize(data_object_deletion_prize)
            .call_and_assert(Err(Error::<Test>::InsufficientBalance.into()));
    });
}

#[test]
fn upload_fails_with_invalid_deletion_prize() {
    build_test_externalities().execute_with(|| {
        let upload_params = UploadParameters::<Test> {
            bag_id: BagId::<Test>::Static(StaticBagId::Council),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        let data_object_deletion_prize = 10;
        set_data_object_deletion_prize_value(data_object_deletion_prize);

        let invalid_data_object_deletion_prize = 110;
        UploadFixture::default()
            .with_params(upload_params)
            .with_expected_data_object_deletion_prize(invalid_data_object_deletion_prize)
            .call_and_assert(Err(Error::<Test>::DataObjectDeletionPrizeChanged.into()));
    });
}

#[test]
fn upload_fails_with_insufficient_balance_for_data_size_fee() {
    build_test_externalities().execute_with(|| {
        let data_object_deletion_prize = 10;

        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, data_object_deletion_prize);

        let upload_params = UploadParameters::<Test> {
            bag_id: BagId::<Test>::Static(StaticBagId::Council),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        // Check that balance is sufficient for the deletion prize.
        //        assert_eq!(Storage::can_upload_data_objects(&upload_params), Ok(()));

        let data_size_fee = 1000;

        UpdateDataObjectPerMegabyteFeeFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_new_fee(data_size_fee)
            .call_and_assert(Ok(()));

        // Update fee parameter after the change.
        let upload_params = UploadParameters::<Test> {
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..upload_params
        };

        UploadFixture::default()
            .with_params(upload_params)
            .call_and_assert(Err(Error::<Test>::InsufficientBalance.into()));
    });
}

#[test]
fn upload_fails_with_data_size_fee_changed() {
    build_test_externalities().execute_with(|| {
        let data_object_deletion_prize = 10;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, data_object_deletion_prize);

        let upload_params = UploadParameters::<Test> {
            bag_id: BagId::<Test>::Static(StaticBagId::Council),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        let data_size_fee = 1000;

        UpdateDataObjectPerMegabyteFeeFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_new_fee(data_size_fee)
            .call_and_assert(Ok(()));

        UploadFixture::default()
            .with_params(upload_params)
            .call_and_assert(Err(Error::<Test>::DataSizeFeeChanged.into()));
    });
}

#[test]
fn upload_failed_with_blocked_uploading() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let upload_params = UploadParameters::<Test> {
            bag_id: BagId::<Test>::Static(StaticBagId::Council),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        let new_blocking_status = true;
        UpdateUploadingBlockedStatusFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
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
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_add_hashes(add_hashes)
            .call_and_assert(Ok(()));

        let upload_params = UploadParameters::<Test> {
            bag_id: BagId::<Test>::Static(StaticBagId::Council),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list,
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
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

        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let invite_worker = Some(storage_provider_id);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
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
        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let invite_worker = Some(storage_provider_id);

        // Missing invitation
        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        SetStorageOperatorMetadataFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Err(Error::<Test>::StorageProviderMustBeSet.into()));

        // Not accepted invitation
        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
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

        set_max_voucher_limits();
        set_default_update_storage_buckets_per_bag_limit();

        let static_bag_id = StaticBagId::Council;
        let bag_id: BagId<Test> = static_bag_id.into();

        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let objects_limit = 1;
        let size_limit = 100;

        let bucket_id = create_storage_bucket_and_assign_to_bag(
            bag_id.clone(),
            Some(storage_provider_id),
            objects_limit,
            size_limit,
        );

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let upload_params = UploadParameters::<Test> {
            bag_id: bag_id.clone(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        let data_object_id = 0; // just uploaded data object

        let data_object_ids = BTreeSet::from_iter(vec![data_object_id]);

        let data_object = Storage::ensure_data_object_exists(&bag_id, &data_object_id).unwrap();
        // Check `accepted` flag for the fist data object in the bag.
        assert_eq!(data_object.accepted, false);

        AcceptPendingDataObjectsFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_worker_id(storage_provider_id)
            .with_storage_bucket_id(bucket_id)
            .with_bag_id(bag_id.clone())
            .with_data_object_ids(data_object_ids.clone())
            .call_and_assert(Ok(()));

        let data_object = Storage::ensure_data_object_exists(&bag_id, &data_object_id).unwrap();
        // Check `accepted` flag for the fist data object in the bag.
        assert_eq!(data_object.accepted, true);

        EventFixture::assert_last_crate_event(RawEvent::PendingDataObjectsAccepted(
            bucket_id,
            storage_provider_id,
            bag_id,
            data_object_ids,
        ));
    });
}

#[test]
fn accept_pending_data_objects_fails_with_unrelated_storage_bucket() {
    build_test_externalities().execute_with(|| {
        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let invite_worker = Some(storage_provider_id);

        let static_bag_id = StaticBagId::Council;
        let bag_id = BagId::<Test>::Static(static_bag_id);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_transactor_account_id(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID)
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Ok(()));

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let upload_params = UploadParameters::<Test> {
            bag_id: bag_id.clone(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        let data_object_id = 0;

        let data_object_ids = BTreeSet::from_iter(vec![data_object_id]);

        AcceptPendingDataObjectsFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_worker_id(storage_provider_id)
            .with_storage_bucket_id(bucket_id)
            .with_bag_id(bag_id.clone())
            .with_data_object_ids(data_object_ids)
            .call_and_assert(Err(Error::<Test>::StorageBucketIsNotBoundToBag.into()));
    });
}

#[test]
fn accept_pending_data_objects_fails_with_non_existing_dynamic_bag() {
    build_test_externalities().execute_with(|| {
        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let invite_worker = Some(storage_provider_id);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_transactor_account_id(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID)
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Ok(()));

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);
        let bag_id = BagId::<Test>::Dynamic(dynamic_bag_id.clone());

        let data_object_id = 0;

        let data_object_ids = BTreeSet::from_iter(vec![data_object_id]);

        AcceptPendingDataObjectsFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_worker_id(storage_provider_id)
            .with_storage_bucket_id(bucket_id)
            .with_bag_id(bag_id.clone())
            .with_data_object_ids(data_object_ids)
            .call_and_assert(Err(Error::<Test>::DynamicBagDoesntExist.into()));
    });
}

#[test]
fn accept_pending_data_objects_fails_with_invalid_transactor_account_id() {
    build_test_externalities().execute_with(|| {
        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let invite_worker = Some(storage_provider_id);
        let transactor_account_id = 11111;

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_transactor_account_id(transactor_account_id)
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Ok(()));

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);
        let bag_id = BagId::<Test>::Dynamic(dynamic_bag_id.clone());

        let data_object_id = 0;

        let data_object_ids = BTreeSet::from_iter(vec![data_object_id]);

        AcceptPendingDataObjectsFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_worker_id(storage_provider_id)
            .with_storage_bucket_id(bucket_id)
            .with_bag_id(bag_id.clone())
            .with_data_object_ids(data_object_ids)
            .call_and_assert(Err(Error::<Test>::InvalidTransactorAccount.into()));
    });
}

#[test]
fn accept_pending_data_objects_succeeded_with_dynamic_bag() {
    build_test_externalities().execute_with(|| {
        set_max_voucher_limits();

        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let invite_worker = Some(storage_provider_id);
        let objects_limit = 1;
        let size_limit = 100;

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .with_objects_limit(objects_limit)
            .with_size_limit(size_limit)
            .call_and_assert(Ok(()))
            .unwrap();

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_transactor_account_id(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID)
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Ok(()));

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER - 1);
        let mut buckets = BTreeSet::from_iter(storage_buckets.into_iter());
        buckets.insert(bucket_id);

        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);
        create_dynamic_bag(&dynamic_bag_id, buckets);

        let bag_id = BagId::<Test>::Dynamic(dynamic_bag_id.clone());
        let upload_params = UploadParameters::<Test> {
            bag_id: bag_id.clone(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        let data_object_id = 0; // just uploaded data object

        let data_object_ids = BTreeSet::from_iter(vec![data_object_id]);

        AcceptPendingDataObjectsFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_worker_id(storage_provider_id)
            .with_bag_id(bag_id.clone())
            .with_data_object_ids(data_object_ids)
            .call_and_assert(Ok(()));

        let bag_id = dynamic_bag_id.into();
        let data_object = Storage::ensure_data_object_exists(&bag_id, &data_object_id).unwrap();
        // Check `accepted` flag for the fist data object in the bag.
        assert_eq!(data_object.accepted, true);
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
        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let objects_limit = 1;
        let size_limit = 100;
        let bag_id = BagId::<Test>::Static(StaticBagId::Council);

        let bucket_id = create_storage_bucket_and_assign_to_bag(
            bag_id.clone(),
            Some(storage_provider_id),
            objects_limit,
            size_limit,
        );

        AcceptPendingDataObjectsFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .with_data_object_ids(BTreeSet::new())
            .call_and_assert(Err(Error::<Test>::DataObjectIdParamsAreEmpty.into()));
    });
}

#[test]
fn accept_pending_data_objects_fails_with_non_existing_data_object() {
    build_test_externalities().execute_with(|| {
        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let objects_limit = 1;
        let size_limit = 100;
        let bag_id = BagId::<Test>::Static(StaticBagId::Council);

        let bucket_id = create_storage_bucket_and_assign_to_bag(
            bag_id.clone(),
            Some(storage_provider_id),
            objects_limit,
            size_limit,
        );

        let data_object_id = 0;

        let data_object_ids = BTreeSet::from_iter(vec![data_object_id]);

        AcceptPendingDataObjectsFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_bag_id(bag_id.clone())
            .with_data_object_ids(data_object_ids)
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Err(Error::<Test>::DataObjectDoesntExist.into()));
    });
}

#[test]
fn accept_pending_data_objects_fails_with_invalid_storage_provider() {
    build_test_externalities().execute_with(|| {
        let bag_id = BagId::<Test>::Static(StaticBagId::Council);

        let bucket_id = create_default_storage_bucket_and_assign_to_bag(bag_id.clone());

        AcceptPendingDataObjectsFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .call_and_assert(Err(Error::<Test>::StorageProviderMustBeSet.into()));
    });
}

#[test]
fn accept_pending_data_objects_fails_with_non_existing_bucket_id() {
    build_test_externalities().execute_with(|| {
        AcceptPendingDataObjectsFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::StorageBucketDoesntExist.into()));
    });
}

#[test]
fn cancel_storage_bucket_operator_invite_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let invite_worker = Some(storage_provider_id);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        CancelStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
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
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::StorageBucketDoesntExist.into()));
    });
}

#[test]
fn cancel_storage_bucket_operator_invite_fails_with_non_invited_storage_provider() {
    build_test_externalities().execute_with(|| {
        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(None)
            .call_and_assert(Ok(()))
            .unwrap();

        CancelStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .call_and_assert(Err(Error::<Test>::NoStorageBucketInvitation.into()));
    });
}

#[test]
fn cancel_storage_bucket_operator_invite_fails_with_already_set_storage_provider() {
    build_test_externalities().execute_with(|| {
        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(Some(storage_provider_id))
            .call_and_assert(Ok(()))
            .unwrap();

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Ok(()));

        CancelStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .call_and_assert(Err(Error::<Test>::StorageProviderAlreadySet.into()));
    });
}

#[test]
fn invite_storage_bucket_operator_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        InviteStorageBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
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
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::StorageBucketDoesntExist.into()));
    });
}

#[test]
fn invite_storage_bucket_operator_fails_with_non_missing_invitation() {
    build_test_externalities().execute_with(|| {
        let invited_worker_id = DEFAULT_STORAGE_PROVIDER_ID;

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(Some(invited_worker_id))
            .call_and_assert(Ok(()))
            .unwrap();

        InviteStorageBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .call_and_assert(Err(Error::<Test>::InvitedStorageProvider.into()));
    });
}

#[test]
fn invite_storage_bucket_operator_fails_with_invalid_storage_provider_id() {
    build_test_externalities().execute_with(|| {
        let invalid_storage_provider_id = 155;

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        InviteStorageBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_operator_worker_id(invalid_storage_provider_id)
            .call_and_assert(Err(Error::<Test>::StorageProviderOperatorDoesntExist.into()));
    });
}

#[test]
fn update_uploading_blocked_status_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let new_blocking_status = true;

        UpdateUploadingBlockedStatusFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
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

        let storage_buckets1 = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);
        let src_dynamic_bag_id = DynamicBagId::<Test>::Member(1u64);
        let src_bag_id = BagId::<Test>::Dynamic(src_dynamic_bag_id.clone());
        create_dynamic_bag(&src_dynamic_bag_id, storage_buckets1);

        let storage_buckets2 = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);
        let dest_dynamic_bag_id = DynamicBagId::<Test>::Member(2u64);
        let dest_bag_id = BagId::<Test>::Dynamic(dest_dynamic_bag_id.clone());
        create_dynamic_bag(&dest_dynamic_bag_id, storage_buckets2);

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let upload_params = UploadParameters::<Test> {
            bag_id: src_bag_id.clone(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        let data_object_id = 0u64;
        let ids = BTreeSet::from_iter(vec![data_object_id]);

        // Pre-checks
        assert!(<crate::DataObjectsById<Test>>::contains_key(
            &src_bag_id,
            &data_object_id
        ));
        assert!(!<crate::DataObjectsById<Test>>::contains_key(
            &dest_bag_id,
            &data_object_id
        ));

        MoveDataObjectsFixture::default()
            .with_src_bag_id(src_bag_id.clone())
            .with_dest_bag_id(dest_bag_id.clone())
            .with_data_object_ids(ids.clone())
            .call_and_assert(Ok(()));

        // Post-checks
        assert!(!<crate::DataObjectsById<Test>>::contains_key(
            &src_bag_id,
            &data_object_id
        ));
        assert!(<crate::DataObjectsById<Test>>::contains_key(
            &dest_bag_id,
            &data_object_id
        ));

        EventFixture::assert_last_crate_event(RawEvent::DataObjectsMoved(
            src_bag_id,
            dest_bag_id,
            ids,
        ));
    });
}

#[test]
fn move_data_objects_fails_with_non_existing_dynamic_bags() {
    build_test_externalities().execute_with(|| {
        let src_dynamic_bag_id = DynamicBagId::<Test>::Member(1u64);
        let src_bag_id = BagId::<Test>::Dynamic(src_dynamic_bag_id.clone());

        let dest_dynamic_bag_id = DynamicBagId::<Test>::Member(2u64);
        let dest_bag_id = BagId::<Test>::Dynamic(dest_dynamic_bag_id.clone());

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let data_object_id = 0u64;
        let ids = BTreeSet::from_iter(vec![data_object_id]);

        // Neigher src bag nor dest bag exist.
        MoveDataObjectsFixture::default()
            .with_src_bag_id(src_bag_id.clone())
            .with_dest_bag_id(dest_bag_id.clone())
            .with_data_object_ids(ids.clone())
            .call_and_assert(Err(Error::<Test>::DynamicBagDoesntExist.into()));

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);

        create_dynamic_bag(&src_dynamic_bag_id, storage_buckets);

        // Src bag exists, dest doesn't
        MoveDataObjectsFixture::default()
            .with_src_bag_id(src_bag_id.clone())
            .with_dest_bag_id(dest_bag_id.clone())
            .with_data_object_ids(ids.clone())
            .call_and_assert(Err(Error::<Test>::DynamicBagDoesntExist.into()));
    });
}

#[test]
fn move_data_objects_succeeded_having_voucher() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let working_group = WorkingGroup::Storage;
        let src_bag_id = BagId::<Test>::Static(StaticBagId::Council);
        let dest_bag_id = BagId::<Test>::Static(StaticBagId::WorkingGroup(working_group));

        let src_bucket_id = create_default_storage_bucket_and_assign_to_bag(src_bag_id.clone());
        let dest_bucket_id = create_default_storage_bucket_and_assign_to_bag(dest_bag_id.clone());

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let object_creation_list = create_single_data_object();

        let upload_params = UploadParameters::<Test> {
            bag_id: src_bag_id.clone(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
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
        let src_bag_id = BagId::<Test>::Static(StaticBagId::Council);
        let dest_bag_id = BagId::<Test>::Static(StaticBagId::WorkingGroup(working_group));

        let src_objects_limit = 1;
        let src_size_limit = 100;

        let dest_objects_limit = 0;
        let dest_size_limit = 100;

        create_storage_bucket_and_assign_to_bag(
            src_bag_id.clone(),
            None,
            src_objects_limit,
            src_size_limit,
        );
        create_storage_bucket_and_assign_to_bag(
            dest_bag_id.clone(),
            None,
            dest_objects_limit,
            dest_size_limit,
        );

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let object_creation_list = create_single_data_object();

        let upload_params = UploadParameters::<Test> {
            bag_id: src_bag_id.clone(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
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
        let src_bag_id = BagId::<Test>::Static(StaticBagId::Council);
        let dest_bag_id = BagId::<Test>::Static(StaticBagId::WorkingGroup(working_group));

        let src_objects_limit = 1;
        let src_size_limit = 100;

        let dest_objects_limit = 1;
        let dest_size_limit = 1;

        create_storage_bucket_and_assign_to_bag(
            src_bag_id.clone(),
            None,
            src_objects_limit,
            src_size_limit,
        );
        create_storage_bucket_and_assign_to_bag(
            dest_bag_id.clone(),
            None,
            dest_objects_limit,
            dest_size_limit,
        );

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let object_creation_list = create_single_data_object();

        let upload_params = UploadParameters::<Test> {
            bag_id: src_bag_id.clone(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
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
        let dest_bag_id = BagId::<Test>::Static(StaticBagId::WorkingGroup(WorkingGroup::Storage));

        MoveDataObjectsFixture::default()
            .with_dest_bag_id(dest_bag_id)
            .call_and_assert(Err(Error::<Test>::DataObjectIdCollectionIsEmpty.into()));
    });
}

#[test]
fn move_data_objects_fails_with_non_existent_data() {
    build_test_externalities().execute_with(|| {
        let dest_bag_id = BagId::<Test>::Static(StaticBagId::WorkingGroup(WorkingGroup::Storage));

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
        let src_bag_id = BagId::<Test>::Static(StaticBagId::Council);

        let dest_bag_id = BagId::<Test>::Static(StaticBagId::Council);

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

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let data_object_deletion_prize = 10;
        set_data_object_deletion_prize_value(data_object_deletion_prize);

        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);
        let bag_id = BagId::<Test>::Dynamic(dynamic_bag_id.clone());

        create_dynamic_bag(&dynamic_bag_id, storage_buckets);

        let upload_params = UploadParameters::<Test> {
            bag_id: bag_id.clone(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        let data_object_id = 0; // just uploaded data object

        let data_object_ids = BTreeSet::from_iter(vec![data_object_id]);

        // pre-checks
        assert!(<crate::DataObjectsById<Test>>::contains_key(
            &bag_id,
            &data_object_id
        ));

        assert_eq!(
            Balances::usable_balance(&DEFAULT_MEMBER_ACCOUNT_ID),
            initial_balance - data_object_deletion_prize
        );
        assert_eq!(
            Balances::usable_balance(&<StorageTreasury<Test>>::module_account_id()),
            data_object_deletion_prize
        );

        DeleteDataObjectsFixture::default()
            .with_bag_id(bag_id.clone())
            .with_data_object_ids(data_object_ids.clone())
            .with_deletion_account_id(DEFAULT_MEMBER_ACCOUNT_ID)
            .call_and_assert(Ok(()));

        // post-checks
        assert!(!<crate::DataObjectsById<Test>>::contains_key(
            &bag_id,
            &data_object_id
        ));

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
            bag_id,
            data_object_ids,
        ));
    });
}

#[test]
fn delete_data_objects_fails_with_non_existent_dynamic_bag() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);
        let bag_id = BagId::<Test>::Dynamic(dynamic_bag_id.clone());

        let data_object_id = 0;

        let data_object_ids = BTreeSet::from_iter(vec![data_object_id]);

        DeleteDataObjectsFixture::default()
            .with_bag_id(bag_id.clone())
            .with_data_object_ids(data_object_ids.clone())
            .with_deletion_account_id(DEFAULT_MEMBER_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::DynamicBagDoesntExist.into()));
    });
}

#[test]
fn delete_data_objects_fails_with_invalid_treasury_balance() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let invite_worker = Some(storage_provider_id);

        let data_object_deletion_prize = 10;
        set_data_object_deletion_prize_value(data_object_deletion_prize);

        CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let council_bag_id = BagId::<Test>::Static(StaticBagId::Council);
        let upload_params = UploadParameters::<Test> {
            bag_id: council_bag_id.clone(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: create_single_data_object(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        let data_object_id = 0; // just uploaded data object

        let data_object_ids = BTreeSet::from_iter(vec![data_object_id]);

        // Corrupt module balance.
        let _ = Balances::slash(
            &<StorageTreasury<Test>>::module_account_id(),
            <StorageTreasury<Test>>::usable_balance(),
        );

        DeleteDataObjectsFixture::default()
            .with_bag_id(council_bag_id.clone())
            .with_data_object_ids(data_object_ids.clone())
            .with_deletion_account_id(DEFAULT_MEMBER_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::InsufficientTreasuryBalance.into()));
    });
}

#[test]
fn delete_data_objects_succeeded_with_voucher_usage() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let bag_id = BagId::<Test>::Static(StaticBagId::Council);

        let bucket_id = create_default_storage_bucket_and_assign_to_bag(bag_id.clone());

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let object_creation_list = create_single_data_object();

        let upload_params = UploadParameters::<Test> {
            bag_id: bag_id.clone(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        EventFixture::contains_crate_event(RawEvent::BagObjectsChanged(
            bag_id.clone(),
            object_creation_list[0].size,
            1,
        ));

        let data_object_id = 0; // just uploaded data object

        let data_object_ids = BTreeSet::from_iter(vec![data_object_id]);

        //// Pre-check voucher
        let bucket = Storage::storage_bucket_by_id(bucket_id);

        assert_eq!(bucket.voucher.objects_used, 1);
        assert_eq!(bucket.voucher.size_used, object_creation_list[0].size);

        DeleteDataObjectsFixture::default()
            .with_bag_id(bag_id.clone())
            .with_data_object_ids(data_object_ids.clone())
            .call_and_assert(Ok(()));

        assert!(!<crate::DataObjectsById<Test>>::contains_key(
            &bag_id,
            &data_object_id
        ));

        //// Post-check voucher
        let bucket = Storage::storage_bucket_by_id(bucket_id);

        assert_eq!(bucket.voucher.objects_used, 0);
        assert_eq!(bucket.voucher.size_used, 0);

        EventFixture::contains_crate_event(RawEvent::BagObjectsChanged(bag_id.clone(), 0, 0));
    });
}

#[test]
fn delete_data_objects_fails_with_empty_params() {
    build_test_externalities().execute_with(|| {
        DeleteDataObjectsFixture::default()
            .call_and_assert(Err(Error::<Test>::DataObjectIdCollectionIsEmpty.into()));
    });
}

#[test]
fn delete_data_objects_fails_with_non_existing_data_object() {
    build_test_externalities().execute_with(|| {
        let council_bag_id = BagId::<Test>::Static(StaticBagId::Council);

        let data_object_id = 0;
        let data_object_ids = BTreeSet::from_iter(vec![data_object_id]);

        DeleteDataObjectsFixture::default()
            .with_bag_id(council_bag_id.clone())
            .with_data_object_ids(data_object_ids.clone())
            .call_and_assert(Err(Error::<Test>::DataObjectDoesntExist.into()));
    });
}

#[test]
fn update_storage_bucket_status_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let new_status = true;
        UpdateStorageBucketStatusFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_new_status(new_status)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::StorageBucketStatusUpdated(
            bucket_id, new_status,
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
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::StorageBucketDoesntExist.into()));
    });
}

#[test]
fn update_blacklist_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let cid1 = create_cid(1);
        let cid2 = create_cid(2);

        let add_hashes = BTreeSet::from_iter(vec![cid1.clone()]);
        UpdateBlacklistFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_add_hashes(add_hashes.clone())
            .call_and_assert(Ok(()));

        assert!(crate::Blacklist::contains_key(&cid1));
        assert_eq!(Storage::current_blacklist_size(), 1);

        let remove_hashes = BTreeSet::from_iter(vec![cid1.clone()]);
        let add_hashes = BTreeSet::from_iter(vec![cid2.clone()]);

        UpdateBlacklistFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
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
        let b: usize = BlacklistSizeLimit::get().saturated_into();
        let hashes = (0..b)
            .into_iter()
            .map(|i| create_cid(i.saturated_into()))
            .collect::<Vec<_>>();
        let cid1 = create_cid(1);
        let cid2 = create_cid(220);
        let cid3 = create_cid(221);

        let add_hashes = BTreeSet::from_iter(hashes);

        UpdateBlacklistFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_add_hashes(add_hashes.clone())
            .call_and_assert(Ok(()));

        let remove_hashes = BTreeSet::from_iter(vec![cid1.clone()]);
        let add_hashes = BTreeSet::from_iter(vec![cid2.clone(), cid3.clone()]);

        UpdateBlacklistFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
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
        let b: usize = BlacklistSizeLimit::get().saturated_into();
        let hashes = (0..b)
            .into_iter()
            .map(|i| create_cid(i.saturated_into()))
            .collect::<Vec<_>>();
        let cid1 = create_cid(1);
        let cid2 = create_cid(220);
        let cid3 = create_cid(221);

        let add_hashes = BTreeSet::from_iter(hashes);

        UpdateBlacklistFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_add_hashes(add_hashes.clone())
            .call_and_assert(Ok(()));

        let remove_hashes = BTreeSet::from_iter(vec![cid3.clone()]);
        let add_hashes = BTreeSet::from_iter(vec![cid2.clone()]);

        UpdateBlacklistFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
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
        let cid1 = create_cid(1);

        let add_hashes = BTreeSet::from_iter(vec![cid1.clone()]);

        UpdateBlacklistFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_add_hashes(add_hashes.clone())
            .call_and_assert(Ok(()));

        UpdateBlacklistFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_add_hashes(add_hashes.clone())
            .call_and_assert(Ok(()));

        assert!(crate::Blacklist::contains_key(&cid1));
        assert_eq!(Storage::current_blacklist_size(), 1);
    });
}

#[test]
fn update_blacklist_fails_with_invalid_length() {
    build_test_externalities().execute_with(|| {
        let cid1 = vec![1];

        let add_hashes = BTreeSet::from_iter(vec![cid1.clone()]);
        UpdateBlacklistFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_add_hashes(add_hashes.clone())
            .call_and_assert(Err(Error::<Test>::InvalidCidLength.into()));
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

fn create_default_storage_bucket_and_assign_to_bag(bag_id: BagId<Test>) -> u64 {
    let objects_limit = 1;
    let size_limit = 100;

    create_storage_bucket_and_assign_to_bag(bag_id, None, objects_limit, size_limit)
}

fn create_storage_bucket_and_assign_to_bag(
    bag_id: BagId<Test>,
    storage_provider_id: Option<u64>,
    objects_limit: u64,
    size_limit: u64,
) -> u64 {
    set_max_voucher_limits();
    set_default_update_storage_buckets_per_bag_limit();

    let bucket_id = CreateStorageBucketFixture::default()
        .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
        .with_invite_worker(storage_provider_id)
        .with_objects_limit(objects_limit)
        .with_size_limit(size_limit)
        .call_and_assert(Ok(()))
        .unwrap();

    let buckets = BTreeSet::from_iter(vec![bucket_id]);

    UpdateStorageBucketForBagsFixture::default()
        .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
        .with_bag_id(bag_id.clone())
        .with_add_bucket_ids(buckets.clone())
        .call_and_assert(Ok(()));

    if let Some(storage_provider_id) = storage_provider_id {
        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_transactor_account_id(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID)
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Ok(()));
    }

    bucket_id
}

#[test]
fn delete_dynamic_bags_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let bag_deletion_prize_value = 77;
        set_bag_deletion_prize_value(bag_deletion_prize_value);

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);

        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);

        create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);
        CreateDynamicBagFixture::default()
            .with_bag_id(dynamic_bag_id.clone())
            .with_storage_buckets(storage_buckets)
            .with_expected_dynamic_bag_deletion_prize(bag_deletion_prize_value)
            .call_and_assert(Ok(()));

        // pre-check balances
        assert_eq!(
            Balances::usable_balance(&DEFAULT_MEMBER_ACCOUNT_ID),
            initial_balance - bag_deletion_prize_value
        );
        assert_eq!(
            Balances::usable_balance(&<StorageTreasury<Test>>::module_account_id()),
            bag_deletion_prize_value
        );

        DeleteDynamicBagFixture::default()
            .with_bag_id(dynamic_bag_id.clone())
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

        EventFixture::assert_last_crate_event(RawEvent::DynamicBagDeleted(
            DEFAULT_MEMBER_ACCOUNT_ID,
            dynamic_bag_id,
        ));
    });
}

#[test]
fn delete_dynamic_bags_succeeded_with_assigned_distribution_buckets() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let family_policy_number1 = 2u32;
        let family_policy_number2 = 3u32;

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);

        let (family1, distribution_bucket_ids1) =
            create_distribution_bucket_family_with_buckets(family_policy_number1.into());
        let (family2, distribution_bucket_ids2) =
            create_distribution_bucket_family_with_buckets(family_policy_number2.into());

        let family_policy = BTreeMap::from_iter(vec![
            (family1, family_policy_number1),
            (family2, family_policy_number2),
        ]);

        UpdateFamiliesInDynamicBagCreationPolicyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_families(family_policy)
            .call_and_assert(Ok(()));

        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);
        CreateDynamicBagFixture::default()
            .with_bag_id(dynamic_bag_id.clone())
            .with_storage_buckets(storage_buckets)
            .with_distribution_buckets(
                distribution_bucket_ids1
                    .iter()
                    .chain(distribution_bucket_ids2.iter())
                    .cloned()
                    .collect(),
            )
            .call_and_assert(Ok(()));

        let bag_id: BagId<Test> = dynamic_bag_id.clone().into();
        let bag: crate::Bag<Test> = <crate::Bags<Test>>::get(bag_id);

        let total_distributed_buckets_number =
            distribution_bucket_ids1.len() + distribution_bucket_ids2.len();
        assert_eq!(
            bag.distributed_by.len(),
            total_distributed_buckets_number as usize
        );

        let distributed_by_bag = bag.distributed_by.clone();
        for distribution_bucket_id in &distributed_by_bag {
            let bucket = Storage::distribution_bucket_by_family_id_by_index(
                distribution_bucket_id.distribution_bucket_family_id,
                distribution_bucket_id.distribution_bucket_index,
            );

            assert_eq!(bucket.assigned_bags, 1);
        }

        DeleteDynamicBagFixture::default()
            .with_bag_id(dynamic_bag_id.clone())
            .with_deletion_account_id(DEFAULT_MEMBER_ACCOUNT_ID)
            .call_and_assert(Ok(()));

        for distribution_bucket_id in &distributed_by_bag {
            let bucket = Storage::distribution_bucket_by_family_id_by_index(
                distribution_bucket_id.distribution_bucket_family_id,
                distribution_bucket_id.distribution_bucket_index,
            );

            assert_eq!(bucket.assigned_bags, 0);
        }
    });
}

#[test]
fn delete_dynamic_bags_succeeded_with_assigned_storage_buckets() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let storage_buckets_number = DefaultMemberDynamicBagNumberOfStorageBuckets::get();
        let storage_buckets = create_storage_buckets(storage_buckets_number);

        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);
        CreateDynamicBagFixture::default()
            .with_bag_id(dynamic_bag_id.clone())
            .with_storage_buckets(storage_buckets.clone())
            .call_and_assert(Ok(()));

        let bag_id: BagId<Test> = dynamic_bag_id.clone().into();
        let bag = <crate::Bags<Test>>::get(&bag_id);

        assert_eq!(bag.stored_by, storage_buckets);

        let stored_by_bag = bag.stored_by.clone();
        for bucket_id in &stored_by_bag {
            let bucket = Storage::storage_bucket_by_id(bucket_id);

            assert_eq!(bucket.assigned_bags, 1);
        }

        DeleteDynamicBagFixture::default()
            .with_bag_id(dynamic_bag_id.clone())
            .with_deletion_account_id(DEFAULT_MEMBER_ACCOUNT_ID)
            .call_and_assert(Ok(()));

        for bucket_id in &stored_by_bag {
            let bucket = Storage::storage_bucket_by_id(bucket_id);

            assert_eq!(bucket.assigned_bags, 0);
        }
    });
}

#[test]
fn delete_dynamic_bags_fails_with_non_existent_dynamic_bag() {
    build_test_externalities().execute_with(|| {
        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);

        DeleteDynamicBagFixture::default()
            .with_bag_id(dynamic_bag_id.clone())
            .with_deletion_account_id(DEFAULT_MEMBER_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::DynamicBagDoesntExist.into()));
    });
}

#[test]
fn delete_dynamic_bags_fails_with_insufficient_balance_for_deletion_prize() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);
        set_bag_deletion_prize_value(BAG_DELETION_PRIZE_VALUE);

        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);

        create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);
        CreateDynamicBagFixture::default()
            .with_bag_id(dynamic_bag_id.clone())
            .with_expected_dynamic_bag_deletion_prize(BAG_DELETION_PRIZE_VALUE)
            .with_storage_buckets(storage_buckets)
            .call_and_assert(Ok(()));

        // Corrupt module balance.
        let _ = Balances::slash(
            &<StorageTreasury<Test>>::module_account_id(),
            <StorageTreasury<Test>>::usable_balance(),
        );

        DeleteDynamicBagFixture::default()
            .with_bag_id(dynamic_bag_id.clone())
            .with_deletion_account_id(DEFAULT_MEMBER_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::InsufficientTreasuryBalance.into()));
    });
}

#[test]
fn delete_storage_bucket_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        DeleteStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::StorageBucketDeleted(bucket_id));
    });
}

#[test]
fn delete_storage_bucket_fails_with_non_leader_origin() {
    build_test_externalities().execute_with(|| {
        let non_leader_id = 1;

        DeleteStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(non_leader_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn delete_storage_bucket_fails_with_non_existing_storage_bucket() {
    build_test_externalities().execute_with(|| {
        DeleteStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::StorageBucketDoesntExist.into()));
    });
}

#[test]
fn delete_storage_bucket_fails_with_non_empty_bucket() {
    build_test_externalities().execute_with(|| {
        let bag_id = BagId::<Test>::Static(StaticBagId::Council);

        let bucket_id = create_default_storage_bucket_and_assign_to_bag(bag_id.clone());

        let object_creation_list = create_single_data_object();

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let upload_params = UploadParameters::<Test> {
            bag_id: bag_id.clone(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
        };

        UploadFixture::default()
            .with_params(upload_params.clone())
            .call_and_assert(Ok(()));

        DeleteStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .call_and_assert(Err(Error::<Test>::CannotDeleteNonEmptyStorageBucket.into()));
    });
}

#[test]
fn delete_storage_bucket_fails_with_assigned_bag() {
    build_test_externalities().execute_with(|| {
        let bag_id = BagId::<Test>::Static(StaticBagId::Council);

        let bucket_id = create_default_storage_bucket_and_assign_to_bag(bag_id.clone());

        DeleteStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .call_and_assert(Err(Error::<Test>::StorageBucketIsBoundToBag.into()));
    });
}

#[test]
fn remove_storage_bucket_operator_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let invite_worker = Some(storage_provider_id);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Ok(()));

        RemoveStorageBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::StorageBucketOperatorRemoved(bucket_id));
    });
}

#[test]
fn remove_storage_bucket_operator_fails_with_non_leader_origin() {
    build_test_externalities().execute_with(|| {
        let non_storage_provider_id = 1;

        RemoveStorageBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(non_storage_provider_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn remove_storage_bucket_operator_fails_with_non_existing_storage_bucket() {
    build_test_externalities().execute_with(|| {
        RemoveStorageBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::StorageBucketDoesntExist.into()));
    });
}

#[test]
fn remove_storage_bucket_operator_fails_with_non_accepted_storage_provider() {
    build_test_externalities().execute_with(|| {
        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let invite_worker = Some(storage_provider_id);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        RemoveStorageBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .call_and_assert(Err(Error::<Test>::StorageProviderMustBeSet.into()));
    });
}

#[test]
fn remove_storage_bucket_operator_fails_with_missing_storage_provider() {
    build_test_externalities().execute_with(|| {
        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(None)
            .call_and_assert(Ok(()))
            .unwrap();

        RemoveStorageBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .call_and_assert(Err(Error::<Test>::StorageProviderMustBeSet.into()));
    });
}

#[test]
fn update_data_size_fee_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let new_fee = 1000;

        UpdateDataObjectPerMegabyteFeeFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_new_fee(new_fee)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::DataObjectPerMegabyteFeeUpdated(new_fee));
    });
}

#[test]
fn update_data_size_fee_fails_with_non_leader_origin() {
    build_test_externalities().execute_with(|| {
        let non_leader_id = 1;

        UpdateDataObjectPerMegabyteFeeFixture::default()
            .with_origin(RawOrigin::Signed(non_leader_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn data_size_fee_calculation_works_properly() {
    build_test_externalities().execute_with(|| {
        const ONE_MB: u64 = 1_048_576;

        // Fee set to zero.
        assert_eq!(Storage::calculate_data_storage_fee(ONE_MB), 0);

        let data_size_fee = 1000;

        UpdateDataObjectPerMegabyteFeeFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_new_fee(data_size_fee)
            .call_and_assert(Ok(()));

        // Fee set.
        assert_eq!(Storage::calculate_data_storage_fee(ONE_MB), data_size_fee);
        assert_eq!(
            Storage::calculate_data_storage_fee(2 * ONE_MB),
            2 * data_size_fee
        );

        // Rounding works correctly.
        assert_eq!(
            Storage::calculate_data_storage_fee(ONE_MB + 1),
            2 * data_size_fee
        );
    });
}

#[test]
fn storage_bucket_voucher_changed_event_fired() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);

        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);
        let bag_id = BagId::<Test>::Dynamic(dynamic_bag_id.clone());
        create_dynamic_bag(&dynamic_bag_id, storage_buckets);

        let objects_limit = 1;
        let size_limit = 100;

        let bucket_id = create_storage_bucket_and_assign_to_bag(
            bag_id.clone(),
            None,
            objects_limit,
            size_limit,
        );

        let object_creation_list = create_single_data_object();

        let initial_balance = 1000;
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, initial_balance);

        let upload_params = UploadParameters::<Test> {
            bag_id: bag_id.clone(),
            deletion_prize_source_account_id: DEFAULT_MEMBER_ACCOUNT_ID,
            object_creation_list: object_creation_list.clone(),
            expected_data_size_fee: Storage::data_object_per_mega_byte_fee(),
            expected_data_object_deletion_prize: Storage::data_object_deletion_prize_value(),
            expected_dynamic_bag_deletion_prize: Storage::dynamic_bag_deletion_prize_value(),
            ..Default::default()
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
fn update_storage_buckets_per_bag_limit_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let new_limit = 4;

        UpdateStorageBucketsPerBagLimitFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_new_limit(new_limit)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::StorageBucketsPerBagLimitUpdated(
            new_limit,
        ));
    });
}

#[test]
fn update_storage_buckets_per_bag_limit_origin() {
    build_test_externalities().execute_with(|| {
        let non_leader_id = 1;

        UpdateStorageBucketsPerBagLimitFixture::default()
            .with_origin(RawOrigin::Signed(non_leader_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn update_storage_buckets_per_bag_limit_fails_with_incorrect_value() {
    build_test_externalities().execute_with(|| {
        let new_limit = 0;

        UpdateStorageBucketsPerBagLimitFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_new_limit(new_limit)
            .call_and_assert(Err(Error::<Test>::StorageBucketsPerBagLimitTooLow.into()));

        let new_limit = 100;

        UpdateStorageBucketsPerBagLimitFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_new_limit(new_limit)
            .call_and_assert(Err(Error::<Test>::StorageBucketsPerBagLimitTooHigh.into()));
    });
}

fn set_update_storage_buckets_per_bag_limit(new_limit: u64) {
    UpdateStorageBucketsPerBagLimitFixture::default()
        .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
        .with_new_limit(new_limit)
        .call_and_assert(Ok(()))
}

fn set_default_update_storage_buckets_per_bag_limit() {
    let new_limit = 7;

    set_update_storage_buckets_per_bag_limit(new_limit);
}

#[test]
fn set_storage_bucket_voucher_limits_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        set_max_voucher_limits();

        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let invite_worker = Some(storage_provider_id);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Ok(()));

        let new_objects_size_limit = 1;
        let new_objects_number_limit = 1;

        SetStorageBucketVoucherLimitsFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_new_objects_number_limit(new_objects_number_limit)
            .with_new_objects_size_limit(new_objects_size_limit)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::StorageBucketVoucherLimitsSet(
            bucket_id,
            new_objects_size_limit,
            new_objects_number_limit,
        ));
    });
}

#[test]
fn set_storage_bucket_voucher_limits_fails_with_invalid_values() {
    build_test_externalities().execute_with(|| {
        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let invite_worker = Some(storage_provider_id);

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .call_and_assert(Ok(()));

        let invalid_objects_size_limit = 1000;
        let invalid_objects_number_limit = 1000;

        SetStorageBucketVoucherLimitsFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_new_objects_size_limit(invalid_objects_size_limit)
            .call_and_assert(Err(Error::<Test>::VoucherMaxObjectSizeLimitExceeded.into()));

        SetStorageBucketVoucherLimitsFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_new_objects_number_limit(invalid_objects_number_limit)
            .call_and_assert(Err(
                Error::<Test>::VoucherMaxObjectNumberLimitExceeded.into()
            ));
    });
}

#[test]
fn set_storage_bucket_voucher_limits_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        SetStorageBucketVoucherLimitsFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn set_storage_bucket_voucher_limits_fails_with_invalid_storage_bucket() {
    build_test_externalities().execute_with(|| {
        SetStorageBucketVoucherLimitsFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::StorageBucketDoesntExist.into()));
    });
}

fn set_max_voucher_limits() {
    set_max_voucher_limits_with_params(VOUCHER_SIZE_LIMIT, VOUCHER_OBJECTS_LIMIT);
}

fn set_max_voucher_limits_with_params(size_limit: u64, objects_limit: u64) {
    UpdateStorageBucketsVoucherMaxLimitsFixture::default()
        .with_new_objects_size_limit(size_limit)
        .with_new_objects_number_limit(objects_limit)
        .call_and_assert(Ok(()));
}

#[test]
fn update_storage_buckets_voucher_max_limits_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let new_size_limit = 14;
        let new_number_limit = 4;

        UpdateStorageBucketsVoucherMaxLimitsFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_new_objects_number_limit(new_number_limit)
            .with_new_objects_size_limit(new_size_limit)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::StorageBucketsVoucherMaxLimitsUpdated(
            new_size_limit,
            new_number_limit,
        ));
    });
}

#[test]
fn update_storage_buckets_voucher_max_limits_fails_with_bad_origin() {
    build_test_externalities().execute_with(|| {
        let non_leader_id = 1;

        UpdateStorageBucketsVoucherMaxLimitsFixture::default()
            .with_origin(RawOrigin::Signed(non_leader_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn create_dynamic_bag_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);
        let family_policy_number1 = 2u32;
        let family_policy_number2 = 3u32;

        let storage_bucket_ids = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);
        let (family1, distribution_bucket_ids1) =
            create_distribution_bucket_family_with_buckets(family_policy_number1.into());
        let (family2, distribution_bucket_ids2) =
            create_distribution_bucket_family_with_buckets(family_policy_number2.into());

        let family_policy = BTreeMap::from_iter(vec![
            (family1, family_policy_number1),
            (family2, family_policy_number2),
        ]);

        UpdateFamiliesInDynamicBagCreationPolicyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_families(family_policy)
            .call_and_assert(Ok(()));

        let bag_deletion_prize_value = 100;
        set_bag_deletion_prize_value(bag_deletion_prize_value);

        let deletion_prize_account_id = DEFAULT_MEMBER_ACCOUNT_ID;
        let initial_balance = 10000;
        increase_account_balance(&deletion_prize_account_id, initial_balance);

        // pre-check balances
        assert_eq!(
            Balances::usable_balance(&DEFAULT_MEMBER_ACCOUNT_ID),
            initial_balance
        );
        assert_eq!(
            Balances::usable_balance(&<StorageTreasury<Test>>::module_account_id()),
            0
        );

        CreateDynamicBagFixture::default()
            .with_bag_id(dynamic_bag_id.clone())
            .with_storage_buckets(storage_bucket_ids.clone())
            .with_distribution_buckets(
                distribution_bucket_ids1
                    .iter()
                    .chain(distribution_bucket_ids2.iter())
                    .cloned()
                    .collect(),
            )
            .with_expected_dynamic_bag_deletion_prize(bag_deletion_prize_value.clone())
            .call_and_assert(Ok(()));

        let bag_id: BagId<Test> = dynamic_bag_id.clone().into();
        let bag: crate::Bag<Test> = <crate::Bags<Test>>::get(bag_id.clone());

        // Check that IDs are within possible range.
        assert!(bag
            .stored_by
            .iter()
            .all(|id| { *id < Storage::next_storage_bucket_id() }));

        assert_eq!(bag.stored_by, storage_bucket_ids);

        let total_distributed_buckets_number =
            distribution_bucket_ids1.len() + distribution_bucket_ids2.len();
        assert_eq!(
            bag.distributed_by.len(),
            total_distributed_buckets_number as usize
        );

        for distribution_bucket_id in &bag.distributed_by {
            let bucket = Storage::distribution_bucket_by_family_id_by_index(
                distribution_bucket_id.distribution_bucket_family_id,
                distribution_bucket_id.distribution_bucket_index,
            );

            assert_eq!(bucket.assigned_bags, 1);
        }

        assert_eq!(bag.deletion_prize.unwrap(), bag_deletion_prize_value);

        // post-check balances
        assert_eq!(
            Balances::usable_balance(&DEFAULT_MEMBER_ACCOUNT_ID),
            initial_balance - bag_deletion_prize_value
        );
        assert_eq!(
            Balances::usable_balance(&<StorageTreasury<Test>>::module_account_id()),
            bag_deletion_prize_value
        );

        EventFixture::assert_last_crate_event(RawEvent::DynamicBagCreated(
            dynamic_bag_id,
            bag_deletion_prize_value,
            BTreeSet::from_iter(bag.stored_by),
            BTreeSet::from_iter(bag.distributed_by),
        ));
    });
}

#[test]
fn create_dynamic_bag_fails_with_insufficient_balance() {
    build_test_externalities().execute_with(|| {
        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);

        let bag_deletion_prize_value = 100;
        set_bag_deletion_prize_value(bag_deletion_prize_value);
        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);

        CreateDynamicBagFixture::default()
            .with_bag_id(dynamic_bag_id.clone())
            .with_storage_buckets(storage_buckets)
            .with_expected_dynamic_bag_deletion_prize(bag_deletion_prize_value)
            .with_deletion_prize_account_id(DEFAULT_MEMBER_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::InsufficientBalance.into()));
    });
}

#[test]
fn create_dynamic_bag_fails_with_invalid_dynamic_bag_deletion_prize() {
    build_test_externalities().execute_with(|| {
        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);

        let bag_deletion_prize_value = 100;
        set_bag_deletion_prize_value(bag_deletion_prize_value);
        create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);

        let invalid_dynamic_bag_deletion_prize = 55;
        CreateDynamicBagFixture::default()
            .with_bag_id(dynamic_bag_id.clone())
            .with_expected_dynamic_bag_deletion_prize(invalid_dynamic_bag_deletion_prize)
            .with_deletion_prize_account_id(DEFAULT_MEMBER_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::DynamicBagDeletionPrizeChanged.into()));
    });
}

#[test]
fn create_dynamic_bag_fails_with_invalid_data_object_deletion_prize() {
    build_test_externalities().execute_with(|| {
        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);

        let data_object_deletion_prize_value = 100;
        set_data_object_deletion_prize_value(data_object_deletion_prize_value);
        create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);

        let invalid_data_object_deletion_prize_value = 55;
        CreateDynamicBagFixture::default()
            .with_bag_id(dynamic_bag_id.clone())
            .with_expected_data_object_deletion_prize(invalid_data_object_deletion_prize_value)
            .with_deletion_prize_account_id(DEFAULT_MEMBER_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::DataObjectDeletionPrizeChanged.into()));
    });
}

#[test]
fn create_dynamic_bag_failed_with_existing_bag() {
    build_test_externalities().execute_with(|| {
        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);

        CreateDynamicBagFixture::default()
            .with_bag_id(dynamic_bag_id.clone())
            .with_storage_buckets(storage_buckets.clone())
            .call_and_assert(Ok(()));

        CreateDynamicBagFixture::default()
            .with_storage_buckets(storage_buckets)
            .with_bag_id(dynamic_bag_id.clone())
            .call_and_assert(Err(Error::<Test>::DynamicBagExists.into()));
    });
}

fn create_dynamic_bag(dynamic_bag_id: &DynamicBagId<Test>, storage_buckets: BTreeSet<u64>) {
    CreateDynamicBagFixture::default()
        .with_bag_id(dynamic_bag_id.clone())
        .with_storage_buckets(storage_buckets)
        .with_expected_dynamic_bag_deletion_prize(Storage::dynamic_bag_deletion_prize_value())
        .with_expected_data_object_deletion_prize(Storage::data_object_deletion_prize_value())
        .call_and_assert(Ok(()));
}

#[test]
fn update_number_of_storage_buckets_in_dynamic_bag_creation_policy_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let dynamic_bag_type = DynamicBagType::Channel;
        let new_bucket_number = 10;

        UpdateNumberOfStorageBucketsInDynamicBagCreationPolicyFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_new_storage_buckets_number(new_bucket_number)
            .with_dynamic_bag_type(dynamic_bag_type)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(
            RawEvent::NumberOfStorageBucketsInDynamicBagCreationPolicyUpdated(
                dynamic_bag_type,
                new_bucket_number,
            ),
        );
    });
}

#[test]
fn update_number_of_storage_buckets_in_dynamic_bag_creation_policy_failed_with_constraint_violation(
) {
    build_test_externalities().execute_with(|| {
        let dynamic_bag_type = DynamicBagType::Channel;

        let less_than_allowed_new_bucket_number = 1;
        UpdateNumberOfStorageBucketsInDynamicBagCreationPolicyFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_new_storage_buckets_number(less_than_allowed_new_bucket_number)
            .with_dynamic_bag_type(dynamic_bag_type)
            .call_and_assert(Err(
                Error::<Test>::NumberOfStorageBucketsOutsideOfAllowedContraints.into(),
            ));

        let more_than_allowed_new_bucket_number = 11;
        UpdateNumberOfStorageBucketsInDynamicBagCreationPolicyFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_new_storage_buckets_number(more_than_allowed_new_bucket_number)
            .with_dynamic_bag_type(dynamic_bag_type)
            .call_and_assert(Err(
                Error::<Test>::NumberOfStorageBucketsOutsideOfAllowedContraints.into(),
            ));
    });
}

#[test]
fn update_number_of_storage_buckets_in_dynamic_bag_creation_policy_fails_with_bad_origin() {
    build_test_externalities().execute_with(|| {
        let non_leader_id = 1;

        UpdateNumberOfStorageBucketsInDynamicBagCreationPolicyFixture::default()
            .with_origin(RawOrigin::Signed(non_leader_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn dynamic_bag_creation_policy_defaults_and_updates_succeeded() {
    build_test_externalities().execute_with(|| {
        let new_bucket_number = 10;

        // Change member dynamic bag creation policy.
        let dynamic_bag_type = DynamicBagType::Member;
        let policy = Storage::get_dynamic_bag_creation_policy(dynamic_bag_type);
        assert_eq!(
            policy.number_of_storage_buckets,
            DefaultMemberDynamicBagNumberOfStorageBuckets::get()
        );

        UpdateNumberOfStorageBucketsInDynamicBagCreationPolicyFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_new_storage_buckets_number(new_bucket_number)
            .with_dynamic_bag_type(dynamic_bag_type)
            .call_and_assert(Ok(()));

        let policy = Storage::get_dynamic_bag_creation_policy(dynamic_bag_type);
        assert_eq!(policy.number_of_storage_buckets, new_bucket_number);

        // Change channel dynamic bag creation policy.
        let dynamic_bag_type = DynamicBagType::Channel;
        let policy = Storage::get_dynamic_bag_creation_policy(dynamic_bag_type);
        assert_eq!(
            policy.number_of_storage_buckets,
            DefaultChannelDynamicBagNumberOfStorageBuckets::get()
        );

        UpdateNumberOfStorageBucketsInDynamicBagCreationPolicyFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_new_storage_buckets_number(new_bucket_number)
            .with_dynamic_bag_type(dynamic_bag_type)
            .call_and_assert(Ok(()));

        let policy = Storage::get_dynamic_bag_creation_policy(dynamic_bag_type);
        assert_eq!(policy.number_of_storage_buckets, new_bucket_number);
    });
}

#[test]
fn create_distribution_bucket_family_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_family = Storage::distribution_bucket_family_by_id(family_id);

        assert_eq!(bucket_family, DistributionBucketFamily::<Test>::default());

        EventFixture::assert_last_crate_event(RawEvent::DistributionBucketFamilyCreated(family_id));
    });
}

#[test]
fn create_distribution_bucket_family_fails_with_non_signed_origin() {
    build_test_externalities().execute_with(|| {
        CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn create_distribution_bucket_family_fails_with_exceeding_family_number_limit() {
    build_test_externalities().execute_with(|| {
        for _ in 0..MaxDistributionBucketFamilyNumber::get() {
            CreateDistributionBucketFamilyFixture::default()
                .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
                .call_and_assert(Ok(()));
        }

        CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(
                Error::<Test>::MaxDistributionBucketFamilyNumberLimitExceeded.into(),
            ));
    });
}

#[test]
fn delete_distribution_bucket_family_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        DeleteDistributionBucketFamilyFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::DistributionBucketFamilyDeleted(family_id));
    });
}

#[test]
fn delete_distribution_bucket_family_fails_with_assgined_bags() {
    build_test_externalities().execute_with(|| {
        set_default_distribution_buckets_per_bag_limit();

        let static_bag_id = StaticBagId::Council;
        let bag_id: BagId<Test> = static_bag_id.into();

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_id = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_accept_new_bags(true)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let add_buckets_ids = BTreeSet::from_iter(vec![bucket_id]);

        UpdateDistributionBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bag_id(bag_id.clone())
            .with_family_id(family_id)
            .with_add_bucket_indices(add_buckets_ids.clone())
            .call_and_assert(Ok(()));

        let add_buckets = add_buckets_ids
            .iter()
            .map(|idx| Storage::create_distribution_bucket_id(family_id, *idx))
            .collect::<BTreeSet<_>>();
        let bag = Storage::bag(&bag_id);
        assert_eq!(bag.distributed_by, add_buckets);

        DeleteDistributionBucketFamilyFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::DistributionBucketIsBoundToBag.into()));
    });
}

#[test]
fn delete_distribution_bucket_family_fails_with_bound_member_dynamic_bag_creation_policy() {
    build_test_externalities().execute_with(|| {
        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let new_bucket_number = 7;
        let families = BTreeMap::from_iter(vec![(family_id, new_bucket_number)]);
        let dynamic_bag_type = DynamicBagType::Member;

        UpdateFamiliesInDynamicBagCreationPolicyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_families(families.clone())
            .with_dynamic_bag_type(dynamic_bag_type)
            .call_and_assert(Ok(()));

        DeleteDistributionBucketFamilyFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(
                Error::<Test>::DistributionFamilyBoundToBagCreationPolicy.into(),
            ));
    });
}

#[test]
fn delete_distribution_bucket_family_fails_with_bound_channel_dynamic_bag_creation_policy() {
    build_test_externalities().execute_with(|| {
        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let new_bucket_number = 7;
        let families = BTreeMap::from_iter(vec![(family_id, new_bucket_number)]);
        let dynamic_bag_type = DynamicBagType::Channel;

        UpdateFamiliesInDynamicBagCreationPolicyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_families(families.clone())
            .with_dynamic_bag_type(dynamic_bag_type)
            .call_and_assert(Ok(()));

        DeleteDistributionBucketFamilyFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(
                Error::<Test>::DistributionFamilyBoundToBagCreationPolicy.into(),
            ));
    });
}

#[test]
fn delete_distribution_bucket_family_fails_with_non_signed_origin() {
    build_test_externalities().execute_with(|| {
        DeleteDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn delete_distribution_bucket_family_fails_with_non_existing_family() {
    build_test_externalities().execute_with(|| {
        DeleteDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(
                Error::<Test>::DistributionBucketFamilyDoesntExist.into()
            ));
    });
}

#[test]
fn create_distribution_bucket_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let accept_new_bags = true;

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_id = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_accept_new_bags(accept_new_bags)
            .call_and_assert(Ok(()))
            .unwrap();

        assert!(
            crate::DistributionBucketByFamilyIdById::<Test>::contains_key(&family_id, &bucket_id)
        );

        EventFixture::assert_last_crate_event(RawEvent::DistributionBucketCreated(
            family_id,
            accept_new_bags,
            Storage::create_distribution_bucket_id(family_id, bucket_id),
        ));
    });
}

#[test]
fn create_distribution_bucket_fails_with_non_signed_origin() {
    build_test_externalities().execute_with(|| {
        CreateDistributionBucketFixture::default()
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn create_distribution_bucket_fails_with_non_existing_family() {
    build_test_externalities().execute_with(|| {
        CreateDistributionBucketFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(
                Error::<Test>::DistributionBucketFamilyDoesntExist.into()
            ));
    });
}

#[test]
fn update_distribution_bucket_status_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_index = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let new_status = true;
        UpdateDistributionBucketStatusFixture::default()
            .with_family_id(family_id)
            .with_bucket_index(bucket_index)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_new_status(new_status)
            .call_and_assert(Ok(()));

        assert_eq!(
            Storage::distribution_bucket_by_family_id_by_index(family_id, &bucket_index)
                .accepting_new_bags,
            new_status
        );

        EventFixture::assert_last_crate_event(RawEvent::DistributionBucketStatusUpdated(
            Storage::create_distribution_bucket_id(family_id, bucket_index),
            new_status,
        ));
    });
}

#[test]
fn update_distribution_bucket_status_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        UpdateDistributionBucketStatusFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn update_distribution_bucket_status_fails_with_invalid_distribution_bucket() {
    build_test_externalities().execute_with(|| {
        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        UpdateDistributionBucketStatusFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::DistributionBucketDoesntExist.into()));
    });
}

#[test]
fn delete_distribution_bucket_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_index = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        DeleteDistributionBucketFixture::default()
            .with_bucket_index(bucket_index)
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::DistributionBucketDeleted(
            Storage::create_distribution_bucket_id(family_id, bucket_index),
        ));
    });
}

#[test]
fn delete_distribution_bucket_fails_with_assgined_bags() {
    build_test_externalities().execute_with(|| {
        set_default_distribution_buckets_per_bag_limit();

        let static_bag_id = StaticBagId::Council;
        let bag_id: BagId<Test> = static_bag_id.into();

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_index = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_accept_new_bags(true)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let add_buckets_indices = BTreeSet::from_iter(vec![bucket_index]);

        UpdateDistributionBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bag_id(bag_id.clone())
            .with_family_id(family_id)
            .with_add_bucket_indices(add_buckets_indices.clone())
            .call_and_assert(Ok(()));

        let add_buckets = add_buckets_indices
            .iter()
            .map(|idx| Storage::create_distribution_bucket_id(family_id, *idx))
            .collect::<BTreeSet<_>>();
        let bag = Storage::bag(&bag_id);
        assert_eq!(bag.distributed_by, add_buckets);

        DeleteDistributionBucketFixture::default()
            .with_bucket_index(bucket_index)
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::DistributionBucketIsBoundToBag.into()));
    });
}

#[test]
fn delete_distribution_bucket_failed_with_existing_operators() {
    build_test_externalities().execute_with(|| {
        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_index = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        InviteDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bucket_index(bucket_index)
            .with_family_id(family_id)
            .with_operator_worker_id(DEFAULT_DISTRIBUTION_PROVIDER_ID)
            .call_and_assert(Ok(()));

        AcceptDistributionBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID))
            .with_family_id(family_id)
            .with_bucket_index(bucket_index)
            .with_worker_id(DEFAULT_DISTRIBUTION_PROVIDER_ID)
            .call_and_assert(Ok(()));

        DeleteDistributionBucketFixture::default()
            .with_bucket_index(bucket_index)
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::DistributionProviderOperatorSet.into()));
    });
}

#[test]
fn delete_distribution_bucket_fails_with_non_leader_origin() {
    build_test_externalities().execute_with(|| {
        let non_leader_id = 1111;

        DeleteDistributionBucketFixture::default()
            .with_origin(RawOrigin::Signed(non_leader_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn delete_distribution_bucket_fails_with_non_existing_distribution_bucket() {
    build_test_externalities().execute_with(|| {
        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        DeleteDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::DistributionBucketDoesntExist.into()));
    });
}

#[test]
fn update_distribution_buckets_for_bags_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        set_default_distribution_buckets_per_bag_limit();

        let static_bag_id = StaticBagId::Council;
        let bag_id: BagId<Test> = static_bag_id.into();

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_id = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_accept_new_bags(true)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let add_buckets_ids = BTreeSet::from_iter(vec![bucket_id]);

        UpdateDistributionBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bag_id(bag_id.clone())
            .with_family_id(family_id)
            .with_add_bucket_indices(add_buckets_ids.clone())
            .call_and_assert(Ok(()));

        let add_buckets = add_buckets_ids
            .iter()
            .map(|idx| Storage::create_distribution_bucket_id(family_id, *idx))
            .collect::<BTreeSet<_>>();
        let bag = Storage::bag(&bag_id);
        assert_eq!(bag.distributed_by, add_buckets);

        EventFixture::assert_last_crate_event(RawEvent::DistributionBucketsUpdatedForBag(
            bag_id,
            family_id,
            add_buckets_ids,
            BTreeSet::new(),
        ));
    });
}

#[test]
fn update_distribution_buckets_for_bags_succeeded_with_additioonal_checks_on_adding_and_removing() {
    build_test_externalities().execute_with(|| {
        set_default_distribution_buckets_per_bag_limit();

        let static_bag_id = StaticBagId::Council;
        let bag_id: BagId<Test> = static_bag_id.into();

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_id = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_accept_new_bags(true)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let add_buckets_ids = BTreeSet::from_iter(vec![bucket_id]);

        UpdateDistributionBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bag_id(bag_id.clone())
            .with_family_id(family_id)
            .with_add_bucket_indices(add_buckets_ids.clone())
            .call_and_assert(Ok(()));

        // Add check
        let add_buckets = add_buckets_ids
            .iter()
            .map(|idx| Storage::create_distribution_bucket_id(family_id, *idx))
            .collect::<BTreeSet<_>>();
        let bag = Storage::bag(&bag_id);
        assert_eq!(bag.distributed_by, add_buckets);

        let bucket = Storage::distribution_bucket_by_family_id_by_index(family_id, &bucket_id);
        assert_eq!(bucket.assigned_bags, 1);

        // ******

        UpdateDistributionBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bag_id(bag_id.clone())
            .with_family_id(family_id)
            .with_remove_bucket_indices(add_buckets_ids.clone())
            .call_and_assert(Ok(()));

        let bag = Storage::bag(&bag_id);
        assert_eq!(bag.distributed_by.len(), 0);

        let bucket = Storage::distribution_bucket_by_family_id_by_index(family_id, &bucket_id);
        assert_eq!(bucket.assigned_bags, 0);
    });
}

#[test]
fn update_distribution_buckets_for_bags_fails_with_non_existing_dynamic_bag() {
    build_test_externalities().execute_with(|| {
        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);
        let bag_id: BagId<Test> = dynamic_bag_id.into();

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_id = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let add_buckets = BTreeSet::from_iter(vec![bucket_id]);

        UpdateDistributionBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_family_id(family_id)
            .with_bag_id(bag_id.clone())
            .with_add_bucket_indices(add_buckets.clone())
            .call_and_assert(Err(Error::<Test>::DynamicBagDoesntExist.into()));
    });
}

#[test]
fn update_distribution_buckets_for_bags_fails_with_non_accepting_new_bags_bucket() {
    build_test_externalities().execute_with(|| {
        set_default_distribution_buckets_per_bag_limit();

        let static_bag_id = StaticBagId::Council;
        let bag_id: BagId<Test> = static_bag_id.into();

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_id = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_accept_new_bags(false)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let add_buckets = BTreeSet::from_iter(vec![bucket_id]);

        UpdateDistributionBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_family_id(family_id)
            .with_bag_id(bag_id.clone())
            .with_add_bucket_indices(add_buckets.clone())
            .call_and_assert(Err(
                Error::<Test>::DistributionBucketDoesntAcceptNewBags.into()
            ));
    });
}

#[test]
fn update_distribution_buckets_for_bags_fails_with_non_leader_origin() {
    build_test_externalities().execute_with(|| {
        let non_leader_id = 11;

        UpdateDistributionBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(non_leader_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn update_distribution_buckets_for_bags_fails_with_empty_params() {
    build_test_externalities().execute_with(|| {
        UpdateDistributionBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(
                Error::<Test>::DistributionBucketIdCollectionsAreEmpty.into()
            ));
    });
}

#[test]
fn update_distribution_buckets_for_bags_fails_with_non_existing_distribution_buckets() {
    build_test_externalities().execute_with(|| {
        set_default_distribution_buckets_per_bag_limit();

        let invalid_bucket_id = 11000;
        let buckets = BTreeSet::from_iter(vec![invalid_bucket_id]);
        let bag_id: BagId<Test> = StaticBagId::Council.into();

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        // Invalid added bucket ID.
        UpdateDistributionBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bag_id(bag_id.clone())
            .with_family_id(family_id)
            .with_add_bucket_indices(buckets.clone())
            .call_and_assert(Err(Error::<Test>::DistributionBucketDoesntExist.into()));

        // Invalid removed bucket ID.
        UpdateDistributionBucketForBagsFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bag_id(bag_id.clone())
            .with_family_id(family_id)
            .with_remove_bucket_indices(buckets.clone())
            .call_and_assert(Err(Error::<Test>::DistributionBucketDoesntExist.into()));
    });
}

fn set_default_distribution_buckets_per_bag_limit() {
    crate::DistributionBucketsPerBagLimit::put(5);
}

#[test]
fn update_distribution_buckets_per_bag_limit_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let new_limit = 4;

        UpdateDistributionBucketsPerBagLimitFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_new_limit(new_limit)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::DistributionBucketsPerBagLimitUpdated(
            new_limit,
        ));
    });
}

#[test]
fn update_distribution_buckets_per_bag_limit_origin() {
    build_test_externalities().execute_with(|| {
        let non_leader_id = 11;

        UpdateDistributionBucketsPerBagLimitFixture::default()
            .with_origin(RawOrigin::Signed(non_leader_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn update_distribution_buckets_per_bag_limit_fails_with_incorrect_value() {
    build_test_externalities().execute_with(|| {
        let new_limit = 0;

        UpdateDistributionBucketsPerBagLimitFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_new_limit(new_limit)
            .call_and_assert(Err(
                Error::<Test>::DistributionBucketsPerBagLimitTooLow.into()
            ));

        let new_limit = 100;

        UpdateDistributionBucketsPerBagLimitFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_new_limit(new_limit)
            .call_and_assert(Err(
                Error::<Test>::DistributionBucketsPerBagLimitTooHigh.into()
            ));
    });
}

#[test]
fn update_distribution_bucket_mode_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_index = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let distributing = false;
        UpdateDistributionBucketModeFixture::default()
            .with_family_id(family_id)
            .with_bucket_index(bucket_index)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_distributing(distributing)
            .call_and_assert(Ok(()));

        assert_eq!(
            Storage::distribution_bucket_by_family_id_by_index(family_id, &bucket_index)
                .accepting_new_bags,
            distributing
        );

        EventFixture::assert_last_crate_event(RawEvent::DistributionBucketModeUpdated(
            Storage::create_distribution_bucket_id(family_id, bucket_index),
            distributing,
        ));
    });
}

#[test]
fn update_distribution_bucket_mode_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        UpdateDistributionBucketModeFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn update_distribution_bucket_mode_fails_with_invalid_distribution_bucket() {
    build_test_externalities().execute_with(|| {
        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        UpdateDistributionBucketModeFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::DistributionBucketDoesntExist.into()));
    });
}

#[test]
fn update_families_in_dynamic_bag_creation_policy_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let dynamic_bag_type = DynamicBagType::Channel;
        let new_bucket_number = 7;

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let families = BTreeMap::from_iter(vec![(family_id, new_bucket_number)]);

        UpdateFamiliesInDynamicBagCreationPolicyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_families(families.clone())
            .with_dynamic_bag_type(dynamic_bag_type)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::FamiliesInDynamicBagCreationPolicyUpdated(
            dynamic_bag_type,
            families,
        ));
    });
}

#[test]
fn update_families_in_dynamic_bag_creation_policy_fails_with_bad_origin() {
    build_test_externalities().execute_with(|| {
        let non_leader_id = 11;

        UpdateFamiliesInDynamicBagCreationPolicyFixture::default()
            .with_origin(RawOrigin::Signed(non_leader_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn update_families_in_dynamic_bag_creation_policy_fails_with_invalid_family_id() {
    build_test_externalities().execute_with(|| {
        let dynamic_bag_type = DynamicBagType::Channel;
        let new_bucket_number = 7;
        let invalid_family_id = 111;

        let families = BTreeMap::from_iter(vec![(invalid_family_id, new_bucket_number)]);

        UpdateFamiliesInDynamicBagCreationPolicyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_families(families.clone())
            .with_dynamic_bag_type(dynamic_bag_type)
            .call_and_assert(Err(
                Error::<Test>::DistributionBucketFamilyDoesntExist.into()
            ));
    });
}

fn create_distribution_bucket_family_with_buckets(
    bucket_number: u64,
) -> (u64, Vec<DistributionBucketId<Test>>) {
    let family_id = CreateDistributionBucketFamilyFixture::default()
        .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
        .call_and_assert(Ok(()))
        .unwrap();

    let bucket_ids = repeat(family_id)
        .take(bucket_number as usize)
        .map(|fam_id| {
            let bucket_index = CreateDistributionBucketFixture::default()
                .with_family_id(fam_id)
                .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
                .with_accept_new_bags(true)
                .call_and_assert(Ok(()))
                .unwrap();

            Storage::create_distribution_bucket_id(fam_id, bucket_index)
        })
        .collect::<Vec<_>>();

    (family_id, bucket_ids)
}

#[test]
fn invite_distribution_bucket_operator_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let provider_id = DEFAULT_DISTRIBUTION_PROVIDER_ID;

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_index = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        InviteDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bucket_index(bucket_index)
            .with_family_id(family_id)
            .with_operator_worker_id(provider_id)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::DistributionBucketOperatorInvited(
            Storage::create_distribution_bucket_id(family_id, bucket_index),
            provider_id,
        ));
    });
}

#[test]
fn invite_distribution_bucket_operator_fails_with_non_leader_origin() {
    build_test_externalities().execute_with(|| {
        let non_leader_id = 11;

        InviteDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(non_leader_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn invite_distribution_bucket_operator_fails_with_non_existing_distribution_bucket() {
    build_test_externalities().execute_with(|| {
        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        InviteDistributionBucketOperatorFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::DistributionBucketDoesntExist.into()));
    });
}

#[test]
fn invite_distribution_bucket_operator_fails_with_non_missing_invitation() {
    build_test_externalities().execute_with(|| {
        let invited_worker_id = DEFAULT_DISTRIBUTION_PROVIDER_ID;

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_index = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        InviteDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bucket_index(bucket_index)
            .with_family_id(family_id)
            .with_operator_worker_id(invited_worker_id)
            .call_and_assert(Ok(()));

        InviteDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bucket_index(bucket_index)
            .with_family_id(family_id)
            .with_operator_worker_id(invited_worker_id)
            .call_and_assert(Err(
                Error::<Test>::DistributionProviderOperatorAlreadyInvited.into(),
            ));
    });
}

#[test]
fn invite_distribution_bucket_operator_fails_with_exceeding_the_limit_of_pending_invitations() {
    build_test_externalities().execute_with(|| {
        let invited_worker_id = DEFAULT_DISTRIBUTION_PROVIDER_ID;
        let another_worker_id = ANOTHER_DISTRIBUTION_PROVIDER_ID;

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_index = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        InviteDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bucket_index(bucket_index)
            .with_family_id(family_id)
            .with_operator_worker_id(invited_worker_id)
            .call_and_assert(Ok(()));

        InviteDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bucket_index(bucket_index)
            .with_family_id(family_id)
            .with_operator_worker_id(another_worker_id)
            .call_and_assert(Err(
                Error::<Test>::MaxNumberOfPendingInvitationsLimitForDistributionBucketReached
                    .into(),
            ));
    });
}

#[test]
fn invite_distribution_bucket_operator_fails_with_already_set_operator() {
    build_test_externalities().execute_with(|| {
        let invited_worker_id = DEFAULT_DISTRIBUTION_PROVIDER_ID;

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_index = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        InviteDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bucket_index(bucket_index)
            .with_family_id(family_id)
            .with_operator_worker_id(invited_worker_id)
            .call_and_assert(Ok(()));

        AcceptDistributionBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID))
            .with_bucket_index(bucket_index)
            .with_family_id(family_id)
            .with_worker_id(invited_worker_id)
            .call_and_assert(Ok(()));

        InviteDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bucket_index(bucket_index)
            .with_family_id(family_id)
            .with_operator_worker_id(invited_worker_id)
            .call_and_assert(Err(Error::<Test>::DistributionProviderOperatorSet.into()));
    });
}

#[test]
fn invite_distribution_bucket_operator_fails_with_invalid_distribution_provider_id() {
    build_test_externalities().execute_with(|| {
        let invalid_provider_id = 155;

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_index = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        InviteDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bucket_index(bucket_index)
            .with_family_id(family_id)
            .with_operator_worker_id(invalid_provider_id)
            .call_and_assert(Err(
                Error::<Test>::DistributionProviderOperatorDoesntExist.into()
            ));
    });
}

#[test]
fn cancel_distribution_bucket_operator_invite_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let provider_id = DEFAULT_DISTRIBUTION_PROVIDER_ID;

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_index = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        InviteDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bucket_index(bucket_index)
            .with_family_id(family_id)
            .with_operator_worker_id(provider_id)
            .call_and_assert(Ok(()));

        CancelDistributionBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_family_id(family_id)
            .with_bucket_index(bucket_index)
            .with_operator_worker_id(provider_id)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::DistributionBucketInvitationCancelled(
            Storage::create_distribution_bucket_id(family_id, bucket_index),
            provider_id,
        ));
    });
}

#[test]
fn cancel_distribution_bucket_operator_invite_fails_with_non_leader_origin() {
    build_test_externalities().execute_with(|| {
        let non_leader_account_id = 11111;

        CancelDistributionBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(non_leader_account_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn cancel_distribution_bucket_operator_invite_fails_with_non_existing_distribution_bucket() {
    build_test_externalities().execute_with(|| {
        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        CancelDistributionBucketInvitationFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::DistributionBucketDoesntExist.into()));
    });
}

#[test]
fn cancel_distribution_bucket_operator_invite_fails_with_non_invited_distribution_provider() {
    build_test_externalities().execute_with(|| {
        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_index = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        CancelDistributionBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_family_id(family_id)
            .with_bucket_index(bucket_index)
            .call_and_assert(Err(Error::<Test>::NoDistributionBucketInvitation.into()));
    });
}

#[test]
fn accept_distribution_bucket_operator_invite_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let provider_id = DEFAULT_DISTRIBUTION_PROVIDER_ID;

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_index = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        InviteDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bucket_index(bucket_index)
            .with_family_id(family_id)
            .with_operator_worker_id(provider_id)
            .call_and_assert(Ok(()));

        AcceptDistributionBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID))
            .with_family_id(family_id)
            .with_bucket_index(bucket_index)
            .with_worker_id(provider_id)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::DistributionBucketInvitationAccepted(
            provider_id,
            Storage::create_distribution_bucket_id(family_id, bucket_index),
        ));
    });
}

#[test]
fn accept_distribution_bucket_operator_invite_fails_with_non_leader_origin() {
    build_test_externalities().execute_with(|| {
        let invalid_account_id = 11111;

        AcceptDistributionBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(invalid_account_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn accept_distribution_bucket_operator_invite_fails_with_non_existing_distribution_bucket() {
    build_test_externalities().execute_with(|| {
        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        AcceptDistributionBucketInvitationFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::DistributionBucketDoesntExist.into()));
    });
}

#[test]
fn accept_distribution_bucket_operator_invite_fails_with_non_invited_distribution_provider() {
    build_test_externalities().execute_with(|| {
        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_index = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        AcceptDistributionBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID))
            .with_family_id(family_id)
            .with_bucket_index(bucket_index)
            .call_and_assert(Err(Error::<Test>::NoDistributionBucketInvitation.into()));
    });
}

#[test]
fn set_distribution_operator_metadata_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let provider_id = DEFAULT_DISTRIBUTION_PROVIDER_ID;
        let metadata = b"Metadata".to_vec();

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_index = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        InviteDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bucket_index(bucket_index)
            .with_family_id(family_id)
            .with_operator_worker_id(provider_id)
            .call_and_assert(Ok(()));

        AcceptDistributionBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID))
            .with_family_id(family_id)
            .with_bucket_index(bucket_index)
            .with_worker_id(provider_id)
            .call_and_assert(Ok(()));

        SetDistributionBucketMetadataFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID))
            .with_family_id(family_id)
            .with_bucket_index(bucket_index)
            .with_worker_id(provider_id)
            .with_metadata(metadata.clone())
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::DistributionBucketMetadataSet(
            provider_id,
            Storage::create_distribution_bucket_id(family_id, bucket_index),
            metadata,
        ));
    });
}

#[test]
fn set_distribution_operator_metadata_fails_with_non_leader_origin() {
    build_test_externalities().execute_with(|| {
        let invalid_account_id = 11111;

        SetDistributionBucketMetadataFixture::default()
            .with_origin(RawOrigin::Signed(invalid_account_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn set_distribution_operator_metadata_fails_with_non_existing_distribution_bucket() {
    build_test_externalities().execute_with(|| {
        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        SetDistributionBucketMetadataFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::DistributionBucketDoesntExist.into()));
    });
}

#[test]
fn set_distribution_operator_metadata_fails_with_non_distribution_provider() {
    build_test_externalities().execute_with(|| {
        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_index = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        SetDistributionBucketMetadataFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID))
            .with_family_id(family_id)
            .with_bucket_index(bucket_index)
            .call_and_assert(Err(
                Error::<Test>::MustBeDistributionProviderOperatorForBucket.into(),
            ));
    });
}

#[test]
fn remove_distribution_bucket_operator_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let operator_id = DEFAULT_DISTRIBUTION_PROVIDER_ID;

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_index = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        InviteDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bucket_index(bucket_index)
            .with_family_id(family_id)
            .with_operator_worker_id(operator_id)
            .call_and_assert(Ok(()));

        AcceptDistributionBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID))
            .with_family_id(family_id)
            .with_bucket_index(bucket_index)
            .with_worker_id(operator_id)
            .call_and_assert(Ok(()));

        RemoveDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_family_id(family_id)
            .with_bucket_index(bucket_index)
            .with_operator_worker_id(operator_id)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::DistributionBucketOperatorRemoved(
            Storage::create_distribution_bucket_id(family_id, bucket_index),
            operator_id,
        ));
    });
}

#[test]
fn remove_distribution_bucket_operator_fails_with_non_leader_origin() {
    build_test_externalities().execute_with(|| {
        let non_leader_account = 11;
        RemoveDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(non_leader_account))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn remove_distribution_bucket_operator_fails_with_non_existing_distribution_bucket() {
    build_test_externalities().execute_with(|| {
        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        RemoveDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_family_id(family_id)
            .call_and_assert(Err(Error::<Test>::DistributionBucketDoesntExist.into()));
    });
}

#[test]
fn remove_distribution_bucket_operator_fails_with_non_accepted_distribution_provider() {
    build_test_externalities().execute_with(|| {
        let operator_id = DEFAULT_DISTRIBUTION_PROVIDER_ID;

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let bucket_index = CreateDistributionBucketFixture::default()
            .with_family_id(family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        RemoveDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_family_id(family_id)
            .with_bucket_index(bucket_index)
            .with_operator_worker_id(operator_id)
            .call_and_assert(Err(
                Error::<Test>::MustBeDistributionProviderOperatorForBucket.into(),
            ));

        InviteDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bucket_index(bucket_index)
            .with_family_id(family_id)
            .with_operator_worker_id(operator_id)
            .call_and_assert(Ok(()));

        RemoveDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_family_id(family_id)
            .with_bucket_index(bucket_index)
            .with_operator_worker_id(operator_id)
            .call_and_assert(Err(
                Error::<Test>::MustBeDistributionProviderOperatorForBucket.into(),
            ));
    });
}

#[test]
fn set_distribution_bucket_family_metadata_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let metadata = b"Metadata".to_vec();

        let family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        SetDistributionBucketFamilyMetadataFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_family_id(family_id)
            .with_metadata(metadata.clone())
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::DistributionBucketFamilyMetadataSet(
            family_id, metadata,
        ));
    });
}

#[test]
fn set_distribution_bucket_family_metadata_fails_with_non_leader_origin() {
    build_test_externalities().execute_with(|| {
        let invalid_account_id = 11111;

        SetDistributionBucketFamilyMetadataFixture::default()
            .with_origin(RawOrigin::Signed(invalid_account_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn set_distribution_bucket_family_metadata_fails_with_invalid_distribution_bucket_family() {
    build_test_externalities().execute_with(|| {
        SetDistributionBucketFamilyMetadataFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Err(
                Error::<Test>::DistributionBucketFamilyDoesntExist.into()
            ));
    });
}

// #[test]
// fn cannot_delete_dynamic_bags_with_objects_with_insufficient_treasury_balance() {
//     build_test_externalities().execute_with(|| {
//         let starting_block = 1;
//         run_to_block(starting_block);

//         let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);
//         create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);
//         increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
//         // pre-check balances
//         assert_eq!(
//             Balances::usable_balance(&DEFAULT_MEMBER_ACCOUNT_ID),
//             INITIAL_BALANCE
//         );
//         assert_eq!(
//             Balances::usable_balance(&<StorageTreasury<Test>>::module_account_id()),
//             0
//         );

//         CreateDynamicBagFixture::default()
//             .with_bag_id(dynamic_bag_id.clone())
//             .with_deletion_prize(77)
//             //            .with_parameters(default_upload_parameters())
//             .call_and_assert(Ok(()));

//         let _ = Balances::slash(
//             &<StorageTreasury<Test>>::module_account_id(),
//             BAG_DELETION_PRIZE_VALUE,
//         );

//     });
// }

#[test]
fn unsuccessful_dyn_bag_creation_with_existing_bag_id() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);

        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);
        CreateDynamicBagFixture::default()
            .with_bag_id(dynamic_bag_id)
            .with_storage_buckets(storage_buckets.clone())
            .call_and_assert(Ok(()));

        CreateDynamicBagFixture::default()
            .with_storage_buckets(storage_buckets)
            .call_and_assert(Err(Error::<Test>::DynamicBagExists.into()));
    })
}

#[test]
fn unsuccessful_dyn_bag_creation_with_invalid_storage_buckets() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let invalid_storage_bucket_ids = vec![111, 112, 113];
        let storage_buckets = BTreeSet::from_iter(invalid_storage_bucket_ids);
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);

        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);
        CreateDynamicBagFixture::default()
            .with_bag_id(dynamic_bag_id)
            .with_storage_buckets(storage_buckets)
            .call_and_assert(Err(Error::<Test>::StorageBucketDoesntExist.into()));
    })
}

#[test]
fn unsuccessful_dyn_bag_creation_with_invalid_distribution_buckets() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let (family1, _) = create_distribution_bucket_family_with_buckets(0);
        let (family2, _) = create_distribution_bucket_family_with_buckets(0);

        let (family_policy_number1, family_policy_number2) = (1u32, 1u32);

        let family_policy = BTreeMap::from_iter(vec![
            (family1, family_policy_number1),
            (family2, family_policy_number2),
        ]);

        UpdateFamiliesInDynamicBagCreationPolicyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_families(family_policy)
            .call_and_assert(Ok(()));

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);
        let invalid_distribution_bucket_ids = vec![
            Storage::create_distribution_bucket_id(family1, 111u64),
            Storage::create_distribution_bucket_id(family2, 112u64),
        ];
        let distribution_buckets = BTreeSet::from_iter(invalid_distribution_bucket_ids);
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);

        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);
        CreateDynamicBagFixture::default()
            .with_bag_id(dynamic_bag_id)
            .with_distribution_buckets(distribution_buckets)
            .with_storage_buckets(storage_buckets)
            .call_and_assert(Err(Error::<Test>::DistributionBucketDoesntExist.into()));
    })
}

#[test]
fn unsuccessful_dyn_bag_creation_with_not_matched_dynamic_creation_policy() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let (family_policy_number1, family_policy_number2) = (1u32, 1u32);

        let (family1, distribution_bucket_ids1) =
            create_distribution_bucket_family_with_buckets(family_policy_number1.into());
        let (family2, _) =
            create_distribution_bucket_family_with_buckets(family_policy_number2.into());

        let family_policy = BTreeMap::from_iter(vec![
            (family1, family_policy_number1),
            (family2, family_policy_number2),
        ]);

        UpdateFamiliesInDynamicBagCreationPolicyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_families(family_policy)
            .call_and_assert(Ok(()));

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);
        let distribution_buckets = BTreeSet::from_iter(distribution_bucket_ids1);
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);

        let dynamic_bag_id = DynamicBagId::<Test>::Member(DEFAULT_MEMBER_ID);
        CreateDynamicBagFixture::default()
            .with_bag_id(dynamic_bag_id)
            .with_distribution_buckets(distribution_buckets)
            .with_storage_buckets(storage_buckets)
            .call_and_assert(Err(
                Error::<Test>::DistributionBucketsViolatesDynamicBagCreationPolicy.into(),
            ));
    })
}

#[test]
fn unsuccessful_dyn_bag_creation_with_insufficient_balance_for_bag_prize_and_upload_fees() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);

        let bag_deletion_prize = 100;
        set_bag_deletion_prize_value(bag_deletion_prize);

        CreateDynamicBagFixture::default()
            .with_storage_buckets(storage_buckets)
            .with_expected_dynamic_bag_deletion_prize(bag_deletion_prize)
            .call_and_assert(Err(Error::<Test>::InsufficientBalance.into()));
    })
}

#[test]
fn unsuccessful_dyn_bag_creation_with_zero_objects_size() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);

        let objects: Vec<DataObjectCreationParameters> = (1..DEFAULT_DATA_OBJECTS_NUMBER)
            .into_iter()
            .map(|idx| DataObjectCreationParameters {
                size: 0,
                ipfs_content_id: vec![idx.try_into().unwrap()],
            })
            .collect();

        CreateDynamicBagFixture::default()
            .with_storage_buckets(storage_buckets)
            .with_objects(objects)
            .call_and_assert(Err(Error::<Test>::ZeroObjectSize.into()));
    })
}

#[test]
fn unsuccessful_dyn_bag_creation_with_object_size_exceeding_max_obj_size() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);

        let objects: Vec<DataObjectCreationParameters> = (1..DEFAULT_DATA_OBJECTS_NUMBER)
            .into_iter()
            .map(|idx| DataObjectCreationParameters {
                // set size high on purpose to trigger error
                size: 1_000_000,
                ipfs_content_id: vec![idx.try_into().unwrap()],
            })
            .collect();

        CreateDynamicBagFixture::default()
            .with_storage_buckets(storage_buckets)
            .with_objects(objects)
            .call_and_assert(Err(Error::<Test>::MaxDataObjectSizeExceeded.into()));
    })
}

#[test]
fn unsuccessful_dyn_bag_creation_with_buckets_having_insufficient_size_available() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);

        CreateDynamicBagFixture::default()
            .with_objects(vec![DataObjectCreationParameters {
                size: DEFAULT_STORAGE_BUCKET_SIZE_LIMIT + 1,
                ipfs_content_id: vec![1],
            }])
            .with_storage_buckets(storage_buckets)
            .call_and_assert(Err(Error::<Test>::StorageBucketIdCollectionsAreEmpty.into()));
    })
}

#[test]
fn unsuccessful_dyn_bag_creation_with_buckets_having_insufficient_objects_available() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);

        let objects: Vec<DataObjectCreationParameters> = (1..(DEFAULT_STORAGE_BUCKET_OBJECTS_LIMIT
            + 1))
            .map(|idx| DataObjectCreationParameters {
                size: DEFAULT_DATA_OBJECTS_SIZE,
                ipfs_content_id: vec![idx.try_into().unwrap()],
            })
            .collect();

        CreateDynamicBagFixture::default()
            .with_objects(objects)
            .with_storage_buckets(storage_buckets)
            .call_and_assert(Err(Error::<Test>::StorageBucketIdCollectionsAreEmpty.into()));
    })
}

#[test]
fn unsuccessful_dyn_bag_creation_with_empty_ipfs_ids() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);

        let objects: Vec<DataObjectCreationParameters> = (1..DEFAULT_DATA_OBJECTS_NUMBER)
            .map(|_| DataObjectCreationParameters {
                size: DEFAULT_DATA_OBJECTS_SIZE,
                ipfs_content_id: vec![],
            })
            .collect();
        CreateDynamicBagFixture::default()
            .with_storage_buckets(storage_buckets)
            .with_objects(objects)
            .call_and_assert(Err(Error::<Test>::EmptyContentId.into()));
    })
}

#[test]
fn successful_dyn_bag_creation_with_empty_objects_list() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);
        CreateDynamicBagFixture::default()
            .with_storage_buckets(storage_buckets)
            .call_and_assert(Ok(()))
    })
}

#[test]
fn unsuccessful_dyn_bag_creation_with_invalid_expected_data_fee() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);

        CreateDynamicBagFixture::default()
            .with_objects(create_single_data_object())
            .with_expected_data_size_fee(Storage::data_object_per_mega_byte_fee() + 100)
            .call_and_assert(Err(Error::<Test>::DataSizeFeeChanged.into()));
    })
}

#[test]
fn unsuccessful_dyn_bag_creation_with_upload_blocking() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);

        UpdateUploadingBlockedStatusFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_new_status(true)
            .call_and_assert(Ok(()));

        CreateDynamicBagFixture::default()
            .with_storage_buckets(storage_buckets)
            .with_objects(create_single_data_object())
            .call_and_assert(Err(Error::<Test>::UploadingBlocked.into()));
    })
}

#[test]
fn successful_empty_dyn_bag_creation_with_upload_blocking() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);

        UpdateUploadingBlockedStatusFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_new_status(true)
            .call_and_assert(Ok(()));

        CreateDynamicBagFixture::default()
            .with_storage_buckets(storage_buckets)
            .call_and_assert(Ok(()))
    })
}

#[test]
fn unsuccessful_dyn_bag_creation_with_blacklisted_ipfs_id() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);

        let objects: Vec<DataObjectCreationParameters> = (0..BlacklistSizeLimit::get())
            .map(|idx| DataObjectCreationParameters {
                size: DEFAULT_DATA_OBJECTS_SIZE,
                ipfs_content_id: create_cid(idx.saturated_into()),
            })
            .collect();

        UpdateBlacklistFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_add_hashes(
                objects
                    .iter()
                    .map(|obj| obj.ipfs_content_id.clone())
                    .collect(),
            )
            .call_and_assert(Ok(()));

        CreateDynamicBagFixture::default()
            .with_storage_buckets(storage_buckets)
            .with_objects(objects)
            .call_and_assert(Err(Error::<Test>::DataObjectBlacklisted.into()));
    })
}

#[test]
fn successful_dyn_bag_creation_with_upload_and_no_deletion_prize() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);

        CreateDynamicBagFixture::default()
            .with_storage_buckets(storage_buckets)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_dyn_bag_creation_with_all_parameters_specified() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let storage_buckets = create_storage_buckets(DEFAULT_STORAGE_BUCKETS_NUMBER);
        increase_account_balance(&DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);

        set_bag_deletion_prize_value(BAG_DELETION_PRIZE_VALUE);

        CreateDynamicBagFixture::default()
            .with_expected_dynamic_bag_deletion_prize(BAG_DELETION_PRIZE_VALUE)
            .with_storage_buckets(storage_buckets)
            .call_and_assert(Ok(()));
    })
}

fn set_bag_deletion_prize_value(deletion_prize: u64) {
    crate::DynamicBagDeletionPrizeValue::<Test>::put(deletion_prize);
}

#[test]
fn update_dynamic_bag_deletion_prize_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let deletion_prize = 40;

        UpdateDynamicBagDeletionPrizeValueFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_deletion_prize(deletion_prize)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::DynamicBagDeletionPrizeValueUpdated(
            deletion_prize,
        ));
    });
}

#[test]
fn update_dynamic_bag_deletion_prize_failed_with_bad_origin() {
    build_test_externalities().execute_with(|| {
        let non_leader_id = 1;

        UpdateDynamicBagDeletionPrizeValueFixture::default()
            .with_origin(RawOrigin::Signed(non_leader_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn update_data_object_deletion_prize_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let deletion_prize = 40;

        UpdateDataObjectDeletionPrizeValueFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_deletion_prize(deletion_prize)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::DataObjectDeletionPrizeValueUpdated(
            deletion_prize,
        ));
    });
}

#[test]
fn update_data_object_deletion_prize_failed_with_bad_origin() {
    build_test_externalities().execute_with(|| {
        let non_leader_id = 1;

        UpdateDataObjectDeletionPrizeValueFixture::default()
            .with_origin(RawOrigin::Signed(non_leader_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

fn set_data_object_deletion_prize_value(deletion_prize: u64) {
    crate::DataObjectDeletionPrizeValue::<Test>::put(deletion_prize);
}
#[test]
fn storage_operator_remark_successful() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let msg = b"test".to_vec();
        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let invite_worker = Some(storage_provider_id);
        let transactor_id = DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID;

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .with_transactor_account_id(transactor_id)
            .call_and_assert(Ok(()));

        assert_ok!(Storage::storage_operator_remark(
            RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID).into(),
            DEFAULT_STORAGE_PROVIDER_ID,
            bucket_id,
            msg
        ));
    })
}

#[test]
fn storage_operator_remark_unsuccessful_with_invalid_bucket_id() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let msg = b"test".to_vec();
        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let invite_worker = Some(storage_provider_id);
        let transactor_id = DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID;

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        let invalid_bucket_id = bucket_id.saturating_add(1);

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .with_transactor_account_id(transactor_id)
            .call_and_assert(Ok(()));

        assert_err!(
            Storage::storage_operator_remark(
                RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID).into(),
                DEFAULT_STORAGE_PROVIDER_ID,
                invalid_bucket_id,
                msg
            ),
            Error::<Test>::StorageBucketDoesntExist
        );
    })
}

#[test]
fn storage_operator_remark_unsuccessful_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let msg = b"test".to_vec();
        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let invite_worker = Some(storage_provider_id);
        let transactor_id = DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID;

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .with_transactor_account_id(transactor_id)
            .call_and_assert(Ok(()));

        let invalid_origin = RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID + 100).into();
        assert_err!(
            Storage::storage_operator_remark(
                invalid_origin,
                DEFAULT_STORAGE_PROVIDER_ID,
                bucket_id,
                msg
            ),
            DispatchError::BadOrigin,
        );
    })
}

#[test]
fn storage_operator_remark_unsuccessful_with_invalid_worker_id() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let msg = b"test".to_vec();
        let storage_provider_id = DEFAULT_STORAGE_PROVIDER_ID;
        let invite_worker = Some(storage_provider_id);
        let transactor_id = DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID;

        let bucket_id = CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::Signed(STORAGE_WG_LEADER_ACCOUNT_ID))
            .with_invite_worker(invite_worker)
            .call_and_assert(Ok(()))
            .unwrap();

        let invalid_worker_id = DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID.saturating_add(1);

        AcceptStorageBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID))
            .with_storage_bucket_id(bucket_id)
            .with_worker_id(storage_provider_id)
            .with_transactor_account_id(transactor_id)
            .call_and_assert(Ok(()));

        assert_err!(
            Storage::storage_operator_remark(
                RawOrigin::Signed(DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID).into(),
                invalid_worker_id,
                bucket_id,
                msg
            ),
            Error::<Test>::InvalidStorageProvider
        );
    })
}

#[test]
fn distribution_operator_remark_successful() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let msg = b"test".to_vec();

        let distribution_bucket_family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let distribution_bucket_index = CreateDistributionBucketFixture::default()
            .with_family_id(distribution_bucket_family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        InviteDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bucket_index(distribution_bucket_index)
            .with_family_id(distribution_bucket_family_id)
            .with_operator_worker_id(DEFAULT_DISTRIBUTION_PROVIDER_ID)
            .call_and_assert(Ok(()));

        AcceptDistributionBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID))
            .with_family_id(distribution_bucket_family_id)
            .with_bucket_index(distribution_bucket_index)
            .with_worker_id(DEFAULT_DISTRIBUTION_PROVIDER_ID)
            .call_and_assert(Ok(()));

        assert_ok!(Storage::distribution_operator_remark(
            RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID).into(),
            DEFAULT_DISTRIBUTION_PROVIDER_ID,
            DistributionBucketId::<Test> {
                distribution_bucket_family_id,
                distribution_bucket_index,
            },
            msg
        ));
    })
}

#[test]
fn distribution_operator_remark_unsuccessful_with_invalid_bucket_id() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let msg = b"test".to_vec();

        let distribution_bucket_family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();
        let invalid_distribution_bucket_family_id = distribution_bucket_family_id.saturating_add(1);

        let distribution_bucket_index = CreateDistributionBucketFixture::default()
            .with_family_id(distribution_bucket_family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        InviteDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bucket_index(distribution_bucket_index)
            .with_family_id(distribution_bucket_family_id)
            .with_operator_worker_id(DEFAULT_DISTRIBUTION_PROVIDER_ID)
            .call_and_assert(Ok(()));

        AcceptDistributionBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID))
            .with_family_id(distribution_bucket_family_id)
            .with_bucket_index(distribution_bucket_index)
            .with_worker_id(DEFAULT_DISTRIBUTION_PROVIDER_ID)
            .call_and_assert(Ok(()));

        assert_err!(
            Storage::distribution_operator_remark(
                RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID).into(),
                DEFAULT_DISTRIBUTION_PROVIDER_ID,
                DistributionBucketId::<Test> {
                    distribution_bucket_family_id: invalid_distribution_bucket_family_id,
                    distribution_bucket_index,
                },
                msg
            ),
            Error::<Test>::DistributionBucketDoesntExist
        );
    })
}

#[test]
fn distribution_operator_remark_unsuccessful_with_invalid_worker_id() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let invalid_distribution_worker_id = DEFAULT_DISTRIBUTION_PROVIDER_ID.saturating_add(1);
        let msg = b"test".to_vec();

        let distribution_bucket_family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let distribution_bucket_index = CreateDistributionBucketFixture::default()
            .with_family_id(distribution_bucket_family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        InviteDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bucket_index(distribution_bucket_index)
            .with_family_id(distribution_bucket_family_id)
            .with_operator_worker_id(DEFAULT_DISTRIBUTION_PROVIDER_ID)
            .call_and_assert(Ok(()));

        AcceptDistributionBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID))
            .with_family_id(distribution_bucket_family_id)
            .with_bucket_index(distribution_bucket_index)
            .with_worker_id(DEFAULT_DISTRIBUTION_PROVIDER_ID)
            .call_and_assert(Ok(()));

        assert_err!(
            Storage::distribution_operator_remark(
                RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID).into(),
                invalid_distribution_worker_id,
                DistributionBucketId::<Test> {
                    distribution_bucket_family_id,
                    distribution_bucket_index,
                },
                msg
            ),
            Error::<Test>::MustBeDistributionProviderOperatorForBucket,
        );
    })
}

#[test]
fn distribution_operator_remark_unsuccessful_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let invalid_distribution_worker_id = DEFAULT_DISTRIBUTION_PROVIDER_ID.saturating_add(1);
        let msg = b"test".to_vec();

        let distribution_bucket_family_id = CreateDistributionBucketFamilyFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        let distribution_bucket_index = CreateDistributionBucketFixture::default()
            .with_family_id(distribution_bucket_family_id)
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .call_and_assert(Ok(()))
            .unwrap();

        InviteDistributionBucketOperatorFixture::default()
            .with_origin(RawOrigin::Signed(DISTRIBUTION_WG_LEADER_ACCOUNT_ID))
            .with_bucket_index(distribution_bucket_index)
            .with_family_id(distribution_bucket_family_id)
            .with_operator_worker_id(DEFAULT_DISTRIBUTION_PROVIDER_ID)
            .call_and_assert(Ok(()));

        AcceptDistributionBucketInvitationFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID))
            .with_family_id(distribution_bucket_family_id)
            .with_bucket_index(distribution_bucket_index)
            .with_worker_id(DEFAULT_DISTRIBUTION_PROVIDER_ID)
            .call_and_assert(Ok(()));

        let invalid_origin =
            RawOrigin::Signed(DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID + 100).into();

        assert_err!(
            Storage::distribution_operator_remark(
                invalid_origin,
                invalid_distribution_worker_id,
                DistributionBucketId::<Test> {
                    distribution_bucket_family_id,
                    distribution_bucket_index,
                },
                msg
            ),
            DispatchError::BadOrigin,
        );
    })
}
