#![cfg(test)]
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_noop, assert_ok};

#[test]
fn offer_nft() {
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

        // Runtime tested state after call

        // Ensure nft offered succesfully
        assert!(matches!(
            Content::video_by_id(video_id).nft_status,
            Some(OwnedNft {
                transactional_status: TransactionalStatus::<Test>::InitiatedOfferToMember(
                    SECOND_MEMBER_ID,
                    None
                ),
                ..
            })
        ));

        // Last event checked
        last_event_eq!(RawEvent::OfferStarted(
            video_id,
            ContentActor::Member(DEFAULT_MEMBER_ID),
            SECOND_MEMBER_ID,
            None,
        ));
    })
}

#[test]
fn offer_nft_video_does_not_exist() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        // Make an attempt to offer nft which corresponding video does not exist
        let offer_nft_result = Content::offer_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(DEFAULT_MEMBER_ID),
            SECOND_MEMBER_ID,
            None,
        );

        // Failure checked
        assert_err!(offer_nft_result, Error::<Test>::VideoDoesNotExist);
    })
}

#[test]
fn offer_nft_not_issued() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let video_id = NextVideoId::<Test>::get();

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        // Make an attempt to offer nft which is not issued yet
        let offer_nft_result = Content::offer_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(DEFAULT_MEMBER_ID),
            SECOND_MEMBER_ID,
            None,
        );

        // Failure checked
        assert_err!(offer_nft_result, Error::<Test>::NftDoesNotExist);
    })
}

#[test]
fn offer_nft_auth_failed() {
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

        // Make an attempt to offer nft with wrong credentials
        let offer_nft_result = Content::offer_nft(
            Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(DEFAULT_MEMBER_ID),
            SECOND_MEMBER_ID,
            None,
        );

        // Failure checked
        assert_err!(offer_nft_result, Error::<Test>::MemberAuthFailed);
    })
}

#[test]
fn offer_nft_not_authorized() {
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

        // Make an attempt to offer nft if actor is not authorized
        let offer_nft_result = Content::offer_nft(
            Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(UNAUTHORIZED_MEMBER_ID),
            UNAUTHORIZED_MEMBER_ID,
            None,
        );

        // Failure checked
        assert_err!(offer_nft_result, Error::<Test>::ActorNotAuthorized);
    })
}

#[test]
fn offer_nft_transactional_status_is_not_idle() {
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

        // Make an attempt to offer nft when it is already offered
        let offer_nft_result = Content::offer_nft(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            video_id,
            ContentActor::Member(DEFAULT_MEMBER_ID),
            SECOND_MEMBER_ID,
            None,
        );

        // Failure checked
        assert_err!(offer_nft_result, Error::<Test>::NftIsNotIdle);
    })
}

#[ignore]
#[test]
fn offer_nft_fails_during_channel_transfer() {
    with_default_mock_builder(|| {
        run_to_block(1);
        ContentTest::default().with_video_nft().setup();
        UpdateChannelTransferStatusFixture::default()
            .with_new_member_channel_owner(THIRD_MEMBER_ID)
            .call_and_assert(Ok(()));

        assert_noop!(
            Content::offer_nft(
                Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
                1u64,
                ContentActor::Member(DEFAULT_MEMBER_ID),
                SECOND_MEMBER_ID,
                None,
            ),
            Error::<Test>::InvalidChannelTransferStatus,
        );
    })
}

#[test]
fn offer_nft_fails_with_non_existing_target_member_id() {
    with_default_mock_builder(|| {
        let non_existing_member_id = 9999;
        ContentTest::default().with_video_nft().setup();
        OfferNftFixture::default()
            .with_to(non_existing_member_id)
            .call_and_assert(Err(Error::<Test>::TargetMemberDoesNotExist.into()))
    })
}
