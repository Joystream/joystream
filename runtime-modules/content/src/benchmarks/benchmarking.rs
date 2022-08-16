#![cfg(feature = "runtime-benchmarks")]

use crate::{
    permissions::*,
    types::{
        ChannelAgentPermissions, ChannelOwner, ChannelTransferStatus, ChannelUpdateParameters,
        ContentTreasury, InitTransferParametersOf, ModuleAccount, PendingTransfer, StorageAssets,
        TransferCommitmentParameters, TransferCommitmentWitnessOf,
    },
    Call, ChannelById, Config, ContentActor, Event, Module as Pallet,
};
use frame_benchmarking::benchmarks;
use frame_support::{storage::StorageMap, traits::Get};
use frame_system::RawOrigin;
use sp_arithmetic::traits::One;
use sp_runtime::SaturatedConversion;
use sp_std::convert::TryInto;
use sp_std::{
    collections::{btree_map::BTreeMap, btree_set::BTreeSet},
    vec,
};
use storage::Module as Storage;

use super::{
    assert_last_event, channel_bag_witness, clone_curator_group,
    create_data_object_candidates_helper, generate_channel_creation_params, insert_content_leader,
    insert_curator, insert_distribution_leader, insert_storage_leader, max_curators_per_group,
    member_funded_account, setup_video, setup_worst_case_curator_group_with_curators,
    setup_worst_case_nft_video, setup_worst_case_scenario_curator_channel,
    setup_worst_case_scenario_curator_channel_all_max, storage_buckets_num_witness,
    worst_case_channel_agent_permissions, worst_case_content_moderation_actions_set,
    worst_case_pausable_channel_feature, worst_case_scenario_collaborators,
    ContentWorkingGroupInstance, CreateAccountId, RuntimeConfig, CURATOR_IDS, MAX_BYTES_METADATA,
};

benchmarks! {
    where_clause {
        where
            T: RuntimeConfig,
            T::AccountId: CreateAccountId
    }

    /*
    ============================================================================
    ======================================== CHANNEL CUD GROUP =================
    ============================================================================
    */

    create_channel {

        let a in 1 .. T::MaxNumberOfCollaboratorsPerChannel::get(); //max colaborators

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
            max_curators_per_group::<T>()
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
        let channel_acc = ContentTreasury::<T>::account_for_channel(channel_id);

        assert_last_event::<T>(
            Event::<T>::ChannelCreated(
                channel_id,
                channel,
                params,
                channel_acc
            ).into()
        );
    }

    channel_update_with_assets {

        let a in 1 .. T::MaxNumberOfCollaboratorsPerChannel::get(); //max colaborators

        let b in 1 .. T::MaxNumberOfAssetsPerChannel::get(); //max objs number to upload

        let c in 1 .. T::MaxNumberOfAssetsPerChannel::get(); //max objs number to remove

        let d in 1 .. MAX_BYTES_METADATA; //max bytes for new metadata

        let e in (T::StorageBucketsPerBagValueConstraint::get().min as u32) ..
         (T::StorageBucketsPerBagValueConstraint::get().max() as u32);

        let max_obj_size: u64 = T::MaxDataObjectSize::get();

        let assets_to_remove: BTreeSet<T::DataObjectId> = (0..c).map(|i| i.saturated_into()).collect();

        let (channel_id,
            group_id,
            lead_account_id,
            curator_id,
            curator_account_id) =
        setup_worst_case_scenario_curator_channel::<T>(
            c,
            e,
            T::DistributionBucketsPerBagValueConstraint::get().max() as u32,
            false
        ).unwrap();

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

        let new_data_object_ids: BTreeSet<T::DataObjectId> = (c..c+b).map(|i| i.saturated_into()).collect();

        let expected_data_object_state_bloat_bond =
            Storage::<T>::data_object_state_bloat_bond_value();

        let new_meta = Some(vec![1u8].repeat(d as usize));

        let update_params = ChannelUpdateParameters::<T> {
            assets_to_upload: Some(assets_to_upload),
            new_meta,
            assets_to_remove,
            collaborators,
            expected_data_object_state_bloat_bond,
            storage_buckets_num_witness: Some(storage_buckets_num_witness::<T>(channel_id)?),
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

        let b in 1 .. MAX_BYTES_METADATA; //max bytes for new metadata

        let (channel_id,
            group_id,
            lead_account_id,
            curator_id,
            curator_account_id) =
        setup_worst_case_scenario_curator_channel::<T>(
            T::MaxNumberOfAssetsPerChannel::get(),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
            T::DistributionBucketsPerBagValueConstraint::get().max() as u32,
            false
        ).unwrap();

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

        let new_meta = Some(vec![1u8].repeat(b as usize));

        let update_params = ChannelUpdateParameters::<T> {
            assets_to_upload: None,
            new_meta,
            assets_to_remove: BTreeSet::new(),
            collaborators,
            expected_data_object_state_bloat_bond,
            storage_buckets_num_witness: None
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
        setup_worst_case_scenario_curator_channel::<T>(a, b, c, true).unwrap();

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
    /*
    ============================================================================
    ================ Channel/Video Moderation actions Group ====================
    ============================================================================
    */
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
            true
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
            true
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

    delete_channel_assets_as_moderator {

        let a in 1 .. T::MaxNumberOfAssetsPerChannel::get(); //max objs number

        let b in (T::StorageBucketsPerBagValueConstraint::get().min as u32) ..
         (T::StorageBucketsPerBagValueConstraint::get().max() as u32);

        let c in 1 .. MAX_BYTES_METADATA; //max bytes for rationale

        let assets_to_remove: BTreeSet<T::DataObjectId> =
            (0..a).map(|i| i.saturated_into()).collect();

        let (
            channel_id,
            group_id,
            _,
            curator_id,
            curator_account_id
        ) =
        setup_worst_case_scenario_curator_channel::<T>(
            a,
            b,
            T::DistributionBucketsPerBagValueConstraint::get().max() as u32,
            true).unwrap();

        let origin = RawOrigin::Signed(curator_account_id);
        let actor = ContentActor::Curator(group_id, curator_id);

        let rationale = vec![1u8].repeat(c as usize);
        let storage_buckets_num_witness =
            Some(storage_buckets_num_witness::<T>(channel_id)?);

    }: _ (
        origin,
        actor,
        channel_id,
        assets_to_remove.clone(),
        storage_buckets_num_witness,
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
        setup_worst_case_scenario_curator_channel::<T>(a, b, c, true).unwrap();

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
            true
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

    delete_video_assets_as_moderator {

        let a in 1 .. T::MaxNumberOfAssetsPerVideo::get(); //max objs number

        let b in (T::StorageBucketsPerBagValueConstraint::get().min as u32) ..
         (T::StorageBucketsPerBagValueConstraint::get().max() as u32);

        let c in 1 .. MAX_BYTES_METADATA; //max bytes for rationale

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
            T::DistributionBucketsPerBagValueConstraint::get().max() as u32,
            false
        ).unwrap();

        let origin = RawOrigin::Signed(curator_account_id);
        let actor = ContentActor::Curator(group_id, curator_id);

        let rationale = vec![1u8].repeat(c as usize);
        let storage_buckets_num_witness =
            Some(storage_buckets_num_witness::<T>(channel_id)?);

        let assets_to_remove_start = T::MaxNumberOfAssetsPerChannel::get();
        let assets_to_remove_end = T::MaxNumberOfAssetsPerChannel::get() + a;

        let assets_to_remove: BTreeSet<T::DataObjectId> =
            (assets_to_remove_start..assets_to_remove_end)
                .map(|i| i.saturated_into()).collect();

        let video_id = setup_worst_case_nft_video::<T>(
            origin.clone().into(), actor, channel_id, a, c);

    }: _ (
        origin,
        actor,
        video_id,
        storage_buckets_num_witness,
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

    delete_video_as_moderator_with_assets {

        let a in 1 .. T::MaxNumberOfAssetsPerVideo::get(); //max objs number

        let b in (T::StorageBucketsPerBagValueConstraint::get().min as u32) ..
         (T::StorageBucketsPerBagValueConstraint::get().max() as u32);

        let c in 1 .. MAX_BYTES_METADATA; //max bytes for rationale

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
            T::DistributionBucketsPerBagValueConstraint::get().max() as u32,
            false
        ).unwrap();

        let origin = RawOrigin::Signed(curator_account_id);
        let actor = ContentActor::Curator(group_id, curator_id);

        let rationale = vec![1u8].repeat(c as usize);
        let storage_buckets_num_witness =
            Some(storage_buckets_num_witness::<T>(channel_id)?);

        let video_id = setup_video::<T>(
            origin.clone().into(),
            actor,
            channel_id,
            a,
            None,
            MAX_BYTES_METADATA);

    }: delete_video_as_moderator (
        origin,
        actor,
        video_id,
        storage_buckets_num_witness,
        a.into(),
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
            T::DistributionBucketsPerBagValueConstraint::get().max() as u32,
            false
        ).unwrap();

        let origin = RawOrigin::Signed(curator_account_id);
        let actor = ContentActor::Curator(group_id, curator_id);
        let storage_buckets_num_witness: Option<u32> = None;

        let video_id = setup_video::<T>(
            origin.clone().into(),
            actor,
            channel_id,
            0,
            None,
            MAX_BYTES_METADATA);

        let rationale = vec![1u8].repeat(a as usize);

    }: delete_video_as_moderator (
        origin,
        actor,
        video_id,
        storage_buckets_num_witness,
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
            false
        ).unwrap();

        let origin = RawOrigin::Signed(curator_account_id);
        let actor = ContentActor::Curator(group_id, curator_id);

        let video_id = setup_video::<T>(
            origin.clone().into(),
            actor,
            channel_id,
            T::MaxNumberOfAssetsPerVideo::get(),
            None,
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

    /*
    ===============================================================================================
    ======================================== CURATOR GROUPS =======================================
    ===============================================================================================
    */

    create_curator_group {
        let a in 0 .. (T::MaxKeysPerCuratorGroupPermissionsByLevelMap::get() as u32);

        let (_, lead_account) = insert_content_leader::<T>();
        let group_id = Pallet::<T>::next_curator_group_id();
        let permissions_by_level: ModerationPermissionsByLevel::<T> = (0..a).map(
            |i| (i.saturated_into(), worst_case_content_moderation_actions_set())
        ).collect();
    }: _ (
        RawOrigin::Signed(lead_account),
        true,
        permissions_by_level.clone()
    )
    verify {
        let group = Pallet::<T>::curator_group_by_id(group_id);
        assert!(group == CuratorGroup::create(true, &permissions_by_level));
        assert_last_event::<T>(Event::<T>::CuratorGroupCreated(group_id).into());
    }

    update_curator_group_permissions {
        let a in 0 .. (T::MaxKeysPerCuratorGroupPermissionsByLevelMap::get() as u32);

        let (_, lead_account) = insert_content_leader::<T>();
        let group_id = setup_worst_case_curator_group_with_curators::<T>(
            max_curators_per_group::<T>()
        )?;
        let permissions_by_level: ModerationPermissionsByLevel::<T> = (0..a).map(
            |i| (i.saturated_into(), worst_case_content_moderation_actions_set())
        ).collect();
    }: _ (
        RawOrigin::Signed(lead_account),
        group_id,
        permissions_by_level.clone()
    )
    verify {
        let group = Pallet::<T>::curator_group_by_id(group_id);
        assert_eq!(group.get_permissions_by_level(), &permissions_by_level);
        assert_last_event::<T>(Event::<T>::CuratorGroupPermissionsUpdated(
            group_id,
            permissions_by_level
        ).into());
    }

    set_curator_group_status {
        let (_, lead_account) = insert_content_leader::<T>();
        let group_id = setup_worst_case_curator_group_with_curators::<T>(
            max_curators_per_group::<T>()
        )?;
        let group = Pallet::<T>::curator_group_by_id(group_id);
        assert!(group.is_active());
    }: _ (
        RawOrigin::Signed(lead_account),
        group_id,
        false
    )
    verify {
        let group = Pallet::<T>::curator_group_by_id(group_id);
        assert!(!group.is_active());
        assert_last_event::<T>(Event::<T>::CuratorGroupStatusSet(group_id, false).into());
    }

    add_curator_to_group {
        let (_, lead_account) = insert_content_leader::<T>();
        let permissions = worst_case_channel_agent_permissions();
        let group_id = setup_worst_case_curator_group_with_curators::<T>(
            max_curators_per_group::<T>() - 1
        )?;
        let (curator_id, _) = insert_curator::<T>(
            CURATOR_IDS[max_curators_per_group::<T>() as usize - 1]
        );
        let group = Pallet::<T>::curator_group_by_id(group_id);
        assert_eq!(group.get_curators().get(&curator_id), None);
    }: _ (
        RawOrigin::Signed(lead_account),
        group_id,
        curator_id,
        permissions.clone()
    )
    verify {
        let group = Pallet::<T>::curator_group_by_id(group_id);
        assert_eq!(group.get_curators().get(&curator_id), Some(&permissions));
        assert_last_event::<T>(Event::<T>::CuratorAdded(group_id, curator_id, permissions).into());
    }

    remove_curator_from_group {
        let (_, lead_account) = insert_content_leader::<T>();
        let group_id = setup_worst_case_curator_group_with_curators::<T>(
            max_curators_per_group::<T>()
        )?;
        let group = Pallet::<T>::curator_group_by_id(group_id);
        let curator_id = *group.get_curators().keys().next().unwrap();
    }: _ (
        RawOrigin::Signed(lead_account),
        group_id,
        curator_id
    )
    verify {
        let group = Pallet::<T>::curator_group_by_id(group_id);
        assert!(group.get_curators().get(&curator_id).is_none());
        assert_last_event::<T>(Event::<T>::CuratorRemoved(group_id, curator_id).into());
    }

    /*
    ===============================================================================================
    ====================================== CHANNEL TRANSFERS ======================================
    ===============================================================================================
    */

    initialize_channel_transfer {
        let a in 0 .. (T::MaxNumberOfCollaboratorsPerChannel::get() as u32);
        let (_, new_owner_id) = member_funded_account::<T>(0);
        let new_owner = ChannelOwner::Member(new_owner_id);
        let new_collaborators = worst_case_scenario_collaborators::<T>(
            T::MaxNumberOfCollaboratorsPerChannel::get(), // start id
            a // number of collaborators
        );
        let price = <T as balances::Config>::Balance::one();
        let (channel_id, group_id, _, curator_id, curator_account_id) =
            setup_worst_case_scenario_curator_channel_all_max::<T>(false)?;
        let transfer_params = InitTransferParametersOf::<T> {
            new_owner: new_owner.clone(),
            new_collaborators: new_collaborators.clone(),
            price
        };
        let transfer_id = Pallet::<T>::next_transfer_id();
        let actor = ContentActor::Curator(group_id, curator_id);
    }: initialize_channel_transfer (
        RawOrigin::Signed(curator_account_id),
        channel_id,
        actor,
        transfer_params
    ) verify {
        let channel = Pallet::<T>::channel_by_id(channel_id);
        let pending_transfer = PendingTransfer {
            new_owner,
            transfer_params: TransferCommitmentParameters {
                price,
                new_collaborators: new_collaborators.try_into().unwrap(),
                transfer_id
            }
        };
        assert!(
            channel.transfer_status ==
            ChannelTransferStatus::PendingTransfer(pending_transfer.clone())
        );
        assert_last_event::<T>(
            Event::<T>::InitializedChannelTransfer(
                channel_id,
                actor,
                pending_transfer
            ).into()
        );
    }

    cancel_channel_transfer {
        let (channel_id, group_id, lead_account_id, curator_id, curator_account_id) =
            setup_worst_case_scenario_curator_channel_all_max::<T>(true)?;
        let actor = ContentActor::Curator(group_id, curator_id);
    }: _ (
        RawOrigin::Signed(curator_account_id),
        channel_id,
        actor
    ) verify {
        let channel = Pallet::<T>::channel_by_id(channel_id);
        assert!(channel.transfer_status == ChannelTransferStatus::NoActiveTransfer);
        assert_last_event::<T>(
            Event::<T>::CancelChannelTransfer(
                channel_id,
                actor,
            ).into()
        );
    }

    accept_channel_transfer {
        let a in 0 .. (T::MaxNumberOfCollaboratorsPerChannel::get() as u32);

        let (channel_id, group_id, lead_account_id, _, _) =
            setup_worst_case_scenario_curator_channel_all_max::<T>(false)?;
        let new_owner_group_id = clone_curator_group::<T>(group_id)?;
        let new_owner = ChannelOwner::CuratorGroup(new_owner_group_id);
        let new_collaborators = worst_case_scenario_collaborators::<T>(
            T::MaxNumberOfCollaboratorsPerChannel::get(), // start id
            a // number of collaborators
        );
        let price = <T as balances::Config>::Balance::one();
        working_group::Pallet::<T, ContentWorkingGroupInstance>::set_budget(
            RawOrigin::Root.into(),
            price
        )?;
        let transfer_params = InitTransferParametersOf::<T> {
            new_owner: new_owner.clone(),
            new_collaborators: new_collaborators.clone(),
            price
        };
        let transfer_id = Pallet::<T>::next_transfer_id();
        Pallet::<T>::initialize_channel_transfer(
            RawOrigin::Signed(lead_account_id.clone()).into(),
            channel_id,
            ContentActor::Lead,
            transfer_params
        )?;
        let witness = TransferCommitmentWitnessOf::<T> {
            transfer_id,
            price,
            new_collaborators
        };
    }: _ (
        RawOrigin::Signed(lead_account_id),
        channel_id,
        witness.clone()
    ) verify {
        let channel = Pallet::<T>::channel_by_id(channel_id);
        assert!(channel.transfer_status == ChannelTransferStatus::NoActiveTransfer);
        assert_eq!(channel.owner, new_owner);
        assert_last_event::<T>(
            Event::<T>::ChannelTransferAccepted(
                channel_id,
                witness
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
    fn delete_channel_assets_as_moderator() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_delete_channel_assets_as_moderator());
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
    fn delete_video_assets_as_moderator() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_delete_video_assets_as_moderator());
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

    #[test]
    fn create_curator_group() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_create_curator_group());
        });
    }

    #[test]
    fn update_curator_group_permissions() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_update_curator_group_permissions());
        });
    }

    #[test]
    fn set_curator_group_status() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_set_curator_group_status());
        })
    }

    #[test]
    fn add_curator_to_group() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_add_curator_to_group());
        })
    }

    #[test]
    fn remove_curator_from_group() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_remove_curator_from_group());
        })
    }

    #[test]
    fn initialize_channel_transfer() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_initialize_channel_transfer());
        });
    }

    #[test]
    fn cancel_channel_transfer() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_cancel_channel_transfer());
        })
    }

    #[test]
    fn accept_channel_transfer() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_accept_channel_transfer());
        })
    }
}
