#![cfg(test)]
use super::curators;
use super::mock::*;
use crate::*;
use frame_support::traits::Currency;
use frame_support::{assert_err, assert_ok};

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
                assets: None,
                meta: None,
                reward_account: None,
                collaborators: BTreeSet::new(),
            },
            Ok(()),
        );

        let params = get_video_creation_parameters();

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
                assets: None,
                meta: None,
                reward_account: None,
                collaborators: BTreeSet::new(),
            },
            Ok(()),
        );

        let params = get_video_creation_parameters();

        let video_id = Content::next_video_id();

        let first_obj_id = Storage::<Test>::next_data_object_id();

        create_video_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            channel_id,
            params,
            Ok(()),
        );

        // add 1 asset
        let update_params = VideoUpdateParametersRecord {
            assets_to_upload: Some(StorageAssetsRecord {
                object_creation_list: vec![DataObjectCreationParameters {
                    size: 3,
                    ipfs_content_id: b"first".to_vec(),
                }],
                expected_data_size_fee: storage::DataObjectPerMegabyteFee::<Test>::get(),
            }),
            new_meta: None,
            assets_to_remove: BTreeSet::new(),
        };

        let last_obj_id = Storage::<Test>::next_data_object_id();

        update_video_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            update_params,
            Ok(()),
        );

        // remove all assets from the channel the video is in
        update_video_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            VideoUpdateParametersRecord {
                assets_to_upload: None,
                new_meta: None,
                assets_to_remove: (first_obj_id..last_obj_id).collect::<BTreeSet<_>>(),
            },
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
                assets: None,
                meta: None,
            }
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::VideoCreated(
                ContentActor::Member(FIRST_MEMBER_ID),
                channel_id,
                video_id,
                VideoCreationParametersRecord {
                    assets: None,
                    meta: None,
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
                assets_to_upload: None,
                new_meta: None,
                assets_to_remove: BTreeSet::new(),
            },
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::VideoUpdated(
                ContentActor::Member(FIRST_MEMBER_ID),
                video_id,
                VideoUpdateParametersRecord {
                    assets_to_upload: None,
                    new_meta: None,
                    assets_to_remove: BTreeSet::new(),
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
                    assets: None,
                    meta: None,
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
                    assets_to_upload: None,
                    new_meta: None,
                    assets_to_remove: BTreeSet::new(),
                },
            ),
            Error::<Test>::ActorNotAuthorized
        );

        // Member cannot delete video in a channel they do not own
        assert_err!(
            Content::delete_video(
                Origin::signed(SECOND_MEMBER_ORIGIN),
                ContentActor::Member(SECOND_MEMBER_ID),
                video_id,
                BTreeSet::new(),
            ),
            Error::<Test>::ActorNotAuthorized
        );

        // Owner can delete their video
        assert_ok!(Content::delete_video(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            BTreeSet::new(),
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
fn delete_video_nft_is_issued() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);
        let channel_id = create_member_channel();

        let video_id = Content::next_video_id();

        // Create a video
        assert_ok!(Content::create_video(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            channel_id,
            VideoCreationParametersRecord {
                assets: None,
                meta: None,
            }
        ));

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            None,
            b"metablob".to_vec(),
            None
        ));

        // Make an attempt to delete a video, which has an nft issued already.
        assert_err!(
            Content::delete_video(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                ContentActor::Member(FIRST_MEMBER_ID),
                video_id,
                BTreeSet::new(),
            ),
            Error::<Test>::NFTAlreadyExists
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
                assets: None,
                meta: None,
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

#[test]
fn non_authorized_collaborators_cannot_add_video() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        helper_init_accounts(vec![FIRST_MEMBER_ORIGIN, COLLABORATOR_MEMBER_ORIGIN]);

        // create channel
        create_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            ChannelCreationParametersRecord {
                assets: Some(helper_generate_storage_assets(vec![2, 3])),
                meta: None,
                reward_account: None,
                collaborators: BTreeSet::new(),
            },
            Ok(()),
        );

        create_video_mock(
            COLLABORATOR_MEMBER_ORIGIN,
            ContentActor::Collaborator(COLLABORATOR_MEMBER_ID),
            <Test as storage::Trait>::ChannelId::one(),
            VideoCreationParametersRecord {
                assets: Some(helper_generate_storage_assets(vec![1, 2])),
                meta: None,
            },
            Err(Error::<Test>::ActorNotAuthorized.into()),
        );
    })
}

#[test]
fn non_authorized_collaborators_cannot_update_video() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        helper_init_accounts(vec![FIRST_MEMBER_ORIGIN, COLLABORATOR_MEMBER_ORIGIN]);

        // create channel
        create_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            ChannelCreationParametersRecord {
                assets: Some(helper_generate_storage_assets(vec![2, 3])),
                meta: None,
                reward_account: None,
                collaborators: BTreeSet::new(),
            },
            Ok(()),
        );

        // create video
        create_video_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            <Test as storage::Trait>::ChannelId::one(),
            VideoCreationParametersRecord {
                assets: Some(helper_generate_storage_assets(vec![1, 2])),
                meta: None,
            },
            Ok(()),
        );

        update_video_mock(
            COLLABORATOR_MEMBER_ORIGIN,
            ContentActor::Collaborator(COLLABORATOR_MEMBER_ID),
            <Test as Trait>::VideoId::one(),
            VideoUpdateParametersRecord {
                assets_to_upload: Some(helper_generate_storage_assets(vec![5])),
                new_meta: None,
                assets_to_remove: vec![DataObjectId::<Test>::one()]
                    .into_iter()
                    .collect::<BTreeSet<_>>(),
            },
            Err(Error::<Test>::ActorNotAuthorized.into()),
        );
    })
}

#[test]
fn non_authorized_collaborators_cannot_delete_video() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        helper_init_accounts(vec![FIRST_MEMBER_ORIGIN, COLLABORATOR_MEMBER_ORIGIN]);

        // create channel
        create_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            ChannelCreationParametersRecord {
                assets: Some(helper_generate_storage_assets(vec![2, 3])),
                meta: None,
                reward_account: None,
                collaborators: BTreeSet::new(),
            },
            Ok(()),
        );

        // create video
        create_video_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            <Test as storage::Trait>::ChannelId::one(),
            VideoCreationParametersRecord {
                assets: Some(helper_generate_storage_assets(vec![1, 2])),
                meta: None,
            },
            Ok(()),
        );

        delete_video_mock(
            COLLABORATOR_MEMBER_ORIGIN,
            ContentActor::Collaborator(COLLABORATOR_MEMBER_ID),
            <Test as Trait>::VideoId::one(),
            vec![
                DataObjectId::<Test>::one(),
                DataObjectId::<Test>::from(2u64),
            ]
            .into_iter()
            .collect::<BTreeSet<_>>(),
            Err(Error::<Test>::ActorNotAuthorized.into()),
        );
    })
}

#[test]
fn authorized_collaborators_can_add_video() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        helper_init_accounts(vec![FIRST_MEMBER_ORIGIN, COLLABORATOR_MEMBER_ORIGIN]);

        // create channel
        create_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            ChannelCreationParametersRecord {
                assets: Some(helper_generate_storage_assets(vec![2, 3])),
                meta: None,
                reward_account: None,
                collaborators: vec![COLLABORATOR_MEMBER_ID]
                    .into_iter()
                    .collect::<BTreeSet<_>>(),
            },
            Ok(()),
        );

        create_video_mock(
            COLLABORATOR_MEMBER_ORIGIN,
            ContentActor::Collaborator(COLLABORATOR_MEMBER_ID),
            <Test as storage::Trait>::ChannelId::one(),
            VideoCreationParametersRecord {
                assets: Some(helper_generate_storage_assets(vec![1, 2])),
                meta: None,
            },
            Ok(()),
        );
    })
}

#[test]
fn authorized_collaborators_can_update_video() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        helper_init_accounts(vec![FIRST_MEMBER_ORIGIN, COLLABORATOR_MEMBER_ORIGIN]);

        // create channel
        create_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            ChannelCreationParametersRecord {
                assets: Some(helper_generate_storage_assets(vec![2, 3])),
                meta: None,
                reward_account: None,
                collaborators: vec![COLLABORATOR_MEMBER_ID]
                    .into_iter()
                    .collect::<BTreeSet<_>>(),
            },
            Ok(()),
        );

        // create video
        create_video_mock(
            COLLABORATOR_MEMBER_ORIGIN,
            ContentActor::Collaborator(COLLABORATOR_MEMBER_ID),
            <Test as storage::Trait>::ChannelId::one(),
            VideoCreationParametersRecord {
                assets: Some(helper_generate_storage_assets(vec![1, 2])),
                meta: None,
            },
            Ok(()),
        );

        update_video_mock(
            COLLABORATOR_MEMBER_ORIGIN,
            ContentActor::Collaborator(COLLABORATOR_MEMBER_ID),
            <Test as Trait>::VideoId::one(),
            VideoUpdateParametersRecord {
                assets_to_upload: Some(helper_generate_storage_assets(vec![5])),
                new_meta: None,
                assets_to_remove: vec![DataObjectId::<Test>::one()]
                    .into_iter()
                    .collect::<BTreeSet<_>>(),
            },
            Ok(()),
        );
    })
}

#[test]
fn authorized_collaborators_can_delete_video() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        helper_init_accounts(vec![FIRST_MEMBER_ORIGIN, COLLABORATOR_MEMBER_ORIGIN]);

        // create channel
        create_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            ChannelCreationParametersRecord {
                assets: Some(helper_generate_storage_assets(vec![2, 3])),
                meta: None,
                reward_account: None,
                collaborators: vec![COLLABORATOR_MEMBER_ID]
                    .into_iter()
                    .collect::<BTreeSet<_>>(),
            },
            Ok(()),
        );

        // create video
        create_video_mock(
            COLLABORATOR_MEMBER_ORIGIN,
            ContentActor::Collaborator(COLLABORATOR_MEMBER_ID),
            <Test as storage::Trait>::ChannelId::one(),
            VideoCreationParametersRecord {
                assets: Some(helper_generate_storage_assets(vec![1, 2])),
                meta: None,
            },
            Ok(()),
        );

        println!("videoevent {:?}", System::events().last().unwrap().event);

        delete_video_mock(
            COLLABORATOR_MEMBER_ORIGIN,
            ContentActor::Collaborator(COLLABORATOR_MEMBER_ID),
            <Test as Trait>::VideoId::one(),
            vec![
                DataObjectId::<Test>::one(),
                DataObjectId::<Test>::from(2u64),
            ]
            .into_iter()
            .collect::<BTreeSet<_>>(),
            Ok(()),
        );
    })
}
