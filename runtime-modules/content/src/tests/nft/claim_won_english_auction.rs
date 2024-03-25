#![cfg(test)]
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_noop, assert_ok};

const AUCTION_DURATION: u64 = 10;
const AUCTION_START_BLOCK: u64 = 1;
#[test]
fn settle_english_auction() {
    with_default_mock_builder(|| {
        let video_id = Pallet::<Test>::next_video_id();
        ContentTest::with_member_channel().with_video().setup();

        // Issue nft
        assert_ok!(Content::issue_nft(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        let auction_params = EnglishAuctionParams::<Test> {
            starting_price: Content::min_starting_price(),
            buy_now_price: None,
            extension_period: Content::min_auction_extension_period(),
            min_bid_step: Content::min_bid_step(),
            starts_at: None,
            duration: AUCTION_DURATION,
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_english_auction(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        ));

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Pallet::<Test>::deposit_creating(&SECOND_MEMBER_ACCOUNT_ID, ed() + bid);

        let module_account_id = ContentTreasury::<Test>::module_account_id();
        assert_eq!(Balances::<Test>::usable_balance(&module_account_id), ed());

        // Make nft auction bid
        assert_ok!(Content::make_english_auction_bid(
            RuntimeOrigin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            bid,
        ));

        // Module account contains a bid.
        assert_eq!(ContentTreasury::<Test>::usable_balance(), ed() + bid);

        // Run to the block where auction expires
        run_to_block(Content::max_auction_duration() + 1);

        // Claim won english auction
        assert_ok!(Content::settle_english_auction(
            RuntimeOrigin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
        ));

        // Runtime tested state after call

        assert_eq!(ContentTreasury::<Test>::usable_balance(), ed());
        assert_eq!(
            channel_reward_account_balance(ChannelId::one()),
            DEFAULT_CHANNEL_STATE_BLOAT_BOND + bid
        );

        // Ensure english auction successfully completed
        assert!(matches!(
            Content::video_by_id(video_id).nft_status,
            Some(OwnedNft {
                transactional_status: TransactionalStatus::<Test>::Idle,
                ..
            })
        ));

        // Last event checked
        last_event_eq!(RawEvent::EnglishAuctionSettled(
            SECOND_MEMBER_ID,
            SECOND_MEMBER_ACCOUNT_ID,
            video_id,
        ));
    })
}

#[test]
fn settle_english_auction_cannot_be_completed() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(AUCTION_START_BLOCK);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Issue nft
        assert_ok!(Content::issue_nft(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        let auction_params = EnglishAuctionParams::<Test> {
            starting_price: Content::min_starting_price(),
            buy_now_price: None,
            extension_period: Content::min_auction_extension_period(),
            min_bid_step: Content::min_bid_step(),
            starts_at: None,
            duration: AUCTION_DURATION,
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_english_auction(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        ));

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Pallet::<Test>::deposit_creating(&SECOND_MEMBER_ACCOUNT_ID, ed() + bid);

        // Make nft auction bid
        assert_ok!(Content::make_english_auction_bid(
            RuntimeOrigin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            bid,
        ));

        // Make an attempt to claim won english auction if it did not expire yet
        let settle_english_auction_result = Content::settle_english_auction(
            RuntimeOrigin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
        );

        // Failure checked
        assert_err!(
            settle_english_auction_result,
            Error::<Test>::AuctionCannotBeCompleted
        );
    })
}

#[test]
fn settle_english_auction_video_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(AUCTION_START_BLOCK);

        let video_id = NextVideoId::<Test>::get();

        // Make an attempt to claim won english auction which corresponding video does not exist
        let settle_english_auction_result = Content::settle_english_auction(
            RuntimeOrigin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
        );

        // Failure checked
        assert_err!(
            settle_english_auction_result,
            Error::<Test>::VideoDoesNotExist
        );
    })
}

#[test]
fn settle_english_auction_nft_is_not_issued() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(AUCTION_START_BLOCK);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Make an attempt to claim won english auction for nft which is not issued yet
        let settle_english_auction_result = Content::settle_english_auction(
            RuntimeOrigin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
        );

        // Failure checked
        assert_err!(
            settle_english_auction_result,
            Error::<Test>::NftDoesNotExist
        );
    })
}

#[test]
fn settle_english_auction_not_in_auction_state() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(AUCTION_START_BLOCK);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Issue nft
        assert_ok!(Content::issue_nft(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        // Make an attempt to claim won english auction for nft which is not in auction state
        let settle_english_auction_result = Content::settle_english_auction(
            RuntimeOrigin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
        );

        // Failure checked
        assert_err!(
            settle_english_auction_result,
            Error::<Test>::IsNotEnglishAuctionType,
        );
    })
}

#[test]
fn settle_english_auction_is_not_english_auction_type() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(AUCTION_START_BLOCK);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Issue nft
        assert_ok!(Content::issue_nft(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
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
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        ));

        // deposit initial balance
        let bid = Content::min_starting_price();

        let _ = balances::Pallet::<Test>::deposit_creating(&SECOND_MEMBER_ACCOUNT_ID, ed() + bid);

        // Make nft auction bid
        assert_ok!(Content::make_open_auction_bid(
            RuntimeOrigin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            bid,
        ));

        // Make an attempt to claim won english auction for nft which is not in english auction state
        let settle_english_auction_result = Content::settle_english_auction(
            RuntimeOrigin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
        );

        // Failure checked
        assert_err!(
            settle_english_auction_result,
            Error::<Test>::IsNotEnglishAuctionType
        );
    })
}

#[test]
fn settle_english_auction_last_bid_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(AUCTION_START_BLOCK);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Issue nft
        assert_ok!(Content::issue_nft(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        let auction_params = EnglishAuctionParams::<Test> {
            starting_price: Content::min_starting_price(),
            buy_now_price: None,
            extension_period: Content::min_auction_extension_period(),
            min_bid_step: Content::min_bid_step(),
            starts_at: None,
            duration: AUCTION_DURATION,
            whitelist: BTreeSet::new(),
        };

        // Start nft auction
        assert_ok!(Content::start_english_auction(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            auction_params,
        ));

        // Run to the block where auction expires
        run_to_block(Content::max_auction_duration() + 1);

        // Make an attempt to claim won english auction if last bid does not exist
        let settle_english_auction_result = Content::settle_english_auction(
            RuntimeOrigin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
        );

        // Failure checked
        assert_err!(
            settle_english_auction_result,
            Error::<Test>::BidDoesNotExist
        );
    })
}

fn setup_english_auction_scenario() {
    let video_id = NextVideoId::<Test>::get();

    create_initial_storage_buckets_helper();
    increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
    create_default_member_owned_channel_with_video();

    // Issue nft
    assert_ok!(Content::issue_nft(
        RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
        ContentActor::Member(DEFAULT_MEMBER_ID),
        video_id,
        NftIssuanceParameters::<Test>::default(),
    ));

    let auction_params = EnglishAuctionParams::<Test> {
        starting_price: Content::min_starting_price(),
        buy_now_price: None,
        extension_period: Content::min_auction_extension_period(),
        min_bid_step: Content::min_bid_step(),
        starts_at: None,
        duration: AUCTION_DURATION,
        whitelist: BTreeSet::new(),
    };

    // Start nft auction
    assert_ok!(Content::start_english_auction(
        RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
        ContentActor::Member(DEFAULT_MEMBER_ID),
        video_id,
        auction_params,
    ));
}

#[test]
fn settle_english_auction_ok_with_nft_claimed_by_non_winner() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(AUCTION_START_BLOCK);

        let video_id = NextVideoId::<Test>::get();
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(COLLABORATOR_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        setup_english_auction_scenario();

        let bid = Content::min_starting_price();

        // Make nft auction bid
        assert_ok!(Content::make_english_auction_bid(
            RuntimeOrigin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            bid,
        ));

        // Make nft auction bid
        assert_ok!(Content::make_english_auction_bid(
            RuntimeOrigin::signed(COLLABORATOR_MEMBER_ACCOUNT_ID),
            COLLABORATOR_MEMBER_ID,
            video_id,
            bid + Content::min_bid_step(),
        ));

        // Run to the block where auction expires
        run_to_block(Content::max_auction_duration() + 1);

        // Make an attempt to claim won english auction if last bid does not exist
        let settle_english_auction_result = Content::settle_english_auction(
            RuntimeOrigin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
        );

        // Failure checked
        assert_ok!(settle_english_auction_result);
    })
}

#[test]
fn settle_english_auction_ok_with_balances_check() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(AUCTION_START_BLOCK);

        let video_id = NextVideoId::<Test>::get();
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(COLLABORATOR_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        setup_english_auction_scenario();
        let module_account_id = ContentTreasury::<Test>::module_account_id();

        // Balances check
        assert_eq!(Balances::<Test>::usable_balance(&module_account_id), ed());
        assert_eq!(
            Balances::<Test>::usable_balance(&SECOND_MEMBER_ACCOUNT_ID),
            INITIAL_BALANCE
        );
        assert_eq!(
            Balances::<Test>::usable_balance(&COLLABORATOR_MEMBER_ACCOUNT_ID),
            INITIAL_BALANCE
        );

        let bid = Content::min_starting_price();

        // Make nft auction bid
        assert_ok!(Content::make_english_auction_bid(
            RuntimeOrigin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            bid,
        ));

        // Balances check
        assert_eq!(
            Balances::<Test>::usable_balance(&module_account_id),
            ed() + bid
        );
        assert_eq!(
            Balances::<Test>::usable_balance(&SECOND_MEMBER_ACCOUNT_ID),
            INITIAL_BALANCE - bid
        );
        assert_eq!(
            Balances::<Test>::usable_balance(&COLLABORATOR_MEMBER_ACCOUNT_ID),
            INITIAL_BALANCE
        );

        // Make nft auction bid
        let next_bid = bid + Content::min_bid_step();
        assert_ok!(Content::make_english_auction_bid(
            RuntimeOrigin::signed(COLLABORATOR_MEMBER_ACCOUNT_ID),
            COLLABORATOR_MEMBER_ID,
            video_id,
            next_bid,
        ));

        // Balances check
        assert_eq!(
            Balances::<Test>::usable_balance(&module_account_id),
            ed() + next_bid
        );
        assert_eq!(
            Balances::<Test>::usable_balance(&SECOND_MEMBER_ACCOUNT_ID),
            INITIAL_BALANCE
        );
        assert_eq!(
            Balances::<Test>::usable_balance(&COLLABORATOR_MEMBER_ACCOUNT_ID),
            INITIAL_BALANCE - next_bid
        );

        // Run to the block where auction expires
        run_to_block(Content::max_auction_duration() + 1);

        // Settle the auciton.
        let settle_english_auction_result = Content::settle_english_auction(
            RuntimeOrigin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
        );

        // Failure checked
        assert_ok!(settle_english_auction_result);

        // Balances check
        assert_eq!(Balances::<Test>::usable_balance(&module_account_id), ed());
        assert_eq!(
            channel_reward_account_balance(1u64),
            DEFAULT_CHANNEL_STATE_BLOAT_BOND + next_bid
        );
        assert_eq!(
            Balances::<Test>::usable_balance(&SECOND_MEMBER_ACCOUNT_ID),
            INITIAL_BALANCE
        );
        assert_eq!(
            Balances::<Test>::usable_balance(&COLLABORATOR_MEMBER_ACCOUNT_ID),
            INITIAL_BALANCE - next_bid
        );
    })
}

#[test]
fn settle_english_auction_ok_with_nft_claimed_by_non_winner_and_winner_free_balance_increased() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(AUCTION_START_BLOCK);

        let video_id = NextVideoId::<Test>::get();
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(COLLABORATOR_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        setup_english_auction_scenario();

        let bid = Content::min_starting_price();

        assert_eq!(
            Balances::<Test>::total_balance(&COLLABORATOR_MEMBER_ACCOUNT_ID),
            INITIAL_BALANCE,
        );

        // Make nft auction bid
        assert_ok!(Content::make_english_auction_bid(
            RuntimeOrigin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            video_id,
            bid,
        ));

        // Make nft auction bid
        let new_bid = bid + Content::min_bid_step();
        assert_ok!(Content::make_english_auction_bid(
            RuntimeOrigin::signed(COLLABORATOR_MEMBER_ACCOUNT_ID),
            COLLABORATOR_MEMBER_ID,
            video_id,
            new_bid,
        ));

        // Run to the block where auction expires
        run_to_block(Content::max_auction_duration() + 1);

        // Make an attempt to claim won english auction if last bid does not exist
        assert_ok!(Content::settle_english_auction(
            RuntimeOrigin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
        ));

        // Failure checked
        assert_eq!(
            Balances::<Test>::total_balance(&COLLABORATOR_MEMBER_ACCOUNT_ID),
            INITIAL_BALANCE - new_bid,
        );
    })
}

#[test]
fn settle_english_auction_fails_during_transfer() {
    with_default_mock_builder(|| {
        ContentTest::default()
            .with_video_nft_status(NftTransactionalStatusType::Auction(AuctionType::English))
            .setup();
        increase_account_balance_helper(
            SECOND_MEMBER_ACCOUNT_ID,
            ed() + Content::min_starting_price(),
        );
        assert_ok!(Content::make_english_auction_bid(
            RuntimeOrigin::signed(SECOND_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID,
            VideoId::one(),
            Content::min_starting_price(),
        ));
        // Run to the block where auction expires
        run_to_block(Content::max_auction_duration() + 1);
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(THIRD_MEMBER_ID)
            .call_and_assert(Ok(()));

        assert_noop!(
            Content::settle_english_auction(
                RuntimeOrigin::signed(SECOND_MEMBER_ACCOUNT_ID),
                VideoId::one()
            ),
            Error::<Test>::InvalidChannelTransferStatus,
        );
    })
}
