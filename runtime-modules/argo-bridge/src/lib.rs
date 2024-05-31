// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
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

use core::{convert::TryInto, default::Default};
use frame_support::{
    decl_module, decl_storage,
    dispatch::{marker::Copy, DispatchResult},
    ensure,
    storage::bounded_vec::BoundedVec,
    traits::{ConstU32, Currency, Get},
};
use frame_system::{ensure_root, ensure_signed};

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
            ensure!(Self::status() == BridgeStatus::Active, Error::<T>::BridgeNotActive);
            ensure!(RemoteChains::get().contains(&dest_account.chain_id), Error::<T>::NotSupportedRemoteChainId);

            let fee = Self::bridging_fee();
            ensure!(fee == expected_fee, Error::<T>::FeeDifferentThanExpected);

            let amount_with_fees = fee + amount;
            let sender = ensure_signed(origin)?;
            ensure!(has_sufficient_balance_for_payment::<T>(&sender, amount_with_fees), Error::<T>::InsufficientJoyBalance);

            burn_from_usable::<T>(&sender, amount_with_fees)?;
            <MintAllowance<T>>::put(Self::mint_allowance() + amount);

            let transfer_id = NextTransferId::get();
            Self::deposit_event(RawEvent::OutboundTransferRequested(transfer_id, sender, dest_account, amount, fee));
            NextTransferId::put(transfer_id + 1);

            Ok(())
        }

        #[weight = WeightInfoArgo::<T>::finalize_inbound_transfer()]
        pub fn finalize_inbound_transfer(origin, remote_transfer: RemoteTransfer, dest_account: T::AccountId, amount: BalanceOf<T>) -> DispatchResult {
            ensure!(!Self::operator_account().is_none(), Error::<T>::OperatorAccountNotSet);
            let caller = ensure_signed(origin)?;
            ensure!(caller == Self::operator_account().unwrap(), Error::<T>::NotOperatorAccount);

            ensure!(Self::status() == BridgeStatus::Active, Error::<T>::BridgeNotActive);
            ensure!(amount <= Self::mint_allowance(), Error::<T>::InsufficientBridgeMintAllowance);

            ensure!(RemoteChains::get().contains(&remote_transfer.chain_id), Error::<T>::NotSupportedRemoteChainId);

            <MintAllowance<T>>::put(Self::mint_allowance() - amount);
            let _ = balances::Pallet::<T>::deposit_creating(
                &dest_account,
                amount
            );

            Self::deposit_event(RawEvent::InboundTransferFinalized(remote_transfer, dest_account, amount));

            Ok(())
        }

        #[weight = WeightInfoArgo::<T>::pause_bridge()]
        pub fn pause_bridge(origin) -> DispatchResult {
            let caller = ensure_signed(origin)?;
            let accounts = Self::pauser_accounts();
            ensure!(accounts.contains(&caller), Error::<T>::NotPauserAccount);

            <Status<T>>::put(BridgeStatus::Paused);
            Self::deposit_event(RawEvent::BridgePaused(caller));

            Ok(())
        }

        #[weight = WeightInfoArgo::<T>::init_unpause_bridge()]
        pub fn init_unpause_bridge(origin) -> DispatchResult{
            let caller = ensure_signed(origin)?;
            ensure!(Self::pauser_accounts().contains(&caller), Error::<T>::NotPauserAccount);

            let current_block = <frame_system::Pallet<T>>::block_number();
            let thawn_end_block = current_block + Self::thawn_duration();
            <Status<T>>::put(BridgeStatus::Thawn { thawn_ends_at: thawn_end_block});
            Self::deposit_event(RawEvent::BridgeThawnStarted(caller, thawn_end_block));

            Ok(())
        }

        #[weight = WeightInfoArgo::<T>::finish_unpause_bridge()]
        pub fn finish_unpause_bridge(origin) -> DispatchResult {
            let caller = ensure_signed(origin)?;
            ensure!(!Self::operator_account().is_none(), Error::<T>::OperatorAccountNotSet);
            ensure!(caller == Self::operator_account().unwrap(), Error::<T>::NotOperatorAccount);

            let current_block = <frame_system::Pallet<T>>::block_number();
            ensure!(
                matches!(Self::status(), BridgeStatus::Thawn { thawn_ends_at }
                    if current_block >= thawn_ends_at), Error::<T>::ThawnNotFinished);

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
                ensure!(new_pauser_accounts.len() <= T::MaxPauserAccounts::get().try_into().unwrap(), Error::<T>::InvalidNumberOfPauserAccounts);
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
impl<T: Config> Module<T> {}

impl<T: Config> frame_support::traits::Hooks<T::BlockNumber> for Pallet<T> {
    #[cfg(feature = "try-runtime")]
    fn try_state(_: T::BlockNumber) -> Result<(), &'static str> {
        Ok(())
    }
}
