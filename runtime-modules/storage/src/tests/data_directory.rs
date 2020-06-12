#![cfg(test)]

use super::mock::*;
use crate::data_directory::Error;
use system::RawOrigin;

#[test]
fn succeed_adding_content() {
    with_default_mock_builder(|| {
        let sender = 1u64;
        let member_id = 1u64;
        // Register a content with 1234 bytes of type 1, which should be recognized.
        let res = TestDataDirectory::add_content(
            Origin::signed(sender),
            member_id,
            1,
            1234,
            0,
            vec![1, 3, 3, 7],
        );
        assert!(res.is_ok());
    });
}

#[test]
fn add_content_fails_with_invalid_origin() {
    with_default_mock_builder(|| {
        let member_id = 1u64;
        // Register a content with 1234 bytes of type 1, which should be recognized.
        let res = TestDataDirectory::add_content(
            RawOrigin::Root.into(),
            member_id,
            1,
            1234,
            0,
            vec![1, 3, 3, 7],
        );
        assert_eq!(res, Err(Error::Other("RequireSignedOrigin")));
    });
}

#[test]
fn accept_and_reject_content_fail_with_invalid_storage_provider() {
    with_default_mock_builder(|| {
        let sender = 1u64;
        let member_id = 1u64;

        let res = TestDataDirectory::add_content(
            Origin::signed(sender),
            member_id,
            1,
            1234,
            0,
            vec![1, 2, 3, 4],
        );
        assert!(res.is_ok());

        let (content_id, _) = match System::events().last().unwrap().event {
            MetaEvent::data_directory(data_directory::RawEvent::ContentAdded(
                content_id,
                creator,
            )) => (content_id, creator),
            _ => (0u64, 0xdeadbeefu64), // invalid value, unlikely to match
        };

        //  invalid data
        let (storage_provider_account_id, storage_provider_id) = (1, 5);

        let res = TestDataDirectory::accept_content(
            Origin::signed(storage_provider_account_id),
            storage_provider_id,
            content_id,
        );
        assert_eq!(res, Err(Error::Other("WorkerDoesNotExist")));

        let res = TestDataDirectory::reject_content(
            Origin::signed(storage_provider_account_id),
            storage_provider_id,
            content_id,
        );
        assert_eq!(res, Err(Error::Other("WorkerDoesNotExist")));
    });
}

#[test]
fn accept_content_as_liaison() {
    with_default_mock_builder(|| {
        let sender = 1u64;
        let member_id = 1u64;

        let res = TestDataDirectory::add_content(
            Origin::signed(sender),
            member_id,
            1,
            1234,
            0,
            vec![1, 2, 3, 4],
        );
        assert!(res.is_ok());

        // An appropriate event should have been fired.
        let (content_id, creator) = match System::events().last().unwrap().event {
            MetaEvent::data_directory(data_directory::RawEvent::ContentAdded(
                content_id,
                creator,
            )) => (content_id, creator),
            _ => (0u64, 0xdeadbeefu64), // invalid value, unlikely to match
        };
        assert_ne!(creator, 0xdeadbeefu64);
        assert_eq!(creator, sender);

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
        let sender = 1u64;
        let member_id = 1u64;

        let res = TestDataDirectory::add_content(
            Origin::signed(sender),
            member_id,
            1,
            1234,
            0,
            vec![1, 2, 3, 4],
        );
        assert!(res.is_ok());

        // An appropriate event should have been fired.
        let (content_id, creator) = match System::events().last().unwrap().event {
            MetaEvent::data_directory(data_directory::RawEvent::ContentAdded(
                content_id,
                creator,
            )) => (content_id, creator),
            _ => (0u64, 0xdeadbeefu64), // invalid value, unlikely to match
        };
        assert_ne!(creator, 0xdeadbeefu64);
        assert_eq!(creator, sender);

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
