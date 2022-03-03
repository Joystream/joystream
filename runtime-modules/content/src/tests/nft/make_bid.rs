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
const BIDDER_BALANCE: u64 = NEXT_BID_OFFSET.saturating_add(DEFAULT_BUY_NOW_PRICE);

fn setup_open_auction_scenario() {
    let video_id = NextVideoId::<Test>::get();

    create_initial_storage_buckets_helper();
    increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
    increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, BIDDER_BALANCE);
    create_default_member_owned_channel_with_video();

    // Issue nft
    assert_ok!(Content::issue_nft(
        Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
        ContentActor::Member(DEFAULT_MEMBER_ID),
        video_id,
        NftIssuanceParameters::<Test>::default(),
    ));

    let auction_params = AuctionParams {
        starting_price: Content::min_starting_price(),
        buy_now_price: Some(DEFAULT_BUY_NOW_PRICE),
        auction_type: AuctionType::Open(OpenAuctionDetails {
            bid_lock_duration: Content::min_bid_lock_duration(),
        }),
        starts_at: None,
        whitelist: BTreeSet::new(),
    };

    // Start nft auction
    assert_ok!(Content::start_nft_auction(
        Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
        ContentActor::Member(DEFAULT_MEMBER_ID),
        video_id,
        auction_params.clone(),
    ));

    let bid = Content::min_starting_price();

    increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);

    // Make a successfull bid
    assert_ok!(Content::make_bid(
        Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
        SECOND_MEMBER_ID,
        video_id,
        bid,
    ));
}

fn setup_open_auction_scenario_with_bid() {
    let video_id = Content::next_video_id();
    setup_open_auction_scenario();

    let new_bid = Content::min_starting_price().saturating_add(NEXT_BID_OFFSET);

    // Make an attempt to make auction bid if bid step constraint violated
    let _ = Content::make_bid(
        Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
        SECOND_MEMBER_ID,
        video_id,
        new_bid,
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
        assert_ok!(Content::start_nft_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

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

        // Runtime tested state after call

        let mut auction: Auction<Test> = AuctionRecord::new(auction_params.clone());
        let current_block = <frame_system::Module<Test>>::block_number();

        if auction_params.starts_at.is_none() {
            auction.starts_at = current_block;
        }

        let (auction, _, _) = auction.make_bid(
            SECOND_MEMBER_ID,
            SECOND_MEMBER_ACCOUNT_ID,
            bid,
            current_block,
        );

        // Ensure nft status changed to given Auction
        assert!(matches!(
            Content::video_by_id(video_id).nft_status,
            Some(OwnedNft {
                transactional_status: TransactionalStatus::<Test>::Auction(auction_with_bid,),
                ..
            }) if auction == auction_with_bid
        ));

        // Last event checked
        assert_event(
            MetaEvent::content(RawEvent::AuctionBidMade(
                SECOND_MEMBER_ID,
                video_id,
                bid,
                false,
            )),
            number_of_events_before_call + 4,
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
        assert_ok!(Content::start_nft_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ACCOUNT_ID, bid);

        // Make an attempt to make auction bid providing wrong credentials
        let make_bid_result = Content::make_bid(
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
        assert_ok!(Content::start_nft_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        let bid = Content::min_starting_price();

        // Make an attempt to make auction bid if account has insufficient balance
        let make_bid_result = Content::make_bid(
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
        let make_bid_result = Content::make_bid(
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
        let make_bid_result = Content::make_bid(
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
        let make_bid_result = Content::make_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            bid,
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

        let auction_params = AuctionParams {
            starting_price: Content::min_starting_price(),
            buy_now_price: None,
            auction_type: AuctionType::English(EnglishAuctionDetails {
                extension_period: Content::min_auction_extension_period(),
                auction_duration: Content::min_auction_duration(),
                bid_step: Content::max_bid_step(),
            }),
            starts_at: None,
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_nft_auction(
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

        // Make an attempt to make auction bid if corresponding english nft auction is already expired
        let make_bid_result = Content::make_bid(
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
fn make_bid_nft_auction_is_not_started() {
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

        let starting_price = Content::min_starting_price();

        let auction_params = AuctionParams {
            starting_price,
            buy_now_price: None,
            auction_type: AuctionType::Open(OpenAuctionDetails {
                bid_lock_duration: Content::min_bid_lock_duration(),
            }),
            starts_at: Some(<frame_system::Module<Test>>::block_number() + 1),
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_nft_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        let _ =
            balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ACCOUNT_ID, starting_price);

        // Make an attempt to make auction bid if auction is not started
        let make_bid_result = Content::make_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            starting_price,
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

        let auction_params = AuctionParams {
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            auction_type: AuctionType::Open(OpenAuctionDetails {
                bid_lock_duration: Content::min_bid_lock_duration(),
            }),
            starts_at: Some(<frame_system::Module<Test>>::block_number() + 1),
            whitelist: BTreeSet::from_iter(
                vec![COLLABORATOR_MEMBER_ID, DEFAULT_MODERATOR_ID].into_iter(),
            ),
        };

        // Start nft auction
        assert_ok!(Content::start_nft_auction(
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
        let make_bid_result = Content::make_bid(
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

        let auction_params = AuctionParams {
            starting_price: Content::max_starting_price(),
            buy_now_price: None,
            auction_type: AuctionType::Open(OpenAuctionDetails {
                bid_lock_duration: Content::min_bid_lock_duration(),
            }),
            starts_at: None,
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_nft_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        let bid = Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ACCOUNT_ID, bid);

        // Make an attempt to make auction bid if bid amount provided is less then auction starting price
        let make_bid_result = Content::make_bid(
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
fn make_bid_bid_step_zero_allowed() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = Content::next_video_id();
        setup_open_auction_scenario();

        let new_bid = Content::min_starting_price();
        // Make an attempt to make auction bid if bid step constraint violated
        let make_bid_result = Content::make_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            new_bid,
        );

        // Failure checked
        assert_ok!(make_bid_result);
    })
}

#[test]
fn make_bid_fails_with_lower_offer_and_locking_period_not_expired() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = Content::next_video_id();
        setup_open_auction_scenario_with_bid();

        // attemp to lower the offer on the same block -> error
        assert_err!(
            Content::make_bid(
                Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
                SECOND_MEMBER_ID,
                video_id,
                Content::min_starting_price(),
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
        setup_open_auction_scenario_with_bid();

        // attemp to lower the offer on the same block -> error
        assert_ok!(Content::make_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            Content::min_starting_price() + (2 * NEXT_BID_OFFSET)
        ));
    })
}

#[test]
fn make_bid_succeeds_with_auction_completion_and_outstanding_bids() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = Content::next_video_id();
        setup_open_auction_scenario_with_bid();

        assert_ok!(Content::make_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            DEFAULT_BUY_NOW_PRICE.saturating_add(NEXT_BID_OFFSET),
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::BidMadeCompletingAuction(
                SECOND_MEMBER_ID,
                video_id,
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
        setup_open_auction_scenario();

        assert_ok!(Content::make_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            DEFAULT_BUY_NOW_PRICE.saturating_add(NEXT_BID_OFFSET),
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::BidMadeCompletingAuction(
                SECOND_MEMBER_ID,
                video_id,
            ))
        );
    })
}
