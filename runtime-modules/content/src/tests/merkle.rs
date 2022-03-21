#![cfg(test)]
use super::curators::add_curator_to_new_group;
use super::fixtures::*;
use super::mock::*;
use crate::*;

#[test]
fn unsuccessful_reward_update_by_non_lead_account() {
    with_default_mock_builder(|| {
        run_to_block(1);
        UpdateMaximumRewardFixture::default()
            .with_sender(UNAUTHORIZED_LEAD_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()))
    })
}

#[test]
fn successful_reward_update_by_lead_account() {
    with_default_mock_builder(|| {
        run_to_block(1);
        UpdateMaximumRewardFixture::default().call_and_assert(Ok(()))
    })
}

#[test]
fn unsuccessful_cashout_update_by_non_lead_account() {
    with_default_mock_builder(|| {
        run_to_block(1);
        UpdateMinCashoutFixture::default()
            .with_sender(UNAUTHORIZED_LEAD_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()))
    })
}

#[test]
fn successful_cashout_update_by_lead_account() {
    with_default_mock_builder(|| {
        run_to_block(1);
        UpdateMinCashoutFixture::default().call_and_assert(Ok(()))
    })
}

#[test]
fn unsuccessful_commitment_update_by_non_lead_account() {
    with_default_mock_builder(|| {
        run_to_block(1);
        UpdateCommitmentValueFixture::default()
            .with_sender(UNAUTHORIZED_LEAD_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()))
    })
}

#[test]
fn successful_commitment_update_by_lead_account() {
    with_default_mock_builder(|| {
        run_to_block(1);
        UpdateCommitmentValueFixture::default().call_and_assert(Ok(()))
    })
}

#[test]
fn unsuccessful_reward_claim_with_member_auth_failed() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);

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
        create_default_curator_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);

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
        create_default_curator_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);

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
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);

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
        create_default_curator_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);

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
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);

        let item = PullPayment::<Test> {
            channel_id: ChannelId::one(),
            cumulative_payout_claimed: Content::min_cashout_allowed() - 1,
            reason: Hashing::hash_of(&b"reason".to_vec()),
        };
        ClaimChannelRewardFixture::default()
            .with_payments(vec![item.clone()])
            .with_item(item)
            .call_and_assert(Err(Error::<Test>::UnsufficientCashoutAmount.into()))
    })
}

#[test]
fn unsuccessful_reward_claim_with_reward_limit_exceeded() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);

        let item = PullPayment::<Test> {
            channel_id: ChannelId::one(),
            cumulative_payout_claimed: Content::max_reward_allowed() + 1,
            reason: Hashing::hash_of(&b"reason".to_vec()),
        };
        ClaimChannelRewardFixture::default()
            .with_payments(vec![item.clone()])
            .with_item(item)
            .call_and_assert(Err(Error::<Test>::TotalRewardLimitExceeded.into()))
    })
}

#[test]
fn unsuccessful_reward_claim_with_invalid_channel_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);

        let item = PullPayment::<Test> {
            channel_id: ChannelId::zero(),
            cumulative_payout_claimed: BalanceOf::<Test>::one(),
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
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);

        let item = PullPayment::<Test> {
            channel_id: ChannelId::one(),
            cumulative_payout_claimed: BalanceOf::<Test>::from(DEFAULT_PAYOUT_CLAIMED + 1),
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
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);

        let item = PullPayment::<Test> {
            channel_id: ChannelId::one(),
            cumulative_payout_claimed: BalanceOf::<Test>::from(DEFAULT_PAYOUT_CLAIMED + 1),
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
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);
        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);

        ClaimChannelRewardFixture::default()
            .with_payments(payments)
            .call_and_assert(Ok(()))
    })
}

#[test]
fn unsuccessful_reward_claim_with_pending_channel_transfer() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);
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
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);
        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);

        UpdateChannelTransferStatusFixture::default()
            .with_transfer_status_by_member_id(DEFAULT_MEMBER_ID)
            .call_and_assert(Ok(()));

        ClaimChannelRewardFixture::default()
            .with_payments(payments)
            .call_and_assert(Err(Error::<Test>::InvalidChannelTransferStatus.into()));
    })
}

#[test]
fn successful_reward_claim_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);
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
fn unsuccessful_reward_claim_with_no_commitment_value_outstanding() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);
        let payments = create_some_pull_payments_helper();

        ClaimChannelRewardFixture::default()
            .with_payments(payments)
            .call_and_assert(Err(Error::<Test>::PaymentProofVerificationFailed.into()))
    })
}

#[test]
fn unsuccessful_reward_claim_with_successive_request() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);
        let payments = create_some_pull_payments_helper();
        update_commit_value_with_payments_helper(&payments);

        ClaimChannelRewardFixture::default()
            .with_payments(payments.clone())
            .call_and_assert(Ok(()));

        // cashout is 0 now
        ClaimChannelRewardFixture::default()
            .with_payments(payments)
            .call_and_assert(Err(Error::<Test>::UnsufficientCashoutAmount.into()))
    })
}
