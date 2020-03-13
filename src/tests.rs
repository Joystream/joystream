#![cfg(test)]

use crate::mock::*;
use crate::*;
use srml_support::{assert_err, assert_ok};

//Blog, post or reply id
const FISRT_ID: u32 = 0;
const FIRST_OWNER_ORIGIN: u64 = 1;
const SECOND_OWNER_ORIGIN: u64 = 2;

#[test]
fn blog_creation() {
    ExtBuilder::default().build().execute_with(|| {
        assert_ok!(TestBlogModule::create_blog(Origin::signed(
            FIRST_OWNER_ORIGIN
        )));
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
        TestBlogModule::lock_blog(Origin::signed(FIRST_OWNER_ORIGIN), FISRT_ID);
        let owner_id = ensure_signed(Origin::signed(FIRST_OWNER_ORIGIN)).unwrap();
        let blog_locked_event = TestEvent::test_events(RawEvent::BlogLocked(owner_id, FISRT_ID));
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        assert_eq!(is_locked, true);
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
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        // Default Locking status
        assert_eq!(is_locked, false);
        // Non owner attemt to lock blog
        let lock_result = TestBlogModule::lock_blog(Origin::signed(SECOND_OWNER_ORIGIN), FISRT_ID);
        assert!(matches!(lock_result, Err(lock_err) if lock_err == BLOG_OWNER_NOT_FOUND));
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        assert_eq!(is_locked, false);
        blog_locking_events_failure();
    })
}

#[test]
fn blog_locking_ownership_error() {
    ExtBuilder::default().build().execute_with(|| {
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        // Create another blog, using second owner origin
        TestBlogModule::create_blog(Origin::signed(SECOND_OWNER_ORIGIN));
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        assert_eq!(is_locked, false);
        // Non owner attemt to lock blog
        let lock_result = TestBlogModule::lock_blog(Origin::signed(SECOND_OWNER_ORIGIN), FISRT_ID);
        assert!(matches!(lock_result, Err(lock_err) if lock_err == BLOG_OWNERSHIP_ERROR));
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        assert_eq!(is_locked, false);
        blog_locking_events_failure();
    })
}

fn blog_locking_events_failure() {
    let owner_id = ensure_signed(Origin::signed(FIRST_OWNER_ORIGIN)).unwrap();
    // Get invalid blog owner
    let invalid_owner_id = ensure_signed(Origin::signed(SECOND_OWNER_ORIGIN)).unwrap();
    let blog_locked_event = TestEvent::test_events(RawEvent::BlogLocked(owner_id, FISRT_ID));
    let blog_locked_event_invalid =
        TestEvent::test_events(RawEvent::BlogLocked(invalid_owner_id, FISRT_ID));
    assert!(System::events()
        .iter()
        .all(|a| a.event != blog_locked_event));
    assert!(System::events()
        .iter()
        .all(|a| a.event != blog_locked_event_invalid));
}

#[test]
fn blog_unlocking_success() {
    ExtBuilder::default().build().execute_with(|| {
        TestBlogModule::create_blog(Origin::signed(FIRST_OWNER_ORIGIN));
        // Lock blog firstly, as default state after creation is unlocked
        TestBlogModule::lock_blog(Origin::signed(FIRST_OWNER_ORIGIN), FISRT_ID);
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        assert_eq!(is_locked, true);
        TestBlogModule::unlock_blog(Origin::signed(FIRST_OWNER_ORIGIN), FISRT_ID);
        let owner_id = ensure_signed(Origin::signed(FIRST_OWNER_ORIGIN)).unwrap();
        let blog_unlocked_event =
            TestEvent::test_events(RawEvent::BlogUnlocked(owner_id, FISRT_ID));
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        assert_eq!(is_locked, false);
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
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        assert_eq!(is_locked, true);
        // Non owner attemt to unlock blog
        let unlock_result =
            TestBlogModule::unlock_blog(Origin::signed(SECOND_OWNER_ORIGIN), FISRT_ID);
        assert!(matches!(unlock_result, Err(unlock_err) if unlock_err == BLOG_OWNER_NOT_FOUND));
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        assert_eq!(is_locked, true);
        blog_unlocking_events_failure();
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
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        assert_eq!(is_locked, true);
        // Non owner attemt to unlock blog
        let unlock_result =
            TestBlogModule::unlock_blog(Origin::signed(SECOND_OWNER_ORIGIN), FISRT_ID);
        assert!(matches!(unlock_result, Err(unlock_err) if unlock_err == BLOG_OWNERSHIP_ERROR));
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        assert_eq!(is_locked, true);
        blog_unlocking_events_failure();
    })
}

fn blog_unlocking_events_failure() {
    let owner_id = ensure_signed(Origin::signed(FIRST_OWNER_ORIGIN)).unwrap();
    // Get invalid blog owner
    let invalid_owner_id = ensure_signed(Origin::signed(SECOND_OWNER_ORIGIN)).unwrap();
    let blog_unlocked_event = TestEvent::test_events(RawEvent::BlogUnlocked(owner_id, FISRT_ID));
    let blog_unlocked_event_invalid =
        TestEvent::test_events(RawEvent::BlogUnlocked(invalid_owner_id, FISRT_ID));
    assert!(System::events()
        .iter()
        .all(|a| a.event != blog_unlocked_event));
    assert!(System::events()
        .iter()
        .all(|a| a.event != blog_unlocked_event_invalid));
}
