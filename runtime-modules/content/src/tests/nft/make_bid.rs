#![cfg(test)]
use crate::tests::fixtures::{
    create_default_member_owned_channel_with_video, create_initial_storage_buckets_helper,
    increase_account_balance_helper,
};
use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};
use std::iter::FromIterator;

const NEXT_BID_OFFSET: u64 = 10;
const DEFAULT_BUY_NOW_PRICE: u64 = 1_000;
const AUCTION_DURATION: u64 = 10;
const BIDDER_BALANCE: u64 = NEXT_BID_OFFSET.saturating_add(DEFAULT_BUY_NOW_PRICE);

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

    let auction_params = OpenAuctionParams::<Test> {
        starting_price: Content::min_starting_price(),
        buy_now_price: Some(DEFAULT_BUY_NOW_PRICE),
        bid_lock_duration: Content::min_bid_lock_duration(),
        whitelist: BTreeSet::new(),
        starts_at: None,
    };

    // Start nft auction
    assert_ok!(Content::start_open_auction(
        Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
        ContentActor::Member(DEFAULT_MEMBER_ID),
        video_id,
        auction_params.clone(),
    ));
}

fn setup_english_auction_scenario() {
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

    let auction_params = EnglishAuctionParams::<Test> {
        starts_at: None,
        starting_price: Content::min_starting_price(),
        buy_now_price: Some(DEFAULT_BUY_NOW_PRICE),
        extension_period: Content::min_auction_extension_period(),
        duration: Content::min_auction_duration(),
        min_bid_step: Content::min_bid_step(),
        whitelist: BTreeSet::new(),
    };

    // Start nft auction
    assert_ok!(Content::start_english_auction(
        Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
        ContentActor::Member(DEFAULT_MEMBER_ID),
        video_id,
        auction_params.clone(),
    ));
}

fn setup_open_auction_scenario_with_bid(amount: u64) {
    let video_id = Content::next_video_id();
    setup_open_auction_scenario();

    // Make an attempt to make auction bid if bid step constraint violated
    assert_ok!(Content::make_open_auction_bid(
        Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
        SECOND_MEMBER_ID,
        video_id,
        amount,
    ));

    assert_eq!(
        System::events().last().unwrap().event,
        MetaEvent::content(RawEvent::AuctionBidMade(
            SECOND_MEMBER_ID,
            video_id,
            amount,
            None
        ))
    );
}

#[test]
fn make_bid() {
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

        // Start nft auction
        assert_ok!(Content::start_open_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        // Runtime tested state before call

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ACCOUNT_ID, bid);

        // Make nft auction bid
        assert_ok!(Content::make_open_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            bid,
        ));

        // Ensure nft status changed to given Auction
        let nft = Content::ensure_nft_exists(video_id).unwrap();
        assert!(matches!(
            nft.transactional_status,
            TransactionalStatus::<Test>::OpenAuction(_),
        ));

        // Last event checked
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::AuctionBidMade(
                SECOND_MEMBER_ID,
                video_id,
                bid,
                None
            )),
        );
    })
}

#[test]
fn make_bid_auth_failed() {
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

        // Start nft auction
        assert_ok!(Content::start_open_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ACCOUNT_ID, bid);

        // Make an attempt to make auction bid providing wrong credentials
        let make_bid_result = Content::make_open_auction_bid(
            Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            DEFAULT_MEMBER_ID,
            video_id,
            bid,
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

        // Start nft auction
        assert_ok!(Content::start_open_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        let bid = Content::min_starting_price();

        // Make an attempt to make auction bid if account has insufficient balance
        let make_bid_result = Content::make_open_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            bid,
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

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ACCOUNT_ID, bid);

        // Make an attempt to make auction bid if corresponding video does not exist
        let make_bid_result = Content::make_open_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            bid,
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

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ACCOUNT_ID, bid);

        // Make an attempt to make auction bid if corresponding nft is not issued yet
        let make_bid_result = Content::make_open_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            bid,
        );

        // Failure checked
        assert_err!(make_bid_result, Error::<Test>::NftDoesNotExist);
    })
}

#[test]
fn make_bid_nft_is_not_in_auction_state() {
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

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ACCOUNT_ID, bid);

        // Make an attempt to make auction bid if corresponding nft is not in auction state
        let make_bid_result = Content::make_open_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            bid,
        );

        // Failure checked
        assert_err!(make_bid_result, Error::<Test>::IsNotOpenAuctionType);
    })
}

#[test]
fn make_bid_nft_auction_expired() {
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

        let auction_params = EnglishAuctionParams::<Test> {
            starting_price: Content::min_starting_price(),
            buy_now_price: None,
            extension_period: Content::min_auction_extension_period(),
            min_bid_step: Content::max_bid_step(),
            starts_at: None,
            duration: AUCTION_DURATION,
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_english_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        // Run to the block when auction expires
        run_to_block(AUCTION_DURATION + 2);

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ACCOUNT_ID, 2 * bid);

        // Make an attempt to make auction bid if corresponding english nft auction is already expired
        let make_bid_result = Content::make_english_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            bid,
        );

        // Failure checked
        assert_err!(make_bid_result, Error::<Test>::NftAuctionIsAlreadyExpired);
    })
}

#[test]
fn make_bid_member_is_not_allowed_to_participate() {
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

        let auction_params = OpenAuctionParams::<Test> {
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            starts_at: None,
            bid_lock_duration: Content::min_bid_lock_duration(),
            whitelist: BTreeSet::from_iter(
                vec![COLLABORATOR_MEMBER_ID, DEFAULT_MODERATOR_ID].into_iter(),
            ),
        };

        // Start nft auction
        assert_ok!(Content::start_open_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        // Run to the block when auction expires
        run_to_block(Content::min_auction_duration() + 1);

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ACCOUNT_ID, 2 * bid);

        // Make an attempt to make auction bid on auction with whitelist if member is not whitelisted
        let make_bid_result = Content::make_open_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            bid,
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

        let auction_params = OpenAuctionParams::<Test> {
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            starts_at: None,
            bid_lock_duration: Content::min_bid_lock_duration(),
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_open_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        let bid = Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ACCOUNT_ID, bid);

        // Make an attempt to make auction bid if bid amount provided is less then auction starting price
        let make_bid_result = Content::make_open_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            bid,
        );

        // Failure checked
        assert_err!(
            make_bid_result,
            Error::<Test>::StartingPriceConstraintViolated
        );
    })
}

#[test]
fn make_bid_fails_with_lower_offer_and_locking_period_not_expired() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        let start_block = 1;
        run_to_block(start_block);

        let video_id = Content::next_video_id();

        let low_bid = Content::min_starting_price();
        let high_bid = low_bid.saturating_add(NEXT_BID_OFFSET);

        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, high_bid + low_bid);
        setup_open_auction_scenario_with_bid(high_bid);

        // attemp to lower the offer while bid still locked -> error
        run_to_block(start_block + Content::min_bid_lock_duration() - 1);
        assert_err!(
            Content::make_open_auction_bid(
                Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
                SECOND_MEMBER_ID,
                video_id,
                low_bid,
            ),
            Error::<Test>::BidLockDurationIsNotExpired
        );
    })
}

#[test]
fn make_bid_succeeds_with_higher_offer_and_locking_period_not_expired() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = Content::next_video_id();
        let first_bid = Content::min_starting_price();
        let second_bid = first_bid.saturating_add(NEXT_BID_OFFSET);
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, second_bid + first_bid);
        setup_open_auction_scenario_with_bid(first_bid);

        // attemp to lower the offer on the same block -> error
        assert_ok!(Content::make_open_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            second_bid,
        ));
    })
}

#[test]
fn make_bid_fails_by_unreserving_prevous_funds() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = Content::next_video_id();
        let init_bid = Content::min_starting_price();
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, init_bid);

        setup_open_auction_scenario_with_bid(init_bid);

        let new_bid = init_bid.saturating_add(NEXT_BID_OFFSET);
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, NEXT_BID_OFFSET);
        assert_eq!(
            Balances::<Test>::total_balance(&SECOND_MEMBER_ACCOUNT_ID),
            new_bid
        );

        assert_err!(
            Content::make_open_auction_bid(
                Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
                SECOND_MEMBER_ID,
                video_id,
                new_bid,
            ),
            Error::<Test>::InsufficientBalance
        );
    })
}

#[test]
fn make_bid_succeeds_with_auction_completion_and_outstanding_bids() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = Content::next_video_id();
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, BIDDER_BALANCE);
        setup_open_auction_scenario_with_bid(Content::min_starting_price());

        assert_ok!(Content::make_open_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            DEFAULT_BUY_NOW_PRICE,
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::BidMadeCompletingAuction(
                SECOND_MEMBER_ID,
                video_id,
                None
            ))
        );
    })
}

#[test]
fn make_bid_succeeds_with_auction_completion_and_no_outstanding_bids() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = Content::next_video_id();
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, BIDDER_BALANCE);
        setup_open_auction_scenario();

        assert_ok!(Content::make_open_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            DEFAULT_BUY_NOW_PRICE,
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::BidMadeCompletingAuction(
                SECOND_MEMBER_ID,
                video_id,
                None
            ))
        );
    })
}

#[test]
fn english_auction_bid_made_event_includes_prev_top_bidder() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = Content::next_video_id();
        setup_english_auction_scenario();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, BIDDER_BALANCE);
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, BIDDER_BALANCE);

        let first_bid_amount = Content::min_bid_step();
        let second_bid_amount = Content::min_bid_step() * 2;
        let third_bid_amount = Content::min_bid_step() * 3;

        assert_ok!(Content::make_english_auction_bid(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            DEFAULT_MEMBER_ID,
            video_id,
            first_bid_amount,
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::AuctionBidMade(
                DEFAULT_MEMBER_ID,
                video_id,
                first_bid_amount,
                None
            ))
        );

        assert_ok!(Content::make_english_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            second_bid_amount,
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::AuctionBidMade(
                SECOND_MEMBER_ID,
                video_id,
                second_bid_amount,
                Some(DEFAULT_MEMBER_ID)
            ))
        );

        assert_ok!(Content::make_english_auction_bid(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            DEFAULT_MEMBER_ID,
            video_id,
            third_bid_amount,
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::AuctionBidMade(
                DEFAULT_MEMBER_ID,
                video_id,
                third_bid_amount,
                Some(SECOND_MEMBER_ID)
            ))
        );
    })
}

#[test]
fn english_auction_bid_made_completing_auction_event_with_no_previous_bidder() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = Content::next_video_id();
        setup_english_auction_scenario();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, BIDDER_BALANCE);

        assert_ok!(Content::make_english_auction_bid(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            DEFAULT_MEMBER_ID,
            video_id,
            DEFAULT_BUY_NOW_PRICE,
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::BidMadeCompletingAuction(
                DEFAULT_MEMBER_ID,
                video_id,
                None
            ))
        );
    })
}

#[test]
fn english_auction_bid_made_completing_auction_event_with_previous_bidder() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = Content::next_video_id();
        setup_english_auction_scenario();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, BIDDER_BALANCE);
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, BIDDER_BALANCE);

        assert_ok!(Content::make_english_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            Content::min_bid_step(),
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::AuctionBidMade(
                SECOND_MEMBER_ID,
                video_id,
                Content::min_bid_step(),
                None
            ))
        );

        assert_ok!(Content::make_english_auction_bid(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            DEFAULT_MEMBER_ID,
            video_id,
            DEFAULT_BUY_NOW_PRICE
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::BidMadeCompletingAuction(
                DEFAULT_MEMBER_ID,
                video_id,
                Some(SECOND_MEMBER_ID)
            ))
        );
    })
}

#[test]
fn make_bid_with_open_auction_is_not_started() {
    with_default_mock_builder(|| {
        let starting_block = 1;
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

        let auction_params = OpenAuctionParams::<Test> {
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            starts_at: Some(starting_block + 5),
            bid_lock_duration: Content::min_bid_lock_duration(),
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_open_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        // Make an attempt to make auction bid if auction is not started
        let bid = Content::min_starting_price();
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, bid);
        let make_bid_result = Content::make_open_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            bid,
        );

        // Failure checked
        assert_err!(make_bid_result, Error::<Test>::AuctionDidNotStart);
    })
}

#[test]
fn make_bid_with_english_auction_is_not_started() {
    with_default_mock_builder(|| {
        let starting_block = 1;
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

        let auction_params = EnglishAuctionParams::<Test> {
            starting_price: Content::min_starting_price(),
            buy_now_price: None,
            extension_period: Content::min_auction_extension_period(),
            min_bid_step: Content::max_bid_step(),
            starts_at: Some(starting_block + 5),
            duration: AUCTION_DURATION,
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_english_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        // Make an attempt to make auction bid if auction is not started
        let bid = Content::min_starting_price();
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, bid);
        let make_bid_result = Content::make_english_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            bid,
        );

        // Failure checked
        assert_err!(make_bid_result, Error::<Test>::AuctionDidNotStart);
    })
}
