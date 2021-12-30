use super::mock::*;
use crate::*;
use frame_support::traits::Currency;
use frame_support::{assert_err, assert_ok};

// type aliases
type AccountId = <Test as frame_system::Trait>::AccountId;
type ChannelId = <Test as storage::Trait>::ChannelId;
type VideoId = <Test as Trait>::VideoId;

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

    pub fn with_params(self, params: ChannelCreationParameters<Test>) -> Self {
        Self { params, ..self }
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

        match actual_result {
            Ok(()) => {
                // ensure channel is on chain
                assert_ok!(Content::ensure_channel_exists(&channel_id));

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
                        },
                        self.params.clone(),
                    ))
                );

                if let Some(assets) = self.params.assets.as_ref() {
                    // balance accounting is correct
                    let bag_deletion_prize = BalanceOf::<Test>::one();
                    let objects_deletion_prize = assets.object_creation_list.iter().fold(
                        BalanceOf::<Test>::zero(),
                        |acc, obj| {
                            acc.saturating_add(
                                <Test as storage::Trait>::DataObjectDeletionPrize::get(),
                            )
                        },
                    );

                    assert_eq!(
                        balance_pre.saturating_sub(balance_post),
                        bag_deletion_prize.saturating_add(objects_deletion_prize),
                    );

                    for id in beg_obj_id..end_obj_id {
                        assert!(storage::DataObjectsById::<Test>::contains_key(
                            &channel_bag_id,
                            id
                        ));
                    }
                }
            }
            Err(_) => {
                assert_eq!(balance_post, balance_pre);
                assert!(!storage::Bags::<Test>::contains_key(&channel_bag_id));
                assert!(!ChannelById::<Test>::contains_key(&channel_id));
                assert_eq!(NextChannelId::<Test>::get(), channel_id);
                for id in beg_obj_id..end_obj_id {
                    assert!(!storage::DataObjectsById::<Test>::contains_key(
                        &channel_bag_id,
                        id
                    ));
                }
            }
        }
    }
}

// pub struct CreateVideoFixture {
//     sender: AccountId,
//     actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
//     params: VideoCreationParameters<Test>,
//     channel_id: ChannelId,
// }

// impl CreateVideoFixture {
//     pub fn default() -> Self {
//         Self {
//             sender: DEFAULT_MEMBER_ACCOUNT_ID,
//             actor: ContentActor::Member(DEFAULT_MEMBER_ACCOUNT_ID),
//             params: VideoCreationParameters::<Test> {
//                 assets: None,
//                 meta: None,
//             },
//             channel_id: ChannelId::one(), // channel index starts at 1
//         }
//     }

//     pub fn with_sender(self, sender: AccountId) -> Self {
//         Self { sender, ..self }
//     }

//     pub fn with_channel_id(self, channel_id: ChannelId) -> Self {
//         Self { channel_id, ..self }
//     }

//     pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
//         Self { actor, ..self }
//     }

//     pub fn with_params(self, params: VideoCreationParameters<Test>) -> Self {
//         Self { params, ..self }
//     }

//     pub fn with_assets(self, assets: StorageAssets<Test>) -> Self {
//         Self {
//             params: VideoCreationParameters::<Test> {
//                 assets: Some(assets),
//                 ..self.params
//             },
//             ..self
//         }
//     }

//     pub fn call_and_assert(&self, expected_result: DispatchResult) {
//         let origin = Origin::signed(self.sender.clone());

//         let balance_pre = Balances::usable_balance(self.sender);

//         let actual_result = Content::create_video(
//             origin,
//             self.actor.clone(),
//             self.channel_id,
//             self.params.clone(),
//         );

//         assert_eq!(actual_result, expected_result);

//         if expected_result.is_ok() {
//             let video_id = Content::next_video_id();

//             // ensure channel is on chain
//             assert_ok!(Content::ensure_video_exists(&video_id));

//             // channel counter increased
//             assert_eq!(
//                 Content::next_video_id(),
//                 video_id.saturating_add(One::one())
//             );

//             // event correctly deposited
//             let owner = Content::actor_to_channel_owner(&self.actor).unwrap();
//             assert_eq!(
//                 System::events().last().unwrap().event,
//                 MetaEvent::content(RawEvent::VideoCreated(
//                     ContentActor::Member(FIRST_MEMBER_ID),
//                     self.channel_id,
//                     video_id,
//                     self.params.clone(),
//                 ))
//             );
//         }
//     }
// }

// pub struct UpdateChannelFixture {
//     sender: AccountId,
//     actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
//     channel_id: ChannelId,
//     params: ChannelUpdateParameters<Test>,
// }

// impl UpdateChannelFixture {
//     pub fn default() -> Self {
//         Self {
//             sender: DEFAULT_MEMBER_ACCOUNT_ID,
//             actor: ContentActor::Member(DEFAULT_MEMBER_ACCOUNT_ID),
//             channel_id: ChannelId::one(), // channel index starts at 1
//             params: ChannelUpdateParameters::<Test> {
//                 assets_to_upload: None,
//                 new_meta: None,
//                 reward_account: None,
//                 assets_to_remove: BTreeSet::new(),
//                 collaborators: None,
//             },
//         }
//     }

//     pub fn with_sender(self, sender: AccountId) -> Self {
//         Self { sender, ..self }
//     }

//     pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
//         Self { actor, ..self }
//     }

//     pub fn with_params(self, params: ChannelUpdateParameters<Test>) -> Self {
//         Self { params, ..self }
//     }

//     pub fn with_channel_id(self, channel_id: ChannelId) -> Self {
//         Self { channel_id, ..self }
//     }

//     pub fn with_assets_to_upload(self, assets: StorageAssets<Test>) -> Self {
//         Self {
//             params: ChannelUpdateParameters::<Test> {
//                 assets_to_upload: Some(assets),
//                 ..self.params
//             },
//             ..self
//         }
//     }

//     pub fn with_assets_to_remove(self, assets: BTreeSet<DataObjectId<Test>>) -> Self {
//         Self {
//             params: ChannelUpdateParameters::<Test> {
//                 assets_to_remove: assets,
//                 ..self.params
//             },
//             ..self
//         }
//     }

//     pub fn with_collaborators(self, collaborators: BTreeSet<MemberId>) -> Self {
//         Self {
//             params: ChannelUpdateParameters::<Test> {
//                 collaborators: Some(collaborators),
//                 ..self.params
//             },
//             ..self
//         }
//     }

//     pub fn with_reward_account(self, reward_account: AccountId) -> Self {
//         Self {
//             params: ChannelUpdateParameters::<Test> {
//                 reward_account: Some(Some(reward_account)),
//                 ..self.params
//             },
//             ..self
//         }
//     }

//     pub fn call_and_assert(&self, expected_result: DispatchResult) {
//         let origin = Origin::signed(self.sender.clone());

//         let balance_pre = Balances::usable_balance(self.sender);

//         let channel_pre = Content::channel_by_id(&self.channel_id);

//         let bag_id_for_channel = Content::bag_id_for_channel(&self.channel_id);

//         let deletion_prize_deposited =
//             self.params
//                 .assets_to_upload
//                 .as_ref()
//                 .map_or(BalanceOf::<Test>::zero(), |assets| {
//                     assets.object_creation_list.iter().fold(
//                         BalanceOf::<Test>::zero(),
//                         |acc, obj| {
//                             acc.saturating_add(
//                                 <Test as storage::Trait>::DataObjectDeletionPrize::get(),
//                             )
//                         },
//                     )
//                 });

//         let deletion_prize_withdrawn = if !self.params.assets_to_remove.is_empty() {
//             self.params
//                 .assets_to_remove
//                 .iter()
//                 .fold(BalanceOf::<Test>::zero(), |acc, obj_id| {
//                     acc + storage::DataObjectsById::<Test>::get(&bag_id_for_channel, obj_id)
//                         .deletion_prize
//                 })
//         } else {
//             BalanceOf::<Test>::zero()
//         };

//         let actual_result = Content::update_channel(
//             origin,
//             self.actor.clone(),
//             self.channel_id,
//             self.params.clone(),
//         );

//         assert_eq!(actual_result, expected_result);

//         if expected_result.is_ok() {
//             let owner = Content::actor_to_channel_owner(&self.actor).unwrap();
//             assert_eq!(
//                 System::events().last().unwrap().event,
//                 MetaEvent::content(RawEvent::ChannelUpdated(
//                     self.actor.clone(),
//                     self.channel_id,
//                     ChannelRecord {
//                         owner: owner,
//                         is_censored: channel_pre.is_censored,
//                         reward_account: self
//                             .params
//                             .reward_account
//                             .clone()
//                             .unwrap_or(channel_pre.reward_account),
//                         collaborators: self
//                             .params
//                             .collaborators
//                             .clone()
//                             .unwrap_or(channel_pre.collaborators),
//                         num_videos: channel_pre.num_videos,
//                     },
//                     self.params.clone(),
//                 ))
//             );

//             let balance_post = Balances::usable_balance(self.sender);

//             assert_eq!(
//                 balance_post.saturating_sub(balance_pre),
//                 deletion_prize_withdrawn.saturating_sub(deletion_prize_deposited),
//             );

//             // objects uploaded: check for the number of objects uploaded
//             if let Some(assets) = self.params.assets_to_upload.as_ref() {
//                 assert_eq!(
//                     storage::DataObjectsById::<Test>::iter_prefix(&bag_id_for_channel).count(),
//                     assets.object_creation_list.len(),
//                 );
//             }

//             assert!(self.params.assets_to_remove.iter().all(|obj_id| {
//                 !storage::DataObjectsById::<Test>::contains_key(&bag_id_for_channel, obj_id)
//             }));
//         }
//     }
// }

// pub struct UpdateVideoFixture {
//     sender: AccountId,
//     actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
//     video_id: VideoId,
//     params: VideoUpdateParameters<Test>,
// }

// impl UpdateVideoFixture {
//     pub fn with_sender(self, sender: AccountId) -> Self {
//         Self { sender, ..self }
//     }

//     pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
//         Self { actor, ..self }
//     }

//     pub fn with_params(self, params: VideoUpdateParameters<Test>) -> Self {
//         Self { params, ..self }
//     }

//     pub fn with_video_id(self, video_id: VideoId) -> Self {
//         Self { video_id, ..self }
//     }

//     pub fn with_assets_to_upload(self, assets: StorageAssets<Test>) -> Self {
//         Self {
//             params: VideoUpdateParameters::<Test> {
//                 assets_to_upload: Some(assets),
//                 ..self.params
//             },
//             ..self
//         }
//     }
//     pub fn with_assets_to_remove(self, assets: BTreeSet<DataObjectId<Test>>) -> Self {
//         Self {
//             params: VideoUpdateParameters::<Test> {
//                 assets_to_remove: assets,
//                 ..self.params
//             },
//             ..self
//         }
//     }
//     pub fn call_and_assert(&self, expected_result: DispatchResult) {
//         let origin = Origin::signed(self.sender.clone());

//         let balance_pre = Balances::usable_balance(self.sender);
//         let video_pre = Content::video_by_id(&self.video_id);

//         let bag_id_for_channel = Content::bag_id_for_channel(&video_pre.in_channel);

//         let deletion_prize_deposited =
//             self.params
//                 .assets_to_upload
//                 .as_ref()
//                 .map_or(BalanceOf::<Test>::zero(), |assets| {
//                     assets.object_creation_list.iter().fold(
//                         BalanceOf::<Test>::zero(),
//                         |acc, obj| {
//                             acc.saturating_add(
//                                 <Test as storage::Trait>::DataObjectDeletionPrize::get(),
//                             )
//                         },
//                     )
//                 });

//         let deletion_prize_withdrawn = if !self.params.assets_to_remove.is_empty() {
//             self.params
//                 .assets_to_remove
//                 .iter()
//                 .fold(BalanceOf::<Test>::zero(), |acc, obj_id| {
//                     acc + storage::DataObjectsById::<Test>::get(&bag_id_for_channel, obj_id)
//                         .deletion_prize
//                 })
//         } else {
//             BalanceOf::<Test>::zero()
//         };

//         let actual_result = Content::update_video(
//             origin,
//             self.actor.clone(),
//             self.video_id,
//             self.params.clone(),
//         );

//         assert_eq!(actual_result, expected_result);

//         if expected_result.is_ok() {
//             let balance_post = Balances::usable_balance(self.sender);

//             // event emitted correctly
//             assert_eq!(
//                 System::events().last().unwrap().event,
//                 MetaEvent::content(RawEvent::VideoUpdated(
//                     self.actor.clone(),
//                     self.video_id,
//                     self.params.clone()
//                 ))
//             );

//             assert_eq!(
//                 balance_post.saturating_sub(balance_pre),
//                 deletion_prize_withdrawn.saturating_sub(deletion_prize_deposited),
//             );

//             // objects uploaded: check for the number of objects uploaded
//             if let Some(assets) = self.params.assets_to_upload.as_ref() {
//                 assert_eq!(
//                     storage::DataObjectsById::<Test>::iter_prefix(&bag_id_for_channel).count(),
//                     assets.object_creation_list.len(),
//                 );
//             }

//             assert!(self.params.assets_to_remove.iter().all(|obj_id| {
//                 !storage::DataObjectsById::<Test>::contains_key(&bag_id_for_channel, obj_id)
//             }));
//         }
//     }
// }

// pub struct DeleteChannelFixture {
//     sender: AccountId,
//     actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
//     channel_id: ChannelId,
//     num_objects_to_delete: u64,
// }

// impl DeleteChannelFixture {
//     pub fn with_sender(self, sender: AccountId) -> Self {
//         Self { sender, ..self }
//     }

//     pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
//         Self { actor, ..self }
//     }

//     pub fn with_num_objects_to_delete(self, num_objects_to_delete: u64) -> Self {
//         Self {
//             num_objects_to_delete,
//             ..self
//         }
//     }

//     pub fn with_channel_id(self, channel_id: ChannelId) -> Self {
//         Self { channel_id, ..self }
//     }
//     pub fn call_and_assert(&self, expected_result: DispatchResult) {
//         let origin = Origin::signed(self.sender.clone());

//         let balance_pre = Balances::usable_balance(self.sender);

//         let bag_id_for_channel = Content::bag_id_for_channel(&self.channel_id);

//         let bag_deletion_prize = storage::Bags::<Test>::get(&bag_id_for_channel)
//             .deletion_prize
//             .unwrap_or(BalanceOf::<Test>::zero());

//         let objects_deletion_prize =
//             storage::DataObjectsById::<Test>::iter_prefix(&bag_id_for_channel)
//                 .fold(BalanceOf::<Test>::zero(), |acc, (_, obj)| {
//                     acc + obj.deletion_prize
//                 });

//         let actual_result = Content::delete_channel(
//             origin,
//             self.actor.clone(),
//             self.channel_id,
//             self.num_objects_to_delete,
//         );

//         assert_eq!(actual_result, expected_result);

//         if expected_result.is_ok() {
//             let balance_post = Balances::usable_balance(self.sender);

//             // event emitted correctly
//             assert_eq!(
//                 System::events().last().unwrap().event,
//                 MetaEvent::content(RawEvent::ChannelDeleted(
//                     self.actor.clone(),
//                     self.channel_id,
//                 ))
//             );

//             let deletion_prize = bag_deletion_prize.saturating_add(objects_deletion_prize);

//             assert_eq!(balance_post.saturating_sub(balance_pre), deletion_prize,);

//             // bag deleted
//             assert!(!storage::Bags::<Test>::contains_key(&bag_id_for_channel));

//             // all assets deleted
//             assert_eq!(
//                 storage::DataObjectsById::<Test>::iter_prefix(&bag_id_for_channel).count(),
//                 0,
//             );

//             // channel deleted
//             assert!(!<ChannelById<Test>>::contains_key(&self.channel_id));
//         }
//     }
// }

// pub struct DeleteVideoFixture {
//     sender: AccountId,
//     actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
//     video_id: VideoId,
//     assets_to_remove: BTreeSet<DataObjectId<Test>>,
// }

// impl DeleteVideoFixture {
//     pub fn with_sender(self, sender: AccountId) -> Self {
//         Self { sender, ..self }
//     }

//     pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
//         Self { actor, ..self }
//     }

//     pub fn with_assets_to_remove(self, assets_to_remove: BTreeSet<DataObjectId<Test>>) -> Self {
//         Self {
//             assets_to_remove,
//             ..self
//         }
//     }

//     pub fn with_video_id(self, video_id: VideoId) -> Self {
//         Self { video_id, ..self }
//     }

//     pub fn call_and_assert(&self, expected_result: DispatchResult) {
//         let origin = Origin::signed(self.sender.clone());

//         let balance_pre = Balances::usable_balance(self.sender);

//         let video_pre = <VideoById<Test>>::get(&self.video_id);

//         let bag_id_for_channel = Content::bag_id_for_channel(&video_pre.in_channel);

//         let deletion_prize =
//             self.assets_to_remove
//                 .iter()
//                 .fold(BalanceOf::<Test>::zero(), |acc, obj_id| {
//                     acc + storage::DataObjectsById::<Test>::get(&bag_id_for_channel, obj_id)
//                         .deletion_prize
//                 });

//         let actual_result = Content::delete_video(
//             origin,
//             self.actor.clone(),
//             self.video_id,
//             self.assets_to_remove.clone(),
//         );

//         assert_eq!(actual_result, expected_result);

//         if expected_result.is_ok() {
//             let balance_post = Balances::usable_balance(self.sender);

//             // event emitted correctly
//             assert_eq!(
//                 System::events().last().unwrap().event,
//                 MetaEvent::content(RawEvent::VideoDeleted(self.actor.clone(), self.video_id,))
//             );

//             assert_eq!(balance_post.saturating_sub(balance_pre), deletion_prize);

//             // all assets deleted
//             assert!(self.assets_to_remove.iter().all(|obj_id| {
//                 !storage::DataObjectsById::<Test>::contains_key(&bag_id_for_channel, obj_id)
//             }));

//             // video deleted
//             assert!(!<VideoById<Test>>::contains_key(&self.video_id));
//         }
//     }
// }
