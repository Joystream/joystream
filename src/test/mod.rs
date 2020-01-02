#![cfg(test)]


mod add_application;
mod add_opening;
mod begin_accepting_applications;
mod begin_review;
mod cancel_opening;
mod deactivate_application;
mod ensure_can_add_application;
mod fill_opening;
mod on_finalize;
mod smoke;
mod unstaked;

use super::*;
use crate::mock::Test;

pub(crate) type OpeningId = <Test as Trait>::OpeningId;
pub(crate) type ApplicationId = <Test as Trait>::ApplicationId;
pub(crate) type BlockNumber = <Test as system::Trait>::BlockNumber;
pub(crate) type StakeId = <Test as stake::Trait>::StakeId;
pub(crate) type Balance =
    <<Test as stake::Trait>::Currency as Currency<<Test as system::Trait>::AccountId>>::Balance;

//Debug test object content. Recurring temporary usage - do not delete.
#[allow(dead_code)]
pub fn debug_print<T: rstd::fmt::Debug>(obj: T) {
    println!("{:?}", obj);
}
