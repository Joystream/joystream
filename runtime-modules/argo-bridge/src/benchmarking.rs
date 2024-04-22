#![cfg(feature = "runtime-benchmarks")]

use frame_support::{assert_err, assert_ok};

use super::*;
use crate::types::*;
use crate::Module as ArgoBridge;
use balances::Pallet as Balances;
use core::convert::TryFrom;
use frame_benchmarking::v1::{account, benchmarks};
use frame_system::Pallet as System;
use frame_system::{EventRecord, RawOrigin};
use sp_runtime::traits::One;
use sp_std::convert::TryInto;
use sp_std::vec;

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

benchmarks! {
    where_clause {
        where
        T: balances::Config,
        T::AccountId: CreateAccountId
    }

    request_outbound_transfer{
        let fee: BalanceOf<T> = 10u32.into();
        let remote_chains = BoundedVec::try_from(vec![1u32]).unwrap();
        let parameters = BridgeConstraints {
            operator_account: Some(T::AccountId::create_account_id(1u32.into())),
            pauser_accounts: Some(vec![T::AccountId::create_account_id(2u32.into())]),
            bridging_fee: Some(fee),
            thawn_duration: None::<T::BlockNumber>,
            remote_chains: Some(remote_chains)
        };
        assert_ok!(ArgoBridge::<T>::update_bridge_constrains(
            RawOrigin::Root.into(),
            parameters
        ));

        let dest_account = RemoteAccount {
            account: [0; 32],
            chain_id: 1,
        };
        let sender = T::AccountId::create_account_id(1u32.into());
        let origin = RawOrigin::Signed(sender);
        let transfer_id = ArgoBridge::<T>::next_transfer_id();
        let amount = 100u32.into();
    }: _(origin, dest_account, amount, fee)
    verify {
        let sender = T::AccountId::create_account_id(1u32.into());
        assert_last_event::<T>(
            RawEvent::OutboundTransferRequested(transfer_id, sender, dest_account, amount, fee).into());
    }
}

#[cfg(test)]
mod tests {}
