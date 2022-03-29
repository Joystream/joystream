#![cfg(feature = "runtime-benchmarks")]

use frame_benchmarking::{account, benchmarks};
use frame_support::storage::{StorageDoubleMap, StorageMap, StorageValue};
use frame_support::traits::Instance;
use frame_support::traits::{Currency, Get};
use frame_system::{EventRecord, RawOrigin};
use sp_arithmetic::traits::{One, Zero};
use sp_runtime::traits::Bounded;
use sp_std::boxed::Box;
use sp_std::collections::btree_map::BTreeMap;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::iter;
use sp_std::iter::FromIterator;
use sp_std::vec;
use sp_std::vec::Vec;

use frame_system::Module as System;
use membership::Module as Membership;
use working_group::{
    ApplicationById, ApplicationId, ApplyOnOpeningParameters, OpeningById, OpeningId, OpeningType,
    StakeParameters, StakePolicy, WorkerById,
};

use crate::{
    BagId, Balances, Blacklist, Call, Cid, DataObjectCreationParameters,
    DistributionBucketByFamilyIdById, DistributionBucketFamilyById, DistributionBucketId,
    DynamicBagType, Module, RawEvent, StaticBagId, StorageBucketById, StorageBucketOperatorStatus,
    Trait, UploadParameters, WorkerId,
};
use frame_support::sp_runtime::SaturatedConversion;

// The storage working group instance alias.
pub type StorageWorkingGroupInstance = working_group::Instance2;
// The distribution working group instance alias.
pub type DistributionWorkingGroupInstance = working_group::Instance9;

/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as balances::Trait>::Balance;

pub const STORAGE_WG_LEADER_ACCOUNT_ID: u64 = 100001;
pub const DISTRIBUTION_WG_LEADER_ACCOUNT_ID: u64 = 100004;
pub const DEFAULT_STORAGE_WORKER_ACCOUNT_ID: u64 = 100002;
pub const DEFAULT_DISTRIBUTION_WORKER_ACCOUNT_ID: u64 = 100003;
pub const SECOND_WORKER_ACCOUNT_ID: u64 = 1;

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

fn insert_storage_leader<T>(id: u64) -> T::AccountId
where
    T::AccountId: CreateAccountId,
    T: Trait
        + membership::Trait
        + working_group::Trait<StorageWorkingGroupInstance>
        + balances::Trait,
{
    insert_leader::<T, StorageWorkingGroupInstance>(id)
}

fn insert_distribution_leader<T>(id: u64) -> T::AccountId
where
    T::AccountId: CreateAccountId,
    T: Trait
        + membership::Trait
        + working_group::Trait<DistributionWorkingGroupInstance>
        + balances::Trait,
{
    insert_leader::<T, DistributionWorkingGroupInstance>(id)
}

fn insert_leader<T, I>(id: u64) -> T::AccountId
where
    T::AccountId: CreateAccountId,
    T: Trait + membership::Trait + working_group::Trait<I> + balances::Trait,
    I: Instance,
{
    let (caller_id, member_id) = member_funded_account::<T>(id.saturated_into());

    let (opening_id, application_id) = add_and_apply_opening::<T, I>(
        &T::Origin::from(RawOrigin::Root),
        &caller_id,
        &member_id,
        &OpeningType::Leader,
    );

    let successful_application_ids = BTreeSet::<ApplicationId>::from_iter(vec![application_id]);

    let worker_id = working_group::NextWorkerId::<T, I>::get();
    working_group::Module::<T, I>::fill_opening(
        RawOrigin::Root.into(),
        opening_id,
        successful_application_ids,
    )
    .unwrap();

    assert!(WorkerById::<T, I>::contains_key(worker_id));

    caller_id
}

fn insert_worker<
    T: Trait + membership::Trait + working_group::Trait<I> + balances::Trait,
    I: Instance,
>(
    leader_account_id: T::AccountId,
    id: u64,
) -> (T::AccountId, WorkerId<T>)
where
    T::AccountId: CreateAccountId,
{
    let (caller_id, member_id) = member_funded_account::<T>(id as u32);

    let leader_origin = RawOrigin::Signed(leader_account_id);

    let (opening_id, application_id) = add_and_apply_opening::<T, I>(
        &T::Origin::from(leader_origin.clone()),
        &caller_id,
        &member_id,
        &OpeningType::Regular,
    );

    let successful_application_ids = BTreeSet::<ApplicationId>::from_iter(vec![application_id]);
    let worker_id = working_group::NextWorkerId::<T, I>::get();
    working_group::Module::<T, I>::fill_opening(
        leader_origin.into(),
        opening_id,
        successful_application_ids,
    )
    .unwrap();

    assert!(WorkerById::<T, I>::contains_key(&worker_id));

    (caller_id, worker_id)
}

fn insert_storage_worker<
    T: Trait + membership::Trait + working_group::Trait<StorageWorkingGroupInstance> + balances::Trait,
>(
    leader_account_id: T::AccountId,
    id: u64,
) -> (T::AccountId, WorkerId<T>)
where
    T::AccountId: CreateAccountId,
{
    insert_worker::<T, StorageWorkingGroupInstance>(leader_account_id, id)
}

fn insert_distribution_worker<
    T: Trait
        + membership::Trait
        + working_group::Trait<DistributionWorkingGroupInstance>
        + balances::Trait,
>(
    leader_account_id: T::AccountId,
    id: u64,
) -> (T::AccountId, WorkerId<T>)
where
    T::AccountId: CreateAccountId,
{
    insert_worker::<T, DistributionWorkingGroupInstance>(leader_account_id, id)
}

fn add_and_apply_opening<T: Trait + working_group::Trait<I>, I: Instance>(
    add_opening_origin: &T::Origin,
    applicant_account_id: &T::AccountId,
    applicant_member_id: &T::MemberId,
    job_opening_type: &OpeningType,
) -> (OpeningId, ApplicationId) {
    let opening_id = add_opening_helper::<T, I>(add_opening_origin, job_opening_type);

    let application_id =
        apply_on_opening_helper::<T, I>(applicant_account_id, applicant_member_id, &opening_id);

    (opening_id, application_id)
}

fn add_opening_helper<T: Trait + working_group::Trait<I>, I: Instance>(
    add_opening_origin: &T::Origin,
    job_opening_type: &OpeningType,
) -> OpeningId {
    working_group::Module::<T, I>::add_opening(
        add_opening_origin.clone(),
        vec![],
        *job_opening_type,
        StakePolicy {
            stake_amount: <T as working_group::Trait<I>>::MinimumApplicationStake::get(),
            leaving_unstaking_period: <T as working_group::Trait<I>>::MinUnstakingPeriodLimit::get(
            ) + One::one(),
        },
        Some(One::one()),
    )
    .unwrap();

    let opening_id = working_group::Module::<T, I>::next_opening_id() - 1;

    assert!(
        OpeningById::<T, I>::contains_key(opening_id),
        "Opening not added"
    );

    opening_id
}

fn apply_on_opening_helper<T: Trait + working_group::Trait<I>, I: Instance>(
    applicant_account_id: &T::AccountId,
    applicant_member_id: &T::MemberId,
    opening_id: &OpeningId,
) -> ApplicationId {
    working_group::Module::<T, I>::apply_on_opening(
        RawOrigin::Signed((*applicant_account_id).clone()).into(),
        ApplyOnOpeningParameters::<T> {
            member_id: *applicant_member_id,
            opening_id: *opening_id,
            role_account_id: applicant_account_id.clone(),
            reward_account_id: applicant_account_id.clone(),
            description: vec![],
            stake_parameters: StakeParameters {
                stake: <T as working_group::Trait<I>>::MinimumApplicationStake::get(),
                staking_account_id: applicant_account_id.clone(),
            },
        },
    )
    .unwrap();

    let application_id = working_group::Module::<T, I>::next_application_id() - 1;

    assert!(
        ApplicationById::<T, I>::contains_key(application_id),
        "Application not added"
    );

    application_id
}

fn create_storage_bucket_helper<T: Trait>(account_id: T::AccountId) -> T::StorageBucketId {
    let storage_bucket_id = Module::<T>::next_storage_bucket_id();

    Module::<T>::create_storage_bucket(RawOrigin::Signed(account_id).into(), None, true, 0, 0)
        .unwrap();

    assert!(<StorageBucketById<T>>::contains_key(&storage_bucket_id));

    storage_bucket_id
}

fn create_storage_buckets<T: Trait>(
    account_id: T::AccountId,
    i: u32,
) -> BTreeSet<T::StorageBucketId> {
    iter::repeat(())
        .take(i.saturated_into())
        .map(|_| create_storage_bucket_helper::<T>(account_id.clone()))
        .collect::<_>()
}

fn create_cids(i: u32, prefix: u8) -> BTreeSet<Cid> {
    fn create_cid(i: u32, prefix: u8) -> Cid {
        let bytes = i.to_be_bytes();
        let mut buffer = Vec::new();

        // Total CID = 32 bytes
        for _ in 0..8 {
            buffer.append(&mut bytes.to_vec());
        }

        buffer[0] = prefix;

        buffer
    }

    (0..i)
        .into_iter()
        .map(|idx| create_cid(idx, prefix))
        .collect::<_>()
}

fn set_storage_operator<T: Trait>(
    lead_account_id: T::AccountId,
    bucket_id: T::StorageBucketId,
    worker_id: WorkerId<T>,
    worker_account_id: T::AccountId,
) {
    Module::<T>::invite_storage_bucket_operator(
        RawOrigin::Signed(lead_account_id).into(),
        bucket_id,
        worker_id,
    )
    .unwrap();

    Module::<T>::accept_storage_bucket_invitation(
        RawOrigin::Signed(worker_account_id.clone()).into(),
        worker_id,
        bucket_id,
        worker_account_id,
    )
    .unwrap();
}

fn create_distribution_bucket_helper<T: Trait>(
    lead_account_id: T::AccountId,
) -> DistributionBucketId<T> {
    create_distribution_bucket_with_family::<T>(lead_account_id, None)
}

fn create_distribution_bucket_families<T: Trait>(
    lead_account_id: T::AccountId,
    i: u32,
) -> Vec<T::DistributionBucketFamilyId> {
    iter::repeat(())
        .take(i.saturated_into())
        .map(|_| create_distribution_family::<T>(lead_account_id.clone()))
        .collect::<Vec<_>>()
}

fn create_distribution_family<T: Trait>(
    lead_account_id: T::AccountId,
) -> T::DistributionBucketFamilyId {
    let fam_id = Module::<T>::next_distribution_bucket_family_id();

    Module::<T>::create_distribution_bucket_family(RawOrigin::Signed(lead_account_id).into())
        .unwrap();

    fam_id
}

fn create_distribution_bucket_with_family<T: Trait>(
    lead_account_id: T::AccountId,
    existing_family_id: Option<T::DistributionBucketFamilyId>,
) -> DistributionBucketId<T> {
    let family_id = if let Some(existing_family_id) = existing_family_id {
        existing_family_id
    } else {
        create_distribution_family::<T>(lead_account_id.clone())
    };

    let family = Module::<T>::distribution_bucket_family_by_id(family_id);
    let bucket_idx = family.next_distribution_bucket_index;
    let bucket_status = true;

    Module::<T>::create_distribution_bucket(
        RawOrigin::Signed(lead_account_id).into(),
        family_id,
        bucket_status,
    )
    .unwrap();

    Module::<T>::create_distribution_bucket_id(family_id, bucket_idx)
}

fn create_distribution_buckets<T: Trait>(
    account_id: T::AccountId,
    family_id: T::DistributionBucketFamilyId,
    i: u32,
) -> BTreeSet<DistributionBucketId<T>> {
    iter::repeat(())
        .take(i.saturated_into())
        .map(|_| create_distribution_bucket_with_family::<T>(account_id.clone(), Some(family_id)))
        .collect::<_>()
}

const DISTRIBUTION_BUCKET_FAMILIES_NUMBER: u32 = 7;
const MAX_BYTE_SIZE: u32 = 1000;
const OBJECT_COUNT: u32 = 400;

benchmarks! {
    where_clause {
        where T: balances::Trait,
              T: Trait,
              T: working_group::Trait<StorageWorkingGroupInstance>,
              T: working_group::Trait<DistributionWorkingGroupInstance>,
              T: membership::Trait,
              T::AccountId: CreateAccountId,
    }
    _{ }

    delete_storage_bucket {
        let lead_account_id = insert_storage_leader::<T>(STORAGE_WG_LEADER_ACCOUNT_ID);
        let storage_bucket_id = create_storage_bucket_helper::<T>(lead_account_id.clone());

    }: _ (RawOrigin::Signed(lead_account_id), storage_bucket_id)
    verify {

        assert!(!StorageBucketById::<T>::contains_key(&storage_bucket_id));
        assert_last_event::<T>(
            RawEvent::StorageBucketDeleted(storage_bucket_id).into()
        );
    }

    update_uploading_blocked_status {
        let lead_account_id = insert_storage_leader::<T>(STORAGE_WG_LEADER_ACCOUNT_ID);
        let new_status = true;

    }: _ (RawOrigin::Signed(lead_account_id), new_status)
    verify {

        assert_eq!(Module::<T>::uploading_blocked(), new_status);
        assert_last_event::<T>(
            RawEvent::UploadingBlockStatusUpdated(new_status).into()
        );
    }

    update_data_size_fee {
        let lead_account_id = insert_storage_leader::<T>(STORAGE_WG_LEADER_ACCOUNT_ID);
        let new_fee: BalanceOf<T> = 10u32.into();

    }: _ (RawOrigin::Signed(lead_account_id), new_fee)
    verify {

        assert_eq!(Module::<T>::data_object_per_mega_byte_fee(), new_fee);
        assert_last_event::<T>(
            RawEvent::DataObjectPerMegabyteFeeUpdated(new_fee).into()
        );
    }

    update_storage_buckets_per_bag_limit {
        let lead_account_id = insert_storage_leader::<T>(STORAGE_WG_LEADER_ACCOUNT_ID);
        let new_limit = 10u64;

    }: _ (RawOrigin::Signed(lead_account_id), new_limit)
    verify {

        assert_eq!(Module::<T>::storage_buckets_per_bag_limit(), new_limit);
        assert_last_event::<T>(
            RawEvent::StorageBucketsPerBagLimitUpdated(new_limit).into()
        );
    }

    update_storage_buckets_voucher_max_limits {
        let lead_account_id = insert_storage_leader::<T>(STORAGE_WG_LEADER_ACCOUNT_ID);
        let new_size = 20u64;
        let new_object_number = 10u64;

    }: _ (RawOrigin::Signed(lead_account_id), new_size, new_object_number)
    verify {

        assert_eq!(Module::<T>::voucher_max_objects_size_limit(), new_size);
        assert_eq!(Module::<T>::voucher_max_objects_number_limit(), new_object_number);
        assert_last_event::<T>(
            RawEvent::StorageBucketsVoucherMaxLimitsUpdated(new_size, new_object_number).into()
        );
    }

    update_number_of_storage_buckets_in_dynamic_bag_creation_policy {
        let lead_account_id = insert_storage_leader::<T>(STORAGE_WG_LEADER_ACCOUNT_ID);
        let dynamic_bag_type = DynamicBagType::Member;
        let new_number = 10u64;

    }: _ (RawOrigin::Signed(lead_account_id), dynamic_bag_type, new_number)
    verify {
        let creation_policy = Module::<T>::get_dynamic_bag_creation_policy(dynamic_bag_type);

        assert_eq!(creation_policy.number_of_storage_buckets, new_number);
        assert_last_event::<T>(
            RawEvent::NumberOfStorageBucketsInDynamicBagCreationPolicyUpdated(
                dynamic_bag_type,
                new_number
            ).into()
        );
    }

    update_blacklist {
        let i in 0 .. T::BlacklistSizeLimit::get().saturated_into();
        let j in 0 .. T::BlacklistSizeLimit::get().saturated_into();

        let lead_account_id = insert_storage_leader::<T>(STORAGE_WG_LEADER_ACCOUNT_ID);

        let add_cids = create_cids(i, 0u8);
        let remove_cids = create_cids(j, 1u8);

        // Add 'cids to remove' first.
        Module::<T>::update_blacklist(
            RawOrigin::Signed(lead_account_id.clone()).into(),
            remove_cids.clone(),
            Default::default(),
        )
        .unwrap();

    }: _ (RawOrigin::Signed(lead_account_id), remove_cids.clone(), add_cids.clone())
    verify {
        if let Some(cid) = add_cids.iter().next(){
            assert!(Blacklist::contains_key(&cid));
        }

        if let Some(cid) = remove_cids.iter().next(){
            assert!(!Blacklist::contains_key(&cid));
        }

        assert_last_event::<T>(
            RawEvent::UpdateBlacklist(
                remove_cids,
                add_cids
            ).into()
        );
    }

    create_storage_bucket {
        let lead_account_id = insert_storage_leader::<T>(STORAGE_WG_LEADER_ACCOUNT_ID);
        let storage_bucket_id = Module::<T>::next_storage_bucket_id();

    }: _ (RawOrigin::Signed(lead_account_id), None, false, 0, 0)
    verify {
        assert!(StorageBucketById::<T>::contains_key(&storage_bucket_id));
        assert_last_event::<T>(
            RawEvent::StorageBucketCreated(storage_bucket_id, None, false, 0, 0).into()
        );
    }

    update_storage_buckets_for_bag {
        let i in 1 .. T::StorageBucketsPerBagValueConstraint::get().max().saturated_into();
        let j in 1 .. T::StorageBucketsPerBagValueConstraint::get().max().saturated_into();

        let lead_account_id = insert_storage_leader::<T>(STORAGE_WG_LEADER_ACCOUNT_ID);
        let bag_id = BagId::<T>::Static(StaticBagId::Council);

        Module::<T>::update_storage_buckets_per_bag_limit(
            RawOrigin::Signed(lead_account_id.clone()).into(),
            T::StorageBucketsPerBagValueConstraint::get().max().saturated_into(),
        ).unwrap();

        let add_buckets = create_storage_buckets::<T>(lead_account_id.clone(), i);
        let remove_buckets = create_storage_buckets::<T>(lead_account_id.clone(), j);

        // Add 'buckets to remove' first.
        Module::<T>::update_storage_buckets_for_bag(
            RawOrigin::Signed(lead_account_id.clone()).into(),
            bag_id.clone(),
            remove_buckets.clone(),
            Default::default(),
        )
        .unwrap();

    }: _ (
        RawOrigin::Signed(lead_account_id),
        bag_id.clone(),
        add_buckets.clone(),
        remove_buckets.clone()
    )
    verify {
        let bag = Module::<T>::bag(bag_id.clone());
        assert_eq!(bag.stored_by, add_buckets);

        assert_last_event::<T>(
            RawEvent::StorageBucketsUpdatedForBag(bag_id, add_buckets, remove_buckets).into()
        );
    }

    cancel_storage_bucket_operator_invite {
        let lead_account_id = insert_storage_leader::<T>(STORAGE_WG_LEADER_ACCOUNT_ID);
        let (_, worker_id) =
            insert_storage_worker::<T>(lead_account_id.clone(), DEFAULT_STORAGE_WORKER_ACCOUNT_ID);
        let bucket_id =  create_storage_bucket_helper::<T>(lead_account_id.clone());

        Module::<T>::invite_storage_bucket_operator(
            RawOrigin::Signed(lead_account_id.clone()).into(),
            bucket_id,
            worker_id,
        )
        .unwrap();

        let bucket = Module::<T>::storage_bucket_by_id(bucket_id);
        assert_eq!(
            bucket.operator_status,
            StorageBucketOperatorStatus::<WorkerId<T>, T::AccountId>::InvitedStorageWorker(
                worker_id
            )
        );

    }: _ (RawOrigin::Signed(lead_account_id), bucket_id)
    verify {
        let bucket = Module::<T>::storage_bucket_by_id(bucket_id);

        assert_eq!(
            bucket.operator_status,
            StorageBucketOperatorStatus::<WorkerId<T>, T::AccountId>::Missing
        );

        assert_last_event::<T>(
            RawEvent::StorageBucketInvitationCancelled(bucket_id).into()
        );
    }

    invite_storage_bucket_operator {
        let lead_account_id = insert_storage_leader::<T>(STORAGE_WG_LEADER_ACCOUNT_ID);
        let (_, worker_id) =
            insert_storage_worker::<T>(lead_account_id.clone(), DEFAULT_STORAGE_WORKER_ACCOUNT_ID);
        let bucket_id =  create_storage_bucket_helper::<T>(lead_account_id.clone());

        let bucket = Module::<T>::storage_bucket_by_id(bucket_id);
        assert_eq!(
            bucket.operator_status,
            StorageBucketOperatorStatus::<WorkerId<T>, T::AccountId>::Missing
        );

    }: _ (RawOrigin::Signed(lead_account_id), bucket_id, worker_id)
    verify {
        let bucket = Module::<T>::storage_bucket_by_id(bucket_id);

        assert_eq!(
            bucket.operator_status,
            StorageBucketOperatorStatus::<WorkerId<T>, T::AccountId>::InvitedStorageWorker(
                worker_id
            )
        );

        assert_last_event::<T>(
            RawEvent::StorageBucketOperatorInvited(bucket_id, worker_id).into()
        );
    }

    remove_storage_bucket_operator {
        let lead_account_id = insert_storage_leader::<T>(STORAGE_WG_LEADER_ACCOUNT_ID);
        let (worker_account_id, worker_id) =
            insert_storage_worker::<T>(lead_account_id.clone(), DEFAULT_STORAGE_WORKER_ACCOUNT_ID);
        let bucket_id = create_storage_bucket_helper::<T>(lead_account_id.clone());

        set_storage_operator::<T>(
            lead_account_id.clone(),
            bucket_id,
            worker_id,
            worker_account_id.clone()
        );

        let bucket = Module::<T>::storage_bucket_by_id(bucket_id);
        assert_eq!(
            bucket.operator_status,
            StorageBucketOperatorStatus::<WorkerId<T>, T::AccountId>::StorageWorker(
                worker_id,
                worker_account_id,
            )
        );

    }: _ (RawOrigin::Signed(lead_account_id), bucket_id)
    verify {
        let bucket = Module::<T>::storage_bucket_by_id(bucket_id);

        assert_eq!(
            bucket.operator_status,
            StorageBucketOperatorStatus::<WorkerId<T>, T::AccountId>::Missing
        );

        assert_last_event::<T>(
            RawEvent::StorageBucketOperatorRemoved(bucket_id).into()
        );
    }

    update_storage_bucket_status {
        let lead_account_id = insert_storage_leader::<T>(STORAGE_WG_LEADER_ACCOUNT_ID);
        let bucket_id = create_storage_bucket_helper::<T>(lead_account_id.clone());
        let new_status = false;

        let bucket = Module::<T>::storage_bucket_by_id(bucket_id);
        assert!(bucket.accepting_new_bags);

    }: _ (RawOrigin::Signed(lead_account_id), bucket_id, new_status)
    verify {
        let bucket = Module::<T>::storage_bucket_by_id(bucket_id);

        assert!(!bucket.accepting_new_bags);
        assert_last_event::<T>(
            RawEvent::StorageBucketStatusUpdated(bucket_id, new_status).into()
        );
    }

    set_storage_bucket_voucher_limits {
        let lead_account_id = insert_storage_leader::<T>(STORAGE_WG_LEADER_ACCOUNT_ID);
        let bucket_id = create_storage_bucket_helper::<T>(lead_account_id.clone());

        let new_objects_size_limit: u64 = 10;
        let new_objects_number_limit: u64 = 10;

        Module::<T>::update_storage_buckets_voucher_max_limits(
            RawOrigin::Signed(lead_account_id.clone()).into(),
            new_objects_size_limit,
            new_objects_number_limit
        )
        .unwrap();

    }: _ (
        RawOrigin::Signed(lead_account_id),
        bucket_id,
        new_objects_size_limit,
        new_objects_number_limit
    )
    verify {
        let bucket = Module::<T>::storage_bucket_by_id(bucket_id);

        assert_eq!(bucket.voucher.size_limit, new_objects_size_limit);
        assert_eq!(bucket.voucher.objects_limit, new_objects_number_limit);

        assert_last_event::<T>(
            RawEvent::StorageBucketVoucherLimitsSet(
                bucket_id,
                new_objects_size_limit,
                new_objects_number_limit
            ).into()
        );
    }

    accept_storage_bucket_invitation {
        let lead_account_id = insert_storage_leader::<T>(STORAGE_WG_LEADER_ACCOUNT_ID);
        let (worker_account_id, worker_id) =
            insert_storage_worker::<T>(lead_account_id.clone(), SECOND_WORKER_ACCOUNT_ID);
        let bucket_id = create_storage_bucket_helper::<T>(lead_account_id.clone());

        Module::<T>::invite_storage_bucket_operator(
            RawOrigin::Signed(lead_account_id).into(),
            bucket_id,
            worker_id,
        )
        .unwrap();

        let bucket = Module::<T>::storage_bucket_by_id(bucket_id);
        assert_eq!(
            bucket.operator_status,
            StorageBucketOperatorStatus::<WorkerId<T>, T::AccountId>::InvitedStorageWorker(worker_id)
        );

    }: _ (
            RawOrigin::Signed(worker_account_id.clone()),
            worker_id,
            bucket_id,
            worker_account_id.clone()
    )
    verify {
        let bucket = Module::<T>::storage_bucket_by_id(bucket_id);

        assert_eq!(
            bucket.operator_status,
            StorageBucketOperatorStatus::<WorkerId<T>, T::AccountId>::StorageWorker(
                worker_id,
                worker_account_id.clone(),
            )
        );

        assert_last_event::<T>(
            RawEvent::StorageBucketInvitationAccepted(
                bucket_id,
                worker_id,
                worker_account_id
            ).into()
        );
    }

    set_storage_operator_metadata {
        let i in 1 .. MAX_BYTE_SIZE;

        let lead_account_id = insert_storage_leader::<T>(STORAGE_WG_LEADER_ACCOUNT_ID);
        let (worker_account_id, worker_id) =
            insert_storage_worker::<T>(lead_account_id.clone(), SECOND_WORKER_ACCOUNT_ID);
        let bucket_id = create_storage_bucket_helper::<T>(lead_account_id.clone());

        let metadata = iter::repeat(1).take(i as usize).collect::<Vec<_>>();

        set_storage_operator::<T>(
            lead_account_id,
            bucket_id,
            worker_id,
            worker_account_id.clone()
        );

    }: _ (
            RawOrigin::Signed(worker_account_id.clone()),
            worker_id,
            bucket_id,
            metadata.clone()
    )
    verify {
        assert_last_event::<T>(
            RawEvent::StorageOperatorMetadataSet(
                bucket_id,
                worker_id,
                metadata
            ).into()
        );
    }

    accept_pending_data_objects {
        let i in 1 .. OBJECT_COUNT;

        let lead_account_id = insert_storage_leader::<T>(STORAGE_WG_LEADER_ACCOUNT_ID);
        let (worker_account_id, worker_id) =
            insert_storage_worker::<T>(lead_account_id.clone(), SECOND_WORKER_ACCOUNT_ID);
        let bucket_id = create_storage_bucket_helper::<T>(lead_account_id.clone());
        let bag_id = BagId::<T>::Static(StaticBagId::Council);

        set_storage_operator::<T>(
            lead_account_id.clone(),
            bucket_id,
            worker_id,
            worker_account_id.clone()
        );

        Module::<T>::update_storage_buckets_per_bag_limit(
            RawOrigin::Signed(lead_account_id.clone()).into(),
            T::StorageBucketsPerBagValueConstraint::get().max().saturated_into(),
        ).unwrap();

        Module::<T>::update_storage_buckets_for_bag(
            RawOrigin::Signed(lead_account_id.clone()).into(),
            bag_id.clone(),
            BTreeSet::from_iter(vec![bucket_id]),
            Default::default(),
        )
        .unwrap();

        let new_objects_size_limit: u64 = (i * OBJECT_COUNT).saturated_into();
        let new_objects_number_limit: u64 = i.saturated_into();

        Module::<T>::update_storage_buckets_voucher_max_limits(
            RawOrigin::Signed(lead_account_id.clone()).into(),
            new_objects_size_limit,
            new_objects_number_limit
        )
        .unwrap();

        Module::<T>::set_storage_bucket_voucher_limits(
            RawOrigin::Signed(lead_account_id).into(),
            bucket_id,
            new_objects_size_limit,
            new_objects_number_limit
        )
        .unwrap();

        let object_parameters = create_cids(i, 0u8)
            .iter()
            .map(|cid| DataObjectCreationParameters{
                size: i.saturated_into(),
                ipfs_content_id: cid.clone(),
            })
            .collect::<Vec<_>>();

        let upload_parameters = UploadParameters::<T>{
            bag_id: bag_id.clone(),
            deletion_prize_source_account_id: worker_account_id.clone(),
            expected_data_size_fee: Default::default(),
            expected_data_object_deletion_prize: Default::default(),
            expected_dynamic_bag_deletion_prize: Default::default(),
            storage_buckets: Default::default(),
            distribution_buckets: Default::default(),
            object_creation_list: object_parameters
        };

        Module::<T>::sudo_upload_data_objects(
            RawOrigin::Root.into(),
            upload_parameters,
        )
        .unwrap();

        let data_objects = (0..i).into_iter()
            .map(|id| id.saturated_into())
            .collect::<BTreeSet<_>>();
    }: _ (
            RawOrigin::Signed(worker_account_id.clone()),
            worker_id,
            bucket_id,
            bag_id.clone(),
            data_objects.clone()
         )
    verify {
        assert_last_event::<T>(
            RawEvent::PendingDataObjectsAccepted(
                bucket_id,
                worker_id,
                bag_id,
                data_objects,
            ).into()
        );
    }

    create_distribution_bucket_family {
        let lead_account_id = insert_distribution_leader::<T>(DISTRIBUTION_WG_LEADER_ACCOUNT_ID);
        let family_id = Module::<T>::next_distribution_bucket_family_id();

    }: _ (RawOrigin::Signed(lead_account_id.clone()))
    verify {
        assert!(DistributionBucketFamilyById::<T>::contains_key(&family_id));
        assert_last_event::<T>(RawEvent::DistributionBucketFamilyCreated(family_id).into());
    }

    delete_distribution_bucket_family {
        let lead_account_id = insert_distribution_leader::<T>(DISTRIBUTION_WG_LEADER_ACCOUNT_ID);
        let family_id = create_distribution_family::<T>(lead_account_id.clone());

    }: _ (RawOrigin::Signed(lead_account_id.clone()), family_id)
    verify {
        assert!(!DistributionBucketFamilyById::<T>::contains_key(&family_id));
        assert_last_event::<T>(RawEvent::DistributionBucketFamilyDeleted(family_id).into());
    }

    create_distribution_bucket {
        let lead_account_id = insert_distribution_leader::<T>(DISTRIBUTION_WG_LEADER_ACCOUNT_ID);
        let family_id = create_distribution_family::<T>(lead_account_id.clone());
        let bucket_status = false;

        let bucket_idx: T::DistributionBucketIndex = Zero::zero();
        let bucket_id = Module::<T>::create_distribution_bucket_id(family_id, bucket_idx);
    }: _ (RawOrigin::Signed(lead_account_id.clone()), family_id, bucket_status)
    verify {
        assert!(DistributionBucketByFamilyIdById::<T>::contains_key(&family_id, &bucket_idx));
        assert_last_event::<T>(
            RawEvent::DistributionBucketCreated(family_id, bucket_status, bucket_id).into()
        );
    }

    update_distribution_bucket_status {
        let lead_account_id = insert_distribution_leader::<T>(DISTRIBUTION_WG_LEADER_ACCOUNT_ID);
        let bucket_id = create_distribution_bucket_helper::<T>(lead_account_id.clone());

        let new_bucket_status = false;
    }: _ (RawOrigin::Signed(lead_account_id.clone()), bucket_id.clone(), new_bucket_status)
    verify {
        let (family_id, bucket_idx) =
            (bucket_id.distribution_bucket_family_id, bucket_id.distribution_bucket_index);
        let bucket = Module::<T>::distribution_bucket_by_family_id_by_index(&family_id, &bucket_idx);

        assert_eq!(bucket.accepting_new_bags, new_bucket_status);
        assert_last_event::<T>(
            RawEvent::DistributionBucketStatusUpdated(bucket_id, new_bucket_status).into()
        );
    }

    delete_distribution_bucket {
        let lead_account_id = insert_distribution_leader::<T>(DISTRIBUTION_WG_LEADER_ACCOUNT_ID);
        let bucket_id = create_distribution_bucket_helper::<T>(lead_account_id.clone());

    }: _ (RawOrigin::Signed(lead_account_id.clone()), bucket_id.clone())
    verify {
        let (family_id, bucket_idx) =
            (bucket_id.distribution_bucket_family_id, bucket_id.distribution_bucket_index);
        assert!(!DistributionBucketByFamilyIdById::<T>::contains_key(&family_id, &bucket_idx));

        assert_last_event::<T>(
            RawEvent::DistributionBucketDeleted(bucket_id).into()
        );
    }

    update_distribution_buckets_for_bag {
        let i in 1 .. T::DistributionBucketsPerBagValueConstraint::get().max().saturated_into();
        let j in 1 .. T::DistributionBucketsPerBagValueConstraint::get().max().saturated_into();

        let lead_account_id = insert_distribution_leader::<T>(DISTRIBUTION_WG_LEADER_ACCOUNT_ID);
        let bag_id = BagId::<T>::Static(StaticBagId::Council);
        let family_id = create_distribution_family::<T>(lead_account_id.clone());

        let new_limit: u64 = T::DistributionBucketsPerBagValueConstraint::get().max().into();
        Module::<T>::update_distribution_buckets_per_bag_limit(
            RawOrigin::Signed(lead_account_id.clone()).into(),
            new_limit
        )
        .unwrap();

        let added_buckets = create_distribution_buckets::<T>(lead_account_id.clone(), family_id, i);
        let remove_buckets = create_distribution_buckets::<T>(lead_account_id.clone(), family_id, j);

        let added_bucket_idxs = added_buckets
            .iter()
            .map(|id| id.distribution_bucket_index)
            .collect::<BTreeSet<_>>();
        let remove_buckets_idxs = remove_buckets
            .iter()
            .map(|id| id.distribution_bucket_index)
            .collect::<BTreeSet<_>>();

        // Set 'buckets to remove' first.
        Module::<T>::update_distribution_buckets_for_bag(
            RawOrigin::Signed(lead_account_id.clone()).into(),
            bag_id.clone(),
            family_id,
            remove_buckets_idxs.clone(),
            BTreeSet::new(),
        )
        .unwrap();

    }: _ (
        RawOrigin::Signed(lead_account_id.clone()),
        bag_id.clone(),
        family_id,
        added_bucket_idxs.clone(),
        remove_buckets_idxs.clone()
    )
    verify {
        let bag = Module::<T>::bag(bag_id.clone());
        assert_eq!(bag.distributed_by, added_buckets);

        assert_last_event::<T>(
            RawEvent::DistributionBucketsUpdatedForBag(
                bag_id,
                family_id,
                added_bucket_idxs,
                remove_buckets_idxs,
            ).into()
        );
    }

    update_distribution_buckets_per_bag_limit {
        let lead_account_id = insert_distribution_leader::<T>(DISTRIBUTION_WG_LEADER_ACCOUNT_ID);
        let new_limit = 7;

    }: _ (RawOrigin::Signed(lead_account_id.clone()), new_limit)
    verify {
        assert_eq!(Module::<T>::distribution_buckets_per_bag_limit(), new_limit);

        assert_last_event::<T>(RawEvent::DistributionBucketsPerBagLimitUpdated(new_limit).into());
    }

    update_distribution_bucket_mode {
        let lead_account_id = insert_distribution_leader::<T>(DISTRIBUTION_WG_LEADER_ACCOUNT_ID);
        let bucket_id = create_distribution_bucket_helper::<T>(lead_account_id.clone());
        let distributing = true;

    }: _ (RawOrigin::Signed(lead_account_id.clone()), bucket_id.clone(), distributing)
    verify {
        let (family_id, bucket_idx) =
            (bucket_id.distribution_bucket_family_id, bucket_id.distribution_bucket_index);
        let bucket = Module::<T>::distribution_bucket_by_family_id_by_index(&family_id, &bucket_idx);

        assert_eq!(bucket.distributing, distributing);

        assert_last_event::<T>(
            RawEvent::DistributionBucketModeUpdated(bucket_id, distributing).into()
        );
    }

    update_families_in_dynamic_bag_creation_policy {
        let i in 2 .. DISTRIBUTION_BUCKET_FAMILIES_NUMBER;

        let lead_account_id = insert_distribution_leader::<T>(DISTRIBUTION_WG_LEADER_ACCOUNT_ID);
        let dynamic_bag_type = DynamicBagType::Member;
        let family_ids = create_distribution_bucket_families::<T>(lead_account_id.clone(), i);

        let fam_number = 1u32;
        let fam_policies = family_ids.iter()
            .cloned()
            .map(|id| (id, fam_number))
            .collect::<BTreeMap<_,_>>();

    }: _ (RawOrigin::Signed(lead_account_id.clone()), dynamic_bag_type, fam_policies.clone())
    verify {

        let policy = Module::<T>::dynamic_bag_creation_policy(dynamic_bag_type);
        assert_eq!(policy.families, fam_policies);

        assert_last_event::<T>(
            RawEvent::FamiliesInDynamicBagCreationPolicyUpdated(dynamic_bag_type, fam_policies).into()
        );
    }

    invite_distribution_bucket_operator {
        let lead_account_id = insert_distribution_leader::<T>(DISTRIBUTION_WG_LEADER_ACCOUNT_ID);
        let (_, worker_id) = insert_distribution_worker::<T>(
            lead_account_id.clone(),
            DEFAULT_DISTRIBUTION_WORKER_ACCOUNT_ID
        );
        let bucket_id = create_distribution_bucket_helper::<T>(lead_account_id.clone());

    }: _ (RawOrigin::Signed(lead_account_id.clone()), bucket_id.clone(), worker_id)
    verify {
        let (family_id, bucket_idx) =
            (bucket_id.distribution_bucket_family_id, bucket_id.distribution_bucket_index);
        let bucket = Module::<T>::distribution_bucket_by_family_id_by_index(&family_id, &bucket_idx);

        assert!(bucket.pending_invitations.contains(&worker_id));

        assert_last_event::<T>(
            RawEvent::DistributionBucketOperatorInvited(bucket_id, worker_id).into()
        );
    }

    cancel_distribution_bucket_operator_invite {
        let lead_account_id = insert_distribution_leader::<T>(DISTRIBUTION_WG_LEADER_ACCOUNT_ID);
        let (_, worker_id) = insert_distribution_worker::<T>(
            lead_account_id.clone(),
            DEFAULT_DISTRIBUTION_WORKER_ACCOUNT_ID
        );
        let bucket_id = create_distribution_bucket_helper::<T>(lead_account_id.clone());

        // Invite operator first.
        Module::<T>::invite_distribution_bucket_operator(
            RawOrigin::Signed(lead_account_id.clone()).into(),
            bucket_id.clone(),
            worker_id,
        )
        .unwrap();

        let (family_id, bucket_idx) =
            (bucket_id.distribution_bucket_family_id, bucket_id.distribution_bucket_index);

        let bucket = Module::<T>::distribution_bucket_by_family_id_by_index(&family_id, &bucket_idx);
        assert!(bucket.pending_invitations.contains(&worker_id));

    }: _ (RawOrigin::Signed(lead_account_id.clone()), bucket_id.clone(), worker_id)
    verify {
        let bucket = Module::<T>::distribution_bucket_by_family_id_by_index(&family_id, &bucket_idx);
        assert!(!bucket.pending_invitations.contains(&worker_id));

        assert_last_event::<T>(
            RawEvent::DistributionBucketInvitationCancelled(bucket_id, worker_id).into()
        );
    }

    remove_distribution_bucket_operator {
        let lead_account_id = insert_distribution_leader::<T>(DISTRIBUTION_WG_LEADER_ACCOUNT_ID);
        let (worker_account_id, worker_id) = insert_distribution_worker::<T>(
            lead_account_id.clone(),
            DEFAULT_DISTRIBUTION_WORKER_ACCOUNT_ID
        );
        let bucket_id = create_distribution_bucket_helper::<T>(lead_account_id.clone());

        // Invite operator.
        Module::<T>::invite_distribution_bucket_operator(
            RawOrigin::Signed(lead_account_id.clone()).into(),
            bucket_id.clone(),
            worker_id,
        )
        .unwrap();

        // Accept invitation.
        Module::<T>::accept_distribution_bucket_invitation(
            RawOrigin::Signed(worker_account_id).into(),
            worker_id,
            bucket_id.clone(),
        )
        .unwrap();

        let (family_id, bucket_idx) =
            (bucket_id.distribution_bucket_family_id, bucket_id.distribution_bucket_index);

        let bucket = Module::<T>::distribution_bucket_by_family_id_by_index(&family_id, &bucket_idx);
        assert!(bucket.operators.contains(&worker_id));

    }: _ (RawOrigin::Signed(lead_account_id.clone()), bucket_id.clone(), worker_id)
    verify {
        let bucket = Module::<T>::distribution_bucket_by_family_id_by_index(&family_id, &bucket_idx);
        assert!(!bucket.operators.contains(&worker_id));

        assert_last_event::<T>(
            RawEvent::DistributionBucketOperatorRemoved(bucket_id, worker_id).into()
        );
    }

    set_distribution_bucket_family_metadata {
        let i in 1 .. MAX_BYTE_SIZE;
        let metadata = iter::repeat(1).take(i as usize).collect::<Vec<_>>();

        let lead_account_id = insert_distribution_leader::<T>(DISTRIBUTION_WG_LEADER_ACCOUNT_ID);
        let family_id = create_distribution_family::<T>(lead_account_id.clone());


    }: _ (RawOrigin::Signed(lead_account_id.clone()), family_id, metadata.clone())
    verify {
        assert_last_event::<T>(
            RawEvent::DistributionBucketFamilyMetadataSet(family_id, metadata).into()
        );
    }

    accept_distribution_bucket_invitation {
        let lead_account_id = insert_distribution_leader::<T>(DISTRIBUTION_WG_LEADER_ACCOUNT_ID);
        let (worker_account_id, worker_id) = insert_distribution_worker::<T>(
            lead_account_id.clone(),
            DEFAULT_DISTRIBUTION_WORKER_ACCOUNT_ID
        );
        let bucket_id = create_distribution_bucket_helper::<T>(lead_account_id.clone());

        // Invite operator.
        Module::<T>::invite_distribution_bucket_operator(
            RawOrigin::Signed(lead_account_id).into(),
            bucket_id.clone(),
            worker_id,
        )
        .unwrap();

    }: _ (RawOrigin::Signed(worker_account_id.clone()), worker_id, bucket_id.clone())
    verify {
        let (family_id, bucket_idx) =
            (bucket_id.distribution_bucket_family_id, bucket_id.distribution_bucket_index);
        let bucket = Module::<T>::distribution_bucket_by_family_id_by_index(&family_id, &bucket_idx);
        assert!(bucket.operators.contains(&worker_id));

        assert_last_event::<T>(
            RawEvent::DistributionBucketInvitationAccepted(worker_id, bucket_id).into()
        );
    }

    set_distribution_operator_metadata {
        let i in 1 .. MAX_BYTE_SIZE;
        let metadata = iter::repeat(1).take(i as usize).collect::<Vec<_>>();

        let lead_account_id = insert_distribution_leader::<T>(DISTRIBUTION_WG_LEADER_ACCOUNT_ID);
        let (worker_account_id, worker_id) =
            insert_distribution_worker::<T>(
            lead_account_id.clone(),
            DEFAULT_DISTRIBUTION_WORKER_ACCOUNT_ID
        );
        let bucket_id = create_distribution_bucket_helper::<T>(lead_account_id.clone());

        // Invite operator.
        Module::<T>::invite_distribution_bucket_operator(
            RawOrigin::Signed(lead_account_id).into(),
            bucket_id.clone(),
            worker_id,
        )
        .unwrap();

        // Accept invitation.
        Module::<T>::accept_distribution_bucket_invitation(
            RawOrigin::Signed(worker_account_id.clone()).into(),
            worker_id,
            bucket_id.clone(),
        )
        .unwrap();

    }: _ (RawOrigin::Signed(worker_account_id), worker_id, bucket_id.clone(), metadata.clone())
    verify {

        assert_last_event::<T>(
            RawEvent::DistributionBucketMetadataSet(worker_id, bucket_id, metadata).into()
        );
    }

    storage_operator_remark {
        let i in 1 .. MAX_BYTE_SIZE;

        let lead_account_id = insert_storage_leader::<T>(STORAGE_WG_LEADER_ACCOUNT_ID);
        let (worker_account_id, worker_id) =
            insert_storage_worker::<T>(lead_account_id.clone(), SECOND_WORKER_ACCOUNT_ID);
        let bucket_id = create_storage_bucket_helper::<T>(lead_account_id.clone());

        let msg = iter::repeat(1).take(i as usize).collect::<Vec<_>>();

        set_storage_operator::<T>(
            lead_account_id,
            bucket_id,
            worker_id,
            worker_account_id.clone()
        );

    }: _ (
            RawOrigin::Signed(worker_account_id.clone()),
            worker_id,
            bucket_id,
            msg.clone()
    )
    verify {
        assert_last_event::<T>(
            RawEvent::StorageOperatorRemarked(
                worker_id,
                bucket_id,
                msg
            ).into()
        );
    }

    distribution_operator_remark {
        let i in 1 .. MAX_BYTE_SIZE;
        let msg = iter::repeat(1).take(i as usize).collect::<Vec<_>>();

        let lead_account_id = insert_distribution_leader::<T>(DISTRIBUTION_WG_LEADER_ACCOUNT_ID);
        let (worker_account_id, worker_id) =
            insert_distribution_worker::<T>(
            lead_account_id.clone(),
            DEFAULT_DISTRIBUTION_WORKER_ACCOUNT_ID
        );
        let bucket_id = create_distribution_bucket_helper::<T>(lead_account_id.clone());

        // Invite operator.
        Module::<T>::invite_distribution_bucket_operator(
            RawOrigin::Signed(lead_account_id).into(),
            bucket_id.clone(),
            worker_id,
        )
        .unwrap();

        // Accept invitation.
        Module::<T>::accept_distribution_bucket_invitation(
            RawOrigin::Signed(worker_account_id.clone()).into(),
            worker_id,
            bucket_id.clone(),
        )
        .unwrap();

    }: _ (RawOrigin::Signed(worker_account_id), worker_id, bucket_id.clone(), msg.clone())
    verify {

        assert_last_event::<T>(
            RawEvent::DistributionOperatorRemarked(worker_id, bucket_id, msg).into()
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tests::mocks::{build_test_externalities, Test};
    use frame_support::assert_ok;

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

    #[test]
    fn update_storage_buckets_per_bag_limit() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_update_storage_buckets_per_bag_limit::<Test>());
        });
    }

    #[test]
    fn update_storage_buckets_voucher_max_limits() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_update_storage_buckets_voucher_max_limits::<
                Test,
            >());
        });
    }

    #[test]
    fn update_number_of_storage_buckets_in_dynamic_bag_creation_policy() {
        build_test_externalities().execute_with(|| {
            assert_ok!(
                test_benchmark_update_number_of_storage_buckets_in_dynamic_bag_creation_policy::<
                    Test,
                >()
            );
        });
    }

    #[test]
    fn update_blacklist() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_update_blacklist::<Test>());
        });
    }

    #[test]
    fn create_storage_bucket() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_create_storage_bucket::<Test>());
        });
    }

    #[test]
    fn update_storage_buckets_for_bag() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_update_storage_buckets_for_bag::<Test>());
        });
    }

    #[test]
    fn cancel_storage_bucket_operator_invite() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_cancel_storage_bucket_operator_invite::<Test>());
        });
    }

    #[test]
    fn invite_storage_bucket_operator() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_invite_storage_bucket_operator::<Test>());
        });
    }

    #[test]
    fn remove_storage_bucket_operator() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_remove_storage_bucket_operator::<Test>());
        });
    }

    #[test]
    fn update_storage_bucket_status() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_update_storage_bucket_status::<Test>());
        });
    }

    #[test]
    fn set_storage_bucket_voucher_limits() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_set_storage_bucket_voucher_limits::<Test>());
        });
    }

    #[test]
    fn accept_storage_bucket_invitation() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_accept_storage_bucket_invitation::<Test>());
        });
    }

    #[test]
    fn set_storage_operator_metadata() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_set_storage_operator_metadata::<Test>());
        });
    }

    #[test]
    fn accept_pending_data_objects() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_accept_pending_data_objects::<Test>());
        });
    }

    #[test]
    fn create_distribution_bucket_family() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_create_distribution_bucket_family::<Test>());
        });
    }

    #[test]
    fn delete_distribution_bucket_family() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_delete_distribution_bucket_family::<Test>());
        });
    }

    #[test]
    fn create_distribution_bucket() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_create_distribution_bucket::<Test>());
        });
    }

    #[test]
    fn update_distribution_bucket_status() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_update_distribution_bucket_status::<Test>());
        });
    }

    #[test]
    fn delete_distribution_bucket() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_delete_distribution_bucket::<Test>());
        });
    }

    #[test]
    fn update_distribution_buckets_for_bag() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_update_distribution_buckets_for_bag::<Test>());
        });
    }

    #[test]
    fn update_distribution_buckets_per_bag_limit() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_update_distribution_buckets_per_bag_limit::<
                Test,
            >());
        });
    }

    #[test]
    fn update_distribution_bucket_mode() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_update_distribution_bucket_mode::<Test>());
        });
    }

    #[test]
    fn update_families_in_dynamic_bag_creation_policy() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_update_families_in_dynamic_bag_creation_policy::<Test>());
        });
    }

    #[test]
    fn invite_distribution_bucket_operator() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_invite_distribution_bucket_operator::<Test>());
        });
    }

    #[test]
    fn cancel_distribution_bucket_operator_invite() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_cancel_distribution_bucket_operator_invite::<
                Test,
            >());
        });
    }

    #[test]
    fn remove_distribution_bucket_operator() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_remove_distribution_bucket_operator::<Test>());
        });
    }

    #[test]
    fn set_distribution_bucket_family_metadata() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_set_distribution_bucket_family_metadata::<Test>());
        });
    }

    #[test]
    fn accept_distribution_bucket_invitation() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_accept_distribution_bucket_invitation::<Test>());
        });
    }

    #[test]
    fn set_distribution_operator_metadata() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_set_distribution_operator_metadata::<Test>());
        });
    }

    #[test]
    fn storage_operator_remark() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_storage_operator_remark::<Test>());
        });
    }

    #[test]
    fn distribution_operator_remark() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_distribution_operator_remark::<Test>());
        });
    }
}
