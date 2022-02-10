use super::{increase_total_balance_issuance_using_account_id, initial_test_ext};
use crate::{
    BoundStakingAccountStakingManager, ContentWorkingGroupStakingManager,
    GatewayWorkingGroupStakingManager,
};
use frame_support::sp_runtime::AccountId32;
use staking_handler::StakingHandler;

#[test]
fn compatible_stakes_check_passed_successfully() {
    initial_test_ext().execute_with(|| {
        let account_id = AccountId32::default();
        let total_amout = 10000;
        let stake_amount = 100;

        increase_total_balance_issuance_using_account_id(account_id.clone().into(), total_amout);

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
        let account_id = AccountId32::default();
        let total_amout = 10000;
        let stake_amount = 100;

        increase_total_balance_issuance_using_account_id(account_id.clone().into(), total_amout);

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
        let account_id = AccountId32::default();
        let total_amout = 10000;
        let stake_amount = 100;

        increase_total_balance_issuance_using_account_id(account_id.clone().into(), total_amout);

        assert_eq!(
            GatewayWorkingGroupStakingManager::set_stake(&account_id, stake_amount),
            Ok(())
        );
        assert!(
            !ContentWorkingGroupStakingManager::is_account_free_of_conflicting_stakes(&account_id)
        );
    });
}
