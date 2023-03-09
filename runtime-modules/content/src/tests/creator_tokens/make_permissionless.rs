#![cfg(test)]
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::*;
use frame_support::assert_noop;
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
        ContentTest::with_member_channel().setup();
        MakeCreatorTokenPermissionlessFixture::default()
            .call_and_assert(Err(Error::<Test>::CreatorTokenNotIssued.into()));
    })
}

// Member channel

#[test]
fn unsuccessful_make_member_channel_creator_token_permissionless_by_collaborator_without_permissions(
) {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_all_agent_permissions_except(&[
                ChannelActionPermission::MakeCreatorTokenPermissionless,
            ])
            .setup();
        MakeCreatorTokenPermissionlessFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_make_member_channel_creator_token_permissionless_by_collaborator() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_agent_permissions(&[ChannelActionPermission::MakeCreatorTokenPermissionless])
            .setup();
        IssueCreatorTokenFixture::default()
            .with_transfer_policy(TransferPolicyParamsOf::<Test>::Permissioned(
                WhitelistParamsOf::<Test> {
                    commitment: Hashing::hash(b"commitment"),
                    payload: None,
                },
            ))
            .call_and_assert(Ok(()));
        MakeCreatorTokenPermissionlessFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_make_member_channel_creator_token_permissionless_by_owner() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
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

// Curator channel

#[test]
fn unsuccessful_make_curator_channel_creator_token_permissionless_by_curator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_all_agent_permissions_except(&[
                ChannelActionPermission::MakeCreatorTokenPermissionless,
            ])
            .setup();
        MakeCreatorTokenPermissionlessFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_make_curator_channel_creator_token_permissionless_by_curator() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_agent_permissions(&[ChannelActionPermission::MakeCreatorTokenPermissionless])
            .setup();
        IssueCreatorTokenFixture::default()
            .with_transfer_policy(TransferPolicyParamsOf::<Test>::Permissioned(
                WhitelistParamsOf::<Test> {
                    commitment: Hashing::hash(b"commitment"),
                    payload: None,
                },
            ))
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_initial_allocation_to(LEAD_MEMBER_ID)
            .call_and_assert(Ok(()));
        MakeCreatorTokenPermissionlessFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_make_curator_channel_creator_token_permissionless_by_lead() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel().setup();
        IssueCreatorTokenFixture::default()
            .with_transfer_policy(TransferPolicyParamsOf::<Test>::Permissioned(
                WhitelistParamsOf::<Test> {
                    commitment: Hashing::hash(b"commitment"),
                    payload: None,
                },
            ))
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_initial_allocation_to(LEAD_MEMBER_ID)
            .call_and_assert(Ok(()));
        MakeCreatorTokenPermissionlessFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn make_creator_token_permissionless_fails_during_transfer() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(THIRD_MEMBER_ID)
            .call_and_assert(Ok(()));

        assert_noop!(
            Content::make_creator_token_permissionless(
                RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
                ContentActor::Member(DEFAULT_MEMBER_ID),
                1u64,
            ),
            Error::<Test>::InvalidChannelTransferStatus,
        );
    })
}
