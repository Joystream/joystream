use frame_support::dispatch::DispatchResult;

/// Provides an interface for the council budget.
pub use crate::BudgetManager as CouncilBudgetManager;

/// Council validator for the origin(account_id) and member_id.
pub trait CouncilOriginValidator<Origin, MemberId, AccountId> {
    /// Check for valid combination of origin and member_id for a councilor.
    fn ensure_member_consulate(origin: Origin, member_id: MemberId) -> DispatchResult;
}
