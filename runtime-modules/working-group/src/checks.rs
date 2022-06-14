use crate::{
    ApplicationId, BalanceOf, Instance, Opening, OpeningId, OpeningType, StakePolicy, Trait,
    Worker, WorkerId,
};

use super::Error;
use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::traits::Get;
use frame_support::{ensure, StorageMap, StorageValue};
use frame_system::{ensure_root, ensure_signed};
use sp_arithmetic::traits::Zero;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::marker::PhantomData;
use sp_std::vec::Vec;
use staking_handler::StakingHandler;

use crate::types::{ApplicationInfo, StakeParameters};

// Check opening: verifies origin and opening type compatibility.
pub(crate) fn ensure_origin_for_opening_type<T: Trait<I>, I: Instance>(
    origin: T::Origin,
    opening_type: OpeningType,
) -> DispatchResult {
    match opening_type {
        OpeningType::Regular => {
            // Ensure lead is set and is origin signer.
            ensure_origin_is_active_leader::<T, I>(origin)
        }
        OpeningType::Leader => {
            // Council proposal.
            ensure_root(origin).map_err(|err| err.into())
        }
    }
}

pub(crate) fn ensure_stake_for_opening_type<T: Trait<I>, I: Instance>(
    origin: T::Origin,
    opening_type: OpeningType,
) -> DispatchResult {
    // Lead needs stake to generate opening
    if opening_type == OpeningType::Regular {
        // We check here that the origin is active leader
        // just to make this future proof for any change in
        // `ensure_origin_for_opening_type`
        ensure_origin_is_active_leader::<T, I>(origin)?;
        let lead = crate::Module::<T, I>::worker_by_id(ensure_lead_is_set::<T, I>()?);

        let new_stake = T::LeaderOpeningStake::get()
            + T::StakingHandler::current_stake(&lead.staking_account_id);

        ensure!(
            T::StakingHandler::is_enough_balance_for_stake(&lead.staking_account_id, new_stake),
            Error::<T, I>::InsufficientBalanceToCoverStake
        );
    }

    Ok(())
}

// Check opening: returns the opening by id if it is exists.
pub(crate) fn ensure_opening_exists<T: Trait<I>, I: Instance>(
    opening_id: OpeningId,
) -> Result<Opening<T::BlockNumber, BalanceOf<T>>, Error<T, I>> {
    ensure!(
        <crate::OpeningById::<T, I>>::contains_key(opening_id),
        Error::<T, I>::OpeningDoesNotExist
    );

    let opening = <crate::OpeningById<T, I>>::get(opening_id);

    Ok(opening)
}

// Check application: returns applicationId and application tuple if exists.
pub(crate) fn ensure_application_exists<T: Trait<I>, I: Instance>(
    application_id: &ApplicationId,
) -> Result<ApplicationInfo<T, I>, Error<T, I>> {
    ensure!(
        <crate::ApplicationById::<T, I>>::contains_key(application_id),
        Error::<T, I>::WorkerApplicationDoesNotExist
    );

    let application = <crate::ApplicationById<T, I>>::get(application_id);

    Ok(ApplicationInfo {
        application_id: *application_id,
        application,
        marker: PhantomData,
    })
}

// Check application: returns applicationId and application tuple if exists.
pub(crate) fn ensure_succesful_applications_exist<T: Trait<I>, I: Instance>(
    successful_application_ids: &BTreeSet<ApplicationId>,
) -> Result<Vec<ApplicationInfo<T, I>>, Error<T, I>> {
    // Check for non-empty set of application ids.
    ensure!(
        !successful_application_ids.is_empty(),
        crate::Error::<T, I>::NoApplicationsProvided
    );

    // Make iterator over successful worker application
    let application_info_iterator = successful_application_ids
        .iter()
        // recover worker application from id
        .map(|application_id| ensure_application_exists::<T, I>(application_id))
        // remove Err cases, i.e. non-existing applications
        .filter_map(|result| result.ok());

    // Count number of successful workers provided.
    let num_provided_successful_application_ids = successful_application_ids.len();

    // Ensure all worker applications exist.
    let number_of_successful_applications = application_info_iterator.clone().count();

    ensure!(
        number_of_successful_applications == num_provided_successful_application_ids,
        crate::Error::<T, I>::SuccessfulWorkerApplicationDoesNotExist
    );

    let result_applications_info = application_info_iterator.collect::<Vec<_>>();

    Ok(result_applications_info)
}

// Check leader: ensures that group leader was hired.
pub(crate) fn ensure_lead_is_set<T: Trait<I>, I: Instance>() -> Result<WorkerId<T>, Error<T, I>> {
    let leader_worker_id = <crate::CurrentLead<T, I>>::get();

    if let Some(leader_worker_id) = leader_worker_id {
        Ok(leader_worker_id)
    } else {
        Err(Error::<T, I>::CurrentLeadNotSet)
    }
}

// Check leader: verifies that provided lead account id belongs to the current working group leader.
pub(crate) fn ensure_is_lead_account<T: Trait<I>, I: Instance>(
    lead_account_id: T::AccountId,
) -> DispatchResult {
    let leader_worker_id = ensure_lead_is_set::<T, I>()?;

    let leader = <crate::WorkerById<T, I>>::get(leader_worker_id);

    if leader.role_account_id != lead_account_id {
        return Err(Error::<T, I>::IsNotLeadAccount.into());
    }

    Ok(())
}

// Check leader: ensures origin is signed by the leader.
pub(crate) fn ensure_origin_is_active_leader<T: Trait<I>, I: Instance>(
    origin: T::Origin,
) -> DispatchResult {
    // Ensure is signed
    let signer = ensure_signed(origin)?;

    ensure_is_lead_account::<T, I>(signer)
}

// Check worker: ensures the worker was already created.
pub(crate) fn ensure_worker_exists<T: Trait<I>, I: Instance>(
    worker_id: &WorkerId<T>,
) -> Result<Worker<T>, Error<T, I>> {
    ensure!(
        <crate::WorkerById::<T, I>>::contains_key(worker_id),
        Error::<T, I>::WorkerDoesNotExist
    );

    let worker = <crate::WorkerById<T, I>>::get(worker_id);

    Ok(worker)
}

// Check worker: ensures the origin contains signed account that belongs to existing worker.
pub(crate) fn ensure_worker_signed<T: Trait<I>, I: Instance>(
    origin: T::Origin,
    worker_id: &WorkerId<T>,
) -> Result<Worker<T>, DispatchError> {
    // Ensure that it is signed
    let signer_account = ensure_signed(origin)?;

    // Ensure that id corresponds to active worker
    let worker = ensure_worker_exists::<T, I>(&worker_id)?;

    // Ensure that signer is actually role account of worker
    ensure!(
        signer_account == worker.role_account_id,
        Error::<T, I>::SignerIsNotWorkerRoleAccount
    );

    Ok(worker)
}

// Check worker: verifies proper origin for the worker operation. Returns whether the origin is sudo.
pub(crate) fn ensure_origin_for_worker_operation<T: Trait<I>, I: Instance>(
    origin: T::Origin,
    worker_id: WorkerId<T>,
) -> Result<bool, DispatchError> {
    let leader_worker_id = ensure_lead_is_set::<T, I>()?;

    let (worker_opening_type, is_sudo) = if leader_worker_id == worker_id {
        (OpeningType::Leader, true)
    } else {
        (OpeningType::Regular, false)
    };

    ensure_origin_for_opening_type::<T, I>(origin, worker_opening_type)?;

    Ok(is_sudo)
}

// Check opening: verifies stake policy for the opening.
pub(crate) fn ensure_valid_stake_policy<T: Trait<I>, I: Instance>(
    stake_policy: &StakePolicy<T::BlockNumber, BalanceOf<T>>,
) -> Result<(), DispatchError> {
    ensure!(
        stake_policy.stake_amount >= T::MinimumApplicationStake::get(),
        Error::<T, I>::BelowMinimumStakes
    );

    ensure!(
        stake_policy.leaving_unstaking_period >= T::MinUnstakingPeriodLimit::get(),
        Error::<T, I>::UnstakingPeriodLessThanMinimum
    );

    Ok(())
}

// Check opening: verifies reward per block for the opening.
pub(crate) fn ensure_valid_reward_per_block<T: Trait<I>, I: Instance>(
    reward_per_block: &Option<BalanceOf<T>>,
) -> Result<(), DispatchError> {
    if let Some(reward_per_block) = reward_per_block {
        ensure!(
            *reward_per_block != Zero::zero(),
            Error::<T, I>::CannotRewardWithZero
        )
    }

    Ok(())
}

// Check application: verifies that proposed stake is enough for the opening.
pub(crate) fn ensure_application_stake_match_opening<T: Trait<I>, I: Instance>(
    opening: &Opening<T::BlockNumber, BalanceOf<T>>,
    stake_parameters: &StakeParameters<T::AccountId, BalanceOf<T>>,
) -> DispatchResult {
    ensure!(
        opening.stake_policy.stake_amount <= stake_parameters.stake,
        Error::<T, I>::ApplicationStakeDoesntMatchOpening
    );

    Ok(())
}

// Check worker: verifies that worker has recurring rewards.
pub(crate) fn ensure_worker_has_recurring_reward<T: Trait<I>, I: Instance>(
    worker: &Worker<T>,
) -> DispatchResult {
    worker
        .reward_per_block
        .map_or(Err(Error::<T, I>::WorkerHasNoReward.into()), |_| Ok(()))
}

// Validates storage text.
pub(crate) fn ensure_worker_role_storage_text_is_valid<T: Trait<I>, I: Instance>(
    text: &[u8],
) -> DispatchResult {
    ensure!(
        text.len() as u16 <= <crate::WorkerStorageSize>::get(),
        Error::<T, I>::WorkerStorageValueTooLong
    );
    Ok(())
}
