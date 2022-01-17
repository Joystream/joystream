#![cfg(test)]

use super::fixtures::*;
use super::mock::*;
use crate::*;

#[test]
fn update_maximum_reward_allowed() {
    with_default_mock_builder(|| {
        run_to_block(1);
        let new_amount = BalanceOf::<Test>::from(2_000u32);
        let origin = Origin::signed(LEAD_ACCOUNT_ID);
        let _res = Content::update_max_reward_allowed(origin, new_amount);
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::MaxRewardUpdated(new_amount))
        );
    })
}

#[test]
fn update_minimum_cashout_allowed() {
    with_default_mock_builder(|| {
        run_to_block(1);
        let new_amount = BalanceOf::<Test>::from(10u32);
        let origin = Origin::signed(LEAD_ACCOUNT_ID);
        let _res = Content::update_min_cashout_allowed(origin, new_amount);
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::MinCashoutUpdated(new_amount))
        );
    })
}

#[test]
fn update_commitment_value() {
    with_default_mock_builder(|| {
        run_to_block(1);
        let origin = Origin::signed(LEAD_ACCOUNT_ID);
        let commit = TestHashing::hash(&2.encode());
        let _res = Content::update_commitment(origin, commit);
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::CommitmentUpdated(commit))
        );
    })
}

#[test]
fn update_commitment_with_same_value() {
    with_default_mock_builder(|| {
        let mut commit = TestHashing::hash(&1.encode());
        let origin = Origin::signed(LEAD_ACCOUNT_ID);
        let mut _res = Content::update_commitment(origin, commit);
        run_to_block(1);
        commit = TestHashing::hash(&1.encode());
        _res = Content::update_commitment(Origin::root(), commit);
        assert_eq!(System::events().last(), None);
    })
}

fn setup_channels_scenario(
    num_channels: u64,
    payments_params: &Vec<(u64, BalanceOf<Test>)>,
) -> (Vec<PullPayment<Test>>, Vec<TestHash>) {
    // create payment elements collection
    // create channels

    for _i in 0..num_channels {
        let _ = Content::create_channel(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            ChannelCreationParameters::<Test> {
                assets: None,
                meta: None,
                reward_account: Some(DEFAULT_MEMBER_ACCOUNT_ID),
                collaborators: BTreeSet::new(),
                moderator_set: BTreeSet::new(),
            },
        );
    }

    let pull_payments_collection: Vec<PullPayment<Test>> = payments_params
        .iter()
        .map(|&(c_id, amnt)| PullPayment::<Test> {
            channel_id: ChannelId::from(c_id),
            amount_earned: BalanceOf::<Test>::from(amnt),
            reason: TestHashing::hash(&c_id.encode()),
        })
        .collect::<Vec<PullPayment<Test>>>();

    // generate hash tree and get its root
    let hash_tree = generate_merkle_root(&pull_payments_collection).unwrap();
    let merkle_root = hash_tree.last().copied().unwrap();

    // set the commitment
    let origin = Origin::signed(LEAD_ACCOUNT_ID);
    let mut _res = Content::update_commitment(origin, merkle_root);
    (pull_payments_collection, hash_tree)
}

fn setup_candidate_proof(
    pull_payments_collection: &Vec<PullPayment<Test>>,
    hash_tree: &Vec<TestHash>,
    test_params: &(u64, u64, usize),
) -> TestProof<PullPayment<Test>> {
    // construct test pull payment
    let reward_element = PullPayment::<Test> {
        channel_id: ChannelId::from(test_params.0),
        amount_earned: BalanceOf::<Test>::from(test_params.1),
        reason: TestHashing::hash(&test_params.0.encode()),
    };

    // proof setup
    let proof_path = helper_build_merkle_path(pull_payments_collection, test_params.2, hash_tree);
    let proof = TestProof {
        leaf: reward_element,
        path: proof_path,
    };
    proof
}

#[test]
fn channel_reward_update_test() {
    with_default_mock_builder(|| {
        run_to_block(1); // in order to produce events

        // setup test scenario: 2 channels and 3 (valid) pull payment requests
        let num_channels = 2u64;
        let payments_params = vec![
            (0u64, BalanceOf::<Test>::from(1u64)),
            (1u64, BalanceOf::<Test>::from(1u64)),
            (1u64, BalanceOf::<Test>::from(2u64)),
        ];

        let scenario_out = setup_channels_scenario(num_channels, &payments_params);
        let pull_payments_collection = &scenario_out.0;
        let hash_tree = &scenario_out.1;

        // suppose now channel 1 is trying to collect a payment of 2 JOYs
        // last element is the index in the payments_params vector
        let test_params = (1u64, 2u64, 2usize);
        let candidate_proof =
            setup_candidate_proof(&pull_payments_collection, &hash_tree, &test_params);

        // attempt should succeed
        let _res = Content::claim_channel_reward(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            candidate_proof,
            ContentActor::Member(DEFAULT_MEMBER_ID),
        );

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::ChannelRewardUpdated(
                BalanceOf::<Test>::from(test_params.1),
                ChannelId::from(test_params.0),
            ))
        );
    })
}

#[test]
fn non_existing_channel_reward_update_test() {
    with_default_mock_builder(|| {
        run_to_block(1); // in order to produce events

        // setup test scenario: 2 channels and 3 (valid) pull payment requests
        let num_channels = 2u64;
        let payments_params = vec![
            (0u64, BalanceOf::<Test>::from(1u64)),
            (1u64, BalanceOf::<Test>::from(1u64)),
            (5u64, BalanceOf::<Test>::from(2u64)),
        ];

        let scenario_out = setup_channels_scenario(num_channels, &payments_params);
        let pull_payments_collection = &scenario_out.0;
        let hash_tree = &scenario_out.1;

        // suppose now channel 1 is trying to collect a payment of 2 JOYs
        // last element is the index in the payments_params vector
        let test_params = (5u64, 2u64, 2usize);
        let candidate_proof =
            setup_candidate_proof(&pull_payments_collection, &hash_tree, &test_params);

        // attempt should NOT succeed
        let _res = Content::claim_channel_reward(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            candidate_proof,
            ContentActor::Member(DEFAULT_MEMBER_ID),
        );

        assert_ne!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::ChannelRewardUpdated(
                BalanceOf::<Test>::from(test_params.1),
                ChannelId::from(test_params.0),
            ))
        );
    })
}
