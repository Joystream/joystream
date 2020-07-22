#![cfg(test)]

use frame_support::{StorageMap, StorageValue};
use system::{EventRecord, Phase, RawOrigin};

use super::mock::*;

const DEFAULT_LEADER_ACCOUNT_ID: u64 = 1;
const DEFAULT_LEADER_MEMBER_ID: u64 = 1;
const DEFAULT_LEADER_WORKER_ID: u32 = 1;

struct SetLeadFixture;
impl SetLeadFixture {
    fn set_default_lead() {
        let worker = working_group::Worker {
            member_id: DEFAULT_LEADER_MEMBER_ID,
            role_account_id: DEFAULT_LEADER_ACCOUNT_ID,
            reward_relationship: None,
            role_stake_profile: None,
        };

        // Create the worker.
        <working_group::WorkerById<Test, StorageWorkingGroupInstance>>::insert(
            DEFAULT_LEADER_WORKER_ID,
            worker,
        );

        // Update current lead.
        <working_group::CurrentLead<Test, StorageWorkingGroupInstance>>::put(
            DEFAULT_LEADER_WORKER_ID,
        );
    }
}

fn get_last_data_object_type_id() -> u64 {
    let dot_id = match System::events().last().unwrap().event {
        MetaEvent::data_object_type_registry(
            data_object_type_registry::RawEvent::DataObjectTypeRegistered(dot_id),
        ) => dot_id,
        _ => 0xdeadbeefu64, // unlikely value
    };
    assert_ne!(dot_id, 0xdeadbeefu64);

    dot_id
}

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
        SetLeadFixture::set_default_lead();

        let data: TestDataObjectType = TestDataObjectType {
            description: "foo".as_bytes().to_vec(),
            active: false,
        };
        let res = TestDataObjectTypeRegistry::register_data_object_type(
            RawOrigin::Signed(DEFAULT_LEADER_ACCOUNT_ID).into(),
            data,
        );
        assert!(res.is_ok());
    });
}

#[test]
fn activate_data_object_type_fails_with_invalid_lead() {
    with_default_mock_builder(|| {
        /*
           Events are not emitted on block 0.
           So any dispatchable calls made during genesis block formation will have no events emitted.
           https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        run_to_block(1);

        SetLeadFixture::set_default_lead();

        // First register a type
        let data: TestDataObjectType = TestDataObjectType {
            description: "foo".as_bytes().to_vec(),
            active: false,
        };
        let id_res = TestDataObjectTypeRegistry::register_data_object_type(
            RawOrigin::Signed(DEFAULT_LEADER_ACCOUNT_ID).into(),
            data,
        );
        assert!(id_res.is_ok());

        let dot_id = get_last_data_object_type_id();

        let invalid_leader_account_id = 2;
        let res = TestDataObjectTypeRegistry::activate_data_object_type(
            RawOrigin::Signed(invalid_leader_account_id).into(),
            dot_id,
        );
        assert_eq!(
            res,
            Err(
                working_group::Error::<Test, crate::StorageWorkingGroupInstance>::IsNotLeadAccount
                    .into()
            )
        );
    });
}

#[test]
fn deactivate_data_object_type_fails_with_invalid_lead() {
    with_default_mock_builder(|| {
        /*
           Events are not emitted on block 0.
           So any dispatchable calls made during genesis block formation will have no events emitted.
           https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        run_to_block(1);

        SetLeadFixture::set_default_lead();

        // First register a type
        let data: TestDataObjectType = TestDataObjectType {
            description: "foo".as_bytes().to_vec(),
            active: true,
        };
        let id_res = TestDataObjectTypeRegistry::register_data_object_type(
            RawOrigin::Signed(DEFAULT_LEADER_ACCOUNT_ID).into(),
            data,
        );
        assert!(id_res.is_ok());

        let dot_id = get_last_data_object_type_id();

        let invalid_leader_account_id = 2;
        let res = TestDataObjectTypeRegistry::deactivate_data_object_type(
            RawOrigin::Signed(invalid_leader_account_id).into(),
            dot_id,
        );
        assert_eq!(
            res,
            Err(
                working_group::Error::<Test, crate::StorageWorkingGroupInstance>::IsNotLeadAccount
                    .into()
            )
        );
    });
}

#[test]
fn update_data_object_type_fails_with_invalid_lead() {
    with_default_mock_builder(|| {
        /*
           Events are not emitted on block 0.
           So any dispatchable calls made during genesis block formation will have no events emitted.
           https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        run_to_block(1);

        SetLeadFixture::set_default_lead();

        // First register a type
        let data: TestDataObjectType = TestDataObjectType {
            description: "foo".as_bytes().to_vec(),
            active: false,
        };
        let id_res = TestDataObjectTypeRegistry::register_data_object_type(
            RawOrigin::Signed(DEFAULT_LEADER_ACCOUNT_ID).into(),
            data,
        );
        assert!(id_res.is_ok());

        let dot_id = get_last_data_object_type_id();
        let updated1: TestDataObjectType = TestDataObjectType {
            description: "bar".as_bytes().to_vec(),
            active: false,
        };

        let invalid_leader_account_id = 2;
        let res = TestDataObjectTypeRegistry::update_data_object_type(
            RawOrigin::Signed(invalid_leader_account_id).into(),
            dot_id,
            updated1,
        );
        assert_eq!(
            res,
            Err(
                working_group::Error::<Test, crate::StorageWorkingGroupInstance>::IsNotLeadAccount
                    .into()
            )
        );
    });
}

#[test]
fn update_existing() {
    with_default_mock_builder(|| {
        /*
           Events are not emitted on block 0.
           So any dispatchable calls made during genesis block formation will have no events emitted.
           https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        run_to_block(1);

        SetLeadFixture::set_default_lead();

        // First register a type
        let data: TestDataObjectType = TestDataObjectType {
            description: "foo".as_bytes().to_vec(),
            active: false,
        };
        let id_res = TestDataObjectTypeRegistry::register_data_object_type(
            RawOrigin::Signed(DEFAULT_LEADER_ACCOUNT_ID).into(),
            data,
        );
        assert!(id_res.is_ok());

        let dot_id = get_last_data_object_type_id();

        // Now update it with new data - we need the ID to be the same as in
        // returned by the previous call. First, though, try and fail with a bad ID
        let updated1: TestDataObjectType = TestDataObjectType {
            description: "bar".as_bytes().to_vec(),
            active: false,
        };
        let res = TestDataObjectTypeRegistry::update_data_object_type(
            RawOrigin::Signed(DEFAULT_LEADER_ACCOUNT_ID).into(),
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
            RawOrigin::Signed(DEFAULT_LEADER_ACCOUNT_ID).into(),
            dot_id,
            updated3,
        );
        assert!(res.is_ok());
        assert_eq!(
            *System::events().last().unwrap(),
            EventRecord {
                phase: Phase::Initialization,
                event: MetaEvent::data_object_type_registry(
                    data_object_type_registry::RawEvent::DataObjectTypeUpdated(dot_id)
                ),
                topics: vec![],
            }
        );
    });
}

#[test]
fn register_data_object_type_failed_with_no_lead() {
    with_default_mock_builder(|| {
        // First register a type
        let data: TestDataObjectType = TestDataObjectType {
            description: "foo".as_bytes().to_vec(),
            active: false,
        };
        let id_res = TestDataObjectTypeRegistry::register_data_object_type(
            RawOrigin::Signed(DEFAULT_LEADER_ACCOUNT_ID).into(),
            data,
        );
        assert!(!id_res.is_ok());
    });
}

#[test]
fn activate_existing() {
    with_default_mock_builder(|| {
        /*
           Events are not emitted on block 0.
           So any dispatchable calls made during genesis block formation will have no events emitted.
           https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        run_to_block(1);

        let expected_data_object_type_id = TEST_FIRST_DATA_OBJECT_TYPE_ID + 1; // on_initialize() increments the default value.

        SetLeadFixture::set_default_lead();

        // First register a type
        let data: TestDataObjectType = TestDataObjectType {
            description: "foo".as_bytes().to_vec(),
            active: false,
        };
        let id_res = TestDataObjectTypeRegistry::register_data_object_type(
            RawOrigin::Signed(DEFAULT_LEADER_ACCOUNT_ID).into(),
            data,
        );
        assert!(id_res.is_ok());
        assert_eq!(
            *System::events().last().unwrap(),
            EventRecord {
                phase: Phase::Initialization,
                event: MetaEvent::data_object_type_registry(
                    data_object_type_registry::RawEvent::DataObjectTypeRegistered(
                        expected_data_object_type_id
                    )
                ),
                topics: vec![],
            }
        );

        // Retrieve, and ensure it's not active.
        let data = TestDataObjectTypeRegistry::data_object_types(expected_data_object_type_id);
        assert!(data.is_some());
        assert!(!data.unwrap().active);

        // Now activate the data object type
        let res = TestDataObjectTypeRegistry::activate_data_object_type(
            RawOrigin::Signed(DEFAULT_LEADER_ACCOUNT_ID).into(),
            expected_data_object_type_id,
        );
        assert!(res.is_ok());
        assert_eq!(
            *System::events().last().unwrap(),
            EventRecord {
                phase: Phase::Initialization,
                event: MetaEvent::data_object_type_registry(
                    data_object_type_registry::RawEvent::DataObjectTypeUpdated(
                        expected_data_object_type_id
                    )
                ),
                topics: vec![],
            }
        );

        // Ensure that the item is actually activated.
        let data = TestDataObjectTypeRegistry::data_object_types(expected_data_object_type_id);
        assert!(data.is_some());
        assert!(data.unwrap().active);

        // Deactivate again.
        let res = TestDataObjectTypeRegistry::deactivate_data_object_type(
            RawOrigin::Signed(DEFAULT_LEADER_ACCOUNT_ID).into(),
            expected_data_object_type_id,
        );
        assert!(res.is_ok());
        let data = TestDataObjectTypeRegistry::data_object_types(expected_data_object_type_id);
        assert!(data.is_some());
        assert!(!data.unwrap().active);
    });
}
