#![cfg(feature = "runtime-benchmarks")]

use frame_benchmarking::{account, benchmarks};
use frame_support::storage::StorageMap;
use frame_support::traits::{Currency, Get, OnFinalize, OnInitialize};
use frame_system::{EventRecord, RawOrigin};
use sp_arithmetic::traits::{One, Zero};
use sp_runtime::SaturatedConversion;
use sp_std::boxed::Box;
use sp_std::collections::btree_map::BTreeMap;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::vec;
use sp_std::vec::Vec;

use crate::Module as Bounty;
use balances::Module as Balances;
use common::council::CouncilBudgetManager;
use frame_system::Module as System;
use membership::Module as Membership;

use crate::{
    AssuranceContractType, BalanceOf, Bounties, BountyActor, BountyCreationParameters,
    BountyMilestone, Call, Entries, Event, FundingType, Module, OracleWorkEntryJudgment, Trait,
};

pub fn run_to_block<T: Trait>(target_block: T::BlockNumber) {
    let mut current_block = System::<T>::block_number();
    while current_block < target_block {
        System::<T>::on_finalize(current_block);
        Bounty::<T>::on_finalize(current_block);

        current_block += One::one();
        System::<T>::set_block_number(current_block);

        System::<T>::on_initialize(current_block);
        Bounty::<T>::on_initialize(current_block);
    }
}

fn assert_last_event<T: Trait>(generic_event: <T as Trait>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Trait>::Event = generic_event.into();
    // compare to the last event record
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

fn assert_was_fired<T: Trait>(generic_event: <T as Trait>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Trait>::Event = generic_event.into();

    assert!(events.iter().any(|ev| ev.event == system_event));
}

fn get_byte(num: u32, byte_number: u8) -> u8 {
    ((num & (0xff << (8 * byte_number))) >> 8 * byte_number) as u8
}

// Method to generate a distintic valid handle
// for a membership. For each index.
fn handle_from_id<T: Trait + membership::Trait>(id: u32) -> Vec<u8> {
    let mut handle = vec![];

    for i in 0..4 {
        handle.push(get_byte(id, i));
    }

    handle
}

//defines initial balance
fn initial_balance<T: Trait>() -> T::Balance {
    1000000u32.into()
}

fn member_funded_account<T: Trait + membership::Trait>(
    name: &'static str,
    id: u32,
) -> (T::AccountId, T::MemberId) {
    let account_id = account::<T::AccountId>(name, id, SEED);
    let handle = handle_from_id::<T>(id);

    // Give balance for buying membership
    let _ = Balances::<T>::make_free_balance_be(&account_id, initial_balance::<T>());

    let params = membership::BuyMembershipParameters {
        root_account: account_id.clone(),
        controller_account: account_id.clone(),
        handle: Some(handle),
        metadata: Vec::new(),
        referrer_id: None,
    };

    let new_member_id = Membership::<T>::members_created();

    Membership::<T>::buy_membership(RawOrigin::Signed(account_id.clone()).into(), params).unwrap();

    let _ = Balances::<T>::make_free_balance_be(&account_id, initial_balance::<T>());

    Membership::<T>::add_staking_account_candidate(
        RawOrigin::Signed(account_id.clone()).into(),
        new_member_id,
    )
    .unwrap();

    Membership::<T>::confirm_staking_account(
        RawOrigin::Signed(account_id.clone()).into(),
        new_member_id,
        account_id.clone(),
    )
    .unwrap();

    (account_id, new_member_id)
}

fn announce_entry_and_submit_work<T: Trait + membership::Trait>(
    bounty_id: &T::BountyId,
    index: u32,
) -> T::EntryId {
    let membership_index = 1000 + index;
    let (account_id, member_id) = member_funded_account::<T>("work entrants", membership_index);

    Bounty::<T>::announce_work_entry(
        RawOrigin::Signed(account_id.clone()).into(),
        member_id,
        *bounty_id,
        account_id.clone(),
    )
    .unwrap();

    let entry_id: T::EntryId = Bounty::<T>::entry_count().into();

    let work_data = b"work_data".to_vec();

    Bounty::<T>::submit_work(
        RawOrigin::Signed(account_id.clone()).into(),
        member_id,
        *bounty_id,
        entry_id,
        work_data,
    )
    .unwrap();

    entry_id
}

fn create_max_funded_bounty<T: Trait>(params: BountyCreationParameters<T>) -> T::BountyId {
    let funding_amount = match params.funding_type {
        FundingType::Perpetual { target } => target,
        FundingType::Limited {
            max_funding_amount, ..
        } => max_funding_amount,
    };

    create_funded_bounty::<T>(params.clone(), funding_amount)
}

fn create_min_funded_bounty<T: Trait>(params: BountyCreationParameters<T>) -> T::BountyId {
    let funding_amount = match params.funding_type {
        FundingType::Perpetual { target } => target,
        FundingType::Limited {
            min_funding_amount, ..
        } => min_funding_amount,
    };

    create_funded_bounty::<T>(params.clone(), funding_amount)
}

fn create_funded_bounty<T: Trait>(
    params: BountyCreationParameters<T>,
    funding_amount: BalanceOf<T>,
) -> T::BountyId {
    T::CouncilBudgetManager::set_budget(params.cherry + funding_amount);

    Bounty::<T>::create_bounty(RawOrigin::Root.into(), params, Vec::new()).unwrap();

    let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

    assert!(Bounties::<T>::contains_key(bounty_id));

    Bounty::<T>::fund_bounty(
        RawOrigin::Root.into(),
        BountyActor::Council,
        bounty_id,
        funding_amount,
    )
    .unwrap();

    bounty_id
}

const MAX_BYTES: u32 = 50000;
const SEED: u32 = 0;
const MAX_WORK_ENTRIES: u32 = 100;

benchmarks! {
    where_clause {
        where T: council::Trait,
              T: balances::Trait,
              T: membership::Trait,
              T: Trait,
    }
    _{ }

    create_bounty_by_council {
        let i in 1 .. MAX_BYTES;
        let j in 1 .. T::ClosedContractSizeLimit::get();

        let metadata = vec![0u8].repeat(i as usize);
        let cherry: BalanceOf<T> = 100u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();
        let max_amount: BalanceOf<T> = 1000u32.into();

        T::CouncilBudgetManager::set_budget(cherry);

        let members = (1..=j)
            .map(|id| id.saturated_into())
            .collect::<BTreeSet<_>>();

        let params = BountyCreationParameters::<T>{
            work_period: One::one(),
            judging_period: One::one(),
            cherry,
            entrant_stake,
            funding_type: FundingType::Perpetual{ target: max_amount },
            contract_type: AssuranceContractType::Closed(members),
            ..Default::default()
        };

    }: create_bounty (RawOrigin::Root, params.clone(), metadata.clone())
    verify {
        let bounty_id: T::BountyId = 1u32.into();

        assert!(Bounties::<T>::contains_key(bounty_id));
        assert_eq!(Bounty::<T>::bounty_count(), 1); // Bounty counter was updated.
        assert_last_event::<T>(Event::<T>::BountyCreated(bounty_id, params, metadata).into());
    }

    create_bounty_by_member {
        let i in 1 .. MAX_BYTES;
        let j in 1 .. T::ClosedContractSizeLimit::get();

        let metadata = vec![0u8].repeat(i as usize);
        let cherry: BalanceOf<T> = 100u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();
        let max_amount: BalanceOf<T> = 1000u32.into();

        let (account_id, member_id) = member_funded_account::<T>("member1", 0);

        T::CouncilBudgetManager::set_budget(cherry);

        let members = (1..=j)
            .map(|id| id.saturated_into())
            .collect::<BTreeSet<_>>();

        let params = BountyCreationParameters::<T>{
            work_period: One::one(),
            judging_period: One::one(),
            cherry,
            entrant_stake,
            creator: BountyActor::Member(member_id),
            funding_type: FundingType::Perpetual{ target: max_amount },
            contract_type: AssuranceContractType::Closed(members),
            ..Default::default()
        };

    }: create_bounty (RawOrigin::Signed(account_id), params.clone(), metadata.clone())
    verify {
        let bounty_id: T::BountyId = 1u32.into();

        assert!(Bounties::<T>::contains_key(bounty_id));
        assert_eq!(Bounty::<T>::bounty_count(), 1); // Bounty counter was updated.
        assert_last_event::<T>(Event::<T>::BountyCreated(bounty_id, params, metadata).into());
    }

    cancel_bounty_by_council {
        let cherry: BalanceOf<T> = 100u32.into();
        let max_amount: BalanceOf<T> = 1000u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        T::CouncilBudgetManager::set_budget(cherry);

        let creator = BountyActor::Council;
        let params = BountyCreationParameters::<T>{
            work_period: One::one(),
            judging_period: One::one(),
            cherry,
            creator: creator.clone(),
            // same complexity with limited funding and FundingExpired stage.
            funding_type: FundingType::Perpetual{ target: max_amount },
            entrant_stake,
            ..Default::default()
        };

        Bounty::<T>::create_bounty(RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

        assert!(Bounties::<T>::contains_key(bounty_id));
    }: cancel_bounty(RawOrigin::Root, creator.clone(), bounty_id)
    verify {
        assert!(!Bounties::<T>::contains_key(bounty_id));
        assert_last_event::<T>(Event::<T>::BountyCanceled(bounty_id, creator).into());
    }

    cancel_bounty_by_member {
        let cherry: BalanceOf<T> = 100u32.into();
        let max_amount: BalanceOf<T> = 1000u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        let (account_id, member_id) = member_funded_account::<T>("member1", 0);

        T::CouncilBudgetManager::set_budget(cherry);

        let creator = BountyActor::Member(member_id);

        let params = BountyCreationParameters::<T>{
            work_period: One::one(),
            judging_period: One::one(),
            cherry,
            creator: creator.clone(),
            // same complexity with limited funding and FundingExpired stage.
            funding_type: FundingType::Perpetual{ target: max_amount },
            entrant_stake,
            ..Default::default()
        };

        Bounty::<T>::create_bounty(
            RawOrigin::Signed(account_id.clone()).into(),
            params,
            Vec::new()
        ).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

        assert!(Bounties::<T>::contains_key(bounty_id));
    }: cancel_bounty(RawOrigin::Signed(account_id), creator.clone(), bounty_id)
    verify {
        assert!(!Bounties::<T>::contains_key(bounty_id));
        assert_last_event::<T>(Event::<T>::BountyCanceled(bounty_id, creator).into());
    }

    veto_bounty {
        let max_amount: BalanceOf<T> = 1000u32.into();
        let cherry: BalanceOf<T> = 100u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        T::CouncilBudgetManager::set_budget(cherry);

        let params = BountyCreationParameters::<T>{
            work_period: One::one(),
            judging_period: One::one(),
            funding_type: FundingType::Perpetual{ target: max_amount },
            cherry,
            entrant_stake,
            ..Default::default()
        };

        Bounty::<T>::create_bounty(RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

        assert!(Bounties::<T>::contains_key(bounty_id));
    }: _ (RawOrigin::Root, bounty_id)
    verify {
        assert!(!Bounties::<T>::contains_key(bounty_id));
        assert_last_event::<T>(Event::<T>::BountyVetoed(bounty_id).into());
    }

    fund_bounty_by_member {
        let max_amount: BalanceOf<T> = 100u32.into();
        let cherry: BalanceOf<T> = 100u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        T::CouncilBudgetManager::set_budget(cherry);

        let params = BountyCreationParameters::<T>{
            work_period: One::one(),
            judging_period: One::one(),
            funding_type: FundingType::Perpetual{ target: max_amount },
            cherry,
            entrant_stake,
            ..Default::default()
        };
        // should reach default max bounty funding amount
        let amount: BalanceOf<T> = 100u32.into();

        let (account_id, member_id) = member_funded_account::<T>("member1", 0);

        Bounty::<T>::create_bounty(RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

        assert!(Bounties::<T>::contains_key(bounty_id));
    }: fund_bounty (RawOrigin::Signed(account_id.clone()), BountyActor::Member(member_id), bounty_id, amount)
    verify {
        assert_eq!(
            Balances::<T>::usable_balance(&account_id),
            // included staking account deposit
            initial_balance::<T>() - amount - T::CandidateStake::get()
        );
        assert_last_event::<T>(Event::<T>::BountyMaxFundingReached(bounty_id).into());
    }

    fund_bounty_by_council {
        let max_amount: BalanceOf<T> = 100u32.into();
        let cherry: BalanceOf<T> = 100u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        T::CouncilBudgetManager::set_budget(cherry + max_amount);

        let params = BountyCreationParameters::<T>{
            work_period: One::one(),
            judging_period: One::one(),
            funding_type: FundingType::Perpetual{ target: max_amount },
            cherry,
            entrant_stake,
            ..Default::default()
        };
        // should reach default max bounty funding amount
        let amount: BalanceOf<T> = 100u32.into();

        Bounty::<T>::create_bounty(RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

        assert!(Bounties::<T>::contains_key(bounty_id));
    }: fund_bounty (RawOrigin::Root, BountyActor::Council, bounty_id, amount)
    verify {
        assert_eq!(T::CouncilBudgetManager::get_budget(), Zero::zero());
        assert_last_event::<T>(Event::<T>::BountyMaxFundingReached(bounty_id).into());
    }

    withdraw_funding_by_member {
        let funding_period = 1u32;
        let bounty_amount: BalanceOf<T> = 200u32.into();
        let cherry: BalanceOf<T> = 100u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        T::CouncilBudgetManager::set_budget(cherry);

        let params = BountyCreationParameters::<T>{
            work_period: One::one(),
            judging_period: One::one(),
            funding_type: FundingType::Limited{
                min_funding_amount: bounty_amount,
                max_funding_amount: bounty_amount,
                funding_period: funding_period.into(),
            },
            cherry,
            entrant_stake,
            ..Default::default()
        };
        // should reach default max bounty funding amount
        let amount: BalanceOf<T> = 100u32.into();

        let (account_id, member_id) = member_funded_account::<T>("member1", 0);

        Bounty::<T>::create_bounty(RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

        assert!(Bounties::<T>::contains_key(bounty_id));

        let funder = BountyActor::Member(member_id);

        Bounty::<T>::fund_bounty(
            RawOrigin::Signed(account_id.clone()).into(),
            funder.clone(),
            bounty_id,
            amount
        ).unwrap();

        run_to_block::<T>((funding_period + 1u32).into());

    }: withdraw_funding (RawOrigin::Signed(account_id.clone()), funder, bounty_id)
    verify {
        assert_eq!(
            Balances::<T>::usable_balance(&account_id),
            // included staking account deposit
            initial_balance::<T>() - T::CandidateStake::get() + cherry
        );

        assert_last_event::<T>(Event::<T>::BountyRemoved(bounty_id).into());
    }

    withdraw_funding_by_council {
        let funding_period = 1u32;
        let bounty_amount: BalanceOf<T> = 200u32.into();
        let cherry: BalanceOf<T> = 100u32.into();
        let funding_amount: BalanceOf<T> = 100u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        T::CouncilBudgetManager::set_budget(cherry + funding_amount);

        let params = BountyCreationParameters::<T>{
            work_period: One::one(),
            judging_period: One::one(),
            funding_type: FundingType::Limited{
                min_funding_amount: bounty_amount,
                max_funding_amount: bounty_amount,
                funding_period: funding_period.into(),
            },
            cherry,
            entrant_stake,
            ..Default::default()
        };

        Bounty::<T>::create_bounty(RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

        assert!(Bounties::<T>::contains_key(bounty_id));

        let funder = BountyActor::Council;

        Bounty::<T>::fund_bounty(
            RawOrigin::Root.into(),
            funder.clone(),
            bounty_id,
            funding_amount
        ).unwrap();

        run_to_block::<T>((funding_period + 1u32).into());

    }: withdraw_funding(RawOrigin::Root, funder, bounty_id)
    verify {
        assert_eq!(T::CouncilBudgetManager::get_budget(), cherry + funding_amount);
        assert_last_event::<T>(Event::<T>::BountyRemoved(bounty_id).into());
    }

    announce_work_entry {
        let i in 1 .. T::ClosedContractSizeLimit::get();

        let cherry: BalanceOf<T> = 100u32.into();
        let funding_amount: BalanceOf<T> = 100u32.into();
        let stake: BalanceOf<T> = 100u32.into();

        let member_ids = (0..i)
            .into_iter()
            .map(|id| id.saturated_into())
            .collect::<BTreeSet<T::MemberId>>();

        let contract_type = AssuranceContractType::Closed(member_ids);

        let params = BountyCreationParameters::<T>{
            work_period: One::one(),
            judging_period: One::one(),
            funding_type: FundingType::Perpetual{ target: funding_amount },
            cherry,
            contract_type,
            entrant_stake: stake,
            ..Default::default()
        };

        let bounty_id = create_max_funded_bounty::<T>(params);

        let (account_id, member_id) = member_funded_account::<T>("member1", 1);

    }: _(
        RawOrigin::Signed(account_id.clone()),
        member_id,
        bounty_id,
        account_id.clone()
    )
    verify {
        let entry_id: T::EntryId = Bounty::<T>::entry_count().into();

        assert!(Entries::<T>::contains_key(entry_id));
        assert_last_event::<T>(
            Event::<T>::WorkEntryAnnounced(
                bounty_id,
                entry_id,
                member_id,
                account_id
            ).into()
        );
    }

    withdraw_work_entry {
        let cherry: BalanceOf<T> = 100u32.into();
        let funding_amount: BalanceOf<T> = 100u32.into();
        let stake: BalanceOf<T> = 100u32.into();

        let params = BountyCreationParameters::<T>{
            work_period: One::one(),
            judging_period: One::one(),
            cherry,
            funding_type: FundingType::Perpetual{ target: funding_amount },
            entrant_stake: stake,
            ..Default::default()
        };

        let bounty_id = create_max_funded_bounty::<T>(params);

        let (account_id, member_id) = member_funded_account::<T>("member1", 1);

        Bounty::<T>::announce_work_entry(
            RawOrigin::Signed(account_id.clone()).into(),
            member_id,
            bounty_id,
            account_id.clone()
        ).unwrap();

        let entry_id: T::EntryId = Bounty::<T>::entry_count().into();

    }: _(RawOrigin::Signed(account_id.clone()), member_id, bounty_id, entry_id)
    verify {
        assert!(!Entries::<T>::contains_key(entry_id));
        assert_last_event::<T>(
            Event::<T>::WorkEntryWithdrawn(bounty_id, entry_id, member_id).into()
        );
    }

    submit_work {
        let i in 0 .. MAX_BYTES;
        let work_data = vec![0u8].repeat(i as usize);

        let cherry: BalanceOf<T> = 100u32.into();
        let funding_amount: BalanceOf<T> = 100u32.into();
        let max_amount: BalanceOf<T> = 10000u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();
        let work_period: T::BlockNumber = One::one();
        let judging_period: T::BlockNumber = One::one();
        let funding_period: T::BlockNumber = One::one();

        let params = BountyCreationParameters::<T>{
            work_period,
            judging_period,
            cherry,
            funding_type: FundingType::Limited{
                min_funding_amount: funding_amount,
                max_funding_amount: max_amount,
                funding_period
            },
            entrant_stake,
            ..Default::default()
        };

        let bounty_id = create_min_funded_bounty::<T>(params);

        run_to_block::<T>((funding_period + One::one()).into());

        let bounty = Bounty::<T>::bounties(bounty_id);
        assert!(matches!(bounty.milestone, BountyMilestone::Created { has_contributions: true, ..}));

        let (account_id, member_id) = member_funded_account::<T>("member1", 1);

        Bounty::<T>::announce_work_entry(
            RawOrigin::Signed(account_id.clone()).into(),
            member_id,
            bounty_id,
            account_id.clone()
        ).unwrap();

        let entry_id: T::EntryId = Bounty::<T>::entry_count().into();

    }: _(RawOrigin::Signed(account_id.clone()), member_id, bounty_id, entry_id, work_data.clone())
    verify {
        let entry = Bounty::<T>::entries(entry_id);

        assert!(entry.work_submitted);
        assert_last_event::<T>(
            Event::<T>::WorkSubmitted(bounty_id, entry_id, member_id, work_data).into()
        );
    }

    submit_oracle_judgment_by_council_all_winners {
        let i in 1 .. MAX_WORK_ENTRIES;

        let work_period: T::BlockNumber = One::one();
        let cherry: BalanceOf<T> = 100u32.into();
        let funding_amount: BalanceOf<T> = 10000000u32.into();
        let oracle = BountyActor::Council;
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        let params = BountyCreationParameters::<T> {
            work_period,
            judging_period: One::one(),
            creator: BountyActor::Council,
            cherry,
            entrant_stake,
            funding_type: FundingType::Perpetual{ target: funding_amount },
            oracle: oracle.clone(),
            ..Default::default()
        };

        let bounty_id = create_max_funded_bounty::<T>(params);

        let entry_ids = (0..i)
            .into_iter()
            .map(|i| { announce_entry_and_submit_work::<T>(&bounty_id, i)})
            .collect::<Vec<_>>();

        let winner_reward: BalanceOf<T> = (funding_amount / i.into()).into();
        let correction = funding_amount - winner_reward * i.into(); // for total sum = 100%
        let judgment = entry_ids
            .iter()
            .map(|entry_id| {
                let corrected_winner_reward = if *entry_id == One::one() {
                    winner_reward + correction
                } else {
                    winner_reward
                };

                (*entry_id, OracleWorkEntryJudgment::Winner {reward : corrected_winner_reward})
            })
            .collect::<BTreeMap<_, _>>();

        run_to_block::<T>((work_period + One::one()).into());

    }: submit_oracle_judgment(RawOrigin::Root, oracle.clone(), bounty_id, judgment.clone())
    verify {
        for entry_id in entry_ids {
            let entry = Bounty::<T>::entries(entry_id);
            let corrected_winner_reward = if entry_id == One::one() {
                    winner_reward + correction
                } else {
                    winner_reward
                };
            assert_eq!(
                entry.oracle_judgment_result,
                Some(OracleWorkEntryJudgment::Winner {reward : corrected_winner_reward})
            );
        }
        assert_last_event::<T>(
            Event::<T>::OracleJudgmentSubmitted(bounty_id, oracle, judgment).into()
        );
    }

    submit_oracle_judgment_by_council_all_rejected {
        let i in 1 .. MAX_WORK_ENTRIES;

        let work_period: T::BlockNumber = One::one();
        let cherry: BalanceOf<T> = 100u32.into();
        let funding_amount: BalanceOf<T> = 100u32.into();
        let oracle = BountyActor::Council;
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        let params = BountyCreationParameters::<T> {
            work_period,
            judging_period: One::one(),
            creator: BountyActor::Council,
            cherry,
            entrant_stake,
            funding_type: FundingType::Perpetual{ target: funding_amount },
            oracle: oracle.clone(),
            ..Default::default()
        };

        let bounty_id = create_max_funded_bounty::<T>(params);

        let entry_ids = (0..i)
            .into_iter()
            .map(|i| { announce_entry_and_submit_work::<T>(&bounty_id, i)})
            .collect::<Vec<_>>();

        let judgment = entry_ids.iter()
            .map(|entry_id| (*entry_id, OracleWorkEntryJudgment::Rejected))
            .collect::<BTreeMap<_, _>>();

        run_to_block::<T>((work_period + One::one()).into());

    }: submit_oracle_judgment(RawOrigin::Root, oracle.clone(), bounty_id, judgment.clone())
    verify {
        for entry_id in entry_ids {
            assert!(!<Entries<T>>::contains_key(entry_id));
        }
        assert_last_event::<T>(
            Event::<T>::OracleJudgmentSubmitted(bounty_id, oracle, judgment).into()
        );
    }

    submit_oracle_judgment_by_member_all_winners {
        let i in 1 .. MAX_WORK_ENTRIES;

        let work_period: T::BlockNumber = One::one();
        let cherry: BalanceOf<T> = 100u32.into();
        let funding_amount: BalanceOf<T> = 10000000u32.into();
        let work_period: T::BlockNumber = One::one();
        let (oracle_account_id, oracle_member_id) = member_funded_account::<T>("oracle", 1);
        let oracle = BountyActor::Member(oracle_member_id);
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        let params = BountyCreationParameters::<T> {
            work_period,
            judging_period: One::one(),
            creator: BountyActor::Council,
            cherry,
            entrant_stake,
            funding_type: FundingType::Perpetual{ target: funding_amount },
            oracle: oracle.clone(),
            ..Default::default()
        };

        let bounty_id = create_max_funded_bounty::<T>(params);

        let entry_ids = (0..i)
            .into_iter()
            .map(|i| { announce_entry_and_submit_work::<T>(&bounty_id, i)})
            .collect::<Vec<_>>();

        let winner_reward: BalanceOf<T> = (funding_amount / i.into()).into();
        let correction = funding_amount - winner_reward * i.into(); // for total sum = 100%
        let judgment = entry_ids
            .iter()
            .map(|entry_id| {
                let corrected_winner_reward = if *entry_id == One::one() {
                    winner_reward + correction
                } else {
                    winner_reward
                };

                (*entry_id, OracleWorkEntryJudgment::Winner {reward : corrected_winner_reward})
            })
            .collect::<BTreeMap<_, _>>();

        run_to_block::<T>((work_period + One::one()).into());

    }: submit_oracle_judgment(
        RawOrigin::Signed(oracle_account_id),
        oracle.clone(),
        bounty_id,
        judgment.clone()
    )
    verify {
        for entry_id in entry_ids {
            let entry = Bounty::<T>::entries(entry_id);
            let corrected_winner_reward = if entry_id == One::one() {
                    winner_reward + correction
                } else {
                    winner_reward
                };
            assert_eq!(
                entry.oracle_judgment_result,
                Some(OracleWorkEntryJudgment::Winner {reward : corrected_winner_reward})
            );
        }
        assert_last_event::<T>(
            Event::<T>::OracleJudgmentSubmitted(bounty_id, oracle, judgment).into()
        );
    }

    submit_oracle_judgment_by_member_all_rejected {
        let i in 1 .. MAX_WORK_ENTRIES;

        let work_period: T::BlockNumber = One::one();
        let cherry: BalanceOf<T> = 100u32.into();
        let funding_amount: BalanceOf<T> = 100u32.into();
        let work_period: T::BlockNumber = One::one();
        let (oracle_account_id, oracle_member_id) = member_funded_account::<T>("oracle", 1);
        let oracle = BountyActor::Member(oracle_member_id);
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        let params = BountyCreationParameters::<T> {
            work_period,
            judging_period: One::one(),
            creator: BountyActor::Council,
            cherry,
            entrant_stake,
            funding_type: FundingType::Perpetual{ target: funding_amount },
            oracle: oracle.clone(),
            ..Default::default()
        };

        let bounty_id = create_max_funded_bounty::<T>(params);

        let entry_ids = (0..i)
            .into_iter()
            .map(|i| { announce_entry_and_submit_work::<T>(&bounty_id, i)})
            .collect::<Vec<_>>();

        let judgment = entry_ids.iter()
            .map(|entry_id| (*entry_id, OracleWorkEntryJudgment::Rejected))
            .collect::<BTreeMap<_, _>>();

        run_to_block::<T>((work_period + One::one()).into());

    }: submit_oracle_judgment(
        RawOrigin::Signed(oracle_account_id),
        oracle.clone(),
        bounty_id,
        judgment.clone()
    )
    verify {
        for entry_id in entry_ids {
            assert!(!<Entries<T>>::contains_key(entry_id));
        }
        assert_last_event::<T>(
            Event::<T>::OracleJudgmentSubmitted(bounty_id, oracle, judgment).into()
        );
    }

    withdraw_work_entrant_funds {
        let work_period: T::BlockNumber = One::one();
        let cherry: BalanceOf<T> = 100u32.into();
        let funding_amount: BalanceOf<T> = 100u32.into();
        let work_period: T::BlockNumber = One::one();
        let (oracle_account_id, oracle_member_id) = member_funded_account::<T>("oracle", 1);
        let oracle = BountyActor::Member(oracle_member_id);
        let stake: BalanceOf<T> = 100u32.into();
        let creator = BountyActor::Council;

        let params = BountyCreationParameters::<T> {
            work_period,
            judging_period: One::one(),
            creator: creator.clone(),
            cherry,
            funding_type: FundingType::Perpetual{ target: funding_amount },
            oracle: oracle.clone(),
            entrant_stake: stake,
            ..Default::default()
        };

        let bounty_id = create_max_funded_bounty::<T>(params);

        let (work_account_id, work_member_id) = member_funded_account::<T>("work entrants", 0);

        Bounty::<T>::announce_work_entry(
            RawOrigin::Signed(work_account_id.clone()).into(),
            work_member_id,
            bounty_id,
            work_account_id.clone(),
        )
        .unwrap();

        let entry_id: T::EntryId = Bounty::<T>::entry_count().into();

        let work_data = b"work_data".to_vec();
        Bounty::<T>::submit_work(
            RawOrigin::Signed(work_account_id.clone()).into(),
            work_member_id,
            bounty_id,
            entry_id,
            work_data,
        )
        .unwrap();

        let winner_reward: BalanceOf<T> = funding_amount;
        let judgment = vec![entry_id].iter()
            .map(|entry_id| (*entry_id, OracleWorkEntryJudgment::Winner {reward : winner_reward}))
            .collect::<BTreeMap<_, _>>();

        run_to_block::<T>((work_period + One::one()).into());

        Bounty::<T>::submit_oracle_judgment(
            RawOrigin::Signed(oracle_account_id).into(),
            oracle.clone(),
            bounty_id,
            judgment.clone()
        ).unwrap();

    }: _ (RawOrigin::Signed(work_account_id), work_member_id, bounty_id, entry_id)
    verify {
        assert!(!<Entries<T>>::contains_key(entry_id));
        assert_was_fired::<T>(
            Event::<T>::WorkEntrantFundsWithdrawn(bounty_id, entry_id, work_member_id).into()
        );
        assert_last_event::<T>(Event::<T>::BountyRemoved(bounty_id).into());
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tests::mocks::{build_test_externalities, Test};
    use frame_support::assert_ok;

    #[test]
    fn create_bounty_by_council() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_create_bounty_by_council::<Test>());
        });
    }

    #[test]
    fn create_bounty_by_member() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_create_bounty_by_member::<Test>());
        });
    }

    #[test]
    fn cancel_bounty_by_council() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_cancel_bounty_by_council::<Test>());
        });
    }

    #[test]
    fn cancel_bounty_by_member() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_cancel_bounty_by_member::<Test>());
        });
    }

    #[test]
    fn veto_bounty() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_veto_bounty::<Test>());
        });
    }

    #[test]
    fn fund_bounty_by_member() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_fund_bounty_by_member::<Test>());
        });
    }

    #[test]
    fn fund_bounty_by_council() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_fund_bounty_by_council::<Test>());
        });
    }

    #[test]
    fn withdraw_funding_by_member() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_withdraw_funding_by_member::<Test>());
        });
    }

    #[test]
    fn withdraw_funding_by_council() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_withdraw_funding_by_council::<Test>());
        });
    }

    #[test]
    fn announce_work_entry() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_announce_work_entry::<Test>());
        });
    }

    #[test]
    fn withdraw_work_entry() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_withdraw_work_entry::<Test>());
        });
    }

    #[test]
    fn submit_work() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_submit_work::<Test>());
        });
    }

    #[test]
    fn submit_oracle_judgment_by_council_all_winners() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_submit_oracle_judgment_by_council_all_winners::<Test>());
        });
    }

    #[test]
    fn submit_oracle_judgment_by_council_all_rejected() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_submit_oracle_judgment_by_council_all_rejected::<Test>());
        });
    }

    #[test]
    fn submit_oracle_judgment_by_member_all_winners() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_submit_oracle_judgment_by_member_all_winners::<Test>());
        });
    }

    #[test]
    fn submit_oracle_judgment_by_member_all_rejected() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_submit_oracle_judgment_by_member_all_rejected::<Test>());
        });
    }

    #[test]
    fn withdraw_work_entrant_funds() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_withdraw_work_entrant_funds::<Test>());
        });
    }
}
