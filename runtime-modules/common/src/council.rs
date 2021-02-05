/// Provides an interface for the council budget.
pub trait CouncilBudgetManager<Balance> {
    /// Returns the current council balance.
    fn get_budget() -> Balance;

    /// Set the current budget value.
    fn set_budget(budget: Balance);
}
