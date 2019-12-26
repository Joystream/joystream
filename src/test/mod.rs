#![cfg(test)]

mod add_opening;
mod smoke;

use super::*;
use crate::mock::*;

/// cancel_opening

#[test]
fn cancel_opening_success() {
    build_test_externalities().execute_with(|| {});
}

#[test]
fn cancel_opening_fails_due_to_too_short_application_unstaking_period() {
    build_test_externalities().execute_with(|| {});
}

#[test]
fn cancel_opening_fails_due_to_too_short_role_unstaking_period() {
    build_test_externalities().execute_with(|| {});
}

#[test]
fn cancel_opening_fails_due_to_opening_not_existing() {
    build_test_externalities().execute_with(|| {});
}

//

/*
 * remove_opening
 *
 *
 */

/*
 * begin_accepting_applications
 *
 * begin_accepting_applications_succeeded
 * begin_accepting_applications_fails_due_to_invalid_opening_id
 * begin_accepting_applications_fails_due_to_opening_not_being_in_waiting_to_begin_stage
 */

/*
 * begin_review
 *
 * begin_review
 */

/*
 * fill_opening
 *
 * fill_opening
 */

/*
 * add_application
 *
 * add_application
 */

/*
 * deactive_application
 *
 * deactive_application
 */

/*
 * remove_application
 *
 * remove_application
 */

/*
 * unstaked
 *
 * unstaked
 */
