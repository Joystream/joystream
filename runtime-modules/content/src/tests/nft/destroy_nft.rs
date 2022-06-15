#![cfg(test)]
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_noop, assert_ok};

#[test]
fn destroy_nft() {
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

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        // Sell nft
        assert_ok!(Content::destroy_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id
        ));

        // Runtime tested state after call

        // Ensure nft is no longer issued
        assert!(matches!(Content::video_by_id(video_id).nft_status, None));

        // Last event checked
        assert_event(
            MetaEvent::content(RawEvent::NftDestroyed(
                ContentActor::Member(DEFAULT_MEMBER_ID),
                video_id,
            )),
            number_of_events_before_call + 1,
        );
    })
}

#[test]
fn destroy_nft_video_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        // Make an attempt to destroy nft which corresponding video does not exist
        let result = Content::destroy_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(result, Error::<Test>::VideoDoesNotExist);
    })
}

#[test]
fn destroy_nft_not_issued() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Make an attempt to destrot nft which is not issued yet
        let result = Content::destroy_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(result, Error::<Test>::NftDoesNotExist);
    })
}

#[test]
fn destroy_nft_auth_failed() {
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

        // Make an attempt to destroy nft with wrong credentials
        let result = Content::destroy_nft(
            Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(result, Error::<Test>::MemberAuthFailed);
    })
}

#[test]
fn destroy_nft_not_authorized() {
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

        // Make an attempt to destroy nft if actor is not authorized
        let result = Content::destroy_nft(
            Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            ContentActor::Member(UNAUTHORIZED_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(result, Error::<Test>::ActorNotAuthorized);
    })
}

#[test]
fn destroy_nft_transactional_status_is_not_idle() {
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

        // Make an attempt to destroy nft when it is already offered
        let result = Content::destroy_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
        );

        // Failure checked
        assert_err!(result, Error::<Test>::NftIsNotIdle);
    })
}

#[test]
fn destroy_nft_fails_during_channel_transfer() {
    with_default_mock_builder(|| {
        run_to_block(1);
        ContentTest::with_member_channel().with_video().setup();
        IssueNftFixture::default().call_and_assert(Ok(()));
        UpdateChannelTransferStatusFixture::default()
            .with_new_member_channel_owner(SECOND_MEMBER_ID)
            .call_and_assert(Ok(()));

        assert_noop!(
            Content::destroy_nft(
                Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
                ContentActor::Member(DEFAULT_MEMBER_ID),
                1u64,
            ),
            Error::<Test>::InvalidChannelTransferStatus,
        );
    })
}
