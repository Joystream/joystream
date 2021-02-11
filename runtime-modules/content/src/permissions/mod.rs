mod curator_group;

pub use curator_group::*;

pub use crate::errors::*;
use crate::*;
pub use codec::{Codec, Decode, Encode};
pub use common::MembershipTypes;
use core::fmt::Debug;
use frame_support::{ensure, Parameter};
#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};
use sp_arithmetic::traits::BaseArithmetic;
use sp_runtime::traits::{MaybeSerializeDeserialize, Member};

/// Model of authentication manager.
pub trait ContentActorAuthenticator: system::Trait + MembershipTypes {
    /// Curator identifier
    type CuratorId: Parameter
        + Member
        + BaseArithmetic
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
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + Clone
        + MaybeSerializeDeserialize
        + Eq
        + PartialEq
        + Ord;

    /// Authorize actor as lead
    fn is_lead(account_id: &Self::AccountId) -> bool;

    /// Checks if Id represents a worker id in the working group
    fn is_valid_curator_id(curator_id: &Self::CuratorId) -> bool;

    /// Authorize actor as curator
    fn is_curator(curator_id: &Self::CuratorId, account_id: &Self::AccountId) -> bool;

    /// Authorize actor as member
    fn is_member(member_id: &Self::MemberId, account_id: &Self::AccountId) -> bool;
}

pub fn ensure_is_valid_curator_id<T: Trait>(curator_id: &T::CuratorId) -> Result<(), Error<T>> {
    ensure!(
        T::is_valid_curator_id(curator_id),
        Error::<T>::CuratorIdInvalid
    );
    Ok(())
}

/// Ensure curator authorization performed succesfully
pub fn ensure_curator_auth_success<T: Trait>(
    curator_id: &T::CuratorId,
    account_id: &T::AccountId,
) -> Result<(), Error<T>> {
    ensure!(
        T::is_curator(curator_id, account_id),
        Error::<T>::CuratorAuthFailed
    );
    Ok(())
}

/// Ensure member authorization performed succesfully
pub fn ensure_member_auth_success<T: Trait>(
    member_id: &T::MemberId,
    account_id: &T::AccountId,
) -> Result<(), Error<T>> {
    ensure!(
        T::is_member(member_id, account_id),
        Error::<T>::MemberAuthFailed
    );
    Ok(())
}

/// Ensure lead authorization performed succesfully
pub fn ensure_lead_auth_success<T: Trait>(account_id: &T::AccountId) -> Result<(), Error<T>> {
    ensure!(T::is_lead(account_id), Error::<T>::LeadAuthFailed);
    Ok(())
}

/// Ensure given `Origin` is lead
pub fn ensure_is_lead<T: Trait>(origin: T::Origin) -> DispatchResult {
    let account_id = ensure_signed(origin)?;
    Ok(ensure_lead_auth_success::<T>(&account_id)?)
}

pub fn ensure_actor_authorized_to_create_channel<T: Trait>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
) -> DispatchResult {
    match actor {
        // Lead should use their member or curator role to create or update channels.
        ContentActor::Lead => {
            ensure!(
                false,
                Error::<T>::ActorCannotOwnChannel
            );
            Ok(())
        }
        ContentActor::Curator(curator_group_id, curator_id) => {
            let sender = ensure_signed(origin)?;

            // Authorize curator, performing all checks to ensure curator can act
            CuratorGroup::<T>::perform_curator_in_group_auth(
                curator_id,
                curator_group_id,
                &sender,
            )?;

            Ok(())
        }
        ContentActor::Member(member_id) => {
            let sender = ensure_signed(origin)?;

            ensure_member_auth_success::<T>(member_id, &sender)?;

            Ok(())
        }
        // TODO:
        // ContentActor::Dao(_daoId) => ...,
    }
}

pub fn ensure_actor_authorized_to_update_or_delete_channel<T: Trait>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    owner: &ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
) -> DispatchResult {
    // Only owner of a channel can update and delete it.
    // Should we allow lead to also update and delete curator group owned channels,
    // to avoid need for them to add themselves into the group?
    match actor {
        ContentActor::Lead => {
            ensure!(
                false,
                Error::<T>::ActorNotAuthorized
            );
            Ok(())
        }
        ContentActor::Curator(curator_group_id, curator_id) => {
            let sender = ensure_signed(origin)?;

            // Authorize curator, performing all checks to ensure curator can act
            CuratorGroup::<T>::perform_curator_in_group_auth(
                curator_id,
                curator_group_id,
                &sender,
            )?;

            // Ensure curator group is the channel owner.
            ensure!(
                *owner == ChannelOwner::CuratorGroup(*curator_group_id),
                Error::<T>::ActorNotAuthorized
            );

            Ok(())
        }
        ContentActor::Member(member_id) => {
            let sender = ensure_signed(origin)?;

            ensure_member_auth_success::<T>(member_id, &sender)?;

            // Ensure the member is the channel owner.
            ensure!(
                *owner == ChannelOwner::Member(*member_id),
                Error::<T>::ActorNotAuthorized
            );

            Ok(())
        }
        // TODO:
        // ContentActor::Dao(_daoId) => ...,
    }
}

pub fn ensure_actor_authorized_to_censor<T: Trait>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    owner: &ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
) -> DispatchResult {
    // Only owner of a channel can update and delete it.
    // Should we allow lead to also update and delete curator group owned channels,
    // to avoid need for them to add themselves into the group?
    match actor {
        ContentActor::Lead => {
            let sender = ensure_signed(origin)?;
            ensure_lead_auth_success::<T>(&sender)?;
            Ok(())
        },
        ContentActor::Curator(curator_group_id, curator_id) => {
            let sender = ensure_signed(origin)?;

            // Authorize curator, performing all checks to ensure curator can act
            CuratorGroup::<T>::perform_curator_in_group_auth(
                curator_id,
                curator_group_id,
                &sender,
            )?;

            // Curators cannot censor curator group channels
            match owner {
                ChannelOwner::CuratorGroup(_curator_group_id) => {
                    Err(Error::<T>::CannotCensoreCuratorGroupOwnedChannels)
                }
                _ => Ok(())
            }?;

            Ok(())
        },
        ContentActor::Member(_member_id) => {
            // Members cannot censore channels!
            ensure!(
                false,
                Error::<T>::ActorNotAuthorized
            );
            Ok(())
        }
        // TODO:
        // ContentActor::Dao(_daoId) => ...,
    }
}

pub fn ensure_actor_authorized_to_manage_categories<T: Trait>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
) -> DispatchResult {
    // Only owner of a channel can update and delete it.
    // Should we allow lead to also update and delete curator group owned channels,
    // to avoid need for them to add themselves into the group?
    match actor {
        ContentActor::Lead => {
            let sender = ensure_signed(origin)?;
            ensure_lead_auth_success::<T>(&sender)?;
            Ok(())
        },
        ContentActor::Curator(curator_group_id, curator_id) => {
            let sender = ensure_signed(origin)?;

            // Authorize curator, performing all checks to ensure curator can act
            CuratorGroup::<T>::perform_curator_in_group_auth(
                curator_id,
                curator_group_id,
                &sender,
            )?;

            Ok(())
        },
        ContentActor::Member(_member_id) => {
            // Members cannot censore channels!
            ensure!(
                false,
                Error::<T>::ActorNotAuthorized
            );
            Ok(())
        }
        // TODO:
        // ContentActor::Dao(_daoId) => ...,
    }
}

/// Enum, representing all possible `Actor`s
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Eq, PartialEq, Clone, Copy, Debug)]
pub enum ContentActor<
    CuratorGroupId: Default + Clone + Copy,
    CuratorId: Default + Clone + Copy,
    MemberId: Default + Clone + Copy,
> {
    Curator(CuratorGroupId, CuratorId),
    Member(MemberId),
    Lead,
    // Dao,
}

impl<
        CuratorGroupId: Default + Clone + Copy,
        CuratorId: Default + Clone + Copy,
        MemberId: Default + Clone + Copy,
    > Default for ContentActor<CuratorGroupId, CuratorId, MemberId>
{
    fn default() -> Self {
        Self::Lead
    }
}
