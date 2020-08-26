#![cfg(test)]

mod public_api;
mod smoke;
mod staking_module;
use public_api::*;

use crate::mock::Test;
use crate::*;

use sp_std::cell::RefCell;
use sp_std::rc::Rc;

use std::panic;

pub(crate) type OpeningId = <Test as Trait>::OpeningId;
pub(crate) type ApplicationId = <Test as Trait>::ApplicationId;
pub(crate) type BlockNumber = <Test as system::Trait>::BlockNumber;
pub(crate) type StakeId = <Test as stake::Trait>::StakeId;
pub(crate) type Balance =
    <<Test as stake::Trait>::Currency as Currency<<Test as system::Trait>::AccountId>>::Balance;

// Debug test object content. Recurring temporary usage - do not delete.
#[allow(dead_code)]
pub fn debug_print<T: sp_std::fmt::Debug>(obj: T) {
    println!("{:?}", obj);
}
