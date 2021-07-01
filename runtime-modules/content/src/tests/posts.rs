#![cfg(test)]

//use super::curators;
use super::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};
use sp_runtime::traits::Hash;

pub const ORIGINS: [u64; 10] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
pub const MEMBER_IDS: [u64; 10] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
pub const UNKNOWN_MEMBER_ID: u64 = 7777;
pub const UNKNOWN_REPLY_ID: u64 = 7777;
pub const UNKNOWN_POST_ID: u64 = 7777;
pub const VIDEO_ID: u64 = 1;
pub const NEW_VIDEO_ID: u64 = 2;

fn setup_testing_scenario() {
    for (origin, member_id) in ORIGINS.iter().zip(MEMBER_IDS.iter()) {
        let channel_id = Content::next_channel_id();

        assert_ok!(Content::create_channel(
            Origin::signed(*origin),
            ContentActor::Member(*member_id),
            ChannelCreationParameters {
                assets: vec![],
                meta: vec![],
                reward_account: None,
            },
        ));

        assert_ok!(Content::create_video(
            Origin::signed(*origin),
            ContentActor::Member(*member_id),
            channel_id,
            VideoCreationParameters {
                assets: vec![NewAsset::Urls(vec![b"https://somewhere.com/".to_vec()])],
                meta: b"metablob".to_vec(),
            },
        ));
    }
}

// create post test
#[test]
fn cannot_create_post_with_nonexisting_video() {
    with_default_mock_builder(|| {
        //        run_to_block(1);

        setup_testing_scenario();

        let non_existing_video = 7777u64;
        assert_err!(
            Content::create_post(
                Origin::signed(ORIGINS[0]),
                <tests::mock::Test as Trait>::VideoId::from(non_existing_video),
                ContentActor::Member(MEMBER_IDS[0]),
            ),
            Error::<Test>::VideoDoesNotExist,
        );
    })
}

#[test]
fn non_authorized_actor_cannot_create_post() {
    with_default_mock_builder(|| {
        setup_testing_scenario();

        // non channel owner cannot create post
        assert_err!(
            Content::create_post(
                Origin::signed(ORIGINS[0]),
                <tests::mock::Test as Trait>::VideoId::from(VIDEO_ID),
                ContentActor::Member(MEMBER_IDS[1]),
            ),
            Error::<Test>::ActorNotAuthorized,
        );

        // unknown actor/member cannot create post
        assert_err!(
            Content::create_post(
                Origin::signed(ORIGINS[0]),
                <tests::mock::Test as Trait>::VideoId::from(VIDEO_ID),
                ContentActor::Member(UNKNOWN_MEMBER_ID),
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

#[test]
fn verify_create_post_effects() {
    with_default_mock_builder(|| {
        run_to_block(1);

        setup_testing_scenario();

        let post_id = Content::next_post_id();

        assert_ok!(Content::create_post(
            Origin::signed(ORIGINS[0]),
            <tests::mock::Test as Trait>::VideoId::from(VIDEO_ID),
            ContentActor::Member(MEMBER_IDS[0]),
        ));

        // the actual post that should be created
        let post: Post<Test> = Post_ {
            author: ChannelOwner::Member(MEMBER_IDS[0]),
            cleanup_pay_off: BalanceOf::<Test>::zero(),
            replies_count: <Test as Trait>::ReplyId::zero(),
            last_edited: frame_system::Module::<Test>::block_number(),
            video: VIDEO_ID,
        };

        // next post increased by one
        let new_post_id = Content::next_post_id();

        // Effects:
        // Content::NextPostId increased by 1
        assert_eq!(new_post_id - post_id, 1);

        // Post is added to the storage
        assert_eq!(Content::post_by_id(post_id), post);

        // Event::<Test>::PostCreated is deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::PostCreated(
                ContentActor::Member(MEMBER_IDS[0]),
                VIDEO_ID,
                post_id
            ))
        );
    })
}

// Edit post tests
fn setup_testing_scenario_with_post() -> <tests::mock::Test as Trait>::PostId {
    setup_testing_scenario();
    let post_id = Content::next_post_id();

    assert_ok!(Content::create_post(
        Origin::signed(ORIGINS[0]),
        <tests::mock::Test as Trait>::VideoId::from(VIDEO_ID),
        ContentActor::Member(MEMBER_IDS[0]),
    ));

    assert_eq!(Content::next_post_id(), 1);

    post_id
}

#[test]
fn non_owner_cannot_edit_post() {
    with_default_mock_builder(|| {
        let post_id = setup_testing_scenario_with_post();

        // non owner cannot edit post
        assert_err!(
            Content::edit_post(
                Origin::signed(ORIGINS[2]),
                post_id,
                <tests::mock::Test as Trait>::VideoId::from(NEW_VIDEO_ID),
                ContentActor::Member(MEMBER_IDS[2]),
            ),
            Error::<Test>::ActorNotAuthorized,
        );

        // unknown member/actor cannot edit posts
        assert_err!(
            Content::edit_post(
                Origin::signed(ORIGINS[2]),
                post_id,
                <tests::mock::Test as Trait>::VideoId::from(NEW_VIDEO_ID),
                ContentActor::Member(UNKNOWN_MEMBER_ID),
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

#[test]
fn cannot_edit_nonexisting_post() {
    with_default_mock_builder(|| {
        setup_testing_scenario();

        assert_ok!(Content::create_post(
            Origin::signed(ORIGINS[0]),
            <tests::mock::Test as Trait>::VideoId::from(VIDEO_ID),
            ContentActor::Member(MEMBER_IDS[0]),
        ));

        assert_err!(
            Content::edit_post(
                Origin::signed(ORIGINS[0]),
                UNKNOWN_POST_ID,
                <tests::mock::Test as Trait>::VideoId::from(NEW_VIDEO_ID),
                ContentActor::Member(MEMBER_IDS[0]),
            ),
            Error::<Test>::PostDoesNotExist,
        );
    })
}

#[test]
fn verify_edit_post_effects() {
    with_default_mock_builder(|| {
        run_to_block(1);

        setup_testing_scenario();

        let post_id = Content::next_post_id();

        assert_ok!(Content::create_post(
            Origin::signed(ORIGINS[0]),
            <tests::mock::Test as Trait>::VideoId::from(VIDEO_ID),
            ContentActor::Member(MEMBER_IDS[0]),
        ));

        assert_ok!(Content::edit_post(
            Origin::signed(ORIGINS[0]),
            post_id,
            <tests::mock::Test as Trait>::VideoId::from(NEW_VIDEO_ID),
            ContentActor::Member(MEMBER_IDS[0])
        ));

        // post video is updated
        assert_eq!(Content::post_by_id(post_id).video, NEW_VIDEO_ID);

        // event is deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::PostModified(
                ContentActor::Member(MEMBER_IDS[0]),
                NEW_VIDEO_ID,
                post_id
            ))
        );
    })
}

// delete post tests
#[test]
fn cannot_delete_non_existing_post() {
    with_default_mock_builder(|| {
        let _post_id = setup_testing_scenario_with_post();
        assert_err!(
            Content::delete_post(
                Origin::signed(ORIGINS[0]),
                UNKNOWN_POST_ID,
                ContentActor::Member(MEMBER_IDS[0]),
            ),
            Error::<Test>::PostDoesNotExist,
        );
    })
}

#[test]
fn non_authorized_actor_cannot_delete_post() {
    with_default_mock_builder(|| {
        let post_id = setup_testing_scenario_with_post();

        assert_err!(
            Content::delete_post(
                Origin::signed(ORIGINS[0]),
                post_id,
                ContentActor::Member(MEMBER_IDS[2]),
            ),
            Error::<Test>::ActorNotAuthorized,
        );
        assert_err!(
            Content::delete_post(
                Origin::signed(ORIGINS[0]),
                post_id,
                ContentActor::Member(UNKNOWN_MEMBER_ID),
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

#[test]
fn verify_delete_post_effects() {
    with_default_mock_builder(|| {
        run_to_block(1);

        setup_testing_scenario();
        let post_id = Content::next_post_id();

        assert_ok!(Content::create_post(
            Origin::signed(ORIGINS[0]),
            <tests::mock::Test as Trait>::VideoId::from(VIDEO_ID),
            ContentActor::Member(MEMBER_IDS[0]),
        ));

        assert_ok!(Content::delete_post(
            Origin::signed(ORIGINS[0]),
            post_id,
            ContentActor::Member(MEMBER_IDS[0])
        ));

        // event is deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::PostDeleted(
                ContentActor::Member(MEMBER_IDS[0]),
                post_id
            ))
        );
    })
}

// create reply tests

#[test]
fn non_existing_member_cannot_reply() {
    with_default_mock_builder(|| {
        let post_id = setup_testing_scenario_with_post();

        assert_err!(
            Content::create_reply(
                Origin::signed(ORIGINS[0]),
                <tests::mock::Test as MembershipTypes>::MemberId::from(UNKNOWN_MEMBER_ID),
                post_id,
                None,
                <tests::mock::Test as frame_system::Trait>::Hashing::hash(&post_id.encode()),
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

#[test]
fn cannot_reply_to_unexisting_post_or_reply() {
    with_default_mock_builder(|| {
        let post_id = setup_testing_scenario_with_post();

        assert_err!(
            Content::create_reply(
                Origin::signed(ORIGINS[0]),
                <tests::mock::Test as MembershipTypes>::MemberId::from(MEMBER_IDS[0]),
                <tests::mock::Test as Trait>::PostId::from(UNKNOWN_POST_ID),
                None,
                <tests::mock::Test as frame_system::Trait>::Hashing::hash(&post_id.encode()),
            ),
            Error::<Test>::PostDoesNotExist,
        );

        assert_err!(
            Content::create_reply(
                Origin::signed(ORIGINS[0]),
                <tests::mock::Test as MembershipTypes>::MemberId::from(MEMBER_IDS[0]),
                <tests::mock::Test as Trait>::PostId::from(0u64),
                Some(<tests::mock::Test as Trait>::ReplyId::from(
                    UNKNOWN_REPLY_ID
                )),
                <tests::mock::Test as frame_system::Trait>::Hashing::hash(&post_id.encode()),
            ),
            Error::<Test>::ReplyDoesNotExist,
        );
    })
}

fn setup_testing_scenario_with_replies() -> (
    <tests::mock::Test as Trait>::ReplyId,
    <tests::mock::Test as Trait>::PostId,
) {
    let post_id = setup_testing_scenario_with_post();

    assert_ok!(Content::create_reply(
        Origin::signed(ORIGINS[0]),
        <tests::mock::Test as MembershipTypes>::MemberId::from(MEMBER_IDS[0]),
        post_id,
        None,
        <tests::mock::Test as frame_system::Trait>::Hashing::hash(&post_id.encode()),
    ));

    let reply_id = Content::post_by_id(post_id).replies_count;

    assert_ok!(Content::create_reply(
        Origin::signed(ORIGINS[0]),
        <tests::mock::Test as MembershipTypes>::MemberId::from(MEMBER_IDS[0]),
        post_id,
        Some(reply_id),
        <tests::mock::Test as frame_system::Trait>::Hashing::hash(&reply_id.encode()),
    ));
    (reply_id, post_id)
}

#[test]
fn verify_create_reply_effects() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let (reply_id, post_id) = setup_testing_scenario_with_replies();

        // replies count increased
        assert_eq!(Content::post_by_id(post_id).replies_count - reply_id, 1);

        // event deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::ReplyCreated(
                <tests::mock::Test as MembershipTypes>::MemberId::from(MEMBER_IDS[0]),
                post_id,
                Content::post_by_id(post_id).replies_count,
            ))
        );
    })
}

// edit_reply
#[test]
fn cannot_edit_unexisting_reply() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let (reply_id, post_id) = setup_testing_scenario_with_replies();

        assert_err!(
            Content::edit_reply(
                Origin::signed(ORIGINS[0]),
                <tests::mock::Test as MembershipTypes>::MemberId::from(MEMBER_IDS[0]),
                post_id,
                <tests::mock::Test as Trait>::ReplyId::from(UNKNOWN_REPLY_ID),
                <tests::mock::Test as frame_system::Trait>::Hashing::hash(&reply_id.encode()),
            ),
            Error::<Test>::ReplyDoesNotExist,
        );

        assert_err!(
            Content::edit_reply(
                Origin::signed(ORIGINS[0]),
                <tests::mock::Test as MembershipTypes>::MemberId::from(MEMBER_IDS[0]),
                <tests::mock::Test as Trait>::PostId::from(UNKNOWN_POST_ID),
                reply_id,
                <tests::mock::Test as frame_system::Trait>::Hashing::hash(&reply_id.encode()),
            ),
            Error::<Test>::ReplyDoesNotExist,
        );
    })
}

#[test]
fn non_authorized_member_cannot_edit_reply() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let (reply_id, post_id) = setup_testing_scenario_with_replies();

        assert_err!(
            Content::edit_reply(
                Origin::signed(ORIGINS[0]),
                <tests::mock::Test as MembershipTypes>::MemberId::from(MEMBER_IDS[2]),
                post_id,
                reply_id,
                <tests::mock::Test as frame_system::Trait>::Hashing::hash(&reply_id.encode()),
            ),
            Error::<Test>::MemberAuthFailed,
        );

        assert_err!(
            Content::edit_reply(
                Origin::signed(ORIGINS[0]),
                <tests::mock::Test as MembershipTypes>::MemberId::from(UNKNOWN_MEMBER_ID),
                post_id,
                reply_id,
                <tests::mock::Test as frame_system::Trait>::Hashing::hash(&reply_id.encode()),
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

// edit_reply
#[test]
fn cannot_delete_unexisting_reply() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let (reply_id, post_id) = setup_testing_scenario_with_replies();

        assert_err!(
            Content::delete_reply(
                Origin::signed(ORIGINS[0]),
                <tests::mock::Test as MembershipTypes>::MemberId::from(MEMBER_IDS[0]),
                post_id,
                <tests::mock::Test as Trait>::ReplyId::from(UNKNOWN_REPLY_ID),
            ),
            Error::<Test>::ReplyDoesNotExist,
        );

        assert_err!(
            Content::delete_reply(
                Origin::signed(ORIGINS[0]),
                <tests::mock::Test as MembershipTypes>::MemberId::from(MEMBER_IDS[0]),
                <tests::mock::Test as Trait>::PostId::from(UNKNOWN_POST_ID),
                reply_id,
            ),
            Error::<Test>::ReplyDoesNotExist,
        );
    })
}

#[test]
fn non_authorized_member_cannot_delete_reply() {
    with_default_mock_builder(|| {
        let (reply_id, post_id) = setup_testing_scenario_with_replies();

        // non owner member cannot delete reply
        assert_err!(
            Content::delete_reply(
                Origin::signed(ORIGINS[0]),
                <tests::mock::Test as MembershipTypes>::MemberId::from(MEMBER_IDS[2]),
                post_id,
                reply_id,
            ),
            Error::<Test>::MemberAuthFailed,
        );

        // non existing member cannot delete reply
        assert_err!(
            Content::delete_reply(
                Origin::signed(ORIGINS[0]),
                <tests::mock::Test as MembershipTypes>::MemberId::from(UNKNOWN_MEMBER_ID),
                post_id,
                reply_id,
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

#[test]
fn verify_edit_reply_effects() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let (reply_id, post_id) = setup_testing_scenario_with_replies();

        assert_ok!(Content::edit_reply(
            Origin::signed(ORIGINS[0]),
            <tests::mock::Test as MembershipTypes>::MemberId::from(MEMBER_IDS[0]),
            post_id,
            reply_id,
            <tests::mock::Test as frame_system::Trait>::Hashing::hash(&post_id.encode()),
        ));

        // replies count increased
        assert_eq!(
            Content::reply_by_id(post_id, reply_id).text,
            <tests::mock::Test as frame_system::Trait>::Hashing::hash(&post_id.encode()),
        );

        // event deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::ReplyModified(
                <tests::mock::Test as MembershipTypes>::MemberId::from(MEMBER_IDS[0]),
                post_id,
                reply_id,
            ))
        );
    })
}

// delete reply
// behavior on unsatisfied preconditions is the same as edit_reply, testing effects only...
#[test]
fn verify_delete_sub_reply_effects() {
    with_default_mock_builder(|| {
        // deleting (the last) reply to a reply
        run_to_block(1);

        let (_reply_id, post_id) = setup_testing_scenario_with_replies();

        let replies_count_pre = Content::post_by_id(post_id).replies_count;

        assert_ok!(Content::delete_reply(
            Origin::signed(ORIGINS[0]),
            <tests::mock::Test as MembershipTypes>::MemberId::from(MEMBER_IDS[0]),
            post_id,
            replies_count_pre,
        ));

        let replies_count_post = Content::post_by_id(post_id).replies_count;

        // replies count increased
        assert_eq!(replies_count_pre - replies_count_post, 1);

        // event deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::ReplyDeleted(
                <tests::mock::Test as MembershipTypes>::MemberId::from(MEMBER_IDS[0]),
                post_id,
                replies_count_pre,
            ))
        );
    })
}

#[test]
fn verify_delete_parent_reply_effects() {
    with_default_mock_builder(|| {
        // deleting parent reply
        run_to_block(1);

        let (parent_reply_id, post_id) = setup_testing_scenario_with_replies();

        let replies_count_pre = Content::post_by_id(post_id).replies_count;

        assert_ok!(Content::delete_reply(
            Origin::signed(ORIGINS[0]),
            <tests::mock::Test as MembershipTypes>::MemberId::from(MEMBER_IDS[0]),
            post_id,
            parent_reply_id,
        ));

        let replies_count_post = Content::post_by_id(post_id).replies_count;

        // replies count increased
        assert_eq!(replies_count_pre - replies_count_post, 1);

        // event deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::ReplyDeleted(
                <tests::mock::Test as MembershipTypes>::MemberId::from(MEMBER_IDS[0]),
                post_id,
                parent_reply_id,
            ))
        );
    })
}

//#[test]
// test react to post
