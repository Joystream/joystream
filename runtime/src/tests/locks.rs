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
        let total_amount = stake_amount * 100;

        increase_total_balance_issuance_using_account_id(account_id.clone(), total_amount);

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
        let total_amount = stake_amount * 100;

        increase_total_balance_issuance_using_account_id(account_id.clone(), total_amount);

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
        let total_amount = stake_amount * 100;

        increase_total_balance_issuance_using_account_id(account_id.clone(), total_amount);

        assert_eq!(
            GatewayWorkingGroupStakingManager::set_stake(&account_id, stake_amount),
            Ok(())
        );
        assert!(
            !ContentWorkingGroupStakingManager::is_account_free_of_conflicting_stakes(&account_id)
        );
    });
}

#[test]
fn incompatible_stakes_for_staking_pallet() {
    use crate::Staking;
    use sp_staking::StakingInterface;

    initial_test_ext().execute_with(|| {
        // Bonding with account free of locks
        let validator_1 = account_from_member_id(0);
        let stake_amount = currency::MIN_VALIDATOR_BOND;
        let total_amount = currency::STASH;
        increase_total_balance_issuance_using_account_id(validator_1.clone(), total_amount);

        // bonding succeeds
        assert_eq!(
            <Staking as StakingInterface>::bond(
                validator_1.clone(),
                validator_1.clone(),
                stake_amount,
                validator_1.clone()
            ),
            Ok(())
        );

        // and active stake will be stake_amount.
        assert_eq!(
            <Staking as StakingInterface>::active_stake(&validator_1),
            Some(stake_amount)
        );

        // Validate call succeeds
        assert_eq!(
            Staking::validate(
                frame_system::RawOrigin::Signed(validator_1.clone()).into(),
                Default::default(),
            ),
            Ok(())
        );

        // Should not be able to stake with additional rivalrous lock
        assert!(
            !ContentWorkingGroupStakingManager::is_account_free_of_conflicting_stakes(&validator_1)
        );
    });
}
