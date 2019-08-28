//! The Substrate Node Template runtime. This can be compiled with `#[no_std]`, ready for Wasm.

#![cfg_attr(not(feature = "std"), no_std)]
// `construct_runtime!` does a lot of recursion and requires us to increase the limit to 256.
#![recursion_limit = "256"]

// Make the WASM binary available.
#[cfg(feature = "std")]
include!(concat!(env!("OUT_DIR"), "/wasm_binary.rs"));

use babe::AuthorityId as BabeId;
use grandpa::fg_primitives::{self, ScheduledChange};
use grandpa::{AuthorityId as GrandpaId, AuthorityWeight as GrandpaWeight};
use im_online::AuthorityId as ImOnlineId;
use primitives::{crypto::key_types, OpaqueMetadata};
use rstd::prelude::*;
use runtime_primitives::traits::{
    BlakeTwo256, Block as BlockT, ConvertInto, DigestFor, NumberFor, StaticLookup, Verify,
};
use runtime_primitives::weights::Weight;
use runtime_primitives::{
    create_runtime_str, generic, impl_opaque_keys, transaction_validity::TransactionValidity,
    AnySignature, ApplyResult,
};
use substrate_client::{
    block_builder::api::{self as block_builder_api, CheckInherentsResult, InherentData},
    impl_runtime_apis, runtime_api as client_api,
};
#[cfg(feature = "std")]
use version::NativeVersion;
use version::RuntimeVersion;

// A few exports that help ease life for downstream crates.
pub use balances::Call as BalancesCall;
#[cfg(any(feature = "std", test))]
pub use runtime_primitives::BuildStorage;
pub use runtime_primitives::{Perbill, Permill};
pub use srml_support::{construct_runtime, parameter_types, StorageMap, StorageValue};
pub use timestamp::Call as TimestampCall;

/// An index to a block.
pub type BlockNumber = u32;

/// Alias to 512-bit hash when used in the context of a transaction signature on the chain.
pub type Signature = AnySignature;

/// Some way of identifying an account on the chain. We intentionally make it equivalent
/// to the public key of our transaction signing scheme.
pub type AccountId = <Signature as Verify>::Signer;

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

/// Opaque types. These are used by the CLI to instantiate machinery that don't need to know
/// the specifics of the runtime. They can then be made to be agnostic over specific formats
/// of data like extrinsics, allowing for them to continue syncing the network through upgrades
/// to even the core datastructures.
pub mod opaque {
    use super::*;

    pub use runtime_primitives::OpaqueExtrinsic as UncheckedExtrinsic;

    /// Opaque block header type.
    pub type Header = generic::Header<BlockNumber, BlakeTwo256>;
    /// Opaque block type.
    pub type Block = generic::Block<Header, UncheckedExtrinsic>;
    /// Opaque block identifier type.
    pub type BlockId = generic::BlockId<Block>;

    pub type SessionHandlers = (Grandpa, Babe);

    impl_opaque_keys! {
        pub struct SessionKeys {
            #[id(key_types::GRANDPA)]
            pub grandpa: GrandpaId,
            #[id(key_types::BABE)]
            pub babe: BabeId,
        }
    }
}

/// This runtime version.
pub const VERSION: RuntimeVersion = RuntimeVersion {
    spec_name: create_runtime_str!("joystream-node"),
    impl_name: create_runtime_str!("joystream-node"),
    authoring_version: 0,
    spec_version: 6,
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
pub const MILLISECS_PER_BLOCK: u64 = 6000;

pub const SLOT_DURATION: u64 = MILLISECS_PER_BLOCK;

pub const EPOCH_DURATION_IN_BLOCKS: u32 = 10 * MINUTES;

// These time units are defined in number of blocks.
pub const MINUTES: BlockNumber = 60_000 / (MILLISECS_PER_BLOCK as BlockNumber);
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
    pub const MaximumBlockWeight: Weight = 1_000_000;
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
    /// Update weight (to fee) multiplier per-block.
    type WeightMultiplierUpdate = ();
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
    pub const EpochDuration: u64 = EPOCH_DURATION_IN_BLOCKS as u64;
    pub const ExpectedBlockTime: u64 = MILLISECS_PER_BLOCK;
}

impl babe::Trait for Runtime {
    type EpochDuration = EpochDuration;
    type ExpectedBlockTime = ExpectedBlockTime;
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
    pub const MinimumPeriod: u64 = 5000;
}

impl timestamp::Trait for Runtime {
    /// A timestamp: milliseconds since the unix epoch.
    type Moment = u64;
    type OnTimestampSet = Babe;
    type MinimumPeriod = MinimumPeriod;
}

parameter_types! {
    pub const ExistentialDeposit: u128 = 0;
    pub const TransferFee: u128 = 0;
    pub const CreationFee: u128 = 0;
    pub const TransactionBaseFee: u128 = 1;
    pub const TransactionByteFee: u128 = 0;
}

impl balances::Trait for Runtime {
    /// The type for recording an account's balance.
    type Balance = Balance;
    /// What to do if an account's free balance gets zeroed.
    type OnFreeBalanceZero = (Staking, Session);
    /// What to do if a new account is created.
    type OnNewAccount = Indices;
    /// The ubiquitous event type.
    type Event = Event;

    type TransactionPayment = ();
    type DustRemoval = ();
    type TransferPayment = ();
    type ExistentialDeposit = ExistentialDeposit;
    type TransferFee = TransferFee;
    type CreationFee = CreationFee;
    type TransactionBaseFee = TransactionBaseFee;
    type TransactionByteFee = TransactionByteFee;
    type WeightToFee = ConvertInto;
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
        #[id(key_types::GRANDPA)]
        pub grandpa: GrandpaId,
        #[id(key_types::BABE)]
        pub babe: BabeId,
        #[id(key_types::IM_ONLINE)]
        pub im_online: ImOnlineId,
    }
}

// NOTE: `SessionHandler` and `SessionKeys` are co-dependent: One key will be used for each handler.
// The number and order of items in `SessionHandler` *MUST* be the same number and order of keys in
// `SessionKeys`.
// TODO: Introduce some structure to tie these together to make it a bit less of a footgun. This
// should be easy, since OneSessionHandler trait provides the `Key` as an associated type. #2858

impl session::Trait for Runtime {
    type OnSessionEnding = Staking;
    type SessionHandler = SessionHandlers;
    type ShouldEndSession = Babe;
    type Event = Event;
    type Keys = SessionKeys;
    type ValidatorId = AccountId;
    type ValidatorIdOf = staking::StashOf<Self>;
    type SelectInitialValidators = Staking;
}

impl session::historical::Trait for Runtime {
    type FullIdentification = staking::Exposure<AccountId, Balance>;
    type FullIdentificationOf = staking::ExposureOf<Runtime>;
}

parameter_types! {
    pub const SessionsPerEra: sr_staking_primitives::SessionIndex = 6;
    pub const BondingDuration: staking::EraIndex = 24 * 28;
}

impl staking::Trait for Runtime {
    type Currency = Balances;
    type Time = Timestamp;
    type CurrencyToVote = currency::CurrencyToVoteHandler;
    type OnRewardMinted = ();
    type Event = Event;
    type Slash = (); // where to send the slashed funds.
    type Reward = (); // rewards are minted from the void
    type SessionsPerEra = SessionsPerEra;
    type BondingDuration = BondingDuration;
    type SessionInterface = Self;
}

impl im_online::Trait for Runtime {
    type Call = Call;
    type Event = Event;
    type UncheckedExtrinsic = UncheckedExtrinsic;
    type ReportUnresponsiveness = Offences;
    type CurrentElectedSet = staking::CurrentElectedStashAccounts<Runtime>;
}

impl offences::Trait for Runtime {
    type Event = Event;
    type IdentificationTuple = session::historical::IdentificationTuple<Self>;
    type OnOffenceHandler = Staking;
}

impl authority_discovery::Trait for Runtime {}

parameter_types! {
    pub const WindowSize: BlockNumber = 101;
    pub const ReportLatency: BlockNumber = 1000;
}

impl finality_tracker::Trait for Runtime {
    type OnFinalizationStalled = Grandpa;
    type WindowSize = WindowSize;
    type ReportLatency = ReportLatency;
}

pub mod currency;
pub mod governance;
use governance::{council, election, proposals};
pub mod storage;
use storage::{data_directory, data_object_storage_registry, data_object_type_registry, downloads};
mod membership;
mod memo;
mod traits;
pub use forum;
use membership::members;

mod migration;
mod roles;
mod service_discovery;
use roles::actors;
use service_discovery::discovery;

/// Alias for ContentId, used in various places.
pub type ContentId = primitives::H256;

impl currency::GovernanceCurrency for Runtime {
    type Currency = balances::Module<Self>;
}

impl governance::proposals::Trait for Runtime {
    type Event = Event;
    type Members = Members;
}

impl governance::election::Trait for Runtime {
    type Event = Event;
    type CouncilElected = (Council,);
    type Members = Members;
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
    type SchemaId = u64;
    type Members = Members;
    type Roles = LookupRoles;
    type IsActiveDataObjectType = DataObjectTypeRegistry;
}

impl storage::downloads::Trait for Runtime {
    type Event = Event;
    type DownloadSessionId = u64;
    type ContentHasStorage = DataObjectStorageRegistry;
}

impl storage::data_object_storage_registry::Trait for Runtime {
    type Event = Event;
    type DataObjectStorageRelationshipId = u64;
    type Members = Members;
    type Roles = LookupRoles;
    type ContentIdExists = DataDirectory;
}

fn random_index(upper_bound: usize) -> usize {
    let seed = <system::Module<Runtime>>::random_seed();
    let mut rand: u64 = 0;
    for offset in 0..8 {
        rand += (seed.as_ref()[offset] as u64) << offset;
    }
    (rand as usize) % upper_bound
}

pub struct LookupRoles {}
impl traits::Roles<Runtime> for LookupRoles {
    fn is_role_account(account_id: &<Runtime as system::Trait>::AccountId) -> bool {
        <actors::Module<Runtime>>::is_role_account(account_id)
    }

    fn account_has_role(
        account_id: &<Runtime as system::Trait>::AccountId,
        role: actors::Role,
    ) -> bool {
        <actors::Module<Runtime>>::account_has_role(account_id, role)
    }

    fn random_account_for_role(
        role: actors::Role,
    ) -> Result<<Runtime as system::Trait>::AccountId, &'static str> {
        let ids = <actors::AccountIdsByRole<Runtime>>::get(role);

        let live_ids: Vec<<Runtime as system::Trait>::AccountId> = ids
            .into_iter()
            .filter(|id| !<discovery::Module<Runtime>>::is_account_info_expired(id))
            .collect();

        if live_ids.len() == 0 {
            Err("no staked account found")
        } else {
            let index = random_index(live_ids.len());
            Ok(live_ids[index].clone())
        }
    }
}

impl members::Trait for Runtime {
    type Event = Event;
    type MemberId = u64;
    type PaidTermId = u64;
    type SubscriptionId = u64;
    type Roles = LookupRoles;
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
        if let Some(_profile) = members::Module::<Runtime>::get_profile(id) {
            // For now the profile is not used for anything,
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
}

impl migration::Trait for Runtime {
    type Event = Event;
}

impl actors::Trait for Runtime {
    type Event = Event;
    type Members = Members;
    type OnActorRemoved = HandleActorRemoved;
}

pub struct HandleActorRemoved {}
impl actors::ActorRemoved<Runtime> for HandleActorRemoved {
    fn actor_removed(actor: &<Runtime as system::Trait>::AccountId) {
        Discovery::remove_account_info(actor);
    }
}

impl discovery::Trait for Runtime {
    type Event = Event;
    type Roles = LookupRoles;
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
		Staking: staking::{default, OfflineWorker},
		Session: session::{Module, Call, Storage, Event, Config<T>},
        FinalityTracker: finality_tracker::{Module, Call, Inherent},
		Grandpa: grandpa::{Module, Call, Storage, Config, Event},
        ImOnline: im_online::{Module, Call, Storage, Event, ValidateUnsigned, Config},
		AuthorityDiscovery: authority_discovery::{Module, Call, Config},
		Offences: offences::{Module, Call, Storage, Event},
		Sudo: sudo,
        // Joystream
		Proposals: proposals::{Module, Call, Storage, Event<T>, Config<T>},
		CouncilElection: election::{Module, Call, Storage, Event<T>, Config<T>},
		Council: council::{Module, Call, Storage, Event<T>, Config<T>},
		Memo: memo::{Module, Call, Storage, Event<T>},
		Members: members::{Module, Call, Storage, Event<T>, Config<T>},
        Forum: forum::{Module, Call, Storage, Event<T>, Config<T>},
		Migration: migration::{Module, Call, Storage, Event<T>},
		Actors: actors::{Module, Call, Storage, Event<T>, Config},
		DataObjectTypeRegistry: data_object_type_registry::{Module, Call, Storage, Event<T>, Config<T>},
		DataDirectory: data_directory::{Module, Call, Storage, Event<T>},
		DataObjectStorageRegistry: data_object_storage_registry::{Module, Call, Storage, Event<T>, Config<T>},
		DownloadSessions: downloads::{Module, Call, Storage, Event<T>, Config<T>},
        Discovery: discovery::{Module, Call, Storage, Event<T>},
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
    balances::TakeFees<Runtime>,
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
            System::random_seed()
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
        fn grandpa_pending_change(digest: &DigestFor<Block>)
            -> Option<ScheduledChange<NumberFor<Block>>>
        {
            Grandpa::pending_change(digest)
        }

        fn grandpa_forced_change(digest: &DigestFor<Block>)
            -> Option<(NumberFor<Block>, ScheduledChange<NumberFor<Block>>)>
        {
            Grandpa::forced_change(digest)
        }

        fn grandpa_authorities() -> Vec<(GrandpaId, GrandpaWeight)> {
            Grandpa::grandpa_authorities()
        }
    }

    impl babe_primitives::BabeApi<Block> for Runtime {
        fn startup_data() -> babe_primitives::BabeConfiguration {
            // The choice of `c` parameter (where `1 - c` represents the
            // probability of a slot being empty), is done in accordance to the
            // slot duration and expected target block time, for safely
            // resisting network delays of maximum two seconds.
            // <https://research.web3.foundation/en/latest/polkadot/BABE/Babe/#6-practical-results>
            babe_primitives::BabeConfiguration {
                median_required_blocks: 1000,
                slot_duration: Babe::slot_duration(),
                c: PRIMARY_PROBABILITY,
            }
        }

        fn epoch() -> babe_primitives::Epoch {
            babe_primitives::Epoch {
                start_slot: Babe::epoch_start_slot(),
                authorities: Babe::authorities(),
                epoch_index: Babe::epoch_index(),
                randomness: Babe::randomness(),
                duration: EpochDuration::get(),
                secondary_slots: Babe::secondary_slots().0,
            }
        }
    }

    impl authority_discovery_primitives::AuthorityDiscoveryApi<Block, im_online::AuthorityId> for Runtime {
        fn authority_id() -> Option<im_online::AuthorityId> {
            AuthorityDiscovery::authority_id()
        }
        fn authorities() -> Vec<im_online::AuthorityId> {
            AuthorityDiscovery::authorities()
        }

        fn sign(payload: Vec<u8>, authority_id: im_online::AuthorityId) -> Option<Vec<u8>> {
            AuthorityDiscovery::sign(payload, authority_id)
        }

        fn verify(payload: Vec<u8>, signature: Vec<u8>, public_key: im_online::AuthorityId) -> bool {
            AuthorityDiscovery::verify(payload, signature, public_key)
        }
    }

    impl node_primitives::AccountNonceApi<Block> for Runtime {
        fn account_nonce(account: AccountId) -> Index {
            System::account_nonce(account)
        }
    }

    impl substrate_session::SessionKeys<Block> for Runtime {
        fn generate_session_keys(seed: Option<Vec<u8>>) -> Vec<u8> {
            let seed = seed.as_ref().map(|s| rstd::str::from_utf8(&s).expect("Seed is an utf8 string"));
            SessionKeys::generate(seed)
        }
    }
}
