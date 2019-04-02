#![cfg(test)]

use super::*;
use super::mock::*;

use runtime_io::with_externalities;
use srml_support::*;

fn assert_ok_unwrap<T>(value: Option<T>, err: &'static str) -> T {
    match value {
        None => { assert!(false, err); value.unwrap() },
        Some(v) => v
    }
}

fn get_alice_info() -> members::UserInfo {
    members::UserInfo {
        handle: Some(String::from("alice").as_bytes().to_vec()),
        avatar_uri: Some(String::from("http://avatar-url.com/alice").as_bytes().to_vec()),
        about: Some(String::from("my name is alice").as_bytes().to_vec()),
    }
}

fn get_bob_info() -> members::UserInfo {
    members::UserInfo {
        handle: Some(String::from("bobby").as_bytes().to_vec()),
        avatar_uri: Some(String::from("http://avatar-url.com/bob").as_bytes().to_vec()),
        about: Some(String::from("my name is bob").as_bytes().to_vec()),
    }
}

const ALICE_ACCOUNT_ID: u64 = 1;
const DEFAULT_TERMS_ID: u32 = 0;

fn buy_default_membership_as_alice() -> dispatch::Result {
    Members::buy_membership(Origin::signed(ALICE_ACCOUNT_ID), DEFAULT_TERMS_ID, get_alice_info())
}

fn set_alice_free_balance(balance: u32) {
    Balances::deposit_creating(&ALICE_ACCOUNT_ID, balance);
}

#[test]
fn initial_state() {
    const DEFAULT_FEE: u32 = 500;
    const DEFAULT_FIRST_ID: u32 = 1000;

    with_externalities(&mut ExtBuilder::default()
        .default_paid_membership_fee(DEFAULT_FEE)
        .first_member_id(DEFAULT_FIRST_ID).build(), ||
    {
        assert_eq!(Members::first_member_id(), DEFAULT_FIRST_ID);
        assert_eq!(Members::next_member_id(), DEFAULT_FIRST_ID);

        let default_terms = assert_ok_unwrap(Members::paid_membership_terms_by_id(DEFAULT_TERMS_ID), "default terms not initialized");

        assert_eq!(default_terms.id, DEFAULT_TERMS_ID);
        assert_eq!(default_terms.fee, DEFAULT_FEE);
    });
}

#[test]
fn buy_membership() {
    const DEFAULT_FEE: u32 = 500;
    const DEFAULT_FIRST_ID: u32 = 1000;
    const SURPLUS_BALANCE: u32 = 500;

    with_externalities(&mut ExtBuilder::default()
        .default_paid_membership_fee(DEFAULT_FEE)
        .first_member_id(DEFAULT_FIRST_ID).build(), ||
    {
        let initial_balance = DEFAULT_FEE + SURPLUS_BALANCE;
        set_alice_free_balance(initial_balance);

        assert_ok!(buy_default_membership_as_alice());

        let member_id = assert_ok_unwrap(Members::member_id_by_account_id(&ALICE_ACCOUNT_ID), "member id not assigned");

        let profile = assert_ok_unwrap(Members::member_profile(&member_id), "member profile not created");

        assert_eq!(Some(profile.handle), get_alice_info().handle);
        assert_eq!(Some(profile.avatar_uri), get_alice_info().avatar_uri);
        assert_eq!(Some(profile.about), get_alice_info().about);

        assert_eq!(Balances::free_balance(&ALICE_ACCOUNT_ID), SURPLUS_BALANCE);

    });
}

#[test]
fn buy_membership_fails_without_enough_balance() {
    const DEFAULT_FEE: u32 = 500;

    with_externalities(&mut ExtBuilder::default()
        .default_paid_membership_fee(DEFAULT_FEE).build(), ||
    {
        let initial_balance = DEFAULT_FEE - 1;
        set_alice_free_balance(initial_balance);

        assert!(buy_default_membership_as_alice().is_err());
    });
}

#[test]
fn new_memberships_allowed_flag() {
    const DEFAULT_FEE: u32 = 500;

    with_externalities(&mut ExtBuilder::default()
        .default_paid_membership_fee(DEFAULT_FEE).build(), ||
    {
        let initial_balance = DEFAULT_FEE + 1;
        set_alice_free_balance(initial_balance);

        <members::NewMembershipsAllowed<Test>>::put(false);

        assert!(buy_default_membership_as_alice().is_err());
    });
}

#[test]
fn account_cannot_create_multiple_memberships() {
    const DEFAULT_FEE: u32 = 500;
    const SURPLUS_BALANCE: u32 = 500;

    with_externalities(&mut ExtBuilder::default()
        .default_paid_membership_fee(DEFAULT_FEE).build(), ||
    {
        let initial_balance = DEFAULT_FEE + SURPLUS_BALANCE;
        set_alice_free_balance(initial_balance);

        // First time it works
        assert_ok!(buy_default_membership_as_alice());

        // second attempt should fail
        assert!(buy_default_membership_as_alice().is_err());

    });
}

#[test]
fn unique_handles() {
    const DEFAULT_FEE: u32 = 500;
    const SURPLUS_BALANCE: u32 = 500;

    with_externalities(&mut ExtBuilder::default()
        .default_paid_membership_fee(DEFAULT_FEE).build(), ||
    {
        let initial_balance = DEFAULT_FEE + SURPLUS_BALANCE;
        set_alice_free_balance(initial_balance);

        // alice's handle already taken
        <members::Handles<Test>>::insert(get_alice_info().handle.unwrap(), 1);

        // should not be allowed to buy membership with that handle
        assert!(buy_default_membership_as_alice().is_err());

    });
}

#[test]
fn update_profile() {
    const DEFAULT_FEE: u32 = 500;
    const SURPLUS_BALANCE: u32 = 500;

    with_externalities(&mut ExtBuilder::default()
        .default_paid_membership_fee(DEFAULT_FEE).build(), ||
    {
        let initial_balance = DEFAULT_FEE + SURPLUS_BALANCE;
        set_alice_free_balance(initial_balance);

        assert_ok!(buy_default_membership_as_alice());

        assert_ok!(Members::update_profile(Origin::signed(ALICE_ACCOUNT_ID), get_bob_info()));

        let member_id = assert_ok_unwrap(Members::member_id_by_account_id(&ALICE_ACCOUNT_ID), "member id not assigned");

        let profile = assert_ok_unwrap(Members::member_profile(&member_id), "member profile created");

        assert_eq!(Some(profile.handle), get_bob_info().handle);
        assert_eq!(Some(profile.avatar_uri), get_bob_info().avatar_uri);
        assert_eq!(Some(profile.about), get_bob_info().about);

    });
}

#[test]
fn add_screened_member() {
    with_externalities(&mut ExtBuilder::default().build(), ||
    {
        let screening_authority = 5;
        <members::ScreeningAuthority<Test>>::put(&screening_authority);

        assert_ok!(Members::add_screened_member(Origin::signed(screening_authority), ALICE_ACCOUNT_ID, get_alice_info()));

        let member_id = assert_ok_unwrap(Members::member_id_by_account_id(&ALICE_ACCOUNT_ID), "member id not assigned");

        let profile = assert_ok_unwrap(Members::member_profile(&member_id), "member profile created");

        assert_eq!(Some(profile.handle), get_alice_info().handle);
        assert_eq!(Some(profile.avatar_uri), get_alice_info().avatar_uri);
        assert_eq!(Some(profile.about), get_alice_info().about);
        assert_eq!(members::EntryMethod::Screening(screening_authority), profile.entry);

    });
}
