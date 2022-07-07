#![cfg(test)]
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_noop, assert_ok};

#[test]
fn accept_incoming_offer() {
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

        // Offer nft
        assert_ok!(Content::offer_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(DEFAULT_MEMBER_ID),
            SECOND_MEMBER_ID,
            None,
        ));

        // Accept nft offer
        assert_ok!(Content::accept_incoming_offer(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
            None
        ));

        // Runtime tested state after call

        // Ensure nft offer accepted succesfully
        assert!(matches!(
            Content::video_by_id(video_id).nft_status,
            Some(OwnedNft {
                owner: NftOwner::Member(member_id),
                transactional_status: TransactionalStatus::<Test>::Idle,
                ..
            }) if member_id == SECOND_MEMBER_ID
        ));

        // Last event checked
        last_event_eq!(RawEvent::OfferAccepted(video_id));
    })
}

#[test]
fn accept_incoming_offer_video_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        // Make an attempt to accept incoming nft offer if corresponding video does not exist
        let accept_incoming_offer_result = Content::accept_incoming_offer(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
            None,
        );

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
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Make an attempt to accept incoming nft offer if corresponding nft is not issued yet
        let accept_incoming_offer_result = Content::accept_incoming_offer(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
            None,
        );

        // Failure checked
        assert_err!(accept_incoming_offer_result, Error::<Test>::NftDoesNotExist);
    })
}

#[test]
fn accept_incoming_offer_auth_failed() {
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

        // Offer nft
        assert_ok!(Content::offer_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(DEFAULT_MEMBER_ID),
            SECOND_MEMBER_ID,
            None,
        ));

        // Make an attempt to accept incoming nft offer providing wrong credentials
        let accept_incoming_offer_result = Content::accept_incoming_offer(
            Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            video_id,
            None,
        );

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

        // Make an attempt to accept incoming nft offer if there is no incoming transfers
        let accept_incoming_offer_result = Content::accept_incoming_offer(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
            None,
        );

        // Failure checked
        assert_err!(
            accept_incoming_offer_result,
            Error::<Test>::PendingOfferDoesNotExist
        );
    })
}

#[test]
fn accept_incoming_offer_ok_with_nft_member_owner_correctly_credited() {
    with_default_mock_builder(|| {
        ContentTest::default().with_video().setup();
        IssueNftFixture::default()
            .with_non_channel_owner(THIRD_MEMBER_ID)
            .with_royalty(Perbill::from_percent(1))
            .with_init_status(InitTransactionalStatus::<Test>::InitiatedOfferToMember(
                SECOND_MEMBER_ID,
                Some(DEFAULT_NFT_PRICE),
            ))
            .call_and_assert(Ok(()));
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, DEFAULT_NFT_PRICE);
        let royalty = Perbill::from_percent(DEFAULT_ROYALTY).mul_floor(DEFAULT_NFT_PRICE);
        let platform_fee = Content::platform_fee_percentage().mul_floor(DEFAULT_NFT_PRICE);

        assert_ok!(Content::accept_incoming_offer(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            VideoId::one(),
            Some(DEFAULT_NFT_PRICE)
        ));

        // check member owner balance increased by NFT PRICE - ROYALTY - FEE
        assert_eq!(
            Balances::<Test>::usable_balance(THIRD_MEMBER_ACCOUNT_ID),
            DEFAULT_NFT_PRICE - royalty - platform_fee,
        );
    })
}

#[test]
fn accept_incoming_offer_reward_account_ok_with_owner_channel_account_correctly_credited() {
    with_default_mock_builder(|| {
        ContentTest::default().with_video().setup();
        IssueNftFixture::default()
            .with_royalty(Perbill::from_percent(1))
            .with_init_status(InitTransactionalStatus::<Test>::InitiatedOfferToMember(
                SECOND_MEMBER_ID,
                Some(DEFAULT_NFT_PRICE),
            ))
            .call_and_assert(Ok(()));
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, DEFAULT_NFT_PRICE);
        let platform_fee = Content::platform_fee_percentage().mul_floor(DEFAULT_NFT_PRICE);

        assert_ok!(Content::accept_incoming_offer(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            VideoId::one(),
            Some(DEFAULT_NFT_PRICE)
        ));

        // check creator owner balance increased by NFT PRICE - FEE
        assert_eq!(
            channel_reward_account_balance(ChannelId::one()),
            DEFAULT_NFT_PRICE - platform_fee,
        );
    })
}

#[test]
fn accept_incoming_offer_insufficient_balance() {
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

        // Offer nft
        assert_ok!(Content::offer_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(DEFAULT_MEMBER_ID),
            SECOND_MEMBER_ID,
            Some(DEFAULT_NFT_PRICE),
        ));

        // Make an attempt to accept incoming nft offer if there is no incoming transfers
        let accept_incoming_offer_result = Content::accept_incoming_offer(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
            Some(DEFAULT_NFT_PRICE),
        );

        // Failure checked
        assert_err!(
            accept_incoming_offer_result,
            Error::<Test>::InsufficientBalance
        );
    })
}

#[test]
fn accept_incoming_offer_fails_during_channel_transfer() {
    with_default_mock_builder(|| {
        ContentTest::default()
            .with_video_nft_status(NftTransactionalStatusType::Offer)
            .setup();
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(THIRD_MEMBER_ID)
            .call_and_assert(Ok(()));

        assert_noop!(
            Content::accept_incoming_offer(
                Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
                VideoId::one(),
                None
            ),
            Error::<Test>::InvalidChannelTransferStatus,
        );
    })
}

#[test]
fn accept_incoming_offer_fails_with_invalid_witness_price_provided() {
    with_default_mock_builder(|| {
        ContentTest::default().with_video_nft().setup();
        OfferNftFixture::default()
            .with_price(Some(DEFAULT_NFT_PRICE))
            .call_and_assert(Ok(()));

        assert_noop!(
            Content::accept_incoming_offer(
                Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
                VideoId::one(),
                Some(DEFAULT_NFT_PRICE - 1)
            ),
            Error::<Test>::InvalidNftOfferWitnessPriceProvided,
        );

        assert_noop!(
            Content::accept_incoming_offer(
                Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
                VideoId::one(),
                None
            ),
            Error::<Test>::InvalidNftOfferWitnessPriceProvided,
        );
    })
}
