#![cfg(test)]
use super::fixtures::*;
use super::mock::*;
use crate::*;
use frame_system::RawOrigin;
use sp_core::sp_std::iter::FromIterator;
use sp_std::collections::btree_map::BTreeMap;
use strum::IntoEnumIterator;

// -- Initialize channel transfer ---------------------------------------------------

// TODO: enable after enabling channel transfers
#[ignore]
#[test]
fn initialize_channel_transfer_ok_with_status_correctly_changed() {
    let new_collaborators: BTreeMap<MemberId, ChannelAgentPermissions> =
        BTreeMap::from_iter(vec![(
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
            ChannelTransferStatus::PendingTransfer::<_, _, _, _>(PendingTransfer::<_, _, _, _> {
                new_owner: ChannelOwner::Member(SECOND_MEMBER_ID),
                transfer_params: TransferCommitmentParameters::<_, _, _> {
                    transfer_id: TransferId::one(),
                    price: DEFAULT_CHANNEL_TRANSFER_PRICE,
                    new_collaborators: new_collaborators.clone(),
                }
            }),
            "transfer parameters not correctly updated when activating a transfer"
        );
    })
}

// TODO: enable after enabling channel transfers
#[ignore]
#[test]
fn initialize_channel_transfer_ok_with_event_deposited() {
    let new_collaborators: BTreeMap<MemberId, ChannelAgentPermissions> =
        BTreeMap::from_iter(vec![(
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
                    price: BalanceOf::<Test>::from(DEFAULT_CHANNEL_TRANSFER_PRICE),
                    new_collaborators,
                    transfer_id: TransferId::one(),
                }
            }
        ));
    })
}

// TODO: enable after enabling channel transfers
#[ignore]
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

// TODO: enable after enabling channel transfers
#[ignore]
#[test]
fn initialize_channel_transfer_fails_during_upcoming_revenue_split() {
    pub const SPLIT_STARTING_BLOCK: u64 = 10;
    with_default_mock_builder(|| {
        let ed = <Test as balances::Config>::ExistentialDeposit::get();
        ContentTest::with_member_channel().setup();
        increase_account_balance_helper(
            ContentTreasury::<Test>::account_for_channel(ChannelId::one()),
            DEFAULT_PAYOUT_EARNED
                // TODO: Should be changed to bloat_bond after https://github.com/Joystream/joystream/issues/3511
                .saturating_add(ed.into()),
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

// TODO: Enable after enabling channel transfers
#[ignore]
// TODO: enable after enabling channel transfers
#[ignore]
#[test]
fn initialize_channel_transfer_fails_during_ongoing_revenue_split() {
    pub const SPLIT_STARTING_BLOCK: u64 = 10;
    with_default_mock_builder(|| {
        let ed = <Test as balances::Config>::ExistentialDeposit::get();
        ContentTest::with_member_channel().setup();
        increase_account_balance_helper(
            ContentTreasury::<Test>::account_for_channel(ChannelId::one()),
            DEFAULT_PAYOUT_EARNED
                // TODO: Should be changed to bloat_bond after https://github.com/Joystream/joystream/issues/3511
                .saturating_add(ed.into()),
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

// TODO: Enable after enabling channel transfers
#[ignore]
// TODO: enable after enabling channel transfers
#[ignore]
#[test]
fn initialize_channel_transfer_fails_during_unfinalized_revenue_split() {
    pub const SPLIT_STARTING_BLOCK: u64 = 10;
    with_default_mock_builder(|| {
        let ed = <Test as balances::Config>::ExistentialDeposit::get();
        ContentTest::with_member_channel().setup();
        increase_account_balance_helper(
            ContentTreasury::<Test>::account_for_channel(ChannelId::one()),
            DEFAULT_PAYOUT_EARNED
                // TODO: Should be changed to bloat_bond after https://github.com/Joystream/joystream/issues/3511
                .saturating_add(ed.into()),
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

// TODO: Enable after enabling channel transfers
#[ignore]
// TODO: enable after enabling channel transfers
#[ignore]
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

// TODO: Enable after enabling channel transfers
#[ignore]
// TODO: enable after enabling channel transfers
#[ignore]
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

// TODO: Enable after enabling channel transfers
#[ignore]
// TODO: enable after enabling channel transfers
#[ignore]
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

// TODO: Enable after enabling channel transfers
#[ignore]
// TODO: enable after enabling channel transfers
#[ignore]
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

// TODO: enable after enabling channel transfers
#[ignore]
#[test]
fn initialize_channel_transfer_fails_with_transfer_already_started() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        InitializeChannelTransferFixture::default().call_and_assert(Ok(()));

        InitializeChannelTransferFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidChannelTransferStatus.into()))
    })
}

// TODO: enable after enabling channel transfers
#[ignore]
#[test]
fn initialize_channel_transfer_fails_with_invalid_origin() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        InitializeChannelTransferFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin))
    })
}

// TODO: enable after enabling channel transfers
#[ignore]
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

// TODO: enable after enabling channel transfers
#[ignore]
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

// TODO: enable after enabling channel transfers
#[ignore]
#[test]
fn accept_transfer_status_ok() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        let new_collaborators: BTreeMap<MemberId, ChannelAgentPermissions> = BTreeMap::from_iter(
            vec![(SECOND_MEMBER_ID, ChannelActionPermission::iter().collect())],
        );
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(DEFAULT_MEMBER_ID)
            .with_collaborators(new_collaborators.clone())
            .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
            .call_and_assert(Ok(()));

        AcceptChannelTransferFixture::default()
            .with_collaborators(new_collaborators.clone())
            .call_and_assert(Ok(()));
    })
}

// TODO: enable after enabling channel transfers
#[ignore]
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

// TODO: enable after enabling channel transfers
#[ignore]
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

// TODO: enable after enabling channel transfers
#[ignore]
#[test]
fn accept_transfer_status_fails_with_invalid_status() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        AcceptChannelTransferFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidChannelTransferStatus.into()))
    })
}

// TODO: enable after enabling channel transfers
#[ignore]
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

// TODO: enable after enabling channel transfers
#[ignore]
#[test]
fn accept_transfer_status_fails_with_invalid_balance_for_members() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(SECOND_MEMBER_ID)
            .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
            .call_and_assert(Ok(()));

        AcceptChannelTransferFixture::default()
            .with_origin(RawOrigin::Signed(SECOND_MEMBER_ACCOUNT_ID))
            .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
            .call_and_assert(Err(Error::<Test>::InsufficientBalanceForTransfer.into()))
    })
}

// TODO: enable after enabling channel transfers
#[ignore]
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

        <Test as Config>::ContentWorkingGroup::set_budget(0u64);

        AcceptChannelTransferFixture::default()
            .with_price(DEFAULT_CHANNEL_TRANSFER_PRICE)
            .with_origin(RawOrigin::Signed(LEAD_ACCOUNT_ID))
            .call_and_assert(Err(Error::<Test>::InsufficientBalanceForTransfer.into()));
    })
}

// TODO: enable after enabling channel transfers
#[ignore]
#[test]
fn accept_transfer_status_succeeds_for_members_with_price() {
    ExtBuilder::default()
        .build_with_balances(vec![(
            SECOND_MEMBER_ACCOUNT_ID,
            DEFAULT_CHANNEL_TRANSFER_PRICE,
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
                    BalanceOf::<Test>::zero(),
                )
            );
        })
}

// TODO: enable after enabling channel transfers
#[ignore]
#[test]
fn accept_transfer_status_succeeds_for_curators_to_members_with_price() {
    ExtBuilder::default()
        .build_with_balances(vec![(
            SECOND_MEMBER_ACCOUNT_ID,
            DEFAULT_CHANNEL_TRANSFER_PRICE,
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
                    BalanceOf::<Test>::zero()
                ),
            );
        })
}

// TODO: enable after enabling channel transfers
#[ignore]
#[test]
fn accept_transfer_status_succeeds_for_members_to_curators_with_price() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
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

// TODO: enable after enabling channel transfers
#[ignore]
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

// TODO: enable after enabling channel transfers
#[ignore]
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

// TODO: enable after enabling channel transfers
#[ignore]
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

// TODO: enable after enabling channel transfers
#[ignore]
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
