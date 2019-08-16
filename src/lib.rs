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
use serde_derive::{Serialize, Deserialize};

use rstd::prelude::*;
use parity_codec_derive::{Decode, Encode};
use srml_support::{decl_event, decl_module, decl_storage, dispatch, ensure, StorageValue, StorageMap};
use system;

mod mock;
mod tests;

/// Constants
/////////////////////////////////////////////////////////////////

// Error messages for dispatchables

const ERROR_CLASS_NOT_FOUND: &str = "Class was not found by id";
const ERROR_CLASS_EMPTY_NAME: &str = "Class cannot have an empty name";
const ERROR_CLASS_EMPTY_DESCRIPTION: &str = "Class cannot have an empty description";
const ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_PROP_INDEX: &str = "New class schema refers to an unknown property index";
const ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_INTERNAL_ID: &str = "New class schema refers to an unknown internal class id";
const ERROR_NO_PROPS_IN_CLASS_SCHEMA: &str = "Cannot add a class schema with an empty list of properties";

const ERROR_ENTITY_NOT_FOUND: &str = "Entity was not found by id";
const ERROR_ENTITY_EMPTY_SCHEMAS: &str = "Entity cannot have an empty list of schema indicies";
const ERROR_ENTITY_EMPTY_PROPS: &str = "Entity cannot have an empty list of property values";
const ERROR_ENTITY_EMPTY_NAME: &str = "Entity cannot have an empty name";
const ERROR_NOTHING_TO_UPDATE_IN_ENTITY: &str = "Nothing to update in this entity";
const ERROR_ENTITY_ALREADY_DELETED: &str = "Entity is already deleted";

// const MAX_NUM_OF_PROPS_PER_CLASS: u16 = 30;
// const MAX_NAME_LENGTH: u16 = 100;
// const MAX_DESCRIPTION_LENGTH: u16 = 1000;

pub type ClassId = u64;
pub type EntityId = u64;

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Class {
    id: ClassId,

    /// All properties that has been used on this class across different class schemas.
    /// Unlikely to be more than roughly 20 properties per class, often less.
    /// For Person, think "height", "weight", etc.
    properties: Vec<Property>,

    /// All scehmas that are available for this class, think v0.0 Person, v.1.0 Person, etc.
    schemas: Vec<ClassSchema>,

    name: Vec<u8>,
    description: Vec<u8>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Entity {
    id: EntityId,

    /// The class id of this entity.
    class_id: ClassId,

    /// What schemas under which this entity of a class is available, think
    /// v.2.0 Person schema for John, v3.0 Person schema for John
    /// Unlikely to be more than roughly 20ish, assuming schemas for a given class eventually stableize, or that very old schema are eventually removed.
    schemas: Vec<u16>, // indices of schema in corresponding class

    /// Values for properties on class that are used by some schema used by this entity!
    /// Length is no more than Class.properties.
    values: Vec<(u16, PropertyValue)>, // Index is into properties vector of class. Fix anonymous type later.

    name: Vec<u8>,
    deleted: bool,
}

/// A schema defines what properties describe an entity
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct ClassSchema {
    /// Indices into properties vector for the corresponding class.
    properties: Vec<u16>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Property {
    prop_type: PropertyType,
    required: bool,
    name: Vec<u8>,
    description: Vec<u8>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Clone, PartialEq, Eq)]
pub enum PropertyType {
    None,
    Bool,
    Uint16,
    Uint32,
    Uint64,
    Int16,
    Int32,
    Int64,
    Text(u32),
    Internal(ClassId),
    // External(ExternalProperty),
}

impl Default for PropertyType {
    fn default() -> Self {
        PropertyType::None
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Clone, PartialEq, Eq)]
pub enum PropertyValue {
    None,
    Bool(bool),
    Uint16(u16),
    Uint32(u32),
    Uint64(u64),
    Int16(i16),
    Int32(i32),
    Int64(i64),
    Text(Vec<u8>),
    Internal(EntityId),
    // External(ExternalPropertyType),
}

impl Default for PropertyValue {
    fn default() -> Self {
        PropertyValue::None
    }
}

pub trait Trait: system::Trait + Sized {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

decl_storage! {

    trait Store for Module<T: Trait> as VersionedStore {

        pub ClassById get(class_by_id) config(): map ClassId => Class;

        pub EntityById get(entity_by_id) config(): map EntityId => Entity;

        pub NextClassId get(next_class_id) config(): ClassId;

        pub NextEntityId get(next_entity_id) config(): EntityId;
    }
}

decl_event!(
    pub enum Event<T>
    where
        <T as system::Trait>::AccountId,
    {
        ClassCreated(ClassId),
        ClassPropertyAdded(ClassId, u16),
        ClassPropertyUpdated(ClassId, u16),
        ClassSchemaAdded(ClassId, u16),

        EntityCreated(EntityId),
        EntityUpdated(EntityId),
        EntityDeleted(EntityId),
        EntityNameUpdated(EntityId),
        EntityPropertiesUpdated(EntityId),
        EntitySchemaAdded(EntityId),

        /// This is a fake event that uses AccountId type just to make Rust compiler happy to compile this module.
        FixCompilation(AccountId),
    }
);

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;
    }
}

impl<T: Trait> Module<T> {

    /// Returns an id of a newly added class.
    pub fn create_class(
        name: Vec<u8>,
        description: Vec<u8>
    ) -> Result<ClassId, &'static str> {
        
        // TODO better validation of name:
        ensure!(name.len() > 0, ERROR_CLASS_EMPTY_NAME);

        // TODO better validation of description:
        ensure!(description.len() > 0, ERROR_CLASS_EMPTY_DESCRIPTION);

        let class_id = <NextClassId<T>>::get();

        let new_class = Class {
            id: class_id,
            properties: vec![],
            schemas: vec![],
            name,
            description,
        };

        // Save newly created class:
        <ClassById<T>>::insert(class_id, new_class);

        // Increment the next class id:
        <NextClassId<T>>::mutate(|n| *n += 1);

        Self::deposit_event(RawEvent::ClassCreated(class_id));
        Ok(class_id)
    }

    /// Returns an index of a newly added class schema on success.
    pub fn add_class_schema(
        class_id: ClassId,
        existing_properties: Vec<u16>,
        new_properties: Vec<Property>
    ) -> Result<u16, &'static str> {

        ensure!(<ClassById<T>>::exists(class_id), ERROR_CLASS_NOT_FOUND);

        let non_empty_schema = 
            !existing_properties.is_empty() || 
            !new_properties.is_empty();
        
        ensure!(non_empty_schema, ERROR_NO_PROPS_IN_CLASS_SCHEMA);

        let class = <ClassById<T>>::get(class_id);

        // Check that existing props are valid indices of class properties vector:
        let has_unknown_props = existing_properties.iter().any(|&prop_id| {
            prop_id >= class.properties.len() as u16
        });
        ensure!(!has_unknown_props, ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_PROP_INDEX);
        
        // Check validity of Internal(ClassId) for new_properties.
        let has_unknown_internal_id = new_properties.iter().any(|prop| {
            match prop.prop_type {
                PropertyType::Internal(other_class_id) =>
                    !<ClassById<T>>::exists(other_class_id),
                _ => false
            }
        });
        ensure!(!has_unknown_internal_id, ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_INTERNAL_ID);

        // Use the current length of schemas in this class as an index
        // for the next schema that will be sent in a result of this function.
        let schema_idx = class.schemas.len() as u16;

        let mut schema = ClassSchema {
            properties: existing_properties
        };

        let mut new_class_props = class.properties;
        new_properties.into_iter().for_each(|prop| {
            let prop_id = new_class_props.len() as u16;
            new_class_props.push(prop);
            schema.properties.push(prop_id);
        });

        <ClassById<T>>::mutate(class_id, |class| {
            class.properties = new_class_props;
            class.schemas.push(schema);
        });

        Self::deposit_event(RawEvent::ClassSchemaAdded(class_id, schema_idx));
        Ok(schema_idx)
    }

    pub fn create_entity(
        class_id: ClassId,
        name: Vec<u8>
    ) -> Result<EntityId, &'static str> {

        ensure!(<ClassById<T>>::exists(class_id), ERROR_CLASS_NOT_FOUND);

        // TODO better validation of name:
        ensure!(name.len() > 0, ERROR_ENTITY_EMPTY_NAME);

        let entity_id = <NextEntityId<T>>::get();

        let new_entity = Entity {
            id: entity_id,
            class_id,
            schemas: vec![],
            values: vec![],
            name,
            deleted: false,
        };

        // Save newly created entity:
        <EntityById<T>>::insert(entity_id, new_entity);

        // Increment the next entity id:
        <NextEntityId<T>>::mutate(|n| *n += 1);

        Self::deposit_event(RawEvent::EntityCreated(entity_id));
        Ok(entity_id)
    }

    pub fn update_entity_name(
        entity_id: EntityId,
        new_name: Vec<u8>
    ) -> dispatch::Result {

        ensure!(<EntityById<T>>::exists(entity_id), ERROR_ENTITY_NOT_FOUND);

        // TODO better validation of name:
        ensure!(new_name.len() > 0, ERROR_ENTITY_EMPTY_NAME);

        <EntityById<T>>::mutate(entity_id, |entity| {
            entity.name = new_name;
        });

        Self::deposit_event(RawEvent::EntityNameUpdated(entity_id));
        Ok(())
    }

    pub fn add_entity_schema(
        entity_id: EntityId,
        schema_id: u16,
        property_values: Vec<(u16, PropertyValue)>
    ) -> dispatch::Result {

        ensure!(<EntityById<T>>::exists(entity_id), ERROR_ENTITY_NOT_FOUND);

        let entity = <EntityById<T>>::get(entity_id);
        let class = <ClassById<T>>::get(entity.class_id);

        // Check that schema id is not yet added to this entity:
        let schema_already_added = entity.schemas.get(schema_id as usize).is_some();
        ensure!(!schema_already_added, "Cannot add a schema that is already added to this entity");

        // Check that schema_id is a valid index of class schemas vector:
        let unknown_schema_id = schema_id >= class.schemas.len() as u16;
        ensure!(!unknown_schema_id, ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_PROP_INDEX);

        // TODO check that prop_id is on schema.properties

        // TODO Check that all required prop values are provided

        // TODO check that every property value matches a prop type of class property with the same prop id

        // TODO Check validity of Internal(EntityId) for properties.

        // TODO finish

        Ok(())
    }

    pub fn update_or_insert_entity_properties(
        entity_id: EntityId,
        property_values: Vec<(u16, PropertyValue)>
    ) -> dispatch::Result {

        ensure!(<EntityById<T>>::exists(entity_id), ERROR_ENTITY_NOT_FOUND);

        // TODO check that every property value matches prop type of class property with the same prop id

        // TODO Check validity of Internal(EntityId) for properties.

        // TODO Update prop value, if prop id exists in this entity

        // TODO Add prop value, if prop id does noy exists in this entity

        // TODO finish

        Ok(())
    }

    pub fn delete_entity(entity_id: EntityId) -> dispatch::Result {
        ensure!(<EntityById<T>>::exists(entity_id), ERROR_ENTITY_NOT_FOUND);

        let is_deleted = <EntityById<T>>::get(entity_id).deleted;
        ensure!(!is_deleted, ERROR_ENTITY_ALREADY_DELETED);

        <EntityById<T>>::mutate(entity_id, |x| {
            x.deleted = true;
        });

        Self::deposit_event(RawEvent::EntityDeleted(entity_id));
        Ok(())
    }
}
