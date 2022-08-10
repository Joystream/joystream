#![cfg(test)]
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::*;
use common::BudgetManager;

fn purchase_tokens_on_sale(amount: u64) {
    let existential_deposit: u64 = <Test as balances::Config>::ExistentialDeposit::get().into();
    increase_account_balance_helper(
        SECOND_MEMBER_ACCOUNT_ID,
        existential_deposit + DEFAULT_CREATOR_TOKEN_SALE_UNIT_PRICE * amount,
    );
    project_token::Module::<Test>::purchase_tokens_on_sale(
        Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
        project_token::Module::<Test>::next_token_id() - 1,
        SECOND_MEMBER_ID,
        amount,
    )
    .unwrap();
}

#[test]
fn unsuccessful_finalize_creator_token_sale_non_existing_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);

        FinalizeCreatorTokenSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));
    })
}

#[test]
fn unsuccessful_finalize_creator_token_sale_token_not_issued() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        FinalizeCreatorTokenSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::CreatorTokenNotIssued.into()));
    })
}

// Member channel

#[test]
fn unsuccessful_finalize_member_channel_creator_token_sale_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_all_agent_permissions_except(&[
                ChannelActionPermission::InitAndManageCreatorTokenSale,
            ])
            .setup();
        FinalizeCreatorTokenSaleFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_finalize_member_channel_creator_token_sale_by_collaborator_when_initialized_by_owner(
) {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_agent_permissions(&[ChannelActionPermission::InitAndManageCreatorTokenSale])
            .setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        InitCreatorTokenSaleFixture::default().call_and_assert(Ok(()));
        FinalizeCreatorTokenSaleFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_finalize_member_channel_creator_token_sale_by_collaborator() {
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
        purchase_tokens_on_sale(DEFAULT_CREATOR_TOKEN_ISSUANCE - 1);
        run_to_block(1 + DEFAULT_CREATOR_TOKEN_SALE_DURATION);
        FinalizeCreatorTokenSaleFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_finalize_member_channel_creator_token_sale_by_owner() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        InitCreatorTokenSaleFixture::default().call_and_assert(Ok(()));
        purchase_tokens_on_sale(DEFAULT_CREATOR_TOKEN_ISSUANCE - 1);
        run_to_block(1 + DEFAULT_CREATOR_TOKEN_SALE_DURATION);
        FinalizeCreatorTokenSaleFixture::default().call_and_assert(Ok(()));
    })
}

// Curator channel

#[test]
fn unsuccessful_finalize_curator_channel_creator_token_sale_by_curator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_all_agent_permissions_except(&[
                ChannelActionPermission::InitAndManageCreatorTokenSale,
            ])
            .setup();
        FinalizeCreatorTokenSaleFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_finalize_curator_channel_creator_token_sale_by_curator_when_initialized_by_lead() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_agent_permissions(&[ChannelActionPermission::InitAndManageCreatorTokenSale])
            .setup();
        IssueCreatorTokenFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_initial_allocation_to(LEAD_MEMBER_ID)
            .call_and_assert(Ok(()));
        InitCreatorTokenSaleFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
        FinalizeCreatorTokenSaleFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_finalize_curator_channel_creator_token_sale_by_curator() {
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
        purchase_tokens_on_sale(DEFAULT_CREATOR_TOKEN_ISSUANCE);
        run_to_block(1 + DEFAULT_CREATOR_TOKEN_SALE_DURATION);
        let council_budget_pre = <Test as Config>::CouncilBudgetManager::get_budget();
        FinalizeCreatorTokenSaleFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
        let council_budget_post = <Test as Config>::CouncilBudgetManager::get_budget();
        assert_eq!(
            council_budget_post,
            council_budget_pre.saturating_add(
                DEFAULT_CREATOR_TOKEN_ISSUANCE * DEFAULT_CREATOR_TOKEN_SALE_UNIT_PRICE
            )
        );
    })
}

#[test]
fn successful_finalize_curator_channel_creator_token_sale_by_lead() {
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
        purchase_tokens_on_sale(DEFAULT_CREATOR_TOKEN_ISSUANCE);
        run_to_block(1 + DEFAULT_CREATOR_TOKEN_SALE_DURATION);
        let council_budget_pre = <Test as Config>::CouncilBudgetManager::get_budget();
        FinalizeCreatorTokenSaleFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
        let council_budget_post = <Test as Config>::CouncilBudgetManager::get_budget();
        assert_eq!(
            council_budget_post,
            council_budget_pre.saturating_add(
                DEFAULT_CREATOR_TOKEN_ISSUANCE * DEFAULT_CREATOR_TOKEN_SALE_UNIT_PRICE
            )
        );
    })
}
