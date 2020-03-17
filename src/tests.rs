#![cfg(test)]

use crate::mock::*;
use crate::*;
use srml_support::assert_ok;

//Blog, post or reply id
const FIRST_ID: u32 = 0;
const SECOND_ID: u32 = 1;

const FIRST_OWNER_ORIGIN: u64 = 1;
const SECOND_OWNER_ORIGIN: u64 = 2;

enum PostType {
    Valid,
    PostTitleInvalid,
    PostBodyInvalid,
}

enum ReplyType {
    Valid,
    Invalid,
}

fn get_post(post_type: PostType, editing: bool) -> Post {
    let (title, body);
    match post_type {
        // Make them different
        PostType::Valid if editing => {
            title = generate_text((PostTitleMaxLength::get() - 1) as usize);
            body = generate_text((PostBodyMaxLength::get() - 1) as usize);
        }
        PostType::Valid => {
            title = generate_text(PostTitleMaxLength::get() as usize);
            body = generate_text(PostBodyMaxLength::get() as usize);
        }
        PostType::PostTitleInvalid => {
            title = generate_text((PostTitleMaxLength::get() + 1) as usize);
            body = generate_text(PostBodyMaxLength::get() as usize);
        }
        PostType::PostBodyInvalid => {
            title = generate_text(PostTitleMaxLength::get() as usize);
            body = generate_text((PostBodyMaxLength::get() + 1) as usize);
        }
    }
    Post::new(title, body)
}

fn get_reply(reply_type: ReplyType, editing: bool) -> Vec<u8> {
    match reply_type {
        ReplyType::Valid if editing => generate_text(ReplyMaxLength::get() as usize),
        ReplyType::Valid => generate_text(ReplyMaxLength::get() as usize),
        ReplyType::Invalid => generate_text((ReplyMaxLength::get() + 1) as usize),
    }
}

fn create_post(
    origin_id: u64,
    blog_id: <Runtime as Trait>::BlogId,
    post_type: PostType,
) -> Result<(), &'static str> {
    let post = get_post(post_type, false);
    TestBlogModule::create_post(Origin::signed(origin_id), blog_id, post.title, post.body)
}

fn edit_post(
    origin_id: u64,
    blog_id: <Runtime as Trait>::BlogId,
    post_id: <Runtime as Trait>::PostId,
    post_type: PostType,
) -> Result<(), &'static str> {
    let post = get_post(post_type, true);
    TestBlogModule::edit_post(
        Origin::signed(origin_id),
        blog_id,
        post_id,
        Some(post.title),
        Some(post.body),
    )
}

fn create_reply(
    origin_id: u64,
    blog_id: <Runtime as Trait>::BlogId,
    post_id: <Runtime as Trait>::PostId,
    reply_id: Option<<Runtime as Trait>::ReplyId>,
    reply_type: ReplyType,
) -> Result<(), &'static str> {
    let reply = get_reply(reply_type, false);
    TestBlogModule::create_reply(Origin::signed(origin_id), blog_id, post_id, reply_id, reply)
}

fn edit_reply(
    origin_id: u64,
    blog_id: <Runtime as Trait>::BlogId,
    post_id: <Runtime as Trait>::PostId,
    reply_id: <Runtime as Trait>::ReplyId,
    reply_type: ReplyType,
) -> Result<(), &'static str> {
    let reply = get_reply(reply_type, true);
    TestBlogModule::edit_reply(Origin::signed(origin_id), blog_id, post_id, reply_id, reply)
}

// Blogs
#[test]
fn blog_creation() {
    ExtBuilder::default().build().execute_with(|| {
        assert_eq!(TestBlogModule::blogs_count(), 0);
        assert_ok!(TestBlogModule::create_blog(Origin::signed(
            FIRST_OWNER_ORIGIN
        )));
        assert_eq!(TestBlogModule::blogs_count(), 1);
        let owner_id = ensure_signed(Origin::signed(FIRST_OWNER_ORIGIN)).unwrap();
        // Check up for new blog id entry
        let mut set = BTreeSet::new();
        set.insert(FIRST_ID);
        let blog_id = TestBlogModule::blog_ids_by_owner(owner_id).unwrap();
        assert_eq!(blog_id, set);
        // Event checked
        let blog_created_event = TestEvent::test_events(RawEvent::BlogCreated(owner_id, FIRST_ID));
        assert!(System::events()
            .iter()
            .any(|a| a.event == blog_created_event));
    })
}

#[test]
fn blog_locking_success() {
    ExtBuilder::default().build().execute_with(|| {
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        let is_locked = TestBlogModule::blog_locked(FIRST_ID);
        // Default Locking status
        assert_eq!(is_locked, false);
        assert_ok!(TestBlogModule::lock_blog(
            Origin::signed(FIRST_OWNER_ORIGIN),
            FIRST_ID
        ));
        let is_locked = TestBlogModule::blog_locked(FIRST_ID);
        assert_eq!(is_locked, true);
        let owner_id = ensure_signed(Origin::signed(FIRST_OWNER_ORIGIN)).unwrap();
        let blog_locked_event = TestEvent::test_events(RawEvent::BlogLocked(owner_id, FIRST_ID));
        // Event checked
        assert!(System::events()
            .iter()
            .any(|a| a.event == blog_locked_event));
    })
}

#[test]
fn blog_locking_owner_not_found() {
    ExtBuilder::default().build().execute_with(|| {
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        // Non owner attemt to lock blog
        let lock_result = TestBlogModule::lock_blog(Origin::signed(SECOND_OWNER_ORIGIN), FIRST_ID);
        assert!(matches!(lock_result, Err(lock_err) if lock_err == BLOG_OWNER_NOT_FOUND));
        // Remain unlocked
        let is_locked = TestBlogModule::blog_locked(FIRST_ID);
        assert_eq!(is_locked, false);
        assert!(blog_locking_event_failure(SECOND_OWNER_ORIGIN));
    })
}

#[test]
fn blog_locking_ownership_error() {
    ExtBuilder::default().build().execute_with(|| {
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        // Create another blog, using second owner origin
        TestBlogModule::create_blog(Origin::signed(SECOND_OWNER_ORIGIN));
        // Non owner attemt to lock blog
        let lock_result = TestBlogModule::lock_blog(Origin::signed(SECOND_OWNER_ORIGIN), FIRST_ID);
        assert!(matches!(lock_result, Err(lock_err) if lock_err == BLOG_OWNERSHIP_ERROR));
        // Remain unlocked
        let is_locked = TestBlogModule::blog_locked(FIRST_ID);
        assert_eq!(is_locked, false);
        assert!(blog_locking_event_failure(SECOND_OWNER_ORIGIN));
    })
}

#[test]
fn blog_unlocking_success() {
    ExtBuilder::default().build().execute_with(|| {
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        // Lock blog firstly, as default state after creation is unlocked
        TestBlogModule::lock_blog(Origin::signed(FIRST_OWNER_ORIGIN), FIRST_ID);
        assert_ok!(TestBlogModule::unlock_blog(
            Origin::signed(FIRST_OWNER_ORIGIN),
            FIRST_ID
        ));
        let is_locked = TestBlogModule::blog_locked(FIRST_ID);
        assert_eq!(is_locked, false);
        let owner_id = ensure_signed(Origin::signed(FIRST_OWNER_ORIGIN)).unwrap();
        let blog_unlocked_event =
            TestEvent::test_events(RawEvent::BlogUnlocked(owner_id, FIRST_ID));
        assert!(System::events()
            .iter()
            .any(|a| a.event == blog_unlocked_event));
    })
}

#[test]
fn blog_unlocking_owner_not_found() {
    ExtBuilder::default().build().execute_with(|| {
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        // Lock blog firstly, as default state after creation is unlocked
        TestBlogModule::lock_blog(Origin::signed(FIRST_OWNER_ORIGIN), FIRST_ID);
        // Non owner attemt to unlock blog
        let unlock_result =
            TestBlogModule::unlock_blog(Origin::signed(SECOND_OWNER_ORIGIN), FIRST_ID);
        assert!(matches!(unlock_result, Err(unlock_err) if unlock_err == BLOG_OWNER_NOT_FOUND));
        // Remain locked
        let is_locked = TestBlogModule::blog_locked(FIRST_ID);
        assert_eq!(is_locked, true);
        // Event absence checked
        assert!(blog_unlocking_event_failure(SECOND_OWNER_ORIGIN));
    })
}

#[test]
fn blog_unlocking_ownership_error() {
    ExtBuilder::default().build().execute_with(|| {
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        // Create another blog, using second owner origin
        TestBlogModule::create_blog(Origin::signed(SECOND_OWNER_ORIGIN));
        // Lock blog firstly, as default state after creation is unlocked
        TestBlogModule::lock_blog(Origin::signed(FIRST_OWNER_ORIGIN), FIRST_ID);
        // Non owner attemt to unlock blog
        let unlock_result =
            TestBlogModule::unlock_blog(Origin::signed(SECOND_OWNER_ORIGIN), FIRST_ID);
        assert!(matches!(unlock_result, Err(unlock_err) if unlock_err == BLOG_OWNERSHIP_ERROR));
        // Remain locked
        let is_locked = TestBlogModule::blog_locked(FIRST_ID);
        assert_eq!(is_locked, true);
        // Event absence checked
        assert!(blog_unlocking_event_failure(SECOND_OWNER_ORIGIN));
    })
}

fn blog_unlocking_event_failure(invalid_owner_origin: u64) -> bool {
    // Get invalid blog owner
    let invalid_owner_id = ensure_signed(Origin::signed(invalid_owner_origin)).unwrap();
    let blog_unlocked_event =
        TestEvent::test_events(RawEvent::BlogUnlocked(invalid_owner_id, FIRST_ID));
    System::events()
        .iter()
        .all(|a| a.event != blog_unlocked_event)
}

//Posts
#[test]
fn post_creation_success() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        assert_eq!(TestBlogModule::posts_count(FIRST_ID), 0);
        assert_ok!(create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid));
        // Posts storage updated succesfully
        let post = TestBlogModule::post_by_id((FIRST_ID, FIRST_ID));
        assert!(matches!(post, Some(post) if post == get_post(PostType::Valid, false)));
        // Check up all changes, related to given post id 
        let mut set = BTreeSet::new();
        set.insert(FIRST_ID);
        assert!(matches!(TestBlogModule::post_ids_by_blog_id(FIRST_ID), Some(post_ids) if post_ids == set));
        // Post counter updated succesfully
        assert_eq!(TestBlogModule::posts_count(FIRST_ID), 1);
        // Event checked
        let post_created_event = TestEvent::test_events(RawEvent::PostCreated(FIRST_ID, FIRST_ID));
        assert!(System::events()
            .iter()
            .any(|a| a.event == post_created_event));
    })
}

#[test]
fn post_creation_blog_owner_not_found() {
    ExtBuilder::default().build().execute_with(|| {
        let create_result = create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        assert!(matches!(create_result, Err(create_err) if create_err == BLOG_OWNER_NOT_FOUND));
        // Check if related runtime storage left unchanged
        assert!(post_storage_unchanged(FIRST_ID, FIRST_ID));
        // Event absence checked
        assert!(post_creation_event_failure(FIRST_ID, FIRST_ID))
    })
}

#[test]
fn post_creation_blog_ownership_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        // Create another blog, using second owner origin
        TestBlogModule::create_blog(Origin::signed(SECOND_OWNER_ORIGIN));
        let create_result = create_post(SECOND_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        assert!(matches!(create_result, Err(create_err) if create_err == BLOG_OWNERSHIP_ERROR));
        // Check if related runtime storage left unchanged
        assert!(post_storage_unchanged(FIRST_ID, FIRST_ID));
        // Event absence checked
        assert!(post_creation_event_failure(FIRST_ID, FIRST_ID))
    })
}

#[test]
fn post_creation_blog_locked_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        TestBlogModule::lock_blog(Origin::signed(FIRST_OWNER_ORIGIN), FIRST_ID);
        let create_result = create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        assert!(matches!(create_result, Err(create_err) if create_err == BLOG_LOCKED_ERROR));
        // Check if related runtime storage left unchanged
        assert!(post_storage_unchanged(FIRST_ID, FIRST_ID));
        // Event absence checked
        assert!(post_creation_event_failure(FIRST_ID, FIRST_ID))
    })
}

#[test]
fn post_creation_title_too_long() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        let create_result = create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::PostTitleInvalid);
        assert!(matches!(create_result, Err(create_err) if create_err == POST_TITLE_TOO_LONG));
        // Check if related runtime storage left unchanged
        assert!(post_storage_unchanged(FIRST_ID, FIRST_ID));
        // Event absence checked
        assert!(post_creation_event_failure(FIRST_ID, FIRST_ID))
    })
}

#[test]
fn post_creation_body_too_long() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        let create_result = create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::PostBodyInvalid);
        assert!(matches!(create_result, Err(create_err) if create_err == POST_BODY_TOO_LONG));
        // Check if related runtime storage left unchanged
        assert!(post_storage_unchanged(FIRST_ID, FIRST_ID));
        // Event absence checked
        assert!(post_creation_event_failure(FIRST_ID, FIRST_ID))
    })
}

#[test]
fn post_creation_limit_reached() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        loop {
            if let Err(create_post_err) = create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid)
            {
                assert_eq!(create_post_err, POSTS_LIMIT_REACHED);
                let posts_count = TestBlogModule::posts_count(FIRST_ID);
                // Post counter & post max number contraint equality checked
                assert_eq!(posts_count, PostsMaxNumber::get());
                // Last post creation, before limit reached, event absence checked
                assert!(post_creation_event_failure(FIRST_ID, posts_count));
                break;
            }
        }
    })
}

#[test]
fn post_locking_success() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        // Check default post locking status right after creation
        assert_eq!(TestBlogModule::post_locked((FIRST_ID, FIRST_ID)), false);
        assert_ok!(TestBlogModule::lock_post(
            Origin::signed(FIRST_OWNER_ORIGIN),
            FIRST_ID,
            FIRST_ID
        ));
        assert_eq!(TestBlogModule::post_locked((FIRST_ID, FIRST_ID)), true);
        let post_locked_event = TestEvent::test_events(RawEvent::PostLocked(FIRST_ID, FIRST_ID));
        // Event checked
        assert!(System::events()
            .iter()
            .any(|a| a.event == post_locked_event));
    })
}

#[test]
fn post_locking_owner_not_found() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        let lock_result =
            TestBlogModule::lock_post(Origin::signed(SECOND_OWNER_ORIGIN), FIRST_ID, FIRST_ID);
        // Remain unlocked
        assert_eq!(TestBlogModule::post_locked((FIRST_ID, FIRST_ID)), false);
        assert!(matches!(lock_result, Err(lock_err) if lock_err == BLOG_OWNER_NOT_FOUND));
        // Event absence checked
        assert!(post_locking_event_failure(FIRST_ID, FIRST_ID))
    })
}

#[test]
fn post_locking_post_not_found() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        let lock_result =
            TestBlogModule::lock_post(Origin::signed(FIRST_OWNER_ORIGIN), FIRST_ID, FIRST_ID);
        assert!(matches!(lock_result, Err(lock_err) if lock_err == POST_NOT_FOUND));
        // Event absence checked
        assert!(post_locking_event_failure(FIRST_ID, FIRST_ID))
    })
}

#[test]
fn post_locking_ownership_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        TestBlogModule::create_blog(Origin::signed(SECOND_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        let lock_result =
            TestBlogModule::lock_post(Origin::signed(SECOND_OWNER_ORIGIN), FIRST_ID, FIRST_ID);
        // Remain unlocked
        assert_eq!(TestBlogModule::post_locked((FIRST_ID, FIRST_ID)), false);
        assert!(matches!(lock_result, Err(lock_err) if lock_err == BLOG_OWNERSHIP_ERROR));
        // Event absence checked
        assert!(post_locking_event_failure(FIRST_ID, FIRST_ID))
    })
}

#[test]
fn post_unlocking_success() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        // Lock post firstly
        TestBlogModule::lock_post(Origin::signed(FIRST_OWNER_ORIGIN), FIRST_ID, FIRST_ID);
        assert_eq!(TestBlogModule::post_locked((FIRST_ID, FIRST_ID)), true);
        assert_ok!(TestBlogModule::unlock_post(
            Origin::signed(FIRST_OWNER_ORIGIN),
            FIRST_ID,
            FIRST_ID
        ));
        assert_eq!(TestBlogModule::post_locked((FIRST_ID, FIRST_ID)), false);
        let post_unlocked_event =
            TestEvent::test_events(RawEvent::PostUnlocked(FIRST_ID, FIRST_ID));
        // Event checked
        assert!(System::events()
            .iter()
            .any(|a| a.event == post_unlocked_event));
    })
}

#[test]
fn post_unlocking_owner_not_found() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        // Lock post firstly
        TestBlogModule::lock_post(Origin::signed(FIRST_OWNER_ORIGIN), FIRST_ID, FIRST_ID);
        let unlock_result =
            TestBlogModule::unlock_post(Origin::signed(SECOND_OWNER_ORIGIN), FIRST_ID, FIRST_ID);
        // Remain locked
        assert_eq!(TestBlogModule::post_locked((FIRST_ID, FIRST_ID)), true);
        assert!(matches!(unlock_result, Err(unlock_err) if unlock_err == BLOG_OWNER_NOT_FOUND));
        // Event absence checked
        assert!(post_unlocking_event_failure(FIRST_ID, FIRST_ID))
    })
}

#[test]
fn post_unlocking_post_not_found() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        // Try to unlock not existing post
        let unlock_result =
            TestBlogModule::unlock_post(Origin::signed(FIRST_OWNER_ORIGIN), FIRST_ID, FIRST_ID);
        assert!(matches!(unlock_result, Err(unlock_err) if unlock_err == POST_NOT_FOUND));
        // Event absence checked
        assert!(post_unlocking_event_failure(FIRST_ID, FIRST_ID))
    })
}

#[test]
fn post_unlocking_ownership_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        TestBlogModule::create_blog(Origin::signed(SECOND_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        let lock_result =
            TestBlogModule::lock_post(Origin::signed(SECOND_OWNER_ORIGIN), FIRST_ID, FIRST_ID);
        // Remain unlocked
        assert_eq!(TestBlogModule::post_locked((FIRST_ID, FIRST_ID)), false);
        assert!(matches!(lock_result, Err(lock_err) if lock_err == BLOG_OWNERSHIP_ERROR));
        // Event absence checked
        assert!(post_unlocking_event_failure(FIRST_ID, FIRST_ID))
    })
}

#[test]
fn post_editing_success() {
    ExtBuilder::default()
        .post_title_max_length(5)
        .post_body_max_length(10)
        .build()
        .execute_with(|| {
            // Create blog for future posts
            TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
            create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
            // TODO: Switch to text random length generator?
            let valid_title = generate_text((PostTitleMaxLength::get() - 1) as usize);
            let valid_body = generate_text((PostBodyMaxLength::get() - 1) as usize);
            assert_ok!(TestBlogModule::edit_post(
                Origin::signed(FIRST_OWNER_ORIGIN),
                FIRST_ID,
                FIRST_ID,
                Some(valid_title.clone()),
                Some(valid_body.clone()),
            ));
            // Post after editing checked
            let post = TestBlogModule::post_by_id((FIRST_ID, FIRST_ID));
            assert!(
                matches!(post, Some(post) if post.title == valid_title && post.body == valid_body)
            );
            // Event checked
            let post_edited_event =
                TestEvent::test_events(RawEvent::PostEdited(FIRST_ID, FIRST_ID));
            assert!(System::events()
                .iter()
                .any(|a| a.event == post_edited_event));
        })
}

#[test]
fn post_editing_owner_not_found() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        let edit_result = edit_post(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, PostType::Valid);
        // Remain unedited
        let post = TestBlogModule::post_by_id((FIRST_ID, FIRST_ID));
        assert!(matches!(edit_result, Err(edit_err) if edit_err == BLOG_OWNER_NOT_FOUND));
        // Compare with default unedited post
        assert!(matches!(post, Some(post) if post == get_post(PostType::Valid, false)));
        // Event absence checked
        assert!(post_editing_event_failure(FIRST_ID, FIRST_ID))
    })
}

#[test]
fn post_editing_post_not_found() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        // Try to unlock not existing post
        let edit_result = edit_post(FIRST_OWNER_ORIGIN, FIRST_ID, FIRST_ID, PostType::Valid);
        assert!(matches!(edit_result, Err(edit_err) if edit_err == POST_NOT_FOUND));
        // Event absence checked
        assert!(post_editing_event_failure(FIRST_ID, FIRST_ID))
    })
}

#[test]
fn post_editing_blog_locked_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        TestBlogModule::lock_blog(Origin::signed(FIRST_OWNER_ORIGIN), FIRST_ID);
        let edit_result = edit_post(FIRST_OWNER_ORIGIN, FIRST_ID, FIRST_ID, PostType::Valid);
        // Remain unedited
        let post = TestBlogModule::post_by_id((FIRST_ID, FIRST_ID));
        assert!(matches!(edit_result, Err(edit_err) if edit_err == BLOG_LOCKED_ERROR));
        // Compare with default unedited post
        assert!(matches!(post, Some(post) if post == get_post(PostType::Valid, false)));
        // Event absence checked
        assert!(post_editing_event_failure(FIRST_ID, FIRST_ID))
    })
}

#[test]
fn post_editing_post_locked_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        TestBlogModule::lock_post(Origin::signed(FIRST_OWNER_ORIGIN), FIRST_ID, FIRST_ID);
        let edit_result = edit_post(FIRST_OWNER_ORIGIN, FIRST_ID, FIRST_ID, PostType::Valid);
        // Remain unedited
        let post = TestBlogModule::post_by_id((FIRST_ID, FIRST_ID));
        assert!(matches!(edit_result, Err(edit_err) if edit_err == POST_LOCKED_ERROR));
        // Compare with default unedited post
        assert!(matches!(post, Some(post) if post == get_post(PostType::Valid, false)));
        // Event absence checked
        assert!(post_editing_event_failure(FIRST_ID, FIRST_ID))
    })
}

#[test]
fn post_editing_title_invalid_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        let edit_result = edit_post(
            FIRST_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            PostType::PostTitleInvalid,
        );
        // Remain unedited
        let post = TestBlogModule::post_by_id((FIRST_ID, FIRST_ID));
        assert!(matches!(edit_result, Err(edit_err) if edit_err == POST_TITLE_TOO_LONG));
        // Compare with default unedited post
        assert!(matches!(post, Some(post) if post == get_post(PostType::Valid, false)));
        // Event absence checked
        assert!(post_editing_event_failure(FIRST_ID, FIRST_ID))
    })
}

#[test]
fn post_editing_body_invalid_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        let edit_result = edit_post(
            FIRST_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            PostType::PostBodyInvalid,
        );
        // Remain unedited
        let post = TestBlogModule::post_by_id((FIRST_ID, FIRST_ID));
        assert!(matches!(edit_result, Err(edit_err) if edit_err == POST_BODY_TOO_LONG));
        // Compare with default unedited post
        assert!(matches!(post, Some(post) if post == get_post(PostType::Valid, false)));
        // Event absence checked
        assert!(post_editing_event_failure(FIRST_ID, FIRST_ID))
    })
}

#[test]
fn post_editing_ownership_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        TestBlogModule::create_blog(Origin::signed(SECOND_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        let edit_result = edit_post(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, PostType::Valid);
        // Remain unedited
        let post = TestBlogModule::post_by_id((FIRST_ID, FIRST_ID));
        assert!(matches!(edit_result, Err(edit_err) if edit_err == BLOG_OWNERSHIP_ERROR));
        // Compare with default unedited post
        assert!(matches!(post, Some(post) if post == get_post(PostType::Valid, false)));
        // Event absence checked
        assert!(post_editing_event_failure(FIRST_ID, FIRST_ID))
    })
}

// Replies
#[test]
fn reply_creation_success() {
    ExtBuilder::default()
        .build()
        .execute_with(|| {
            // Create blog for future posts
            TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
            create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
            let reply_owner_id = ensure_signed(Origin::signed(SECOND_OWNER_ORIGIN)).unwrap();
            assert_eq!(TestBlogModule::replies_count((FIRST_ID, FIRST_ID)), 0);
            assert_eq!(TestBlogModule::post_root_reply_ids((FIRST_ID, FIRST_ID)), None);
            assert_eq!(TestBlogModule::reply_ids_by_owner(reply_owner_id), None);
            assert_ok!(create_reply(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, None, ReplyType::Valid));
            // Replies storage updated succesfully
            let reply = TestBlogModule::reply_by_id((FIRST_ID, FIRST_ID, FIRST_ID));
            assert!(matches!(reply, Some(reply) if reply == get_reply(ReplyType::Valid, false)));
            assert_eq!(TestBlogModule::replies_count((FIRST_ID, FIRST_ID)), 1);
             // Check up all changes, related to given post id 
            let mut root_reply_ids_set = BTreeSet::new();
            root_reply_ids_set.insert(FIRST_ID);
            let mut reply_ids_by_owner_set = BTreeSet::new();
            reply_ids_by_owner_set.insert((FIRST_ID, FIRST_ID, FIRST_ID));
            let root_reply_ids = TestBlogModule::post_root_reply_ids((FIRST_ID, FIRST_ID));
            let reply_ids_by_owner = TestBlogModule::reply_ids_by_owner(reply_owner_id);
            assert!(matches!(root_reply_ids, Some(root_reply_ids) if root_reply_ids == root_reply_ids_set));
            assert!(matches!(reply_ids_by_owner, Some(reply_ids_by_owner) if reply_ids_by_owner ==  reply_ids_by_owner_set));
            // Event checked
            let reply_created_event =
                TestEvent::test_events(RawEvent::ReplyCreated(reply_owner_id, FIRST_ID, FIRST_ID, FIRST_ID));
            assert!(System::events()
                .iter()
                .any(|a| a.event == reply_created_event));
        })
}

#[test]
fn direct_reply_creation_success() {
    ExtBuilder::default()
        .build()
        .execute_with(|| {
            // Create blog for future posts
            TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
            create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
            let direct_reply_owner_id = ensure_signed(Origin::signed(SECOND_OWNER_ORIGIN)).unwrap();
            assert_eq!(TestBlogModule::replies_count((FIRST_ID, FIRST_ID)), 0);
            assert_eq!(TestBlogModule::post_child_reply_ids((FIRST_ID, FIRST_ID, FIRST_ID)), None);
            assert_eq!(TestBlogModule::reply_ids_by_owner(direct_reply_owner_id), None);
            // Create reply for direct replying
            assert_ok!(create_reply(FIRST_OWNER_ORIGIN, FIRST_ID, FIRST_ID, None, ReplyType::Valid));
            assert_ok!(create_reply(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, Some(FIRST_ID), ReplyType::Valid));
            // Replies storage updated succesfully
            let reply = TestBlogModule::reply_by_id((FIRST_ID, FIRST_ID, SECOND_ID));
            assert!(matches!(reply, Some(reply) if reply == get_reply(ReplyType::Valid, false)));
            assert_eq!(TestBlogModule::replies_count((FIRST_ID, FIRST_ID)), 2);
             // Check up all changes, related to given post id 
            let mut child_reply_ids_set = BTreeSet::new();
            child_reply_ids_set.insert(SECOND_ID);
            let mut reply_ids_by_owner_set = BTreeSet::new();
            let child_reply_ids = TestBlogModule::post_child_reply_ids((FIRST_ID, FIRST_ID, FIRST_ID));
            let reply_ids_by_owner = TestBlogModule::reply_ids_by_owner(direct_reply_owner_id);
            // Direct reply id
            reply_ids_by_owner_set.insert((FIRST_ID, FIRST_ID, SECOND_ID));
            assert!(matches!(child_reply_ids, Some(child_reply_ids) if child_reply_ids == child_reply_ids_set));
            assert!(matches!(reply_ids_by_owner, Some(reply_ids_by_owner) if reply_ids_by_owner == reply_ids_by_owner_set));
            // Event checked
            let direct_reply_created_event =
                TestEvent::test_events(RawEvent::DirectReplyCreated(direct_reply_owner_id, FIRST_ID, FIRST_ID, FIRST_ID, SECOND_ID));
            assert!(System::events()
                .iter()
                .any(|a| a.event == direct_reply_created_event));
        })
}

#[test]
fn reply_creation_blog_locked_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        TestBlogModule::lock_blog(Origin::signed(FIRST_OWNER_ORIGIN), FIRST_ID);
        let reply_creation_res= create_reply(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, None, ReplyType::Valid);
        assert!(matches!(reply_creation_res, Err(reply_creation_err) if reply_creation_err == BLOG_LOCKED_ERROR));
        // Check if related replies storage left unchanged
        assert!(replies_storage_unchanged(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID));
        // Event absence checked
        assert!(reply_creation_event_failure(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, FIRST_ID));
    })
}

#[test]
fn reply_creation_post_locked_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        TestBlogModule::lock_post(Origin::signed(FIRST_OWNER_ORIGIN), FIRST_ID, FIRST_ID);
        let reply_creation_result = create_reply(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, None, ReplyType::Valid);
        assert!(matches!(reply_creation_result, Err(reply_creation_err) if reply_creation_err == POST_LOCKED_ERROR));
        // Check if related replies storage left unchanged
        assert!(replies_storage_unchanged(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID));
        // Event absence checked
        assert!(reply_creation_event_failure(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, FIRST_ID));
    })
}

#[test]
fn reply_creation_text_too_long_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        let reply_creation_result = create_reply(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, None, ReplyType::Invalid);
        assert!(matches!(reply_creation_result, Err(reply_creation_err) if reply_creation_err == REPLY_TEXT_TOO_LONG));
        // Check if related replies storage left unchanged
        assert!(replies_storage_unchanged(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID));
        // Event absence checked
        assert!(reply_creation_event_failure(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, FIRST_ID));
    })
}

#[test]
fn reply_creation_post_not_found() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        let reply_creation_result = create_reply(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, None, ReplyType::Valid);
        assert!(matches!(reply_creation_result, Err(reply_creation_err) if reply_creation_err == POST_NOT_FOUND));
        // Check if related replies storage left unchanged
        assert!(replies_storage_unchanged(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID));
        // Event absence checked
        assert!(reply_creation_event_failure(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, FIRST_ID));
    })
}

#[test]
fn reply_creation_limit_reached() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        loop {
            if let Err(create_reply_err) = create_reply(
                FIRST_OWNER_ORIGIN,
                FIRST_ID,
                FIRST_ID,
                None,
                ReplyType::Valid,
            ) {
                assert_eq!(create_reply_err, REPLIES_LIMIT_REACHED);
                let replies_count = TestBlogModule::replies_count((FIRST_ID, FIRST_ID));
                // Reply counter & reply max number contraint equality checked
                assert_eq!(replies_count, RepliesMaxNumber::get());
                // Last reply creation, before limit reached, event absence checked
                assert!(reply_creation_event_failure(
                    FIRST_OWNER_ORIGIN,
                    FIRST_ID,
                    FIRST_ID,
                    replies_count
                ));
                break;
            }
        }
    })
}

#[test]
fn direct_reply_creation_reply_not_found() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        // Post for future replies
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        // Attempt to create direct reply for nonexistent reply
        let reply_creation_result = create_reply(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, Some(FIRST_ID), ReplyType::Valid);
        assert!(matches!(reply_creation_result, Err(reply_creation_err) if reply_creation_err == REPLY_NOT_FOUND));
        // Check if related direct replies storage left unchanged
        assert_eq!(TestBlogModule::post_child_reply_ids((FIRST_ID, FIRST_ID, FIRST_ID)), None);
        // Event absence checked
        assert!(reply_creation_event_failure(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, FIRST_ID));
    })
}

#[test]
fn direct_reply_creation_limit_reached() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
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
            if let Err(create_reply_err) = create_reply(
                FIRST_OWNER_ORIGIN,
                FIRST_ID,
                FIRST_ID,
                Some(FIRST_ID),
                ReplyType::Valid,
            ) {
                assert_eq!(create_reply_err, DIRECT_REPLIES_LIMIT_REACHED);
                let replies_count = TestBlogModule::replies_count((FIRST_ID, FIRST_ID));
                let direct_reply_ids =
                    TestBlogModule::post_child_reply_ids((FIRST_ID, FIRST_ID, FIRST_ID));
                // Direct reply counter & direct reply max number contraint equality checked
                if let Some(direct_reply_ids) = direct_reply_ids {
                    assert_eq!(
                        direct_reply_ids.len(),
                        DirectRepliesMaxNumber::get() as usize
                    );
                }
                // Last reply creation, before limit reached, event absence checked
                assert!(direct_reply_creation_event_failure(
                    FIRST_OWNER_ORIGIN,
                    FIRST_ID,
                    FIRST_ID,
                    FIRST_ID,
                    replies_count
                ));
                break;
            }
        }
    })
}

#[test]
fn reply_editing_success() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future replies
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        create_reply(
            SECOND_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            None,
            ReplyType::Valid,
        );
        edit_reply(
            SECOND_OWNER_ORIGIN,
            FIRST_ID,
            FIRST_ID,
            FIRST_ID,
            ReplyType::Valid,
        );
        // Reply after editing checked
        let reply = TestBlogModule::reply_by_id((FIRST_ID, FIRST_ID, FIRST_ID));
        assert!(matches!(reply, Some(reply) if reply == get_reply(ReplyType::Valid, true)));
        // Event checked
        let reply_edited_event =
            TestEvent::test_events(RawEvent::ReplyEdited(FIRST_ID, FIRST_ID, FIRST_ID));
        assert!(System::events()
            .iter()
            .any(|a| a.event == reply_edited_event));
    })
}

#[test]
fn reply_editing_blog_locked_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future replies
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        create_reply(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, None, ReplyType::Valid);
        TestBlogModule::lock_blog(Origin::signed(FIRST_OWNER_ORIGIN), FIRST_ID);
        let reply_editing_result = edit_reply(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, FIRST_ID, ReplyType::Valid);
        assert!(matches!(reply_editing_result, Err(reply_editing_err) if reply_editing_err == BLOG_LOCKED_ERROR));
        // Compare with default unedited reply
        let reply = TestBlogModule::reply_by_id((FIRST_ID, FIRST_ID, FIRST_ID));
        assert!(matches!(reply, Some(reply) if reply == get_reply(ReplyType::Valid, false)));
        // Event absence checked
        assert!(reply_editing_event_failure(FIRST_ID, FIRST_ID, FIRST_ID));
    })
}

#[test]
fn reply_editing_post_locked_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future replies
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        create_reply(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, None, ReplyType::Valid);
        TestBlogModule::lock_post(Origin::signed(FIRST_OWNER_ORIGIN), FIRST_ID, FIRST_ID);
        let reply_editing_result = edit_reply(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, FIRST_ID, ReplyType::Valid);
        assert!(matches!(reply_editing_result, Err(reply_editing_err) if reply_editing_err == POST_LOCKED_ERROR));
        // Compare with default unedited reply
        let reply = TestBlogModule::reply_by_id((FIRST_ID, FIRST_ID, FIRST_ID));
        assert!(matches!(reply, Some(reply) if reply == get_reply(ReplyType::Valid, false)));
        // Event absence checked
        assert!(reply_editing_event_failure(FIRST_ID, FIRST_ID, FIRST_ID));
    })
}

#[test]
fn reply_editing_not_found() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future replies
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        let reply_editing_result = edit_reply(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, FIRST_ID, ReplyType::Valid);
        assert!(matches!(reply_editing_result, Err(reply_editing_err) if reply_editing_err == REPLY_NOT_FOUND));
        // Event absence checked
        assert!(reply_editing_event_failure(FIRST_ID, FIRST_ID, FIRST_ID));
    })
}

#[test]
fn reply_editing_text_too_long_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future replies
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        create_reply(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, None, ReplyType::Valid);
        let reply_editing_result = edit_reply(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, FIRST_ID, ReplyType::Invalid);
        assert!(matches!(reply_editing_result, Err(reply_editing_err) if reply_editing_err == REPLY_TEXT_TOO_LONG));
        // Compare with default unedited reply
        let reply = TestBlogModule::reply_by_id((FIRST_ID, FIRST_ID, FIRST_ID));
        assert!(matches!(reply, Some(reply) if reply == get_reply(ReplyType::Valid, false)));
        // Event absence checked
        assert!(reply_editing_event_failure(FIRST_ID, FIRST_ID, FIRST_ID));
    })
}

#[test]
fn reply_editing_ownership_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future replies
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);
        create_reply(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, None, ReplyType::Valid);
        let reply_editing_result = edit_reply(FIRST_OWNER_ORIGIN, FIRST_ID, FIRST_ID, FIRST_ID, ReplyType::Valid);
        assert!(matches!(reply_editing_result, Err(reply_editing_err) if reply_editing_err == REPLY_OWNERSHIP_ERROR));
        // Compare with default unedited reply
        let reply = TestBlogModule::reply_by_id((FIRST_ID, FIRST_ID, FIRST_ID));
        assert!(matches!(reply, Some(reply) if reply == get_reply(ReplyType::Valid, false)));
        // Event absence checked
        assert!(reply_editing_event_failure(FIRST_ID, FIRST_ID, FIRST_ID));
    })
}

// TODO: Refactoring
fn post_storage_unchanged(
    blog_id: <Runtime as Trait>::BlogId,
    post_id: <Runtime as Trait>::PostId,
) -> bool {
    TestBlogModule::post_ids_by_blog_id(blog_id).is_none()
        && TestBlogModule::post_by_id((blog_id, post_id)).is_none()
        && TestBlogModule::posts_count(blog_id) == 0
}

fn replies_storage_unchanged(
    reply_owner_origin: u64,
    blog_id: <Runtime as Trait>::BlogId,
    post_id: <Runtime as Trait>::PostId,
) -> bool {
    let reply_owner_id = ensure_signed(Origin::signed(reply_owner_origin)).unwrap();
    TestBlogModule::post_root_reply_ids((blog_id, post_id)).is_none()
        && TestBlogModule::reply_ids_by_owner(reply_owner_id).is_none()
        && TestBlogModule::replies_count((blog_id, post_id)) == 0
}

fn blog_locking_event_failure(invalid_owner_origin: u64) -> bool {
    // Get invalid blog owner
    let invalid_owner_id = ensure_signed(Origin::signed(invalid_owner_origin)).unwrap();
    let blog_locked_event =
        TestEvent::test_events(RawEvent::BlogLocked(invalid_owner_id, FIRST_ID));
    System::events()
        .iter()
        .all(|a| a.event != blog_locked_event)
}

fn post_creation_event_failure(
    blog_id: <Runtime as Trait>::BlogId,
    post_id: <Runtime as Trait>::PostId,
) -> bool {
    let post_created_event = TestEvent::test_events(RawEvent::PostCreated(blog_id, post_id));
    System::events()
        .iter()
        .all(|a| a.event != post_created_event)
}

fn post_locking_event_failure(
    blog_id: <Runtime as Trait>::BlogId,
    post_id: <Runtime as Trait>::PostId,
) -> bool {
    let post_locked_event = TestEvent::test_events(RawEvent::PostLocked(blog_id, post_id));
    System::events()
        .iter()
        .all(|a| a.event != post_locked_event)
}

fn post_unlocking_event_failure(
    blog_id: <Runtime as Trait>::BlogId,
    post_id: <Runtime as Trait>::PostId,
) -> bool {
    let post_unlocked_event = TestEvent::test_events(RawEvent::PostUnlocked(blog_id, post_id));
    System::events()
        .iter()
        .all(|a| a.event != post_unlocked_event)
}

fn post_editing_event_failure(
    blog_id: <Runtime as Trait>::BlogId,
    post_id: <Runtime as Trait>::PostId,
) -> bool {
    let post_edited_event = TestEvent::test_events(RawEvent::PostEdited(blog_id, post_id));
    System::events()
        .iter()
        .all(|a| a.event != post_edited_event)
}

fn reply_creation_event_failure(
    invalid_owner_origin: u64,
    blog_id: <Runtime as Trait>::BlogId,
    post_id: <Runtime as Trait>::PostId,
    reply_id: <Runtime as Trait>::ReplyId,
) -> bool {
    let post_edited_event = TestEvent::test_events(RawEvent::ReplyCreated(
        invalid_owner_origin,
        blog_id,
        post_id,
        reply_id,
    ));
    System::events()
        .iter()
        .all(|a| a.event != post_edited_event)
}

fn direct_reply_creation_event_failure(
    invalid_owner_origin: u64,
    blog_id: <Runtime as Trait>::BlogId,
    post_id: <Runtime as Trait>::PostId,
    reply_id: <Runtime as Trait>::ReplyId,
    child_reply_id: <Runtime as Trait>::ReplyId,
) -> bool {
    let invalid_owner_id = ensure_signed(Origin::signed(invalid_owner_origin)).unwrap();
    let post_edited_event = TestEvent::test_events(RawEvent::DirectReplyCreated(
        invalid_owner_id,
        blog_id,
        post_id,
        reply_id,
        child_reply_id,
    ));
    System::events()
        .iter()
        .all(|a| a.event != post_edited_event)
}

fn reply_editing_event_failure(
    blog_id: <Runtime as Trait>::BlogId,
    post_id: <Runtime as Trait>::PostId,
    reply_id: <Runtime as Trait>::ReplyId,
) -> bool {
    let post_edited_event =
        TestEvent::test_events(RawEvent::ReplyEdited(blog_id, post_id, reply_id));
    System::events()
        .iter()
        .all(|a| a.event != post_edited_event)
}
