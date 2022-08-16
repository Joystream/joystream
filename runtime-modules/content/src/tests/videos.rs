#![cfg(test)]
use std::collections::BTreeMap;
use std::iter::FromIterator;

use super::curators;
use super::fixtures::*;
use super::mock::*;
use crate::*;
use frame_support::assert_err;
use storage::DynamicBagType;

#[test]
fn delete_video_nft_is_issued() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = Content::next_video_id();
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_with_nft();

        // Make an attempt to delete a video, which has an nft issued already.
        assert_err!(
            Content::delete_video(
                Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
                ContentActor::Member(DEFAULT_MEMBER_ID),
                video_id,
                DATA_OBJECTS_NUMBER,
            ),
            Error::<Test>::NftAlreadyExists
        );
    })
}

#[test]
fn successful_video_creation_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        //0 channel SBB
        //+ 11 video SBB
        //+ 0 channel data obj SBB * 10 objs
        //+ 1 video data obj SBB * 10 objs
        //= 11 SBB
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, 11);
        create_default_member_owned_channel();

        let video_state_bloat_bond = 1;
        let data_state_bloat_bond = 1;

        set_data_object_state_bloat_bond(data_state_bloat_bond);
        UpdateVideoStateBloatBondFixture::default()
            .with_video_state_bloat_bond(video_state_bloat_bond)
            .call_and_assert(Ok(()));

        CreateVideoFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_expected_video_state_bloat_bond(video_state_bloat_bond)
            .with_data_object_state_bloat_bond(data_state_bloat_bond)
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unuccessful_video_creation_with_pending_channel_transfer() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(DEFAULT_MEMBER_ID)
            .call_and_assert(Ok(()));

        CreateVideoFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Err(Error::<Test>::InvalidChannelTransferStatus.into()));
    })
}

#[test]
fn successful_video_creation_by_collaborator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(COLLABORATOR_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_collaborator_permissions(&[
            ChannelActionPermission::AddVideo,
        ]);

        CreateVideoFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
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
        create_default_curator_owned_channel(DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND, &[]);

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
        create_default_curator_owned_channel(
            DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND,
            &[ChannelActionPermission::AddVideo],
        );

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
fn unsuccessful_video_creation_with_invalid_expected_video_state_bloat_bond() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let video_state_bloat_bond = 1;

        UpdateVideoStateBloatBondFixture::default()
            .with_video_state_bloat_bond(video_state_bloat_bond)
            .call_and_assert(Ok(()));

        CreateVideoFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Err(Error::<Test>::VideoStateBloatBondChanged.into()));
    })
}

#[test]
fn unsuccessful_video_creation_with_number_of_assets_exceeded() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();

        CreateVideoFixture::default()
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_object_candidates_helper(
                    1,
                    <Test as Config>::MaxNumberOfAssetsPerVideo::get() as u64 + 1,
                ),
            })
            .call_and_assert(Err(Error::<Test>::MaxNumberOfVideoAssetsExceeded.into()));
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
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
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
        create_default_curator_owned_channel(DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND, &[]);

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
        create_default_curator_owned_channel(
            DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND,
            &[ChannelActionPermission::AddVideo],
        );

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
            .with_actor(ContentActor::Member(UNAUTHORIZED_COLLABORATOR_MEMBER_ID))
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
        create_default_curator_owned_channel(
            DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND,
            &[ChannelActionPermission::AddVideo],
        );

        let unauthorized_curator_group_id = curators::add_curator_to_new_group(
            UNAUTHORIZED_CURATOR_ID,
            &[ChannelActionPermission::AddVideo],
        );
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
                expected_data_size_fee: 1_000_000u64,
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Err(storage::Error::<Test>::DataSizeFeeChanged.into()));
    })
}

#[test]
fn unsuccessful_video_creation_with_insufficient_balance() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let data_object_state_bloat_bond = 10;
        set_data_object_state_bloat_bond(data_object_state_bloat_bond);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_storage_buckets(
            true,
            data_object_state_bloat_bond,
            &[],
        );
        slash_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID);

        CreateVideoFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_data_object_state_bloat_bond(data_object_state_bloat_bond)
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Err(
                Error::<Test>::InsufficientBalanceForVideoCreation.into()
            ));
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
        // Set storage bucket number in the dynamic bag creation policy.
        assert_eq!(
            Storage::<Test>::update_number_of_storage_buckets_in_dynamic_bag_creation_policy(
                Origin::signed(STORAGE_WG_LEADER_ACCOUNT_ID),
                DynamicBagType::Channel,
                1,
            ),
            Ok(())
        );

        increase_account_balance_helper(
            DEFAULT_MEMBER_ACCOUNT_ID,
            // balance necessary to create channel + video with specified no. of assets
            DEFAULT_CHANNEL_STATE_BLOAT_BOND
                + DEFAULT_VIDEO_STATE_BLOAT_BOND
                + DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND * (STORAGE_BUCKET_OBJECTS_NUMBER_LIMIT + 1)
                + DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND * DATA_OBJECTS_NUMBER,
        );

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
fn unsuccessful_video_creation_with_max_object_size_limits_exceeded() {
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

#[test]
fn successful_video_update_by_member_with_nft() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        UpdateVideoFixture::default()
            .with_nft_issuance(NftIssuanceParameters::<Test> {
                royalty: None,
                nft_metadata: b"test_nft_metadata".to_vec(),
                non_channel_owner: Some(SECOND_MEMBER_ID),
                init_transactional_status: Default::default(),
            })
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_video_update_by_member_with_assets_upload() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        UpdateVideoFixture::default()
            .with_assets_to_upload(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_video_update_by_collaborator_with_assets_upload() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(COLLABORATOR_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_with_collaborator_permissions(&[
            ChannelActionPermission::ManageVideoAssets,
        ]);

        UpdateVideoFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .with_assets_to_upload(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_video_update_by_lead_with_assets_upload() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video(DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND, &[]);

        UpdateVideoFixture::default()
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
fn successful_video_update_by_curator_with_assets_upload() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video(
            DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND,
            &[ChannelActionPermission::ManageVideoAssets],
        );

        let default_curator_group_id = NextCuratorGroupId::<Test>::get() - 1;
        UpdateVideoFixture::default()
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
fn successful_video_update_by_member_with_assets_removal() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();
        let video_assets = ((DATA_OBJECTS_NUMBER as u64)..(2 * DATA_OBJECTS_NUMBER as u64 - 1))
            .collect::<BTreeSet<_>>();

        UpdateVideoFixture::default()
            .with_assets_to_remove(video_assets)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_video_update_with_pending_channel_transfer() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();
        let video_assets = ((DATA_OBJECTS_NUMBER as u64)..(2 * DATA_OBJECTS_NUMBER as u64 - 1))
            .collect::<BTreeSet<_>>();

        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(DEFAULT_MEMBER_ID)
            .call_and_assert(Ok(()));

        UpdateVideoFixture::default()
            .with_assets_to_remove(video_assets)
            .call_and_assert(Err(Error::<Test>::InvalidChannelTransferStatus.into()));
    })
}

#[test]
fn unsuccessful_video_update_with_number_of_assets_exceeded() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().with_video().setup();

        UpdateVideoFixture::default()
            .with_assets_to_upload(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_object_candidates_helper(
                    1,
                    <Test as Config>::MaxNumberOfAssetsPerVideo::get() as u64 + 1,
                ),
            })
            .call_and_assert(Err(Error::<Test>::MaxNumberOfVideoAssetsExceeded.into()));
    })
}

#[test]
fn successful_video_update_by_collaborator_with_assets_removal() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(COLLABORATOR_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_with_collaborator_permissions(&[
            ChannelActionPermission::ManageVideoAssets,
        ]);
        let video_assets = ((DATA_OBJECTS_NUMBER as u64)..(2 * DATA_OBJECTS_NUMBER as u64 - 1))
            .collect::<BTreeSet<_>>();

        UpdateVideoFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .with_assets_to_remove(video_assets)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_video_update_by_lead_with_assets_removal() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video(DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND, &[]);
        let video_assets = ((DATA_OBJECTS_NUMBER as u64)..(2 * DATA_OBJECTS_NUMBER as u64 - 1))
            .collect::<BTreeSet<_>>();

        UpdateVideoFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_assets_to_remove(video_assets)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_video_update_by_curator_with_assets_removal() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video(
            DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND,
            &[ChannelActionPermission::ManageVideoAssets],
        );
        let video_assets = ((DATA_OBJECTS_NUMBER as u64)..(2 * DATA_OBJECTS_NUMBER as u64 - 1))
            .collect::<BTreeSet<_>>();

        let default_curator_group_id = NextCuratorGroupId::<Test>::get() - 1;
        UpdateVideoFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .with_assets_to_remove(video_assets)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_video_update_with_member_auth_failure() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        UpdateVideoFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_video_update_with_collaborator_auth_failure() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(UNAUTHORIZED_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        UpdateVideoFixture::default()
            .with_sender(UNAUTHORIZED_COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_video_update_with_curator_auth_failure() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(UNAUTHORIZED_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video(DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND, &[]);

        let default_curator_group_id = curators::add_curator_to_new_group(
            DEFAULT_CURATOR_ID,
            &[ChannelActionPermission::UpdateVideoMetadata],
        );
        UpdateVideoFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .call_and_assert(Err(Error::<Test>::CuratorAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_video_update_by_lead_with_member_owned_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        UpdateVideoFixture::default()
            .with_sender(UNAUTHORIZED_LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_video_update_with_unauth_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        UpdateVideoFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(UNAUTHORIZED_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_video_update_with_unauth_collaborator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(UNAUTHORIZED_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        UpdateVideoFixture::default()
            .with_sender(UNAUTHORIZED_COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(UNAUTHORIZED_COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_video_update_with_unauth_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(UNAUTHORIZED_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video(DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND, &[]);

        let unauthorized_curator_group_id = curators::add_curator_to_new_group(
            UNAUTHORIZED_CURATOR_ID,
            &[ChannelActionPermission::UpdateVideoMetadata],
        );
        UpdateVideoFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                unauthorized_curator_group_id,
                UNAUTHORIZED_CURATOR_ID,
            ))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_video_update_with_invalid_expected_data_size_fee() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        UpdateVideoFixture::default()
            .with_assets_to_upload(StorageAssets::<Test> {
                // setting a purposely high fee to trigger error
                expected_data_size_fee: 1_000_000u64,
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Err(storage::Error::<Test>::DataSizeFeeChanged.into()));
    })
}

#[test]
fn unsuccessful_video_update_with_insufficient_balance() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let data_object_state_bloat_bond = 10;
        set_data_object_state_bloat_bond(data_object_state_bloat_bond);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_with_storage_buckets(
            true,
            data_object_state_bloat_bond,
        );
        slash_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID);

        UpdateVideoFixture::default()
            .with_data_object_state_bloat_bond(data_object_state_bloat_bond)
            .with_assets_to_upload(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Err(storage::Error::<Test>::InsufficientBalance.into()));
    })
}

#[test]
fn unsuccessful_video_update_due_to_bucket_having_insufficient_objects_size_left() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);

        create_default_member_owned_channel_with_video();

        UpdateVideoFixture::default()
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
fn unsuccessful_video_update_due_to_bucket_having_insufficient_objects_number_left() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(
            DEFAULT_MEMBER_ACCOUNT_ID,
            // balance necessary to create channel with video + video with specified no. of assets
            DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND * (STORAGE_BUCKET_OBJECTS_NUMBER_LIMIT + 1)
                + DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND * DATA_OBJECTS_NUMBER * 2,
        );

        create_default_member_owned_channel_with_video();

        UpdateVideoFixture::default()
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

#[test]
fn unsuccessful_video_update_with_max_object_size_limits_exceeded() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        UpdateVideoFixture::default()
            .with_assets_to_upload(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: vec![DataObjectCreationParameters {
                    size: <Test as storage::Config>::MaxDataObjectSize::get() + 1,
                    ipfs_content_id: vec![1u8],
                }],
            })
            .call_and_assert(Err(storage::Error::<Test>::MaxDataObjectSizeExceeded.into()));
    })
}

#[test]
fn unsuccessful_video_update_with_invalid_object_ids() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_videos(2, &[]);
        let invalid_objects_ids =
            (DATA_OBJECTS_NUMBER * 2..DATA_OBJECTS_NUMBER * 3).collect::<BTreeSet<_>>();

        UpdateVideoFixture::default()
            .with_assets_to_remove(invalid_objects_ids)
            .call_and_assert(Err(
                Error::<Test>::AssetsToRemoveBeyondEntityAssetsSet.into()
            ));
    })
}

#[test]
fn unsuccessful_video_update_with_invalid_video_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        UpdateVideoFixture::default()
            .with_video_id(Zero::zero())
            .call_and_assert(Err(Error::<Test>::VideoDoesNotExist.into()));
    })
}

#[test]
fn unsuccessful_video_update_with_nft() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_with_nft();

        UpdateVideoFixture::default().call_and_assert(Err(Error::<Test>::NftAlreadyExists.into()));
    })
}

#[test]
fn successful_video_deletion_by_member_with_assets_removal() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        let video_state_bloat_bond = 10;

        UpdateVideoStateBloatBondFixture::default()
            .with_video_state_bloat_bond(video_state_bloat_bond)
            .call_and_assert(Ok(()));

        create_default_member_owned_channel();

        CreateVideoFixture::default()
            .with_expected_video_state_bloat_bond(video_state_bloat_bond)
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Ok(()));

        DeleteVideoFixture::default().call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_video_deletion_with_pending_transfer() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(DEFAULT_MEMBER_ID)
            .call_and_assert(Ok(()));

        DeleteVideoFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidChannelTransferStatus.into()));
    })
}

#[test]
fn successful_video_deletion_by_collaborator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_with_collaborator_permissions(&[
            ChannelActionPermission::DeleteVideo,
            ChannelActionPermission::ManageVideoAssets,
        ]);

        DeleteVideoFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_video_deletion_by_lead_with_member_owned_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        DeleteVideoFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn successful_video_deletion_by_lead_with_curator_owned_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video(DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND, &[]);

        DeleteVideoFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_video_deletion_by_curator_with_assets_removal() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video(
            DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND,
            &[
                ChannelActionPermission::DeleteVideo,
                ChannelActionPermission::ManageVideoAssets,
            ],
        );

        let default_curator_group_id = NextCuratorGroupId::<Test>::get() - 1;
        DeleteVideoFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_video_deletion_by_member_with_auth_failure() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        DeleteVideoFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_video_deletion_by_curator_with_auth_failure() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video(
            DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND,
            &[
                ChannelActionPermission::DeleteVideo,
                ChannelActionPermission::ManageVideoAssets,
            ],
        );

        let default_curator_group_id = NextCuratorGroupId::<Test>::get() - 1;
        DeleteVideoFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .call_and_assert(Err(Error::<Test>::CuratorAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_video_deletion_with_lead_auth_failure() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video(DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND, &[]);

        DeleteVideoFixture::default()
            .with_sender(UNAUTHORIZED_LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_video_deletion_by_unauth_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        DeleteVideoFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(UNAUTHORIZED_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_video_deletion_by_unauth_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video(
            DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND,
            &[
                ChannelActionPermission::DeleteVideo,
                ChannelActionPermission::ManageVideoAssets,
            ],
        );

        let unauthorized_curator_group_id = curators::add_curator_to_new_group(
            UNAUTHORIZED_CURATOR_ID,
            &[
                ChannelActionPermission::DeleteVideo,
                ChannelActionPermission::ManageVideoAssets,
            ],
        );
        DeleteVideoFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                unauthorized_curator_group_id,
                UNAUTHORIZED_CURATOR_ID,
            ))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_video_deletion_with_invalid_video_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        DeleteVideoFixture::default()
            .with_video_id(Zero::zero())
            .call_and_assert(Err(Error::<Test>::VideoDoesNotExist.into()));
    })
}

#[test]
fn unsuccessful_video_deletion_with_invalid_num_objects_to_delete() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        DeleteVideoFixture::default()
            .with_num_objects_to_delete(DATA_OBJECTS_NUMBER - 1)
            .call_and_assert(Err(
                Error::<Test>::InvalidVideoDataObjectsCountProvided.into()
            ));
    })
}

#[test]
fn unsuccessful_video_update_with_nft_issuance_when_nft_already_issued() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();
        set_default_nft_limits();

        // create video with nft issued
        CreateVideoFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_nft_issuance(NftIssuanceParameters::<Test> {
                royalty: None,
                nft_metadata: b"test_nft_metadata".to_vec(),
                non_channel_owner: Some(SECOND_MEMBER_ID),
                init_transactional_status: Default::default(),
            })
            .call_and_assert(Ok(()));

        UpdateVideoFixture::default()
            .with_nft_issuance(NftIssuanceParameters::<Test> {
                royalty: None,
                nft_metadata: b"test_nft_metadata".to_vec(),
                non_channel_owner: Some(SECOND_MEMBER_ID),
                init_transactional_status: Default::default(),
            })
            .call_and_assert(Err(Error::<Test>::NftAlreadyExists.into()))
    })
}

#[test]
fn create_video_failed_with_exceeded_global_daily_nft_limits() {
    with_default_mock_builder(|| {
        nft_test_helper_for_exceeded_limit_on_creating_video(
            NftLimitId::GlobalDaily,
            Error::<Test>::GlobalNftDailyLimitExceeded,
        );
    })
}

#[test]
fn create_video_failed_with_exceeded_global_weekly_nft_limits() {
    with_default_mock_builder(|| {
        nft_test_helper_for_exceeded_limit_on_creating_video(
            NftLimitId::GlobalWeekly,
            Error::<Test>::GlobalNftWeeklyLimitExceeded,
        );
    })
}

#[test]
fn create_video_failed_with_exceeded_channel_daily_nft_limits() {
    with_default_mock_builder(|| {
        let channel_id = 1;
        nft_test_helper_for_exceeded_limit_on_creating_video(
            NftLimitId::ChannelDaily(channel_id),
            Error::<Test>::ChannelNftDailyLimitExceeded,
        );
    })
}
#[test]
fn create_video_failed_with_exceeded_channel_weekly_nft_limits() {
    with_default_mock_builder(|| {
        let channel_id = 1;
        nft_test_helper_for_exceeded_limit_on_creating_video(
            NftLimitId::ChannelWeekly(channel_id),
            Error::<Test>::ChannelNftWeeklyLimitExceeded,
        );
    })
}

fn nft_test_helper_for_exceeded_limit_on_creating_video(
    nft_limit_id: NftLimitId<u64>,
    expected_error: Error<Test>,
) {
    run_to_block(1);

    create_initial_storage_buckets_helper();
    increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
    create_default_member_owned_channel();
    set_default_nft_limits();

    Content::set_nft_limit(nft_limit_id, Default::default());

    // create video with nft issued
    CreateVideoFixture::default()
        .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
        .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
        .with_nft_issuance(NftIssuanceParameters::<Test> {
            royalty: None,
            nft_metadata: b"test_nft_metadata".to_vec(),
            non_channel_owner: Some(SECOND_MEMBER_ID),
            init_transactional_status: Default::default(),
        })
        .call_and_assert(Err(expected_error.into()));
}

#[test]
fn update_video_failed_with_exceeded_global_daily_nft_limits() {
    with_default_mock_builder(|| {
        nft_test_helper_for_exceeded_limit_on_updating_video(
            NftLimitId::GlobalDaily,
            Error::<Test>::GlobalNftDailyLimitExceeded,
        );
    })
}

#[test]
fn update_video_failed_with_exceeded_global_weekly_nft_limits() {
    with_default_mock_builder(|| {
        nft_test_helper_for_exceeded_limit_on_updating_video(
            NftLimitId::GlobalWeekly,
            Error::<Test>::GlobalNftWeeklyLimitExceeded,
        );
    })
}
#[test]
fn update_video_failed_with_exceeded_channel_daily_nft_limits() {
    with_default_mock_builder(|| {
        let channel_id = 1;
        nft_test_helper_for_exceeded_limit_on_updating_video(
            NftLimitId::ChannelDaily(channel_id),
            Error::<Test>::ChannelNftDailyLimitExceeded,
        );
    })
}
#[test]
fn update_video_failed_with_exceeded_channel_weekly_nft_limits() {
    with_default_mock_builder(|| {
        let channel_id = 1;
        nft_test_helper_for_exceeded_limit_on_updating_video(
            NftLimitId::ChannelWeekly(channel_id),
            Error::<Test>::ChannelNftWeeklyLimitExceeded,
        );
    })
}

fn nft_test_helper_for_exceeded_limit_on_updating_video(
    nft_limit_id: NftLimitId<u64>,
    expected_error: Error<Test>,
) {
    run_to_block(1);

    create_initial_storage_buckets_helper();
    increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
    create_default_member_owned_channel();
    set_default_nft_limits();

    Content::set_nft_limit(nft_limit_id, Default::default());

    // create video with nft issued
    CreateVideoFixture::default()
        .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
        .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
        .call_and_assert(Ok(()));

    UpdateVideoFixture::default()
        .with_nft_issuance(NftIssuanceParameters::<Test> {
            royalty: None,
            nft_metadata: b"test_nft_metadata".to_vec(),
            non_channel_owner: Some(SECOND_MEMBER_ID),
            init_transactional_status: Default::default(),
        })
        .call_and_assert(Err(expected_error.into()));
}

#[test]
fn unsuccessful_moderation_action_video_deletion_by_actors_with_auth_failure() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let curator_group_id = curators::create_curator_group(BTreeMap::new());

        // Member - invalid sender
        DeleteVideoAsModeratorFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()));

        // Curator - invalid sender
        DeleteVideoAsModeratorFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::CuratorAuthFailed.into()));

        // Curator - invalid group
        DeleteVideoAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(
                Error::<Test>::CuratorIsNotAMemberOfGivenCuratorGroup.into()
            ));

        // Lead - invalid sender
        DeleteVideoAsModeratorFixture::default()
            .with_sender(UNAUTHORIZED_LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_video_deletion_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        DeleteVideoAsModeratorFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_video_deletion_by_curator_with_no_permissions() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let curator_group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID, &[]);

        DeleteVideoAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::CuratorModerationActionNotAllowed.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_nft_video_deletion_by_curator() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_with_nft();

        let curator_group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::DeleteVideo]),
            )]),
        );

        DeleteVideoAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::NftAlreadyExists.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_nft_video_deletion_by_lead() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_with_nft();

        DeleteVideoAsModeratorFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::NftAlreadyExists.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_video_deletion_by_curator_with_invalid_storage_buckets_num_witness(
) {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().with_video().setup();

        let curator_group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::DeleteVideo]),
            )]),
        );

        DeleteVideoAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .with_storage_buckets_num_witness(Some(0))
            .call_and_assert(Err(
                Error::<Test>::InvalidStorageBucketsNumWitnessProvided.into()
            ));
    })
}

#[test]
fn unsuccessful_moderation_action_video_deletion_by_curator_with_missing_storage_buckets_num_witness(
) {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().with_video().setup();

        let curator_group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::DeleteVideo]),
            )]),
        );

        DeleteVideoAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .with_storage_buckets_num_witness(None)
            .call_and_assert(Err(Error::<Test>::MissingStorageBucketsNumWitness.into()));
    })
}

#[test]
fn successful_moderation_action_video_deletion_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let curator_group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::DeleteVideo]),
            )]),
        );

        DeleteVideoAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_moderation_action_video_deletion_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        DeleteVideoAsModeratorFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_moderation_action_video_visibility_change_by_actors_with_auth_failure() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let curator_group_id = curators::create_curator_group(BTreeMap::new());

        // Member - invalid sender
        SetVideoVisibilityAsModeratorFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()));

        // Curator - invalid sender
        SetVideoVisibilityAsModeratorFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::CuratorAuthFailed.into()));

        // Curator - not in group
        SetVideoVisibilityAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(
                Error::<Test>::CuratorIsNotAMemberOfGivenCuratorGroup.into()
            ));

        // Lead - invalid sender
        SetVideoVisibilityAsModeratorFixture::default()
            .with_sender(UNAUTHORIZED_LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_video_visibility_change_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Member - invalid sender
        SetVideoVisibilityAsModeratorFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_non_existing_video_visibility_change() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let curator_group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::HideVideo]),
            )]),
        );
        // As curator
        SetVideoVisibilityAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::VideoDoesNotExist.into()));
        // As lead
        SetVideoVisibilityAsModeratorFixture::default()
            .call_and_assert(Err(Error::<Test>::VideoDoesNotExist.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_video_visibility_change_by_curator_without_permissions() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let curator_group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID, &[]);
        // As curator
        SetChannelVisibilityAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::CuratorModerationActionNotAllowed.into()));
    })
}

#[test]
fn successful_moderation_action_video_visibility_change_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let curator_group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::HideVideo]),
            )]),
        );
        // Set to hidden
        SetVideoVisibilityAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Ok(()));
        // Set to visible
        SetVideoVisibilityAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .with_is_hidden(false)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_moderation_action_channel_visibility_change_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Set to hidden
        SetVideoVisibilityAsModeratorFixture::default().call_and_assert(Ok(()));
        // Set to visible
        SetVideoVisibilityAsModeratorFixture::default()
            .with_is_hidden(false)
            .call_and_assert(Ok(()));
    })
}

// Video assets removal

#[test]
fn unsuccessful_moderation_action_video_assets_deletion_by_actors_with_auth_failure() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let curator_group_id = curators::create_curator_group(BTreeMap::new());

        // Member - invalid sender
        DeleteVideoAssetsAsModeratorFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()));

        // Curator - invalid sender
        DeleteVideoAssetsAsModeratorFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::CuratorAuthFailed.into()));

        // Curator - invalid group
        DeleteVideoAssetsAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(
                Error::<Test>::CuratorIsNotAMemberOfGivenCuratorGroup.into()
            ));

        // Lead - invalid sender
        DeleteVideoAssetsAsModeratorFixture::default()
            .with_sender(UNAUTHORIZED_LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_video_assets_deletion_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        DeleteVideoAssetsAsModeratorFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_video_assets_deletion_by_curator_with_no_permissions() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let curator_group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID, &[]);

        DeleteVideoAssetsAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::CuratorModerationActionNotAllowed.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_nft_video_assets_deletion_by_curator_with_no_permissions() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_with_nft();

        let curator_group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::DeleteVideoAssets(false)]),
            )]),
        );

        DeleteVideoAssetsAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::CuratorModerationActionNotAllowed.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_invalid_video_assets_deletion() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_videos(2, &[]);

        let curator_group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::DeleteVideoAssets(false)]),
            )]),
        );

        let assets_to_remove =
            BTreeSet::from_iter((2 * DATA_OBJECTS_NUMBER)..(3 * DATA_OBJECTS_NUMBER));

        DeleteVideoAssetsAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .with_assets_to_remove(assets_to_remove)
            .call_and_assert(Err(
                Error::<Test>::AssetsToRemoveBeyondEntityAssetsSet.into()
            ));
    })
}

#[test]
fn unsuccessful_moderation_action_non_existing_video_assets_deletion() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let curator_group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::DeleteVideoAssets(false)]),
            )]),
        );

        DeleteVideoAssetsAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .with_video_id(2)
            .call_and_assert(Err(Error::<Test>::VideoDoesNotExist.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_nft_video_assets_deletion_by_curator_with_invalid_storage_buckets_num_witness(
) {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().with_video_nft().setup();

        let curator_group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::DeleteVideoAssets(true)]),
            )]),
        );

        DeleteVideoAssetsAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .with_storage_buckets_num_witness(Some(0))
            .call_and_assert(Err(
                Error::<Test>::InvalidStorageBucketsNumWitnessProvided.into()
            ));
    })
}

#[test]
fn unsuccessful_moderation_action_nft_video_assets_deletion_by_curator_with_missing_storage_buckets_num_witness(
) {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().with_video_nft().setup();

        let curator_group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::DeleteVideoAssets(true)]),
            )]),
        );

        DeleteVideoAssetsAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .with_storage_buckets_num_witness(None)
            .call_and_assert(Err(Error::<Test>::MissingStorageBucketsNumWitness.into()));
    })
}

#[test]
fn successful_moderation_action_video_assets_deletion_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let curator_group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::DeleteVideoAssets(false)]),
            )]),
        );

        DeleteVideoAssetsAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_moderation_action_video_assets_deletion_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        DeleteVideoAssetsAsModeratorFixture::default().call_and_assert(Ok(()));
    })
}

#[test]
fn successful_moderation_action_nft_video_assets_deletion_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_with_nft();

        let curator_group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::DeleteVideoAssets(true)]),
            )]),
        );

        DeleteVideoAssetsAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_moderation_action_nft_video_assets_deletion_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_with_nft();

        DeleteVideoAssetsAsModeratorFixture::default().call_and_assert(Ok(()));
    })
}
