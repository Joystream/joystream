// TODO: adjust all extrinsic weights
// TODO: module documentation

// used dependencies
use codec::{Codec, Decode, Encode};
use frame_support::traits::{
    Currency, EnsureOrigin, Get, LockIdentifier, LockableCurrency, WithdrawReason,
};
use frame_support::{
    decl_error, decl_event, decl_module, decl_storage, error::BadOrigin, Parameter, StorageValue,
};
use sp_arithmetic::traits::BaseArithmetic;
use sp_runtime::traits::{MaybeSerialize, Member};
use std::marker::PhantomData;
use system::ensure_signed;


/////////////////// Data Structures ////////////////////////////////////////////
/*
#[derive(Encode, Decode)]
pub enum BudgetType {
    ElectedMemberRewards,
    FundingProposal,
}
*/


pub struct Budget<T: Trait> {
    balance: Balance<T>,
}

/*
impl<T: Trait> Budget<T> {
    fn has_sufficient_balance(&self, budget_type: BudgetType, amount: Balance<T>) -> bool {
        amount <= self.balance
    }

    fn spend_from_budget(&self, budget_type: BudgetType, amount: Balance<T>) -> bool {
        if !self.has_sufficient_balance() {
            return false;
        }

        self.balance -= amount;

        true
    }

    fn refill_budget(&self, budget_type: BudgetType, amount: Balance<T>) {

    }

    fn set_budget(&self, budget_type: BudgetType, amount: Balance<T>) {

    }

    fn save_change() {

    }
}
*/

pub struct RewardRecipient<T: Trait> {
    last_withdraw_block: Option<T::BlockNumber>,
    reward_per_block: Balance<T>,
    unpaid_reward: Balance<T>,
}

/////////////////// Type aliases ///////////////////////////////////////////////

pub type Balance<T> =
    <<T as Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

/////////////////// Trait, Storage, Errors, and Events /////////////////////////

/// The main spending budget trait.
pub trait Trait: system::Trait {
    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    /// Representation for council membership.
    type BudgetUserId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + From<u64>;

    /// Currency for referendum staking.
    type Currency: Currency<Self::AccountId>;

    type BudgetType: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + From<u64>;

    fn pay_reward(budget_type: Self::BudgetType, target_account_id: Self::AccountId) -> Result<(), ()>;
}

pub trait BudgetController<T: Trait> {
    fn get_budget_balance(budget_type: T::BudgetType) -> Balance<T>;
    fn has_sufficient_balance(budget_type: T::BudgetType, amount: Balance<T>) -> bool;
    fn spend_from_budget(budget_type: T::BudgetType, amount: Balance<T>) -> bool;
    fn refill_budget(budget_type: T::BudgetType, amount: Balance<T>);
    fn set_budget(budget_type: T::BudgetType, amount: Balance<T>);
}

pub trait PeriodicRewardBudget<T: Trait>: BudgetController<T> {
    fn add_recipient(budget_type: T::BudgetType, id: T::BudgetUserId, reward_per_block: Balance<T>);
    fn remove_recipient(budget_type: T::BudgetType, id: T::BudgetUserId);
    fn remove_recipient_clear_reward(budget_type: T::BudgetType, id: T::BudgetUserId);
}


decl_storage! {
    trait Store for Module<T: Trait> as SpendingBudget {
        pub Budgets get(fn budgets) config(): map hasher(blake2_128_concat) T::BudgetType => Balance::<T>;

        pub PeriodicRewardRecipient get(fn budgets) config(): double_map hasher(blake2_128_concat) T::BudgetType, hasher(blake2_128_concat) T::BudgetUserId => RewardRecipient<T>;
    }
}

decl_event! {
    pub enum Event<T>
    where
        BudgetUserId = <T as Trait>::BudgetUserId,
    {
        ///
        TmpEvent(BudgetUserId),
    }
}


decl_error! {
    /// Budget errors
    pub enum Error for Module<T: Trait> {
        ///
        BudgetDepleted,

        RewardPaymentFail,
    }
}

/////////////////// Module definition and implementation ///////////////////////

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error<T>;

        /// Setup events
        fn deposit_event() = default;

        // No origin so this is a priviledged call
        fn on_finalize(now: T::BlockNumber) {
            Self::try_progress_stage(now);
        }

        ///
        #[weight = 10_000_000]
        pub fn withdraw_reward(origin, budget_type: T::BudgetType, target_account_id: T::AccountId) -> Result<(), Error<T>> {
            T::pay_reward(budget_type, target_account_id).map_err(|_| Error::<T>::RewardPaymentFail);

            Ok(())
        }
    }
}

/////////////////// Inner logic ////////////////////////////////////////////////

impl<T: Trait> Module<T> {
    fn try_progress_stage(now: T::BlockNumber) {

    }
}

impl<T: Trait> BudgetController<T> for Module<T> {

    fn get_budget_balance(budget_type: T::BudgetType) -> Balance<T> {
        if !Budgets::<T>::contains_key(budget_type) {
            return 0.into();
        }

        return Budgets::<T>::get(budget_type);
    }

    fn has_sufficient_balance(budget_type: T::BudgetType, amount: Balance<T>) -> bool {
        amount <= Self::get_budget_balance(budget_type)
    }

    fn spend_from_budget(budget_type: T::BudgetType, amount: Balance<T>) -> bool {
        if !Self::has_sufficient_balance(budget_type, amount) {
            return false;
        }

        Budgets::<T>::insert(budget_type, amount);

        true
    }

    fn refill_budget(budget_type: T::BudgetType, amount: Balance<T>) {
        Budgets::<T>::insert(budget_type, Self::get_budget_balance(budget_type));
    }

    fn set_budget(budget_type: T::BudgetType, amount: Balance<T>) {
        Budgets::<T>::insert(budget_type, amount);
    }
}

impl<T: Trait> PeriodicRewardBudget<T> for Module<T> {
    fn add_recipient(budget_type: T::BudgetType, user_id: T::BudgetUserId, reward_per_block: Balance<T>) {
        // TODO: prevent recipient overwrite, etc.

        PeriodicRewardRecipient::<T>::insert(budget_type, user_id, RewardRecipient {
            last_withdraw_block: None,
            reward_per_block,
            unpaid_reward: 0.into(),
        });
    }

    fn remove_recipient(budget_type: T::BudgetType, user_id: T::BudgetUserId) {
        // TODO: keep possibility to withdraw unpaid reward

        PeriodicRewardRecipient::<T>::remove(budget_type, user_id);
    }

    fn remove_recipient_clear_reward(budget_type: T::BudgetType, user_id: T::BudgetUserId) {
        PeriodicRewardRecipient::<T>::remove(budget_type, user_id);
    }

}


/////////////////// Mutations //////////////////////////////////////////////////

struct Mutations<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> Mutations<T> {
}

/////////////////// Ensure checks //////////////////////////////////////////////

struct EnsureChecks<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> EnsureChecks<T> {
}
