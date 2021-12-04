#![cfg(test)]

use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

#[test]
fn sling_nft_back() {
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
            Some(SECOND_MEMBER_ID),
        ));

        // Runtime tested state before call
        assert!(matches!(
            Content::video_by_id(video_id).nft_status,
            Some(OwnedNFT {
                owner: NFTOwner::Member(SECOND_MEMBER_ID),
                ..
            })
        ));

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        // Sling nft back to the original artist
        assert_ok!(Content::sling_nft_back(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(SECOND_MEMBER_ID),
        ));

        // Runtime tested state after call

        // Ensure nft slinged back successfully
        assert!(matches!(
            Content::video_by_id(video_id).nft_status,
            Some(OwnedNFT {
                owner: NFTOwner::ChannelOwner,
                ..
            })
        ));

        let offer_started_event = get_test_event(RawEvent::NftSlingedBackToTheOriginalArtist(
            video_id,
            ContentActor::Member(SECOND_MEMBER_ID),
        ));

        // Last event checked
        assert_event(offer_started_event, number_of_events_before_call + 1);
    })
}

#[test]
fn sling_nft_back_video_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        // Make an attempt to sling nft back which corresponding video does not exist
        let sling_nft_back_result = Content::sling_nft_back(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
        );

        // Failure checked
        assert_err!(sling_nft_back_result, Error::<Test>::VideoDoesNotExist);
    })
}

#[test]
fn sling_nft_back_not_issued() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_simple_channel_and_video(FIRST_MEMBER_ORIGIN, FIRST_MEMBER_ID);

        // Make an attempt to sling nft back which is not issued yet
        let sling_nft_back_result = Content::sling_nft_back(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
        );

        // Failure checked
        assert_err!(sling_nft_back_result, Error::<Test>::NFTDoesNotExist);
    })
}

#[test]
fn sling_nft_back_auth_failed() {
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

        // Make an attempt to sling nft back with wrong credentials
        let sling_nft_back_result = Content::sling_nft_back(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(UNKNOWN_ID),
        );

        // Failure checked
        assert_err!(sling_nft_back_result, Error::<Test>::MemberAuthFailed);
    })
}

#[test]
fn sling_nft_back_not_authorized() {
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

        // Make an attempt to sling nft back if actor is not authorized
        let sling_nft_back_result = Content::sling_nft_back(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(SECOND_MEMBER_ID),
        );

        // Failure checked
        assert_err!(sling_nft_back_result, Error::<Test>::ActorNotAuthorized);
    })
}

#[test]
fn sling_nft_back_transactional_status_is_not_idle() {
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

        // Make an attempt to sling nft back when it is already offered
        let sling_nft_back_result = Content::sling_nft_back(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
        );

        // Failure checked
        assert_err!(sling_nft_back_result, Error::<Test>::NftIsNotIdle);
    })
}
