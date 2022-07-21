#![cfg(feature = "runtime-benchmarks")]

use crate::nft::{NftOwner, TransactionalStatus};
use crate::permissions::*;
use crate::types::{ChannelOwner, VideoCreationParameters};
use crate::Module as Pallet;
use crate::{Call, ChannelById, Config, Event};
use frame_benchmarking::{benchmarks, Zero};
use frame_support::storage::StorageMap;
use frame_support::traits::Get;
use frame_system::RawOrigin;
use sp_arithmetic::traits::{One, Saturating};
use sp_runtime::SaturatedConversion;
use sp_std::collections::btree_set::BTreeSet;

use super::{
    assert_last_event, channel_bag_witness, generate_channel_creation_params,
    insert_content_leader, insert_curator, insert_distribution_leader, insert_storage_leader,
    member_funded_account, setup_bloat_bonds, setup_worst_case_curator_group_with_curators,
    setup_worst_case_scenario_curator_channel, worst_case_channel_agent_permissions,
    worst_case_content_moderation_actions_set, worst_case_scenario_assets,
    worst_case_scenario_video_nft_issuance_params, CreateAccountId, RuntimeConfig, CURATOR_IDS,
    DEFAULT_MEMBER_ID, MAX_AUCTION_WHITELIST_LENGTH,
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

        let (channel_id, group_id, lead_account_id, curator_id, curator_account_id) =
            setup_worst_case_scenario_curator_channel::<T>(b, c)?;
        let actor = ContentActor::Curator(group_id, curator_id);
        let video_assets_size = T::MaxDataObjectSize::get() * T::MaxNumberOfAssetsPerVideo::get() as u64;
        let (_, video_state_bloat_bond, data_object_state_bloat_bond, data_size_fee) =
            setup_bloat_bonds::<T>()?;
        let assets = worst_case_scenario_assets::<T>(a);
        let params = VideoCreationParameters::<T> {
            assets: Some(assets),
            meta: None,
            auto_issue_nft: None,
            expected_video_state_bloat_bond: video_state_bloat_bond,
            expected_data_object_state_bloat_bond: data_object_state_bloat_bond,
            channel_bag_witness: channel_bag_witness::<T>(channel_id)?,
        };
        let video_id = Pallet::<T>::next_video_id();
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
        let video = Pallet::<T>::video_by_id(video_id);
        assert_eq!(video.in_channel, channel_id);
        assert_eq!(video.nft_status, None);
        assert_eq!(BTreeSet::from(video.data_objects), expected_asset_ids);
        assert_eq!(video.video_state_bloat_bond, video_state_bloat_bond);
        assert_last_event::<T>(Event::<T>::VideoCreated(
            actor,
            channel_id,
            video_id,
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

        let (channel_id, group_id, lead_account_id, curator_id, curator_account_id) =
            setup_worst_case_scenario_curator_channel::<T>(b, c)?;
        let actor = ContentActor::Curator(group_id, curator_id);
        let video_assets_size = T::MaxDataObjectSize::get() * T::MaxNumberOfAssetsPerVideo::get() as u64;
        let (_, video_state_bloat_bond, data_object_state_bloat_bond, data_size_fee) =
            setup_bloat_bonds::<T>()?;
        let assets = worst_case_scenario_assets::<T>(a);

        // nft params
        let nft_params = worst_case_scenario_video_nft_issuance_params::<T>(d);

        let params = VideoCreationParameters::<T> {
            assets: Some(assets),
            meta: None,
            auto_issue_nft: Some(nft_params.clone()),
            expected_video_state_bloat_bond: video_state_bloat_bond,
            expected_data_object_state_bloat_bond: data_object_state_bloat_bond,
            channel_bag_witness: channel_bag_witness::<T>(channel_id)?,
        };
        let video_id = Pallet::<T>::next_video_id();
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
        let video = Pallet::<T>::video_by_id(video_id);
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
        assert_eq!(video.video_state_bloat_bond, video_state_bloat_bond);
        assert_last_event::<T>(Event::<T>::VideoCreated(
            actor,
            channel_id,
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
}
