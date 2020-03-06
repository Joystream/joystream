use crate::traits;
use codec::{Codec, Decode, Encode};
use rstd::prelude::*;
use sr_primitives::traits::{MaybeSerialize, Member, SimpleArithmetic};
use srml_support::{decl_event, decl_module, decl_storage, Parameter};
use system::ensure_root;

pub trait Trait: system::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type DataObjectTypeId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;
}

static MSG_DO_TYPE_NOT_FOUND: &str = "Data Object Type with the given ID not found.";

const DEFAULT_TYPE_DESCRIPTION: &str = "Default data object type for audio and video content.";
const DEFAULT_TYPE_ACTIVE: bool = true;
const CREATE_DETAULT_TYPE: bool = true;

const DEFAULT_FIRST_DATA_OBJECT_TYPE_ID: u32 = 1;

#[derive(Clone, Encode, Decode, PartialEq, Debug)]
pub struct DataObjectType {
    pub description: Vec<u8>,
    pub active: bool,
    // TODO in future releases
    // - maximum size
    // - replication factor
    // - storage tranches (empty is ok)
}

impl Default for DataObjectType {
    fn default() -> Self {
        DataObjectType {
            description: DEFAULT_TYPE_DESCRIPTION.as_bytes().to_vec(),
            active: DEFAULT_TYPE_ACTIVE,
        }
    }
}

decl_storage! {
    trait Store for Module<T: Trait> as DataObjectTypeRegistry {

        // TODO hardcode data object type for ID 1

        // Start at this value
        pub FirstDataObjectTypeId get(first_data_object_type_id) config(first_data_object_type_id): T::DataObjectTypeId = T::DataObjectTypeId::from(DEFAULT_FIRST_DATA_OBJECT_TYPE_ID);

        // Increment
        pub NextDataObjectTypeId get(next_data_object_type_id) build(|config: &GenesisConfig<T>| config.first_data_object_type_id): T::DataObjectTypeId = T::DataObjectTypeId::from(DEFAULT_FIRST_DATA_OBJECT_TYPE_ID);

        // Mapping of Data object types
        pub DataObjectTypes get(data_object_types): map T::DataObjectTypeId => Option<DataObjectType>;
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
            Err(_err) => false,
        }
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event() = default;

        fn on_initialize() {
            // Create a default data object type if it was not created yet.
            if CREATE_DETAULT_TYPE && !<DataObjectTypes<T>>::exists(Self::first_data_object_type_id()) {
                let do_type: DataObjectType = DataObjectType::default();
                let new_type_id = Self::next_data_object_type_id();

                <DataObjectTypes<T>>::insert(new_type_id, do_type);
                <NextDataObjectTypeId<T>>::mutate(|n| { *n += T::DataObjectTypeId::from(1); });
            }
        }

        pub fn register_data_object_type(origin, data_object_type: DataObjectType) {
            ensure_root(origin)?;
            let new_do_type_id = Self::next_data_object_type_id();
            let do_type: DataObjectType = DataObjectType {
                description: data_object_type.description.clone(),
                active: data_object_type.active,
            };

            <DataObjectTypes<T>>::insert(new_do_type_id, do_type);
            <NextDataObjectTypeId<T>>::mutate(|n| { *n += T::DataObjectTypeId::from(1); });

            Self::deposit_event(RawEvent::DataObjectTypeRegistered(new_do_type_id));
        }

        // TODO use DataObjectTypeUpdate
        pub fn update_data_object_type(origin, id: T::DataObjectTypeId, data_object_type: DataObjectType) {
            ensure_root(origin)?;
            let mut do_type = Self::ensure_data_object_type(id)?;

            do_type.description = data_object_type.description.clone();
            do_type.active = data_object_type.active;

            <DataObjectTypes<T>>::insert(id, do_type);

            Self::deposit_event(RawEvent::DataObjectTypeUpdated(id));
        }

        // Activate and deactivate functions as separate functions, because
        // toggling DO types is likely a more common operation than updating
        // other aspects.
        // TODO deprecate or express via update_data_type
        pub fn activate_data_object_type(origin, id: T::DataObjectTypeId) {
            ensure_root(origin)?;
            let mut do_type = Self::ensure_data_object_type(id)?;

            do_type.active = true;

            <DataObjectTypes<T>>::insert(id, do_type);

            Self::deposit_event(RawEvent::DataObjectTypeUpdated(id));
        }

        pub fn deactivate_data_object_type(origin, id: T::DataObjectTypeId) {
            ensure_root(origin)?;
            let mut do_type = Self::ensure_data_object_type(id)?;

            do_type.active = false;

            <DataObjectTypes<T>>::insert(id, do_type);

            Self::deposit_event(RawEvent::DataObjectTypeUpdated(id));
        }
    }
}

impl<T: Trait> Module<T> {
    fn ensure_data_object_type(id: T::DataObjectTypeId) -> Result<DataObjectType, &'static str> {
        return Self::data_object_types(&id).ok_or(MSG_DO_TYPE_NOT_FOUND);
    }
}

#[cfg(test)]
mod tests {
    //use super::*;
    use crate::storage::mock::*;

    use system::{self, EventRecord, Phase};

    #[test]
    fn initial_state() {
        with_default_mock_builder(|| {
            assert_eq!(
                TestDataObjectTypeRegistry::first_data_object_type_id(),
                TEST_FIRST_DATA_OBJECT_TYPE_ID
            );
        });
    }

    #[test]
    fn succeed_register() {
        with_default_mock_builder(|| {
            let data: TestDataObjectType = TestDataObjectType {
                description: "foo".as_bytes().to_vec(),
                active: false,
            };
            let res = TestDataObjectTypeRegistry::register_data_object_type(
                system::RawOrigin::Root.into(),
                data,
            );
            assert!(res.is_ok());
        });
    }

    #[test]
    fn update_existing() {
        with_default_mock_builder(|| {
            // First register a type
            let data: TestDataObjectType = TestDataObjectType {
                description: "foo".as_bytes().to_vec(),
                active: false,
            };
            let id_res = TestDataObjectTypeRegistry::register_data_object_type(
                system::RawOrigin::Root.into(),
                data,
            );
            assert!(id_res.is_ok());

            let dot_id = match System::events().last().unwrap().event {
                MetaEvent::data_object_type_registry(
                    data_object_type_registry::RawEvent::DataObjectTypeRegistered(dot_id),
                ) => dot_id,
                _ => 0xdeadbeefu64, // unlikely value
            };
            assert_ne!(dot_id, 0xdeadbeefu64);

            // Now update it with new data - we need the ID to be the same as in
            // returned by the previous call. First, though, try and fail with a bad ID
            let updated1: TestDataObjectType = TestDataObjectType {
                description: "bar".as_bytes().to_vec(),
                active: false,
            };
            let res = TestDataObjectTypeRegistry::update_data_object_type(
                system::RawOrigin::Root.into(),
                dot_id + 1,
                updated1,
            );
            assert!(res.is_err());

            // Finally with an existing ID, it should work.
            let updated3: TestDataObjectType = TestDataObjectType {
                description: "bar".as_bytes().to_vec(),
                active: false,
            };
            let res = TestDataObjectTypeRegistry::update_data_object_type(
                system::RawOrigin::Root.into(),
                dot_id,
                updated3,
            );
            assert!(res.is_ok());
            assert_eq!(
                *System::events().last().unwrap(),
                EventRecord {
                    phase: Phase::ApplyExtrinsic(0),
                    event: MetaEvent::data_object_type_registry(
                        data_object_type_registry::RawEvent::DataObjectTypeUpdated(dot_id)
                    ),
                    topics: vec![],
                }
            );
        });
    }

    #[test]
    fn activate_existing() {
        with_default_mock_builder(|| {
            // First register a type
            let data: TestDataObjectType = TestDataObjectType {
                description: "foo".as_bytes().to_vec(),
                active: false,
            };
            let id_res = TestDataObjectTypeRegistry::register_data_object_type(
                system::RawOrigin::Root.into(),
                data,
            );
            assert!(id_res.is_ok());
            assert_eq!(
                *System::events().last().unwrap(),
                EventRecord {
                    phase: Phase::ApplyExtrinsic(0),
                    event: MetaEvent::data_object_type_registry(
                        data_object_type_registry::RawEvent::DataObjectTypeRegistered(
                            TEST_FIRST_DATA_OBJECT_TYPE_ID
                        )
                    ),
                    topics: vec![],
                }
            );

            // Retrieve, and ensure it's not active.
            let data =
                TestDataObjectTypeRegistry::data_object_types(TEST_FIRST_DATA_OBJECT_TYPE_ID);
            assert!(data.is_some());
            assert!(!data.unwrap().active);

            // Now activate the data object type
            let res = TestDataObjectTypeRegistry::activate_data_object_type(
                system::RawOrigin::Root.into(),
                TEST_FIRST_DATA_OBJECT_TYPE_ID,
            );
            assert!(res.is_ok());
            assert_eq!(
                *System::events().last().unwrap(),
                EventRecord {
                    phase: Phase::ApplyExtrinsic(0),
                    event: MetaEvent::data_object_type_registry(
                        data_object_type_registry::RawEvent::DataObjectTypeUpdated(
                            TEST_FIRST_DATA_OBJECT_TYPE_ID
                        )
                    ),
                    topics: vec![],
                }
            );

            // Ensure that the item is actually activated.
            let data =
                TestDataObjectTypeRegistry::data_object_types(TEST_FIRST_DATA_OBJECT_TYPE_ID);
            assert!(data.is_some());
            assert!(data.unwrap().active);

            // Deactivate again.
            let res = TestDataObjectTypeRegistry::deactivate_data_object_type(
                system::RawOrigin::Root.into(),
                TEST_FIRST_DATA_OBJECT_TYPE_ID,
            );
            assert!(res.is_ok());
            let data =
                TestDataObjectTypeRegistry::data_object_types(TEST_FIRST_DATA_OBJECT_TYPE_ID);
            assert!(data.is_some());
            assert!(!data.unwrap().active);
        });
    }
}
