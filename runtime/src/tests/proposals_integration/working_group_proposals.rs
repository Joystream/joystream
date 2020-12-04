#![allow(unnameable_test_items)]
#![allow(dead_code)]

use super::*;

use frame_system::RawOrigin;

use common::working_group::WorkingGroup;
use proposals_codex::AddOpeningParameters;
use working_group::{Penalty, StakeParameters};

use crate::primitives::{ActorId, MemberId};
use crate::{
    Balance, BlockNumber, ContentDirectoryWorkingGroup, ContentDirectoryWorkingGroupInstance,
    ContentDirectoryWorkingGroupStakingManager, ForumWorkingGroup, ForumWorkingGroupInstance,
    ForumWorkingGroupStakingManager, StorageWorkingGroup, StorageWorkingGroupInstance,
    StorageWorkingGroupStakingManager,
};
use frame_support::traits;
use strum::IntoEnumIterator;

type WorkingGroupInstance<T, I> = working_group::Module<T, I>;

fn add_opening(
    member_id: MemberId,
    account_id: [u8; 32],
    stake_policy: Option<working_group::StakePolicy<BlockNumber, Balance>>,
    sequence_number: u32, // action sequence number to align with other actions
    working_group: WorkingGroup,
) -> u64 {
    let expected_proposal_id = sequence_number;
    let run_to_block = sequence_number * 2;

    let opening_id = match working_group {
        WorkingGroup::Content => {
            let opening_id = ContentDirectoryWorkingGroup::next_opening_id();
            assert!(!<working_group::OpeningById<
                Runtime,
                ContentDirectoryWorkingGroupInstance,
            >>::contains_key(opening_id));
            opening_id
        }
        WorkingGroup::Storage => {
            let opening_id = StorageWorkingGroup::next_opening_id();
            assert!(!<working_group::OpeningById<
                Runtime,
                StorageWorkingGroupInstance,
            >>::contains_key(opening_id));
            opening_id
        }
        WorkingGroup::Forum => {
            let opening_id = ForumWorkingGroup::next_opening_id();
            assert!(!<working_group::OpeningById<
                Runtime,
                ForumWorkingGroupInstance,
            >>::contains_key(opening_id));
            opening_id
        }
    };

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        ProposalCodex::create_add_working_group_leader_opening_proposal(
            RawOrigin::Signed(account_id.into()).into(),
            member_id as u64,
            b"title".to_vec(),
            b"body".to_vec(),
            Some(account_id.into()),
            AddOpeningParameters {
                description: Vec::new(),
                stake_policy: stake_policy.clone(),
                reward_policy: None,
                working_group,
            },
            None,
        )
    })
    .with_expected_proposal_id(expected_proposal_id)
    .with_run_to_block(run_to_block);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();

    opening_id
}

fn fill_opening(
    member_id: MemberId,
    account_id: [u8; 32],
    opening_id: u64,
    successful_application_id: u64,
    sequence_number: u32, // action sequence number to align with other actions
    working_group: WorkingGroup,
) {
    let expected_proposal_id = sequence_number;
    let run_to_block = sequence_number * 2;

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        ProposalCodex::create_fill_working_group_leader_opening_proposal(
            RawOrigin::Signed(account_id.into()).into(),
            member_id,
            b"title".to_vec(),
            b"body".to_vec(),
            Some(account_id.into()),
            proposals_codex::FillOpeningParameters {
                opening_id,
                successful_application_id,
                working_group,
            },
            None,
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
    member_id: u64,
    account_id: [u8; 32],
    leader_worker_id: u64,
    stake_amount: Balance,
    sequence_number: u32, // action sequence number to align with other actions
    working_group: WorkingGroup,
) {
    let expected_proposal_id = sequence_number;
    let run_to_block = sequence_number * 2;

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        ProposalCodex::create_decrease_working_group_leader_stake_proposal(
            RawOrigin::Signed(account_id.into()).into(),
            member_id,
            b"title".to_vec(),
            b"body".to_vec(),
            Some(account_id.into()),
            leader_worker_id,
            stake_amount,
            working_group,
            None,
        )
    })
    .disable_setup_enviroment()
    .with_expected_proposal_id(expected_proposal_id)
    .with_run_to_block(run_to_block);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
}

fn slash_stake(
    member_id: MemberId,
    account_id: [u8; 32],
    leader_worker_id: ActorId,
    stake_amount: Balance,
    sequence_number: u32, // action sequence number to align with other actions
    working_group: WorkingGroup,
) {
    let expected_proposal_id = sequence_number;
    let run_to_block = sequence_number * 2;

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        ProposalCodex::create_slash_working_group_leader_stake_proposal(
            RawOrigin::Signed(account_id.into()).into(),
            member_id,
            b"title".to_vec(),
            b"body".to_vec(),
            Some(account_id.into()),
            leader_worker_id,
            Penalty {
                slashing_amount: stake_amount,
                slashing_text: Vec::new(),
            },
            working_group,
            None,
        )
    })
    .disable_setup_enviroment()
    .with_expected_proposal_id(expected_proposal_id)
    .with_run_to_block(run_to_block);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
}

fn set_reward(
    member_id: MemberId,
    account_id: [u8; 32],
    leader_worker_id: u64,
    reward_amount: Balance,
    sequence_number: u32, // action sequence number to align with other actions
    working_group: WorkingGroup,
) {
    let expected_proposal_id = sequence_number;
    let run_to_block = sequence_number * 2;

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        ProposalCodex::create_set_working_group_leader_reward_proposal(
            RawOrigin::Signed(account_id.into()).into(),
            member_id as u64,
            b"title".to_vec(),
            b"body".to_vec(),
            Some(account_id.into()),
            leader_worker_id,
            Some(reward_amount),
            working_group,
            None,
        )
    })
    .disable_setup_enviroment()
    .with_expected_proposal_id(expected_proposal_id)
    .with_run_to_block(run_to_block);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
}

fn set_mint_capacity<
    T: working_group::Trait<I> + frame_system::Trait,
    I: frame_support::traits::Instance,
>(
    member_id: MemberId,
    account_id: [u8; 32],
    mint_capacity: Balance,
    sequence_number: u32, // action sequence number to align with other actions
    setup_environment: bool,
    working_group: WorkingGroup,
) {
    let expected_proposal_id = sequence_number;
    let run_to_block = sequence_number * 2;

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        ProposalCodex::create_set_working_group_budget_capacity_proposal(
            RawOrigin::Signed(account_id.into()).into(),
            member_id,
            b"title".to_vec(),
            b"body".to_vec(),
            Some(account_id.into()),
            mint_capacity,
            working_group,
            None,
        )
    })
    .with_setup_enviroment(setup_environment)
    .with_expected_proposal_id(expected_proposal_id)
    .with_run_to_block(run_to_block);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
}

fn terminate_role(
    member_id: MemberId,
    account_id: [u8; 32],
    leader_worker_id: u64,
    penalty: Option<Penalty<Balance>>,
    sequence_number: u32, // action sequence number to align with other actions
    working_group: WorkingGroup,
) {
    let expected_proposal_id = sequence_number;
    let run_to_block = sequence_number * 2;

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        ProposalCodex::create_terminate_working_group_leader_role_proposal(
            RawOrigin::Signed(account_id.into()).into(),
            member_id,
            b"title".to_vec(),
            b"body".to_vec(),
            Some(account_id.into()),
            proposals_codex::TerminateRoleParameters {
                worker_id: leader_worker_id,
                penalty: penalty.clone(),
                working_group,
            },
            None,
        )
    })
    .disable_setup_enviroment()
    .with_expected_proposal_id(expected_proposal_id)
    .with_run_to_block(run_to_block);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
}

#[test]
fn create_add_working_group_leader_opening_proposal_execution_succeeds() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        match group {
            WorkingGroup::Content => {
                run_create_add_working_group_leader_opening_proposal_execution_succeeds::<
                    Runtime,
                    ContentDirectoryWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::Storage => {
                run_create_add_working_group_leader_opening_proposal_execution_succeeds::<
                    Runtime,
                    StorageWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::Forum => {
                run_create_add_working_group_leader_opening_proposal_execution_succeeds::<
                    Runtime,
                    ForumWorkingGroupInstance,
                >(group);
            }
        }
    }
}

fn run_create_add_working_group_leader_opening_proposal_execution_succeeds<
    T: working_group::Trait<I> + frame_system::Trait + stake::Trait,
    I: frame_support::traits::Instance,
>(
    working_group: WorkingGroup,
) where
    <T as membership::Trait>::MemberId: From<u64>,
{
    initial_test_ext().execute_with(|| {
        let member_id: MemberId = 1;
        let account_id: [u8; 32] = [member_id as u8; 32];

        let next_opening_id = WorkingGroupInstance::<T, I>::next_opening_id();

        assert!(!<working_group::OpeningById<T, I>>::contains_key(
            next_opening_id
        ));

        let opening_id: working_group::OpeningId =
            add_opening(member_id, account_id, None, 1, working_group).into();

        // Check for expected opening id.
        assert_eq!(opening_id, next_opening_id);

        // Check for the new opening creation.
        assert!(<working_group::OpeningById<T, I>>::contains_key(opening_id));
    });
}

#[test]
fn create_fill_working_group_leader_opening_proposal_execution_succeeds() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        match group {
            WorkingGroup::Content => {
                run_create_fill_working_group_leader_opening_proposal_execution_succeeds::<
                    Runtime,
                    ContentDirectoryWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::Storage => {
                run_create_fill_working_group_leader_opening_proposal_execution_succeeds::<
                    Runtime,
                    StorageWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::Forum => {
                run_create_fill_working_group_leader_opening_proposal_execution_succeeds::<
                    Runtime,
                    ForumWorkingGroupInstance,
                >(group);
            }
        }
    }
}

fn run_create_fill_working_group_leader_opening_proposal_execution_succeeds<
    T: working_group::Trait<I> + frame_system::Trait + stake::Trait,
    I: frame_support::traits::Instance,
>(
    working_group: WorkingGroup,
) where
    <T as frame_system::Trait>::AccountId: From<[u8; 32]>,
    <T as membership::Trait>::MemberId: From<u64>,
    working_group::MemberId<T>: From<u64>,
{
    initial_test_ext().execute_with(|| {
        let member_id: u64 = 1;
        let account_id: [u8; 32] = [member_id as u8; 32];

        let opening_id = add_opening(member_id, account_id, None, 1, working_group);

        let apply_result = WorkingGroupInstance::<T, I>::apply_on_opening(
            RawOrigin::Signed(account_id.into()).into(),
            working_group::ApplyOnOpeningParameters::<T> {
                member_id: member_id.into(),
                opening_id,
                role_account_id: account_id.into(),
                reward_account_id: account_id.into(),
                description: Vec::new(),
                stake_parameters: None,
            },
        );

        assert_eq!(apply_result, Ok(()));

        let expected_application_id = 0;

        let lead = WorkingGroupInstance::<T, I>::current_lead();
        assert!(lead.is_none());

        fill_opening(
            member_id,
            account_id,
            opening_id,
            expected_application_id,
            2,
            working_group,
        );

        run_to_block(30);

        let lead = WorkingGroupInstance::<T, I>::current_lead();
        assert!(lead.is_some());
    });
}

#[test]
fn create_decrease_group_leader_stake_proposal_execution_succeeds() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        match group {
            WorkingGroup::Content => {
                run_create_decrease_group_leader_stake_proposal_execution_succeeds::<
                    Runtime,
                    ContentDirectoryWorkingGroupInstance,
                    ContentDirectoryWorkingGroupStakingManager,
                >(group);
            }
            WorkingGroup::Storage => {
                run_create_decrease_group_leader_stake_proposal_execution_succeeds::<
                    Runtime,
                    StorageWorkingGroupInstance,
                    StorageWorkingGroupStakingManager,
                >(group);
            }
            WorkingGroup::Forum => {
                run_create_decrease_group_leader_stake_proposal_execution_succeeds::<
                    Runtime,
                    ForumWorkingGroupInstance,
                    ForumWorkingGroupStakingManager,
                >(group);
            }
        }
    }
}

fn run_create_decrease_group_leader_stake_proposal_execution_succeeds<
        T: working_group::Trait<I> + frame_system::Trait + stake::Trait + membership::Trait + pallet_balances::Trait,
        I: frame_support::traits::Instance,
        SM: staking_handler::StakingHandler<T>
    >(
        working_group: WorkingGroup,
    ) where
        <T as frame_system::Trait>::AccountId: From<[u8; 32]>,
        <T as membership::Trait>::MemberId: From<u64>,
        <T as membership::Trait>::ActorId: Into<u64>,
        <<T as stake::Trait>::Currency as traits::Currency<
            <T as frame_system::Trait>::AccountId,
        >>::Balance: From<u128>,
        <T as pallet_balances::Trait>::Balance: From<u128>,
    {
    initial_test_ext().execute_with(|| {
        let member_id: MemberId = 1;
        let account_id: [u8; 32] = [member_id as u8; 32];
        let stake_amount: Balance = 100;

        let stake_policy = Some(working_group::StakePolicy {
            stake_amount,
            leaving_unstaking_period: 45000, // more than min value
        });

        let stake_parameters = Some(
            StakeParameters::<T::AccountId, working_group::BalanceOf<T>> {
                stake: stake_amount.into(),
                staking_account_id: account_id.into(),
            },
        );

        let opening_id = add_opening(member_id, account_id, stake_policy, 1, working_group);

        let apply_result = WorkingGroupInstance::<T, I>::apply_on_opening(
            RawOrigin::Signed(account_id.into()).into(),
            working_group::ApplyOnOpeningParameters::<T> {
                member_id: member_id.into(),
                opening_id,
                role_account_id: account_id.into(),
                reward_account_id: account_id.into(),
                description: Vec::new(),
                stake_parameters,
            },
        );

        assert_eq!(apply_result, Ok(()));

        let expected_application_id = 0;

        let lead = WorkingGroupInstance::<T, I>::current_lead();
        assert!(lead.is_none());

        fill_opening(
            member_id,
            account_id,
            opening_id,
            expected_application_id,
            2,
            working_group,
        );

        let leader_worker_id = WorkingGroupInstance::<T, I>::current_lead().unwrap();

        let old_balance = Balances::usable_balance(&account_id.into());
        let old_stake = SM::current_stake(&account_id.into());

        assert_eq!(old_stake, stake_amount.into());

        let decreasing_stake_amount = 30;
        decrease_stake(
            member_id,
            account_id,
            leader_worker_id.into(),
            decreasing_stake_amount,
            3,
            working_group,
        );

        let new_balance = Balances::usable_balance(&account_id.into());
        let new_stake: working_group::BalanceOf<T> = SM::current_stake(&account_id.into()).into();
        let converted_stake_amount: working_group::BalanceOf<T> = stake_amount.into();

        assert_eq!(
            new_stake,
            converted_stake_amount - decreasing_stake_amount.into()
        );
        assert_eq!(new_balance, old_balance + decreasing_stake_amount);
    });
}

#[test]
fn create_slash_group_leader_stake_proposal_execution_succeeds() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        match group {
            WorkingGroup::Content => {
                run_create_slash_group_leader_stake_proposal_execution_succeeds::<
                    Runtime,
                    ContentDirectoryWorkingGroupInstance,
                    ContentDirectoryWorkingGroupStakingManager,
                >(group)
            }
            WorkingGroup::Storage => {
                run_create_slash_group_leader_stake_proposal_execution_succeeds::<
                    Runtime,
                    StorageWorkingGroupInstance,
                    StorageWorkingGroupStakingManager,
                >(group)
            }
            WorkingGroup::Forum => {
                run_create_slash_group_leader_stake_proposal_execution_succeeds::<
                    Runtime,
                    ForumWorkingGroupInstance,
                    ForumWorkingGroupStakingManager,
                >(group)
            }
        }
    }
}

fn run_create_slash_group_leader_stake_proposal_execution_succeeds<
        T: working_group::Trait<I> + frame_system::Trait + stake::Trait,
        I: frame_support::traits::Instance,
        SM: staking_handler::StakingHandler<T>
> (working_group: WorkingGroup) where
        <T as frame_system::Trait>::AccountId: From<[u8; 32]>,
        <T as membership::Trait>::MemberId: From<u64>,
        <T as membership::Trait>::ActorId: Into<u64>,
        <<T as stake::Trait>::Currency as traits::Currency<
            <T as frame_system::Trait>::AccountId,
        >>::Balance: From<u128>,
        <T as pallet_balances::Trait>::Balance: From<u128>,
    {
    initial_test_ext().execute_with(|| {
        let member_id: MemberId = 1;
        let account_id: [u8; 32] = [member_id as u8; 32];
        let stake_amount: Balance = 100;

        let stake_policy = Some(working_group::StakePolicy {
            stake_amount,
            leaving_unstaking_period: 45000, // more than min value
        });

        let stake_parameters = Some(
            StakeParameters::<T::AccountId, working_group::BalanceOf<T>> {
                stake: stake_amount.into(),
                staking_account_id: account_id.into(),
            },
        );

        let opening_id = add_opening(member_id, account_id, stake_policy, 1, working_group);

        let apply_result = WorkingGroupInstance::<T, I>::apply_on_opening(
            RawOrigin::Signed(account_id.into()).into(),
            working_group::ApplyOnOpeningParameters::<T> {
                member_id: member_id.into(),
                opening_id,
                role_account_id: account_id.into(),
                reward_account_id: account_id.into(),
                description: Vec::new(),
                stake_parameters,
            },
        );

        assert_eq!(apply_result, Ok(()));

        let expected_application_id = 0;

        let lead = WorkingGroupInstance::<T, I>::current_lead();

        assert!(lead.is_none());

        fill_opening(
            member_id,
            account_id,
            opening_id,
            expected_application_id,
            2,
            working_group,
        );

        let leader_worker_id = WorkingGroupInstance::<T, I>::current_lead().unwrap();

        let old_balance = Balances::usable_balance(&account_id.into());
        let old_stake = SM::current_stake(&account_id.into());

        assert_eq!(old_stake, stake_amount.into());

        let slashing_stake_amount = 30;
        slash_stake(
            member_id,
            account_id,
            leader_worker_id.into(),
            slashing_stake_amount,
            3,
            working_group,
        );

        let new_balance = Balances::usable_balance(&account_id.into());
        let new_stake: working_group::BalanceOf<T> = SM::current_stake(&account_id.into()).into();
        let converted_stake_amount: working_group::BalanceOf<T> = stake_amount.into();

        assert_eq!(
            new_stake,
            converted_stake_amount - slashing_stake_amount.into()
        );
        assert_eq!(new_balance, old_balance);
    });
}

#[test]
fn create_set_working_group_mint_capacity_proposal_execution_succeeds() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        match group {
            WorkingGroup::Content => {
                run_create_set_working_group_mint_capacity_proposal_execution_succeeds::<
                    Runtime,
                    ContentDirectoryWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::Storage => {
                run_create_set_working_group_mint_capacity_proposal_execution_succeeds::<
                    Runtime,
                    StorageWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::Forum => {
                run_create_set_working_group_mint_capacity_proposal_execution_succeeds::<
                    Runtime,
                    ForumWorkingGroupInstance,
                >(group);
            }
        }
    }
}

fn run_create_set_working_group_mint_capacity_proposal_execution_succeeds<
    T: working_group::Trait<I> + frame_system::Trait + minting::Trait,
    I: frame_support::traits::Instance,
>(
    working_group: WorkingGroup,
) where
    <T as frame_system::Trait>::AccountId: From<[u8; 32]>,
    <T as membership::Trait>::MemberId: From<u64>,
    <T as minting::Trait>::MintId: From<u64>,
    working_group::BalanceOf<T>: From<u128>,
{
    initial_test_ext().execute_with(|| {
        let member_id: MemberId = 1;
        let account_id: [u8; 32] = [member_id as u8; 32];

        let mint_capacity = 999999;
        set_mint_capacity::<T, I>(member_id, account_id, mint_capacity, 1, true, working_group);

        assert_eq!(
            working_group::Module::<T, I>::budget(),
            mint_capacity.into()
        );
    });
}

#[test]
fn create_set_group_leader_reward_proposal_execution_succeeds() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        match group {
            WorkingGroup::Content => {
                run_create_set_working_group_mint_capacity_proposal_execution_succeeds::<
                    Runtime,
                    ContentDirectoryWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::Storage => {
                run_create_set_working_group_mint_capacity_proposal_execution_succeeds::<
                    Runtime,
                    StorageWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::Forum => {
                run_create_set_working_group_mint_capacity_proposal_execution_succeeds::<
                    Runtime,
                    ForumWorkingGroupInstance,
                >(group);
            }
        }
    }
}

fn run_create_set_group_leader_reward_proposal_execution_succeeds<
    T: working_group::Trait<I> + frame_system::Trait + minting::Trait,
    I: frame_support::traits::Instance,
>(
    working_group: WorkingGroup,
) where
    <T as frame_system::Trait>::AccountId: From<[u8; 32]>,
    <T as membership::Trait>::MemberId: From<u64>,
    <T as membership::Trait>::ActorId: Into<u64>,
    <T as minting::Trait>::MintId: From<u64>,
    working_group::BalanceOf<T>: From<u128>,
{
    initial_test_ext().execute_with(|| {
        let member_id: MemberId = 1;
        let account_id: [u8; 32] = [member_id as u8; 32];

        let stake_policy = Some(working_group::StakePolicy {
            stake_amount: 100,
            leaving_unstaking_period: 0,
        });

        let opening_id = add_opening(member_id, account_id, stake_policy, 1, working_group);

        let apply_result = WorkingGroupInstance::<T, I>::apply_on_opening(
            RawOrigin::Signed(account_id.into()).into(),
            working_group::ApplyOnOpeningParameters::<T> {
                member_id: member_id.into(),
                opening_id,
                role_account_id: account_id.into(),
                reward_account_id: account_id.into(),
                description: Vec::new(),
                stake_parameters: None,
            },
        );

        assert_eq!(apply_result, Ok(()));

        let expected_application_id = 0;

        let lead = WorkingGroupInstance::<T, I>::current_lead();
        assert!(lead.is_none());

        set_mint_capacity::<T, I>(member_id, account_id, 999999, 3, false, working_group);

        fill_opening(
            member_id,
            account_id,
            opening_id,
            expected_application_id,
            4,
            working_group,
        );

        let leader_worker_id = WorkingGroupInstance::<T, I>::current_lead().unwrap();

        let new_reward_amount = 999;
        set_reward(
            member_id,
            account_id,
            leader_worker_id.into(),
            new_reward_amount,
            5,
            working_group,
        );

        let worker = WorkingGroupInstance::<T, I>::worker_by_id(leader_worker_id);

        assert_eq!(worker.reward_per_block, Some(new_reward_amount.into()));
    });
}

#[test]
fn create_terminate_group_leader_role_proposal_execution_succeeds() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        match group {
            WorkingGroup::Content => {
                run_create_terminate_group_leader_role_proposal_execution_succeeds::<
                    Runtime,
                    ContentDirectoryWorkingGroupInstance,
                    ContentDirectoryWorkingGroupStakingManager,
                >(group);
            }
            WorkingGroup::Storage => {
                run_create_terminate_group_leader_role_proposal_execution_succeeds::<
                    Runtime,
                    StorageWorkingGroupInstance,
                    StorageWorkingGroupStakingManager,
                >(group);
            }
            WorkingGroup::Forum => {
                run_create_terminate_group_leader_role_proposal_execution_succeeds::<
                    Runtime,
                    ForumWorkingGroupInstance,
                    ForumWorkingGroupStakingManager,
                >(group);
            }
        }
    }
}

fn run_create_terminate_group_leader_role_proposal_execution_succeeds<
    T: working_group::Trait<I> + frame_system::Trait + minting::Trait,
    I: frame_support::traits::Instance,
    SM: staking_handler::StakingHandler<T>,
>(
    working_group: WorkingGroup,
) where
    <T as frame_system::Trait>::AccountId: From<[u8; 32]>,
    <T as membership::Trait>::MemberId: From<u64>,
    working_group::MemberId<T>: From<u64>,
    <T as membership::Trait>::ActorId: Into<u64>,
    <T as minting::Trait>::MintId: From<u64>,
    <T as pallet_balances::Trait>::Balance: From<u128>,
{
    initial_test_ext().execute_with(|| {
        let member_id: MemberId = 1;
        let account_id: [u8; 32] = [member_id as u8; 32];
        let stake_amount = 100_u128;

        let stake_policy = Some(working_group::StakePolicy {
            stake_amount,
            leaving_unstaking_period: 45000, // more than min value
        });

        let stake_parameters = Some(
            StakeParameters::<T::AccountId, working_group::BalanceOf<T>> {
                stake: stake_amount.into(),
                staking_account_id: account_id.into(),
            },
        );

        let opening_id = add_opening(member_id, account_id, stake_policy, 1, working_group);

        let apply_result = WorkingGroupInstance::<T, I>::apply_on_opening(
            RawOrigin::Signed(account_id.into()).into(),
            working_group::ApplyOnOpeningParameters::<T> {
                member_id: member_id.into(),
                opening_id,
                role_account_id: account_id.into(),
                reward_account_id: account_id.into(),
                description: Vec::new(),
                stake_parameters,
            },
        );

        assert_eq!(apply_result, Ok(()));

        let expected_application_id = 0;

        let lead = WorkingGroupInstance::<T, I>::current_lead();
        assert!(lead.is_none());

        set_mint_capacity::<T, I>(member_id, account_id, 999999, 2, false, working_group);

        fill_opening(
            member_id,
            account_id,
            opening_id,
            expected_application_id,
            3,
            working_group,
        );

        let old_balance = Balances::usable_balance(&account_id.into());
        let old_stake = SM::current_stake(&account_id.into());

        assert_eq!(old_stake, stake_amount.into());

        let leader_worker_id = WorkingGroupInstance::<T, I>::current_lead().unwrap();

        terminate_role(
            member_id,
            account_id,
            leader_worker_id.into(),
            None,
            4,
            working_group,
        );

        assert!(WorkingGroupInstance::<T, I>::current_lead().is_none());

        let new_balance = Balances::usable_balance(&account_id.into());
        let new_stake: working_group::BalanceOf<T> = SM::current_stake(&account_id.into()).into();

        assert_eq!(new_stake, 0.into());
        assert_eq!(new_balance, old_balance + stake_amount);
    });
}

#[test]
fn create_terminate_group_leader_role_proposal_with_slashing_execution_succeeds() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        match group {
            WorkingGroup::Content => {
                run_create_terminate_group_leader_role_proposal_with_slashing_execution_succeeds::<
                    Runtime,
                    ContentDirectoryWorkingGroupInstance,
                    ContentDirectoryWorkingGroupStakingManager,
                >(group);
            }
            WorkingGroup::Storage => {
                run_create_terminate_group_leader_role_proposal_with_slashing_execution_succeeds::<
                    Runtime,
                    StorageWorkingGroupInstance,
                    StorageWorkingGroupStakingManager,
                >(group);
            }
            WorkingGroup::Forum => {
                run_create_terminate_group_leader_role_proposal_with_slashing_execution_succeeds::<
                    Runtime,
                    ForumWorkingGroupInstance,
                    ForumWorkingGroupStakingManager,
                >(group);
            }
        }
    }
}

fn run_create_terminate_group_leader_role_proposal_with_slashing_execution_succeeds<
    T: working_group::Trait<I> + frame_system::Trait + minting::Trait,
    I: frame_support::traits::Instance,
    SM: staking_handler::StakingHandler<T>,
>(
    working_group: WorkingGroup,
) where
    <T as frame_system::Trait>::AccountId: From<[u8; 32]>,
    <T as membership::Trait>::MemberId: From<u64>,
    <T as membership::Trait>::ActorId: Into<u64>,
    <T as pallet_balances::Trait>::Balance: From<u128>,
{
    initial_test_ext().execute_with(|| {
        let member_id: MemberId = 1;
        let account_id: [u8; 32] = [member_id as u8; 32];
        let stake_amount = 100_u128;

        let stake_policy = Some(working_group::StakePolicy {
            stake_amount,
            leaving_unstaking_period: 45000, // more than min value
        });

        let stake_parameters = Some(
            StakeParameters::<T::AccountId, working_group::BalanceOf<T>> {
                stake: stake_amount.into(),
                staking_account_id: account_id.into(),
            },
        );

        let opening_id = add_opening(member_id, account_id, stake_policy, 1, working_group);

        let apply_result = WorkingGroupInstance::<T, I>::apply_on_opening(
            RawOrigin::Signed(account_id.into()).into(),
            working_group::ApplyOnOpeningParameters::<T> {
                member_id: member_id.into(),
                opening_id,
                role_account_id: account_id.into(),
                reward_account_id: account_id.into(),
                description: Vec::new(),
                stake_parameters,
            },
        );

        assert_eq!(apply_result, Ok(()));

        let expected_application_id = 0;

        let lead = WorkingGroupInstance::<T, I>::current_lead();
        assert!(lead.is_none());

        set_mint_capacity::<T, I>(member_id, account_id, 999999, 2, false, working_group);

        fill_opening(
            member_id,
            account_id,
            opening_id,
            expected_application_id,
            3,
            working_group,
        );

        let old_balance = Balances::usable_balance(&account_id.into());
        let old_stake = SM::current_stake(&account_id.into());

        assert_eq!(old_stake, stake_amount.into());

        let leader_worker_id = WorkingGroupInstance::<T, I>::current_lead().unwrap();

        terminate_role(
            member_id,
            account_id,
            leader_worker_id.into(),
            Some(Penalty {
                slashing_amount: stake_amount.into(),
                slashing_text: Vec::new(),
            }),
            4,
            working_group,
        );

        assert!(WorkingGroupInstance::<T, I>::current_lead().is_none());

        let new_balance = Balances::usable_balance(&account_id.into());
        let new_stake: working_group::BalanceOf<T> = SM::current_stake(&account_id.into()).into();

        assert_eq!(new_stake, 0.into());
        assert_eq!(new_balance, old_balance);
    });
}
