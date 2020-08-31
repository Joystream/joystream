use super::*;

use system::RawOrigin;

use common::working_group::WorkingGroup;
use hiring::ActivateOpeningAt;
use proposals_codex::AddOpeningParameters;
use working_group::{OpeningPolicyCommitment, RewardPolicy};

use crate::{Balance, BlockNumber, StorageWorkingGroupInstance};
use sp_std::collections::btree_set::BTreeSet;

type StorageWorkingGroup = working_group::Module<Runtime, StorageWorkingGroupInstance>;

type Hiring = hiring::Module<Runtime>;

fn add_opening(
    member_id: u8,
    account_id: [u8; 32],
    activate_at: hiring::ActivateOpeningAt<BlockNumber>,
    opening_policy_commitment: Option<OpeningPolicyCommitment<BlockNumber, u128>>,
    sequence_number: u32, // action sequence number to align with other actions
) -> u64 {
    let expected_proposal_id = sequence_number;
    let run_to_block = sequence_number * 2;

    let opening_id = StorageWorkingGroup::next_opening_id();

    assert!(!<working_group::OpeningById<
        Runtime,
        StorageWorkingGroupInstance,
    >>::contains_key(opening_id));

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
    })
    .with_expected_proposal_id(expected_proposal_id)
    .with_run_to_block(run_to_block);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();

    opening_id
}

fn begin_review_applications(
    member_id: u8,
    account_id: [u8; 32],
    opening_id: u64,
    sequence_number: u32, // action sequence number to align with other actions
) {
    let expected_proposal_id = sequence_number;
    let run_to_block = sequence_number * 2;

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
    .with_expected_proposal_id(expected_proposal_id)
    .with_run_to_block(run_to_block);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
}

fn fill_opening(
    member_id: u8,
    account_id: [u8; 32],
    opening_id: u64,
    successful_application_id: u64,
    reward_policy: Option<RewardPolicy<Balance, BlockNumber>>,
    sequence_number: u32, // action sequence number to align with other actions
) {
    let expected_proposal_id = sequence_number;
    let run_to_block = sequence_number * 2;

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
    sequence_number: u32, // action sequence number to align with other actions
) {
    let expected_proposal_id = sequence_number;
    let run_to_block = sequence_number * 2;

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
    .with_expected_proposal_id(expected_proposal_id)
    .with_run_to_block(run_to_block);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
}

fn slash_stake(
    member_id: u8,
    account_id: [u8; 32],
    leader_worker_id: u64,
    stake_amount: Balance,
    sequence_number: u32, // action sequence number to align with other actions
) {
    let expected_proposal_id = sequence_number;
    let run_to_block = sequence_number * 2;

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
    .with_expected_proposal_id(expected_proposal_id)
    .with_run_to_block(run_to_block);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
}

fn set_reward(
    member_id: u8,
    account_id: [u8; 32],
    leader_worker_id: u64,
    reward_amount: Balance,
    sequence_number: u32, // action sequence number to align with other actions
) {
    let expected_proposal_id = sequence_number;
    let run_to_block = sequence_number * 2;

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
    .with_expected_proposal_id(expected_proposal_id)
    .with_run_to_block(run_to_block);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
}

fn set_mint_capacity(
    member_id: u8,
    account_id: [u8; 32],
    mint_capacity: Balance,
    sequence_number: u32, // action sequence number to align with other actions
    setup_environment: bool,
) {
    let expected_proposal_id = sequence_number;
    let run_to_block = sequence_number * 2;

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
    .with_setup_enviroment(setup_environment)
    .with_expected_proposal_id(expected_proposal_id)
    .with_run_to_block(run_to_block);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
}

fn terminate_role(
    member_id: u8,
    account_id: [u8; 32],
    leader_worker_id: u64,
    slash: bool,
    sequence_number: u32, // action sequence number to align with other actions
) {
    let expected_proposal_id = sequence_number;
    let run_to_block = sequence_number * 2;

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        ProposalCodex::create_terminate_working_group_leader_role_proposal(
            RawOrigin::Signed(account_id.clone().into()).into(),
            member_id as u64,
            b"title".to_vec(),
            b"body".to_vec(),
            Some(<BalanceOf<Runtime>>::from(100_000_u32)),
            proposals_codex::TerminateRoleParameters {
                worker_id: leader_worker_id,
                rationale: Vec::new(),
                slash,
                working_group: WorkingGroup::Storage,
            },
        )
    })
    .disable_setup_enviroment()
    .with_expected_proposal_id(expected_proposal_id)
    .with_run_to_block(run_to_block);

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
        >>::contains_key(next_opening_id));

        let opening_id = add_opening(
            member_id,
            account_id,
            ActivateOpeningAt::CurrentBlock,
            None,
            1,
        );

        // Check for expected opening id.
        assert_eq!(opening_id, next_opening_id);

        // Check for the new opening creation.
        assert!(<working_group::OpeningById<
            Runtime,
            StorageWorkingGroupInstance,
        >>::contains_key(opening_id));
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
            1,
        );

        let opening = StorageWorkingGroup::opening_by_id(opening_id);

        let hiring_opening = Hiring::opening_by_id(opening.hiring_opening_id);
        assert_eq!(
            hiring_opening.stage,
            hiring::OpeningStage::Active {
                stage: hiring::ActiveOpeningStage::AcceptingApplications {
                    started_accepting_applicants_at_block: 0
                },
                applications_added: BTreeSet::new(),
                active_application_count: 0,
                unstaking_application_count: 0,
                deactivated_application_count: 0
            }
        );

        begin_review_applications(member_id, account_id, opening_id, 2);

        let hiring_opening = Hiring::opening_by_id(opening.hiring_opening_id);
        assert_eq!(
            hiring_opening.stage,
            hiring::OpeningStage::Active {
                stage: hiring::ActiveOpeningStage::ReviewPeriod {
                    started_accepting_applicants_at_block: 0,
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
            1,
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

        begin_review_applications(member_id, account_id, opening_id, 2);

        let lead = StorageWorkingGroup::current_lead();
        assert!(lead.is_none());

        fill_opening(
            member_id,
            account_id,
            opening_id,
            expected_application_id,
            None,
            3,
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
            1,
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

        begin_review_applications(member_id, account_id, opening_id, 2);

        let lead = StorageWorkingGroup::current_lead();
        assert!(lead.is_none());

        fill_opening(
            member_id,
            account_id,
            opening_id,
            expected_application_id,
            None,
            3,
        );

        let leader_worker_id = StorageWorkingGroup::current_lead().unwrap();

        let stake_id = 1;
        let old_balance = Balances::free_balance(&account_id.into());
        let old_stake = <stake::Module<Runtime>>::stakes(stake_id);

        assert_eq!(get_stake_balance(old_stake), stake_amount);

        let decreasing_stake_amount = 30;
        decrease_stake(
            member_id,
            account_id,
            leader_worker_id,
            decreasing_stake_amount,
            4,
        );

        let new_balance = Balances::free_balance(&account_id.into());
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
            1,
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

        begin_review_applications(member_id, account_id, opening_id, 2);

        let lead = StorageWorkingGroup::current_lead();
        assert!(lead.is_none());

        fill_opening(
            member_id,
            account_id,
            opening_id,
            expected_application_id,
            None,
            3,
        );

        let leader_worker_id = StorageWorkingGroup::current_lead().unwrap();

        let stake_id = 1;
        let old_balance = Balances::free_balance(&account_id.into());
        let old_stake = <stake::Module<Runtime>>::stakes(stake_id);

        assert_eq!(get_stake_balance(old_stake), stake_amount);

        let slashing_stake_amount = 30;
        slash_stake(
            member_id,
            account_id,
            leader_worker_id,
            slashing_stake_amount,
            4,
        );

        let new_balance = Balances::free_balance(&account_id.into());
        let new_stake = <stake::Module<Runtime>>::stakes(stake_id);

        assert_eq!(
            get_stake_balance(new_stake),
            stake_amount - slashing_stake_amount
        );
        assert_eq!(new_balance, old_balance);
    });
}

#[test]
fn create_set_working_group_mint_capacity_proposal_execution_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = 1;
        let account_id: [u8; 32] = [member_id; 32];

        assert_eq!(StorageWorkingGroup::mint(), 0);

        let mint_capacity = 999999;
        set_mint_capacity(member_id, account_id, mint_capacity, 1, true);

        let mint_id = StorageWorkingGroup::mint();
        let mint = <minting::Module<Runtime>>::mints(mint_id);

        assert_eq!(mint.capacity(), mint_capacity);
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
            1,
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

        begin_review_applications(member_id, account_id, opening_id, 2);

        let lead = StorageWorkingGroup::current_lead();
        assert!(lead.is_none());

        let old_reward_amount = 100;
        let reward_policy = Some(RewardPolicy {
            amount_per_payout: old_reward_amount,
            next_payment_at_block: 9999,
            payout_interval: None,
        });

        set_mint_capacity(member_id, account_id, 999999, 3, false);

        fill_opening(
            member_id,
            account_id,
            opening_id,
            expected_application_id,
            reward_policy,
            4,
        );

        let leader_worker_id = StorageWorkingGroup::current_lead().unwrap();

        let worker = StorageWorkingGroup::worker_by_id(leader_worker_id);
        let relationship_id = worker.reward_relationship.unwrap();

        let relationship = recurring_rewards::RewardRelationships::<Runtime>::get(relationship_id);
        assert_eq!(relationship.amount_per_payout, old_reward_amount);

        let new_reward_amount = 999;
        set_reward(
            member_id,
            account_id,
            leader_worker_id,
            new_reward_amount,
            5,
        );

        let relationship = recurring_rewards::RewardRelationships::<Runtime>::get(relationship_id);
        assert_eq!(relationship.amount_per_payout, new_reward_amount);
    });
}

#[test]
fn create_terminate_group_leader_role_proposal_execution_succeeds() {
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
            1,
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

        begin_review_applications(member_id, account_id, opening_id, 2);

        let lead = StorageWorkingGroup::current_lead();
        assert!(lead.is_none());

        let old_reward_amount = 100;
        let reward_policy = Some(RewardPolicy {
            amount_per_payout: old_reward_amount,
            next_payment_at_block: 9999,
            payout_interval: None,
        });

        set_mint_capacity(member_id, account_id, 999999, 3, false);

        fill_opening(
            member_id,
            account_id,
            opening_id,
            expected_application_id,
            reward_policy,
            4,
        );

        let leader_worker_id = StorageWorkingGroup::current_lead().unwrap();

        let stake_id = 1;
        let old_balance = Balances::free_balance(&account_id.into());
        let old_stake = <stake::Module<Runtime>>::stakes(stake_id);

        assert_eq!(get_stake_balance(old_stake), stake_amount);

        terminate_role(member_id, account_id, leader_worker_id, false, 5);

        assert!(StorageWorkingGroup::current_lead().is_none());

        let new_balance = Balances::free_balance(&account_id.into());
        let new_stake = <stake::Module<Runtime>>::stakes(stake_id);

        assert_eq!(new_stake.staking_status, stake::StakingStatus::NotStaked);
        assert_eq!(new_balance, old_balance + stake_amount);
    });
}

#[test]
fn create_terminate_group_leader_role_proposal_with_slashing_execution_succeeds() {
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
            1,
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

        begin_review_applications(member_id, account_id, opening_id, 2);

        let lead = StorageWorkingGroup::current_lead();
        assert!(lead.is_none());

        let old_reward_amount = 100;
        let reward_policy = Some(RewardPolicy {
            amount_per_payout: old_reward_amount,
            next_payment_at_block: 9999,
            payout_interval: None,
        });

        set_mint_capacity(member_id, account_id, 999999, 3, false);

        fill_opening(
            member_id,
            account_id,
            opening_id,
            expected_application_id,
            reward_policy,
            4,
        );

        let leader_worker_id = StorageWorkingGroup::current_lead().unwrap();

        let stake_id = 1;
        let old_balance = Balances::free_balance(&account_id.into());
        let old_stake = <stake::Module<Runtime>>::stakes(stake_id);

        assert_eq!(get_stake_balance(old_stake), stake_amount);

        terminate_role(member_id, account_id, leader_worker_id, true, 5);

        assert!(StorageWorkingGroup::current_lead().is_none());

        let new_balance = Balances::free_balance(&account_id.into());
        let new_stake = <stake::Module<Runtime>>::stakes(stake_id);

        assert_eq!(new_stake.staking_status, stake::StakingStatus::NotStaked);
        assert_eq!(new_balance, old_balance);
    });
}
