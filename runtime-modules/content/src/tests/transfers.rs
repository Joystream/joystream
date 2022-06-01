#![cfg(test)]
use super::fixtures::*;
use super::mock::*;
use crate::tests::curators::add_curator_to_new_group;
use crate::*;
use frame_system::RawOrigin;
use sp_core::sp_std::iter::FromIterator;
use sp_std::collections::btree_map::BTreeMap;
use strum::IntoEnumIterator;

#[test]
fn update_channel_transfer_status_ok_with_status_changed() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();

        UpdateChannelTransferStatusFixture::default().call_and_assert(Ok(()));

        assert!(matches!(
            Content::channel_by_id(ChannelId::one()).transfer_status,
            ChannelTransferStatus::<_, _, _, _>::PendingTransfer(_)
        ))
    })
}

#[test]
fn activate_channel_transfer_status_ok_with_channel_status_updated_correctly() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();

        UpdateChannelTransferStatusFixture::default().call_and_assert(Ok(()));

        assert_eq!(
            Content::channel_by_id(ChannelId::one()).transfer_status,
            ChannelTransferStatus::PendingTransfer::<_, _, _, _>(PendingTransfer::<_, _, _, _> {
                new_owner: ChannelOwner::Member(SECOND_MEMBER_ID),
                transfer_params: TransferParameters::<_, _, _> {
                    transfer_id: Some(TransferId::one()),
                    price: DEFAULT_CHANNEL_TRANSFER_PRICE,
                    new_collaborators: BTreeMap::new(),
                }
            })
        )
    })
}

#[test]
fn update_channel_transfer_status_fails_with_invalid_channel_id() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        let invalid_channel_id = Content::next_channel_id();

        UpdateChannelTransferStatusFixture::default()
            .with_channel_id(invalid_channel_id)
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()))
    })
}

#[test]
fn update_channel_transfer_status_fails_with_invalid_origin() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        UpdateChannelTransferStatusFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin))
    })
}

#[test]
fn update_channel_transfer_status_fails_with_member_actor() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        UpdateChannelTransferStatusFixture::default()
            .with_actor(ContentActor::Member(UNAUTHORIZED_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()))
    })
}

#[test]
fn update_channel_transfer_status_fails_with_invalid_collaborators() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        let invalid_member_id = 111;
        UpdateChannelTransferStatusFixture::default()
            .with_collaborators(BTreeMap::from_iter(vec![(
                invalid_member_id,
                BTreeSet::new(),
            )]))
            .call_and_assert(Err(Error::<Test>::InvalidMemberProvided.into()))
    })
}

#[test]
fn update_channel_transfer_status_fails_with_non_channel_owner() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        let curator_group_id = add_curator_to_new_group(
            DEFAULT_CURATOR_ID,
            &[ChannelActionPermission::TransferChannel],
        );

        UpdateChannelTransferStatusFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_CURATOR_ACCOUNT_ID))
            .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
fn accept_transfer_status_fails_with_invalid_origin() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        UpdateChannelTransferStatusFixture::default()
            .with_new_member_channel_owner(DEFAULT_MEMBER_ID)
            .call_and_assert(Ok(()));

        AcceptChannelTransferFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin))
    })
}

#[test]
fn accept_transfer_status_succeeds() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        let new_collaborators: BTreeMap<MemberId, ChannelAgentPermissions> = BTreeMap::from_iter(
            vec![(SECOND_MEMBER_ID, ChannelActionPermission::iter().collect())],
        );

        UpdateChannelTransferStatusFixture::default()
            .with_new_member_channel_owner(DEFAULT_MEMBER_ID)
            .with_collaborators(new_collaborators.clone())
            .call_and_assert(Ok(()));
        AcceptChannelTransferFixture::default()
            .with_collaborators(new_collaborators)
            .call_and_assert(Ok(()));
    })
}

#[test]
fn accept_transfer_status_fails_with_invalid_commitment_params() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        UpdateChannelTransferStatusFixture::default()
            .with_new_member_channel_owner(DEFAULT_MEMBER_ID)
            .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
            .call_and_assert(Ok(()));

        AcceptChannelTransferFixture::default()
            .with_transfer_params(TransferParameters {
                price: DEFAULT_CHANNEL_TRANSFER_PRICE + 1,
                ..Default::default()
            })
            .call_and_assert(Err(
                Error::<Test>::InvalidChannelTransferCommitmentParams.into()
            ))
    })
}

#[test]
fn accept_transfer_status_fails_with_invalid_channel_id() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        let invalid_channel_id = Content::next_channel_id();

        AcceptChannelTransferFixture::default()
            .with_channel_id(invalid_channel_id)
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()))
    })
}

#[test]
fn accept_transfer_status_fails_with_invalid_status() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        AcceptChannelTransferFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidChannelTransferStatus.into()))
    })
}

#[test]
fn accept_transfer_status_fails_with_non_channel_owner() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();

        UpdateChannelTransferStatusFixture::default()
            .with_new_member_channel_owner(SECOND_MEMBER_ID)
            .call_and_assert(Ok(()));

        AcceptChannelTransferFixture::default()
            .with_origin(RawOrigin::Signed(DEFAULT_CURATOR_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()))
    })
}

#[test]
fn accept_transfer_status_fails_with_invalid_balance_for_members() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        let balance_pre = Balances::<Test>::usable_balance(&DEFAULT_MEMBER_ACCOUNT_ID);
        let price = balance_pre.saturating_add(DEFAULT_CHANNEL_TRANSFER_PRICE);
        UpdateChannelTransferStatusFixture::default()
            .with_new_member_channel_owner(SECOND_MEMBER_ID)
            .with_price(price)
            .call_and_assert(Ok(()));

        AcceptChannelTransferFixture::default()
            .with_origin(RawOrigin::Signed(SECOND_MEMBER_ACCOUNT_ID))
            .with_price(price)
            .call_and_assert(Err(Error::<Test>::InsufficientBalanceForTransfer.into()))
    })
}

#[test]
fn accept_transfer_status_fails_with_invalid_balance_for_curator_groups() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel().setup();

        UpdateChannelTransferStatusFixture::default()
            .with_origin(RawOrigin::Signed(LEAD_ACCOUNT_ID))
            .with_new_channel_owner(ChannelOwner::CuratorGroup(CuratorGroupId::one()))
            .with_actor(ContentActor::Lead)
            .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
            .call_and_assert(Ok(()));

        <Test as Config>::ContentWorkingGroup::set_budget(0u64);

        AcceptChannelTransferFixture::default()
            .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
            .with_origin(RawOrigin::Signed(LEAD_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::InsufficientBalanceForTransfer.into()));
    })
}

#[test]
fn accept_transfer_status_succeeds_for_members_with_price() {
    ExtBuilder::default()
        .build_with_balances(vec![(
            SECOND_MEMBER_ACCOUNT_ID,
            DEFAULT_CHANNEL_TRANSFER_PRICE,
        )])
        .execute_with(|| {
            ContentTest::with_member_channel().setup();
            UpdateChannelTransferStatusFixture::default()
                .with_new_member_channel_owner(SECOND_MEMBER_ID)
                .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
                .call_and_assert(Ok(()));
            let balance_pre = Balances::<Test>::usable_balance(&DEFAULT_MEMBER_ACCOUNT_ID);

            AcceptChannelTransferFixture::default()
                .with_origin(RawOrigin::Signed(SECOND_MEMBER_ACCOUNT_ID))
                .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
                .call_and_assert(Ok(()));

            assert_eq!(
                (
                    Balances::<Test>::usable_balance(&DEFAULT_MEMBER_ACCOUNT_ID),
                    Balances::<Test>::usable_balance(&SECOND_MEMBER_ACCOUNT_ID)
                ),
                (
                    balance_pre.saturating_add(DEFAULT_CHANNEL_TRANSFER_PRICE),
                    BalanceOf::<Test>::zero(),
                )
            );
        })
}

#[test]
fn accept_transfer_status_succeeds_for_curators_to_members_with_price() {
    ExtBuilder::default()
        .build_with_balances(vec![(
            SECOND_MEMBER_ACCOUNT_ID,
            DEFAULT_CHANNEL_TRANSFER_PRICE,
        )])
        .execute_with(|| {
            ContentTest::with_curator_channel().setup();
            UpdateChannelTransferStatusFixture::default()
                .with_origin(RawOrigin::Signed(LEAD_ACCOUNT_ID))
                .with_new_member_channel_owner(SECOND_MEMBER_ID)
                .with_actor(ContentActor::Lead)
                .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
                .call_and_assert(Ok(()));
            let group_balance_pre = <Test as Config>::ContentWorkingGroup::get_budget();

<<<<<<< HEAD
            AcceptChannelTransferFixture::default()
                .with_origin(RawOrigin::Signed(SECOND_MEMBER_ACCOUNT_ID))
                .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
                .call_and_assert(Ok(()));
=======
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel(DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND, &[]);
>>>>>>> 94c4c03c55 (introduce_channel_state_bloat_bond_#3511)

            assert_eq!(
                (
                    <Test as Config>::ContentWorkingGroup::get_budget(),
                    Balances::<Test>::usable_balance(&SECOND_MEMBER_ACCOUNT_ID)
                ),
                (
                    group_balance_pre.saturating_add(DEFAULT_CHANNEL_TRANSFER_PRICE),
                    BalanceOf::<Test>::zero()
                ),
            );
        })
}

#[test]
fn accept_transfer_status_succeeds_for_members_to_curators_with_price() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        UpdateChannelTransferStatusFixture::default()
            .with_new_channel_owner(ChannelOwner::CuratorGroup(CuratorGroupId::one()))
            .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
            .call_and_assert(Ok(()));
        let member_balance_pre = Balances::<Test>::usable_balance(&DEFAULT_MEMBER_ACCOUNT_ID);
        <Test as Config>::ContentWorkingGroup::set_budget(DEFAULT_CHANNEL_TRANSFER_PRICE);

        AcceptChannelTransferFixture::default()
            .with_origin(RawOrigin::Signed(LEAD_ACCOUNT_ID))
            .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
            .call_and_assert(Ok(()));

        assert_eq!(
            (
                <Test as Config>::ContentWorkingGroup::get_budget(),
                Balances::<Test>::usable_balance(&DEFAULT_MEMBER_ACCOUNT_ID),
            ),
            (
                BalanceOf::<Test>::zero(),
                member_balance_pre.saturating_add(DEFAULT_CHANNEL_TRANSFER_PRICE)
            )
        );
    })
}

#[test]
fn accept_channel_transfer_fails_with_invalid_transfer_id() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        UpdateChannelTransferStatusFixture::default()
            .with_new_member_channel_owner(SECOND_MEMBER_ID)
            .call_and_assert(Ok(()));

        AcceptChannelTransferFixture::default()
            .with_origin(RawOrigin::Signed(SECOND_MEMBER_ACCOUNT_ID))
            .with_transfer_id(TransferId::from(2u32))
            .call_and_assert(Err(
                Error::<Test>::InvalidChannelTransferCommitmentParams.into()
            ))
    })
}

#[test]
fn update_channel_transfer_ok_with_status_reset() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        UpdateChannelTransferStatusFixture::default()
            .with_new_member_channel_owner(SECOND_MEMBER_ID)
            .call_and_assert(Ok(()));

        UpdateChannelTransferStatusFixture::default()
            .with_transfer_status(ChannelTransferStatus::NoActiveTransfer)
            .call_and_assert(Ok(()));
    })
}
