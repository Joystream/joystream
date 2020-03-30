mod mock;

use governance::election_params::ElectionParameters;
use srml_support::traits::Currency;
use srml_support::StorageMap;
use system::RawOrigin;

use crate::{BalanceOf, Error};
use mock::*;

#[test]
fn create_text_proposal_codex_call_succeeds() {
    initial_test_ext().execute_with(|| {
        let account_id = 1;
        let proposer_id = 1;
        let origin = RawOrigin::Signed(account_id).into();

        let required_stake = Some(<BalanceOf<Test>>::from(500u32));
        let _imbalance = <Test as stake::Trait>::Currency::deposit_creating(&account_id, 50000);

        assert_eq!(
            ProposalCodex::create_text_proposal(
                origin,
                proposer_id,
                b"title".to_vec(),
                b"body".to_vec(),
                required_stake,
                b"text".to_vec(),
            ),
            Ok(())
        );

        // a discussion was created
        let thread_id = <crate::ThreadIdByProposalId<Test>>::get(1);
        assert_eq!(thread_id, 1);

        let proposal_id = 1;
        let proposal = ProposalsEngine::proposals(proposal_id);
        // check for correct proposal parameters
        assert_eq!(
            proposal.parameters,
            crate::proposal_types::parameters::text_proposal::<Test>()
        );
    });
}

#[test]
fn create_text_proposal_codex_call_fails_with_invalid_stake() {
    initial_test_ext().execute_with(|| {
        assert_eq!(
            ProposalCodex::create_text_proposal(
                RawOrigin::Signed(1).into(),
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                None,
                b"text".to_vec(),
            ),
            Err(Error::Other("EmptyStake"))
        );

        let invalid_stake = Some(<BalanceOf<Test>>::from(5000u32));

        assert_eq!(
            ProposalCodex::create_text_proposal(
                RawOrigin::Signed(1).into(),
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                invalid_stake,
                b"text".to_vec(),
            ),
            Err(Error::Other("StakeDiffersFromRequired"))
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
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                None,
                long_text,
            ),
            Err(Error::TextProposalSizeExceeded)
        );

        assert_eq!(
            ProposalCodex::create_text_proposal(
                RawOrigin::Signed(1).into(),
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                None,
                Vec::new(),
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
            1,
            b"title".to_vec(),
            b"body".to_vec(),
            None,
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
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                None,
                long_wasm,
            ),
            Err(Error::RuntimeProposalSizeExceeded)
        );

        assert_eq!(
            ProposalCodex::create_runtime_upgrade_proposal(
                RawOrigin::Signed(1).into(),
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                None,
                Vec::new(),
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
            1,
            b"title".to_vec(),
            b"body".to_vec(),
            None,
            b"wasm".to_vec(),
        )
        .is_err());
    });
}

#[test]
fn create_runtime_upgrade_proposal_codex_call_fails_with_invalid_stake() {
    initial_test_ext().execute_with(|| {
        let proposer_id = 1;
        assert_eq!(
            ProposalCodex::create_runtime_upgrade_proposal(
                RawOrigin::Signed(1).into(),
                proposer_id,
                b"title".to_vec(),
                b"body".to_vec(),
                None,
                b"wasm".to_vec(),
            ),
            Err(Error::Other("EmptyStake"))
        );

        let invalid_stake = Some(<BalanceOf<Test>>::from(500u32));

        assert_eq!(
            ProposalCodex::create_runtime_upgrade_proposal(
                RawOrigin::Signed(1).into(),
                proposer_id,
                b"title".to_vec(),
                b"body".to_vec(),
                invalid_stake,
                b"wasm".to_vec(),
            ),
            Err(Error::Other("StakeDiffersFromRequired"))
        );
    });
}

#[test]
fn create_runtime_upgrade_proposal_codex_call_succeeds() {
    initial_test_ext().execute_with(|| {
        let account_id = 1;
        let proposer_id = 1;
        let origin = RawOrigin::Signed(account_id).into();

        let required_stake = Some(<BalanceOf<Test>>::from(50000u32));
        let _imbalance = <Test as stake::Trait>::Currency::deposit_creating(&account_id, 50000);

        assert_eq!(
            ProposalCodex::create_runtime_upgrade_proposal(
                origin,
                proposer_id,
                b"title".to_vec(),
                b"body".to_vec(),
                required_stake,
                b"wasm".to_vec(),
            ),
            Ok(())
        );

        // a discussion was created
        let thread_id = <crate::ThreadIdByProposalId<Test>>::get(1);
        assert_eq!(thread_id, 1);

        let proposal_id = 1;
        let proposal = ProposalsEngine::proposals(proposal_id);
        // check for correct proposal parameters
        assert_eq!(
            proposal.parameters,
            crate::proposal_types::parameters::upgrade_runtime::<Test>()
        );
    });
}

#[test]
fn create_set_election_parameters_call_fails_with_insufficient_rights() {
    initial_test_ext().execute_with(|| {
        let origin = RawOrigin::None.into();

        assert!(ProposalCodex::create_set_election_parameters_proposal(
            origin,
            1,
            b"title".to_vec(),
            b"body".to_vec(),
            None,
            ElectionParameters::default(),
        )
        .is_err());
    });
}

#[test]
fn create_set_election_parameters_call_fails_with_incorrect_parameters() {
    initial_test_ext().execute_with(|| {
        let account_id = 1;
        let origin = RawOrigin::Signed(account_id).into();

        let required_stake = Some(<BalanceOf<Test>>::from(500u32));
        let _imbalance = <Test as stake::Trait>::Currency::deposit_creating(&account_id, 50000);

        assert_eq!(
            ProposalCodex::create_set_election_parameters_proposal(
                origin,
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                required_stake,
                ElectionParameters::default(),
            ),
            Err(Error::Other("PeriodCannotBeZero"))
        );
    });
}

#[test]
fn create_set_election_parameters_call_fails_with_invalid_stake() {
    initial_test_ext().execute_with(|| {
        let origin = RawOrigin::Signed(1).into();

        let election_parameters = ElectionParameters {
            announcing_period: 1,
            voting_period: 2,
            revealing_period: 3,
            council_size: 4,
            candidacy_limit: 5,
            min_voting_stake: 6,
            min_council_stake: 7,
            new_term_duration: 8,
        };

        assert_eq!(
            ProposalCodex::create_set_election_parameters_proposal(
                origin,
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                None,
                election_parameters.clone(),
            ),
            Err(Error::Other("EmptyStake"))
        );

        let invalid_stake = Some(<BalanceOf<Test>>::from(5000u32));

        assert_eq!(
            ProposalCodex::create_set_election_parameters_proposal(
                RawOrigin::Signed(1).into(),
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                invalid_stake,
                election_parameters,
            ),
            Err(Error::Other("StakeDiffersFromRequired"))
        );
    });
}

#[test]
fn create_set_election_parameters_call_succeeds() {
    initial_test_ext().execute_with(|| {
        let account_id = 1;
        let origin = RawOrigin::Signed(account_id).into();

        let required_stake = Some(<BalanceOf<Test>>::from(500u32));
        let _imbalance = <Test as stake::Trait>::Currency::deposit_creating(&account_id, 50000);

        let election_parameters = ElectionParameters {
            announcing_period: 1,
            voting_period: 2,
            revealing_period: 3,
            council_size: 4,
            candidacy_limit: 5,
            min_voting_stake: 6,
            min_council_stake: 7,
            new_term_duration: 8,
        };

        assert!(ProposalCodex::create_set_election_parameters_proposal(
            origin,
            1,
            b"title".to_vec(),
            b"body".to_vec(),
            required_stake,
            election_parameters,
        )
        .is_ok());

        // a discussion was created
        let thread_id = <crate::ThreadIdByProposalId<Test>>::get(1);
        assert_eq!(thread_id, 1);

        let proposal_id = 1;
        let proposal = ProposalsEngine::proposals(proposal_id);
        // check for correct proposal parameters
        assert_eq!(
            proposal.parameters,
            crate::proposal_types::parameters::set_election_parameters_proposal::<Test>()
        );
    });
}
