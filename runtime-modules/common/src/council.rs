use frame_support::dispatch::DispatchResult;
use sp_arithmetic::traits::Saturating;

/// Provides an interface for the council budget.
pub trait CouncilBudgetManager<AccountId, Balance: Saturating> {
    /// Returns the current council balance.
    fn get_budget() -> Balance;

    /// Set the current budget value.
    fn set_budget(budget: Balance);

    /// Remove some balance from the council budget and transfer it to the account. Fallible.
    fn try_withdraw(account_id: &AccountId, amount: Balance) -> DispatchResult;

    /// Remove some balance from the council budget and transfer it to the account. Infallible.
    /// No side-effects on insufficient council balance.
    fn withdraw(account_id: &AccountId, amount: Balance) {
        let _ = Self::try_withdraw(account_id, amount);
    }

    /// Increase the current budget value up to specified amount.
    fn increase_budget(amount: Balance) {
        let current_budget = Self::get_budget();
        let new_budget = current_budget.saturating_add(amount);

        Self::set_budget(new_budget);
    }
}

/// Council validator for the origin(account_id) and member_id.
pub trait CouncilOriginValidator<Origin, MemberId, AccountId> {
    /// Check for valid combination of origin and member_id for a councilor.
    fn ensure_member_consulate(origin: Origin, member_id: MemberId) -> DispatchResult;
}
