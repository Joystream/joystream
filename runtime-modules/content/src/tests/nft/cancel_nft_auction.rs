#![cfg(test)]

use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

#[test]
fn cancel_nft_auction() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_simple_channel_and_video(FIRST_MEMBER_ORIGIN, FIRST_MEMBER_ID);

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            None,
            b"metablob".to_vec(),
            None
        ));

        // Start nft auction
        assert_ok!(Content::start_nft_auction(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            get_open_auction_params()
        ));

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        // Cancel nft auction
        assert_ok!(Content::cancel_nft_auction(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
        ));

        // Runtime tested state after call

        // Ensure nft status changed to given Auction
        assert!(matches!(
            Content::video_by_id(video_id).nft_status,
            Some(OwnedNFT {
                transactional_status: TransactionalStatus::Idle,
                ..
            })
        ));

        let nft_auction_canceled_event = get_test_event(RawEvent::AuctionCanceled(
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
        ));

        // Last event checked
        assert_event(nft_auction_canceled_event, number_of_events_before_call + 1);
    })
}

#[test]
fn cancel_nft_auction_video_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        // Make an attempt to cancel nft auction which corresponding video does not exist yet
        let cancel_nft_auction_result = Content::cancel_nft_auction(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(cancel_nft_auction_result, Error::<Test>::VideoDoesNotExist);
    })
}

#[test]
fn cancel_nft_auction_not_issued() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_simple_channel_and_video(FIRST_MEMBER_ORIGIN, FIRST_MEMBER_ID);

        // Make an attempt to cancel nft auction for nft which is not issued yet
        let cancel_nft_auction_result = Content::cancel_nft_auction(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(cancel_nft_auction_result, Error::<Test>::NFTDoesNotExist);
    })
}

#[test]
fn cancel_nft_auction_auth_failed() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_simple_channel_and_video(FIRST_MEMBER_ORIGIN, FIRST_MEMBER_ID);

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            None,
            b"metablob".to_vec(),
            None
        ));

        // Start nft auction
        assert_ok!(Content::start_nft_auction(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            get_open_auction_params()
        ));

        // Make an attempt to cancel nft auction with wrong credentials
        let cancel_nft_auction_result = Content::cancel_nft_auction(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(UNKNOWN_ID),
            video_id,
        );

        // Failure checked
        assert_err!(cancel_nft_auction_result, Error::<Test>::MemberAuthFailed);
    })
}

#[test]
fn cancel_nft_auction_not_authorized() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_simple_channel_and_video(FIRST_MEMBER_ORIGIN, FIRST_MEMBER_ID);

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            None,
            b"metablob".to_vec(),
            None
        ));

        // Start nft auction
        assert_ok!(Content::start_nft_auction(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            get_open_auction_params()
        ));

        // Make an attempt to cancel nft auction if actor is not authorized
        let cancel_nft_auction_result = Content::cancel_nft_auction(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            ContentActor::Member(SECOND_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(cancel_nft_auction_result, Error::<Test>::ActorNotAuthorized);
    })
}

#[test]
fn cancel_nft_auction_not_in_auction_state() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_simple_channel_and_video(FIRST_MEMBER_ORIGIN, FIRST_MEMBER_ID);

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            None,
            b"metablob".to_vec(),
            None
        ));

        // Make an attempt to cancel nft auction if there is no pending one
        let cancel_nft_auction_result = Content::cancel_nft_auction(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(cancel_nft_auction_result, Error::<Test>::NotInAuctionState);
    })
}

#[test]
fn cancel_nft_auction_english_auction_with_bids() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_simple_channel_and_video(FIRST_MEMBER_ORIGIN, FIRST_MEMBER_ID);

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            None,
            b"metablob".to_vec(),
            None
        ));

        let auction_params = AuctionParams {
            starting_price: Content::min_starting_price(),
            buy_now_price: None,
            auction_type: AuctionType::English(EnglishAuctionDetails {
                extension_period: Content::min_auction_extension_period(),
                auction_duration: Content::max_auction_duration(),
            }),
            minimal_bid_step: Content::max_bid_step(),
            starts_at: None,
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_nft_auction(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            auction_params
        ));

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ORIGIN, bid);

        // Make an english auction bid
        assert_ok!(Content::make_bid(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
            bid,
        ));

        // Make an attempt to cancel an english auction which already contains a bid
        let cancel_nft_auction_result = Content::cancel_nft_auction(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(
            cancel_nft_auction_result,
            Error::<Test>::ActionHasBidsAlready
        );
    })
}
