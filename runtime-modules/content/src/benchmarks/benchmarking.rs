#![cfg(feature = "runtime-benchmarks")]

use crate::nft::{NftOwner, TransactionalStatus};
use crate::permissions::*;
use crate::types::{ChannelOwner, VideoUpdateParameters};
use crate::Module as Pallet;
use crate::{Call, ChannelById, Config, Event};
use frame_benchmarking::{benchmarks, Zero};
use frame_support::storage::StorageMap;
use frame_support::traits::Get;
use frame_system::RawOrigin;
use sp_arithmetic::traits::{One, Saturating};
use sp_runtime::SaturatedConversion;
use sp_std::cmp::min;
use sp_std::collections::btree_set::BTreeSet;

use super::{
    assert_last_event, channel_bag_witness, generate_channel_creation_params,
    insert_content_leader, insert_curator, insert_distribution_leader, insert_storage_leader,
    member_funded_account, prepare_worst_case_scenario_video_creation_parameters,
    setup_worst_case_curator_group_with_curators, setup_worst_case_scenario_mutable_video,
    worst_case_channel_agent_permissions, worst_case_content_moderation_actions_set,
    worst_case_scenario_assets, worst_case_scenario_video_nft_issuance_params, CreateAccountId,
    RuntimeConfig, CURATOR_IDS, DEFAULT_MEMBER_ID, MAX_AUCTION_WHITELIST_LENGTH,
};

benchmarks! {
    where_clause {
        where
            T: RuntimeConfig,
            T::AccountId: CreateAccountId
    }

    create_channel {

        let a in 1 .. T::MaxNumberOfCollaboratorsPerChannel::get(); //max colaborators

        let b in (T::StorageBucketsPerBagValueConstraint::get().min as u32) ..
            (T::StorageBucketsPerBagValueConstraint::get().max() as u32);

        let c in (T::DistributionBucketsPerBagValueConstraint::get().min as u32) ..
            (T::DistributionBucketsPerBagValueConstraint::get().max() as u32);

        let d in 1 .. T::MaxNumberOfAssetsPerChannel::get(); //max objs number

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
            a, b, c, d,
            max_obj_size,
        );

    }: _ (sender, channel_owner, params)
    verify {
        let channel_id: T::ChannelId = One::one();
        assert!(ChannelById::<T>::contains_key(&channel_id));
        // channel counter increased
        assert_eq!(
            Pallet::<T>::next_channel_id(),
            channel_id.saturating_add(One::one())
        );
    }
    /*
    ===============================================================================================
    ======================================== CURATOR GROUPS =======================================
    ===============================================================================================
    */

    create_curator_group {
        let a in 0 .. (T::MaxKeysPerCuratorGroupPermissionsByLevelMap::get() as u32);

        let lead_account = insert_content_leader::<T>();
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

        let lead_account = insert_content_leader::<T>();
        let group_id = setup_worst_case_curator_group_with_curators::<T>(
            T::MaxNumberOfCuratorsPerGroup::get()
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
        let lead_account = insert_content_leader::<T>();
        let group_id = setup_worst_case_curator_group_with_curators::<T>(
            T::MaxNumberOfCuratorsPerGroup::get()
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
        let lead_account = insert_content_leader::<T>();
        let permissions = worst_case_channel_agent_permissions();
        let group_id = setup_worst_case_curator_group_with_curators::<T>(
            T::MaxNumberOfCuratorsPerGroup::get() - 1
        )?;
        let (curator_id, _) = insert_curator::<T>(
            CURATOR_IDS[T::MaxNumberOfCuratorsPerGroup::get() as usize - 1]
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
        let lead_account = insert_content_leader::<T>();
        let group_id = setup_worst_case_curator_group_with_curators::<T>(
            T::MaxNumberOfCuratorsPerGroup::get()
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
    ============================================ VIDEOS ===========================================
    ===============================================================================================
    */
    create_video_without_nft {
        let a in 1..T::MaxNumberOfAssetsPerVideo::get();
        let b in
            (T::StorageBucketsPerBagValueConstraint::get().min as u32)
            ..(T::StorageBucketsPerBagValueConstraint::get().max() as u32);
        let c in
            (T::DistributionBucketsPerBagValueConstraint::get().min as u32)
            ..(T::DistributionBucketsPerBagValueConstraint::get().max() as u32);

        let (curator_account_id, actor, channel_id, params) = prepare_worst_case_scenario_video_creation_parameters::<T>(
            a,
            b,
            c,
            None
        )?;
        let expected_video_id = Pallet::<T>::next_video_id();
        let expected_asset_ids: BTreeSet<T::DataObjectId> = (
            T::MaxNumberOfAssetsPerChannel::get().saturated_into()
            ..(T::MaxNumberOfAssetsPerChannel::get()+a).saturated_into()
        ).collect();
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
        assert_last_event::<T>(Event::<T>::VideoCreated(
            actor,
            channel_id,
            expected_video_id,
            params,
            expected_asset_ids
        ).into());
    }

    // Worst case scenario: initial state - EnglishAuction
    create_video_with_nft {
        let a in 1..T::MaxNumberOfAssetsPerVideo::get();
        let b in
            (T::StorageBucketsPerBagValueConstraint::get().min as u32)
            ..(T::StorageBucketsPerBagValueConstraint::get().max() as u32);
        let c in
            (T::DistributionBucketsPerBagValueConstraint::get().min as u32)
            ..(T::DistributionBucketsPerBagValueConstraint::get().max() as u32);
        let d in 2..MAX_AUCTION_WHITELIST_LENGTH;

        let (curator_account_id, actor, channel_id, params) = prepare_worst_case_scenario_video_creation_parameters::<T>(
            a,
            b,
            c,
            Some(d)
        )?;
        let expected_video_id = Pallet::<T>::next_video_id();
        let expected_asset_ids: BTreeSet<T::DataObjectId> = (
            T::MaxNumberOfAssetsPerChannel::get().saturated_into()
            ..(T::MaxNumberOfAssetsPerChannel::get()+a).saturated_into()
        ).collect();
        let expected_auction_start_block = frame_system::Pallet::<T>::block_number() + T::BlockNumber::one();
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
                assert_eq!(params.whitelist.len(), d as usize);
                assert!(params.buy_now_price.is_some());
                assert_eq!(params.start, expected_auction_start_block)
            },
            _ => panic!("Unexpected video nft transactional status")
        }

        assert_eq!(BTreeSet::from(video.data_objects), expected_asset_ids);
        assert_eq!(video.video_state_bloat_bond, Pallet::<T>::video_state_bloat_bond_value());
        assert_last_event::<T>(Event::<T>::VideoCreated(
            actor,
            channel_id,
            expected_video_id,
            params,
            expected_asset_ids
        ).into());
    }

    update_video_without_assets_without_nft {
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            T::MaxNumberOfAssetsPerVideo::get(),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
            T::DistributionBucketsPerBagValueConstraint::get().max() as u32
        )?;
        let params = VideoUpdateParameters::<T> {
            assets_to_upload: None,
            assets_to_remove: BTreeSet::new(),
            auto_issue_nft: None,
            expected_data_object_state_bloat_bond:
                storage::Pallet::<T>::data_object_state_bloat_bond_value(),
            new_meta: None,
            channel_bag_witness: None
        };
        let existing_asset_ids: BTreeSet<T::DataObjectId> = (
            T::MaxNumberOfAssetsPerChannel::get().saturated_into()..
            (T::MaxNumberOfAssetsPerChannel::get() + T::MaxNumberOfAssetsPerVideo::get())
                .saturated_into()
        ).collect();
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
        assert_last_event::<T>(Event::<T>::VideoUpdated(
            actor,
            video_id,
            params,
            BTreeSet::new()
        ).into());
    }

    update_video_with_assets_without_nft {
        let a in 1..T::MaxNumberOfAssetsPerVideo::get();
        let b in 1..T::MaxNumberOfAssetsPerVideo::get();
        let c in
            (T::StorageBucketsPerBagValueConstraint::get().min as u32)
            ..(T::StorageBucketsPerBagValueConstraint::get().max() as u32);
        let d in
            (T::DistributionBucketsPerBagValueConstraint::get().min as u32)
            ..(T::DistributionBucketsPerBagValueConstraint::get().max() as u32);

        // As many assets as possible, but leaving room for "a" additional assets,
        // provided that "b" assets will be removed
        let num_preexisting_assets = min(
            T::MaxNumberOfAssetsPerVideo::get() - a + b,
            T::MaxNumberOfAssetsPerVideo::get()
        );
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            num_preexisting_assets,
            c,
            d
        )?;

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
            new_meta: None,
            channel_bag_witness: Some(channel_bag_witness::<T>(channel_id)).transpose()?
        };
        let expected_asset_ids: BTreeSet<T::DataObjectId> = (
            max_channel_assets + num_preexisting_assets.saturated_into()..
            max_channel_assets + num_preexisting_assets.saturated_into() + a.saturated_into()
        ).collect();
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
        assert_last_event::<T>(Event::<T>::VideoUpdated(
            actor,
            video_id,
            params,
            expected_asset_ids
        ).into());
    }

    update_video_without_assets_with_nft {
        let a in 2..MAX_AUCTION_WHITELIST_LENGTH;

        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            T::MaxNumberOfAssetsPerVideo::get(),
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
            T::DistributionBucketsPerBagValueConstraint::get().max() as u32,
        )?;
        let params = VideoUpdateParameters::<T> {
            assets_to_upload: None,
            assets_to_remove: BTreeSet::new(),
            auto_issue_nft: Some(worst_case_scenario_video_nft_issuance_params::<T>(a)),
            expected_data_object_state_bloat_bond:
                storage::Pallet::<T>::data_object_state_bloat_bond_value(),
            new_meta: None,
            channel_bag_witness: None
        };
        let existing_asset_ids: BTreeSet<T::DataObjectId> = (
            T::MaxNumberOfAssetsPerChannel::get().saturated_into()..
            (T::MaxNumberOfAssetsPerChannel::get() + T::MaxNumberOfAssetsPerVideo::get())
                .saturated_into()
        ).collect();
        let expected_auction_start_block = frame_system::Pallet::<T>::block_number() + T::BlockNumber::one();
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
        assert_last_event::<T>(Event::<T>::VideoUpdated(
            actor,
            video_id,
            params,
            BTreeSet::new()
        ).into());
    }

    update_video_with_assets_with_nft {
        let a in 1..T::MaxNumberOfAssetsPerVideo::get();
        let b in 1..T::MaxNumberOfAssetsPerVideo::get();
        let c in
            (T::StorageBucketsPerBagValueConstraint::get().min as u32)
            ..(T::StorageBucketsPerBagValueConstraint::get().max() as u32);
        let d in
            (T::DistributionBucketsPerBagValueConstraint::get().min as u32)
            ..(T::DistributionBucketsPerBagValueConstraint::get().max() as u32);
        let e in 2..MAX_AUCTION_WHITELIST_LENGTH;

        // As many assets as possible, but leaving room for "a" additional assets,
        // provided that "b" assets will be removed
        let num_preexisting_assets = min(
            T::MaxNumberOfAssetsPerVideo::get() - a + b,
            T::MaxNumberOfAssetsPerVideo::get()
        );
        let (
            video_id,
            (curator_account_id, actor, channel_id, _)
        ) = setup_worst_case_scenario_mutable_video::<T>(
            num_preexisting_assets,
            c,
            d
        )?;

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
            auto_issue_nft: Some(worst_case_scenario_video_nft_issuance_params::<T>(e)),
            expected_data_object_state_bloat_bond:
                storage::Pallet::<T>::data_object_state_bloat_bond_value(),
            new_meta: None,
            channel_bag_witness: Some(channel_bag_witness::<T>(channel_id)).transpose()?
        };
        let expected_asset_ids: BTreeSet<T::DataObjectId> = (
            max_channel_assets + num_preexisting_assets.saturated_into()..
            max_channel_assets + num_preexisting_assets.saturated_into() + a.saturated_into()
        ).collect();
        let expected_auction_start_block = frame_system::Pallet::<T>::block_number() + T::BlockNumber::one();
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
                assert_eq!(params.whitelist.len(), e as usize);
                assert!(params.buy_now_price.is_some());
                assert_eq!(params.start, expected_auction_start_block)
            },
            _ => panic!("Unexpected video nft transactional status")
        }
        assert_last_event::<T>(Event::<T>::VideoUpdated(
            actor,
            video_id,
            params,
            expected_asset_ids
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
        });
    }

    #[test]
    fn add_curator_to_group() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_add_curator_to_group());
        });
    }

    #[test]
    fn remove_curator_from_group() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_remove_curator_from_group());
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
}
