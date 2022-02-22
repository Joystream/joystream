#![cfg(test)]

use crate::tests::fixtures::{
    create_default_member_owned_channel_with_video, create_initial_storage_buckets_helper,
    increase_account_balance_helper, UpdateChannelFixture,
};
use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

#[test]
fn buy_nft() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();
        let channel_id = NextChannelId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        // deposit balance to second member
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, DEFAULT_NFT_PRICE);

        let reward_account = ChannelById::<Test>::get(channel_id).reward_account.unwrap();
        let balance_pre = balances::Module::<Test>::free_balance(reward_account);

        // Sell nft
        assert_ok!(Content::sell_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(DEFAULT_MEMBER_ID),
            DEFAULT_NFT_PRICE,
        ));

        // Runtime tested state before call
        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        // Buy nft
        assert_ok!(Content::buy_nft(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
            SECOND_MEMBER_ID,
        ));

        // Runtime tested state after call
        let balance_post = balances::Module::<Test>::free_balance(reward_account);

        // Ensure buyer balance was succesfully slashed after nft had been bought
        assert_eq!(
            balances::Module::<Test>::free_balance(SECOND_MEMBER_ACCOUNT_ID),
            0
        );

        // Ensure the price of nft - platform fee was succesfully deposited into seller account (channel reward account id in this case)
        assert_eq!(
            balance_post.saturating_sub(balance_pre),
            DEFAULT_NFT_PRICE - Content::platform_fee_percentage() * DEFAULT_NFT_PRICE
        );

        // Ensure nft succesfully bought
        assert!(matches!(
            Content::video_by_id(video_id).nft_status,
            Some(OwnedNft {
                owner: NftOwner::Member(SECOND_MEMBER_ID),
                transactional_status: TransactionalStatus::<Test>::Idle,
                ..
            })
        ));

        // Last event checked
        assert_event(
            MetaEvent::content(RawEvent::NftBought(video_id, SECOND_MEMBER_ID)),
            number_of_events_before_call + 1,
        );
    })
}

#[test]
fn buy_nft_video_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        // deposit balance to second member
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, DEFAULT_NFT_PRICE);

        // Make an attempt to buy nft which corresponding video does not exist yet
        let buy_nft_result = Content::buy_nft(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
            SECOND_MEMBER_ID,
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

        //        create_simple_channel_and_video(DEFAULT_MEMBER_ACCOUNT_ID, DEFAULT_MEMBER_ID);
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // deposit balance to second member
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, DEFAULT_NFT_PRICE);

        // Make an attempt to buy nft which is not issued yet
        let buy_nft_result = Content::buy_nft(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
            SECOND_MEMBER_ID,
        );

        // Failure checked
        assert_err!(buy_nft_result, Error::<Test>::NftDoesNotExist);
    })
}

#[test]
fn buy_nft_auth_failed() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, DEFAULT_NFT_PRICE);

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        // Sell nft
        assert_ok!(Content::sell_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(DEFAULT_MEMBER_ID),
            DEFAULT_NFT_PRICE,
        ));

        // Make an attempt to buy nft with wrong credentials
        let buy_nft_result = Content::buy_nft(
            Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            video_id,
            SECOND_MEMBER_ID,
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
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, DEFAULT_NFT_PRICE);

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        // Make an attempt to buy nft which is not in BuyNow state
        let buy_nft_result = Content::buy_nft(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
            SECOND_MEMBER_ID,
        );

        // Failure checked
        assert_err!(buy_nft_result, Error::<Test>::NftNotInBuyNowState);
    })
}

#[test]
fn buy_nft_insufficient_balance() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        // Sell nft
        assert_ok!(Content::sell_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(DEFAULT_MEMBER_ID),
            DEFAULT_NFT_PRICE,
        ));

        // Make an attempt to buy nft with wrong credentials
        let buy_nft_result = Content::buy_nft(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
            SECOND_MEMBER_ID,
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

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        UpdateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_reward_account(Some(None))
            .call_and_assert(Ok(()));

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        // deposit balance to second member
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, DEFAULT_NFT_PRICE);

        // Sell nft
        assert_ok!(Content::sell_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(DEFAULT_MEMBER_ID),
            DEFAULT_NFT_PRICE,
        ));

        // Make an attempt to buy nft when reward account is not set
        let buy_nft_result = Content::buy_nft(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
            SECOND_MEMBER_ID,
        );

        // Failure checked
        assert_ok!(buy_nft_result);
    })
}
