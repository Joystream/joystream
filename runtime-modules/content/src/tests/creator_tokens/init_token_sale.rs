#![cfg(test)]
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::*;
use frame_support::assert_noop;

#[test]
fn unsuccessful_init_creator_token_sale_non_existing_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);

        InitCreatorTokenSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));
    })
}

#[test]
fn unsuccessful_init_creator_token_sale_token_not_issued() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        InitCreatorTokenSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::CreatorTokenNotIssued.into()));
    })
}

// Member channel

#[test]
fn unsuccessful_init_member_channel_creator_token_sale_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_all_agent_permissions_except(&[
                ChannelActionPermission::InitAndManageCreatorTokenSale,
            ])
            .setup();
        InitCreatorTokenSaleFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_init_member_channel_creator_token_sale_by_collaborator() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_agent_permissions(&[ChannelActionPermission::InitAndManageCreatorTokenSale])
            .setup();
        IssueCreatorTokenFixture::default()
            .with_initial_allocation_to(COLLABORATOR_MEMBER_ID)
            .call_and_assert(Ok(()));
        InitCreatorTokenSaleFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_init_member_channel_creator_token_sale_by_owner() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        InitCreatorTokenSaleFixture::default().call_and_assert(Ok(()));
    })
}

// Curator channel

#[test]
fn unsuccessful_init_curator_channel_creator_token_sale_by_curator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_all_agent_permissions_except(&[
                ChannelActionPermission::InitAndManageCreatorTokenSale,
            ])
            .setup();
        InitCreatorTokenSaleFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_init_curator_channel_creator_token_sale_by_curator() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_agent_permissions(&[ChannelActionPermission::InitAndManageCreatorTokenSale])
            .setup();
        IssueCreatorTokenFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_initial_allocation_to(DEFAULT_CURATOR_MEMBER_ID)
            .call_and_assert(Ok(()));
        InitCreatorTokenSaleFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_init_curator_channel_creator_token_sale_by_lead() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel().setup();
        IssueCreatorTokenFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_initial_allocation_to(LEAD_MEMBER_ID)
            .call_and_assert(Ok(()));
        InitCreatorTokenSaleFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn init_token_sale_fails_during_channel_transfer() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        UpdateChannelTransferStatusFixture::default()
            .with_new_member_channel_owner(THIRD_MEMBER_ID)
            .call_and_assert(Ok(()));

        assert_noop!(
            Content::init_creator_token_sale(
                Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
                ContentActor::Member(DEFAULT_MEMBER_ID),
                1u64,
                TokenSaleParamsOf::<Test> {
                    unit_price: DEFAULT_CREATOR_TOKEN_SALE_UNIT_PRICE,
                    upper_bound_quantity: DEFAULT_CREATOR_TOKEN_ISSUANCE,
                    starts_at: None,
                    duration: DEFAULT_CREATOR_TOKEN_SALE_DURATION,
                    vesting_schedule_params: None,
                    cap_per_member: None,
                    metadata: None,
                },
            ),
            Error::<Test>::InvalidChannelTransferStatus,
        );
    })
}
