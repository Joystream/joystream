#![allow(unnameable_test_items)]
#![allow(dead_code)]

use super::*;

use common::working_group::WorkingGroup;
use frame_system::RawOrigin;
use proposals_codex::AddOpeningParameters;
use strum::IntoEnumIterator;
use working_group::{Penalty, StakeParameters};

use crate::primitives::{ActorId, MemberId};
use crate::tests::run_to_block;
use crate::{
    Balance, BlockNumber, ContentDirectoryWorkingGroup, ContentDirectoryWorkingGroupInstance,
    ContentDirectoryWorkingGroupStakingManager, ForumWorkingGroup, ForumWorkingGroupInstance,
    ForumWorkingGroupStakingManager, MembershipWorkingGroup, MembershipWorkingGroupInstance,
    MembershipWorkingGroupStakingManager, StorageWorkingGroup, StorageWorkingGroupInstance,
    StorageWorkingGroupStakingManager,
};

type WorkingGroupInstance<T, I> = working_group::Module<T, I>;

fn add_opening(
    member_id: MemberId,
    account_id: [u8; 32],
    stake_policy: Option<working_group::StakePolicy<BlockNumber, Balance>>,
    sequence_number: u32, // action sequence number to align with other actions
    working_group: WorkingGroup,
) -> u64 {
    let expected_proposal_id = sequence_number;

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
        WorkingGroup::Membership => {
            let opening_id = MembershipWorkingGroup::next_opening_id();
            assert!(!<working_group::OpeningById<
                Runtime,
                MembershipWorkingGroupInstance,
            >>::contains_key(opening_id));
            opening_id
        }
    };

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
            member_id: member_id.into(),
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(account_id.into()),
            exact_execution_block: None,
        };

        ProposalCodex::create_proposal(
            RawOrigin::Signed(account_id.into()).into(),
            general_proposal_parameters,
            ProposalDetails::AddWorkingGroupLeaderOpening(AddOpeningParameters {
                description: Vec::new(),
                stake_policy: stake_policy.clone(),
                reward_per_block: None,
                working_group,
            }),
        )
    })
    .with_expected_proposal_id(expected_proposal_id);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();

    match working_group {
        WorkingGroup::Content => assert!(working_group::OpeningById::<
            Runtime,
            ContentDirectoryWorkingGroupInstance,
        >::contains_key(opening_id)),
        WorkingGroup::Storage => assert!(working_group::OpeningById::<
            Runtime,
            StorageWorkingGroupInstance,
        >::contains_key(opening_id)),
        WorkingGroup::Forum => assert!(working_group::OpeningById::<
            Runtime,
            ForumWorkingGroupInstance,
        >::contains_key(opening_id)),
        WorkingGroup::Membership => assert!(working_group::OpeningById::<
            Runtime,
            MembershipWorkingGroupInstance,
        >::contains_key(opening_id)),
    }
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

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
            member_id: member_id.into(),
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(account_id.into()),
            exact_execution_block: None,
        };

        ProposalCodex::create_proposal(
            RawOrigin::Signed(account_id.into()).into(),
            general_proposal_parameters,
            ProposalDetails::FillWorkingGroupLeaderOpening(
                proposals_codex::FillOpeningParameters {
                    opening_id,
                    successful_application_id,
                    working_group,
                },
            ),
        )
    })
    .disable_setup_enviroment()
    .with_expected_proposal_id(expected_proposal_id);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
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

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
            member_id: member_id.into(),
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(account_id.into()),
            exact_execution_block: None,
        };

        ProposalCodex::create_proposal(
            RawOrigin::Signed(account_id.into()).into(),
            general_proposal_parameters,
            ProposalDetails::DecreaseWorkingGroupLeaderStake(
                leader_worker_id,
                stake_amount,
                working_group,
            ),
        )
    })
    .disable_setup_enviroment()
    .with_expected_proposal_id(expected_proposal_id);

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

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
            member_id: member_id.into(),
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(account_id.into()),
            exact_execution_block: None,
        };

        ProposalCodex::create_proposal(
            RawOrigin::Signed(account_id.into()).into(),
            general_proposal_parameters,
            ProposalDetails::SlashWorkingGroupLeaderStake(
                leader_worker_id,
                Penalty {
                    slashing_amount: stake_amount,
                    slashing_text: Vec::new(),
                },
                working_group,
            ),
        )
    })
    .disable_setup_enviroment()
    .with_expected_proposal_id(expected_proposal_id);

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

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
            member_id: member_id.into(),
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(account_id.into()),
            exact_execution_block: None,
        };

        ProposalCodex::create_proposal(
            RawOrigin::Signed(account_id.into()).into(),
            general_proposal_parameters,
            ProposalDetails::SetWorkingGroupLeaderReward(
                leader_worker_id,
                Some(reward_amount),
                working_group,
            ),
        )
    })
    .disable_setup_enviroment()
    .with_expected_proposal_id(expected_proposal_id);

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

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
            member_id: member_id.into(),
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(account_id.into()),
            exact_execution_block: None,
        };

        ProposalCodex::create_proposal(
            RawOrigin::Signed(account_id.into()).into(),
            general_proposal_parameters,
            ProposalDetails::SetWorkingGroupBudgetCapacity(mint_capacity, working_group),
        )
    })
    .with_setup_enviroment(setup_environment)
    .with_expected_proposal_id(expected_proposal_id);

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

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
            member_id: member_id.into(),
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(account_id.into()),
            exact_execution_block: None,
        };

        ProposalCodex::create_proposal(
            RawOrigin::Signed(account_id.into()).into(),
            general_proposal_parameters,
            ProposalDetails::TerminateWorkingGroupLeaderRole(
                proposals_codex::TerminateRoleParameters {
                    worker_id: leader_worker_id,
                    penalty: penalty.clone(),
                    working_group,
                },
            ),
        )
    })
    .disable_setup_enviroment()
    .with_expected_proposal_id(expected_proposal_id);

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
            WorkingGroup::Membership => {
                run_create_add_working_group_leader_opening_proposal_execution_succeeds::<
                    Runtime,
                    MembershipWorkingGroupInstance,
                >(group);
            }
        }
    }
}

fn run_create_add_working_group_leader_opening_proposal_execution_succeeds<
    T: working_group::Trait<I> + frame_system::Trait,
    I: frame_support::traits::Instance,
>(
    working_group: WorkingGroup,
) where
    <T as common::Trait>::MemberId: From<u64>,
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
            WorkingGroup::Membership => {
                run_create_fill_working_group_leader_opening_proposal_execution_succeeds::<
                    Runtime,
                    MembershipWorkingGroupInstance,
                >(group);
            }
        }
    }
}

fn run_create_fill_working_group_leader_opening_proposal_execution_succeeds<
    T: working_group::Trait<I> + frame_system::Trait,
    I: frame_support::traits::Instance,
>(
    working_group: WorkingGroup,
) where
    <T as frame_system::Trait>::AccountId: From<[u8; 32]>,
    <T as common::Trait>::MemberId: From<u64>,
    common::MemberId<T>: From<u64>,
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
            WorkingGroup::Membership => {
                run_create_decrease_group_leader_stake_proposal_execution_succeeds::<
                    Runtime,
                    MembershipWorkingGroupInstance,
                    MembershipWorkingGroupStakingManager,
                >(group);
            }
        }
    }
}

fn run_create_decrease_group_leader_stake_proposal_execution_succeeds<
    T: working_group::Trait<I> + frame_system::Trait + common::Trait + pallet_balances::Trait,
    I: frame_support::traits::Instance,
    SM: staking_handler::StakingHandler<
        <T as frame_system::Trait>::AccountId,
        <T as pallet_balances::Trait>::Balance,
        <T as common::Trait>::MemberId,
    >,
>(
    working_group: WorkingGroup,
) where
    <T as frame_system::Trait>::AccountId: From<[u8; 32]>,
    <T as common::Trait>::MemberId: From<u64>,
    <T as common::Trait>::ActorId: Into<u64>,
    <T as pallet_balances::Trait>::Balance: From<u128>,
{
    initial_test_ext().execute_with(|| {
        // Don't use the same member id as a councilor, can lead to conflicting stakes
        let member_id: MemberId = 14;

        let account_id: [u8; 32] = [member_id as u8; 32];
        let stake_amount: Balance = 100;

        increase_total_balance_issuance_using_account_id(account_id.clone().into(), 1_500_000);

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

        let old_balance = Balances::usable_balance(&account_id.into());
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

        let new_balance = Balances::usable_balance(&account_id.into());
        let stake: working_group::BalanceOf<T> = SM::current_stake(&account_id.into()).into();

        let leader_worker_id = WorkingGroupInstance::<T, I>::current_lead().unwrap();

        assert_eq!(
            WorkingGroupInstance::<T, I>::worker_by_id(leader_worker_id)
                .staking_account_id
                .unwrap(),
            account_id.into()
        );

        assert_eq!(stake, working_group::BalanceOf::<T>::from(stake_amount));
        assert_eq!(new_balance, old_balance - stake_amount);

        let old_balance = new_balance;

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
            WorkingGroup::Membership => {
                run_create_slash_group_leader_stake_proposal_execution_succeeds::<
                    Runtime,
                    MembershipWorkingGroupInstance,
                    MembershipWorkingGroupStakingManager,
                >(group)
            }
        }
    }
}

fn run_create_slash_group_leader_stake_proposal_execution_succeeds<
    T: working_group::Trait<I> + frame_system::Trait,
    I: frame_support::traits::Instance,
    SM: staking_handler::StakingHandler<
        <T as frame_system::Trait>::AccountId,
        <T as pallet_balances::Trait>::Balance,
        <T as common::Trait>::MemberId,
    >,
>(
    working_group: WorkingGroup,
) where
    <T as frame_system::Trait>::AccountId: From<[u8; 32]>,
    <T as common::Trait>::MemberId: From<u64>,
    <T as common::Trait>::ActorId: Into<u64>,
    <T as pallet_balances::Trait>::Balance: From<u128>,
{
    initial_test_ext().execute_with(|| {
        // Don't use the same member id as a councilor, can lead to conflicting stakes
        let member_id: MemberId = 14;

        let account_id: [u8; 32] = [member_id as u8; 32];
        let stake_amount: Balance = 100;

        let stake_policy = Some(working_group::StakePolicy {
            stake_amount,
            leaving_unstaking_period: 45000, // more than min value
        });

        increase_total_balance_issuance_using_account_id(account_id.clone().into(), 1_500_000);

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
            WorkingGroup::Membership => {
                run_create_set_working_group_mint_capacity_proposal_execution_succeeds::<
                    Runtime,
                    MembershipWorkingGroupInstance,
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
    <T as common::Trait>::MemberId: From<u64>,
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
            WorkingGroup::Membership => {
                run_create_set_working_group_mint_capacity_proposal_execution_succeeds::<
                    Runtime,
                    MembershipWorkingGroupInstance,
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
    <T as common::Trait>::MemberId: From<u64>,
    <T as common::Trait>::ActorId: Into<u64>,
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
            WorkingGroup::Membership => {
                run_create_terminate_group_leader_role_proposal_execution_succeeds::<
                    Runtime,
                    MembershipWorkingGroupInstance,
                    MembershipWorkingGroupStakingManager,
                >(group);
            }
        }
    }
}

fn run_create_terminate_group_leader_role_proposal_execution_succeeds<
    T: working_group::Trait<I> + frame_system::Trait + minting::Trait,
    I: frame_support::traits::Instance,
    SM: staking_handler::StakingHandler<
        <T as frame_system::Trait>::AccountId,
        <T as pallet_balances::Trait>::Balance,
        <T as common::Trait>::MemberId,
    >,
>(
    working_group: WorkingGroup,
) where
    <T as frame_system::Trait>::AccountId: From<[u8; 32]>,
    <T as common::Trait>::MemberId: From<u64>,
    common::MemberId<T>: From<u64>,
    <T as common::Trait>::ActorId: Into<u64>,
    <T as minting::Trait>::MintId: From<u64>,
    <T as pallet_balances::Trait>::Balance: From<u128>,
{
    initial_test_ext().execute_with(|| {
        // Don't use the same member id as a councilor, can lead to conflicting stakes
        let member_id: MemberId = 14;

        let account_id: [u8; 32] = [member_id as u8; 32];
        let stake_amount = 100_u128;

        let stake_policy = Some(working_group::StakePolicy {
            stake_amount,
            leaving_unstaking_period: 45000, // more than min value
        });

        increase_total_balance_issuance_using_account_id(account_id.clone().into(), 1_500_000);

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
            WorkingGroup::Membership => {
                run_create_terminate_group_leader_role_proposal_with_slashing_execution_succeeds::<
                    Runtime,
                    MembershipWorkingGroupInstance,
                    MembershipWorkingGroupStakingManager,
                >(group);
            }
        }
    }
}

fn run_create_terminate_group_leader_role_proposal_with_slashing_execution_succeeds<
    T: working_group::Trait<I> + frame_system::Trait + minting::Trait,
    I: frame_support::traits::Instance,
    SM: staking_handler::StakingHandler<
        <T as frame_system::Trait>::AccountId,
        <T as pallet_balances::Trait>::Balance,
        <T as common::Trait>::MemberId,
    >,
>(
    working_group: WorkingGroup,
) where
    <T as frame_system::Trait>::AccountId: From<[u8; 32]>,
    <T as common::Trait>::MemberId: From<u64>,
    <T as common::Trait>::ActorId: Into<u64>,
    <T as pallet_balances::Trait>::Balance: From<u128>,
{
    initial_test_ext().execute_with(|| {
        // Don't use the same member id as a councilor, can lead to conflicting stakes
        let member_id: MemberId = 14;

        let account_id: [u8; 32] = [member_id as u8; 32];
        let stake_amount = 100_u128;

        let stake_policy = Some(working_group::StakePolicy {
            stake_amount,
            leaving_unstaking_period: 45000, // more than min value
        });

        increase_total_balance_issuance_using_account_id(account_id.clone().into(), 1_500_000);

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
