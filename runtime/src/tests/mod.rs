//! The Joystream Substrate Node runtime integration tests.

#![cfg(test)]
#[macro_use]

mod proposals_integration;
mod storage_integration;

use crate::Runtime;
use frame_support::traits::Currency;
use frame_system::RawOrigin;
use sp_runtime::{AccountId32, BuildStorage};

type Membership = membership::Module<Runtime>;

pub(crate) fn initial_test_ext() -> sp_io::TestExternalities {
    let mut t = frame_system::GenesisConfig::default()
        .build_storage::<Runtime>()
        .unwrap();

    // build the council config to initialize the mint
    let council_config = governance::council::GenesisConfig::<crate::Runtime>::default()
        .build_storage()
        .unwrap();

    council_config.assimilate_storage(&mut t).unwrap();

    t.into()
}

pub(crate) fn insert_member(account_id: AccountId32) {
    increase_total_balance_issuance_using_account_id(
        account_id.clone(),
        crate::MembershipFee::get(),
    );
    let handle: &[u8] = account_id.as_ref();
    Membership::buy_membership(
        RawOrigin::Signed(account_id.clone()).into(),
        Some(handle.to_vec()),
        None,
        None,
    )
    .unwrap();
}

pub(crate) fn increase_total_balance_issuance_using_account_id(
    account_id: AccountId32,
    balance: u128,
) {
    type Balances = pallet_balances::Module<Runtime>;
    let initial_balance = Balances::total_issuance();
    {
        let _ = Balances::deposit_creating(&account_id, balance);
    }
    assert_eq!(Balances::total_issuance(), initial_balance + balance);
}
