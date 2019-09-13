// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

#[cfg(feature = "std")]
// use serde_derive::{Deserialize, Serialize};
use rstd::prelude::*;

use codec::{Codec, Decode, Encode};
use runtime_primitives::traits::{MaybeSerializeDebug, Member, SimpleArithmetic};
use srml_support::traits::Currency;
use srml_support::{decl_module, decl_storage, ensure, Parameter, StorageMap, StorageValue};

// mod mock;
// mod tests;

use system;

pub trait Trait: system::Trait + timestamp::Trait + Sized {
    //type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    /// The currency to mint
    type Currency: Currency<Self::AccountId>;

    /// Identifier type for a token mint
    type TokenMintId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerializeDebug
        + PartialEq;
}

pub type BalanceOf<T> =
    <<T as Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

#[derive(Encode, Decode, Copy, Clone)]
pub enum AdjustCapacityBy {
    Setting,
    Adding,
    Reducing,
}

// Default impl for enum so Default impl can be derived for TokenMint
impl Default for AdjustCapacityBy {
    fn default() -> Self {
        AdjustCapacityBy::Setting
    }
}

#[derive(Encode, Decode, Default)]
// Note we don't use TokenMint<T: Trait> it breaks the Default derivation macro with error T doesn't impl Default
// Which requires manually implementing Default trait.
// We want Default trait on TokenMint so we can use it as value in StorageMap without needing to wrap it in an Option
pub struct TokenMint<Balance, BlockNumber> {
    capacity: Balance,

    adjustment_type: AdjustCapacityBy,

    block_interval: BlockNumber,

    // Whether there is an upcoming block where
    // When this is not set, the mint is effectively paused.
    // There should be invariant check that Some(next_in_block) > now
    adjust_capacity_in_block_nr: Option<BlockNumber>,

    created: BlockNumber,

    total_minted: Balance,
}

decl_storage! {
    trait Store for Module<T: Trait> as TokenMint {
        /// Mints
        pub Mints get(mints) : map T::TokenMintId => TokenMint<BalanceOf<T>, T::BlockNumber>;

        /// Id to use for next mint that is created. First mint id is implicitly 1
        pub NextTokenMintId get(next_token_mint_id): T::TokenMintId = T::TokenMintId::from(1);
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {


    }
}

impl<T: Trait> Module<T> {}
