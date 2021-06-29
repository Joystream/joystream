#![cfg(test)]

use super::curators;
use super::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

fn setup_testing_scenario() {
    // setting up ids for creating channels & videos
    let origins = (1..MEMBERS_COUNT).iter().collect::<Vec<u64>>();
    let member_ids = origins;
    let channel_ids = origins;

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

    for ((origin, member_id), channel_id) in zip(zip(origin, member_ids), channel_ids) {
        let _ch = create_channel(origin, member_id);
        let _vid = create_video(origin, member_id, channelid);
    }
}
