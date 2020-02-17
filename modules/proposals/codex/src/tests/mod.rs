mod mock;

use mock::*;
use system::RawOrigin;

#[test]
fn create_text_proposal_codex_call_succeeds() {
    initial_test_ext().execute_with(|| {
        let origin = RawOrigin::Signed(1).into();

        assert_eq!(
            ProposalCodex::create_text_proposal(
                origin,
                b"title".to_vec(),
                b"body".to_vec(),
                b"text".to_vec(),
            ),
            Ok(())
        );
    });
}

#[test]
fn create_text_proposal_codex_call_fails_with_incorrect_text_size() {
    initial_test_ext().execute_with(|| {
        let origin = RawOrigin::Signed(1).into();

        let long_text = [0u8; 30000].to_vec();
        assert_eq!(
            ProposalCodex::create_text_proposal(
                origin,
                b"title".to_vec(),
                b"body".to_vec(),
                long_text,
            ),
            Err(crate::Error::TextProposalSizeExceeded)
        );
    });
}

#[test]
fn create_text_proposal_codex_call_fails_with_insufficient_rights() {
    initial_test_ext().execute_with(|| {
        let origin = RawOrigin::None.into();

        assert!(ProposalCodex::create_text_proposal(
            origin,
            b"title".to_vec(),
            b"body".to_vec(),
            b"text".to_vec(),
        )
        .is_err());
    });
}
