#![cfg(test)]

use super::*;
use crate::mock::*;

use runtime_io::with_externalities;

static FIRST_BLOCK_HEIGHT: <Test as system::Trait>::BlockNumber = 1;

use rstd::collections::btree_set::BTreeSet;

/// add_opening

#[test]
fn add_opening_success_waiting_to_begin() {
    with_externalities(&mut build_test_externalities(), || {
        // FIXTURES

        let expected_opening_id = 0;

        let activation_at = ActivateOpeningAt::CurrentBlock;
        let max_review_period_length = 672;
        let application_rationing_policy = None;
        let application_staking_policy = None;
        let role_staking_policy = None;
        let human_readable_text = "blablabalbal".as_bytes().to_vec();

        // Add an opening, check that the returned value is Zero
        assert_eq!(
            Hiring::add_opening(
                activation_at,
                max_review_period_length,
                application_rationing_policy,
                application_staking_policy,
                role_staking_policy,
                human_readable_text.clone()
            ),
            Ok(expected_opening_id)
        );

        // Check that next opening id has been updated
        assert_eq!(Hiring::next_opening_id(), expected_opening_id + 1);

        // Check that our opening actually was added
        assert!(<OpeningById<Test>>::exists(expected_opening_id));

        let found_opening = Hiring::opening_by_id(expected_opening_id);

        assert_eq!(
            found_opening,
            Opening {
                created: FIRST_BLOCK_HEIGHT,
                stage: OpeningStage::Active {
                    stage: ActiveOpeningStage::AcceptingApplications {
                        started_accepting_applicants_at_block: FIRST_BLOCK_HEIGHT
                    },
                    applicants: BTreeSet::new(),
                    active_application_count: 0,
                    unstaking_application_count: 0,
                    deactivated_application_count: 0
                },
                max_review_period_length: max_review_period_length,
                application_rationing_policy: None, //application_rationing_policy,
                application_staking_policy: None,   //application_staking_policy,
                role_staking_policy: None,          //role_staking_policy,
                human_readable_text: human_readable_text.clone()
            }
        );
    });
}

#[test]
fn add_opening_fails_due_to_activation_in_the_past() {
    with_externalities(&mut build_test_externalities(), || {
        // FIXTURES

        let expected_opening_id = 0;

        let activation_at = ActivateOpeningAt::ExactBlock(0);
        let max_review_period_length = 672;
        let application_rationing_policy = None;
        let application_staking_policy = None;
        let role_staking_policy = None;
        let human_readable_text = "blablabalbal".as_bytes().to_vec();

        // Add an opening, check that the returned value is Zero
        assert_eq!(
            Hiring::add_opening(
                activation_at,
                max_review_period_length,
                application_rationing_policy,
                application_staking_policy,
                role_staking_policy,
                human_readable_text.clone()
            ),
            Err(AddOpeningError::OpeningMustActivateInTheFuture)
        );

        // Check that next opening id has been updated
        assert_eq!(Hiring::next_opening_id(), expected_opening_id);

        // Check that our opening actually was not added
        assert!(!<OpeningById<Test>>::exists(expected_opening_id));
    });
}

/// cancel_opening

#[test]
fn cancel_opening_success() {
    with_externalities(&mut build_test_externalities(), || {});
}

#[test]
fn cancel_opening_fails_due_to_too_short_application_unstaking_period() {
    with_externalities(&mut build_test_externalities(), || {});
}

#[test]
fn cancel_opening_fails_due_to_too_short_role_unstaking_period() {
    with_externalities(&mut build_test_externalities(), || {});
}

#[test]
fn cancel_opening_fails_due_to_opening_not_existing() {
    with_externalities(&mut build_test_externalities(), || {});
}

//

/**
 * remove_opening
 *
 *
 */

/**
 * begin_accepting_applications
 *
 * begin_accepting_applications_succeeded
 * begin_accepting_applications_fails_due_to_invalid_opening_id
 * begin_accepting_applications_fails_due_to_opening_not_being_in_waiting_to_begin_stage
 */

/**
 * begin_review
 *
 * begin_review
 */

/**
 * fill_opening
 *
 * fill_opening
 */

/**
 * add_application
 *
 * add_application
 */

/**
 * deactive_application
 *
 * deactive_application
 */

/**
 * remove_application
 *
 * remove_application
 */

/**
 * unstaked
 *
 * unstaked
 */

#[test]
fn foo() {
    with_externalities(&mut build_test_externalities(), || {});
}
