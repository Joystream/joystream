#![warn(missing_docs)]

use sp_std::cell::RefCell;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::marker::PhantomData;

pub(crate) use super::{RandomBucketIdIterator, SequentialBucketIdIterator};
use crate::{DynamicBagType, Module, Trait};

// Generates storage bucket IDs to assign to a new dynamic bag.
pub(crate) struct StorageBucketPicker<T> {
    trait_marker: PhantomData<T>,
}

impl<T: Trait> StorageBucketPicker<T> {
    // Selects storage bucket ID sets to assign to the dynamic bag.
    // At first, it tries to generate random bucket IDs. If acquired random IDs number is not enough
    // it tries to get additional IDs starting from zero up to the total number of the possible IDs.
    // The function filters deleted buckets and disabled buckets (accepting_new_bags == false)
    // Total number of possible IDs is limited by the dynamic bag settings.
    // Returns an accumulated bucket ID set or an empty set.
    pub(crate) fn pick_storage_buckets(bag_type: DynamicBagType) -> BTreeSet<T::StorageBucketId> {
        let creation_policy = Module::<T>::get_dynamic_bag_creation_policy(bag_type);

        if creation_policy.no_storage_buckets_required() {
            return BTreeSet::new();
        }

        let required_bucket_num = creation_policy.number_of_storage_buckets as usize;

        // TODO: the selection algorithm will change: https://github.com/Joystream/joystream/issues/2904
        // Storage bucket IDs accumulator.
        let bucket_ids_cell = RefCell::new(BTreeSet::new());
        let next_storage_bucket_id = Module::<T>::next_storage_bucket_id();
        RandomBucketIdIterator::<T, T::StorageBucketId>::new(next_storage_bucket_id)
            .chain(SequentialBucketIdIterator::<T, T::StorageBucketId>::new(
                next_storage_bucket_id,
            ))
            .filter(|id| Self::check_storage_bucket_is_valid_for_bag_assigning(id))
            .filter(|bucket_id| {
                let bucket_ids = bucket_ids_cell.borrow();

                // Skips the iteration on existing ID.
                !bucket_ids.contains(bucket_id)
            })
            .take(required_bucket_num)
            .for_each(|bucket_id| {
                let mut bucket_ids = bucket_ids_cell.borrow_mut();

                bucket_ids.insert(bucket_id);
            });

        bucket_ids_cell.into_inner()
    }

    // Verifies storage bucket ID (non-deleted and accepting new bags).
    pub(crate) fn check_storage_bucket_is_valid_for_bag_assigning(
        bucket_id: &T::StorageBucketId,
    ) -> bool {
        // Check bucket for existence (return false if not). Check `accepting_new_bags`.
        let bucket = Module::<T>::ensure_storage_bucket_exists(bucket_id).ok();

        // check that bucket is accepting new bags
        bucket
            .as_ref()
            .map_or(false, |bucket| bucket.accepting_new_bags)
    }
}
