use frame_support::traits::{Get, Randomness};
use sp_arithmetic::traits::{BaseArithmetic, One, Zero};
use sp_runtime::traits::Bounded;
use sp_runtime::SaturatedConversion;
use sp_std::marker::PhantomData;

use crate::{Module, Trait};

pub(crate) mod distribution_bucket_picker;
pub(crate) mod storage_bucket_picker;

pub(crate) use distribution_bucket_picker::DistributionBucketPicker;
pub(crate) use storage_bucket_picker::StorageBucketPicker;

// A meta trait for defining generic bucket ID.
pub(crate) trait BucketId:
    Bounded + BaseArithmetic + From<u64> + Into<u64> + Clone + PartialOrd
{
}
impl<T: Bounded + BaseArithmetic + From<u64> + Into<u64> + Clone + PartialOrd> BucketId for T {}

// Iterator for random storage or distribution bucket IDs. It uses Substrate Randomness trait
// (and possibly randomness_collective_flip pallet for implementation).
// Its maximum iterations number is bounded.
pub(crate) struct RandomBucketIdIterator<T: Trait, Id: BucketId> {
    // Trait marker.
    trait_marker: PhantomData<T>,

    // Current Iterator step number.
    current_iteration: u64,

    // Maximum allowed iteration number.
    max_iteration_number: u64,

    // Current seed for the randomness generator.
    current_seed: T::Hash,

    // Next possible id for the buckets.
    next_id: Id,
}

impl<T: Trait, Id: BucketId> Iterator for RandomBucketIdIterator<T, Id> {
    type Item = Id;

    fn next(&mut self) -> Option<Self::Item> {
        // Cannot create randomness in the initial block (Substrate error).
        if <frame_system::Module<T>>::block_number() == Zero::zero() {
            return None;
        }

        if self.current_iteration >= self.max_iteration_number {
            return None;
        }

        let random_bucket_id = self.random_bucket_id();

        self.current_iteration += 1;
        self.current_seed = T::Randomness::random(self.current_seed.as_ref());

        Some(random_bucket_id)
    }
}

impl<T: Trait, Id: BucketId> RandomBucketIdIterator<T, Id> {
    // Generate random storage or distribution bucket ID using next_id as an upper_bound.
    // Deleted bucket IDs are included.
    fn random_bucket_id(&self) -> Id {
        let total_buckets_number: u64 = self.next_id.clone().into();

        let random_bucket_id: Id = Module::<T>::random_index(
            self.current_seed.as_ref(),
            total_buckets_number.saturated_into(),
        )
        .saturated_into();

        random_bucket_id
    }

    // Creates new iterator.
    pub(crate) fn new(next_id: Id) -> Self {
        let seed = Module::<T>::get_initial_random_seed();

        Self {
            current_iteration: 0,
            max_iteration_number: T::MaxRandomIterationNumber::get(),
            trait_marker: PhantomData,
            current_seed: seed,
            next_id,
        }
    }
}

// Iterator for sequential storage or distribution bucket IDs. It starts from the first possible storage bucket ID
// (zero) and goes up to the last storage bucket IDs (next_storage_bucket_id - excluding).
pub(crate) struct SequentialBucketIdIterator<T: Trait, Id: BucketId> {
    // Trait marker.
    trait_marker: PhantomData<T>,

    // Bucket ID for the current iteration.
    current_bucket_id: Id,

    // Next possible id for the buckets.
    next_id: Id,
}

impl<T: Trait, Id: BucketId> Iterator for SequentialBucketIdIterator<T, Id> {
    type Item = Id;

    fn next(&mut self) -> Option<Self::Item> {
        if self.current_bucket_id >= self.next_id {
            return None;
        }

        let result = self.current_bucket_id.clone();

        self.current_bucket_id += One::one();

        Some(result)
    }
}

impl<T: Trait, Id: BucketId> SequentialBucketIdIterator<T, Id> {
    // Creates new iterator.
    pub(crate) fn new(next_id: Id) -> Self {
        Self {
            current_bucket_id: Zero::zero(),
            trait_marker: PhantomData,
            next_id,
        }
    }
}
