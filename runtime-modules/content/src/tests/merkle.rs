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

        let default_curator_group_id = Content::next_curator_group_id() - 1;
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
        create_default_member_owned_channel_with_video();

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

// fn setup_channels_scenario(
//     num_channels: u64,
//     payments_params: &Vec<(u64, BalanceOf<Test>)>,
// ) -> (Vec<PullPayment<Test>>, Vec<TestHash>) {
//     // create payment elements collection
//     // create channels

//     for _i in 0..num_channels {
//         let _ = Content::create_channel(
//             Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
//             ContentActor::Member(DEFAULT_MEMBER_ID),
//             ChannelCreationParameters::<Test> {
//                 assets: None,
//                 meta: None,
//                 reward_account: Some(DEFAULT_MEMBER_ACCOUNT_ID),
//                 collaborators: BTreeSet::new(),
//                 moderator_set: BTreeSet::new(),
//             },
//         );
//     }

//     let pull_payments_collection: Vec<PullPayment<Test>> = payments_params
//         .iter()
//         .map(|&(c_id, amnt)| PullPayment::<Test> {
//             channel_id: ChannelId::from(c_id),
//             amount_earned: BalanceOf::<Test>::from(amnt),
//             reason: TestHashing::hash(&c_id.encode()),
//         })
//         .collect::<Vec<PullPayment<Test>>>();

//     // generate hash tree and get its root
//     let hash_tree = generate_merkle_root(&pull_payments_collection).unwrap();
//     let merkle_root = hash_tree.last().copied().unwrap();

//     // set the commitment
//     let origin = Origin::signed(LEAD_ACCOUNT_ID);
//     let mut _res = Content::update_commitment(origin, merkle_root);
//     (pull_payments_collection, hash_tree)
// }

// fn setup_candidate_proof(
//     pull_payments_collection: &Vec<PullPayment<Test>>,
//     hash_tree: &Vec<TestHash>,
//     test_params: &(u64, u64, usize),
// ) -> TestProof<PullPayment<Test>> {
//     // construct test pull payment
//     let reward_element = PullPayment::<Test> {
//         channel_id: ChannelId::from(test_params.0),
//         amount_earned: BalanceOf::<Test>::from(test_params.1),
//         reason: TestHashing::hash(&test_params.0.encode()),
//     };

//     // proof setup
//     let proof_path = helper_build_merkle_path(pull_payments_collection, test_params.2, hash_tree);
//     let proof = TestProof {
//         leaf: reward_element,
//         path: proof_path,
//     };
//     proof
// }

// #[test]
// fn channel_reward_update_test() {
//     with_default_mock_builder(|| {
//         run_to_block(1); // in order to produce events

//         // setup test scenario: 2 channels and 3 (valid) pull payment requests
//         let num_channels = 2u64;
//         let payments_params = vec![
//             (0u64, BalanceOf::<Test>::from(1u64)),
//             (1u64, BalanceOf::<Test>::from(1u64)),
//             (1u64, BalanceOf::<Test>::from(2u64)),
//         ];

//         let scenario_out = setup_channels_scenario(num_channels, &payments_params);
//         let pull_payments_collection = &scenario_out.0;
//         let hash_tree = &scenario_out.1;

//         // suppose now channel 1 is trying to collect a payment of 2 JOYs
//         // last element is the index in the payments_params vector
//         let test_params = (1u64, 2u64, 2usize);
//         let candidate_proof =
//             setup_candidate_proof(&pull_payments_collection, &hash_tree, &test_params);

//         // attempt should succeed
//         let _res = Content::claim_channel_reward(
//             Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
//             candidate_proof,
//             ContentActor::Member(DEFAULT_MEMBER_ID),
//         );

//         assert_eq!(
//             System::events().last().unwrap().event,
//             MetaEvent::content(RawEvent::ChannelRewardUpdated(
//                 BalanceOf::<Test>::from(test_params.1),
//                 ChannelId::from(test_params.0),
//             ))
//         );
//     })
// }

// #[test]
// fn non_existing_channel_reward_update_test() {
//     with_default_mock_builder(|| {
//         run_to_block(1); // in order to produce events

//         // setup test scenario: 2 channels and 3 (valid) pull payment requests
//         let num_channels = 2u64;
//         let payments_params = vec![
//             (0u64, BalanceOf::<Test>::from(1u64)),
//             (1u64, BalanceOf::<Test>::from(1u64)),
//             (5u64, BalanceOf::<Test>::from(2u64)),
//         ];

//         let scenario_out = setup_channels_scenario(num_channels, &payments_params);
//         let pull_payments_collection = &scenario_out.0;
//         let hash_tree = &scenario_out.1;

//         // suppose now channel 1 is trying to collect a payment of 2 JOYs
//         // last element is the index in the payments_params vector
//         let test_params = (5u64, 2u64, 2usize);
//         let candidate_proof =
//             setup_candidate_proof(&pull_payments_collection, &hash_tree, &test_params);

//         // attempt should NOT succeed
//         let _res = Content::claim_channel_reward(
//             Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
//             candidate_proof,
//             ContentActor::Member(DEFAULT_MEMBER_ID),
//         );

//         assert_ne!(
//             System::events().last().unwrap().event,
//             MetaEvent::content(RawEvent::ChannelRewardUpdated(
//                 BalanceOf::<Test>::from(test_params.1),
//                 ChannelId::from(test_params.0),
//             ))
//         );
//     })
// }
