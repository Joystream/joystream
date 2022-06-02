use super::mock::*;
use crate::*;

pub(crate) fn increase_total_balance_issuance_using_account_id(account_id: u64, balance: u64) {
    let initial_balance = Balances::total_issuance();
    {
        let _ = Balances::deposit_creating(&account_id, balance);
    }
    assert_eq!(Balances::total_issuance(), initial_balance + balance);
}

#[test]
fn lock_succeeds() {
    build_test_externalities().execute_with(|| {
        let account_id = 1;
        let total_amount = 300;
        let stake = 100;

        increase_total_balance_issuance_using_account_id(account_id, total_amount);

        assert_eq!(Balances::usable_balance(&account_id), total_amount);

        TestStakingManager::lock(&account_id, stake);

        assert_eq!(Balances::usable_balance(&account_id), total_amount - stake);
    });
}

#[test]
fn unlock_succeeds() {
    build_test_externalities().execute_with(|| {
        let account_id = 1;
        let total_amount = 300;
        let stake = 100;

        increase_total_balance_issuance_using_account_id(account_id, total_amount);

        TestStakingManager::lock(&account_id, stake);

        assert_eq!(Balances::usable_balance(&account_id), total_amount - stake);

        TestStakingManager::unlock(&account_id);

        assert_eq!(Balances::usable_balance(&account_id), total_amount);
    });
}

#[test]
fn slash_succeeds() {
    build_test_externalities().execute_with(|| {
        let account_id = 1;
        let total_amount = 300;
        let stake = 100;

        increase_total_balance_issuance_using_account_id(account_id, total_amount);

        TestStakingManager::lock(&account_id, stake);

        assert_eq!(Balances::usable_balance(&account_id), total_amount - stake);

        let slash_amount = 50;
        TestStakingManager::slash(&account_id, Some(slash_amount));
        TestStakingManager::unlock(&account_id);

        assert_eq!(
            Balances::usable_balance(&account_id),
            total_amount - slash_amount
        );
    });
}

#[test]
fn slash_full_succeeds() {
    build_test_externalities().execute_with(|| {
        let account_id = 1;
        let total_amount = 300;
        let stake = 100;

        increase_total_balance_issuance_using_account_id(account_id, total_amount);

        TestStakingManager::lock(&account_id, stake);

        assert_eq!(Balances::usable_balance(&account_id), total_amount - stake);

        TestStakingManager::slash(&account_id, None);
        TestStakingManager::unlock(&account_id);

        assert_eq!(Balances::usable_balance(&account_id), total_amount - stake);

        // Lock was removed.
        assert!(TestStakingManager::is_account_free_of_conflicting_stakes(
            &account_id
        ));
    });
}

#[test]
fn slash_down_to_zero_succeeds() {
    build_test_externalities().execute_with(|| {
        let account_id = 1;
        let total_amount = 300;
        let stake = 100;

        increase_total_balance_issuance_using_account_id(account_id, total_amount);

        TestStakingManager::lock(&account_id, stake);

        assert_eq!(Balances::usable_balance(&account_id), total_amount - stake);

        TestStakingManager::slash(&account_id, Some(stake));
        TestStakingManager::unlock(&account_id);

        assert_eq!(Balances::usable_balance(&account_id), total_amount - stake);

        // Lock was removed.
        assert!(TestStakingManager::is_account_free_of_conflicting_stakes(
            &account_id
        ));
    });
}

#[test]
fn current_stake_succeeds() {
    build_test_externalities().execute_with(|| {
        let account_id = 1;
        let total_amount = 300;
        let stake = 100;

        increase_total_balance_issuance_using_account_id(account_id, total_amount);

        TestStakingManager::lock(&account_id, stake);

        assert_eq!(TestStakingManager::current_stake(&account_id), stake);
    });
}

#[test]
fn is_account_free_of_conflicting_stakes_succeeds() {
    build_test_externalities().execute_with(|| {
        let account_id = 1;
        let total_amount = 300;
        let stake = 100;

        increase_total_balance_issuance_using_account_id(account_id, total_amount);
        assert!(TestStakingManager::is_account_free_of_conflicting_stakes(
            &account_id
        ));

        TestStakingManager::lock(&account_id, stake);

        assert!(!TestStakingManager::is_account_free_of_conflicting_stakes(
            &account_id
        ));
    });
}

#[test]
fn is_enough_balance_for_stake_succeeds() {
    build_test_externalities().execute_with(|| {
        let account_id = 1;
        let total_amount = 300;
        let stake = 100;

        assert!(!TestStakingManager::is_enough_balance_for_stake(
            &account_id,
            stake
        ));

        increase_total_balance_issuance_using_account_id(account_id, total_amount);

        assert!(TestStakingManager::is_enough_balance_for_stake(
            &account_id,
            stake
        ));
    });
}

#[test]
fn set_stake_succeeds() {
    build_test_externalities().execute_with(|| {
        let account_id = 1;
        let total_amount = 300;
        let stake = 300;
        let invalid_stake = 600;

        increase_total_balance_issuance_using_account_id(account_id, total_amount);

        assert_eq!(
            TestStakingManager::set_stake(&account_id, stake),
            DispatchResult::Ok(())
        );

        assert_eq!(TestStakingManager::current_stake(&account_id), stake);

        assert_eq!(
            TestStakingManager::set_stake(&account_id, invalid_stake),
            DispatchResult::Err(DispatchError::Other("Not enough balance for a new stake."))
        );

        assert_eq!(TestStakingManager::current_stake(&account_id), stake);
    });
}

#[test]
fn is_enough_balance_for_stake_succeeds_with_two_stakes() {
    build_test_externalities().execute_with(|| {
        let account_id = 1;
        let total_amount = 200;
        let stake1 = 100;
        let stake2 = 200;

        increase_total_balance_issuance_using_account_id(account_id, total_amount);

        assert!(TestStakingManager::set_stake(&account_id, stake1).is_ok());

        assert!(TestStakingManager2::is_enough_balance_for_stake(
            &account_id,
            stake2
        ));
    });
}

#[test]
fn set_stake_succeeds_with_two_stakes() {
    build_test_externalities().execute_with(|| {
        let account_id = 1;
        let total_amount = 200;
        let stake1 = 100;
        let stake2 = 200;

        increase_total_balance_issuance_using_account_id(account_id, total_amount);

        assert!(TestStakingManager::set_stake(&account_id, stake1).is_ok());
        assert!(TestStakingManager2::set_stake(&account_id, stake2).is_ok());
    });
}
