use super::*;

use proposals_engine::BalanceOf;

use srml_support::StorageLinkedMap;
use system::RawOrigin;

use common::working_group::WorkingGroup;
use hiring::ActivateOpeningAt;
use proposals_codex::AddOpeningParameters;
use working_group::OpeningPolicyCommitment;

use crate::StorageWorkingGroupInstance;
use rstd::collections::btree_set::BTreeSet;

type StorageWorkingGroup = working_group::Module<Runtime, StorageWorkingGroupInstance>;

type Hiring = hiring::Module<Runtime>;

fn add_opening(
    member_id: u8,
    account_id: [u8; 32],
    activate_at: hiring::ActivateOpeningAt<u32>,
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
                commitment: OpeningPolicyCommitment::default(),
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
) {
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
                reward_policy: None,
                working_group: WorkingGroup::Storage,
            },
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

        let opening_id = add_opening(member_id, account_id, ActivateOpeningAt::CurrentBlock);

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

        fill_opening(member_id, account_id, opening_id, expected_application_id);

        let lead = StorageWorkingGroup::current_lead();
        assert!(lead.is_some());
    });
}
