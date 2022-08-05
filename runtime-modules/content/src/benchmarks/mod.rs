#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;
use crate::{
    permissions::PausableChannelFeature,
    types::{
        ChannelActionPermission, ChannelAgentPermissions, ChannelBagWitness,
        ChannelCreationParameters, ChannelOwner, StorageAssets,
    },
    Config, ContentActor, ContentModerationAction, ModerationPermissionsByLevel, Module as Pallet,
};
use balances::Pallet as Balances;
use common::MembershipTypes;
use frame_benchmarking::account;
use frame_support::{
    dispatch::DispatchError,
    storage::{StorageDoubleMap, StorageMap, StorageValue},
    traits::{Currency, Get, Instance, OnFinalize, OnInitialize},
};
use frame_system::{EventRecord, Pallet as System, RawOrigin};
use membership::Module as Membership;
use project_token::types::{
    PaymentWithVestingOf, SingleDataObjectUploadParams, TokenAllocationOf, TokenBalanceOf,
    TokenIssuanceParametersOf, TokenSaleParamsOf, TransferPolicyParamsOf, Transfers,
    TransfersWithVestingOf, VestingSchedule, VestingScheduleParamsOf, VestingSource,
    WhitelistParamsOf, YearlyRate,
};
use project_token::AccountInfoByTokenAndMember;
use sp_arithmetic::traits::One;
use sp_runtime::traits::Hash;
use sp_runtime::Permill;
use sp_runtime::SaturatedConversion;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::{
    cmp::min, collections::btree_map::BTreeMap, convert::TryInto, iter::FromIterator, vec, vec::Vec,
};
use storage::{
    DataObjectCreationParameters, DataObjectStorage, DistributionBucketId, DynamicBagType,
    Module as Storage,
};
use working_group::{
    ApplicationById, ApplicationId, ApplyOnOpeningParameters, OpeningById, OpeningId, OpeningType,
    StakeParameters, StakePolicy, WorkerById, WorkerId,
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

pub const CURATOR_IDS_INIT: u128 = 600;
pub const MAX_CURATOR_IDS: usize = 100;

pub const CURATOR_IDS: [u128; MAX_CURATOR_IDS] =
    gen_array_u128::<MAX_CURATOR_IDS>(CURATOR_IDS_INIT);

pub const COLABORATOR_IDS_INIT: u128 = 700;
pub const MAX_COLABORATOR_IDS: usize = 100;

pub const COLABORATOR_IDS: [u128; MAX_COLABORATOR_IDS] =
    gen_array_u128::<MAX_COLABORATOR_IDS>(COLABORATOR_IDS_INIT);

const STORAGE_WG_LEADER_ACCOUNT_ID: u128 = 100001; // must match the mocks
const CONTENT_WG_LEADER_ACCOUNT_ID: u128 = 100005; // must match the mocks LEAD_ACCOUNT_ID
const DISTRIBUTION_WG_LEADER_ACCOUNT_ID: u128 = 100004; // must match the mocks
const MAX_BYTES_METADATA: u32 = 3 * 1024 * 1024; // 3 MB is close to the blocksize available for regular extrinsics

// Creator tokens
const MAX_CRT_INITIAL_ALLOCATION_MEMBERS: u32 = 1024;
const MAX_CRT_ISSUER_TRANSFER_OUTPUTS: u32 = 1024;
const DEFAULT_CRT_OWNER_ISSUANCE: u32 = 1_000_000_000;
const DEFAULT_CRT_SALE_DURATION: u32 = 1_000;
const DEFAULT_CRT_SALE_CAP_PER_MEMBER: u32 = 1_000_000;
const DEFAULT_CRT_SALE_PRICE: u32 = 500_000_000;
const DEFAULT_CRT_SALE_UPPER_BOUND: u32 = DEFAULT_CRT_OWNER_ISSUANCE;

const CHANNEL_AGENT_PERMISSIONS: [ChannelActionPermission; 21] = [
    ChannelActionPermission::UpdateChannelMetadata,
    ChannelActionPermission::ManageNonVideoChannelAssets,
    ChannelActionPermission::ManageChannelCollaborators,
    ChannelActionPermission::UpdateVideoMetadata,
    ChannelActionPermission::AddVideo,
    ChannelActionPermission::ManageVideoAssets,
    ChannelActionPermission::DeleteChannel,
    ChannelActionPermission::DeleteVideo,
    ChannelActionPermission::ManageVideoNfts,
    ChannelActionPermission::AgentRemark,
    ChannelActionPermission::TransferChannel,
    ChannelActionPermission::ClaimChannelReward,
    ChannelActionPermission::WithdrawFromChannelBalance,
    ChannelActionPermission::IssueCreatorToken,
    ChannelActionPermission::ClaimCreatorTokenPatronage,
    ChannelActionPermission::InitAndManageCreatorTokenSale,
    ChannelActionPermission::CreatorTokenIssuerTransfer,
    ChannelActionPermission::MakeCreatorTokenPermissionless,
    ChannelActionPermission::ReduceCreatorTokenPatronageRate,
    ChannelActionPermission::ManageRevenueSplits,
    ChannelActionPermission::DeissueCreatorToken,
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

fn storage_bucket_objs_number_limit<T: Config>() -> u64 {
    (T::MaxNumberOfAssetsPerChannel::get() as u64) * 100
}

fn storage_bucket_objs_size_limit<T: Config>() -> u64 {
    T::MaxDataObjectSize::get() * storage_bucket_objs_number_limit::<T>() * 1000
}

pub trait CreateAccountId {
    fn create_account_id(id: u128) -> Self;
}

impl CreateAccountId for u128 {
    fn create_account_id(id: u128) -> Self {
        id
    }
}

impl CreateAccountId for u64 {
    fn create_account_id(id: u128) -> Self {
        id.try_into().unwrap()
    }
}

const SEED: u32 = 0;

impl CreateAccountId for sp_core::crypto::AccountId32 {
    fn create_account_id(id: u128) -> Self {
        account::<Self>("default", id.try_into().unwrap(), SEED)
    }
}

fn get_signed_account_id<T>(account_id: u128) -> T::Origin
where
    T::AccountId: CreateAccountId,
    T: Config,
{
    RawOrigin::Signed(T::AccountId::create_account_id(account_id)).into()
}

fn assert_last_event<T: Config>(expected_event: <T as frame_system::Config>::Event) {
    assert_past_event::<T>(expected_event, 0);
}

fn assert_past_event<T: Config>(
    expected_event: <T as frame_system::Config>::Event,
    index_from_last: u32,
) {
    let events = System::<T>::events();
    // compare to the last event record
    let EventRecord { event, .. } = &events[events.len() - 1 - index_from_last as usize];
    assert_eq!(event, &expected_event);
}

// fn assert_was_fired<T: Config>(generic_event: <T as Config>::Event) {
//     let events = System::<T>::events();
//     let system_event: <T as frame_system::Config>::Event = generic_event.into();

//     assert!(events.iter().any(|ev| ev.event == system_event));
// }

fn get_byte(num: u128, byte_number: u8) -> u8 {
    ((num & (0xff << (8 * byte_number))) >> (8 * byte_number)) as u8
}

// Method to generate a distintic valid handle
// for a membership. For each index.
fn handle_from_id<T: membership::Config>(id: u128) -> Vec<u8> {
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

fn insert_worker<T, I>(
    leader_acc: T::AccountId,
    id: u128,
) -> (<T as MembershipTypes>::ActorId, T::AccountId)
where
    T::AccountId: CreateAccountId,
    T: Config + working_group::Config<I>,
    I: Instance,
{
    // let worker_id = working_group::NextWorkerId::<T, I>::get();

    let (account_id, member_id) = member_funded_account::<T>(id);

    let worker_id: WorkerId<T> = WorkerId::<T>::saturated_from(id);
    working_group::NextWorkerId::<T, I>::put(worker_id);

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

    (worker_id, account_id)
}

fn insert_leader<T, I>(id: u128) -> (<T as MembershipTypes>::ActorId, T::AccountId)
where
    T::AccountId: CreateAccountId,
    T: Config + membership::Config + working_group::Config<I> + balances::Config,
    I: Instance,
{
    let (account_id, member_id) = member_funded_account::<T>(id.saturated_into());

    let (opening_id, application_id) = add_and_apply_opening::<T, I>(
        &T::Origin::from(RawOrigin::Root),
        &account_id,
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

    (worker_id, account_id)
}

fn insert_storage_leader<T>() -> (<T as MembershipTypes>::ActorId, T::AccountId)
where
    T::AccountId: CreateAccountId,
    T: Config
        + membership::Config
        + working_group::Config<StorageWorkingGroupInstance>
        + balances::Config,
{
    insert_leader::<T, StorageWorkingGroupInstance>(STORAGE_WG_LEADER_ACCOUNT_ID)
}

fn insert_distribution_leader<T>() -> (<T as MembershipTypes>::ActorId, T::AccountId)
where
    T::AccountId: CreateAccountId,
    T: Config
        + membership::Config
        + working_group::Config<DistributionWorkingGroupInstance>
        + balances::Config,
{
    insert_leader::<T, DistributionWorkingGroupInstance>(DISTRIBUTION_WG_LEADER_ACCOUNT_ID)
}

fn insert_content_leader<T>() -> (<T as MembershipTypes>::ActorId, T::AccountId)
where
    T::AccountId: CreateAccountId,
    T: Config
        + membership::Config
        + working_group::Config<ContentWorkingGroupInstance>
        + balances::Config,
{
    insert_leader::<T, ContentWorkingGroupInstance>(CONTENT_WG_LEADER_ACCOUNT_ID)
}

fn insert_curator<T>(id: u128) -> (T::CuratorId, T::AccountId)
where
    T::AccountId: CreateAccountId,
    T: Config
        + membership::Config
        + working_group::Config<ContentWorkingGroupInstance>
        + balances::Config,
{
    let (actor_id, account_id) = insert_worker::<T, ContentWorkingGroupInstance>(
        T::AccountId::create_account_id(CONTENT_WG_LEADER_ACCOUNT_ID),
        id,
    );

    (
        actor_id.saturated_into::<u64>().saturated_into(),
        account_id,
    )
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

fn create_storage_bucket<T>(lead_account_id: T::AccountId, accepting_bags: bool)
where
    T: Config + storage::Config,
{
    // Set storage bucket in the dynamic bag creation policy to zero.
    let storage_wg_leader_signed = RawOrigin::Signed(lead_account_id);
    Storage::<T>::create_storage_bucket(
        T::Origin::from(storage_wg_leader_signed),
        None,
        accepting_bags,
        storage_bucket_objs_size_limit::<T>(),
        storage_bucket_objs_number_limit::<T>(),
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
    let storage_wg_leader_signed = RawOrigin::Signed(lead_account_id.clone());

    let db_family_id = Storage::<T>::next_distribution_bucket_family_id();

    Storage::<T>::create_distribution_bucket_family(T::Origin::from(storage_wg_leader_signed))
        .unwrap();

    (
        db_family_id,
        create_distribution_buckets::<T>(lead_account_id, db_family_id, bucket_number),
    )
}

pub fn create_data_object_candidates_helper(
    number: u32,
    size: u64,
) -> Vec<DataObjectCreationParameters> {
    let range = 0..number;

    range
        .into_iter()
        .map(|_| DataObjectCreationParameters {
            size,
            ipfs_content_id: vec![1u8],
        })
        .collect()
}

type BloatBonds<T> = (
    <T as balances::Config>::Balance, // channel_state_bloat_bond
    <T as balances::Config>::Balance, // video_state_bloat_bond
    <T as balances::Config>::Balance, // data_object_state_bloat_bond
    <T as balances::Config>::Balance, // data_size_fee
);

fn setup_bloat_bonds<T>() -> Result<BloatBonds<T>, DispatchError>
where
    T: Config,
    T::AccountId: CreateAccountId,
{
    let content_lead_acc = T::AccountId::create_account_id(CONTENT_WG_LEADER_ACCOUNT_ID);
    let storage_lead_acc = T::AccountId::create_account_id(STORAGE_WG_LEADER_ACCOUNT_ID);
    // FIXME: Must be higher than existential deposit due to https://github.com/Joystream/joystream/issues/4033
    let channel_state_bloat_bond: <T as balances::Config>::Balance = 100u32.into();
    // FIXME: Must be higher than existential deposit due to https://github.com/Joystream/joystream/issues/4033
    let video_state_bloat_bond: <T as balances::Config>::Balance = 100u32.into();
    // FIXME: Must be higher than existential deposit due to https://github.com/Joystream/joystream/issues/4033
    let data_object_state_bloat_bond: <T as balances::Config>::Balance = 100u32.into();
    let data_size_fee = <T as balances::Config>::Balance::one();
    // Set non-zero channel bloat bond
    Pallet::<T>::update_channel_state_bloat_bond(
        RawOrigin::Signed(content_lead_acc.clone()).into(),
        channel_state_bloat_bond,
    )?;
    // Set non-zero video bloat bond
    Pallet::<T>::update_video_state_bloat_bond(
        RawOrigin::Signed(content_lead_acc).into(),
        video_state_bloat_bond,
    )?;
    // Set non-zero data object bloat bond
    storage::Pallet::<T>::update_data_object_state_bloat_bond(
        RawOrigin::Signed(storage_lead_acc.clone()).into(),
        data_object_state_bloat_bond,
    )?;
    // Set non-zero fee per mb
    storage::Pallet::<T>::update_data_size_fee(
        RawOrigin::Signed(storage_lead_acc).into(),
        data_size_fee,
    )?;

    Ok((
        channel_state_bloat_bond,
        video_state_bloat_bond,
        data_object_state_bloat_bond,
        data_size_fee,
    ))
}

#[allow(clippy::too_many_arguments)]
fn generate_channel_creation_params<T>(
    storage_wg_lead_account_id: T::AccountId,
    distribution_wg_lead_account_id: T::AccountId,
    colaborator_num: u32,
    storage_bucket_num: u32,
    distribution_bucket_num: u32,
    objects_num: u32,
    max_bytes_metadata: u32,
    max_obj_size: u64,
) -> ChannelCreationParameters<T>
where
    T: Config
        + storage::Config
        + membership::Config
        + balances::Config
        + working_group::Config<ContentWorkingGroupInstance>
        + working_group::Config<StorageWorkingGroupInstance>
        + working_group::Config<DistributionWorkingGroupInstance>,
    T::AccountId: CreateAccountId,
{
    set_dyn_bag_creation_storage_bucket_numbers::<T>(
        storage_wg_lead_account_id.clone(),
        storage_bucket_num.into(),
        DynamicBagType::Channel,
    );

    set_storage_buckets_voucher_max_limits::<T>(
        storage_wg_lead_account_id.clone(),
        storage_bucket_objs_size_limit::<T>(),
        storage_bucket_objs_number_limit::<T>(),
    );

    setup_bloat_bonds::<T>().unwrap();

    let assets = Some(StorageAssets::<T> {
        expected_data_size_fee: Storage::<T>::data_object_per_mega_byte_fee(),
        object_creation_list: create_data_object_candidates_helper(objects_num, max_obj_size),
    });

    let collaborators = worst_case_scenario_collaborators::<T>(0, colaborator_num);

    let storage_buckets = (0..storage_bucket_num)
        .map(|id| {
            create_storage_bucket::<T>(storage_wg_lead_account_id.clone(), true);
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

    let meta = Some(vec![0u8].repeat(max_bytes_metadata as usize));

    ChannelCreationParameters::<T> {
        assets,
        meta,
        collaborators,
        storage_buckets,
        distribution_buckets,
        expected_data_object_state_bloat_bond,
        expected_channel_state_bloat_bond,
    }
}

fn worst_case_content_moderation_actions_set() -> BTreeSet<ContentModerationAction> {
    CONTENT_MODERATION_ACTIONS.iter().cloned().collect()
}

fn worst_case_channel_agent_permissions() -> ChannelAgentPermissions {
    CHANNEL_AGENT_PERMISSIONS.iter().cloned().collect()
}

fn worst_case_scenario_collaborators<T: Config>(
    start_id: u32,
    num: u32,
) -> BTreeMap<T::MemberId, ChannelAgentPermissions>
where
    T::AccountId: CreateAccountId,
{
    (0..num)
        .map(|i| {
            let (_, collaborator_id) =
                member_funded_account::<T>(COLABORATOR_IDS[(start_id + i) as usize]);
            (collaborator_id, worst_case_channel_agent_permissions())
        })
        .collect()
}

fn setup_worst_case_scenario_channel<T: Config>(
    sender: T::AccountId,
    channel_owner: ChannelOwner<T::MemberId, T::CuratorGroupId>,
    objects_num: u32,
    storage_buckets_num: u32,
    distribution_buckets_num: u32,
) -> Result<T::ChannelId, DispatchError>
where
    T: Config
        + storage::Config
        + membership::Config
        + balances::Config
        + working_group::Config<ContentWorkingGroupInstance>
        + working_group::Config<StorageWorkingGroupInstance>
        + working_group::Config<DistributionWorkingGroupInstance>,
    T::AccountId: CreateAccountId,
{
    let (_, storage_wg_lead_account_id) = insert_storage_leader::<T>();
    let (_, distribution_wg_lead_account_id) = insert_distribution_leader::<T>();
    let origin = RawOrigin::Signed(sender);

    let params = generate_channel_creation_params::<T>(
        storage_wg_lead_account_id,
        distribution_wg_lead_account_id,
        T::MaxNumberOfCollaboratorsPerChannel::get(),
        storage_buckets_num,
        distribution_buckets_num,
        objects_num,
        MAX_BYTES_METADATA,
        T::MaxDataObjectSize::get(),
    );

    let channel_id = Pallet::<T>::next_channel_id();

    Pallet::<T>::create_channel(origin.into(), channel_owner, params)?;

    Ok(channel_id)
}

fn setup_worst_case_curator_group_with_curators<T>(
    curators_len: u32,
) -> Result<T::CuratorGroupId, DispatchError>
where
    T: Config + working_group::Config<ContentWorkingGroupInstance>,
    T::AccountId: CreateAccountId,
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
        get_signed_account_id::<T>(CONTENT_WG_LEADER_ACCOUNT_ID),
        true,
        permissions_by_level,
    )?;

    // We substract 1 from `next_worker_id`, because we're not counting the lead
    let already_existing_curators_num =
        working_group::Pallet::<T, ContentWorkingGroupInstance>::next_worker_id()
            .saturated_into::<u32>();

    for c in CURATOR_IDS
        .iter()
        .skip((already_existing_curators_num - 1) as usize)
        .take((curators_len - already_existing_curators_num) as usize)
    {
        let (curator_id, _) = insert_curator::<T>(*c);

        Pallet::<T>::add_curator_to_group(
            get_signed_account_id::<T>(CONTENT_WG_LEADER_ACCOUNT_ID),
            group_id,
            curator_id.saturated_into::<u64>().saturated_into(),
            worst_case_channel_agent_permissions(),
        )?;
    }
    Ok(group_id)
}

#[allow(clippy::type_complexity)]
fn setup_worst_case_scenario_curator_channel<T>(
    objects_num: u32,
    storage_buckets_num: u32,
    distribution_buckets_num: u32,
) -> Result<
    (
        T::ChannelId,
        T::CuratorGroupId,
        T::AccountId,
        T::CuratorId,
        T::AccountId,
    ),
    DispatchError,
>
where
    T: Config
        + working_group::Config<ContentWorkingGroupInstance>
        + working_group::Config<StorageWorkingGroupInstance>
        + working_group::Config<DistributionWorkingGroupInstance>,
    T::AccountId: CreateAccountId,
{
    let (_, lead_account_id) = insert_content_leader::<T>();

    let group_id = setup_worst_case_curator_group_with_curators::<T>(min(
        <T as working_group::Config<ContentWorkingGroupInstance>>::MaxWorkerNumberLimit::get(),
        T::MaxNumberOfCuratorsPerGroup::get(),
    ))?;

    let channel_id = setup_worst_case_scenario_channel::<T>(
        lead_account_id.clone(),
        ChannelOwner::CuratorGroup(group_id),
        objects_num,
        storage_buckets_num,
        distribution_buckets_num,
    )?;

    let group = Pallet::<T>::curator_group_by_id(group_id);
    let curator_id: T::CuratorId = *group.get_curators().keys().next().unwrap();
    let curator_account_id = T::AccountId::create_account_id(CURATOR_IDS[0]);

    Ok((
        channel_id,
        group_id,
        lead_account_id,
        curator_id,
        curator_account_id,
    ))
}

fn channel_bag_witness<T: Config>(
    channel_id: T::ChannelId,
) -> Result<ChannelBagWitness, DispatchError> {
    let bag_id = Pallet::<T>::bag_id_for_channel(&channel_id);
    let channel_bag = <T as Config>::DataObjectStorage::ensure_bag_exists(&bag_id)?;
    Ok(ChannelBagWitness {
        storage_buckets_num: channel_bag.stored_by.len() as u32,
        distribution_buckets_num: channel_bag.distributed_by.len() as u32,
    })
}

// fn worst_case_scenario_assets<T: Config>(num: u32) -> StorageAssets<T> {
//     StorageAssets::<T> {
//         expected_data_size_fee: storage::Pallet::<T>::data_object_per_mega_byte_fee(),
//         object_creation_list: create_data_object_candidates_helper(
//             num,                         // number of objects
//             T::MaxDataObjectSize::get(), // object size
//         ),
//     }
// }

fn create_token_issuance_params<T: Config>(
    initial_allocation: BTreeMap<T::MemberId, TokenAllocationOf<T>>,
) -> TokenIssuanceParametersOf<T> {
    let transfer_policy_commit = <T as frame_system::Config>::Hashing::hash_of(b"commitment");
    let token_symbol = <T as frame_system::Config>::Hashing::hash_of(b"CRT");
    let patronage_rate = YearlyRate(Permill::from_percent(10));
    let revenue_split_rate = Permill::from_percent(50);
    TokenIssuanceParametersOf::<T> {
        initial_allocation,
        symbol: token_symbol.clone(),
        transfer_policy: TransferPolicyParamsOf::<T>::Permissioned(WhitelistParamsOf::<T> {
            commitment: transfer_policy_commit.clone(),
            payload: Some(SingleDataObjectUploadParams {
                object_creation_params: DataObjectCreationParameters {
                    ipfs_content_id: vec![0],
                    size: T::MaxDataObjectSize::get(),
                },
                expected_data_object_state_bloat_bond:
                    Storage::<T>::data_object_state_bloat_bond_value(),
                expected_data_size_fee: Storage::<T>::data_object_per_mega_byte_fee(),
            }),
        }),
        patronage_rate,
        revenue_split_rate,
    }
}

fn default_vesting_schedule_params<T: Config>() -> VestingScheduleParamsOf<T> {
    VestingScheduleParamsOf::<T> {
        linear_vesting_duration: 100u32.into(),
        blocks_before_cliff: 100u32.into(),
        cliff_amount_percentage: Permill::from_percent(10),
    }
}

fn worst_case_scenario_initial_allocation<T: Config>(
    members_num: u32,
) -> BTreeMap<T::MemberId, TokenAllocationOf<T>>
where
    T::AccountId: CreateAccountId,
{
    let start_member_id: u128 = membership::Module::<T>::members_created().saturated_into();
    (0..members_num)
        .map(|i| {
            let (_, member_id) = member_funded_account::<T>(start_member_id + i as u128);
            let allocation = TokenAllocationOf::<T> {
                amount: 100u32.into(),
                vesting_schedule_params: Some(default_vesting_schedule_params::<T>()),
            };
            (member_id, allocation)
        })
        .collect()
}

fn setup_account_with_max_number_of_locks<T: Config>(
    token_id: T::TokenId,
    member_id: &T::MemberId,
) {
    AccountInfoByTokenAndMember::<T>::mutate(token_id, member_id, |a| {
        (0u32..T::MaxVestingBalancesPerAccountPerToken::get().into()).for_each(|i| {
            a.add_or_update_vesting_schedule(
                VestingSource::Sale(i),
                VestingSchedule::from_params(
                    frame_system::Pallet::<T>::block_number(),
                    TokenBalanceOf::<T>::one(),
                    VestingScheduleParamsOf::<T> {
                        linear_vesting_duration: 0u32.into(),
                        blocks_before_cliff: u32::MAX.into(),
                        cliff_amount_percentage: Permill::from_percent(100),
                    },
                ),
                None,
            );
        });
        a.stake(0u32, TokenBalanceOf::<T>::one());
    });
}

fn curator_member_id<T: Config + working_group::Config<ContentWorkingGroupInstance>>(
    curator_id: T::CuratorId,
) -> T::MemberId {
    working_group::Pallet::<T, ContentWorkingGroupInstance>::worker_by_id::<T::ActorId>(
        curator_id.saturated_into::<u64>().saturated_into(),
    )
    .unwrap()
    .member_id
}

fn issue_creator_token_with_worst_case_scenario_owner<T: Config>(
    sender: T::AccountId,
    actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel_id: T::ChannelId,
    owner_member_id: T::MemberId,
) -> Result<T::TokenId, DispatchError>
where
    T::AccountId: CreateAccountId,
{
    let initial_allocation = BTreeMap::<T::MemberId, TokenAllocationOf<T>>::from_iter(vec![(
        owner_member_id,
        TokenAllocationOf::<T> {
            amount: DEFAULT_CRT_OWNER_ISSUANCE.into(),
            vesting_schedule_params: None,
        },
    )]);
    let issuance_params = create_token_issuance_params::<T>(initial_allocation);
    let token_id = project_token::Pallet::<T>::next_token_id();
    Pallet::<T>::issue_creator_token(
        RawOrigin::Signed(sender).into(),
        actor,
        channel_id,
        issuance_params,
    )?;
    setup_account_with_max_number_of_locks::<T>(token_id, &owner_member_id);
    Ok(token_id)
}

fn worst_case_scenario_token_sale_params<T: Config>(
    metatada_len: u32,
    starts_at: Option<T::BlockNumber>,
) -> TokenSaleParamsOf<T> {
    TokenSaleParamsOf::<T> {
        cap_per_member: Some(1_000_000u32.into()),
        duration: DEFAULT_CRT_SALE_DURATION.into(),
        starts_at,
        unit_price: DEFAULT_CRT_SALE_PRICE.into(),
        upper_bound_quantity: DEFAULT_CRT_SALE_UPPER_BOUND.into(),
        vesting_schedule_params: Some(default_vesting_schedule_params::<T>()),
        metadata: Some(vec![0xf].repeat(metatada_len as usize)),
    }
}

fn worst_case_scenario_issuer_transfer_outputs<T: Config>(num: u32) -> TransfersWithVestingOf<T>
where
    T::AccountId: CreateAccountId,
{
    let start_member_id: u128 = membership::Module::<T>::members_created().saturated_into();
    Transfers(
        (0..num)
            .map(|i| {
                let (_, member_id) = member_funded_account::<T>(start_member_id + i as u128);
                let payment = PaymentWithVestingOf::<T> {
                    amount: 100u32.into(),
                    vesting_schedule: Some(default_vesting_schedule_params::<T>()),
                };
                (member_id, payment)
            })
            .collect(),
    )
}

pub fn run_to_block<T: Config>(target_block: T::BlockNumber) {
    let mut current_block = System::<T>::block_number();
    while current_block < target_block {
        // Other on_finalize calls if needed...
        System::<T>::on_finalize(current_block);

        current_block += One::one();
        System::<T>::set_block_number(current_block);

        System::<T>::on_initialize(current_block);
        // Other on_initialize calls if needed...
    }
}

pub fn fastforward_by_blocks<T: Config>(blocks: T::BlockNumber) {
    let current_block = System::<T>::block_number();
    run_to_block::<T>(current_block + blocks);
}
