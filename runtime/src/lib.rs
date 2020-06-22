//! The Joystream Substrate Node runtime.

#![cfg_attr(not(feature = "std"), no_std)]
// `construct_runtime!` does a lot of recursion and requires us to increase the limit to 256.
#![recursion_limit = "256"]
// srml_staking_reward_curve::build! - substrate macro produces a warning.
// TODO: remove after post-Rome substrate upgrade
#![allow(array_into_iter)]

// Runtime integration tests
mod tests;

// Make the WASM binary available.
// This is required only by the node build.
// A dummy wasm_binary.rs will be built for the IDE.
#[cfg(feature = "std")]
include!(concat!(env!("OUT_DIR"), "/wasm_binary.rs"));

mod integration;

use authority_discovery_primitives::{
    AuthorityId as EncodedAuthorityId, Signature as EncodedSignature,
};
use babe_primitives::{AuthorityId as BabeId, AuthoritySignature as BabeSignature};
use codec::{Decode, Encode};
use grandpa::fg_primitives;
use grandpa::{AuthorityId as GrandpaId, AuthorityWeight as GrandpaWeight};
use im_online::sr25519::AuthorityId as ImOnlineId;
use primitives::OpaqueMetadata;
use rstd::prelude::*;
use sr_primitives::curve::PiecewiseLinear;
use sr_primitives::traits::{
    BlakeTwo256, Block as BlockT, IdentifyAccount, NumberFor, StaticLookup, Verify,
};
use sr_primitives::weights::Weight;
use sr_primitives::{
    create_runtime_str, generic, impl_opaque_keys, transaction_validity::TransactionValidity,
    ApplyResult, MultiSignature,
};
use substrate_client::{
    block_builder::api::{self as block_builder_api, CheckInherentsResult, InherentData},
    impl_runtime_apis, runtime_api as client_api,
};
use system::offchain::TransactionSubmitter;
#[cfg(feature = "std")]
use version::NativeVersion;
use version::RuntimeVersion;

// A few exports that help ease life for downstream crates.
pub use balances::Call as BalancesCall;
#[cfg(any(feature = "std", test))]
pub use sr_primitives::BuildStorage;
pub use sr_primitives::{Perbill, Permill};

pub use srml_support::{
    construct_runtime, parameter_types, traits::Currency, traits::Imbalance, traits::Randomness,
    StorageLinkedMap, StorageMap, StorageValue,
};
pub use staking::StakerStatus;
pub use timestamp::Call as TimestampCall;

use integration::proposals::{CouncilManager, ExtrinsicProposalEncoder, MembershipOriginValidator};
pub use proposals_codex::ProposalsConfigParameters;

pub use common;
pub use forum;
pub use working_group;

pub use governance::election_params::ElectionParameters;
use governance::{council, election};
use membership::members;
use storage::{data_directory, data_object_storage_registry, data_object_type_registry};
pub use versioned_store;

pub use content_working_group as content_wg;
mod migration;

/// Alias for ContentId, used in various places.
pub type ContentId = primitives::H256;

/// An index to a block.
pub type BlockNumber = u32;

/// Alias to 512-bit hash when used in the context of a transaction signature on the chain.
pub type Signature = MultiSignature;

/// Some way of identifying an account on the chain. We intentionally make it equivalent
/// to the public key of our transaction signing scheme.
pub type AccountId = <<Signature as Verify>::Signer as IdentifyAccount>::AccountId;

/// The type for looking up accounts. We don't expect more than 4 billion of them, but you
/// never know...
pub type AccountIndex = u32;

/// Balance of an account.
pub type Balance = u128;

/// Index of a transaction in the chain.
pub type Index = u32;

/// A hash of some data used by the chain.
pub type Hash = primitives::H256;

/// Digest item type.
pub type DigestItem = generic::DigestItem<Hash>;

/// Moment type
pub type Moment = u64;

/// Credential type
pub type Credential = u64;

/// Represents a thread identifier for both Forum and Proposals Discussion
///
/// Note: Both modules expose type names ThreadId and PostId (which are defined on their Trait) and
/// used in state storage and dispatchable method's argument types,
/// and are therefore part of the public API/metadata of the runtime.
/// In the currenlty version the polkadot-js/api that is used and is compatible with the runtime,
/// the type registry has flat namespace and its not possible
/// to register identically named types from different modules, separately. And so we MUST configure
/// the underlying types to be identicaly to avoid issues with encoding/decoding these types on the client side.
pub type ThreadId = u64;

/// Represents a post identifier for both Forum and Proposals Discussion
///
/// See the Note about ThreadId
pub type PostId = u64;

/// Represent an actor in membership group, which is the same in the working groups.
pub type ActorId = u64;

/// Opaque types. These are used by the CLI to instantiate machinery that don't need to know
/// the specifics of the runtime. They can then be made to be agnostic over specific formats
/// of data like extrinsics, allowing for them to continue syncing the network through upgrades
/// to even the core datastructures.
pub mod opaque {
    use super::*;

    pub use sr_primitives::OpaqueExtrinsic as UncheckedExtrinsic;

    /// Opaque block header type.
    pub type Header = generic::Header<BlockNumber, BlakeTwo256>;
    /// Opaque block type.
    pub type Block = generic::Block<Header, UncheckedExtrinsic>;
    /// Opaque block identifier type.
    pub type BlockId = generic::BlockId<Block>;

    pub type SessionHandlers = (Grandpa, Babe, ImOnline);

    impl_opaque_keys! {
        pub struct SessionKeys {
            pub grandpa: Grandpa,
            pub babe: Babe,
            pub im_online: ImOnline,
        }
    }
}

/// This runtime version.
pub const VERSION: RuntimeVersion = RuntimeVersion {
    spec_name: create_runtime_str!("joystream-node"),
    impl_name: create_runtime_str!("joystream-node"),
    authoring_version: 6,
    spec_version: 16,
    impl_version: 0,
    apis: RUNTIME_API_VERSIONS,
};

/// Constants for Babe.

/// Since BABE is probabilistic this is the average expected block time that
/// we are targetting. Blocks will be produced at a minimum duration defined
/// by `SLOT_DURATION`, but some slots will not be allocated to any
/// authority and hence no block will be produced. We expect to have this
/// block time on average following the defined slot duration and the value
/// of `c` configured for BABE (where `1 - c` represents the probability of
/// a slot being empty).
/// This value is only used indirectly to define the unit constants below
/// that are expressed in blocks. The rest of the code should use
/// `SLOT_DURATION` instead (like the timestamp module for calculating the
/// minimum period).
/// <https://research.web3.foundation/en/latest/polkadot/BABE/Babe/#6-practical-results>
pub const MILLISECS_PER_BLOCK: Moment = 6000;
pub const SECS_PER_BLOCK: Moment = MILLISECS_PER_BLOCK / 1000;

pub const SLOT_DURATION: Moment = 6000;

pub const EPOCH_DURATION_IN_BLOCKS: BlockNumber = 10 * MINUTES;
pub const EPOCH_DURATION_IN_SLOTS: u64 = {
    const SLOT_FILL_RATE: f64 = MILLISECS_PER_BLOCK as f64 / SLOT_DURATION as f64;

    (EPOCH_DURATION_IN_BLOCKS as f64 * SLOT_FILL_RATE) as u64
};

// These time units are defined in number of blocks.
pub const MINUTES: BlockNumber = 60 / (SECS_PER_BLOCK as BlockNumber);
pub const HOURS: BlockNumber = MINUTES * 60;
pub const DAYS: BlockNumber = HOURS * 24;

// 1 in 4 blocks (on average, not counting collisions) will be primary babe blocks.
pub const PRIMARY_PROBABILITY: (u64, u64) = (1, 4);

/// The version infromation used to identify this runtime when compiled natively.
#[cfg(feature = "std")]
pub fn native_version() -> NativeVersion {
    NativeVersion {
        runtime_version: VERSION,
        can_author_with: Default::default(),
    }
}

parameter_types! {
    pub const BlockHashCount: BlockNumber = 250;
    pub const MaximumBlockWeight: Weight = 1_000_000_000;
    pub const AvailableBlockRatio: Perbill = Perbill::from_percent(75);
    pub const MaximumBlockLength: u32 = 5 * 1024 * 1024;
    pub const Version: RuntimeVersion = VERSION;
}

impl system::Trait for Runtime {
    /// The identifier used to distinguish between accounts.
    type AccountId = AccountId;
    /// The aggregated dispatch type that is available for extrinsics.
    type Call = Call;
    /// The lookup mechanism to get account ID from whatever is passed in dispatchers.
    type Lookup = Indices;
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
    /// Maximum weight of each block. With a default weight system of 1byte == 1weight, 4mb is ok.
    type MaximumBlockWeight = MaximumBlockWeight;
    /// Maximum size of all encoded transactions (in bytes) that are allowed in one block.
    type MaximumBlockLength = MaximumBlockLength;
    /// Portion of the block weight that is available to all normal transactions.
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = Version;
}

parameter_types! {
    pub const EpochDuration: u64 = EPOCH_DURATION_IN_SLOTS as u64;
    pub const ExpectedBlockTime: Moment = MILLISECS_PER_BLOCK;
}

impl babe::Trait for Runtime {
    type EpochDuration = EpochDuration;
    type ExpectedBlockTime = ExpectedBlockTime;
    type EpochChangeTrigger = babe::ExternalTrigger;
}

impl grandpa::Trait for Runtime {
    type Event = Event;
}

impl indices::Trait for Runtime {
    /// The type for recording indexing into the account enumeration. If this ever overflows, there
    /// will be problems!
    type AccountIndex = u32;
    /// Use the standard means of resolving an index hint from an id.
    type ResolveHint = indices::SimpleResolveHint<Self::AccountId, Self::AccountIndex>;
    /// Determine whether an account is dead.
    type IsDeadAccount = Balances;
    /// The ubiquitous event type.
    type Event = Event;
}

parameter_types! {
    pub const MinimumPeriod: Moment = SLOT_DURATION / 2;
}

impl timestamp::Trait for Runtime {
    /// A timestamp: milliseconds since the unix epoch.
    type Moment = Moment;
    type OnTimestampSet = Babe;
    type MinimumPeriod = MinimumPeriod;
}

parameter_types! {
    pub const ExistentialDeposit: u128 = 0;
    pub const TransferFee: u128 = 0;
    pub const CreationFee: u128 = 0;
    pub const TransactionBaseFee: u128 = 1;
    pub const TransactionByteFee: u128 = 0;
    pub const InitialMembersBalance: u32 = 2000;
}

impl balances::Trait for Runtime {
    /// The type for recording an account's balance.
    type Balance = Balance;
    /// What to do if an account's free balance gets zeroed.
    type OnFreeBalanceZero = (Staking, Session);
    /// What to do if a new account is created.
    type OnNewAccount = (); // Indices; // disable use of Indices feature
    /// The ubiquitous event type.
    type Event = Event;

    type DustRemoval = ();
    type TransferPayment = ();
    type ExistentialDeposit = ExistentialDeposit;
    type TransferFee = TransferFee;
    type CreationFee = CreationFee;
}

impl transaction_payment::Trait for Runtime {
    type Currency = Balances;
    type OnTransactionPayment = ();
    type TransactionBaseFee = TransactionBaseFee;
    type TransactionByteFee = TransactionByteFee;
    type WeightToFee = ();
    type FeeMultiplierUpdate = (); // FeeMultiplierUpdateHandler;
}

impl sudo::Trait for Runtime {
    type Event = Event;
    type Proposal = Call;
}

parameter_types! {
    pub const UncleGenerations: BlockNumber = 5;
}

impl authorship::Trait for Runtime {
    type FindAuthor = session::FindAccountFromAuthorIndex<Self, Babe>;
    type UncleGenerations = UncleGenerations;
    type FilterUncle = ();
    type EventHandler = Staking;
}

type SessionHandlers = (Grandpa, Babe, ImOnline);

impl_opaque_keys! {
    pub struct SessionKeys {
        pub grandpa: Grandpa,
        pub babe: Babe,
        pub im_online: ImOnline,
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

impl session::Trait for Runtime {
    type OnSessionEnding = Staking;
    type SessionHandler = SessionHandlers;
    type ShouldEndSession = Babe;
    type Event = Event;
    type Keys = SessionKeys;
    type ValidatorId = AccountId;
    type ValidatorIdOf = staking::StashOf<Self>;
    type SelectInitialValidators = Staking;
    type DisabledValidatorsThreshold = DisabledValidatorsThreshold;
}

impl session::historical::Trait for Runtime {
    type FullIdentification = staking::Exposure<AccountId, Balance>;
    type FullIdentificationOf = staking::ExposureOf<Runtime>;
}

srml_staking_reward_curve::build! {
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
    pub const SessionsPerEra: sr_staking_primitives::SessionIndex = 6;
    pub const BondingDuration: staking::EraIndex = 24;
    pub const RewardCurve: &'static PiecewiseLinear<'static> = &REWARD_CURVE;
}

impl staking::Trait for Runtime {
    type Currency = Balances;
    type Time = Timestamp;
    type CurrencyToVote = common::currency::CurrencyToVoteHandler;
    type RewardRemainder = ();
    type Event = Event;
    type Slash = (); // where to send the slashed funds.
    type Reward = (); // rewards are minted from the void
    type SessionsPerEra = SessionsPerEra;
    type BondingDuration = BondingDuration;
    type SessionInterface = Self;
    type RewardCurve = RewardCurve;
}

type SubmitTransaction = TransactionSubmitter<ImOnlineId, Runtime, UncheckedExtrinsic>;

parameter_types! {
    pub const SessionDuration: BlockNumber = EPOCH_DURATION_IN_SLOTS as _;
}

impl im_online::Trait for Runtime {
    type AuthorityId = ImOnlineId;
    type Call = Call;
    type Event = Event;
    type SubmitTransaction = SubmitTransaction;
    type ReportUnresponsiveness = Offences;
    type SessionDuration = SessionDuration;
}

impl offences::Trait for Runtime {
    type Event = Event;
    type IdentificationTuple = session::historical::IdentificationTuple<Self>;
    type OnOffenceHandler = Staking;
}

impl authority_discovery::Trait for Runtime {
    type AuthorityId = BabeId;
}

parameter_types! {
    pub const WindowSize: BlockNumber = 101;
    pub const ReportLatency: BlockNumber = 1000;
}

impl finality_tracker::Trait for Runtime {
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
        SudoKeyHasAllCredentials,
    );
    type CreateClassPermissionsChecker = ContentLeadOrSudoKeyCanCreateClasses;
}

// Credential Checker that gives the sudo key holder all credentials
pub struct SudoKeyHasAllCredentials {}
impl versioned_store_permissions::CredentialChecker<Runtime> for SudoKeyHasAllCredentials {
    fn account_has_credential(
        account: &AccountId,
        _credential: <Runtime as versioned_store_permissions::Trait>::Credential,
    ) -> bool {
        <sudo::Module<Runtime>>::key() == *account
    }
}

// Allow sudo key holder permission to create classes
pub struct SudoKeyCanCreateClasses {}
impl versioned_store_permissions::CreateClassPermissionsChecker<Runtime>
    for SudoKeyCanCreateClasses
{
    fn account_can_create_class_permissions(account: &AccountId) -> bool {
        <sudo::Module<Runtime>>::key() == *account
    }
}

pub struct ContentLeadOrSudoKeyCanCreateClasses {}
impl versioned_store_permissions::CreateClassPermissionsChecker<Runtime>
    for ContentLeadOrSudoKeyCanCreateClasses
{
    fn account_can_create_class_permissions(account: &AccountId) -> bool {
        ContentLeadCanCreateClasses::account_can_create_class_permissions(account)
            || SudoKeyCanCreateClasses::account_can_create_class_permissions(account)
    }
}

// Allow content working group lead to create classes in content directory
pub struct ContentLeadCanCreateClasses {}
impl versioned_store_permissions::CreateClassPermissionsChecker<Runtime>
    for ContentLeadCanCreateClasses
{
    fn account_can_create_class_permissions(account: &AccountId) -> bool {
        // get current lead id
        let maybe_current_lead_id = content_wg::CurrentLeadId::<Runtime>::get();
        if let Some(lead_id) = maybe_current_lead_id {
            let lead = content_wg::LeadById::<Runtime>::get(lead_id);
            lead.role_account == *account
        } else {
            false
        }
    }
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

impl recurringrewards::Trait for Runtime {
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
    type Currency = balances::Module<Self>;
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
}

impl storage::data_object_storage_registry::Trait for Runtime {
    type Event = Event;
    type DataObjectStorageRelationshipId = u64;
    type ContentIdExists = DataDirectory;
}

impl members::Trait for Runtime {
    type Event = Event;
    type MemberId = u64;
    type PaidTermId = u64;
    type SubscriptionId = u64;
    type ActorId = ActorId;
    type InitialMembersBalance = InitialMembersBalance;
}

/*
 * Forum module integration
 *
 * ForumUserRegistry could have been implemented directly on
 * the membership module, and likewise ForumUser on Profile,
 * however this approach is more loosley coupled.
 *
 * Further exploration required to decide what the long
 * run convention should be.
 */

/// Shim registry which will proxy ForumUserRegistry behaviour to the members module
pub struct ShimMembershipRegistry {}

impl forum::ForumUserRegistry<AccountId> for ShimMembershipRegistry {
    fn get_forum_user(id: &AccountId) -> Option<forum::ForumUser<AccountId>> {
        if members::Module::<Runtime>::is_member_account(id) {
            // For now we don't retreive the members profile since it is not used for anything,
            // but in the future we may need it to read out more
            // information possibly required to construct a
            // ForumUser.

            // Now convert member profile to a forum user
            Some(forum::ForumUser { id: id.clone() })
        } else {
            None
        }
    }
}

impl forum::Trait for Runtime {
    type Event = Event;
    type MembershipRegistry = ShimMembershipRegistry;
    type ThreadId = ThreadId;
    type PostId = PostId;
}

impl migration::Trait for Runtime {
    type Event = Event;
}
// The storage working group instance alias.
pub type StorageWorkingGroupInstance = working_group::Instance2;

impl working_group::Trait<StorageWorkingGroupInstance> for Runtime {
    type Event = Event;
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

construct_runtime!(
    pub enum Runtime where
        Block = Block,
        NodeBlock = opaque::Block,
        UncheckedExtrinsic = UncheckedExtrinsic
    {
        // Substrate
        System: system::{Module, Call, Storage, Config, Event},
        Babe: babe::{Module, Call, Storage, Config, Inherent(Timestamp)},
        Timestamp: timestamp::{Module, Call, Storage, Inherent},
        Authorship: authorship::{Module, Call, Storage, Inherent},
        Indices: indices,
        Balances: balances,
        TransactionPayment: transaction_payment::{Module, Storage},
        Staking: staking::{default, OfflineWorker},
        Session: session::{Module, Call, Storage, Event, Config<T>},
        FinalityTracker: finality_tracker::{Module, Call, Inherent},
        Grandpa: grandpa::{Module, Call, Storage, Config, Event},
        ImOnline: im_online::{Module, Call, Storage, Event<T>, ValidateUnsigned, Config<T>},
        AuthorityDiscovery: authority_discovery::{Module, Call, Config<T>},
        Offences: offences::{Module, Call, Storage, Event},
        RandomnessCollectiveFlip: randomness_collective_flip::{Module, Call, Storage},
        Sudo: sudo,
        // Joystream
        Migration: migration::{Module, Call, Storage, Event<T>, Config},
        CouncilElection: election::{Module, Call, Storage, Event<T>, Config<T>},
        Council: council::{Module, Call, Storage, Event<T>, Config<T>},
        Memo: memo::{Module, Call, Storage, Event<T>},
        Members: members::{Module, Call, Storage, Event<T>, Config<T>},
        Forum: forum::{Module, Call, Storage, Event<T>, Config<T>},
        VersionedStore: versioned_store::{Module, Call, Storage, Event<T>, Config},
        VersionedStorePermissions: versioned_store_permissions::{Module, Call, Storage},
        Stake: stake::{Module, Call, Storage},
        Minting: minting::{Module, Call, Storage},
        RecurringRewards: recurringrewards::{Module, Call, Storage},
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
        ProposalsCodex: proposals_codex::{Module, Call, Storage, Error, Config<T>},
        // --- Working groups
        // reserved for the future use: ForumWorkingGroup: working_group::<Instance1>::{Module, Call, Storage, Event<T>},
        StorageWorkingGroup: working_group::<Instance2>::{Module, Call, Storage, Config<T>, Error, Event<T>},
    }
);

/// The address format for describing accounts.
pub type Address = <Indices as StaticLookup>::Source;
/// Block header type as expected by this runtime.
pub type Header = generic::Header<BlockNumber, BlakeTwo256>;
/// Block type as expected by this runtime.
pub type Block = generic::Block<Header, UncheckedExtrinsic>;
/// A Block signed with a Justification
pub type SignedBlock = generic::SignedBlock<Block>;
/// BlockId type as expected by this runtime.
pub type BlockId = generic::BlockId<Block>;
/// The SignedExtension to the basic transaction logic.
pub type SignedExtra = (
    system::CheckVersion<Runtime>,
    system::CheckGenesis<Runtime>,
    system::CheckEra<Runtime>,
    system::CheckNonce<Runtime>,
    system::CheckWeight<Runtime>,
    transaction_payment::ChargeTransactionPayment<Runtime>,
);
/// Unchecked extrinsic type as expected by this runtime.
pub type UncheckedExtrinsic = generic::UncheckedExtrinsic<Address, Call, Signature, SignedExtra>;
/// Extrinsic type that has already been checked.
pub type CheckedExtrinsic = generic::CheckedExtrinsic<AccountId, Call, SignedExtra>;
/// Executive: handles dispatch to the various modules.
pub type Executive =
    executive::Executive<Runtime, Block, system::ChainContext<Runtime>, Runtime, AllModules>;

impl_runtime_apis! {
    impl client_api::Core<Block> for Runtime {
        fn version() -> RuntimeVersion {
            VERSION
        }

        fn execute_block(block: Block) {
            Executive::execute_block(block)
        }

        fn initialize_block(header: &<Block as BlockT>::Header) {
            Executive::initialize_block(header)
        }
    }

    impl client_api::Metadata<Block> for Runtime {
        fn metadata() -> OpaqueMetadata {
            Runtime::metadata().into()
        }
    }

    impl block_builder_api::BlockBuilder<Block> for Runtime {
        fn apply_extrinsic(extrinsic: <Block as BlockT>::Extrinsic) -> ApplyResult {
            Executive::apply_extrinsic(extrinsic)
        }

        fn finalize_block() -> <Block as BlockT>::Header {
            Executive::finalize_block()
        }

        fn inherent_extrinsics(data: InherentData) -> Vec<<Block as BlockT>::Extrinsic> {
            data.create_extrinsics()
        }

        fn check_inherents(block: Block, data: InherentData) -> CheckInherentsResult {
            data.check_extrinsics(&block)
        }

        fn random_seed() -> <Block as BlockT>::Hash {
            RandomnessCollectiveFlip::random_seed()
        }
    }

    impl client_api::TaggedTransactionQueue<Block> for Runtime {
        fn validate_transaction(tx: <Block as BlockT>::Extrinsic) -> TransactionValidity {
            Executive::validate_transaction(tx)
        }
    }

    impl offchain_primitives::OffchainWorkerApi<Block> for Runtime {
        fn offchain_worker(number: NumberFor<Block>) {
            Executive::offchain_worker(number)
        }
    }

    impl fg_primitives::GrandpaApi<Block> for Runtime {
        fn grandpa_authorities() -> Vec<(GrandpaId, GrandpaWeight)> {
            Grandpa::grandpa_authorities()
        }
    }

    impl babe_primitives::BabeApi<Block> for Runtime {
        fn configuration() -> babe_primitives::BabeConfiguration {
            // The choice of `c` parameter (where `1 - c` represents the
            // probability of a slot being empty), is done in accordance to the
            // slot duration and expected target block time, for safely
            // resisting network delays of maximum two seconds.
            // <https://research.web3.foundation/en/latest/polkadot/BABE/Babe/#6-practical-results>
            babe_primitives::BabeConfiguration {
                slot_duration: Babe::slot_duration(),
                epoch_length: EpochDuration::get(),
                c: PRIMARY_PROBABILITY,
                genesis_authorities: Babe::authorities(),
                randomness: Babe::randomness(),
                secondary_slots: true,
            }
        }
    }

    impl authority_discovery_primitives::AuthorityDiscoveryApi<Block> for Runtime {
        fn authorities() -> Vec<EncodedAuthorityId> {
            AuthorityDiscovery::authorities().into_iter()
                .map(|id| id.encode())
                .map(EncodedAuthorityId)
                .collect()
        }

        fn sign(payload: &Vec<u8>) -> Option<(EncodedSignature, EncodedAuthorityId)> {
              AuthorityDiscovery::sign(payload).map(|(sig, id)| {
            (EncodedSignature(sig.encode()), EncodedAuthorityId(id.encode()))
        })
        }

        fn verify(payload: &Vec<u8>, signature: &EncodedSignature, authority_id: &EncodedAuthorityId) -> bool {
            let signature = match BabeSignature::decode(&mut &signature.0[..]) {
                Ok(s) => s,
                _ => return false,
            };

            let authority_id = match BabeId::decode(&mut &authority_id.0[..]) {
                Ok(id) => id,
                _ => return false,
            };

            AuthorityDiscovery::verify(payload, signature, authority_id)
        }
    }

    impl system_rpc_runtime_api::AccountNonceApi<Block, AccountId, Index> for Runtime {
        fn account_nonce(account: AccountId) -> Index {
            System::account_nonce(account)
        }
    }

    impl substrate_session::SessionKeys<Block> for Runtime {
        fn generate_session_keys(seed: Option<Vec<u8>>) -> Vec<u8> {
            let seed = seed.as_ref().map(|s| rstd::str::from_utf8(&s).expect("Seed is an utf8 string"));
            opaque::SessionKeys::generate(seed)
        }
    }
}
