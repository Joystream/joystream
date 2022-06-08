#![warn(missing_docs)]

use sp_runtime::SaturatedConversion;
use sp_std::marker::PhantomData;

use proposals_engine::VotersParameters;

/// Handles work with the council.
/// Provides implementations for MemberOriginValidator and VotersParameters.
pub struct CouncilManager<T> {
    marker: PhantomData<T>,
}

impl<T: council::Config> VotersParameters for CouncilManager<T> {
    /// Implement total_voters_count() as council size
    fn total_voters_count() -> u32 {
        council::Module::<T>::council_members()
            .len()
            .saturated_into()
    }
}
