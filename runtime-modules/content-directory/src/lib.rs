// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
#![recursion_limit = "256"]

use codec::{Codec, Decode, Encode};
use rstd::collections::{btree_map::BTreeMap, btree_set::BTreeSet};
use rstd::prelude::*;
use runtime_primitives::traits::{
    MaybeSerialize, MaybeSerializeDeserialize, Member, One, SimpleArithmetic, Zero,
};
use srml_support::{
    decl_module, decl_storage, dispatch, ensure, traits::Get, Parameter, StorageDoubleMap,
};
use system::ensure_signed;

#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};

mod errors;
mod example;
mod mock;
mod operations;
mod permissions;
mod schema;
mod tests;

use core::fmt::Debug;
pub use errors::*;
pub use operations::*;
pub use permissions::*;
pub use schema::*;

type MaxNumber = u32;

pub trait Trait: system::Trait + ActorAuthenticator + Debug {
    /// Type that represents an actor or group of actors in the system.
    type Credential: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + Clone
        + MaybeSerialize
        + Eq
        + PartialEq
        + Ord;

    type Nonce: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + Clone
        + One
        + Zero
        + MaybeSerializeDeserialize
        + Eq
        + PartialEq
        + Ord
        + From<u32>;

    type ClassId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + Clone
        + One
        + Zero
        + MaybeSerializeDeserialize
        + Eq
        + PartialEq
        + Ord;

    type EntityId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + Clone
        + One
        + Zero
        + MaybeSerializeDeserialize
        + Eq
        + PartialEq
        + Ord;

    /// Security/configuration constraints

    type PropertyNameConstraint: Get<InputValidationLengthConstraint>;

    type PropertyDescriptionConstraint: Get<InputValidationLengthConstraint>;

    type ClassNameConstraint: Get<InputValidationLengthConstraint>;

    type ClassDescriptionConstraint: Get<InputValidationLengthConstraint>;

    type NumberOfClassesConstraint: Get<MaxNumber>;

    type NumberOfSchemasConstraint: Get<MaxNumber>;

    type NumberOfPropertiesConstraint: Get<MaxNumber>;

    type VecMaxLengthConstraint: Get<VecMaxLength>;

    type TextMaxLengthConstraint: Get<TextMaxLength>;

    /// Entities creation constraint per class
    type EntitiesCreationConstraint: Get<CreationLimit>;

    /// Entities creation constraint per individual
    type IndividualEntitiesCreationConstraint: Get<CreationLimit>;
}

/// Length constraint for input validation
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, Copy, PartialEq, Eq, Debug)]
pub struct InputValidationLengthConstraint {
    /// Minimum length
    pub min: u16,

    /// Difference between minimum length and max length.
    /// While having max would have been more direct, this
    /// way makes max < min unrepresentable semantically,
    /// which is safer.
    pub max_min_diff: u16,
}

impl InputValidationLengthConstraint {
    pub fn new(min: u16, max_min_diff: u16) -> Self {
        Self { min, max_min_diff }
    }

    /// Helper for computing max
    pub fn max(self) -> u16 {
        self.min + self.max_min_diff
    }

    pub fn ensure_valid(
        self,
        len: usize,
        too_short_msg: &'static str,
        too_long_msg: &'static str,
    ) -> Result<(), &'static str> {
        let length = len as u16;
        if length < self.min {
            Err(too_short_msg)
        } else if length > self.max() {
            Err(too_long_msg)
        } else {
            Ok(())
        }
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct Class<T: Trait> {
    /// Permissions for an instance of a Class.
    class_permissions: ClassPermissions,
    /// All properties that have been used on this class across different class schemas.
    /// Unlikely to be more than roughly 20 properties per class, often less.
    /// For Person, think "height", "weight", etc.
    pub properties: Vec<Property<T>>,

    /// All schemas that are available for this class, think v0.0 Person, v.1.0 Person, etc.
    pub schemas: Vec<Schema>,

    pub name: Vec<u8>,
    pub description: Vec<u8>,

    /// The maximum number of entities which can be created.
    maximum_entities_count: CreationLimit,

    /// The current number of entities which exist.
    current_number_of_entities: CreationLimit,

    /// How many entities a given controller may create at most.
    per_controller_entity_creation_limit: CreationLimit,
}

impl<T: Trait> Default for Class<T> {
    fn default() -> Self {
        Self {
            class_permissions: ClassPermissions::default(),
            properties: vec![],
            schemas: vec![],
            name: vec![],
            description: vec![],
            maximum_entities_count: CreationLimit::default(),
            current_number_of_entities: CreationLimit::default(),
            per_controller_entity_creation_limit: CreationLimit::default(),
        }
    }
}

impl<T: Trait> Class<T> {
    fn new(
        class_permissions: ClassPermissions,
        name: Vec<u8>,
        description: Vec<u8>,
        maximum_entities_count: CreationLimit,
        per_controller_entity_creation_limit: CreationLimit,
    ) -> Self {
        Self {
            class_permissions,
            properties: vec![],
            schemas: vec![],
            name,
            description,
            maximum_entities_count,
            current_number_of_entities: 0,
            per_controller_entity_creation_limit,
        }
    }

    fn update_schema_status(&mut self, schema_index: SchemaId, schema_status: bool) {
        // Such indexing is safe, when length bounds were previously checked
        self.schemas[schema_index as usize].set_status(schema_status);
    }

    fn set_property_lock_status_at_index(
        &mut self,
        in_class_schema_property_id: PropertyId,
        is_locked: IsLocked,
    ) {
        // Such indexing is safe, when length bounds were previously checked
        self.properties[in_class_schema_property_id as usize]
            .prop_type
            .set_locked_for(is_locked)
    }

    fn set_reference_property_same_controller_status(
        &mut self,
        in_class_schema_property_id: PropertyId,
        same_controller: SameController,
    ) {
        // Such indexing is safe, when length bounds were previously checked
        self.properties[in_class_schema_property_id as usize]
            .prop_type
            .set_same_controller_status(same_controller)
    }

    fn increment_entities_count(&mut self) {
        self.current_number_of_entities += 1;
    }

    fn decrement_entities_count(&mut self) {
        self.current_number_of_entities -= 1;
    }

    fn get_permissions_mut(&mut self) -> &mut ClassPermissions {
        &mut self.class_permissions
    }

    fn get_permissions(&self) -> &ClassPermissions {
        &self.class_permissions
    }

    pub fn get_controller_entity_creation_limit(&self) -> CreationLimit {
        self.per_controller_entity_creation_limit
    }

    pub fn get_maximum_entities_count(&self) -> CreationLimit {
        self.maximum_entities_count
    }

    fn is_active_schema(&self, schema_index: SchemaId) -> bool {
        // Such indexing is safe, when length bounds were previously checked
        self.schemas[schema_index as usize].is_active()
    }

    pub fn ensure_schema_id_exists(&self, schema_id: SchemaId) -> dispatch::Result {
        ensure!(
            schema_id < self.schemas.len() as SchemaId,
            ERROR_UNKNOWN_CLASS_SCHEMA_ID
        );
        Ok(())
    }

    pub fn ensure_property_id_exists(
        &self,
        in_class_schema_property_id: PropertyId,
    ) -> dispatch::Result {
        ensure!(
            in_class_schema_property_id < self.properties.len() as PropertyId,
            ERROR_CLASS_PROP_NOT_FOUND
        );
        Ok(())
    }

    pub fn ensure_schema_is_active(&self, schema_id: SchemaId) -> dispatch::Result {
        ensure!(
            self.is_active_schema(schema_id),
            ERROR_CLASS_SCHEMA_NOT_ACTIVE
        );
        Ok(())
    }

    pub fn ensure_schemas_limit_not_reached(&self) -> dispatch::Result {
        ensure!(
            T::NumberOfSchemasConstraint::get() < self.schemas.len() as MaxNumber,
            ERROR_CLASS_SCHEMAS_LIMIT_REACHED
        );
        Ok(())
    }

    pub fn ensure_properties_limit_not_reached(
        &self,
        new_properties: &[Property<T>],
    ) -> dispatch::Result {
        ensure!(
            T::NumberOfPropertiesConstraint::get()
                <= (self.properties.len() + new_properties.len()) as MaxNumber,
            ERROR_CLASS_PROPERTIES_LIMIT_REACHED
        );
        Ok(())
    }

    pub fn ensure_maximum_entities_count_limit_not_reached(&self) -> dispatch::Result {
        ensure!(
            self.current_number_of_entities < self.maximum_entities_count,
            ERROR_MAX_NUMBER_OF_ENTITIES_PER_CLASS_LIMIT_REACHED
        );
        Ok(())
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct Entity<T: Trait> {
    /// Permissions for an instance of an Entity.
    pub entity_permission: EntityPermissions<T>,

    /// The class id of this entity.
    pub class_id: T::ClassId,

    /// What schemas under which this entity of a class is available, think
    /// v.2.0 Person schema for John, v3.0 Person schema for John
    /// Unlikely to be more than roughly 20ish, assuming schemas for a given class eventually stableize, or that very old schema are eventually removed.
    pub supported_schemas: BTreeSet<SchemaId>, // indices of schema in corresponding class

    /// Values for properties on class that are used by some schema used by this entity!
    /// Length is no more than Class.properties.
    pub values: BTreeMap<PropertyId, PropertyValue<T>>,
    pub reference_count: u32,
}

impl<T: Trait> Default for Entity<T> {
    fn default() -> Self {
        Self {
            entity_permission: EntityPermissions::<T>::default(),
            class_id: T::ClassId::default(),
            supported_schemas: BTreeSet::new(),
            values: BTreeMap::new(),
            reference_count: 0,
        }
    }
}

impl<T: Trait> Entity<T> {
    fn new(
        controller: Option<EntityController<T>>,
        class_id: T::ClassId,
        supported_schemas: BTreeSet<SchemaId>,
        values: BTreeMap<PropertyId, PropertyValue<T>>,
    ) -> Self {
        Self {
            entity_permission: EntityPermissions::<T>::default_with_controller(controller),
            class_id,
            supported_schemas,
            values,
            reference_count: 0,
        }
    }

    fn get_permissions_mut(&mut self) -> &mut EntityPermissions<T> {
        &mut self.entity_permission
    }

    fn get_permissions(&self) -> &EntityPermissions<T> {
        &self.entity_permission
    }

    pub fn ensure_schema_id_is_not_added(&self, schema_id: SchemaId) -> dispatch::Result {
        let schema_not_added = !self.supported_schemas.contains(&schema_id);
        ensure!(schema_not_added, ERROR_SCHEMA_ALREADY_ADDED_TO_ENTITY);
        Ok(())
    }
}

// Shortcuts for faster readability of match expression:
use PropertyType as PT;
use PropertyValue as PV;

decl_storage! {
    trait Store for Module<T: Trait> as ContentDirectory {
        pub ClassById get(class_by_id) config(): linked_map T::ClassId => Class<T>;

        pub EntityById get(entity_by_id) config(): map T::EntityId => Entity<T>;

        pub NextClassId get(next_class_id) config(): T::ClassId;

        pub NextEntityId get(next_entity_id) config(): T::EntityId;

        /// Groups who's actors can create entities of class.
        pub CanCreateEntitiesOfClass get(can_create_entities_of_class): double_map hasher(blake2_128) T::ClassId, blake2_128(T::GroupId) => ();

        /// Groups who's actors can act as entity maintainers.
        pub EntityMaintainers get(entity_maintainers): double_map hasher(blake2_128) T::EntityId, blake2_128(T::GroupId) => ();

        // The voucher associated with entity creation for a given class and controller.
        // Is updated whenever an entity is created in a given class by a given controller.
        // Constraint is updated by Root, an initial value comes from `ClassPermissions::per_controller_entity_creation_limit`.
        pub EntityCreationVouchers get(entity_creation_vouchers): double_map hasher(blake2_128) T::ClassId, blake2_128(EntityController<T>) => EntityCreationVoucher;

        /// Upper limit for how many operations can be included in a single invocation of `atomic_batched_operations`.
        pub MaximumNumberOfOperationsDuringAtomicBatching: u64;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        // ======
        // Next set of extrinsics can only be invoked by authority.
        // ======

        pub fn add_entities_creator(
            origin,
            class_id: T::ClassId,
            group_id: T::GroupId,
            limit: EntityCreationLimit
        ) -> dispatch::Result {
            let account_id = ensure_signed(origin)?;

            ensure_authority_auth_success::<T>(&account_id)?;
            Self::ensure_known_class_id(class_id)?;
            Self::ensure_entity_creator_does_not_exist(class_id, group_id)?;

            //
            // == MUTATION SAFE ==
            //

            <CanCreateEntitiesOfClass<T>>::insert(class_id, group_id, ());
            let entity_controller = EntityController::<T>::Group(group_id);
            let limit = if let EntityCreationLimit::Individual(individual_limit) = limit {
                Self::ensure_valid_number_of_class_entities_per_actor(individual_limit)?;
                individual_limit
            } else {
                Self::class_by_id(class_id).get_controller_entity_creation_limit()
            };
            <EntityCreationVouchers<T>>::insert(class_id, entity_controller,
                EntityCreationVoucher::new(limit)
            );
            Ok(())
        }

        pub fn remove_entities_creator(
            origin,
            class_id: T::ClassId,
            group_id: T::GroupId,
        ) -> dispatch::Result {
            let account_id = ensure_signed(origin)?;

            ensure_authority_auth_success::<T>(&account_id)?;
            Self::ensure_known_class_id(class_id)?;
            Self::ensure_entity_creator_exists(class_id, group_id)?;

            //
            // == MUTATION SAFE ==
            //

            <CanCreateEntitiesOfClass<T>>::remove(class_id, group_id);
            Ok(())
        }

        pub fn add_entity_maintainer(
            origin,
            entity_id: T::EntityId,
            group_id: T::GroupId,
        ) -> dispatch::Result {
            let account_id = ensure_signed(origin)?;

            ensure_authority_auth_success::<T>(&account_id)?;
            Self::ensure_known_entity_id(entity_id)?;
            Self::ensure_entity_maintainer_does_not_exist(entity_id, group_id)?;

            //
            // == MUTATION SAFE ==
            //

            <EntityMaintainers<T>>::insert(entity_id, group_id, ());
            Ok(())
        }

        pub fn remove_entity_maintainer(
            origin,
            entity_id: T::EntityId,
            group_id: T::GroupId,
        ) -> dispatch::Result {
            let account_id = ensure_signed(origin)?;

            ensure_authority_auth_success::<T>(&account_id)?;
            Self::ensure_known_entity_id(entity_id)?;
            Self::ensure_entity_maintainer_exists(entity_id, group_id)?;

            //
            // == MUTATION SAFE ==
            //

            <EntityMaintainers<T>>::remove(entity_id, group_id);
            Ok(())
        }

        pub fn update_entity_creation_voucher(
            origin,
            class_id: T::ClassId,
            controller: EntityController<T>,
            maximum_entities_count: CreationLimit
        ) -> dispatch::Result {
            let account_id = ensure_signed(origin)?;

            ensure_authority_auth_success::<T>(&account_id)?;
            Self::ensure_known_class_id(class_id)?;
            Self::ensure_entity_creation_voucher_exists(class_id, &controller)?;

            // Ensure new  voucher`s max entities count is less than number of already created entities in given voucher
            // and runtime entities creation constraint per actor satisfied
            Self::entity_creation_vouchers(class_id, &controller)
                .ensure_new_max_entities_count_is_valid::<T>(maximum_entities_count)?;

            //
            // == MUTATION SAFE ==
            //

            <EntityCreationVouchers<T>>::mutate(class_id, controller, |entity_creation_voucher|
                entity_creation_voucher.set_maximum_entities_count(maximum_entities_count)
            );
            Ok(())
        }

        pub fn update_class_permissions(
            origin,
            class_id: T::ClassId,
            entity_creation_blocked: Option<bool>,
            initial_controller_of_created_entities: Option<InitialControllerPolicy>,
            all_entity_property_values_locked: Option<bool>
        ) -> dispatch::Result {
            let account_id = ensure_signed(origin)?;

            ensure_authority_auth_success::<T>(&account_id)?;
            Self::ensure_known_class_id(class_id)?;

            //
            // == MUTATION SAFE ==
            //

            if let Some(entity_creation_blocked) = entity_creation_blocked {
                <ClassById<T>>::mutate(class_id, |class| class.get_permissions_mut().set_entity_creation_blocked(entity_creation_blocked));
            }

            if let Some(initial_controller_of_created_entities) = initial_controller_of_created_entities {
                <ClassById<T>>::mutate(class_id, |class|
                    class.get_permissions_mut().set_initial_controller_of_created_entities(initial_controller_of_created_entities)
                );
            }

            if let Some(all_entity_property_values_locked) = all_entity_property_values_locked {
                <ClassById<T>>::mutate(class_id, |class|
                    class.get_permissions_mut().set_all_entity_property_values_locked(all_entity_property_values_locked)
                );
            }

            Ok(())
        }

        pub fn create_class(
            origin,
            name: Vec<u8>,
            description: Vec<u8>,
            class_permissions: ClassPermissions,
            maximum_entities_count: CreationLimit,
            per_controller_entity_creation_limit: CreationLimit
        ) -> dispatch::Result {
            let account_id = ensure_signed(origin)?;
            ensure_authority_auth_success::<T>(&account_id)?;

            Self::ensure_entities_limits_are_valid(maximum_entities_count, per_controller_entity_creation_limit)?;

            Self::ensure_class_limit_not_reached()?;

            Self::ensure_class_name_is_valid(&name)?;
            Self::ensure_class_description_is_valid(&description)?;

            let class_id = Self::next_class_id();

            let class = Class::new(class_permissions, name, description, maximum_entities_count, per_controller_entity_creation_limit);

            <ClassById<T>>::insert(&class_id, class);

            // Increment the next class id:
            <NextClassId<T>>::mutate(|n| *n += T::ClassId::one());

            Ok(())
        }

        pub fn create_class_with_default_permissions(
            origin,
            name: Vec<u8>,
            description: Vec<u8>,
            maximum_entities_count: CreationLimit,
            per_controller_entity_creation_limit: CreationLimit
        ) -> dispatch::Result {
            Self::create_class(origin, name, description, ClassPermissions::default(), maximum_entities_count, per_controller_entity_creation_limit)
        }

        pub fn add_class_schema(
            origin,
            class_id: T::ClassId,
            existing_properties: Vec<PropertyId>,
            new_properties: Vec<Property<T>>
        ) -> dispatch::Result {
            let account_id = ensure_signed(origin)?;
            ensure_authority_auth_success::<T>(&account_id)?;

            Self::ensure_known_class_id(class_id)?;

            let non_empty_schema = !existing_properties.is_empty() || !new_properties.is_empty();

            ensure!(non_empty_schema, ERROR_NO_PROPS_IN_CLASS_SCHEMA);

            let class = <ClassById<T>>::get(class_id);

            class.ensure_schemas_limit_not_reached()?;
            class.ensure_properties_limit_not_reached(&new_properties)?;

            let mut schema = Schema::new(existing_properties);

            let mut unique_prop_names = BTreeSet::new();
            for prop in class.properties.iter() {
                unique_prop_names.insert(prop.name.clone());
            }

            for prop in new_properties.iter() {
                prop.ensure_name_is_valid()?;
                prop.ensure_description_is_valid()?;
                prop.ensure_prop_type_size_is_valid()?;

                // Check that the name of a new property is unique within its class.
                ensure!(
                    !unique_prop_names.contains(&prop.name),
                    ERROR_PROP_NAME_NOT_UNIQUE_IN_A_CLASS
                );
                unique_prop_names.insert(prop.name.clone());
            }

            // Check that existing props are valid indices of class properties vector:
            let has_unknown_props = schema.get_properties()
                .iter()
                .any(|&prop_id| prop_id >= class.properties.len() as PropertyId);
            ensure!(
                !has_unknown_props,
                ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_PROP_INDEX
            );

            // Check validity of Reference Types for new_properties.
            let has_unknown_reference = new_properties.iter().any(|prop| match prop.prop_type {
                PropertyType::Reference(other_class_id, _, _) => !<ClassById<T>>::exists(other_class_id),
                PropertyType::ReferenceVec(_, other_class_id, _, _) => !<ClassById<T>>::exists(other_class_id),
                _ => false,
            });
            ensure!(
                !has_unknown_reference,
                ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_CLASS
            );

            let mut updated_class_props = class.properties;
            new_properties.into_iter().for_each(|prop| {
                let prop_id = updated_class_props.len() as PropertyId;
                updated_class_props.push(prop);
                schema.get_properties_mut().push(prop_id);
            });

            <ClassById<T>>::mutate(class_id, |class| {
                class.properties = updated_class_props;
                class.schemas.push(schema);
            });

            Ok(())
        }

        pub fn update_class_schema_status(
            origin,
            class_id: T::ClassId,
            schema_id: SchemaId,
            schema_status: bool
        ) -> dispatch::Result {
            let account_id = ensure_signed(origin)?;
            ensure_authority_auth_success::<T>(&account_id)?;
            Self::ensure_known_class_id(class_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Check that schema_id is a valid index of class schemas vector:
            Self::class_by_id(class_id).ensure_schema_id_exists(schema_id)?;
            <ClassById<T>>::mutate(class_id, |class| {
                class.update_schema_status(schema_id, schema_status)
            });
            Ok(())
        }

        pub fn set_class_property_lock_status_at_index(
            origin,
            class_id: T::ClassId,
            in_class_schema_property_id: PropertyId,
            is_locked: IsLocked
        ) -> dispatch::Result {
            let account_id = ensure_signed(origin)?;
            ensure_authority_auth_success::<T>(&account_id)?;
            Self::ensure_known_class_id(class_id)?;

            // Ensure property_id is a valid index of class properties vector:
            Self::class_by_id(class_id).ensure_property_id_exists(in_class_schema_property_id)?;

            //
            // == MUTATION SAFE ==
            //

            <ClassById<T>>::mutate(class_id, |class| {
                class.set_property_lock_status_at_index(in_class_schema_property_id, is_locked)
            });
            Ok(())
        }

        pub fn set_reference_property_same_controller_status(
            origin,
            class_id: T::ClassId,
            in_class_schema_property_id: PropertyId,
            same_controller: SameController
        ) -> dispatch::Result {
            let account_id = ensure_signed(origin)?;
            ensure_authority_auth_success::<T>(&account_id)?;
            Self::ensure_known_class_id(class_id)?;

            // Ensure property_id is a valid index of class properties vector:
            Self::class_by_id(class_id).ensure_property_id_exists(in_class_schema_property_id)?;

            //
            // == MUTATION SAFE ==
            //

            <ClassById<T>>::mutate(class_id, |class| {
                class.set_reference_property_same_controller_status(in_class_schema_property_id, same_controller)
            });
            Ok(())
        }

        /// Update entity permissions.
        ///

        pub fn update_entity_permissions(
            origin,
            entity_id: T::EntityId,
            controller: Option<EntityController<T>>,
            frozen_for_controller: Option<bool>,
            referenceable: Option<bool>
        ) -> dispatch::Result {
            let account_id = ensure_signed(origin)?;
            ensure_authority_auth_success::<T>(&account_id)?;
            Self::ensure_known_entity_id(entity_id)?;

            //
            // == MUTATION SAFE ==
            //

            if controller.is_some() {
                <EntityById<T>>::mutate(entity_id, |inner_entity|
                    inner_entity.get_permissions_mut().set_conroller(controller)
                );
            }

            if let Some(frozen_for_controller) = frozen_for_controller {
                <EntityById<T>>::mutate(entity_id, |inner_entity|
                    inner_entity.get_permissions_mut().set_frozen(frozen_for_controller)
                );
            }

            if let Some(referenceable) = referenceable {
                <EntityById<T>>::mutate(entity_id, |inner_entity|
                    inner_entity.get_permissions_mut().set_referencable(referenceable)
                );
            }

            Ok(())
        }

        // ======
        // The next set of extrinsics can be invoked by anyone who can properly sign for provided value of `ActorInGroupId<T>`.
        // ======

        /// Create an entity.
        /// If someone is making an entity of this class for first time, then a voucher is also added with the class limit as the default limit value.
        /// class limit default value.
        /// The `as` parameter must match `can_create_entities_of_class`, and the controller is set based on `initial_controller_of_created_entities` in the class permission.
        pub fn create_entity(
            origin,
            class_id: T::ClassId,
            actor_in_group: ActorInGroupId<T>,
        ) -> dispatch::Result {
            let account_id = ensure_signed(origin)?;
            let class = Self::ensure_class_exists(class_id)?;
            class.ensure_maximum_entities_count_limit_not_reached()?;

            let class_permissions = class.get_permissions();
            class_permissions.ensure_entity_creation_not_blocked()?;

            // If origin is not an authority
            let entity_controller = if !T::authenticate_authority(&account_id) {
                Self::ensure_entity_creator_exists(class_id, actor_in_group.get_group_id())?;
                let initial_controller_of_created_entities = class_permissions.get_initial_controller_of_created_entities();
                let entity_controller = EntityController::from(initial_controller_of_created_entities, actor_in_group);

                // Ensure entity creation voucher exists
                if <EntityCreationVouchers<T>>::exists(class_id, &entity_controller) {

                    let entity_creation_voucher = Self::entity_creation_vouchers(class_id, &entity_controller);

                    // Ensure voucher limit not reached
                    Self::ensure_voucher_limit_not_reached(entity_creation_voucher)?;

                    //
                    // == MUTATION SAFE ==
                    //

                    <EntityCreationVouchers<T>>::mutate(class_id, &entity_controller, |entity_creation_voucher| {
                        entity_creation_voucher.increment_created_entities_count()
                    })
                } else {
                    <EntityCreationVouchers<T>>::insert(class_id, entity_controller.clone(),
                        EntityCreationVoucher::new(class.get_controller_entity_creation_limit())
                    );
                }
                Some(entity_controller)
            } else {
                None
            };

            Self::complete_entity_creation(class_id, entity_controller);
            Ok(())
        }

        pub fn remove_entity(
            origin,
            actor_in_group: ActorInGroupId<T>,
            entity_id: T::EntityId,
        ) -> dispatch::Result {
            let account_id = ensure_signed(origin)?;

            Self::ensure_known_entity_id(entity_id)?;

            // If origin is not an authority
            if !T::authenticate_authority(&account_id) {
                let (_, access_level) = Self::get_entity_and_access_level(account_id, entity_id, actor_in_group)?;
                EntityPermissions::<T>::ensure_group_can_remove_entity(access_level)?;
            }

            // Ensure there is no property values pointing to the given entity
            Self::ensure_rc_is_zero(entity_id)?;

            //
            // == MUTATION SAFE ==
            //

            Self::complete_entity_removal(entity_id);
            Ok(())
        }

        pub fn add_schema_support_to_entity(
            origin,
            actor_in_group: ActorInGroupId<T>,
            entity_id: T::EntityId,
            schema_id: SchemaId,
            property_values: BTreeMap<PropertyId, PropertyValue<T>>
        ) -> dispatch::Result {
            let account_id = ensure_signed(origin)?;

            Self::ensure_known_entity_id(entity_id)?;
            // If origin is not an authority
            let entity = if !T::authenticate_authority(&account_id) {
                let (entity, access_level) = Self::get_entity_and_access_level(account_id, entity_id, actor_in_group)?;
                EntityPermissions::<T>::ensure_group_can_add_schema_support(access_level)?;
                entity
            } else {
                Self::entity_by_id(entity_id)
            };
            Self::add_entity_schema_support(entity_id, entity, schema_id, property_values)
        }

        pub fn update_entity_property_values(
            origin,
            actor_in_group: ActorInGroupId<T>,
            entity_id: T::EntityId,
            property_values: BTreeMap<PropertyId, PropertyValue<T>>
        ) -> dispatch::Result {
            let account_id = ensure_signed(origin)?;

            Self::ensure_known_entity_id(entity_id)?;
            let entity = Self::entity_by_id(entity_id);

            // If origin is not an authority
            let access_level = Self::get_entity_access_level(account_id, entity_id, &entity, actor_in_group)?;

            Self::complete_entity_property_values_update(entity_id, entity, property_values, access_level)
        }

        pub fn clear_entity_property_vector(
            origin,
            actor_in_group: ActorInGroupId<T>,
            entity_id: T::EntityId,
            in_class_schema_property_id: PropertyId
        ) -> dispatch::Result {
            let account_id = ensure_signed(origin)?;

            Self::ensure_known_entity_id(entity_id)?;
            let entity = Self::entity_by_id(entity_id);

            // If origin is not an authority
            let access_level = Self::get_entity_access_level(account_id, entity_id, &entity, actor_in_group)?;

            Self::complete_entity_property_vector_cleaning(
                entity_id,
                entity,
                in_class_schema_property_id,
                access_level
            )
        }

        pub fn remove_at_entity_property_vector(
            origin,
            actor_in_group: ActorInGroupId<T>,
            entity_id: T::EntityId,
            in_class_schema_property_id: PropertyId,
            index_in_property_vec: VecMaxLength,
            nonce: T::Nonce
        ) -> dispatch::Result {
            let account_id = ensure_signed(origin)?;

            Self::ensure_known_entity_id(entity_id)?;
            let entity = Self::entity_by_id(entity_id);

            // If origin is not an authority
            let access_level = Self::get_entity_access_level(account_id, entity_id, &entity, actor_in_group)?;
            Self::complete_remove_at_entity_property_vector(entity_id, entity, in_class_schema_property_id, index_in_property_vec, nonce, access_level)
        }

        pub fn insert_at_entity_property_vector(
            origin,
            actor_in_group: ActorInGroupId<T>,
            entity_id: T::EntityId,
            in_class_schema_property_id: PropertyId,
            index_in_property_vec: VecMaxLength,
            property_value: PropertyValue<T>,
            nonce: T::Nonce
        ) -> dispatch::Result {
            let account_id = ensure_signed(origin)?;

            Self::ensure_known_entity_id(entity_id)?;
            let entity = Self::entity_by_id(entity_id);

            // If origin is not an authority
            let access_level = Self::get_entity_access_level(account_id, entity_id, &entity, actor_in_group)?;
            Self::complete_insert_at_entity_property_vector(
                entity_id,
                entity,
                in_class_schema_property_id,
                index_in_property_vec,
                property_value,
                nonce,
                access_level
            )
        }

        // pub fn transaction(origin, operations: Vec<Operation<T::Credential, T>>) -> dispatch::Result {
        //     // This map holds the T::EntityId of the entity created as a result of executing a CreateEntity Operation
        //     // keyed by the indexed of the operation, in the operations vector.
        //     let mut entity_created_in_operation: BTreeMap<usize, T::EntityId> = BTreeMap::new();

        //     let raw_origin = Self::ensure_root_or_signed(origin)?;

        //     for (op_index, operation) in operations.into_iter().enumerate() {
        //         match operation.operation_type {
        //             OperationType::CreateEntity(create_entity_operation) => {
        //                 let entity_id = Self::do_create_entity(&raw_origin, operation.with_credential, create_entity_operation.class_id)?;
        //                 entity_created_in_operation.insert(op_index, entity_id);
        //             },
        //             OperationType::UpdatePropertyValues(update_property_values_operation) => {
        //                 let entity_id = operations::parametrized_entity_to_entity_id(&entity_created_in_operation, update_property_values_operation.entity_id)?;
        //                 let property_values = operations::parametrized_property_values_to_property_values(&entity_created_in_operation, update_property_values_operation.new_parametrized_property_values)?;
        //                 Self::do_update_entity_property_values(&raw_origin, operation.with_credential, operation.as_entity_maintainer, entity_id, property_values)?;
        //             },
        //             OperationType::AddSchemaSupportToEntity(add_schema_support_to_entity_operation) => {
        //                 let entity_id = operations::parametrized_entity_to_entity_id(&entity_created_in_operation, add_schema_support_to_entity_operation.entity_id)?;
        //                 let schema_id = add_schema_support_to_entity_operation.schema_id;
        //                 let property_values = operations::parametrized_property_values_to_property_values(&entity_created_in_operation, add_schema_support_to_entity_operation.parametrized_property_values)?;
        //                 Self::do_add_schema_support_to_entity(&raw_origin, operation.with_credential, operation.as_entity_maintainer, entity_id, schema_id, property_values)?;
        //             }
        //         }
        //     }

        //     Ok(())
        // }
    }
}

impl<T: Trait> Module<T> {
    fn complete_entity_creation(
        class_id: T::ClassId,
        entity_controller: Option<EntityController<T>>,
    ) {
        let entity_id = Self::next_entity_id();

        let new_entity = Entity::<T>::new(
            entity_controller,
            class_id,
            BTreeSet::new(),
            BTreeMap::new(),
        );

        // Save newly created entity:
        EntityById::insert(entity_id, new_entity);

        // Increment the next entity id:
        <NextEntityId<T>>::mutate(|n| *n += T::EntityId::one());

        <ClassById<T>>::mutate(class_id, |class| {
            class.increment_entities_count();
        });
    }

    fn complete_entity_removal(entity_id: T::EntityId) {
        let class_id = Self::get_class_id_by_entity_id(entity_id);
        <EntityById<T>>::remove(entity_id);
        <EntityMaintainers<T>>::remove_prefix(entity_id);

        <ClassById<T>>::mutate(class_id, |class| class.decrement_entities_count());
    }

    pub fn add_entity_schema_support(
        entity_id: T::EntityId,
        entity: Entity<T>,
        schema_id: SchemaId,
        property_values: BTreeMap<PropertyId, PropertyValue<T>>,
    ) -> dispatch::Result {
        let class = Self::class_by_id(entity.class_id);

        // Check that schema_id is a valid index of class schemas vector:
        class.ensure_schema_id_exists(schema_id)?;

        // Ensure class schema is active
        class.ensure_schema_is_active(schema_id)?;

        // Check that schema id is not yet added to this entity:
        entity.ensure_schema_id_is_not_added(schema_id)?;

        let class_schema_opt = class.schemas.get(schema_id as usize);
        let schema_prop_ids = class_schema_opt.unwrap().get_properties();

        let current_entity_values = entity.values.clone();
        let mut appended_entity_values = entity.values.clone();
        let mut entities_rc_to_increment_vec = vec![];

        for prop_id in schema_prop_ids.iter() {
            if current_entity_values.contains_key(prop_id) {
                // A property is already added to the entity and cannot be updated
                // while adding a schema support to this entity.
                continue;
            }

            let class_prop = &class.properties[*prop_id as usize];

            // If a value was not povided for the property of this schema:
            if let Some(new_value) = property_values.get(prop_id) {
                class_prop.ensure_property_value_to_update_is_valid(
                    new_value,
                    entity.get_permissions().get_controller(),
                )?;
                if let Some(entities_rc_to_increment) = new_value.get_involved_entities() {
                    entities_rc_to_increment_vec.push(entities_rc_to_increment);
                }
                appended_entity_values.insert(*prop_id, new_value.to_owned());
            } else {
                // All required prop values should be are provided
                ensure!(!class_prop.required, ERROR_MISSING_REQUIRED_PROP);

                // Add all missing non required schema prop values as PropertyValue::Bool(false)
                appended_entity_values.insert(*prop_id, PropertyValue::Bool(false));
            }
        }

        //
        // == MUTATION SAFE ==
        //

        <EntityById<T>>::mutate(entity_id, |entity| {
            // Add a new schema to the list of schemas supported by this entity.
            entity.supported_schemas.insert(schema_id);

            // Update entity values only if new properties have been added.
            if appended_entity_values.len() > entity.values.len() {
                entity.values = appended_entity_values;
            }
        });
        entities_rc_to_increment_vec
            .iter()
            .for_each(|entities_rc_to_increment| {
                Self::increment_entities_rc(entities_rc_to_increment);
            });

        Ok(())
    }

    pub fn complete_entity_property_values_update(
        entity_id: T::EntityId,
        entity: Entity<T>,
        new_property_values: BTreeMap<PropertyId, PropertyValue<T>>,
        access_level: Option<EntityAccessLevel>,
    ) -> dispatch::Result {
        let class = Self::class_by_id(entity.class_id);

        // Ensure property values were not locked on class level
        ensure!(
            !class.get_permissions().all_entity_property_values_locked(),
            ERROR_ALL_PROP_WERE_LOCKED_ON_CLASS_LEVEL
        );

        // Get current property values of an entity as a mutable vector,
        // so we can update them if new values provided present in new_property_values.
        let mut updated_values = entity.values.clone();
        let mut updated = false;

        let mut entities_rc_to_decrement_vec = vec![];
        let mut entities_rc_to_increment_vec = vec![];

        // Iterate over a vector of new values and update corresponding properties
        // of this entity if new values are valid.
        for (id, new_value) in new_property_values.into_iter() {
            // Try to find a current property value in the entity
            // by matching its id to the id of a property with an updated value.
            let current_prop_value = updated_values
                .get_mut(&id)
                // Throw an error if a property was not found on entity
                // by an in-class index of a property update.
                .ok_or(ERROR_UNKNOWN_ENTITY_PROP_ID)?;

            // Get class-level information about this property
            if let Some(class_prop) = class.properties.get(id as usize) {
                // Skip update if new value is equal to the current one or class property type
                // is locked for update from current actor
                if new_value == *current_prop_value || class_prop.is_locked_from(access_level) {
                    continue;
                }

                // Validate a new property value against the type of this property
                // and check any additional constraints like the length of a vector
                // if it's a vector property or the length of a text if it's a text property.
                class_prop.ensure_property_value_to_update_is_valid(
                    &new_value,
                    entity.get_permissions().get_controller(),
                )?;

                // Get unique entity ids to update rc
                if let (Some(entities_rc_to_increment), Some(entities_rc_to_decrement)) = (
                    new_value.get_involved_entities(),
                    current_prop_value.get_involved_entities(),
                ) {
                    let (entities_rc_to_decrement, entities_rc_to_increment): (
                        Vec<T::EntityId>,
                        Vec<T::EntityId>,
                    ) = entities_rc_to_decrement
                        .into_iter()
                        .zip(entities_rc_to_increment.into_iter())
                        .filter(|(entity_rc_to_decrement, entity_rc_to_increment)| {
                            entity_rc_to_decrement != entity_rc_to_increment
                        })
                        .unzip();
                    entities_rc_to_increment_vec.push(entities_rc_to_increment);
                    entities_rc_to_decrement_vec.push(entities_rc_to_decrement);
                }

                // Update a current prop value in a mutable vector, if a new value is valid.
                current_prop_value.update(new_value);
                updated = true;
            }
        }

        // If property values should be updated:
        if updated {
            //
            // == MUTATION SAFE ==
            //

            <EntityById<T>>::mutate(entity_id, |entity| {
                entity.values = updated_values;
            });
            entities_rc_to_increment_vec
                .iter()
                .for_each(|entities_rc_to_increment| {
                    Self::increment_entities_rc(entities_rc_to_increment);
                });
            entities_rc_to_decrement_vec
                .iter()
                .for_each(|entities_rc_to_decrement| {
                    Self::decrement_entities_rc(entities_rc_to_decrement);
                });
        }

        Ok(())
    }

    fn complete_entity_property_vector_cleaning(
        entity_id: T::EntityId,
        entity: Entity<T>,
        in_class_schema_property_id: PropertyId,
        access_level: Option<EntityAccessLevel>,
    ) -> dispatch::Result {
        let current_prop_value = entity
            .values
            .get(&in_class_schema_property_id)
            // Throw an error if a property was not found on entity
            // by an in-class index of a property.
            .ok_or(ERROR_UNKNOWN_ENTITY_PROP_ID)?;

        Self::ensure_class_property_type_unlocked_for(
            entity.class_id,
            in_class_schema_property_id,
            access_level,
        )?;

        // Ensure prop value under given class schema property id is vector
        ensure!(
            current_prop_value.is_vec(),
            ERROR_PROP_VALUE_UNDER_GIVEN_INDEX_IS_NOT_A_VECTOR
        );

        let entities_rc_to_decrement = current_prop_value.get_involved_entities();

        //
        // == MUTATION SAFE ==
        //

        // Clear property value vector:
        <EntityById<T>>::mutate(entity_id, |entity| {
            if let Some(current_property_value_vec) =
                entity.values.get_mut(&in_class_schema_property_id)
            {
                current_property_value_vec.vec_clear();
            }
            if let Some(entities_rc_to_decrement) = entities_rc_to_decrement {
                Self::decrement_entities_rc(&entities_rc_to_decrement);
            }
        });

        Ok(())
    }

    fn complete_remove_at_entity_property_vector(
        entity_id: T::EntityId,
        entity: Entity<T>,
        in_class_schema_property_id: PropertyId,
        index_in_property_vec: VecMaxLength,
        nonce: T::Nonce,
        access_level: Option<EntityAccessLevel>,
    ) -> dispatch::Result {
        let current_prop_value = entity
            .values
            .get(&in_class_schema_property_id)
            // Throw an error if a property was not found on entity
            // by an in-class index of a property.
            .ok_or(ERROR_UNKNOWN_ENTITY_PROP_ID)?;
        Self::ensure_class_property_type_unlocked_for(
            entity.class_id,
            in_class_schema_property_id,
            access_level,
        )?;

        // Ensure property value vector nonces equality to avoid possible data races,
        // when performing vector specific operations
        current_prop_value.ensure_nonce_equality(nonce)?;
        current_prop_value.ensure_index_in_property_vector_is_valid(index_in_property_vec)?;
        let involved_entity_id = current_prop_value
            .get_involved_entities()
            .map(|involved_entities| involved_entities[index_in_property_vec as usize]);

        //
        // == MUTATION SAFE ==
        //

        // Remove property value vector
        <EntityById<T>>::mutate(entity_id, |entity| {
            if let Some(current_prop_value) = entity.values.get_mut(&in_class_schema_property_id) {
                current_prop_value.vec_remove_at(index_in_property_vec)
            }
        });
        if let Some(involved_entity_id) = involved_entity_id {
            <EntityById<T>>::mutate(involved_entity_id, |entity| entity.reference_count -= 1)
        }
        Ok(())
    }

    fn complete_insert_at_entity_property_vector(
        entity_id: T::EntityId,
        entity: Entity<T>,
        in_class_schema_property_id: PropertyId,
        index_in_property_vec: VecMaxLength,
        property_value: PropertyValue<T>,
        nonce: T::Nonce,
        access_level: Option<EntityAccessLevel>,
    ) -> dispatch::Result {
        // Try to find a current property value in the entity
        // by matching its id to the id of a property with an updated value.
        if let Some(entity_prop_value) = entity.values.get(&in_class_schema_property_id) {
            let class_prop = Self::ensure_class_property_type_unlocked_for(
                entity.class_id,
                in_class_schema_property_id,
                access_level,
            )?;

            // Ensure property value vector nonces equality to avoid possible data races,
            // when performing vector specific operations
            entity_prop_value.ensure_nonce_equality(nonce)?;

            // Validate a new property value against the type of this property
            // and check any additional constraints like the length of a vector
            // if it's a vector property or the length of a text if it's a text property.
            class_prop.ensure_prop_value_can_be_inserted_at_prop_vec(
                &property_value,
                entity_prop_value,
                index_in_property_vec,
                entity.get_permissions().get_controller(),
            )?;
        };

        //
        // == MUTATION SAFE ==
        //

        // Insert property value into property value vector
        <EntityById<T>>::mutate(entity_id, |entity| {
            if let Some(entities_rc_to_increment) = property_value.get_involved_entities() {
                Self::increment_entities_rc(&entities_rc_to_increment);
            }
            if let Some(current_prop_value) = entity.values.get_mut(&in_class_schema_property_id) {
                current_prop_value.vec_insert_at(index_in_property_vec, property_value)
            }
        });

        Ok(())
    }

    fn increment_entities_rc(entity_ids: &[T::EntityId]) {
        entity_ids.iter().for_each(|entity_id| {
            <EntityById<T>>::mutate(entity_id, |entity| entity.reference_count += 1)
        });
    }

    fn decrement_entities_rc(entity_ids: &[T::EntityId]) {
        entity_ids.iter().for_each(|entity_id| {
            <EntityById<T>>::mutate(entity_id, |entity| entity.reference_count -= 1)
        });
    }

    /// Returns the stored class if exist, error otherwise.
    fn ensure_class_exists(class_id: T::ClassId) -> Result<Class<T>, &'static str> {
        ensure!(<ClassById<T>>::exists(class_id), ERROR_CLASS_NOT_FOUND);
        Ok(Self::class_by_id(class_id))
    }

    fn get_entity_and_access_level(
        account_id: T::AccountId,
        entity_id: T::EntityId,
        actor_in_group: ActorInGroupId<T>,
    ) -> Result<(Entity<T>, EntityAccessLevel), &'static str> {
        let entity = Self::entity_by_id(entity_id);
        let access_level = EntityAccessLevel::derive_signed(
            &account_id,
            entity_id,
            entity.get_permissions(),
            actor_in_group,
        )?;
        Ok((entity, access_level))
    }

    pub fn get_entity_access_level(
        account_id: T::AccountId,
        entity_id: T::EntityId,
        entity: &Entity<T>,
        actor_in_group: ActorInGroupId<T>,
    ) -> Result<Option<EntityAccessLevel>, &'static str> {
        // If origin is not an authority
        let access_level = if !T::authenticate_authority(&account_id) {
            Some(EntityAccessLevel::derive_signed(
                &account_id,
                entity_id,
                entity.get_permissions(),
                actor_in_group,
            )?)
        } else {
            None
        };
        Ok(access_level)
    }

    pub fn get_entity_and_class(entity_id: T::EntityId) -> (Entity<T>, Class<T>) {
        let entity = <EntityById<T>>::get(entity_id);
        let class = ClassById::get(entity.class_id);
        (entity, class)
    }

    pub fn get_class_id_by_entity_id(entity_id: T::EntityId) -> T::ClassId {
        <EntityById<T>>::get(entity_id).class_id
    }

    pub fn ensure_class_property_type_unlocked_for(
        class_id: T::ClassId,
        in_class_schema_property_id: PropertyId,
        entity_access_level: Option<EntityAccessLevel>,
    ) -> Result<Property<T>, &'static str> {
        let class = Self::class_by_id(class_id);
        // Ensure property values were not locked on class level
        ensure!(
            !class.get_permissions().all_entity_property_values_locked(),
            ERROR_ALL_PROP_WERE_LOCKED_ON_CLASS_LEVEL
        );
        // Get class-level information about this property
        let class_prop = class
            .properties
            .get(in_class_schema_property_id as usize)
            // Throw an error if a property was not found on class
            // by an in-class index of a property.
            .ok_or(ERROR_CLASS_PROP_NOT_FOUND)?;
        ensure!(
            !class_prop.is_locked_from(entity_access_level),
            ERROR_CLASS_PROPERTY_TYPE_IS_LOCKED_FOR_GIVEN_ACTOR
        );
        Ok(class_prop.to_owned())
    }

    pub fn ensure_known_class_id(class_id: T::ClassId) -> dispatch::Result {
        ensure!(<ClassById<T>>::exists(class_id), ERROR_CLASS_NOT_FOUND);
        Ok(())
    }

    pub fn ensure_known_entity_id(entity_id: T::EntityId) -> dispatch::Result {
        ensure!(<EntityById<T>>::exists(entity_id), ERROR_ENTITY_NOT_FOUND);
        Ok(())
    }

    pub fn ensure_rc_is_zero(entity_id: T::EntityId) -> dispatch::Result {
        let entity = Self::entity_by_id(entity_id);
        ensure!(
            entity.reference_count == 0,
            ERROR_ENTITY_REFERENCE_COUNTER_DOES_NOT_EQUAL_TO_ZERO
        );
        Ok(())
    }

    pub fn ensure_entity_creator_exists(
        class_id: T::ClassId,
        group_id: T::GroupId,
    ) -> dispatch::Result {
        ensure!(
            <CanCreateEntitiesOfClass<T>>::exists(class_id, group_id),
            ERROR_ENTITY_CREATOR_DOES_NOT_EXIST
        );
        Ok(())
    }

    pub fn ensure_voucher_limit_not_reached(voucher: EntityCreationVoucher) -> dispatch::Result {
        ensure!(voucher.limit_not_reached(), ERROR_VOUCHER_LIMIT_REACHED);
        Ok(())
    }

    pub fn ensure_entity_creator_does_not_exist(
        class_id: T::ClassId,
        group_id: T::GroupId,
    ) -> dispatch::Result {
        ensure!(
            !<CanCreateEntitiesOfClass<T>>::exists(class_id, group_id),
            ERROR_ENTITY_CREATOR_ALREADY_EXIST
        );
        Ok(())
    }

    pub fn ensure_entity_maintainer_exists(
        entity_id: T::EntityId,
        group_id: T::GroupId,
    ) -> dispatch::Result {
        ensure!(
            <EntityMaintainers<T>>::exists(entity_id, group_id),
            ERROR_ENTITY_MAINTAINER_DOES_NOT_EXIST
        );
        Ok(())
    }

    pub fn ensure_entity_maintainer_does_not_exist(
        entity_id: T::EntityId,
        group_id: T::GroupId,
    ) -> dispatch::Result {
        ensure!(
            !<EntityMaintainers<T>>::exists(entity_id, group_id),
            ERROR_ENTITY_MAINTAINER_ALREADY_EXIST
        );
        Ok(())
    }

    pub fn ensure_entity_creation_voucher_exists(
        class_id: T::ClassId,
        controller: &EntityController<T>,
    ) -> dispatch::Result {
        ensure!(
            <EntityCreationVouchers<T>>::exists(class_id, controller),
            ERROR_ENTITY_CREATION_VOUCHER_DOES_NOT_EXIST
        );
        Ok(())
    }

    pub fn ensure_class_name_is_valid(text: &[u8]) -> dispatch::Result {
        T::ClassNameConstraint::get().ensure_valid(
            text.len(),
            ERROR_CLASS_NAME_TOO_SHORT,
            ERROR_CLASS_NAME_TOO_LONG,
        )
    }

    pub fn ensure_class_description_is_valid(text: &[u8]) -> dispatch::Result {
        T::ClassDescriptionConstraint::get().ensure_valid(
            text.len(),
            ERROR_CLASS_DESCRIPTION_TOO_SHORT,
            ERROR_CLASS_DESCRIPTION_TOO_LONG,
        )
    }

    pub fn ensure_class_limit_not_reached() -> dispatch::Result {
        ensure!(
            T::NumberOfClassesConstraint::get() < <ClassById<T>>::enumerate().count() as MaxNumber,
            ERROR_CLASS_LIMIT_REACHED
        );
        Ok(())
    }

    pub fn ensure_valid_number_of_entities_per_class(
        maximum_entities_count: CreationLimit,
    ) -> dispatch::Result {
        ensure!(
            maximum_entities_count < T::EntitiesCreationConstraint::get(),
            ERROR_ENTITIES_NUMBER_PER_CLASS_CONSTRAINT_VIOLATED
        );
        Ok(())
    }

    pub fn ensure_valid_number_of_class_entities_per_actor(
        per_controller_entity_creation_limit: CreationLimit,
    ) -> dispatch::Result {
        ensure!(
            per_controller_entity_creation_limit < T::IndividualEntitiesCreationConstraint::get(),
            ERROR_NUMBER_OF_CLASS_ENTITIES_PER_ACTOR_CONSTRAINT_VIOLATED
        );
        Ok(())
    }

    pub fn ensure_entities_limits_are_valid(
        maximum_entities_count: CreationLimit,
        per_actor_entities_creation_limit: CreationLimit,
    ) -> dispatch::Result {
        ensure!(
            per_actor_entities_creation_limit < maximum_entities_count,
            ERROR_PER_ACTOR_ENTITIES_CREATION_LIMIT_EXCEEDS_OVERALL_LIMIT
        );
        Self::ensure_valid_number_of_entities_per_class(maximum_entities_count)?;
        Self::ensure_valid_number_of_class_entities_per_actor(per_actor_entities_creation_limit)
    }
}
