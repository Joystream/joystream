#![cfg(test)]

use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

#[test]
fn buy_nft() {
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

        let price = 1000u64;

        // deposit balance to second member
        let _ = balances::Module::<Test>::deposit_creating(
            &SECOND_MEMBER_ORIGIN,
            <Test as balances::Trait>::Balance::from(price),
        );

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

        // Buy nft
        assert_ok!(Content::buy_nft(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            video_id,
            SECOND_MEMBER_ID,
            vec![],
        ));

        // Runtime tested state after call

        // Ensure nft succesfully bought
        assert!(matches!(
            Content::video_by_id(video_id).nft_status,
            Some(OwnedNFT {
                owner: NFTOwner::Member(SECOND_MEMBER_ID),
                transactional_status: TransactionalStatus::Idle,
                ..
            })
        ));

        let nft_bought_event =
            get_test_event(RawEvent::NFTBought(video_id, SECOND_MEMBER_ID, vec![]));

        // Last event checked
        assert_event(nft_bought_event, number_of_events_before_call + 3);
    })
}

#[test]
fn buy_nft_video_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        let price = 1000u64;

        // deposit balance to second member
        let _ = balances::Module::<Test>::deposit_creating(
            &SECOND_MEMBER_ORIGIN,
            <Test as balances::Trait>::Balance::from(price),
        );

        // Make an attempt to buy nft which corresponding video does not exist yet
        let buy_nft_result = Content::buy_nft(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            video_id,
            SECOND_MEMBER_ID,
            vec![],
        );

        // Failure checked
        assert_err!(buy_nft_result, Error::<Test>::VideoDoesNotExist);
    })
}

#[test]
fn buy_nft_not_issued() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_simple_channel_and_video(FIRST_MEMBER_ORIGIN, FIRST_MEMBER_ID);

        let price = 1000u64;

        // deposit balance to second member
        let _ = balances::Module::<Test>::deposit_creating(
            &SECOND_MEMBER_ORIGIN,
            <Test as balances::Trait>::Balance::from(price),
        );

        // Make an attempt to buy nft which is not issued yet
        let buy_nft_result = Content::buy_nft(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            video_id,
            SECOND_MEMBER_ID,
            vec![],
        );

        // Failure checked
        assert_err!(buy_nft_result, Error::<Test>::NFTDoesNotExist);
    })
}

#[test]
fn buy_nft_auth_failed() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_simple_channel_and_video(FIRST_MEMBER_ORIGIN, FIRST_MEMBER_ID);

        let price = 1000u64;

        // deposit balance to second member
        let _ = balances::Module::<Test>::deposit_creating(
            &SECOND_MEMBER_ORIGIN,
            <Test as balances::Trait>::Balance::from(price),
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

        // Sell nft
        assert_ok!(Content::sell_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
            price,
        ));

        // Make an attempt to buy nft with wrong credentials
        let buy_nft_result = Content::buy_nft(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            video_id,
            UNKNOWN_ID,
            vec![],
        );

        // Failure checked
        assert_err!(buy_nft_result, Error::<Test>::MemberAuthFailed);
    })
}

#[test]
fn buy_nft_not_in_buy_now_state() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_simple_channel_and_video(FIRST_MEMBER_ORIGIN, FIRST_MEMBER_ID);

        let price = 1000u64;

        // deposit balance to second member
        let _ = balances::Module::<Test>::deposit_creating(
            &SECOND_MEMBER_ORIGIN,
            <Test as balances::Trait>::Balance::from(price),
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

        // Make an attempt to buy nft which is not in BuyNow state
        let buy_nft_result = Content::buy_nft(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            video_id,
            SECOND_MEMBER_ID,
            vec![],
        );

        // Failure checked
        assert_err!(buy_nft_result, Error::<Test>::NFTNotInBuyNowState);
    })
}

#[test]
fn buy_nft_insufficient_balance() {
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

        let price = 1000u64;

        // Sell nft
        assert_ok!(Content::sell_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
            price,
        ));

        // Make an attempt to buy nft with wrong credentials
        let buy_nft_result = Content::buy_nft(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            video_id,
            SECOND_MEMBER_ID,
            vec![],
        );

        // Failure checked
        assert_err!(buy_nft_result, Error::<Test>::InsufficientBalance);
    })
}

#[test]
fn buy_nft_reward_account_is_not_set() {
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

        let price = 1000u64;

        // deposit balance to second member
        let _ = balances::Module::<Test>::deposit_creating(
            &SECOND_MEMBER_ORIGIN,
            <Test as balances::Trait>::Balance::from(price),
        );

        // Sell nft
        assert_ok!(Content::sell_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            video_id,
            ContentActor::Member(FIRST_MEMBER_ID),
            price,
        ));

        // Make an attempt to buy nft when reward account is not set
        let buy_nft_result = Content::buy_nft(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            video_id,
            SECOND_MEMBER_ID,
            vec![],
        );

        // Failure checked
        assert_err!(buy_nft_result, Error::<Test>::RewardAccountIsNotSet);
    })
}
