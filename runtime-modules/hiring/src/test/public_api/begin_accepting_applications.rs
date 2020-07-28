use crate::mock::*;
use crate::test::*;
use sp_std::collections::btree_set::BTreeSet;

#[test]
fn begin_accepting_applications_fails_with_no_opening() {
    build_test_externalities().execute_with(|| {
        assert_eq!(
            Hiring::begin_accepting_applications(2),
            Err(BeginAcceptingApplicationsError::OpeningDoesNotExist)
        );
    });
}

#[test]
fn begin_accepting_applications_fails_with_not_in_waiting_for_begin() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        assert_eq!(
            Hiring::begin_accepting_applications(opening_id),
            Err(BeginAcceptingApplicationsError::OpeningIsNotInWaitingToBeginStage)
        );
    });
}

#[test]
fn begin_accepting_applications_succeeds() {
    build_test_externalities().execute_with(|| {
        let mut opening_fixture = AddOpeningFixture::default();
        // set future activation
        opening_fixture.activate_at = ActivateOpeningAt::ExactBlock(22);

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        assert_eq!(Hiring::begin_accepting_applications(opening_id), Ok(()));

        let updated_opening = <OpeningById<Test>>::get(opening_id);

        let expected_opening_state = Opening {
            created: FIRST_BLOCK_HEIGHT,
            stage: OpeningStage::Active {
                stage: ActiveOpeningStage::AcceptingApplications {
                    started_accepting_applicants_at_block: FIRST_BLOCK_HEIGHT,
                },
                applications_added: BTreeSet::new(),
                active_application_count: 0,
                unstaking_application_count: 0,
                deactivated_application_count: 0,
            },
            max_review_period_length: 672,
            application_rationing_policy: None,
            application_staking_policy: None,
            role_staking_policy: None,
            human_readable_text: HUMAN_READABLE_TEXT.to_vec(),
        };

        assert_eq!(updated_opening, expected_opening_state);
    });
}
