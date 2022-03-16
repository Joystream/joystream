#![cfg(test)]

use std::collections::BTreeMap;
use std::iter::FromIterator;
use strum::IntoEnumIterator;

use super::curators;
use super::fixtures::*;
use super::mock::*;
use crate::*;

// channel creation tests
#[test]
fn successful_channel_creation_with_member_context() {
    with_default_mock_builder(|| {
        run_to_block(1);
        create_initial_storage_buckets_helper();

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
        create_initial_storage_buckets_helper();
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
fn unsuccessful_channel_creation_with_no_bucket_with_sufficient_size_available() {
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
    })
}

#[test]
fn unsuccessful_channel_creation_with_no_bucket_with_sufficient_number_available() {
    with_default_mock_builder(|| {
        run_to_block(1);
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(
            DEFAULT_MEMBER_ACCOUNT_ID,
            DATA_OBJECT_DELETION_PRIZE * (STORAGE_BUCKET_OBJECTS_NUMBER_LIMIT + 1),
        );
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

        create_initial_storage_buckets_helper();

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
            .call_and_assert(Err(Error::<Test>::InvalidMemberProvided.into()));
    })
}

#[test]
fn successful_channel_creation_with_reward_account() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
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
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
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
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
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
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
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
            .with_actor(ContentActor::Member(UNAUTHORIZED_COLLABORATOR_MEMBER_ID))
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
            .with_actor(ContentActor::Member(UNAUTHORIZED_COLLABORATOR_MEMBER_ID))
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
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
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
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
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
        create_default_member_owned_channel_with_video();

        UpdateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets_to_remove(
                ((DATA_OBJECTS_NUMBER as u64)..(2 * DATA_OBJECTS_NUMBER as u64)).collect(),
            )
            .call_and_assert(Err(
                Error::<Test>::AssetsToRemoveBeyondEntityAssetsSet.into()
            ));
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
            .call_and_assert(Err(Error::<Test>::InvalidMemberProvided.into()));
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
        increase_account_balance_helper(
            DEFAULT_MEMBER_ACCOUNT_ID,
            // balance necessary to create channel + video with specified no. of assets
            DATA_OBJECT_DELETION_PRIZE * (STORAGE_BUCKET_OBJECTS_NUMBER_LIMIT + 1)
                + DATA_OBJECT_DELETION_PRIZE * DATA_OBJECTS_NUMBER,
        );

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

// channel privilege level tests
#[test]
fn unsuccessful_channel_privilege_level_update_with_curator_origin() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelPrivilegeLevelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_channel_privilege_level_update_with_invalid_channel_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelPrivilegeLevelFixture::default()
            .with_channel_id(2)
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));
    })
}

#[test]
fn successful_channel_privilege_level_update_with_lead_origin() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelPrivilegeLevelFixture::default().call_and_assert(Ok(()));
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
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
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

#[test]
fn unsuccessful_channel_creation_with_invalid_moderator_set() {
    with_default_mock_builder(|| {
        run_to_block(1);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_moderators(vec![DEFAULT_MODERATOR_ID + 100].into_iter().collect())
            .call_and_assert(Err(Error::<Test>::InvalidMemberProvided.into()));
    })
}

/// MODERATION ACTIONS

#[test]
fn unsuccessful_moderation_action_channel_deletion_by_actors_with_auth_failure() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let curator_group_id = curators::create_curator_group(BTreeMap::new());

        // Member - invalid sender
        DeleteChannelAsModeratorFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()));

        // Curator - invalid sender
        DeleteChannelAsModeratorFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::CuratorAuthFailed.into()));

        // Curator - not in group
        DeleteChannelAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(
                Error::<Test>::CuratorIsNotAMemberOfGivenCuratorGroup.into()
            ));

        // Lead - invalid sender
        DeleteChannelAsModeratorFixture::default()
            .with_sender(UNAUTHORIZED_LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_channel_deletion_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        DeleteChannelAsModeratorFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_channel_deletion_by_curator_without_permissions() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        CreateChannelFixture::default().call_and_assert(Ok(()));

        let group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);

        DeleteChannelAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(group_id, DEFAULT_CURATOR_ID))
            .with_num_objects_to_delete(0)
            .call_and_assert(Err(Error::<Test>::CuratorModerationActionNotAllowed.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_non_existing_channel_deletion() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::DeleteChannel]),
            )]),
        );

        // As curator
        DeleteChannelAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));

        // As lead
        DeleteChannelAsModeratorFixture::default()
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_channel_with_videos_deletion() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::DeleteChannel]),
            )]),
        );

        // As curator
        DeleteChannelAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::ChannelContainsVideos.into()));

        // As lead
        DeleteChannelAsModeratorFixture::default()
            .call_and_assert(Err(Error::<Test>::ChannelContainsVideos.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_channel_deletion_with_invalid_num_objects_to_delete() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::DeleteChannel]),
            )]),
        );

        // As curator
        DeleteChannelAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(group_id, DEFAULT_CURATOR_ID))
            .with_num_objects_to_delete(DATA_OBJECTS_NUMBER as u64 - 1)
            .call_and_assert(Err(Error::<Test>::InvalidBagSizeSpecified.into()));
        // As lead
        DeleteChannelAsModeratorFixture::default()
            .with_num_objects_to_delete(DATA_OBJECTS_NUMBER as u64 - 1)
            .call_and_assert(Err(Error::<Test>::InvalidBagSizeSpecified.into()));
    })
}

#[test]
fn successful_moderation_action_channel_deletion_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        CreateChannelFixture::default().call_and_assert(Ok(()));

        let group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::DeleteChannel]),
            )]),
        );

        DeleteChannelAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_num_objects_to_delete(0)
            .with_actor(ContentActor::Curator(group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_moderation_action_channel_with_assets_deletion_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::DeleteChannel]),
            )]),
        );

        DeleteChannelAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_moderation_action_channel_deletion_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        CreateChannelFixture::default().call_and_assert(Ok(()));

        DeleteChannelAsModeratorFixture::default()
            .with_num_objects_to_delete(0)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_moderation_action_channel_with_assets_deletion_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        DeleteChannelAsModeratorFixture::default().call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_moderation_action_channel_visibility_change_by_actors_with_auth_failure() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let curator_group_id = curators::create_curator_group(BTreeMap::new());

        // Member - invalid sender
        SetChannelVisibilityAsModeratorFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()));

        // Curator - invalid sender
        SetChannelVisibilityAsModeratorFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::CuratorAuthFailed.into()));

        // Curator - not in group
        SetChannelVisibilityAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(
                Error::<Test>::CuratorIsNotAMemberOfGivenCuratorGroup.into()
            ));

        // Lead - invalid sender
        SetChannelVisibilityAsModeratorFixture::default()
            .with_sender(UNAUTHORIZED_LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_channel_visibility_change_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        SetChannelVisibilityAsModeratorFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_non_existing_channel_visibility_change() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let curator_group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::HideChannel]),
            )]),
        );
        // As curator
        SetChannelVisibilityAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));
        // As lead
        SetChannelVisibilityAsModeratorFixture::default()
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_channel_visibility_change_by_curator_without_permissions() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let curator_group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        // As curator
        SetChannelVisibilityAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::CuratorModerationActionNotAllowed.into()));
    })
}

#[test]
fn successful_moderation_action_channel_visibility_change_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let curator_group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::HideChannel]),
            )]),
        );
        // Set to hidden
        SetChannelVisibilityAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Ok(()));
        // Set to visible
        SetChannelVisibilityAsModeratorFixture::default()
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
        create_default_member_owned_channel();

        // Set to hidden
        SetChannelVisibilityAsModeratorFixture::default().call_and_assert(Ok(()));
        // Set to visible
        SetChannelVisibilityAsModeratorFixture::default()
            .with_is_hidden(false)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_moderation_action_channel_features_status_change_by_actors_with_auth_failure() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let curator_group_id = curators::create_curator_group(BTreeMap::new());

        // Member - invalid sender
        ChangeChannelFeaturesStatusAsModeratorFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()));

        // Curator - invalid sender
        ChangeChannelFeaturesStatusAsModeratorFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::CuratorAuthFailed.into()));

        // Curator - not in group
        ChangeChannelFeaturesStatusAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(
                Error::<Test>::CuratorIsNotAMemberOfGivenCuratorGroup.into()
            ));

        // Lead - invalid sender
        ChangeChannelFeaturesStatusAsModeratorFixture::default()
            .with_sender(UNAUTHORIZED_LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_channel_features_status_change_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        ChangeChannelFeaturesStatusAsModeratorFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_non_existing_channel_features_status_change() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let curator_group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::ChangeChannelFeatureStatus(
                    ChannelFeature::default(),
                )]),
            )]),
        );
        // As curator
        ChangeChannelFeaturesStatusAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));
        // As lead
        ChangeChannelFeaturesStatusAsModeratorFixture::default()
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_channel_features_status_change_by_curator_without_permissions() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        // Give curator the access to change all channel features EXCEPT ChannelFeature::default()
        let mut allowed_actions = BTreeSet::<ContentModerationAction>::new();
        for f in ChannelFeature::iter() {
            if f != ChannelFeature::default() {
                allowed_actions.insert(ContentModerationAction::ChangeChannelFeatureStatus(f));
            }
        }

        let curator_group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(0, allowed_actions)]),
        );
        // As curator
        ChangeChannelFeaturesStatusAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::CuratorModerationActionNotAllowed.into()));
    })
}

#[test]
fn successful_moderation_action_channel_features_status_change_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let channel_features_to_manage = BTreeSet::from_iter(vec![
            ChannelFeature::VideoCreation,
            ChannelFeature::VideoUpdate,
            ChannelFeature::ChannelUpdate,
        ]);
        let allowed_actions = BTreeSet::from_iter(
            channel_features_to_manage
                .iter()
                .map(|feature| ContentModerationAction::ChangeChannelFeatureStatus(*feature)),
        );
        let curator_group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(0, allowed_actions)]),
        );
        // Set features to Paused
        ChangeChannelFeaturesStatusAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .with_changes(ChannelFeatureStatusChanges::from_iter(
                channel_features_to_manage
                    .iter()
                    .map(|feature| (*feature, ChannelFeatureStatus::Paused)),
            ))
            .call_and_assert(Ok(()));
        // Set features to Active
        ChangeChannelFeaturesStatusAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .with_changes(ChannelFeatureStatusChanges::from_iter(
                channel_features_to_manage
                    .iter()
                    .map(|feature| (*feature, ChannelFeatureStatus::Active)),
            ))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_moderation_action_channel_features_status_change_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        // Set all features to Paused
        ChangeChannelFeaturesStatusAsModeratorFixture::default()
            .with_changes(ChannelFeatureStatusChanges::from_iter(
                ChannelFeature::iter().map(|feature| (feature, ChannelFeatureStatus::Paused)),
            ))
            .call_and_assert(Ok(()));
        // Set all features to Active
        ChangeChannelFeaturesStatusAsModeratorFixture::default()
            .with_changes(ChannelFeatureStatusChanges::from_iter(
                ChannelFeature::iter().map(|feature| (feature, ChannelFeatureStatus::Active)),
            ))
            .call_and_assert(Ok(()));
    })
}

/// Paused features

#[test]
fn channel_cannot_be_updated_when_channel_update_paused() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();
        pause_channel_feature(ChannelId::one(), ChannelFeature::ChannelUpdate);

        // Try to update as owner
        UpdateChannelFixture::default()
            .call_and_assert(Err(Error::<Test>::ChannelFeaturePaused.into()));
        // Try to update as collaborator
        UpdateChannelFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ChannelFeaturePaused.into()));
    })
}

#[test]
fn video_cannot_created_when_channel_video_creation_paused() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(COLLABORATOR_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();
        pause_channel_feature(ChannelId::one(), ChannelFeature::VideoCreation);

        // Try to add video as owner
        CreateVideoFixture::default()
            .call_and_assert(Err(Error::<Test>::ChannelFeaturePaused.into()));
        // Try to add video as collaborator
        CreateVideoFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ChannelFeaturePaused.into()));
    })
}

#[test]
fn video_nft_cannot_be_issued_when_channel_video_nft_issuance_paused() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(COLLABORATOR_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();
        pause_channel_feature(ChannelId::one(), ChannelFeature::VideoNftIssuance);

        let nft_params = NftIssuanceParameters::<Test> {
            royalty: None,
            nft_metadata: b"metablob".to_vec(),
            non_channel_owner: None,
            init_transactional_status: InitTransactionalStatus::<Test>::Idle,
        };

        // Try to issue nft during new video creation as owner
        CreateVideoFixture::default()
            .with_nft_issuance(nft_params.clone())
            .call_and_assert(Err(Error::<Test>::ChannelFeaturePaused.into()));

        // Try to issue nft during new video creation as collaborator
        CreateVideoFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .with_nft_issuance(nft_params.clone())
            .call_and_assert(Err(Error::<Test>::ChannelFeaturePaused.into()));

        // Create default video
        CreateVideoFixture::default().call_and_assert(Ok(()));

        // Try to issue nft for existing video as owner
        assert_eq!(
            Content::issue_nft(
                Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
                ContentActor::Member(DEFAULT_MEMBER_ID),
                VideoId::one(),
                nft_params.clone()
            ),
            Err(Error::<Test>::ChannelFeaturePaused.into())
        );
        // Try to issue nft for existing video as collaborator
        assert_eq!(
            Content::issue_nft(
                Origin::signed(COLLABORATOR_MEMBER_ACCOUNT_ID),
                ContentActor::Member(COLLABORATOR_MEMBER_ID),
                VideoId::one(),
                nft_params.clone()
            ),
            Err(Error::<Test>::ChannelFeaturePaused.into())
        );

        // Try to issue video nft through an update as owner
        UpdateVideoFixture::default()
            .with_nft_issuance(nft_params.clone())
            .call_and_assert(Err(Error::<Test>::ChannelFeaturePaused.into()));

        // Try to issue video nft through an update as collaborator
        UpdateVideoFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .with_nft_issuance(nft_params.clone())
            .call_and_assert(Err(Error::<Test>::ChannelFeaturePaused.into()));
    })
}

// Channel assets removal

#[test]
fn unsuccessful_moderation_action_channel_assets_deletion_by_actors_with_auth_failure() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let curator_group_id = curators::create_curator_group(BTreeMap::new());

        // Member - invalid sender
        DeleteChannelAssetsAsModeratorFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()));

        // Curator - invalid sender
        DeleteChannelAssetsAsModeratorFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::CuratorAuthFailed.into()));

        // Curator - invalid group
        DeleteChannelAssetsAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(
                Error::<Test>::CuratorIsNotAMemberOfGivenCuratorGroup.into()
            ));

        // Lead - invalid sender
        DeleteChannelAssetsAsModeratorFixture::default()
            .with_sender(UNAUTHORIZED_LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_channel_assets_deletion_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        DeleteChannelAssetsAsModeratorFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_channel_assets_deletion_by_curator_with_no_permissions() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let curator_group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);

        DeleteChannelAssetsAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::CuratorModerationActionNotAllowed.into()));
    })
}

#[test]
fn unsuccessful_moderation_action_invalid_channel_assets_deletion() {
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
                BTreeSet::from_iter(vec![ContentModerationAction::DeleteChannelAssets]),
            )]),
        );

        let assets_to_remove = BTreeSet::from_iter(DATA_OBJECTS_NUMBER..(2 * DATA_OBJECTS_NUMBER));

        DeleteChannelAssetsAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .with_assets_to_remove(assets_to_remove)
            .call_and_assert(Err(
                Error::<Test>::AssetsToRemoveBeyondEntityAssetsSet.into()
            ));
    })
}

#[test]
fn unsuccessful_moderation_action_non_existing_channel_assets_deletion() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let curator_group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::DeleteChannelAssets]),
            )]),
        );

        DeleteChannelAssetsAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .with_channel_id(2)
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));
    })
}

#[test]
fn successful_moderation_action_channel_assets_deletion_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let curator_group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::DeleteChannelAssets]),
            )]),
        );

        DeleteChannelAssetsAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_moderation_action_channel_assets_deletion_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        DeleteChannelAssetsAsModeratorFixture::default().call_and_assert(Ok(()));
    })
}
