#![cfg(test)]
use super::curators::add_curator_to_new_group;
use super::fixtures::*;
use super::mock::*;
use crate::*;

// create post tests
#[test]
pub fn unsuccessful_post_creation_with_member_auth_failed() {
    with_default_mock_builder(|| {
        increase_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_channel_with_video();

        CreatePostFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()))
    })
}

#[test]
pub fn unsuccessful_post_creation_with_curator_auth_failed() {
    with_default_mock_builder(|| {
        increase_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_channel_with_video();

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
        increase_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_channel_with_video();

        CreatePostFixture::default()
            .with_sender(UNAUTHORIZED_LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()))
    })
}

#[test]
pub fn unsuccessful_post_creation_with_insufficient_balance() {
    with_default_mock_builder(|| {
        create_default_member_channel_with_video();

        CreatePostFixture::default().call_and_assert(Err(Error::<Test>::InsufficientBalance.into()))
    })
}

#[test]
pub fn unsuccessful_post_creation_with_member_not_channel_owner() {
    with_default_mock_builder(|| {
        increase_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_channel_with_video();

        CreatePostFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(UNAUTHORIZED_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
pub fn unsuccessful_post_creation_with_curator_not_channel_owner() {
    with_default_mock_builder(|| {
        increase_balance_helper(UNAUTHORIZED_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_channel_with_video();

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
        increase_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_channel_with_video();

        CreatePostFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .call_and_assert(Err(Error::<Test>::ActorCannotOwnChannel.into()))
    })
}

#[test]
pub fn unsuccessful_post_creation_with_invalid_video_id() {
    with_default_mock_builder(|| {
        create_default_member_channel_with_video();

        CreatePostFixture::default()
            .with_params(PostCreationParameters::<Test> {
                post_type: PostType::<Test>::VideoPost,
                video_reference: VideoId::zero(),
            })
            .call_and_assert(Err(Error::<Test>::VideoDoesNotExist.into()))
    })
}

#[test]
pub fn unsuccessful_comment_creation_with_invalid_parent_id() {
    with_default_mock_builder(|| {
        run_to_block(1);
        increase_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_channel_with_video_and_post();

        CreatePostFixture::default()
            .with_params(PostCreationParameters::<Test> {
                post_type: PostType::<Test>::Comment(PostId::zero()),
                video_reference: VideoId::one(),
            })
            .call_and_assert(Err(Error::<Test>::PostDoesNotExist.into()))
    })
}

#[test]
pub fn successful_post_creation_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);
        increase_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_channel_with_video();

        CreatePostFixture::default().call_and_assert(Ok(()))
    })
}

#[test]
pub fn successful_post_creation_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);
        increase_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_channel_with_video();
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
        increase_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);

        // creating different post owner and comment owner
        create_default_curator_channel_with_video_and_post();

        println!("POST CREATED");
        CreatePostFixture::default()
            .with_params(PostCreationParameters::<Test> {
                post_type: PostType::<Test>::Comment(PostId::one()),
                video_reference: VideoId::one(),
            })
            .call_and_assert(Ok(()))
    })
}

#[test]
pub fn successful_comment_creation_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);
        increase_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);

        // creating different post owner and comment owner
        create_default_member_channel_with_video_and_post();

        let default_curator_group_id = add_curator_to_new_group(DEFAULT_CURATOR_ID);
        CreatePostFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .with_params(PostCreationParameters::<Test> {
                post_type: PostType::<Test>::Comment(PostId::one()),
                video_reference: VideoId::one(),
            })
            .call_and_assert(Ok(()))
    })
}

#[test]
pub fn successful_comment_creation_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);
        increase_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);

        // creating different post owner and comment owner
        create_default_member_channel_with_video_and_post();

        CreatePostFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_params(PostCreationParameters::<Test> {
                post_type: PostType::<Test>::Comment(PostId::one()),
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
        increase_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_channel_with_video_and_comment();

        EditPostTextFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()))
    })
}

#[test]
pub fn unsuccessful_post_update_with_curator_auth_failed() {
    with_default_mock_builder(|| {
        run_to_block(1);
        increase_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_channel_with_video_and_comment();

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
        increase_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_channel_with_video_and_post();

        increase_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        CreatePostFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_params(PostCreationParameters::<Test> {
                post_type: PostType::<Test>::Comment(PostId::one()),
                video_reference: VideoId::one(),
            })
            .call_and_assert(Ok(()));

        EditPostTextFixture::default()
            .with_sender(UNAUTHORIZED_LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_post_id(PostId::from(2u64))
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()))
    })
}

#[test]
pub fn unsuccessful_post_update_with_invalid_post_id() {
    with_default_mock_builder(|| {
        run_to_block(1);
        increase_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_channel_with_video_and_comment();

        EditPostTextFixture::default()
            .with_post_id(PostId::zero())
            .call_and_assert(Err(Error::<Test>::PostDoesNotExist.into()))
    })
}

#[test]
pub fn unsuccessful_post_update_with_invalid_video_id() {
    with_default_mock_builder(|| {
        run_to_block(1);
        increase_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_channel_with_video_and_comment();

        EditPostTextFixture::default()
            .with_video_id(PostId::zero())
            .call_and_assert(Err(Error::<Test>::PostDoesNotExist.into()))
    })
}

#[test]
pub fn unsuccessful_post_update_by_member_not_channel_owner() {
    with_default_mock_builder(|| {
        run_to_block(1);
        increase_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_balance_helper(UNAUTHORIZED_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_channel_with_video_and_comment();

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
        increase_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_channel_with_video_and_comment();

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
        increase_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        increase_balance_helper(UNAUTHORIZED_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_channel_with_video_and_comment();

        EditPostTextFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .with_post_id(PostId::from(2u64))
            .with_actor(ContentActor::Member(UNAUTHORIZED_MEMBER_ID))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
pub fn unsuccessful_comment_update_by_curator_not_author() {
    with_default_mock_builder(|| {
        run_to_block(1);
        increase_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        increase_balance_helper(UNAUTHORIZED_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_channel_with_video_and_comment();

        let unauthorized_curator_group_id = add_curator_to_new_group(UNAUTHORIZED_CURATOR_ID);
        EditPostTextFixture::default()
            .with_sender(UNAUTHORIZED_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                unauthorized_curator_group_id,
                UNAUTHORIZED_CURATOR_ID,
            ))
            .with_post_id(PostId::from(2u64))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
pub fn unsuccessful_comment_update_by_lead_not_author() {
    with_default_mock_builder(|| {
        run_to_block(1);
        increase_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        increase_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_channel_with_video_and_comment();

        EditPostTextFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_post_id(PostId::from(2u64))
            .call_and_assert(Err(Error::<Test>::ActorNotAuthorized.into()))
    })
}

#[test]
pub fn successful_comment_update_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);
        increase_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_channel_with_video_and_comment();

        EditPostTextFixture::default()
            .with_post_id(PostId::from(2u64))
            .call_and_assert(Ok(()))
    })
}

#[test]
pub fn successful_comment_update_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);
        increase_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_channel_with_video_and_comment();

        let default_curator_group_id = Content::next_curator_group_id() - 1;
        EditPostTextFixture::default()
            .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
            .with_actor(ContentActor::Curator(
                default_curator_group_id,
                DEFAULT_CURATOR_ID,
            ))
            .with_post_id(PostId::from(2u64))
            .call_and_assert(Ok(()))
    })
}

#[test]
pub fn successful_comment_update_by_lead() {
    with_default_mock_builder(|| {
        run_to_block(1);
        increase_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_channel_with_video_and_post();

        increase_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        CreatePostFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_params(PostCreationParameters::<Test> {
                post_type: PostType::<Test>::Comment(PostId::one()),
                video_reference: VideoId::one(),
            })
            .call_and_assert(Ok(()));

        EditPostTextFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_post_id(PostId::from(2u64))
            .call_and_assert(Ok(()))
    })
}

#[test]
pub fn successful_post_update_by_member() {
    with_default_mock_builder(|| {
        run_to_block(1);
        increase_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_channel_with_video_and_comment();

        EditPostTextFixture::default().call_and_assert(Ok(()))
    })
}

#[test]
pub fn successful_post_update_by_curator() {
    with_default_mock_builder(|| {
        run_to_block(1);
        increase_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_channel_with_video_and_comment();

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
        increase_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_channel_with_video_and_post();

        DeletePostFixture::default()
            .with_sender(UNAUTHORIZED_MEMBER_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::MemberAuthFailed.into()))
    })
}

#[test]
pub fn unsuccessful_post_deletion_with_curator_auth_failed() {
    with_default_mock_builder(|| {
        run_to_block(1);
        increase_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_channel_with_video_and_post();

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
        increase_balance_helper(DEFAULT_CURATOR_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_curator_channel_with_video_and_post();

        increase_balance_helper(LEAD_ACCOUNT_ID, INITIAL_BALANCE);
        CreatePostFixture::default()
            .with_sender(LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_params(PostCreationParameters::<Test> {
                post_type: PostType::<Test>::Comment(PostId::one()),
                video_reference: VideoId::one(),
            })
            .call_and_assert(Ok(()));

        DeletePostFixture::default()
            .with_sender(UNAUTHORIZED_LEAD_ACCOUNT_ID)
            .with_actor(ContentActor::Lead)
            .with_post_id(PostId::from(2u64))
            .call_and_assert(Err(Error::<Test>::LeadAuthFailed.into()))
    })
}

#[test]
pub fn unsuccessful_post_deletion_with_invalid_post_id() {
    with_default_mock_builder(|| {
        run_to_block(1);
        increase_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_channel_with_video_and_post();

        DeletePostFixture::default()
            .with_post_id(PostId::zero())
            .call_and_assert(Err(Error::<Test>::PostDoesNotExist.into()))
    })
}
#[test]
pub fn unsuccessful_post_deletion_with_invalid_video_id() {
    with_default_mock_builder(|| {
        run_to_block(1);
        increase_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_default_member_channel_with_video_and_post();

        DeletePostFixture::default()
            .with_post_id(PostId::zero())
            .call_and_assert(Err(Error::<Test>::PostDoesNotExist.into()))
    })
}
