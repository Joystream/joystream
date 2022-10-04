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
#[derive(Encode, Decode, Eq, PartialEq, Clone, Copy, Debug, TypeInfo)]
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
pub trait ContentActorAuthenticator: frame_system::Config + common::MembershipTypes {
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
        + Ord
        + From<u64>
        + MaxEncodedLen;

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
        + Ord
        + MaxEncodedLen;

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

    /// Get leader member id
    fn get_leader_member_id() -> Option<Self::MemberId>;

    /// Get worker member id
    fn get_curator_member_id(curator_id: &Self::CuratorId) -> Option<Self::MemberId>;
}

pub fn ensure_is_valid_curator_id<T: Config>(curator_id: &T::CuratorId) -> DispatchResult {
    ensure!(
        T::is_valid_curator_id(curator_id),
        Error::<T>::CuratorIdInvalid
    );
    Ok(())
}

/// AUTHENTICATION PRIMITIVES

// Ensure curator authorization performed succesfully
pub fn ensure_curator_auth_success<T: Config>(
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
pub fn ensure_member_auth_success<T: Config>(
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
pub fn ensure_lead_auth_success<T: Config>(account_id: &T::AccountId) -> DispatchResult {
    ensure!(T::is_lead(account_id), Error::<T>::LeadAuthFailed);
    Ok(())
}

// authenticate actor
pub fn ensure_actor_auth_success<T: Config>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
) -> DispatchResult {
    match actor {
        ContentActor::Lead => ensure_lead_auth_success::<T>(sender),
        ContentActor::Curator(curator_group_id, curator_id) => {
            CuratorGroup::<T>::perform_curator_in_group_auth::<T>(
                curator_id,
                curator_group_id,
                sender,
            )
        }
        ContentActor::Member(member_id) => ensure_member_auth_success::<T>(sender, member_id),
    }
}

/// CHANNEL CORE FIELDS MANAGEMENT PERMISSIONS

// Ensure sender is authorized to act as channel owner
pub fn ensure_is_authorized_to_act_as_channel_owner<T: Config>(
    sender: &T::AccountId,
    channel_owner: &ChannelOwner<T::MemberId, T::CuratorGroupId>,
) -> DispatchResult {
    match channel_owner {
        ChannelOwner::CuratorGroup(_) => ensure_lead_auth_success::<T>(sender),
        ChannelOwner::Member(member_id) => ensure_member_auth_success::<T>(sender, member_id),
    }
}

/// Ensure actor is authorized to delete channel
pub fn ensure_actor_authorized_to_delete_channel<T: Config>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
) -> Result<Option<ChannelAgentPermissions>, DispatchError> {
    let mut required_permissions = vec![ChannelActionPermission::DeleteChannel];
    if !channel.data_objects.is_empty() {
        required_permissions.push(ChannelActionPermission::ManageNonVideoChannelAssets);
    }
    ensure_actor_has_channel_permissions::<T>(sender, actor, channel, &required_permissions)
}

/// Ensure actor is authorized to perform channel update with given params
pub fn ensure_actor_authorized_to_perform_channel_update<T: Config>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
    params: &ChannelUpdateParameters<T>,
) -> Result<Option<ChannelAgentPermissions>, DispatchError> {
    let mut required_permissions: Vec<ChannelActionPermission> = Vec::new();

    if params.collaborators.is_some() {
        required_permissions.push(ChannelActionPermission::ManageChannelCollaborators);
    }

    if params.new_meta.is_some() {
        required_permissions.push(ChannelActionPermission::UpdateChannelMetadata);
    }

    if params.assets_to_upload.is_some() || !params.assets_to_remove.is_empty() {
        required_permissions.push(ChannelActionPermission::ManageNonVideoChannelAssets);
    }

    let opt_agent_permissions =
        ensure_actor_has_channel_permissions::<T>(sender, actor, channel, &required_permissions)?;

    if let (Some(agent_permissions), Some(new_collaborators_set)) = (
        opt_agent_permissions.as_ref(),
        params.collaborators.as_ref(),
    ) {
        let updated_collaborators = channel.collaborators.iter().filter_map(|(k, v)| {
            let new_v = new_collaborators_set.get(k);
            if new_v != Some(v) {
                Some((*k, new_v.map_or(BTreeSet::new(), |v| v.clone())))
            } else {
                None
            }
        });
        let added_collaborators = new_collaborators_set.iter().filter_map(|(k, v)| {
            if !channel.collaborators.contains_key(k) {
                Some((*k, v.clone()))
            } else {
                None
            }
        });
        ensure!(
            updated_collaborators
                .chain(added_collaborators)
                .all(|(member_id, new_permissions)| {
                    let old_permissions = channel
                        .collaborators
                        .get(&member_id)
                        .map_or(BTreeSet::new(), |v| v.clone().into_inner());
                    old_permissions.is_subset(agent_permissions)
                        && new_permissions.is_subset(agent_permissions)
                }),
            Error::<T>::ChannelAgentInsufficientPermissions
        )
    }

    Ok(opt_agent_permissions)
}

/// Ensure actor is authorized to create video with given params
pub fn ensure_actor_authorized_to_create_video<T: Config>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
    params: &VideoCreationParameters<T>,
) -> Result<Option<ChannelAgentPermissions>, DispatchError> {
    let mut required_permissions: Vec<ChannelActionPermission> =
        vec![ChannelActionPermission::AddVideo];

    if params.auto_issue_nft.is_some() {
        required_permissions.push(ChannelActionPermission::ManageVideoNfts);
    }

    ensure_actor_has_channel_permissions::<T>(sender, actor, channel, &required_permissions)
}

/// Ensure actor is authorized to perform video update with given params
pub fn ensure_actor_authorized_to_perform_video_update<T: Config>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
    params: &VideoUpdateParameters<T>,
) -> Result<Option<ChannelAgentPermissions>, DispatchError> {
    let mut required_permissions: Vec<ChannelActionPermission> = Vec::new();

    if params.new_meta.is_some() {
        required_permissions.push(ChannelActionPermission::UpdateVideoMetadata);
    }

    if params.assets_to_upload.is_some() || !params.assets_to_remove.is_empty() {
        required_permissions.push(ChannelActionPermission::ManageVideoAssets);
    }

    if params.auto_issue_nft.is_some() {
        required_permissions.push(ChannelActionPermission::ManageVideoNfts);
    }

    ensure_actor_has_channel_permissions::<T>(sender, actor, channel, &required_permissions)
}

/// Ensure actor is authorized to delete video
pub fn ensure_actor_authorized_to_delete_video<T: Config>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
    video: &Video<T>,
) -> Result<Option<ChannelAgentPermissions>, DispatchError> {
    let mut required_permissions = vec![ChannelActionPermission::DeleteVideo];
    if !video.data_objects.is_empty() {
        required_permissions.push(ChannelActionPermission::ManageVideoAssets);
    }
    ensure_actor_has_channel_permissions::<T>(sender, actor, channel, &required_permissions)
}

/// Ensure actor is authorized to manage video nfts
pub fn ensure_actor_authorized_to_manage_video_nfts<T: Config>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
) -> Result<Option<ChannelAgentPermissions>, DispatchError> {
    ensure_actor_has_channel_permissions::<T>(
        sender,
        actor,
        channel,
        &[ChannelActionPermission::ManageVideoNfts],
    )
}

// Ensure actor is authorized to send channel_agent_remark
pub fn ensure_actor_authorized_to_send_channel_agent_remark<T: Config>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
) -> Result<Option<ChannelAgentPermissions>, DispatchError> {
    ensure_actor_has_channel_permissions::<T>(
        sender,
        actor,
        channel,
        &[ChannelActionPermission::AgentRemark],
    )
}

/// CHANNEL ASSET MANAGEMENT PERMISSIONS

// Ensure channel is owned by curators
pub fn ensure_channel_is_owned_by_curators<T: Config>(channel: &Channel<T>) -> DispatchResult {
    if let ChannelOwner::CuratorGroup(_) = channel.owner {
        return Ok(());
    };
    Err(Error::<T>::ActorNotAuthorized.into())
}

// Ensure channel is owned by specified member
pub fn ensure_channel_is_owned_by_member<T: Config>(
    channel: &Channel<T>,
    member_id: &T::MemberId,
) -> DispatchResult {
    ensure!(
        channel.owner == ChannelOwner::Member(*member_id),
        Error::<T>::ActorNotAuthorized
    );
    Ok(())
}

// Ensure channel is owned by specified group
pub fn ensure_channel_is_owned_by_curator_group<T: Config>(
    channel: &Channel<T>,
    group_id: &T::CuratorGroupId,
) -> DispatchResult {
    ensure!(
        channel.owner == ChannelOwner::CuratorGroup(*group_id),
        Error::<T>::ActorNotAuthorized
    );
    Ok(())
}

pub fn get_existing_collaborator_permissions<'a, T: Config>(
    channel: &'a Channel<T>,
    member_id: &T::MemberId,
) -> Result<&'a ChannelAgentPermissions, DispatchError> {
    channel.collaborators.get(member_id).map_or_else(
        || Err(Error::<T>::ActorNotAuthorized.into()),
        |p| Ok(p.as_ref()),
    )
}

pub fn ensure_actor_has_channel_permissions<T: Config>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
    required_permissions: &[ChannelActionPermission],
) -> Result<Option<ChannelAgentPermissions>, DispatchError> {
    ensure_actor_auth_success::<T>(sender, actor)?;
    match actor {
        ContentActor::Lead => ensure_channel_is_owned_by_curators::<T>(channel).map(|_| None),
        ContentActor::Curator(curator_group_id, curator_id) => {
            ensure_channel_is_owned_by_curator_group::<T>(channel, curator_group_id)?;
            let group = Module::<T>::curator_group_by_id(&curator_group_id);
            let agent_permissions =
                group.get_existing_group_member_channel_agent_permissions::<T>(curator_id)?;
            ensure_agent_has_required_permissions::<T>(agent_permissions, required_permissions)?;
            Ok(Some(agent_permissions.clone().into_inner()))
        }
        ContentActor::Member(member_id) => {
            ensure_channel_is_owned_by_member::<T>(channel, member_id).map_or_else(
                |_| {
                    let agent_permissions =
                        get_existing_collaborator_permissions::<T>(channel, member_id)?;
                    ensure_agent_has_required_permissions::<T>(
                        agent_permissions,
                        required_permissions,
                    )?;
                    Ok(Some(agent_permissions.clone()))
                },
                |_| Ok(None),
            )
        }
    }
}

fn ensure_agent_has_required_permissions<T: Config>(
    agent_permissions: &ChannelAgentPermissions,
    required_permissions: &[ChannelActionPermission],
) -> Result<ChannelAgentPermissions, DispatchError> {
    ensure!(
        required_permissions
            .iter()
            .cloned()
            .collect::<BTreeSet<_>>()
            .is_subset(agent_permissions),
        Error::<T>::ChannelAgentInsufficientPermissions
    );
    Ok(agent_permissions.clone())
}

/// SET FEATURED VIDEOS & CATEGORIES MANAGEMENT PERMISSION

/// Ensure actor can manage nft
pub fn ensure_actor_authorized_to_manage_nft<T: Config>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    nft_owner: &NftOwner<T::MemberId>,
    in_channel: T::ChannelId,
) -> DispatchResult {
    let sender = ensure_signed(origin)?;
    ensure_actor_auth_success::<T>(&sender, actor)?;

    if let NftOwner::Member(member_id) = nft_owner {
        ensure!(
            *actor == ContentActor::Member(*member_id),
            Error::<T>::ActorNotAuthorized
        );
    } else {
        let channel = Module::<T>::ensure_channel_exists(&in_channel)?;
        ensure_actor_authorized_to_manage_video_nfts::<T>(&sender, actor, &channel)?;
    }
    Ok(())
}

// Ensure actor can manage categories
pub fn ensure_actor_authorized_to_manage_categories<T: Config>(
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

pub fn actor_to_channel_owner<T: Config>(
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
pub fn ensure_actor_authorized_to_claim_payment<T: Config>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
) -> Result<Option<ChannelAgentPermissions>, DispatchError> {
    let sender = ensure_signed(origin)?;
    ensure_actor_has_channel_permissions::<T>(
        &sender,
        actor,
        channel,
        &[ChannelActionPermission::ClaimChannelReward],
    )
}

pub fn ensure_actor_authorized_to_withdraw_from_channel<T: Config>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
) -> Result<Option<ChannelAgentPermissions>, DispatchError> {
    let sender = ensure_signed(origin)?;
    ensure_actor_auth_success::<T>(&sender, actor)?;
    ensure_actor_has_channel_permissions::<T>(
        &sender,
        actor,
        channel,
        &[ChannelActionPermission::WithdrawFromChannelBalance],
    )
}

// authorized account can update payouts vector commitment
pub fn ensure_authorized_to_update_commitment<T: Config>(sender: &T::AccountId) -> DispatchResult {
    ensure_lead_auth_success::<T>(sender)
}

pub fn ensure_authorized_to_update_max_reward<T: Config>(sender: &T::AccountId) -> DispatchResult {
    ensure_lead_auth_success::<T>(sender)
}

pub fn ensure_authorized_to_update_min_cashout<T: Config>(sender: &T::AccountId) -> DispatchResult {
    ensure_lead_auth_success::<T>(sender)
}

pub fn ensure_authorized_to_update_channel_state_bloat_bond<T: Config>(
    sender: &T::AccountId,
) -> DispatchResult {
    ensure_lead_auth_success::<T>(sender)
}

pub fn ensure_authorized_to_update_video_state_bloat_bond<T: Config>(
    sender: &T::AccountId,
) -> DispatchResult {
    ensure_lead_auth_success::<T>(sender)
}
/// Moderation actions (curator/lead)

pub fn ensure_actor_authorized_to_perform_moderation_actions<T: Config>(
    sender: &T::AccountId,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    actions: &[ContentModerationAction],
    channel_privilege_level: T::ChannelPrivilegeLevel,
) -> DispatchResult {
    ensure_actor_auth_success::<T>(sender, actor)?;
    // Ensure actor is either lead of part of curators group with sufficient permissions
    match actor {
        ContentActor::Lead => Ok(()),
        ContentActor::Curator(curator_group_id, ..) => {
            let group = Module::<T>::curator_group_by_id(&curator_group_id);
            group.ensure_group_member_can_perform_moderation_actions::<T>(
                actions,
                channel_privilege_level,
            )?;
            Ok(())
        }
        _ => Err(Error::<T>::ActorNotAuthorized.into()),
    }
}

/// Transfer channels permissions

// start Transfer channel check.
pub fn ensure_actor_authorized_to_transfer_channel<T: Config>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
) -> Result<Option<ChannelAgentPermissions>, DispatchError> {
    let sender = ensure_signed(origin)?;
    ensure_actor_has_channel_permissions::<T>(
        &sender,
        actor,
        channel,
        &[ChannelActionPermission::TransferChannel],
    )
}

// cancel Transfer channel check.
pub fn ensure_actor_authorized_to_cancel_channel_transfer<T: Config>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
) -> Result<Option<ChannelAgentPermissions>, DispatchError> {
    let sender = ensure_signed(origin)?;
    ensure_actor_has_channel_permissions::<T>(
        &sender,
        actor,
        channel,
        &[ChannelActionPermission::TransferChannel],
    )
}

// Council reward
pub fn ensure_actor_authorized_to_claim_council_reward<T: Config>(
    origin: T::Origin,
    owner: &ChannelOwner<T::MemberId, T::CuratorGroupId>,
) -> DispatchResult {
    let sender = ensure_signed(origin)?;
    ensure_lead_auth_success::<T>(&sender)?;
    ensure!(
        matches!(owner, ChannelOwner::CuratorGroup(..)),
        Error::<T>::InvalidChannelOwner
    );

    Ok(())
}

// Validates that there are no pending channel transfers.
pub fn ensure_no_channel_transfers<T: Config>(channel: &Channel<T>) -> DispatchResult {
    ensure!(
        channel.transfer_status == ChannelTransferStatus::NoActiveTransfer,
        Error::<T>::InvalidChannelTransferStatus
    );

    Ok(())
}

// Nft limits
pub fn ensure_actor_authorized_to_update_channel_nft_limits<T: Config>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
) -> DispatchResult {
    let sender = ensure_signed(origin)?;
    ensure_actor_authorized_to_perform_moderation_actions::<T>(
        &sender,
        actor,
        &[ContentModerationAction::UpdateChannelNftLimits],
        channel.privilege_level,
    )
}

// Creator tokens
pub fn get_member_id_of_actor<T: Config>(
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
) -> Result<T::MemberId, DispatchError> {
    let opt_member_id = match actor {
        ContentActor::Member(member_id) => Some(*member_id),
        ContentActor::Curator(_, curator_id) => T::get_curator_member_id(curator_id),
        ContentActor::Lead => T::get_leader_member_id(),
    };
    opt_member_id.ok_or_else(|| Error::<T>::MemberIdCouldNotBeDerivedFromActor.into())
}

pub fn ensure_actor_authorized_to_issue_creator_token<T: Config>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
) -> Result<T::AccountId, DispatchError> {
    let sender = ensure_signed(origin)?;
    let required_permissions = vec![ChannelActionPermission::IssueCreatorToken];
    ensure_actor_has_channel_permissions::<T>(&sender, actor, channel, &required_permissions)?;
    Ok(sender)
}

pub fn ensure_actor_authorized_to_claim_creator_token_patronage<T: Config>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
) -> Result<T::AccountId, DispatchError> {
    let sender = ensure_signed(origin)?;
    let required_permissions = vec![ChannelActionPermission::ClaimCreatorTokenPatronage];
    ensure_actor_has_channel_permissions::<T>(&sender, actor, channel, &required_permissions)?;
    Ok(sender)
}

pub fn ensure_actor_authorized_to_init_and_manage_creator_token_sale<T: Config>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
) -> Result<(T::AccountId, Option<ChannelAgentPermissions>), DispatchError> {
    let sender = ensure_signed(origin)?;
    let required_permissions = vec![ChannelActionPermission::InitAndManageCreatorTokenSale];
    let permissions =
        ensure_actor_has_channel_permissions::<T>(&sender, actor, channel, &required_permissions)?;
    Ok((sender, permissions))
}

pub fn ensure_actor_authorized_to_perform_creator_token_issuer_transfer<T: Config>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
) -> Result<T::AccountId, DispatchError> {
    let sender = ensure_signed(origin)?;
    let required_permissions = vec![ChannelActionPermission::CreatorTokenIssuerTransfer];
    ensure_actor_has_channel_permissions::<T>(&sender, actor, channel, &required_permissions)?;
    Ok(sender)
}

pub fn ensure_actor_authorized_to_make_creator_token_permissionless<T: Config>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
) -> Result<T::AccountId, DispatchError> {
    let sender = ensure_signed(origin)?;
    let required_permissions = vec![ChannelActionPermission::MakeCreatorTokenPermissionless];
    ensure_actor_has_channel_permissions::<T>(&sender, actor, channel, &required_permissions)?;
    Ok(sender)
}

pub fn ensure_actor_authorized_to_reduce_creator_token_patronage_rate<T: Config>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
) -> Result<T::AccountId, DispatchError> {
    let sender = ensure_signed(origin)?;
    let required_permissions = vec![ChannelActionPermission::ReduceCreatorTokenPatronageRate];
    ensure_actor_has_channel_permissions::<T>(&sender, actor, channel, &required_permissions)?;
    Ok(sender)
}

pub fn ensure_actor_authorized_to_manage_revenue_splits<T: Config>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
) -> Result<T::AccountId, DispatchError> {
    let sender = ensure_signed(origin)?;
    let required_permissions = vec![ChannelActionPermission::ManageRevenueSplits];
    ensure_actor_has_channel_permissions::<T>(&sender, actor, channel, &required_permissions)?;
    Ok(sender)
}

pub fn ensure_actor_authorized_to_deissue_creator_token<T: Config>(
    origin: T::Origin,
    actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    channel: &Channel<T>,
) -> Result<T::AccountId, DispatchError> {
    let sender = ensure_signed(origin)?;
    let required_permissions = vec![ChannelActionPermission::DeissueCreatorToken];
    ensure_actor_has_channel_permissions::<T>(&sender, actor, channel, &required_permissions)?;
    Ok(sender)
}
