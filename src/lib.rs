// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

#[cfg(feature = "std")]
use rstd::prelude::*;

use runtime_primitives::traits::Zero;
use srml_support::traits::Currency;
use srml_support::{decl_module, decl_storage, ensure, StorageMap, StorageValue};

mod mint;
mod mock;
mod tests;

pub use mint::{AdjustCapacityBy, AdjustOnInterval, Mint, MintingError};

use system;

pub type MintId = u64;
pub const FIRST_TOKEN_MINT_ID: MintId = 1;

pub trait Trait: system::Trait + Sized {
    /// The currency to mint
    type Currency: Currency<Self::AccountId>;
}

pub type BalanceOf<T> =
    <<T as Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

decl_storage! {
    trait Store for Module<T: Trait> as Minting {
        /// Mints
        pub Mints get(mints) : map MintId => Mint<BalanceOf<T>, T::BlockNumber>;

        /// Id to use for next mint that is created.
        pub NextMintId get(next_token_mint_id): MintId = FIRST_TOKEN_MINT_ID;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn on_finalize(now: T::BlockNumber) {
            Self::update_mints(now);
        }
    }
}

impl<T: Trait> Module<T> {
    fn update_mints(now: T::BlockNumber) {
        for mint_id in FIRST_TOKEN_MINT_ID..Self::next_token_mint_id() {
            if <Mints<T>>::exists(&mint_id) {
                let mut mint = Self::mints(&mint_id);
                let did_adjust = mint.maybe_do_capacity_adjustment(now);
                if did_adjust {
                    <Mints<T>>::insert(&mint_id, mint);
                }
            }
        }
    }

    /// Adds a new mint with given settings to mints, and returns new id.
    pub fn add_mint(
        initial_capacity: BalanceOf<T>,
        adjustment: Option<AdjustOnInterval<BalanceOf<T>, T::BlockNumber>>,
        first_adjustment_in: Option<T::BlockNumber>,
    ) -> Result<MintId, MintingError> {
        let mint = Mint::new(
            initial_capacity,
            adjustment,
            <system::Module<T>>::block_number(),
            first_adjustment_in,
        );

        let mint_id = Self::next_token_mint_id();
        NextMintId::mutate(|n| {
            *n += 1;
        });
        <Mints<T>>::insert(mint_id, mint);
        Ok(mint_id)
    }

    /// Removes a mint. Passing a non existant mint has no affect.
    pub fn remove_mint(mint_id: MintId) {
        <Mints<T>>::remove(&mint_id);
    }

    // pub fn set_mint_adjustment(mint_id: MintId, adjustment: AdjustOnInterval<BalanceOf<T>, T::BlockNumber>) {}

    /// Tries to transfer exact amount from mint. Returns error if amount exceeds mint capacity
    /// Transfer amount of zero has no affect
    pub fn transfer_exact_tokens(
        mint_id: MintId,
        requested_amount: BalanceOf<T>,
        recipient: &T::AccountId,
    ) -> Result<(), MintingError> {
        if requested_amount == Zero::zero() {
            return Ok(());
        }

        // Try minting
        let mut mint = Self::ensure_mint(&mint_id)?;
        mint.mint_exact_tokens(requested_amount)?;
        <Mints<T>>::insert(mint_id, mint);

        // Deposit into recipient account
        T::Currency::deposit_creating(recipient, requested_amount);

        Ok(())
    }

    /// Tries to transfer upto requested amount from mint, returns actual amount transferred
    /// Transfer amount of zero has no affect
    pub fn transfer_some_tokens(
        mint_id: MintId,
        requested_amount: BalanceOf<T>,
        recipient: &T::AccountId,
    ) -> Result<BalanceOf<T>, MintingError> {
        if requested_amount == Zero::zero() {
            return Ok(Zero::zero());
        }

        // Try minting
        let mut mint = Self::ensure_mint(&mint_id)?;
        let minted_amount = mint.mint_some_tokens(requested_amount);
        <Mints<T>>::insert(mint_id, mint);

        // Deposit in recipient account
        T::Currency::deposit_creating(recipient, minted_amount);

        Ok(minted_amount)
    }

    pub fn set_mint_capacity(mint_id: MintId, capacity: BalanceOf<T>) -> Result<(), MintingError> {
        let mut mint = Self::ensure_mint(&mint_id)?;

        mint.set_capacity(capacity);
        <Mints<T>>::insert(mint_id, mint);
        Ok(())
    }

    pub fn transfer_capacity(
        source: MintId,
        destination: MintId,
        capacity_to_transfer: BalanceOf<T>,
    ) -> Result<(), MintingError> {
        let mut source_mint = if let Ok(source_mint) = Self::ensure_mint(&source) {
            source_mint
        } else {
            return Err(MintingError::InvalidSourceMint);
        };

        let mut destination_mint = if let Ok(destination_mint) = Self::ensure_mint(&destination) {
            destination_mint
        } else {
            return Err(MintingError::InvalidDestinationMint);
        };

        source_mint.transfer_capacity_to(&mut destination_mint, capacity_to_transfer)?;

        <Mints<T>>::insert(source, source_mint);
        <Mints<T>>::insert(destination, destination_mint);

        Ok(())
    }

    pub fn mint_has_capacity(mint_id: MintId, capacity: BalanceOf<T>) -> bool {
        Self::ensure_mint(&mint_id)
            .ok()
            .map_or_else(|| false, |mint| mint.can_mint(capacity))
    }

    pub fn mint_adjustment(
        mint_id: MintId,
    ) -> Result<Option<AdjustOnInterval<BalanceOf<T>, T::BlockNumber>>, MintingError> {
        let mint = Self::ensure_mint(&mint_id)?;
        Ok(mint.adjustment())
    }

    pub fn mint_exists(mint_id: MintId) -> bool {
        Self::ensure_mint(&mint_id).is_ok()
    }

    fn ensure_mint(mint_id: &MintId) -> Result<Mint<BalanceOf<T>, T::BlockNumber>, MintingError> {
        ensure!(<Mints<T>>::exists(mint_id), MintingError::InvalidMint);
        Ok(Self::mints(mint_id))
    }
}
