//! # Constitution pallet.
//! `Constitution` pallet for the Joystream platform. Version 1.
//! It contains current constitution text hash and amendment number in the storage and extrinsic for
//! setting the new constitution.
//!

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

#[cfg(test)]
pub(crate) mod tests;

mod benchmarking;

use codec::{Decode, Encode};
use frame_support::weights::Weight;
use frame_support::{decl_event, decl_module, decl_storage};
use frame_system::ensure_root;
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_runtime::traits::Hash;
use sp_runtime::SaturatedConversion;
use sp_std::vec::Vec;

/// pallet_constitution WeightInfo.
/// Note: This was auto generated through the benchmark CLI using the `--weight-trait` flag
pub trait WeightInfo {
    fn amend_constitution(i: u32) -> Weight;
}

type WeightInfoConstitution<T> = <T as Trait>::WeightInfo;

pub trait Trait: frame_system::Trait {
    type Event: From<Event> + Into<<Self as frame_system::Trait>::Event>;

    /// Weight information for extrinsics in this pallet.
    type WeightInfo: WeightInfo;
}

/// Contains constitution text hash and its amendment number.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Default)]
pub struct ConstitutionInfo {
    /// Constitution text hash.
    pub text_hash: Vec<u8>,
}

decl_storage! {
    trait Store for Module<T: Trait> as Memo {
        Constitution get(fn constitution) : ConstitutionInfo;
    }
}

decl_event! {
    pub enum Event {
        /// Emits on constitution amendment.
        /// Parameters:
        /// - constitution text hash
        /// - constitution text
        ConstutionAmended(Vec<u8>, Vec<u8>),
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event() = default;

        /// Sets the current constitution hash. Requires root origin.
        /// # <weight>
        /// - Complexity: `O(C)` where C is the length of the constitution text.
        /// - Db reads: 0
        /// - Db writes: 1 (constant value)
        /// # </weight>
        #[weight = WeightInfoConstitution::<T>::amend_constitution(constitution_text.len().saturated_into())]
        pub fn amend_constitution(origin, constitution_text: Vec<u8>) {
            ensure_root(origin)?;

            //
            // == MUTATION SAFE ==
            //

            let hashed = T::Hashing::hash(&constitution_text);
            let hash = hashed.as_ref().to_vec();

            let constitution = ConstitutionInfo{
                text_hash: hash.clone(),
            };

            Constitution::put(constitution);

            Self::deposit_event(Event::ConstutionAmended(hash, constitution_text));
        }
    }
}
