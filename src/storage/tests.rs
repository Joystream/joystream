#![cfg(test)]

use super::*;
use super::mock::*;

use runtime_io::with_externalities;
use srml_support::*;
use system::{self, Phase, EventRecord};

#[test]
fn initial_state()
{
    const DEFAULT_FIRST_ID: u64 = 1000;

    with_externalities(&mut ExtBuilder::default()
        .first_data_object_type_id(DEFAULT_FIRST_ID).build(), ||
    {
        assert_eq!(DataObjectTypeRegistry::first_data_object_type_id(), DEFAULT_FIRST_ID);
    });
}

#[test]
fn fail_register_without_root()
{
    const DEFAULT_FIRST_ID: u64 = 1000;

    with_externalities(&mut ExtBuilder::default()
        .first_data_object_type_id(DEFAULT_FIRST_ID).build(), ||
    {
        let data: TestDataObjectType = TestDataObjectType {
            id: None,
            description: "foo".as_bytes().to_vec(),
            active: false,
        };
        let res = DataObjectTypeRegistry::register_data_object_type(Origin::signed(1), data);
        assert!(res.is_err());
    });
}

#[test]
fn succeed_register_as_root()
{
    const DEFAULT_FIRST_ID: u64 = 1000;

    with_externalities(&mut ExtBuilder::default()
        .first_data_object_type_id(DEFAULT_FIRST_ID).build(), ||
    {
        let data: TestDataObjectType = TestDataObjectType {
            id: None,
            description: "foo".as_bytes().to_vec(),
            active: false,
        };
        let res = DataObjectTypeRegistry::register_data_object_type(Origin::ROOT, data);
        assert!(res.is_ok());
    });
}

#[test]
fn update_existing()
{
    const DEFAULT_FIRST_ID: u64 = 1000;

    with_externalities(&mut ExtBuilder::default()
        .first_data_object_type_id(DEFAULT_FIRST_ID).build(), ||
    {
        // First register a type
        let data: TestDataObjectType = TestDataObjectType {
            id: None,
            description: "foo".as_bytes().to_vec(),
            active: false,
        };
        let id_res = DataObjectTypeRegistry::register_data_object_type(Origin::ROOT, data);
        assert!(id_res.is_ok());
        assert_eq!(*System::events().last().unwrap(),
            EventRecord {
                phase: Phase::ApplyExtrinsic(0),
                event: MetaEvent::types(DataObjectTypeRegistry::RawEvent::DataObjectTypeAdded(DEFAULT_FIRST_ID)),
            }
        );


        // Now update it with new data - we need the ID to be the same as in
        // returned by the previous call. First, though, try and fail without
        let updated1: TestDataObjectType = TestDataObjectType {
            id: None,
            description: "bar".as_bytes().to_vec(),
            active: false,
        };
        let res = DataObjectTypeRegistry::update_data_object_type(Origin::ROOT, updated1);
        assert!(res.is_err());

        // Now try with a bad ID
        let updated2: TestDataObjectType = TestDataObjectType {
            id: Some(DEFAULT_FIRST_ID + 1),
            description: "bar".as_bytes().to_vec(),
            active: false,
        };
        let res = DataObjectTypeRegistry::update_data_object_type(Origin::ROOT, updated2);
        assert!(res.is_err());

        // Finally with an existing ID, it should work.
        let updated3: TestDataObjectType = TestDataObjectType {
            id: Some(DEFAULT_FIRST_ID),
            description: "bar".as_bytes().to_vec(),
            active: false,
        };
        let res = DataObjectTypeRegistry::update_data_object_type(Origin::ROOT, updated3);
        assert!(res.is_ok());
        assert_eq!(*System::events().last().unwrap(),
            EventRecord {
                phase: Phase::ApplyExtrinsic(0),
                event: MetaEvent::types(DataObjectTypeRegistry::RawEvent::DataObjectTypeUpdated(DEFAULT_FIRST_ID)),
            }
        );
    });
}


#[test]
fn activate_existing()
{
    const DEFAULT_FIRST_ID: u64 = 1000;

    with_externalities(&mut ExtBuilder::default()
        .first_data_object_type_id(DEFAULT_FIRST_ID).build(), ||
    {
        // First register a type
        let data: TestDataObjectType = TestDataObjectType {
            id: None,
            description: "foo".as_bytes().to_vec(),
            active: false,
        };
        let id_res = DataObjectTypeRegistry::register_data_object_type(Origin::ROOT, data);
        assert!(id_res.is_ok());
        assert_eq!(*System::events().last().unwrap(),
            EventRecord {
                phase: Phase::ApplyExtrinsic(0),
                event: MetaEvent::types(DataObjectTypeRegistry::RawEvent::DataObjectTypeAdded(DEFAULT_FIRST_ID)),
            }
        );

        // Retrieve, and ensure it's not active.
        let data = DataObjectTypeRegistry::data_object_type(DEFAULT_FIRST_ID);
        assert!(data.is_some());
        assert!(!data.unwrap().active);

        // Now activate the data object type
        let res = DataObjectTypeRegistry::activate_data_object_type(Origin::ROOT, DEFAULT_FIRST_ID, true);
        assert!(res.is_ok());
        assert_eq!(*System::events().last().unwrap(),
            EventRecord {
                phase: Phase::ApplyExtrinsic(0),
                event: MetaEvent::types(DataObjectTypeRegistry::RawEvent::DataObjectTypeUpdated(DEFAULT_FIRST_ID)),
            }
        );

        // Ensure that the item is actually activated.
        let data = DataObjectTypeRegistry::data_object_type(DEFAULT_FIRST_ID);
        assert!(data.is_some());
        assert!(data.unwrap().active);
    });
}
