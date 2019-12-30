#![cfg(test)]


mod add_application;
mod add_opening;
mod begin_accepting_applications;
mod begin_review;
mod cancel_opening;
mod deactivate_application;
mod ensure_can_add_application;
mod fill_opening;
mod smoke;
mod unstaked;

use super::*;

/*
Add tests:
- on_finalize

*/

//Debug test object content
//pub(crate) fn debug_print<T: rstd::fmt::Debug>(obj: T) {
//    println!("{:?}", obj);
//}
