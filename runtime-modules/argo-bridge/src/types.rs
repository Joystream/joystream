use codec::{Decode, Encode, MaxEncodedLen};
use frame_support::{storage::bounded_vec::BoundedVec, traits::ConstU32};
use scale_info::TypeInfo;
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

use sp_std::vec::Vec;

// Balance type alias
pub type BalanceOf<T> = <T as balances::Config>::Balance;

pub type ChainId = u32;
pub type TransferId = u64;

pub const MAX_REMOTE_CHAINS: u32 = 10;

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo, MaxEncodedLen)]
pub struct BridgeConstraints<AccountId, Balance, BlockNumber> {
    pub operator_account: Option<AccountId>,
    pub pauser_accounts: Option<Vec<AccountId>>,
    pub bridging_fee: Option<Balance>,
    pub thawn_duration: Option<BlockNumber>,
    pub remote_chains: Option<BoundedVec<ChainId, ConstU32<MAX_REMOTE_CHAINS>>>,
}

pub type BridgeConstraintsOf<T> = BridgeConstraints<
    <T as frame_system::Config>::AccountId,
    BalanceOf<T>,
    <T as frame_system::Config>::BlockNumber,
>;

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Copy, Clone, PartialEq, Eq, Debug, TypeInfo, MaxEncodedLen)]
pub struct RemoteAccount {
    // EVM-based addresses only need 20 bytes but we use 32 bytes to enable compatibility with other chains
    // When using Ethereum addresses, the last 12 bytes should be zero
    pub account: [u8; 32],
    pub chain_id: ChainId,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo, MaxEncodedLen)]
pub struct RemoteTransfer {
    pub id: TransferId,
    pub chain_id: ChainId,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo, MaxEncodedLen)]
pub enum BridgeStatus<BlockNumber> {
    Active,
    Paused,
    Thawn { thawn_ends_at: BlockNumber },
}

impl<BlockNumber: Default> Default for BridgeStatus<BlockNumber> {
    fn default() -> Self {
        BridgeStatus::Thawn {
            thawn_ends_at: Default::default(),
        }
    }
}
