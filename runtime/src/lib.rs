//! The Joystream Substrate Node runtime.

#![cfg_attr(not(feature = "std"), no_std)]
// `construct_runtime!` does a lot of recursion and requires us to increase the limit to 256.
#![recursion_limit = "256"]
//Substrate internal issues.
#![allow(clippy::large_enum_variant)]
#![allow(clippy::unnecessary_mut_passed)]

// Make the WASM binary available.
// This is required only by the node build.
// A dummy wasm_binary.rs will be built for the IDE.
#[cfg(feature = "std")]
include!(concat!(env!("OUT_DIR"), "/wasm_binary.rs"));

mod constants;
mod integration;
pub mod primitives;
mod proposals_configuration;
mod runtime_api;
#[cfg(test)]
mod tests;
/// Weights for pallets used in the runtime.
mod weights; // Runtime integration tests

#[macro_use]
extern crate lazy_static; // for proposals_configuration module

use frame_support::traits::{
    Currency, KeyOwnerProofSystem, LockIdentifier, OnUnbalanced,
};
use frame_support::weights::{
    constants::{BlockExecutionWeight, ExtrinsicBaseWeight, RocksDbWeight, WEIGHT_PER_SECOND},
    DispatchClass, Weight,
};
use frame_support::{construct_runtime, parameter_types};
use frame_system::{EnsureOneOf, EnsureRoot, EnsureSigned};
use frame_system::limits::{BlockLength, BlockWeights};
use pallet_grandpa::{AuthorityId as GrandpaId, AuthorityList as GrandpaAuthorityList};
use pallet_im_online::sr25519::AuthorityId as ImOnlineId;
use pallet_session::historical as pallet_session_historical;
use sp_authority_discovery::AuthorityId as AuthorityDiscoveryId;
use sp_core::crypto::KeyTypeId;
use sp_core::Hasher;
use sp_runtime::curve::PiecewiseLinear;
use sp_runtime::traits::{BlakeTwo256, OpaqueKeys, AccountIdLookup};
use sp_runtime::{create_runtime_str, generic, impl_opaque_keys, ModuleId, Perbill};
use sp_std::boxed::Box;
use sp_std::vec::Vec;
#[cfg(feature = "std")]
use sp_version::NativeVersion;
use sp_version::RuntimeVersion;

pub use constants::*;
pub use primitives::*;
pub use proposals_configuration::*;
pub use runtime_api::*;

use integration::proposals::{CouncilManager, ExtrinsicProposalEncoder};

use common::working_group::{WorkingGroup, WorkingGroupBudgetHandler};
use council::ReferendumConnection;
use referendum::{CastVote, OptionResult};
use staking_handler::{LockComparator, StakingManager};
use storage::data_object_storage_registry;

// Node dependencies
pub use common;
pub use content_directory;
pub use content_directory::{
    HashedTextMaxLength, InputValidationLengthConstraint, MaxNumber, TextMaxLength, VecMaxLength,
};
pub use council;
pub use forum;
pub use membership;

#[cfg(any(feature = "std", test))]
pub use pallet_balances::Call as BalancesCall;
pub use pallet_staking::StakerStatus;
pub use proposals_engine::ProposalParameters;
pub use referendum;
pub use storage::{data_directory, data_object_type_registry};
pub use working_group;

#[cfg(feature = "std")]
/// Wasm binary unwrapped. If built with `BUILD_DUMMY_WASM_BINARY`, the function panics.
pub fn wasm_binary_unwrap() -> &'static [u8] {
    WASM_BINARY.expect(
        "Development wasm binary is not available. This means the client is \
        built with `BUILD_DUMMY_WASM_BINARY` flag and it is only usable for \
        production chains. Please rebuild with the flag disabled.",
    )
}

/// This runtime version.
pub const VERSION: RuntimeVersion = RuntimeVersion {
    spec_name: create_runtime_str!("joystream-node"),
    impl_name: create_runtime_str!("joystream-node"),
    authoring_version: 8,
    spec_version: 1,
    impl_version: 0,
    apis: crate::runtime_api::EXPORTED_RUNTIME_API_VERSIONS,
    transaction_version: 1,
};

/// The version information used to identify this runtime when compiled natively.
#[cfg(feature = "std")]
pub fn native_version() -> NativeVersion {
    NativeVersion {
        runtime_version: VERSION,
        can_author_with: Default::default(),
    }
}

/// We assume that ~10% of the block weight is consumed by `on_initalize` handlers.
/// This is used to limit the maximal weight of a single extrinsic.
const AVERAGE_ON_INITIALIZE_RATIO: Perbill = Perbill::from_percent(10);
/// We allow `Normal` extrinsics to fill up the block up to 75%, the rest can be used
/// by  Operational  extrinsics.
const NORMAL_DISPATCH_RATIO: Perbill = Perbill::from_percent(75);
/// We allow for 2 seconds of compute with a 12 second average block time.
const MAXIMUM_BLOCK_WEIGHT: Weight = WEIGHT_PER_SECOND * 2;

parameter_types! {
    pub const BlockHashCount: BlockNumber = 900; // mortal tx can be valid up to 1 hour after signing
    pub const Version: RuntimeVersion = VERSION;
    pub RuntimeBlockLength: BlockLength =
        BlockLength::max_with_normal_ratio(5 * 1024 * 1024, NORMAL_DISPATCH_RATIO);
    pub RuntimeBlockWeights: BlockWeights = BlockWeights::builder()
        .base_block(BlockExecutionWeight::get())
        .for_class(DispatchClass::all(), |weights| {
            weights.base_extrinsic = ExtrinsicBaseWeight::get();
        })
        .for_class(DispatchClass::Normal, |weights| {
            weights.max_total = Some(NORMAL_DISPATCH_RATIO * MAXIMUM_BLOCK_WEIGHT);
        })
        .for_class(DispatchClass::Operational, |weights| {
            weights.max_total = Some(MAXIMUM_BLOCK_WEIGHT);
            // Operational transactions have some extra reserved space, so that they
            // are included even if block reached `MAXIMUM_BLOCK_WEIGHT`.
            weights.reserved = Some(
                MAXIMUM_BLOCK_WEIGHT - NORMAL_DISPATCH_RATIO * MAXIMUM_BLOCK_WEIGHT
            );
        })
        .avg_block_initialization(AVERAGE_ON_INITIALIZE_RATIO)
        .build_or_panic();
    pub const SS58Prefix: u8 = 42; // Ss58AddressFormat::SubstrateAccount
}

// TODO: We need to adjust weight of this pallet
// once we move to a newer version of substrate where parameters
// are not discarded. See the comment in 'scripts/generate-weights.sh'
impl frame_system::Config for Runtime {
    /// The basic call filter to use in dispatchable.
    type BaseCallFilter = ();
    /// Block & extrinsics weights: base values and limits.
    type BlockWeights = RuntimeBlockWeights;
    /// The maximum length of a block (in bytes).
    type BlockLength = RuntimeBlockLength;
    /// The identifier used to distinguish between accounts.
    type AccountId = AccountId;
    /// The aggregated dispatch type that is available for extrinsics.
    type Call = Call;
    /// The lookup mechanism to get account ID from whatever is passed in dispatchers.
    type Lookup = AccountIdLookup<AccountId, ()>;
    /// The index type for storing how many extrinsics an account has signed.
    type Index = Index;
    /// The index type for blocks.
    type BlockNumber = BlockNumber;
    /// The type for hashing blocks and tries.
    type Hash = Hash;
    /// The hashing algorithm used.
    type Hashing = BlakeTwo256;
    /// The header type.
    type Header = generic::Header<BlockNumber, BlakeTwo256>;
    /// The ubiquitous event type.
    type Event = Event;
    /// The ubiquitous origin type.
    type Origin = Origin;
    /// Maximum number of block number to block hash mappings to keep (oldest pruned first).
    type BlockHashCount = BlockHashCount;
    /// The weight of database operations that the runtime can invoke.
    type DbWeight = RocksDbWeight;
    /// Version of the runtime.
    type Version = Version;
    /// Converts a Pallet to the index of the Pallet in `construct_runtime!`.
    ///
    /// This type is being generated by `construct_runtime!`.
    type PalletInfo = PalletInfo;
    /// What to do if a new account is created.
    type OnNewAccount = ();
    /// What to do if an account is fully reaped from the system.
    type OnKilledAccount = ();
    /// The data to be stored in an account.
    type AccountData = pallet_balances::AccountData<Balance>;
    /// Weight information for the extrinsics of this pallet.
    type SystemWeightInfo = ();
    /// This is used as an identifier of the chain. 42 is the generic substrate prefix.
    type SS58Prefix = SS58Prefix;
}

impl substrate_utility::Config for Runtime {
    type Event = Event;
    type Call = Call;
    type WeightInfo = weights::substrate_utility::WeightInfo;
}

parameter_types! {
    pub const EpochDuration: u64 = EPOCH_DURATION_IN_SLOTS as u64;
    pub const ReportLongevity: u64 =
            BondingDuration::get() as u64 * SessionsPerEra::get() as u64 *
    EpochDuration::get();
    pub const ExpectedBlockTime: Moment = MILLISECS_PER_BLOCK;
}

impl pallet_babe::Config for Runtime {
    type EpochDuration = EpochDuration;
    type ExpectedBlockTime = ExpectedBlockTime;
    type EpochChangeTrigger = pallet_babe::ExternalTrigger;
    type KeyOwnerProofSystem = Historical;

    type KeyOwnerProof = <Self::KeyOwnerProofSystem as KeyOwnerProofSystem<(
        KeyTypeId,
        pallet_babe::AuthorityId,
    )>>::Proof;

    type KeyOwnerIdentification = <Self::KeyOwnerProofSystem as KeyOwnerProofSystem<(
        KeyTypeId,
        pallet_babe::AuthorityId,
    )>>::IdentificationTuple;

    type HandleEquivocation = pallet_babe::EquivocationHandler<
        Self::KeyOwnerIdentification,
        Offences,
        ReportLongevity,
    >;

    type WeightInfo = ();
}

impl pallet_grandpa::Config for Runtime {
    type Event = Event;
    type Call = Call;
    type KeyOwnerProof =
        <Self::KeyOwnerProofSystem as KeyOwnerProofSystem<(KeyTypeId, GrandpaId)>>::Proof;

    type KeyOwnerIdentification = <Self::KeyOwnerProofSystem as KeyOwnerProofSystem<(
        KeyTypeId,
        GrandpaId,
    )>>::IdentificationTuple;

    type KeyOwnerProofSystem = Historical;

    type HandleEquivocation =
        pallet_grandpa::EquivocationHandler<Self::KeyOwnerIdentification, Offences, ReportLongevity>;
    type WeightInfo = ();
}

impl<LocalCall> frame_system::offchain::CreateSignedTransaction<LocalCall> for Runtime
where
    Call: From<LocalCall>,
{
    fn create_transaction<C: frame_system::offchain::AppCrypto<Self::Public, Self::Signature>>(
        call: Call,
        public: <Signature as sp_runtime::traits::Verify>::Signer,
        account: AccountId,
        nonce: Index,
    ) -> Option<(
        Call,
        <UncheckedExtrinsic as sp_runtime::traits::Extrinsic>::SignaturePayload,
    )> {
        integration::transactions::create_transaction::<C>(call, public, account, nonce)
    }
}

impl frame_system::offchain::SigningTypes for Runtime {
    type Public = <Signature as sp_runtime::traits::Verify>::Signer;
    type Signature = Signature;
}

impl<C> frame_system::offchain::SendTransactionTypes<C> for Runtime
where
    Call: From<C>,
{
    type Extrinsic = UncheckedExtrinsic;
    type OverarchingCall = Call;
}

parameter_types! {
    pub const MinimumPeriod: Moment = SLOT_DURATION / 2;
}

impl pallet_timestamp::Config for Runtime {
    type Moment = Moment;
    type OnTimestampSet = Babe;
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = weights::pallet_timestamp::WeightInfo;
}

parameter_types! {
    pub const MaxLocks: u32 = 50;
}

impl pallet_balances::Config for Runtime {
    type Balance = Balance;
    type DustRemoval = ();
    type Event = Event;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type WeightInfo = weights::pallet_balances::WeightInfo;
    type MaxLocks = MaxLocks;
}

parameter_types! {
    pub const TransactionByteFee: Balance = 1;
}

type NegativeImbalance = <Balances as Currency<AccountId>>::NegativeImbalance;

pub struct Author;
impl OnUnbalanced<NegativeImbalance> for Author {
    fn on_nonzero_unbalanced(amount: NegativeImbalance) {
        Balances::resolve_creating(&Authorship::author(), amount);
    }
}

impl pallet_transaction_payment::Config for Runtime {
    type OnChargeTransaction = pallet_transaction_payment::CurrencyAdapter<Balances, ()>;
    type TransactionByteFee = TransactionByteFee;
    type WeightToFee = constants::fees::WeightToFee;
    type FeeMultiplierUpdate = constants::fees::SlowAdjustingFeeUpdate<Self>;
}

impl pallet_sudo::Config for Runtime {
    type Event = Event;
    type Call = Call;
}

parameter_types! {
    pub const UncleGenerations: BlockNumber = 0;
}

impl pallet_authorship::Config for Runtime {
    type FindAuthor = pallet_session::FindAccountFromAuthorIndex<Self, Babe>;
    type UncleGenerations = UncleGenerations;
    type FilterUncle = ();
    type EventHandler = (Staking, ImOnline);
}

impl_opaque_keys! {
    pub struct SessionKeys {
        pub grandpa: Grandpa,
        pub babe: Babe,
        pub im_online: ImOnline,
        pub authority_discovery: AuthorityDiscovery,
    }
}
// NOTE: `SessionHandler` and `SessionKeys` are co-dependent: One key will be used for each handler.
// The number and order of items in `SessionHandler` *MUST* be the same number and order of keys in
// `SessionKeys`.
// TODO: Introduce some structure to tie these together to make it a bit less of a footgun. This
// should be easy, since OneSessionHandler trait provides the `Key` as an associated type. #2858
parameter_types! {
    pub const DisabledValidatorsThreshold: Perbill = Perbill::from_percent(17);
}

impl pallet_session::Config for Runtime {
    type Event = Event;
    type ValidatorId = AccountId;
    type ValidatorIdOf = pallet_staking::StashOf<Self>;
    type ShouldEndSession = Babe;
    type NextSessionRotation = Babe;
    type SessionManager = pallet_session::historical::NoteHistoricalRoot<Self, Staking>;
    type SessionHandler = <SessionKeys as OpaqueKeys>::KeyTypeIdProviders;
    type Keys = SessionKeys;
    type DisabledValidatorsThreshold = DisabledValidatorsThreshold;
    type WeightInfo = weights::pallet_session::WeightInfo;
}

impl pallet_session::historical::Config for Runtime {
    type FullIdentification = pallet_staking::Exposure<AccountId, Balance>;
    type FullIdentificationOf = pallet_staking::ExposureOf<Runtime>;
}

pallet_staking_reward_curve::build! {
    const REWARD_CURVE: PiecewiseLinear<'static> = curve!(
        min_inflation: 0_050_000,
        max_inflation: 0_750_000,
        ideal_stake: 0_250_000,
        falloff: 0_050_000,
        max_piece_count: 100,
        test_precision: 0_005_000,
    );
}

parameter_types! {
    pub const SessionDuration: BlockNumber = EPOCH_DURATION_IN_SLOTS as _;
    pub const ImOnlineUnsignedPriority: TransactionPriority = TransactionPriority::max_value();
    /// We prioritize im-online heartbeats over election solution submission.
    pub const StakingUnsignedPriority: TransactionPriority = TransactionPriority::max_value() / 2;
}

parameter_types! {
    pub const SessionsPerEra: sp_staking::SessionIndex = 6;
    pub const BondingDuration: pallet_staking::EraIndex = BONDING_DURATION;
    pub const SlashDeferDuration: pallet_staking::EraIndex = BONDING_DURATION - 1; // 'slightly less' than the bonding duration.
    pub const RewardCurve: &'static PiecewiseLinear<'static> = &REWARD_CURVE;
    pub const MaxNominatorRewardedPerValidator: u32 = 64;
    pub const ElectionLookahead: BlockNumber = EPOCH_DURATION_IN_BLOCKS / 4;
    pub const MaxIterations: u32 = 10;
    // 0.05%. The higher the value, the more strict solution acceptance becomes.
    pub MinSolutionScoreBump: Perbill = Perbill::from_rational_approximation(5u32, 10_000);
}

impl pallet_staking::Config for Runtime {
    type Currency = Balances;
    type UnixTime = Timestamp;
    type CurrencyToVote = frame_support::traits::SaturatingCurrencyToVote;
    type RewardRemainder = (); // Could be Treasury.
    type Event = Event;
    type Slash = (); // Where to send the slashed funds. Could be Treasury.
    type Reward = (); // Rewards are minted from the void.
    type SessionsPerEra = SessionsPerEra;
    type BondingDuration = BondingDuration;
    type SlashDeferDuration = SlashDeferDuration;
    type SlashCancelOrigin = EnsureRoot<AccountId>; // Requires sudo. Parity recommends: a super-majority of the council can cancel the slash.
    type SessionInterface = Self;
    type RewardCurve = RewardCurve;
    type NextNewSession = Session;
    type ElectionLookahead = ElectionLookahead;
    type Call = Call;
    type MaxIterations = MaxIterations;
    type MinSolutionScoreBump = MinSolutionScoreBump;
    type MaxNominatorRewardedPerValidator = MaxNominatorRewardedPerValidator;
    type UnsignedPriority = StakingUnsignedPriority;
    type WeightInfo = weights::pallet_staking::WeightInfo;
    type OffchainSolutionWeightLimit = ();
}

impl pallet_im_online::Config for Runtime {
    type AuthorityId = ImOnlineId;
    type Event = Event;
    type ValidatorSet = Historical;
    type SessionDuration = SessionDuration;
    type ReportUnresponsiveness = Offences;
    // Using the default weights until we check if we can run the benchmarks for this pallet in
    // the reference machine in an acceptable time.
    type WeightInfo = ();
    type UnsignedPriority = ImOnlineUnsignedPriority;
}

impl pallet_offences::Config for Runtime {
    type Event = Event;
    type IdentificationTuple = pallet_session::historical::IdentificationTuple<Self>;
    type OnOffenceHandler = Staking;
    type WeightSoftLimit = ();
}

impl pallet_authority_discovery::Config for Runtime {}

parameter_types! {
    pub const WindowSize: BlockNumber = 101;
    pub const ReportLatency: BlockNumber = 1000;
}

type EntityId = <Runtime as content_directory::Config>::EntityId;

parameter_types! {
    pub const PropertyNameLengthConstraint: InputValidationLengthConstraint = InputValidationLengthConstraint::new(1, 49);
    pub const PropertyDescriptionLengthConstraint: InputValidationLengthConstraint = InputValidationLengthConstraint::new(1, 500);
    pub const ClassNameLengthConstraint: InputValidationLengthConstraint = InputValidationLengthConstraint::new(1, 49);
    pub const ClassDescriptionLengthConstraint: InputValidationLengthConstraint = InputValidationLengthConstraint::new(1, 500);
    pub const MaxNumberOfClasses: MaxNumber = 100;
    pub const MaxNumberOfMaintainersPerClass: MaxNumber = 10;
    pub const MaxNumberOfSchemasPerClass: MaxNumber = 20;
    pub const MaxNumberOfPropertiesPerSchema: MaxNumber = 40;
    pub const MaxNumberOfEntitiesPerClass: MaxNumber = 5000;
    pub const MaxNumberOfCuratorsPerGroup: MaxNumber = 50;
    pub const MaxNumberOfOperationsDuringAtomicBatching: MaxNumber = 500;
    pub const VecMaxLengthConstraint: VecMaxLength = 200;
    pub const TextMaxLengthConstraint: TextMaxLength = 5000;
    pub const HashedTextMaxLengthConstraint: HashedTextMaxLength = Some(25000);
    pub const IndividualEntitiesCreationLimit: EntityId = 500;
}

impl content_directory::Config for Runtime {
    type Event = Event;
    type Nonce = u64;
    type ClassId = u64;
    type EntityId = u64;
    type CuratorGroupId = u64;
    type PropertyNameLengthConstraint = PropertyNameLengthConstraint;
    type PropertyDescriptionLengthConstraint = PropertyDescriptionLengthConstraint;
    type ClassNameLengthConstraint = ClassNameLengthConstraint;
    type ClassDescriptionLengthConstraint = ClassDescriptionLengthConstraint;
    type MaxNumberOfClasses = MaxNumberOfClasses;
    type MaxNumberOfMaintainersPerClass = MaxNumberOfMaintainersPerClass;
    type MaxNumberOfCuratorsPerGroup = MaxNumberOfCuratorsPerGroup;
    type MaxNumberOfSchemasPerClass = MaxNumberOfSchemasPerClass;
    type MaxNumberOfPropertiesPerSchema = MaxNumberOfPropertiesPerSchema;
    type MaxNumberOfOperationsDuringAtomicBatching = MaxNumberOfOperationsDuringAtomicBatching;
    type VecMaxLengthConstraint = VecMaxLengthConstraint;
    type TextMaxLengthConstraint = TextMaxLengthConstraint;
    type HashedTextMaxLengthConstraint = HashedTextMaxLengthConstraint;
    type MaxNumberOfEntitiesPerClass = MaxNumberOfEntitiesPerClass;
    type IndividualEntitiesCreationLimit = IndividualEntitiesCreationLimit;
    type WorkingGroup = ContentDirectoryWorkingGroup;
    type MemberOriginValidator = Members;
}

// The referendum instance alias.
pub type ReferendumInstance = referendum::Instance1;
pub type ReferendumModule = referendum::Module<Runtime, ReferendumInstance>;
pub type CouncilModule = council::Module<Runtime>;

parameter_types! {
    // referendum parameters
    pub const MaxSaltLength: u64 = 32;
    pub const VoteStageDuration: BlockNumber = 5;
    pub const RevealStageDuration: BlockNumber = 7;
    pub const MinimumVotingStake: u64 = 10000;

    // council parameteres
    pub const MinNumberOfExtraCandidates: u64 = 1;
    pub const AnnouncingPeriodDuration: BlockNumber = 15;
    pub const IdlePeriodDuration: BlockNumber = 27;
    pub const CouncilSize: u64 = 3;
    pub const MinCandidateStake: u64 = 11000;
    pub const ElectedMemberRewardPeriod: BlockNumber = 10;
    pub const DefaultBudgetIncrement: u64 = 1000;
    pub const BudgetRefillPeriod: BlockNumber = 1000;
    pub const MaxWinnerTargetCount: u64 = 10;
}

impl referendum::Config<ReferendumInstance> for Runtime {
    type Event = Event;

    type MaxSaltLength = MaxSaltLength;

    type StakingHandler = staking_handler::StakingManager<Self, VotingLockId>;

    type ManagerOrigin =
        EnsureOneOf<Self::AccountId, EnsureSigned<Self::AccountId>, EnsureRoot<Self::AccountId>>;

    type VotePower = Balance;

    type VoteStageDuration = VoteStageDuration;
    type RevealStageDuration = RevealStageDuration;

    type MinimumStake = MinimumVotingStake;

    type WeightInfo = weights::referendum::WeightInfo;
    type MaxWinnerTargetCount = MaxWinnerTargetCount;

    fn calculate_vote_power(
        _account_id: &<Self as frame_system::Config>::AccountId,
        stake: &Balance,
    ) -> Self::VotePower {
        *stake
    }

    fn can_unlock_vote_stake(vote: &CastVote<Self::Hash, Balance, Self::MemberId>) -> bool {
        <CouncilModule as ReferendumConnection<Runtime>>::can_unlock_vote_stake(vote).is_ok()
    }

    fn process_results(winners: &[OptionResult<Self::MemberId, Self::VotePower>]) {
        let tmp_winners: Vec<OptionResult<Self::MemberId, Self::VotePower>> = winners
            .iter()
            .map(|item| OptionResult {
                option_id: item.option_id,
                vote_power: item.vote_power,
            })
            .collect();
        <CouncilModule as ReferendumConnection<Runtime>>::recieve_referendum_results(
            tmp_winners.as_slice(),
        );
    }

    fn is_valid_option_id(option_index: &u64) -> bool {
        <CouncilModule as ReferendumConnection<Runtime>>::is_valid_candidate_id(option_index)
    }

    fn get_option_power(option_id: &u64) -> Self::VotePower {
        <CouncilModule as ReferendumConnection<Runtime>>::get_option_power(option_id)
    }

    fn increase_option_power(option_id: &u64, amount: &Self::VotePower) {
        <CouncilModule as ReferendumConnection<Runtime>>::increase_option_power(option_id, amount);
    }
}

impl council::Config for Runtime {
    type Event = Event;

    type Referendum = ReferendumModule;

    type MinNumberOfExtraCandidates = MinNumberOfExtraCandidates;
    type CouncilSize = CouncilSize;
    type AnnouncingPeriodDuration = AnnouncingPeriodDuration;
    type IdlePeriodDuration = IdlePeriodDuration;
    type MinCandidateStake = MinCandidateStake;

    type CandidacyLock = StakingManager<Self, CandidacyLockId>;
    type CouncilorLock = StakingManager<Self, CouncilorLockId>;

    type StakingAccountValidator = Members;

    type ElectedMemberRewardPeriod = ElectedMemberRewardPeriod;

    type BudgetRefillPeriod = BudgetRefillPeriod;

    type WeightInfo = weights::council::WeightInfo;

    fn new_council_elected(_elected_members: &[council::CouncilMemberOf<Self>]) {
        <proposals_engine::Module<Runtime>>::reject_active_proposals();
        <proposals_engine::Module<Runtime>>::reactivate_pending_constitutionality_proposals();
    }

    type MemberOriginValidator = Members;
}

impl memo::Config for Runtime {
    type Event = Event;
}

parameter_types! {
    pub const MaxObjectsPerInjection: u32 = 100;
}

impl storage::data_object_type_registry::Config for Runtime {
    type Event = Event;
    type DataObjectTypeId = u64;
    type WorkingGroup = StorageWorkingGroup;
}

impl storage::data_directory::Config for Runtime {
    type Event = Event;
    type ContentId = ContentId;
    type StorageProviderHelper = integration::storage::StorageProviderHelper;
    type IsActiveDataObjectType = DataObjectTypeRegistry;
    type MemberOriginValidator = Members;
    type MaxObjectsPerInjection = MaxObjectsPerInjection;
}

impl storage::data_object_storage_registry::Config for Runtime {
    type Event = Event;
    type DataObjectStorageRelationshipId = u64;
    type ContentIdExists = DataDirectory;
}

impl common::membership::Config for Runtime {
    type MemberId = MemberId;
    type ActorId = ActorId;
}

parameter_types! {
    pub const DefaultMembershipPrice: Balance = 100;
    pub const ReferralCutMaximumPercent: u8 = 50;
    pub const DefaultInitialInvitationBalance: Balance = 100;
    // The candidate stake should be more than the transaction fee which currently is 53
    pub const CandidateStake: Balance = 200;
}

impl membership::Config for Runtime {
    type Event = Event;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type DefaultInitialInvitationBalance = DefaultInitialInvitationBalance;
    type InvitedMemberStakingHandler = InvitedMemberStakingManager;
    type StakingCandidateStakingHandler = StakingCandidateStakingHandler;
    type WorkingGroup = MembershipWorkingGroup;
    type WeightInfo = weights::membership::WeightInfo;
    type ReferralCutMaximumPercent = ReferralCutMaximumPercent;
    type CandidateStake = CandidateStake;
}

parameter_types! {
    pub const MaxCategoryDepth: u64 = 6;
    pub const MaxSubcategories: u64 = 20;
    pub const MaxThreadsInCategory: u64 = 20;
    pub const MaxPostsInThread: u64 = 20;
    pub const MaxModeratorsForCategory: u64 = 20;
    pub const MaxCategories: u64 = 20;
    pub const MaxPollAlternativesNumber: u64 = 20;
    pub const ThreadDeposit: u64 = 30;
    pub const PostDeposit: u64 = 10;
    pub const ForumModuleId: ModuleId = ModuleId(*b"mo:forum"); // module : forum
    pub const PostLifeTime: BlockNumber = 3600;
}

pub struct MapLimits;

impl forum::StorageLimits for MapLimits {
    type MaxSubcategories = MaxSubcategories;
    type MaxModeratorsForCategory = MaxModeratorsForCategory;
    type MaxCategories = MaxCategories;
    type MaxPollAlternativesNumber = MaxPollAlternativesNumber;
}

impl forum::Config for Runtime {
    type Event = Event;
    type ThreadId = ThreadId;
    type PostId = PostId;
    type CategoryId = u64;
    type PostReactionId = u64;
    type MaxCategoryDepth = MaxCategoryDepth;

    type ThreadDeposit = ThreadDeposit;
    type PostDeposit = PostDeposit;
    type ModuleId = ForumModuleId;

    type MapLimits = MapLimits;
    type WeightInfo = weights::forum::WeightInfo;

    fn calculate_hash(text: &[u8]) -> Self::Hash {
        Self::Hashing::hash(text)
    }

    type WorkingGroup = ForumWorkingGroup;
    type MemberOriginValidator = Members;
    type PostLifeTime = PostLifeTime;
}

impl LockComparator<<Runtime as pallet_balances::Config>::Balance> for Runtime {
    fn are_locks_conflicting(new_lock: &LockIdentifier, existing_locks: &[LockIdentifier]) -> bool {
        existing_locks
            .iter()
            .any(|lock| !ALLOWED_LOCK_COMBINATIONS.contains(&(*new_lock, *lock)))
    }
}

parameter_types! {
    pub const MaxWorkerNumberLimit: u32 = 100;
    pub const MinUnstakingPeriodLimit: u32 = 43200;
    pub const ForumWorkingGroupRewardPeriod: u32 = 14400 + 10;
    pub const StorageWorkingGroupRewardPeriod: u32 = 14400 + 20;
    pub const ContentWorkingGroupRewardPeriod: u32 = 14400 + 30;
    pub const MembershipRewardPeriod: u32 = 14400 + 40;
    // This should be more costly than `apply_on_opening` fee with the current configuration
    // the base cost of `apply_on_opening` in tokens is 193. And has a very slight slope
    // with the lenght with the length of rationale, with 2000 stake we are probably safe.
    pub const MinimumApplicationStake: Balance = 2000;
    // This should be more costly than `add_opening` fee with the current configuration
    // the base cost of `add_opening` in tokens is 81. And has a very slight slope
    // with the lenght with the length of rationale, with 2000 stake we are probably safe.
    pub const LeaderOpeningStake: Balance = 2000;
}

// Staking managers type aliases.
pub type ForumWorkingGroupStakingManager =
    staking_handler::StakingManager<Runtime, ForumGroupLockId>;
pub type ContentDirectoryWorkingGroupStakingManager =
    staking_handler::StakingManager<Runtime, ContentWorkingGroupLockId>;
pub type StorageWorkingGroupStakingManager =
    staking_handler::StakingManager<Runtime, StorageWorkingGroupLockId>;
pub type MembershipWorkingGroupStakingManager =
    staking_handler::StakingManager<Runtime, MembershipWorkingGroupLockId>;
pub type InvitedMemberStakingManager =
    staking_handler::StakingManager<Runtime, InvitedMemberLockId>;
pub type StakingCandidateStakingHandler =
    staking_handler::StakingManager<Runtime, StakingCandidateLockId>;

// The forum working group instance alias.
pub type ForumWorkingGroupInstance = working_group::Instance1;

// The storage working group instance alias.
pub type StorageWorkingGroupInstance = working_group::Instance2;

// The content directory working group instance alias.
pub type ContentDirectoryWorkingGroupInstance = working_group::Instance3;

// The membership working group instance alias.
pub type MembershipWorkingGroupInstance = working_group::Instance4;

impl working_group::Config<ForumWorkingGroupInstance> for Runtime {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = ForumWorkingGroupStakingManager;
    type StakingAccountValidator = Members;
    type MemberOriginValidator = Members;
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = ForumWorkingGroupRewardPeriod;
    type WeightInfo = weights::working_group::WeightInfo;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl working_group::Config<StorageWorkingGroupInstance> for Runtime {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StorageWorkingGroupStakingManager;
    type StakingAccountValidator = Members;
    type MemberOriginValidator = Members;
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = StorageWorkingGroupRewardPeriod;
    type WeightInfo = weights::working_group::WeightInfo;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl working_group::Config<ContentDirectoryWorkingGroupInstance> for Runtime {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = ContentDirectoryWorkingGroupStakingManager;
    type StakingAccountValidator = Members;
    type MemberOriginValidator = Members;
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = ContentWorkingGroupRewardPeriod;
    type WeightInfo = weights::working_group::WeightInfo;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl working_group::Config<MembershipWorkingGroupInstance> for Runtime {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = MembershipWorkingGroupStakingManager;
    type StakingAccountValidator = Members;
    type MemberOriginValidator = Members;
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = MembershipRewardPeriod;
    type WeightInfo = weights::working_group::WeightInfo;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl service_discovery::Config for Runtime {
    type Event = Event;
}

parameter_types! {
    pub const ProposalCancellationFee: u64 = 10000;
    pub const ProposalRejectionFee: u64 = 5000;
    pub const ProposalTitleMaxLength: u32 = 40;
    pub const ProposalDescriptionMaxLength: u32 = 3000;
    pub const ProposalMaxActiveProposalLimit: u32 = 5;
}

impl proposals_engine::Config for Runtime {
    type Event = Event;
    type ProposerOriginValidator = Members;
    type CouncilOriginValidator = Council;
    type TotalVotersCounter = CouncilManager<Self>;
    type ProposalId = u32;
    type StakingHandler = staking_handler::StakingManager<Self, ProposalsLockId>;
    type CancellationFee = ProposalCancellationFee;
    type RejectionFee = ProposalRejectionFee;
    type TitleMaxLength = ProposalTitleMaxLength;
    type DescriptionMaxLength = ProposalDescriptionMaxLength;
    type MaxActiveProposalLimit = ProposalMaxActiveProposalLimit;
    type DispatchableCallCode = Call;
    type ProposalObserver = ProposalsCodex;
    type WeightInfo = weights::proposals_engine::WeightInfo;
    type StakingAccountValidator = Members;
}

impl Default for Call {
    fn default() -> Self {
        panic!("shouldn't call default for Call");
    }
}

parameter_types! {
    pub const MaxWhiteListSize: u32 = 20;
    pub const ProposalsPostDeposit: Balance = 2000;
    // module : proposals_discussion
    pub const ProposalsDiscussionModuleId: ModuleId = ModuleId(*b"mo:prdis");
    pub const ForumPostLifeTime: BlockNumber = 3600;
}

macro_rules! call_wg {
    ($working_group:ident, $function:ident $(,$x:expr)*) => {{
        match $working_group {
            WorkingGroup::Content => <ContentDirectoryWorkingGroup as WorkingGroupBudgetHandler<Runtime>>::$function($($x,)*),
            WorkingGroup::Storage => <StorageWorkingGroup as WorkingGroupBudgetHandler<Runtime>>::$function($($x,)*),
            WorkingGroup::Forum => <ForumWorkingGroup as WorkingGroupBudgetHandler<Runtime>>::$function($($x,)*),
            WorkingGroup::Membership => <MembershipWorkingGroup as WorkingGroupBudgetHandler<Runtime>>::$function($($x,)*),
        }
    }};
}

impl proposals_discussion::Config for Runtime {
    type Event = Event;
    type AuthorOriginValidator = Members;
    type CouncilOriginValidator = Council;
    type ThreadId = ThreadId;
    type PostId = PostId;
    type MaxWhiteListSize = MaxWhiteListSize;
    type WeightInfo = weights::proposals_discussion::WeightInfo;
    type PostDeposit = ProposalsPostDeposit;
    type ModuleId = ProposalsDiscussionModuleId;
    type PostLifeTime = ForumPostLifeTime;
}

impl joystream_utility::Config for Runtime {
    type Event = Event;

    type WeightInfo = weights::joystream_utility::WeightInfo;

    fn get_working_group_budget(working_group: WorkingGroup) -> Balance {
        call_wg!(working_group, get_budget)
    }
    fn set_working_group_budget(working_group: WorkingGroup, budget: Balance) {
        call_wg!(working_group, set_budget, budget)
    }
}

parameter_types! {
    pub const RuntimeUpgradeWasmProposalMaxLength: u32 = 3_000_000;
}

impl proposals_codex::Config for Runtime {
    type Event = Event;
    type MembershipOriginValidator = Members;
    type ProposalEncoder = ExtrinsicProposalEncoder;
    type SetMaxValidatorCountProposalParameters = SetMaxValidatorCountProposalParameters;
    type RuntimeUpgradeProposalParameters = RuntimeUpgradeProposalParameters;
    type SignalProposalParameters = SignalProposalParameters;
    type FundingRequestProposalParameters = FundingRequestProposalParameters;
    type CreateWorkingGroupLeadOpeningProposalParameters =
        CreateWorkingGroupLeadOpeningProposalParameters;
    type FillWorkingGroupLeadOpeningProposalParameters =
        FillWorkingGroupLeadOpeningProposalParameters;
    type UpdateWorkingGroupBudgetProposalParameters = UpdateWorkingGroupBudgetProposalParameters;
    type DecreaseWorkingGroupLeadStakeProposalParameters =
        DecreaseWorkingGroupLeadStakeProposalParameters;
    type SlashWorkingGroupLeadProposalParameters = SlashWorkingGroupLeadProposalParameters;
    type SetWorkingGroupLeadRewardProposalParameters = SetWorkingGroupLeadRewardProposalParameters;
    type TerminateWorkingGroupLeadProposalParameters = TerminateWorkingGroupLeadProposalParameters;
    type AmendConstitutionProposalParameters = AmendConstitutionProposalParameters;
    type CancelWorkingGroupLeadOpeningProposalParameters =
        CancelWorkingGroupLeadOpeningProposalParameters;
    type SetMembershipPriceProposalParameters = SetMembershipPriceProposalParameters;
    type SetCouncilBudgetIncrementProposalParameters = SetCouncilBudgetIncrementProposalParameters;
    type SetCouncilorRewardProposalParameters = SetCouncilorRewardProposalParameters;
    type SetInitialInvitationBalanceProposalParameters =
        SetInitialInvitationBalanceProposalParameters;
    type SetInvitationCountProposalParameters = SetInvitationCountProposalParameters;
    type SetMembershipLeadInvitationQuotaProposalParameters =
        SetMembershipLeadInvitationQuotaProposalParameters;
    type SetReferralCutProposalParameters = SetReferralCutProposalParameters;
    type CreateBlogPostProposalParameters = CreateBlogPostProposalParameters;
    type EditBlogPostProoposalParamters = EditBlogPostProoposalParamters;
    type LockBlogPostProposalParameters = LockBlogPostProposalParameters;
    type UnlockBlogPostProposalParameters = UnlockBlogPostProposalParameters;
    type VetoProposalProposalParameters = VetoProposalProposalParameters;
    type WeightInfo = weights::proposals_codex::WeightInfo;
}

impl pallet_constitution::Config for Runtime {
    type Event = Event;
    type WeightInfo = weights::pallet_constitution::WeightInfo;
}

parameter_types! {
    pub const BountyModuleId: ModuleId = ModuleId(*b"m:bounty"); // module : bounty
    pub const ClosedContractSizeLimit: u32 = 50;
    pub const MinCherryLimit: Balance = 10;
    pub const MinFundingLimit: Balance = 10;
    pub const MinWorkEntrantStake: Balance = 100;
}

impl bounty::Config for Runtime {
    type Event = Event;
    type ModuleId = BountyModuleId;
    type BountyId = u64;
    type Membership = Members;
    type WeightInfo = weights::bounty::WeightInfo;
    type CouncilBudgetManager = Council;
    type StakingHandler = staking_handler::StakingManager<Self, BountyLockId>;
    type EntryId = u64;
    type ClosedContractSizeLimit = ClosedContractSizeLimit;
    type MinCherryLimit = MinCherryLimit;
    type MinFundingLimit = MinFundingLimit;
    type MinWorkEntrantStake = MinWorkEntrantStake;
}

parameter_types! {
    pub const PostsMaxNumber: u64 = 20;
    pub const RepliesMaxNumber: u64 = 100;
    pub const ReplyDeposit: Balance = 2000;
    pub const BlogModuleId: ModuleId = ModuleId(*b"mod:blog"); // module : forum
    pub const ReplyLifetime: BlockNumber = 43_200;
}

pub type BlogInstance = blog::Instance1;
impl blog::Config<BlogInstance> for Runtime {
    type Event = Event;

    type PostsMaxNumber = PostsMaxNumber;
    type ParticipantEnsureOrigin = Members;
    type WeightInfo = weights::blog::WeightInfo;

    type ReplyId = u64;
    type ReplyDeposit = ReplyDeposit;
    type ModuleId = BlogModuleId;
    type ReplyLifetime = ReplyLifetime;
}

/// Forum identifier for category
pub type CategoryId = u64;

/// Opaque types. These are used by the CLI to instantiate machinery that don't need to know
/// the specifics of the runtime. They can then be made to be agnostic over specific formats
/// of data like extrinsics, allowing for them to continue syncing the network through upgrades
/// to even the core datastructures.
pub mod opaque {
    use super::*;

    pub use sp_runtime::OpaqueExtrinsic as UncheckedExtrinsic;

    /// Opaque block header type.
    pub type Header = generic::Header<BlockNumber, BlakeTwo256>;
    /// Opaque block type.
    pub type Block = generic::Block<Header, UncheckedExtrinsic>;
    /// Opaque block identifier type.
    pub type BlockId = generic::BlockId<Block>;
}

construct_runtime!(
    pub enum Runtime where
        Block = Block,
        NodeBlock = opaque::Block,
        UncheckedExtrinsic = UncheckedExtrinsic,
    {
        // Substrate
        System: frame_system::{Module, Call, Storage, Config, Event<T>},
        Utility: substrate_utility::{Module, Call, Event},
        Babe: pallet_babe::{Module, Call, Storage, Config, Inherent, ValidateUnsigned},
        Timestamp: pallet_timestamp::{Module, Call, Storage, Inherent},
        Authorship: pallet_authorship::{Module, Call, Storage, Inherent},
        Balances: pallet_balances::{Module, Call, Storage, Config<T>, Event<T>},
        TransactionPayment: pallet_transaction_payment::{Module, Storage},
        Staking: pallet_staking::{Module, Call, Config<T>, Storage, Event<T>, ValidateUnsigned},
        Session: pallet_session::{Module, Call, Storage, Event, Config<T>},
        Historical: pallet_session_historical::{Module},
        Grandpa: pallet_grandpa::{Module, Call, Storage, Config, Event},
        AuthorityDiscovery: pallet_authority_discovery::{Module, Call, Config},
        ImOnline: pallet_im_online::{Module, Call, Event<T>, Storage, ValidateUnsigned, Config<T>},
        Offences: pallet_offences::{Module, Call, Storage, Event},
        RandomnessCollectiveFlip: pallet_randomness_collective_flip::{Module, Call, Storage},
        Sudo: pallet_sudo::{Module, Call, Config<T>, Storage, Event<T>},
        // Joystream
        Council: council::{Module, Call, Storage, Event<T>, Config<T>},
        Referendum: referendum::<Instance1>::{Module, Call, Storage, Event<T>, Config<T>},
        Memo: memo::{Module, Call, Storage, Event<T>},
        Members: membership::{Module, Call, Storage, Event<T>, Config<T>},
        Forum: forum::{Module, Call, Storage, Event<T>, Config<T>},
        ContentDirectory: content_directory::{Module, Call, Storage, Event<T>, Config<T>},
        Constitution: pallet_constitution::{Module, Call, Storage, Event},
        Bounty: bounty::{Module, Call, Storage, Event<T>},
        Blog: blog::<Instance1>::{Module, Call, Storage, Event<T>},
        JoystreamUtility: joystream_utility::{Module, Call, Event<T>},
        // --- Storage
        DataObjectTypeRegistry: data_object_type_registry::{Module, Call, Storage, Event<T>, Config<T>},
        DataDirectory: data_directory::{Module, Call, Storage, Event<T>},
        DataObjectStorageRegistry: data_object_storage_registry::{Module, Call, Storage, Event<T>, Config<T>},
        Discovery: service_discovery::{Module, Call, Storage, Event<T>},
        // --- Proposals
        ProposalsEngine: proposals_engine::{Module, Call, Storage, Event<T>},
        ProposalsDiscussion: proposals_discussion::{Module, Call, Storage, Event<T>},
        ProposalsCodex: proposals_codex::{Module, Call, Storage, Event<T>},
        // --- Working groups
        ForumWorkingGroup: working_group::<Instance1>::{Module, Call, Storage, Event<T>},
        StorageWorkingGroup: working_group::<Instance2>::{Module, Call, Storage, Event<T>},
        ContentDirectoryWorkingGroup: working_group::<Instance3>::{Module, Call, Storage, Event<T>},
        MembershipWorkingGroup: working_group::<Instance4>::{Module, Call, Storage, Event<T>},
    }
);
