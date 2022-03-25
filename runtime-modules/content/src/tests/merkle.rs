#![cfg(test)]
use super::curators::add_curator_to_new_group;
use super::fixtures::*;
use super::mock::*;
use crate::*;
use sp_runtime::DispatchError;

#[test]
fn unsuccessful_reward_claim_with_member_auth_failed() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        ClaimChannelRewardFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()))
    })
}

#[test]
fn unsuccessful_reward_claim_with_curator_auth_failed() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video();

        let default_curator_group_id = Content::next_curator_group_id() - 1;
        ClaimChannelRewardFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .call_and_assert(Err(Error::<Test>::CuratorAuthFailed.into()))
    })
}

#[test]
fn unsuccessful_reward_claim_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video();

        ClaimChannelRewardFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::ActorCannotOwnChannel.into()))
    })
}

#[test]
fn unsuccessful_reward_claim_by_unath_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        ClaimChannelRewardFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(UNAUTHORIZED_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
fn unsuccessful_reward_claim_by_unauth_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video();

        let unauthorized_curator_group_id = add_curator_to_new_group(UNAUTHORIZED_CURATOR_ID);
        ClaimChannelRewardFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                unauthorized_curator_group_id,
                UNAUTHORIZED_CURATOR_ID,
            ))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
fn unsuccessful_reward_claim_with_unsufficient_cashout() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let item = PullPayment::<Test> {
            channel_id: ChannelId::one(),
            cumulative_reward_earned: Content::min_cashout_allowed() - 1,
            reason: Hashing::hash_of(&b"reason".to_vec()),
        };
        ClaimChannelRewardFixture::default()
            .with_payments(vec![item.clone()])
            .with_item(item)
            .call_and_assert(Err(Error::<Test>::CashoutAmountBelowMinimumAmount.into()))
    })
}

#[test]
fn unsuccessful_reward_claim_with_cashout_limit_exceeded() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let item = PullPayment::<Test> {
            channel_id: ChannelId::one(),
            cumulative_reward_earned: Content::max_cashout_allowed() + 1,
            reason: Hashing::hash_of(&b"reason".to_vec()),
        };
        ClaimChannelRewardFixture::default()
            .with_payments(vec![item.clone()])
            .with_item(item)
            .call_and_assert(Err(Error::<Test>::CashoutAmountExceedsMaximumAmount.into()))
    })
}

#[test]
fn unsuccessful_reward_claim_with_invalid_channel_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let item = PullPayment::<Test> {
            channel_id: ChannelId::zero(),
            cumulative_reward_earned: BalanceOf::<Test>::one(),
            reason: Hashing::hash_of(&b"reason".to_vec()),
        };
        ClaimChannelRewardFixture::default()
            .with_payments(vec![item.clone()])
            .with_item(item)
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()))
    })
}

#[test]
fn unsuccessful_reward_claim_with_invalid_claim() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let item = PullPayment::<Test> {
            channel_id: ChannelId::one(),
            cumulative_reward_earned: BalanceOf::<Test>::from(DEFAULT_PAYOUT_CLAIMED + 1),
            reason: Hashing::hash_of(&b"reason".to_vec()),
        };
        ClaimChannelRewardFixture::default()
            .with_item(item)
            .call_and_assert(Err(Error::<Test>::PaymentProofVerificationFailed.into()))
    })
}

#[test]
fn unsuccessful_reward_claim_with_empty_proof() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let item = PullPayment::<Test> {
            channel_id: ChannelId::one(),
            cumulative_reward_earned: BalanceOf::<Test>::from(DEFAULT_PAYOUT_CLAIMED + 1),
            reason: Hashing::hash_of(&b"reason".to_vec()),
        };
        ClaimChannelRewardFixture::default()
            .with_item(item)
            .with_payments(vec![])
            .call_and_assert(Err(Error::<Test>::PaymentProofVerificationFailed.into()))
    })
}

#[test]
fn successful_reward_claim_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();
        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);

        ClaimChannelRewardFixture::default()
            .with_payments(payments)
            .call_and_assert(Ok(()))
    })
}

#[test]
fn successful_reward_claim_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video();
        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);

        let default_curator_group_id = Content::next_curator_group_id() - 1;
        ClaimChannelRewardFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_payments(payments)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .call_and_assert(Ok(()))
    })
}

#[test]
fn successful_reward_claim_with_member_owned_channel_no_reward_account_found() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();
        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);

        UpdateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_reward_account(Some(None))
            .call_and_assert(Ok(()));

        ClaimChannelRewardFixture::default()
            .with_payments(payments)
            .call_and_assert(Ok(()))
    })
}

#[test]
fn unsuccessful_reward_claim_with_curator_owned_channel_no_reward_account_found() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video();
        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);

        let default_curator_group_id = Content::next_curator_group_id() - 1;
        UpdateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .with_reward_account(Some(None))
            .call_and_assert(Ok(()));

        ClaimChannelRewardFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .with_payments(payments)
            .call_and_assert(Err(Error::<Test>::RewardAccountIsNotSet.into()));
    })
}

#[test]
fn unsuccessful_reward_claim_with_no_commitment_value_outstanding() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();
        let payments = create_some_pull_payments_helper();

        ClaimChannelRewardFixture::default()
            .with_payments(payments)
            .call_and_assert(Err(Error::<Test>::PaymentProofVerificationFailed.into()))
    })
}

#[test]
fn unsuccessful_reward_claim_cashouts_disabled() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();
        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);

        UpdateChannelPayoutsFixture::default()
            .with_channel_cashouts_enabled(Some(false))
            .call_and_assert(Ok(()));

        ClaimChannelRewardFixture::default()
            .with_payments(payments.clone())
            .call_and_assert(Err(Error::<Test>::ChannelCashoutsDisabled.into()));
    })
}

#[test]
fn unsuccessful_reward_claim_with_successive_request() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();
        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);

        ClaimChannelRewardFixture::default()
            .with_payments(payments.clone())
            .call_and_assert(Ok(()));

        // cashout is 0 now
        ClaimChannelRewardFixture::default()
            .with_payments(payments)
            .call_and_assert(Err(Error::<Test>::CashoutAmountBelowMinimumAmount.into()))
    })
}

#[test]
fn successful_reward_claim_with_successive_request_when_reward_increased() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();
        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);

        ClaimChannelRewardFixture::default()
            .with_payments(payments.clone())
            .call_and_assert(Ok(()));

        // update commit (double channel's reward)
        let payments2 = create_some_pull_payments_helper_with_rewards(DEFAULT_PAYOUT_EARNED * 2);
        update_commit_value_with_payments_helper(&payments2);

        ClaimChannelRewardFixture::default()
            .with_payments(payments2.clone())
            .with_item(payments2[DEFAULT_PROOF_INDEX])
            .call_and_assert(Ok(()))
    })
}

/// Withdrawals

#[test]
fn unsuccessful_channel_balance_withdrawal_with_auth_failed() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);

        ClaimChannelRewardFixture::default()
            .with_payments(payments)
            .call_and_assert(Ok(()));

        let curator_group_id = add_curator_to_new_group(DEFAULT_CURATOR_ID);

        // As owner
        WithdrawFromChannelBalanceFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()));

        // As curator
        WithdrawFromChannelBalanceFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::CuratorAuthFailed.into()));

        // As lead
        WithdrawFromChannelBalanceFixture::default()
            .with_sender(UNAUTHORIZED_LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()));

        // As collaborator
        WithdrawFromChannelBalanceFixture::default()
            .with_sender(UNAUTHORIZED_COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_channel_balance_withdrawal_as_non_owner() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);

        ClaimChannelRewardFixture::default()
            .with_payments(payments)
            .call_and_assert(Ok(()));

        let curator_group_id = add_curator_to_new_group(DEFAULT_CURATOR_ID);

        // As curator
        WithdrawFromChannelBalanceFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));

        // As lead
        WithdrawFromChannelBalanceFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::ActorCannotOwnChannel.into()));

        // As collaborator
        WithdrawFromChannelBalanceFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_channel_balance_withdrawal_when_amount_exceeds_balance() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        WithdrawFromChannelBalanceFixture::default().call_and_assert(Err(
            Error::<Test>::WithdrawFromChannelAmountExceedsBalance.into(),
        ));
    })
}

#[test]
fn unsuccessful_channel_balance_double_spend_withdrawal() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);

        ClaimChannelRewardFixture::default()
            .with_payments(payments)
            .call_and_assert(Ok(()));

        WithdrawFromChannelBalanceFixture::default().call_and_assert(Ok(()));
        WithdrawFromChannelBalanceFixture::default().call_and_assert(Err(
            Error::<Test>::WithdrawFromChannelAmountExceedsBalance.into(),
        ));
    })
}

#[test]
fn unsuccessful_channel_balance_withdrawal_when_no_reward_account() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        let group_id = add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Ok(()));

        WithdrawFromChannelBalanceFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::RewardAccountIsNotSet.into()));
    })
}

#[test]
fn unsuccessful_channel_balance_withdrawal_invalid_channel_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        WithdrawFromChannelBalanceFixture::default()
            .with_channel_id(ChannelId::zero())
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));
    })
}

#[test]
fn successful_channel_balance_withdrawal_to_custom_destination() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);

        ClaimChannelRewardFixture::default()
            .with_payments(payments)
            .call_and_assert(Ok(()));

        WithdrawFromChannelBalanceFixture::default()
            .with_destination(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_channel_balance_multiple_withdrawals() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);

        ClaimChannelRewardFixture::default()
            .with_payments(payments)
            .call_and_assert(Ok(()));

        WithdrawFromChannelBalanceFixture::default()
            .with_amount(DEFAULT_PAYOUT_CLAIMED - 1)
            .call_and_assert(Ok(()));

        WithdrawFromChannelBalanceFixture::default()
            .with_amount(1)
            .call_and_assert(Ok(()));
    })
}

/// Claim&Withdraw

#[test]
fn unsuccessful_claim_and_withdraw_channel_reward_with_auth_failed() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);

        let curator_group_id = add_curator_to_new_group(DEFAULT_CURATOR_ID);

        // As owner
        ClaimAndWithdrawChannelRewardFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()));

        // As curator
        ClaimAndWithdrawChannelRewardFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::CuratorAuthFailed.into()));

        // As lead
        ClaimAndWithdrawChannelRewardFixture::default()
            .with_sender(UNAUTHORIZED_LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()));

        // As collaborator
        ClaimAndWithdrawChannelRewardFixture::default()
            .with_sender(UNAUTHORIZED_COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()));
    })
}

#[test]
fn unsuccessful_claim_and_withdraw_channel_reward_as_non_owner() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);

        let curator_group_id = add_curator_to_new_group(DEFAULT_CURATOR_ID);

        // As curator
        ClaimAndWithdrawChannelRewardFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));

        // As lead
        ClaimAndWithdrawChannelRewardFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::ActorCannotOwnChannel.into()));

        // As collaborator
        ClaimAndWithdrawChannelRewardFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()));
    })
}

#[test]
fn unsuccessful_claim_and_withdraw_channel_reward_when_no_reward_account() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        let group_id = add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreateChannelFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Ok(()));

        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);

        ClaimAndWithdrawChannelRewardFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::RewardAccountIsNotSet.into()));
    })
}

#[test]
fn unsuccessful_claim_and_withdraw_with_unsufficient_cashout() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let item = PullPayment::<Test> {
            channel_id: ChannelId::one(),
            cumulative_reward_earned: Content::min_cashout_allowed() - 1,
            reason: Hashing::hash_of(&b"reason".to_vec()),
        };
        ClaimAndWithdrawChannelRewardFixture::default()
            .with_payments(vec![item.clone()])
            .with_item(item)
            .call_and_assert(Err(Error::<Test>::CashoutAmountBelowMinimumAmount.into()))
    })
}

#[test]
fn unsuccessful_claim_and_withdraw_with_reward_limit_exceeded() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let item = PullPayment::<Test> {
            channel_id: ChannelId::one(),
            cumulative_reward_earned: Content::max_cashout_allowed() + 1,
            reason: Hashing::hash_of(&b"reason".to_vec()),
        };
        ClaimAndWithdrawChannelRewardFixture::default()
            .with_payments(vec![item.clone()])
            .with_item(item)
            .call_and_assert(Err(Error::<Test>::CashoutAmountExceedsMaximumAmount.into()))
    })
}

#[test]
fn unsuccessful_claim_and_withdraw_with_invalid_channel_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let item = PullPayment::<Test> {
            channel_id: ChannelId::zero(),
            cumulative_reward_earned: BalanceOf::<Test>::one(),
            reason: Hashing::hash_of(&b"reason".to_vec()),
        };
        ClaimAndWithdrawChannelRewardFixture::default()
            .with_payments(vec![item.clone()])
            .with_item(item)
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()))
    })
}

#[test]
fn unsuccessful_claim_and_withdraw_with_invalid_claim() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);

        let item = PullPayment::<Test> {
            channel_id: ChannelId::one(),
            cumulative_reward_earned: BalanceOf::<Test>::from(DEFAULT_PAYOUT_CLAIMED + 1),
            reason: Hashing::hash_of(&b"reason".to_vec()),
        };
        ClaimAndWithdrawChannelRewardFixture::default()
            .with_item(item)
            .call_and_assert(Err(Error::<Test>::PaymentProofVerificationFailed.into()))
    })
}

#[test]
fn unsuccessful_claim_and_withdraw_with_empty_proof() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let item = PullPayment::<Test> {
            channel_id: ChannelId::one(),
            cumulative_reward_earned: BalanceOf::<Test>::from(DEFAULT_PAYOUT_CLAIMED + 1),
            reason: Hashing::hash_of(&b"reason".to_vec()),
        };
        ClaimAndWithdrawChannelRewardFixture::default()
            .with_item(item)
            .with_payments(vec![])
            .call_and_assert(Err(Error::<Test>::PaymentProofVerificationFailed.into()))
    })
}

#[test]
fn unsuccessful_claim_and_withdraw_with_no_commitment() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        ClaimAndWithdrawChannelRewardFixture::default()
            .call_and_assert(Err(Error::<Test>::PaymentProofVerificationFailed.into()))
    })
}

#[test]
fn unsuccessful_claim_and_withdraw_cashouts_disabled() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();
        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);

        UpdateChannelPayoutsFixture::default()
            .with_channel_cashouts_enabled(Some(false))
            .call_and_assert(Ok(()));

        ClaimAndWithdrawChannelRewardFixture::default()
            .with_payments(payments.clone())
            .call_and_assert(Err(Error::<Test>::ChannelCashoutsDisabled.into()));
    })
}

#[test]
fn unsuccessful_claim_and_withdraw_double_spend() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();
        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);

        ClaimAndWithdrawChannelRewardFixture::default()
            .with_payments(payments.clone())
            .call_and_assert(Ok(()));

        // claim and withdraw
        ClaimAndWithdrawChannelRewardFixture::default()
            .with_payments(payments.clone())
            .call_and_assert(Err(Error::<Test>::CashoutAmountBelowMinimumAmount.into()));

        // claim only
        ClaimChannelRewardFixture::default()
            .with_payments(payments.clone())
            .call_and_assert(Err(Error::<Test>::CashoutAmountBelowMinimumAmount.into()));

        // withdraw only
        WithdrawFromChannelBalanceFixture::default().call_and_assert(Err(
            Error::<Test>::WithdrawFromChannelAmountExceedsBalance.into(),
        ))
    })
}

#[test]
fn successful_claim_and_withdraw_to_custom_destination() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();
        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);

        ClaimAndWithdrawChannelRewardFixture::default()
            .with_payments(payments.clone())
            .with_destination(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_multiple_claims_and_withdrawals_when_reward_updated() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();
        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);

        ClaimAndWithdrawChannelRewardFixture::default()
            .with_payments(payments.clone())
            .call_and_assert(Ok(()));

        let payments2 = create_some_pull_payments_helper_with_rewards(DEFAULT_PAYOUT_EARNED * 2);
        update_commit_value_with_payments_helper(&payments2);

        ClaimAndWithdrawChannelRewardFixture::default()
            .with_payments(payments2.clone())
            .with_item(payments2[DEFAULT_PROOF_INDEX])
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessfull_channel_payouts_update_with_invalid_origin() {
    with_default_mock_builder(|| {
        run_to_block(1);

        increase_account_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);

        UpdateChannelPayoutsFixture::default()
            .with_origin(Origin::signed(LEAD_ACCOUNT_ID))
            .call_and_assert(Err(DispatchError::BadOrigin));

        UpdateChannelPayoutsFixture::default()
            .with_origin(Origin::none())
            .call_and_assert(Err(DispatchError::BadOrigin));
    })
}

#[test]
fn unsuccessfull_channel_payouts_update_with_insufficient_uploader_account_balance() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let payload_params = ChannelPayoutsPayloadParameters::<Test> {
            expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
            object_creation_params: DataObjectCreationParameters {
                size: 1,
                ipfs_content_id: vec![1],
            },
            uploader_account: DEFAULT_MEMBER_ACCOUNT_ID,
        };

        UpdateChannelPayoutsFixture::default()
            .with_payload(Some(payload_params))
            .call_and_assert(Err(storage::Error::<Test>::InsufficientBalance.into()));
    })
}

#[test]
fn unsuccessfull_channel_payouts_update_with_unexpected_data_size_fee() {
    with_default_mock_builder(|| {
        run_to_block(1);

        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        let payload_params = ChannelPayoutsPayloadParameters::<Test> {
            expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee()
                .saturating_add(One::one()),
            object_creation_params: DataObjectCreationParameters {
                size: 1,
                ipfs_content_id: vec![1],
            },
            uploader_account: DEFAULT_MEMBER_ACCOUNT_ID,
        };

        UpdateChannelPayoutsFixture::default()
            .with_payload(Some(payload_params))
            .call_and_assert(Err(storage::Error::<Test>::DataSizeFeeChanged.into()));
    })
}

#[test]
fn unsuccessfull_channel_payouts_update_min_cashout_exceeds_max_cashout() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let current_min_cashout = Content::min_cashout_allowed();
        let current_max_cashout = Content::max_cashout_allowed();

        UpdateChannelPayoutsFixture::default()
            .with_min_cashout_allowed(Some(current_min_cashout.saturating_add(1)))
            .with_max_cashout_allowed(Some(current_min_cashout))
            .call_and_assert(Err(
                Error::<Test>::MinCashoutAllowedExceedsMaxCashoutAllowed.into(),
            ));

        UpdateChannelPayoutsFixture::default()
            .with_min_cashout_allowed(Some(current_max_cashout.saturating_add(1)))
            .call_and_assert(Err(
                Error::<Test>::MinCashoutAllowedExceedsMaxCashoutAllowed.into(),
            ));

        UpdateChannelPayoutsFixture::default()
            .with_max_cashout_allowed(Some(current_min_cashout.saturating_sub(1)))
            .call_and_assert(Err(
                Error::<Test>::MinCashoutAllowedExceedsMaxCashoutAllowed.into(),
            ));
    })
}

#[test]
fn successful_channel_payouts_update() {
    with_default_mock_builder(|| {
        run_to_block(1);

        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);

        let payments = create_some_pull_payments_helper();
        let merkle_root = generate_merkle_root_helper(&payments).pop().unwrap();
        let payload_params = ChannelPayoutsPayloadParameters::<Test> {
            expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
            object_creation_params: DataObjectCreationParameters {
                size: 1,
                ipfs_content_id: vec![1],
            },
            uploader_account: DEFAULT_MEMBER_ACCOUNT_ID,
        };

        UpdateChannelPayoutsFixture::default()
            .with_commitment(Some(merkle_root))
            .with_min_cashout_allowed(Some(0))
            .with_max_cashout_allowed(Some(1))
            .with_channel_cashouts_enabled(Some(false))
            .with_payload(Some(payload_params))
            .call_and_assert(Ok(()));
    })
}
