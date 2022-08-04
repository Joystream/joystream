#![cfg(feature = "runtime-benchmarks")]

use crate::{
    types::{ChannelAgentPermissions, ChannelOwner},
    Call, ChannelBagWitness, ChannelById, ChannelUpdateParameters, Config, ContentActor, Event,
    Module as Pallet, StorageAssets,
};
use frame_benchmarking::benchmarks;
use frame_support::{storage::StorageMap, traits::Get};
use frame_system::RawOrigin;
use sp_arithmetic::traits::One;
use sp_std::{
    cmp::min,
    collections::{btree_map::BTreeMap, btree_set::BTreeSet},
    vec,
};
use storage::{DataObjectStorage, Module as Storage};

use super::{
    assert_last_event, channel_bag_witness, create_data_object_candidates_helper,
    generate_channel_creation_params, insert_content_leader, insert_distribution_leader,
    insert_storage_leader, setup_video, setup_worst_case_curator_group_with_curators,
    setup_worst_case_scenario_curator_channel, worst_case_channel_agent_permissions,
    worst_case_pausable_channel_feature, ContentWorkingGroupInstance, CreateAccountId,
    DistributionWorkingGroupInstance, StorageWorkingGroupInstance, MAX_BYTES_METADATA,
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

        let e in 1 .. MAX_BYTES_METADATA; //max bytes for metadata

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

        let params = generate_channel_creation_params::<T>(
            storage_wg_lead_account_id,
            distribution_wg_lead_account_id,
            a, b, c, d, e,
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

    channel_update_with_assets {

        let a in 1 .. T::MaxNumberOfCollaboratorsPerChannel::get(); //max colaborators

        let b in 1 .. T::MaxNumberOfAssetsPerChannel::get(); //max objs number to upload

        let c in 1 .. T::MaxNumberOfAssetsPerChannel::get(); //max objs number to remove

        let d in 1 .. MAX_BYTES_METADATA; //max bytes for new metadata

        let e in (T::StorageBucketsPerBagValueConstraint::get().min as u32) ..
         (T::StorageBucketsPerBagValueConstraint::get().max() as u32);

        let f in
            (T::DistributionBucketsPerBagValueConstraint::get().min as u32) ..
            (T::DistributionBucketsPerBagValueConstraint::get().max() as u32);

        let max_obj_size: u64 = T::MaxDataObjectSize::get();

        let assets_to_remove =
            Storage::<T>::get_next_data_object_ids(c as usize);

        let (channel_id,
            group_id,
            lead_account_id,
            curator_id,
            curator_account_id) =
        setup_worst_case_scenario_curator_channel::<T>(c, e, f,).unwrap();

        let channel = ChannelById::<T>::get(channel_id);

        let permissions: ChannelAgentPermissions =
            worst_case_channel_agent_permissions()
            .into_iter()
            .skip(1)
            .collect();

        let collaborators = Some(channel.collaborators
            .into_iter()
            .take(a as usize)
            .map(|(member_id, _)|{
                (member_id, permissions.clone())
            })
            .collect::<BTreeMap<_, _>>());

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

        let new_meta = Some(vec![1u8].repeat(d as usize));

        let update_params = ChannelUpdateParameters::<T> {
            assets_to_upload: Some(assets_to_upload),
            new_meta,
            assets_to_remove,
            collaborators,
            expected_data_object_state_bloat_bond,
            channel_bag_witness: Some(channel_bag_witness::<T>(channel_id)?),
        };

        let origin = RawOrigin::Signed(curator_account_id);
        let actor = ContentActor::Curator(group_id, curator_id);

    }: update_channel(
        origin, actor, channel_id, update_params.clone())
    verify {

        assert!(ChannelById::<T>::contains_key(&channel_id));

        assert_last_event::<T>(
            Event::<T>::ChannelUpdated(actor,
                channel_id,
                update_params,
                new_data_object_ids).into()
        );
    }

    channel_update_without_assets {

        let a in 1 .. T::MaxNumberOfCollaboratorsPerChannel::get(); //max colaborators

        let b in (T::StorageBucketsPerBagValueConstraint::get().min as u32) ..
         (T::StorageBucketsPerBagValueConstraint::get().max() as u32);

        let c in
            (T::DistributionBucketsPerBagValueConstraint::get().min as u32) ..
            (T::DistributionBucketsPerBagValueConstraint::get().max() as u32);

        let d in 1 .. MAX_BYTES_METADATA; //max bytes for new metadata

        let (channel_id,
            group_id,
            lead_account_id,
            curator_id,
            curator_account_id) =
        setup_worst_case_scenario_curator_channel::<T>(
            T::MaxNumberOfAssetsPerChannel::get(),
            b,
            c,).unwrap();

        let channel = ChannelById::<T>::get(channel_id);

        let permissions: ChannelAgentPermissions =
            worst_case_channel_agent_permissions()
            .into_iter()
            .skip(1)
            .collect();

        let collaborators = Some(channel.collaborators
            .into_iter()
            .take(a as usize)
            .map(|(member_id, _)|{
                (member_id, permissions.clone())
            })
            .collect::<BTreeMap<_, _>>());

        let expected_data_object_state_bloat_bond =
            Storage::<T>::data_object_state_bloat_bond_value();

        let new_meta = Some(vec![1u8].repeat(d as usize));

        let update_params = ChannelUpdateParameters::<T> {
            assets_to_upload: None,
            new_meta,
            assets_to_remove: BTreeSet::new(),
            collaborators,
            expected_data_object_state_bloat_bond,
            channel_bag_witness: Some(channel_bag_witness::<T>(channel_id)?),
        };

        let origin = RawOrigin::Signed(curator_account_id);
        let actor = ContentActor::Curator(group_id, curator_id);

    }: update_channel(
        origin, actor, channel_id, update_params.clone())
    verify {

        assert!(ChannelById::<T>::contains_key(&channel_id));

        assert_last_event::<T>(
            Event::<T>::ChannelUpdated(actor,
                channel_id,
                update_params,
                BTreeSet::new()).into()
        );
    }

    delete_channel {

        let a in 1 .. T::MaxNumberOfAssetsPerChannel::get(); //max objs number

        let b in (T::StorageBucketsPerBagValueConstraint::get().min as u32) ..
         (T::StorageBucketsPerBagValueConstraint::get().max() as u32);

        let c in
            (T::DistributionBucketsPerBagValueConstraint::get().min as u32) ..
            (T::DistributionBucketsPerBagValueConstraint::get().max() as u32);

        let (
            channel_id,
            group_id,
            lead_account_id,
            curator_id,
            curator_account_id
        ) =
        setup_worst_case_scenario_curator_channel::<T>(a, b, c,).unwrap();

        let origin = RawOrigin::Signed(curator_account_id);
        let actor = ContentActor::Curator(group_id, curator_id);
        let channel_bag_witness = channel_bag_witness::<T>(channel_id)?;
    }: _ (origin, actor, channel_id, channel_bag_witness, a.into())
    verify {

        assert_last_event::<T>(
            Event::<T>::ChannelDeleted(
                actor,
                channel_id
            ).into()
        );
    }

    update_channel_privilege_level {

        let (
            channel_id,
            _,
            lead_account_id,
            _,
            _
        ) =
        setup_worst_case_scenario_curator_channel::<T>(
            T::MaxNumberOfAssetsPerChannel::get(),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
            T::DistributionBucketsPerBagValueConstraint::get().max() as u32,
        ).unwrap();

        let origin = RawOrigin::Signed(lead_account_id);
        let privilege_level = T::ChannelPrivilegeLevel::one();

    }: _ (origin, channel_id, privilege_level)
    verify {

        assert_last_event::<T>(
            Event::<T>::ChannelPrivilegeLevelUpdated(
                channel_id,
                privilege_level,
            ).into()
        );
    }

    set_channel_paused_features_as_moderator {

        let a in 1 .. MAX_BYTES_METADATA; //max bytes for rationale

        let (
            channel_id,
            group_id,
            _,
            curator_id,
            curator_account_id
        ) =
        setup_worst_case_scenario_curator_channel::<T>(
            T::MaxNumberOfAssetsPerChannel::get(),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
            T::DistributionBucketsPerBagValueConstraint::get().max() as u32,
        ).unwrap();

        let origin = RawOrigin::Signed(curator_account_id);
        let actor = ContentActor::Curator(group_id, curator_id);

        let new_paused_features = worst_case_pausable_channel_feature();
        let rationale = vec![0u8].repeat(a as usize);

    }: _ (origin, actor,
        channel_id, new_paused_features.clone(), rationale.clone())
    verify {

        assert_last_event::<T>(
            Event::<T>::ChannelPausedFeaturesUpdatedByModerator(
                actor,
                channel_id,
                new_paused_features,
                rationale,
            ).into());
    }

    delete_channel_assets_as_moderator_with_assets {

        let a in 1 .. T::MaxNumberOfAssetsPerChannel::get(); //max objs number

        let b in (T::StorageBucketsPerBagValueConstraint::get().min as u32) ..
         (T::StorageBucketsPerBagValueConstraint::get().max() as u32);

        let c in
            (T::DistributionBucketsPerBagValueConstraint::get().min as u32) ..
            (T::DistributionBucketsPerBagValueConstraint::get().max() as u32);

        let d in 1 .. MAX_BYTES_METADATA; //max bytes for rationale

        let assets_to_remove =
            Storage::<T>::get_next_data_object_ids(a as usize);

        let (
            channel_id,
            group_id,
            _,
            curator_id,
            curator_account_id
        ) =
        setup_worst_case_scenario_curator_channel::<T>(a, b, c,).unwrap();

        let origin = RawOrigin::Signed(curator_account_id);
        let actor = ContentActor::Curator(group_id, curator_id);

        let rationale = vec![1u8].repeat(d as usize);
        let channel_bag_witness = Some(channel_bag_witness::<T>(channel_id)?);

    }: delete_channel_assets_as_moderator (
        origin,
        actor,
        channel_id,
        assets_to_remove.clone(),
        channel_bag_witness,
        rationale.clone())
    verify {

        assert_last_event::<T>(
            Event::<T>::ChannelAssetsDeletedByModerator(
                actor,
                channel_id,
                assets_to_remove,
                rationale,
            ).into());
    }

    delete_channel_assets_as_moderator_without_assets {

        let a in 1 .. MAX_BYTES_METADATA; //max bytes for rationale

        let (
            channel_id,
            group_id,
            _,
            curator_id,
            curator_account_id
        ) =
        setup_worst_case_scenario_curator_channel::<T>(
            T::MaxNumberOfAssetsPerChannel::get(),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
            T::DistributionBucketsPerBagValueConstraint::get().max() as u32
        ).unwrap();

        let origin = RawOrigin::Signed(curator_account_id);
        let actor = ContentActor::Curator(group_id, curator_id);
        let channel_bag_witness: Option<ChannelBagWitness> = None;
        let rationale = vec![1u8].repeat(a as usize);

    }: delete_channel_assets_as_moderator (origin, actor,
        channel_id, BTreeSet::new(), channel_bag_witness, rationale.clone())
    verify {

        assert_last_event::<T>(
            Event::<T>::ChannelAssetsDeletedByModerator(
                actor,
                channel_id,
                BTreeSet::new(),
                rationale,
            ).into());
    }

    delete_channel_as_moderator{

        let a in 1 .. T::MaxNumberOfAssetsPerChannel::get(); //max objs number

        let b in (T::StorageBucketsPerBagValueConstraint::get().min as u32) ..
         (T::StorageBucketsPerBagValueConstraint::get().max() as u32);

        let c in
            (T::DistributionBucketsPerBagValueConstraint::get().min as u32) ..
            (T::DistributionBucketsPerBagValueConstraint::get().max() as u32);

        let d in 1 .. MAX_BYTES_METADATA; //max bytes for rationale

        let (
            channel_id,
            group_id,
            lead_account_id,
            curator_id,
            curator_account_id
        ) =
        setup_worst_case_scenario_curator_channel::<T>(a, b, c,).unwrap();

        let origin = RawOrigin::Signed(curator_account_id);
        let actor = ContentActor::Curator(group_id, curator_id);
        let channel_bag_witness = channel_bag_witness::<T>(channel_id)?;
        let rationale = vec![1u8].repeat(d as usize);

    }: _ (origin,
        actor,
        channel_id,
        channel_bag_witness,
        a.into(),
        rationale.clone())
    verify {

        assert_last_event::<T>(
            Event::<T>::ChannelDeletedByModerator(
                actor,
                channel_id,
                rationale
            ).into()
        );
    }

    set_channel_visibility_as_moderator{

        let a in 1 .. MAX_BYTES_METADATA; //max bytes for rationale

        let (
            channel_id,
            group_id,
            _,
            curator_id,
            curator_account_id
        ) =
        setup_worst_case_scenario_curator_channel::<T>(
            T::MaxNumberOfAssetsPerChannel::get(),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
            T::DistributionBucketsPerBagValueConstraint::get().max() as u32,
        ).unwrap();

        let origin = RawOrigin::Signed(curator_account_id);
        let actor = ContentActor::Curator(group_id, curator_id);

        let rationale = vec![0u8].repeat(a as usize);

    }: _ (origin, actor, channel_id, true, rationale.clone())
    verify {

        assert_last_event::<T>(
            Event::<T>::ChannelVisibilitySetByModerator(
                actor,
                channel_id,
                true,
                rationale,
            ).into());
    }

    delete_video_assets_as_moderator_with_assets {

        let a in 1 .. T::MaxNumberOfAssetsPerVideo::get(); //max objs number

        let b in (T::StorageBucketsPerBagValueConstraint::get().min as u32) ..
         (T::StorageBucketsPerBagValueConstraint::get().max() as u32);

        let c in
            (T::DistributionBucketsPerBagValueConstraint::get().min as u32) ..
            (T::DistributionBucketsPerBagValueConstraint::get().max() as u32);

        let d in 1 .. MAX_BYTES_METADATA; //max bytes for rationale

        let (
            channel_id,
            group_id,
            _,
            curator_id,
            curator_account_id
        ) =
        setup_worst_case_scenario_curator_channel::<T>(
            T::MaxNumberOfAssetsPerChannel::get(),
            b,
            c,).unwrap();

        let origin = RawOrigin::Signed(curator_account_id);
        let actor = ContentActor::Curator(group_id, curator_id);

        let rationale = vec![1u8].repeat(d as usize);
        let channel_bag_witness = Some(channel_bag_witness::<T>(channel_id)?);

        let assets_to_remove =
        Storage::<T>::get_next_data_object_ids(a as usize);

        let video_id = setup_video::<T>(
            origin.clone().into(),
            actor,
            channel_id,
            a,
            true,
            MAX_BYTES_METADATA);

    }: delete_video_assets_as_moderator (
        origin,
        actor,
        video_id,
        channel_bag_witness,
        assets_to_remove.clone(),
        rationale.clone())
    verify {

        assert_last_event::<T>(
            Event::<T>::VideoAssetsDeletedByModerator(
                actor,
                video_id,
                assets_to_remove,
                true,
                rationale,
            ).into());
    }

    delete_video_assets_as_moderator_without_assets {

        let a in 1 .. MAX_BYTES_METADATA; //max bytes for rationale

        let (
            channel_id,
            group_id,
            _,
            curator_id,
            curator_account_id
        ) =
        setup_worst_case_scenario_curator_channel::<T>(
            T::MaxNumberOfAssetsPerChannel::get(),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
            T::DistributionBucketsPerBagValueConstraint::get().max() as u32
        ).unwrap();

        let origin = RawOrigin::Signed(curator_account_id);
        let actor = ContentActor::Curator(group_id, curator_id);
        let channel_bag_witness: Option<ChannelBagWitness> = None;

        let video_id = setup_video::<T>(
            origin.clone().into(),
            actor,
            channel_id,
            T::MaxNumberOfAssetsPerVideo::get(),
            true,
            MAX_BYTES_METADATA);

        let rationale = vec![1u8].repeat(a as usize);

    }: delete_video_assets_as_moderator (
        origin,
        actor,
        video_id,
        channel_bag_witness,
        BTreeSet::new(),
        rationale.clone())
    verify {

        assert_last_event::<T>(
            Event::<T>::VideoAssetsDeletedByModerator(
                actor,
                video_id,
                BTreeSet::new(),
                true,
                rationale,
            ).into());
    }

    delete_video_as_moderator_with_assets {

        let a in 1 .. T::MaxNumberOfAssetsPerVideo::get(); //max objs number

        let b in (T::StorageBucketsPerBagValueConstraint::get().min as u32) ..
         (T::StorageBucketsPerBagValueConstraint::get().max() as u32);

        let c in
            (T::DistributionBucketsPerBagValueConstraint::get().min as u32) ..
            (T::DistributionBucketsPerBagValueConstraint::get().max() as u32);

        let d in 1 .. MAX_BYTES_METADATA; //max bytes for rationale

        let (
            channel_id,
            group_id,
            _,
            curator_id,
            curator_account_id
        ) =
        setup_worst_case_scenario_curator_channel::<T>(
            T::MaxNumberOfAssetsPerChannel::get(),
            b,
            c,).unwrap();

        let origin = RawOrigin::Signed(curator_account_id);
        let actor = ContentActor::Curator(group_id, curator_id);

        let rationale = vec![1u8].repeat(d as usize);
        let channel_bag_witness = Some(channel_bag_witness::<T>(channel_id)?);

        let assets_to_remove =
        Storage::<T>::get_next_data_object_ids(a as usize).len() as u64;

        let video_id = setup_video::<T>(
            origin.clone().into(),
            actor,
            channel_id,
            a,
            false,
            MAX_BYTES_METADATA);

    }: delete_video_as_moderator (
        origin,
        actor,
        video_id,
        channel_bag_witness,
        assets_to_remove,
        rationale.clone())
    verify {

        assert_last_event::<T>(
            Event::<T>::VideoDeletedByModerator(
                actor,
                video_id,
                rationale,
            ).into());
    }

    delete_video_as_moderator_without_assets {

        let a in 1 .. MAX_BYTES_METADATA; //max bytes for rationale

        let (
            channel_id,
            group_id,
            _,
            curator_id,
            curator_account_id
        ) =
        setup_worst_case_scenario_curator_channel::<T>(
            T::MaxNumberOfAssetsPerChannel::get(),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
            T::DistributionBucketsPerBagValueConstraint::get().max() as u32
        ).unwrap();

        let origin = RawOrigin::Signed(curator_account_id);
        let actor = ContentActor::Curator(group_id, curator_id);
        let channel_bag_witness: Option<ChannelBagWitness> = None;

        let video_id = setup_video::<T>(
            origin.clone().into(),
            actor,
            channel_id,
            0,
            false,
            MAX_BYTES_METADATA);

        let rationale = vec![1u8].repeat(a as usize);

    }: delete_video_as_moderator (
        origin,
        actor,
        video_id,
        channel_bag_witness,
        0,
        rationale.clone())
    verify {

        assert_last_event::<T>(
            Event::<T>::VideoDeletedByModerator(
                actor,
                video_id,
                rationale,
            ).into());
    }

    set_video_visibility_as_moderator{

        let a in 1 .. MAX_BYTES_METADATA; //max bytes for rationale

        let (
            channel_id,
            group_id,
            _,
            curator_id,
            curator_account_id
        ) =
        setup_worst_case_scenario_curator_channel::<T>(
            T::MaxNumberOfAssetsPerChannel::get(),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
            T::DistributionBucketsPerBagValueConstraint::get().max() as u32,
        ).unwrap();

        let origin = RawOrigin::Signed(curator_account_id);
        let actor = ContentActor::Curator(group_id, curator_id);

        let video_id = setup_video::<T>(
            origin.clone().into(),
            actor,
            channel_id,
            0,
            false,
            MAX_BYTES_METADATA);

        let rationale = vec![0u8].repeat(a as usize);

    }: _ (origin, actor, video_id, true, rationale.clone())
    verify {

        assert_last_event::<T>(
            Event::<T>::VideoVisibilitySetByModerator(
                actor,
                video_id,
                true,
                rationale,
            ).into());
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
    fn channel_update_with_assets() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_channel_update_with_assets());
        });
    }

    #[test]
    fn channel_update_without_assets() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_channel_update_without_assets());
        });
    }

    #[test]
    fn delete_channel() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_delete_channel());
        });
    }

    #[test]
    fn update_channel_privilege_level() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_update_channel_privilege_level());
        });
    }

    #[test]
    fn set_channel_paused_features_as_moderator() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_set_channel_paused_features_as_moderator());
        });
    }

    #[test]
    fn delete_channel_assets_as_moderator_with_assets() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_delete_channel_assets_as_moderator_with_assets());
        });
    }

    #[test]
    fn delete_channel_assets_as_moderator_without_assets() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_delete_channel_assets_as_moderator_without_assets());
        });
    }

    #[test]
    fn delete_channel_as_moderator() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_delete_channel_as_moderator());
        });
    }

    #[test]
    fn set_channel_visibility_as_moderator() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_set_channel_visibility_as_moderator());
        });
    }

    #[test]
    fn delete_video_assets_as_moderator_with_assets() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_delete_video_assets_as_moderator_with_assets());
        });
    }

    #[test]
    fn delete_video_assets_as_moderator_without_assets() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_delete_video_assets_as_moderator_without_assets());
        });
    }

    #[test]
    fn delete_video_as_moderator_with_assets() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_delete_video_as_moderator_with_assets());
        });
    }

    #[test]
    fn delete_video_as_moderator_without_assets() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_delete_video_as_moderator_without_assets());
        });
    }

    #[test]
    fn set_video_visibility_as_moderator() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_set_video_visibility_as_moderator());
        });
    }
}
