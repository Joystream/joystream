use frame_support::dispatch::DispatchResult;

/// Provides an interface for the council budget.
pub trait CouncilBudgetManager<Balance> {
    /// Returns the current council balance.
    fn get_budget() -> Balance;

    /// Set the current budget value.
    fn set_budget(budget: Balance);
}

/// Council validator for the origin(account_id) and member_id.
pub trait CouncilOriginValidator<Origin, MemberId, AccountId> {
    /// Check for valid combination of origin and member_id for a councilor.
    fn ensure_member_consulate(origin: Origin, member_id: MemberId) -> DispatchResult;
}
