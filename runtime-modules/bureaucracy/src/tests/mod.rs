mod mock;

use crate::types::Lead;
use crate::RawEvent;
use mock::{build_test_externalities, Bureaucracy1, System, TestEvent};
use system::RawOrigin;
use system::{EventRecord, Phase};

struct EventFixture;
impl EventFixture {
    fn assert_events(expected_raw_events: Vec<RawEvent<u64, u64, u64, u64, crate::Instance1>>) {
        let expected_events = expected_raw_events
            .iter()
            .map(|ev| EventRecord {
                phase: Phase::ApplyExtrinsic(0),
                event: TestEvent::bureaucracy_Instance1(ev.clone()),
                topics: vec![],
            })
            .collect::<Vec<EventRecord<_, _>>>();

        assert_eq!(System::events(), expected_events);
    }
}

#[test]
fn set_forum_sudo_set() {
    build_test_externalities().execute_with(|| {
        // Ensure that lead is default
        assert_eq!(Bureaucracy1::current_lead(), None);

        let lead_account_id = 1;
        let lead_member_id = 1;

        // Set lead
        assert_eq!(
            Bureaucracy1::set_lead(RawOrigin::Root.into(), lead_member_id, lead_account_id),
            Ok(())
        );

        let lead = Lead {
            member_id: lead_member_id,
            role_account_id: lead_account_id,
        };

        assert_eq!(Bureaucracy1::current_lead(), Some(lead));

        EventFixture::assert_events(vec![RawEvent::LeaderSet(lead_member_id, lead_account_id)]);
    });
}
