// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

// Do not delete! Cannot be uncommented by default, because of Parity decl_module! issue.
//#![warn(missing_docs)]


// TODO: add module comment
// TODO: add types comments
// TODO: add benchmarks

use frame_support::{decl_error, decl_event, decl_module, decl_storage};
use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

use common::working_group::WorkingGroup;

/// Storage trait.
pub trait Trait: frame_system::Trait + balances::Trait {
	/// Storage event type.
	type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;
}


/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as balances::Trait>::Balance;

type StorageBucketId = u64; // TODO: Move to the Trait
type MemberId = u64; // Move to the Trait
type ChannelId = u64; // Move to the Trait
type DaoId = u64; // Move to the Trait

pub struct PendingDataObjectStatus {
	pub liaison: StorageBucketId
}

pub enum DataObjectStatus {
	Pending(PendingDataObjectStatus),
	AcceptedByLiaison
}

pub struct DataObject<Balance> {
	pub status: DataObjectStatus,
	pub deletion_prize: Balance
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct DataObjectCreationParameters {
	pub size: u64,
	pub ipfs_content_id: Vec<u8>,
}

/// Identifier for a bag.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum BagId {
	DynamicBag(DynamicBagId),
	StaticBag(StaticBagId)
}

impl Default for BagId {
	fn default() -> Self {
		Self::DynamicBag(Default::default())
	}
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum StaticBagId {
	Council,
	WorkingGroup(WorkingGroup)
}

impl Default for StaticBagId {
	fn default() -> Self {
		Self::Council
	}
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum DynamicBagId {
	Member(MemberId),
	Channel(ChannelId),
	Dao(DaoId),
}

impl Default for DynamicBagId {
	fn default() -> Self {
		Self::Member(Default::default())
	}
}


#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct UploadParameters<AccountId> {
	/// Public key used authentication in upload to liason.
	pub authentication_key: Vec<u8>,
	pub bag: BagId,
	pub object_creation: Vec<DataObjectCreationParameters>,
	pub deletion_prize_source_account: AccountId
}

decl_storage! {
    trait Store for Module<T: Trait> as Storage {}
}

decl_event! {
    /// Storage events
 pub enum Event<T>
    where
        <T as frame_system::Trait>::AccountId
    {
        /// Emits on adding of the content.
        ContentAdded(AccountId),
    }
}

decl_error! {
    /// Storage module predefined errors
    pub enum Error for Module<T: Trait>{
        /// Proposal cannot have an empty title"
        EmptyTitleProvided,
    }
}

decl_module! {
    /// _Data directory_ substrate module.
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Default deposit_event() handler
        fn deposit_event() = default;

        /// Predefined errors.
        type Error = Error<T>;

        /// Upload new objects, and does so atomically if there is more than one provided.
		/// TODO:
		/// - Must return rich information about bags & data objects created.
		/// - a `can_upload` extrinsic is likely going to be needed
		#[weight = 10_000_000] // TODO: adjust weight
		pub fn upload(origin, parameters: UploadParameters<<T as frame_system::Trait>::AccountId>) {

		}
    }
}

