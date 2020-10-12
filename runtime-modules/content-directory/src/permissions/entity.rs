use super::*;

/// Owner of an `Entity`.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Copy, PartialEq, Eq)]
pub enum EntityController<T: Trait> {
    Maintainers,
    Member(T::MemberId),
    Lead,
}

impl<T: Trait> EntityController<T> {
    /// Create `EntityController` enum representation, using provided `Actor`
    pub fn from_actor(actor: &Actor<T>) -> Self {
        match &actor {
            Actor::Lead => Self::Lead,
            Actor::Member(member_id) => Self::Member(*member_id),
            Actor::Curator(_, _) => Self::Maintainers,
        }
    }
}

impl<T: Trait> Default for EntityController<T> {
    fn default() -> Self {
        Self::Lead
    }
}

impl<T: Trait> core::fmt::Debug for EntityController<T> {
    fn fmt(&self, formatter: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        write!(formatter, "EntityController {:?}", self)
    }
}

/// Permissions for a given entity.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Clone, PartialEq, Eq)]
pub struct EntityPermissions<T: Trait> {
    /// Current controller, which is initially set based on who created entity
    pub controller: EntityController<T>,

    /// Forbid groups to mutate any property value.
    /// Can be useful to use in concert with some curation censorship policy
    pub frozen: bool,

    /// Prevent from being referenced by any entity (including self-references).
    /// Can be useful to use in concert with some curation censorship policy,
    /// e.g. to block content from being included in some public playlist.
    pub referenceable: bool,
}

impl<T: Trait> Default for EntityPermissions<T> {
    fn default() -> Self {
        Self {
            controller: EntityController::<T>::default(),
            frozen: false,
            referenceable: true,
        }
    }
}

impl<T: Trait> EntityPermissions<T> {
    /// Create an instance of `EntityPermissions` with `EntityController` equal to provided one
    pub fn default_with_controller(controller: EntityController<T>) -> Self {
        Self {
            controller,
            ..EntityPermissions::default()
        }
    }

    /// Set current `controller` as provided
    pub fn set_conroller(&mut self, controller: EntityController<T>) {
        self.controller = controller
    }

    /// Check if inner `controller` is equal to the provided one
    pub fn controller_is_equal_to(&self, new_entity_controller: &EntityController<T>) -> bool {
        self.controller == *new_entity_controller
    }

    /// Set `frozen` flag as provided
    pub fn set_frozen(&mut self, frozen: bool) {
        self.frozen = frozen
    }

    /// Set `referenceable` flag as provided
    pub fn set_referencable(&mut self, referenceable: bool) {
        self.referenceable = referenceable;
    }

    /// Retrieve `referenceable` flag
    pub fn is_referancable(&self) -> bool {
        self.referenceable
    }

    /// Get current `controller` by reference
    pub fn get_controller(&self) -> &EntityController<T> {
        &self.controller
    }

    /// Ensure actor with given `EntityAccessLevel` can remove entity
    pub fn ensure_group_can_remove_entity(access_level: EntityAccessLevel) -> Result<(), Error<T>> {
        match access_level {
            EntityAccessLevel::EntityController => Ok(()),
            EntityAccessLevel::EntityControllerAndMaintainer => Ok(()),
            _ => Err(Error::<T>::EntityRemovalAccessDenied),
        }
    }

    /// Ensure provided new_entity_controller is not equal to current one
    pub fn ensure_controllers_are_not_equal(
        &self,
        new_entity_controller: &EntityController<T>,
    ) -> Result<(), Error<T>> {
        ensure!(
            !self.controller_is_equal_to(new_entity_controller),
            Error::<T>::ProvidedEntityControllerIsEqualToTheCurrentOne
        );
        Ok(())
    }
}

/// Type, derived from dispatchable call, identifies the caller
#[derive(Encode, Decode, Eq, PartialEq, Ord, PartialOrd, Clone, Copy)]
pub enum EntityAccessLevel {
    /// Caller identified as the entity maintainer
    EntityMaintainer,

    /// Caller identified as the entity controller
    EntityController,

    /// Caller, that can act as controller and maintainer simultaneously
    /// (can be useful, when controller and maintainer have features, that do not intersect)
    EntityControllerAndMaintainer,
}

impl EntityAccessLevel {
    /// Derives the `EntityAccessLevel` for the actor, attempting to act.
    pub fn derive<T: Trait>(
        account_id: &T::AccountId,
        entity_permissions: &EntityPermissions<T>,
        class_permissions: &ClassPermissions<T::CuratorGroupId>,
        actor: &Actor<T>,
    ) -> Result<Self, Error<T>> {
        let controller = EntityController::<T>::from_actor(actor);
        match actor {
            Actor::Lead if entity_permissions.controller_is_equal_to(&controller) => {
                // Ensure lead authorization performed succesfully
                ensure_lead_auth_success::<T>(account_id).map(|_| Self::EntityController)
            }
            Actor::Member(member_id) if entity_permissions.controller_is_equal_to(&controller) => {
                // Ensure member authorization performed succesfully
                ensure_member_auth_success::<T>(member_id, account_id)
                    .map(|_| Self::EntityController)
            }
            Actor::Curator(curator_group_id, curator_id) => {
                // Authorize curator, performing all checks to ensure curator can act
                CuratorGroup::<T>::perform_curator_in_group_auth(
                    curator_id,
                    curator_group_id,
                    account_id,
                )?;
                match (
                    entity_permissions.controller_is_equal_to(&controller),
                    class_permissions.is_maintainer(curator_group_id),
                ) {
                    (true, true) => Ok(Self::EntityControllerAndMaintainer),
                    (false, true) => Ok(Self::EntityMaintainer),
                    // Curator cannot be controller, but not maintainer simultaneously
                    _ => Err(Error::<T>::EntityAccessDenied),
                }
            }
            _ => Err(Error::<T>::EntityAccessDenied),
        }
    }
}
