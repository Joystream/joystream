#![cfg(test)]

use super::*;
use crate::mock::*;
use core::iter::FromIterator;
use rstd::collections::btree_set::BTreeSet;

///Root Origin

#[test]
fn add_curator_group_success() {
    with_test_externalities(|| {
        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        assert_eq!(next_curator_group_id(), FIRST_CURATOR_GROUP_ID);
        assert!(!curator_group_exist(FIRST_CURATOR_GROUP_ID));

        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Runtime tested state after call

        // Overall curator groups counter after curator group creation creation checked
        assert_eq!(next_curator_group_id(), SECOND_CURATOR_GROUP_ID);

        // Ensure new curator group exists
        assert!(curator_group_exist(FIRST_CURATOR_GROUP_ID));

        let curator_group_created_event =
            get_test_event(RawEvent::CuratorGroupAdded(FIRST_CURATOR_GROUP_ID));

        // Event checked
        assert_event_success(
            curator_group_created_event,
            number_of_events_before_call + 1,
        );
    })
}

#[test]
fn remove_curator_group_success() {
    with_test_externalities(|| {
        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        assert_eq!(next_curator_group_id(), SECOND_CURATOR_GROUP_ID);

        // Ensure new curator group exists
        assert!(curator_group_exist(FIRST_CURATOR_GROUP_ID));

        assert_ok!(remove_curator_group(LEAD_ORIGIN, FIRST_CURATOR_GROUP_ID));

        // Runtime tested state after call

        assert_eq!(next_curator_group_id(), SECOND_CURATOR_GROUP_ID);

        // Ensure curator group removed
        assert!(!curator_group_exist(FIRST_CURATOR_GROUP_ID));

        let curator_group_removed_event =
            get_test_event(RawEvent::CuratorGroupRemoved(FIRST_CURATOR_GROUP_ID));

        // Event checked
        assert_event_success(
            curator_group_removed_event,
            number_of_events_before_call + 1,
        );
    })
}

#[test]
fn set_curator_group_status_success() {
    with_test_externalities(|| {
        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        let mut curator_group = CuratorGroup::default();

        // Runtime tested state before call

        // Curator group right after creation
        assert_eq!(curator_group_by_id(FIRST_CURATOR_GROUP_ID), curator_group);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Change curator group status
        assert_ok!(set_curator_group_status(
            LEAD_ORIGIN,
            FIRST_CURATOR_GROUP_ID,
            true
        ));

        // Runtime tested state after call

        // Ensure curator group status changed
        curator_group.set_status(true);
        assert_eq!(curator_group_by_id(FIRST_CURATOR_GROUP_ID), curator_group);

        let curator_group_status_set_event = get_test_event(RawEvent::CuratorGroupStatusSet(
            FIRST_CURATOR_GROUP_ID,
            true,
        ));

        // Event checked
        assert_event_success(
            curator_group_status_set_event,
            number_of_events_before_call + 1,
        );
    })
}

#[test]
fn add_curator_to_group_success() {
    with_test_externalities(|| {
        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        let mut curator_group = CuratorGroup::default();

        // Runtime tested state before call

        // Curator group right after creation
        assert_eq!(curator_group_by_id(FIRST_CURATOR_GROUP_ID), curator_group);

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
fn remove_curator_from_group_success() {
    with_test_externalities(|| {
        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        let mut curator_group = CuratorGroup::default();

        // Runtime tested state before call

        // Curator group right after creation
        assert_eq!(curator_group_by_id(FIRST_CURATOR_GROUP_ID), curator_group);

        // Add first curator to group
        assert_ok!(add_curator_to_group(
            LEAD_ORIGIN,
            FIRST_CURATOR_GROUP_ID,
            FIRST_CURATOR_ID
        ));
        // Add second curator to group
        assert_ok!(add_curator_to_group(
            LEAD_ORIGIN,
            FIRST_CURATOR_GROUP_ID,
            SECOND_CURATOR_ID
        ));

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Remove first curator from group
        assert_ok!(remove_curator_from_group(
            LEAD_ORIGIN,
            FIRST_CURATOR_GROUP_ID,
            FIRST_CURATOR_ID
        ));

        // Runtime tested state after call

        // Ensure group contains only second curator
        curator_group.get_curators_mut().insert(SECOND_CURATOR_ID);
        assert_eq!(curator_group_by_id(FIRST_CURATOR_GROUP_ID), curator_group);

        let curator_group_curator_removed_event = get_test_event(RawEvent::CuratorRemoved(
            FIRST_CURATOR_GROUP_ID,
            FIRST_CURATOR_ID,
        ));

        // Event checked
        assert_event_success(
            curator_group_curator_removed_event,
            number_of_events_before_call + 1,
        );
    })
}
