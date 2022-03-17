use codec::FullCodec;
use core::default::Default;
use frame_support::{
    decl_error, decl_event, decl_module, decl_storage,
    dispatch::{fmt::Debug, marker::Copy},
    ensure,
};
use sp_arithmetic::traits::AtLeast32BitUnsigned;

mod types;
use types::{AccountDataOf, TokenDataOf};

pub trait Trait: frame_system::Trait {
    /// Events
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    // TODO: Add frame_support::pallet_prelude::TypeInfo trait
    /// the Balance type used
    type Balance: AtLeast32BitUnsigned + FullCodec + Copy + Default + Debug;

    /// The token identifier used
    type TokenId: AtLeast32BitUnsigned + FullCodec + Copy + Default + Debug;
}

decl_storage! {
    trait Store for Module<T: Trait> as CrtCore {
        /// Double map TokenId x AccountId => AccountData for managing account data
        pub AccountInfoByAccountAndToken get(fn account_info_by_account_and_token): double_map
            hasher(blake2_128_concat) T::TokenId,
            hasher(blake2_128_concat) T::AccountId => AccountDataOf<T>;

        /// map TokenId => TokenData to retrieve token information
        pub TokenInfoById get(fn token_info_by_id): map
            hasher(blake2_128_concat) T::TokenId => TokenDataOf<T>;

    }
}

// PRIMITIVES:
decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        // issue token

        // transfer amount from source account id to destination account id

        // mint amount to specific account id

        // burn amount from specific account id

        // freeze amount for specific account id

        // unfreeze amount for specific account id
    }
}

decl_error! {
    pub enum Error for Module<T: Trait> {
        /// Free balance is insufficient for freezing specified amount
        InsufficientFreeBalanceForFreezing,

        /// Frozen balance is insufficient for unfreezing specified amount
        InsufficientFrozenBalance,

        /// Free balance is insufficient for slashing specified amount
        InsufficientFreeBalanceForSlashing,

        /// Attempt to exceed maximum issuance value
        CannotExceedMaxIssuanceValue,
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
