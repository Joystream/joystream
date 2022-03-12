#![cfg(test)]
use crate::tests::fixtures::{
    create_default_member_owned_channel_with_video, create_initial_storage_buckets_helper,
    increase_account_balance_helper,
};
use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

fn setup_open_auction_scenario() {
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

    let auction_params = AuctionParams::<Test> {
        starting_price: Content::min_starting_price(),
        buy_now_price: None,
        auction_type: AuctionType::<_, _>::Open(Content::min_bid_lock_duration()),
        whitelist: BTreeSet::new(),
    };

    // Start nft auction
    assert_ok!(Content::start_nft_auction(
        Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
        ContentActor::Member(DEFAULT_MEMBER_ID),
        video_id,
        auction_params.clone(),
    ));
}

fn setup_open_auction_scenario_with_bid() {
    let video_id = Content::next_video_id();
    setup_open_auction_scenario();

    // deposit initial balance
    let bid = Content::min_starting_price();

    let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ACCOUNT_ID, bid);

    // Make nft auction bid
    assert_ok!(Content::make_bid(
        Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
        SECOND_MEMBER_ID,
        video_id,
        bid,
    ));
}

#[test]
fn cancel_open_auction_bid() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = Content::next_video_id();
        setup_open_auction_scenario_with_bid();

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        // Run to the block where bid lock duration expires
        let bid_lock_duration = Content::min_bid_lock_duration();
        run_to_block(bid_lock_duration + 1);

        // Cancel auction bid
        assert_ok!(Content::cancel_open_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
        ));

        // Runtime tested state after call

        // Ensure bid on specific auction successfully canceled
        assert!(!BidByVideoByMember::<Test>::contains_key(
            video_id,
            SECOND_MEMBER_ID
        ));

        // Last event checked
        assert_event(
            MetaEvent::content(RawEvent::AuctionBidCanceled(SECOND_MEMBER_ID, video_id)),
            number_of_events_before_call + 2,
        );
    })
}

#[test]
fn cancel_open_auction_bid_lock_duration_did_not_expire() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = Content::next_video_id();
        setup_open_auction_scenario_with_bid();

        // Make an attempt to cancel open auction bid if lock duration did not expire
        let cancel_open_auction_bid_result = Content::cancel_open_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
        );

        // Failure checked
        assert_err!(
            cancel_open_auction_bid_result,
            Error::<Test>::BidLockDurationIsNotExpired
        );
    })
}

#[test]
fn cancel_open_auction_bid_auth_failed() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = Content::next_video_id();
        setup_open_auction_scenario_with_bid();

        // Run to the block where bid lock duration expires
        let bid_lock_duration = Content::min_bid_lock_duration();
        run_to_block(bid_lock_duration + 1);

        // Make an attempt to cancel open auction bid with wrong credentials
        let cancel_open_auction_bid_result = Content::cancel_open_auction_bid(
            Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
        );

        // Failure checked
        assert_err!(
            cancel_open_auction_bid_result,
            Error::<Test>::MemberAuthFailed
        );
    })
}

#[test]
fn cancel_open_auction_bid_video_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        // Make an attempt to cancel open auction bid which corresponding video does not exist
        let cancel_open_auction_bid_result = Content::cancel_open_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
        );

        // Failure checked
        assert_err!(
            cancel_open_auction_bid_result,
            Error::<Test>::VideoDoesNotExist
        );
    })
}

#[test]
fn cancel_open_auction_bid_nft_is_not_issued() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Make an attempt to cancel open auction bid for nft which is not issued yet
        let cancel_open_auction_bid_result = Content::cancel_open_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
        );

        // Failure checked
        assert_err!(
            cancel_open_auction_bid_result,
            Error::<Test>::NftDoesNotExist
        );
    })
}

#[test]
fn cancel_open_auction_bid_last_bid_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = Content::next_video_id();
        setup_open_auction_scenario();

        // Run to the block where bid lock duration expires
        let bid_lock_duration = Content::min_bid_lock_duration();
        run_to_block(bid_lock_duration + 1);

        // Make an attempt to cancel open auction bid if it does not exist
        let cancel_open_auction_bid_result = Content::cancel_open_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
        );

        // Failure checked
        assert_err!(
            cancel_open_auction_bid_result,
            Error::<Test>::BidDoesNotExist
        );
    })
}

#[test]
fn cancel_open_auction_fails_for_with_non_bidder() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = Content::next_video_id();
        setup_open_auction_scenario_with_bid();

        // Run to the block where bid lock duration expires
        let bid_lock_duration = Content::min_bid_lock_duration();
        run_to_block(bid_lock_duration + 1);

        // Make an attempt to cancel open auction bid if actor is not a last bidder
        let cancel_open_auction_bid_result = Content::cancel_open_auction_bid(
            Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            UNAUTHORIZED_MEMBER_ID,
            video_id,
        );

        // Failure checked
        assert_err!(
            cancel_open_auction_bid_result,
            Error::<Test>::BidDoesNotExist
        );
    })
}

#[test]
fn cancel_open_auction_ok_for_expired_auction() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = Content::next_video_id();
        increase_account_balance_helper(DEFAULT_MODERATOR_ACCOUNT_ID, INITIAL_BALANCE);
        setup_open_auction_scenario_with_bid();

        let bid = Content::min_starting_price();

        assert_ok!(Content::make_bid(
            Origin::signed(DEFAULT_MODERATOR_ACCOUNT_ID),
            DEFAULT_MODERATOR_ID,
            video_id,
            bid,
        ));

        assert_ok!(Content::pick_open_auction_winner(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            DEFAULT_MODERATOR_ID,
            bid,
        ));

        // Attempt OK: auction closed
        assert_ok!(Content::cancel_open_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
        ));
    })
}
