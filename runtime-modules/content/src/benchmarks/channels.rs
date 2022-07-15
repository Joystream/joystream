#![cfg(feature = "runtime-benchmarks")]

use crate::permissions::*;
use crate::types::ChannelOwner;
use crate::Module as Pallet;
use crate::{Call, ChannelById, Config, Event};
use frame_benchmarking::benchmarks;
use frame_support::storage::StorageMap;
use frame_support::traits::Get;
use frame_system::RawOrigin;
use sp_arithmetic::traits::{One, Saturating};
use sp_runtime::SaturatedConversion;

use super::{
    assert_last_event, generate_channel_creation_params, insert_content_leader, insert_curator,
    insert_distribution_leader, insert_storage_leader, member_funded_account,
    setup_worst_case_curator_group_with_curators, worst_case_channel_agent_permissions,
    worst_case_content_moderation_actions_set, ContentWorkingGroupInstance, CreateAccountId,
    DistributionWorkingGroupInstance, StorageWorkingGroupInstance, CURATOR_IDS, DEFAULT_MEMBER_ID,
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
              T: working_group::Config<ContentWorkingGroupInstance>,
              T::AccountId: CreateAccountId,
              T: Config ,
    }

    create_channel {

        let a in 1 .. MAX_COLABORATOR_IDS as u32; //max colaborators

        let b in (T::StorageBucketsPerBagValueConstraint::get().min as u32) ..
            (T::StorageBucketsPerBagValueConstraint::get().max() as u32);

        let c in (T::DistributionBucketsPerBagValueConstraint::get().min as u32) ..
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
        let curator_id = insert_curator::<T>(
            CURATOR_IDS[T::MaxNumberOfCuratorsPerGroup::get() as usize - 1]
        );
        let permissions = worst_case_channel_agent_permissions();
        let group_id = setup_worst_case_curator_group_with_curators::<T>(
            T::MaxNumberOfCuratorsPerGroup::get() - 1
        )?;
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
}
