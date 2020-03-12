#![cfg(test)]

use crate::mock::*;
use crate::*;
use srml_support::{assert_err, assert_ok};

//Blog, post or reply id
const FISRT_ID: u32 = 0;
const OWNER_ORIGIN: u64 = 1;
const INVALID_OWNER_ORIGIN: u64 = 2;

#[test]
fn blog_creation() {
    ExtBuilder::default().build().execute_with(|| {
        TestBlogModule::create_blog(Origin::signed(OWNER_ORIGIN));
        let owner_id = ensure_signed(Origin::signed(OWNER_ORIGIN)).unwrap();
        let blog_created_event = TestEvent::test_events(RawEvent::BlogCreated(owner_id, FISRT_ID));
        let mut set = BTreeSet::new();
        set.insert(FISRT_ID);
        let blog_id = TestBlogModule::blog_ids_by_owner(owner_id).unwrap();
        assert!(blog_id == set);
        assert!(System::events()
            .iter()
            .any(|a| a.event == blog_created_event));
    })
}

#[test]
fn blog_locking_success() {
    ExtBuilder::default().build().execute_with(|| {
        TestBlogModule::create_blog(Origin::signed(OWNER_ORIGIN));
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        assert!(is_locked == false);
        TestBlogModule::lock_blog(Origin::signed(OWNER_ORIGIN), FISRT_ID);
        let owner_id = ensure_signed(Origin::signed(OWNER_ORIGIN)).unwrap();
        let blog_locked_event = TestEvent::test_events(RawEvent::BlogLocked(owner_id, FISRT_ID));
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        assert!(is_locked == true);
        assert!(System::events()
            .iter()
            .any(|a| a.event == blog_locked_event));
    })
}

#[test]
fn blog_locking_failure() {
    ExtBuilder::default().build().execute_with(|| {
        TestBlogModule::create_blog(Origin::signed(1));
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        assert!(is_locked == false);
        // Non owner attemt to lock blog
        TestBlogModule::lock_blog(Origin::signed(INVALID_OWNER_ORIGIN), FISRT_ID);
        let owner_id = ensure_signed(Origin::signed(OWNER_ORIGIN)).unwrap();
        // Get invalid blog owner 
        let invalid_owner_id = ensure_signed(Origin::signed(INVALID_OWNER_ORIGIN)).unwrap();
        let blog_locked_event = TestEvent::test_events(RawEvent::BlogLocked(owner_id, FISRT_ID));
        let blog_locked_event_invalid = TestEvent::test_events(RawEvent::BlogLocked(invalid_owner_id, FISRT_ID));
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        assert!(is_locked == false);
        assert!(System::events()
            .iter()
            .all(|a| a.event != blog_locked_event));
        assert!(System::events()
            .iter()
            .all(|a| a.event != blog_locked_event_invalid));
    })
}

#[test]
fn blog_unlocking_success() {
    ExtBuilder::default().build().execute_with(|| {
        TestBlogModule::create_blog(Origin::signed(OWNER_ORIGIN));
        // Lock blog first, as default state after creation is unlocked
        TestBlogModule::lock_blog(Origin::signed(OWNER_ORIGIN), FISRT_ID);
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        assert!(is_locked == true);
        TestBlogModule::unlock_blog(Origin::signed(OWNER_ORIGIN), FISRT_ID);
        let owner_id = ensure_signed(Origin::signed(OWNER_ORIGIN)).unwrap();
        let blog_unlocked_event = TestEvent::test_events(RawEvent::BlogUnlocked(owner_id, FISRT_ID));
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        assert!(is_locked == false);
        assert!(System::events()
            .iter()
            .any(|a| a.event == blog_unlocked_event));
    })
}

#[test]
fn blog_unlocking_failure() {
    ExtBuilder::default().build().execute_with(|| {
        TestBlogModule::create_blog(Origin::signed(1));
        // Lock blog first, as default state after creation is unlocked
        TestBlogModule::lock_blog(Origin::signed(OWNER_ORIGIN), FISRT_ID);
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        assert!(is_locked == true);
        // Non owner attemt to unlock blog
        TestBlogModule::unlock_blog(Origin::signed(INVALID_OWNER_ORIGIN), FISRT_ID);
        let owner_id = ensure_signed(Origin::signed(OWNER_ORIGIN)).unwrap();
        // Get invalid blog owner 
        let invalid_owner_id = ensure_signed(Origin::signed(INVALID_OWNER_ORIGIN)).unwrap();
        let blog_unlocked_event = TestEvent::test_events(RawEvent::BlogUnlocked(owner_id, FISRT_ID));
        let blog_unlocked_event_invalid = TestEvent::test_events(RawEvent::BlogUnlocked(invalid_owner_id, FISRT_ID));
        let is_locked = TestBlogModule::blog_locked(FISRT_ID);
        assert!(is_locked == true);
        assert!(System::events()
            .iter()
            .all(|a| a.event != blog_unlocked_event));
        assert!(System::events()
            .iter()
            .all(|a| a.event != blog_unlocked_event_invalid));
    })
}
