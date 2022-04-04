#![cfg(feature = "runtime-benchmarks")]
use super::*;
use core::convert::TryInto;
use frame_benchmarking::{account, benchmarks_instance, Zero};
use frame_support::traits::OnInitialize;
use frame_system::EventRecord;
use frame_system::Module as System;
use frame_system::RawOrigin;
use sp_runtime::traits::Bounded;
use sp_std::prelude::*;

use crate::types::StakeParameters;
use crate::Module as WorkingGroup;
use balances::Module as Balances;
use membership::Module as Membership;

const SEED: u32 = 0;
const MAX_BYTES: u32 = 16384;

fn assert_last_event<T: Trait<I>, I: Instance>(generic_event: <T as Trait<I>>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Trait>::Event = generic_event.into();
    // compare to the last event record
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

fn get_byte(num: u32, byte_number: u8) -> u8 {
    ((num & (0xff << (8 * byte_number))) >> 8 * byte_number) as u8
}

fn add_opening_helper<T: Trait<I>, I: Instance>(
    id: u32,
    add_opening_origin: &T::Origin,
    job_opening_type: &OpeningType,
) -> OpeningId {
    let staking_policy = StakePolicy {
        stake_amount: T::MinimumApplicationStake::get(),
        leaving_unstaking_period: T::MinUnstakingPeriodLimit::get() + One::one(),
    };

    WorkingGroup::<T, _>::add_opening(
        add_opening_origin.clone(),
        vec![],
        *job_opening_type,
        staking_policy,
        Some(One::one()),
    )
    .unwrap();

    let opening_id = id.into();

    assert!(
        OpeningById::<T, I>::contains_key(opening_id),
        "Opening not added"
    );

    opening_id
}

fn apply_on_opening_helper<T: Trait<I>, I: Instance>(
    id: u32,
    applicant_id: &T::AccountId,
    member_id: &T::MemberId,
    opening_id: &OpeningId,
) -> ApplicationId {
    let stake_parameters = StakeParameters {
        // Due to mock implementation of StakingHandler we can't go over 1000
        stake: T::MinimumApplicationStake::get(),
        staking_account_id: applicant_id.clone(),
    };

    WorkingGroup::<T, _>::apply_on_opening(
        RawOrigin::Signed(applicant_id.clone()).into(),
        ApplyOnOpeningParameters::<T> {
            member_id: *member_id,
            opening_id: *opening_id,
            role_account_id: applicant_id.clone(),
            reward_account_id: applicant_id.clone(),
            description: vec![],
            stake_parameters,
        },
    )
    .unwrap();

    let application_id = id.into();

    assert!(
        ApplicationById::<T, I>::contains_key(application_id),
        "Application not added"
    );

    application_id
}

fn add_opening_and_apply_with_multiple_ids<T: Trait<I> + membership::Trait, I: Instance>(
    ids: &Vec<u32>,
    add_opening_origin: &T::Origin,
    job_opening_type: &OpeningType,
) -> (OpeningId, BTreeSet<ApplicationId>, Vec<T::AccountId>) {
    let opening_id = add_opening_helper::<T, I>(1, add_opening_origin, job_opening_type);

    let mut successful_application_ids = BTreeSet::new();

    let mut account_ids = Vec::new();
    for id in ids.iter() {
        let (applicant_account_id, applicant_member_id) =
            member_funded_account::<T, I>("member", *id);
        let application_id = apply_on_opening_helper::<T, I>(
            *id,
            &applicant_account_id,
            &applicant_member_id,
            &opening_id,
        );

        successful_application_ids.insert(application_id);
        account_ids.push(applicant_account_id);
    }

    (opening_id, successful_application_ids, account_ids)
}

fn add_and_apply_opening<T: Trait<I>, I: Instance>(
    id: u32,
    add_opening_origin: &T::Origin,
    applicant_id: &T::AccountId,
    member_id: &T::MemberId,
    job_opening_type: &OpeningType,
) -> (OpeningId, ApplicationId) {
    let opening_id = add_opening_helper::<T, I>(id, add_opening_origin, job_opening_type);

    let application_id = apply_on_opening_helper::<T, I>(id, applicant_id, member_id, &opening_id);

    (opening_id, application_id)
}

// Method to generate a distintic valid handle
// for a membership. For each index.
fn handle_from_id<T: membership::Trait>(id: u32) -> Vec<u8> {
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

fn member_funded_account<T: Trait<I> + membership::Trait, I: Instance>(
    name: &'static str,
    id: u32,
) -> (T::AccountId, T::MemberId) {
    let account_id = account::<T::AccountId>(name, id, SEED);
    let handle = handle_from_id::<T>(id);

    let _ = Balances::<T>::make_free_balance_be(&account_id, BalanceOf::<T>::max_value());

    let params = membership::BuyMembershipParameters {
        root_account: account_id.clone(),
        controller_account: account_id.clone(),
        handle: Some(handle),
        metadata: Vec::new(),
        referrer_id: None,
    };

    Membership::<T>::buy_membership(RawOrigin::Signed(account_id.clone()).into(), params).unwrap();

    let _ = Balances::<T>::make_free_balance_be(&account_id, BalanceOf::<T>::max_value());

    let member_id = T::MemberId::from(id.try_into().unwrap());
    Membership::<T>::add_staking_account_candidate(
        RawOrigin::Signed(account_id.clone()).into(),
        member_id.clone(),
    )
    .unwrap();
    Membership::<T>::confirm_staking_account(
        RawOrigin::Signed(account_id.clone()).into(),
        member_id.clone(),
        account_id.clone(),
    )
    .unwrap();

    (account_id, member_id)
}

fn force_missed_reward<T: Trait<I>, I: Instance>() {
    let curr_block_number =
        System::<T>::block_number().saturating_add(T::RewardPeriod::get().into());
    System::<T>::set_block_number(curr_block_number);
    WorkingGroup::<T, _>::set_budget(RawOrigin::Root.into(), Zero::zero()).unwrap();
    WorkingGroup::<T, _>::on_initialize(curr_block_number);
}

pub fn insert_a_worker<T: Trait<I> + membership::Trait, I: Instance>(
    job_opening_type: OpeningType,
    id: u32,
    lead_id: Option<T::AccountId>,
) -> (T::AccountId, WorkerId<T>)
where
    WorkingGroup<T, I>: OnInitialize<T::BlockNumber>,
{
    let (caller_id, member_id) = member_funded_account::<T, I>("member", id);

    let worker_id = complete_opening::<T, I>(job_opening_type, id, lead_id, &caller_id, member_id);

    (caller_id, worker_id)
}

pub fn complete_opening<T: Trait<I> + membership::Trait, I: Instance>(
    job_opening_type: OpeningType,
    id: u32,
    lead_id: Option<T::AccountId>,
    caller_id: &T::AccountId,
    member_id: T::MemberId,
) -> WorkerId<T> {
    let add_worker_origin = match job_opening_type {
        OpeningType::Leader => RawOrigin::Root,
        OpeningType::Regular => RawOrigin::Signed(lead_id.clone().unwrap()),
    };

    let (opening_id, application_id) = add_and_apply_opening::<T, I>(
        id,
        &T::Origin::from(add_worker_origin.clone()),
        caller_id,
        &member_id,
        &job_opening_type,
    );

    let mut successful_application_ids = BTreeSet::<ApplicationId>::new();
    successful_application_ids.insert(application_id);
    WorkingGroup::<T, _>::fill_opening(
        add_worker_origin.clone().into(),
        opening_id,
        successful_application_ids,
    )
    .unwrap();

    // Every worst case either include or doesn't mind having a non-zero
    // remaining reward
    force_missed_reward::<T, I>();

    let worker_id = WorkerId::<T>::from(id.try_into().unwrap());

    assert!(WorkerById::<T, I>::contains_key(worker_id));

    worker_id
}

benchmarks_instance! {
    where_clause {
        where T: membership::Trait
    }

    _ { }

    on_initialize_leaving {
        let i in 2 .. T::MaxWorkerNumberLimit::get();

        let (lead_id, lead_worker_id) = insert_a_worker::<T, I>(
            OpeningType::Leader,
            0,
            None
        );

        let (opening_id, successful_application_ids, application_account_id) =
            add_opening_and_apply_with_multiple_ids::<T, I>(
                &(1..i).collect(),
                &T::Origin::from(RawOrigin::Signed(lead_id.clone())),
                &OpeningType::Regular
            );

        WorkingGroup::<T, I>::fill_opening(
            RawOrigin::Signed(lead_id.clone()).into(),
            opening_id,
            successful_application_ids.clone()
        ).unwrap();

        force_missed_reward::<T,I>();

        // Force all workers to leave (Including the lead)
        // We should have every WorkerId from 0 to i-1
        // Corresponding to each account id
        let mut worker_id = Zero::zero();
        for id in application_account_id {
            worker_id += One::one();
            WorkingGroup::<T, _>::leave_role(
                    RawOrigin::Signed(id).into(),
                    worker_id,
                    Some(vec![0u8]),
                ).unwrap();
        }

        // Worst case scenario one of the leaving workers is the lead
        WorkingGroup::<T, _>::leave_role(
            RawOrigin::Signed(lead_id).into(),
            lead_worker_id,
            Some(vec![0u8]),
        ).unwrap();

        for i in 1..successful_application_ids.len() {
            let worker = WorkerId::<T>::from(i.try_into().unwrap());
            assert!(WorkerById::<T, I>::contains_key(worker), "Not all workers added");
            assert_eq!(
                WorkingGroup::<T, _>::worker_by_id(worker).started_leaving_at,
                Some(System::<T>::block_number()),
                "Worker hasn't started leaving"
            );
        }

        // Maintain consistency with add_opening_helper
        let leaving_unstaking_period = T::MinUnstakingPeriodLimit::get() + One::one();

        // Force unstaking period to have passed
        let curr_block_number =
            System::<T>::block_number().saturating_add(leaving_unstaking_period.into());
        System::<T>::set_block_number(curr_block_number);
        WorkingGroup::<T, _>::set_budget(
            RawOrigin::Root.into(),
            BalanceOf::<T>::max_value()
        ).unwrap();

        assert_eq!(WorkingGroup::<T, _>::budget(), BalanceOf::<T>::max_value());
    }: { WorkingGroup::<T, _>::on_initialize(curr_block_number) }
    verify {
        WorkerById::<T, I>::iter().for_each(|(worker_id, _)| {
            assert!(!WorkerById::<T, I>::contains_key(worker_id), "Worker hasn't left");
        });

        let reward_per_worker = BalanceOf::<T>::from(T::RewardPeriod::get());

        assert_eq!(
            WorkingGroup::<T, I>::budget(),
            BalanceOf::<T>::max_value()
                .saturating_sub(BalanceOf::<T>::from(i) * reward_per_worker)
                .saturating_sub(reward_per_worker),
            "Budget wasn't correctly updated, probably not all workers rewarded"
        );
    }


    on_initialize_rewarding_with_missing_reward {
        let i in 2 .. T::MaxWorkerNumberLimit::get();

        let (lead_id, _) = insert_a_worker::<T, I>(
            OpeningType::Leader,
            0,
            None
        );

        let (opening_id, successful_application_ids, _) =
            add_opening_and_apply_with_multiple_ids::<T, I>(
                &(1..i).collect(),
                &T::Origin::from(RawOrigin::Signed(lead_id.clone())),
                &OpeningType::Regular
            );

        WorkingGroup::<T, _>::fill_opening(RawOrigin::Signed(lead_id.clone()).into(), opening_id,
        successful_application_ids.clone()).unwrap();

        for i in 1..successful_application_ids.len() {
            assert!(
                WorkerById::<T, I>::contains_key(WorkerId::<T>::from(i.try_into().unwrap())),
                "Not all workers added"
            );
        }

        // Worst case scenario there is a missing reward
        force_missed_reward::<T, I>();

        // Sets periods so that we can reward
        let curr_block_number =
            System::<T>::block_number().saturating_add(T::RewardPeriod::get().into());
        System::<T>::set_block_number(curr_block_number);

        // Sets budget so that we can pay it
        WorkingGroup::<T, _>::set_budget(
            RawOrigin::Root.into(),
            BalanceOf::<T>::max_value()
        ).unwrap();

        assert_eq!(WorkingGroup::<T, _>::budget(), BalanceOf::<T>::max_value());
    }: { WorkingGroup::<T, _>::on_initialize(curr_block_number) }
    verify {
        let reward_per_worker = BalanceOf::<T>::from(T::RewardPeriod::get());

        let reward_for_workers =
            BalanceOf::<T>::from(i) * reward_per_worker * BalanceOf::<T>::from(2u32);

        assert_eq!(
            WorkingGroup::<T, _>::budget(),
            // When creating a worker using `insert_a_worker` it gives the lead a number of block
            // equating to reward period as missed reward(and the reward value is 1) therefore the
            // additional discount of balance
            BalanceOf::<T>::max_value()
                .saturating_sub(reward_for_workers)
                .saturating_sub(reward_per_worker),
            "Budget wasn't correctly updated, probably not all workers rewarded"
        );
    }

    on_initialize_rewarding_with_missing_reward_cant_pay {
        let i in 2 .. T::MaxWorkerNumberLimit::get();

        let (lead_id, _) = insert_a_worker::<T, I>(
            OpeningType::Leader,
            0,
            None
        );

        let (opening_id, successful_application_ids, _) =
            add_opening_and_apply_with_multiple_ids::<T, I>(
                &(1..i).collect(),
                &T::Origin::from(RawOrigin::Signed(lead_id.clone())),
                &OpeningType::Regular
            );

        WorkingGroup::<T, _>::fill_opening(RawOrigin::Signed(lead_id.clone()).into(), opening_id,
        successful_application_ids.clone()).unwrap();

        for i in 1..successful_application_ids.len() {
            assert!(
                WorkerById::<T, I>::contains_key(WorkerId::<T>::from(i.try_into().unwrap())),
                "Not all workers added"
            );
        }

        // Sets periods so that we can reward
        let curr_block_number =
            System::<T>::block_number().saturating_add(T::RewardPeriod::get().into());

        System::<T>::set_block_number(curr_block_number);

        // Sets budget so that we can't pay it
        WorkingGroup::<T, _>::set_budget(RawOrigin::Root.into(), Zero::zero()).unwrap();

        assert_eq!(WorkingGroup::<T, _>::budget(), Zero::zero());

    }: { WorkingGroup::<T, _>::on_initialize(curr_block_number) }
    verify {
        WorkerById::<T, I>::iter().for_each(|(_, worker)| {
            let missed_reward = worker.missed_reward.expect("There should be some missed reward");

            assert!(
                missed_reward >= BalanceOf::<T>::from(T::RewardPeriod::get()),
                "At least one worker wasn't rewarded"
            );
        });
    }

    on_initialize_rewarding_without_missing_reward {
        let i in 2 .. T::MaxWorkerNumberLimit::get();

        let (lead_id, _) = insert_a_worker::<T, I>(
            OpeningType::Leader,
            0,
            None
        );

        let (opening_id, successful_application_ids, _) =
            add_opening_and_apply_with_multiple_ids::<T, I>(
                &(1..i).collect(),
                &T::Origin::from(RawOrigin::Signed(lead_id.clone())),
                &OpeningType::Regular
            );

        WorkingGroup::<T, _>::fill_opening(RawOrigin::Signed(lead_id.clone()).into(), opening_id,
        successful_application_ids.clone()).unwrap();

        for i in 1..successful_application_ids.len() {
            assert!(
                WorkerById::<T, I>::contains_key(WorkerId::<T>::from(i.try_into().unwrap())),
                "Not all workers added"
            );
        }

        // Sets periods so that we can reward
        let curr_block_number =
            System::<T>::block_number().saturating_add(T::RewardPeriod::get().into());
        System::<T>::set_block_number(curr_block_number);

        // Sets budget so that we can pay it
        WorkingGroup::<T, _>::set_budget(
            RawOrigin::Root.into(), BalanceOf::<T>::max_value()
        ).unwrap();
        assert_eq!(WorkingGroup::<T, _>::budget(), BalanceOf::<T>::max_value());

    }: { WorkingGroup::<T, _>::on_initialize(curr_block_number) }
    verify {
        let reward_per_worker = BalanceOf::<T>::from(T::RewardPeriod::get());
        let workers_total_reward = BalanceOf::<T>::from(i) * reward_per_worker;
        assert_eq!(
            WorkingGroup::<T, _>::budget(),
            // When creating a worker using `insert_a_worker` it gives the lead a number of block
            // equating to reward period as missed reward(and the reward value is 1) therefore the
            // additional discount of balance
            BalanceOf::<T>::max_value()
                .saturating_sub(workers_total_reward)
                .saturating_sub(reward_per_worker),
            "Budget wasn't correctly updated, probably not all workers rewarded"
        );
    }

    apply_on_opening {
        let i in 1 .. MAX_BYTES;

        let (lead_account_id, lead_member_id) = member_funded_account::<T, I>("lead", 0);
        let opening_id = add_opening_helper::<T, I>(
            0,
            &T::Origin::from(RawOrigin::Root),
            &OpeningType::Leader
        );

        let apply_on_opening_params = ApplyOnOpeningParameters::<T> {
            member_id: lead_member_id,
            opening_id: opening_id.clone(),
            role_account_id: lead_account_id.clone(),
            reward_account_id: lead_account_id.clone(),
            description: vec![0u8; i.try_into().unwrap()],
            stake_parameters:
                StakeParameters {
                    stake: T::MinimumApplicationStake::get(),
                    staking_account_id: lead_account_id.clone(),
                }
        };

    }: _ (RawOrigin::Signed(lead_account_id.clone()), apply_on_opening_params.clone())
    verify {
        assert!(
            ApplicationById::<T, I>::contains_key(0),
            "Application not found"
        );

        assert_last_event::<T, I>(
            RawEvent::AppliedOnOpening(apply_on_opening_params, Zero::zero()).into()
        );
    }

    fill_opening_lead {
        let (lead_account_id, lead_member_id) = member_funded_account::<T, I>("lead", 0);
        let (opening_id, application_id) = add_and_apply_opening::<T, I>(
            0,
            &RawOrigin::Root.into(),
            &lead_account_id,
            &lead_member_id,
            &OpeningType::Leader
        );

        let mut successful_application_ids: BTreeSet<ApplicationId> = BTreeSet::new();
        successful_application_ids.insert(application_id);
    }: fill_opening(RawOrigin::Root, opening_id, successful_application_ids.clone())
    verify {
        assert!(!OpeningById::<T, I>::contains_key(opening_id), "Opening still not filled");

        let worker_id = Zero::zero();

        assert_eq!(
            WorkingGroup::<T, I>::current_lead(),
            Some(worker_id),
            "Opening for lead not filled"
        );

        let mut application_id_to_worker_id = BTreeMap::new();
        application_id_to_worker_id.insert(application_id, worker_id);

        assert_last_event::<T, I>(RawEvent::OpeningFilled(
                opening_id,
                application_id_to_worker_id,
                successful_application_ids
            ).into()
        );
    }

    fill_opening_worker {
        let i in 1 .. T::MaxWorkerNumberLimit::get() - 1;
        let (lead_id, lead_worker_id) = insert_a_worker::<T, I>(
            OpeningType::Leader,
            0,
            None
        );

        let (opening_id, successful_application_ids, _) =
            add_opening_and_apply_with_multiple_ids::<T, I>(
                &(1..i+1).collect(),
                &T::Origin::from(RawOrigin::Signed(lead_id.clone())),
                &OpeningType::Regular
            );
    }: fill_opening(
            RawOrigin::Signed(lead_id.clone()),
            opening_id,
            successful_application_ids.clone()
        )
    verify {
        assert!(!OpeningById::<T, I>::contains_key(opening_id), "Opening still not filled");

        let mut application_id_to_worker_id = BTreeMap::new();
        for (i, application_id) in successful_application_ids.iter().enumerate() {
            let worker_id = WorkerId::<T>::from((i + 1).try_into().unwrap());
            application_id_to_worker_id.insert(*application_id, worker_id);
            assert!(
                WorkerById::<T, I>::contains_key(WorkerId::<T>::from(i.try_into().unwrap())),
                "Not all workers added"
            );
        }

        assert_last_event::<T, I>(RawEvent::OpeningFilled(
                opening_id,
                application_id_to_worker_id,
                successful_application_ids
            ).into()
        );
    }

    update_role_account{
        let (lead_id, lead_worker_id) =
            insert_a_worker::<T, I>(OpeningType::Leader, 0, None);
        let new_account_id = account::<T::AccountId>("new_lead_account", 1, SEED);
    }: _ (RawOrigin::Signed(lead_id), lead_worker_id, new_account_id.clone())
    verify {
        assert_eq!(
            WorkingGroup::<T, I>::worker_by_id(lead_worker_id).role_account_id,
            new_account_id,
            "Role account notupdated"
        );

        assert_last_event::<T, I>(
            RawEvent::WorkerRoleAccountUpdated(lead_worker_id, new_account_id).into()
        );
    }

    cancel_opening {
        let (lead_id, _) =
            insert_a_worker::<T, I>(OpeningType::Leader, 0, None);
        let opening_id = add_opening_helper::<T, I>(
            1,
            &T::Origin::from(RawOrigin::Signed(lead_id.clone())),
            &OpeningType::Regular
        );

    }: _ (RawOrigin::Signed(lead_id.clone()), opening_id)
    verify {
        assert!(!OpeningById::<T, I>::contains_key(opening_id), "Opening not removed");
        assert_last_event::<T, I>(RawEvent::OpeningCanceled(opening_id).into());
    }

    withdraw_application {

        let (caller_id, member_id) = member_funded_account::<T, I>("lead", 0);
        let (_, application_id) = add_and_apply_opening::<T, I>(0,
            &RawOrigin::Root.into(),
            &caller_id,
            &member_id,
            &OpeningType::Leader
        );

    }: _ (RawOrigin::Signed(caller_id.clone()), application_id)
    verify {
        assert!(!ApplicationById::<T, I>::contains_key(application_id), "Application not removed");
        assert_last_event::<T, I>(RawEvent::ApplicationWithdrawn(application_id).into());
    }

    // Regular worker is the worst case scenario since the checks
    // require access to the storage whilist that's not the case with a lead opening
    slash_stake {
        let i in 0 .. MAX_BYTES;

        let (lead_id, lead_worker_id) =
            insert_a_worker::<T, I>(OpeningType::Leader, 0, None);
        let (caller_id, worker_id) = insert_a_worker::<T, I>(
            OpeningType::Regular,
            1,
            Some(lead_id.clone())
        );
        let slashing_amount = One::one();
        let rationale = Some(vec![0u8; i.try_into().unwrap()]);
    }: _(
        RawOrigin::Signed(lead_id.clone()),
        worker_id,
        slashing_amount,
        rationale.clone()
    )
    verify {
        assert_last_event::<T, I>(RawEvent::StakeSlashed(
                worker_id,
                slashing_amount,
                slashing_amount,
                rationale
            ).into()
        );
    }

    terminate_role_worker {
        let i in 0 .. MAX_BYTES;

        let (lead_id, _) =
            insert_a_worker::<T, I>(OpeningType::Leader, 0, None);
        let (caller_id, worker_id) = insert_a_worker::<T, I>(
            OpeningType::Regular,
            1,
            Some(lead_id.clone())
        );
        // To be able to pay unpaid reward
        let current_budget = BalanceOf::<T>::max_value();
        WorkingGroup::<T, _>::set_budget(RawOrigin::Root.into(), current_budget).unwrap();
        let penalty = Some(One::one());
        let rationale = Some(vec![0u8; i.try_into().unwrap()]);
    }: terminate_role(
            RawOrigin::Signed(lead_id.clone()),
            worker_id,
            penalty,
            rationale.clone()
        )
    verify {
        assert!(!WorkerById::<T, I>::contains_key(worker_id), "Worker not terminated");
        assert_last_event::<T, I>(RawEvent::TerminatedWorker(worker_id, penalty, rationale).into());
    }

    terminate_role_lead {
        let i in 0 .. MAX_BYTES;

        let (_, lead_worker_id) =
            insert_a_worker::<T, I>(OpeningType::Leader, 0, None);
        let current_budget = BalanceOf::<T>::max_value();
        // To be able to pay unpaid reward
        WorkingGroup::<T, _>::set_budget(RawOrigin::Root.into(), current_budget).unwrap();
        let penalty = Some(One::one());
        let rationale = Some(vec![0u8; i.try_into().unwrap()]);
    }: terminate_role(
            RawOrigin::Root,
            lead_worker_id,
            penalty,
            rationale.clone()
        )
    verify {
        assert!(!WorkerById::<T, I>::contains_key(lead_worker_id), "Worker not terminated");
        assert_last_event::<T, I>(
            RawEvent::TerminatedLeader(lead_worker_id, penalty, rationale).into()
        );
    }

    // Regular worker is the worst case scenario since the checks
    // require access to the storage whilist that's not the case with a lead opening
    increase_stake {
        let (lead_id, _) =
            insert_a_worker::<T, I>(OpeningType::Leader, 0, None);
        let (caller_id, worker_id) = insert_a_worker::<T, I>(
            OpeningType::Regular,
            1,
            Some(lead_id.clone())
        );

        let old_stake = One::one();
        WorkingGroup::<T, _>::decrease_stake(
            RawOrigin::Signed(lead_id.clone()).into(), worker_id.clone(), old_stake).unwrap();
        let new_stake = old_stake + One::one();
    }: _ (RawOrigin::Signed(caller_id.clone()), worker_id.clone(), new_stake)
    verify {
        assert_last_event::<T, I>(RawEvent::StakeIncreased(worker_id, new_stake).into());
    }

    // Regular worker is the worst case scenario since the checks
    // require access to the storage whilist that's not the case with a lead opening
    decrease_stake {
        let (lead_id, _) =
            insert_a_worker::<T, I>(OpeningType::Leader, 0, None);
        let (_, worker_id) = insert_a_worker::<T, I>(
            OpeningType::Regular,
            1,
            Some(lead_id.clone())
        );

        // I'm assuming that we will usually have MaxBalance > 1
        let new_stake = One::one();
    }: _ (RawOrigin::Signed(lead_id), worker_id, new_stake)
    verify {
        assert_last_event::<T, I>(RawEvent::StakeDecreased(worker_id, new_stake).into());
    }

    spend_from_budget {
        let (lead_id, _) = insert_a_worker::<T, I>(
            OpeningType::Leader,
            0,
            None
        );

        let current_budget = BalanceOf::<T>::max_value();
        WorkingGroup::<T, _>::set_budget(RawOrigin::Root.into(), current_budget).unwrap();
    }: _ (RawOrigin::Signed(lead_id.clone()), lead_id.clone(), current_budget, None)
    verify {
        assert_eq!(WorkingGroup::<T, I>::budget(), Zero::zero(), "Budget not updated");
        assert_last_event::<T, I>(RawEvent::BudgetSpending(lead_id, current_budget, None).into());
    }

    fund_working_group_budget {
        let amount: BalanceOf<T> = 100u32.into();

        let (account_id, member_id) = member_funded_account::<T, I>("member", 0);

    }: _ (RawOrigin::Signed(account_id.clone()), member_id.clone(), amount, Vec::new())
    verify {
        assert_eq!(WorkingGroup::<T, I>::budget(), amount, "Budget not updated");
        assert_last_event::<T, I>(
            RawEvent::WorkingGroupBudgetFunded(member_id, amount, Vec::new()).into()
        );
    }

    // Regular worker is the worst case scenario since the checks
    // require access to the storage whilist that's not the case with a lead opening
    update_reward_amount {
        let (lead_id, _) =
            insert_a_worker::<T, I>(OpeningType::Leader, 0, None);
        let (_, worker_id) = insert_a_worker::<T, I>(
            OpeningType::Regular,
            1,
            Some(lead_id.clone())
        );

        let new_reward = Some(BalanceOf::<T>::max_value());
    }: _ (RawOrigin::Signed(lead_id.clone()), worker_id, new_reward)
    verify {
        assert_eq!(
            WorkingGroup::<T, I>::worker_by_id(worker_id).reward_per_block,
            new_reward,
            "Reward not updated"
        );

        assert_last_event::<T, I>(
            RawEvent::WorkerRewardAmountUpdated(worker_id, new_reward).into()
        );
    }

    set_status_text {
        let i in 0 .. MAX_BYTES;

        let (lead_id, _) =
            insert_a_worker::<T, I>(OpeningType::Leader, 0, None);
        let status_text = Some(vec![0u8; i.try_into().unwrap()]);

    }: _ (RawOrigin::Signed(lead_id), status_text.clone())
    verify {
        let status_text_hash = T::Hashing::hash(&status_text.clone().unwrap()).as_ref().to_vec();

        assert_eq!(
            WorkingGroup::<T, I>::status_text_hash(),
            status_text_hash,
            "Status text not updated"
        );

        assert_last_event::<T, I>(
            RawEvent::StatusTextChanged(status_text_hash, status_text).into()
        );
    }

    update_reward_account {
        let (caller_id, worker_id) =
            insert_a_worker::<T, I>(OpeningType::Leader, 0, None);
        let new_id = account::<T::AccountId>("new_id", 1, 0);

    }: _ (RawOrigin::Signed(caller_id), worker_id, new_id.clone())
    verify {
        assert_eq!(
            WorkingGroup::<T, I>::worker_by_id(worker_id).reward_account_id,
            new_id,
            "Reward account not updated"
        );

        assert_last_event::<T, I>(RawEvent::WorkerRewardAccountUpdated(worker_id, new_id).into());
    }

    set_budget {
        let new_budget = BalanceOf::<T>::max_value();

    }: _(RawOrigin::Root, new_budget)
    verify {
        assert_eq!(WorkingGroup::<T, I>::budget(), new_budget, "Budget isn't updated");
        assert_last_event::<T, I>(RawEvent::BudgetSet(new_budget).into());
    }

    // Regular opening is the worst case scenario since the checks
    // require access to the storage whilist that's not the case with a lead opening
    add_opening {
        let i in 0 .. MAX_BYTES;

        let (lead_id, _) =
            insert_a_worker::<T, I>(OpeningType::Leader, 0, None);

        let stake_policy = StakePolicy {
            stake_amount: BalanceOf::<T>::max_value(),
            leaving_unstaking_period: T::BlockNumber::max_value(),
        };

        let description = vec![0u8; i.try_into().unwrap()];

    }: _(
            RawOrigin::Signed(lead_id),
            description.clone(),
            OpeningType::Regular,
            stake_policy.clone(),
            Some(BalanceOf::<T>::max_value())
        )
    verify {
        assert!(OpeningById::<T, I>::contains_key(1));
        assert_last_event::<T, I>(RawEvent::OpeningAdded(
                1,
                description,
                OpeningType::Regular,
                stake_policy,
                Some(BalanceOf::<T>::max_value())
            ).into()
        );
    }

    leave_role {
        let i in 0 .. MAX_BYTES;
        // Workers with stake can't leave immediatly
        let (caller_id, caller_worker_id) = insert_a_worker::<T, I>(
            OpeningType::Leader,
            0,
            None
        );
    }: leave_role(
            RawOrigin::Signed(caller_id),
            caller_worker_id,
            Some(vec![0u8; i.try_into().unwrap()])
        )
    verify {
        assert_eq!(
            WorkingGroup::<T, _>::worker_by_id(caller_worker_id).started_leaving_at,
            Some(System::<T>::block_number()),
            "Worker hasn't started leaving"
        );
    }

    lead_remark {
        let (caller_id, _) = insert_a_worker::<T, I>(
            OpeningType::Leader,
            0,
            None
        );
        let msg = b"test".to_vec();
    }: _ (RawOrigin::Signed(caller_id), msg.clone())
        verify {
            assert_last_event::<T, I>(RawEvent::LeadRemarked(msg).into());
        }

    worker_remark {
        let (lead_id, _) =
            insert_a_worker::<T, I>(OpeningType::Leader, 0, None);
        let (caller_id, worker_id) = insert_a_worker::<T, I>(
            OpeningType::Regular,
            1,
            Some(lead_id.clone()));
        let msg = b"test".to_vec();
    }: _ (RawOrigin::Signed(caller_id), worker_id, msg.clone())
        verify {
            assert_last_event::<T, I>(RawEvent::WorkerRemarked(worker_id, msg).into());
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tests::{build_test_externalities, Test};
    use frame_support::assert_ok;

    #[test]
    fn test_leave_role() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_leave_role::<Test>());
        });
    }

    #[test]
    fn test_add_opening() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_add_opening::<Test>());
        });
    }

    #[test]
    fn test_set_budget() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_set_budget::<Test>());
        });
    }

    #[test]
    fn test_update_reward_account() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_update_reward_account::<Test>());
        });
    }

    #[test]
    fn test_set_status_text() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_set_status_text::<Test>());
        });
    }

    #[test]
    fn test_update_reward_amount() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_update_reward_amount::<Test>());
        });
    }

    #[test]
    fn test_spend_from_budget() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_spend_from_budget::<Test>());
        });
    }

    #[test]
    fn test_decrease_stake() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_decrease_stake::<Test>());
        });
    }

    #[test]
    fn test_increase_stake() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_increase_stake::<Test>());
        });
    }

    #[test]
    fn test_terminate_role_lead() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_terminate_role_lead::<Test>());
        });
    }

    #[test]
    fn test_terminate_role_worker() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_terminate_role_worker::<Test>());
        });
    }

    #[test]
    fn test_slash_stake() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_slash_stake::<Test>());
        });
    }

    #[test]
    fn test_withdraw_application() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_withdraw_application::<Test>());
        });
    }

    #[test]
    fn test_cancel_opening() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_cancel_opening::<Test>());
        });
    }

    #[test]
    fn test_update_role_account() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_update_role_account::<Test>());
        });
    }

    #[test]
    fn test_fill_opening_worker() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_fill_opening_worker::<Test>());
        });
    }

    #[test]
    fn test_fill_opening_lead() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_fill_opening_lead::<Test>());
        });
    }

    #[test]
    fn test_apply_on_opening() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_apply_on_opening::<Test>());
        });
    }

    #[test]
    fn test_on_inintialize_rewarding_without_missing_reward() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_on_initialize_rewarding_without_missing_reward::<Test>());
        });
    }

    #[test]
    fn test_on_inintialize_rewarding_with_missing_reward_cant_pay() {
        build_test_externalities().execute_with(|| {
            assert_ok!(
                test_benchmark_on_initialize_rewarding_with_missing_reward_cant_pay::<Test>()
            );
        });
    }

    #[test]
    fn test_on_inintialize_rewarding_with_missing_reward() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_on_initialize_rewarding_with_missing_reward::<Test>());
        });
    }

    #[test]
    fn test_on_inintialize_leaving() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_on_initialize_leaving::<Test>());
        });
    }

    #[test]
    fn test_fund_working_group_budget() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_fund_working_group_budget::<Test>());
        });
    }

    #[test]
    fn test_lead_remark() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_lead_remark::<Test>());
        });
    }

    #[test]
    fn test_worker_remark() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_worker_remark::<Test>());
        });
    }
}
