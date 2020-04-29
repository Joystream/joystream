
#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};
use codec::{Decode, Encode};

pub type PropertyId = u16;
pub type SchemaId = u16;
pub type VecMaxLength = u16;
pub type TextMaxLength = u16;
use crate::*;

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

impl <T: Trait> Default for PropertyType<T> {
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
}

impl<T: Trait> Default for PropertyValue<T> {
    fn default() -> Self {
        PropertyValue::Bool(false)
    }
}