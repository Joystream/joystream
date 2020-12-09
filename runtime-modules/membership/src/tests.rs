#![cfg(test)]

use super::genesis;
use super::mock::*;
use crate::Error;

use frame_support::dispatch::DispatchResult;
use frame_support::traits::{LockIdentifier, LockableCurrency, WithdrawReasons};
use frame_support::*;

fn get_membership_by_id(member_id: u64) -> crate::Membership<Test> {
    if <crate::MembershipById<Test>>::contains_key(member_id) {
        Members::membership(member_id)
    } else {
        panic!("member profile not created");
    }
}

fn assert_dispatch_error_message(result: DispatchResult, expected_result: DispatchResult) {
    assert!(result.is_err());
    assert_eq!(result, expected_result);
}

#[derive(Clone, Debug, PartialEq)]
pub struct TestUserInfo {
    pub handle: Option<Vec<u8>>,
    pub avatar_uri: Option<Vec<u8>>,
    pub about: Option<Vec<u8>>,
}

fn get_alice_info() -> TestUserInfo {
    TestUserInfo {
        handle: Some(String::from("alice").as_bytes().to_vec()),
        avatar_uri: Some(
            String::from("http://avatar-url.com/alice")
                .as_bytes()
                .to_vec(),
        ),
        about: Some(String::from("my name is alice").as_bytes().to_vec()),
    }
}

fn get_bob_info() -> TestUserInfo {
    TestUserInfo {
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

fn buy_default_membership_as_alice() -> DispatchResult {
    let info = get_alice_info();
    Members::buy_membership(
        Origin::signed(ALICE_ACCOUNT_ID),
        info.handle,
        info.avatar_uri,
        info.about,
    )
}

fn set_alice_free_balance(balance: u64) {
    let _ = Balances::deposit_creating(&ALICE_ACCOUNT_ID, balance);
}

#[test]
fn buy_membership() {
    const SURPLUS_BALANCE: u64 = 500;

    TestExternalitiesBuilder::<Test>::default()
        .set_membership_config(genesis::GenesisConfigBuilder::default().build())
        .build()
        .execute_with(|| {
            let initial_balance = MembershipFee::get() + SURPLUS_BALANCE;
            set_alice_free_balance(initial_balance);

            let next_member_id = Members::members_created();

            assert_ok!(buy_default_membership_as_alice());

            let member_ids = vec![0];
            assert_eq!(member_ids, vec![next_member_id]);

            let profile = get_membership_by_id(next_member_id);

            assert_eq!(Some(profile.handle), get_alice_info().handle);
            assert_eq!(Some(profile.avatar_uri), get_alice_info().avatar_uri);
            assert_eq!(Some(profile.about), get_alice_info().about);

            assert_eq!(Balances::free_balance(&ALICE_ACCOUNT_ID), SURPLUS_BALANCE);

            // controller account initially set to primary account
            assert_eq!(profile.controller_account, ALICE_ACCOUNT_ID);
            assert_eq!(
                <crate::MemberIdsByControllerAccountId<Test>>::get(ALICE_ACCOUNT_ID),
                vec![next_member_id]
            );
        });
}

#[test]
fn buy_membership_fails_without_enough_balance() {
    TestExternalitiesBuilder::<Test>::default()
        .set_membership_config(genesis::GenesisConfigBuilder::default().build())
        .build()
        .execute_with(|| {
            let initial_balance = MembershipFee::get() - 1;
            set_alice_free_balance(initial_balance);

            assert_dispatch_error_message(
                buy_default_membership_as_alice(),
                Err(Error::<Test>::NotEnoughBalanceToBuyMembership.into()),
            );
        });
}

#[test]
fn buy_membership_fails_without_enough_balance_with_locked_balance() {
    TestExternalitiesBuilder::<Test>::default()
        .set_membership_config(genesis::GenesisConfigBuilder::default().build())
        .build()
        .execute_with(|| {
            let initial_balance = MembershipFee::get();
            let lock_id = LockIdentifier::default();
            Balances::set_lock(lock_id, &ALICE_ACCOUNT_ID, 1, WithdrawReasons::all());
            set_alice_free_balance(initial_balance);

            assert_dispatch_error_message(
                buy_default_membership_as_alice(),
                Err(Error::<Test>::NotEnoughBalanceToBuyMembership.into()),
            );
        });
}

#[test]
fn new_memberships_allowed_flag() {
    TestExternalitiesBuilder::<Test>::default()
        .set_membership_config(genesis::GenesisConfigBuilder::default().build())
        .build()
        .execute_with(|| {
            let initial_balance = MembershipFee::get() + 1;
            set_alice_free_balance(initial_balance);

            crate::NewMembershipsAllowed::put(false);

            assert_dispatch_error_message(
                buy_default_membership_as_alice(),
                Err(Error::<Test>::NewMembersNotAllowed.into()),
            );
        });
}

#[test]
fn unique_handles() {
    const SURPLUS_BALANCE: u64 = 500;

    TestExternalitiesBuilder::<Test>::default()
        .set_membership_config(genesis::GenesisConfigBuilder::default().build())
        .build()
        .execute_with(|| {
            let initial_balance = MembershipFee::get() + SURPLUS_BALANCE;
            set_alice_free_balance(initial_balance);

            // alice's handle already taken
            <crate::MemberIdByHandle<Test>>::insert(get_alice_info().handle.unwrap(), 1);

            // should not be allowed to buy membership with that handle
            assert_dispatch_error_message(
                buy_default_membership_as_alice(),
                Err(Error::<Test>::HandleAlreadyRegistered.into()),
            );
        });
}

#[test]
fn update_profile() {
    const SURPLUS_BALANCE: u64 = 500;

    TestExternalitiesBuilder::<Test>::default()
        .set_membership_config(genesis::GenesisConfigBuilder::default().build())
        .build()
        .execute_with(|| {
            let initial_balance = MembershipFee::get() + SURPLUS_BALANCE;
            set_alice_free_balance(initial_balance);

            let next_member_id = Members::members_created();

            assert_ok!(buy_default_membership_as_alice());
            let info = get_bob_info();
            assert_ok!(Members::update_membership(
                Origin::signed(ALICE_ACCOUNT_ID),
                next_member_id,
                info.handle,
                info.avatar_uri,
                info.about,
            ));

            let profile = get_membership_by_id(next_member_id);

            assert_eq!(Some(profile.handle), get_bob_info().handle);
            assert_eq!(Some(profile.avatar_uri), get_bob_info().avatar_uri);
            assert_eq!(Some(profile.about), get_bob_info().about);
        });
}

#[test]
fn set_controller_key() {
    let initial_members = [(0, ALICE_ACCOUNT_ID)];
    const ALICE_CONTROLLER_ID: u64 = 2;

    TestExternalitiesBuilder::<Test>::default()
        .set_membership_config(
            genesis::GenesisConfigBuilder::default()
                .members(initial_members.to_vec())
                .build(),
        )
        .build()
        .execute_with(|| {
            let member_id = 0;

            assert_ok!(Members::set_controller_account(
                Origin::signed(ALICE_ACCOUNT_ID),
                member_id,
                ALICE_CONTROLLER_ID
            ));

            let profile = get_membership_by_id(member_id);

            assert_eq!(profile.controller_account, ALICE_CONTROLLER_ID);
            assert_eq!(
                <crate::MemberIdsByControllerAccountId<Test>>::get(&ALICE_CONTROLLER_ID),
                vec![member_id]
            );
            assert!(
                <crate::MemberIdsByControllerAccountId<Test>>::get(&ALICE_ACCOUNT_ID).is_empty()
            );
        });
}

#[test]
fn set_root_account() {
    let initial_members = [(0, ALICE_ACCOUNT_ID)];
    const ALICE_NEW_ROOT_ACCOUNT: u64 = 2;

    TestExternalitiesBuilder::<Test>::default()
        .set_membership_config(
            genesis::GenesisConfigBuilder::default()
                .members(initial_members.to_vec())
                .build(),
        )
        .build()
        .execute_with(|| {
            let member_id = 0;

            assert_ok!(Members::set_root_account(
                Origin::signed(ALICE_ACCOUNT_ID),
                member_id,
                ALICE_NEW_ROOT_ACCOUNT
            ));

            let membership = Members::membership(member_id);

            assert_eq!(ALICE_NEW_ROOT_ACCOUNT, membership.root_account);

            assert!(<crate::MemberIdsByRootAccountId<Test>>::get(&ALICE_ACCOUNT_ID).is_empty());
        });
}
