#![cfg(test)]

use std::collections::BTreeMap;
use std::iter::FromIterator;
use strum::IntoEnumIterator;

use super::curators;
use super::fixtures::*;
use super::mock::*;
use crate::*;
use storage::ModuleAccount as StorageModuleAccount;

///////////////////////////////////////////////////////////////////
////////////////////// Channel creation tests /////////////////////
///////////////////////////////////////////////////////////////////

#[test]
fn successful_channel_creation_with_member_context() {
    with_default_mock_builder(|| {
        run_to_block(1);
        set_dynamic_bag_creation_policy_for_storage_numbers(1);
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);

        let channel_state_bloat_bond = ed();
        UpdateChannelStateBloatBondFixture::default()
            .with_channel_state_bloat_bond(channel_state_bloat_bond)
            .call_and_assert(Ok(()));

        CreateChannelFixture::default()
            .with_default_storage_buckets()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_channel_owner(ChannelOwner::Member(DEFAULT_MEMBER_ID))
            .with_expected_channel_state_bloat_bond(channel_state_bloat_bond)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_curator_group_channel_creation_with_lead_context() {
    with_default_mock_builder(|| {
        run_to_block(1);

        set_dynamic_bag_creation_policy_for_storage_numbers(1);
        increase_account_balance_helper(LEAD_ACCOUNT_ID, ed() + DEFAULT_CHANNEL_STATE_BLOAT_BOND);

        create_initial_storage_buckets_helper();
        let default_curator_group_id = curators::create_curator_group(BTreeMap::new());
        CreateChannelFixture::default()
            .with_default_storage_buckets()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_channel_owner(ChannelOwner::CuratorGroup(default_curator_group_id))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_channel_creation_with_uncorresponding_member_id_and_origin() {
    with_default_mock_builder(|| {
        run_to_block(1);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID + 100)
            .with_channel_owner(ChannelOwner::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_curator_group_channel_creation_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);
        let default_curator_group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID, &[]);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_channel_owner(ChannelOwner::CuratorGroup(default_curator_group_id))
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()));
    })
}

#[test]
fn successful_channel_creation_with_storage_upload_and_member_context() {
    with_default_mock_builder(|| {
        run_to_block(1);
        create_initial_storage_buckets_helper();

        let channel_state_bloat_bond = ed() + 1;
        let data_state_bloat_bond = 1;
        increase_account_balance_helper(
            DEFAULT_MEMBER_ACCOUNT_ID,
            ed() + channel_state_bloat_bond + data_state_bloat_bond * 10,
        );

        UpdateChannelStateBloatBondFixture::default()
            .with_channel_state_bloat_bond(channel_state_bloat_bond)
            .call_and_assert(Ok(()));

        set_data_object_state_bloat_bond(data_state_bloat_bond);

        CreateChannelFixture::default()
            .with_default_storage_buckets()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_channel_owner(ChannelOwner::Member(DEFAULT_MEMBER_ID))
            .with_expected_channel_state_bloat_bond(channel_state_bloat_bond)
            .with_data_object_state_bloat_bond(data_state_bloat_bond)
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_curator_group_channel_creation_with_storage_upload_and_lead_context() {
    with_default_mock_builder(|| {
        run_to_block(1);
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        let default_curator_group_id = curators::create_curator_group(BTreeMap::new());

        let channel_state_bloat_bond = ed();
        UpdateChannelStateBloatBondFixture::default()
            .with_channel_state_bloat_bond(channel_state_bloat_bond)
            .call_and_assert(Ok(()));

        CreateChannelFixture::default()
            .with_default_storage_buckets()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_channel_owner(ChannelOwner::CuratorGroup(default_curator_group_id))
            .with_expected_channel_state_bloat_bond(channel_state_bloat_bond)
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_channel_creation_with_invalid_expected_channel_state_bloat_bond() {
    with_default_mock_builder(|| {
        run_to_block(1);
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        let default_curator_group_id = curators::create_curator_group(BTreeMap::new());

        let channel_state_bloat_bond = DEFAULT_CHANNEL_STATE_BLOAT_BOND + 1;
        UpdateChannelStateBloatBondFixture::default()
            .with_channel_state_bloat_bond(channel_state_bloat_bond)
            .call_and_assert(Ok(()));

        CreateChannelFixture::default()
            .with_default_storage_buckets()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_channel_owner(ChannelOwner::CuratorGroup(default_curator_group_id))
            .with_expected_channel_state_bloat_bond(DEFAULT_CHANNEL_STATE_BLOAT_BOND)
            .call_and_assert(Err(Error::<Test>::ChannelStateBloatBondChanged.into()));
    })
}

#[test]
fn unsuccessful_channel_creation_with_invalid_expected_data_size_fee() {
    with_default_mock_builder(|| {
        run_to_block(1);
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        let default_curator_group_id = curators::create_curator_group(BTreeMap::new());
        CreateChannelFixture::default()
            .with_default_storage_buckets()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_channel_owner(ChannelOwner::CuratorGroup(default_curator_group_id))
            .with_assets(StorageAssets::<Test> {
                // setting a purposely high fee to trigger error
                expected_data_size_fee: 1_000_000u64,
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

        let data_object_state_bloat_bond = 10;
        set_data_object_state_bloat_bond(data_object_state_bloat_bond);

        CreateChannelFixture::default()
            .with_default_storage_buckets()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_data_object_state_bloat_bond(data_object_state_bloat_bond)
            .with_channel_owner(ChannelOwner::Member(DEFAULT_MEMBER_ID))
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Err(
                Error::<Test>::InsufficientBalanceForChannelCreation.into()
            ));
    })
}

#[test]
fn unsuccessful_channel_creation_with_bucket_objects_size_limit_reached() {
    with_default_mock_builder(|| {
        run_to_block(1);
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        set_dynamic_bag_creation_policy_for_storage_numbers(1);

        CreateChannelFixture::default()
            .with_default_storage_buckets()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_channel_owner(ChannelOwner::Member(DEFAULT_MEMBER_ID))
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: vec![DataObjectCreationParameters {
                    size: STORAGE_BUCKET_OBJECTS_SIZE_LIMIT + 1,
                    ipfs_content_id: create_cid(1),
                }],
            })
            .with_default_storage_buckets()
            .call_and_assert(Err(
                storage::Error::<Test>::StorageBucketObjectSizeLimitReached.into(),
            ));
    })
}

#[test]
fn unsuccessful_channel_creation_with_bucket_objects_number_limit_reached() {
    with_default_mock_builder(|| {
        run_to_block(1);
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(
            DEFAULT_MEMBER_ACCOUNT_ID,
            DEFAULT_CHANNEL_STATE_BLOAT_BOND
                + DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND * (STORAGE_BUCKET_OBJECTS_NUMBER_LIMIT + 1)
                + ed(),
        );

        set_dynamic_bag_creation_policy_for_storage_numbers(1);
        CreateChannelFixture::default()
            .with_default_storage_buckets()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_channel_owner(ChannelOwner::Member(DEFAULT_MEMBER_ID))
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: (0..(STORAGE_BUCKET_OBJECTS_NUMBER_LIMIT + 1))
                    .map(|_| DataObjectCreationParameters {
                        size: 1,
                        ipfs_content_id: create_cid(1),
                    })
                    .collect(),
            })
            .with_default_storage_buckets()
            .call_and_assert(Err(
                storage::Error::<Test>::StorageBucketObjectNumberLimitReached.into(),
            ));
    })
}

#[test]
fn unsuccessful_channel_creation_with_data_limits_exceeded() {
    with_default_mock_builder(|| {
        run_to_block(1);
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        set_dynamic_bag_creation_policy_for_storage_numbers(1);
        CreateChannelFixture::default()
            .with_default_storage_buckets()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_channel_owner(ChannelOwner::Member(DEFAULT_MEMBER_ID))
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: vec![DataObjectCreationParameters {
                    size: VOUCHER_OBJECTS_SIZE_LIMIT + 1,
                    ipfs_content_id: create_cid(1),
                }],
            })
            .with_default_storage_buckets()
            .call_and_assert(Err(storage::Error::<Test>::MaxDataObjectSizeExceeded.into()));
    })
}

#[test]
fn successful_channel_creation_with_collaborators_set() {
    with_default_mock_builder(|| {
        run_to_block(1);

        set_dynamic_bag_creation_policy_for_storage_numbers(1);
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(
            DEFAULT_MEMBER_ACCOUNT_ID,
            ed() + DEFAULT_CHANNEL_STATE_BLOAT_BOND,
        );
        increase_account_balance_helper(LEAD_ACCOUNT_ID, ed() + DEFAULT_CHANNEL_STATE_BLOAT_BOND);

        CreateChannelFixture::default()
            .with_default_storage_buckets()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_channel_owner(ChannelOwner::Member(DEFAULT_MEMBER_ID))
            .with_collaborators(
                vec![(COLLABORATOR_MEMBER_ID, BTreeSet::new())]
                    .into_iter()
                    .collect(),
            )
            .call_and_assert(Ok(()));

        let default_curator_group_id = curators::create_curator_group(BTreeMap::new());
        CreateChannelFixture::default()
            .with_default_storage_buckets()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_channel_owner(ChannelOwner::CuratorGroup(default_curator_group_id))
            .with_default_storage_buckets()
            .with_collaborators(
                vec![(COLLABORATOR_MEMBER_ID, BTreeSet::new())]
                    .into_iter()
                    .collect(),
            )
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_channel_creation_with_invalid_collaborators_set() {
    with_default_mock_builder(|| {
        run_to_block(1);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_channel_owner(ChannelOwner::Member(DEFAULT_MEMBER_ID))
            .with_collaborators(
                vec![(COLLABORATOR_MEMBER_ID + 100, BTreeSet::new())]
                    .into_iter()
                    .collect(),
            )
            .call_and_assert(Err(Error::<Test>::InvalidMemberProvided.into()));
    })
}

#[test]
fn unsuccessful_channel_creation_with_number_of_assets_exceeded() {
    with_default_mock_builder(|| {
        run_to_block(1);
        increase_account_balance_helper(
            DEFAULT_MEMBER_ACCOUNT_ID,
            ed() + DEFAULT_CHANNEL_STATE_BLOAT_BOND,
        );
        CreateChannelFixture::default()
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_object_candidates_helper(
                    1,
                    <Test as Config>::MaxNumberOfAssetsPerChannel::get() as u64 + 1,
                ),
            })
            .call_and_assert(Err(Error::<Test>::MaxNumberOfChannelAssetsExceeded.into()));
    })
}

#[test]
fn unsuccessful_channel_creation_with_invalid_owner() {
    with_default_mock_builder(|| {
        let invalid_curator_group_id = 111;
        CreateChannelFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_channel_owner(ChannelOwner::CuratorGroup(invalid_curator_group_id))
            .call_and_assert(Err(
                Error::<Test>::ChannelOwnerCuratorGroupDoesNotExist.into()
            ));
    })
}

#[test]
fn successful_channel_creation_with_invitation_lock() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let (data_size_fee, data_obj_bloat_bond, channel_state_bloat_bond) = (10u64, 20u64, ed());
        set_fees(
            data_size_fee,
            data_obj_bloat_bond,
            channel_state_bloat_bond,
            0,
        );
        let to_be_paid =
            data_size_fee + data_obj_bloat_bond * DATA_OBJECTS_NUMBER + channel_state_bloat_bond;

        let member_balance = ed() + to_be_paid;

        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, member_balance);
        set_invitation_lock(&DEFAULT_MEMBER_ACCOUNT_ID, member_balance);

        set_dynamic_bag_creation_policy_for_storage_numbers(1);
        create_initial_storage_buckets_helper();

        CreateChannelFixture::default()
            .with_default_storage_buckets()
            .with_assets(create_default_assets_helper())
            .call_and_assert(Ok(()));

        let storage_module_acc = storage::StorageTreasury::<Test>::module_account_id();
        let channel_acc = ContentTreasury::<Test>::account_for_channel(ChannelId::one());

        assert_eq!(
            Balances::<Test>::usable_balance(channel_acc),
            channel_state_bloat_bond
        );
        assert_eq!(
            Balances::<Test>::usable_balance(storage_module_acc),
            ed() + data_obj_bloat_bond * DATA_OBJECTS_NUMBER
        );
        assert_eq!(
            System::account(DEFAULT_MEMBER_ACCOUNT_ID).data,
            balances::AccountData {
                free: ed(),
                reserved: 0,
                misc_frozen: ed() + to_be_paid,
                fee_frozen: 0
            }
        )
    })
}

#[test]
fn unsuccessful_channel_creation_with_number_of_collaborators_exceeded() {
    with_default_mock_builder(|| {
        run_to_block(1);
        increase_account_balance_helper(
            DEFAULT_MEMBER_ACCOUNT_ID,
            ed() + DEFAULT_CHANNEL_STATE_BLOAT_BOND,
        );
        CreateChannelFixture::default()
            .with_collaborators(
                (0..(<Test as Config>::MaxNumberOfCollaboratorsPerChannel::get() + 1) as usize)
                    .map(|i| (MEMBER_IDS[i], ChannelAgentPermissions::new()))
                    .collect(),
            )
            .call_and_assert(Err(
                Error::<Test>::MaxNumberOfChannelCollaboratorsExceeded.into()
            ))
    })
}

#[test]
fn unsuccessful_channel_creation_with_locks_and_insufficient_balance() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let (data_size_fee, data_obj_bloat_bond, channel_state_bloat_bond) = (10u64, 20u64, ed());
        set_fees(
            data_size_fee,
            data_obj_bloat_bond,
            channel_state_bloat_bond,
            0,
        );
        let to_be_paid =
            data_size_fee + data_obj_bloat_bond * DATA_OBJECTS_NUMBER + channel_state_bloat_bond;

        let member_balance = ed() + to_be_paid - 1;

        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, member_balance);
        set_invitation_lock(&DEFAULT_MEMBER_ACCOUNT_ID, member_balance);

        set_dynamic_bag_creation_policy_for_storage_numbers(1);
        create_initial_storage_buckets_helper();

        CreateChannelFixture::default()
            .with_default_storage_buckets()
            .with_assets(create_default_assets_helper())
            .call_and_assert(Err(
                Error::<Test>::InsufficientBalanceForChannelCreation.into()
            ));

        // Increase balance by 1, but lock ED and those funds with another, not-allowed lock
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, 1);
        set_staking_candidate_lock(&DEFAULT_MEMBER_ACCOUNT_ID, ed() + 1);

        CreateChannelFixture::default()
            .with_default_storage_buckets()
            .with_assets(create_default_assets_helper())
            .call_and_assert(Err(
                Error::<Test>::InsufficientBalanceForChannelCreation.into()
            ));
    })
}

#[test]
fn unsuccessful_channel_creation_with_not_allowed_lock() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let (data_size_fee, data_obj_bloat_bond, channel_state_bloat_bond) = (10u64, 20u64, ed());
        set_fees(
            data_size_fee,
            data_obj_bloat_bond,
            channel_state_bloat_bond,
            0,
        );

        let to_be_paid =
            data_size_fee + data_obj_bloat_bond * DATA_OBJECTS_NUMBER + channel_state_bloat_bond;
        let member_balance = ed() + to_be_paid;

        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, member_balance);
        set_staking_candidate_lock(&DEFAULT_MEMBER_ACCOUNT_ID, member_balance);

        set_dynamic_bag_creation_policy_for_storage_numbers(1);
        create_initial_storage_buckets_helper();

        CreateChannelFixture::default()
            .with_default_storage_buckets()
            .with_assets(create_default_assets_helper())
            .call_and_assert(Err(
                Error::<Test>::InsufficientBalanceForChannelCreation.into()
            ));
    })
}

/////////////////////////////////////////////////////////////////////
// Channel update failures (excluding invalid context/permissions) //
/////////////////////////////////////////////////////////////////////

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
fn unsuccessful_channel_update_with_pending_status_transfer() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(DEFAULT_MEMBER_ID)
            .call_and_assert(Ok(()));

        UpdateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets_to_upload(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Err(Error::<Test>::InvalidChannelTransferStatus.into()));
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
                    ipfs_content_id: create_cid(1),
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
            .with_assets_to_remove((DATA_OBJECTS_NUMBER..(2 * DATA_OBJECTS_NUMBER)).collect())
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
            .with_collaborators(
                vec![(COLLABORATOR_MEMBER_ID + 100, BTreeSet::new())]
                    .into_iter()
                    .collect(),
            )
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
                expected_data_size_fee: 1_000_000u64,
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

        let data_object_state_bloat_bond = 10;
        set_data_object_state_bloat_bond(data_object_state_bloat_bond);

        UpdateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_data_object_state_bloat_bond(data_object_state_bloat_bond)
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
                    ipfs_content_id: create_cid(1),
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
            DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND * (STORAGE_BUCKET_OBJECTS_NUMBER_LIMIT + 1)
                + DEFAULT_CHANNEL_STATE_BLOAT_BOND
                + DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND * DATA_OBJECTS_NUMBER
                + ed(),
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
                        ipfs_content_id: create_cid(1),
                    })
                    .collect(),
            })
            .call_and_assert(Err(
                storage::Error::<Test>::StorageBucketObjectNumberLimitReached.into(),
            ));
    })
}

#[test]
fn unsuccessful_channel_update_with_number_of_assets_exceeded() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();

        UpdateChannelFixture::default()
            .with_assets_to_upload(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_object_candidates_helper(
                    1,
                    <Test as Config>::MaxNumberOfAssetsPerChannel::get() as u64 + 1,
                ),
            })
            .call_and_assert(Err(Error::<Test>::MaxNumberOfChannelAssetsExceeded.into()));
    })
}

#[test]
fn unsuccessful_channel_update_with_number_of_collaborators_exceeded() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();

        UpdateChannelFixture::default()
            .with_collaborators(
                (0..(<Test as Config>::MaxNumberOfCollaboratorsPerChannel::get() + 1) as usize)
                    .map(|i| (MEMBER_IDS[i], ChannelAgentPermissions::new()))
                    .collect(),
            )
            .call_and_assert(Err(
                Error::<Test>::MaxNumberOfChannelCollaboratorsExceeded.into()
            ));
    })
}

#[test]
fn successful_channel_update_with_invitation_lock() {
    with_default_mock_builder(|| {
        let (data_size_fee, data_obj_bloat_bond, channel_state_bloat_bond) = (10u64, 20u64, ed());
        set_fees(
            data_size_fee,
            data_obj_bloat_bond,
            channel_state_bloat_bond,
            0,
        );

        ContentTest::with_member_channel().setup();

        let update_fees = data_size_fee + data_obj_bloat_bond * DATA_OBJECTS_NUMBER;
        let member_balance = ed() + update_fees;

        Balances::<Test>::make_free_balance_be(&DEFAULT_MEMBER_ACCOUNT_ID, member_balance);
        set_invitation_lock(&DEFAULT_MEMBER_ACCOUNT_ID, member_balance);

        UpdateChannelFixture::default()
            .with_assets_to_upload(create_default_assets_helper())
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
                misc_frozen: ed() + update_fees,
                fee_frozen: 0
            }
        )
    })
}

#[test]
fn unsuccessful_channel_update_with_assets_to_upload_and_invalid_storage_buckets_num_witness() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();

        UpdateChannelFixture::default()
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
fn unsuccessful_channels_update_with_assets_to_upload_and_missing_storage_buckets_num_witness() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().with_video().setup();

        UpdateChannelFixture::default()
            .with_assets_to_upload(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .with_storage_buckets_num_witness(None)
            .call_and_assert(Err(Error::<Test>::MissingStorageBucketsNumWitness.into()));
    })
}

#[test]
fn unsuccessful_channel_update_with_locks_and_insufficient_balance() {
    with_default_mock_builder(|| {
        let (data_size_fee, data_obj_bloat_bond, channel_state_bloat_bond) = (10u64, 20u64, ed());
        set_fees(
            data_size_fee,
            data_obj_bloat_bond,
            channel_state_bloat_bond,
            0,
        );

        ContentTest::with_member_channel().setup();

        let update_fees = data_size_fee + data_obj_bloat_bond * DATA_OBJECTS_NUMBER;
        let member_balance = ed() + update_fees - 1;

        Balances::<Test>::make_free_balance_be(&DEFAULT_MEMBER_ACCOUNT_ID, member_balance);
        set_invitation_lock(&DEFAULT_MEMBER_ACCOUNT_ID, member_balance);

        UpdateChannelFixture::default()
            .with_assets_to_upload(create_default_assets_helper())
            .call_and_assert(Err(storage::Error::<Test>::InsufficientBalance.into()));

        // Increase balance by 1, but lock ED and those funds with another, not-allowed lock
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, 1);
        set_staking_candidate_lock(&DEFAULT_MEMBER_ACCOUNT_ID, ed() + 1);

        UpdateChannelFixture::default()
            .with_assets_to_upload(create_default_assets_helper())
            .call_and_assert(Err(storage::Error::<Test>::InsufficientBalance.into()));
    })
}

#[test]
fn unsuccessful_channels_update_with_assets_to_remove_and_missing_storage_buckets_num_witness() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().with_video().setup();

        UpdateChannelFixture::default()
            .with_assets_to_remove(BTreeSet::from_iter(0..DATA_OBJECTS_NUMBER))
            .with_storage_buckets_num_witness(None)
            .call_and_assert(Err(Error::<Test>::MissingStorageBucketsNumWitness.into()));
    })
}

#[test]
fn unsuccessful_channel_update_with_not_allowed_lock() {
    with_default_mock_builder(|| {
        let (data_size_fee, data_obj_bloat_bond, channel_state_bloat_bond) = (10u64, 20u64, ed());
        set_fees(
            data_size_fee,
            data_obj_bloat_bond,
            channel_state_bloat_bond,
            0,
        );

        ContentTest::with_member_channel().setup();

        let update_fees = data_size_fee + data_obj_bloat_bond * DATA_OBJECTS_NUMBER;
        let member_balance = ed() + update_fees;

        Balances::<Test>::make_free_balance_be(&DEFAULT_MEMBER_ACCOUNT_ID, member_balance);
        set_staking_candidate_lock(&DEFAULT_MEMBER_ACCOUNT_ID, member_balance);

        UpdateChannelFixture::default()
            .with_assets_to_upload(create_default_assets_helper())
            .call_and_assert(Err(storage::Error::<Test>::InsufficientBalance.into()));
    })
}

/////////////////////////////////////////////////////////////////////
/////////////////// Channel privilege level tests ///////////////////
/////////////////////////////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////////////
// Channel deletion failures (excluding invalid context/permissions) //
///////////////////////////////////////////////////////////////////////

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

        DeleteChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            // default member owned channel has DATA_OBJECTS_NUMBER > 0 assets
            .with_num_objects_to_delete(0u64)
            .call_and_assert(Err(Error::<Test>::InvalidBagSizeSpecified.into()));
    })
}

#[test]
fn unsuccessful_channel_deletion_with_creator_token_issued() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));

        DeleteChannelFixture::default()
            .call_and_assert(Err(Error::<Test>::CreatorTokenAlreadyIssued.into()));
    })
}

#[test]
fn unsuccessful_channel_deletion_with_invalid_channel_bag_witness() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        let invalid_witness = ChannelBagWitness {
            storage_buckets_num: 0,
            distribution_buckets_num: 0,
        };

        DeleteChannelFixture::default()
            .with_channel_bag_witness(invalid_witness)
            .call_and_assert(Err(Error::<Test>::InvalidChannelBagWitnessProvided.into()));
    })
}

#[test]
fn successful_channel_deletion_with_bloat_bonds_repaid_to_correct_accounts() {
    let (data_size_fee, data_obj_bloat_bond, channel_state_bloat_bond) = (10u64, 20u64, ed());

    let test_cases = [
        (
            ed(), // locked balance
            (
                ed(), // creator account post-removal balance
                ed() + data_obj_bloat_bond * 10 + channel_state_bloat_bond, // remover account post-removal balance
            ),
        ),
        (
            ed() + 1, // locked balance
            (
                ed() + channel_state_bloat_bond, // creator account post-removal balance
                ed() + data_obj_bloat_bond * 10, // remover account post-removal balance
            ),
        ),
        (
            ed() + channel_state_bloat_bond, // locked balance
            (
                ed() + channel_state_bloat_bond, // creator account post-removal balance
                ed() + data_obj_bloat_bond * 10, // remover account post-removal balance
            ),
        ),
        (
            ed() + channel_state_bloat_bond + data_size_fee, // locked balance
            (
                ed() + channel_state_bloat_bond, // creator account post-removal balance
                ed() + data_obj_bloat_bond * 10, // remover account post-removal balance
            ),
        ),
        (
            ed() + channel_state_bloat_bond + data_size_fee + 1, // locked balance
            (
                ed() + channel_state_bloat_bond + data_obj_bloat_bond, // creator account post-removal balance
                ed() + data_obj_bloat_bond * 9, // remover account post-removal balance
            ),
        ),
        (
            ed() + channel_state_bloat_bond + data_size_fee + data_obj_bloat_bond, // locked balance
            (
                ed() + channel_state_bloat_bond + data_obj_bloat_bond, // creator account post-removal balance
                ed() + data_obj_bloat_bond * 9, // remover account post-removal balance
            ),
        ),
        (
            ed() + channel_state_bloat_bond + data_size_fee + data_obj_bloat_bond + 1, // locked balance
            (
                ed() + channel_state_bloat_bond + data_obj_bloat_bond * 2, // creator account post-removal balance
                ed() + data_obj_bloat_bond * 8, // remover account post-removal balance
            ),
        ),
        (
            ed() + channel_state_bloat_bond + data_size_fee + data_obj_bloat_bond * 9 + 1, // locked balance
            (
                ed() + channel_state_bloat_bond + data_obj_bloat_bond * 10, // creator account post-removal balance
                ed(), // remover account post-removal balance
            ),
        ),
        (
            ed() + channel_state_bloat_bond + data_size_fee + data_obj_bloat_bond * 10, // locked balance
            (
                ed() + channel_state_bloat_bond + data_obj_bloat_bond * 10, // creator account post-removal balance
                ed(), // remover account post-removal balance
            ),
        ),
    ];

    for case in test_cases {
        let (locked_balance, (expected_creator_balance, expected_remover_balance)) = case;
        with_default_mock_builder(|| {
            run_to_block(1);
            set_fees(
                data_size_fee,
                data_obj_bloat_bond,
                channel_state_bloat_bond,
                0,
            );
            let to_be_paid = data_size_fee
                + data_obj_bloat_bond * DATA_OBJECTS_NUMBER
                + channel_state_bloat_bond;

            let member_balance = ed() + to_be_paid;

            increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, member_balance);
            increase_account_balance_helper(DEFAULT_MEMBER_ALT_ACCOUNT_ID, ed());
            set_invitation_lock(&DEFAULT_MEMBER_ACCOUNT_ID, locked_balance);

            set_dynamic_bag_creation_policy_for_storage_numbers(1);
            create_initial_storage_buckets_helper();

            CreateChannelFixture::default()
                .with_default_storage_buckets()
                .with_assets(create_default_assets_helper())
                .call_and_assert(Ok(()));

            // Delete channel using different (alternative) controller account
            DeleteChannelFixture::default()
                .with_sender(DEFAULT_MEMBER_ALT_ACCOUNT_ID)
                .call_and_assert(Ok(()));

            let storage_module_acc = storage::StorageTreasury::<Test>::module_account_id();
            let channel_acc = ContentTreasury::<Test>::account_for_channel(ChannelId::one());

            // Verify that all bloat bonds were returned to correct accounts
            assert_eq!(Balances::<Test>::total_balance(&channel_acc), 0);
            assert_eq!(Balances::<Test>::usable_balance(storage_module_acc), ed());
            println!(
                "Creator: {:?}\nRemover: {:?}\nExpected creator free: {:?}\nExpected remover free: {:?}",
                System::account(DEFAULT_MEMBER_ACCOUNT_ID).data,
                System::account(DEFAULT_MEMBER_ALT_ACCOUNT_ID).data,
                expected_creator_balance,
                expected_remover_balance
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

///////////////////////////////////////////////////////////////////////
////////////////////// Channel moderation actions /////////////////////
///////////////////////////////////////////////////////////////////////

// Channel visibility status

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

        let curator_group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID, &[]);
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

// Channel features status (pausing/unpausing)

#[test]
fn unsuccessful_moderation_action_channel_features_status_change_by_actors_with_auth_failure() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let curator_group_id = curators::create_curator_group(BTreeMap::new());

        // Member - invalid sender
        SetChannelPausedFeaturesAsModeratorFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()));

        // Curator - invalid sender
        SetChannelPausedFeaturesAsModeratorFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::CuratorAuthFailed.into()));

        // Curator - not in group
        SetChannelPausedFeaturesAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(
                Error::<Test>::CuratorIsNotAMemberOfGivenCuratorGroup.into()
            ));

        // Lead - invalid sender
        SetChannelPausedFeaturesAsModeratorFixture::default()
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

        SetChannelPausedFeaturesAsModeratorFixture::default()
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
                    PausableChannelFeature::default(),
                )]),
            )]),
        );
        // As curator
        SetChannelPausedFeaturesAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));
        // As lead
        SetChannelPausedFeaturesAsModeratorFixture::default()
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

        // Give curator the access to change all channel features EXCEPT PausableChannelFeature::default()
        let mut allowed_actions = BTreeSet::<ContentModerationAction>::new();
        for f in PausableChannelFeature::iter() {
            if f != PausableChannelFeature::default() {
                allowed_actions.insert(ContentModerationAction::ChangeChannelFeatureStatus(f));
            }
        }

        let curator_group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(0, allowed_actions)]),
        );
        // As curator
        SetChannelPausedFeaturesAsModeratorFixture::default()
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
            PausableChannelFeature::VideoCreation,
            PausableChannelFeature::VideoUpdate,
            PausableChannelFeature::ChannelUpdate,
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
        SetChannelPausedFeaturesAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .with_new_paused_features(channel_features_to_manage)
            .call_and_assert(Ok(()));
        // Set features to Active
        SetChannelPausedFeaturesAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .with_new_paused_features(BTreeSet::new())
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
        SetChannelPausedFeaturesAsModeratorFixture::default()
            .with_new_paused_features(BTreeSet::from_iter(PausableChannelFeature::iter()))
            .call_and_assert(Ok(()));
        // Set all features to Active
        SetChannelPausedFeaturesAsModeratorFixture::default()
            .with_new_paused_features(BTreeSet::new())
            .call_and_assert(Ok(()));
    })
}

// Channel assets deletion

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

        let curator_group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID, &[]);

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
                BTreeSet::from_iter(vec![ContentModerationAction::DeleteNonVideoChannelAssets]),
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
                BTreeSet::from_iter(vec![ContentModerationAction::DeleteNonVideoChannelAssets]),
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
fn unsuccessful_moderation_action_channel_assets_deletion_and_invalid_storage_buckets_num_witness()
{
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();

        let curator_group_id = curators::add_curator_to_new_group_with_permissions(
            DEFAULT_CURATOR_ID,
            BTreeMap::from_iter(vec![(
                0,
                BTreeSet::from_iter(vec![ContentModerationAction::DeleteNonVideoChannelAssets]),
            )]),
        );

        DeleteChannelAssetsAsModeratorFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .with_storage_buckets_num_witness(0)
            .call_and_assert(Err(
                Error::<Test>::InvalidStorageBucketsNumWitnessProvided.into()
            ));
    })
}

#[test]
fn unsuccessful_moderation_action_channel_assets_deletion_with_zero_number_of_assets_to_delete() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();

        DeleteChannelAssetsAsModeratorFixture::default()
            .with_assets_to_remove(BTreeSet::new())
            .call_and_assert(Err(Error::<Test>::NumberOfAssetsToRemoveIsZero.into()));
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
                BTreeSet::from_iter(vec![ContentModerationAction::DeleteNonVideoChannelAssets]),
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

///////////////////////////////////////////////////////////////////////
//////////////////////////// Paused features //////////////////////////
///////////////////////////////////////////////////////////////////////

#[test]
fn channel_cannot_be_updated_when_channel_update_paused() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();
        pause_channel_feature(ChannelId::one(), PausableChannelFeature::ChannelUpdate);

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
        create_default_member_owned_channel_with_collaborator_permissions(&[
            ChannelActionPermission::AddVideo,
        ]);
        pause_channel_feature(ChannelId::one(), PausableChannelFeature::VideoCreation);

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
        create_default_member_owned_channel_with_collaborator_permissions(&[
            ChannelActionPermission::AddVideo,
            ChannelActionPermission::ManageVideoNfts,
        ]);
        pause_channel_feature(ChannelId::one(), PausableChannelFeature::VideoNftIssuance);

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
                RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
                ContentActor::Member(DEFAULT_MEMBER_ID),
                VideoId::one(),
                nft_params.clone()
            ),
            Err(Error::<Test>::ChannelFeaturePaused.into())
        );
        // Try to issue nft for existing video as collaborator
        assert_eq!(
            Content::issue_nft(
                RuntimeOrigin::signed(COLLABORATOR_MEMBER_ACCOUNT_ID),
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
            .with_nft_issuance(nft_params)
            .call_and_assert(Err(Error::<Test>::ChannelFeaturePaused.into()));
    })
}

/////////////////////////////////////////////////////////////
////////////// Invalid contexts (actor/origin) //////////////
/////////////////////////////////////////////////////////////

// Curator channels

#[test]
fn unsuccessful_curator_channel_actions_with_invalid_context() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_video()
            .with_video_nft()
            .with_agent_permissions(&Vec::from_iter(ChannelActionPermission::iter()))
            .setup();

        curators::add_curator_to_new_group(
            UNAUTHORIZED_CURATOR_ID,
            &Vec::from_iter(ChannelActionPermission::iter()),
        );

        run_all_fixtures_with_contexts(get_default_curator_channel_invalid_contexts());
    })
}

// Member channels

#[test]
fn unsuccessful_member_channel_actions_with_invalid_context() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_video()
            .with_video_nft()
            .with_agent_permissions(&Vec::from_iter(ChannelActionPermission::iter()))
            .setup();

        curators::add_curator_to_new_group(
            DEFAULT_CURATOR_ID,
            &Vec::from_iter(ChannelActionPermission::iter()),
        );

        run_all_fixtures_with_contexts(get_default_member_channel_invalid_contexts());
    })
}

///////////////////////////////////////////////////////////////
// Channel agent / owner permissions - UpdateChannelMetadata //
///////////////////////////////////////////////////////////////

// Curator channels

#[test]
fn unsuccessful_channel_metadata_update_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::UpdateChannelMetadata])
            .setup();
        UpdateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .with_new_meta(Some(b"new meta".to_vec()))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_channel_metadata_update_by_curator_agent() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_agent_permissions(&[ChannelActionPermission::UpdateChannelMetadata])
            .setup();
        UpdateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .with_new_meta(Some(b"new meta".to_vec()))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_channel_metadata_update_by_lead() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel().setup();
        UpdateChannelFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_new_meta(Some(b"new meta".to_vec()))
            .call_and_assert(Ok(()));
    })
}

// Member channels

#[test]
fn unsuccessful_channel_metadata_update_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::UpdateChannelMetadata])
            .setup();
        UpdateChannelFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .with_new_meta(Some(b"new meta".to_vec()))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_channel_metadata_update_by_collaborator() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_agent_permissions(&[ChannelActionPermission::UpdateChannelMetadata])
            .setup();
        UpdateChannelFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .with_new_meta(Some(b"new meta".to_vec()))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_channel_metadata_update_by_owner_member() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        UpdateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_new_meta(Some(b"new meta".to_vec()))
            .call_and_assert(Ok(()));
    })
}

/////////////////////////////////////////////////////////////////////
// Channel agent / owner permissions - ManageNonVideoChannelAssets //
/////////////////////////////////////////////////////////////////////

// Curator channels

#[test]
fn unsuccessful_channel_assets_update_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_all_agent_permissions_except(&[
                ChannelActionPermission::ManageNonVideoChannelAssets,
            ])
            .setup();
        UpdateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .with_assets_to_upload(create_default_assets_helper())
            .with_assets_to_remove(BTreeSet::from_iter(0..DATA_OBJECTS_NUMBER))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_channel_assets_update_by_curator_agent() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_agent_permissions(&[ChannelActionPermission::ManageNonVideoChannelAssets])
            .setup();
        UpdateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .with_assets_to_upload(create_default_assets_helper())
            .with_assets_to_remove(BTreeSet::from_iter(0..DATA_OBJECTS_NUMBER))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_channel_assets_update_by_lead() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel().setup();
        UpdateChannelFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_assets_to_upload(create_default_assets_helper())
            .with_assets_to_remove(BTreeSet::from_iter(0..DATA_OBJECTS_NUMBER))
            .call_and_assert(Ok(()));
    })
}

// Member channels

#[test]
fn unsuccessful_channel_assets_update_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_all_agent_permissions_except(&[
                ChannelActionPermission::ManageNonVideoChannelAssets,
            ])
            .setup();
        UpdateChannelFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .with_assets_to_upload(create_default_assets_helper())
            .with_assets_to_remove(BTreeSet::from_iter(0..DATA_OBJECTS_NUMBER))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_channel_assets_update_by_collaborator() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_agent_permissions(&[ChannelActionPermission::ManageNonVideoChannelAssets])
            .setup();
        UpdateChannelFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .with_assets_to_upload(create_default_assets_helper())
            .with_assets_to_remove(BTreeSet::from_iter(0..DATA_OBJECTS_NUMBER))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_channel_assets_update_by_owner_member() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        UpdateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets_to_upload(create_default_assets_helper())
            .with_assets_to_remove(BTreeSet::from_iter(0..DATA_OBJECTS_NUMBER))
            .call_and_assert(Ok(()));
    })
}

/////////////////////////////////////////////////////////////////////
// Channel agent / owner permissions - ManageChannelCollaborators //
/////////////////////////////////////////////////////////////////////

// Curator channels

#[test]
fn unsuccessful_channel_collaborators_update_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_all_agent_permissions_except(&[
                ChannelActionPermission::ManageChannelCollaborators,
            ])
            .setup();
        UpdateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .with_collaborators(BTreeMap::new())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_channel_collaborator_removal_by_curator_agent_with_insufficient_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::AgentRemark])
            .with_collaborators(&[(
                SECOND_MEMBER_ID,
                BTreeSet::from_iter(vec![ChannelActionPermission::AgentRemark]),
            )])
            .setup();
        UpdateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .with_collaborators(BTreeMap::new())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_channel_collaborator_update_by_curator_agent_with_insufficient_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::AgentRemark])
            .with_collaborators(&[(
                SECOND_MEMBER_ID,
                BTreeSet::from_iter(vec![ChannelActionPermission::AgentRemark]),
            )])
            .setup();
        UpdateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .with_collaborators(BTreeMap::from_iter(vec![(
                SECOND_MEMBER_ID,
                BTreeSet::new(),
            )]))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_channel_collaborator_insertion_by_curator_agent_with_insufficient_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::AgentRemark])
            .setup();
        UpdateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .with_collaborators(BTreeMap::from_iter(vec![(
                SECOND_MEMBER_ID,
                BTreeSet::from_iter(vec![ChannelActionPermission::AgentRemark]),
            )]))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_channel_collaborator_management_by_curator_agent() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::AgentRemark])
            .setup();
        SuccessfulChannelCollaboratorsManagementFlow::default()
            .with_owner_sender(LEAD_ACCOUNT_ID)
            .with_owner_actor(ContentActor::Lead)
            .with_agent_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_agent_actor(default_curator_actor())
            .run();
    })
}

// Member channels

#[test]
fn unsuccessful_channel_collaborators_update_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        UpdateChannelFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .with_collaborators(BTreeMap::new())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_channel_collaborator_removal_by_collaborator_with_insufficient_permissions() {
    with_default_mock_builder(|| {
        let default_collaborator = (
            COLLABORATOR_MEMBER_ID,
            all_permissions_except(&[ChannelActionPermission::AgentRemark]),
        );
        ContentTest::with_member_channel()
            .with_collaborators(&[
                default_collaborator.clone(),
                (
                    SECOND_MEMBER_ID,
                    agent_permissions(&[ChannelActionPermission::AgentRemark]),
                ),
            ])
            .setup();
        UpdateChannelFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .with_collaborators(BTreeMap::from_iter(vec![default_collaborator]))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_channel_collaborator_update_by_collaborator_with_insufficient_permissions() {
    with_default_mock_builder(|| {
        let default_collaborator = (
            COLLABORATOR_MEMBER_ID,
            all_permissions_except(&[ChannelActionPermission::AgentRemark]),
        );
        ContentTest::with_member_channel()
            .with_collaborators(&[
                default_collaborator.clone(),
                (
                    SECOND_MEMBER_ID,
                    agent_permissions(&[ChannelActionPermission::AgentRemark]),
                ),
            ])
            .setup();
        UpdateChannelFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .with_collaborators(BTreeMap::from_iter(vec![
                (SECOND_MEMBER_ID, BTreeSet::new()),
                default_collaborator,
            ]))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_channel_collaborator_insertion_by_collaborator_with_insufficient_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::AgentRemark])
            .setup();
        UpdateChannelFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .with_collaborators(BTreeMap::from_iter(vec![(
                SECOND_MEMBER_ID,
                BTreeSet::from_iter(vec![ChannelActionPermission::AgentRemark]),
            )]))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_channel_collaborator_management_by_collaborator() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::AgentRemark])
            .setup();
        SuccessfulChannelCollaboratorsManagementFlow::default()
            .with_owner_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_owner_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_agent_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_agent_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .run();
    })
}

/////////////////////////////////////////////////////////////////////
/////////// Channel agent / owner permissions - AddVideo ////////////
/////////////////////////////////////////////////////////////////////

// Curator channels

#[test]
fn unsuccessful_video_creation_with_assets_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::AddVideo])
            .setup();
        CreateVideoFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .with_assets(create_default_assets_helper())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_video_creation_with_assets_by_curator_agent() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_agent_permissions(&[ChannelActionPermission::AddVideo])
            .setup();
        CreateVideoFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .with_assets(create_default_assets_helper())
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_video_creation_with_assets_by_lead() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel().setup();
        CreateVideoFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_assets(create_default_assets_helper())
            .call_and_assert(Ok(()));
    })
}

// Member channels

#[test]
fn unsuccessful_video_creation_with_assets_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::AddVideo])
            .setup();
        CreateVideoFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .with_assets(create_default_assets_helper())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_video_creation_with_assets_by_collaborator() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_agent_permissions(&[ChannelActionPermission::AddVideo])
            .setup();
        CreateVideoFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .with_assets(create_default_assets_helper())
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_video_creation_with_assets_by_owner_member() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        CreateVideoFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets(create_default_assets_helper())
            .call_and_assert(Ok(()));
    })
}

/////////////////////////////////////////////////////////////////////
////// Channel agent / owner permissions - UpdateVideoMetadata //////
/////////////////////////////////////////////////////////////////////

// Curator channels

#[test]
fn unsuccessful_video_metadata_update_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_video()
            .with_all_agent_permissions_except(&[ChannelActionPermission::UpdateVideoMetadata])
            .setup();
        UpdateVideoFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .with_new_meta(Some(b"new meta".to_vec()))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_video_metadata_update_by_curator_agent() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_video()
            .with_agent_permissions(&[ChannelActionPermission::UpdateVideoMetadata])
            .setup();
        UpdateVideoFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .with_new_meta(Some(b"new meta".to_vec()))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_video_metadata_update_by_lead() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel().with_video().setup();
        UpdateVideoFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_new_meta(Some(b"new meta".to_vec()))
            .call_and_assert(Ok(()));
    })
}

// Member channels

#[test]
fn unsuccessful_video_metadata_update_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_video()
            .with_all_agent_permissions_except(&[ChannelActionPermission::UpdateVideoMetadata])
            .setup();
        UpdateVideoFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .with_new_meta(Some(b"new meta".to_vec()))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_video_metadata_update_by_collaborator() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_video()
            .with_agent_permissions(&[ChannelActionPermission::UpdateVideoMetadata])
            .setup();
        UpdateVideoFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .with_new_meta(Some(b"new meta".to_vec()))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_video_metadata_update_by_owner_member() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_video()
            .with_agent_permissions(&[ChannelActionPermission::UpdateVideoMetadata])
            .setup();
        UpdateVideoFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_new_meta(Some(b"new meta".to_vec()))
            .call_and_assert(Ok(()));
    })
}

/////////////////////////////////////////////////////////////////////
/////// Channel agent / owner permissions - ManageVideoAssets ///////
/////////////////////////////////////////////////////////////////////

// Curator channels

#[test]
fn unsuccessful_video_assets_update_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_video()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoAssets])
            .setup();
        UpdateVideoFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .with_assets_to_upload(create_default_assets_helper())
            .with_assets_to_remove(BTreeSet::from_iter(
                DATA_OBJECTS_NUMBER..DATA_OBJECTS_NUMBER * 2,
            ))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_video_assets_update_by_curator_agent() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_video()
            .with_agent_permissions(&[ChannelActionPermission::ManageVideoAssets])
            .setup();
        UpdateVideoFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .with_assets_to_upload(create_default_assets_helper())
            .with_assets_to_remove(BTreeSet::from_iter(
                DATA_OBJECTS_NUMBER..DATA_OBJECTS_NUMBER * 2,
            ))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_video_assets_update_by_lead() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel().with_video().setup();
        UpdateVideoFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_assets_to_upload(create_default_assets_helper())
            .with_assets_to_remove(BTreeSet::from_iter(
                DATA_OBJECTS_NUMBER..DATA_OBJECTS_NUMBER * 2,
            ))
            .call_and_assert(Ok(()));
    })
}

// Member channels

#[test]
fn unsuccessful_video_assets_update_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_video()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoAssets])
            .setup();
        UpdateVideoFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .with_assets_to_upload(create_default_assets_helper())
            .with_assets_to_remove(BTreeSet::from_iter(
                DATA_OBJECTS_NUMBER..DATA_OBJECTS_NUMBER * 2,
            ))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_video_assets_update_by_collaborator() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_video()
            .with_agent_permissions(&[ChannelActionPermission::ManageVideoAssets])
            .setup();
        UpdateVideoFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .with_assets_to_upload(create_default_assets_helper())
            .with_assets_to_remove(BTreeSet::from_iter(
                DATA_OBJECTS_NUMBER..DATA_OBJECTS_NUMBER * 2,
            ))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_video_assets_update_by_owner_member() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().with_video().setup();
        UpdateVideoFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets_to_upload(create_default_assets_helper())
            .with_assets_to_remove(BTreeSet::from_iter(
                DATA_OBJECTS_NUMBER..DATA_OBJECTS_NUMBER * 2,
            ))
            .call_and_assert(Ok(()));
    })
}

///////////////////////////////////////////////////////////////
/////// Channel agent / owner permissions - DeleteVideo ///////
///////////////////////////////////////////////////////////////

// Curator channels

#[test]
fn unsuccessful_empty_video_deletion_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_video()
            .with_video_assets(None)
            .with_all_agent_permissions_except(&[ChannelActionPermission::DeleteVideo])
            .setup();
        DeleteVideoFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .with_num_objects_to_delete(0)
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_empty_video_deletion_by_curator_agent() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_video()
            .with_video_assets(None)
            .with_agent_permissions(&[ChannelActionPermission::DeleteVideo])
            .setup();
        DeleteVideoFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .with_num_objects_to_delete(0)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_empty_video_deletion_by_lead() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_video()
            .with_video_assets(None)
            .setup();
        DeleteVideoFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_num_objects_to_delete(0)
            .call_and_assert(Ok(()));
    })
}

// Member channels

#[test]
fn unsuccessful_empty_video_deletion_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_video()
            .with_video_assets(None)
            .with_all_agent_permissions_except(&[ChannelActionPermission::DeleteVideo])
            .setup();
        DeleteVideoFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .with_num_objects_to_delete(0)
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_empty_video_deletion_by_collaborator() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_video()
            .with_video_assets(None)
            .with_agent_permissions(&[ChannelActionPermission::DeleteVideo])
            .setup();
        DeleteVideoFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .with_num_objects_to_delete(0)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_empty_video_deletion_by_owner_member() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_video()
            .with_video_assets(None)
            .setup();
        DeleteVideoFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_num_objects_to_delete(0)
            .call_and_assert(Ok(()));
    })
}

///////////////////////////////////////////////////////////////////
/////// Channel agent / owner permissions - ManageVideoNfts ///////
///////////////////////////////////////////////////////////////////

// Curator channels

#[test]
fn unsuccessful_video_nft_issuance_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_video()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        IssueNftFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_create_video_with_auto_issue_nft_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        CreateVideoFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .with_nft_issuance(NftIssuanceParameters::<Test>::default())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_update_video_with_auto_issue_nft_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_video()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        UpdateVideoFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .with_nft_issuance(NftIssuanceParameters::<Test>::default())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_start_open_auction_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_video()
            .with_video_nft()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        StartOpenAuctionFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_start_english_auction_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_video()
            .with_video_nft()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        StartEnglishAuctionFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_cancel_open_auction_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_video_nft_status(NftTransactionalStatusType::Auction(AuctionType::Open))
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        CancelAuctionFixture::default(AuctionType::Open)
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_cancel_english_auction_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_video_nft_status(NftTransactionalStatusType::Auction(AuctionType::English))
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        CancelAuctionFixture::default(AuctionType::English)
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_offer_nft_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_video_nft()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        OfferNftFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_cancel_nft_offer_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_video_nft_status(NftTransactionalStatusType::Offer)
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        CancelOfferFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_sell_nft_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_video_nft()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        SellNftFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_cancel_buy_now_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_video_nft_status(NftTransactionalStatusType::BuyNow)
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        CancelBuyNowFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_update_buy_now_price_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_video_nft_status(NftTransactionalStatusType::BuyNow)
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        UpdateBuyNowPriceFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_pick_open_auction_winner_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_nft_open_auction_bid()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        PickOpenAuctionWinnerFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_nft_owner_remark_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_video_nft()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        NftOwnerRemarkFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_nft_destruction_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_video_nft()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        DestroyNftFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn succesfull_nft_management_actions_by_curator_agent() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_video()
            .with_agent_permissions(&[
                ChannelActionPermission::ManageVideoNfts,
                ChannelActionPermission::AddVideo,
            ])
            .setup();
        SuccessfulNftManagementFlow::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .run()
    })
}

#[test]
fn succesfull_nft_management_actions_by_lead() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel().with_video().setup();
        SuccessfulNftManagementFlow::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .run()
    })
}

// Member channels

#[test]
fn unsuccessful_video_nft_issuance_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_video()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        IssueNftFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_create_video_with_auto_issue_nft_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        CreateVideoFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .with_nft_issuance(NftIssuanceParameters::<Test>::default())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_update_video_with_auto_issue_nft_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_video()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        UpdateVideoFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .with_nft_issuance(NftIssuanceParameters::<Test>::default())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_start_open_auction_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_video()
            .with_video_nft()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        StartOpenAuctionFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_start_english_auction_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_video()
            .with_video_nft()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        StartEnglishAuctionFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_cancel_open_auction_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_video_nft_status(NftTransactionalStatusType::Auction(AuctionType::Open))
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        CancelAuctionFixture::default(AuctionType::Open)
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_cancel_english_auction_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_video_nft_status(NftTransactionalStatusType::Auction(AuctionType::English))
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        CancelAuctionFixture::default(AuctionType::English)
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_offer_nft_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_video_nft()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        OfferNftFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_cancel_nft_offer_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_video_nft_status(NftTransactionalStatusType::Offer)
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        CancelOfferFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_sell_nft_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_video_nft()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        SellNftFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_cancel_buy_now_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_video_nft_status(NftTransactionalStatusType::BuyNow)
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        CancelBuyNowFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_update_buy_now_price_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_video_nft_status(NftTransactionalStatusType::BuyNow)
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        UpdateBuyNowPriceFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_pick_open_auction_winner_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_nft_open_auction_bid()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        PickOpenAuctionWinnerFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_nft_owner_remark_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_video_nft()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        NftOwnerRemarkFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_nft_destruction_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_video_nft()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageVideoNfts])
            .setup();
        DestroyNftFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn succesfull_nft_management_actions_by_collaborator() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_video()
            .with_agent_permissions(&[
                ChannelActionPermission::ManageVideoNfts,
                ChannelActionPermission::AddVideo,
            ])
            .setup();
        SuccessfulNftManagementFlow::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .run()
    })
}

#[test]
fn succesfull_nft_management_actions_by_owner_member() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().with_video().setup();
        SuccessfulNftManagementFlow::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .run()
    })
}

///////////////////////////////////////////////////////////////
/////// Channel agent / owner permissions - AgentRemark ///////
///////////////////////////////////////////////////////////////

// Curator channels

#[test]
fn unsuccessful_channel_agent_remark_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::AgentRemark])
            .setup();
        ChannelAgentRemarkFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_channel_agent_remark_by_curator_agent() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_agent_permissions(&[ChannelActionPermission::AgentRemark])
            .setup();
        ChannelAgentRemarkFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_channel_agent_remark_by_lead() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel().setup();
        ChannelAgentRemarkFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
    })
}

// Member channels

#[test]
fn unsuccessful_channel_agent_remark_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::AgentRemark])
            .setup();
        ChannelAgentRemarkFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_channel_agent_remark_by_collaborator() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_agent_permissions(&[ChannelActionPermission::AgentRemark])
            .setup();
        ChannelAgentRemarkFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_channel_agent_remark_by_owner_member() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        ChannelAgentRemarkFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Ok(()));
    })
}

///////////////////////////////////////////////////////////////////////////////
/////// Channel agent / owner permissions - initialize channel transfer ///////
///////////////////////////////////////////////////////////////////////////////

// Curator channels

#[test]
fn unsuccessful_initialize_channel_transfer_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::TransferChannel])
            .setup();
        InitializeChannelTransferFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_initialize_channel_transfer_by_curator_agent() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_agent_permissions(&[ChannelActionPermission::TransferChannel])
            .setup();
        InitializeChannelTransferFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_initialize_channel_transfer_by_lead() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel().setup();
        InitializeChannelTransferFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
    })
}

// Member channels

#[test]
fn unsuccessful_initialize_channel_transfer_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::TransferChannel])
            .setup();
        InitializeChannelTransferFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_initialize_channel_transfer_by_collaborator() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_agent_permissions(&[ChannelActionPermission::TransferChannel])
            .setup();
        InitializeChannelTransferFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_initialize_channel_transfer_by_owner_member() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        InitializeChannelTransferFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Ok(()));
    })
}

///////////////////////////////////////////////////////////////////////////
/////// Channel agent / owner permissions - cancel channel transfer ///////
///////////////////////////////////////////////////////////////////////////

// Curator channels

#[test]
fn unsuccessful_cancel_channel_transfer_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::TransferChannel])
            .setup();
        InitializeChannelTransferFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
        CancelChannelTransferFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_cancel_channel_transfer_by_curator_agent() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_agent_permissions(&[ChannelActionPermission::TransferChannel])
            .setup();
        InitializeChannelTransferFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
        CancelChannelTransferFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_cancel_channel_transfer_by_lead() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel().setup();
        InitializeChannelTransferFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
        CancelChannelTransferFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
    })
}

// Member channels

#[test]
fn unsuccessful_cancel_channel_transfer_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::TransferChannel])
            .setup();
        InitializeChannelTransferFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Ok(()));
        CancelChannelTransferFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_cancel_channel_transfer_by_collaborator() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_agent_permissions(&[ChannelActionPermission::TransferChannel])
            .setup();
        InitializeChannelTransferFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Ok(()));
        CancelChannelTransferFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_cancel_channel_transfer_by_owner_member() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        InitializeChannelTransferFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Ok(()));
        CancelChannelTransferFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Ok(()));
    })
}

//////////////////////////////////////////////////////////////////////
/////////////// END OF CHANNEL AGENT PERMISSIONS TESTS ///////////////
//////////////////////////////////////////////////////////////////////
