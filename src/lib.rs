//! The Substrate Node Template runtime. This can be compiled with `#[no_std]`, ready for Wasm.

#![cfg_attr(not(feature = "std"), no_std)]
#![cfg_attr(not(feature = "std"), feature(alloc))]
// `construct_runtime!` does a lot of recursion and requires us to increase the limit to 256.
#![recursion_limit="256"]

#[cfg(feature = "std")]
#[macro_use]
extern crate serde_derive;

use substrate_client as client;

#[macro_use]
extern crate parity_codec_derive;

pub mod governance;
use governance::{election, council, proposals};
pub mod storage;
use storage::{data_object_type_registry, data_directory, data_object_storage_registry, downloads, content_directory};
mod memo;
mod traits;
mod membership;
use membership::members;
mod migration;
mod roles;
use roles::actors;

use rstd::prelude::*;
#[cfg(feature = "std")]
use primitives::bytes;
use primitives::{Ed25519AuthorityId, OpaqueMetadata};
use runtime_primitives::{
	ApplyResult, transaction_validity::TransactionValidity, Ed25519Signature, generic,
	traits::{self as runtime_traits, Convert, BlakeTwo256, Block as BlockT, StaticLookup}, create_runtime_str
};
use client::{
	block_builder::api::{CheckInherentsResult, InherentData, self as block_builder_api},
	runtime_api, impl_runtime_apis
};
use version::RuntimeVersion;
#[cfg(feature = "std")]
use version::NativeVersion;

// A few exports that help ease life for downstream crates.
#[cfg(any(feature = "std", test))]
pub use runtime_primitives::BuildStorage;
pub use consensus::Call as ConsensusCall;
pub use timestamp::Call as TimestampCall;
pub use balances::Call as BalancesCall;
pub use runtime_primitives::{Permill, Perbill};
pub use timestamp::BlockPeriod;
pub use srml_support::{StorageValue, construct_runtime};

/// Alias to Ed25519 pubkey that identifies an account on the chain.
pub type AccountId = primitives::H256;

/// Alias for ContentId, used in various places
pub type ContentId = u64;

/// A hash of some data used by the chain.
pub type Hash = primitives::H256;

/// Index of a block number in the chain.
pub type BlockNumber = u64;

/// Index of an account's extrinsic in the chain.
pub type Nonce = u64;

/// Opaque types. These are used by the CLI to instantiate machinery that don't need to know
/// the specifics of the runtime. They can then be made to be agnostic over specific formats
/// of data like extrinsics, allowing for them to continue syncing the network through upgrades
/// to even the core datastructures.
pub mod opaque {
	use super::*;

	/// Opaque, encoded, unchecked extrinsic.
	#[derive(PartialEq, Eq, Clone, Default, Encode, Decode)]
	#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
	pub struct UncheckedExtrinsic(#[cfg_attr(feature = "std", serde(with="bytes"))] pub Vec<u8>);
	impl runtime_traits::Extrinsic for UncheckedExtrinsic {
		fn is_signed(&self) -> Option<bool> {
			None
		}
	}
	/// Opaque block header type.
	pub type Header = generic::Header<BlockNumber, BlakeTwo256, generic::DigestItem<Hash, Ed25519AuthorityId>>;
	/// Opaque block type.
	pub type Block = generic::Block<Header, UncheckedExtrinsic>;
	/// Opaque block identifier type.
	pub type BlockId = generic::BlockId<Block>;
	/// Opaque session key type.
	pub type SessionKey = Ed25519AuthorityId;
}

/// This runtime version.
pub const VERSION: RuntimeVersion = RuntimeVersion {
	spec_name: create_runtime_str!("joystream-node"),
	impl_name: create_runtime_str!("joystream-node"),
	authoring_version: 3,
	spec_version: 5,
	impl_version: 0,
	apis: RUNTIME_API_VERSIONS,
};

/// The version infromation used to identify this runtime when compiled natively.
#[cfg(feature = "std")]
pub fn native_version() -> NativeVersion {
	NativeVersion {
		runtime_version: VERSION,
		can_author_with: Default::default(),
	}
}

impl system::Trait for Runtime {
	/// The identifier used to distinguish between accounts.
	type AccountId = AccountId;
	/// The lookup mechanism to get account ID from whatever is passed in dispatchers.
	type Lookup = Indices;
	/// The index type for storing how many extrinsics an account has signed.
	type Index = Nonce;
	/// The index type for blocks.
	type BlockNumber = BlockNumber;
	/// The type for hashing blocks and tries.
	type Hash = Hash;
	/// The hashing algorithm used.
	type Hashing = BlakeTwo256;
	/// The header digest type.
	type Digest = generic::Digest<Log>;
	/// The header type.
	type Header = generic::Header<BlockNumber, BlakeTwo256, Log>;
	/// The ubiquitous event type.
	type Event = Event;
	/// The ubiquitous log type.
	type Log = Log;
	/// The ubiquitous origin type.
	type Origin = Origin;
}

impl aura::Trait for Runtime {
	type HandleReport = aura::StakingSlasher<Runtime>;
}

impl consensus::Trait for Runtime {
	/// The identifier we use to refer to authorities.
	type SessionKey = Ed25519AuthorityId;
	// The aura module handles offline-reports internally
	// rather than using an explicit report system.
	type InherentOfflineReport = ();
	/// The ubiquitous log type.
	type Log = Log;
}

/// Session key conversion.
pub struct SessionKeyConversion;
impl Convert<AccountId, Ed25519AuthorityId> for SessionKeyConversion {
	fn convert(a: AccountId) -> Ed25519AuthorityId {
		a.to_fixed_bytes().into()
	}
}

impl session::Trait for Runtime {
	type ConvertAccountIdToSessionKey = SessionKeyConversion;
	type OnSessionChange = (Staking, );
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
	/// The uniquitous event type.
	type Event = Event;
}

impl timestamp::Trait for Runtime {
	/// A timestamp: seconds since the unix epoch.
	type Moment = u64;
	type OnTimestampSet = Aura;
}

impl balances::Trait for Runtime {
	/// The type for recording an account's balance.
	type Balance = u128;
	/// What to do if an account's free balance gets zeroed.
	type OnFreeBalanceZero = Staking;
	/// What to do if a new account is created.
	type OnNewAccount = Indices;
	/// Restrict whether an account can transfer funds. We don't place any further restrictions.
	type EnsureAccountLiquid = (Staking, Actors);
	/// The uniquitous event type.
	type Event = Event;
}

impl fees::Trait for Runtime {
	type TransferAsset = Balances;
	type Event = Event;
}

impl sudo::Trait for Runtime {
	/// The uniquitous event type.
	type Event = Event;
	type Proposal = Call;
}

impl staking::Trait for Runtime {
	type Currency = balances::Module<Self>;
	type OnRewardMinted = ();
	type Event = Event;
}

impl governance::GovernanceCurrency for Runtime {
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

impl storage::data_directory::Trait for Runtime
{
	type Event = Event;
	type ContentId = ContentId;
	type Members = Members;
	type IsActiveDataObjectType = DataObjectTypeRegistry;
}

impl storage::downloads::Trait for Runtime
{
	type Event = Event;
	type DownloadSessionId = u64;
	type ContentHasStorage = DataObjectStorageRegistry;
}

impl storage::data_object_storage_registry::Trait for Runtime
{
	type Event = Event;
	type DataObjectStorageRelationshipId = u64;
	type Members = Members;
	type ContentIdExists = DataDirectory;
}

impl storage::content_directory::Trait for Runtime
{
	type Event = Event;
	type MetadataId = u64;
	type SchemaId = u64;
	type Members = Members;
}

impl members::Trait for Runtime {
	type Event = Event;
	type MemberId = u64;
	type PaidTermId = u64;
	type SubscriptionId = u64;
	type Roles = Actors;
}

impl migration::Trait for Runtime {
	type Event = Event;
}

impl actors::Trait for Runtime {
	type Event = Event;
	type Members = Members;
}

construct_runtime!(
	pub enum Runtime with Log(InternalLog: DigestItem<Hash, Ed25519AuthorityId>) where
		Block = Block,
		NodeBlock = opaque::Block,
		UncheckedExtrinsic = UncheckedExtrinsic
	{
		System: system::{default, Log(ChangesTrieRoot)},
		Timestamp: timestamp::{Module, Call, Storage, Config<T>, Inherent},
		Consensus: consensus::{Module, Call, Storage, Config<T>, Log(AuthoritiesChange), Inherent},
		Aura: aura::{Module, Inherent(Timestamp)},
		Indices: indices,
		Balances: balances,
		Session: session,
		Staking: staking::{default, OfflineWorker},
		Fees: fees::{Module, Storage, Config<T>, Event<T>},
		Sudo: sudo,
		Proposals: proposals::{Module, Call, Storage, Event<T>, Config<T>},
		CouncilElection: election::{Module, Call, Storage, Event<T>, Config<T>},
		Council: council::{Module, Call, Storage, Event<T>, Config<T>},
		Memo: memo::{Module, Call, Storage, Event<T>},
		Members: members::{Module, Call, Storage, Event<T>, Config<T>},
		Migration: migration::{Module, Call, Storage, Event<T>},
		Actors: actors::{Module, Call, Storage, Event<T>},
		DataObjectTypeRegistry: data_object_type_registry::{Module, Call, Storage, Event<T>, Config<T>},
		DataDirectory: data_directory::{Module, Call, Storage, Event<T>},
		DataObjectStorageRegistry: data_object_storage_registry::{Module, Call, Storage, Event<T>, Config<T>},
		DownloadSessions: downloads::{Module, Call, Storage, Event<T>, Config<T>},
		ContentDirectory: content_directory::{Module, Call, Storage, Event<T>, Config<T>},
	}
);

/// The type used as a helper for interpreting the sender of transactions.
type Context = system::ChainContext<Runtime>;
/// The address format for describing accounts.
type Address = <Indices as StaticLookup>::Source;
/// Block header type as expected by this runtime.
pub type Header = generic::Header<BlockNumber, BlakeTwo256, Log>;
/// Block type as expected by this runtime.
pub type Block = generic::Block<Header, UncheckedExtrinsic>;
/// BlockId type as expected by this runtime.
pub type BlockId = generic::BlockId<Block>;
/// Unchecked extrinsic type as expected by this runtime.
pub type UncheckedExtrinsic = generic::UncheckedMortalCompactExtrinsic<Address, Nonce, Call, Ed25519Signature>;
/// Extrinsic type that has already been checked.
pub type CheckedExtrinsic = generic::CheckedExtrinsic<AccountId, Nonce, Call>;
/// Executive: handles dispatch to the various modules.
pub type Executive = executive::Executive<Runtime, Block, Context, Fees, AllModules>;

// Implement our runtime API endpoints. This is just a bunch of proxying.
impl_runtime_apis! {
	impl runtime_api::Core<Block> for Runtime {
		fn version() -> RuntimeVersion {
			VERSION
		}

		fn authorities() -> Vec<Ed25519AuthorityId> {
			Consensus::authorities()
		}

		fn execute_block(block: Block) {
			Executive::execute_block(block)
		}

		fn initialise_block(header: &<Block as BlockT>::Header) {
			Executive::initialise_block(header)
		}
	}

	impl runtime_api::Metadata<Block> for Runtime {
		fn metadata() -> OpaqueMetadata {
			Runtime::metadata().into()
		}
	}

	impl block_builder_api::BlockBuilder<Block> for Runtime {
		fn apply_extrinsic(extrinsic: <Block as BlockT>::Extrinsic) -> ApplyResult {
			Executive::apply_extrinsic(extrinsic)
		}

		fn finalise_block() -> <Block as BlockT>::Header {
			Executive::finalise_block()
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

	impl runtime_api::TaggedTransactionQueue<Block> for Runtime {
		fn validate_transaction(tx: <Block as BlockT>::Extrinsic) -> TransactionValidity {
			Executive::validate_transaction(tx)
		}
	}

	impl consensus_aura::AuraApi<Block> for Runtime {
		fn slot_duration() -> u64 {
			Aura::slot_duration()
		}
	}
}
