// TODO: adjust all extrinsic weights
// TODO: module documentation

// used dependencies
use codec::{Codec, Decode, Encode};
use frame_support::traits::{Currency, Get};
use frame_support::{
    decl_error, decl_event, decl_module, decl_storage, error::BadOrigin, Parameter,
};
use sp_arithmetic::traits::BaseArithmetic;
use sp_runtime::traits::{MaybeSerialize, Member};
use std::marker::PhantomData;
use system::ensure_signed;

/////////////////// Data Structures ////////////////////////////////////////////

/// Settings for budget periodic refill.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct BudgetRefill<BlockNumber, Balance> {
    period: BlockNumber,
    amount: Balance,
    next_refill: BlockNumber,
}

/// Generic budget representation.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct Budget<BlockNumber, Balance> {
    balance: Balance,
    refill: Option<BudgetRefill<BlockNumber, Balance>>,
}

/// Recipient of budget reward.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct RewardRecipient<BlockNumber, Balance> {
    last_withdraw_block: BlockNumber,
    reward_per_block: Balance,
    unpaid_reward: Balance,
}

/// Budget controller facilitating access to budget operations.
pub(crate) struct BudgetController<T: Trait> {
    budget_type: T::BudgetType,
}

impl<T: Trait> From<(T::BudgetType,)> for BudgetController<T> {
    fn from(from: (T::BudgetType,)) -> Self {
        BudgetController {
            budget_type: from.0,
        }
    }
}

/////////////////// Type aliases ///////////////////////////////////////////////

pub type Balance<T> =
    <<T as Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;
pub type BudgetOf<T> = Budget<<T as system::Trait>::BlockNumber, Balance<T>>;
pub type RewardRecipientOf<T> = RewardRecipient<<T as system::Trait>::BlockNumber, Balance<T>>;
pub type BudgetRefillOf<T> = BudgetRefill<<T as system::Trait>::BlockNumber, Balance<T>>;

/////////////////// Trait, Storage, Errors, and Events /////////////////////////

/// The main spending budget trait.
pub trait Trait: system::Trait {
    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    /// Representation for the council membership.
    type BudgetUserId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + From<u64>;

    /// Budget's currency.
    type Currency: Currency<Self::AccountId>;

    /// Budgets' identifier.
    type BudgetType: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + From<u64>;

    /// The maximum amount of periodically refilling budgets.
    type MaxRefillingBudgets: Get<u64>;

    /// Facilitate transfer of currency to the reward recipient.
    fn pay_reward(
        budget_type: &Self::BudgetType,
        target_account_id: &Self::AccountId,
        amount: &Balance<Self>,
    ) -> Result<(), ()>;

    /// Verifies that staking account bound to the member.
    fn is_member_account(member_id: &Self::BudgetUserId, account_id: &Self::AccountId) -> bool;

    /// This function is needed because there is no way to enforce `Trait::BlockNumber: From<Balance<T>> + Into<Balance<T>>`
    /// needed by `get_current_reward()`. That's because `where` clause is not expected inside of `decl_error`
    /// (and there might be other problems).
    fn blocks_to_balance(block_number: Self::BlockNumber) -> Balance<Self>;
}

/// The trait of basic budget operations.
pub trait BudgetControllerTrait<Balance> {
    /// Get budget's current balance.
    fn get_balance(&self) -> Balance;

    /// Decrease budget's balance.
    fn spend_from_budget(&self, amount: Balance) -> bool;

    /// Increase budget's balance.
    fn refill_budget(&self, amount: Balance);

    /// Set budget's balance.
    fn set_budget(&self, amount: Balance);
}

/// The trait defining operations for pull-based reward budget.
pub trait PeriodicRewardBudgetControllerTrait<BudgetUserId, Balance, BlockNumber, RewardRecipient>:
    BudgetControllerTrait<Balance>
{
    /// Add the user from the list of periodic reward recipients.
    fn add_recipient(&self, id: BudgetUserId, reward_per_block: Balance);

    /// Retrieve recipient's information.
    fn get_recipient(&self, user_id: BudgetUserId) -> Option<RewardRecipient>;

    /// Remove the user from the list of periodic reward recipients. If user still has any unpaid reward it remains withdrawable.
    /// Use it when a user should no longer receive new rewards but can withdraw rewards accumulated up to now.
    fn remove_recipient(&self, id: BudgetUserId);

    /// Remove the user from the list of periodic reward recipients. Any unpaid reward is annulled, and the user can't withdraw it.
    /// Use it when, for example, you want to prevent a malicious user from any reward accumulated so far.
    fn remove_recipient_clear_reward(&self, id: BudgetUserId);
}

/// The trait for periodicly refilling budgets.
pub trait PeriodicRefillingBudgetControllerTrait<Balance, BlockNumber>:
    BudgetControllerTrait<Balance>
{
    /// Plan periodic budget balance increase.
    fn set_budget_periodic_refill(&self, period: BlockNumber, amount: Balance) -> bool;
}

/// The trait facilitating access to generic budgets.
pub trait BudgetCollection<BudgetType, Balance, BudgetController: BudgetControllerTrait<Balance>> {
    /// Get selected budget controller.
    fn get_budget(budget_type: BudgetType) -> Option<BudgetController>;
}

/// The trait facilitating access to pull-based reward budgets.
pub trait PeriodicRewardBudgetCollection<
    BudgetType,
    BudgetUserId,
    Balance,
    BlockNumber,
    RewardRecipient,
    BudgetController: PeriodicRewardBudgetControllerTrait<BudgetUserId, Balance, BlockNumber, RewardRecipient>,
>: BudgetCollection<BudgetType, Balance, BudgetController>
{
    /// Get selected budget controller.
    fn get_budget(budget_type: BudgetType) -> Option<BudgetController>;
}

decl_storage! {
    trait Store for Module<T: Trait> as SpendingBudget {
        /// Spending budgets.
        pub Budgets get(fn budgets) config(): map hasher(blake2_128_concat) T::BudgetType => BudgetOf<T>;

        /// Recipients of periodic rewards.
        pub PeriodicRewardRecipient get(fn periodic_reward_recipient) config(): double_map hasher(blake2_128_concat) T::BudgetType, hasher(blake2_128_concat) T::BudgetUserId => RewardRecipientOf<T>;

        /// A list of periodicly refilling budgets.
        pub ActiveBudgetRefills get(fn active_budget_refills) config(): Vec<T::BudgetType>;
    }
}

decl_event! {
    pub enum Event<T>
    where
        BudgetUserId = <T as Trait>::BudgetUserId,
        AccountId = <T as system::Trait>::AccountId,
    {
        /// The whole reward was paid to recipient.
        RewardWithdrawal(BudgetUserId, AccountId),

        /// The reward was paid to the recipient only partially.
        RewardPartialWithdrawal(BudgetUserId, AccountId),
    }
}

decl_error! {
    /// Budget errors
    pub enum Error for Module<T: Trait> {
        /// Origin is invalid
        BadOrigin,

        /// Budget is depleted, no reward can be withdrawn.
        BudgetDepleted,

        /// Invalid membership.
        BudgetUserIdNotMatchAccount,

        /// Reward transfer failed.
        RewardPaymentFail,

        /// Invalid reward recipient.
        NotRewardRecipient,

        /// The given recipient has no reward accumulated now.
        NoRewardNow,

        /// The reward payment is requested from an invalid budget requested.
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
            // ensure action can be started
            let (account_id, recipient, reward) = EnsureChecks::<T>::can_withdraw_reward(origin, &budget_type, &user_id)?;

            // calculate withdrawable balance
            let (available_balance, missing_balance) = Calculations::<T>::withdraw_reward(&budget_type, &reward);

            //
            // == MUTATION SAFE ==
            //

            Mutations::<T>::payout(&budget_type, &user_id, &account_id, &recipient, &available_balance, &missing_balance)?;

            // emit event
            if missing_balance > 0.into() {
                // reward has been paid only partially
                Self::deposit_event(RawEvent::RewardPartialWithdrawal(user_id, account_id));
            } else {
                // whole reward has been paid
                Self::deposit_event(RawEvent::RewardWithdrawal(user_id, account_id));
            }

            Ok(())
        }
    }
}

/////////////////// Inner logic ////////////////////////////////////////////////

impl<T: Trait> Module<T> {
    fn try_progress_stage(now: T::BlockNumber) {
        // iterate through refilling budgets
        for budget_type in ActiveBudgetRefills::<T>::get() {
            let budget = Budgets::<T>::get(budget_type);

            // deconstruct refill
            if let Some(refill) = &budget.refill {
                // refill budget if it is due time
                if refill.next_refill == now {
                    Mutations::<T>::refill_budget(&budget_type, &budget, refill);
                }
            }
        }
    }
}

impl<
        T: Trait,
        BudgetController: BudgetControllerTrait<Balance<T>> + From<<T as Trait>::BudgetType>,
    > BudgetCollection<T::BudgetType, Balance<T>, BudgetController> for Module<T>
{
    /// Get selected budget controller.
    fn get_budget(budget_type: T::BudgetType) -> Option<BudgetController> {
        // emsire budget exists
        if !Budgets::<T>::contains_key(budget_type) {
            return None;
        }

        let budget_controller = budget_type.into();

        Some(budget_controller)
    }
}

impl<
        T: Trait,
        BudgetController: PeriodicRewardBudgetControllerTrait<
                T::BudgetUserId,
                Balance<T>,
                T::BlockNumber,
                RewardRecipientOf<T>,
            > + From<<T as Trait>::BudgetType>,
    >
    PeriodicRewardBudgetCollection<
        T::BudgetType,
        T::BudgetUserId,
        Balance<T>,
        T::BlockNumber,
        RewardRecipientOf<T>,
        BudgetController,
    > for Module<T>
{
    /// Get selected budget controller.
    fn get_budget(budget_type: T::BudgetType) -> Option<BudgetController> {
        // emsire budget exists
        if !Budgets::<T>::contains_key(budget_type) {
            return None;
        }

        let budget_controller = budget_type.into();

        Some(budget_controller)
    }
}

impl<T: Trait> BudgetControllerTrait<Balance<T>> for BudgetController<T> {
    /// Get budget's current balance.
    fn get_balance(&self) -> Balance<T> {
        // check budget exists
        if !Budgets::<T>::contains_key(self.budget_type) {
            return 0.into();
        }

        Budgets::<T>::get(self.budget_type).balance
    }

    /// Decrease budget's balance.
    fn spend_from_budget(&self, amount: Balance<T>) -> bool {
        // ensure something is really about to be spent
        if amount == 0.into() {
            return false;
        }

        // ensure budget exists
        if !Budgets::<T>::contains_key(self.budget_type) {
            return false;
        }

        let budget = Budgets::<T>::get(self.budget_type);

        // ensure budget has sufficient balance
        if budget.balance < amount {
            return false;
        }

        // calculate new balance
        let new_balance = budget.balance - amount;

        // update budget
        let budget = Budgets::<T>::get(self.budget_type);
        Budgets::<T>::insert(
            self.budget_type,
            Budget {
                balance: new_balance,
                ..budget
            },
        );

        true
    }

    /// Increase budget's balance.
    fn refill_budget(&self, amount: Balance<T>) {
        // check budget exists
        if !Budgets::<T>::contains_key(self.budget_type) {
            // create budget
            Budgets::<T>::insert(
                self.budget_type,
                Budget {
                    balance: amount,
                    refill: None,
                },
            );

            return;
        }

        // calculate new balance
        let budget = Budgets::<T>::get(self.budget_type);
        let new_balance = budget.balance + amount;

        // update budget
        Budgets::<T>::insert(
            self.budget_type,
            Budget {
                balance: new_balance,
                ..budget
            },
        );
    }

    /// Set budget's balance.
    fn set_budget(&self, amount: Balance<T>) {
        // check budget exists
        if !Budgets::<T>::contains_key(self.budget_type) {
            // create budget
            Budgets::<T>::insert(
                self.budget_type,
                Budget {
                    balance: amount,
                    refill: None,
                },
            );

            return;
        }

        // calculate new balance
        let budget = Budgets::<T>::get(self.budget_type);
        let new_balance = budget.balance + amount;

        // update budget
        Budgets::<T>::insert(
            self.budget_type,
            Budget {
                balance: new_balance,
                ..budget
            },
        );
    }
}

impl<T: Trait>
    PeriodicRewardBudgetControllerTrait<
        T::BudgetUserId,
        Balance<T>,
        T::BlockNumber,
        RewardRecipientOf<T>,
    > for BudgetController<T>
{
    /// Add the user from the list of periodic reward recipients.
    fn add_recipient(&self, user_id: T::BudgetUserId, reward_per_block: Balance<T>) {
        // check if recipient's record exists
        if !PeriodicRewardRecipient::<T>::contains_key(self.budget_type, user_id) {
            // create recipient
            PeriodicRewardRecipient::<T>::insert(
                self.budget_type,
                user_id,
                RewardRecipient {
                    last_withdraw_block: <system::Module<T>>::block_number(),
                    reward_per_block,
                    unpaid_reward: 0.into(),
                },
            );

            return;
        }

        // calculate currently unpaid reward
        let recipient = PeriodicRewardRecipient::<T>::get(self.budget_type, user_id);
        let new_unpaid_reward = Calculations::<T>::get_current_reward(&recipient);

        // update recipient record
        PeriodicRewardRecipient::<T>::insert(
            self.budget_type,
            user_id,
            RewardRecipient {
                last_withdraw_block: <system::Module<T>>::block_number(),
                reward_per_block,
                unpaid_reward: new_unpaid_reward,
            },
        );
    }

    /// Retrieve recipient's information.
    fn get_recipient(&self, user_id: T::BudgetUserId) -> Option<RewardRecipientOf<T>> {
        // check if recipient's record exists
        if !PeriodicRewardRecipient::<T>::contains_key(self.budget_type, user_id) {
            return None;
        }

        let recipient = PeriodicRewardRecipient::<T>::get(self.budget_type, user_id);

        Some(recipient)
    }

    /// Remove the user from the list of periodic reward recipients. If user still has any unpaid reward it remains withdrawable.
    fn remove_recipient(&self, user_id: T::BudgetUserId) {
        // check if recipient's record exists
        if !PeriodicRewardRecipient::<T>::contains_key(self.budget_type, user_id) {
            return;
        }

        // calculate unpaid reward
        let recipient = PeriodicRewardRecipient::<T>::get(self.budget_type, user_id);
        let new_unpaid_reward = Calculations::<T>::get_current_reward(&recipient);

        // update recipient
        PeriodicRewardRecipient::<T>::insert(
            self.budget_type,
            user_id,
            RewardRecipientOf::<T> {
                last_withdraw_block: <system::Module<T>>::block_number(),
                reward_per_block: 0.into(),
                unpaid_reward: new_unpaid_reward,
            },
        );
    }

    /// Remove the user from the list of periodic reward recipients. Any unpaid reward is annulled, and the user can't withdraw it.
    fn remove_recipient_clear_reward(&self, user_id: T::BudgetUserId) {
        PeriodicRewardRecipient::<T>::remove(self.budget_type, user_id);
    }
}

impl<T: Trait> PeriodicRefillingBudgetControllerTrait<Balance<T>, T::BlockNumber>
    for BudgetController<T>
{
    /// Plan periodic budget balance increase.
    fn set_budget_periodic_refill(&self, period: T::BlockNumber, amount: Balance<T>) -> bool {
        // don't allow periodic refill set for not-well-setup budget
        if !Budgets::<T>::contains_key(self.budget_type) {
            return false;
        }

        let budget = Budgets::<T>::get(self.budget_type);

        // ensure refilling budgets count haven't reached maximum yet
        if budget.refill.is_none()
            && ActiveBudgetRefills::<T>::get().len() as u64 == T::MaxRefillingBudgets::get()
        {
            return false;
        }

        // remove budget from refilling budget list if amount set to 0
        if budget.refill.is_some() && amount == 0.into() {
            // remove budget refill
            Budgets::<T>::insert(
                self.budget_type,
                Budget {
                    refill: None,
                    ..budget
                },
            );

            // remove budget from list of refilling budgets
            ActiveBudgetRefills::<T>::mutate(|value| {
                value.retain(|tmp_budget_type| tmp_budget_type != &self.budget_type)
            });

            return true;
        }

        // add budget to refilling budget list if not present yet
        if budget.refill.is_none() {
            ActiveBudgetRefills::<T>::mutate(|value| value.push(self.budget_type));
        }

        // update budget's refill info
        Budgets::<T>::insert(
            self.budget_type,
            Budget {
                refill: Some(BudgetRefill {
                    period,
                    amount,
                    next_refill: <system::Module<T>>::block_number() + period,
                }),
                ..budget
            },
        );

        true
    }
}

/////////////////// Calculations ///////////////////////////////////////////////

struct Calculations<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> Calculations<T> {
    /// Calculate current reward for the recipient.
    fn get_current_reward(recipient: &RewardRecipientOf<T>) -> Balance<T> {
        recipient.unpaid_reward
            + T::blocks_to_balance(
                <system::Module<T>>::block_number() - recipient.last_withdraw_block,
            ) * recipient.reward_per_block
    }

    /// Retrieve current budget's balance and calculate missing balance for reward payment.
    fn withdraw_reward(
        budget_type: &T::BudgetType,
        reward_amount: &Balance<T>,
    ) -> (Balance<T>, Balance<T>) {
        let budget = Budgets::<T>::get(budget_type);

        // check if reward has enough balance
        if reward_amount <= &budget.balance {
            return (*reward_amount, 0.into());
        }

        // calculate missing balance
        let missing_balance = *reward_amount - budget.balance;

        (budget.balance, missing_balance)
    }
}

/////////////////// Mutations //////////////////////////////////////////////////

struct Mutations<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> Mutations<T> {
    /// Payout currently accumulated reward to the user.
    fn payout(
        budget_type: &T::BudgetType,
        user_id: &T::BudgetUserId,
        account_id: &T::AccountId,
        recipient: &RewardRecipientOf<T>,
        amount: &Balance<T>,
        unpaid_remaining: &Balance<T>,
    ) -> Result<(), Error<T>> {
        let budget = Budgets::<T>::get(budget_type);

        // send reward to user
        T::pay_reward(&budget_type, account_id, amount)
            .map_err(|_| Error::<T>::RewardPaymentFail)?;

        // update budget balance
        Budgets::<T>::insert(
            budget_type,
            Budget {
                balance: budget.balance - *amount,
                ..budget
            },
        );

        // update recipient record
        PeriodicRewardRecipient::<T>::insert(
            budget_type,
            user_id,
            RewardRecipient {
                last_withdraw_block: <system::Module<T>>::block_number(),
                reward_per_block: recipient.reward_per_block,
                unpaid_reward: *unpaid_remaining,
            },
        );

        Ok(())
    }

    fn refill_budget(
        budget_type: &T::BudgetType,
        budget: &BudgetOf<T>,
        refill: &BudgetRefillOf<T>,
    ) {
        // calculate new balance
        let new_balance = budget.balance + refill.amount;

        // update budget balance and set next refill block number
        Budgets::<T>::insert(
            budget_type,
            Budget {
                balance: new_balance,
                refill: Some(BudgetRefill {
                    next_refill: <system::Module<T>>::block_number() + refill.period,
                    ..*refill
                }),
                ..*budget
            },
        );
    }
}

/////////////////// Ensure checks //////////////////////////////////////////////

struct EnsureChecks<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> EnsureChecks<T> {
    /////////////////// Common checks //////////////////////////////////////////

    /// Ensures membership id is associated with account derived from the origin.
    fn ensure_user_membership(
        origin: T::Origin,
        budget_user_id: &T::BudgetUserId,
    ) -> Result<T::AccountId, Error<T>> {
        let account_id = ensure_signed(origin)?;

        // check membership is associated with account
        if !T::is_member_account(&budget_user_id, &account_id) {
            return Err(Error::BudgetUserIdNotMatchAccount);
        }

        Ok(account_id)
    }

    /////////////////// Action checks //////////////////////////////////////////

    /// Checks that user can withdraw reward from the selectd budget.
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

        // ensure budget can spent at least something
        if Budgets::<T>::get(budget_type).balance == 0.into() {
            return Err(Error::BudgetDepleted);
        }

        Ok((account_id, recipient, reward))
    }
}
