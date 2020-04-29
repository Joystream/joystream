use crate::constraint::*;
use crate::credentials::*;
use codec::{Codec, Decode, Encode};
use core::fmt::Debug;
use runtime_primitives::traits::{MaybeSerializeDeserialize, Member, SimpleArithmetic};
#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};
use srml_support::{dispatch, ensure, Parameter};

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
    fn authenticate_authority(origin: Self::Origin) -> dispatch::Result;

    /// Authenticate account as being given actor in given group.
    fn authenticate_actor_in_group(
        origin: Self::Origin,
        actor_id: Self::ActorId,
        group_id: Self::GroupId,
    ) -> dispatch::Result;
}

/// Identifier for a given actor in a given group.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct ActorInGroupId<T: ActorAuthenticator> {
    pub actor_id: T::ActorId,
    pub group_id: T::GroupId,
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
    Individual(u64),
}

/// A voucher for entity creation
#[derive(Encode, Decode, PartialEq, Default)]
pub struct EntityCreationVoucher {
    /// How many are allowed in total
    pub maximum_entities_count: u64,

    /// How many have currently been created
    pub entities_created: u64,
}

impl EntityCreationVoucher {
    pub fn new(maximum_entities_count: u64) -> Self {
        Self {
            maximum_entities_count,
            entities_created: 1,
        }
    }

    pub fn set_maximum_entities_count(&mut self, maximum_entities_count: u64) {
        self.maximum_entities_count = maximum_entities_count
    }

    pub fn increment_created_entities_count(&mut self) {
        self.entities_created += 1;
    }

    pub fn limit_not_reached(&self) -> bool {
        self.entities_created < self.maximum_entities_count
    }
}

/// Who will be set as the controller for any newly created entity in a given class.
#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
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
#[derive(Encode, Decode, Default, Eq, PartialEq, Clone, Debug)]
pub struct ClassPermissions<ClassId, Credential, PropertyIndex, BlockNumber>
where
    ClassId: Ord,
    Credential: Ord + Clone,
    PropertyIndex: Ord,
{
    // concrete permissions
    /// Permissions that are applied to entities of this class, define who in addition to
    /// root origin can update entities of this class.
    pub entity_permissions: EntityPermissions<Credential>,

    /// Whether to prevent everyone from creating an entity.
    ///
    /// This could be useful in order to quickly, and possibly temporarily, block new entity creation, without
    /// having to tear down `can_create_entities`.
    pub entity_creation_blocked: bool,

    /// Policy for how to set the controller of a created entity.
    ///
    /// Example(s)
    /// - For a group that represents something like all possible publishers, then `InitialControllerPolicy::ActorInGroup` makes sense.
    /// - For a group that represents some stable set of curators, then `InitialControllerPolicy::Group` makes sense.
    pub initial_controller_of_created_entities: InitialControllerPolicy,

    /// Whether to prevent everyone from updating entity properties.
    ///
    /// This could be useful in order to quickly, and probably temporarily, block any editing of entities,
    /// rather than for example having to set, and later clear, `EntityPermission::frozen_for_controller`
    /// for a large number of entities.
    pub all_entity_property_values_locked: bool,

    /// Who can add new schemas in the versioned store for this class
    pub add_schemas: CredentialSet<Credential>,

    /// Who can activate/deactivate already existing schemas for this class
    pub update_schemas_status: CredentialSet<Credential>,

    /// Who can create new entities in the versioned store of this class
    pub create_entities: CredentialSet<Credential>,

    /// Who can remove entities from the versioned store of this class
    pub remove_entities: CredentialSet<Credential>,

    /// The type of constraint on referencing the class from other entities.
    pub reference_constraint: ReferenceConstraint<ClassId, PropertyIndex>,

    /// Who (in addition to root origin) can update all concrete permissions.
    /// The admins can only be set by the root origin, "System".
    pub admins: CredentialSet<Credential>,

    // Block where permissions were changed
    pub last_permissions_update: BlockNumber,

    /// The maximum number of entities which can be created.
    pub maximum_entities_count: u64,

    /// The current number of entities which exist.
    pub current_number_of_entities: u64,

    /// How many entities a given controller may create at most.
    pub per_controller_entity_creation_limit: u64,
}

impl<ClassId, Credential, PropertyIndex, BlockNumber>
    ClassPermissions<ClassId, Credential, PropertyIndex, BlockNumber>
where
    ClassId: Ord,
    Credential: Ord + Clone,
    PropertyIndex: Ord,
{
    /// Returns Ok if access_level is root origin or credential is in admins set, Err otherwise
    pub fn is_admin(
        class_permissions: &Self,
        access_level: &AccessLevel<Credential>,
    ) -> dispatch::Result {
        match access_level {
            AccessLevel::System => Ok(()),
            AccessLevel::Credential(credential) => {
                if class_permissions.admins.contains(credential) {
                    Ok(())
                } else {
                    Err("NotInAdminsSet")
                }
            }
            AccessLevel::Unspecified => Err("UnspecifiedActor"),
            AccessLevel::EntityMaintainer => Err("AccessLevel::EntityMaintainer-UsedOutOfPlace"),
        }
    }

    pub fn can_add_class_schema(
        class_permissions: &Self,
        access_level: &AccessLevel<Credential>,
    ) -> dispatch::Result {
        match access_level {
            AccessLevel::System => Ok(()),
            AccessLevel::Credential(credential) => {
                ensure!(
                    class_permissions.add_schemas.contains(credential),
                    "NotInAddSchemasSet"
                );
                Ok(())
            }
            AccessLevel::Unspecified => Err("UnspecifiedActor"),
            AccessLevel::EntityMaintainer => Err("AccessLevel::EntityMaintainer-UsedOutOfPlace"),
        }
    }

    pub fn can_update_schema_status(
        class_permissions: &Self,

        access_level: &AccessLevel<Credential>,
    ) -> dispatch::Result {
        match access_level {
            AccessLevel::System => Ok(()),
            AccessLevel::Credential(credential) => {
                ensure!(
                    class_permissions.update_schemas_status.contains(credential),
                    "NotInUpdateSchemasStatusSet"
                );
                Ok(())
            }
            AccessLevel::Unspecified => Err("UnspecifiedActor"),
            AccessLevel::EntityMaintainer => Err("AccessLevel::EntityMaintainer-UsedOutOfPlace"),
        }
    }

    pub fn can_create_entity(
        class_permissions: &Self,
        access_level: &AccessLevel<Credential>,
    ) -> dispatch::Result {
        match access_level {
            AccessLevel::System => Ok(()),
            AccessLevel::Credential(credential) => {
                if !class_permissions.entity_creation_blocked {
                    Err("EntitiesCannotBeCreated")
                } else if class_permissions.create_entities.contains(credential) {
                    Ok(())
                } else {
                    Err("NotInCreateEntitiesSet")
                }
            }
            AccessLevel::Unspecified => Err("UnspecifiedActor"),
            AccessLevel::EntityMaintainer => Err("AccessLevel::EntityMaintainer-UsedOutOfPlace"),
        }
    }

    pub fn can_remove_entity(
        class_permissions: &Self,
        access_level: &AccessLevel<Credential>,
    ) -> dispatch::Result {
        match access_level {
            AccessLevel::System => Ok(()),
            AccessLevel::Credential(credential) => {
                ensure!(
                    class_permissions.remove_entities.contains(credential),
                    "NotInRemoveEntitiesSet"
                );
                Ok(())
            }
            AccessLevel::Unspecified => Err("UnspecifiedActor"),
            AccessLevel::EntityMaintainer => Err("AccessLevel::EntityMaintainer-UsedOutOfPlace"),
        }
    }

    pub fn can_update_entity(
        class_permissions: &Self,
        access_level: &AccessLevel<Credential>,
    ) -> dispatch::Result {
        match access_level {
            AccessLevel::System => Ok(()),
            AccessLevel::Credential(credential) => {
                if class_permissions
                    .entity_permissions
                    .update
                    .contains(credential)
                {
                    Ok(())
                } else {
                    Err("CredentialNotInEntityPermissionsUpdateSet")
                }
            }
            AccessLevel::EntityMaintainer => {
                if class_permissions
                    .entity_permissions
                    .maintainer_has_all_permissions
                {
                    Ok(())
                } else {
                    Err("MaintainerNotGivenAllPermissions")
                }
            }
            _ => Err("UnknownActor"),
        }
    }
}

/// Owner of an entity.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum EntityController<T: ActorAuthenticator> {
    Group(T::GroupId),
    ActorInGroup(ActorInGroupId<T>),
}

impl<T: ActorAuthenticator> EntityController<T> {
    pub fn from_group(group_id: T::GroupId) -> Self {
        Self::Group(group_id)
    }

    pub fn from_actor_in_group(actor_id: T::ActorId, group_id: T::GroupId) -> Self {
        Self::ActorInGroup(ActorInGroupId::from(actor_id, group_id))
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
pub struct EntityPermission<T: ActorAuthenticator> {
    /// Current controller, which is initially set based on who created entity and
    /// `ClassPermission::initial_controller_of_created_entities` for corresponding class permission instance, but it can later be updated.
    pub controller: EntityController<T>,

    /// Controller is currently unable to mutate any property value.
    /// Can be useful to use in concert with some curation censorship policy
    pub frozen_for_controller: bool,

    /// Prevent from being referenced by any entity (including self-references).
    /// Can be useful to use in concert with some curation censorship policy,
    /// e.g. to block content from being included in some public playlist.
    pub referenceable: bool,
}

impl<T: ActorAuthenticator> EntityPermission<T> {
    pub fn set_conroller(&mut self, controller: EntityController<T>) {
        self.controller = controller
    }

    pub fn set_frozen_for_controller(&mut self, frozen_for_controller: bool) {
        self.frozen_for_controller = frozen_for_controller
    }

    pub fn get_controller(&self) -> &EntityController<T> {
        &self.controller
    }
}

impl<T: ActorAuthenticator> Default for EntityPermission<T> {
    fn default() -> Self {
        Self {
            controller: EntityController::<T>::default(),
            frozen_for_controller: false,
            referenceable: false,
        }
    }
}

//#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Debug, Eq, PartialEq)]
pub struct EntityPermissions<Credential>
where
    Credential: Ord,
{
    // Principals permitted to update any entity of the class which this permission is associated with.
    pub update: CredentialSet<Credential>,
    /// Wether the designated maintainer (if set) of an entity has permission to update it.
    pub maintainer_has_all_permissions: bool,
}

impl<Credential: Ord> Default for EntityPermissions<Credential> {
    fn default() -> Self {
        EntityPermissions {
            maintainer_has_all_permissions: true,
            update: CredentialSet::new(),
        }
    }
}
