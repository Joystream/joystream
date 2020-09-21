// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

pub mod constraints;
pub mod currency;
pub mod origin;
pub mod working_group;

use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

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
