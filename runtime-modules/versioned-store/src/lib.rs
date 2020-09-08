// Copyright 2019 Jsgenesis.
//
// This is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Substrate. If not, see <http://www.gnu.org/licenses/>.

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

use codec::{Decode, Encode};
use frame_support::{decl_event, decl_module, decl_storage, ensure};
use sp_std::collections::btree_set::BTreeSet;
use sp_std::vec;
use sp_std::vec::Vec;

mod example;
mod mock;
mod tests;

//TODO: Convert errors to the Substrate decl_error! macro.
/// Result with string error message. This exists for backward compatibility purpose.
pub type DispatchResult = Result<(), &'static str>;

// Validation errors
// --------------------------------------

const ERROR_PROPERTY_NAME_TOO_SHORT: &str = "Property name is too short";
const ERROR_PROPERTY_NAME_TOO_LONG: &str = "Property name is too long";
const ERROR_PROPERTY_DESCRIPTION_TOO_SHORT: &str = "Property description is too long";
const ERROR_PROPERTY_DESCRIPTION_TOO_LONG: &str = "Property description is too long";

const ERROR_CLASS_NAME_TOO_SHORT: &str = "Class name is too short";
const ERROR_CLASS_NAME_TOO_LONG: &str = "Class name is too long";
const ERROR_CLASS_DESCRIPTION_TOO_SHORT: &str = "Class description is too long";
const ERROR_CLASS_DESCRIPTION_TOO_LONG: &str = "Class description is too long";

// Main logic errors
// --------------------------------------

const ERROR_CLASS_NOT_FOUND: &str = "Class was not found by id";
const ERROR_UNKNOWN_CLASS_SCHEMA_ID: &str = "Unknown class schema id";
const ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_PROP_INDEX: &str =
    "New class schema refers to an unknown property index";
const ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_INTERNAL_ID: &str =
    "New class schema refers to an unknown internal class id";
const ERROR_NO_PROPS_IN_CLASS_SCHEMA: &str =
    "Cannot add a class schema with an empty list of properties";
const ERROR_ENTITY_NOT_FOUND: &str = "Entity was not found by id";
// const ERROR_ENTITY_ALREADY_DELETED: &str = "Entity is already deleted";
const ERROR_SCHEMA_ALREADY_ADDED_TO_ENTITY: &str =
    "Cannot add a schema that is already added to this entity";
const ERROR_PROP_VALUE_DONT_MATCH_TYPE: &str =
    "Some of the provided property values don't match the expected property type";
const ERROR_PROP_NAME_NOT_UNIQUE_IN_CLASS: &str = "Property name is not unique within its class";
const ERROR_MISSING_REQUIRED_PROP: &str =
    "Some required property was not found when adding schema support to entity";
const ERROR_UNKNOWN_ENTITY_PROP_ID: &str = "Some of the provided property ids cannot be found on the current list of propery values of this entity";
const ERROR_TEXT_PROP_IS_TOO_LONG: &str = "Text propery is too long";
const ERROR_VEC_PROP_IS_TOO_LONG: &str = "Vector propery is too long";
const ERROR_INTERNAL_RPOP_DOES_NOT_MATCH_ITS_CLASS: &str =
    "Internal property does not match its class";

/// Length constraint for input validation
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
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
    /// Helper for computing max
    pub fn max(&self) -> u16 {
        self.min + self.max_min_diff
    }

    pub fn ensure_valid(
        &self,
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

pub type ClassId = u64;
pub type EntityId = u64;

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Class {
    pub id: ClassId,

    /// All properties that have been used on this class across different class schemas.
    /// Unlikely to be more than roughly 20 properties per class, often less.
    /// For Person, think "height", "weight", etc.
    pub properties: Vec<Property>,

    /// All scehmas that are available for this class, think v0.0 Person, v.1.0 Person, etc.
    pub schemas: Vec<ClassSchema>,

    pub name: Vec<u8>,
    pub description: Vec<u8>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Entity {
    pub id: EntityId,

    /// The class id of this entity.
    pub class_id: ClassId,

    /// What schemas under which this entity of a class is available, think
    /// v.2.0 Person schema for John, v3.0 Person schema for John
    /// Unlikely to be more than roughly 20ish, assuming schemas for a given class eventually stableize, or that very old schema are eventually removed.
    pub in_class_schema_indexes: Vec<u16>, // indices of schema in corresponding class

    /// Values for properties on class that are used by some schema used by this entity!
    /// Length is no more than Class.properties.
    pub values: Vec<ClassPropertyValue>,
}

/// A schema defines what properties describe an entity
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ClassSchema {
    /// Indices into properties vector for the corresponding class.
    pub properties: Vec<u16>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Property {
    pub prop_type: PropertyType,
    pub required: bool,
    pub name: Vec<u8>,
    pub description: Vec<u8>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum PropertyType {
    None,

    // Single value:
    Bool,
    Uint16,
    Uint32,
    Uint64,
    Int16,
    Int32,
    Int64,
    Text(u16),
    Internal(ClassId),

    // Vector of values.
    // The first u16 value is the max length of this vector.
    BoolVec(u16),
    Uint16Vec(u16),
    Uint32Vec(u16),
    Uint64Vec(u16),
    Int16Vec(u16),
    Int32Vec(u16),
    Int64Vec(u16),

    /// The first u16 value is the max length of this vector.
    /// The second u16 value is the max length of every text item in this vector.
    TextVec(u16, u16),

    /// The first u16 value is the max length of this vector.
    /// The second ClassId value tells that an every element of this vector
    /// should be of a specific ClassId.
    InternalVec(u16, ClassId),
    // External(ExternalProperty),
    // ExternalVec(u16, ExternalProperty),
}

impl Default for PropertyType {
    fn default() -> Self {
        PropertyType::None
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum PropertyValue {
    None,

    // Single value:
    Bool(bool),
    Uint16(u16),
    Uint32(u32),
    Uint64(u64),
    Int16(i16),
    Int32(i32),
    Int64(i64),
    Text(Vec<u8>),
    Internal(EntityId),

    // Vector of values:
    BoolVec(Vec<bool>),
    Uint16Vec(Vec<u16>),
    Uint32Vec(Vec<u32>),
    Uint64Vec(Vec<u64>),
    Int16Vec(Vec<i16>),
    Int32Vec(Vec<i32>),
    Int64Vec(Vec<i64>),
    TextVec(Vec<Vec<u8>>),
    InternalVec(Vec<EntityId>),
    // External(ExternalPropertyType),
    // ExternalVec(Vec<ExternalPropertyType>),
}

impl Default for PropertyValue {
    fn default() -> Self {
        PropertyValue::None
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ClassPropertyValue {
    /// Index is into properties vector of class.
    pub in_class_index: u16,

    /// Value of property with index `in_class_index` in a given class.
    pub value: PropertyValue,
}

pub trait Trait: system::Trait + Sized {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

decl_storage! {

    trait Store for Module<T: Trait> as VersionedStore {

        pub ClassById get(fn class_by_id) config(): map hasher(blake2_128_concat) ClassId => Class;

        pub EntityById get(fn entity_by_id) config(): map hasher(blake2_128_concat) EntityId => Entity;

        pub NextClassId get(fn next_class_id) config(): ClassId;

        pub NextEntityId get(fn next_entity_id) config(): EntityId;

        pub PropertyNameConstraint get(fn property_name_constraint)
            config(): InputValidationLengthConstraint;

        pub PropertyDescriptionConstraint get(fn property_description_constraint)
            config(): InputValidationLengthConstraint;

        pub ClassNameConstraint get(fn class_name_constraint)
            config(): InputValidationLengthConstraint;

        pub ClassDescriptionConstraint get(fn class_description_constraint)
            config(): InputValidationLengthConstraint;
    }
}

decl_event!(
    pub enum Event<T>
    where
        <T as system::Trait>::AccountId,
    {
        ClassCreated(ClassId),
        ClassSchemaAdded(ClassId, u16),

        EntityCreated(EntityId),
        // EntityDeleted(EntityId),
        EntityPropertiesUpdated(EntityId),
        EntitySchemaAdded(EntityId, u16),

        /// This is a fake event that uses AccountId type just to make Rust compiler happy to compile this module.
        FixCompilation(AccountId),
    }
);

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event() = default;
    }
}

// Shortcuts for faster readability of match expression:
use PropertyType as PT;
use PropertyValue as PV;

impl<T: Trait> Module<T> {
    /// Returns an id of a newly added class.
    pub fn create_class(name: Vec<u8>, description: Vec<u8>) -> Result<ClassId, &'static str> {
        Self::ensure_class_name_is_valid(&name)?;

        Self::ensure_class_description_is_valid(&description)?;

        let class_id = NextClassId::get();

        let new_class = Class {
            id: class_id,
            properties: vec![],
            schemas: vec![],
            name,
            description,
        };

        // Save newly created class:
        ClassById::insert(class_id, new_class);

        // Increment the next class id:
        NextClassId::mutate(|n| *n += 1);

        Self::deposit_event(RawEvent::ClassCreated(class_id));
        Ok(class_id)
    }

    /// Returns an index of a newly added class schema on success.
    pub fn add_class_schema(
        class_id: ClassId,
        existing_properties: Vec<u16>,
        new_properties: Vec<Property>,
    ) -> Result<u16, &'static str> {
        Self::ensure_known_class_id(class_id)?;

        let non_empty_schema = !existing_properties.is_empty() || !new_properties.is_empty();

        ensure!(non_empty_schema, ERROR_NO_PROPS_IN_CLASS_SCHEMA);

        let class = ClassById::get(class_id);

        // TODO Use BTreeSet for prop unique names when switched to Substrate 2.
        // There is no support for BTreeSet in Substrate 1 runtime.
        // use sp_std::collections::btree_set::BTreeSet;
        let mut unique_prop_names = BTreeSet::new();
        for prop in class.properties.iter() {
            unique_prop_names.insert(prop.name.clone());
        }

        for prop in new_properties.iter() {
            Self::ensure_property_name_is_valid(&prop.name)?;
            Self::ensure_property_description_is_valid(&prop.description)?;

            // Check that the name of a new property is unique within its class.
            ensure!(
                !unique_prop_names.contains(&prop.name),
                ERROR_PROP_NAME_NOT_UNIQUE_IN_CLASS
            );
            unique_prop_names.insert(prop.name.clone());
        }

        // Check that existing props are valid indices of class properties vector:
        let has_unknown_props = existing_properties
            .iter()
            .any(|&prop_id| prop_id >= class.properties.len() as u16);
        ensure!(
            !has_unknown_props,
            ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_PROP_INDEX
        );

        // Check validity of Internal(ClassId) for new_properties.
        let has_unknown_internal_id = new_properties.iter().any(|prop| match prop.prop_type {
            PropertyType::Internal(other_class_id) => !ClassById::contains_key(other_class_id),
            _ => false,
        });
        ensure!(
            !has_unknown_internal_id,
            ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_INTERNAL_ID
        );

        // Use the current length of schemas in this class as an index
        // for the next schema that will be sent in a result of this function.
        let schema_idx = class.schemas.len() as u16;

        let mut schema = ClassSchema {
            properties: existing_properties,
        };

        let mut updated_class_props = class.properties;
        new_properties.into_iter().for_each(|prop| {
            let prop_id = updated_class_props.len() as u16;
            updated_class_props.push(prop);
            schema.properties.push(prop_id);
        });

        ClassById::mutate(class_id, |class| {
            class.properties = updated_class_props;
            class.schemas.push(schema);
        });

        Self::deposit_event(RawEvent::ClassSchemaAdded(class_id, schema_idx));
        Ok(schema_idx)
    }

    pub fn create_entity(class_id: ClassId) -> Result<EntityId, &'static str> {
        Self::ensure_known_class_id(class_id)?;

        let entity_id = NextEntityId::get();

        let new_entity = Entity {
            id: entity_id,
            class_id,
            in_class_schema_indexes: vec![],
            values: vec![],
            // deleted: false,
        };

        // Save newly created entity:
        EntityById::insert(entity_id, new_entity);

        // Increment the next entity id:
        NextEntityId::mutate(|n| *n += 1);

        Self::deposit_event(RawEvent::EntityCreated(entity_id));
        Ok(entity_id)
    }

    pub fn add_schema_support_to_entity(
        entity_id: EntityId,
        schema_id: u16,
        property_values: Vec<ClassPropertyValue>,
    ) -> DispatchResult {
        Self::ensure_known_entity_id(entity_id)?;

        let (entity, class) = Self::get_entity_and_class(entity_id);

        // Check that schema_id is a valid index of class schemas vector:
        let known_schema_id = schema_id < class.schemas.len() as u16;
        ensure!(known_schema_id, ERROR_UNKNOWN_CLASS_SCHEMA_ID);

        // Check that schema id is not yet added to this entity:
        let schema_not_added = entity
            .in_class_schema_indexes
            .iter()
            .position(|x| *x == schema_id)
            .is_none();
        ensure!(schema_not_added, ERROR_SCHEMA_ALREADY_ADDED_TO_ENTITY);

        let class_schema_opt = class.schemas.get(schema_id as usize);
        let schema_prop_ids = class_schema_opt.unwrap().properties.clone();

        let current_entity_values = entity.values.clone();
        let mut appended_entity_values = entity.values;

        for &prop_id in schema_prop_ids.iter() {
            let prop_already_added = current_entity_values
                .iter()
                .any(|prop| prop.in_class_index == prop_id);

            if prop_already_added {
                // A property is already added to the entity and cannot be updated
                // while adding a schema support to this entity.
                continue;
            }

            let class_prop = class.properties.get(prop_id as usize).unwrap();

            // If a value was not povided for the property of this schema:
            match property_values
                .iter()
                .find(|prop| prop.in_class_index == prop_id)
            {
                Some(new_prop) => {
                    let ClassPropertyValue {
                        in_class_index: new_id,
                        value: new_value,
                    } = new_prop;

                    Self::ensure_property_value_is_valid(new_value.clone(), class_prop.clone())?;

                    appended_entity_values.push(ClassPropertyValue {
                        in_class_index: *new_id,
                        value: new_value.clone(),
                    });
                }
                None => {
                    // All required prop values should be are provided
                    if class_prop.required {
                        return Err(ERROR_MISSING_REQUIRED_PROP);
                    }
                    // Add all missing non required schema prop values as PropertyValue::None
                    else {
                        appended_entity_values.push(ClassPropertyValue {
                            in_class_index: prop_id,
                            value: PropertyValue::None,
                        });
                    }
                }
            }
        }

        EntityById::mutate(entity_id, |entity| {
            // Add a new schema to the list of schemas supported by this entity.
            entity.in_class_schema_indexes.push(schema_id);

            // Update entity values only if new properties have been added.
            if appended_entity_values.len() > entity.values.len() {
                entity.values = appended_entity_values;
            }
        });

        Self::deposit_event(RawEvent::EntitySchemaAdded(entity_id, schema_id));
        Ok(())
    }

    pub fn update_entity_property_values(
        entity_id: EntityId,
        new_property_values: Vec<ClassPropertyValue>,
    ) -> DispatchResult {
        Self::ensure_known_entity_id(entity_id)?;

        let (entity, class) = Self::get_entity_and_class(entity_id);

        // Get current property values of an entity as a mutable vector,
        // so we can update them if new values provided present in new_property_values.
        let mut updated_values = entity.values;
        let mut updates_count = 0;

        // Iterate over a vector of new values and update corresponding properties
        // of this entity if new values are valid.
        for new_prop_value in new_property_values.iter() {
            let ClassPropertyValue {
                in_class_index: id,
                value: new_value,
            } = new_prop_value;

            // Try to find a current property value in the entity
            // by matching its id to the id of a property with an updated value.
            if let Some(current_prop_value) = updated_values
                .iter_mut()
                .find(|prop| *id == prop.in_class_index)
            {
                let ClassPropertyValue {
                    in_class_index: valid_id,
                    value: current_value,
                } = current_prop_value;

                // Get class-level information about this property
                let class_prop = class.properties.get(*valid_id as usize).unwrap();

                // Validate a new property value against the type of this property
                // and check any additional constraints like the length of a vector
                // if it's a vector property or the length of a text if it's a text property.
                Self::ensure_property_value_is_valid(new_value.clone(), class_prop.clone())?;

                // Update a current prop value in a mutable vector, if a new value is valid.
                *current_value = new_value.clone();
                updates_count += 1;
            } else {
                // Throw an error if a property was not found on entity
                // by an in-class index of a property update.
                return Err(ERROR_UNKNOWN_ENTITY_PROP_ID);
            }
        }

        // If at least one of the entity property values should be update:
        if updates_count > 0 {
            EntityById::mutate(entity_id, |entity| {
                entity.values = updated_values;
            });
            Self::deposit_event(RawEvent::EntityPropertiesUpdated(entity_id));
        }

        Ok(())
    }

    // Commented out for now <- requested by Bedeho.
    // pub fn delete_entity(entity_id: EntityId) -> DispatchResult {
    //     Self::ensure_known_entity_id(entity_id)?;

    //     let is_deleted = EntityById::get(entity_id).deleted;
    //     ensure!(!is_deleted, ERROR_ENTITY_ALREADY_DELETED);

    //     EntityById::mutate(entity_id, |x| {
    //         x.deleted = true;
    //     });

    //     Self::deposit_event(RawEvent::EntityDeleted(entity_id));
    //     Ok(())
    // }

    // Helper functions:
    // ----------------------------------------------------------------

    pub fn ensure_known_class_id(class_id: ClassId) -> DispatchResult {
        ensure!(ClassById::contains_key(class_id), ERROR_CLASS_NOT_FOUND);
        Ok(())
    }

    pub fn ensure_known_entity_id(entity_id: EntityId) -> DispatchResult {
        ensure!(EntityById::contains_key(entity_id), ERROR_ENTITY_NOT_FOUND);
        Ok(())
    }

    pub fn ensure_valid_internal_prop(value: PropertyValue, prop: Property) -> DispatchResult {
        match (value, prop.prop_type) {
            (PV::Internal(entity_id), PT::Internal(class_id)) => {
                Self::ensure_known_class_id(class_id)?;
                Self::ensure_known_entity_id(entity_id)?;
                let entity = Self::entity_by_id(entity_id);
                ensure!(
                    entity.class_id == class_id,
                    ERROR_INTERNAL_RPOP_DOES_NOT_MATCH_ITS_CLASS
                );
                Ok(())
            }
            _ => Ok(()),
        }
    }

    pub fn is_unknown_internal_entity_id(id: PropertyValue) -> bool {
        if let PropertyValue::Internal(entity_id) = id {
            !EntityById::contains_key(entity_id)
        } else {
            false
        }
    }

    pub fn get_entity_and_class(entity_id: EntityId) -> (Entity, Class) {
        let entity = EntityById::get(entity_id);
        let class = ClassById::get(entity.class_id);
        (entity, class)
    }

    pub fn ensure_property_value_is_valid(value: PropertyValue, prop: Property) -> DispatchResult {
        Self::ensure_prop_value_matches_its_type(value.clone(), prop.clone())?;
        Self::ensure_valid_internal_prop(value.clone(), prop.clone())?;
        Self::validate_max_len_if_text_prop(value.clone(), prop.clone())?;
        Self::validate_max_len_if_vec_prop(value, prop)?;
        Ok(())
    }

    pub fn validate_max_len_if_text_prop(value: PropertyValue, prop: Property) -> DispatchResult {
        match (value, prop.prop_type) {
            (PV::Text(text), PT::Text(max_len)) => Self::validate_max_len_of_text(text, max_len),
            _ => Ok(()),
        }
    }

    pub fn validate_max_len_of_text(text: Vec<u8>, max_len: u16) -> DispatchResult {
        if text.len() <= max_len as usize {
            Ok(())
        } else {
            Err(ERROR_TEXT_PROP_IS_TOO_LONG)
        }
    }

    #[rustfmt::skip]
    pub fn validate_max_len_if_vec_prop(
        value: PropertyValue,
        prop: Property,
    ) -> DispatchResult {

        fn validate_vec_len<T>(vec: Vec<T>, max_len: u16) -> bool {
            vec.len() <= max_len as usize
        }

        fn validate_vec_len_ref<T>(vec: &[T], max_len: u16) -> bool {
            vec.len() <= max_len as usize
        }

        let is_valid_len = match (value, prop.prop_type) {
            (PV::BoolVec(vec),     PT::BoolVec(max_len))   => validate_vec_len(vec, max_len),
            (PV::Uint16Vec(vec),   PT::Uint16Vec(max_len)) => validate_vec_len(vec, max_len),
            (PV::Uint32Vec(vec),   PT::Uint32Vec(max_len)) => validate_vec_len(vec, max_len),
            (PV::Uint64Vec(vec),   PT::Uint64Vec(max_len)) => validate_vec_len(vec, max_len),
            (PV::Int16Vec(vec),    PT::Int16Vec(max_len))  => validate_vec_len(vec, max_len),
            (PV::Int32Vec(vec),    PT::Int32Vec(max_len))  => validate_vec_len(vec, max_len),
            (PV::Int64Vec(vec),    PT::Int64Vec(max_len))  => validate_vec_len(vec, max_len),

            (PV::TextVec(vec),     PT::TextVec(vec_max_len, text_max_len)) => {
                if validate_vec_len_ref(&vec, vec_max_len) {
                    for text_item in vec.iter() {
                        Self::validate_max_len_of_text(text_item.clone(), text_max_len)?;
                    }
                    true
                } else {
                    false
                }
            },

            (PV::InternalVec(vec), PT::InternalVec(vec_max_len, class_id)) => {
                Self::ensure_known_class_id(class_id)?;
                if validate_vec_len_ref(&vec, vec_max_len) {
                    for entity_id in vec.iter() {
                        Self::ensure_known_entity_id(*entity_id)?;
                        let entity = Self::entity_by_id(entity_id);
                        ensure!(entity.class_id == class_id, ERROR_INTERNAL_RPOP_DOES_NOT_MATCH_ITS_CLASS);
                    }
                    true
                } else {
                    false
                }
            },

            _ => true
        };

        if is_valid_len {
            Ok(())
        } else {
            Err(ERROR_VEC_PROP_IS_TOO_LONG)
        }
    }

    pub fn ensure_prop_value_matches_its_type(
        value: PropertyValue,
        prop: Property,
    ) -> DispatchResult {
        if Self::does_prop_value_match_type(value, prop) {
            Ok(())
        } else {
            Err(ERROR_PROP_VALUE_DONT_MATCH_TYPE)
        }
    }

    #[rustfmt::skip]
    pub fn does_prop_value_match_type(
        value: PropertyValue,
        prop: Property,
    ) -> bool {

        // A non required property can be updated to None:
        if !prop.required && value == PV::None {
            return true
        }

        match (value, prop.prop_type) {
            (PV::None,        PT::None) |

            // Single values
            (PV::Bool(_),     PT::Bool) |
            (PV::Uint16(_),   PT::Uint16) |
            (PV::Uint32(_),   PT::Uint32) |
            (PV::Uint64(_),   PT::Uint64) |
            (PV::Int16(_),    PT::Int16) |
            (PV::Int32(_),    PT::Int32) |
            (PV::Int64(_),    PT::Int64) |
            (PV::Text(_),     PT::Text(_)) |
            (PV::Internal(_), PT::Internal(_)) |

            // Vectors:
            (PV::BoolVec(_),     PT::BoolVec(_)) |
            (PV::Uint16Vec(_),   PT::Uint16Vec(_)) |
            (PV::Uint32Vec(_),   PT::Uint32Vec(_)) |
            (PV::Uint64Vec(_),   PT::Uint64Vec(_)) |
            (PV::Int16Vec(_),    PT::Int16Vec(_)) |
            (PV::Int32Vec(_),    PT::Int32Vec(_)) |
            (PV::Int64Vec(_),    PT::Int64Vec(_)) |
            (PV::TextVec(_),     PT::TextVec(_, _)) |
            (PV::InternalVec(_), PT::InternalVec(_, _)) => true,

            // (PV::External(_), PT::External(_)) => true,
            // (PV::ExternalVec(_), PT::ExternalVec(_, _)) => true,
            _ => false,
        }
    }

    pub fn ensure_property_name_is_valid(text: &[u8]) -> DispatchResult {
        PropertyNameConstraint::get().ensure_valid(
            text.len(),
            ERROR_PROPERTY_NAME_TOO_SHORT,
            ERROR_PROPERTY_NAME_TOO_LONG,
        )
    }

    pub fn ensure_property_description_is_valid(text: &[u8]) -> DispatchResult {
        PropertyDescriptionConstraint::get().ensure_valid(
            text.len(),
            ERROR_PROPERTY_DESCRIPTION_TOO_SHORT,
            ERROR_PROPERTY_DESCRIPTION_TOO_LONG,
        )
    }

    pub fn ensure_class_name_is_valid(text: &[u8]) -> DispatchResult {
        ClassNameConstraint::get().ensure_valid(
            text.len(),
            ERROR_CLASS_NAME_TOO_SHORT,
            ERROR_CLASS_NAME_TOO_LONG,
        )
    }

    pub fn ensure_class_description_is_valid(text: &[u8]) -> DispatchResult {
        ClassDescriptionConstraint::get().ensure_valid(
            text.len(),
            ERROR_CLASS_DESCRIPTION_TOO_SHORT,
            ERROR_CLASS_DESCRIPTION_TOO_LONG,
        )
    }
}
