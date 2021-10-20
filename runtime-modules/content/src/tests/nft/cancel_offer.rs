#![cfg(test)]

use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

#[test]
fn cancel_offer() {
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

        // Offer nft
        assert_ok!(Content::offer_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
            SECOND_MEMBER_ID,
            None,
        ));

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        // Cancel offer
        assert_ok!(Content::cancel_offer(
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

        let buy_now_canceled_event = get_test_event(RawEvent::OfferCanceled(
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
        ));

        // Last event checked
        assert_event(buy_now_canceled_event, number_of_events_before_call + 1);
    })
}

#[test]
fn cancel_offer_video_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        // Make an attempt to cancel offer which corresponding video does not exist yet
        let cancel_offer_result = Content::cancel_offer(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(cancel_offer_result, Error::<Test>::VideoDoesNotExist);
    })
}

#[test]
fn cancel_offer_not_issued() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_simple_channel_and_video(FIRST_MEMBER_ORIGIN, FIRST_MEMBER_ID);

        // Make an attempt to cancel offer for nft which is not issued yet
        let cancel_offer_result = Content::cancel_offer(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(cancel_offer_result, Error::<Test>::NFTDoesNotExist);
    })
}

#[test]
fn cancel_offer_auth_failed() {
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

        // Offer nft
        assert_ok!(Content::offer_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
            SECOND_MEMBER_ID,
            None,
        ));

        // Make an attempt to cancel offer with wrong credentials
        let cancel_offer_result = Content::cancel_offer(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(UNKNOWN_ID),
            video_id,
        );

        // Failure checked
        assert_err!(cancel_offer_result, Error::<Test>::MemberAuthFailed);
    })
}

#[test]
fn cancel_offer_not_authorized() {
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

        // Offer nft
        assert_ok!(Content::offer_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
            SECOND_MEMBER_ID,
            None,
        ));

        // Make an attempt to cancel offer if actor is not authorized
        let cancel_offer_result = Content::cancel_offer(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            ContentActor::Member(SECOND_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(cancel_offer_result, Error::<Test>::ActorNotAuthorized);
    })
}

#[test]
fn cancel_offer_not_in_auction_state() {
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

        // Make an attempt to cancel offer if there is no pending one
        let cancel_offer_result = Content::cancel_offer(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(cancel_offer_result, Error::<Test>::PendingOfferDoesNotExist);
    })
}
