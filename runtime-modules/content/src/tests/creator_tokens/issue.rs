#![cfg(test)]
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::*;
use frame_support::assert_noop;

#[test]
fn unsuccessful_issue_creator_token_non_existing_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);

        IssueCreatorTokenFixture::default()
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));
    })
}

#[test]
fn unsuccessful_issue_creator_token_with_token_already_issued() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        IssueCreatorTokenFixture::default()
            .call_and_assert(Err(Error::<Test>::CreatorTokenAlreadyIssued.into()))
    })
}

// Member channel

#[test]
fn unsuccessful_issue_member_channel_creator_token_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::IssueCreatorToken])
            .setup();
        IssueCreatorTokenFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_issue_member_channel_creator_token_by_collaborator() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_agent_permissions(&[ChannelActionPermission::IssueCreatorToken])
            .setup();
        IssueCreatorTokenFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_issue_member_channel_creator_token_by_owner() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
    })
}

// Curator channel

#[test]
fn unsuccessful_issue_curator_channel_creator_token_by_curator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::IssueCreatorToken])
            .setup();
        IssueCreatorTokenFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_issue_curator_channel_creator_token_by_curator() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_agent_permissions(&[ChannelActionPermission::IssueCreatorToken])
            .setup();
        IssueCreatorTokenFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_issue_curator_channel_creator_token_by_lead() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel().setup();
        IssueCreatorTokenFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn issue_token_fails_during_transfer() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(THIRD_MEMBER_ID)
            .call_and_assert(Ok(()));

        assert_noop!(
            Content::issue_creator_token(
                Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
                ContentActor::Member(DEFAULT_MEMBER_ID),
                1u64,
                TokenIssuanceParametersOf::<Test>::default(),
            ),
            Error::<Test>::InvalidChannelTransferStatus,
        );
    })
}

#[test]
fn issue_token_fails_with_creator_token_issuance_feature_paused() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        pause_channel_feature(1u64, PausableChannelFeature::CreatorTokenIssuance);

        IssueCreatorTokenFixture::default()
            .call_and_assert(Err(Error::<Test>::ChannelFeaturePaused.into()));
    })
}
