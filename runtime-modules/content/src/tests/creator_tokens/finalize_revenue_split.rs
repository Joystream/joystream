#![cfg(test)]

use crate::tests::curators;
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
        run_to_block(1);

        CreateChannelFixture::default().call_and_assert(Ok(()));
        FinalizeRevenueSplitFixture::default()
            .call_and_assert(Err(Error::<Test>::CreatorTokenNotIssued.into()));
    })
}

#[test]
fn unsuccessful_finalize_revenue_split_member_channel_unauthorized_actors() {
    with_default_mock_builder(|| {
        run_to_block(1);
        curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreateChannelFixture::default().call_and_assert(Ok(()));
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        for (sender, actor, err) in get_default_member_channel_invalid_owner_contexts() {
            FinalizeRevenueSplitFixture::default()
                .with_sender(sender)
                .with_actor(actor)
                .call_and_assert(Err(err.into()))
        }
    })
}

#[test]
fn unsuccessful_finalize_revenue_split_curator_channel_unauthorized_actors() {
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
            .call_and_assert(Ok(()));
        for (sender, actor, err) in get_default_curator_channel_invalid_owner_contexts() {
            FinalizeRevenueSplitFixture::default()
                .with_sender(sender)
                .with_actor(actor)
                .call_and_assert(Err(err.into()))
        }
    })
}

#[test]
fn unsuccessful_finalize_revenue_split_with_no_reward_account() {
    with_default_mock_builder(|| {
        run_to_block(1);
        CreateChannelFixture::default().call_and_assert(Ok(()));
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        FinalizeRevenueSplitFixture::default()
            .call_and_assert(Err(Error::<Test>::RewardAccountIsNotSet.into()));
    })
}

#[test]
fn successful_finalize_revenue_split_member_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);
        CreateChannelFixture::default()
            .with_reward_account(DEFAULT_MEMBER_CHANNEL_REWARD_ACCOUNT_ID)
            .call_and_assert(Ok(()));
        increase_account_balance_helper(
            DEFAULT_MEMBER_CHANNEL_REWARD_ACCOUNT_ID,
            DEFAULT_PAYOUT_EARNED,
        );
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        IssueRevenueSplitFixture::default().call_and_assert(Ok(()));
        run_to_block(
            1 + Token::<Test>::min_revenue_split_time_to_start() + DEFAULT_REVENUE_SPLIT_DURATION,
        );
        FinalizeRevenueSplitFixture::default().call_and_assert(Ok(()));
    })
}

#[test]
fn successful_finalize_revenue_split_curator_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);
        curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .with_reward_account(DEFAULT_CURATOR_CHANNEL_REWARD_ACCOUNT_ID)
            .call_and_assert(Ok(()));
        increase_account_balance_helper(
            DEFAULT_CURATOR_CHANNEL_REWARD_ACCOUNT_ID,
            DEFAULT_PAYOUT_EARNED,
        );
        IssueCreatorTokenFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .with_initial_allocation_to(DEFAULT_CURATOR_MEMBER_ID)
            .call_and_assert(Ok(()));
        IssueRevenueSplitFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
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
