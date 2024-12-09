#![cfg(test)]
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_noop, assert_ok};
use std::iter::FromIterator;

const AUCTION_DURATION: u64 = 10;

#[test]
fn start_open_auction() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Issue nft
        assert_ok!(Content::issue_nft(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        let auction_params = get_open_auction_params();

        // Start nft auction
        assert_ok!(Content::start_open_auction(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        // Runtime tested state after call

        let nft = Content::ensure_nft_exists(video_id).unwrap();
        assert!(matches!(
            nft,
            Nft::<Test> {
                transactional_status: TransactionalStatus::<Test>::OpenAuction(_),
                ..
            }
        ));

        // Last event checked
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::Content(RawEvent::OpenAuctionStarted(
                ContentActor::Member(DEFAULT_MEMBER_ID),
                video_id,
                auction_params,
                nft.open_auctions_nonce,
            )),
        );
    })
}

#[test]
fn start_nft_auction_video_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        let auction_params = get_open_auction_params();

        // Make an attempt to start nft auction which corresponding video does not exist yet
        let start_nft_auction_result = Content::start_open_auction(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        );

        // Failure checked
        assert_err!(start_nft_auction_result, Error::<Test>::VideoDoesNotExist);
    })
}

#[test]
fn start_nft_auction_not_issued() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let auction_params = get_open_auction_params();

        // Make an attempt to start nft auction for nft which is not issued yet
        let start_nft_auction_result = Content::start_open_auction(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        );

        // Failure checked
        assert_err!(start_nft_auction_result, Error::<Test>::NftDoesNotExist);
    })
}

#[test]
fn start_nft_auction_auth_failed() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Issue nft
        assert_ok!(Content::issue_nft(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        let auction_params = get_open_auction_params();

        // Make an attempt to start nft auction with wrong credentials
        let start_nft_auction_result = Content::start_open_auction(
            RuntimeOrigin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        );

        // Failure checked
        assert_err!(start_nft_auction_result, Error::<Test>::MemberAuthFailed);
    })
}

#[test]
fn start_nft_auction_not_authorized() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Issue nft
        assert_ok!(Content::issue_nft(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        let auction_params = get_open_auction_params();

        // Make an attempt to start nft auction if actor is not authorized
        let start_nft_auction_result = Content::start_open_auction(
            RuntimeOrigin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            ContentActor::Member(UNAUTHORIZED_MEMBER_ID),
            video_id,
            auction_params,
        );

        // Failure checked
        assert_err!(start_nft_auction_result, Error::<Test>::ActorNotAuthorized);
    })
}

#[test]
fn start_nft_auction_transactional_status_is_not_idle() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Issue nft
        assert_ok!(Content::issue_nft(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        // Offer nft
        assert_ok!(Content::offer_nft(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(DEFAULT_MEMBER_ID),
            SECOND_MEMBER_ID,
            None,
        ));

        let auction_params = get_open_auction_params();

        // Make an attempt to start nft auction if nft transaction status is not idle
        let start_nft_auction_result = Content::start_open_auction(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        );

        // Failure checked
        assert_err!(start_nft_auction_result, Error::<Test>::NftIsNotIdle);
    })
}

#[test]
fn start_nft_auction_invalid_params() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Issue nft
        assert_ok!(Content::issue_nft(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        // Make an attempt to start nft auction if starting price provided is less then min starting price
        let auction_params = OpenAuctionParams::<Test> {
            starting_price: Content::min_starting_price() - 1,
            buy_now_price: None,
            starts_at: None,
            bid_lock_duration: Content::min_bid_lock_duration(),
            whitelist: BTreeSet::new(),
        };

        let start_nft_auction_result = Content::start_open_auction(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::StartingPriceLowerBoundExceeded
        );

        // Make an attempt to start nft auction if starting price provided is greater then max starting price
        let auction_params = OpenAuctionParams::<Test> {
            starting_price: Content::max_starting_price() + 1,
            buy_now_price: None,
            starts_at: None,
            bid_lock_duration: Content::min_bid_lock_duration(),
            whitelist: BTreeSet::new(),
        };

        let start_nft_auction_result = Content::start_open_auction(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::StartingPriceUpperBoundExceeded
        );

        // Make an attempt to start open nft auction if minimal bid lock duration
        // of auction provided is less then min allowed bid lock duration
        let auction_params = OpenAuctionParams::<Test> {
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            starts_at: None,
            bid_lock_duration: Content::min_bid_lock_duration() - 1,
            whitelist: BTreeSet::new(),
        };

        let start_nft_auction_result = Content::start_open_auction(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::BidLockDurationLowerBoundExceeded
        );

        // Make an attempt to start open nft auction if minimal bid lock duration
        // of auction provided is greater then max allowed bid lock duration
        let auction_params = OpenAuctionParams::<Test> {
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            starts_at: None,
            bid_lock_duration: Content::max_bid_lock_duration() + 1,
            whitelist: BTreeSet::new(),
        };

        let start_nft_auction_result = Content::start_open_auction(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::BidLockDurationUpperBoundExceeded
        );

        // Make an attempt to start english nft auction if extension period
        // of auction provided is greater then max allowed extension period
        let auction_params = EnglishAuctionParams::<Test> {
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            extension_period: Content::max_auction_extension_period() + 1,
            min_bid_step: Content::max_bid_step(),
            duration: AUCTION_DURATION,
            starts_at: None,
            whitelist: BTreeSet::new(),
        };

        let start_nft_auction_result = Content::start_english_auction(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::ExtensionPeriodUpperBoundExceeded
        );

        // Make an attempt to start english nft auction if auction duration
        // of auction provided is less then min allowed auction duration
        let auction_params = EnglishAuctionParams::<Test> {
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            extension_period: Content::min_auction_extension_period(),
            min_bid_step: Content::max_bid_step(),
            duration: Content::min_auction_duration() - 1,
            starts_at: None,
            whitelist: BTreeSet::new(),
        };

        let start_nft_auction_result = Content::start_english_auction(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::AuctionDurationLowerBoundExceeded
        );

        // Make an attempt to start english nft auction if auction duration
        // of auction provided is greater then max allowed auction duration
        let auction_params = EnglishAuctionParams::<Test> {
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            starts_at: None,
            extension_period: Content::max_auction_extension_period(),
            min_bid_step: Content::max_bid_step(),
            duration: Content::max_auction_duration() + 1,
            whitelist: BTreeSet::new(),
        };

        let start_nft_auction_result = Content::start_english_auction(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::AuctionDurationUpperBoundExceeded
        );

        // Make an attempt to start english nft auction if extension period
        // of auction provided is greater auction duration
        let auction_params = EnglishAuctionParams::<Test> {
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            extension_period: Content::max_auction_extension_period(),
            min_bid_step: Content::max_bid_step(),
            duration: AUCTION_DURATION,
            starts_at: None,
            whitelist: BTreeSet::new(),
        };

        let start_nft_auction_result = Content::start_english_auction(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::ExtensionPeriodIsGreaterThenAuctionDuration
        );

        // Make an attempt to start nft auction if auction related buy now is less then starting price
        let buy_now_price = Content::min_starting_price();

        let auction_params = OpenAuctionParams::<Test> {
            starting_price: buy_now_price + 1,
            buy_now_price: Some(buy_now_price),
            starts_at: None,
            bid_lock_duration: Content::min_bid_lock_duration(),
            whitelist: BTreeSet::new(),
        };

        let start_nft_auction_result = Content::start_open_auction(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::BuyNowMustBeGreaterThanStartingPrice,
        );

        // Make an attempt to start nft auction if auction whitelist provided consists only 1 member
        let auction_params = OpenAuctionParams::<Test> {
            starting_price: Content::min_starting_price(),
            buy_now_price: None,
            starts_at: None,
            bid_lock_duration: Content::min_bid_lock_duration(),
            whitelist: BTreeSet::from_iter(vec![SECOND_MEMBER_ID].into_iter()),
        };

        let start_nft_auction_result = Content::start_open_auction(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::WhitelistHasOnlyOneMember
        );

        // Make an attempt to start nft auction if length of auction whitelist provided exceeds max allowed length
        let whitelist: BTreeSet<_> = (0..=<Test as Config>::MaxNftAuctionWhitelistLength::get())
            .into_iter()
            .map(|member| member as u64)
            .collect();

        let auction_params = OpenAuctionParams::<Test> {
            starting_price: Content::min_starting_price(),
            buy_now_price: None,
            starts_at: None,
            bid_lock_duration: Content::min_bid_lock_duration(),
            whitelist,
        };

        let start_nft_auction_result = Content::start_open_auction(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::MaxAuctionWhiteListLengthUpperBoundExceeded
        );
    })
}

#[test]
fn start_eng_auction_fails_with_invalid_forward_starting() {
    // Make an attempt to start english nft auction if extension period
    // of auction provided is less then min allowed extension period
    with_default_mock_builder(|| {
        let starting_block = 2;
        run_to_block(starting_block);

        let video_id = Content::next_video_id();
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Issue nft
        assert_ok!(Content::issue_nft(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        let auction_params = EnglishAuctionParams::<Test> {
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            extension_period: Content::min_auction_extension_period(),
            min_bid_step: Content::min_bid_step(),
            duration: AUCTION_DURATION,
            starts_at: Some(starting_block + 1 + Content::auction_starts_at_max_delta()),
            whitelist: BTreeSet::new(),
        };

        let start_nft_auction_result = Content::start_english_auction(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::StartsAtUpperBoundExceeded,
        );

        let auction_params = EnglishAuctionParams::<Test> {
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            extension_period: Content::min_auction_extension_period(),
            min_bid_step: Content::min_bid_step(),
            duration: AUCTION_DURATION,
            starts_at: Some(starting_block - 1),
            whitelist: BTreeSet::new(),
        };

        let start_nft_auction_result = Content::start_english_auction(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::StartsAtLowerBoundExceeded,
        );
    })
}

#[test]
fn start_open_auction_fails_during_channel_transfer() {
    with_default_mock_builder(|| {
        run_to_block(1);
        ContentTest::with_member_channel().with_video().setup();
        IssueNftFixture::default().call_and_assert(Ok(()));
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(SECOND_MEMBER_ID)
            .call_and_assert(Ok(()));

        assert_noop!(
            Content::start_open_auction(
                RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
                ContentActor::Member(DEFAULT_MEMBER_ID),
                1u64,
                OpenAuctionParams::<Test>::default(),
            ),
            Error::<Test>::InvalidChannelTransferStatus,
        );
    })
}

#[test]
fn start_english_auction_fails_during_channel_transfer() {
    with_default_mock_builder(|| {
        run_to_block(1);
        ContentTest::with_member_channel().with_video().setup();
        IssueNftFixture::default().call_and_assert(Ok(()));
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(SECOND_MEMBER_ID)
            .call_and_assert(Ok(()));

        assert_noop!(
            Content::start_english_auction(
                RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
                ContentActor::Member(DEFAULT_MEMBER_ID),
                1u64,
                EnglishAuctionParams::<Test>::default(),
            ),
            Error::<Test>::InvalidChannelTransferStatus,
        );
    })
}

#[test]
fn start_open_auction_fails_with_non_existing_member_in_whitelist() {
    with_default_mock_builder(|| {
        run_to_block(1);
        ContentTest::with_member_channel().with_video().setup();
        IssueNftFixture::default().call_and_assert(Ok(()));
        assert_noop!(
            Content::start_open_auction(
                RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
                ContentActor::Member(DEFAULT_MEMBER_ID),
                1u64,
                OpenAuctionParams::<Test> {
                    bid_lock_duration: Content::min_bid_lock_duration(),
                    buy_now_price: None,
                    starting_price: Content::min_starting_price(),
                    starts_at: None,
                    whitelist: BTreeSet::from_iter(vec![SECOND_MEMBER_ID, 9999]),
                }
            ),
            Error::<Test>::WhitelistedMemberDoesNotExist,
        );
    })
}

#[test]
fn start_english_auction_fails_with_non_existing_member_in_whitelist() {
    with_default_mock_builder(|| {
        run_to_block(1);
        ContentTest::with_member_channel().with_video().setup();
        IssueNftFixture::default().call_and_assert(Ok(()));

        assert_noop!(
            Content::start_english_auction(
                RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
                ContentActor::Member(DEFAULT_MEMBER_ID),
                1u64,
                EnglishAuctionParams::<Test> {
                    buy_now_price: None,
                    duration: Content::min_auction_duration(),
                    extension_period: Content::min_auction_extension_period(),
                    min_bid_step: Content::min_bid_step(),
                    starting_price: Content::min_starting_price(),
                    starts_at: None,
                    whitelist: BTreeSet::from_iter(vec![SECOND_MEMBER_ID, 9999]),
                }
            ),
            Error::<Test>::WhitelistedMemberDoesNotExist,
        );
    })
}
