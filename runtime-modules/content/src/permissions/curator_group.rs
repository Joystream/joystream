use super::*;
use sp_std::collections::btree_map::BTreeMap;
#[cfg(feature = "std")]
use strum_macros::EnumIter;

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, EnumIter))]
#[derive(Encode, Decode, Clone, Copy, PartialEq, Eq, Debug, PartialOrd, Ord)]
pub enum ChannelFeature {
    ChannelFundsTransfer,
    CreatorCashout,
    VideoNftIssuance,
    VideoCreation,
    VideoUpdate,
    ChannelUpdate,
    CreatorTokenIssuance,
}

impl Default for ChannelFeature {
    fn default() -> Self {
        Self::ChannelFundsTransfer
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, EnumIter))]
#[derive(Encode, Decode, Clone, Copy, PartialEq, Eq, Debug, PartialOrd, Ord)]
pub enum ChannelFeatureStatus {
    Paused,
    Active,
}

pub type ChannelFeatureStatusChanges = BTreeMap<ChannelFeature, ChannelFeatureStatus>;

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, EnumIter))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, PartialOrd, Ord)]
pub enum ContentModerationAction {
    HideVideo,
    HideChannel,
    ChangeChannelFeatureStatus(ChannelFeature),
    DeleteVideo,
    DeleteChannel,
    DeleteVideoAssets,
    DeleteNftVideoAssets,
    DeleteChannelAssets,
}

pub type ModerationPermissionsByLevel<T> =
    BTreeMap<<T as Trait>::ChannelPrivilegeLevel, BTreeSet<ContentModerationAction>>;

/// A group, that consists of `curators` set
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct CuratorGroup<T: Trait>
where
    T: common::membership::MembershipTypes,
    T::ActorId: Ord,
{
    /// Curators set, associated with a iven curator group
    curators: BTreeSet<T::CuratorId>,

    /// When `false`, curator in a given group is forbidden to act
    active: bool,

    // Group's moderation permissions (by channel's privilage level)
    permissions_by_level: ModerationPermissionsByLevel<T>,
}

impl<T: Trait> Default for CuratorGroup<T> {
    fn default() -> Self {
        Self {
            curators: BTreeSet::new(),
            // default curator group status right after creation
            active: false,
            permissions_by_level: BTreeMap::new(),
        }
    }
}

impl<T: Trait> CuratorGroup<T> {
    pub fn create(active: bool, permissions_by_level: &ModerationPermissionsByLevel<T>) -> Self {
        Self {
            curators: BTreeSet::new(),
            active,
            permissions_by_level: permissions_by_level.clone(),
        }
    }

    /// Check if `CuratorGroup` contains curator under given `curator_id`
    pub fn has_curator(&self, curator_id: &T::CuratorId) -> bool {
        self.curators.contains(curator_id)
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
    pub fn set_permissions_by_level(
        &mut self,
        permissions_by_level: &ModerationPermissionsByLevel<T>,
    ) {
        self.permissions_by_level = permissions_by_level.clone()
    }

    /// Get reference to all group permissions
    pub fn get_permissions_by_level(&self) -> &ModerationPermissionsByLevel<T> {
        &self.permissions_by_level
    }

    /// Retrieve set of all curator_ids related to `CuratorGroup` by reference
    pub fn get_curators(&self) -> &BTreeSet<T::CuratorId> {
        &self.curators
    }

    /// Retrieve set of all curator_ids related to `CuratorGroup` by mutable  reference
    pub fn get_curators_mut(&mut self) -> &mut BTreeSet<T::CuratorId> {
        &mut self.curators
    }

    /// Ensure `MaxNumberOfCuratorsPerGroup` constraint satisfied
    pub fn ensure_max_number_of_curators_limit_not_reached(&self) -> DispatchResult {
        ensure!(
            self.curators.len() < T::MaxNumberOfCuratorsPerGroup::get() as usize,
            Error::<T>::CuratorsPerGroupLimitReached
        );
        Ok(())
    }

    /// Ensure curator under given `curator_id` exists in `CuratorGroup`
    pub fn ensure_curator_in_group_exists(&self, curator_id: &T::CuratorId) -> DispatchResult {
        ensure!(
            self.has_curator(curator_id),
            Error::<T>::CuratorIsNotAMemberOfGivenCuratorGroup
        );
        Ok(())
    }

    /// Ensure curator under given `curator_id` does not exist yet in `CuratorGroup`
    pub fn ensure_curator_in_group_does_not_exist(
        &self,
        curator_id: &T::CuratorId,
    ) -> DispatchResult {
        ensure!(
            !self.has_curator(curator_id),
            Error::<T>::CuratorIsAlreadyAMemberOfGivenCuratorGroup
        );
        Ok(())
    }

    /// Authorize curator, performing all checks to ensure curator can act
    pub fn perform_curator_in_group_auth(
        curator_id: &T::CuratorId,
        curator_group_id: &T::CuratorGroupId,
        account_id: &T::AccountId,
    ) -> DispatchResult {
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
        Self::ensure_curator_in_group_exists(&curator_group, curator_id)?;
        Ok(())
    }

    pub fn can_perform_actions(
        &self,
        actions: &[ContentModerationAction],
        privilege_level: T::ChannelPrivilegeLevel,
    ) -> bool {
        let permissions_for_level = self.permissions_by_level.get(&privilege_level);
        if let Some(permissions_for_level) = permissions_for_level {
            for action in actions {
                if !permissions_for_level.contains(&action) {
                    return false;
                }
            }
            true
        } else {
            false
        }
    }

    pub fn can_perform_action(
        &self,
        action: ContentModerationAction,
        privilege_level: T::ChannelPrivilegeLevel,
    ) -> bool {
        self.can_perform_actions(&[action], privilege_level)
    }

    pub fn ensure_can_perform_action(
        &self,
        action: ContentModerationAction,
        privilege_level: T::ChannelPrivilegeLevel,
    ) -> DispatchResult {
        ensure!(
            self.can_perform_action(action, privilege_level),
            Error::<T>::CuratorModerationActionNotAllowed
        );
        Ok(())
    }

    pub fn ensure_can_perform_actions(
        &self,
        actions: &[ContentModerationAction],
        privilege_level: T::ChannelPrivilegeLevel,
    ) -> DispatchResult {
        ensure!(
            self.can_perform_actions(actions, privilege_level),
            Error::<T>::CuratorModerationActionNotAllowed
        );
        Ok(())
    }
}
