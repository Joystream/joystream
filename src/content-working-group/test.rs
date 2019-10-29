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

       
    });
}