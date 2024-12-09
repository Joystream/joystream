// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
#![cfg_attr(
    not(any(test, feature = "runtime-benchmarks")),
    deny(clippy::panic),
    deny(clippy::panic_in_result_fn),
    deny(clippy::expect_used),
    deny(clippy::indexing_slicing),
    deny(clippy::integer_arithmetic),
    deny(clippy::match_on_vec_items),
    deny(clippy::unreachable)
)]

use core::default::Default;
use frame_support::{
    decl_module, decl_storage,
    dispatch::{marker::Copy, DispatchResult},
    ensure,
    storage::bounded_vec::BoundedVec,
    traits::{ConstU32, Currency, Get},
};
use frame_system::{ensure_root, ensure_signed};
use sp_runtime::DispatchError;
use sp_runtime::{traits::CheckedAdd, SaturatedConversion};

use sp_std::vec;

// crate modules
mod benchmarking;
mod errors;
mod events;
mod tests;
pub mod types;
pub mod weights;
pub use weights::WeightInfo;

// crate imports
use common::costs::{burn_from_usable, has_sufficient_balance_for_payment};
pub use errors::Error;
pub use events::{Event, RawEvent};
use types::*;
type WeightInfoArgo<T> = <T as Config>::WeightInfo;

pub trait Config: frame_system::Config + balances::Config {
    // /// Events
    type RuntimeEvent: From<Event<Self>> + Into<<Self as frame_system::Config>::RuntimeEvent>;

    /// Max number of accounts allow to pause the bridge
    type MaxPauserAccounts: Get<u32>;

    /// Weight information for extrinsics in this pallet.
    type WeightInfo: WeightInfo;

    /// Defines the default bridging fee.
    type DefaultBridgingFee: Get<BalanceOf<Self>>;
}

decl_storage! { generate_storage_info
    trait Store for Module<T: Config> as ArgoBridge {
        pub Status get(fn status) config(): BridgeStatus<T::BlockNumber>;

        /// Account ID that operates the bridge
        pub OperatorAccount get(fn operator_account): Option<T::AccountId>;

        /// List of account IDs with permission to pause the bridge operations
        pub PauserAccounts get(fn pauser_accounts): BoundedVec<T::AccountId, T::MaxPauserAccounts>;

        /// Number of tokens that the bridge pallet is able to mint
        pub MintAllowance get(fn mint_allowance) config(): BalanceOf<T> = 0u32.into();

        /// Amount of JOY burned as a fee for each transfer
        pub BridgingFee get(fn bridging_fee) config(): BalanceOf<T>;

        /// Number of blocks needed before bridge unpause can be finalised
        pub ThawnDuration get(fn thawn_duration) config(): T::BlockNumber;

        pub NextTransferId get(fn next_transfer_id): TransferId;

        pub RemoteChains get(fn remote_chains): BoundedVec<ChainId, ConstU32<MAX_REMOTE_CHAINS>>;
    }
}

decl_module! {
    pub struct Module<T: Config> for enum Call
    where
        origin: T::RuntimeOrigin
    {

        /// Default deposit_event() handler
        fn deposit_event() = default;

        #[weight = WeightInfoArgo::<T>::request_outbound_transfer()]
        pub fn request_outbound_transfer(origin, dest_account: RemoteAccount, amount: BalanceOf<T>, expected_fee: BalanceOf<T>) -> DispatchResult {
            Self::ensure_bridge_active()?;

            Self::ensure_chain_supported(dest_account.chain_id)?;

            let fee = Self::bridging_fee();
            ensure!(fee == expected_fee, Error::<T>::FeeDifferentThanExpected);

            let amount_with_fees = amount.checked_add(&fee).ok_or(Error::<T>::ArithmeticError)?;
            let sender = ensure_signed(origin)?;
            ensure!(has_sufficient_balance_for_payment::<T>(&sender, amount_with_fees), Error::<T>::InsufficientJoyBalance);
            let transfer_id = NextTransferId::get();
            let next_transfer_id = transfer_id.checked_add(1).ok_or(Error::<T>::ArithmeticError)?;

            //
            // == MUTATION SAFE ==
            //

            burn_from_usable::<T>(&sender, amount_with_fees)?;
            <MintAllowance<T>>::put(Self::mint_allowance() + amount);

            Self::deposit_event(RawEvent::OutboundTransferRequested(transfer_id, sender, dest_account, amount, fee));
            NextTransferId::put(next_transfer_id);

            Ok(())
        }

        #[weight = WeightInfoArgo::<T>::finalize_inbound_transfer()]
        pub fn finalize_inbound_transfer(origin, remote_transfer: RemoteTransfer, dest_account: T::AccountId, amount: BalanceOf<T>) -> DispatchResult {
            Self::ensure_bridge_active()?;

            Self::ensure_operator_origin(origin)?;

            Self::ensure_chain_supported(remote_transfer.chain_id)?;

            Self::ensure_mint_allowance(amount)?;

            //
            // == MUTATION SAFE ==
            //

            Self::mint_tokens(&dest_account, amount);

            Self::deposit_event(RawEvent::InboundTransferFinalized(remote_transfer, dest_account, amount));

            Ok(())
        }

        #[weight = WeightInfoArgo::<T>::revert_outbound_transfer()]
        pub fn revert_outbound_transfer(
            origin,
            transfer_id: TransferId,
            revert_account: T::AccountId,
            revert_amount: BalanceOf<T>,
            rationale: BoundedVec<u8, ConstU32<MAX_BYTES_RATIONALE>>,
        ) -> DispatchResult {
            Self::ensure_bridge_active()?;

            Self::ensure_operator_origin(origin)?;

            Self::ensure_mint_allowance(revert_amount)?;

            //
            // == MUTATION SAFE ==
            //

            Self::mint_tokens(&revert_account, revert_amount);

            Self::deposit_event(RawEvent::OutboundTransferReverted(transfer_id, revert_account, revert_amount, rationale));

            Ok(())
        }

        #[weight = WeightInfoArgo::<T>::pause_bridge()]
        pub fn pause_bridge(origin) -> DispatchResult {
            let caller = Self::ensure_pauser_origin(origin)?;

            //
            // == MUTATION SAFE ==
            //

            <Status<T>>::put(BridgeStatus::Paused);

            Self::deposit_event(RawEvent::BridgePaused(caller));

            Ok(())
        }

        #[weight = WeightInfoArgo::<T>::init_unpause_bridge()]
        pub fn init_unpause_bridge(origin) -> DispatchResult {
            ensure!(
                Self::status() == BridgeStatus::Paused,
                Error::<T>::BridgeNotPaused
            );

            let caller = Self::ensure_pauser_origin(origin)?;

            //
            // == MUTATION SAFE ==
            //

            let current_block = <frame_system::Pallet<T>>::block_number();
            let thawn_end_block = current_block + Self::thawn_duration();

            <Status<T>>::put(BridgeStatus::Thawn { thawn_ends_at: thawn_end_block });

            Self::deposit_event(RawEvent::BridgeThawnStarted(caller, thawn_end_block));

            Ok(())
        }

        #[weight = WeightInfoArgo::<T>::finish_unpause_bridge()]
        pub fn finish_unpause_bridge(origin) -> DispatchResult {
            Self::ensure_operator_origin(origin)?;

            let current_block = <frame_system::Pallet<T>>::block_number();
            ensure!(
                matches!(
                    Self::status(),
                    BridgeStatus::Thawn { thawn_ends_at } if current_block >= thawn_ends_at
                ),
                Error::<T>::ThawnNotFinished
            );

            //
            // == MUTATION SAFE ==
            ////

            <Status<T>>::put(BridgeStatus::Active);

            Self::deposit_event(RawEvent::BridgeThawnFinished());

            Ok(())
        }

        /// Allow Governance to Set constraints
        /// Preconditions:
        /// - origin is signed by `root`
        /// PostConditions:
        /// - governance parameters storage value set to the provided values
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// # </weight>
        #[weight = WeightInfoArgo::<T>::update_bridge_constrains()]
        pub fn update_bridge_constrains(origin, parameters: BridgeConstraintsOf<T>) -> DispatchResult {
            ensure_root(origin)?;

            if let Some(ref new_operator_account) = parameters.operator_account {
                <OperatorAccount<T>>::put(new_operator_account);
            }

            if let Some(ref new_pauser_accounts) = parameters.pauser_accounts {
                // converts into range [0, u32::MAX], no risk as we might assume that the number of pausers is less than 100
                ensure!(new_pauser_accounts.len().saturated_into::<u32>() <= T::MaxPauserAccounts::get(), Error::<T>::InvalidNumberOfPauserAccounts);
                <PauserAccounts<T>>::put(BoundedVec::truncate_from(new_pauser_accounts.to_vec()));
            }

            if let Some(new_bridging_fee) = parameters.bridging_fee {
                <BridgingFee<T>>::put(new_bridging_fee);
            }

            if let Some(new_thawn_duration) = parameters.thawn_duration {
                 <ThawnDuration<T>>::put(new_thawn_duration);
             }

             if let Some(ref new_remote_chains) = parameters.remote_chains {
                RemoteChains::put(new_remote_chains);
             }

             Self::deposit_event(RawEvent::BridgeConfigUpdated(parameters));

            Ok(())
        }

    }
}

/// Module implementation
impl<T: Config> Module<T> {
    pub fn ensure_bridge_active() -> DispatchResult {
        ensure!(
            Self::status() == BridgeStatus::Active,
            Error::<T>::BridgeNotActive
        );
        Ok(())
    }

    pub fn ensure_operator_origin(origin: T::RuntimeOrigin) -> Result<T::AccountId, DispatchError> {
        let caller = ensure_signed(origin)?;
        if let Some(operator_account) = Self::operator_account() {
            ensure!(caller == operator_account, Error::<T>::NotOperatorAccount);
            Ok(caller)
        } else {
            Err(Error::<T>::OperatorAccountNotSet.into())
        }
    }

    pub fn ensure_pauser_origin(origin: T::RuntimeOrigin) -> Result<T::AccountId, DispatchError> {
        let caller = ensure_signed(origin)?;
        let accounts = Self::pauser_accounts();
        ensure!(accounts.contains(&caller), Error::<T>::NotPauserAccount);
        Ok(caller)
    }

    pub fn ensure_mint_allowance(amount: BalanceOf<T>) -> DispatchResult {
        ensure!(
            amount <= Self::mint_allowance(),
            Error::<T>::InsufficientBridgeMintAllowance
        );
        Ok(())
    }

    pub fn ensure_chain_supported(chain_id: ChainId) -> DispatchResult {
        ensure!(
            RemoteChains::get().contains(&chain_id),
            Error::<T>::NotSupportedRemoteChainId
        );
        Ok(())
    }

    pub fn mint_tokens(dest_account: &T::AccountId, amount: BalanceOf<T>) {
        <MintAllowance<T>>::put(Self::mint_allowance() - amount);
        let _ = balances::Pallet::<T>::deposit_creating(dest_account, amount);
    }
}

impl<T: Config> frame_support::traits::Hooks<T::BlockNumber> for Pallet<T> {
    #[cfg(feature = "try-runtime")]
    fn try_state(_: T::BlockNumber) -> Result<(), &'static str> {
        Ok(())
    }
}
