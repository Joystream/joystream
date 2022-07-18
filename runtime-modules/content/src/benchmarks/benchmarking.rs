#![cfg(feature = "runtime-benchmarks")]

use crate::types::{ChannelActionPermission, ChannelOwner};
use crate::Module as Pallet;
use crate::{
    Call, ChannelById, ChannelUpdateParameters, Config, ContentActor, Event, StorageAssets,
};
use frame_benchmarking::benchmarks;
use frame_support::storage::StorageMap;
use frame_support::traits::Get;
use frame_system::RawOrigin;
use sp_arithmetic::traits::One;
use sp_std::collections::btree_map::BTreeMap;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::iter::FromIterator;
use storage::{DataObjectStorage, Module as Storage};

use super::{
    assert_last_event, create_data_object_candidates_helper, generate_channel_creation_params,
    insert_distribution_leader, insert_storage_leader, member_funded_account, CreateAccountId,
    DistributionWorkingGroupInstance, StorageWorkingGroupInstance, DEFAULT_MEMBER_ID,
    MAX_COLABORATOR_IDS, MAX_OBJ_NUMBER,
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

    /*
    ============================================================================
    ======================================== CHANNEL CUD GROUP =================
    ============================================================================
    */

    create_channel {

        let a in 1 .. MAX_COLABORATOR_IDS as u32; //max colaborators

        let b in (T::StorageBucketsPerBagValueConstraint::get().min as u32) ..
            (T::StorageBucketsPerBagValueConstraint::get().max() as u32);

        let c in
        (T::DistributionBucketsPerBagValueConstraint::get().min as u32) ..
        (T::DistributionBucketsPerBagValueConstraint::get().max() as u32);

        let d in 1 .. MAX_OBJ_NUMBER; //max objs number

        let max_obj_size: u64 = T::MaxDataObjectSize::get();

        let storage_wg_lead_account_id = insert_storage_leader::<T>();

        let distribution_wg_lead_account_id = insert_distribution_leader::<T>();

        let (channel_owner_account_id, channel_owner_member_id) =
            member_funded_account::<T>(DEFAULT_MEMBER_ID);

        let sender = RawOrigin::Signed(channel_owner_account_id);

        let channel_owner = ChannelOwner::Member(channel_owner_member_id);

        let params = generate_channel_creation_params::<T>(
            storage_wg_lead_account_id,
            distribution_wg_lead_account_id,
            max_obj_size.saturating_mul(MAX_OBJ_NUMBER.into()),
            MAX_OBJ_NUMBER.into(),
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

        let a in 1 .. MAX_COLABORATOR_IDS as u32; //max colaborators

        let b in 1 .. MAX_OBJ_NUMBER; //max objs number to upload

        let c in 1 .. MAX_OBJ_NUMBER; //max objs number to remove

        let max_obj_size: u64 = T::MaxDataObjectSize::get();

        let storage_wg_lead_account_id = insert_storage_leader::<T>();

        let distribution_wg_lead_account_id = insert_distribution_leader::<T>();

        let (channel_owner_account_id, channel_owner_member_id) =
            member_funded_account::<T>(DEFAULT_MEMBER_ID);

        let sender = RawOrigin::Signed(channel_owner_account_id.clone());

        let channel_owner =
            ChannelOwner::Member(channel_owner_member_id);

        let assets_to_remove =
            Storage::<T>::get_next_data_object_ids(c as usize);

        let params = generate_channel_creation_params::<T>(
            storage_wg_lead_account_id,
            distribution_wg_lead_account_id,
            max_obj_size.saturating_mul((2 * MAX_OBJ_NUMBER).into()),
            (2 * MAX_OBJ_NUMBER).into(),
            a,
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
            T::DistributionBucketsPerBagValueConstraint::get().max() as u32,
            c,
            max_obj_size,
        );

        Pallet::<T>::create_channel(
            sender.into(),
            channel_owner,
            params.clone()).unwrap();

        let permissions = BTreeSet::from_iter([
            ChannelActionPermission::ManageChannelCollaborators,
            ChannelActionPermission::ManageNonVideoChannelAssets,
            ChannelActionPermission::UpdateChannelMetadata,
        ]);

        let collaborators = params.collaborators.into_iter()
        .map(|(member_id, _)|{
            (member_id, permissions.clone())
        }).collect::<BTreeMap<_, _>>();

        let assets_to_upload = StorageAssets::<T> {
                expected_data_size_fee:
                    Storage::<T>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_object_candidates_helper(
                    1,
                    (b - 1).into(),
                    max_obj_size,
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

        let origin = RawOrigin::Signed(channel_owner_account_id);
        let actor = ContentActor::Member(channel_owner_member_id);
        let channel_id: T::ChannelId = One::one();

    }: _ (origin, actor, channel_id, update_params.clone())
    verify {
        let channel_id: T::ChannelId = One::one();
        assert!(ChannelById::<T>::contains_key(&channel_id));

        assert_last_event::<T>(
            Event::<T>::ChannelUpdated(actor,
                channel_id,
                update_params,
                new_data_object_ids).into()
        );
    }

    delete_channel {

        let a in 1 .. MAX_OBJ_NUMBER; //max objs number

        let max_obj_size: u64 = T::MaxDataObjectSize::get();

        let storage_wg_lead_account_id = insert_storage_leader::<T>();

        let distribution_wg_lead_account_id = insert_distribution_leader::<T>();

        let (channel_owner_account_id, channel_owner_member_id) =
            member_funded_account::<T>(DEFAULT_MEMBER_ID);

        let sender = RawOrigin::Signed(channel_owner_account_id.clone());

        let channel_owner = ChannelOwner::Member(channel_owner_member_id);

        let params = generate_channel_creation_params::<T>(
            storage_wg_lead_account_id,
            distribution_wg_lead_account_id,
            max_obj_size.saturating_mul(MAX_OBJ_NUMBER.into()),
            MAX_OBJ_NUMBER.into(),
            MAX_COLABORATOR_IDS as u32,
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
            T::DistributionBucketsPerBagValueConstraint::get().max() as u32,
            a,
            max_obj_size,
        );

        Pallet::<T>::create_channel(
            sender.into(),
            channel_owner,
            params).unwrap();

        let origin = RawOrigin::Signed(channel_owner_account_id);
        let actor = ContentActor::Member(channel_owner_member_id);
        let channel_id: T::ChannelId = One::one();

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
