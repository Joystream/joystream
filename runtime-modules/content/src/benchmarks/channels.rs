#![cfg(feature = "runtime-benchmarks")]

use crate::types::{ChannelCreationParameters, ChannelOwner, StorageAssets};
use crate::Module as Pallet;
use crate::{Call, ChannelById, Config};
use frame_benchmarking::benchmarks;
use frame_support::storage::StorageMap;
use frame_support::traits::Get;
use frame_system::RawOrigin;
use sp_arithmetic::traits::{One, Saturating};
use sp_runtime::SaturatedConversion;
use sp_std::collections::btree_map::BTreeMap;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::convert::TryInto;
use sp_std::vec;
use storage::{DynamicBagType, Module as Storage};

use super::{
    create_data_object_candidates_helper, create_distribution_bucket_with_family_adjusted,
    create_storage_bucket, get_permissions, insert_distribution_leader, insert_storage_leader,
    member_funded_account, rescale_constraints, set_dyn_bag_creation_storage_bucket_numbers,
    set_storage_buckets_voucher_max_limits, update_families_in_dynamic_bag_creation_policy,
    CreateAccountId, DistributionWorkingGroupInstance, StorageWorkingGroupInstance,
    CHANNEL_AGENT_PERMISSIONS, COLABORATOR_IDS, DEFAULT_MEMBER_ID, MAX_BYTES, MAX_COLABORATOR_IDS,
    MAX_OBJ_NUMBER,
};

benchmarks! {
    where_clause {
        where
              T: balances::Config,
              T: membership::Config,
              T: storage::Config,
              T: working_group::Config<StorageWorkingGroupInstance>,
              T: working_group::Config<DistributionWorkingGroupInstance>,
              T::AccountId: CreateAccountId,
              T: Config ,
    }

    channel_creation_with_channel_bag {

        let a in 1 .. MAX_BYTES; //max metadata
        let b in 1 .. MAX_COLABORATOR_IDS as u32; //max colaborators
        let c in 0 .. 100; //StorageBucketsPerBagValueConstraint
        let e in 0 .. 100; // DistributionBucketsPerBagValueConstraint
        let f in 1 .. MAX_OBJ_NUMBER; //max objs number

        let chan_perm = CHANNEL_AGENT_PERMISSIONS.len() as u32 - 1;

        let max_distribution_bucket_family_number =
            T::MaxDistributionBucketFamilyNumber::get().try_into().unwrap();

        let max_obj_size: u64 = T::MaxDataObjectSize::get();

        let total_objs_size: u64 = max_obj_size.saturating_mul(f.into());

        let metadata = vec![0u8].repeat(a as usize);

        let storage_wg_lead_account_id = insert_storage_leader::<T>();

        let distribution_wg_lead_account_id = insert_distribution_leader::<T>();

        //Rescaling range [0,100] to storage buckets min and max bounds.
        let storage_buckets_contraint_min =
            T::StorageBucketsPerBagValueConstraint::get().min;

        let storage_buckets_contraint_max =
            T::StorageBucketsPerBagValueConstraint::get().max();

        let rescaled_c = rescale_constraints::<T>(
            storage_buckets_contraint_min,
            storage_buckets_contraint_max,
            c
        ).unwrap();

        //Rescaling range [0,100] to distribution buckets min and max bounds.
        let distribution_buckets_contraint_min =
            T::DistributionBucketsPerBagValueConstraint::get().min;

        let distribution_buckets_contraint_max =
            T::DistributionBucketsPerBagValueConstraint::get().max();

        let rescaled_e = rescale_constraints::<T>(
            distribution_buckets_contraint_min,
            distribution_buckets_contraint_max,
            e).unwrap();

        set_dyn_bag_creation_storage_bucket_numbers::<T>(
            storage_wg_lead_account_id.clone(),
            rescaled_c.into(),
            DynamicBagType::Channel);

        set_storage_buckets_voucher_max_limits::<T>(
            storage_wg_lead_account_id.clone(),
            total_objs_size , f.into());

        let (channel_owner_account_id, channel_owner_member_id) =
            member_funded_account::<T>(DEFAULT_MEMBER_ID);

        let sender = RawOrigin::Signed(channel_owner_account_id);

        let assets = StorageAssets::<T> {
            expected_data_size_fee:
                Storage::<T>::data_object_per_mega_byte_fee(),
            object_creation_list: create_data_object_candidates_helper(
                1,
                f.into(),
                max_obj_size
            ),
        };

        let collaborators = (0..b)
            .map(|id| {

                let (account_id, member_id) =
                    member_funded_account::<T>(COLABORATOR_IDS[id as usize]);
                let permissions = get_permissions(chan_perm.into());
                (member_id, permissions)
            })
            .collect::<BTreeMap<_,_>>();

        let storage_buckets = (0..rescaled_c)
            .map(|id| {
                create_storage_bucket::<T>(
                    storage_wg_lead_account_id.clone(),
                    true,
                    total_objs_size,
                    f.into());
                    id.saturated_into()
            })
            .collect::<BTreeSet<_>>();

        let distribution_families =
            create_distribution_bucket_with_family_adjusted::<T>(
                distribution_wg_lead_account_id.clone(),
                max_distribution_bucket_family_number,
                rescaled_e);

        let distribution_buckets_families_policy =
            distribution_families.clone().into_iter()
            .map(|(family_id, buckets)|
                (family_id, buckets.len() as u32))
            .collect::<BTreeMap<_,_>>();

        let distribution_buckets =
            distribution_families.into_iter()
            .flat_map(|(family_id, buckets)| buckets)
            .collect::<BTreeSet<_>>();

        update_families_in_dynamic_bag_creation_policy::<T>(
            distribution_wg_lead_account_id,
            DynamicBagType::Channel,
            distribution_buckets_families_policy,
        );

        let channel_owner = ChannelOwner::Member(channel_owner_member_id);

        let expected_data_object_state_bloat_bond =
            Storage::<T>::data_object_state_bloat_bond_value();

        let expected_channel_state_bloat_bond =
            Pallet::<T>::channel_state_bloat_bond_value();

        let params = ChannelCreationParameters::<T> {
            assets: Some(assets),
            meta: Some(metadata),
            collaborators,
            storage_buckets,
            distribution_buckets,
            expected_data_object_state_bloat_bond,
            expected_channel_state_bloat_bond
        };

    }: create_channel (sender, channel_owner, params)
    verify {
        let channel_id: T::ChannelId = One::one();
        assert!(ChannelById::<T>::contains_key(&channel_id));
        // channel counter increased
        assert_eq!(
            Pallet::<T>::next_channel_id(),
            channel_id.saturating_add(One::one())
        );
    }
}

#[cfg(test)]
pub mod tests {
    use crate::tests::mock::{with_default_mock_builder, Content};
    use frame_support::assert_ok;

    #[test]
    fn channel_creation_with_channel_bag() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_channel_creation_with_channel_bag());
        });
    }
}
