#![cfg(test)]

use super::mock::*;

use system::{EventRecord, Phase, RawOrigin};

#[test]
fn set_ipns_id() {
    initial_test_ext().execute_with(|| {
        let current_block_number = 1000;
        System::set_block_number(current_block_number);

        let (storage_provider_account_id, storage_provider_id) = hire_storage_provider();

        let identity = "alice".as_bytes().to_vec();
        let ttl = <Test as system::Trait>::BlockNumber::from(DEFAULT_LIFETIME);
        assert!(Discovery::set_ipns_id(
            Origin::signed(storage_provider_account_id),
            storage_provider_id,
            identity.clone(),
        )
        .is_ok());

        assert!(<AccountInfoByStorageProviderId<Test>>::contains_key(
            &storage_provider_id
        ));
        let account_info = Discovery::account_info_by_storage_provider_id(&storage_provider_id);
        assert_eq!(
            account_info,
            AccountInfo {
                identity: identity.clone(),
                expires_at: current_block_number + ttl
            }
        );

        assert_eq!(
            *System::events().last().unwrap(),
            EventRecord {
                phase: Phase::Initialization,
                event: MetaEvent::discovery(RawEvent::AccountInfoUpdated(
                    storage_provider_id,
                    identity.clone()
                )),
                topics: vec![]
            }
        );

        // Invalid storage provider data
        let invalid_storage_provider_id = 2;
        let invalid_storage_provider_account_id = 2;
        assert!(Discovery::set_ipns_id(
            Origin::signed(invalid_storage_provider_id),
            invalid_storage_provider_account_id,
            identity.clone(),
        )
        .is_err());
        assert!(!<AccountInfoByStorageProviderId<Test>>::contains_key(
            &invalid_storage_provider_id
        ));
    });
}

#[test]
fn unset_ipns_id() {
    initial_test_ext().execute_with(|| {
        let current_block_number = 1000;
        System::set_block_number(current_block_number);

        let (storage_provider_account_id, storage_provider_id) = hire_storage_provider();

        <AccountInfoByStorageProviderId<Test>>::insert(
            &storage_provider_id,
            AccountInfo {
                expires_at: 1000,
                identity: "alice".as_bytes().to_vec(),
            },
        );

        assert!(<AccountInfoByStorageProviderId<Test>>::contains_key(
            &storage_provider_account_id
        ));

        assert!(Discovery::unset_ipns_id(
            Origin::signed(storage_provider_account_id),
            storage_provider_id
        )
        .is_ok());
        assert!(!<AccountInfoByStorageProviderId<Test>>::contains_key(
            &storage_provider_account_id
        ));

        assert_eq!(
            *System::events().last().unwrap(),
            EventRecord {
                phase: Phase::Initialization,
                event: MetaEvent::discovery(RawEvent::AccountInfoRemoved(storage_provider_id)),
                topics: vec![]
            }
        );

        // Invalid storage provider data
        let invalid_storage_provider_id = 2;
        let invalid_storage_provider_account_id = 2;
        assert!(Discovery::unset_ipns_id(
            Origin::signed(invalid_storage_provider_id),
            invalid_storage_provider_account_id,
        )
        .is_err());
        assert!(!<AccountInfoByStorageProviderId<Test>>::contains_key(
            &invalid_storage_provider_id
        ));
    });
}

#[test]
fn is_account_info_expired() {
    initial_test_ext().execute_with(|| {
        let storage_provider_id = 1;
        let expires_at = 1000;
        let id = "alice".as_bytes().to_vec();
        <AccountInfoByStorageProviderId<Test>>::insert(
            &storage_provider_id,
            AccountInfo {
                expires_at,
                identity: id.clone(),
            },
        );

        System::set_block_number(expires_at - 10);
        assert!(!Discovery::is_account_info_expired(&storage_provider_id));

        System::set_block_number(expires_at + 10);
        assert!(Discovery::is_account_info_expired(&storage_provider_id));
    });
}

#[test]
fn set_default_lifetime() {
    initial_test_ext().execute_with(|| {
        let lifetime = <Test as system::Trait>::BlockNumber::from(MINIMUM_LIFETIME + 2000);
        // privileged method should fail if not from root origin
        assert!(
            Discovery::set_default_lifetime(Origin::signed(1), lifetime).is_err(),
            ""
        );
        assert!(
            Discovery::set_default_lifetime(RawOrigin::Root.into(), lifetime).is_ok(),
            ""
        );
        assert_eq!(Discovery::default_lifetime(), lifetime, "");

        // cannot set default lifetime to less than minimum
        let less_than_min_lifetime =
            <Test as system::Trait>::BlockNumber::from(MINIMUM_LIFETIME - 1);
        assert!(
            Discovery::set_default_lifetime(RawOrigin::Root.into(), less_than_min_lifetime)
                .is_err(),
            ""
        );
    });
}

#[test]
fn set_bootstrap_endpoints() {
    initial_test_ext().execute_with(|| {
        let endpoints = vec!["endpoint1".as_bytes().to_vec()];
        // privileged method should fail if not from root origin
        assert!(
            Discovery::set_bootstrap_endpoints(Origin::signed(1), endpoints.clone()).is_err(),
            ""
        );
        assert!(
            Discovery::set_bootstrap_endpoints(RawOrigin::Root.into(), endpoints.clone()).is_ok(),
            ""
        );
        assert_eq!(Discovery::bootstrap_endpoints(), endpoints, "");
    });
}
