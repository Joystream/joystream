#![cfg(test)]

use super::curators;
use super::mock::*;
use crate::*;
use frame_support::traits::Currency;
use frame_support::{assert_err, assert_ok};

#[test]
fn successful_channel_deletion() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        // create an account with enought balance
        let _ = balances::Module::<Test>::deposit_creating(
            &FIRST_MEMBER_ORIGIN,
            <Test as balances::Trait>::Balance::from(100u32),
        );

        // 3 assets added at creation
        let assets = StorageAssetsRecord {
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
        };
        let channel_id = NextChannelId::<Test>::get();

        // create channel
        create_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            ChannelCreationParametersRecord {
                assets: Some(assets),
                meta: None,
                reward_account: None,
                collaborators: BTreeSet::new(),
            },
            Ok(()),
        );

        // attempt to delete channel with non zero assets should result in error: objects
        // are misspecified
        delete_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            channel_id,
            2u64,
            Err(Error::<Test>::InvalidBagSizeSpecified.into()),
        );

        // successful deletion because we empty the bag first
        delete_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            channel_id,
            3u64,
            Ok(()),
        );

        // create a channel with no assets:
        let empty_channel_id = Content::next_channel_id();
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
        delete_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            empty_channel_id,
            43u64, // this param will be discarded if channel has no assets
            Ok(()),
        );
    })
}

#[test]
fn successful_channel_assets_deletion() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        // create an account with enought balance
        let _ = balances::Module::<Test>::deposit_creating(
            &FIRST_MEMBER_ORIGIN,
            <Test as balances::Trait>::Balance::from(100u32),
        );

        // 3 assets
        let assets = StorageAssetsRecord {
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
        };

        let channel_id = NextChannelId::<Test>::get();
        // create channel
        create_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            ChannelCreationParametersRecord {
                assets: Some(assets),
                meta: None,
                reward_account: None,
                collaborators: BTreeSet::new(),
            },
            Ok(()),
        );

        // delete assets
        let assets_to_remove = [0u64, 1u64].iter().map(|&x| x).collect::<BTreeSet<_>>();

        // delete channel assets
        assert_ok!(Content::update_channel(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            channel_id,
            ChannelUpdateParametersRecord {
                assets_to_upload: None,
                new_meta: None,
                reward_account: None,
                assets_to_remove: assets_to_remove,
                collaborators: None,
            },
        ));
    })
}

#[test]
fn succesful_channel_update() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        // create an account with enought balance
        let _ = balances::Module::<Test>::deposit_creating(
            &FIRST_MEMBER_ORIGIN,
            <Test as balances::Trait>::Balance::from(100u32),
        );

        // 2 + 1 assets to be uploaded
        let first_obj_id = Storage::<Test>::next_data_object_id();
        let first_batch = StorageAssetsRecord {
            object_creation_list: vec![
                DataObjectCreationParameters {
                    size: 3,
                    ipfs_content_id: b"first".to_vec(),
                },
                DataObjectCreationParameters {
                    size: 3,
                    ipfs_content_id: b"second".to_vec(),
                },
            ],
            expected_data_size_fee: storage::DataObjectPerMegabyteFee::<Test>::get(),
        };
        let first_batch_ids =
            (first_obj_id..Storage::<Test>::next_data_object_id()).collect::<BTreeSet<_>>();

        let second_batch = StorageAssetsRecord {
            object_creation_list: vec![
                DataObjectCreationParameters {
                    size: 3,
                    ipfs_content_id: b"first".to_vec(),
                },
                DataObjectCreationParameters {
                    size: 3,
                    ipfs_content_id: b"second".to_vec(),
                },
            ],
            expected_data_size_fee: storage::DataObjectPerMegabyteFee::<Test>::get(),
        };

        let channel_id = NextChannelId::<Test>::get();

        // create channel with first batch of assets
        create_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            ChannelCreationParametersRecord {
                assets: Some(first_batch),
                meta: None,
                reward_account: None,
                collaborators: BTreeSet::new(),
            },
            Ok(()),
        );

        // update channel by adding the second batch of assets
        update_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            channel_id,
            ChannelUpdateParametersRecord {
                assets_to_upload: Some(second_batch),
                new_meta: None,
                reward_account: None,
                assets_to_remove: BTreeSet::new(),
                collaborators: None,
            },
            Ok(()),
        );

        // update channel by removing the first batch of assets
        update_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            channel_id,
            ChannelUpdateParametersRecord {
                assets_to_upload: None,
                new_meta: None,
                reward_account: None,
                assets_to_remove: first_batch_ids,
                collaborators: None,
            },
            Ok(()),
        );
    })
}

#[test]
fn succesful_channel_creation() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        // create an account with enought balance
        let _ = balances::Module::<Test>::deposit_creating(
            &FIRST_MEMBER_ORIGIN,
            <Test as balances::Trait>::Balance::from(100u32),
        );

        // 3 assets to be uploaded
        let assets = StorageAssetsRecord {
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
        };

        // create channel
        create_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            ChannelCreationParametersRecord {
                assets: Some(assets),
                meta: None,
                reward_account: None,
                collaborators: BTreeSet::new(),
            },
            Ok(()),
        );
    })
}

#[test]
fn lead_cannot_create_channel() {
    with_default_mock_builder(|| {
        assert_err!(
            Content::create_channel(
                Origin::signed(LEAD_ORIGIN),
                ContentActor::Lead,
                ChannelCreationParametersRecord {
                    assets: None,
                    meta: None,
                    reward_account: None,
                    collaborators: BTreeSet::new(),
                }
            ),
            Error::<Test>::ActorCannotOwnChannel
        );
    })
}

#[test]
fn curator_owned_channels() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        // Curator group doesn't exist yet
        assert_err!(
            Content::create_channel(
                Origin::signed(FIRST_CURATOR_ORIGIN),
                ContentActor::Curator(FIRST_CURATOR_GROUP_ID, FIRST_CURATOR_ID),
                ChannelCreationParametersRecord {
                    assets: None,
                    meta: None,
                    reward_account: None,
                    collaborators: BTreeSet::new(),
                }
            ),
            Error::<Test>::CuratorGroupIsNotActive
        );

        let group_id = curators::add_curator_to_new_group(FIRST_CURATOR_ID);
        assert_eq!(FIRST_CURATOR_GROUP_ID, group_id);

        // Curator from wrong group
        assert_err!(
            Content::create_channel(
                Origin::signed(SECOND_CURATOR_ORIGIN),
                ContentActor::Curator(FIRST_CURATOR_GROUP_ID, SECOND_CURATOR_ID),
                ChannelCreationParametersRecord {
                    assets: None,
                    meta: None,
                    reward_account: None,
                    collaborators: BTreeSet::new(),
                }
            ),
            Error::<Test>::CuratorIsNotAMemberOfGivenCuratorGroup
        );

        // Curator in correct active group, but wrong origin
        assert_err!(
            Content::create_channel(
                Origin::signed(SECOND_CURATOR_ORIGIN),
                ContentActor::Curator(FIRST_CURATOR_GROUP_ID, FIRST_CURATOR_ID),
                ChannelCreationParametersRecord {
                    assets: None,
                    meta: None,
                    reward_account: None,
                    collaborators: BTreeSet::new(),
                }
            ),
            Error::<Test>::CuratorAuthFailed
        );

        let channel_id = Content::next_channel_id();

        // Curator in correct active group, with correct origin
        assert_ok!(Content::create_channel(
            Origin::signed(FIRST_CURATOR_ORIGIN),
            ContentActor::Curator(FIRST_CURATOR_GROUP_ID, FIRST_CURATOR_ID),
            ChannelCreationParametersRecord {
                assets: None,
                meta: None,
                reward_account: None,
                collaborators: BTreeSet::new(),
            }
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::ChannelCreated(
                ContentActor::Curator(FIRST_CURATOR_GROUP_ID, FIRST_CURATOR_ID),
                channel_id,
                ChannelRecord {
                    owner: ChannelOwner::CuratorGroup(FIRST_CURATOR_GROUP_ID),
                    is_censored: false,
                    reward_account: None,
                    num_videos: 0,
                    collaborators: BTreeSet::new(),
                },
                ChannelCreationParametersRecord {
                    assets: None,
                    meta: None,
                    reward_account: None,
                    collaborators: BTreeSet::new(),
                }
            ))
        );

        // Curator can update channel
        assert_ok!(Content::update_channel(
            Origin::signed(FIRST_CURATOR_ORIGIN),
            ContentActor::Curator(FIRST_CURATOR_GROUP_ID, FIRST_CURATOR_ID),
            channel_id,
            ChannelUpdateParametersRecord {
                assets_to_upload: None,
                new_meta: None,
                reward_account: None,
                assets_to_remove: BTreeSet::new(),
                collaborators: None,
            }
        ));

        // Lead can update curator owned channels
        assert_ok!(Content::update_channel(
            Origin::signed(LEAD_ORIGIN),
            ContentActor::Lead,
            channel_id,
            ChannelUpdateParametersRecord {
                assets_to_upload: None,
                new_meta: None,
                reward_account: None,
                assets_to_remove: BTreeSet::new(),
                collaborators: None,
            }
        ));
    })
}

#[test]
fn invalid_member_cannot_create_channel() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        // Not a member
        create_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(UNKNOWN_MEMBER_ID),
            ChannelCreationParametersRecord {
                assets: None,
                meta: None,
                reward_account: None,
                collaborators: BTreeSet::new(),
            },
            Err(Error::<Test>::MemberAuthFailed.into()),
        );
    })
}

#[test]
fn invalid_member_cannot_update_channel() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

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

        update_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(UNKNOWN_MEMBER_ID),
            <Test as storage::Trait>::ChannelId::one(),
            ChannelUpdateParametersRecord {
                assets_to_upload: None,
                new_meta: None,
                reward_account: None,
                collaborators: None,
                assets_to_remove: BTreeSet::new(),
            },
            Err(Error::<Test>::MemberAuthFailed.into()),
        );
    })
}

#[test]
fn invalid_member_cannot_delete_channel() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

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

        delete_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(UNKNOWN_MEMBER_ID),
            <Test as storage::Trait>::ChannelId::one(),
            0u64,
            Err(Error::<Test>::MemberAuthFailed.into()),
        );
    })
}

#[test]
fn non_authorized_collaborators_cannot_update_channel() {
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

        // attempt for an non auth. collaborator to update channel assets
        update_channel_mock(
            COLLABORATOR_MEMBER_ORIGIN,
            ContentActor::Collaborator(COLLABORATOR_MEMBER_ID),
            <Test as storage::Trait>::ChannelId::one(),
            ChannelUpdateParametersRecord {
                assets_to_upload: Some(helper_generate_storage_assets(vec![5])),
                new_meta: None,
                reward_account: None,
                assets_to_remove: vec![DataObjectId::<Test>::one()]
                    .into_iter()
                    .collect::<BTreeSet<_>>(),
                collaborators: None,
            },
            Err(Error::<Test>::ActorNotAuthorized.into()),
        );

        // add collaborators
        update_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            <Test as storage::Trait>::ChannelId::one(),
            ChannelUpdateParametersRecord {
                assets_to_upload: None,
                new_meta: None,
                reward_account: None,
                assets_to_remove: BTreeSet::new(),
                collaborators: Some(
                    vec![COLLABORATOR_MEMBER_ID]
                        .into_iter()
                        .collect::<BTreeSet<_>>(),
                ),
            },
            Ok(()),
        );

        // attempt for a valid collaborator to update channel fields outside
        // of his scope
        update_channel_mock(
            COLLABORATOR_MEMBER_ORIGIN,
            ContentActor::Collaborator(COLLABORATOR_MEMBER_ID),
            <Test as storage::Trait>::ChannelId::one(),
            ChannelUpdateParametersRecord {
                assets_to_upload: None,
                new_meta: None,
                reward_account: Some(Some(COLLABORATOR_MEMBER_ORIGIN)),
                assets_to_remove: BTreeSet::new(),
                collaborators: None,
            },
            Err(Error::<Test>::ActorNotAuthorized.into()),
        );
    })
}

#[test]
fn authorized_collaborators_can_update_channel() {
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

        // attempt for an auth. collaborator to update channel assets
        update_channel_mock(
            COLLABORATOR_MEMBER_ORIGIN,
            ContentActor::Collaborator(COLLABORATOR_MEMBER_ID),
            <Test as storage::Trait>::ChannelId::one(),
            ChannelUpdateParametersRecord {
                assets_to_upload: Some(helper_generate_storage_assets(vec![5])),
                new_meta: None,
                reward_account: None,
                assets_to_remove: vec![DataObjectId::<Test>::one()]
                    .into_iter()
                    .collect::<BTreeSet<_>>(),
                collaborators: None,
            },
            Ok(()),
        );
    })
}

#[test]
fn channel_censoring() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let channel_id = Content::next_channel_id();
        assert_ok!(Content::create_channel(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            ChannelCreationParametersRecord {
                assets: None,
                meta: None,
                reward_account: None,
                collaborators: BTreeSet::new(),
            }
        ));

        let group_id = curators::add_curator_to_new_group(FIRST_CURATOR_ID);

        // Curator can censor channels
        let is_censored = true;
        assert_ok!(Content::update_channel_censorship_status(
            Origin::signed(FIRST_CURATOR_ORIGIN),
            ContentActor::Curator(group_id, FIRST_CURATOR_ID),
            channel_id,
            is_censored,
            vec![]
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::ChannelCensorshipStatusUpdated(
                ContentActor::Curator(group_id, FIRST_CURATOR_ID),
                channel_id,
                is_censored,
                vec![]
            ))
        );

        let channel = Content::channel_by_id(channel_id);

        assert!(channel.is_censored);

        // Curator can un-censor channels
        let is_censored = false;
        assert_ok!(Content::update_channel_censorship_status(
            Origin::signed(FIRST_CURATOR_ORIGIN),
            ContentActor::Curator(group_id, FIRST_CURATOR_ID),
            channel_id,
            is_censored,
            vec![]
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::ChannelCensorshipStatusUpdated(
                ContentActor::Curator(group_id, FIRST_CURATOR_ID),
                channel_id,
                is_censored,
                vec![]
            ))
        );

        let channel = Content::channel_by_id(channel_id);

        assert!(!channel.is_censored);

        // Member cannot censor channels
        let is_censored = true;
        assert_err!(
            Content::update_channel_censorship_status(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                ContentActor::Member(FIRST_MEMBER_ID),
                channel_id,
                is_censored,
                vec![]
            ),
            Error::<Test>::ActorNotAuthorized
        );

        let curator_channel_id = Content::next_channel_id();

        // create curator channel
        assert_ok!(Content::create_channel(
            Origin::signed(FIRST_CURATOR_ORIGIN),
            ContentActor::Curator(group_id, FIRST_CURATOR_ID),
            ChannelCreationParametersRecord {
                assets: None,
                meta: None,
                reward_account: None,
                collaborators: BTreeSet::new(),
            }
        ));

        // Curator cannot censor curator group channels
        assert_err!(
            Content::update_channel_censorship_status(
                Origin::signed(FIRST_CURATOR_ORIGIN),
                ContentActor::Curator(group_id, FIRST_CURATOR_ID),
                curator_channel_id,
                is_censored,
                vec![]
            ),
            Error::<Test>::CannotCensoreCuratorGroupOwnedChannels
        );

        // Lead can still censor curator group channels
        assert_ok!(Content::update_channel_censorship_status(
            Origin::signed(LEAD_ORIGIN),
            ContentActor::Lead,
            curator_channel_id,
            is_censored,
            vec![]
        ));
    })
}

#[test]
fn channel_creation_doesnt_live_bags_dangling() {
    with_default_mock_builder(|| {
        // number of assets big enought to make upload_data_objects throw
        let asset_num = 100_000usize;
        let mut object_creation_list =
            Vec::<DataObjectCreationParameters>::with_capacity(asset_num);
        for _i in 0..asset_num {
            object_creation_list.push(DataObjectCreationParameters {
                size: 1_000_000, // size big enought to make upload_data_objects throw
                ipfs_content_id: b"test".to_vec(),
            });
        }

        let assets = StorageAssetsRecord {
            object_creation_list: object_creation_list,
            expected_data_size_fee: storage::DataObjectPerMegabyteFee::<Test>::get(),
        };

        let channel_id = NextChannelId::<Test>::get();
        // create channel
        create_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            ChannelCreationParametersRecord {
                assets: Some(assets),
                meta: Some(vec![]),
                reward_account: None,
            },
            Err(storage::Error::<Test>::MaxDataObjectSizeExceeded.into()),
        );

        // ensure that no bag are left dangling
        let dyn_bag = DynamicBagIdType::<MemberId, ChannelId>::Channel(channel_id);
        let bag_id = storage::BagIdType::from(dyn_bag.clone());
        assert!(<Test as Trait>::DataObjectStorage::ensure_bag_exists(&bag_id).is_err());
    })
}
