// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
#![recursion_limit = "256"]

use codec::{Codec, Decode, Encode};
use rstd::collections::{btree_map::BTreeMap, btree_set::BTreeSet};
use rstd::prelude::*;
use runtime_primitives::traits::{MaybeSerializeDeserialize, Member, One, SimpleArithmetic, Zero};
use srml_support::{
    decl_event, decl_module, decl_storage, dispatch, ensure, traits::Get, Parameter,
    StorageDoubleMap,
};
use std::hash::Hash;
use system::ensure_signed;

#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};

mod errors;
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

/// Type, respresenting inbound entities rc for each entity
type ReferenceCounter = u32;

pub trait Trait: system::Trait + ActorAuthenticator + Debug + Clone {
    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    /// Nonce type is used to avoid data race update conditions, when performing property value vector operations
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

    /// Type of identifier for classes
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

    /// Type of identifier for entities
    type EntityId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + Clone
        + Hash
        + One
        + Zero
        + MaybeSerializeDeserialize
        + Eq
        + PartialEq
        + Ord;

    /// Security/configuration constraints

    /// Type, representing min & max property name length constraints
    type PropertyNameLengthConstraint: Get<InputValidationLengthConstraint>;

    /// Type, representing min & max property description length constraints
    type PropertyDescriptionLengthConstraint: Get<InputValidationLengthConstraint>;

    /// Type, representing min & max class name length constraints
    type ClassNameLengthConstraint: Get<InputValidationLengthConstraint>;

    /// Type, representing min & max class description length constraints
    type ClassDescriptionLengthConstraint: Get<InputValidationLengthConstraint>;

    /// The maximum number of classes
    type MaxNumberOfClasses: Get<MaxNumber>;

    /// The maximum number of maintainers per class constraint
    type MaxNumberOfMaintainersPerClass: Get<MaxNumber>;

    /// The maximum number of curators per group constraint
    type MaxNumberOfCuratorsPerGroup: Get<MaxNumber>;

    /// The maximum number of schemas per class constraint
    type NumberOfSchemasPerClass: Get<MaxNumber>;

    /// The maximum number of properties per class constraint
    type MaxNumberOfPropertiesPerClass: Get<MaxNumber>;

    /// The maximum number of operations during single invocation of `transaction`
    type MaxNumberOfOperationsDuringAtomicBatching: Get<MaxNumber>;

    /// The maximum length of vector property value constarint
    type VecMaxLengthConstraint: Get<VecMaxLength>;

    /// The maximum length of text property value constarint
    type TextMaxLengthConstraint: Get<TextMaxLength>;

    /// Entities creation constraint per class
    type MaxNumberOfEntitiesPerClass: Get<Self::EntityId>;

    /// Entities creation constraint per individual
    type IndividualEntitiesCreationLimit: Get<Self::EntityId>;
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

/// Structure, representing `inbound_entity_rcs` & `inbound_same_owner_entity_rcs` mappings to their respective count for each referenced entity id
pub struct EntitiesRc<T: Trait> {
    /// Entities, which inbound same owner rc should be changed
    pub inbound_entity_rcs: BTreeMap<T::EntityId, ReferenceCounter>,

    /// Entities, which rc should be changed (only includes entity ids, which are not in inbound_entity_rcs already)
    pub inbound_same_owner_entity_rcs: BTreeMap<T::EntityId, ReferenceCounter>,
}

impl<T: Trait> Default for EntitiesRc<T> {
    fn default() -> Self {
        Self {
            inbound_entity_rcs: BTreeMap::default(),
            inbound_same_owner_entity_rcs: BTreeMap::default(),
        }
    }
}

impl<T: Trait> EntitiesRc<T> {
    /// Fill in one of inbound entity rcs mappings, based on `same_owner` flag provided
    fn fill_in_entity_rcs(&mut self, entity_ids: Vec<T::EntityId>, same_owner: bool) {
        let inbound_entity_rcs = if same_owner {
            &mut self.inbound_same_owner_entity_rcs
        } else {
            &mut self.inbound_entity_rcs
        };

        for entity_id in entity_ids {
            *inbound_entity_rcs.entry(entity_id).or_insert(0) += 1;
        }
    }

    /// Traverse `inbound_entity_rcs` & `inbound_same_owner_entity_rcs`,
    /// increasing each `Entity` respective reference counters
    fn increase_entity_rcs(self) {
        self.inbound_same_owner_entity_rcs
            .iter()
            .for_each(|(entity_id, rc)| {
                Module::<T>::increase_entity_rcs(entity_id, *rc, true);
            });
        self.inbound_entity_rcs.iter().for_each(|(entity_id, rc)| {
            Module::<T>::increase_entity_rcs(entity_id, *rc, false);
        });
    }

    /// Traverse `inbound_entity_rcs` & `inbound_same_owner_entity_rcs`,
    /// decreasing each `Entity` respective reference counters
    fn decrease_entity_rcs(self) {
        self.inbound_same_owner_entity_rcs
            .iter()
            .for_each(|(entity_id, rc)| {
                Module::<T>::decrease_entity_rcs(entity_id, *rc, true);
            });
        self.inbound_entity_rcs.iter().for_each(|(entity_id, rc)| {
            Module::<T>::decrease_entity_rcs(entity_id, *rc, false);
        });
    }
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
    class_permissions: ClassPermissions<T>,
    /// All properties that have been used on this class across different class schemas.
    /// Unlikely to be more than roughly 20 properties per class, often less.
    /// For Person, think "height", "weight", etc.
    pub properties: Vec<Property<T>>,

    /// All schemas that are available for this class, think v0.0 Person, v.1.0 Person, etc.
    pub schemas: Vec<Schema>,

    pub name: Vec<u8>,

    pub description: Vec<u8>,

    /// The maximum number of entities which can be created.
    maximum_entities_count: T::EntityId,

    /// The current number of entities which exist.
    current_number_of_entities: T::EntityId,

    /// How many entities a given controller may create at most.
    default_entity_creation_voucher_upper_bound: T::EntityId,
}

impl<T: Trait> Default for Class<T> {
    fn default() -> Self {
        Self {
            class_permissions: ClassPermissions::<T>::default(),
            properties: vec![],
            schemas: vec![],
            name: vec![],
            description: vec![],
            maximum_entities_count: T::EntityId::default(),
            current_number_of_entities: T::EntityId::default(),
            default_entity_creation_voucher_upper_bound: T::EntityId::default(),
        }
    }
}

impl<T: Trait> Class<T> {
    /// Create new `Class` with provided parameters
    fn new(
        class_permissions: ClassPermissions<T>,
        name: Vec<u8>,
        description: Vec<u8>,
        maximum_entities_count: T::EntityId,
        default_entity_creation_voucher_upper_bound: T::EntityId,
    ) -> Self {
        Self {
            class_permissions,
            properties: vec![],
            schemas: vec![],
            name,
            description,
            maximum_entities_count,
            current_number_of_entities: T::EntityId::zero(),
            default_entity_creation_voucher_upper_bound,
        }
    }

    /// Used to update `Schema` status under given `schema_index`
    fn update_schema_status(&mut self, schema_index: SchemaId, schema_status: bool) {
        // Such indexing is safe, when length bounds were previously checked
        self.schemas[schema_index as usize].set_status(schema_status);
    }

    /// Used to update `Class` permissions
    fn update_permissions(&mut self, permissions: ClassPermissions<T>) {
        self.class_permissions = permissions
    }

    /// Increment number of entities, associated with this class
    fn increment_entities_count(&mut self) {
        self.current_number_of_entities += T::EntityId::one();
    }

    /// Decrement number of entities, associated with this class
    fn decrement_entities_count(&mut self) {
        self.current_number_of_entities -= T::EntityId::one();
    }

    /// Retrieve `ClassPermissions` by mutable reference
    fn get_permissions_mut(&mut self) -> &mut ClassPermissions<T> {
        &mut self.class_permissions
    }

    /// Retrieve `ClassPermissions` by reference
    fn get_permissions_ref(&self) -> &ClassPermissions<T> {
        &self.class_permissions
    }

    /// Retrieve `ClassPermissions` by value
    fn get_permissions(self) -> ClassPermissions<T> {
        self.class_permissions
    }

    /// Retrieve `Class` properties by value  
    fn get_properties(self) -> Vec<Property<T>> {
        self.properties
    }

    /// Get per controller `Class`- specific limit
    pub fn get_default_entity_creation_voucher_upper_bound(&self) -> T::EntityId {
        self.default_entity_creation_voucher_upper_bound
    }

    /// Retrive the maximum entities count, which can be created for given `Class`
    pub fn get_maximum_entities_count(&self) -> T::EntityId {
        self.maximum_entities_count
    }

    /// Ensure `Class` `Schema` under given index exist, return corresponding `Schema`
    fn ensure_schema_exists(&self, schema_index: SchemaId) -> Result<&Schema, &'static str> {
        self.schemas
            .get(schema_index as usize)
            .map(|schema| schema)
            .ok_or(ERROR_UNKNOWN_CLASS_SCHEMA_ID)
    }

    /// Ensure `schema_id` is a valid index of `Class` schemas vector
    pub fn ensure_schema_id_exists(&self, schema_id: SchemaId) -> dispatch::Result {
        ensure!(
            schema_id < self.schemas.len() as SchemaId,
            ERROR_UNKNOWN_CLASS_SCHEMA_ID
        );
        Ok(())
    }

    /// Ensure `Schema`s limit per `Class` not reached
    pub fn ensure_schemas_limit_not_reached(&self) -> dispatch::Result {
        ensure!(
            T::NumberOfSchemasPerClass::get() < self.schemas.len() as MaxNumber,
            ERROR_CLASS_SCHEMAS_LIMIT_REACHED
        );
        Ok(())
    }

    /// Ensure properties limit per `Class` not reached
    pub fn ensure_properties_limit_not_reached(
        &self,
        new_properties: &[Property<T>],
    ) -> dispatch::Result {
        ensure!(
            T::MaxNumberOfPropertiesPerClass::get()
                <= (self.properties.len() + new_properties.len()) as MaxNumber,
            ERROR_CLASS_PROPERTIES_LIMIT_REACHED
        );
        Ok(())
    }

    /// Ensure `Class` specific entities limit not reached
    pub fn ensure_maximum_entities_count_limit_not_reached(&self) -> dispatch::Result {
        ensure!(
            self.current_number_of_entities < self.maximum_entities_count,
            ERROR_MAX_NUMBER_OF_ENTITIES_PER_CLASS_LIMIT_REACHED
        );
        Ok(())
    }

    /// Ensure `Property` under given `PropertyId` is unlocked from actor with given `EntityAccessLevel`
    /// return corresponding `Property` by value
    pub fn ensure_class_property_type_unlocked_from(
        &self,
        in_class_schema_property_id: PropertyId,
        entity_access_level: EntityAccessLevel,
    ) -> Result<Property<T>, &'static str> {
        self.ensure_property_values_unlocked()?;

        // Get class-level information about this `Property`
        let class_property = self
            .properties
            .get(in_class_schema_property_id as usize)
            // Throw an error if a property was not found on class
            // by an in-class index of a property.
            .ok_or(ERROR_CLASS_PROP_NOT_FOUND)?;

        class_property.ensure_unlocked_from(entity_access_level)?;

        Ok(class_property.to_owned())
    }

    /// Ensure property values were not locked on `Class` level
    pub fn ensure_property_values_unlocked(&self) -> dispatch::Result {
        ensure!(
            !self
                .get_permissions_ref()
                .all_entity_property_values_locked(),
            ERROR_ALL_PROP_WERE_LOCKED_ON_CLASS_LEVEL
        );
        Ok(())
    }
}

/// Represents `Entity`, related to a specific `Class`
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct Entity<T: Trait> {
    /// Permissions for an instance of an Entity.
    pub entity_permissions: EntityPermissions<T>,

    /// The class id of this entity.
    pub class_id: T::ClassId,

    /// What schemas under which this entity of a class is available, think
    /// v.2.0 Person schema for John, v3.0 Person schema for John
    /// Unlikely to be more than roughly 20ish, assuming schemas for a given class eventually stableize, or that very old schema are eventually removed.
    pub supported_schemas: BTreeSet<SchemaId>, // indices of schema in corresponding class

    /// Values for properties on class that are used by some schema used by this entity!
    /// Length is no more than Class.properties.
    pub values: BTreeMap<PropertyId, PropertyValue<T>>,

    /// Number of property values referencing current entity
    pub reference_count: ReferenceCounter,

    /// Number of inbound references from another entities with `SameOwner`flag set
    pub inbound_same_owner_references_from_other_entities_count: ReferenceCounter,
}

impl<T: Trait> Default for Entity<T> {
    fn default() -> Self {
        Self {
            entity_permissions: EntityPermissions::<T>::default(),
            class_id: T::ClassId::default(),
            supported_schemas: BTreeSet::new(),
            values: BTreeMap::new(),
            reference_count: 0,
            inbound_same_owner_references_from_other_entities_count: 0,
        }
    }
}

impl<T: Trait> Entity<T> {
    /// Create new `Entity` instance, related to a given `class_id` with provided parameters,  
    fn new(
        controller: EntityController<T>,
        class_id: T::ClassId,
        supported_schemas: BTreeSet<SchemaId>,
        values: BTreeMap<PropertyId, PropertyValue<T>>,
    ) -> Self {
        Self {
            entity_permissions: EntityPermissions::<T>::default_with_controller(controller),
            class_id,
            supported_schemas,
            values,
            reference_count: 0,
            inbound_same_owner_references_from_other_entities_count: 0,
        }
    }

    /// Get `values` by reference
    fn get_values_ref(&self) -> &BTreeMap<PropertyId, PropertyValue<T>> {
        &self.values
    }

    /// Get mutable `EntityPermissions` reference, related to given `Entity`
    fn get_permissions_mut(&mut self) -> &mut EntityPermissions<T> {
        &mut self.entity_permissions
    }

    /// Get `EntityPermissions` reference, related to given `Entity`
    fn get_permissions_ref(&self) -> &EntityPermissions<T> {
        &self.entity_permissions
    }

    /// Get `EntityPermissions`, related to given `Entity` by value
    fn get_permissions(self) -> EntityPermissions<T> {
        self.entity_permissions
    }

    /// Update existing `EntityPermissions` with newly provided
    pub fn update_permissions(&mut self, permissions: EntityPermissions<T>) {
        self.entity_permissions = permissions
    }

    /// Ensure `Schema` under given id is not yet added to given `Entity`
    pub fn ensure_schema_id_is_not_added(&self, schema_id: SchemaId) -> dispatch::Result {
        let schema_not_added = !self.supported_schemas.contains(&schema_id);
        ensure!(schema_not_added, ERROR_SCHEMA_ALREADY_ADDED_TO_ENTITY);
        Ok(())
    }

    /// Ensure PropertyValue under given `in_class_schema_property_id` is Vector
    fn ensure_property_value_is_vec(
        &self,
        in_class_schema_property_id: PropertyId,
    ) -> Result<&VecPropertyValue<T>, &'static str> {
        self.values
            .get(&in_class_schema_property_id)
            // Throw an error if a property was not found on entity
            // by an in-class index of a property.
            .ok_or(ERROR_UNKNOWN_ENTITY_PROP_ID)?
            .as_vec_property_value()
            // Ensure prop value under given class schema property id is vector
            .ok_or(ERROR_PROP_VALUE_UNDER_GIVEN_INDEX_IS_NOT_A_VECTOR)
    }

    /// Ensure any `PropertyValue` from external entity does not point to the given `Entity`
    pub fn ensure_rc_is_zero(&self) -> dispatch::Result {
        ensure!(
            self.reference_count == 0,
            ERROR_ENTITY_RC_DOES_NOT_EQUAL_TO_ZERO
        );
        Ok(())
    }

    /// Ensure any inbound `PropertyValue` points to the given `Entity`
    pub fn ensure_inbound_same_owner_rc_is_zero(&self) -> dispatch::Result {
        ensure!(
            self.inbound_same_owner_references_from_other_entities_count == 0,
            ERROR_ENTITY_RC_DOES_NOT_EQUAL_TO_ZERO
        );
        Ok(())
    }
}

decl_storage! {
    trait Store for Module<T: Trait> as ContentDirectory {

        /// Map, representing  CuratorGroupId -> CuratorGroup relation
        pub CuratorGroupById get(curator_group_by_id): map T::CuratorGroupId => CuratorGroup<T>;

        /// Map, representing ClassId -> Class relation
        pub ClassById get(class_by_id) config(): linked_map T::ClassId => Class<T>;

        /// Map, representing EntityId -> Entity relation
        pub EntityById get(entity_by_id) config(): map T::EntityId => Entity<T>;

        /// Next runtime storage values used to maintain next id value, used on creation of respective curator groups, classes and entities

        pub NextCuratorGroupId get(next_curator_group_id) config(): T::CuratorGroupId;

        pub NextClassId get(next_class_id) config(): T::ClassId;

        pub NextEntityId get(next_entity_id) config(): T::EntityId;

        // The voucher associated with entity creation for a given class and controller.
        // Is updated whenever an entity is created in a given class by a given controller.
        // Constraint is updated by Root, an initial value comes from `ClassPermissions::default_entity_creation_voucher_upper_bound`.
        pub EntityCreationVouchers get(entity_creation_vouchers): double_map hasher(blake2_128) T::ClassId, blake2_128(EntityController<T>) => EntityCreationVoucher<T>;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        // ======
        // Next set of extrinsics can only be invoked by lead.
        // ======

        // Initializing events
        fn deposit_event() = default;

        /// Add new curator group to runtime storage
        pub fn add_curator_group(
            origin,
        ) -> dispatch::Result {

            ensure_is_lead::<T>(origin)?;

            //
            // == MUTATION SAFE ==
            //

            let curator_group_id = Self::next_curator_group_id();

            // Insert empty curator group with `active` parameter set to false
            <CuratorGroupById<T>>::insert(curator_group_id, CuratorGroup::<T>::default());

            // Increment the next curator curator_group_id:
            <NextCuratorGroupId<T>>::mutate(|n| *n += T::CuratorGroupId::one());

            // Trigger event
            Self::deposit_event(RawEvent::CuratorGroupAdded(curator_group_id));
            Ok(())
        }

        /// Remove curator group under given `curator_group_id` from runtime storage
        pub fn remove_curator_group(
            origin,
            curator_group_id: T::CuratorGroupId,
        ) -> dispatch::Result {

            ensure_is_lead::<T>(origin)?;

            let curator_group = Self::ensure_curator_group_exists(&curator_group_id)?;

            curator_group.ensure_curator_group_maintains_no_classes()?;

            //
            // == MUTATION SAFE ==
            //


            // Remove curator group under given curator group id from runtime storage
            <CuratorGroupById<T>>::remove(curator_group_id);

            // Trigger event
            Self::deposit_event(RawEvent::CuratorGroupRemoved(curator_group_id));
            Ok(())
        }

        /// Set `is_active` status for curator group under given `curator_group_id`
        pub fn set_curator_group_status(
            origin,
            curator_group_id: T::CuratorGroupId,
            is_active: bool,
        ) -> dispatch::Result {

            ensure_is_lead::<T>(origin)?;

            Self::ensure_curator_group_under_given_id_exists(&curator_group_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Mutate curator group status
            <CuratorGroupById<T>>::mutate(curator_group_id, |curator_group| {
                curator_group.set_status(is_active)
            });

            // Trigger event
            Self::deposit_event(RawEvent::CuratorGroupStatusSet(is_active));
            Ok(())
        }

        /// Add curator to curator group under given `curator_group_id`
        pub fn add_curator_to_group(
            origin,
            curator_group_id: T::CuratorGroupId,
            curator_id: T::CuratorId,
        ) -> dispatch::Result {

            ensure_is_lead::<T>(origin)?;

            let curator_group = Self::ensure_curator_group_exists(&curator_group_id)?;

            curator_group.ensure_max_number_of_curators_limit_not_reached()?;

            //
            // == MUTATION SAFE ==
            //

            // Insert curator_id into curator_group under given curator_group_id
            <CuratorGroupById<T>>::mutate(curator_group_id, |curator_group| {
                curator_group.get_curators_mut().insert(curator_id);
            });

            // Trigger event
            Self::deposit_event(RawEvent::CuratorAdded(curator_group_id, curator_id));
            Ok(())
        }

        /// Remove curator from a given curator group
        pub fn remove_curator_from_group(
            origin,
            curator_group_id: T::CuratorGroupId,
            curator_id: T::CuratorId,
        ) -> dispatch::Result {

            ensure_is_lead::<T>(origin)?;

            let curator_group = Self::ensure_curator_group_exists(&curator_group_id)?;

            curator_group.ensure_curator_in_group_exists(&curator_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Remove curator_id from curator_group under given curator_group_id
            <CuratorGroupById<T>>::mutate(curator_group_id, |curator_group| {
                curator_group.get_curators_mut().remove(&curator_id);
            });

            // Trigger event
            Self::deposit_event(RawEvent::CuratorRemoved(curator_group_id, curator_id));
            Ok(())
        }

        /// Add curator group under given `curator_group_id` as `Class` maintainer
        pub fn add_maintainer_to_class(
            origin,
            class_id: T::ClassId,
            curator_group_id: T::CuratorGroupId,
        ) -> dispatch::Result {

            ensure_is_lead::<T>(origin)?;

            let class = Self::ensure_known_class_id(class_id)?;

            Self::ensure_curator_group_under_given_id_exists(&curator_group_id)?;

            let class_permissions = class.get_permissions_ref();

            Self::ensure_maintainers_limit_not_reached(class_permissions.get_maintainers())?;

            class_permissions.ensure_maintainer_does_not_exist(&curator_group_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Insert `curator_group_id` into `maintainers` set, associated with given `Class`
            <ClassById<T>>::mutate(class_id, |class|
                class.get_permissions_mut().get_maintainers_mut().insert(curator_group_id)
            );

            // Increment the number of classes, curator group under given `curator_group_id` maintains
            <CuratorGroupById<T>>::mutate(curator_group_id, |curator_group| {
                curator_group.increment_number_of_classes_maintained_count();
            });

            // Trigger event
            Self::deposit_event(RawEvent::MaintainerAdded(class_id, curator_group_id));
            Ok(())
        }

        /// Remove curator group under given `curator_group_id` from `Class` maintainers set
        pub fn remove_maintainer_from_class(
            origin,
            class_id: T::ClassId,
            curator_group_id: T::CuratorGroupId,
        ) -> dispatch::Result {

            ensure_is_lead::<T>(origin)?;

            let class = Self::ensure_known_class_id(class_id)?;

            class.get_permissions_ref().ensure_maintainer_exists(&curator_group_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Remove `curator_group_id` from `maintainers` set, associated with given `Class`
            <ClassById<T>>::mutate(class_id, |class|
                class.get_permissions_mut().get_maintainers_mut().remove(&curator_group_id)
            );

            // Decrement the number of classes, curator group under given `curator_group_id` maintains
            <CuratorGroupById<T>>::mutate(curator_group_id, |curator_group| {
                curator_group.decrement_number_of_classes_maintained_count();
            });

            // Trigger event
            Self::deposit_event(RawEvent::MaintainerRemoved(class_id, curator_group_id));
            Ok(())
        }

        /// Updates or creates new `EntityCreationVoucher` for given `EntityController` with individual limit
        pub fn update_entity_creation_voucher(
            origin,
            class_id: T::ClassId,
            controller: EntityController<T>,
            maximum_entities_count: T::EntityId
        ) -> dispatch::Result {

            ensure_is_lead::<T>(origin)?;

            Self::ensure_known_class_id(class_id)?;

            // Check voucher existance
            let voucher_exists = <EntityCreationVouchers<T>>::exists(class_id, &controller);


            Self::ensure_valid_number_of_class_entities_per_actor_constraint(maximum_entities_count)?;

            //
            // == MUTATION SAFE ==
            //

            if voucher_exists {
                <EntityCreationVouchers<T>>::mutate(class_id, &controller, |entity_creation_voucher| {
                    entity_creation_voucher.set_maximum_entities_count(maximum_entities_count);

                    // Trigger event
                    Self::deposit_event(RawEvent::EntityCreationVoucherUpdated(controller.clone(), entity_creation_voucher.to_owned()))
                });
            } else {
                let entity_creation_voucher = EntityCreationVoucher::new(maximum_entities_count);

                // Add newly created `EntityCreationVoucher` into `EntityCreationVouchers` runtime storage under given `class_id`, `controller` key
                <EntityCreationVouchers<T>>::insert(class_id, controller.clone(), entity_creation_voucher.clone());

                // Trigger event
                Self::deposit_event(RawEvent::EntityCreationVoucherCreated(controller, entity_creation_voucher));
            }

            Ok(())
        }

        /// Create new `Class` with provided parameters
        pub fn create_class(
            origin,
            name: Vec<u8>,
            description: Vec<u8>,
            class_permissions: ClassPermissions<T>,
            maximum_entities_count: T::EntityId,
            default_entity_creation_voucher_upper_bound: T::EntityId
        ) -> dispatch::Result {

            ensure_is_lead::<T>(origin)?;

            Self::ensure_entities_creation_limits_are_valid(maximum_entities_count, default_entity_creation_voucher_upper_bound)?;

            Self::ensure_class_limit_not_reached()?;

            Self::ensure_class_name_is_valid(&name)?;
            Self::ensure_class_description_is_valid(&description)?;
            Self::ensure_class_permissions_are_valid(&class_permissions)?;

            let class_id = Self::next_class_id();

            let class = Class::new(class_permissions, name, description, maximum_entities_count, default_entity_creation_voucher_upper_bound);

            //
            // == MUTATION SAFE ==
            //

            // Add new `Class` to runtime storage
            <ClassById<T>>::insert(&class_id, class);

            // Increment the next class id:
            <NextClassId<T>>::mutate(|n| *n += T::ClassId::one());

            // Trigger event
            Self::deposit_event(RawEvent::ClassCreated(class_id));
            Ok(())
        }

        /// Update `ClassPermissions` under specific `class_id`
        pub fn update_class_permissions(
            origin,
            class_id: T::ClassId,
            updated_any_member: Option<bool>,
            updated_entity_creation_blocked: Option<bool>,
            updated_all_entity_property_values_locked: Option<bool>,
            updated_maintainers: Option<BTreeSet<T::CuratorGroupId>>,
        ) -> dispatch::Result {

            ensure_is_lead::<T>(origin)?;

            let class = Self::ensure_known_class_id(class_id)?;

            if let Some(ref updated_maintainers) = updated_maintainers {
                Self::ensure_curator_groups_exist(updated_maintainers)?;
                Self::ensure_maintainers_limit_not_reached(updated_maintainers)?;
            }

            let class_permissions = class.get_permissions();
            let updated_class_permissions = Self::make_updated_class_permissions(
                class_permissions, updated_any_member, updated_entity_creation_blocked,
                updated_all_entity_property_values_locked, updated_maintainers
            );

            //
            // == MUTATION SAFE ==
            //

            // If class_permissions update has been performed
            if let Some(updated_class_permissions) = updated_class_permissions  {

                // Update `class_permissions` under given class id
                <ClassById<T>>::mutate(class_id, |class| {
                    class.update_permissions(updated_class_permissions)
                });

                // Trigger event
                Self::deposit_event(RawEvent::ClassPermissionsUpdated(class_id));
            }

            Ok(())
        }

        /// Create new class schema from existing property ids and new properties
        pub fn add_class_schema(
            origin,
            class_id: T::ClassId,
            existing_properties: BTreeSet<PropertyId>,
            new_properties: Vec<Property<T>>
        ) -> dispatch::Result {

            ensure_is_lead::<T>(origin)?;

            let class = Self::ensure_known_class_id(class_id)?;

            class.ensure_schemas_limit_not_reached()?;

            Self::ensure_non_empty_schema(&existing_properties, &new_properties)?;

            class.ensure_properties_limit_not_reached(&new_properties)?;

            Self::ensure_all_properties_are_valid(&new_properties)?;

            let class_properties = class.get_properties();

            Self::ensure_all_property_names_are_unique(&class_properties, &new_properties)?;

            Self::ensure_schema_properties_are_valid_indices(&existing_properties, &class_properties)?;

            let schema = Self::create_class_schema(existing_properties, &class_properties, &new_properties);

            // Update class properties after new `Schema` added
            let updated_class_properties = Self::update_class_properties(class_properties, new_properties);

            //
            // == MUTATION SAFE ==
            //

            // Update class properties and schemas
            <ClassById<T>>::mutate(class_id, |class| {
                class.properties = updated_class_properties;
                class.schemas.push(schema);

                let schema_id = class.schemas.len() - 1;

                // Trigger event
                Self::deposit_event(RawEvent::ClassSchemaAdded(class_id, schema_id as SchemaId));
            });

            Ok(())
        }

        /// Update `schema_status` under specific `schema_id` in `Class`
        pub fn update_class_schema_status(
            origin,
            class_id: T::ClassId,
            schema_id: SchemaId,
            schema_status: bool
        ) -> dispatch::Result {

            ensure_is_lead::<T>(origin)?;

            let class = Self::ensure_known_class_id(class_id)?;

            class.ensure_schema_id_exists(schema_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Update class schema status
            <ClassById<T>>::mutate(class_id, |class| {
                class.update_schema_status(schema_id, schema_status)
            });

            // Trigger event
            Self::deposit_event(RawEvent::ClassSchemaStatusUpdated(class_id, schema_id, schema_status));
            Ok(())
        }

        /// Update entity permissions.
        pub fn update_entity_permissions(
            origin,
            entity_id: T::EntityId,
            updated_frozen_for_controller: Option<bool>,
            updated_referenceable: Option<bool>
        ) -> dispatch::Result {

            // Ensure given origin is lead
            ensure_is_lead::<T>(origin)?;

            let entity = Self::ensure_known_entity_id(entity_id)?;

            let mut entity_permissions = entity.get_permissions();

            //
            // == MUTATION SAFE ==
            //

            // If no update performed, there is no purpose to emit event
            let mut updated = false;

            if let Some(updated_frozen_for_controller) = updated_frozen_for_controller {
                entity_permissions.set_frozen(updated_frozen_for_controller);
                updated = true;
            }

            if let Some(updated_referenceable) = updated_referenceable {
                entity_permissions.set_referencable(updated_referenceable);
                updated = true;
            }

            if updated {

                // Update entity permissions under given entity id
                <EntityById<T>>::mutate(entity_id, |entity| {
                    entity.update_permissions(entity_permissions)
                });

                // Trigger event
                Self::deposit_event(RawEvent::EntityPermissionsUpdated(entity_id));
            }
            Ok(())
        }

        /// Transfer ownership to new `EntityController` for `Entity` under given `entity_id`
        /// If `Entity` has `PropertyValue` references with `SameOwner` flag activated, each `Entity` ownership
        /// will be transfered to `new_controller`
        pub fn transfer_entity_ownership(
            origin,
            entity_id: T::EntityId,
            new_controller: EntityController<T>,
        ) -> dispatch::Result {

            ensure_is_lead::<T>(origin)?;

            let (entity, class) = Self::ensure_entity_and_class(entity_id)?;

            entity.ensure_inbound_same_owner_rc_is_zero()?;

            //
            // == MUTATION SAFE ==
            //

            // Set of all entities, which controller should be updated after ownership transfer performed
            let mut entities = BTreeSet::new();

            // Insert root entity_id into entities set
            entities.insert(entity_id);

            Self::retrieve_all_entities_to_perform_ownership_transfer(&class, entity, &mut entities);

            // Perform ownership transfer of all involved entities
            entities.into_iter().for_each(|involved_entity_id| {
                <EntityById<T>>::mutate(involved_entity_id, |inner_entity|
                    inner_entity.get_permissions_mut().set_conroller(new_controller.clone())
                );
            });

            // Trigger event
            Self::deposit_event(RawEvent::EntityOwnershipTransfered(entity_id, new_controller));

            Ok(())
        }

        // ======
        // The next set of extrinsics can be invoked by anyone who can properly sign for provided value of `Actor<T>`.
        // ======

        /// Create an entity.
        /// If someone is making an entity of this class for first time,
        /// then a voucher is also added with the class limit as the default limit value.
        /// class limit default value.
        pub fn create_entity(
            origin,
            class_id: T::ClassId,
            actor: Actor<T>,
        ) -> dispatch::Result {

            let account_id = ensure_signed(origin)?;

            let class = Self::ensure_class_exists(class_id)?;

            // Ensure maximum entities limit per class not reached
            class.ensure_maximum_entities_count_limit_not_reached()?;

            let class_permissions = class.get_permissions_ref();

            // Ensure actor can create entities

            class_permissions.ensure_entity_creation_not_blocked()?;
            class_permissions.ensure_can_create_entities(&account_id, &actor)?;

            let entity_controller = EntityController::from_actor(&actor);

            // Check if entity creation voucher exists
            let voucher_exists = if <EntityCreationVouchers<T>>::exists(class_id, &entity_controller) {
                // Ensure voucher limit not reached
                Self::entity_creation_vouchers(class_id, &entity_controller).ensure_voucher_limit_not_reached()?;
                true
            } else {
                false
            };

            //
            // == MUTATION SAFE ==
            //

            // Create voucher, update if exists

            if voucher_exists {
                // Increment number of created entities count, if voucher already exist
                <EntityCreationVouchers<T>>::mutate(class_id, &entity_controller, |entity_creation_voucher| {
                    entity_creation_voucher.increment_created_entities_count()
                });
            } else {
                // Create new voucher for given entity creator with default limit and increment created entities count
                let mut entity_creation_voucher = EntityCreationVoucher::new(class.get_default_entity_creation_voucher_upper_bound());
                entity_creation_voucher.increment_created_entities_count();
                <EntityCreationVouchers<T>>::insert(class_id, entity_controller.clone(), entity_creation_voucher);
            }

            // Create new entity

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

            // Trigger event
            Self::deposit_event(RawEvent::EntityCreated(actor, entity_id));
            Ok(())
        }

        /// Remove `Entity` under provided `entity_id`
        pub fn remove_entity(
            origin,
            actor: Actor<T>,
            entity_id: T::EntityId,
        ) -> dispatch::Result {

            let (_, entity, access_level) = Self::ensure_class_entity_and_access_level(origin, entity_id, &actor)?;

            EntityPermissions::<T>::ensure_group_can_remove_entity(access_level)?;

           entity.ensure_rc_is_zero()?;

            //
            // == MUTATION SAFE ==
            //

            // Remove entity
            <EntityById<T>>::remove(entity_id);

            // Decrement class entities counter
            <ClassById<T>>::mutate(entity.class_id, |class| class.decrement_entities_count());

            let entity_controller =  EntityController::<T>::from_actor(&actor);

            // Decrement entity_creation_voucher after entity removal perfomed
            <EntityCreationVouchers<T>>::mutate(entity.class_id, entity_controller, |entity_creation_voucher| {
                entity_creation_voucher.decrement_created_entities_count();
            });

            // Trigger event
            Self::deposit_event(RawEvent::EntityRemoved(actor, entity_id));
            Ok(())
        }

        /// Add schema support to entity under given shema_id and provided `property_values`
        pub fn add_schema_support_to_entity(
            origin,
            actor: Actor<T>,
            entity_id: T::EntityId,
            schema_id: SchemaId,
            property_values: BTreeMap<PropertyId, PropertyValue<T>>
        ) -> dispatch::Result {

            let (class, entity, _) = Self::ensure_class_entity_and_access_level(origin, entity_id, &actor)?;

            entity.ensure_schema_id_is_not_added(schema_id)?;

            let schema = class.ensure_schema_exists(schema_id)?;

            schema.ensure_is_active()?;

            let entity_values = entity.get_values_ref();

            // Updated entity values, after new schema support added
            let mut entity_values_updated = entity.values.clone();

            // Entities, which rc should be incremented
            let mut entity_ids_to_increase_rcs = EntitiesRc::<T>::default();

            for prop_id in schema.get_properties().iter() {
                if entity_values.contains_key(prop_id) {
                    // A property is already added to the entity and cannot be updated
                    // while adding a schema support to this entity.
                    continue;
                }

                // Indexing is safe, class shoud always maintain such constistency
                let class_property = &class.properties[*prop_id as usize];

                Self::add_new_property_value(
                    class_property, &entity, *prop_id,
                    &property_values, &mut entity_ids_to_increase_rcs, &mut entity_values_updated
                )?;
            }

            //
            // == MUTATION SAFE ==
            //

            // Add schema support to `Entity` under given `entity_id`
            <EntityById<T>>::mutate(entity_id, |entity| {

                // Add a new schema to the list of schemas supported by this entity.
                entity.supported_schemas.insert(schema_id);

                // Update entity values only if new properties have been added.
                if entity_values_updated.len() > entity.values.len() {
                    entity.values = entity_values_updated;
                }
            });

            entity_ids_to_increase_rcs.increase_entity_rcs();

            // Trigger event
            Self::deposit_event(RawEvent::EntitySchemaSupportAdded(actor, entity_id, schema_id));
            Ok(())
        }

        /// Update `Entity` `PropertyValue`'s with provided ones
        pub fn update_entity_property_values(
            origin,
            actor: Actor<T>,
            entity_id: T::EntityId,
            new_property_values: BTreeMap<PropertyId, PropertyValue<T>>
        ) -> dispatch::Result {

            let (class, entity, access_level) = Self::ensure_class_entity_and_access_level(origin, entity_id, &actor)?;

            class.ensure_property_values_unlocked()?;

            // Get current property values of an entity,
            // so we can update them if new values provided present in new_property_values.
            let mut updated_values = entity.values.clone();
            let mut updated = false;

            // Entities, which rc should be incremented
            let mut entity_ids_to_increase_rcs = EntitiesRc::<T>::default();

            // Entities, which rc should be decremented
            let mut entity_ids_to_decrease_rcs = EntitiesRc::<T>::default();

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

                // Skip update if new value is equal to the current one or class property type
                // is locked for update from current actor
                if new_value != *current_prop_value {

                    // Get class-level information about this property
                    if let Some(class_property) = class.properties.get(id as usize) {

                        class_property.ensure_unlocked_from(access_level)?;

                        class_property.ensure_property_value_to_update_is_valid(
                            &new_value,
                            entity.get_permissions_ref().get_controller(),
                        )?;

                        Self::fill_in_involved_entity_ids_rcs(
                            &new_value, current_prop_value, class_property.property_type.same_controller_status(),
                            &mut entity_ids_to_increase_rcs, &mut entity_ids_to_decrease_rcs
                        );

                        current_prop_value.update(new_value);

                        updated = true;
                    }
                }
            }

            //
            // == MUTATION SAFE ==
            //

            // If property values should be updated
            if updated {

                <EntityById<T>>::mutate(entity_id, |entity| {
                    entity.values = updated_values;
                });

                entity_ids_to_increase_rcs.increase_entity_rcs();

                entity_ids_to_decrease_rcs.decrease_entity_rcs();

                // Trigger event
                Self::deposit_event(RawEvent::EntityPropertyValuesUpdated(actor, entity_id));
            }

            Ok(())
        }

        /// Clear `PropertyValueVec` under given `entity_id` & `in_class_schema_property_id`
        pub fn clear_entity_property_vector(
            origin,
            actor: Actor<T>,
            entity_id: T::EntityId,
            in_class_schema_property_id: PropertyId
        ) -> dispatch::Result {

            let (class, entity, access_level) = Self::ensure_class_entity_and_access_level(origin, entity_id, &actor)?;

            let current_property_value_vec =
                entity.ensure_property_value_is_vec(in_class_schema_property_id)?;

            let property = class.ensure_class_property_type_unlocked_from(
                in_class_schema_property_id,
                access_level,
            )?;

            let entity_ids_to_decrease_rcs = current_property_value_vec
                .get_vec_value()
                .get_involved_entities();

            //
            // == MUTATION SAFE ==
            //

            // Clear property value vector
            <EntityById<T>>::mutate(entity_id, |entity| {
                if let Some(PropertyValue::Vector(current_property_value_vec)) =
                    entity.values.get_mut(&in_class_schema_property_id)
                {
                    current_property_value_vec.vec_clear();
                }

                if let Some(entity_ids_to_decrease_rcs) = entity_ids_to_decrease_rcs {
                    Self::count_entities(entity_ids_to_decrease_rcs).iter()
                        .for_each(|(entity_id, rc)| Self::decrease_entity_rcs(
                            entity_id, *rc, property.property_type.same_controller_status()
                        )
                    );
                }
            });

            // Trigger event
            Self::deposit_event(RawEvent::EntityPropertyValueVectorCleared(actor, entity_id, in_class_schema_property_id));

            Ok(())
        }

        /// Remove value at given `index_in_property_vec`
        /// from `PropertyValueVec` under in_class_schema_property_id
        pub fn remove_at_entity_property_vector(
            origin,
            actor: Actor<T>,
            entity_id: T::EntityId,
            in_class_schema_property_id: PropertyId,
            index_in_property_vec: VecMaxLength,
            nonce: T::Nonce
        ) -> dispatch::Result {

            let (class, entity, access_level) = Self::ensure_class_entity_and_access_level(origin, entity_id, &actor)?;

            let current_property_value_vec =
                entity.ensure_property_value_is_vec(in_class_schema_property_id)?;

            let property = class.ensure_class_property_type_unlocked_from(
                in_class_schema_property_id,
                access_level,
            )?;

            current_property_value_vec.ensure_nonce_equality(nonce)?;

            current_property_value_vec
                .ensure_index_in_property_vector_is_valid(index_in_property_vec)?;

            //
            // == MUTATION SAFE ==
            //

            let involved_entity_id = current_property_value_vec
                .get_vec_value()
                .get_involved_entities()
                .map(|involved_entities| involved_entities[index_in_property_vec as usize]);

            // Remove value at in_class_schema_property_id in property value vector
            <EntityById<T>>::mutate(entity_id, |entity| {
                if let Some(PropertyValue::Vector(current_prop_value)) =
                    entity.values.get_mut(&in_class_schema_property_id)
                {
                    current_prop_value.vec_remove_at(index_in_property_vec);

                    // Trigger event
                    Self::deposit_event(
                        RawEvent::RemovedAtEntityPropertyValueVectorIndex(
                            actor, entity_id, in_class_schema_property_id, index_in_property_vec, nonce
                        )
                    )
                }
            });

            if let Some(involved_entity_id) = involved_entity_id {
                Self::decrease_entity_rcs(&involved_entity_id, 1, property.property_type.same_controller_status());
            }

            Ok(())
        }

        /// Insert `SinglePropertyValue` at given `index_in_property_vec`
        /// into `PropertyValueVec` under in_class_schema_property_id
        pub fn insert_at_entity_property_vector(
            origin,
            actor: Actor<T>,
            entity_id: T::EntityId,
            in_class_schema_property_id: PropertyId,
            index_in_property_vec: VecMaxLength,
            property_value: SinglePropertyValue<T>,
            nonce: T::Nonce
        ) -> dispatch::Result {

            let (class, entity, access_level) = Self::ensure_class_entity_and_access_level(origin, entity_id, &actor)?;

            let current_property_value_vec =
                entity.ensure_property_value_is_vec(in_class_schema_property_id)?;

            let class_property = class.ensure_class_property_type_unlocked_from(
                in_class_schema_property_id,
                access_level,
            )?;

            current_property_value_vec.ensure_nonce_equality(nonce)?;

            class_property.ensure_prop_value_can_be_inserted_at_prop_vec(
                &property_value,
                current_property_value_vec,
                index_in_property_vec,
                entity.get_permissions_ref().get_controller(),
            )?;

            //
            // == MUTATION SAFE ==
            //

            // Insert SinglePropertyValue at in_class_schema_property_id into property value vector
            <EntityById<T>>::mutate(entity_id, |entity| {
                let value = property_value.get_value();
                if let Some(entity_rc_to_increment) = value.get_involved_entity() {
                    Self::increase_entity_rcs(&entity_rc_to_increment, 1, class_property.property_type.same_controller_status());
                }
                if let Some(PropertyValue::Vector(current_prop_value)) =
                    entity.values.get_mut(&in_class_schema_property_id)
                {
                    current_prop_value.vec_insert_at(index_in_property_vec, value);

                    // Trigger event
                    Self::deposit_event(
                        RawEvent::InsertedAtEntityPropertyValueVectorIndex(
                            actor, entity_id, in_class_schema_property_id, index_in_property_vec, nonce
                        )
                    )
                }
            });

            Ok(())
        }

        pub fn transaction(origin, actor: Actor<T>, operations: Vec<OperationType<T>>) -> dispatch::Result {
            Self::ensure_number_of_operations_during_atomic_batching_limit_not_reached(&operations)?;

            // This Vec holds the T::EntityId of the entity created as a result of executing a `CreateEntity` `Operation`
            let mut entity_created_in_operation = vec![];
            let raw_origin = origin.into().map_err(|_| ERROR_ORIGIN_CANNOT_BE_MADE_INTO_RAW_ORIGIN)?;

            for operation_type in operations.into_iter() {
                let origin = T::Origin::from(raw_origin.clone());
                let actor = actor.clone();
                match operation_type {
                    OperationType::CreateEntity(create_entity_operation) => {
                        Self::create_entity(origin, create_entity_operation.class_id, actor)?;
                        // entity id of newly created entity
                        let entity_id = Self::next_entity_id() - T::EntityId::one();
                        entity_created_in_operation.push(entity_id);
                    },
                    OperationType::UpdatePropertyValues(update_property_values_operation) => {
                        let entity_id = operations::parametrized_entity_to_entity_id(
                            &entity_created_in_operation, update_property_values_operation.entity_id
                        )?;
                        let property_values = operations::parametrized_property_values_to_property_values(
                            &entity_created_in_operation, update_property_values_operation.new_parametrized_property_values
                        )?;
                        Self::update_entity_property_values(origin, actor, entity_id, property_values)?;
                    },
                    OperationType::AddSchemaSupportToEntity(add_schema_support_to_entity_operation) => {
                        let entity_id = operations::parametrized_entity_to_entity_id(
                            &entity_created_in_operation, add_schema_support_to_entity_operation.entity_id
                        )?;
                        let schema_id = add_schema_support_to_entity_operation.schema_id;
                        let property_values = operations::parametrized_property_values_to_property_values(
                            &entity_created_in_operation, add_schema_support_to_entity_operation.parametrized_property_values
                        )?;
                        Self::add_schema_support_to_entity(origin, actor, entity_id, schema_id, property_values)?;
                    }
                }
            }

            // Trigger event
            Self::deposit_event(RawEvent::TransactionCompleted(actor));

            Ok(())
        }
    }
}

impl<T: Trait> Module<T> {
    /// Increases corresponding `Entity` references count by rc.
    /// Depends on `same_owner` flag provided
    fn increase_entity_rcs(entity_id: &T::EntityId, rc: u32, same_owner: bool) {
        <EntityById<T>>::mutate(entity_id, |entity| {
            if same_owner {
                entity.inbound_same_owner_references_from_other_entities_count += rc;
                entity.reference_count += rc
            } else {
                entity.reference_count += rc
            }
        })
    }

    /// Decreases corresponding `Entity` references count by rc.
    /// Depends on `same_owner` flag provided
    fn decrease_entity_rcs(entity_id: &T::EntityId, rc: u32, same_owner: bool) {
        <EntityById<T>>::mutate(entity_id, |entity| {
            if same_owner {
                entity.inbound_same_owner_references_from_other_entities_count -= rc;
                entity.reference_count -= rc
            } else {
                entity.reference_count -= rc
            }
        })
    }

    /// Returns the stored `Class` if exist, error otherwise.
    fn ensure_class_exists(class_id: T::ClassId) -> Result<Class<T>, &'static str> {
        ensure!(<ClassById<T>>::exists(class_id), ERROR_CLASS_NOT_FOUND);
        Ok(Self::class_by_id(class_id))
    }

    /// Add new `PropertyValue`, if it was not already provided under `PropertyId` of this `Schema`
    fn add_new_property_value(
        class_property: &Property<T>,
        entity: &Entity<T>,
        prop_id: PropertyId,
        property_values: &BTreeMap<PropertyId, PropertyValue<T>>,
        entity_ids_to_increase_rcs: &mut EntitiesRc<T>,
        entity_values_updated: &mut BTreeMap<PropertyId, PropertyValue<T>>,
    ) -> Result<(), &'static str> {
        if let Some(new_value) = property_values.get(&prop_id) {
            class_property.ensure_property_value_to_update_is_valid(
                new_value,
                entity.get_permissions_ref().get_controller(),
            )?;

            class_property.ensure_unique_option_satisfied(new_value, entity_values_updated)?;

            if let Some(entity_rcs_to_increment) = new_value.get_involved_entities() {
                entity_ids_to_increase_rcs.fill_in_entity_rcs(
                    entity_rcs_to_increment,
                    class_property.property_type.same_controller_status(),
                );
            }

            entity_values_updated.insert(prop_id, new_value.to_owned());
        } else {
            // All required prop values should be provided
            ensure!(!class_property.required, ERROR_MISSING_REQUIRED_PROP);

            // Add all missing non required schema prop values as PropertyValue::default()
            entity_values_updated.insert(prop_id, PropertyValue::default());
        }
        Ok(())
    }

    /// Fill in `entity_ids_to_increase_rcs` & `entity_ids_to_decrease_rcs`,
    /// based on entities involved into update process
    pub fn fill_in_involved_entity_ids_rcs(
        new_value: &PropertyValue<T>,
        current_prop_value: &PropertyValue<T>,
        same_controller: bool,
        entity_ids_to_increase_rcs: &mut EntitiesRc<T>,
        entity_ids_to_decrease_rcs: &mut EntitiesRc<T>,
    ) {
        // Retrieve unique entity ids to update rc
        if let (Some(entities_rc_to_increment_vec), Some(entities_rc_to_decrement_vec)) = (
            new_value.get_involved_entities(),
            current_prop_value.get_involved_entities(),
        ) {
            let (entities_rc_to_decrement_vec, entities_rc_to_increment_vec): (
                Vec<T::EntityId>,
                Vec<T::EntityId>,
            ) = entities_rc_to_decrement_vec
                .into_iter()
                .zip(entities_rc_to_increment_vec.into_iter())
                // Do not count entity_ids, that should be incremented and decremented simultaneously
                .filter(|(entity_rc_to_decrement, entity_rc_to_increment)| {
                    entity_rc_to_decrement != entity_rc_to_increment
                })
                .unzip();

            entity_ids_to_increase_rcs
                .fill_in_entity_rcs(entities_rc_to_increment_vec, same_controller);

            entity_ids_to_decrease_rcs
                .fill_in_entity_rcs(entities_rc_to_decrement_vec, same_controller);
        }
    }

    /// Used to update `class_permissions` with parameters provided.
    /// Returns `Some(ClassPermissions<T>)` if update performed and `None` otherwise
    pub fn make_updated_class_permissions(
        class_permissions: ClassPermissions<T>,
        updated_any_member: Option<bool>,
        updated_entity_creation_blocked: Option<bool>,
        updated_all_entity_property_values_locked: Option<bool>,
        updated_maintainers: Option<BTreeSet<T::CuratorGroupId>>,
    ) -> Option<ClassPermissions<T>> {
        // Used to ensure update performed
        let mut updated_class_permissions = class_permissions.clone();

        if let Some(updated_any_member) = updated_any_member {
            updated_class_permissions.set_any_member_status(updated_any_member);
        }

        if let Some(updated_entity_creation_blocked) = updated_entity_creation_blocked {
            updated_class_permissions.set_entity_creation_blocked(updated_entity_creation_blocked);
        }

        if let Some(updated_all_entity_property_values_locked) =
            updated_all_entity_property_values_locked
        {
            updated_class_permissions
                .set_all_entity_property_values_locked(updated_all_entity_property_values_locked);
        }

        if let Some(updated_maintainers) = updated_maintainers {
            updated_class_permissions.set_maintainers(updated_maintainers);
        }

        if updated_class_permissions != class_permissions {
            Some(updated_class_permissions)
        } else {
            None
        }
    }

    /// Returns class and entity under given id, if exists, and correspnding `origin` `EntityAccessLevel`, if permitted
    fn ensure_class_entity_and_access_level(
        origin: T::Origin,
        entity_id: T::EntityId,
        actor: &Actor<T>,
    ) -> Result<(Class<T>, Entity<T>, EntityAccessLevel), &'static str> {
        let account_id = ensure_signed(origin)?;

        let entity = Self::ensure_known_entity_id(entity_id)?;

        let class = Self::class_by_id(entity.class_id);

        let access_level = EntityAccessLevel::derive(
            &account_id,
            entity.get_permissions_ref(),
            class.get_permissions_ref(),
            actor,
        )?;
        Ok((class, entity, access_level))
    }

    /// Ensure `Entity` under given `entity_id` exists, retrieve corresponding `Entity` & `Class`
    pub fn ensure_entity_and_class(
        entity_id: T::EntityId,
    ) -> Result<(Entity<T>, Class<T>), &'static str> {
        let entity = Self::ensure_known_entity_id(entity_id)?;

        let class = ClassById::get(entity.class_id);
        Ok((entity, class))
    }

    /// Retrieve all `entity_id`'s, depending on current `Entity` (the tree of referenced entities with `SameOwner` flag set)
    pub fn retrieve_all_entities_to_perform_ownership_transfer(
        class: &Class<T>,
        entity: Entity<T>,
        entities: &mut BTreeSet<T::EntityId>,
    ) {
        for (id, value) in entity.values.iter() {
            // Check, that property_type of class_property under given index is reference with `SameOwner` flag set
            match class.properties.get(*id as usize) {
                Some(class_property) if class_property.property_type.same_controller_status() => {
                    // Always safe
                    let class_id = class_property
                        .property_type
                        .get_referenced_class_id()
                        .unwrap();

                    // If property class_id is not equal to current one, retrieve corresponding Class from runtime storage
                    if class_id != entity.class_id {
                        let new_class = Self::class_by_id(class_id);

                        Self::get_all_same_owner_entities(&new_class, value, entities)
                    } else {
                        Self::get_all_same_owner_entities(&class, value, entities)
                    }
                }
                _ => (),
            }
        }
    }

    /// Get all referenced entities from corresponding property with `SameOwner` flag set,
    /// call `retrieve_all_entities_to_perform_ownership_transfer` recursively to complete tree traversal
    pub fn get_all_same_owner_entities(
        class: &Class<T>,
        value: &PropertyValue<T>,
        entities: &mut BTreeSet<T::EntityId>,
    ) {
        if let Some(entity_ids) = value.get_involved_entities() {
            entity_ids.into_iter().for_each(|entity_id| {
                // If new entity with `SameOwner` flag set found
                if !entities.contains(&entity_id) {
                    entities.insert(entity_id);
                    let new_entity = Self::entity_by_id(entity_id);
                    Self::retrieve_all_entities_to_perform_ownership_transfer(
                        &class, new_entity, entities,
                    );
                }
            })
        }
    }

    /// Ensure `Class` under given id exists, return corresponding one
    pub fn ensure_known_class_id(class_id: T::ClassId) -> Result<Class<T>, &'static str> {
        ensure!(<ClassById<T>>::exists(class_id), ERROR_CLASS_NOT_FOUND);
        Ok(Self::class_by_id(class_id))
    }

    /// Ensure `Entity` under given id exists, return corresponding one
    pub fn ensure_known_entity_id(entity_id: T::EntityId) -> Result<Entity<T>, &'static str> {
        ensure!(<EntityById<T>>::exists(entity_id), ERROR_ENTITY_NOT_FOUND);
        Ok(Self::entity_by_id(entity_id))
    }

    /// Ensure `CuratorGroup` under given id exists
    pub fn ensure_curator_group_under_given_id_exists(
        curator_group_id: &T::CuratorGroupId,
    ) -> dispatch::Result {
        ensure!(
            <CuratorGroupById<T>>::exists(curator_group_id),
            ERROR_CURATOR_GROUP_DOES_NOT_EXIST
        );
        Ok(())
    }

    /// Ensure `CuratorGroup` under given id exists, return corresponding one
    pub fn ensure_curator_group_exists(
        curator_group_id: &T::CuratorGroupId,
    ) -> Result<CuratorGroup<T>, &'static str> {
        Self::ensure_curator_group_under_given_id_exists(curator_group_id)?;
        Ok(Self::curator_group_by_id(curator_group_id))
    }

    /// Ensure `MaxNumberOfMaintainersPerClass` constraint satisfied
    pub fn ensure_maintainers_limit_not_reached(
        curator_groups: &BTreeSet<T::CuratorGroupId>,
    ) -> Result<(), &'static str> {
        ensure!(
            curator_groups.len() < T::MaxNumberOfMaintainersPerClass::get() as usize,
            ERROR_NUMBER_OF_MAINTAINERS_PER_CLASS_LIMIT_REACHED
        );
        Ok(())
    }

    /// Ensure all curator groups under given id exist
    pub fn ensure_curator_groups_exist(
        curator_groups: &BTreeSet<T::CuratorGroupId>,
    ) -> dispatch::Result {
        for curator_group in curator_groups {
            Self::ensure_curator_group_exists(curator_group)?;
        }
        Ok(())
    }

    /// Perform security checks to ensure provided `ClassPermissions` are valid
    pub fn ensure_class_permissions_are_valid(
        class_permissions: &ClassPermissions<T>,
    ) -> dispatch::Result {
        Self::ensure_maintainers_limit_not_reached(class_permissions.get_maintainers())?;
        Self::ensure_curator_groups_exist(class_permissions.get_maintainers())?;
        Ok(())
    }

    /// Ensure new `Schema` is not empty
    pub fn ensure_non_empty_schema(
        existing_properties: &BTreeSet<PropertyId>,
        new_properties: &[Property<T>],
    ) -> dispatch::Result {
        let non_empty_schema = !existing_properties.is_empty() || !new_properties.is_empty();
        ensure!(non_empty_schema, ERROR_NO_PROPS_IN_CLASS_SCHEMA);
        Ok(())
    }

    /// Ensure `ClassNameLengthConstraint` conditions satisfied
    pub fn ensure_class_name_is_valid(text: &[u8]) -> dispatch::Result {
        T::ClassNameLengthConstraint::get().ensure_valid(
            text.len(),
            ERROR_CLASS_NAME_TOO_SHORT,
            ERROR_CLASS_NAME_TOO_LONG,
        )
    }

    /// Ensure `ClassDescriptionLengthConstraint` conditions satisfied
    pub fn ensure_class_description_is_valid(text: &[u8]) -> dispatch::Result {
        T::ClassDescriptionLengthConstraint::get().ensure_valid(
            text.len(),
            ERROR_CLASS_DESCRIPTION_TOO_SHORT,
            ERROR_CLASS_DESCRIPTION_TOO_LONG,
        )
    }

    /// Ensure `MaxNumberOfClasses` constraint satisfied
    pub fn ensure_class_limit_not_reached() -> dispatch::Result {
        ensure!(
            T::MaxNumberOfClasses::get() < <ClassById<T>>::enumerate().count() as MaxNumber,
            ERROR_CLASS_LIMIT_REACHED
        );
        Ok(())
    }

    /// Ensure `MaxNumberOfEntitiesPerClass` constraint satisfied
    pub fn ensure_valid_number_of_entities_per_class(
        maximum_entities_count: T::EntityId,
    ) -> dispatch::Result {
        ensure!(
            maximum_entities_count < T::MaxNumberOfEntitiesPerClass::get(),
            ERROR_ENTITIES_NUMBER_PER_CLASS_CONSTRAINT_VIOLATED
        );
        Ok(())
    }

    /// Ensure `IndividualEntitiesCreationLimit` constraint satisfied
    pub fn ensure_valid_number_of_class_entities_per_actor_constraint(
        number_of_class_entities_per_actor: T::EntityId,
    ) -> dispatch::Result {
        ensure!(
            number_of_class_entities_per_actor < T::IndividualEntitiesCreationLimit::get(),
            ERROR_NUMBER_OF_CLASS_ENTITIES_PER_ACTOR_CONSTRAINT_VIOLATED
        );
        Ok(())
    }

    /// Ensure, that all entities creation limits, defined for a given `Class`, are valid
    pub fn ensure_entities_creation_limits_are_valid(
        maximum_entities_count: T::EntityId,
        default_entity_creation_voucher_upper_bound: T::EntityId,
    ) -> dispatch::Result {
        // Ensure `per_controller_entities_creation_limit` does not exceed
        ensure!(
            default_entity_creation_voucher_upper_bound < maximum_entities_count,
            ERROR_PER_CONTROLLER_ENTITIES_CREATION_LIMIT_EXCEEDS_OVERALL_LIMIT
        );
        Self::ensure_valid_number_of_entities_per_class(maximum_entities_count)?;
        Self::ensure_valid_number_of_class_entities_per_actor_constraint(
            default_entity_creation_voucher_upper_bound,
        )
    }

    /// Ensure maximum number of operations during atomic batching constraint satisfied
    pub fn ensure_number_of_operations_during_atomic_batching_limit_not_reached(
        operations: &[OperationType<T>],
    ) -> dispatch::Result {
        ensure!(
            operations.len() <= T::MaxNumberOfOperationsDuringAtomicBatching::get() as usize,
            ERROR_MAX_NUMBER_OF_OPERATIONS_DURING_ATOMIC_BATCHING_LIMIT_REACHED
        );
        Ok(())
    }

    /// Complete all checks to ensure each `Property` is valid
    pub fn ensure_all_properties_are_valid(new_properties: &[Property<T>]) -> dispatch::Result {
        for new_property in new_properties.iter() {
            new_property.ensure_name_is_valid()?;
            new_property.ensure_description_is_valid()?;
            new_property.ensure_property_type_size_is_valid()?;
            new_property.ensure_property_type_reference_is_valid()?;
        }
        Ok(())
    }

    /// Ensure all `Property` names are  unique within `Class`
    pub fn ensure_all_property_names_are_unique(
        class_properties: &[Property<T>],
        new_properties: &[Property<T>],
    ) -> dispatch::Result {
        // Used to ensure all property names are unique within class
        let mut unique_prop_names = BTreeSet::new();

        for property in class_properties.iter() {
            unique_prop_names.insert(property.name.to_owned());
        }

        for new_property in new_properties {
            // Ensure name of a new property is unique within its class.
            ensure!(
                !unique_prop_names.contains(&new_property.name),
                ERROR_PROP_NAME_NOT_UNIQUE_IN_A_CLASS
            );

            unique_prop_names.insert(new_property.name.to_owned());
        }

        Ok(())
    }

    /// Ensure provided indices of `existing_properties`  are valid indices of `Class` properties
    pub fn ensure_schema_properties_are_valid_indices(
        existing_properties: &BTreeSet<PropertyId>,
        class_properties: &[Property<T>],
    ) -> dispatch::Result {
        let has_unknown_properties = existing_properties
            .iter()
            .any(|&prop_id| prop_id >= class_properties.len() as PropertyId);
        ensure!(
            !has_unknown_properties,
            ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_PROP_INDEX
        );
        Ok(())
    }

    // Create new `Schema` with existing and new properies provided
    pub fn create_class_schema(
        existing_properties: BTreeSet<PropertyId>,
        class_properties: &[Property<T>],
        new_properties: &[Property<T>],
    ) -> Schema {
        // Create new Schema with existing properies provided
        let mut schema = Schema::new(existing_properties);

        // Add new property ids to `Schema`
        new_properties.iter().enumerate().for_each(|(i, _)| {
            let prop_id = (class_properties.len() + i) as PropertyId;

            schema.get_properties_mut().insert(prop_id);
        });
        schema
    }

    /// Update existing `Class` properties with new ones provided, return updated ones
    pub fn update_class_properties(
        class_properties: Vec<Property<T>>,
        new_properties: Vec<Property<T>>,
    ) -> Vec<Property<T>> {
        class_properties
            .into_iter()
            .chain(new_properties.into_iter())
            .collect()
    }

    /// Counts the number of repetetive entities and returns `BTreeMap<T::EntityId, ReferenceCounter>`,
    /// where T::EntityId - unique entity_id, ReferenceCounter - related counter
    pub fn count_entities(entity_ids: Vec<T::EntityId>) -> BTreeMap<T::EntityId, ReferenceCounter> {
        let mut result = BTreeMap::new();

        for entity_id in entity_ids {
            *result.entry(entity_id).or_insert(0) += 1;
        }

        result
    }
}

decl_event!(
    pub enum Event<T>
    where
        CuratorGroupId = <T as ActorAuthenticator>::CuratorGroupId,
        CuratorId = <T as ActorAuthenticator>::CuratorId,
        ClassId = <T as Trait>::ClassId,
        EntityId = <T as Trait>::EntityId,
        EntityController = EntityController<T>,
        EntityCreationVoucher = EntityCreationVoucher<T>,
        Status = bool,
        Actor = Actor<T>,
        Nonce = <T as Trait>::Nonce,
    {
        CuratorGroupAdded(CuratorGroupId),
        CuratorGroupRemoved(CuratorGroupId),
        CuratorGroupStatusSet(Status),
        CuratorAdded(CuratorGroupId, CuratorId),
        CuratorRemoved(CuratorGroupId, CuratorId),
        MaintainerAdded(ClassId, CuratorGroupId),
        MaintainerRemoved(ClassId, CuratorGroupId),
        EntityCreationVoucherUpdated(EntityController, EntityCreationVoucher),
        EntityCreationVoucherCreated(EntityController, EntityCreationVoucher),
        ClassCreated(ClassId),
        ClassPermissionsUpdated(ClassId),
        ClassSchemaAdded(ClassId, SchemaId),
        ClassSchemaStatusUpdated(ClassId, SchemaId, Status),
        EntityPermissionsUpdated(EntityId),
        EntityCreated(Actor, EntityId),
        EntityRemoved(Actor, EntityId),
        EntitySchemaSupportAdded(Actor, EntityId, SchemaId),
        EntityPropertyValuesUpdated(Actor, EntityId),
        EntityPropertyValueVectorCleared(Actor, EntityId, PropertyId),
        RemovedAtEntityPropertyValueVectorIndex(Actor, EntityId, PropertyId, VecMaxLength, Nonce),
        InsertedAtEntityPropertyValueVectorIndex(Actor, EntityId, PropertyId, VecMaxLength, Nonce),
        TransactionCompleted(Actor),
        EntityOwnershipTransfered(EntityId, EntityController),
    }
);
