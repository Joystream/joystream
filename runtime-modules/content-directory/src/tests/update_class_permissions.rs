use super::*;

#[test]
fn update_class_permissions_success() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Add first curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Add second curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Runtime tested state before call

        let mut class_permissions = ClassPermissions::default();

        // Ensure class permissions of newly created Class are equal to default ones

        assert_eq!(
            class_by_id(FIRST_CLASS_ID).get_permissions(),
            class_permissions
        );

        // Ensure curator groups maintain no classes.

        assert_eq!(
            curator_group_by_id(FIRST_CURATOR_GROUP_ID).get_number_of_classes_maintained(),
            0
        );

        assert_eq!(
            curator_group_by_id(SECOND_CURATOR_GROUP_ID).get_number_of_classes_maintained(),
            0
        );

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let mut maintainers =
            BTreeSet::from_iter(vec![FIRST_CURATOR_GROUP_ID, SECOND_CURATOR_GROUP_ID]);

        // Update class permissions
        assert_ok!(update_class_permissions(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            None,
            Some(true),
            None,
            Some(maintainers.clone())
        ));

        // Runtime tested state after call

        // Ensure class permissions updated succesfully

        *class_permissions.get_maintainers_mut() = maintainers;
        class_permissions.set_entity_creation_blocked(true);

        assert_eq!(
            class_by_id(FIRST_CLASS_ID).get_permissions(),
            class_permissions
        );

        let class_permissions_updated_event =
            get_test_event(RawEvent::ClassPermissionsUpdated(FIRST_CLASS_ID));

        // Ensure number of classes maintained by curator groups updated succesfully.

        assert_eq!(
            curator_group_by_id(FIRST_CURATOR_GROUP_ID).get_number_of_classes_maintained(),
            1
        );

        assert_eq!(
            curator_group_by_id(SECOND_CURATOR_GROUP_ID).get_number_of_classes_maintained(),
            1
        );

        maintainers = BTreeSet::from_iter(vec![SECOND_CURATOR_GROUP_ID]);

        // Update class permissions
        assert_ok!(update_class_permissions(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            None,
            Some(true),
            None,
            Some(maintainers.clone())
        ));

        // Ensure number of classes maintained by curator groups updated succesfully.

        assert_eq!(
            curator_group_by_id(FIRST_CURATOR_GROUP_ID).get_number_of_classes_maintained(),
            0
        );

        assert_eq!(
            curator_group_by_id(SECOND_CURATOR_GROUP_ID).get_number_of_classes_maintained(),
            1
        );

        // Event checked
        assert_event(
            class_permissions_updated_event,
            number_of_events_before_call + 2,
        );
    })
}

#[test]
fn update_class_permissions_lead_auth_failed() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to update class permissions under non lead origin
        let update_class_permissions_result = update_class_permissions(
            FIRST_MEMBER_ORIGIN,
            FIRST_CLASS_ID,
            None,
            Some(true),
            None,
            None,
        );

        // Failure checked
        assert_failure(
            update_class_permissions_result,
            Error::<Runtime>::LeadAuthFailed,
            number_of_events_before_call,
        );
    })
}

#[test]
fn update_class_permissions_of_non_existent_class() {
    with_test_externalities(|| {
        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to update class permissions of non existent class
        let update_class_permissions_result =
            update_class_permissions(LEAD_ORIGIN, FIRST_CLASS_ID, None, Some(true), None, None);

        // Failure checked
        assert_failure(
            update_class_permissions_result,
            Error::<Runtime>::ClassNotFound,
            number_of_events_before_call,
        );
    })
}

#[test]
fn update_class_permissions_curator_group_does_not_exist() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let maintainers = BTreeSet::from_iter(vec![UNKNOWN_CURATOR_GROUP_ID]);

        // Make an attempt to update class permissions, providing curator group maintainers which aren`t exist in runtime yet
        let update_class_permissions_result = update_class_permissions(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            None,
            Some(true),
            None,
            Some(maintainers),
        );

        // Failure checked
        assert_failure(
            update_class_permissions_result,
            Error::<Runtime>::CuratorGroupDoesNotExist,
            number_of_events_before_call,
        );
    })
}

#[test]
fn update_class_permissions_maintainers_limit_reached() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Add curator groups, which total number exceeds MaxNumberOfMaintainersPerClass runtime limit
        // and initialize class maintainers set with their respective ids
        let mut maintainers = BTreeSet::new();
        (1..=(MaxNumberOfMaintainersPerClass::get() + 1))
            .into_iter()
            .for_each(|curator_group_id| {
                assert_ok!(add_curator_group(LEAD_ORIGIN));
                maintainers.insert(curator_group_id as CuratorGroupId);
            });

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to update class permissions, providing curator group maintainers,
        // which total number exceeds MaxNumberOfMaintainersPerClass runtime limit
        let update_class_permissions_result = update_class_permissions(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            None,
            Some(true),
            None,
            Some(maintainers),
        );

        // Failure checked
        assert_failure(
            update_class_permissions_result,
            Error::<Runtime>::ClassMaintainersLimitReached,
            number_of_events_before_call,
        );
    })
}
