#![cfg(test)]
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_noop, assert_ok};
const NEW_NFT_PRICE: u64 = DEFAULT_NFT_PRICE + 10;

#[test]
fn update_buy_now_price() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Issue nft
        assert_ok!(Content::issue_nft(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, DEFAULT_NFT_PRICE);

        // Sell nft
        assert_ok!(Content::sell_nft(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(DEFAULT_MEMBER_ID),
            DEFAULT_NFT_PRICE,
        ));

        // update buy now price
        assert_ok!(Content::update_buy_now_price(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NEW_NFT_PRICE,
        ));

        // Ensure nft status changed to given Auction
        assert!(matches!(
            Content::video_by_id(video_id).nft_status,
            Some(OwnedNft {
                transactional_status: TransactionalStatus::<Test>::BuyNow(NEW_NFT_PRICE),
                ..
            })
        ));

        // Last event checked
        last_event_eq!(RawEvent::BuyNowPriceUpdated(
            video_id,
            ContentActor::Member(DEFAULT_MEMBER_ID),
            NEW_NFT_PRICE,
        ));
    })
}

#[test]
fn update_buy_now_price_video_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        // Make an attempt to update buy now price which corresponding video does not exist yet
        let update_buy_now_price_result = Content::update_buy_now_price(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NEW_NFT_PRICE,
        );

        // Failure checked
        assert_err!(
            update_buy_now_price_result,
            Error::<Test>::VideoDoesNotExist
        );
    })
}

#[test]
fn update_buy_now_price_not_issued() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Make an attempt to update buy now price for nft which is not issued yet
        let update_buy_now_price_result = Content::update_buy_now_price(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NEW_NFT_PRICE,
        );

        // Failure checked
        assert_err!(update_buy_now_price_result, Error::<Test>::NftDoesNotExist);
    })
}

#[test]
fn update_buy_now_price_auth_failed() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Issue nft
        assert_ok!(Content::issue_nft(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        // Sell nft
        assert_ok!(Content::sell_nft(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(DEFAULT_MEMBER_ID),
            DEFAULT_NFT_PRICE,
        ));

        // Make an attempt to update buy now price with wrong credentials
        let update_buy_now_price_result = Content::update_buy_now_price(
            RuntimeOrigin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NEW_NFT_PRICE,
        );

        // Failure checked
        assert_err!(update_buy_now_price_result, Error::<Test>::MemberAuthFailed);
    })
}

#[test]
fn update_buy_now_price_not_authorized() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Issue nft
        assert_ok!(Content::issue_nft(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        // Sell nft
        assert_ok!(Content::sell_nft(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(DEFAULT_MEMBER_ID),
            DEFAULT_NFT_PRICE,
        ));

        // Make an attempt to update buy now price if actor is not authorized
        let update_buy_now_price_result = Content::update_buy_now_price(
            RuntimeOrigin::signed(SECOND_MEMBER_ACCOUNT_ID),
            ContentActor::Member(SECOND_MEMBER_ID),
            video_id,
            NEW_NFT_PRICE,
        );

        // Failure checked
        assert_err!(
            update_buy_now_price_result,
            Error::<Test>::ActorNotAuthorized
        );
    })
}

#[test]
fn update_buy_now_price_not_in_auction_state() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Issue nft
        assert_ok!(Content::issue_nft(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        // Make an attempt to update buy now price if there is no pending one
        let update_buy_now_price_result = Content::update_buy_now_price(
            RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NEW_NFT_PRICE,
        );

        // Failure checked
        assert_err!(
            update_buy_now_price_result,
            Error::<Test>::NftNotInBuyNowState
        );
    })
}

#[test]
fn update_buy_now_price_fails_during_channel_transfer() {
    with_default_mock_builder(|| {
        run_to_block(1);
        ContentTest::default()
            .with_video_nft_status(NftTransactionalStatusType::BuyNow)
            .setup();
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(THIRD_MEMBER_ID)
            .call_and_assert(Ok(()));

        assert_noop!(
            Content::update_buy_now_price(
                RuntimeOrigin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
                ContentActor::Member(DEFAULT_MEMBER_ID),
                1u64,
                Content::min_starting_price() + 1,
            ),
            Error::<Test>::InvalidChannelTransferStatus,
        );
    })
}
