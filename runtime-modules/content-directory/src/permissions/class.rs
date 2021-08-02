use super::*;

/// Permissions for an instance of a `Class` in the versioned store.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug, Default)]
pub struct ClassPermissions<CuratorGroupId: Ord + Default> {
    /// For this permission, the individual member is allowed to create the entity and become controller.
    any_member: bool,

    /// Whether to prevent everyone from creating an entity.
    ///
    /// This could be useful in order to quickly, and possibly temporarily, block new entity creation, without
    /// having to tear down `can_create_entities`.
    entity_creation_blocked: bool,

    /// Whether to prevent everyone from updating entity properties.
    ///
    /// This could be useful in order to quickly, and probably temporarily, block any editing of entities,
    /// rather than for example having to set, and later clear.
    all_entity_property_values_locked: bool,

    /// Current class maintainer curator groups
    maintainers: BTreeSet<CuratorGroupId>,
}

impl<CuratorGroupId: Ord + Default> ClassPermissions<CuratorGroupId> {
    /// Retieve `all_entity_property_values_locked` status
    pub fn all_entity_property_values_locked(&self) -> bool {
        self.all_entity_property_values_locked
    }

    /// Retieve `any_member` status
    pub fn any_member_status(&self) -> bool {
        self.any_member
    }

    /// Check if given `curator_group_id` is maintainer of current `Class`
    pub fn is_maintainer(&self, curator_group_id: &CuratorGroupId) -> bool {
        self.maintainers.contains(curator_group_id)
    }

    /// Get `Class` maintainers by reference
    pub fn get_maintainers(&self) -> &BTreeSet<CuratorGroupId> {
        &self.maintainers
    }

    /// Get `Class` maintainers by mutable reference
    pub fn get_maintainers_mut(&mut self) -> &mut BTreeSet<CuratorGroupId> {
        &mut self.maintainers
    }

    /// Set `entity_creation_blocked` flag, as provided
    pub fn set_entity_creation_blocked(&mut self, entity_creation_blocked: bool) {
        self.entity_creation_blocked = entity_creation_blocked
    }

    /// Set `all_entity_property_values_locked` flag, as provided
    pub fn set_all_entity_property_values_locked(
        &mut self,
        all_entity_property_values_locked: bool,
    ) {
        self.all_entity_property_values_locked = all_entity_property_values_locked
    }

    /// Set `any_member` flag, as provided
    pub fn set_any_member_status(&mut self, any_member: bool) {
        self.any_member = any_member;
    }

    /// Update `maintainers` set with provided one
    pub fn set_maintainers(&mut self, maintainers: BTreeSet<CuratorGroupId>) {
        self.maintainers = maintainers
    }

    /// Ensure entities creation is not blocked on `Class` level
    pub fn ensure_entity_creation_not_blocked<T: Config>(&self) -> Result<(), Error<T>> {
        ensure!(
            !self.entity_creation_blocked,
            Error::<T>::EntitiesCreationBlocked
        );
        Ok(())
    }

    /// Ensure maintainer, associated with given `curator_group_id` is already added to `maintainers` set
    pub fn ensure_maintainer_exists<T: Config>(
        &self,
        curator_group_id: &CuratorGroupId,
    ) -> Result<(), Error<T>> {
        ensure!(
            self.maintainers.contains(curator_group_id),
            Error::<T>::MaintainerDoesNotExist
        );
        Ok(())
    }

    /// Ensure maintainer, associated with given `curator_group_id` is not yet added to `maintainers` set
    pub fn ensure_maintainer_does_not_exist<T: Config>(
        &self,
        curator_group_id: &CuratorGroupId,
    ) -> Result<(), Error<T>> {
        ensure!(
            !self.maintainers.contains(curator_group_id),
            Error::<T>::MaintainerAlreadyExists
        );
        Ok(())
    }
}
