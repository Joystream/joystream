use crate::{Instance, JobOpening, JobOpeningType, Trait};

use super::Error;
use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::{ensure, StorageMap, StorageValue};
use sp_std::collections::btree_set::BTreeSet;
use system::ensure_root;

// Check opening: verifies opening description length.
pub(crate) fn ensure_opening_description_is_valid<T: Trait<I>, I: Instance>(
    text: &[u8],
) -> DispatchResult {
    <crate::OpeningDescriptionTextLimit<I>>::get()
        .ensure_valid(
            text.len(),
            Error::<T, I>::OpeningDescriptionTooShort.into(),
            Error::<T, I>::OpeningDescriptionTooLong.into(),
        )
        .map_err(|e| DispatchError::Other(e))
}

// Check opening: verifies origin and opening type compatibility.
pub(crate) fn ensure_origin_for_opening_type<T: Trait<I>, I: Instance>(
    origin: T::Origin,
    opening_type: JobOpeningType,
) -> DispatchResult {
    match opening_type {
        JobOpeningType::Regular => {
            // Ensure lead is set and is origin signer.
            //Self::ensure_origin_is_active_leader(origin)
            Ok(())
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
) -> Result<JobOpening<T::BlockNumber, T::ApplicationId>, Error<T, I>> {
    ensure!(
        <crate::OpeningById::<T, I>>::contains_key(opening_id),
        Error::<T, I>::OpeningDoesNotExist
    );

    let opening = <crate::OpeningById<T, I>>::get(opening_id);

    Ok(opening)
}

// Check application: verifies application description length.
pub(crate) fn ensure_application_description_is_valid<T: Trait<I>, I: Instance>(
    text: &[u8],
) -> DispatchResult {
    <crate::ApplicationDescriptionTextLimit<I>>::get()
        .ensure_valid(
            text.len(),
            Error::<T, I>::JobApplicationDescriptionTooShort.into(),
            Error::<T, I>::JobApplicationDescriptionTooLong.into(),
        )
        .map_err(|e| DispatchError::Other(e))
}

// Check application: ensures that nobody applies for the same opening twice.
pub(crate) fn ensure_member_has_no_active_application_on_opening<T: Trait<I>, I: Instance>(
    applications: BTreeSet<T::ApplicationId>,
    member_id: T::MemberId,
) -> Result<(), Error<T, I>> {
    for application_id in applications {
        let application = <crate::ApplicationById<T, I>>::get(application_id);
        // Look for application by the member for the opening
        if application.member_id != member_id {
            continue;
        }

        return Err(Error::<T, I>::MemberHasActiveApplicationOnOpening);
    }
    // Member does not have any active applications to the opening
    Ok(())
}
