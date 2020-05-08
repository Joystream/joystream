use crate::errors::*;
use crate::*;
use codec::{Codec, Decode, Encode};
use core::fmt::Debug;
use runtime_primitives::traits::{MaybeSerializeDeserialize, Member, SimpleArithmetic};

#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};
use srml_support::{dispatch, ensure, Parameter};

pub type CreationLimit = u32;

/// Model of authentication manager.
pub trait ActorAuthenticator: system::Trait + Debug {
    /// Actor identifier
    type ActorId: Parameter
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

    /// Group identifier
    type GroupId: Parameter
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

    /// Authenticate account as being current authority.
    fn authenticate_authority(origin: &Self::AccountId) -> bool;

    /// Authenticate account as being given actor in given group.
    fn authenticate_actor_in_group(
        account_id: &Self::AccountId,
        actor_id: Self::ActorId,
        group_id: Self::GroupId,
    ) -> bool;
}

pub fn ensure_actor_in_group_auth_success<T: ActorAuthenticator>(
    account_id: &T::AccountId,
    actor_id: T::ActorId,
    group_id: T::GroupId,
) -> dispatch::Result {
    ensure!(
        T::authenticate_actor_in_group(account_id, actor_id, group_id),
        ERROR_ACTOR_IN_GROUP_AUTH_FAILED
    );
    Ok(())
}

pub fn ensure_authority_auth_success<T: ActorAuthenticator>(
    account_id: &T::AccountId,
) -> dispatch::Result {
    ensure!(
        T::authenticate_authority(account_id),
        ERROR_AUTHORITY_AUTH_FAILED
    );
    Ok(())
}

/// Identifier for a given actor in a given group.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Copy, PartialEq, Eq, Debug)]
pub struct ActorInGroupId<T: ActorAuthenticator> {
    actor_id: T::ActorId,
    group_id: T::GroupId,
}

impl<T: ActorAuthenticator> ActorInGroupId<T> {
    pub fn get_actor_id(&self) -> T::ActorId {
        self.actor_id
    }

    pub fn get_group_id(&self) -> T::GroupId {
        self.group_id
    }
}

impl<T: ActorAuthenticator> ActorInGroupId<T> {
    fn from(actor_id: T::ActorId, group_id: T::GroupId) -> Self {
        Self { actor_id, group_id }
    }
}

/// Limit for how many entities of a given class may be created.
#[derive(Encode, Decode, Clone, Debug, PartialEq)]
pub enum EntityCreationLimit {
    /// Look at per class global variable `ClassPermission::per_controller_entity_creation_limit`.
    ClassLimit,

    /// Individual specified limit.
    Individual(CreationLimit),
}

/// A voucher for entity creation
#[derive(Encode, Decode, Clone, Copy, PartialEq, Default)]
pub struct EntityCreationVoucher {
    /// How many are allowed in total
    pub maximum_entities_count: CreationLimit,

    /// How many have currently been created
    pub entities_created: CreationLimit,
}

impl EntityCreationVoucher {
    pub fn new(maximum_entities_count: CreationLimit) -> Self {
        Self {
            maximum_entities_count,
            entities_created: 1,
        }
    }

    pub fn set_maximum_entities_count(&mut self, maximum_entities_count: CreationLimit) {
        self.maximum_entities_count = maximum_entities_count
    }

    pub fn increment_created_entities_count(&mut self) {
        self.entities_created += 1;
    }

    pub fn limit_not_reached(self) -> bool {
        self.entities_created < self.maximum_entities_count
    }
}

/// Who will be set as the controller for any newly created entity in a given class.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Eq, PartialEq, Clone, Copy, Debug)]
pub enum InitialControllerPolicy {
    ActorInGroup,
    Group,
}

impl Default for InitialControllerPolicy {
    fn default() -> Self {
        Self::ActorInGroup
    }
}

/// Permissions for an instance of a Class in the versioned store.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Eq, PartialEq, Clone, Debug)]
pub struct ClassPermissions {
    /// Whether to prevent everyone from creating an entity.
    ///
    /// This could be useful in order to quickly, and possibly temporarily, block new entity creation, without
    /// having to tear down `can_create_entities`.
    entity_creation_blocked: bool,

    /// Policy for how to set the controller of a created entity.
    ///
    /// Example(s)
    /// - For a group that represents something like all possible publishers, then `InitialControllerPolicy::ActorInGroup` makes sense.
    /// - For a group that represents some stable set of curators, then `InitialControllerPolicy::Group` makes sense.
    initial_controller_of_created_entities: InitialControllerPolicy,

    /// Whether to prevent everyone from updating entity properties.
    ///
    /// This could be useful in order to quickly, and probably temporarily, block any editing of entities,
    /// rather than for example having to set, and later clear, `EntityPermissions::frozen_for_controller`
    /// for a large number of entities.
    all_entity_property_values_locked: bool,
}

impl ClassPermissions {
    pub fn all_entity_property_values_locked(&self) -> bool {
        self.all_entity_property_values_locked
    }

    pub fn set_entity_creation_blocked(&mut self, entity_creation_blocked: bool) {
        self.entity_creation_blocked = entity_creation_blocked
    }

    pub fn set_all_entity_property_values_locked(
        &mut self,
        all_entity_property_values_locked: bool,
    ) {
        self.all_entity_property_values_locked = all_entity_property_values_locked
    }

    pub fn set_initial_controller_of_created_entities(
        &mut self,
        initial_controller_of_created_entities: InitialControllerPolicy,
    ) {
        self.initial_controller_of_created_entities = initial_controller_of_created_entities
    }

    pub fn get_initial_controller_of_created_entities(&self) -> InitialControllerPolicy {
        self.initial_controller_of_created_entities
    }

    pub fn ensure_entity_creation_not_blocked(&self) -> dispatch::Result {
        ensure!(self.entity_creation_blocked, ERROR_ENTITY_CREATION_BLOCKED);
        Ok(())
    }
}

/// Owner of an entity.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Copy, PartialEq, Eq, Debug)]
pub enum EntityController<T: ActorAuthenticator> {
    Group(T::GroupId),
    ActorInGroup(ActorInGroupId<T>),
}

impl<T: ActorAuthenticator> EntityController<T> {
    fn from_group(group_id: T::GroupId) -> Self {
        Self::Group(group_id)
    }

    fn from_actor_in_group(actor_id: T::ActorId, group_id: T::GroupId) -> Self {
        Self::ActorInGroup(ActorInGroupId::from(actor_id, group_id))
    }

    pub fn from(
        initial_controller_policy: InitialControllerPolicy,
        actor_in_group: ActorInGroupId<T>,
    ) -> Self {
        if let InitialControllerPolicy::ActorInGroup = initial_controller_policy {
            EntityController::from_actor_in_group(actor_in_group.actor_id, actor_in_group.group_id)
        } else {
            EntityController::from_group(actor_in_group.group_id)
        }
    }
}

impl<T: ActorAuthenticator> Default for EntityController<T> {
    fn default() -> Self {
        Self::Group(T::GroupId::default())
    }
}

/// Permissions for a given entity.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct EntityPermissions<T: ActorAuthenticator> {
    /// Current controller, which is initially set based on who created entity and
    /// `ClassPermission::initial_controller_of_created_entities` for corresponding class permission instance, but it can later be updated.
    /// In case, when entity was created from authority call, controller is set to None
    pub controller: Option<EntityController<T>>,

    /// Forbid groups to mutate any property value.
    /// Can be useful to use in concert with some curation censorship policy
    pub frozen: bool,

    /// Prevent from being referenced by any entity (including self-references).
    /// Can be useful to use in concert with some curation censorship policy,
    /// e.g. to block content from being included in some public playlist.
    pub referenceable: bool,
}

impl<T: ActorAuthenticator> Default for EntityPermissions<T> {
    fn default() -> Self {
        Self {
            controller: None,
            frozen: false,
            referenceable: true,
        }
    }
}

impl<T: ActorAuthenticator> EntityPermissions<T> {
    pub fn default_with_controller(controller: Option<EntityController<T>>) -> Self {
        Self {
            controller,
            ..EntityPermissions::default()
        }
    }

    pub fn set_conroller(&mut self, controller: Option<EntityController<T>>) {
        self.controller = controller
    }

    pub fn is_controller(&self, actor_in_group: &ActorInGroupId<T>) -> bool {
        match &self.controller {
            Some(EntityController::Group(controller_group_id)) => {
                *controller_group_id == actor_in_group.group_id
            }
            Some(EntityController::ActorInGroup(controller_actor_in_group)) => {
                *controller_actor_in_group == *actor_in_group
            }
            _ => false,
        }
    }

    pub fn controller_is_equal_to(&self, controller: &Option<EntityController<T>>) -> bool {
        if let (Some(entity_controller), Some(controller)) = (&self.controller, controller) {
            *entity_controller == *controller
        } else {
            false
        }
    }

    pub fn set_frozen(&mut self, frozen: bool) {
        self.frozen = frozen
    }

    pub fn set_referencable(&mut self, referenceable: bool) {
        self.referenceable = referenceable;
    }

    pub fn is_referancable(&self) -> bool {
        self.referenceable
    }

    pub fn get_controller(&self) -> &Option<EntityController<T>> {
        &self.controller
    }

    pub fn ensure_group_can_remove_entity(access_level: EntityAccessLevel) -> dispatch::Result {
        match access_level {
            EntityAccessLevel::EntityController => Ok(()),
            EntityAccessLevel::EntityControllerAndMaintainer => Ok(()),
            _ => Err(ERROR_ENTITY_REMOVAL_ACCESS_DENIED),
        }
    }

    pub fn ensure_group_can_add_schema_support(
        access_level: EntityAccessLevel,
    ) -> dispatch::Result {
        match access_level {
            EntityAccessLevel::EntityController => Ok(()),
            EntityAccessLevel::EntityControllerAndMaintainer => Ok(()),
            _ => Err(ERROR_ENTITY_ADD_SCHEMA_SUPPORT_ACCESS_DENIED),
        }
    }
}

/// Type, derived from dispatchable call, identifies the caller
#[derive(Encode, Decode, Eq, PartialEq, Ord, PartialOrd, Clone, Copy, Debug)]
pub enum EntityAccessLevel {
    /// Caller identified as the entity controller
    EntityController,
    /// Caller identified as the entity maintainer
    EntityMaintainer,
    /// Caller, that can act as controller and maintainer simultaneously
    /// (can be useful, when controller and maintainer have features, that do not intersect)
    EntityControllerAndMaintainer,
}

impl EntityAccessLevel {
    /// Derives the EntityAccessLevel for the caller, attempting to act.
    pub fn derive_signed<T: Trait>(
        account_id: &T::AccountId,
        entity_id: T::EntityId,
        entity_permissions: &EntityPermissions<T>,
        actor_in_group: ActorInGroupId<T>,
    ) -> Result<Self, &'static str> {
        ensure_actor_in_group_auth_success::<T>(
            account_id,
            actor_in_group.actor_id,
            actor_in_group.group_id,
        )?;
        match (
            entity_permissions.is_controller(&actor_in_group),
            <EntityMaintainers<T>>::exists(entity_id, actor_in_group.group_id),
        ) {
            (true, true) => Ok(Self::EntityControllerAndMaintainer),
            (true, false) => Ok(Self::EntityController),
            (false, true) => Ok(Self::EntityMaintainer),
            (false, false) => Err(ERROR_ENTITY_ACCESS_DENIED),
        }
    }
}
