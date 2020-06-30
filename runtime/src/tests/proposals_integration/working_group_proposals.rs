use super::*;

use srml_support::StorageLinkedMap;
use system::RawOrigin;

use common::working_group::WorkingGroup;
use hiring::ActivateOpeningAt;
use proposals_codex::AddOpeningParameters;
use working_group::{OpeningPolicyCommitment, RewardPolicy};

use crate::{Balance, BlockNumber, StorageWorkingGroupInstance};
use rstd::collections::btree_set::BTreeSet;

type StorageWorkingGroup = working_group::Module<Runtime, StorageWorkingGroupInstance>;

type Hiring = hiring::Module<Runtime>;

fn add_opening(
    member_id: u8,
    account_id: [u8; 32],
    activate_at: hiring::ActivateOpeningAt<BlockNumber>,
    opening_policy_commitment: Option<OpeningPolicyCommitment<BlockNumber, u128>>,
) -> u64 {
    let opening_id = StorageWorkingGroup::next_opening_id();

    assert!(!<working_group::OpeningById<
        Runtime,
        StorageWorkingGroupInstance,
    >>::exists(opening_id));

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        ProposalCodex::create_add_working_group_leader_opening_proposal(
            RawOrigin::Signed(account_id.clone().into()).into(),
            member_id as u64,
            b"title".to_vec(),
            b"body".to_vec(),
            Some(<BalanceOf<Runtime>>::from(100_000_u32)),
            AddOpeningParameters {
                activate_at: activate_at.clone(),
                commitment: opening_policy_commitment
                    .clone()
                    .unwrap_or(OpeningPolicyCommitment::default()),
                human_readable_text: Vec::new(),
                working_group: WorkingGroup::Storage,
            },
        )
    });

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();

    opening_id
}

fn begin_review_applications(member_id: u8, account_id: [u8; 32], opening_id: u64) {
    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        ProposalCodex::create_begin_review_working_group_leader_applications_proposal(
            RawOrigin::Signed(account_id.clone().into()).into(),
            member_id as u64,
            b"title".to_vec(),
            b"body".to_vec(),
            Some(<BalanceOf<Runtime>>::from(25_000_u32)),
            opening_id,
            WorkingGroup::Storage,
        )
    })
    .disable_setup_enviroment()
    .with_expected_proposal_id(2)
    .with_run_to_block(3);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
}

fn fill_opening(
    member_id: u8,
    account_id: [u8; 32],
    opening_id: u64,
    successful_application_id: u64,
    reward_policy: Option<RewardPolicy<Balance, BlockNumber>>,
) {
    let mut expected_proposal_id = 3;
    let mut run_to_block = 4;
    if reward_policy.is_some() {
        set_mint_capacity(member_id, account_id, 999999);

        expected_proposal_id = 4;
        run_to_block = 5;
    }

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        ProposalCodex::create_fill_working_group_leader_opening_proposal(
            RawOrigin::Signed(account_id.clone().into()).into(),
            member_id as u64,
            b"title".to_vec(),
            b"body".to_vec(),
            Some(<BalanceOf<Runtime>>::from(50_000_u32)),
            proposals_codex::FillOpeningParameters {
                opening_id,
                successful_application_id,
                reward_policy: reward_policy.clone(),
                working_group: WorkingGroup::Storage,
            },
        )
    })
    .disable_setup_enviroment()
    .with_expected_proposal_id(expected_proposal_id)
    .with_run_to_block(run_to_block);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
}

fn get_stake_balance(stake: stake::Stake<BlockNumber, Balance, u64>) -> Balance {
    if let stake::StakingStatus::Staked(stake) = stake.staking_status {
        return stake.staked_amount;
    }

    panic!("Not staked.");
}

fn decrease_stake(
    member_id: u8,
    account_id: [u8; 32],
    leader_worker_id: u64,
    stake_amount: Balance,
) {
    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        ProposalCodex::create_decrease_working_group_leader_stake_proposal(
            RawOrigin::Signed(account_id.clone().into()).into(),
            member_id as u64,
            b"title".to_vec(),
            b"body".to_vec(),
            Some(<BalanceOf<Runtime>>::from(50_000_u32)),
            leader_worker_id,
            stake_amount,
            WorkingGroup::Storage,
        )
    })
    .disable_setup_enviroment()
    .with_expected_proposal_id(4)
    .with_run_to_block(5);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
}

fn slash_stake(member_id: u8, account_id: [u8; 32], leader_worker_id: u64, stake_amount: Balance) {
    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        ProposalCodex::create_slash_working_group_leader_stake_proposal(
            RawOrigin::Signed(account_id.clone().into()).into(),
            member_id as u64,
            b"title".to_vec(),
            b"body".to_vec(),
            Some(<BalanceOf<Runtime>>::from(50_000_u32)),
            leader_worker_id,
            stake_amount,
            WorkingGroup::Storage,
        )
    })
    .disable_setup_enviroment()
    .with_expected_proposal_id(4)
    .with_run_to_block(5);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
}

fn set_reward(member_id: u8, account_id: [u8; 32], leader_worker_id: u64, reward_amount: Balance) {
    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        ProposalCodex::create_set_working_group_leader_reward_proposal(
            RawOrigin::Signed(account_id.clone().into()).into(),
            member_id as u64,
            b"title".to_vec(),
            b"body".to_vec(),
            Some(<BalanceOf<Runtime>>::from(50_000_u32)),
            leader_worker_id,
            reward_amount,
            WorkingGroup::Storage,
        )
    })
    .disable_setup_enviroment()
    .with_expected_proposal_id(5)
    .with_run_to_block(6);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
}

fn set_mint_capacity(member_id: u8, account_id: [u8; 32], mint_capacity: Balance) {
    let mint_id_result = <minting::Module<Runtime>>::add_mint(0, None);

    if let Ok(mint_id) = mint_id_result {
        <working_group::Mint<Runtime, StorageWorkingGroupInstance>>::put(mint_id);
    }

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        ProposalCodex::create_set_working_group_mint_capacity_proposal(
            RawOrigin::Signed(account_id.clone().into()).into(),
            member_id as u64,
            b"title".to_vec(),
            b"body".to_vec(),
            Some(<BalanceOf<Runtime>>::from(50_000_u32)),
            mint_capacity,
            WorkingGroup::Storage,
        )
    })
    .disable_setup_enviroment()
    .with_expected_proposal_id(3)
    .with_run_to_block(4);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
}

#[test]
fn create_add_working_group_leader_opening_proposal_execution_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = 1;
        let account_id: [u8; 32] = [member_id; 32];

        let next_opening_id = StorageWorkingGroup::next_opening_id();

        assert!(!<working_group::OpeningById<
            Runtime,
            StorageWorkingGroupInstance,
        >>::exists(next_opening_id));

        let opening_id = add_opening(member_id, account_id, ActivateOpeningAt::CurrentBlock, None);

        // Check for expected opening id.
        assert_eq!(opening_id, next_opening_id);

        // Check for the new opening creation.
        assert!(<working_group::OpeningById<
            Runtime,
            StorageWorkingGroupInstance,
        >>::exists(opening_id));
    });
}

#[test]
fn create_begin_review_working_group_leader_applications_proposal_execution_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = 1;
        let account_id: [u8; 32] = [member_id; 32];

        let opening_id = add_opening(
            member_id,
            account_id.clone(),
            ActivateOpeningAt::CurrentBlock,
            None,
        );

        let opening = StorageWorkingGroup::opening_by_id(opening_id);

        let hiring_opening = Hiring::opening_by_id(opening.hiring_opening_id);
        assert_eq!(
            hiring_opening.stage,
            hiring::OpeningStage::Active {
                stage: hiring::ActiveOpeningStage::AcceptingApplications {
                    started_accepting_applicants_at_block: 1
                },
                applications_added: BTreeSet::new(),
                active_application_count: 0,
                unstaking_application_count: 0,
                deactivated_application_count: 0
            }
        );

        begin_review_applications(member_id, account_id, opening_id);

        let hiring_opening = Hiring::opening_by_id(opening.hiring_opening_id);
        assert_eq!(
            hiring_opening.stage,
            hiring::OpeningStage::Active {
                stage: hiring::ActiveOpeningStage::ReviewPeriod {
                    started_accepting_applicants_at_block: 1,
                    started_review_period_at_block: 2,
                },
                applications_added: BTreeSet::new(),
                active_application_count: 0,
                unstaking_application_count: 0,
                deactivated_application_count: 0
            }
        );
    });
}

#[test]
fn create_fill_working_group_leader_opening_proposal_execution_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = 1;
        let account_id: [u8; 32] = [member_id; 32];

        let opening_id = add_opening(
            member_id,
            account_id.clone(),
            ActivateOpeningAt::CurrentBlock,
            None,
        );

        let apply_result = StorageWorkingGroup::apply_on_opening(
            RawOrigin::Signed(account_id.clone().into()).into(),
            member_id as u64,
            opening_id,
            account_id.clone().into(),
            None,
            None,
            Vec::new(),
        );

        assert_eq!(apply_result, Ok(()));

        let expected_application_id = 0;

        begin_review_applications(member_id, account_id, opening_id);

        let lead = StorageWorkingGroup::current_lead();
        assert!(lead.is_none());

        fill_opening(
            member_id,
            account_id,
            opening_id,
            expected_application_id,
            None,
        );

        let lead = StorageWorkingGroup::current_lead();
        assert!(lead.is_some());
    });
}

#[test]
fn create_decrease_group_leader_stake_proposal_execution_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = 1;
        let account_id: [u8; 32] = [member_id; 32];
        let stake_amount = 100;

        let opening_policy_commitment = OpeningPolicyCommitment {
            role_staking_policy: Some(hiring::StakingPolicy {
                amount: 100,
                amount_mode: hiring::StakingAmountLimitMode::AtLeast,
                crowded_out_unstaking_period_length: None,
                review_period_expired_unstaking_period_length: None,
            }),
            ..OpeningPolicyCommitment::default()
        };

        let opening_id = add_opening(
            member_id,
            account_id.clone(),
            ActivateOpeningAt::CurrentBlock,
            Some(opening_policy_commitment),
        );

        let apply_result = StorageWorkingGroup::apply_on_opening(
            RawOrigin::Signed(account_id.clone().into()).into(),
            member_id as u64,
            opening_id,
            account_id.clone().into(),
            Some(stake_amount),
            None,
            Vec::new(),
        );

        assert_eq!(apply_result, Ok(()));

        let expected_application_id = 0;

        begin_review_applications(member_id, account_id, opening_id);

        let lead = StorageWorkingGroup::current_lead();
        assert!(lead.is_none());

        fill_opening(
            member_id,
            account_id,
            opening_id,
            expected_application_id,
            None,
        );

        let leader_worker_id = StorageWorkingGroup::current_lead().unwrap();

        let stake_id = 1;
        let old_balance = Balances::free_balance::<&AccountId32>(&account_id.into());
        let old_stake = <stake::Module<Runtime>>::stakes(stake_id);

        assert_eq!(get_stake_balance(old_stake), stake_amount);

        let decreasing_stake_amount = 30;
        decrease_stake(
            member_id,
            account_id,
            leader_worker_id,
            decreasing_stake_amount,
        );

        let new_balance = Balances::free_balance::<&AccountId32>(&account_id.into());
        let new_stake = <stake::Module<Runtime>>::stakes(stake_id);

        assert_eq!(
            get_stake_balance(new_stake),
            stake_amount - decreasing_stake_amount
        );
        assert_eq!(new_balance, old_balance + decreasing_stake_amount);
    });
}

#[test]
fn create_slash_group_leader_stake_proposal_execution_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = 1;
        let account_id: [u8; 32] = [member_id; 32];
        let stake_amount = 100;

        let opening_policy_commitment = OpeningPolicyCommitment {
            role_staking_policy: Some(hiring::StakingPolicy {
                amount: 100,
                amount_mode: hiring::StakingAmountLimitMode::AtLeast,
                crowded_out_unstaking_period_length: None,
                review_period_expired_unstaking_period_length: None,
            }),
            ..OpeningPolicyCommitment::default()
        };

        let opening_id = add_opening(
            member_id,
            account_id.clone(),
            ActivateOpeningAt::CurrentBlock,
            Some(opening_policy_commitment),
        );

        let apply_result = StorageWorkingGroup::apply_on_opening(
            RawOrigin::Signed(account_id.clone().into()).into(),
            member_id as u64,
            opening_id,
            account_id.clone().into(),
            Some(stake_amount),
            None,
            Vec::new(),
        );

        assert_eq!(apply_result, Ok(()));

        let expected_application_id = 0;

        begin_review_applications(member_id, account_id, opening_id);

        let lead = StorageWorkingGroup::current_lead();
        assert!(lead.is_none());

        fill_opening(
            member_id,
            account_id,
            opening_id,
            expected_application_id,
            None,
        );

        let leader_worker_id = StorageWorkingGroup::current_lead().unwrap();

        let stake_id = 1;
        let old_balance = Balances::free_balance::<&AccountId32>(&account_id.into());
        let old_stake = <stake::Module<Runtime>>::stakes(stake_id);

        assert_eq!(get_stake_balance(old_stake), stake_amount);

        let slashing_stake_amount = 30;
        slash_stake(
            member_id,
            account_id,
            leader_worker_id,
            slashing_stake_amount,
        );

        let new_balance = Balances::free_balance::<&AccountId32>(&account_id.into());
        let new_stake = <stake::Module<Runtime>>::stakes(stake_id);

        assert_eq!(
            get_stake_balance(new_stake),
            stake_amount - slashing_stake_amount
        );
        assert_eq!(new_balance, old_balance);
    });
}

#[test]
fn create_set_group_leader_reward_proposal_execution_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = 1;
        let account_id: [u8; 32] = [member_id; 32];
        let stake_amount = 100;

        let opening_policy_commitment = OpeningPolicyCommitment {
            role_staking_policy: Some(hiring::StakingPolicy {
                amount: 100,
                amount_mode: hiring::StakingAmountLimitMode::AtLeast,
                crowded_out_unstaking_period_length: None,
                review_period_expired_unstaking_period_length: None,
            }),
            ..OpeningPolicyCommitment::default()
        };

        let opening_id = add_opening(
            member_id,
            account_id.clone(),
            ActivateOpeningAt::CurrentBlock,
            Some(opening_policy_commitment),
        );

        let apply_result = StorageWorkingGroup::apply_on_opening(
            RawOrigin::Signed(account_id.clone().into()).into(),
            member_id as u64,
            opening_id,
            account_id.clone().into(),
            Some(stake_amount),
            None,
            Vec::new(),
        );

        assert_eq!(apply_result, Ok(()));

        let expected_application_id = 0;

        begin_review_applications(member_id, account_id, opening_id);

        let lead = StorageWorkingGroup::current_lead();
        assert!(lead.is_none());

        let old_reward_amount = 100;
        let reward_policy = Some(RewardPolicy {
            amount_per_payout: old_reward_amount,
            next_payment_at_block: 9999,
            payout_interval: None,
        });

        fill_opening(
            member_id,
            account_id,
            opening_id,
            expected_application_id,
            reward_policy,
        );

        let leader_worker_id = StorageWorkingGroup::current_lead().unwrap();

        let worker = StorageWorkingGroup::worker_by_id(leader_worker_id);
        let relationship_id = worker.reward_relationship.unwrap();

        let relationship = recurringrewards::RewardRelationships::<Runtime>::get(relationship_id);
        assert_eq!(relationship.amount_per_payout, old_reward_amount);

        let new_reward_amount = 999;
        set_reward(member_id, account_id, leader_worker_id, new_reward_amount);

        let relationship = recurringrewards::RewardRelationships::<Runtime>::get(relationship_id);
        assert_eq!(relationship.amount_per_payout, new_reward_amount);
    });
}
