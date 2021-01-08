#![cfg(feature = "runtime-benchmarks")]
use super::*;
use balances::Module as Balances;
use core::convert::TryInto;
use frame_benchmarking::{account, benchmarks};
use frame_support::storage::StorageMap;
use frame_support::traits::Currency;
use frame_system::Module as System;
use frame_system::{EventRecord, RawOrigin};
use membership::Module as Membership;
use sp_runtime::traits::Bounded;
use sp_std::collections::btree_set::BTreeSet;
use working_group::{
    ApplicationById, ApplicationId, ApplyOnOpeningParameters, OpeningById, OpeningId, OpeningType,
    WorkerById,
};

// The forum working group instance alias.
pub type ForumWorkingGroupInstance = working_group::Instance1;

// Alias for forum working group
type ForumGroup<T> = working_group::Module<T, ForumWorkingGroupInstance>;

/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as balances::Trait>::Balance;

const SEED: u32 = 0;
const MAX_BYTES: u32 = 16384;

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

fn member_funded_account<T: Trait + membership::Trait + balances::Trait>(
    name: &'static str,
    id: u32,
) -> (T::AccountId, T::MemberId) {
    let account_id = account::<T::AccountId>(name, id, SEED);
    let handle = handle_from_id::<T>(id);

    let _ = Balances::<T>::make_free_balance_be(&account_id, BalanceOf::<T>::max_value());

    let params = membership::BuyMembershipParameters {
        root_account: account_id.clone(),
        controller_account: account_id.clone(),
        name: None,
        handle: Some(handle),
        avatar_uri: None,
        about: None,
        referrer_id: None,
    };

    Membership::<T>::buy_membership(RawOrigin::Signed(account_id.clone()).into(), params).unwrap();

    let _ = Balances::<T>::make_free_balance_be(&account_id, BalanceOf::<T>::max_value());

    let member_id = T::MemberId::from(id.try_into().unwrap());
    Membership::<T>::add_staking_account_candidate(
        RawOrigin::Signed(account_id.clone()).into(),
        member_id.clone(),
    )
    .unwrap();
    Membership::<T>::confirm_staking_account(
        RawOrigin::Signed(account_id.clone()).into(),
        member_id.clone(),
        account_id.clone(),
    )
    .unwrap();

    (account_id, member_id)
}

// Method to generate a distintic valid handle
// for a membership. For each index.
fn handle_from_id<T: membership::Trait>(id: u32) -> Vec<u8> {
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

fn insert_a_lead_member<
    T: Trait + membership::Trait + working_group::Trait<ForumWorkingGroupInstance> + balances::Trait,
>(
    job_opening_type: OpeningType,
    id: u32,
) -> T::AccountId {
    let add_worker_origin = RawOrigin::Root;

    let (caller_id, member_id) = member_funded_account::<T>("member", id);

    let (opening_id, application_id) = add_and_apply_opening::<T>(
        &T::Origin::from(add_worker_origin.clone()),
        &caller_id,
        &member_id,
        &job_opening_type,
    );

    let mut successful_application_ids = BTreeSet::<ApplicationId>::new();
    successful_application_ids.insert(application_id);
    ForumGroup::<T>::fill_opening(
        add_worker_origin.clone().into(),
        opening_id,
        successful_application_ids,
    )
    .unwrap();

    let actor_id = <T as common::Trait>::ActorId::from(id.try_into().unwrap());
    assert!(WorkerById::<T, ForumWorkingGroupInstance>::contains_key(
        actor_id
    ));

    caller_id
}

fn add_and_apply_opening<T: Trait + working_group::Trait<ForumWorkingGroupInstance>>(
    add_opening_origin: &T::Origin,
    applicant_id: &T::AccountId,
    member_id: &T::MemberId,
    job_opening_type: &OpeningType,
) -> (OpeningId, ApplicationId) {
    let opening_id = add_opening_helper::<T>(add_opening_origin, job_opening_type);

    let application_id = apply_on_opening_helper::<T>(applicant_id, member_id, &opening_id);

    (opening_id, application_id)
}

fn add_opening_helper<T: Trait + working_group::Trait<ForumWorkingGroupInstance>>(
    add_opening_origin: &T::Origin,
    job_opening_type: &OpeningType,
) -> OpeningId {
    ForumGroup::<T>::add_opening(
        add_opening_origin.clone(),
        vec![],
        *job_opening_type,
        None,
        Some(One::one()),
    )
    .unwrap();

    let opening_id = ForumGroup::<T>::next_opening_id() - 1;

    assert!(
        OpeningById::<T, ForumWorkingGroupInstance>::contains_key(opening_id),
        "Opening not added"
    );

    opening_id
}

fn apply_on_opening_helper<T: Trait + working_group::Trait<ForumWorkingGroupInstance>>(
    applicant_id: &T::AccountId,
    member_id: &T::MemberId,
    opening_id: &OpeningId,
) -> ApplicationId {
    ForumGroup::<T>::apply_on_opening(
        RawOrigin::Signed(applicant_id.clone()).into(),
        ApplyOnOpeningParameters::<T> {
            member_id: *member_id,
            opening_id: *opening_id,
            role_account_id: applicant_id.clone(),
            reward_account_id: applicant_id.clone(),
            description: vec![],
            stake_parameters: None,
        },
    )
    .unwrap();

    let application_id = ForumGroup::<T>::next_application_id() - 1;

    assert!(
        ApplicationById::<T, ForumWorkingGroupInstance>::contains_key(application_id),
        "Application not added"
    );

    application_id
}

benchmarks! {
    where_clause { where T: balances::Trait, T: membership::Trait, T: working_group::Trait<ForumWorkingGroupInstance> }
    _{  }

    buy_membership_without_referrer{

        let i in 0 .. MAX_BYTES;

        let j in 0 .. MAX_BYTES;

        let k in 0 .. MAX_BYTES;

        let account_id = account::<T::AccountId>(name, id, SEED);

        let handle = handle_from_id::<T>(id);

        let _ = Balances::<T>::make_free_balance_be(&account_id, BalanceOf::<T>::max_value());

        let params = membership::BuyMembershipParameters {
            root_account: account_id.clone(),
            controller_account: account_id.clone(),
            name: None,
            handle: Some(handle),
            avatar_uri: None,
            about: None,
            referrer_id: None,
        };

    }: buy_membership(RawOrigin::Signed(caller_id), parent_category_id, title.clone(), description.clone())
    verify {

        let new_category = Category {
            title_hash: T::calculate_hash(title.as_slice()),
            description_hash: T::calculate_hash(description.as_slice()),
            archived: false,
            num_direct_subcategories: 0,
            num_direct_threads: 0,
            num_direct_moderators: 0,
            parent_category_id,
            sticky_thread_ids: vec![],
        };

        let category_id = Module::<T>::next_category_id() - T::CategoryId::one();
        assert_eq!(Module::<T>::category_by_id(category_id), new_category);
        assert_eq!(<Module<T>>::category_counter(), category_counter + T::CategoryId::one());

        if let (Some(parent_category), Some(parent_category_id)) = (parent_category, parent_category_id) {
            assert_eq!(
                Module::<T>::category_by_id(parent_category_id).num_direct_subcategories,
                parent_category.num_direct_subcategories + 1
            );
        }
        assert_last_event::<T>(RawEvent::CategoryCreated(category_id).into());
    }

    buy_membership_with_referrer{

        let i in 0 .. MAX_BYTES;

        let j in 0 .. MAX_BYTES;

        let k in 0 .. MAX_BYTES;

        let account_id = account::<T::AccountId>(name, id, SEED);

        let handle = handle_from_id::<T>(id);

        let _ = Balances::<T>::make_free_balance_be(&account_id, BalanceOf::<T>::max_value());

        let params = membership::BuyMembershipParameters {
            root_account: account_id.clone(),
            controller_account: account_id.clone(),
            name: None,
            handle: Some(handle),
            avatar_uri: None,
            about: None,
            referrer_id: None,
        };

    }: buy_membership(RawOrigin::Signed(account_id), parent_category_id, title.clone(), description.clone())
    verify {

        let new_category = Category {
            title_hash: T::calculate_hash(title.as_slice()),
            description_hash: T::calculate_hash(description.as_slice()),
            archived: false,
            num_direct_subcategories: 0,
            num_direct_threads: 0,
            num_direct_moderators: 0,
            parent_category_id,
            sticky_thread_ids: vec![],
        };

        let category_id = Module::<T>::next_category_id() - T::CategoryId::one();
        assert_eq!(Module::<T>::category_by_id(category_id), new_category);
        assert_eq!(<Module<T>>::category_counter(), category_counter + T::CategoryId::one());

        if let (Some(parent_category), Some(parent_category_id)) = (parent_category, parent_category_id) {
            assert_eq!(
                Module::<T>::category_by_id(parent_category_id).num_direct_subcategories,
                parent_category.num_direct_subcategories + 1
            );
        }
        assert_last_event::<T>(RawEvent::CategoryCreated(category_id).into());
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::mock::*;
    use frame_support::assert_ok;

    #[test]
    fn buy_membership_with_referrer() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_buy_membership_with_referrer::<Runtime>());
        });
    }
}
