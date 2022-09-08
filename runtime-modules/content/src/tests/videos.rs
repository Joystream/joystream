#![cfg(test)]
use std::collections::BTreeMap;
use std::iter::FromIterator;

use super::curators;
use super::fixtures::*;
use super::mock::*;
use crate::*;
use storage::DynamicBagType;
use storage::ModuleAccount as StorageModuleAccount;

#[test]
fn unsuccessful_video_deletion_when_nft_issued() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().with_video_nft().setup();

        // Make an attempt to delete a video, which has an nft issued already.
        DeleteVideoFixture::default().call_and_assert(Err(Error::<Test>::NftAlreadyExists.into()))
    })
}

#[test]
fn successful_video_creation_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let video_state_bloat_bond = ed() + 1;
        let data_state_bloat_bond = 1;

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(
            DEFAULT_MEMBER_ACCOUNT_ID,
            ed() + DEFAULT_CHANNEL_STATE_BLOAT_BOND
                + video_state_bloat_bond
                + data_state_bloat_bond * 10,
        );
        create_default_member_owned_channel();

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
        ContentTest::with_curator_channel()
            .with_agent_permissions(&[ChannelActionPermission::AddVideo])
            .setup();

        CreateVideoFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
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
            .with_expected_video_state_bloat_bond(video_state_bloat_bond - 1)
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
        ContentTest::with_curator_channel()
            .with_agent_permissions(&[ChannelActionPermission::AddVideo])
            .setup();

        CreateVideoFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
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
        ContentTest::with_curator_channel()
            .with_agent_permissions(&[ChannelActionPermission::AddVideo])
            .setup();
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
            ed() + DEFAULT_CHANNEL_STATE_BLOAT_BOND
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
fn unsuccessful_video_creation_with_invalid_storage_buckets_num_witness() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        CreateVideoFixture::default()
            .with_storage_buckets_num_witness(0)
            .call_and_assert(Err(
                Error::<Test>::InvalidStorageBucketsNumWitnessProvided.into()
            ))
    })
}

#[test]
fn successful_video_creation_with_invitation_lock() {
    with_default_mock_builder(|| {
        let (data_size_fee, data_obj_bloat_bond, channel_state_bloat_bond, video_state_bloat_bond) =
            (10u64, 20u64, ed(), 30u64);
        set_fees(
            data_size_fee,
            data_obj_bloat_bond,
            channel_state_bloat_bond,
            video_state_bloat_bond,
        );

        ContentTest::with_member_channel().setup();

        let total_cost =
            data_size_fee + data_obj_bloat_bond * DATA_OBJECTS_NUMBER + video_state_bloat_bond;
        let member_balance = ed() + total_cost;

        Balances::<Test>::make_free_balance_be(&DEFAULT_MEMBER_ACCOUNT_ID, member_balance);
        set_invitation_lock(&DEFAULT_MEMBER_ACCOUNT_ID, member_balance);

        CreateVideoFixture::default()
            .with_assets(create_default_assets_helper())
            .call_and_assert(Ok(()));

        let storage_module_acc = storage::StorageTreasury::<Test>::module_account_id();

        assert_eq!(
            Balances::<Test>::usable_balance(storage_module_acc),
            ed() + data_obj_bloat_bond * DATA_OBJECTS_NUMBER * 2
        );
        assert_eq!(
            System::account(DEFAULT_MEMBER_ACCOUNT_ID).data,
            balances::AccountData {
                free: ed(),
                reserved: 0,
                misc_frozen: ed() + total_cost,
                fee_frozen: 0
            }
        )
    })
}

#[test]
fn unsuccessful_video_creation_with_locks_and_insufficient_balance() {
    with_default_mock_builder(|| {
        let (data_size_fee, data_obj_bloat_bond, channel_state_bloat_bond, video_state_bloat_bond) =
            (10u64, 20u64, ed(), 30u64);
        set_fees(
            data_size_fee,
            data_obj_bloat_bond,
            channel_state_bloat_bond,
            video_state_bloat_bond,
        );

        ContentTest::with_member_channel().setup();

        let total_cost =
            data_size_fee + data_obj_bloat_bond * DATA_OBJECTS_NUMBER + video_state_bloat_bond;
        let member_balance = ed() + total_cost - 1;

        Balances::<Test>::make_free_balance_be(&DEFAULT_MEMBER_ACCOUNT_ID, member_balance);
        set_invitation_lock(&DEFAULT_MEMBER_ACCOUNT_ID, member_balance);

        CreateVideoFixture::default()
            .with_assets(create_default_assets_helper())
            .call_and_assert(Err(
                Error::<Test>::InsufficientBalanceForVideoCreation.into()
            ));

        // Increase balance by 1, but lock ED and those funds with another, not-allowed lock
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, 1);
        set_staking_candidate_lock(&DEFAULT_MEMBER_ACCOUNT_ID, ed() + 1);

        CreateVideoFixture::default()
            .with_assets(create_default_assets_helper())
            .call_and_assert(Err(
                Error::<Test>::InsufficientBalanceForVideoCreation.into()
            ));
    })
}

#[test]
fn unsuccessful_video_creation_with_not_allowed_lock() {
    with_default_mock_builder(|| {
        let (data_size_fee, data_obj_bloat_bond, channel_state_bloat_bond, video_state_bloat_bond) =
            (10u64, 20u64, ed(), 30u64);
        set_fees(
            data_size_fee,
            data_obj_bloat_bond,
            channel_state_bloat_bond,
            video_state_bloat_bond,
        );

        ContentTest::with_member_channel().setup();

        let total_cost =
            data_size_fee + data_obj_bloat_bond * DATA_OBJECTS_NUMBER + video_state_bloat_bond;
        let member_balance = ed() + total_cost;

        Balances::<Test>::make_free_balance_be(&DEFAULT_MEMBER_ACCOUNT_ID, member_balance);
        set_staking_candidate_lock(&DEFAULT_MEMBER_ACCOUNT_ID, member_balance);

        CreateVideoFixture::default()
            .with_assets(create_default_assets_helper())
            .call_and_assert(Err(
                Error::<Test>::InsufficientBalanceForVideoCreation.into()
            ));
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
        ContentTest::with_curator_channel()
            .with_video()
            .with_agent_permissions(&[ChannelActionPermission::ManageVideoAssets])
            .setup();

        UpdateVideoFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
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
        ContentTest::with_curator_channel()
            .with_video()
            .with_agent_permissions(&[ChannelActionPermission::ManageVideoAssets])
            .setup();

        let video_assets = ((DATA_OBJECTS_NUMBER as u64)..(2 * DATA_OBJECTS_NUMBER as u64 - 1))
            .collect::<BTreeSet<_>>();

        UpdateVideoFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
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
        ContentTest::with_curator_channel()
            .with_video()
            .with_agent_permissions(&[
                ChannelActionPermission::DeleteVideo,
                ChannelActionPermission::ManageVideoAssets,
            ])
            .setup();
        UpdateVideoFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
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
        ContentTest::with_curator_channel()
            .with_video()
            .with_agent_permissions(&[ChannelActionPermission::UpdateVideoMetadata])
            .setup();
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
            ed() + DEFAULT_CHANNEL_STATE_BLOAT_BOND
                + DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND * (STORAGE_BUCKET_OBJECTS_NUMBER_LIMIT + 1)
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
fn unsuccessful_video_update_with_assets_to_upload_and_invalid_storage_buckets_num_witness() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().with_video().setup();
        UpdateVideoFixture::default()
            .with_assets_to_upload(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .with_storage_buckets_num_witness(Some(0))
            .call_and_assert(Err(
                Error::<Test>::InvalidStorageBucketsNumWitnessProvided.into()
            ));
    })
}

#[test]
fn unsuccessful_video_update_with_assets_to_upload_and_missing_storage_buckets_num_witness() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().with_video().setup();
        UpdateVideoFixture::default()
            .with_assets_to_upload(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .with_storage_buckets_num_witness(None)
            .call_and_assert(Err(Error::<Test>::MissingStorageBucketsNumWitness.into()));
    })
}

#[test]
fn unsuccessful_video_update_with_assets_to_remove_and_invalid_storage_buckets_num_witness() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().with_video().setup();

        let video_assets = ((DATA_OBJECTS_NUMBER as u64)..(2 * DATA_OBJECTS_NUMBER as u64 - 1))
            .collect::<BTreeSet<_>>();

        UpdateVideoFixture::default()
            .with_assets_to_remove(video_assets)
            .with_storage_buckets_num_witness(Some(0))
            .call_and_assert(Err(
                Error::<Test>::InvalidStorageBucketsNumWitnessProvided.into()
            ));
    })
}

#[test]
fn unsuccessful_video_update_with_assets_to_remove_and_missing_storage_buckets_num_witness() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().with_video().setup();

        let video_assets = ((DATA_OBJECTS_NUMBER as u64)..(2 * DATA_OBJECTS_NUMBER as u64 - 1))
            .collect::<BTreeSet<_>>();

        UpdateVideoFixture::default()
            .with_assets_to_remove(video_assets)
            .with_storage_buckets_num_witness(None)
            .call_and_assert(Err(Error::<Test>::MissingStorageBucketsNumWitness.into()));
    })
}

#[test]
fn successful_video_deletion_by_member_with_assets_removal() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();

        let video_state_bloat_bond = ed() + 1;

        UpdateVideoStateBloatBondFixture::default()
            .with_video_state_bloat_bond(video_state_bloat_bond)
            .call_and_assert(Ok(()));

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
        ContentTest::with_curator_channel().with_video().setup();

        DeleteVideoFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_video_deletion_by_curator_with_assets_removal() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_video()
            .with_agent_permissions(&[
                ChannelActionPermission::DeleteVideo,
                ChannelActionPermission::ManageVideoAssets,
            ])
            .setup();

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
        ContentTest::with_curator_channel()
            .with_video()
            .with_agent_permissions(&[
                ChannelActionPermission::DeleteVideo,
                ChannelActionPermission::ManageVideoAssets,
            ])
            .setup();

        DeleteVideoFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(Error::<Test>::CuratorAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_video_deletion_with_lead_auth_failure() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel().with_video().setup();

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
        ContentTest::with_curator_channel()
            .with_video()
            .with_agent_permissions(&[
                ChannelActionPermission::DeleteVideo,
                ChannelActionPermission::ManageVideoAssets,
            ])
            .setup();
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
fn unsuccessful_video_deletion_with_assets_and_invalid_storage_buckets_num_witness() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().with_video().setup();

        // Make an attempt to delete a video, which has an nft issued already.
        DeleteVideoFixture::default()
            .with_storage_buckets_num_witness(Some(0))
            .call_and_assert(Err(
                Error::<Test>::InvalidStorageBucketsNumWitnessProvided.into()
            ))
    })
}

#[test]
fn unsuccessful_video_deletion_with_assets_and_storage_buckets_num_witness_missing() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().with_video().setup();

        // Make an attempt to delete a video, which has an nft issued already.
        DeleteVideoFixture::default()
            .with_storage_buckets_num_witness(None)
            .call_and_assert(Err(Error::<Test>::MissingStorageBucketsNumWitness.into()))
    })
}

#[test]
fn successful_video_deletion_with_bloat_bonds_repaid_to_correct_accounts() {
    let (data_size_fee, data_obj_bloat_bond, channel_state_bloat_bond, video_state_bloat_bond) =
        (10u64, 20u64, ed(), 30u64);

    let test_cases = [
        (
            ed(), // locked balance
            (
                ed(),                                                     // creator account post-removal balance
                ed() + data_obj_bloat_bond * 10 + video_state_bloat_bond, // remover account post-removal balance
            ),
        ),
        (
            ed() + 1, // locked balance
            (
                ed() + video_state_bloat_bond,   // creator account post-removal balance
                ed() + data_obj_bloat_bond * 10, // remover account post-removal balance
            ),
        ),
        (
            ed() + video_state_bloat_bond, // locked balance
            (
                ed() + video_state_bloat_bond,   // creator account post-removal balance
                ed() + data_obj_bloat_bond * 10, // remover account post-removal balance
            ),
        ),
        (
            ed() + video_state_bloat_bond + data_size_fee, // locked balance
            (
                ed() + video_state_bloat_bond,   // creator account post-removal balance
                ed() + data_obj_bloat_bond * 10, // remover account post-removal balance
            ),
        ),
        (
            ed() + video_state_bloat_bond + data_size_fee + 1, // locked balance
            (
                ed() + video_state_bloat_bond + data_obj_bloat_bond, // creator account post-removal balance
                ed() + data_obj_bloat_bond * 9, // remover account post-removal balance
            ),
        ),
        (
            ed() + video_state_bloat_bond + data_size_fee + data_obj_bloat_bond, // locked balance
            (
                ed() + video_state_bloat_bond + data_obj_bloat_bond, // creator account post-removal balance
                ed() + data_obj_bloat_bond * 9, // remover account post-removal balance
            ),
        ),
        (
            ed() + video_state_bloat_bond + data_size_fee + data_obj_bloat_bond + 1, // locked balance
            (
                ed() + video_state_bloat_bond + data_obj_bloat_bond * 2, // creator account post-removal balance
                ed() + data_obj_bloat_bond * 8, // remover account post-removal balance
            ),
        ),
        (
            ed() + video_state_bloat_bond + data_size_fee + data_obj_bloat_bond * 9 + 1, // locked balance
            (
                ed() + video_state_bloat_bond + data_obj_bloat_bond * 10, // creator account post-removal balance
                ed(), // remover account post-removal balance
            ),
        ),
        (
            ed() + video_state_bloat_bond + data_size_fee + data_obj_bloat_bond * 10, // locked balance
            (
                ed() + video_state_bloat_bond + data_obj_bloat_bond * 10, // creator account post-removal balance
                ed(), // remover account post-removal balance
            ),
        ),
    ];

    for case in test_cases {
        let (locked_balance, (expected_creator_balance, expected_remover_balance)) = case;
        with_default_mock_builder(|| {
            set_fees(
                data_size_fee,
                data_obj_bloat_bond,
                channel_state_bloat_bond,
                video_state_bloat_bond,
            );

            ContentTest::with_member_channel().setup();

            let total_cost =
                data_size_fee + data_obj_bloat_bond * DATA_OBJECTS_NUMBER + video_state_bloat_bond;
            let member_balance = ed() + total_cost;

            Balances::<Test>::make_free_balance_be(&DEFAULT_MEMBER_ACCOUNT_ID, member_balance);
            Balances::<Test>::make_free_balance_be(&DEFAULT_MEMBER_ALT_ACCOUNT_ID, ed());
            set_invitation_lock(&DEFAULT_MEMBER_ACCOUNT_ID, locked_balance);

            CreateVideoFixture::default()
                .with_assets(create_default_assets_helper())
                .call_and_assert(Ok(()));

            // Delete video using different (alternative) controller account
            DeleteVideoFixture::default()
                .with_sender(DEFAULT_MEMBER_ALT_ACCOUNT_ID)
                .call_and_assert(Ok(()));

            let storage_module_acc = storage::StorageTreasury::<Test>::module_account_id();
            let channel_acc = ContentTreasury::<Test>::account_for_channel(ChannelId::one());

            // Verify that video and assets bloat bonds were returned to correct accounts
            assert_eq!(
                Balances::<Test>::usable_balance(&channel_acc),
                channel_state_bloat_bond
            );
            assert_eq!(
                Balances::<Test>::usable_balance(storage_module_acc),
                ed() + data_obj_bloat_bond * DATA_OBJECTS_NUMBER
            );
            assert_eq!(
                Balances::<Test>::free_balance(DEFAULT_MEMBER_ACCOUNT_ID),
                expected_creator_balance
            );
            assert_eq!(
                Balances::<Test>::free_balance(DEFAULT_MEMBER_ALT_ACCOUNT_ID),
                expected_remover_balance
            );
        });
    }
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
            .with_storage_buckets_num_witness(0)
            .call_and_assert(Err(
                Error::<Test>::InvalidStorageBucketsNumWitnessProvided.into()
            ));
    })
}

#[test]
fn unsuccessful_moderation_action_nft_video_assets_deletion_by_curator_with_zero_number_of_assets_to_delete(
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
            .with_assets_to_remove(BTreeSet::new())
            .call_and_assert(Err(Error::<Test>::NumberOfAssetsToRemoveIsZero.into()));
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
