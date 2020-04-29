use codec::{Decode, Encode};
#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};

pub type PropertyId = u16;
pub type SchemaId = u16;
pub type VecMaxLength = u16;
pub type TextMaxLength = u16;
use crate::*;

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Copy, PartialEq, Eq, Debug)]
pub enum PropertyType<T: Trait> {
    // Single value:
    Bool,
    Uint16,
    Uint32,
    Uint64,
    Int16,
    Int32,
    Int64,
    Text(TextMaxLength),
    Reference(T::ClassId),

    // Vector of values.
    // The first value is the max length of this vector.
    BoolVec(VecMaxLength),
    Uint16Vec(VecMaxLength),
    Uint32Vec(VecMaxLength),
    Uint64Vec(VecMaxLength),
    Int16Vec(VecMaxLength),
    Int32Vec(VecMaxLength),
    Int64Vec(VecMaxLength),

    /// The first value is the max length of this vector.
    /// The second value is the max length of every text item in this vector.
    TextVec(VecMaxLength, TextMaxLength),

    /// The first value is the max length of this vector.
    /// The second ClassId value tells that an every element of this vector
    /// should be of a specific ClassId.
    ReferenceVec(VecMaxLength, T::ClassId),
    // External(ExternalProperty),
    // ExternalVec(u16, ExternalProperty),
}

impl<T: Trait> Default for PropertyType<T> {
    fn default() -> Self {
        PropertyType::Bool
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum PropertyValue<T: Trait> {
    // Single value:
    Bool(bool),
    Uint16(u16),
    Uint32(u32),
    Uint64(u64),
    Int16(i16),
    Int32(i32),
    Int64(i64),
    Text(Vec<u8>),
    Reference(T::EntityId),

    // Vector of values, second value - nonce used to avoid race update conditions:
    BoolVec(Vec<bool>, T::Nonce),
    Uint16Vec(Vec<u16>, T::Nonce),
    Uint32Vec(Vec<u32>, T::Nonce),
    Uint64Vec(Vec<u64>, T::Nonce),
    Int16Vec(Vec<i16>, T::Nonce),
    Int32Vec(Vec<i32>, T::Nonce),
    Int64Vec(Vec<i64>, T::Nonce),
    TextVec(Vec<Vec<u8>>, T::Nonce),
    ReferenceVec(Vec<T::EntityId>, T::Nonce),
    // External(ExternalPropertyType),
    // ExternalVec(Vec<ExternalPropertyType>),
}

impl<T: Trait> PropertyValue<T> {
    pub fn update(&mut self, new_value: PropertyValue<T>) {
        if let Some(new_nonce) = self.try_increment_nonce() {
            *self = new_value;
            self.try_set_nonce(new_nonce)
        } else {
            *self = new_value;
        }
    }

    fn try_increment_nonce(&mut self) -> Option<T::Nonce> {
        // Increment nonce if property value is vec
        match self {
            PropertyValue::BoolVec(_, nonce)
            | PropertyValue::Uint16Vec(_, nonce)
            | PropertyValue::Uint32Vec(_, nonce)
            | PropertyValue::Uint64Vec(_, nonce)
            | PropertyValue::Int16Vec(_, nonce)
            | PropertyValue::Int32Vec(_, nonce)
            | PropertyValue::Int64Vec(_, nonce)
            | PropertyValue::TextVec(_, nonce)
            | PropertyValue::ReferenceVec(_, nonce) => {
                *nonce += T::Nonce::one();
                Some(*nonce)
            }
            _ => None,
        }
    }

    fn try_set_nonce(&mut self, new_nonce: T::Nonce) {
        // Set new nonce if property value is vec
        match self {
            PropertyValue::BoolVec(_, nonce)
            | PropertyValue::Uint16Vec(_, nonce)
            | PropertyValue::Uint32Vec(_, nonce)
            | PropertyValue::Uint64Vec(_, nonce)
            | PropertyValue::Int16Vec(_, nonce)
            | PropertyValue::Int32Vec(_, nonce)
            | PropertyValue::Int64Vec(_, nonce)
            | PropertyValue::TextVec(_, nonce)
            | PropertyValue::ReferenceVec(_, nonce) => *nonce = new_nonce,
            _ => (),
        }
    }

    pub fn get_nonce(&self) -> Option<T::Nonce> {
        match self {
            PropertyValue::BoolVec(_, nonce)
            | PropertyValue::Uint16Vec(_, nonce)
            | PropertyValue::Uint32Vec(_, nonce)
            | PropertyValue::Uint64Vec(_, nonce)
            | PropertyValue::Int16Vec(_, nonce)
            | PropertyValue::Int32Vec(_, nonce)
            | PropertyValue::Int64Vec(_, nonce)
            | PropertyValue::TextVec(_, nonce)
            | PropertyValue::ReferenceVec(_, nonce) => Some(*nonce),
            _ => None,
        }
    }

    pub fn is_vec(&self) -> bool {
        match self {
            PropertyValue::BoolVec(_, _)
            | PropertyValue::Uint16Vec(_, _)
            | PropertyValue::Uint32Vec(_, _)
            | PropertyValue::Uint64Vec(_, _)
            | PropertyValue::Int16Vec(_, _)
            | PropertyValue::Int32Vec(_, _)
            | PropertyValue::Int64Vec(_, _)
            | PropertyValue::TextVec(_, _)
            | PropertyValue::ReferenceVec(_, _) => true,
            _ => false,
        }
    }

    pub fn vec_clear(&mut self) {
        match self {
            PropertyValue::BoolVec(vec, _) => *vec = vec![],
            PropertyValue::Uint16Vec(vec, _) => *vec = vec![],
            PropertyValue::Uint32Vec(vec, _) => *vec = vec![],
            PropertyValue::Uint64Vec(vec, _) => *vec = vec![],
            PropertyValue::Int16Vec(vec, _) => *vec = vec![],
            PropertyValue::Int32Vec(vec, _) => *vec = vec![],
            PropertyValue::Int64Vec(vec, _) => *vec = vec![],
            PropertyValue::TextVec(vec, _) => *vec = vec![],
            PropertyValue::ReferenceVec(vec, _) => *vec = vec![],
            _ => (),
        }
        self.try_increment_nonce();
    }

    pub fn vec_remove_at(&mut self, index_in_property_vec: VecMaxLength) {
        fn remove_at_checked<T>(vec: &mut Vec<T>, index_in_property_vec: VecMaxLength) {
            if (index_in_property_vec as usize) < vec.len() {
                vec.remove(index_in_property_vec as usize);
            }
        }

        match self {
            PropertyValue::BoolVec(vec, _) => remove_at_checked(vec, index_in_property_vec),
            PropertyValue::Uint16Vec(vec, _) => remove_at_checked(vec, index_in_property_vec),
            PropertyValue::Uint32Vec(vec, _) => remove_at_checked(vec, index_in_property_vec),
            PropertyValue::Uint64Vec(vec, _) => remove_at_checked(vec, index_in_property_vec),
            PropertyValue::Int16Vec(vec, _) => remove_at_checked(vec, index_in_property_vec),
            PropertyValue::Int32Vec(vec, _) => remove_at_checked(vec, index_in_property_vec),
            PropertyValue::Int64Vec(vec, _) => remove_at_checked(vec, index_in_property_vec),
            PropertyValue::TextVec(vec, _) => remove_at_checked(vec, index_in_property_vec),
            PropertyValue::ReferenceVec(vec, _) => remove_at_checked(vec, index_in_property_vec),
            _ => (),
        }
        self.try_increment_nonce();
    }

    pub fn vec_insert_at(&mut self, index_in_property_vec: VecMaxLength, property_value: Self) {
        fn insert_at<T>(vec: &mut Vec<T>, index_in_property_vec: VecMaxLength, value: T) {
            if (index_in_property_vec as usize) < vec.len() {
                vec.insert(index_in_property_vec as usize, value);
            }
        }

        self.try_increment_nonce();

        match (self, property_value) {
            (PropertyValue::BoolVec(vec, _), PropertyValue::Bool(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (PropertyValue::Uint16Vec(vec, _), PropertyValue::Uint16(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (PropertyValue::Uint32Vec(vec, _), PropertyValue::Uint32(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (PropertyValue::Uint64Vec(vec, _), PropertyValue::Uint64(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (PropertyValue::Int16Vec(vec, _), PropertyValue::Int16(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (PropertyValue::Int32Vec(vec, _), PropertyValue::Int32(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (PropertyValue::Int64Vec(vec, _), PropertyValue::Int64(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (PropertyValue::TextVec(vec, _), PropertyValue::Text(ref value)) => {
                insert_at(vec, index_in_property_vec, value.to_owned())
            }
            (PropertyValue::ReferenceVec(vec, _), PropertyValue::Reference(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            _ => (),
        }
    }

    pub fn ensure_index_in_property_vector_is_valid(
        &self,
        index_in_property_vec: VecMaxLength,
    ) -> dispatch::Result {
        fn is_valid_index<T>(vec: &[T], index_in_property_vec: VecMaxLength) -> bool {
            (index_in_property_vec as usize) < vec.len()
        }

        let is_valid_index = match self {
            PropertyValue::BoolVec(vec, _) => is_valid_index(vec, index_in_property_vec),
            PropertyValue::Uint16Vec(vec, _) => is_valid_index(vec, index_in_property_vec),
            PropertyValue::Uint32Vec(vec, _) => is_valid_index(vec, index_in_property_vec),
            PropertyValue::Uint64Vec(vec, _) => is_valid_index(vec, index_in_property_vec),
            PropertyValue::Int16Vec(vec, _) => is_valid_index(vec, index_in_property_vec),
            PropertyValue::Int32Vec(vec, _) => is_valid_index(vec, index_in_property_vec),
            PropertyValue::Int64Vec(vec, _) => is_valid_index(vec, index_in_property_vec),
            PropertyValue::TextVec(vec, _) => is_valid_index(vec, index_in_property_vec),
            PropertyValue::ReferenceVec(vec, _) => is_valid_index(vec, index_in_property_vec),
            _ => return Err(ERROR_PROP_VALUE_UNDER_GIVEN_INDEX_IS_NOT_A_VECTOR),
        };

        ensure!(
            is_valid_index,
            ERROR_ENTITY_PROP_VALUE_VECTOR_INDEX_IS_OUT_OF_RANGE
        );
        Ok(())
    }

    pub fn is_unknown_internal_entity_id(id: PropertyValue<T>) -> bool {
        if let PropertyValue::Reference(entity_id) = id {
            !<EntityById<T>>::exists(entity_id)
        } else {
            false
        }
    }

    pub fn get_involved_entities(&self) -> Option<Vec<T::EntityId>> {
        match self {
            PropertyValue::Reference(entity_id) => Some(vec![*entity_id]),
            PropertyValue::ReferenceVec(entity_ids_vec, _) => Some(entity_ids_vec.clone()),
            _ => None,
        }
    }

    pub fn ensure_nonce_equality(&self, new_nonce: T::Nonce) -> dispatch::Result {
        if let Some(nonce) = self.get_nonce() {
            ensure!(
                nonce == new_nonce,
                ERROR_PROP_VALUE_VEC_NONCES_DOES_NOT_MATCH
            );
        }
        Ok(())
    }
}

impl<T: Trait> Default for PropertyValue<T> {
    fn default() -> Self {
        PropertyValue::Bool(false)
    }
}

/// A schema defines what properties describe an entity
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct Schema {
    /// Indices into properties vector for the corresponding class.
    pub properties: Vec<PropertyId>,
    pub is_active: bool,
}

impl Default for Schema {
    fn default() -> Self {
        Self {
            properties: vec![],
            // Default schema status
            is_active: true,
        }
    }
}

impl Schema {
    pub fn new(properties: Vec<PropertyId>) -> Self {
        Self {
            properties,
            // Default schema status
            is_active: true,
        }
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Property<T: Trait> {
    pub prop_type: PropertyType<T>,
    pub required: bool,
    pub name: Vec<u8>,
    pub description: Vec<u8>,
}

impl<T: Trait> Property<T> {
    pub fn ensure_property_value_to_update_is_valid(
        &self,
        value: &PropertyValue<T>,
    ) -> dispatch::Result {
        self.ensure_prop_value_matches_its_type(value)?;
        self.ensure_valid_internal_prop(value)?;
        self.validate_max_len_if_text_prop(value)?;
        self.validate_max_len_if_vec_prop(value)?;
        Ok(())
    }

    pub fn ensure_prop_value_can_be_inserted_at_prop_vec(
        &self,
        value: &PropertyValue<T>,
        entity_prop_value: &PropertyValue<T>,
        index_in_property_vec: VecMaxLength,
    ) -> dispatch::Result {
        entity_prop_value.ensure_index_in_property_vector_is_valid(index_in_property_vec)?;

        fn validate_prop_vec_len_after_value_insert<T>(vec: &[T], max_len: &VecMaxLength) -> bool {
            vec.len() < *max_len as usize
        }

        let is_valid_len = match (value, entity_prop_value, &self.prop_type) {
            // Single values
            (PV::Bool(_), PV::BoolVec(vec, _), PT::BoolVec(max_len)) => {
                validate_prop_vec_len_after_value_insert(vec, max_len)
            }
            (PV::Uint16(_), PV::Uint16Vec(vec, _), PT::Uint16Vec(max_len)) => {
                validate_prop_vec_len_after_value_insert(vec, max_len)
            }
            (PV::Uint32(_), PV::Uint32Vec(vec, _), PT::Uint32Vec(max_len)) => {
                validate_prop_vec_len_after_value_insert(vec, max_len)
            }
            (PV::Uint64(_), PV::Uint64Vec(vec, _), PT::Uint64Vec(max_len)) => {
                validate_prop_vec_len_after_value_insert(vec, max_len)
            }
            (PV::Int16(_), PV::Int16Vec(vec, _), PT::Int16Vec(max_len)) => {
                validate_prop_vec_len_after_value_insert(vec, max_len)
            }
            (PV::Int32(_), PV::Int32Vec(vec, _), PT::Int32Vec(max_len)) => {
                validate_prop_vec_len_after_value_insert(vec, max_len)
            }
            (PV::Int64(_), PV::Int64Vec(vec, _), PT::Int64Vec(max_len)) => {
                validate_prop_vec_len_after_value_insert(vec, max_len)
            }
            (PV::Text(text_item), PV::TextVec(vec, _), PT::TextVec(vec_max_len, text_max_len)) => {
                if validate_prop_vec_len_after_value_insert(vec, vec_max_len) {
                    Self::validate_max_len_of_text(text_item, *text_max_len)?;
                    true
                } else {
                    false
                }
            }
            (
                PV::Reference(entity_id),
                PV::ReferenceVec(vec, _),
                PT::ReferenceVec(vec_max_len, class_id),
            ) => {
                Module::<T>::ensure_known_class_id(*class_id)?;
                if validate_prop_vec_len_after_value_insert(vec, vec_max_len) {
                    Module::<T>::ensure_known_entity_id(*entity_id)?;
                    let entity = Module::<T>::entity_by_id(entity_id);
                    ensure!(
                        entity.class_id == *class_id,
                        ERROR_INTERNAL_PROP_DOES_NOT_MATCH_ITS_CLASS
                    );
                    true
                } else {
                    false
                }
            }
            _ => return Err(ERROR_PROP_VALUE_TYPE_DOESNT_MATCH_INTERNAL_ENTITY_VECTOR_TYPE),
        };

        ensure!(is_valid_len, ERROR_ENTITY_PROP_VALUE_VECTOR_IS_TOO_LONG);
        Ok(())
    }

    pub fn validate_max_len_if_text_prop(&self, value: &PropertyValue<T>) -> dispatch::Result {
        match (value, &self.prop_type) {
            (PV::Text(text), PT::Text(max_len)) => Self::validate_max_len_of_text(text, *max_len),
            _ => Ok(()),
        }
    }

    pub fn validate_max_len_of_text(text: &[u8], max_len: TextMaxLength) -> dispatch::Result {
        ensure!(text.len() <= max_len as usize, ERROR_TEXT_PROP_IS_TOO_LONG);
        Ok(())
    }

    pub fn validate_max_len_if_vec_prop(&self, value: &PropertyValue<T>) -> dispatch::Result {
        fn validate_vec_len<T>(vec: &[T], max_len: &VecMaxLength) -> bool {
            vec.len() <= *max_len as usize
        }

        let is_valid_len = match (value, &self.prop_type) {
            (PV::BoolVec(vec, _), PT::BoolVec(max_len)) => validate_vec_len(vec, max_len),
            (PV::Uint16Vec(vec, _), PT::Uint16Vec(max_len)) => validate_vec_len(vec, max_len),
            (PV::Uint32Vec(vec, _), PT::Uint32Vec(max_len)) => validate_vec_len(vec, max_len),
            (PV::Uint64Vec(vec, _), PT::Uint64Vec(max_len)) => validate_vec_len(vec, max_len),
            (PV::Int16Vec(vec, _), PT::Int16Vec(max_len)) => validate_vec_len(vec, max_len),
            (PV::Int32Vec(vec, _), PT::Int32Vec(max_len)) => validate_vec_len(vec, max_len),
            (PV::Int64Vec(vec, _), PT::Int64Vec(max_len)) => validate_vec_len(vec, max_len),

            (PV::TextVec(vec, _), PT::TextVec(vec_max_len, text_max_len)) => {
                if validate_vec_len(vec, vec_max_len) {
                    for text_item in vec.iter() {
                        Self::validate_max_len_of_text(text_item, *text_max_len)?;
                    }
                    true
                } else {
                    false
                }
            }

            (PV::ReferenceVec(vec, _), PT::ReferenceVec(vec_max_len, class_id)) => {
                Module::<T>::ensure_known_class_id(*class_id)?;
                if validate_vec_len(vec, vec_max_len) {
                    for entity_id in vec.iter() {
                        Module::<T>::ensure_known_entity_id(*entity_id)?;
                        let entity = Module::<T>::entity_by_id(entity_id);
                        ensure!(
                            entity.class_id == *class_id,
                            ERROR_INTERNAL_PROP_DOES_NOT_MATCH_ITS_CLASS
                        );
                    }
                    true
                } else {
                    false
                }
            }

            _ => true,
        };

        ensure!(is_valid_len, ERROR_VEC_PROP_IS_TOO_LONG);
        Ok(())
    }

    pub fn ensure_prop_value_matches_its_type(&self, value: &PropertyValue<T>) -> dispatch::Result {
        ensure!(
            self.does_prop_value_match_type(value),
            ERROR_PROP_VALUE_DONT_MATCH_TYPE
        );
        Ok(())
    }

    pub fn does_prop_value_match_type(&self, value: &PropertyValue<T>) -> bool {
        // A non required property can be updated to None:
        if !self.required && *value == PV::Bool(false) {
            return true;
        }
        match (value, &self.prop_type) {
                // Single values
                (PV::Bool(_),     PT::Bool) |
                (PV::Uint16(_),   PT::Uint16) |
                (PV::Uint32(_),   PT::Uint32) |
                (PV::Uint64(_),   PT::Uint64) |
                (PV::Int16(_),    PT::Int16) |
                (PV::Int32(_),    PT::Int32) |
                (PV::Int64(_),    PT::Int64) |
                (PV::Text(_),     PT::Text(_)) |
                (PV::Reference(_), PT::Reference(_)) |
                // Vectors:
                (PV::BoolVec(_, _),     PT::BoolVec(_)) |
                (PV::Uint16Vec(_, _),   PT::Uint16Vec(_)) |
                (PV::Uint32Vec(_, _),   PT::Uint32Vec(_)) |
                (PV::Uint64Vec(_, _),   PT::Uint64Vec(_)) |
                (PV::Int16Vec(_, _),    PT::Int16Vec(_)) |
                (PV::Int32Vec(_, _),    PT::Int32Vec(_)) |
                (PV::Int64Vec(_, _),    PT::Int64Vec(_)) |
                (PV::TextVec(_, _),     PT::TextVec(_, _)) |
                (PV::ReferenceVec(_, _), PT::ReferenceVec(_, _)) => true,
                // (PV::External(_), PT::External(_)) => true,
                // (PV::ExternalVec(_), PT::ExternalVec(_, _)) => true,
                _ => false,
            }
    }

    pub fn ensure_valid_internal_prop(&self, value: &PropertyValue<T>) -> dispatch::Result {
        match (value, &self.prop_type) {
            (PV::Reference(entity_id), PT::Reference(class_id)) => {
                Module::<T>::ensure_known_class_id(*class_id)?;
                Module::<T>::ensure_known_entity_id(*entity_id)?;
                let entity = Module::<T>::entity_by_id(entity_id);
                ensure!(
                    entity.class_id == *class_id,
                    ERROR_INTERNAL_PROP_DOES_NOT_MATCH_ITS_CLASS
                );
            }
            _ => (),
        }
        Ok(())
    }

    pub fn ensure_name_is_valid(&self) -> dispatch::Result {
        T::PropertyNameConstraint::get().ensure_valid(
            self.name.len(),
            ERROR_PROPERTY_NAME_TOO_SHORT,
            ERROR_PROPERTY_NAME_TOO_LONG,
        )
    }

    pub fn ensure_description_is_valid(&self) -> dispatch::Result {
        T::PropertyDescriptionConstraint::get().ensure_valid(
            self.description.len(),
            ERROR_PROPERTY_DESCRIPTION_TOO_SHORT,
            ERROR_PROPERTY_DESCRIPTION_TOO_LONG,
        )
    }
}
