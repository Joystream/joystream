#![cfg(test)]

use super::mock::*;

use runtime_io::with_externalities;
use srml_support::*;

fn assert_ok_unwrap<T>(value: Option<T>, err: &'static str) -> T {
    match value {
        None => {
            assert!(false, err);
            value.unwrap()
        }
        Some(v) => v,
    }
}

fn assert_dispatch_error_message(result: Result<(), &'static str>, expected_message: &'static str) {
    assert!(result.is_err());
    let message = result.err().unwrap();
    assert_eq!(message, expected_message);
}

fn get_alice_info() -> members::UserInfo {
    members::UserInfo {
        handle: Some(String::from("alice").as_bytes().to_vec()),
        avatar_uri: Some(
            String::from("http://avatar-url.com/alice")
                .as_bytes()
                .to_vec(),
        ),
        about: Some(String::from("my name is alice").as_bytes().to_vec()),
    }
}

fn get_bob_info() -> members::UserInfo {
    members::UserInfo {
        handle: Some(String::from("bobby").as_bytes().to_vec()),
        avatar_uri: Some(
            String::from("http://avatar-url.com/bob")
                .as_bytes()
                .to_vec(),
        ),
        about: Some(String::from("my name is bob").as_bytes().to_vec()),
    }
}

const ALICE_ACCOUNT_ID: u64 = 1;

fn buy_default_membership_as_alice() -> dispatch::Result {
    Members::buy_membership(
        Origin::signed(ALICE_ACCOUNT_ID),
        DEFAULT_PAID_TERM_ID,
        get_alice_info(),
    )
}

fn set_alice_free_balance(balance: u64) {
    let _ = Balances::deposit_creating(&ALICE_ACCOUNT_ID, balance);
}

#[test]
fn initial_state() {
    const DEFAULT_FEE: u64 = 500;
    const DEFAULT_FIRST_ID: u32 = 1000;
    let initial_members = [1, 2, 3];

    with_externalities(
        &mut ExtBuilder::default()
            .default_paid_membership_fee(DEFAULT_FEE)
            .first_member_id(DEFAULT_FIRST_ID)
            .members(initial_members.to_vec())
            .build(),
        || {
            assert_eq!(Members::first_member_id(), DEFAULT_FIRST_ID);
            assert_eq!(
                Members::next_member_id(),
                DEFAULT_FIRST_ID + initial_members.len() as u32
            );

            let default_terms = assert_ok_unwrap(
                Members::paid_membership_terms_by_id(DEFAULT_PAID_TERM_ID),
                "default terms not initialized",
            );

            assert_eq!(default_terms.fee, DEFAULT_FEE);
        },
    );
}

#[test]
fn buy_membership() {
    const DEFAULT_FEE: u64 = 500;
    const DEFAULT_FIRST_ID: u32 = 1000;
    const SURPLUS_BALANCE: u64 = 500;

    with_externalities(
        &mut ExtBuilder::default()
            .default_paid_membership_fee(DEFAULT_FEE)
            .first_member_id(DEFAULT_FIRST_ID)
            .build(),
        || {
            let initial_balance = DEFAULT_FEE + SURPLUS_BALANCE;
            set_alice_free_balance(initial_balance);

            assert_ok!(buy_default_membership_as_alice());

            let member_id = assert_ok_unwrap(
                Members::member_id_by_account_id(&ALICE_ACCOUNT_ID),
                "member id not assigned",
            );

            let profile = assert_ok_unwrap(
                Members::member_profile(&member_id),
                "member profile not created",
            );

            assert_eq!(Some(profile.handle), get_alice_info().handle);
            assert_eq!(Some(profile.avatar_uri), get_alice_info().avatar_uri);
            assert_eq!(Some(profile.about), get_alice_info().about);

            assert_eq!(Balances::free_balance(&ALICE_ACCOUNT_ID), SURPLUS_BALANCE);

            // controller account initially set to primary account
            assert_eq!(profile.controller_account, ALICE_ACCOUNT_ID);
        },
    );
}

#[test]
fn buy_membership_fails_without_enough_balance() {
    const DEFAULT_FEE: u64 = 500;

    with_externalities(
        &mut ExtBuilder::default()
            .default_paid_membership_fee(DEFAULT_FEE)
            .build(),
        || {
            let initial_balance = DEFAULT_FEE - 1;
            set_alice_free_balance(initial_balance);

            assert_dispatch_error_message(
                buy_default_membership_as_alice(),
                "not enough balance to buy membership",
            );
        },
    );
}

#[test]
fn new_memberships_allowed_flag() {
    const DEFAULT_FEE: u64 = 500;

    with_externalities(
        &mut ExtBuilder::default()
            .default_paid_membership_fee(DEFAULT_FEE)
            .build(),
        || {
            let initial_balance = DEFAULT_FEE + 1;
            set_alice_free_balance(initial_balance);

            members::NewMembershipsAllowed::put(false);

            assert_dispatch_error_message(
                buy_default_membership_as_alice(),
                "new members not allowed",
            );
        },
    );
}

#[test]
fn account_cannot_create_multiple_memberships() {
    const DEFAULT_FEE: u64 = 500;
    const SURPLUS_BALANCE: u64 = 500;

    with_externalities(
        &mut ExtBuilder::default()
            .default_paid_membership_fee(DEFAULT_FEE)
            .members(vec![ALICE_ACCOUNT_ID])
            .build(),
        || {
            let initial_balance = DEFAULT_FEE + SURPLUS_BALANCE;
            set_alice_free_balance(initial_balance);

            // assert alice member exists
            assert!(Members::member_id_by_account_id(&ALICE_ACCOUNT_ID).is_some());

            // buying membership should fail...
            assert_dispatch_error_message(
                buy_default_membership_as_alice(),
                "account already associated with a membership",
            );
        },
    );
}

#[test]
fn unique_handles() {
    const DEFAULT_FEE: u64 = 500;
    const SURPLUS_BALANCE: u64 = 500;

    with_externalities(
        &mut ExtBuilder::default()
            .default_paid_membership_fee(DEFAULT_FEE)
            .build(),
        || {
            let initial_balance = DEFAULT_FEE + SURPLUS_BALANCE;
            set_alice_free_balance(initial_balance);

            // alice's handle already taken
            <members::Handles<Test>>::insert(get_alice_info().handle.unwrap(), 1);

            // should not be allowed to buy membership with that handle
            assert_dispatch_error_message(
                buy_default_membership_as_alice(),
                "handle already registered",
            );
        },
    );
}

#[test]
fn update_profile() {
    const DEFAULT_FEE: u64 = 500;
    const SURPLUS_BALANCE: u64 = 500;

    with_externalities(
        &mut ExtBuilder::default()
            .default_paid_membership_fee(DEFAULT_FEE)
            .build(),
        || {
            let initial_balance = DEFAULT_FEE + SURPLUS_BALANCE;
            set_alice_free_balance(initial_balance);

            assert_ok!(buy_default_membership_as_alice());

            assert_ok!(Members::update_profile(
                Origin::signed(ALICE_ACCOUNT_ID),
                get_bob_info()
            ));

            let member_id = assert_ok_unwrap(
                Members::member_id_by_account_id(&ALICE_ACCOUNT_ID),
                "member id not assigned",
            );

            let profile = assert_ok_unwrap(
                Members::member_profile(&member_id),
                "member profile not created",
            );

            assert_eq!(Some(profile.handle), get_bob_info().handle);
            assert_eq!(Some(profile.avatar_uri), get_bob_info().avatar_uri);
            assert_eq!(Some(profile.about), get_bob_info().about);
        },
    );
}

#[test]
fn add_screened_member() {
    with_externalities(&mut ExtBuilder::default().build(), || {
        let screening_authority = 5;
        <members::ScreeningAuthority<Test>>::put(&screening_authority);

        assert_ok!(Members::add_screened_member(
            Origin::signed(screening_authority),
            ALICE_ACCOUNT_ID,
            get_alice_info()
        ));

        let member_id = assert_ok_unwrap(
            Members::member_id_by_account_id(&ALICE_ACCOUNT_ID),
            "member id not assigned",
        );

        let profile = assert_ok_unwrap(
            Members::member_profile(&member_id),
            "member profile not created",
        );

        assert_eq!(Some(profile.handle), get_alice_info().handle);
        assert_eq!(Some(profile.avatar_uri), get_alice_info().avatar_uri);
        assert_eq!(Some(profile.about), get_alice_info().about);
        assert_eq!(
            members::EntryMethod::Screening(screening_authority),
            profile.entry
        );
    });
}
