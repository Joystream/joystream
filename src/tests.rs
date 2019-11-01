#![cfg(test)]

use super::*;
use crate::mock::*;

#[test]
fn adding_and_removing_mints() {
    build_test_externalities().execute_with(|| {
        System::set_block_number(1);
        let capacity: u64 = 5000;
        let adjustment_amount: u64 = 500;

        let adjustment = AdjustOnInterval {
            adjustment_type: AdjustCapacityBy::Adding(adjustment_amount),
            block_interval: 100,
        };

        let mint_id = Minting::add_mint(capacity, Some(Adjustment::Interval(adjustment)))
            .ok()
            .unwrap();
        assert!(Minting::mint_exists(mint_id));

        assert_eq!(Minting::get_mint_capacity(mint_id).ok().unwrap(), capacity);

        assert_eq!(
            Minting::get_mint_next_adjustment(mint_id),
            Ok(Some(NextAdjustment {
                adjustment,
                at_block: 1 + 100,
            }))
        );

        Minting::remove_mint(mint_id);
        assert!(!Minting::mint_exists(mint_id));
    });
}

#[test]
fn minting() {
    build_test_externalities().execute_with(|| {
        let capacity: u64 = 5000;

        let mint_id = Minting::add_mint(capacity, None).ok().unwrap();

        assert!(Minting::transfer_tokens(mint_id, 1000, &1).is_ok());

        assert_eq!(Balances::free_balance(&1), 1000);

        assert_eq!(Minting::get_mint_capacity(mint_id).ok().unwrap(), 4000);
    });
}

#[test]
fn minting_exact() {
    build_test_externalities().execute_with(|| {
        let capacity: u64 = 1000;

        let mint_id = Minting::add_mint(capacity, None).ok().unwrap();

        assert_eq!(
            Minting::transfer_tokens(mint_id, 2000, &1),
            Err(TransferError::NotEnoughCapacity)
        );
    });
}

#[test]
fn adjustment_adding() {
    build_test_externalities().execute_with(|| {
        System::set_block_number(0);
        let capacity: u64 = 5000;
        let adjustment_amount: u64 = 500;

        let adjustment = AdjustOnInterval {
            adjustment_type: AdjustCapacityBy::Adding(adjustment_amount),
            block_interval: 100,
        };

        let mint_id = Minting::add_mint(capacity, Some(Adjustment::Interval(adjustment)))
            .ok()
            .unwrap();

        Minting::update_mints(100);
        assert_eq!(
            Minting::get_mint_capacity(mint_id).ok().unwrap(),
            capacity + (adjustment_amount * 1)
        );

        // no adjustments should happen
        Minting::update_mints(100);
        Minting::update_mints(140);
        Minting::update_mints(199);

        Minting::update_mints(200);
        assert_eq!(
            Minting::get_mint_capacity(mint_id).ok().unwrap(),
            capacity + (adjustment_amount * 2)
        );
    });
}

#[test]
fn adjustment_reducing() {
    build_test_externalities().execute_with(|| {
        System::set_block_number(0);
        let capacity: u64 = 5000;
        let adjustment_amount: u64 = 500;

        let adjustment = AdjustOnInterval {
            adjustment_type: AdjustCapacityBy::Reducing(adjustment_amount),
            block_interval: 100,
        };

        let mint_id = Minting::add_mint(capacity, Some(Adjustment::Interval(adjustment)))
            .ok()
            .unwrap();

        Minting::update_mints(100);
        assert_eq!(
            Minting::get_mint_capacity(mint_id).ok().unwrap(),
            capacity - adjustment_amount
        );

        assert_eq!(
            Minting::get_mint_capacity(mint_id).ok().unwrap(),
            capacity - (adjustment_amount * 1)
        );

        // no adjustments should happen
        Minting::update_mints(100);
        Minting::update_mints(140);
        Minting::update_mints(199);

        Minting::update_mints(200);
        assert_eq!(
            Minting::get_mint_capacity(mint_id).ok().unwrap(),
            capacity - (adjustment_amount * 2)
        );
    });
}

#[test]
fn adjustment_setting() {
    build_test_externalities().execute_with(|| {
        System::set_block_number(0);
        let capacity: u64 = 2000;
        let setting_amount: u64 = 5000;

        let adjustment = AdjustOnInterval {
            adjustment_type: AdjustCapacityBy::Setting(setting_amount),
            block_interval: 100,
        };

        let mint_id = Minting::add_mint(capacity, Some(Adjustment::Interval(adjustment)))
            .ok()
            .unwrap();

        Minting::update_mints(100);
        assert_eq!(
            Minting::get_mint_capacity(mint_id).ok().unwrap(),
            setting_amount
        );
    });
}

#[test]
fn adjustment_first_interval() {
    build_test_externalities().execute_with(|| {
        System::set_block_number(0);
        let capacity: u64 = 2000;
        let amount: u64 = 500;

        let adjustment = AdjustOnInterval {
            adjustment_type: AdjustCapacityBy::Adding(amount),
            block_interval: 100,
        };

        let mint_id = Minting::add_mint(
            capacity,
            Some(Adjustment::IntervalAfterFirstAdjustmentAbsolute(
                adjustment, 1000,
            )),
        )
        .ok()
        .unwrap();

        Minting::update_mints(100);
        assert_eq!(Minting::get_mint_capacity(mint_id).ok().unwrap(), capacity);

        Minting::update_mints(1000);
        assert_eq!(
            Minting::get_mint_capacity(mint_id).ok().unwrap(),
            capacity + amount
        );

        Minting::update_mints(1100);
        assert_eq!(
            Minting::get_mint_capacity(mint_id).ok().unwrap(),
            capacity + 2 * amount
        );
    });
}
