#![cfg(test)]
use crate::tests::fixtures::{
    create_default_member_owned_channel_with_video, create_initial_storage_buckets_helper,
    increase_account_balance_helper,
};
use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

const NEXT_BID_OFFSET: u64 = 10;
const AUCTION_ENDING_BLOCK: u64 = 10;

#[test]
fn pick_open_auction_winner() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        let bid_lock_duration = Content::min_bid_lock_duration();

        let auction_params = OpenAuctionParams::<Test> {
            starting_price: Content::min_starting_price(),
            buy_now_price: None,
            bid_lock_duration,
            whitelist: BTreeSet::new(),
        };

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

        // Make nft auction bid
        assert_ok!(Content::make_open_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            bid,
        ));

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        // Pick open auction winner
        assert_ok!(Content::pick_open_auction_winner(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            SECOND_MEMBER_ID,
            bid,
        ));

        // Runtime tested state after call

        // Ensure english auction successfully completed
        assert!(matches!(
            Content::video_by_id(video_id).nft_status,
            Some(OwnedNft {
                transactional_status: TransactionalStatus::<Test>::Idle,
                ..
            })
        ));

        // Last event checked
        assert_event(
            MetaEvent::content(RawEvent::OpenAuctionBidAccepted(
                ContentActor::Member(DEFAULT_MEMBER_ID),
                video_id,
                bid,
            )),
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

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        let bid_lock_duration = Content::min_bid_lock_duration();

        let auction_params = OpenAuctionParams::<Test> {
            starting_price: Content::min_starting_price(),
            buy_now_price: None,
            bid_lock_duration,
            whitelist: BTreeSet::new(),
        };

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

        // Make nft auction bid
        assert_ok!(Content::make_open_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            bid,
        ));

        // Run to the block where auction expires
        run_to_block(Content::max_auction_duration() + 1);

        // Make an attempt to pick open auction winner with wrong credentials
        let pick_open_auction_winner_result = Content::pick_open_auction_winner(
            Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            ContentActor::Member(SECOND_MEMBER_ID),
            video_id,
            SECOND_MEMBER_ID,
            bid,
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

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        let bid_lock_duration = Content::min_bid_lock_duration();

        let auction_params = OpenAuctionParams::<Test> {
            starting_price: Content::min_starting_price(),
            buy_now_price: None,
            bid_lock_duration,
            whitelist: BTreeSet::new(),
        };

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

        // Make nft auction bid
        assert_ok!(Content::make_open_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            bid,
        ));

        // Run to the block where auction expires
        run_to_block(Content::max_auction_duration() + 1);

        // Make an attempt to pick open auction winner if actor is not authorized to do this
        let pick_open_auction_winner_result = Content::pick_open_auction_winner(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            ContentActor::Member(SECOND_MEMBER_ID),
            video_id,
            SECOND_MEMBER_ID,
            bid,
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
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            ContentActor::Member(SECOND_MEMBER_ID),
            video_id,
            SECOND_MEMBER_ID,
            Content::min_starting_price(),
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

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);

        // Make an attempt to pick open auction winner for nft which is not issued yet
        let pick_open_auction_winner_result = Content::pick_open_auction_winner(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            ContentActor::Member(SECOND_MEMBER_ID),
            video_id,
            SECOND_MEMBER_ID,
            Content::min_starting_price(),
        );

        // Failure checked
        assert_err!(
            pick_open_auction_winner_result,
            Error::<Test>::NftDoesNotExist
        );
    })
}

#[test]
fn pick_open_auction_winner_not_in_auction_state() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        // Make an attempt to pick open auction winner for nft which is not in auction state
        let pick_open_auction_winner_result = Content::pick_open_auction_winner(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            SECOND_MEMBER_ID,
            Content::min_starting_price(),
        );

        // Failure checked
        assert_err!(
            pick_open_auction_winner_result,
            Error::<Test>::IsNotOpenAuctionType,
        );
    })
}

#[test]
fn pick_open_auction_winner_is_not_open_auction_type() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);

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
            auction_duration: Content::max_auction_duration(),
            min_bid_step: Content::max_bid_step(),
            end: AUCTION_ENDING_BLOCK,
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_english_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Module::<Test>::deposit_creating(&SECOND_MEMBER_ACCOUNT_ID, bid);

        // Make nft auction bid
        assert_ok!(Content::make_english_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            bid,
        ));

        // Make an attempt to pick open auction winner for nft which is in english auction state
        let pick_open_auction_winner_result = Content::pick_open_auction_winner(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            SECOND_MEMBER_ID,
            bid,
        );

        // Failure checked
        assert_err!(
            pick_open_auction_winner_result,
            Error::<Test>::IsNotOpenAuctionType
        );
    })
}

#[test]
fn pick_open_auction_winner_bid_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        let bid_lock_duration = Content::min_bid_lock_duration();

        let auction_params = OpenAuctionParams::<Test> {
            starting_price: Content::min_starting_price(),
            buy_now_price: None,
            bid_lock_duration,
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_open_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        // Run to the block where auction expires
        run_to_block(Content::max_auction_duration() + 1);

        // Make an attempt to pick open auction winner if last bid does not exist
        let pick_open_auction_winner_result = Content::pick_open_auction_winner(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            SECOND_MEMBER_ID,
            Content::min_starting_price(),
        );

        // Failure checked
        assert_err!(
            pick_open_auction_winner_result,
            Error::<Test>::BidDoesNotExist
        );
    })
}

#[test]
fn pick_open_auction_winner_fails_with_invalid_bid_commit() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        let start_block = 1;
        run_to_block(start_block);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        let bid_lock_duration = Content::min_bid_lock_duration();

        let auction_params = OpenAuctionParams::<Test> {
            starting_price: Content::min_starting_price(),
            buy_now_price: None,
            bid_lock_duration,
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_open_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        // deposit initial balance
        let low_bid = Content::min_starting_price();
        let high_bid = low_bid.saturating_add(NEXT_BID_OFFSET);

        let _ = balances::Module::<Test>::deposit_creating(
            &SECOND_MEMBER_ACCOUNT_ID,
            high_bid + low_bid,
        );

        // Make nft auction bid
        assert_ok!(Content::make_open_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            high_bid,
        ));

        run_to_block(bid_lock_duration + start_block);

        // Attempt to race
        assert_ok!(Content::make_open_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            low_bid,
        ));

        // bid amount secured by commit
        assert_err!(
            Content::pick_open_auction_winner(
                Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
                ContentActor::Member(DEFAULT_MEMBER_ID),
                video_id,
                SECOND_MEMBER_ID,
                high_bid,
            ),
            Error::<Test>::InvalidBidAmountSpecified,
        );
    })
}
