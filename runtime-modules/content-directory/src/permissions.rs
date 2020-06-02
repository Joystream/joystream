use crate::errors::*;
use crate::*;
use codec::{Codec, Decode, Encode};
use core::fmt::Debug;
use runtime_primitives::traits::{MaybeSerializeDeserialize, Member, SimpleArithmetic};

#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};
use srml_support::{dispatch, ensure, Parameter};

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
        + One
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

/// Ensure given `Origin` is lead
pub fn ensure_is_lead<T: ActorAuthenticator>(origin: T::Origin) -> dispatch::Result {
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

    let curator_group = Module::<T>::ensure_curator_group_existss(curator_group_id)?;

    ensure!(curator_group.is_active(), ERROR_CURATOR_GROUP_IS_NOT_ACTIVE);
    CuratorGroup::<T>::ensure_curator_in_group_exists(&curator_group, curator_id)?;
    Ok(())
}

/// A group, that consists of `curators` set
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct CuratorGroup<T: Trait> {
    /// Curators set, associated with a iven curator group
    curators: BTreeSet<T::CuratorId>,

    /// When `false`, curator in a given group is forbidden to act
    active: bool,

    /// Used to count the number of `Class`(es), given curator group maintains
    classes_under_maintenance: ReferenceCounter,
}

impl<T: Trait> Default for CuratorGroup<T> {
    fn default() -> Self {
        Self {
            curators: BTreeSet::new(),
            // default curator group status right after creation
            active: false,
            classes_under_maintenance: 0,
        }
    }
}

impl<T: Trait> CuratorGroup<T> {
    /// Check if `CuratorGroup` contains curator under given `curator_id`
    pub fn is_curator(&self, curator_id: &T::CuratorId) -> bool {
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

    /// Retrieve set of all curator_ids related to `CuratorGroup` by reference
    pub fn get_curators(&self) -> &BTreeSet<T::CuratorId> {
        &self.curators
    }

    /// Retrieve set of all curator_ids related to `CuratorGroup` by mutable  reference
    pub fn get_curators_mut(&mut self) -> &mut BTreeSet<T::CuratorId> {
        &mut self.curators
    }

    /// Increment number of classes `CuratorGroup` maintains
    pub fn increment_classes_under_maintenance_count(&mut self) {
        self.classes_under_maintenance += 1;
    }

    /// Decrement number of classes `CuratorGroup` maintains
    pub fn decrement_classes_under_maintenance_count(&mut self) {
        self.classes_under_maintenance -= 1;
    }

    /// Ensure curator group does not maintain any class
    pub fn ensure_curator_is_not_a_maintainer(&self) -> dispatch::Result {
        ensure!(
            self.classes_under_maintenance == 0,
            ERROR_CURATOR_GROUP_REMOVAL_FORBIDDEN
        );
        Ok(())
    }

    /// Ensure `MaxNumberOfCuratorsPerGroup` constraint satisfied
    pub fn ensure_max_number_of_curators_limit_not_reached(&self) -> dispatch::Result {
        ensure!(
            self.curators.len() < T::MaxNumberOfCuratorsPerGroup::get() as usize,
            ERROR_NUMBER_OF_CURATORS_PER_GROUP_LIMIT_REACHED
        );
        Ok(())
    }

    /// Ensure curator under given `curator_id` exists in `CuratorGroup`
    pub fn ensure_curator_in_group_exists(&self, curator_id: &T::CuratorId) -> dispatch::Result {
        ensure!(
            self.get_curators().contains(curator_id),
            ERROR_CURATOR_IS_NOT_A_MEMBER_OF_A_GIVEN_CURATOR_GROUP
        );
        Ok(())
    }
}

/// A voucher for `Entity` creation
#[derive(Encode, Decode, Clone, Copy, Debug, PartialEq, Eq)]
pub struct EntityCreationVoucher<T: Trait> {
    /// How many are allowed in total
    pub maximum_entities_count: T::EntityId,

    /// How many have currently been created
    pub entities_created: T::EntityId,
}

impl<T: Trait> Default for EntityCreationVoucher<T> {
    fn default() -> Self {
        Self {
            maximum_entities_count: T::EntityId::zero(),
            entities_created: T::EntityId::zero(),
        }
    }
}

impl<T: Trait> EntityCreationVoucher<T> {
    /// Create a new instance of `EntityCreationVoucher` with specified limit
    pub fn new(maximum_entities_count: T::EntityId) -> Self {
        Self {
            maximum_entities_count,
            entities_created: T::EntityId::zero(),
        }
    }

    /// Set new `maximum_entities_count` limit
    pub fn set_maximum_entities_count(&mut self, maximum_entities_count: T::EntityId) {
        self.maximum_entities_count = maximum_entities_count
    }

    /// Increase `entities_created` by 1
    pub fn increment_created_entities_count(&mut self) {
        self.entities_created += T::EntityId::one();
    }

    /// Decrease `entities_created` by 1
    pub fn decrement_created_entities_count(&mut self) {
        self.entities_created -= T::EntityId::one();
    }

    /// Check if `entities_created` is less than `maximum_entities_count` limit set to this `EntityCreationVoucher`
    pub fn limit_not_reached(&self) -> bool {
        self.entities_created < self.maximum_entities_count
    }

    /// Ensure new voucher`s max entities count is less than number of already created entities in this `EntityCreationVoucher`
    pub fn ensure_new_max_entities_count_is_valid(
        self,
        maximum_entities_count: T::EntityId,
    ) -> dispatch::Result {
        ensure!(
            maximum_entities_count >= self.entities_created,
            ERROR_NEW_ENTITIES_MAX_COUNT_IS_LESS_THAN_NUMBER_OF_ALREADY_CREATED
        );
        Ok(())
    }

    /// Ensure voucher limit not reached
    pub fn ensure_voucher_limit_not_reached(&self) -> dispatch::Result {
        ensure!(self.limit_not_reached(), ERROR_VOUCHER_LIMIT_REACHED);
        Ok(())
    }
}

/// Enum, representing all possible `Actor`s
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

/// Permissions for an instance of a `Class` in the versioned store.
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
    /// Retieve `all_entity_property_values_locked` status
    pub fn all_entity_property_values_locked(&self) -> bool {
        self.all_entity_property_values_locked
    }

    /// Retieve `any_member` status
    pub fn any_member_status(&self) -> bool {
        self.any_member
    }

    /// Check if given `curator_group_id` is maintainer of current `Class`
    pub fn is_maintainer(&self, curator_group_id: &T::CuratorGroupId) -> bool {
        self.maintainers.contains(curator_group_id)
    }

    /// Get `Class` maintainers by reference
    pub fn get_maintainers(&self) -> &BTreeSet<T::CuratorGroupId> {
        &self.maintainers
    }

    /// Get `Class` maintainers by mutable reference
    pub fn get_maintainers_mut(&mut self) -> &mut BTreeSet<T::CuratorGroupId> {
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
    pub fn set_maintainers(&mut self, maintainers: BTreeSet<T::CuratorGroupId>) {
        self.maintainers = maintainers
    }

    /// Ensure provided actor can create entities of current `Class`
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

    /// Ensure entities creation is not blocked on `Class` level
    pub fn ensure_entity_creation_not_blocked(&self) -> dispatch::Result {
        ensure!(!self.entity_creation_blocked, ERROR_ENTITY_CREATION_BLOCKED);
        Ok(())
    }

    /// Ensure maintainer, associated with given `group_id` is already added to `maintainers` set
    pub fn ensure_maintainer_exists(&self, group_id: &T::CuratorGroupId) -> dispatch::Result {
        ensure!(
            self.maintainers.contains(group_id),
            ERROR_MAINTAINER_DOES_NOT_EXIST
        );
        Ok(())
    }

    /// Ensure maintainer, associated with given `group_id` is not yet added to `maintainers` set
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
}

/// Owner of an `Entity`.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Copy, PartialEq, Eq, Debug)]
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

    /// Check if inner `controller` is equal to provided one
    pub fn controller_is_equal_to(&self, entity_controller: &EntityController<T>) -> bool {
        self.controller == *entity_controller
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
    /// Derives the `EntityAccessLevel` for the actor, attempting to act.
    pub fn derive<T: Trait>(
        account_id: &T::AccountId,
        entity_permissions: &EntityPermissions<T>,
        class_permissions: &ClassPermissions<T>,
        actor: &Actor<T>,
    ) -> Result<Self, &'static str> {
        let controller = EntityController::<T>::from_actor(actor);
        match actor {
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
