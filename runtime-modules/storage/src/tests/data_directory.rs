#![cfg(test)]

use common::storage::StorageObjectOwner;
use frame_support::dispatch::DispatchError;
use system::RawOrigin;

use super::mock::*;

#[test]
fn succeed_adding_content() {
    with_default_mock_builder(|| {
        let sender = 1u64;
        let owner = StorageObjectOwner::Member(1u64);

        let first_content_parameters = ContentParameters {
            content_id: 1,
            type_id: 1234,
            size: 0,
            ipfs_content_id: vec![1, 2, 3, 4],
        };

        let second_content_parameters = ContentParameters {
            content_id: 2,
            type_id: 2,
            size: 20,
            ipfs_content_id: vec![1, 2, 7, 9],
        };

        let multi_content = vec![first_content_parameters, second_content_parameters];

        // Register a content with 1234 bytes of type 1, which should be recognized.
        let res = TestDataDirectory::add_content(Origin::signed(sender), owner, multi_content);
        assert!(res.is_ok());
    });
}

#[test]
fn add_content_fails_with_invalid_origin() {
    with_default_mock_builder(|| {
        let owner = StorageObjectOwner::Member(1u64);

        let content_parameters = ContentParameters {
            content_id: 1,
            type_id: 1234,
            size: 0,
            ipfs_content_id: vec![1, 2, 3, 4],
        };

        // Register a content with 1234 bytes of type 1, which should be recognized.
        let res =
            TestDataDirectory::add_content(RawOrigin::Root.into(), owner, vec![content_parameters]);
        assert_eq!(res, Err(DispatchError::Other("Bad origin")));
    });
}

#[test]
fn accept_and_reject_content_fail_with_invalid_storage_provider() {
    with_default_mock_builder(|| {
        /*
           Events are not emitted on block 0.
           So any dispatchable calls made during genesis block formation will have no events emitted.
           https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        run_to_block(1);

        let sender = 1u64;
        let owner = StorageObjectOwner::Member(1u64);

        let content_parameters = ContentParameters {
            content_id: 1,
            type_id: 1234,
            size: 0,
            ipfs_content_id: vec![1, 2, 3, 4],
        };

        let res =
            TestDataDirectory::add_content(Origin::signed(sender), owner, vec![content_parameters]);
        assert!(res.is_ok());

        let content_id = match &System::events().last().unwrap().event {
            MetaEvent::data_directory(data_directory::RawEvent::ContentAdded(content, _)) => {
                content[0].content_id
            }
            _ => 0u64,
        };

        //  invalid data
        let (storage_provider_account_id, storage_provider_id) = (1, 5);

        let res = TestDataDirectory::accept_content(
            Origin::signed(storage_provider_account_id),
            storage_provider_id,
            content_id,
        );
        assert_eq!(res, Err(working_group::Error::<Test, crate::StorageWorkingGroupInstance>::WorkerDoesNotExist.into()));

        let res = TestDataDirectory::reject_content(
            Origin::signed(storage_provider_account_id),
            storage_provider_id,
            content_id,
        );
        assert_eq!(res, Err(working_group::Error::<Test, crate::StorageWorkingGroupInstance>::WorkerDoesNotExist.into()));
    });
}

#[test]
fn accept_content_as_liaison() {
    with_default_mock_builder(|| {
        /*
           Events are not emitted on block 0.
           So any dispatchable calls made during genesis block formation will have no events emitted.
           https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        run_to_block(1);

        let sender = 1u64;
        let owner = StorageObjectOwner::Member(1u64);

        let content_parameters = ContentParameters {
            content_id: 1,
            type_id: 1234,
            size: 0,
            ipfs_content_id: vec![1, 2, 3, 4],
        };

        let res =
            TestDataDirectory::add_content(Origin::signed(sender), owner, vec![content_parameters]);
        assert!(res.is_ok());

        // An appropriate event should have been fired.
        let (content_id, creator) = match &System::events().last().unwrap().event {
            MetaEvent::data_directory(data_directory::RawEvent::ContentAdded(content, creator)) => {
                (content[0].content_id, creator.clone())
            }
            _ => (0u64, StorageObjectOwner::Member(0xdeadbeefu64)), // invalid value, unlikely to match
        };
        assert_ne!(creator, StorageObjectOwner::Member(0xdeadbeefu64));
        assert_eq!(creator, StorageObjectOwner::Member(sender));

        let (storage_provider_account_id, storage_provider_id) = hire_storage_provider();

        // Accepting content should not work with some random origin
        let res =
            TestDataDirectory::accept_content(Origin::signed(55), storage_provider_id, content_id);
        assert!(res.is_err());

        // However, with the liaison as origin it should.
        let res = TestDataDirectory::accept_content(
            Origin::signed(storage_provider_account_id),
            storage_provider_id,
            content_id,
        );
        assert_eq!(res, Ok(()));
    });
}

#[test]
fn reject_content_as_liaison() {
    with_default_mock_builder(|| {
        /*
           Events are not emitted on block 0.
           So any dispatchable calls made during genesis block formation will have no events emitted.
           https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        run_to_block(1);

        let sender = 1u64;
        let owner = StorageObjectOwner::Member(1u64);

        let content_parameters = ContentParameters {
            content_id: 1,
            type_id: 1234,
            size: 0,
            ipfs_content_id: vec![1, 2, 3, 4],
        };

        let res =
            TestDataDirectory::add_content(Origin::signed(sender), owner, vec![content_parameters]);
        assert!(res.is_ok());

        // An appropriate event should have been fired.
        let (content_id, creator) = match &System::events().last().unwrap().event {
            MetaEvent::data_directory(data_directory::RawEvent::ContentAdded(content, creator)) => {
                (content[0].content_id, creator.clone())
            }
            _ => (0u64, StorageObjectOwner::Member(0xdeadbeefu64)), // invalid value, unlikely to match
        };
        assert_ne!(creator, StorageObjectOwner::Member(0xdeadbeefu64));
        assert_eq!(creator, StorageObjectOwner::Member(sender));

        let (storage_provider_account_id, storage_provider_id) = hire_storage_provider();

        // Rejecting content should not work with some random origin
        let res =
            TestDataDirectory::reject_content(Origin::signed(55), storage_provider_id, content_id);
        assert!(res.is_err());

        // However, with the liaison as origin it should.
        let res = TestDataDirectory::reject_content(
            Origin::signed(storage_provider_account_id),
            storage_provider_id,
            content_id,
        );
        assert_eq!(res, Ok(()));
    });
}