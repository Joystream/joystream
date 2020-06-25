use super::*;

#[test]
fn update_class_permissions_success() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class_with_default_permissions(LEAD_ORIGIN));

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

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let maintainers = BTreeSet::from_iter(vec![FIRST_CURATOR_ID, SECOND_CURATOR_ID]);

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

        // Event checked
        assert_event_success(
            class_permissions_updated_event,
            number_of_events_before_call + 1,
        );
    })
}
