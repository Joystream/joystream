#![warn(missing_docs)]

use frame_support::traits::Randomness;
use sp_arithmetic::traits::Zero;
use sp_runtime::SaturatedConversion;
use sp_std::cell::RefCell;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::marker::PhantomData;
use sp_std::rc::Rc;
use sp_std::vec::Vec;

use crate::{DynamicBagType, Module, Trait};

// Generates distribution bucket IDs to assign to a new dynamic bag.
pub(crate) struct DistributionBucketPicker<T> {
    trait_marker: PhantomData<T>,
}

impl<T: Trait> DistributionBucketPicker<T> {
    // Get random distribution buckets from distribution bucket families using the dynamic bag
    // creation policy.
    pub(crate) fn pick_distribution_buckets(
        bag_type: DynamicBagType,
    ) -> BTreeSet<T::DistributionBucketId> {
        let creation_policy = Module::<T>::get_dynamic_bag_creation_policy(bag_type);

        if creation_policy.no_distribution_buckets_required() {
            return BTreeSet::new();
        }

        // Randomness for all bucket family.
        // let random_seed = RefCell::new(Module::<T>::get_initial_random_seed());
        let random_seed = Rc::new(RefCell::new(Module::<T>::get_initial_random_seed()));

        creation_policy
            .families
            .iter()
            .filter_map(|(family_id, bucket_num)| {
                Module::<T>::ensure_distribution_bucket_family_exists(family_id)
                    .ok()
                    .map(|fam| (fam, bucket_num))
            })
            .map(|(family, bucket_num)| {
                let filtered_ids = family
                    .distribution_buckets
                    .iter()
                    .filter_map(|(id, bucket)| bucket.accepting_new_bags.then(|| *id))
                    .collect::<Vec<_>>();

                (filtered_ids, bucket_num)
            })
            .map(|(bucket_ids, bucket_num)| {
                Self::get_random_distribution_buckets(bucket_ids, *bucket_num, random_seed.clone())
            })
            .flatten()
            .collect::<BTreeSet<_>>()
    }

    // Get random bucket IDs from the ID collection.
    pub fn get_random_distribution_buckets(
        ids: Vec<T::DistributionBucketId>,
        bucket_number: u32,
        seed: Rc<RefCell<T::Hash>>, //     seed: RefCell<T::Hash>
    ) -> BTreeSet<T::DistributionBucketId> {
        let mut working_ids = ids;
        let mut result_ids = BTreeSet::default();

        for _ in 0..bucket_number {
            if working_ids.is_empty() {
                break;
            }

            let current_seed = Self::advance_random_seed(seed.clone());

            let upper_bound = working_ids.len() as u64 - 1;
            let index =
                Module::<T>::random_index(current_seed.as_ref(), upper_bound).saturated_into();
            result_ids.insert(working_ids.remove(index));
        }

        result_ids
    }

    // Changes the internal seed value of the container and returns new random seed.
    fn advance_random_seed(seed: Rc<RefCell<T::Hash>>) -> T::Hash {
        // Cannot create randomness in the initial block (Substrate error).
        if <frame_system::Module<T>>::block_number() == Zero::zero() {
            return Module::<T>::get_initial_random_seed();
        }

        let current_seed = *seed.borrow();
        seed.replace(T::Randomness::random(current_seed.as_ref()))
    }
}
