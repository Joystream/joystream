#![cfg(feature = "runtime-benchmarks")]

use super::*;
use crate::types::*;
use crate::vec::Vec;
use crate::Module as ArgoBridge;
use balances::Pallet as Balances;
use core::convert::TryFrom;
use frame_benchmarking::v1::{account, benchmarks};
use frame_system::Pallet as System;
use frame_system::{EventRecord, RawOrigin};

use crate::{BridgeConstraints, BridgeStatus, RemoteAccount, RemoteTransfer};

const SEED: u32 = 0;

// We create this trait because we need to be compatible with the runtime
// in the mock for tests. In that case we need to be able to have `membership_id == account_id`
// We can't create an account from an `u32` or from a memberhsip_dd,
// so this trait allows us to get an account id from an u32, in the case of `64` which is what
// the mock use we get the parameter as a return.
// In the case of `AccountId32` we use the method provided by `frame_benchmarking` to get an
// AccountId.
pub trait CreateAccountId {
    fn create_account_id(id: u32) -> Self;
}

impl CreateAccountId for u64 {
    fn create_account_id(id: u32) -> Self {
        id.into()
    }
}

impl CreateAccountId for u32 {
    fn create_account_id(id: u32) -> Self {
        id.into()
    }
}

impl CreateAccountId for sp_core::crypto::AccountId32 {
    fn create_account_id(id: u32) -> Self {
        account::<Self>("default", id, SEED)
    }
}

fn assert_last_event<T: Config>(generic_event: <T as Config>::RuntimeEvent) {
    let events = frame_system::Pallet::<T>::events();
    let system_event: <T as frame_system::Config>::RuntimeEvent = generic_event.into();
    assert!(
        !events.is_empty(),
        "If you are checking for last event there must be at least 1 event"
    );
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

fn activate_bridge<T: Config>(pauser_acount: &T::AccountId, operator_acount: &T::AccountId) {
    let pauser_origin = RawOrigin::Signed(pauser_acount.clone());
    ArgoBridge::<T>::init_unpause_bridge(pauser_origin.clone().into()).unwrap();
    System::<T>::set_block_number(3u32.into());
    ArgoBridge::<T>::finish_unpause_bridge(RawOrigin::Signed(operator_acount.clone()).into())
        .unwrap();
}

fn set_bridge_mint_allowance<T: Config>(amount: BalanceOf<T>, fee: BalanceOf<T>)
where
    T::AccountId: CreateAccountId,
{
    let sender = T::AccountId::create_account_id(1u32.into());
    let _ = Balances::<T>::deposit_creating(
        &sender,
        T::ExistentialDeposit::get() + amount.into() + fee + 10u32.into(),
    );
    let remote_account = RemoteAccount {
        account: [0; 32],
        chain_id: MAX_REMOTE_CHAINS - 1,
    };
    ArgoBridge::<T>::request_outbound_transfer(
        RawOrigin::Signed(sender.clone()).into(),
        remote_account,
        amount + fee,
        fee,
    )
    .unwrap();
}

benchmarks! {
    where_clause {
        where
        T::AccountId: CreateAccountId
    }

    // Worst case scenario:
    // - max number of remote chains being use
    // - using the last chain
    request_outbound_transfer{
        let fee: BalanceOf<T> = 10u32.into();
        let remote_chains: Vec<u32> = (0..MAX_REMOTE_CHAINS).collect();
        let pauser_acount = T::AccountId::create_account_id(1);
        let operator_account = T::AccountId::create_account_id(1u32.into());
        let parameters = BridgeConstraints {
            operator_account: Some(operator_account.clone()),
            pauser_accounts: Some(vec![pauser_acount.clone().into()]),
            bridging_fee: Some(fee),
            thawn_duration: Some(1u32.into()),
            remote_chains: Some(BoundedVec::try_from(remote_chains).unwrap())
        };

        ArgoBridge::<T>::update_bridge_constrains(
            RawOrigin::Root.into(),
            parameters
        ).unwrap();
        activate_bridge::<T>(&pauser_acount, &operator_account);

        let initial_balance: u32 = 1030u32.into();
        let sender = T::AccountId::create_account_id(1u32.into());
        let _ = Balances::<T>::deposit_creating(&sender, T::ExistentialDeposit::get() + initial_balance.into());

        let dest_account = RemoteAccount {
            account: [0; 32],
            chain_id: MAX_REMOTE_CHAINS - 1,
        };
        let origin = RawOrigin::Signed(sender);
        let transfer_id = ArgoBridge::<T>::next_transfer_id();
        let transfer_amount = 100u32.into();
    }: _(origin, dest_account, transfer_amount, fee)
    verify {
        let sender = T::AccountId::create_account_id(1u32.into());
        assert_last_event::<T>(
            RawEvent::OutboundTransferRequested(transfer_id, sender, dest_account, transfer_amount, fee).into());
    }


    // Worst case scenario:
    // - max number of remote chains being use
    // - using the last chain
    finalize_inbound_transfer{
        let fee: BalanceOf<T> = 10u32.into();
        let remote_chains: Vec<u32> = (0..MAX_REMOTE_CHAINS).collect();
        let pauser_acount = T::AccountId::create_account_id(1);
        let operator_account = T::AccountId::create_account_id(1u32.into());
        let parameters = BridgeConstraints {
            operator_account: Some(operator_account.clone()),
            pauser_accounts: Some(vec![pauser_acount.clone().into()]),
            bridging_fee: Some(fee),
            thawn_duration: Some(1u32.into()),
            remote_chains: Some(BoundedVec::try_from(remote_chains).unwrap())
        };
        ArgoBridge::<T>::update_bridge_constrains(
            RawOrigin::Root.into(),
            parameters
        ).unwrap();
        activate_bridge::<T>(&pauser_acount, &operator_account);

        let transfer_amount = 100u32.into();
        set_bridge_mint_allowance::<T>(1030u32.into(), fee);

        let operator = T::AccountId::create_account_id(1u32.into());
        let dest_account = T::AccountId::create_account_id(1u32.into());
        let remote_transfer = RemoteTransfer { id: 0, chain_id: MAX_REMOTE_CHAINS - 1 };
    }: _(RawOrigin::Signed(operator), remote_transfer.clone(), dest_account.clone(), transfer_amount)
    verify {
        assert_last_event::<T>(
            RawEvent::InboundTransferFinalized(remote_transfer, dest_account, transfer_amount).into());
    }

    // Worst case scenario:
    // - max number of pauser accounts being use
    // - using the last pauser account
    pause_bridge{
        let pauser_accounts: Vec<T::AccountId> = (0..T::MaxPauserAccounts::get())
        .map(|i| T::AccountId::create_account_id(i))
        .collect();
        let operator_account = T::AccountId::create_account_id(1u32.into());
        let parameters = BridgeConstraints {
            operator_account: Some(operator_account.clone()),
            pauser_accounts: Some(pauser_accounts.clone()),
            bridging_fee: None,
            thawn_duration: Some(1u32.into()),
            remote_chains: None
        };
        ArgoBridge::<T>::update_bridge_constrains(
            RawOrigin::Root.into(),
            parameters
        ).unwrap();
        activate_bridge::<T>(&pauser_accounts[0], &operator_account);

        let pauser_acount = T::AccountId::create_account_id((T::MaxPauserAccounts::get() - 1).into());
    }: _(RawOrigin::Signed(pauser_acount.clone()))
    verify {
        assert_eq!(ArgoBridge::<T>::status(), BridgeStatus::Paused);
        assert_last_event::<T>(
            RawEvent::BridgePaused(pauser_acount.clone()).into());
    }

    // Worst case scenario:
    // - max number of pauser accounts being use
    // - using the last pauser account
    init_unpause_bridge{
        let pauser_accounts: Vec<T::AccountId> = (0..T::MaxPauserAccounts::get())
        .map(|i| T::AccountId::create_account_id(i))
        .collect();
        let operator_account = T::AccountId::create_account_id(1u32.into());
        let parameters = BridgeConstraints {
            operator_account: Some(operator_account.clone()),
            pauser_accounts: Some(pauser_accounts.clone()),
            bridging_fee: None,
            thawn_duration: Some(1u32.into()),
            remote_chains: None
        };
        ArgoBridge::<T>::update_bridge_constrains(
            RawOrigin::Root.into(),
            parameters
        ).unwrap();
        activate_bridge::<T>(&pauser_accounts[0], &operator_account);

        let pauser_acount = T::AccountId::create_account_id((T::MaxPauserAccounts::get() - 1) .into());
        ArgoBridge::<T>::pause_bridge(RawOrigin::Signed(pauser_acount.clone()).into()).unwrap();
    }: _(RawOrigin::Signed(pauser_acount.clone()))
    verify {
        let current_block = System::<T>::block_number();
        assert_last_event::<T>(
            RawEvent::BridgeThawnStarted(pauser_acount, current_block + 1u32.into()).into());
    }

    // Worst case scenario:
    // - max number of pauser accounts being use
    // - using the last pauser account
    finish_unpause_bridge{
        let pauser_accounts: Vec<T::AccountId> = (0..T::MaxPauserAccounts::get())
        .map(|i| T::AccountId::create_account_id(i))
        .collect();
        let operator_account = T::AccountId::create_account_id(1u32.into());
        let parameters = BridgeConstraints {
            operator_account: Some(operator_account.clone()),
            pauser_accounts: Some(pauser_accounts.clone()),
            bridging_fee: None,
            thawn_duration: Some(1u32.into()),
            remote_chains: None
        };
        ArgoBridge::<T>::update_bridge_constrains(
            RawOrigin::Root.into(),
            parameters
        ).unwrap();
        activate_bridge::<T>(&pauser_accounts[0], &operator_account);

        let pauser_acount = T::AccountId::create_account_id((T::MaxPauserAccounts::get() - 1) .into());
        let origin = RawOrigin::Signed(pauser_acount.clone());
        ArgoBridge::<T>::pause_bridge(origin.clone().into()).unwrap();
        ArgoBridge::<T>::init_unpause_bridge(origin.into()).unwrap();
        System::<T>::set_block_number(System::<T>::block_number() + 3u32.into());
    }: _(RawOrigin::Signed(operator_account))
    verify {
        let current_block = System::<T>::block_number();
        assert_last_event::<T>(
            RawEvent::BridgeThawnFinished().into());
    }

    // Worst case scenario:
    // - update all parameters
    update_bridge_constrains{
        let fee: BalanceOf<T> = 10u32.into();
        let pauser_accounts: Vec<T::AccountId> = (0..T::MaxPauserAccounts::get())
        .map(|i| T::AccountId::create_account_id(i))
        .collect();
        let operator_account = T::AccountId::create_account_id(1u32.into());
        let remote_chains: Vec<u32> = (0..MAX_REMOTE_CHAINS).collect();

        let parameters = BridgeConstraints {
            operator_account: Some(operator_account),
            pauser_accounts: Some(pauser_accounts),
            bridging_fee: Some(fee),
            thawn_duration: Some(1u32.into()),
            remote_chains: Some(BoundedVec::try_from(remote_chains).unwrap())
        };

    }: _(RawOrigin::Root, parameters.clone())
    verify {
        assert_last_event::<T>(
            RawEvent::BridgeConfigUpdated(parameters).into());
    }
}

#[cfg(test)]
mod tests {
    use crate::tests::mock::{with_test_externalities, Test};
    use frame_support::assert_ok;

    type ArgoBridge = crate::Module<Test>;

    #[test]
    fn test_request_outbound_transfer() {
        with_test_externalities(|| {
            assert_ok!(ArgoBridge::test_benchmark_request_outbound_transfer());
        });
    }

    #[test]
    fn test_finalize_inbound_transfer() {
        with_test_externalities(|| {
            assert_ok!(ArgoBridge::test_benchmark_finalize_inbound_transfer());
        });
    }

    #[test]
    fn test_pause_bridge() {
        with_test_externalities(|| {
            assert_ok!(ArgoBridge::test_benchmark_pause_bridge());
        });
    }

    #[test]
    fn test_init_unpause_bridge() {
        with_test_externalities(|| {
            assert_ok!(ArgoBridge::test_benchmark_init_unpause_bridge());
        });
    }

    #[test]
    fn test_finish_unpause_bridge() {
        with_test_externalities(|| {
            assert_ok!(ArgoBridge::test_benchmark_finish_unpause_bridge());
        });
    }

    #[test]
    fn test_init_update_bridge_constrains() {
        with_test_externalities(|| {
            assert_ok!(ArgoBridge::test_benchmark_update_bridge_constrains());
        });
    }
}
