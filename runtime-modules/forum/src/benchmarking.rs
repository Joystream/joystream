#![cfg(feature = "runtime-benchmarks")]
use super::*;
use frame_benchmarking::benchmarks;
use frame_support::assert_ok;
use frame_system::RawOrigin;

const MAX_BYTES: u32 = 16384;

benchmarks! {
    _{ }

    create_category{
        let i in 1 .. (T::MaxCategoryDepth::get() - 1) as u32;

        let j in 0 .. MAX_BYTES;

        let text = vec![0u8].repeat(j as usize);

        let mut category_id: Option<T::CategoryId> = None;
        let mut parent_category_id = None;

        for n in 1..=i {
            if n > 1 {
                category_id = Some(((n - 1) as u64).into());
                parent_category_id = Some((n as u64).into());
            }

            assert_ok!(Module::<T>::create_category(
                RawOrigin::Signed(T::AccountId::default()).into(), category_id, text.clone(), text.clone()
            ));
        }

        let parent_category = if let Some(parent_category_id) = parent_category_id {
            Some(Module::<T>::category_by_id(parent_category_id))
        } else {
            None
        };

    }: _ (RawOrigin::Signed(T::AccountId::default()), parent_category_id, text.clone(), text.clone())
    verify {

            let new_category = Category {
                title_hash: T::calculate_hash(text.as_slice()),
                description_hash: T::calculate_hash(text.as_slice()),
                archived: false,
                num_direct_subcategories: 0,
                num_direct_threads: 0,
                num_direct_moderators: 0,
                parent_category_id,
                sticky_thread_ids: vec![],
            };

            let category_id = Module::<T>::next_category_id() - T::CategoryId::one();
            assert_eq!(Module::<T>::category_by_id(category_id), new_category);

            if let (Some(parent_category), Some(parent_category_id)) = (parent_category, parent_category_id) {
                assert_eq!(
                    Module::<T>::category_by_id(parent_category_id).num_direct_subcategories,
                    parent_category.num_direct_subcategories + 1
                );
            }

    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::mock::*;

    #[test]
    fn test_create_category() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_create_category::<Runtime>());
        });
    }
}
