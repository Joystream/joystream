#![cfg(test)]

use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

#[test]
fn sell_nft() {
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

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        let price = 100;

        // Sell nft
        assert_ok!(Content::sell_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
            price,
        ));

        // Runtime tested state after call

        // Ensure nft offer made succesfully
        assert!(matches!(
            Content::video_by_id(video_id).nft_status,
            Some(OwnedNFT {
                transactional_status: TransactionalStatus::BuyNow(
                    cost,
                ),
                ..
            }) if price == cost
        ));

        let sell_order_made_event = get_test_event(RawEvent::NFTSellOrderMade(
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
            price,
        ));

        // Last event checked
        assert_event(sell_order_made_event, number_of_events_before_call + 1);
    })
}

#[test]
fn sell_nft_video_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        let price = 100;

        // Make an attempt to sell nft which corresponding video does not exist yet
        let sell_nft_result = Content::sell_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
            price,
        );

        // Failure checked
        assert_err!(sell_nft_result, Error::<Test>::VideoDoesNotExist);
    })
}

#[test]
fn sell_nft_not_issued() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_simple_channel_and_video(FIRST_MEMBER_ORIGIN, FIRST_MEMBER_ID);

        let price = 100;

        // Make an attempt to sell nft which is not issued yet
        let sell_nft_result = Content::sell_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
            price,
        );

        // Failure checked
        assert_err!(sell_nft_result, Error::<Test>::NFTDoesNotExist);
    })
}

#[test]
fn sell_nft_auth_failed() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_simple_channel_and_video(FIRST_MEMBER_ORIGIN, FIRST_MEMBER_ID);

        let price = 100;

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            None,
            b"metablob".to_vec(),
            None
        ));

        // Make an attempt to sell nft with wrong credentials
        let sell_nft_result = Content::sell_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(UNKNOWN_ID),
            price,
        );

        // Failure checked
        assert_err!(sell_nft_result, Error::<Test>::MemberAuthFailed);
    })
}

#[test]
fn sell_nft_not_authorized() {
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

        // Make an attempt to sell nft if actor is not authorized
        let sell_nft_result = Content::sell_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(SECOND_MEMBER_ID),
            price,
        );

        // Failure checked
        assert_err!(sell_nft_result, Error::<Test>::ActorNotAuthorized);
    })
}

#[test]
fn sell_nft_transactional_status_is_not_idle() {
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

        let price = 100;

        // Make an attempt to sell nft when it is already offered
        let sell_nft_result = Content::sell_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
            price,
        );

        // Failure checked
        assert_err!(sell_nft_result, Error::<Test>::NftIsNotIdle);
    })
}
