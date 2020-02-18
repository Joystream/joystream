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

        assert_eq!(
            ProposalCodex::create_text_proposal(
                RawOrigin::Signed(1).into(),
                b"title".to_vec(),
                b"body".to_vec(),
                Vec::new(),
            ),
            Err(crate::Error::TextProposalIsEmpty)
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

#[test]
fn create_upgrade_runtime_proposal_codex_call_fails_with_incorrect_wasm_size() {
    initial_test_ext().execute_with(|| {
        let origin = RawOrigin::Signed(1).into();

        let long_wasm = [0u8; 30000].to_vec();
        assert_eq!(
            ProposalCodex::create_runtime_upgrade_proposal(
                origin,
                b"title".to_vec(),
                b"body".to_vec(),
                long_wasm,
            ),
            Err(crate::Error::RuntimeProposalSizeExceeded)
        );

        assert_eq!(
            ProposalCodex::create_runtime_upgrade_proposal(
                RawOrigin::Signed(1).into(),
                b"title".to_vec(),
                b"body".to_vec(),
                Vec::new(),
            ),
            Err(crate::Error::RuntimeProposalIsEmpty)
        );
    });
}

#[test]
fn create_upgrade_runtime_proposal_codex_call_fails_with_insufficient_rights() {
    initial_test_ext().execute_with(|| {
        let origin = RawOrigin::None.into();

        assert!(ProposalCodex::create_runtime_upgrade_proposal(
            origin,
            b"title".to_vec(),
            b"body".to_vec(),
            b"wasm".to_vec(),
        )
        .is_err());
    });
}

#[test]
fn create_runtime_upgrade_proposal_codex_call_succeeds() {
    initial_test_ext().execute_with(|| {
        let origin = RawOrigin::Signed(1).into();

        assert_eq!(
            ProposalCodex::create_runtime_upgrade_proposal(
                origin,
                b"title".to_vec(),
                b"body".to_vec(),
                b"wasm".to_vec(),
            ),
            Ok(())
        );
    });
}
