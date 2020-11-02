#![cfg(feature = "runtime-benchmarks")]
use super::*;
use core::convert::TryInto;
use frame_benchmarking::{account, benchmarks_instance, Zero};
use frame_support::traits::OnInitialize;
use sp_runtime::traits::Bounded;
use sp_std::prelude::*;
use system as frame_system;
use system::Module as System;
use system::RawOrigin;

use crate::types::StakeParameters;
use crate::Module as WorkingTeam;
use membership::Module as Membership;

const SEED: u32 = 0;

fn get_byte(num: u32, byte_number: u8) -> u8 {
    ((num & (0xff << (8 * byte_number))) >> 8 * byte_number) as u8
}

fn add_and_apply_opening<T: Trait<I>, I: Instance>(
    id: u32,
    add_opening_origin: T::Origin,
    without_stake: bool,
    applicant_id: T::AccountId,
    member_id: T::MemberId,
    job_opening_type: JobOpeningType,
) -> (T::OpeningId, T::ApplicationId) {
    let (staking_policy, stake_parameters) = if without_stake {
        (None, None)
    } else {
        (
            Some(StakePolicy {
                stake_amount: One::one(),
                leaving_unstaking_period: T::MinUnstakingPeriodLimit::get() + One::one(),
            }),
            Some(StakeParameters {
                stake: BalanceOfCurrency::<T>::max_value(),
                staking_account_id: applicant_id.clone(),
            }),
        )
    };

    WorkingTeam::<T, I>::add_opening(
        add_opening_origin.clone(),
        vec![],
        job_opening_type,
        staking_policy,
        Some(RewardPolicy {
            reward_per_block: One::one(),
        }),
    )
    .unwrap();

    let opening_id = T::OpeningId::from(id.try_into().unwrap());

    WorkingTeam::<T, I>::apply_on_opening(
        RawOrigin::Signed(applicant_id.clone()).into(),
        ApplyOnOpeningParameters::<T, I> {
            member_id,
            opening_id,
            role_account_id: applicant_id.clone(),
            reward_account_id: applicant_id.clone(),
            description: vec![],
            stake_parameters,
        },
    )
    .unwrap();

    let application_id = T::ApplicationId::from(id.try_into().unwrap());

    (opening_id, application_id)
}

// Method to generate a distintic valid handle
// for a membership. For each index.
// TODO: This will only work as long as min_handle_length >= 4
fn handle_from_id<T: membership::Trait>(id: u32) -> Vec<u8> {
    let min_handle_length = Membership::<T>::min_handle_length();
    // If the index is ever different from u32 change this
    let mut handle = vec![
        get_byte(id, 0),
        get_byte(id, 1),
        get_byte(id, 2),
        get_byte(id, 3),
    ];

    while handle.len() < (min_handle_length as usize) {
        handle.push(0u8);
    }

    handle
}

fn member_funded_account<T: membership::Trait>(
    name: &'static str,
    id: u32,
) -> (T::AccountId, T::MemberId) {
    let account_id = account::<T::AccountId>(name, id, SEED);
    let handle = handle_from_id::<T>(id);

    let _ = <T as common::currency::GovernanceCurrency>::Currency::make_free_balance_be(
        &account_id,
        BalanceOfCurrency::<T>::max_value(),
    );

    Membership::<T>::buy_membership(
        RawOrigin::Signed(account_id.clone()).into(),
        Zero::zero(),
        Some(handle),
        None,
        None,
    )
    .unwrap();

    (account_id, T::MemberId::from(id.try_into().unwrap()))
}

fn insert_a_worker<T: Trait<I>, I: Instance>(
    without_stake: bool, // TODO: Check this
    job_opening_type: JobOpeningType,
    id: u32,
    lead_id: Option<T::AccountId>,
) -> (T::AccountId, TeamWorkerId<T>)
where
    WorkingTeam<T, I>: OnInitialize<T::BlockNumber>,
{
    let add_worker_origin = match job_opening_type {
        JobOpeningType::Leader => RawOrigin::Root,
        JobOpeningType::Regular => RawOrigin::Signed(lead_id.clone().unwrap()),
    };

    let (caller_id, member_id) = member_funded_account::<T>("member", id);

    let (opening_id, application_id) = add_and_apply_opening::<T, I>(
        id,
        add_worker_origin.clone().into(),
        without_stake,
        caller_id.clone(),
        member_id.clone(),
        job_opening_type,
    );

    let mut successful_application_ids = BTreeSet::<T::ApplicationId>::new();
    successful_application_ids.insert(application_id);
    WorkingTeam::<T, I>::fill_opening(
        add_worker_origin.clone().into(),
        opening_id,
        successful_application_ids,
    )
    .unwrap();

    // Force a missed_reward for the created worker
    // Every worst case either include or doesn't mind having a non-zero
    // remaining reward
    let curr_block_number =
        System::<T>::block_number().saturating_add(T::RewardPeriod::get().into());
    System::<T>::set_block_number(curr_block_number);
    WorkingTeam::<T, I>::set_budget(RawOrigin::Root.into(), Zero::zero()).unwrap();
    WorkingTeam::<T, I>::on_initialize(curr_block_number);

    (caller_id, TeamWorkerId::<T>::from(id.try_into().unwrap()))
}

benchmarks_instance! {
    _ { }

    on_initialize_leaving {
      let i in 1 .. T::MaxWorkerNumberLimit::get();

      let (lead_id, lead_worker_id) = insert_a_worker::<T, I>(false, JobOpeningType::Leader, 0, None);

      let leaving_unstaking_period = T::MinUnstakingPeriodLimit::get() + One::one();

      WorkingTeam::<T, I>::add_opening(
          RawOrigin::Signed(lead_id.clone()).into(),
          vec![],
          JobOpeningType::Regular,
          Some(StakePolicy {
            stake_amount: One::one(),
            leaving_unstaking_period,
          }),
          Some(RewardPolicy {
              reward_per_block: One::one(),
          }),
      )
      .unwrap();

      let opening_id: T::OpeningId = One::one();
      let mut last_application_id: T::ApplicationId = Zero::zero();
      let mut successful_application_ids = BTreeSet::new();
      let mut account_ids = vec![];
      for member in 0 .. i - 1 {
        let (applicant_account_id, last_member_id) = member_funded_account::<T>("member", member + 1);
        account_ids.push(applicant_account_id.clone());

        WorkingTeam::<T, I>::apply_on_opening(
            RawOrigin::Signed(applicant_account_id.clone()).into(),
            ApplyOnOpeningParameters::<T, I> {
                member_id: last_member_id,
                opening_id: opening_id.clone(),
                role_account_id: applicant_account_id.clone(),
                reward_account_id: applicant_account_id.clone(),
                description: vec![],
                stake_parameters: Some(
                  StakeParameters {
                    stake: One::one(),
                    staking_account_id: applicant_account_id.clone(),
                }),
            },
        ).unwrap();

        last_application_id = last_application_id.saturating_add(One::one());
        successful_application_ids.insert(last_application_id);
      }

      WorkingTeam::<T, I>::fill_opening(RawOrigin::Signed(lead_id.clone()).into(), opening_id,
      successful_application_ids).unwrap();

      let curr_block_number =
          System::<T>::block_number().saturating_add(T::RewardPeriod::get().into());
      System::<T>::set_block_number(curr_block_number);
      WorkingTeam::<T, I>::set_budget(RawOrigin::Root.into(), Zero::zero()).unwrap();
      WorkingTeam::<T, I>::on_initialize(curr_block_number);

      let mut worker_id = Zero::zero();
      for account_id in account_ids {
        worker_id += One::one();
        WorkingTeam::<T, I>::leave_role(RawOrigin::Signed(account_id).into(), worker_id).unwrap();
      }

      // Worst case scenario one of the leaving workers is the lead
      WorkingTeam::<T, I>::leave_role(RawOrigin::Signed(lead_id).into(), lead_worker_id).unwrap();

      let curr_block_number =
          System::<T>::block_number().saturating_add(leaving_unstaking_period.into());
      System::<T>::set_block_number(curr_block_number);
      WorkingTeam::<T, I>::set_budget(RawOrigin::Root.into(), BalanceOfCurrency::<T>::max_value()).unwrap();

    }: { WorkingTeam::<T, I>::on_initialize(curr_block_number) }
    verify { }


    on_initialize_rewarding_with_missing_reward {
      let i in 1 .. T::MaxWorkerNumberLimit::get();

      let (lead_id, _) = insert_a_worker::<T, I>(false, JobOpeningType::Leader, 0, None);


      WorkingTeam::<T, I>::add_opening(
          RawOrigin::Signed(lead_id.clone()).into(),
          vec![],
          JobOpeningType::Regular,
          Some(StakePolicy {
            stake_amount: One::one(),
            leaving_unstaking_period: T::BlockNumber::max_value(),
          }),
          Some(RewardPolicy {
              reward_per_block: One::one(),
          }),
      )
      .unwrap();


      let opening_id: T::OpeningId = One::one();
      let mut last_application_id: T::ApplicationId = Zero::zero();
      let mut successful_application_ids = BTreeSet::new();
      for member in 0 .. i - 1 {
        let (applicant_account_id, last_member_id) = member_funded_account::<T>("member", member + 1);

        WorkingTeam::<T, I>::apply_on_opening(
            RawOrigin::Signed(applicant_account_id.clone()).into(),
            ApplyOnOpeningParameters::<T, I> {
                member_id: last_member_id,
                opening_id: opening_id.clone(),
                role_account_id: applicant_account_id.clone(),
                reward_account_id: applicant_account_id.clone(),
                description: vec![],
                stake_parameters: Some(
                  StakeParameters {
                    stake: BalanceOfCurrency::<T>::max_value(),
                    staking_account_id: applicant_account_id.clone(),
                }),
            },
        ).unwrap();

        last_application_id = last_application_id.saturating_add(One::one());
        successful_application_ids.insert(last_application_id);
      }

      WorkingTeam::<T, I>::fill_opening(RawOrigin::Signed(lead_id.clone()).into(), opening_id,
      successful_application_ids).unwrap();


      let curr_block_number =
          System::<T>::block_number().saturating_add(T::RewardPeriod::get().into());
      System::<T>::set_block_number(curr_block_number);
      WorkingTeam::<T, I>::set_budget(RawOrigin::Root.into(), Zero::zero()).unwrap();
      WorkingTeam::<T, I>::on_initialize(curr_block_number);

      let curr_block_number =
          System::<T>::block_number().saturating_add(T::RewardPeriod::get().into());
      System::<T>::set_block_number(curr_block_number);
      WorkingTeam::<T, I>::set_budget(RawOrigin::Root.into(), BalanceOfCurrency::<T>::max_value()).unwrap();

    }: { WorkingTeam::<T, I>::on_initialize(curr_block_number) }
    verify { }

    on_initialize_rewarding_without_missing_reward {
      let i in 1 .. T::MaxWorkerNumberLimit::get();

      let (lead_id, _) = insert_a_worker::<T, I>(false, JobOpeningType::Leader, 0, None);


      WorkingTeam::<T, I>::add_opening(
          RawOrigin::Signed(lead_id.clone()).into(),
          vec![],
          JobOpeningType::Regular,
          Some(StakePolicy {
            stake_amount: One::one(),
            leaving_unstaking_period: T::BlockNumber::max_value(),
          }),
          Some(RewardPolicy {
              reward_per_block: One::one(),
          }),
      )
      .unwrap();


      let opening_id: T::OpeningId = One::one();
      let mut last_application_id: T::ApplicationId = Zero::zero();
      let mut successful_application_ids = BTreeSet::new();
      for member in 0 .. i - 1 {
        let (applicant_account_id, last_member_id) = member_funded_account::<T>("member", member + 1);

        WorkingTeam::<T, I>::apply_on_opening(
            RawOrigin::Signed(applicant_account_id.clone()).into(),
            ApplyOnOpeningParameters::<T, I> {
                member_id: last_member_id,
                opening_id: opening_id.clone(),
                role_account_id: applicant_account_id.clone(),
                reward_account_id: applicant_account_id.clone(),
                description: vec![],
                stake_parameters: Some(
                  StakeParameters {
                    stake: BalanceOfCurrency::<T>::max_value(),
                    staking_account_id: applicant_account_id.clone(),
                }),
            },
        ).unwrap();

        last_application_id = last_application_id.saturating_add(One::one());
        successful_application_ids.insert(last_application_id);
      }

      WorkingTeam::<T, I>::fill_opening(RawOrigin::Signed(lead_id.clone()).into(), opening_id,
      successful_application_ids).unwrap();

      let curr_block_number =
          System::<T>::block_number().saturating_add(T::RewardPeriod::get().into());
      System::<T>::set_block_number(curr_block_number);

      WorkingTeam::<T, I>::set_budget(RawOrigin::Root.into(), BalanceOfCurrency::<T>::max_value()).unwrap();

    }: { WorkingTeam::<T, I>::on_initialize(curr_block_number) }
    verify { }

    apply_on_opening {
      let i in 1 .. 50000;

      let (lead_account_id, lead_member_id) = member_funded_account::<T>("lead", 0);

      WorkingTeam::<T, I>::add_opening(
          RawOrigin::Root.into(),
          vec![],
          JobOpeningType::Leader,
          Some(StakePolicy {
            stake_amount: One::one(),
            leaving_unstaking_period: T::BlockNumber::max_value(),
          }),
          None,
      ).unwrap();

      let apply_on_opening_params = ApplyOnOpeningParameters::<T, I> {
        member_id: lead_member_id,
        opening_id: Zero::zero(),
        role_account_id: lead_account_id.clone(),
        reward_account_id: lead_account_id.clone(),
        description: vec![0u8].repeat(i as usize),
        stake_parameters: Some(
          StakeParameters {
            stake: BalanceOfCurrency::<T>::max_value(),
            staking_account_id: lead_account_id.clone(),
          }
        ),
      };

    }: _ (RawOrigin::Signed(lead_account_id.clone()), apply_on_opening_params)
    verify { }

    fill_opening_lead {
      let i in 0 .. 10;

      WorkingTeam::<T, I>::add_opening(
          RawOrigin::Root.into(),
          vec![],
          JobOpeningType::Leader,
          None,
          None,
      ).unwrap();

      let (lead_account_id, lead_member_id) = member_funded_account::<T>("lead", 0);
      let opening_id = Zero::zero();

      WorkingTeam::<T, I>::apply_on_opening(
          RawOrigin::Signed(lead_account_id.clone()).into(),
          ApplyOnOpeningParameters::<T, I> {
              member_id: lead_member_id,
              opening_id,
              role_account_id: lead_account_id.clone(),
              reward_account_id: lead_account_id.clone(),
              description: vec![],
              stake_parameters: None,
          },
      ).unwrap();

      let mut successful_application_ids: BTreeSet<T::ApplicationId> = BTreeSet::new();
      successful_application_ids.insert(Zero::zero());
    }: fill_opening(RawOrigin::Root, opening_id, successful_application_ids)
    verify {}

    fill_opening_worker { // We can actually fill an opening with 0 applications?
      let i in 0 .. T::MaxWorkerNumberLimit::get() - 1;
      let (lead_id, lead_worker_id) = insert_a_worker::<T, I>(true, JobOpeningType::Leader, 0, None);

      WorkingTeam::<T, I>::add_opening(
          RawOrigin::Signed(lead_id.clone()).into(),
          vec![],
          JobOpeningType::Regular,
          None,
          None,
      )
      .unwrap();
      let opening_id: T::OpeningId = One::one();
      let mut last_application_id: T::ApplicationId = Zero::zero();
      let mut successful_application_ids = BTreeSet::new();
      for member in 0 .. i {
        let (applicant_account_id, last_member_id) = member_funded_account::<T>("member", member + 1);

        WorkingTeam::<T, I>::apply_on_opening(
            RawOrigin::Signed(applicant_account_id.clone()).into(),
            ApplyOnOpeningParameters::<T, I> {
                member_id: last_member_id,
                opening_id: opening_id.clone(),
                role_account_id: applicant_account_id.clone(),
                reward_account_id: applicant_account_id.clone(),
                description: vec![],
                stake_parameters: None,
            },
        ).unwrap();

        last_application_id = last_application_id.saturating_add(One::one());
        successful_application_ids.insert(last_application_id);
      }
    }: fill_opening(RawOrigin::Signed(lead_id.clone()), opening_id, successful_application_ids)
    verify {}

    update_role_account{
      let i in 1 .. 10;
      let (lead_id, lead_worker_id) = insert_a_worker::<T, I>(true, JobOpeningType::Leader, 0, None);

      let new_account_id = account::<T::AccountId>("new_lead_account", 1, SEED);
    }: _ (RawOrigin::Signed(lead_id), lead_worker_id, new_account_id)
    verify {}

    cancel_opening {
      let i in 1 .. 10;

      let (lead_id, _) = insert_a_worker::<T, I>(true, JobOpeningType::Leader, 0, None);

      WorkingTeam::<T, I>::add_opening(
          RawOrigin::Signed(lead_id.clone()).into(),
          vec![],
          JobOpeningType::Regular,
          None,
          None,
      )
      .unwrap();
    }: _ (RawOrigin::Signed(lead_id.clone()), One::one())
    verify {}

    withdraw_application {
      let i in 1 .. 10;

      let (caller_id, member_id) = member_funded_account::<T>("lead", 0);

      let staking_policy = Some(
        StakePolicy {
          stake_amount: One::one(),
          leaving_unstaking_period: T::MinUnstakingPeriodLimit::get() + One::one(),
        }
      );

      let stake_parameters = Some(
        StakeParameters {
          stake: BalanceOfCurrency::<T>::max_value(),
          staking_account_id: caller_id.clone(),
        }
      );


      WorkingTeam::<T, I>::add_opening(
          RawOrigin::Root.into(),
          vec![],
          JobOpeningType::Leader,
          staking_policy,
          Some(RewardPolicy {
              reward_per_block: One::one(),
          }),
      )
      .unwrap();

      WorkingTeam::<T, I>::apply_on_opening(
          RawOrigin::Signed(caller_id.clone()).into(),
          ApplyOnOpeningParameters::<T, I> {
              member_id,
              opening_id: Zero::zero(),
              role_account_id: caller_id.clone(),
              reward_account_id: caller_id.clone(),
              description: vec![],
              stake_parameters,
          },
      )
      .unwrap();

    }: _ (RawOrigin::Signed(caller_id.clone()), Zero::zero())
    verify {}

    // Regular worker is the worst case scenario since the checks
    // require access to the storage whilist that's not the case with a lead opening
    slash_stake {
      let i in 0 .. 10;

      let (lead_id, lead_worker_id) = insert_a_worker::<T, I>(true, JobOpeningType::Leader, 0, None);
      let (caller_id, worker_id) = insert_a_worker::<T, I>(false, JobOpeningType::Regular, 1, Some(lead_id.clone()));
      let penalty = Penalty {
        slashing_text: vec![],
        slashing_amount: One::one(),
      };
    }: _(RawOrigin::Signed(lead_id.clone()), worker_id, penalty)
    verify {}

    terminate_role_worker {
      let i in 0 .. 10;

      let (lead_id, _) = insert_a_worker::<T, I>(true, JobOpeningType::Leader, 0, None);
      let (caller_id, worker_id) = insert_a_worker::<T, I>(false, JobOpeningType::Regular, 1, Some(lead_id.clone()));
      // To be able to pay unpaid reward
      let current_budget = BalanceOfCurrency::<T>::max_value();
      WorkingTeam::<T, I>::set_budget(RawOrigin::Root.into(), current_budget).unwrap();
      let penalty = Penalty {
        slashing_text: vec![],
        slashing_amount: One::one(),
      };
    }: terminate_role(RawOrigin::Signed(lead_id.clone()), worker_id, Some(penalty))
    verify {}

    terminate_role_lead {
      let i in 0 .. 10;

      let (_, lead_worker_id) = insert_a_worker::<T, I>(false, JobOpeningType::Leader, 0, None);
      let current_budget = BalanceOfCurrency::<T>::max_value();
      // To be able to pay unpaid reward
      WorkingTeam::<T, I>::set_budget(RawOrigin::Root.into(), current_budget).unwrap();
      let penalty = Penalty {
        slashing_text: vec![],
        slashing_amount: One::one(),
      };
    }: terminate_role(RawOrigin::Root, lead_worker_id, Some(penalty))
    verify {}

    // Regular worker is the worst case scenario since the checks
    // require access to the storage whilist that's not the case with a lead opening
    increase_stake {
      let i in 0 .. 10;

      let (lead_id, _) = insert_a_worker::<T, I>(true, JobOpeningType::Leader, 0, None);
      let (caller_id, worker_id) = insert_a_worker::<T, I>(false, JobOpeningType::Regular, 1, Some(lead_id.clone()));

      let old_stake = One::one();
      WorkingTeam::<T, I>::decrease_stake(RawOrigin::Signed(lead_id.clone()).into(), worker_id.clone(), old_stake).unwrap();
      let new_stake = BalanceOfCurrency::<T>::max_value();
    }: _ (RawOrigin::Signed(caller_id.clone()), worker_id.clone(), new_stake)
    verify {}

    // Regular worker is the worst case scenario since the checks
    // require access to the storage whilist that's not the case with a lead opening
    decrease_stake {
      let i in 0 .. 10;

      let (lead_id, _) = insert_a_worker::<T, I>(true, JobOpeningType::Leader, 0, None);
      let (_, worker_id) = insert_a_worker::<T, I>(false, JobOpeningType::Regular, 1, Some(lead_id.clone()));

      // I'm assuming that we will usually have MaxBalance > 1
      let new_stake = One::one();
    }: _ (RawOrigin::Signed(lead_id), worker_id, new_stake)
    verify {}

    spend_from_budget {
      let i in 0 .. 10;

      let (lead_id, _) = insert_a_worker::<T, I>(true, JobOpeningType::Leader, 0, None);

      let current_budget = BalanceOfCurrency::<T>::max_value();
      WorkingTeam::<T, I>::set_budget(RawOrigin::Root.into(), current_budget).unwrap();
    }: _ (RawOrigin::Signed(lead_id.clone()), lead_id.clone(), current_budget, None)
    verify {}

    // Regular worker is the worst case scenario since the checks
    // require access to the storage whilist that's not the case with a lead opening
    update_reward_amount {
      let i in 0 .. 10;

      let (lead_id, _) = insert_a_worker::<T, I>(true, JobOpeningType::Leader, 0, None);
      let (_, worker_id) = insert_a_worker::<T, I>(true, JobOpeningType::Regular, 1, Some(lead_id.clone()));
      let new_reward = Some(BalanceOfCurrency::<T>::max_value());
    }: _ (RawOrigin::Signed(lead_id.clone()), worker_id, new_reward)
    verify {}

    set_status_text {
      let i in 0 .. 50000; // TODO: We should have a bounded value for description

      let (lead_id, _) = insert_a_worker::<T, I>(true, JobOpeningType::Leader, 0, None);
      let status_text = Some(vec![0u8].repeat(i.try_into().unwrap()));

    }: _ (RawOrigin::Signed(lead_id), status_text)
    verify {}

    update_reward_account {
      let i in 0 .. 10;

      let (caller_id, worker_id) = insert_a_worker::<T, I>(true, JobOpeningType::Leader, 0, None);
      let new_id = account::<T::AccountId>("new_id", 1, 0);

    }: _ (RawOrigin::Signed(caller_id), worker_id, new_id)
    verify {}

    set_budget {
      let i in 0 .. 10;

      let new_budget = BalanceOfCurrency::<T>::max_value();

    }: _(RawOrigin::Root, new_budget)
    verify { }

    // Regular opening is the worst case scenario since the checks
    // require access to the storage whilist that's not the case with a lead opening
    add_opening{
      let i in 0 .. 50000; // TODO: We should have a bounded value for description

      let (lead_id, _) = insert_a_worker::<T, I>(true, JobOpeningType::Leader, 0, None);


      let stake_policy = StakePolicy {
        stake_amount: BalanceOfCurrency::<T>::max_value(),
        leaving_unstaking_period: T::BlockNumber::max_value(),
      };

      let reward_policy = RewardPolicy {
        reward_per_block: BalanceOfCurrency::<T>::max_value(),
      };

      let description = vec![0u8].repeat(i.try_into().unwrap());

    }: _(RawOrigin::Signed(lead_id), description, JobOpeningType::Regular, Some(stake_policy), Some(reward_policy))
    verify { }

    // This is always worse than leave_role_immediatly
    leave_role_immediatly {
        let i in 0 .. 10; // TODO: test not running if we don't set a range of values
        // Worst case scenario there is a lead(this requires **always** more steps)
        // could separate into new branch to tighten weight
        // Also, workers without stake can leave immediatly
        let (caller_id, lead_worker_id) = insert_a_worker::<T, I>(true, JobOpeningType::Leader, 0, None);

        // To be able to pay unpaid reward
        WorkingTeam::<T, I>::set_budget(RawOrigin::Root.into(), BalanceOfCurrency::<T>::max_value()).unwrap();
    }: leave_role(RawOrigin::Signed(caller_id), lead_worker_id)
    verify { }


    // Generally speaking this seems to be always the best case scenario
    // but since it's so obviously a different branch I think it's a good idea
    // to leave this branch and use tha max between these 2
    leave_role_later {
        let i in 0 .. 10;

        // Workers with stake can't leave immediatly
        let (caller_id, caller_worker_id) = insert_a_worker::<T, I>(true, JobOpeningType::Leader, 0, None);
    }: leave_role(RawOrigin::Signed(caller_id), caller_worker_id)
    verify { }
}

/*
TODO: we need to implement new_test_ext that creates a `sp_io::TestExternalities`
#[cfg(test)]
mod tests {
    use super::*;
    use crate::tests::{new_test_ext, Test};
    use frame_support::assert_ok;

    #[test]
    fn test_benchmarks() {
        new_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_leave_role::<Test>());
        });
    }
}
*/
