#![cfg(test)]
use super::fixtures::*;
use super::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};
use sp_std::iter::FromIterator;

#[test]
fn successful_agent_remark() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_collaborator_permissions(&[
            ChannelActionPermission::AgentRemark,
        ]);

        let channel_id = Content::next_channel_id() - 1;
        let msg = b"test".to_vec();

        assert_ok!(Content::channel_agent_remark(
            Origin::signed(COLLABORATOR_MEMBER_ACCOUNT_ID),
            ContentActor::Member(COLLABORATOR_MEMBER_ID),
            channel_id,
            msg
        ));
    })
}

#[test]
fn unsuccessful_agent_remark_with_invalid_channel_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let invalid_channel_id = Content::next_channel_id();
        let msg = b"test".to_vec();

        assert_err!(
            Content::channel_agent_remark(
                Origin::signed(COLLABORATOR_MEMBER_ACCOUNT_ID),
                ContentActor::Member(COLLABORATOR_MEMBER_ID),
                invalid_channel_id,
                msg
            ),
            Error::<Test>::ChannelDoesNotExist
        );
    })
}

#[test]
fn unsuccessful_agent_remark_with_invalid_account_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let channel_id = Content::next_channel_id() - 1;
        let msg = b"test".to_vec();

        assert_err!(
            Content::channel_agent_remark(
                Origin::signed(UNAUTHORIZED_COLLABORATOR_MEMBER_ACCOUNT_ID + 1),
                ContentActor::Member(COLLABORATOR_MEMBER_ID),
                channel_id,
                msg
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

#[test]
fn unsuccessful_agent_remark_with_invalid_member_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let channel_id = Content::next_channel_id() - 1;
        let msg = b"test".to_vec();

        assert_err!(
            Content::channel_agent_remark(
                Origin::signed(COLLABORATOR_MEMBER_ACCOUNT_ID),
                ContentActor::Member(UNAUTHORIZED_COLLABORATOR_MEMBER_ID),
                channel_id,
                msg
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

#[test]
fn unsuccessful_agent_remark_by_non_agent() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let channel_id = Content::next_channel_id() - 1;
        let msg = b"test".to_vec();

        assert_err!(
            Content::channel_agent_remark(
                Origin::signed(UNAUTHORIZED_COLLABORATOR_MEMBER_ACCOUNT_ID),
                ContentActor::Member(UNAUTHORIZED_COLLABORATOR_MEMBER_ID),
                channel_id,
                msg
            ),
            Error::<Test>::ActorNotAuthorized,
        );
    })
}

#[test]
fn unsuccessful_owner_remark_with_invalid_channel_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let invalid_channel_id = Content::next_channel_id();
        let msg = b"test".to_vec();

        assert_err!(
            Content::channel_owner_remark(
                Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
                invalid_channel_id,
                msg
            ),
            Error::<Test>::ChannelDoesNotExist,
        );
    })
}

#[test]
fn unsuccessful_owner_remark_with_invalid_account_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let channel_id = Content::next_channel_id() - 1;
        let msg = b"test".to_vec();

        assert_err!(
            Content::channel_owner_remark(
                Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
                channel_id,
                msg
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

#[test]
fn unsuccessful_owner_remark_by_non_owner() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        let channel_id = Content::next_channel_id() - 1;
        let msg = b"test".to_vec();

        assert_err!(
            Content::channel_owner_remark(
                Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
                channel_id,
                msg
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

#[test]
fn unsuccessful_curator_channel_owner_remark_by_unauthorized_curator() {
    with_default_mock_builder(|| {
        ContentTest::with_curator_channel()
            .with_agent_permissions(&[ChannelActionPermission::AgentRemark])
            .setup();

        let channel_id = Content::next_channel_id() - 1;
        let msg = b"test".to_vec();

        assert_err!(
            Content::channel_owner_remark(
                Origin::signed(UNAUTHORIZED_CURATOR_ACCOUNT_ID),
                channel_id,
                msg
            ),
            Error::<Test>::LeadAuthFailed,
        );
    })
}

#[test]
fn unsuccessful_nft_owner_remark_with_nft_not_issued() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        let video_id = Content::next_video_id() - 1;
        let msg = b"test".to_vec();

        assert_err!(
            Content::nft_owner_remark(
                Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
                ContentActor::Member(DEFAULT_MEMBER_ID),
                video_id,
                msg
            ),
            Error::<Test>::NftDoesNotExist,
        );
    })
}

fn issue_and_sell_nft() {
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

    // deposit balance to second member
    increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, ed() + DEFAULT_NFT_PRICE);

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
}

#[test]
fn successful_nft_owner_remark() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let video_id = Content::next_video_id();
        let msg = b"test".to_vec();

        issue_and_sell_nft();

        assert_ok!(Content::nft_owner_remark(
            Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
            ContentActor::Member(SECOND_MEMBER_ID),
            video_id,
            msg
        ));
    })
}

#[test]
fn unsuccessful_nft_owner_with_invalid_video_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let invalid_video_id = Content::next_video_id() + 1;
        let msg = b"test".to_vec();

        issue_and_sell_nft();

        assert_err!(
            Content::nft_owner_remark(
                Origin::signed(SECOND_MEMBER_ACCOUNT_ID),
                ContentActor::Member(SECOND_MEMBER_ID),
                invalid_video_id,
                msg
            ),
            Error::<Test>::VideoDoesNotExist
        );
    })
}

#[test]
fn unsuccessful_nft_owner_by_non_authorized_actor() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let video_id = Content::next_video_id();
        let msg = b"test".to_vec();

        issue_and_sell_nft();

        assert_err!(
            Content::nft_owner_remark(
                Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
                ContentActor::Member(UNAUTHORIZED_MEMBER_ID),
                video_id,
                msg
            ),
            Error::<Test>::ActorNotAuthorized
        );
    })
}

#[test]
fn unsuccessful_nft_owner_with_invalid_acount() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let video_id = Content::next_video_id();
        let msg = b"test".to_vec();

        issue_and_sell_nft();

        assert_err!(
            Content::nft_owner_remark(
                Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
                ContentActor::Member(SECOND_MEMBER_ID),
                video_id,
                msg
            ),
            Error::<Test>::MemberAuthFailed
        );
    })
}

#[test]
fn successful_nft_remark_during_transfer() {
    with_default_mock_builder(|| {
        run_to_block(1);
        run_to_block(1);

        ContentTest::default().with_video_nft().setup();
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(SECOND_MEMBER_ID)
            .call_and_assert(Ok(()));

        assert_ok!(Content::nft_owner_remark(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            1u64,
            b"test".to_vec(),
        ));
    })
}

#[test]
fn successful_channel_owner_remark_during_transfer() {
    with_default_mock_builder(|| {
        run_to_block(1);

        ContentTest::with_member_channel().setup();
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(SECOND_MEMBER_ID)
            .call_and_assert(Ok(()));

        assert_ok!(Content::channel_owner_remark(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            1u64,
            b"test".to_vec(),
        ));
    })
}

#[test]
fn successful_channel_agent_remark_during_transfer() {
    with_default_mock_builder(|| {
        run_to_block(1);
        ContentTest::with_member_channel()
            .with_collaborators(&[(
                COLLABORATOR_MEMBER_ID,
                BTreeSet::from_iter(vec![ChannelActionPermission::AgentRemark]),
            )])
            .setup();
        InitializeChannelTransferFixture::default()
            .with_new_member_channel_owner(SECOND_MEMBER_ID)
            .call_and_assert(Ok(()));

        assert_ok!(Content::channel_agent_remark(
            Origin::signed(COLLABORATOR_MEMBER_ACCOUNT_ID),
            ContentActor::Member(COLLABORATOR_MEMBER_ID),
            1u64,
            b"test".to_vec(),
        ));
    })
}
