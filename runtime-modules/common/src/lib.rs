// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

pub mod constraints;
pub mod council;
pub mod membership;
pub mod working_group;

use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

pub use membership::{ActorId, MemberId, StakingAccountValidator};

/// Defines time in both block number and substrate time abstraction.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Clone, Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct BlockAndTime<BlockNumber, Moment> {
    /// Defines chain block
    pub block: BlockNumber,

    /// Defines time
    pub time: Moment,
}

/// Parameters for the 'Funding Request' proposal.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Debug, Eq)]
pub struct FundingRequestParameters<Balance, AccountId> {
    /// Single reciever account of funding request
    pub account: AccountId,

    /// Amount of funds the account will recieve
    pub amount: Balance,
}

/// Kind of Balance for `Update Working Group Budget`.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Copy, PartialEq, Debug, Eq)]
pub enum BalanceKind {
    /// Increasing Working Group budget decreasing Council budget
    Positive,
    /// Decreasing Working Group budget increasing Council budget
    Negative,
}

/// Gathers current block and time information for the runtime.
/// If this function is used inside a config() at genesis the timestamp will be 0
/// because the timestamp is actually produced by validators.
pub fn current_block_time<T: frame_system::Trait + pallet_timestamp::Trait>(
) -> BlockAndTime<T::BlockNumber, T::Moment> {
    BlockAndTime {
        block: <frame_system::Module<T>>::block_number(),
        time: <pallet_timestamp::Module<T>>::now(),
    }
}
