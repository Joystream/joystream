use rstd::marker::PhantomData;

use system::ensure_signed;

/// Abstract validator for the origin(account_id) and actor_id (eg.: thread author id).
pub trait ActorOriginValidator<Origin, ActorId, AccountId> {
    /// Check for valid combination of origin and actor_id
    fn ensure_actor_origin(
        origin: Origin,
        actor_id: ActorId,
        error: &'static str,
    ) -> Result<AccountId, &'static str>;
}

/// Member of the Joystream organization
pub type MemberId<T> = <T as crate::members::Trait>::MemberId;

/// Default discussion system actor origin validator. Valid for both thread and post authors.
pub struct MembershipOriginValidator<T> {
    marker: PhantomData<T>,
}

impl<T> MembershipOriginValidator<T> {
    /// Create ThreadPostActorOriginValidator instance
    pub fn new() -> Self {
        MembershipOriginValidator {
            marker: PhantomData,
        }
    }
}

impl<T: crate::members::Trait>
    ActorOriginValidator<<T as system::Trait>::Origin, MemberId<T>, <T as system::Trait>::AccountId>
    for MembershipOriginValidator<T>
{
    /// Check for valid combination of origin and actor_id. Actor_id should be valid member_id of
    /// the membership module
    fn ensure_actor_origin(
        origin: <T as system::Trait>::Origin,
        actor_id: MemberId<T>,
        error: &'static str,
    ) -> Result<<T as system::Trait>::AccountId, &'static str> {
        // check valid signed account_id
        let account_id = ensure_signed(origin)?;

        // check whether actor_id belongs to the registered member
        let profile_result = <crate::members::Module<T>>::ensure_profile(actor_id);

        if let Ok(profile) = profile_result {
            // whether the account_id belongs to the actor
            if profile.root_account == account_id || profile.controller_account == account_id {
                return Ok(account_id);
            }
        }

        Err(error)
    }
}
