#![cfg(test)]

use super::curators;
use super::fixtures::*;
use super::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

#[test]
fn channel_censoring() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let channel_id = Content::next_channel_id();
        assert_ok!(Content::create_channel(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            ChannelCreationParametersRecord {
                assets: None,
                meta: None,
                reward_account: None,
                collaborators: BTreeSet::new(),
            }
        ));

        let group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);

        // Curator can censor channels
        let is_censored = true;
        assert_ok!(Content::update_channel_censorship_status(
            Origin::signed(DEFAULT_CURATOR_ACCOUNT_ID),
            ContentActor::Curator(group_id, DEFAULT_CURATOR_ID),
            channel_id,
            is_censored,
            vec![]
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::ChannelCensorshipStatusUpdated(
                ContentActor::Curator(group_id, DEFAULT_CURATOR_ID),
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
            Origin::signed(DEFAULT_CURATOR_ACCOUNT_ID),
            ContentActor::Curator(group_id, DEFAULT_CURATOR_ID),
            channel_id,
            is_censored,
            vec![]
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::ChannelCensorshipStatusUpdated(
                ContentActor::Curator(group_id, DEFAULT_CURATOR_ID),
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
                Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
                ContentActor::Member(DEFAULT_MEMBER_ID),
                channel_id,
                is_censored,
                vec![]
            ),
            Error::<Test>::ActorNotAuthorized
        );

        let curator_channel_id = Content::next_channel_id();

        // create curator channel
        assert_ok!(Content::create_channel(
            Origin::signed(DEFAULT_CURATOR_ACCOUNT_ID),
            ContentActor::Curator(group_id, DEFAULT_CURATOR_ID),
            ChannelCreationParametersRecord {
                assets: None,
                meta: None,
                reward_account: None,
                collaborators: BTreeSet::new(),
                moderator_set: BTreeSet::new(),
            }
        ));

        // Curator cannot censor curator group channels
        assert_err!(
            Content::update_channel_censorship_status(
                Origin::signed(DEFAULT_CURATOR_ACCOUNT_ID),
                ContentActor::Curator(group_id, DEFAULT_CURATOR_ID),
                curator_channel_id,
                is_censored,
                vec![]
            ),
            Error::<Test>::CannotCensoreCuratorGroupOwnedChannels
        );

        // Lead can still censor curator group channels
        assert_ok!(Content::update_channel_censorship_status(
            Origin::signed(LEAD_ACCOUNT_ID),
            ContentActor::Lead,
            curator_channel_id,
            is_censored,
            vec![]
        ));
    })
}

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
        let default_curator_group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_channel_creation_with_lead_context() {
    with_default_mock_builder(|| {
        run_to_block(1);
        CreateChannelFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
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
        let default_curator_group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID + 100)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
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
        let default_curator_group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreateChannelFixture::default()
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
fn unsuccessful_channel_creation_with_invalid_expected_data_size_fee() {
    with_default_mock_builder(|| {
        run_to_block(1);
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        let default_curator_group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
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

        let default_curator_group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
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

        let default_curator_group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
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

        let default_curator_group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        UpdateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID + 100)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
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

#[test]
fn successful_channel_update_with_assets_uploaded_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets_to_upload(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_channel_update_with_assets_removed_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            // data objects ids start at index 1
            .with_assets_to_remove((1..(DATA_OBJECTS_NUMBER as u64 - 1)).collect())
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_channel_update_with_assets_uploaded_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        let default_curator_group_id = NextCuratorGroupId::<Test>::get() - 1;
        UpdateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .with_assets_to_upload(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_channel_update_with_assets_removed_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        let default_curator_group_id = NextCuratorGroupId::<Test>::get() - 1;
        UpdateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            // data objects ids start at index 1
            .with_assets_to_remove((1..(DATA_OBJECTS_NUMBER as u64 - 1)).collect())
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_curator_channel_update_with_assets_uploaded_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_assets_to_upload(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_curator_channel_update_with_assets_uploaded_by_invalid_lead_origin() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(LEAD_ACCOUNT_ID + 100)
            .with_actor(ContentActor::Lead)
            .with_assets_to_upload(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()));
    })
}

#[test]
fn successful_channel_update_with_assets_removed_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            // data objects ids start at index 1
            .with_assets_to_remove((1..(DATA_OBJECTS_NUMBER as u64 - 1)).collect())
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_channel_update_with_assets_removed_by_invalid_lead_origin() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(LEAD_ACCOUNT_ID + 100)
            .with_actor(ContentActor::Lead)
            // data objects ids start at index 1
            .with_assets_to_remove((1..(DATA_OBJECTS_NUMBER as u64 - 1)).collect())
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_channel_update_with_assets_uploaded_by_unauthorized_collaborator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(
            UNAUTHORIZED_COLLABORATOR_MEMBER_ACCOUNT_ID,
            INITIAL_BALANCE,
        );
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(UNAUTHORIZED_COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Collaborator(
                UNAUTHORIZED_COLLABORATOR_MEMBER_ID,
            ))
            .with_assets_to_upload(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_channel_update_with_assets_removed_by_unauthorized_collaborator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(UNAUTHORIZED_COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Collaborator(
                UNAUTHORIZED_COLLABORATOR_MEMBER_ID,
            ))
            // data objects ids start at index 1
            .with_assets_to_remove((1..(DATA_OBJECTS_NUMBER as u64 - 1)).collect())
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_channel_update_with_assets_uploaded_by_unauthorized_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(UNAUTHORIZED_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(UNAUTHORIZED_MEMBER_ID))
            .with_assets_to_upload(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_channel_update_with_assets_removed_by_unathorized_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(UNAUTHORIZED_MEMBER_ID))
            // data objects ids start at index 1
            .with_assets_to_remove((1..(DATA_OBJECTS_NUMBER as u64 - 1)).collect())
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_channel_update_with_assets_uploaded_by_unauthorized_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(UNAUTHORIZED_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        let unauthorized_curator_group_id =
            curators::add_curator_to_new_group(UNAUTHORIZED_CURATOR_ID);
        UpdateChannelFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                unauthorized_curator_group_id,
                UNAUTHORIZED_CURATOR_ID,
            ))
            .with_assets_to_upload(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_channel_update_with_assets_removed_by_unauthorized_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        let unauthorized_curator_group_id =
            curators::add_curator_to_new_group(UNAUTHORIZED_CURATOR_ID);
        UpdateChannelFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                unauthorized_curator_group_id,
                UNAUTHORIZED_CURATOR_ID,
            ))
            // data objects ids start at index 1
            .with_assets_to_remove((1..(DATA_OBJECTS_NUMBER as u64 - 1)).collect())
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_member_channel_update_with_assets_uploaded_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_assets_to_upload(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_member_channel_update_with_assets_removed_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            // data objects ids start at index 1
            .with_assets_to_remove((1..(DATA_OBJECTS_NUMBER as u64 - 1)).collect())
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn successful_channel_update_with_collaborators_set_updated_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_collaborators(BTreeSet::new())
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_channel_update_with_collaborators_set_updated_by_unauthorized_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(UNAUTHORIZED_MEMBER_ID))
            .with_collaborators(BTreeSet::new())
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn successful_channel_update_with_collaborators_set_updated_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        let default_curator_group_id = NextCuratorGroupId::<Test>::get() - 1;
        UpdateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .with_collaborators(BTreeSet::new())
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_channel_update_with_collaborators_set_updated_by_unauthorized_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        let unauthorized_curator_group_id =
            curators::add_curator_to_new_group(UNAUTHORIZED_CURATOR_ID);
        UpdateChannelFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                unauthorized_curator_group_id,
                UNAUTHORIZED_CURATOR_ID,
            ))
            .with_collaborators(BTreeSet::new())
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_channel_update_with_collaborators_set_updated_by_collaborator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Collaborator(COLLABORATOR_MEMBER_ID))
            .with_collaborators(BTreeSet::new())
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_member_channel_update_with_collaborators_set_updated_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_collaborators(BTreeSet::new())
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn successful_curator_channel_update_with_collaborators_set_updated_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_collaborators(BTreeSet::new())
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_curator_channel_update_with_collaborators_set_updated_by_invalid_lead_origin() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(LEAD_ACCOUNT_ID + 100)
            .with_actor(ContentActor::Lead)
            .with_collaborators(BTreeSet::new())
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()));
    })
}

#[test]
fn successful_channel_update_with_reward_account_updated_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_reward_account(Some(None))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_channel_update_with_reward_account_updated_by_unauthorized_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(UNAUTHORIZED_MEMBER_ID))
            .with_reward_account(Some(None))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn successful_channel_update_with_reward_account_updated_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        let default_curator_group_id = NextCuratorGroupId::<Test>::get() - 1;
        UpdateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .with_reward_account(Some(None))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_channel_update_with_reward_account_updated_by_unauthorized_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        let unauthorized_curator_group_id =
            curators::add_curator_to_new_group(UNAUTHORIZED_CURATOR_ID);
        UpdateChannelFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                unauthorized_curator_group_id,
                UNAUTHORIZED_CURATOR_ID,
            ))
            .with_reward_account(Some(None))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_channel_update_with_reward_account_updated_by_collaborator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Collaborator(COLLABORATOR_MEMBER_ID))
            .with_reward_account(Some(None))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_member_channel_update_with_reward_account_updated_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_reward_account(Some(None))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn successful_curator_channel_update_with_reward_account_updated_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_reward_account(Some(None))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_curator_channel_update_with_reward_account_updated_by_invalid_lead_origin() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(LEAD_ACCOUNT_ID + 100)
            .with_actor(ContentActor::Lead)
            .with_reward_account(Some(None))
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_channel_update_with_data_limits_exceeded() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets_to_upload(StorageAssets::<Test> {
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
fn unsuccessful_channel_update_with_invalid_objects_id_to_remove() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets_to_remove(
                ((DATA_OBJECTS_NUMBER as u64 + 1)..(2 * DATA_OBJECTS_NUMBER as u64)).collect(),
            )
            .call_and_assert(Err(storage::Error::<Test>::DataObjectDoesntExist.into()));
    })
}

#[test]
fn unsuccessful_channel_update_with_invalid_collaborators_set() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_collaborators(vec![COLLABORATOR_MEMBER_ID + 100].into_iter().collect())
            .call_and_assert(Err(Error::<Test>::CollaboratorIsNotValidMember.into()));
    })
}

#[test]
fn unsuccessful_channel_update_with_invalid_expected_data_size_fee() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets_to_upload(StorageAssets::<Test> {
                // setting a purposely high fee to trigger error
                expected_data_size_fee: BalanceOf::<Test>::from(1_000_000u64),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Err(storage::Error::<Test>::DataSizeFeeChanged.into()));
    })
}

#[test]
fn unsuccessful_channel_update_with_insufficient_balance() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();
        slash_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID);

        UpdateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets_to_upload(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Err(storage::Error::<Test>::InsufficientBalance.into()));
    })
}

#[test]
fn unsuccessful_channel_update_with_no_bucket_with_sufficient_object_size_limit() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets_to_upload(StorageAssets::<Test> {
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
fn unsuccessful_channel_update_with_no_bucket_with_sufficient_object_number_limit() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets_to_upload(StorageAssets::<Test> {
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

// channel deletion tests
#[test]
fn successful_curator_channel_deletion_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        DeleteChannelFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_curator_channel_deletion_by_invalid_lead_origin() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        DeleteChannelFixture::default()
            .with_sender(LEAD_ACCOUNT_ID + 100)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_member_channel_deletion_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        DeleteChannelFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_channel_deletion_by_collaborator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        DeleteChannelFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Collaborator(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn successful_channel_deletion_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        DeleteChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_channel_deletion_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        let default_curator_group_id = Content::next_curator_group_id() - 1;
        DeleteChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_channel_deletion_by_unauthorized_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        DeleteChannelFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(UNAUTHORIZED_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_channel_deletion_by_unauthorized_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        let unauthorized_curator_group_id =
            curators::add_curator_to_new_group(UNAUTHORIZED_CURATOR_ID);
        DeleteChannelFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                unauthorized_curator_group_id,
                UNAUTHORIZED_CURATOR_ID,
            ))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_channel_deletion_by_uncorresponding_member_id_and_origin() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        DeleteChannelFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_channel_deletion_by_uncorresponding_curator_id_and_origin() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        let default_curator_group_id = Content::next_curator_group_id() - 1;
        DeleteChannelFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .call_and_assert(Err(Error::<Test>::CuratorAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_channel_deletion_with_invalid_channel_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        DeleteChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_channel_id(Zero::zero())
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));
    })
}

#[test]
fn unsuccessful_channel_deletion_with_invalid_bag_size() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        assert!(DATA_OBJECTS_NUMBER > 0);

        DeleteChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            // default member owned channel has DATA_OBJECTS_NUMBER > 0 assets
            .with_num_objects_to_delete(0u64)
            .call_and_assert(Err(Error::<Test>::InvalidBagSizeSpecified.into()));
    })
}
