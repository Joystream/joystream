#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;
use parity_codec::Codec;
use parity_codec_derive::{Encode, Decode};
use srml_support::{StorageMap, StorageValue, decl_module, decl_storage, decl_event, ensure, Parameter};
use runtime_primitives::traits::{SimpleArithmetic, As, Member, MaybeSerializeDebug, MaybeDebug};
use system::{self, ensure_root};
use crate::traits;

pub trait Trait: system::Trait + MaybeDebug {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type DataObjectTypeId: Parameter + Member + SimpleArithmetic + Codec + Default + Copy
        + As<usize> + As<u64> + MaybeSerializeDebug + PartialEq;
}


static MSG_REQUIRE_NEW_DO_TYPE: &str = "New Data Object Type required; the provided one seems to be in use already!";
static MSG_DO_TYPE_NOT_FOUND: &str = "Data Object Type with the given ID not found!";
static MSG_REQUIRE_DO_TYPE_ID: &str = "Can only update Data Object Types that are already registered (with an ID)!";

const DEFAULT_FIRST_DATA_OBJECT_TYPE_ID: u64 = 1;

#[derive(Clone, Encode, Decode, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub struct DataObjectType<T: Trait> {
    pub id: Option<T::DataObjectTypeId>,
    pub description: Vec<u8>,
    pub active: bool,

    // TODO in future releases
    // - maximum size
    // - replication factor
    // - storage tranches (empty is ok)
}

decl_storage! {
    trait Store for Module<T: Trait> as DataObjectTypeRegistry {
        // Start at this value
        pub FirstDataObjectTypeId get(first_data_object_type_id) config(first_data_object_type_id): T::DataObjectTypeId = T::DataObjectTypeId::sa(DEFAULT_FIRST_DATA_OBJECT_TYPE_ID);

        // Increment
        pub NextDataObjectTypeId get(next_data_object_type_id) build(|config: &GenesisConfig<T>| config.first_data_object_type_id): T::DataObjectTypeId = T::DataObjectTypeId::sa(DEFAULT_FIRST_DATA_OBJECT_TYPE_ID);

        // Mapping of Data object types
        pub DataObjectTypeMap get(data_object_type): map T::DataObjectTypeId => Option<DataObjectType<T>>;
    }
}

decl_event! {
    pub enum Event<T> where
        <T as Trait>::DataObjectTypeId {
        DataObjectTypeRegistered(DataObjectTypeId),
        DataObjectTypeUpdated(DataObjectTypeId),
    }
}



impl<T: Trait> traits::IsActiveDataObjectType<T> for Module<T> {
    fn is_active_data_object_type(which: &T::DataObjectTypeId) -> bool {
        match Self::ensure_data_object_type(*which) {
            Ok(do_type) => do_type.active,
            Err(_err) => false
        }
    }
}


decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        pub fn register_data_object_type(origin, data_object_type: DataObjectType<T>) {
            ensure_root(origin)?;
            ensure!(data_object_type.id.is_none(), MSG_REQUIRE_NEW_DO_TYPE);

            let new_do_type_id = Self::next_data_object_type_id();
            let do_type: DataObjectType<T> = DataObjectType {
                id: Some(new_do_type_id),
                description: data_object_type.description.clone(),
                active: data_object_type.active,
            };

            <DataObjectTypeMap<T>>::insert(new_do_type_id, do_type);
            <NextDataObjectTypeId<T>>::mutate(|n| { *n += T::DataObjectTypeId::sa(1); });

            Self::deposit_event(RawEvent::DataObjectTypeRegistered(new_do_type_id));
        }

        pub fn update_data_object_type(origin, data_object_type: DataObjectType<T>) {
            ensure_root(origin)?;
            ensure!(data_object_type.id.is_some(), MSG_REQUIRE_DO_TYPE_ID);

            let id = data_object_type.id.unwrap();
            let mut do_type = Self::ensure_data_object_type(id)?;

            do_type.description = data_object_type.description.clone();
            do_type.active = data_object_type.active;

            <DataObjectTypeMap<T>>::insert(id, do_type);

            Self::deposit_event(RawEvent::DataObjectTypeUpdated(id));
        }

        // Activate and deactivate functions as separate functions, because
        // toggling DO types is likely a more common operation than updating
        // other aspects.
        pub fn activate_data_object_type(origin, id: T::DataObjectTypeId) {
            ensure_root(origin)?;
            let mut do_type = Self::ensure_data_object_type(id)?;

            do_type.active = true;

            <DataObjectTypeMap<T>>::insert(id, do_type);

            Self::deposit_event(RawEvent::DataObjectTypeUpdated(id));
        }

        pub fn deactivate_data_object_type(origin, id: T::DataObjectTypeId) {
            ensure_root(origin)?;
            let mut do_type = Self::ensure_data_object_type(id)?;

            do_type.active = false;

            <DataObjectTypeMap<T>>::insert(id, do_type);

            Self::deposit_event(RawEvent::DataObjectTypeUpdated(id));
        }

    }
}

impl <T: Trait> Module<T> {
    fn ensure_data_object_type(id: T::DataObjectTypeId) -> Result<DataObjectType<T>, &'static str> {
        return Self::data_object_type(&id).ok_or(MSG_DO_TYPE_NOT_FOUND);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::storage::mock::*;

    use runtime_io::with_externalities;
    use srml_support::*;
    use system::{self, Phase, EventRecord};

    #[test]
    fn initial_state() {
        with_default_mock_builder(|| {
            assert_eq!(TestDataObjectTypeRegistry::first_data_object_type_id(), TEST_FIRST_DATA_OBJECT_TYPE_ID);
        });
    }

    #[test]
    fn fail_register_without_root() {
        with_default_mock_builder(|| {
            let data: TestDataObjectType = TestDataObjectType {
                id: None,
                description: "foo".as_bytes().to_vec(),
                active: false,
            };
            let res = TestDataObjectTypeRegistry::register_data_object_type(Origin::signed(1), data);
            assert!(res.is_err());
        });
    }

    #[test]
    fn succeed_register_as_root() {
        with_default_mock_builder(|| {
            let data: TestDataObjectType = TestDataObjectType {
                id: None,
                description: "foo".as_bytes().to_vec(),
                active: false,
            };
            let res = TestDataObjectTypeRegistry::register_data_object_type(Origin::ROOT, data);
            assert!(res.is_ok());
        });
    }

    #[test]
    fn update_existing() {
        with_default_mock_builder(|| {
            // First register a type
            let data: TestDataObjectType = TestDataObjectType {
                id: None,
                description: "foo".as_bytes().to_vec(),
                active: false,
            };
            let id_res = TestDataObjectTypeRegistry::register_data_object_type(Origin::ROOT, data);
            assert!(id_res.is_ok());
            assert_eq!(*System::events().last().unwrap(),
                EventRecord {
                    phase: Phase::ApplyExtrinsic(0),
                    event: MetaEvent::data_object_type_registry(data_object_type_registry::RawEvent::DataObjectTypeRegistered(TEST_FIRST_DATA_OBJECT_TYPE_ID)),
                }
            );


            // Now update it with new data - we need the ID to be the same as in
            // returned by the previous call. First, though, try and fail without
            let updated1: TestDataObjectType = TestDataObjectType {
                id: None,
                description: "bar".as_bytes().to_vec(),
                active: false,
            };
            let res = TestDataObjectTypeRegistry::update_data_object_type(Origin::ROOT, updated1);
            assert!(res.is_err());

            // Now try with a bad ID
            let updated2: TestDataObjectType = TestDataObjectType {
                id: Some(TEST_FIRST_DATA_OBJECT_TYPE_ID + 1),
                description: "bar".as_bytes().to_vec(),
                active: false,
            };
            let res = TestDataObjectTypeRegistry::update_data_object_type(Origin::ROOT, updated2);
            assert!(res.is_err());

            // Finally with an existing ID, it should work.
            let updated3: TestDataObjectType = TestDataObjectType {
                id: Some(TEST_FIRST_DATA_OBJECT_TYPE_ID),
                description: "bar".as_bytes().to_vec(),
                active: false,
            };
            let res = TestDataObjectTypeRegistry::update_data_object_type(Origin::ROOT, updated3);
            assert!(res.is_ok());
            assert_eq!(*System::events().last().unwrap(),
                EventRecord {
                    phase: Phase::ApplyExtrinsic(0),
                    event: MetaEvent::data_object_type_registry(data_object_type_registry::RawEvent::DataObjectTypeUpdated(TEST_FIRST_DATA_OBJECT_TYPE_ID)),
                }
            );
        });
    }


    #[test]
    fn activate_existing() {
        with_default_mock_builder(|| {
            // First register a type
            let data: TestDataObjectType = TestDataObjectType {
                id: None,
                description: "foo".as_bytes().to_vec(),
                active: false,
            };
            let id_res = TestDataObjectTypeRegistry::register_data_object_type(Origin::ROOT, data);
            assert!(id_res.is_ok());
            assert_eq!(*System::events().last().unwrap(),
                EventRecord {
                    phase: Phase::ApplyExtrinsic(0),
                    event: MetaEvent::data_object_type_registry(data_object_type_registry::RawEvent::DataObjectTypeRegistered(TEST_FIRST_DATA_OBJECT_TYPE_ID)),
                }
            );

            // Retrieve, and ensure it's not active.
            let data = TestDataObjectTypeRegistry::data_object_type(TEST_FIRST_DATA_OBJECT_TYPE_ID);
            assert!(data.is_some());
            assert!(!data.unwrap().active);

            // Now activate the data object type
            let res = TestDataObjectTypeRegistry::activate_data_object_type(Origin::ROOT, TEST_FIRST_DATA_OBJECT_TYPE_ID);
            assert!(res.is_ok());
            assert_eq!(*System::events().last().unwrap(),
                EventRecord {
                    phase: Phase::ApplyExtrinsic(0),
                    event: MetaEvent::data_object_type_registry(data_object_type_registry::RawEvent::DataObjectTypeUpdated(TEST_FIRST_DATA_OBJECT_TYPE_ID)),
                }
            );

            // Ensure that the item is actually activated.
            let data = TestDataObjectTypeRegistry::data_object_type(TEST_FIRST_DATA_OBJECT_TYPE_ID);
            assert!(data.is_some());
            assert!(data.unwrap().active);

            // Deactivate again.
            let res = TestDataObjectTypeRegistry::deactivate_data_object_type(Origin::ROOT, TEST_FIRST_DATA_OBJECT_TYPE_ID);
            assert!(res.is_ok());
            let data = TestDataObjectTypeRegistry::data_object_type(TEST_FIRST_DATA_OBJECT_TYPE_ID);
            assert!(data.is_some());
            assert!(!data.unwrap().active);
        });
    }
}
