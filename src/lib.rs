// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

#[cfg(feature = "std")]
use rstd::prelude::*;

use codec::Codec;
use runtime_primitives::traits::{MaybeSerializeDebug, Member, One, SimpleArithmetic, Zero};
use srml_support::traits::Currency;
use srml_support::{
    decl_module, decl_storage, ensure, EnumerableStorageMap, Parameter, StorageMap, StorageValue,
};

mod mint;
mod mock;
mod tests;

pub use mint::{AdjustCapacityBy, AdjustOnInterval, Adjustment, Mint, MintingError};

use system;

pub trait Trait: system::Trait {
    /// The currency to mint.
    type Currency: Currency<Self::AccountId>;

    /// The type used as a mint identifier.
    type MintId: Parameter
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

#[derive(PartialEq, Eq, Debug)]
pub enum GeneralError {
    MintNotFound,
    NextAdjustmentInPast,
}

/// Errors that can arise from attempt to mint and transfer tokens from a mint to
/// an account.
#[derive(PartialEq, Eq, Debug)]
pub enum TransferError {
    MintNotFound,
    NotEnoughCapacity,
}

/// Errors that can arise from attempt to transfer capacity between mints.
#[derive(PartialEq, Eq, Debug)]
pub enum CapacityTransferError {
    SourceMintNotFound,
    DestinationMintNotFound,
    NotEnoughCapacity,
}

impl From<MintingError> for CapacityTransferError {
    fn from(err: MintingError) -> CapacityTransferError {
        match err {
            MintingError::NotEnoughCapacity => CapacityTransferError::NotEnoughCapacity,
        }
    }
}

impl From<MintingError> for TransferError {
    fn from(err: MintingError) -> TransferError {
        match err {
            MintingError::NotEnoughCapacity => TransferError::NotEnoughCapacity,
        }
    }
}

decl_storage! {
    trait Store for Module<T: Trait> as Minting {
        /// Mints
        pub Mints get(mints) : linked_map T::MintId => Mint<BalanceOf<T>, T::BlockNumber>;

        /// The number of mints created.
        pub MintsCreated get(mints_created): T::MintId;
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
        <Mints<T>>::enumerate().for_each(|(mint_id, ref mut _mint)| {
            <Mints<T>>::mutate(mint_id, |mint| {
                mint.maybe_do_capacity_adjustment(now);
            });
            // even with ref mut mint storage value isn't updated
            // _mint.maybe_do_capacity_adjustment(now);
        });
    }

    /// Adds a new mint with given settings to mints, and returns new id.
    pub fn add_mint(
        initial_capacity: BalanceOf<T>,
        adjustment: Option<Adjustment<BalanceOf<T>, T::BlockNumber>>,
    ) -> Result<T::MintId, GeneralError> {
        let now = <system::Module<T>>::block_number();

        // Make sure the next adjustment if set, is in the future

        if let Some(adjustment) = adjustment {
            match adjustment {
                Adjustment::IntervalAfterFirstAdjustmentAbsolute(_, first_adjustment_in) => {
                    ensure!(
                        first_adjustment_in > now,
                        GeneralError::NextAdjustmentInPast
                    );
                }
                _ => (),
            }
        }

        let mint = Mint::new(initial_capacity, adjustment, now);

        // get next mint_id and increment total number of mints created
        let mint_id = Self::mints_created();
        <MintsCreated<T>>::mutate(|n| {
            *n += One::one();
        });
        <Mints<T>>::insert(mint_id, mint);
        Ok(mint_id)
    }

    /// Removes a mint. Passing a non existant mint has no affect.
    pub fn remove_mint(mint_id: T::MintId) {
        <Mints<T>>::remove(&mint_id);
    }

    // pub fn set_mint_adjustment(mint_id: T::MintId, adjustment: AdjustOnInterval<BalanceOf<T>, T::BlockNumber>) {}

    /// Tries to transfer exact amount from mint. Returns error if amount exceeds mint capacity
    /// Transfer amount of zero has no affect
    pub fn transfer_tokens(
        mint_id: T::MintId,
        requested_amount: BalanceOf<T>,
        recipient: &T::AccountId,
    ) -> Result<(), TransferError> {
        if requested_amount == Zero::zero() {
            return Ok(());
        }

        ensure!(<Mints<T>>::exists(&mint_id), TransferError::MintNotFound);

        // Try minting
        <Mints<T>>::mutate(&mint_id, |mint| mint.mint_tokens(requested_amount))?;

        // Deposit into recipient account
        T::Currency::deposit_creating(recipient, requested_amount);

        Ok(())
    }

    pub fn set_mint_capacity(
        mint_id: T::MintId,
        capacity: BalanceOf<T>,
    ) -> Result<(), GeneralError> {
        ensure!(<Mints<T>>::exists(&mint_id), GeneralError::MintNotFound);
        let mut mint = Self::mints(&mint_id);
        mint.set_capacity(capacity);
        <Mints<T>>::insert(mint_id, mint);
        Ok(())
    }

    pub fn transfer_capacity(
        source: T::MintId,
        destination: T::MintId,
        capacity_to_transfer: BalanceOf<T>,
    ) -> Result<(), CapacityTransferError> {
        ensure!(
            <Mints<T>>::exists(&source),
            CapacityTransferError::SourceMintNotFound
        );
        ensure!(
            <Mints<T>>::exists(&destination),
            CapacityTransferError::DestinationMintNotFound
        );

        let mut source_mint = Self::mints(&source);
        let mut destination_mint = Self::mints(&destination);

        source_mint.transfer_capacity_to(&mut destination_mint, capacity_to_transfer)?;

        <Mints<T>>::insert(source, source_mint);
        <Mints<T>>::insert(destination, destination_mint);

        Ok(())
    }

    pub fn mint_has_capacity(mint_id: T::MintId, capacity: BalanceOf<T>) -> bool {
        if !<Mints<T>>::exists(&mint_id) {
            return false;
        }
        Self::mints(&mint_id).can_mint(capacity)
    }

    pub fn mint_capacity(mint_id: T::MintId) -> Result<BalanceOf<T>, GeneralError> {
        ensure!(<Mints<T>>::exists(&mint_id), GeneralError::MintNotFound);
        let mint = Self::mints(&mint_id);
        Ok(mint.capacity())
    }

    pub fn mint_adjustment(
        mint_id: T::MintId,
    ) -> Result<AdjustOnInterval<BalanceOf<T>, T::BlockNumber>, GeneralError> {
        ensure!(<Mints<T>>::exists(&mint_id), GeneralError::MintNotFound);
        let mint = Self::mints(&mint_id);
        Ok(mint.adjustment())
    }

    pub fn mint_exists(mint_id: T::MintId) -> bool {
        <Mints<T>>::exists(&mint_id)
    }
}
