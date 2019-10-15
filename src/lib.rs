// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;

use codec::{Codec, Decode, Encode};
use rstd::collections::btree_set::BTreeSet;
use runtime_primitives::traits::{MaybeSerializeDebug, Member, SimpleArithmetic};
use srml_support::{decl_module, decl_storage, dispatch, ensure, Parameter, StorageMap};
use system;

// EntityId, ClassId -> should be configured on versioned_store::Trait
pub use versioned_store::{ClassId, ClassPropertyValue, EntityId, Property, PropertyValue};
pub type PropertyIndex = u16; // should really be configured on versioned_store::Trait

pub mod mock;
mod tests;

#[derive(Encode, Decode, Eq, PartialEq, Ord, PartialOrd, Clone, Debug)]
pub struct PropertyOfClass<ClassId, PropertyIndex> {
    class_id: ClassId,
    property_index: PropertyIndex,
}

/// Trait that provides an abstraction for the concept of group membership and a way
/// to check the inclusion of an account id in a specific group. Groups are identified by the
/// type GroupId.
pub trait GroupMembershipChecker<T: Trait> {
    fn account_is_in_group(account: &T::AccountId, group: T::GroupId) -> bool;
}

/// An implementation that disables group membership feature.
impl<T: Trait> GroupMembershipChecker<T> for () {
    fn account_is_in_group(_account: &T::AccountId, _group: T::GroupId) -> bool {
        false
    }
}

/// An implementation that calls into multiple checkers. This allows for multiple modules
/// to support group membership concept.
impl<T: Trait, X: GroupMembershipChecker<T>, Y: GroupMembershipChecker<T>> GroupMembershipChecker<T>
    for (X, Y)
{
    fn account_is_in_group(account: &T::AccountId, group: T::GroupId) -> bool {
        X::account_is_in_group(account, group) || Y::account_is_in_group(account, group)
    }
}

/// Trait for externally checking if an account can create new classes in the versioned store.
pub trait CreateClassPermissionsChecker<T: Trait> {
    fn account_can_create_class_permissions(account: &T::AccountId) -> bool;
}

/// An implementation that only permits system to create classes.
impl<T: Trait> CreateClassPermissionsChecker<T> for () {
    fn account_can_create_class_permissions(_account: &T::AccountId) -> bool {
        false
    }
}

/// Identifies a princial to whom a permission can be assigned on Classes.
#[derive(Encode, Decode, Eq, PartialEq, Ord, PartialOrd, Clone, Debug)]
pub enum BasePrincipal<AccountId, GroupId> {
    Account(AccountId),
    GroupMember(GroupId),
}

/// Identifies a principal to whom a permission can be assigned on Entities.
#[derive(Encode, Decode, Eq, PartialEq, Ord, PartialOrd, Clone, Debug)]
pub enum EntityPrincipal<AccountId, GroupId> {
    Base(BasePrincipal<AccountId, GroupId>),
    Owner,
}

/// Internal type, derived from dispatchable call, identifies the caller
#[derive(Encode, Decode, Eq, PartialEq, Ord, PartialOrd, Clone, Debug)]
enum DerivedPrincipal<AccountId, GroupId> {
    /// ROOT origin
    System,
    /// Caller correctly identified as entity owner
    EntityOwner,
    /// Plain signed origin, or additionally identified as beloging to specific group
    Base(BasePrincipal<AccountId, GroupId>),
}

/// The type of constraint on what entities can reference instances of a class through an Internal property type.
#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub enum ReferenceConstraint<ClassId: Ord, PropertyIndex: Ord> {
    /// No Entity can reference the class.
    NoReferencingAllowed,

    /// Any entity may reference the class.
    NoConstraint,

    /// Only a set of entities of type ClassId and from the specified property index can reference the class.
    Restricted(BTreeSet<PropertyOfClass<ClassId, PropertyIndex>>),
}

impl<ClassId: Ord, PropertyIndex: Ord> Default for ReferenceConstraint<ClassId, PropertyIndex> {
    fn default() -> Self {
        ReferenceConstraint::NoReferencingAllowed
    }
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct BasePrincipalSet<AccountId, GroupId>(BTreeSet<BasePrincipal<AccountId, GroupId>>);

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct EntityPrincipalSet<AccountId, GroupId>(BTreeSet<EntityPrincipal<AccountId, GroupId>>);

impl<AccountId: Ord, GroupId: Ord> Default for BasePrincipalSet<AccountId, GroupId> {
    fn default() -> Self {
        BasePrincipalSet(BTreeSet::new())
    }
}

impl<AccountId: Ord, GroupId: Ord> Default for EntityPrincipalSet<AccountId, GroupId> {
    /// Default set gives entity owner permissions on the entity
    fn default() -> Self {
        let mut owner = BTreeSet::new();
        owner.insert(EntityPrincipal::Owner);
        EntityPrincipalSet(owner)
    }
}

/// Permissions for an instance of a Class in the versioned store.
#[derive(Encode, Decode, Default, Eq, PartialEq, Clone, Debug)]
pub struct ClassPermissions<ClassId, AccountId, GroupId, PropertyIndex, BlockNumber>
where
    ClassId: Ord,
    AccountId: Ord + Clone,
    GroupId: Ord + Clone,
    PropertyIndex: Ord,
{
    // concrete permissions
    /// Permissions that are applied to entities of this class, defines who in addition to
    /// root origin can update and delete entities of this class.
    entity_permissions: EntityPermissions<AccountId, GroupId>,

    /// Wether new entities of this class be created or not. Is not enforced for root origin.
    entities_can_be_created: bool,

    /// Who can add new schemas in the versioned store for this class
    add_schemas: BasePrincipalSet<AccountId, GroupId>,

    /// Who can create new entities in the versioned store of this class
    create_entities: BasePrincipalSet<AccountId, GroupId>,

    /// The type of constraint on referencing the class from other entities.
    reference_constraint: ReferenceConstraint<ClassId, PropertyIndex>,

    /// Who (in addition to root origin) can update all concrete permissions.
    /// The admins can only be set by the root origin, "System".
    admins: BasePrincipalSet<AccountId, GroupId>,

    // Block where permissions were changed
    last_permissions_update: BlockNumber,
}

pub type ClassPermissionsType<T> = ClassPermissions<
    ClassId,
    <T as system::Trait>::AccountId,
    <T as Trait>::GroupId,
    PropertyIndex,
    <T as system::Trait>::BlockNumber,
>;

impl<ClassId, AccountId, GroupId, PropertyIndex, BlockNumber>
    ClassPermissions<ClassId, AccountId, GroupId, PropertyIndex, BlockNumber>
where
    ClassId: Ord,
    AccountId: Ord + Clone,
    GroupId: Ord + Clone,
    PropertyIndex: Ord,
{
    /// Returns true if principal is root origin or base_principal is in admins acl group
    fn is_admin(
        class_permissions: &Self,
        derived_principal: &DerivedPrincipal<AccountId, GroupId>,
    ) -> bool {
        match derived_principal {
            DerivedPrincipal::System => true,
            DerivedPrincipal::Base(base_principal) => {
                class_permissions.admins.0.contains(base_principal)
            }
            _ => false,
        }
    }

    fn can_add_schema(
        class_permissions: &Self,
        derived_principal: &DerivedPrincipal<AccountId, GroupId>,
    ) -> bool {
        match derived_principal {
            DerivedPrincipal::System => true,
            DerivedPrincipal::Base(base_principal) => {
                class_permissions.add_schemas.0.contains(base_principal)
            }
            _ => false,
        }
    }

    fn can_create_entity(
        class_permissions: &Self,
        derived_principal: &DerivedPrincipal<AccountId, GroupId>,
    ) -> bool {
        match derived_principal {
            DerivedPrincipal::System => true,
            DerivedPrincipal::Base(base_principal) => {
                class_permissions.entities_can_be_created
                    && class_permissions.create_entities.0.contains(base_principal)
            }
            _ => false,
        }
    }

    fn can_update_entity(
        class_permissions: &Self,
        derived_principal: &DerivedPrincipal<AccountId, GroupId>,
    ) -> bool {
        match derived_principal {
            DerivedPrincipal::System => true,
            DerivedPrincipal::Base(base_principal) => class_permissions
                .entity_permissions
                .update
                .0
                .contains(&EntityPrincipal::Base(base_principal.clone())),
            DerivedPrincipal::EntityOwner => class_permissions
                .entity_permissions
                .update
                .0
                .contains(&EntityPrincipal::Owner),
        }
    }
}

#[derive(Encode, Decode, Clone, Debug, Default, Eq, PartialEq)]
pub struct EntityPermissions<AccountId, GroupId>
where
    AccountId: Ord,
    GroupId: Ord,
{
    update: EntityPrincipalSet<AccountId, GroupId>,
    delete: EntityPrincipalSet<AccountId, GroupId>,
}

pub trait Trait: system::Trait + versioned_store::Trait {
    // type Event: ...
    // Do we need Events?

    type GroupId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + Clone
        + MaybeSerializeDebug
        + Eq
        + PartialEq
        + Ord;

    /// External type used to check if an account is part of a specific group.
    type GroupMembershipChecker: GroupMembershipChecker<Self>;

    /// External type used to check if an account id has permission to create new class permissions.
    type CreateClassPermissionsChecker: CreateClassPermissionsChecker<Self>;
}

decl_storage! {
    trait Store for Module<T: Trait> as VersionedStorePermissions {
      /// ClassPermissions of corresponding Classes in the versioned store
      pub ClassPermissionsByClassId get(class_permissions_by_class_id): linked_map ClassId => ClassPermissionsType<T>;

      /// Owner of an entity in the versioned store. If it is None then it is owned by the system.
      pub EntityOwnerByEntityId get(entity_owner_by_entity_id): linked_map EntityId => Option<BasePrincipal<T::AccountId, T::GroupId>>;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        /// Sets the admins for a class
        fn set_class_admins(
            origin,
            class_id: ClassId,
            admins: BasePrincipalSet<T::AccountId, T::GroupId>
        ) -> dispatch::Result {
            Self::mutate_class_permissions(
                origin,
                None,
                Self::is_system_principal, // root origin
                class_id,
                |class_permissions| {
                    class_permissions.admins = admins;
                }
            )
        }

        // Methods for updating concrete permissions

        fn set_class_entity_permissions(
            origin,
            claimed_group_id: Option<T::GroupId>,
            class_id: ClassId,
            entity_permissions: EntityPermissions<T::AccountId, T::GroupId>
        ) -> dispatch::Result {
            Self::mutate_class_permissions(
                origin,
                claimed_group_id,
                ClassPermissions::is_admin,
                class_id,
                |class_permissions| {
                    class_permissions.entity_permissions = entity_permissions;
                }
            )
        }

        fn set_class_entities_can_be_created(
            origin,
            claimed_group_id: Option<T::GroupId>,
            class_id: ClassId,
            can_be_created: bool
        ) -> dispatch::Result {
            Self::mutate_class_permissions(
                origin,
                claimed_group_id,
                ClassPermissions::is_admin,
                class_id,
                |class_permissions| {
                    class_permissions.entities_can_be_created = can_be_created;
                }
            )
        }

        fn set_class_add_schemas_acl(
            origin,
            claimed_group_id: Option<T::GroupId>,
            class_id: ClassId,
            acl: BasePrincipalSet<T::AccountId, T::GroupId>
        ) -> dispatch::Result {
            Self::mutate_class_permissions(
                origin,
                claimed_group_id,
                ClassPermissions::is_admin,
                class_id,
                |class_permissions| {
                    class_permissions.add_schemas = acl;
                }
            )
        }

        fn set_class_create_entities_acl(
            origin,
            claimed_group_id: Option<T::GroupId>,
            class_id: ClassId,
            acl: BasePrincipalSet<T::AccountId, T::GroupId>
        ) -> dispatch::Result {
            Self::mutate_class_permissions(
                origin,
                claimed_group_id,
                ClassPermissions::is_admin,
                class_id,
                |class_permissions| {
                    class_permissions.create_entities = acl;
                }
            )
        }

        fn set_class_reference_constraint(
            origin,
            claimed_group_id: Option<T::GroupId>,
            class_id: ClassId,
            constraint: ReferenceConstraint<ClassId, PropertyIndex>
        ) -> dispatch::Result {
            Self::mutate_class_permissions(
                origin,
                claimed_group_id,
                ClassPermissions::is_admin,
                class_id,
                |class_permissions| {
                    class_permissions.reference_constraint = constraint;
                }
            )
        }

        // Permissioned proxy calls to versioned store

        pub fn create_class(
            origin,
            name: Vec<u8>,
            description: Vec<u8>,
            class_permissions: ClassPermissionsType<T>
        ) -> dispatch::Result {

            let can_create_class = match origin.into() {
                Ok(system::RawOrigin::Root) => true,
                Ok(system::RawOrigin::Signed(sender)) => {
                    T::CreateClassPermissionsChecker::account_can_create_class_permissions(&sender)
                },
                _ => false
            };

            if can_create_class {
                let class_id = <versioned_store::Module<T>>::create_class(name, description)?;

                // is there a need to assert class_id is unique?

                <ClassPermissionsByClassId<T>>::insert(&class_id, class_permissions);

                Ok(())
            } else {
                Err("NotPermittedToCreateClass")
            }
        }

        pub fn create_class_with_default_permissions(
            origin,
            name: Vec<u8>,
            description: Vec<u8>
        ) -> dispatch::Result {
            Self::create_class(origin, name, description, ClassPermissions::default())
        }

        pub fn add_class_schema(
            origin,
            claimed_group_id: Option<T::GroupId>,
            class_id: ClassId,
            existing_properties: Vec<PropertyIndex>,
            new_properties: Vec<Property>
        ) -> dispatch::Result {
            Self::if_class_permissions_satisfied(
                origin,
                claimed_group_id,
                None,
                ClassPermissions::can_add_schema,
                class_id,
                |_class_permissions, _principal| {
                    // If a new property points at another class,
                    // at this point we don't enforce anything about reference constraints
                    // because of the chicken and egg problem. Instead enforcement is done
                    // at the time of creating an entity.
                    let _schema_index = <versioned_store::Module<T>>::add_class_schema(class_id, existing_properties, new_properties)?;
                    Ok(())
                }
            )
        }

        pub fn create_entity(
            origin,
            claimed_group_id: Option<T::GroupId>,
            class_id: ClassId
            //, owner: BasePrincipal<T::AccountId, T::GroupId>
        ) -> dispatch::Result {
            Self::if_class_permissions_satisfied(
                origin,
                claimed_group_id,
                None,
                ClassPermissions::can_create_entity,
                class_id,
                |_class_permissions, principal| {
                    let entity_id = <versioned_store::Module<T>>::create_entity(class_id)?;
                    // let owner = match principal {
                    //     DerivedPrincipal::System => None,
                    //     DerivedPrincipal::Base(base_principal) => Some(*base_principal),
                    //     _ => None
                    // };
                    // <EntityOwnerByEntityId<T>>::insert(entity_id, Some(owner));

                    // Does mutate on non-existent value work as expected?
                    <EntityOwnerByEntityId<T>>::mutate(entity_id, |owner| {
                        match principal {
                            DerivedPrincipal::System => *owner = None,
                            DerivedPrincipal::Base(base_principal) => *owner = Some(base_principal.clone()),
                            _ => *owner = None
                        }
                    });
                    Ok(())
                }
            )
        }

        pub fn add_schema_support_to_entity(
            origin,
            claimed_group_id: Option<T::GroupId>,
            as_entity_owner: bool,
            entity_id: EntityId,
            schema_id: u16,
            property_values: Vec<ClassPropertyValue>
        ) -> dispatch::Result {
            // class id of the entity being updated
            let class_id = Self::get_class_id_by_entity_id(&entity_id)?;

            Self::ensure_internal_property_values_permitted(class_id, &property_values)?;

            let as_entity_owner = if as_entity_owner {
                Some(entity_id)
            } else {
                None
            };

            Self::if_class_permissions_satisfied(
                origin,
                claimed_group_id,
                as_entity_owner,
                ClassPermissions::can_update_entity,
                class_id,
                |_class_permissions, _principal| {
                    <versioned_store::Module<T>>::add_schema_support_to_entity(entity_id, schema_id, property_values)
                }
            )
        }

        pub fn update_entity_property_values(
            origin,
            claimed_group_id: Option<T::GroupId>,
            as_entity_owner: bool,
            entity_id: EntityId,
            property_values: Vec<ClassPropertyValue>
        ) -> dispatch::Result {
            let class_id = Self::get_class_id_by_entity_id(&entity_id)?;

            Self::ensure_internal_property_values_permitted(class_id, &property_values)?;

            let as_entity_owner = if as_entity_owner {
                Some(entity_id)
            } else {
                None
            };

            Self::if_class_permissions_satisfied(
                origin,
                claimed_group_id,
                as_entity_owner,
                ClassPermissions::can_update_entity,
                class_id,
                |_class_permissions, _principal| {
                    <versioned_store::Module<T>>::update_entity_property_values(entity_id, property_values)
                }
            )
        }
    }
}

impl<T: Trait> Module<T> {
    /// Attempts to derive the principal a caller is claiming.
    /// It expects only signed or root origin.
    fn derive_principal(
        origin: T::Origin,
        claimed_group_id: Option<T::GroupId>,
        as_entity_owner: Option<EntityId>,
    ) -> Result<DerivedPrincipal<T::AccountId, T::GroupId>, &'static str> {
        match origin.into() {
            Ok(system::RawOrigin::Root) => Ok(DerivedPrincipal::System),
            Ok(system::RawOrigin::Signed(account_id)) => {
                if let Some(group_id) = claimed_group_id {
                    if T::GroupMembershipChecker::account_is_in_group(&account_id, group_id) {
                        if let Some(entity_id) = as_entity_owner {
                            // ensure entity owner is GroupMember
                            ensure!(
                                <EntityOwnerByEntityId<T>>::exists(entity_id),
                                "InvalidEntityId"
                            );
                            match Self::entity_owner_by_entity_id(entity_id) {
                                Some(BasePrincipal::GroupMember(owner_group_id))
                                    if group_id == owner_group_id =>
                                {
                                    Ok(DerivedPrincipal::EntityOwner)
                                }
                                _ => Err("NotEnityOwner"),
                            }
                        } else {
                            Ok(DerivedPrincipal::Base(BasePrincipal::GroupMember(group_id)))
                        }
                    } else {
                        Err("OriginNotMemberOfClaimedGroup")
                    }
                } else {
                    if let Some(entity_id) = as_entity_owner {
                        // ensure entity owner is Account
                        ensure!(
                            <EntityOwnerByEntityId<T>>::exists(entity_id),
                            "InvalidEntityId"
                        );
                        match Self::entity_owner_by_entity_id(entity_id) {
                            Some(BasePrincipal::Account(ref owner_account_id))
                                if account_id == *owner_account_id =>
                            {
                                Ok(DerivedPrincipal::EntityOwner)
                            }
                            _ => Err("NotEnityOwner"),
                        }
                    } else {
                        Ok(DerivedPrincipal::Base(BasePrincipal::Account(account_id)))
                    }
                }
            }
            _ => Err("BadOrigin:ExpectedRootOrSigned"),
        }
    }

    /// Returns the stored class permissions if exist, error otherwise.
    fn ensure_class_permissions(
        class_id: ClassId,
    ) -> Result<ClassPermissionsType<T>, &'static str> {
        ensure!(
            <ClassPermissionsByClassId<T>>::exists(class_id),
            "ClassIdDoesNotExist"
        );
        Ok(Self::class_permissions_by_class_id(class_id))
    }

    /// Constructs a derived principal from the origin and claimed group id.
    /// The supplied predicate, is used to check if permission is granted to perform a mutation.
    fn mutate_class_permissions<Predicate, Mutate>(
        origin: T::Origin,
        claimed_group_id: Option<T::GroupId>,
        // predicate to test when origin is not root.
        predicate: Predicate,
        // class permissions to perform mutation on if it exists
        class_id: ClassId,
        // actual mutation to apply.
        mutate: Mutate,
    ) -> dispatch::Result
    where
        Predicate:
            FnOnce(&ClassPermissionsType<T>, &DerivedPrincipal<T::AccountId, T::GroupId>) -> bool,
        Mutate: FnOnce(&mut ClassPermissionsType<T>),
    {
        let principal = Self::derive_principal(origin, claimed_group_id, None)?;
        let mut class_permissions = Self::ensure_class_permissions(class_id)?;

        if predicate(&class_permissions, &principal) {
            mutate(&mut class_permissions);
            class_permissions.last_permissions_update = <system::Module<T>>::block_number();
            Ok(())
        } else {
            Err("ClassPermissionsMutationDenied")
        }
    }

    fn is_system_principal(
        _: &ClassPermissionsType<T>,
        principal: &DerivedPrincipal<T::AccountId, T::GroupId>,
    ) -> bool {
        *principal == DerivedPrincipal::System
    }

    /// Constructs a base principal from the origin and claimed group id and uses it to
    /// test a predicate.
    fn if_class_permissions_satisfied<Predicate, Callback>(
        origin: T::Origin,
        claimed_group_id: Option<T::GroupId>,
        as_entity_owner: Option<EntityId>,
        // predicate used for testing
        predicate: Predicate,
        // class permissions to test
        class_id: ClassId,
        // actual mutation to apply.
        callback: Callback,
    ) -> dispatch::Result
    where
        Predicate:
            FnOnce(&ClassPermissionsType<T>, &DerivedPrincipal<T::AccountId, T::GroupId>) -> bool,
        Callback: FnOnce(
            &ClassPermissionsType<T>,
            &DerivedPrincipal<T::AccountId, T::GroupId>,
        ) -> dispatch::Result,
    {
        // construct a BasePrincipal from origin and group_id
        let principal = Self::derive_principal(origin, claimed_group_id, as_entity_owner)?;
        let class_permissions = Self::ensure_class_permissions(class_id)?;

        if predicate(&class_permissions, &principal) {
            callback(&class_permissions, &principal)
        } else {
            Err("ClassPermissionNotSatisfied")
        }
    }

    fn get_class_id_by_entity_id(entity_id: &EntityId) -> Result<ClassId, &'static str> {
        // use a utility method on versioned_store module
        ensure!(
            versioned_store::EntityById::exists(entity_id),
            "EntityNotFound"
        );
        let entity = <versioned_store::Module<T>>::entity_by_id(entity_id);
        Ok(entity.class_id) // blocker! Entity.class_id field is private
    }

    // Ensures property_values of type Internal that point to a class,
    // the target entity and class exists and constraint allows it.
    fn ensure_internal_property_values_permitted(
        source_class_id: ClassId,
        property_values: &Vec<ClassPropertyValue>,
    ) -> dispatch::Result {
        for property_value in property_values.iter() {
            // blocker! - PropertyValue.value if private
            if let PropertyValue::Internal(ref target_entity_id) = property_value.value {
                // get the class permissions for target class
                let target_class_id = Self::get_class_id_by_entity_id(target_entity_id)?;
                // assert class permissions exists for target class
                let class_permissions = Self::class_permissions_by_class_id(target_class_id);

                // ensure internal reference is permitted
                match class_permissions.reference_constraint {
                    ReferenceConstraint::NoConstraint => Ok(()),
                    ReferenceConstraint::NoReferencingAllowed => {
                        Err("EntityCannotReferenceTargetEntity")
                    }
                    ReferenceConstraint::Restricted(permitted_properties) => {
                        if permitted_properties.contains(&PropertyOfClass {
                            class_id: source_class_id,
                            property_index: property_value.in_class_index, // blocker! - private field
                        }) {
                            Ok(())
                        } else {
                            Err("EntityCannotReferenceTargetEntity")
                        }
                    }
                }?;
            }
        }

        // if we reach here all Internal properties have passed the constraint check
        Ok(())
    }
}
