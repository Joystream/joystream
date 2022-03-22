#![cfg(test)]
use crate::tests::fixtures::{
    create_default_member_owned_channel_with_video, create_initial_storage_buckets_helper,
    increase_account_balance_helper,
};
use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

#[test]
fn sling_nft_back() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test> {
                non_channel_owner: Some(SECOND_MEMBER_ID),
                ..NftIssuanceParameters::<Test>::default()
            }
        ));

        // Runtime tested state before call
        assert!(matches!(
            Content::video_by_id(video_id).nft_status,
            Some(OwnedNft {
                owner: NftOwner::Member(SECOND_MEMBER_ID),
                ..
            })
        ));

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        // Sling nft back to the original artist
        assert_ok!(Content::sling_nft_back(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(SECOND_MEMBER_ID),
        ));

        // Runtime tested state after call

        // Ensure nft slinged back successfully
        assert!(matches!(
            Content::video_by_id(video_id).nft_status,
            Some(OwnedNft {
                owner: NftOwner::ChannelOwner,
                ..
            })
        ));

        // Last event checked
        assert_event(
            MetaEvent::content(RawEvent::NftSlingedBackToTheOriginalArtist(
                video_id,
                ContentActor::Member(SECOND_MEMBER_ID),
            )),
            number_of_events_before_call + 1,
        );
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
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(DEFAULT_MEMBER_ID),
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

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);

        // Make an attempt to sling nft back which is not issued yet
        let sling_nft_back_result = Content::sling_nft_back(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(DEFAULT_MEMBER_ID),
        );

        // Failure checked
        assert_err!(sling_nft_back_result, Error::<Test>::NftDoesNotExist);
    })
}

#[test]
fn sling_nft_back_auth_failed() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        // Make an attempt to sling nft back with wrong credentials
        let sling_nft_back_result = Content::sling_nft_back(
            Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(DEFAULT_MEMBER_ID),
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

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id,
            NftIssuanceParameters::<Test>::default(),
        ));

        // Make an attempt to sling nft back if actor is not authorized
        let sling_nft_back_result = Content::sling_nft_back(
            Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(UNAUTHORIZED_MEMBER_ID),
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

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video(DATA_OBJECT_DELETION_PRIZE);

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

        // Make an attempt to sling nft back when it is already offered
        let sling_nft_back_result = Content::sling_nft_back(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(DEFAULT_MEMBER_ID),
        );

        // Failure checked
        assert_err!(sling_nft_back_result, Error::<Test>::NftIsNotIdle);
    })
}
