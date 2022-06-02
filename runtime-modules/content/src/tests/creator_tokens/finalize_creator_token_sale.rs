#![cfg(test)]

use crate::tests::curators;
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::*;
use common::BudgetManager;

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
        run_to_block(1);

        CreateChannelFixture::default().call_and_assert(Ok(()));
        FinalizeCreatorTokenSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::CreatorTokenNotIssued.into()));
    })
}

#[test]
fn unsuccessful_finalize_creator_token_sale_member_channel_unauthorized_actors() {
    with_default_mock_builder(|| {
        run_to_block(1);
        curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreateChannelFixture::default().call_and_assert(Ok(()));
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        for (sender, actor, err) in get_default_member_channel_invalid_owner_contexts() {
            FinalizeCreatorTokenSaleFixture::default()
                .with_sender(sender)
                .with_actor(actor)
                .call_and_assert(Err(err.into()))
        }
    })
}

#[test]
fn unsuccessful_finalize_creator_token_sale_curator_channel_unauthorized_actors() {
    with_default_mock_builder(|| {
        run_to_block(1);
        curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        curators::add_curator_to_new_group(UNAUTHORIZED_CURATOR_ID);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
        IssueCreatorTokenFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .with_initial_allocation_to(DEFAULT_CURATOR_MEMBER_ID)
            .call_and_assert(Ok(()));
        for (sender, actor, err) in get_default_curator_channel_invalid_owner_contexts() {
            FinalizeCreatorTokenSaleFixture::default()
                .with_sender(sender)
                .with_actor(actor)
                .call_and_assert(Err(err.into()))
        }
    })
}

#[test]
fn successful_finalize_creator_token_sale_member_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);
        let existential_deposit: u64 = <Test as balances::Trait>::ExistentialDeposit::get().into();
        let token_id = project_token::Module::<Test>::next_token_id();
        CreateChannelFixture::default().call_and_assert(Ok(()));
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        InitCreatorTokenSaleFixture::default().call_and_assert(Ok(()));
        increase_account_balance_helper(
            SECOND_MEMBER_ACCOUNT_ID,
            existential_deposit
                + DEFAULT_CREATOR_TOKEN_SALE_UNIT_PRICE * (DEFAULT_CREATOR_TOKEN_ISSUANCE - 1),
        );
        project_token::Module::<Test>::purchase_tokens_on_sale(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            token_id,
            SECOND_MEMBER_ID,
            DEFAULT_CREATOR_TOKEN_ISSUANCE - 1,
        )
        .unwrap();
        run_to_block(1 + DEFAULT_CREATOR_TOKEN_SALE_DURATION);
        FinalizeCreatorTokenSaleFixture::default().call_and_assert(Ok(()));
    })
}

#[test]
fn successful_finalize_creator_token_sale_curator_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);
        let existential_deposit: u64 = <Test as balances::Trait>::ExistentialDeposit::get().into();
        let token_id = project_token::Module::<Test>::next_token_id();
        curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
        IssueCreatorTokenFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .with_initial_allocation_to(DEFAULT_CURATOR_MEMBER_ID)
            .call_and_assert(Ok(()));
        InitCreatorTokenSaleFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
        increase_account_balance_helper(
            SECOND_MEMBER_ACCOUNT_ID,
            existential_deposit
                + DEFAULT_CREATOR_TOKEN_SALE_UNIT_PRICE * DEFAULT_CREATOR_TOKEN_ISSUANCE,
        );
        project_token::Module::<Test>::purchase_tokens_on_sale(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            token_id,
            SECOND_MEMBER_ID,
            DEFAULT_CREATOR_TOKEN_ISSUANCE,
        )
        .unwrap();
        run_to_block(1 + DEFAULT_CREATOR_TOKEN_SALE_DURATION);
        let council_budget_pre = <Test as Trait>::CouncilBudgetManager::get_budget();
        FinalizeCreatorTokenSaleFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
        let council_budget_post = <Test as Trait>::CouncilBudgetManager::get_budget();
        assert_eq!(
            council_budget_post,
            council_budget_pre.saturating_add(
                DEFAULT_CREATOR_TOKEN_ISSUANCE * DEFAULT_CREATOR_TOKEN_SALE_UNIT_PRICE
            )
        );
    })
}
