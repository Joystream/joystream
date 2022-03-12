#![cfg(test)]
use crate::tests::fixtures::{
    create_default_member_owned_channel_with_video, create_initial_storage_buckets_helper,
    increase_account_balance_helper,
};
use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

#[test]
fn issue_nft() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Video does not have an nft
        assert_eq!(None, Content::video_by_id(video_id).nft_status);

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        // Runtime tested state after call

        // Ensure nft created succesfully
        let nft_status = Some(OwnedNft::new(
            NftOwner::ChannelOwner,
            None,
            TransactionalStatus::<Test>::Idle,
        ));
        assert_eq!(nft_status, Content::video_by_id(video_id).nft_status);

        // Last event checked
        let nft_issue_params = NftIssuanceParameters::<Test>::default();
        assert_event(
            MetaEvent::content(RawEvent::NftIssued(
                ContentActor::Member(DEFAULT_MEMBER_ID),
                video_id,
                nft_issue_params,
            )),
            number_of_events_before_call + 1,
        );
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
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
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

        // Make an attempt to issue nft once again for the same video
        let issue_nft_result = Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        );

        // Failure checked
        assert_err!(issue_nft_result, Error::<Test>::NftAlreadyExists);
    })
}

#[test]
fn issue_nft_auth_failed() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Make an attempt to issue nft with wrong credentials
        let issue_nft_result = Content::issue_nft(
            Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
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

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Make an attempt to issue nft if actor is not authorized
        let issue_nft_result = Content::issue_nft(
            Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            ContentActor::Member(UNAUTHORIZED_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
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

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Make an attempt to issue nft with wrong credentials
        let issue_nft_result = Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test> {
                royalty: Some(Perbill::one()),
                ..NftIssuanceParameters::<Test>::default()
            },
        );

        // Failure checked
        assert_err!(issue_nft_result, Error::<Test>::RoyaltyUpperBoundExceeded);

        // Make an attempt to issue nft with wrong credentials
        let issue_nft_result = Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test> {
                royalty: Some(Perbill::from_perthousand(1)),
                ..NftIssuanceParameters::<Test>::default()
            },
        );

        // Failure checked
        assert_err!(issue_nft_result, Error::<Test>::RoyaltyLowerBoundExceeded);
    })
}

#[test]
fn issue_nft_fails_with_invalid_auction_parameters() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let auction_params = AuctionParams::<Test> {
            starting_price: Content::min_starting_price() - 1,
            buy_now_price: None,
            auction_type: AuctionTypeOf::<Test>::Open(OpenAuction::<Test> {
                bid_lock_duration: Content::min_bid_lock_duration(),
                ..Default::default()
            }),
            whitelist: BTreeSet::new(),
        };

        // Make an attempt to issue nft with wrong credentials
        let issue_nft_result = Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test> {
                init_transactional_status: InitTransactionalStatus::<Test>::Auction(auction_params),
                ..NftIssuanceParameters::<Test>::default()
            },
        );

        // Failure checked
        assert_err!(
            issue_nft_result,
            Error::<Test>::StartingPriceLowerBoundExceeded
        );
    })
}
