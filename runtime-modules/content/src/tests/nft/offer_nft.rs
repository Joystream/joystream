#![cfg(test)]

use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

#[test]
fn offer_nft() {
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

        // Offer nft
        assert_ok!(Content::offer_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
            SECOND_MEMBER_ID,
            None,
        ));

        // Runtime tested state after call

        // Ensure nft offered succesfully
        assert!(matches!(
            Content::video_by_id(video_id).nft_status,
            Some(OwnedNFT {
                transactional_status: TransactionalStatus::InitiatedOfferToMember(
                    SECOND_MEMBER_ID,
                    None
                ),
                ..
            })
        ));

        let offer_started_event = get_test_event(RawEvent::OfferStarted(
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
            SECOND_MEMBER_ID,
            None,
        ));

        // Last event checked
        assert_event(offer_started_event, number_of_events_before_call + 1);
    })
}

#[test]
fn offer_nft_video_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        // Make an attempt to offer nft which corresponding video does not exist
        let offer_nft_result = Content::offer_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
            SECOND_MEMBER_ID,
            None,
        );

        // Failure checked
        assert_err!(offer_nft_result, Error::<Test>::VideoDoesNotExist);
    })
}

#[test]
fn offer_nft_not_issued() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_simple_channel_and_video(FIRST_MEMBER_ORIGIN, FIRST_MEMBER_ID);

        // Make an attempt to offer nft which is not issued yet
        let offer_nft_result = Content::offer_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
            SECOND_MEMBER_ID,
            None,
        );

        // Failure checked
        assert_err!(offer_nft_result, Error::<Test>::NFTDoesNotExist);
    })
}

#[test]
fn offer_nft_auth_failed() {
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

        // Make an attempt to offer nft with wrong credentials
        let offer_nft_result = Content::offer_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(UNKNOWN_ID),
            SECOND_MEMBER_ID,
            None,
        );

        // Failure checked
        assert_err!(offer_nft_result, Error::<Test>::MemberAuthFailed);
    })
}

#[test]
fn offer_nft_not_authorized() {
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

        // Make an attempt to offer nft if actor is not authorized
        let offer_nft_result = Content::offer_nft(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(SECOND_MEMBER_ID),
            SECOND_MEMBER_ID,
            None,
        );

        // Failure checked
        assert_err!(offer_nft_result, Error::<Test>::ActorNotAuthorized);
    })
}

#[test]
fn offer_nft_transactional_status_is_not_idle() {
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

        // Make an attempt to offer nft when it is already offered
        let offer_nft_result = Content::offer_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
            SECOND_MEMBER_ID,
            None,
        );

        // Failure checked
        assert_err!(offer_nft_result, Error::<Test>::NftIsNotIdle);
    })
}
