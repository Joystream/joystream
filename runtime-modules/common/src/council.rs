use frame_support::dispatch::DispatchResult;

/// Provides an interface for the council budget.
pub trait CouncilBudgetManager<AccountId, Balance> {
    /// Returns the current council balance.
    fn get_budget() -> Balance;

    /// Set the current budget value.
    fn set_budget(budget: Balance);

    /// Remove some balance from the council budget and transfer it to the account. Fallible.
    fn try_transfer(account_id: &AccountId, amount: Balance) -> DispatchResult;

    /// Remove some balance from the council budget and transfer it to the account. Infallible.
    fn transfer(account_id: &AccountId, amount: Balance);

    /// Increase the current budget value up to specified amount.
    fn increase_budget(amount: Balance);
}

/// Council validator for the origin(account_id) and member_id.
pub trait CouncilOriginValidator<Origin, MemberId, AccountId> {
    /// Check for valid combination of origin and member_id for a councilor.
    fn ensure_member_consulate(origin: Origin, member_id: MemberId) -> DispatchResult;
}
