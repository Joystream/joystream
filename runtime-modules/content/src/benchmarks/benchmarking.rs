#![cfg(feature = "runtime-benchmarks")]

use super::*;
use crate::permissions::*;
use crate::types::*;
use crate::{
    assert_lt,
    nft::{Nft, NftOwner, OpenAuctionParams, TransactionalStatus},
    Call, ChannelById, Config, ContentActor, Event, Module as Pallet,
};
use crate::{ContentTreasury, UpdateChannelPayoutsParameters};
use balances::Pallet as Balances;
use common::{build_merkle_path_helper, generate_merkle_root_helper, BudgetManager};
use frame_benchmarking::{benchmarks, Zero};
use frame_support::{
    storage::StorageMap,
    traits::{Currency, Get},
    IterableStorageDoubleMap, StorageDoubleMap, StorageValue,
};
use frame_system::RawOrigin;
use project_token::{
    types::*, AccountInfoByTokenAndMember, BloatBond as TokenAccountBloatBond, TokenInfoById,
};
use sp_arithmetic::traits::One;
use sp_runtime::traits::Hash;
use sp_runtime::SaturatedConversion;
use sp_std::{
    cmp::min,
    collections::{btree_map::BTreeMap, btree_set::BTreeSet},
    convert::TryInto,
    vec,
};
use storage::Module as Storage;

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
            <T as Config>::Event::from(
                Event::<T>::ChannelCreated(
                    channel_id,
                    channel,
                    params,
                    channel_acc
                )
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

        let new_meta = Some(vec![0xff].repeat(d as usize));

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
            <T as Config>::Event::from(
                Event::<T>::ChannelUpdated(
                    actor,
                    channel_id,
                    update_params,
                    new_data_object_ids
                )
            ).into()
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

        let new_meta = Some(vec![0xff].repeat(b as usize));

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
            <T as Config>::Event::from(
                Event::<T>::ChannelUpdated(
                    actor,
                    channel_id,
                    update_params,
                    BTreeSet::new()
                )
            ).into()
        );
    }

    delete_channel {

        let a in 1 .. T::MaxNumberOfAssetsPerChannel::get(); //max objs number

        let b in (T::StorageBucketsPerBagValueConstraint::get().min as u32) ..
            (T::StorageBucketsPerBagValueConstraint::get().max() as u32);

        let c in
            (T::DistributionBucketsPerBagValueConstraint::get().min as u32) ..
            (T::DistributionBucketsPerBagValueConstraint::get().max() as u32);

        let max_obj_size: u64 = T::MaxDataObjectSize::get();

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
            <T as Config>::Event::from(
                Event::<T>::ChannelDeleted(
                    actor,
                    channel_id
                )
            ).into()
        );
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
        assert_last_event::<T>(
            <T as Config>::Event::from(
                Event::<T>::CuratorGroupCreated(group_id)
            ).into()
        );
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
        assert_last_event::<T>(
            <T as Config>::Event::from(
                Event::<T>::CuratorGroupPermissionsUpdated(
                    group_id,
                    permissions_by_level
                )
            ).into()
        );
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
        assert_last_event::<T>(
            <T as Config>::Event::from(
                Event::<T>::CuratorGroupStatusSet(group_id, false)
            ).into()
        );
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
        assert_last_event::<T>(
            <T as Config>::Event::from(
                Event::<T>::CuratorAdded(group_id, curator_id, permissions)
            ).into()
        );
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
            assert_last_event::<T>(
                <T as Config>::Event::from(
                    Event::<T>::CuratorRemoved(group_id, curator_id)
                ).into()
            );
        }

    /*
    ===============================================================================================
    ============================================ VIDEOS ===========================================
    ===============================================================================================
    */
    create_video_without_nft {
        let a in 1..T::MaxNumberOfAssetsPerVideo::get();
        let b in
            (T::StorageBucketsPerBagValueConstraint::get().min as u32)
            ..(T::StorageBucketsPerBagValueConstraint::get().max() as u32);
        let c in 1..MAX_BYTES_METADATA;

        let (curator_account_id, actor, channel_id, params) = prepare_worst_case_scenario_video_creation_parameters::<T>(
            Some(a),
            b,
            None,
            c
        )?;
        let expected_video_id = Pallet::<T>::next_video_id();
        let expected_asset_ids: BTreeSet<T::DataObjectId> = (
            T::MaxNumberOfAssetsPerChannel::get().saturated_into()
            ..(T::MaxNumberOfAssetsPerChannel::get()+a).saturated_into()
        ).collect();

        set_all_channel_paused_features_except::<T>(
            channel_id,
            vec![PausableChannelFeature::VideoCreation]
        );
    }: create_video (
        RawOrigin::Signed(curator_account_id.clone()),
        actor,
        channel_id,
        params.clone()
    )
    verify {
        let video = Pallet::<T>::video_by_id(expected_video_id);
        assert_eq!(video.in_channel, channel_id);
        assert_eq!(video.nft_status, None);
        assert_eq!(BTreeSet::from(video.data_objects), expected_asset_ids);
        assert_eq!(video.video_state_bloat_bond, Pallet::<T>::video_state_bloat_bond_value());
        assert_last_event::<T>(
            <T as Config>::Event::from(
                Event::<T>::VideoCreated(
                    actor,
                    channel_id,
                    expected_video_id,
                    params,
                    expected_asset_ids
                )
            ).into()
        );
    }

    // Worst case scenario: initial state - EnglishAuction
    create_video_with_nft {
        let a in 1..T::MaxNumberOfAssetsPerVideo::get();
        let b in
            (T::StorageBucketsPerBagValueConstraint::get().min as u32)
            ..(T::StorageBucketsPerBagValueConstraint::get().max() as u32);
        let c in 2..MAX_AUCTION_WHITELIST_LENGTH;
        let d in 1..MAX_BYTES_METADATA;

        let (curator_account_id, actor, channel_id, params) = prepare_worst_case_scenario_video_creation_parameters::<T>(
            Some(a),
            b,
            Some(c),
            d
        )?;
        let expected_video_id = Pallet::<T>::next_video_id();
        let expected_asset_ids: BTreeSet<T::DataObjectId> = (
            T::MaxNumberOfAssetsPerChannel::get().saturated_into()
            ..(T::MaxNumberOfAssetsPerChannel::get()+a).saturated_into()
        ).collect();
        let expected_auction_start_block = frame_system::Pallet::<T>::block_number() + T::BlockNumber::one();

        set_all_channel_paused_features_except::<T>(
            channel_id,
            vec![PausableChannelFeature::VideoCreation, PausableChannelFeature::VideoNftIssuance]
        );
    }: create_video (
        RawOrigin::Signed(curator_account_id.clone()),
        actor,
        channel_id,
        params.clone()
    )
    verify {
        let video = Pallet::<T>::video_by_id(expected_video_id);
        let nft_params = params.auto_issue_nft.as_ref().unwrap();
        assert_eq!(video.in_channel, channel_id);
        assert_eq!(video.nft_status.as_ref().unwrap().owner, NftOwner::<T::MemberId>::Member(T::MemberId::zero()));
        assert_eq!(video.nft_status.as_ref().unwrap().creator_royalty, nft_params.royalty);
        match &video.nft_status.as_ref().unwrap().transactional_status {
            TransactionalStatus::<T>::EnglishAuction(params) => {
                assert_eq!(params.whitelist.len(), c as usize);
                assert!(params.buy_now_price.is_some());
                assert_eq!(params.start, expected_auction_start_block)
            },
            _ => panic!("Unexpected video nft transactional status")
        }

        assert_eq!(BTreeSet::from(video.data_objects), expected_asset_ids);
        assert_eq!(video.video_state_bloat_bond, Pallet::<T>::video_state_bloat_bond_value());
        assert_last_event::<T>(
            <T as Config>::Event::from(
                Event::<T>::VideoCreated(
                    actor,
                    channel_id,
                    expected_video_id,
                    params,
                    expected_asset_ids
                )
            ).into()
        );
    }

    update_video_without_assets_without_nft {
        let a in 1..MAX_BYTES_METADATA;
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            Some(T::MaxNumberOfAssetsPerVideo::get()),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
        )?;
        let params = VideoUpdateParameters::<T> {
            assets_to_upload: None,
            assets_to_remove: BTreeSet::new(),
            auto_issue_nft: None,
            expected_data_object_state_bloat_bond:
                storage::Pallet::<T>::data_object_state_bloat_bond_value(),
            new_meta: Some(vec![0xff].repeat(a as usize)),
            storage_buckets_num_witness: None
        };
        let existing_asset_ids: BTreeSet<T::DataObjectId> = (
            T::MaxNumberOfAssetsPerChannel::get().saturated_into()..
            (T::MaxNumberOfAssetsPerChannel::get() + T::MaxNumberOfAssetsPerVideo::get())
                .saturated_into()
        ).collect();

        set_all_channel_paused_features_except::<T>(
            channel_id,
            vec![PausableChannelFeature::VideoUpdate]
        );
    }: update_video (
        RawOrigin::Signed(curator_account_id.clone()),
        actor,
        video_id,
        params.clone()
    )
    verify {
        let video = Pallet::<T>::video_by_id(video_id);
        assert_eq!(BTreeSet::from(video.data_objects), existing_asset_ids);
        assert!(video.nft_status.is_none());
        assert_last_event::<T>(
            <T as Config>::Event::from(
                Event::<T>::VideoUpdated(
                    actor,
                    video_id,
                    params,
                    BTreeSet::new()
                )
            ).into()
        );
    }

    update_video_with_assets_without_nft {
        let a in 1..T::MaxNumberOfAssetsPerVideo::get();
        let b in 1..T::MaxNumberOfAssetsPerVideo::get();
        let c in
            (T::StorageBucketsPerBagValueConstraint::get().min as u32)
            ..(T::StorageBucketsPerBagValueConstraint::get().max() as u32);
        let d in 1..MAX_BYTES_METADATA;

        // As many assets as possible, but leaving room for "a" additional assets,
        // provided that "b" assets will be removed
        let num_preexisting_assets = min(
            T::MaxNumberOfAssetsPerVideo::get() - a + b,
            T::MaxNumberOfAssetsPerVideo::get()
        );
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(Some(num_preexisting_assets), c)?;

        let max_channel_assets: T::DataObjectId =
            T::MaxNumberOfAssetsPerChannel::get().saturated_into();
        let max_video_assets: T::DataObjectId =
            T::MaxNumberOfAssetsPerVideo::get().saturated_into();
        let assets_to_upload = worst_case_scenario_assets::<T>(a);
        let assets_to_remove: BTreeSet<T::DataObjectId> = (
            max_channel_assets
            ..max_channel_assets + b.saturated_into()
        ).collect();
        let params = VideoUpdateParameters::<T> {
            assets_to_upload: Some(assets_to_upload),
            assets_to_remove,
            auto_issue_nft: None,
            expected_data_object_state_bloat_bond:
                storage::Pallet::<T>::data_object_state_bloat_bond_value(),
            new_meta: Some(vec![0xff].repeat(d as usize)),
            storage_buckets_num_witness:
                Some(storage_buckets_num_witness::<T>(channel_id)).transpose()?
        };
        let expected_asset_ids: BTreeSet<T::DataObjectId> = (
            max_channel_assets + num_preexisting_assets.saturated_into()..
            max_channel_assets + num_preexisting_assets.saturated_into() + a.saturated_into()
        ).collect();

        set_all_channel_paused_features_except::<T>(
            channel_id,
            vec![PausableChannelFeature::VideoUpdate]
        );
    }: update_video (
        RawOrigin::Signed(curator_account_id.clone()),
        actor,
        video_id,
        params.clone()
    )
    verify {
        let video = Pallet::<T>::video_by_id(video_id);
        assert!(video.nft_status.is_none());
        assert_eq!(BTreeSet::from(video.data_objects), expected_asset_ids);
        assert_last_event::<T>(
            <T as Config>::Event::from(
                Event::<T>::VideoUpdated(
                    actor,
                    video_id,
                    params,
                    expected_asset_ids
                )
            ).into()
        );
    }

    update_video_without_assets_with_nft {
        let a in 2..MAX_AUCTION_WHITELIST_LENGTH;
        let b in 1..MAX_BYTES_METADATA;

        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            Some(T::MaxNumberOfAssetsPerVideo::get()),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
        )?;
        let params = VideoUpdateParameters::<T> {
            assets_to_upload: None,
            assets_to_remove: BTreeSet::new(),
            auto_issue_nft: Some(worst_case_scenario_video_nft_issuance_params::<T>(a)),
            expected_data_object_state_bloat_bond:
                storage::Pallet::<T>::data_object_state_bloat_bond_value(),
            new_meta: Some(vec![0xff].repeat(b as usize)),
            storage_buckets_num_witness: None
        };
        let existing_asset_ids: BTreeSet<T::DataObjectId> = (
            T::MaxNumberOfAssetsPerChannel::get().saturated_into()..
            (T::MaxNumberOfAssetsPerChannel::get() + T::MaxNumberOfAssetsPerVideo::get())
                .saturated_into()
        ).collect();
        let expected_auction_start_block = frame_system::Pallet::<T>::block_number() + T::BlockNumber::one();

        set_all_channel_paused_features_except::<T>(
            channel_id,
            vec![PausableChannelFeature::VideoUpdate, PausableChannelFeature::VideoNftIssuance]
        );
    }: update_video (
        RawOrigin::Signed(curator_account_id.clone()),
        actor,
        video_id,
        params.clone()
    )
    verify {
        let video = Pallet::<T>::video_by_id(video_id);
        assert_eq!(BTreeSet::from(video.data_objects), existing_asset_ids);
        let nft_params = params.auto_issue_nft.as_ref().unwrap();
        assert_eq!(video.nft_status.as_ref().unwrap().owner, NftOwner::<T::MemberId>::Member(T::MemberId::zero()));
        assert_eq!(video.nft_status.as_ref().unwrap().creator_royalty, nft_params.royalty);
        match &video.nft_status.as_ref().unwrap().transactional_status {
            TransactionalStatus::<T>::EnglishAuction(params) => {
                assert_eq!(params.whitelist.len(), a as usize);
                assert!(params.buy_now_price.is_some());
                assert_eq!(params.start, expected_auction_start_block)
            },
            _ => panic!("Unexpected video nft transactional status")
        }
        assert_last_event::<T>(
            <T as Config>::Event::from(
                Event::<T>::VideoUpdated(
                    actor,
                    video_id,
                    params,
                    BTreeSet::new()
                )
            ).into()
        );
    }

    update_video_with_assets_with_nft {
        let a in 1..T::MaxNumberOfAssetsPerVideo::get();
        let b in 1..T::MaxNumberOfAssetsPerVideo::get();
        let c in
            (T::StorageBucketsPerBagValueConstraint::get().min as u32)
            ..(T::StorageBucketsPerBagValueConstraint::get().max() as u32);
        let d in 2..MAX_AUCTION_WHITELIST_LENGTH;
        let e in 1..MAX_BYTES_METADATA;

        // As many assets as possible, but leaving room for "a" additional assets,
        // provided that "b" assets will be removed
        let num_preexisting_assets = min(
            T::MaxNumberOfAssetsPerVideo::get() - a + b,
            T::MaxNumberOfAssetsPerVideo::get()
        );
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(Some(num_preexisting_assets), c)?;

        let max_channel_assets: T::DataObjectId =
            T::MaxNumberOfAssetsPerChannel::get().saturated_into();
        let max_video_assets: T::DataObjectId =
            T::MaxNumberOfAssetsPerVideo::get().saturated_into();
        let assets_to_upload = worst_case_scenario_assets::<T>(a);
        let assets_to_remove: BTreeSet<T::DataObjectId> = (
            max_channel_assets
            ..max_channel_assets + b.saturated_into()
        ).collect();
        let params = VideoUpdateParameters::<T> {
            assets_to_upload: Some(assets_to_upload),
            assets_to_remove,
            auto_issue_nft: Some(worst_case_scenario_video_nft_issuance_params::<T>(d)),
            expected_data_object_state_bloat_bond:
                storage::Pallet::<T>::data_object_state_bloat_bond_value(),
            new_meta: Some(vec![0xff].repeat(e as usize)),
            storage_buckets_num_witness:
                Some(storage_buckets_num_witness::<T>(channel_id)).transpose()?
        };
        let expected_asset_ids: BTreeSet<T::DataObjectId> = (
            max_channel_assets + num_preexisting_assets.saturated_into()..
            max_channel_assets + num_preexisting_assets.saturated_into() + a.saturated_into()
        ).collect();
        let expected_auction_start_block = frame_system::Pallet::<T>::block_number() + T::BlockNumber::one();

        set_all_channel_paused_features_except::<T>(
            channel_id,
            vec![PausableChannelFeature::VideoUpdate, PausableChannelFeature::VideoNftIssuance]
        );
    }: update_video (
        RawOrigin::Signed(curator_account_id.clone()),
        actor,
        video_id,
        params.clone()
    )
    verify {
        let video = Pallet::<T>::video_by_id(video_id);
        assert_eq!(BTreeSet::from(video.data_objects), expected_asset_ids);
        let nft_params = params.auto_issue_nft.as_ref().unwrap();
        assert_eq!(video.nft_status.as_ref().unwrap().owner, NftOwner::<T::MemberId>::Member(T::MemberId::zero()));
        assert_eq!(video.nft_status.as_ref().unwrap().creator_royalty, nft_params.royalty);
        match &video.nft_status.as_ref().unwrap().transactional_status {
            TransactionalStatus::<T>::EnglishAuction(params) => {
                assert_eq!(params.whitelist.len(), d as usize);
                assert!(params.buy_now_price.is_some());
                assert_eq!(params.start, expected_auction_start_block)
            },
            _ => panic!("Unexpected video nft transactional status")
        }
        assert_last_event::<T>(
            <T as Config>::Event::from(
                Event::<T>::VideoUpdated(
                    actor,
                    video_id,
                    params,
                    expected_asset_ids
                )
            ).into()
        );
    }

    delete_video_without_assets {
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            None,
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
        )?;
    }: delete_video (
        RawOrigin::Signed(curator_account_id.clone()),
        actor,
        video_id,
        0,
        None
    ) verify {
        assert!(Pallet::<T>::ensure_video_exists(&video_id).is_err());
        assert_last_event::<T>(
            <T as Config>::Event::from(
                Event::<T>::VideoDeleted(
                    actor,
                    video_id
                )
            ).into()
        );
    }

    delete_video_with_assets {
        let a in 1..T::MaxNumberOfAssetsPerVideo::get();
        let b in
            (T::StorageBucketsPerBagValueConstraint::get().min as u32)
            ..(T::StorageBucketsPerBagValueConstraint::get().max() as u32);
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(Some(a), b)?;
        let witness = storage_buckets_num_witness::<T>(channel_id)?;
    }: delete_video (
        RawOrigin::Signed(curator_account_id.clone()),
        actor,
        video_id,
        a as u64,
        Some(witness)
    ) verify {
        assert!(Pallet::<T>::ensure_video_exists(&video_id).is_err());
        assert_last_event::<T>(
            <T as Config>::Event::from(
                Event::<T>::VideoDeleted(
                    actor,
                    video_id
                )
            ).into()
        );
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
            <T as Config>::Event::from(
                Event::<T>::InitializedChannelTransfer(
                    channel_id,
                    actor,
                    pending_transfer
                )
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
            <T as Config>::Event::from(
                Event::<T>::CancelChannelTransfer(
                    channel_id,
                    actor,
                )
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
            <T as Config>::Event::from(
                Event::<T>::ChannelTransferAccepted(
                    channel_id,
                    witness
                )
            ).into()
        );
    }

    /*
    ===============================================================================================
    ======================================= CREATOR TOKENS ========================================
    ===============================================================================================
    */

    issue_creator_token {
        let a in 1 .. MAX_CRT_INITIAL_ALLOCATION_MEMBERS;

        let (channel_id, group_id, lead_acc_id, curator_id, curator_acc_id) =
            setup_worst_case_scenario_curator_channel_all_max::<T>(false)?;
        let params = create_token_issuance_params::<T>(worst_case_scenario_initial_allocation::<T>(a));
        let actor = ContentActor::Curator(group_id, curator_id);
        set_all_channel_paused_features_except::<T>(channel_id, vec![PausableChannelFeature::CreatorTokenIssuance]);
    }: _ (
        RawOrigin::Signed(curator_acc_id),
        actor,
        channel_id,
        params.clone()
    )
    verify {
        let execution_block = frame_system::Pallet::<T>::block_number();
        let channel = ChannelById::<T>::get(channel_id);
        assert!(channel.creator_token_id.is_some());
        let token_id = channel.creator_token_id.unwrap();
        let token = project_token::Module::<T>::token_info_by_id(token_id);
        assert_eq!(token, TokenDataOf::<T> {
            total_supply: (100u32 * a).into(),
            tokens_issued: (100u32 * a).into(),
            next_sale_id: 0,
            sale: None,
            transfer_policy: params.transfer_policy.into(),
            symbol: params.symbol,
            patronage_info: PatronageData::<TokenBalanceOf<T>, T::BlockNumber> {
                rate: BlockRate::from_yearly_rate(params.patronage_rate, T::BlocksPerYear::get()),
                unclaimed_patronage_tally_amount: Zero::zero(),
                last_unclaimed_patronage_tally_block: execution_block
            },
            accounts_number: a as u64,
            revenue_split_rate: params.revenue_split_rate,
            revenue_split: RevenueSplitStateOf::<T>::Inactive,
            next_revenue_split_id: 0
        });
        assert_last_event::<T>(
            <T as Config>::Event::from(
                Event::<T>::CreatorTokenIssued(
                    actor,
                    channel_id,
                    token_id
                )
            ).into()
        );
    }

    creator_token_issuer_transfer {
        let a in 1 .. MAX_CRT_ISSUER_TRANSFER_OUTPUTS;
        let b in 1 .. MAX_BYTES_METADATA;

        let (channel_id, group_id, lead_acc_id, curator_id, curator_acc_id) =
            setup_worst_case_scenario_curator_channel_all_max::<T>(false)?;
        let curator_member_id = curator_member_id::<T>(curator_id);
        let origin = RawOrigin::Signed(curator_acc_id.clone());
        let actor = ContentActor::Curator(group_id, curator_id);
        let token_id =
            issue_creator_token_with_worst_case_scenario_owner::<T>(
                curator_acc_id.clone(),
                actor,
                channel_id,
                curator_member_id
            )?;

        let outputs = worst_case_scenario_issuer_transfer_outputs::<T>(a);
        let balance_pre = balances::Pallet::<T>::usable_balance(&curator_acc_id);
        let metadata = vec![0xf].repeat(b as usize);
        TokenAccountBloatBond::<T>::set(100u32.into());
        // No pausable feature prevents this
        set_all_channel_paused_features::<T>(channel_id);
    }: _ (
        origin, actor, channel_id, outputs.clone(), metadata.clone()
    )
    verify {
        let block_number = frame_system::Pallet::<T>::block_number();
        let balance_post = balances::Pallet::<T>::usable_balance(&curator_acc_id);
        // Ensure bloat bond total amount transferred
        assert_eq!(balance_post, balance_pre - (100u32 * a).into());
        for (member_id, acc_data) in AccountInfoByTokenAndMember::<T>::iter_prefix(token_id) {
            if member_id == curator_member_id {
                assert_eq!(
                    acc_data.transferrable::<T>(block_number),
                    (DEFAULT_CRT_OWNER_ISSUANCE - 100u32 * a).into()
                );
                assert_eq!(
                    acc_data.vesting_schedules.len(),
                    T::MaxVestingSchedulesPerAccountPerToken::get() as usize
                );
                assert!(acc_data.split_staking_status.is_some());
            } else {
                assert_eq!(acc_data.amount, 100u32.into());
                assert_eq!(acc_data.vesting_schedules.len(), 1);
            }
        }
        // Check event emitted
        assert_last_event::<T>(
            <T as project_token::Config>::Event::from(
                project_token::Event::<T>::TokenAmountTransferredByIssuer(
                    token_id,
                    curator_member_id,
                    Transfers(outputs.0
                        .iter()
                        .map(|(member_id, payment)|
                            (Validated::NonExisting(*member_id), payment.clone().into())
                        ).collect()
                    ),
                    metadata
                )
            ).into()
        );
    }

    make_creator_token_permissionless {
        let (channel_id, group_id, lead_acc_id, curator_id, curator_acc_id) =
            setup_worst_case_scenario_curator_channel_all_max::<T>(false)?;
        let curator_member_id = curator_member_id::<T>(curator_id);
        let origin = RawOrigin::Signed(curator_acc_id.clone());
        let actor = ContentActor::Curator(group_id, curator_id);
        let token_id =
            issue_creator_token_with_worst_case_scenario_owner::<T>(
                curator_acc_id,
                actor,
                channel_id,
                curator_member_id
            )?;
        // No pausable feature prevents this
        set_all_channel_paused_features::<T>(channel_id);
    }: _ (
        origin, actor, channel_id
    )
    verify {
        assert!(TokenInfoById::<T>::contains_key(token_id));
        let token = project_token::Pallet::<T>::token_info_by_id(token_id);
        assert_eq!(token.transfer_policy, TransferPolicy::Permissionless);
        // Check event emitted
        assert_last_event::<T>(
            <T as project_token::Config>::Event::from(
                project_token::Event::<T>::TransferPolicyChangedToPermissionless(
                    token_id
                )
            ).into()
        );
    }

    deissue_creator_token {
        let (channel_id, group_id, lead_acc_id, curator_id, curator_acc_id) =
            setup_worst_case_scenario_curator_channel_all_max::<T>(false)?;
        let curator_member_id = curator_member_id::<T>(curator_id);
        let origin = RawOrigin::Signed(curator_acc_id);
        let actor = ContentActor::Curator(group_id, curator_id);
        let token_params = create_token_issuance_params::<T>(BTreeMap::new());
        let token_id = project_token::Pallet::<T>::next_token_id();
        Pallet::<T>::issue_creator_token(origin.clone().into(), actor, channel_id, token_params)?;
        // No pausable feature prevents this
        set_all_channel_paused_features::<T>(channel_id);
    }: _ (
        origin, actor, channel_id
    )
    verify {
        assert!(!TokenInfoById::<T>::contains_key(token_id));
        let channel = ChannelById::<T>::get(channel_id);
        assert_eq!(channel.creator_token_id, None);
        // Check event emitted
        assert_last_event::<T>(
            <T as project_token::Config>::Event::from(
                project_token::Event::<T>::TokenDeissued(token_id)
            ).into()
        );
    }

    init_creator_token_sale {
        let a in 1 .. MAX_BYTES_METADATA;

        let (channel_id, group_id, lead_acc_id, curator_id, curator_acc_id) =
            setup_worst_case_scenario_curator_channel_all_max::<T>(false)?;
        let curator_member_id = curator_member_id::<T>(curator_id);
        let origin = RawOrigin::Signed(curator_acc_id.clone());
        let actor = ContentActor::Curator(group_id, curator_id);
        let token_id =
            issue_creator_token_with_worst_case_scenario_owner::<T>(
                curator_acc_id,
                actor,
                channel_id,
                curator_member_id
            )?;
        let params = worst_case_scenario_token_sale_params::<T>(a, None);
        // No pausable feature prevents this
        set_all_channel_paused_features::<T>(channel_id);
    }: _ (
        origin, actor, channel_id, params
    )
    verify {
        let start_block = frame_system::Pallet::<T>::block_number();
        let token = project_token::Module::<T>::token_info_by_id(token_id);
        // Verify token sale data
        assert_eq!(token.sale, Some(TokenSale {
            auto_finalize: false,
            cap_per_member: Some(DEFAULT_CRT_SALE_CAP_PER_MEMBER.into()),
            duration: DEFAULT_CRT_SALE_DURATION.into(),
            earnings_destination: None,
            funds_collected: JoyBalanceOf::<T>::zero(),
            quantity_left: DEFAULT_CRT_SALE_UPPER_BOUND.into(),
            start_block,
            tokens_source: curator_member_id,
            unit_price: DEFAULT_CRT_SALE_PRICE.into(),
            vesting_schedule_params: Some(default_vesting_schedule_params::<T>())
        }));
        // Verify that owner has max amount of locks possible
        let owner_acc_data = project_token::Module::<T>::account_info_by_token_and_member(token_id, curator_member_id);
        assert_eq!(
            owner_acc_data.vesting_schedules.len(),
            T::MaxVestingSchedulesPerAccountPerToken::get() as usize
        );
        assert!(owner_acc_data.split_staking_status.is_some());
        // Check event emitted
        assert_last_event::<T>(
            <T as project_token::Config>::Event::from(
                project_token::Event::<T>::TokenSaleInitialized(
                    token_id,
                    token.next_sale_id - 1,
                    token.sale.unwrap(),
                    Some(vec![0xf].repeat(a as usize))
                )
            ).into()
        );
    }

    update_upcoming_creator_token_sale {
        let (channel_id, group_id, lead_acc_id, curator_id, curator_acc_id) =
            setup_worst_case_scenario_curator_channel_all_max::<T>(false)?;
        let curator_member_id = curator_member_id::<T>(curator_id);
        let origin = RawOrigin::Signed(curator_acc_id.clone());
        let actor = ContentActor::Curator(group_id, curator_id);
        let token_id =
            issue_creator_token_with_worst_case_scenario_owner::<T>(
                curator_acc_id,
                actor,
                channel_id,
                curator_member_id
            )?;
        let sale_params =
            worst_case_scenario_token_sale_params::<T>(MAX_BYTES_METADATA, Some(100u32.into()));
        Pallet::<T>::init_creator_token_sale(
            origin.clone().into(),
            actor,
            channel_id,
            sale_params
        )?;
        let new_start_block: Option<T::BlockNumber> = Some(200u32.into());
        let new_duration: Option<T::BlockNumber> = Some(200u32.into());
        // No pausable feature prevents this
        set_all_channel_paused_features::<T>(channel_id);
    }: _(origin, actor, channel_id, new_start_block, new_duration)
    verify {
        assert!(TokenInfoById::<T>::contains_key(token_id));
        let token = project_token::Pallet::<T>::token_info_by_id(token_id);
        let sale_id = token.next_sale_id - 1;
        assert_eq!(token.sale.as_ref().unwrap().start_block, new_start_block.unwrap());
        assert_eq!(token.sale.as_ref().unwrap().duration, new_duration.unwrap());
        // Check event emitted
        assert_last_event::<T>(
            <T as project_token::Config>::Event::from(
                project_token::Event::<T>::UpcomingTokenSaleUpdated(
                    token_id,
                    sale_id,
                    new_start_block,
                    new_duration
                )
            ).into()
        );
    }

    finalize_creator_token_sale {
        let (channel_id, group_id, lead_acc_id, curator_id, curator_acc_id) =
        setup_worst_case_scenario_curator_channel_all_max::<T>(false)?;
        let curator_member_id = curator_member_id::<T>(curator_id);
        let origin = RawOrigin::Signed(curator_acc_id.clone());
        let actor = ContentActor::Curator(group_id, curator_id);
        let token_id =
            issue_creator_token_with_worst_case_scenario_owner::<T>(
                curator_acc_id.clone(),
                actor,
                channel_id,
                curator_member_id
            )?;
        let sale_params =
            worst_case_scenario_token_sale_params::<T>(MAX_BYTES_METADATA, None);
        Pallet::<T>::init_creator_token_sale(
            origin.clone().into(),
            actor,
            channel_id,
            sale_params
        )?;
        let tokens_sold: TokenBalanceOf<T> = 1u32.into();
        let funds_collected = JoyBalanceOf::<T>::from(DEFAULT_CRT_SALE_PRICE) * tokens_sold.into();
        let _ = balances::Pallet::<T>::deposit_creating(&curator_acc_id, funds_collected);
        project_token::Pallet::<T>::purchase_tokens_on_sale(
            origin.clone().into(),
            token_id,
            curator_member_id,
            tokens_sold
        )?;
        let council_budget_pre = T::CouncilBudgetManager::get_budget();
        fastforward_by_blocks::<T>(DEFAULT_CRT_SALE_DURATION.into());
        // No pausable feature prevents this
        set_all_channel_paused_features::<T>(channel_id);
    }: _(origin, actor, channel_id)
    verify {
        assert!(TokenInfoById::<T>::contains_key(token_id));
        let token = project_token::Pallet::<T>::token_info_by_id(token_id);
        assert!(token.sale.is_none());
        let sale_id = token.next_sale_id - 1;
        // Make sure council budget was increased
        let council_budget_post = T::CouncilBudgetManager::get_budget();
        assert_eq!(council_budget_post, council_budget_pre + funds_collected);
        // Check event emitted
        assert_last_event::<T>(
            <T as project_token::Config>::Event::from(
                project_token::Event::<T>::TokenSaleFinalized(
                    token_id,
                    sale_id,
                    TokenBalanceOf::<T>::from(DEFAULT_CRT_SALE_UPPER_BOUND) - tokens_sold,
                    funds_collected
                )
            ).into()
        );
    }

    issue_revenue_split {
        let (channel_id, group_id, lead_acc_id, curator_id, curator_acc_id) =
            setup_worst_case_scenario_curator_channel_all_max::<T>(false)?;
        let curator_member_id = curator_member_id::<T>(curator_id);
        let origin = RawOrigin::Signed(curator_acc_id.clone());
        let actor = ContentActor::Curator(group_id, curator_id);
        let token_id =
            issue_creator_token_with_worst_case_scenario_owner::<T>(
                curator_acc_id,
                actor,
                channel_id,
                curator_member_id
            )?;
        let start: T::BlockNumber = frame_system::Pallet::<T>::block_number()
            + project_token::Pallet::<T>::min_revenue_split_time_to_start();
        let duration: T::BlockNumber = project_token::Pallet::<T>::min_revenue_split_duration();
        let channel_acc = ContentTreasury::<T>::account_for_channel(channel_id);
        let reward_amount = 1_000_000u32.into();
        let _ = balances::Pallet::<T>::deposit_creating(
            &channel_acc,
            // TODO: Existential deposit should not be needed after https://github.com/Joystream/joystream/issues/4033
            T::JoyExistentialDeposit::get() + reward_amount
        );
        let council_budget_pre = T::CouncilBudgetManager::get_budget();
        // No pausable feature prevents this
        set_all_channel_paused_features::<T>(channel_id);
    }: _(origin, actor, channel_id, Some(start), duration)
    verify {
        let allocation = DEFAULT_CRT_REVENUE_SPLIT_RATE * reward_amount;
        let withdrawn = reward_amount - allocation;
        assert!(TokenInfoById::<T>::contains_key(token_id));
        let token = project_token::Pallet::<T>::token_info_by_id(token_id);
        assert_eq!(token.revenue_split, RevenueSplitStateOf::<T>::Active(RevenueSplitInfo {
            allocation,
            timeline: TimelineOf::<T> { start, duration },
            dividends_claimed: JoyBalanceOf::<T>::zero()
        }));
        // Make sure council budget was increased
        let council_budget_post = T::CouncilBudgetManager::get_budget();
        assert_eq!(council_budget_post, council_budget_pre + withdrawn);
        // Check event emitted
        assert_past_event::<T>(
            <T as project_token::Config>::Event::from(
                project_token::Event::<T>::RevenueSplitIssued(
                    token_id,
                    start,
                    duration,
                    allocation
                ),
            ).into(),
            1 // expected events:
            // project_token::RevenueSplitIssued
            // balances::Slashed
        );
    }

    issue_revenue_split_as_collaborator {
        let (channel_id, owner_member_id, owner_acc, lead_account_id) =
            setup_worst_case_scenario_member_channel_all_max::<T>(false)?;
        let collaborator_member_id: T::MemberId = COLABORATOR_IDS[0].saturated_into();
        let collaborator_account_id = T::AccountId::create_account_id(COLABORATOR_IDS[0]);
        let origin = RawOrigin::Signed(collaborator_account_id.clone());
        let actor = ContentActor::Member(collaborator_member_id);
        let token_id =
            issue_creator_token_with_worst_case_scenario_owner::<T>(
                collaborator_account_id,
                actor,
                channel_id,
                collaborator_member_id
            )?;
        let start: T::BlockNumber = frame_system::Pallet::<T>::block_number()
            + project_token::Pallet::<T>::min_revenue_split_time_to_start();
        let duration: T::BlockNumber = project_token::Pallet::<T>::min_revenue_split_duration();
        let channel_acc = ContentTreasury::<T>::account_for_channel(channel_id);
        let reward_amount = 1_000_000u32.into();
        let _ = balances::Pallet::<T>::deposit_creating(
            &channel_acc,
            // TODO: Existential deposit should not be needed after https://github.com/Joystream/joystream/issues/4033
            T::JoyExistentialDeposit::get() + reward_amount
        );
        let owner_acc_balance_pre = balances::Pallet::<T>::usable_balance(owner_acc.clone());
        // No pausable feature prevents this
        set_all_channel_paused_features::<T>(channel_id);
    }: issue_revenue_split(origin, actor, channel_id, Some(start), duration)
    verify {
        let allocation = DEFAULT_CRT_REVENUE_SPLIT_RATE * reward_amount;
        let withdrawn = reward_amount - allocation;
        assert!(TokenInfoById::<T>::contains_key(token_id));
        let token = project_token::Pallet::<T>::token_info_by_id(token_id);
        assert_eq!(token.revenue_split, RevenueSplitStateOf::<T>::Active(RevenueSplitInfo {
            allocation,
            timeline: TimelineOf::<T> { start, duration },
            dividends_claimed: JoyBalanceOf::<T>::zero()
        }));
        // Make sure channel owner's balances was increased
        let owner_acc_balance_post = balances::Pallet::<T>::usable_balance(owner_acc);
        assert_eq!(owner_acc_balance_post, owner_acc_balance_pre + withdrawn);
        // Check event emitted
        assert_past_event::<T>(
            <T as project_token::Config>::Event::from(
                project_token::Event::<T>::RevenueSplitIssued(
                    token_id,
                    start,
                    duration,
                    allocation
                )
            ).into(),
            1 // expected events:
            // project_token::RevenueSplitIssued
            // balances::Transfer
        );
    }

    finalize_revenue_split {
        let (channel_id, group_id, lead_acc_id, curator_id, curator_acc_id) =
            setup_worst_case_scenario_curator_channel_all_max::<T>(false)?;
        let curator_member_id = curator_member_id::<T>(curator_id);
        let origin = RawOrigin::Signed(curator_acc_id.clone());
        let actor = ContentActor::Curator(group_id, curator_id);
        let token_id =
            issue_creator_token_with_worst_case_scenario_owner::<T>(
                curator_acc_id.clone(),
                actor,
                channel_id,
                curator_member_id
            )?;
        let channel_acc = ContentTreasury::<T>::account_for_channel(channel_id);
        let reward_amount = 1_000_000u32.into();
        let _ = balances::Pallet::<T>::deposit_creating(
            &channel_acc,
            // TODO: Existential deposit should not be needed after https://github.com/Joystream/joystream/issues/4033
            T::JoyExistentialDeposit::get() + reward_amount
        );
        let duration: T::BlockNumber = 100u32.into();
        Pallet::<T>::issue_revenue_split(
            origin.clone().into(),
            actor,
            channel_id,
            None,
            duration
        )?;
        fastforward_by_blocks::<T>(project_token::Pallet::<T>::min_revenue_split_duration());
        // Remove the default token owner stake
        project_token::AccountInfoByTokenAndMember::<T>::mutate(token_id, curator_member_id, |acc| {
            acc.unstake();
        });
        // Participate in split
        let curator_balance_pre = balances::Pallet::<T>::usable_balance(curator_acc_id.clone());
        project_token::Pallet::<T>::participate_in_split(
            origin.clone().into(),
            token_id,
            curator_member_id,
            (DEFAULT_CRT_OWNER_ISSUANCE / 2).into()
        )?;
        let curator_balance_post = balances::Pallet::<T>::usable_balance(curator_acc_id);
        let token = project_token::Pallet::<T>::token_info_by_id(token_id);
        let allocation = DEFAULT_CRT_REVENUE_SPLIT_RATE * reward_amount;
        let dividends_paid = allocation / 2u32.into();
        let leftovers = allocation - dividends_paid;
        // Make sure dividend paid to curator and split data equals to expected values
        assert_eq!(curator_balance_post, curator_balance_pre + dividends_paid);
        match token.revenue_split {
            RevenueSplitStateOf::<T>::Active(info) => {
                assert_eq!(info.allocation, allocation);
                assert_eq!(info.leftovers(), leftovers);
                assert_eq!(info.dividends_claimed, dividends_paid);
            },
            _ => panic!("Invalid split status!")
        };
        fastforward_by_blocks::<T>(duration);
        let channel_balance_pre = balances::Pallet::<T>::usable_balance(channel_acc.clone());
        // No pausable feature prevents this
        set_all_channel_paused_features::<T>(channel_id);
    }: _(origin, actor, channel_id)
    verify {
        assert!(TokenInfoById::<T>::contains_key(token_id));
        let token = project_token::Pallet::<T>::token_info_by_id(token_id);
        assert_eq!(token.revenue_split, RevenueSplitStateOf::<T>::Inactive);
        // Make sure leftovers sent to channel acc
        let channel_balance_post = balances::Pallet::<T>::usable_balance(channel_acc.clone());
        assert_eq!(channel_balance_post, channel_balance_pre + leftovers);
        // Check event emitted
        assert_last_event::<T>(
            <T as project_token::Config>::Event::from(
                project_token::Event::<T>::RevenueSplitFinalized(
                    token_id,
                    channel_acc,
                    leftovers
                ),
            ).into(),
        );
    }

    reduce_creator_token_patronage_rate_to {
        let (channel_id, group_id, lead_acc_id, curator_id, curator_acc_id) =
            setup_worst_case_scenario_curator_channel_all_max::<T>(false)?;
        let curator_member_id = curator_member_id::<T>(curator_id);
        let origin = RawOrigin::Signed(curator_acc_id.clone());
        let actor = ContentActor::Curator(group_id, curator_id);
        let token_id =
            issue_creator_token_with_worst_case_scenario_owner::<T>(
                curator_acc_id,
                actor,
                channel_id,
                curator_member_id
            )?;
        let target_rate = YearlyRate(DEFAULT_CRT_PATRONAGE_RATE.0 / 2);
        fastforward_by_blocks::<T>(T::BlocksPerYear::get().into());
        let expected_unclaimed_tally: TokenBalanceOf<T> =
            (DEFAULT_CRT_PATRONAGE_RATE.0.mul_floor(DEFAULT_CRT_OWNER_ISSUANCE)).into();
        // No pausable feature prevents this
        set_all_channel_paused_features::<T>(channel_id);
    }: _(origin, actor, channel_id, target_rate)
    verify {
        let current_block = frame_system::Pallet::<T>::block_number();
        let new_block_rate = BlockRate::from_yearly_rate(target_rate, T::BlocksPerYear::get());
        assert!(TokenInfoById::<T>::contains_key(token_id));
        let token = project_token::Pallet::<T>::token_info_by_id(token_id);
        assert_eq!(token.patronage_info.rate, new_block_rate);
        assert_eq!(token.patronage_info.last_unclaimed_patronage_tally_block, current_block);
        assert_lt!(
            expected_unclaimed_tally - token.patronage_info.unclaimed_patronage_tally_amount,
            // We use 0,0001% deficiency margin because of possible conversion errors
            TokenBalanceOf::<T>::from(DEFAULT_CRT_OWNER_ISSUANCE / 1_000_000)
        );
        // Check event emitted
        assert_last_event::<T>(
            <T as project_token::Config>::Event::from(
                project_token::Event::<T>::PatronageRateDecreasedTo(
                    token_id,
                    new_block_rate.to_yearly_rate_representation(T::BlocksPerYear::get())
                ),
            ).into(),
        );
    }

    claim_creator_token_patronage_credit {
        let (channel_id, owner_member_id, owner_acc, lead_account_id) =
            setup_worst_case_scenario_member_channel_all_max::<T>(false)?;

        let collaborator_member_id: T::MemberId = COLABORATOR_IDS[0].saturated_into();
        let collaborator_account_id = T::AccountId::create_account_id(COLABORATOR_IDS[0]);
        let origin = RawOrigin::Signed(collaborator_account_id.clone());
        let actor = ContentActor::Member(collaborator_member_id);
        let token_id =
            issue_creator_token_with_worst_case_scenario_owner::<T>(
                collaborator_account_id,
                actor,
                channel_id,
                collaborator_member_id
            )?;
        fastforward_by_blocks::<T>(T::BlocksPerYear::get().into());
        let collab_crt_balance_pre =
            transferrable_crt_balance::<T>(token_id, collaborator_member_id);
        let expected_claim: TokenBalanceOf<T> =
            (DEFAULT_CRT_PATRONAGE_RATE.0.mul_floor(DEFAULT_CRT_OWNER_ISSUANCE)).into();
        // No pausable feature prevents this
        set_all_channel_paused_features::<T>(channel_id);
    }: _(origin, actor, channel_id)
    verify {
        assert!(TokenInfoById::<T>::contains_key(token_id));
        let token = project_token::Pallet::<T>::token_info_by_id(token_id);
        // Deficiency margin of 0.0001%, because of possible conversion/rounding errors
        let deficiency_margin: TokenBalanceOf<T> = (DEFAULT_CRT_OWNER_ISSUANCE / 1_000_000).into();
        assert_lt!(expected_claim + DEFAULT_CRT_OWNER_ISSUANCE.into() - token.tokens_issued, deficiency_margin);
        assert_eq!(token.tokens_issued, token.total_supply);
        // Make sure collaborator's CRT balance was increased
        let collab_crt_balance_post =
            transferrable_crt_balance::<T>(token_id, collaborator_member_id);
        let actually_claimed = collab_crt_balance_post - collab_crt_balance_pre;
        assert_lt!(expected_claim - actually_claimed, deficiency_margin);
        // Check event emitted
        assert_last_event::<T>(
            <T as project_token::Config>::Event::from(
                project_token::Event::<T>::PatronageCreditClaimed(
                    token_id,
                    actually_claimed,
                    collaborator_member_id
                )
            ).into(),
        );
    }

    // ================================================================================
    // ======================== CHANNEL PAYOUTS & WITHDRAWALS =========================
    // ================================================================================

    // WORST CASE SCENARIO:
    // STATE COMPLEXITY
    // - curator owned channel
    // - curator number is max
    // - curator has max number of permissions
    // - channel has all features paused except necessary ones
    // - channel has max assets
    // INPUT COMPLEXITY
    // - `payload` fields `Some(..)` in order to maximize the number of storage mutation performed
    update_channel_payouts {
        let origin = RawOrigin::Root;
        let (account_id, _) = member_funded_account::<T>(1);
        let hash = <<T as frame_system::Config>::Hashing as Hash>::hash(&"test".encode());
        let params = UpdateChannelPayoutsParameters::<T> {
            commitment: Some(hash),
                        payload: Some(ChannelPayoutsPayloadParameters::<T>{
                uploader_account: account_id,
                object_creation_params: storage::DataObjectCreationParameters {
                    size: 1u64,
                    ipfs_content_id: 1u32.to_be_bytes().as_slice().to_vec(),
                },
                expected_data_object_state_bloat_bond: Storage::<T>::data_object_state_bloat_bond_value(),
                expected_data_size_fee: Storage::<T>::data_object_per_mega_byte_fee(),
            }),
            min_cashout_allowed: Some(<T as balances::Config>::Balance::one()),
            max_cashout_allowed: Some(<T as balances::Config>::Balance::from(1_000_000u32)),
            channel_cashouts_enabled: Some(true),
        };
    }: _ (origin, params)
        verify {
            assert_eq!(
                Pallet::<T>::commitment(),
                hash,
            );
        }

    // WORST CASE SCENARIO:
    // - curator channel belonging to a group with max number curator and max curator permissions
    // - channel has all feature paused except the necessary for the extr. to succeed to maximize permission validation complexity
    withdraw_from_curator_channel_balance {
        let (channel_id, group_id, lead_account_id, _, _) =
            setup_worst_case_scenario_curator_channel_all_max::<T>(false)?;
        let origin= RawOrigin::Signed(lead_account_id.clone());

        set_all_channel_paused_features_except::<T>(channel_id, vec![PausableChannelFeature::ChannelFundsTransfer]);

        let amount = <T as balances::Config>::Balance::from(100u32);
        let _ = Balances::<T>::deposit_creating(
            &ContentTreasury::<T>::account_for_channel(channel_id),
            amount + T::ExistentialDeposit::get(),
        );

        let actor = ContentActor::Lead;
        let origin = RawOrigin::Signed(lead_account_id);
    }: withdraw_from_channel_balance(origin, actor, channel_id, amount)
        verify {
            assert_eq!(
                T::CouncilBudgetManager::get_budget(),
                amount,
            );

            assert_eq!(
                Balances::<T>::usable_balance(ContentTreasury::<T>::account_for_channel(channel_id)),
                T::ExistentialDeposit::get(),
            );
        }

    withdraw_from_member_channel_balance {
        let (channel_id, member_id, member_account_id, lead_account_id) =
            setup_worst_case_scenario_member_channel::<T>(
                T::MaxNumberOfAssetsPerChannel::get(),
                T::StorageBucketsPerBagValueConstraint::get().min as u32,
                T::DistributionBucketsPerBagValueConstraint::get().min as u32,
                false,
            ).unwrap();

        let lead_origin = RawOrigin::Signed(lead_account_id);

        set_all_channel_paused_features_except::<T>(channel_id, vec![PausableChannelFeature::ChannelFundsTransfer]);

        let amount = <T as balances::Config>::Balance::from(100u32);
        let _ = Balances::<T>::deposit_creating(
            &ContentTreasury::<T>::account_for_channel(channel_id),
            amount + T::ExistentialDeposit::get(),
        );

        let origin = RawOrigin::Signed(member_account_id.clone());
        let actor = ContentActor::Member(member_id);
        let owner_balance_pre = Balances::<T>::usable_balance(member_account_id.clone());
    }: withdraw_from_channel_balance(origin, actor, channel_id, amount)
        verify {
            assert_eq!(
                Balances::<T>::usable_balance(member_account_id),
                owner_balance_pre + amount,
            );

            assert_eq!(
                Balances::<T>::usable_balance(ContentTreasury::<T>::account_for_channel(channel_id)),
                T::ExistentialDeposit::get(),
            );
        }

    // WORST CASE SCENARIO:
    // STATE COMPLEXITY
    // - curator owned channel
    // - curator number is max
    // - curator has max number of permissions
    // - channel has all features paused except necessary ones
    // - channel has max assets
    claim_channel_reward {
        let h in 1 .. MAX_MERKLE_PROOF_HASHES;

        let cumulative_reward_claimed: BalanceOf<T> = 100u32.into();
        let payments = create_pull_payments_with_reward::<T>(2u32.pow(h), cumulative_reward_claimed);
        let commitment = generate_merkle_root_helper::<T, _>(&payments).pop().unwrap();
        let proof = build_merkle_path_helper::<T, _>(&payments, 0);
        let (channel_id, group_id, lead_account_id, _, _) =
            setup_worst_case_scenario_curator_channel_all_max::<T>(false)?;
        let origin = RawOrigin::Signed(lead_account_id);

        set_all_channel_paused_features_except::<T>(channel_id, vec![PausableChannelFeature::CreatorCashout]);

        Pallet::<T>::update_channel_payouts(RawOrigin::Root.into(), UpdateChannelPayoutsParameters::<T> {
            commitment: Some(commitment),
            ..Default::default()
        })?;

        let actor = ContentActor::Lead;
        let item = payments[0];
        T::CouncilBudgetManager::set_budget(cumulative_reward_claimed + T::ExistentialDeposit::get());
    }: _ (origin, actor, proof, item)
        verify {
            assert_eq!(
                Pallet::<T>::channel_by_id(channel_id).cumulative_reward_claimed,
                item.cumulative_reward_earned
            );
            assert_eq!(
                T::CouncilBudgetManager::get_budget(),
                T::ExistentialDeposit::get(),
            );
        }

    // Worst case scenario:
    // - channel belonging to a member with max number of collaborators and max agent permissions
    // - channel has all feature paused except the necessary for the extr. to succeed to maximize permission validation complexity
    claim_and_withdraw_member_channel_reward {
        let h in 1 .. MAX_MERKLE_PROOF_HASHES;

        let cumulative_reward_claimed: BalanceOf<T> = 100u32.into();
        let payments = create_pull_payments_with_reward::<T>(2u32.pow(h), cumulative_reward_claimed);
        let commitment = generate_merkle_root_helper::<T, _>(&payments).pop().unwrap();
        let proof = build_merkle_path_helper::<T, _>(&payments, 0);
        let (channel_id, member_id, member_account_id, lead_account_id) =
            setup_worst_case_scenario_member_channel_all_max::<T>(false)?;
        let lead_origin = RawOrigin::Signed(lead_account_id);
        let origin = RawOrigin::Signed(member_account_id.clone());

        set_all_channel_paused_features_except::<T>(channel_id, vec![
                PausableChannelFeature::CreatorCashout,
                PausableChannelFeature::ChannelFundsTransfer,
            ]);

        Pallet::<T>::update_channel_payouts(RawOrigin::Root.into(), UpdateChannelPayoutsParameters::<T> {
           commitment: Some(commitment),
            ..Default::default()
        })?;

        let actor = ContentActor::Member(member_id);
        let balances_pre = Balances::<T>::usable_balance(member_account_id.clone());
        let item = payments[0];
        T::CouncilBudgetManager::set_budget(cumulative_reward_claimed + T::ExistentialDeposit::get());
    }: claim_and_withdraw_channel_reward(origin, actor, proof, item)
        verify {
            assert_eq!(
                Pallet::<T>::channel_by_id(channel_id).cumulative_reward_claimed,
                item.cumulative_reward_earned
            );
            assert_eq!(
                Balances::<T>::usable_balance(member_account_id),
                cumulative_reward_claimed + balances_pre,
            );
        }

    // Worst case scenario:
    // - curator channel belonging to a group with max number curator and max curator permissions
    // - channel has all feature paused except the necessary for the extr. to succeed to maximize permission validation complexity
    claim_and_withdraw_curator_channel_reward {
        let h in 1 .. MAX_MERKLE_PROOF_HASHES;

        let cumulative_reward_claimed: BalanceOf<T> = 100u32.into();
        let payments = create_pull_payments_with_reward::<T>(2u32.pow(h), cumulative_reward_claimed);
        let commitment = generate_merkle_root_helper::<T, _>(&payments).pop().unwrap();
        let proof = build_merkle_path_helper::<T, _>(&payments, 0);
        let (channel_id, group_id, lead_account_id, _, _) =
            setup_worst_case_scenario_curator_channel_all_max::<T>(false)?;
        let origin = RawOrigin::Signed(lead_account_id);

        set_all_channel_paused_features_except::<T>(channel_id, vec![
                PausableChannelFeature::CreatorCashout,
                PausableChannelFeature::ChannelFundsTransfer,
            ]);

        Pallet::<T>::update_channel_payouts(RawOrigin::Root.into(), UpdateChannelPayoutsParameters::<T> {
            commitment: Some(commitment),
            ..Default::default()
        })?;

        let actor = ContentActor::Lead;
        let item = payments[0];
        T::CouncilBudgetManager::set_budget(cumulative_reward_claimed + T::ExistentialDeposit::get());
    }: claim_and_withdraw_channel_reward(origin, actor, proof, item)
        verify {
            assert_eq!(
                Pallet::<T>::channel_by_id(channel_id).cumulative_reward_claimed,
                item.cumulative_reward_earned
            );
            assert_eq!(
                T::CouncilBudgetManager::get_budget(),
                cumulative_reward_claimed + T::ExistentialDeposit::get(),
            );
        }

    // ================================================================================
    // ============================ NFT - BASIC  ======================================
    // ================================================================================

    // WORST CASE SCENARIO:
    // STATE COMPLEXITY
    // - curator owned channel
    // - curator number is max
    // - curator has max number of agent permissions
    // - channel has max size:
    //   - all feature paused (except necessary ones for extr to succeed)
    //   - max channel assets
    //   - max collaborators
    // - video has max size
    //   - max video assets
    // - nft limits are set
    // INPUT COMPLEXITY
    // - params of type EnglishAuctionParameters with:
    //   - member whitelist size : w
    //   - metadata bytelength : b
    //   - royalty is some
    //   - buy now price is some
    //   - starts at is some
    issue_nft {
        let w in 2..(Pallet::<T>::max_auction_whitelist_length() as u32);
        let b in 1..MAX_BYTES_METADATA;

        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            Some(T::MaxNumberOfAssetsPerVideo::get()),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
        )?;

        set_all_channel_paused_features_except::<T>(channel_id, vec![PausableChannelFeature::VideoNftIssuance]);

        let origin = RawOrigin::Signed(curator_account_id.clone());
        let params = worst_case_nft_issuance_params_helper::<T>(w,b);
    }: _ (origin, actor, video_id, params)
        verify {
            assert!(Pallet::<T>::video_by_id(video_id).nft_status.is_some());
        }

    // WORST CASE SCENARIO:
    // STATE COMPLEXITY
    // - curator owned channel
    // - curator number is max
    // - curator has max number of agent permissions
    // - channel has max size:
    //   - all feature paused (except necessary ones for extr to succeed)
    //   - max channel assets
    //   - max collaborators
    // - video has max size
    //   - max video assets
    // - nft limits are set
    // - nft owner is channel owner
    // INPUT COMPLEXITY
    destroy_nft {
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            Some(T::MaxNumberOfAssetsPerVideo::get()),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
        )?;

        let origin = RawOrigin::Signed(curator_account_id.clone());
        let _ = setup_idle_nft::<T>(
            curator_account_id.clone(),
            actor,
            video_id,
            false,
        )?;

        set_all_channel_paused_features::<T>(channel_id);
    }: _ (origin, actor, video_id)
        verify {
            assert!(Pallet::<T>::video_by_id(video_id).nft_status.is_none());
        }

    // WORST CASE SCENARIO:
    // STATE COMPLEXITY
    // - curator owned channel
    // - curator number is max
    // - curator has max number of agent permissions
    // - channel has max size:
    //   - all feature paused (except necessary ones for extr to succeed)
    //   - max channel assets
    //   - max collaborators
    // - video has max size
    //   - max video assets
    // - nft limits are set
    // - nft owner is channel owner
    // INPUT COMPLEXITY
    sling_nft_back {
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            Some(T::MaxNumberOfAssetsPerVideo::get()),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
        )?;

        let _ = setup_idle_nft::<T>(
            curator_account_id.clone(),
            actor,
            video_id,
            false,
        )?;

        set_all_channel_paused_features::<T>(channel_id);
        let origin = RawOrigin::Signed(curator_account_id.clone());
    }: _ (origin, video_id, actor)
        verify {
            assert!(Pallet::<T>::video_by_id(video_id).nft_status.unwrap().owner == NftOwner::ChannelOwner);
        }


    // ================================================================================
    // ============================== NFT - OFFERS ====================================
    // ================================================================================

    // WORST CASE SCENARIO:
    // STATE COMPLEXITY
    // - curator owned channel
    // - curator number is max
    // - curator has max number of agent permissions
    // - channel has max size:
    //   - all feature paused (except necessary ones for extr to succeed)
    //   - max channel assets
    //   - max collaborators
    // - video has max size
    //   - max video assets
    // - nft limits are set
    // - nft owner is channel owner
    // INPUT COMPLEXITY
    offer_nft {
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            Some(T::MaxNumberOfAssetsPerVideo::get()),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
        )?;

        let _ = setup_idle_nft::<T>(
            curator_account_id.clone(),
            actor,
            video_id,
            false,
        )?;

        set_all_channel_paused_features::<T>(channel_id);

        let origin = RawOrigin::Signed(curator_account_id.clone());

        let (_, to_member) = member_funded_account::<T>(MEMBER_IDS[1]);
        let price = Some(BUY_NOW_PRICE.into());

    }: _ (origin, video_id, actor, to_member, price)
        verify {
            assert!(matches!(Pallet::<T>::video_by_id(video_id).nft_status, Some(Nft::<T> {
                transactional_status: TransactionalStatus::<T>::InitiatedOfferToMember(to_memeber, price),
                ..
            })));
        }

    // WORST CASE SCENARIO:
    // STATE COMPLEXITY
    // - curator owned channel
    // - curator number is max
    // - curator has max number of agent permissions
    // - channel has max size:
    //   - all feature paused (except necessary ones for extr to succeed)
    //   - max channel assets
    //   - max collaborators
    // - video has max size
    //   - max video assets
    // - nft limits are set
    // - nft owner is channel owner
    // INPUT COMPLEXITY
    cancel_offer {
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            Some(T::MaxNumberOfAssetsPerVideo::get()),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
        )?;

        let (_, to_member) = member_funded_account::<T>(MEMBER_IDS[1]);
        let price = Some(BUY_NOW_PRICE.into());

        let _ = setup_offered_nft::<T>(
            curator_account_id.clone(),
            actor,
            video_id,
            false,
            to_member,
            price,
        )?;

        set_all_channel_paused_features::<T>(channel_id);
        let origin = RawOrigin::Signed(curator_account_id.clone());

    }: _ (origin, actor, video_id)
        verify {
            assert!(matches!(Pallet::<T>::video_by_id(video_id).nft_status, Some(Nft::<T> {
                transactional_status: TransactionalStatus::<T>::Idle,
                ..
            })));
        }

    // WORST CASE SCENARIO:
    // STATE COMPLEXITY
    // - curator owned channel
    // - curator number is max
    // - curator has max number of agent permissions
    // - channel has max size:
    //   - all feature paused (except necessary ones for extr to succeed)
    //   - max channel assets
    //   - max collaborators
    // - video has max size
    //   - max video assets
    // - nft limits are set
    // - complete payment has max complexity:
    //   - nft owner is a member (different from channel owner)
    //   - royalty is non-zero
    //   - `price - royalty` is non-zero
    // INPUT COMPLEXITY
    accept_incoming_offer {
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            Some(T::MaxNumberOfAssetsPerVideo::get()),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
        ).unwrap();

        let (to_member_account, to_member) = member_funded_account::<T>(MEMBER_IDS[1]);
        let price = Some(BUY_NOW_PRICE.into());

        let (nft_owner_actor, owner_account) = setup_offered_nft::<T>(
            curator_account_id.clone(),
            actor,
            video_id,
            true,
            to_member,
            price,
        ).unwrap();

        set_all_channel_paused_features::<T>(channel_id);
        let origin = RawOrigin::Signed(to_member_account.clone());
        let balance_pre = Balances::<T>::usable_balance(&to_member_account);

    }: _ (origin, video_id, price)
        verify {
            assert!(matches!(Pallet::<T>::video_by_id(video_id).nft_status, Some(Nft::<T> {
                transactional_status: TransactionalStatus::<T>::Idle,
                ..
            })));
            assert_eq!(
                Balances::<T>::usable_balance(&to_member_account),
                balance_pre - price.unwrap(),
            );
        }

    // ================================================================================
    // ============================ NFT - BUY NOW =====================================
    // ================================================================================

    // WORST CASE SCENARIO:
    // STATE COMPLEXITY
    // - curator owned channel
    // - curator number is max
    // - curator has max number of agent permissions
    // - channel has max size:
    //   - all feature paused (except necessary ones for extr to succeed)
    //   - max channel assets
    //   - max collaborators
    // - video has max size
    //   - max video assets
    // - nft limits are set
    // - nft owner is channel owner
    // INPUT COMPLEXITY
    sell_nft {
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            Some(T::MaxNumberOfAssetsPerVideo::get()),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
        )?;

        let price = BUY_NOW_PRICE.into();

        let _ = setup_idle_nft::<T>(
            curator_account_id.clone(),
            actor,
            video_id,
            false,
        )?;

        set_all_channel_paused_features::<T>(channel_id);
        let origin = RawOrigin::Signed(curator_account_id.clone());

    }: _ (origin, video_id, actor, price)
        verify {
            assert!(matches!(Pallet::<T>::video_by_id(video_id).nft_status, Some(Nft::<T> {
                transactional_status: TransactionalStatus::<T>::BuyNow(price),
                ..
            })));
        }

    // WORST CASE SCENARIO:
    // STATE COMPLEXITY
    // - curator owned channel
    // - curator number is max
    // - curator has max number of permissions
    // - channel has all features paused except necessary ones
    // - channel has max assets
    // - NFT owner == channel owner
    // INPUT COMPLEXITY
    cancel_buy_now {
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            Some(T::MaxNumberOfAssetsPerVideo::get()),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
        )?;

        let (_, to_member) = member_funded_account::<T>(MEMBER_IDS[1]);
        let price = BUY_NOW_PRICE.into();

        let _ = setup_nft_in_buy_now::<T>(
            curator_account_id.clone(),
            actor,
            video_id,
            false,
            price,
        )?;

        set_all_channel_paused_features::<T>(channel_id);
        let origin = RawOrigin::Signed(curator_account_id.clone());
    }: _ (origin, actor, video_id)
        verify {
            assert!(matches!(Pallet::<T>::video_by_id(video_id).nft_status, Some(Nft::<T> {
                transactional_status: TransactionalStatus::<T>::Idle,
                ..
            })));
        }

    // WORST CASE SCENARIO:
    // STATE COMPLEXITY
    // - curator owned channel
    // - curator number is max
    // - curator has max number of permissions
    // - channel has all features paused except necessary ones
    // - channel has max assets
    // - NFT owner == channel owner
    // INPUT COMPLEXITY
    update_buy_now_price {
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            Some(T::MaxNumberOfAssetsPerVideo::get()),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
        )?;

        let price = BUY_NOW_PRICE.into();

        let _ = setup_nft_in_buy_now::<T>(
            curator_account_id.clone(),
            actor,
            video_id,
            false,
            price,
        )?;

        set_all_channel_paused_features::<T>(channel_id);
        let origin = RawOrigin::Signed(curator_account_id.clone());
        let new_price = (BUY_NOW_PRICE + 1).into();
    }: _ (origin, actor, video_id, new_price)
        verify {
            assert!(matches!(Pallet::<T>::video_by_id(video_id).nft_status, Some(Nft::<T> {
                transactional_status: TransactionalStatus::<T>::BuyNow(new_price),
                ..
            })));
        }

    // WORST CASE SCENARIO:
    // STATE COMPLEXITY
    // - curator owned channel
    // - curator number is max
    // - curator has max number of permissions
    // - channel has all features paused except necessary ones
    // - channel has max assets
    // - video has max assets
    // - NFT owner == channel owner
    // - NFT royalty is some
    // INPUT COMPLEXITY
    buy_nft {
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            Some(T::MaxNumberOfAssetsPerVideo::get()),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
        )?;

        let (buyer_account_id, buyer_id) = member_funded_account::<T>(MEMBER_IDS[1]);
        let price = BUY_NOW_PRICE.into();

        let (nft_owner_actor, owner_account) = setup_nft_in_buy_now::<T>(
            curator_account_id.clone(),
            actor,
            video_id,
            true,
            price,
        )?;

        set_all_channel_paused_features::<T>(channel_id);
        let origin = RawOrigin::Signed(buyer_account_id.clone());

        let balance_pre = Balances::<T>::usable_balance(buyer_account_id.clone());
    }: _ (origin, video_id, buyer_id, price)
        verify {
            assert!(matches!(Pallet::<T>::video_by_id(video_id).nft_status, Some(Nft::<T> {
                transactional_status: TransactionalStatus::<T>::Idle,
                ..
            })));
            assert_eq!(Balances::<T>::usable_balance(buyer_account_id), balance_pre - price)
        }

    // ================================================================================
    // ========================== NFT - UPDATE LIMITS =================================1
    // ================================================================================

    // WORST CASE SCENARIO:
    // INPUT COMPLEXITY
    toggle_nft_limits {
        let origin = RawOrigin::Root;
        let enabled = false;
    }: _ (origin, enabled)
        verify {
            assert!(!Pallet::<T>::nft_limits_enabled());
        }

    // STATE COMPLEXITY
    // INPUT COMPLEXITY
    update_global_nft_limit {
        let origin = RawOrigin::Root;
        let nft_limit_period = NftLimitPeriod::Daily;
        let limit = 10u64;
    }: _(origin, nft_limit_period, limit)
        verify {
            assert_eq!(Pallet::<T>::global_daily_nft_limit().limit, 10u64);
        }

    // STATE COMPLEXITY
    // - curator owned channel
    // - curator number is max
    // - curator has max number of permissions
    // - channel has max collaborators
    // - channel has all features paused
    // - channel has max assets
    // INPUT COMPLEXITY
    update_channel_nft_limit {
        let nft_limit_period = NftLimitPeriod::Daily;
        let limit = 10u64;
        let (channel_id, group_id, _, curator_id, curator_account_id) =
            setup_worst_case_scenario_curator_channel_all_max::<T>(false)?;
        let origin = RawOrigin::Signed(curator_account_id);
        let actor = ContentActor::Curator(group_id, curator_id);
    }: _(origin, actor, nft_limit_period, channel_id, limit)
        verify {
            assert_eq!(Pallet::<T>::channel_by_id(channel_id).daily_nft_limit.limit, limit);
        }

    // ================================================================================
    // =========================== NFT - ENGLISH AUCTION ==============================
    // ================================================================================

    // WORST CASE SCENARIO
    // STATE COMPLEXITY
    // - curator owned channel
    // - curator number is max
    // - curator has max number of agent permissions
    // - channel has max size:
    //   - all feature paused (except necessary ones for extr to succeed)
    //   - max channel assets
    //   - max collaborators
    // - video has max size
    //   - max video assets
    // - nft limits are set
    // - nft owner is channel owner
    // INPUT COMPLEXITY
    // - Member whitelist : w
    start_english_auction {
        let w in 2..(Pallet::<T>::max_auction_whitelist_length() as u32);

        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            Some(T::MaxNumberOfAssetsPerVideo::get()),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
        )?;

        let (nft_owner_actor, owner_account) = setup_idle_nft::<T>(
            curator_account_id.clone(),
            actor,
            video_id,
            false,
        )?;

        let auction_params = EnglishAuctionParams::<T> {
            buy_now_price: Some(BUY_NOW_PRICE.into()),
            duration: Pallet::<T>::min_auction_duration(),
            extension_period: Pallet::<T>::min_auction_extension_period(),
            min_bid_step: Pallet::<T>::min_bid_step(),
            starting_price: Pallet::<T>::min_starting_price(),
            starts_at: Some(System::<T>::block_number() + T::BlockNumber::one()),
            whitelist: (0..(w as usize))
                .map(|i| member_funded_account::<T>(WHITELISTED_MEMBERS_IDS[i]).1)
                .collect(),
        };

        set_all_channel_paused_features::<T>(channel_id);
        let origin = RawOrigin::Signed(owner_account.clone());

    }: _(origin, nft_owner_actor, video_id, auction_params)
        verify {
            assert!(matches!(Pallet::<T>::video_by_id(video_id).nft_status, Some(Nft::<T> {
                transactional_status: TransactionalStatus::<T>::EnglishAuction(..),
                ..
            })))
        }

    // WORST CASE SCENARIO
    // STATE COMPLEXITY
    // - curator owned channel
    // - curator number is max
    // - curator has max number of agent permissions
    // - channel has max size:
    //   - all feature paused (except necessary ones for extr to succeed)
    //   - max channel assets
    //   - max collaborators
    // - video has max size
    //   - max video assets
    // - nft limits are set
    // - nft owner is channel owner
    // INPUT COMPLEXITY
    cancel_english_auction {
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            Some(T::MaxNumberOfAssetsPerVideo::get()),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
        ).unwrap();

        let ((nft_owner_actor, owner_account),
             participant_id, participant_account_id) = setup_nft_in_english_auction::<T>(
            curator_account_id.clone(),
            actor,
            video_id,
            true,
        ).unwrap();

        set_all_channel_paused_features::<T>(channel_id);
        let origin = RawOrigin::Signed(owner_account);

    }: _(origin, nft_owner_actor, video_id)
        verify {
            assert!(matches!(Pallet::<T>::video_by_id(video_id).nft_status, Some(Nft::<T> {
                transactional_status: TransactionalStatus::<T>::Idle,
                ..
            })))
        }

    // WORST CASE SCENARIO:
    // STATE COMPLEXITY:
    // - curator owned channel
    // - curator number is max
    // - curator has max number of agent permissions
    // - channel has max size:
    //   - all feature paused (except necessary ones for extr to succeed)
    //   - max channel assets
    //   - max collaborators
    // - video has max size
    //   - max video assets
    // - nft limits are set
    // - bid triggers buy now
    // - bid already exists
    // - complete payment has max complexity:
    //   - nft owner is a member (different from channel owner)
    //   - royalty is non-zero
    //   - `price - royalty` is non-zero
    // INPUT COMPLEXITY
    make_english_auction_bid {
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            Some(T::MaxNumberOfAssetsPerVideo::get()),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
        )?;

        let ((nft_owner_actor, owner_account), participant_id, participant_account_id) = setup_nft_in_english_auction::<T>(
            curator_account_id,
            actor,
            video_id,
            true,
        )?;

        set_all_channel_paused_features::<T>(channel_id);

        fastforward_by_blocks::<T>(2u32.into());
        let balance_pre = Balances::<T>::usable_balance(participant_account_id.clone());
        let _ = add_english_auction_bid::<T>(participant_account_id.clone(), participant_id, video_id);
        let buy_now_amount = BUY_NOW_PRICE.into();

        let origin = RawOrigin::Signed(participant_account_id.clone());
    }: _(origin, participant_id, video_id, buy_now_amount)
        verify {
            assert!(matches!(Pallet::<T>::video_by_id(video_id).nft_status, Some(Nft::<T> {
                transactional_status: TransactionalStatus::<T>::Idle,
                ..
            })));
            assert_eq!(
                Balances::<T>::usable_balance(participant_account_id),
                balance_pre - buy_now_amount,
            )
        }

    // WORST CASE SCENARIO:
    // - curator owned channel
    // - curator number is max
    // - curator has max number of agent permissions
    // - channel has max size:
    //   - all feature paused (except necessary ones for extr to succeed)
    //   - max channel assets
    //   - max collaborators
    // - video has max size
    //   - max video assets
    // - nft limits are set
    // - complete payment has max complexity:
    //   - nft owner is a member (different from channel owner)
    //   - royalty is non-zero
    //   - `price - royalty` is non-zero
    // INPUT COMPLEXITY
    settle_english_auction {
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            Some(T::MaxNumberOfAssetsPerVideo::get()),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
        )?;

        let ((nft_owner_actor, owner_account), participant_id, participant_account_id) = setup_nft_in_english_auction::<T>(
            curator_account_id.clone(),
            actor,
            video_id,
            true,
        )?;

        set_all_channel_paused_features::<T>(channel_id);
        let origin = RawOrigin::Signed(owner_account.clone());

        fastforward_by_blocks::<T>(2u32.into());
        let _ = add_english_auction_bid::<T>(participant_account_id.clone(), participant_id, video_id);

        fastforward_by_blocks::<T>(10u32.into());
    }: _(origin, video_id)
        verify {
            assert!(matches!(Pallet::<T>::video_by_id(video_id).nft_status, Some(Nft::<T> {
                transactional_status: TransactionalStatus::<T>::Idle,
                ..
            })));
        }

    // ================================================================================
    // =========================== NFT - OPEN AUCTION =================================
    // ================================================================================

    // WORST CASE SCENARIO
    // STATE COMPLEXITY
        // - curator owned channel
    // - curator number is max
    // - curator has max number of agent permissions
    // - channel has max size:
    //   - all feature paused (except necessary ones for extr to succeed)
    //   - max channel assets
    //   - max collaborators
    // - video has max size
    //   - max video assets
    // - nft limits are set
    // INPUT COMPLEXITY
    // - nft owner is channel owner
    // - open auction params Member whitelist : w
    start_open_auction {
        let w in 2..(Pallet::<T>::max_auction_whitelist_length() as u32);

        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            Some(T::MaxNumberOfAssetsPerVideo::get()),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
        )?;

        let (_, to_member) = member_funded_account::<T>(MEMBER_IDS[1]);
        let buy_now_price = Pallet::<T>::min_starting_price()
            + Pallet::<T>::min_bid_step().mul(10u32.into());

        let _ = setup_idle_nft::<T>(
            curator_account_id.clone(),
            actor,
            video_id,
            false,
        )?;

        let origin = RawOrigin::Signed(curator_account_id.clone());

        set_all_channel_paused_features::<T>(channel_id);

        let auction_params = OpenAuctionParams::<T> {
            buy_now_price: Some(buy_now_price),
            bid_lock_duration: Pallet::<T>::min_bid_lock_duration(),
            starting_price: Pallet::<T>::min_starting_price(),
            starts_at: Some(System::<T>::block_number() + T::BlockNumber::one()),
            whitelist: (0..(w as usize))
                .map(|i| member_funded_account::<T>(WHITELISTED_MEMBERS_IDS[i]).1)
                .collect(),

        };
    }: _(origin, actor, video_id, auction_params)
        verify {
            assert!(matches!(Pallet::<T>::video_by_id(video_id).nft_status, Some(Nft::<T> {
                transactional_status: TransactionalStatus::<T>::OpenAuction(..),
                ..
            })));
        }

    // WORST CASE SCENARIO
    // STATE COMPLEXITY
    // - curator owned channel
    // - curator number is max
    // - curator has max number of agent permissions
    // - channel has max size:
    //   - all feature paused (except necessary ones for extr to succeed)
    //   - max channel assets
    //   - max collaborators
    // - video has max size
    //   - max video assets
    // - nft limits are set
    // - nft owner is channel owner
    // INPUT COMPLEXITY
    cancel_open_auction {
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            Some(T::MaxNumberOfAssetsPerVideo::get()),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
        )?;

        let ((nft_owner_actor, owner_account), participant_id, participant_account_id) = setup_nft_in_open_auction::<T>(
            curator_account_id.clone(),
            actor,
            video_id,
            false,
        )?;

        set_all_channel_paused_features::<T>(channel_id);

        let origin = RawOrigin::Signed(owner_account);

    }: _(origin, nft_owner_actor, video_id)
        verify {
            assert!(matches!(Pallet::<T>::video_by_id(video_id).nft_status, Some(Nft::<T> {
                transactional_status: TransactionalStatus::<T>::Idle,
                ..
            })))
        }

    // WORST CASE SCENARIO
    // STATE COMPLEXITY
    // - curator owned channel
    // - curator number is max
    // - curator has max number of agent permissions
    // - channel has max size:
    //   - all feature paused (except necessary ones for extr to succeed)
    //   - max channel assets
    //   - max collaborators
    // - video has max size
    //   - max video assets
    // - nft limits are set
    // - nft owner is channel owner
    // INPUT COMPLEXITY
    cancel_open_auction_bid {
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            Some(T::MaxNumberOfAssetsPerVideo::get()),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
        )?;

        let (owner_account, owner_id) = member_funded_account::<T>(DEFAULT_MEMBER_ID);
        let nft_owner_actor = ContentActor::<T::CuratorGroupId, T::CuratorId, T::MemberId>::Member(owner_id);

        let (_, participant_id, participant_account_id) = setup_nft_in_open_auction::<T>(
            curator_account_id.clone(),
            actor,
            video_id,
            false,
        )?;

        set_all_channel_paused_features::<T>(channel_id);
        let origin = RawOrigin::Signed(participant_account_id.clone());

        fastforward_by_blocks::<T>(2u32.into());

        let bid = add_open_auction_bid::<T>(participant_account_id, participant_id, video_id);
        fastforward_by_blocks::<T>(10u32.into()); // skip bid lock

    }: _(origin, participant_id, video_id)
        verify {
            assert_eq!(Pallet::<T>::open_auction_bid_by_video_and_member(video_id, participant_id).amount, 0u32.into());
        }

    // WORST CASE SCENARIO
    // STATE COMPLEXITY
    // - curator owned channel
    // - curator number is max
    // - curator has max number of agent permissions
    // - channel has max size:
    //   - all feature paused (except necessary ones for extr to succeed)
    //   - max channel assets
    //   - max collaborators
    // - video has max size
    //   - max video assets
    // - nft limits are set
    // - complete payment has max complexity:
    //   - nft owner is a member (different from channel owner)
    //   - royalty is non-zero
    //   - `price - royalty` is non-zero
    // INPUT COMPLEXITY
    pick_open_auction_winner {
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            Some(T::MaxNumberOfAssetsPerVideo::get()),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
        ).unwrap();

        let ((nft_owner_actor, owner_account), participant_id, participant_account_id) = setup_nft_in_open_auction::<T>(
            curator_account_id.clone(),
            actor,
            video_id,
            true,
        ).unwrap();

        set_all_channel_paused_features::<T>(channel_id);
        let origin = RawOrigin::Signed(owner_account.clone());

        fastforward_by_blocks::<T>(2u32.into());

        let bid = add_open_auction_bid::<T>(participant_account_id, participant_id, video_id);

        fastforward_by_blocks::<T>(10u32.into());

    }: _(origin, nft_owner_actor, video_id, participant_id, bid.amount)
        verify {
            assert!(matches!(Pallet::<T>::video_by_id(video_id).nft_status, Some(Nft::<T> {
                transactional_status: TransactionalStatus::<T>::Idle,
                ..
            })));

            assert_eq!(Pallet::<T>::open_auction_bid_by_video_and_member(video_id, participant_id).amount, 0u32.into());
        }

    // WORST CASE SCENARIO
    // STATE COMPLEXITY
    // - curator owned channel
    // - curator number is max
    // - curator has max number of agent permissions
    // - channel has max size:
    //   - all feature paused (except necessary ones for extr to succeed)
    //   - max channel assets
    //   - max collaborators
    // - video has max size
    //   - max video assets
    // - nft limits are set
    // - bid triggers buy now
    // - bid already exists
    // - complete payment has max complexity:
    //   - nft owner is a member (different from channel owner)
    //   - royalty is non-zero
    //   - `price - royalty` is non-zero
    // INPUT COMPLEXITY
    make_open_auction_bid {
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            Some(T::MaxNumberOfAssetsPerVideo::get()),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
        )?;

        let ((nft_owner_actor, account_id), participant_id, participant_account_id) = setup_nft_in_open_auction::<T>(
            curator_account_id.clone(),
            actor,
            video_id,
            true,
        )?;

        set_all_channel_paused_features::<T>(channel_id);
        let origin = RawOrigin::Signed(participant_account_id.clone());

        fastforward_by_blocks::<T>(2u32.into());

        let balance_pre = Balances::<T>::usable_balance(participant_account_id.clone());
        let _ = add_open_auction_bid::<T>(participant_account_id.clone(), participant_id, video_id);
        let price = BUY_NOW_PRICE.into();
        fastforward_by_blocks::<T>(10u32.into()); // skip bid lock

    }: _(origin, participant_id, video_id, price)
        verify {
            assert_eq!(
                balance_pre - price,
                Balances::<T>::usable_balance(participant_account_id)
            );

            assert!(matches!(Pallet::<T>::video_by_id(video_id).nft_status, Some(Nft::<T> {
                transactional_status: TransactionalStatus::<T>::Idle,
                ..
            })));
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
    fn issue_creator_token() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_issue_creator_token());
        })
    }

    #[test]
    fn creator_token_issuer_transfer() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_creator_token_issuer_transfer());
        })
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
    fn create_video_without_nft() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_create_video_without_nft());
        });
    }

    #[test]
    fn create_video_with_nft() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_create_video_with_nft());
        });
    }

    #[test]
    fn update_video_without_assets_without_nft() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_update_video_without_assets_without_nft());
        });
    }

    #[test]
    fn update_video_with_assets_without_nft() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_update_video_with_assets_without_nft());
        });
    }

    #[test]
    fn update_video_without_assets_with_nft() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_update_video_without_assets_with_nft());
        });
    }

    #[test]
    fn update_video_with_assets_with_nft() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_update_video_with_assets_with_nft());
        });
    }

    #[test]
    fn delete_video_without_assets() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_delete_video_without_assets());
        });
    }

    #[test]
    fn delete_video_with_assets() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_delete_video_with_assets());
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

    #[test]
    fn update_channel_payouts() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_update_channel_payouts());
        })
    }

    #[test]
    fn withdraw_from_member_channel_balance() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_withdraw_from_member_channel_balance());
        })
    }

    #[test]
    fn withdraw_from_curator_channel_balance() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_withdraw_from_curator_channel_balance());
        })
    }

    #[test]
    fn claim_channel_reward() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_claim_channel_reward());
        })
    }

    #[test]
    fn claim_channel_and_withdraw_member_channel_reward() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_claim_and_withdraw_member_channel_reward());
        })
    }

    #[test]
    fn issue_nft() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_issue_nft());
        })
    }

    #[test]
    fn claim_channel_and_withdraw_curator_channel_reward() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_claim_and_withdraw_curator_channel_reward());
        })
    }

    #[test]
    fn destroy_nft() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_destroy_nft());
        })
    }

    #[test]
    fn sling_nft_back() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_sling_nft_back());
        })
    }

    #[test]
    fn offer_nft() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_offer_nft());
        })
    }

    #[test]
    fn cancel_offer() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_cancel_offer());
        })
    }

    #[test]
    fn accept_incoming_offer() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_accept_incoming_offer());
        })
    }

    #[test]
    fn sell_nft() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_sell_nft());
        })
    }

    #[test]
    fn cancel_buy_now() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_cancel_buy_now());
        })
    }

    #[test]
    fn update_buy_now_price() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_update_buy_now_price());
        })
    }

    #[test]
    fn buy_nft() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_buy_nft());
        })
    }

    #[test]
    fn toggle_nft_limits() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_toggle_nft_limits());
        })
    }

    #[test]
    fn update_global_nft_limit() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_update_global_nft_limit());
        })
    }

    #[test]
    fn update_channel_nft_limit() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_update_channel_nft_limit());
        })
    }

    #[test]
    fn start_english_auction() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_start_english_auction());
        })
    }

    #[test]
    fn cancel_english_auction() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_cancel_english_auction());
        })
    }

    #[test]
    fn make_english_auction_bid() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_make_english_auction_bid());
        })
    }

    #[test]
    fn settle_english_auction() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_settle_english_auction());
        })
    }

    #[test]
    fn start_open_auction() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_start_open_auction());
        })
    }

    #[test]
    fn cancel_open_auction() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_cancel_open_auction());
        })
    }

    #[test]
    fn cancel_open_auction_bid() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_cancel_open_auction_bid());
        })
    }

    #[test]
    fn pick_open_auction_winner() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_pick_open_auction_winner());
        })
    }

    #[test]
    fn make_open_auction_bid() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_make_open_auction_bid());
        })
    }

    #[test]
    fn make_creator_token_permissionless() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_make_creator_token_permissionless());
        });
    }

    #[test]
    fn deissue_creator_token() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_deissue_creator_token());
        });
    }

    #[test]
    fn init_creator_token_sale() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_init_creator_token_sale());
        });
    }

    #[test]
    fn update_upcoming_creator_token_sale() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_update_upcoming_creator_token_sale());
        });
    }

    #[test]
    fn finalize_creator_token_sale() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_finalize_creator_token_sale());
        });
    }

    #[test]
    fn issue_revenue_split() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_issue_revenue_split());
        });
    }

    #[test]
    fn issue_revenue_split_as_collaborator() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_issue_revenue_split_as_collaborator());
        });
    }

    #[test]
    fn finalize_revenue_split() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_finalize_revenue_split());
        });
    }

    #[test]
    fn reduce_creator_token_patronage_rate_to() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_reduce_creator_token_patronage_rate_to());
        });
    }

    #[test]
    fn claim_creator_token_patronage_credit() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_claim_creator_token_patronage_credit());
        });
    }
}
