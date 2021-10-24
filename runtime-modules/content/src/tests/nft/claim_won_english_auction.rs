#![cfg(test)]

use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

#[test]
fn claim_won_english_auction() {
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

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        // Run to the block where auction expires
        run_to_block(Content::max_auction_duration() + 1);

        // Claim won english auction
        assert_ok!(Content::claim_won_english_auction(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
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

        let claim_won_english_auction_event = get_test_event(RawEvent::EnglishAuctionCompleted(
            SECOND_MEMBER_ID,
            video_id,
        ));

        // Last event checked
        assert_event(
            claim_won_english_auction_event,
            number_of_events_before_call + 3,
        );
    })
}

#[test]
fn claim_won_english_auction_cannot_be_completed() {
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

        // Make an attempt to claim won english auction if it did not expire yet
        let claim_won_english_auction_result = Content::claim_won_english_auction(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
        );

        // Failure checked
        assert_err!(
            claim_won_english_auction_result,
            Error::<Test>::AuctionCannotBeCompleted
        );
    })
}

#[test]
fn claim_won_english_auction_auth_failed() {
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

        // Run to the block where auction expires
        run_to_block(Content::max_auction_duration() + 1);

        // Make an attempt to claim won english auction with wrong credentials
        let claim_won_english_auction_result = Content::claim_won_english_auction(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            UNKNOWN_ID,
            video_id,
        );

        // Failure checked
        assert_err!(
            claim_won_english_auction_result,
            Error::<Test>::MemberAuthFailed
        );
    })
}

#[test]
fn claim_won_english_auction_video_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        // Make an attempt to claim won english auction which corresponding video does not exist
        let claim_won_english_auction_result = Content::claim_won_english_auction(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
        );

        // Failure checked
        assert_err!(
            claim_won_english_auction_result,
            Error::<Test>::VideoDoesNotExist
        );
    })
}

#[test]
fn claim_won_english_auction_nft_is_not_issued() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_simple_channel_and_video(FIRST_MEMBER_ORIGIN, FIRST_MEMBER_ID);

        // Make an attempt to claim won english auction for nft which is not issued yet
        let claim_won_english_auction_result = Content::claim_won_english_auction(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
        );

        // Failure checked
        assert_err!(
            claim_won_english_auction_result,
            Error::<Test>::NFTDoesNotExist
        );
    })
}

#[test]
fn claim_won_english_auction_not_in_auction_state() {
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

        // Make an attempt to claim won english auction for nft which is not in auction state
        let claim_won_english_auction_result = Content::claim_won_english_auction(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
        );

        // Failure checked
        assert_err!(
            claim_won_english_auction_result,
            Error::<Test>::NotInAuctionState
        );
    })
}

#[test]
fn claim_won_english_auction_is_not_english_auction_type() {
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

        // Make an attempt to claim won english auction for nft which is not in english auction state
        let claim_won_english_auction_result = Content::claim_won_english_auction(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
        );

        // Failure checked
        assert_err!(
            claim_won_english_auction_result,
            Error::<Test>::IsNotEnglishAuctionType
        );
    })
}

#[test]
fn claim_won_english_auction_last_bid_does_not_exist() {
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

        // Run to the block where auction expires
        run_to_block(Content::max_auction_duration() + 1);

        // Make an attempt to claim won english auction if last bid does not exist
        let claim_won_english_auction_result = Content::claim_won_english_auction(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
        );

        // Failure checked
        assert_err!(
            claim_won_english_auction_result,
            Error::<Test>::LastBidDoesNotExist
        );
    })
}
