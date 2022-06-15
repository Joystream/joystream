//! Low-level types used throughout the Substrate code.

#![warn(missing_docs)]
#![cfg_attr(not(feature = "std"), no_std)]

use sp_runtime::{
    traits::{IdentifyAccount, Verify},
    MultiSignature,
};
use sp_std::convert::{TryFrom, TryInto};

/// Priority for a transaction. Additive. Higher is better.
pub type TransactionPriority = u64;

/// Alias for ContentId, used in various places.
pub type ContentId = sp_core::H256;

/// Alias for DataObjectTypeId, used in various places.
pub type DataObjectTypeId = u64;

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
pub type Hash = sp_core::H256;

/// Moment type
pub type Moment = u64;

/// Content Directory Channel identifier.
pub type ChannelId = u64;

/// Content Directory Channel Category identifier.
pub type ChannelCategoryId = u64;

/// Content Directory Video identifier.
pub type VideoId = u64;

/// Content Directory Open Auction identifier.
pub type OpenAuctionId = u64;

/// Content Directory Video Category identifier.
pub type VideoCategoryId = u64;

/// Curator group identifier.
pub type CuratorGroupId = u64;

/// Content Directory Reaction Identifier
pub type ReactionId = u64;

/// Represent a Video Post in the content module
pub type VideoPostId = u64;

/// Represents a thread identifier for both Forum and Proposals Discussion
///
/// Note: Both modules expose type names ThreadId and PostId (which are defined on their Config) and
/// used in state storage and dispatchable method's argument types,
/// and are therefore part of the public API/metadata of the runtime.
/// In the current version the polkadot-js/api that is used and is compatible with the runtime,
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

/// Represent an member in membership group, which is the same in the working groups.
pub type MemberId = u64;

/// Represent a data object from the storage pallet.
pub type DataObjectId = u64;

/// Represent a storage bucket from the storage pallet.
pub type StorageBucketId = u64;

/// Represent a distribution bucket index within the distribution bucket family from the
/// storage pallet.
pub type DistributionBucketIndex = u64;

/// Represent a distribution bucket family from the storage pallet.
pub type DistributionBucketFamilyId = u64;

/// Represent relationships between distribution buckets and distribution working group workers.
pub type DistributionBucketOperatorId = u64;
