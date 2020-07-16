use crate::mock::*;
use crate::test::*;

#[test]
fn begin_review_fails_with_no_opening() {
    build_test_externalities().execute_with(|| {
        assert_eq!(
            Hiring::begin_review(2),
            Err(BeginReviewError::OpeningDoesNotExist)
        );
    });
}

#[test]
fn begin_review_fails_with_not_in_accepting_application_stage() {
    build_test_externalities().execute_with(|| {
        let mut opening_fixture = AddOpeningFixture::default();
        // set future activation
        opening_fixture.activate_at = ActivateOpeningAt::ExactBlock(22);

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        assert_eq!(
            Hiring::begin_review(opening_id),
            Err(BeginReviewError::OpeningNotInAcceptingApplicationsStage)
        );
    });
}

#[test]
fn begin_review_succeeds() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();
        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        assert!(application_fixture.add_application().is_ok());

        let old_opening = <OpeningById<Test>>::get(opening_id);

        assert_eq!(Hiring::begin_review(opening_id), Ok(()));

        let updated_opening = <OpeningById<Test>>::get(opening_id);

        let expected_opening_state =
            old_opening.clone_with_new_active_opening_stage(ActiveOpeningStage::ReviewPeriod {
                started_accepting_applicants_at_block: FIRST_BLOCK_HEIGHT,
                started_review_period_at_block: FIRST_BLOCK_HEIGHT,
            });

        assert_eq!(updated_opening, expected_opening_state);
    });
}
