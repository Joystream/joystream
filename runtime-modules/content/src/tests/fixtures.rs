use super::curators;
use super::mock::*;
use crate::*;
use frame_support::assert_ok;
use frame_support::traits::Currency;
use frame_system::RawOrigin;
use sp_std::cmp::min;
use sp_std::iter::{IntoIterator, Iterator};

// Index which indentifies the item in the commitment set we want the proof for
pub const DEFAULT_PROOF_INDEX: usize = 1;

// fixtures
pub struct CreateChannelFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    params: ChannelCreationParameters<Test>,
}

impl CreateChannelFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            params: ChannelCreationParameters::<Test> {
                assets: None,
                meta: None,
                reward_account: None,
                collaborators: BTreeSet::new(),
                moderators: BTreeSet::new(),
            },
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn with_assets(self, assets: StorageAssets<Test>) -> Self {
        Self {
            params: ChannelCreationParameters::<Test> {
                assets: Some(assets),
                ..self.params
            },
            ..self
        }
    }

    pub fn with_collaborators(self, collaborators: BTreeSet<MemberId>) -> Self {
        Self {
            params: ChannelCreationParameters::<Test> {
                collaborators: collaborators,
                ..self.params
            },
            ..self
        }
    }

    pub fn with_moderators(self, moderators: BTreeSet<MemberId>) -> Self {
        Self {
            params: ChannelCreationParameters::<Test> {
                moderators,
                ..self.params
            },
            ..self
        }
    }

    pub fn with_reward_account(self, reward_account: AccountId) -> Self {
        Self {
            params: ChannelCreationParameters::<Test> {
                reward_account: Some(reward_account),
                ..self.params
            },
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender.clone());
        let balance_pre = Balances::<Test>::usable_balance(self.sender);
        let channel_id = Content::next_channel_id();
        let channel_bag_id = Content::bag_id_for_channel(&channel_id);
        let beg_obj_id = storage::NextDataObjectId::<Test>::get();
        let actual_result =
            Content::create_channel(origin, self.actor.clone(), self.params.clone());
        let end_obj_id = storage::NextDataObjectId::<Test>::get();

        assert_eq!(actual_result, expected_result);

        let balance_post = Balances::<Test>::usable_balance(self.sender);

        if actual_result.is_ok() {
            // ensure channel is on chain
            assert!(ChannelById::<Test>::contains_key(&channel_id));

            // channel counter increased
            assert_eq!(
                Content::next_channel_id(),
                channel_id.saturating_add(One::one())
            );

            // dynamic bag for channel is created
            assert_ok!(Storage::<Test>::ensure_bag_exists(&channel_bag_id));

            // event correctly deposited
            let owner = actor_to_channel_owner::<Test>(&self.actor).unwrap();
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::ChannelCreated(
                    self.actor.clone(),
                    channel_id,
                    Channel::<Test> {
                        owner: owner,
                        is_censored: false,
                        reward_account: self.params.reward_account.clone(),
                        collaborators: self.params.collaborators.clone(),
                        moderators: self.params.moderators.clone(),
                        num_videos: Zero::zero(),
                        cumulative_payout_earned: Zero::zero(),
                        transfer_status: Default::default(),
                    },
                    self.params.clone(),
                ))
            );

            if let Some(assets) = self.params.assets.as_ref() {
                // balance accounting is correct
                let bag_deletion_prize = BalanceOf::<Test>::zero();
                let objects_deletion_prize =
                    assets
                        .object_creation_list
                        .iter()
                        .fold(BalanceOf::<Test>::zero(), |acc, _| {
                            acc.saturating_add(
                                <Test as storage::Trait>::DataObjectDeletionPrize::get(),
                            )
                        });

                assert_eq!(
                    balance_pre.saturating_sub(balance_post),
                    bag_deletion_prize.saturating_add(objects_deletion_prize),
                );

                assert!((beg_obj_id..end_obj_id).all(|id| {
                    storage::DataObjectsById::<Test>::contains_key(&channel_bag_id, id)
                }));
            }
        } else {
            assert_eq!(balance_post, balance_pre);
            assert_eq!(beg_obj_id, end_obj_id);
            assert!(!storage::Bags::<Test>::contains_key(&channel_bag_id));
            assert!(!ChannelById::<Test>::contains_key(&channel_id));
            assert_eq!(NextChannelId::<Test>::get(), channel_id);
        }
    }
}

pub struct CreateVideoFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    params: VideoCreationParameters<Test>,
    channel_id: ChannelId,
}

impl CreateVideoFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ACCOUNT_ID),
            params: VideoCreationParameters::<Test> {
                assets: None,
                meta: None,
                enable_comments: true,
                auto_issue_nft: None,
            },
            channel_id: ChannelId::one(), // channel index starts at 1
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_channel_id(self, channel_id: ChannelId) -> Self {
        Self { channel_id, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn with_assets(self, assets: StorageAssets<Test>) -> Self {
        Self {
            params: VideoCreationParameters::<Test> {
                assets: Some(assets),
                ..self.params
            },
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender.clone());
        let balance_pre = Balances::<Test>::usable_balance(self.sender);
        let channel_bag_id = Content::bag_id_for_channel(&self.channel_id);
        let video_id = Content::next_video_id();
        let beg_obj_id = storage::NextDataObjectId::<Test>::get();

        let actual_result = Content::create_video(
            origin,
            self.actor.clone(),
            self.channel_id,
            self.params.clone(),
        );

        let balance_post = Balances::<Test>::usable_balance(self.sender);
        let end_obj_id = storage::NextDataObjectId::<Test>::get();

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert!(VideoById::<Test>::contains_key(&video_id));

            assert_eq!(
                Content::next_video_id(),
                video_id.saturating_add(One::one())
            );

            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::VideoCreated(
                    self.actor,
                    self.channel_id,
                    video_id,
                    self.params.clone(),
                ))
            );

            if let Some(assets) = self.params.assets.as_ref() {
                // balance accounting is correct
                let bag_deletion_prize = BalanceOf::<Test>::zero();
                let objects_deletion_prize =
                    assets
                        .object_creation_list
                        .iter()
                        .fold(BalanceOf::<Test>::zero(), |acc, _| {
                            acc.saturating_add(
                                <Test as storage::Trait>::DataObjectDeletionPrize::get(),
                            )
                        });

                assert_eq!(
                    balance_pre.saturating_sub(balance_post),
                    bag_deletion_prize.saturating_add(objects_deletion_prize),
                );

                assert!((beg_obj_id..end_obj_id).all(|id| {
                    storage::DataObjectsById::<Test>::contains_key(&channel_bag_id, id)
                }));
            }
        } else {
            assert!(!VideoById::<Test>::contains_key(&video_id));

            assert_eq!(Content::next_video_id(), video_id);

            if self.params.assets.is_some() {
                assert_eq!(balance_pre, balance_post,);

                assert!(!(beg_obj_id..end_obj_id).any(|id| {
                    storage::DataObjectsById::<Test>::contains_key(&channel_bag_id, id)
                }));
            }
        }
    }
}

pub struct UpdateChannelFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: ChannelId,
    params: ChannelUpdateParameters<Test>,
}

impl UpdateChannelFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ACCOUNT_ID),
            channel_id: ChannelId::one(), // channel index starts at 1
            params: ChannelUpdateParameters::<Test> {
                assets_to_upload: None,
                new_meta: None,
                reward_account: None,
                assets_to_remove: BTreeSet::new(),
                collaborators: None,
            },
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn with_channel_id(self, channel_id: ChannelId) -> Self {
        Self { channel_id, ..self }
    }

    pub fn with_assets_to_upload(self, assets: StorageAssets<Test>) -> Self {
        Self {
            params: ChannelUpdateParameters::<Test> {
                assets_to_upload: Some(assets),
                ..self.params
            },
            ..self
        }
    }

    pub fn with_assets_to_remove(self, assets: BTreeSet<DataObjectId<Test>>) -> Self {
        Self {
            params: ChannelUpdateParameters::<Test> {
                assets_to_remove: assets,
                ..self.params
            },
            ..self
        }
    }

    pub fn with_collaborators(self, collaborators: BTreeSet<MemberId>) -> Self {
        Self {
            params: ChannelUpdateParameters::<Test> {
                collaborators: Some(collaborators),
                ..self.params
            },
            ..self
        }
    }

    pub fn with_reward_account(self, reward_account: Option<Option<AccountId>>) -> Self {
        Self {
            params: ChannelUpdateParameters::<Test> {
                reward_account,
                ..self.params
            },
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender.clone());
        let balance_pre = Balances::<Test>::usable_balance(self.sender);
        let channel_pre = Content::channel_by_id(&self.channel_id);
        let bag_id_for_channel = Content::bag_id_for_channel(&self.channel_id);

        let deletion_prize_deposited =
            self.params
                .assets_to_upload
                .as_ref()
                .map_or(BalanceOf::<Test>::zero(), |assets| {
                    assets
                        .object_creation_list
                        .iter()
                        .fold(BalanceOf::<Test>::zero(), |acc, _| {
                            acc.saturating_add(
                                <Test as storage::Trait>::DataObjectDeletionPrize::get(),
                            )
                        })
                });

        let deletion_prize_withdrawn = if !self.params.assets_to_remove.is_empty() {
            self.params
                .assets_to_remove
                .iter()
                .fold(BalanceOf::<Test>::zero(), |acc, id| {
                    acc + storage::DataObjectsById::<Test>::get(&bag_id_for_channel, id)
                        .deletion_prize
                })
        } else {
            BalanceOf::<Test>::zero()
        };

        let beg_obj_id = storage::NextDataObjectId::<Test>::get();

        let actual_result = Content::update_channel(
            origin,
            self.actor.clone(),
            self.channel_id,
            self.params.clone(),
        );

        let channel_post = Content::channel_by_id(&self.channel_id);
        let end_obj_id = storage::NextDataObjectId::<Test>::get();
        let balance_post = Balances::<Test>::usable_balance(self.sender);

        assert_eq!(actual_result, expected_result);

        match actual_result {
            Ok(()) => {
                let owner = channel_post.owner.clone();
                assert_eq!(
                    System::events().last().unwrap().event,
                    MetaEvent::content(RawEvent::ChannelUpdated(
                        self.actor.clone(),
                        self.channel_id,
                        ChannelRecord {
                            owner,
                            is_censored: channel_pre.is_censored,
                            reward_account: self
                                .params
                                .reward_account
                                .clone()
                                .unwrap_or(channel_pre.reward_account),
                            collaborators: self
                                .params
                                .collaborators
                                .clone()
                                .unwrap_or(channel_pre.collaborators),
                            num_videos: channel_pre.num_videos,
                            moderators: channel_pre.moderators,
                            cumulative_payout_earned: BalanceOf::<Test>::zero(),
                            transfer_status: Default::default(),
                        },
                        self.params.clone(),
                    ))
                );

                assert_eq!(
                    balance_post.saturating_sub(balance_pre),
                    deletion_prize_withdrawn.saturating_sub(deletion_prize_deposited),
                );

                if self.params.assets_to_upload.is_some() {
                    assert!((beg_obj_id..end_obj_id).all(|id| {
                        storage::DataObjectsById::<Test>::contains_key(&bag_id_for_channel, id)
                    }));
                }

                assert!(!self.params.assets_to_remove.iter().any(|id| {
                    storage::DataObjectsById::<Test>::contains_key(&bag_id_for_channel, id)
                }));
            }
            Err(err) => {
                assert_eq!(channel_pre, channel_post);
                assert_eq!(balance_pre, balance_post);
                assert_eq!(beg_obj_id, end_obj_id);

                if err != storage::Error::<Test>::DataObjectDoesntExist.into() {
                    assert!(self.params.assets_to_remove.iter().all(|id| {
                        storage::DataObjectsById::<Test>::contains_key(&bag_id_for_channel, id)
                    }))
                }
            }
        }
    }
}

pub struct UpdateVideoFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    video_id: VideoId,
    params: VideoUpdateParameters<Test>,
}

impl UpdateVideoFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id: VideoId::one(),
            params: VideoUpdateParameters::<Test> {
                assets_to_upload: None,
                assets_to_remove: BTreeSet::new(),
                enable_comments: None,
                new_meta: None,
            },
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn with_video_id(self, video_id: VideoId) -> Self {
        Self { video_id, ..self }
    }

    pub fn with_assets_to_upload(self, assets: StorageAssets<Test>) -> Self {
        Self {
            params: VideoUpdateParameters::<Test> {
                assets_to_upload: Some(assets),
                ..self.params
            },
            ..self
        }
    }

    pub fn with_assets_to_remove(self, assets: BTreeSet<DataObjectId<Test>>) -> Self {
        Self {
            params: VideoUpdateParameters::<Test> {
                assets_to_remove: assets,
                ..self.params
            },
            ..self
        }
    }
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender.clone());
        let balance_pre = Balances::<Test>::usable_balance(self.sender);
        let video_pre = Content::video_by_id(&self.video_id);
        let bag_id_for_channel = Content::bag_id_for_channel(&video_pre.in_channel);
        let beg_obj_id = storage::NextDataObjectId::<Test>::get();

        let deletion_prize_deposited =
            self.params
                .assets_to_upload
                .as_ref()
                .map_or(BalanceOf::<Test>::zero(), |assets| {
                    assets
                        .object_creation_list
                        .iter()
                        .fold(BalanceOf::<Test>::zero(), |acc, _| {
                            acc.saturating_add(
                                <Test as storage::Trait>::DataObjectDeletionPrize::get(),
                            )
                        })
                });

        let deletion_prize_withdrawn = if !self.params.assets_to_remove.is_empty() {
            self.params
                .assets_to_remove
                .iter()
                .fold(BalanceOf::<Test>::zero(), |acc, obj_id| {
                    acc + storage::DataObjectsById::<Test>::get(&bag_id_for_channel, obj_id)
                        .deletion_prize
                })
        } else {
            BalanceOf::<Test>::zero()
        };

        let actual_result = Content::update_video(
            origin,
            self.actor.clone(),
            self.video_id,
            self.params.clone(),
        );

        let end_obj_id = storage::NextDataObjectId::<Test>::get();
        let balance_post = Balances::<Test>::usable_balance(self.sender);
        let video_post = Content::video_by_id(&self.video_id);

        assert_eq!(actual_result, expected_result);

        match actual_result {
            Ok(()) => {
                assert_eq!(
                    System::events().last().unwrap().event,
                    MetaEvent::content(RawEvent::VideoUpdated(
                        self.actor.clone(),
                        self.video_id,
                        self.params.clone()
                    ))
                );

                assert_eq!(
                    balance_post.saturating_sub(balance_pre),
                    deletion_prize_withdrawn.saturating_sub(deletion_prize_deposited),
                );

                if self.params.assets_to_upload.is_some() {
                    assert!((beg_obj_id..end_obj_id).all(|id| {
                        storage::DataObjectsById::<Test>::contains_key(&bag_id_for_channel, id)
                    }));
                }

                assert!(!self.params.assets_to_remove.iter().any(|obj_id| {
                    storage::DataObjectsById::<Test>::contains_key(&bag_id_for_channel, obj_id)
                }));
            }
            Err(err) => {
                assert_eq!(video_pre, video_post);
                assert_eq!(balance_pre, balance_post);
                assert_eq!(beg_obj_id, end_obj_id);

                if err != storage::Error::<Test>::DataObjectDoesntExist.into() {
                    assert!(self.params.assets_to_remove.iter().all(|id| {
                        storage::DataObjectsById::<Test>::contains_key(&bag_id_for_channel, id)
                    }));
                }
            }
        }
    }
}

pub struct DeleteChannelFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: ChannelId,
    num_objects_to_delete: u64,
}

impl DeleteChannelFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            channel_id: ChannelId::one(),
            num_objects_to_delete: DATA_OBJECTS_NUMBER as u64,
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn with_num_objects_to_delete(self, num_objects_to_delete: u64) -> Self {
        Self {
            num_objects_to_delete,
            ..self
        }
    }

    pub fn with_channel_id(self, channel_id: ChannelId) -> Self {
        Self { channel_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender.clone());
        let balance_pre = Balances::<Test>::usable_balance(self.sender);
        let bag_id_for_channel = Content::bag_id_for_channel(&self.channel_id);
        let bag_deletion_prize = storage::Bags::<Test>::get(&bag_id_for_channel)
            .deletion_prize
            .unwrap_or(BalanceOf::<Test>::zero());
        let objects_deletion_prize =
            storage::DataObjectsById::<Test>::iter_prefix(&bag_id_for_channel)
                .fold(BalanceOf::<Test>::zero(), |acc, (_, obj)| {
                    acc + obj.deletion_prize
                });

        let channel_objects_ids =
            storage::DataObjectsById::<Test>::iter_prefix(&bag_id_for_channel)
                .map(|(id, _)| id)
                .collect::<BTreeSet<_>>();

        let actual_result = Content::delete_channel(
            origin,
            self.actor.clone(),
            self.channel_id,
            self.num_objects_to_delete,
        );

        let balance_post = Balances::<Test>::usable_balance(self.sender);
        assert_eq!(actual_result, expected_result);

        match actual_result {
            Ok(()) => {
                assert_eq!(
                    System::events().last().unwrap().event,
                    MetaEvent::content(RawEvent::ChannelDeleted(
                        self.actor.clone(),
                        self.channel_id,
                    ))
                );

                let deletion_prize = bag_deletion_prize.saturating_add(objects_deletion_prize);

                assert_eq!(balance_post.saturating_sub(balance_pre), deletion_prize,);
                assert!(!<ChannelById<Test>>::contains_key(&self.channel_id));
                assert!(!channel_objects_ids.iter().any(|id| {
                    storage::DataObjectsById::<Test>::contains_key(&bag_id_for_channel, id)
                }));
                assert!(!storage::Bags::<Test>::contains_key(&bag_id_for_channel));
            }

            Err(err) => {
                assert_eq!(balance_pre, balance_post);
                if err != Error::<Test>::ChannelDoesNotExist.into() {
                    assert!(ChannelById::<Test>::contains_key(&self.channel_id));
                    assert!(channel_objects_ids.iter().all(|id| {
                        storage::DataObjectsById::<Test>::contains_key(&bag_id_for_channel, id)
                    }));
                    assert!(storage::Bags::<Test>::contains_key(&bag_id_for_channel));
                }
            }
        }
    }
}

pub struct CreatePostFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    params: VideoPostCreationParameters<Test>,
}

impl CreatePostFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            params: VideoPostCreationParameters::<Test> {
                post_type: VideoPostType::<Test>::Description,
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

    pub fn with_params(self, params: VideoPostCreationParameters<Test>) -> Self {
        Self { params, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender.clone());
        let initial_bloat_bond = Content::compute_initial_bloat_bond();
        let post_id = Content::next_video_post_id();
        let balance_pre = Balances::<Test>::usable_balance(&self.sender);
        let replies_count_pre = match &self.params.post_type {
            VideoPostType::<Test>::Comment(parent_id) => {
                Content::ensure_post_exists(self.params.video_reference, parent_id.clone())
                    .map_or(VideoPostId::zero(), |p| p.replies_count)
            }
            VideoPostType::<Test>::Description => VideoPostId::zero(),
        };
        let video_pre = Content::video_by_id(&self.params.video_reference);

        let actual_result = Content::create_post(origin, self.actor.clone(), self.params.clone());

        let balance_post = Balances::<Test>::usable_balance(&self.sender);
        let replies_count_post = match &self.params.post_type {
            VideoPostType::<Test>::Comment(parent_id) => {
                Content::ensure_post_exists(self.params.video_reference, *parent_id)
                    .map_or(VideoPostId::zero(), |p| p.replies_count)
            }
            VideoPostType::<Test>::Description => VideoPostId::zero(),
        };
        let video_post = Content::video_by_id(&self.params.video_reference);

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(balance_pre, initial_bloat_bond.saturating_add(balance_post));
            assert_eq!(
                post_id.saturating_add(One::one()),
                Content::next_video_post_id()
            );
            match &self.params.post_type {
                VideoPostType::<Test>::Description => {
                    assert_eq!(Some(post_id), video_post.video_post_id);
                }
                VideoPostType::<Test>::Comment(_) => {
                    assert_eq!(
                        replies_count_post,
                        replies_count_pre.saturating_add(One::one())
                    );
                }
            }

            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::VideoPostCreated(
                    VideoPost::<Test> {
                        author: self.actor.clone(),
                        bloat_bond: initial_bloat_bond,
                        replies_count: VideoPostId::zero(),
                        video_reference: self.params.video_reference,
                        post_type: self.params.post_type.clone(),
                    },
                    post_id,
                ))
            );
        } else {
            assert_eq!(balance_pre, balance_post);
            assert_eq!(post_id, Content::next_video_post_id());
            match &self.params.post_type {
                VideoPostType::<Test>::Description => {
                    assert_eq!(video_pre, video_post);
                }
                VideoPostType::<Test>::Comment(_) => {
                    assert_eq!(replies_count_post, replies_count_pre);
                }
            }
        }
    }
}

pub struct EditPostTextFixture {
    sender: AccountId,
    video_id: VideoId,
    post_id: VideoPostId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    new_text: Vec<u8>,
}

impl EditPostTextFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            video_id: VideoId::one(),
            post_id: VideoPostId::one(),
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            new_text: b"sample text".to_vec(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_post_id(self, post_id: VideoPostId) -> Self {
        Self { post_id, ..self }
    }

    pub fn with_video_id(self, video_id: VideoId) -> Self {
        Self { video_id, ..self }
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
                MetaEvent::content(RawEvent::VideoPostTextUpdated(
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
    post_id: VideoPostId,
    video_id: VideoId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    params: VideoPostDeletionParameters<Test>,
}

impl DeletePostFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            post_id: VideoPostId::one(),
            video_id: VideoId::one(),
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            params: VideoPostDeletionParameters::<Test> {
                witness: Some(Hashing::hash_of(&VideoPostId::zero())),
                rationale: Some(b"rationale".to_vec()),
            },
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_post_id(self, post_id: VideoPostId) -> Self {
        Self { post_id, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn with_params(self, params: VideoPostDeletionParameters<Test>) -> Self {
        Self { params, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);
        let balance_pre = Balances::<Test>::usable_balance(&self.sender);
        let initial_bloat_bond = Content::compute_initial_bloat_bond();
        let post = Content::video_post_by_id(&self.video_id, &self.post_id);
        let thread_size = VideoPostById::<Test>::iter_prefix(&self.video_id).count();
        let replies_count_pre = match &post.post_type {
            VideoPostType::<Test>::Comment(parent_id) => {
                Content::ensure_post_exists(self.video_id, *parent_id)
                    .map_or(VideoPostId::zero(), |p| p.replies_count)
            }
            VideoPostType::<Test>::Description => VideoPostId::zero(),
        };

        let actual_result = Content::delete_post(
            origin,
            self.post_id,
            self.video_id,
            self.actor.clone(),
            self.params.clone(),
        );

        assert_eq!(actual_result, expected_result);

        let balance_post = Balances::<Test>::usable_balance(&self.sender);
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
                assert!(!VideoPostById::<Test>::contains_key(
                    &self.video_id,
                    &self.post_id
                ));
                match &post.post_type {
                    VideoPostType::<Test>::Description => assert_eq!(
                        VideoPostById::<Test>::iter_prefix(&self.video_id).count(),
                        0usize,
                    ),
                    VideoPostType::<Test>::Comment(parent_id) => {
                        let replies_count_post =
                            Content::ensure_post_exists(self.video_id, *parent_id)
                                .map_or(VideoPostId::zero(), |p| p.replies_count);
                        assert_eq!(
                            replies_count_pre,
                            replies_count_post.saturating_add(VideoPostId::one())
                        )
                    }
                };
                assert_eq!(
                    System::events().last().unwrap().event,
                    MetaEvent::content(RawEvent::VideoPostDeleted(post, self.post_id, self.actor))
                );
            }
            Err(err) => {
                assert_eq!(balance_pre, balance_post);
                if err != Error::<Test>::VideoPostDoesNotExist.into() {
                    assert_eq!(
                        Content::video_post_by_id(&self.video_id, &self.post_id),
                        post
                    );
                    match &post.post_type {
                        VideoPostType::<Test>::Comment(parent_id) => {
                            let replies_count_post =
                                Content::ensure_post_exists(self.video_id, *parent_id)
                                    .map_or(VideoPostId::zero(), |p| p.replies_count);
                            assert_eq!(replies_count_pre, replies_count_post);
                        }
                        VideoPostType::<Test>::Description => assert_eq!(
                            VideoPostById::<Test>::iter_prefix(&self.video_id).count(),
                            thread_size,
                        ),
                    }
                }
            }
        }
    }
}

pub struct DeleteVideoFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    video_id: VideoId,
    assets_to_remove: BTreeSet<DataObjectId<Test>>,
}

impl DeleteVideoFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id: VideoId::one(),
            assets_to_remove: BTreeSet::new(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn with_assets_to_remove(self, assets_to_remove: BTreeSet<DataObjectId<Test>>) -> Self {
        Self {
            assets_to_remove,
            ..self
        }
    }

    pub fn with_video_id(self, video_id: VideoId) -> Self {
        Self { video_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender.clone());
        let balance_pre = Balances::<Test>::usable_balance(self.sender);
        let video_pre = <VideoById<Test>>::get(&self.video_id);
        let channel_bag_id = Content::bag_id_for_channel(&video_pre.in_channel);
        let deletion_prize =
            self.assets_to_remove
                .iter()
                .fold(BalanceOf::<Test>::zero(), |acc, obj_id| {
                    acc + storage::DataObjectsById::<Test>::get(&channel_bag_id, obj_id)
                        .deletion_prize
                });

        let actual_result = Content::delete_video(
            origin,
            self.actor.clone(),
            self.video_id,
            self.assets_to_remove.clone(),
        );

        let balance_post = Balances::<Test>::usable_balance(self.sender);

        assert_eq!(actual_result, expected_result);

        match actual_result {
            Ok(()) => {
                assert_eq!(
                    System::events().last().unwrap().event,
                    MetaEvent::content(RawEvent::VideoDeleted(self.actor.clone(), self.video_id,))
                );

                assert_eq!(balance_post.saturating_sub(balance_pre), deletion_prize);

                assert!(!self.assets_to_remove.iter().any(|obj_id| {
                    storage::DataObjectsById::<Test>::contains_key(&channel_bag_id, obj_id)
                }));

                assert!(!<VideoById<Test>>::contains_key(&self.video_id));
            }
            Err(err) => {
                assert_eq!(balance_pre, balance_post);

                if err == storage::Error::<Test>::DataObjectDoesntExist.into() {
                    let video_post = <VideoById<Test>>::get(&self.video_id);
                    assert_eq!(video_pre, video_post);
                    assert!(VideoById::<Test>::contains_key(&self.video_id));
                } else if err == Error::<Test>::VideoDoesNotExist.into() {
                    assert!(self.assets_to_remove.iter().all(|id| {
                        storage::DataObjectsById::<Test>::contains_key(&channel_bag_id, id)
                    }));
                } else {
                    let video_post = <VideoById<Test>>::get(&self.video_id);
                    assert_eq!(video_pre, video_post);
                    assert!(VideoById::<Test>::contains_key(&self.video_id));
                    assert!(self.assets_to_remove.iter().all(|id| {
                        storage::DataObjectsById::<Test>::contains_key(&channel_bag_id, id)
                    }));
                }
            }
        }
    }
}

pub struct UpdateModeratorSetFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    new_moderators: BTreeSet<MemberId>,
    channel_id: ChannelId,
}

impl UpdateModeratorSetFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            new_moderators: BTreeSet::new(),
            channel_id: ChannelId::one(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn with_moderators(self, new_moderators: BTreeSet<MemberId>) -> Self {
        Self {
            new_moderators,
            ..self
        }
    }

    pub fn with_channel_id(self, channel_id: ChannelId) -> Self {
        Self { channel_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender.clone());
        let channel_pre = ChannelById::<Test>::get(&self.channel_id);

        let actual_result = Content::update_moderator_set(
            origin,
            self.actor.clone(),
            self.new_moderators.clone(),
            self.channel_id.clone(),
        );

        assert_eq!(actual_result, expected_result);

        let channel_post = ChannelById::<Test>::get(&self.channel_id);

        if actual_result.is_ok() {
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::ModeratorSetUpdated(
                    self.channel_id,
                    self.new_moderators.clone(),
                ))
            );
            assert_eq!(channel_post.moderators, self.new_moderators);
        } else {
            assert_eq!(channel_pre, channel_post);
        }
    }
}

pub struct UpdateMaximumRewardFixture {
    sender: AccountId,
    new_amount: BalanceOf<Test>,
}

impl UpdateMaximumRewardFixture {
    pub fn default() -> Self {
        Self {
            sender: LEAD_ACCOUNT_ID,
            new_amount: BalanceOf::<Test>::zero(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender.clone());
        let max_reward_pre = Content::max_reward_allowed();

        let actual_result = Content::update_max_reward_allowed(origin, self.new_amount.clone());

        let max_reward_post = Content::max_reward_allowed();

        assert_eq!(actual_result, expected_result);
        if actual_result.is_ok() {
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::MaxRewardUpdated(self.new_amount.clone()))
            );
            assert_eq!(max_reward_post, self.new_amount);
        } else {
            assert_eq!(max_reward_post, max_reward_pre);
        }
    }
}

pub struct UpdateMinCashoutFixture {
    sender: AccountId,
    new_amount: BalanceOf<Test>,
}

impl UpdateMinCashoutFixture {
    pub fn default() -> Self {
        Self {
            sender: LEAD_ACCOUNT_ID,
            new_amount: BalanceOf::<Test>::zero(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender.clone());
        let min_cashout_pre = Content::min_cashout_allowed();

        let actual_result = Content::update_min_cashout_allowed(origin, self.new_amount.clone());

        let min_cashout_post = Content::min_cashout_allowed();

        assert_eq!(actual_result, expected_result);
        if actual_result.is_ok() {
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::MinCashoutUpdated(self.new_amount.clone()))
            );
            assert_eq!(min_cashout_post, self.new_amount);
        } else {
            assert_eq!(min_cashout_post, min_cashout_pre);
        }
    }
}

pub struct UpdateCommitmentValueFixture {
    sender: AccountId,
    new_commitment: HashOutput,
}

impl UpdateCommitmentValueFixture {
    pub fn default() -> Self {
        Self {
            sender: LEAD_ACCOUNT_ID,
            new_commitment: Hashing::hash_of(&PullPayment::<Test>::default()),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_commit(self, new_commitment: HashOutput) -> Self {
        Self {
            new_commitment,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender.clone());
        let commitment_pre = Content::commitment();

        let actual_result = Content::update_commitment(origin, self.new_commitment.clone());

        let commitment_post = Content::commitment();

        assert_eq!(actual_result, expected_result);
        if actual_result.is_ok() {
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::CommitmentUpdated(self.new_commitment))
            );
            assert_eq!(commitment_post, self.new_commitment);
        } else {
            assert_eq!(commitment_post, commitment_pre);
        }
    }
}

pub struct ClaimChannelRewardFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    payments: Vec<PullPayment<Test>>,
    item: PullPayment<Test>,
}

impl ClaimChannelRewardFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            payments: create_some_pull_payments_helper(),
            item: PullPayment::<Test> {
                channel_id: ChannelId::one(),
                cumulative_payout_claimed: BalanceOf::<Test>::from(DEFAULT_PAYOUT_CLAIMED),
                reason: Hashing::hash_of(&b"reason".to_vec()),
            },
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn with_payments(self, payments: Vec<PullPayment<Test>>) -> Self {
        Self { payments, ..self }
    }

    pub fn with_item(self, item: PullPayment<Test>) -> Self {
        Self { item, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender.clone());
        let balance_pre = Balances::<Test>::usable_balance(self.sender);
        let payout_earned_pre =
            Content::channel_by_id(self.item.channel_id).cumulative_payout_earned;

        let proof = if self.payments.is_empty() {
            vec![]
        } else {
            build_merkle_path_helper(&self.payments, DEFAULT_PROOF_INDEX)
        };

        let actual_result =
            Content::claim_channel_reward(origin, self.actor.clone(), proof, self.item.clone());

        let balance_post = Balances::<Test>::usable_balance(self.sender);
        let payout_earned_post =
            Content::channel_by_id(self.item.channel_id).cumulative_payout_earned;

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            let cashout = payout_earned_post.saturating_sub(payout_earned_pre);
            assert_eq!(balance_post.saturating_sub(balance_pre), cashout);
            assert_eq!(payout_earned_post, self.item.cumulative_payout_claimed);
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::ChannelRewardUpdated(
                    self.item.cumulative_payout_claimed,
                    self.item.channel_id
                ))
            );
        } else {
            assert_eq!(balance_post, balance_pre);
            assert_eq!(payout_earned_post, payout_earned_pre);
        }
    }
}

pub struct UpdateChannelTransferStatusFixture {
    origin: RawOrigin<u64>,
    channel_id: u64,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    params: PendingTransfer<MemberId, CuratorGroupId, BalanceOf<Test>>,
}

impl UpdateChannelTransferStatusFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID),
            channel_id: ChannelId::one(),
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            params: PendingTransfer::default(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn with_channel_id(self, channel_id: ChannelId) -> Self {
        Self { channel_id, ..self }
    }

    pub fn with_transfer_params(
        self,
        params: PendingTransfer<MemberId, CuratorGroupId, BalanceOf<Test>>,
    ) -> Self {
        Self { params, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_channel = Content::channel_by_id(self.channel_id);

        let actual_result = Content::update_channel_transfer_status(
            self.origin.clone().into(),
            self.channel_id,
            self.actor.clone(),
            self.params.clone(),
        );

        assert_eq!(actual_result, expected_result);

        let new_channel = Content::channel_by_id(self.channel_id);
        if actual_result.is_ok() {
            assert_eq!(
                new_channel.transfer_status,
                ChannelTransferStatus::PendingTransfer(self.params.clone())
            );
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::UpdateChannelTransferStatus(
                    self.channel_id,
                    self.actor.clone(),
                    self.params.clone()
                ))
            );
        } else {
            assert_eq!(new_channel.transfer_status, old_channel.transfer_status,);
        }
    }
}

// helper functions
pub fn increase_account_balance_helper(account_id: u64, balance: u64) {
    let _ = Balances::<Test>::deposit_creating(&account_id, balance.into());
}

pub fn slash_account_balance_helper(account_id: u64) {
    let _ = Balances::<Test>::slash(&account_id, Balances::<Test>::total_balance(&account_id));
}

pub fn create_data_object_candidates_helper(
    starting_ipfs_index: u8,
    number: u64,
) -> Vec<DataObjectCreationParameters> {
    let range = (starting_ipfs_index as u64)..((starting_ipfs_index as u64) + number);

    range
        .into_iter()
        .map(|_| DataObjectCreationParameters {
            size: DEFAULT_OBJECT_SIZE,
            ipfs_content_id: vec![1u8],
        })
        .collect()
}

pub fn create_data_objects_helper() -> Vec<DataObjectCreationParameters> {
    create_data_object_candidates_helper(1, DATA_OBJECTS_NUMBER)
}

pub fn create_initial_storage_buckets_helper() {
    // first set limits
    assert_eq!(
        Storage::<Test>::update_storage_buckets_voucher_max_limits(
            Origin::signed(STORAGE_WG_LEADER_ACCOUNT_ID),
            VOUCHER_OBJECTS_SIZE_LIMIT,
            VOUCHER_OBJECTS_NUMBER_LIMIT,
        ),
        Ok(())
    );

    // create bucket(s)
    assert_eq!(
        Storage::<Test>::create_storage_bucket(
            Origin::signed(STORAGE_WG_LEADER_ACCOUNT_ID),
            None,
            STORAGE_BUCKET_ACCEPTING_BAGS,
            STORAGE_BUCKET_OBJECTS_SIZE_LIMIT,
            STORAGE_BUCKET_OBJECTS_NUMBER_LIMIT,
        ),
        Ok(())
    );
}

pub fn create_default_member_owned_channel() {
    CreateChannelFixture::default()
        .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
        .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
        .with_assets(StorageAssets::<Test> {
            expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
            object_creation_list: create_data_objects_helper(),
        })
        .with_reward_account(DEFAULT_MEMBER_ACCOUNT_ID)
        .with_collaborators(vec![COLLABORATOR_MEMBER_ID].into_iter().collect())
        .with_moderators(vec![DEFAULT_MODERATOR_ID].into_iter().collect())
        .call_and_assert(Ok(()));
}

pub fn create_default_curator_owned_channel() {
    let curator_group_id = curators::add_curator_to_new_group(DEFAULT_CURATOR_ID);
    CreateChannelFixture::default()
        .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
        .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
        .with_assets(StorageAssets::<Test> {
            expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
            object_creation_list: create_data_objects_helper(),
        })
        .with_reward_account(DEFAULT_CURATOR_ACCOUNT_ID)
        .with_collaborators(vec![COLLABORATOR_MEMBER_ID].into_iter().collect())
        .with_moderators(vec![DEFAULT_MODERATOR_ID].into_iter().collect())
        .call_and_assert(Ok(()));
}

pub fn create_default_member_owned_channel_with_video() {
    create_default_member_owned_channel();

    CreateVideoFixture::default()
        .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
        .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
        .with_assets(StorageAssets::<Test> {
            expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
            object_creation_list: create_data_objects_helper(),
        })
        .with_channel_id(NextChannelId::<Test>::get() - 1)
        .call_and_assert(Ok(()));
}

pub fn create_default_curator_owned_channel_with_video() {
    create_default_curator_owned_channel();
    let curator_group_id = NextCuratorGroupId::<Test>::get() - 1;

    CreateVideoFixture::default()
        .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
        .with_actor(ContentActor::Curator(curator_group_id, DEFAULT_CURATOR_ID))
        .with_assets(StorageAssets::<Test> {
            expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
            object_creation_list: create_data_objects_helper(),
        })
        .with_channel_id(NextChannelId::<Test>::get() - 1)
        .call_and_assert(Ok(()));
}

pub fn create_default_member_owned_channel_with_video_and_post() {
    create_default_member_owned_channel_with_video();
    CreatePostFixture::default().call_and_assert(Ok(()));
}

pub fn create_default_curator_owned_channel_with_video_and_post() {
    create_default_curator_owned_channel_with_video();
    let default_curator_group_id = Content::next_curator_group_id() - 1;
    CreatePostFixture::default()
        .with_sender(DEFAULT_CURATOR_ACCOUNT_ID)
        .with_actor(ContentActor::Curator(
            default_curator_group_id,
            DEFAULT_CURATOR_ID,
        ))
        .call_and_assert(Ok(()));
}

pub fn create_default_member_owned_channel_with_video_and_comment() {
    create_default_member_owned_channel_with_video_and_post();
    CreatePostFixture::default()
        .with_params(VideoPostCreationParameters::<Test> {
            post_type: VideoPostType::<Test>::Comment(VideoPostId::one()),
            video_reference: VideoId::one(),
        })
        .call_and_assert(Ok(()));
}

pub fn create_default_curator_owned_channel_with_video_and_comment() {
    create_default_curator_owned_channel_with_video_and_post();
    let default_curator_group_id = Content::next_curator_group_id() - 1;
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
}

#[derive(Debug)]
struct IndexItem {
    index: usize,
    side: Side,
}

fn index_path_helper(len: usize, index: usize) -> Vec<IndexItem> {
    // used as a helper function to generate the correct sequence of indexes used to
    // construct the merkle path necessary for membership proof
    let mut idx = index;
    assert!(idx > 0); // index starting at 1
    let floor_2 = |x: usize| (x >> 1) + (x % 2);
    let mut path = Vec::new();
    let mut prev_len: usize = 0;
    let mut el = len;
    while el != 1 {
        if idx % 2 == 1 && idx == el {
            path.push(IndexItem {
                index: prev_len + idx,
                side: Side::Left,
            });
        } else {
            match idx % 2 {
                1 => path.push(IndexItem {
                    index: prev_len + idx + 1,
                    side: Side::Right,
                }),
                _ => path.push(IndexItem {
                    index: prev_len + idx - 1,
                    side: Side::Left,
                }),
            };
        }
        prev_len += el;
        idx = floor_2(idx);
        el = floor_2(el);
    }
    return path;
}

fn generate_merkle_root_helper<E: Encode>(collection: &[E]) -> Vec<HashOutput> {
    // generates merkle root from the ordered sequence collection.
    // The resulting vector is structured as follows: elements in range
    // [0..collection.len()) will be the tree leaves (layer 0), elements in range
    // [collection.len()..collection.len()/2) will be the nodes in the next to last layer (layer 1)
    // [layer_n_length..layer_n_length/2) will be the number of nodes in layer(n+1)
    assert!(!collection.is_empty());
    let mut out = Vec::new();
    for e in collection.iter() {
        out.push(Hashing::hash(&e.encode()));
    }

    let mut start: usize = 0;
    let mut last_len = out.len();
    //let mut new_len = out.len();
    let mut max_len = last_len >> 1;
    let mut rem = last_len % 2;

    // range [last..(maxlen >> 1) + (maxlen % 2)]
    while max_len != 0 {
        last_len = out.len();
        for i in 0..max_len {
            out.push(Hashing::hash(
                &[out[start + 2 * i], out[start + 2 * i + 1]].encode(),
            ));
        }
        if rem == 1 {
            out.push(Hashing::hash(
                &[out[last_len - 1], out[last_len - 1]].encode(),
            ));
        }
        let new_len: usize = out.len() - last_len;
        rem = new_len % 2;
        max_len = new_len >> 1;
        start = last_len;
    }
    out
}

fn build_merkle_path_helper<E: Encode + Clone>(
    collection: &[E],
    idx: usize,
) -> Vec<ProofElement<Test>> {
    let merkle_tree = generate_merkle_root_helper(collection);
    // builds the actual merkle path with the hashes needed for the proof
    let index_path = index_path_helper(collection.len(), idx + 1);
    index_path
        .iter()
        .map(|idx_item| ProofElement::<Test> {
            hash: merkle_tree[idx_item.index - 1],
            side: idx_item.side,
        })
        .collect()
}

// generate some payments claims
pub fn create_some_pull_payments_helper() -> Vec<PullPayment<Test>> {
    let mut payments = Vec::new();
    for i in 0..PAYMENTS_NUMBER {
        payments.push(PullPayment::<Test> {
            channel_id: ChannelId::from(i % 2),
            cumulative_payout_claimed: BalanceOf::<Test>::from(DEFAULT_PAYOUT_EARNED),
            reason: Hashing::hash_of(&b"reason".to_vec()),
        });
    }
    payments
}

pub fn update_commit_value_with_payments_helper(payments: &[PullPayment<Test>]) {
    let commit = generate_merkle_root_helper(payments).pop().unwrap();
    UpdateCommitmentValueFixture::default()
        .with_commit(commit)
        .call_and_assert(Ok(()));
}
