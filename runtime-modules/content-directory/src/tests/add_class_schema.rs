use super::*;

#[test]
fn add_class_schema_success() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        let first_property =
            Property::default_with_name(PropertyNameLengthConstraint::get().max() as usize);

        let second_property =
            Property::default_with_name((PropertyNameLengthConstraint::get().max() - 1) as usize);

        // Add first class schema
        assert_ok!(add_class_schema(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            BTreeSet::new(),
            vec![first_property.clone()]
        ));

        // Add second class schema
        assert_ok!(add_class_schema(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            BTreeSet::from_iter(vec![FIRST_PROPERTY_ID].into_iter()),
            vec![second_property.clone()]
        ));

        // Runtime tested state after call

        // Ensure class schemas added succesfully
        let mut class = create_class_with_default_permissions();

        class.set_properties(vec![first_property, second_property]);
        *class.get_schemas_mut() = vec![
            Schema::new(BTreeSet::from_iter(vec![FIRST_PROPERTY_ID].into_iter())),
            Schema::new(BTreeSet::from_iter(
                vec![FIRST_PROPERTY_ID, SECOND_PROPERTY_ID].into_iter(),
            )),
        ];

        assert_eq!(class_by_id(FIRST_CLASS_ID), class);

        let class_schema_added_event =
            get_test_event(RawEvent::ClassSchemaAdded(FIRST_CLASS_ID, SECOND_SCHEMA_ID));

        // Last event checked
        assert_event(class_schema_added_event, number_of_events_before_call + 2);
    })
}

#[test]
fn add_class_schema_lead_auth_failied() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        let property =
            Property::default_with_name(PropertyNameLengthConstraint::get().max() as usize);

        // Make an attempt to add class schema under non lead origin
        let add_class_schema_result = add_class_schema(
            FIRST_MEMBER_ORIGIN,
            FIRST_CLASS_ID,
            BTreeSet::new(),
            vec![property],
        );

        // Failure checked
        assert_failure(
            add_class_schema_result,
            Error::<Runtime>::LeadAuthFailed,
            number_of_events_before_call,
        );
    })
}

#[test]
fn add_class_schema_class_does_not_exist() {
    with_test_externalities(|| {
        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        let property =
            Property::default_with_name(PropertyNameLengthConstraint::get().max() as usize);

        // Make an attempt to add class schema to class, which does not exist in runtime
        let add_class_schema_result = add_class_schema(
            LEAD_ORIGIN,
            UNKNOWN_CLASS_ID,
            BTreeSet::new(),
            vec![property],
        );

        // Failure checked
        assert_failure(
            add_class_schema_result,
            Error::<Runtime>::ClassNotFound,
            number_of_events_before_call,
        );
    })
}

#[test]
fn add_class_schema_limit_reached() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        let mut number_of_schemas_added = 0;

        // Add schemas to the class until MaxNumberOfSchemasPerClass limit reached
        let add_class_schema_result = loop {
            // property name must be unique
            let property = Property::default_with_name(
                PropertyNameLengthConstraint::get().max() as usize - number_of_schemas_added,
            );

            // Add class schema
            let add_class_schema_result =
                add_class_schema(LEAD_ORIGIN, FIRST_CLASS_ID, BTreeSet::new(), vec![property]);

            if add_class_schema_result.is_err() {
                break add_class_schema_result;
            } else {
                number_of_schemas_added += 1;
            }
        };

        // Ensure number of schemas added is equal to MaxNumberOfSchemasPerClass
        assert_eq!(
            number_of_schemas_added,
            MaxNumberOfSchemasPerClass::get() as usize
        );

        // Failure checked
        assert_failure(
            add_class_schema_result,
            Error::<Runtime>::ClassSchemasLimitReached,
            number_of_events_before_call + number_of_schemas_added,
        );
    })
}

#[test]
fn add_class_schema_no_props_in_schema() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        // Make an attempt to add class schema with both empty existing and new properties
        let add_class_schema_result =
            add_class_schema(LEAD_ORIGIN, FIRST_CLASS_ID, BTreeSet::new(), vec![]);

        // Failure checked
        assert_failure(
            add_class_schema_result,
            Error::<Runtime>::NoPropertiesInClassSchema,
            number_of_events_before_call,
        );
    })
}

#[test]
fn add_class_schema_properties_limit_reached() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        // Add properties to Vec until it exceed MaxNumberOfPropertiesPerSchema runtime constraint
        let properties = (1..=MaxNumberOfPropertiesPerSchema::get() + 1)
            .into_iter()
            .map(|property_id| {
                // property name must be unique
                let name_len = PropertyNameLengthConstraint::get().max() as u32 - property_id;
                Property::default_with_name(name_len as usize)
            })
            .collect();

        // Make an attempt to add class schema, providing properties, which total number exceeds MaxNumberOfPropertiesPerSchema limit
        let add_class_schema_result =
            add_class_schema(LEAD_ORIGIN, FIRST_CLASS_ID, BTreeSet::new(), properties);

        // Failure checked
        assert_failure(
            add_class_schema_result,
            Error::<Runtime>::SchemaPropertiesLimitReached,
            number_of_events_before_call,
        );
    })
}

#[test]
fn add_class_schema_prop_name_not_unique() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime tested state before call

        let first_property =
            Property::default_with_name(PropertyNameLengthConstraint::get().max() as usize);

        let second_property =
            Property::default_with_name((PropertyNameLengthConstraint::get().max()) as usize);

        // Add first class schema
        assert_ok!(add_class_schema(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            BTreeSet::new(),
            vec![first_property]
        ));

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to add second class schema with the same name
        let add_class_schema_result = add_class_schema(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            BTreeSet::from_iter(vec![FIRST_PROPERTY_ID].into_iter()),
            vec![second_property],
        );

        // Failure checked
        assert_failure(
            add_class_schema_result,
            Error::<Runtime>::PropertyNameNotUniqueInAClass,
            number_of_events_before_call,
        );
    })
}

#[test]
fn add_class_schema_refers_invalid_property_index() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        let property =
            Property::default_with_name(PropertyNameLengthConstraint::get().max() as usize);

        // Make an attempt to add class schema, providing existing property index, which corresponding property does not added yet
        let add_class_schema_result = add_class_schema(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            BTreeSet::from_iter(vec![UNKNOWN_PROPERTY_ID].into_iter()),
            vec![property],
        );

        // Failure checked
        assert_failure(
            add_class_schema_result,
            Error::<Runtime>::ClassSchemaRefersUnknownPropertyIndex,
            number_of_events_before_call,
        );
    })
}

#[test]
fn add_class_schema_property_name_too_long() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        let property = Property::<ClassId>::invalid(InvalidPropertyType::NameTooLong);

        // Make an attempt to add class schema, providing property with name, which length exceeds PropertyNameLengthConstraint
        let add_class_schema_result =
            add_class_schema(LEAD_ORIGIN, FIRST_CLASS_ID, BTreeSet::new(), vec![property]);

        // Failure checked
        assert_failure(
            add_class_schema_result,
            Error::<Runtime>::PropertyNameTooLong,
            number_of_events_before_call,
        );
    })
}

#[test]
fn add_class_schema_property_name_too_short() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        let property = Property::<ClassId>::invalid(InvalidPropertyType::NameTooShort);

        // Make an attempt to add class schema, providing property with name, which length is less than min value of PropertyNameLengthConstraint
        let add_class_schema_result =
            add_class_schema(LEAD_ORIGIN, FIRST_CLASS_ID, BTreeSet::new(), vec![property]);

        // Failure checked
        assert_failure(
            add_class_schema_result,
            Error::<Runtime>::PropertyNameTooShort,
            number_of_events_before_call,
        );
    })
}

#[test]
fn add_class_schema_property_description_too_long() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        let property = Property::<ClassId>::invalid(InvalidPropertyType::DescriptionTooLong);

        // Make an attempt to add class schema, providing property with description, which length exceeds PropertyDescriptionLengthConstraint
        let add_class_schema_result =
            add_class_schema(LEAD_ORIGIN, FIRST_CLASS_ID, BTreeSet::new(), vec![property]);

        // Failure checked
        assert_failure(
            add_class_schema_result,
            Error::<Runtime>::PropertyDescriptionTooLong,
            number_of_events_before_call,
        );
    })
}

#[test]
fn add_class_schema_property_description_too_short() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        let property = Property::<ClassId>::invalid(InvalidPropertyType::DescriptionTooShort);

        // Make an attempt to add class schema, providing property with description, which length is less than min value of PropertyDescriptionLengthConstraint
        let add_class_schema_result =
            add_class_schema(LEAD_ORIGIN, FIRST_CLASS_ID, BTreeSet::new(), vec![property]);

        // Failure checked
        assert_failure(
            add_class_schema_result,
            Error::<Runtime>::PropertyDescriptionTooShort,
            number_of_events_before_call,
        );
    })
}

#[test]
fn add_class_schema_text_property_is_too_long() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        let property = Property::<ClassId>::invalid(InvalidPropertyType::TextIsTooLong);

        // Make an attempt to add class schema, providing property with Text type, which TextMaxLength exceeds corresponding TextMaxLengthConstraint
        let add_class_schema_result =
            add_class_schema(LEAD_ORIGIN, FIRST_CLASS_ID, BTreeSet::new(), vec![property]);

        // Failure checked
        assert_failure(
            add_class_schema_result,
            Error::<Runtime>::TextPropertyTooLong,
            number_of_events_before_call,
        );
    })
}

#[test]
fn add_class_schema_text_hash_property_is_too_long() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        let property = Property::<ClassId>::invalid(InvalidPropertyType::TextHashIsTooLong);

        // Make an attempt to add class schema, providing property with Hash type,
        // which HashedTextMaxLength exceeds corresponding HashedTextMaxLengthConstraint
        let add_class_schema_result =
            add_class_schema(LEAD_ORIGIN, FIRST_CLASS_ID, BTreeSet::new(), vec![property]);

        // Failure checked
        assert_failure(
            add_class_schema_result,
            Error::<Runtime>::HashedTextPropertyTooLong,
            number_of_events_before_call,
        );
    })
}

#[test]
fn add_class_schema_property_vec_property_is_too_long() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        let property = Property::<ClassId>::invalid(InvalidPropertyType::VecIsTooLong);

        // Make an attempt to add class schema, providing Vector property, which VecMaxLength exceeds corresponding VecMaxLengthConstraint
        let add_class_schema_result =
            add_class_schema(LEAD_ORIGIN, FIRST_CLASS_ID, BTreeSet::new(), vec![property]);

        // Failure checked
        assert_failure(
            add_class_schema_result,
            Error::<Runtime>::VecPropertyTooLong,
            number_of_events_before_call,
        );
    })
}

#[test]
fn add_class_schema_property_refers_unknown_class() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        let reference_vec_type = PropertyType::<ClassId>::vec_reference(
            UNKNOWN_CLASS_ID,
            true,
            VecMaxLengthConstraint::get(),
        );
        let property = Property::<ClassId>::with_name_and_type(1, reference_vec_type, true, true);

        // Make an attempt to add class schema, providing property with Type::Reference, which refers to unknown ClassId
        let add_class_schema_result =
            add_class_schema(LEAD_ORIGIN, FIRST_CLASS_ID, BTreeSet::new(), vec![property]);

        // Failure checked
        assert_failure(
            add_class_schema_result,
            Error::<Runtime>::ClassSchemaRefersUnknownClass,
            number_of_events_before_call,
        );
    })
}
