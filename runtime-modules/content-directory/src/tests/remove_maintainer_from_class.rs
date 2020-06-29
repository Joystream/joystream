use super::*;

#[test]
fn remove_maintainer_from_class_success() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class_with_default_permissions(LEAD_ORIGIN));

        // Add first curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Add second curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Add first maintainer to class
        assert_ok!(add_maintainer_to_class(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            FIRST_CURATOR_GROUP_ID
        ));

        // Add second maintainer to class
        assert_ok!(add_maintainer_to_class(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            SECOND_CURATOR_GROUP_ID
        ));

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Remove first maintainer from class
        assert_ok!(remove_maintainer_from_class(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            FIRST_CURATOR_GROUP_ID
        ));

        // Runtime tested state after call

        // Ensure curator_group removed from class maintainers set
        let mut class = create_class_with_default_permissions();
        class
            .get_permissions_mut()
            .get_maintainers_mut()
            .insert(SECOND_CURATOR_GROUP_ID);
        assert_eq!(class_by_id(FIRST_CLASS_ID), class);

        let maintainer_removed_event = get_test_event(RawEvent::MaintainerRemoved(
            FIRST_CLASS_ID,
            FIRST_CURATOR_GROUP_ID,
        ));

        // Event checked
        assert_event_success(maintainer_removed_event, number_of_events_before_call + 1);
    })
}
