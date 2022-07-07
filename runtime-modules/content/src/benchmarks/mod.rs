#[cfg(feature = "runtime-benchmarks")]
mod channels;

use crate::types::{ChannelActionPermission, ChannelAgentPermissions};
use crate::Config;
use balances::Pallet as Balances;
use frame_benchmarking::account;
use frame_support::storage::{StorageMap, StorageValue};
use frame_support::traits::{Currency, Get, Instance};
use frame_system::RawOrigin;
use membership::Module as Membership;
use sp_arithmetic::traits::One;
use sp_runtime::SaturatedConversion;
use sp_std::collections::btree_map::BTreeMap;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::convert::TryInto;
use sp_std::iter;
use sp_std::iter::repeat;
use sp_std::iter::FromIterator;
use sp_std::vec;
use sp_std::vec::Vec;
use storage::{
    DataObjectCreationParameters, DistributionBucketId, DynamicBagType, Module as Storage,
};
use working_group::{
    ApplicationById, ApplicationId, ApplyOnOpeningParameters, OpeningById, OpeningId, OpeningType,
    StakeParameters, StakePolicy, WorkerById,
};

// The storage working group instance alias.
pub type StorageWorkingGroupInstance = working_group::Instance2;

// The distribution working group instance alias.
pub type DistributionWorkingGroupInstance = working_group::Instance9;

// pub type ContentWorkingGroupInstance = working_group::Instance3;

const fn gen_array_u64<const N: usize>(init: u64) -> [u64; N] {
    let mut res = [0; N];

    let mut i = 0;
    while i < N as u64 {
        res[i as usize] = init + i;
        i += 1;
    }

    res
}

pub const MEMBER_IDS_INIT: u64 = 500;
pub const MAX_MEMBER_IDS: usize = 100;

pub const MEMBER_IDS: [u64; MAX_MEMBER_IDS] = gen_array_u64::<MAX_MEMBER_IDS>(MEMBER_IDS_INIT);

pub const COLABORATOR_IDS_INIT: u64 = 700;
pub const MAX_COLABORATOR_IDS: usize = 100;

pub const COLABORATOR_IDS: [u64; MAX_COLABORATOR_IDS] =
    gen_array_u64::<MAX_COLABORATOR_IDS>(COLABORATOR_IDS_INIT);

const DEFAULT_MEMBER_ID: u64 = MEMBER_IDS[1];
const STORAGE_WG_LEADER_ACCOUNT_ID: u128 = 100001;
const DISTRIBUTION_WG_LEADER_ACCOUNT_ID: u128 = 100004;
const MAX_BYTES: u32 = 50000;
const MAX_OBJ_NUMBER: u32 = 100;

const CHANNEL_AGENT_PERMISSIONS: [ChannelActionPermission; 13] = [
    ChannelActionPermission::AddVideo,
    ChannelActionPermission::AgentRemark,
    ChannelActionPermission::ClaimChannelReward,
    ChannelActionPermission::DeleteChannel,
    ChannelActionPermission::DeleteVideo,
    ChannelActionPermission::ManageChannelCollaborators,
    ChannelActionPermission::ManageNonVideoChannelAssets,
    ChannelActionPermission::ManageVideoAssets,
    ChannelActionPermission::ManageVideoNfts,
    ChannelActionPermission::TransferChannel,
    ChannelActionPermission::UpdateChannelMetadata,
    ChannelActionPermission::UpdateVideoMetadata,
    ChannelActionPermission::WithdrawFromChannelBalance,
];

pub trait CreateAccountId {
    fn create_account_id(id: u64) -> Self;
}

impl CreateAccountId for u128 {
    fn create_account_id(id: u64) -> Self {
        id.into()
    }
}

impl CreateAccountId for u64 {
    fn create_account_id(id: u64) -> Self {
        id
    }
}

const SEED: u32 = 0;

impl CreateAccountId for sp_core::crypto::AccountId32 {
    fn create_account_id(id: u64) -> Self {
        account::<Self>("default", id.try_into().unwrap(), SEED)
    }
}

fn get_permissions(i: u64) -> ChannelAgentPermissions {
    iter::repeat(())
        .take(i.saturated_into())
        .map(|_| CHANNEL_AGENT_PERMISSIONS[i as usize])
        .collect::<BTreeSet<_>>()
}

fn rescale_constraints<T: Config>(new_min: u64, new_max: u64, value: u32) -> Option<u32> {
    let old_min = 0f64;
    let old_max = 100f64;
    let value = value as f64;
    let new_min: f64 = new_min as f64;
    let new_max: f64 = new_max as f64;

    if value < old_min || value > old_max || new_max < new_min {
        return None;
    }

    let new_value: u32 =
        ((new_max - new_min) / (old_max - old_min) * (value - old_max) + new_max) as u32;

    if new_value < new_min as u32 || new_value > new_max as u32 {
        return None;
    }

    Some(new_value)
}

fn get_byte(num: u64, byte_number: u8) -> u8 {
    ((num & (0xff << (8 * byte_number))) >> (8 * byte_number)) as u8
}

// Method to generate a distintic valid handle
// for a membership. For each index.
fn handle_from_id<T: membership::Config>(id: u64) -> Vec<u8> {
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

fn apply_on_opening_helper<T: Config + working_group::Config<I>, I: Instance>(
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
                stake: <T as working_group::Config<I>>::MinimumApplicationStake::get(),
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

fn add_and_apply_opening<T: Config + working_group::Config<I>, I: Instance>(
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

fn add_opening_helper<T: Config + working_group::Config<I>, I: Instance>(
    add_opening_origin: &T::Origin,
    job_opening_type: &OpeningType,
) -> OpeningId {
    working_group::Module::<T, I>::add_opening(
        add_opening_origin.clone(),
        vec![],
        *job_opening_type,
        StakePolicy {
            stake_amount: <T as working_group::Config<I>>::MinimumApplicationStake::get(),
            leaving_unstaking_period: <T as working_group::Config<I>>::MinUnstakingPeriodLimit::get(
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

fn insert_storage_leader<T>() -> T::AccountId
where
    T::AccountId: CreateAccountId,
    T: Config
        + membership::Config
        + working_group::Config<StorageWorkingGroupInstance>
        + balances::Config,
{
    insert_leader::<T, StorageWorkingGroupInstance>(STORAGE_WG_LEADER_ACCOUNT_ID)
}

fn insert_distribution_leader<T>() -> T::AccountId
where
    T::AccountId: CreateAccountId,
    T: Config
        + membership::Config
        + working_group::Config<DistributionWorkingGroupInstance>
        + balances::Config,
{
    insert_leader::<T, DistributionWorkingGroupInstance>(DISTRIBUTION_WG_LEADER_ACCOUNT_ID)
}

fn insert_leader<T, I>(id: u128) -> T::AccountId
where
    T::AccountId: CreateAccountId,
    T: Config + membership::Config + working_group::Config<I> + balances::Config,
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

//defines initial balance
fn initial_balance<T: balances::Config>() -> T::Balance {
    1000000u32.into()
}

fn member_funded_account<T: Config + membership::Config + balances::Config>(
    id: u64,
) -> (T::AccountId, T::MemberId)
where
    T::AccountId: CreateAccountId,
{
    let account_id = T::AccountId::create_account_id(id);

    let handle = handle_from_id::<T>(id);

    // Give balance for buying membership
    let _ = Balances::<T>::make_free_balance_be(&account_id, initial_balance::<T>());

    let params = membership::BuyMembershipParameters {
        root_account: account_id.clone(),
        controller_account: account_id.clone(),
        handle: Some(handle),
        metadata: Vec::new(),
        referrer_id: None,
    };

    let member_id: T::MemberId = T::MemberId::saturated_from(id);
    <membership::NextMemberId<T>>::put(member_id);
    let new_member_id = Membership::<T>::members_created();

    Membership::<T>::buy_membership(RawOrigin::Signed(account_id.clone()).into(), params).unwrap();

    let _ = Balances::<T>::make_free_balance_be(&account_id, initial_balance::<T>());

    Membership::<T>::add_staking_account_candidate(
        RawOrigin::Signed(account_id.clone()).into(),
        new_member_id,
    )
    .unwrap();

    Membership::<T>::confirm_staking_account(
        RawOrigin::Signed(account_id.clone()).into(),
        new_member_id,
        account_id.clone(),
    )
    .unwrap();

    (account_id, new_member_id)
}

fn set_dyn_bag_creation_storage_bucket_numbers<T>(
    lead_account_id: T::AccountId,
    storage_bucket_number: u64,
    bag_type: DynamicBagType,
) where
    T: Config + storage::Config,
{
    let storage_wg_leader_signed = RawOrigin::Signed(lead_account_id);
    Storage::<T>::update_number_of_storage_buckets_in_dynamic_bag_creation_policy(
        T::Origin::from(storage_wg_leader_signed),
        bag_type,
        storage_bucket_number,
    )
    .unwrap();
}

fn update_families_in_dynamic_bag_creation_policy<T>(
    lead_account_id: T::AccountId,
    bag_type: DynamicBagType,
    families: BTreeMap<T::DistributionBucketFamilyId, u32>,
) where
    T: Config + storage::Config,
{
    let storage_wg_leader_signed = RawOrigin::Signed(lead_account_id);
    Storage::<T>::update_families_in_dynamic_bag_creation_policy(
        T::Origin::from(storage_wg_leader_signed),
        bag_type,
        families,
    )
    .unwrap();
}

fn set_storage_buckets_voucher_max_limits<T>(
    lead_account_id: T::AccountId,
    voucher_objects_size_limit: u64,
    voucher_objs_number_limit: u64,
) where
    T: Config + storage::Config,
{
    let storage_wg_leader_signed = RawOrigin::Signed(lead_account_id);
    Storage::<T>::update_storage_buckets_voucher_max_limits(
        T::Origin::from(storage_wg_leader_signed),
        voucher_objects_size_limit,
        voucher_objs_number_limit,
    )
    .unwrap();
}

fn create_storage_bucket<T>(
    lead_account_id: T::AccountId,
    accepting_bags: bool,
    bucket_objs_size_limit: u64,
    bucket_objs_number_limit: u64,
) where
    T: Config + storage::Config,
{
    // Set storage bucket in the dynamic bag creation policy to zero.
    let storage_wg_leader_signed = RawOrigin::Signed(lead_account_id);
    Storage::<T>::create_storage_bucket(
        T::Origin::from(storage_wg_leader_signed),
        None,
        accepting_bags,
        bucket_objs_size_limit,
        bucket_objs_number_limit,
    )
    .unwrap();
}

// fn create_distribution_family<T>(
//     lead_account_id: T::AccountId,
// ) -> T::DistributionBucketFamilyId
// where T: Config + storage::Config{
//     let fam_id = Storage::<T>::next_distribution_bucket_family_id();

//     Storage::<T>::create_distribution_bucket_family(RawOrigin::Signed(lead_account_id).into())
//         .unwrap();

//     fam_id
// }

fn create_distribution_bucket_family_with_buckets<T>(
    lead_account_id: T::AccountId,
    bucket_number: u32,
) -> (
    T::DistributionBucketFamilyId,
    BTreeSet<DistributionBucketId<T>>,
)
where
    T: Config + storage::Config,
{
    let storage_wg_leader_signed = RawOrigin::Signed(lead_account_id);
    let family_id = Storage::<T>::next_distribution_bucket_family_id();
    // let family_number = Storage::<T>::distribution_bucket_family_number();

    Storage::<T>::create_distribution_bucket_family(T::Origin::from(
        storage_wg_leader_signed.clone(),
    ))
    .unwrap();

    let bucket_ids = repeat(family_id)
        .take(bucket_number as usize)
        .map(|distribution_bucket_family_id| {
            let distribution_bucket_index =
                Storage::<T>::distribution_bucket_family_by_id(distribution_bucket_family_id)
                    .next_distribution_bucket_index;
            Storage::<T>::create_distribution_bucket(
                T::Origin::from(storage_wg_leader_signed.clone()),
                family_id,
                true,
            )
            .unwrap();

            DistributionBucketId::<T> {
                distribution_bucket_family_id,
                distribution_bucket_index,
            }
        })
        .collect::<BTreeSet<_>>();

    (family_id, bucket_ids)
}

//creates max_distribution_bucket and spread them across max_distribution_bucket_family
fn create_distribution_bucket_with_family_adjusted<T>(
    lead_account_id: T::AccountId,
    bucket_family_number: u32,
    bucket_number: u32,
) -> BTreeMap<T::DistributionBucketFamilyId, BTreeSet<DistributionBucketId<T>>>
where
    T: Config + storage::Config,
{
    let db_per_family = bucket_number / bucket_family_number;
    let db_per_family = match db_per_family {
        0 => 1,
        _ => db_per_family,
    };

    repeat(db_per_family)
        .take(bucket_family_number as usize)
        .map(|db_per_family_number| {
            create_distribution_bucket_family_with_buckets::<T>(
                lead_account_id.clone(),
                db_per_family_number,
            )
        })
        .collect::<BTreeMap<_, _>>()
}

pub fn create_data_object_candidates_helper(
    starting_ipfs_index: u8,
    number: u64,
    size: u64,
) -> Vec<DataObjectCreationParameters> {
    let range = (starting_ipfs_index as u64)..((starting_ipfs_index as u64) + number);

    range
        .into_iter()
        .map(|_| DataObjectCreationParameters {
            size,
            ipfs_content_id: vec![1u8],
        })
        .collect()
}
