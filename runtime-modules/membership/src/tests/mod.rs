#![cfg(test)]

pub(crate) mod fixtures;
pub(crate) mod mock;

use super::genesis;
use crate::{Error, Event, MembershipWorkingGroupInstance};
use fixtures::*;
use mock::*;

use frame_support::traits::{LockIdentifier, LockableCurrency, WithdrawReasons};
use frame_support::{assert_ok, StorageMap, StorageValue};
use frame_system::RawOrigin;
use sp_runtime::DispatchError;

#[test]
fn buy_membership() {
    const SURPLUS_BALANCE: u64 = 500;

    TestExternalitiesBuilder::<Test>::default()
        .set_membership_config(genesis::GenesisConfigBuilder::default().build())
        .build()
        .execute_with(|| {
            let initial_balance = MembershipFee::get() + SURPLUS_BALANCE;
            set_alice_free_balance(initial_balance);

            let next_member_id = Membership::members_created();

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

            let next_member_id = Membership::members_created();

            assert_ok!(buy_default_membership_as_alice());
            let info = get_bob_info();
            assert_ok!(Membership::update_membership(
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

            assert_ok!(Membership::set_controller_account(
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

            assert_ok!(Membership::set_root_account(
                Origin::signed(ALICE_ACCOUNT_ID),
                member_id,
                ALICE_NEW_ROOT_ACCOUNT
            ));

            let membership = Membership::membership(member_id);

            assert_eq!(ALICE_NEW_ROOT_ACCOUNT, membership.root_account);

            assert!(<crate::MemberIdsByRootAccountId<Test>>::get(&ALICE_ACCOUNT_ID).is_empty());
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
