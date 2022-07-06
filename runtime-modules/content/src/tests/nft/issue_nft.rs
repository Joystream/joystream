#![cfg(test)]
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_noop, assert_ok};

#[test]
fn issue_nft() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Video does not have an nft
        assert_eq!(None, Content::video_by_id(video_id).nft_status);

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        // Runtime tested state after call

        // Ensure nft created succesfully
        let nft_status = Some(OwnedNft::new(
            NftOwner::ChannelOwner,
            None,
            TransactionalStatus::<Test>::Idle,
        ));
        assert_eq!(nft_status, Content::video_by_id(video_id).nft_status);

        // Last event checked
        let nft_issue_params = NftIssuanceParameters::<Test>::default();
        last_event_eq!(RawEvent::NftIssued(
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            nft_issue_params,
        ));
    })
}

#[test]
fn nft_is_issued_with_open_auction_status_successfully() {
    with_default_mock_builder(|| {
        let video_id = 1u64;
        ContentTest::with_member_channel().with_video().setup();

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test> {
                init_transactional_status: InitTransactionalStatus::<Test>::OpenAuction(
                    OpenAuctionParams::<Test> {
                        starting_price: Content::min_starting_price(),
                        bid_lock_duration: Content::min_bid_lock_duration(),
                        ..Default::default()
                    }
                ),
                ..Default::default()
            },
        ));

        assert!(matches!(
            Content::video_by_id(video_id).nft_status,
            Some(Nft::<Test> {
                transactional_status: TransactionalStatusRecord::OpenAuction(..),
                ..
            }),
        ));
    })
}

#[test]
fn issue_nft_video_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        // Make an attempt to issue nft for non existent video
        let issue_nft_result = Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        );

        // Failure checked
        assert_err!(issue_nft_result, Error::<Test>::VideoDoesNotExist);
    })
}

#[test]
fn issue_nft_already_issued() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        // Make an attempt to issue nft once again for the same video
        let issue_nft_result = Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        );

        // Failure checked
        assert_err!(issue_nft_result, Error::<Test>::NftAlreadyExists);
    })
}

#[test]
fn issue_nft_auth_failed() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Make an attempt to issue nft with wrong credentials
        let issue_nft_result = Content::issue_nft(
            Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        );

        // Failure checked
        assert_err!(issue_nft_result, Error::<Test>::MemberAuthFailed);
    })
}

#[test]
fn issue_nft_actor_not_authorized() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Make an attempt to issue nft if actor is not authorized
        let issue_nft_result = Content::issue_nft(
            Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            ContentActor::Member(UNAUTHORIZED_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        );

        // Failure checked
        assert_err!(issue_nft_result, Error::<Test>::ActorNotAuthorized);
    })
}

#[test]
fn issue_nft_royalty_bounds_violated() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Make an attempt to issue nft with wrong credentials
        let issue_nft_result = Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test> {
                royalty: Some(Perbill::one()),
                ..NftIssuanceParameters::<Test>::default()
            },
        );

        // Failure checked
        assert_err!(issue_nft_result, Error::<Test>::RoyaltyUpperBoundExceeded);

        // Make an attempt to issue nft with wrong credentials
        let issue_nft_result = Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test> {
                royalty: Some(Perbill::from_perthousand(1)),
                ..NftIssuanceParameters::<Test>::default()
            },
        );

        // Failure checked
        assert_err!(issue_nft_result, Error::<Test>::RoyaltyLowerBoundExceeded);
    })
}

#[test]
fn issue_nft_fails_with_invalid_open_auction_parameters() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let auction_params = OpenAuctionParams::<Test> {
            starting_price: Content::min_starting_price() - 1,
            buy_now_price: None,
            bid_lock_duration: Content::min_bid_lock_duration(),
            starts_at: None,
            whitelist: BTreeSet::new(),
        };

        // Make an attempt to issue nft with wrong credentials
        let issue_nft_result = Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test> {
                init_transactional_status: InitTransactionalStatus::<Test>::OpenAuction(
                    auction_params,
                ),
                ..NftIssuanceParameters::<Test>::default()
            },
        );

        // Failure checked
        assert_err!(
            issue_nft_result,
            Error::<Test>::StartingPriceLowerBoundExceeded
        );
    })
}

// TODO: enable after enabling nft minting limits
#[ignore]
#[test]
fn issue_nft_failed_because_of_the_global_daily_limit() {
    with_default_mock_builder(|| {
        nft_test_helper_for_exceeded_limit(
            NftLimitId::GlobalDaily,
            Error::<Test>::GlobalNftDailyLimitExceeded,
        );
    })
}

// TODO: enable after enabling nft minting limits
#[ignore]
#[test]
fn issue_nft_failed_because_of_the_global_weekly_limit() {
    with_default_mock_builder(|| {
        nft_test_helper_for_exceeded_limit(
            NftLimitId::GlobalWeekly,
            Error::<Test>::GlobalNftWeeklyLimitExceeded,
        );
    })
}

// TODO: enable after enabling nft minting limits
#[ignore]
#[test]
fn issue_nft_failed_because_of_the_channel_weekly_limit() {
    with_default_mock_builder(|| {
        let channel_id = 1;
        nft_test_helper_for_exceeded_limit(
            NftLimitId::ChannelWeekly(channel_id),
            Error::<Test>::ChannelNftWeeklyLimitExceeded,
        );
    })
}

// TODO: enable after enabling nft minting limits
#[ignore]
#[test]
fn issue_nft_failed_because_of_the_daily_weekly_limit() {
    with_default_mock_builder(|| {
        let channel_id = 1;
        nft_test_helper_for_exceeded_limit(
            NftLimitId::ChannelDaily(channel_id),
            Error::<Test>::ChannelNftDailyLimitExceeded,
        );
    })
}

fn nft_test_helper_for_exceeded_limit(nft_limit_id: NftLimitId<u64>, expected_error: Error<Test>) {
    // Run to block one to see emitted events
    run_to_block(1);

    let video_id = NextVideoId::<Test>::get();

    create_initial_storage_buckets_helper();
    increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
    create_default_member_owned_channel_with_video();
    Content::set_nft_limit(nft_limit_id, Default::default());

    // Issue nft
    assert_eq!(
        Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ),
        Err(expected_error.into()),
    );
}

// TODO: enable after enabling nft minting limits
#[ignore]
#[test]
fn issue_nft_global_daily_limit_works_as_expected() {
    with_default_mock_builder(|| {
        test_helper_for_nft_limit_works_as_expected(
            NftLimitId::GlobalDaily,
            Err(Error::<Test>::GlobalNftDailyLimitExceeded.into()),
            false,
        );
    })
}

// TODO: enable after enabling nft minting limits
#[ignore]
#[test]
fn issue_nft_global_weekly_limit_works_as_expected() {
    with_default_mock_builder(|| {
        test_helper_for_nft_limit_works_as_expected(
            NftLimitId::GlobalWeekly,
            Err(Error::<Test>::GlobalNftWeeklyLimitExceeded.into()),
            false,
        );
    })
}

// TODO: enable after enabling nft minting limits
#[ignore]
#[test]
fn issue_nft_channel_daily_limit_works_as_expected() {
    with_default_mock_builder(|| {
        let channel_id = 1;
        test_helper_for_nft_limit_works_as_expected(
            NftLimitId::ChannelDaily(channel_id),
            Err(Error::<Test>::ChannelNftDailyLimitExceeded.into()),
            false,
        );
    })
}

// TODO: enable after enabling nft minting limits
#[ignore]
#[test]
fn issue_nft_channel_weekly_limit_works_as_expected() {
    with_default_mock_builder(|| {
        let channel_id = 1;
        test_helper_for_nft_limit_works_as_expected(
            NftLimitId::ChannelWeekly(channel_id),
            Err(Error::<Test>::ChannelNftWeeklyLimitExceeded.into()),
            false,
        );
    })
}

#[test]
fn issue_nft_ok_with_limits_not_enforced() {
    with_default_mock_builder(|| {
        ContentTest::with_member_channel().setup();
        // chainspec value = true, setting to false
        test_helper_for_nft_limit_works_as_expected(NftLimitId::GlobalDaily, Ok(()), true);
        test_helper_for_nft_limit_works_as_expected(NftLimitId::GlobalWeekly, Ok(()), true);
        test_helper_for_nft_limit_works_as_expected(
            NftLimitId::ChannelDaily(ChannelId::one()),
            Ok(()),
            true,
        );
        test_helper_for_nft_limit_works_as_expected(
            NftLimitId::ChannelWeekly(ChannelId::one()),
            Ok(()),
            true,
        );
    })
}

fn test_helper_for_nft_limit_works_as_expected(
    nft_limit_id: NftLimitId<u64>,
    expected: DispatchResult,
    disable_limits: bool,
) {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        Content::set_nft_limit(nft_limit_id, 1);

        if disable_limits {
            assert_ok!(Content::toggle_nft_limits(Origin::root(), false));
        }

        // Issue nft 1
        assert_ok!(Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        let video_id = NextVideoId::<Test>::get();

        CreateVideoFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Ok(()));

        // Issue nft 2
        assert_eq!(
            Content::issue_nft(
                Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
                ContentActor::Member(DEFAULT_MEMBER_ID),
                video_id,
                NftIssuanceParameters::<Test>::default(),
            ),
            expected,
        );

        let nft_limit = nft_limit_by_id(nft_limit_id);

        run_to_block(nft_limit.block_number_period);

        // otherwise nft already exists
        if !disable_limits {
            // Issue nft 3
            assert_ok!(Content::issue_nft(
                Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
                ContentActor::Member(DEFAULT_MEMBER_ID),
                video_id,
                NftIssuanceParameters::<Test>::default(),
            ));
        }
    })
}

// TODO: enable after enabling nft minting limits
#[ignore]
#[test]
fn nft_counters_increment_works_as_expected() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let channel_id = 1;
        let daily_limit = 1000;
        let weekly_limit = 1000;

        set_global_daily_nft_limit(daily_limit);
        set_global_weekly_nft_limit(weekly_limit);
        set_channel_daily_nft_limit(channel_id, daily_limit);
        set_channel_weekly_nft_limit(channel_id, weekly_limit);

        // Initial check
        let channel = Content::channel_by_id(channel_id);
        assert_eq!(channel.daily_nft_counter.counter, 0);
        assert_eq!(channel.weekly_nft_counter.counter, 0);
        assert_eq!(Content::global_daily_nft_counter().counter, 0);
        assert_eq!(Content::global_weekly_nft_counter().counter, 0);

        // Issue nft 1
        assert_ok!(Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        let channel = Content::channel_by_id(channel_id);
        assert_eq!(channel.daily_nft_counter.counter, 1);
        assert_eq!(channel.weekly_nft_counter.counter, 1);
        assert_eq!(Content::global_daily_nft_counter().counter, 1);
        assert_eq!(Content::global_weekly_nft_counter().counter, 1);

        // Issue nft 2
        let video_id = NextVideoId::<Test>::get();

        CreateVideoFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .call_and_assert(Ok(()));

        let daily_period_in_blocks = nft_limit_by_id(NftLimitId::GlobalDaily).block_number_period;
        run_to_block(daily_period_in_blocks);
        assert_ok!(Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        let channel = Content::channel_by_id(channel_id);
        assert_eq!(channel.daily_nft_counter.counter, 1);
        assert_eq!(channel.weekly_nft_counter.counter, 2);
        assert_eq!(Content::global_daily_nft_counter().counter, 1);
        assert_eq!(Content::global_weekly_nft_counter().counter, 2);
    })
}

// TODO: enable after enabling channel transfer
#[ignore]
#[test]
fn issue_nft_fails_with_pending_channel_transfer() {
    with_default_mock_builder(|| {
        run_to_block(1);
        ContentTest::with_member_channel().with_video().setup();
        UpdateChannelTransferStatusFixture::default()
            .with_new_member_channel_owner(SECOND_MEMBER_ID)
            .call_and_assert(Ok(()));

        assert_noop!(
            Content::issue_nft(
                Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
                ContentActor::Member(DEFAULT_MEMBER_ID),
                1u64,
                NftIssuanceParameters::<Test>::default(),
            ),
            Error::<Test>::InvalidChannelTransferStatus,
        );
    })
}
