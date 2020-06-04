#![cfg(test)]

use super::mock::*;

#[test]
fn succeed_adding_content() {
    with_default_mock_builder(|| {
        let sender = 1 as u64;
        // Register a content with 1234 bytes of type 1, which should be recognized.
        let res =
            TestDataDirectory::add_content(Origin::signed(sender), 1, 1234, 0, vec![1, 3, 3, 7]);
        assert!(res.is_ok());
    });
}

#[test]
fn accept_content_as_liaison() {
    with_default_mock_builder(|| {
        let sender = 1 as u64;
        let res =
            TestDataDirectory::add_content(Origin::signed(sender), 1, 1234, 0, vec![1, 2, 3, 4]);
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

        // Accepting content should not work with some random origin
        let res = TestDataDirectory::accept_content(Origin::signed(1), content_id);
        assert!(res.is_err());

        // However, with the liaison as origin it should.
        let res = TestDataDirectory::accept_content(Origin::signed(TEST_MOCK_LIAISON), content_id);
        assert!(res.is_ok());
    });
}

#[test]
fn reject_content_as_liaison() {
    with_default_mock_builder(|| {
        let sender = 1 as u64;
        let res =
            TestDataDirectory::add_content(Origin::signed(sender), 1, 1234, 0, vec![1, 2, 3, 4]);
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

        // Rejecting content should not work with some random origin
        let res = TestDataDirectory::reject_content(Origin::signed(1), content_id);
        assert!(res.is_err());

        // However, with the liaison as origin it should.
        let res = TestDataDirectory::reject_content(Origin::signed(TEST_MOCK_LIAISON), content_id);
        assert!(res.is_ok());
    });
}
