#![cfg(test)]

//use super::curators;
use super::mock::*;
use crate::*;
use frame_support::assert_err;

fn setup_testing_scenario(origins: &Vec<u64>, member_ids: &Vec<u64>, channel_ids: &Vec<u64>) {
    let create_channel = |origin, member_id| {
        Content::create_channel(
            Origin::signed(origin),
            ContentActor::Member(member_id),
            ChannelCreationParameters {
                assets: vec![],
                meta: vec![],
                reward_account: None,
            },
        )
    };

    let create_video = |origin, member_id, channel_id| {
        Content::create_video(
            Origin::signed(origin),
            ContentActor::Member(member_id),
            channel_id,
            VideoCreationParameters {
                assets: vec![NewAsset::Urls(vec![b"https://somewhere.com/".to_vec()])],
                meta: b"metablob".to_vec(),
            },
        )
    };

    for ((origin, member_id), channel_id) in origins
        .iter()
        .zip(member_ids.iter())
        .zip(channel_ids.iter())
    {
        let _ch = create_channel(*origin, *member_id);
        let _vid = create_video(*origin, *member_id, *channel_id);
    }
}

#[test]
fn cannot_create_post_with_nonexisting_video() {
    with_default_mock_builder(|| {
        //        run_to_block(1);

        // setting up ids for creating channels & videos
        let origins = (1..MEMBERS_COUNT).collect::<Vec<u64>>();
        let member_ids = origins.clone();
        let channel_ids = origins.iter().map(|x| x - 1).collect::<Vec<u64>>();

        setup_testing_scenario(&origins, &member_ids, &channel_ids);

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
        let channel_ids = origins.clone();

        setup_testing_scenario(&origins, &member_ids, &channel_ids);

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
fn unknown_origin_cannot_create_post() {
    with_default_mock_builder(|| {
        //        run_to_block(1);

        // setting up ids for creating channels & videos
        let origins = (1..MEMBERS_COUNT).collect::<Vec<u64>>();
        let member_ids = origins.clone();
        let channel_ids = origins.clone();

        setup_testing_scenario(&origins, &member_ids, &channel_ids);

        let video_id = 1u64;
        assert_err!(
            Content::create_post(
                Origin::signed(UNKNOWN_ORIGIN),
                <tests::mock::Test as Trait>::VideoId::from(video_id),
                ContentActor::Member(member_ids[0]),
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}
