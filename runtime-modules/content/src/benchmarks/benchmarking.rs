#![cfg(feature = "runtime-benchmarks")]

use crate::{
    types::{ChannelAgentPermissions, ChannelOwner},
    Call, ChannelById, ChannelUpdateParameters, Config, ContentActor, Event, Module as Pallet,
    StorageAssets,
};
use frame_benchmarking::benchmarks;
use frame_support::{storage::StorageMap, traits::Get, IterableStorageDoubleMap, StorageValue};
use frame_system::RawOrigin;
use project_token::types::{
    BlockRate, JoyBalanceOf, PatronageData, RevenueSplitStateOf, TokenBalanceOf, TokenDataOf,
    TokenSale, TransferPolicy, Transfers, Validated,
};
use project_token::BloatBond as TokenAccountBloatBond;
use project_token::{AccountInfoByTokenAndMember, TokenInfoById};
use sp_arithmetic::traits::{One, Zero};
use sp_std::{
    cmp::min,
    collections::{btree_map::BTreeMap, btree_set::BTreeSet},
    vec,
};
use storage::{DataObjectStorage, Module as Storage};

use super::{
    assert_last_event, channel_bag_witness, create_data_object_candidates_helper,
    create_token_issuance_params, curator_member_id, default_vesting_schedule_params,
    generate_channel_creation_params, insert_content_leader, insert_distribution_leader,
    insert_storage_leader, issue_creator_token_with_worst_case_scenario_owner,
    setup_worst_case_curator_group_with_curators, setup_worst_case_scenario_curator_channel,
    worst_case_channel_agent_permissions, worst_case_scenario_initial_allocation,
    worst_case_scenario_issuer_transfer_outputs, worst_case_scenario_token_sale_params,
    ContentWorkingGroupInstance, CreateAccountId, DistributionWorkingGroupInstance,
    StorageWorkingGroupInstance, DEFAULT_CRT_OWNER_ISSUANCE, DEFAULT_CRT_SALE_CAP_PER_MEMBER,
    DEFAULT_CRT_SALE_DURATION, DEFAULT_CRT_SALE_PRICE, DEFAULT_CRT_SALE_UPPER_BOUND,
    MAX_BYTES_METADATA, MAX_CRT_INITIAL_ALLOCATION_MEMBERS, MAX_CRT_ISSUER_TRANSFER_OUTPUTS,
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
            <T as Config>::Event::from(
                Event::<T>::ChannelCreated(
                    channel_id,
                    channel,
                    params
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
            <T as Config>::Event::from(
                Event::<T>::ChannelUpdated(actor,
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
        setup_worst_case_scenario_curator_channel::<T>(a, b, c,).unwrap();

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

    issue_creator_token {
        let a in 1 .. MAX_CRT_INITIAL_ALLOCATION_MEMBERS;

        let (channel_id, group_id, lead_acc_id, curator_id, curator_acc_id) =
            setup_worst_case_scenario_curator_channel::<T>(
                T::MaxNumberOfAssetsPerChannel::get(),
                T::StorageBucketsPerBagValueConstraint::get().max() as u32,
                T::DistributionBucketsPerBagValueConstraint::get().max() as u32
            )?;
        let params = create_token_issuance_params::<T>(worst_case_scenario_initial_allocation::<T>(a));
        let actor = ContentActor::Curator(group_id, curator_id);
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
            setup_worst_case_scenario_curator_channel::<T>(
                T::MaxNumberOfAssetsPerChannel::get(),
                T::StorageBucketsPerBagValueConstraint::get().max() as u32,
                T::DistributionBucketsPerBagValueConstraint::get().max() as u32
            )?;
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
                    T::MaxVestingBalancesPerAccountPerToken::get() as usize
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
            setup_worst_case_scenario_curator_channel::<T>(
                T::MaxNumberOfAssetsPerChannel::get(),
                T::StorageBucketsPerBagValueConstraint::get().max() as u32,
                T::DistributionBucketsPerBagValueConstraint::get().max() as u32
            )?;
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
            setup_worst_case_scenario_curator_channel::<T>(
                T::MaxNumberOfAssetsPerChannel::get(),
                T::StorageBucketsPerBagValueConstraint::get().max() as u32,
                T::DistributionBucketsPerBagValueConstraint::get().max() as u32
            )?;
        let curator_member_id = curator_member_id::<T>(curator_id);
        let origin = RawOrigin::Signed(curator_acc_id.clone());
        let actor = ContentActor::Curator(group_id, curator_id);
        let token_params = create_token_issuance_params::<T>(BTreeMap::new());
        let token_id = project_token::Pallet::<T>::next_token_id();
        Pallet::<T>::issue_creator_token(origin.clone().into(), actor, channel_id, token_params)?;
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
            setup_worst_case_scenario_curator_channel::<T>(
                T::MaxNumberOfAssetsPerChannel::get(),
                T::StorageBucketsPerBagValueConstraint::get().max() as u32,
                T::DistributionBucketsPerBagValueConstraint::get().max() as u32
            )?;
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
        let params = worst_case_scenario_token_sale_params::<T>(a);
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
            T::MaxVestingBalancesPerAccountPerToken::get() as usize
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
    fn issue_creator_token() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_issue_creator_token());
        });
    }

    #[test]
    fn creator_token_issuer_transfer() {
        with_default_mock_builder(|| {
            assert_ok!(Content::test_benchmark_creator_token_issuer_transfer());
        });
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
}
