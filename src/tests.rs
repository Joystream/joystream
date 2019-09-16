#![cfg(test)]

use super::*;
use crate::mock::*;

use runtime_io::with_externalities;

#[test]
fn adding_and_removing_mints() {
    with_externalities(&mut build_test_externalities(), || {
        let capacity: u64 = 5000;
        let adjustment_amount: u64 = 500;

        let adjustment = AdjustOnInterval {
            adjustment_type: AdjustCapacityBy::Adding(adjustment_amount),
            block_interval: 100,
        };

        let mint_id = Minting::add_mint(capacity, Some(adjustment), None)
            .ok()
            .unwrap();
        assert!(Minting::mint_exists(mint_id));

        assert!(Minting::mint_has_capacity(mint_id, capacity));

        assert_eq!(Minting::mint_adjustment(mint_id), Ok(Some(adjustment)));

        Minting::remove_mint(mint_id);
        assert!(!Minting::mint_exists(mint_id));
    });
}

#[test]
fn minting() {
    with_externalities(&mut build_test_externalities(), || {
        let capacity: u64 = 5000;

        let mint_id = Minting::add_mint(capacity, None, None).ok().unwrap();

        assert!(Minting::transfer_exact_tokens(mint_id, 1000, &1).is_ok());

        assert_eq!(Balances::free_balance(&1), 1000);

        assert!(Minting::mint_has_capacity(mint_id, 4000));
    });
}

#[test]
fn minting_exact() {
    with_externalities(&mut build_test_externalities(), || {
        let capacity: u64 = 1000;

        let mint_id = Minting::add_mint(capacity, None, None).ok().unwrap();

        assert_eq!(
            Minting::transfer_exact_tokens(mint_id, 2000, &1),
            Err(MintingError::NotEnoughCapacity)
        );
    });
}

#[test]
fn minting_some() {
    with_externalities(&mut build_test_externalities(), || {
        let capacity: u64 = 1000;

        let mint_id = Minting::add_mint(capacity, None, None).ok().unwrap();

        assert_eq!(Minting::transfer_some_tokens(mint_id, 2000, &1), Ok(1000));
    });
}

#[test]
fn adjustment() {
    with_externalities(&mut build_test_externalities(), || {
        System::set_block_number(0);
        let capacity: u64 = 5000;
        let adjustment_amount: u64 = 500;

        let adjustment = AdjustOnInterval {
            adjustment_type: AdjustCapacityBy::Adding(adjustment_amount),
            block_interval: 100,
        };

        let mint_id = Minting::add_mint(capacity, Some(adjustment), None)
            .ok()
            .unwrap();

        Minting::update_mints(100);
        assert!(Minting::mint_has_capacity(
            mint_id,
            capacity + (adjustment_amount * 1)
        ));

        Minting::update_mints(100);
        Minting::update_mints(140);
        Minting::update_mints(199);

        Minting::update_mints(200);
        assert!(Minting::mint_has_capacity(
            mint_id,
            capacity + (adjustment_amount * 2)
        ));
    });
}
