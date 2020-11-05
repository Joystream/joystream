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

enum StakingRole {
    WithStakes,
    WithoutStakes,
}

fn get_byte(num: u32, byte_number: u8) -> u8 {
    ((num & (0xff << (8 * byte_number))) >> 8 * byte_number) as u8
}

fn add_opening_helper<T: Trait<I>, I: Instance>(
    id: u32,
    add_opening_origin: &T::Origin,
    staking_role: &StakingRole,
    job_opening_type: &JobOpeningType,
) -> T::OpeningId {
    let staking_policy = match staking_role {
        StakingRole::WithStakes => Some(StakePolicy {
            stake_amount: One::one(),
            leaving_unstaking_period: T::MinUnstakingPeriodLimit::get() + One::one(),
        }),
        StakingRole::WithoutStakes => None,
    };

    WorkingTeam::<T, I>::add_opening(
        add_opening_origin.clone(),
        vec![],
        *job_opening_type,
        staking_policy,
        Some(RewardPolicy {
            reward_per_block: One::one(),
        }),
    )
    .unwrap();

    T::OpeningId::from(id.try_into().unwrap())
}

fn apply_on_opening_helper<T: Trait<I>, I: Instance>(
    id: u32,
    staking_role: &StakingRole,
    applicant_id: &T::AccountId,
    member_id: &T::MemberId,
    opening_id: &T::OpeningId,
) -> T::ApplicationId {
    let stake_parameters = match staking_role {
        StakingRole::WithStakes => Some(StakeParameters {
            stake: BalanceOfCurrency::<T>::max_value(),
            staking_account_id: applicant_id.clone(),
        }),
        StakingRole::WithoutStakes => None,
    };

    WorkingTeam::<T, I>::apply_on_opening(
        RawOrigin::Signed(applicant_id.clone()).into(),
        ApplyOnOpeningParameters::<T, I> {
            member_id: *member_id,
            opening_id: *opening_id,
            role_account_id: applicant_id.clone(),
            reward_account_id: applicant_id.clone(),
            description: vec![],
            stake_parameters,
        },
    )
    .unwrap();

    T::ApplicationId::from(id.try_into().unwrap())
}

fn add_opening_and_n_apply<T: Trait<I>, I: Instance>(
    ids: &Vec<u32>,
    add_opening_origin: &T::Origin,
    staking_role: &StakingRole,
    job_opening_type: &JobOpeningType,
) -> (T::OpeningId, BTreeSet<T::ApplicationId>, Vec<T::AccountId>) {
    let opening_id =
        add_opening_helper::<T, I>(1, add_opening_origin, &staking_role, job_opening_type);

    let mut successful_application_ids = BTreeSet::new();

    let mut account_ids = Vec::new();
    for id in ids.iter() {
        let (applicant_account_id, applicant_member_id) = member_funded_account::<T>("member", *id);
        let application_id = apply_on_opening_helper::<T, I>(
            *id,
            &staking_role,
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
    staking_role: &StakingRole,
    applicant_id: &T::AccountId,
    member_id: &T::MemberId,
    job_opening_type: &JobOpeningType,
) -> (T::OpeningId, T::ApplicationId) {
    let opening_id =
        add_opening_helper::<T, I>(id, add_opening_origin, staking_role, job_opening_type);

    let application_id =
        apply_on_opening_helper::<T, I>(id, staking_role, applicant_id, member_id, &opening_id);

    (opening_id, application_id)
}

// Method to generate a distintic valid handle
// for a membership. For each index.
// TODO: This will only work as long as max_handle_length >= 4
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

fn force_missed_reward<T: Trait<I>, I: Instance>() {
    let curr_block_number =
        System::<T>::block_number().saturating_add(T::RewardPeriod::get().into());
    System::<T>::set_block_number(curr_block_number);
    WorkingTeam::<T, I>::set_budget(RawOrigin::Root.into(), Zero::zero()).unwrap();
    WorkingTeam::<T, I>::on_initialize(curr_block_number);
}

fn insert_a_worker<T: Trait<I>, I: Instance>(
    staking_role: StakingRole,
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
        &T::Origin::from(add_worker_origin.clone()),
        &staking_role,
        &caller_id,
        &member_id,
        &job_opening_type,
    );

    let mut successful_application_ids = BTreeSet::<T::ApplicationId>::new();
    successful_application_ids.insert(application_id);
    WorkingTeam::<T, I>::fill_opening(
        add_worker_origin.clone().into(),
        opening_id,
        successful_application_ids,
    )
    .unwrap();

    // Every worst case either include or doesn't mind having a non-zero
    // remaining reward
    force_missed_reward::<T, I>();

    (caller_id, TeamWorkerId::<T>::from(id.try_into().unwrap()))
}

benchmarks_instance! {
    _ { }

    on_initialize_leaving {
      let i in 1 .. T::MaxWorkerNumberLimit::get();

      let (lead_id, lead_worker_id) = insert_a_worker::<T, I>(StakingRole::WithStakes, JobOpeningType::Leader, 0, None);

      let (opening_id, successful_application_ids, application_account_id) = add_opening_and_n_apply::<T, I>(
        &(1..i).collect(),
        &T::Origin::from(RawOrigin::Signed(lead_id.clone())),
        &StakingRole::WithStakes,
        &JobOpeningType::Regular
      );

      WorkingTeam::<T, I>::fill_opening(RawOrigin::Signed(lead_id.clone()).into(), opening_id,
      successful_application_ids).unwrap();

      force_missed_reward::<T,I>();

      // Force all workers to leave (Including the lead)
      // We should have every TeamWorkerId from 0 to i-1
      // Corresponding to each account id
      let mut worker_id = Zero::zero();
      for id in application_account_id {
        worker_id += One::one();
        WorkingTeam::<T, I>::leave_role(RawOrigin::Signed(id).into(), worker_id).unwrap();
      }

      // Worst case scenario one of the leaving workers is the lead
      WorkingTeam::<T, I>::leave_role(RawOrigin::Signed(lead_id).into(), lead_worker_id).unwrap();

      // Maintain consistency with add_opening_helper
      let leaving_unstaking_period = T::MinUnstakingPeriodLimit::get() + One::one();

      // Force unstaking period to have passed
      let curr_block_number =
          System::<T>::block_number().saturating_add(leaving_unstaking_period.into());
      System::<T>::set_block_number(curr_block_number);
      WorkingTeam::<T, I>::set_budget(RawOrigin::Root.into(), BalanceOfCurrency::<T>::max_value()).unwrap();

    }: { WorkingTeam::<T, I>::on_initialize(curr_block_number) }
    verify { }


    on_initialize_rewarding_with_missing_reward {
      let i in 1 .. T::MaxWorkerNumberLimit::get();

      let (lead_id, _) = insert_a_worker::<T, I>(StakingRole::WithStakes, JobOpeningType::Leader, 0, None);

      let (opening_id, successful_application_ids, _) = add_opening_and_n_apply::<T, I>(
        &(1..i).collect(),
        &T::Origin::from(RawOrigin::Signed(lead_id.clone())),
        &StakingRole::WithStakes,
        &JobOpeningType::Regular
      );

      WorkingTeam::<T, I>::fill_opening(RawOrigin::Signed(lead_id.clone()).into(), opening_id,
      successful_application_ids).unwrap();

      // Worst case scenario there is a missing reward
      force_missed_reward::<T, I>();

      // Sets periods so that we can reward
      let curr_block_number =
          System::<T>::block_number().saturating_add(T::RewardPeriod::get().into());
      System::<T>::set_block_number(curr_block_number);

      // Sets budget so that we can pay it
      WorkingTeam::<T, I>::set_budget(RawOrigin::Root.into(), BalanceOfCurrency::<T>::max_value()).unwrap();

    }: { WorkingTeam::<T, I>::on_initialize(curr_block_number) }
    verify { }

    on_initialize_rewarding_with_missing_reward_cant_pay {
      let i in 1 .. T::MaxWorkerNumberLimit::get();

      let (lead_id, _) = insert_a_worker::<T, I>(StakingRole::WithStakes, JobOpeningType::Leader, 0, None);

      let (opening_id, successful_application_ids, _) = add_opening_and_n_apply::<T, I>(
        &(1..i).collect(),
        &T::Origin::from(RawOrigin::Signed(lead_id.clone())),
        &StakingRole::WithStakes,
        &JobOpeningType::Regular
      );

      WorkingTeam::<T, I>::fill_opening(RawOrigin::Signed(lead_id.clone()).into(), opening_id,
      successful_application_ids).unwrap();

      force_missed_reward::<T, I>();

      // Sets periods so that we can reward
      let curr_block_number =
          System::<T>::block_number().saturating_add(T::RewardPeriod::get().into());
      System::<T>::set_block_number(curr_block_number);

      // Sets budget so that we can't pay it
      WorkingTeam::<T, I>::set_budget(RawOrigin::Root.into(), Zero::zero()).unwrap();

    }: { WorkingTeam::<T, I>::on_initialize(curr_block_number) }
    verify { }

    on_initialize_rewarding_without_missing_reward {
      let i in 1 .. T::MaxWorkerNumberLimit::get();

      let (lead_id, _) = insert_a_worker::<T, I>(StakingRole::WithStakes, JobOpeningType::Leader, 0, None);

      let (opening_id, successful_application_ids, _) = add_opening_and_n_apply::<T, I>(
        &(1..i).collect(),
        &T::Origin::from(RawOrigin::Signed(lead_id.clone())),
        &StakingRole::WithStakes,
        &JobOpeningType::Regular
      );

      WorkingTeam::<T, I>::fill_opening(RawOrigin::Signed(lead_id.clone()).into(), opening_id,
      successful_application_ids).unwrap();

      // Sets periods so that we can reward
      let curr_block_number =
          System::<T>::block_number().saturating_add(T::RewardPeriod::get().into());
      System::<T>::set_block_number(curr_block_number);

      // Sets budget so that we can pay it
      WorkingTeam::<T, I>::set_budget(RawOrigin::Root.into(), BalanceOfCurrency::<T>::max_value()).unwrap();

    }: { WorkingTeam::<T, I>::on_initialize(curr_block_number) }
    verify { }

    apply_on_opening {
      let i in 1 .. 50000;

      let (lead_account_id, lead_member_id) = member_funded_account::<T>("lead", 0);
      let opening_id = add_opening_helper::<T, I>(0, &T::Origin::from(RawOrigin::Root), &StakingRole::WithStakes, &JobOpeningType::Leader);

      let apply_on_opening_params = ApplyOnOpeningParameters::<T, I> {
        member_id: lead_member_id,
        opening_id: opening_id,
        role_account_id: lead_account_id.clone(),
        reward_account_id: lead_account_id.clone(),
        description: vec![0u8].repeat(i as usize),
        stake_parameters: Some(
          // Make sure to keep consistency with the StakePolicy in add_opening_helper (we are safe as long as we are
          // using max_value for stake)
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

      let (lead_account_id, lead_member_id) = member_funded_account::<T>("lead", 0);
      let (opening_id, application_id) = add_and_apply_opening::<T, I>(0, &RawOrigin::Root.into(), &StakingRole::WithoutStakes, &lead_account_id,
        &lead_member_id, &JobOpeningType::Leader);

      let mut successful_application_ids: BTreeSet<T::ApplicationId> = BTreeSet::new();
      successful_application_ids.insert(application_id);
    }: fill_opening(RawOrigin::Root, opening_id, successful_application_ids)
    verify {}

    fill_opening_worker { // We can actually fill an opening with 0 applications?
      let i in 1 .. T::MaxWorkerNumberLimit::get();
      let (lead_id, lead_worker_id) = insert_a_worker::<T, I>(StakingRole::WithoutStakes, JobOpeningType::Leader, 0, None);

      let (opening_id, successful_application_ids, _) = add_opening_and_n_apply::<T, I>(
        &(1..i).collect(),
        &T::Origin::from(RawOrigin::Signed(lead_id.clone())),
        &StakingRole::WithoutStakes,
        &JobOpeningType::Regular
      );
    }: fill_opening(RawOrigin::Signed(lead_id.clone()), opening_id, successful_application_ids)
    verify {}

    update_role_account{
      let i in 1 .. 10;
      let (lead_id, lead_worker_id) = insert_a_worker::<T, I>(StakingRole::WithoutStakes, JobOpeningType::Leader, 0, None);
      let new_account_id = account::<T::AccountId>("new_lead_account", 1, SEED);
    }: _ (RawOrigin::Signed(lead_id), lead_worker_id, new_account_id)
    verify {}

    cancel_opening {
      let i in 1 .. 10;

      let (lead_id, _) = insert_a_worker::<T, I>(StakingRole::WithoutStakes, JobOpeningType::Leader, 0, None);
      let opening_id = add_opening_helper::<T, I>(
        1,
        &T::Origin::from(RawOrigin::Signed(lead_id.clone())),
        &StakingRole::WithoutStakes,
        &JobOpeningType::Regular
      );

    }: _ (RawOrigin::Signed(lead_id.clone()), One::one())
    verify {}

    withdraw_application {
      let i in 1 .. 10;

      let (caller_id, member_id) = member_funded_account::<T>("lead", 0);
      let (_, application_id) = add_and_apply_opening::<T, I>(0,
        &RawOrigin::Root.into(),
        &StakingRole::WithStakes,
        &caller_id,
        &member_id,
        &JobOpeningType::Leader
        );

    }: _ (RawOrigin::Signed(caller_id.clone()), application_id)
    verify {}

    // Regular worker is the worst case scenario since the checks
    // require access to the storage whilist that's not the case with a lead opening
    slash_stake {
      let i in 0 .. 10;

      let (lead_id, lead_worker_id) = insert_a_worker::<T, I>(StakingRole::WithoutStakes, JobOpeningType::Leader, 0, None);
      let (caller_id, worker_id) = insert_a_worker::<T, I>(StakingRole::WithStakes, JobOpeningType::Regular, 1, Some(lead_id.clone()));
      let penalty = Penalty {
        slashing_text: vec![],
        slashing_amount: One::one(),
      };
    }: _(RawOrigin::Signed(lead_id.clone()), worker_id, penalty)
    verify {}

    terminate_role_worker {
      let i in 0 .. 10;

      let (lead_id, _) = insert_a_worker::<T, I>(StakingRole::WithoutStakes, JobOpeningType::Leader, 0, None);
      let (caller_id, worker_id) = insert_a_worker::<T, I>(StakingRole::WithStakes, JobOpeningType::Regular, 1, Some(lead_id.clone()));
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

      let (_, lead_worker_id) = insert_a_worker::<T, I>(StakingRole::WithStakes, JobOpeningType::Leader, 0, None);
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

      let (lead_id, _) = insert_a_worker::<T, I>(StakingRole::WithoutStakes, JobOpeningType::Leader, 0, None);
      let (caller_id, worker_id) = insert_a_worker::<T, I>(StakingRole::WithStakes, JobOpeningType::Regular, 1, Some(lead_id.clone()));

      let old_stake = One::one();
      WorkingTeam::<T, I>::decrease_stake(RawOrigin::Signed(lead_id.clone()).into(), worker_id.clone(), old_stake).unwrap();
      let new_stake = BalanceOfCurrency::<T>::max_value();
    }: _ (RawOrigin::Signed(caller_id.clone()), worker_id.clone(), new_stake)
    verify {}

    // Regular worker is the worst case scenario since the checks
    // require access to the storage whilist that's not the case with a lead opening
    decrease_stake {
      let i in 0 .. 10;

      let (lead_id, _) = insert_a_worker::<T, I>(StakingRole::WithoutStakes, JobOpeningType::Leader, 0, None);
      let (_, worker_id) = insert_a_worker::<T, I>(StakingRole::WithStakes, JobOpeningType::Regular, 1, Some(lead_id.clone()));

      // I'm assuming that we will usually have MaxBalance > 1
      let new_stake = One::one();
    }: _ (RawOrigin::Signed(lead_id), worker_id, new_stake)
    verify {}

    spend_from_budget {
      let i in 0 .. 10;

      let (lead_id, _) = insert_a_worker::<T, I>(StakingRole::WithoutStakes, JobOpeningType::Leader, 0, None);

      let current_budget = BalanceOfCurrency::<T>::max_value();
      WorkingTeam::<T, I>::set_budget(RawOrigin::Root.into(), current_budget).unwrap();
    }: _ (RawOrigin::Signed(lead_id.clone()), lead_id.clone(), current_budget, None)
    verify {}

    // Regular worker is the worst case scenario since the checks
    // require access to the storage whilist that's not the case with a lead opening
    update_reward_amount {
      let i in 0 .. 10;

      let (lead_id, _) = insert_a_worker::<T, I>(StakingRole::WithoutStakes, JobOpeningType::Leader, 0, None);
      let (_, worker_id) = insert_a_worker::<T, I>(StakingRole::WithoutStakes, JobOpeningType::Regular, 1, Some(lead_id.clone()));
      let new_reward = Some(BalanceOfCurrency::<T>::max_value());
    }: _ (RawOrigin::Signed(lead_id.clone()), worker_id, new_reward)
    verify {}

    set_status_text {
      let i in 0 .. 50000; // TODO: We should have a bounded value for description

      let (lead_id, _) = insert_a_worker::<T, I>(StakingRole::WithoutStakes, JobOpeningType::Leader, 0, None);
      let status_text = Some(vec![0u8].repeat(i.try_into().unwrap()));

    }: _ (RawOrigin::Signed(lead_id), status_text)
    verify {}

    update_reward_account {
      let i in 0 .. 10;

      let (caller_id, worker_id) = insert_a_worker::<T, I>(StakingRole::WithoutStakes, JobOpeningType::Leader, 0, None);
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

      let (lead_id, _) = insert_a_worker::<T, I>(StakingRole::WithoutStakes, JobOpeningType::Leader, 0, None);


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
        let (caller_id, lead_worker_id) = insert_a_worker::<T, I>(StakingRole::WithoutStakes, JobOpeningType::Leader, 0, None);

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
        let (caller_id, caller_worker_id) = insert_a_worker::<T, I>(StakingRole::WithoutStakes, JobOpeningType::Leader, 0, None);
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
