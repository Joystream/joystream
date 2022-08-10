#![cfg(feature = "runtime-benchmarks")]

use crate::{
    AssuranceContractType, BalanceOf, Bounties, BountyActor, BountyCreationParameters,
    BountyMilestone, Call, Config, Entries, Event, FundingType, Module as Bounty,
    OracleWorkEntryJudgment, Pallet,
};
use balances::Pallet as Balances;
use common::council::CouncilBudgetManager;
use core::convert::TryFrom;
use core::convert::TryInto;
use frame_benchmarking::{account, benchmarks};
use frame_support::storage::{StorageDoubleMap, StorageMap};
use frame_support::traits::{Currency, Get, OnFinalize, OnInitialize};
use frame_system::Pallet as System;
use frame_system::{EventRecord, RawOrigin};
use membership::Module as Membership;
use sp_arithmetic::traits::{One, Zero};
use sp_runtime::{Perbill, SaturatedConversion};
use sp_std::collections::btree_map::BTreeMap;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::vec;
use sp_std::vec::Vec;

pub fn run_to_block<T: Config>(target_block: T::BlockNumber) {
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

fn assert_last_event<T: Config>(generic_event: <T as Config>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Config>::Event = generic_event.into();
    // compare to the last event record
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

fn assert_was_fired<T: Config>(generic_event: <T as Config>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Config>::Event = generic_event.into();

    assert!(events.iter().any(|ev| ev.event == system_event));
}

fn get_byte(num: u32, byte_number: u8) -> u8 {
    ((num & (0xff << (8 * byte_number))) >> (8 * byte_number) as u8)
        .try_into()
        .unwrap()
}

// Method to generate a distintic valid handle
// for a membership. For each index.
fn handle_from_id<T: Config + membership::Config>(id: u32) -> Vec<u8> {
    let mut handle = vec![];

    for i in 0..4 {
        handle.push(get_byte(id, i));
    }

    handle
}

//defines initial balance
fn initial_balance<T: Config + membership::Config>() -> T::Balance {
    T::DefaultMembershipPrice::get()
        + T::CandidateStake::get()
        + T::FunderStateBloatBondAmount::get()
        + T::CreatorStateBloatBondAmount::get()
        + T::MinWorkEntrantStake::get()
        + 1000000u32.into()
}

fn member_funded_account<T: Config + membership::Config>(
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

fn announce_entry_and_submit_work<T: Config + membership::Config>(
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
        Vec::new(),
    )
    .unwrap();

    let entry_id: T::EntryId = Bounty::<T>::entry_count().into();

    let work_data = b"work_data".to_vec();

    Bounty::<T>::submit_work(
        RawOrigin::Signed(account_id).into(),
        member_id,
        *bounty_id,
        entry_id,
        work_data,
    )
    .unwrap();

    entry_id
}

fn create_funded_bounty<T: Config>(params: BountyCreationParameters<T>) -> T::BountyId {
    let funding_amount = match params.funding_type {
        FundingType::Perpetual { target } => target,
        FundingType::Limited { target, .. } => target,
    };

    T::CouncilBudgetManager::set_budget(
        params.cherry
            + params.oracle_reward
            + funding_amount
            + T::FunderStateBloatBondAmount::get()
            + T::CreatorStateBloatBondAmount::get(),
    );

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
        where T: council::Config,
              T: balances::Config,
              T: membership::Config,
              T: Config,
    }

    create_bounty_by_council {
        let i in 1 .. MAX_BYTES;
        let j in 1 .. T::ClosedContractSizeLimit::get();

        let metadata = vec![0u8].repeat(i as usize);
        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();
        let max_amount: BalanceOf<T> = 1000u32.into();

        T::CouncilBudgetManager::set_budget(
            cherry
            + oracle_reward
            + T::CreatorStateBloatBondAmount::get());

        let members = (1..=j)
            .map(|id| id.saturated_into())
            .collect::<BTreeSet<_>>();

        let params = BountyCreationParameters::<T>{
            cherry,
            oracle_reward,
            entrant_stake,
            funding_type: FundingType::Perpetual{ target: max_amount },
            contract_type: AssuranceContractType::Closed(members),
            ..Default::default()
        };

    }: create_bounty (RawOrigin::Root, params.clone(), metadata.clone())
    verify {
        let bounty_id: T::BountyId = 1u32.into();

        assert!(Bounties::<T>::contains_key(bounty_id));
        // Bounty counter was updated.
        assert_eq!(Bounty::<T>::bounty_count(), 1);
        assert_last_event::<T>(
            Event::<T>::BountyCreated(bounty_id, params, metadata).into());
    }

    create_bounty_by_member {
        let i in 1 .. MAX_BYTES;
        let j in 1 .. T::ClosedContractSizeLimit::get();

        let metadata = vec![0u8].repeat(i as usize);
        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();
        let max_amount: BalanceOf<T> = 1000u32.into();

        let (account_id, member_id) = member_funded_account::<T>("member1", 0);

        T::CouncilBudgetManager::set_budget(
            cherry
            + T::CreatorStateBloatBondAmount::get());

        let members = (1..=j)
            .map(|id| id.saturated_into())
            .collect::<BTreeSet<_>>();

        let params = BountyCreationParameters::<T>{
            cherry,
            oracle_reward,
            entrant_stake,
            creator: BountyActor::Member(member_id),
            funding_type: FundingType::Perpetual{ target: max_amount },
            contract_type: AssuranceContractType::Closed(members),
            ..Default::default()
        };

    }: create_bounty (
        RawOrigin::Signed(account_id), params.clone(), metadata.clone())
    verify {
        let bounty_id: T::BountyId = 1u32.into();

        assert!(Bounties::<T>::contains_key(bounty_id));
        // Bounty counter was updated.
        assert_eq!(Bounty::<T>::bounty_count(), 1);
        assert_last_event::<T>(
            Event::<T>::BountyCreated(bounty_id, params, metadata).into());
    }

    terminate_bounty_w_oracle_reward_funding_expired {
        let funding_period = 1u32;
        let bounty_amount: BalanceOf<T> = 200u32.into();
        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();
        let oracle = BountyActor::Council;
        let creator = BountyActor::Council;
        T::CouncilBudgetManager::set_budget(
            cherry
            + oracle_reward
            + T::CreatorStateBloatBondAmount::get());

        let params = BountyCreationParameters::<T>{
            funding_type: FundingType::Limited{
                target: bounty_amount,
                funding_period: funding_period.into(),
            },
            cherry,
            oracle_reward,
            oracle: oracle.clone(),
            creator: creator.clone(),
            entrant_stake,
            ..Default::default()
        };
        // should reach default max bounty funding amount
        let amount: BalanceOf<T> = 100u32.into();

        let (account_id, member_id) = member_funded_account::<T>("member1", 0);

        Bounty::<T>::create_bounty(
            RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

        run_to_block::<T>((funding_period + 1u32).into());
    }: terminate_bounty(RawOrigin::Root, bounty_id)
    verify {
        assert!(Bounties::<T>::contains_key(bounty_id));
        assert_last_event::<T>(
            Event::<T>::BountyTerminated(
                bounty_id,
                BountyActor::Council,
                creator,
                oracle).into());
    }

    terminate_bounty_wo_oracle_reward_funding_expired {
        let funding_period = 1u32;
        let bounty_amount: BalanceOf<T> = 200u32.into();
        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 0u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();
        let oracle = BountyActor::Council;
        let creator = BountyActor::Council;
        T::CouncilBudgetManager::set_budget(
            cherry
            + oracle_reward
            + T::CreatorStateBloatBondAmount::get());

        let params = BountyCreationParameters::<T>{
            funding_type: FundingType::Limited{
                target: bounty_amount,
                funding_period: funding_period.into(),
            },
            cherry,
            oracle_reward,
            oracle,
            creator,
            entrant_stake,
            ..Default::default()
        };
        // should reach default max bounty funding amount
        let amount: BalanceOf<T> = 100u32.into();

        let (account_id, member_id) = member_funded_account::<T>("member1", 0);

        Bounty::<T>::create_bounty(
            RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

        run_to_block::<T>((funding_period + 1u32).into());
    }: terminate_bounty(RawOrigin::Root, bounty_id)
    verify {
        assert!(!Bounties::<T>::contains_key(bounty_id));
        assert_last_event::<T>(
            Event::<T>::BountyRemoved(
                bounty_id).into());
    }

    terminate_bounty_w_oracle_reward_wo_funds_funding {
        let funding_period = 1u32;
        let bounty_amount: BalanceOf<T> = 200u32.into();
        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();
        let oracle = BountyActor::Council;
        let creator = BountyActor::Council;
        T::CouncilBudgetManager::set_budget(
            cherry
            + oracle_reward
            + T::CreatorStateBloatBondAmount::get());

        let params = BountyCreationParameters::<T>{
            funding_type: FundingType::Limited{
                target: bounty_amount,
                funding_period: funding_period.into(),
            },
            cherry,
            oracle_reward,
            oracle: oracle.clone(),
            creator: creator.clone(),
            entrant_stake,
            ..Default::default()
        };
        // should reach default max bounty funding amount
        let amount: BalanceOf<T> = 100u32.into();

        let (account_id, member_id) = member_funded_account::<T>("member1", 0);

        Bounty::<T>::create_bounty(
            RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

    }: terminate_bounty(RawOrigin::Root, bounty_id)
    verify {
        assert!(Bounties::<T>::contains_key(bounty_id));
        assert_last_event::<T>(
            Event::<T>::BountyTerminated(
                bounty_id,
                BountyActor::Council,
                creator,
                oracle).into());
    }

    terminate_bounty_wo_oracle_reward_wo_funds_funding {
        let funding_period = 1u32;
        let bounty_amount: BalanceOf<T> = 200u32.into();
        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 0u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();
        let oracle = BountyActor::Council;
        let creator = BountyActor::Council;
        T::CouncilBudgetManager::set_budget(
            cherry
            + oracle_reward
            + T::CreatorStateBloatBondAmount::get());

        let params = BountyCreationParameters::<T>{
            funding_type: FundingType::Limited{
                target: bounty_amount,
                funding_period: funding_period.into(),
            },
            cherry,
            oracle_reward,
            oracle,
            creator,
            entrant_stake,
            ..Default::default()
        };
        // should reach default max bounty funding amount
        let amount: BalanceOf<T> = 100u32.into();

        let (account_id, member_id) = member_funded_account::<T>("member1", 0);

        Bounty::<T>::create_bounty(
            RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

    }: terminate_bounty(RawOrigin::Root, bounty_id)
    verify {
        assert!(!Bounties::<T>::contains_key(bounty_id));
        assert_last_event::<T>(
            Event::<T>::BountyRemoved(
                bounty_id).into());
    }

    terminate_bounty_w_oracle_reward_w_funds_funding {
        let funding_period = 1u32;
        let bounty_amount: BalanceOf<T> = 200u32.into();
        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();
        let oracle = BountyActor::Council;
        let creator = BountyActor::Council;
        T::CouncilBudgetManager::set_budget(
            cherry
            + oracle_reward
            + T::CreatorStateBloatBondAmount::get());

        let params = BountyCreationParameters::<T>{
            funding_type: FundingType::Limited{
                target: bounty_amount,
                funding_period: funding_period.into(),
            },
            cherry,
            oracle_reward,
            oracle: oracle.clone(),
            creator: creator.clone(),
            entrant_stake,
            ..Default::default()
        };
        // should reach default max bounty funding amount
        let amount: BalanceOf<T> = 100u32.into();

        let (account_id, member_id) = member_funded_account::<T>("member1", 0);

        Bounty::<T>::create_bounty(
            RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

        let funder = BountyActor::Member(member_id);

        Bounty::<T>::fund_bounty(
            RawOrigin::Signed(account_id).into(),
            funder,
            bounty_id,
            amount
        ).unwrap();

    }: terminate_bounty(RawOrigin::Root, bounty_id)
    verify {
        assert!(Bounties::<T>::contains_key(bounty_id));
        assert_last_event::<T>(
            Event::<T>::BountyTerminated(
                bounty_id,
                BountyActor::Council,
                creator,
                oracle).into());
    }

    terminate_bounty_wo_oracle_reward_w_funds_funding {
        let funding_period = 1u32;
        let bounty_amount: BalanceOf<T> = 200u32.into();
        let cherry: BalanceOf<T> = 0u32.into();
        let oracle_reward: BalanceOf<T> = 0u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();
        let oracle = BountyActor::Council;
        let creator = BountyActor::Council;
        T::CouncilBudgetManager::set_budget(
            cherry
            + oracle_reward
            + T::CreatorStateBloatBondAmount::get());

        let params = BountyCreationParameters::<T>{
            funding_type: FundingType::Limited{
                target: bounty_amount,
                funding_period: funding_period.into(),
            },
            cherry,
            oracle_reward,
            oracle: oracle.clone(),
            creator: creator.clone(),
            entrant_stake,
            ..Default::default()
        };
        // should reach default max bounty funding amount
        let amount: BalanceOf<T> = 100u32.into();

        let (account_id, member_id) = member_funded_account::<T>("member1", 0);

        Bounty::<T>::create_bounty(
            RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

        let funder = BountyActor::Member(member_id);

        Bounty::<T>::fund_bounty(
            RawOrigin::Signed(account_id).into(),
            funder,
            bounty_id,
            amount
        ).unwrap();

    }: terminate_bounty(RawOrigin::Root, bounty_id)
    verify {
        assert!(Bounties::<T>::contains_key(bounty_id));
        assert_last_event::<T>(
            Event::<T>::BountyTerminated(
                bounty_id,
                BountyActor::Council,
                creator,
                oracle).into());
    }

    terminate_bounty_work_or_judging_period {
        let funding_period = 1u32;
        let bounty_amount: BalanceOf<T> = 200u32.into();
        let cherry: BalanceOf<T> = 0u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();
        let oracle = BountyActor::Council;
        let creator = BountyActor::Council;
        T::CouncilBudgetManager::set_budget(
            cherry
            + oracle_reward
            + T::CreatorStateBloatBondAmount::get());

        let params = BountyCreationParameters::<T>{
            funding_type: FundingType::Perpetual{
                target: bounty_amount,
            },
            cherry,
            oracle_reward,
            oracle: oracle.clone(),
            creator: creator.clone(),
            entrant_stake,
            ..Default::default()
        };
        let (account_id, member_id) = member_funded_account::<T>("member1", 0);

        Bounty::<T>::create_bounty(
            RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

        let funder = BountyActor::Member(member_id);

        Bounty::<T>::fund_bounty(
            RawOrigin::Signed(account_id).into(),
            funder,
            bounty_id,
            bounty_amount
        ).unwrap();

    }: terminate_bounty(RawOrigin::Root, bounty_id)
    verify {
        assert!(Bounties::<T>::contains_key(bounty_id));
        assert_last_event::<T>(
            Event::<T>::BountyTerminated(
                bounty_id,
                BountyActor::Council,
                creator,
                oracle).into());
    }

    fund_bounty_by_member {
        let max_amount: BalanceOf<T> = 100u32.into();
        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        T::CouncilBudgetManager::set_budget(
            cherry
            + oracle_reward
            + T::CreatorStateBloatBondAmount::get());

        let params = BountyCreationParameters::<T>{
            funding_type: FundingType::Perpetual{ target: max_amount },
            cherry,
            oracle_reward,
            entrant_stake,
            ..Default::default()
        };
        // should reach default max bounty funding amount
        let amount: BalanceOf<T> = 100u32.into();

        Bounty::<T>::create_bounty(
            RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

        assert!(Bounties::<T>::contains_key(bounty_id));

        let (account_id, member_id) = member_funded_account::<T>("member1", 0);

    }: fund_bounty (
        RawOrigin::Signed(account_id.clone()),
        BountyActor::Member(member_id),
        bounty_id, amount)

    verify {
        // println!("4 {:?}", Balances::<T>::usable_balance(&account_id));

        assert_eq!(
            Balances::<T>::usable_balance(&account_id),
            // included staking account deposit
            initial_balance::<T>()
            - T::DefaultMembershipPrice::get()
            - T::CandidateStake::get()
            - T::FunderStateBloatBondAmount::get()
            - amount
        );
        assert_last_event::<T>(
            Event::<T>::BountyMaxFundingReached(bounty_id).into());
    }

    fund_bounty_by_council {
        let max_amount: BalanceOf<T> = 100u32.into();
        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        T::CouncilBudgetManager::set_budget(
            cherry
            + oracle_reward
            + max_amount
            + T::FunderStateBloatBondAmount::get()
            + T::CreatorStateBloatBondAmount::get());

        let params = BountyCreationParameters::<T>{
            funding_type: FundingType::Perpetual{ target: max_amount },
            cherry,
            oracle_reward,
            entrant_stake,
            ..Default::default()
        };
        // should reach default max bounty funding amount
        let amount: BalanceOf<T> = 100u32.into();

        Bounty::<T>::create_bounty(
            RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

        assert!(Bounties::<T>::contains_key(bounty_id));
    }: fund_bounty (RawOrigin::Root, BountyActor::Council, bounty_id, amount)
    verify {
        assert_eq!(T::CouncilBudgetManager::get_budget(), Zero::zero());
        assert_last_event::<T>(
            Event::<T>::BountyMaxFundingReached(bounty_id).into());
    }

    withdraw_funding_by_member {
        let funding_period = 1u32;
        let bounty_amount: BalanceOf<T> = 200u32.into();
        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        T::CouncilBudgetManager::set_budget(
            cherry
            + oracle_reward
            + T::CreatorStateBloatBondAmount::get());

        let params = BountyCreationParameters::<T>{
            funding_type: FundingType::Limited{
                target: bounty_amount,
                funding_period: funding_period.into(),
            },
            cherry,
            oracle_reward,
            entrant_stake,
            ..Default::default()
        };
        // should reach default max bounty funding amount
        let amount: BalanceOf<T> = 100u32.into();

        let (account_id, member_id) = member_funded_account::<T>("member1", 0);

        Bounty::<T>::create_bounty(
            RawOrigin::Root.into(), params, Vec::new()).unwrap();

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

    }: withdraw_funding (
        RawOrigin::Signed(account_id.clone()), funder, bounty_id)
    verify {
        assert!(Bounties::<T>::contains_key(bounty_id));
        assert_eq!(
            Balances::<T>::usable_balance(&account_id),
            // included staking account deposit
            initial_balance::<T>()
            - T::DefaultMembershipPrice::get()
            - T::CandidateStake::get()
            + cherry
        );

    }

    withdraw_funding_by_council {
        let funding_period = 1u32;
        let bounty_amount: BalanceOf<T> = 200u32.into();
        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();
        let funding_amount: BalanceOf<T> = 100u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        T::CouncilBudgetManager::set_budget(
            cherry
            + oracle_reward
            + funding_amount
            + T::FunderStateBloatBondAmount::get()
            + T::CreatorStateBloatBondAmount::get());

        let params = BountyCreationParameters::<T>{
            funding_type: FundingType::Limited{
                target: bounty_amount,
                funding_period: funding_period.into(),
            },
            cherry,
            oracle_reward,
            entrant_stake,
            ..Default::default()
        };

        Bounty::<T>::create_bounty(
            RawOrigin::Root.into(), params, Vec::new()).unwrap();

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
        assert!(Bounties::<T>::contains_key(bounty_id));
        assert_eq!(
            T::CouncilBudgetManager::get_budget(),
            cherry
            + funding_amount
            + T::FunderStateBloatBondAmount::get());
    }

    announce_work_entry {
        let i in 1 .. MAX_BYTES;
        let j in 1 .. T::ClosedContractSizeLimit::get();

        let work_description = vec![0u8].repeat(i as usize);

        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();
        let funding_amount: BalanceOf<T> = 100u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        let member_ids = (0..j)
            .into_iter()
            .map(|id| id.saturated_into())
            .collect::<BTreeSet<T::MemberId>>();

        let contract_type = AssuranceContractType::Closed(member_ids);

        let params = BountyCreationParameters::<T>{
            funding_type: FundingType::Perpetual{ target: funding_amount },
            cherry,
            oracle_reward,
            contract_type,
            entrant_stake,
            ..Default::default()
        };

        let bounty_id = create_funded_bounty::<T>(params);

        let (account_id, member_id) = member_funded_account::<T>("member1", 1);

    }: _(
        RawOrigin::Signed(account_id.clone()),
        member_id,
        bounty_id,
        account_id.clone(),
        work_description.clone()
    )
    verify {
        let entry_id: T::EntryId = Bounty::<T>::entry_count().into();

        assert!(Entries::<T>::contains_key(bounty_id, entry_id));
        assert_last_event::<T>(
            Event::<T>::WorkEntryAnnounced(
                bounty_id,
                entry_id,
                member_id,
                account_id,
                work_description
            ).into()
        );
    }

    submit_work {
        let i in 0 .. MAX_BYTES;
        let work_data = vec![0u8].repeat(i as usize);

        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();
        let target: BalanceOf<T> = 100u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();
        let funding_period: T::BlockNumber = One::one();

        let params = BountyCreationParameters::<T>{
            cherry,
            oracle_reward,
            funding_type: FundingType::Limited{
                target,
                funding_period
            },
            entrant_stake,
            ..Default::default()
        };

        let bounty_id = create_funded_bounty::<T>(params);

        run_to_block::<T>(funding_period + One::one());

        let bounty = Bounty::<T>::bounties(bounty_id);

        assert!(matches!(
            bounty.milestone,
            BountyMilestone::BountyMaxFundingReached));

        let (account_id, member_id) = member_funded_account::<T>("member1", 1);
        let work_description = b"work_description".to_vec();
        Bounty::<T>::announce_work_entry(
            RawOrigin::Signed(account_id.clone()).into(),
            member_id,
            bounty_id,
            account_id.clone(),
            work_description

        ).unwrap();

        let entry_id: T::EntryId = Bounty::<T>::entry_count().into();

    }: submit_work(
        RawOrigin::Signed(account_id.clone()),
        member_id, bounty_id,
        entry_id,
        work_data.clone())
    verify {
        let entry = Bounty::<T>::entries(bounty_id, entry_id).unwrap();

        assert!(entry.work_submitted);
        assert_last_event::<T>(
            Event::<T>::WorkSubmitted(
                bounty_id, entry_id, member_id, work_data).into()
        );
    }

    submit_oracle_judgment_by_council_all_winners {
        let i in 1 .. MAX_WORK_ENTRIES;
        let j in 0 .. MAX_BYTES;

        let rationale = vec![0u8].repeat(j as usize);
        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();
        let funding_amount: BalanceOf<T> = 10000000u32.into();
        let oracle = BountyActor::Council;
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        let params = BountyCreationParameters::<T> {
            creator: BountyActor::Council,
            cherry,
            oracle_reward,
            entrant_stake,
            funding_type: FundingType::Perpetual{ target: funding_amount },
            oracle: oracle.clone(),
            ..Default::default()
        };

        let bounty_id = create_funded_bounty::<T>(params);

        let entry_ids = (0..i)
            .into_iter()
            .map(|i| { announce_entry_and_submit_work::<T>(&bounty_id, i)})
            .collect::<Vec<_>>();
        Bounty::<T>::end_working_period(
            RawOrigin::Root.into(), bounty_id).unwrap();

        let winner_reward: BalanceOf<T> = funding_amount / i.into();
        // for total sum = 100%
        let correction = funding_amount - winner_reward * i.into();
        let judgment = entry_ids
            .iter()
            .map(|entry_id| {
                let corrected_winner_reward = if *entry_id == One::one() {
                    winner_reward + correction
                } else {
                    winner_reward
                };

                (
                    *entry_id,
                    OracleWorkEntryJudgment::Winner {
                        reward : corrected_winner_reward
                    }
                )
            })
            .collect::<BTreeMap<_, _>>();

    }: submit_oracle_judgment(
        RawOrigin::Root, bounty_id, judgment.clone(), rationale.clone())
    verify {

        for (member_id, entry_id ) in entry_ids.into_iter().enumerate() {

            let member_id = T::MemberId::try_from(member_id)
                .map_err(|_| "member_id failed conversion").unwrap();

            assert_was_fired::<T>(
                Event::<T>::WorkEntrantFundsWithdrawn(
                    bounty_id, entry_id, member_id).into()
            );
        }
        assert_last_event::<T>(
            Event::<T>::OracleJudgmentSubmitted(
                bounty_id, oracle, judgment, rationale).into()
        );
    }

    submit_oracle_judgment_by_council_all_rejected {
        let i in 1 .. MAX_WORK_ENTRIES;
        let j in 0 .. MAX_BYTES;
        let k in 0 .. MAX_BYTES;

        let rationale = vec![0u8].repeat(j as usize);
        let action_justification = vec![0u8].repeat(k as usize);
        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();
        let funding_amount: BalanceOf<T> = 100u32.into();
        let oracle = BountyActor::Council;
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        let params = BountyCreationParameters::<T> {
            creator: BountyActor::Council,
            cherry,
            oracle_reward,
            entrant_stake,
            funding_type: FundingType::Perpetual{ target: funding_amount },
            oracle: oracle.clone(),
            ..Default::default()
        };

        let bounty_id = create_funded_bounty::<T>(params);

        let judgment = (0..i).into_iter().map(|i|{

            let entry_id = announce_entry_and_submit_work::<T>(&bounty_id, i);

            let judgment = OracleWorkEntryJudgment::Rejected {
                slashing_share: Perbill::from_percent(50),
                action_justification: action_justification.clone(),
            };

            (entry_id, judgment)

        }).collect::<BTreeMap<_, _>>();
        Bounty::<T>::end_working_period(
            RawOrigin::Root.into(), bounty_id).unwrap();

    }: submit_oracle_judgment(
        RawOrigin::Root, bounty_id, judgment.clone(), rationale.clone())
    verify {
        for (entry_id, _) in judgment.iter() {
            assert!(!<Entries<T>>::contains_key(bounty_id, entry_id));
        }
        assert_last_event::<T>(
            Event::<T>::OracleJudgmentSubmitted(
                bounty_id, oracle, judgment, rationale).into()
        );
    }

    submit_oracle_judgment_by_member_all_winners {
        let i in 1 .. MAX_WORK_ENTRIES;
        let j in 0 .. MAX_BYTES;

        let rationale = vec![0u8].repeat(j as usize);
        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();
        let funding_amount: BalanceOf<T> = 10000000u32.into();
        let (oracle_account_id, oracle_member_id) =
            member_funded_account::<T>("oracle", 0);
        let oracle = BountyActor::Member(oracle_member_id);
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        let params = BountyCreationParameters::<T> {
            creator: BountyActor::Council,
            cherry,
            oracle_reward,
            entrant_stake,
            funding_type: FundingType::Perpetual{ target: funding_amount },
            oracle: oracle.clone(),
            ..Default::default()
        };

        let bounty_id = create_funded_bounty::<T>(params);

        let entry_ids = (0..i)
            .into_iter()
            .map(|i| { announce_entry_and_submit_work::<T>(&bounty_id, i)})
            .collect::<Vec<_>>();

        Bounty::<T>::end_working_period(
            RawOrigin::Signed(oracle_account_id.clone()).into(),
            bounty_id).unwrap();

        let winner_reward: BalanceOf<T> = funding_amount / i.into();
        // for total sum = 100%
        let correction = funding_amount - winner_reward * i.into();
        let judgment = entry_ids
            .iter()
            .map(|entry_id| {
                let corrected_winner_reward = if *entry_id == One::one() {
                    winner_reward + correction
                } else {
                    winner_reward
                };

                (
                    *entry_id,
                    OracleWorkEntryJudgment::Winner {
                        reward : corrected_winner_reward
                    }
                )
            })
            .collect::<BTreeMap<_, _>>();

    }: submit_oracle_judgment(
        RawOrigin::Signed(oracle_account_id),
        bounty_id,
        judgment.clone(),
        rationale.clone())
    verify {
        for (member_id, entry_id ) in entry_ids.into_iter().enumerate() {

            let member_id = T::MemberId::try_from(member_id + 1)
                .map_err(|_| "member_id failed conversion").unwrap();
            assert_was_fired::<T>(
                Event::<T>::WorkEntrantFundsWithdrawn(
                    bounty_id, entry_id, member_id).into()
            );
        }
        assert_last_event::<T>(
            Event::<T>::OracleJudgmentSubmitted(
                bounty_id, oracle, judgment, rationale).into()
        );
    }

    submit_oracle_judgment_by_member_all_rejected {
        let i in 1 .. MAX_WORK_ENTRIES;
        let j in 0 .. MAX_BYTES;
        let k in 0 .. MAX_BYTES;

        let rationale = vec![0u8].repeat(j as usize);
        let action_justification = vec![0u8].repeat(k as usize);
        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();
        let funding_amount: BalanceOf<T> = 100u32.into();
        let (oracle_account_id, oracle_member_id) =
            member_funded_account::<T>("oracle", 1);
        let oracle = BountyActor::Member(oracle_member_id);
        let entrant_stake = T::MinWorkEntrantStake::get();

        let params = BountyCreationParameters::<T> {
            creator: BountyActor::Council,
            cherry,
            oracle_reward,
            entrant_stake,
            funding_type: FundingType::Perpetual{ target: funding_amount },
            oracle: oracle.clone(),
            ..Default::default()
        };

        let bounty_id = create_funded_bounty::<T>(params);

        let judgment = (0..i).into_iter().map(|i|{

            let entry_id = announce_entry_and_submit_work::<T>(&bounty_id, i);

            let judgment = OracleWorkEntryJudgment::Rejected {
                slashing_share: Perbill::from_percent(50),
                action_justification: action_justification.clone(),
            };

            (entry_id, judgment)

        }).collect::<BTreeMap<_, _>>();

        Bounty::<T>::end_working_period(
            RawOrigin::Signed(oracle_account_id.clone()).into(),
            bounty_id).unwrap();

    }: submit_oracle_judgment(
        RawOrigin::Signed(oracle_account_id),
        bounty_id,
        judgment.clone(),
        rationale.clone())
    verify {
        for (entry_id, _) in judgment.iter() {
            assert!(!<Entries<T>>::contains_key(bounty_id, entry_id));
        }
        assert_last_event::<T>(
            Event::<T>::OracleJudgmentSubmitted(
                bounty_id, oracle, judgment, rationale).into()
        );
    }

    switch_oracle_to_council_by_council_successful {

        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();

        let (current_oracle_account_id, current_oracle_member_id) =
            member_funded_account::<T>("current_oracle", 1);

        let oracle = BountyActor::Member(current_oracle_member_id);
        let new_oracle = BountyActor::Council;

        let creator = BountyActor::Council;

        T::CouncilBudgetManager::set_budget(
            cherry
            + oracle_reward
            + T::CreatorStateBloatBondAmount::get());

        let params = BountyCreationParameters::<T>{
            creator,
            cherry,
            oracle_reward,
            oracle: oracle.clone(),
            funding_type: FundingType::Perpetual{ target: 100u32.into() },
            entrant_stake: T::MinWorkEntrantStake::get(),
            ..Default::default()
        };

        Bounty::<T>::create_bounty(
            RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

    }: switch_oracle (RawOrigin::Root, new_oracle.clone(), bounty_id)
    verify {
        let bounty_id: T::BountyId = 1u32.into();

        assert!(Bounties::<T>::contains_key(bounty_id));
        // Bounty counter was updated.
        assert_eq!(Bounty::<T>::bounty_count(), 1);
        assert_last_event::<T>(
            Event::<T>::BountyOracleSwitched(
                bounty_id,
                BountyActor::Council,
                oracle,
                new_oracle).into());
    }

    switch_oracle_to_member_by_oracle_council {

        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();

        let oracle = BountyActor::Council;

        let (new_oracle_account_id, new_oracle_member_id) =
            member_funded_account::<T>("new_oracle", 2);

        let new_oracle = BountyActor::Member(new_oracle_member_id);

        let creator = BountyActor::Council;

        T::CouncilBudgetManager::set_budget(
            cherry
            + oracle_reward
            + T::CreatorStateBloatBondAmount::get());

        let params = BountyCreationParameters::<T>{
            creator,
            cherry,
            oracle_reward,
            oracle: oracle.clone(),
            funding_type: FundingType::Perpetual{ target: 100u32.into() },
            entrant_stake: T::MinWorkEntrantStake::get(),
            ..Default::default()
        };

        Bounty::<T>::create_bounty(
            RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

    }: switch_oracle (RawOrigin::Root, new_oracle.clone(), bounty_id)
    verify {
        let bounty_id: T::BountyId = 1u32.into();

        assert!(Bounties::<T>::contains_key(bounty_id));
        // Bounty counter was updated.
        assert_eq!(Bounty::<T>::bounty_count(), 1);
        assert_last_event::<T>(
            Event::<T>::BountyOracleSwitched(
                bounty_id,
                BountyActor::Council,
                oracle,
                new_oracle).into());
    }

    switch_oracle_to_member_by_council{
        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();

        let (current_oracle_account_id, current_oracle_member_id) =
            member_funded_account::<T>("current_oracle", 1);

        let (new_oracle_account_id, new_oracle_member_id) =
            member_funded_account::<T>("new_oracle", 2);

        let oracle = BountyActor::Member(current_oracle_member_id);
        let new_oracle = BountyActor::Member(new_oracle_member_id);

        let creator = BountyActor::Council;

        T::CouncilBudgetManager::set_budget(
            cherry
            + oracle_reward
            + T::CreatorStateBloatBondAmount::get());

        let params = BountyCreationParameters::<T>{
            creator,
            cherry,
            oracle_reward,
            oracle: oracle.clone(),
            funding_type: FundingType::Perpetual{ target: 100u32.into() },
            entrant_stake: T::MinWorkEntrantStake::get(),
            ..Default::default()
        };

        Bounty::<T>::create_bounty(
            RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

    }: switch_oracle (RawOrigin::Root, new_oracle.clone(), bounty_id)
    verify {
        let bounty_id: T::BountyId = 1u32.into();

        assert!(Bounties::<T>::contains_key(bounty_id));
        // Bounty counter was updated.
        assert_eq!(Bounty::<T>::bounty_count(), 1);
        assert_last_event::<T>(
            Event::<T>::BountyOracleSwitched(
                bounty_id,
                BountyActor::Council,
                oracle,
                new_oracle).into());
    }

    switch_oracle_to_member_by_oracle_member{
        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();

        let (current_oracle_account_id, current_oracle_member_id) =
            member_funded_account::<T>("current_oracle", 1);

        let oracle = BountyActor::Member(current_oracle_member_id);

        let (new_oracle_account_id, new_oracle_member_id) =
            member_funded_account::<T>("new_oracle", 2);
        let new_oracle = BountyActor::Member(new_oracle_member_id);

        let creator = BountyActor::Council;

        T::CouncilBudgetManager::set_budget(
            cherry + oracle_reward
            + T::CreatorStateBloatBondAmount::get());

        let params = BountyCreationParameters::<T>{
            creator,
            cherry,
            oracle_reward,
            oracle: oracle.clone(),
            funding_type: FundingType::Perpetual{ target: 100u32.into() },
            entrant_stake: T::MinWorkEntrantStake::get(),
            ..Default::default()
        };

        Bounty::<T>::create_bounty(
            RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

    }: switch_oracle (
        RawOrigin::Signed(current_oracle_account_id),
        new_oracle.clone(),
        bounty_id)
    verify {
        let bounty_id: T::BountyId = 1u32.into();

        assert!(Bounties::<T>::contains_key(bounty_id));
        // Bounty counter was updated.
        assert_eq!(Bounty::<T>::bounty_count(), 1);
        assert_last_event::<T>(
            Event::<T>::BountyOracleSwitched(
                bounty_id,
                BountyActor::Member(current_oracle_member_id),
                oracle,
                new_oracle).into());
    }

    switch_oracle_to_council_by_oracle_member {
        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();

        let (current_oracle_account_id, current_oracle_member_id) =
            member_funded_account::<T>("current_oracle", 1);

        let oracle = BountyActor::Member(current_oracle_member_id);

        let new_oracle = BountyActor::Council;

        let creator = BountyActor::Council;

        T::CouncilBudgetManager::set_budget(
            cherry
            + oracle_reward
            + T::CreatorStateBloatBondAmount::get());

        let params = BountyCreationParameters::<T>{
            creator,
            cherry,
            oracle_reward,
            oracle: oracle.clone(),
            funding_type: FundingType::Perpetual{ target: 100u32.into() },
            entrant_stake: T::MinWorkEntrantStake::get(),
            ..Default::default()
        };

        Bounty::<T>::create_bounty(
            RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

    }: switch_oracle (
        RawOrigin::Signed(current_oracle_account_id),
        new_oracle.clone(),
        bounty_id)
    verify {
        let bounty_id: T::BountyId = 1u32.into();

        assert!(Bounties::<T>::contains_key(bounty_id));
        assert_last_event::<T>(
            Event::<T>::BountyOracleSwitched(
                bounty_id,
                BountyActor::Member(current_oracle_member_id),
                oracle,
                new_oracle).into());
    }

    end_working_period{
        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();
        let funding_amount: BalanceOf<T> = 100u32.into();
        let (oracle_account_id, oracle_member_id) =
            member_funded_account::<T>("oracle", 1);
        let oracle = BountyActor::Member(oracle_member_id);
        let stake = T::MinWorkEntrantStake::get();
        let creator = BountyActor::Council;

        let params = BountyCreationParameters::<T> {
            creator,
            cherry,
            oracle_reward,
            funding_type: FundingType::Perpetual{ target: funding_amount },
            oracle: oracle.clone(),
            entrant_stake: stake,
            ..Default::default()
        };

        let bounty_id = create_funded_bounty::<T>(params);

        let (work_account_id, work_member_id) =
            member_funded_account::<T>("work entrants", 0);
        let work_description = b"work_description".to_vec();
        Bounty::<T>::announce_work_entry(
            RawOrigin::Signed(work_account_id.clone()).into(),
            work_member_id,
            bounty_id,
            work_account_id.clone(),
            work_description
        )
        .unwrap();

        let entry_id: T::EntryId = Bounty::<T>::entry_count().into();

        let work_data = b"work_data".to_vec();
        Bounty::<T>::submit_work(
            RawOrigin::Signed(work_account_id).into(),
            work_member_id,
            bounty_id,
            entry_id,
            work_data,
        )
        .unwrap();

    }: end_working_period(
        RawOrigin::Signed(oracle_account_id.clone()), bounty_id)
    verify {
        let bounty_id: T::BountyId = 1u32.into();

        assert!(Bounties::<T>::contains_key(bounty_id));
        // Bounty counter was updated.
        assert_eq!(Bounty::<T>::bounty_count(), 1);
        assert_last_event::<T>(
            Event::<T>::WorkSubmissionPeriodEnded(
                bounty_id,
                oracle).into());
    }

    withdraw_entrant_stake{
        let cherry: BalanceOf<T> = 200u32.into();
        let oracle_reward: BalanceOf<T> = 200u32.into();
        let funding_amount: BalanceOf<T> = 500u32.into();
        let oracle = BountyActor::Council;
        let entrant_stake = T::MinWorkEntrantStake::get();
        let creator = BountyActor::Council;
        let (account_id, member_id) =
            member_funded_account::<T>("work entrant", 0);
        let params = BountyCreationParameters::<T> {
            creator,
            cherry,
            oracle_reward,
            funding_type: FundingType::Perpetual{ target: funding_amount },
            oracle,
            entrant_stake,
            ..Default::default()
        };

        let bounty_id = create_funded_bounty::<T>(params);
        let work_description = b"work_description".to_vec();
        Bounty::<T>::announce_work_entry(
            RawOrigin::Signed(account_id.clone()).into(),
            member_id,
            bounty_id,
            account_id.clone(),
            work_description
        )
        .unwrap();

        let entry_id: T::EntryId = Bounty::<T>::entry_count().into();

        let work_data = b"work_data".to_vec();

        Bounty::<T>::submit_work(
            RawOrigin::Signed(account_id.clone()).into(),
            member_id,
            bounty_id,
            entry_id,
            work_data,
        )
        .unwrap();

        Bounty::<T>::terminate_bounty(
            RawOrigin::Root.into(), bounty_id).unwrap();
    }: withdraw_entrant_stake(
        RawOrigin::Signed(account_id.clone()),
        member_id,
        bounty_id,
        entry_id)
    verify {
        assert_last_event::<T>(
            Event::<T>::WorkEntrantStakeUnlocked(
                bounty_id,
                entry_id,
                account_id).into())
    }

    withdraw_funding_state_bloat_bond_by_council{
        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();
        let funding_amount: BalanceOf<T> = 100u32.into();

        let (oracle_account_id, oracle_member_id) =
            member_funded_account::<T>("oracle", 1);

        let oracle = BountyActor::Member(oracle_member_id);
        let entrant_stake = T::MinWorkEntrantStake::get();
        let creator = BountyActor::Council;
        let funder = BountyActor::Council;

        let params = BountyCreationParameters::<T> {
            creator,
            cherry,
            oracle_reward,
            funding_type: FundingType::Perpetual{ target: funding_amount },
            oracle,
            entrant_stake,
            ..Default::default()
        };

        let bounty_id = create_funded_bounty::<T>(params);

        let (work_account_id, work_member_id) =
            member_funded_account::<T>("work entrants", 0);

        let work_description = b"work_description".to_vec();
        Bounty::<T>::announce_work_entry(
            RawOrigin::Signed(work_account_id.clone()).into(),
            work_member_id,
            bounty_id,
            work_account_id.clone(),
            work_description
        )
        .unwrap();

        let entry_id: T::EntryId = Bounty::<T>::entry_count().into();

        let work_data = b"work_data".to_vec();
        Bounty::<T>::submit_work(
            RawOrigin::Signed(work_account_id).into(),
            work_member_id,
            bounty_id,
            entry_id,
            work_data,
        )
        .unwrap();

        Bounty::<T>::end_working_period(
            RawOrigin::Signed(oracle_account_id.clone()).into(),
            bounty_id).unwrap();

        let winner_reward: BalanceOf<T> = funding_amount;

        let judgment = vec![entry_id].iter()
            .map(|entry_id| (
                *entry_id,
                OracleWorkEntryJudgment::Winner {reward : winner_reward}))
            .collect::<BTreeMap<_, _>>();

        Bounty::<T>::submit_oracle_judgment(
            RawOrigin::Signed(oracle_account_id).into(),
            bounty_id,
            judgment,
            Vec::new()
        ).unwrap();

    }: withdraw_funding(RawOrigin::Root, funder.clone(), bounty_id)
    verify {
        assert!(Bounties::<T>::contains_key(bounty_id));
        assert_was_fired::<T>(
            Event::<T>::FunderStateBloatBondWithdrawn(
                bounty_id,
                funder,
                T::FunderStateBloatBondAmount::get()).into());
    }

    withdraw_funding_state_bloat_bond_by_member{
        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();
        let funding_amount: BalanceOf<T> = 100u32.into();
        let (oracle_account_id, oracle_member_id) =
        member_funded_account::<T>("oracle", 0);
        let oracle = BountyActor::Member(oracle_member_id);
        let entrant_stake = T::MinWorkEntrantStake::get();
        let creator = BountyActor::Council;

        let params = BountyCreationParameters::<T> {
            creator,
            cherry,
            oracle_reward,
            funding_type: FundingType::Perpetual{ target: funding_amount },
            oracle,
            entrant_stake,
            ..Default::default()
        };

        T::CouncilBudgetManager::set_budget(
            cherry
            + oracle_reward
            + T::CreatorStateBloatBondAmount::get());

        // should reach default max bounty funding amount
        let amount: BalanceOf<T> = 100u32.into();

        let (account_id, member_id) = member_funded_account::<T>("funder", 1);
        let funder = BountyActor::Member(member_id);
        Bounty::<T>::create_bounty(
            RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

        Bounty::<T>::fund_bounty(
            RawOrigin::Signed(account_id.clone()).into(),
            funder.clone(),
            bounty_id,
            amount).unwrap();

        let (work_account_id, work_member_id) =
            member_funded_account::<T>("work entrants", 2);
        let work_description = b"work_description".to_vec();
        Bounty::<T>::announce_work_entry(
            RawOrigin::Signed(work_account_id.clone()).into(),
            work_member_id,
            bounty_id,
            work_account_id.clone(),
            work_description
        )
        .unwrap();

        let entry_id: T::EntryId = Bounty::<T>::entry_count().into();

        let work_data = b"work_data".to_vec();
        Bounty::<T>::submit_work(
            RawOrigin::Signed(work_account_id).into(),
            work_member_id,
            bounty_id,
            entry_id,
            work_data,
        )
        .unwrap();

        Bounty::<T>::end_working_period(
            RawOrigin::Signed(oracle_account_id.clone()).into(),
            bounty_id).unwrap();

        let winner_reward: BalanceOf<T> = funding_amount;

        let judgment = vec![entry_id].iter()
            .map(|entry_id|
                (*entry_id,
                    OracleWorkEntryJudgment::Winner {reward : winner_reward}))
            .collect::<BTreeMap<_, _>>();

        Bounty::<T>::submit_oracle_judgment(
            RawOrigin::Signed(oracle_account_id).into(),
            bounty_id,
            judgment,
            Vec::new(),
        ).unwrap();

    }: withdraw_funding(
        RawOrigin::Signed(account_id),
        funder.clone(),
        bounty_id)
    verify {
        assert_was_fired::<T>(
            Event::<T>::FunderStateBloatBondWithdrawn(
                bounty_id,
                funder,
                T::FunderStateBloatBondAmount::get()).into());

        assert!(Bounties::<T>::contains_key(bounty_id));
    }

    withdraw_oracle_reward_by_oracle_council{
        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();
        let max_amount: BalanceOf<T> = 1000u32.into();
        let entrant_stake = T::MinWorkEntrantStake::get();
        let oracle = BountyActor::Council;

        T::CouncilBudgetManager::set_budget(
            cherry
            + oracle_reward
            + T::CreatorStateBloatBondAmount::get());

        let creator = BountyActor::Council;
        let params = BountyCreationParameters::<T>{
            cherry,
            oracle_reward,
            creator,
            //same complexity with limited funding
            //and NoFundingContributed stage.
            funding_type: FundingType::Perpetual{ target: max_amount },
            entrant_stake,
            oracle: oracle.clone(),
            ..Default::default()
        };

        Bounty::<T>::create_bounty(
            RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

        Bounty::<T>::terminate_bounty(
            RawOrigin::Root.into(), bounty_id).unwrap();

    }: withdraw_oracle_reward(RawOrigin::Root, bounty_id)
    verify {
        assert!(!Bounties::<T>::contains_key(bounty_id));
        assert_was_fired::<T>(
            Event::<T>::BountyOracleRewardWithdrawal(
                bounty_id,
                oracle,
                oracle_reward).into());

        assert_last_event::<T>(Event::<T>::BountyRemoved(bounty_id).into());
    }

    withdraw_oracle_reward_by_oracle_member{
        let cherry: BalanceOf<T> = 100u32.into();
        let oracle_reward: BalanceOf<T> = 100u32.into();
        let max_amount: BalanceOf<T> = 1000u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();
        let (oracle_account_id, oracle_member_id) =
        member_funded_account::<T>("oracle", 0);
        let oracle = BountyActor::Member(oracle_member_id);

        T::CouncilBudgetManager::set_budget(
            cherry
            + oracle_reward
            + T::CreatorStateBloatBondAmount::get());

        let creator = BountyActor::Council;
        let params = BountyCreationParameters::<T>{
            cherry,
            oracle_reward,
            creator,
            // same complexity with limited funding
            //and NoFundingContributed stage.
            funding_type: FundingType::Perpetual{ target: max_amount },
            entrant_stake,
            oracle: oracle.clone(),
            ..Default::default()
        };

        Bounty::<T>::create_bounty(
            RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Bounty::<T>::bounty_count().into();

        Bounty::<T>::terminate_bounty(
            RawOrigin::Root.into(), bounty_id).unwrap();

    }: withdraw_oracle_reward(RawOrigin::Signed(oracle_account_id), bounty_id)
    verify {
        assert!(!Bounties::<T>::contains_key(bounty_id));

        assert_was_fired::<T>(
            Event::<T>::BountyOracleRewardWithdrawal(
                bounty_id,
                oracle,
                oracle_reward).into());
        assert_last_event::<T>(Event::<T>::BountyRemoved(bounty_id).into());
    }

    entrant_remark {
        let i in 0 .. MAX_BYTES;

        let msg = vec![0u8].repeat(i as usize);
        let cherry: BalanceOf<T> = 100u32.into();
        let funding_amount: BalanceOf<T> = 100u32.into();
        let entrant_stake = T::MinWorkEntrantStake::get();

        let params = BountyCreationParameters::<T>{
            cherry,
            funding_type: FundingType::Perpetual{ target: funding_amount },
            entrant_stake,
            ..Default::default()
        };

        let bounty_id = create_funded_bounty::<T>(params);

        let (account_id, member_id) = member_funded_account::<T>("member1", 1);

        Bounty::<T>::announce_work_entry(
            RawOrigin::Signed(account_id.clone()).into(),
            member_id,
            bounty_id,
            account_id.clone(),
            Vec::new()
        ).unwrap();

        let entry_id: T::EntryId = Bounty::<T>::entry_count().into();

    }: _(RawOrigin::Signed(
        account_id.clone()),
        member_id,
        bounty_id,
        entry_id,
        msg.clone())
    verify {
        assert_last_event::<T>(
            Event::<T>::BountyEntrantRemarked(
                member_id, bounty_id, entry_id, msg).into()
        );
    }

    contributor_remark {
        let i in 0 .. MAX_BYTES;

        let msg = vec![0u8].repeat(i as usize);
        let funding_period = 1u32;
        let bounty_amount: BalanceOf<T> = 200u32.into();
        let cherry: BalanceOf<T> = 100u32.into();
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        T::CouncilBudgetManager::set_budget(
            cherry + T::CreatorStateBloatBondAmount::get());

        let params = BountyCreationParameters::<T>{
            funding_type: FundingType::Limited{
                target: bounty_amount,
                funding_period: funding_period.into(),
            },
            cherry,
            entrant_stake,
            ..Default::default()
        };
        // should reach default max bounty funding amount
        let amount: BalanceOf<T> = 100u32.into();

        let (account_id, member_id) = member_funded_account::<T>("member1", 0);

        Bounty::<T>::create_bounty(
            RawOrigin::Root.into(), params, Vec::new()).unwrap();

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

    }: _(RawOrigin::Signed(account_id.clone()),
    funder.clone(),
    bounty_id,
    msg.clone())
    verify {
        assert_last_event::<T>(
            Event::<T>::BountyContributorRemarked(funder, bounty_id, msg).into()
        );
    }

    oracle_remark {
        let i in 0 .. MAX_BYTES;

        let msg = vec![0u8].repeat(i as usize);
        let cherry: BalanceOf<T> = 100u32.into();
        let funding_amount: BalanceOf<T> = 10000000u32.into();
        let oracle = BountyActor::Council;
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        let params = BountyCreationParameters::<T> {
            creator: BountyActor::Council,
            cherry,
            entrant_stake,
            funding_type: FundingType::Perpetual{ target: funding_amount },
            oracle: oracle.clone(),
            ..Default::default()
        };

        let bounty_id = create_funded_bounty::<T>(params);

    }: _(RawOrigin::Root, oracle.clone(), bounty_id, msg.clone())
    verify {
        assert_last_event::<T>(
            Event::<T>::BountyOracleRemarked(oracle, bounty_id, msg).into()
        );
    }

    creator_remark {
        let i in 0 .. MAX_BYTES;

        let msg = vec![0u8].repeat(i as usize);
        let cherry: BalanceOf<T> = 100u32.into();
        let funding_amount: BalanceOf<T> = 10000000u32.into();
        let oracle = BountyActor::Council;
        let entrant_stake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        let creator = BountyActor::Council;

        let params = BountyCreationParameters::<T> {
            creator: creator.clone(),
            cherry,
            entrant_stake,
            funding_type: FundingType::Perpetual{ target: funding_amount },
            oracle,
            ..Default::default()
        };

        let bounty_id = create_funded_bounty::<T>(params);

    }: _(RawOrigin::Root, creator.clone(), bounty_id, msg.clone())
    verify {
        assert_last_event::<T>(
            Event::<T>::BountyCreatorRemarked(creator, bounty_id, msg).into()
        );
    }
}

#[cfg(test)]
mod tests {
    use crate::tests::mocks::{build_test_externalities, Bounty};
    use frame_support::assert_ok;

    #[test]
    fn create_bounty_by_council() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_create_bounty_by_council());
        });
    }

    #[test]
    fn create_bounty_by_member() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_create_bounty_by_member());
        });
    }

    #[test]
    fn terminate_bounty_w_oracle_reward_funding_expired() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_terminate_bounty_w_oracle_reward_funding_expired());
        });
    }
    #[test]
    fn terminate_bounty_wo_oracle_reward_funding_expired() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_terminate_bounty_wo_oracle_reward_funding_expired());
        });
    }
    #[test]
    fn terminate_bounty_w_oracle_reward_wo_funds_funding() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_terminate_bounty_w_oracle_reward_wo_funds_funding());
        });
    }

    #[test]
    fn terminate_bounty_wo_oracle_reward_wo_funds_funding() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_terminate_bounty_wo_oracle_reward_wo_funds_funding());
        });
    }

    #[test]
    fn terminate_bounty_w_oracle_reward_w_funds_funding() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_terminate_bounty_w_oracle_reward_w_funds_funding());
        });
    }

    #[test]
    fn terminate_bounty_wo_oracle_reward_w_funds_funding() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_terminate_bounty_wo_oracle_reward_w_funds_funding());
        });
    }

    #[test]
    fn terminate_bounty_work_or_judging_period() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_terminate_bounty_work_or_judging_period());
        });
    }

    #[test]
    fn fund_bounty_by_member() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_fund_bounty_by_member());
        });
    }

    #[test]
    fn fund_bounty_by_council() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_fund_bounty_by_council());
        });
    }

    #[test]
    fn withdraw_funding_by_member() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_withdraw_funding_by_member());
        });
    }

    #[test]
    fn withdraw_funding_by_council() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_withdraw_funding_by_council());
        });
    }

    #[test]
    fn announce_work_entry() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_announce_work_entry());
        });
    }

    #[test]
    fn submit_work() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_submit_work());
        });
    }

    #[test]
    fn submit_oracle_judgment_by_council_all_winners() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_submit_oracle_judgment_by_council_all_winners());
        });
    }

    #[test]
    fn submit_oracle_judgment_by_council_all_rejected() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_submit_oracle_judgment_by_council_all_rejected());
        });
    }

    #[test]
    fn submit_oracle_judgment_by_member_all_winners() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_submit_oracle_judgment_by_member_all_winners());
        });
    }

    #[test]
    fn submit_oracle_judgment_by_member_all_rejected() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_submit_oracle_judgment_by_member_all_rejected());
        });
    }

    #[test]
    fn switch_oracle_to_council_by_council_successful() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_switch_oracle_to_council_by_council_successful());
        });
    }

    #[test]
    fn switch_oracle_to_member_by_oracle_council() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_switch_oracle_to_member_by_oracle_council());
        });
    }

    #[test]
    fn switch_oracle_to_member_by_council() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_switch_oracle_to_member_by_council());
        });
    }

    #[test]
    fn switch_oracle_to_member_by_oracle_member() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_switch_oracle_to_member_by_oracle_member());
        });
    }

    #[test]
    fn switch_oracle_to_council_by_oracle_member() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_switch_oracle_to_council_by_oracle_member());
        });
    }

    #[test]
    fn end_working_period() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_end_working_period());
        });
    }

    #[test]
    fn withdraw_entrant_stake() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_withdraw_entrant_stake());
        });
    }

    #[test]
    fn withdraw_funding_state_bloat_bond_by_council() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_withdraw_funding_state_bloat_bond_by_council());
        });
    }

    #[test]
    fn withdraw_funding_state_bloat_bond_by_member() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_withdraw_funding_state_bloat_bond_by_member());
        });
    }

    #[test]
    fn withdraw_oracle_reward_by_oracle_member() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_withdraw_oracle_reward_by_oracle_member());
        });
    }

    #[test]
    fn withdraw_oracle_reward_by_oracle_council() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_withdraw_oracle_reward_by_oracle_council());
        });
    }

    #[test]
    fn bounty_contributor_remark() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_contributor_remark());
        });
    }

    #[test]
    fn bounty_oracle_remark() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_oracle_remark());
        });
    }

    #[test]
    fn bounty_entrant_remark() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_entrant_remark());
        });
    }

    #[test]
    fn bounty_creator_remark() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Bounty::test_benchmark_creator_remark());
        });
    }
}
