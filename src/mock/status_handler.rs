#![cfg(test)]

// use crate::*;
use crate::{Trait, RewardRelationshipId, PayoutStatusHandler, BalanceOf};

use std::cell::RefCell;

struct StatusHandlerState {
    successes: Vec<RewardRelationshipId>,
    failures: Vec<RewardRelationshipId>,
}

impl StatusHandlerState {
    pub fn reset(&mut self) {
        self.successes = vec![];
        self.failures = vec![];
    }
}

impl Default for StatusHandlerState {
    fn default() -> Self {
        Self {
            successes: vec![],
            failures: vec![],
        }
    }
}

thread_local!(static STATUS_HANDLER_STATE: RefCell<StatusHandlerState> = RefCell::new(Default::default()));

pub struct MockStatusHandler {}
impl MockStatusHandler {
    pub fn reset() {
        STATUS_HANDLER_STATE.with(|cell| {
            cell.borrow_mut().reset();
        });
    }
    pub fn successes() -> usize {
        let mut value = 0;
        STATUS_HANDLER_STATE.with(|cell| {
            value = cell.borrow_mut().successes.len();
        });
        value
    }
    pub fn failures() -> usize {
        let mut value = 0;
        STATUS_HANDLER_STATE.with(|cell| {
            value = cell.borrow_mut().failures.len();
        });
        value
    }
}
impl<T: Trait> PayoutStatusHandler<T> for MockStatusHandler {
    fn payout_succeeded(
        id: RewardRelationshipId,
        _destination_account: &T::AccountId,
        _amount: BalanceOf<T>,
    ) {
        STATUS_HANDLER_STATE.with(|cell| {
            cell.borrow_mut().successes.push(id);
        });
    }

    fn payout_failed(
        id: RewardRelationshipId,
        _destination_account: &T::AccountId,
        _amount: BalanceOf<T>,
    ) {
        STATUS_HANDLER_STATE.with(|cell| {
            cell.borrow_mut().failures.push(id);
        });
    }
}
