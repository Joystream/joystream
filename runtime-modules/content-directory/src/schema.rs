use crate::{permissions::EntityAccessLevel, *};
use codec::{Decode, Encode};
use core::ops::Deref;
#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};

/// Type representing max length of vector property type
pub type VecMaxLength = u16;

/// Type representing max length of text property type
pub type TextMaxLength = u16;

/// Type identificator for property id
pub type PropertyId = u16;

/// Type identificator for schema id
pub type SchemaId = u16;

/// Used to force property values to only reference entities, owned by the same controller
pub type SameController = bool;

/// Locking policy, representing `Property` locking status for both controller and maintainer
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Default, Decode, Clone, Copy, PartialEq, Eq, Debug)]
pub struct PropertyLockingPolicy {
    is_locked_from_maintainer: bool,
    is_locked_from_controller: bool,
}

/// Enum, used for `PropertyType` representation
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Copy, PartialEq, Eq, Debug)]
pub enum Type<T: Trait> {
    Bool,
    Uint16,
    Uint32,
    Uint64,
    Int16,
    Int32,
    Int64,
    /// Max length of text item.
    Text(TextMaxLength),
    /// Can reference only specific class id entities
    Reference(T::ClassId, SameController),
}

impl<T: Trait> Default for Type<T> {
    fn default() -> Self {
        Self::Bool
    }
}

/// Vector property type representation
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Copy, PartialEq, Eq, Debug)]
pub struct VecPropertyType<T: Trait> {
    vec_type: Type<T>,
    /// Max length of vector, corresponding to a given type
    max_length: VecMaxLength,
}

impl<T: Trait> Default for VecPropertyType<T> {
    fn default() -> Self {
        Self {
            vec_type: Type::default(),
            max_length: 0,
        }
    }
}

impl<T: Trait> VecPropertyType<T> {
    pub fn new(vec_type: Type<T>, max_length: VecMaxLength) -> Self {
        Self {
            vec_type,
            max_length,
        }
    }

    /// Ensure `Type` spcific `TextMaxLengthConstraint` & `VecMaxLengthConstraint` satisfied
    fn ensure_property_type_size_is_valid(&self) -> dispatch::Result {
        if let Type::Text(text_max_len) = self.vec_type {
            ensure!(
                text_max_len <= T::TextMaxLengthConstraint::get(),
                ERROR_TEXT_PROP_IS_TOO_LONG
            );
        }
        ensure!(
            self.max_length <= T::VecMaxLengthConstraint::get(),
            ERROR_VEC_PROP_IS_TOO_LONG
        );
        Ok(())
    }

    pub fn get_vec_type(&self) -> &Type<T> {
        &self.vec_type
    }

    pub fn get_max_len(&self) -> VecMaxLength {
        self.max_length
    }
}

/// `Type` enum wrapper
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Copy, PartialEq, Eq, Debug)]
pub struct SingleValuePropertyType<T: Trait>(Type<T>);

impl<T: Trait> Default for SingleValuePropertyType<T> {
    fn default() -> Self {
        Self(Type::default())
    }
}

impl<T: Trait> SingleValuePropertyType<T> {
    /// Ensure `Type` specific `TextMaxLengthConstraint` satisfied
    fn ensure_property_type_size_is_valid(&self) -> dispatch::Result {
        if let Type::Text(text_max_len) = self.0 {
            ensure!(
                text_max_len <= T::TextMaxLengthConstraint::get(),
                ERROR_TEXT_PROP_IS_TOO_LONG
            );
        }
        Ok(())
    }
}

impl<T: Trait> Deref for SingleValuePropertyType<T> {
    type Target = Type<T>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

/// Enum, representing either `SingleValuePropertyType` or `VecPropertyType`
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Copy, PartialEq, Eq, Debug)]
pub enum PropertyType<T: Trait> {
    Single(SingleValuePropertyType<T>),
    Vector(VecPropertyType<T>),
}

impl<T: Trait> Default for PropertyType<T> {
    fn default() -> Self {
        Self::Single(SingleValuePropertyType::default())
    }
}

impl<T: Trait> PropertyType<T> {
    pub fn as_single_value_type(&self) -> Option<&Type<T>> {
        if let PropertyType::Single(single_value_property_type) = self {
            Some(single_value_property_type)
        } else {
            None
        }
    }

    pub fn as_vec_type(&self) -> Option<&VecPropertyType<T>> {
        if let PropertyType::Vector(single_value_property_type) = self {
            Some(single_value_property_type)
        } else {
            None
        }
    }

    pub fn get_inner_type(&self) -> &Type<T> {
        match self {
            PropertyType::Single(single_property_type) => single_property_type,
            PropertyType::Vector(vec_property_type) => vec_property_type.get_vec_type(),
        }
    }

    /// Retrives same_controller.
    /// Always returns false if `Type` is not a reference,
    pub fn same_controller_status(&self) -> SameController {
        if let Type::Reference(_, same_controller) = self.get_inner_type() {
            *same_controller
        } else {
            false
        }
    }

    pub fn get_referenced_class_id(&self) -> Option<T::ClassId> {
        if let Type::Reference(class_id, _) = self.get_inner_type() {
            Some(*class_id)
        } else {
            None
        }
    }
}

/// Value enum representation, related to corresponding `SinglePropertyValue` structure
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum Value<T: Trait> {
    Bool(bool),
    Uint16(u16),
    Uint32(u32),
    Uint64(u64),
    Int16(i16),
    Int32(i32),
    Int64(i64),
    Text(Vec<u8>),
    Reference(T::EntityId),
}

impl<T: Trait> Default for Value<T> {
    fn default() -> Value<T> {
        Self::Bool(false)
    }
}

impl<T: Trait> Value<T> {
    /// Retrieve involved `entity_id`, if current `Value` is reference
    pub fn get_involved_entity(&self) -> Option<T::EntityId> {
        if let Value::Reference(entity_id) = self {
            Some(*entity_id)
        } else {
            None
        }
    }
}

/// `Value` enum wrapper
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct SinglePropertyValue<T: Trait> {
    value: Value<T>,
}

impl<T: Trait> Default for SinglePropertyValue<T> {
    fn default() -> Self {
        Self {
            value: Value::default(),
        }
    }
}

impl<T: Trait> SinglePropertyValue<T> {
    pub fn new(value: Value<T>) -> Self {
        Self { value }
    }

    pub fn get_value_ref(&self) -> &Value<T> {
        &self.value
    }

    pub fn get_value(self) -> Value<T> {
        self.value
    }
}

/// Vector value enum representation, related to corresponding `VecPropertyValue` structure
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum VecValue<T: Trait> {
    Bool(Vec<bool>),
    Uint16(Vec<u16>),
    Uint32(Vec<u32>),
    Uint64(Vec<u64>),
    Int16(Vec<i16>),
    Int32(Vec<i32>),
    Int64(Vec<i64>),
    Text(Vec<Vec<u8>>),
    Reference(Vec<T::EntityId>),
}

impl<T: Trait> Default for VecValue<T> {
    fn default() -> Self {
        Self::Bool(vec![])
    }
}

impl<T: Trait> VecValue<T> {
    /// Retrieve all involved `entity_id`'s, if current `VecValue` is reference
    pub fn get_involved_entities(&self) -> Option<Vec<T::EntityId>> {
        if let Self::Reference(entity_ids) = self {
            Some(entity_ids.to_owned())
        } else {
            None
        }
    }
}

/// Consists of `VecPropertyValue` enum representation and `nonce`, used to avoid vector data race update conditions
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VecPropertyValue<T: Trait> {
    vec_value: VecValue<T>,
    nonce: T::Nonce,
}

impl<T: Trait> VecPropertyValue<T> {
    fn increment_nonce(&mut self) -> T::Nonce {
        self.nonce += T::Nonce::one();
        self.nonce
    }

    pub fn new(vec_value: VecValue<T>, nonce: T::Nonce) -> Self {
        Self { vec_value, nonce }
    }

    /// Retrieve `VecValue` by reference
    pub fn get_vec_value(&self) -> &VecValue<T> {
        &self.vec_value
    }

    fn len(&self) -> usize {
        match &self.vec_value {
            VecValue::Bool(vec) => vec.len(),
            VecValue::Uint16(vec) => vec.len(),
            VecValue::Uint32(vec) => vec.len(),
            VecValue::Uint64(vec) => vec.len(),
            VecValue::Int16(vec) => vec.len(),
            VecValue::Int32(vec) => vec.len(),
            VecValue::Int64(vec) => vec.len(),
            VecValue::Text(vec) => vec.len(),
            VecValue::Reference(vec) => vec.len(),
        }
    }

    /// Clear current `vec_value`, increment `nonce`
    pub fn vec_clear(&mut self) {
        match &mut self.vec_value {
            VecValue::Bool(vec) => *vec = vec![],
            VecValue::Uint16(vec) => *vec = vec![],
            VecValue::Uint32(vec) => *vec = vec![],
            VecValue::Uint64(vec) => *vec = vec![],
            VecValue::Int16(vec) => *vec = vec![],
            VecValue::Int32(vec) => *vec = vec![],
            VecValue::Int64(vec) => *vec = vec![],
            VecValue::Text(vec) => *vec = vec![],
            VecValue::Reference(vec) => *vec = vec![],
        }

        self.increment_nonce();
    }

    /// Perform removal at given `index_in_property_vec`, increment `nonce`
    pub fn vec_remove_at(&mut self, index_in_property_vec: VecMaxLength) {
        fn remove_at_checked<T>(vec: &mut Vec<T>, index_in_property_vec: VecMaxLength) {
            if (index_in_property_vec as usize) < vec.len() {
                vec.remove(index_in_property_vec as usize);
            }
        }

        match &mut self.vec_value {
            VecValue::Bool(vec) => remove_at_checked(vec, index_in_property_vec),
            VecValue::Uint16(vec) => remove_at_checked(vec, index_in_property_vec),
            VecValue::Uint32(vec) => remove_at_checked(vec, index_in_property_vec),
            VecValue::Uint64(vec) => remove_at_checked(vec, index_in_property_vec),
            VecValue::Int16(vec) => remove_at_checked(vec, index_in_property_vec),
            VecValue::Int32(vec) => remove_at_checked(vec, index_in_property_vec),
            VecValue::Int64(vec) => remove_at_checked(vec, index_in_property_vec),
            VecValue::Text(vec) => remove_at_checked(vec, index_in_property_vec),
            VecValue::Reference(vec) => remove_at_checked(vec, index_in_property_vec),
        }

        self.increment_nonce();
    }

    /// Insert provided `Value` at given `index_in_property_vec`, increment `nonce`
    pub fn vec_insert_at(&mut self, index_in_property_vec: VecMaxLength, single_value: Value<T>) {
        fn insert_at<T>(vec: &mut Vec<T>, index_in_property_vec: VecMaxLength, value: T) {
            if (index_in_property_vec as usize) < vec.len() {
                vec.insert(index_in_property_vec as usize, value);
            }
        }

        match (&mut self.vec_value, single_value) {
            (VecValue::Bool(vec), Value::Bool(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (VecValue::Uint16(vec), Value::Uint16(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (VecValue::Uint32(vec), Value::Uint32(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (VecValue::Uint64(vec), Value::Uint64(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (VecValue::Int16(vec), Value::Int16(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (VecValue::Int32(vec), Value::Int32(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (VecValue::Int64(vec), Value::Int64(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }

            // Match by move, when https://github.com/rust-lang/rust/issues/68354 stableize
            (VecValue::Text(vec), Value::Text(ref value)) => {
                insert_at(vec, index_in_property_vec, value.to_owned())
            }
            (VecValue::Reference(vec), Value::Reference(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            _ => return,
        }

        self.increment_nonce();
    }

    /// Ensure `VecPropertyValue` nonce is equal to provided one.
    /// Used to to avoid possible data races, when performing vector specific operations
    pub fn ensure_nonce_equality(&self, new_nonce: T::Nonce) -> dispatch::Result {
        ensure!(
            self.nonce == new_nonce,
            ERROR_PROP_VALUE_VEC_NONCES_DOES_NOT_MATCH
        );
        Ok(())
    }

    /// Ensure, provided index is valid index of `VecValue`
    pub fn ensure_index_in_property_vector_is_valid(
        &self,
        index_in_property_vec: VecMaxLength,
    ) -> dispatch::Result {
        ensure!(
            (index_in_property_vec as usize) < self.len(),
            ERROR_ENTITY_PROP_VALUE_VECTOR_INDEX_IS_OUT_OF_RANGE
        );

        Ok(())
    }
}

/// Enum, representing either `SinglePropertyValue` or `VecPropertyValue`
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum PropertyValue<T: Trait> {
    Single(SinglePropertyValue<T>),
    Vector(VecPropertyValue<T>),
}

impl<T: Trait> PropertyValue<T> {
    pub fn as_single_property_value(&self) -> Option<&SinglePropertyValue<T>> {
        if let PropertyValue::Single(single_property_value) = self {
            Some(single_property_value)
        } else {
            None
        }
    }

    pub fn as_vec_property_value(&self) -> Option<&VecPropertyValue<T>> {
        if let PropertyValue::Vector(vec_property_value) = self {
            Some(vec_property_value)
        } else {
            None
        }
    }

    pub fn as_vec_property_value_mut(&mut self) -> Option<&mut VecPropertyValue<T>> {
        if let PropertyValue::Vector(vec_property_value) = self {
            Some(vec_property_value)
        } else {
            None
        }
    }

    /// Update `Self` with provided `PropertyValue`
    pub fn update(&mut self, mut new_value: Self) {
        if let (Some(vec_property_value), Some(new_vec_property_value)) = (
            self.as_vec_property_value_mut(),
            new_value.as_vec_property_value_mut(),
        ) {
            new_vec_property_value.nonce = vec_property_value.increment_nonce();
        }
        *self = new_value;
    }

    /// Retrieve all involved `entity_id`'s, if current `PropertyValue` is reference
    pub fn get_involved_entities(&self) -> Option<Vec<T::EntityId>> {
        match self {
            PropertyValue::Single(single_property_value) => {
                if let Some(entity_id) = single_property_value.get_value_ref().get_involved_entity()
                {
                    Some(vec![entity_id])
                } else {
                    None
                }
            }
            PropertyValue::Vector(vector_property_value) => vector_property_value
                .get_vec_value()
                .get_involved_entities(),
        }
    }
}

impl<T: Trait> Default for PropertyValue<T> {
    fn default() -> Self {
        PropertyValue::Single(SinglePropertyValue::default())
    }
}

/// A schema defines what properties describe an entity
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct Schema {
    /// Indices into properties vector for the corresponding class.
    properties: BTreeSet<PropertyId>,
    /// If schema can be added to an entity
    is_active: bool,
}

impl Default for Schema {
    fn default() -> Self {
        Self {
            properties: BTreeSet::new(),
            // Default schema status
            is_active: true,
        }
    }
}

impl Schema {
    /// Create new schema with provided properties
    pub fn new(properties: BTreeSet<PropertyId>) -> Self {
        Self {
            properties,
            // Default schema status
            is_active: true,
        }
    }

    /// If `Schema` can be added to an entity
    pub fn is_active(&self) -> bool {
        self.is_active
    }

    /// Ensure schema in `active` status
    pub fn ensure_is_active(&self) -> dispatch::Result {
        ensure!(self.is_active, ERROR_CLASS_SCHEMA_NOT_ACTIVE);
        Ok(())
    }

    /// Get `Schema` `properties` by reference
    pub fn get_properties(&self) -> &BTreeSet<PropertyId> {
        &self.properties
    }

    /// Select unused `PropertyValues`, which ids are in current `Schema` property ids set
    pub fn get_property_values_unused<T: Trait>(
        &self,
        property_values: BTreeMap<u16, PropertyValue<T>>,
        unused_property_ids: &BTreeSet<PropertyId>,
    ) -> BTreeMap<u16, PropertyValue<T>> {
        property_values
            .into_iter()
            // Select `PropertyValues`, which ids are in `Schema` property ids set
            .filter(|(entity_property_id, _)| {
                self.properties
                    .iter()
                    .any(|schema_property_id| *schema_property_id == *entity_property_id)
            })
            // Select `PropertyValues`, which ids are not added yet to the `Entity`
            .filter(|(entity_property_id, _)| {
                unused_property_ids
                    .iter()
                    .any(|unused_property_id| *unused_property_id == *entity_property_id)
            })
            .collect()
    }

    /// Retrieve `Property` ids, which corresonding values are not added yet to the current `Entity` `PropertyValue`s set
    pub fn get_unused_property_ids<T: Trait>(
        &self,
        entity_property_values: &BTreeMap<u16, PropertyValue<T>>,
    ) -> BTreeSet<PropertyId> {
        self.properties
            .iter()
            // Filter property ids, already added to the entity property values set
            // and though cannot be updated, while adding a schema support to this entity.
            .filter(|property_id| !entity_property_values.contains_key(property_id))
            .cloned()
            .collect()
    }

    /// Get `Schema` `properties` by mutable reference
    pub fn get_properties_mut(&mut self) -> &mut BTreeSet<PropertyId> {
        &mut self.properties
    }

    /// Set `Schema`'s `is_active` flag as provided
    pub fn set_status(&mut self, is_active: bool) {
        self.is_active = is_active;
    }
}

/// `Property` representation, related to a given `Class`
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Property<T: Trait> {
    pub property_type: PropertyType<T>,
    /// If property value can be skipped, when adding entity schema support
    pub required: bool,
    /// Used to enforce uniquness of a property across all entities that have this property
    pub unique: bool,
    pub name: Vec<u8>,
    pub description: Vec<u8>,
    pub locking_policy: PropertyLockingPolicy,
}

impl<T: Trait> Property<T> {
    pub fn is_locked_from(&self, access_level: EntityAccessLevel) -> bool {
        let is_locked_from_controller = self.locking_policy.is_locked_from_controller;
        let is_locked_from_maintainer = self.locking_policy.is_locked_from_maintainer;
        match access_level {
            EntityAccessLevel::EntityControllerAndMaintainer => {
                is_locked_from_controller && is_locked_from_maintainer
            }
            EntityAccessLevel::EntityController => is_locked_from_controller,
            EntityAccessLevel::EntityMaintainer => is_locked_from_maintainer,
        }
    }

    /// Ensure `Property` is unlocked from `Actor` with given `EntityAccessLevel`
    pub fn ensure_unlocked_from(&self, access_level: EntityAccessLevel) -> dispatch::Result {
        ensure!(
            self.is_locked_from(access_level),
            ERROR_CLASS_PROPERTY_TYPE_IS_LOCKED_FOR_GIVEN_ACTOR
        );
        Ok(())
    }

    /// Ensure all `PropertyValue`'s with unique option set are unique, except of null non required ones
    pub fn ensure_unique_option_satisfied(
        &self,
        new_value: &PropertyValue<T>,
        unused_schema_property_values: &BTreeMap<PropertyId, PropertyValue<T>>,
        entity_property_values: &BTreeMap<PropertyId, PropertyValue<T>>,
    ) -> dispatch::Result {
        if self.unique && (*new_value != PropertyValue::default() || self.required) {
            ensure!(
                unused_schema_property_values
                    .iter()
                    .chain(entity_property_values.iter())
                    .all(|(_, prop_value)| *prop_value != *new_value),
                ERROR_PROPERTY_VALUE_SHOULD_BE_UNIQUE
            );
        }
        Ok(())
    }

    /// Validate new `PropertyValue` against the type of this `Property`
    /// and check any additional constraints
    pub fn ensure_property_value_to_update_is_valid(
        &self,
        value: &PropertyValue<T>,
        current_entity_controller: &EntityController<T>,
    ) -> dispatch::Result {
        self.ensure_prop_value_matches_its_type(value)?;
        self.ensure_valid_reference_prop(value, current_entity_controller)?;
        self.validate_max_len_if_text_prop(value)?;
        self.validate_max_len_if_vec_prop(value)?;
        Ok(())
    }

    /// Ensure `SinglePropertyValue` type is equal to the `VecPropertyValue` type
    /// and check all constraints
    pub fn ensure_prop_value_can_be_inserted_at_prop_vec(
        &self,
        single_value: &SinglePropertyValue<T>,
        vec_value: &VecPropertyValue<T>,
        index_in_property_vec: VecMaxLength,
        current_entity_controller: &EntityController<T>,
    ) -> dispatch::Result {
        vec_value.ensure_index_in_property_vector_is_valid(index_in_property_vec)?;

        fn validate_prop_vec_len_after_value_insert<T>(
            vec: &[T],
            max_len: VecMaxLength,
        ) -> dispatch::Result {
            ensure!(
                vec.len() < max_len as usize,
                ERROR_ENTITY_PROP_VALUE_VECTOR_IS_TOO_LONG
            );
            Ok(())
        }

        let property_type_vec = self
            .property_type
            .as_vec_type()
            .ok_or(ERROR_PROP_VALUE_TYPE_DOESNT_MATCH_INTERNAL_ENTITY_VECTOR_TYPE)?;

        let max_vec_len = property_type_vec.get_max_len();

        match (
            single_value.get_value_ref(),
            vec_value.get_vec_value(),
            property_type_vec.get_vec_type(),
        ) {
            // Single values
            (Value::Bool(_), VecValue::Bool(vec), Type::Bool) => {
                validate_prop_vec_len_after_value_insert(vec, max_vec_len)
            }
            (Value::Uint16(_), VecValue::Uint16(vec), Type::Uint16) => {
                validate_prop_vec_len_after_value_insert(vec, max_vec_len)
            }
            (Value::Uint32(_), VecValue::Uint32(vec), Type::Uint32) => {
                validate_prop_vec_len_after_value_insert(vec, max_vec_len)
            }
            (Value::Uint64(_), VecValue::Uint64(vec), Type::Uint64) => {
                validate_prop_vec_len_after_value_insert(vec, max_vec_len)
            }
            (Value::Int16(_), VecValue::Int16(vec), Type::Int16) => {
                validate_prop_vec_len_after_value_insert(vec, max_vec_len)
            }
            (Value::Int32(_), VecValue::Int32(vec), Type::Int32) => {
                validate_prop_vec_len_after_value_insert(vec, max_vec_len)
            }
            (Value::Int64(_), VecValue::Int64(vec), Type::Int64) => {
                validate_prop_vec_len_after_value_insert(vec, max_vec_len)
            }
            (Value::Text(text_item), VecValue::Text(vec), Type::Text(text_max_len)) => {
                Self::validate_max_len_of_text(text_item, *text_max_len)?;
                validate_prop_vec_len_after_value_insert(vec, max_vec_len)
            }
            (
                Value::Reference(entity_id),
                VecValue::Reference(vec),
                Type::Reference(class_id, same_controller_status),
            ) => {
                Self::ensure_referancable(
                    *class_id,
                    *entity_id,
                    *same_controller_status,
                    current_entity_controller,
                )?;
                validate_prop_vec_len_after_value_insert(vec, max_vec_len)
            }
            _ => Err(ERROR_PROP_VALUE_TYPE_DOESNT_MATCH_INTERNAL_ENTITY_VECTOR_TYPE),
        }
    }

    pub fn validate_max_len_if_text_prop(&self, value: &PropertyValue<T>) -> dispatch::Result {
        let single_value = value
            .as_single_property_value()
            .map(|single_prop_value| single_prop_value.get_value_ref());
        match (single_value, &self.property_type.as_single_value_type()) {
            (Some(Value::Text(text)), Some(Type::Text(max_len))) => {
                Self::validate_max_len_of_text(text, *max_len)
            }
            _ => Ok(()),
        }
    }

    pub fn validate_max_len_of_text(text: &[u8], max_len: TextMaxLength) -> dispatch::Result {
        ensure!(text.len() <= max_len as usize, ERROR_TEXT_PROP_IS_TOO_LONG);
        Ok(())
    }

    fn validate_vec_len<V>(vec: &[V], max_len: VecMaxLength) -> dispatch::Result {
        ensure!(vec.len() <= max_len as usize, ERROR_VEC_PROP_IS_TOO_LONG);
        Ok(())
    }

    pub fn validate_max_len_if_vec_prop(&self, value: &PropertyValue<T>) -> dispatch::Result {
        let (vec_value, vec_property_type) = if let (Some(vec_value), Some(vec_property_type)) = (
            value
                .as_vec_property_value()
                .map(|vec_property_value| vec_property_value.get_vec_value()),
            self.property_type.as_vec_type(),
        ) {
            (vec_value, vec_property_type)
        } else {
            return Ok(());
        };
        let max_len = vec_property_type.get_max_len();
        match vec_value {
            VecValue::Bool(vec) => Self::validate_vec_len(vec, max_len),
            VecValue::Uint16(vec) => Self::validate_vec_len(vec, max_len),
            VecValue::Uint32(vec) => Self::validate_vec_len(vec, max_len),
            VecValue::Uint64(vec) => Self::validate_vec_len(vec, max_len),
            VecValue::Int16(vec) => Self::validate_vec_len(vec, max_len),
            VecValue::Int32(vec) => Self::validate_vec_len(vec, max_len),
            VecValue::Int64(vec) => Self::validate_vec_len(vec, max_len),
            VecValue::Text(vec) => {
                Self::validate_vec_len(vec, max_len)?;
                if let Type::Text(text_max_len) = vec_property_type.get_vec_type() {
                    for text_item in vec.iter() {
                        Self::validate_max_len_of_text(text_item, *text_max_len)?;
                    }
                }
                Ok(())
            }
            VecValue::Reference(vec) => Self::validate_vec_len(vec, max_len),
        }
    }

    pub fn ensure_prop_value_matches_its_type(&self, value: &PropertyValue<T>) -> dispatch::Result {
        ensure!(
            self.does_prop_value_match_type(value),
            ERROR_PROP_VALUE_DONT_MATCH_TYPE
        );
        Ok(())
    }

    pub fn does_prop_value_match_type(&self, value: &PropertyValue<T>) -> bool {
        // A non required property can be updated to Bool(false):
        if !self.required && *value == PropertyValue::default() {
            return true;
        }
        match (value, &self.property_type) {
            (
                PropertyValue::Single(single_property_value),
                PropertyType::Single(ref single_property_type),
            ) => {
                match (
                    single_property_value.get_value_ref(),
                    single_property_type.deref(),
                ) {
                    (Value::Bool(_), Type::Bool)
                    | (Value::Uint16(_), Type::Uint16)
                    | (Value::Uint32(_), Type::Uint32)
                    | (Value::Uint64(_), Type::Uint64)
                    | (Value::Int16(_), Type::Int16)
                    | (Value::Int32(_), Type::Int32)
                    | (Value::Int64(_), Type::Int64)
                    | (Value::Text(_), Type::Text(_))
                    | (Value::Reference(_), Type::Reference(_, _)) => true,
                    _ => false,
                }
            }
            (
                PropertyValue::Vector(vec_property_value),
                PropertyType::Vector(ref vec_property_type),
            ) => {
                match (
                    vec_property_value.get_vec_value(),
                    vec_property_type.get_vec_type(),
                ) {
                    (VecValue::Bool(_), Type::Bool)
                    | (VecValue::Uint16(_), Type::Uint16)
                    | (VecValue::Uint32(_), Type::Uint32)
                    | (VecValue::Uint64(_), Type::Uint64)
                    | (VecValue::Int16(_), Type::Int16)
                    | (VecValue::Int32(_), Type::Int32)
                    | (VecValue::Int64(_), Type::Int64)
                    | (VecValue::Text(_), Type::Text(_))
                    | (VecValue::Reference(_), Type::Reference(_, _)) => true,
                    _ => false,
                }
            }
            _ => false,
        }
    }

    pub fn ensure_valid_reference_prop(
        &self,
        value: &PropertyValue<T>,
        current_entity_controller: &EntityController<T>,
    ) -> dispatch::Result {
        match (value, &self.property_type) {
            (
                PropertyValue::Single(single_property_value),
                PropertyType::Single(single_property_type),
            ) => {
                if let (
                    Value::Reference(entity_id),
                    Type::Reference(class_id, same_controller_status),
                ) = (
                    single_property_value.get_value_ref(),
                    single_property_type.deref(),
                ) {
                    Self::ensure_referancable(
                        *class_id,
                        *entity_id,
                        *same_controller_status,
                        current_entity_controller,
                    )?;
                }
            }
            (
                PropertyValue::Vector(vec_property_value),
                PropertyType::Vector(vec_property_type),
            ) => {
                if let (
                    VecValue::Reference(entities_vec),
                    Type::Reference(class_id, same_controller_status),
                ) = (
                    vec_property_value.get_vec_value(),
                    vec_property_type.get_vec_type(),
                ) {
                    for entity_id in entities_vec.iter() {
                        Self::ensure_referancable(
                            *class_id,
                            *entity_id,
                            *same_controller_status,
                            current_entity_controller,
                        )?;
                    }
                }
            }
            _ => (),
        }
        Ok(())
    }

    pub fn ensure_referancable(
        class_id: T::ClassId,
        entity_id: T::EntityId,
        same_controller_status: bool,
        current_entity_controller: &EntityController<T>,
    ) -> dispatch::Result {
        Module::<T>::ensure_known_class_id(class_id)?;
        Module::<T>::ensure_known_entity_id(entity_id)?;
        let entity = Module::<T>::entity_by_id(entity_id);

        let entity_permissions = entity.get_permissions_ref();

        ensure!(
            entity_permissions.is_referancable(),
            ERROR_ENTITY_CAN_NOT_BE_REFRENCED
        );

        ensure!(
            entity.class_id == class_id,
            ERROR_PROP_DOES_NOT_MATCH_ITS_CLASS
        );
        if same_controller_status {
            ensure!(
                entity_permissions.controller_is_equal_to(current_entity_controller),
                ERROR_SAME_CONTROLLER_CONSTRAINT_VIOLATION
            );
        }
        Ok(())
    }

    /// Ensure `PropertyNameLengthConstraint` satisfied
    pub fn ensure_name_is_valid(&self) -> dispatch::Result {
        T::PropertyNameLengthConstraint::get().ensure_valid(
            self.name.len(),
            ERROR_PROPERTY_NAME_TOO_SHORT,
            ERROR_PROPERTY_NAME_TOO_LONG,
        )
    }

    /// Ensure `PropertyDescriptionLengthConstraint` satisfied
    pub fn ensure_description_is_valid(&self) -> dispatch::Result {
        T::PropertyDescriptionLengthConstraint::get().ensure_valid(
            self.description.len(),
            ERROR_PROPERTY_DESCRIPTION_TOO_SHORT,
            ERROR_PROPERTY_DESCRIPTION_TOO_LONG,
        )
    }

    /// Ensure `Type` specific constraints satisfied
    pub fn ensure_property_type_size_is_valid(&self) -> dispatch::Result {
        match &self.property_type {
            PropertyType::Single(single_property_type) => {
                single_property_type.ensure_property_type_size_is_valid()
            }
            PropertyType::Vector(vec_property_type) => {
                vec_property_type.ensure_property_type_size_is_valid()
            }
        }
    }

    /// If `Type::Reference`, ensure refers to existing `class_id`
    pub fn ensure_property_type_reference_is_valid(&self) -> dispatch::Result {
        let has_unknown_reference =
            if let Type::Reference(other_class_id, _) = self.property_type.get_inner_type() {
                !<ClassById<T>>::exists(other_class_id)
            } else {
                false
            };

        ensure!(
            !has_unknown_reference,
            ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_CLASS
        );

        Ok(())
    }
}
