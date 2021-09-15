#![cfg(test)]

use super::curators;
use super::mock::*;
use crate::sp_api_hidden_includes_decl_storage::hidden_include::traits::Currency;
use crate::*;
use frame_support::{assert_err, assert_ok};

fn create_member_channel() -> ChannelId {
    let channel_id = Content::next_channel_id();

    // Member can create the channel
    assert_ok!(Content::create_channel(
        Origin::signed(FIRST_MEMBER_ORIGIN),
        ContentActor::Member(FIRST_MEMBER_ID),
        ChannelCreationParametersRecord {
            assets: NewAssets::<Test>::Urls(vec![]),
            meta: vec![],
            reward_account: None,
        }
    ));

    channel_id
}

#[test]
fn video_creation_successful() {
    with_default_mock_builder(|| {
        run_to_block(1);

        // depositi initial balance
        let _ = balances::Module::<Test>::deposit_creating(
            &FIRST_MEMBER_ORIGIN,
            <Test as balances::Trait>::Balance::from(100u32),
        );

        let channel_id = NextChannelId::<Test>::get();

        create_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            ChannelCreationParametersRecord {
                assets: NewAssets::<Test>::Urls(vec![]),
                meta: vec![],
                reward_account: None,
            },
            Ok(()),
        );

        let params = VideoCreationParametersRecord {
            assets: NewAssets::<Test>::Upload(CreationUploadParameters {
                authentication_key: b"test".to_vec(),
                object_creation_list: vec![
                    DataObjectCreationParameters {
                        size: 3,
                        ipfs_content_id: b"first".to_vec(),
                    },
                    DataObjectCreationParameters {
                        size: 3,
                        ipfs_content_id: b"second".to_vec(),
                    },
                    DataObjectCreationParameters {
                        size: 3,
                        ipfs_content_id: b"third".to_vec(),
                    },
                ],
                expected_data_size_fee: storage::DataObjectPerMegabyteFee::<Test>::get(),
            }),
            meta: b"test".to_vec(),
        };

        create_video_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            channel_id,
            params,
            Ok(()),
        )
    })
}

#[test]
fn video_update_successful() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let _ = balances::Module::<Test>::deposit_creating(
            &FIRST_MEMBER_ORIGIN,
            <Test as balances::Trait>::Balance::from(100u32),
        );

        let channel_id = NextChannelId::<Test>::get();

        create_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            ChannelCreationParametersRecord {
                assets: NewAssets::<Test>::Urls(vec![]),
                meta: vec![],
                reward_account: None,
            },
            Ok(()),
        );

        let params = VideoCreationParametersRecord {
            assets: NewAssets::<Test>::Upload(CreationUploadParameters {
                authentication_key: b"test".to_vec(),
                object_creation_list: vec![
                    DataObjectCreationParameters {
                        size: 3,
                        ipfs_content_id: b"first".to_vec(),
                    },
                    DataObjectCreationParameters {
                        size: 3,
                        ipfs_content_id: b"second".to_vec(),
                    },
                    DataObjectCreationParameters {
                        size: 3,
                        ipfs_content_id: b"third".to_vec(),
                    },
                ],
                expected_data_size_fee: storage::DataObjectPerMegabyteFee::<Test>::get(),
            }),
            meta: b"test".to_vec(),
        };

        let video_id = Content::next_video_id();

        create_video_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            channel_id,
            params,
            Ok(()),
        );

        let update_params = VideoUpdateParametersRecord {
            assets: Some(NewAssets::<Test>::Upload(CreationUploadParameters {
                authentication_key: b"test".to_vec(),
                object_creation_list: vec![DataObjectCreationParameters {
                    size: 3,
                    ipfs_content_id: b"first".to_vec(),
                }],
                expected_data_size_fee: storage::DataObjectPerMegabyteFee::<Test>::get(),
            })),
            new_meta: None,
        };

        update_video_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            update_params,
            Ok(()),
        );
    })
}

#[test]
fn member_can_create_videos() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);
        let channel_id = create_member_channel();

        let video_id = Content::next_video_id();
        assert_ok!(Content::create_video(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            channel_id,
            VideoCreationParametersRecord {
                assets: NewAssets::<Test>::Urls(vec![b"https://somewhere.com/".to_vec()]),
                meta: b"metablob".to_vec(),
            }
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::VideoCreated(
                ContentActor::Member(FIRST_MEMBER_ID),
                channel_id,
                video_id,
                VideoCreationParametersRecord {
                    assets: NewAssets::<Test>::Urls(vec![b"https://somewhere.com/".to_vec()]),
                    meta: b"metablob".to_vec(),
                }
            ))
        );

        // Video is created in correct channel
        let video = Content::video_by_id(video_id);
        assert_eq!(channel_id, video.in_channel);

        // Can update own video
        assert_ok!(Content::update_video(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            VideoUpdateParametersRecord {
                assets: Some(NewAssets::<Test>::Urls(vec![
                    b"https://somewhere-else.com/".to_vec()
                ])),
                new_meta: Some(b"newmetablob".to_vec()),
            }
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::VideoUpdated(
                ContentActor::Member(FIRST_MEMBER_ID),
                video_id,
                VideoUpdateParametersRecord {
                    assets: Some(NewAssets::<Test>::Urls(vec![
                        b"https://somewhere-else.com/".to_vec()
                    ])),
                    new_meta: Some(b"newmetablob".to_vec()),
                }
            ))
        );

        // Member cannot create video in a channel they do not own
        assert_err!(
            Content::create_video(
                Origin::signed(SECOND_MEMBER_ORIGIN),
                ContentActor::Member(SECOND_MEMBER_ID),
                channel_id,
                VideoCreationParametersRecord {
                    assets: NewAssets::<Test>::Urls(vec![]),
                    meta: vec![],
                }
            ),
            Error::<Test>::ActorNotAuthorized
        );

        // Member cannot update video in a channel they do not own
        assert_err!(
            Content::update_video(
                Origin::signed(SECOND_MEMBER_ORIGIN),
                ContentActor::Member(SECOND_MEMBER_ID),
                video_id,
                VideoUpdateParametersRecord {
                    assets: None,
                    new_meta: None,
                }
            ),
            Error::<Test>::ActorNotAuthorized
        );

        // Member cannot delete video in a channel they do not own
        assert_err!(
            Content::delete_video(
                Origin::signed(SECOND_MEMBER_ORIGIN),
                ContentActor::Member(SECOND_MEMBER_ID),
                video_id
            ),
            Error::<Test>::ActorNotAuthorized
        );

        // Owner can delete their video
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
    })
}

#[test]
fn curators_can_censor_videos() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);
        let channel_id = create_member_channel();

        let video_id = Content::next_video_id();
        assert_ok!(Content::create_video(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            channel_id,
            VideoCreationParametersRecord {
                assets: NewAssets::<Test>::Urls(vec![b"https://somewhere.com/".to_vec()]),
                meta: b"metablob".to_vec(),
            }
        ));

        let group_id = curators::add_curator_to_new_group(FIRST_CURATOR_ID);

        // Curator can censor videos
        let is_censored = true;
        assert_ok!(Content::update_video_censorship_status(
            Origin::signed(FIRST_CURATOR_ORIGIN),
            ContentActor::Curator(group_id, FIRST_CURATOR_ID),
            video_id,
            is_censored,
            vec![]
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::VideoCensorshipStatusUpdated(
                ContentActor::Curator(group_id, FIRST_CURATOR_ID),
                video_id,
                is_censored,
                vec![]
            ))
        );

        let video = Content::video_by_id(video_id);

        assert!(video.is_censored);

        // Curator can un-censor videos
        let is_censored = false;
        assert_ok!(Content::update_video_censorship_status(
            Origin::signed(FIRST_CURATOR_ORIGIN),
            ContentActor::Curator(group_id, FIRST_CURATOR_ID),
            video_id,
            is_censored,
            vec![]
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::VideoCensorshipStatusUpdated(
                ContentActor::Curator(group_id, FIRST_CURATOR_ID),
                video_id,
                is_censored,
                vec![]
            ))
        );

        let video = Content::video_by_id(video_id);

        assert!(!video.is_censored);

        // Members cannot censor videos
        assert_err!(
            Content::update_video_censorship_status(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                ContentActor::Member(FIRST_MEMBER_ORIGIN),
                channel_id,
                true,
                vec![]
            ),
            Error::<Test>::ActorNotAuthorized
        );
    })
}

#[test]
fn featured_videos() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        // Lead can update curator owned channels
        assert_ok!(Content::set_featured_videos(
            Origin::signed(LEAD_ORIGIN),
            ContentActor::Lead,
            vec![1, 2, 3]
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::FeaturedVideosSet(
                ContentActor::Lead,
                vec![1, 2, 3]
            ))
        );

        assert_err!(
            Content::set_featured_videos(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                ContentActor::Member(FIRST_MEMBER_ID),
                vec![1, 2, 3]
            ),
            Error::<Test>::ActorNotAuthorized
        );
    })
}
