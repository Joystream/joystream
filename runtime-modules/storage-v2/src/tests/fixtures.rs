use frame_support::dispatch::DispatchResult;
use frame_support::storage::StorageMap;
use frame_support::traits::{Currency, OnFinalize, OnInitialize};
use frame_system::{EventRecord, Phase, RawOrigin};

use super::mock::{Balances, Storage, System, Test, TestEvent};

use crate::{RawEvent, StorageBucket, Voucher};

// Recommendation from Parity on testing on_finalize
// https://substrate.dev/docs/en/next/development/module/tests
pub fn run_to_block(n: u64) {
    while System::block_number() < n {
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        <Storage as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
        <Storage as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}

pub fn increase_account_balance(account_id: &u64, balance: u64) {
    let _ = Balances::deposit_creating(&account_id, balance);
}

pub struct EventFixture;
impl EventFixture {
    pub fn assert_last_crate_event(expected_raw_event: RawEvent<u64, u64>) {
        let converted_event = TestEvent::storage(expected_raw_event);

        Self::assert_last_global_event(converted_event)
    }

    pub fn contains_crate_event(expected_raw_event: RawEvent<u64, u64>) {
        let converted_event = TestEvent::storage(expected_raw_event);

        Self::contains_global_event(converted_event)
    }

    pub fn assert_last_global_event(expected_event: TestEvent) {
        let expected_event = EventRecord {
            phase: Phase::Initialization,
            event: expected_event,
            topics: vec![],
        };

        assert_eq!(System::events().pop().unwrap(), expected_event);
    }

    fn contains_global_event(expected_event: TestEvent) {
        let expected_event = EventRecord {
            phase: Phase::Initialization,
            event: expected_event,
            topics: vec![],
        };

        assert!(System::events().iter().any(|ev| *ev == expected_event));
    }
}

const DEFAULT_ACCOUNT_ID: u64 = 1;

pub struct CreateStorageBucketFixture {
    origin: RawOrigin<u64>,
    invite_worker: Option<u64>,
    accepting_new_data_objects: bool,
    voucher: Voucher,
}

impl CreateStorageBucketFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_ACCOUNT_ID),
            invite_worker: None,
            accepting_new_data_objects: false,
            voucher: Default::default(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_invite_worker(self, invite_worker: Option<u64>) -> Self {
        Self {
            invite_worker,
            ..self
        }
    }

    pub fn with_accepting_new_data_objects(self, accepting_new_data_objects: bool) -> Self {
        Self {
            accepting_new_data_objects,
            ..self
        }
    }

    pub fn with_voucher(self, voucher: Voucher) -> Self {
        Self { voucher, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) -> Option<u64> {
        let next_storage_bucket_id = Storage::next_storage_bucket_id();
        let actual_result = Storage::create_storage_bucket(
            self.origin.clone().into(),
            self.invite_worker,
            self.accepting_new_data_objects,
            self.voucher.clone(),
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                next_storage_bucket_id + 1,
                Storage::next_storage_bucket_id()
            );
            assert!(<crate::StorageBucketById<Test>>::contains_key(
                next_storage_bucket_id
            ));

            Some(next_storage_bucket_id)
        } else {
            assert_eq!(next_storage_bucket_id, Storage::next_storage_bucket_id());
            assert!(!<crate::StorageBucketById<Test>>::contains_key(
                next_storage_bucket_id
            ));

            None
        }
    }
}
