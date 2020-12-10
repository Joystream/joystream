#![cfg(test)]

pub(crate) mod fixtures;
pub(crate) mod mock;

use crate::{Error, Event, MembershipWorkingGroupInstance};
use fixtures::*;
use mock::*;

use frame_support::traits::{LockIdentifier, LockableCurrency, WithdrawReasons};
use frame_support::{assert_ok, StorageMap, StorageValue};
use frame_system::RawOrigin;
use sp_runtime::DispatchError;

#[test]
fn buy_membership_succeeds() {
    build_test_externalities().execute_with(|| {
        let initial_balance = MembershipFee::get();
        set_alice_free_balance(initial_balance);

        let next_member_id = Membership::members_created();

        assert_ok!(buy_default_membership_as_alice());

        let member_ids = vec![0];
        assert_eq!(member_ids, vec![next_member_id]);

        let profile = get_membership_by_id(next_member_id);

        assert_eq!(Some(profile.name), get_alice_info().name);
        assert_eq!(Some(profile.handle), get_alice_info().handle);
        assert_eq!(Some(profile.avatar_uri), get_alice_info().avatar_uri);
        assert_eq!(Some(profile.about), get_alice_info().about);

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
    build_test_externalities().execute_with(|| {
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
    build_test_externalities().execute_with(|| {
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
fn new_memberships_allowed_flag_works() {
    build_test_externalities().execute_with(|| {
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
fn buy_membership_fails_with_non_unique_handle() {
    build_test_externalities().execute_with(|| {
        let initial_balance = MembershipFee::get();
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
fn update_profile_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = MembershipFee::get();
        set_alice_free_balance(initial_balance);

        let next_member_id = Membership::members_created();

        assert_ok!(buy_default_membership_as_alice());
        let info = get_bob_info();
        assert_ok!(Membership::update_profile(
            Origin::signed(ALICE_ACCOUNT_ID),
            next_member_id,
            info.name,
            info.handle,
            info.avatar_uri,
            info.about,
        ));

        let profile = get_membership_by_id(next_member_id);

        assert_eq!(Some(profile.name), get_bob_info().name);
        assert_eq!(Some(profile.handle), get_bob_info().handle);
        assert_eq!(Some(profile.avatar_uri), get_bob_info().avatar_uri);
        assert_eq!(Some(profile.about), get_bob_info().about);

        assert!(<crate::MemberIdByHandle<Test>>::contains_key(
            get_bob_info().handle.unwrap()
        ));

        EventFixture::assert_last_crate_event(Event::<Test>::MemberProfileUpdated(next_member_id));
    });
}

#[test]
fn update_profile_has_no_effect_on_empty_parameters() {
    build_test_externalities().execute_with(|| {
        let initial_balance = MembershipFee::get();
        set_alice_free_balance(initial_balance);

        let next_member_id = Membership::members_created();

        assert_ok!(buy_default_membership_as_alice());
        assert_ok!(Membership::update_profile(
            Origin::signed(ALICE_ACCOUNT_ID),
            next_member_id,
            None,
            None,
            None,
            None,
        ));

        let profile = get_membership_by_id(next_member_id);

        assert_eq!(Some(profile.name), get_alice_info().name);
        assert_eq!(Some(profile.handle), get_alice_info().handle);
        assert_eq!(Some(profile.avatar_uri), get_alice_info().avatar_uri);
        assert_eq!(Some(profile.about), get_alice_info().about);

        assert!(<crate::MemberIdByHandle<Test>>::contains_key(
            get_alice_info().handle.unwrap()
        ));
    });
}

#[test]
fn update_profile_accounts_succeeds() {
    let member_id = 0u64;
    let initial_members = [(member_id, ALICE_ACCOUNT_ID)];

    build_test_externalities_with_initial_members(initial_members.to_vec()).execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        const ALICE_NEW_ACCOUNT_ID: u64 = 2;

        assert_ok!(Membership::update_accounts(
            Origin::signed(ALICE_ACCOUNT_ID),
            member_id,
            Some(ALICE_NEW_ACCOUNT_ID),
            Some(ALICE_NEW_ACCOUNT_ID),
        ));

        let profile = get_membership_by_id(member_id);

        assert_eq!(profile.controller_account, ALICE_NEW_ACCOUNT_ID);
        assert_eq!(
            <crate::MemberIdsByControllerAccountId<Test>>::get(&ALICE_NEW_ACCOUNT_ID),
            vec![member_id]
        );
        assert!(<crate::MemberIdsByControllerAccountId<Test>>::get(&ALICE_ACCOUNT_ID).is_empty());

        assert_eq!(profile.root_account, ALICE_NEW_ACCOUNT_ID);
        assert_eq!(
            <crate::MemberIdsByRootAccountId<Test>>::get(&ALICE_NEW_ACCOUNT_ID),
            vec![member_id]
        );
        assert!(<crate::MemberIdsByRootAccountId<Test>>::get(&ALICE_ACCOUNT_ID).is_empty());

        EventFixture::assert_last_crate_event(Event::<Test>::MemberAccountsUpdated(member_id));
    });
}

#[test]
fn update_accounts_has_effect_on_empty_account_parameters() {
    let member_id = 0u64;
    let initial_members = [(member_id, ALICE_ACCOUNT_ID)];

    build_test_externalities_with_initial_members(initial_members.to_vec()).execute_with(|| {
        assert_ok!(Membership::update_accounts(
            Origin::signed(ALICE_ACCOUNT_ID),
            member_id,
            None,
            None,
        ));

        let profile = get_membership_by_id(member_id);

        assert_eq!(profile.controller_account, ALICE_ACCOUNT_ID);
        assert_eq!(
            <crate::MemberIdsByControllerAccountId<Test>>::get(&ALICE_ACCOUNT_ID),
            vec![member_id]
        );

        assert_eq!(profile.root_account, ALICE_ACCOUNT_ID);
        assert_eq!(
            <crate::MemberIdsByRootAccountId<Test>>::get(&ALICE_ACCOUNT_ID),
            vec![member_id]
        );
    });
}

#[test]
fn update_verification_status_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = MembershipFee::get();
        set_alice_free_balance(initial_balance);

        let next_member_id = Membership::members_created();
        assert_ok!(buy_default_membership_as_alice());

        UpdateMembershipVerificationFixture::default()
            .with_member_id(next_member_id)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(Event::<Test>::MemberVerificationStatusUpdated(
            next_member_id,
            true,
        ));
    });
}

#[test]
fn update_verification_status_fails_with_bad_origin() {
    build_test_externalities().execute_with(|| {
        let next_member_id = Membership::members_created();

        UpdateMembershipVerificationFixture::default()
            .with_member_id(next_member_id)
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn update_verification_status_fails_with_invalid_member_id() {
    build_test_externalities().execute_with(|| {
        let invalid_member_id = 44;

        UpdateMembershipVerificationFixture::default()
            .with_member_id(invalid_member_id)
            .call_and_assert(Err(Error::<Test>::MemberProfileNotFound.into()));
    });
}

#[test]
fn update_verification_status_fails_with_invalid_worker_id() {
    build_test_externalities().execute_with(|| {
        let initial_balance = MembershipFee::get();
        set_alice_free_balance(initial_balance);

        let next_member_id = Membership::members_created();
        assert_ok!(buy_default_membership_as_alice());

        let invalid_worker_id = 44;

        UpdateMembershipVerificationFixture::default()
            .with_member_id(next_member_id)
            .with_worker_id(invalid_worker_id)
            .call_and_assert(Err(working_group::Error::<
                Test,
                MembershipWorkingGroupInstance,
            >::WorkerDoesNotExist
                .into()));
    });
}

#[test]
fn buy_membership_fails_with_invalid_name() {
    build_test_externalities().execute_with(|| {
        let initial_balance = MembershipFee::get();
        set_alice_free_balance(initial_balance);

        let mut alice = get_alice_info();
        let name: [u8; 500] = [1; 500];
        alice.name = Some(name.to_vec());

        let result = Membership::buy_membership(
            Origin::signed(ALICE_ACCOUNT_ID),
            alice.name,
            alice.handle,
            alice.avatar_uri,
            alice.about,
        );

        assert_eq!(result, Err(Error::<Test>::NameTooLong.into()));
    });
}
