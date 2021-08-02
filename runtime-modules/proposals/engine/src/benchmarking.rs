#![cfg(feature = "runtime-benchmarks")]
use super::*;
use crate::Module as ProposalsEngine;
use balances::Module as Balances;
use core::convert::TryInto;
use council::Module as Council;
use frame_benchmarking::{account, benchmarks};
use frame_support::traits::{Currency, OnFinalize, OnInitialize};
use frame_system::EventRecord;
use frame_system::Module as System;
use frame_system::RawOrigin;
use membership::Module as Membership;
use referendum::Module as Referendum;
use referendum::ReferendumManager;
use sp_runtime::traits::{Bounded, One};
use sp_std::cmp::max;
use sp_std::prelude::*;

type ReferendumInstance = referendum::Instance1;

const SEED: u32 = 0;

fn get_byte(num: u32, byte_number: u8) -> u8 {
    ((num & (0xff << (8 * byte_number))) >> 8 * byte_number) as u8
}

// Method to generate a distintic valid handle
// for a membership. For each index.
fn handle_from_id<T: membership::Config>(id: u32) -> Vec<u8> {
    let min_handle_length = 1;

    let mut handle = vec![];

    for i in 0..4 {
        handle.push(get_byte(id, i));
    }

    while handle.len() < (min_handle_length as usize) {
        handle.push(0u8);
    }

    handle
}

fn assert_last_event<T: Config>(generic_event: <T as Config>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Config>::Event = generic_event.into();
    assert!(
        events.len() > 0,
        "If you are checking for last event there must be at least 1 event"
    );
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

fn assert_in_events<T: Config>(generic_event: <T as Config>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Config>::Event = generic_event.into();

    assert!(
        events.len() > 0,
        "If you are checking for last event there must be at least 1 event"
    );

    assert!(events.iter().any(|event| {
        let EventRecord { event, .. } = event;
        event == &system_event
    }));
}

fn member_funded_account<T: Config + membership::Config>(
    name: &'static str,
    id: u32,
) -> (T::AccountId, T::MemberId) {
    let account_id = account::<T::AccountId>(name, id, SEED);
    let handle = handle_from_id::<T>(id);

    // Give balance for buying membership
    let _ = Balances::<T>::make_free_balance_be(&account_id, T::Balance::max_value());
    assert_eq!(
        Balances::<T>::usable_balance(account_id.clone()),
        T::Balance::max_value()
    );

    let member_id = Membership::<T>::members_created();
    let params = membership::BuyMembershipParameters {
        root_account: account_id.clone(),
        controller_account: account_id.clone(),
        handle: Some(handle),
        metadata: Vec::new(),
        referrer_id: None,
    };

    assert_eq!(
        Balances::<T>::usable_balance(account_id.clone()),
        T::Balance::max_value()
    );
    Membership::<T>::buy_membership(RawOrigin::Signed(account_id.clone()).into(), params).unwrap();

    assert_eq!(
        Membership::<T>::membership(member_id).controller_account,
        account_id
    );

    assert_eq!(
        Membership::<T>::membership(member_id).root_account,
        account_id
    );
    let _ = Balances::<T>::make_free_balance_be(&account_id, T::Balance::max_value());

    Membership::<T>::add_staking_account_candidate(
        RawOrigin::Signed(account_id.clone()).into(),
        member_id,
    )
    .unwrap();

    Membership::<T>::confirm_staking_account(
        RawOrigin::Signed(account_id.clone()).into(),
        member_id,
        account_id.clone(),
    )
    .unwrap();

    (account_id, member_id)
}

fn create_proposal<T: Config + membership::Config>(
    id: u32,
    proposal_number: u32,
    constitutionality: u32,
    grace_period: u32,
) -> (T::AccountId, T::MemberId, T::ProposalId) {
    let (account_id, member_id) = member_funded_account::<T>("member", id);

    let proposal_parameters = ProposalParameters {
        voting_period: T::BlockNumber::from(1),
        grace_period: T::BlockNumber::from(grace_period),
        approval_quorum_percentage: 1,
        approval_threshold_percentage: 1,
        slashing_quorum_percentage: 0,
        slashing_threshold_percentage: 1,
        required_stake: Some(
            T::Balance::max_value() - <T as membership::Config>::CandidateStake::get(),
        ),
        constitutionality,
    };

    let call_code = vec![];

    let proposal_creation_parameters = ProposalCreationParameters {
        account_id: account_id.clone(),
        proposer_id: member_id.clone(),
        proposal_parameters,
        title: vec![0u8],
        description: vec![0u8],
        staking_account_id: Some(account_id.clone()),
        encoded_dispatchable_call_code: call_code.clone(),
        exact_execution_block: None,
    };

    let proposal_id = ProposalsEngine::<T>::create_proposal(proposal_creation_parameters).unwrap();

    assert!(
        Proposals::<T>::contains_key(proposal_id),
        "Proposal not created"
    );
    assert!(
        DispatchableCallCode::<T>::contains_key(proposal_id),
        "Dispatchable code not added"
    );

    assert_eq!(
        ProposalsEngine::<T>::proposal_codes(proposal_id),
        call_code,
        "Dispatchable code does not match"
    );

    assert_eq!(
        ProposalsEngine::<T>::proposal_count(),
        proposal_number,
        "Not correct number of proposals stored"
    );

    // We assume here that active proposals == number of proposals
    assert_eq!(
        ProposalsEngine::<T>::active_proposal_count(),
        proposal_number,
        "Created proposal not active"
    );

    assert_eq!(
        <T as Config>::StakingHandler::current_stake(&account_id),
        T::Balance::max_value() - <T as membership::Config>::CandidateStake::get(),
    );

    (account_id, member_id, proposal_id)
}

fn run_to_block<T: Config + council::Config + referendum::Config<ReferendumInstance>>(
    n: T::BlockNumber,
) {
    while System::<T>::block_number() < n {
        let mut current_block_number = System::<T>::block_number();

        System::<T>::on_finalize(current_block_number);
        ProposalsEngine::<T>::on_finalize(current_block_number);
        Council::<T>::on_finalize(current_block_number);
        Referendum::<T, ReferendumInstance>::on_finalize(current_block_number);

        current_block_number += One::one();
        System::<T>::set_block_number(current_block_number);

        System::<T>::on_initialize(current_block_number);
        ProposalsEngine::<T>::on_initialize(current_block_number);
        Council::<T>::on_initialize(current_block_number);
        Referendum::<T, ReferendumInstance>::on_initialize(current_block_number);
    }
}

fn elect_council<
    T: Config + membership::Config + council::Config + referendum::Config<ReferendumInstance>,
>(
    start_id: u32,
) -> (Vec<(T::AccountId, T::MemberId)>, u32) {
    let council_size = <T as council::Config>::CouncilSize::get();
    let number_of_extra_candidates = <T as council::Config>::MinNumberOfExtraCandidates::get();

    let councilor_stake = <T as council::Config>::MinCandidateStake::get();

    let mut voters = Vec::new();
    let mut candidates = Vec::new();

    for i in
        start_id as usize..start_id as usize + (council_size + number_of_extra_candidates) as usize
    {
        let (account_id, member_id) =
            member_funded_account::<T>("councilor", i.try_into().unwrap());
        Council::<T>::announce_candidacy(
            RawOrigin::Signed(account_id.clone()).into(),
            member_id,
            account_id.clone(),
            account_id.clone(),
            councilor_stake,
        )
        .unwrap();

        candidates.push((account_id, member_id));
        voters.push(member_funded_account::<T>(
            "voter",
            (council_size + number_of_extra_candidates + i as u64)
                .try_into()
                .unwrap(),
        ));
    }

    let current_block = System::<T>::block_number();
    run_to_block::<T>(current_block + <T as council::Config>::AnnouncingPeriodDuration::get());

    let voter_stake = <T as referendum::Config<ReferendumInstance>>::MinimumStake::get();
    let mut council = Vec::new();
    for i in start_id as usize..start_id as usize + council_size as usize {
        council.push(candidates[i].clone());
        let commitment = Referendum::<T, ReferendumInstance>::calculate_commitment(
            &voters[i].0,
            &[0u8],
            &0,
            &candidates[i].1,
        );
        Referendum::<T, ReferendumInstance>::vote(
            RawOrigin::Signed(voters[i].0.clone()).into(),
            commitment,
            voter_stake,
        )
        .unwrap();
    }

    let current_block = System::<T>::block_number();
    run_to_block::<T>(
        current_block + <T as referendum::Config<ReferendumInstance>>::VoteStageDuration::get(),
    );

    for i in start_id as usize..start_id as usize + council_size as usize {
        Referendum::<T, ReferendumInstance>::reveal_vote(
            RawOrigin::Signed(voters[i].0.clone()).into(),
            vec![0u8],
            candidates[i].1.clone(),
        )
        .unwrap();
    }

    let current_block = System::<T>::block_number();
    run_to_block::<T>(
        current_block + <T as referendum::Config<ReferendumInstance>>::RevealStageDuration::get(),
    );

    let council_members = Council::<T>::council_members();
    assert_eq!(
        council_members
            .iter()
            .map(|m| *m.member_id())
            .collect::<Vec<_>>(),
        council.iter().map(|c| c.1).collect::<Vec<_>>()
    );

    (
        council,
        (2 * (council_size + number_of_extra_candidates))
            .try_into()
            .unwrap(),
    )
}

fn create_multiple_finalized_proposals<
    T: Config + membership::Config + council::Config + referendum::Config<ReferendumInstance>,
>(
    number_of_proposals: u32,
    constitutionality: u32,
    vote_kind: VoteKind,
    total_voters: u32,
    grace_period: u32,
) -> (Vec<T::AccountId>, Vec<T::ProposalId>) {
    let (council, last_id): (Vec<(T::AccountId, _)>, _) = elect_council::<T>(0);

    let mut proposers = Vec::new();
    let mut proposals = Vec::new();
    for proposal_number in 1..number_of_proposals + 1 {
        let (proposer_account_id, _, proposal_id) = create_proposal::<T>(
            last_id + proposal_number,
            proposal_number,
            constitutionality,
            grace_period,
        );
        proposers.push(proposer_account_id);
        proposals.push(proposal_id);

        for (voter_id, member_id) in council[0..total_voters.try_into().unwrap()].iter() {
            ProposalsEngine::<T>::vote(
                RawOrigin::Signed(voter_id.clone()).into(),
                *member_id,
                proposal_id,
                vote_kind.clone(),
                vec![0u8],
            )
            .unwrap()
        }
    }

    (proposers, proposals)
}

const MAX_BYTES: u32 = 16384;

benchmarks! {
    // Note: this is the syntax for this macro can't use "+"
    where_clause {
        where T: membership::Config, T: council::Config, T: referendum::Config<ReferendumInstance>
    }

    _ { }

    vote {
        let i in 0 .. MAX_BYTES;

        let (council, last_id) = elect_council::<T>(1);
        let (account_voter_id, member_voter_id) = council[0].clone();
        let (_, _, proposal_id) = create_proposal::<T>(last_id + 1, 1, 0, 0);
        let rationale = vec![0u8; i.try_into().unwrap()];
    }: _ (
            RawOrigin::Signed(account_voter_id),
            member_voter_id,
            proposal_id,
            VoteKind::Approve,
            rationale.clone()
        )
    verify {
        assert!(Proposals::<T>::contains_key(proposal_id), "Proposal should still exist");

        let voting_results = ProposalsEngine::<T>::proposals(proposal_id).voting_results;

        assert_eq!(
          voting_results,
          VotingResults{ approvals: 1, abstentions: 0, rejections: 0, slashes: 0 },
          "There should only be 1 approval"
        );

        assert!(
          VoteExistsByProposalByVoter::<T>::contains_key(proposal_id, member_voter_id),
          "Voter not added to existing voters"
        );

        assert_eq!(
          ProposalsEngine::<T>::vote_by_proposal_by_voter(proposal_id, member_voter_id),
          VoteKind::Approve,
          "Stored vote doesn't match"
        );

        assert_last_event::<T>(
            RawEvent::Voted(member_voter_id, proposal_id, VoteKind::Approve, rationale).into()
        );
    }

    cancel_proposal {
        let i in 1 .. T::MaxLocks::get();

        let (account_id, member_id, proposal_id) = create_proposal::<T>(0, 1, 0, 0);

        for lock_number in 1 .. i {
            let (locked_account_id, _) = member_funded_account::<T>("locked_member", lock_number);
            <T as Config>::StakingHandler::set_stake(&locked_account_id, One::one()).unwrap();
        }

    }: _ (RawOrigin::Signed(account_id.clone()), member_id, proposal_id)
    verify {
        assert!(!Proposals::<T>::contains_key(proposal_id), "Proposal still in storage");

        assert!(
            !DispatchableCallCode::<T>::contains_key(proposal_id),
            "Proposal code still in storage"
        );

        assert_eq!(ProposalsEngine::<T>::active_proposal_count(), 0, "Proposal still active");

        assert_eq!(
            Balances::<T>::usable_balance(account_id),
            T::Balance::max_value() - T::CancellationFee::get() - T::CandidateStake::get(),
            "Balance not slashed"
        );

        assert_last_event::<T>(
            RawEvent::ProposalCancelled(member_id, proposal_id).into()
        );
    }

    veto_proposal {
        let (account_id, _, proposal_id) = create_proposal::<T>(0, 1, 0, 0);
    }: _ (RawOrigin::Root, proposal_id)
    verify {
        assert!(!Proposals::<T>::contains_key(proposal_id), "Proposal still in storage");

        assert!(
            !DispatchableCallCode::<T>::contains_key(proposal_id),
            "Proposal code still in storage"
        );

        assert_eq!(ProposalsEngine::<T>::active_proposal_count(), 0, "Proposal still active");

        assert_eq!(
            Balances::<T>::usable_balance(account_id),
            T::Balance::max_value() - <T as membership::Config>::CandidateStake::get(),
            "Vetoed proposals shouldn't be slashed"
        );

        assert_last_event::<T>(
            RawEvent::ProposalDecisionMade(proposal_id, ProposalDecision::Vetoed).into()
        );
    }

    // We use that branches for decode failing, failing and passing are very similar
    // without any different DB access in each. To use the failing/passing branch
    // we need to include the EncodeProposal trait from codex which depends on engine
    // therefore we should move it to a common crate
    on_initialize_immediate_execution_decode_fails {
        let i in 1 .. T::MaxActiveProposalLimit::get();

        let (proposers, proposals) = create_multiple_finalized_proposals::<T>(
            i,
            0,
            VoteKind::Approve,
            1,
            0,
        );

    }: { ProposalsEngine::<T>::on_initialize(System::<T>::block_number().into()) }
    verify {
        for proposer_account_id in proposers {
            assert_eq!(
                <T as Config>::StakingHandler::current_stake(&proposer_account_id),
                Zero::zero(),
                "Should've unlocked all stake"
            );
        }

        assert_eq!(
            ProposalsEngine::<T>::active_proposal_count(),
            0,
            "Proposals should no longer be active"
        );

        for proposal_id in proposals.iter() {
            assert!(
                !Proposals::<T>::contains_key(proposal_id),
                "Proposals should've been removed"
            );

            assert!(
                !DispatchableCallCode::<T>::contains_key(proposal_id),
                "Dispatchable code should've been removed"
            );
        }

        for proposal_id in proposals.iter() {
            assert_in_events::<T>(
                RawEvent::ProposalExecuted(
                    proposal_id.clone(),
                    ExecutionStatus::failed_execution("Decoding error")).into()
            );
        }
    }

    on_initialize_pending_execution_decode_fails {
        let i in 1 .. T::MaxActiveProposalLimit::get();

        let (proposers, proposals) = create_multiple_finalized_proposals::<T>(
            i,
            0,
            VoteKind::Approve,
            1,
            1,
        );

        run_to_block::<T>(System::<T>::block_number() + One::one());
        let current_block_number = System::<T>::block_number();

        assert_eq!(
            ProposalsEngine::<T>::active_proposal_count(),
            i,
            "Proposals should still be active"
        );

        for proposal_id in proposals.iter() {
            assert!(
                Proposals::<T>::contains_key(proposal_id),
                "All proposals should still be stored"
            );

            assert_eq!(
                ProposalsEngine::<T>::proposals(proposal_id).status,
                ProposalStatus::PendingExecution(current_block_number),
                "Status not updated"
            );

            assert!(
                DispatchableCallCode::<T>::contains_key(proposal_id),
                "All dispatchable call code should still be stored"
            );
        }

        let current_block_number = System::<T>::block_number() + One::one();
        System::<T>::set_block_number(current_block_number);

    }: { ProposalsEngine::<T>::on_initialize(current_block_number) }
    verify {
        for proposer_account_id in proposers {
            assert_eq!(
                <T as Config>::StakingHandler::current_stake(&proposer_account_id),
                Zero::zero(),
                "Should've unlocked all stake"
            );
        }

        assert_eq!(ProposalsEngine::<T>::active_proposal_count(), 0, "Proposals should no longer be active");
        for proposal_id in proposals.iter() {
            assert!(!Proposals::<T>::contains_key(proposal_id), "Proposals should've been removed");
            assert!(!DispatchableCallCode::<T>::contains_key(proposal_id), "Dispatchable code should've been removed");
        }

        for proposal_id in proposals.iter() {
            assert_in_events::<T>(
                RawEvent::ProposalExecuted(
                    proposal_id.clone(),
                    ExecutionStatus::failed_execution("Decoding error")).into()
            );
        }
    }

    on_initialize_approved_pending_constitutionality {
        let i in 1 .. T::MaxActiveProposalLimit::get();

        let (proposers, proposals) = create_multiple_finalized_proposals::<T>(
            i,
            2,
            VoteKind::Approve,
            1,
            1,
        );

    }: { ProposalsEngine::<T>::on_initialize(System::<T>::block_number().into()) }
    verify {
        for proposer_account_id in proposers {
            assert_ne!(
                <T as Config>::StakingHandler::current_stake(&proposer_account_id),
                Zero::zero(),
                "Should've still stake locked"
            );
        }

        for proposal_id in proposals.iter() {
            assert!(
                Proposals::<T>::contains_key(proposal_id),
                "Proposal should still be in the store"
            );
            let proposal = ProposalsEngine::<T>::proposals(proposal_id);
            let status = ProposalStatus::approved(
                ApprovedProposalDecision::PendingConstitutionality,
                System::<T>::block_number()
            );

            assert_eq!(proposal.status, status);
            assert_eq!(proposal.nr_of_council_confirmations, 1);
            assert_in_events::<T>(
                RawEvent::ProposalStatusUpdated(proposal_id.clone(), status).into()
            );
        }
    }

    on_initialize_rejected {
        let i in 1 .. T::MaxActiveProposalLimit::get();

        let (proposers, proposals) = create_multiple_finalized_proposals::<T>(
            i,
            0,
            VoteKind::Reject,
            max(T::CouncilSize::get().try_into().unwrap(), 1),
            0,
        );
    }: { ProposalsEngine::<T>::on_initialize(System::<T>::block_number().into()) }
    verify {
        for proposal_id in proposals.iter() {
            assert!(
                !Proposals::<T>::contains_key(proposal_id),
                "Proposal should not be in store"
            );

            assert!(
                !DispatchableCallCode::<T>::contains_key(proposal_id),
                "Dispatchable should not be in store"
            );

            assert_in_events::<T>(
                RawEvent::ProposalDecisionMade(proposal_id.clone(), ProposalDecision::Rejected)
                    .into()
            );
        }

        assert_eq!(
            ProposalsEngine::<T>::active_proposal_count(),
            0,
            "There should not be any proposal left active"
        );

        for proposer_account_id in proposers {
            assert_eq!(
                <T as Config>::StakingHandler::current_stake(&proposer_account_id),
                Zero::zero(),
                "Shouldn't have any stake locked"
            );
        }
    }

    on_initialize_slashed {
        let i in 1 .. T::MaxActiveProposalLimit::get();

        let (proposers, proposals) = create_multiple_finalized_proposals::<T>(
            i,
            0,
            VoteKind::Slash,
            max(T::CouncilSize::get().try_into().unwrap(), 1),
            0,
        );
    }: { ProposalsEngine::<T>::on_initialize(System::<T>::block_number().into()) }
    verify {
        for proposer_account_id in proposers {
            assert_eq!(
                <T as Config>::StakingHandler::current_stake(&proposer_account_id),
                Zero::zero(),
                "Shouldn't have any stake locked"
            );

            assert_eq!(
                Balances::<T>::usable_balance(&proposer_account_id),
                Zero::zero(),
                "Should've all balance slashed"
            );
        }

        for proposal_id in proposals.iter() {

            assert!(
                !Proposals::<T>::contains_key(proposal_id),
                "Proposal should not be in store"
            );
            assert!(
                !DispatchableCallCode::<T>::contains_key(proposal_id),
                "Dispatchable should not be in store"
            );

            assert_in_events::<T>(
                RawEvent::ProposalDecisionMade(
                    proposal_id.clone(),
                    ProposalDecision::Slashed
                ).into()
            );
        }

        assert_eq!(
            ProposalsEngine::<T>::active_proposal_count(),
            0,
            "There should not be any proposal left active"
        );
    }

    cancel_active_and_pending_proposals {
        let i in 1 .. T::MaxActiveProposalLimit::get();

        let (proposers, proposals) = create_multiple_finalized_proposals::<T>(
            i,
            0,
            VoteKind::Approve,
            max(T::CouncilSize::get().try_into().unwrap(), 1),
            10,
        );
    }: { ProposalsEngine::<T>::cancel_active_and_pending_proposals() }
    verify {
        for proposal_id in proposals.iter() {
            assert!(
                !Proposals::<T>::contains_key(proposal_id),
                "Proposal should not be in store"
            );

            assert!(
                !DispatchableCallCode::<T>::contains_key(proposal_id),
                "Dispatchable should not be in store"
            );

            assert_in_events::<T>(
                RawEvent::ProposalDecisionMade(proposal_id.clone(), ProposalDecision::CanceledByRuntime)
                    .into()
            );
        }

        assert_eq!(
            ProposalsEngine::<T>::active_proposal_count(),
            0,
            "There should not be any proposal left active"
        );

        for proposer_account_id in proposers {
            assert_eq!(
                <T as Config>::StakingHandler::current_stake(&proposer_account_id),
                Zero::zero(),
                "Shouldn't have any stake locked"
            );
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tests::mock::{initial_test_ext, Test};
    use frame_support::assert_ok;

    #[test]
    fn test_vote() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_vote::<Test>());
        });
    }

    #[test]
    fn test_cancel_proposal() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_cancel_proposal::<Test>());
        });
    }

    #[test]
    fn test_veto_proposal() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_veto_proposal::<Test>());
        });
    }

    #[test]
    fn test_on_initialize_immediate_execution_decode_fails() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_on_initialize_immediate_execution_decode_fails::<Test>());
        });
    }

    #[test]
    fn test_on_initialize_approved_pending_constitutionality() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_on_initialize_approved_pending_constitutionality::<Test>());
        });
    }

    #[test]
    fn test_on_initialize_pending_execution_decode_fails() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_on_initialize_pending_execution_decode_fails::<Test>());
        });
    }

    #[test]
    fn test_on_initialize_rejected() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_on_initialize_rejected::<Test>());
        });
    }

    #[test]
    fn test_on_initialize_slashed() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_on_initialize_slashed::<Test>());
        });
    }

    #[test]
    fn test_cancel_active_and_pending_proposals() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_cancel_active_and_pending_proposals::<Test>());
        });
    }
}
