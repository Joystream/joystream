#![cfg(test)]

use crate::tests::curators;
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::*;
use project_token::types::{TransferPolicyParamsOf, WhitelistParamsOf};

#[test]
fn unsuccessful_make_creator_token_permissionless_non_existing_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);

        MakeCreatorTokenPermissionlessFixture::default()
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));
    })
}

#[test]
fn unsuccessful_make_creator_token_permissionless_token_not_issued() {
    with_default_mock_builder(|| {
        run_to_block(1);

        CreateChannelFixture::default().call_and_assert(Ok(()));
        MakeCreatorTokenPermissionlessFixture::default()
            .call_and_assert(Err(Error::<Test>::CreatorTokenNotIssued.into()));
    })
}

#[test]
fn unsuccessful_make_creator_token_permissionless_member_channel_unauthorized_actors() {
    with_default_mock_builder(|| {
        run_to_block(1);
        curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreateChannelFixture::default().call_and_assert(Ok(()));
        IssueCreatorTokenFixture::default()
            .with_transfer_policy(TransferPolicyParamsOf::<Test>::Permissioned(
                WhitelistParamsOf::<Test> {
                    commitment: Hashing::hash(b"commitment"),
                    payload: None,
                },
            ))
            .call_and_assert(Ok(()));
        for (sender, actor, err) in get_default_member_channel_invalid_owner_contexts() {
            MakeCreatorTokenPermissionlessFixture::default()
                .with_sender(sender)
                .with_actor(actor)
                .call_and_assert(Err(err.into()))
        }
    })
}

#[test]
fn unsuccessful_make_creator_token_permissionless_curator_channel_unauthorized_actors() {
    with_default_mock_builder(|| {
        run_to_block(1);
        curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        curators::add_curator_to_new_group(UNAUTHORIZED_CURATOR_ID);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
        IssueCreatorTokenFixture::default()
            .with_transfer_policy(TransferPolicyParamsOf::<Test>::Permissioned(
                WhitelistParamsOf::<Test> {
                    commitment: Hashing::hash(b"commitment"),
                    payload: None,
                },
            ))
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
        for (sender, actor, err) in get_default_curator_channel_invalid_owner_contexts() {
            MakeCreatorTokenPermissionlessFixture::default()
                .with_sender(sender)
                .with_actor(actor)
                .call_and_assert(Err(err.into()))
        }
    })
}

#[test]
fn successful_make_creator_token_permissionless_member_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);
        CreateChannelFixture::default().call_and_assert(Ok(()));
        IssueCreatorTokenFixture::default()
            .with_transfer_policy(TransferPolicyParamsOf::<Test>::Permissioned(
                WhitelistParamsOf::<Test> {
                    commitment: Hashing::hash(b"commitment"),
                    payload: None,
                },
            ))
            .call_and_assert(Ok(()));
        MakeCreatorTokenPermissionlessFixture::default().call_and_assert(Ok(()));
    })
}

#[test]
fn successful_make_creator_token_permissionless_curator_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);
        curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
        IssueCreatorTokenFixture::default()
            .with_transfer_policy(TransferPolicyParamsOf::<Test>::Permissioned(
                WhitelistParamsOf::<Test> {
                    commitment: Hashing::hash(b"commitment"),
                    payload: None,
                },
            ))
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .with_initial_allocation_to(DEFAULT_CURATOR_MEMBER_ID)
            .call_and_assert(Ok(()));
        MakeCreatorTokenPermissionlessFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
    })
}
