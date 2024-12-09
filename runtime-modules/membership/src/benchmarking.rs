#![cfg(feature = "runtime-benchmarks")]
use super::*;
use crate::{
    BuyMembershipParameters, Config, InviteMembershipParameters, MemberIdByHandleHash, Membership,
    MembershipById, MembershipObject, StakingAccountIdMemberStatus, StakingAccountMemberBinding,
};
use balances::Pallet as Balances;
use core::convert::TryInto;
use frame_benchmarking::v1::{account, benchmarks};
use frame_support::storage::StorageMap;
use frame_support::traits::Currency;
use frame_system::Pallet as System;
use frame_system::{EventRecord, RawOrigin};
use sp_arithmetic::traits::One;
use sp_arithmetic::Perbill;
use sp_runtime::traits::{Bounded, SaturatedConversion, Saturating};
use sp_std::prelude::*;
use sp_std::vec;

/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as balances::Config>::Balance;

pub trait MembershipWorkingGroupHelper<AccountId, MemberId, ActorId> {
    /// Set membership working group lead
    fn insert_a_lead(opening_id: u32, caller_id: &AccountId, member_id: MemberId) -> ActorId;
}

const SEED: u32 = 0;
const MAX_KILOBYTES_METADATA: u32 = 100;

fn get_byte(num: u32, byte_number: u8) -> u8 {
    ((num & (0xff << (8 * byte_number))) >> (8 * byte_number)) as u8
}

fn assert_last_event<T: Config>(generic_event: <T as Config>::RuntimeEvent) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Config>::RuntimeEvent = generic_event.into();
    // compare to the last event record
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

fn member_funded_account<T: Config + balances::Config>(
    name: &'static str,
    id: u32,
) -> (T::AccountId, T::MemberId) {
    let account_id = account::<T::AccountId>(name, id, SEED);

    let handle = handle_from_id::<T>(id);

    let _ = Balances::<T>::make_free_balance_be(&account_id, BalanceOf::<T>::max_value());

    let params = BuyMembershipParameters {
        root_account: account_id.clone(),
        controller_account: account_id.clone(),
        handle: Some(handle),
        metadata: Vec::new(),
        referrer_id: None,
    };

    Module::<T>::buy_membership(RawOrigin::Signed(account_id.clone()).into(), params).unwrap();

    let _ = Balances::<T>::make_free_balance_be(&account_id, BalanceOf::<T>::max_value());

    let member_id = T::MemberId::from(id.try_into().unwrap());

    (account_id, member_id)
}

// Method to generate a distintic valid handle
// for a membership. For each index.
fn handle_from_id<T: Config>(id: u32) -> Vec<u8> {
    let mut handle = vec![];

    for j in 0..4 {
        handle.push(get_byte(id, j));
    }

    while handle.len() < (id as usize) {
        handle.push(0u8);
    }

    handle
}

benchmarks! {
    where_clause {
        where T: balances::Config, T: Config, T: MembershipWorkingGroupHelper<<T as
            frame_system::Config>::AccountId, <T as common::membership::MembershipTypes>::MemberId, <T as common::membership::MembershipTypes>::ActorId>
    }

    buy_membership_without_referrer{

        let i in 0 .. MAX_KILOBYTES_METADATA;

        let j in 0 .. MAX_KILOBYTES_METADATA;

        let member_id = 0;

        let account_id = account::<T::AccountId>("member", member_id, SEED);

        let handle = handle_from_id::<T>(i * 1000);

        let member_id = T::MemberId::from(member_id.try_into().unwrap());

        let free_balance = BalanceOf::<T>::max_value();

        let _ = Balances::<T>::make_free_balance_be(&account_id, free_balance);

        let fee = Module::<T>::membership_price();

        let metadata = vec![0u8].repeat((j * 1000) as usize);

        let params = BuyMembershipParameters {
            root_account: account_id.clone(),
            controller_account: account_id.clone(),
            handle: Some(handle.clone()),
            referrer_id: None,
            metadata,
        };

    }: buy_membership(RawOrigin::Signed(account_id.clone()), params.clone())
    verify {

        // Ensure membership for given member_id is successfully bought
        assert_eq!(Module::<T>::members_created(), member_id + T::MemberId::one());

        assert_eq!(Balances::<T>::free_balance(&account_id), free_balance - fee);

        let handle_hash = T::Hashing::hash(&handle);

        let invites = Module::<T>::initial_invitation_count();
        let membership: Membership<T> = MembershipObject {
            handle_hash,
            root_account: account_id.clone(),
            controller_account: account_id.clone(),
            verified: false,
            // Save the updated profile.
            invites,
        };

        assert_eq!(MemberIdByHandleHash::<T>::get(handle_hash), member_id);

        assert_eq!(MembershipById::<T>::get(member_id), Some(membership));

        assert_last_event::<T>(
            RawEvent::MembershipBought(member_id, params, invites).into()
        );
    }

    buy_membership_with_referrer{

        let i in 0 .. MAX_KILOBYTES_METADATA;

        let j in 0 .. MAX_KILOBYTES_METADATA;

        let member_id = 0;

        let account_id = account::<T::AccountId>("member", member_id, SEED);

        let handle = handle_from_id::<T>(i * 1000);

        let _ = Balances::<T>::make_free_balance_be(&account_id, BalanceOf::<T>::max_value());

        let metadata = vec![0u8].repeat((j * 1000) as usize);

        let fee = Module::<T>::membership_price();

        let mut params = BuyMembershipParameters {
            root_account: account_id.clone(),
            controller_account: account_id.clone(),
            handle: Some(handle),
            metadata,
            referrer_id: None,
        };

        Module::<T>::buy_membership(RawOrigin::Signed(account_id.clone()).into(), params.clone()).unwrap();

        let referral_cut = 10u8; //percents

        Module::<T>::set_referral_cut(RawOrigin::Root.into(), referral_cut).unwrap();

        let member_id = T::MemberId::from(member_id.try_into().unwrap());

        params.referrer_id = Some(member_id);
        let second_handle = handle_from_id::<T>(i * 1000 + 1);

        params.handle = Some(second_handle.clone());

        let free_balance = Balances::<T>::free_balance(&account_id);

    }: buy_membership(RawOrigin::Signed(account_id.clone()), params.clone())
    verify {

        // Ensure membership for given member_id is successfully bought.
        assert_eq!(Module::<T>::members_created(), member_id + T::MemberId::one() + T::MemberId::one());

        // Same account id gets reward for being referral.
        let referral_cut_balance = Perbill::from_percent(referral_cut.into()) * fee;
        assert_eq!(
            Balances::<T>::free_balance(&account_id),
            free_balance - fee + referral_cut_balance
        );

        let second_handle_hash = T::Hashing::hash(&second_handle);

        let invites = Module::<T>::initial_invitation_count();
        let membership: Membership<T> = MembershipObject {
            handle_hash: second_handle_hash,
            root_account: account_id.clone(),
            controller_account: account_id,
            verified: false,
            // Save the updated profile.
            invites,
        };

        let second_member_id = member_id + T::MemberId::one();

        assert_eq!(MemberIdByHandleHash::<T>::get(second_handle_hash), second_member_id);

        assert_eq!(MembershipById::<T>::get(second_member_id), Some(membership));

        assert_last_event::<T>(
            RawEvent::MembershipBought(second_member_id, params, invites).into()
        );
    }

    update_profile{
        let i in 0 .. MAX_KILOBYTES_METADATA;

        let j in 0 .. MAX_KILOBYTES_METADATA;

        let member_id = 0;

        let account_id = account::<T::AccountId>("member", member_id, SEED);

        let handle = handle_from_id::<T>(i * 1000);

        let _ = Balances::<T>::make_free_balance_be(&account_id, BalanceOf::<T>::max_value());

        let member_id = T::MemberId::from(member_id.try_into().unwrap());

        let params = BuyMembershipParameters {
            root_account: account_id.clone(),
            controller_account: account_id.clone(),
            handle: Some(handle.clone()),
            metadata: Vec::new(),
            referrer_id: None,
        };

        Module::<T>::buy_membership(RawOrigin::Signed(account_id.clone()).into(), params).unwrap();

        let handle_updated = handle_from_id::<T>((i * 1000) + 1);

        let metadata_updated = vec![0xff].repeat((j * 1000) as usize);

    }: _ (RawOrigin::Signed(account_id.clone()), member_id, Some(handle_updated.clone()), Some(metadata_updated.clone()))
    verify {

        // Ensure membership profile is successfully updated
        let handle_old_hash = T::Hashing::hash(&handle);
        let handle_updated_hash = T::Hashing::hash(&handle_updated);

        assert!(!MemberIdByHandleHash::<T>::contains_key(handle_old_hash));
        assert!(MemberIdByHandleHash::<T>::contains_key(handle_updated_hash));
        assert_eq!(MemberIdByHandleHash::<T>::get(handle_updated_hash), member_id);

        assert_last_event::<T>(RawEvent::MemberProfileUpdated(
                member_id,
                Some(handle_updated),
                Some(metadata_updated),
            ).into()
        );
    }

    update_accounts_none{

        let member_id = 0;

        let (account_id, member_id) = member_funded_account::<T>("member", member_id);

    }: update_accounts(RawOrigin::Signed(account_id.clone()), member_id, None, None)

    update_accounts_root{

        let member_id = 0;

        let new_root_account_id = account::<T::AccountId>("root", member_id, SEED);

        let handle = handle_from_id::<T>(member_id);

        let (account_id, member_id) = member_funded_account::<T>("member", member_id);

    }: update_accounts(RawOrigin::Signed(account_id.clone()), member_id, Some(new_root_account_id.clone()), None)

    verify {

        // Ensure root account is successfully updated
        let handle_hash = T::Hashing::hash(&handle);

        let membership: Membership<T> = MembershipObject {
            handle_hash,
            root_account: new_root_account_id.clone(),
            controller_account: account_id.clone(),
            verified: false,
            // Save the updated profile.
            invites: <T as crate::Config>::DefaultMemberInvitesCount::get(),
        };

        assert_eq!(MembershipById::<T>::get(member_id), Some(membership));

        assert_last_event::<T>(RawEvent::MemberAccountsUpdated(
                member_id,
                Some(new_root_account_id),
                None
            ).into()
        );
    }

    update_accounts_controller{

        let member_id = 0;

        let new_controller_account_id = account::<T::AccountId>("controller", member_id, SEED);

        let handle = handle_from_id::<T>(member_id);

        let (account_id, member_id) = member_funded_account::<T>("member", member_id);

    }: update_accounts(RawOrigin::Signed(account_id.clone()), member_id, None, Some(new_controller_account_id.clone()))

    verify {
        // Ensure controller account is successfully updated

        let handle_hash = T::Hashing::hash(&handle);

        let membership: Membership<T> = MembershipObject {
            handle_hash,
            root_account: account_id.clone(),
            controller_account: new_controller_account_id.clone(),
            verified: false,
            // Save the updated profile.
            invites: <T as crate::Config>::DefaultMemberInvitesCount::get(),
        };

        assert_eq!(MembershipById::<T>::get(member_id), Some(membership));

        assert_last_event::<T>(RawEvent::MemberAccountsUpdated(
                member_id,
                None,
                Some(new_controller_account_id)
            ).into()
        );
    }

    update_accounts_both{

        let member_id = 0;

        let new_controller_account_id = account::<T::AccountId>("controller", member_id, SEED);

        let new_root_account_id = account::<T::AccountId>("root", member_id, SEED);

        let handle = handle_from_id::<T>(member_id);

        let (account_id, member_id) = member_funded_account::<T>("member", member_id);

    }: update_accounts(RawOrigin::Signed(account_id.clone()), member_id, Some(new_root_account_id.clone()), Some(new_controller_account_id.clone()))

    verify {

        // Ensure both root and controller accounts are successfully updated
        let handle_hash = T::Hashing::hash(&handle);

        let membership: Membership<T> = MembershipObject {
            handle_hash,
            root_account: new_root_account_id.clone(),
            controller_account: new_controller_account_id.clone(),
            verified: false,
            // Save the updated profile.
            invites: <T as crate::Config>::DefaultMemberInvitesCount::get(),
        };

        assert_eq!(MembershipById::<T>::get(member_id), Some(membership));

        assert_last_event::<T>(RawEvent::MemberAccountsUpdated(
                member_id,
                Some(new_root_account_id),
                Some(new_controller_account_id),
            ).into()
        );
    }

    set_referral_cut {
        let member_id = 0;

        let referral_cut = 10u8;

    }: _(RawOrigin::Root, referral_cut)

    verify {

        assert_eq!(Module::<T>::referral_cut(), referral_cut);

        assert_last_event::<T>(RawEvent::ReferralCutUpdated(referral_cut).into());
    }

    transfer_invites{

        let first_member_id = 0;

        let second_member_id = 1;

        let first_handle = handle_from_id::<T>(first_member_id);
        let (first_account_id, first_member_id) = member_funded_account::<T>("first_member", first_member_id);

        let second_handle = handle_from_id::<T>(second_member_id);
        let (second_account_id, second_member_id) = member_funded_account::<T>("second_member", second_member_id);

        let number_of_invites = 2;

    }: _(RawOrigin::Signed(first_account_id.clone()), first_member_id, second_member_id, number_of_invites)

    verify {
        // Ensure invites are successfully transfered

        let first_handle_hash = T::Hashing::hash(&first_handle);

        let second_handle_hash = T::Hashing::hash(&second_handle);

        let first_membership: Membership<T> = MembershipObject {
            handle_hash: first_handle_hash,
            root_account: first_account_id.clone(),
            controller_account: first_account_id.clone(),
            verified: false,
            invites: 0,
        };

        let second_membership: Membership<T> = MembershipObject {
            handle_hash: second_handle_hash,
            root_account: second_account_id.clone(),
            controller_account: second_account_id.clone(),
            verified: false,
            invites: <T as crate::Config>::DefaultMemberInvitesCount::get() + number_of_invites,
        };

        assert_eq!(MembershipById::<T>::get(first_member_id), Some(first_membership));

        assert_eq!(MembershipById::<T>::get(second_member_id), Some(second_membership));

        assert_last_event::<T>(RawEvent::InvitesTransferred(first_member_id, second_member_id, number_of_invites).into());
    }

    invite_member {
        let member_id = 0;

        let i in 1 .. MAX_KILOBYTES_METADATA;

        let j in 0 .. MAX_KILOBYTES_METADATA;

        let member_id = 0;

        let (account_id, member_id) = member_funded_account::<T>("member", member_id);

        let handle = handle_from_id::<T>(i * 1000);

        let metadata = vec![0u8].repeat((j * 1000) as usize);

        let invite_params = InviteMembershipParameters {
            inviting_member_id: member_id,
            root_account: account_id.clone(),
            controller_account: account_id.clone(),
            handle: Some(handle.clone()),
            metadata,
        };

        let default_invitation_balance = T::DefaultInitialInvitationBalance::get();

        T::WorkingGroup::set_budget(default_invitation_balance + default_invitation_balance);

        let current_wg_budget = T::WorkingGroup::get_budget();

    }: _(RawOrigin::Signed(account_id.clone()), invite_params.clone())

    verify {

        // Ensure member is successfully invited
        let invited_member_id = member_id + T::MemberId::one();

        let handle_hash = T::Hashing::hash(&handle);

        let invited_membership: Membership<T> = MembershipObject {
            handle_hash,
            root_account: account_id.clone(),
            controller_account: account_id.clone(),
            verified: false,
            invites: 0,
        };

        let new_wg_budget = current_wg_budget.saturating_sub(default_invitation_balance);

        assert_eq!(T::WorkingGroup::get_budget(), new_wg_budget);

        assert_eq!(MemberIdByHandleHash::<T>::get(handle_hash), invited_member_id);

        assert_eq!(MembershipById::<T>::get(invited_member_id), Some(invited_membership));

        assert_last_event::<T>(
            RawEvent::MemberInvited(
                invited_member_id,
                invite_params,
                default_invitation_balance,
            ).into()
        );

    }

    gift_membership {
        let i in 1 .. MAX_KILOBYTES_METADATA;
        let j in 0 .. MAX_KILOBYTES_METADATA;

        let account_id = account::<T::AccountId>("gifter", 1, SEED);
        let _ = Balances::<T>::make_free_balance_be(&account_id, BalanceOf::<T>::max_value());
        let root_account = account::<T::AccountId>("member", 2, SEED);
        let controller_account = account::<T::AccountId>("member", 4, SEED);

        let handle = handle_from_id::<T>(i * 1000);

        let metadata = vec![0u8].repeat((j * 1000) as usize);

        let gift_params = GiftMembershipParameters {
            root_account: root_account.clone(),
            controller_account: controller_account.clone(),
            handle: Some(handle.clone()),
            metadata,
            credit_controller_account: BalanceOf::<T>::from(5u32) * <T as balances::Config>::ExistentialDeposit::get(),
            apply_controller_account_invitation_lock: Some(BalanceOf::<T>::from(3u32) * <T as balances::Config>::ExistentialDeposit::get()),
            credit_root_account: BalanceOf::<T>::from(2u32) * <T as balances::Config>::ExistentialDeposit::get(),
            apply_root_account_invitation_lock: Some(<T as balances::Config>::ExistentialDeposit::get()),
        };

        let member_id = <NextMemberId<T>>::get();

    }: _(RawOrigin::Signed(account_id.clone()), gift_params.clone())

    verify {
        // Ensure member is successfully invited
        let handle_hash = T::Hashing::hash(&handle);

        let gifted_membership: Membership<T> = MembershipObject {
            handle_hash,
            root_account: root_account.clone(),
            controller_account: controller_account.clone(),
            verified: false,
            invites: 0,
        };

        assert_eq!(MemberIdByHandleHash::<T>::get(handle_hash), member_id);

        assert_eq!(MembershipById::<T>::get(member_id), Some(gifted_membership));

        assert_last_event::<T>(RawEvent::MembershipGifted(member_id, gift_params).into());

        assert_eq!(
            balances::Pallet::<T>::free_balance(controller_account.clone()),
            BalanceOf::<T>::from(5u32) * <T as balances::Config>::ExistentialDeposit::get(),
        );

        assert_eq!(
            balances::Pallet::<T>::free_balance(root_account.clone()),
            BalanceOf::<T>::from(2u32) * <T as balances::Config>::ExistentialDeposit::get(),
        );

        assert_eq!(
            balances::Pallet::<T>::usable_balance(controller_account),
            BalanceOf::<T>::from(2u32) * <T as balances::Config>::ExistentialDeposit::get(),
        );

        assert_eq!(
            balances::Pallet::<T>::usable_balance(root_account),
            <T as balances::Config>::ExistentialDeposit::get(),
        );
    }

    set_membership_price {
        let membership_price: BalanceOf<T> = 1000u32.into();

    }: _(RawOrigin::Root, membership_price)
    verify {
        assert_eq!(Module::<T>::membership_price(), membership_price);

        assert_last_event::<T>(RawEvent::MembershipPriceUpdated(membership_price).into());
    }

    update_profile_verification {

        let member_id = 0;

        let handle = handle_from_id::<T>(member_id);
        let (account_id, member_id) = member_funded_account::<T>("member", member_id);

        Module::<T>::add_staking_account_candidate(
            RawOrigin::Signed(account_id.clone()).into(),
            member_id,
        )
        .unwrap();
        Module::<T>::confirm_staking_account(
            RawOrigin::Signed(account_id.clone()).into(),
            member_id,
            account_id.clone(),
        )
        .unwrap();

        // Set leader member id
        let leader_id = T::insert_a_lead(0, &account_id, member_id);

        let is_verified = true;

        let leader_member_id = T::WorkingGroup::get_leader_member_id();
    }: _(RawOrigin::Signed(account_id.clone()), leader_id, member_id, is_verified)

    verify {
        // Ensure profile verification status is successfully updated

        let handle_hash = T::Hashing::hash(&handle);

        let membership: Membership<T> = MembershipObject {
            handle_hash,
            root_account: account_id.clone(),
            controller_account: account_id.clone(),
            verified: is_verified,
            invites: <T as crate::Config>::DefaultMemberInvitesCount::get(),
        };

        assert_eq!(MembershipById::<T>::get(member_id), Some(membership));

        assert_last_event::<T>(RawEvent::MemberVerificationStatusUpdated(
                member_id,
                is_verified,
                leader_id,
            ).into()
        );
    }

    set_leader_invitation_quota {
        // Set leader member id

        let member_id = 0;

        let (account_id, member_id) = member_funded_account::<T>("member", member_id);

        Module::<T>::add_staking_account_candidate(
            RawOrigin::Signed(account_id.clone()).into(),
            member_id,
        )
        .unwrap();
        Module::<T>::confirm_staking_account(
            RawOrigin::Signed(account_id.clone()).into(),
            member_id,
            account_id.clone(),
        )
        .unwrap();

        // Set leader member id
        T::insert_a_lead(0, &account_id, member_id);

        let leader_member_id = T::WorkingGroup::get_leader_member_id();

        let invitation_quota = 100;

    }: _(RawOrigin::Root, invitation_quota)
    verify {
        // Ensure leader invitation quota is successfully updated

        assert_eq!(MembershipById::<T>::get(leader_member_id.unwrap()).unwrap().invites, invitation_quota);

        assert_last_event::<T>(RawEvent::LeaderInvitationQuotaUpdated(invitation_quota).into());
    }

    set_initial_invitation_balance {
        let invitation_balance: BalanceOf<T> = 1000u32.into();

    }: _(RawOrigin::Root, invitation_balance)
    verify {

        assert_eq!(Module::<T>::initial_invitation_balance(), invitation_balance);

        assert_last_event::<T>(RawEvent::InitialInvitationBalanceUpdated(invitation_balance).into());

    }

    set_initial_invitation_count {
        let initial_invitation_count = 10;

    }: _(RawOrigin::Root, initial_invitation_count)
    verify {
        assert_eq!(Module::<T>::initial_invitation_count(), initial_invitation_count);

        assert_last_event::<T>(RawEvent::InitialInvitationCountUpdated(initial_invitation_count).into());
    }

    add_staking_account_candidate {
        let member_id = 0;

        let (account_id, member_id) = member_funded_account::<T>("member", member_id);
    }: _(RawOrigin::Signed(account_id.clone()), member_id)

    verify {

        // Ensure staking account candidate is successfully added
        let staking_account_member_binding = StakingAccountMemberBinding {
            member_id,
            confirmed: false,
        };

        assert_eq!(Module::<T>::staking_account_id_member_status(account_id.clone()), staking_account_member_binding);

        assert_last_event::<T>(RawEvent::StakingAccountAdded(account_id, member_id).into());
    }

    confirm_staking_account {
        let member_id = 0;

        let (account_id, member_id) = member_funded_account::<T>("member", member_id);
        Module::<T>::add_staking_account_candidate(
            RawOrigin::Signed(account_id.clone()).into(),
            member_id,
        ).unwrap();

    }: _(RawOrigin::Signed(account_id.clone()), member_id, account_id.clone())

    verify {

        // Ensure staking account candidate is successfully confirmed
        let staking_account_member_binding = StakingAccountMemberBinding {
            member_id,
            confirmed: true,
        };

        assert_eq!(Module::<T>::staking_account_id_member_status(account_id.clone()), staking_account_member_binding);

        assert_last_event::<T>(RawEvent::StakingAccountConfirmed(account_id, member_id).into());
    }

    remove_staking_account {
        let member_id = 0;

        let (account_id, member_id) = member_funded_account::<T>("member", member_id);
        Module::<T>::add_staking_account_candidate(
            RawOrigin::Signed(account_id.clone()).into(),
            member_id,
        ).unwrap();

    }: _(RawOrigin::Signed(account_id.clone()), member_id)

    verify {

        // Ensure staking account candidate is successfully removed
        assert!(!StakingAccountIdMemberStatus::<T>::contains_key(account_id.clone()));

        assert_last_event::<T>(RawEvent::StakingAccountRemoved(account_id, member_id).into());
    }

    member_remark_without_payment{
        let msg = b"test".to_vec();
        let member_id = 0;
        let (account_id, member_id) = member_funded_account::<T>("member", member_id);
    }: member_remark(RawOrigin::Signed(account_id.clone()), member_id, msg.clone(), None)

    verify {
        assert_last_event::<T>(RawEvent::MemberRemarked(member_id, msg, None).into());
    }

    member_remark_with_payment{
        let msg = b"test".to_vec();
        let member_id = 0;
        let (account_id, member_id) = member_funded_account::<T>("member", member_id);

        let payee_member_id = 1;
        let payee_account_id = account::<T::AccountId>("payee", payee_member_id, SEED);
        let payment_amount: BalanceOf<T> = BalanceOf::<T>::from(5u32) * <T as balances::Config>::ExistentialDeposit::get();

        let free_balance = Balances::<T>::free_balance(&account_id);

    }: member_remark(RawOrigin::Signed(account_id.clone()), member_id, msg.clone(), Some((payee_account_id.clone(), payment_amount)))

    verify {
        assert_eq!(Balances::<T>::free_balance(&account_id), free_balance - payment_amount);

        assert_last_event::<T>(RawEvent::MemberRemarked(member_id, msg, Some((payee_account_id, payment_amount))).into());
    }

    create_member{

        let i in 1 .. MAX_KILOBYTES_METADATA;

        let j in 0 .. MAX_KILOBYTES_METADATA;

        let member_id = Module::<T>::members_created();

        let account_id = account::<T::AccountId>("member", member_id.saturated_into(), SEED);

        let handle = vec![0u8].repeat((i * 1000) as usize);

        let metadata = vec![0u8].repeat((j * 1000) as usize);

        let params = CreateMemberParameters {
            root_account: account_id.clone(),
            controller_account: account_id.clone(),
            handle: handle.clone(),
            metadata,
            is_founding_member: false,
        };

    }: _(RawOrigin::Root, params.clone())
    verify {

        // Ensure membership for given member_id is successfully bought
        assert_eq!(Module::<T>::members_created(), member_id + T::MemberId::one());

        let handle_hash = T::Hashing::hash(&handle);

        let invites = Module::<T>::initial_invitation_count();
        let membership: Membership<T> = MembershipObject {
            handle_hash,
            root_account: account_id.clone(),
            controller_account: account_id.clone(),
            verified: false,
            invites,
        };

        assert_eq!(MemberIdByHandleHash::<T>::get(handle_hash), member_id);

        assert_eq!(MembershipById::<T>::get(member_id), Some(membership));

        assert_last_event::<T>(
            RawEvent::MemberCreated(member_id, params, invites).into()
        );
    }

    // impl_benchmark_test_suite!(Module, tests::mock::build_test_externalities(), tests::mock::Test)
    impl_benchmark_test_suite!(
        Module,
        tests::mock::TestExternalitiesBuilder::default().with_lead().build(),
        tests::mock::Test
    )
}
