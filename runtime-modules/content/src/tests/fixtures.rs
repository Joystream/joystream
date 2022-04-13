use super::curators;
use super::mock::*;
use crate::*;
use frame_support::assert_ok;
use frame_support::traits::Currency;
use frame_system::RawOrigin;
use sp_std::collections::btree_map::BTreeMap;
use sp_std::iter::FromIterator;
use sp_std::iter::{IntoIterator, Iterator};
use storage::DynamicBagType;
use strum::IntoEnumIterator;

// Index which indentifies the item in the commitment set we want the proof for
pub const DEFAULT_PROOF_INDEX: usize = 1;

// fixtures

pub struct CreateCuratorGroupFixture {
    sender: AccountId,
    is_active: bool,
    permissions: ModerationPermissionsByLevel<Test>,
}

impl CreateCuratorGroupFixture {
    pub fn default() -> Self {
        Self {
            sender: LEAD_ACCOUNT_ID,
            is_active: false,
            permissions: BTreeMap::new(),
        }
    }

    pub fn with_is_active(self, is_active: bool) -> Self {
        Self { is_active, ..self }
    }

    pub fn with_permissions(self, permissions: &ModerationPermissionsByLevel<Test>) -> Self {
        Self {
            permissions: permissions.clone(),
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) -> Option<CuratorGroupId> {
        let new_group_id = Content::next_curator_group_id();
        let actual_result = Content::create_curator_group(
            Origin::signed(self.sender),
            self.is_active,
            self.permissions.clone(),
        );
        assert_eq!(actual_result, expected_result);
        if actual_result.is_ok() {
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::CuratorGroupCreated(new_group_id))
            );

            assert!(CuratorGroupById::<Test>::contains_key(new_group_id));
            let group = Content::curator_group_by_id(new_group_id);

            assert_eq!(group.is_active(), self.is_active);
            assert_eq!(group.get_curators().len(), 0);
            assert_eq!(
                group.get_permissions_by_level().len(),
                self.permissions.len()
            );
            for i in 0..self.permissions.len() {
                let index = i as u8;
                assert_eq!(
                    group.get_permissions_by_level().get(&index),
                    self.permissions.get(&index)
                );
            }

            Some(new_group_id)
        } else {
            None
        }
    }
}

pub struct CreateChannelFixture {
    sender: AccountId,
    channel_owner: ChannelOwner<MemberId, CuratorGroupId>,
    params: ChannelCreationParameters<Test>,
}

impl CreateChannelFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            channel_owner: ChannelOwner::Member(DEFAULT_MEMBER_ID),
            params: ChannelCreationParameters::<Test> {
                assets: None,
                meta: None,
                collaborators: BTreeMap::new(),
                storage_buckets: BTreeSet::new(),
                distribution_buckets: BTreeSet::new(),
                expected_dynamic_bag_deletion_prize: Default::default(),
                expected_data_object_deletion_prize: DATA_OBJECT_DELETION_PRIZE,
            },
        }
    }

    pub fn with_data_object_deletion_prize(self, expected_data_object_deletion_prize: u64) -> Self {
        Self {
            params: ChannelCreationParameters::<Test> {
                expected_data_object_deletion_prize,
                ..self.params.clone()
            },
            ..self
        }
    }
    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_channel_owner(self, channel_owner: ChannelOwner<MemberId, CuratorGroupId>) -> Self {
        Self {
            channel_owner,
            ..self
        }
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

    pub fn with_collaborators(
        self,
        collaborators: BTreeMap<MemberId, ChannelAgentPermissions>,
    ) -> Self {
        Self {
            params: ChannelCreationParameters::<Test> {
                collaborators: collaborators,
                ..self.params
            },
            ..self
        }
    }

    pub fn with_storage_buckets(self, storage_buckets: BTreeSet<u64>) -> Self {
        Self {
            params: ChannelCreationParameters::<Test> {
                storage_buckets,
                ..self.params
            },
            ..self
        }
    }

    pub fn with_default_storage_buckets(self) -> Self {
        // No storage buckets
        if storage::NextStorageBucketId::<Test>::get() == 0 {
            return self.with_storage_buckets(BTreeSet::new());
        }

        let default_storage_bucket_id =
            storage::NextStorageBucketId::<Test>::get().saturating_sub(1);
        return self.with_storage_buckets(BTreeSet::from_iter(vec![default_storage_bucket_id]));
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender.clone());
        let balance_pre = Balances::<Test>::usable_balance(self.sender);
        let channel_id = Content::next_channel_id();
        let channel_bag_id = Content::bag_id_for_channel(&channel_id);
        let beg_obj_id = storage::NextDataObjectId::<Test>::get();
        let actual_result =
            Content::create_channel(origin, self.channel_owner.clone(), self.params.clone());
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
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::ChannelCreated(
                    channel_id,
                    Channel::<Test> {
                        owner: self.channel_owner.clone(),
                        collaborators: self.params.collaborators.clone(),
                        num_videos: Zero::zero(),
                        cumulative_payout_earned: Zero::zero(),
                        privilege_level: Zero::zero(),
                        paused_features: BTreeSet::new(),
                        data_objects: BTreeSet::from_iter(beg_obj_id..end_obj_id),
                        transfer_status: Default::default(),
                    },
                    self.params.clone(),
                ))
            );

            if let Some(assets) = self.params.assets.as_ref() {
                // balance accounting is correct
                let bag_deletion_prize = BalanceOf::<Test>::zero();
                let objects_deletion_prize = assets
                    .object_creation_list
                    .iter()
                    .fold(BalanceOf::<Test>::zero(), |acc, _| {
                        acc.saturating_add(self.params.expected_data_object_deletion_prize)
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
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            params: VideoCreationParameters::<Test> {
                assets: None,
                meta: None,
                auto_issue_nft: None,
                expected_data_object_deletion_prize: DATA_OBJECT_DELETION_PRIZE,
            },
            channel_id: ChannelId::one(), // channel index starts at 1
        }
    }

    pub fn with_data_object_deletion_prize(self, expected_data_object_deletion_prize: u64) -> Self {
        Self {
            params: VideoCreationParameters::<Test> {
                expected_data_object_deletion_prize,
                ..self.params.clone()
            },
            ..self
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

    pub fn with_nft_issuance(self, params: NftIssuanceParameters<Test>) -> Self {
        Self {
            params: VideoCreationParameters::<Test> {
                auto_issue_nft: Some(params),
                ..self.params
            },
            ..self
        }
    }

    pub fn with_opt_assets(self, assets: Option<StorageAssets<Test>>) -> Self {
        Self {
            params: VideoCreationParameters::<Test> {
                assets,
                ..self.params
            },
            ..self
        }
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
                    BTreeSet::from_iter(beg_obj_id..end_obj_id),
                ))
            );

            if let Some(assets) = self.params.assets.as_ref() {
                // balance accounting is correct
                let bag_deletion_prize = BalanceOf::<Test>::zero();
                let objects_deletion_prize = assets
                    .object_creation_list
                    .iter()
                    .fold(BalanceOf::<Test>::zero(), |acc, _| {
                        acc.saturating_add(self.params.expected_data_object_deletion_prize)
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
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            channel_id: ChannelId::one(), // channel index starts at 1
            params: ChannelUpdateParameters::<Test> {
                assets_to_upload: None,
                new_meta: None,
                assets_to_remove: BTreeSet::new(),
                collaborators: None,
                expected_data_object_deletion_prize: DATA_OBJECT_DELETION_PRIZE,
            },
        }
    }

    pub fn with_new_meta(self, new_meta: Option<Vec<u8>>) -> Self {
        Self {
            params: ChannelUpdateParameters::<Test> {
                new_meta,
                ..self.params.clone()
            },
            ..self
        }
    }

    pub fn with_data_object_deletion_prize(self, expected_data_object_deletion_prize: u64) -> Self {
        Self {
            params: ChannelUpdateParameters::<Test> {
                expected_data_object_deletion_prize,
                ..self.params.clone()
            },
            ..self
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

    pub fn with_collaborators(
        self,
        collaborators: BTreeMap<MemberId, ChannelAgentPermissions>,
    ) -> Self {
        Self {
            params: ChannelUpdateParameters::<Test> {
                collaborators: Some(collaborators),
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
                            acc.saturating_add(self.params.expected_data_object_deletion_prize)
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
                assert_eq!(
                    System::events().last().unwrap().event,
                    MetaEvent::content(RawEvent::ChannelUpdated(
                        self.actor.clone(),
                        self.channel_id,
                        self.params.clone(),
                        BTreeSet::from_iter(beg_obj_id..end_obj_id)
                    ))
                );

                assert_eq!(
                    channel_post.collaborators,
                    self.params
                        .collaborators
                        .clone()
                        .unwrap_or(channel_pre.collaborators)
                );

                assert_eq!(
                    channel_post.data_objects,
                    channel_pre
                        .data_objects
                        .union(&BTreeSet::from_iter(beg_obj_id..end_obj_id))
                        .cloned()
                        .collect::<BTreeSet<_>>()
                        .difference(&self.params.assets_to_remove)
                        .cloned()
                        .collect::<BTreeSet<_>>()
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

pub struct UpdateChannelPrivilegeLevelFixture {
    sender: AccountId,
    channel_id: ChannelId,
    privilege_level: <Test as Trait>::ChannelPrivilegeLevel,
}

impl UpdateChannelPrivilegeLevelFixture {
    pub fn default() -> Self {
        Self {
            sender: LEAD_ACCOUNT_ID,
            channel_id: ChannelId::one(), // channel index starts at 1
            privilege_level: <Test as Trait>::ChannelPrivilegeLevel::one(), // default privilege level is 0
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_channel_id(self, channel_id: ChannelId) -> Self {
        Self { channel_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender.clone());
        let channel_pre = Content::channel_by_id(&self.channel_id);
        let actual_result =
            Content::update_channel_privilege_level(origin, self.channel_id, self.privilege_level);
        let channel_post = Content::channel_by_id(&self.channel_id);
        assert_eq!(actual_result, expected_result);
        match actual_result {
            Ok(()) => {
                // Event emitted
                assert_eq!(
                    System::events().last().unwrap().event,
                    MetaEvent::content(RawEvent::ChannelPrivilegeLevelUpdated(
                        self.channel_id,
                        self.privilege_level,
                    ))
                );
                // Privilege level updated
                assert_eq!(channel_post.privilege_level, self.privilege_level);
            }
            Err(_err) => {
                // Channel not changed
                assert_eq!(channel_pre, channel_post);
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
                auto_issue_nft: Default::default(),
                expected_data_object_deletion_prize: Default::default(),
            },
        }
    }

    pub fn with_new_meta(self, new_meta: Option<Vec<u8>>) -> Self {
        Self {
            params: VideoUpdateParameters::<Test> {
                new_meta,
                ..self.params.clone()
            },
            ..self
        }
    }

    pub fn with_data_object_deletion_prize(self, expected_data_object_deletion_prize: u64) -> Self {
        Self {
            params: VideoUpdateParameters::<Test> {
                expected_data_object_deletion_prize,
                ..self.params.clone()
            },
            ..self
        }
    }

    pub fn with_nft_issuance(self, params: NftIssuanceParameters<Test>) -> Self {
        Self {
            params: VideoUpdateParameters::<Test> {
                auto_issue_nft: Some(params),
                ..self.params
            },
            ..self
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

        let deletion_prize = DATA_OBJECT_DELETION_PRIZE;

        let deletion_prize_deposited =
            self.params
                .assets_to_upload
                .as_ref()
                .map_or(BalanceOf::<Test>::zero(), |assets| {
                    assets
                        .object_creation_list
                        .iter()
                        .fold(BalanceOf::<Test>::zero(), |acc, _| {
                            acc.saturating_add(deletion_prize)
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
                        self.params.clone(),
                        BTreeSet::from_iter(beg_obj_id..end_obj_id),
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

pub struct DeleteChannelAssetsAsModeratorFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: ChannelId,
    assets_to_remove: BTreeSet<DataObjectId<Test>>,
    rationale: Vec<u8>,
}

impl DeleteChannelAssetsAsModeratorFixture {
    pub fn default() -> Self {
        Self {
            sender: LEAD_ACCOUNT_ID,
            actor: ContentActor::Lead,
            channel_id: ChannelId::one(),
            assets_to_remove: BTreeSet::from_iter(0..DATA_OBJECTS_NUMBER),
            rationale: b"rationale".to_vec(),
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

    pub fn with_assets_to_remove(self, assets_to_remove: BTreeSet<DataObjectId<Test>>) -> Self {
        Self {
            assets_to_remove,
            ..self
        }
    }
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender.clone());
        let balance_pre = Balances::<Test>::usable_balance(self.sender);
        let channel_pre = Content::channel_by_id(&self.channel_id);
        let bag_id_for_channel = Content::bag_id_for_channel(&self.channel_id);

        let deletion_prize_withdrawn = if !self.assets_to_remove.is_empty() {
            self.assets_to_remove
                .iter()
                .fold(BalanceOf::<Test>::zero(), |acc, obj_id| {
                    acc + storage::DataObjectsById::<Test>::get(&bag_id_for_channel, obj_id)
                        .deletion_prize
                })
        } else {
            BalanceOf::<Test>::zero()
        };

        let actual_result = Content::delete_channel_assets_as_moderator(
            origin,
            self.actor.clone(),
            self.channel_id,
            self.assets_to_remove.clone(),
            self.rationale.clone(),
        );

        let balance_post = Balances::<Test>::usable_balance(self.sender);
        let channel_post = Content::channel_by_id(&self.channel_id);

        assert_eq!(actual_result, expected_result);

        match actual_result {
            Ok(()) => {
                assert_eq!(
                    System::events().last().unwrap().event,
                    MetaEvent::content(RawEvent::ChannelAssetsDeletedByModerator(
                        self.actor.clone(),
                        self.channel_id,
                        self.assets_to_remove.clone(),
                        self.rationale.clone(),
                    ))
                );

                assert_eq!(
                    balance_post.saturating_sub(balance_pre),
                    deletion_prize_withdrawn,
                );

                assert_eq!(
                    channel_post.data_objects,
                    BTreeSet::from_iter(
                        channel_pre
                            .data_objects
                            .difference(&self.assets_to_remove)
                            .cloned(),
                    ),
                );

                assert!(!self.assets_to_remove.iter().any(|obj_id| {
                    storage::DataObjectsById::<Test>::contains_key(&bag_id_for_channel, obj_id)
                }));
            }
            Err(err) => {
                assert_eq!(channel_pre, channel_post);
                assert_eq!(balance_pre, balance_post);

                if err != Error::<Test>::ChannelDoesNotExist.into() {
                    assert!(channel_pre.data_objects.iter().all(|obj_id| {
                        storage::DataObjectsById::<Test>::contains_key(&bag_id_for_channel, obj_id)
                    }));
                }
            }
        }
    }
}

pub trait ChannelDeletion {
    fn get_sender(&self) -> &AccountId;
    fn get_channel_id(&self) -> &ChannelId;
    fn get_actor(&self) -> &ContentActor<CuratorGroupId, CuratorId, MemberId>;
    fn get_num_objects_to_delete(&self) -> u64;
    fn execute_call(&self) -> DispatchResult;
    fn expected_event_on_success(&self) -> MetaEvent;

    fn call_and_assert(&self, expected_result: DispatchResult) {
        let balance_pre = Balances::<Test>::usable_balance(self.get_sender());
        let bag_id_for_channel = Content::bag_id_for_channel(&self.get_channel_id());
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

        let actual_result = self.execute_call();

        let balance_post = Balances::<Test>::usable_balance(self.get_sender());
        assert_eq!(actual_result, expected_result);

        match actual_result {
            Ok(()) => {
                assert_eq!(
                    System::events().last().unwrap().event,
                    self.expected_event_on_success()
                );

                let deletion_prize = bag_deletion_prize.saturating_add(objects_deletion_prize);

                assert_eq!(balance_post.saturating_sub(balance_pre), deletion_prize,);
                assert!(!<ChannelById<Test>>::contains_key(&self.get_channel_id()));
                assert!(!channel_objects_ids.iter().any(|id| {
                    storage::DataObjectsById::<Test>::contains_key(&bag_id_for_channel, id)
                }));
                assert!(!storage::Bags::<Test>::contains_key(&bag_id_for_channel));
            }

            Err(err) => {
                assert_eq!(balance_pre, balance_post);
                if err != Error::<Test>::ChannelDoesNotExist.into() {
                    assert!(ChannelById::<Test>::contains_key(&self.get_channel_id()));
                    assert!(channel_objects_ids.iter().all(|id| {
                        storage::DataObjectsById::<Test>::contains_key(&bag_id_for_channel, id)
                    }));
                    assert!(storage::Bags::<Test>::contains_key(&bag_id_for_channel));
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
}

impl ChannelDeletion for DeleteChannelFixture {
    fn get_sender(&self) -> &AccountId {
        &self.sender
    }
    fn get_channel_id(&self) -> &ChannelId {
        &self.channel_id
    }
    fn get_actor(&self) -> &ContentActor<CuratorGroupId, CuratorId, MemberId> {
        &self.actor
    }
    fn get_num_objects_to_delete(&self) -> u64 {
        self.num_objects_to_delete
    }

    fn execute_call(&self) -> DispatchResult {
        Content::delete_channel(
            Origin::signed(self.sender.clone()),
            self.actor.clone(),
            self.channel_id,
            self.num_objects_to_delete,
        )
    }

    fn expected_event_on_success(&self) -> MetaEvent {
        MetaEvent::content(RawEvent::ChannelDeleted(
            self.actor.clone(),
            self.channel_id,
        ))
    }
}

pub struct DeleteChannelAsModeratorFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: ChannelId,
    num_objects_to_delete: u64,
    rationale: Vec<u8>,
}

impl DeleteChannelAsModeratorFixture {
    pub fn default() -> Self {
        Self {
            sender: LEAD_ACCOUNT_ID,
            actor: ContentActor::Lead,
            channel_id: ChannelId::one(),
            num_objects_to_delete: DATA_OBJECTS_NUMBER as u64,
            rationale: b"rationale".to_vec(),
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
}

impl ChannelDeletion for DeleteChannelAsModeratorFixture {
    fn get_sender(&self) -> &AccountId {
        &self.sender
    }
    fn get_channel_id(&self) -> &ChannelId {
        &self.channel_id
    }
    fn get_actor(&self) -> &ContentActor<CuratorGroupId, CuratorId, MemberId> {
        &self.actor
    }
    fn get_num_objects_to_delete(&self) -> u64 {
        self.num_objects_to_delete
    }

    fn execute_call(&self) -> DispatchResult {
        Content::delete_channel_as_moderator(
            Origin::signed(self.sender.clone()),
            self.actor.clone(),
            self.channel_id,
            self.num_objects_to_delete,
            self.rationale.clone(),
        )
    }

    fn expected_event_on_success(&self) -> MetaEvent {
        MetaEvent::content(RawEvent::ChannelDeletedByModerator(
            self.actor.clone(),
            self.channel_id,
            self.rationale.clone(),
        ))
    }
}

pub struct SetChannelPausedFeaturesAsModeratorFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: ChannelId,
    new_paused_features: BTreeSet<PausableChannelFeature>,
    rationale: Vec<u8>,
}

impl SetChannelPausedFeaturesAsModeratorFixture {
    pub fn default() -> Self {
        Self {
            sender: LEAD_ACCOUNT_ID,
            actor: ContentActor::Lead,
            channel_id: ChannelId::one(),
            new_paused_features: BTreeSet::from_iter(vec![PausableChannelFeature::default()]),
            rationale: b"rationale".to_vec(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn with_new_paused_features(
        self,
        new_paused_features: BTreeSet<PausableChannelFeature>,
    ) -> Self {
        Self {
            new_paused_features,
            ..self
        }
    }

    pub fn with_channel_id(self, channel_id: ChannelId) -> Self {
        Self { channel_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let channel_pre = ChannelById::<Test>::get(&self.channel_id);

        let actual_result = Content::set_channel_paused_features_as_moderator(
            Origin::signed(self.sender.clone()),
            self.actor.clone(),
            self.channel_id,
            self.new_paused_features.clone(),
            self.rationale.clone(),
        );

        assert_eq!(actual_result, expected_result);

        let channel_post = ChannelById::<Test>::get(&self.channel_id);

        if actual_result.is_ok() {
            assert_eq!(channel_post.paused_features, self.new_paused_features);
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::ChannelPausedFeaturesUpdatedByModerator(
                    self.actor.clone(),
                    self.channel_id,
                    self.new_paused_features.clone(),
                    self.rationale.clone(),
                ))
            );
        } else {
            assert_eq!(channel_post, channel_pre);
        }
    }
}

pub struct SetChannelVisibilityAsModeratorFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: ChannelId,
    is_hidden: bool,
    rationale: Vec<u8>,
}

impl SetChannelVisibilityAsModeratorFixture {
    pub fn default() -> Self {
        Self {
            sender: LEAD_ACCOUNT_ID,
            actor: ContentActor::Lead,
            channel_id: ChannelId::one(),
            is_hidden: true,
            rationale: b"rationale".to_vec(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn with_is_hidden(self, is_hidden: bool) -> Self {
        Self { is_hidden, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Content::set_channel_visibility_as_moderator(
            Origin::signed(self.sender.clone()),
            self.actor.clone(),
            self.channel_id,
            self.is_hidden,
            self.rationale.clone(),
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::ChannelVisibilitySetByModerator(
                    self.actor.clone(),
                    self.channel_id,
                    self.is_hidden,
                    self.rationale.clone(),
                ))
            );
        }
    }
}

pub struct SetVideoVisibilityAsModeratorFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    video_id: VideoId,
    is_hidden: bool,
    rationale: Vec<u8>,
}

impl SetVideoVisibilityAsModeratorFixture {
    pub fn default() -> Self {
        Self {
            sender: LEAD_ACCOUNT_ID,
            actor: ContentActor::Lead,
            video_id: VideoId::one(),
            is_hidden: true,
            rationale: b"rationale".to_vec(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn with_is_hidden(self, is_hidden: bool) -> Self {
        Self { is_hidden, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Content::set_video_visibility_as_moderator(
            Origin::signed(self.sender.clone()),
            self.actor.clone(),
            self.video_id,
            self.is_hidden,
            self.rationale.clone(),
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::VideoVisibilitySetByModerator(
                    self.actor.clone(),
                    self.video_id,
                    self.is_hidden,
                    self.rationale.clone(),
                ))
            );
        }
    }
}

pub struct DeleteVideoAssetsAsModeratorFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    video_id: VideoId,
    assets_to_remove: BTreeSet<DataObjectId<Test>>,
    rationale: Vec<u8>,
}

impl DeleteVideoAssetsAsModeratorFixture {
    pub fn default() -> Self {
        Self {
            sender: LEAD_ACCOUNT_ID,
            actor: ContentActor::Lead,
            video_id: VideoId::one(),
            assets_to_remove: BTreeSet::from_iter(DATA_OBJECTS_NUMBER..(2 * DATA_OBJECTS_NUMBER)),
            rationale: b"rationale".to_vec(),
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

    pub fn with_assets_to_remove(self, assets_to_remove: BTreeSet<DataObjectId<Test>>) -> Self {
        Self {
            assets_to_remove,
            ..self
        }
    }
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender.clone());
        let balance_pre = Balances::<Test>::usable_balance(self.sender);
        let video_pre = Content::video_by_id(&self.video_id);
        let bag_id_for_channel = Content::bag_id_for_channel(&video_pre.in_channel);

        let deletion_prize_withdrawn = if !self.assets_to_remove.is_empty() {
            self.assets_to_remove
                .iter()
                .fold(BalanceOf::<Test>::zero(), |acc, obj_id| {
                    acc + storage::DataObjectsById::<Test>::get(&bag_id_for_channel, obj_id)
                        .deletion_prize
                })
        } else {
            BalanceOf::<Test>::zero()
        };

        let actual_result = Content::delete_video_assets_as_moderator(
            origin,
            self.actor.clone(),
            self.video_id,
            self.assets_to_remove.clone(),
            self.rationale.clone(),
        );

        let balance_post = Balances::<Test>::usable_balance(self.sender);
        let video_post = Content::video_by_id(&self.video_id);

        assert_eq!(actual_result, expected_result);

        match actual_result {
            Ok(()) => {
                assert_eq!(
                    System::events().last().unwrap().event,
                    MetaEvent::content(RawEvent::VideoAssetsDeletedByModerator(
                        self.actor.clone(),
                        self.video_id,
                        self.assets_to_remove.clone(),
                        video_pre.nft_status.is_some(),
                        self.rationale.clone(),
                    ))
                );

                assert_eq!(
                    balance_post.saturating_sub(balance_pre),
                    deletion_prize_withdrawn,
                );

                assert_eq!(
                    video_post.data_objects,
                    BTreeSet::from_iter(
                        video_pre
                            .data_objects
                            .difference(&self.assets_to_remove)
                            .cloned(),
                    ),
                );

                assert!(!self.assets_to_remove.iter().any(|obj_id| {
                    storage::DataObjectsById::<Test>::contains_key(&bag_id_for_channel, obj_id)
                }));
            }
            Err(err) => {
                assert_eq!(video_pre, video_post);
                assert_eq!(balance_pre, balance_post);

                if err != Error::<Test>::VideoDoesNotExist.into() {
                    assert!(video_pre.data_objects.iter().all(|obj_id| {
                        storage::DataObjectsById::<Test>::contains_key(&bag_id_for_channel, obj_id)
                    }));
                }
            }
        }
    }
}

pub trait VideoDeletion {
    fn get_sender(&self) -> &AccountId;
    fn get_video_id(&self) -> &VideoId;
    fn get_actor(&self) -> &ContentActor<CuratorGroupId, CuratorId, MemberId>;
    fn execute_call(&self) -> DispatchResult;
    fn expected_event_on_success(&self) -> MetaEvent;

    fn call_and_assert(&self, expected_result: DispatchResult) {
        let balance_pre = Balances::<Test>::usable_balance(self.get_sender());
        let video_pre = <VideoById<Test>>::get(&self.get_video_id());
        let channel_bag_id = Content::bag_id_for_channel(&video_pre.in_channel);
        let deletion_prize =
            video_pre
                .data_objects
                .iter()
                .fold(BalanceOf::<Test>::zero(), |acc, obj_id| {
                    acc + storage::DataObjectsById::<Test>::get(&channel_bag_id, obj_id)
                        .deletion_prize
                });

        let actual_result = self.execute_call();

        let balance_post = Balances::<Test>::usable_balance(self.get_sender());

        assert_eq!(actual_result, expected_result);

        match actual_result {
            Ok(()) => {
                assert_eq!(
                    System::events().last().unwrap().event,
                    self.expected_event_on_success()
                );

                assert_eq!(balance_post.saturating_sub(balance_pre), deletion_prize);

                assert!(!video_pre.data_objects.iter().any(|obj_id| {
                    storage::DataObjectsById::<Test>::contains_key(&channel_bag_id, obj_id)
                }));

                assert!(!<VideoById<Test>>::contains_key(self.get_video_id()));
            }
            Err(err) => {
                assert_eq!(balance_pre, balance_post);

                if err == storage::Error::<Test>::DataObjectDoesntExist.into() {
                    let video_post = <VideoById<Test>>::get(self.get_video_id());
                    assert_eq!(video_pre, video_post);
                    assert!(VideoById::<Test>::contains_key(&self.get_video_id()));
                } else if err == Error::<Test>::VideoDoesNotExist.into() {
                    assert!(video_pre.data_objects.iter().all(|id| {
                        storage::DataObjectsById::<Test>::contains_key(&channel_bag_id, id)
                    }));
                } else {
                    let video_post = <VideoById<Test>>::get(self.get_video_id());
                    assert_eq!(video_pre, video_post);
                    assert!(VideoById::<Test>::contains_key(self.get_video_id()));
                    assert!(video_pre.data_objects.iter().all(|id| {
                        storage::DataObjectsById::<Test>::contains_key(&channel_bag_id, id)
                    }));
                }
            }
        }
    }
}

pub struct DeleteVideoFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    video_id: VideoId,
    num_objects_to_delete: u64,
}

impl DeleteVideoFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id: VideoId::one(),
            num_objects_to_delete: DATA_OBJECTS_NUMBER,
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

    pub fn with_video_id(self, video_id: VideoId) -> Self {
        Self { video_id, ..self }
    }
}

impl VideoDeletion for DeleteVideoFixture {
    fn get_sender(&self) -> &AccountId {
        &self.sender
    }
    fn get_video_id(&self) -> &VideoId {
        &self.video_id
    }
    fn get_actor(&self) -> &ContentActor<CuratorGroupId, CuratorId, MemberId> {
        &self.actor
    }

    fn execute_call(&self) -> DispatchResult {
        Content::delete_video(
            Origin::signed(self.sender.clone()),
            self.actor.clone(),
            self.video_id,
            self.num_objects_to_delete,
        )
    }

    fn expected_event_on_success(&self) -> MetaEvent {
        MetaEvent::content(RawEvent::VideoDeleted(self.actor.clone(), self.video_id))
    }
}

pub struct DeleteVideoAsModeratorFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    video_id: VideoId,
    num_objects_to_delete: u64,
    rationale: Vec<u8>,
}

impl DeleteVideoAsModeratorFixture {
    pub fn default() -> Self {
        Self {
            sender: LEAD_ACCOUNT_ID,
            actor: ContentActor::Lead,
            video_id: VideoId::one(),
            num_objects_to_delete: DATA_OBJECTS_NUMBER,
            rationale: b"rationale".to_vec(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }
}

impl VideoDeletion for DeleteVideoAsModeratorFixture {
    fn get_sender(&self) -> &AccountId {
        &self.sender
    }
    fn get_video_id(&self) -> &VideoId {
        &self.video_id
    }
    fn get_actor(&self) -> &ContentActor<CuratorGroupId, CuratorId, MemberId> {
        &self.actor
    }

    fn execute_call(&self) -> DispatchResult {
        Content::delete_video_as_moderator(
            Origin::signed(self.sender.clone()),
            self.actor.clone(),
            self.video_id,
            self.num_objects_to_delete,
            self.rationale.clone(),
        )
    }

    fn expected_event_on_success(&self) -> MetaEvent {
        MetaEvent::content(RawEvent::VideoDeletedByModerator(
            self.actor.clone(),
            self.video_id,
            self.rationale.clone(),
        ))
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
        let reward_account = ContentTreasury::<Test>::account_for_channel(self.item.channel_id);
        let balance_pre = Balances::<Test>::usable_balance(&reward_account);
        let payout_earned_pre =
            Content::channel_by_id(self.item.channel_id).cumulative_payout_earned;

        let proof = if self.payments.is_empty() {
            vec![]
        } else {
            build_merkle_path_helper(&self.payments, DEFAULT_PROOF_INDEX)
        };

        let actual_result =
            Content::claim_channel_reward(origin, self.actor.clone(), proof, self.item.clone());

        let balance_post = Balances::<Test>::usable_balance(&reward_account);
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
    transfer_status: ChannelTransferStatus<MemberId, CuratorGroupId, BalanceOf<Test>>,
}

impl UpdateChannelTransferStatusFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID),
            channel_id: ChannelId::one(),
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            transfer_status: Default::default(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self {
            origin: RawOrigin::Signed(sender),
            ..self
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

    pub fn with_collaborators(self, new_collaborators: BTreeSet<MemberId>) -> Self {
        let old_transfer_params = self.get_transfer_params();
        self.with_transfer_parameters(TransferParameters {
            new_collaborators,
            ..old_transfer_params
        })
    }

    pub fn with_price(self, price: u64) -> Self {
        let old_transfer_params = self.get_transfer_params();
        self.with_transfer_parameters(TransferParameters {
            price,
            ..old_transfer_params
        })
    }

    pub fn with_transfer_status(
        self,
        transfer_status: ChannelTransferStatus<MemberId, CuratorGroupId, BalanceOf<Test>>,
    ) -> Self {
        Self {
            transfer_status,
            ..self
        }
    }

    pub fn with_new_member_channel_owner(self, member_id: MemberId) -> Self {
        let old_pending_transfer_params = self.get_pending_transfer_params();
        self.with_transfer_status(ChannelTransferStatus::PendingTransfer(PendingTransfer::<
            MemberId,
            CuratorGroupId,
            BalanceOf<Test>,
        > {
            new_owner: ChannelOwner::Member(member_id),
            ..old_pending_transfer_params
        }))
    }

    pub fn with_new_channel_owner(self, owner: ChannelOwner<MemberId, CuratorGroupId>) -> Self {
        let old_pending_transfer_params = self.get_pending_transfer_params();
        self.with_transfer_status(ChannelTransferStatus::PendingTransfer(PendingTransfer::<
            MemberId,
            CuratorGroupId,
            BalanceOf<Test>,
        > {
            new_owner: owner,
            ..old_pending_transfer_params
        }))
    }

    fn get_pending_transfer_params(
        &self,
    ) -> PendingTransfer<MemberId, CuratorGroupId, BalanceOf<Test>> {
        if let ChannelTransferStatus::PendingTransfer(transfer_status) =
            self.transfer_status.clone()
        {
            transfer_status
        } else {
            Default::default()
        }
    }

    fn get_transfer_params(&self) -> TransferParameters<MemberId, BalanceOf<Test>> {
        if let ChannelTransferStatus::PendingTransfer(transfer_status) =
            self.transfer_status.clone()
        {
            transfer_status.transfer_params
        } else {
            Default::default()
        }
    }

    pub fn with_transfer_parameters(
        self,
        transfer_params: TransferParameters<MemberId, BalanceOf<Test>>,
    ) -> Self {
        let old_pending_transfer_params = self.get_pending_transfer_params();
        self.with_transfer_status(ChannelTransferStatus::PendingTransfer(PendingTransfer::<
            MemberId,
            CuratorGroupId,
            BalanceOf<Test>,
        > {
            transfer_params,
            ..old_pending_transfer_params
        }))
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_channel = Content::channel_by_id(self.channel_id);

        let actual_result = Content::update_channel_transfer_status(
            self.origin.clone().into(),
            self.channel_id,
            self.actor.clone(),
            self.transfer_status.clone(),
        );

        assert_eq!(actual_result, expected_result);

        let new_channel = Content::channel_by_id(self.channel_id);
        if actual_result.is_ok() {
            assert_eq!(new_channel.transfer_status, self.transfer_status.clone());
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::UpdateChannelTransferStatus(
                    self.channel_id,
                    self.actor.clone(),
                    self.transfer_status.clone()
                ))
            );
        } else {
            assert_eq!(new_channel.transfer_status, old_channel.transfer_status,);
        }
    }
}

pub struct AcceptChannelTransferFixture {
    origin: RawOrigin<u64>,
    channel_id: u64,
    params: TransferParameters<MemberId, BalanceOf<Test>>,
}

impl AcceptChannelTransferFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID),
            channel_id: ChannelId::one(),
            params: TransferParameters::default(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_channel_id(self, channel_id: ChannelId) -> Self {
        Self { channel_id, ..self }
    }

    pub fn with_transfer_params(
        self,
        params: TransferParameters<MemberId, BalanceOf<Test>>,
    ) -> Self {
        Self { params, ..self }
    }

    pub fn with_price(self, price: u64) -> Self {
        let old_transfer_params = self.params.clone();
        self.with_transfer_params(TransferParameters {
            price,
            ..old_transfer_params
        })
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_channel = Content::channel_by_id(self.channel_id);

        let actual_result = Content::accept_channel_transfer(
            self.origin.clone().into(),
            self.channel_id,
            self.params.clone(),
        );

        assert_eq!(actual_result, expected_result);

        let new_channel = Content::channel_by_id(self.channel_id);
        if actual_result.is_ok() {
            assert_eq!(
                new_channel.transfer_status,
                ChannelTransferStatus::NoActiveTransfer
            );
            let channel_owner = if let ChannelTransferStatus::PendingTransfer(ref params) =
                old_channel.transfer_status
            {
                params.new_owner.clone()
            } else {
                panic!("Invalid transfer status")
            };

            assert_eq!(new_channel.owner, channel_owner);
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::ChannelTransferAccepted(
                    self.channel_id,
                    self.params.clone()
                ))
            );
        } else {
            assert_eq!(new_channel.transfer_status, old_channel.transfer_status,);
        }
    }
}

pub struct ClaimCouncilRewardFixture {
    origin: RawOrigin<u64>,
    channel_id: u64,
    expected_reward: BalanceOf<Test>,
}

impl ClaimCouncilRewardFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID),
            channel_id: ChannelId::one(),
            expected_reward: Default::default(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_expected_reward(self, expected_reward: BalanceOf<Test>) -> Self {
        Self {
            expected_reward,
            ..self
        }
    }

    pub fn with_channel_id(self, channel_id: ChannelId) -> Self {
        Self { channel_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result =
            Content::claim_council_reward(self.origin.clone().into(), self.channel_id);

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::CouncilRewardClaimed(
                    self.channel_id,
                    self.expected_reward
                ))
            );
        }
    }
}

pub struct IssueNftFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    video_id: VideoId,
    params: NftIssuanceParameters<Test>,
}

impl IssueNftFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id: VideoId::one(),
            params: NftIssuanceParameters::<Test>::default(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    #[allow(dead_code)]
    pub fn with_video_id(self, video_id: VideoId) -> Self {
        Self { video_id, ..self }
    }

    #[allow(dead_code)]
    pub fn with_params(self, params: NftIssuanceParameters<Test>) -> Self {
        Self { params, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let video_pre = Content::video_by_id(self.video_id);

        let actual_result = Content::issue_nft(
            Origin::signed(self.sender.clone()),
            self.actor.clone(),
            self.video_id,
            self.params.clone(),
        );

        assert_eq!(actual_result, expected_result);

        let video_post = Content::video_by_id(self.video_id);

        let expected_nft_status = match self.params.init_transactional_status.clone() {
            InitTransactionalStatus::<Test>::Idle => TransactionalStatus::<Test>::Idle,
            InitTransactionalStatus::<Test>::InitiatedOfferToMember(member, balance) => {
                TransactionalStatus::<Test>::InitiatedOfferToMember(member, balance)
            }
            InitTransactionalStatus::<Test>::BuyNow(balance) => {
                TransactionalStatus::<Test>::BuyNow(balance)
            }
            InitTransactionalStatus::<Test>::EnglishAuction(params) => {
                TransactionalStatus::<Test>::EnglishAuction(EnglishAuction::<Test>::new(params))
            }
            // FIXME: Impossible currently!
            InitTransactionalStatus::<Test>::OpenAuction(params) => {
                TransactionalStatus::<Test>::OpenAuction(OpenAuction::<Test>::new(
                    params,
                    One::one(),
                ))
            }
        };

        if actual_result.is_ok() {
            assert!(video_post.nft_status.is_some());
            let nft_status = video_post.nft_status.unwrap();
            assert_eq!(
                nft_status.owner,
                self.params
                    .non_channel_owner
                    .map_or(NftOwner::ChannelOwner, |m_id| NftOwner::Member(m_id))
            );
            assert_eq!(nft_status.transactional_status, expected_nft_status);
            assert_eq!(nft_status.creator_royalty, self.params.royalty);
            assert_eq!(
                nft_status.open_auctions_nonce,
                <Test as Trait>::OpenAuctionId::zero()
            );
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::NftIssued(
                    self.actor.clone(),
                    self.video_id,
                    self.params.clone()
                ))
            );
        } else {
            assert_eq!(video_post, video_pre);
        }
    }
}

pub struct StartOpenAuctionFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    video_id: VideoId,
    params: OpenAuctionParams<Test>,
}

impl StartOpenAuctionFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id: VideoId::one(),
            params: OpenAuctionParams::<Test> {
                starting_price: Content::min_starting_price(),
                buy_now_price: None,
                bid_lock_duration: Content::min_bid_lock_duration(),
                whitelist: BTreeSet::new(),
            },
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    #[allow(dead_code)]
    pub fn with_video_id(self, video_id: VideoId) -> Self {
        Self { video_id, ..self }
    }

    #[allow(dead_code)]
    pub fn with_params(self, params: OpenAuctionParams<Test>) -> Self {
        Self { params, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let video_pre = Content::video_by_id(self.video_id);

        let actual_result = Content::start_open_auction(
            Origin::signed(self.sender.clone()),
            self.actor.clone(),
            self.video_id,
            self.params.clone(),
        );

        assert_eq!(actual_result, expected_result);

        let video_post = Content::video_by_id(self.video_id);

        if actual_result.is_ok() {
            assert!(video_pre.nft_status.is_some());
            assert!(video_post.nft_status.is_some());
            let pre_nft_status = video_pre.nft_status.unwrap();
            let nft_status = video_post.nft_status.unwrap();
            assert_eq!(
                nft_status,
                Nft::<Test> {
                    transactional_status: TransactionalStatus::<Test>::OpenAuction(OpenAuction::<
                        Test,
                    >::new(
                        self.params.clone(),
                        pre_nft_status.open_auctions_nonce.saturating_add(1)
                    )),
                    open_auctions_nonce: pre_nft_status.open_auctions_nonce.saturating_add(1),
                    ..pre_nft_status
                }
            );
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::OpenAuctionStarted(
                    self.actor.clone(),
                    self.video_id,
                    self.params.clone(),
                    pre_nft_status.open_auctions_nonce.saturating_add(1)
                ))
            );
        } else {
            assert_eq!(video_post, video_pre);
        }
    }
}

pub struct StartEnglishAuctionFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    video_id: VideoId,
    params: EnglishAuctionParams<Test>,
}

impl StartEnglishAuctionFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id: VideoId::one(),
            params: EnglishAuctionParams::<Test> {
                starting_price: Content::min_starting_price(),
                buy_now_price: None,
                extension_period: Content::min_auction_extension_period(),
                auction_duration: Content::min_auction_duration(),
                min_bid_step: Content::min_bid_step(),
                end: 10,
                whitelist: BTreeSet::new(),
            },
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    #[allow(dead_code)]
    pub fn with_video_id(self, video_id: VideoId) -> Self {
        Self { video_id, ..self }
    }

    #[allow(dead_code)]
    pub fn with_params(self, params: EnglishAuctionParams<Test>) -> Self {
        Self { params, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let video_pre = Content::video_by_id(self.video_id);

        let actual_result = Content::start_english_auction(
            Origin::signed(self.sender.clone()),
            self.actor.clone(),
            self.video_id,
            self.params.clone(),
        );

        assert_eq!(actual_result, expected_result);

        let video_post = Content::video_by_id(self.video_id);

        if actual_result.is_ok() {
            assert!(video_pre.nft_status.is_some());
            assert!(video_post.nft_status.is_some());
            let pre_nft_status = video_pre.nft_status.unwrap();
            let nft_status = video_post.nft_status.unwrap();
            assert_eq!(
                nft_status,
                Nft::<Test> {
                    transactional_status: TransactionalStatus::<Test>::EnglishAuction(
                        EnglishAuction::<Test>::new(self.params.clone(),)
                    ),
                    ..pre_nft_status
                }
            );
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::EnglishAuctionStarted(
                    self.actor.clone(),
                    self.video_id,
                    self.params.clone(),
                ))
            );
        } else {
            assert_eq!(video_post, video_pre);
        }
    }
}

pub struct OfferNftFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    video_id: VideoId,
    to: MemberId,
    price: Option<BalanceOf<Test>>,
}

impl OfferNftFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id: VideoId::one(),
            to: SECOND_MEMBER_ID,
            price: None,
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    #[allow(dead_code)]
    pub fn with_video_id(self, video_id: VideoId) -> Self {
        Self { video_id, ..self }
    }

    #[allow(dead_code)]
    pub fn with_to(self, to: MemberId) -> Self {
        Self { to, ..self }
    }

    #[allow(dead_code)]
    pub fn with_price(self, price: Option<BalanceOf<Test>>) -> Self {
        Self { price, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let video_pre = Content::video_by_id(self.video_id);

        let actual_result = Content::offer_nft(
            Origin::signed(self.sender.clone()),
            self.video_id,
            self.actor.clone(),
            self.to,
            self.price,
        );

        assert_eq!(actual_result, expected_result);

        let video_post = Content::video_by_id(self.video_id);

        if actual_result.is_ok() {
            assert!(video_pre.nft_status.is_some());
            assert!(video_post.nft_status.is_some());
            let pre_nft_status = video_pre.nft_status.unwrap();
            let nft_status = video_post.nft_status.unwrap();
            assert_eq!(
                nft_status,
                Nft::<Test> {
                    transactional_status: TransactionalStatus::<Test>::InitiatedOfferToMember(
                        self.to, self.price
                    ),
                    ..pre_nft_status
                }
            );
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::OfferStarted(
                    self.video_id,
                    self.actor.clone(),
                    self.to,
                    self.price
                ))
            );
        } else {
            assert_eq!(video_post, video_pre);
        }
    }
}

pub struct MakeOpenAuctionBidFixture {
    sender: AccountId,
    member_id: MemberId,
    video_id: VideoId,
    bid: BalanceOf<Test>,
}

impl MakeOpenAuctionBidFixture {
    pub fn default() -> Self {
        Self {
            sender: SECOND_MEMBER_ACCOUNT_ID,
            member_id: SECOND_MEMBER_ID,
            video_id: VideoId::one(),
            bid: Content::min_starting_price().saturating_add(Content::min_bid_step()),
        }
    }

    #[allow(dead_code)]
    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    #[allow(dead_code)]
    pub fn with_member(self, member_id: MemberId) -> Self {
        Self { member_id, ..self }
    }

    #[allow(dead_code)]
    pub fn with_video_id(self, video_id: VideoId) -> Self {
        Self { video_id, ..self }
    }

    #[allow(dead_code)]
    pub fn with_bid(self, bid: BalanceOf<Test>) -> Self {
        Self { bid, ..self }
    }

    pub fn create_auction_state_snapshot(&self) -> NftAuctionStateSnapshot {
        let video = Content::video_by_id(self.video_id);
        let winner_account =
            MemberInfoProvider::controller_account_id(self.member_id).map_or(None, |a| Some(a));
        let channel_account = ContentTreasury::<Test>::account_for_channel(video.in_channel);
        let owner_account = video.nft_status.as_ref().map(|s| match s.owner {
            NftOwner::Member(member_id) => {
                MemberInfoProvider::controller_account_id(member_id).unwrap()
            }
            NftOwner::ChannelOwner => {
                ContentTreasury::<Test>::account_for_channel(video.in_channel)
            }
        });

        NftAuctionStateSnapshot {
            video: Content::video_by_id(self.video_id),
            winner_reserved_balance: winner_account.map(|a| Balances::<Test>::reserved_balance(a)),
            winner_total_balance: winner_account.map(|a| Balances::<Test>::total_balance(&a)),
            owner_balance: owner_account.map(|a| Balances::<Test>::usable_balance(a)),
            channel_balance: Balances::<Test>::usable_balance(channel_account),
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let snapshot_pre = Self::create_auction_state_snapshot(&self);
        let bid_pre = Content::open_auction_bid_by_video_and_member(self.video_id, self.member_id);

        let actual_result = Content::make_open_auction_bid(
            Origin::signed(self.sender.clone()),
            self.member_id,
            self.video_id,
            self.bid,
        );

        assert_eq!(actual_result, expected_result);

        let snapshot_post = Self::create_auction_state_snapshot(&self);
        let bid_post = Content::open_auction_bid_by_video_and_member(self.video_id, self.member_id);

        if actual_result.is_ok() {
            assert!(snapshot_pre.video.nft_status.is_some());
            let nft_status_pre = snapshot_pre.video.nft_status.clone().unwrap();
            match nft_status_pre.transactional_status {
                TransactionalStatus::<Test>::OpenAuction(params) => {
                    if params.buy_now_price.is_none() || self.bid < params.buy_now_price.unwrap() {
                        assert_eq!(snapshot_post.video, snapshot_pre.video);
                        assert_eq!(bid_post.amount, self.bid);
                        assert_eq!(bid_post.auction_id, nft_status_pre.open_auctions_nonce);
                        assert_eq!(
                            System::events().last().unwrap().event,
                            MetaEvent::content(RawEvent::AuctionBidMade(
                                self.member_id,
                                self.video_id,
                                self.bid,
                            ))
                        );
                    } else {
                        assert_auction_completed_successfuly(
                            self.video_id,
                            self.member_id,
                            self.bid,
                            snapshot_pre,
                            snapshot_post,
                            true,
                        );
                        assert_eq!(
                            System::events().last().unwrap().event,
                            MetaEvent::content(RawEvent::BidMadeCompletingAuction(
                                self.member_id,
                                self.video_id,
                            ))
                        );
                    }
                }
                _ => assert!(false),
            }
        } else {
            assert_eq!(bid_post, bid_pre);
            assert_eq!(snapshot_post, snapshot_pre);
        }
    }
}

pub struct PickOpenAuctionWinnerFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    video_id: VideoId,
    winner_id: MemberId,
    commitment: BalanceOf<Test>,
}

impl PickOpenAuctionWinnerFixture {
    pub fn default() -> Self {
        Self {
            sender: SECOND_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id: VideoId::one(),
            winner_id: SECOND_MEMBER_ID,
            commitment: Content::min_starting_price().saturating_add(Content::min_bid_step()),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    #[allow(dead_code)]
    pub fn with_winner_id(self, winner_id: MemberId) -> Self {
        Self { winner_id, ..self }
    }

    #[allow(dead_code)]
    pub fn with_video_id(self, video_id: VideoId) -> Self {
        Self { video_id, ..self }
    }

    #[allow(dead_code)]
    pub fn with_commitment(self, commitment: BalanceOf<Test>) -> Self {
        Self { commitment, ..self }
    }

    pub fn create_auction_state_snapshot(&self) -> NftAuctionStateSnapshot {
        let video = Content::video_by_id(self.video_id);
        let winner_account =
            MemberInfoProvider::controller_account_id(self.winner_id).map_or(None, |a| Some(a));
        let channel_account = ContentTreasury::<Test>::account_for_channel(video.in_channel);

        NftAuctionStateSnapshot {
            video: Content::video_by_id(self.video_id),
            winner_reserved_balance: winner_account.map(|a| Balances::<Test>::reserved_balance(a)),
            winner_total_balance: winner_account.map(|a| Balances::<Test>::total_balance(&a)),
            owner_balance: Some(Balances::<Test>::usable_balance(self.sender)),
            channel_balance: Balances::<Test>::usable_balance(channel_account),
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let snapshot_pre = Self::create_auction_state_snapshot(self);

        let actual_result = Content::pick_open_auction_winner(
            Origin::signed(self.sender.clone()),
            self.actor.clone(),
            self.video_id,
            self.winner_id,
            self.commitment,
        );

        assert_eq!(actual_result, expected_result);

        let snapshot_post = Self::create_auction_state_snapshot(self);

        if actual_result.is_ok() {
            assert_auction_completed_successfuly(
                self.video_id,
                self.winner_id,
                self.commitment,
                snapshot_pre,
                snapshot_post,
                false,
            );
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::OpenAuctionBidAccepted(
                    self.actor.clone(),
                    self.video_id,
                    self.commitment,
                ))
            );
        } else {
            assert_eq!(snapshot_post, snapshot_pre);
        }
    }
}

pub struct NftOwnerRemarkFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    video_id: VideoId,
    msg: Vec<u8>,
}

impl NftOwnerRemarkFixture {
    pub fn default() -> Self {
        Self {
            sender: SECOND_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id: VideoId::one(),
            msg: b"remark".to_vec(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    #[allow(dead_code)]
    pub fn with_video_id(self, video_id: VideoId) -> Self {
        Self { video_id, ..self }
    }

    #[allow(dead_code)]
    pub fn with_msg(self, msg: Vec<u8>) -> Self {
        Self { msg, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Content::nft_owner_remark(
            Origin::signed(self.sender.clone()),
            self.actor.clone(),
            self.video_id,
            self.msg.clone(),
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::NftOwnerRemarked(
                    self.actor.clone(),
                    self.video_id,
                    self.msg.clone(),
                ))
            );
        }
    }
}

pub struct DestroyNftFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    video_id: VideoId,
}

impl DestroyNftFixture {
    pub fn default() -> Self {
        Self {
            sender: SECOND_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id: VideoId::one(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    #[allow(dead_code)]
    pub fn with_video_id(self, video_id: VideoId) -> Self {
        Self { video_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let video_pre = Content::video_by_id(self.video_id);

        let actual_result = Content::destroy_nft(
            Origin::signed(self.sender.clone()),
            self.actor.clone(),
            self.video_id,
        );

        let video_post = Content::video_by_id(self.video_id);

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert!(video_post.nft_status.is_none());
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::NftDestroyed(self.actor.clone(), self.video_id))
            );
        } else {
            assert_eq!(video_post, video_pre);
        }
    }
}

pub struct ChannelAgentRemarkFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: VideoId,
    msg: Vec<u8>,
}

impl ChannelAgentRemarkFixture {
    pub fn default() -> Self {
        Self {
            sender: SECOND_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            channel_id: ChannelId::one(),
            msg: b"remark".to_vec(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    #[allow(dead_code)]
    pub fn with_channel_id(self, channel_id: ChannelId) -> Self {
        Self { channel_id, ..self }
    }

    #[allow(dead_code)]
    pub fn with_msg(self, msg: Vec<u8>) -> Self {
        Self { msg, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Content::channel_agent_remark(
            Origin::signed(self.sender.clone()),
            self.actor.clone(),
            self.channel_id,
            self.msg.clone(),
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::ChannelAgentRemarked(
                    self.actor.clone(),
                    self.channel_id,
                    self.msg.clone(),
                ))
            );
        }
    }
}

#[derive(Clone, PartialEq, Eq, Debug)]
pub struct NftAuctionStateSnapshot {
    video: Video<Test>,
    owner_balance: Option<BalanceOf<Test>>,
    channel_balance: BalanceOf<Test>,
    winner_reserved_balance: Option<BalanceOf<Test>>,
    winner_total_balance: Option<BalanceOf<Test>>,
}

fn assert_auction_completed_successfuly(
    video_id: VideoId,
    winner_id: MemberId,
    amount: BalanceOf<Test>,
    snapshot_pre: NftAuctionStateSnapshot,
    snapshot_post: NftAuctionStateSnapshot,
    was_new_bid: bool,
) {
    assert!(!OpenAuctionBidByVideoAndMember::<Test>::contains_key(
        video_id, winner_id
    ));
    assert!(snapshot_pre.video.nft_status.is_some());
    assert!(snapshot_post.video.nft_status.is_some());
    assert!(snapshot_pre.owner_balance.is_some());
    assert!(snapshot_post.owner_balance.is_some());
    assert!(snapshot_pre.winner_total_balance.is_some());
    assert!(snapshot_post.winner_total_balance.is_some());
    assert!(snapshot_pre.winner_reserved_balance.is_some());
    assert!(snapshot_post.winner_reserved_balance.is_some());
    let pre_nft_status = snapshot_pre.video.nft_status.unwrap();
    let post_nft_status = snapshot_post.video.nft_status.unwrap();
    assert_eq!(
        post_nft_status,
        Nft::<Test> {
            owner: NftOwner::Member(winner_id),
            transactional_status: TransactionalStatus::<Test>::Idle,
            ..pre_nft_status
        }
    );
    let royalty = pre_nft_status.creator_royalty.map_or(0, |r| r * amount);
    let auction_fee = Content::platform_fee_percentage() * amount;
    let raw_gain = if amount > royalty + auction_fee {
        amount - royalty - auction_fee
    } else {
        amount - auction_fee
    };
    match pre_nft_status.owner {
        NftOwner::Member(_) => {
            assert_eq!(
                snapshot_post.owner_balance.unwrap(),
                snapshot_pre.owner_balance.unwrap().saturating_add(raw_gain)
            );
            assert_eq!(
                snapshot_post.channel_balance,
                snapshot_pre.channel_balance.saturating_add(royalty)
            );
        }
        NftOwner::ChannelOwner => {
            assert_eq!(
                snapshot_post.channel_balance,
                snapshot_pre
                    .channel_balance
                    .saturating_add(raw_gain)
                    .saturating_add(royalty)
            );
        }
    }
    if !was_new_bid {
        assert_eq!(
            snapshot_post.winner_reserved_balance.unwrap(),
            snapshot_pre
                .winner_reserved_balance
                .unwrap()
                .saturating_sub(amount)
        );
    }

    assert_eq!(
        snapshot_post.winner_total_balance.unwrap(),
        snapshot_pre
            .winner_total_balance
            .unwrap()
            .saturating_sub(amount)
    );
}

pub struct SellNftFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    video_id: VideoId,
    price: BalanceOf<Test>,
}

impl SellNftFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id: VideoId::one(),
            price: Zero::zero(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    #[allow(dead_code)]
    pub fn with_video_id(self, video_id: VideoId) -> Self {
        Self { video_id, ..self }
    }

    #[allow(dead_code)]
    pub fn with_price(self, price: BalanceOf<Test>) -> Self {
        Self { price, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let video_pre = Content::video_by_id(self.video_id);

        let actual_result = Content::sell_nft(
            Origin::signed(self.sender.clone()),
            self.video_id,
            self.actor.clone(),
            self.price,
        );

        assert_eq!(actual_result, expected_result);

        let video_post = Content::video_by_id(self.video_id);

        if actual_result.is_ok() {
            assert!(video_pre.nft_status.is_some());
            assert!(video_post.nft_status.is_some());
            let pre_nft_status = video_pre.nft_status.unwrap();
            let nft_status = video_post.nft_status.unwrap();
            assert_eq!(
                nft_status,
                Nft::<Test> {
                    transactional_status: TransactionalStatus::<Test>::BuyNow(self.price),
                    ..pre_nft_status
                }
            );
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::NftSellOrderMade(
                    self.video_id,
                    self.actor.clone(),
                    self.price
                ))
            );
        } else {
            assert_eq!(video_post, video_pre);
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Debug, PartialOrd, Ord)]
pub enum AuctionType {
    English,
    Open,
}

pub struct CancelAuctionFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    video_id: VideoId,
    auction_type: AuctionType,
}

impl CancelAuctionFixture {
    pub fn default(auction_type: AuctionType) -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id: VideoId::one(),
            auction_type,
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    #[allow(dead_code)]
    pub fn with_video_id(self, video_id: VideoId) -> Self {
        Self { video_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let video_pre = Content::video_by_id(self.video_id);

        let call = match self.auction_type {
            AuctionType::English => Content::cancel_english_auction,
            AuctionType::Open => Content::cancel_open_auction,
        };

        let actual_result = call(
            Origin::signed(self.sender.clone()),
            self.actor.clone(),
            self.video_id,
        );

        assert_eq!(actual_result, expected_result);

        let video_post = Content::video_by_id(self.video_id);

        if actual_result.is_ok() {
            assert!(video_pre.nft_status.is_some());
            assert!(video_post.nft_status.is_some());
            let pre_nft_status = video_pre.nft_status.unwrap();
            let nft_status = video_post.nft_status.unwrap();
            assert_eq!(
                nft_status,
                Nft::<Test> {
                    transactional_status: TransactionalStatus::<Test>::Idle,
                    ..pre_nft_status
                }
            );
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::AuctionCanceled(self.actor.clone(), self.video_id,))
            );
        } else {
            assert_eq!(video_post, video_pre);
        }
    }
}

pub struct CancelOfferFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    video_id: VideoId,
}

impl CancelOfferFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id: VideoId::one(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    #[allow(dead_code)]
    pub fn with_video_id(self, video_id: VideoId) -> Self {
        Self { video_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let video_pre = Content::video_by_id(self.video_id);

        let actual_result = Content::cancel_offer(
            Origin::signed(self.sender.clone()),
            self.actor.clone(),
            self.video_id,
        );

        assert_eq!(actual_result, expected_result);

        let video_post = Content::video_by_id(self.video_id);

        if actual_result.is_ok() {
            assert!(video_pre.nft_status.is_some());
            assert!(video_post.nft_status.is_some());
            let pre_nft_status = video_pre.nft_status.unwrap();
            let nft_status = video_post.nft_status.unwrap();
            assert_eq!(
                nft_status,
                Nft::<Test> {
                    transactional_status: TransactionalStatus::<Test>::Idle,
                    ..pre_nft_status
                }
            );
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::OfferCanceled(self.video_id, self.actor.clone()))
            );
        } else {
            assert_eq!(video_post, video_pre);
        }
    }
}

pub struct CancelBuyNowFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    video_id: VideoId,
}

impl CancelBuyNowFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id: VideoId::one(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    #[allow(dead_code)]
    pub fn with_video_id(self, video_id: VideoId) -> Self {
        Self { video_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let video_pre = Content::video_by_id(self.video_id);

        let actual_result = Content::cancel_buy_now(
            Origin::signed(self.sender.clone()),
            self.actor.clone(),
            self.video_id,
        );

        assert_eq!(actual_result, expected_result);

        let video_post = Content::video_by_id(self.video_id);

        if actual_result.is_ok() {
            assert!(video_pre.nft_status.is_some());
            assert!(video_post.nft_status.is_some());
            let pre_nft_status = video_pre.nft_status.unwrap();
            let nft_status = video_post.nft_status.unwrap();
            assert_eq!(
                nft_status,
                Nft::<Test> {
                    transactional_status: TransactionalStatus::<Test>::Idle,
                    ..pre_nft_status
                }
            );
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::BuyNowCanceled(self.video_id, self.actor.clone()))
            );
        } else {
            assert_eq!(video_post, video_pre);
        }
    }
}

pub struct UpdateBuyNowPriceFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    video_id: VideoId,
    price: BalanceOf<Test>,
}

impl UpdateBuyNowPriceFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id: VideoId::one(),
            price: One::one(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    #[allow(dead_code)]
    pub fn with_video_id(self, video_id: VideoId) -> Self {
        Self { video_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let video_pre = Content::video_by_id(self.video_id);

        let actual_result = Content::update_buy_now_price(
            Origin::signed(self.sender.clone()),
            self.actor.clone(),
            self.video_id,
            self.price,
        );

        assert_eq!(actual_result, expected_result);

        let video_post = Content::video_by_id(self.video_id);

        if actual_result.is_ok() {
            assert!(video_pre.nft_status.is_some());
            assert!(video_post.nft_status.is_some());
            let pre_nft_status = video_pre.nft_status.unwrap();
            let nft_status = video_post.nft_status.unwrap();
            assert_eq!(
                nft_status,
                Nft::<Test> {
                    transactional_status: TransactionalStatus::<Test>::BuyNow(self.price),
                    ..pre_nft_status
                }
            );
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::content(RawEvent::BuyNowPriceUpdated(
                    self.video_id,
                    self.actor.clone(),
                    self.price
                ))
            );
        } else {
            assert_eq!(video_post, video_pre);
        }
    }
}

pub struct SuccessfulNftManagementFlow {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
}

impl SuccessfulNftManagementFlow {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn run(&self) {
        // Issue nft the standard way
        IssueNftFixture::default()
            .with_sender(self.sender.clone())
            .with_actor(self.actor.clone())
            .call_and_assert(Ok(()));
        // Issue nft during video creation
        CreateVideoFixture::default()
            .with_sender(self.sender.clone())
            .with_actor(self.actor.clone())
            .with_nft_issuance(NftIssuanceParameters::<Test>::default())
            .call_and_assert(Ok(()));
        // Destroy nft
        DestroyNftFixture::default()
            .with_sender(self.sender.clone())
            .with_actor(self.actor.clone())
            .call_and_assert(Ok(()));
        // Issue nft during video update
        UpdateVideoFixture::default()
            .with_sender(self.sender.clone())
            .with_actor(self.actor.clone())
            .with_nft_issuance(NftIssuanceParameters::<Test>::default())
            .call_and_assert(Ok(()));
        // Start open auction
        StartOpenAuctionFixture::default()
            .with_sender(self.sender.clone())
            .with_actor(self.actor.clone())
            .call_and_assert(Ok(()));
        // Cancel open auction
        CancelAuctionFixture::default(AuctionType::Open)
            .with_sender(self.sender.clone())
            .with_actor(self.actor.clone())
            .call_and_assert(Ok(()));
        // Start english auction
        StartEnglishAuctionFixture::default()
            .with_sender(self.sender.clone())
            .with_actor(self.actor.clone())
            .call_and_assert(Ok(()));
        // Cancel english auction
        CancelAuctionFixture::default(AuctionType::English)
            .with_sender(self.sender.clone())
            .with_actor(self.actor.clone())
            .call_and_assert(Ok(()));
        // Offer nft
        OfferNftFixture::default()
            .with_sender(self.sender.clone())
            .with_actor(self.actor.clone())
            .call_and_assert(Ok(()));
        // Cancel nft offer
        CancelOfferFixture::default()
            .with_sender(self.sender.clone())
            .with_actor(self.actor.clone())
            .call_and_assert(Ok(()));
        // Sell nft
        SellNftFixture::default()
            .with_sender(self.sender.clone())
            .with_actor(self.actor.clone())
            .call_and_assert(Ok(()));
        // Update BuyNow price
        UpdateBuyNowPriceFixture::default()
            .with_sender(self.sender.clone())
            .with_actor(self.actor.clone())
            .call_and_assert(Ok(()));
        // Cancel BuyNow
        CancelBuyNowFixture::default()
            .with_sender(self.sender.clone())
            .with_actor(self.actor.clone())
            .call_and_assert(Ok(()));
        // NFT owner remark
        NftOwnerRemarkFixture::default()
            .with_sender(self.sender.clone())
            .with_actor(self.actor.clone())
            .call_and_assert(Ok(()));
        // Pick open auction winner
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        StartOpenAuctionFixture::default()
            .with_sender(self.sender.clone())
            .with_actor(self.actor.clone())
            .call_and_assert(Ok(()));
        MakeOpenAuctionBidFixture::default().call_and_assert(Ok(()));
        PickOpenAuctionWinnerFixture::default()
            .with_sender(self.sender.clone())
            .with_actor(self.actor.clone())
            .call_and_assert(Ok(()));
    }
}

pub struct SuccessfulChannelCollaboratorsManagementFlow {
    owner_sender: AccountId,
    owner_actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    agent_sender: AccountId,
    agent_actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
}

impl SuccessfulChannelCollaboratorsManagementFlow {
    pub fn default() -> Self {
        Self {
            owner_sender: DEFAULT_MEMBER_ACCOUNT_ID,
            owner_actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            agent_sender: COLLABORATOR_MEMBER_ACCOUNT_ID,
            agent_actor: ContentActor::Member(COLLABORATOR_MEMBER_ID),
        }
    }

    pub fn with_owner_sender(self, owner_sender: AccountId) -> Self {
        Self {
            owner_sender,
            ..self
        }
    }

    pub fn with_agent_sender(self, agent_sender: AccountId) -> Self {
        Self {
            agent_sender,
            ..self
        }
    }

    pub fn with_owner_actor(
        self,
        owner_actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    ) -> Self {
        Self {
            owner_actor,
            ..self
        }
    }

    pub fn with_agent_actor(
        self,
        agent_actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    ) -> Self {
        Self {
            agent_actor,
            ..self
        }
    }

    pub fn run(&self) {
        let default_collaborators = Module::<Test>::channel_by_id(ChannelId::one()).collaborators;
        let mut updated_collaborators = default_collaborators.clone();

        // Add collaborator (as owner) will full permissions
        updated_collaborators.insert(
            SECOND_MEMBER_ID,
            BTreeSet::from_iter(ChannelActionPermission::iter()),
        );
        UpdateChannelFixture::default()
            .with_sender(self.owner_sender.clone())
            .with_actor(self.owner_actor.clone())
            .with_collaborators(updated_collaborators.clone())
            .call_and_assert(Ok(()));
        // Add another collaborator with all permissions except AgentRemark
        updated_collaborators.insert(
            THIRD_MEMBER_ID,
            all_permissions_except(&[ChannelActionPermission::AgentRemark])
                .into_iter()
                .collect(),
        );
        UpdateChannelFixture::default()
            .with_sender(self.agent_sender.clone())
            .with_actor(self.agent_actor.clone())
            .with_collaborators(updated_collaborators.clone())
            .call_and_assert(Ok(()));
        // Update latest collaborator's permissions (remove ManageChannelCollaborators)
        updated_collaborators.insert(
            THIRD_MEMBER_ID,
            all_permissions_except(&[
                ChannelActionPermission::AgentRemark,
                ChannelActionPermission::ManageChannelCollaborators,
            ])
            .into_iter()
            .collect(),
        );
        UpdateChannelFixture::default()
            .with_sender(self.agent_sender.clone())
            .with_actor(self.agent_actor.clone())
            .with_collaborators(updated_collaborators.clone())
            .call_and_assert(Ok(()));
        // Remove latest collaborator
        updated_collaborators.remove(&THIRD_MEMBER_ID);
        UpdateChannelFixture::default()
            .with_sender(self.agent_sender.clone())
            .with_actor(self.agent_actor.clone())
            .with_collaborators(updated_collaborators.clone())
            .call_and_assert(Ok(()));
    }
}

// helper functions
pub fn assert_group_has_permissions_for_actions(
    group: &CuratorGroup<Test>,
    privilege_level: <Test as Trait>::ChannelPrivilegeLevel,
    allowed_actions: &Vec<ContentModerationAction>,
) {
    if !allowed_actions.is_empty() {
        assert_eq!(
            group.ensure_group_member_can_perform_moderation_actions(
                allowed_actions,
                privilege_level
            ),
            Ok(()),
            "Expected curator group to have {:?} action permissions for privilege_level {}",
            allowed_actions,
            privilege_level
        );
    }
    for action in ContentModerationAction::iter() {
        match action {
            ContentModerationAction::ChangeChannelFeatureStatus(..) => {
                for feature in PausableChannelFeature::iter() {
                    if !allowed_actions.contains(
                        &ContentModerationAction::ChangeChannelFeatureStatus(feature),
                    ) {
                        assert_eq!(
                                group.ensure_group_member_can_perform_moderation_actions(
                                    &[ContentModerationAction::ChangeChannelFeatureStatus(feature)],
                                    privilege_level
                                ),
                                Err(Error::<Test>::CuratorModerationActionNotAllowed.into()),
                                "Expected curator group to NOT have {:?} action permissions for privilege_level {}",
                                action.clone(),
                                privilege_level
                            );
                    }
                }
            }
            _ => {
                if !allowed_actions.contains(&action) {
                    assert_eq!(
                            group.ensure_group_member_can_perform_moderation_actions(
                                &[action.clone()],
                                privilege_level
                            ),
                            Err(Error::<Test>::CuratorModerationActionNotAllowed.into()),
                            "Expected curator group to NOT have {:?} action permissions for privilege_level {}",
                            action.clone(),
                            privilege_level
                        );
                }
            }
        }
    }
}

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

pub fn create_default_assets_helper() -> StorageAssets<Test> {
    StorageAssets::<Test> {
        expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
        object_creation_list: create_data_objects_helper(),
    }
}

pub fn set_dynamic_bag_creation_policy_for_storage_numbers(storage_bucket_number: u64) {
    // Set storage bucket in the dynamic bag creation policy to zero.
    assert_eq!(
        Storage::<Test>::update_number_of_storage_buckets_in_dynamic_bag_creation_policy(
            Origin::signed(STORAGE_WG_LEADER_ACCOUNT_ID),
            DynamicBagType::Channel,
            storage_bucket_number,
        ),
        Ok(())
    );
    assert_eq!(
        Storage::<Test>::update_number_of_storage_buckets_in_dynamic_bag_creation_policy(
            Origin::signed(STORAGE_WG_LEADER_ACCOUNT_ID),
            DynamicBagType::Member,
            storage_bucket_number,
        ),
        Ok(())
    );
}
pub fn create_initial_storage_buckets_helper() -> StorageBucketId {
    // first set limits
    assert_eq!(
        Storage::<Test>::update_storage_buckets_voucher_max_limits(
            Origin::signed(STORAGE_WG_LEADER_ACCOUNT_ID),
            VOUCHER_OBJECTS_SIZE_LIMIT,
            VOUCHER_OBJECTS_NUMBER_LIMIT,
        ),
        Ok(())
    );

    set_dynamic_bag_creation_policy_for_storage_numbers(1);

    let storage_bucket_id = Storage::<Test>::next_storage_bucket_id();

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

    storage_bucket_id
}

pub fn set_data_object_deletion_prize(deletion_prize: u64) {
    assert_eq!(
        Storage::<Test>::update_data_object_deletion_prize(
            Origin::signed(STORAGE_WG_LEADER_ACCOUNT_ID),
            deletion_prize
        ),
        Ok(())
    );
}

pub fn create_default_member_owned_channel_with_video_with_nft() -> (ChannelId, VideoId) {
    let channel_id = Content::next_channel_id();
    let video_id = Content::next_video_id();
    create_default_member_owned_channel_with_video();
    // Issue nft
    assert_ok!(Content::issue_nft(
        Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
        ContentActor::Member(DEFAULT_MEMBER_ID),
        video_id,
        NftIssuanceParameters::<Test> {
            royalty: None,
            nft_metadata: b"metablob".to_vec(),
            non_channel_owner: None,
            init_transactional_status: InitTransactionalStatus::<Test>::Idle,
        }
    ));
    (channel_id, video_id)
}

pub fn create_default_member_owned_channel() {
    create_default_member_owned_channel_with_storage_buckets(true, DATA_OBJECT_DELETION_PRIZE, &[])
}

pub fn create_default_member_owned_channel_with_collaborator_permissions(
    collaborator_permissions: &[ChannelActionPermission],
) {
    create_default_member_owned_channel_with_storage_buckets(
        true,
        DATA_OBJECT_DELETION_PRIZE,
        collaborator_permissions,
    )
}

pub fn create_default_member_owned_channel_with_storage_buckets(
    include_storage_buckets: bool,
    deletion_prize: u64,
    collaborator_permissions: &[ChannelActionPermission],
) {
    let mut channel_fixture = CreateChannelFixture::default()
        .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
        .with_channel_owner(ChannelOwner::Member(DEFAULT_MEMBER_ID))
        .with_data_object_deletion_prize(deletion_prize)
        .with_assets(StorageAssets::<Test> {
            expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
            object_creation_list: create_data_objects_helper(),
        })
        .with_collaborators(
            vec![(
                COLLABORATOR_MEMBER_ID,
                collaborator_permissions.iter().cloned().collect(),
            )]
            .into_iter()
            .collect(),
        );

    if include_storage_buckets {
        set_dynamic_bag_creation_policy_for_storage_numbers(1);
        channel_fixture = channel_fixture.with_default_storage_buckets();
    }

    channel_fixture.call_and_assert(Ok(()));
}

pub fn create_default_curator_owned_channel(
    deletion_prize: u64,
    curator_agent_permissions: &[ChannelActionPermission],
) {
    let curator_group_id =
        curators::add_curator_to_new_group(DEFAULT_CURATOR_ID, curator_agent_permissions);
    CreateChannelFixture::default()
        .with_default_storage_buckets()
        .with_sender(LEAD_ACCOUNT_ID)
        .with_channel_owner(ChannelOwner::CuratorGroup(curator_group_id))
        .with_data_object_deletion_prize(deletion_prize)
        .with_assets(StorageAssets::<Test> {
            expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
            object_creation_list: create_data_objects_helper(),
        })
        .with_collaborators(
            vec![(COLLABORATOR_MEMBER_ID, BTreeSet::new())]
                .into_iter()
                .collect(),
        )
        .call_and_assert(Ok(()));
}

pub fn create_default_member_owned_channel_with_videos(
    number_of_videos: u8,
    collaborator_permissions: &[ChannelActionPermission],
) {
    create_default_member_owned_channel_with_collaborator_permissions(collaborator_permissions);

    for _ in 0..number_of_videos {
        CreateVideoFixture::default()
            .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
            .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
            .with_data_object_deletion_prize(DATA_OBJECT_DELETION_PRIZE)
            .with_assets(StorageAssets::<Test> {
                expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
                object_creation_list: create_data_objects_helper(),
            })
            .with_channel_id(NextChannelId::<Test>::get() - 1)
            .call_and_assert(Ok(()));
    }
}

pub fn create_default_member_owned_channel_with_video() {
    create_default_member_owned_channel_with_videos(1, &[])
}

pub fn create_default_member_owned_channel_with_video_with_collaborator_permissions(
    collaborator_permissions: &[ChannelActionPermission],
) {
    create_default_member_owned_channel_with_videos(1, collaborator_permissions)
}

pub fn create_default_member_owned_channel_with_video_with_storage_buckets(
    include_storage_buckets: bool,
    deletion_prize: u64,
) {
    create_default_member_owned_channel_with_storage_buckets(
        include_storage_buckets,
        deletion_prize,
        &[],
    );

    set_default_nft_limits();

    CreateVideoFixture::default()
        .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
        .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
        .with_data_object_deletion_prize(deletion_prize)
        .with_assets(StorageAssets::<Test> {
            expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
            object_creation_list: create_data_objects_helper(),
        })
        .with_channel_id(NextChannelId::<Test>::get() - 1)
        .call_and_assert(Ok(()));
}

pub fn create_default_curator_owned_channel_with_video(
    deletion_prize: u64,
    permissions: &[ChannelActionPermission],
) {
    create_default_curator_owned_channel(deletion_prize, &permissions);
    CreateVideoFixture::default()
        .with_sender(LEAD_ACCOUNT_ID)
        .with_actor(ContentActor::Lead)
        .with_assets(StorageAssets::<Test> {
            expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
            object_creation_list: create_data_objects_helper(),
        })
        .with_channel_id(NextChannelId::<Test>::get() - 1)
        .call_and_assert(Ok(()));
}

pub fn pause_channel_feature(channel_id: ChannelId, feature: PausableChannelFeature) {
    SetChannelPausedFeaturesAsModeratorFixture::default()
        .with_channel_id(channel_id)
        .with_new_paused_features(BTreeSet::from_iter(vec![feature]))
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

pub fn default_curator_actor() -> ContentActor<CuratorGroupId, CuratorId, MemberId> {
    ContentActor::Curator(CuratorGroupId::one(), DEFAULT_CURATOR_ID)
}

#[derive(Clone, PartialEq, Eq, Debug, PartialOrd, Ord)]
pub enum NftTransactionalStatusType {
    Idle,
    BuyNow,
    Offer,
    Auction(AuctionType),
}

pub struct ContentTest {
    channel_owner_sender: AccountId,
    channel_owner_actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    agent_permissions: BTreeSet<ChannelActionPermission>,
    claimable_reward: bool,
    create_video: bool,
    video_assets: Option<StorageAssets<Test>>,
    create_video_nft: bool,
    nft_status: NftTransactionalStatusType,
    make_open_auction_bid: bool,
    collaborators: Option<BTreeMap<MemberId, ChannelAgentPermissions>>,
}

impl ContentTest {
    pub fn default() -> Self {
        Self {
            channel_owner_sender: DEFAULT_MEMBER_ACCOUNT_ID,
            channel_owner_actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            agent_permissions: BTreeSet::new(),
            claimable_reward: false,
            create_video: false,
            video_assets: Some(create_default_assets_helper()),
            create_video_nft: false,
            nft_status: NftTransactionalStatusType::Idle,
            make_open_auction_bid: false,
            collaborators: None,
        }
    }

    pub fn with_curator_channel() -> Self {
        let channel_owner_sender = LEAD_ACCOUNT_ID;
        let channel_owner_actor = ContentActor::Lead;
        Self {
            channel_owner_sender,
            channel_owner_actor,
            ..Self::default()
        }
    }

    pub fn with_member_channel() -> Self {
        let channel_owner_sender = DEFAULT_MEMBER_ACCOUNT_ID;
        let channel_owner_actor = ContentActor::Member(DEFAULT_MEMBER_ID);
        Self {
            channel_owner_sender,
            channel_owner_actor,
            ..Self::default()
        }
    }

    pub fn with_collaborators(
        self,
        collaborators: &[(u64, BTreeSet<ChannelActionPermission>)],
    ) -> Self {
        Self {
            collaborators: Some(collaborators.iter().cloned().collect::<BTreeMap<_, _>>()),
            ..self
        }
    }

    pub fn with_agent_permissions(self, permissions: &[ChannelActionPermission]) -> Self {
        Self {
            agent_permissions: agent_permissions(permissions),
            ..self
        }
    }

    pub fn with_all_agent_permissions_except(
        self,
        except_permissions: &[ChannelActionPermission],
    ) -> Self {
        Self {
            agent_permissions: all_permissions_except(except_permissions),
            ..self
        }
    }

    pub fn with_claimable_reward(self) -> Self {
        Self {
            claimable_reward: true,
            ..self
        }
    }

    pub fn with_video(self) -> Self {
        Self {
            create_video: true,
            ..self
        }
    }

    pub fn with_video_assets(self, video_assets: Option<StorageAssets<Test>>) -> Self {
        Self {
            video_assets,
            ..self.with_video()
        }
    }

    pub fn with_video_nft(self) -> Self {
        Self {
            create_video_nft: true,
            ..self.with_video()
        }
    }

    pub fn with_video_nft_status(self, nft_status: NftTransactionalStatusType) -> Self {
        Self {
            nft_status,
            ..self.with_video_nft()
        }
    }

    pub fn with_nft_open_auction_bid(self) -> Self {
        Self {
            make_open_auction_bid: true,
            ..self.with_video_nft_status(NftTransactionalStatusType::Auction(AuctionType::Open))
        }
    }

    pub fn setup(&self) {
        run_to_block(1);
        create_initial_storage_buckets_helper();
        increase_account_balance_helper(self.channel_owner_sender, INITIAL_BALANCE);

        // Create channel
        let agent_permissions = self.agent_permissions.iter().cloned().collect::<Vec<_>>();
        match self.channel_owner_actor {
            ContentActor::Lead => {
                create_default_curator_owned_channel(DATA_OBJECT_DELETION_PRIZE, &agent_permissions)
            }
            ContentActor::Member(..) => {
                create_default_member_owned_channel_with_collaborator_permissions(
                    &agent_permissions,
                )
            }
            _ => assert!(false),
        }

        // Setup claimable reward (optionally)
        if self.claimable_reward {
            let payments = create_some_pull_payments_helper();
            update_commit_value_with_payments_helper(&payments);
        }

        // Set channel collaborators (optionally)
        if let Some(collaborators) = self.collaborators.as_ref() {
            UpdateChannelFixture::default()
                .with_sender(self.channel_owner_sender)
                .with_actor(self.channel_owner_actor.clone())
                .with_collaborators(collaborators.clone())
                .call_and_assert(Ok(()));
        }

        // Create video (optionally)
        if self.create_video {
            CreateVideoFixture::default()
                .with_sender(self.channel_owner_sender)
                .with_actor(self.channel_owner_actor.clone())
                .with_opt_assets(self.video_assets.clone())
                .call_and_assert(Ok(()));
        }

        // Create video nft (optinally)
        if self.create_video_nft {
            IssueNftFixture::default()
                .with_sender(self.channel_owner_sender.clone())
                .with_actor(self.channel_owner_actor.clone())
                .call_and_assert(Ok(()));
        }

        // Set nft status (optionally)
        match self.nft_status {
            NftTransactionalStatusType::Auction(auction_type) => match auction_type {
                AuctionType::Open => {
                    StartOpenAuctionFixture::default()
                        .with_sender(self.channel_owner_sender.clone())
                        .with_actor(self.channel_owner_actor.clone())
                        .call_and_assert(Ok(()));
                }
                AuctionType::English => {
                    StartEnglishAuctionFixture::default()
                        .with_sender(self.channel_owner_sender.clone())
                        .with_actor(self.channel_owner_actor.clone())
                        .call_and_assert(Ok(()));
                }
            },
            NftTransactionalStatusType::BuyNow => {
                SellNftFixture::default()
                    .with_sender(self.channel_owner_sender.clone())
                    .with_actor(self.channel_owner_actor.clone())
                    .call_and_assert(Ok(()));
            }
            NftTransactionalStatusType::Offer => {
                OfferNftFixture::default()
                    .with_sender(self.channel_owner_sender.clone())
                    .with_actor(self.channel_owner_actor.clone())
                    .call_and_assert(Ok(()));
            }
            _ => {}
        }

        // Make nft open auction bid (optionally)
        if self.make_open_auction_bid {
            increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
            MakeOpenAuctionBidFixture::default().call_and_assert(Ok(()));
        }
    }
}

pub fn all_permissions_except(
    excluded_permissions: &[ChannelActionPermission],
) -> ChannelAgentPermissions {
    ChannelActionPermission::iter()
        .filter(|p| !excluded_permissions.contains(p))
        .collect()
}

pub fn agent_permissions(permissions: &[ChannelActionPermission]) -> ChannelAgentPermissions {
    permissions.iter().cloned().collect()
}

pub fn get_default_member_channel_invalid_contexts() -> Vec<(
    AccountId,
    ContentActor<CuratorGroupId, CuratorId, MemberId>,
    Error<Test>,
)> {
    vec![
        // collaborator as owner
        (
            COLLABORATOR_MEMBER_ACCOUNT_ID,
            ContentActor::Member(DEFAULT_MEMBER_ID),
            Error::<Test>::MemberAuthFailed,
        ),
        // unauth member as owner
        (
            UNAUTHORIZED_MEMBER_ACCOUNT_ID,
            ContentActor::Member(DEFAULT_MEMBER_ID),
            Error::<Test>::MemberAuthFailed,
        ),
        // unauth collaborator as collaborator
        (
            UNAUTHORIZED_COLLABORATOR_MEMBER_ACCOUNT_ID,
            ContentActor::Member(COLLABORATOR_MEMBER_ID),
            Error::<Test>::MemberAuthFailed,
        ),
        // lead as lead
        (
            LEAD_ACCOUNT_ID,
            ContentActor::Lead,
            Error::<Test>::ActorNotAuthorized,
        ),
        // curator as curator
        (
            DEFAULT_CURATOR_ACCOUNT_ID,
            default_curator_actor(),
            Error::<Test>::ActorNotAuthorized,
        ),
        // unauth member as unauth member
        (
            UNAUTHORIZED_MEMBER_ACCOUNT_ID,
            ContentActor::Member(UNAUTHORIZED_MEMBER_ID),
            Error::<Test>::ActorNotAuthorized,
        ),
        // unauth collaborator as unauth collaborator
        (
            UNAUTHORIZED_COLLABORATOR_MEMBER_ACCOUNT_ID,
            ContentActor::Member(UNAUTHORIZED_COLLABORATOR_MEMBER_ID),
            Error::<Test>::ActorNotAuthorized,
        ),
    ]
}

pub fn get_default_curator_channel_invalid_contexts() -> Vec<(
    AccountId,
    ContentActor<CuratorGroupId, CuratorId, MemberId>,
    Error<Test>,
)> {
    vec![
        // collaborator as lead
        (
            COLLABORATOR_MEMBER_ACCOUNT_ID,
            ContentActor::Lead,
            Error::<Test>::LeadAuthFailed,
        ),
        // agent as lead
        (
            DEFAULT_CURATOR_ACCOUNT_ID,
            ContentActor::Lead,
            Error::<Test>::LeadAuthFailed,
        ),
        // unauth lead as lead
        (
            UNAUTHORIZED_LEAD_ACCOUNT_ID,
            ContentActor::Lead,
            Error::<Test>::LeadAuthFailed,
        ),
        // collaborator as agent
        (
            COLLABORATOR_MEMBER_ACCOUNT_ID,
            default_curator_actor(),
            Error::<Test>::CuratorAuthFailed,
        ),
        // unauth curator as agent
        (
            UNAUTHORIZED_CURATOR_ACCOUNT_ID,
            default_curator_actor(),
            Error::<Test>::CuratorAuthFailed,
        ),
        // agent as collaborator
        (
            DEFAULT_CURATOR_ACCOUNT_ID,
            ContentActor::Member(COLLABORATOR_MEMBER_ID),
            Error::<Test>::MemberAuthFailed,
        ),
        // unauth collaborator as collaborator
        (
            UNAUTHORIZED_COLLABORATOR_MEMBER_ACCOUNT_ID,
            ContentActor::Member(COLLABORATOR_MEMBER_ID),
            Error::<Test>::MemberAuthFailed,
        ),
        // unauth curator as unauth curator
        (
            UNAUTHORIZED_CURATOR_ACCOUNT_ID,
            ContentActor::Curator(2, UNAUTHORIZED_CURATOR_ID),
            Error::<Test>::ActorNotAuthorized,
        ),
        // unauth collaborator as unauth collaborator
        (
            UNAUTHORIZED_COLLABORATOR_MEMBER_ACCOUNT_ID,
            ContentActor::Member(UNAUTHORIZED_COLLABORATOR_MEMBER_ID),
            Error::<Test>::ActorNotAuthorized,
        ),
    ]
}

pub fn run_all_fixtures_with_contexts(
    contexts: Vec<(
        AccountId,
        ContentActor<CuratorGroupId, CuratorId, MemberId>,
        Error<Test>,
    )>,
) {
    for (sender, actor, error) in contexts {
        let expected_err = Err(error.into());
        UpdateChannelFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err.clone());
        CreateVideoFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err.clone());
        UpdateVideoFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err.clone());
        DeleteChannelFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err.clone());
        DeleteVideoFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err.clone());
        IssueNftFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err.clone());
        StartOpenAuctionFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err.clone());
        StartEnglishAuctionFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err.clone());
        CancelAuctionFixture::default(AuctionType::Open)
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err.clone());
        CancelAuctionFixture::default(AuctionType::English)
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err.clone());
        OfferNftFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err.clone());
        CancelOfferFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err.clone());
        SellNftFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err.clone());
        CancelBuyNowFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err.clone());
        UpdateBuyNowPriceFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err.clone());
        PickOpenAuctionWinnerFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err.clone());
        NftOwnerRemarkFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err.clone());
        DestroyNftFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err.clone());
        ChannelAgentRemarkFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err.clone());
        UpdateChannelTransferStatusFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err.clone());
        ClaimChannelRewardFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err.clone());
    }
}
