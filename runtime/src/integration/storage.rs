use frame_support::traits::Randomness;
use sp_std::vec::Vec;

use crate::{ActorId, Runtime};

/// Provides random storage provider id. We use it when assign the content to the storage provider.
pub struct StorageProviderHelper;

impl storage::data_directory::StorageProviderHelper<Runtime> for StorageProviderHelper {
    fn get_random_storage_provider() -> Result<ActorId, &'static str> {
        let ids = crate::StorageWorkingGroup::get_regular_worker_ids();

        let live_ids: Vec<ActorId> = ids
            .into_iter()
            .filter(|id| !<service_discovery::Module<Runtime>>::is_account_info_expired(id))
            .collect();

        if live_ids.is_empty() {
            Err("No valid storage provider found.")
        } else {
            let index = Self::random_index(live_ids.len());
            Ok(live_ids[index])
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
