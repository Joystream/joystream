#![cfg(test)]
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::*;

#[test]
fn unsuccessful_claim_creator_token_patronage_credit_non_existing_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);

        ClaimCreatorTokenPatronageCreditFixture::default()
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));
    })
}

#[test]
fn unsuccessful_claim_creator_token_patronage_credit_token_not_issued() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        ClaimCreatorTokenPatronageCreditFixture::default()
            .call_and_assert(Err(Error::<Test>::CreatorTokenNotIssued.into()));
    })
}

#[test]
fn unsuccessful_claim_creator_token_patronage_credit_curator_channel() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel().setup();
        IssueCreatorTokenFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
        ClaimCreatorTokenPatronageCreditFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(
                Error::<Test>::PatronageCanOnlyBeClaimedForMemberOwnedChannels.into(),
            ));
    })
}

#[test]
fn unsuccessful_claim_member_channel_creator_token_patronage_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_all_agent_permissions_except(&[
                ChannelActionPermission::ClaimCreatorTokenPatronage,
            ])
            .setup();
        ClaimCreatorTokenPatronageCreditFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_claim_member_channel_creator_token_patronage_by_collaborator() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_agent_permissions(&[ChannelActionPermission::ClaimCreatorTokenPatronage])
            .setup();
        IssueCreatorTokenFixture::default()
            .with_initial_allocation_to(COLLABORATOR_MEMBER_ID)
            .call_and_assert(Ok(()));
        ClaimCreatorTokenPatronageCreditFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_claim_member_channel_creator_token_patronage_credit_by_owner() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        ClaimCreatorTokenPatronageCreditFixture::default().call_and_assert(Ok(()));
    })
}

// TODO: Enable after Carthage
#[ignore]
#[test]
fn claim_creator_token_patronage_credit_fails_during_trasfer() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(THIRD_MEMBER_ID)
            .call_and_assert(Ok(()));
        ClaimCreatorTokenPatronageCreditFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidChannelTransferStatus.into()));
    })
}
