// TODO: adjust all extrinsic weights
// TODO: module documentation

// used dependencies
use codec::{Codec, Decode, Encode};
use frame_support::traits::{
    Currency,
};
use frame_support::{
    decl_error, decl_event, decl_module, decl_storage, error::BadOrigin, Parameter,
};
use sp_arithmetic::traits::BaseArithmetic;
use sp_runtime::traits::{MaybeSerialize, Member};
use std::marker::PhantomData;
use system::ensure_signed;


/////////////////// Data Structures ////////////////////////////////////////////

#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct RewardRecipient<BlockNumber, Balance> {
    last_withdraw_block: BlockNumber,
    reward_per_block: Balance,
    unpaid_reward: Balance,
}

/////////////////// Type aliases ///////////////////////////////////////////////

pub type Balance<T> =
    <<T as Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;
pub type RewardRecipientOf<T> = RewardRecipient<<T as system::Trait>::BlockNumber, Balance<T>>;

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

    fn pay_reward(budget_type: &Self::BudgetType, target_account_id: &Self::AccountId, amount: &Balance<Self>) -> Result<(), ()>;

    fn is_member_account(member_id: &Self::BudgetUserId, account_id: &Self::AccountId) -> bool;

    /// This function is needed because there is no way to enforce `Trait::BlockNumber: From<Balance<T>> + Into<Balance<T>>`
    /// needed by `get_current_reward()`. That's because `where` clause is not expected inside of `decl_error`
    /// (and there might be other problems).
    fn blocks_to_balance(block_number: Self::BlockNumber) -> Balance<Self>;
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
    fn get_recipient(budget_type: T::BudgetType, user_id: T::BudgetUserId) -> Option<RewardRecipientOf<T>>;
    fn remove_recipient(budget_type: T::BudgetType, id: T::BudgetUserId);
    fn remove_recipient_clear_reward(budget_type: T::BudgetType, id: T::BudgetUserId);
}


decl_storage! {
    trait Store for Module<T: Trait> as SpendingBudget {
        pub Budgets get(fn budgets) config(): map hasher(blake2_128_concat) T::BudgetType => Balance::<T>;

        pub PeriodicRewardRecipient get(fn periodic_reward_recipient) config(): double_map hasher(blake2_128_concat) T::BudgetType, hasher(blake2_128_concat) T::BudgetUserId => RewardRecipientOf<T>;
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
        /// Origin is invalid
        BadOrigin,

        ///
        BudgetDepleted,

        BudgetUserIdNotMatchAccount,

        RewardPaymentFail,

        NotRewardRecipient,

        NoRewardNow,

        InvalidBudget,
    }
}

impl<T: Trait> From<BadOrigin> for Error<T> {
    fn from(_error: BadOrigin) -> Self {
        Error::<T>::BadOrigin
    }
}

/////////////////// Module definition and implementation ///////////////////////

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
    //pub struct Module<T: Trait> for enum Call where origin: T::Origin, T::BlockNumber: Into<Balance<T>>, Balance<T>: Into<T::BlockNumber> {

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
        pub fn withdraw_reward(origin, budget_type: T::BudgetType, user_id: T::BudgetUserId) -> Result<(), Error<T>> {
            let (account_id, recipient, reward) = EnsureChecks::<T>::can_withdraw_reward(origin, &budget_type, &user_id)?;

            let (available_balance, missing_balance) = Calculations::<T>::withdraw_reward(&budget_type, &reward);

            Mutations::<T>::payout(&budget_type, &user_id, &account_id, &recipient, &available_balance, &missing_balance)?;

            Ok(())
        }
    }
}

/////////////////// Inner logic ////////////////////////////////////////////////

impl<T: Trait> Module<T> {
    fn try_progress_stage(_now: T::BlockNumber) {
        // TODO: remove this function if no `on_finalize` agenda is needed
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
        Budgets::<T>::insert(budget_type, Self::get_budget_balance(budget_type) + amount);
    }

    fn set_budget(budget_type: T::BudgetType, amount: Balance<T>) {
        Budgets::<T>::insert(budget_type, amount);
    }
}

impl<T: Trait> PeriodicRewardBudget<T> for Module<T> {
    fn add_recipient(budget_type: T::BudgetType, user_id: T::BudgetUserId, reward_per_block: Balance<T>) {
        if !PeriodicRewardRecipient::<T>::contains_key(budget_type, user_id) {
            PeriodicRewardRecipient::<T>::insert(budget_type, user_id, RewardRecipient {
                last_withdraw_block: <system::Module<T>>::block_number(),
                reward_per_block,
                unpaid_reward: 0.into(),
            });

            return;
        }

        let recipient = PeriodicRewardRecipient::<T>::get(budget_type, user_id);
        let new_unpaid_reward = Calculations::<T>::get_current_reward(&recipient);

        PeriodicRewardRecipient::<T>::insert(budget_type, user_id, RewardRecipient {
            last_withdraw_block: <system::Module<T>>::block_number(),
            reward_per_block,
            unpaid_reward: new_unpaid_reward,
        });
    }

    fn get_recipient(budget_type: T::BudgetType, user_id: T::BudgetUserId) -> Option<RewardRecipientOf<T>> {
        if !PeriodicRewardRecipient::<T>::contains_key(budget_type, user_id) {
            return None;
        }

        let recipient = PeriodicRewardRecipient::<T>::get(budget_type, user_id);

        Some(recipient)
    }

    fn remove_recipient(budget_type: T::BudgetType, user_id: T::BudgetUserId) {
        if !PeriodicRewardRecipient::<T>::contains_key(budget_type, user_id) {
            return;
        }

        let recipient = PeriodicRewardRecipient::<T>::get(budget_type, user_id);
        let new_unpaid_reward = Calculations::<T>::get_current_reward(&recipient);

        PeriodicRewardRecipient::<T>::insert(budget_type, user_id, RewardRecipientOf::<T> {
            last_withdraw_block: <system::Module<T>>::block_number(),
            reward_per_block: 0.into(),
            unpaid_reward: new_unpaid_reward,
        });
    }

    fn remove_recipient_clear_reward(budget_type: T::BudgetType, user_id: T::BudgetUserId) {
        PeriodicRewardRecipient::<T>::remove(budget_type, user_id);
    }
}

/////////////////// Calculations ///////////////////////////////////////////////

struct Calculations<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> Calculations<T> {
    fn get_current_reward(recipient: &RewardRecipientOf<T>) -> Balance<T> {
        recipient.unpaid_reward + T::blocks_to_balance(<system::Module<T>>::block_number() - recipient.last_withdraw_block) * recipient.reward_per_block
    }

    fn withdraw_reward(budget_type: &T::BudgetType, reward_amount: &Balance<T>) -> (Balance<T>, Balance<T>) {
        //
        let budget_balance = Budgets::<T>::get(budget_type);

        if reward_amount <= &budget_balance {
            return (*reward_amount, 0.into());
        }

        let available_balance = Budgets::<T>::get(budget_type);
        let missing_balance = *reward_amount - available_balance;

        (available_balance, missing_balance)
    }
}

/////////////////// Mutations //////////////////////////////////////////////////

struct Mutations<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> Mutations<T> {
    fn payout(budget_type: &T::BudgetType, user_id: &T::BudgetUserId, account_id: &T::AccountId, recipient: &RewardRecipientOf<T>, amount: &Balance<T>, unpaid_remaining: &Balance<T>) -> Result<(), Error<T>> {
        let budget_balance = Budgets::<T>::get(budget_type);

        // send reward to user
        T::pay_reward(&budget_type, account_id, amount).map_err(|_| Error::<T>::RewardPaymentFail)?;

        // update budget balance
        Budgets::<T>::insert(budget_type, budget_balance - *amount);

        PeriodicRewardRecipient::<T>::insert(budget_type, user_id, RewardRecipient {
            last_withdraw_block: <system::Module<T>>::block_number(),
            reward_per_block: recipient.reward_per_block,
            unpaid_reward: *unpaid_remaining,
        });

        Ok(())
    }
}

/////////////////// Ensure checks //////////////////////////////////////////////

struct EnsureChecks<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> EnsureChecks<T> {
    /////////////////// Common checks //////////////////////////////////////////

    fn ensure_user_membership(
        origin: T::Origin,
        budget_user_id: &T::BudgetUserId,
    ) -> Result<T::AccountId, Error<T>> {
        let account_id = ensure_signed(origin)?;

        if !T::is_member_account(&budget_user_id, &account_id) {
            return Err(Error::BudgetUserIdNotMatchAccount);
        }

        Ok(account_id)
    }

    /////////////////// Action checks //////////////////////////////////////////

    fn can_withdraw_reward(
        origin: T::Origin,
        budget_type: &T::BudgetType,
        user_id: &T::BudgetUserId,
    ) -> Result<(T::AccountId, RewardRecipientOf<T>, Balance<T>), Error<T>> {
        // ensure user's membership
        let account_id = Self::ensure_user_membership(origin, &user_id)?;

        // ensure user is reward recipient
        if !PeriodicRewardRecipient::<T>::contains_key(budget_type, user_id) {
            return Err(Error::NotRewardRecipient);
        }

        let recipient = PeriodicRewardRecipient::<T>::get(budget_type, user_id);
        let reward = Calculations::<T>::get_current_reward(&recipient);

        // ensure user is eligible to receive some reward
        if reward == 0.into() {
            return Err(Error::NoRewardNow);
        }

        // ensure budget can spend at least something
        if !Budgets::<T>::contains_key(budget_type) {
            return Err(Error::InvalidBudget);
        }

        if Budgets::<T>::get(budget_type) == 0.into() {
            return Err(Error::BudgetDepleted);
        }

        Ok((account_id, recipient, reward))
    }
}
