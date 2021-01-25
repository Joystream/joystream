#![cfg(test)]

use crate::mock::*;
use crate::*;
use frame_support::assert_ok;
use frame_system::ensure_signed;

//Blog, post or reply id
const FIRST_ID: u64 = 0;
const SECOND_ID: u64 = 1;

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
    call_result: DispatchResult,
    expected_error: errors::Error<Runtime, DefaultInstance>,
    number_of_events_before_call: usize,
) {
    // Ensure  call result is equal to expected error
    assert_eq!(
        call_result,
        sp_std::result::Result::Err(expected_error.into())
    );

    // Ensure  no other events emitted after call
    assert_eq!(System::events().len(), number_of_events_before_call);
}

fn ensure_replies_equality(
    reply: Option<Reply<Runtime, DefaultInstance>>,
    reply_owner_id: <Runtime as frame_system::Trait>::AccountId,
    parent: ParentId<Runtime, DefaultInstance>,
    editing: bool,
) {
    // Ensure  stored reply is equal to expected one
    assert!(matches!(
        reply,
        Some(reply) if reply == get_reply(ReplyType::Valid, reply_owner_id, parent, editing)
    ));
}

fn ensure_posts_equality(
    post: Option<Post<Runtime, DefaultInstance>>,
    editing: bool,
    locked: bool,
) {
    // Ensure  stored post is equal to expected one
    assert!(matches!(
        post,
        Some(post) if post == get_post(PostType::Valid, editing, locked)
    ));
}

fn ensure_reaction_status(
    reactions: Option<[bool; REACTIONS_MAX_NUMBER as usize]>,
    index: ReactionsNumber,
    status: bool,
) {
    // Ensure  reaction status at given index is equal to expected one
    assert!(matches!(
        reactions,
        Some(reactions) if reactions[index as usize] == status
    ));
}

// Posts
#[test]
fn post_creation_success() {
    ExtBuilder::default().build().execute_with(|| {
        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Create post
        assert_ok!(create_post(FIRST_OWNER_ORIGIN, PostType::Valid));

        // Check related state after extrinsic performed

        // Posts storage updated succesfully
        let post = post_by_id(FIRST_ID);

        ensure_posts_equality(post, false, false);

        // Post counter, related to given blog updated succesfully
        assert_eq!(post_count(), 1);

        // Event checked
        let post_created_event = get_test_event(RawEvent::PostCreated(FIRST_ID));
        assert_event_success(post_created_event, number_of_events_before_call + 1)
    })
}

#[test]
fn post_creation_blog_ownership_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let create_result = create_post(SECOND_OWNER_ORIGIN, PostType::Valid);

        // Check if related runtime storage left unchanged
        // assert!(post_storage_unchanged(FIRST_ID, FIRST_ID));

        // Failure checked
        assert_failure(
            create_result,
            Error::BlogOwnershipError,
            number_of_events_before_call,
        );
    })
}

#[test]
fn post_creation_title_too_long() {
    ExtBuilder::default().build().execute_with(|| {
        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let create_result = create_post(FIRST_OWNER_ORIGIN, PostType::PostTitleInvalid);

        // Check if related runtime storage left unchanged
        //assert!(post_storage_unchanged(FIRST_ID, FIRST_ID));

        // Failure checked
        assert_failure(
            create_result,
            Error::PostTitleTooLong,
            number_of_events_before_call,
        );
    })
}

#[test]
fn post_creation_body_too_long() {
    ExtBuilder::default().build().execute_with(|| {
        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let create_result = create_post(FIRST_OWNER_ORIGIN, PostType::PostBodyInvalid);

        // Check if related runtime storage left unchanged
        //assert!(post_storage_unchanged(FIRST_ID, FIRST_ID));

        // Failure checked
        assert_failure(
            create_result,
            Error::PostBodyTooLong,
            number_of_events_before_call,
        );
    })
}

#[test]
fn post_creation_limit_reached() {
    ExtBuilder::default().build().execute_with(|| {
        loop {
            // Events number before tested call
            let number_of_events_before_call = System::events().len();

            if let Err(create_post_err) = create_post(FIRST_OWNER_ORIGIN, PostType::Valid) {
                // Post counter & post max number contraint equality checked
                assert_eq!(post_count(), PostsMaxNumber::get());

                // Last post creation, before limit reached, failure checked
                assert_failure(
                    Err(create_post_err),
                    Error::PostLimitReached,
                    number_of_events_before_call,
                );
                break;
            }
        }
    })
}

#[test]
fn post_locking_success() {
    ExtBuilder::default().build().execute_with(|| {
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();

        let post = post_by_id(FIRST_ID).unwrap();

        // Check default post locking status right after creation
        assert_eq!(post.is_locked(), false);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        assert_ok!(lock_post(FIRST_OWNER_ORIGIN, FIRST_ID));

        // Check related state after extrinsic performed

        let post = post_by_id(FIRST_ID).unwrap();

        assert_eq!(post.is_locked(), true);

        let post_locked_event = get_test_event(RawEvent::PostLocked(FIRST_ID));

        // Event checked
        assert_event_success(post_locked_event, number_of_events_before_call + 1)
    })
}

#[test]
fn post_locking_post_not_found() {
    ExtBuilder::default().build().execute_with(|| {
        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let lock_result = lock_post(FIRST_OWNER_ORIGIN, FIRST_ID);

        // Failure checked
        assert_failure(
            lock_result,
            Error::PostNotFound,
            number_of_events_before_call,
        );
    })
}

#[test]
fn post_locking_ownership_error() {
    ExtBuilder::default().build().execute_with(|| {
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let lock_result = lock_post(SECOND_OWNER_ORIGIN, FIRST_ID);

        // Check related state after extrinsic performed

        let post = post_by_id(FIRST_ID).unwrap();

        // Remain unlocked
        assert_eq!(post.is_locked(), false);

        // Failure checked
        assert_failure(
            lock_result,
            Error::BlogOwnershipError,
            number_of_events_before_call,
        );
    })
}

#[test]
fn post_unlocking_success() {
    ExtBuilder::default().build().execute_with(|| {
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();

        // Lock post firstly
        lock_post(FIRST_OWNER_ORIGIN, FIRST_ID).unwrap();

        // Check related state before extrinsic performed
        let post = post_by_id(FIRST_ID).unwrap();

        assert_eq!(post.is_locked(), true);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        assert_ok!(unlock_post(FIRST_OWNER_ORIGIN, FIRST_ID));

        // Check related state after extrinsic performed
        let post = post_by_id(FIRST_ID).unwrap();

        assert_eq!(post.is_locked(), false);

        let post_unlocked_event = get_test_event(RawEvent::PostUnlocked(FIRST_ID));

        // Event checked
        assert_event_success(post_unlocked_event, number_of_events_before_call + 1)
    })
}

#[test]
fn post_unlocking_owner_not_found() {
    ExtBuilder::default().build().execute_with(|| {
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();

        // Lock post firstly
        lock_post(FIRST_OWNER_ORIGIN, FIRST_ID).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let unlock_result = unlock_post(SECOND_OWNER_ORIGIN, FIRST_ID);

        // Check related state after extrinsic performed
        let post = post_by_id(FIRST_ID).unwrap();

        // Remain locked
        assert_eq!(post.is_locked(), true);

        // Failure checked
        assert_failure(
            unlock_result,
            Error::BlogOwnershipError,
            number_of_events_before_call,
        );
    })
}

#[test]
fn post_unlocking_post_not_found() {
    ExtBuilder::default().build().execute_with(|| {
        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Try to unlock not existing post
        let unlock_result = unlock_post(FIRST_OWNER_ORIGIN, FIRST_ID);

        // Failure checked
        assert_failure(
            unlock_result,
            Error::PostNotFound,
            number_of_events_before_call,
        );
    })
}

#[test]
fn post_unlocking_ownership_error() {
    ExtBuilder::default().build().execute_with(|| {
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();

        // Lock post firstly
        lock_post(FIRST_OWNER_ORIGIN, FIRST_ID).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let unlock_result = unlock_post(SECOND_OWNER_ORIGIN, FIRST_ID);

        // Check related state after extrinsic performed
        let post = post_by_id(FIRST_ID).unwrap();

        // Remain locked
        assert_eq!(post.is_locked(), true);

        // Failure checked
        assert_failure(
            unlock_result,
            Error::BlogOwnershipError,
            number_of_events_before_call,
        );
    })
}

#[test]
fn post_editing_success() {
    ExtBuilder::default().build().execute_with(|| {
        // Create blog for future posts
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        assert_ok!(edit_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid));

        // Post after editing checked
        let post_after_editing = post_by_id(FIRST_ID);

        ensure_posts_equality(post_after_editing, true, false);

        let post_edited_event = TestEvent::crate_DefaultInstance(RawEvent::PostEdited(FIRST_ID));

        // Event checked
        assert_event_success(post_edited_event, number_of_events_before_call + 1)
    })
}

#[test]
fn post_editing_ownership_error() {
    ExtBuilder::default().build().execute_with(|| {
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let edit_result = edit_post(SECOND_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Remain unedited
        let post = post_by_id(FIRST_ID);

        // Compare with default unedited post
        ensure_posts_equality(post, false, false);

        // Failure checked
        assert_failure(
            edit_result,
            Error::BlogOwnershipError,
            number_of_events_before_call,
        );
    })
}

#[test]
fn post_editing_post_not_found() {
    ExtBuilder::default().build().execute_with(|| {
        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Try to unlock not existing post
        let edit_result = edit_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Failure checked
        assert_failure(
            edit_result,
            Error::PostNotFound,
            number_of_events_before_call,
        );
    })
}

#[test]
fn post_editing_post_locked_error() {
    ExtBuilder::default().build().execute_with(|| {
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();

        // Lock post to make all related data immutable
        lock_post(FIRST_OWNER_ORIGIN, FIRST_ID).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let edit_result = edit_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::Valid);

        // Remain unedited
        let post = post_by_id(FIRST_ID);

        // Compare with default unedited locked post
        ensure_posts_equality(post, false, true);

        // Failure checked
        assert_failure(
            edit_result,
            Error::PostLockedError,
            number_of_events_before_call,
        );
    })
}

#[test]
fn post_editing_title_invalid_error() {
    ExtBuilder::default().build().execute_with(|| {
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let edit_result = edit_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::PostTitleInvalid);

        // Remain unedited
        let post = post_by_id(FIRST_ID);

        // Compare with default unedited post
        ensure_posts_equality(post, false, false);

        // Failure checked
        assert_failure(
            edit_result,
            Error::PostTitleTooLong,
            number_of_events_before_call,
        );
    })
}

#[test]
fn post_editing_body_invalid_error() {
    ExtBuilder::default().build().execute_with(|| {
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let edit_result = edit_post(FIRST_OWNER_ORIGIN, FIRST_ID, PostType::PostBodyInvalid);

        // Remain unedited
        let post = post_by_id(FIRST_ID);

        // Compare with default unedited post
        ensure_posts_equality(post, false, false);

        // Failure checked
        assert_failure(
            edit_result,
            Error::PostBodyTooLong,
            number_of_events_before_call,
        );
    })
}

// Replies
#[test]
fn reply_creation_success() {
    ExtBuilder::default().build().execute_with(|| {
        // Create post for future replies
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();

        let reply_owner_id = ensure_signed(Origin::signed(SECOND_OWNER_ORIGIN)).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        assert_ok!(create_reply(
            SECOND_OWNER_ORIGIN,
            FIRST_ID,
            None,
            ReplyType::Valid
        ));

        // Check reply related state after extrinsic performed

        let post = post_by_id(FIRST_ID).unwrap();

        // Replies related storage updated succesfully
        let reply = reply_by_id(FIRST_ID, FIRST_ID);

        ensure_replies_equality(reply, reply_owner_id, ParentId::Post(FIRST_ID), false);

        // Overall post replies count
        assert_eq!(post.replies_count(), 1);

        // Root replies counter updated
        assert_eq!(post.replies_count(), 1);

        // Event checked
        let reply_created_event =
            get_test_event(RawEvent::ReplyCreated(reply_owner_id, FIRST_ID, FIRST_ID));
        assert_event_success(reply_created_event, number_of_events_before_call + 1)
    })
}

#[test]
fn direct_reply_creation_success() {
    ExtBuilder::default().build().execute_with(|| {
        // Create post for future replies
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();
        let direct_reply_owner_id = ensure_signed(Origin::signed(SECOND_OWNER_ORIGIN)).unwrap();

        assert_ok!(create_reply(
            FIRST_OWNER_ORIGIN,
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
            Some(FIRST_ID),
            ReplyType::Valid
        ));

        // Check reply related state after extrinsic performed

        let post = post_by_id(FIRST_ID).unwrap();

        // Replies related storage updated succesfully
        reply_by_id(FIRST_ID, FIRST_ID).expect("Reply not found");

        // Overall post replies count
        assert_eq!(post.replies_count(), 2);

        // Event checked
        let reply_created_event = get_test_event(RawEvent::DirectReplyCreated(
            direct_reply_owner_id,
            FIRST_ID,
            FIRST_ID,
            SECOND_ID,
        ));
        assert_event_success(reply_created_event, number_of_events_before_call + 1)
    })
}

#[test]
fn reply_creation_post_locked_error() {
    ExtBuilder::default().build().execute_with(|| {
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();

        // Lock post to make all related data immutable
        lock_post(FIRST_OWNER_ORIGIN, FIRST_ID).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let reply_creation_result =
            create_reply(SECOND_OWNER_ORIGIN, FIRST_ID, None, ReplyType::Valid);

        // Check if related replies storage left unchanged
        assert!(replies_storage_unchanged(FIRST_ID, FIRST_ID));

        // Failure checked
        assert_failure(
            reply_creation_result,
            Error::PostLockedError,
            number_of_events_before_call,
        );
    })
}

#[test]
fn reply_creation_text_too_long_error() {
    ExtBuilder::default().build().execute_with(|| {
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let reply_creation_result =
            create_reply(SECOND_OWNER_ORIGIN, FIRST_ID, None, ReplyType::Invalid);

        // Check if related replies storage left unchanged
        assert!(replies_storage_unchanged(FIRST_ID, FIRST_ID));

        // Failure checked
        assert_failure(
            reply_creation_result,
            Error::ReplyTextTooLong,
            number_of_events_before_call,
        );
    })
}

#[test]
fn reply_creation_post_not_found() {
    ExtBuilder::default().build().execute_with(|| {
        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let reply_creation_result =
            create_reply(SECOND_OWNER_ORIGIN, FIRST_ID, None, ReplyType::Valid);

        // Check if related replies storage left unchanged
        assert!(replies_storage_unchanged(FIRST_ID, FIRST_ID));

        // Failure checked
        assert_failure(
            reply_creation_result,
            Error::PostNotFound,
            number_of_events_before_call,
        );
    })
}

#[test]
fn reply_creation_limit_reached() {
    ExtBuilder::default().build().execute_with(|| {
        // Create post for future replies
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();
        loop {
            // Events number before tested call
            let number_of_events_before_call = System::events().len();
            if let Err(create_reply_err) =
                create_reply(FIRST_OWNER_ORIGIN, FIRST_ID, None, ReplyType::Valid)
            {
                let post = post_by_id(FIRST_ID).unwrap();

                // Root post replies counter & reply root max number contraint equality checked
                assert_eq!(post.replies_count(), RepliesMaxNumber::get());

                // Last reply creation, before limit reached, failure checked
                assert_failure(
                    Err(create_reply_err),
                    Error::RepliesLimitReached,
                    number_of_events_before_call,
                );
                break;
            }
        }
    })
}

#[test]
fn direct_reply_creation_reply_not_found() {
    ExtBuilder::default().build().execute_with(|| {
        // Create post for future replies
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Attempt to create direct reply for nonexistent reply
        let reply_creation_result = create_reply(
            SECOND_OWNER_ORIGIN,
            FIRST_ID,
            Some(FIRST_ID),
            ReplyType::Valid,
        );

        // Check if related runtime storage left unchanged
        assert!(replies_storage_unchanged(FIRST_ID, SECOND_ID));

        // Failure checked
        assert_failure(
            reply_creation_result,
            Error::ReplyNotFound,
            number_of_events_before_call,
        );
    })
}

#[test]
fn reply_editing_success() {
    ExtBuilder::default().build().execute_with(|| {
        // Create post for future replies
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();

        let reply_owner_id = ensure_signed(Origin::signed(SECOND_OWNER_ORIGIN)).unwrap();

        create_reply(SECOND_OWNER_ORIGIN, FIRST_ID, None, ReplyType::Valid).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        edit_reply(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, ReplyType::Valid).unwrap();

        // Reply after editing checked
        let reply = reply_by_id(FIRST_ID, FIRST_ID);

        ensure_replies_equality(reply, reply_owner_id, ParentId::Post(FIRST_ID), true);

        // Event checked
        let reply_edited_event = get_test_event(RawEvent::ReplyEdited(FIRST_ID, FIRST_ID));
        assert_event_success(reply_edited_event, number_of_events_before_call + 1)
    })
}

#[test]
fn reply_editing_post_locked_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Create post for future replies
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();

        let reply_owner_id = ensure_signed(Origin::signed(SECOND_OWNER_ORIGIN)).unwrap();

        create_reply(SECOND_OWNER_ORIGIN, FIRST_ID, None, ReplyType::Valid).unwrap();

        // Lock blog to make all related data immutable
        lock_post(FIRST_OWNER_ORIGIN, FIRST_ID).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let reply_editing_result =
            edit_reply(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, ReplyType::Valid);

        // Reply after editing checked
        let reply = reply_by_id(FIRST_ID, FIRST_ID);

        // Compare with default unedited reply
        ensure_replies_equality(reply, reply_owner_id, ParentId::Post(FIRST_ID), true);

        // Failure checked
        assert_failure(
            reply_editing_result,
            Error::PostLockedError,
            number_of_events_before_call,
        );
    })
}

#[test]
fn reply_editing_not_found() {
    ExtBuilder::default().build().execute_with(|| {
        // Create post for future replies
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let reply_editing_result =
            edit_reply(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, ReplyType::Valid);

        // Failure checked
        assert_failure(
            reply_editing_result,
            Error::ReplyNotFound,
            number_of_events_before_call,
        );
    })
}

#[test]
fn reply_editing_text_too_long_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Create post for future replies
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();

        let reply_owner_id = ensure_signed(Origin::signed(SECOND_OWNER_ORIGIN)).unwrap();

        create_reply(SECOND_OWNER_ORIGIN, FIRST_ID, None, ReplyType::Valid).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let reply_editing_result =
            edit_reply(SECOND_OWNER_ORIGIN, FIRST_ID, FIRST_ID, ReplyType::Invalid);

        // Reply after editing checked
        let reply = reply_by_id(FIRST_ID, FIRST_ID);

        // Compare with default unedited reply
        ensure_replies_equality(reply, reply_owner_id, ParentId::Post(FIRST_ID), true);

        // Failure checked
        assert_failure(
            reply_editing_result,
            Error::ReplyTextTooLong,
            number_of_events_before_call,
        );
    })
}

#[test]
fn reply_editing_ownership_error() {
    ExtBuilder::default().build().execute_with(|| {
        // Create post for future replies
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();

        let reply_owner_id = ensure_signed(Origin::signed(SECOND_OWNER_ORIGIN)).unwrap();

        create_reply(SECOND_OWNER_ORIGIN, FIRST_ID, None, ReplyType::Valid).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let reply_editing_result =
            edit_reply(FIRST_OWNER_ORIGIN, FIRST_ID, FIRST_ID, ReplyType::Valid);

        // Reply after editing checked
        let reply = reply_by_id(FIRST_ID, FIRST_ID);

        // Compare with default unedited reply
        ensure_replies_equality(reply, reply_owner_id, ParentId::Post(FIRST_ID), true);

        // Failure checked
        assert_failure(
            reply_editing_result,
            Error::ReplyOwnershipError,
            number_of_events_before_call,
        );
    })
}

#[test]
fn reaction_success() {
    const REACTION_INDEX: ReactionsNumber = 4;

    ExtBuilder::default().build().execute_with(|| {
        // Create post for future replies
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();

        let reaction_owner_id = ensure_signed(Origin::signed(SECOND_OWNER_ORIGIN)).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // React to a post
        assert_ok!(react(SECOND_OWNER_ORIGIN, REACTION_INDEX, FIRST_ID, None,));

        // Reactions state after react to post extrinsic performed
        ensure_reaction_status(
            get_reactions(FIRST_ID, None, reaction_owner_id),
            REACTION_INDEX,
            true,
        );

        // Event checked
        let post_reactions_updated_event = get_test_event(RawEvent::PostReactionsUpdated(
            reaction_owner_id,
            FIRST_ID,
            REACTION_INDEX,
            true,
        ));
        assert_event_success(
            post_reactions_updated_event,
            number_of_events_before_call + 1,
        );

        create_reply(FIRST_OWNER_ORIGIN, FIRST_ID, None, ReplyType::Valid).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // React to a reply twice to check, that flipping performed
        for _ in 0..2 {
            assert_ok!(react(
                SECOND_OWNER_ORIGIN,
                REACTION_INDEX,
                FIRST_ID,
                Some(FIRST_ID),
            ));
        }

        // Reactions state after react to reply extrinsic performed
        ensure_reaction_status(
            get_reactions(FIRST_ID, Some(FIRST_ID), reaction_owner_id),
            REACTION_INDEX,
            false,
        );

        // Event checked
        let reply_reactions_updated_event = get_test_event(RawEvent::ReplyReactionsUpdated(
            reaction_owner_id,
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
    const REACTIONS_MAX_NUMBER: ReactionsNumber = 5;

    ExtBuilder::default().build().execute_with(|| {
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // React to a post
        // Should fail, as last index in configured reactions array is less by one than array length
        let react_result = react(SECOND_OWNER_ORIGIN, REACTIONS_MAX_NUMBER, FIRST_ID, None);

        let reaction_owner_id = ensure_signed(Origin::signed(SECOND_OWNER_ORIGIN)).unwrap();

        // Ensure  reactions related state left unchanged
        assert!(get_reactions(FIRST_ID, None, reaction_owner_id).is_none());

        // Failure checked
        assert_failure(
            react_result,
            Error::InvalidReactionIndex,
            number_of_events_before_call,
        );
    })
}

#[test]
fn reaction_post_not_found() {
    const REACTION_INDEX: ReactionsNumber = 4;

    ExtBuilder::default().build().execute_with(|| {
        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // React to a post
        let react_result = react(SECOND_OWNER_ORIGIN, REACTION_INDEX, FIRST_ID, None);

        let reaction_owner_id = ensure_signed(Origin::signed(SECOND_OWNER_ORIGIN)).unwrap();

        // Ensure  reactions related state left unchanged
        assert!(get_reactions(FIRST_ID, None, reaction_owner_id).is_none());

        // Failure checked
        assert_failure(
            react_result,
            Error::PostNotFound,
            number_of_events_before_call,
        );
    })
}

#[test]
fn reaction_reply_not_found() {
    const REACTION_INDEX: ReactionsNumber = 4;

    ExtBuilder::default().build().execute_with(|| {
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // React to a reply
        let react_result = react(
            SECOND_OWNER_ORIGIN,
            REACTION_INDEX,
            FIRST_ID,
            Some(FIRST_ID),
        );

        let reaction_owner_id = ensure_signed(Origin::signed(SECOND_OWNER_ORIGIN)).unwrap();

        // Ensure  reactions related state left unchanged
        assert!(get_reactions(FIRST_ID, Some(FIRST_ID), reaction_owner_id).is_none());

        // Failure checked
        assert_failure(
            react_result,
            Error::ReplyNotFound,
            number_of_events_before_call,
        );
    })
}

#[test]
fn reaction_post_locked_error() {
    const REACTION_INDEX: ReactionsNumber = 4;

    ExtBuilder::default().build().execute_with(|| {
        create_post(FIRST_OWNER_ORIGIN, PostType::Valid).unwrap();

        // Lock block to forbid mutations
        lock_post(FIRST_OWNER_ORIGIN, FIRST_ID).unwrap();

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // React to a post
        let react_result = react(SECOND_OWNER_ORIGIN, REACTION_INDEX, FIRST_ID, None);

        let reaction_owner_id = ensure_signed(Origin::signed(SECOND_OWNER_ORIGIN)).unwrap();

        // Ensure  reactions related state left unchanged
        assert!(get_reactions(FIRST_ID, None, reaction_owner_id).is_none());

        // Failure checked
        assert_failure(
            react_result,
            Error::PostLockedError,
            number_of_events_before_call,
        );
    })
}

fn replies_storage_unchanged(
    post_id: <Runtime as Trait>::PostId,
    reply_id: <Runtime as Trait>::ReplyId,
) -> bool {
    match post_by_id(post_id) {
        Some(post) if post.replies_count() == 0 && reply_by_id(post_id, reply_id).is_none() => true,
        Some(_) => false,
        None if reply_by_id(post_id, reply_id).is_none() => true,
        None => false,
    }
}
