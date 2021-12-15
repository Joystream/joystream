#![warn(missing_docs)]

use sp_std::cell::RefCell;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::marker::PhantomData;
use sp_std::vec::Vec;

use crate::{DistributionBucketId, DynamicBagType, Module, Trait};

pub(crate) use super::{RandomBucketIdIterator, SequentialBucketIdIterator};

// Generates distribution bucket IDs to assign to a new dynamic bag.
pub(crate) struct DistributionBucketPicker<T> {
    trait_marker: PhantomData<T>,
}

impl<T: Trait> DistributionBucketPicker<T> {
    // Get random distribution buckets from distribution bucket families using the dynamic bag
    // creation policy.
    pub(crate) fn pick_distribution_buckets(
        bag_type: DynamicBagType,
    ) -> BTreeSet<DistributionBucketId<T>> {
        let creation_policy = Module::<T>::get_dynamic_bag_creation_policy(bag_type);

        if creation_policy.no_distribution_buckets_required() {
            return BTreeSet::new();
        }

        // Distribution bucket IDs accumulator.
        let bucket_ids_cell = RefCell::new(BTreeSet::<T::DistributionBucketIndex>::new());

        creation_policy
            .families
            .iter()
            .filter_map(|(family_id, bucket_num)| {
                Module::<T>::ensure_distribution_bucket_family_exists(family_id)
                    .ok()
                    .map(|fam| (family_id, fam, bucket_num))
            })
            .map(|(family_id, family, bucket_num)| {
                RandomBucketIdIterator::<T, T::DistributionBucketIndex>::new(
                    family.next_distribution_bucket_index,
                )
                .chain(
                    SequentialBucketIdIterator::<T, T::DistributionBucketIndex>::new(
                        family.next_distribution_bucket_index,
                    ),
                )
                .filter(|bucket_idx| {
                    let bucket_id = DistributionBucketId::<T> {
                        distribution_bucket_family_id: *family_id,
                        distribution_bucket_index: *bucket_idx,
                    };

                    Module::<T>::ensure_distribution_bucket_exists(&bucket_id)
                        .ok()
                        .map(|bucket| bucket.accepting_new_bags)
                        .unwrap_or(false)
                })
                .filter(|bucket_idx| {
                    let bucket_ids = bucket_ids_cell.borrow();

                    // Skips the iteration on existing ID.
                    !bucket_ids.contains(bucket_idx)
                })
                .map(|bucket_idx| DistributionBucketId::<T> {
                    distribution_bucket_family_id: *family_id,
                    distribution_bucket_index: bucket_idx,
                })
                .take(*bucket_num as usize)
                .collect::<Vec<_>>()

                // rename buckets
            })
            .flatten()
            .collect::<BTreeSet<_>>()
    }
}
