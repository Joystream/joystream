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
mod primitives;
mod runtime_api;
#[cfg(test)]
mod tests; // Runtime integration tests

use frame_support::traits::KeyOwnerProofSystem;
use frame_support::weights::{
    constants::{BlockExecutionWeight, ExtrinsicBaseWeight, RocksDbWeight},
    Weight,
};
use frame_support::{construct_runtime, parameter_types};
use pallet_grandpa::{AuthorityId as GrandpaId, AuthorityList as GrandpaAuthorityList};
use pallet_im_online::sr25519::AuthorityId as ImOnlineId;
use pallet_session::historical as pallet_session_historical;
use sp_authority_discovery::AuthorityId as AuthorityDiscoveryId;
use sp_core::crypto::KeyTypeId;
use sp_runtime::curve::PiecewiseLinear;
use sp_runtime::traits::{BlakeTwo256, Block as BlockT, IdentityLookup, OpaqueKeys, Saturating};
use sp_runtime::{create_runtime_str, generic, impl_opaque_keys, Perbill};
use sp_std::boxed::Box;
use sp_std::vec::Vec;
#[cfg(feature = "std")]
use sp_version::NativeVersion;
use sp_version::RuntimeVersion;
use system::EnsureRoot;

pub use constants::*;
pub use primitives::*;
pub use runtime_api::*;

use integration::proposals::{CouncilManager, ExtrinsicProposalEncoder, MembershipOriginValidator};

use content_working_group as content_wg;
use governance::{council, election};
use storage::{data_directory, data_object_storage_registry, data_object_type_registry};

// Node dependencies
pub use common;
pub use forum;
pub use governance::election_params::ElectionParameters;
#[cfg(any(feature = "std", test))]
pub use pallet_balances::Call as BalancesCall;
pub use pallet_staking::StakerStatus;
pub use proposals_codex::ProposalsConfigParameters;
pub use versioned_store;
pub use working_group;

/// This runtime version.
pub const VERSION: RuntimeVersion = RuntimeVersion {
    spec_name: create_runtime_str!("joystream-node"),
    impl_name: create_runtime_str!("joystream-node"),
    authoring_version: 7,
    spec_version: 0,
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

parameter_types! {
    pub const BlockHashCount: BlockNumber = 250;
    /// We allow for 2 seconds of compute with a 6 second average block time.
    pub const MaximumBlockWeight: Weight = 2 * frame_support::weights::constants::WEIGHT_PER_SECOND;
    pub const AvailableBlockRatio: Perbill = Perbill::from_percent(75);
    pub const MaximumBlockLength: u32 = 5 * 1024 * 1024;
    pub const Version: RuntimeVersion = VERSION;
    /// Assume 10% of weight for average on_initialize calls.
    pub MaximumExtrinsicWeight: Weight =
        AvailableBlockRatio::get().saturating_sub(AVERAGE_ON_INITIALIZE_WEIGHT)
        * MaximumBlockWeight::get();
}
const AVERAGE_ON_INITIALIZE_WEIGHT: Perbill = Perbill::from_percent(10);

// TODO: adjust weight
impl system::Trait for Runtime {
    type BaseCallFilter = ();
    type Origin = Origin;
    type Call = Call;
    type Index = Index;
    type BlockNumber = BlockNumber;
    type Hash = Hash;
    type Hashing = BlakeTwo256;
    type AccountId = AccountId;
    type Lookup = IdentityLookup<AccountId>;
    type Header = generic::Header<BlockNumber, BlakeTwo256>;
    type Event = Event;
    type BlockHashCount = BlockHashCount;
    type MaximumBlockWeight = MaximumBlockWeight;
    type DbWeight = RocksDbWeight;
    type BlockExecutionWeight = BlockExecutionWeight;
    type ExtrinsicBaseWeight = ExtrinsicBaseWeight;
    type MaximumExtrinsicWeight = MaximumExtrinsicWeight;
    type MaximumBlockLength = MaximumBlockLength;
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = Version;
    type ModuleToIndex = ModuleToIndex;
    type AccountData = pallet_balances::AccountData<Balance>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
}

parameter_types! {
    pub const EpochDuration: u64 = EPOCH_DURATION_IN_SLOTS as u64;
    pub const ExpectedBlockTime: Moment = MILLISECS_PER_BLOCK;
}

impl pallet_babe::Trait for Runtime {
    type EpochDuration = EpochDuration;
    type ExpectedBlockTime = ExpectedBlockTime;
    type EpochChangeTrigger = pallet_babe::ExternalTrigger;
}

impl pallet_grandpa::Trait for Runtime {
    type Event = Event;
    type Call = Call;
    type KeyOwnerProof =
        <Self::KeyOwnerProofSystem as KeyOwnerProofSystem<(KeyTypeId, GrandpaId)>>::Proof;

    type KeyOwnerIdentification = <Self::KeyOwnerProofSystem as KeyOwnerProofSystem<(
        KeyTypeId,
        GrandpaId,
    )>>::IdentificationTuple;

    type KeyOwnerProofSystem = Historical;

    type HandleEquivocation = pallet_grandpa::EquivocationHandler<
        Self::KeyOwnerIdentification,
        primitives::report::ReporterAppCrypto,
        Runtime,
        Offences,
    >;
}

impl<LocalCall> system::offchain::CreateSignedTransaction<LocalCall> for Runtime
where
    Call: From<LocalCall>,
{
    fn create_transaction<C: system::offchain::AppCrypto<Self::Public, Self::Signature>>(
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

impl system::offchain::SigningTypes for Runtime {
    type Public = <Signature as sp_runtime::traits::Verify>::Signer;
    type Signature = Signature;
}

impl<C> system::offchain::SendTransactionTypes<C> for Runtime
where
    Call: From<C>,
{
    type Extrinsic = UncheckedExtrinsic;
    type OverarchingCall = Call;
}

parameter_types! {
    pub const MinimumPeriod: Moment = SLOT_DURATION / 2;
}

impl pallet_timestamp::Trait for Runtime {
    type Moment = Moment;
    type OnTimestampSet = Babe;
    type MinimumPeriod = MinimumPeriod;
}

parameter_types! {
    pub const ExistentialDeposit: u128 = 0;
    pub const TransferFee: u128 = 0;
    pub const CreationFee: u128 = 0;
    pub const InitialMembersBalance: u32 = 2000;
}

impl pallet_balances::Trait for Runtime {
    type Balance = Balance;
    type DustRemoval = ();
    type Event = Event;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
}

parameter_types! {
    pub const TransactionByteFee: Balance = 0; // TODO: adjust fee
}

impl pallet_transaction_payment::Trait for Runtime {
    type Currency = Balances;
    type OnTransactionPayment = ();
    type TransactionByteFee = TransactionByteFee;
    type WeightToFee = integration::transactions::NoWeights; // TODO: adjust weight
    type FeeMultiplierUpdate = (); // TODO: adjust fee
}

impl pallet_sudo::Trait for Runtime {
    type Event = Event;
    type Call = Call;
}

parameter_types! {
    pub const UncleGenerations: BlockNumber = 5;
}

impl pallet_authorship::Trait for Runtime {
    type FindAuthor = pallet_session::FindAccountFromAuthorIndex<Self, Babe>;
    type UncleGenerations = UncleGenerations;
    type FilterUncle = ();
    type EventHandler = Staking;
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

impl pallet_session::Trait for Runtime {
    type Event = Event;
    type ValidatorId = AccountId;
    type ValidatorIdOf = pallet_staking::StashOf<Self>;
    type ShouldEndSession = Babe;
    type NextSessionRotation = Babe;
    type SessionManager = pallet_session::historical::NoteHistoricalRoot<Self, Staking>;
    type SessionHandler = <SessionKeys as OpaqueKeys>::KeyTypeIdProviders;
    type Keys = SessionKeys;
    type DisabledValidatorsThreshold = DisabledValidatorsThreshold;
}

impl pallet_session::historical::Trait for Runtime {
    type FullIdentification = pallet_staking::Exposure<AccountId, Balance>;
    type FullIdentificationOf = pallet_staking::ExposureOf<Runtime>;
}

pallet_staking_reward_curve::build! {
    const REWARD_CURVE: PiecewiseLinear<'static> = curve!(
        min_inflation: 0_025_000,
        max_inflation: 0_300_000,
        ideal_stake: 0_300_000,
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
    pub const BondingDuration: pallet_staking::EraIndex = 24;
    pub const SlashDeferDuration: pallet_staking::EraIndex = 6; // 1/4 the bonding duration.
    pub const RewardCurve: &'static PiecewiseLinear<'static> = &REWARD_CURVE;
    pub const MaxNominatorRewardedPerValidator: u32 = 64;
    pub const ElectionLookahead: BlockNumber = EPOCH_DURATION_IN_BLOCKS / 4;
    pub const MaxIterations: u32 = 10;
    // 0.05%. The higher the value, the more strict solution acceptance becomes.
    pub MinSolutionScoreBump: Perbill = Perbill::from_rational_approximation(5u32, 10_000);
}

impl pallet_staking::Trait for Runtime {
    type Currency = Balances;
    type UnixTime = Timestamp;
    type CurrencyToVote = common::currency::CurrencyToVoteHandler;
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
    type ElectionLookahead = MaxIterations;
    type Call = Call;
    type MaxIterations = MaxIterations;
    type MinSolutionScoreBump = MinSolutionScoreBump;
    type MaxNominatorRewardedPerValidator = MaxNominatorRewardedPerValidator;
    type UnsignedPriority = StakingUnsignedPriority;
}

impl pallet_im_online::Trait for Runtime {
    type AuthorityId = ImOnlineId;
    type Event = Event;
    type SessionDuration = SessionDuration;
    type ReportUnresponsiveness = Offences;
    type UnsignedPriority = ImOnlineUnsignedPriority;
}

parameter_types! {
    pub OffencesWeightSoftLimit: Weight = Perbill::from_percent(60) * MaximumBlockWeight::get();
}

impl pallet_offences::Trait for Runtime {
    type Event = Event;
    type IdentificationTuple = pallet_session::historical::IdentificationTuple<Self>;
    type OnOffenceHandler = Staking;
    type WeightSoftLimit = OffencesWeightSoftLimit;
}

impl pallet_authority_discovery::Trait for Runtime {}

parameter_types! {
    pub const WindowSize: BlockNumber = 101;
    pub const ReportLatency: BlockNumber = 1000;
}

impl pallet_finality_tracker::Trait for Runtime {
    type OnFinalizationStalled = Grandpa;
    type WindowSize = WindowSize;
    type ReportLatency = ReportLatency;
}

impl versioned_store::Trait for Runtime {
    type Event = Event;
}

impl versioned_store_permissions::Trait for Runtime {
    type Credential = Credential;
    type CredentialChecker = (
        integration::content_working_group::ContentWorkingGroupCredentials,
        integration::versioned_store_permissions::SudoKeyHasAllCredentials,
    );
    type CreateClassPermissionsChecker =
        integration::versioned_store_permissions::ContentLeadOrSudoKeyCanCreateClasses;
}

impl hiring::Trait for Runtime {
    type OpeningId = u64;
    type ApplicationId = u64;
    type ApplicationDeactivatedHandler = (); // TODO - what needs to happen?
    type StakeHandlerProvider = hiring::Module<Self>;
}

impl minting::Trait for Runtime {
    type Currency = <Self as common::currency::GovernanceCurrency>::Currency;
    type MintId = u64;
}

impl recurring_rewards::Trait for Runtime {
    type PayoutStatusHandler = (); // TODO - deal with successful and failed payouts
    type RecipientId = u64;
    type RewardRelationshipId = u64;
}

parameter_types! {
    pub const StakePoolId: [u8; 8] = *b"joystake";
}

impl stake::Trait for Runtime {
    type Currency = <Self as common::currency::GovernanceCurrency>::Currency;
    type StakePoolId = StakePoolId;
    type StakingEventsHandler = (
        crate::integration::content_working_group::ContentWorkingGroupStakingEventHandler,
        (
            crate::integration::proposals::StakingEventsHandler<Self>,
            crate::integration::working_group::StakingEventsHandler<Self>,
        ),
    );
    type StakeId = u64;
    type SlashId = u64;
}

impl content_wg::Trait for Runtime {
    type Event = Event;
}

impl common::currency::GovernanceCurrency for Runtime {
    type Currency = pallet_balances::Module<Self>;
}

impl governance::election::Trait for Runtime {
    type Event = Event;
    type CouncilElected = (Council, integration::proposals::CouncilElectedHandler);
}

impl governance::council::Trait for Runtime {
    type Event = Event;
    type CouncilTermEnded = (CouncilElection,);
}

impl memo::Trait for Runtime {
    type Event = Event;
}

parameter_types! {
    pub const MaxObjectsPerInjection: u32 = 100;
}

impl storage::data_object_type_registry::Trait for Runtime {
    type Event = Event;
    type DataObjectTypeId = u64;
}

impl storage::data_directory::Trait for Runtime {
    type Event = Event;
    type ContentId = ContentId;
    type StorageProviderHelper = integration::storage::StorageProviderHelper;
    type IsActiveDataObjectType = DataObjectTypeRegistry;
    type MemberOriginValidator = MembershipOriginValidator<Self>;
    type MaxObjectsPerInjection = MaxObjectsPerInjection;
}

impl storage::data_object_storage_registry::Trait for Runtime {
    type Event = Event;
    type DataObjectStorageRelationshipId = u64;
    type ContentIdExists = DataDirectory;
}

impl membership::Trait for Runtime {
    type Event = Event;
    type MemberId = u64;
    type PaidTermId = u64;
    type SubscriptionId = u64;
    type ActorId = ActorId;
}

impl forum::Trait for Runtime {
    type Event = Event;
    type MembershipRegistry = integration::forum::ShimMembershipRegistry;
    type ThreadId = ThreadId;
    type PostId = PostId;
}

// The storage working group instance alias.
pub type StorageWorkingGroupInstance = working_group::Instance2;

parameter_types! {
    pub const MaxWorkerNumberLimit: u32 = 100;
}

impl working_group::Trait<StorageWorkingGroupInstance> for Runtime {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
}

impl service_discovery::Trait for Runtime {
    type Event = Event;
}

parameter_types! {
    pub const ProposalCancellationFee: u64 = 10000;
    pub const ProposalRejectionFee: u64 = 5000;
    pub const ProposalTitleMaxLength: u32 = 40;
    pub const ProposalDescriptionMaxLength: u32 = 3000;
    pub const ProposalMaxActiveProposalLimit: u32 = 5;
}

impl proposals_engine::Trait for Runtime {
    type Event = Event;
    type ProposerOriginValidator = MembershipOriginValidator<Self>;
    type VoterOriginValidator = CouncilManager<Self>;
    type TotalVotersCounter = CouncilManager<Self>;
    type ProposalId = u32;
    type StakeHandlerProvider = proposals_engine::DefaultStakeHandlerProvider;
    type CancellationFee = ProposalCancellationFee;
    type RejectionFee = ProposalRejectionFee;
    type TitleMaxLength = ProposalTitleMaxLength;
    type DescriptionMaxLength = ProposalDescriptionMaxLength;
    type MaxActiveProposalLimit = ProposalMaxActiveProposalLimit;
    type DispatchableCallCode = Call;
}
impl Default for Call {
    fn default() -> Self {
        panic!("shouldn't call default for Call");
    }
}

parameter_types! {
    pub const ProposalMaxPostEditionNumber: u32 = 0; // post update is disabled
    pub const ProposalMaxThreadInARowNumber: u32 = 100_000; // will not be used
    pub const ProposalThreadTitleLengthLimit: u32 = 40;
    pub const ProposalPostLengthLimit: u32 = 1000;
}

impl proposals_discussion::Trait for Runtime {
    type Event = Event;
    type PostAuthorOriginValidator = MembershipOriginValidator<Self>;
    type ThreadId = ThreadId;
    type PostId = PostId;
    type MaxPostEditionNumber = ProposalMaxPostEditionNumber;
    type ThreadTitleLengthLimit = ProposalThreadTitleLengthLimit;
    type PostLengthLimit = ProposalPostLengthLimit;
    type MaxThreadInARowNumber = ProposalMaxThreadInARowNumber;
}

parameter_types! {
    pub const TextProposalMaxLength: u32 = 5_000;
    pub const RuntimeUpgradeWasmProposalMaxLength: u32 = 2_000_000;
}

impl proposals_codex::Trait for Runtime {
    type MembershipOriginValidator = MembershipOriginValidator<Self>;
    type TextProposalMaxLength = TextProposalMaxLength;
    type RuntimeUpgradeWasmProposalMaxLength = RuntimeUpgradeWasmProposalMaxLength;
    type ProposalEncoder = ExtrinsicProposalEncoder;
}

parameter_types! {
    pub const TombstoneDeposit: Balance = 1; // TODO: adjust fee
    pub const RentByteFee: Balance = 1; // TODO: adjust fee
    pub const RentDepositOffset: Balance = 0; // no rent deposit
    pub const SurchargeReward: Balance = 0; // no reward
}

impl pallet_contracts::Trait for Runtime {
    type Time = Timestamp;
    type Randomness = RandomnessCollectiveFlip;
    type Currency = Balances;
    type Event = Event;
    type DetermineContractAddress = pallet_contracts::SimpleAddressDeterminer<Runtime>;
    type TrieIdGenerator = pallet_contracts::TrieIdFromParentCounter<Runtime>;
    type RentPayment = ();
    type SignedClaimHandicap = pallet_contracts::DefaultSignedClaimHandicap;
    type TombstoneDeposit = TombstoneDeposit;
    type StorageSizeOffset = pallet_contracts::DefaultStorageSizeOffset;
    type RentByteFee = RentByteFee;
    type RentDepositOffset = RentDepositOffset;
    type SurchargeReward = SurchargeReward;
    type MaxDepth = pallet_contracts::DefaultMaxDepth;
    type MaxValueSize = pallet_contracts::DefaultMaxValueSize;
    type WeightPrice = pallet_transaction_payment::Module<Self>;
}

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
        UncheckedExtrinsic = UncheckedExtrinsic
    {
        // Substrate
        System: system::{Module, Call, Storage, Config, Event<T>},
        Babe: pallet_babe::{Module, Call, Storage, Config, Inherent(Timestamp)},
        Timestamp: pallet_timestamp::{Module, Call, Storage, Inherent},
        Authorship: pallet_authorship::{Module, Call, Storage, Inherent},
        Balances: pallet_balances::{Module, Call, Storage, Config<T>, Event<T>},
        TransactionPayment: pallet_transaction_payment::{Module, Storage},
        Staking: pallet_staking::{Module, Call, Config<T>, Storage, Event<T>, ValidateUnsigned},
        Session: pallet_session::{Module, Call, Storage, Event, Config<T>},
        Historical: pallet_session_historical::{Module},
        FinalityTracker: pallet_finality_tracker::{Module, Call, Inherent},
        Grandpa: pallet_grandpa::{Module, Call, Storage, Config, Event},
        ImOnline: pallet_im_online::{Module, Call, Storage, Event<T>, ValidateUnsigned, Config<T>},
        AuthorityDiscovery: pallet_authority_discovery::{Module, Call, Config},
        Offences: pallet_offences::{Module, Call, Storage, Event},
        RandomnessCollectiveFlip: pallet_randomness_collective_flip::{Module, Call, Storage},
        Sudo: pallet_sudo::{Module, Call, Config<T>, Storage, Event<T>},
        Contracts: pallet_contracts::{Module, Call, Config, Storage, Event<T>},
        // Joystream
        CouncilElection: election::{Module, Call, Storage, Event<T>, Config<T>},
        Council: council::{Module, Call, Storage, Event<T>, Config<T>},
        Memo: memo::{Module, Call, Storage, Event<T>},
        Members: membership::{Module, Call, Storage, Event<T>, Config<T>},
        Forum: forum::{Module, Call, Storage, Event<T>, Config<T>},
        VersionedStore: versioned_store::{Module, Call, Storage, Event<T>, Config},
        VersionedStorePermissions: versioned_store_permissions::{Module, Call, Storage},
        Stake: stake::{Module, Call, Storage},
        Minting: minting::{Module, Call, Storage},
        RecurringRewards: recurring_rewards::{Module, Call, Storage},
        Hiring: hiring::{Module, Call, Storage},
        ContentWorkingGroup: content_wg::{Module, Call, Storage, Event<T>, Config<T>},
        // --- Storage
        DataObjectTypeRegistry: data_object_type_registry::{Module, Call, Storage, Event<T>, Config<T>},
        DataDirectory: data_directory::{Module, Call, Storage, Event<T>},
        DataObjectStorageRegistry: data_object_storage_registry::{Module, Call, Storage, Event<T>, Config<T>},
        Discovery: service_discovery::{Module, Call, Storage, Event<T>},
        // --- Proposals
        ProposalsEngine: proposals_engine::{Module, Call, Storage, Event<T>},
        ProposalsDiscussion: proposals_discussion::{Module, Call, Storage, Event<T>},
        ProposalsCodex: proposals_codex::{Module, Call, Storage, Config<T>},
        // --- Working groups
        // reserved for the future use: ForumWorkingGroup: working_group::<Instance1>::{Module, Call, Storage, Event<T>},
        StorageWorkingGroup: working_group::<Instance2>::{Module, Call, Storage, Config<T>, Event<T>},
    }
);
