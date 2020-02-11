mod mock;

use mock::*;
use system::RawOrigin;

#[test]
fn create_text_proposal_codex_call_succeeds() {
    initial_test_ext().execute_with(|| {
        let origin = RawOrigin::Signed(1).into();

        assert!(
            ProposalCodex::create_text_proposal(origin, b"title".to_vec(), b"body".to_vec(),)
                .is_ok()
        );
    });
}

#[test]
fn create_text_proposal_codex_call_fails_with_insufficient_rights() {
    initial_test_ext().execute_with(|| {
        let origin = RawOrigin::None.into();

        assert!(
            ProposalCodex::create_text_proposal(origin, b"title".to_vec(), b"body".to_vec(),)
                .is_err()
        );
    });
}
