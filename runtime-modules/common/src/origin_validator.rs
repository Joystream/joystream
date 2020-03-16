/// Abstract validator for the origin(account_id) and actor_id (eg.: thread author id).
pub trait ActorOriginValidator<Origin, ActorId, AccountId> {
    /// Check for valid combination of origin and actor_id
    fn ensure_actor_origin(
        origin: Origin,
        actor_id: ActorId,
        error: &'static str,
    ) -> Result<AccountId, &'static str>;
}
