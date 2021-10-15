#![cfg(test)]

use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

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

        let (auction, _) =
            auction.make_bid(SECOND_MEMBER_ID, SECOND_MEMBER_ORIGIN, bid, current_block);

        // Ensure nft status changed to given Auction
        assert!(matches!(
            Content::video_by_id(video_id).nft_status,
            Some(OwnedNFT {
                transactional_status: TransactionalStatus::Auction(auction_with_bid,),
                ..
            }) if auction == auction_with_bid
        ));

        let nft_auction_started_event = get_test_event(RawEvent::AuctionBidMade(
            SECOND_MEMBER_ID,
            video_id,
            bid,
            vec![],
        ));

        // Last event checked
        assert_event(nft_auction_started_event, number_of_events_before_call + 4);
    })
}
