use super::curators;
use super::mock::*;
use crate::*;
use core::cmp::min;
use frame_support::assert_ok;
use sp_runtime::DispatchError;

// type aliases
pub type AccountId = <Test as frame_system::Trait>::AccountId;
pub type VideoId = <Test as Trait>::VideoId;
pub type PostId = <Test as Trait>::PostId;
type MemberId = <Test as MembershipTypes>::MemberId;
type CuratorGroupId = <Test as ContentActorAuthenticator>::CuratorGroupId;
type CuratorId = <Test as ContentActorAuthenticator>::CuratorId;

// fixtures
pub struct CreatePostFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    params: PostCreationParameters<Test>,
}

impl CreatePostFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            params: PostCreationParameters::<Test> {
                post_type: PostType::<Test>::VideoPost,
                video_reference: VideoId::one(),
            },
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn with_params(self, params: PostCreationParameters<Test>) -> Self {
        Self { params, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender.clone());
        let initial_bloat_bond = Content::compute_initial_bloat_bond();
        let post_id = Content::next_post_id();
        let balance_pre = Balances::<Test>::usable_balance(&self.sender);
        let replies_count_pre = match &self.params.post_type {
            PostType::<Test>::Comment(parent_id) => {
                Content::ensure_post_exists(self.params.video_reference, parent_id.clone())
                    .map_or(PostId::zero(), |p| p.replies_count)
            }
            PostType::<Test>::VideoPost => PostId::zero(),
        };
        let video_pre = Content::video_by_id(&self.params.video_reference);

        let actual_result = Content::create_post(origin, self.actor.clone(), self.params.clone());

        let balance_post = Balances::<Test>::usable_balance(&self.sender);
        let replies_count_post = match &self.params.post_type {
            PostType::<Test>::Comment(parent_id) => {
                Content::ensure_post_exists(self.params.video_reference, *parent_id)
                    .map_or(PostId::zero(), |p| p.replies_count)
            }
            PostType::<Test>::VideoPost => PostId::zero(),
        };
        let video_post = Content::video_by_id(&self.params.video_reference);

        assert_eq!(actual_result, expected_result);

        match actual_result {
            Ok(()) => {
                assert_eq!(balance_pre, initial_bloat_bond.saturating_add(balance_post));
                assert_eq!(post_id.saturating_add(One::one()), Content::next_post_id());
                match &self.params.post_type {
                    PostType::<Test>::VideoPost => {
                        assert_eq!(Some(post_id), video_post.video_post_id);
                    }
                    PostType::<Test>::Comment(parent_id) => {
                        assert_eq!(
                            replies_count_post,
                            replies_count_pre.saturating_add(One::one())
                        );
                    }
                }

                assert_eq!(
                    System::events().last().unwrap().event,
                    MetaEvent::content(RawEvent::PostCreated(
                        Post::<Test> {
                            author: self.actor.clone(),
                            bloat_bond: initial_bloat_bond,
                            replies_count: PostId::zero(),
                            video_reference: self.params.video_reference,
                            post_type: self.params.post_type.clone(),
                        },
                        post_id,
                    ))
                );
            }
            Err(_) => {
                assert_eq!(balance_pre, balance_post);
                assert_eq!(post_id, Content::next_post_id());
                match &self.params.post_type {
                    PostType::<Test>::VideoPost => {
                        assert_eq!(video_pre, video_post);
                    }
                    PostType::<Test>::Comment(_) => {
                        assert_eq!(replies_count_post, replies_count_pre);
                    }
                }
            }
        }
    }
}

pub struct EditPostTextFixture {
    sender: AccountId,
    video_id: VideoId,
    post_id: PostId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    new_text: Vec<u8>,
}

impl EditPostTextFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            video_id: VideoId::one(),
            post_id: PostId::one(),
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            new_text: b"sample text".to_vec(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_video_id(self, video_id: VideoId) -> Self {
        Self { video_id, ..self }
    }

    pub fn with_post_id(self, post_id: PostId) -> Self {
        Self { post_id, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender.clone());

        let actual_result = Content::edit_post_text(
            origin,
            self.video_id,
            self.post_id,
            self.actor.clone(),
            self.new_text.clone(),
        );

        assert_eq!(actual_result, expected_result);
        if actual_result.is_ok() {
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::PostTextUpdated(
                    self.actor,
                    self.new_text.clone(),
                    self.post_id,
                    self.video_id,
                ))
            );
        }
    }
}

pub struct DeletePostFixture {
    sender: AccountId,
    post_id: PostId,
    video_id: VideoId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    params: PostDeletionParameters<Test>,
}

impl DeletePostFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            post_id: PostId::one(),
            video_id: VideoId::one(),
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            params: PostDeletionParameters::<Test> {
                witness: Some(<Test as frame_system::Trait>::Hashing::hash_of(
                    &PostId::zero(),
                )),
                rationale: Some(b"rationale".to_vec()),
            },
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_video_id(self, video_id: VideoId) -> Self {
        Self { video_id, ..self }
    }

    pub fn with_post_id(self, post_id: PostId) -> Self {
        Self { post_id, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn with_params(self, params: PostDeletionParameters<Test>) -> Self {
        Self { params, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);
        let balance_pre = Balances::<Test>::usable_balance(&self.sender);
        let initial_bloat_bond = Content::compute_initial_bloat_bond();
        let post = Content::post_by_id(&self.video_id, &self.post_id);
        let thread_size = PostById::<Test>::iter_prefix(&self.video_id).count();
        let replies_count_pre = match &post.post_type {
            PostType::<Test>::Comment(parent_id) => {
                Content::ensure_post_exists(self.video_id, *parent_id)
                    .map_or(PostId::zero(), |p| p.replies_count)
            }
            PostType::<Test>::VideoPost => PostId::zero(),
        };

        let actual_result = Content::delete_post(
            origin,
            self.post_id,
            self.video_id,
            self.actor.clone(),
            self.params.clone(),
        );

        let balance_post = Balances::<Test>::usable_balance(&self.sender);

        assert_eq!(actual_result, expected_result);

        match actual_result {
            Ok(()) => {
                if post.author == self.actor.clone() {
                    let cap = BalanceOf::<Test>::from(BloatBondCap::get());
                    assert!(
                        balance_post.saturating_sub(balance_pre) >= min(initial_bloat_bond, cap)
                    )
                } else {
                    assert_eq!(balance_post, balance_pre)
                };
                assert!(!PostById::<Test>::contains_key(
                    &self.video_id,
                    &self.post_id
                ));
                match &post.post_type {
                    PostType::<Test>::VideoPost => assert_eq!(
                        PostById::<Test>::iter_prefix(&self.video_id).count(),
                        0usize,
                    ),
                    PostType::<Test>::Comment(parent_id) => {
                        let replies_count_post =
                            Content::ensure_post_exists(self.video_id, *parent_id)
                                .map_or(PostId::zero(), |p| p.replies_count);
                        assert_eq!(
                            replies_count_pre,
                            replies_count_post.saturating_add(PostId::one())
                        )
                    }
                };
                assert_eq!(
                    System::events().last().unwrap().event,
                    MetaEvent::content(RawEvent::PostDeleted(post, self.post_id, self.actor))
                );
            }
            Err(err) => {
                assert_eq!(balance_pre, balance_post);
                if let DispatchError::Module {
                    message: Some(error_msg),
                    ..
                } = err
                {
                    match error_msg {
                        "PostDoesntExist" => (),
                        _ => {
                            assert_eq!(Content::post_by_id(&self.video_id, &self.post_id), post);
                            match &post.post_type {
                                PostType::<Test>::Comment(parent_id) => {
                                    let replies_count_post =
                                        Content::ensure_post_exists(self.video_id, *parent_id)
                                            .map_or(PostId::zero(), |p| p.replies_count);
                                    assert_eq!(replies_count_pre, replies_count_post);
                                }
                                PostType::<Test>::VideoPost => assert_eq!(
                                    PostById::<Test>::iter_prefix(&self.video_id).count(),
                                    thread_size,
                                ),
                            }
                        }
                    }
                }
            }
        }
    }
}

// helpers
pub fn create_default_member_channel_with_video() {
    assert_ok!(Content::create_channel(
        Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
        ContentActor::Member(DEFAULT_MEMBER_ID),
        ChannelCreationParameters::<Test> {
            assets: vec![],
            meta: vec![],
            reward_account: None,
            moderator_set: vec![DEFAULT_MODERATOR_ID]
                .into_iter()
                .collect::<BTreeSet<_>>(),
        }
    ));

    assert_ok!(Content::create_video(
        Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
        ContentActor::Member(DEFAULT_MEMBER_ID),
        ChannelId::one(),
        VideoCreationParameters {
            assets: vec![],
            meta: vec![],
            enable_comments: true,
        }
    ));
}

pub fn create_default_curator_channel_with_video() {
    let default_curator_group = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
    assert_ok!(Content::create_channel(
        Origin::signed(DEFAULT_CURATOR_ACCOUNT_ID),
        ContentActor::Curator(default_curator_group, DEFAULT_CURATOR_ID),
        ChannelCreationParameters::<Test> {
            assets: vec![],
            meta: vec![],
            reward_account: None,
            moderator_set: vec![DEFAULT_MODERATOR_ID]
                .into_iter()
                .collect::<BTreeSet<_>>(),
        }
    ));

    assert_ok!(Content::create_video(
        Origin::signed(DEFAULT_CURATOR_ACCOUNT_ID),
        ContentActor::Curator(default_curator_group, DEFAULT_CURATOR_ID),
        ChannelId::one(),
        VideoCreationParameters {
            assets: vec![],
            meta: vec![],
            enable_comments: true,
        }
    ));
}

pub fn create_default_member_channel_with_video_and_post() {
    create_default_member_channel_with_video();
    CreatePostFixture::default().call_and_assert(Ok(()));
}

pub fn create_default_curator_channel_with_video_and_post() {
    create_default_curator_channel_with_video();
    let default_curator_group_id = Content::next_curator_group_id() - 1;
    CreatePostFixture::default()
        .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
        .with_actor(ContentActor::Curator(
            default_curator_group_id,
            DEFAULT_CURATOR_ID,
        ))
        .call_and_assert(Ok(()));
}

pub fn create_default_member_channel_with_video_and_comment() {
    create_default_member_channel_with_video_and_post();
    CreatePostFixture::default()
        .with_params(PostCreationParameters::<Test> {
            post_type: PostType::<Test>::Comment(PostId::one()),
            video_reference: VideoId::one(),
        })
        .call_and_assert(Ok(()));
}

pub fn create_default_curator_channel_with_video_and_comment() {
    create_default_curator_channel_with_video_and_post();
    let default_curator_group_id = Content::next_curator_group_id() - 1;
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
        .call_and_assert(Ok(()));
}

pub fn increase_balance_helper(account: AccountId, amount: BalanceOf<Test>) {
    let _ = Balances::<Test>::deposit_creating(&account, amount);
}
