#![cfg(test)]
use super::curators;
use super::fixtures::*;
use super::mock::*;
use crate::*;

// #[test]
// fn video_creation_successful() {
//     with_default_mock_builder(|| {
//         run_to_block(1);

//         create_initial_storage_buckets();

//         // depositi initial balance
//         let _ = balances::Module::<Test>::deposit_creating(
//             &FIRST_MEMBER_ORIGIN,
//             <Test as balances::Trait>::Balance::from(INITIAL_BALANCE),
//         );

//         let channel_id = NextChannelId::<Test>::get();

//         create_initial_storage_buckets();

//         create_channel_with_bag();

//         let params = VideoCreationParametersRecord {
//             assets: Some(StorageAssetsRecord {
//                 object_creation_list: vec![
//                     DataObjectCreationParameters {
//                         size: 3,
//                         ipfs_content_id: b"first".to_vec(),
//                     },
//                     DataObjectCreationParameters {
//                         size: 3,
//                         ipfs_content_id: b"second".to_vec(),
//                     },
//                     DataObjectCreationParameters {
//                         size: 3,
//                         ipfs_content_id: b"third".to_vec(),
//                     },
//                 ],
//                 expected_data_size_fee: storage::DataObjectPerMegabyteFee::<Test>::get(),
//             }),
//             meta: Some(b"test".to_vec()),
//         };

//         create_video_mock(
//             FIRST_MEMBER_ORIGIN,
//             ContentActor::Member(FIRST_MEMBER_ID),
//             channel_id,
//             params,
//             Ok(()),
//         )
//     })
// }

// #[test]
// fn video_update_successful() {
//     with_default_mock_builder(|| {
//         run_to_block(1);

//         create_initial_storage_buckets();
//         let _ = balances::Module::<Test>::deposit_creating(
//             &FIRST_MEMBER_ORIGIN,
//             <Test as balances::Trait>::Balance::from(INITIAL_BALANCE),
//         );

//         let channel_id = NextChannelId::<Test>::get();

//         create_channel_with_bag();

//         // create video with 3 assets
//         let params = VideoCreationParametersRecord {
//             assets: Some(StorageAssetsRecord {
//                 object_creation_list: vec![
//                     DataObjectCreationParameters {
//                         size: 3,
//                         ipfs_content_id: b"first".to_vec(),
//                     },
//                     DataObjectCreationParameters {
//                         size: 3,
//                         ipfs_content_id: b"second".to_vec(),
//                     },
//                     DataObjectCreationParameters {
//                         size: 3,
//                         ipfs_content_id: b"third".to_vec(),
//                     },
//                 ],
//                 expected_data_size_fee: storage::DataObjectPerMegabyteFee::<Test>::get(),
//             }),
//             meta: Some(b"test".to_vec()),
//         };

//         let video_id = Content::next_video_id();

//         let first_obj_id = Storage::<Test>::next_data_object_id();

//         create_video_mock(
//             FIRST_MEMBER_ORIGIN,
//             ContentActor::Member(FIRST_MEMBER_ID),
//             channel_id,
//             params,
//             Ok(()),
//         );

//         // add 1 asset
//         let update_params = VideoUpdateParametersRecord {
//             assets_to_upload: Some(StorageAssetsRecord {
//                 object_creation_list: vec![DataObjectCreationParameters {
//                     size: 3,
//                     ipfs_content_id: b"first".to_vec(),
//                 }],
//                 expected_data_size_fee: storage::DataObjectPerMegabyteFee::<Test>::get(),
//             }),
//             new_meta: None,
//             assets_to_remove: BTreeSet::new(),
//         };

//         let last_obj_id = Storage::<Test>::next_data_object_id();

//         update_video_mock(
//             FIRST_MEMBER_ORIGIN,
//             ContentActor::Member(FIRST_MEMBER_ID),
//             video_id,
//             update_params,
//             Ok(()),
//         );

//         // remove all assets from the channel the video is in
//         update_video_mock(
//             FIRST_MEMBER_ORIGIN,
//             ContentActor::Member(FIRST_MEMBER_ID),
//             video_id,
//             VideoUpdateParametersRecord {
//                 assets_to_upload: None,
//                 new_meta: None,
//                 assets_to_remove: (first_obj_id..last_obj_id).collect::<BTreeSet<_>>(),
//             },
//             Ok(()),
//         );
//     })
// }

// #[test]
// fn member_can_create_videos() {
//     with_default_mock_builder(|| {
//         // Run to block one to see emitted events
//         run_to_block(1);
//         let channel_id = create_member_channel();

//         let video_id = Content::next_video_id();
//         assert_ok!(Content::create_video(
//             Origin::signed(FIRST_MEMBER_ORIGIN),
//             ContentActor::Member(FIRST_MEMBER_ID),
//             channel_id,
//             VideoCreationParametersRecord {
//                 assets: None,
//                 meta: None,
//             }
//         ));

//         assert_eq!(
//             System::events().last().unwrap().event,
//             MetaEvent::content(RawEvent::VideoCreated(
//                 ContentActor::Member(FIRST_MEMBER_ID),
//                 channel_id,
//                 video_id,
//                 VideoCreationParametersRecord {
//                     assets: None,
//                     meta: None,
//                 }
//             ))
//         );

//         // Video is created in correct channel
//         let video = Content::video_by_id(video_id);
//         assert_eq!(channel_id, video.in_channel);

//         // Can update own video
//         assert_ok!(Content::update_video(
//             Origin::signed(FIRST_MEMBER_ORIGIN),
//             ContentActor::Member(FIRST_MEMBER_ID),
//             video_id,
//             VideoUpdateParametersRecord {
//                 assets_to_upload: None,
//                 new_meta: None,
//                 assets_to_remove: BTreeSet::new(),
//             },
//         ));

//         assert_eq!(
//             System::events().last().unwrap().event,
//             MetaEvent::content(RawEvent::VideoUpdated(
//                 ContentActor::Member(FIRST_MEMBER_ID),
//                 video_id,
//                 VideoUpdateParametersRecord {
//                     assets_to_upload: None,
//                     new_meta: None,
//                     assets_to_remove: BTreeSet::new(),
//                 }
//             ))
//         );

//         // Member cannot create video in a channel they do not own
//         assert_err!(
//             Content::create_video(
//                 Origin::signed(SECOND_MEMBER_ORIGIN),
//                 ContentActor::Member(SECOND_MEMBER_ID),
//                 channel_id,
//                 VideoCreationParametersRecord {
//                     assets: None,
//                     meta: None,
//                 }
//             ),
//             Error::<Test>::ActorNotAuthorized
//         );

//         // Member cannot update video in a channel they do not own
//         assert_err!(
//             Content::update_video(
//                 Origin::signed(SECOND_MEMBER_ORIGIN),
//                 ContentActor::Member(SECOND_MEMBER_ID),
//                 video_id,
//                 VideoUpdateParametersRecord {
//                     assets_to_upload: None,
//                     new_meta: None,
//                     assets_to_remove: BTreeSet::new(),
//                 },
//             ),
//             Error::<Test>::ActorNotAuthorized
//         );

//         // Member cannot delete video in a channel they do not own
//         assert_err!(
//             Content::delete_video(
//                 Origin::signed(SECOND_MEMBER_ORIGIN),
//                 ContentActor::Member(SECOND_MEMBER_ID),
//                 video_id,
//                 BTreeSet::new(),
//             ),
//             Error::<Test>::ActorNotAuthorized
//         );

//         // Owner can delete their video
//         assert_ok!(Content::delete_video(
//             Origin::signed(FIRST_MEMBER_ORIGIN),
//             ContentActor::Member(FIRST_MEMBER_ID),
//             video_id,
//             BTreeSet::new(),
//         ));

//         assert_eq!(
//             System::events().last().unwrap().event,
//             MetaEvent::content(RawEvent::VideoDeleted(
//                 ContentActor::Member(FIRST_MEMBER_ID),
//                 video_id
//             ))
//         );
//     })
// }

// #[test]
// fn curators_can_censor_videos() {
//     with_default_mock_builder(|| {
//         // Run to block one to see emitted events
//         run_to_block(1);
//         let channel_id = create_member_channel();

//         let video_id = Content::next_video_id();
//         assert_ok!(Content::create_video(
//             Origin::signed(FIRST_MEMBER_ORIGIN),
//             ContentActor::Member(FIRST_MEMBER_ID),
//             channel_id,
//             VideoCreationParametersRecord {
//                 assets: None,
//                 meta: None,
//             }
//         ));

//         let group_id = curators::add_curator_to_new_group(FIRST_CURATOR_ID);

//         // Curator can censor videos
//         let is_censored = true;
//         assert_ok!(Content::update_video_censorship_status(
//             Origin::signed(FIRST_CURATOR_ORIGIN),
//             ContentActor::Curator(group_id, FIRST_CURATOR_ID),
//             video_id,
//             is_censored,
//             vec![]
//         ));

//         assert_eq!(
//             System::events().last().unwrap().event,
//             MetaEvent::content(RawEvent::VideoCensorshipStatusUpdated(
//                 ContentActor::Curator(group_id, FIRST_CURATOR_ID),
//                 video_id,
//                 is_censored,
//                 vec![]
//             ))
//         );

//         let video = Content::video_by_id(video_id);

//         assert!(video.is_censored);

//         // Curator can un-censor videos
//         let is_censored = false;
//         assert_ok!(Content::update_video_censorship_status(
//             Origin::signed(FIRST_CURATOR_ORIGIN),
//             ContentActor::Curator(group_id, FIRST_CURATOR_ID),
//             video_id,
//             is_censored,
//             vec![]
//         ));

//         assert_eq!(
//             System::events().last().unwrap().event,
//             MetaEvent::content(RawEvent::VideoCensorshipStatusUpdated(
//                 ContentActor::Curator(group_id, FIRST_CURATOR_ID),
//                 video_id,
//                 is_censored,
//                 vec![]
//             ))
//         );

//         let video = Content::video_by_id(video_id);

//         assert!(!video.is_censored);

//         // Members cannot censor videos
//         assert_err!(
//             Content::update_video_censorship_status(
//                 Origin::signed(FIRST_MEMBER_ORIGIN),
//                 ContentActor::Member(FIRST_MEMBER_ORIGIN),
//                 channel_id,
//                 true,
//                 vec![]
//             ),
//             Error::<Test>::ActorNotAuthorized
//         );
//     })
// }

// #[test]
// fn featured_videos() {
//     with_default_mock_builder(|| {
//         // Run to block one to see emitted events
//         run_to_block(1);

//         // Lead can update curator owned channels
//         assert_ok!(Content::set_featured_videos(
//             Origin::signed(LEAD_ORIGIN),
//             ContentActor::Lead,
//             vec![1, 2, 3]
//         ));

//         assert_eq!(
//             System::events().last().unwrap().event,
//             MetaEvent::content(RawEvent::FeaturedVideosSet(
//                 ContentActor::Lead,
//                 vec![1, 2, 3]
//             ))
//         );

//         assert_err!(
//             Content::set_featured_videos(
//                 Origin::signed(FIRST_MEMBER_ORIGIN),
//                 ContentActor::Member(FIRST_MEMBER_ID),
//                 vec![1, 2, 3]
//             ),
//             Error::<Test>::ActorNotAuthorized
//         );
//     })
// }

// #[test]
// fn non_authorized_collaborators_cannot_add_video() {
//     with_default_mock_builder(|| {
//         // Run to block one to see emitted events
//         run_to_block(1);

//         create_initial_storage_buckets();

//         helper_init_accounts(vec![FIRST_MEMBER_ORIGIN, COLLABORATOR_MEMBER_ACCOUNT_ID]);

//         // create channel
//         create_channel_mock(
//             FIRST_MEMBER_ORIGIN,
//             ContentActor::Member(FIRST_MEMBER_ID),
//             ChannelCreationParametersRecord {
//                 assets: Some(helper_generate_storage_assets(vec![2, 3])),
//                 meta: None,
//                 reward_account: None,
//                 collaborators: BTreeSet::new(),
//             },
//             Ok(()),
//         );

//         create_video_mock(
//             COLLABORATOR_MEMBER_ACCOUNT_ID,
//             ContentActor::Collaborator(COLLABORATOR_MEMBER_ID),
//             <Test as storage::Trait>::ChannelId::one(),
//             VideoCreationParametersRecord {
//                 assets: Some(helper_generate_storage_assets(vec![1, 2])),
//                 meta: None,
//             },
//             Err(Error::<Test>::ActorNotAuthorized.into()),
//         );
//     })
// }

// #[test]
// fn non_authorized_collaborators_cannot_update_video() {
//     with_default_mock_builder(|| {
//         // Run to block one to see emitted events
//         run_to_block(1);

//         helper_init_accounts(vec![FIRST_MEMBER_ORIGIN, COLLABORATOR_MEMBER_ACCOUNT_ID]);

//         create_initial_storage_buckets();
//         // create channel
//         create_channel_mock(
//             FIRST_MEMBER_ORIGIN,
//             ContentActor::Member(FIRST_MEMBER_ID),
//             ChannelCreationParametersRecord {
//                 assets: Some(helper_generate_storage_assets(vec![2, 3])),
//                 meta: None,
//                 reward_account: None,
//                 collaborators: BTreeSet::new(),
//             },
//             Ok(()),
//         );

//         // create video
//         create_video_mock(
//             FIRST_MEMBER_ORIGIN,
//             ContentActor::Member(FIRST_MEMBER_ID),
//             <Test as storage::Trait>::ChannelId::one(),
//             VideoCreationParametersRecord {
//                 assets: Some(helper_generate_storage_assets(vec![1, 2])),
//                 meta: None,
//             },
//             Ok(()),
//         );

//         update_video_mock(
//             COLLABORATOR_MEMBER_ACCOUNT_ID,
//             ContentActor::Collaborator(COLLABORATOR_MEMBER_ID),
//             <Test as Trait>::VideoId::one(),
//             VideoUpdateParametersRecord {
//                 assets_to_upload: Some(helper_generate_storage_assets(vec![5])),
//                 new_meta: None,
//                 assets_to_remove: vec![DataObjectId::<Test>::one()]
//                     .into_iter()
//                     .collect::<BTreeSet<_>>(),
//             },
//             Err(Error::<Test>::ActorNotAuthorized.into()),
//         );
//     })
// }

// #[test]
// fn non_authorized_collaborators_cannot_delete_video() {
//     with_default_mock_builder(|| {
//         // Run to block one to see emitted events
//         run_to_block(1);

//         helper_init_accounts(vec![FIRST_MEMBER_ORIGIN, COLLABORATOR_MEMBER_ACCOUNT_ID]);

//         create_initial_storage_buckets();
//         // create channel
//         create_channel_mock(
//             FIRST_MEMBER_ORIGIN,
//             ContentActor::Member(FIRST_MEMBER_ID),
//             ChannelCreationParametersRecord {
//                 assets: Some(helper_generate_storage_assets(vec![2, 3])),
//                 meta: None,
//                 reward_account: None,
//                 collaborators: BTreeSet::new(),
//             },
//             Ok(()),
//         );

//         // create video
//         create_video_mock(
//             FIRST_MEMBER_ORIGIN,
//             ContentActor::Member(FIRST_MEMBER_ID),
//             <Test as storage::Trait>::ChannelId::one(),
//             VideoCreationParametersRecord {
//                 assets: Some(helper_generate_storage_assets(vec![1, 2])),
//                 meta: None,
//             },
//             Ok(()),
//         );

//         delete_video_mock(
//             COLLABORATOR_MEMBER_ACCOUNT_ID,
//             ContentActor::Collaborator(COLLABORATOR_MEMBER_ID),
//             <Test as Trait>::VideoId::one(),
//             vec![
//                 DataObjectId::<Test>::one(),
//                 DataObjectId::<Test>::from(2u64),
//             ]
//             .into_iter()
//             .collect::<BTreeSet<_>>(),
//             Err(Error::<Test>::ActorNotAuthorized.into()),
//         );
//     })
// }

// #[test]
// fn authorized_collaborators_can_add_video() {
//     with_default_mock_builder(|| {
//         // Run to block one to see emitted events
//         run_to_block(1);

//         helper_init_accounts(vec![FIRST_MEMBER_ORIGIN, COLLABORATOR_MEMBER_ACCOUNT_ID]);

//         create_initial_storage_buckets();
//         // create channel
//         create_channel_mock(
//             FIRST_MEMBER_ORIGIN,
//             ContentActor::Member(FIRST_MEMBER_ID),
//             ChannelCreationParametersRecord {
//                 assets: Some(helper_generate_storage_assets(vec![2, 3])),
//                 meta: None,
//                 reward_account: None,
//                 collaborators: vec![COLLABORATOR_MEMBER_ID]
//                     .into_iter()
//                     .collect::<BTreeSet<_>>(),
//             },
//             Ok(()),
//         );

//         create_video_mock(
//             COLLABORATOR_MEMBER_ACCOUNT_ID,
//             ContentActor::Collaborator(COLLABORATOR_MEMBER_ID),
//             <Test as storage::Trait>::ChannelId::one(),
//             VideoCreationParametersRecord {
//                 assets: Some(helper_generate_storage_assets(vec![1, 2])),
//                 meta: None,
//             },
//             Ok(()),
//         );
//     })
// }

// #[test]
// fn authorized_collaborators_can_update_video() {
//     with_default_mock_builder(|| {
//         // Run to block one to see emitted events
//         run_to_block(1);

//         helper_init_accounts(vec![FIRST_MEMBER_ORIGIN, COLLABORATOR_MEMBER_ACCOUNT_ID]);

//         create_initial_storage_buckets();

//         // create channel
//         create_channel_mock(
//             FIRST_MEMBER_ORIGIN,
//             ContentActor::Member(FIRST_MEMBER_ID),
//             ChannelCreationParametersRecord {
//                 assets: Some(helper_generate_storage_assets(vec![2, 3])),
//                 meta: None,
//                 reward_account: None,
//                 collaborators: vec![COLLABORATOR_MEMBER_ID]
//                     .into_iter()
//                     .collect::<BTreeSet<_>>(),
//             },
//             Ok(()),
//         );

//         // create video
//         create_video_mock(
//             COLLABORATOR_MEMBER_ACCOUNT_ID,
//             ContentActor::Collaborator(COLLABORATOR_MEMBER_ID),
//             <Test as storage::Trait>::ChannelId::one(),
//             VideoCreationParametersRecord {
//                 assets: Some(helper_generate_storage_assets(vec![1, 2])),
//                 meta: None,
//             },
//             Ok(()),
//         );

//         update_video_mock(
//             COLLABORATOR_MEMBER_ACCOUNT_ID,
//             ContentActor::Collaborator(COLLABORATOR_MEMBER_ID),
//             <Test as Trait>::VideoId::one(),
//             VideoUpdateParametersRecord {
//                 assets_to_upload: Some(helper_generate_storage_assets(vec![5])),
//                 new_meta: None,
//                 assets_to_remove: vec![DataObjectId::<Test>::one()]
//                     .into_iter()
//                     .collect::<BTreeSet<_>>(),
//             },
//             Ok(()),
//         );
//     })
// }

// #[test]
// fn authorized_collaborators_can_delete_video() {
//     with_default_mock_builder(|| {
//         // Run to block one to see emitted events
//         run_to_block(1);

//         helper_init_accounts(vec![FIRST_MEMBER_ORIGIN, COLLABORATOR_MEMBER_ACCOUNT_ID]);

//         create_initial_storage_buckets();
//         // create channel
//         create_channel_mock(
//             FIRST_MEMBER_ORIGIN,
//             ContentActor::Member(FIRST_MEMBER_ID),
//             ChannelCreationParametersRecord {
//                 assets: Some(helper_generate_storage_assets(vec![2, 3])),
//                 meta: None,
//                 reward_account: None,
//                 collaborators: vec![COLLABORATOR_MEMBER_ID]
//                     .into_iter()
//                     .collect::<BTreeSet<_>>(),
//             },
//             Ok(()),
//         );

//         // create video
//         create_video_mock(
//             COLLABORATOR_MEMBER_ACCOUNT_ID,
//             ContentActor::Collaborator(COLLABORATOR_MEMBER_ID),
//             <Test as storage::Trait>::ChannelId::one(),
//             VideoCreationParametersRecord {
//                 assets: Some(helper_generate_storage_assets(vec![1, 2])),
//                 meta: None,
//             },
//             Ok(()),
//         );

//         delete_video_mock(
//             COLLABORATOR_MEMBER_ACCOUNT_ID,
//             ContentActor::Collaborator(COLLABORATOR_MEMBER_ID),
//             <Test as Trait>::VideoId::one(),
//             vec![
//                 DataObjectId::<Test>::one(),
//                 DataObjectId::<Test>::from(2u64),
//             ]
//             .into_iter()
//             .collect::<BTreeSet<_>>(),
//             Ok(()),
//         );
//     })
// }

#[test]
fn successful_video_creation_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        CreateVideoFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_video_creation_by_collaborator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(COLLABORATOR_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        CreateVideoFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Collaborator(COLLABORATOR_MEMBER_ID))
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_video_creation_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        CreateVideoFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_video_creation_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        let default_curator_group_id = NextCuratorGroupId::<Test>::get() - 1;
        CreateVideoFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_video_creation_with_member_auth_failure() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        CreateVideoFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()));
    })
}

#[test]
fn successful_video_creation_with_collaborator_auth_failure() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        CreateVideoFixture::default()
            .with_sender(UNAUTHORIZED_COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Collaborator(COLLABORATOR_MEMBER_ID))
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_video_creation_with_lead_auth_failure() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        CreateVideoFixture::default()
            .with_sender(UNAUTHORIZED_LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_video_creation_with_curator_auth_failure() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        let default_curator_group_id = NextCuratorGroupId::<Test>::get() - 1;
        CreateVideoFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .call_and_assert(Err(Error::<Test>::CuratorAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_video_creation_with_unauth_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        CreateVideoFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(UNAUTHORIZED_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn successful_video_creation_with_unauth_collaborator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(UNAUTHORIZED_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        CreateVideoFixture::default()
            .with_sender(UNAUTHORIZED_COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Collaborator(
                UNAUTHORIZED_COLLABORATOR_MEMBER_ID,
            ))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_video_creation_with_unauth_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(UNAUTHORIZED_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        let unauthorized_curator_group_id =
            curators::add_curator_to_new_group(UNAUTHORIZED_CURATOR_ID);
        CreateVideoFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                unauthorized_curator_group_id,
                UNAUTHORIZED_CURATOR_ID,
            ))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_video_creation_by_lead_with_member_owned_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        CreateVideoFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_video_creation_with_invalid_channel_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        CreateVideoFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_channel_id(Zero::zero())
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));
    })
}

#[test]
fn unsuccessful_video_creation_with_invalid_expected_data_size_fee() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        CreateVideoFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets(StorageAssets::<Test> {
                // setting a purposely high fee to trigger error
                expected_data_size_fee: BalanceOf::<Test>::from(1_000_000u64),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Err(storage::Error::<Test>::DataSizeFeeChanged.into()));
    })
}

#[test]
fn unsuccessful_video_creation_with_insufficient_balance() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();
        slash_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID);

        CreateVideoFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Err(storage::Error::<Test>::InsufficientBalance.into()));
    })
}

#[test]
fn unsuccessful_video_creation_due_to_bucket_having_insufficient_objects_size_left() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        CreateVideoFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: vec![DataObjectCreationParameters {
                    size: STORAGE_BUCKET_OBJECTS_SIZE_LIMIT + 1,
                    ipfs_content_id: vec![1u8],
                }],
            })
            .call_and_assert(Err(
                storage::Error::<Test>::StorageBucketObjectSizeLimitReached.into(),
            ));
    })
}

#[test]
fn unsuccessful_video_creation_due_to_bucket_having_insufficient_objects_number_left() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        CreateVideoFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: (0..(STORAGE_BUCKET_OBJECTS_NUMBER_LIMIT + 1))
                    .map(|_| DataObjectCreationParameters {
                        size: 1,
                        ipfs_content_id: vec![1u8],
                    })
                    .collect(),
            })
            .call_and_assert(Err(
                storage::Error::<Test>::StorageBucketObjectNumberLimitReached.into(),
            ));
    })
}

#[test]
fn unsuccessful_channel_creation_with_max_object_size_limits_exceeded() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        CreateVideoFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: vec![DataObjectCreationParameters {
                    size: VOUCHER_OBJECTS_SIZE_LIMIT + 1,
                    ipfs_content_id: vec![1u8],
                }],
            })
            .call_and_assert(Err(storage::Error::<Test>::MaxDataObjectSizeExceeded.into()));
    })
}
