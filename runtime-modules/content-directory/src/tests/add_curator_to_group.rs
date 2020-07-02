use super::*;

#[test]
fn add_curator_to_group_success() {
    with_test_externalities(|| {
        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Add curator to group
        assert_ok!(add_curator_to_group(
            LEAD_ORIGIN,
            FIRST_CURATOR_GROUP_ID,
            FIRST_CURATOR_ID
        ));

        // Runtime tested state after call

        // Ensure curator added to group
        let mut curator_group = CuratorGroup::default();
        curator_group.get_curators_mut().insert(FIRST_CURATOR_ID);
        assert_eq!(curator_group_by_id(FIRST_CURATOR_GROUP_ID), curator_group);

        let curator_group_curator_added_event = get_test_event(RawEvent::CuratorAdded(
            FIRST_CURATOR_GROUP_ID,
            FIRST_CURATOR_ID,
        ));

        // Event checked
        assert_event_success(
            curator_group_curator_added_event,
            number_of_events_before_call + 1,
        );
    })
}

#[test]
fn add_curator_to_group_lead_auth_failed() {
    with_test_externalities(|| {
        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to add curator to group from non lead origin
        let add_curator_to_group_result = add_curator_to_group(
            FIRST_MEMBER_ORIGIN,
            FIRST_CURATOR_GROUP_ID,
            FIRST_CURATOR_ID,
        );

        // Failure checked
        assert_failure(
            add_curator_to_group_result,
            ERROR_LEAD_AUTH_FAILED,
            number_of_events_before_call,
        );
    })
}

#[test]
fn add_curator_to_non_existent_group() {
    with_test_externalities(|| {
        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to add curator to group that does not exist
        let add_curator_to_group_result =
            add_curator_to_group(LEAD_ORIGIN, FIRST_CURATOR_GROUP_ID, FIRST_CURATOR_ID);

        // Failure checked
        assert_failure(
            add_curator_to_group_result,
            ERROR_CURATOR_GROUP_DOES_NOT_EXIST,
            number_of_events_before_call,
        );
    })
}

#[test]
fn add_curator_to_group_curators_limit_reached() {
    with_test_externalities(|| {
        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let mut number_of_curators_added = 0;

        let add_curator_to_group_result = loop {
            // Add curator to group
            let add_curator_to_group_result = add_curator_to_group(
                LEAD_ORIGIN,
                FIRST_CURATOR_GROUP_ID,
                number_of_curators_added,
            );

            if add_curator_to_group_result.is_err() {
                break add_curator_to_group_result;
            } else {
                number_of_curators_added += 1;
            }
        };

        // Ensure number of curators added is equal to the MaxNumberOfCuratorsPerGroup runtime limit
        assert_eq!(
            number_of_curators_added as u32,
            MaxNumberOfCuratorsPerGroup::get()
        );

        // Failure checked
        assert_failure(
            add_curator_to_group_result,
            ERROR_NUMBER_OF_CURATORS_PER_GROUP_LIMIT_REACHED,
            number_of_events_before_call + number_of_curators_added as usize,
        );
    })
}
