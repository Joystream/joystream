#![cfg(test)]

use crate::mock::*;
use crate::{AccountAddressMapping, Trait};
use hex::FromHex;
use sp_core::H160;
use sp_runtime::AccountId32;

type Mocks = InstanceMocks<Runtime>;
type MockUtils = InstanceMockUtils<Runtime>;

// test that environment bare setup is ok
#[test]
fn evm_first_test() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Signed(AccountId32::from(REGULAR_ACCOUNT_1));

        Mocks::transfer_value(origin, AccountId32::from(REGULAR_ACCOUNT_2));
    });
}

// Test that EVM address can be converted into Substrate account and vice versa
#[test]
fn address_account_conversions() {
    let config = default_genesis_config();

    // TODO: handle rest of the 32 bytes (last 12 bytes - 20 are handled now)
    build_test_externalities(config).execute_with(|| {
        let account_id = AccountId32::from(REGULAR_ACCOUNT_1);

        let address = <Runtime as Trait>::AccountAddressMapping::into_address(&account_id);

        let account_id_derived =
            <Runtime as Trait>::AccountAddressMapping::into_account_id(&address);

        assert!(MockUtils::accounts_compare_20_bytes(
            &account_id,
            &account_id_derived
        ));

        // last 12 bytes will was lost during the conversion so the addresses are not completely equal
        assert_ne!(account_id_derived, account_id);
    });
}

// Test that contract can be deployed to EVM.
#[test]
fn contract_deployement() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Root;

        let bytecode = MockUtils::get_testing_contract();

        Mocks::deploy_smart_contract(origin, AccountId32::from(REGULAR_ACCOUNT_1), bytecode);
    });
}

// Test that contract can be deployed to EVM.
#[test]
fn contract_call() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin_deploy = OriginType::Root;
        let origin_call = OriginType::Signed(AccountId32::from(REGULAR_ACCOUNT_1));

        let bytecode_deploy = MockUtils::get_testing_contract();
        let bytecode_call = MockUtils::get_testing_contract_call();

        Mocks::deploy_smart_contract(
            origin_deploy.clone(),
            AccountId32::from(REGULAR_ACCOUNT_1),
            bytecode_deploy,
        );

        // TODO: read this from extrinsic result
        let tmp_address = "1c81a61a407017c58397a47d2ab28191b9b8ec9b";
        let tmp_address2 = Vec::from_hex(tmp_address).expect("Invalid hex");
        let deployed_address = H160::from_slice(tmp_address2.as_slice());

        let deployed_account_id =
            <Runtime as Trait>::AccountAddressMapping::into_account_id(&deployed_address);

        Mocks::call_smart_contract(origin_call.clone(), deployed_account_id, bytecode_call);
    });
}
