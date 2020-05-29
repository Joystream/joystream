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
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        assert_eq!(next_curator_group_id(), SECOND_CURATOR_GROUP_ID);

        // Ensure new curator group exists
        assert!(curator_group_exist(FIRST_CURATOR_GROUP_ID));

        assert_ok!(remove_curator_group(LEAD_ORIGIN, FIRST_CURATOR_GROUP_ID));

        // Runtime tested state after call

        // Overall curator groups counter after curator group creation creation checked
        assert_eq!(next_curator_group_id(), FIRST_CURATOR_GROUP_ID);

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
