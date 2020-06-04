#![cfg(test)]

use super::mock::*;

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
        let data = TestDataObjectTypeRegistry::data_object_types(TEST_FIRST_DATA_OBJECT_TYPE_ID);
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
        let data = TestDataObjectTypeRegistry::data_object_types(TEST_FIRST_DATA_OBJECT_TYPE_ID);
        assert!(data.is_some());
        assert!(data.unwrap().active);

        // Deactivate again.
        let res = TestDataObjectTypeRegistry::deactivate_data_object_type(
            system::RawOrigin::Root.into(),
            TEST_FIRST_DATA_OBJECT_TYPE_ID,
        );
        assert!(res.is_ok());
        let data = TestDataObjectTypeRegistry::data_object_types(TEST_FIRST_DATA_OBJECT_TYPE_ID);
        assert!(data.is_some());
        assert!(!data.unwrap().active);
    });
}
