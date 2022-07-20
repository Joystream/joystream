#![cfg(feature = "runtime-benchmarks")]

mod benchmarking;

use crate::permissions::*;
use crate::types::{
    ChannelActionPermission, ChannelAgentPermissions, ChannelCreationParameters, StorageAssets,
};
use crate::{Config, Module as Pallet};
use balances::Pallet as Balances;
use common::MembershipTypes;
use frame_benchmarking::account;
use frame_support::storage::{StorageMap, StorageValue};
use frame_support::traits::{Currency, Get, Instance};
use frame_system::EventRecord;
use frame_system::Pallet as System;
use frame_system::RawOrigin;
use membership::Module as Membership;
use sp_arithmetic::traits::One;
use sp_runtime::DispatchError;
use sp_runtime::SaturatedConversion;
use sp_std::collections::btree_map::BTreeMap;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::convert::TryInto;
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

// Content working group instance alias.
pub type ContentWorkingGroupInstance = working_group::Instance3;

const fn gen_array_u128<const N: usize>(init: u128) -> [u128; N] {
    let mut res = [0; N];

    let mut i = 0;
    while i < N as u128 {
        res[i as usize] = init + i;
        i += 1;
    }

    res
}

pub const MEMBER_IDS_INIT: u128 = 500;
pub const MAX_MEMBER_IDS: usize = 100;

pub const MEMBER_IDS: [u128; MAX_MEMBER_IDS] = gen_array_u128::<MAX_MEMBER_IDS>(MEMBER_IDS_INIT);

pub const COLABORATOR_IDS_INIT: u128 = 700;
pub const MAX_COLABORATOR_IDS: usize = 100;

pub const COLABORATOR_IDS: [u128; MAX_COLABORATOR_IDS] =
    gen_array_u128::<MAX_COLABORATOR_IDS>(COLABORATOR_IDS_INIT);

pub const CURATOR_IDS_INIT: u128 = 800;
pub const MAX_CURATOR_IDS: usize = 100;

pub const CURATOR_IDS: [u128; MAX_CURATOR_IDS] =
    gen_array_u128::<MAX_CURATOR_IDS>(CURATOR_IDS_INIT);

const DEFAULT_MEMBER_ID: u128 = MEMBER_IDS[1];
const STORAGE_WG_LEADER_ACCOUNT_ID: u128 = 100001; // must match the mocks
const CONTENT_WG_LEADER_ACCOUNT_ID: u128 = 100002;
const DISTRIBUTION_WG_LEADER_ACCOUNT_ID: u128 = 100004; // must match the mocks
const MAX_BYTES: u32 = 50000;

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

const CONTENT_MODERATION_ACTIONS: [ContentModerationAction; 15] = [
    ContentModerationAction::HideVideo,
    ContentModerationAction::HideChannel,
    ContentModerationAction::ChangeChannelFeatureStatus(
        PausableChannelFeature::ChannelFundsTransfer,
    ),
    ContentModerationAction::ChangeChannelFeatureStatus(PausableChannelFeature::CreatorCashout),
    ContentModerationAction::ChangeChannelFeatureStatus(PausableChannelFeature::VideoNftIssuance),
    ContentModerationAction::ChangeChannelFeatureStatus(PausableChannelFeature::VideoCreation),
    ContentModerationAction::ChangeChannelFeatureStatus(PausableChannelFeature::VideoUpdate),
    ContentModerationAction::ChangeChannelFeatureStatus(PausableChannelFeature::ChannelUpdate),
    ContentModerationAction::ChangeChannelFeatureStatus(
        PausableChannelFeature::CreatorTokenIssuance,
    ),
    ContentModerationAction::DeleteVideo,
    ContentModerationAction::DeleteChannel,
    ContentModerationAction::DeleteVideoAssets(true),
    ContentModerationAction::DeleteVideoAssets(false),
    ContentModerationAction::DeleteNonVideoChannelAssets,
    ContentModerationAction::UpdateChannelNftLimits,
];

pub trait CreateAccountId {
    fn create_account_id(id: u128) -> Self;
}

impl CreateAccountId for u128 {
    fn create_account_id(id: u128) -> Self {
        id
    }
}

const SEED: u32 = 0;

impl CreateAccountId for sp_core::crypto::AccountId32 {
    fn create_account_id(id: u128) -> Self {
        account::<Self>("default", id.try_into().unwrap(), SEED)
    }
}

fn get_byte(num: u128, byte_number: u8) -> u8 {
    ((num & (0xff << (8 * byte_number))) >> (8 * byte_number)) as u8
}

// Method to generate a distintic valid handle
// for a membership. For each index.
fn handle_from_id<T: membership::Config>(id: u128) -> Vec<u8> {
    let min_handle_length = 1;

    let mut handle = vec![];

    for i in 0..16 {
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

fn insert_content_leader<T>() -> T::AccountId
where
    T::AccountId: CreateAccountId,
    T: Config
        + membership::Config
        + working_group::Config<ContentWorkingGroupInstance>
        + balances::Config,
{
    insert_leader::<T, ContentWorkingGroupInstance>(CONTENT_WG_LEADER_ACCOUNT_ID)
}

fn insert_leader<T, I>(id: u128) -> T::AccountId
where
    T::AccountId: CreateAccountId,
    T: Config + membership::Config + working_group::Config<I> + balances::Config,
    I: Instance,
{
    let (caller_id, member_id) = member_funded_account::<T>(id);

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

fn insert_curator<T>(id: u128) -> T::CuratorId
where
    T::AccountId: CreateAccountId,
    T: Config
        + membership::Config
        + working_group::Config<ContentWorkingGroupInstance>
        + balances::Config,
{
    insert_worker::<T, ContentWorkingGroupInstance>(
        T::AccountId::create_account_id(CONTENT_WG_LEADER_ACCOUNT_ID),
        id,
    )
    .saturated_into::<u64>()
    .saturated_into()
}

fn insert_worker<T, I>(leader_acc: T::AccountId, id: u128) -> <T as MembershipTypes>::ActorId
where
    T::AccountId: CreateAccountId,
    T: Config + membership::Config + working_group::Config<I> + balances::Config,
    I: Instance,
{
    let worker_id = working_group::NextWorkerId::<T, I>::get();

    let (account_id, member_id) = member_funded_account::<T>(id);

    let (opening_id, application_id) = add_and_apply_opening::<T, I>(
        &T::Origin::from(RawOrigin::Signed(leader_acc.clone())),
        &account_id,
        &member_id,
        &OpeningType::Regular,
    );

    let successful_application_ids = BTreeSet::<ApplicationId>::from_iter(vec![application_id]);

    working_group::Module::<T, I>::fill_opening(
        RawOrigin::Signed(leader_acc).into(),
        opening_id,
        successful_application_ids,
    )
    .unwrap();

    assert!(WorkerById::<T, I>::contains_key(worker_id));

    worker_id
}

//defines initial balance
fn initial_balance<T: balances::Config>() -> T::Balance {
    1000000u32.into()
}

fn member_funded_account<T: Config + membership::Config + balances::Config>(
    id: u128,
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

fn create_distribution_buckets<T>(
    lead_account_id: T::AccountId,
    distribution_bucket_family_id: T::DistributionBucketFamilyId,
    bucket_number: u32,
) -> BTreeSet<DistributionBucketId<T>>
where
    T: Config + storage::Config,
{
    let storage_wg_leader_signed = RawOrigin::Signed(lead_account_id);
    (0..bucket_number)
        .map(|_| {
            let distribution_bucket_index =
                Storage::<T>::distribution_bucket_family_by_id(distribution_bucket_family_id)
                    .next_distribution_bucket_index;

            Storage::<T>::create_distribution_bucket(
                T::Origin::from(storage_wg_leader_signed.clone()),
                distribution_bucket_family_id,
                true,
            )
            .unwrap();

            DistributionBucketId::<T> {
                distribution_bucket_family_id,
                distribution_bucket_index,
            }
        })
        .collect::<BTreeSet<_>>()
}

fn create_distribution_bucket_with_family<T>(
    lead_account_id: T::AccountId,
    bucket_number: u32,
) -> (
    T::DistributionBucketFamilyId,
    BTreeSet<DistributionBucketId<T>>,
)
where
    T: Config + storage::Config,
{
    let distribution_wg_leader_signed = RawOrigin::Signed(lead_account_id.clone());

    let db_family_id = Storage::<T>::next_distribution_bucket_family_id();

    Storage::<T>::create_distribution_bucket_family(T::Origin::from(distribution_wg_leader_signed))
        .unwrap();

    (
        db_family_id,
        create_distribution_buckets::<T>(lead_account_id, db_family_id, bucket_number),
    )
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

fn generate_channel_creation_params<T>(
    storage_wg_lead_account_id: T::AccountId,
    distribution_wg_lead_account_id: T::AccountId,
    colaborator_num: u32,
    storage_bucket_num: u32,
    distribution_bucket_num: u32,
    objects_num: u32,
    max_obj_size: u64,
) -> ChannelCreationParameters<T>
where
    T: Config
        + storage::Config
        + membership::Config
        + balances::Config
        + working_group::Config<StorageWorkingGroupInstance>
        + working_group::Config<DistributionWorkingGroupInstance>,
    T::AccountId: CreateAccountId,
{
    let permissions = BTreeSet::from_iter(CHANNEL_AGENT_PERMISSIONS);
    let total_objs_size: u64 = max_obj_size.saturating_mul(objects_num.into());
    let metadata = vec![0u8].repeat(MAX_BYTES as usize);

    set_dyn_bag_creation_storage_bucket_numbers::<T>(
        storage_wg_lead_account_id.clone(),
        storage_bucket_num.into(),
        DynamicBagType::Channel,
    );

    set_storage_buckets_voucher_max_limits::<T>(
        storage_wg_lead_account_id.clone(),
        total_objs_size,
        objects_num.into(),
    );

    let assets = StorageAssets::<T> {
        expected_data_size_fee: Storage::<T>::data_object_per_mega_byte_fee(),
        object_creation_list: create_data_object_candidates_helper(
            1,
            objects_num.into(),
            max_obj_size,
        ),
    };

    let collaborators = (0..colaborator_num)
        .map(|id| {
            let (_account_id, member_id) = member_funded_account::<T>(COLABORATOR_IDS[id as usize]);
            (member_id, permissions.clone())
        })
        .collect::<BTreeMap<_, _>>();

    let storage_buckets = (0..storage_bucket_num)
        .map(|id| {
            create_storage_bucket::<T>(
                storage_wg_lead_account_id.clone(),
                true,
                total_objs_size,
                objects_num.into(),
            );
            id.saturated_into()
        })
        .collect::<BTreeSet<_>>();

    let (db_family_id, distribution_buckets) = create_distribution_bucket_with_family::<T>(
        distribution_wg_lead_account_id.clone(),
        distribution_bucket_num,
    );

    let distribution_buckets_families_policy =
        BTreeMap::from_iter([(db_family_id, distribution_buckets.len() as u32)]);

    update_families_in_dynamic_bag_creation_policy::<T>(
        distribution_wg_lead_account_id,
        DynamicBagType::Channel,
        distribution_buckets_families_policy,
    );

    let expected_data_object_state_bloat_bond = Storage::<T>::data_object_state_bloat_bond_value();

    let expected_channel_state_bloat_bond = Pallet::<T>::channel_state_bloat_bond_value();

    ChannelCreationParameters::<T> {
        assets: Some(assets),
        meta: Some(metadata),
        collaborators,
        storage_buckets,
        distribution_buckets,
        expected_data_object_state_bloat_bond,
        expected_channel_state_bloat_bond,
    }
}

fn assert_last_event<T: Config>(generic_event: <T as Config>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Config>::Event = generic_event.into();
    // compare to the last event record
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

fn worst_case_content_moderation_actions_set() -> BTreeSet<ContentModerationAction> {
    CONTENT_MODERATION_ACTIONS.iter().cloned().collect()
}

fn worst_case_channel_agent_permissions() -> ChannelAgentPermissions {
    CHANNEL_AGENT_PERMISSIONS.iter().cloned().collect()
}

fn setup_worst_case_curator_group_with_curators<T>(
    curators_len: u32,
) -> Result<T::CuratorGroupId, DispatchError>
where
    T::AccountId: CreateAccountId,
    T: Config
        + membership::Config
        + working_group::Config<ContentWorkingGroupInstance>
        + balances::Config,
{
    let permissions_by_level: ModerationPermissionsByLevel<T> = (0
        ..T::MaxKeysPerCuratorGroupPermissionsByLevelMap::get())
        .map(|i| {
            (
                i.saturated_into(),
                worst_case_content_moderation_actions_set(),
            )
        })
        .collect();

    let group_id = Pallet::<T>::next_curator_group_id();

    Pallet::<T>::create_curator_group(
        RawOrigin::Signed(T::AccountId::create_account_id(
            CONTENT_WG_LEADER_ACCOUNT_ID,
        ))
        .into(),
        true,
        permissions_by_level,
    )?;

    for c in CURATOR_IDS.iter().take(curators_len as usize) {
        let curator_id = insert_curator::<T>(*c);
        Pallet::<T>::add_curator_to_group(
            RawOrigin::Signed(T::AccountId::create_account_id(
                CONTENT_WG_LEADER_ACCOUNT_ID,
            ))
            .into(),
            group_id,
            curator_id.saturated_into::<u64>().saturated_into(),
            worst_case_channel_agent_permissions(),
        )?;
    }

    Ok(group_id)
}
