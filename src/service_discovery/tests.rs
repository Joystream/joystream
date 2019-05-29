#![cfg(test)]

use super::mock::*;

use runtime_io::with_externalities;
use srml_support::*;
use system::{self, EventRecord, Phase};

#[test]
fn set_ipns_id() {
    with_externalities(&mut initial_test_ext(), || {
        let current_block_number = 1000;
        System::set_block_number(current_block_number);

        let alice = alice_account();
        let identity = "alice".as_bytes().to_vec();
        let ttl = discovery::MINIMUM_LIFETIME + 100;
        assert!(Discovery::set_ipns_id(Origin::signed(alice), identity.clone(), Some(ttl)).is_ok());

        assert!(<discovery::AccountInfoByAccountId<Test>>::exists(&alice));
        let account_info = Discovery::account_info_by_account_id(&alice);
        assert_eq!(
            account_info,
            discovery::AccountInfo {
                identity: identity.clone(),
                expires_at: current_block_number + ttl
            }
        );

        assert_eq!(
            *System::events().last().unwrap(),
            EventRecord {
                phase: Phase::ApplyExtrinsic(0),
                event: MetaEvent::discovery(discovery::RawEvent::AccountInfoUpdated(
                    alice,
                    identity.clone()
                )),
            }
        );

        // Non role account trying to set account into should fail
        let bob = bob_account();
        assert!(Discovery::set_ipns_id(Origin::signed(bob), identity.clone(), None).is_err());
        assert!(!<discovery::AccountInfoByAccountId<Test>>::exists(&bob));
    });
}

#[test]
fn unset_ipns_id() {
    with_externalities(&mut initial_test_ext(), || {
        let alice = alice_account();

        <discovery::AccountInfoByAccountId<Test>>::insert(
            &alice,
            discovery::AccountInfo {
                expires_at: 1000,
                identity: "alice".as_bytes().to_vec(),
            },
        );

        assert!(<discovery::AccountInfoByAccountId<Test>>::exists(&alice));

        assert!(Discovery::unset_ipns_id(Origin::signed(alice)).is_ok());
        assert!(!<discovery::AccountInfoByAccountId<Test>>::exists(&alice));

        assert_eq!(
            *System::events().last().unwrap(),
            EventRecord {
                phase: Phase::ApplyExtrinsic(0),
                event: MetaEvent::discovery(discovery::RawEvent::AccountInfoRemoved(alice)),
            }
        );
    });
}

//remove_account_info
//is_alive
