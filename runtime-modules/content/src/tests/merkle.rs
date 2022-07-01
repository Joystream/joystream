#![cfg(test)]
use super::fixtures::*;
use super::mock::*;
use crate::*;
use common::council::CouncilBudgetManager;
use sp_runtime::DispatchError;

#[test]
fn successful_channel_state_bloat_bond_update_by_lead_account() {
    with_default_mock_builder(|| {
        run_to_block(1);
        UpdateChannelStateBloatBondFixture::default()
            .with_channel_state_bloat_bond(20)
            .call_and_assert(Ok(()))
    })
}

#[test]
fn unsuccessful_channel_state_bloat_bond_update_by_non_lead_account() {
    with_default_mock_builder(|| {
        run_to_block(1);
        UpdateChannelStateBloatBondFixture::default()
            .with_sender(UNAUTHORIZED_LEAD_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()))
    })
}

#[test]
fn successful_video_state_bloat_bond_update_by_lead_account() {
    with_default_mock_builder(|| {
        run_to_block(1);
        UpdateVideoStateBloatBondFixture::default()
            .with_video_state_bloat_bond(20)
            .call_and_assert(Ok(()))
    })
}

#[test]
fn unsuccessful_video_state_bloat_bond_update_by_non_lead_account() {
    with_default_mock_builder(|| {
        run_to_block(1);
        UpdateVideoStateBloatBondFixture::default()
            .with_sender(UNAUTHORIZED_LEAD_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()))
    })
}

#[test]
fn unsuccessful_reward_claim_with_unsufficient_cashout() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();

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
        ContentTest::with_member_channel().setup();

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
        ContentTest::with_member_channel().setup();

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
        ContentTest::with_member_channel().setup();
        <Test as Config>::CouncilBudgetManager::set_budget(DEFAULT_PAYOUT_CLAIMED + 1);

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
        ContentTest::with_member_channel().setup();
        <Test as Config>::CouncilBudgetManager::set_budget(DEFAULT_PAYOUT_CLAIMED);

        let item = PullPayment::<Test> {
            channel_id: ChannelId::one(),
            cumulative_reward_earned: BalanceOf::<Test>::from(DEFAULT_PAYOUT_CLAIMED),
            reason: Hashing::hash_of(&b"reason".to_vec()),
        };
        ClaimChannelRewardFixture::default()
            .with_item(item)
            .with_payments(vec![])
            .call_and_assert(Err(Error::<Test>::PaymentProofVerificationFailed.into()))
    })
}

#[test]
fn unsuccessful_reward_claim_with_pending_channel_transfer() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_claimable_reward()
            .setup();
        UpdateChannelTransferStatusFixture::default()
            .with_new_member_channel_owner(SECOND_MEMBER_ID)
            .call_and_assert(Ok(()));
        ClaimChannelRewardFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidChannelTransferStatus.into()));
    })
}

#[test]
fn unsuccessful_reward_claim_with_no_commitment_value_outstanding() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        let payments = create_some_pull_payments_helper();
        <Test as Config>::CouncilBudgetManager::set_budget(DEFAULT_PAYOUT_CLAIMED);

        ClaimChannelRewardFixture::default()
            .with_payments(payments)
            .call_and_assert(Err(Error::<Test>::PaymentProofVerificationFailed.into()))
    })
}

#[test]
fn unsuccessful_reward_claim_cashouts_disabled() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_claimable_reward()
            .setup();

        UpdateChannelPayoutsFixture::default()
            .with_channel_cashouts_enabled(Some(false))
            .call_and_assert(Ok(()));

        ClaimChannelRewardFixture::default()
            .call_and_assert(Err(Error::<Test>::ChannelCashoutsDisabled.into()));
    })
}

#[test]
fn unsuccessful_reward_claim_with_successive_request() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_claimable_reward()
            .setup();

        ClaimChannelRewardFixture::default().call_and_assert(Ok(()));

        // cashout is 0 now
        ClaimChannelRewardFixture::default()
            .call_and_assert(Err(Error::<Test>::CashoutAmountBelowMinimumAmount.into()))
    })
}

#[test]
fn successful_reward_claim_with_successive_request_when_reward_increased() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_claimable_reward()
            .setup();
        <Test as Config>::CouncilBudgetManager::set_budget(DEFAULT_PAYOUT_CLAIMED * 2);

        ClaimChannelRewardFixture::default().call_and_assert(Ok(()));

        // update commit (double channel's reward)
        let payments2 = create_some_pull_payments_helper_with_rewards(DEFAULT_PAYOUT_EARNED * 2);
        update_commit_value_with_payments_helper(&payments2);

        ClaimChannelRewardFixture::default()
            .with_payments(payments2.clone())
            .with_item(payments2[DEFAULT_PROOF_INDEX])
            .call_and_assert(Ok(()))
    })
}

#[test]
fn unsuccessful_reward_claim_with_insufficient_council_budget() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_claimable_reward()
            .setup();
        <Test as Config>::CouncilBudgetManager::set_budget(DEFAULT_PAYOUT_CLAIMED - 1);

        ClaimChannelRewardFixture::default()
            .call_and_assert(Err(Error::<Test>::InsufficientCouncilBudget.into()));
    })
}

#[test]
fn unsuccessful_channel_reward_claim_by_curator_agent_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_claimable_reward()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ClaimChannelReward])
            .setup();
        ClaimChannelRewardFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_channel_reward_claim_when_creator_cashouts_paused() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_claimable_reward()
            .setup();
        SetChannelPausedFeaturesAsModeratorFixture::default()
            .with_new_paused_features(
                [PausableChannelFeature::CreatorCashout]
                    .iter()
                    .cloned()
                    .collect(),
            )
            .call_and_assert(Ok(()));
        ClaimChannelRewardFixture::default()
            .call_and_assert(Err(Error::<Test>::ChannelFeaturePaused.into()));
    })
}

#[test]
fn successful_channel_reward_claim_by_curator_agent() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_claimable_reward()
            .with_agent_permissions(&[ChannelActionPermission::ClaimChannelReward])
            .setup();
        ClaimChannelRewardFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_channel_reward_claim_by_lead() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_claimable_reward()
            .setup();
        ClaimChannelRewardFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_channel_reward_claim_by_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_claimable_reward()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ClaimChannelReward])
            .setup();
        ClaimChannelRewardFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_channel_reward_claim_by_collaborator() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_claimable_reward()
            .with_agent_permissions(&[ChannelActionPermission::ClaimChannelReward])
            .setup();
        ClaimChannelRewardFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_channel_reward_claim_by_owner_member() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_claimable_reward()
            .setup();
        ClaimChannelRewardFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Ok(()));
    })
}

/// Withdrawals
#[test]
fn unsuccessful_channel_balance_withdrawal_when_amount_exceeds_balance_minus_existential_deposit() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();

        // TODO: Should not be required after https://github.com/Joystream/joystream/issues/3511
        make_channel_account_existential_deposit(ChannelId::one());

        WithdrawFromChannelBalanceFixture::default().call_and_assert(Err(
            Error::<Test>::WithdrawFromChannelAmountExceedsBalanceMinusExistentialDeposit.into(),
        ));
    })
}

#[test]
fn unsuccessful_channel_balance_withdrawal_during_transfer() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        UpdateChannelTransferStatusFixture::default()
            .with_new_member_channel_owner(SECOND_MEMBER_ID)
            .call_and_assert(Ok(()));

        WithdrawFromChannelBalanceFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidChannelTransferStatus.into()));
    })
}

#[test]
fn unsuccessful_channel_balance_withdrawal_when_amount_is_zero() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();

        WithdrawFromChannelBalanceFixture::default()
            .with_amount(0)
            .call_and_assert(Err(Error::<Test>::WithdrawFromChannelAmountIsZero.into()));
    })
}

#[test]
fn unsuccessful_channel_balance_double_spend_withdrawal() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_claimable_reward()
            .setup();

        // TODO: Should not be required after https://github.com/Joystream/joystream/issues/3511
        make_channel_account_existential_deposit(ChannelId::one());

        ClaimChannelRewardFixture::default().call_and_assert(Ok(()));

        WithdrawFromChannelBalanceFixture::default().call_and_assert(Ok(()));
        WithdrawFromChannelBalanceFixture::default().call_and_assert(Err(
            Error::<Test>::WithdrawFromChannelAmountExceedsBalanceMinusExistentialDeposit.into(),
        ));
    })
}

#[test]
fn unsuccessful_channel_balance_withdrawal_invalid_channel_id() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();

        WithdrawFromChannelBalanceFixture::default()
            .with_channel_id(ChannelId::zero())
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()));
    })
}

#[test]
fn unsuccessful_channel_balance_withdrawal_when_creator_token_issued() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));

        increase_account_balance_helper(
            ContentTreasury::<Test>::account_for_channel(ChannelId::one()),
            DEFAULT_PAYOUT_EARNED
                // TODO: Should be changed to bloat_bond after https://github.com/Joystream/joystream/issues/3511
                .saturating_add(<Test as balances::Config>::ExistentialDeposit::get().into()),
        );

        WithdrawFromChannelBalanceFixture::default().call_and_assert(Err(
            Error::<Test>::CannotWithdrawFromChannelWithCreatorTokenIssued.into(),
        ));
    })
}

#[test]
fn successful_channel_balance_multiple_withdrawals() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_claimable_reward()
            .setup();

        // TODO: Should not be required after https://github.com/Joystream/joystream/issues/3511
        make_channel_account_existential_deposit(ChannelId::one());

        ClaimChannelRewardFixture::default().call_and_assert(Ok(()));

        WithdrawFromChannelBalanceFixture::default()
            .with_amount(DEFAULT_PAYOUT_CLAIMED - 1)
            .call_and_assert(Ok(()));

        WithdrawFromChannelBalanceFixture::default()
            .with_amount(1)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_member_channel_balance_withdrawal_collaborator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_all_agent_permissions_except(&[
                ChannelActionPermission::WithdrawFromChannelBalance,
            ])
            .setup();
        WithdrawFromChannelBalanceFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_member_channel_balance_withdrawal_by_collaborator() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_agent_permissions(&[ChannelActionPermission::WithdrawFromChannelBalance])
            .setup();
        increase_account_balance_helper(
            ContentTreasury::<Test>::account_for_channel(ChannelId::one()),
            DEFAULT_PAYOUT_EARNED
                // TODO: Should be changed to bloat_bond after https://github.com/Joystream/joystream/issues/3511
                .saturating_add(<Test as balances::Config>::ExistentialDeposit::get().into()),
        );
        WithdrawFromChannelBalanceFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_member_channel_balance_withdrawal_by_owner() {
    with_default_mock_builder(|| {
        run_to_block(1);
        ContentTest::with_member_channel().setup();
        increase_account_balance_helper(
            ContentTreasury::<Test>::account_for_channel(ChannelId::one()),
            DEFAULT_PAYOUT_EARNED
                // TODO: Should be changed to bloat_bond after https://github.com/Joystream/joystream/issues/3511
                .saturating_add(<Test as balances::Config>::ExistentialDeposit::get().into()),
        );
        WithdrawFromChannelBalanceFixture::default().call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_curator_channel_balance_withdrawal_by_curator_without_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_all_agent_permissions_except(&[
                ChannelActionPermission::WithdrawFromChannelBalance,
            ])
            .setup();
        WithdrawFromChannelBalanceFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_curator_channel_balance_withdrawal_by_curator() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_agent_permissions(&[ChannelActionPermission::WithdrawFromChannelBalance])
            .setup();
        increase_account_balance_helper(
            ContentTreasury::<Test>::account_for_channel(ChannelId::one()),
            DEFAULT_PAYOUT_EARNED
                // TODO: Should be changed to bloat_bond after https://github.com/Joystream/joystream/issues/3511
                .saturating_add(<Test as balances::Config>::ExistentialDeposit::get().into()),
        );
        WithdrawFromChannelBalanceFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_curator_channel_balance_withdrawal_by_lead() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel().setup();
        increase_account_balance_helper(
            ContentTreasury::<Test>::account_for_channel(ChannelId::one()),
            DEFAULT_PAYOUT_EARNED
                // TODO: Should be changed to bloat_bond after https://github.com/Joystream/joystream/issues/3511
                .saturating_add(<Test as balances::Config>::ExistentialDeposit::get().into()),
        );
        WithdrawFromChannelBalanceFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_channel_balance_withdrawal_with_fund_transfer_feature_paused() {
    with_default_mock_builder(|| {
        run_to_block(1);
        ContentTest::with_member_channel().setup();
        increase_account_balance_helper(
            ContentTreasury::<Test>::account_for_channel(ChannelId::one()),
            DEFAULT_PAYOUT_EARNED
                // TODO: Should be changed to bloat_bond after https://github.com/Joystream/joystream/issues/3511
                .saturating_add(<Test as balances::Config>::ExistentialDeposit::get().into()),
        );
        pause_channel_feature(1u64, PausableChannelFeature::ChannelFundsTransfer);

        WithdrawFromChannelBalanceFixture::default()
            .call_and_assert(Err(Error::<Test>::ChannelFeaturePaused.into()));
    })
}

/// Claim&Withdraw

#[test]
fn unsuccessful_claim_and_withdraw_with_unsufficient_cashout() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();

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
        ContentTest::with_member_channel().setup();

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
        ContentTest::with_member_channel().setup();

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
        ContentTest::with_member_channel()
            .with_claimable_reward()
            .setup();

        <Test as Config>::CouncilBudgetManager::set_budget(DEFAULT_PAYOUT_CLAIMED + 1);

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
        ContentTest::with_member_channel()
            .with_claimable_reward()
            .setup();

        let item = PullPayment::<Test> {
            channel_id: ChannelId::one(),
            cumulative_reward_earned: BalanceOf::<Test>::from(DEFAULT_PAYOUT_CLAIMED),
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
        ContentTest::with_member_channel().setup();
        <Test as Config>::CouncilBudgetManager::set_budget(DEFAULT_PAYOUT_CLAIMED);

        ClaimAndWithdrawChannelRewardFixture::default()
            .call_and_assert(Err(Error::<Test>::PaymentProofVerificationFailed.into()))
    })
}

#[test]
fn unsuccessful_claim_and_withdraw_cashouts_disabled() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_claimable_reward()
            .setup();

        UpdateChannelPayoutsFixture::default()
            .with_channel_cashouts_enabled(Some(false))
            .call_and_assert(Ok(()));

        ClaimAndWithdrawChannelRewardFixture::default()
            .call_and_assert(Err(Error::<Test>::ChannelCashoutsDisabled.into()));
    })
}

#[test]
fn unsuccessful_claim_and_withdraw_double_spend() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_claimable_reward()
            .setup();

        // TODO: Should not be required after https://github.com/Joystream/joystream/issues/3511
        make_channel_account_existential_deposit(ChannelId::one());

        ClaimAndWithdrawChannelRewardFixture::default().call_and_assert(Ok(()));

        // claim and withdraw
        ClaimAndWithdrawChannelRewardFixture::default()
            .call_and_assert(Err(Error::<Test>::CashoutAmountBelowMinimumAmount.into()));

        // claim only
        ClaimChannelRewardFixture::default()
            .call_and_assert(Err(Error::<Test>::CashoutAmountBelowMinimumAmount.into()));

        // withdraw only
        WithdrawFromChannelBalanceFixture::default().call_and_assert(Err(
            Error::<Test>::WithdrawFromChannelAmountExceedsBalanceMinusExistentialDeposit.into(),
        ))
    })
}

#[test]
fn unsuccessful_claim_and_withdraw_insufficient_council_budget() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_claimable_reward()
            .setup();
        <Test as Config>::CouncilBudgetManager::set_budget(DEFAULT_PAYOUT_CLAIMED - 1);

        ClaimAndWithdrawChannelRewardFixture::default()
            .call_and_assert(Err(Error::<Test>::InsufficientCouncilBudget.into()));
    })
}

#[test]
fn successful_multiple_claims_and_withdrawals_when_reward_updated() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);
        <Test as Config>::CouncilBudgetManager::set_budget(DEFAULT_PAYOUT_CLAIMED * 2);

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
fn unsuccessful_member_channel_claim_and_withdraw_by_collaborator_without_claim_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ClaimChannelReward])
            .setup();
        ClaimAndWithdrawChannelRewardFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_member_channel_claim_and_withdraw_by_collaborator_without_withdrawal_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_all_agent_permissions_except(&[
                ChannelActionPermission::WithdrawFromChannelBalance,
            ])
            .with_claimable_reward()
            .setup();
        ClaimAndWithdrawChannelRewardFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn claim_and_withdraw_fails_during_channel_transfer() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_claimable_reward()
            .setup();

        UpdateChannelTransferStatusFixture::default()
            .with_new_member_channel_owner(SECOND_MEMBER_ID)
            .call_and_assert(Ok(()));

        ClaimAndWithdrawChannelRewardFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidChannelTransferStatus.into()));
    })
}

#[test]
fn unsuccessful_member_claim_and_withdraw_with_cashout_feature_paused() {
    with_default_mock_builder(|| {
        let channel_id = Content::next_channel_id();
        ContentTest::with_member_channel()
            .with_claimable_reward()
            .setup();
        pause_channel_feature(channel_id, PausableChannelFeature::CreatorCashout);

        ClaimAndWithdrawChannelRewardFixture::default()
            .call_and_assert(Err(Error::<Test>::ChannelFeaturePaused.into()));
    })
}

#[test]
fn unsuccessful_member_claim_and_withdraw_with_transfer_fund_feature_paused() {
    with_default_mock_builder(|| {
        let channel_id = Content::next_channel_id();
        ContentTest::with_member_channel()
            .with_claimable_reward()
            .setup();
        pause_channel_feature(channel_id, PausableChannelFeature::ChannelFundsTransfer);

        ClaimAndWithdrawChannelRewardFixture::default()
            .call_and_assert(Err(Error::<Test>::ChannelFeaturePaused.into()));
    })
}

#[test]
fn successful_member_channel_claim_and_withdraw_by_collaborator() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_agent_permissions(&[
                ChannelActionPermission::WithdrawFromChannelBalance,
                ChannelActionPermission::ClaimChannelReward,
            ])
            .with_claimable_reward()
            .setup();
        ClaimAndWithdrawChannelRewardFixture::default()
            .with_sender(COLLABORATOR_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(COLLABORATOR_MEMBER_ID))
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_member_channel_claim_and_withdraw_by_owner() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel()
            .with_claimable_reward()
            .setup();
        ClaimAndWithdrawChannelRewardFixture::default().call_and_assert(Ok(()));
    })
}

#[test]
fn unsuccessful_curator_channel_claim_and_withdraw_by_curator_without_cliam_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_all_agent_permissions_except(&[ChannelActionPermission::ClaimChannelReward])
            .setup();
        ClaimAndWithdrawChannelRewardFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn unsuccessful_curator_channel_claim_and_withdraw_by_curator_without_withdrawal_permissions() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_all_agent_permissions_except(&[
                ChannelActionPermission::WithdrawFromChannelBalance,
            ])
            .with_claimable_reward()
            .setup();
        ClaimAndWithdrawChannelRewardFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Err(
                Error::<Test>::ChannelAgentInsufficientPermissions.into()
            ));
    })
}

#[test]
fn successful_curator_channel_claim_and_withdraw_by_curator() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_agent_permissions(&[
                ChannelActionPermission::WithdrawFromChannelBalance,
                ChannelActionPermission::ClaimChannelReward,
            ])
            .with_claimable_reward()
            .setup();
        ClaimAndWithdrawChannelRewardFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(default_curator_actor())
            .call_and_assert(Ok(()));
    })
}

#[test]
fn successful_curator_channel_claim_and_withdraw_by_lead() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_claimable_reward()
            .setup();
        ClaimAndWithdrawChannelRewardFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()));
    })
}

// Channel payouts update

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

        storage::DataObjectStateBloatBondValue::<Test>::put(1);

        let payload_params = ChannelPayoutsPayloadParameters::<Test> {
            expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
            expected_data_object_state_bloat_bond:
                Storage::<Test>::data_object_state_bloat_bond_value(),
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
            expected_data_object_state_bloat_bond:
                Storage::<Test>::data_object_state_bloat_bond_value(),
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
fn unsuccessfull_channel_payouts_update_with_unexpected_data_object_state_bloat_bond() {
    with_default_mock_builder(|| {
        run_to_block(1);

        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        let payload_params = ChannelPayoutsPayloadParameters::<Test> {
            expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
            expected_data_object_state_bloat_bond:
                Storage::<Test>::data_object_state_bloat_bond_value().saturating_add(1),
            object_creation_params: DataObjectCreationParameters {
                size: 1,
                ipfs_content_id: vec![1],
            },
            uploader_account: DEFAULT_MEMBER_ACCOUNT_ID,
        };

        UpdateChannelPayoutsFixture::default()
            .with_payload(Some(payload_params))
            .call_and_assert(Err(
                storage::Error::<Test>::DataObjectStateBloatBondChanged.into()
            ));
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

        // TODO: Should not be required after https://github.com/Joystream/joystream/issues/3510
        make_storage_module_account_existential_deposit();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);

        let payments = create_some_pull_payments_helper();
        let merkle_root = generate_merkle_root_helper(&payments).pop().unwrap();
        let payload_params = ChannelPayoutsPayloadParameters::<Test> {
            expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
            expected_data_object_state_bloat_bond:
                Storage::<Test>::data_object_state_bloat_bond_value(),
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
