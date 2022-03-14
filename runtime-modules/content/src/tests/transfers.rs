#![cfg(test)]
use super::fixtures::*;
use super::mock::*;
use crate::tests::curators::add_curator_to_new_group;
use crate::*;
use frame_system::RawOrigin;
use sp_core::sp_std::iter::FromIterator;

#[test]
fn update_channel_transfer_status_succeeds() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelTransferStatusFixture::default().call_and_assert(Ok(()))
    })
}

#[test]
fn update_channel_transfer_status_fails_with_invalid_channel_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let invalid_channel_id = Content::next_channel_id();

        UpdateChannelTransferStatusFixture::default()
            .with_channel_id(invalid_channel_id)
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()))
    })
}

#[test]
fn update_channel_transfer_status_fails_with_invalid_origin() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelTransferStatusFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin))
    })
}

#[test]
fn update_channel_transfer_status_fails_with_member_actor() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let invalid_member_id = 111;
        UpdateChannelTransferStatusFixture::default()
            .with_actor(ContentActor::Member(invalid_member_id))
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()))
    })
}

#[test]
fn update_channel_transfer_status_fails_with_non_channel_owner() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();
        let curator_group_id = add_curator_to_new_group(DEFAULT_CURATOR_ID);

        UpdateChannelTransferStatusFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_CURATOR_ACCOUNT_ID))
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
fn update_channel_transfer_status_fails_with_invalid_status() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelTransferStatusFixture::default().call_and_assert(Ok(()));

        UpdateChannelTransferStatusFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidChannelTransferStatus.into()))
    })
}

#[test]
fn update_channel_transfer_status_fails_with_invalid_collaborators() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let invalid_member_id = 111;
        UpdateChannelTransferStatusFixture::default()
            .with_transfer_params(PendingTransfer::<u64, u64, u64> {
                new_collaborators: BTreeSet::from_iter(vec![invalid_member_id]),
                ..Default::default()
            })
            .call_and_assert(Err(Error::<Test>::InvalidMemberProvided.into()))
    })
}
