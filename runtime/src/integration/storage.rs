use crate::{ActorId, Runtime};

//TODO : SWG - implement
pub struct StorageProviderHelper;

impl storage::data_directory::StorageProviderHelper<Runtime> for StorageProviderHelper {
    fn get_random_storage_provider() -> Result<ActorId, &'static str> {
        unimplemented!()
    }
}
