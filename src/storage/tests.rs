#![cfg(test)]

use super::*;
use super::mock::*;

use runtime_io::with_externalities;
use srml_support::*;
use system::{self, Phase, EventRecord};

#[test]
fn initial_state() {
    const DEFAULT_FIRST_ID: u64 = 1000;

    with_externalities(&mut ExtBuilder::default()
        .first_data_object_type_id(DEFAULT_FIRST_ID).build(), || {
        assert_eq!(TestDataObjectTypeRegistry::first_data_object_type_id(), DEFAULT_FIRST_ID);
    });
}

#[test]
fn fail_register_without_root() {
    const DEFAULT_FIRST_ID: u64 = 1000;

    with_externalities(&mut ExtBuilder::default()
        .first_data_object_type_id(DEFAULT_FIRST_ID).build(), || {
        let data: TestDataObjectType = TestDataObjectType {
            description: "foo".as_bytes().to_vec(),
            active: false,
        };
        let res = TestDataObjectTypeRegistry::register_data_object_type(Origin::signed(1), data);
        assert!(res.is_err());
    });
}

#[test]
fn succeed_register_as_root() {
    const DEFAULT_FIRST_ID: u64 = 1000;

    with_externalities(&mut ExtBuilder::default()
        .first_data_object_type_id(DEFAULT_FIRST_ID).build(), || {
        let data: TestDataObjectType = TestDataObjectType {
            description: "foo".as_bytes().to_vec(),
            active: false,
        };
        let res = TestDataObjectTypeRegistry::register_data_object_type(Origin::ROOT, data);
        assert!(res.is_ok());
    });
}

#[test]
fn update_existing() {
    const DEFAULT_FIRST_ID: u64 = 1000;

    with_externalities(&mut ExtBuilder::default()
        .first_data_object_type_id(DEFAULT_FIRST_ID).build(), || {
        // First register a type
        let data: TestDataObjectType = TestDataObjectType {
            description: "foo".as_bytes().to_vec(),
            active: false,
        };
        let id_res = TestDataObjectTypeRegistry::register_data_object_type(Origin::ROOT, data);
        assert!(id_res.is_ok());
        assert_eq!(*System::events().last().unwrap(),
            EventRecord {
                phase: Phase::ApplyExtrinsic(0),
                event: MetaEvent::data_object_type_registry(data_object_type_registry::RawEvent::DataObjectTypeRegistered(DEFAULT_FIRST_ID)),
            }
        );

        // Try updating with a bad ID
        let updated: TestDataObjectType = TestDataObjectType {
            description: "bar".as_bytes().to_vec(),
            active: false,
        };
        let updated2 = updated.clone();
        let res = TestDataObjectTypeRegistry::update_data_object_type(Origin::ROOT, DEFAULT_FIRST_ID + 1, updated);
        assert!(res.is_err());

        // Finally with an existing ID, it should work.
        let res = TestDataObjectTypeRegistry::update_data_object_type(Origin::ROOT, DEFAULT_FIRST_ID, updated2);
        assert!(res.is_ok());
        assert_eq!(*System::events().last().unwrap(),
            EventRecord {
                phase: Phase::ApplyExtrinsic(0),
                event: MetaEvent::data_object_type_registry(data_object_type_registry::RawEvent::DataObjectTypeUpdated(DEFAULT_FIRST_ID)),
            }
        );
    });
}


#[test]
fn activate_existing() {
    const DEFAULT_FIRST_ID: u64 = 1000;

    with_externalities(&mut ExtBuilder::default()
        .first_data_object_type_id(DEFAULT_FIRST_ID).build(), || {
        // First register a type
        let data: TestDataObjectType = TestDataObjectType {
            description: "foo".as_bytes().to_vec(),
            active: false,
        };
        let id_res = TestDataObjectTypeRegistry::register_data_object_type(Origin::ROOT, data);
        assert!(id_res.is_ok());
        assert_eq!(*System::events().last().unwrap(),
            EventRecord {
                phase: Phase::ApplyExtrinsic(0),
                event: MetaEvent::data_object_type_registry(data_object_type_registry::RawEvent::DataObjectTypeRegistered(DEFAULT_FIRST_ID)),
            }
        );

        // Retrieve, and ensure it's not active.
        let data = TestDataObjectTypeRegistry::data_object_type(DEFAULT_FIRST_ID);
        assert!(data.is_some());
        assert!(!data.unwrap().active);

        // Now activate the data object type
        let res = TestDataObjectTypeRegistry::activate_data_object_type(Origin::ROOT, DEFAULT_FIRST_ID);
        assert!(res.is_ok());
        assert_eq!(*System::events().last().unwrap(),
            EventRecord {
                phase: Phase::ApplyExtrinsic(0),
                event: MetaEvent::data_object_type_registry(data_object_type_registry::RawEvent::DataObjectTypeUpdated(DEFAULT_FIRST_ID)),
            }
        );

        // Ensure that the item is actually activated.
        let data = TestDataObjectTypeRegistry::data_object_type(DEFAULT_FIRST_ID);
        assert!(data.is_some());
        assert!(data.unwrap().active);

        // Deactivate again.
        let res = TestDataObjectTypeRegistry::deactivate_data_object_type(Origin::ROOT, DEFAULT_FIRST_ID);
        assert!(res.is_ok());
        let data = TestDataObjectTypeRegistry::data_object_type(DEFAULT_FIRST_ID);
        assert!(data.is_some());
        assert!(!data.unwrap().active);
    });
}
