#![cfg(test)]

mod fixtures;
pub(crate) mod mocks;

use frame_support::dispatch::DispatchError;
use frame_system::RawOrigin;

use fixtures::{run_to_block, CreateStorageBucketFixture, EventFixture};
use mocks::{build_test_externalities, Storage, Test};

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
fn create_storage_bucket_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        CreateStorageBucketFixture::default()
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn create_storage_bucket_fails_with_exceeding_max_storage_bucket_limit() {
    build_test_externalities().execute_with(|| {
        CreateStorageBucketFixture::default().call_and_assert(Ok(()));

        CreateStorageBucketFixture::default()
            .call_and_assert(Err(Error::<Test>::MaxStorageNumberLimitExceeded.into()));
    });
}
