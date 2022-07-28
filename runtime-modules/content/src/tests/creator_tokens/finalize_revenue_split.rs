#![cfg(test)]
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::*;
use project_token::Module as Token;

#[test]
fn unsuccessful_finalize_revenue_split_non_existing_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);

        FinalizeRevenueSplitFixture::default()
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));
    })
}

#[test]
fn unsuccessful_finalize_revenue_split_token_not_issued() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        FinalizeRevenueSplitFixture::default()
            .call_and_assert(Err(Error::<Test>::CreatorTokenNotIssued.into()));
    })
}

// Member channel

#[test]
fn unsuccessful_finalize_member_channel_revenue_split_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageRevenueSplits])
            .setup();
        FinalizeRevenueSplitFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_finalize_member_channel_revenue_split_by_collaborator() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_agent_permissions(&[ChannelActionPermission::ManageRevenueSplits])
            .setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        increase_account_balance_helper(
            ContentTreasury::<Test>::account_for_channel(ChannelId::one()),
            DEFAULT_PAYOUT_EARNED
                // TODO: Should be changed to bloat_bond after https://github.com/Joystream/joystream/issues/3511
                .saturating_add(<Test as balances::Config>::ExistentialDeposit::get().into()),
        );
        IssueRevenueSplitFixture::default().call_and_assert(Ok(()));
        run_to_block(
            1 + Token::<Test>::min_revenue_split_time_to_start() + DEFAULT_REVENUE_SPLIT_DURATION,
        );
        FinalizeRevenueSplitFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_finalize_member_channel_revenue_split_by_owner() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        increase_account_balance_helper(
            ContentTreasury::<Test>::account_for_channel(ChannelId::one()),
            DEFAULT_PAYOUT_EARNED
                // TODO: Should be changed to bloat_bond after https://github.com/Joystream/joystream/issues/3511
                .saturating_add(<Test as balances::Config>::ExistentialDeposit::get().into()),
        );
        IssueRevenueSplitFixture::default().call_and_assert(Ok(()));
        run_to_block(
            1 + Token::<Test>::min_revenue_split_time_to_start() + DEFAULT_REVENUE_SPLIT_DURATION,
        );
        FinalizeRevenueSplitFixture::default().call_and_assert(Ok(()));
    })
}

// Curator channel

#[test]
fn unsuccessful_finalize_curator_channel_revenue_split_by_curator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageRevenueSplits])
            .setup();
        FinalizeRevenueSplitFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_finalize_curator_channel_revenue_split_by_curator() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_agent_permissions(&[ChannelActionPermission::ManageRevenueSplits])
            .setup();
        IssueCreatorTokenFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_initial_allocation_to(LEAD_MEMBER_ID)
            .call_and_assert(Ok(()));
        increase_account_balance_helper(
            ContentTreasury::<Test>::account_for_channel(ChannelId::one()),
            DEFAULT_PAYOUT_EARNED
                // TODO: Should be changed to bloat_bond after https://github.com/Joystream/joystream/issues/3511
                .saturating_add(<Test as balances::Config>::ExistentialDeposit::get().into()),
        );
        IssueRevenueSplitFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
        run_to_block(
            1 + Token::<Test>::min_revenue_split_time_to_start() + DEFAULT_REVENUE_SPLIT_DURATION,
        );
        FinalizeRevenueSplitFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_finalize_curator_channel_revenue_split_by_lead() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel().setup();
        IssueCreatorTokenFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_initial_allocation_to(LEAD_MEMBER_ID)
            .call_and_assert(Ok(()));
        increase_account_balance_helper(
            ContentTreasury::<Test>::account_for_channel(ChannelId::one()),
            DEFAULT_PAYOUT_EARNED
                // TODO: Should be changed to bloat_bond after https://github.com/Joystream/joystream/issues/3511
                .saturating_add(<Test as balances::Config>::ExistentialDeposit::get().into()),
        );
        IssueRevenueSplitFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
        run_to_block(
            1 + Token::<Test>::min_revenue_split_time_to_start() + DEFAULT_REVENUE_SPLIT_DURATION,
        );
        FinalizeRevenueSplitFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
    })
}
