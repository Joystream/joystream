#![cfg(feature = "runtime-benchmarks")]

use crate::{Call, Config, ConstitutionInfo, Event, Module as Pallet};
use frame_benchmarking::benchmarks;
use frame_system::Pallet as System;
use frame_system::{EventRecord, RawOrigin};
use sp_runtime::traits::Hash;
use sp_std::vec;

fn assert_last_event<T: Config>(generic_event: <T as Config>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Config>::Event = generic_event.into();
    // compare to the last event record
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

const MAX_BYTES: u32 = 50000;

benchmarks! {
    amend_constitution{
        let i in 1 .. MAX_BYTES;
        let text = vec![0u8].repeat(i as usize);

    }: _ (RawOrigin::Root, text.clone())
    verify {
            let hash = T::Hashing::hash(&text);

            let constitution_info = ConstitutionInfo{
                text_hash: hash,
            };

            assert_eq!(Pallet::<T>::constitution(), constitution_info);
            assert_last_event::<T>(Event::<T>::ConstutionAmended(hash, text).into());
    }
}

#[cfg(test)]
mod tests {
    use crate::tests::mocks::{build_test_externalities, Constitution};
    use frame_support::assert_ok;

    #[test]
    fn amend_constitution() {
        build_test_externalities().execute_with(|| {
            assert_ok!(Constitution::test_benchmark_amend_constitution());
        });
    }
}
