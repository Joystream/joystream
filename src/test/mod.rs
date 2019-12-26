#![cfg(test)]


mod add_application;
mod add_opening;
mod begin_accepting_applications;
mod begin_review;
mod deactivate_application;
mod ensure_can_add_application;
mod smoke;
mod unstaked;

use super::*;

/*
Add tests:
- cancel_opening:
.cancel_opening_succeeds
.cancel_opening_fails_due_to_too_short_application_unstaking_period
.cancel_opening_fails_due_to_too_short_role_unstaking_period
.cancel_opening_fails_due_to_opening_not_existing

- fill_opening
- on_finalize

*/

////Debug test object content
pub(crate) fn debug_print<T: rstd::fmt::Debug>(obj: T) {
    println!("{:?}", obj);
}
