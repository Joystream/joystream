#![cfg(test)]

use super::curators;
use super::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

fn setup_testing_enviroinment() {
    // params = (Origin, MemberId)

    let member_ids = (1..10).iter().collect::<Vec<u64>>();
    let channel_ids = member_ids;
    let origins = member_ids;

    let create_channel = |x, y| {
        Content::create_channel(
            Origin::signed(x),
            ContentActor::Member(y),
            ChannelCreationParameters {
                assets: vec![],
                meta: vec![],
                reward_account: None,
            },
        )
    };

    let add_video = |x, y| {
        Content::create_video(
            Origin::signed(x),
            ContentActor::Member(y),
            channel_id,
            VideoCreationParameters {
                assets: vec![NewAsset::Urls(vec![b"https://somewhere.com/".to_vec()])],
                meta: b"metablob".to_vec(),
            },
        )
    };
    for (x, y) in zip(&origins, member_ids) {
        let _chan = create_channel(x, y);
        let _vid = add_video(x, y);
    }
}

#[test]
fn cannot_create_posts_with_non_existing_videos() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let create_post = |origin, video_id, actor| {
            Content::create_post(
                Origin::signed(origin),
                Test::VideoId::from(video_id),
                ContentActor::Member(actor),
            )
        };
        let non_existing_video = 777u64;

        assert_err!(
            create_post(origins[0], non_existing_video, member_ids[0]),
            Error::<Test>::VideoDesNoteExists
        );
    })
}
