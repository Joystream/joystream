#![cfg(feature = "runtime-benchmarks")]
use super::*;
use crate::Module as ProposalsEngine;
use core::convert::TryInto;
use frame_benchmarking::{account, benchmarks};
use governance::council::Module as Council;
use membership::Module as Membership;
use sp_std::cmp::min;
use sp_std::prelude::*;
use system as frame_system;
use system::EventRecord;
use system::Module as System;
use system::RawOrigin;

const SEED: u32 = 0;

fn get_byte(num: u32, byte_number: u8) -> u8 {
    ((num & (0xff << (8 * byte_number))) >> 8 * byte_number) as u8
}

// Method to generate a distintic valid handle
// for a membership. For each index.
fn handle_from_id<T: membership::Trait>(id: u32) -> Vec<u8> {
    let min_handle_length = Membership::<T>::min_handle_length();

    let mut handle = vec![];

    for i in 0..min(Membership::<T>::max_handle_length().try_into().unwrap(), 4) {
        handle.push(get_byte(id, i));
    }

    while handle.len() < (min_handle_length as usize) {
        handle.push(0u8);
    }

    handle
}

fn assert_last_event<T: Trait>(generic_event: <T as Trait>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Trait>::Event = generic_event.into();
    // compare to the last event record
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

fn member_account<T: membership::Trait>(
    name: &'static str,
    id: u32,
) -> (T::AccountId, T::MemberId) {
    let account_id = account::<T::AccountId>(name, id, SEED);
    let handle = handle_from_id::<T>(id);

    let authority_account = account::<T::AccountId>(name, 0, SEED);

    Membership::<T>::set_screening_authority(RawOrigin::Root.into(), authority_account.clone())
        .unwrap();

    Membership::<T>::add_screened_member(
        RawOrigin::Signed(authority_account.clone()).into(),
        account_id.clone(),
        Some(handle),
        None,
        None,
    )
    .unwrap();

    (account_id, T::MemberId::from(id.try_into().unwrap()))
}

const MAX_BYTES: u32 = 16384;

benchmarks! {
    where_clause {
        where T: governance::council::Trait
    }

    _ { }

    vote {
        let i in 0 .. MAX_BYTES;

        let (account_id, member_id) = member_account::<T>("member", 0);

        let proposal_parameters = ProposalParameters {
            voting_period: T::BlockNumber::from(1),
            grace_period: Zero::zero(),
            approval_quorum_percentage: 1,
            approval_threshold_percentage: 1,
            slashing_quorum_percentage: 0,
            slashing_threshold_percentage: 1,
            required_stake: None,
            constitutionality: 0,
        };

        let proposal_creation_parameters = ProposalCreationParameters {
            account_id,
            proposer_id: member_id,
            proposal_parameters,
            title: vec![0u8],
            description: vec![0u8],
            staking_account_id: None,
            encoded_dispatchable_call_code: vec![0u8],
            exact_execution_block: None,
        };

        let proposal_id =
            ProposalsEngine::<T>::create_proposal(proposal_creation_parameters).unwrap();
        assert!(Proposals::<T>::contains_key(proposal_id), "Proposal not created");
        assert!(DispatchableCallCode::<T>::contains_key(proposal_id), "Dispatchable code not added");
        assert_eq!(ProposalsEngine::<T>::proposal_codes(proposal_id), vec![0u8], "Dispatchable code does not match");
        assert_eq!(ProposalsEngine::<T>::proposal_count(), 1, "Not correct number of proposals stored");
        assert_eq!(ProposalsEngine::<T>::active_proposal_count(), 1, "Created proposal not active");

        let (account_voter_id, member_voter_id) = member_account::<T>("voter", 1);

        Council::<T>::set_council(RawOrigin::Root.into(), vec![account_voter_id.clone()]).unwrap();
    }: _ (
            RawOrigin::Signed(account_voter_id),
            member_voter_id,
            proposal_id,
            VoteKind::Approve,
            vec![0u8; i.try_into().unwrap()]
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

          assert_last_event::<T>(RawEvent::Voted(member_voter_id, proposal_id, VoteKind::Approve).into());
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
}
