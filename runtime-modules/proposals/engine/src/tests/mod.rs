pub(crate) mod mock;

use crate::types::ProposalStatusResolution;
use crate::*;
use mock::*;

use codec::Encode;
use frame_support::dispatch::DispatchResult;
use frame_support::traits::{
    Currency, LockableCurrency, OnFinalize, OnInitialize, WithdrawReasons,
};
use frame_support::{StorageDoubleMap, StorageMap, StorageValue};
use frame_system::RawOrigin;
use frame_system::{EventRecord, Phase};

pub(crate) fn increase_total_balance_issuance_using_account_id(account_id: u64, balance: u64) {
    let initial_balance = Balances::total_issuance();
    {
        let _ = Balances::deposit_creating(&account_id, balance);
    }
    assert_eq!(Balances::total_issuance(), initial_balance + balance);
}

struct ProposalParametersFixture {
    parameters: ProposalParameters<u64, u64>,
}

impl ProposalParametersFixture {
    fn with_required_stake(&self, required_stake: BalanceOf<Test>) -> Self {
        ProposalParametersFixture {
            parameters: ProposalParameters {
                required_stake: Some(required_stake),
                ..self.parameters
            },
        }
    }
    fn with_grace_period(&self, grace_period: u64) -> Self {
        ProposalParametersFixture {
            parameters: ProposalParameters {
                grace_period,
                ..self.parameters
            },
        }
    }
    fn with_constitutionality(&self, constitutionality: u32) -> Self {
        ProposalParametersFixture {
            parameters: ProposalParameters {
                constitutionality,
                ..self.parameters
            },
        }
    }

    fn params(&self) -> ProposalParameters<u64, u64> {
        self.parameters.clone()
    }
}

impl Default for ProposalParametersFixture {
    fn default() -> Self {
        ProposalParametersFixture {
            parameters: ProposalParameters {
                voting_period: 3,
                approval_quorum_percentage: 60,
                approval_threshold_percentage: 60,
                slashing_quorum_percentage: 60,
                slashing_threshold_percentage: 60,
                grace_period: 0,
                required_stake: None,
                constitutionality: 1,
            },
        }
    }
}

#[derive(Clone)]
struct DummyProposalFixture {
    parameters: ProposalParameters<u64, u64>,
    account_id: u64,
    proposer_id: u64,
    proposal_code: Vec<u8>,
    title: Vec<u8>,
    description: Vec<u8>,
    staking_account_id: Option<u64>,
    exact_execution_block: Option<u64>,
}

impl Default for DummyProposalFixture {
    fn default() -> Self {
        let title = b"title".to_vec();
        let description = b"description".to_vec();
        let dummy_proposal =
            mock::proposals::Call::<Test>::dummy_proposal(title.clone(), description.clone());

        DummyProposalFixture {
            parameters: ProposalParameters {
                voting_period: 3,
                approval_quorum_percentage: 60,
                approval_threshold_percentage: 60,
                slashing_quorum_percentage: 60,
                slashing_threshold_percentage: 60,
                grace_period: 0,
                required_stake: None,
                constitutionality: 1,
            },
            account_id: 1,
            proposer_id: 1,
            proposal_code: dummy_proposal.encode(),
            title,
            description,
            staking_account_id: None,
            exact_execution_block: None,
        }
    }
}

impl DummyProposalFixture {
    fn with_title_and_body(self, title: Vec<u8>, description: Vec<u8>) -> Self {
        DummyProposalFixture {
            title,
            description,
            ..self
        }
    }

    fn with_parameters(self, parameters: ProposalParameters<u64, u64>) -> Self {
        DummyProposalFixture { parameters, ..self }
    }

    fn with_account_id(self, account_id: u64) -> Self {
        DummyProposalFixture { account_id, ..self }
    }

    fn with_exact_execution_block(self, exact_execution_block: Option<u64>) -> Self {
        DummyProposalFixture {
            exact_execution_block,
            ..self
        }
    }

    fn with_stake(self, account_id: u64) -> Self {
        DummyProposalFixture {
            staking_account_id: Some(account_id),
            ..self
        }
    }

    fn with_proposal_code(self, proposal_code: Vec<u8>) -> Self {
        DummyProposalFixture {
            proposal_code,
            ..self
        }
    }

    fn create_proposal_and_assert(self, result: Result<u32, DispatchError>) -> Option<u32> {
        let proposal_id_result = ProposalsEngine::create_proposal(ProposalCreationParameters {
            account_id: self.account_id,
            proposer_id: self.proposer_id,
            proposal_parameters: self.parameters,
            title: self.title,
            description: self.description,
            staking_account_id: self.staking_account_id,
            encoded_dispatchable_call_code: self.proposal_code,
            exact_execution_block: self.exact_execution_block,
        });
        assert_eq!(proposal_id_result, result);

        proposal_id_result.ok()
    }
}

struct CancelProposalFixture {
    origin: RawOrigin<u64>,
    proposal_id: u32,
    proposer_id: u64,
}

impl CancelProposalFixture {
    fn new(proposal_id: u32) -> Self {
        CancelProposalFixture {
            proposal_id,
            origin: RawOrigin::Signed(1),
            proposer_id: 1,
        }
    }

    fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        CancelProposalFixture { origin, ..self }
    }

    fn with_proposer(self, proposer_id: u64) -> Self {
        CancelProposalFixture {
            proposer_id,
            ..self
        }
    }

    fn cancel_and_assert(self, expected_result: DispatchResult) {
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
struct VetoProposalFixture {
    origin: RawOrigin<u64>,
    proposal_id: u32,
}

impl VetoProposalFixture {
    fn new(proposal_id: u32) -> Self {
        VetoProposalFixture {
            proposal_id,
            origin: RawOrigin::Root,
        }
    }

    fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        VetoProposalFixture { origin, ..self }
    }

    fn veto_and_assert(self, expected_result: DispatchResult) {
        assert_eq!(
            ProposalsEngine::veto_proposal(self.origin.into(), self.proposal_id,),
            expected_result
        );
    }
}

struct VoteGenerator {
    proposal_id: u32,
    current_account_id: u64,
    current_voter_id: u64,
    pub auto_increment_voter_id: bool,
}

impl VoteGenerator {
    fn new(proposal_id: u32) -> Self {
        VoteGenerator {
            proposal_id,
            current_voter_id: 0,
            current_account_id: 0,
            auto_increment_voter_id: true,
        }
    }
    fn vote_and_assert_ok(&mut self, vote_kind: VoteKind) {
        self.vote_and_assert(vote_kind, Ok(()));
    }

    fn vote_and_assert(&mut self, vote_kind: VoteKind, expected_result: DispatchResult) {
        assert_eq!(self.vote(vote_kind.clone()), expected_result);
    }

    fn vote(&mut self, vote_kind: VoteKind) -> DispatchResult {
        if self.auto_increment_voter_id {
            self.current_account_id += 1;
            self.current_voter_id += 1;
        }

        ProposalsEngine::vote(
            frame_system::RawOrigin::Signed(self.current_account_id).into(),
            self.current_voter_id,
            self.proposal_id,
            vote_kind,
            Vec::new(),
        )
    }
}

struct EventFixture;
impl EventFixture {
    fn assert_events(expected_raw_events: Vec<RawEvent<u32, u64, u64>>) {
        let expected_events = expected_raw_events
            .iter()
            .map(|ev| EventRecord {
                phase: Phase::Initialization,
                event: TestEvent::engine(ev.clone()),
                topics: vec![],
            })
            .collect::<Vec<EventRecord<_, _>>>();

        assert_eq!(System::events(), expected_events);
    }

    fn assert_global_events(expected_raw_events: Vec<TestEvent>) {
        let expected_events = expected_raw_events
            .iter()
            .map(|ev| EventRecord {
                phase: Phase::Initialization,
                event: ev.clone(),
                topics: vec![],
            })
            .collect::<Vec<EventRecord<_, _>>>();

        assert_eq!(System::events(), expected_events);
    }

    pub fn assert_last_crate_event(expected_raw_event: RawEvent<u32, u64, u64>) {
        let converted_event = TestEvent::engine(expected_raw_event);

        Self::assert_last_global_event(converted_event)
    }

    pub fn assert_last_global_event(expected_event: TestEvent) {
        let expected_event = EventRecord {
            phase: Phase::Initialization,
            event: expected_event,
            topics: vec![],
        };

        assert_eq!(System::events().pop().unwrap(), expected_event);
    }
}

// Recommendation from Parity on testing on_finalize
// https://substrate.dev/docs/en/next/development/module/tests
fn run_to_block(n: u64) {
    while System::block_number() < n {
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        <ProposalsEngine as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
        <ProposalsEngine as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}

fn run_to_block_and_finalize(n: u64) {
    run_to_block(n);
    <System as OnFinalize<u64>>::on_finalize(n);
    <ProposalsEngine as OnFinalize<u64>>::on_finalize(n);
}

#[test]
fn create_dummy_proposal_succeeds() {
    initial_test_ext().execute_with(|| {
        let dummy_proposal = DummyProposalFixture::default();

        dummy_proposal.create_proposal_and_assert(Ok(1));
    });
}

#[test]
fn create_dummy_proposal_fails_with_incorrect_staking_account() {
    initial_test_ext().execute_with(|| {
        let parameters_fixture = ProposalParametersFixture::default().with_required_stake(100);
        let dummy_proposal = DummyProposalFixture::default()
            .with_stake(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER)
            .with_parameters(parameters_fixture.params());

        dummy_proposal
            .create_proposal_and_assert(Err(Error::<Test>::InvalidStakingAccountForMember.into()));
    });
}

#[test]
fn vote_succeeds() {
    initial_test_ext().execute_with(|| {
        let dummy_proposal = DummyProposalFixture::default();
        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
    });
}

#[test]
fn vote_fails_with_insufficient_rights() {
    initial_test_ext().execute_with(|| {
        assert_eq!(
            ProposalsEngine::vote(
                frame_system::RawOrigin::None.into(),
                1,
                1,
                VoteKind::Approve,
                Vec::new()
            ),
            Err(DispatchError::BadOrigin)
        );
    });
}

#[test]
fn proposal_execution_succeeds() {
    initial_test_ext().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let parameters_fixture = ProposalParametersFixture::default();
        let dummy_proposal =
            DummyProposalFixture::default().with_parameters(parameters_fixture.params());
        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 1);

        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);

        run_to_block(2);

        EventFixture::assert_events(vec![
            RawEvent::Voted(1, proposal_id, VoteKind::Approve, Vec::new()),
            RawEvent::Voted(2, proposal_id, VoteKind::Approve, Vec::new()),
            RawEvent::Voted(3, proposal_id, VoteKind::Approve, Vec::new()),
            RawEvent::Voted(4, proposal_id, VoteKind::Approve, Vec::new()),
            RawEvent::ProposalDecisionMade(
                proposal_id,
                ProposalDecision::Approved(ApprovedProposalDecision::PendingExecution),
            ),
            RawEvent::ProposalStatusUpdated(
                proposal_id,
                ProposalStatus::PendingExecution(starting_block + 1),
            ),
            RawEvent::ProposalExecuted(proposal_id, ExecutionStatus::Executed),
        ]);

        assert!(!<crate::Proposals<Test>>::contains_key(proposal_id));
        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 0);
    });
}

#[test]
fn proposal_execution_failed() {
    initial_test_ext().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let parameters_fixture = ProposalParametersFixture::default();

        let faulty_proposal = mock::proposals::Call::<Test>::faulty_proposal(
            b"title".to_vec(),
            b"description".to_vec(),
        );

        let dummy_proposal = DummyProposalFixture::default()
            .with_parameters(parameters_fixture.params())
            .with_proposal_code(faulty_proposal.encode());

        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);

        run_to_block(2);

        assert!(!<crate::Proposals<Test>>::contains_key(proposal_id));

        EventFixture::assert_events(vec![
            RawEvent::Voted(1, proposal_id, VoteKind::Approve, Vec::new()),
            RawEvent::Voted(2, proposal_id, VoteKind::Approve, Vec::new()),
            RawEvent::Voted(3, proposal_id, VoteKind::Approve, Vec::new()),
            RawEvent::Voted(4, proposal_id, VoteKind::Approve, Vec::new()),
            RawEvent::ProposalDecisionMade(
                proposal_id,
                ProposalDecision::Approved(ApprovedProposalDecision::PendingExecution),
            ),
            RawEvent::ProposalStatusUpdated(
                proposal_id,
                ProposalStatus::PendingExecution(starting_block + 1),
            ),
            RawEvent::ProposalExecuted(
                proposal_id,
                ExecutionStatus::failed_execution("ExecutionFailed"),
            ),
        ]);
    });
}

#[test]
fn voting_results_calculation_succeeds() {
    initial_test_ext().execute_with(|| {
        // to enable events
        let starting_block = 1;
        run_to_block(starting_block);

        let parameters = ProposalParameters {
            voting_period: 3,
            approval_quorum_percentage: 50,
            approval_threshold_percentage: 50,
            slashing_quorum_percentage: 60,
            slashing_threshold_percentage: 60,
            grace_period: 0,
            required_stake: None,
            constitutionality: 1,
        };
        let dummy_proposal = DummyProposalFixture::default().with_parameters(parameters);
        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Reject);
        vote_generator.vote_and_assert_ok(VoteKind::Abstain);

        let block_number = 3;
        run_to_block(block_number);

        EventFixture::assert_events(vec![
            RawEvent::Voted(1, proposal_id, VoteKind::Approve, Vec::new()),
            RawEvent::Voted(2, proposal_id, VoteKind::Approve, Vec::new()),
            RawEvent::Voted(3, proposal_id, VoteKind::Reject, Vec::new()),
            RawEvent::Voted(4, proposal_id, VoteKind::Abstain, Vec::new()),
            RawEvent::ProposalDecisionMade(
                proposal_id,
                ProposalDecision::Approved(ApprovedProposalDecision::PendingExecution),
            ),
            RawEvent::ProposalStatusUpdated(
                proposal_id,
                ProposalStatus::PendingExecution(starting_block + 1),
            ),
            RawEvent::ProposalExecuted(proposal_id, ExecutionStatus::Executed),
        ]);

        assert!(!<crate::Proposals<Test>>::contains_key(proposal_id));
    });
}

#[test]
fn rejected_voting_results_and_remove_proposal_id_from_active_succeeds() {
    initial_test_ext().execute_with(|| {
        // to enable events
        let starting_block = 1;
        run_to_block_and_finalize(starting_block);

        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 0);

        let dummy_proposal = DummyProposalFixture::default();
        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Reject);
        vote_generator.vote_and_assert_ok(VoteKind::Reject);
        vote_generator.vote_and_assert_ok(VoteKind::Abstain);
        vote_generator.vote_and_assert_ok(VoteKind::Abstain);

        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 1);

        run_to_block_and_finalize(3);

        EventFixture::assert_last_crate_event(RawEvent::ProposalDecisionMade(
            proposal_id,
            ProposalDecision::Rejected,
        ));

        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 0);
    });
}

#[test]
fn create_proposal_fails_with_invalid_body_or_title() {
    initial_test_ext().execute_with(|| {
        let mut dummy_proposal =
            DummyProposalFixture::default().with_title_and_body(Vec::new(), b"body".to_vec());
        dummy_proposal.create_proposal_and_assert(Err(Error::<Test>::EmptyTitleProvided.into()));

        dummy_proposal =
            DummyProposalFixture::default().with_title_and_body(b"title".to_vec(), Vec::new());
        dummy_proposal
            .create_proposal_and_assert(Err(Error::<Test>::EmptyDescriptionProvided.into()));

        let too_long_title = vec![0; 200];
        dummy_proposal =
            DummyProposalFixture::default().with_title_and_body(too_long_title, b"body".to_vec());
        dummy_proposal.create_proposal_and_assert(Err(Error::<Test>::TitleIsTooLong.into()));

        let too_long_body = vec![0; 11000];
        dummy_proposal =
            DummyProposalFixture::default().with_title_and_body(b"title".to_vec(), too_long_body);
        dummy_proposal.create_proposal_and_assert(Err(Error::<Test>::DescriptionIsTooLong.into()));
    });
}

#[test]
fn vote_fails_with_not_active_proposal() {
    initial_test_ext().execute_with(|| {
        let parameters_fixture = ProposalParametersFixture::default().with_grace_period(30);
        let dummy_proposal =
            DummyProposalFixture::default().with_parameters(parameters_fixture.params());

        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);

        run_to_block_and_finalize(2);

        let mut vote_generator_to_fail = VoteGenerator::new(proposal_id);
        vote_generator_to_fail.vote_and_assert(
            VoteKind::Approve,
            Err(Error::<Test>::ProposalFinalized.into()),
        );
    });
}

#[test]
fn vote_fails_with_absent_proposal() {
    initial_test_ext().execute_with(|| {
        let mut vote_generator = VoteGenerator::new(2);
        vote_generator.vote_and_assert(
            VoteKind::Approve,
            Err(Error::<Test>::ProposalNotFound.into()),
        );
    });
}

#[test]
fn vote_fails_on_double_voting() {
    initial_test_ext().execute_with(|| {
        let dummy_proposal = DummyProposalFixture::default();
        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.auto_increment_voter_id = false;

        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert(VoteKind::Approve, Err(Error::<Test>::AlreadyVoted.into()));
    });
}

#[test]
fn cancel_proposal_succeeds() {
    initial_test_ext().execute_with(|| {
        let starting_block = 1;
        run_to_block_and_finalize(starting_block);

        let parameters_fixture = ProposalParametersFixture::default();
        let dummy_proposal =
            DummyProposalFixture::default().with_parameters(parameters_fixture.params());
        let proposal_id = dummy_proposal
            .clone()
            .create_proposal_and_assert(Ok(1))
            .unwrap();

        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 1);

        let cancel_proposal = CancelProposalFixture::new(proposal_id);
        cancel_proposal.cancel_and_assert(Ok(()));

        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 0);

        assert!(!<crate::Proposals<Test>>::contains_key(proposal_id));

        EventFixture::assert_last_crate_event(RawEvent::ProposalCancelled(
            dummy_proposal.account_id,
            proposal_id,
        ));
    });
}

#[test]
fn cancel_proposal_fails_with_not_active_proposal() {
    initial_test_ext().execute_with(|| {
        let parameters_fixture = ProposalParametersFixture::default().with_grace_period(30);
        let dummy_proposal =
            DummyProposalFixture::default().with_parameters(parameters_fixture.params());

        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);

        run_to_block_and_finalize(6);

        let cancel_proposal = CancelProposalFixture::new(proposal_id);
        cancel_proposal.cancel_and_assert(Err(Error::<Test>::ProposalFinalized.into()));
    });
}

#[test]
fn cancel_proposal_fails_with_some_votes() {
    initial_test_ext().execute_with(|| {
        let parameters_fixture = ProposalParametersFixture::default().with_grace_period(30);
        let dummy_proposal =
            DummyProposalFixture::default().with_parameters(parameters_fixture.params());

        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Reject);

        let cancel_proposal = CancelProposalFixture::new(proposal_id);
        cancel_proposal.cancel_and_assert(Err(Error::<Test>::ProposalHasVotes.into()));
    });
}

#[test]
fn cancel_proposal_fails_with_not_existing_proposal() {
    initial_test_ext().execute_with(|| {
        let cancel_proposal = CancelProposalFixture::new(2);
        cancel_proposal.cancel_and_assert(Err(Error::<Test>::ProposalNotFound.into()));
    });
}

#[test]
fn cancel_proposal_fails_with_insufficient_rights() {
    initial_test_ext().execute_with(|| {
        let dummy_proposal = DummyProposalFixture::default();
        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        let cancel_proposal = CancelProposalFixture::new(proposal_id)
            .with_origin(RawOrigin::Signed(2))
            .with_proposer(2);
        cancel_proposal.cancel_and_assert(Err(Error::<Test>::NotAuthor.into()));
    });
}

#[test]
fn veto_proposal_succeeds_during_voting_period() {
    initial_test_ext().execute_with(|| {
        let starting_block = 1;
        run_to_block_and_finalize(starting_block);

        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 0);

        let parameters_fixture = ProposalParametersFixture::default();
        let dummy_proposal =
            DummyProposalFixture::default().with_parameters(parameters_fixture.params());
        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 1);

        assert!(matches!(
            <Proposals<Test>>::get(proposal_id).status,
            ProposalStatus::Active { .. }
        ));

        let veto_proposal = VetoProposalFixture::new(proposal_id);
        veto_proposal.veto_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::ProposalDecisionMade(
            proposal_id,
            ProposalDecision::Vetoed,
        ));

        assert!(!<crate::Proposals<Test>>::contains_key(proposal_id));
        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 0);
    });
}

#[test]
fn veto_proposal_succeeds_during_grace_period() {
    initial_test_ext().execute_with(|| {
        let starting_block = 1;
        run_to_block_and_finalize(starting_block);

        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 0);

        let parameters_fixture = ProposalParametersFixture::default().with_grace_period(10);
        let dummy_proposal =
            DummyProposalFixture::default().with_parameters(parameters_fixture.params());
        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 1);

        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);

        run_to_block_and_finalize(6);

        assert!(matches!(
            <Proposals<Test>>::get(proposal_id).status,
            ProposalStatus::PendingExecution { .. }
        ));

        let veto_proposal = VetoProposalFixture::new(proposal_id);
        veto_proposal.veto_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::ProposalDecisionMade(
            proposal_id,
            ProposalDecision::Vetoed,
        ));

        assert!(!<crate::Proposals<Test>>::contains_key(proposal_id));
        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 0);
    });
}

#[test]
fn veto_proposal_succeeds_during_pending_constitutionality() {
    initial_test_ext().execute_with(|| {
        let starting_block = 1;
        run_to_block_and_finalize(starting_block);

        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 0);

        let parameters_fixture = ProposalParametersFixture::default().with_constitutionality(10);
        let dummy_proposal =
            DummyProposalFixture::default().with_parameters(parameters_fixture.params());
        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 1);

        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);

        run_to_block_and_finalize(6);

        assert!(matches!(
            <Proposals<Test>>::get(proposal_id).status,
            ProposalStatus::PendingConstitutionality { .. }
        ));

        let veto_proposal = VetoProposalFixture::new(proposal_id);
        veto_proposal.veto_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::ProposalDecisionMade(
            proposal_id,
            ProposalDecision::Vetoed,
        ));

        assert!(!<crate::Proposals<Test>>::contains_key(proposal_id));
        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 0);
    });
}

#[test]
fn veto_proposal_fails_with_not_existing_proposal() {
    initial_test_ext().execute_with(|| {
        let veto_proposal = VetoProposalFixture::new(2);
        veto_proposal.veto_and_assert(Err(Error::<Test>::ProposalNotFound.into()));
    });
}

#[test]
fn veto_proposal_fails_with_insufficient_rights() {
    initial_test_ext().execute_with(|| {
        let dummy_proposal = DummyProposalFixture::default();
        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        let veto_proposal = VetoProposalFixture::new(proposal_id).with_origin(RawOrigin::Signed(2));
        veto_proposal.veto_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn create_proposal() {
    initial_test_ext().execute_with(|| {
        // Events start only from 1 first block. No events on block zero.
        run_to_block_and_finalize(1);

        let dummy_proposal = DummyProposalFixture::default();
        dummy_proposal.create_proposal_and_assert(Ok(1));
    });
}

#[test]
fn veto_proposal_event_emitted() {
    initial_test_ext().execute_with(|| {
        // Events start only from 1 first block. No events on block zero.
        run_to_block_and_finalize(1);

        let dummy_proposal = DummyProposalFixture::default();
        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        let veto_proposal = VetoProposalFixture::new(proposal_id);
        veto_proposal.veto_and_assert(Ok(()));

        EventFixture::assert_events(vec![RawEvent::ProposalDecisionMade(
            proposal_id,
            ProposalDecision::Vetoed,
        )]);
    });
}

#[test]
fn cancel_proposal_event_emitted() {
    initial_test_ext().execute_with(|| {
        // Events start only from 1 first block. No events on block zero.
        run_to_block_and_finalize(1);

        let dummy_proposal = DummyProposalFixture::default();
        let proposal_id = dummy_proposal
            .clone()
            .create_proposal_and_assert(Ok(1))
            .unwrap();

        let cancel_proposal = CancelProposalFixture::new(proposal_id);
        cancel_proposal.cancel_and_assert(Ok(()));

        EventFixture::assert_events(vec![
            RawEvent::ProposalDecisionMade(proposal_id, ProposalDecision::Canceled),
            RawEvent::ProposalCancelled(dummy_proposal.account_id, proposal_id),
        ]);
    });
}

#[test]
fn vote_proposal_event_emitted() {
    initial_test_ext().execute_with(|| {
        // Events start only from 1 first block. No events on block zero.
        run_to_block_and_finalize(1);

        let dummy_proposal = DummyProposalFixture::default();
        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);

        EventFixture::assert_events(vec![RawEvent::Voted(1, 1, VoteKind::Approve, Vec::new())]);
    });
}

#[test]
fn create_proposal_and_expire_it() {
    initial_test_ext().execute_with(|| {
        let starting_block = 1;
        run_to_block_and_finalize(starting_block);

        let parameters_fixture = ProposalParametersFixture::default();
        let dummy_proposal =
            DummyProposalFixture::default().with_parameters(parameters_fixture.params());
        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        let expected_expriration_block =
            starting_block + parameters_fixture.parameters.voting_period;

        run_to_block_and_finalize(expected_expriration_block - 1);

        assert!(<crate::Proposals<Test>>::contains_key(proposal_id));

        run_to_block_and_finalize(expected_expriration_block);

        assert!(!<crate::Proposals<Test>>::contains_key(proposal_id));
        EventFixture::assert_events(vec![RawEvent::ProposalDecisionMade(
            proposal_id,
            ProposalDecision::Expired,
        )]);
    });
}

#[test]
fn proposal_execution_postponed_because_of_grace_period() {
    initial_test_ext().execute_with(|| {
        let parameters_fixture = ProposalParametersFixture::default().with_grace_period(3);
        let dummy_proposal =
            DummyProposalFixture::default().with_parameters(parameters_fixture.params());

        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);

        run_to_block(3);

        let proposal = <crate::Proposals<Test>>::get(proposal_id);

        assert_eq!(
            proposal,
            Proposal {
                parameters: parameters_fixture.params(),
                proposer_id: 1,
                activated_at: 0,
                status: ProposalStatus::approved(ApprovedProposalDecision::PendingExecution, 1),
                voting_results: VotingResults {
                    abstentions: 0,
                    approvals: 4,
                    rejections: 0,
                    slashes: 0,
                },
                exact_execution_block: None,
                nr_of_council_confirmations: 1,
                staking_account_id: None,
            }
        );
    });
}

#[test]
fn cancel_active_and_pending_execution_proposal_by_runtime() {
    initial_test_ext().execute_with(|| {
        // Events start only from 1 first block. No events on block zero.
        let starting_block = 1;
        run_to_block_and_finalize(starting_block);

        let parameters_fixture = ProposalParametersFixture::default().with_grace_period(3);

        // A proposal for pending execution check.
        let dummy_proposal =
            DummyProposalFixture::default().with_parameters(parameters_fixture.params());
        let pending_execution_proposal_id =
            dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        // A proposal for active status check.
        let dummy_proposal =
            DummyProposalFixture::default().with_parameters(parameters_fixture.params());
        let active_proposal_id = dummy_proposal.create_proposal_and_assert(Ok(2)).unwrap();

        let mut vote_generator = VoteGenerator::new(pending_execution_proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);

        run_to_block(3);

        let pending_execution_proposal =
            <crate::Proposals<Test>>::get(pending_execution_proposal_id);
        let active_proposal = <crate::Proposals<Test>>::get(active_proposal_id);

        // ensure proposal has pending execution status
        assert_eq!(
            pending_execution_proposal,
            Proposal {
                parameters: parameters_fixture.params(),
                proposer_id: 1,
                activated_at: starting_block,
                status: ProposalStatus::approved(
                    ApprovedProposalDecision::PendingExecution,
                    starting_block + 1
                ),
                voting_results: VotingResults {
                    abstentions: 0,
                    approvals: 4,
                    rejections: 0,
                    slashes: 0,
                },
                exact_execution_block: None,
                nr_of_council_confirmations: 1,
                staking_account_id: None,
            }
        );

        // ensure proposal has active status
        assert_eq!(
            active_proposal,
            Proposal {
                parameters: parameters_fixture.params(),
                proposer_id: 1,
                activated_at: starting_block,
                status: ProposalStatus::Active,
                voting_results: VotingResults {
                    abstentions: 0,
                    approvals: 0,
                    rejections: 0,
                    slashes: 0,
                },
                exact_execution_block: None,
                nr_of_council_confirmations: 0,
                staking_account_id: None,
            }
        );

        ProposalsEngine::cancel_active_and_pending_proposals();

        EventFixture::assert_events(vec![
            RawEvent::Voted(
                1,
                pending_execution_proposal_id,
                VoteKind::Approve,
                Vec::new(),
            ),
            RawEvent::Voted(
                2,
                pending_execution_proposal_id,
                VoteKind::Approve,
                Vec::new(),
            ),
            RawEvent::Voted(
                3,
                pending_execution_proposal_id,
                VoteKind::Approve,
                Vec::new(),
            ),
            RawEvent::Voted(
                4,
                pending_execution_proposal_id,
                VoteKind::Approve,
                Vec::new(),
            ),
            RawEvent::ProposalDecisionMade(
                pending_execution_proposal_id,
                ProposalDecision::Approved(ApprovedProposalDecision::PendingExecution),
            ),
            RawEvent::ProposalStatusUpdated(
                pending_execution_proposal_id,
                ProposalStatus::PendingExecution(starting_block + 1),
            ),
            RawEvent::ProposalDecisionMade(active_proposal_id, ProposalDecision::CanceledByRuntime),
            RawEvent::ProposalDecisionMade(
                pending_execution_proposal_id,
                ProposalDecision::CanceledByRuntime,
            ),
        ]);

        assert!(!<crate::Proposals<Test>>::contains_key(
            pending_execution_proposal_id
        ));
        assert!(!<crate::Proposals<Test>>::contains_key(active_proposal_id));
    });
}

#[test]
fn cancel_pending_constitutionality_proposal_by_runtime() {
    initial_test_ext().execute_with(|| {
        let starting_block = 1;
        run_to_block_and_finalize(starting_block);

        let parameters_fixture = ProposalParametersFixture::default().with_constitutionality(2);
        let dummy_proposal =
            DummyProposalFixture::default().with_parameters(parameters_fixture.params());
        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 1);

        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);

        run_to_block_and_finalize(2);

        let proposal = <crate::Proposals<Test>>::get(proposal_id);

        // ensure proposal has pending constitutionality status
        assert_eq!(
            proposal,
            Proposal {
                parameters: parameters_fixture.params(),
                proposer_id: 1,
                activated_at: starting_block,
                status: ProposalStatus::PendingConstitutionality,
                voting_results: VotingResults {
                    abstentions: 0,
                    approvals: 4,
                    rejections: 0,
                    slashes: 0,
                },
                exact_execution_block: None,
                nr_of_council_confirmations: 1,
                staking_account_id: None,
            }
        );

        ProposalsEngine::cancel_active_and_pending_proposals();

        EventFixture::assert_events(vec![
            RawEvent::Voted(1, proposal_id, VoteKind::Approve, Vec::new()),
            RawEvent::Voted(2, proposal_id, VoteKind::Approve, Vec::new()),
            RawEvent::Voted(3, proposal_id, VoteKind::Approve, Vec::new()),
            RawEvent::Voted(4, proposal_id, VoteKind::Approve, Vec::new()),
            RawEvent::ProposalDecisionMade(
                proposal_id,
                ProposalDecision::Approved(ApprovedProposalDecision::PendingConstitutionality),
            ),
            RawEvent::ProposalStatusUpdated(proposal_id, ProposalStatus::PendingConstitutionality),
            RawEvent::ProposalDecisionMade(proposal_id, ProposalDecision::CanceledByRuntime),
        ]);

        assert!(!<crate::Proposals<Test>>::contains_key(proposal_id));
    });
}

#[test]
fn proposal_execution_succeeds_after_the_grace_period() {
    initial_test_ext().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let parameters_fixture = ProposalParametersFixture::default().with_grace_period(2);
        let dummy_proposal =
            DummyProposalFixture::default().with_parameters(parameters_fixture.params());
        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);

        run_to_block(2);

        let proposal = <crate::Proposals<Test>>::get(proposal_id);

        let expected_proposal = Proposal {
            parameters: parameters_fixture.params(),
            proposer_id: 1,
            activated_at: starting_block,
            status: ProposalStatus::approved(
                ApprovedProposalDecision::PendingExecution,
                starting_block + 1,
            ),
            voting_results: VotingResults {
                abstentions: 0,
                approvals: 4,
                rejections: 0,
                slashes: 0,
            },
            exact_execution_block: None,
            nr_of_council_confirmations: 1,
            staking_account_id: None,
        };

        assert_eq!(proposal, expected_proposal);

        let finalization_block = 4;
        run_to_block(finalization_block);

        EventFixture::assert_last_crate_event(RawEvent::ProposalExecuted(
            proposal_id,
            ExecutionStatus::Executed,
        ));
    });
}

#[test]
fn create_proposal_fails_on_exceeding_max_active_proposals_count() {
    initial_test_ext().execute_with(|| {
        for idx in 1..101 {
            let dummy_proposal = DummyProposalFixture::default();
            dummy_proposal.create_proposal_and_assert(Ok(idx));
            // internal active proposal counter check
            assert_eq!(<ActiveProposalCount>::get(), idx);
        }

        let dummy_proposal = DummyProposalFixture::default();
        dummy_proposal
            .create_proposal_and_assert(Err(Error::<Test>::MaxActiveProposalNumberExceeded.into()));
        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 100);
    });
}

#[test]
fn create_dummy_proposal_succeeds_with_stake() {
    initial_test_ext().execute_with(|| {
        let account_id = 1;

        let required_stake = 200;
        let parameters_fixture =
            ProposalParametersFixture::default().with_required_stake(required_stake);

        let dummy_proposal = DummyProposalFixture::default()
            .with_parameters(parameters_fixture.params())
            .with_account_id(account_id)
            .with_stake(account_id);

        let _imbalance = Balances::deposit_creating(&account_id, 500);

        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        let proposal = <crate::Proposals<Test>>::get(proposal_id);

        assert_eq!(
            proposal,
            Proposal {
                parameters: parameters_fixture.params(),
                proposer_id: 1,
                activated_at: 0,
                voting_results: VotingResults::default(),
                exact_execution_block: None,
                nr_of_council_confirmations: 0,
                staking_account_id: Some(1),
                status: ProposalStatus::Active,
            }
        )
    });
}

#[test]
fn create_dummy_proposal_fail_with_stake_on_empty_account() {
    initial_test_ext().execute_with(|| {
        let account_id = 1;

        let required_stake = 200;
        let parameters_fixture =
            ProposalParametersFixture::default().with_required_stake(required_stake);
        let dummy_proposal = DummyProposalFixture::default()
            .with_parameters(parameters_fixture.params())
            .with_account_id(account_id)
            .with_stake(account_id);

        dummy_proposal
            .create_proposal_and_assert(Err(Error::<Test>::InsufficientBalanceForStake.into()));
    });
}

#[test]
fn create_proposal_fails_with_insufficient_stake_parameters() {
    initial_test_ext().execute_with(|| {
        let parameters_fixture = ProposalParametersFixture::default();

        let mut dummy_proposal = DummyProposalFixture::default()
            .with_parameters(parameters_fixture.params())
            .with_stake(1);

        dummy_proposal.create_proposal_and_assert(Err(Error::<Test>::StakeShouldBeEmpty.into()));

        let parameters_fixture_stake_300 = parameters_fixture.with_required_stake(300);
        dummy_proposal = DummyProposalFixture::default()
            .with_parameters(parameters_fixture_stake_300.params())
            .with_stake(1);

        dummy_proposal
            .create_proposal_and_assert(Err(Error::<Test>::InsufficientBalanceForStake.into()));
    });
}

#[test]
fn create_proposal_fails_with_empty_stake() {
    initial_test_ext().execute_with(|| {
        let parameters_fixture = ProposalParametersFixture::default().with_required_stake(300);
        let dummy_proposal =
            DummyProposalFixture::default().with_parameters(parameters_fixture.params());

        dummy_proposal.create_proposal_and_assert(Err(Error::<Test>::EmptyStake.into()));
    });
}

#[test]
fn create_proposal_fails_with_conflicting_stakes() {
    initial_test_ext().execute_with(|| {
        let staking_account_id = 1;

        let initial_balance = 100000;
        increase_total_balance_issuance_using_account_id(staking_account_id, initial_balance);
        Balances::set_lock(
            LockId::get(),
            &staking_account_id,
            100,
            WithdrawReasons::all(),
        );

        let parameters_fixture = ProposalParametersFixture::default().with_required_stake(300);
        let dummy_proposal = DummyProposalFixture::default()
            .with_parameters(parameters_fixture.params())
            .with_stake(staking_account_id);

        dummy_proposal.create_proposal_and_assert(Err(Error::<Test>::ConflictingStakes.into()));
    });
}

#[test]
fn finalize_expired_proposal_and_check_stake_removing_with_balance_checks_succeeds() {
    initial_test_ext().execute_with(|| {
        // to enable events
        let starting_block = 1;
        run_to_block_and_finalize(starting_block);

        let account_id = 1;

        let stake_amount = 200;
        let parameters = ProposalParameters {
            voting_period: 3,
            approval_quorum_percentage: 50,
            approval_threshold_percentage: 60,
            slashing_quorum_percentage: 60,
            slashing_threshold_percentage: 60,
            grace_period: 5,
            required_stake: Some(stake_amount),
            constitutionality: 1,
        };
        let dummy_proposal = DummyProposalFixture::default()
            .with_parameters(parameters)
            .with_account_id(account_id)
            .with_stake(1);

        let account_balance = 500;
        let _imbalance = Balances::deposit_creating(&account_id, account_balance);

        assert_eq!(Balances::usable_balance(&account_id), account_balance);

        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();
        assert_eq!(
            Balances::usable_balance(&account_id),
            account_balance - stake_amount
        );

        let proposal = <crate::Proposals<Test>>::get(proposal_id);

        let expected_proposal = Proposal {
            parameters,
            proposer_id: 1,
            activated_at: starting_block,
            status: ProposalStatus::Active,
            voting_results: VotingResults::default(),
            exact_execution_block: None,
            nr_of_council_confirmations: 0,
            staking_account_id: Some(1),
        };

        assert_eq!(proposal, expected_proposal);

        run_to_block_and_finalize(5);

        EventFixture::assert_last_crate_event(RawEvent::ProposalDecisionMade(
            proposal_id,
            ProposalDecision::Expired,
        ));

        let rejection_fee = RejectionFee::get();
        assert_eq!(
            Balances::usable_balance(&account_id),
            account_balance - rejection_fee
        );
    });
}

#[test]
fn proposal_cancellation_with_slashes_with_balance_checks_succeeds() {
    initial_test_ext().execute_with(|| {
        // to enable events
        let starting_block = 1;
        run_to_block_and_finalize(starting_block);

        let account_id = 1;

        let stake_amount = 200;
        let parameters = ProposalParameters {
            voting_period: 3,
            approval_quorum_percentage: 50,
            approval_threshold_percentage: 60,
            slashing_quorum_percentage: 60,
            slashing_threshold_percentage: 60,
            grace_period: 5,
            required_stake: Some(stake_amount),
            constitutionality: 1,
        };
        let dummy_proposal = DummyProposalFixture::default()
            .with_parameters(parameters)
            .with_account_id(account_id.clone())
            .with_stake(1);

        let account_balance = 500;
        let _imbalance = Balances::deposit_creating(&account_id, account_balance);

        assert_eq!(Balances::usable_balance(&account_id), account_balance);

        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();
        assert_eq!(
            Balances::usable_balance(&account_id),
            account_balance - stake_amount
        );

        let proposal = <crate::Proposals<Test>>::get(proposal_id);

        let expected_proposal = Proposal {
            parameters,
            proposer_id: 1,
            activated_at: starting_block,
            status: ProposalStatus::Active,
            voting_results: VotingResults::default(),
            exact_execution_block: None,
            nr_of_council_confirmations: 0,
            staking_account_id: Some(1),
        };

        assert_eq!(proposal, expected_proposal);

        let cancel_proposal_fixture = CancelProposalFixture::new(proposal_id);

        cancel_proposal_fixture.cancel_and_assert(Ok(()));

        run_to_block_and_finalize(3);

        EventFixture::assert_last_crate_event(RawEvent::ProposalCancelled(account_id, proposal_id));

        let cancellation_fee = CancellationFee::get();
        assert_eq!(
            Balances::total_balance(&account_id),
            account_balance - cancellation_fee
        );
    });
}

#[test]
fn proposal_slashing_succeeds() {
    initial_test_ext().execute_with(|| {
        // to enable events
        let starting_block = 1;
        run_to_block_and_finalize(starting_block);

        let account_id = 1;

        let initial_balance = 100000;
        increase_total_balance_issuance_using_account_id(account_id, initial_balance);

        let stake_amount = 200;
        let parameters = ProposalParameters {
            voting_period: 3,
            approval_quorum_percentage: 50,
            approval_threshold_percentage: 60,
            slashing_quorum_percentage: 60,
            slashing_threshold_percentage: 60,
            grace_period: 5,
            required_stake: Some(stake_amount),
            constitutionality: 1,
        };
        let dummy_proposal = DummyProposalFixture::default()
            .with_parameters(parameters)
            .with_account_id(account_id.clone())
            .with_stake(account_id);

        assert_eq!(Balances::total_balance(&account_id), initial_balance);

        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        assert_eq!(Balances::total_balance(&account_id), initial_balance);

        assert_eq!(
            Balances::usable_balance(&account_id),
            initial_balance - stake_amount
        );

        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Reject);
        vote_generator.vote_and_assert_ok(VoteKind::Slash);
        vote_generator.vote_and_assert_ok(VoteKind::Slash);
        vote_generator.vote_and_assert_ok(VoteKind::Slash);

        run_to_block_and_finalize(2);

        assert!(!<crate::Proposals<Test>>::contains_key(proposal_id));

        assert_eq!(
            Balances::total_balance(&account_id),
            initial_balance - stake_amount
        );

        EventFixture::assert_last_crate_event(RawEvent::ProposalDecisionMade(
            proposal_id,
            ProposalDecision::Slashed,
        ));
    });
}

#[test]
fn create_proposal_fails_with_invalid_threshold_parameters() {
    initial_test_ext().execute_with(|| {
        let mut parameters = ProposalParameters {
            voting_period: 3,
            approval_quorum_percentage: 50,
            approval_threshold_percentage: 0,
            slashing_quorum_percentage: 60,
            slashing_threshold_percentage: 60,
            grace_period: 5,
            required_stake: None,
            constitutionality: 1,
        };

        let mut dummy_proposal = DummyProposalFixture::default().with_parameters(parameters);

        dummy_proposal.create_proposal_and_assert(Err(
            Error::<Test>::InvalidParameterApprovalThreshold.into(),
        ));

        parameters.approval_threshold_percentage = 60;
        parameters.slashing_threshold_percentage = 0;
        dummy_proposal = DummyProposalFixture::default().with_parameters(parameters);

        dummy_proposal.create_proposal_and_assert(Err(
            Error::<Test>::InvalidParameterSlashingThreshold.into(),
        ));
    });
}

#[test]
fn active_proposal_rejection_succeeds() {
    initial_test_ext().execute_with(|| {
        // to enable events
        let starting_block = 1;
        run_to_block_and_finalize(starting_block);

        let dummy_proposal = DummyProposalFixture::default();
        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Abstain);

        assert_eq!(
            <VoteExistsByProposalByVoter<Test>>::get(&proposal_id, &2),
            VoteKind::Abstain
        );

        let current_block = 2;
        run_to_block_and_finalize(current_block);

        let proposal = <Proposals<Test>>::get(proposal_id);

        assert_eq!(
            proposal.voting_results,
            VotingResults {
                abstentions: 1,
                approvals: 1,
                rejections: 0,
                slashes: 0,
            }
        );

        ProposalsEngine::reject_active_proposals();

        assert!(!<crate::Proposals<Test>>::contains_key(proposal_id));

        EventFixture::assert_last_crate_event(RawEvent::ProposalDecisionMade(
            proposal_id,
            ProposalDecision::Rejected,
        ));
    });
}

#[test]
fn proposal_counters_are_valid() {
    initial_test_ext().execute_with(|| {
        let mut dummy_proposal = DummyProposalFixture::default();
        let _ = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        dummy_proposal = DummyProposalFixture::default();
        let _ = dummy_proposal.create_proposal_and_assert(Ok(2)).unwrap();

        dummy_proposal = DummyProposalFixture::default();
        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(3)).unwrap();

        assert_eq!(ActiveProposalCount::get(), 3);
        assert_eq!(ProposalCount::get(), 3);

        let cancel_proposal_fixture = CancelProposalFixture::new(proposal_id);
        cancel_proposal_fixture.cancel_and_assert(Ok(()));

        assert_eq!(ActiveProposalCount::get(), 2);
        assert_eq!(ProposalCount::get(), 3);
    });
}

#[test]
fn slash_balance_is_calculated_correctly() {
    initial_test_ext().execute_with(|| {
        let vetoed_slash_balance = ProposalsEngine::calculate_slash_balance(
            &ProposalDecision::Vetoed,
            &ProposalParametersFixture::default().params(),
        );

        assert_eq!(vetoed_slash_balance, 0);

        let approved_slash_balance = ProposalsEngine::calculate_slash_balance(
            &ProposalDecision::Approved(ApprovedProposalDecision::PendingExecution),
            &ProposalParametersFixture::default().params(),
        );

        assert_eq!(approved_slash_balance, 0);

        let rejection_fee = <Test as crate::Trait>::RejectionFee::get();

        let rejected_slash_balance = ProposalsEngine::calculate_slash_balance(
            &ProposalDecision::Rejected,
            &ProposalParametersFixture::default().params(),
        );

        assert_eq!(rejected_slash_balance, rejection_fee);

        let expired_slash_balance = ProposalsEngine::calculate_slash_balance(
            &ProposalDecision::Expired,
            &ProposalParametersFixture::default().params(),
        );

        assert_eq!(expired_slash_balance, rejection_fee);

        let cancellation_fee = <Test as crate::Trait>::CancellationFee::get();

        let cancellation_slash_balance = ProposalsEngine::calculate_slash_balance(
            &ProposalDecision::Canceled,
            &ProposalParametersFixture::default().params(),
        );

        assert_eq!(cancellation_slash_balance, cancellation_fee);

        let slash_balance_with_no_stake = ProposalsEngine::calculate_slash_balance(
            &ProposalDecision::Slashed,
            &ProposalParametersFixture::default().params(),
        );

        assert_eq!(slash_balance_with_no_stake, 0);

        let stake = 256;
        let slash_balance_with_stake = ProposalsEngine::calculate_slash_balance(
            &ProposalDecision::Slashed,
            &ProposalParametersFixture::default()
                .with_required_stake(stake)
                .params(),
        );

        assert_eq!(slash_balance_with_stake, stake);
    });
}

#[test]
fn create_proposal_failed_with_zero_exact_execution_block() {
    initial_test_ext().execute_with(|| {
        let dummy_proposal = DummyProposalFixture::default().with_exact_execution_block(Some(0));
        dummy_proposal
            .create_proposal_and_assert(Err(Error::<Test>::ZeroExactExecutionBlock.into()));
    });
}

#[test]
fn create_proposal_failed_with_invalid_exact_execution_block() {
    initial_test_ext().execute_with(|| {
        let current_block = 20;
        run_to_block_and_finalize(current_block);

        let default_voting_period = 3;
        let grace_period = 10;
        let parameters_fixture =
            ProposalParametersFixture::default().with_grace_period(grace_period);

        // Exact block less than now
        let dummy_proposal = DummyProposalFixture::default()
            .with_parameters(parameters_fixture.parameters)
            .with_exact_execution_block(Some(10));
        dummy_proposal
            .create_proposal_and_assert(Err(Error::<Test>::InvalidExactExecutionBlock.into()));

        // Exact block less than now + grace period + voting_period
        let invalid_exact_block = current_block + grace_period + default_voting_period - 1;
        let dummy_proposal = DummyProposalFixture::default()
            .with_parameters(parameters_fixture.parameters)
            .with_exact_execution_block(Some(invalid_exact_block));
        dummy_proposal
            .create_proposal_and_assert(Err(Error::<Test>::InvalidExactExecutionBlock.into()));
    });
}

#[test]
fn proposal_execution_with_exact_execution_works() {
    initial_test_ext().execute_with(|| {
        let exact_block = 10;
        let parameters_fixture = ProposalParametersFixture::default().with_grace_period(3);
        let dummy_proposal = DummyProposalFixture::default()
            .with_parameters(parameters_fixture.params())
            .with_exact_execution_block(Some(exact_block));

        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);

        // Proposal exists after the grace period
        run_to_block(5);

        let proposal = <crate::Proposals<Test>>::get(proposal_id);

        assert_eq!(
            proposal,
            Proposal {
                parameters: parameters_fixture.params(),
                proposer_id: 1,
                activated_at: 0,
                status: ProposalStatus::approved(ApprovedProposalDecision::PendingExecution, 1),
                voting_results: VotingResults {
                    abstentions: 0,
                    approvals: 4,
                    rejections: 0,
                    slashes: 0,
                },
                exact_execution_block: Some(exact_block),
                nr_of_council_confirmations: 1,
                staking_account_id: None,
            }
        );

        // Exact execution block time.
        run_to_block(exact_block);

        EventFixture::assert_last_crate_event(RawEvent::ProposalExecuted(
            proposal_id,
            ExecutionStatus::Executed,
        ));

        // Proposal is removed.
        assert!(!<crate::Proposals<Test>>::contains_key(proposal_id));
    });
}

#[test]
fn proposal_with_pending_constitutionality_succeeds() {
    initial_test_ext().execute_with(|| {
        let starting_block = 1;
        run_to_block_and_finalize(1);

        let parameters_fixture = ProposalParametersFixture::default().with_constitutionality(2);
        let dummy_proposal =
            DummyProposalFixture::default().with_parameters(parameters_fixture.params());
        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 1);

        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);

        run_to_block_and_finalize(2);

        EventFixture::assert_events(vec![
            RawEvent::Voted(1, proposal_id, VoteKind::Approve, Vec::new()),
            RawEvent::Voted(2, proposal_id, VoteKind::Approve, Vec::new()),
            RawEvent::Voted(3, proposal_id, VoteKind::Approve, Vec::new()),
            RawEvent::Voted(4, proposal_id, VoteKind::Approve, Vec::new()),
            RawEvent::ProposalDecisionMade(
                proposal_id,
                ProposalDecision::Approved(ApprovedProposalDecision::PendingConstitutionality),
            ),
            RawEvent::ProposalStatusUpdated(proposal_id, ProposalStatus::PendingConstitutionality),
        ]);

        let proposal = <Proposals<Test>>::get(proposal_id);

        assert_eq!(
            proposal,
            Proposal {
                parameters: parameters_fixture.params(),
                proposer_id: 1,
                activated_at: starting_block,
                status: ProposalStatus::approved(
                    ApprovedProposalDecision::PendingConstitutionality,
                    starting_block
                ),
                voting_results: VotingResults {
                    abstentions: 0,
                    approvals: 4,
                    rejections: 0,
                    slashes: 0,
                },
                exact_execution_block: None,
                nr_of_council_confirmations: 1,
                staking_account_id: None,
            }
        );
        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 1);
    });
}

#[test]
fn proposal_with_pending_constitutionality_reactivation_succeeds() {
    initial_test_ext().execute_with(|| {
        let starting_block = 1;
        run_to_block_and_finalize(1);

        let parameters_fixture = ProposalParametersFixture::default().with_constitutionality(2);
        let dummy_proposal =
            DummyProposalFixture::default().with_parameters(parameters_fixture.params());
        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 1);

        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);

        run_to_block_and_finalize(2);

        EventFixture::assert_events(vec![
            RawEvent::Voted(1, proposal_id, VoteKind::Approve, Vec::new()),
            RawEvent::Voted(2, proposal_id, VoteKind::Approve, Vec::new()),
            RawEvent::Voted(3, proposal_id, VoteKind::Approve, Vec::new()),
            RawEvent::Voted(4, proposal_id, VoteKind::Approve, Vec::new()),
            RawEvent::ProposalDecisionMade(
                proposal_id,
                ProposalDecision::Approved(ApprovedProposalDecision::PendingConstitutionality),
            ),
            RawEvent::ProposalStatusUpdated(proposal_id, ProposalStatus::PendingConstitutionality),
        ]);

        let initial_proposal = <Proposals<Test>>::get(proposal_id);

        assert_eq!(
            initial_proposal,
            Proposal {
                parameters: parameters_fixture.params(),
                proposer_id: 1,
                activated_at: starting_block,
                status: ProposalStatus::approved(
                    ApprovedProposalDecision::PendingConstitutionality,
                    starting_block
                ),
                voting_results: VotingResults {
                    abstentions: 0,
                    approvals: 4,
                    rejections: 0,
                    slashes: 0,
                },
                exact_execution_block: None,
                nr_of_council_confirmations: 1,
                staking_account_id: None,
            }
        );

        let reactivation_block = 5;
        run_to_block_and_finalize(reactivation_block);

        ProposalsEngine::reactivate_pending_constitutionality_proposals();

        let proposal = <Proposals<Test>>::get(proposal_id);

        assert_eq!(
            proposal,
            Proposal {
                activated_at: reactivation_block,
                status: ProposalStatus::Active,
                voting_results: VotingResults::default(),
                ..initial_proposal
            }
        );

        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 1);
    });
}

#[test]
fn proposal_with_pending_constitutionality_execution_succeeds() {
    initial_test_ext().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let account_id = 1;
        let total_balance = 1000;
        let required_stake = 200;

        increase_total_balance_issuance_using_account_id(account_id, total_balance);

        let parameters_fixture = ProposalParametersFixture::default()
            .with_constitutionality(2)
            .with_required_stake(required_stake);
        let dummy_proposal = DummyProposalFixture::default()
            .with_parameters(parameters_fixture.params())
            .with_stake(account_id);
        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        assert_eq!(
            Balances::usable_balance(&account_id),
            total_balance - required_stake
        );

        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 1);

        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);

        run_to_block(2);

        // first chain of event from the creation to the approval
        EventFixture::assert_global_events(vec![
            TestEvent::frame_system(frame_system::RawEvent::NewAccount(1)), // because of token transfer
            TestEvent::balances(balances::RawEvent::Endowed(1, total_balance)), // because of token transfer
            TestEvent::engine(RawEvent::Voted(
                1,
                proposal_id,
                VoteKind::Approve,
                Vec::new(),
            )),
            TestEvent::engine(RawEvent::Voted(
                2,
                proposal_id,
                VoteKind::Approve,
                Vec::new(),
            )),
            TestEvent::engine(RawEvent::Voted(
                3,
                proposal_id,
                VoteKind::Approve,
                Vec::new(),
            )),
            TestEvent::engine(RawEvent::Voted(
                4,
                proposal_id,
                VoteKind::Approve,
                Vec::new(),
            )),
            TestEvent::engine(RawEvent::ProposalDecisionMade(
                proposal_id,
                ProposalDecision::Approved(ApprovedProposalDecision::PendingConstitutionality),
            )),
            TestEvent::engine(RawEvent::ProposalStatusUpdated(
                proposal_id,
                ProposalStatus::PendingConstitutionality,
            )),
        ]);

        let initial_proposal = <Proposals<Test>>::get(proposal_id);

        assert_eq!(
            initial_proposal,
            Proposal {
                parameters: parameters_fixture.params(),
                proposer_id: 1,
                activated_at: starting_block,
                status: ProposalStatus::approved(
                    ApprovedProposalDecision::PendingConstitutionality,
                    starting_block + 1
                ),
                voting_results: VotingResults {
                    abstentions: 0,
                    approvals: 4,
                    rejections: 0,
                    slashes: 0,
                },
                exact_execution_block: None,
                nr_of_council_confirmations: 1,
                staking_account_id: Some(account_id),
            }
        );

        assert_eq!(
            Balances::usable_balance(&account_id),
            total_balance - required_stake
        );

        let reactivation_block = 5;
        run_to_block(reactivation_block);

        ProposalsEngine::reactivate_pending_constitutionality_proposals();

        let proposal = <Proposals<Test>>::get(proposal_id);

        assert_eq!(
            proposal,
            Proposal {
                activated_at: reactivation_block,
                status: ProposalStatus::Active,
                voting_results: VotingResults::default(),
                ..initial_proposal
            }
        );

        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);
        vote_generator.vote_and_assert_ok(VoteKind::Approve);

        let next_block_after_approval = 7;
        run_to_block(next_block_after_approval);

        // internal active proposal counter check
        assert_eq!(<ActiveProposalCount>::get(), 0);

        assert_eq!(Balances::usable_balance(&account_id), total_balance);

        EventFixture::assert_global_events(vec![
            // first chain of event from the creation to the approval
            TestEvent::frame_system(frame_system::RawEvent::NewAccount(1)), // because of token transfer
            TestEvent::balances(balances::RawEvent::Endowed(1, total_balance)), // because of token transfer
            TestEvent::engine(RawEvent::Voted(
                1,
                proposal_id,
                VoteKind::Approve,
                Vec::new(),
            )),
            TestEvent::engine(RawEvent::Voted(
                2,
                proposal_id,
                VoteKind::Approve,
                Vec::new(),
            )),
            TestEvent::engine(RawEvent::Voted(
                3,
                proposal_id,
                VoteKind::Approve,
                Vec::new(),
            )),
            TestEvent::engine(RawEvent::Voted(
                4,
                proposal_id,
                VoteKind::Approve,
                Vec::new(),
            )),
            TestEvent::engine(RawEvent::ProposalDecisionMade(
                proposal_id,
                ProposalDecision::Approved(ApprovedProposalDecision::PendingConstitutionality),
            )),
            TestEvent::engine(RawEvent::ProposalStatusUpdated(
                proposal_id,
                ProposalStatus::PendingConstitutionality,
            )),
            // reactivation of the proposal
            TestEvent::engine(RawEvent::ProposalStatusUpdated(
                proposal_id,
                ProposalStatus::Active,
            )),
            // second proposal approval chain
            TestEvent::engine(RawEvent::Voted(
                1,
                proposal_id,
                VoteKind::Approve,
                Vec::new(),
            )),
            TestEvent::engine(RawEvent::Voted(
                2,
                proposal_id,
                VoteKind::Approve,
                Vec::new(),
            )),
            TestEvent::engine(RawEvent::Voted(
                3,
                proposal_id,
                VoteKind::Approve,
                Vec::new(),
            )),
            TestEvent::engine(RawEvent::Voted(
                4,
                proposal_id,
                VoteKind::Approve,
                Vec::new(),
            )),
            TestEvent::engine(RawEvent::ProposalDecisionMade(
                proposal_id,
                ProposalDecision::Approved(ApprovedProposalDecision::PendingExecution),
            )),
            TestEvent::engine(RawEvent::ProposalStatusUpdated(
                proposal_id,
                ProposalStatus::PendingExecution(reactivation_block + 1),
            )),
            // execution
            TestEvent::engine(RawEvent::ProposalExecuted(
                proposal_id,
                ExecutionStatus::Executed,
            )),
        ]);
    });
}

#[test]
fn proposal_early_rejection_succeeds() {
    initial_test_ext().execute_with(|| {
        let dummy_proposal = DummyProposalFixture::default();
        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Abstain);
        vote_generator.vote_and_assert_ok(VoteKind::Abstain);

        assert_eq!(
            <VoteExistsByProposalByVoter<Test>>::get(&proposal_id, &2),
            VoteKind::Abstain
        );

        run_to_block_and_finalize(1);

        assert!(!<Proposals<Test>>::contains_key(proposal_id));
    });
}

#[test]
fn proposal_execution_status_helper_succeeds() {
    let msg = "error";

    assert_eq!(
        ExecutionStatus::failed_execution(&msg),
        ExecutionStatus::ExecutionFailed {
            error: msg.as_bytes().to_vec()
        }
    );
}

// Alias introduced for simplicity of changing Proposal exact types.
type ProposalObject = Proposal<u64, u64, u64, u64>;

#[test]
fn proposal_voting_period_expired() {
    let mut proposal = ProposalObject::default();

    proposal.activated_at = 1;
    proposal.parameters.voting_period = 3;

    assert!(proposal.is_voting_period_expired(4));
}

#[test]
fn proposal_voting_period_not_expired() {
    let mut proposal = ProposalObject::default();

    proposal.activated_at = 1;
    proposal.parameters.voting_period = 3;

    assert!(!proposal.is_voting_period_expired(3));
}

#[test]
fn proposal_grace_period_expired() {
    let mut proposal = ProposalObject::default();

    proposal.parameters.grace_period = 3;
    proposal.status = ProposalStatus::PendingExecution(0);

    assert!(proposal.is_grace_period_expired(4));
}

#[test]
fn proposal_grace_period_auto_expired() {
    let mut proposal = ProposalObject::default();

    proposal.parameters.grace_period = 0;
    proposal.status = ProposalStatus::PendingExecution(0);

    assert!(proposal.is_grace_period_expired(1));
}

#[test]
fn proposal_grace_period_not_expired() {
    let mut proposal = ProposalObject::default();

    proposal.parameters.grace_period = 3;

    assert!(!proposal.is_grace_period_expired(3));
}

#[test]
fn proposal_grace_period_not_expired_because_of_not_approved_proposal() {
    let mut proposal = ProposalObject::default();

    proposal.parameters.grace_period = 3;

    assert!(!proposal.is_grace_period_expired(3));
}

#[test]
fn define_proposal_decision_status_returns_expired() {
    let mut proposal = ProposalObject::default();
    let now = 5;
    proposal.activated_at = 1;
    proposal.parameters.voting_period = 3;
    proposal.parameters.approval_quorum_percentage = 80;
    proposal.parameters.approval_threshold_percentage = 40;
    proposal.parameters.slashing_quorum_percentage = 50;
    proposal.parameters.slashing_threshold_percentage = 50;

    proposal.voting_results.add_vote(VoteKind::Reject);
    proposal.voting_results.add_vote(VoteKind::Approve);
    proposal.voting_results.add_vote(VoteKind::Approve);

    assert_eq!(
        proposal.voting_results,
        VotingResults {
            abstentions: 0,
            approvals: 2,
            rejections: 1,
            slashes: 0,
        }
    );

    let expected_proposal_decision = proposal.define_proposal_decision(5, now);
    assert_eq!(expected_proposal_decision, Some(ProposalDecision::Expired));
}

#[test]
fn define_proposal_decision_status_returns_approved() {
    let now = 2;
    let mut proposal = ProposalObject::default();
    proposal.activated_at = 1;
    proposal.parameters.voting_period = 3;
    proposal.parameters.approval_quorum_percentage = 60;
    proposal.parameters.slashing_quorum_percentage = 50;
    proposal.parameters.slashing_threshold_percentage = 50;

    proposal.voting_results.add_vote(VoteKind::Reject);
    proposal.voting_results.add_vote(VoteKind::Approve);
    proposal.voting_results.add_vote(VoteKind::Approve);
    proposal.voting_results.add_vote(VoteKind::Approve);

    assert_eq!(
        proposal.voting_results,
        VotingResults {
            abstentions: 0,
            approvals: 3,
            rejections: 1,
            slashes: 0,
        }
    );

    let expected_proposal_decision = proposal.define_proposal_decision(5, now);
    assert_eq!(
        expected_proposal_decision,
        Some(ProposalDecision::Approved(
            ApprovedProposalDecision::PendingExecution
        ))
    );
}

#[test]
fn define_proposal_decision_status_returns_rejected() {
    let mut proposal = ProposalObject::default();

    proposal.activated_at = 1;
    proposal.parameters.voting_period = 3;
    proposal.parameters.approval_quorum_percentage = 50;
    proposal.parameters.approval_threshold_percentage = 51;
    proposal.parameters.slashing_quorum_percentage = 50;
    proposal.parameters.slashing_threshold_percentage = 50;

    proposal.voting_results.add_vote(VoteKind::Reject);
    proposal.voting_results.add_vote(VoteKind::Reject);
    proposal.voting_results.add_vote(VoteKind::Abstain);
    proposal.voting_results.add_vote(VoteKind::Approve);

    assert_eq!(
        proposal.voting_results,
        VotingResults {
            abstentions: 1,
            approvals: 1,
            rejections: 2,
            slashes: 0,
        }
    );

    let mut proposal = ProposalObject::default();
    let now = 2;

    proposal.activated_at = 1;
    proposal.parameters.voting_period = 3;
    proposal.parameters.approval_quorum_percentage = 50;
    proposal.parameters.approval_threshold_percentage = 51;
    proposal.parameters.slashing_quorum_percentage = 50;
    proposal.parameters.slashing_threshold_percentage = 50;

    proposal.voting_results.add_vote(VoteKind::Reject);
    proposal.voting_results.add_vote(VoteKind::Reject);
    proposal.voting_results.add_vote(VoteKind::Abstain);
    proposal.voting_results.add_vote(VoteKind::Approve);

    assert_eq!(
        proposal.voting_results,
        VotingResults {
            abstentions: 1,
            approvals: 1,
            rejections: 2,
            slashes: 0,
        }
    );

    let expected_proposal_decision = proposal.define_proposal_decision(4, now);
    assert_eq!(expected_proposal_decision, Some(ProposalDecision::Rejected));
}

#[test]
fn define_proposal_decision_status_returns_slashed() {
    let mut proposal = ProposalObject::default();
    let now = 2;

    proposal.activated_at = 1;
    proposal.parameters.voting_period = 3;
    proposal.parameters.approval_quorum_percentage = 50;
    proposal.parameters.approval_threshold_percentage = 50;
    proposal.parameters.slashing_quorum_percentage = 50;
    proposal.parameters.slashing_threshold_percentage = 50;

    proposal.voting_results.add_vote(VoteKind::Slash);
    proposal.voting_results.add_vote(VoteKind::Reject);
    proposal.voting_results.add_vote(VoteKind::Abstain);
    proposal.voting_results.add_vote(VoteKind::Slash);

    assert_eq!(
        proposal.voting_results,
        VotingResults {
            abstentions: 1,
            approvals: 0,
            rejections: 1,
            slashes: 2,
        }
    );

    let expected_proposal_decision = proposal.define_proposal_decision(4, now);
    assert_eq!(expected_proposal_decision, Some(ProposalDecision::Slashed));
}

#[test]
fn define_proposal_decision_status_returns_none() {
    let mut proposal = ProposalObject::default();
    let now = 2;

    proposal.activated_at = 1;
    proposal.parameters.voting_period = 3;
    proposal.parameters.approval_quorum_percentage = 60;
    proposal.parameters.slashing_quorum_percentage = 50;

    proposal.voting_results.add_vote(VoteKind::Abstain);
    assert_eq!(
        proposal.voting_results,
        VotingResults {
            abstentions: 1,
            approvals: 0,
            rejections: 0,
            slashes: 0,
        }
    );

    let expected_proposal_status = proposal.define_proposal_decision(5, now);
    assert_eq!(expected_proposal_status, None);
}

#[test]
fn define_proposal_decision_status_returns_approved_before_slashing_before_rejection() {
    let mut proposal = ProposalObject::default();
    let now = 2;

    proposal.activated_at = 1;
    proposal.parameters.voting_period = 3;
    proposal.parameters.approval_quorum_percentage = 50;
    proposal.parameters.approval_threshold_percentage = 30;
    proposal.parameters.slashing_quorum_percentage = 50;
    proposal.parameters.slashing_threshold_percentage = 30;

    proposal.voting_results.add_vote(VoteKind::Approve);
    proposal.voting_results.add_vote(VoteKind::Approve);
    proposal.voting_results.add_vote(VoteKind::Reject);
    proposal.voting_results.add_vote(VoteKind::Reject);
    proposal.voting_results.add_vote(VoteKind::Slash);
    proposal.voting_results.add_vote(VoteKind::Slash);

    assert_eq!(
        proposal.voting_results,
        VotingResults {
            abstentions: 0,
            approvals: 2,
            rejections: 2,
            slashes: 2,
        }
    );

    let expected_proposal_decision = proposal.define_proposal_decision(6, now);

    assert_eq!(
        expected_proposal_decision,
        Some(ProposalDecision::Approved(
            ApprovedProposalDecision::PendingExecution
        ))
    );
}

#[test]
fn define_proposal_decision_status_returns_slashed_before_rejection() {
    let mut proposal = ProposalObject::default();
    let now = 2;

    proposal.activated_at = 1;
    proposal.parameters.voting_period = 3;
    proposal.parameters.approval_quorum_percentage = 50;
    proposal.parameters.approval_threshold_percentage = 30;
    proposal.parameters.slashing_quorum_percentage = 50;
    proposal.parameters.slashing_threshold_percentage = 30;

    proposal.voting_results.add_vote(VoteKind::Abstain);
    proposal.voting_results.add_vote(VoteKind::Approve);
    proposal.voting_results.add_vote(VoteKind::Reject);
    proposal.voting_results.add_vote(VoteKind::Reject);
    proposal.voting_results.add_vote(VoteKind::Slash);
    proposal.voting_results.add_vote(VoteKind::Slash);

    assert_eq!(
        proposal.voting_results,
        VotingResults {
            abstentions: 1,
            approvals: 1,
            rejections: 2,
            slashes: 2,
        }
    );

    let expected_proposal_decision = proposal.define_proposal_decision(6, now);

    assert_eq!(expected_proposal_decision, Some(ProposalDecision::Slashed));
}

#[test]
fn proposal_status_resolution_approval_quorum_works_correctly() {
    let no_approval_quorum_proposal: Proposal<u64, u64, u64, u64> = Proposal {
        parameters: ProposalParameters {
            approval_quorum_percentage: 63,
            slashing_threshold_percentage: 63,
            ..ProposalParameters::default()
        },
        ..Proposal::default()
    };
    let no_approval_proposal_status_resolution = ProposalStatusResolution {
        proposal: &no_approval_quorum_proposal,
        now: 20,
        votes_count: 314,
        total_voters_count: 500,
        approvals: 3,
        slashes: 3,
    };

    assert!(!no_approval_proposal_status_resolution.is_approval_quorum_reached());

    let approval_quorum_proposal_status_resolution = ProposalStatusResolution {
        votes_count: 315,
        ..no_approval_proposal_status_resolution
    };

    assert!(approval_quorum_proposal_status_resolution.is_approval_quorum_reached());
}

#[test]
fn proposal_status_resolution_slashing_quorum_works_correctly() {
    let no_slashing_quorum_proposal: Proposal<u64, u64, u64, u64> = Proposal {
        parameters: ProposalParameters {
            approval_quorum_percentage: 63,
            slashing_quorum_percentage: 63,
            ..ProposalParameters::default()
        },
        ..Proposal::default()
    };
    let no_slashing_proposal_status_resolution = ProposalStatusResolution {
        proposal: &no_slashing_quorum_proposal,
        now: 20,
        votes_count: 314,
        total_voters_count: 500,
        approvals: 3,
        slashes: 3,
    };

    assert!(!no_slashing_proposal_status_resolution.is_slashing_quorum_reached());

    let slashing_quorum_proposal_status_resolution = ProposalStatusResolution {
        votes_count: 315,
        ..no_slashing_proposal_status_resolution
    };

    assert!(slashing_quorum_proposal_status_resolution.is_slashing_quorum_reached());
}

#[test]
fn proposal_status_resolution_approval_threshold_works_correctly() {
    let no_approval_threshold_proposal: Proposal<u64, u64, u64, u64> = Proposal {
        parameters: ProposalParameters {
            slashing_threshold_percentage: 63,
            approval_threshold_percentage: 63,
            ..ProposalParameters::default()
        },
        ..Proposal::default()
    };
    let no_approval_proposal_status_resolution = ProposalStatusResolution {
        proposal: &no_approval_threshold_proposal,
        now: 20,
        votes_count: 500,
        total_voters_count: 600,
        approvals: 314,
        slashes: 3,
    };

    assert!(!no_approval_proposal_status_resolution.is_approval_threshold_reached());

    let approval_threshold_proposal_status_resolution = ProposalStatusResolution {
        approvals: 315,
        ..no_approval_proposal_status_resolution
    };

    assert!(approval_threshold_proposal_status_resolution.is_approval_threshold_reached());
}

#[test]
fn proposal_status_resolution_slashing_threshold_works_correctly() {
    let no_slashing_threshold_proposal: Proposal<u64, u64, u64, u64> = Proposal {
        parameters: ProposalParameters {
            slashing_threshold_percentage: 63,
            approval_threshold_percentage: 63,
            ..ProposalParameters::default()
        },
        ..Proposal::default()
    };
    let no_slashing_proposal_status_resolution = ProposalStatusResolution {
        proposal: &no_slashing_threshold_proposal,
        now: 20,
        votes_count: 500,
        total_voters_count: 600,
        approvals: 3,
        slashes: 314,
    };

    assert!(!no_slashing_proposal_status_resolution.is_slashing_threshold_reached());

    let slashing_threshold_proposal_status_resolution = ProposalStatusResolution {
        slashes: 315,
        ..no_slashing_proposal_status_resolution
    };

    assert!(slashing_threshold_proposal_status_resolution.is_slashing_threshold_reached());
}

#[test]
fn proposal_exact_execution_block_reached() {
    let mut proposal = ProposalObject::default();

    proposal.exact_execution_block = None;
    assert!(proposal.is_execution_block_reached_or_not_set(3));

    proposal.exact_execution_block = Some(3);
    assert!(proposal.is_execution_block_reached_or_not_set(3));
}

#[test]
fn proposal_exact_execution_block_not_reached() {
    let mut proposal = ProposalObject::default();

    proposal.exact_execution_block = Some(3);
    assert!(!proposal.is_execution_block_reached_or_not_set(2));
}

#[test]
fn proposal_status_resolution_approval_achievable_works_correctly() {
    let approval_threshold_proposal: Proposal<u64, u64, u64, u64> = Proposal {
        parameters: ProposalParameters {
            slashing_threshold_percentage: 50,
            approval_threshold_percentage: 50,
            ..ProposalParameters::default()
        },
        ..Proposal::default()
    };
    let not_achievable_proposal_status_resolution = ProposalStatusResolution {
        proposal: &approval_threshold_proposal,
        now: 20,
        votes_count: 302,
        total_voters_count: 600,
        approvals: 1,
        slashes: 0,
    };

    assert!(!not_achievable_proposal_status_resolution.is_approval_threshold_achievable());
    assert!(not_achievable_proposal_status_resolution.is_rejection_imminent());

    let approval_threshold_achievable_resolution = ProposalStatusResolution {
        approvals: 2,
        ..not_achievable_proposal_status_resolution
    };

    assert!(approval_threshold_achievable_resolution.is_approval_threshold_achievable());
    assert!(!approval_threshold_achievable_resolution.is_rejection_imminent());
}

#[test]
fn proposal_status_resolution_is_slashing_achievable_works_correctly() {
    let slashing_threshold_proposal: Proposal<u64, u64, u64, u64> = Proposal {
        parameters: ProposalParameters {
            slashing_threshold_percentage: 50,
            approval_threshold_percentage: 50,
            ..ProposalParameters::default()
        },
        ..Proposal::default()
    };
    let not_achievable_proposal_status_resolution = ProposalStatusResolution {
        proposal: &slashing_threshold_proposal,
        now: 20,
        votes_count: 302,
        total_voters_count: 600,
        approvals: 0,
        slashes: 1,
    };

    assert!(!not_achievable_proposal_status_resolution.is_approval_threshold_achievable());
    assert!(not_achievable_proposal_status_resolution.is_rejection_imminent());

    let slashing_threshold_achievable_resolution = ProposalStatusResolution {
        slashes: 2,
        ..not_achievable_proposal_status_resolution
    };

    assert!(slashing_threshold_achievable_resolution.is_slashing_threshold_achievable());
    assert!(!slashing_threshold_achievable_resolution.is_rejection_imminent());
}
