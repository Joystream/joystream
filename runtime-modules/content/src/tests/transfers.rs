#![cfg(test)]
use super::curators::create_curator_group;
use super::fixtures::*;
use super::mock::*;
use crate::*;
use frame_system::RawOrigin;
use sp_core::sp_std::iter::FromIterator;
use sp_std::collections::btree_map::BTreeMap;
use strum::IntoEnumIterator;

// -- Initialize channel transfer ---------------------------------------------------

#[test]
fn initialize_channel_transfer_ok_with_status_correctly_changed() {
    let new_collaborators = BTreeMap::from_iter(vec![(
        SECOND_MEMBER_ID,
        ChannelActionPermission::iter().collect(),
    )]);
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();

        InitializeChannelTransferFixture::default()
            .with_collaborators(new_collaborators.clone())
            .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
            .call_and_assert(Ok(()));

        assert_eq!(
            Content::channel_by_id(ChannelId::one()).transfer_status,
            ChannelTransferStatus::PendingTransfer(PendingTransfer {
                new_owner: ChannelOwner::Member(SECOND_MEMBER_ID),
                transfer_params: TransferCommitmentParameters {
                    transfer_id: TransferId::one(),
                    price: DEFAULT_CHANNEL_TRANSFER_PRICE,
                    new_collaborators: try_into_stored_collaborators_map::<Test>(
                        &new_collaborators
                    )
                    .unwrap(),
                }
            }),
            "transfer parameters not correctly updated when activating a transfer"
        );
    })
}

#[test]
fn initialize_channel_transfer_ok_with_event_deposited() {
    let new_collaborators = BTreeMap::from_iter(vec![(
        SECOND_MEMBER_ID,
        ChannelActionPermission::iter().collect(),
    )]);
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();

        InitializeChannelTransferFixture::default()
            .with_collaborators(new_collaborators.clone())
            .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
            .call_and_assert(Ok(()));

        last_event_eq!(RawEvent::InitializedChannelTransfer(
            ChannelId::one(),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            PendingTransferOf::<Test> {
                new_owner: ChannelOwner::Member(SECOND_MEMBER_ID),
                transfer_params: TransferCommitmentOf::<Test> {
                    price: DEFAULT_CHANNEL_TRANSFER_PRICE,
                    new_collaborators: try_into_stored_collaborators_map::<Test>(
                        &new_collaborators
                    )
                    .unwrap(),
                    transfer_id: TransferId::one(),
                }
            }
        ));
    })
}

#[test]
fn initialize_channel_transfer_ok_with_transfer_id_updated_correctly() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();

        InitializeChannelTransferFixture::default().call_and_assert(Ok(()));

        assert_eq!(
            Content::next_transfer_id(),
            TransferId::from(2u32),
            "transfer nonce has not been updated"
        );
    })
}

#[test]
fn initialize_channel_transfer_fails_during_upcoming_revenue_split() {
    pub const SPLIT_STARTING_BLOCK: u64 = 10;
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        increase_account_balance_helper(
            ContentTreasury::<Test>::account_for_channel(ChannelId::one()),
            DEFAULT_PAYOUT_EARNED,
        );
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        IssueRevenueSplitFixture::default()
            .with_starting_block(SPLIT_STARTING_BLOCK)
            .call_and_assert(Ok(()));

        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(THIRD_MEMBER_ID)
            .call_and_assert(Err(
                Error::<Test>::ChannelTransfersBlockedDuringRevenueSplits.into(),
            ));
    })
}

#[test]
fn initialize_channel_transfer_fails_during_ongoing_revenue_split() {
    pub const SPLIT_STARTING_BLOCK: u64 = 10;
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        increase_account_balance_helper(
            ContentTreasury::<Test>::account_for_channel(ChannelId::one()),
            DEFAULT_PAYOUT_EARNED,
        );
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        IssueRevenueSplitFixture::default()
            .with_starting_block(SPLIT_STARTING_BLOCK)
            .call_and_assert(Ok(()));

        run_to_block(SPLIT_STARTING_BLOCK + 1);

        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(THIRD_MEMBER_ID)
            .call_and_assert(Err(
                Error::<Test>::ChannelTransfersBlockedDuringRevenueSplits.into(),
            ));
    })
}

#[test]
fn initialize_channel_transfer_fails_during_unfinalized_revenue_split() {
    pub const SPLIT_STARTING_BLOCK: u64 = 10;
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        increase_account_balance_helper(
            ContentTreasury::<Test>::account_for_channel(ChannelId::one()),
            DEFAULT_PAYOUT_EARNED,
        );
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        IssueRevenueSplitFixture::default()
            .with_starting_block(SPLIT_STARTING_BLOCK)
            .call_and_assert(Ok(()));

        run_to_block(SPLIT_STARTING_BLOCK + DEFAULT_REVENUE_SPLIT_DURATION + 1);

        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(THIRD_MEMBER_ID)
            .call_and_assert(Err(
                Error::<Test>::ChannelTransfersBlockedDuringRevenueSplits.into(),
            ));
    })
}

#[test]
fn initialize_channel_transfer_fails_during_upcoming_token_sales() {
    pub const SALE_STARTING_BLOCK: u64 = 10;
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        InitCreatorTokenSaleFixture::default()
            .with_start_block(SALE_STARTING_BLOCK)
            .call_and_assert(Ok(()));
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(THIRD_MEMBER_ID)
            .call_and_assert(Err(
                Error::<Test>::ChannelTransfersBlockedDuringTokenSales.into()
            ));
    })
}

#[test]
fn initialize_channel_transfer_fails_during_ongoing_token_sales() {
    pub const SALE_STARTING_BLOCK: u64 = 10;
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        InitCreatorTokenSaleFixture::default()
            .with_start_block(SALE_STARTING_BLOCK)
            .call_and_assert(Ok(()));
        run_to_block(SALE_STARTING_BLOCK + 1);
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(THIRD_MEMBER_ID)
            .call_and_assert(Err(
                Error::<Test>::ChannelTransfersBlockedDuringTokenSales.into()
            ));
    })
}

#[test]
fn initialize_channel_transfer_fails_when_amm_is_active() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        ActivateAmmFixture::default().call_and_assert(Ok(()));
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(THIRD_MEMBER_ID)
            .call_and_assert(Err(
                Error::<Test>::ChannelTransfersBlockedDuringActiveAmm.into()
            ));
    })
}

#[test]
fn initialize_channel_transfer_fails_during_unfinalized_token_sales() {
    pub const SALE_STARTING_BLOCK: u64 = 10;
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        IssueCreatorTokenFixture::default().call_and_assert(Ok(()));
        InitCreatorTokenSaleFixture::default()
            .with_start_block(SALE_STARTING_BLOCK)
            .call_and_assert(Ok(()));
        run_to_block(SALE_STARTING_BLOCK + DEFAULT_CREATOR_TOKEN_SALE_DURATION + 1);
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(THIRD_MEMBER_ID)
            .call_and_assert(Err(
                Error::<Test>::ChannelTransfersBlockedDuringTokenSales.into()
            ));
    })
}

#[test]
fn initialize_channel_transfer_fails_with_invalid_channel_id() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        let invalid_channel_id = Content::next_channel_id();

        InitializeChannelTransferFixture::default()
            .with_channel_id(invalid_channel_id)
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()))
    })
}

#[test]
fn initialize_channel_transfer_fails_with_transfer_already_started() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        InitializeChannelTransferFixture::default().call_and_assert(Ok(()));

        InitializeChannelTransferFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidChannelTransferStatus.into()))
    })
}

#[test]
fn initialize_channel_transfer_fails_with_invalid_origin() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        InitializeChannelTransferFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin))
    })
}

#[test]
fn initialize_channel_transfer_fails_with_invalid_collaborators() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        let invalid_member_id = 111;
        InitializeChannelTransferFixture::default()
            .with_collaborators(BTreeMap::from_iter(vec![(
                invalid_member_id,
                BTreeSet::new(),
            )]))
            .call_and_assert(Err(Error::<Test>::InvalidMemberProvided.into()))
    })
}

#[test]
fn initialize_channel_transfer_fails_with_invalid_new_member_owner() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        let invalid_member_id = 111;
        InitializeChannelTransferFixture::default()
            .with_new_channel_owner(ChannelOwner::Member(invalid_member_id))
            .call_and_assert(Err(Error::<Test>::ChannelOwnerMemberDoesNotExist.into()))
    })
}

#[test]
fn initialize_channel_transfer_fails_with_invalid_new_curator_group_owner() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        let invalid_curator_group_id = 111;
        InitializeChannelTransferFixture::default()
            .with_new_channel_owner(ChannelOwner::CuratorGroup(invalid_curator_group_id))
            .call_and_assert(Err(
                Error::<Test>::ChannelOwnerCuratorGroupDoesNotExist.into()
            ))
    })
}

#[test]
fn accept_transfer_status_fails_with_invalid_origin() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(DEFAULT_MEMBER_ID)
            .call_and_assert(Ok(()));

        AcceptChannelTransferFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin))
    })
}

// -- Accept transfer status ---------------------------------------------------

#[test]
fn accept_transfer_status_ok() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        let new_collaborators = BTreeMap::from_iter(vec![(
            SECOND_MEMBER_ID,
            ChannelActionPermission::iter().collect(),
        )]);
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(DEFAULT_MEMBER_ID)
            .with_collaborators(new_collaborators.clone())
            .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
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
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(DEFAULT_MEMBER_ID)
            .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
            .call_and_assert(Ok(()));

        AcceptChannelTransferFixture::default()
            .with_transfer_params(TransferCommitmentParameters {
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

        InitializeChannelTransferFixture::default()
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
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(SECOND_MEMBER_ID)
            .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
            .call_and_assert(Ok(()));

        increase_account_balance_helper(
            SECOND_MEMBER_ACCOUNT_ID,
            ed() + DEFAULT_CHANNEL_TRANSFER_PRICE - 1,
        );

        AcceptChannelTransferFixture::default()
            .with_origin(RawOrigin::Signed(SECOND_MEMBER_ACCOUNT_ID))
            .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
            .call_and_assert(Err(Error::<Test>::InsufficientBalanceForTransfer.into()))
    })
}

#[test]
fn accept_transfer_status_fails_with_locked_balance_for_members() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(SECOND_MEMBER_ID)
            .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
            .call_and_assert(Ok(()));

        increase_account_balance_helper(
            SECOND_MEMBER_ACCOUNT_ID,
            ed() + DEFAULT_CHANNEL_TRANSFER_PRICE,
        );
        set_invitation_lock(&SECOND_MEMBER_ACCOUNT_ID, ed() + 1);

        AcceptChannelTransferFixture::default()
            .with_origin(RawOrigin::Signed(SECOND_MEMBER_ACCOUNT_ID))
            .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
            .call_and_assert(Err(Error::<Test>::InsufficientBalanceForTransfer.into()))
    })
}

#[test]
fn accept_transfer_status_fails_with_invalid_balance_for_curator_groups() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel().setup();
        InitializeChannelTransferFixture::default()
            .with_origin(RawOrigin::Signed(LEAD_ACCOUNT_ID))
            .with_new_channel_owner(ChannelOwner::CuratorGroup(CuratorGroupId::one()))
            .with_actor(ContentActor::Lead)
            .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
            .call_and_assert(Ok(()));

        <Test as Config>::ContentWorkingGroup::set_budget(DEFAULT_CHANNEL_TRANSFER_PRICE - 1);

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
            ed() + DEFAULT_CHANNEL_TRANSFER_PRICE,
        )])
        .execute_with(|| {
            ContentTest::with_member_channel().setup();
            InitializeChannelTransferFixture::default()
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
                    ed(),
                )
            );
        })
}

#[test]
fn accept_transfer_status_succeeds_for_curators_to_members_with_price() {
    ExtBuilder::default()
        .build_with_balances(vec![(
            SECOND_MEMBER_ACCOUNT_ID,
            ed() + DEFAULT_CHANNEL_TRANSFER_PRICE,
        )])
        .execute_with(|| {
            ContentTest::with_curator_channel().setup();
            InitializeChannelTransferFixture::default()
                .with_origin(RawOrigin::Signed(LEAD_ACCOUNT_ID))
                .with_new_member_channel_owner(SECOND_MEMBER_ID)
                .with_actor(ContentActor::Lead)
                .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
                .call_and_assert(Ok(()));
            let group_balance_pre = <Test as Config>::ContentWorkingGroup::get_budget();

            AcceptChannelTransferFixture::default()
                .with_origin(RawOrigin::Signed(SECOND_MEMBER_ACCOUNT_ID))
                .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
                .call_and_assert(Ok(()));

            assert_eq!(
                (
                    <Test as Config>::ContentWorkingGroup::get_budget(),
                    Balances::<Test>::usable_balance(&SECOND_MEMBER_ACCOUNT_ID)
                ),
                (
                    group_balance_pre.saturating_add(DEFAULT_CHANNEL_TRANSFER_PRICE),
                    ed()
                ),
            );
        })
}

#[test]
fn accept_transfer_status_succeeds_for_members_to_curators_with_price() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        create_curator_group(BTreeMap::new());
        InitializeChannelTransferFixture::default()
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
        InitializeChannelTransferFixture::default()
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
fn cancel_channel_transfer_fails_with_invalid_channel_id() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(SECOND_MEMBER_ID)
            .call_and_assert(Ok(()));

        CancelChannelTransferFixture::default()
            .with_channel_id(ChannelId::from(2u32))
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()))
    })
}

#[test]
fn cancel_channel_transfer_ok_with_status_reset() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(SECOND_MEMBER_ID)
            .call_and_assert(Ok(()));

        CancelChannelTransferFixture::default().call_and_assert(Ok(()));

        assert!(!Content::channel_by_id(ChannelId::one()).has_active_transfer());
    })
}

#[test]
fn cancel_channel_transfer_ok_with_event_deposit() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(SECOND_MEMBER_ID)
            .call_and_assert(Ok(()));

        CancelChannelTransferFixture::default().call_and_assert(Ok(()));

        last_event_eq!(RawEvent::CancelChannelTransfer(
            ChannelId::one(),
            ContentActor::Member(DEFAULT_MEMBER_ID)
        ));
    })
}
