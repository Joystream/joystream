#![cfg(test)]
use crate::tests::fixtures::{
    create_default_member_owned_channel_with_video, create_initial_storage_buckets_helper,
    increase_account_balance_helper,
};
use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

const AUCTION_END_BLOCK: u64 = 10;
const AUCTION_START_BLOCK: u64 = 1;
#[test]
fn claim_won_english_auction() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(AUCTION_START_BLOCK);

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
            auction_duration: Content::max_auction_duration(),
            min_bid_step: Content::min_bid_step(),
            end: AUCTION_END_BLOCK,
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

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        // Run to the block where auction expires
        run_to_block(Content::max_auction_duration() + 1);

        // Claim won english auction
        assert_ok!(Content::claim_won_english_auction(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
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
            MetaEvent::content(RawEvent::EnglishAuctionCompleted(
                SECOND_MEMBER_ID,
                video_id,
            )),
            number_of_events_before_call + 1,
        );
    })
}

#[test]
fn claim_won_english_auction_cannot_be_completed() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(AUCTION_START_BLOCK);

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
            auction_duration: Content::max_auction_duration(),
            min_bid_step: Content::min_bid_step(),
            end: AUCTION_END_BLOCK,
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

        // Make an attempt to claim won english auction if it did not expire yet
        let claim_won_english_auction_result = Content::claim_won_english_auction(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
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
        run_to_block(AUCTION_START_BLOCK);

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
            auction_duration: Content::max_auction_duration(),
            min_bid_step: Content::min_bid_step(),
            end: AUCTION_END_BLOCK,
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

        // Run to the block where auction expires
        run_to_block(Content::max_auction_duration() + 1);

        // Make an attempt to claim won english auction with wrong credentials
        let claim_won_english_auction_result = Content::claim_won_english_auction(
            Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
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
        run_to_block(AUCTION_START_BLOCK);

        let video_id = NextVideoId::<Test>::get();

        // Make an attempt to claim won english auction which corresponding video does not exist
        let claim_won_english_auction_result = Content::claim_won_english_auction(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
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
        run_to_block(AUCTION_START_BLOCK);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Make an attempt to claim won english auction for nft which is not issued yet
        let claim_won_english_auction_result = Content::claim_won_english_auction(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
        );

        // Failure checked
        assert_err!(
            claim_won_english_auction_result,
            Error::<Test>::NftDoesNotExist
        );
    })
}

#[test]
fn claim_won_english_auction_not_in_auction_state() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(AUCTION_START_BLOCK);

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

        // Make an attempt to claim won english auction for nft which is not in auction state
        let claim_won_english_auction_result = Content::claim_won_english_auction(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
        );

        // Failure checked
        assert_err!(
            claim_won_english_auction_result,
            Error::<Test>::IsNotEnglishAuctionType,
        );
    })
}

#[test]
fn claim_won_english_auction_is_not_english_auction_type() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(AUCTION_START_BLOCK);

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

        // Make an attempt to claim won english auction for nft which is not in english auction state
        let claim_won_english_auction_result = Content::claim_won_english_auction(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
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
        run_to_block(AUCTION_START_BLOCK);

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
            auction_duration: Content::max_auction_duration(),
            min_bid_step: Content::min_bid_step(),
            end: AUCTION_END_BLOCK,
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_english_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params.clone(),
        ));

        // Run to the block where auction expires
        run_to_block(Content::max_auction_duration() + 1);

        // Make an attempt to claim won english auction if last bid does not exist
        let claim_won_english_auction_result = Content::claim_won_english_auction(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
        );

        // Failure checked
        assert_err!(
            claim_won_english_auction_result,
            Error::<Test>::BidDoesNotExist
        );
    })
}
