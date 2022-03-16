#![cfg(test)]
use super::curators::add_curator_to_new_group;
use super::fixtures::*;
use super::mock::*;
use crate::*;

// create post tests
#[test]
pub fn unsuccessful_post_creation_with_member_auth_failed() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        CreatePostFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()))
    })
}

#[test]
pub fn unsuccessful_post_creation_with_curator_auth_failed() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video();

        let default_curator_group_id = add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreatePostFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .call_and_assert(Err(Error::<Test>::CuratorAuthFailed.into()))
    })
}

#[test]
pub fn unsuccessful_post_creation_with_lead_auth_failed() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video();

        CreatePostFixture::default()
            .with_sender(UNAUTHORIZED_LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()))
    })
}

#[test]
pub fn unsuccessful_post_creation_with_insufficient_balance() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();
        slash_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID);

        CreatePostFixture::default().call_and_assert(Err(Error::<Test>::UnsufficientBalance.into()))
    })
}

#[test]
pub fn unsuccessful_post_creation_by_member_not_channel_owner() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        CreatePostFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(UNAUTHORIZED_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
pub fn unsuccessful_post_creation_by_curator_not_channel_owner() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video();

        increase_account_balance_helper(UNAUTHORIZED_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        let unauthorized_curator_group_id = add_curator_to_new_group(UNAUTHORIZED_CURATOR_ID);
        CreatePostFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                unauthorized_curator_group_id,
                UNAUTHORIZED_CURATOR_ID,
            ))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
pub fn unsuccessful_post_creation_with_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video();

        CreatePostFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::ActorCannotOwnChannel.into()))
    })
}

#[test]
pub fn unsuccessful_post_creation_with_invalid_video_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        CreatePostFixture::default()
            .with_params(VideoPostCreationParameters::<Test> {
                post_type: VideoPostType::<Test>::Description,
                video_reference: VideoId::zero(),
            })
            .call_and_assert(Err(Error::<Test>::VideoDoesNotExist.into()))
    })
}

#[test]
pub fn unsuccessful_comment_creation_with_invalid_parent_id() {
    with_default_mock_builder(|| {
        run_to_block(1);
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_post();

        CreatePostFixture::default()
            .with_params(VideoPostCreationParameters::<Test> {
                post_type: VideoPostType::<Test>::Comment(VideoPostId::zero()),
                video_reference: VideoId::one(),
            })
            .call_and_assert(Err(Error::<Test>::VideoPostDoesNotExist.into()))
    })
}

#[test]
pub fn successful_post_creation_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video();

        CreatePostFixture::default().call_and_assert(Ok(()))
    })
}

#[test]
pub fn successful_post_creation_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video();
        let default_curator_group_id = Content::next_curator_group_id() - 1;

        CreatePostFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .call_and_assert(Ok(()))
    })
}

#[test]
pub fn successful_comment_creation_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);

        // creating different post owner and comment owner
        create_default_curator_owned_channel_with_video_and_post();

        println!("POST CREATED");
        CreatePostFixture::default()
            .with_params(VideoPostCreationParameters::<Test> {
                post_type: VideoPostType::<Test>::Comment(VideoPostId::one()),
                video_reference: VideoId::one(),
            })
            .call_and_assert(Ok(()))
    })
}


#[test]
pub fn successful_comment_creation_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);

        // creating different post owner and comment owner
        create_default_member_owned_channel_with_video_and_post();

        let default_curator_group_id = add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreatePostFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .with_params(VideoPostCreationParameters::<Test> {
                post_type: VideoPostType::<Test>::Comment(VideoPostId::one()),
                video_reference: VideoId::one(),
            })
            .call_and_assert(Ok(()))
    })
}

#[test]
pub fn successful_comment_creation_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);

        // creating different post owner and comment owner
        create_default_member_owned_channel_with_video_and_post();

        CreatePostFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_params(VideoPostCreationParameters::<Test> {
                post_type: VideoPostType::<Test>::Comment(VideoPostId::one()),
                video_reference: VideoId::one(),
            })
            .call_and_assert(Ok(()))
    })
}

// edit post text tests
#[test]
pub fn unsuccessful_post_update_with_member_auth_failed() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_comment();

        EditPostTextFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()))
    })
}

#[test]
pub fn unsuccessful_post_update_with_curator_auth_failed() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video_and_comment();

        let default_curator_group_id = add_curator_to_new_group(DEFAULT_CURATOR_ID);
        EditPostTextFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .call_and_assert(Err(Error::<Test>::CuratorAuthFailed.into()))
    })
}

#[test]
pub fn unsuccessful_post_update_with_lead_auth_failed() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video_and_post();

        increase_account_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        CreatePostFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_params(VideoPostCreationParameters::<Test> {
                post_type: VideoPostType::<Test>::Comment(VideoPostId::one()),
                video_reference: VideoId::one(),
            })
            .call_and_assert(Ok(()));

        EditPostTextFixture::default()
            .with_sender(UNAUTHORIZED_LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_post_id(VideoPostId::from(2u64))
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()))
    })
}

#[test]
pub fn unsuccessful_post_update_with_invalid_post_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_comment();

        EditPostTextFixture::default()
            .with_post_id(VideoPostId::zero())
            .call_and_assert(Err(Error::<Test>::VideoPostDoesNotExist.into()))
    })
}

#[test]
pub fn unsuccessful_post_update_with_invalid_video_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_comment();

        EditPostTextFixture::default()
            .with_video_id(VideoPostId::zero())
            .call_and_assert(Err(Error::<Test>::VideoPostDoesNotExist.into()))
    })
}

#[test]
pub fn unsuccessful_post_update_by_member_not_channel_owner() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(UNAUTHORIZED_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_comment();

        EditPostTextFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(UNAUTHORIZED_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
pub fn unsuccessful_post_update_by_curator_not_channel_owner() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video_and_comment();

        let unauthorized_curator_group_id = add_curator_to_new_group(UNAUTHORIZED_CURATOR_ID);
        EditPostTextFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                unauthorized_curator_group_id,
                UNAUTHORIZED_CURATOR_ID,
            ))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
pub fn unsuccessful_comment_update_by_member_not_author() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(UNAUTHORIZED_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_comment();

        EditPostTextFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_post_id(VideoPostId::from(2u64))
            .with_actor(ContentActor::Member(UNAUTHORIZED_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
pub fn unsuccessful_comment_update_by_curator_not_author() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(UNAUTHORIZED_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video_and_comment();

        let unauthorized_curator_group_id = add_curator_to_new_group(UNAUTHORIZED_CURATOR_ID);
        EditPostTextFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                unauthorized_curator_group_id,
                UNAUTHORIZED_CURATOR_ID,
            ))
            .with_post_id(VideoPostId::from(2u64))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
pub fn unsuccessful_comment_update_by_lead_not_author() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video_and_comment();

        EditPostTextFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_post_id(VideoPostId::from(2u64))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
pub fn successful_comment_update_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_comment();

        EditPostTextFixture::default()
            .with_post_id(VideoPostId::from(2u64))
            .call_and_assert(Ok(()))
    })
}

#[test]
pub fn unsuccessful_comment_update_with_pending_active_transfers() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_comment();

        UpdateChannelTransferStatusFixture::default().call_and_assert(Ok(()));

        EditPostTextFixture::default()
            .with_post_id(VideoPostId::from(2u64))
            .call_and_assert(Err(Error::<Test>::InvalidChannelTransferStatus.into()));
    })
}

#[test]
pub fn successful_comment_update_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video_and_comment();

        let default_curator_group_id = Content::next_curator_group_id() - 1;
        EditPostTextFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .with_post_id(VideoPostId::from(2u64))
            .call_and_assert(Ok(()))
    })
}

#[test]
pub fn successful_comment_update_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video_and_post();

        increase_account_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        CreatePostFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_params(VideoPostCreationParameters::<Test> {
                post_type: VideoPostType::<Test>::Comment(VideoPostId::one()),
                video_reference: VideoId::one(),
            })
            .call_and_assert(Ok(()));

        EditPostTextFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_post_id(VideoPostId::from(2u64))
            .call_and_assert(Ok(()))
    })
}

#[test]
pub fn successful_post_update_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_comment();

        EditPostTextFixture::default().call_and_assert(Ok(()))
    })
}

#[test]
pub fn successful_post_update_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video_and_comment();

        let default_curator_group_id = Content::next_curator_group_id() - 1;
        EditPostTextFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .call_and_assert(Ok(()))
    })
}

// delete post tests
#[test]
pub fn unsuccessful_post_deletion_with_member_auth_failed() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_post();

        DeletePostFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()))
    })
}

#[test]
pub fn unsuccessful_post_deletion_with_curator_auth_failed() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video_and_post();

        let default_curator_group_id = Content::next_curator_group_id() - 1;
        DeletePostFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .call_and_assert(Err(Error::<Test>::CuratorAuthFailed.into()))
    })
}

#[test]
pub fn unsuccessful_post_deletion_with_lead_auth_failed() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video_and_post();

        increase_account_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        CreatePostFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_params(VideoPostCreationParameters::<Test> {
                post_type: VideoPostType::<Test>::Comment(VideoPostId::one()),
                video_reference: VideoId::one(),
            })
            .call_and_assert(Ok(()));

        DeletePostFixture::default()
            .with_sender(UNAUTHORIZED_LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_post_id(VideoPostId::from(2u64))
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()))
    })
}

#[test]
pub fn unsuccessful_post_deletion_with_invalid_post_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_post();

        DeletePostFixture::default()
            .with_post_id(VideoPostId::zero())
            .call_and_assert(Err(Error::<Test>::VideoPostDoesNotExist.into()))
    })
}

#[test]
pub fn unsuccessful_post_deletion_with_invalid_video_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_post();

        DeletePostFixture::default()
            .with_post_id(VideoPostId::zero())
            .call_and_assert(Err(Error::<Test>::VideoPostDoesNotExist.into()))
    })
}

#[test]
pub fn unsuccessful_post_deletion_by_member_not_channel_owner() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(UNAUTHORIZED_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_post();

        DeletePostFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(UNAUTHORIZED_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
pub fn unsuccessful_post_deletion_by_curator_not_channel_owner() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video_and_post();

        let unauthorized_curator_group_id = add_curator_to_new_group(UNAUTHORIZED_CURATOR_ID);
        EditPostTextFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                unauthorized_curator_group_id,
                UNAUTHORIZED_CURATOR_ID,
            ))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
pub fn unsuccessful_post_deletion_with_invalid_witness() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_comment();

        DeletePostFixture::default()
            .call_and_assert(Err(Error::<Test>::WitnessVerificationFailed.into()))
    })
}

#[test]
pub fn unsuccessful_post_deletion_with_no_witness() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_comment();

        DeletePostFixture::default()
            .with_params(VideoPostDeletionParameters::<Test> {
                witness: None,
                rationale: None,
            })
            .call_and_assert(Err(Error::<Test>::WitnessNotProvided.into()))
    })
}

#[test]
pub fn unsuccessful_comment_update_with_not_authorized_memeber() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_comment();

        DeletePostFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(UNAUTHORIZED_MEMBER_ID))
            .with_post_id(VideoPostId::from(2u64))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
pub fn unsuccessful_comment_deletion_by_not_authorized_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video_and_comment();

        let unauthorized_curator_group_id = add_curator_to_new_group(UNAUTHORIZED_CURATOR_ID);
        DeletePostFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                unauthorized_curator_group_id,
                UNAUTHORIZED_CURATOR_ID,
            ))
            .with_post_id(VideoPostId::from(2u64))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
pub fn unsuccessful_comment_deletion_with_lead_not_authorized() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video_and_comment();

        DeletePostFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_post_id(VideoPostId::from(2u64))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
pub fn unsuccessful_comment_deletion_by_invalid_moderator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_comment();

        DeletePostFixture::default()
            .with_sender(UNAUTHORIZED_MODERATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Member(UNAUTHORIZED_MODERATOR_ID))
            .with_post_id(VideoPostId::from(2u64))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
pub fn unsuccessful_comment_deletion_by_moderator_with_no_rationale() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_comment();

        DeletePostFixture::default()
            .with_sender(DEFAULT_MODERATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MODERATOR_ID))
            .with_params(VideoPostDeletionParameters::<Test> {
                witness: None,
                rationale: None,
            })
            .with_post_id(VideoPostId::from(2u64))
            .call_and_assert(Err(Error::<Test>::RationaleNotProvidedByModerator.into()))
    })
}

#[test]
pub fn successful_post_deletion_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_comment();

        DeletePostFixture::default()
            .with_params(VideoPostDeletionParameters::<Test> {
                witness: Some(<Test as frame_system::Trait>::Hashing::hash_of(
                    &VideoPostId::one(),
                )),
                rationale: None,
            })
            .call_and_assert(Ok(()))
    })
}

#[test]
pub fn unsuccessful_post_deletion_with_active_channel_transfer() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_comment();

        UpdateChannelTransferStatusFixture::default().call_and_assert(Ok(()));

        DeletePostFixture::default()
            .with_params(VideoPostDeletionParameters::<Test> {
                witness: Some(<Test as frame_system::Trait>::Hashing::hash_of(
                    &VideoPostId::one(),
                )),
                rationale: None,
            })
            .call_and_assert(Err(Error::<Test>::InvalidChannelTransferStatus.into()));
    })
}

#[test]
pub fn successful_post_deletion_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video_and_comment();

        let default_curator_group_id = Content::next_curator_group_id() - 1;
        DeletePostFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .with_params(VideoPostDeletionParameters::<Test> {
                witness: Some(<Test as frame_system::Trait>::Hashing::hash_of(
                    &VideoPostId::one(),
                )),
                rationale: None,
            })
            .call_and_assert(Ok(()))
    })
}

#[test]
pub fn successful_comment_deletion_by_member_owner() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_comment();

        DeletePostFixture::default()
            .with_post_id(VideoPostId::from(2u64))
            .with_params(VideoPostDeletionParameters::<Test> {
                witness: Some(<Test as frame_system::Trait>::Hashing::hash_of(
                    &VideoPostId::zero(),
                )),
                rationale: None,
            })
            .call_and_assert(Ok(()))
    })
}

#[test]
pub fn successful_comment_deletion_by_curator_onwer() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video_and_comment();

        let default_curator_group_id = Content::next_curator_group_id() - 1;
        DeletePostFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_post_id(VideoPostId::from(2u64))
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .with_params(VideoPostDeletionParameters::<Test> {
                witness: Some(<Test as frame_system::Trait>::Hashing::hash_of(
                    &VideoPostId::zero(),
                )),
                rationale: None,
            })
            .call_and_assert(Ok(()))
    })
}

#[test]
pub fn successful_comment_deletion_by_member_author() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel_with_video_and_post();

        CreatePostFixture::default()
            .with_params(VideoPostCreationParameters::<Test> {
                post_type: VideoPostType::<Test>::Comment(VideoPostId::one()),
                video_reference: VideoId::one(),
            })
            .call_and_assert(Ok(()));

        DeletePostFixture::default()
            .with_post_id(VideoPostId::from(2u64))
            .with_params(VideoPostDeletionParameters::<Test> {
                witness: Some(<Test as frame_system::Trait>::Hashing::hash_of(
                    &VideoPostId::zero(),
                )),
                rationale: None,
            })
            .call_and_assert(Ok(()))
    })
}

#[test]
pub fn successful_comment_deletion_by_curator_author() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_post();

        let default_curator_group_id = add_curator_to_new_group(DEFAULT_CURATOR_ID);

        CreatePostFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .with_params(VideoPostCreationParameters::<Test> {
                post_type: VideoPostType::<Test>::Comment(VideoPostId::one()),
                video_reference: VideoId::one(),
            })
            .call_and_assert(Ok(()));

        DeletePostFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_post_id(VideoPostId::from(2u64))
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .with_params(VideoPostDeletionParameters::<Test> {
                witness: Some(<Test as frame_system::Trait>::Hashing::hash_of(
                    &VideoPostId::zero(),
                )),
                rationale: None,
            })
            .call_and_assert(Ok(()))
    })
}

#[test]
pub fn successful_comment_deletion_by_lead_author() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_account_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_post();

        CreatePostFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_params(VideoPostCreationParameters::<Test> {
                post_type: VideoPostType::<Test>::Comment(VideoPostId::one()),
                video_reference: VideoId::one(),
            })
            .call_and_assert(Ok(()));

        DeletePostFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_post_id(VideoPostId::from(2u64))
            .with_actor(ContentActor::Lead)
            .with_params(VideoPostDeletionParameters::<Test> {
                witness: Some(<Test as frame_system::Trait>::Hashing::hash_of(
                    &VideoPostId::zero(),
                )),
                rationale: None,
            })
            .call_and_assert(Ok(()))
    })
}

#[test]
pub fn successful_comment_deletion_by_moderator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel_with_video_and_comment();

        DeletePostFixture::default()
            .with_sender(DEFAULT_MODERATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MODERATOR_ID))
            .with_post_id(VideoPostId::from(2u64))
            .with_params(VideoPostDeletionParameters::<Test> {
                witness: Some(<Test as frame_system::Trait>::Hashing::hash_of(
                    &VideoPostId::zero(),
                )),
                rationale: Some(b"rationale".to_vec()),
            })
            .call_and_assert(Ok(()))
    })
}

#[test]
pub fn unsuccessful_moderators_update_by_unauthorized_member() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateModeratorSetFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(UNAUTHORIZED_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
pub fn unsuccessful_moderators_update_by_unauthorized_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        let unauthorized_curator_group_id = add_curator_to_new_group(UNAUTHORIZED_CURATOR_ID);
        UpdateModeratorSetFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                unauthorized_curator_group_id,
                UNAUTHORIZED_CURATOR_ID,
            ))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
pub fn unsuccessful_moderators_update_with_member_auth_failed() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateModeratorSetFixture::default()
            .with_actor(ContentActor::Member(UNAUTHORIZED_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()))
    })
}

#[test]
pub fn unsuccessful_moderators_update_with_curator_auth_failed() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        let default_curator_group_id = Content::next_curator_group_id() - 1;
        UpdateModeratorSetFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .call_and_assert(Err(Error::<Test>::CuratorAuthFailed.into()))
    })
}

#[test]
pub fn unsuccessful_moderators_update_with_invalid_members_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateModeratorSetFixture::default()
            .with_moderators(vec![DEFAULT_MODERATOR_ID + 1].into_iter().collect())
            .call_and_assert(Err(Error::<Test>::InvalidMemberProvided.into()))
    })
}

#[test]
pub fn successful_moderators_update_by_member_owner() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateChannelTransferStatusFixture::default().call_and_assert(Ok(()));

        UpdateModeratorSetFixture::default().call_and_assert(Err(Error::<Test>::InvalidChannelTransferStatus.into()));
    })
}

#[test]
pub fn unsuccessful_moderators_update_with_pending_channel_transfer() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateModeratorSetFixture::default().call_and_assert(Ok(()));
    })
}

#[test]
pub fn successful_moderators_update_by_curator_owner() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        let default_curator_group_id = Content::next_curator_group_id() - 1;
        UpdateModeratorSetFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .call_and_assert(Ok(()));
    })
}

#[test]
pub fn unsuccessful_moderators_update_with_invalid_channel_id() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateModeratorSetFixture::default()
            .with_channel_id(ChannelId::zero())
            .call_and_assert(Err(Error::<Test>::ChannelDoesNotExist.into()))
    })
}

#[test]
pub fn unsuccessful_moderators_update_by_lead_with_member_owned_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_owned_channel();

        UpdateModeratorSetFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
pub fn successful_moderators_update_by_lead_with_curator_owned_channel() {
    with_default_mock_builder(|| {
        run_to_block(1);

        create_initial_storage_buckets_helper();
        increase_account_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_owned_channel();

        UpdateModeratorSetFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Ok(()))
    })
}
