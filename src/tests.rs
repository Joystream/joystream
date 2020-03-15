#![cfg(test)]

use crate::mock::*;
use crate::*;
use srml_support::{assert_err, assert_ok};

//Blog, post or reply id
const FISRT_ID: u32 = 0;
const SECOND_ID: u32 = 1;

const FIRST_OWNER_ORIGIN: u64 = 1;
const SECOND_OWNER_ORIGIN: u64 = 2;

enum PostType {
    Valid,
    PostTitleInvalid,
    PostBodyInvalid,
}

fn get_post(post_type: PostType) -> Post {
    let (title, body);
    match post_type {
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

fn create_post(
    origin_id: u64,
    blog_id: <Runtime as Trait>::BlogId,
    post_type: PostType,
) -> Result<(), &'static str> {
    let post = get_post(post_type);
    TestBlogModule::create_post(Origin::signed(origin_id), blog_id, post.title, post.body)
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
        set.insert(FISRT_ID);
        let blog_id = TestBlogModule::blog_ids_by_owner(owner_id).unwrap();
        assert_eq!(blog_id, set);
        // Event checked
        let blog_created_event = TestEvent::test_events(RawEvent::BlogCreated(owner_id, FISRT_ID));
        assert!(System::events()
            .iter()
            .any(|a| a.event == blog_created_event));
    })
}

#[test]
fn blog_locking_success() {
    ExtBuilder::default().build().execute_with(|| {
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        // Default Locking status
        assert_eq!(is_locked, false);
        assert_ok!(TestBlogModule::lock_blog(
            Origin::signed(FIRST_OWNER_ORIGIN),
            FISRT_ID
        ));
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        assert_eq!(is_locked, true);
        let owner_id = ensure_signed(Origin::signed(FIRST_OWNER_ORIGIN)).unwrap();
        let blog_locked_event = TestEvent::test_events(RawEvent::BlogLocked(owner_id, FISRT_ID));
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
        let lock_result = TestBlogModule::lock_blog(Origin::signed(SECOND_OWNER_ORIGIN), FISRT_ID);
        assert!(matches!(lock_result, Err(lock_err) if lock_err == BLOG_OWNER_NOT_FOUND));
        // Remain unlocked
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
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
        let lock_result = TestBlogModule::lock_blog(Origin::signed(SECOND_OWNER_ORIGIN), FISRT_ID);
        assert!(matches!(lock_result, Err(lock_err) if lock_err == BLOG_OWNERSHIP_ERROR));
        // Remain unlocked
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        assert_eq!(is_locked, false);
        assert!(blog_locking_event_failure(SECOND_OWNER_ORIGIN));
    })
}

fn blog_locking_event_failure(invalid_owner_origin: u64) -> bool {
    // Get invalid blog owner
    let invalid_owner_id = ensure_signed(Origin::signed(invalid_owner_origin)).unwrap();
    let blog_locked_event =
        TestEvent::test_events(RawEvent::BlogLocked(invalid_owner_id, FISRT_ID));
    System::events()
        .iter()
        .all(|a| a.event != blog_locked_event)
}

#[test]
fn blog_unlocking_success() {
    ExtBuilder::default().build().execute_with(|| {
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        // Lock blog firstly, as default state after creation is unlocked
        TestBlogModule::lock_blog(Origin::signed(FIRST_OWNER_ORIGIN), FISRT_ID);
        assert_ok!(TestBlogModule::unlock_blog(
            Origin::signed(FIRST_OWNER_ORIGIN),
            FISRT_ID
        ));
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        assert_eq!(is_locked, false);
        let owner_id = ensure_signed(Origin::signed(FIRST_OWNER_ORIGIN)).unwrap();
        let blog_unlocked_event =
            TestEvent::test_events(RawEvent::BlogUnlocked(owner_id, FISRT_ID));
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
        TestBlogModule::lock_blog(Origin::signed(FIRST_OWNER_ORIGIN), FISRT_ID);
        // Non owner attemt to unlock blog
        let unlock_result =
            TestBlogModule::unlock_blog(Origin::signed(SECOND_OWNER_ORIGIN), FISRT_ID);
        assert!(matches!(unlock_result, Err(unlock_err) if unlock_err == BLOG_OWNER_NOT_FOUND));
        // Remain locked
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
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
        TestBlogModule::lock_blog(Origin::signed(FIRST_OWNER_ORIGIN), FISRT_ID);
        // Non owner attemt to unlock blog
        let unlock_result =
            TestBlogModule::unlock_blog(Origin::signed(SECOND_OWNER_ORIGIN), FISRT_ID);
        assert!(matches!(unlock_result, Err(unlock_err) if unlock_err == BLOG_OWNERSHIP_ERROR));
        // Remain locked
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        assert_eq!(is_locked, true);
        // Event absence checked
        assert!(blog_unlocking_event_failure(SECOND_OWNER_ORIGIN));
    })
}

fn blog_unlocking_event_failure(invalid_owner_origin: u64) -> bool {
    // Get invalid blog owner
    let invalid_owner_id = ensure_signed(Origin::signed(invalid_owner_origin)).unwrap();
    let blog_unlocked_event =
        TestEvent::test_events(RawEvent::BlogUnlocked(invalid_owner_id, FISRT_ID));
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
        assert_eq!(TestBlogModule::posts_count(FISRT_ID), 0);
        assert_ok!(create_post(FIRST_OWNER_ORIGIN, FISRT_ID, PostType::Valid));
        // Posts storage updated succesfully
        assert!(matches!(TestBlogModule::post_by_id((FISRT_ID, FISRT_ID)), Some(post) if post == get_post(PostType::Valid)));
        // Check up all changes, related to given post id 
        let mut set = BTreeSet::new();
        set.insert(FISRT_ID);
        let blog_id = TestBlogModule::post_ids_by_blog_id(FISRT_ID).unwrap();
        assert_eq!(blog_id, set);
        // Post counter updated succesfully
        assert_eq!(TestBlogModule::posts_count(FISRT_ID), 1);
        // Event checked
        let post_created_event = TestEvent::test_events(RawEvent::PostCreated(FISRT_ID, FISRT_ID));
        assert!(System::events()
            .iter()
            .any(|a| a.event == post_created_event));
    })
}

#[test]
fn post_creation_blog_owner_not_found() {
    ExtBuilder::default().build().execute_with(|| {
        let create_result = create_post(FIRST_OWNER_ORIGIN, FISRT_ID, PostType::Valid);
        assert!(matches!(create_result, Err(create_err) if create_err == BLOG_OWNER_NOT_FOUND));
        // Check if related runtime storage left unchanged
        assert!(post_storage_unchanged(FISRT_ID, FISRT_ID));
        // Event absence checked
        assert!(post_creation_event_failure(FISRT_ID, FISRT_ID))
    })
}

#[test]
fn post_creation_blog_ownership_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        // Create another blog, using second owner origin
        TestBlogModule::create_blog(Origin::signed(SECOND_OWNER_ORIGIN));
        let create_result = create_post(SECOND_OWNER_ORIGIN, FISRT_ID, PostType::Valid);
        assert!(matches!(create_result, Err(create_err) if create_err == BLOG_OWNERSHIP_ERROR));
        // Check if related runtime storage left unchanged
        assert!(post_storage_unchanged(FISRT_ID, FISRT_ID));
        // Event absence checked
        assert!(post_creation_event_failure(FISRT_ID, FISRT_ID))
    })
}

#[test]
fn post_creation_blog_locked_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        TestBlogModule::lock_blog(Origin::signed(FIRST_OWNER_ORIGIN), FISRT_ID);
        let create_result = create_post(FIRST_OWNER_ORIGIN, FISRT_ID, PostType::Valid);
        assert!(matches!(create_result, Err(create_err) if create_err == BLOG_LOCKED_ERROR));
        // Check if related runtime storage left unchanged
        assert!(post_storage_unchanged(FISRT_ID, FISRT_ID));
        // Event absence checked
        assert!(post_creation_event_failure(FISRT_ID, FISRT_ID))
    })
}

#[test]
fn post_creation_title_too_long() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        let create_result = create_post(FIRST_OWNER_ORIGIN, FISRT_ID, PostType::PostTitleInvalid);
        assert!(matches!(create_result, Err(create_err) if create_err == POST_TITLE_TOO_LONG));
        // Check if related runtime storage left unchanged
        assert!(post_storage_unchanged(FISRT_ID, FISRT_ID));
        // Event absence checked
        assert!(post_creation_event_failure(FISRT_ID, FISRT_ID))
    })
}

#[test]
fn post_creation_body_too_long() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        let create_result = create_post(FIRST_OWNER_ORIGIN, FISRT_ID, PostType::PostBodyInvalid);
        assert!(matches!(create_result, Err(create_err) if create_err == POST_BODY_TOO_LONG));
        // Check if related runtime storage left unchanged
        assert!(post_storage_unchanged(FISRT_ID, FISRT_ID));
        // Event absence checked
        assert!(post_creation_event_failure(FISRT_ID, FISRT_ID))
    })
}

#[test]
fn post_locking_success() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FISRT_ID, PostType::Valid);
        // Check default post locking status right after creation
        assert_eq!(TestBlogModule::post_locked((FISRT_ID, FISRT_ID)), false);
        assert_ok!(TestBlogModule::lock_post(
            Origin::signed(FIRST_OWNER_ORIGIN),
            FISRT_ID,
            FISRT_ID
        ));
        assert_eq!(TestBlogModule::post_locked((FISRT_ID, FISRT_ID)), true);
        let post_locked_event = TestEvent::test_events(RawEvent::PostLocked(FISRT_ID, FISRT_ID));
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
        create_post(FIRST_OWNER_ORIGIN, FISRT_ID, PostType::Valid);
        let lock_result =
            TestBlogModule::lock_post(Origin::signed(SECOND_OWNER_ORIGIN), FISRT_ID, FISRT_ID);
        // Remain unlocked
        assert_eq!(TestBlogModule::post_locked((FISRT_ID, FISRT_ID)), false);
        assert!(matches!(lock_result, Err(create_err) if create_err == BLOG_OWNER_NOT_FOUND));
        // Event absence checked
        assert!(post_locking_event_failure(FISRT_ID, FISRT_ID))
    })
}

#[test]
fn post_locking_post_not_found() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        let lock_result =
            TestBlogModule::lock_post(Origin::signed(FIRST_OWNER_ORIGIN), FISRT_ID, FISRT_ID);
        assert!(matches!(lock_result, Err(create_err) if create_err == POST_NOT_FOUND));
        // Event absence checked
        assert!(post_locking_event_failure(FISRT_ID, FISRT_ID))
    })
}

#[test]
fn post_locking_ownership_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        TestBlogModule::create_blog(Origin::signed(SECOND_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FISRT_ID, PostType::Valid);
        let lock_result =
            TestBlogModule::lock_post(Origin::signed(SECOND_OWNER_ORIGIN), FISRT_ID, FISRT_ID);
        // Remain unlocked
        assert_eq!(TestBlogModule::post_locked((FISRT_ID, FISRT_ID)), false);
        assert!(matches!(lock_result, Err(create_err) if create_err == BLOG_OWNERSHIP_ERROR));
        // Event absence checked
        assert!(post_locking_event_failure(FISRT_ID, FISRT_ID))
    })
}

#[test]
fn post_unlocking_success() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FISRT_ID, PostType::Valid);
        // Lock post firstly
        TestBlogModule::lock_post(Origin::signed(FIRST_OWNER_ORIGIN), FISRT_ID, FISRT_ID);
        assert_eq!(TestBlogModule::post_locked((FISRT_ID, FISRT_ID)), true);
        assert_ok!(TestBlogModule::unlock_post(
            Origin::signed(FIRST_OWNER_ORIGIN),
            FISRT_ID,
            FISRT_ID
        ));
        assert_eq!(TestBlogModule::post_locked((FISRT_ID, FISRT_ID)), false);
        let post_unlocked_event =
            TestEvent::test_events(RawEvent::PostUnlocked(FISRT_ID, FISRT_ID));
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
        create_post(FIRST_OWNER_ORIGIN, FISRT_ID, PostType::Valid);
        // Lock post firstly
        TestBlogModule::lock_post(Origin::signed(FIRST_OWNER_ORIGIN), FISRT_ID, FISRT_ID);
        let unlock_result =
            TestBlogModule::unlock_post(Origin::signed(SECOND_OWNER_ORIGIN), FISRT_ID, FISRT_ID);
        // Remain locked
        assert_eq!(TestBlogModule::post_locked((FISRT_ID, FISRT_ID)), true);
        assert!(matches!(unlock_result, Err(create_err) if create_err == BLOG_OWNER_NOT_FOUND));
        // Event absence checked
        assert!(post_unlocking_event_failure(FISRT_ID, FISRT_ID))
    })
}

#[test]
fn post_unlocking_post_not_found() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        // Try to unlock not existing post
        let unlock_result =
            TestBlogModule::unlock_post(Origin::signed(FIRST_OWNER_ORIGIN), FISRT_ID, FISRT_ID);
        assert!(matches!(unlock_result, Err(unlock_err) if unlock_err == POST_NOT_FOUND));
        // Event absence checked
        assert!(post_unlocking_event_failure(FISRT_ID, FISRT_ID))
    })
}

#[test]
fn post_unlocking_ownership_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        TestBlogModule::create_blog(Origin::signed(SECOND_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FISRT_ID, PostType::Valid);
        let lock_result =
            TestBlogModule::lock_post(Origin::signed(SECOND_OWNER_ORIGIN), FISRT_ID, FISRT_ID);
        // Remain unlocked
        assert_eq!(TestBlogModule::post_locked((FISRT_ID, FISRT_ID)), false);
        assert!(matches!(lock_result, Err(create_err) if create_err == BLOG_OWNERSHIP_ERROR));
        // Event absence checked
        assert!(post_unlocking_event_failure(FISRT_ID, FISRT_ID))
    })
}

#[test]
fn post_editing_success() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        create_post(FIRST_OWNER_ORIGIN, FISRT_ID, PostType::Valid);
        let valid_title = generate_text(PostTitleMaxLength::get() as usize);
        assert_ok!(TestBlogModule::edit_post(
            Origin::signed(FIRST_OWNER_ORIGIN),
            FISRT_ID,
            FISRT_ID,
            Some(valid_title),
            None,
        ));
        // Event checked
        let post_edited_event = TestEvent::test_events(RawEvent::PostEdited(FISRT_ID, FISRT_ID));
        assert!(System::events()
            .iter()
            .any(|a| a.event == post_edited_event));
    })
}

fn post_storage_unchanged(
    blog_id: <Runtime as Trait>::BlogId,
    post_id: <Runtime as Trait>::PostId,
) -> bool {
    TestBlogModule::post_ids_by_blog_id(blog_id).is_none()
        && TestBlogModule::post_by_id((blog_id, post_id)).is_none()
        && TestBlogModule::posts_count(blog_id) == 0
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
