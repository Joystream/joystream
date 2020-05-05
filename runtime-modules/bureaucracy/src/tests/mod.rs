mod mock;

use crate::types::Lead;
use mock::{build_test_externalities, Bureaucracy1};
use system::RawOrigin;

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

        // event emitted?!
    });
}
