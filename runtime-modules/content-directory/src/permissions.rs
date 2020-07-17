mod class;
mod curator_group;
mod entity;
mod entity_creation_voucher;

pub use class::*;
pub use curator_group::*;
pub use entity::*;
pub use entity_creation_voucher::*;

pub use crate::errors::*;
use crate::*;
pub use codec::{Codec, Decode, Encode};
use core::fmt::Debug;
use runtime_primitives::traits::{MaybeSerializeDeserialize, Member, SimpleArithmetic};

#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};
use srml_support::{dispatch, ensure, Parameter};

/// Model of authentication manager.
pub trait ActorAuthenticator: system::Trait + Debug {
    /// Curator identifier
    type CuratorId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + Clone
        + MaybeSerializeDeserialize
        + Eq
        + PartialEq
        + Ord;

    /// Member identifier
    type MemberId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + Clone
        + MaybeSerializeDeserialize
        + Eq
        + PartialEq
        + Ord;

    /// Curator group identifier
    type CuratorGroupId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + One
        + Default
        + Copy
        + Clone
        + MaybeSerializeDeserialize
        + Eq
        + PartialEq
        + Ord;

    /// Authorize actor as lead
    fn is_lead(account_id: &Self::AccountId) -> bool;

    /// Authorize actor as curator
    fn is_curator(curator_id: &Self::CuratorId, account_id: &Self::AccountId) -> bool;

    /// Authorize actor as member
    fn is_member(member_id: &Self::MemberId, account_id: &Self::AccountId) -> bool;
}

/// Ensure curator authorization performed succesfully
pub fn ensure_curator_auth_success<T: ActorAuthenticator>(
    curator_id: &T::CuratorId,
    account_id: &T::AccountId,
) -> dispatch::Result {
    ensure!(
        T::is_curator(curator_id, account_id),
        ERROR_CURATOR_AUTH_FAILED
    );
    Ok(())
}

/// Ensure member authorization performed succesfully
pub fn ensure_member_auth_success<T: ActorAuthenticator>(
    member_id: &T::MemberId,
    account_id: &T::AccountId,
) -> dispatch::Result {
    ensure!(
        T::is_member(member_id, account_id),
        ERROR_MEMBER_AUTH_FAILED
    );
    Ok(())
}

/// Ensure lead authorization performed succesfully
pub fn ensure_lead_auth_success<T: ActorAuthenticator>(
    account_id: &T::AccountId,
) -> dispatch::Result {
    ensure!(T::is_lead(account_id), ERROR_LEAD_AUTH_FAILED);
    Ok(())
}

/// Ensure given `Origin` is lead
pub fn ensure_is_lead<T: ActorAuthenticator>(origin: T::Origin) -> dispatch::Result {
    let account_id = ensure_signed(origin)?;
    ensure_lead_auth_success::<T>(&account_id)
}

/// Enum, representing all possible `Actor`s
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Eq, PartialEq, Clone, Copy, Debug)]
pub enum Actor<T: Trait> {
    Curator(T::CuratorGroupId, T::CuratorId),
    Member(T::MemberId),
    Lead,
}

impl<T: Trait> Default for Actor<T> {
    fn default() -> Self {
        Self::Lead
    }
}
