use super::*;

#[test]
fn create_class_success() {
    with_test_externalities(|| {
        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        assert_eq!(next_class_id(), FIRST_CLASS_ID);
        assert!(!class_exists(FIRST_CLASS_ID));

        // Create simple class with default permissions
        assert_ok!(create_simple_class_with_default_permissions(LEAD_ORIGIN));

        // Runtime tested state after call

        // Ensure class under given if is equal to default one
        let default_class = create_class_with_default_permissions();
        assert_eq!(class_by_id(FIRST_CLASS_ID), default_class);

        let class_created_event = get_test_event(RawEvent::ClassCreated(FIRST_CLASS_ID));

        // Event checked
        assert_event_success(class_created_event, number_of_events_before_call + 1);
    })
}
