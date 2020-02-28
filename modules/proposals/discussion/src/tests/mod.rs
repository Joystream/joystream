mod mock;

use mock::*;

use crate::*;
use system::RawOrigin;

//TODO: create discussion content check
//TODO: add post content check
//TODO: update post content check
//TODO: update post ensures check

struct TestPostEntry {
    pub post_id: u32,
    pub text: Vec<u8>,
    pub edition_number: u32,
}

fn assert_thread_content(thread_id: u32, post_entries: Vec<TestPostEntry>) {
    assert!(<ThreadById<Test>>::exists(thread_id));

    for post_entry in post_entries {
        let actual_post = <PostThreadIdByPostId<Test>>::get(thread_id, post_entry.post_id);
        let expected_post = Post {
            text: post_entry.text,
            created_at: 1,
            updated_at: 1,
            author_id: 1,
            thread_id,
            edition_number: post_entry.edition_number,
        };

        assert_eq!(actual_post, expected_post);
    }
}

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

    fn add_post_and_assert(&mut self, result: Result<(), &'static str>) -> Option<u32> {
        let add_post_result = Discussions::add_post(
            self.origin.clone().into(),
            self.thread_id,
            self.text.clone(),
        );

        assert_eq!(add_post_result, result);

        self.post_id = Some(<PostCount>::get());

        self.post_id
    }

    fn update_post_with_text_and_assert(
        &mut self,
        new_text: Vec<u8>,
        result: Result<(), &'static str>,
    ) {
        let add_post_result = Discussions::update_post(
            self.origin.clone().into(),
            self.thread_id,
            self.post_id.unwrap(),
            new_text,
        );

        assert_eq!(add_post_result, result);
    }

    fn update_post_and_assert(&mut self, result: Result<(), &'static str>) {
        self.update_post_with_text_and_assert(self.text.clone(), result);
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

#[test]
fn thread_content_check_succeeded() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let mut post_fixture1 = PostFixture::default_for_thread(thread_id);
        let post_id1 = post_fixture1.add_post_and_assert(Ok(())).unwrap();

        let mut post_fixture2 = PostFixture::default_for_thread(thread_id);
        let post_id2 = post_fixture2.add_post_and_assert(Ok(())).unwrap();
        post_fixture1.update_post_with_text_and_assert(b"new_text".to_vec(), Ok(()));

        assert_thread_content(
            thread_id,
            vec![
                TestPostEntry {
                    post_id: post_id1,
                    text: b"new_text".to_vec(),
                    edition_number: 1,
                },
                TestPostEntry {
                    post_id: post_id2,
                    text: b"text".to_vec(),
                    edition_number: 0,
                },
            ],
        );
    });
}
