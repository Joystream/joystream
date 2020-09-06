mod convert;
mod input;
mod output;

pub use convert::*;
pub use input::*;
pub use output::*;

pub use crate::{permissions::EntityAccessLevel, *};
pub use codec::{Decode, Encode};
use core::ops::Deref;
#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};

/// Type representing max length of vector property type
pub type VecMaxLength = u16;

/// Type representing max length of text property type
pub type TextMaxLength = u16;

/// Type representing max length of text property type, that will be subsequently hashed
pub type HashedTextMaxLength = Option<u16>;

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
    /// If property is locked from maintainer
    pub is_locked_from_maintainer: bool,
    /// If property is locked from controller
    pub is_locked_from_controller: bool,
}

/// Enum, used for `PropertyType` representation
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Copy, PartialEq, Eq, Debug)]
pub enum Type<ClassId> {
    Bool,
    Uint16,
    Uint32,
    Uint64,
    Int16,
    Int32,
    Int64,
    /// Max length of text item.
    Text(TextMaxLength),
    Hash(HashedTextMaxLength),
    /// Can reference only specific class id entities
    Reference(ClassId, SameController),
}

impl<ClassId> Default for Type<ClassId> {
    fn default() -> Self {
        Self::Bool
    }
}

impl<ClassId> Type<ClassId> {
    /// Ensure `Type` specific `TextMaxLengthConstraint` or `HashedTextMaxLengthConstraint` satisfied
    pub fn ensure_property_type_size_is_valid<T: Trait>(&self) -> Result<(), Error<T>> {
        if let Type::Text(text_max_len) = self {
            ensure!(
                *text_max_len <= T::TextMaxLengthConstraint::get(),
                Error::<T>::TextPropertyTooLong
            );
        }

        if let Type::Hash(hashed_text_max_len) = self {
            ensure!(
                *hashed_text_max_len <= T::HashedTextMaxLengthConstraint::get(),
                Error::<T>::HashedTextPropertyTooLong
            );
        }

        Ok(())
    }
}

/// Vector property type representation
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Copy, PartialEq, Eq, Debug)]
pub struct VecPropertyType<ClassId> {
    vec_type: Type<ClassId>,
    /// Max length of vector, corresponding to a given type
    max_length: VecMaxLength,
}

impl<ClassId> Default for VecPropertyType<ClassId> {
    fn default() -> Self {
        Self {
            vec_type: Type::default(),
            max_length: 0,
        }
    }
}

impl<ClassId> VecPropertyType<ClassId> {
    /// Create new `VecPropertyType` from provided `type` and `max_length`
    pub fn new(vec_type: Type<ClassId>, max_length: VecMaxLength) -> Self {
        Self {
            vec_type,
            max_length,
        }
    }

    /// Ensure `Type` specific `TextMaxLengthConstraint` & `VecMaxLengthConstraint` satisfied
    fn ensure_property_type_size_is_valid<T: Trait>(&self) -> Result<(), Error<T>> {
        // Ensure Type specific TextMaxLengthConstraint or HashedTextMaxLengthConstraint satisfied
        self.vec_type.ensure_property_type_size_is_valid()?;

        ensure!(
            self.max_length <= T::VecMaxLengthConstraint::get(),
            Error::<T>::VecPropertyTooLong
        );
        Ok(())
    }

    fn get_vec_type(&self) -> &Type<ClassId> {
        &self.vec_type
    }

    fn get_max_len(&self) -> VecMaxLength {
        self.max_length
    }
}

/// Enum, representing either `Type` or `VecPropertyType`
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Copy, PartialEq, Eq, Debug)]
pub enum PropertyType<ClassId> {
    Single(Type<ClassId>),
    Vector(VecPropertyType<ClassId>),
}

impl<ClassId> Default for PropertyType<ClassId> {
    fn default() -> Self {
        Self::Single(Type::default())
    }
}

impl<ClassId> PropertyType<ClassId> {
    fn as_single_value_type(&self) -> Option<&Type<ClassId>> {
        if let PropertyType::Single(single_value_property_type) = self {
            Some(single_value_property_type)
        } else {
            None
        }
    }

    pub fn as_vec_type(&self) -> Option<&VecPropertyType<ClassId>> {
        if let PropertyType::Vector(vec_value_property_type) = self {
            Some(vec_value_property_type)
        } else {
            None
        }
    }

    fn get_inner_type(&self) -> &Type<ClassId> {
        match self {
            PropertyType::Single(single_property_type) => single_property_type,
            PropertyType::Vector(vec_property_type) => vec_property_type.get_vec_type(),
        }
    }

    /// Retrives `same_controller` flag.
    /// Always returns false if `Type` is not a reference,
    pub fn same_controller_status(&self) -> SameController {
        if let Type::Reference(_, same_controller) = self.get_inner_type() {
            *same_controller
        } else {
            false
        }
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
    pub fn ensure_is_active<T: Trait>(&self) -> Result<(), Error<T>> {
        ensure!(self.is_active, Error::<T>::ClassSchemaNotActive);
        Ok(())
    }

    /// Get `Schema` `properties` by reference
    pub fn get_properties(&self) -> &BTreeSet<PropertyId> {
        &self.properties
    }

    /// Ensure keys of provided `property_values` are valid indices of current `Schema`
    pub fn ensure_has_properties<T: Trait>(
        &self,
        property_values: &BTreeMap<
            PropertyId,
            InputPropertyValue<
                <T as system::Trait>::Hashing,
                <T as system::Trait>::Hash,
                T::EntityId,
            >,
        >,
    ) -> Result<(), Error<T>> {
        let property_value_indices: BTreeSet<PropertyId> =
            property_values.keys().cloned().collect();

        ensure!(
            property_value_indices.is_subset(&self.properties),
            Error::<T>::SchemaDoesNotContainProvidedPropertyId
        );

        Ok(())
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
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct Property<ClassId> {
    /// The type of `Property`
    pub property_type: PropertyType<ClassId>,
    /// If property value can be skipped, when adding entity schema support
    pub required: bool,
    /// Used to enforce uniquness of a property across all entities that have this property
    pub unique: bool,
    /// Property name
    pub name: Vec<u8>,
    /// Property description
    pub description: Vec<u8>,
    /// Locking policy, representing `Property` locking status for both controller and maintainer
    pub locking_policy: PropertyLockingPolicy,
}

impl<ClassId> Default for Property<ClassId> {
    fn default() -> Self {
        Self {
            property_type: PropertyType::<ClassId>::default(),
            required: false,
            unique: false,
            name: vec![],
            description: vec![],
            locking_policy: PropertyLockingPolicy::default(),
        }
    }
}

impl<ClassId> Property<ClassId> {
    /// Check if property is locked from actor with provided `EntityAccessLevel`
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
    pub fn ensure_unlocked_from<T: Trait>(
        &self,
        access_level: EntityAccessLevel,
    ) -> Result<(), Error<T>> {
        ensure!(
            !self.is_locked_from(access_level),
            Error::<T>::ClassPropertyTypeLockedForGivenActor
        );
        Ok(())
    }

    /// Validate new `InputPropertyValue` against the type of this `Property`
    /// and check any additional constraints
    pub fn ensure_property_value_to_update_is_valid<T: Trait>(
        &self,
        value: &InputPropertyValue<
            <T as system::Trait>::Hashing,
            <T as system::Trait>::Hash,
            T::EntityId,
        >,
        current_entity_controller: &EntityController<T::MemberId>,
    ) -> Result<(), Error<T>> {
        // Ensure provided InputPropertyValue matches its Type
        self.ensure_property_value_matches_its_type(value)?;

        // Perform all required checks to ensure provided InputPropertyValue is valid, when current PropertyType is Reference
        self.ensure_property_value_is_valid_reference(value, current_entity_controller)?;

        // Ensure text property does not exceed its max length
        self.validate_max_len_if_text_property(value)?;

        // Ensure vector property does not exceed its max length
        self.validate_max_len_if_vec_property(value)?;
        Ok(())
    }

    /// Ensure property vector length after value inserted is valid
    fn validate_property_vector_length_after_value_insert<V, T: Trait>(
        vec: &[V],
        max_len: VecMaxLength,
    ) -> Result<(), Error<T>> {
        ensure!(
            vec.len() < max_len as usize,
            Error::<T>::EntityPropertyValueVectorIsTooLong
        );
        Ok(())
    }

    /// Ensure `SingleInputPropertyValue` type is equal to the `VecInputPropertyValue` type
    /// and check all constraints
    pub fn ensure_property_value_can_be_inserted_at_property_vector<T: Trait>(
        &self,
        single_value: &InputValue<
            <T as system::Trait>::Hashing,
            <T as system::Trait>::Hash,
            T::EntityId,
        >,
        vec_value: &VecStoredPropertyValue<T::Nonce, T::Hash, T::EntityId>,
        index_in_property_vec: VecMaxLength,
        current_entity_controller: &EntityController<T::MemberId>,
    ) -> Result<(), Error<T>> {
        // Ensure, provided index_in_property_vec is valid index of VecInputValue
        vec_value.ensure_index_in_property_vector_is_valid(index_in_property_vec)?;

        let property_type_vec = self
            .property_type
            .as_vec_type()
            .ok_or(Error::<T>::PropertyValueTypeDoesNotMatchInternalVectorType)?;

        let max_vec_len = property_type_vec.get_max_len();

        match (
            single_value,
            vec_value.get_vec_value_ref(),
            property_type_vec.get_vec_type(),
        ) {
            // Single values
            (InputValue::Bool(_), VecStoredValue::Bool(vec), Type::Bool) => {
                Self::validate_property_vector_length_after_value_insert(vec, max_vec_len)
            }
            (InputValue::Uint16(_), VecStoredValue::Uint16(vec), Type::Uint16) => {
                Self::validate_property_vector_length_after_value_insert(vec, max_vec_len)
            }
            (InputValue::Uint32(_), VecStoredValue::Uint32(vec), Type::Uint32) => {
                Self::validate_property_vector_length_after_value_insert(vec, max_vec_len)
            }
            (InputValue::Uint64(_), VecStoredValue::Uint64(vec), Type::Uint64) => {
                Self::validate_property_vector_length_after_value_insert(vec, max_vec_len)
            }
            (InputValue::Int16(_), VecStoredValue::Int16(vec), Type::Int16) => {
                Self::validate_property_vector_length_after_value_insert(vec, max_vec_len)
            }
            (InputValue::Int32(_), VecStoredValue::Int32(vec), Type::Int32) => {
                Self::validate_property_vector_length_after_value_insert(vec, max_vec_len)
            }
            (InputValue::Int64(_), VecStoredValue::Int64(vec), Type::Int64) => {
                Self::validate_property_vector_length_after_value_insert(vec, max_vec_len)
            }
            (InputValue::Text(text_item), VecStoredValue::Text(vec), Type::Text(text_max_len)) => {
                Self::validate_max_len_of_text(text_item, *text_max_len)?;
                Self::validate_property_vector_length_after_value_insert(vec, max_vec_len)
            }
            (
                InputValue::TextToHash(text_item),
                VecStoredValue::Hash(vec),
                Type::Hash(text_max_len),
            ) => {
                if let Some(text_max_len) = text_max_len {
                    Self::validate_max_len_of_text_to_be_hashed(text_item, *text_max_len)?;
                }
                Self::validate_property_vector_length_after_value_insert(vec, max_vec_len)
            }
            (
                InputValue::Reference(entity_id),
                VecStoredValue::Reference(vec),
                Type::Reference(class_id, same_controller_status),
            ) => {
                // Ensure class_id of Entity under provided entity_id references Entity,
                // which class_id is equal to class_id, declared in corresponding PropertyType
                // Retrieve corresponding Entity
                let entity = Self::ensure_referenced_entity_match_its_class(*entity_id, *class_id)?;
                // Ensure Entity can be referenced.
                Self::ensure_entity_can_be_referenced(
                    entity,
                    *same_controller_status,
                    current_entity_controller,
                )?;
                Self::validate_property_vector_length_after_value_insert(vec, max_vec_len)
            }
            _ => Err(Error::<T>::PropertyValueTypeDoesNotMatchInternalVectorType),
        }
    }

    /// Ensure text property does not exceed its max len
    pub fn validate_max_len_if_text_property<T: Trait>(
        &self,
        value: &InputPropertyValue<
            <T as system::Trait>::Hashing,
            <T as system::Trait>::Hash,
            T::EntityId,
        >,
    ) -> Result<(), Error<T>> {
        let single_value = value.as_single_value();

        match (single_value, &self.property_type.as_single_value_type()) {
            (Some(InputValue::Text(text)), Some(Type::Text(text_max_len))) => {
                Self::validate_max_len_of_text(text, *text_max_len)
            }
            (
                Some(InputValue::TextToHash(text_to_be_hashed)),
                Some(Type::Hash(Some(text_to_be_hashed_max_len))),
            ) => Self::validate_max_len_of_text_to_be_hashed(
                text_to_be_hashed,
                *text_to_be_hashed_max_len,
            ),
            _ => Ok(()),
        }
    }

    fn validate_max_len_of_text<T: Trait>(
        text: &[u8],
        text_max_len: TextMaxLength,
    ) -> Result<(), Error<T>> {
        ensure!(
            text.len() <= text_max_len as usize,
            Error::<T>::TextPropertyTooLong
        );
        Ok(())
    }

    fn validate_max_len_of_text_to_be_hashed<T: Trait>(
        text_to_be_hashed: &[u8],
        text_to_be_hashed_max_len: u16,
    ) -> Result<(), Error<T>> {
        ensure!(
            text_to_be_hashed.len() <= text_to_be_hashed_max_len as usize,
            Error::<T>::HashedTextPropertyTooLong
        );
        Ok(())
    }

    fn validate_vec_len<V, T: Trait>(vec: &[V], max_len: VecMaxLength) -> Result<(), Error<T>> {
        ensure!(
            vec.len() <= max_len as usize,
            Error::<T>::VecPropertyTooLong
        );
        Ok(())
    }

    /// Ensure `VecInputValue` does not exceed its max len
    pub fn validate_max_len_if_vec_property<T: Trait>(
        &self,
        value: &InputPropertyValue<
            <T as system::Trait>::Hashing,
            <T as system::Trait>::Hash,
            T::EntityId,
        >,
    ) -> Result<(), Error<T>> {
        let (vec_value, vec_property_type) = if let (Some(vec_value), Some(vec_property_type)) =
            (value.as_vec_value(), self.property_type.as_vec_type())
        {
            (vec_value, vec_property_type)
        } else {
            return Ok(());
        };

        let max_len = vec_property_type.get_max_len();

        match vec_value {
            VecInputValue::Bool(vec) => Self::validate_vec_len(vec, max_len),
            VecInputValue::Uint16(vec) => Self::validate_vec_len(vec, max_len),
            VecInputValue::Uint32(vec) => Self::validate_vec_len(vec, max_len),
            VecInputValue::Uint64(vec) => Self::validate_vec_len(vec, max_len),
            VecInputValue::Int16(vec) => Self::validate_vec_len(vec, max_len),
            VecInputValue::Int32(vec) => Self::validate_vec_len(vec, max_len),
            VecInputValue::Int64(vec) => Self::validate_vec_len(vec, max_len),
            VecInputValue::TextToHash(vec) => {
                Self::validate_vec_len(vec, max_len)?;
                if let Type::Hash(Some(text_to_be_hashed_max_len)) =
                    vec_property_type.get_vec_type()
                {
                    for text_to_be_hashed_item in vec.iter() {
                        Self::validate_max_len_of_text_to_be_hashed(
                            text_to_be_hashed_item,
                            *text_to_be_hashed_max_len,
                        )?;
                    }
                }
                Ok(())
            }
            VecInputValue::Text(vec) => {
                Self::validate_vec_len(vec, max_len)?;
                if let Type::Text(text_max_len) = vec_property_type.get_vec_type() {
                    for text_item in vec.iter() {
                        Self::validate_max_len_of_text(text_item, *text_max_len)?;
                    }
                }
                Ok(())
            }
            VecInputValue::Reference(vec) => Self::validate_vec_len(vec, max_len),
        }
    }

    /// Ensure provided `InputPropertyValue` matches its `Type`
    pub fn ensure_property_value_matches_its_type<T: Trait>(
        &self,
        value: &InputPropertyValue<
            <T as system::Trait>::Hashing,
            <T as system::Trait>::Hash,
            T::EntityId,
        >,
    ) -> Result<(), Error<T>> {
        ensure!(
            self.does_prop_value_match_type(value),
            Error::<T>::PropertyValueDoNotMatchType
        );
        Ok(())
    }

    /// Check if provided `InputPropertyValue` matches its `Type`
    pub fn does_prop_value_match_type<T: Trait>(
        &self,
        value: &InputPropertyValue<
            <T as system::Trait>::Hashing,
            <T as system::Trait>::Hash,
            T::EntityId,
        >,
    ) -> bool {
        // A non required property can be updated to Bool(false):
        if !self.required && *value == InputPropertyValue::default() {
            return true;
        }
        match (value, &self.property_type) {
            (
                InputPropertyValue::Single(single_property_value),
                PropertyType::Single(ref single_property_type),
            ) => match (single_property_value, single_property_type.deref()) {
                (InputValue::Bool(_), Type::Bool)
                | (InputValue::Uint16(_), Type::Uint16)
                | (InputValue::Uint32(_), Type::Uint32)
                | (InputValue::Uint64(_), Type::Uint64)
                | (InputValue::Int16(_), Type::Int16)
                | (InputValue::Int32(_), Type::Int32)
                | (InputValue::Int64(_), Type::Int64)
                | (InputValue::Text(_), Type::Text(_))
                | (InputValue::TextToHash(_), Type::Hash(_))
                | (InputValue::Reference(_), Type::Reference(_, _)) => true,
                _ => false,
            },
            (
                InputPropertyValue::Vector(vec_value),
                PropertyType::Vector(ref vec_property_type),
            ) => match (vec_value, vec_property_type.get_vec_type()) {
                (VecInputValue::Bool(_), Type::Bool)
                | (VecInputValue::Uint16(_), Type::Uint16)
                | (VecInputValue::Uint32(_), Type::Uint32)
                | (VecInputValue::Uint64(_), Type::Uint64)
                | (VecInputValue::Int16(_), Type::Int16)
                | (VecInputValue::Int32(_), Type::Int32)
                | (VecInputValue::Int64(_), Type::Int64)
                | (VecInputValue::Text(_), Type::Text(_))
                | (VecInputValue::TextToHash(_), Type::Hash(_))
                | (VecInputValue::Reference(_), Type::Reference(_, _)) => true,
                _ => false,
            },
            _ => false,
        }
    }

    /// Perform all required checks to ensure provided `InputPropertyValue` is valid,
    /// when current `PropertyType` is `Reference`
    pub fn ensure_property_value_is_valid_reference<T: Trait>(
        &self,
        value: &InputPropertyValue<
            <T as system::Trait>::Hashing,
            <T as system::Trait>::Hash,
            T::EntityId,
        >,
        current_entity_controller: &EntityController<T::MemberId>,
    ) -> Result<(), Error<T>> {
        match (value, &self.property_type) {
            (
                InputPropertyValue::Single(single_property_value),
                PropertyType::Single(single_property_type),
            ) => {
                if let (
                    InputValue::Reference(entity_id),
                    Type::Reference(class_id, same_controller_status),
                ) = (single_property_value, single_property_type.deref())
                {
                    // Ensure class_id of Entity under provided entity_id references Entity,
                    // which class_id is equal to class_id, declared in corresponding PropertyType
                    // Retrieve corresponding Entity
                    let entity =
                        Self::ensure_referenced_entity_match_its_class(*entity_id, *class_id)?;

                    // Ensure Entity can be referenced.
                    Self::ensure_entity_can_be_referenced(
                        entity,
                        *same_controller_status,
                        current_entity_controller,
                    )?;
                }
            }
            (InputPropertyValue::Vector(vec_value), PropertyType::Vector(vec_property_type)) => {
                if let (
                    VecInputValue::Reference(entity_ids),
                    Type::Reference(class_id, same_controller_status),
                ) = (vec_value, vec_property_type.get_vec_type())
                {
                    for entity_id in entity_ids.iter() {
                        // Ensure class_id of Entity under provided entity_id references Entity,
                        // which class_id is equal to class_id, declared in corresponding PropertyType
                        // Retrieve corresponding Entity
                        let entity =
                            Self::ensure_referenced_entity_match_its_class(*entity_id, *class_id)?;

                        // Ensure Entity can be referenced.
                        Self::ensure_entity_can_be_referenced(
                            entity,
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

    /// Ensure `class_id` of `Entity` under provided `entity_id` references `Entity`, which `class_id` is equal to `class_id`,
    /// declared in corresponding `PropertyType`.
    /// Returns  corresponding `Entity` instance
    pub fn ensure_referenced_entity_match_its_class<T: Trait>(
        entity_id: T::EntityId,
        class_id: T::ClassId,
    ) -> Result<Entity<T::ClassId, T::EntityId, T::MemberId, T::Nonce, T::Hash>, Error<T>> {
        // Ensure Entity under given id exists
        Module::<T>::ensure_known_entity_id(entity_id)?;

        let entity = Module::<T>::entity_by_id(entity_id);
        ensure!(
            entity.get_class_id() == class_id,
            Error::<T>::ReferencedEntityDoesNotMatchItsClass
        );
        Ok(entity)
    }

    /// Ensure `Entity` can be referenced.
    pub fn ensure_entity_can_be_referenced<T: Trait>(
        entity: Entity<T::ClassId, T::EntityId, T::MemberId, T::Nonce, T::Hash>,
        same_controller_status: bool,
        current_entity_controller: &EntityController<T::MemberId>,
    ) -> Result<(), Error<T>> {
        let entity_permissions = entity.get_permissions();

        // Ensure Entity is referencable
        ensure!(
            entity_permissions.is_referancable(),
            Error::<T>::EntityCanNotBeReferenced
        );

        if same_controller_status {
            // Ensure Entity controller is equal to the provided one
            ensure!(
                entity_permissions.controller_is_equal_to(current_entity_controller),
                Error::<T>::SameControllerConstraintViolation
            );
        }
        Ok(())
    }

    /// Ensure `PropertyNameLengthConstraint` satisfied
    pub fn ensure_name_is_valid<T: Trait>(&self) -> Result<(), Error<T>> {
        T::PropertyNameLengthConstraint::get().ensure_valid(
            self.name.len(),
            Error::<T>::PropertyNameTooShort,
            Error::<T>::PropertyNameTooLong,
        )
    }

    /// Ensure `PropertyDescriptionLengthConstraint` satisfied
    pub fn ensure_description_is_valid<T: Trait>(&self) -> Result<(), Error<T>> {
        T::PropertyDescriptionLengthConstraint::get().ensure_valid(
            self.description.len(),
            Error::<T>::PropertyDescriptionTooShort,
            Error::<T>::PropertyDescriptionTooLong,
        )
    }

    /// Ensure `Type` specific constraints satisfied
    pub fn ensure_property_type_size_is_valid<T: Trait>(&self) -> Result<(), Error<T>> {
        match &self.property_type {
            PropertyType::Single(single_property_type) => {
                // Ensure Type specific TextMaxLengthConstraint satisfied
                single_property_type.ensure_property_type_size_is_valid()
            }
            PropertyType::Vector(vec_property_type) => {
                // Ensure Type specific TextMaxLengthConstraint & VecMaxLengthConstraint satisfied
                vec_property_type.ensure_property_type_size_is_valid()
            }
        }
    }

    /// Ensure refers to existing `class_id`, if If `Property` `Type` is `Reference`,
    pub fn ensure_property_type_reference_is_valid<T: Trait>(&self) -> Result<(), Error<T>> {
        let has_unknown_reference =
            if let Type::Reference(other_class_id, _) = self.property_type.get_inner_type() {
                !<ClassById<T>>::contains_key(other_class_id)
            } else {
                false
            };

        ensure!(
            !has_unknown_reference,
            Error::<T>::ClassSchemaRefersUnknownClass
        );

        Ok(())
    }
}
