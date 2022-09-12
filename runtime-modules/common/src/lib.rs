// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

pub mod bloat_bond;
pub mod costs;
pub mod council;
pub mod currency;
pub mod locks;
pub mod membership;
pub mod storage;
pub mod working_group;

use codec::{Codec, Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

use frame_support::dispatch::DispatchResult;
use frame_support::traits::LockIdentifier;
use frame_support::Parameter;
use frame_system::Config;
pub use membership::{ActorId, MemberId, MembershipTypes, StakingAccountValidator};
use scale_info::TypeInfo;
use sp_arithmetic::traits::{BaseArithmetic, Saturating};
use sp_runtime::traits::{Hash, MaybeSerialize, Member};
use sp_std::collections::btree_set::BTreeSet;
use sp_std::vec::Vec;

/// HTTP Url string
pub type Url = Vec<u8>;
pub type AssetUrls = Vec<Url>;

/// Generic trait for strorage ownership dependent pallets.
pub trait StorageOwnership {
    /// Channel id representation.
    type ChannelId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + Ord
        + PartialEq;

    /// Content id representation.
    type ContentId: Parameter + Member + Codec + Default + Copy + MaybeSerialize + Ord + PartialEq;

    /// Data object type id.
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

/// Parameters for the 'Funding Request' proposal.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Debug, Eq, TypeInfo)]
pub struct FundingRequestParameters<Balance, AccountId> {
    /// Single reciever account of funding request
    pub account: AccountId,

    /// Amount of funds the account will recieve
    pub amount: Balance,
}

/// Kind of Balance for `Update Working Group Budget`.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Copy, PartialEq, Debug, Eq, TypeInfo)]
pub enum BalanceKind {
    /// Increasing Working Group budget decreasing Council budget
    Positive,
    /// Decreasing Working Group budget increasing Council budget
    Negative,
}

/// Gathers current block and time information for the runtime.
/// If this function is used inside a config() at genesis the timestamp will be 0
/// because the timestamp is actually produced by validators.
pub fn current_block_time<T: frame_system::Config + pallet_timestamp::Config>(
) -> BlockAndTime<T::BlockNumber, T::Moment> {
    BlockAndTime {
        block: <frame_system::Pallet<T>>::block_number(),
        time: <pallet_timestamp::Pallet<T>>::now(),
    }
}

/// Provides allowed locks combination for the accounts.
pub trait AllowedLockCombinationProvider {
    /// Return allowed locks combination set.
    fn get_allowed_lock_combinations() -> BTreeSet<(LockIdentifier, LockIdentifier)>;
}

/// Provides an interface for the generic budget.
pub trait BudgetManager<AccountId, Balance: Saturating> {
    /// Returns the current council balance.
    fn get_budget() -> Balance;

    /// Set the current budget value.
    fn set_budget(budget: Balance);

    /// Remove some balance from the council budget and transfer it to the account. Fallible.
    fn try_withdraw(account_id: &AccountId, amount: Balance) -> DispatchResult;

    /// Remove some balance from the council budget and transfer it to the account. Infallible.
    /// No side-effects on insufficient council balance.
    fn withdraw(account_id: &AccountId, amount: Balance) {
        let _ = Self::try_withdraw(account_id, amount);
    }

    /// Increase the current budget value by a specified amount.
    fn increase_budget(amount: Balance) {
        let current_budget = Self::get_budget();
        let new_budget = current_budget.saturating_add(amount);

        Self::set_budget(new_budget);
    }

    /// Decrease the current budget value by a specified amount.
    fn decrease_budget(amount: Balance) {
        let current_budget = Self::get_budget();
        let new_budget = current_budget.saturating_sub(amount);

        Self::set_budget(new_budget);
    }
}

/// Side used to construct hash values during merkle proof verification
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Copy, PartialEq, Eq, Debug, TypeInfo)]
pub enum Side {
    Left,
    Right,
}

impl Default for Side {
    fn default() -> Self {
        Side::Right
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug, TypeInfo)]
/// Element used in for channel payout
pub struct ProofElementRecord<Hash, Side> {
    // Node hash
    pub hash: Hash,
    // side in which *self* must be adjoined during proof verification
    pub side: Side,
}

#[derive(Debug)]
pub struct IndexItem {
    index: usize,
    side: Side,
}

pub fn generate_merkle_root_helper<T: Config, E: Encode>(collection: &[E]) -> Vec<T::Hash> {
    // generates merkle root from the ordered sequence collection.
    // The resulting vector is structured as follows: elements in range
    // [0..collection.len()) will be the tree leaves (layer 0), elements in range
    // [collection.len()..collection.len()/2) will be the nodes in the next to last layer (layer 1)
    // [layer_n_length..layer_n_length/2) will be the number of nodes in layer(n+1)
    assert!(!collection.is_empty());
    let mut out = Vec::new();
    for e in collection.iter() {
        out.push(T::Hashing::hash(&e.encode()));
    }

    let mut start: usize = 0;
    let mut last_len = out.len();
    //let mut new_len = out.len();
    let mut max_len = last_len >> 1;
    let mut rem = last_len % 2;

    // range [last..(maxlen >> 1) + (maxlen % 2)]
    while max_len != 0 {
        last_len = out.len();
        for i in 0..max_len {
            out.push(T::Hashing::hash(
                &[out[start + 2 * i], out[start + 2 * i + 1]].encode(),
            ));
        }
        if rem == 1 {
            out.push(T::Hashing::hash(
                &[out[last_len - 1], out[last_len - 1]].encode(),
            ));
        }
        let new_len: usize = out.len() - last_len;
        rem = new_len % 2;
        max_len = new_len >> 1;
        start = last_len;
    }
    out
}

pub fn build_merkle_path_helper<T: Config, E: Encode + Clone>(
    collection: &[E],
    idx: usize,
) -> Vec<ProofElementRecord<T::Hash, Side>> {
    let merkle_tree = generate_merkle_root_helper::<T, _>(collection);
    // builds the actual merkle path with the hashes needed for the proof
    let index_path = index_path_helper(collection.len(), idx + 1);
    index_path
        .iter()
        .map(|idx_item| crate::ProofElementRecord::<_, _> {
            hash: merkle_tree[idx_item.index - 1],
            side: idx_item.side,
        })
        .collect()
}

pub fn index_path_helper(len: usize, index: usize) -> Vec<IndexItem> {
    // used as a helper function to generate the correct sequence of indexes used to
    // construct the merkle path necessary for membership proof
    let mut idx = index;
    assert!(idx > 0); // index starting at 1
    let floor_2 = |x: usize| (x >> 1) + (x % 2);
    let mut path = Vec::new();
    let mut prev_len: usize = 0;
    let mut el = len;
    while el != 1 {
        if idx % 2 == 1 && idx == el {
            path.push(IndexItem {
                index: prev_len + idx,
                side: Side::Left,
            });
        } else {
            match idx % 2 {
                1 => path.push(IndexItem {
                    index: prev_len + idx + 1,
                    side: Side::Right,
                }),
                _ => path.push(IndexItem {
                    index: prev_len + idx - 1,
                    side: Side::Left,
                }),
            };
        }
        prev_len += el;
        idx = floor_2(idx);
        el = floor_2(el);
    }
    path
}
