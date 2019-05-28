#![cfg(test)]

use super::mock::*;

use runtime_io::with_externalities;
use srml_support::*;

#[test]
fn set_ipns_id() {
    with_externalities(&mut initial_test_ext(), || {
        let current_block_number = 1000;
        System::set_block_number(current_block_number);

        let alice = alice_account();
        let identity = "alice".as_bytes().to_vec();
        assert!(Discovery::set_ipns_id(Origin::signed(alice), identity.clone()).is_ok());

        assert!(<discovery::AccountInfoByAccountId<Test>>::exists(&alice));
        let account_info = Discovery::account_info_by_account_id(&alice);
        assert_eq!(account_info, discovery::AccountInfo {
            identity: identity.clone(),
            ttl: current_block_number + Discovery::account_info_lifetime()
        });
        // Test for event

        // Non role account trying to set account into should fail
        assert!(Discovery::set_ipns_id(Origin::signed(100), identity.clone()).is_err());
    });
}

#[test]
fn unset_ipns_id() {
    with_externalities(&mut initial_test_ext(), || {
        assert!(false);
    });
}

//remove_account_info
//is_alive
