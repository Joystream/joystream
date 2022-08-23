use super::{
    account_from_member_id, increase_total_balance_issuance_using_account_id, initial_test_ext,
};
use crate::{
    currency, BoundStakingAccountStakingManager, ContentWorkingGroupStakingManager,
    GatewayWorkingGroupStakingManager, Runtime, Staking,
};

use sp_staking::StakingInterface;
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
fn validate_fails_when_stash_has_rivalrous_lock() {
    initial_test_ext().execute_with(|| {
        // First Validator - Bonding with account free of locks
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

        // Second Validator
        let validator_2 = account_from_member_id(1);
        let stake_amount = currency::MIN_VALIDATOR_BOND;
        let wg_stake = currency::DOLLARS * 1;
        let total_amount = currency::STASH;

        increase_total_balance_issuance_using_account_id(validator_2.clone(), total_amount);

        // Set a rivalrous lock
        assert_eq!(
            ContentWorkingGroupStakingManager::set_stake(&validator_2, wg_stake),
            Ok(())
        );

        // bonding succeeds...
        assert_eq!(
            <Staking as StakingInterface>::bond(
                validator_2.clone(),
                validator_2.clone(),
                stake_amount,
                validator_2.clone()
            ),
            Ok(())
        );

        // ...but active stake will be zero.
        assert_eq!(
            <Staking as StakingInterface>::active_stake(&validator_2),
            Some(0)
        );

        // So validate call fails due to insufficient bond
        assert_eq!(
            Staking::validate(
                frame_system::RawOrigin::Signed(validator_2.clone()).into(),
                Default::default(),
            ),
            Err(pallet_staking::Error::<Runtime>::InsufficientBond.into())
        );

        // trying to increase bond, will fail because the new active stake will still be 0
        // which is less than existential deposit
        assert_eq!(
            <Staking as StakingInterface>::bond_extra(validator_2.clone(), stake_amount,),
            Err(pallet_staking::Error::<Runtime>::InsufficientBond.into())
        );

        // Trying to nominate the first validator should also fail
        assert_eq!(
            Staking::nominate(
                frame_system::RawOrigin::Signed(validator_2.clone()).into(),
                vec![validator_1],
            ),
            Err(pallet_staking::Error::<Runtime>::InsufficientBond.into())
        );
    });
}
