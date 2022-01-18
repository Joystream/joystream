use super::curators;
use super::mock::*;
use crate::*;
use frame_support::assert_ok;
use frame_support::traits::Currency;

// type aliases
type AccountId = <Test as frame_system::Trait>::AccountId;
type VideoId = <Test as Trait>::VideoId;

type CuratorId = super::mock::CuratorId;
type CuratorGroupId = super::mock::CuratorGroupId;
type MemberId = super::mock::MemberId;

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
        let balance_pre = Balances::usable_balance(self.sender);
        let channel_id = Content::next_channel_id();
        let channel_bag_id = Content::bag_id_for_channel(&channel_id);
        let beg_obj_id = storage::NextDataObjectId::<Test>::get();
        let actual_result =
            Content::create_channel(origin, self.actor.clone(), self.params.clone());
        let end_obj_id = storage::NextDataObjectId::<Test>::get();

        assert_eq!(actual_result, expected_result);

        let balance_post = Balances::usable_balance(self.sender);

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
            let owner = Content::actor_to_channel_owner(&self.actor).unwrap();
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::ChannelCreated(
                    self.actor.clone(),
                    channel_id,
                    ChannelRecord {
                        owner: owner,
                        is_censored: false,
                        reward_account: self.params.reward_account.clone(),
                        collaborators: self.params.collaborators.clone(),
                        num_videos: Zero::zero(),
                        deletion_prize_source_account_id: self.sender.clone()
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
        let balance_pre = Balances::usable_balance(self.sender);
        let channel_bag_id = Content::bag_id_for_channel(&self.channel_id);
        let video_id = Content::next_video_id();
        let beg_obj_id = storage::NextDataObjectId::<Test>::get();

        let actual_result = Content::create_video(
            origin,
            self.actor.clone(),
            self.channel_id,
            self.params.clone(),
        );

        let balance_post = Balances::usable_balance(self.sender);
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
        let balance_pre = Balances::usable_balance(self.sender);
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
        let balance_post = Balances::usable_balance(self.sender);

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
                            owner: owner,
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
                            deletion_prize_source_account_id: channel_pre
                                .deletion_prize_source_account_id
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
        let balance_pre = Balances::usable_balance(self.sender);
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
        let balance_post = Balances::usable_balance(self.sender);
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
        let balance_pre = Balances::usable_balance(self.sender);
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

        let balance_post = Balances::usable_balance(self.sender);
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

pub struct DeleteVideoFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    video_id: VideoId,
    assets_to_remove: BTreeSet<DataObjectId<Test>>,
    deletion_prize_source_account_id: Option<AccountId>,
}

impl DeleteVideoFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id: VideoId::one(),
            assets_to_remove: BTreeSet::new(),
            deletion_prize_source_account_id: None,
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

    pub fn with_deletion_prize_source_account_id(
        self,
        deletion_prize_source_account_id: AccountId,
    ) -> Self {
        Self {
            deletion_prize_source_account_id: Some(deletion_prize_source_account_id),
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let deletion_prize_source_account_id = match self.deletion_prize_source_account_id {
            Some(account_id) => account_id,
            None => self.sender.clone(),
        };

        let origin = Origin::signed(self.sender.clone());
        let balance_pre = Balances::usable_balance(deletion_prize_source_account_id);
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

        let balance_post = Balances::usable_balance(deletion_prize_source_account_id);

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

// helper functions
pub fn increase_account_balance_helper(account_id: u64, balance: u64) {
    let _ = Balances::deposit_creating(&account_id, balance);
}

pub fn slash_account_balance_helper(account_id: u64) {
    let _ = Balances::slash(&account_id, Balances::total_balance(&account_id));
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

pub fn create_default_member_owned_channels_with_videos() -> (u64, u64) {
    for _ in 0..OUTSTANDING_CHANNELS {
        create_default_member_owned_channel();
    }

    for i in 0..OUTSTANDING_VIDEOS {
        CreateVideoFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .with_channel_id(i % OUTSTANDING_CHANNELS + 1)
            .call_and_assert(Ok(()));
    }

    // assert that the specified channels have been created
    assert_eq!(VideoById::<Test>::iter().count() as u64, OUTSTANDING_VIDEOS);
    assert_eq!(
        ChannelById::<Test>::iter().count() as u64,
        OUTSTANDING_CHANNELS
    );

    let channels_migrations_per_block = <Test as Trait>::ChannelsMigrationsEachBlock::get();
    let videos_migrations_per_block = <Test as Trait>::VideosMigrationsEachBlock::get();

    // return the number of blocks required for migration
    let divide_with_ceiling =
        |x: u64, y: u64| (x / y) + ((x.checked_rem(y).unwrap_or_default() > 0u64) as u64);
    (
        divide_with_ceiling(OUTSTANDING_CHANNELS, channels_migrations_per_block),
        divide_with_ceiling(OUTSTANDING_VIDEOS, videos_migrations_per_block),
    )
}
