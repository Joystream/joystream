// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

use codec::{Decode, Encode};
use frame_support::{decl_event, decl_module, decl_storage};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_std::vec::Vec;
use system::ensure_root;

pub trait Trait: system::Trait {
    type Event: From<Event> + Into<<Self as system::Trait>::Event>;
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Default)]
pub struct ConstitutionInfo {
    pub text_hash: Vec<u8>,
    pub amendment_number: u32,
}

decl_storage! {
    trait Store for Module<T: Trait> as Memo {
        Constitution get(fn constitution) : ConstitutionInfo;
        NextAmendmentNumber get(fn next_amendment_number) : u32 = 0;
    }
}

decl_event! {
    pub enum Event {
        ConstutionAmended(Vec<u8>, u32),
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event() = default;

        #[weight = 10_000_000] // TODO: adjust weight
        fn amend_contitution(origin, constitution_text: Vec<u8>) {
            ensure_root(origin)?;

            let hash = Vec::new();
            let amendment_number = Self::next_amendment_number();

            let constitution = ConstitutionInfo{
                text_hash: hash.clone(),
                amendment_number
            };

            Constitution::put(constitution);
            Self::deposit_event(Event::ConstutionAmended(hash, amendment_number));
        }
    }
}
