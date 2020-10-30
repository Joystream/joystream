#![cfg(feature = "runtime-benchmarks")]
use super::*;
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
    can_leave_immediatly: bool,
    applicant_id: T::AccountId,
    member_id: T::MemberId,
    last_opening_id: Option<T::OpeningId>,
    last_application_id: Option<T::ApplicationId>,
    is_lead: bool,
    lead_id: Option<T::AccountId>,
) -> (T::OpeningId, T::ApplicationId) {
    let opening_type = if is_lead {
        JobOpeningType::Leader
    } else {
        JobOpeningType::Regular
    };
    // We assume lead id is zero
    let add_opening_origin = if is_lead {
        RawOrigin::Root
    } else {
        RawOrigin::Signed(lead_id.unwrap())
    };

    // If job usntaking period is zero the worker can always
    // leave immediatly. However we also need a current_stake to not
    // leave immediatly(Appart from the unstaking_period).
    // This is handled by `T::StakingHandler::current_stake
    let (staking_policy, stake_parameters) = if can_leave_immediatly {
        (None, None)
    } else {
        (
            Some(StakePolicy {
                stake_amount: <BalanceOfCurrency<T> as One>::one(),
                leaving_unstaking_period: T::BlockNumber::max_value(),
            }),
            Some(StakeParameters {
                stake: BalanceOfCurrency::<T>::max_value(),
                staking_account_id: applicant_id.clone(),
            }),
        )
    };

    WorkingTeam::<T, I>::add_opening(
        add_opening_origin.clone().into(),
        vec![],
        opening_type,
        staking_policy,
        Some(RewardPolicy {
            reward_per_block: <BalanceOfCurrency<T> as One>::one(),
        }),
    )
    .unwrap();

    let opening_id = if let Some(prev_opening_id) = last_opening_id {
        prev_opening_id.saturating_add(<T::OpeningId as One>::one())
    } else {
        Zero::zero()
    };

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

    let application_id = if let Some(prev_application_id) = last_application_id {
        prev_application_id.saturating_add(<T::ApplicationId as One>::one())
    } else {
        Zero::zero()
    };

    (opening_id, application_id)
}

// Method to generate a distintic valid handle
// for a membership. For each index.
// TODO: This will only work as long as min_handle_length >= 4
fn handle_from_index<T: membership::Trait>(index: u32) -> Vec<u8> {
    let min_handle_length = Membership::<T>::min_handle_length();
    // If the index is ever different from u32 change this
    let mut handle = vec![
        get_byte(index, 0),
        get_byte(index, 1),
        get_byte(index, 2),
        get_byte(index, 3),
    ];

    while handle.len() < (min_handle_length as usize) {
        handle.push(0u8);
    }

    handle
}

fn member_funded_account<T: membership::Trait>(
    name: &'static str,
    index: u32,
    last_member_id: Option<T::MemberId>,
) -> (T::AccountId, T::MemberId) {
    let account_id = account::<T::AccountId>(name, index, SEED);
    let handle = handle_from_index::<T>(index);

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

    let member_id = if let Some(prev_member_id) = last_member_id {
        prev_member_id.saturating_add(<T::MemberId as One>::one())
    } else {
        Zero::zero()
    };

    (account_id, member_id)
}

fn insert_a_worker<T: Trait<I>, I: Instance>(
    can_leave_immediatly: bool,
    is_lead: bool,
    lead_id: Option<T::AccountId>,
) -> (T::AccountId, TeamWorkerId<T>)
where
    WorkingTeam<T, I>: OnInitialize<T::BlockNumber>,
{
    /*
     * TODO: Refator this!!!!! :(
     */
    let add_worker_origin = if is_lead {
        RawOrigin::Root
    } else {
        RawOrigin::Signed(lead_id.clone().unwrap())
    };
    let id = if is_lead { 0 } else { 1 };
    let worker_id = if is_lead {
        Zero::zero()
    } else {
        <TeamWorkerId<T> as One>::one()
    };

    let (caller_id, member_id) = member_funded_account::<T>(
        "member",
        id,
        if id == 0 { None } else { Some(Zero::zero()) },
    );

    let (opening_id, application_id) = add_and_apply_opening::<T, I>(
        can_leave_immediatly,
        caller_id.clone(),
        member_id.clone(),
        if id == 0 { None } else { Some(Zero::zero()) },
        if id == 0 { None } else { Some(Zero::zero()) },
        is_lead,
        lead_id.clone(),
    );

    let mut successful_application_ids = BTreeSet::<T::ApplicationId>::new();
    successful_application_ids.insert(application_id);
    WorkingTeam::<T, I>::fill_opening(
        add_worker_origin.into(),
        opening_id,
        successful_application_ids,
    )
    .unwrap();

    // Force a missed_reward for the created worker(and any posterior)
    // Every worst case either include or doesn't mind having a non-zero
    // remaining reward
    let curr_block_number =
        System::<T>::block_number().saturating_add(T::RewardPeriod::get().into());
    System::<T>::set_block_number(curr_block_number);
    WorkingTeam::<T, I>::set_budget(RawOrigin::Root.into(), Zero::zero()).unwrap();
    WorkingTeam::<T, I>::on_initialize(curr_block_number);

    (caller_id, worker_id)
}

fn create_lead<T: Trait<I>, I: Instance>(
    can_leave_immediatly: bool,
) -> (T::AccountId, TeamWorkerId<T>)
where
    WorkingTeam<T, I>: OnInitialize<T::BlockNumber>,
{
    let (caller_id, lead_worker_id) = insert_a_worker::<T, I>(can_leave_immediatly, true, None);
    (caller_id, lead_worker_id)
}

benchmarks_instance! {
    _ { }

    fill_opening_lead {
      let i in 0 .. 10;


      WorkingTeam::<T, I>::add_opening(
          RawOrigin::Root.into(),
          vec![],
          JobOpeningType::Leader,
          None,
          None,
      ).unwrap();

      let (lead_account_id, lead_member_id) = member_funded_account::<T>("lead", 0, None);
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
      let (lead_id, lead_worker_id) = create_lead::<T, I>(true);

      WorkingTeam::<T, I>::add_opening(
          RawOrigin::Signed(lead_id.clone()).into(),
          vec![],
          JobOpeningType::Regular,
          None,
          None,
      )
      .unwrap();
      let opening_id = <T::OpeningId as One>::one();
      let mut last_application_id: T::ApplicationId = Zero::zero();
      let mut successful_application_ids = BTreeSet::new();
      let mut last_member_id = Zero::zero();
      for member in 0 .. i {
        let res = member_funded_account::<T>("member", member + 1, Some(last_member_id));
        last_member_id = res.1;
        let applicant_account_id = res.0;

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

        last_application_id = last_application_id.saturating_add(<T::ApplicationId as One>::one());
        successful_application_ids.insert(last_application_id);
      }
    }: fill_opening(RawOrigin::Signed(lead_id.clone()), opening_id, successful_application_ids)
    verify {}

    update_role_account{
      let i in 1 .. 10;
      let (lead_id, lead_worker_id) = create_lead::<T, I>(true);
      let new_account_id = account::<T::AccountId>("new_lead_account", 1, SEED);
    }: _ (RawOrigin::Signed(lead_id), lead_worker_id, new_account_id)
    verify {}

    cancel_opening {
      let i in 1 .. 10;

      let (lead_id, _) = create_lead::<T, I>(true);

      WorkingTeam::<T, I>::add_opening(
          RawOrigin::Signed(lead_id.clone()).into(),
          vec![],
          JobOpeningType::Regular,
          None,
          None,
      )
      .unwrap();
    }: _ (RawOrigin::Signed(lead_id.clone()), <T::OpeningId as One>::one())
    verify {}

    withdraw_application {
    let i in 1 .. 10;

    let (
        caller_id,
        opening_type,
        add_opening_origin,
        member_id,
        handle,
        opening_id,
        application_id,
        worker_id,
    ) =
        (
            account::<T::AccountId>("lead", 0, SEED),
            JobOpeningType::Leader,
            RawOrigin::Root,
            Zero::zero(),
            vec![0u8, 0u8, 0u8, 0u8, 0u8],
            Zero::zero(),
            Zero::zero(),
            <TeamWorkerId<T> as Zero>::zero(),
        );


    // This is handled by `T::StakingHandler::current_stake
    let _ = <T as common::currency::GovernanceCurrency>::Currency::make_free_balance_be(
        &caller_id,
        BalanceOfCurrency::<T>::max_value(),
    );

    let (staking_policy, stake_parameters) =
        (
            Some(StakePolicy {
                stake_amount: <BalanceOfCurrency::<T> as One>::one(),
                leaving_unstaking_period: T::BlockNumber::max_value(),
            }),
            Some(StakeParameters {
                stake: BalanceOfCurrency::<T>::max_value(),
                staking_account_id: caller_id.clone(),
            }),
        );

    membership::Module::<T>::buy_membership(
        RawOrigin::Signed(caller_id.clone()).into(),
        Zero::zero(),
        Some(handle),
        None,
        None,
    )
    .unwrap();

    WorkingTeam::<T, I>::add_opening(
        add_opening_origin.clone().into(),
        vec![],
        opening_type,
        staking_policy,
        Some(RewardPolicy {
            reward_per_block: <BalanceOfCurrency<T> as One>::one(),
        }),
    )
    .unwrap();

    WorkingTeam::<T, I>::apply_on_opening(
        RawOrigin::Signed(caller_id.clone()).into(),
        ApplyOnOpeningParameters::<T, I> {
            member_id,
            opening_id,
            role_account_id: caller_id.clone(),
            reward_account_id: caller_id.clone(),
            description: vec![],
            stake_parameters,
        },
    )
    .unwrap();

    }: _ (RawOrigin::Signed(caller_id.clone()), application_id)
    verify {}

    slash_stake {
      let i in 0 .. 10;

      let (lead_id, _) = create_lead::<T, I>(true);
      let (caller_id, worker_id) = insert_a_worker::<T, I>(false, false, Some(lead_id.clone()));
      let penalty = Penalty {
        slashing_text: vec![],
        slashing_amount: <BalanceOfCurrency<T> as One>::one(),
      };
    }: _(RawOrigin::Signed(lead_id.clone()), worker_id, penalty)
    verify {}

    terminate_role_worker {
      let i in 0 .. 10;

      let (lead_id, _) = create_lead::<T, I>(true);
      let (caller_id, worker_id) = insert_a_worker::<T, I>(false, false, Some(lead_id.clone()));
      // To be able to pay unpaid reward
      let current_budget = BalanceOfCurrency::<T>::max_value();
      WorkingTeam::<T, I>::set_budget(RawOrigin::Root.into(), current_budget).unwrap();
      let penalty = Penalty {
        slashing_text: vec![],
        slashing_amount: <BalanceOfCurrency<T> as One>::one(),
      };
    }: terminate_role(RawOrigin::Signed(lead_id.clone()), worker_id, Some(penalty))
    verify {}

    terminate_role_lead {
      let i in 0 .. 10;

      let (_, lead_worker_id) = create_lead::<T, I>(false);
      let current_budget = BalanceOfCurrency::<T>::max_value();
      // To be able to pay unpaid reward
      WorkingTeam::<T, I>::set_budget(RawOrigin::Root.into(), current_budget).unwrap();
      let penalty = Penalty {
        slashing_text: vec![],
        slashing_amount: <BalanceOfCurrency<T> as One>::one(),
      };
    }: terminate_role(RawOrigin::Root, lead_worker_id, Some(penalty))
    verify {}

    increase_stake {
      let i in 0 .. 10;

      let (lead_id, _) = create_lead::<T, I>(true);
      let (caller_id, worker_id) = insert_a_worker::<T, I>(false, false, Some(lead_id.clone()));

      let old_stake = BalanceOfCurrency::<T>::max_value() - BalanceOfCurrency::<T>::one();
      WorkingTeam::<T, I>::decrease_stake(RawOrigin::Signed(lead_id.clone()).into(), worker_id.clone(), old_stake).unwrap();
      let new_stake = BalanceOfCurrency::<T>::max_value();
    }: _ (RawOrigin::Signed(caller_id.clone()), worker_id.clone(), new_stake)
    verify {}

    decrease_stake {
      let i in 0 .. 10;

      let (lead_id, _) = create_lead::<T, I>(true);
      let (_, worker_id) = insert_a_worker::<T, I>(false, false, Some(lead_id.clone()));

      let new_stake = BalanceOfCurrency::<T>::max_value() - BalanceOfCurrency::<T>::one();
    }: _ (RawOrigin::Signed(lead_id), worker_id, new_stake)
    verify {}

    spend_from_budget {
      let i in 0 .. 10;

      let (lead_id, _) = create_lead::<T, I>(true);
      let current_budget = BalanceOfCurrency::<T>::max_value();
      WorkingTeam::<T, I>::set_budget(RawOrigin::Root.into(), current_budget).unwrap();

    }: _ (RawOrigin::Signed(lead_id.clone()), lead_id.clone(), current_budget, None)
    verify {}

    update_reward_amount {
      let i in 0 .. 10;

      let (lead_id, _) = create_lead::<T, I>(true);
      let (_, worker_id) = insert_a_worker::<T, I>(true, false, Some(lead_id.clone()));
      let new_reward = Some(BalanceOfCurrency::<T>::max_value());
    }: _ (RawOrigin::Signed(lead_id.clone()), worker_id, new_reward)
    verify {}

    set_status_text {
      let i in 0 .. 50000; // TODO: We should have a bounded value for description

      let (lead_id, _) = create_lead::<T,I>(true);
      let status_text = Some(vec![0u8][..].repeat(i as usize)); // TODO:don't use as

    }: _ (RawOrigin::Signed(lead_id), status_text)
    verify {}

    update_reward_account {
      let i in 0 .. 10;

      let (caller_id, worker_id) = create_lead::<T, I>(true);
      let new_id = account::<T::AccountId>("new_id", 1, 0);

    }: _ (RawOrigin::Signed(caller_id), worker_id, new_id)
    verify {}

    set_budget {
      let i in 0 .. 10;

      let new_budget = BalanceOfCurrency::<T>::max_value();

    }: _(RawOrigin::Root, new_budget)
    verify { }

    add_opening{
      let i in 0 .. 50000; // TODO: We should have a bounded value for description

      let caller_id = account::<T::AccountId>("caller", 0, 0);

      let (lead_id, _) = create_lead::<T, I>(true);

      let stake_policy = StakePolicy {
        stake_amount: BalanceOfCurrency::<T>::max_value(),
        leaving_unstaking_period: T::BlockNumber::max_value(),
      };

      let reward_policy = RewardPolicy {
        reward_per_block: BalanceOfCurrency::<T>::max_value(),
      };

      let description = vec![0u8][..].repeat(i as usize); // TODO:don't use as

    }: _(RawOrigin::Signed(lead_id), description, JobOpeningType::Regular, Some(stake_policy), Some(reward_policy))
    verify { }

    // This is always worse than leave_role_immediatly
    leave_role_immediatly {
        let i in 0 .. 10; // TODO: test not running if we don't set a range of values
        // Worst case scenario there is a lead(this requires **always** more steps)
        // could separate into new branch to tighten weight
        let (caller_id, lead_worker_id) = create_lead::<T, I>(true);

        // To be able to pay unpaid reward
        WorkingTeam::<T, I>::set_budget(RawOrigin::Root.into(), BalanceOfCurrency::<T>::max_value()).unwrap();
    }: leave_role(RawOrigin::Signed(caller_id), lead_worker_id)
    verify { }


    // Generally speaking this seems to be always the best case scenario
    // but since it's so obviously a different branch I think it's a good idea
    // to leave this branch and use tha max between these 2
    leave_role_later {
        let i in 0 .. 10;

        let (caller_id, caller_worker_id) = create_lead::<T, I>(true);
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
