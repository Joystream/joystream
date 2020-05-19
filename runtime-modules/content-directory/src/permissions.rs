use crate::errors::*;
use crate::*;
use codec::{Codec, Decode, Encode};
use core::fmt::Debug;
use runtime_primitives::traits::{MaybeSerializeDeserialize, Member, SimpleArithmetic};

#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};
use srml_support::{dispatch, ensure, Parameter};

// Type, representing creation limit for entities in different scenarios
pub type CreationLimit = u32;

/// Model of authentication manager.
pub trait ActorAuthenticator: system::Trait + Debug {
    /// Curator identifier
    type CuratorId: Parameter
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

    /// Member identifier
    type MemberId: Parameter
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

    /// Curator group identifier
    type CuratorGroupId: Parameter
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

    /// Authorize actor as lead
    fn is_lead(account_id: &Self::AccountId) -> bool;

    /// Authorize actor as curator
    fn is_curator(curator_id: &Self::CuratorId, account_id: &Self::AccountId) -> bool;

    /// Authorize actor as member
    fn is_member(member_id: &Self::MemberId, account_id: &Self::AccountId) -> bool;
}

pub fn ensure_curator_auth_success<T: ActorAuthenticator>(
    curator_id: &T::CuratorId,
    account_id: &T::AccountId,
) -> dispatch::Result {
    ensure!(
        T::is_curator(curator_id, account_id),
        ERROR_CURATOR_AUTH_FAILED
    );
    Ok(())
}

pub fn ensure_member_auth_success<T: ActorAuthenticator>(
    member_id: &T::MemberId,
    account_id: &T::AccountId,
) -> dispatch::Result {
    ensure!(
        T::is_member(member_id, account_id),
        ERROR_MEMBER_AUTH_FAILED
    );
    Ok(())
}

pub fn ensure_lead_auth_success<T: ActorAuthenticator>(
    account_id: &T::AccountId,
) -> dispatch::Result {
    ensure!(T::is_lead(account_id), ERROR_LEAD_AUTH_FAILED);
    Ok(())
}

pub fn perform_lead_auth<T: ActorAuthenticator>(origin: T::Origin) -> dispatch::Result {
    let account_id = ensure_signed(origin)?;
    ensure_lead_auth_success::<T>(&account_id)
}

/// Authorize curator, performing all checks to ensure curator can act
pub fn perform_curator_in_group_auth<T: Trait>(
    curator_id: &T::CuratorId,
    curator_group_id: &T::CuratorGroupId,
    account_id: &T::AccountId,
) -> dispatch::Result {
    ensure_curator_auth_success::<T>(curator_id, account_id)?;
    Module::<T>::ensure_curator_group_exists(curator_group_id)?;

    let curator_group = Module::<T>::curator_group_by_id(curator_group_id);

    ensure!(curator_group.is_active(), ERROR_CURATOR_IS_NOT_ACTIVE);
    ensure!(
        curator_group.is_curator(curator_id),
        ERROR_CURATOR_IS_NOT_A_MEMBER_OF_A_GIVEN_CURATOR_GROUP
    );
    Ok(())
}

/// A group, that consists of curators set
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct CuratorGroup<T: ActorAuthenticator> {
    /// Curators set, associated with a iven curator group
    curators: BTreeSet<T::CuratorId>,

    /// When `false`, curator in a given group is forbidden to act
    active: bool,
}

impl<T: ActorAuthenticator> Default for CuratorGroup<T> {
    fn default() -> Self {
        Self {
            curators: BTreeSet::new(),
            active: true,
        }
    }
}

impl<T: ActorAuthenticator> CuratorGroup<T> {
    pub fn is_curator(&self, curator_id: &T::CuratorId) -> bool {
        self.curators.contains(curator_id)
    }

    pub fn is_active(&self) -> bool {
        self.active
    }

    pub fn set_status(&mut self, is_active: bool) {
        self.active = is_active
    }

    pub fn get_curators(&self) -> &BTreeSet<T::CuratorId> {
        &self.curators
    }

    pub fn get_curators_mut(&mut self) -> &mut BTreeSet<T::CuratorId> {
        &mut self.curators
    }
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
            entities_created: 0,
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

    pub fn ensure_new_max_entities_count_is_valid<T: Trait>(
        self,
        maximum_entities_count: CreationLimit,
    ) -> dispatch::Result {
        ensure!(
            maximum_entities_count >= self.entities_created,
            ERROR_NEW_ENTITIES_MAX_COUNT_IS_LESS_THAN_NUMBER_OF_ALREADY_CREATED
        );
        Ok(())
    }
}

/// Enum, representing all possible actors
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Eq, PartialEq, Clone, Copy, Debug)]
pub enum Actor<T: Trait> {
    Curator(T::CuratorGroupId, T::CuratorId),
    Member(T::MemberId),
    Lead,
}

impl<T: Trait> Default for Actor<T> {
    fn default() -> Self {
        Self::Lead
    }
}

/// Permissions for an instance of a Class in the versioned store.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct ClassPermissions<T: Trait> {
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
    maintainers: BTreeSet<T::CuratorGroupId>,
}

impl<T: Trait> Default for ClassPermissions<T> {
    fn default() -> Self {
        Self {
            any_member: false,
            entity_creation_blocked: false,
            all_entity_property_values_locked: false,
            maintainers: BTreeSet::new(),
        }
    }
}

impl<T: Trait> ClassPermissions<T> {
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

    pub fn set_any_member_status(&mut self, any_member: bool) {
        self.any_member = any_member;
    }

    pub fn set_maintainers(&mut self, maintainers: BTreeSet<T::CuratorGroupId>) {
        self.maintainers = maintainers
    }

    pub fn get_maintainers(&self) -> &BTreeSet<T::CuratorGroupId> {
        &self.maintainers
    }

    pub fn get_maintainers_mut(&mut self) -> &mut BTreeSet<T::CuratorGroupId> {
        &mut self.maintainers
    }

    pub fn get_any_member_status(&self) -> bool {
        self.any_member
    }

    pub fn ensure_entity_creation_not_blocked(&self) -> dispatch::Result {
        ensure!(self.entity_creation_blocked, ERROR_ENTITY_CREATION_BLOCKED);
        Ok(())
    }

    pub fn ensure_maintainers_limit_not_reached(&self) -> Result<(), &'static str> {
        ensure!(
            self.maintainers.len() < T::NumberOfMaintainersConstraint::get() as usize,
            ERROR_NUMBER_OF_MAINTAINERS_PER_CLASS_LIMIT_REACHED
        );
        Ok(())
    }

    pub fn ensure_maintainer_exists(&self, group_id: &T::CuratorGroupId) -> dispatch::Result {
        ensure!(
            self.maintainers.contains(group_id),
            ERROR_MAINTAINER_DOES_NOT_EXIST
        );
        Ok(())
    }

    pub fn ensure_maintainer_does_not_exist(
        &self,
        group_id: &T::CuratorGroupId,
    ) -> dispatch::Result {
        ensure!(
            !self.maintainers.contains(group_id),
            ERROR_MAINTAINER_ALREADY_EXISTS
        );
        Ok(())
    }

    pub fn is_maintainer(&self, curator_group_id: &T::CuratorGroupId) -> bool {
        self.maintainers.contains(curator_group_id)
    }

    /// Ensure provided actor can create entities of current class
    pub fn ensure_can_create_entities(
        &self,
        account_id: &T::AccountId,
        actor: &Actor<T>,
    ) -> Result<(), &'static str> {
        let can_create = match &actor {
            Actor::Lead => {
                ensure_lead_auth_success::<T>(account_id)?;
                true
            }
            Actor::Member(member_id) if self.any_member => {
                ensure_member_auth_success::<T>(member_id, account_id)?;
                true
            }
            Actor::Curator(curator_group_id, curator_id)
                if self.maintainers.contains(curator_group_id) =>
            {
                perform_curator_in_group_auth::<T>(curator_id, curator_group_id, account_id)?;
                true
            }
            _ => false,
        };
        ensure!(can_create, ERROR_ACTOR_CAN_NOT_CREATE_ENTITIES);
        Ok(())
    }
}

/// Owner of an entity.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Copy, PartialEq, Eq, Debug)]
pub enum EntityController<T: Trait> {
    Maintainers,
    Member(T::MemberId),
    Lead,
}

impl<T: Trait> EntityController<T> {
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

/// Permissions for a given entity.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
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
    pub fn default_with_controller(controller: EntityController<T>) -> Self {
        Self {
            controller,
            ..EntityPermissions::default()
        }
    }

    pub fn set_conroller(&mut self, controller: EntityController<T>) {
        self.controller = controller
    }

    pub fn controller_is_equal_to(&self, entity_controller: &EntityController<T>) -> bool {
        self.controller == *entity_controller
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

    pub fn get_controller(&self) -> &EntityController<T> {
        &self.controller
    }

    pub fn ensure_group_can_remove_entity(access_level: EntityAccessLevel) -> dispatch::Result {
        match access_level {
            EntityAccessLevel::EntityController => Ok(()),
            EntityAccessLevel::EntityControllerAndMaintainer => Ok(()),
            _ => Err(ERROR_ENTITY_REMOVAL_ACCESS_DENIED),
        }
    }
}

/// Type, derived from dispatchable call, identifies the caller
#[derive(Encode, Decode, Eq, PartialEq, Ord, PartialOrd, Clone, Copy, Debug)]
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
    /// Derives the EntityAccessLevel for the actor, attempting to act.
    pub fn derive<T: Trait>(
        account_id: &T::AccountId,
        entity_permissions: &EntityPermissions<T>,
        class_permissions: &ClassPermissions<T>,
        actor: Actor<T>,
    ) -> Result<Self, &'static str> {
        let controller = EntityController::<T>::from_actor(&actor);
        match &actor {
            Actor::Lead if entity_permissions.controller_is_equal_to(&controller) => {
                ensure_lead_auth_success::<T>(account_id).map(|_| Self::EntityController)
            }
            Actor::Member(member_id) if entity_permissions.controller_is_equal_to(&controller) => {
                ensure_member_auth_success::<T>(member_id, account_id)
                    .map(|_| Self::EntityController)
            }
            Actor::Curator(curator_group_id, curator_id) => {
                perform_curator_in_group_auth::<T>(curator_id, curator_group_id, account_id)?;
                match (
                    entity_permissions.controller_is_equal_to(&controller),
                    class_permissions.is_maintainer(curator_group_id),
                ) {
                    (true, true) => Ok(Self::EntityControllerAndMaintainer),
                    (false, true) => Ok(Self::EntityMaintainer),
                    // Curator cannot be controller, but not maintainer simultaneously
                    _ => Err(ERROR_ENTITY_ACCESS_DENIED),
                }
            }
            _ => Err(ERROR_ENTITY_ACCESS_DENIED),
        }
    }
}
