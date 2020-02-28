mod mock;

use mock::*;

use crate::*;
use system::RawOrigin;

//TODO: create discussion content check
//TODO: add post content check
//TODO: update post content check
//TODO: update post ensures check

struct DiscussionFixture {
    pub title: Vec<u8>,
    pub origin: RawOrigin<u64>,
}

impl Default for DiscussionFixture {
    fn default() -> Self {
        DiscussionFixture {
            title: b"title".to_vec(),
            origin: RawOrigin::Signed(1),
        }
    }
}

struct PostFixture {
    pub text: Vec<u8>,
    pub origin: RawOrigin<u64>,
    pub thread_id: u32,
    pub post_id: Option<u32>,
}

impl PostFixture {
    fn default_for_thread(thread_id: u32) -> Self {
        PostFixture {
            text: b"text".to_vec(),
            thread_id,
            origin: RawOrigin::Signed(1),
            post_id: None,
        }
    }

    fn add_post_and_assert(&mut self, result: Result<(), &'static str>) {
        let add_post_result = Discussions::add_post(
            self.origin.clone().into(),
            self.thread_id,
            self.text.clone(),
        );

        assert_eq!(add_post_result, result);

        self.post_id = Some(<PostCount>::get());
    }

    fn update_post_and_assert(&mut self, result: Result<(), &'static str>) {
        let add_post_result = Discussions::update_post(
            self.origin.clone().into(),
            self.thread_id,
            self.post_id.unwrap(),
            self.text.clone(),
        );

        assert_eq!(add_post_result, result);

        self.post_id = Some(<PostCount>::get());
    }
}

impl DiscussionFixture {
    fn create_discussion_and_assert(&self, result: Result<u32, &'static str>) -> Option<u32> {
        let create_discussion_result =
            Discussions::create_thread(self.origin.clone().into(), self.title.clone());

        assert_eq!(create_discussion_result, result);

        create_discussion_result.ok()
    }
}

#[test]
fn create_discussion_call_succeeds() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();

        discussion_fixture.create_discussion_and_assert(Ok(1));
    });
}

#[test]
fn create_post_call_succeeds() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let mut post_fixture = PostFixture::default_for_thread(thread_id);

        post_fixture.add_post_and_assert(Ok(()));
    });
}

#[test]
fn update_post_call_succeeds() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let mut post_fixture = PostFixture::default_for_thread(thread_id);

        post_fixture.add_post_and_assert(Ok(()));
        post_fixture.update_post_and_assert(Ok(()));
    });
}

#[test]
fn update_post_call_failes_because_of_post_edition_limit() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let mut post_fixture = PostFixture::default_for_thread(thread_id);

        post_fixture.add_post_and_assert(Ok(()));

        for _ in 1..6 {
            post_fixture.update_post_and_assert(Ok(()));
        }

        post_fixture.update_post_and_assert(Err("Post edition limit reached."));
    });
}
