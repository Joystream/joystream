//! Proposals integration tests - with stake, membership, governance modules.

#![cfg(test)]

mod working_group_proposals;

use crate::tests::{account_from_member_id, create_new_members, run_to_block, setup_new_council};
use crate::{BlogInstance, MembershipWorkingGroupInstance, ProposalCancellationFee, Runtime};
use codec::Encode;
use proposals_codex::{GeneralProposalParameters, ProposalDetails};
use proposals_engine::{
    ApprovedProposalDecision, Proposal, ProposalCreationParameters, ProposalParameters,
    ProposalStatus, VoteKind, VotersParameters, VotingResults,
};
use working_group::{StakeParameters, StakePolicy};

use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::traits::Currency;
use frame_support::{StorageMap, StorageValue};
use frame_system::RawOrigin;
use sp_runtime::AccountId32;
use sp_std::collections::btree_set::BTreeSet;

use super::{
    increase_total_balance_issuance_using_account_id, initial_test_ext, set_staking_account,
};

use crate::CouncilManager;

pub type Balances = pallet_balances::Module<Runtime>;
pub type System = frame_system::Module<Runtime>;
pub type ProposalsEngine = proposals_engine::Module<Runtime>;
pub type ProposalCodex = proposals_codex::Module<Runtime>;
pub type Council = council::Module<Runtime>;
pub type Membership = membership::Module<Runtime>;
pub type MembershipWorkingGroup = working_group::Module<Runtime, MembershipWorkingGroupInstance>;
pub type Blog = blog::Module<Runtime, BlogInstance>;

struct VoteGenerator {
    proposal_id: u32,
    // index into council seats
    current_voter_index: usize,
    last_voter_id: u64,
    pub auto_increment_voter_id: bool,
}

impl VoteGenerator {
    fn new(proposal_id: u32) -> Self {
        VoteGenerator {
            proposal_id,
            current_voter_index: 0,
            last_voter_id: 0,
            auto_increment_voter_id: true,
        }
    }

    fn last_voter(&self) -> u64 {
        self.last_voter_id
    }

    fn vote_and_assert_ok(&mut self, vote_kind: VoteKind) {
        self.vote_and_assert(vote_kind.clone(), Ok(()));
        assert_eq!(
            ProposalsEngine::vote_by_proposal_by_voter(self.proposal_id, self.last_voter_id),
            vote_kind
        );
    }

    fn vote_and_assert(&mut self, vote_kind: VoteKind, expected_result: DispatchResult) {
        assert_eq!(self.vote(vote_kind.clone()), expected_result);
    }

    fn vote(&mut self, vote_kind: VoteKind) -> DispatchResult {
        let council_members = council::Module::<Runtime>::council_members();
        let voter = council_members[self.current_voter_index].clone();
        let voter_member_id = voter.member_id();
        let account_id = account_from_member_id(*voter_member_id);
        let vote_result = ProposalsEngine::vote(
            frame_system::RawOrigin::Signed(account_id).into(),
            *voter_member_id,
            self.proposal_id,
            vote_kind,
            Vec::new(),
        );

        self.last_voter_id = *voter_member_id;
        if self.auto_increment_voter_id {
            self.current_voter_index += 1;
        }

        vote_result
    }
}

#[derive(Clone)]
struct DummyProposalFixture {
    parameters: ProposalParameters<u32, u128>,
    account_id: AccountId32,
    proposer_id: u64,
    proposal_code: Vec<u8>,
    title: Vec<u8>,
    description: Vec<u8>,
    staking_account_id: Option<AccountId32>,
    exact_execution_block: Option<u32>,
}

impl Default for DummyProposalFixture {
    fn default() -> Self {
        let title = b"title".to_vec();
        let description = b"description".to_vec();
        let dummy_proposal =
            joystream_utility::Call::<Runtime>::execute_signal_proposal(b"signal".to_vec());

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
            account_id: <Runtime as frame_system::Trait>::AccountId::default(),
            proposer_id: 0,
            proposal_code: dummy_proposal.encode(),
            title,
            description,
            staking_account_id: None,
            exact_execution_block: None,
        }
    }
}

impl DummyProposalFixture {
    fn with_parameters(self, parameters: ProposalParameters<u32, u128>) -> Self {
        DummyProposalFixture { parameters, ..self }
    }

    fn with_constitutionality(&self, constitutionality: u32) -> Self {
        DummyProposalFixture {
            parameters: ProposalParameters {
                constitutionality,
                ..self.parameters
            },
            ..self.clone()
        }
    }

    fn with_account_id(self, account_id: AccountId32) -> Self {
        DummyProposalFixture { account_id, ..self }
    }

    fn with_voting_period(self, voting_period: u32) -> Self {
        DummyProposalFixture {
            parameters: ProposalParameters {
                voting_period,
                ..self.parameters
            },
            ..self
        }
    }

    fn with_stake(self, account_id: AccountId32) -> Self {
        DummyProposalFixture {
            staking_account_id: Some(account_id),
            ..self
        }
    }

    fn with_proposer(self, proposer_id: u64) -> Self {
        DummyProposalFixture {
            proposer_id,
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
    origin: RawOrigin<AccountId32>,
    proposal_id: u32,
    proposer_id: u64,
}

impl CancelProposalFixture {
    fn new(proposal_id: u32) -> Self {
        let account_id = <Runtime as frame_system::Trait>::AccountId::default();
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

/// Main purpose of this integration test: check balance of the member on proposal finalization (cancellation)
/// It tests StakingEventsHandler integration. Also, membership module is tested during the proposal creation (MemberOriginValidator).
#[test]
fn proposal_cancellation_with_slashes_with_balance_checks_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = create_new_members(1)[0];
        let account_id = account_from_member_id(member_id);

        let stake_amount = 20000u128;
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
            .with_stake(account_id.clone())
            .with_proposer(member_id);

        let account_balance = 500000;
        Balances::make_free_balance_be(&account_id, account_balance);

        // Since the account_id is the staking account it neccesarily has locked funds
        // for being a candidate for a staking account.
        assert_eq!(
            Balances::usable_balance(&account_id),
            account_balance - <Runtime as membership::Trait>::CandidateStake::get()
        );

        let expected_proposal_id = 1;
        let proposal_id = dummy_proposal
            .create_proposal_and_assert(Ok(expected_proposal_id))
            .unwrap();

        // Only the biggest locked stake count, we don't need to substract the stake candidate here
        assert_eq!(
            Balances::usable_balance(&account_id),
            account_balance - stake_amount
        );

        let proposal = ProposalsEngine::proposals(proposal_id);

        let expected_proposal = Proposal {
            parameters,
            proposer_id: member_id,
            activated_at: 0,
            status: ProposalStatus::Active,
            voting_results: VotingResults::default(),
            exact_execution_block: None,
            nr_of_council_confirmations: 0,
            staking_account_id: Some(account_id.clone()),
        };

        assert_eq!(proposal, expected_proposal);

        let cancel_proposal_fixture =
            CancelProposalFixture::new(proposal_id).with_proposer(member_id);

        cancel_proposal_fixture.cancel_and_assert(Ok(()));

        let cancellation_fee = ProposalCancellationFee::get() as u128;

        // Since the account_id is the staking account it neccesarily has locked funds
        // for being a candidate for a staking account.
        assert_eq!(
            Balances::usable_balance(&account_id),
            account_balance
                - cancellation_fee
                - <Runtime as membership::Trait>::CandidateStake::get()
        );
    });
}

#[test]
fn proposal_reset_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = create_new_members(1)[0];
        let account_id = account_from_member_id(member_id);
        setup_new_council(0);

        // create proposal
        let dummy_proposal = DummyProposalFixture::default()
            .with_voting_period(100)
            .with_account_id(account_id)
            .with_proposer(member_id);
        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        // create some votes
        let mut vote_generator = VoteGenerator::new(proposal_id);
        vote_generator.vote_and_assert_ok(VoteKind::Reject);
        vote_generator.vote_and_assert_ok(VoteKind::Abstain);
        vote_generator.vote_and_assert_ok(VoteKind::Slash);

        // check
        let proposal = ProposalsEngine::proposals(proposal_id);
        assert_eq!(
            proposal.voting_results,
            VotingResults {
                abstentions: 1,
                approvals: 0,
                rejections: 1,
                slashes: 1,
            }
        );

        end_idle_period();
        setup_new_council(1);

        let updated_proposal = ProposalsEngine::proposals(proposal_id);

        assert_eq!(
            updated_proposal.voting_results,
            VotingResults {
                abstentions: 0,
                approvals: 0,
                rejections: 0,
                slashes: 0,
            }
        );

        // No votes could survive cleaning: should be default value.
        assert_eq!(
            ProposalsEngine::vote_by_proposal_by_voter(proposal_id, vote_generator.last_voter()),
            VoteKind::default()
        );
    });
}

// Ends council idle period
// Preconditions: currently in idle period, idle period started in currnet block
fn end_idle_period() {
    let current_block = System::block_number();
    let idle_period_duration = <Runtime as council::Trait>::IdlePeriodDuration::get();
    run_to_block(current_block + idle_period_duration);
}

struct CodexProposalTestFixture<SuccessfulCall>
where
    SuccessfulCall: Fn() -> DispatchResult,
{
    successful_call: SuccessfulCall,
    member_id: u64,
    setup_environment: bool,
    proposal_id: u32,
    lead_id: u64,
    set_member_lead: bool,
}

impl<SuccessfulCall> CodexProposalTestFixture<SuccessfulCall>
where
    SuccessfulCall: Fn() -> DispatchResult,
{
    fn default_for_call(call: SuccessfulCall) -> Self {
        Self {
            successful_call: call,
            member_id: 1,
            setup_environment: true,
            proposal_id: 1,
            lead_id: 11,
            set_member_lead: false,
        }
    }

    fn disable_setup_enviroment(self) -> Self {
        Self {
            setup_environment: false,
            ..self
        }
    }
    fn with_setup_enviroment(self, setup_environment: bool) -> Self {
        Self {
            setup_environment,
            ..self
        }
    }

    fn with_member_id(self, member_id: u64) -> Self {
        Self { member_id, ..self }
    }

    fn with_expected_proposal_id(self, expected_proposal_id: u32) -> Self {
        Self {
            proposal_id: expected_proposal_id,
            ..self
        }
    }

    fn with_lead_id(self, lead_id: u64) -> Self {
        Self { lead_id, ..self }
    }

    fn with_set_member_lead(self, set_member_lead: bool) -> Self {
        Self {
            set_member_lead,
            ..self
        }
    }
}

fn set_membership_leader(lead_account_id: AccountId32, lead_id: u64) {
    MembershipWorkingGroup::add_opening(
        RawOrigin::Root.into(),
        vec![0u8],
        working_group::OpeningType::Leader,
        StakePolicy {
            stake_amount:
                <Runtime as working_group::Trait<MembershipWorkingGroupInstance>>::MinimumApplicationStake::get(
                ) as u128,
            leaving_unstaking_period: 1000000,
        },
        None,
    )
    .unwrap();

    let application = working_group::ApplyOnOpeningParameters::<Runtime> {
        member_id: lead_id.clone().into(),
        opening_id: 0,
        role_account_id: lead_account_id.clone(),
        reward_account_id: lead_account_id.clone(),
        description: vec![0u8],
        stake_parameters: StakeParameters {
            stake: <Runtime as working_group::Trait<MembershipWorkingGroupInstance>>::MinimumApplicationStake::get() as
                u128,
            staking_account_id: lead_account_id.clone(),
        },
    };

    MembershipWorkingGroup::apply_on_opening(
        RawOrigin::Signed(lead_account_id).into(),
        application,
    )
    .unwrap();
    let mut successful_application_ids = BTreeSet::new();
    successful_application_ids.insert(0);
    MembershipWorkingGroup::fill_opening(RawOrigin::Root.into(), 0, successful_application_ids)
        .unwrap();
}

impl<SuccessfulCall> CodexProposalTestFixture<SuccessfulCall>
where
    SuccessfulCall: Fn() -> DispatchResult,
{
    fn call_extrinsic_and_assert(&self) {
        let account_id = account_from_member_id(self.member_id);

        if self.setup_environment {
            setup_new_council(0);
            if self.set_member_lead {
                let lead_account_id = account_from_member_id(self.lead_id);

                increase_total_balance_issuance_using_account_id(
                    lead_account_id.clone(),
                    1_500_000,
                );

                set_membership_leader(lead_account_id, self.lead_id);
            }
        }

        increase_total_balance_issuance_using_account_id(account_id.clone(), 1_500_000);

        assert_eq!((self.successful_call)(), Ok(()));

        // Approve Proposal
        let council_size = <Runtime as council::Trait>::CouncilSize::get() as u32;
        let mut vote_generator = VoteGenerator::new(self.proposal_id);
        for _i in 0..council_size {
            vote_generator.vote_and_assert_ok(VoteKind::Approve);
        }

        run_to_block(System::block_number() + 1);
    }
}

#[test]
fn text_proposal_execution_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = create_new_members(1)[0];
        let account_id = account_from_member_id(member_id);

        let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
            let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
                member_id: member_id,
                title: b"title".to_vec(),
                description: b"body".to_vec(),
                staking_account_id: Some(account_id.clone()),
                exact_execution_block: None,
            };

            ProposalCodex::create_proposal(
                RawOrigin::Signed(account_id.clone()).into(),
                general_proposal_parameters,
                ProposalDetails::Signal(b"signal".to_vec()),
            )
        })
        .with_member_id(member_id as u64);

        codex_extrinsic_test_fixture.call_extrinsic_and_assert();
    });
}

#[test]
fn funding_request_proposal_execution_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = create_new_members(1)[0];
        let account_id = account_from_member_id(member_id);
        let council_budget = 5_000_000;
        let funding = 5000;

        let target_account_id = account_from_member_id(create_new_members(1)[0]);

        assert!(Council::set_budget(RawOrigin::Root.into(), council_budget).is_ok());

        let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
            let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
                member_id: member_id,
                title: b"title".to_vec(),
                description: b"body".to_vec(),
                staking_account_id: Some(account_id.clone()),
                exact_execution_block: None,
            };

            ProposalCodex::create_proposal(
                RawOrigin::Signed(account_id.clone()).into(),
                general_proposal_parameters,
                ProposalDetails::FundingRequest(vec![common::FundingRequestParameters {
                    amount: funding,
                    account: target_account_id.clone(),
                }]),
            )
        })
        .with_member_id(member_id as u64);

        let starting_balance = Balances::usable_balance(target_account_id.clone());

        codex_extrinsic_test_fixture.call_extrinsic_and_assert();
        run_to_block(86410);

        assert_eq!(
            Balances::usable_balance(target_account_id),
            starting_balance + funding
        );
    });
}

#[test]
fn create_blog_post_proposal_execution_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = create_new_members(1)[0];
        let account_id = account_from_member_id(member_id);
        let council_budget = 5_000_000;

        assert!(Council::set_budget(RawOrigin::Root.into(), council_budget).is_ok());

        let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
            let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
                member_id: member_id,
                title: b"title".to_vec(),
                description: b"body".to_vec(),
                staking_account_id: Some(account_id.clone()),
                exact_execution_block: None,
            };

            ProposalCodex::create_proposal(
                RawOrigin::Signed(account_id.clone()).into(),
                general_proposal_parameters,
                ProposalDetails::CreateBlogPost(vec![0u8], vec![0u8]),
            )
        })
        .with_member_id(member_id as u64);

        assert_eq!(Blog::post_count(), 0);

        codex_extrinsic_test_fixture.call_extrinsic_and_assert();
        run_to_block(86410);

        assert_eq!(Blog::post_count(), 1);
    });
}

#[test]
fn edit_blog_post_proposal_execution_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = create_new_members(1)[0];
        let account_id = account_from_member_id(member_id);
        let council_budget = 5_000_000;

        assert!(Council::set_budget(RawOrigin::Root.into(), council_budget).is_ok());

        let post_id = Blog::post_count();
        Blog::create_post(RawOrigin::Root.into(), vec![0u8], vec![0u8]).unwrap();

        let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
            let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
                member_id: member_id,
                title: b"title".to_vec(),
                description: b"body".to_vec(),
                staking_account_id: Some(account_id.clone()),
                exact_execution_block: None,
            };

            ProposalCodex::create_proposal(
                RawOrigin::Signed(account_id.clone()).into(),
                general_proposal_parameters,
                ProposalDetails::EditBlogPost(post_id, Some(vec![1u8]), None),
            )
        })
        .with_member_id(member_id as u64);

        codex_extrinsic_test_fixture.call_extrinsic_and_assert();
        run_to_block(86410);

        assert!(Blog::post_by_id(post_id) == blog::Post::new(&vec![1u8], &vec![0u8]));
    });
}

#[test]
fn lock_blog_post_proposal_execution_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = create_new_members(1)[0];
        let account_id = account_from_member_id(member_id);
        let council_budget = 5_000_000;

        assert!(Council::set_budget(RawOrigin::Root.into(), council_budget).is_ok());

        let post_id = Blog::post_count();
        Blog::create_post(RawOrigin::Root.into(), vec![0u8], vec![0u8]).unwrap();

        let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
            let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
                member_id: member_id,
                title: b"title".to_vec(),
                description: b"body".to_vec(),
                staking_account_id: Some(account_id.clone()),
                exact_execution_block: None,
            };

            ProposalCodex::create_proposal(
                RawOrigin::Signed(account_id.clone()).into(),
                general_proposal_parameters,
                ProposalDetails::LockBlogPost(post_id),
            )
        })
        .with_member_id(member_id as u64);

        assert_eq!(Blog::post_by_id(post_id).is_locked(), false);

        codex_extrinsic_test_fixture.call_extrinsic_and_assert();
        run_to_block(86410);

        assert_eq!(Blog::post_by_id(post_id).is_locked(), true);
    });
}

#[test]
fn unlock_blog_post_proposal_execution_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = create_new_members(1)[0];
        let account_id = account_from_member_id(member_id);
        let council_budget = 5_000_000;

        assert!(Council::set_budget(RawOrigin::Root.into(), council_budget).is_ok());

        let post_id = Blog::post_count();
        Blog::create_post(RawOrigin::Root.into(), vec![0u8], vec![0u8]).unwrap();
        Blog::lock_post(RawOrigin::Root.into(), post_id).unwrap();

        let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
            let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
                member_id: member_id,
                title: b"title".to_vec(),
                description: b"body".to_vec(),
                staking_account_id: Some(account_id.clone()),
                exact_execution_block: None,
            };

            ProposalCodex::create_proposal(
                RawOrigin::Signed(account_id.clone()).into(),
                general_proposal_parameters,
                ProposalDetails::UnlockBlogPost(post_id),
            )
        })
        .with_member_id(member_id as u64);

        assert_eq!(Blog::post_by_id(0).is_locked(), true);

        codex_extrinsic_test_fixture.call_extrinsic_and_assert();
        run_to_block(86410);

        assert_eq!(Blog::post_by_id(0).is_locked(), false);
    });
}

#[test]
fn veto_proposal_proposal_execution_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = create_new_members(1)[0];
        let account_id = account_from_member_id(member_id);
        let council_budget = 5_000_000;
        assert!(Council::set_budget(RawOrigin::Root.into(), council_budget).is_ok());

        let proposal_id = ProposalsEngine::proposal_count() + 1;
        let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
            let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
                member_id: member_id,
                title: b"title".to_vec(),
                description: b"body".to_vec(),
                staking_account_id: Some(account_id.clone()),
                exact_execution_block: None,
            };

            ProposalCodex::create_proposal(
                RawOrigin::Signed(account_id.clone()).into(),
                general_proposal_parameters,
                ProposalDetails::AmendConstitution(vec![0u8]),
            )
        })
        .with_member_id(member_id as u64);

        codex_extrinsic_test_fixture.call_extrinsic_and_assert();

        assert!(proposals_engine::Proposals::<Runtime>::contains_key(1));

        // new member that will propose veto
        let member_id = create_new_members(1)[0];
        let account_id = account_from_member_id(member_id);

        let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
            let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
                member_id: member_id.into(),
                title: b"title".to_vec(),
                description: b"body".to_vec(),
                staking_account_id: Some(account_id.clone()),
                exact_execution_block: None,
            };

            ProposalCodex::create_proposal(
                RawOrigin::Signed(account_id.clone()).into(),
                general_proposal_parameters,
                ProposalDetails::VetoProposal(proposal_id),
            )
        })
        .with_member_id(member_id as u64)
        .with_expected_proposal_id(2)
        .with_setup_enviroment(false);

        assert!(proposals_engine::Proposals::<Runtime>::contains_key(1));

        codex_extrinsic_test_fixture.call_extrinsic_and_assert();

        assert!(!proposals_engine::Proposals::<Runtime>::contains_key(1));
    });
}

#[test]
fn set_validator_count_proposal_execution_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = create_new_members(1)[0];
        let account_id = account_from_member_id(member_id);

        let new_validator_count = 8;
        assert_eq!(<pallet_staking::ValidatorCount>::get(), 0);

        setup_new_council(0);
        increase_total_balance_issuance_using_account_id(account_id.clone().into(), 1_500_000);

        let staking_account_id: [u8; 32] = [225u8; 32];
        increase_total_balance_issuance_using_account_id(staking_account_id.into(), 1_500_000);
        set_staking_account(
            account_id.clone(),
            staking_account_id.into(),
            member_id as u64,
        );

        let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
            let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
                member_id: member_id,
                title: b"title".to_vec(),
                description: b"body".to_vec(),
                staking_account_id: Some(staking_account_id.into()),
                exact_execution_block: None,
            };

            ProposalCodex::create_proposal(
                RawOrigin::Signed(account_id.clone()).into(),
                general_proposal_parameters,
                ProposalDetails::SetMaxValidatorCount(new_validator_count),
            )
        })
        .disable_setup_enviroment();
        codex_extrinsic_test_fixture.call_extrinsic_and_assert();

        run_to_block(14410);

        assert_eq!(<pallet_staking::ValidatorCount>::get(), new_validator_count);
    });
}

#[test]
fn amend_constitution_proposal_execution_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = create_new_members(1)[0];
        let account_id = account_from_member_id(member_id);

        let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
            let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
                member_id: member_id,
                title: b"title".to_vec(),
                description: b"body".to_vec(),
                staking_account_id: Some(account_id.clone()),
                exact_execution_block: None,
            };

            ProposalCodex::create_proposal(
                RawOrigin::Signed(account_id.clone()).into(),
                general_proposal_parameters,
                ProposalDetails::AmendConstitution(b"Constitution text".to_vec()),
            )
        })
        .with_member_id(member_id as u64);

        codex_extrinsic_test_fixture.call_extrinsic_and_assert();
    });
}

#[test]
fn set_membership_price_proposal_execution_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = create_new_members(1)[0];
        let account_id = account_from_member_id(member_id);
        let membership_price = 100;

        let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
            let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
                member_id: member_id,
                title: b"title".to_vec(),
                description: b"body".to_vec(),
                staking_account_id: Some(account_id.clone()),
                exact_execution_block: None,
            };

            ProposalCodex::create_proposal(
                RawOrigin::Signed(account_id.clone()).into(),
                general_proposal_parameters,
                ProposalDetails::SetMembershipPrice(membership_price),
            )
        })
        .with_member_id(member_id as u64);

        codex_extrinsic_test_fixture.call_extrinsic_and_assert();

        assert_eq!(Membership::membership_price(), membership_price);
    });
}

#[test]
fn set_initial_invitation_balance_proposal_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = create_new_members(1)[0];
        let account_id = account_from_member_id(member_id);
        let initial_invitation_balance = 100;

        let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
            let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
                member_id: member_id,
                title: b"title".to_vec(),
                description: b"body".to_vec(),
                staking_account_id: Some(account_id.clone()),
                exact_execution_block: None,
            };

            ProposalCodex::create_proposal(
                RawOrigin::Signed(account_id.clone()).into(),
                general_proposal_parameters,
                ProposalDetails::SetInitialInvitationBalance(initial_invitation_balance),
            )
        })
        .with_member_id(member_id as u64);

        codex_extrinsic_test_fixture.call_extrinsic_and_assert();

        assert_eq!(
            Membership::initial_invitation_balance(),
            initial_invitation_balance
        );
    });
}

#[test]
fn set_initial_invitation_count_proposal_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = create_new_members(1)[0];
        let account_id = account_from_member_id(member_id);
        let new_default_invite_count = 50;

        let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
            let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
                member_id: member_id,
                title: b"title".to_vec(),
                description: b"body".to_vec(),
                staking_account_id: Some(account_id.clone()),
                exact_execution_block: None,
            };

            ProposalCodex::create_proposal(
                RawOrigin::Signed(account_id.clone()).into(),
                general_proposal_parameters,
                ProposalDetails::SetInitialInvitationCount(new_default_invite_count),
            )
        })
        .with_member_id(member_id as u64);

        codex_extrinsic_test_fixture.call_extrinsic_and_assert();

        run_to_block(86410);

        assert_eq!(
            Membership::initial_invitation_count(),
            new_default_invite_count
        );
    });
}

#[test]
fn set_membership_leader_invitation_quota_proposal_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = create_new_members(1)[0];
        let account_id = account_from_member_id(member_id);
        let new_invite_count = 30;
        let lead_id = create_new_members(1)[0];

        let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
            let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
                member_id: member_id,
                title: b"title".to_vec(),
                description: b"body".to_vec(),
                staking_account_id: Some(account_id.clone()),
                exact_execution_block: None,
            };

            ProposalCodex::create_proposal(
                RawOrigin::Signed(account_id.clone()).into(),
                general_proposal_parameters,
                ProposalDetails::SetMembershipLeadInvitationQuota(new_invite_count),
            )
        })
        .with_member_id(member_id as u64)
        .with_set_member_lead(true)
        .with_lead_id(lead_id);

        codex_extrinsic_test_fixture.call_extrinsic_and_assert();

        run_to_block(86410);

        assert_eq!(Membership::membership(lead_id).invites, new_invite_count);
    });
}

#[test]
fn set_referral_cut_proposal_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = create_new_members(1)[0];
        let account_id = account_from_member_id(member_id);
        let referral_cut = 30;

        let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
            let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
                member_id: member_id,
                title: b"title".to_vec(),
                description: b"body".to_vec(),
                staking_account_id: Some(account_id.clone()),
                exact_execution_block: None,
            };

            ProposalCodex::create_proposal(
                RawOrigin::Signed(account_id.clone()).into(),
                general_proposal_parameters,
                ProposalDetails::SetReferralCut(referral_cut),
            )
        })
        .with_member_id(member_id as u64);

        codex_extrinsic_test_fixture.call_extrinsic_and_assert();

        run_to_block(86410);

        assert_eq!(Membership::referral_cut(), referral_cut);
    });
}

#[test]
fn set_budget_increment_proposal_succeds() {
    initial_test_ext().execute_with(|| {
        let member_id = create_new_members(1)[0];
        let account_id = account_from_member_id(member_id);
        let budget_increment = 500;

        let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
            let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
                member_id: member_id,
                title: b"title".to_vec(),
                description: b"body".to_vec(),
                staking_account_id: Some(account_id.clone()),
                exact_execution_block: None,
            };

            ProposalCodex::create_proposal(
                RawOrigin::Signed(account_id.clone()).into(),
                general_proposal_parameters,
                ProposalDetails::SetCouncilBudgetIncrement(budget_increment),
            )
        })
        .with_member_id(member_id as u64);

        codex_extrinsic_test_fixture.call_extrinsic_and_assert();

        run_to_block(86410);

        assert_eq!(Council::budget_increment(), budget_increment);
    });
}

// We ignore this test because running until the relevant block
// take too long
#[ignore]
#[test]
fn set_councilor_reward_proposal_succeds() {
    initial_test_ext().execute_with(|| {
        let member_id = create_new_members(1)[0];
        let account_id = account_from_member_id(member_id);
        let councilor_reward = 100;

        let codex_extrinsic_test_fixture = CodexProposalTestFixture::default_for_call(|| {
            let general_proposal_parameters = GeneralProposalParameters::<Runtime> {
                member_id: member_id,
                title: b"title".to_vec(),
                description: b"body".to_vec(),
                staking_account_id: Some(account_id.clone()),
                exact_execution_block: None,
            };

            ProposalCodex::create_proposal(
                RawOrigin::Signed(account_id.clone()).into(),
                general_proposal_parameters,
                ProposalDetails::SetCouncilorReward(councilor_reward),
            )
        })
        .with_member_id(member_id as u64);

        codex_extrinsic_test_fixture.call_extrinsic_and_assert();

        run_to_block(202600);

        assert_eq!(Council::councilor_reward(), councilor_reward);
    });
}

#[test]
fn proposal_reactivation_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = create_new_members(1)[0];
        let account_id = account_from_member_id(member_id);

        setup_new_council(0);
        let council_size = <Runtime as council::Trait>::CouncilSize::get() as u32;

        let starting_block = System::block_number();
        // create proposal
        let dummy_proposal = DummyProposalFixture::default()
            .with_voting_period(100)
            .with_constitutionality(2)
            .with_account_id(account_id)
            .with_proposer(member_id);
        let proposal_id = dummy_proposal.create_proposal_and_assert(Ok(1)).unwrap();

        // Approve Proposal
        let mut vote_generator = VoteGenerator::new(proposal_id);
        for _i in 0..council_size {
            vote_generator.vote_and_assert_ok(VoteKind::Approve);
        }

        run_to_block(starting_block + 2);

        // check
        let proposal = ProposalsEngine::proposals(proposal_id);
        assert_eq!(
            proposal.status,
            ProposalStatus::approved(
                ApprovedProposalDecision::PendingConstitutionality,
                starting_block
            )
        );

        // Ensure council was elected
        assert_eq!(
            CouncilManager::<Runtime>::total_voters_count(),
            council_size
        );

        end_idle_period();
        setup_new_council(1);

        run_to_block(System::block_number() + 1);

        let updated_proposal = ProposalsEngine::proposals(proposal_id);

        assert_eq!(updated_proposal.status, ProposalStatus::Active);

        // Ensure council was elected
        assert_eq!(
            CouncilManager::<Runtime>::total_voters_count(),
            council_size
        );
    });
}
