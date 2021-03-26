use frame_support::traits::Randomness;
use sp_std::vec::Vec;

use crate::{ActorId, Runtime};

/// Provides random storage provider id. We use it when assign the content to the storage provider.
pub struct StorageProviderHelper;

impl storage::data_directory::StorageProviderHelper<Runtime> for StorageProviderHelper {
    fn get_random_storage_provider() -> Result<ActorId, storage::data_directory::Error<Runtime>> {
        let ids = crate::StorageWorkingGroup::get_all_worker_ids();

        // Filter workers that have set value for their storage value
        let ids: Vec<ActorId> = ids
            .into_iter()
            .filter(|id| !crate::StorageWorkingGroup::worker_storage(id).is_empty())
            .collect();

        if ids.is_empty() {
            Err(storage::data_directory::Error::<Runtime>::NoProviderAvailable)
        } else {
            let index = Self::random_index(ids.len());
            Ok(ids[index])
        }
    }
}

impl StorageProviderHelper {
    fn random_index(upper_bound: usize) -> usize {
        let seed = crate::RandomnessCollectiveFlip::random_seed();
        let mut rand: u64 = 0;
        for offset in 0..8 {
            rand += (seed.as_ref()[offset] as u64) << offset;
        }
        (rand as usize) % upper_bound
    }
}
