use super::*;

/// Permissions for an instance of a `Class` in the versioned store.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct ClassPermissions<CuratorGroupId: Ord> {
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

impl<CuratorGroupId: Ord> Default for ClassPermissions<CuratorGroupId> {
    fn default() -> Self {
        Self {
            any_member: false,
            entity_creation_blocked: false,
            all_entity_property_values_locked: false,
            maintainers: BTreeSet::new(),
        }
    }
}

impl<CuratorGroupId: Ord> ClassPermissions<CuratorGroupId> {
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

    /// Ensure provided actor can create entities of current `Class`
    pub fn ensure_can_create_entities<T: Trait>(
        &self,
        account_id: &T::AccountId,
        actor: &Actor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    ) -> Result<(), Error<T>> {
        let can_create = match &actor {
            Actor::Lead => {
                // Ensure lead authorization performed succesfully
                ensure_lead_auth_success::<T>(account_id)?;
                true
            }
            Actor::Member(member_id) if self.any_member => {
                // Ensure member authorization performed succesfully
                ensure_member_auth_success::<T>(member_id, account_id)?;
                true
            }
            Actor::Curator(curator_group_id, curator_id)
                if self.maintainers.contains(curator_group_id) =>
            {
                // Authorize curator, performing all checks to ensure curator can act
                CuratorGroup::<T>::perform_curator_in_group_auth(
                    curator_id,
                    curator_group_id,
                    account_id,
                )?;
                true
            }
            _ => false,
        };
        ensure!(can_create, Error::<T>::ActorCanNotCreateEntities);
        Ok(())
    }

    /// Ensure entities creation is not blocked on `Class` level
    pub fn ensure_entity_creation_not_blocked<T: Trait>(&self) -> Result<(), Error<T>> {
        ensure!(
            !self.entity_creation_blocked,
            Error::<T>::EntitiesCreationBlocked
        );
        Ok(())
    }

    /// Ensure maintainer, associated with given `curator_group_id` is already added to `maintainers` set
    pub fn ensure_maintainer_exists<T: Trait>(
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
    pub fn ensure_maintainer_does_not_exist<T: Trait>(
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
