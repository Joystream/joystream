#![cfg(test)]

//use super::curators;
use super::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};
use sp_runtime::traits::Hash;

fn setup_testing_scenario(origins: &Vec<u64>, member_ids: &Vec<u64>) {
    for (origin, member_id) in origins.iter().zip(member_ids.iter()) {
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

        // setting up ids for creating channels & videos
        let origins = (1..MEMBERS_COUNT).collect::<Vec<u64>>();
        let member_ids = origins.clone();

        setup_testing_scenario(&origins, &member_ids);

        let non_existing_video = 7777u64;
        assert_err!(
            Content::create_post(
                Origin::signed(origins[0]),
                <tests::mock::Test as Trait>::VideoId::from(non_existing_video),
                ContentActor::Member(member_ids[0]),
            ),
            Error::<Test>::VideoDoesNotExist,
        );
    })
}

#[test]
fn non_channel_owner_cannot_create_post() {
    with_default_mock_builder(|| {
        //        run_to_block(1);

        // setting up ids for creating channels & videos
        let origins = (1..MEMBERS_COUNT).collect::<Vec<u64>>();
        let member_ids = origins.clone();

        setup_testing_scenario(&origins, &member_ids);

        let video_id = 1u64;
        let non_owner_member_id = 7777u64;
        let non_owner_origin = 7777u64;
        assert_err!(
            Content::create_post(
                Origin::signed(non_owner_origin),
                <tests::mock::Test as Trait>::VideoId::from(video_id),
                ContentActor::Member(non_owner_member_id),
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}
#[test]
fn non_existing_member_cannot_create_post() {
    with_default_mock_builder(|| {
        //        run_to_block(1);

        // setting up ids for creating channels & videos
        let origins = (1..MEMBERS_COUNT).collect::<Vec<u64>>();
        let member_ids = origins.clone();

        setup_testing_scenario(&origins, &member_ids);

        let non_existing_member_id = 7777u64;
        let video_id = 1u64;

        assert_err!(
            Content::create_post(
                Origin::signed(UNKNOWN_ORIGIN),
                <tests::mock::Test as Trait>::VideoId::from(video_id),
                ContentActor::Member(non_existing_member_id),
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

#[test]
fn verify_create_post_effects() {
    with_default_mock_builder(|| {
        run_to_block(1);

        // setting up ids for creating channels & videos
        let origins = (1..MEMBERS_COUNT).collect::<Vec<u64>>();
        let member_ids = origins.clone();

        setup_testing_scenario(&origins, &member_ids);

        let video_id = 1u64;
        let post_id = Content::next_post_id();

        assert_ok!(Content::create_post(
            Origin::signed(origins[0]),
            <tests::mock::Test as Trait>::VideoId::from(video_id),
            ContentActor::Member(member_ids[0]),
        ));

        // the actual post that should be created
        let post: Post<Test> = Post_ {
            author: ChannelOwner::Member(member_ids[0]),
            cleanup_pay_off: BalanceOf::<Test>::zero(),
            replies_count: <Test as Trait>::ReplyId::zero(),
            last_edited: frame_system::Module::<Test>::block_number(),
            video: video_id,
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
                ContentActor::Member(member_ids[0]),
                video_id,
                post_id
            ))
        );
    })
}

// Edit post tests

#[test]
fn non_owner_cannot_edit_post() {
    with_default_mock_builder(|| {
        //        run_to_block(1);

        // setting up ids for creating channels & videos
        let origins = (1..MEMBERS_COUNT).collect::<Vec<u64>>();
        let member_ids = origins.clone();

        setup_testing_scenario(&origins, &member_ids);

        let video_id = 1u64;
        let new_video_id = 2u64;

        let post_id = Content::next_post_id();

        assert_ok!(Content::create_post(
            Origin::signed(origins[0]),
            <tests::mock::Test as Trait>::VideoId::from(video_id),
            ContentActor::Member(member_ids[0]),
        ));

        assert_err!(
            Content::edit_post(
                Origin::signed(origins[2]),
                post_id,
                <tests::mock::Test as Trait>::VideoId::from(new_video_id),
                ContentActor::Member(member_ids[2]),
            ),
            Error::<Test>::ActorNotAuthorized,
        );
    })
}

#[test]
fn non_existing_member_cannot_edit_post() {
    with_default_mock_builder(|| {
        //        run_to_block(1);

        // setting up ids for creating channels & videos
        let origins = (1..MEMBERS_COUNT).collect::<Vec<u64>>();
        let member_ids = origins.clone();

        setup_testing_scenario(&origins, &member_ids);

        let video_id = 1u64;
        let new_video_id = 2u64;

        let post_id = Content::next_post_id();

        assert_ok!(Content::create_post(
            Origin::signed(origins[0]),
            <tests::mock::Test as Trait>::VideoId::from(video_id),
            ContentActor::Member(member_ids[0]),
        ));

        let non_existing_member_id = 7777u64;

        assert_err!(
            Content::edit_post(
                Origin::signed(origins[2]),
                post_id,
                <tests::mock::Test as Trait>::VideoId::from(new_video_id),
                ContentActor::Member(non_existing_member_id),
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

#[test]
fn cannot_edit_nonexisting_post() {
    with_default_mock_builder(|| {
        //        run_to_block(1);

        // setting up ids for creating channels & videos
        let origins = (1..MEMBERS_COUNT).collect::<Vec<u64>>();
        let member_ids = origins.clone();

        setup_testing_scenario(&origins, &member_ids);

        let video_id = 1u64;
        let new_video_id = 2u64;

        let non_existing_post_id = 7777u64;

        assert_ok!(Content::create_post(
            Origin::signed(origins[0]),
            <tests::mock::Test as Trait>::VideoId::from(video_id),
            ContentActor::Member(member_ids[0]),
        ));

        assert_err!(
            Content::edit_post(
                Origin::signed(origins[0]),
                non_existing_post_id,
                <tests::mock::Test as Trait>::VideoId::from(new_video_id),
                ContentActor::Member(member_ids[0]),
            ),
            Error::<Test>::PostDoesNotExist,
        );
    })
}

#[test]
fn verify_edit_post_effects() {
    with_default_mock_builder(|| {
        run_to_block(1);

        // setting up ids for creating channels & videos
        let origins = (1..MEMBERS_COUNT).collect::<Vec<u64>>();
        let member_ids = origins.clone();

        setup_testing_scenario(&origins, &member_ids);

        let video_id = 1u64;
        let new_video_id = 2u64;

        let post_id = Content::next_post_id();

        assert_ok!(Content::create_post(
            Origin::signed(origins[0]),
            <tests::mock::Test as Trait>::VideoId::from(video_id),
            ContentActor::Member(member_ids[0]),
        ));

        assert_ok!(Content::edit_post(
            Origin::signed(origins[0]),
            post_id,
            <tests::mock::Test as Trait>::VideoId::from(new_video_id),
            ContentActor::Member(member_ids[0])
        ));

        // post video is updated
        assert_eq!(Content::post_by_id(post_id).video, new_video_id);

        // event is deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::PostModified(
                ContentActor::Member(member_ids[0]),
                new_video_id,
                post_id
            ))
        );
    })
}

// delete post tests
#[test]
fn cannot_delete_non_existing_post() {
    with_default_mock_builder(|| {
        //        run_to_block(1);

        // setting up ids for creating channels & videos
        let origins = (1..MEMBERS_COUNT).collect::<Vec<u64>>();
        let member_ids = origins.clone();

        setup_testing_scenario(&origins, &member_ids);

        let video_id = 1u64;
        let non_existing_post_id = 7777u64;

        assert_ok!(Content::create_post(
            Origin::signed(origins[0]),
            <tests::mock::Test as Trait>::VideoId::from(video_id),
            ContentActor::Member(member_ids[0]),
        ));

        assert_err!(
            Content::delete_post(
                Origin::signed(origins[0]),
                non_existing_post_id,
                ContentActor::Member(member_ids[0]),
            ),
            Error::<Test>::PostDoesNotExist,
        );
    })
}

#[test]
fn non_owner_cannot_delete_post() {
    with_default_mock_builder(|| {
        //        run_to_block(1);

        // setting up ids for creating channels & videos
        let origins = (1..MEMBERS_COUNT).collect::<Vec<u64>>();
        let member_ids = origins.clone();

        setup_testing_scenario(&origins, &member_ids);

        let video_id = 1u64;
        let post_id = Content::next_post_id();

        assert_ok!(Content::create_post(
            Origin::signed(origins[0]),
            <tests::mock::Test as Trait>::VideoId::from(video_id),
            ContentActor::Member(member_ids[0]),
        ));

        assert_err!(
            Content::delete_post(
                Origin::signed(origins[0]),
                post_id,
                ContentActor::Member(member_ids[2]),
            ),
            Error::<Test>::ActorNotAuthorized,
        );
    })
}

#[test]
fn non_existing_member_cannot_delete_post() {
    with_default_mock_builder(|| {
        //        run_to_block(1);

        // setting up ids for creating channels & videos
        let origins = (1..MEMBERS_COUNT).collect::<Vec<u64>>();
        let member_ids = origins.clone();

        setup_testing_scenario(&origins, &member_ids);

        let video_id = 1u64;
        let post_id = Content::next_post_id();
        let non_existing_member_id = 7777u64;

        assert_ok!(Content::create_post(
            Origin::signed(origins[0]),
            <tests::mock::Test as Trait>::VideoId::from(video_id),
            ContentActor::Member(member_ids[0]),
        ));

        assert_err!(
            Content::delete_post(
                Origin::signed(origins[0]),
                post_id,
                ContentActor::Member(non_existing_member_id),
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}
#[test]
fn verify_delete_post_effects() {
    with_default_mock_builder(|| {
        run_to_block(1);

        // setting up ids for creating channels & videos
        let origins = (1..MEMBERS_COUNT).collect::<Vec<u64>>();
        let member_ids = origins.clone();

        setup_testing_scenario(&origins, &member_ids);

        let video_id = 1u64;
        let post_id = Content::next_post_id();

        assert_ok!(Content::create_post(
            Origin::signed(origins[0]),
            <tests::mock::Test as Trait>::VideoId::from(video_id),
            ContentActor::Member(member_ids[0]),
        ));

        assert_ok!(Content::delete_post(
            Origin::signed(origins[0]),
            post_id,
            ContentActor::Member(member_ids[0])
        ));

        // event is deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::PostDeleted(
                ContentActor::Member(member_ids[0]),
                post_id
            ))
        );
    })
}

// create reply tests

fn setup_testing_scenario_for_replies(
    origins: &Vec<u64>,
    member_ids: &Vec<u64>,
) -> <tests::mock::Test as Trait>::PostId {
    setup_testing_scenario(&origins, &member_ids);
    let video_id = 1u64;
    let post_id = Content::next_post_id();

    assert_ok!(Content::create_post(
        Origin::signed(origins[0]),
        <tests::mock::Test as Trait>::VideoId::from(video_id),
        ContentActor::Member(member_ids[0]),
    ));

    assert_eq!(Content::next_post_id(), 1);

    post_id
}

#[test]
fn non_existing_member_cannot_reply() {
    with_default_mock_builder(|| {
        //        run_to_block(1);

        // setting up ids for creating channels & videos
        let origins = (1..MEMBERS_COUNT).collect::<Vec<u64>>();
        let member_ids = origins.clone();

        let post_id = setup_testing_scenario_for_replies(&origins, &member_ids);

        let non_existing_member_id = 7777u64;
        assert_err!(
            Content::create_reply(
                Origin::signed(origins[0]),
                <tests::mock::Test as MembershipTypes>::MemberId::from(non_existing_member_id),
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
        // run_to_block(1);

        // setting up ids for creating channels & videos
        let origins = (1..MEMBERS_COUNT).collect::<Vec<u64>>();
        let member_ids = origins.clone();

        let post_id = setup_testing_scenario_for_replies(&origins, &member_ids);
        println!("{}", Content::next_post_id());

        let non_existing_element_id = 7777u64;

        assert_err!(
            Content::create_reply(
                Origin::signed(origins[0]),
                <tests::mock::Test as MembershipTypes>::MemberId::from(member_ids[0]),
                <tests::mock::Test as Trait>::PostId::from(non_existing_element_id),
                None,
                <tests::mock::Test as frame_system::Trait>::Hashing::hash(&post_id.encode()),
            ),
            Error::<Test>::PostDoesNotExist,
        );

        assert_err!(
            Content::create_reply(
                Origin::signed(origins[0]),
                <tests::mock::Test as MembershipTypes>::MemberId::from(member_ids[0]),
                <tests::mock::Test as Trait>::PostId::from(0u64),
                Some(<tests::mock::Test as Trait>::ReplyId::from(
                    non_existing_element_id
                )),
                <tests::mock::Test as frame_system::Trait>::Hashing::hash(&post_id.encode()),
            ),
            Error::<Test>::ReplyDoesNotExist,
        );
    })
}

fn setup_testing_scenario_with_replies(
    origins: &Vec<u64>,
    member_ids: &Vec<u64>,
) -> (
    <tests::mock::Test as Trait>::ReplyId,
    <tests::mock::Test as Trait>::PostId,
) {
    let post_id = setup_testing_scenario_for_replies(&origins, &member_ids);

    assert_ok!(Content::create_reply(
        Origin::signed(origins[0]),
        <tests::mock::Test as MembershipTypes>::MemberId::from(member_ids[0]),
        post_id,
        None,
        <tests::mock::Test as frame_system::Trait>::Hashing::hash(&post_id.encode()),
    ));

    let reply_id = Content::post_by_id(post_id).replies_count;

    assert_ok!(Content::create_reply(
        Origin::signed(origins[0]),
        <tests::mock::Test as MembershipTypes>::MemberId::from(member_ids[0]),
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

        // setting up ids for creating channels & videos
        let origins = (1..MEMBERS_COUNT).collect::<Vec<u64>>();
        let member_ids = origins.clone();

        let out = setup_testing_scenario_with_replies(&origins, &member_ids);
        let reply_id = out.0;
        let post_id = out.1;

        // replies count increased
        assert_eq!(Content::post_by_id(post_id).replies_count - reply_id, 1);

        // event deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::ReplyCreated(
                <tests::mock::Test as MembershipTypes>::MemberId::from(member_ids[0]),
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

        // setting up ids for creating channels & videos
        let origins = (1..MEMBERS_COUNT).collect::<Vec<u64>>();
        let member_ids = origins.clone();

        let out = setup_testing_scenario_with_replies(&origins, &member_ids);
        let reply_id = out.0;
        let post_id = out.1;

        let non_existing_element_id = 7777u64;

        assert_err!(
            Content::edit_reply(
                Origin::signed(origins[0]),
                <tests::mock::Test as MembershipTypes>::MemberId::from(member_ids[0]),
                post_id,
                <tests::mock::Test as Trait>::ReplyId::from(non_existing_element_id),
                <tests::mock::Test as frame_system::Trait>::Hashing::hash(&reply_id.encode()),
            ),
            Error::<Test>::ReplyDoesNotExist,
        );

        assert_err!(
            Content::edit_reply(
                Origin::signed(origins[0]),
                <tests::mock::Test as MembershipTypes>::MemberId::from(member_ids[0]),
                <tests::mock::Test as Trait>::PostId::from(non_existing_element_id),
                reply_id,
                <tests::mock::Test as frame_system::Trait>::Hashing::hash(&reply_id.encode()),
            ),
            Error::<Test>::ReplyDoesNotExist,
        );
    })
}

#[test]
fn non_owner_cannot_edit_reply() {
    with_default_mock_builder(|| {
        run_to_block(1);

        // setting up ids for creating channels & videos
        let origins = (1..MEMBERS_COUNT).collect::<Vec<u64>>();
        let member_ids = origins.clone();

        let out = setup_testing_scenario_with_replies(&origins, &member_ids);
        let reply_id = out.0;
        let post_id = out.1;

        assert_err!(
            Content::edit_reply(
                Origin::signed(origins[0]),
                <tests::mock::Test as MembershipTypes>::MemberId::from(member_ids[2]),
                post_id,
                reply_id,
                <tests::mock::Test as frame_system::Trait>::Hashing::hash(&reply_id.encode()),
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

#[test]
fn unknown_member_cannot_edit_reply() {
    with_default_mock_builder(|| {
        run_to_block(1);

        // setting up ids for creating channels & videos
        let origins = (1..MEMBERS_COUNT).collect::<Vec<u64>>();
        let member_ids = origins.clone();

        let out = setup_testing_scenario_with_replies(&origins, &member_ids);
        let reply_id = out.0;
        let post_id = out.1;

        let unknown_member_id = 7777u64;

        assert_err!(
            Content::edit_reply(
                Origin::signed(origins[0]),
                <tests::mock::Test as MembershipTypes>::MemberId::from(unknown_member_id),
                post_id,
                reply_id,
                <tests::mock::Test as frame_system::Trait>::Hashing::hash(&reply_id.encode()),
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

#[test]
fn verify_edit_reply_effects() {
    with_default_mock_builder(|| {
        run_to_block(1);

        // setting up ids for creating channels & videos
        let origins = (1..MEMBERS_COUNT).collect::<Vec<u64>>();
        let member_ids = origins.clone();

        let out = setup_testing_scenario_with_replies(&origins, &member_ids);
        let reply_id = out.0;
        let post_id = out.1;

        assert_ok!(Content::edit_reply(
            Origin::signed(origins[0]),
            <tests::mock::Test as MembershipTypes>::MemberId::from(member_ids[0]),
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
                <tests::mock::Test as MembershipTypes>::MemberId::from(member_ids[0]),
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

        // setting up ids for creating channels & videos
        let origins = (1..MEMBERS_COUNT).collect::<Vec<u64>>();
        let member_ids = origins.clone();

        let out = setup_testing_scenario_with_replies(&origins, &member_ids);
        let post_id = out.1;

        let replies_count_pre = Content::post_by_id(post_id).replies_count;

        assert_ok!(Content::delete_reply(
            Origin::signed(origins[0]),
            <tests::mock::Test as MembershipTypes>::MemberId::from(member_ids[0]),
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
                <tests::mock::Test as MembershipTypes>::MemberId::from(member_ids[0]),
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

        // setting up ids for creating channels & videos
        let origins = (1..MEMBERS_COUNT).collect::<Vec<u64>>();
        let member_ids = origins.clone();

        let out = setup_testing_scenario_with_replies(&origins, &member_ids);
        let post_id = out.1;
        let parent_reply_id = out.0;

        let replies_count_pre = Content::post_by_id(post_id).replies_count;

        assert_ok!(Content::delete_reply(
            Origin::signed(origins[0]),
            <tests::mock::Test as MembershipTypes>::MemberId::from(member_ids[0]),
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
                <tests::mock::Test as MembershipTypes>::MemberId::from(member_ids[0]),
                post_id,
                parent_reply_id,
            ))
        );
    })
}
