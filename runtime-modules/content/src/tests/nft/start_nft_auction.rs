#![cfg(test)]
use crate::tests::fixtures::{
    create_default_member_owned_channel_with_video, create_initial_storage_buckets_helper,
    increase_account_balance_helper,
};
use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};
use std::iter::FromIterator;

#[test]
fn start_nft_auction() {
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

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        let auction_params = get_open_auction_params();

        // Start nft auction
        assert_ok!(Content::start_nft_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        // Runtime tested state after call

        let mut auction: Auction<Test> = AuctionRecord::new(auction_params.clone());

        if auction_params.starts_at.is_none() {
            auction.starts_at = <frame_system::Module<Test>>::block_number();
        }

        // Ensure nft status changed to given Auction
        assert!(matches!(
            Content::video_by_id(video_id).nft_status,
            Some(OwnedNft {
                transactional_status: TransactionalStatus::<Test>::Auction(created_auction,),
                ..
            }) if auction == created_auction
        ));

        // Last event checked
        assert_event(
            MetaEvent::content(RawEvent::AuctionStarted(
                ContentActor::Member(DEFAULT_MEMBER_ID),
                video_id,
                auction_params,
            )),
            number_of_events_before_call + 1,
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
        let start_nft_auction_result = Content::start_nft_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
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
        let start_nft_auction_result = Content::start_nft_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
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
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        let auction_params = get_open_auction_params();

        // Make an attempt to start nft auction with wrong credentials
        let start_nft_auction_result = Content::start_nft_auction(
            Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
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
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        let auction_params = get_open_auction_params();

        // Make an attempt to start nft auction if actor is not authorized
        let start_nft_auction_result = Content::start_nft_auction(
            Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            ContentActor::Member(UNAUTHORIZED_MEMBER_ID),
            video_id,
            auction_params.clone(),
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
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        // Offer nft
        assert_ok!(Content::offer_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(DEFAULT_MEMBER_ID),
            SECOND_MEMBER_ID,
            None,
        ));

        let auction_params = get_open_auction_params();

        // Make an attempt to start nft auction if nft transaction status is not idle
        let start_nft_auction_result = Content::start_nft_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
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
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        // Make an attempt to start nft auction if starting price provided is less then min starting price
        let auction_params = AuctionParams {
            starting_price: Content::min_starting_price() - 1,
            buy_now_price: None,
            auction_type: AuctionTypeOf::<Test>::Open(OpenAuction::<Test> {
                bid_lock_duration: Content::min_bid_lock_duration(),
            }),
            starts_at: None,
            whitelist: BTreeSet::new(),
        };

        let start_nft_auction_result = Content::start_nft_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::StartingPriceLowerBoundExceeded
        );

        // Make an attempt to start nft auction if starting price provided is greater then max starting price
        let auction_params = AuctionParams {
            starting_price: Content::max_starting_price() + 1,
            buy_now_price: None,
            auction_type: AuctionTypeOf::<Test>::Open(OpenAuction::<Test> {
                bid_lock_duration: Content::min_bid_lock_duration(),
            }),
            starts_at: None,
            whitelist: BTreeSet::new(),
        };

        let start_nft_auction_result = Content::start_nft_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::StartingPriceUpperBoundExceeded
        );

        // Make an attempt to start open nft auction if minimal bid lock duration
        // of auction provided is less then min allowed bid lock duration
        let auction_params = AuctionParams {
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            auction_type: AuctionTypeOf::<Test>::Open(OpenAuction::<Test> {
                bid_lock_duration: Content::min_bid_lock_duration() - 1,
            }),
            starts_at: None,
            whitelist: BTreeSet::new(),
        };

        let start_nft_auction_result = Content::start_nft_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::BidLockDurationLowerBoundExceeded
        );

        // Make an attempt to start open nft auction if minimal bid lock duration
        // of auction provided is greater then max allowed bid lock duration
        let auction_params = AuctionParams {
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            auction_type: AuctionTypeOf::<Test>::Open(OpenAuction::<Test> {
                bid_lock_duration: Content::max_bid_lock_duration() + 1,
            }),
            starts_at: None,
            whitelist: BTreeSet::new(),
        };

        let start_nft_auction_result = Content::start_nft_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::BidLockDurationUpperBoundExceeded
        );

        // Make an attempt to start english nft auction if extension period
        // of auction provided is less then min allowed extension period
        let auction_params = AuctionParams {
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            auction_type: AuctionTypeOf::<Test>::English(EnglishAuction::<Test> {
                extension_period: Content::min_auction_extension_period() - 1,
                auction_duration: Content::max_auction_duration(),
                bid_step: Content::max_bid_step(),
            }),
            starts_at: None,
            whitelist: BTreeSet::new(),
        };

        let start_nft_auction_result = Content::start_nft_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::ExtensionPeriodLowerBoundExceeded
        );

        // Make an attempt to start english nft auction if extension period
        // of auction provided is greater then max allowed extension period
        let auction_params = AuctionParams {
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            auction_type: AuctionTypeOf::<Test>::English(EnglishAuction::<Test> {
                extension_period: Content::max_auction_extension_period() + 1,
                auction_duration: Content::max_auction_duration(),
                bid_step: Content::max_bid_step(),
            }),
            starts_at: None,
            whitelist: BTreeSet::new(),
        };

        let start_nft_auction_result = Content::start_nft_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::ExtensionPeriodUpperBoundExceeded
        );

        // Make an attempt to start english nft auction if auction duration
        // of auction provided is less then min allowed auction duration
        let auction_params = AuctionParams {
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            auction_type: AuctionTypeOf::<Test>::English(EnglishAuction::<Test> {
                extension_period: Content::min_auction_extension_period(),
                auction_duration: Content::min_auction_duration() - 1,
                bid_step: Content::max_bid_step(),
            }),
            starts_at: None,
            whitelist: BTreeSet::new(),
        };

        let start_nft_auction_result = Content::start_nft_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::AuctionDurationLowerBoundExceeded
        );

        // Make an attempt to start english nft auction if auction duration
        // of auction provided is greater then max allowed auction duration
        let auction_params = AuctionParams {
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            auction_type: AuctionTypeOf::<Test>::English(EnglishAuction::<Test> {
                extension_period: Content::max_auction_extension_period(),
                auction_duration: Content::max_auction_duration() + 1,
                bid_step: Content::max_bid_step(),
            }),
            starts_at: None,
            whitelist: BTreeSet::new(),
        };

        let start_nft_auction_result = Content::start_nft_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::AuctionDurationUpperBoundExceeded
        );

        // Make an attempt to start english nft auction if extension period
        // of auction provided is greater auction duration
        let auction_params = AuctionParams {
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            auction_type: AuctionTypeOf::<Test>::English(EnglishAuction::<Test> {
                extension_period: Content::max_auction_extension_period(),
                auction_duration: Content::min_auction_duration(),
                bid_step: Content::max_bid_step(),
            }),
            starts_at: None,
            whitelist: BTreeSet::new(),
        };

        let start_nft_auction_result = Content::start_nft_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::ExtensionPeriodIsGreaterThenAuctionDuration
        );

        // Make an attempt to start nft auction if starts_at provided is less then now
        let auction_params = AuctionParams {
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            auction_type: AuctionTypeOf::<Test>::Open(OpenAuction::<Test> {
                bid_lock_duration: Content::min_bid_lock_duration(),
            }),
            starts_at: Some(<frame_system::Module<Test>>::block_number() - 1),
            whitelist: BTreeSet::new(),
        };

        let start_nft_auction_result = Content::start_nft_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::StartsAtLowerBoundExceeded
        );

        // Make an attempt to start nft auction if starts_at provided is greater then now + auction_starts_at_max_delta
        let auction_params = AuctionParams {
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            auction_type: AuctionTypeOf::<Test>::Open(OpenAuction::<Test> {
                bid_lock_duration: Content::min_bid_lock_duration(),
            }),
            starts_at: Some(
                <frame_system::Module<Test>>::block_number()
                    + Content::auction_starts_at_max_delta()
                    + 1,
            ),
            whitelist: BTreeSet::new(),
        };

        let start_nft_auction_result = Content::start_nft_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::StartsAtUpperBoundExceeded
        );

        // Make an attempt to start nft auction if auction related buy now is less then starting price
        let buy_now_price = Content::min_starting_price();

        let auction_params = AuctionParams {
            starting_price: buy_now_price + 1,
            buy_now_price: Some(buy_now_price),
            auction_type: AuctionTypeOf::<Test>::Open(OpenAuction::<Test> {
                bid_lock_duration: Content::min_bid_lock_duration(),
            }),
            starts_at: None,
            whitelist: BTreeSet::new(),
        };

        let start_nft_auction_result = Content::start_nft_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::BuyNowIsLessThenStartingPrice
        );

        // Make an attempt to start nft auction if auction whitelist provided consists only 1 member
        let auction_params = AuctionParams {
            starting_price: Content::min_starting_price(),
            buy_now_price: None,
            auction_type: AuctionTypeOf::<Test>::Open(OpenAuction::<Test> {
                bid_lock_duration: Content::min_bid_lock_duration(),
            }),
            starts_at: None,
            whitelist: BTreeSet::from_iter(vec![SECOND_MEMBER_ID].into_iter()),
        };

        let start_nft_auction_result = Content::start_nft_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::WhitelistHasOnlyOneMember
        );

        // Make an attempt to start nft auction if length of auction whitelist provided exceeds max allowed length
        let whitelist: BTreeSet<_> = (0..=Content::max_auction_whitelist_length())
            .into_iter()
            .map(|member| member as u64)
            .collect();

        let auction_params = AuctionParams {
            starting_price: Content::min_starting_price(),
            buy_now_price: None,
            auction_type: AuctionTypeOf::<Test>::Open(OpenAuction::<Test> {
                bid_lock_duration: Content::min_bid_lock_duration(),
            }),
            starts_at: None,
            whitelist,
        };

        let start_nft_auction_result = Content::start_nft_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        );

        // Failure checked
        assert_err!(
            start_nft_auction_result,
            Error::<Test>::MaxAuctionWhiteListLengthUpperBoundExceeded
        );
    })
}
