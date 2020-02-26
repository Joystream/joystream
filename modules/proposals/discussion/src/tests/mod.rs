mod mock;

use mock::*;

use crate::*;
use system::RawOrigin;

struct DiscussionFixture {
    pub title: Vec<u8>,
    pub origin: RawOrigin<u64>,
}

impl Default for DiscussionFixture {
    fn default() -> Self {
        DiscussionFixture {
            title: b"text".to_vec(),
            origin: RawOrigin::Signed(1),
        }
    }
}

impl DiscussionFixture {
    fn create_discussion_and_assert(&self, result: Result<(), &'static str>) -> Option<u32> {
        let create_discussion_result =
            Discussions::create_discussion(self.origin.clone().into(), self.title.clone());

        assert_eq!(create_discussion_result, result);

        if result.is_ok() {
            // last created thread id equals current thread count
            let thread_id = <ThreadCount>::get();

            Some(thread_id)
        } else {
            None
        }
    }
}

#[test]
fn create_discussion_call_succeeds() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();

        discussion_fixture.create_discussion_and_assert(Ok(()));
    });
}

#[test]
fn create_post_call_succeeds() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(()))
            .unwrap();

        let origin = RawOrigin::Signed(1);
        let create_discussion_result =
            Discussions::add_post(origin.into(), thread_id, b"text".to_vec());

        assert_eq!(create_discussion_result, Ok(()));
    });
}
