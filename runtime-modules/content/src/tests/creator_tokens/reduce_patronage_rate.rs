#![cfg(test)]
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::*;
use frame_support::assert_ok;
use frame_system::RawOrigin;
use project_token::Error as ProjectTokenError;

#[test]
fn unsuccessful_reduce_creator_token_patronage_rate_non_existing_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);

        ReduceCreatorTokenPatronageRateFixture::default()
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));
    })
}

#[test]
fn unsuccessful_reduce_creator_token_patronage_rate_token_not_issued() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        ReduceCreatorTokenPatronageRateFixture::default()
            .call_and_assert(Err(Error::<Test>::CreatorTokenNotIssued.into()));
    })
}

// Member channel

#[test]
fn unsuccessful_reduce_member_channel_creator_token_patronage_rate_by_collaborator_without_permissions(
) {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_all_agent_permissions_except(&[
                ChannelActionPermission::ReduceCreatorTokenPatronageRate,
            ])
            .setup();
        ReduceCreatorTokenPatronageRateFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_reduce_member_channel_creator_token_patronage_rate_by_collaborator() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_agent_permissions(&[ChannelActionPermission::ReduceCreatorTokenPatronageRate])
            .setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        ReduceCreatorTokenPatronageRateFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_reduce_member_channel_creator_token_patronage_rate_by_owner() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        ReduceCreatorTokenPatronageRateFixture::default().call_and_assert(Ok(()));
    })
}

// Curator channel

#[test]
fn unsuccessful_reduce_curator_channel_creator_token_patronage_rate_by_curator_without_permissions()
{
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_all_agent_permissions_except(&[
                ChannelActionPermission::ReduceCreatorTokenPatronageRate,
            ])
            .setup();
        ReduceCreatorTokenPatronageRateFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_reduce_curator_channel_creator_token_patronage_rate_by_curator() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_agent_permissions(&[ChannelActionPermission::ReduceCreatorTokenPatronageRate])
            .setup();
        IssueCreatorTokenFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_initial_allocation_to(LEAD_MEMBER_ID)
            .call_and_assert(Ok(()));
        ReduceCreatorTokenPatronageRateFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_reduce_curator_channel_creator_token_patronage_rate_by_lead() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel().setup();
        IssueCreatorTokenFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_initial_allocation_to(LEAD_MEMBER_ID)
            .call_and_assert(Ok(()));
        ReduceCreatorTokenPatronageRateFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn reduce_creator_token_patronage_rate_fails_during_transfer() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(THIRD_MEMBER_ID)
            .call_and_assert(Ok(()));
        ReduceCreatorTokenPatronageRateFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidChannelTransferStatus.into()));
    })
}

#[test]
fn reduce_member_channel_creator_token_patronage_rate_by_owner_fails_on_frozen_pallet() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));

        assert_ok!(Token::set_frozen_status(RawOrigin::Root.into(), true));
        ReduceCreatorTokenPatronageRateFixture::default()
            .call_and_assert(Err(ProjectTokenError::<Test>::PalletFrozen.into()));

        assert_ok!(Token::set_frozen_status(RawOrigin::Root.into(), false));
        ReduceCreatorTokenPatronageRateFixture::default().call_and_assert(Ok(()));
    })
}
