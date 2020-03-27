//! Proposals integration tests - with stake, membership, governance modules.

#![cfg(test)]

use crate::{ProposalCancellationFee, Runtime};
use codec::Encode;
use membership::members;
use proposals_engine::{
    ActiveStake, BalanceOf, Error, FinalizationData, Proposal, ProposalDecisionStatus,
    ProposalParameters, ProposalStatus, VotingResults,
};
use sr_primitives::traits::DispatchResult;
use sr_primitives::AccountId32;
use srml_support::traits::Currency;
use system::RawOrigin;

fn initial_test_ext() -> runtime_io::TestExternalities {
    let t = system::GenesisConfig::default()
        .build_storage::<Runtime>()
        .unwrap();

    t.into()
}

type Membership = membership::members::Module<Runtime>;
type ProposalsEngine = proposals_engine::Module<Runtime>;

#[derive(Clone)]
struct DummyProposalFixture {
    parameters: ProposalParameters<u32, u128>,
    account_id: AccountId32,
    proposer_id: u64,
    proposal_code: Vec<u8>,
    title: Vec<u8>,
    description: Vec<u8>,
    stake_balance: Option<BalanceOf<Runtime>>,
}

impl Default for DummyProposalFixture {
    fn default() -> Self {
        let title = b"title".to_vec();
        let description = b"description".to_vec();
        let dummy_proposal = proposals_codex::Call::<Runtime>::execute_text_proposal(
            title.clone(),
            description.clone(),
            b"text".to_vec(),
        );

        DummyProposalFixture {
            parameters: ProposalParameters {
                voting_period: 3,
                approval_quorum_percentage: 60,
                approval_threshold_percentage: 60,
                slashing_quorum_percentage: 60,
                slashing_threshold_percentage: 60,
                grace_period: 0,
                required_stake: None,
            },
            account_id: <Runtime as system::Trait>::AccountId::default(),
            proposer_id: 0,
            proposal_code: dummy_proposal.encode(),
            title,
            description,
            stake_balance: None,
        }
    }
}

impl DummyProposalFixture {
    fn with_parameters(self, parameters: ProposalParameters<u32, u128>) -> Self {
        DummyProposalFixture { parameters, ..self }
    }

    fn with_account_id(self, account_id: AccountId32) -> Self {
        DummyProposalFixture { account_id, ..self }
    }

    fn with_stake(self, stake_balance: BalanceOf<Runtime>) -> Self {
        DummyProposalFixture {
            stake_balance: Some(stake_balance),
            ..self
        }
    }

    fn with_proposer(self, proposer_id: u64) -> Self {
        DummyProposalFixture {
            proposer_id,
            ..self
        }
    }

    fn create_proposal_and_assert(self, result: Result<u32, Error>) -> Option<u32> {
        let proposal_id_result = ProposalsEngine::create_proposal(
            self.account_id,
            self.proposer_id,
            self.parameters,
            self.title,
            self.description,
            self.stake_balance,
            self.proposal_code,
        );
        assert_eq!(proposal_id_result, result);

        proposal_id_result.ok()
    }
}

struct CancelProposalFixture {
    origin: RawOrigin<AccountId32>,
    proposal_id: u32,
    proposer_id: u64,
}

impl CancelProposalFixture {
    fn new(proposal_id: u32) -> Self {
        let account_id = <Runtime as system::Trait>::AccountId::default();
        CancelProposalFixture {
            proposal_id,
            origin: RawOrigin::Signed(account_id),
            proposer_id: 0,
        }
    }

    fn with_proposer(self, proposer_id: u64) -> Self {
        CancelProposalFixture {
            proposer_id,
            ..self
        }
    }

    fn cancel_and_assert(self, expected_result: DispatchResult<Error>) {
        assert_eq!(
            ProposalsEngine::cancel_proposal(
                self.origin.into(),
                self.proposer_id,
                self.proposal_id
            ),
            expected_result
        );
    }
}

/// Main purpose of this integration test: check balance of the member on proposal finalization (cancellation)
/// It tests StakingEventsHandler integration. Also, membership module is tested during the proposal creation (ActorOriginValidator).
#[test]
fn proposal_cancellation_with_slashes_with_balance_checks_succeeds() {
    initial_test_ext().execute_with(|| {
        let account_id = <Runtime as system::Trait>::AccountId::default();

        Membership::set_screening_authority(RawOrigin::Root.into(), account_id.clone()).unwrap();

        Membership::add_screened_member(
            RawOrigin::Signed(account_id.clone()).into(),
            account_id.clone(),
            members::UserInfo {
                handle: Some(b"handle".to_vec()),
                avatar_uri: None,
                about: None,
            },
        )
        .unwrap();
        let member_id = 0; // newly created member_id

        let stake_amount = 200u128;
        let parameters = ProposalParameters {
            voting_period: 3,
            approval_quorum_percentage: 50,
            approval_threshold_percentage: 60,
            slashing_quorum_percentage: 60,
            slashing_threshold_percentage: 60,
            grace_period: 5,
            required_stake: Some(stake_amount),
        };
        let dummy_proposal = DummyProposalFixture::default()
            .with_parameters(parameters)
            .with_account_id(account_id.clone())
            .with_stake(stake_amount)
            .with_proposer(member_id);

        let account_balance = 500;
        let _imbalance =
            <Runtime as stake::Trait>::Currency::deposit_creating(&account_id, account_balance);

        assert_eq!(
            <Runtime as stake::Trait>::Currency::total_balance(&account_id),
            account_balance
        );

        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();
        assert_eq!(
            <Runtime as stake::Trait>::Currency::total_balance(&account_id),
            account_balance - stake_amount
        );

        let mut proposal = ProposalsEngine::proposals(proposal_id);

        let mut expected_proposal = Proposal {
            parameters,
            proposer_id: member_id,
            created_at: 1,
            status: ProposalStatus::Active(Some(ActiveStake {
                stake_id: 0,
                source_account_id: account_id.clone(),
            })),
            title: b"title".to_vec(),
            description: b"description".to_vec(),
            voting_results: VotingResults::default(),
        };

        assert_eq!(proposal, expected_proposal);

        let cancel_proposal_fixture =
            CancelProposalFixture::new(proposal_id).with_proposer(member_id);

        cancel_proposal_fixture.cancel_and_assert(Ok(()));

        proposal = ProposalsEngine::proposals(proposal_id);

        expected_proposal.status = ProposalStatus::Finalized(FinalizationData {
            proposal_status: ProposalDecisionStatus::Canceled,
            finalized_at: 1,
            encoded_unstaking_error_due_to_broken_runtime: None,
            stake_data_after_unstaking_error: None,
        });

        assert_eq!(proposal, expected_proposal);

        let cancellation_fee = ProposalCancellationFee::get() as u128;
        assert_eq!(
            <Runtime as stake::Trait>::Currency::total_balance(&account_id),
            account_balance - cancellation_fee
        );
    });
}
