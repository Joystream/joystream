#![cfg(test)]

use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

#[test]
fn pick_open_auction_winner() {
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

        let bid_lock_duration = Content::min_bid_lock_duration();

        let auction_params = AuctionParams {
            starting_price: Content::min_starting_price(),
            buy_now_price: None,
            auction_type: AuctionType::Open(OpenAuctionDetails { bid_lock_duration }),
            minimal_bid_step: Content::min_bid_step(),
            starts_at: None,
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_nft_auction(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ORIGIN, bid);

        // Make nft auction bid
        assert_ok!(Content::make_bid(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
            bid,
        ));

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        // Pick open auction winner
        assert_ok!(Content::pick_open_auction_winner(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
        ));

        // Runtime tested state after call

        // Ensure english auction successfully completed
        assert!(matches!(
            Content::video_by_id(video_id).nft_status,
            Some(OwnedNFT {
                transactional_status: TransactionalStatus::Idle,
                ..
            })
        ));

        let pick_open_auction_winner_event = get_test_event(RawEvent::OpenAuctionBidAccepted(
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
        ));

        // Last event checked
        assert_event(
            pick_open_auction_winner_event,
            number_of_events_before_call + 3,
        );
    })
}

#[test]
fn pick_open_auction_winner_auth_failed() {
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

        let bid_lock_duration = Content::min_bid_lock_duration();

        let auction_params = AuctionParams {
            starting_price: Content::min_starting_price(),
            buy_now_price: None,
            auction_type: AuctionType::Open(OpenAuctionDetails { bid_lock_duration }),
            minimal_bid_step: Content::min_bid_step(),
            starts_at: None,
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_nft_auction(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ORIGIN, bid);

        // Make nft auction bid
        assert_ok!(Content::make_bid(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
            bid,
        ));

        // Run to the block where auction expires
        run_to_block(Content::max_auction_duration() + 1);

        // Make an attempt to pick open auction winner with wrong credentials
        let pick_open_auction_winner_result = Content::pick_open_auction_winner(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            ContentActor::Member(UNKNOWN_ID),
            video_id,
        );

        // Failure checked
        assert_err!(
            pick_open_auction_winner_result,
            Error::<Test>::MemberAuthFailed
        );
    })
}

#[test]
fn pick_open_auction_winner_actor_not_authorized() {
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

        let bid_lock_duration = Content::min_bid_lock_duration();

        let auction_params = AuctionParams {
            starting_price: Content::min_starting_price(),
            buy_now_price: None,
            auction_type: AuctionType::Open(OpenAuctionDetails { bid_lock_duration }),
            minimal_bid_step: Content::min_bid_step(),
            starts_at: None,
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_nft_auction(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ORIGIN, bid);

        // Make nft auction bid
        assert_ok!(Content::make_bid(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
            bid,
        ));

        // Run to the block where auction expires
        run_to_block(Content::max_auction_duration() + 1);

        // Make an attempt to pick open auction winner if actor is not authorized to do this
        let pick_open_auction_winner_result = Content::pick_open_auction_winner(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            ContentActor::Member(SECOND_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(
            pick_open_auction_winner_result,
            Error::<Test>::ActorNotAuthorized
        );
    })
}

#[test]
fn pick_open_auction_winner_video_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        // Make an attempt to pick open auction winner which corresponding video does not exist
        let pick_open_auction_winner_result = Content::pick_open_auction_winner(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            ContentActor::Member(SECOND_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(
            pick_open_auction_winner_result,
            Error::<Test>::VideoDoesNotExist
        );
    })
}

#[test]
fn pick_open_auction_winner_nft_is_not_issued() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_simple_channel_and_video(FIRST_MEMBER_ORIGIN, FIRST_MEMBER_ID);

        // Make an attempt to pick open auction winner for nft which is not issued yet
        let pick_open_auction_winner_result = Content::pick_open_auction_winner(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            ContentActor::Member(SECOND_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(
            pick_open_auction_winner_result,
            Error::<Test>::NFTDoesNotExist
        );
    })
}

#[test]
fn pick_open_auction_winner_not_in_auction_state() {
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

        // Make an attempt to pick open auction winner for nft which is not in auction state
        let pick_open_auction_winner_result = Content::pick_open_auction_winner(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(
            pick_open_auction_winner_result,
            Error::<Test>::NotInAuctionState
        );
    })
}

#[test]
fn pick_open_auction_winner_is_not_open_auction_type() {
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
            auction_params.clone(),
        ));

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ORIGIN, bid);

        // Make nft auction bid
        assert_ok!(Content::make_bid(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
            bid,
        ));

        // Make an attempt to pick open auction winner for nft which is in english auction state
        let pick_open_auction_winner_result = Content::pick_open_auction_winner(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(
            pick_open_auction_winner_result,
            Error::<Test>::IsNotOpenAuctionType
        );
    })
}

#[test]
fn pick_open_auction_winner_last_bid_does_not_exist() {
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

        let bid_lock_duration = Content::min_bid_lock_duration();

        let auction_params = AuctionParams {
            starting_price: Content::min_starting_price(),
            buy_now_price: None,
            auction_type: AuctionType::Open(OpenAuctionDetails { bid_lock_duration }),
            minimal_bid_step: Content::min_bid_step(),
            starts_at: None,
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_nft_auction(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        // Run to the block where auction expires
        run_to_block(Content::max_auction_duration() + 1);

        // Make an attempt to pick open auction winner if last bid does not exist
        let pick_open_auction_winner_result = Content::pick_open_auction_winner(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(
            pick_open_auction_winner_result,
            Error::<Test>::LastBidDoesNotExist
        );
    })
}
