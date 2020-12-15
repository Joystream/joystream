#![cfg(test)]

pub(crate) mod fixtures;
pub(crate) mod mock;

use crate::{Error, Event};
use fixtures::*;
use mock::*;

use frame_support::traits::{LockIdentifier, LockableCurrency, WithdrawReasons};
use frame_support::{assert_ok, StorageMap, StorageValue};
use frame_system::RawOrigin;
use sp_runtime::DispatchError;

#[test]
fn buy_membership_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = DefaultMembershipPrice::get();
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
        assert_eq!(profile.invites, DefaultMemberInvitesCount::get());

        // controller account initially set to primary account
        assert_eq!(profile.controller_account, ALICE_ACCOUNT_ID);
        assert_eq!(
            <crate::MemberIdsByControllerAccountId<Test>>::get(ALICE_ACCOUNT_ID),
            vec![next_member_id]
        );

        EventFixture::assert_last_crate_event(Event::<Test>::MemberRegistered(next_member_id));
    });
}

#[test]
fn buy_membership_fails_without_enough_balance() {
    build_test_externalities().execute_with(|| {
        let initial_balance = DefaultMembershipPrice::get() - 1;
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
        let initial_balance = DefaultMembershipPrice::get();
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
        let initial_balance = DefaultMembershipPrice::get() + 1;
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
        let initial_balance = DefaultMembershipPrice::get();
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

        let initial_balance = DefaultMembershipPrice::get();
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
        let initial_balance = DefaultMembershipPrice::get();
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
    let initial_members = [(ALICE_MEMBER_ID, ALICE_ACCOUNT_ID)];

    build_test_externalities_with_initial_members(initial_members.to_vec()).execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        const ALICE_NEW_ACCOUNT_ID: u64 = 2;

        assert_ok!(Membership::update_accounts(
            Origin::signed(ALICE_ACCOUNT_ID),
            ALICE_MEMBER_ID,
            Some(ALICE_NEW_ACCOUNT_ID),
            Some(ALICE_NEW_ACCOUNT_ID),
        ));

        let profile = get_membership_by_id(ALICE_MEMBER_ID);

        assert_eq!(profile.controller_account, ALICE_NEW_ACCOUNT_ID);
        assert_eq!(
            <crate::MemberIdsByControllerAccountId<Test>>::get(&ALICE_NEW_ACCOUNT_ID),
            vec![ALICE_MEMBER_ID]
        );
        assert!(<crate::MemberIdsByControllerAccountId<Test>>::get(&ALICE_ACCOUNT_ID).is_empty());

        assert_eq!(profile.root_account, ALICE_NEW_ACCOUNT_ID);
        assert_eq!(
            <crate::MemberIdsByRootAccountId<Test>>::get(&ALICE_NEW_ACCOUNT_ID),
            vec![ALICE_MEMBER_ID]
        );
        assert!(<crate::MemberIdsByRootAccountId<Test>>::get(&ALICE_ACCOUNT_ID).is_empty());

        EventFixture::assert_last_crate_event(Event::<Test>::MemberAccountsUpdated(
            ALICE_MEMBER_ID,
        ));
    });
}

#[test]
fn update_accounts_has_effect_on_empty_account_parameters() {
    let initial_members = [(ALICE_MEMBER_ID, ALICE_ACCOUNT_ID)];

    build_test_externalities_with_initial_members(initial_members.to_vec()).execute_with(|| {
        assert_ok!(Membership::update_accounts(
            Origin::signed(ALICE_ACCOUNT_ID),
            ALICE_MEMBER_ID,
            None,
            None,
        ));

        let profile = get_membership_by_id(ALICE_MEMBER_ID);

        assert_eq!(profile.controller_account, ALICE_ACCOUNT_ID);
        assert_eq!(
            <crate::MemberIdsByControllerAccountId<Test>>::get(&ALICE_ACCOUNT_ID),
            vec![ALICE_MEMBER_ID]
        );

        assert_eq!(profile.root_account, ALICE_ACCOUNT_ID);
        assert_eq!(
            <crate::MemberIdsByRootAccountId<Test>>::get(&ALICE_ACCOUNT_ID),
            vec![ALICE_MEMBER_ID]
        );
    });
}

#[test]
fn update_verification_status_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = DefaultMembershipPrice::get();
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
        let initial_balance = DefaultMembershipPrice::get();
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
        let initial_balance = DefaultMembershipPrice::get();
        set_alice_free_balance(initial_balance);

        let name: [u8; 500] = [1; 500];

        let buy_membership_fixture = BuyMembershipFixture::default().with_name(name.to_vec());

        buy_membership_fixture.call_and_assert(Err(Error::<Test>::NameTooLong.into()));
    });
}

#[test]
fn buy_membership_fails_with_non_member_referrer_id() {
    build_test_externalities().execute_with(|| {
        let initial_balance = DefaultMembershipPrice::get();
        set_alice_free_balance(initial_balance);

        let invalid_member_id = 111;

        let buy_membership_fixture =
            BuyMembershipFixture::default().with_referrer_id(invalid_member_id);

        buy_membership_fixture.call_and_assert(Err(Error::<Test>::ReferrerIsNotMember.into()));
    });
}

#[test]
fn buy_membership_with_referral_cut_succeeds() {
    let initial_members = [(ALICE_MEMBER_ID, ALICE_ACCOUNT_ID)];

    build_test_externalities_with_initial_members(initial_members.to_vec()).execute_with(|| {
        let initial_balance = 10000;
        increase_total_balance_issuance_using_account_id(BOB_ACCOUNT_ID, initial_balance);

        let buy_membership_fixture = BuyMembershipFixture::default()
            .with_handle(b"bobs_handle".to_vec())
            .with_accounts(BOB_ACCOUNT_ID)
            .with_origin(RawOrigin::Signed(BOB_ACCOUNT_ID))
            .with_referrer_id(ALICE_MEMBER_ID);

        buy_membership_fixture.call_and_assert(Ok(()));

        let referral_cut = Membership::get_referral_bonus();

        assert_eq!(Balances::usable_balance(&ALICE_ACCOUNT_ID), referral_cut);
        assert_eq!(
            Balances::usable_balance(&BOB_ACCOUNT_ID),
            initial_balance - DefaultMembershipPrice::get()
        );
    });
}

#[test]
fn referral_bonus_calculated_successfully() {
    build_test_externalities().execute_with(|| {
        // it should take minimum of the referral cut and membership fee
        let membership_fee = DefaultMembershipPrice::get();
        let diff = 10;

        let referral_cut = membership_fee.saturating_sub(diff);
        <crate::ReferralCut<Test>>::put(referral_cut);
        assert_eq!(Membership::get_referral_bonus(), referral_cut);

        let referral_cut = membership_fee.saturating_add(diff);
        <crate::ReferralCut<Test>>::put(referral_cut);
        assert_eq!(Membership::get_referral_bonus(), membership_fee);
    });
}

#[test]
fn set_referral_cut_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        SetReferralCutFixture::default().call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(Event::<Test>::ReferralCutUpdated(
            DEFAULT_REFERRAL_CUT_VALUE,
        ));
    });
}

#[test]
fn set_referral_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        SetReferralCutFixture::default()
            .with_origin(RawOrigin::Signed(ALICE_ACCOUNT_ID))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn transfer_invites_succeeds() {
    let initial_members = [(ALICE_MEMBER_ID, ALICE_ACCOUNT_ID)];

    build_test_externalities_with_initial_members(initial_members.to_vec()).execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 10000;
        increase_total_balance_issuance_using_account_id(BOB_ACCOUNT_ID, initial_balance);

        BuyMembershipFixture::default()
            .with_handle(b"bobs_handle".to_vec())
            .with_accounts(BOB_ACCOUNT_ID)
            .with_origin(RawOrigin::Signed(BOB_ACCOUNT_ID))
            .call_and_assert(Ok(()));

        let bob_member_id = 1;

        let tranfer_invites_fixture = TransferInvitesFixture::default()
            .with_origin(RawOrigin::Signed(BOB_ACCOUNT_ID))
            .with_source_member_id(bob_member_id)
            .with_target_member_id(ALICE_MEMBER_ID);

        tranfer_invites_fixture.call_and_assert(Ok(()));

        let alice = Membership::membership(ALICE_MEMBER_ID);
        let bob = Membership::membership(bob_member_id);

        assert_eq!(alice.invites, tranfer_invites_fixture.invites);
        assert_eq!(
            bob.invites,
            DefaultMemberInvitesCount::get() - tranfer_invites_fixture.invites
        );

        EventFixture::assert_last_crate_event(Event::<Test>::InvitesTransferred(
            bob_member_id,
            ALICE_MEMBER_ID,
            tranfer_invites_fixture.invites,
        ));
    });
}

#[test]
fn transfer_invites_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        TransferInvitesFixture::default()
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(Error::<Test>::UnsignedOrigin.into()));
    });
}

#[test]
fn transfer_invites_fails_with_source_member_id() {
    build_test_externalities().execute_with(|| {
        TransferInvitesFixture::default()
            .call_and_assert(Err(Error::<Test>::MemberProfileNotFound.into()));
    });
}

#[test]
fn transfer_invites_fails_with_target_member_id() {
    let initial_members = [(ALICE_MEMBER_ID, ALICE_ACCOUNT_ID)];

    build_test_externalities_with_initial_members(initial_members.to_vec()).execute_with(|| {
        TransferInvitesFixture::default()
            .call_and_assert(Err(Error::<Test>::CannotTransferInvitesForNotMember.into()));
    });
}

#[test]
fn transfer_invites_fails_when_not_enough_invites() {
    let initial_members = [(ALICE_MEMBER_ID, ALICE_ACCOUNT_ID)];

    build_test_externalities_with_initial_members(initial_members.to_vec()).execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 10000;
        increase_total_balance_issuance_using_account_id(BOB_ACCOUNT_ID, initial_balance);

        BuyMembershipFixture::default()
            .with_handle(b"bobs_handle".to_vec())
            .with_accounts(BOB_ACCOUNT_ID)
            .with_origin(RawOrigin::Signed(BOB_ACCOUNT_ID))
            .call_and_assert(Ok(()));

        let bob_member_id = 1;

        let invalid_invites_number = 100;
        let tranfer_invites_fixture = TransferInvitesFixture::default()
            .with_origin(RawOrigin::Signed(BOB_ACCOUNT_ID))
            .with_source_member_id(bob_member_id)
            .with_target_member_id(ALICE_MEMBER_ID)
            .with_invites_number(invalid_invites_number);

        tranfer_invites_fixture.call_and_assert(Err(Error::<Test>::NotEnoughInvites.into()));
    });
}

#[test]
fn invite_member_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = DefaultMembershipPrice::get();
        set_alice_free_balance(initial_balance);

        assert_ok!(buy_default_membership_as_alice());
        let bob_member_id = Membership::members_created();

        InviteMembershipFixture::default().call_and_assert(Ok(()));

        let profile = get_membership_by_id(bob_member_id);

        let bob = get_bob_info();
        assert_eq!(Some(profile.name), bob.name);
        assert_eq!(Some(profile.handle), bob.handle);
        assert_eq!(Some(profile.avatar_uri), bob.avatar_uri);
        assert_eq!(Some(profile.about), bob.about);
        assert_eq!(profile.invites, 0);

        // controller account initially set to primary account
        assert_eq!(profile.controller_account, BOB_ACCOUNT_ID);
        assert_eq!(
            <crate::MemberIdsByControllerAccountId<Test>>::get(BOB_ACCOUNT_ID),
            vec![bob_member_id]
        );

        EventFixture::assert_last_crate_event(Event::<Test>::MemberRegistered(bob_member_id));
    });
}

#[test]
fn invite_member_fails_with_bad_origin() {
    build_test_externalities().execute_with(|| {
        InviteMembershipFixture::default()
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(Error::<Test>::UnsignedOrigin.into()));
    });
}

#[test]
fn invite_member_fails_with_invalid_member_id() {
    build_test_externalities().execute_with(|| {
        let initial_balance = DefaultMembershipPrice::get();
        set_alice_free_balance(initial_balance);

        assert_ok!(buy_default_membership_as_alice());
        let invalid_member_id = 222;

        InviteMembershipFixture::default()
            .with_member_id(invalid_member_id)
            .call_and_assert(Err(Error::<Test>::MemberProfileNotFound.into()));
    });
}

#[test]
fn invite_member_fails_with_not_controller_account() {
    build_test_externalities().execute_with(|| {
        let initial_balance = DefaultMembershipPrice::get();
        set_alice_free_balance(initial_balance);

        assert_ok!(buy_default_membership_as_alice());
        let invalid_account_id = 222;

        InviteMembershipFixture::default()
            .with_accounts(invalid_account_id)
            .with_origin(RawOrigin::Signed(invalid_account_id))
            .call_and_assert(Err(Error::<Test>::ControllerAccountRequired.into()));
    });
}

#[test]
fn invite_member_fails_with_not_enough_invites() {
    let initial_members = [(ALICE_MEMBER_ID, ALICE_ACCOUNT_ID)];

    build_test_externalities_with_initial_members(initial_members.to_vec()).execute_with(|| {
        InviteMembershipFixture::default()
            .call_and_assert(Err(Error::<Test>::NotEnoughInvites.into()));
    });
}

#[test]
fn invite_member_fails_with_not_allowed_membership() {
    build_test_externalities().execute_with(|| {
        let initial_balance = DefaultMembershipPrice::get();
        set_alice_free_balance(initial_balance);

        assert_ok!(buy_default_membership_as_alice());

        crate::NewMembershipsAllowed::put(false);

        InviteMembershipFixture::default()
            .call_and_assert(Err(Error::<Test>::NewMembersNotAllowed.into()));
    });
}

#[test]
fn invite_member_fails_with_bad_user_information() {
    build_test_externalities().execute_with(|| {
        let initial_balance = DefaultMembershipPrice::get();
        set_alice_free_balance(initial_balance);

        assert_ok!(buy_default_membership_as_alice());

        InviteMembershipFixture::default()
            .with_name([1u8; 5000].to_vec())
            .call_and_assert(Err(Error::<Test>::NameTooLong.into()));

        InviteMembershipFixture::default()
            .with_avatar([1u8; 5000].to_vec())
            .call_and_assert(Err(Error::<Test>::AvatarUriTooLong.into()));

        InviteMembershipFixture::default()
            .with_handle([1u8; 5000].to_vec())
            .call_and_assert(Err(Error::<Test>::HandleTooLong.into()));

        InviteMembershipFixture::default()
            .with_handle(Vec::new())
            .call_and_assert(Err(Error::<Test>::HandleTooShort.into()));

        InviteMembershipFixture::default()
            .with_empty_handle()
            .call_and_assert(Err(
                Error::<Test>::HandleMustBeProvidedDuringRegistration.into()
            ));

        let handle = b"Non-unique handle".to_vec();
        InviteMembershipFixture::default()
            .with_handle(handle.clone())
            .call_and_assert(Ok(()));

        InviteMembershipFixture::default()
            .with_handle(handle)
            .call_and_assert(Err(Error::<Test>::HandleAlreadyRegistered.into()));
    });
}

#[test]
fn set_membership_price_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        SetMembershipPriceFixture::default().call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(Event::<Test>::MembershipPriceUpdated(
            DEFAULT_MEMBERSHIP_PRICE,
        ));
    });
}

#[test]
fn set_membership_price_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        SetMembershipPriceFixture::default()
            .with_origin(RawOrigin::Signed(ALICE_ACCOUNT_ID))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn buy_membership_with_zero_membership_price_succeeds() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 10000;
        increase_total_balance_issuance_using_account_id(ALICE_ACCOUNT_ID, initial_balance);

        // Set zero membership price
        SetMembershipPriceFixture::default()
            .with_price(0)
            .call_and_assert(Ok(()));

        // Try to buy membership.
        BuyMembershipFixture::default().call_and_assert(Ok(()));

        assert_eq!(Balances::usable_balance(&ALICE_ACCOUNT_ID), initial_balance);
    });
}
