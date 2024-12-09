#![cfg(test)]
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::*;
use frame_support::assert_noop;
use frame_support::assert_ok;
use frame_system::RawOrigin;
use project_token::types::PaymentWithVesting;

#[test]
fn unsuccessful_creator_token_issuer_transfer_non_existing_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);

        CreatorTokenIssuerTransferFixture::default()
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));
    })
}

#[test]
fn unsuccessful_creator_token_issuer_transfer_token_not_issued() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        CreatorTokenIssuerTransferFixture::default()
            .call_and_assert(Err(Error::<Test>::CreatorTokenNotIssued.into()));
    })
}

// Member channel

#[test]
fn unsuccessful_member_channel_creator_token_issuer_transfer_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_all_agent_permissions_except(&[
                ChannelActionPermission::CreatorTokenIssuerTransfer,
            ])
            .setup();
        CreatorTokenIssuerTransferFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_member_channel_creator_token_issuer_transfer_by_collaborator() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_agent_permissions(&[ChannelActionPermission::CreatorTokenIssuerTransfer])
            .setup();
        IssueCreatorTokenFixture::default()
            .with_initial_allocation_to(COLLABORATOR_MEMBER_ID)
            .call_and_assert(Ok(()));
        CreatorTokenIssuerTransferFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_member_channel_creator_token_issuer_transfer_by_owner() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        CreatorTokenIssuerTransferFixture::default().call_and_assert(Ok(()));
    })
}

// Curator channel

#[test]
fn unsuccessful_curator_channel_creator_token_issuer_transfer_by_curator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_all_agent_permissions_except(&[
                ChannelActionPermission::CreatorTokenIssuerTransfer,
            ])
            .setup();
        CreatorTokenIssuerTransferFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_curator_channel_creator_token_issuer_transfer_by_curator() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_agent_permissions(&[ChannelActionPermission::CreatorTokenIssuerTransfer])
            .setup();
        IssueCreatorTokenFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_initial_allocation_to(DEFAULT_CURATOR_MEMBER_ID)
            .call_and_assert(Ok(()));
        CreatorTokenIssuerTransferFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_curator_channel_creator_token_issuer_transfer_by_lead() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel().setup();
        IssueCreatorTokenFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_initial_allocation_to(LEAD_MEMBER_ID)
            .call_and_assert(Ok(()));
        CreatorTokenIssuerTransferFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
    })
}
#[test]
fn unsuccessful_curator_channel_creator_token_issuer_transfer_during_transfer() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(THIRD_MEMBER_ID)
            .call_and_assert(Ok(()));
        let outputs = vec![(
            SECOND_MEMBER_ID,
            PaymentWithVesting {
                amount: DEFAULT_ISSUER_TRANSFER_AMOUNT,
                vesting_schedule: None,
            },
        )]
        .try_into()
        .unwrap();

        assert_noop!(
            Content::creator_token_issuer_transfer(
                RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
                ContentActor::Member(DEFAULT_MEMBER_ID),
                1u64,
                outputs,
                vec![]
            ),
            Error::<Test>::InvalidChannelTransferStatus,
        );
    })
}

#[test]
fn member_channel_creator_token_issuer_transfer_by_owner_fails_on_frozen_pallet() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));

        assert_ok!(Token::set_frozen_status(RawOrigin::Root.into(), true));
        CreatorTokenIssuerTransferFixture::default()
            .call_and_assert(Err(project_token::Error::<Test>::PalletFrozen.into()));

        assert_ok!(Token::set_frozen_status(RawOrigin::Root.into(), false));
        CreatorTokenIssuerTransferFixture::default().call_and_assert(Ok(()));
    })
}
