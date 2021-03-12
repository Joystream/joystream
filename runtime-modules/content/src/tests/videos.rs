#![cfg(test)]

use super::curators;
use super::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

fn create_channel() -> ChannelId {
    let channel_id = Content::next_channel_id();

    // Member can create the channel
    assert_ok!(Content::create_channel(
        Origin::signed(FIRST_MEMBER_ORIGIN),
        ContentActor::Member(FIRST_MEMBER_ID),
        ChannelCreationParameters {
            assets: vec![],
            meta: vec![],
            reward_account: None,
        }
    ));

    channel_id
}

#[test]
fn member_can_create_videos() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);
        let channel_id = create_channel();

        let video_id = Content::next_video_id();
        assert_ok!(Content::create_video(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            channel_id,
            VideoCreationParameters {
                assets: vec![],
                meta: vec![],
            }
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::VideoCreated(
                ContentActor::Member(FIRST_MEMBER_ID),
                channel_id,
                video_id,
                VideoCreationParameters {
                    assets: vec![],
                    meta: vec![],
                }
            ))
        );

        let video = Content::video_by_id(video_id);
        assert_eq!(channel_id, video.in_channel);

        assert_ok!(Content::update_video(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            VideoUpdateParameters {
                assets: None,
                new_meta: None,
            }
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::VideoUpdated(
                ContentActor::Member(FIRST_MEMBER_ID),
                video_id,
                VideoUpdateParameters {
                    assets: None,
                    new_meta: None,
                }
            ))
        );

        assert_ok!(Content::delete_video(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::VideoDeleted(
                ContentActor::Member(FIRST_MEMBER_ID),
                video_id
            ))
        );

        // Member cannot create video in a channel they do not own
        assert!(Content::create_video(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            ContentActor::Member(SECOND_MEMBER_ID),
            channel_id,
            VideoCreationParameters {
                assets: vec![],
                meta: vec![],
            }
        )
        .is_err());

        // Member cannot update video in a channel they do not own
        assert!(Content::update_video(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            ContentActor::Member(SECOND_MEMBER_ID),
            video_id,
            VideoUpdateParameters {
                assets: None,
                new_meta: None,
            }
        )
        .is_err());

        // Member cannot delete video in a channel they do not own
        assert!(Content::delete_video(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            ContentActor::Member(SECOND_MEMBER_ID),
            video_id
        )
        .is_err());
    })
}
