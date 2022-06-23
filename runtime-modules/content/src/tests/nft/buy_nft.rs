#![cfg(test)]
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

fn setup_nft_on_sale_scenario() {
    let video_id = NextVideoId::<Test>::get();

    create_initial_storage_buckets_helper();
    increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
    create_default_member_owned_channel_with_video();

    // Issue nft
    assert_ok!(Content::issue_nft(
        Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
        ContentActor::Member(DEFAULT_MEMBER_ID),
        video_id,
        NftIssuanceParameters::<Test> {
            royalty: Some(Perbill::from_percent(DEFAULT_ROYALTY),),
            ..Default::default()
        }
    ));

    // Sell nft
    assert_ok!(Content::sell_nft(
        Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
        video_id,
        ContentActor::Member(DEFAULT_MEMBER_ID),
        DEFAULT_NFT_PRICE,
    ));
}

#[test]
fn buy_nft_ok_with_royalty_account() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();
        // deposit balance to second member
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, DEFAULT_NFT_PRICE);

        let platform_fee = Content::platform_fee_percentage().mul_floor(DEFAULT_NFT_PRICE);
        setup_nft_on_sale_scenario();

        let balance_pre = channel_reward_account_balance(1u64);

        assert_ok!(Content::buy_nft(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
            SECOND_MEMBER_ID,
            DEFAULT_NFT_PRICE,
        ));

        assert_eq!(
            channel_reward_account_balance(1u64),
            balance_pre + DEFAULT_NFT_PRICE - platform_fee,
        );
    })
}

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

        let reward_account = ContentTreasury::<Test>::account_for_channel(channel_id);
        let balance_pre = balances::Pallet::<Test>::free_balance(reward_account);

        // Sell nft
        assert_ok!(Content::sell_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(DEFAULT_MEMBER_ID),
            DEFAULT_NFT_PRICE,
        ));

        // Buy nft
        assert_ok!(Content::buy_nft(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
            SECOND_MEMBER_ID,
            DEFAULT_NFT_PRICE,
        ));

        // Runtime tested state after call
        let balance_post = balances::Pallet::<Test>::free_balance(reward_account);

        // Ensure buyer balance was succesfully slashed after nft had been bought
        assert_eq!(
            balances::Pallet::<Test>::free_balance(SECOND_MEMBER_ACCOUNT_ID),
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
        last_event_eq!(RawEvent::NftBought(video_id, SECOND_MEMBER_ID));
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
            DEFAULT_NFT_PRICE,
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
            DEFAULT_NFT_PRICE,
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
            DEFAULT_NFT_PRICE,
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
            DEFAULT_NFT_PRICE,
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
            DEFAULT_NFT_PRICE,
        );

        // Failure checked
        assert_err!(buy_nft_result, Error::<Test>::InsufficientBalance);
    })
}

#[test]
fn buy_nft_fails_with_invalid_price_commit() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        let starting_block = 1;
        run_to_block(starting_block);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        UpdateChannelFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .call_and_assert(Ok(()));

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test> {
                init_transactional_status: InitTransactionalStatus::<Test>::BuyNow(
                    DEFAULT_NFT_PRICE
                ),
                ..Default::default()
            }
        ));

        // deposit balance to second member
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, DEFAULT_NFT_PRICE);

        // Go to next block
        run_to_block(starting_block + 1);

        // Seller races to set the price to 0
        assert_ok!(Content::update_buy_now_price(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            0,
        ));

        // Attempt to buy NFT with price_commit protection
        let buy_nft_result = Content::buy_nft(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
            SECOND_MEMBER_ID,
            DEFAULT_NFT_PRICE,
        );

        // Failure checked
        assert_err!(buy_nft_result, Error::<Test>::InvalidBuyNowPriceProvided);
    })
}

#[test]
fn buy_now_ok_with_nft_owner_member_correctly_credited() {
    with_default_mock_builder(|| {
        ContentTest::default().with_video().setup();
        IssueNftFixture::default()
            .with_non_channel_owner(THIRD_MEMBER_ID)
            .with_royalty(Perbill::from_percent(1))
            .with_init_status(InitTransactionalStatus::<Test>::BuyNow(DEFAULT_NFT_PRICE))
            .call_and_assert(Ok(()));
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, DEFAULT_NFT_PRICE);
        let royalty = Perbill::from_percent(DEFAULT_ROYALTY).mul_floor(DEFAULT_NFT_PRICE);
        let platform_fee = Content::platform_fee_percentage().mul_floor(DEFAULT_NFT_PRICE);

        assert_ok!(Content::buy_nft(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            VideoId::one(),
            SECOND_MEMBER_ID,
            DEFAULT_NFT_PRICE,
        ));

        assert_eq!(
            Balances::<Test>::usable_balance(THIRD_MEMBER_ACCOUNT_ID),
            DEFAULT_NFT_PRICE - royalty - platform_fee,
        )
    })
}

#[test]
fn buy_now_ok_with_nft_owner_channel_correctly_credited() {
    with_default_mock_builder(|| {
        let video_id = 1u64;
        ContentTest::with_member_channel().setup();

        CreateVideoFixture::default()
            .with_nft_in_sale(DEFAULT_NFT_PRICE)
            .call();

        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, DEFAULT_NFT_PRICE);
        let platform_fee = Content::platform_fee_percentage().mul_floor(DEFAULT_NFT_PRICE);

        assert_ok!(Content::buy_nft(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
            SECOND_MEMBER_ID,
            DEFAULT_NFT_PRICE,
        ));

        assert_eq!(
            channel_reward_account_balance(1u64),
            // balance_pre - platform fee (since channel owner it retains royalty)
            DEFAULT_NFT_PRICE - platform_fee,
        )
    })
}
