// Copyright 2017-2019 Parity Technologies (UK) Ltd.
//
// This is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Substrate. If not, see <http://www.gnu.org/licenses/>.
//
// Copyright 2019 Joystream Contributors

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

#[cfg(feature = "std")]
use serde_derive::{Serialize, Deserialize};

use rstd::prelude::*;
use parity_codec::Codec;
use parity_codec_derive::{Decode, Encode};
use srml_support::{decl_event, decl_module, decl_storage, dispatch, ensure, fail, Parameter, StorageValue, StorageMap};
use runtime_primitives::traits::{SimpleArithmetic, As, Member, MaybeDebug, MaybeSerializeDebug};
use system::{ensure_signed};
use system;

// mod mock;
mod tests;

/// Constants
/////////////////////////////////////////////////////////////////

const MAX_NUM_OF_PROPS_PER_CLASS: u16 = 30;

/// Error messages for dispatchables
const ERROR_NOT_IMPLEMENTED: &str = "Not implemented yet";

const MAX_NAME_LENGTH: u16 = 100;
const MAX_DESCRIPTION_LENGTH: u16 = 1000;

pub type ClassId = u64;
pub type EntityId = u64;

/// Convenient composite time stamp 
// #[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
// #[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
// pub struct BlockAndTime<BlockNumber, Moment> {
//     block: BlockNumber,
//     time: Moment
// }

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Class {
    id: ClassId,

    /// For Person, think "height", "weight", etc.
    /// Unlikely to be more than roughly 20ish, often less.
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
    /// v.2.0 Person schema for John , v3.0 Person schema for John
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
    version: u16,
    properties: Vec<u8> // indices into properties vector for the corresponding class
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

pub trait Trait: system::Trait + timestamp::Trait + Sized {
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
        ClassCreated(AccountId, ClassId),
        ClassPropertyAdded(AccountId, ClassId),
        ClassSchemaAdded(AccountId, ClassId),

        EntityCreated(AccountId, EntityId),
        EntityUpdated(AccountId, EntityId),
        EntityDeleted(AccountId, EntityId),
    }
);

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;
    }
}

impl<T: Trait> Module<T> {

    pub fn create_class(name: Vec<u8>, description: Vec<u8>, properties: Vec<Property>, schemas: Vec<ClassSchema>) -> Result<ClassId, &'static str> {
        // TODO impl

        // let class_id = <NextClassId<T>>::get();

        // // Create new category
        // let new_class = Class {
        //     // TODO finish
        // };

        // // Insert category in map
        // <ClassById<T>>::insert(new_class.id, new_class);

        // // Update other things
        // <NextClassId<T>>::put(class_id + 1);

        // // Generate event
        // Self::deposit_event(RawEvent::ClassCreated(account.clone(), class_id));

        Err(ERROR_NOT_IMPLEMENTED)
    }

    pub fn add_class_property(class_id: ClassId, property: Property) -> Result<u16, &'static str> {
        // TODO impl
        Err(ERROR_NOT_IMPLEMENTED)
    }

    pub fn add_class_schema(class_id: ClassId, schema: ClassSchema) -> dispatch::Result {
        // TODO impl
        Err(ERROR_NOT_IMPLEMENTED)
    }

    pub fn create_entity(name: Vec<u8>, class_id: ClassId, schema_indices: Vec<u16>, property_values: Vec<(u16, PropertyValue)>) -> Result<EntityId, &'static str>{
        // TODO impl
        Err(ERROR_NOT_IMPLEMENTED)
    }

    pub fn update_entity(entity_id: EntityId, schema_indices: Vec<u16>, property_values: Vec<(u16, PropertyValue)>) -> dispatch::Result {
        // TODO impl
        Err(ERROR_NOT_IMPLEMENTED)
    }

    pub fn delete_entity(entity_id: EntityId) -> dispatch::Result {
        // TODO impl
        Err(ERROR_NOT_IMPLEMENTED)
    }
}
