use super::{
    account_from_member_id, increase_total_balance_issuance_using_account_id, initial_test_ext,
};
use crate::{
    currency, BoundStakingAccountStakingManager, ContentWorkingGroupStakingManager,
    GatewayWorkingGroupStakingManager,
};

use staking_handler::StakingHandler;

#[test]
fn compatible_stakes_check_passed_successfully() {
    initial_test_ext().execute_with(|| {
        let account_id = account_from_member_id(0);
        let stake_amount = currency::DOLLARS * 100;
        let total_amout = stake_amount * 100;

        increase_total_balance_issuance_using_account_id(account_id.clone(), total_amout);

        assert_eq!(
            BoundStakingAccountStakingManager::set_stake(&account_id, stake_amount),
            Ok(())
        );
        assert!(
            ContentWorkingGroupStakingManager::is_account_free_of_conflicting_stakes(&account_id)
        );
    });
}

#[test]
fn compatible_stakes_check_reversed_order_passed_successfully() {
    initial_test_ext().execute_with(|| {
        let account_id = account_from_member_id(0);
        let stake_amount = currency::DOLLARS * 100;
        let total_amout = stake_amount * 100;

        increase_total_balance_issuance_using_account_id(account_id.clone(), total_amout);

        assert_eq!(
            ContentWorkingGroupStakingManager::set_stake(&account_id, stake_amount),
            Ok(())
        );
        assert!(
            BoundStakingAccountStakingManager::is_account_free_of_conflicting_stakes(&account_id)
        );
    });
}

#[test]
fn incompatible_stakes_check_passed_successfully() {
    initial_test_ext().execute_with(|| {
        let account_id = account_from_member_id(0);
        let stake_amount = currency::DOLLARS * 100;
        let total_amout = stake_amount * 100;

        increase_total_balance_issuance_using_account_id(account_id.clone(), total_amout);

        assert_eq!(
            GatewayWorkingGroupStakingManager::set_stake(&account_id, stake_amount),
            Ok(())
        );
        assert!(
            !ContentWorkingGroupStakingManager::is_account_free_of_conflicting_stakes(&account_id)
        );
    });
}
