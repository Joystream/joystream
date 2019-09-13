#![cfg(test)]

use super::*;
use crate::mock::*;

use runtime_io::with_externalities;

#[test]
fn add_mint() {
    with_externalities(&mut build_test_externalities(), || {
        let current_block_number = System::block_number();
        let capacity: u64 = 5000;
        let adjustment_amount: u64 = 500;

        let adjustment = AdjustOnInterval {
            adjustment_type: AdjustCapacityBy::Adding(adjustment_amount),
            block_interval: 100,
        };

        let mint_id = Minting::add_mint(capacity, Some(adjustment)).ok().unwrap();
        assert!(Minting::mint_exists(mint_id));

        let mint = Minting::ensure_mint(&mint_id).ok().unwrap();
        assert!(mint.can_mint(capacity));
    });
}
