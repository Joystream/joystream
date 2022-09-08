use super::{
    account_from_member_id, increase_total_balance_issuance_using_account_id, initial_test_ext,
};
use crate::{
    currency, BoundStakingAccountStakingManager, ContentWorkingGroupStakingManager,
    GatewayWorkingGroupStakingManager, MinVestedTransfer, Runtime,
};
use frame_support::{assert_err, assert_ok, traits::StoredMap};
use frame_system::RawOrigin;
use pallet_vesting::VestingInfo;
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
fn vesting_lock_is_both_misc_frozen_and_fee_frozen() {
    initial_test_ext().execute_with(|| {
        let src = account_from_member_id(0);
        let dst = account_from_member_id(1);
        let amount = MinVestedTransfer::get();

        increase_total_balance_issuance_using_account_id(src.clone(), amount);
        assert_ok!(pallet_vesting::Pallet::<Runtime>::vested_transfer(
            RawOrigin::Signed(src).into(),
            dst.clone(),
            VestingInfo::new(amount, 1, u32::MAX)
        ));

        let dst_account_info = <Runtime as pallet_balances::Config>::AccountStore::get(&dst);

        assert_eq!(dst_account_info.misc_frozen, amount);
        assert_eq!(dst_account_info.fee_frozen, amount);
    });
}

#[test]
fn bonding_with_non_staked_account_works() {
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

#[test]
fn bonding_with_staked_account_fails() {
    use crate::Staking;
    use sp_staking::StakingInterface;

    initial_test_ext().execute_with(|| {
        let validator_1 = account_from_member_id(0);
        let bond_amount = currency::DOLLARS * 100;
        let stake_amount = currency::DOLLARS * 100;
        let total_amount = currency::DOLLARS * 500;
        increase_total_balance_issuance_using_account_id(validator_1.clone(), total_amount);

        assert_eq!(
            GatewayWorkingGroupStakingManager::set_stake(&validator_1, stake_amount),
            Ok(())
        );
        assert!(
            !ContentWorkingGroupStakingManager::is_account_free_of_conflicting_stakes(&validator_1)
        );

        // bonding should fail
        assert_err!(
            <Staking as StakingInterface>::bond(
                validator_1.clone(),
                validator_1.clone(),
                bond_amount,
                validator_1.clone()
            ),
            pallet_staking::Error::<Runtime>::BondingRestricted
        );
    });
}
