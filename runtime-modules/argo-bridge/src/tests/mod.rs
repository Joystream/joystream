#![cfg(test)]

use core::convert::{TryFrom, TryInto};

use crate::tests::mock::*;
use frame_support::dispatch::DispatchResult;
use frame_support::{assert_err, assert_ok};
use sp_runtime::BoundedVec;

use crate::{
    account, joy, last_event_eq,
    tests::mock::{increase_block_number_by, AccountId, Balance, Balances, BlockNumber, Test},
    BridgeConstraints, BridgeStatus, RawEvent, RemoteAccount, RemoteTransfer,
};

use self::mock::{
    with_test_externalities, with_test_externalities_custom_mint_allowance, ArgoBridge,
    RuntimeOrigin,
};
use crate::Error;

pub mod mock;

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
        assert_ok!(activate_bridge(account!(2), account!(1)));

        let initial_balance = joy!(1020);
        let sender = account!(1);
        Balances::set_balance(RuntimeOrigin::root(), sender, initial_balance, joy!(0)).unwrap();

        let remote_account = RemoteAccount {
            account: [0; 32],
            chain_id: 1,
        };

        let transfer_amount = joy!(1000);
        let transfer_id = ArgoBridge::next_transfer_id();
        let result = ArgoBridge::request_outbound_transfer(
            RuntimeOrigin::signed(sender),
            remote_account,
            transfer_amount,
            fee,
        );
        assert_ok!(result);
        assert_eq!(ArgoBridge::mint_allowance(), transfer_amount);
        assert_eq!(
            Balances::free_balance(sender),
            initial_balance - transfer_amount - fee
        );
        last_event_eq!(RawEvent::OutboundTransferRequested(
            transfer_id,
            sender,
            remote_account,
            transfer_amount,
            fee
        ));
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

        let sender = account!(1);
        let transfer_amount = joy!(1000);
        Balances::set_balance(RuntimeOrigin::root(), sender, transfer_amount, joy!(0)).unwrap();

        let remote_account = RemoteAccount {
            account: [0; 32],
            chain_id: 1,
        };
        let result = ArgoBridge::request_outbound_transfer(
            RuntimeOrigin::signed(sender),
            remote_account,
            transfer_amount,
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
        assert_ok!(activate_bridge(account!(2), account!(1)));

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
        assert_ok!(activate_bridge(account!(2), account!(1)));

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
fn request_outbound_transfer_with_not_supported_remote_chain() {
    with_test_externalities(|| {
        let parameters = BridgeConstraints {
            operator_account: Some(account!(1)),
            pauser_accounts: Some(vec![account!(2), account!(3)]),
            bridging_fee: Some(joy!(20)),
            thawn_duration: None,
            remote_chains: Some(BoundedVec::try_from(vec![1u32]).unwrap()),
        };
        assert_ok!(ArgoBridge::update_bridge_constrains(
            RuntimeOrigin::root(),
            parameters
        ));
        assert_ok!(activate_bridge(account!(2), account!(1)));

        let transfer_amount = joy!(1000);
        assert_ok!(Balances::set_balance(
            RuntimeOrigin::root(),
            account!(1),
            transfer_amount + 50,
            joy!(0)
        ));

        let remote_account = RemoteAccount {
            account: [0; 32],
            chain_id: 2,
        };
        let result = ArgoBridge::request_outbound_transfer(
            RuntimeOrigin::signed(account!(1)),
            remote_account,
            transfer_amount,
            joy!(10),
        );
        assert_err!(result, Error::<Test>::NotSupportedRemoteChainId);
    });
}

#[test]
fn request_outbound_transfer_with_overflow() {
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
        assert_ok!(activate_bridge(account!(2), account!(1)));

        let transfer_amount = Balance::MAX;
        let sender = account!(1);

        let remote_account = RemoteAccount {
            account: [0; 32],
            chain_id: 1,
        };
        let result = ArgoBridge::request_outbound_transfer(
            RuntimeOrigin::signed(sender),
            remote_account,
            transfer_amount,
            fee,
        );
        assert_err!(result, Error::<Test>::ArithmeticError);
    });
}

#[test]
fn finalize_inbound_transfer_success() {
    with_test_externalities_custom_mint_allowance(joy!(1000), || {
        let remote_chains = BoundedVec::try_from(vec![1u32]).unwrap();
        let parameters = BridgeConstraints {
            operator_account: Some(account!(1)),
            pauser_accounts: Some(vec![account!(2)]),
            bridging_fee: None,
            thawn_duration: None,
            remote_chains: Some(remote_chains),
        };
        ArgoBridge::update_bridge_constrains(RuntimeOrigin::root(), parameters).unwrap();
        assert_ok!(activate_bridge(account!(2), account!(1)));

        let transfer_amount = joy!(1000);
        let dest_account = account!(2);
        let result = ArgoBridge::finalize_inbound_transfer(
            RuntimeOrigin::signed(account!(1)),
            RemoteTransfer { id: 0, chain_id: 1 },
            dest_account,
            transfer_amount,
        );
        assert_ok!(result);
        assert_eq!(Balances::free_balance(dest_account), transfer_amount);
        last_event_eq!(RawEvent::InboundTransferFinalized(
            RemoteTransfer { id: 0, chain_id: 1 },
            dest_account,
            transfer_amount
        ));
    });
}

#[test]
fn finalize_inbound_transfer_with_unauthorized_account() {
    with_test_externalities(|| {
        let remote_chains = BoundedVec::try_from(vec![1u32]).unwrap();
        let parameters = BridgeConstraints {
            operator_account: Some(account!(1)),
            pauser_accounts: Some(vec![account!(2)]),
            bridging_fee: None,
            thawn_duration: None,
            remote_chains: Some(remote_chains),
        };
        assert_ok!(ArgoBridge::update_bridge_constrains(
            RuntimeOrigin::root(),
            parameters
        ));
        assert_ok!(activate_bridge(account!(2), account!(1)));

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
            pauser_accounts: Some(vec![account!(2)]),
            bridging_fee: None,
            thawn_duration: None,
            remote_chains: Some(remote_chains),
        };
        assert_ok!(ArgoBridge::update_bridge_constrains(
            RuntimeOrigin::root(),
            parameters
        ));
        assert_ok!(activate_bridge(account!(2), account!(1)));

        let remote_transfer = RemoteTransfer { id: 0, chain_id: 1 };
        let result = ArgoBridge::finalize_inbound_transfer(
            RuntimeOrigin::signed(account!(1)),
            remote_transfer,
            account!(2),
            1000,
        );
        assert_err!(result, Error::<Test>::InsufficientBridgeMintAllowance);
    });
}

#[test]
fn finalize_inbound_transfer_with_bridge_paused() {
    with_test_externalities(|| {
        let remote_chains = BoundedVec::try_from(vec![1u32]).unwrap();
        let parameters = BridgeConstraints {
            operator_account: Some(account!(1)),
            pauser_accounts: Some(vec![account!(2)]),
            bridging_fee: None,
            thawn_duration: None,
            remote_chains: Some(remote_chains),
        };
        ArgoBridge::update_bridge_constrains(RuntimeOrigin::root(), parameters).unwrap();

        let remote_transfer = RemoteTransfer { id: 0, chain_id: 1 };
        let result = ArgoBridge::finalize_inbound_transfer(
            RuntimeOrigin::signed(account!(1)),
            remote_transfer,
            account!(2),
            1000,
        );
        assert_err!(result, Error::<Test>::BridgeNotActive);
    });
}

#[test]
fn revert_outbound_transfer_success() {
    with_test_externalities_custom_mint_allowance(joy!(1000), || {
        let remote_chains = BoundedVec::try_from(vec![1u32]).unwrap();
        let parameters = BridgeConstraints {
            operator_account: Some(account!(1)),
            pauser_accounts: Some(vec![account!(2)]),
            bridging_fee: None,
            thawn_duration: None,
            remote_chains: Some(remote_chains),
        };
        ArgoBridge::update_bridge_constrains(RuntimeOrigin::root(), parameters).unwrap();
        assert_ok!(activate_bridge(account!(2), account!(1)));

        let transfer_id = 1u64;
        let revert_amount = joy!(123);
        let revert_account = account!(2);
        let rationale = "test".as_bytes().to_vec();
        let result = ArgoBridge::revert_outbound_transfer(
            RuntimeOrigin::signed(account!(1)),
            transfer_id,
            revert_account,
            revert_amount,
            rationale.clone().try_into().unwrap(),
        );
        assert_ok!(result);
        assert_eq!(Balances::free_balance(revert_account), revert_amount);
        last_event_eq!(RawEvent::OutboundTransferReverted(
            transfer_id,
            revert_account,
            revert_amount,
            rationale.try_into().unwrap(),
        ));
    });
}

#[test]
fn revert_outbound_transfer_with_unauthorized_account() {
    with_test_externalities(|| {
        let remote_chains = BoundedVec::try_from(vec![1u32]).unwrap();
        let parameters = BridgeConstraints {
            operator_account: Some(account!(1)),
            pauser_accounts: Some(vec![account!(2)]),
            bridging_fee: None,
            thawn_duration: None,
            remote_chains: Some(remote_chains),
        };
        assert_ok!(ArgoBridge::update_bridge_constrains(
            RuntimeOrigin::root(),
            parameters
        ));
        assert_ok!(activate_bridge(account!(2), account!(1)));

        let result = ArgoBridge::revert_outbound_transfer(
            RuntimeOrigin::signed(account!(2)),
            1u64,
            account!(2),
            joy!(123),
            vec![].try_into().unwrap(),
        );
        assert_err!(result, Error::<Test>::NotOperatorAccount);
    });
}

#[test]
fn revert_outbound_transfer_with_insufficient_bridge_mint() {
    with_test_externalities(|| {
        let remote_chains = BoundedVec::try_from(vec![1u32]).unwrap();
        let parameters = BridgeConstraints {
            operator_account: Some(account!(1)),
            pauser_accounts: Some(vec![account!(2)]),
            bridging_fee: None,
            thawn_duration: None,
            remote_chains: Some(remote_chains),
        };
        assert_ok!(ArgoBridge::update_bridge_constrains(
            RuntimeOrigin::root(),
            parameters
        ));
        assert_ok!(activate_bridge(account!(2), account!(1)));

        let result = ArgoBridge::revert_outbound_transfer(
            RuntimeOrigin::signed(account!(1)),
            1u64,
            account!(2),
            joy!(100),
            vec![].try_into().unwrap(),
        );
        assert_err!(result, Error::<Test>::InsufficientBridgeMintAllowance);
    });
}

#[test]
fn revert_outbound_transfer_with_bridge_paused() {
    with_test_externalities(|| {
        let remote_chains = BoundedVec::try_from(vec![1u32]).unwrap();
        let parameters = BridgeConstraints {
            operator_account: Some(account!(1)),
            pauser_accounts: Some(vec![account!(2)]),
            bridging_fee: None,
            thawn_duration: None,
            remote_chains: Some(remote_chains),
        };
        ArgoBridge::update_bridge_constrains(RuntimeOrigin::root(), parameters).unwrap();

        let result = ArgoBridge::revert_outbound_transfer(
            RuntimeOrigin::signed(account!(1)),
            1u64,
            account!(2),
            joy!(100),
            vec![].try_into().unwrap(),
        );
        assert_err!(result, Error::<Test>::BridgeNotActive);
    });
}

#[test]
fn pause_bridge_success() {
    with_test_externalities(|| {
        let pauser_account = account!(2);
        let parameters = BridgeConstraints {
            operator_account: Some(account!(1)),
            pauser_accounts: Some(vec![pauser_account]),
            bridging_fee: None,
            thawn_duration: None,
            remote_chains: None,
        };
        assert_ok!(ArgoBridge::update_bridge_constrains(
            RuntimeOrigin::root(),
            parameters
        ));
        assert_ok!(activate_bridge(pauser_account, account!(1)));
        assert_eq!(ArgoBridge::status(), BridgeStatus::Active);

        assert_ok!(ArgoBridge::pause_bridge(RuntimeOrigin::signed(
            pauser_account
        )));
        assert_eq!(ArgoBridge::status(), BridgeStatus::Paused);
        last_event_eq!(RawEvent::BridgePaused(pauser_account));
    });
}

#[test]
fn pause_bridge_with_unauthorized_account() {
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
        last_event_eq!(RawEvent::BridgeThawnFinished());
    });
}

#[test]
fn init_unpause_bridge_active() {
    with_test_externalities(|| {
        let parameters = BridgeConstraints {
            operator_account: Some(account!(1)),
            pauser_accounts: Some(vec![account!(2)]),
            bridging_fee: None,
            thawn_duration: None,
            remote_chains: None,
        };
        ArgoBridge::update_bridge_constrains(RuntimeOrigin::root(), parameters).unwrap();
        assert_ok!(activate_bridge(account!(2), account!(1)));

        let result = ArgoBridge::init_unpause_bridge(RuntimeOrigin::signed(account!(2)));
        assert_err!(result, Error::<Test>::BridgeNotPaused);
    });
}

#[test]
fn unpause_bridge_during_thawn() {
    with_test_externalities(|| {
        let thawn_duration: BlockNumber = 2;
        let operator = account!(1);
        let parameters = BridgeConstraints {
            operator_account: Some(operator),
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
        let result = ArgoBridge::finish_unpause_bridge(RuntimeOrigin::signed(operator));
        assert_err!(result, Error::<Test>::ThawnNotFinished);
    });
}

#[test]
fn unpause_bridge_without_operator_account() {
    with_test_externalities(|| {
        let thawn_duration: BlockNumber = 1;
        let parameters = BridgeConstraints {
            operator_account: None,
            pauser_accounts: Some(vec![account!(2)]),
            bridging_fee: None,
            thawn_duration: Some(thawn_duration),
            remote_chains: None,
        };
        ArgoBridge::update_bridge_constrains(RuntimeOrigin::root(), parameters).unwrap();
        ArgoBridge::init_unpause_bridge(RuntimeOrigin::signed(account!(2))).unwrap();

        increase_block_number_by(1);

        let result = ArgoBridge::finish_unpause_bridge(RuntimeOrigin::signed(account!(1)));
        assert_err!(result, Error::<Test>::OperatorAccountNotSet);
    });
}

#[test]
fn init_unpause_bridge_with_unauthorized_account() {
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

pub fn activate_bridge(pauser_account_id: u64, operator_account_id: u64) -> DispatchResult {
    let pauser_origin = RuntimeOrigin::signed(pauser_account_id);
    ArgoBridge::init_unpause_bridge(pauser_origin)?;
    System::set_block_number(3u32.into());
    ArgoBridge::finish_unpause_bridge(RuntimeOrigin::signed(operator_account_id))?;
    Ok(())
}
