//! # Joystream Utility pallet.
//! `Utility` pallet for the Joystream platform.
//!
//! A stateless module with Joystream operations helpers.
//!
//! ## Extrinsics
//!
//! - [execute_runtime_upgrade_proposal](./struct.Module.html#method.execute_runtime_upgrade_proposal) - Sets the
//! runtime code
//! - [execute_signal_proposal](./struct.Module.html#method.execute_signal_proposal) - prints the proposal to the log
//! - [update_working_group_budget](./struct.Module.html#method.update_working_group_budget) - Move funds between
//! council and working group
//! - [burn_account_tokens](./struct.Module.html#method.burn_account_tokens) - Burns token from account
//!
//! ## Dependencies
//! - [council](../substrate_council_module/index.html)
//! - [common](../substrate_common_module/index.html)

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

#[cfg(test)]
pub(crate) mod tests;

mod benchmarking;

use common::{working_group::WorkingGroup, BalanceKind};
use council::Module as Council;
use frame_support::traits::Currency;
use frame_support::traits::Get;
use frame_support::weights::{DispatchClass, Weight};
use frame_support::{decl_error, decl_event, decl_module, ensure, print};
use frame_system::{ensure_root, ensure_signed};
use sp_arithmetic::traits::Zero;
use sp_runtime::traits::Saturating;
use sp_runtime::SaturatedConversion;
use sp_std::vec::Vec;

type BalanceOf<T> = <T as balances::Trait>::Balance;
type Balances<T> = balances::Module<T>;

pub trait Trait: frame_system::Trait + balances::Trait + council::Trait {
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    /// Gets the budget of the given WorkingGroup
    fn get_working_group_budget(working_group: WorkingGroup) -> BalanceOf<Self>;

    /// Sets the budget for the given WorkingGroup
    fn set_working_group_budget(working_group: WorkingGroup, budget: BalanceOf<Self>);

    /// Weight information for extrinsics in this pallet.
    type WeightInfo: WeightInfo;
}

/// Utility WeightInfo.
/// Note: This was auto generated through the benchmark CLI using the `--weight-trait` flag
pub trait WeightInfo {
    fn execute_signal_proposal(i: u32) -> Weight;
    fn update_working_group_budget_positive_forum() -> Weight;
    fn update_working_group_budget_negative_forum() -> Weight;
    fn update_working_group_budget_positive_storage() -> Weight;
    fn update_working_group_budget_negative_storage() -> Weight;
    fn update_working_group_budget_positive_content() -> Weight;
    fn update_working_group_budget_negative_content() -> Weight;
    fn update_working_group_budget_positive_membership() -> Weight;
    fn update_working_group_budget_negative_membership() -> Weight;
    fn burn_account_tokens() -> Weight;
}

type WeightInfoUtilities<T> = <T as Trait>::WeightInfo;

decl_error! {
    /// Codex module predefined errors
    pub enum Error for Module<T: Trait> {
        /// Insufficient funds for 'Update Working Group Budget' proposal execution
        InsufficientFundsForBudgetUpdate,

        /// Trying to burn zero tokens
        ZeroTokensBurn,

        /// Insufficient funds for burning
        InsufficientFundsForBurn,
    }
}

decl_event!(
    pub enum Event<T>
    where
        Balance = BalanceOf<T>,
        AccountId = <T as frame_system::Trait>::AccountId,
    {
        /// A signal proposal was executed
        /// Params:
        /// - Signal given when creating the corresponding proposal
        Signaled(Vec<u8>),

        /// A runtime upgrade was executed
        /// Params:
        /// - New code encoded in bytes
        RuntimeUpgraded(Vec<u8>),

        /// An `Update Working Group Budget` proposal was executed
        /// Params:
        /// - Working group which budget is being updated
        /// - Amount of balance being moved
        /// - Enum variant with positive indicating funds moved torwards working group and negative
        /// and negative funds moving from the working group
        UpdatedWorkingGroupBudget(WorkingGroup, Balance, BalanceKind),

        /// An account burned tokens
        /// Params:
        /// - Account Id of the burning tokens
        /// - Balance burned from that account
        TokensBurned(AccountId, Balance),
    }
);

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event() = default;

        /// Predefined errors
        type Error = Error<T>;

        /// Signal proposal extrinsic. Should be used as callable object to pass to the `engine` module.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (S)` where:
        /// - `S` is the length of the signal
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoUtilities::<T>::execute_signal_proposal(signal.len().saturated_into())]
        pub fn execute_signal_proposal(
            origin,
            signal: Vec<u8>,
        ) {
            ensure_root(origin)?;

            // Signal proposal stub: no code implied.

            Self::deposit_event(RawEvent::Signaled(signal));
        }

        /// Runtime upgrade proposal extrinsic.
        /// Should be used as callable object to pass to the `engine` module.
        /// <weight>
        ///
        /// ## Weight
        /// `O (C)` where:
        /// - `C` is the length of `wasm`
        /// However, we treat this as a full block as `frame_system::Module::set_code` does
        /// # </weight>
        #[weight = (T::MaximumBlockWeight::get(), DispatchClass::Operational)]
        pub fn execute_runtime_upgrade_proposal(
            origin,
            wasm: Vec<u8>,
        ) {
            ensure_root(origin.clone())?;

            print("Runtime upgrade proposal execution started.");

            <frame_system::Module<T>>::set_code(origin, wasm.clone())?;

            print("Runtime upgrade proposal execution finished.");

            Self::deposit_event(RawEvent::RuntimeUpgraded(wasm));
        }

        /// Update working group budget
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)` Doesn't depend on the state or parameters
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = Module::<T>::get_update_working_group_budget_weight(&working_group, &balance_kind)]
        pub fn update_working_group_budget(
            origin,
            working_group: WorkingGroup,
            amount: BalanceOf<T>,
            balance_kind: BalanceKind,
        ) {
            ensure_root(origin.clone())?;


            let wg_budget = T::get_working_group_budget(working_group);
            let current_budget = Council::<T>::budget();

            match balance_kind {
                BalanceKind::Positive => {
                    ensure!(amount<=current_budget, Error::<T>::InsufficientFundsForBudgetUpdate);

                    T::set_working_group_budget(working_group, wg_budget.saturating_add(amount));
                    Council::<T>::set_budget(origin, current_budget - amount)?;
                },
                BalanceKind::Negative => {
                    ensure!(amount <= wg_budget, Error::<T>::InsufficientFundsForBudgetUpdate);

                    T::set_working_group_budget(working_group, wg_budget - amount);
                    Council::<T>::set_budget(origin, current_budget.saturating_add(amount))?;
                }
            }

            Self::deposit_event(RawEvent::UpdatedWorkingGroupBudget(working_group, amount, balance_kind));
        }

        /// Burns token for caller account
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)` Doesn't depend on the state or parameters
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoUtilities::<T>::burn_account_tokens()]
        pub fn burn_account_tokens(
            origin,
            amount: BalanceOf<T>
        ) {
            let account_id = ensure_signed(origin)?;
            ensure!(amount > Zero::zero(), Error::<T>::ZeroTokensBurn);
            ensure!(
                Balances::<T>::can_slash(&account_id, amount),
                Error::<T>::InsufficientFundsForBurn
            );

            // == Mutation Safe == //

            let _ = Balances::<T>::slash(&account_id, amount);

            Self::deposit_event(RawEvent::TokensBurned(account_id, amount));
        }

    }
}

impl<T: Trait> Module<T> {
    // Returns the weigt for update_working_group_budget extrinsic according to parameters
    fn get_update_working_group_budget_weight(
        group: &WorkingGroup,
        balance_kind: &BalanceKind,
    ) -> Weight {
        match balance_kind {
            BalanceKind::Positive => match group {
                WorkingGroup::Forum => {
                    WeightInfoUtilities::<T>::update_working_group_budget_positive_forum()
                }
                WorkingGroup::Storage => {
                    WeightInfoUtilities::<T>::update_working_group_budget_positive_storage()
                }
                WorkingGroup::Content => {
                    WeightInfoUtilities::<T>::update_working_group_budget_positive_content()
                }
                WorkingGroup::Membership => {
                    WeightInfoUtilities::<T>::update_working_group_budget_positive_membership()
                }
                WorkingGroup::Operations => { //TODO: benchmark it
                    WeightInfoUtilities::<T>::update_working_group_budget_positive_membership()
                }
                WorkingGroup::Gateway => { //TODO: benchmark it
                    WeightInfoUtilities::<T>::update_working_group_budget_positive_membership()
                }
            },
            BalanceKind::Negative => match group {
                WorkingGroup::Forum => {
                    WeightInfoUtilities::<T>::update_working_group_budget_negative_forum()
                }
                WorkingGroup::Storage => {
                    WeightInfoUtilities::<T>::update_working_group_budget_negative_storage()
                }
                WorkingGroup::Membership => {
                    WeightInfoUtilities::<T>::update_working_group_budget_negative_membership()
                }
                WorkingGroup::Content => {
                    WeightInfoUtilities::<T>::update_working_group_budget_negative_content()
                }
                WorkingGroup::Operations => { //TODO: benchmark it
                    WeightInfoUtilities::<T>::update_working_group_budget_negative_content()
                }
                WorkingGroup::Gateway => { //TODO: benchmark it
                    WeightInfoUtilities::<T>::update_working_group_budget_negative_content()
                }
            },
        }
    }
}
