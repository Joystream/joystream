mod mock;

use srml_support::traits::Currency;
use system::RawOrigin;

use crate::{BalanceOf, Error};
use mock::*;

#[test]
fn create_text_proposal_codex_call_succeeds() {
    initial_test_ext().execute_with(|| {
        let account_id = 1;
        let origin = RawOrigin::Signed(account_id).into();

        let required_stake = Some(<BalanceOf<Test>>::from(500u32));
        let _imbalance = <Test as stake::Trait>::Currency::deposit_creating(&account_id, 50000);

        assert_eq!(
            ProposalCodex::create_text_proposal(
                origin,
                b"title".to_vec(),
                b"body".to_vec(),
                b"text".to_vec(),
                required_stake,
            ),
            Ok(())
        );
    });
}

#[test]
fn create_text_proposal_codex_call_fails_with_invalid_stake() {
    initial_test_ext().execute_with(|| {
        assert_eq!(
            ProposalCodex::create_text_proposal(
                RawOrigin::Signed(1).into(),
                b"title".to_vec(),
                b"body".to_vec(),
                b"text".to_vec(),
                None,
            ),
            Err(Error::Other(
                "Stake cannot be empty with this proposal"
            ))
        );

        let invalid_stake = Some(<BalanceOf<Test>>::from(5000u32));

        assert_eq!(
            ProposalCodex::create_text_proposal(
                RawOrigin::Signed(1).into(),
                b"title".to_vec(),
                b"body".to_vec(),
                b"text".to_vec(),
                invalid_stake,
            ),
            Err(Error::Other(
                "Stake differs from the proposal requirements"
            ))
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
                None,
            ),
            Err(Error::TextProposalSizeExceeded)
        );

        assert_eq!(
            ProposalCodex::create_text_proposal(
                RawOrigin::Signed(1).into(),
                b"title".to_vec(),
                b"body".to_vec(),
                Vec::new(),
                None,
            ),
            Err(Error::TextProposalIsEmpty)
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
            None,
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
                None,
            ),
            Err(Error::RuntimeProposalSizeExceeded)
        );

        assert_eq!(
            ProposalCodex::create_runtime_upgrade_proposal(
                RawOrigin::Signed(1).into(),
                b"title".to_vec(),
                b"body".to_vec(),
                Vec::new(),
                None,
            ),
            Err(Error::RuntimeProposalIsEmpty)
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
            None,
        )
        .is_err());
    });
}

#[test]
fn create_runtime_upgrade_proposal_codex_call_fails_with_invalid_stake() {
    initial_test_ext().execute_with(|| {
        assert_eq!(
            ProposalCodex::create_runtime_upgrade_proposal(
                RawOrigin::Signed(1).into(),
                b"title".to_vec(),
                b"body".to_vec(),
                b"wasm".to_vec(),
                None,
            ),
            Err(Error::Other(
                "Stake cannot be empty with this proposal"
            ))
        );

        let invalid_stake = Some(<BalanceOf<Test>>::from(500u32));

        assert_eq!(
            ProposalCodex::create_runtime_upgrade_proposal(
                RawOrigin::Signed(1).into(),
                b"title".to_vec(),
                b"body".to_vec(),
                b"wasm".to_vec(),
                invalid_stake,
            ),
            Err(Error::Other(
                "Stake differs from the proposal requirements"
            ))
        );
    });
}

#[test]
fn create_runtime_upgrade_proposal_codex_call_succeeds() {
    initial_test_ext().execute_with(|| {
        let account_id = 1;
        let origin = RawOrigin::Signed(account_id).into();

        let required_stake = Some(<BalanceOf<Test>>::from(50000u32));
        let _imbalance = <Test as stake::Trait>::Currency::deposit_creating(&account_id, 50000);

        assert_eq!(
            ProposalCodex::create_runtime_upgrade_proposal(
                origin,
                b"title".to_vec(),
                b"body".to_vec(),
                b"wasm".to_vec(),
                required_stake,
            ),
            Ok(())
        );
    });
}
