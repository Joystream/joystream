#![cfg(test)]

use super::*;
use crate::mock::*;

use runtime_io::with_externalities;

fn create_new_mint_with_capacity(capacity: u64) -> MintId {
    let mint_id = Minting::add_mint(capacity, None).ok().unwrap();
    assert!(Minting::mint_exists(mint_id));
    assert!(Minting::mint_has_capacity(mint_id, capacity));
    mint_id
}

#[test]
fn adding_and_removing_mints() {
    with_externalities(&mut build_test_externalities(), || {
        let mint_id = create_new_mint_with_capacity(1000000);
    });
}
