use frame_support::dispatch::{DispatchError, DispatchResult};

/// Council validator for the origin(account_id) and member_id.
pub trait CouncilOriginValidator<Origin, MemberId, AccountId> {
    /// Check for valid combination of origin and member_id for a councilor.
    fn ensure_member_consulate(origin: Origin, member_id: MemberId) -> DispatchResult;
}

/// Membership validator for the origin(account_id) and member_id (eg.: thread author id).
pub trait MemberOriginValidator<Origin, MemberId, AccountId> {
    /// Check for valid combination of origin and member_id.
    fn ensure_member_controller_account(
        origin: Origin,
        member_id: MemberId,
    ) -> Result<AccountId, DispatchError>;
}
