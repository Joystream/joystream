#![cfg(test)]

use super::curators;
use super::fixtures::*;
use super::mock::*;
use crate::*;

// #[test]
// fn successful_channel_deletion() {
//     with_default_mock_builder(|| {
//         // Run to block one to see emitted events
//         run_to_block(1);

//         create_initial_storage_buckets();

//         // create an account with enought balance
//         let _ = balances::Module::<Test>::deposit_creating(
//             &DEFAULT_MEMBER_ACCOUNT_ID,
//             <Test as balances::Trait>::Balance::from(INITIAL_BALANCE),
//         );

//         // 3 assets added at creation
//         let assets = StorageAssetsRecord {
//             object_creation_list: vec![
//                 DataObjectCreationParameters {
//                     size: 3,
//                     ipfs_content_id: b"first".to_vec(),
//                 },
//                 DataObjectCreationParameters {
//                     size: 3,
//                     ipfs_content_id: b"second".to_vec(),
//                 },
//                 DataObjectCreationParameters {
//                     size: 3,
//                     ipfs_content_id: b"third".to_vec(),
//                 },
//             ],
//             expected_data_size_fee: storage::DataObjectPerMegabyteFee::<Test>::get(),
//         };
//         let channel_id = NextChannelId::<Test>::get();

//         // create channel
//         create_channel_mock(
//             DEFAULT_MEMBER_ACCOUNT_ID,
//             ContentActor::Member(DEFAULT_MEMBER_ID),
//             ChannelCreationParametersRecord {
//                 assets: Some(assets),
//                 meta: None,
//                 reward_account: None,
//                 collaborators: BTreeSet::new(),
//             },
//             Ok(()),
//         );

//         // attempt to delete channel with non zero assets should result in error: objects
//         // are misspecified
//         delete_channel_mock(
//             DEFAULT_MEMBER_ACCOUNT_ID,
//             ContentActor::Member(DEFAULT_MEMBER_ID),
//             channel_id,
//             2u64,
//             Err(Error::<Test>::InvalidBagSizeSpecified.into()),
//         );

//         // successful deletion because we empty the bag first
//         delete_channel_mock(
//             DEFAULT_MEMBER_ACCOUNT_ID,
//             ContentActor::Member(DEFAULT_MEMBER_ID),
//             channel_id,
//             3u64, // now assets are 0
//             Ok(()),
//         );

//         // create a channel with no assets:
//         let empty_channel_id = Content::next_channel_id();
//         create_channel_mock(
//             DEFAULT_MEMBER_ACCOUNT_ID,
//             ContentActor::Member(DEFAULT_MEMBER_ID),
//             ChannelCreationParametersRecord {
//                 assets: None,
//                 meta: None,
//                 reward_account: None,
//                 collaborators: BTreeSet::new(),
//             },
//             Ok(()),
//         );

//         delete_channel_mock(
//             DEFAULT_MEMBER_ACCOUNT_ID,
//             ContentActor::Member(DEFAULT_MEMBER_ID),
//             empty_channel_id,
//             0u64,
//             Ok(()),
//         );
//     })
// }

// #[test]
// fn successful_channel_assets_deletion() {
//     with_default_mock_builder(|| {
//         // Run to block one to see emitted events
//         run_to_block(1);

//         create_initial_storage_buckets();
//         // create an account with enought balance
//         let _ = balances::Module::<Test>::deposit_creating(
//             &DEFAULT_MEMBER_ACCOUNT_ID,
//             <Test as balances::Trait>::Balance::from(INITIAL_BALANCE),
//         );

//         // 3 assets
//         let assets = StorageAssetsRecord {
//             object_creation_list: vec![
//                 DataObjectCreationParameters {
//                     size: 3,
//                     ipfs_content_id: b"first".to_vec(),
//                 },
//                 DataObjectCreationParameters {
//                     size: 3,
//                     ipfs_content_id: b"second".to_vec(),
//                 },
//                 DataObjectCreationParameters {
//                     size: 3,
//                     ipfs_content_id: b"third".to_vec(),
//                 },
//             ],
//             expected_data_size_fee: storage::DataObjectPerMegabyteFee::<Test>::get(),
//         };

//         let channel_id = NextChannelId::<Test>::get();
//         // create channel
//         create_channel_mock(
//             DEFAULT_MEMBER_ACCOUNT_ID,
//             ContentActor::Member(DEFAULT_MEMBER_ID),
//             ChannelCreationParametersRecord {
//                 assets: Some(assets),
//                 meta: None,
//                 reward_account: None,
//                 collaborators: BTreeSet::new(),
//             },
//             Ok(()),
//         );

//         // delete assets
//         let assets_to_remove = [0u64, 1u64].iter().map(|&x| x).collect::<BTreeSet<_>>();

//         // delete channel assets
//         assert_ok!(Content::update_channel(
//             Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
//             ContentActor::Member(DEFAULT_MEMBER_ID),
//             channel_id,
//             ChannelUpdateParametersRecord {
//                 assets_to_upload: None,
//                 new_meta: None,
//                 reward_account: None,
//                 assets_to_remove: assets_to_remove,
//                 collaborators: None,
//             },
//         ));
//     })
// }

// #[test]
// fn lead_cannot_create_channel() {
//     with_default_mock_builder(|| {
//         create_initial_storage_buckets();
//         assert_err!(
//             Content::create_channel(
//                 Origin::signed(LEAD_ORIGIN),
//                 ContentActor::Lead,
//                 ChannelCreationParametersRecord {
//                     assets: None,
//                     meta: None,
//                     reward_account: None,
//                     collaborators: BTreeSet::new(),
//                 }
//             ),
//             Error::<Test>::ActorCannotOwnChannel
//         );
//     })
// }

// #[test]
// fn curator_owned_channels() {
//     with_default_mock_builder(|| {
//         // Run to block one to see emitted events
//         run_to_block(1);

//         // Curator group doesn't exist yet
//         assert_err!(
//             Content::create_channel(
//                 Origin::signed(FIRST_CURATOR_ORIGIN),
//                 ContentActor::Curator(FIRST_CURATOR_GROUP_ID, DEFAULT_CURATOR_ID),
//                 ChannelCreationParametersRecord {
//                     assets: None,
//                     meta: None,
//                     reward_account: None,
//                     collaborators: BTreeSet::new(),
//                 }
//             ),
//             Error::<Test>::CuratorGroupIsNotActive
//         );

//         let group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
//         assert_eq!(FIRST_CURATOR_GROUP_ID, group_id);

//         // Curator from wrong group
//         assert_err!(
//             Content::create_channel(
//                 Origin::signed(SECOND_CURATOR_ORIGIN),
//                 ContentActor::Curator(FIRST_CURATOR_GROUP_ID, SECOND_CURATOR_ID),
//                 ChannelCreationParametersRecord {
//                     assets: None,
//                     meta: None,
//                     reward_account: None,
//                     collaborators: BTreeSet::new(),
//                 }
//             ),
//             Error::<Test>::CuratorIsNotAMemberOfGivenCuratorGroup
//         );

//         // Curator in correct active group, but wrong origin
//         assert_err!(
//             Content::create_channel(
//                 Origin::signed(SECOND_CURATOR_ORIGIN),
//                 ContentActor::Curator(FIRST_CURATOR_GROUP_ID, DEFAULT_CURATOR_ID),
//                 ChannelCreationParametersRecord {
//                     assets: None,
//                     meta: None,
//                     reward_account: None,
//                     collaborators: BTreeSet::new(),
//                 }
//             ),
//             Error::<Test>::CuratorAuthFailed
//         );

//         let channel_id = Content::next_channel_id();

//         // Curator in correct active group, with correct origin
//         assert_ok!(Content::create_channel(
//             Origin::signed(FIRST_CURATOR_ORIGIN),
//             ContentActor::Curator(FIRST_CURATOR_GROUP_ID, DEFAULT_CURATOR_ID),
//             ChannelCreationParametersRecord {
//                 assets: None,
//                 meta: None,
//                 reward_account: None,
//                 collaborators: BTreeSet::new(),
//             }
//         ));

//         assert_eq!(
//             System::events().last().unwrap().event,
//             MetaEvent::content(RawEvent::ChannelCreated(
//                 ContentActor::Curator(FIRST_CURATOR_GROUP_ID, DEFAULT_CURATOR_ID),
//                 channel_id,
//                 ChannelRecord {
//                     owner: ChannelOwner::CuratorGroup(FIRST_CURATOR_GROUP_ID),
//                     is_censored: false,
//                     reward_account: None,
//                     num_videos: 0,
//                     collaborators: BTreeSet::new(),
//                 },
//                 ChannelCreationParametersRecord {
//                     assets: None,
//                     meta: None,
//                     reward_account: None,
//                     collaborators: BTreeSet::new(),
//                 }
//             ))
//         );

//         // Curator can update channel
//         assert_ok!(Content::update_channel(
//             Origin::signed(FIRST_CURATOR_ORIGIN),
//             ContentActor::Curator(FIRST_CURATOR_GROUP_ID, DEFAULT_CURATOR_ID),
//             channel_id,
//             ChannelUpdateParametersRecord {
//                 assets_to_upload: None,
//                 new_meta: None,
//                 reward_account: None,
//                 assets_to_remove: BTreeSet::new(),
//                 collaborators: None,
//             }
//         ));

//         // Lead can update curator owned channels
//         assert_ok!(Content::update_channel(
//             Origin::signed(LEAD_ORIGIN),
//             ContentActor::Lead,
//             channel_id,
//             ChannelUpdateParametersRecord {
//                 assets_to_upload: None,
//                 new_meta: None,
//                 reward_account: None,
//                 assets_to_remove: BTreeSet::new(),
//                 collaborators: None,
//             }
//         ));
//     })
// }

// #[test]
// fn invalid_member_cannot_create_channel() {
//     with_default_mock_builder(|| {
//         // Run to block one to see emitted events
//         run_to_block(1);

//         create_initial_storage_buckets();
//         // Not a member
//         create_channel_mock(
//             DEFAULT_MEMBER_ACCOUNT_ID,
//             ContentActor::Member(UNKNOWN_MEMBER_ID),
//             ChannelCreationParametersRecord {
//                 assets: None,
//                 meta: None,
//                 reward_account: None,
//                 collaborators: BTreeSet::new(),
//             },
//             Err(Error::<Test>::MemberAuthFailed.into()),
//         );
//     })
// }

// #[test]
// fn invalid_member_cannot_update_channel() {
//     with_default_mock_builder(|| {
//         // Run to block one to see emitted events
//         run_to_block(1);

//         create_initial_storage_buckets();
//         create_channel_mock(
//             DEFAULT_MEMBER_ACCOUNT_ID,
//             ContentActor::Member(DEFAULT_MEMBER_ID),
//             ChannelCreationParametersRecord {
//                 assets: None,
//                 meta: None,
//                 reward_account: None,
//                 collaborators: BTreeSet::new(),
//             },
//             Ok(()),
//         );

//         update_channel_mock(
//             DEFAULT_MEMBER_ACCOUNT_ID,
//             ContentActor::Member(UNKNOWN_MEMBER_ID),
//             <Test as storage::Trait>::ChannelId::one(),
//             ChannelUpdateParametersRecord {
//                 assets_to_upload: None,
//                 new_meta: None,
//                 reward_account: None,
//                 collaborators: None,
//                 assets_to_remove: BTreeSet::new(),
//             },
//             Err(Error::<Test>::MemberAuthFailed.into()),
//         );
//     })
// }

// #[test]
// fn invalid_member_cannot_delete_channel() {
//     with_default_mock_builder(|| {
//         // Run to block one to see emitted events
//         run_to_block(1);

//         create_initial_storage_buckets();

//         create_channel_mock(
//             DEFAULT_MEMBER_ACCOUNT_ID,
//             ContentActor::Member(DEFAULT_MEMBER_ID),
//             ChannelCreationParametersRecord {
//                 assets: None,
//                 meta: None,
//                 reward_account: None,
//                 collaborators: BTreeSet::new(),
//             },
//             Ok(()),
//         );

//         delete_channel_mock(
//             DEFAULT_MEMBER_ACCOUNT_ID,
//             ContentActor::Member(UNKNOWN_MEMBER_ID),
//             <Test as storage::Trait>::ChannelId::one(),
//             0u64,
//             Err(Error::<Test>::MemberAuthFailed.into()),
//         );
//     })
// }

// #[test]
// fn non_authorized_collaborators_cannot_update_channel() {
//     with_default_mock_builder(|| {
//         // Run to block one to see emitted events
//         run_to_block(1);

//         helper_init_accounts(vec![
//             DEFAULT_MEMBER_ACCOUNT_ID,
//             COLLABORATOR_MEMBER_ACCOUNT_ID,
//         ]);

//         create_initial_storage_buckets();

//         // create channel
//         create_channel_mock(
//             DEFAULT_MEMBER_ACCOUNT_ID,
//             ContentActor::Member(DEFAULT_MEMBER_ID),
//             ChannelCreationParametersRecord {
//                 assets: Some(helper_generate_storage_assets(vec![2, 3])),
//                 meta: None,
//                 reward_account: None,
//                 collaborators: BTreeSet::new(),
//             },
//             Ok(()),
//         );

//         // attempt for an non auth. collaborator to update channel assets
//         update_channel_mock(
//             COLLABORATOR_MEMBER_ACCOUNT_ID,
//             ContentActor::Collaborator(COLLABORATOR_MEMBER_ID),
//             <Test as storage::Trait>::ChannelId::one(),
//             ChannelUpdateParametersRecord {
//                 assets_to_upload: Some(helper_generate_storage_assets(vec![5])),
//                 new_meta: None,
//                 reward_account: None,
//                 assets_to_remove: vec![DataObjectId::<Test>::one()]
//                     .into_iter()
//                     .collect::<BTreeSet<_>>(),
//                 collaborators: None,
//             },
//             Err(Error::<Test>::ActorNotAuthorized.into()),
//         );

//         // add collaborators
//         update_channel_mock(
//             DEFAULT_MEMBER_ACCOUNT_ID,
//             ContentActor::Member(DEFAULT_MEMBER_ID),
//             <Test as storage::Trait>::ChannelId::one(),
//             ChannelUpdateParametersRecord {
//                 assets_to_upload: None,
//                 new_meta: None,
//                 reward_account: None,
//                 assets_to_remove: BTreeSet::new(),
//                 collaborators: Some(
//                     vec![COLLABORATOR_MEMBER_ID]
//                         .into_iter()
//                         .collect::<BTreeSet<_>>(),
//                 ),
//             },
//             Ok(()),
//         );

//         // attempt for a valid collaborator to update channel fields outside
//         // of his scope
//         update_channel_mock(
//             COLLABORATOR_MEMBER_ACCOUNT_ID,
//             ContentActor::Collaborator(COLLABORATOR_MEMBER_ID),
//             <Test as storage::Trait>::ChannelId::one(),
//             ChannelUpdateParametersRecord {
//                 assets_to_upload: None,
//                 new_meta: None,
//                 reward_account: Some(Some(COLLABORATOR_MEMBER_ACCOUNT_ID)),
//                 assets_to_remove: BTreeSet::new(),
//                 collaborators: None,
//             },
//             Err(Error::<Test>::ActorNotAuthorized.into()),
//         );
//     })
// }

// #[test]
// fn authorized_collaborators_can_update_channel() {
//     with_default_mock_builder(|| {
//         // Run to block one to see emitted events
//         run_to_block(1);

//         helper_init_accounts(vec![
//             DEFAULT_MEMBER_ACCOUNT_ID,
//             COLLABORATOR_MEMBER_ACCOUNT_ID,
//         ]);

//         create_initial_storage_buckets();
//         // create channel
//         create_channel_mock(
//             DEFAULT_MEMBER_ACCOUNT_ID,
//             ContentActor::Member(DEFAULT_MEMBER_ID),
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

//         // attempt for an auth. collaborator to update channel assets
//         update_channel_mock(
//             COLLABORATOR_MEMBER_ACCOUNT_ID,
//             ContentActor::Collaborator(COLLABORATOR_MEMBER_ID),
//             <Test as storage::Trait>::ChannelId::one(),
//             ChannelUpdateParametersRecord {
//                 assets_to_upload: Some(helper_generate_storage_assets(vec![5])),
//                 new_meta: None,
//                 reward_account: None,
//                 assets_to_remove: vec![DataObjectId::<Test>::one()]
//                     .into_iter()
//                     .collect::<BTreeSet<_>>(),
//                 collaborators: None,
//             },
//             Ok(()),
//         );
//     })
// }

// #[test]
// fn channel_censoring() {
//     with_default_mock_builder(|| {
//         // Run to block one to see emitted events
//         run_to_block(1);

//         let channel_id = Content::next_channel_id();
//         assert_ok!(Content::create_channel(
//             Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
//             ContentActor::Member(DEFAULT_MEMBER_ID),
//             ChannelCreationParametersRecord {
//                 assets: None,
//                 meta: None,
//                 reward_account: None,
//                 collaborators: BTreeSet::new(),
//             }
//         ));

//         let group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);

//         // Curator can censor channels
//         let is_censored = true;
//         assert_ok!(Content::update_channel_censorship_status(
//             Origin::signed(FIRST_CURATOR_ORIGIN),
//             ContentActor::Curator(group_id, DEFAULT_CURATOR_ID),
//             channel_id,
//             is_censored,
//             vec![]
//         ));

//         assert_eq!(
//             System::events().last().unwrap().event,
//             MetaEvent::content(RawEvent::ChannelCensorshipStatusUpdated(
//                 ContentActor::Curator(group_id, DEFAULT_CURATOR_ID),
//                 channel_id,
//                 is_censored,
//                 vec![]
//             ))
//         );

//         let channel = Content::channel_by_id(channel_id);

//         assert!(channel.is_censored);

//         // Curator can un-censor channels
//         let is_censored = false;
//         assert_ok!(Content::update_channel_censorship_status(
//             Origin::signed(FIRST_CURATOR_ORIGIN),
//             ContentActor::Curator(group_id, DEFAULT_CURATOR_ID),
//             channel_id,
//             is_censored,
//             vec![]
//         ));

//         assert_eq!(
//             System::events().last().unwrap().event,
//             MetaEvent::content(RawEvent::ChannelCensorshipStatusUpdated(
//                 ContentActor::Curator(group_id, DEFAULT_CURATOR_ID),
//                 channel_id,
//                 is_censored,
//                 vec![]
//             ))
//         );

//         let channel = Content::channel_by_id(channel_id);

//         assert!(!channel.is_censored);

//         // Member cannot censor channels
//         let is_censored = true;
//         assert_err!(
//             Content::update_channel_censorship_status(
//                 Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
//                 ContentActor::Member(DEFAULT_MEMBER_ID),
//                 channel_id,
//                 is_censored,
//                 vec![]
//             ),
//             Error::<Test>::ActorNotAuthorized
//         );

//         let curator_channel_id = Content::next_channel_id();

//         // create curator channel
//         assert_ok!(Content::create_channel(
//             Origin::signed(FIRST_CURATOR_ORIGIN),
//             ContentActor::Curator(group_id, DEFAULT_CURATOR_ID),
//             ChannelCreationParametersRecord {
//                 assets: None,
//                 meta: None,
//                 reward_account: None,
//                 collaborators: BTreeSet::new(),
//             }
//         ));

//         // Curator cannot censor curator group channels
//         assert_err!(
//             Content::update_channel_censorship_status(
//                 Origin::signed(FIRST_CURATOR_ORIGIN),
//                 ContentActor::Curator(group_id, DEFAULT_CURATOR_ID),
//                 curator_channel_id,
//                 is_censored,
//                 vec![]
//             ),
//             Error::<Test>::CannotCensoreCuratorGroupOwnedChannels
//         );

//         // Lead can still censor curator group channels
//         assert_ok!(Content::update_channel_censorship_status(
//             Origin::signed(LEAD_ORIGIN),
//             ContentActor::Lead,
//             curator_channel_id,
//             is_censored,
//             vec![]
//         ));
//     })
// }

// #[test]
// fn channel_creation_doesnt_leave_bags_dangling() {
//     with_default_mock_builder(|| {
//         // in order to emit events
//         run_to_block(1);

//         create_initial_storage_buckets();
//         // number of assets big enought to make upload_data_objects throw
//         let asset_num = 100_000usize;
//         let mut object_creation_list =
//             Vec::<DataObjectCreationParameters>::with_capacity(asset_num);
//         for _i in 0..asset_num {
//             object_creation_list.push(DataObjectCreationParameters {
//                 size: 1_000_000, // size big enought to make upload_data_objects throw
//                 ipfs_content_id: b"test".to_vec(),
//             });
//         }

//         let assets = StorageAssetsRecord {
//             object_creation_list: object_creation_list,
//             expected_data_size_fee: storage::DataObjectPerMegabyteFee::<Test>::get(),
//         };

//         let channel_id = NextChannelId::<Test>::get();
//         // create channel
//         create_channel_mock(
//             DEFAULT_MEMBER_ACCOUNT_ID,
//             ContentActor::Member(DEFAULT_MEMBER_ID),
//             ChannelCreationParametersRecord {
//                 assets: Some(assets),
//                 meta: Some(vec![]),
//                 reward_account: None,
//                 collaborators: BTreeSet::new(),
//             },
//             Err(storage::Error::<Test>::MaxDataObjectSizeExceeded.into()),
//         );

//         // ensure that no bag are left dangling
//         let dyn_bag = DynamicBagIdType::<MemberId, ChannelId>::Channel(channel_id);
//         let bag_id = storage::BagIdType::from(dyn_bag.clone());
//         assert!(<Test as Trait>::DataObjectStorage::ensure_bag_exists(&bag_id).is_err());
//     })
// }

// channel creation tests
#[test]
fn successful_channel_creation_with_member_context() {
    with_default_mock_builder(|| {
        run_to_block(1);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_channel_creation_with_curator_context() {
    with_default_mock_builder(|| {
        run_to_block(1);
        let curator_group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_channel_creation_with_lead_context() {
    with_default_mock_builder(|| {
        run_to_block(1);
        CreateChannelFixture::default()
            .with_sender(LEAD_ORIGIN)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::ActorCannotOwnChannel.into()));
    })
}

#[test]
fn unsuccessful_channel_creation_with_collaborator_context() {
    with_default_mock_builder(|| {
        run_to_block(1);
        CreateChannelFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Collaborator(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorCannotOwnChannel.into()));
    })
}

#[test]
fn unsuccessful_channel_creation_with_uncorresponding_member_id_and_origin() {
    with_default_mock_builder(|| {
        run_to_block(1);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID + 100)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_channel_creation_with_uncorresponding_curator_id_and_origin() {
    with_default_mock_builder(|| {
        run_to_block(1);
        let curator_group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID + 100)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::CuratorAuthFailed.into()));
    })
}

#[test]
fn successful_channel_creation_with_storage_upload_and_member_context() {
    with_default_mock_builder(|| {
        run_to_block(1);
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        CreateChannelFixture::default()
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
fn successful_channel_creation_with_storage_upload_and_curator_context() {
    with_default_mock_builder(|| {
        run_to_block(1);
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        let curator_group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_channel_creation_with_invalid_expected_data_size_fee() {
    with_default_mock_builder(|| {
        run_to_block(1);
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        let curator_group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .with_assets(StorageAssets::<Test> {
                // setting a purposely high fee to trigger error
                expected_data_size_fee: BalanceOf::<Test>::from(1_000_000u64),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Err(storage::Error::<Test>::DataSizeFeeChanged.into()));
    })
}

#[test]
fn unsuccessful_channel_creation_with_insufficient_balance() {
    with_default_mock_builder(|| {
        run_to_block(1);
        create_initial_storage_buckets_helper();
        CreateChannelFixture::default()
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
fn unsuccessful_channel_creation_with_no_bucket_available() {
    with_default_mock_builder(|| {
        run_to_block(1);
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);

        CreateChannelFixture::default()
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
                storage::Error::<Test>::StorageBucketIdCollectionsAreEmpty.into(),
            ));

        CreateChannelFixture::default()
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
                storage::Error::<Test>::StorageBucketIdCollectionsAreEmpty.into(),
            ));
    })
}

#[test]
fn unsuccessful_channel_creation_with_data_limits_exceeded() {
    with_default_mock_builder(|| {
        run_to_block(1);
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        CreateChannelFixture::default()
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

#[test]
fn successful_channel_creation_with_collaborators_set() {
    with_default_mock_builder(|| {
        run_to_block(1);

        CreateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_collaborators(vec![COLLABORATOR_MEMBER_ID].into_iter().collect())
            .call_and_assert(Ok(()));

        let curator_group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .with_collaborators(vec![COLLABORATOR_MEMBER_ID].into_iter().collect())
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_channel_creation_with_invalid_collaborators_set() {
    with_default_mock_builder(|| {
        run_to_block(1);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_collaborators(vec![COLLABORATOR_MEMBER_ID + 100].into_iter().collect())
            .call_and_assert(Err(Error::<Test>::CollaboratorIsNotValidMember.into()));
    })
}

#[test]
fn successful_channel_creation_with_reward_account() {
    with_default_mock_builder(|| {
        run_to_block(1);

        CreateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_reward_account(DEFAULT_MEMBER_ACCOUNT_ID)
            .call_and_assert(Ok(()));

        let curator_group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .with_reward_account(DEFAULT_CURATOR_ACCOUNT_ID)
            .call_and_assert(Ok(()));
    })
}

// channel update tests
#[test]
fn unsuccessful_channel_update_with_uncorresponding_member_id_and_origin() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID + 100)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_channel_update_with_uncorresponding_curator_id_and_origin() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        let curator_group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        UpdateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID + 100)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::CuratorAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_channel_update_with_uncorresponding_collaborator_id_and_origin() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID + 100)
            .with_actor(ContentActor::Collaborator(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_channel_update_with_invalid_channel_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_channel_id(ChannelId::zero())
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));
    })
}

#[test]
fn successful_channel_update_with_assets_uploaded_by_collaborator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(COLLABORATOR_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Collaborator(COLLABORATOR_MEMBER_ID))
            .with_assets_to_upload(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_channel_update_with_assets_removed_by_collaborator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Collaborator(COLLABORATOR_MEMBER_ID))
            // data objects ids start at index 1
            .with_assets_to_remove((1..(DATA_OBJECTS_NUMBER as u64 - 1)).collect())
            .call_and_assert(Ok(()));
    })
}
