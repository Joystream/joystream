#![cfg(test)]

use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

#[test]
fn cancel_buy_now() {
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

        let price = 100;

        // Sell nft
        assert_ok!(Content::sell_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
            price,
        ));

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        // Cancel buy now
        assert_ok!(Content::cancel_buy_now(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
        ));

        // Runtime tested state after call

        // Ensure nft status changed to given Auction
        assert!(matches!(
            Content::video_by_id(video_id).nft_status,
            Some(OwnedNFT {
                transactional_status: TransactionalStatus::Idle,
                ..
            })
        ));

        let buy_now_canceled_event = get_test_event(RawEvent::BuyNowCanceled(
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
        ));

        // Last event checked
        assert_event(buy_now_canceled_event, number_of_events_before_call + 1);
    })
}

#[test]
fn cancel_buy_now_video_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        // Make an attempt to cancel buy now which corresponding video does not exist yet
        let cancel_buy_now_result = Content::cancel_buy_now(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(cancel_buy_now_result, Error::<Test>::VideoDoesNotExist);
    })
}

#[test]
fn cancel_buy_now_not_issued() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_simple_channel_and_video(FIRST_MEMBER_ORIGIN, FIRST_MEMBER_ID);

        // Make an attempt to cancel buy now for nft which is not issued yet
        let cancel_buy_now_result = Content::cancel_buy_now(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(cancel_buy_now_result, Error::<Test>::NFTDoesNotExist);
    })
}

#[test]
fn cancel_buy_now_auth_failed() {
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

        let price = 100;

        // Sell nft
        assert_ok!(Content::sell_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
            price,
        ));

        // Make an attempt to cancel buy now with wrong credentials
        let cancel_buy_now_result = Content::cancel_buy_now(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(UNKNOWN_ID),
            video_id,
        );

        // Failure checked
        assert_err!(cancel_buy_now_result, Error::<Test>::MemberAuthFailed);
    })
}

#[test]
fn cancel_buy_now_not_authorized() {
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

        let price = 100;

        // Sell nft
        assert_ok!(Content::sell_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
            price,
        ));

        // Make an attempt to cancel buy now if actor is not authorized
        let cancel_buy_now_result = Content::cancel_buy_now(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            ContentActor::Member(SECOND_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(cancel_buy_now_result, Error::<Test>::ActorNotAuthorized);
    })
}

#[test]
fn cancel_buy_now_not_in_auction_state() {
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

        // Make an attempt to cancel buy now if there is no pending one
        let cancel_buy_now_result = Content::cancel_buy_now(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(cancel_buy_now_result, Error::<Test>::NFTNotInBuyNowState);
    })
}
