mod fixtures;
mod mock;

use crate::types::{OpeningPolicyCommitment, RewardPolicy};
use crate::{Error, Lead, RawEvent};
use common::constraints::InputValidationLengthConstraint;
use mock::{
    build_test_externalities, Test, TestEvent, TestWorkingGroup, TestWorkingGroupInstance,
    STORAGE_WORKING_GROUP_CONSTRAINT_DIFF, STORAGE_WORKING_GROUP_CONSTRAINT_MIN,
    STORAGE_WORKING_GROUP_MINT_CAPACITY,
};
use srml_support::{StorageLinkedMap, StorageValue};
use std::collections::BTreeMap;
use system::RawOrigin;

use fixtures::*;

#[test]
fn set_lead_succeeds() {
    build_test_externalities().execute_with(|| {
        // Ensure that lead is default
        assert_eq!(TestWorkingGroup::current_lead(), None);

        let lead_account_id = 1;
        let lead_member_id = 1;

        // Set lead
        assert_eq!(
            TestWorkingGroup::set_lead(RawOrigin::Root.into(), lead_member_id, lead_account_id),
            Ok(())
        );

        let lead = Lead {
            member_id: lead_member_id,
            role_account_id: lead_account_id,
        };
        assert_eq!(TestWorkingGroup::current_lead(), Some(lead));

        EventFixture::assert_crate_events(vec![RawEvent::LeaderSet(
            lead_member_id,
            lead_account_id,
        )]);
    });
}

#[test]
fn add_worker_opening_succeeds() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();

        add_worker_opening_fixture.call_and_assert(Ok(()));

        EventFixture::assert_crate_events(vec![
            RawEvent::LeaderSet(1, lead_account_id),
            RawEvent::WorkerOpeningAdded(0),
        ]);
    });
}

#[test]
fn add_worker_opening_fails_with_lead_is_not_set() {
    build_test_externalities().execute_with(|| {
        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();

        add_worker_opening_fixture.call_and_assert(Err(Error::CurrentLeadNotSet));
    });
}

#[test]
fn add_worker_opening_fails_with_invalid_human_readable_text() {
    build_test_externalities().execute_with(|| {
        SetLeadFixture::set_lead(1);

        <crate::OpeningHumanReadableText<TestWorkingGroupInstance>>::put(
            InputValidationLengthConstraint {
                min: 1,
                max_min_diff: 5,
            },
        );

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default().with_text(Vec::new());

        add_worker_opening_fixture.call_and_assert(Err(Error::Other("OpeningTextTooShort")));

        let add_worker_opening_fixture =
            AddWorkerOpeningFixture::default().with_text(b"Long text".to_vec());

        add_worker_opening_fixture.call_and_assert(Err(Error::Other("OpeningTextTooLong")));
    });
}

#[test]
fn add_worker_opening_fails_with_hiring_error() {
    build_test_externalities().execute_with(|| {
        SetLeadFixture::set_lead(1);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default()
            .with_activate_at(hiring::ActivateOpeningAt::ExactBlock(0));

        add_worker_opening_fixture.call_and_assert(Err(Error::AddWorkerOpeningActivatesInThePast));
    });
}

#[test]
fn accept_worker_applications_succeeds() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default()
            .with_activate_at(hiring::ActivateOpeningAt::ExactBlock(5));
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let accept_worker_applications_fixture =
            AcceptWorkerApplicationsFixture::default_for_opening_id(opening_id);
        accept_worker_applications_fixture.call_and_assert(Ok(()));

        EventFixture::assert_crate_events(vec![
            RawEvent::LeaderSet(1, lead_account_id),
            RawEvent::WorkerOpeningAdded(opening_id),
            RawEvent::AcceptedWorkerApplications(opening_id),
        ]);
    });
}

#[test]
fn accept_worker_applications_fails_with_hiring_error() {
    build_test_externalities().execute_with(|| {
        SetLeadFixture::set_lead(1);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let accept_worker_applications_fixture =
            AcceptWorkerApplicationsFixture::default_for_opening_id(opening_id);
        accept_worker_applications_fixture.call_and_assert(Err(
            Error::AcceptWorkerApplicationsOpeningIsNotWaitingToBegin,
        ));
    });
}

#[test]
fn accept_worker_applications_fails_with_not_lead() {
    build_test_externalities().execute_with(|| {
        SetLeadFixture::set_lead(1);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        SetLeadFixture::set_lead(2);

        let opening_id = 0; // newly created opening

        let accept_worker_applications_fixture =
            AcceptWorkerApplicationsFixture::default_for_opening_id(opening_id);
        accept_worker_applications_fixture.call_and_assert(Err(Error::IsNotLeadAccount));
    });
}

#[test]
fn accept_worker_applications_fails_with_no_opening() {
    build_test_externalities().execute_with(|| {
        SetLeadFixture::set_lead(1);

        let opening_id = 0; // newly created opening

        let accept_worker_applications_fixture =
            AcceptWorkerApplicationsFixture::default_for_opening_id(opening_id);
        accept_worker_applications_fixture.call_and_assert(Err(Error::WorkerOpeningDoesNotExist));
    });
}

#[test]
fn apply_on_worker_opening_succeeds() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        setup_members(2);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let appy_on_worker_opening_fixture =
            ApplyOnWorkerOpeningFixture::default_for_opening_id(opening_id);
        appy_on_worker_opening_fixture.call_and_assert(Ok(()));

        EventFixture::assert_global_events(vec![
            TestEvent::working_group_TestWorkingGroupInstance(RawEvent::LeaderSet(
                1,
                lead_account_id,
            )),
            TestEvent::membership_mod(membership::members::RawEvent::MemberRegistered(0, 0)),
            TestEvent::membership_mod(membership::members::RawEvent::MemberRegistered(1, 1)),
            TestEvent::working_group_TestWorkingGroupInstance(RawEvent::WorkerOpeningAdded(
                opening_id,
            )),
            TestEvent::working_group_TestWorkingGroupInstance(RawEvent::AppliedOnWorkerOpening(
                opening_id, 0,
            )),
        ]);
    });
}

#[test]
fn apply_on_worker_opening_fails_with_no_opening() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        setup_members(2);

        let opening_id = 0; // newly created opening

        let appy_on_worker_opening_fixture =
            ApplyOnWorkerOpeningFixture::default_for_opening_id(opening_id);
        appy_on_worker_opening_fixture.call_and_assert(Err(Error::WorkerOpeningDoesNotExist));
    });
}

#[test]
fn apply_on_worker_opening_fails_with_not_set_members() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let appy_on_worker_opening_fixture =
            ApplyOnWorkerOpeningFixture::default_for_opening_id(opening_id);
        appy_on_worker_opening_fixture
            .call_and_assert(Err(Error::OriginIsNeitherMemberControllerOrRoot));
    });
}

#[test]
fn apply_on_worker_opening_fails_with_hiring_error() {
    build_test_externalities().execute_with(|| {
        increase_total_balance_issuance_using_account_id(1, 500000);

        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        setup_members(2);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let appy_on_worker_opening_fixture =
            ApplyOnWorkerOpeningFixture::default_for_opening_id(opening_id)
                .with_application_stake(100);
        appy_on_worker_opening_fixture
            .call_and_assert(Err(Error::AddWorkerOpeningStakeProvidedWhenRedundant));
    });
}

#[test]
fn apply_on_worker_opening_fails_with_invalid_application_stake() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        setup_members(2);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let appy_on_worker_opening_fixture =
            ApplyOnWorkerOpeningFixture::default_for_opening_id(opening_id)
                .with_application_stake(100);
        appy_on_worker_opening_fixture.call_and_assert(Err(Error::InsufficientBalanceToApply));
    });
}

#[test]
fn apply_on_worker_opening_fails_with_invalid_role_stake() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        setup_members(2);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let appy_on_worker_opening_fixture =
            ApplyOnWorkerOpeningFixture::default_for_opening_id(opening_id).with_role_stake(100);
        appy_on_worker_opening_fixture.call_and_assert(Err(Error::InsufficientBalanceToApply));
    });
}

#[test]
fn apply_on_worker_opening_fails_with_invalid_text() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        setup_members(2);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        <crate::WorkerApplicationHumanReadableText<TestWorkingGroupInstance>>::put(
            InputValidationLengthConstraint {
                min: 1,
                max_min_diff: 5,
            },
        );

        let appy_on_worker_opening_fixture =
            ApplyOnWorkerOpeningFixture::default_for_opening_id(opening_id).with_text(Vec::new());
        appy_on_worker_opening_fixture
            .call_and_assert(Err(Error::Other("WorkerApplicationTextTooShort")));

        let appy_on_worker_opening_fixture =
            ApplyOnWorkerOpeningFixture::default_for_opening_id(opening_id)
                .with_text(b"Long text".to_vec());
        appy_on_worker_opening_fixture
            .call_and_assert(Err(Error::Other("WorkerApplicationTextTooLong")));
    });
}

#[test]
fn apply_on_worker_opening_fails_with_already_active_application() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        setup_members(2);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let appy_on_worker_opening_fixture =
            ApplyOnWorkerOpeningFixture::default_for_opening_id(opening_id);
        appy_on_worker_opening_fixture.call_and_assert(Ok(()));

        appy_on_worker_opening_fixture
            .call_and_assert(Err(Error::MemberHasActiveApplicationOnOpening));
    });
}

#[test]
fn withdraw_worker_application_succeeds() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        setup_members(2);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let appy_on_worker_opening_fixture =
            ApplyOnWorkerOpeningFixture::default_for_opening_id(opening_id);
        appy_on_worker_opening_fixture.call_and_assert(Ok(()));

        let application_id = 0; // newly created application

        let withdraw_application_fixture =
            WithdrawApplicationFixture::default_for_application_id(application_id);
        withdraw_application_fixture.call_and_assert(Ok(()));

        EventFixture::assert_global_events(vec![
            TestEvent::working_group_TestWorkingGroupInstance(RawEvent::LeaderSet(
                1,
                lead_account_id,
            )),
            TestEvent::membership_mod(membership::members::RawEvent::MemberRegistered(0, 0)),
            TestEvent::membership_mod(membership::members::RawEvent::MemberRegistered(1, 1)),
            TestEvent::working_group_TestWorkingGroupInstance(RawEvent::WorkerOpeningAdded(
                opening_id,
            )),
            TestEvent::working_group_TestWorkingGroupInstance(RawEvent::AppliedOnWorkerOpening(
                opening_id,
                application_id,
            )),
            TestEvent::working_group_TestWorkingGroupInstance(
                RawEvent::WorkerApplicationWithdrawn(application_id),
            ),
        ]);
    });
}

#[test]
fn withdraw_worker_application_fails_invalid_application_id() {
    build_test_externalities().execute_with(|| {
        let invalid_application_id = 6;

        let withdraw_application_fixture =
            WithdrawApplicationFixture::default_for_application_id(invalid_application_id);
        withdraw_application_fixture.call_and_assert(Err(Error::WorkerApplicationDoesNotExist));
    });
}

#[test]
fn withdraw_worker_application_fails_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        setup_members(2);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let appy_on_worker_opening_fixture =
            ApplyOnWorkerOpeningFixture::default_for_opening_id(opening_id);
        appy_on_worker_opening_fixture.call_and_assert(Ok(()));

        let application_id = 0; // newly created application

        let withdraw_application_fixture =
            WithdrawApplicationFixture::default_for_application_id(application_id)
                .with_origin(RawOrigin::None);
        withdraw_application_fixture.call_and_assert(Err(Error::Other("RequireSignedOrigin")));
    });
}

#[test]
fn withdraw_worker_application_fails_with_invalid_application_author() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        setup_members(2);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let appy_on_worker_opening_fixture =
            ApplyOnWorkerOpeningFixture::default_for_opening_id(opening_id);
        appy_on_worker_opening_fixture.call_and_assert(Ok(()));

        let application_id = 0; // newly created application
        let invalid_author_account_id = 55;
        let withdraw_application_fixture =
            WithdrawApplicationFixture::default_for_application_id(application_id)
                .with_signer(invalid_author_account_id);
        withdraw_application_fixture.call_and_assert(Err(Error::OriginIsNotApplicant));
    });
}

#[test]
fn withdraw_worker_application_fails_with_hiring_error() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        setup_members(2);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let appy_on_worker_opening_fixture =
            ApplyOnWorkerOpeningFixture::default_for_opening_id(opening_id);
        appy_on_worker_opening_fixture.call_and_assert(Ok(()));

        let application_id = 0; // newly created application

        let withdraw_application_fixture =
            WithdrawApplicationFixture::default_for_application_id(application_id);
        withdraw_application_fixture.call_and_assert(Ok(()));
        withdraw_application_fixture
            .call_and_assert(Err(Error::WithdrawWorkerApplicationApplicationNotActive));
    });
}

#[test]
fn terminate_worker_application_succeeds() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        setup_members(2);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let appy_on_worker_opening_fixture =
            ApplyOnWorkerOpeningFixture::default_for_opening_id(opening_id);
        appy_on_worker_opening_fixture.call_and_assert(Ok(()));

        let application_id = 0; // newly created application

        let terminate_application_fixture =
            TerminateApplicationFixture::default_for_application_id(application_id);
        terminate_application_fixture.call_and_assert(Ok(()));

        EventFixture::assert_global_events(vec![
            TestEvent::working_group_TestWorkingGroupInstance(RawEvent::LeaderSet(
                1,
                lead_account_id,
            )),
            TestEvent::membership_mod(membership::members::RawEvent::MemberRegistered(0, 0)),
            TestEvent::membership_mod(membership::members::RawEvent::MemberRegistered(1, 1)),
            TestEvent::working_group_TestWorkingGroupInstance(RawEvent::WorkerOpeningAdded(
                opening_id,
            )),
            TestEvent::working_group_TestWorkingGroupInstance(RawEvent::AppliedOnWorkerOpening(
                opening_id,
                application_id,
            )),
            TestEvent::working_group_TestWorkingGroupInstance(
                RawEvent::WorkerApplicationTerminated(application_id),
            ),
        ]);
    });
}

#[test]
fn terminate_worker_application_fails_with_invalid_application_author() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        setup_members(2);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let appy_on_worker_opening_fixture =
            ApplyOnWorkerOpeningFixture::default_for_opening_id(opening_id);
        appy_on_worker_opening_fixture.call_and_assert(Ok(()));

        let application_id = 0; // newly created application
        let invalid_author_account_id = 55;
        let terminate_application_fixture =
            TerminateApplicationFixture::default_for_application_id(application_id)
                .with_signer(invalid_author_account_id);
        terminate_application_fixture.call_and_assert(Err(Error::IsNotLeadAccount));
    });
}

#[test]
fn terminate_worker_application_fails_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        setup_members(2);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let appy_on_worker_opening_fixture =
            ApplyOnWorkerOpeningFixture::default_for_opening_id(opening_id);
        appy_on_worker_opening_fixture.call_and_assert(Ok(()));

        let application_id = 0; // newly created application

        let terminate_application_fixture =
            TerminateApplicationFixture::default_for_application_id(application_id)
                .with_origin(RawOrigin::None);
        terminate_application_fixture.call_and_assert(Err(Error::Other("RequireSignedOrigin")));
    });
}

#[test]
fn terminate_worker_application_fails_invalid_application_id() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        let invalid_application_id = 6;

        let terminate_application_fixture =
            TerminateApplicationFixture::default_for_application_id(invalid_application_id);
        terminate_application_fixture.call_and_assert(Err(Error::WorkerApplicationDoesNotExist));
    });
}

#[test]
fn terminate_worker_application_fails_with_hiring_error() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        setup_members(2);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let appy_on_worker_opening_fixture =
            ApplyOnWorkerOpeningFixture::default_for_opening_id(opening_id);
        appy_on_worker_opening_fixture.call_and_assert(Ok(()));

        let application_id = 0; // newly created application

        let terminate_application_fixture =
            TerminateApplicationFixture::default_for_application_id(application_id);
        terminate_application_fixture.call_and_assert(Ok(()));
        terminate_application_fixture
            .call_and_assert(Err(Error::WithdrawWorkerApplicationApplicationNotActive));
    });
}

#[test]
fn begin_review_worker_applications_succeeds() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let begin_review_worker_applications_fixture =
            BeginReviewWorkerApplicationsFixture::default_for_opening_id(opening_id);
        begin_review_worker_applications_fixture.call_and_assert(Ok(()));

        EventFixture::assert_crate_events(vec![
            RawEvent::LeaderSet(1, lead_account_id),
            RawEvent::WorkerOpeningAdded(opening_id),
            RawEvent::BeganWorkerApplicationReview(opening_id),
        ]);
    });
}

#[test]
fn begin_review_worker_applications_fails_with_not_a_lead() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let new_lead_account_id = 33;
        SetLeadFixture::set_lead(new_lead_account_id);

        let opening_id = 0; // newly created opening

        let begin_review_worker_applications_fixture =
            BeginReviewWorkerApplicationsFixture::default_for_opening_id(opening_id);
        begin_review_worker_applications_fixture.call_and_assert(Err(Error::IsNotLeadAccount));
    });
}

#[test]
fn begin_review_worker_applications_fails_with_invalid_opening() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        let invalid_opening_id = 6; // newly created opening

        let begin_review_worker_applications_fixture =
            BeginReviewWorkerApplicationsFixture::default_for_opening_id(invalid_opening_id);
        begin_review_worker_applications_fixture
            .call_and_assert(Err(Error::WorkerOpeningDoesNotExist));
    });
}

#[test]
fn begin_review_worker_applications_with_hiring_error() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let begin_review_worker_applications_fixture =
            BeginReviewWorkerApplicationsFixture::default_for_opening_id(opening_id);
        begin_review_worker_applications_fixture.call_and_assert(Ok(()));
        begin_review_worker_applications_fixture.call_and_assert(Err(
            Error::BeginWorkerApplicantReviewOpeningOpeningIsNotWaitingToBegin,
        ));
    });
}

#[test]
fn begin_review_worker_applications_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let begin_review_worker_applications_fixture =
            BeginReviewWorkerApplicationsFixture::default_for_opening_id(opening_id)
                .with_origin(RawOrigin::None);
        begin_review_worker_applications_fixture
            .call_and_assert(Err(Error::Other("RequireSignedOrigin")));
    });
}

#[test]
fn fill_worker_opening_succeeds() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);
        increase_total_balance_issuance_using_account_id(1, 10000);
        setup_members(2);

        let add_worker_opening_fixture =
            AddWorkerOpeningFixture::default().with_policy_commitment(OpeningPolicyCommitment {
                role_staking_policy: Some(hiring::StakingPolicy {
                    amount: 10,
                    amount_mode: hiring::StakingAmountLimitMode::AtLeast,
                    crowded_out_unstaking_period_length: None,
                    review_period_expired_unstaking_period_length: None,
                }),
                ..OpeningPolicyCommitment::default()
            });
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let appy_on_worker_opening_fixture =
            ApplyOnWorkerOpeningFixture::default_for_opening_id(opening_id).with_role_stake(10);
        appy_on_worker_opening_fixture.call_and_assert(Ok(()));

        let application_id = 0; // newly created application

        let begin_review_worker_applications_fixture =
            BeginReviewWorkerApplicationsFixture::default_for_opening_id(opening_id);
        begin_review_worker_applications_fixture.call_and_assert(Ok(()));

        let mint_id = create_mint();
        set_mint_id(mint_id);

        let fill_worker_opening_fixture =
            FillWorkerOpeningFixture::default_for_ids(opening_id, vec![application_id])
                .with_reward_policy(RewardPolicy {
                    amount_per_payout: 1000,
                    next_payment_at_block: 20,
                    payout_interval: None,
                });
        fill_worker_opening_fixture.call_and_assert(Ok(()));

        let worker_id = 0; // newly created worker
        let mut worker_application_dictionary = BTreeMap::new();
        worker_application_dictionary.insert(application_id, worker_id);

        EventFixture::assert_last_crate_event(RawEvent::WorkerOpeningFilled(
            opening_id,
            worker_application_dictionary,
        ));
    });
}

#[test]
fn fill_worker_opening_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let fill_worker_opening_fixture =
            FillWorkerOpeningFixture::default_for_ids(opening_id, Vec::new())
                .with_origin(RawOrigin::None);
        fill_worker_opening_fixture.call_and_assert(Err(Error::Other("RequireSignedOrigin")));
    });
}

#[test]
fn fill_worker_opening_fails_with_not_a_lead() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let new_lead_account_id = 33;
        SetLeadFixture::set_lead(new_lead_account_id);

        let opening_id = 0; // newly created opening

        let fill_worker_opening_fixture =
            FillWorkerOpeningFixture::default_for_ids(opening_id, Vec::new());
        fill_worker_opening_fixture.call_and_assert(Err(Error::IsNotLeadAccount));
    });
}

#[test]
fn fill_worker_opening_fails_with_invalid_opening() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        let invalid_opening_id = 6; // newly created opening

        let fill_worker_opening_fixture =
            FillWorkerOpeningFixture::default_for_ids(invalid_opening_id, Vec::new());
        fill_worker_opening_fixture.call_and_assert(Err(Error::WorkerOpeningDoesNotExist));
    });
}

#[test]
fn fill_worker_opening_fails_with_invalid_application_list() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        setup_members(2);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let appy_on_worker_opening_fixture =
            ApplyOnWorkerOpeningFixture::default_for_opening_id(opening_id);
        appy_on_worker_opening_fixture.call_and_assert(Ok(()));

        let application_id = 0; // newly created application

        let begin_review_worker_applications_fixture =
            BeginReviewWorkerApplicationsFixture::default_for_opening_id(opening_id);
        begin_review_worker_applications_fixture.call_and_assert(Ok(()));

        let invalid_application_id = 66;
        let fill_worker_opening_fixture = FillWorkerOpeningFixture::default_for_ids(
            opening_id,
            vec![application_id, invalid_application_id],
        );
        fill_worker_opening_fixture
            .call_and_assert(Err(Error::SuccessfulWorkerApplicationDoesNotExist));
    });
}

#[test]
fn fill_worker_opening_fails_with_invalid_application_with_hiring_error() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        setup_members(2);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let fill_worker_opening_fixture =
            FillWorkerOpeningFixture::default_for_ids(opening_id, Vec::new());
        fill_worker_opening_fixture
            .call_and_assert(Err(Error::FullWorkerOpeningOpeningNotInReviewPeriodStage));
    });
}

#[test]
fn fill_worker_opening_fails_with_invalid_reward_policy() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        setup_members(2);

        let add_worker_opening_fixture = AddWorkerOpeningFixture::default();
        add_worker_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let appy_on_worker_opening_fixture =
            ApplyOnWorkerOpeningFixture::default_for_opening_id(opening_id);
        appy_on_worker_opening_fixture.call_and_assert(Ok(()));

        let application_id = 0; // newly created application

        let begin_review_worker_applications_fixture =
            BeginReviewWorkerApplicationsFixture::default_for_opening_id(opening_id);
        begin_review_worker_applications_fixture.call_and_assert(Ok(()));

        let fill_worker_opening_fixture =
            FillWorkerOpeningFixture::default_for_ids(opening_id, vec![application_id])
                .with_reward_policy(RewardPolicy {
                    amount_per_payout: 10000,
                    // Invalid next payment at block zero
                    next_payment_at_block: 0,
                    payout_interval: None,
                });
        fill_worker_opening_fixture
            .call_and_assert(Err(Error::FillWorkerOpeningInvalidNextPaymentBlock));
    });
}

#[test]
fn unset_lead_succeeds() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        let lead_member_id = 1;

        SetLeadFixture::set_lead(lead_account_id);

        let lead = Lead {
            member_id: lead_member_id,
            role_account_id: lead_account_id,
        };
        assert_eq!(TestWorkingGroup::current_lead(), Some(lead));

        UnsetLeadFixture::unset_lead();

        assert_eq!(TestWorkingGroup::current_lead(), None);

        EventFixture::assert_crate_events(vec![
            RawEvent::LeaderSet(lead_member_id, lead_account_id),
            RawEvent::LeaderUnset(lead_member_id, lead_account_id),
        ]);
    });
}

#[test]
fn unset_lead_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        UnsetLeadFixture::call_and_assert(RawOrigin::None, Err(Error::RequireRootOrigin));
    });
}

#[test]
fn unset_lead_fails_with_no_lead() {
    build_test_externalities().execute_with(|| {
        UnsetLeadFixture::call_and_assert(RawOrigin::Root, Err(Error::CurrentLeadNotSet));
    });
}

#[test]
fn set_lead_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        SetLeadFixture::call_and_assert(RawOrigin::None, 1, 1, Err(Error::RequireRootOrigin));
    });
}

#[test]
fn update_worker_role_account_succeeds() {
    build_test_externalities().execute_with(|| {
        let new_account_id = 10;
        let worker_id = fill_default_worker_position();

        let update_worker_account_fixture =
            UpdateWorkerRoleAccountFixture::default_with_ids(worker_id, new_account_id);

        update_worker_account_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::WorkerRoleAccountUpdated(
            worker_id,
            new_account_id,
        ));
    });
}

#[test]
fn update_worker_role_account_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let worker_id = fill_default_worker_position();
        let update_worker_account_fixture =
            UpdateWorkerRoleAccountFixture::default_with_ids(worker_id, 1)
                .with_origin(RawOrigin::None);

        update_worker_account_fixture.call_and_assert(Err(Error::MembershipUnsignedOrigin));
    });
}

#[test]
fn update_worker_reward_account_succeeds() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        let worker_id = fill_default_worker_position();

        let update_worker_account_fixture =
            UpdateWorkerRewardAccountFixture::default_with_ids(worker_id, lead_account_id);

        update_worker_account_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::WorkerRewardAccountUpdated(
            worker_id,
            lead_account_id,
        ));
    });
}

#[test]
fn update_worker_reward_account_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let update_worker_account_fixture =
            UpdateWorkerRewardAccountFixture::default_with_ids(1, 1).with_origin(RawOrigin::None);

        update_worker_account_fixture.call_and_assert(Err(Error::Other("RequireSignedOrigin")));
    });
}

#[test]
fn update_worker_reward_account_fails_with_invalid_origin_signed_account() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        let worker_id = fill_default_worker_position();

        let update_worker_account_fixture =
            UpdateWorkerRewardAccountFixture::default_with_ids(worker_id, lead_account_id)
                .with_origin(RawOrigin::Signed(2));

        update_worker_account_fixture.call_and_assert(Err(Error::SignerIsNotWorkerRoleAccount));
    });
}

fn fill_default_worker_position() -> u64 {
    fill_worker_position(
        Some(RewardPolicy {
            amount_per_payout: 1000,
            next_payment_at_block: 20,
            payout_interval: None,
        }),
        None,
        true,
    )
}

fn fill_worker_position_with_no_reward() -> u64 {
    fill_worker_position(None, None, true)
}

fn fill_worker_position_with_stake(stake: u64) -> u64 {
    fill_worker_position(
        Some(RewardPolicy {
            amount_per_payout: 1000,
            next_payment_at_block: 20,
            payout_interval: None,
        }),
        Some(stake),
        true,
    )
}

fn fill_worker_position(
    reward_policy: Option<RewardPolicy<u64, u64>>,
    role_stake: Option<u64>,
    setup_environment: bool,
) -> u64 {
    if setup_environment {
        let lead_account_id = 1;

        SetLeadFixture::set_lead(lead_account_id);
        increase_total_balance_issuance_using_account_id(1, 10000);
        setup_members(2);
    }

    let mut add_worker_opening_fixture = AddWorkerOpeningFixture::default();
    if let Some(stake) = role_stake.clone() {
        add_worker_opening_fixture =
            add_worker_opening_fixture.with_policy_commitment(OpeningPolicyCommitment {
                role_staking_policy: Some(hiring::StakingPolicy {
                    amount: stake,
                    amount_mode: hiring::StakingAmountLimitMode::AtLeast,
                    crowded_out_unstaking_period_length: None,
                    review_period_expired_unstaking_period_length: None,
                }),
                ..OpeningPolicyCommitment::default()
            });
    }

    let opening_id = add_worker_opening_fixture.call_and_assert(Ok(()));

    let mut appy_on_worker_opening_fixture =
        ApplyOnWorkerOpeningFixture::default_for_opening_id(opening_id);
    if let Some(stake) = role_stake.clone() {
        appy_on_worker_opening_fixture = appy_on_worker_opening_fixture.with_role_stake(stake);
    }
    let application_id = appy_on_worker_opening_fixture.call_and_assert(Ok(()));

    let begin_review_worker_applications_fixture =
        BeginReviewWorkerApplicationsFixture::default_for_opening_id(opening_id);
    begin_review_worker_applications_fixture.call_and_assert(Ok(()));

    let mint_id = create_mint();
    set_mint_id(mint_id);

    let mut fill_worker_opening_fixture =
        FillWorkerOpeningFixture::default_for_ids(opening_id, vec![application_id]);

    if let Some(reward_policy) = reward_policy {
        fill_worker_opening_fixture = fill_worker_opening_fixture.with_reward_policy(reward_policy);
    }

    let worker_id = fill_worker_opening_fixture.call_and_assert(Ok(()));

    worker_id
}

#[test]
fn update_worker_reward_account_fails_with_invalid_worker_id() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        let invalid_worker_id = 1;
        fill_default_worker_position();

        let update_worker_account_fixture =
            UpdateWorkerRewardAccountFixture::default_with_ids(invalid_worker_id, lead_account_id);

        update_worker_account_fixture.call_and_assert(Err(Error::WorkerDoesNotExist));
    });
}

#[test]
fn update_worker_reward_account_fails_with_no_recurring_reward() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        let worker_id = fill_worker_position_with_no_reward();

        let update_worker_account_fixture =
            UpdateWorkerRewardAccountFixture::default_with_ids(worker_id, lead_account_id);

        update_worker_account_fixture.call_and_assert(Err(Error::WorkerHasNoReward));
    });
}

#[test]
fn leave_worker_role_succeeds() {
    build_test_externalities().execute_with(|| {
        let worker_id = fill_default_worker_position();

        let leave_worker_role_fixture = LeaveWorkerRoleFixture::default_for_worker_id(worker_id);

        leave_worker_role_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::WorkerExited(
            worker_id,
            b"rationale_text".to_vec(),
        ));
    });
}

#[test]
fn leave_worker_role_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let leave_worker_role_fixture =
            LeaveWorkerRoleFixture::default_for_worker_id(1).with_origin(RawOrigin::None);

        leave_worker_role_fixture.call_and_assert(Err(Error::Other("RequireSignedOrigin")));
    });
}

#[test]
fn leave_worker_role_fails_with_invalid_origin_signed_account() {
    build_test_externalities().execute_with(|| {
        let worker_id = fill_default_worker_position();

        let leave_worker_role_fixture = LeaveWorkerRoleFixture::default_for_worker_id(worker_id)
            .with_origin(RawOrigin::Signed(2));

        leave_worker_role_fixture.call_and_assert(Err(Error::SignerIsNotWorkerRoleAccount));
    });
}

#[test]
fn leave_worker_role_fails_with_invalid_worker_id() {
    build_test_externalities().execute_with(|| {
        let invalid_worker_id = 1;
        fill_default_worker_position();

        let leave_worker_role_fixture =
            LeaveWorkerRoleFixture::default_for_worker_id(invalid_worker_id);

        leave_worker_role_fixture.call_and_assert(Err(Error::WorkerDoesNotExist));
    });
}

#[test]
fn leave_worker_role_fails_with_invalid_recurring_reward_relationships() {
    build_test_externalities().execute_with(|| {
        let worker_id = fill_default_worker_position();

        let mut worker = TestWorkingGroup::worker_by_id(worker_id);
        worker.reward_relationship = Some(2);

        <crate::WorkerById<Test, TestWorkingGroupInstance>>::insert(worker_id, worker);

        let leave_worker_role_fixture = LeaveWorkerRoleFixture::default_for_worker_id(worker_id);

        leave_worker_role_fixture.call_and_assert(Err(Error::RelationshipMustExist));
    });
}

#[test]
fn leave_worker_role_succeeds_with_stakes() {
    build_test_externalities().execute_with(|| {
        let worker_id = fill_worker_position_with_stake(100);

        let leave_worker_role_fixture = LeaveWorkerRoleFixture::default_for_worker_id(worker_id);

        leave_worker_role_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::WorkerExited(
            worker_id,
            b"rationale_text".to_vec(),
        ));
    });
}

#[test]
fn terminate_worker_role_succeeds_with_stakes() {
    build_test_externalities().execute_with(|| {
        let worker_id = fill_worker_position_with_stake(100);

        let terminate_worker_role_fixture =
            TerminateWorkerRoleFixture::default_for_worker_id(worker_id);

        terminate_worker_role_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::TerminatedWorker(
            worker_id,
            b"rationale_text".to_vec(),
        ));
    });
}

#[test]
fn terminate_worker_role_succeeds() {
    build_test_externalities().execute_with(|| {
        let worker_id = fill_default_worker_position();

        let terminate_worker_role_fixture =
            TerminateWorkerRoleFixture::default_for_worker_id(worker_id);

        terminate_worker_role_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::TerminatedWorker(
            worker_id,
            b"rationale_text".to_vec(),
        ));
    });
}

#[test]
fn terminate_worker_role_fails_with_invalid_text() {
    build_test_externalities().execute_with(|| {
        let worker_id = fill_default_worker_position();

        let terminate_worker_role_fixture =
            TerminateWorkerRoleFixture::default_for_worker_id(worker_id).with_text(Vec::new());
        terminate_worker_role_fixture
            .call_and_assert(Err(Error::Other("WorkerExitRationaleTextTooShort")));

        let terminate_worker_role_fixture =
            TerminateWorkerRoleFixture::default_for_worker_id(worker_id)
                .with_text(b"MSG_WORKER_EXIT_RATIONALE_TEXT_TOO_LONG".to_vec());
        terminate_worker_role_fixture
            .call_and_assert(Err(Error::Other("WorkerExitRationaleTextTooLong")));
    });
}

#[test]
fn terminate_worker_role_fails_with_unset_lead() {
    build_test_externalities().execute_with(|| {
        let worker_id = fill_default_worker_position();

        UnsetLeadFixture::unset_lead();

        let terminate_worker_role_fixture =
            TerminateWorkerRoleFixture::default_for_worker_id(worker_id);

        terminate_worker_role_fixture.call_and_assert(Err(Error::CurrentLeadNotSet));
    });
}

#[test]
fn terminate_worker_role_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let terminate_worker_role_fixture =
            TerminateWorkerRoleFixture::default_for_worker_id(1).with_origin(RawOrigin::None);

        terminate_worker_role_fixture.call_and_assert(Err(Error::Other("RequireSignedOrigin")));
    });
}

#[test]
fn increase_worker_stake_succeeds() {
    build_test_externalities().execute_with(|| {
        let worker_id = fill_worker_position_with_stake(100);

        let increase_stake_fixture = IncreaseWorkerStakeFixture::default_for_worker_id(worker_id);

        increase_stake_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::WorkerStakeIncreased(worker_id));
    });
}

#[test]
fn increase_worker_stake_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let worker_id = 0;
        let increase_stake_fixture = IncreaseWorkerStakeFixture::default_for_worker_id(worker_id)
            .with_origin(RawOrigin::None);

        increase_stake_fixture.call_and_assert(Err(Error::Other("RequireSignedOrigin")));
    });
}

#[test]
fn increase_worker_stake_fails_with_zero_balance() {
    build_test_externalities().execute_with(|| {
        let worker_id = fill_worker_position_with_stake(100);

        let increase_stake_fixture =
            IncreaseWorkerStakeFixture::default_for_worker_id(worker_id).with_balance(0);

        increase_stake_fixture.call_and_assert(Err(Error::StakeBalanceCannotBeZero));
    });
}

#[test]
fn increase_worker_stake_fails_with_invalid_worker_id() {
    build_test_externalities().execute_with(|| {
        let invalid_worker_id = 11;

        let increase_stake_fixture =
            IncreaseWorkerStakeFixture::default_for_worker_id(invalid_worker_id);

        increase_stake_fixture.call_and_assert(Err(Error::WorkerDoesNotExist));
    });
}

#[test]
fn increase_worker_stake_fails_with_invalid_balance() {
    build_test_externalities().execute_with(|| {
        let worker_id = fill_worker_position_with_stake(100);
        let invalid_balance = 100000000;
        let increase_stake_fixture = IncreaseWorkerStakeFixture::default_for_worker_id(worker_id)
            .with_balance(invalid_balance);

        increase_stake_fixture
            .call_and_assert(Err(Error::StakingErrorInsufficientBalanceInSourceAccount));
    });
}

#[test]
fn increase_worker_stake_fails_with_no_stake_profile() {
    build_test_externalities().execute_with(|| {
        let worker_id = fill_default_worker_position();

        let increase_stake_fixture = IncreaseWorkerStakeFixture::default_for_worker_id(worker_id);

        increase_stake_fixture.call_and_assert(Err(Error::NoWorkerStakeProfile));
    });
}

#[test]
fn decrease_worker_stake_succeeds() {
    build_test_externalities().execute_with(|| {
        let worker_id = fill_worker_position_with_stake(100);

        let decrease_stake_fixture = DecreaseWorkerStakeFixture::default_for_worker_id(worker_id);

        decrease_stake_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::WorkerStakeDecreased(worker_id));
    });
}

#[test]
fn decrease_worker_stake_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let worker_id = 0;
        let decrease_stake_fixture = DecreaseWorkerStakeFixture::default_for_worker_id(worker_id)
            .with_origin(RawOrigin::None);

        decrease_stake_fixture.call_and_assert(Err(Error::Other("RequireSignedOrigin")));
    });
}

#[test]
fn decrease_worker_stake_fails_with_zero_balance() {
    build_test_externalities().execute_with(|| {
        let worker_id = fill_worker_position_with_stake(100);

        let decrease_stake_fixture =
            DecreaseWorkerStakeFixture::default_for_worker_id(worker_id).with_balance(0);

        decrease_stake_fixture.call_and_assert(Err(Error::StakeBalanceCannotBeZero));
    });
}

#[test]
fn decrease_worker_stake_fails_with_invalid_worker_id() {
    build_test_externalities().execute_with(|| {
        SetLeadFixture::set_lead(1);
        let invalid_worker_id = 11;

        let decrease_stake_fixture =
            DecreaseWorkerStakeFixture::default_for_worker_id(invalid_worker_id);

        decrease_stake_fixture.call_and_assert(Err(Error::WorkerDoesNotExist));
    });
}

#[test]
fn decrease_worker_stake_fails_with_invalid_balance() {
    build_test_externalities().execute_with(|| {
        let worker_id = fill_worker_position_with_stake(100);
        let invalid_balance = 100000000;
        let decrease_stake_fixture = DecreaseWorkerStakeFixture::default_for_worker_id(worker_id)
            .with_balance(invalid_balance);

        decrease_stake_fixture.call_and_assert(Err(Error::StakingErrorInsufficientStake));
    });
}

#[test]
fn decrease_worker_stake_fails_with_no_stake_profile() {
    build_test_externalities().execute_with(|| {
        let worker_id = fill_default_worker_position();

        let decrease_stake_fixture = DecreaseWorkerStakeFixture::default_for_worker_id(worker_id);

        decrease_stake_fixture.call_and_assert(Err(Error::NoWorkerStakeProfile));
    });
}

#[test]
fn decrease_worker_stake_fails_with_not_set_lead() {
    build_test_externalities().execute_with(|| {
        let invalid_worker_id = 11;

        let decrease_stake_fixture =
            DecreaseWorkerStakeFixture::default_for_worker_id(invalid_worker_id);

        decrease_stake_fixture.call_and_assert(Err(Error::CurrentLeadNotSet));
    });
}

#[test]
fn slash_worker_stake_succeeds() {
    build_test_externalities().execute_with(|| {
        let worker_id = fill_worker_position_with_stake(100);

        let slash_stake_fixture = SlashWorkerStakeFixture::default_for_worker_id(worker_id);

        slash_stake_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::WorkerStakeSlashed(worker_id));
    });
}

#[test]
fn slash_worker_stake_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let worker_id = 0;
        let slash_stake_fixture =
            SlashWorkerStakeFixture::default_for_worker_id(worker_id).with_origin(RawOrigin::None);

        slash_stake_fixture.call_and_assert(Err(Error::Other("RequireSignedOrigin")));
    });
}

#[test]
fn slash_worker_stake_fails_with_zero_balance() {
    build_test_externalities().execute_with(|| {
        let worker_id = fill_worker_position_with_stake(100);

        let slash_stake_fixture =
            SlashWorkerStakeFixture::default_for_worker_id(worker_id).with_balance(0);

        slash_stake_fixture.call_and_assert(Err(Error::StakeBalanceCannotBeZero));
    });
}

#[test]
fn slash_worker_stake_fails_with_invalid_worker_id() {
    build_test_externalities().execute_with(|| {
        SetLeadFixture::set_lead(1);
        let invalid_worker_id = 11;

        let slash_stake_fixture = SlashWorkerStakeFixture::default_for_worker_id(invalid_worker_id);

        slash_stake_fixture.call_and_assert(Err(Error::WorkerDoesNotExist));
    });
}

#[test]
fn slash_worker_stake_fails_with_no_stake_profile() {
    build_test_externalities().execute_with(|| {
        let worker_id = fill_default_worker_position();

        let slash_stake_fixture = SlashWorkerStakeFixture::default_for_worker_id(worker_id);

        slash_stake_fixture.call_and_assert(Err(Error::NoWorkerStakeProfile));
    });
}

#[test]
fn slash_worker_stake_fails_with_not_set_lead() {
    build_test_externalities().execute_with(|| {
        let invalid_worker_id = 11;

        let slash_stake_fixture = SlashWorkerStakeFixture::default_for_worker_id(invalid_worker_id);

        slash_stake_fixture.call_and_assert(Err(Error::CurrentLeadNotSet));
    });
}

#[test]
fn get_all_worker_ids_succeeds() {
    build_test_externalities().execute_with(|| {
        let worker_ids = TestWorkingGroup::get_all_worker_ids();
        assert_eq!(worker_ids, Vec::new());

        let worker_id1 = fill_worker_position(None, None, true);
        let worker_id2 = fill_worker_position(None, None, false);

        let mut expected_ids = vec![worker_id1, worker_id2];
        expected_ids.sort();

        let mut worker_ids = TestWorkingGroup::get_all_worker_ids();
        worker_ids.sort();
        assert_eq!(worker_ids, expected_ids);

        <crate::WorkerById<Test, TestWorkingGroupInstance>>::remove(worker_id1);
        let worker_ids = TestWorkingGroup::get_all_worker_ids();
        assert_eq!(worker_ids, vec![worker_id2]);
    });
}

#[test]
fn set_working_group_mint_capacity_succeeds() {
    build_test_externalities().execute_with(|| {
        let mint_id = <minting::Module<Test>>::add_mint(0, None).unwrap();
        <crate::Mint<Test, TestWorkingGroupInstance>>::put(mint_id);

        let capacity = 15000;
        let result = TestWorkingGroup::set_mint_capacity(RawOrigin::Root.into(), capacity);

        assert_eq!(result, Ok(()));

        let mint = <minting::Module<Test>>::mints(mint_id);
        assert_eq!(mint.capacity(), capacity);
    });
}

#[test]
fn set_working_group_mint_capacity_fails_with_mint_not_found() {
    build_test_externalities().execute_with(|| {
        let capacity = 15000;

        <crate::Mint<Test, TestWorkingGroupInstance>>::put(5); // random mint id
        let result = TestWorkingGroup::set_mint_capacity(RawOrigin::Root.into(), capacity);

        assert_eq!(result, Err(Error::CannotFindMint));
    });
}

#[test]
fn set_working_group_mint_capacity_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let capacity = 15000;
        let result = TestWorkingGroup::set_mint_capacity(RawOrigin::None.into(), capacity);

        assert_eq!(result, Err(Error::RequireRootOrigin));
    });
}

#[test]
fn ensure_setting_genesis_storage_working_group_mint_succeeds() {
    build_test_externalities().execute_with(|| {
        let mint_id = TestWorkingGroup::mint();

        assert!(minting::Mints::<Test>::exists(mint_id));

        let mint = <minting::Module<Test>>::mints(mint_id);
        assert_eq!(mint.capacity(), STORAGE_WORKING_GROUP_MINT_CAPACITY);
    });
}

#[test]
fn ensure_setting_genesis_constraints_succeeds() {
    build_test_externalities().execute_with(|| {
        let default_constraint = common::constraints::InputValidationLengthConstraint::new(
            STORAGE_WORKING_GROUP_CONSTRAINT_MIN,
            STORAGE_WORKING_GROUP_CONSTRAINT_DIFF,
        );
        let opening_text_constraint = TestWorkingGroup::opening_human_readable_text();
        let worker_text_constraint = TestWorkingGroup::worker_application_human_readable_text();
        let worker_exit_text_constraint = TestWorkingGroup::worker_exit_rationale_text();

        assert_eq!(opening_text_constraint, default_constraint);
        assert_eq!(worker_text_constraint, default_constraint);
        assert_eq!(worker_exit_text_constraint, default_constraint);
    });
}
