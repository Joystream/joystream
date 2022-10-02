use super::*;
use frame_support::{parameter_types, BoundedBTreeMap, BoundedBTreeSet};
use scale_info::TypeInfo;
use sp_std::collections::btree_map::BTreeMap;
#[cfg(feature = "std")]
use strum_macros::EnumIter;
use varaint_count::VariantCount;

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, EnumIter))]
#[derive(
    Encode,
    Decode,
    Clone,
    Copy,
    PartialEq,
    Eq,
    Debug,
    PartialOrd,
    Ord,
    VariantCount,
    TypeInfo,
    MaxEncodedLen,
)]
pub enum PausableChannelFeature {
    // Affects:
    // -`withdraw_from_channel_balance`
    // -`claim_and_withdraw_channel_reward`
    ChannelFundsTransfer,
    // Affects:
    // - `claim_channel_reward`
    // - `claim_and_withdraw_channel_reward`
    CreatorCashout,
    // Affects:
    // - `issue_nft`
    // - `create_video` (if `auto_issue_nft` provided)
    // - `update_video` (if `auto_issue_nft` provided)
    VideoNftIssuance,
    // Affects:
    // - `create_video`
    VideoCreation,
    // Affects:
    // - `update_video`
    VideoUpdate,
    // Affects:
    // - `update_channel`
    ChannelUpdate,
    // Affects:
    // - `issue_creator_token`
    CreatorTokenIssuance,
}

impl Default for PausableChannelFeature {
    fn default() -> Self {
        Self::ChannelFundsTransfer
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, EnumIter))]
#[derive(
    Encode,
    Decode,
    Clone,
    PartialEq,
    Eq,
    Debug,
    PartialOrd,
    Ord,
    VariantCount,
    TypeInfo,
    MaxEncodedLen,
)]
pub enum ContentModerationAction {
    // Related extrinsics:
    // - `set_video_visibility_as_moderator`
    HideVideo,
    // Related extrinsics:
    // - `set_channel_visibility_as_moderator`
    HideChannel,
    // Related extrinsics:
    // - `set_channel_paused_features_as_moderator` - each change of `PausableChannelFeature` `x` requires permissions
    //   for executing `ChangeChannelFeatureStatus(x)` action
    ChangeChannelFeatureStatus(PausableChannelFeature),
    // Related extrinsics:
    // - `delete_video_as_moderator`
    DeleteVideo,
    // Related extrinsics:
    // - `delete_channel_as_moderator`
    DeleteChannel,
    // DeleteVideoAssets(is_video_nft_status_set)
    // Related extrinsics:
    // - `delete_video_assets_as_moderator` - deletion of assets belonging to a video which has an NFT issued
    //   requires permissions for `DeleteVideoAssets(true)` action, deleting other video assets requires permissions for
    //   `DeleteVideoAssets(false)`.
    DeleteVideoAssets(bool),
    // Related extrinsics:
    // - `delete_channel_assets_as_moderator`
    DeleteNonVideoChannelAssets,
    // Related extrinsics:
    // - `update_channel_nft_limit`
    UpdateChannelNftLimits,
}

parameter_types! {
    pub MaxCuratorPermissionsPerLevel: u32 = ContentModerationAction::VARIANT_COUNT as u32
        // ChangeChannelFeatureStatus can contain all possible PausableChannelFeature variants
        + (PausableChannelFeature::VARIANT_COUNT as u32 - 1)
        // DeleteVideoAssets can contain `true` or `false`
        + 1;
}

pub type StoredCuratorModerationPermissions =
    BoundedBTreeSet<ContentModerationAction, MaxCuratorPermissionsPerLevel>;

pub type ModerationPermissionsByLevel<T> =
    BTreeMap<<T as Config>::ChannelPrivilegeLevel, BTreeSet<ContentModerationAction>>;

pub type StoredModerationPermissionsByLevel<T> = BoundedBTreeMap<
    <T as Config>::ChannelPrivilegeLevel,
    StoredCuratorModerationPermissions,
    <T as Config>::MaxKeysPerCuratorGroupPermissionsByLevelMap,
>;

pub type CuratorGroupCuratorsMap<T> = BoundedBTreeMap<
    <T as ContentActorAuthenticator>::CuratorId,
    StoredChannelAgentPermissions,
    <T as Config>::MaxNumberOfCuratorsPerGroup,
>;

/// A group, that consists of `curators` set
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug, TypeInfo, MaxEncodedLen)]
#[scale_info(skip_type_params(T))]
pub struct CuratorGroupRecord<CuratorGroupCuratorsMap, ModerationPermissionsByLevel> {
    /// Map from CuratorId to curator's ChannelAgentPermissions
    curators: CuratorGroupCuratorsMap,

    /// When `false`, curator in a given group is forbidden to act
    active: bool,

    // Group's moderation permissions (by channel's privilage level)
    permissions_by_level: ModerationPermissionsByLevel,
}

pub type CuratorGroup<T> =
    CuratorGroupRecord<CuratorGroupCuratorsMap<T>, StoredModerationPermissionsByLevel<T>>;

impl<CuratorGroupCuratorsMap: Default, ModerationPermissionsByLevel: Default> Default
    for CuratorGroupRecord<CuratorGroupCuratorsMap, ModerationPermissionsByLevel>
{
    fn default() -> Self {
        Self {
            curators: CuratorGroupCuratorsMap::default(),
            // default curator group status right after creation
            active: false,
            permissions_by_level: ModerationPermissionsByLevel::default(),
        }
    }
}

impl<
        CuratorId: Ord + Clone,
        MaxCuratorsPerGroup: Get<u32>,
        ChannelPrivilegeLevel: Ord + Clone + Copy,
        MaxKeysPerCuratorGroupPermissionsByLevelMap: Get<u32>,
    >
    CuratorGroupRecord<
        BoundedBTreeMap<CuratorId, StoredChannelAgentPermissions, MaxCuratorsPerGroup>,
        BoundedBTreeMap<
            ChannelPrivilegeLevel,
            StoredCuratorModerationPermissions,
            MaxKeysPerCuratorGroupPermissionsByLevelMap,
        >,
    >
{
    pub fn try_create<T: Config>(
        active: bool,
        permissions_by_level: &BTreeMap<ChannelPrivilegeLevel, BTreeSet<ContentModerationAction>>,
    ) -> Result<Self, DispatchError> {
        let mut group = Self {
            curators: BoundedBTreeMap::default(),
            active,
            permissions_by_level: BoundedBTreeMap::default(),
        };
        group.try_set_permissions_by_level::<T>(permissions_by_level)?;
        Ok(group)
    }

    /// Check if `CuratorGroup` contains curator under given `curator_id`
    pub fn has_curator(&self, curator_id: &CuratorId) -> bool {
        self.curators.contains_key(curator_id)
    }

    /// Check if `CuratorGroup` is active
    pub fn is_active(&self) -> bool {
        self.active
    }

    /// Set `CuratorGroup` status as provided
    pub fn set_status(&mut self, is_active: bool) {
        self.active = is_active
    }

    /// Set new group permissions
    pub fn try_set_permissions_by_level<T: Config>(
        &mut self,
        permissions_by_level: &BTreeMap<ChannelPrivilegeLevel, BTreeSet<ContentModerationAction>>,
    ) -> DispatchResult {
        self.permissions_by_level = permissions_by_level
            .iter()
            .map(|(k, v)| {
                let stored_moderator_permissions: StoredCuratorModerationPermissions = v
                    .clone()
                    .try_into()
                    .map_err(|_| Error::<T>::MaxCuratorPermissionsPerLevelExceeded)?;
                Ok((*k, stored_moderator_permissions))
            })
            .collect::<Result<BTreeMap<_, _>, DispatchError>>()?
            .try_into()
            .map_err(|_| Error::<T>::CuratorGroupMaxPermissionsByLevelMapSizeExceeded)?;
        Ok(())
    }

    /// Try to add a new curator to group
    pub fn try_add_curator<T: Config>(
        &mut self,
        curator_id: CuratorId,
        agent_permissions: &ChannelAgentPermissions,
    ) -> DispatchResult {
        self.ensure_curator_in_group_does_not_exist::<T>(&curator_id)?;
        let permissions = agent_permissions
            .clone()
            .try_into()
            .map_err(|_| Error::<T>::MaxNumberOfChannelAgentPermissionsExceeded)?;
        self.curators
            .try_insert(curator_id, permissions)
            .map_err(|_| Error::<T>::CuratorsPerGroupLimitReached)?;
        Ok(())
    }

    pub fn remove_curator(&mut self, curator_id: &CuratorId) {
        self.curators.remove(curator_id);
    }

    /// Get all group permissions (as unbounded map)
    pub fn get_permissions_by_level(
        &self,
    ) -> BTreeMap<ChannelPrivilegeLevel, BTreeSet<ContentModerationAction>> {
        self.permissions_by_level
            .clone()
            .into_inner()
            .iter()
            .map(|(k, v)| (*k, v.clone().into_inner()))
            .collect()
    }

    /// Retrieve set of all curator_ids related to `CuratorGroup` by reference
    pub fn get_curators(
        &self,
    ) -> &BoundedBTreeMap<
        CuratorId,
        BoundedBTreeSet<ChannelActionPermission, ChannelAgentPermissionsMaxSize>,
        MaxCuratorsPerGroup,
    > {
        &self.curators
    }

    /// Ensure curator under given `curator_id` exists in `CuratorGroup`
    pub fn ensure_curator_in_group_exists<T: Config>(
        &self,
        curator_id: &CuratorId,
    ) -> DispatchResult {
        ensure!(
            self.has_curator(curator_id),
            Error::<T>::CuratorIsNotAMemberOfGivenCuratorGroup
        );
        Ok(())
    }

    /// Ensure curator under given `curator_id` does not exist yet in `CuratorGroup`
    pub fn ensure_curator_in_group_does_not_exist<T: Config>(
        &self,
        curator_id: &CuratorId,
    ) -> DispatchResult {
        ensure!(
            !self.has_curator(curator_id),
            Error::<T>::CuratorIsAlreadyAMemberOfGivenCuratorGroup
        );
        Ok(())
    }

    /// Authorize curator, performing all checks to ensure curator can act
    pub fn perform_curator_in_group_auth<T: Config<
        CuratorId = CuratorId,
        MaxNumberOfCuratorsPerGroup = MaxCuratorsPerGroup,
        MaxKeysPerCuratorGroupPermissionsByLevelMap = MaxKeysPerCuratorGroupPermissionsByLevelMap,
        ChannelPrivilegeLevel = ChannelPrivilegeLevel
    >>(
        curator_id: &T::CuratorId,
        curator_group_id: &T::CuratorGroupId,
        account_id: &T::AccountId,
    ) -> DispatchResult{
        // Ensure curator authorization performed succesfully
        ensure_curator_auth_success::<T>(curator_id, account_id)?;

        // Retrieve corresponding curator group
        let curator_group = Module::<T>::curator_group_by_id(curator_group_id);

        // Ensure curator group is active
        ensure!(
            curator_group.is_active(),
            Error::<T>::CuratorGroupIsNotActive
        );

        // Ensure curator under given curator_id exists in CuratorGroup
        Self::ensure_curator_in_group_exists::<T>(&curator_group, curator_id)?;
        Ok(())
    }

    pub fn can_group_member_perform_moderation_actions(
        &self,
        actions: &[ContentModerationAction],
        privilege_level: ChannelPrivilegeLevel,
    ) -> bool {
        let permissions_for_level = self.permissions_by_level.get(&privilege_level);
        if let Some(permissions_for_level) = permissions_for_level {
            for action in actions {
                if !permissions_for_level.contains(action) {
                    return false;
                }
            }
            true
        } else {
            false
        }
    }

    pub fn ensure_group_member_can_perform_moderation_actions<T: Config>(
        &self,
        actions: &[ContentModerationAction],
        privilege_level: ChannelPrivilegeLevel,
    ) -> DispatchResult {
        ensure!(
            self.can_group_member_perform_moderation_actions(actions, privilege_level),
            Error::<T>::CuratorModerationActionNotAllowed
        );
        Ok(())
    }

    pub fn get_existing_group_member_channel_agent_permissions<T: Config>(
        &self,
        curator_id: &CuratorId,
    ) -> Result<&StoredChannelAgentPermissions, DispatchError> {
        self.curators
            .get(curator_id)
            .ok_or_else(|| Error::<T>::ActorNotAuthorized.into())
    }
}
