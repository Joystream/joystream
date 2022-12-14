#![allow(unnameable_test_items)]
#![allow(dead_code)]

use super::*;

use common::working_group::WorkingGroup;
use common::BalanceKind;
use frame_support::traits::Get;
use frame_support::traits::LockIdentifier;
use frame_system::RawOrigin;
use proposals_codex::CreateOpeningParameters;
use strum::IntoEnumIterator;
use working_group::StakeParameters;

use crate::primitives::{ActorId, MemberId};
use crate::tests::{max_proposal_stake, run_to_block};
use crate::{
    AppWorkingGroup, AppWorkingGroupInstance, AppWorkingGroupStakingManager, Balance, BlockNumber,
    ContentWorkingGroup, ContentWorkingGroupInstance, ContentWorkingGroupStakingManager,
    DistributionWorkingGroup, DistributionWorkingGroupInstance,
    DistributionWorkingGroupStakingManager, ForumWorkingGroup, ForumWorkingGroupInstance,
    ForumWorkingGroupStakingManager, MembershipWorkingGroup, MembershipWorkingGroupInstance,
    MembershipWorkingGroupStakingManager, OperationsWorkingGroupAlpha,
    OperationsWorkingGroupAlphaStakingManager, OperationsWorkingGroupBeta,
    OperationsWorkingGroupBetaStakingManager, OperationsWorkingGroupGamma,
    OperationsWorkingGroupGammaStakingManager, OperationsWorkingGroupInstanceAlpha,
    OperationsWorkingGroupInstanceBeta, OperationsWorkingGroupInstanceGamma, StorageWorkingGroup,
    StorageWorkingGroupInstance, StorageWorkingGroupStakingManager,
};

type WorkingGroupInstance<T, I> = working_group::Module<T, I>;

fn add_opening(
    member_id: MemberId,
    account_id: [u8; 32],
    stake_policy: working_group::StakePolicy<BlockNumber, Balance>,
    sequence_number: u32, // action sequence number to align with other actions
    group: WorkingGroup,
) -> u64 {
    let expected_proposal_id = sequence_number;

    let opening_id = match group {
        WorkingGroup::Content => {
            let opening_id = ContentWorkingGroup::next_opening_id();
            assert!(!<working_group::OpeningById<
                Runtime,
                ContentWorkingGroupInstance,
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
        WorkingGroup::Distribution => {
            let opening_id = DistributionWorkingGroup::next_opening_id();
            assert!(!<working_group::OpeningById<
                Runtime,
                DistributionWorkingGroupInstance,
            >>::contains_key(opening_id));
            opening_id
        }
        WorkingGroup::OperationsAlpha => {
            let opening_id = OperationsWorkingGroupAlpha::next_opening_id();
            assert!(!<working_group::OpeningById<
                Runtime,
                OperationsWorkingGroupInstanceAlpha,
            >>::contains_key(opening_id));
            opening_id
        }
        WorkingGroup::OperationsBeta => {
            let opening_id = OperationsWorkingGroupBeta::next_opening_id();
            assert!(!<working_group::OpeningById<
                Runtime,
                OperationsWorkingGroupInstanceBeta,
            >>::contains_key(opening_id));
            opening_id
        }
        WorkingGroup::OperationsGamma => {
            let opening_id = OperationsWorkingGroupGamma::next_opening_id();
            assert!(!<working_group::OpeningById<
                Runtime,
                OperationsWorkingGroupInstanceGamma,
            >>::contains_key(opening_id));
            opening_id
        }
        WorkingGroup::App => {
            let opening_id = AppWorkingGroup::next_opening_id();
            assert!(!<working_group::OpeningById<
                Runtime,
                AppWorkingGroupInstance,
            >>::contains_key(opening_id));
            opening_id
        }
    };

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        let staking_account_id: [u8; 32] = [221u8; 32];
        increase_total_balance_issuance_using_account_id(
            staking_account_id.into(),
            max_proposal_stake(),
        );

        set_staking_account(account_id.into(), staking_account_id.into(), member_id);

        let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
            member_id,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(staking_account_id.into()),
            exact_execution_block: None,
        };

        ProposalsCodex::create_proposal(
            RawOrigin::Signed(account_id.into()).into(),
            general_proposal_parameters,
            ProposalDetails::CreateWorkingGroupLeadOpening(CreateOpeningParameters {
                description: Vec::new(),
                stake_policy: stake_policy.clone(),
                reward_per_block: None,
                group,
            }),
        )
    })
    .with_expected_proposal_id(expected_proposal_id);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
    let params =
        <Runtime as proposals_codex::Config>::CreateWorkingGroupLeadOpeningProposalParameters::get(
        );
    run_to_block(System::block_number() + params.grace_period + 1);

    match group {
        WorkingGroup::Content => assert!(working_group::OpeningById::<
            Runtime,
            ContentWorkingGroupInstance,
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
        WorkingGroup::App => assert!(
            working_group::OpeningById::<Runtime, AppWorkingGroupInstance>::contains_key(
                opening_id
            )
        ),
        WorkingGroup::OperationsAlpha => assert!(working_group::OpeningById::<
            Runtime,
            OperationsWorkingGroupInstanceAlpha,
        >::contains_key(opening_id)),
        WorkingGroup::OperationsBeta => assert!(working_group::OpeningById::<
            Runtime,
            OperationsWorkingGroupInstanceBeta,
        >::contains_key(opening_id)),
        WorkingGroup::OperationsGamma => assert!(working_group::OpeningById::<
            Runtime,
            OperationsWorkingGroupInstanceGamma,
        >::contains_key(opening_id)),
        WorkingGroup::Distribution => assert!(working_group::OpeningById::<
            Runtime,
            DistributionWorkingGroupInstance,
        >::contains_key(opening_id)),
    }
    opening_id
}

fn fill_opening(
    member_id: MemberId,
    account_id: [u8; 32],
    opening_id: u64,
    application_id: u64,
    sequence_number: u32, // action sequence number to align with other actions
    working_group: WorkingGroup,
) {
    let expected_proposal_id = sequence_number;

    let staking_account_id: [u8; 32] = [220u8; 32];
    increase_total_balance_issuance_using_account_id(
        staking_account_id.into(),
        max_proposal_stake(),
    );
    set_staking_account(account_id.into(), staking_account_id.into(), member_id);

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
            member_id,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(staking_account_id.into()),
            exact_execution_block: None,
        };

        ProposalsCodex::create_proposal(
            RawOrigin::Signed(account_id.into()).into(),
            general_proposal_parameters,
            ProposalDetails::FillWorkingGroupLeadOpening(proposals_codex::FillOpeningParameters {
                opening_id,
                application_id,
                working_group,
            }),
        )
    })
    .disable_setup_enviroment()
    .with_expected_proposal_id(expected_proposal_id);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
    let params =
        <Runtime as proposals_codex::Config>::FillWorkingGroupLeadOpeningProposalParameters::get();
    run_to_block(System::block_number() + params.grace_period + 1);
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

    let staking_account_id: [u8; 32] = [227u8; 32];
    increase_total_balance_issuance_using_account_id(
        staking_account_id.into(),
        max_proposal_stake(),
    );
    set_staking_account(account_id.into(), staking_account_id.into(), member_id);

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
            member_id,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(staking_account_id.into()),
            exact_execution_block: None,
        };

        ProposalsCodex::create_proposal(
            RawOrigin::Signed(account_id.into()).into(),
            general_proposal_parameters,
            ProposalDetails::DecreaseWorkingGroupLeadStake(
                leader_worker_id,
                stake_amount,
                working_group,
            ),
        )
    })
    .disable_setup_enviroment()
    .with_expected_proposal_id(expected_proposal_id);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
    let params =
        <Runtime as proposals_codex::Config>::DecreaseWorkingGroupLeadStakeProposalParameters::get(
        );
    run_to_block(System::block_number() + params.grace_period + 1);
}

fn slash_stake(
    member_id: MemberId,
    account_id: [u8; 32],
    staking_account_id: [u8; 32],
    leader_worker_id: ActorId,
    stake_amount: Balance,
    sequence_number: u32, // action sequence number to align with other actions
    working_group: WorkingGroup,
) {
    let expected_proposal_id = sequence_number;

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
            member_id,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(staking_account_id.into()),
            exact_execution_block: None,
        };

        ProposalsCodex::create_proposal(
            RawOrigin::Signed(account_id.into()).into(),
            general_proposal_parameters,
            ProposalDetails::SlashWorkingGroupLead(leader_worker_id, stake_amount, working_group),
        )
    })
    .disable_setup_enviroment()
    .with_expected_proposal_id(expected_proposal_id);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
    let params =
        <Runtime as proposals_codex::Config>::SlashWorkingGroupLeadProposalParameters::get();
    run_to_block(System::block_number() + params.grace_period + 1);
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

    let staking_account_id: [u8; 32] = [228u8; 32];
    increase_total_balance_issuance_using_account_id(
        staking_account_id.into(),
        max_proposal_stake(),
    );
    set_staking_account(account_id.into(), staking_account_id.into(), member_id);

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
            member_id,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(staking_account_id.into()),
            exact_execution_block: None,
        };

        ProposalsCodex::create_proposal(
            RawOrigin::Signed(account_id.into()).into(),
            general_proposal_parameters,
            ProposalDetails::SetWorkingGroupLeadReward(
                leader_worker_id,
                Some(reward_amount),
                working_group,
            ),
        )
    })
    .disable_setup_enviroment()
    .with_expected_proposal_id(expected_proposal_id);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
    let params =
        <Runtime as proposals_codex::Config>::SetWorkingGroupLeadRewardProposalParameters::get();
    run_to_block(System::block_number() + params.grace_period + 1);
}

fn set_mint_capacity<
    T: working_group::Config<I> + frame_system::Config,
    I: frame_support::traits::Instance,
>(
    member_id: MemberId,
    account_id: [u8; 32],
    mint_capacity: Balance,
    sequence_number: u32, // action sequence number to align with other actions
    setup_environment: bool,
    working_group: WorkingGroup,
    balance_kind: BalanceKind,
) {
    let expected_proposal_id = sequence_number;

    let staking_account_id: [u8; 32] = [224u8; 32];
    increase_total_balance_issuance_using_account_id(
        staking_account_id.into(),
        max_proposal_stake(),
    );
    set_staking_account(account_id.into(), staking_account_id.into(), member_id);

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
            member_id,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(staking_account_id.into()),
            exact_execution_block: None,
        };

        ProposalsCodex::create_proposal(
            RawOrigin::Signed(account_id.into()).into(),
            general_proposal_parameters,
            ProposalDetails::UpdateWorkingGroupBudget(mint_capacity, working_group, balance_kind),
        )
    })
    .with_setup_enviroment(setup_environment)
    .with_expected_proposal_id(expected_proposal_id);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
    let params =
        <Runtime as proposals_codex::Config>::UpdateWorkingGroupBudgetProposalParameters::get();
    run_to_block(System::block_number() + params.grace_period + 1);
}

fn terminate_role(
    member_id: MemberId,
    account_id: [u8; 32],
    leader_worker_id: u64,
    slashing_amount: Option<Balance>,
    sequence_number: u32, // action sequence number to align with other actions
    group: WorkingGroup,
) {
    let expected_proposal_id = sequence_number;

    let staking_account_id: [u8; 32] = [223u8; 32];
    increase_total_balance_issuance_using_account_id(
        staking_account_id.into(),
        max_proposal_stake(),
    );
    set_staking_account(account_id.into(), staking_account_id.into(), member_id);

    let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
        let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
            member_id,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(staking_account_id.into()),
            exact_execution_block: None,
        };

        ProposalsCodex::create_proposal(
            RawOrigin::Signed(account_id.into()).into(),
            general_proposal_parameters,
            ProposalDetails::TerminateWorkingGroupLead(proposals_codex::TerminateRoleParameters {
                worker_id: leader_worker_id,
                slashing_amount,
                group,
            }),
        )
    })
    .disable_setup_enviroment()
    .with_expected_proposal_id(expected_proposal_id);

    codex_extrinsic_test_fixture.call_extrinsic_and_assert();
    let params =
        <Runtime as proposals_codex::Config>::TerminateWorkingGroupLeadProposalParameters::get();
    run_to_block(System::block_number() + params.grace_period + 1);
}

#[test]
fn create_add_working_group_leader_opening_proposal_execution_succeeds() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        match group {
            WorkingGroup::Content => {
                run_create_add_working_group_leader_opening_proposal_execution_succeeds::<
                    Runtime,
                    ContentWorkingGroupInstance,
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
            WorkingGroup::Distribution => {
                run_create_add_working_group_leader_opening_proposal_execution_succeeds::<
                    Runtime,
                    DistributionWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::OperationsAlpha => {
                run_create_add_working_group_leader_opening_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceAlpha,
                >(group);
            }
            WorkingGroup::OperationsBeta => {
                run_create_add_working_group_leader_opening_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceBeta,
                >(group);
            }
            WorkingGroup::OperationsGamma => {
                run_create_add_working_group_leader_opening_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceGamma,
                >(group);
            }
            WorkingGroup::App => {
                run_create_add_working_group_leader_opening_proposal_execution_succeeds::<
                    Runtime,
                    AppWorkingGroupInstance,
                >(group);
            }
        }
    }
}

fn run_create_add_working_group_leader_opening_proposal_execution_succeeds<
    T: working_group::Config<I> + frame_system::Config,
    I: frame_support::traits::Instance,
>(
    working_group: WorkingGroup,
) where
    <T as common::membership::MembershipTypes>::MemberId: From<u64>,
    <T as frame_system::Config>::BlockNumber: Into<u32>,
{
    initial_test_ext().execute_with(|| {
        // start at block 1
        run_to_block(1);

        let member_id: MemberId = create_new_members(1)[0];
        let account_id: [u8; 32] = account_from_member_id(member_id).into();

        let next_opening_id = WorkingGroupInstance::<T, I>::next_opening_id();

        assert!(!<working_group::OpeningById<T, I>>::contains_key(
            next_opening_id
        ));

        let opening_id: working_group::OpeningId =
            add_opening(
                member_id,
                account_id,
                StakePolicy {
                    stake_amount: <Runtime as working_group::Config<
                        MembershipWorkingGroupInstance,
                    >>::MinimumApplicationStake::get() as u128,
                    leaving_unstaking_period:
                        <T as working_group::Config<I>>::MinUnstakingPeriodLimit::get().into(),
                },
                1,
                working_group,
            );

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
                    ContentWorkingGroupInstance,
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
            WorkingGroup::Distribution => {
                run_create_fill_working_group_leader_opening_proposal_execution_succeeds::<
                    Runtime,
                    DistributionWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::OperationsAlpha => {
                run_create_fill_working_group_leader_opening_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceAlpha,
                >(group);
            }
            WorkingGroup::OperationsBeta => {
                run_create_fill_working_group_leader_opening_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceBeta,
                >(group);
            }
            WorkingGroup::OperationsGamma => {
                run_create_fill_working_group_leader_opening_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceGamma,
                >(group);
            }
            WorkingGroup::App => {
                run_create_fill_working_group_leader_opening_proposal_execution_succeeds::<
                    Runtime,
                    AppWorkingGroupInstance,
                >(group);
            }
        }
    }
}

fn run_create_fill_working_group_leader_opening_proposal_execution_succeeds<
    T: working_group::Config<I> + frame_system::Config,
    I: frame_support::traits::Instance,
>(
    working_group: WorkingGroup,
) where
    <T as frame_system::Config>::AccountId: From<[u8; 32]>,
    <T as common::membership::MembershipTypes>::MemberId: From<u64>,
    common::MemberId<T>: From<u64>,
    <T as pallet_balances::Config>::Balance: From<u128>,
    <T as frame_system::Config>::BlockNumber: Into<u32>,
{
    initial_test_ext().execute_with(|| {
        // start at block 1
        run_to_block(1);

        let member_id: u64 = create_new_members(1)[0];
        let account_id: [u8; 32] = account_from_member_id(member_id).into();

        // Currently all working groups use the same configured minimum application stake so
        // picking any group is okay.
        let min_stake = <Runtime as working_group::Config<
            MembershipWorkingGroupInstance,>>::MinimumApplicationStake::get();

        increase_total_balance_issuance_using_account_id(account_id.into(), min_stake * 2);

        let opening_id = add_opening(
            member_id,
            account_id,
            StakePolicy {
                stake_amount: min_stake,
                leaving_unstaking_period:
                    <T as working_group::Config<I>>::MinUnstakingPeriodLimit::get().into(),
            },
            1,
            working_group,
        );

        let apply_result = WorkingGroupInstance::<T, I>::apply_on_opening(
            RawOrigin::Signed(account_id.into()).into(),
            working_group::ApplyOnOpeningParameters::<T> {
                member_id: member_id.into(),
                opening_id,
                role_account_id: account_id.into(),
                reward_account_id: account_id.into(),
                description: Vec::new(),
                stake_parameters: StakeParameters::<T::AccountId, working_group::BalanceOf<T>> {
                    stake: min_stake.into(),
                    staking_account_id: account_id.into(),
                },
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
                    ContentWorkingGroupInstance,
                    ContentWorkingGroupStakingManager,
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
            WorkingGroup::App => {
                run_create_decrease_group_leader_stake_proposal_execution_succeeds::<
                    Runtime,
                    AppWorkingGroupInstance,
                    AppWorkingGroupStakingManager,
                >(group);
            }
            WorkingGroup::Distribution => {
                run_create_decrease_group_leader_stake_proposal_execution_succeeds::<
                    Runtime,
                    DistributionWorkingGroupInstance,
                    DistributionWorkingGroupStakingManager,
                >(group);
            }
            WorkingGroup::OperationsAlpha => {
                run_create_decrease_group_leader_stake_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceAlpha,
                    OperationsWorkingGroupAlphaStakingManager,
                >(group);
            }
            WorkingGroup::OperationsBeta => {
                run_create_decrease_group_leader_stake_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceBeta,
                    OperationsWorkingGroupBetaStakingManager,
                >(group);
            }
            WorkingGroup::OperationsGamma => {
                run_create_decrease_group_leader_stake_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceGamma,
                    OperationsWorkingGroupGammaStakingManager,
                >(group);
            }
        }
    }
}

fn run_create_decrease_group_leader_stake_proposal_execution_succeeds<
    T: working_group::Config<I>
        + frame_system::Config
        + common::membership::MembershipTypes
        + pallet_balances::Config,
    I: frame_support::traits::Instance,
    SM: staking_handler::StakingHandler<
        <T as frame_system::Config>::AccountId,
        <T as pallet_balances::Config>::Balance,
        <T as common::membership::MembershipTypes>::MemberId,
        LockIdentifier,
    >,
>(
    working_group: WorkingGroup,
) where
    <T as frame_system::Config>::AccountId: From<[u8; 32]>,
    <T as common::membership::MembershipTypes>::MemberId: From<u64>,
    <T as common::membership::MembershipTypes>::ActorId: Into<u64>,
    <T as pallet_balances::Config>::Balance: From<u128>,
    <T as frame_system::Config>::BlockNumber: Into<u32>,
{
    initial_test_ext().execute_with(|| {
        // start at block 1
        run_to_block(1);

        let member_id: u64 = create_new_members(1)[0];
        let account_id: [u8; 32] = account_from_member_id(member_id).into();
        let stake_amount = <Runtime as working_group::Config<
            MembershipWorkingGroupInstance,>>::MinimumApplicationStake::get();

        increase_total_balance_issuance_using_account_id(account_id.into(), stake_amount * 2);

        let stake_policy = working_group::StakePolicy {
            stake_amount,
            leaving_unstaking_period:
                <T as working_group::Config<I>>::MinUnstakingPeriodLimit::get().into(),
        };

        let opening_id = add_opening(member_id, account_id, stake_policy, 1, working_group);

        let staking_account_id: [u8; 32] = [22u8; 32];
        increase_total_balance_issuance_using_account_id(
            staking_account_id.into(),
            stake_amount * 2,
        );
        set_staking_account(account_id.into(), staking_account_id.into(), member_id);
        let stake_parameters = StakeParameters::<T::AccountId, working_group::BalanceOf<T>> {
            stake: stake_amount.into(),
            staking_account_id: staking_account_id.into(),
        };

        let old_balance = Balances::free_balance(&staking_account_id.into());

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

        let new_balance = Balances::usable_balance(&staking_account_id.into());
        let stake: working_group::BalanceOf<T> = SM::current_stake(&staking_account_id.into());

        let leader_worker_id = WorkingGroupInstance::<T, I>::current_lead().unwrap();

        assert_eq!(
            WorkingGroupInstance::<T, I>::worker_by_id(leader_worker_id)
                .expect("Worker Must Exist")
                .staking_account_id,
            staking_account_id.into()
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

        let new_balance = Balances::usable_balance(&staking_account_id.into());
        let new_stake: working_group::BalanceOf<T> = SM::current_stake(&staking_account_id.into());
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
                    ContentWorkingGroupInstance,
                    ContentWorkingGroupStakingManager,
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
            WorkingGroup::App => run_create_slash_group_leader_stake_proposal_execution_succeeds::<
                Runtime,
                AppWorkingGroupInstance,
                AppWorkingGroupStakingManager,
            >(group),
            WorkingGroup::Distribution => {
                run_create_slash_group_leader_stake_proposal_execution_succeeds::<
                    Runtime,
                    DistributionWorkingGroupInstance,
                    DistributionWorkingGroupStakingManager,
                >(group)
            }
            WorkingGroup::OperationsAlpha => {
                run_create_slash_group_leader_stake_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceAlpha,
                    OperationsWorkingGroupAlphaStakingManager,
                >(group)
            }
            WorkingGroup::OperationsBeta => {
                run_create_slash_group_leader_stake_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceBeta,
                    OperationsWorkingGroupBetaStakingManager,
                >(group)
            }
            WorkingGroup::OperationsGamma => {
                run_create_slash_group_leader_stake_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceGamma,
                    OperationsWorkingGroupGammaStakingManager,
                >(group)
            }
        }
    }
}

fn run_create_slash_group_leader_stake_proposal_execution_succeeds<
    T: working_group::Config<I> + frame_system::Config,
    I: frame_support::traits::Instance,
    SM: staking_handler::StakingHandler<
        <T as frame_system::Config>::AccountId,
        <T as pallet_balances::Config>::Balance,
        <T as common::membership::MembershipTypes>::MemberId,
        LockIdentifier,
    >,
>(
    working_group: WorkingGroup,
) where
    <T as frame_system::Config>::AccountId: From<[u8; 32]>,
    <T as common::membership::MembershipTypes>::MemberId: From<u64>,
    <T as common::membership::MembershipTypes>::ActorId: Into<u64>,
    <T as pallet_balances::Config>::Balance: From<u128>,
    <T as frame_system::Config>::BlockNumber: Into<u32>,
{
    initial_test_ext().execute_with(|| {
        // start at block 1
        run_to_block(1);

        let member_id: u64 = create_new_members(1)[0];
        let account_id: [u8; 32] = account_from_member_id(member_id).into();
        let stake_amount = <Runtime as working_group::Config<
            MembershipWorkingGroupInstance,>>::MinimumApplicationStake::get();

        let stake_policy = working_group::StakePolicy {
            stake_amount,
            leaving_unstaking_period:
                <T as working_group::Config<I>>::MinUnstakingPeriodLimit::get().into(),
        };

        increase_total_balance_issuance_using_account_id(account_id.into(), stake_amount * 2);

        let opening_id = add_opening(member_id, account_id, stake_policy, 1, working_group);

        // Setup staking account
        let staking_account_id: [u8; 32] = [33u8; 32];
        increase_total_balance_issuance_using_account_id(
            staking_account_id.into(),
            stake_amount * 2,
        );
        set_staking_account(account_id.into(), staking_account_id.into(), member_id);
        let stake_parameters = StakeParameters::<T::AccountId, working_group::BalanceOf<T>> {
            stake: stake_amount.into(),
            staking_account_id: staking_account_id.into(),
        };

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

        let old_balance = Balances::usable_balance(&staking_account_id.into());
        let old_stake = SM::current_stake(&staking_account_id.into());

        assert_eq!(old_stake, stake_amount.into());

        // Setup staking account for slashing
        let staking_account_id_for_slashing: [u8; 32] = [22u8; 32];
        increase_total_balance_issuance_using_account_id(
            staking_account_id_for_slashing.into(),
            max_proposal_stake(),
        );
        set_staking_account(
            account_id.into(),
            staking_account_id_for_slashing.into(),
            member_id,
        );

        let slashing_stake_amount = 30;
        slash_stake(
            member_id,
            account_id,
            staking_account_id_for_slashing,
            leader_worker_id.into(),
            slashing_stake_amount,
            3,
            working_group,
        );

        let new_balance = Balances::usable_balance(&staking_account_id.into());
        let new_stake: working_group::BalanceOf<T> = SM::current_stake(&staking_account_id.into());
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
                    ContentWorkingGroupInstance,
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
            WorkingGroup::App => {
                run_create_set_working_group_mint_capacity_proposal_execution_succeeds::<
                    Runtime,
                    AppWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::Distribution => {
                run_create_set_working_group_mint_capacity_proposal_execution_succeeds::<
                    Runtime,
                    DistributionWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::OperationsAlpha => {
                run_create_set_working_group_mint_capacity_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceAlpha,
                >(group);
            }
            WorkingGroup::OperationsBeta => {
                run_create_set_working_group_mint_capacity_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceBeta,
                >(group);
            }
            WorkingGroup::OperationsGamma => {
                run_create_set_working_group_mint_capacity_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceGamma,
                >(group);
            }
        }
    }
}

fn run_create_set_working_group_mint_capacity_proposal_execution_succeeds<
    T: working_group::Config<I> + frame_system::Config,
    I: frame_support::traits::Instance,
>(
    working_group: WorkingGroup,
) where
    <T as frame_system::Config>::AccountId: From<[u8; 32]>,
    <T as common::membership::MembershipTypes>::MemberId: From<u64>,
    working_group::BalanceOf<T>: From<u128>,
    <T as frame_system::Config>::BlockNumber: Into<u32>,
{
    initial_test_ext().execute_with(|| {
        // start at block 1
        run_to_block(1);

        setup_new_council(1);

        let member_id: MemberId = create_new_members(1)[0];
        let account_id: [u8; 32] = account_from_member_id(member_id).into();

        let mint_capacity = 999999;

        increase_total_balance_issuance_using_account_id(account_id.into(), max_proposal_stake());

        Council::set_budget(RawOrigin::Root.into(), 5_000_000).unwrap();

        set_mint_capacity::<T, I>(
            member_id,
            account_id,
            mint_capacity,
            1,
            false,
            working_group,
            BalanceKind::Positive,
        );

        assert_eq!(
            working_group::Module::<T, I>::budget(),
            mint_capacity.into()
        );
    });
}

fn run_create_syphon_working_group_mint_capacity_proposal_execution_succeeds<
    T: working_group::Config<I> + frame_system::Config,
    I: frame_support::traits::Instance,
>(
    working_group: WorkingGroup,
) where
    <T as frame_system::Config>::AccountId: From<[u8; 32]>,
    <T as common::membership::MembershipTypes>::MemberId: From<u64>,
    working_group::BalanceOf<T>: From<u128>,
    <T as frame_system::Config>::BlockNumber: Into<u32>,
{
    initial_test_ext().execute_with(|| {
        // start at block 1
        run_to_block(1);

        let member_id: u64 = create_new_members(1)[0];
        let account_id: [u8; 32] = account_from_member_id(member_id).into();

        let min_stake = <Runtime as working_group::Config<
            MembershipWorkingGroupInstance,>>::MinimumApplicationStake::get();

        increase_total_balance_issuance_using_account_id(account_id.into(), min_stake * 2);

        let funding = 999999;
        let mint_capacity = 5_000_000;

        let opening_id = add_opening(
            member_id,
            account_id,
            StakePolicy {
                stake_amount: min_stake,
                leaving_unstaking_period:
                    <T as working_group::Config<I>>::MinUnstakingPeriodLimit::get().into(),
            },
            1,
            working_group,
        );

        let stake_parameters = StakeParameters::<T::AccountId, working_group::BalanceOf<T>> {
            stake: min_stake.into(),
            staking_account_id: account_id.into(),
        };

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
        working_group::Module::<T, I>::set_budget(RawOrigin::Root.into(), mint_capacity.into())
            .unwrap();

        assert_eq!(
            working_group::Module::<T, I>::budget(),
            mint_capacity.into()
        );

        set_mint_capacity::<T, I>(
            member_id,
            account_id,
            funding,
            2,
            false,
            working_group,
            BalanceKind::Negative,
        );

        assert_eq!(
            working_group::Module::<T, I>::budget(),
            (mint_capacity - funding).into()
        );
    });
}

#[test]
fn create_set_group_leader_reward_proposal_execution_succeeds() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        match group {
            WorkingGroup::Content => {
                run_create_set_group_leader_reward_proposal_execution_succeeds::<
                    Runtime,
                    ContentWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::Storage => {
                run_create_set_group_leader_reward_proposal_execution_succeeds::<
                    Runtime,
                    StorageWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::Forum => {
                run_create_set_group_leader_reward_proposal_execution_succeeds::<
                    Runtime,
                    ForumWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::Membership => {
                run_create_set_group_leader_reward_proposal_execution_succeeds::<
                    Runtime,
                    MembershipWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::App => {
                run_create_set_group_leader_reward_proposal_execution_succeeds::<
                    Runtime,
                    AppWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::Distribution => {
                run_create_set_group_leader_reward_proposal_execution_succeeds::<
                    Runtime,
                    DistributionWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::OperationsAlpha => {
                run_create_set_group_leader_reward_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceAlpha,
                >(group);
            }
            WorkingGroup::OperationsBeta => {
                run_create_set_group_leader_reward_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceBeta,
                >(group);
            }
            WorkingGroup::OperationsGamma => {
                run_create_set_group_leader_reward_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceGamma,
                >(group);
            }
        }
    }
}

#[test]
fn create_syphon_working_group_mint_capacity_proposal_execution_succeeds() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        match group {
            WorkingGroup::Content => {
                run_create_syphon_working_group_mint_capacity_proposal_execution_succeeds::<
                    Runtime,
                    ContentWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::Storage => {
                run_create_syphon_working_group_mint_capacity_proposal_execution_succeeds::<
                    Runtime,
                    StorageWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::Forum => {
                run_create_syphon_working_group_mint_capacity_proposal_execution_succeeds::<
                    Runtime,
                    ForumWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::Membership => {
                run_create_syphon_working_group_mint_capacity_proposal_execution_succeeds::<
                    Runtime,
                    MembershipWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::App => {
                run_create_syphon_working_group_mint_capacity_proposal_execution_succeeds::<
                    Runtime,
                    AppWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::Distribution => {
                run_create_syphon_working_group_mint_capacity_proposal_execution_succeeds::<
                    Runtime,
                    DistributionWorkingGroupInstance,
                >(group);
            }
            WorkingGroup::OperationsAlpha => {
                run_create_syphon_working_group_mint_capacity_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceAlpha,
                >(group);
            }
            WorkingGroup::OperationsBeta => {
                run_create_syphon_working_group_mint_capacity_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceBeta,
                >(group);
            }
            WorkingGroup::OperationsGamma => {
                run_create_syphon_working_group_mint_capacity_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceGamma,
                >(group);
            }
        }
    }
}

fn run_create_set_group_leader_reward_proposal_execution_succeeds<
    T: working_group::Config<I> + frame_system::Config,
    I: frame_support::traits::Instance,
>(
    working_group: WorkingGroup,
) where
    <T as frame_system::Config>::AccountId: From<[u8; 32]>,
    <T as common::membership::MembershipTypes>::MemberId: From<u64>,
    <T as common::membership::MembershipTypes>::ActorId: Into<u64>,
    working_group::BalanceOf<T>: From<u128>,
    <T as frame_system::Config>::BlockNumber: Into<u32>,
{
    initial_test_ext().execute_with(|| {
        // start at block 1
        run_to_block(1);

        let member_id: u64 = create_new_members(1)[0];
        let account_id: [u8; 32] = account_from_member_id(member_id).into();

        // Currently all working groups are configured with the same minimum application stake so taking
        // any working group is okay.
        let min_stake = <Runtime as working_group::Config<
            MembershipWorkingGroupInstance,>>::MinimumApplicationStake::get();

        increase_total_balance_issuance_using_account_id(account_id.into(), min_stake * 2);

        let stake_parameters = StakeParameters::<T::AccountId, working_group::BalanceOf<T>> {
            stake: min_stake.into(),
            staking_account_id: account_id.into(),
        };

        let opening_id = add_opening(
            member_id,
            account_id,
            StakePolicy {
                stake_amount: min_stake,
                leaving_unstaking_period:
                    <T as working_group::Config<I>>::MinUnstakingPeriodLimit::get().into(),
            },
            1,
            working_group,
        );

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

        set_mint_capacity::<T, I>(
            member_id,
            account_id,
            999999,
            2,
            false,
            working_group,
            BalanceKind::Positive,
        );

        fill_opening(
            member_id,
            account_id,
            opening_id,
            expected_application_id,
            3,
            working_group,
        );

        let leader_worker_id = WorkingGroupInstance::<T, I>::current_lead().unwrap();

        let new_reward_amount = 999;
        set_reward(
            member_id,
            account_id,
            leader_worker_id.into(),
            new_reward_amount,
            4,
            working_group,
        );

        let worker = WorkingGroupInstance::<T, I>::worker_by_id(leader_worker_id)
            .expect("Worker Must Exist");

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
                    ContentWorkingGroupInstance,
                    ContentWorkingGroupStakingManager,
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
            WorkingGroup::App => {
                run_create_terminate_group_leader_role_proposal_execution_succeeds::<
                    Runtime,
                    AppWorkingGroupInstance,
                    AppWorkingGroupStakingManager,
                >(group);
            }
            WorkingGroup::Distribution => {
                run_create_terminate_group_leader_role_proposal_execution_succeeds::<
                    Runtime,
                    DistributionWorkingGroupInstance,
                    DistributionWorkingGroupStakingManager,
                >(group);
            }
            WorkingGroup::OperationsAlpha => {
                run_create_terminate_group_leader_role_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceAlpha,
                    OperationsWorkingGroupAlphaStakingManager,
                >(group);
            }
            WorkingGroup::OperationsBeta => {
                run_create_terminate_group_leader_role_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceBeta,
                    OperationsWorkingGroupBetaStakingManager,
                >(group);
            }
            WorkingGroup::OperationsGamma => {
                run_create_terminate_group_leader_role_proposal_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceGamma,
                    OperationsWorkingGroupGammaStakingManager,
                >(group);
            }
        }
    }
}

fn run_create_terminate_group_leader_role_proposal_execution_succeeds<
    T: working_group::Config<I> + frame_system::Config,
    I: frame_support::traits::Instance,
    SM: staking_handler::StakingHandler<
        <T as frame_system::Config>::AccountId,
        <T as pallet_balances::Config>::Balance,
        <T as common::membership::MembershipTypes>::MemberId,
        LockIdentifier,
    >,
>(
    working_group: WorkingGroup,
) where
    <T as frame_system::Config>::AccountId: From<[u8; 32]>,
    <T as common::membership::MembershipTypes>::MemberId: From<u64>,
    common::MemberId<T>: From<u64>,
    <T as common::membership::MembershipTypes>::ActorId: Into<u64>,
    <T as pallet_balances::Config>::Balance: From<u128>,
    <T as frame_system::Config>::BlockNumber: Into<u32>,
{
    initial_test_ext().execute_with(|| {
        // start at block 1
        run_to_block(1);

        let member_id: u64 = create_new_members(1)[0];
        let account_id: [u8; 32] = account_from_member_id(member_id).into();
        let stake_amount = <Runtime as working_group::Config<
            MembershipWorkingGroupInstance,>>::MinimumApplicationStake::get();

        let stake_policy = working_group::StakePolicy {
            stake_amount,
            leaving_unstaking_period:
                <T as working_group::Config<I>>::MinUnstakingPeriodLimit::get().into(),
        };

        increase_total_balance_issuance_using_account_id(account_id.into(), stake_amount * 2);

        let stake_parameters = StakeParameters::<T::AccountId, working_group::BalanceOf<T>> {
            stake: stake_amount.into(),
            staking_account_id: account_id.into(),
        };

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

        set_mint_capacity::<T, I>(
            member_id,
            account_id,
            999999,
            2,
            false,
            working_group,
            BalanceKind::Positive,
        );

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
        let new_stake: working_group::BalanceOf<T> = SM::current_stake(&account_id.into());

        assert_eq!(new_stake, 0.into());
        assert_eq!(
            new_balance,
            old_balance + stake_amount - <Runtime as membership::Config>::CandidateStake::get()
        );
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
                    ContentWorkingGroupInstance,
                    ContentWorkingGroupStakingManager,
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
            WorkingGroup::App => {
                run_create_terminate_group_leader_role_proposal_with_slashing_execution_succeeds::<
                    Runtime,
                    AppWorkingGroupInstance,
                    AppWorkingGroupStakingManager,
                >(group);
            }
            WorkingGroup::Distribution => {
                run_create_terminate_group_leader_role_proposal_with_slashing_execution_succeeds::<
                    Runtime,
                    DistributionWorkingGroupInstance,
                    DistributionWorkingGroupStakingManager,
                >(group);
            }
            WorkingGroup::OperationsAlpha => {
                run_create_terminate_group_leader_role_proposal_with_slashing_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceAlpha,
                    OperationsWorkingGroupAlphaStakingManager,
                >(group);
            }
            WorkingGroup::OperationsBeta => {
                run_create_terminate_group_leader_role_proposal_with_slashing_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceBeta,
                    OperationsWorkingGroupBetaStakingManager,
                >(group);
            }
            WorkingGroup::OperationsGamma => {
                run_create_terminate_group_leader_role_proposal_with_slashing_execution_succeeds::<
                    Runtime,
                    OperationsWorkingGroupInstanceGamma,
                    OperationsWorkingGroupGammaStakingManager,
                >(group);
            }
        }
    }
}

fn run_create_terminate_group_leader_role_proposal_with_slashing_execution_succeeds<
    T: working_group::Config<I> + frame_system::Config,
    I: frame_support::traits::Instance,
    SM: staking_handler::StakingHandler<
        <T as frame_system::Config>::AccountId,
        <T as pallet_balances::Config>::Balance,
        <T as common::membership::MembershipTypes>::MemberId,
        LockIdentifier,
    >,
>(
    working_group: WorkingGroup,
) where
    <T as frame_system::Config>::AccountId: From<[u8; 32]>,
    <T as common::membership::MembershipTypes>::MemberId: From<u64>,
    <T as common::membership::MembershipTypes>::ActorId: Into<u64>,
    <T as pallet_balances::Config>::Balance: From<u128>,
    <T as frame_system::Config>::BlockNumber: Into<u32>,
{
    initial_test_ext().execute_with(|| {
        // start at block 1
        run_to_block(1);

        let member_id: u64 = create_new_members(1)[0];
        let account_id: [u8; 32] = account_from_member_id(member_id).into();
        let stake_amount = <Runtime as working_group::Config<
            MembershipWorkingGroupInstance,>>::MinimumApplicationStake::get();

        let stake_policy = working_group::StakePolicy {
            stake_amount,
            leaving_unstaking_period:
                <T as working_group::Config<I>>::MinUnstakingPeriodLimit::get().into(),
        };

        increase_total_balance_issuance_using_account_id(account_id.into(), stake_amount * 2);

        let stake_parameters = StakeParameters {
            stake: stake_amount.into(),
            staking_account_id: account_id.into(),
        };

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

        set_mint_capacity::<T, I>(
            member_id,
            account_id,
            999999,
            2,
            false,
            working_group,
            BalanceKind::Positive,
        );

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
            stake_amount.into(),
            4,
            working_group,
        );

        assert!(WorkingGroupInstance::<T, I>::current_lead().is_none());

        let new_balance = Balances::usable_balance(&account_id.into());
        let new_stake: working_group::BalanceOf<T> = SM::current_stake(&account_id.into());

        assert_eq!(new_stake, 0.into());
        assert_eq!(
            new_balance,
            old_balance - <Runtime as membership::Config>::CandidateStake::get()
        );
    });
}
