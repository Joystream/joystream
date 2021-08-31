#![allow(clippy::type_complexity)]

#![cfg(feature = "runtime-benchmarks")]
use super::*;
use crate::Module as ProposalsDiscussion;
use balances::Module as Balances;
use council::Module as Council;
use frame_benchmarking::{account, benchmarks};
use frame_support::sp_runtime::traits::Bounded;
use frame_support::traits::{Currency, OnFinalize, OnInitialize};
use frame_system::EventRecord;
use frame_system::Module as System;
use frame_system::RawOrigin;
use membership::Module as Membership;
use referendum::Module as Referendum;
use referendum::ReferendumManager;
use sp_std::convert::TryInto;
use sp_std::prelude::*;

type ReferendumInstance = referendum::Instance1;

const SEED: u32 = 0;

fn get_byte(num: u32, byte_number: u8) -> u8 {
    ((num & (0xff << (8 * byte_number))) >> (8 * byte_number)) as u8
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

fn run_to_block<T: Config + council::Config + referendum::Config<ReferendumInstance>>(
    n: T::BlockNumber,
) {
    while System::<T>::block_number() < n {
        let mut current_block_number = System::<T>::block_number();

        System::<T>::on_finalize(current_block_number);
        ProposalsDiscussion::<T>::on_finalize(current_block_number);
        Council::<T>::on_finalize(current_block_number);
        Referendum::<T, ReferendumInstance>::on_finalize(current_block_number);

        current_block_number += 1u32.into();
        System::<T>::set_block_number(current_block_number);

        System::<T>::on_initialize(current_block_number);
        ProposalsDiscussion::<T>::on_initialize(current_block_number);
        Council::<T>::on_initialize(current_block_number);
        Referendum::<T, ReferendumInstance>::on_initialize(current_block_number);
    }
}

fn assert_last_event<T: Config>(generic_event: <T as Config>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Config>::Event = generic_event.into();
    // compare to the last event record
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

fn member_account<T: common::membership::Config + balances::Config + membership::Config>(
    name: &'static str,
    id: u32,
) -> (T::AccountId, T::MemberId) {
    let account_id = account::<T::AccountId>(name, id, SEED);
    let handle = handle_from_id::<T>(id);

    // Give balance for buying membership
    let _ = Balances::<T>::make_free_balance_be(&account_id, T::Balance::max_value());
    assert_eq!(
        Balances::<T>::usable_balance(&account_id),
        T::Balance::max_value(),
        "Balance not added",
    );

    let params = membership::BuyMembershipParameters {
        root_account: account_id.clone(),
        controller_account: account_id.clone(),
        handle: Some(handle),
        metadata: Vec::new(),
        referrer_id: None,
    };

    Membership::<T>::buy_membership(RawOrigin::Signed(account_id.clone()).into(), params).unwrap();

    let member_id = T::MemberId::from(id.try_into().unwrap());

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

    assert_eq!(
        Membership::<T>::staking_account_id_member_status(account_id.clone()).member_id,
        member_id
    );
    assert!(Membership::<T>::staking_account_id_member_status(account_id.clone()).confirmed,);

    (account_id, member_id)
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
    let last_id = start_id as usize + (council_size + number_of_extra_candidates) as usize;

    for i in start_id as usize..last_id {
        let (account_id, member_id) = member_account::<T>("councilor", i.try_into().unwrap());
        Council::<T>::announce_candidacy(
            RawOrigin::Signed(account_id.clone()).into(),
            member_id,
            account_id.clone(),
            account_id.clone(),
            councilor_stake,
        )
        .unwrap();

        candidates.push((account_id, member_id));
    }

    for i in last_id..last_id + council_size as usize {
        voters.push(member_account::<T>("voter", i.try_into().unwrap()));
    }

    let current_block = System::<T>::block_number();
    run_to_block::<T>(current_block + <T as council::Config>::AnnouncingPeriodDuration::get());

    let voter_stake = <T as referendum::Config<ReferendumInstance>>::MinimumStake::get();
    let mut council = Vec::new();
    for i in 0..council_size as usize {
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

    for i in 0..council_size as usize {
        Referendum::<T, ReferendumInstance>::reveal_vote(
            RawOrigin::Signed(voters[i].0.clone()).into(),
            vec![0u8],
            candidates[i].1,
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

const MAX_BYTES: u32 = 16384;

benchmarks! {
    where_clause {
        where T: balances::Config, T: membership::Config, T: council::Config,
              T: referendum::Config<ReferendumInstance>
    }

    add_post {
        let i in 1 .. T::MaxWhiteListSize::get();

        let j in 0 .. MAX_BYTES;

        // We do this to ignore the id 0 because the `Test` runtime
        // returns 0 as an invalid id but 1 as a valid one
        let (_, _) = member_account::<T>("member", 0);
        let (account_id, caller_member_id) = member_account::<T>("caller_member", 1);

        let mut whitelisted_members = vec![caller_member_id];

        // We start from 2 since we have previously created id 0 and not used it
        // and used id 1 for the caller (see comment above)
        for id in 2 .. i + 1 {
            let (_, member_id) = member_account::<T>("member", id);
            whitelisted_members.push(member_id);
        }

        // Worst case scenario there is a council
        elect_council::<T>(i+1);

        let thread_id = ProposalsDiscussion::<T>::create_thread(
            caller_member_id,
            ThreadMode::Closed(whitelisted_members)
        ).unwrap();

        assert!(ThreadById::<T>::contains_key(thread_id), "Thread not created");

        let text = vec![0u8; j.try_into().unwrap()];

        assert!(Balances::<T>::usable_balance(&account_id) >= T::PostDeposit::get());
    }: _ (RawOrigin::Signed(account_id), caller_member_id, thread_id, text.clone(), true)
    verify {
        let post_id = T::PostId::from(1);

        assert!(PostThreadIdByPostId::<T>::contains_key(thread_id, post_id), "Post not created");
        assert_eq!(
            PostThreadIdByPostId::<T>::get(thread_id, post_id).author_id,
            caller_member_id,
            "Post author isn't correct"
        );

        assert_last_event::<T>(RawEvent::PostCreated(
                post_id,
                caller_member_id,
                thread_id,
                text
            ).into()
        );
    }

    update_post {
        let j in 0 .. MAX_BYTES;

        // We do this to ignore the id 0 because the `Test` runtime
        // returns 0 as an invalid id but 1 as a valid one
        let (_, _) = member_account::<T>("caller_member", 0);
        let (account_id, caller_member_id) = member_account::<T>("caller_member", 1);

        let thread_id = ProposalsDiscussion::<T>::create_thread(
            caller_member_id,
            ThreadMode::Open
        ).unwrap();

        assert!(ThreadById::<T>::contains_key(thread_id), "Thread not created");

        ProposalsDiscussion::<T>::add_post(
            RawOrigin::Signed(account_id.clone()).into(),
            caller_member_id,
            thread_id,
            vec![0u8],
            true
        ).unwrap();

        let post_id = T::PostId::from(1);

        assert!(PostThreadIdByPostId::<T>::contains_key(thread_id, post_id), "Post not created");

        let new_text = vec![0u8; j.try_into().unwrap()];
    }: _ (RawOrigin::Signed(account_id), thread_id, post_id, new_text.clone())
    verify {
        assert_last_event::<T>(RawEvent::PostUpdated(post_id, caller_member_id, thread_id, new_text).into());
    }

    delete_post {
        // We do this to ignore the id 0 because the `Test` runtime
        // returns 0 as an invalid id but 1 as a valid one
        let (_, _) = member_account::<T>("caller_member", 0);
        let (account_id, caller_member_id) = member_account::<T>("caller_member", 1);

        let thread_id = ProposalsDiscussion::<T>::create_thread(
            caller_member_id,
            ThreadMode::Open
        ).unwrap();

        assert!(ThreadById::<T>::contains_key(thread_id), "Thread not created");

        ProposalsDiscussion::<T>::add_post(
            RawOrigin::Signed(account_id.clone()).into(),
            caller_member_id,
            thread_id,
            vec![0u8],
            true
        ).unwrap();

        let post_id = T::PostId::from(1);

        assert!(PostThreadIdByPostId::<T>::contains_key(thread_id, post_id), "Post not created");

    }: _ (RawOrigin::Signed(account_id), caller_member_id, post_id, thread_id, true)
    verify {
        assert!(!PostThreadIdByPostId::<T>::contains_key(thread_id, post_id));
        assert_last_event::<T>(RawEvent::PostDeleted(caller_member_id, thread_id, post_id, true).into());
    }

    change_thread_mode {
        let i in 1 .. T::MaxWhiteListSize::get();

        // We do this to ignore the id 0 because the `Test` runtime
        // returns 0 as an invalid id but 1 as a valid one
        let (_, _) = member_account::<T>("member", 0);
        let (account_id, caller_member_id) = member_account::<T>("caller_member", 1);

        let thread_id = ProposalsDiscussion::<T>::create_thread(
            caller_member_id,
            ThreadMode::Open
        ).unwrap();

        assert!(ThreadById::<T>::contains_key(thread_id), "Thread not created");

        let mut whitelisted_members = vec![caller_member_id];

        // We start from 2 since we have previously created id 0 and not used it
        // and used id 1 for the caller (see comment above)
        for id in 2 .. i + 1 {
            let (_, member_id) = member_account::<T>("member", id);
            whitelisted_members.push(member_id);
        }

        // Worst case scenario there is a council
        elect_council::<T>(i+1);

        let mode = ThreadMode::Closed(whitelisted_members);
    }: _ (RawOrigin::Signed(account_id), caller_member_id, thread_id, mode.clone())
    verify {
        assert_eq!(
            ProposalsDiscussion::<T>::thread_by_id(thread_id).mode,
            mode,
            "Thread not correctly updated"
        );

        assert_last_event::<T>(RawEvent::ThreadModeChanged(
                thread_id,
                mode,
                caller_member_id
            ).into()
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tests::{initial_test_ext, Test};
    use frame_support::assert_ok;

    #[test]
    fn test_add_post() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_add_post::<Test>());
        });
    }

    #[test]
    fn test_update_post() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_update_post::<Test>());
        });
    }

    #[test]
    fn test_change_thread_mode() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_change_thread_mode::<Test>());
        });
    }
}
