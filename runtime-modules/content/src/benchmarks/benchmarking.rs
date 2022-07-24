#![cfg(feature = "runtime-benchmarks")]

use crate::{
    types::{ChannelActionPermission, ChannelOwner},
    Call, ChannelById, ChannelUpdateParameters, Config, ContentActor, Event, Module as Pallet,
    StorageAssets,
};
use frame_benchmarking::benchmarks;
use frame_support::{storage::StorageMap, traits::Get};
use frame_system::RawOrigin;
use sp_arithmetic::traits::One;
use sp_std::{
    cmp::min,
    collections::{btree_map::BTreeMap, btree_set::BTreeSet},
    iter::FromIterator,
};
use storage::{DataObjectStorage, Module as Storage};

use super::{
    assert_last_event, create_data_object_candidates_helper, generate_channel_creation_params,
    insert_content_leader, insert_distribution_leader, insert_storage_leader,
    setup_worst_case_curator_group_with_curators, setup_worst_case_scenario_curator_channel,
    ContentWorkingGroupInstance, CreateAccountId, DistributionWorkingGroupInstance,
    StorageWorkingGroupInstance,
};

benchmarks! {
    where_clause {
        where
              T: balances::Config,
              T: membership::Config,
              T: storage::Config,
              T: working_group::Config<StorageWorkingGroupInstance>,
              T: working_group::Config<DistributionWorkingGroupInstance>,
              T: working_group::Config<ContentWorkingGroupInstance>,
              T::AccountId: CreateAccountId,
              T: Config ,
    }

    /*
    ============================================================================
    ======================================== CHANNEL CUD GROUP =================
    ============================================================================
    */

    create_channel {

        let a in 1 .. T::MaxNumberOfCollaboratorsPerChannel::get();//max colaborators

        let b in (T::StorageBucketsPerBagValueConstraint::get().min as u32) ..
            (T::StorageBucketsPerBagValueConstraint::get().max() as u32);

        let c in
        (T::DistributionBucketsPerBagValueConstraint::get().min as u32) ..
        (T::DistributionBucketsPerBagValueConstraint::get().max() as u32);

        let d in 1 .. T::MaxNumberOfAssetsPerChannel::get(); //max objs number

        let max_obj_size: u64 = T::MaxDataObjectSize::get();

        let (_, storage_wg_lead_account_id) = insert_storage_leader::<T>();

        let (_, distribution_wg_lead_account_id) =
            insert_distribution_leader::<T>();

        let (_, lead_account_id) = insert_content_leader::<T>();

        let sender = RawOrigin::Signed(lead_account_id);

        let group_id = setup_worst_case_curator_group_with_curators::<T>(
            min(<T as working_group::Config<ContentWorkingGroupInstance>>::
                MaxWorkerNumberLimit::get(),
            T::MaxNumberOfCuratorsPerGroup::get())
        )?;

        let channel_owner = ChannelOwner::CuratorGroup(group_id);

        let bucket_objs_size_limit = max_obj_size.
            saturating_mul(T::MaxNumberOfAssetsPerChannel::get().into());

        let bucket_objs_number_limit =
            T::MaxNumberOfAssetsPerChannel::get().into();

        let params = generate_channel_creation_params::<T>(
            storage_wg_lead_account_id,
            distribution_wg_lead_account_id,
            bucket_objs_size_limit,
            bucket_objs_number_limit,
            a, b, c, d,
            max_obj_size,
        );

    }: _ (sender, channel_owner, params.clone())
    verify {

        let channel_id: T::ChannelId = One::one();
        assert!(ChannelById::<T>::contains_key(&channel_id));

        let channel = ChannelById::<T>::get(channel_id);

        assert_last_event::<T>(
            Event::<T>::ChannelCreated(
                channel_id,
                channel,
                params).into()
        );
    }

    update_channel {

        let a in 1 .. T::MaxNumberOfCollaboratorsPerChannel::get(); //max colaborators

        let b in 1 .. T::MaxNumberOfAssetsPerChannel::get(); //max objs number to upload

        let c in 1 .. T::MaxNumberOfAssetsPerChannel::get(); //max objs number to remove

        let max_obj_size: u64 = T::MaxDataObjectSize::get();

        let assets_to_remove =
            Storage::<T>::get_next_data_object_ids(c as usize);

        let bucket_objs_size_limit = max_obj_size.
            saturating_mul(T::MaxNumberOfAssetsPerChannel::get().into());

        let bucket_objs_number_limit =
            T::MaxNumberOfAssetsPerChannel::get().into();

        let (channel_id,
            group_id,
            lead_account_id,
            curator_id,
            curator_account_id) =
        setup_worst_case_scenario_curator_channel::<T>(
            c,
            bucket_objs_size_limit,
            bucket_objs_number_limit,
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
            T::DistributionBucketsPerBagValueConstraint::get().max() as u32,
        ).unwrap();

        let channel = ChannelById::<T>::get(channel_id);

        let permissions = BTreeSet::from_iter([
            ChannelActionPermission::ManageChannelCollaborators,
            ChannelActionPermission::ManageNonVideoChannelAssets,
            ChannelActionPermission::UpdateChannelMetadata,
        ]);

        let collaborators = channel.collaborators.into_iter()
        .map(|(member_id, _)|{
            (member_id, permissions.clone())
        }).collect::<BTreeMap<_, _>>();

        let assets_to_upload = StorageAssets::<T> {
                expected_data_size_fee:
                    Storage::<T>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_object_candidates_helper(
                    b,
                    max_obj_size
                ),
        };

        let new_data_object_ids =
            Storage::<T>::get_next_data_object_ids(
                assets_to_upload.object_creation_list.len());

        let expected_data_object_state_bloat_bond =
            Storage::<T>::data_object_state_bloat_bond_value();

        let update_params = ChannelUpdateParameters::<T> {
            assets_to_upload: Some(assets_to_upload),
            new_meta: None,
            assets_to_remove,
            collaborators: Some(collaborators),
            expected_data_object_state_bloat_bond,
        };

        let origin = RawOrigin::Signed(curator_account_id);
        let actor = ContentActor::Curator(group_id, curator_id);

    }: _ (origin, actor, channel_id, update_params.clone())
    verify {

        assert!(ChannelById::<T>::contains_key(&channel_id));

        assert_last_event::<T>(
            Event::<T>::ChannelUpdated(actor,
                channel_id,
                update_params,
                new_data_object_ids).into()
        );
    }

    delete_channel {

        let a in 1 .. T::MaxNumberOfAssetsPerChannel::get(); //max objs number

        let max_obj_size: u64 = T::MaxDataObjectSize::get();

        let bucket_objs_size_limit = max_obj_size.
            saturating_mul(T::MaxNumberOfAssetsPerChannel::get().into());

        let bucket_objs_number_limit =
            T::MaxNumberOfAssetsPerChannel::get().into();

        let (
            channel_id,
            group_id,
            lead_account_id,
            curator_id,
            curator_account_id
        ) =
        setup_worst_case_scenario_curator_channel::<T>(
            a,
            bucket_objs_size_limit,
            bucket_objs_number_limit,
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
            T::DistributionBucketsPerBagValueConstraint::get().max() as u32,
        ).unwrap();

        let origin = RawOrigin::Signed(curator_account_id);
        let actor = ContentActor::Curator(group_id, curator_id);

    }: _ (origin, actor, channel_id, a.into())
    verify {

        assert_last_event::<T>(
            Event::<T>::ChannelDeleted(
                actor,
                channel_id
            ).into()
        );
    }
}

#[cfg(test)]
pub mod tests {
    use crate::tests::mock::{with_default_mock_builder, Content};
    use frame_support::assert_ok;

    #[test]
    fn create_channel() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_create_channel());
        });
    }

    #[test]
    fn update_channel() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_update_channel());
        });
    }

    #[test]
    fn delete_channel() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_delete_channel());
        });
    }
}
