use frame_support::dispatch::{DispatchError, DispatchResult};

/// Council validator for the origin(account_id) and member_id.
pub trait CouncilOriginValidator<Origin, MemberId, AccountId> {
    /// Check for valid combination of origin and actor_id.
    fn ensure_member_consulate(origin: Origin, member_id: MemberId) -> DispatchResult;
}

/// Abstract validator for the origin(account_id) and actor_id (eg.: thread author id).
pub trait ActorOriginValidator<Origin, ActorId, AccountId> {
    /// Check for valid combination of origin and actor_id.
    fn ensure_actor_origin(origin: Origin, actor_id: ActorId) -> Result<AccountId, DispatchError>;
}
