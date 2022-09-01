use super::{
    account_from_member_id, increase_total_balance_issuance_using_account_id, initial_test_ext,
};
use crate::{
    currency, BoundStakingAccountStakingManager, ContentWorkingGroupStakingManager,
    GatewayWorkingGroupStakingManager, MinVestedTransfer, Runtime,
};
use frame_support::{assert_ok, traits::StoredMap};
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
