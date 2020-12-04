#![cfg(feature = "runtime-benchmarks")]

use crate::{Call, ConstitutionInfo, Event, Module, Trait};
use frame_benchmarking::benchmarks;
use frame_system::Module as System;
use frame_system::{EventRecord, RawOrigin};
use sp_runtime::traits::Hash;
use sp_std::boxed::Box;
use sp_std::vec;
use sp_std::vec::Vec;

fn assert_last_event<T: Trait>(generic_event: <T as Trait>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Trait>::Event = generic_event.into();
    // compare to the last event record
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

benchmarks! {
    _{ }

    amend_constitution{
        let i in 1 .. 50000;
        let text = vec![0u8].repeat(i as usize);

    }: _ (RawOrigin::Root, text.clone())
    verify {
            let hashed = T::Hashing::hash(&text);
            let hash = hashed.as_ref().to_vec();

            let constitution_info = ConstitutionInfo{
                text_hash: hash.clone(),
            };

            assert_eq!(Module::<T>::constitution(), constitution_info);
            assert_last_event::<T>(Event::ConstutionAmended(hash).into());
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tests::mocks::{build_test_externalities, Test};
    use frame_support::assert_ok;

    #[test]
    fn amend_constitution() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_amend_constitution::<Test>());
        });
    }
}
