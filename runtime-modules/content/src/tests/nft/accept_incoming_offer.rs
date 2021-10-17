#![cfg(test)]

use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

#[test]
fn accept_incoming_offer() {
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

        // Accept nft offer
        assert_ok!(Content::accept_incoming_offer(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            video_id,
        ));

        // Runtime tested state after call

        // Ensure nft offer accepted succesfully
        assert!(matches!(
            Content::video_by_id(video_id).nft_status,
            Some(OwnedNFT {
                owner: NFTOwner::Member(member_id),
                transactional_status: TransactionalStatus::Idle,
                ..
            }) if member_id == SECOND_MEMBER_ID
        ));

        let offer_accepted_event = get_test_event(RawEvent::OfferAccepted(video_id));

        // Last event checked
        assert_event(offer_accepted_event, number_of_events_before_call + 1);
    })
}

#[test]
fn accept_incoming_offer_video_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        // Make an attempt to accept incoming nft offer if corresponding video does not exist
        let accept_incoming_offer_result =
            Content::accept_incoming_offer(Origin::signed(SECOND_MEMBER_ORIGIN), video_id);

        // Failure checked
        assert_err!(
            accept_incoming_offer_result,
            Error::<Test>::VideoDoesNotExist
        );
    })
}

#[test]
fn accept_incoming_offer_nft_not_issued() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_simple_channel_and_video(FIRST_MEMBER_ORIGIN, FIRST_MEMBER_ID);

        // Make an attempt to accept incoming nft offer if corresponding nft is not issued yet
        let accept_incoming_offer_result =
            Content::accept_incoming_offer(Origin::signed(SECOND_MEMBER_ORIGIN), video_id);

        // Failure checked
        assert_err!(accept_incoming_offer_result, Error::<Test>::NFTDoesNotExist);
    })
}

#[test]
fn accept_incoming_offer_auth_failed() {
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

        // Make an attempt to accept incoming nft offer providing wrong credentials
        let accept_incoming_offer_result =
            Content::accept_incoming_offer(Origin::signed(UNKNOWN_ORIGIN), video_id);

        // Failure checked
        assert_err!(
            accept_incoming_offer_result,
            Error::<Test>::MemberAuthFailed
        );
    })
}

#[test]
fn accept_incoming_offer_no_incoming_offers() {
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

        // Make an attempt to accept incoming nft offer if there is no incoming transfers
        let accept_incoming_offer_result =
            Content::accept_incoming_offer(Origin::signed(SECOND_MEMBER_ORIGIN), video_id);

        // Failure checked
        assert_err!(
            accept_incoming_offer_result,
            Error::<Test>::NoIncomingOffers
        );
    })
}

#[test]
fn accept_incoming_offer_reward_account_is_not_set() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        let _ = balances::Module::<Test>::deposit_creating(
            &FIRST_MEMBER_ORIGIN,
            <Test as balances::Trait>::Balance::from(100u32),
        );

        let channel_id = NextChannelId::<Test>::get();

        create_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            ChannelCreationParametersRecord {
                assets: NewAssets::<Test>::Urls(vec![]),
                meta: vec![],
                reward_account: None,
            },
            Ok(()),
        );

        let params = get_video_creation_parameters();

        // Create simple video using member actor
        create_video_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            channel_id,
            params,
            Ok(()),
        );

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

        // Make an attempt to accept incoming nft offer if sender is owner and reward account is not set
        let accept_incoming_offer_result =
            Content::accept_incoming_offer(Origin::signed(SECOND_MEMBER_ORIGIN), video_id);

        // Failure checked
        assert_err!(
            accept_incoming_offer_result,
            Error::<Test>::RewardAccountIsNotSet
        );
    })
}

#[test]
fn accept_incoming_offer_insufficient_balance() {
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

        let price = 10000;

        // Offer nft
        assert_ok!(Content::offer_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
            SECOND_MEMBER_ID,
            Some(price),
        ));

        // Make an attempt to accept incoming nft offer if there is no incoming transfers
        let accept_incoming_offer_result =
            Content::accept_incoming_offer(Origin::signed(SECOND_MEMBER_ORIGIN), video_id);

        // Failure checked
        assert_err!(
            accept_incoming_offer_result,
            Error::<Test>::InsufficientBalance
        );
    })
}
