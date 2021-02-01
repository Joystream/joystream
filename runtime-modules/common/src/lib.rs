// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

pub mod constraints;
pub mod currency;
pub mod origin;
pub mod storage;
pub mod working_group;

use codec::{Codec, Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

use frame_support::Parameter;
use sp_arithmetic::traits::BaseArithmetic;
use sp_runtime::traits::{MaybeSerialize, Member};

/// Member id type alias
pub type MemberId<T> = <T as Trait>::MemberId;

/// Actor id type alias
pub type ActorId<T> = <T as Trait>::ActorId;

/// Generic trait for membership dependent pallets.
pub trait Trait: system::Trait {
    /// Describes the common type for the members.
    type MemberId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + Ord
        + PartialEq;

    /// Describes the common type for the working group members (workers).
    type ActorId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + Ord
        + PartialEq;

    /// Channel id representation
    type ChannelId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + Ord
        + PartialEq;

    /// DAO id.
    type DAOId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + Ord
        + PartialEq;

    /// Content id.
    type ContentId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + From<u32>
        + Default
        + Copy
        + MaybeSerialize
        + Ord
        + PartialEq;

    /// DAO object type id.
    type DataObjectTypeId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + Ord
        + PartialEq;
}

/// Defines time in both block number and substrate time abstraction.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Clone, Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct BlockAndTime<BlockNumber, Moment> {
    /// Defines chain block
    pub block: BlockNumber,

    /// Defines time
    pub time: Moment,
}

/// Gathers current block and time information for the runtime.
/// If this function is used inside a config() at genesis the timestamp will be 0
/// because the timestamp is actually produced by validators.
pub fn current_block_time<T: system::Trait + pallet_timestamp::Trait>(
) -> BlockAndTime<T::BlockNumber, T::Moment> {
    BlockAndTime {
        block: <system::Module<T>>::block_number(),
        time: <pallet_timestamp::Module<T>>::now(),
    }
}
