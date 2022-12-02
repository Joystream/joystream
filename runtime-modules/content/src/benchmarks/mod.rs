mod benchmarking;

use crate::{
    nft::{
        EnglishAuctionParams, InitTransactionalStatus, NftIssuanceParameters, OpenAuctionBid,
        OpenAuctionParams,
    },
    permissions::*,
    types::*,
    Config, ContentModerationAction, InitTransferParametersOf, ModerationPermissionsByLevel,
    Module as Pallet, NftLimitsEnabled,
};

use balances::Pallet as Balances;
use common::{working_group::WorkingGroupAuthenticator, MembershipTypes};
use frame_benchmarking::account;
use frame_support::{
    dispatch::DispatchError,
    storage::{StorageDoubleMap, StorageMap, StorageValue},
    traits::{Currency, Get, Instance, OnFinalize, OnInitialize},
};
use frame_system::{EventRecord, Pallet as System, RawOrigin};
use membership::Module as Membership;
use project_token::{types::*, AccountInfoByTokenAndMember, MinSaleDuration};
use sp_arithmetic::traits::One;
use sp_core::U256;
use sp_runtime::{traits::Hash, Permill, SaturatedConversion};
use sp_std::{
    cmp::min,
    collections::{btree_map::BTreeMap, btree_set::BTreeSet},
    convert::TryInto,
    iter::FromIterator,
    ops::Mul,
    vec,
    vec::Vec,
};
use storage::{
    DataObjectCreationParameters, DataObjectStorage, DistributionBucketId, DynamicBagType,
    Module as Storage,
};
use working_group::{
    ApplicationById, ApplicationId, ApplyOnOpeningParameters, OpeningById, OpeningId, OpeningType,
    StakeParameters, StakePolicy, WorkerById,
};

// Nft contexts
pub type NftContexts<T> = (
    NftData<T>,
    Vec<(
        <T as frame_system::Config>::AccountId,
        <T as MembershipTypes>::MemberId,
    )>,
);
pub type NftContext<T> = (
    NftData<T>,
    <T as MembershipTypes>::MemberId,
    <T as frame_system::Config>::AccountId,
);

// The storage working group instance alias.
pub type StorageWorkingGroupInstance = working_group::Instance2;

// The distribution working group instance alias.
pub type DistributionWorkingGroupInstance = working_group::Instance9;

// Content working group instance alias.
pub type ContentWorkingGroupInstance = working_group::Instance3;

fn nft_buy_now_price<T: Config>() -> BalanceOf<T> {
    Pallet::<T>::min_starting_price() + Pallet::<T>::min_bid_step() + 1000u32.into()
}

pub const MAX_MERKLE_PROOF_HASHES: u32 = 10;

const STORAGE_WG_LEADER_ACCOUNT_ID: u64 = 100001; // must match the mocks
const CONTENT_WG_LEADER_ACCOUNT_ID: u64 = 100005; // must match the mocks LEAD_ACCOUNT_ID
const DISTRIBUTION_WG_LEADER_ACCOUNT_ID: u64 = 100004; // must match the mocks
const MAX_KILOBYTES_METADATA: u32 = 100;

// Creator tokens
const MAX_CRT_INITIAL_ALLOCATION_MEMBERS: u32 = 1024;
const MAX_CRT_ISSUER_TRANSFER_OUTPUTS: u32 = 1024;
const DEFAULT_CRT_OWNER_ISSUANCE: u32 = 1_000_000_000;
const DEFAULT_CRT_SALE_CAP_PER_MEMBER: u32 = 1_000_000;
const DEFAULT_CRT_SALE_PRICE: u32 = 500_000_000;
const DEFAULT_CRT_SALE_UPPER_BOUND: u32 = DEFAULT_CRT_OWNER_ISSUANCE;
const DEFAULT_CRT_REVENUE_SPLIT_RATE: Permill = Permill::from_percent(50);
const DEFAULT_CRT_PATRONAGE_RATE: YearlyRate = YearlyRate(Permill::from_percent(10));

const CHANNEL_AGENT_PERMISSIONS: [ChannelActionPermission; 22] = [
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
    ChannelActionPermission::AmmControl,
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

#[macro_export]
macro_rules! assert_lt {
    ($a:expr, $b:expr) => {
        assert!($a < $b, "Expected {:?} to be lower than {:?}", $a, $b);
    };
}

const CONTENT_PAUSABLE_CHANNEL_FEATURE: [PausableChannelFeature; 7] = [
    PausableChannelFeature::ChannelFundsTransfer,
    PausableChannelFeature::CreatorCashout,
    PausableChannelFeature::VideoNftIssuance,
    PausableChannelFeature::VideoCreation,
    PausableChannelFeature::VideoUpdate,
    PausableChannelFeature::ChannelUpdate,
    PausableChannelFeature::CreatorTokenIssuance,
];

fn storage_bucket_objs_number_limit<T: Config>() -> u64 {
    (T::MaxNumberOfAssetsPerChannel::get() as u64) * 100
}

fn storage_bucket_objs_size_limit<T: Config>() -> u64 {
    T::MaxDataObjectSize::get() * storage_bucket_objs_number_limit::<T>() * 1000
}

pub trait CreateAccountId {
    fn create_account_id(id: u64) -> Self;
}

impl CreateAccountId for U256 {
    fn create_account_id(id: u64) -> Self {
        U256([id, 0, 0, 0])
    }
}

const SEED: u32 = 0;

impl CreateAccountId for sp_core::crypto::AccountId32 {
    fn create_account_id(id: u64) -> Self {
        account::<Self>("default", id.try_into().unwrap(), SEED)
    }
}

pub trait RuntimeConfig:
    Config
    + storage::Config
    + membership::Config
    + balances::Config
    + working_group::Config<StorageWorkingGroupInstance>
    + working_group::Config<DistributionWorkingGroupInstance>
    + working_group::Config<ContentWorkingGroupInstance>
{
}

impl<T> RuntimeConfig for T where
    T: Config
        + storage::Config
        + membership::Config
        + balances::Config
        + working_group::Config<StorageWorkingGroupInstance>
        + working_group::Config<DistributionWorkingGroupInstance>
        + working_group::Config<ContentWorkingGroupInstance>
{
}

fn get_signed_account_id<T>(account_id: u64) -> T::Origin
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

fn get_byte(num: u64, byte_number: u8) -> u8 {
    ((num & (0xff << (8 * byte_number))) >> (8 * byte_number)) as u8
}

// Method to generate a distintic valid handle
// for a membership. For each index.
fn handle_from_id<T: membership::Config>(id: u64) -> Vec<u8> {
    id.to_be_bytes().to_vec()
    // let min_handle_length = 1;

    // let mut handle = vec![];

    // for i in 0..16 {
    //     handle.push(get_byte(id, i));
    // }

    // while handle.len() < (min_handle_length as usize) {
    //     handle.push(0u8);
    // }

    // handle
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

fn insert_worker<T, I>(leader_acc: T::AccountId) -> (<T as MembershipTypes>::ActorId, T::AccountId)
where
    T::AccountId: CreateAccountId,
    T: RuntimeConfig + working_group::Config<I>,
    I: Instance,
{
    // let worker_id = working_group::NextWorkerId::<T, I>::get();

    let (account_id, member_id) = member_funded_account::<T>();

    let worker_id = working_group::NextWorkerId::<T, I>::get();

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

fn insert_leader<T, I>(acc_id: u64) -> (<T as MembershipTypes>::ActorId, T::AccountId)
where
    T::AccountId: CreateAccountId,
    T: RuntimeConfig + working_group::Config<I>,
    I: Instance,
{
    // If lead already inserted - return current lead
    if let Some(lead_id) = working_group::Pallet::<T, I>::current_lead() {
        let account_id = T::AccountId::create_account_id(
            working_group::Pallet::<T, I>::get_worker_member_id(&lead_id)
                .unwrap()
                .saturated_into(),
        );
        return (lead_id, account_id);
    }

    let (_, member_id) = member_funded_account::<T>();
    let account_id = change_member_account::<T>(member_id, acc_id);

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
    T: RuntimeConfig,
{
    insert_leader::<T, StorageWorkingGroupInstance>(STORAGE_WG_LEADER_ACCOUNT_ID)
}

fn insert_distribution_leader<T>() -> (<T as MembershipTypes>::ActorId, T::AccountId)
where
    T::AccountId: CreateAccountId,
    T: RuntimeConfig,
{
    insert_leader::<T, DistributionWorkingGroupInstance>(DISTRIBUTION_WG_LEADER_ACCOUNT_ID)
}

fn insert_content_leader<T>() -> (<T as MembershipTypes>::ActorId, T::AccountId)
where
    T::AccountId: CreateAccountId,
    T: RuntimeConfig,
{
    insert_leader::<T, ContentWorkingGroupInstance>(CONTENT_WG_LEADER_ACCOUNT_ID)
}

fn insert_curator<T>() -> (T::CuratorId, T::AccountId)
where
    T::AccountId: CreateAccountId,
    T: RuntimeConfig,
{
    let (actor_id, account_id) = insert_worker::<T, ContentWorkingGroupInstance>(
        T::AccountId::create_account_id(CONTENT_WG_LEADER_ACCOUNT_ID),
    );

    (
        actor_id.saturated_into::<u64>().saturated_into(),
        account_id,
    )
}

//defines initial balance
fn initial_balance<T: balances::Config>() -> T::Balance {
    // 1 million JOY
    (1_000_000_u64 * 10_000_000_000_u64).saturated_into()
}

fn member_funded_account<T: RuntimeConfig>() -> (T::AccountId, T::MemberId)
where
    T::AccountId: CreateAccountId,
{
    let member_id = membership::NextMemberId::<T>::get();

    let account_id = T::AccountId::create_account_id(member_id.saturated_into());

    let handle = handle_from_id::<T>(member_id.saturated_into());

    // Give balance for buying membership
    let _ = Balances::<T>::make_free_balance_be(&account_id, initial_balance::<T>());

    let params = membership::BuyMembershipParameters {
        root_account: account_id.clone(),
        controller_account: account_id.clone(),
        handle: Some(handle),
        metadata: Vec::new(),
        referrer_id: None,
    };

    Membership::<T>::buy_membership(RawOrigin::Signed(account_id.clone()).into(), params).unwrap();

    let _ = Balances::<T>::make_free_balance_be(&account_id, initial_balance::<T>());

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

fn change_member_account<T: RuntimeConfig>(member_id: T::MemberId, acc_id: u64) -> T::AccountId
where
    T::AccountId: CreateAccountId,
{
    let account_id = T::AccountId::create_account_id(acc_id);
    let _ = Balances::<T>::make_free_balance_be(&account_id, initial_balance::<T>());
    membership::MembershipById::<T>::mutate(member_id, |m| {
        if let Some(m) = m {
            m.root_account = account_id.clone();
            m.controller_account = account_id.clone();
        }
    });
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

    account_id
}

fn set_dyn_bag_creation_storage_bucket_numbers<T>(
    lead_account_id: T::AccountId,
    storage_bucket_number: u32,
    bag_type: DynamicBagType,
) where
    T: RuntimeConfig,
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
    T: RuntimeConfig,
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
    T: RuntimeConfig,
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
    T: RuntimeConfig,
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
    T: RuntimeConfig,
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
    number: u32,
    size: u64,
) -> Vec<DataObjectCreationParameters> {
    let range = 0..number;

    range
        .into_iter()
        .map(|_| DataObjectCreationParameters {
            size,
            ipfs_content_id: vec![1u8; 46],
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
    T: RuntimeConfig,
    T::AccountId: CreateAccountId,
{
    // Setup lead if not already setup
    insert_content_leader::<T>();

    let content_lead_acc = T::AccountId::create_account_id(CONTENT_WG_LEADER_ACCOUNT_ID);
    let storage_lead_acc = T::AccountId::create_account_id(STORAGE_WG_LEADER_ACCOUNT_ID);
    let channel_state_bloat_bond: <T as balances::Config>::Balance =
        <T as balances::Config>::ExistentialDeposit::get() + 100u32.into();
    let video_state_bloat_bond: <T as balances::Config>::Balance = 100u32.into();
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
    metadata_kb: u32,
) -> ChannelCreationParameters<T>
where
    T: RuntimeConfig,
    T::AccountId: CreateAccountId,
{
    set_dyn_bag_creation_storage_bucket_numbers::<T>(
        storage_wg_lead_account_id.clone(),
        storage_bucket_num,
        DynamicBagType::Channel,
    );
    set_storage_buckets_voucher_max_limits::<T>(
        storage_wg_lead_account_id.clone(),
        storage_bucket_objs_size_limit::<T>(),
        storage_bucket_objs_number_limit::<T>(),
    );

    setup_bloat_bonds::<T>().unwrap();

    let assets = Some(worst_case_scenario_assets::<T>(objects_num));

    let collaborators = worst_case_scenario_collaborators::<T>(colaborator_num);

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

    let meta = Some(vec![0xff].repeat((metadata_kb * 1000) as usize));

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

fn worst_case_pausable_channel_feature() -> BTreeSet<PausableChannelFeature> {
    CONTENT_PAUSABLE_CHANNEL_FEATURE.iter().cloned().collect()
}

fn worst_case_scenario_collaborators<T: RuntimeConfig>(
    num: u32,
) -> BTreeMap<T::MemberId, ChannelAgentPermissions>
where
    T::AccountId: CreateAccountId,
{
    (0..num)
        .map(|_| {
            let (_, collaborator_id) = member_funded_account::<T>();
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
    // benchmarks should always use "true" if possible (ie. the benchmarked tx
    // is allowed during active transfer, for example - delete_channel)
    with_transfer: bool,
) -> Result<T::ChannelId, DispatchError>
where
    T: RuntimeConfig,
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
        MAX_KILOBYTES_METADATA,
    );

    let channel_id = Pallet::<T>::next_channel_id();

    Pallet::<T>::create_channel(origin.clone().into(), channel_owner.clone(), params)?;

    // initialize worst-case-scenario transfer
    if with_transfer {
        let (_, new_owner_id) = member_funded_account::<T>();
        let new_owner = ChannelOwner::Member(new_owner_id);
        let new_collaborators = worst_case_scenario_collaborators::<T>(
            T::MaxNumberOfCollaboratorsPerChannel::get(), // number of collaborators
        );
        let price = <T as balances::Config>::Balance::one();
        let actor = match channel_owner {
            ChannelOwner::Member(member_id) => ContentActor::Member(member_id),
            ChannelOwner::CuratorGroup(_) => ContentActor::Lead,
        };
        let transfer_params = InitTransferParametersOf::<T> {
            new_owner,
            new_collaborators,
            price,
        };
        Pallet::<T>::initialize_channel_transfer(
            origin.into(),
            channel_id,
            actor,
            transfer_params,
        )?;
    }

    // setup worst-case scenario repayable bloat bond for channel assets
    // (each bloat bond goes to different reciever)
    let channel = Pallet::<T>::channel_by_id(channel_id);
    set_unique_bloat_bond_recievers::<T>(
        channel_id,
        &Vec::from_iter(channel.data_objects.iter().cloned()),
    );

    Ok(channel_id)
}

type MemberChannelData<T> = (
    <T as storage::Config>::ChannelId,      // channel id
    <T as MembershipTypes>::MemberId,       // member id
    <T as frame_system::Config>::AccountId, // member_account_id
    <T as frame_system::Config>::AccountId, // content_lead_account_id
);

type NftData<T> = (
    ContentActor<
        <T as ContentActorAuthenticator>::CuratorGroupId,
        <T as ContentActorAuthenticator>::CuratorId,
        <T as MembershipTypes>::MemberId,
    >, // owner actor
    <T as frame_system::Config>::AccountId, // owner account id
);

fn setup_worst_case_scenario_member_channel<T: Config>(
    objects_num: u32,
    storage_buckets_num: u32,
    distribution_buckets_num: u32,
    // benchmarks should always use "true" if possible (ie. the benchmarked tx
    // is allowed during active transfer, for example - delete_channel)
    with_transfer: bool,
) -> Result<MemberChannelData<T>, DispatchError>
where
    T: RuntimeConfig,
    T::AccountId: CreateAccountId,
{
    let (_, lead_account_id) = insert_content_leader::<T>();

    let (member_account_id, member_id) = member_funded_account::<T>();

    let channel_id = setup_worst_case_scenario_channel::<T>(
        member_account_id.clone(),
        ChannelOwner::Member(member_id),
        objects_num,
        storage_buckets_num,
        distribution_buckets_num,
        with_transfer,
    )?;

    Ok((channel_id, member_id, member_account_id, lead_account_id))
}

fn setup_worst_case_curator_group_with_curators<T>(
    curators_len: u32,
) -> Result<T::CuratorGroupId, DispatchError>
where
    T: RuntimeConfig,
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

    for _ in 0..curators_len {
        let (curator_id, _) = insert_curator::<T>();

        Pallet::<T>::add_curator_to_group(
            get_signed_account_id::<T>(CONTENT_WG_LEADER_ACCOUNT_ID),
            group_id,
            curator_id.saturated_into::<u64>().saturated_into(),
            worst_case_channel_agent_permissions(),
        )?;
    }
    Ok(group_id)
}

type CuratorChannelData<T> = (
    <T as storage::Config>::ChannelId,                // channel id
    <T as ContentActorAuthenticator>::CuratorGroupId, // curator group id
    <T as frame_system::Config>::AccountId,           // lead_account_id
    <T as ContentActorAuthenticator>::CuratorId,      // curator_id
    <T as frame_system::Config>::AccountId,           // curator_account_id
);

fn setup_worst_case_scenario_curator_channel<T>(
    objects_num: u32,
    storage_buckets_num: u32,
    distribution_buckets_num: u32,
    // benchmarks should always use "true" unless initializing a transfer
    // is part of the benchmarks itself
    with_transfer: bool,
) -> Result<CuratorChannelData<T>, DispatchError>
where
    T: RuntimeConfig,
    T::AccountId: CreateAccountId,
{
    let (_, lead_account_id) = insert_content_leader::<T>();

    let group_id =
        setup_worst_case_curator_group_with_curators::<T>(max_curators_per_group::<T>())?;

    let channel_id = setup_worst_case_scenario_channel::<T>(
        lead_account_id.clone(),
        ChannelOwner::CuratorGroup(group_id),
        objects_num,
        storage_buckets_num,
        distribution_buckets_num,
        with_transfer,
    )?;

    let group = Pallet::<T>::curator_group_by_id(group_id);
    let curator_id: T::CuratorId = *group.get_curators().keys().next().unwrap();
    let curator_worker_id: <T as MembershipTypes>::ActorId =
        curator_id.saturated_into::<u64>().saturated_into();
    let curator_account_id = T::AccountId::create_account_id(
        working_group::Pallet::<T, ContentWorkingGroupInstance>::get_worker_member_id(
            &curator_worker_id,
        )
        .unwrap()
        .saturated_into(),
    );

    Ok((
        channel_id,
        group_id,
        lead_account_id,
        curator_id,
        curator_account_id,
    ))
}

fn worst_case_scenario_assets<T: RuntimeConfig>(num: u32) -> StorageAssets<T> {
    StorageAssets::<T> {
        expected_data_size_fee: storage::Pallet::<T>::data_object_per_mega_byte_fee(),
        object_creation_list: create_data_object_candidates_helper(
            num,                         // number of objects
            T::MaxDataObjectSize::get(), // object size
        ),
    }
}

fn set_unique_bloat_bond_recievers<T: RuntimeConfig>(
    channel_id: T::ChannelId,
    assets: &[DataObjectId<T>],
) where
    T::AccountId: CreateAccountId,
{
    for object_id in assets.iter() {
        let (account_id, _) = member_funded_account::<T>();
        storage::DataObjectsById::<T>::mutate(
            Pallet::<T>::bag_id_for_channel(&channel_id),
            object_id,
            |obj| obj.state_bloat_bond.repayment_restricted_to = Some(account_id),
        );
    }
}

fn setup_worst_case_scenario_curator_channel_all_max<T>(
    with_transfer: bool,
) -> Result<CuratorChannelData<T>, DispatchError>
where
    T: RuntimeConfig,
    T::AccountId: CreateAccountId,
{
    setup_worst_case_scenario_curator_channel::<T>(
        T::MaxNumberOfAssetsPerChannel::get(),
        T::MaxStorageBucketsPerBag::get(),
        T::MaxDistributionBucketsPerBag::get(),
        with_transfer,
    )
}

fn setup_worst_case_scenario_member_channel_all_max<T>(
    with_transfer: bool,
) -> Result<MemberChannelData<T>, DispatchError>
where
    T: RuntimeConfig,
    T::AccountId: CreateAccountId,
{
    setup_worst_case_scenario_member_channel::<T>(
        T::MaxNumberOfAssetsPerChannel::get(),
        T::MaxStorageBucketsPerBag::get(),
        T::MaxDistributionBucketsPerBag::get(),
        with_transfer,
    )
}

fn clone_curator_group<T>(group_id: T::CuratorGroupId) -> Result<T::CuratorGroupId, DispatchError>
where
    T: RuntimeConfig,
    T::AccountId: CreateAccountId,
{
    let new_group_id = Pallet::<T>::next_curator_group_id();
    let group = Pallet::<T>::curator_group_by_id(group_id);

    let lead_acc_id = T::AccountId::create_account_id(CONTENT_WG_LEADER_ACCOUNT_ID);
    Pallet::<T>::create_curator_group(
        RawOrigin::Signed(lead_acc_id.clone()).into(),
        group.is_active(),
        group.get_permissions_by_level(),
    )?;

    for (curator_id, permissions) in group.get_curators().as_ref() {
        Pallet::<T>::add_curator_to_group(
            RawOrigin::Signed(lead_acc_id.clone()).into(),
            new_group_id,
            *curator_id,
            permissions.clone().into_inner(),
        )?;
    }

    Ok(new_group_id)
}

pub fn all_channel_pausable_features_except(
    except: BTreeSet<crate::PausableChannelFeature>,
) -> BTreeSet<crate::PausableChannelFeature> {
    [
        crate::PausableChannelFeature::ChannelFundsTransfer,
        crate::PausableChannelFeature::CreatorCashout,
        crate::PausableChannelFeature::ChannelUpdate,
        crate::PausableChannelFeature::VideoNftIssuance,
        crate::PausableChannelFeature::VideoCreation,
        crate::PausableChannelFeature::ChannelUpdate,
        crate::PausableChannelFeature::CreatorTokenIssuance,
    ]
    .iter()
    .filter(|&&x| !except.contains(&x))
    .copied()
    .collect::<BTreeSet<_>>()
}

pub fn create_pull_payments_with_reward<T: Config>(
    payments_number: u32,
    cumulative_reward_earned: BalanceOf<T>,
) -> Vec<PullPayment<T>> {
    let mut payments = Vec::new();
    for i in 1..=payments_number {
        payments.push(PullPayment::<T> {
            channel_id: (i as u64).into(),
            cumulative_reward_earned,
            reason: T::Hashing::hash_of(&b"reason".to_vec()),
        });
    }
    payments
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

fn worst_case_scenario_video_nft_issuance_params<T>(whitelist_size: u32) -> NftIssuanceParameters<T>
where
    T: RuntimeConfig,
    T::AccountId: CreateAccountId,
{
    let (_, non_channel_owner_member_id) = member_funded_account::<T>();
    NftIssuanceParameters::<T> {
        nft_metadata: Vec::new(),
        non_channel_owner: Some(non_channel_owner_member_id),
        royalty: Some(Pallet::<T>::max_creator_royalty()),
        // most complex InitTransactionalStatus is EnglishAuction
        init_transactional_status: InitTransactionalStatus::<T>::EnglishAuction(
            EnglishAuctionParams::<T> {
                buy_now_price: Some(nft_buy_now_price::<T>()),
                duration: Pallet::<T>::min_auction_duration(),
                extension_period: Pallet::<T>::min_auction_extension_period(),
                min_bid_step: Pallet::<T>::min_bid_step(),
                starting_price: Pallet::<T>::min_starting_price(),
                starts_at: Some(System::<T>::block_number() + T::BlockNumber::one()),
                whitelist: (0..whitelist_size)
                    .map(|_| {
                        let (_, member_id) = member_funded_account::<T>();
                        member_id
                    })
                    .collect(),
            },
        ),
    }
}

type VideoCreationInputParameters<T> = (
    <T as frame_system::Config>::AccountId,
    ContentActor<
        <T as ContentActorAuthenticator>::CuratorGroupId,
        <T as ContentActorAuthenticator>::CuratorId,
        <T as MembershipTypes>::MemberId,
    >,
    <T as storage::Config>::ChannelId,
    VideoCreationParameters<T>,
);

fn prepare_worst_case_scenario_video_creation_parameters<T>(
    assets_num: Option<u32>,
    storage_buckets_num: u32,
    nft_auction_whitelist_size: Option<u32>,
    metadata_kb: u32,
) -> Result<VideoCreationInputParameters<T>, DispatchError>
where
    T: RuntimeConfig,
    T::AccountId: CreateAccountId,
{
    let (channel_id, group_id, _, curator_id, curator_account_id) =
        setup_worst_case_scenario_curator_channel::<T>(
            T::MaxNumberOfAssetsPerChannel::get(),
            storage_buckets_num,
            T::MaxDistributionBucketsPerBag::get(),
            false,
        )?;
    let actor = ContentActor::Curator(group_id, curator_id);
    let (_, video_state_bloat_bond, data_object_state_bloat_bond, _) = setup_bloat_bonds::<T>()?;
    let assets = assets_num.map(|n| worst_case_scenario_assets::<T>(n));
    let auto_issue_nft =
        nft_auction_whitelist_size.map(|s| worst_case_scenario_video_nft_issuance_params::<T>(s));

    Ok((
        curator_account_id,
        actor,
        channel_id,
        VideoCreationParameters::<T> {
            assets,
            meta: Some(vec![0xff].repeat((metadata_kb * 1000) as usize)),
            auto_issue_nft,
            expected_video_state_bloat_bond: video_state_bloat_bond,
            expected_data_object_state_bloat_bond: data_object_state_bloat_bond,
            storage_buckets_num_witness: storage_buckets_num_witness::<T>(channel_id)?,
        },
    ))
}

fn setup_worst_case_scenario_mutable_video<T>(
    assets_num: Option<u32>,
    storage_buckets_num: u32,
) -> Result<(T::VideoId, VideoCreationInputParameters<T>), DispatchError>
where
    T: RuntimeConfig,
    T::AccountId: CreateAccountId,
{
    let p = prepare_worst_case_scenario_video_creation_parameters::<T>(
        assets_num,
        storage_buckets_num,
        None,
        MAX_KILOBYTES_METADATA,
    )?;
    let video_id = Pallet::<T>::next_video_id();
    Pallet::<T>::create_video(RawOrigin::Signed(p.0.clone()).into(), p.1, p.2, p.3.clone())?;

    // setup worst-case scenario repayable bloat bond for video assets
    // (each bloat bond goes to different reciever)
    let video = Pallet::<T>::video_by_id(video_id);
    set_unique_bloat_bond_recievers::<T>(p.2, &Vec::from_iter(video.data_objects.iter().cloned()));

    Ok((video_id, p))
}

fn storage_buckets_num_witness<T: Config>(channel_id: T::ChannelId) -> Result<u32, DispatchError> {
    let bag_id = Pallet::<T>::bag_id_for_channel(&channel_id);
    let channel_bag = <T as Config>::DataObjectStorage::ensure_bag_exists(&bag_id)?;
    Ok(channel_bag.stored_by.len() as u32)
}

fn max_curators_per_group<T: RuntimeConfig>() -> u32 {
    min(
        // substract one to leave space for the lead
        <T as working_group::Config<ContentWorkingGroupInstance>>::MaxWorkerNumberLimit::get() - 1,
        T::MaxNumberOfCuratorsPerGroup::get(),
    )
}

fn create_token_issuance_params<T: Config>(
    initial_allocation: BTreeMap<T::MemberId, TokenAllocationOf<T>>,
) -> TokenIssuanceParametersOf<T> {
    let transfer_policy_commit = <T as frame_system::Config>::Hashing::hash_of(b"commitment");
    let token_symbol = <T as frame_system::Config>::Hashing::hash_of(b"CRT");
    TokenIssuanceParametersOf::<T> {
        initial_allocation,
        symbol: token_symbol,
        transfer_policy: TransferPolicyParamsOf::<T>::Permissioned(WhitelistParamsOf::<T> {
            commitment: transfer_policy_commit,
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
        patronage_rate: DEFAULT_CRT_PATRONAGE_RATE,
        revenue_split_rate: DEFAULT_CRT_REVENUE_SPLIT_RATE,
    }
}

fn default_vesting_schedule_params<T: Config>() -> VestingScheduleParamsOf<T> {
    VestingScheduleParamsOf::<T> {
        linear_vesting_duration: 100u32.into(),
        blocks_before_cliff: 100u32.into(),
        cliff_amount_percentage: Permill::from_percent(10),
    }
}

fn worst_case_scenario_initial_allocation<T: RuntimeConfig>(
    members_num: u32,
) -> BTreeMap<T::MemberId, TokenAllocationOf<T>>
where
    T::AccountId: CreateAccountId,
{
    (0..members_num)
        .map(|_| {
            let (_, member_id) = member_funded_account::<T>();
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
        (0u32..T::MaxVestingSchedulesPerAccountPerToken::get()).for_each(|i| {
            a.add_or_update_vesting_schedule::<T>(
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
            )
            .unwrap();
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

fn default_crt_sale_duration<T: Config>() -> T::BlockNumber {
    MinSaleDuration::<T>::get() + T::BlockNumber::one()
}

fn worst_case_scenario_token_sale_params<T: Config>(
    metatada_kb: u32,
    starts_at: Option<T::BlockNumber>,
) -> TokenSaleParamsOf<T> {
    TokenSaleParamsOf::<T> {
        cap_per_member: Some(1_000_000u32.into()),
        duration: default_crt_sale_duration::<T>(),
        starts_at,
        unit_price: DEFAULT_CRT_SALE_PRICE.into(),
        upper_bound_quantity: DEFAULT_CRT_SALE_UPPER_BOUND.into(),
        vesting_schedule_params: Some(default_vesting_schedule_params::<T>()),
        metadata: Some(vec![0xf].repeat((metatada_kb * 1000) as usize)),
    }
}

fn worst_case_scenario_issuer_transfer_outputs<T: RuntimeConfig>(
    num: u32,
) -> TransfersWithVestingOf<T>
where
    T::AccountId: CreateAccountId,
{
    Transfers(
        (0..num)
            .map(|_| {
                let (_, member_id) = member_funded_account::<T>();
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

pub fn transferrable_crt_balance<T: Config>(
    token_id: T::TokenId,
    member_id: T::MemberId,
) -> TokenBalanceOf<T> {
    project_token::Pallet::<T>::account_info_by_token_and_member(token_id, member_id)
        .transferrable::<T>(System::<T>::block_number())
}

fn set_all_channel_paused_features_except<T: Config>(
    channel_id: T::ChannelId,
    exceptions: Vec<crate::PausableChannelFeature>,
) where
    T::AccountId: CreateAccountId,
{
    Pallet::<T>::set_channel_paused_features_as_moderator(
        RawOrigin::Signed(T::AccountId::create_account_id(
            CONTENT_WG_LEADER_ACCOUNT_ID,
        ))
        .into(),
        ContentActor::Lead,
        channel_id,
        all_channel_pausable_features_except(BTreeSet::from_iter(exceptions)),
        b"reason".to_vec(),
    )
    .unwrap();
}

fn set_nft_limits_helper<T: RuntimeConfig>(channel_id: T::ChannelId) {
    let global_daily_limit = 2u64;
    let global_weekly_limit = 14u64;
    let channel_daily_limit = 2u64;
    let channel_weekly_limit = 14u64;

    NftLimitsEnabled::set(true);
    Pallet::<T>::set_nft_limit(NftLimitId::GlobalDaily, global_daily_limit);
    Pallet::<T>::set_nft_limit(NftLimitId::GlobalWeekly, global_weekly_limit);
    Pallet::<T>::set_nft_limit(NftLimitId::ChannelDaily(channel_id), channel_daily_limit);
    Pallet::<T>::set_nft_limit(NftLimitId::ChannelWeekly(channel_id), channel_weekly_limit);
}

fn worst_case_nft_issuance_params_helper<T: RuntimeConfig>(
    whitelist_size: u32,
    metadata_kb: u32,
) -> NftIssuanceParameters<T>
where
    T: RuntimeConfig,
    T::AccountId: CreateAccountId,
{
    NftIssuanceParameters::<T> {
        royalty: Some(Pallet::<T>::max_creator_royalty()),
        nft_metadata: vec![0xff].repeat((metadata_kb * 1000) as usize),
        non_channel_owner: None,
        init_transactional_status: InitTransactionalStatus::<T>::EnglishAuction(
            EnglishAuctionParams::<T> {
                buy_now_price: Some(nft_buy_now_price::<T>()),
                duration: Pallet::<T>::min_auction_duration(),
                extension_period: Pallet::<T>::min_auction_extension_period(),
                min_bid_step: Pallet::<T>::min_bid_step(),
                starting_price: Pallet::<T>::min_starting_price(),
                starts_at: Some(System::<T>::block_number() + T::BlockNumber::one()),
                whitelist: (0..(whitelist_size as usize))
                    .map(|_| member_funded_account::<T>().1)
                    .collect(),
            },
        ),
    }
}

fn setup_idle_nft<T>(
    account_id: T::AccountId,
    actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    video_id: T::VideoId,
    non_channel_owner: bool,
) -> Result<NftData<T>, DispatchError>
where
    T::AccountId: CreateAccountId,
    T: RuntimeConfig,
{
    setup_nft_with_transactional_status::<T>(
        account_id,
        actor,
        video_id,
        non_channel_owner,
        InitTransactionalStatus::<T>::Idle,
    )
}

fn setup_offered_nft<T>(
    account_id: T::AccountId,
    actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    video_id: T::VideoId,
    non_channel_owner: bool,
    to_member: T::MemberId,
    price: Option<BalanceOf<T>>,
) -> Result<NftData<T>, DispatchError>
where
    T::AccountId: CreateAccountId,
    T: RuntimeConfig,
{
    setup_nft_with_transactional_status::<T>(
        account_id,
        actor,
        video_id,
        non_channel_owner,
        InitTransactionalStatus::<T>::InitiatedOfferToMember(to_member, price),
    )
}

fn setup_nft_in_buy_now<T>(
    account_id: T::AccountId,
    actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    video_id: T::VideoId,
    non_channel_owner: bool,
    price: BalanceOf<T>,
) -> Result<NftData<T>, DispatchError>
where
    T::AccountId: CreateAccountId,
    T: RuntimeConfig,
{
    setup_nft_with_transactional_status::<T>(
        account_id,
        actor,
        video_id,
        non_channel_owner,
        InitTransactionalStatus::<T>::BuyNow(price),
    )
}

fn setup_nft_in_english_auction<T>(
    account_id: T::AccountId,
    actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    video_id: T::VideoId,
    non_channel_owner: bool,
) -> Result<NftContexts<T>, DispatchError>
where
    T::AccountId: CreateAccountId,
    T: RuntimeConfig,
{
    let whitelist_size = T::MaxNftAuctionWhitelistLength::get();
    assert!(whitelist_size > 1);
    let whitelisted_members = (0..(whitelist_size as usize))
        .map(|_| member_funded_account::<T>())
        .collect::<Vec<_>>();

    let bidders = whitelisted_members[0..=1].to_vec();

    let nft_data = setup_nft_with_transactional_status::<T>(
        account_id,
        actor,
        video_id,
        non_channel_owner,
        InitTransactionalStatus::<T>::EnglishAuction(EnglishAuctionParams::<T> {
            buy_now_price: Some(nft_buy_now_price::<T>()),
            duration: Pallet::<T>::min_auction_duration(),
            extension_period: Pallet::<T>::min_auction_extension_period(),
            min_bid_step: Pallet::<T>::min_bid_step(),
            starting_price: Pallet::<T>::min_starting_price(),
            starts_at: Some(System::<T>::block_number() + T::BlockNumber::one()),
            whitelist: whitelisted_members.into_iter().map(|(_, id)| id).collect(),
        }),
    )
    .unwrap();

    Ok((nft_data, bidders))
}

fn setup_nft_in_open_auction<T>(
    account_id: T::AccountId,
    actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    video_id: T::VideoId,
    non_channel_owner: bool,
) -> Result<NftContext<T>, DispatchError>
where
    T::AccountId: CreateAccountId,
    T: RuntimeConfig,
{
    let whitelist_size = T::MaxNftAuctionWhitelistLength::get();
    assert!(whitelist_size > 1);
    let whitelisted_members = (0..(whitelist_size as usize))
        .map(|_| member_funded_account::<T>())
        .collect::<Vec<_>>();

    let (participant_account_id, participant_id) = whitelisted_members[0].clone();

    let nft_data = setup_nft_with_transactional_status::<T>(
        account_id,
        actor,
        video_id,
        non_channel_owner,
        InitTransactionalStatus::<T>::OpenAuction(OpenAuctionParams::<T> {
            buy_now_price: Some(nft_buy_now_price::<T>()),
            bid_lock_duration: Pallet::<T>::min_bid_lock_duration(),
            starting_price: Pallet::<T>::min_starting_price(),
            starts_at: Some(System::<T>::block_number() + T::BlockNumber::one()),
            whitelist: whitelisted_members.into_iter().map(|(_, id)| id).collect(),
        }),
    )
    .unwrap();

    Ok((nft_data, participant_id, participant_account_id))
}

fn setup_nft_with_transactional_status<T>(
    account_id: T::AccountId,
    actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    video_id: T::VideoId,
    non_channel_owner: bool,
    transactional_status: InitTransactionalStatus<T>,
) -> Result<NftData<T>, DispatchError>
where
    T::AccountId: CreateAccountId,
    T: RuntimeConfig,
{
    let origin = RawOrigin::Signed(account_id.clone()).into();
    let channel_id = Pallet::<T>::video_by_id(video_id).in_channel;

    let (nft_owner_actor, owner_account) = if non_channel_owner {
        let (owner_account, owner_id) = member_funded_account::<T>();
        let nft_owner_actor =
            ContentActor::<T::CuratorGroupId, T::CuratorId, T::MemberId>::Member(owner_id);
        (nft_owner_actor, owner_account)
    } else {
        (actor, account_id)
    };

    set_nft_limits_helper::<T>(channel_id);
    Pallet::<T>::issue_nft(
        origin,
        actor,
        video_id,
        NftIssuanceParameters::<T> {
            royalty: Some(Pallet::<T>::max_creator_royalty()),
            nft_metadata: Vec::new(),
            non_channel_owner: match nft_owner_actor {
                ContentActor::<T::CuratorGroupId, T::CuratorId, T::MemberId>::Member(member_id) => {
                    Some(member_id)
                }
                _ => None,
            },
            init_transactional_status: transactional_status,
        },
    )
    .unwrap();

    Ok((nft_owner_actor, owner_account))
}

fn add_english_auction_bid<T: Config>(
    sender: T::AccountId,
    participant_id: T::MemberId,
    video_id: T::VideoId,
) -> BalanceOf<T> {
    let bid_amount = nft_buy_now_price::<T>() - Pallet::<T>::min_bid_step();
    let origin: T::Origin = RawOrigin::Signed(sender).into();
    Pallet::<T>::make_english_auction_bid(origin, participant_id, video_id, bid_amount).unwrap();
    bid_amount
}

fn add_open_auction_bid<T: Config>(
    sender: T::AccountId,
    participant_id: T::MemberId,
    video_id: T::VideoId,
) -> OpenAuctionBid<T> {
    let bid_amount = nft_buy_now_price::<T>() - 1u32.into();
    let origin: T::Origin = RawOrigin::Signed(sender).into();
    Pallet::<T>::make_open_auction_bid(origin, participant_id, video_id, bid_amount).unwrap();
    Pallet::<T>::open_auction_bid_by_video_and_member(video_id, participant_id)
}

fn set_all_channel_paused_features<T: Config>(channel_id: T::ChannelId)
where
    T::AccountId: CreateAccountId,
{
    set_all_channel_paused_features_except::<T>(channel_id, vec![]);
}

fn call_activate_amm<T: Config>(
    sender: T::AccountId,
    actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel_id: T::ChannelId,
) {
    let params = AmmParams {
        slope: Permill::from_percent(10),
        intercept: Permill::from_percent(10),
    };
    Pallet::<T>::activate_amm(RawOrigin::Signed(sender).into(), actor, channel_id, params).unwrap()
}
