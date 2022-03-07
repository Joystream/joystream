#![cfg(feature = "runtime-benchmarks")]

use core::convert::TryInto;
use frame_benchmarking::{account, benchmarks};
use frame_support::storage::{StorageMap, StorageValue};
use frame_support::traits::{Currency, Get};
use frame_system::{EventRecord, RawOrigin};
use sp_arithmetic::traits::One;
use sp_runtime::traits::Bounded;
use sp_std::boxed::Box;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::vec;
use sp_std::vec::Vec;

use frame_system::Module as System;
use membership::Module as Membership;
use working_group::{
    ApplicationById, ApplicationId, ApplyOnOpeningParameters, OpeningById, OpeningId, OpeningType,
    StakeParameters, StakePolicy, WorkerById,
};

use crate::{Balances, Call, Module, RawEvent, StorageBucketById, Trait};
use frame_support::sp_runtime::SaturatedConversion;

// The storage working group instance alias.
pub type StorageWorkingGroupInstance = working_group::Instance2;

// Alias for storage working group.
type StorageGroup<T> = working_group::Module<T, StorageWorkingGroupInstance>;

/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as balances::Trait>::Balance;

pub const STORAGE_WG_LEADER_ACCOUNT_ID: u64 = 100001;

fn assert_last_event<T: Trait>(generic_event: <T as Trait>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Trait>::Event = generic_event.into();
    // compare to the last event record
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

// We create this trait because we need to be compatible with the runtime
// in the mock for tests. In that case we need to be able to have `membership_id == account_id`
// We can't create an account from an `u32` or from a memberhsip_dd,
// so this trait allows us to get an account id from an u32, in the case of `64` which is what
// the mock use we get the parameter as a return.
// In the case of `AccountId32` we use the method provided by `frame_benchmarking` to get an
// AccountId.
pub trait CreateAccountId {
    fn create_account_id(id: u32) -> Self;
}

impl CreateAccountId for u128 {
    fn create_account_id(id: u32) -> Self {
        id.into()
    }
}

impl CreateAccountId for u64 {
    fn create_account_id(id: u32) -> Self {
        id.into()
    }
}

const SEED: u32 = 0;

impl CreateAccountId for sp_core::crypto::AccountId32 {
    fn create_account_id(id: u32) -> Self {
        account::<Self>("default", id, SEED)
    }
}

fn get_byte(num: u32, byte_number: u8) -> u8 {
    ((num & (0xff << (8 * byte_number))) >> (8 * byte_number)) as u8
}

fn member_funded_account<T: Trait + membership::Trait + balances::Trait>(
    id: u32,
) -> (T::AccountId, T::MemberId)
where
    T::AccountId: CreateAccountId,
{
    let account_id = T::AccountId::create_account_id(id);
    let handle = handle_from_id::<T>(id);

    let _ = Balances::<T>::make_free_balance_be(&account_id, BalanceOf::<T>::max_value());

    let params = membership::BuyMembershipParameters {
        root_account: account_id.clone(),
        controller_account: account_id.clone(),
        handle: Some(handle),
        metadata: Vec::new(),
        referrer_id: None,
    };

    let member_id = membership::NextMemberId::<T>::get();
    Membership::<T>::buy_membership(RawOrigin::Signed(account_id.clone()).into(), params).unwrap();

    let _ = Balances::<T>::make_free_balance_be(&account_id, BalanceOf::<T>::max_value());

    Membership::<T>::add_staking_account_candidate(
        RawOrigin::Signed(account_id.clone()).into(),
        member_id,
    )
    .unwrap();
    Membership::<T>::confirm_staking_account(
        RawOrigin::Signed(account_id.clone()).into(),
        member_id,
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

fn insert_a_leader<
    T: Trait + membership::Trait + working_group::Trait<StorageWorkingGroupInstance> + balances::Trait,
>(
    id: u64,
) -> T::AccountId
where
    T::AccountId: CreateAccountId,
{
    let (caller_id, member_id) = member_funded_account::<T>(id.saturated_into());

    let (opening_id, application_id) = add_and_apply_opening::<T>(
        &T::Origin::from(RawOrigin::Root),
        &caller_id,
        &member_id,
        &OpeningType::Leader,
    );

    let mut successful_application_ids = BTreeSet::<ApplicationId>::new();
    successful_application_ids.insert(application_id);

    let worker_id = working_group::NextWorkerId::<T, StorageWorkingGroupInstance>::get();
    StorageGroup::<T>::fill_opening(
        RawOrigin::Root.into(),
        opening_id,
        successful_application_ids,
    )
    .unwrap();

    assert!(WorkerById::<T, StorageWorkingGroupInstance>::contains_key(
        worker_id
    ));

    caller_id
}

fn insert_a_worker<
    T: Trait + membership::Trait + working_group::Trait<StorageWorkingGroupInstance> + balances::Trait,
>(
    leader_account_id: T::AccountId,
    id: u64,
) -> T::AccountId
where
    T::AccountId: CreateAccountId,
{
    let (caller_id, member_id) = member_funded_account::<T>(id as u32);

    let leader_origin = RawOrigin::Signed(leader_account_id);

    let (opening_id, application_id) = add_and_apply_opening::<T>(
        &T::Origin::from(leader_origin.clone()),
        &caller_id,
        &member_id,
        &OpeningType::Regular,
    );

    let mut successful_application_ids = BTreeSet::<ApplicationId>::new();
    successful_application_ids.insert(application_id);
    StorageGroup::<T>::fill_opening(leader_origin.into(), opening_id, successful_application_ids)
        .unwrap();

    let actor_id =
        <T as common::membership::MembershipTypes>::ActorId::from(id.try_into().unwrap());
    assert!(WorkerById::<T, StorageWorkingGroupInstance>::contains_key(
        actor_id
    ));

    caller_id
}

fn add_and_apply_opening<T: Trait + working_group::Trait<StorageWorkingGroupInstance>>(
    add_opening_origin: &T::Origin,
    applicant_account_id: &T::AccountId,
    applicant_member_id: &T::MemberId,
    job_opening_type: &OpeningType,
) -> (OpeningId, ApplicationId) {
    let opening_id = add_opening_helper::<T>(add_opening_origin, job_opening_type);

    let application_id =
        apply_on_opening_helper::<T>(applicant_account_id, applicant_member_id, &opening_id);

    (opening_id, application_id)
}

fn add_opening_helper<T: Trait + working_group::Trait<StorageWorkingGroupInstance>>(
    add_opening_origin: &T::Origin,
    job_opening_type: &OpeningType,
) -> OpeningId {
    StorageGroup::<T>::add_opening(
        add_opening_origin.clone(),
        vec![],
        *job_opening_type,
        StakePolicy {
            stake_amount:
            <T as working_group::Trait<StorageWorkingGroupInstance>>::MinimumApplicationStake::get(
            ),
            leaving_unstaking_period: <T as
            working_group::Trait<StorageWorkingGroupInstance>>::MinUnstakingPeriodLimit::get() + One::one(),
        },
        Some(One::one()),
    )
        .unwrap();

    let opening_id = StorageGroup::<T>::next_opening_id() - 1;

    assert!(
        OpeningById::<T, StorageWorkingGroupInstance>::contains_key(opening_id),
        "Opening not added"
    );

    opening_id
}

fn apply_on_opening_helper<T: Trait + working_group::Trait<StorageWorkingGroupInstance>>(
    applicant_account_id: &T::AccountId,
    applicant_member_id: &T::MemberId,
    opening_id: &OpeningId,
) -> ApplicationId {
    StorageGroup::<T>::apply_on_opening(
        RawOrigin::Signed((*applicant_account_id).clone()).into(),
        ApplyOnOpeningParameters::<T> {
            member_id: *applicant_member_id,
            opening_id: *opening_id,
            role_account_id: applicant_account_id.clone(),
            reward_account_id: applicant_account_id.clone(),
            description: vec![],
            stake_parameters: StakeParameters {
                stake: <T as working_group::Trait<StorageWorkingGroupInstance>>::MinimumApplicationStake::get(),
                staking_account_id: applicant_account_id.clone()
            },
        },
    )
        .unwrap();

    let application_id = StorageGroup::<T>::next_application_id() - 1;

    assert!(
        ApplicationById::<T, StorageWorkingGroupInstance>::contains_key(application_id),
        "Application not added"
    );

    application_id
}

fn create_storage_bucket_helper<T: Trait>(account_id: T::AccountId) -> T::StorageBucketId {
    let storage_bucket_id = Module::<T>::next_storage_bucket_id();

    Module::<T>::create_storage_bucket(RawOrigin::Signed(account_id).into(), None, false, 0, 0)
        .unwrap();

    assert!(<StorageBucketById<T>>::contains_key(&storage_bucket_id));

    storage_bucket_id
}

benchmarks! {
    where_clause {
        where T: balances::Trait,
              T: Trait,
              T: working_group::Trait<StorageWorkingGroupInstance>,
              T: membership::Trait,
              T::AccountId: CreateAccountId,
    }
    _{ }

    create_storage_bucket {
        let lead_account_id = insert_a_leader::<T>(STORAGE_WG_LEADER_ACCOUNT_ID);
        let storage_bucket_id = Module::<T>::next_storage_bucket_id();

    }: _ (RawOrigin::Signed(lead_account_id), None, false, 0, 0)
    verify {
        assert!(StorageBucketById::<T>::contains_key(&storage_bucket_id));
        assert_last_event::<T>(
                RawEvent::StorageBucketCreated(storage_bucket_id, None, false, 0, 0).into()
        );
    }

    update_storage_bucket_status {
        let lead_account_id = insert_a_leader::<T>(STORAGE_WG_LEADER_ACCOUNT_ID);
        let new_status = true;

        let storage_bucket_id = create_storage_bucket_helper::<T>(lead_account_id.clone());
    }: _ (RawOrigin::Signed(lead_account_id), storage_bucket_id, new_status)
    verify {

        let storage_bucket = Module::<T>::storage_bucket_by_id(&storage_bucket_id);
        assert_last_event::<T>(
                RawEvent::StorageBucketStatusUpdated(storage_bucket_id, new_status).into()
        );
    }

    update_uploading_blocked_status {
        let lead_account_id = insert_a_leader::<T>(STORAGE_WG_LEADER_ACCOUNT_ID);
        let new_status = true;

    }: _ (RawOrigin::Signed(lead_account_id), new_status)
    verify {

        assert_eq!(Module::<T>::uploading_blocked(), new_status);
        assert_last_event::<T>(
                RawEvent::UploadingBlockStatusUpdated(new_status).into()
        );
    }

    update_data_size_fee {
        let lead_account_id = insert_a_leader::<T>(STORAGE_WG_LEADER_ACCOUNT_ID);
        let new_fee: BalanceOf<T> = 10u32.into();

    }: _ (RawOrigin::Signed(lead_account_id), new_fee)
    verify {

        assert_eq!(Module::<T>::data_object_per_mega_byte_fee(), new_fee);
        assert_last_event::<T>(
                RawEvent::DataObjectPerMegabyteFeeUpdated(new_fee).into()
        );
    }

    delete_storage_bucket {
        let lead_account_id = insert_a_leader::<T>(STORAGE_WG_LEADER_ACCOUNT_ID);

        let storage_bucket_id = create_storage_bucket_helper::<T>(lead_account_id.clone());
    }: _ (RawOrigin::Signed(lead_account_id), storage_bucket_id)
    verify {

        assert!(!StorageBucketById::<T>::contains_key(&storage_bucket_id));
        assert_last_event::<T>(
                RawEvent::StorageBucketDeleted(storage_bucket_id).into()
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tests::mocks::{build_test_externalities, Test};
    use frame_support::assert_ok;

    #[test]
    fn create_storage_bucket() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_create_storage_bucket::<Test>());
        });
    }

    #[test]
    fn update_storage_bucket_status() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_update_storage_bucket_status::<Test>());
        });
    }

    #[test]
    fn delete_storage_bucket() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_delete_storage_bucket::<Test>());
        });
    }

    #[test]
    fn update_uploading_blocked_status() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_update_uploading_blocked_status::<Test>());
        });
    }

    #[test]
    fn update_data_size_fee() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_update_data_size_fee::<Test>());
        });
    }
}
