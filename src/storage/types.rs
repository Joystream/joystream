#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;
use parity_codec::Codec;
use parity_codec_derive::{Encode, Decode};
use srml_support::{StorageMap, StorageValue, decl_module, decl_storage, decl_event, ensure, Parameter};
use runtime_primitives::traits::{SimpleArithmetic, As, Member, MaybeSerializeDebug};
use system::{self};
use crate::governance::GovernanceCurrency;
use crate::traits;

pub trait Trait: system::Trait + GovernanceCurrency
{
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type DataObjectTypeID: Parameter + Member + SimpleArithmetic + Codec + Default + Copy
        + As<usize> + As<u64> + MaybeSerializeDebug + PartialEq;
}

static MSG_REQUIRE_NEW_DOT: &str = "New Data Object Type required; the provided one seems to be in use already!";
static MSG_DOT_NOT_FOUND: &str = "Data Object Type with the given ID not found!";
static MSG_REQUIRE_DOT_ID: &str = "Can only update Data Object Types that are already registered (with an ID)!";
static MSG_REQUIRE_EXISTING_DOT: &str = "Can only update Data Object Types that are already registered!";

const DEFAULT_FIRST_DATA_OBJECT_TYPE_ID: u64 = 1;

#[derive(Encode, Decode, Clone, PartialEq)]
pub struct ObjectType<T: Trait>
{
    // If the OT is registered, an ID must exist, otherwise it's a new OT.
    pub id: Option<T::DataObjectTypeID>,
    pub description: Vec<u8>,
    pub active: bool,

    // TODO in future releases
    // - replication factor
    // - storage tranches (empty is ok)
}

decl_storage! {
    trait Store for Module<T: Trait> as DataObjectTypeRegistry
    {
        // Start at this value
        pub FirstDataObjectTypeID get(first_data_object_type_id) config(first_data_object_type_id): T::DataObjectTypeID = T::DataObjectTypeID::sa(DEFAULT_FIRST_DATA_OBJECT_TYPE_ID);

        // Increment
        pub NextDataObjectTypeID get(next_data_object_type_id) build(|config: &GenesisConfig<T>| config.first_data_object_type_id): T::DataObjectTypeID = T::DataObjectTypeID::sa(DEFAULT_FIRST_DATA_OBJECT_TYPE_ID);

        // Mapping of Data object types
        pub DataObjectType get(data_object_type): map T::DataObjectTypeID => Option<ObjectType<T>>;
    }
}

decl_event! {
    pub enum Event<T> where
        <T as Trait>::DataObjectTypeID
    {
        DataObjectTypeAdded(DataObjectTypeID),
        DataObjectTypeUpdated(DataObjectTypeID),
    }
}



impl<T: Trait> traits::IsActiveDataObjectType<T> for Module<T>
{
    fn is_active_data_object_type(which: &T::DataObjectTypeID) -> bool
    {
        match Self::ensure_data_object_type(*which)
        {
            Ok(dot) => dot.active,
            Err(err) => false
        }
    }
}


decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin
    {
        fn deposit_event<T>() = default;

        pub fn register_data_object_type(data_object_type: ObjectType<T>)
        {
            ensure!(data_object_type.id.is_none(), MSG_REQUIRE_NEW_DOT);

            let new_dot_id = Self::next_data_object_type_id();
            let dot: ObjectType<T> = ObjectType {
                id: Some(new_dot_id),
                description: data_object_type.description.clone(),
                active: data_object_type.active,
            };

            <DataObjectType<T>>::insert(new_dot_id, dot);
            <NextDataObjectTypeID<T>>::mutate(|n| { *n += T::DataObjectTypeID::sa(1); });

            Self::deposit_event(RawEvent::DataObjectTypeAdded(new_dot_id));
        }

        pub fn update_data_object_type(data_object_type: ObjectType<T>)
        {
            ensure!(data_object_type.id.is_some(), MSG_REQUIRE_DOT_ID);

            let id = data_object_type.id.unwrap();
            let mut dot = Self::ensure_data_object_type(id)?;

            dot.description = data_object_type.description.clone();
            dot.active = data_object_type.active;

            <DataObjectType<T>>::insert(id, dot);

            Self::deposit_event(RawEvent::DataObjectTypeUpdated(id));
        }

        pub fn activate_data_object_type(id: T::DataObjectTypeID, active: bool)
        {
            let mut dot = Self::ensure_data_object_type(id)?;

            dot.active = active;

            <DataObjectType<T>>::insert(id, dot);

            Self::deposit_event(RawEvent::DataObjectTypeUpdated(id));
        }
    }
}

impl <T: Trait> Module<T>
{
    fn ensure_data_object_type(id: T::DataObjectTypeID) -> Result<ObjectType<T>, &'static str>
    {
        let dot = Self::data_object_type(&id).ok_or(MSG_DOT_NOT_FOUND)?;
        Ok(dot)
    }
}
