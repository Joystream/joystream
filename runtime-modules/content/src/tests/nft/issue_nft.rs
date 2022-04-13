#![cfg(test)]
use crate::tests::fixtures::{
    create_data_objects_helper, create_default_member_owned_channel_with_video,
    create_initial_storage_buckets_helper, increase_account_balance_helper, CreateVideoFixture,
};
use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

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

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

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
        assert_event(
            MetaEvent::content(RawEvent::NftIssued(
                ContentActor::Member(DEFAULT_MEMBER_ID),
                video_id,
                nft_issue_params,
            )),
            number_of_events_before_call + 1,
        );
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

#[test]
fn issue_nft_failed_because_of_the_global_daily_limit() {
    with_default_mock_builder(|| {
        nft_test_helper_for_exceeded_limit(
            NftLimitId::GlobalDaily,
            Error::<Test>::GlobalNftDailyLimitExceeded,
        );
    })
}

#[test]
fn issue_nft_failed_because_of_the_global_weekly_limit() {
    with_default_mock_builder(|| {
        nft_test_helper_for_exceeded_limit(
            NftLimitId::GlobalWeekly,
            Error::<Test>::GlobalNftWeeklyLimitExceeded,
        );
    })
}

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
    set_nft_limit(nft_limit_id, Default::default());

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

#[test]
fn issue_nft_global_daily_limit_works_as_expected() {
    with_default_mock_builder(|| {
        test_helper_for_nft_limit_works_as_expected(
            NftLimitId::GlobalDaily,
            Error::<Test>::GlobalNftDailyLimitExceeded,
        );
    })
}

#[test]
fn issue_nft_global_weekly_limit_works_as_expected() {
    with_default_mock_builder(|| {
        test_helper_for_nft_limit_works_as_expected(
            NftLimitId::GlobalWeekly,
            Error::<Test>::GlobalNftWeeklyLimitExceeded,
        );
    })
}

#[test]
fn issue_nft_channel_daily_limit_works_as_expected() {
    with_default_mock_builder(|| {
        let channel_id = 1;
        test_helper_for_nft_limit_works_as_expected(
            NftLimitId::ChannelDaily(channel_id),
            Error::<Test>::ChannelNftDailyLimitExceeded,
        );
    })
}

#[test]
fn issue_nft_channel_weekly_limit_works_as_expected() {
    with_default_mock_builder(|| {
        let channel_id = 1;
        test_helper_for_nft_limit_works_as_expected(
            NftLimitId::ChannelWeekly(channel_id),
            Error::<Test>::ChannelNftWeeklyLimitExceeded,
        );
    })
}

fn test_helper_for_nft_limit_works_as_expected(
    nft_limit_id: NftLimitId<u64>,
    expected_error: Error<Test>,
) {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let global_period_in_blocks = 10;

        set_nft_limit(
            nft_limit_id,
            LimitPerPeriod::<u64> {
                limit: 1,
                block_number_period: global_period_in_blocks,
            },
        );

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
            Err(expected_error.into()),
        );

        run_to_block(global_period_in_blocks);

        // Issue nft 3
        assert_ok!(Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));
    })
}
