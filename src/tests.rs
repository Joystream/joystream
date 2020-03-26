#![cfg(test)]

use crate::mock::{ConsecutiveRepliesInterval, *};
use crate::*;
use srml_support::assert_ok;
use system::ensure_signed;

//Blog, post or reply id
const FIRST_ID: u32 = 0;
const SECOND_ID: u32 = 1;

const FIRST_OWNER_ORIGIN: u64 = 1;
const SECOND_OWNER_ORIGIN: u64 = 2;

fn assert_event_success(tested_event: TestEvent, number_of_events_after_call: usize) {
    // Ensure  runtime events length is equal to expected number of events after call
    assert_eq!(System::events().len(), number_of_events_after_call);

    // Ensure  last emitted event is equal to expected one
    assert!(matches!(
            System::events()
                .iter()
                .last(),
            Some(last_event) if last_event.event == tested_event
    ));
}

fn assert_failure(
    call_result: Result<(), &str>,
    expected_error: &str,
    number_of_events_before_call: usize,
) {
    // Ensure  call result is equal to expected error
    assert!(matches!(
        call_result,
        Err(call_result) if call_result == expected_error
    ));

    // Ensure  no other events emitted after call
    assert_eq!(System::events().len(), number_of_events_before_call);
}

fn ensure_replies_equality(
    reply: Option<Reply<Runtime>>,
    reply_owner_id: <Runtime as system::Trait>::AccountId,
    parent: Parent<Runtime>,
    editing: bool,
) {
    // Ensure  stored reply is equal to expected one
    assert!(matches!(
        reply,
        Some(reply) if reply == get_reply(ReplyType::Valid, reply_owner_id, parent, editing)
    ));
}

fn ensure_posts_equality(post: Option<Post<Runtime>>, editing: bool, locked: bool) {
    // Ensure  stored post is equal to expected one
    assert!(matches!(
        post,
        Some(post) if post == get_post(PostType::Valid, editing, locked)
    ));
}

fn ensure_reaction_status(
    reactions: Option<&Vec<bool>>,
    index: <Runtime as Trait>::ReactionsNumber,
    status: bool,
) {
    // Ensure  reaction status at given index is equal to expected one
    assert!(matches!(
        reactions,
        Some(reactions) if reactions[index as usize] == status
    ));
}

// Blogs
#[test]
fn blog_creation() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        assert_eq!(blogs_count(), 0);

        assert_ok!(create_blog(FIRST_OWNER_ORIGIN));

        // Runtime tested state after call

        // Overall blogs counter after blog creation checked
        assert_eq!(blogs_count(), 1);
        let owner_id = ensure_signed(Origin::signed(FIRST_OWNER_ORIGIN)).unwrap();

        // Check up for new blog entry
        let blog = blog_by_id(FIRST_ID).unwrap();

        // Ownership state checked
        assert!(blog.is_owner(&owner_id));

        let blog_created_event = get_test_event(RawEvent::BlogCreated(owner_id, FIRST_ID));

        // Event checked
        assert_event_success(blog_created_event, number_of_events_before_call + 1);
    })
}

#[test]
fn blog_locking_success() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        create_blog(FIRST_OWNER_ORIGIN);

        // Runtime tested state before call
        let blog = blog_by_id(FIRST_ID).unwrap();

        // Default Locking status
        assert_eq!(blog.is_locked(), false);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        assert_ok!(lock_blog(FIRST_OWNER_ORIGIN, FIRST_ID));

        // Check related state after extrinsic performed
        let blog = blog_by_id(FIRST_ID).unwrap();

        assert_eq!(blog.is_locked(), true);

        let blog_owner_id = ensure_signed(Origin::signed(FIRST_OWNER_ORIGIN)).unwrap();

        let blog_locked_event = get_test_event(RawEvent::BlogLocked(blog_owner_id, FIRST_ID));

        //Event checked
        assert_event_success(blog_locked_event, number_of_events_before_call + 1);
    })
}

#[test]
fn blog_locking_blog_not_found() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Event number before tested call
        let number_of_events_before_call = System::events().len();

        // Attemt to lock non existing blog
        let lock_result = lock_blog(FIRST_OWNER_ORIGIN, FIRST_ID);

        // Failure checked
        assert_failure(lock_result, BLOG_NOT_FOUND, number_of_events_before_call);
    })
}

#[test]
fn blog_locking_ownership_error() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        create_blog(FIRST_OWNER_ORIGIN);

        // Create another blog, using second owner origin
        create_blog(SECOND_OWNER_ORIGIN);

        // Event number before tested call
        let number_of_events_before_call = System::events().len();

        // Non owner attemt to lock blog
        let lock_result = lock_blog(SECOND_OWNER_ORIGIN, FIRST_ID);

        // Check related state after extrinsic performed
        let blog = blog_by_id(FIRST_ID).unwrap();

        // Remain unlocked
        assert_eq!(blog.is_locked(), false);

        // Failure checked
        assert_failure(
            lock_result,
            BLOG_OWNERSHIP_ERROR,
            number_of_events_before_call,
        )
    })
}

#[test]
fn blog_unlocking_success() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        create_blog(FIRST_OWNER_ORIGIN);

        // Lock blog firstly, as default state after creation is unlocked
        lock_blog(FIRST_OWNER_ORIGIN, FIRST_ID);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        assert_ok!(unlock_blog(FIRST_OWNER_ORIGIN, FIRST_ID));

        // Check related state after extrinsic performed
        let blog = blog_by_id(FIRST_ID).unwrap();

        assert_eq!(blog.is_locked(), false);

        let owner_id = ensure_signed(Origin::signed(FIRST_OWNER_ORIGIN)).unwrap();
        let blog_unlocked_event = get_test_event(RawEvent::BlogUnlocked(owner_id, FIRST_ID));

        // Event checked
        assert_event_success(blog_unlocked_event, number_of_events_before_call + 1);
    })
}

#[test]
fn blog_unlocking_blog_not_found() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Attemt to unlock non existent blog
        let unlock_result = unlock_blog(SECOND_OWNER_ORIGIN, FIRST_ID);

        // Failure checked
        assert_failure(unlock_result, BLOG_NOT_FOUND, number_of_events_before_call)
    })
}

#[test]
fn blog_unlocking_ownership_error() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        create_blog(FIRST_OWNER_ORIGIN);

        // Create another blog, using second owner origin
        create_blog(SECOND_OWNER_ORIGIN);

        // Lock blog firstly, as default state after creation is unlocked
        lock_blog(FIRST_OWNER_ORIGIN, FIRST_ID);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Non owner attemt to unlock blog
        let unlock_result = unlock_blog(SECOND_OWNER_ORIGIN, FIRST_ID);

        // Check related state after extrinsic performed
        let blog = blog_by_id(FIRST_ID).unwrap();

        // Remain locked
        assert_eq!(blog.is_locked(), true);

        // Failure checked
        assert_failure(
            unlock_result,
            BLOG_OWNERSHIP_ERROR,
            number_of_events_before_call,
        );
    })
}

// Posts
#[test]
fn post_creation_success() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Create post
        assert_ok!(create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid));

        // Check related state after extrinsic performed

        // Posts storage updated succesfully
        let post = post_by_id(FIRST_ID, FIRST_ID);

        ensure_posts_equality(post, false, false);

        let blog = blog_by_id(FIRST_ID).unwrap();

        // Post counter, related to given blog updated succesfully
        assert_eq!(blog.posts_count(), 1);

        // Event checked
        let post_created_event = TestEvent::test_events(RawEvent::PostCreated(FIRST_ID, FIRST_ID));
        assert_event_success(post_created_event, number_of_events_before_call + 1)
    })
}

#[test]
fn post_creation_blog_not_found() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let create_result = create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Check if related runtime storage left unchanged
        assert!(post_storage_unchanged(FIRST_ID, FIRST_ID));

        // Failure checked
        assert_failure(create_result, BLOG_NOT_FOUND, number_of_events_before_call);
    })
}

#[test]
fn post_creation_blog_ownership_error() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        // Create another blog, using second owner origin
        create_blog(SECOND_OWNER_ORIGIN);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let create_result = create_post(SECOND_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Check if related runtime storage left unchanged
        assert!(post_storage_unchanged(FIRST_ID, FIRST_ID));

        // Failure checked
        assert_failure(
            create_result,
            BLOG_OWNERSHIP_ERROR,
            number_of_events_before_call,
        );
    })
}

#[test]
fn post_creation_blog_locked_error() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        lock_blog(FIRST_OWNER_ORIGIN, FIRST_ID);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let create_result = create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Check if related runtime storage left unchanged
        assert!(post_storage_unchanged(FIRST_ID, FIRST_ID));

        // Failure checked
        assert_failure(
            create_result,
            BLOG_LOCKED_ERROR,
            number_of_events_before_call,
        );
    })
}

#[test]
fn post_creation_title_too_long() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let create_result = create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::PostTitleInvalid);

        // Check if related runtime storage left unchanged
        assert!(post_storage_unchanged(FIRST_ID, FIRST_ID));

        // Failure checked
        assert_failure(
            create_result,
            POST_TITLE_TOO_LONG,
            number_of_events_before_call,
        );
    })
}

#[test]
fn post_creation_body_too_long() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let create_result = create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::PostBodyInvalid);

        // Check if related runtime storage left unchanged
        assert!(post_storage_unchanged(FIRST_ID, FIRST_ID));

        // Failure checked
        assert_failure(
            create_result,
            POST_BODY_TOO_LONG,
            number_of_events_before_call,
        );
    })
}

#[test]
fn post_creation_limit_reached() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);
        loop {
            // Events number before tested call
            let number_of_events_before_call = System::events().len();

            if let Err(create_post_err) = create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid)
            {
                // Check related state after extrinsic performed
                let blog = blog_by_id(FIRST_ID).unwrap();

                // Post counter & post max number contraint equality checked
                assert_eq!(blog.posts_count(), PostsMaxNumber::get());

                // Last post creation, before limit reached, failure checked
                assert_failure(
                    Err(create_post_err),
                    POSTS_LIMIT_REACHED,
                    number_of_events_before_call,
                );
                break;
            }
        }
    })
}

#[test]
fn post_locking_success() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        let post = post_by_id(FIRST_ID, FIRST_ID).unwrap();

        // Check default post locking status right after creation
        assert_eq!(post.is_locked(), false);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        assert_ok!(lock_post(FIRST_OWNER_ORIGIN, FIRST_ID, FIRST_ID));

        // Check related state after extrinsic performed

        let post = post_by_id(FIRST_ID, FIRST_ID).unwrap();

        assert_eq!(post.is_locked(), true);

        let post_locked_event = get_test_event(RawEvent::PostLocked(FIRST_ID, FIRST_ID));

        // Event checked
        assert_event_success(post_locked_event, number_of_events_before_call + 1)
    })
}

#[test]
fn post_locking_blog_not_found() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let lock_result = lock_post(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID);

        // Failure checked
        assert_failure(lock_result, BLOG_NOT_FOUND, number_of_events_before_call);
    })
}

#[test]
fn post_locking_post_not_found() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let lock_result = lock_post(FIRST_OWNER_ORIGIN, FIRST_ID, FIRST_ID);

        // Failure checked
        assert_failure(lock_result, POST_NOT_FOUND, number_of_events_before_call);
    })
}

#[test]
fn post_locking_ownership_error() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        // Create another blog, using second owner origin
        create_blog(SECOND_OWNER_ORIGIN);

        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let lock_result = lock_post(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID);

        // Check related state after extrinsic performed

        let post = post_by_id(FIRST_ID, FIRST_ID).unwrap();

        // Remain unlocked
        assert_eq!(post.is_locked(), false);

        // Failure checked
        assert_failure(
            lock_result,
            BLOG_OWNERSHIP_ERROR,
            number_of_events_before_call,
        );
    })
}

#[test]
fn post_unlocking_success() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Lock post firstly
        lock_post(FIRST_OWNER_ORIGIN, FIRST_ID, FIRST_ID);

        // Check related state before extrinsic performed
        let post = post_by_id(FIRST_ID, FIRST_ID).unwrap();

        assert_eq!(post.is_locked(), true);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        assert_ok!(unlock_post(FIRST_OWNER_ORIGIN, FIRST_ID, FIRST_ID));

        // Check related state after extrinsic performed
        let post = post_by_id(FIRST_ID, FIRST_ID).unwrap();

        assert_eq!(post.is_locked(), false);

        let post_unlocked_event = get_test_event(RawEvent::PostUnlocked(FIRST_ID, FIRST_ID));

        // Event checked
        assert_event_success(post_unlocked_event, number_of_events_before_call + 1)
    })
}

#[test]
fn post_unlocking_owner_not_found() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Lock post firstly
        lock_post(FIRST_OWNER_ORIGIN, FIRST_ID, FIRST_ID);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let unlock_result = unlock_post(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID);

        // Check related state after extrinsic performed
        let post = post_by_id(FIRST_ID, FIRST_ID).unwrap();

        // Remain locked
        assert_eq!(post.is_locked(), true);

        // Failure checked
        assert_failure(
            unlock_result,
            BLOG_OWNERSHIP_ERROR,
            number_of_events_before_call,
        );
    })
}

#[test]
fn post_unlocking_post_not_found() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Try to unlock not existing post
        let unlock_result = unlock_post(FIRST_OWNER_ORIGIN, FIRST_ID, FIRST_ID);

        // Failure checked
        assert_failure(unlock_result, POST_NOT_FOUND, number_of_events_before_call);
    })
}

#[test]
fn post_unlocking_ownership_error() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        // Create another blog, using second owner origin
        create_blog(SECOND_OWNER_ORIGIN);

        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Lock post firstly
        lock_post(FIRST_OWNER_ORIGIN, FIRST_ID, FIRST_ID);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let unlock_result = unlock_post(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID);

        // Check related state after extrinsic performed
        let post = post_by_id(FIRST_ID, FIRST_ID).unwrap();

        // Remain locked
        assert_eq!(post.is_locked(), true);

        // Failure checked
        assert_failure(
            unlock_result,
            BLOG_OWNERSHIP_ERROR,
            number_of_events_before_call,
        );
    })
}

#[test]
fn post_editing_success() {
    ExtBuilder::<Runtime>::default()
        .post_title_max_length(5)
        .post_body_max_length(10)
        .build()
        .execute_with(|| {
            // Create blog for future posts
            create_blog(FIRST_OWNER_ORIGIN);
            create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

            // Events number before tested call
            let number_of_events_before_call = System::events().len();

            assert_ok!(edit_post(
                FIRST_OWNER_ORIGIN,
                FIRST_ID,
                FIRST_ID,
                PostType::Valid
            ));

            // Post after editing checked
            let post_after_editing = post_by_id(FIRST_ID, FIRST_ID);

            ensure_posts_equality(post_after_editing, true, false);

            let post_edited_event =
                TestEvent::test_events(RawEvent::PostEdited(FIRST_ID, FIRST_ID));

            // Event checked
            assert_event_success(post_edited_event, number_of_events_before_call + 1)
        })
}

#[test]
fn post_editing_ownership_error() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let edit_result = edit_post(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, PostType::Valid);

        // Remain unedited
        let post = post_by_id(FIRST_ID, FIRST_ID);

        // Compare with default unedited post
        ensure_posts_equality(post, false, false);

        // Failure checked
        assert_failure(
            edit_result,
            BLOG_OWNERSHIP_ERROR,
            number_of_events_before_call,
        );
    })
}

#[test]
fn post_editing_post_not_found() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Try to unlock not existing post
        let edit_result = edit_post(FIRST_OWNER_ORIGIN, FIRST_ID, FIRST_ID, PostType::Valid);

        // Failure checked
        assert_failure(edit_result, POST_NOT_FOUND, number_of_events_before_call);
    })
}

#[test]
fn post_editing_blog_locked_error() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Lock blog to make all related data immutable
        lock_blog(FIRST_OWNER_ORIGIN, FIRST_ID);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let edit_result = edit_post(FIRST_OWNER_ORIGIN, FIRST_ID, FIRST_ID, PostType::Valid);

        // Remain unedited
        let post = post_by_id(FIRST_ID, FIRST_ID);

        // Compare with default unedited post
        ensure_posts_equality(post, false, false);

        // Failure checked
        assert_failure(edit_result, BLOG_LOCKED_ERROR, number_of_events_before_call);
    })
}

#[test]
fn post_editing_post_locked_error() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Lock post to make all related data immutable
        lock_post(FIRST_OWNER_ORIGIN, FIRST_ID, FIRST_ID);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let edit_result = edit_post(FIRST_OWNER_ORIGIN, FIRST_ID, FIRST_ID, PostType::Valid);

        // Remain unedited
        let post = post_by_id(FIRST_ID, FIRST_ID);

        // Compare with default unedited locked post
        ensure_posts_equality(post, false, true);

        // Failure checked
        assert_failure(edit_result, POST_LOCKED_ERROR, number_of_events_before_call);
    })
}

#[test]
fn post_editing_title_invalid_error() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let edit_result = edit_post(
            FIRST_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            PostType::PostTitleInvalid,
        );

        // Remain unedited
        let post = post_by_id(FIRST_ID, FIRST_ID);

        // Compare with default unedited post
        ensure_posts_equality(post, false, false);

        // Failure checked
        assert_failure(
            edit_result,
            POST_TITLE_TOO_LONG,
            number_of_events_before_call,
        );
    })
}

#[test]
fn post_editing_body_invalid_error() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let edit_result = edit_post(
            FIRST_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            PostType::PostBodyInvalid,
        );

        // Remain unedited
        let post = post_by_id(FIRST_ID, FIRST_ID);

        // Compare with default unedited post
        ensure_posts_equality(post, false, false);

        // Failure checked
        assert_failure(
            edit_result,
            POST_BODY_TOO_LONG,
            number_of_events_before_call,
        );
    })
}

// Replies
#[test]
fn reply_creation_success() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        // Create post for future replies
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        let reply_owner_id = ensure_signed(Origin::signed(SECOND_OWNER_ORIGIN)).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        assert_ok!(create_reply(
            SECOND_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            None,
            ReplyType::Valid
        ));

        // Check reply related state after extrinsic performed

        let post = post_by_id(FIRST_ID, FIRST_ID).unwrap();

        // Replies related storage updated succesfully
        let reply = reply_by_id(FIRST_ID, FIRST_ID, FIRST_ID);

        ensure_replies_equality(reply, reply_owner_id, Parent::Post(FIRST_ID), false);

        // Overall post replies count
        assert_eq!(post.replies_count(), 1);

        // Root replies counter updated
        assert_eq!(
            TestBlogModule::get_replies_count(FIRST_ID, FIRST_ID, None),
            1
        );

        // Event checked
        let reply_created_event = get_test_event(RawEvent::ReplyCreated(
            reply_owner_id,
            FIRST_ID,
            FIRST_ID,
            FIRST_ID,
        ));
        assert_event_success(reply_created_event, number_of_events_before_call + 1)
    })
}

#[test]
fn direct_reply_creation_success() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        // Create post for future replies
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        let direct_reply_owner_id = ensure_signed(Origin::signed(SECOND_OWNER_ORIGIN)).unwrap();

        assert_ok!(create_reply(
            FIRST_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            None,
            ReplyType::Valid
        ));

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Create reply for direct replying
        assert_ok!(create_reply(
            SECOND_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            Some(FIRST_ID),
            ReplyType::Valid
        ));

        // Check reply related state after extrinsic performed

        let post = post_by_id(FIRST_ID, FIRST_ID).unwrap();

        // Replies related storage updated succesfully
        let reply = reply_by_id(FIRST_ID, FIRST_ID, SECOND_ID);

        ensure_replies_equality(reply, direct_reply_owner_id, Parent::Reply(FIRST_ID), false);

        // Overall post replies count
        assert_eq!(post.replies_count(), 2);

        // Direct replies counter updated
        assert_eq!(
            TestBlogModule::get_replies_count(FIRST_ID, FIRST_ID, Some(FIRST_ID)),
            1
        );

        // Event checked
        let reply_created_event = get_test_event(RawEvent::DirectReplyCreated(
            direct_reply_owner_id,
            FIRST_ID,
            FIRST_ID,
            FIRST_ID,
            SECOND_ID,
        ));
        assert_event_success(reply_created_event, number_of_events_before_call + 1)
    })
}

#[test]
fn reply_creation_blog_locked_error() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Lock blog to make all related data immutable
        lock_blog(FIRST_OWNER_ORIGIN, FIRST_ID);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let reply_creation_result = create_reply(
            SECOND_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            None,
            ReplyType::Valid,
        );

        // Check if related replies storage left unchanged
        assert!(replies_storage_unchanged(FIRST_ID, FIRST_ID, FIRST_ID));

        // Failure checked
        assert_failure(
            reply_creation_result,
            BLOG_LOCKED_ERROR,
            number_of_events_before_call,
        );
    })
}

#[test]
fn reply_creation_post_locked_error() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Lock post to make all related data immutable
        lock_post(FIRST_OWNER_ORIGIN, FIRST_ID, FIRST_ID);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let reply_creation_result = create_reply(
            SECOND_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            None,
            ReplyType::Valid,
        );

        // Check if related replies storage left unchanged
        assert!(replies_storage_unchanged(FIRST_ID, FIRST_ID, FIRST_ID));

        // Failure checked
        assert_failure(
            reply_creation_result,
            POST_LOCKED_ERROR,
            number_of_events_before_call,
        );
    })
}

#[test]
fn reply_creation_text_too_long_error() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let reply_creation_result = create_reply(
            SECOND_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            None,
            ReplyType::Invalid,
        );

        // Check if related replies storage left unchanged
        assert!(replies_storage_unchanged(FIRST_ID, FIRST_ID, FIRST_ID));

        // Failure checked
        assert_failure(
            reply_creation_result,
            REPLY_TEXT_TOO_LONG,
            number_of_events_before_call,
        );
    })
}

#[test]
fn reply_creation_post_not_found() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let reply_creation_result = create_reply(
            SECOND_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            None,
            ReplyType::Valid,
        );

        // Check if related replies storage left unchanged
        assert!(replies_storage_unchanged(FIRST_ID, FIRST_ID, FIRST_ID));

        // Failure checked
        assert_failure(
            reply_creation_result,
            POST_NOT_FOUND,
            number_of_events_before_call,
        );
    })
}

#[test]
fn reply_creation_limit_reached() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        // Create post for future replies
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        loop {
            // Events number before tested call
            let number_of_events_before_call = System::events().len();
            if let Err(create_reply_err) = create_reply(
                FIRST_OWNER_ORIGIN,
                FIRST_ID,
                FIRST_ID,
                None,
                ReplyType::Valid,
            ) {
                let root_replies_count =
                    TestBlogModule::get_replies_count(FIRST_ID, FIRST_ID, None) as u32;

                // Root post replies counter & reply root max number contraint equality checked
                assert_eq!(root_replies_count, RepliesMaxNumber::get());

                // Last reply creation, before limit reached, failure checked
                assert_failure(
                    Err(create_reply_err),
                    REPLIES_LIMIT_REACHED,
                    number_of_events_before_call,
                );
                break;
            }
        }
    })
}

#[test]
fn direct_reply_creation_reply_not_found() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        // Create post for future replies
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Attempt to create direct reply for nonexistent reply
        let reply_creation_result = create_reply(
            SECOND_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            Some(FIRST_ID),
            ReplyType::Valid,
        );

        // Check if related runtime storage left unchanged
        assert!(replies_storage_unchanged(FIRST_ID, FIRST_ID, SECOND_ID));

        // Failure checked
        assert_failure(
            reply_creation_result,
            REPLY_NOT_FOUND,
            number_of_events_before_call,
        );
    })
}

#[test]
fn direct_reply_creation_limit_reached() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        // Create post for future replies
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Create reply for direct replying
        create_reply(
            FIRST_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            None,
            ReplyType::Valid,
        );
        loop {
            // Events number before tested call
            let number_of_events_before_call = System::events().len();
            if let Err(create_reply_err) = create_reply(
                FIRST_OWNER_ORIGIN,
                FIRST_ID,
                FIRST_ID,
                Some(FIRST_ID),
                ReplyType::Valid,
            ) {
                let direct_replies_count =
                    TestBlogModule::get_replies_count(FIRST_ID, FIRST_ID, Some(FIRST_ID)) as u32;

                // Direct replies counter & max number contraint equality checked
                assert_eq!(direct_replies_count, DirectRepliesMaxNumber::get());

                // Last reply creation, before limit reached, failure checked
                assert_failure(
                    Err(create_reply_err),
                    DIRECT_REPLIES_LIMIT_REACHED,
                    number_of_events_before_call,
                );
                break;
            }
        }
    })
}

#[test]
fn consecutive_reply_creation_limit_reached() {
    ExtBuilder::<Runtime>::default()
        .consecutive_replies_max_number(5)
        .build()
        .execute_with(|| {
            // Create blog for future posts
            create_blog(FIRST_OWNER_ORIGIN);

            // Create post for future replies
            create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

            // Create reply and move to given block to show, that restriction removed
            create_reply(
                FIRST_OWNER_ORIGIN,
                FIRST_ID,
                FIRST_ID,
                None,
                ReplyType::Valid,
            );

            run_to_block((ConsecutiveRepliesInterval::get() + 1) as u64);
            loop {
                // Events number before tested call
                let number_of_events_before_call = System::events().len();
                if let Err(create_reply_err) = create_reply(
                    FIRST_OWNER_ORIGIN,
                    FIRST_ID,
                    FIRST_ID,
                    None,
                    ReplyType::Valid,
                ) {
                    let consecutive_replies_count =
                        TestBlogModule::get_consecutive_replies_count(FIRST_ID, FIRST_ID, None);

                    // Consecutive replies counter & consecutive replies max number contraint equality checked
                    assert_eq!(
                        consecutive_replies_count,
                        ConsecutiveRepliesMaxNumber::get().into()
                    );

                    // Last reply creation, before max consecutive replies limit reached, failure checked
                    assert_failure(
                        Err(create_reply_err),
                        CONSECUTIVE_REPLIES_LIMIT_REACHED,
                        number_of_events_before_call,
                    );
                    break;
                }
            }
        })
}

#[test]
fn reply_editing_success() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future replies
        create_blog(FIRST_OWNER_ORIGIN);

        // Create post for future replies
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        let reply_owner_id = ensure_signed(Origin::signed(SECOND_OWNER_ORIGIN)).unwrap();

        create_reply(
            SECOND_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            None,
            ReplyType::Valid,
        );

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        edit_reply(
            SECOND_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            FIRST_ID,
            ReplyType::Valid,
        );

        // Reply after editing checked
        let reply = reply_by_id(FIRST_ID, FIRST_ID, FIRST_ID);

        ensure_replies_equality(reply, reply_owner_id, Parent::Post(FIRST_ID), true);

        // Event checked
        let reply_edited_event =
            get_test_event(RawEvent::ReplyEdited(FIRST_ID, FIRST_ID, FIRST_ID));
        assert_event_success(reply_edited_event, number_of_events_before_call + 1)
    })
}

#[test]
fn reply_editing_blog_locked_error() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future replies
        create_blog(FIRST_OWNER_ORIGIN);

        // Create post for future replies
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        let reply_owner_id = ensure_signed(Origin::signed(SECOND_OWNER_ORIGIN)).unwrap();

        create_reply(
            SECOND_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            None,
            ReplyType::Valid,
        );

        // Lock blog to make all related data immutable
        lock_blog(FIRST_OWNER_ORIGIN, FIRST_ID);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let reply_editing_result = edit_reply(
            SECOND_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            FIRST_ID,
            ReplyType::Valid,
        );

        // Reply after editing checked
        let reply = reply_by_id(FIRST_ID, FIRST_ID, FIRST_ID);

        // Compare with default unedited reply
        ensure_replies_equality(reply, reply_owner_id, Parent::Post(FIRST_ID), true);

        // Failure checked
        assert_failure(
            reply_editing_result,
            BLOG_LOCKED_ERROR,
            number_of_events_before_call,
        );
    })
}

#[test]
fn reply_editing_post_locked_error() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future replies
        create_blog(FIRST_OWNER_ORIGIN);

        // Create post for future replies
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        let reply_owner_id = ensure_signed(Origin::signed(SECOND_OWNER_ORIGIN)).unwrap();

        create_reply(
            SECOND_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            None,
            ReplyType::Valid,
        );

        // Lock blog to make all related data immutable
        lock_post(FIRST_OWNER_ORIGIN, FIRST_ID, FIRST_ID);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let reply_editing_result = edit_reply(
            SECOND_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            FIRST_ID,
            ReplyType::Valid,
        );

        // Reply after editing checked
        let reply = reply_by_id(FIRST_ID, FIRST_ID, FIRST_ID);

        // Compare with default unedited reply
        ensure_replies_equality(reply, reply_owner_id, Parent::Post(FIRST_ID), true);

        // Failure checked
        assert_failure(
            reply_editing_result,
            POST_LOCKED_ERROR,
            number_of_events_before_call,
        );
    })
}

#[test]
fn reply_editing_not_found() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future replies
        create_blog(FIRST_OWNER_ORIGIN);

        // Create post for future replies
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let reply_editing_result = edit_reply(
            SECOND_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            FIRST_ID,
            ReplyType::Valid,
        );

        // Failure checked
        assert_failure(
            reply_editing_result,
            REPLY_NOT_FOUND,
            number_of_events_before_call,
        );
    })
}

#[test]
fn reply_editing_text_too_long_error() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future replies
        create_blog(FIRST_OWNER_ORIGIN);

        // Create post for future replies
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        let reply_owner_id = ensure_signed(Origin::signed(SECOND_OWNER_ORIGIN)).unwrap();

        create_reply(
            SECOND_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            None,
            ReplyType::Valid,
        );

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let reply_editing_result = edit_reply(
            SECOND_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            FIRST_ID,
            ReplyType::Invalid,
        );

        // Reply after editing checked
        let reply = reply_by_id(FIRST_ID, FIRST_ID, FIRST_ID);

        // Compare with default unedited reply
        ensure_replies_equality(reply, reply_owner_id, Parent::Post(FIRST_ID), true);

        // Failure checked
        assert_failure(
            reply_editing_result,
            REPLY_TEXT_TOO_LONG,
            number_of_events_before_call,
        );
    })
}

#[test]
fn reply_editing_ownership_error() {
    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future replies
        create_blog(FIRST_OWNER_ORIGIN);

        // Create post for future replies
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        let reply_owner_id = ensure_signed(Origin::signed(SECOND_OWNER_ORIGIN)).unwrap();

        create_reply(
            SECOND_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            None,
            ReplyType::Valid,
        );

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let reply_editing_result = edit_reply(
            FIRST_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            FIRST_ID,
            ReplyType::Valid,
        );

        // Reply after editing checked
        let reply = reply_by_id(FIRST_ID, FIRST_ID, FIRST_ID);

        // Compare with default unedited reply
        ensure_replies_equality(reply, reply_owner_id, Parent::Post(FIRST_ID), true);

        // Failure checked
        assert_failure(
            reply_editing_result,
            REPLY_OWNERSHIP_ERROR,
            number_of_events_before_call,
        );
    })
}

#[test]
fn reaction_success() {
    const REACTION_INDEX: <Runtime as Trait>::ReactionsNumber = 4;

    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        // Create post for future replies
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        let reaction_owner_id = ensure_signed(Origin::signed(SECOND_OWNER_ORIGIN)).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // React to a post
        assert_ok!(react(
            SECOND_OWNER_ORIGIN,
            REACTION_INDEX,
            FIRST_ID,
            FIRST_ID,
            None,
        ));

        // Post state after reaction extrinsic performed
        let post = post_by_id(FIRST_ID, FIRST_ID).unwrap();
        ensure_reaction_status(post.get_reactions(&reaction_owner_id), REACTION_INDEX, true);

        // Event checked
        let post_reactions_updated_event = get_test_event(RawEvent::PostReactionsUpdated(
            reaction_owner_id,
            FIRST_ID,
            FIRST_ID,
            REACTION_INDEX,
            true,
        ));
        assert_event_success(
            post_reactions_updated_event,
            number_of_events_before_call + 1,
        );

        create_reply(
            FIRST_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            None,
            ReplyType::Valid,
        );

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // React to a reply twice to check, that flipping performed
        for _ in 0..2 {
            assert_ok!(react(
                SECOND_OWNER_ORIGIN,
                REACTION_INDEX,
                FIRST_ID,
                FIRST_ID,
                Some(FIRST_ID),
            ));
        }

        // Reply state after reaction extrinsic performed
        let reply = reply_by_id(FIRST_ID, FIRST_ID, FIRST_ID).unwrap();
        ensure_reaction_status(
            reply.get_reactions(&reaction_owner_id),
            REACTION_INDEX,
            false,
        );

        // Event checked
        let reply_reactions_updated_event = get_test_event(RawEvent::ReplyReactionsUpdated(
            reaction_owner_id,
            FIRST_ID,
            FIRST_ID,
            FIRST_ID,
            REACTION_INDEX,
            false,
        ));
        assert_event_success(
            reply_reactions_updated_event,
            number_of_events_before_call + 2,
        )
    })
}

#[test]
fn reaction_invalid_index() {
    const REACTIONS_MAX_NUMBER: <Runtime as Trait>::ReactionsNumber = 5;

    ExtBuilder::<Runtime>::default()
        .reactions_max_number(REACTIONS_MAX_NUMBER)
        .build()
        .execute_with(|| {
            // Create blog for future posts
            create_blog(FIRST_OWNER_ORIGIN);

            create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

            // Events number before tested call
            let number_of_events_before_call = System::events().len();

            // React to a post
            // Should fail, as last index in configured reactions array is less by one than array length
            let react_result = react(
                SECOND_OWNER_ORIGIN,
                REACTIONS_MAX_NUMBER,
                FIRST_ID,
                FIRST_ID,
                None,
            );

            // Ensure  reactions related state left unchanged
            assert!(reactions_state_left_unchanged(FIRST_ID, FIRST_ID, None));

            // Failure checked
            assert_failure(
                react_result,
                INVALID_REACTION_INDEX,
                number_of_events_before_call,
            );
        })
}

#[test]
fn reaction_blog_not_found() {
    const REACTION_INDEX: <Runtime as Trait>::ReactionsNumber = 4;

    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // React to a post
        let react_result = react(
            SECOND_OWNER_ORIGIN,
            REACTION_INDEX,
            FIRST_ID,
            FIRST_ID,
            None,
        );

        // Ensure  reactions related state left unchanged
        assert!(reactions_state_left_unchanged(FIRST_ID, FIRST_ID, None));

        // Failure checked
        assert_failure(react_result, BLOG_NOT_FOUND, number_of_events_before_call);
    })
}

#[test]
fn reaction_post_not_found() {
    const REACTION_INDEX: <Runtime as Trait>::ReactionsNumber = 4;

    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        create_blog(FIRST_OWNER_ORIGIN);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // React to a post
        let react_result = react(
            SECOND_OWNER_ORIGIN,
            REACTION_INDEX,
            FIRST_ID,
            FIRST_ID,
            None,
        );

        // Ensure  reactions related state left unchanged
        assert!(reactions_state_left_unchanged(FIRST_ID, FIRST_ID, None));

        // Failure checked
        assert_failure(react_result, POST_NOT_FOUND, number_of_events_before_call);
    })
}

#[test]
fn reaction_reply_not_found() {
    const REACTION_INDEX: <Runtime as Trait>::ReactionsNumber = 4;

    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // React to a reply
        let react_result = react(
            SECOND_OWNER_ORIGIN,
            REACTION_INDEX,
            FIRST_ID,
            FIRST_ID,
            Some(FIRST_ID),
        );

        // Ensure  reactions related state left unchanged
        assert!(reactions_state_left_unchanged(
            FIRST_ID,
            FIRST_ID,
            Some(FIRST_ID)
        ));

        // Failure checked
        assert_failure(react_result, REPLY_NOT_FOUND, number_of_events_before_call);
    })
}

#[test]
fn reaction_blog_locked_error() {
    const REACTION_INDEX: <Runtime as Trait>::ReactionsNumber = 4;

    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Lock block to forbid mutations
        lock_blog(FIRST_OWNER_ORIGIN, FIRST_ID);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // React to a post
        let react_result = react(
            SECOND_OWNER_ORIGIN,
            REACTION_INDEX,
            FIRST_ID,
            FIRST_ID,
            None,
        );

        // Ensure  reactions related state left unchanged
        assert!(reactions_state_left_unchanged(FIRST_ID, FIRST_ID, None));

        // Failure checked
        assert_failure(
            react_result,
            BLOG_LOCKED_ERROR,
            number_of_events_before_call,
        );
    })
}

#[test]
fn reaction_post_locked_error() {
    const REACTION_INDEX: <Runtime as Trait>::ReactionsNumber = 4;

    ExtBuilder::<Runtime>::default().build().execute_with(|| {
        // Create blog for future posts
        create_blog(FIRST_OWNER_ORIGIN);

        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Lock block to forbid mutations
        lock_post(FIRST_OWNER_ORIGIN, FIRST_ID, FIRST_ID);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // React to a post
        let react_result = react(
            SECOND_OWNER_ORIGIN,
            REACTION_INDEX,
            FIRST_ID,
            FIRST_ID,
            None,
        );

        // Ensure  reactions related state left unchanged
        assert!(reactions_state_left_unchanged(FIRST_ID, FIRST_ID, None));

        // Failure checked
        assert_failure(
            react_result,
            POST_LOCKED_ERROR,
            number_of_events_before_call,
        );
    })
}

// Probably an overkill now, as we already ensured,
// that mutations are safe in runtime and tested all failure paths
fn post_storage_unchanged(
    blog_id: <Runtime as Trait>::BlogId,
    post_id: <Runtime as Trait>::PostId,
) -> bool {
    if let Some(blog) = blog_by_id(blog_id) {
        blog.posts_count() == 0 && post_by_id(blog_id, post_id).is_none()
    } else {
        post_by_id(blog_id, post_id).is_none()
    }
}

fn replies_storage_unchanged(
    blog_id: <Runtime as Trait>::BlogId,
    post_id: <Runtime as Trait>::PostId,
    reply_id: <Runtime as Trait>::ReplyId,
) -> bool {
    match post_by_id(blog_id, post_id) {
        Some(post)
            if post.replies_count() == 0 && reply_by_id(blog_id, post_id, reply_id).is_none() =>
        {
            true
        }
        Some(_) => false,
        None if reply_by_id(blog_id, post_id, reply_id).is_none() => true,
        None => false,
    }
}

fn reactions_state_left_unchanged(
    blog_id: <Runtime as Trait>::BlogId,
    post_id: <Runtime as Trait>::PostId,
    reply_id: Option<<Runtime as Trait>::ReplyId>,
) -> bool {
    if let Some(reply_id) = reply_id {
        match reply_by_id(blog_id, post_id, reply_id) {
            Some(reply) if reply.get_reactions_map().is_empty() => true,
            Some(_) => false,
            None => true,
        }
    } else {
        match post_by_id(blog_id, post_id) {
            Some(post) if post.get_reactions_map().is_empty() => true,
            Some(_) => false,
            None => true,
        }
    }
}
