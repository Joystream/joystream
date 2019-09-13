// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

#[cfg(feature = "std")]
// use serde_derive::{Deserialize, Serialize};
use rstd::prelude::*;

use codec::{Decode, Encode};
use srml_support::traits::Currency;
use srml_support::{decl_module, decl_storage, ensure, StorageMap, StorageValue};

// mod mock;
// mod tests;

use system;

pub const FIRST_TOKEN_MINT_ID: u64 = 1;

pub trait Trait: system::Trait + Sized {
    /// The currency to mint
    type Currency: Currency<Self::AccountId>;
}

pub type BalanceOf<T> =
    <<T as Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

pub type MintId = u64;

#[derive(Encode, Decode, Copy, Clone)]
pub enum AdjustCapacityBy<Balance> {
    // Set capacity of mint to specific value
    Setting(Balance),
    // Add to the capacity of the mint
    Adding(Balance),
    // Reduce capacity of the mint
    Reducing(Balance),
}

#[derive(Encode, Decode)]
pub struct AdjustOnInterval<Balance, BlockNumber> {
    block_interval: BlockNumber,
    adjustment_type: AdjustCapacityBy<Balance>,
}

#[derive(Encode, Decode, Default)]
// Note we don't use TokenMint<T: Trait> it breaks the Default derivation macro with error T doesn't impl Default
// Which requires manually implementing Default trait.
// We want Default trait on TokenMint so we can use it as value in StorageMap without needing to wrap it in an Option
pub struct TokenMint<Balance, BlockNumber> {
    capacity: Balance,

    adjustment_on_interval: Option<AdjustOnInterval<Balance, BlockNumber>>,

    // Whether there is an upcoming block where
    // When this is not set, the mint is effectively paused.
    // There should be invariant check that Some(next_in_block) > now
    adjust_capacity_at_block_number: Option<BlockNumber>,

    created_at: BlockNumber,

    total_minted: Balance,
}

pub enum MintOperationError {
    NotEnoughCapacity,
    InvalidMint,
    InvalidSourceMint,
    InvalidDestinationMint,
}

decl_storage! {
    trait Store for Module<T: Trait> as TokenMint {
        /// Mints
        pub Mints get(mints) : map MintId => TokenMint<BalanceOf<T>, T::BlockNumber>;

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
    /// Updates capacity of all mints where the adjust_capacity_at_block_number value matches the current block number.
    /// For such mints, the value is updated by adding adjustment_on_interval.block_interval.
    fn update_mints(now: T::BlockNumber) {
        for mint_id in 1..Self::next_token_mint_id() {
            if !<Mints<T>>::exists(&mint_id) {
                continue;
            }
            let mut mint = Self::mints(&mint_id);
            if let Some(when) = mint.adjust_capacity_at_block_number {
                if when == now {
                    if let Some(ref adjustment_on_interval) = mint.adjustment_on_interval {
                        // update mint capacity
                        mint.capacity = Self::calc_adjusted_capacity(
                            mint.capacity,
                            adjustment_on_interval.adjustment_type,
                        );

                        // set blocknumber for next adjustment
                        mint.adjust_capacity_at_block_number =
                            Some(now + adjustment_on_interval.block_interval);

                        // update mint
                        <Mints<T>>::insert(&mint_id, mint);
                    }
                }
            }
        }
    }

    fn calc_adjusted_capacity(
        starting_capacity: BalanceOf<T>,
        adjustment: AdjustCapacityBy<BalanceOf<T>>,
    ) -> BalanceOf<T> {
        match adjustment {
            AdjustCapacityBy::Adding(amount) => starting_capacity + amount,
            AdjustCapacityBy::Setting(amount) => amount,
            AdjustCapacityBy::Reducing(amount) => {
                if amount > starting_capacity {
                    BalanceOf::<T>::from(0)
                } else {
                    starting_capacity - amount
                }
            }
        }
    }

    /// Adds a new mint with given settings to mints, and returns new id.
    pub fn add_mint(
        initial_capacity: BalanceOf<T>,
        adjustment: Option<AdjustOnInterval<BalanceOf<T>, T::BlockNumber>>,
    ) -> Result<MintId, MintOperationError> {
        let mint = TokenMint {
            capacity: initial_capacity,
            created_at: <system::Module<T>>::block_number(),
            total_minted: BalanceOf::<T>::from(0),
            adjust_capacity_at_block_number: adjustment.as_ref().and_then(|adjustment| {
                Some(<system::Module<T>>::block_number() + adjustment.block_interval)
            }),
            adjustment_on_interval: adjustment,
        };

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

    /// Tries to transfer exact amount from mint. Returns error if amount exceeds mint capacity
    /// Transfer amount of zero has no affect
    pub fn transfer_exact_tokens(
        mint_id: MintId,
        requested_amount: BalanceOf<T>,
        recipient: T::AccountId,
    ) -> Result<(), MintOperationError> {
        let mut mint = Self::ensure_mint(&mint_id)?;

        // Do nothing if amount is zero
        if requested_amount == BalanceOf::<T>::from(0) {
            return Ok(());
        }

        ensure!(
            mint.capacity >= requested_amount,
            MintOperationError::NotEnoughCapacity
        );

        // Mint tokens and deposit in recipient account
        T::Currency::deposit_creating(&recipient, requested_amount);

        // update mint capacity
        mint.capacity = mint.capacity - requested_amount;
        <Mints<T>>::insert(mint_id, mint);

        Ok(())
    }

    /// Tries to transfer upto requested amount from mint, returns actual amount transferred
    /// Transfer amount of zero has no affect
    pub fn transfer_some_tokens(
        mint_id: MintId,
        requested_amount: BalanceOf<T>,
        recipient: T::AccountId,
    ) -> Result<BalanceOf<T>, MintOperationError> {
        let mut mint = Self::ensure_mint(&mint_id)?;

        // Do nothing if amount is zero
        if requested_amount == BalanceOf::<T>::from(0) {
            return Ok(BalanceOf::<T>::from(0));
        }

        let transfer_amount = if mint.capacity >= requested_amount {
            requested_amount
        } else {
            mint.capacity
        };

        // Mint tokens and deposit in recipient account
        T::Currency::deposit_creating(&recipient, transfer_amount);

        // update mint capacity
        mint.capacity = mint.capacity - transfer_amount;
        <Mints<T>>::insert(mint_id, mint);

        Ok(transfer_amount)
    }

    pub fn set_mint_capacity(
        mint_id: MintId,
        capacity: BalanceOf<T>,
    ) -> Result<(), MintOperationError> {
        let mut mint = Self::ensure_mint(&mint_id)?;
        // update mint capacity
        mint.capacity = capacity;
        <Mints<T>>::insert(mint_id, mint);
        Ok(())
    }

    pub fn transfer_capacity(
        source: MintId,
        destination: MintId,
        capacity_to_transfer: BalanceOf<T>,
    ) -> Result<(), MintOperationError> {
        let mut source_mint = if let Ok(source_mint) = Self::ensure_mint(&source) {
            source_mint
        } else {
            return Err(MintOperationError::InvalidSourceMint);
        };

        let mut destination_mint = if let Ok(destination_mint) = Self::ensure_mint(&destination) {
            destination_mint
        } else {
            return Err(MintOperationError::InvalidDestinationMint);
        };

        ensure!(
            source_mint.capacity >= capacity_to_transfer,
            MintOperationError::NotEnoughCapacity
        );

        source_mint.capacity = source_mint.capacity - capacity_to_transfer;
        destination_mint.capacity = destination_mint.capacity + capacity_to_transfer;

        <Mints<T>>::insert(source, source_mint);
        <Mints<T>>::insert(destination, destination_mint);

        Ok(())
    }

    pub fn mint_has_capacity(mint_id: MintId, capacity: BalanceOf<T>) -> bool {
        Self::ensure_mint(&mint_id)
            .ok()
            .map_or_else(|| false, |mint| mint.capacity >= capacity)
    }

    pub fn mint_exists(mint_id: MintId) -> bool {
        Self::ensure_mint(&mint_id).is_ok()
    }

    fn ensure_mint(
        mint_id: &MintId,
    ) -> Result<TokenMint<BalanceOf<T>, T::BlockNumber>, MintOperationError> {
        ensure!(<Mints<T>>::exists(mint_id), MintOperationError::InvalidMint);
        Ok(Self::mints(mint_id))
    }
}
