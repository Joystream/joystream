mod curator_group;
pub use crate::errors::*;
use crate::*;
pub use codec::{Codec, Decode, Encode};
use core::fmt::Debug;
pub use curator_group::*;
use frame_support::{ensure, Parameter};
#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};
use sp_arithmetic::traits::BaseArithmetic;
use sp_runtime::traits::{MaybeSerializeDeserialize, Member};

/// CONTENTACTOR ENUM DEFINITION

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

/// Model of authentication manager.
pub trait ContentActorAuthenticator: frame_system::Trait + membership::Trait {
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

    /// Ensure member id is valid
    fn validate_member_id(member_id: &Self::MemberId) -> bool;
}

pub fn ensure_is_valid_curator_id<T: Trait>(curator_id: &T::CuratorId) -> DispatchResult {
    ensure!(
        T::is_valid_curator_id(curator_id),
        Error::<T>::CuratorIdInvalid
    );
    Ok(())
}

/// AUTHENTICATION PRIMITIVES

// Ensure curator authorization performed succesfully
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

// Ensure member authorization performed succesfully
pub fn ensure_member_auth_success<T: Trait>(
    account_id: &T::AccountId,
    member_id: &T::MemberId,
) -> DispatchResult {
    ensure!(
        T::is_member(member_id, account_id),
        Error::<T>::MemberAuthFailed
    );
    Ok(())
}

// Ensure lead authorization performed succesfully
pub fn ensure_lead_auth_success<T: Trait>(account_id: &T::AccountId) -> DispatchResult {
    ensure!(T::is_lead(account_id), Error::<T>::LeadAuthFailed);
    Ok(())
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
        ContentActor::Member(member_id) => ensure_member_auth_success::<T>(sender, member_id),
    }
}

/// CHANNEL CORE FIELDS MANAGEMENT PERMISSIONS

/// Ensure actor is authorized to create a channel
pub fn ensure_actor_authorized_to_create_channel<T: Trait>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
) -> DispatchResult {
    ensure_actor_auth_success::<T>(sender, actor)?;
    actor_to_channel_owner::<T>(actor).map(|_| ())
}

/// Ensure actor is authorized to delete channel
pub fn ensure_actor_authorized_to_delete_channel<T: Trait>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    owner: &ChannelOwner<T::MemberId, T::CuratorGroupId>,
) -> DispatchResult {
    ensure_actor_auth_success::<T>(sender, actor)?;
    match actor {
        ContentActor::Lead => ensure_channel_is_owned_by_curators::<T>(owner),
        _ => ensure_actor_is_channel_owner::<T>(actor, owner),
    }
}

/// Ensure actor is authorized to manage collaborator set for a channel
pub fn ensure_actor_can_manage_collaborators<T: Trait>(
    sender: &T::AccountId,
    owner: &ChannelOwner<T::MemberId, T::CuratorGroupId>,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
) -> DispatchResult {
    ensure_actor_auth_success::<T>(sender, actor)?;
    match actor {
        ContentActor::Lead => ensure_channel_is_owned_by_curators::<T>(owner),
        _ => ensure_actor_is_channel_owner::<T>(actor, owner),
    }
}

/// Ensure actor is authorized to manage moderator set for a channel
pub fn ensure_actor_can_manage_moderators<T: Trait>(
    sender: &T::AccountId,
    owner: &ChannelOwner<T::MemberId, T::CuratorGroupId>,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
) -> DispatchResult {
    ensure_actor_auth_success::<T>(sender, actor)?;
    match actor {
        ContentActor::Lead => ensure_channel_is_owned_by_curators::<T>(owner),
        _ => ensure_actor_is_channel_owner::<T>(actor, owner),
    }
}

/// Ensure actor is authorized to manage reward account for a channel
pub fn ensure_actor_can_manage_reward_account<T: Trait>(
    sender: &T::AccountId,
    owner: &ChannelOwner<T::MemberId, T::CuratorGroupId>,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
) -> DispatchResult {
    ensure_actor_auth_success::<T>(sender, actor)?;
    match actor {
        ContentActor::Lead => ensure_channel_is_owned_by_curators::<T>(owner),
        _ => ensure_actor_is_channel_owner::<T>(actor, owner),
    }
}

/// CHANNEL ASSET MANAGEMENT PERMISSIONS

// Ensure channel is owned by curators
pub fn ensure_channel_is_owned_by_curators<T: Trait>(
    owner: &ChannelOwner<T::MemberId, T::CuratorGroupId>,
) -> DispatchResult {
    if let ChannelOwner::CuratorGroup(_) = *owner {
        return Ok(());
    };
    Err(Error::<T>::ActorNotAuthorized.into())
}

// Ensure actor is authorized to manage channel assets & videos
pub fn ensure_actor_authorized_to_update_channel_assets<T: Trait>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
) -> DispatchResult {
    // Only owner of a channel can update and delete channel assets.
    // Lead can update and delete curator group owned channel assets.
    ensure_actor_auth_success::<T>(&sender, actor)?;
    match actor {
        ContentActor::Lead => ensure_channel_is_owned_by_curators::<T>(&channel.owner),
        ContentActor::Curator(..) => ensure_actor_is_channel_owner::<T>(actor, &channel.owner),
        ContentActor::Member(member_id) => {
            let is_collaborator = ensure_member_is_collaborator::<T>(member_id, channel);
            let is_owner = ensure_actor_is_channel_owner::<T>(actor, &channel.owner);
            is_owner.or(is_collaborator)
        }
    }
}

// ensure member id is in the channel collaborator set
pub fn ensure_member_is_collaborator<T: Trait>(
    member_id: &T::MemberId,
    channel: &Channel<T>,
) -> DispatchResult {
    ensure!(
        channel.collaborators.contains(member_id),
        Error::<T>::ActorNotAuthorized
    );
    Ok(())
}

// Ensure actor can update channels and videos in the channel
pub fn ensure_actor_is_channel_owner<T: Trait>(
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    owner: &ChannelOwner<T::MemberId, T::CuratorGroupId>,
) -> DispatchResult {
    let resulting_owner = actor_to_channel_owner::<T>(actor)?;
    ensure!(resulting_owner == *owner, Error::<T>::ActorNotAuthorized);
    Ok(())
}

/// SET FEATURED VIDEOS & CATEGORIES MANAGEMENT PERMISSION

/// Ensure actor can manage nft
pub fn ensure_actor_authorized_to_manage_nft<T: Trait>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    nft_owner: &NFTOwner<T::MemberId>,
    in_channel: T::ChannelId,
) -> DispatchResult {
    let sender = ensure_signed(origin)?;
    ensure_actor_auth_success::<T>(&sender, actor)?;

    if let NFTOwner::Member(member_id) = nft_owner {
        ensure!(
            *actor == ContentActor::Member(*member_id),
            Error::<T>::ActorNotAuthorized
        );
    } else {
        // Ensure curator group is the channel owner.
        let channel_owner = Module::<T>::ensure_channel_validity(&in_channel)?.owner;

        match actor {
            ContentActor::Lead => {
                if let ChannelOwner::CuratorGroup(_) = channel_owner {
                    return Ok(());
                } else {
                    return Err(Error::<T>::ActorNotAuthorized.into());
                }
            }
            ContentActor::Curator(curator_group_id, _) => {
                // Ensure curator group is the channel owner.
                ensure!(
                    channel_owner == ChannelOwner::CuratorGroup(*curator_group_id),
                    Error::<T>::ActorNotAuthorized
                );
            }
            ContentActor::Member(member_id) => {
                // Ensure the member is the channel owner.
                ensure!(
                    channel_owner == ChannelOwner::Member(*member_id),
                    Error::<T>::ActorNotAuthorized
                );
            }
        }
    }
    Ok(())
}

// Enure actor can update or delete channels and videos
pub fn ensure_actor_authorized_to_set_featured_videos<T: Trait>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
) -> DispatchResult {
    let sender = ensure_signed(origin)?;
    ensure_actor_auth_success::<T>(&sender, actor)?;
    if let ContentActor::Lead = actor {
        Ok(())
    } else {
        Err(Error::<T>::ActorNotAuthorized.into())
    }
}

// Ensure actor can censor
pub fn ensure_actor_authorized_to_censor<T: Trait>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    owner: &ChannelOwner<T::MemberId, T::CuratorGroupId>,
) -> DispatchResult {
    // Only lead and curators can censor channels and videos
    // Only lead can censor curator group owned channels and videos
    let sender = ensure_signed(origin)?;
    ensure_actor_auth_success::<T>(&sender, actor)?;
    match actor {
        ContentActor::Lead => Ok(()),
        ContentActor::Curator(..) => {
            ensure!(
                !ensure_channel_is_owned_by_curators::<T>(owner).is_ok(),
                Error::<T>::CannotCensoreCuratorGroupOwnedChannels,
            );
            Ok(())
        }
        ContentActor::Member(_) => Err(Error::<T>::ActorNotAuthorized.into()),
    }
}

// Ensure actor can manage categories
pub fn ensure_actor_authorized_to_manage_categories<T: Trait>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
) -> DispatchResult {
    // Only lead and curators can manage categories
    let sender = ensure_signed(origin)?;
    ensure_actor_auth_success::<T>(&sender, actor)?;
    if let ContentActor::Member(_) = actor {
        return Err(Error::<T>::ActorNotAuthorized.into());
    }
    Ok(())
}

// POST RELATED PERMISSIONS

// Ensure actor can add a comment
pub fn ensure_actor_authorized_to_add_comment<T: Trait>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
) -> DispatchResult {
    ensure_actor_auth_success::<T>(sender, actor)
}

// Ensure actor can add a video post
pub fn ensure_actor_authorized_to_add_video_post<T: Trait>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    owner: &ChannelOwner<T::MemberId, T::CuratorGroupId>,
) -> DispatchResult {
    ensure_actor_auth_success::<T>(sender, actor)?;
    ensure_actor_is_channel_owner::<T>(actor, owner)
}

// Ensure actor can edit a video post description
pub fn ensure_actor_authorized_to_edit_video_post<T: Trait>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    owner: &ChannelOwner<T::MemberId, T::CuratorGroupId>,
) -> DispatchResult {
    ensure_actor_auth_success::<T>(sender, actor)?;
    ensure_actor_is_channel_owner::<T>(actor, owner)
}

// Ensure actor can edit a post comment text
pub fn ensure_actor_authorized_to_edit_comment<T: Trait>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    post: &VideoPost<T>,
) -> DispatchResult {
    ensure_actor_auth_success::<T>(sender, actor)?;
    ensure_actor_is_comment_author::<T>(actor, &post.author)
}

// Ensure actor can create post: same rules as if he is trying to update channel
pub fn ensure_actor_authorized_to_remove_comment<T: Trait>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
    post: &VideoPost<T>,
) -> Result<CleanupActor, DispatchError> {
    ensure_actor_auth_success::<T>(sender, actor)?;
    let actor_is_owner = ensure_actor_is_channel_owner::<T>(actor, &channel.owner)
        .map(|_| CleanupActor::ChannelOwner);
    let actor_is_author = ensure_actor_is_comment_author::<T>(actor, &post.author)
        .map(|_| CleanupActor::VideoPostAuthor);
    let actor_is_moderator =
        ensure_actor_is_moderator::<T>(actor, &channel.moderators).map(|_| CleanupActor::Moderator);

    actor_is_author.or(actor_is_owner).or(actor_is_moderator)
}

// Ensure actor can create post: same rules as if he is trying to update channel
pub fn ensure_actor_authorized_to_remove_video_post<T: Trait>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
) -> DispatchResult {
    ensure_actor_auth_success::<T>(sender, actor)?;
    ensure_actor_is_channel_owner::<T>(actor, &channel.owner)
}

// Ensure actor is a moderator
pub fn ensure_actor_is_moderator<T: Trait>(
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    moderators: &BTreeSet<T::MemberId>,
) -> DispatchResult {
    if let ContentActor::Member(member_id) = actor {
        ensure!(
            moderators.contains(member_id),
            Error::<T>::ActorNotAuthorized
        );
        Ok(())
    } else {
        Err(Error::<T>::ActorNotAuthorized.into())
    }
}
// Ensure actor is comment author
pub fn ensure_actor_is_comment_author<T: Trait>(
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    author: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
) -> DispatchResult {
    ensure!(actor == author, Error::<T>::ActorNotAuthorized);
    Ok(())
}

pub fn actor_to_channel_owner<T: Trait>(
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
) -> Result<ChannelOwner<T::MemberId, T::CuratorGroupId>, DispatchError> {
    match actor {
        // Lead should use their member or curator role to create channels
        ContentActor::Lead => Err(Error::<T>::ActorCannotOwnChannel.into()),
        ContentActor::Curator(curator_group_id, _curator_id) => {
            Ok(ChannelOwner::CuratorGroup(*curator_group_id))
        }
        ContentActor::Member(member_id) => Ok(ChannelOwner::Member(*member_id)),
    }
}

/// PAYOUTS-RELATED PERMISSIONS

// authorize actor and claim payment
pub fn ensure_actor_authorized_to_claim_payment<T: Trait>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    owner: &ChannelOwner<T::MemberId, T::CuratorGroupId>,
) -> DispatchResult {
    let sender = ensure_signed(origin)?;
    ensure_actor_auth_success::<T>(&sender, actor)?;
    ensure_actor_is_channel_owner::<T>(actor, owner)
}

// authorized account can update payouts vector commitment
pub fn ensure_authorized_to_update_commitment<T: Trait>(sender: &T::AccountId) -> DispatchResult {
    ensure_lead_auth_success::<T>(sender)
}

pub fn ensure_authorized_to_update_max_reward<T: Trait>(sender: &T::AccountId) -> DispatchResult {
    ensure_lead_auth_success::<T>(sender)
}

pub fn ensure_authorized_to_update_min_cashout<T: Trait>(sender: &T::AccountId) -> DispatchResult {
    ensure_lead_auth_success::<T>(sender)
}
