use codec::FullCodec;
use core::default::Default;
use frame_support::{
    decl_error, decl_event, decl_module, decl_storage,
    dispatch::{fmt::Debug, marker::Copy},
    ensure,
};
use sp_arithmetic::traits::AtLeast32BitUnsigned;

pub trait Trait: frame_system::Trait {
    /// Events
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    // TODO: Add frame_support::pallet_prelude::TypeInfo trait
    /// the Balance type used
    type Balance: AtLeast32BitUnsigned + FullCodec + Copy + Default + Debug;
}

decl_storage! {
        trait Store for Module<T: Trait> as CrtCore {
        }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
    }
}

decl_error! {
    pub enum Error for Module<T: Trait> {
    }
}

decl_event! {
    pub enum Event<T>
    where
        Balance = <T as Trait>::Balance
    {
        /// Amount is minted
        /// Params:
        /// - token amount
        TokenMinted(Balance),

    }
}
