#![cfg(test)]

use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

#[test]
fn issue_nft() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_simple_channel_and_video(FIRST_MEMBER_ORIGIN, FIRST_MEMBER_ID);

        // Video does not have an nft
        assert_eq!(None, Content::video_by_id(video_id).nft_status);

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            None,
            b"metablob".to_vec(),
            None
        ));

        // Runtime tested state after call

        // Ensure nft created succesfully
        let nft_status = Some(OwnedNFT::new(NFTOwner::ChannelOwner, None));
        assert_eq!(nft_status, Content::video_by_id(video_id).nft_status);

        let nft_issued_event = get_test_event(RawEvent::NftIssued(
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            None,
            b"metablob".to_vec(),
            None,
        ));

        // Last event checked
        assert_event(nft_issued_event, number_of_events_before_call + 1);
    })
}

#[test]
fn issue_nft_video_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        // Make an attempt to issue nft for non existent video
        let issue_nft_result = Content::issue_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            None,
            b"metablob".to_vec(),
            None,
        );

        // Failure checked
        assert_err!(issue_nft_result, Error::<Test>::VideoDoesNotExist);
    })
}

#[test]
fn issue_nft_already_issued() {
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

        // Make an attempt to issue nft once again for the same video
        let issue_nft_result = Content::issue_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            None,
            b"metablob".to_vec(),
            None,
        );

        // Failure checked
        assert_err!(issue_nft_result, Error::<Test>::NFTAlreadyExists);
    })
}

#[test]
fn issue_nft_auth_failed() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_simple_channel_and_video(FIRST_MEMBER_ORIGIN, FIRST_MEMBER_ID);

        // Make an attempt to issue nft with wrong credentials
        let issue_nft_result = Content::issue_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(UNKNOWN_ID),
            video_id,
            None,
            b"metablob".to_vec(),
            None,
        );

        // Failure checked
        assert_err!(issue_nft_result, Error::<Test>::MemberAuthFailed);
    })
}

#[test]
fn issue_nft_actor_not_authorized() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_simple_channel_and_video(FIRST_MEMBER_ORIGIN, FIRST_MEMBER_ID);

        // Make an attempt to issue nft if actor is not authorized
        let issue_nft_result = Content::issue_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(SECOND_MEMBER_ID),
            video_id,
            None,
            b"metablob".to_vec(),
            None,
        );

        // Failure checked
        assert_err!(issue_nft_result, Error::<Test>::ActorNotAuthorized);
    })
}

#[test]
fn issue_nft_royalty_bounds_violated() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_simple_channel_and_video(FIRST_MEMBER_ORIGIN, FIRST_MEMBER_ID);

        // Make an attempt to issue nft with wrong credentials
        let issue_nft_result = Content::issue_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            Some(Perbill::one()),
            b"metablob".to_vec(),
            None,
        );

        // Failure checked
        assert_err!(issue_nft_result, Error::<Test>::RoyaltyUpperBoundExceeded);

        // Make an attempt to issue nft with wrong credentials
        let issue_nft_result = Content::issue_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            Some(Perbill::from_perthousand(1)),
            b"metablob".to_vec(),
            None,
        );

        // Failure checked
        assert_err!(issue_nft_result, Error::<Test>::RoyaltyLowerBoundExceeded);
    })
}
