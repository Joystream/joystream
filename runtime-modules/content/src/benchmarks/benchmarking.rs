#![cfg(feature = "runtime-benchmarks")]

use crate::permissions::*;
use crate::types::{
    ChannelOwner, ChannelTransferStatus, InitTransferParametersOf, PendingTransfer,
    TransferCommitmentParameters, TransferCommitmentWitnessOf, ModuleAccount,
};
use crate::Module as Pallet;
use storage::Pallet as Storage;
use balances::Pallet as Balances;
use crate::{Call, ChannelById, Config, Event};
use frame_benchmarking::benchmarks;
use frame_support::storage::StorageMap;
use frame_support::traits::{Get, Currency};
use sp_runtime::traits::Hash;
use frame_system::RawOrigin;
use sp_arithmetic::traits::{One, Saturating};
use sp_runtime::SaturatedConversion;
use sp_std::convert::TryInto;

use super::{
    assert_last_event, clone_curator_group, generate_channel_creation_params,
    insert_content_leader, insert_curator, insert_distribution_leader, insert_storage_leader,
    member_funded_account, setup_worst_case_curator_group_with_curators,
    setup_worst_case_scenario_curator_channel, worst_case_channel_agent_permissions,
    worst_case_content_moderation_actions_set, worst_case_scenario_collaborators,
    ContentWorkingGroupInstance, CreateAccountId, RuntimeConfig, CURATOR_IDS, DEFAULT_MEMBER_ID,
    MEMBER_IDS,
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
    ====================================== CHANNEL TRANSFERS ======================================
    ===============================================================================================
    */

    initialize_channel_transfer {
        let a in 0 .. (T::MaxNumberOfCollaboratorsPerChannel::get() as u32);
        let (_, new_owner_id) = member_funded_account::<T>(MEMBER_IDS[2]);
        let new_owner = ChannelOwner::Member(new_owner_id);
        let new_collaborators = worst_case_scenario_collaborators::<T>(
            T::MaxNumberOfCollaboratorsPerChannel::get(), // start id
            a // number of collaborators
        );
        let price = <T as balances::Config>::Balance::one();
        let (channel_id, group_id, _, curator_id, curator_account_id) =
            setup_worst_case_scenario_curator_channel::<T>(false)?;
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
            setup_worst_case_scenario_curator_channel::<T>(true)?;
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
            setup_worst_case_scenario_curator_channel::<T>(false)?;
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

    // ================================================================================
    // ======================== CHANNEL PAYOUTS & WITHDRAWALS =========================
    // ================================================================================

    update_channel_payouts {
        let origin = RawOrigin::Root;
        let (account_id, _) = member_funded_account::<T>(1);
        let hash = <<T as frame_system::Config>::Hashing as Hash>::hash(&"test".encode());
        let params = crate::UpdateChannelPayoutsParameters::<T> {
            commitment: Some(hash.clone()),
            payload: Some(crate::ChannelPayoutsPayloadParameters::<T>{
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

    withdraw_from_channel_balance {
        let lead_account = insert_content_leader::<T>();
        let group_id = setup_worst_case_curator_group_with_curators::<T>(
            T::MaxNumberOfCuratorsPerGroup::get()
        )?;
        let group = Pallet::<T>::curator_group_by_id(group_id);

        let (channel_owner_account_id, channel_owner_member_id) = member_funded_account::<T>(DEFAULT_MEMBER_ID);
        let origin = RawOrigin::Signed(channel_owner_account_id.clone());
        let owner = crate::ChannelOwner::Member(channel_owner_member_id);
        let (channel_id, _,_,_,_) = setup_worst_case_scenario_curator_channel::<T>(false)?;
        Pallet::<T>::set_channel_paused_features_as_moderator(
            RawOrigin::Signed(lead_account).into(),
            crate::ContentActor::Lead,
            channel_id,
            super::all_channel_pausable_features_except(crate::PausableChannelFeature::ChannelFundsTransfer),
            b"reason".to_vec(),
        ).unwrap();

        let channel_account_id = crate::ContentTreasury::<T>::account_for_channel(channel_id);
        let amount = <T as balances::Config>::Balance::from(100u32);
        let _ = Balances::<T>::deposit_creating(&channel_account_id, amount + T::ExistentialDeposit::get());

        let balance_pre = Balances::<T>::usable_balance(&channel_owner_account_id);
        let actor = crate::ContentActor::Member(channel_owner_member_id);
    }: _ (origin, actor, channel_id, amount)
        verify {
            assert_eq!(Balances::<T>::usable_balance(channel_owner_account_id), balance_pre.saturating_add(amount));
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

    #[test]
    fn update_channel_payouts() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_update_channel_payouts());
        })
    }

    #[test]
    fn withdraw_from_channel_balance() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_withdraw_from_channel_balance());
        })
    }

}
