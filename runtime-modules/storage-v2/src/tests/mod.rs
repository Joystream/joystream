#![cfg(test)]

mod fixtures;
pub(crate) mod mocks;

use frame_support::dispatch::DispatchError;
use frame_system::RawOrigin;

use fixtures::{
    run_to_block, AcceptStorageBucketInvitationFixture, CreateStorageBucketFixture, EventFixture,
};
use mocks::{build_test_externalities, Storage, Test, WG_LEADER_ACCOUNT_ID};

use crate::tests::mocks::DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID;
use crate::{Error, RawEvent, StorageBucketOperatorStatus, Voucher};

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
            .call_and_assert(Err(Error::<Test>::MaxStorageNumberLimitExceeded.into()));
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
