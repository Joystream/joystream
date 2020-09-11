use crate::{Instance, JobOpening, JobOpeningType, MemberId, TeamWorker, TeamWorkerId, Trait};

use super::Error;
use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::{ensure, StorageMap, StorageValue};
use sp_std::collections::btree_set::BTreeSet;
use system::{ensure_root, ensure_signed};

use crate::types::ApplicationInfo;

// Check opening: verifies origin and opening type compatibility.
pub(crate) fn ensure_origin_for_opening_type<T: Trait<I>, I: Instance>(
    origin: T::Origin,
    opening_type: JobOpeningType,
) -> DispatchResult {
    match opening_type {
        JobOpeningType::Regular => {
            // Ensure lead is set and is origin signer.
            ensure_origin_is_active_leader::<T, I>(origin)
        }
        JobOpeningType::Leader => {
            // Council proposal.
            ensure_root(origin).map_err(|err| err.into())
        }
    }
}

// Check opening: returns the opening by id if it is exists.
pub(crate) fn ensure_opening_exists<T: Trait<I>, I: Instance>(
    opening_id: &T::OpeningId,
) -> Result<JobOpening<T::BlockNumber>, Error<T, I>> {
    ensure!(
        <crate::OpeningById::<T, I>>::contains_key(opening_id),
        Error::<T, I>::OpeningDoesNotExist
    );

    let opening = <crate::OpeningById<T, I>>::get(opening_id);

    Ok(opening)
}

// Check application: returns applicationId and application tuple if exists.
pub(crate) fn ensure_application_exists<T: Trait<I>, I: Instance>(
    application_id: &T::ApplicationId,
) -> Result<ApplicationInfo<T, I>, Error<T, I>> {
    ensure!(
        <crate::ApplicationById::<T, I>>::contains_key(application_id),
        Error::<T, I>::WorkerApplicationDoesNotExist
    );

    let application = <crate::ApplicationById<T, I>>::get(application_id);

    Ok((*application_id, application))
}

// Check application: returns applicationId and application tuple if exists.
pub(crate) fn ensure_succesful_applications_exist<T: Trait<I>, I: Instance>(
    successful_application_ids: &BTreeSet<T::ApplicationId>,
) -> Result<Vec<ApplicationInfo<T, I>>, Error<T, I>> {
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

// Check leader: ensures that team leader was hired.
pub(crate) fn ensure_lead_is_set<T: Trait<I>, I: Instance>() -> Result<TeamWorkerId<T>, Error<T, I>>
{
    let leader_worker_id = <crate::CurrentLead<T, I>>::get();

    if let Some(leader_worker_id) = leader_worker_id {
        Ok(leader_worker_id)
    } else {
        Err(Error::<T, I>::CurrentLeadNotSet)
    }
}

// Check leader: verifies that provided lead account id belongs to the current working group leader.
fn ensure_is_lead_account<T: Trait<I>, I: Instance>(
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
fn ensure_origin_is_active_leader<T: Trait<I>, I: Instance>(origin: T::Origin) -> DispatchResult {
    // Ensure is signed
    let signer = ensure_signed(origin)?;

    ensure_is_lead_account::<T, I>(signer)
}

// Check worker: ensures the worker was already created.
pub(crate) fn ensure_worker_exists<T: Trait<I>, I: Instance>(
    worker_id: &TeamWorkerId<T>,
) -> Result<TeamWorker<T>, Error<T, I>> {
    ensure!(
        <crate::WorkerById::<T, I>>::contains_key(worker_id),
        Error::<T, I>::WorkerDoesNotExist
    );

    let worker = <crate::WorkerById<T, I>>::get(worker_id);

    Ok(worker)
}

// Check worker: verifies that origin is signed and corresponds with the membership.
pub(crate) fn ensure_origin_signed_by_member<T: Trait<I>, I: Instance>(
    origin: T::Origin,
    member_id: &MemberId<T>,
) -> Result<(), Error<T, I>> {
    membership::Module::<T>::ensure_member_controller_account_signed(origin, member_id)
        .map_err(|_| Error::<T, I>::InvalidMemberOrigin)?;

    Ok(())
}

// Check worker: ensures the origin contains signed account that belongs to existing worker.
pub(crate) fn ensure_worker_signed<T: Trait<I>, I: Instance>(
    origin: T::Origin,
    worker_id: &TeamWorkerId<T>,
) -> Result<TeamWorker<T>, DispatchError> {
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
