#![cfg(test)]
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::*;
use sp_arithmetic::PerThing;

#[test]
fn unsuccessful_issue_revenue_split_non_existing_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);

        IssueRevenueSplitFixture::default()
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));
    })
}

#[test]
fn unsuccessful_issue_revenue_split_token_not_issued() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueRevenueSplitFixture::default()
            .call_and_assert(Err(Error::<Test>::CreatorTokenNotIssued.into()));
    })
}

#[test]
fn unsuccessful_issue_revenue_split_with_reward_account_empty() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        IssueRevenueSplitFixture::default().call_and_assert(Err(
            project_token::Error::<Test>::CannotIssueSplitWithZeroAllocationAmount.into(),
        ));
    })
}

// Member channel

#[test]
fn unsuccessful_issue_member_channel_revenue_split_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageRevenueSplits])
            .setup();
        IssueRevenueSplitFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_issue_member_channel_revenue_split_by_collaborator() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_agent_permissions(&[ChannelActionPermission::ManageRevenueSplits])
            .setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        increase_account_balance_helper(
            ContentTreasury::<Test>::account_for_channel(ChannelId::one()),
            DEFAULT_PAYOUT_EARNED,
        );
        IssueRevenueSplitFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_issue_member_channel_revenue_split_by_owner() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        increase_account_balance_helper(
            ContentTreasury::<Test>::account_for_channel(ChannelId::one()),
            DEFAULT_PAYOUT_EARNED,
        );
        IssueRevenueSplitFixture::default().call_and_assert(Ok(()));
    })
}

// Curator channel

#[test]
fn unsuccessful_issue_curator_channel_revenue_split_by_curator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ManageRevenueSplits])
            .setup();
        IssueRevenueSplitFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_issue_curator_channel_revenue_split_by_curator() {
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
            DEFAULT_PAYOUT_EARNED,
        );
        IssueRevenueSplitFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_issue_curator_channel_revenue_split_by_lead() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel().setup();
        IssueCreatorTokenFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_initial_allocation_to(LEAD_MEMBER_ID)
            .call_and_assert(Ok(()));
        increase_account_balance_helper(
            ContentTreasury::<Test>::account_for_channel(ChannelId::one()),
            DEFAULT_PAYOUT_EARNED,
        );
        IssueRevenueSplitFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn issue_revenue_split_fails_during_trasfer() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(THIRD_MEMBER_ID)
            .call_and_assert(Ok(()));
        IssueRevenueSplitFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidChannelTransferStatus.into()));
    })
}

#[test]
fn issue_revenue_split_leftover_funds_sent_to_member_controller_account() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        increase_account_balance_helper(
            ContentTreasury::<Test>::account_for_channel(ChannelId::one()),
            DEFAULT_PAYOUT_EARNED,
        );
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        let balance_pre = balances::Pallet::<Test>::usable_balance(DEFAULT_MEMBER_ACCOUNT_ID);

        IssueRevenueSplitFixture::default().call_and_assert(Ok(()));

        assert_eq!(
            (
                channel_reward_account_balance(ChannelId::one()),
                balances::Pallet::<Test>::usable_balance(DEFAULT_MEMBER_ACCOUNT_ID),
            ),
            (
                DEFAULT_CHANNEL_STATE_BLOAT_BOND,
                balance_pre.saturating_add(
                    DEFAULT_SPLIT_RATE
                        .left_from_one()
                        .mul_ceil(DEFAULT_PAYOUT_EARNED)
                )
            )
        )
    })
}

#[test]
fn issue_revenue_split_leftover_funds_sent_to_council_budget() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_agent_permissions(&[
                ChannelActionPermission::IssueCreatorToken,
                ChannelActionPermission::ManageRevenueSplits,
            ])
            .setup();
        increase_account_balance_helper(
            ContentTreasury::<Test>::account_for_channel(ChannelId::one()),
            DEFAULT_PAYOUT_EARNED,
        );
        IssueCreatorTokenFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
        let balance_pre = <Test as Config>::CouncilBudgetManager::get_budget();

        IssueRevenueSplitFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));

        assert_eq!(
            (
                channel_reward_account_balance(ChannelId::one()),
                <Test as Config>::CouncilBudgetManager::get_budget(),
            ),
            (
                DEFAULT_CHANNEL_STATE_BLOAT_BOND,
                balance_pre.saturating_add(
                    DEFAULT_SPLIT_RATE
                        .left_from_one()
                        .mul_ceil(DEFAULT_PAYOUT_EARNED)
                )
            )
        )
    })
}
