#![cfg(feature = "runtime-benchmarks")]
use super::*;
// use crate::Module as Membership;
use crate::{
    BuyMembershipParameters, MemberIdsByControllerAccountId, MemberIdsByRootAccountId, Membership,
    MembershipById, MembershipObject, Trait,
};
use balances::Module as Balances;
use core::convert::TryInto;
use frame_benchmarking::{account, benchmarks};
use frame_support::storage::StorageMap;
use frame_support::traits::Currency;
use frame_system::Module as System;
use frame_system::{EventRecord, RawOrigin};
use sp_arithmetic::traits::{One, Zero};
use sp_runtime::traits::Bounded;
use sp_std::collections::btree_set::BTreeSet;

/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as balances::Trait>::Balance;

const SEED: u32 = 0;
const MAX_BYTES: u32 = 255;

fn get_byte(num: u32, byte_number: u8) -> u8 {
    ((num & (0xff << (8 * byte_number))) >> 8 * byte_number) as u8
}

fn assert_last_event<T: Trait>(generic_event: <T as Trait>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Trait>::Event = generic_event.into();
    // compare to the last event record
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

// fn member_funded_account<T: Trait + balances::Trait>(
//     name: &'static str,
//     id: u32,
// ) -> (T::AccountId, T::MemberId) {
//     let account_id = account::<T::AccountId>("member", id, SEED);
//     let handle = handle_from_id::<T>(id, 4);

//     let _ = Balances::<T>::make_free_balance_be(&account_id, BalanceOf::<T>::max_value());

//     let params = BuyMembershipParameters {
//         root_account: account_id.clone(),
//         controller_account: account_id.clone(),
//         name: None,
//         handle: Some(handle),
//         avatar_uri: None,
//         about: None,
//         referrer_id: None,
//     };

//     Membership::<T>::buy_membership(RawOrigin::Signed(account_id.clone()).into(), params).unwrap();

//     let _ = Balances::<T>::make_free_balance_be(&account_id, BalanceOf::<T>::max_value());

//     let member_id = T::MemberId::from(id.try_into().unwrap());
//     Membership::<T>::add_staking_account_candidate(
//         RawOrigin::Signed(account_id.clone()).into(),
//         member_id.clone(),
//     )
//     .unwrap();
//     Membership::<T>::confirm_staking_account(
//         RawOrigin::Signed(account_id.clone()).into(),
//         member_id.clone(),
//         account_id.clone(),
//     )
//     .unwrap();

//     (account_id, member_id)
// }

// Method to generate a distintic valid handle
// for a membership. For each index.
fn handle_from_id<T: Trait>(id: u32) -> Vec<u8> {
    let min_handle_length = 1;

    let mut handle = vec![];

    for i in 0..4 {
        handle.push(get_byte(id, i));
    }

    while handle.len() < (min_handle_length as usize) {
        handle.push(0u8);
    }

    handle
}

benchmarks! {
    where_clause { where T: balances::Trait, T: Trait }
    _{  }

    buy_membership_without_referrer{

        let i in 0 .. MAX_BYTES;

        let member_id = 0;

        let account_id = account::<T::AccountId>("member", member_id, SEED);

        let handle = handle_from_id::<T>(member_id);

        let member_id = T::MemberId::from(member_id.try_into().unwrap());

        let free_balance = BalanceOf::<T>::max_value();

        let _ = Balances::<T>::make_free_balance_be(&account_id, BalanceOf::<T>::max_value());

        let fee = Module::<T>::membership_price();

        let params = BuyMembershipParameters {
            root_account: account_id.clone(),
            controller_account: account_id.clone(),
            name: None,
            handle: Some(handle.clone()),
            avatar_uri: None,
            about: None,
            referrer_id: None,
        };

    }: buy_membership(RawOrigin::Signed(account_id.clone()), params)
    verify {

        assert_eq!(Module::<T>::members_created(), member_id + T::MemberId::one());

        assert_eq!(Balances::<T>::free_balance(&account_id.clone()), free_balance - fee);

        let handle_hash = T::Hashing::hash(&handle).as_ref().to_vec();

        let membership: Membership<T> = MembershipObject {
            handle_hash: handle_hash.clone(),
            root_account: account_id.clone(),
            controller_account: account_id.clone(),
            verified: false,
            // Save the updated profile.
            invites: 5,
        };

        assert_eq!(MemberIdsByRootAccountId::<T>::get(account_id.clone()), vec![member_id]);

        assert_eq!(MemberIdsByControllerAccountId::<T>::get(account_id.clone()), vec![member_id]);

        assert_eq!(MembershipById::<T>::get(member_id), membership);

        assert_eq!(Module::<T>::handles(handle_hash), member_id);

        assert_last_event::<T>(RawEvent::MemberRegistered(member_id).into());
    }

    // buy_membership_with_referrer{

    //     let i in 1 .. MAX_BYTES;

    //     let account_id = account::<T::AccountId>(name, id, SEED);

    //     let handle = handle_from_id::<T>(id, i);

    //     let _ = Balances::<T>::make_free_balance_be(&account_id, BalanceOf::<T>::max_value());

    //     let params = membership::BuyMembershipParameters {
    //         root_account: account_id.clone(),
    //         controller_account: account_id.clone(),
    //         name: None,
    //         handle: Some(handle),
    //         avatar_uri: None,
    //         about: None,
    //         referrer_id: None,
    //     };

    // }: buy_membership(RawOrigin::Signed(account_id), params)
    // verify {

    //     let new_category = Category {
    //         title_hash: T::calculate_hash(title.as_slice()),
    //         description_hash: T::calculate_hash(description.as_slice()),
    //         archived: false,
    //         num_direct_subcategories: 0,
    //         num_direct_threads: 0,
    //         num_direct_moderators: 0,
    //         parent_category_id,
    //         sticky_thread_ids: vec![],
    //     };

    //     let category_id = Module::<T>::next_category_id() - T::CategoryId::one();
    //     assert_eq!(Module::<T>::category_by_id(category_id), new_category);
    //     assert_eq!(<Module<T>>::category_counter(), category_counter + T::CategoryId::one());

    //     if let (Some(parent_category), Some(parent_category_id)) = (parent_category, parent_category_id) {
    //         assert_eq!(
    //             Module::<T>::category_by_id(parent_category_id).num_direct_subcategories,
    //             parent_category.num_direct_subcategories + 1
    //         );
    //     }
    //     assert_last_event::<T>(RawEvent::CategoryCreated(category_id).into());
    // }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tests::*;
    use frame_support::assert_ok;

    // #[test]
    // fn buy_membership_with_referrer() {
    //     with_test_externalities(|| {
    //         assert_ok!(test_benchmark_buy_membership_with_referrer::<Runtime>());
    //     });
    // }

    #[test]
    fn buy_membership_without_referrer() {
        build_test_externalities().execute_with(|| {
            let starting_block = 1;
            run_to_block(starting_block);

            assert_ok!(test_benchmark_buy_membership_without_referrer::<Test>());
        });
    }
}
