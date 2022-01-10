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
// use frame_system::ensure_root;

/// Model of authentication manager.
pub trait ContentActorAuthenticator: frame_system::Trait + MembershipTypes {
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

pub fn ensure_is_valid_curator_id<T: Trait>(curator_id: &T::CuratorId) -> DispatchResult {
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
) -> DispatchResult {
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
) -> DispatchResult {
    ensure!(
        T::is_member(member_id, account_id),
        Error::<T>::MemberAuthFailed
    );
    Ok(())
}

/// Ensure lead authorization performed succesfully
pub fn ensure_lead_auth_success<T: Trait>(account_id: &T::AccountId) -> DispatchResult {
    ensure!(T::is_lead(account_id), Error::<T>::LeadAuthFailed);
    Ok(())
}

/// Ensure given `Origin` is lead
pub fn ensure_is_lead<T: Trait>(origin: T::Origin) -> DispatchResult {
    let account_id = ensure_signed(origin)?;
    ensure_lead_auth_success::<T>(&account_id)
}

pub fn ensure_actor_authorized_to_create_channel<T: Trait>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
) -> DispatchResult {
    match actor {
        // Lead should use their member or curator role to create or update channel assets.
        ContentActor::Lead => {
            Err(Error::<T>::ActorCannotOwnChannel.into())
        }
        ContentActor::Curator(curator_group_id, curator_id) => {
            let sender = ensure_signed(origin)?;

            // Authorize curator, performing all checks to ensure curator can act
            CuratorGroup::<T>::perform_curator_in_group_auth(
                curator_id,
                curator_group_id,
                &sender,
            )
        }
        ContentActor::Member(member_id) => {
            let sender = ensure_signed(origin)?;

            ensure_member_auth_success::<T>(member_id, &sender)
        }
        // TODO:
        // ContentActor::Dao(_daoId) => ...,
    }
}

// Enure actor can update channels and videos in the channel
pub fn ensure_actor_authorized_to_update_channel<T: Trait>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    owner: &ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
) -> DispatchResult {
    // Only owner of a channel can update and delete channel assets.
    // Lead can update and delete curator group owned channel assets.
    match actor {
        ContentActor::Lead => {
            let sender = ensure_signed(origin)?;
            ensure_lead_auth_success::<T>(&sender)?;
            if let ChannelOwner::CuratorGroup(_) = owner {
                Ok(())
            } else {
                Err(Error::<T>::ActorNotAuthorized.into())
            }
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

pub fn ensure_actor_can_edit_text_post<T: Trait>(
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    origin: <T as frame_system::Trait>::Origin,
    author: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
) -> DispatchResult {
    match actor {
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
                *author == *actor,
                Error::<T>::ActorNotAuthorized
            );

            Ok(())
        }
        ContentActor::Member(member_id) => {
            let sender = ensure_signed(origin)?;

            ensure_member_auth_success::<T>(member_id, &sender)?;

            // Ensure the member is the channel owner.
            ensure!(
                *author == *actor,
                Error::<T>::ActorNotAuthorized
            );

            Ok(())
        }
	_ => Err(Error::<T>::ActorNotAuthorized.into())
        // TODO:
        // ContentActor::Dao(_daoId) => ...,
    }
}

// Enure actor can update channels and videos in the channel
pub fn ensure_actor_is_channel_owner<T: Trait>(
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    owner: &ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
) -> DispatchResult {
    let owner = actor_to_channel_owner::<T>(actor)?;
    ensure!(actor == owner, Error::<T>::ActorNotAuthorized);
    Ok(())
}

// Enure actor can update or delete channels and videos
pub fn ensure_actor_authorized_to_set_featured_videos<T: Trait>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
) -> DispatchResult {
    // Only Lead authorized to set featured videos
    if let ContentActor::Lead = actor {
        let sender = ensure_signed(origin)?;
        ensure_lead_auth_success::<T>(&sender)
    } else {
        Err(Error::<T>::ActorNotAuthorized.into())
    }
}

pub fn ensure_actor_authorized_to_censor<T: Trait>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    owner: &ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
) -> DispatchResult {
    // Only lead and curators can censor channels and videos
    // Only lead can censor curator group owned channels and videos
    let sender = ensure_signed(origin)?;
    ensure_actor_auth_success::<T>(&sender, actor)?;
    match actor {
        ContentActor::Lead => Ok(()),
        ContentActor::Curator(curator_group_id, curator_id) => {
            // Curators cannot censor curator group channels
            if let ChannelOwner::CuratorGroup(_) = owner {
                Err(Error::<T>::CannotCensoreCuratorGroupOwnedChannels.into())
            } else {
                Ok(())
            }
        },
        ContentActor::Member(_) => {
            // Members cannot censore channels!
            Err(Error::<T>::ActorNotAuthorized.into())
        }
        // TODO:
        // ContentActor::Dao(_daoId) => ...,
    }
}

pub fn ensure_actor_authorized_to_manage_categories<T: Trait>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
) -> DispatchResult {
    // Only lead and curators can manage categories
    let sender = ensure_signed(origin)?;
    ensure_actor_auth_success::<T>(&sender, actor)?;
    match actor {
        ContentActor::Member(_) => Err(Error::<T>::ActorNotAuthorized.into()),
        _ => Ok(()),
    }
}

// authenticate actor
pub fn ensure_actor_auth_success<T: Trait>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
) -> DispatchResult {
    match actor {
        ContentActor::Lead => ensure_lead_auth_success::<T>(sender),
        ContentActor::Curator(curator_group_id, curator_id) => {
            CuratorGroup::<T>::perform_curator_in_group_auth(curator_id, curator_group_id, &sender)
        }
        ContentActor::Member(member_id) => ensure_member_auth_success::<T>(member_id, sender),
    }
}

// Enure actor can create a post comment
pub fn ensure_actor_authorized_to_add_comment<T: Trait>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
) -> DispatchResult {
    ensure_actor_auth_success::<T>(sender, actor)
}

// Enure actor can create a post comment
pub fn ensure_actor_authorized_to_edit_comment<T: Trait>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    post: &Post<T>,
) -> DispatchResult {
    ensure_actor_auth_success::<T>(sender, actor)?;
    ensure_actor_is_comment_author::<T>(actor, &post.author)
}

// Enure actor can create post: same rules as if he is trying to update channel
pub fn ensure_actor_authorized_to_remove_comment<T: Trait>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
    post: &Post<T>,
) -> Result<CleanupActor, DispatchError> {
    ensure_actor_auth_success::<T>(sender, actor)?;
    let actor_is_owner = ensure_actor_is_channel_owner::<T>(actor, &channel.owner)
        .map(|_| CleanupActor::ChannelOwner);
    let actor_is_author =
        ensure_actor_is_comment_author::<T>(actor, &post.author).map(|_| CleanupActor::PostAuthor);
    let actor_is_moderator = ensure_actor_is_moderator::<T>(actor, &channel.moderator_set)
        .map(|_| CleanupActor::Moderator);

    actor_is_owner.or(actor_is_author).or(actor_is_moderator)
}

// Enure actor can create post: same rules as if he is trying to update channel
pub fn ensure_actor_authorized_to_remove_video_post<T: Trait>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
) -> DispatchResult {
    ensure_actor_auth_success::<T>(sender, actor)?;
    ensure_actor_is_channel_owner::<T>(actor, channel.owner)
}

// Ensure actor is a moderator
pub fn ensure_actor_is_moderator<T: Trait>(
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    moderators: &BTreeSet<T::MemberId>,
) -> DispatchResult {
    match actor {
        ContentActor::Member(member_id) => {
            ensure!(
                moderators.contains(member_id),
                Error::<T>::ModeratorDoesNotExist
            );
            Ok(())
        }
        _ => Err(Error::<T>::ActorNotAuthorized.into()),
    }
}
// Enure actor is comment author
pub fn ensure_actor_is_comment_author<T: Trait>(
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    author: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
) -> DispatchResult {
    // authenticate actor
    ensure!(actor == author, Error::<T>::ActorNotAuthorized);
    Ok(())
}

pub fn actor_to_channel_owner<T: Trait>(
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
) -> ActorToChannelOwnerResult<T> {
    match actor {
            // Lead should use their member or curator role to create channels
            ContentActor::Lead => Err(Error::<T>::ActorCannotOwnChannel),
            ContentActor::Curator(
                curator_group_id,
                _curator_id
            ) => {
                Ok(ChannelOwner::CuratorGroup(*curator_group_id))
            }
            ContentActor::Member(member_id) => {
                Ok(ChannelOwner::Member(*member_id))
            }
            // TODO:
            // ContentActor::Dao(id) => Ok(ChannelOwner::Dao(id)),
        }
}

// pub fn ensure_actor_authorized_to_delete_stale_assets<T: Trait>(
//     origin: T::Origin,
//     actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
// ) -> DispatchResult {
//     // Only Lead and (sudo) can delete assets no longer associated with a channel or person.
//     if let ContentActor::Lead = actor {
//         let sender = ensure_signed(origin)?;
//         ensure_lead_auth_success::<T>(&sender)
//     } else {
//         ensure_root(origin)?;
//         Ok(())
//     }
// }

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
