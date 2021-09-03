#![cfg(test)]

pub(crate) mod mocks;

use crate::{ConstitutionInfo, Event};
use frame_support::dispatch::DispatchResult;
use frame_support::traits::{OnFinalize, OnInitialize};
use frame_system::{EventRecord, Phase, RawOrigin};
use mocks::{build_test_externalities, Constitution, System, Test};
use sp_runtime::traits::Hash;
use sp_runtime::DispatchError;

// Recommendation from Parity on testing on_finalize
// https://substrate.dev/docs/en/next/development/module/tests
fn run_to_block(n: u64) {
    while System::block_number() < n {
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        <Constitution as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
        <Constitution as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}

pub struct EventFixture;
impl EventFixture {
    pub fn assert_last_crate_event(expected_raw_event: Event) {
        let converted_event = mocks::Event::constitution(expected_raw_event);

        Self::assert_last_global_event(converted_event)
    }

    pub fn assert_last_global_event(expected_event: mocks::Event) {
        let expected_event = EventRecord {
            phase: Phase::Initialization,
            event: expected_event,
            topics: vec![],
        };

        assert_eq!(System::events().pop().unwrap(), expected_event);
    }
}

pub struct AmendConstitutionFixture {
    origin: RawOrigin<u64>,
    text: Vec<u8>,
}

impl AmendConstitutionFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Root,
            text: Vec::new(),
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_text(self, text: Vec<u8>) -> Self {
        Self { text, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_constitution = Constitution::constitution();

        let actual_result =
            Constitution::amend_constitution(self.origin.clone().into(), self.text.clone());

        assert_eq!(actual_result, expected_result);

        let new_constitution = Constitution::constitution();
        if actual_result.is_ok() {
            let hashed = <Test as frame_system::Config>::Hashing::hash(&self.text);
            let hash = hashed.as_ref().to_vec();

            assert_eq!(new_constitution, ConstitutionInfo { text_hash: hash });
        } else {
            assert_eq!(old_constitution, new_constitution);
        }
    }
}

#[test]
fn amend_contitution_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let text = b"Constitution text".to_vec();

        let hashed = <Test as frame_system::Config>::Hashing::hash(&text);
        let hash = hashed.as_ref().to_vec();

        let amend_constitution_fixture =
            AmendConstitutionFixture::default().with_text(text.clone());
        amend_constitution_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(Event::ConstutionAmended(hash, text));
    });
}

#[test]
fn amend_contitution_fais_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let amend_constitution_fixture =
            AmendConstitutionFixture::default().with_origin(RawOrigin::None);
        amend_constitution_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}
