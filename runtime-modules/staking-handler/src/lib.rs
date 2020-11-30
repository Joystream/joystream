use frame_support::dispatch::DispatchResult;

// Type alias for member id.
pub type MemberId<T> = <T as membership::Trait>::MemberId;

/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as balances::Trait>::Balance;

/// Defines abstract staking handler to manage user stakes for different activities
/// like adding a proposal. Implementation should use built-in LockableCurrency
/// and LockIdentifier to lock balance consistently with pallet_staking.
pub trait StakingHandler<T: frame_system::Trait + membership::Trait + balances::Trait> {
    /// Locks the specified balance on the account using specific lock identifier.
    fn lock(account_id: &T::AccountId, amount: BalanceOf<T>);

    /// Removes the specified lock on the account.
    fn unlock(account_id: &T::AccountId);

    /// Slash the specified balance on the account using specific lock identifier.
    /// No limits, no actions on zero stake.
    /// If slashing balance greater than the existing stake - stake is slashed to zero.
    /// Returns actually slashed balance.
    fn slash(account_id: &T::AccountId, amount: Option<BalanceOf<T>>) -> BalanceOf<T>;

    /// Sets the new stake to a given amount.
    fn set_stake(account_id: &T::AccountId, new_stake: BalanceOf<T>) -> DispatchResult;

    /// Verifies that staking account bound to the member.
    fn is_member_staking_account(member_id: &MemberId<T>, account_id: &T::AccountId) -> bool;

    /// Verifies that there no conflicting stakes on the staking account.
    fn is_account_free_of_conflicting_stakes(account_id: &T::AccountId) -> bool;

    /// Verifies that staking account balance is sufficient for staking.
    /// During the balance check we should consider already locked stake. Effective balance to check
    /// is 'already locked funds' + 'usable funds'.
    fn is_enough_balance_for_stake(account_id: &T::AccountId, amount: BalanceOf<T>) -> bool;

    /// Returns the current stake on the account.
    fn current_stake(account_id: &T::AccountId) -> BalanceOf<T>;
}
