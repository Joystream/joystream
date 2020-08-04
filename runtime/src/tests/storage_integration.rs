use super::initial_test_ext;
use crate::integration::storage::StorageProviderHelper;
use crate::Runtime;

use frame_support::StorageMap;
use working_group::{Instance2, Worker};

#[test]
fn storage_provider_helper_succeeds() {
    initial_test_ext().execute_with(|| {
		// Bug in random module requires move the initial block number.
		<system::Module<Runtime>>::set_block_number(1);

		// Error - no workers.
		let random_provider_result = <StorageProviderHelper
			as storage::data_directory::StorageProviderHelper<Runtime>>::get_random_storage_provider();
		assert!(random_provider_result.is_err());

		let worker_id1 = 1;
		let worker_id2 = 7;
		let worker_id3 = 19;

		<working_group::WorkerById<Runtime, Instance2>>::insert(worker_id1, Worker::default());
		<working_group::WorkerById<Runtime, Instance2>>::insert(worker_id2, Worker::default());
		<working_group::WorkerById<Runtime, Instance2>>::insert(worker_id3, Worker::default());

		// Still error - not registered in the service discovery.
		let random_provider_result = <StorageProviderHelper as storage::data_directory::StorageProviderHelper<Runtime>>::get_random_storage_provider();
		assert!(random_provider_result.is_err());

		let account_info = service_discovery::AccountInfo{
			identity: Vec::new(),
			expires_at: 1000
		};

		<service_discovery::AccountInfoByStorageProviderId<Runtime>>::insert(worker_id1,account_info.clone());
		<service_discovery::AccountInfoByStorageProviderId<Runtime>>::insert(worker_id2,account_info.clone());
		<service_discovery::AccountInfoByStorageProviderId<Runtime>>::insert(worker_id3,account_info);

		// Should work now.
		let worker_ids = vec![worker_id1, worker_id2, worker_id3];
		let random_provider_id = <StorageProviderHelper as storage::data_directory::StorageProviderHelper<Runtime>>::get_random_storage_provider().unwrap();
		assert!(worker_ids.contains(&random_provider_id));
	});
}
