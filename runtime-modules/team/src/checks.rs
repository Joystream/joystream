use crate::{Instance, JobOpeningType, Trait};

use super::Error;
use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::StorageValue;
use system::ensure_root;

// Opening check: verifies opening description length.
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
