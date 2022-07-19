#![cfg(feature = "runtime-benchmarks")]

use super::{
    generate_channel_creation_params, insert_distribution_leader, insert_storage_leader,
    member_funded_account, ContentWorkingGroupInstance, CreateAccountId,
    DistributionWorkingGroupInstance, StorageWorkingGroupInstance, CONTENT_WG_LEADER_ACCOUNT_ID,
    DEFAULT_MEMBER_ID, MAX_COLLABORATOR_IDS, MAX_LEVELS, MAX_OBJ_NUMBER,
};
use crate::types::{ChannelOwner, ModuleAccount};
use crate::Module as Pallet;
use crate::{Call, ChannelById, Config};
use codec::Encode;
use frame_benchmarking::benchmarks;
use frame_support::storage::StorageMap;
use frame_support::traits::{Get, Currency};
use frame_system::RawOrigin;
use sp_arithmetic::traits::{One, Saturating};
use sp_runtime::traits::Hash;
use storage::Pallet as Storage;
use balances::Pallet as Balances;

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
              T: frame_system::Config,
    }

    create_channel {

        let a in 1 .. MAX_COLLABORATOR_IDS as u32; //max colaborators

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
        let i in 1..(T::MaxNumberOfCuratorsPerGroup::get() as u32);
        let j in 1..(MAX_COLLABORATOR_IDS as u32); // max collaborators
        let k in 1..(MAX_LEVELS as u32); // max permission levels

        let (channel_owner_account_id, channel_owner_member_id) =
            member_funded_account::<T>(DEFAULT_MEMBER_ID);
        let origin = RawOrigin::Signed(channel_owner_account_id.clone());
        let owner = crate::ChannelOwner::Member(channel_owner_member_id);
        let actor = crate::ContentActor::Member(channel_owner_member_id);
        let params = generate_channel_creation_params::<T>(
            insert_storage_leader::<T>(),
            insert_distribution_leader::<T>(),
            j,
            T::StorageBucketsPerBagValueConstraint::get().max() as u32,
            T::DistributionBucketsPerBagValueConstraint::get().max() as u32,
            MAX_OBJ_NUMBER,
            T::MaxDataObjectSize::get(),
        );
        let lead_account_id = super::insert_leader::<T, ContentWorkingGroupInstance>(CONTENT_WG_LEADER_ACCOUNT_ID);
        let channel_id = Pallet::<T>::next_channel_id();
        let curator_group_id = Pallet::<T>::next_curator_group_id();
        let curator_permissions = super::generate_permissions_by_level::<T>(k as u8);

        Pallet::<T>::create_channel(origin.clone().into(), owner.clone(), params)?;
        Pallet::<T>::create_curator_group(
            RawOrigin::Signed(lead_account_id.clone()).into(),
            true,
            curator_permissions,
        )?;

        (0..i).for_each(|curator_id| {
           Pallet::<T>::add_curator_to_group(
               RawOrigin::Signed(lead_account_id.clone()).into(),
               curator_group_id,
               T::CuratorId::from(curator_id as u8),
               crate::BTreeSet::new(),
           );
        });
        Pallet::<T>::set_channel_paused_features_as_moderator(
            RawOrigin::Signed(lead_account_id).into(),
            actor.clone(),
            channel_id,
            super::all_channel_pausable_features_except(crate::PausableChannelFeature::CreatorCashout),
            b"reason".to_vec(),
        )?;

        let channel_account_id = crate::ContentTreasury::<T>::account_for_channel(channel_id);
        let amount = <T as balances::Config>::Balance::from(100u32);
        let _ = Balances::<T>::deposit_creating(&channel_account_id, amount);
        let balance_pre = Balances::<T>::usable_balance(&channel_account_id);

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
    fn withdraw_from_channel_balance() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_withdraw_from_channel_balance());
        });
    }


    #[test]
    fn update_channel_payouts() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_update_channel_payouts());
        });
    }

    #[test]
    fn create_channel() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_create_channel());
        });
    }
}
