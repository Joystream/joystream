#![cfg(test)]

use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};
use std::iter::FromIterator;

#[test]
fn make_bid() {
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

        let auction_params = get_open_auction_params();

        // Start nft auction
        assert_ok!(Content::start_nft_auction(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ORIGIN, bid);

        // Make nft auction bid
        assert_ok!(Content::make_bid(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
            bid,
            vec![],
        ));

        // Runtime tested state after call

        let mut auction: Auction<Test> = AuctionRecord::new(auction_params.clone());
        let current_block = <frame_system::Module<Test>>::block_number();

        if auction_params.starts_at.is_none() {
            auction.starts_at = current_block;
        }

        let (auction, _, _) =
            auction.make_bid(SECOND_MEMBER_ID, SECOND_MEMBER_ORIGIN, bid, current_block);

        // Ensure nft status changed to given Auction
        assert!(matches!(
            Content::video_by_id(video_id).nft_status,
            Some(OwnedNFT {
                transactional_status: TransactionalStatus::Auction(auction_with_bid,),
                ..
            }) if auction == auction_with_bid
        ));

        let auction_bid_made_event = get_test_event(RawEvent::AuctionBidMade(
            SECOND_MEMBER_ID,
            video_id,
            bid,
            vec![],
            false,
        ));

        // Last event checked
        assert_event(auction_bid_made_event, number_of_events_before_call + 4);
    })
}

#[test]
fn make_bid_completes_auction() {
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

        let buy_now_price = Content::min_starting_price();

        let auction_params = AuctionParams {
            starting_price: buy_now_price,
            buy_now_price: Some(2 * buy_now_price),
            auction_type: AuctionType::Open(OpenAuctionDetails {
                bid_lock_duration: Content::min_bid_lock_duration(),
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

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        // deposit initial balance
        let bid = 2 * Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ORIGIN, bid);

        // Make nft auction bid
        assert_ok!(Content::make_bid(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
            bid,
            vec![],
        ));

        // Runtime tested state after call

        // Ensure nft status changed to given Auction
        assert!(matches!(
            Content::video_by_id(video_id).nft_status,
            Some(OwnedNFT {
                transactional_status: TransactionalStatus::Idle,
                owner,
                ..
            }) if owner == NFTOwner::Member(SECOND_MEMBER_ID)
        ));

        let nft_auction_started_event = get_test_event(RawEvent::BidMadeCompletingAuction(
            SECOND_MEMBER_ID,
            video_id,
            vec![],
        ));

        // Last event checked
        assert_event(nft_auction_started_event, number_of_events_before_call + 5);
    })
}

#[test]
fn make_bid_auth_failed() {
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

        let auction_params = get_open_auction_params();

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

        // Make an attempt to make auction bid providing wrong credentials
        let make_bid_result = Content::make_bid(
            Origin::signed(UNKNOWN_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
            bid,
            vec![],
        );

        // Failure checked
        assert_err!(make_bid_result, Error::<Test>::MemberAuthFailed);
    })
}

#[test]
fn make_bid_insufficient_balance() {
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

        let auction_params = get_open_auction_params();

        // Start nft auction
        assert_ok!(Content::start_nft_auction(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        let bid = Content::min_starting_price();

        // Make an attempt to make auction bid if account has insufficient balance
        let make_bid_result = Content::make_bid(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
            bid,
            vec![],
        );

        // Failure checked
        assert_err!(make_bid_result, Error::<Test>::InsufficientBalance);
    })
}

#[test]
fn make_bid_video_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ORIGIN, bid);

        // Make an attempt to make auction bid if corresponding video does not exist
        let make_bid_result = Content::make_bid(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
            bid,
            vec![],
        );

        // Failure checked
        assert_err!(make_bid_result, Error::<Test>::VideoDoesNotExist);
    })
}

#[test]
fn make_bid_nft_is_not_issued() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_simple_channel_and_video(FIRST_MEMBER_ORIGIN, FIRST_MEMBER_ID);

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ORIGIN, bid);

        // Make an attempt to make auction bid if corresponding nft is not issued yet
        let make_bid_result = Content::make_bid(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
            bid,
            vec![],
        );

        // Failure checked
        assert_err!(make_bid_result, Error::<Test>::NFTDoesNotExist);
    })
}

#[test]
fn make_bid_nft_is_not_in_auction_state() {
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

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ORIGIN, bid);

        // Make an attempt to make auction bid if corresponding nft is not in auction state
        let make_bid_result = Content::make_bid(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
            bid,
            vec![],
        );

        // Failure checked
        assert_err!(make_bid_result, Error::<Test>::NotInAuctionState);
    })
}

#[test]
fn make_bid_nft_auction_expired() {
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
                auction_duration: Content::min_auction_duration(),
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

        // Run to the block when auction expires
        run_to_block(Content::min_auction_duration() + 1);

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ORIGIN, 2 * bid);

        // Make an attempt to make auction bid if corresponding english nft auction is already expired
        let make_bid_result = Content::make_bid(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
            bid,
            vec![],
        );

        // Failure checked
        assert_err!(make_bid_result, Error::<Test>::NFTAuctionIsAlreadyExpired);
    })
}

#[test]
fn make_bid_nft_auction_is_not_started() {
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

        let starting_price = Content::min_starting_price();

        let auction_params = AuctionParams {
            starting_price,
            buy_now_price: None,
            auction_type: AuctionType::Open(OpenAuctionDetails {
                bid_lock_duration: Content::min_bid_lock_duration(),
            }),
            minimal_bid_step: Content::min_bid_step(),
            starts_at: Some(<frame_system::Module<Test>>::block_number() + 1),
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_nft_auction(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ORIGIN, starting_price);

        // Make an attempt to make auction bid if auction is not started
        let make_bid_result = Content::make_bid(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
            starting_price,
            vec![],
        );

        // Failure checked
        assert_err!(make_bid_result, Error::<Test>::AuctionDidNotStart);
    })
}

#[test]
fn make_bid_member_is_not_allowed_to_participate() {
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
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            auction_type: AuctionType::Open(OpenAuctionDetails {
                bid_lock_duration: Content::min_bid_lock_duration(),
            }),
            minimal_bid_step: Content::min_bid_step(),
            starts_at: Some(<frame_system::Module<Test>>::block_number() + 1),
            whitelist: BTreeSet::from_iter(vec![THIRD_MEMBER_ID, FOURTH_MEMBER_ID].into_iter()),
        };

        // Start nft auction
        assert_ok!(Content::start_nft_auction(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        // Run to the block when auction expires
        run_to_block(Content::min_auction_duration() + 1);

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ORIGIN, 2 * bid);

        // Make an attempt to make auction bid on auction with whitelist if member is not whitelisted
        let make_bid_result = Content::make_bid(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
            bid,
            vec![],
        );

        // Failure checked
        assert_err!(
            make_bid_result,
            Error::<Test>::MemberIsNotAllowedToParticipate
        );
    })
}

#[test]
fn make_bid_starting_price_constraint_violated() {
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
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            auction_type: AuctionType::Open(OpenAuctionDetails {
                bid_lock_duration: Content::min_bid_lock_duration(),
            }),
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

        let bid = Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ORIGIN, bid);

        // Make an attempt to make auction bid if bid amount provided is less then auction starting price
        let make_bid_result = Content::make_bid(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
            bid,
            vec![],
        );

        // Failure checked
        assert_err!(
            make_bid_result,
            Error::<Test>::StartingPriceConstraintViolated
        );
    })
}

#[test]
fn make_bid_bid_step_constraint_violated() {
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
            auction_type: AuctionType::Open(OpenAuctionDetails {
                bid_lock_duration: Content::min_bid_lock_duration(),
            }),
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

        let bid = Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ORIGIN, bid);

        // Make a successfull bid
        assert_ok!(Content::make_bid(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
            bid,
            vec![],
        ));

        let new_bid = bid + Content::min_bid_step() - 1;

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ORIGIN, new_bid);

        // Make an attempt to make auction bid if bid step constraint violated
        let make_bid_result = Content::make_bid(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            SECOND_MEMBER_ID,
            video_id,
            new_bid,
            vec![],
        );

        // Failure checked
        assert_err!(make_bid_result, Error::<Test>::BidStepConstraintViolated);
    })
}
