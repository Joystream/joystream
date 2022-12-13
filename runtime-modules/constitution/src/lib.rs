//! # Constitution pallet.
//! `Constitution` pallet for the Joystream platform. Version 1.
//! It contains current constitution text hash and amendment number in the storage and extrinsic for
//! setting the new constitution.
//!

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
#![allow(clippy::unused_unit)]
#![cfg_attr(
    not(any(test, feature = "runtime-benchmarks")),
    deny(clippy::panic),
    deny(clippy::panic_in_result_fn),
    deny(clippy::unwrap_used),
    deny(clippy::expect_used),
    deny(clippy::indexing_slicing),
    deny(clippy::integer_arithmetic),
    deny(clippy::match_on_vec_items),
    deny(clippy::unreachable)
)]

#[cfg(not(any(test, feature = "runtime-benchmarks")))]
#[allow(unused_imports)]
#[macro_use]
extern crate common;

pub(crate) mod tests;

mod benchmarking;
pub mod weights;
pub use weights::WeightInfo;

use codec::{Decode, Encode, MaxEncodedLen};
use frame_support::{decl_event, decl_module, decl_storage};
use frame_system::ensure_root;
use scale_info::TypeInfo;
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_runtime::traits::Hash;
use sp_runtime::SaturatedConversion;
use sp_std::vec::Vec;

type WeightInfoConstitution<T> = <T as Config>::WeightInfo;

pub trait Config: frame_system::Config {
    type Event: From<Event<Self>> + Into<<Self as frame_system::Config>::Event>;

    /// Weight information for extrinsics in this pallet.
    type WeightInfo: WeightInfo;
}

/// Contains constitution text hash and its amendment number.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Default, TypeInfo, MaxEncodedLen)]
pub struct ConstitutionInfo<Hash> {
    /// Constitution text hash.
    pub text_hash: Hash,
}

decl_storage! { generate_storage_info
    trait Store for Module<T: Config> as Constitution {
        Constitution get(fn constitution) : ConstitutionInfo<<T as frame_system::Config>::Hash>;
    }
}

decl_event! {
    pub enum Event<T> where Hash = <T as frame_system::Config>::Hash {
        /// Emits on constitution amendment.
        /// Parameters:
        /// - constitution text hash
        /// - constitution text
        ConstutionAmended(Hash, Vec<u8>),
    }
}

decl_module! {
    pub struct Module<T: Config> for enum Call where origin: T::Origin {
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

            let hash = T::Hashing::hash(&constitution_text);

            let constitution = ConstitutionInfo {
                text_hash: hash,
            };

            Constitution::<T>::put(constitution);

            Self::deposit_event(Event::<T>::ConstutionAmended(hash, constitution_text));
        }
    }
}
