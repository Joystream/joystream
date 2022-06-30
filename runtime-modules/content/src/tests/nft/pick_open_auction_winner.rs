#![cfg(test)]
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_noop, assert_ok};

const NEXT_BID_OFFSET: u64 = 10;
const AUCTION_DURATION: u64 = 10;

#[test]
fn pick_open_auction_winner() {
    with_default_mock_builder(|| {
        let video_id = NextVideoId::<Test>::get();

        // TODO: Should not be required afer https://github.com/Joystream/joystream/issues/3508
        make_content_module_account_existential_deposit();

        ContentTest::default().with_video().setup();

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
            starts_at: None,
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_open_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        ));

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Pallet::<Test>::deposit_creating(&SECOND_MEMBER_ACCOUNT_ID, bid);

        // Make nft auction bid
        assert_ok!(Content::make_open_auction_bid(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            bid,
        ));

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
        last_event_eq!(RawEvent::OpenAuctionBidAccepted(
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            SECOND_MEMBER_ID,
            bid,
        ));
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
            starts_at: None,
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_open_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        ));

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Pallet::<Test>::deposit_creating(&SECOND_MEMBER_ACCOUNT_ID, bid);

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
            starts_at: None,
            bid_lock_duration,
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_open_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        ));

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Pallet::<Test>::deposit_creating(&SECOND_MEMBER_ACCOUNT_ID, bid);

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
        create_default_member_owned_channel_with_video();

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
        create_default_member_owned_channel_with_video();

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
            auction_params,
        ));

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Pallet::<Test>::deposit_creating(&SECOND_MEMBER_ACCOUNT_ID, bid);

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
            starts_at: None,
            bid_lock_duration,
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_open_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
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
            starts_at: None,
            bid_lock_duration,
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_open_auction(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        ));

        // deposit initial balance
        let low_bid = Content::min_starting_price();
        let high_bid = low_bid.saturating_add(NEXT_BID_OFFSET);

        let _ = balances::Pallet::<Test>::deposit_creating(
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

#[test]
fn pick_open_auction_winner_ok_with_nft_member_owner_correctly_credited() {
    with_default_mock_builder(|| {
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, DEFAULT_NFT_PRICE);
        let royalty = Perbill::from_percent(DEFAULT_ROYALTY).mul_floor(DEFAULT_NFT_PRICE);
        let platform_fee = Content::platform_fee_percentage().mul_floor(DEFAULT_NFT_PRICE);
        ContentTest::default().with_video().setup();
        IssueNftFixture::default()
            .with_non_channel_owner(THIRD_MEMBER_ID)
            .with_royalty(Perbill::from_percent(1))
            .call_and_assert(Ok(()));
        StartOpenAuctionFixture::default()
            .with_sender(THIRD_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(THIRD_MEMBER_ID))
            .call_and_assert(Ok(()));
        MakeOpenAuctionBidFixture::default()
            .with_bid(DEFAULT_NFT_PRICE)
            .call_and_assert(Ok(()));

        assert_ok!(Content::pick_open_auction_winner(
            Origin::signed(THIRD_MEMBER_ACCOUNT_ID),
            ContentActor::Member(THIRD_MEMBER_ID),
            VideoId::one(),
            SECOND_MEMBER_ID,
            DEFAULT_NFT_PRICE
        ));

        // net revenue for member owner : NFT PRICE - ROYALTY - FEE
        assert_eq!(
            Balances::<Test>::usable_balance(THIRD_MEMBER_ACCOUNT_ID),
            DEFAULT_NFT_PRICE - royalty - platform_fee
        );
    })
}

#[test]
fn pick_open_auction_ok_with_channel_owner_correctly_credited() {
    with_default_mock_builder(|| {
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, DEFAULT_NFT_PRICE);
        let platform_fee = Content::platform_fee_percentage().mul_floor(DEFAULT_NFT_PRICE);
        ContentTest::default().with_video().setup();
        IssueNftFixture::default()
            .with_royalty(Perbill::from_percent(1))
            .call_and_assert(Ok(()));
        StartOpenAuctionFixture::default().call_and_assert(Ok(()));
        MakeOpenAuctionBidFixture::default()
            .with_bid(DEFAULT_NFT_PRICE)
            .call_and_assert(Ok(()));

        assert_ok!(Content::pick_open_auction_winner(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            VideoId::one(),
            SECOND_MEMBER_ID,
            DEFAULT_NFT_PRICE
        ));

        // net revenue for creator owner : NFT PRICE - FEE
        assert_eq!(
            channel_reward_account_balance(ChannelId::one()),
            DEFAULT_NFT_PRICE - platform_fee
        );
    })
}

#[test]
fn pick_open_auction_fails_during_channel_transfer() {
    with_default_mock_builder(|| {
        ContentTest::default().with_nft_open_auction_bid().setup();
        UpdateChannelTransferStatusFixture::default()
            .with_new_member_channel_owner(THIRD_MEMBER_ID)
            .call_and_assert(Ok(()));

        assert_noop!(
            Content::pick_open_auction_winner(
                Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
                ContentActor::Member(DEFAULT_MEMBER_ID),
                1u64,
                SECOND_MEMBER_ID,
                Content::min_starting_price(),
            ),
            Error::<Test>::InvalidChannelTransferStatus,
        );
    })
}
