#![cfg(test)]

use core::convert::TryFrom;

use frame_support::{assert_err, assert_ok};
use sp_runtime::BoundedVec;

use crate::{
    account, joy,
    tests::mock::{increase_block_number_by, AccountId, Balance, Balances, BlockNumber, Test},
    BridgeConstraints, BridgeStatus, RemoteAccount, RemoteTransfer,
};

use self::mock::{
    with_test_externalities, with_test_externalities_custom_mint_allowance, ArgoBridge,
    RuntimeOrigin,
};
use crate::Error;

mod mock;

#[test]
fn request_outbound_transfer_success() {
    with_test_externalities(|| {
        let fee = joy!(10);
        let remote_chains = BoundedVec::try_from(vec![1u32]).unwrap();
        let parameters = BridgeConstraints {
            operator_account: Some(account!(1)),
            pauser_accounts: Some(vec![account!(2), account!(3)]),
            bridging_fee: Some(fee),
            thawn_duration: None,
            remote_chains: Some(remote_chains),
        };
        assert_ok!(ArgoBridge::update_bridge_constrains(
            RuntimeOrigin::root(),
            parameters
        ));

        Balances::set_balance(RuntimeOrigin::root(), account!(1), joy!(1020), joy!(0)).unwrap();

        let remote_account = RemoteAccount {
            account: [0; 32],
            chain_id: 1,
        };
        let result = ArgoBridge::request_outbound_transfer(
            RuntimeOrigin::signed(account!(1)),
            remote_account,
            joy!(1000),
            joy!(fee),
        );
        assert_ok!(result);
    });
}

#[test]
fn request_outbound_transfer_with_bridge_paused() {
    with_test_externalities(|| {
        let fee = joy!(10);
        let remote_chains = BoundedVec::try_from(vec![1u32]).unwrap();
        let parameters = BridgeConstraints {
            operator_account: Some(account!(1)),
            pauser_accounts: Some(vec![account!(2), account!(3)]),
            bridging_fee: Some(fee),
            thawn_duration: None,
            remote_chains: Some(remote_chains),
        };
        ArgoBridge::update_bridge_constrains(RuntimeOrigin::root(), parameters).unwrap();

        ArgoBridge::pause_bridge(RuntimeOrigin::signed(account!(2))).unwrap();

        let remote_account = RemoteAccount {
            account: [0; 32],
            chain_id: 1,
        };
        let result = ArgoBridge::request_outbound_transfer(
            RuntimeOrigin::signed(account!(1)),
            remote_account,
            joy!(1000),
            fee,
        );
        assert_err!(result, Error::<Test>::BridgeNotActive);
    });
}

#[test]
fn request_outbound_transfer_with_insufficient_balance() {
    with_test_externalities(|| {
        let fee = joy!(10);
        let remote_chains = BoundedVec::try_from(vec![1u32]).unwrap();
        let parameters = BridgeConstraints {
            operator_account: Some(account!(1)),
            pauser_accounts: Some(vec![account!(2), account!(3)]),
            bridging_fee: Some(fee),
            thawn_duration: None,
            remote_chains: Some(remote_chains),
        };
        assert_ok!(ArgoBridge::update_bridge_constrains(
            RuntimeOrigin::root(),
            parameters
        ));

        let transfer_amount = joy!(1000);
        assert_ok!(Balances::set_balance(
            RuntimeOrigin::root(),
            account!(1),
            transfer_amount + fee - 1,
            joy!(0)
        ));

        let remote_account = RemoteAccount {
            account: [0; 32],
            chain_id: 1,
        };
        let result = ArgoBridge::request_outbound_transfer(
            RuntimeOrigin::signed(account!(1)),
            remote_account,
            transfer_amount,
            fee,
        );
        assert_err!(result, Error::<Test>::InsufficientJoyBalance);
    });
}

#[test]
fn request_outbound_transfer_with_unexpected_fee() {
    with_test_externalities(|| {
        let remote_chains = BoundedVec::try_from(vec![1u32]).unwrap();
        let parameters = BridgeConstraints {
            operator_account: Some(account!(1)),
            pauser_accounts: Some(vec![account!(2), account!(3)]),
            bridging_fee: Some(joy!(20)),
            thawn_duration: None,
            remote_chains: Some(remote_chains),
        };
        assert_ok!(ArgoBridge::update_bridge_constrains(
            RuntimeOrigin::root(),
            parameters
        ));

        let transfer_amount = joy!(1000);
        assert_ok!(Balances::set_balance(
            RuntimeOrigin::root(),
            account!(1),
            transfer_amount + 50,
            joy!(0)
        ));

        let remote_account = RemoteAccount {
            account: [0; 32],
            chain_id: 1,
        };
        let result = ArgoBridge::request_outbound_transfer(
            RuntimeOrigin::signed(account!(1)),
            remote_account,
            transfer_amount,
            joy!(10),
        );
        assert_err!(result, Error::<Test>::FeeDifferentThanExpected);
    });
}

#[test]
fn finalize_inbound_transfer_success() {
    with_test_externalities_custom_mint_allowance(joy!(1000), || {
        let remote_chains = BoundedVec::try_from(vec![1u32]).unwrap();
        let parameters = BridgeConstraints {
            operator_account: Some(account!(1)),
            pauser_accounts: None,
            bridging_fee: None,
            thawn_duration: None,
            remote_chains: Some(remote_chains),
        };
        assert_ok!(ArgoBridge::update_bridge_constrains(
            RuntimeOrigin::root(),
            parameters
        ));

        let remote_transfer = RemoteTransfer { id: 0, chain_id: 1 };
        let result = ArgoBridge::finalize_inbound_transfer(
            RuntimeOrigin::signed(account!(1)),
            remote_transfer,
            account!(2),
            1000,
        );
        assert_err!(result, Error::<Test>::InsufficienBridgMintAllowance);
    });
}

#[test]
fn finalize_inbound_transfer_with_no_operator_account() {
    with_test_externalities(|| {
        let remote_transfer = RemoteTransfer { id: 0, chain_id: 1 };
        let result = ArgoBridge::finalize_inbound_transfer(
            RuntimeOrigin::signed(account!(1)),
            remote_transfer,
            account!(2),
            1000,
        );
        assert_err!(result, Error::<Test>::NotOperatorAccount);
    });
}

#[test]
fn finalize_inbound_transfer_with_unauthorized_account() {
    with_test_externalities(|| {
        let remote_chains = BoundedVec::try_from(vec![1u32]).unwrap();
        let parameters = BridgeConstraints {
            operator_account: Some(account!(1)),
            pauser_accounts: None,
            bridging_fee: None,
            thawn_duration: None,
            remote_chains: Some(remote_chains),
        };
        assert_ok!(ArgoBridge::update_bridge_constrains(
            RuntimeOrigin::root(),
            parameters
        ));

        let remote_transfer = RemoteTransfer { id: 0, chain_id: 1 };
        let result = ArgoBridge::finalize_inbound_transfer(
            RuntimeOrigin::signed(account!(2)),
            remote_transfer,
            account!(2),
            1000,
        );
        assert_err!(result, Error::<Test>::NotOperatorAccount);
    });
}

#[test]
fn finalize_inbound_transfer_with_insufficient_bridge_mint() {
    with_test_externalities(|| {
        let remote_chains = BoundedVec::try_from(vec![1u32]).unwrap();
        let parameters = BridgeConstraints {
            operator_account: Some(account!(1)),
            pauser_accounts: None,
            bridging_fee: None,
            thawn_duration: None,
            remote_chains: Some(remote_chains),
        };
        assert_ok!(ArgoBridge::update_bridge_constrains(
            RuntimeOrigin::root(),
            parameters
        ));

        let remote_transfer = RemoteTransfer { id: 0, chain_id: 1 };
        let result = ArgoBridge::finalize_inbound_transfer(
            RuntimeOrigin::signed(account!(1)),
            remote_transfer,
            account!(2),
            1000,
        );
        assert_err!(result, Error::<Test>::InsufficienBridgMintAllowance);
    });
}

#[test]
fn pause_bridge_success() {
    with_test_externalities(|| {
        let parameters = BridgeConstraints {
            operator_account: None,
            pauser_accounts: Some(vec![account!(2)]),
            bridging_fee: None,
            thawn_duration: None,
            remote_chains: None,
        };
        assert_ok!(ArgoBridge::update_bridge_constrains(
            RuntimeOrigin::root(),
            parameters
        ));
        assert_ok!(ArgoBridge::pause_bridge(RuntimeOrigin::signed(account!(2))));
    });
}

#[test]
fn pause_bridge_with_unathorized_account() {
    with_test_externalities(|| {
        let parameters = BridgeConstraints {
            operator_account: None,
            pauser_accounts: Some(vec![account!(2)]),
            bridging_fee: None,
            thawn_duration: None,
            remote_chains: None,
        };
        assert_ok!(ArgoBridge::update_bridge_constrains(
            RuntimeOrigin::root(),
            parameters
        ));

        let result = ArgoBridge::pause_bridge(RuntimeOrigin::signed(account!(1)));
        assert_err!(result, Error::<Test>::NotPauserAccount);
    });
}

#[test]
fn unpause_bridge_success() {
    with_test_externalities(|| {
        let parameters = BridgeConstraints {
            operator_account: Some(account!(1)),
            pauser_accounts: Some(vec![account!(2)]),
            bridging_fee: None,
            thawn_duration: Some(1),
            remote_chains: None,
        };
        ArgoBridge::update_bridge_constrains(RuntimeOrigin::root(), parameters).unwrap();

        ArgoBridge::pause_bridge(RuntimeOrigin::signed(account!(2))).unwrap();

        ArgoBridge::init_unpause_bridge(RuntimeOrigin::signed(account!(2))).unwrap();
        let current_block = <frame_system::Pallet<Test>>::block_number();
        assert_eq!(
            ArgoBridge::status(),
            BridgeStatus::Thawn {
                thawn_ends_at: current_block + 1
            }
        );
        increase_block_number_by(2);
        assert_ok!(ArgoBridge::finish_unpause_bridge(RuntimeOrigin::signed(
            account!(1)
        )));
    });
}

#[test]
fn unpause_bridge_during_thawn() {
    with_test_externalities(|| {
        let thawn_duration: BlockNumber = 2;
        let parameters = BridgeConstraints {
            operator_account: Some(account!(1)),
            pauser_accounts: Some(vec![account!(2)]),
            bridging_fee: None,
            thawn_duration: Some(thawn_duration),
            remote_chains: None,
        };
        ArgoBridge::update_bridge_constrains(RuntimeOrigin::root(), parameters).unwrap();

        ArgoBridge::pause_bridge(RuntimeOrigin::signed(account!(2))).unwrap();

        ArgoBridge::init_unpause_bridge(RuntimeOrigin::signed(account!(2))).unwrap();
        let current_block = <frame_system::Pallet<Test>>::block_number();
        assert_eq!(
            ArgoBridge::status(),
            BridgeStatus::Thawn {
                thawn_ends_at: current_block + thawn_duration
            }
        );
        increase_block_number_by(1);
        let result = ArgoBridge::finish_unpause_bridge(RuntimeOrigin::signed(account!(1)));
        assert_err!(result, Error::<Test>::ThawnNotFinished);
    });
}

#[test]
fn init_unpause_bridge_with_unathorized_account() {
    with_test_externalities(|| {
        let parameters = BridgeConstraints {
            operator_account: Some(account!(1)),
            pauser_accounts: Some(vec![account!(2)]),
            bridging_fee: None,
            thawn_duration: None,
            remote_chains: None,
        };
        ArgoBridge::update_bridge_constrains(RuntimeOrigin::root(), parameters).unwrap();

        ArgoBridge::pause_bridge(RuntimeOrigin::signed(account!(2))).unwrap();

        let result = ArgoBridge::init_unpause_bridge(RuntimeOrigin::signed(account!(1)));
        assert_err!(result, Error::<Test>::NotPauserAccount);
    });
}
