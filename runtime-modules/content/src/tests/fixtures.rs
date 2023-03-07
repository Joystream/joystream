#![cfg(test)]
use derive_fixture::Fixture;
use derive_new::new;

use super::curators;
// Importing mock event as MetaEvent to avoid name clash with Event from crate::* glob import
pub use super::mock::Event as MetaEvent;
use super::mock::*;
use crate::*;
use common::{
    council::CouncilBudgetManager,
    merkle_tree::helpers::{build_merkle_path_helper, generate_merkle_root_helper},
};
use frame_support::{assert_noop, assert_ok};
use frame_support::{
    storage_root,
    traits::{Currency, StoredMap, WithdrawReasons},
    StateVersion,
};
use frame_system::RawOrigin;
use project_token::types::TransferPolicyParamsOf;
use project_token::types::{TokenAllocationOf, TokenIssuanceParametersOf};
use sp_core::U256;
use sp_runtime::Permill;
use sp_std::collections::btree_map::BTreeMap;
use sp_std::convert::TryFrom;
use sp_std::iter::FromIterator;
use sp_std::iter::{IntoIterator, Iterator};
use staking_handler::StakingHandler;
use storage::DynamicBagType;
use strum::IntoEnumIterator;

// Index which indentifies the item in the commitment set we want the proof for
pub const DEFAULT_PROOF_INDEX: usize = 1;

pub type ActorContextResult = (
    AccountId,
    ContentActor<CuratorGroupId, CuratorId, MemberId>,
    Error<Test>,
);

fn channel_bag_witness(channel_id: ChannelId) -> ChannelBagWitness {
    let bag_id = Content::bag_id_for_channel(&channel_id);
    let channel_bag = <Test as Config>::DataObjectStorage::bag(&bag_id);
    ChannelBagWitness {
        storage_buckets_num: channel_bag.stored_by.len() as u32,
        distribution_buckets_num: channel_bag.distributed_by.len() as u32,
    }
}

fn storage_buckets_num_witness(channel_id: ChannelId) -> u32 {
    let bag_id = Content::bag_id_for_channel(&channel_id);
    let channel_bag = <Test as Config>::DataObjectStorage::bag(&bag_id);
    channel_bag.stored_by.len() as u32
}

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
                MetaEvent::Content(RawEvent::CuratorGroupCreated(new_group_id))
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
                expected_data_object_state_bloat_bond:
                    Storage::<Test>::data_object_state_bloat_bond_value(),
                expected_channel_state_bloat_bond: Content::channel_state_bloat_bond_value(),
            },
        }
    }

    pub fn with_expected_channel_state_bloat_bond(
        self,
        expected_channel_state_bloat_bond: u64,
    ) -> Self {
        Self {
            params: ChannelCreationParameters::<Test> {
                expected_channel_state_bloat_bond,
                ..self.params.clone()
            },
            ..self
        }
    }

    pub fn with_data_object_state_bloat_bond(
        self,
        expected_data_object_state_bloat_bond: u64,
    ) -> Self {
        Self {
            params: ChannelCreationParameters::<Test> {
                expected_data_object_state_bloat_bond,
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
                collaborators,
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
        self.with_storage_buckets(BTreeSet::from_iter(vec![default_storage_bucket_id]))
    }

    fn get_balance(&self) -> BalanceOf<Test> {
        Balances::<Test>::free_balance(&self.sender)
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);
        let balance_pre = self.get_balance();
        let channel_id = Content::next_channel_id();
        let channel_bag_id = Content::bag_id_for_channel(&channel_id);
        let beg_obj_id = storage::NextDataObjectId::<Test>::get();
        let actual_result =
            Content::create_channel(origin, self.channel_owner.clone(), self.params.clone());
        let end_obj_id = storage::NextDataObjectId::<Test>::get();

        assert_eq!(actual_result, expected_result);

        let balance_post = self.get_balance();

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

            let channel_account = ContentTreasury::<Test>::account_for_channel(channel_id);

            // calculate expected storage fees
            let storage_fees = if let Some(assets) = self.params.assets.as_ref() {
                let objects_state_bloat_bond = assets
                    .object_creation_list
                    .iter()
                    .fold(BalanceOf::<Test>::zero(), |acc, _| {
                        acc.saturating_add(self.params.expected_data_object_state_bloat_bond)
                    });

                let data_size_fee = Storage::<Test>::data_object_per_mega_byte_fee();
                objects_state_bloat_bond + data_size_fee
            } else {
                0
            };

            // event correctly deposited
            let sender_acc_data = <Test as balances::Config>::AccountStore::get(&self.sender);
            let locked_balance_consumed = sender_acc_data
                .misc_frozen
                .max(sender_acc_data.fee_frozen)
                .saturating_sub(sender_acc_data.free);
            let expected_blaot_bond_restricted_to = match locked_balance_consumed.is_zero() {
                true => None,
                false => Some(self.sender),
            };
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::Content(RawEvent::ChannelCreated(
                    channel_id,
                    Channel::<Test> {
                        owner: self.channel_owner.clone(),
                        collaborators: try_into_stored_collaborators_map::<Test>(
                            &self.params.collaborators
                        )
                        .unwrap(),
                        num_videos: Zero::zero(),
                        cumulative_reward_claimed: Zero::zero(),
                        privilege_level: Zero::zero(),
                        paused_features: Default::default(),
                        data_objects: BTreeSet::from_iter(beg_obj_id..end_obj_id)
                            .try_into()
                            .unwrap(),
                        transfer_status: Default::default(),
                        daily_nft_limit: DefaultChannelDailyNftLimit::get(),
                        weekly_nft_limit: DefaultChannelWeeklyNftLimit::get(),
                        daily_nft_counter: Default::default(),
                        weekly_nft_counter: Default::default(),
                        creator_token_id: None,
                        channel_state_bloat_bond: RepayableBloatBond::new(
                            self.params.expected_channel_state_bloat_bond,
                            expected_blaot_bond_restricted_to
                        )
                    },
                    self.params.clone(),
                    channel_account.clone()
                ))
            );

            assert_eq!(
                balance_pre.saturating_sub(balance_post),
                Content::channel_state_bloat_bond_value() + storage_fees,
            );

            assert_eq!(
                Balances::<Test>::usable_balance(channel_account),
                self.params.expected_channel_state_bloat_bond
            );

            if self.params.assets.is_some() {
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
                expected_data_object_state_bloat_bond:
                    Storage::<Test>::data_object_state_bloat_bond_value(),
                expected_video_state_bloat_bond: Content::video_state_bloat_bond_value(),
                storage_buckets_num_witness: storage_buckets_num_witness(ChannelId::one()),
            },
            channel_id: ChannelId::one(), // channel index starts at 1
        }
    }

    pub fn with_storage_buckets_num_witness(self, storage_buckets_num_witness: u32) -> Self {
        Self {
            params: VideoCreationParameters::<Test> {
                storage_buckets_num_witness,
                ..self.params
            },
            ..self
        }
    }

    pub fn with_data_object_state_bloat_bond(
        self,
        expected_data_object_state_bloat_bond: u64,
    ) -> Self {
        Self {
            params: VideoCreationParameters::<Test> {
                expected_data_object_state_bloat_bond,
                ..self.params.clone()
            },
            ..self
        }
    }
    pub fn with_expected_video_state_bloat_bond(
        self,
        expected_video_state_bloat_bond: u64,
    ) -> Self {
        Self {
            params: VideoCreationParameters::<Test> {
                expected_video_state_bloat_bond,
                ..self.params.clone()
            },
            ..self
        }
    }

    pub fn with_nft_in_sale(self, nft_price: u64) -> Self {
        Self {
            params: VideoCreationParameters::<Test> {
                auto_issue_nft: Some(NftIssuanceParameters::<Test> {
                    init_transactional_status: InitTransactionalStatus::<Test>::BuyNow(nft_price),
                    ..Default::default()
                }),
                ..self.params
            },
            ..self
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_channel_id(self, channel_id: ChannelId) -> Self {
        Self {
            channel_id,
            params: VideoCreationParameters::<Test> {
                storage_buckets_num_witness: storage_buckets_num_witness(channel_id),
                ..self.params
            },
            ..self
        }
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

    fn get_balance(&self) -> BalanceOf<Test> {
        Balances::<Test>::free_balance(&self.sender)
    }

    pub fn call(self) {
        let origin = Origin::signed(self.sender);
        assert_ok!(Content::create_video(
            origin,
            self.actor,
            self.channel_id,
            self.params,
        ));
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);
        let balance_pre = self.get_balance();
        let module_balance_pre = ContentTreasury::<Test>::usable_balance();
        let channel_balance_pre = Balances::<Test>::usable_balance(
            ContentTreasury::<Test>::account_for_channel(self.channel_id),
        );
        let channel_bag_id = Content::bag_id_for_channel(&self.channel_id);
        let video_id = Content::next_video_id();
        let beg_obj_id = storage::NextDataObjectId::<Test>::get();

        let actual_result =
            Content::create_video(origin, self.actor, self.channel_id, self.params.clone());

        let balance_post = self.get_balance();
        let module_balance_post = ContentTreasury::<Test>::usable_balance();
        let channel_balance_post = Balances::<Test>::usable_balance(
            ContentTreasury::<Test>::account_for_channel(self.channel_id),
        );
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
                MetaEvent::Content(RawEvent::VideoCreated(
                    self.actor,
                    self.channel_id,
                    video_id,
                    self.params.clone(),
                    BTreeSet::from_iter(beg_obj_id..end_obj_id),
                ))
            );

            if let Some(assets) = self.params.assets.as_ref() {
                // balance accounting is correct
                let objects_state_bloat_bond = assets
                    .object_creation_list
                    .iter()
                    .fold(BalanceOf::<Test>::zero(), |acc, _| {
                        acc.saturating_add(self.params.expected_data_object_state_bloat_bond)
                    });
                let data_size_fee = Storage::<Test>::data_object_per_mega_byte_fee();
                let video_bloat_bond = Content::video_state_bloat_bond_value();

                assert_eq!(
                    balance_pre.saturating_sub(balance_post),
                    objects_state_bloat_bond + data_size_fee + video_bloat_bond
                );

                assert_eq!(
                    module_balance_post.saturating_sub(module_balance_pre),
                    video_bloat_bond
                );

                assert_eq!(channel_balance_pre, channel_balance_post);

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
                expected_data_object_state_bloat_bond:
                    Storage::<Test>::data_object_state_bloat_bond_value(),
                storage_buckets_num_witness: Some(storage_buckets_num_witness(ChannelId::one())),
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

    pub fn with_data_object_state_bloat_bond(
        self,
        expected_data_object_state_bloat_bond: u64,
    ) -> Self {
        Self {
            params: ChannelUpdateParameters::<Test> {
                expected_data_object_state_bloat_bond,
                ..self.params.clone()
            },
            ..self
        }
    }

    pub fn with_storage_buckets_num_witness(
        self,
        storage_buckets_num_witness: Option<u32>,
    ) -> Self {
        Self {
            params: ChannelUpdateParameters::<Test> {
                storage_buckets_num_witness,
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
        let origin = Origin::signed(self.sender);
        let balance_pre = Balances::<Test>::usable_balance(self.sender);
        let channel_pre = Content::channel_by_id(&self.channel_id);
        let bag_id_for_channel = Content::bag_id_for_channel(&self.channel_id);

        let state_bloat_bond_deposited =
            self.params
                .assets_to_upload
                .as_ref()
                .map_or(BalanceOf::<Test>::zero(), |assets| {
                    assets
                        .object_creation_list
                        .iter()
                        .fold(BalanceOf::<Test>::zero(), |acc, _| {
                            acc.saturating_add(self.params.expected_data_object_state_bloat_bond)
                        })
                });

        let state_bloat_bond_withdrawn = if !self.params.assets_to_remove.is_empty() {
            self.params
                .assets_to_remove
                .iter()
                .fold(BalanceOf::<Test>::zero(), |acc, id| {
                    acc + storage::DataObjectsById::<Test>::get(&bag_id_for_channel, id)
                        .state_bloat_bond
                        .amount
                })
        } else {
            BalanceOf::<Test>::zero()
        };

        let beg_obj_id = storage::NextDataObjectId::<Test>::get();

        let actual_result =
            Content::update_channel(origin, self.actor, self.channel_id, self.params.clone());

        let channel_post = Content::channel_by_id(&self.channel_id);
        let end_obj_id = storage::NextDataObjectId::<Test>::get();
        let balance_post = Balances::<Test>::usable_balance(self.sender);

        assert_eq!(actual_result, expected_result);

        match actual_result {
            Ok(()) => {
                assert_eq!(
                    System::events().last().unwrap().event,
                    MetaEvent::Content(RawEvent::ChannelUpdated(
                        self.actor,
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
                        .map_or(channel_pre.collaborators, |c| {
                            try_into_stored_collaborators_map::<Test>(&c).unwrap()
                        })
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
                    state_bloat_bond_withdrawn.saturating_sub(state_bloat_bond_deposited),
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
    privilege_level: <Test as Config>::ChannelPrivilegeLevel,
}

impl UpdateChannelPrivilegeLevelFixture {
    pub fn default() -> Self {
        Self {
            sender: LEAD_ACCOUNT_ID,
            channel_id: ChannelId::one(), // channel index starts at 1
            privilege_level: <Test as Config>::ChannelPrivilegeLevel::one(), // default privilege level is 0
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_channel_id(self, channel_id: ChannelId) -> Self {
        Self { channel_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);
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
                    MetaEvent::Content(RawEvent::ChannelPrivilegeLevelUpdated(
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
                expected_data_object_state_bloat_bond:
                    Storage::<Test>::data_object_state_bloat_bond_value(),
                storage_buckets_num_witness: Some(storage_buckets_num_witness(ChannelId::one())),
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

    pub fn with_data_object_state_bloat_bond(
        self,
        expected_data_object_state_bloat_bond: u64,
    ) -> Self {
        Self {
            params: VideoUpdateParameters::<Test> {
                expected_data_object_state_bloat_bond,
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
        let video = Content::video_by_id(video_id);
        Self {
            video_id,
            params: VideoUpdateParameters::<Test> {
                storage_buckets_num_witness: Some(storage_buckets_num_witness(video.in_channel)),
                ..self.params
            },
            ..self
        }
    }

    pub fn with_storage_buckets_num_witness(
        self,
        storage_buckets_num_witness: Option<u32>,
    ) -> Self {
        Self {
            params: VideoUpdateParameters::<Test> {
                storage_buckets_num_witness,
                ..self.params
            },
            ..self
        }
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
        let origin = Origin::signed(self.sender);
        let balance_pre = Balances::<Test>::free_balance(self.sender);
        let video_pre = Content::video_by_id(&self.video_id);
        let bag_id_for_channel = Content::bag_id_for_channel(&video_pre.in_channel);
        let beg_obj_id = storage::NextDataObjectId::<Test>::get();

        let state_bloat_bond = Storage::<Test>::data_object_state_bloat_bond_value();

        let fees_paid =
            self.params
                .assets_to_upload
                .as_ref()
                .map_or(BalanceOf::<Test>::zero(), |assets| {
                    assets
                        .object_creation_list
                        .iter()
                        .fold(BalanceOf::<Test>::zero(), |acc, _| {
                            acc.saturating_add(state_bloat_bond)
                        })
                        .saturating_add(Storage::<Test>::data_object_per_mega_byte_fee())
                });

        let state_bloat_bond_withdrawn = if !self.params.assets_to_remove.is_empty() {
            self.params
                .assets_to_remove
                .iter()
                .fold(BalanceOf::<Test>::zero(), |acc, obj_id| {
                    acc + storage::DataObjectsById::<Test>::get(&bag_id_for_channel, obj_id)
                        .state_bloat_bond
                        .amount
                })
        } else {
            BalanceOf::<Test>::zero()
        };

        let actual_result =
            Content::update_video(origin, self.actor, self.video_id, self.params.clone());

        let end_obj_id = storage::NextDataObjectId::<Test>::get();
        let balance_post = Balances::<Test>::free_balance(self.sender);
        let video_post = Content::video_by_id(&self.video_id);

        assert_eq!(actual_result, expected_result);

        match actual_result {
            Ok(()) => {
                assert_eq!(
                    System::events().last().unwrap().event,
                    MetaEvent::Content(RawEvent::VideoUpdated(
                        self.actor,
                        self.video_id,
                        self.params.clone(),
                        BTreeSet::from_iter(beg_obj_id..end_obj_id),
                    ))
                );

                assert_eq!(
                    // it may underflow, but this is fine in this use-case
                    balance_post - balance_pre,
                    state_bloat_bond_withdrawn - fees_paid,
                );

                if self.params.assets_to_upload.is_some() {
                    assert!((beg_obj_id..end_obj_id).all(|id| {
                        storage::DataObjectsById::<Test>::contains_key(&bag_id_for_channel, id)
                    }));
                }

                assert!(!self.params.assets_to_remove.iter().any(|obj_id| {
                    storage::DataObjectsById::<Test>::contains_key(&bag_id_for_channel, obj_id)
                }));

                if self.params.auto_issue_nft.is_some() {
                    assert!(video_post.nft_status.is_some())
                }
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
    storage_buckets_num_witness: u32,
    rationale: Vec<u8>,
}

impl DeleteChannelAssetsAsModeratorFixture {
    pub fn default() -> Self {
        Self {
            sender: LEAD_ACCOUNT_ID,
            actor: ContentActor::Lead,
            channel_id: ChannelId::one(),
            assets_to_remove: BTreeSet::from_iter(0..DATA_OBJECTS_NUMBER),
            storage_buckets_num_witness: storage_buckets_num_witness(ChannelId::one()),
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

    pub fn with_storage_buckets_num_witness(self, storage_buckets_num_witness: u32) -> Self {
        Self {
            storage_buckets_num_witness,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);
        let balance_pre = Balances::<Test>::usable_balance(self.sender);
        let channel_pre = Content::channel_by_id(&self.channel_id);
        let bag_id_for_channel = Content::bag_id_for_channel(&self.channel_id);

        let state_bloat_bond_withdrawn = if !self.assets_to_remove.is_empty() {
            self.assets_to_remove
                .iter()
                .fold(BalanceOf::<Test>::zero(), |acc, obj_id| {
                    acc + storage::DataObjectsById::<Test>::get(&bag_id_for_channel, obj_id)
                        .state_bloat_bond
                        .amount
                })
        } else {
            BalanceOf::<Test>::zero()
        };

        let actual_result = Content::delete_channel_assets_as_moderator(
            origin,
            self.actor,
            self.channel_id,
            self.assets_to_remove.clone(),
            self.storage_buckets_num_witness,
            self.rationale.clone(),
        );

        let balance_post = Balances::<Test>::usable_balance(self.sender);
        let channel_post = Content::channel_by_id(&self.channel_id);

        assert_eq!(actual_result, expected_result);

        match actual_result {
            Ok(()) => {
                assert_eq!(
                    System::events().last().unwrap().event,
                    MetaEvent::Content(RawEvent::ChannelAssetsDeletedByModerator(
                        self.actor,
                        self.channel_id,
                        self.assets_to_remove.clone(),
                        self.rationale.clone(),
                    ))
                );

                assert_eq!(
                    balance_post.saturating_sub(balance_pre),
                    state_bloat_bond_withdrawn,
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

    fn on_success_extra(
        &self,
        _channel_pre: Channel<Test>,
        _bloat_bond_reciever_balance_pre: BalanceOf<Test>,
        _bloat_bond_reciever_balance_post: BalanceOf<Test>,
        _data_obj_state_bloat_bond: BalanceOf<Test>,
    ) {
    }

    fn call_and_assert(&self, expected_result: DispatchResult) {
        let storage_root_pre = storage_root(StateVersion::V1);
        let channel = ChannelById::<Test>::get(self.get_channel_id());
        let channel_bloat_bond_reciever = channel
            .channel_state_bloat_bond
            .get_recipient(self.get_sender());
        let bloat_bond_recipient_balance_pre =
            Balances::<Test>::free_balance(channel_bloat_bond_reciever);
        let bag_id_for_channel = Content::bag_id_for_channel(self.get_channel_id());

        let objects_state_bloat_bond =
            storage::DataObjectsById::<Test>::iter_prefix(&bag_id_for_channel).fold(
                BalanceOf::<Test>::zero(),
                |acc, (_, obj)| match obj.state_bloat_bond.get_recipient(self.get_sender())
                    == channel_bloat_bond_reciever
                {
                    true => acc + obj.state_bloat_bond.amount,
                    false => acc,
                },
            );

        let channel_objects_ids =
            storage::DataObjectsById::<Test>::iter_prefix(&bag_id_for_channel)
                .map(|(id, _)| id)
                .collect::<BTreeSet<_>>();

        let actual_result = self.execute_call();

        let bloat_bond_recipient_balance_post =
            Balances::<Test>::free_balance(channel_bloat_bond_reciever);
        let storage_root_post = storage_root(StateVersion::V1);

        assert_eq!(actual_result, expected_result);

        match actual_result {
            Ok(()) => {
                assert_eq!(
                    System::events().last().unwrap().event,
                    self.expected_event_on_success()
                );

                assert!(!<ChannelById<Test>>::contains_key(&self.get_channel_id()));
                assert!(!channel_objects_ids.iter().any(|id| {
                    storage::DataObjectsById::<Test>::contains_key(&bag_id_for_channel, id)
                }));
                assert!(!storage::Bags::<Test>::contains_key(&bag_id_for_channel));

                self.on_success_extra(
                    channel,
                    bloat_bond_recipient_balance_pre,
                    bloat_bond_recipient_balance_post,
                    objects_state_bloat_bond,
                );
            }

            Err(_) => {
                assert_eq!(storage_root_post, storage_root_pre);
            }
        }
    }
}

pub struct DeleteChannelFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: ChannelId,
    channel_bag_witness: ChannelBagWitness,
    num_objects_to_delete: u64,
}

impl DeleteChannelFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            channel_id: ChannelId::one(),
            channel_bag_witness: channel_bag_witness(ChannelId::one()),
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

    pub fn with_channel_bag_witness(self, channel_bag_witness: ChannelBagWitness) -> Self {
        Self {
            channel_bag_witness,
            ..self
        }
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
            Origin::signed(self.sender),
            self.actor,
            self.channel_id,
            self.channel_bag_witness.clone(),
            self.num_objects_to_delete,
        )
    }

    fn expected_event_on_success(&self) -> MetaEvent {
        MetaEvent::Content(RawEvent::ChannelDeleted(self.actor, self.channel_id))
    }

    fn on_success_extra(
        &self,
        _channel_pre: Channel<Test>,
        bloat_bond_reciever_balance_pre: BalanceOf<Test>,
        bloat_bond_reciever_balance_post: BalanceOf<Test>,
        data_obj_state_bloat_bond: BalanceOf<Test>,
    ) {
        assert_eq!(
            bloat_bond_reciever_balance_post.saturating_sub(bloat_bond_reciever_balance_pre),
            data_obj_state_bloat_bond + Content::channel_state_bloat_bond_value()
        );
    }
}

pub struct DeleteChannelAsModeratorFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: ChannelId,
    channel_bag_witness: ChannelBagWitness,
    num_objects_to_delete: u64,
    rationale: Vec<u8>,
}

impl DeleteChannelAsModeratorFixture {
    pub fn default() -> Self {
        Self {
            sender: LEAD_ACCOUNT_ID,
            actor: ContentActor::Lead,
            channel_id: ChannelId::one(),
            channel_bag_witness: channel_bag_witness(ChannelId::one()),
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

    pub fn with_channel_bag_witness(self, channel_bag_witness: ChannelBagWitness) -> Self {
        Self {
            channel_bag_witness,
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
            Origin::signed(self.sender),
            self.actor,
            self.channel_id,
            self.channel_bag_witness.clone(),
            self.num_objects_to_delete,
            self.rationale.clone(),
        )
    }

    fn expected_event_on_success(&self) -> MetaEvent {
        MetaEvent::Content(RawEvent::ChannelDeletedByModerator(
            self.actor,
            self.channel_id,
            self.rationale.clone(),
        ))
    }

    fn on_success_extra(
        &self,
        _channel_pre: Channel<Test>,
        bloat_bond_reciever_balance_pre: BalanceOf<Test>,
        bloat_bond_reciever_balance_post: BalanceOf<Test>,
        _data_obj_state_bloat_bond: BalanceOf<Test>,
    ) {
        assert_eq!(
            bloat_bond_reciever_balance_post,
            bloat_bond_reciever_balance_pre
        );
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
            Origin::signed(self.sender),
            self.actor,
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
                MetaEvent::Content(RawEvent::ChannelPausedFeaturesUpdatedByModerator(
                    self.actor,
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
            Origin::signed(self.sender),
            self.actor,
            self.channel_id,
            self.is_hidden,
            self.rationale.clone(),
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::Content(RawEvent::ChannelVisibilitySetByModerator(
                    self.actor,
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
            Origin::signed(self.sender),
            self.actor,
            self.video_id,
            self.is_hidden,
            self.rationale.clone(),
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::Content(RawEvent::VideoVisibilitySetByModerator(
                    self.actor,
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
    storage_buckets_num_witness: u32,
    assets_to_remove: BTreeSet<DataObjectId<Test>>,
    rationale: Vec<u8>,
}

impl DeleteVideoAssetsAsModeratorFixture {
    pub fn default() -> Self {
        Self {
            sender: LEAD_ACCOUNT_ID,
            actor: ContentActor::Lead,
            video_id: VideoId::one(),
            storage_buckets_num_witness: storage_buckets_num_witness(ChannelId::one()),
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

    pub fn with_storage_buckets_num_witness(self, storage_buckets_num_witness: u32) -> Self {
        Self {
            storage_buckets_num_witness,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);
        let balance_pre = Balances::<Test>::usable_balance(self.sender);
        let video_pre = Content::video_by_id(&self.video_id);
        let bag_id_for_channel = Content::bag_id_for_channel(&video_pre.in_channel);

        let state_bloat_bond_withdrawn = if !self.assets_to_remove.is_empty() {
            self.assets_to_remove
                .iter()
                .fold(BalanceOf::<Test>::zero(), |acc, obj_id| {
                    acc + storage::DataObjectsById::<Test>::get(&bag_id_for_channel, obj_id)
                        .state_bloat_bond
                        .amount
                })
        } else {
            BalanceOf::<Test>::zero()
        };

        let actual_result = Content::delete_video_assets_as_moderator(
            origin,
            self.actor,
            self.video_id,
            self.storage_buckets_num_witness,
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
                    MetaEvent::Content(RawEvent::VideoAssetsDeletedByModerator(
                        self.actor,
                        self.video_id,
                        self.assets_to_remove.clone(),
                        video_pre.nft_status.is_some(),
                        self.rationale.clone(),
                    ))
                );

                assert_eq!(
                    balance_post.saturating_sub(balance_pre),
                    state_bloat_bond_withdrawn,
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

    fn on_success_extra(
        &self,
        _video_pre: Video<Test>,
        _bloat_bond_reciever_balance_pre: BalanceOf<Test>,
        _bloat_bond_reciever_balance_post: BalanceOf<Test>,
        _data_obj_state_bloat_bond: BalanceOf<Test>,
    ) {
    }

    fn call_and_assert(&self, expected_result: DispatchResult) {
        let storage_root_pre = storage_root(StateVersion::V1);
        let video_pre = <VideoById<Test>>::get(&self.get_video_id());
        let video_bloat_bond_reciever = video_pre
            .video_state_bloat_bond
            .get_recipient(self.get_sender());
        let bloat_bond_reciever_balance_pre: BalanceOf<Test> =
            Balances::<Test>::free_balance(video_bloat_bond_reciever);
        let channel_bag_id = Content::bag_id_for_channel(&video_pre.in_channel);
        let data_obj_state_bloat_bond =
            video_pre
                .data_objects
                .iter()
                .fold(BalanceOf::<Test>::zero(), |acc, obj_id| {
                    let obj = storage::DataObjectsById::<Test>::get(&channel_bag_id, obj_id);
                    match obj.state_bloat_bond.get_recipient(self.get_sender())
                        == video_bloat_bond_reciever
                    {
                        true => acc + obj.state_bloat_bond.amount,
                        false => acc,
                    }
                });

        let actual_result = self.execute_call();
        let bloat_bond_reciever_balance_post: BalanceOf<Test> = Balances::<Test>::free_balance(
            video_pre
                .video_state_bloat_bond
                .get_recipient(self.get_sender()),
        );
        let storage_root_post = storage_root(StateVersion::V1);

        assert_eq!(actual_result, expected_result);

        match actual_result {
            Ok(()) => {
                assert_eq!(
                    System::events().last().unwrap().event,
                    self.expected_event_on_success()
                );

                assert!(!video_pre.data_objects.iter().any(|obj_id| {
                    storage::DataObjectsById::<Test>::contains_key(&channel_bag_id, obj_id)
                }));

                assert!(!<VideoById<Test>>::contains_key(self.get_video_id()));

                self.on_success_extra(
                    video_pre,
                    bloat_bond_reciever_balance_pre,
                    bloat_bond_reciever_balance_post,
                    data_obj_state_bloat_bond,
                );
            }
            Err(_) => {
                assert_eq!(storage_root_post, storage_root_pre);
            }
        }
    }
}

pub struct DeleteVideoFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    video_id: VideoId,
    num_objects_to_delete: u64,
    storage_buckets_num_witness: Option<u32>,
}

impl DeleteVideoFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id: VideoId::one(),
            num_objects_to_delete: DATA_OBJECTS_NUMBER,
            storage_buckets_num_witness: Some(storage_buckets_num_witness(ChannelId::one())),
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
        let video = Content::video_by_id(video_id);
        Self {
            video_id,
            storage_buckets_num_witness: Some(storage_buckets_num_witness(video.in_channel)),
            ..self
        }
    }

    pub fn with_storage_buckets_num_witness(
        self,
        storage_buckets_num_witness: Option<u32>,
    ) -> Self {
        Self {
            storage_buckets_num_witness,
            ..self
        }
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
            Origin::signed(self.sender),
            self.actor,
            self.video_id,
            self.num_objects_to_delete,
            self.storage_buckets_num_witness,
        )
    }

    fn expected_event_on_success(&self) -> MetaEvent {
        MetaEvent::Content(RawEvent::VideoDeleted(self.actor, self.video_id))
    }

    fn on_success_extra(
        &self,
        _video_pre: Video<Test>,
        bloat_bond_reciever_balance_pre: BalanceOf<Test>,
        bloat_bond_reciever_balance_post: BalanceOf<Test>,
        data_obj_state_bloat_bond: BalanceOf<Test>,
    ) {
        assert_eq!(
            bloat_bond_reciever_balance_post.saturating_sub(bloat_bond_reciever_balance_pre),
            data_obj_state_bloat_bond + Content::video_state_bloat_bond_value()
        );
    }
}

pub struct DeleteVideoAsModeratorFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    video_id: VideoId,
    storage_buckets_num_witness: Option<u32>,
    num_objects_to_delete: u64,
    rationale: Vec<u8>,
}

impl DeleteVideoAsModeratorFixture {
    pub fn default() -> Self {
        Self {
            sender: LEAD_ACCOUNT_ID,
            actor: ContentActor::Lead,
            video_id: VideoId::one(),
            storage_buckets_num_witness: Some(storage_buckets_num_witness(ChannelId::one())),
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

    pub fn with_storage_buckets_num_witness(
        self,
        storage_buckets_num_witness: Option<u32>,
    ) -> Self {
        Self {
            storage_buckets_num_witness,
            ..self
        }
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
            Origin::signed(self.sender),
            self.actor,
            self.video_id,
            self.storage_buckets_num_witness,
            self.num_objects_to_delete,
            self.rationale.clone(),
        )
    }

    fn expected_event_on_success(&self) -> MetaEvent {
        MetaEvent::Content(RawEvent::VideoDeletedByModerator(
            self.actor,
            self.video_id,
            self.rationale.clone(),
        ))
    }

    fn on_success_extra(
        &self,
        _video_pre: Video<Test>,
        bloat_bond_reciever_balance_pre: BalanceOf<Test>,
        bloat_bond_reciever_balance_post: BalanceOf<Test>,
        _data_obj_state_bloat_bond: BalanceOf<Test>,
    ) {
        assert_eq!(
            bloat_bond_reciever_balance_post,
            bloat_bond_reciever_balance_pre
        );
    }
}

pub struct UpdateChannelPayoutsFixture {
    origin: Origin,
    params: UpdateChannelPayoutsParameters<Test>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct UpdateChannelPayoutsFixtureStateSnapshot {
    pub commitment: HashOutput,
    pub min_cashout_allowed: BalanceOf<Test>,
    pub max_cashout_allowed: BalanceOf<Test>,
    pub cashouts_enabled: bool,
    pub uploader_account_balance: BalanceOf<Test>,
    pub next_object_id: DataObjectId<Test>,
}

impl UpdateChannelPayoutsFixture {
    pub fn default() -> Self {
        Self {
            origin: Origin::root(),
            params: UpdateChannelPayoutsParameters::<Test>::default(),
        }
    }

    pub fn with_origin(self, origin: Origin) -> Self {
        Self { origin, ..self }
    }

    pub fn with_commitment(self, commitment: Option<HashOutput>) -> Self {
        let params = UpdateChannelPayoutsParameters::<Test> {
            commitment,
            ..self.params
        };
        Self { params, ..self }
    }

    pub fn with_payload(self, payload: Option<ChannelPayoutsPayloadParameters<Test>>) -> Self {
        let params = UpdateChannelPayoutsParameters::<Test> {
            payload,
            ..self.params
        };
        Self { params, ..self }
    }

    pub fn with_min_cashout_allowed(self, min_cashout_allowed: Option<BalanceOf<Test>>) -> Self {
        let params = UpdateChannelPayoutsParameters::<Test> {
            min_cashout_allowed,
            ..self.params
        };
        Self { params, ..self }
    }

    pub fn with_max_cashout_allowed(self, max_cashout_allowed: Option<BalanceOf<Test>>) -> Self {
        let params = UpdateChannelPayoutsParameters::<Test> {
            max_cashout_allowed,
            ..self.params
        };
        Self { params, ..self }
    }

    pub fn with_channel_cashouts_enabled(self, channel_cashouts_enabled: Option<bool>) -> Self {
        let params = UpdateChannelPayoutsParameters::<Test> {
            channel_cashouts_enabled,
            ..self.params
        };
        Self { params, ..self }
    }

    fn get_state_snapshot(&self) -> UpdateChannelPayoutsFixtureStateSnapshot {
        UpdateChannelPayoutsFixtureStateSnapshot {
            commitment: Content::commitment(),
            min_cashout_allowed: Content::min_cashout_allowed(),
            max_cashout_allowed: Content::max_cashout_allowed(),
            cashouts_enabled: Content::channel_cashouts_enabled(),
            uploader_account_balance: self
                .params
                .payload
                .as_ref()
                .map_or(0, |p| Balances::<Test>::usable_balance(p.uploader_account)),
            next_object_id: storage::NextDataObjectId::<Test>::get(),
        }
    }

    fn verify_success_state(
        &self,
        snapshot_pre: &UpdateChannelPayoutsFixtureStateSnapshot,
        snapshot_post: &UpdateChannelPayoutsFixtureStateSnapshot,
    ) {
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::Content(RawEvent::ChannelPayoutsUpdated(
                self.params.clone(),
                self.params
                    .payload
                    .as_ref()
                    .map(|_| snapshot_pre.next_object_id)
            ))
        );
        if let Some(commitment) = self.params.commitment {
            assert_eq!(snapshot_post.commitment, commitment);
        } else {
            assert_eq!(snapshot_post.commitment, snapshot_pre.commitment);
        }

        if let Some(min_cashout_allowed) = self.params.min_cashout_allowed {
            assert_eq!(snapshot_post.min_cashout_allowed, min_cashout_allowed);
        } else {
            assert_eq!(
                snapshot_post.min_cashout_allowed,
                snapshot_pre.min_cashout_allowed
            );
        }

        if let Some(max_cashout_allowed) = self.params.max_cashout_allowed {
            assert_eq!(snapshot_post.max_cashout_allowed, max_cashout_allowed);
        } else {
            assert_eq!(
                snapshot_post.max_cashout_allowed,
                snapshot_pre.max_cashout_allowed
            );
        }

        if let Some(cashouts_enabled) = self.params.channel_cashouts_enabled {
            assert_eq!(snapshot_post.cashouts_enabled, cashouts_enabled);
        } else {
            assert_eq!(
                snapshot_post.cashouts_enabled,
                snapshot_pre.cashouts_enabled
            );
        }

        if self.params.payload.is_some() {
            assert_eq!(
                snapshot_post.next_object_id,
                snapshot_pre.next_object_id.saturating_add(One::one())
            );
            assert_eq!(
                snapshot_post.uploader_account_balance,
                snapshot_pre
                    .uploader_account_balance
                    .saturating_sub(Storage::<Test>::data_object_state_bloat_bond_value())
            );
        } else {
            assert_eq!(snapshot_post.next_object_id, snapshot_pre.next_object_id);
            assert_eq!(
                snapshot_post.uploader_account_balance,
                snapshot_pre.uploader_account_balance
            );
        }
    }

    fn verify_error_state(
        &self,
        snapshot_pre: &UpdateChannelPayoutsFixtureStateSnapshot,
        snapshot_post: &UpdateChannelPayoutsFixtureStateSnapshot,
    ) {
        assert_eq!(snapshot_post, snapshot_pre);
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let snapshot_pre = self.get_state_snapshot();

        let actual_result =
            Content::update_channel_payouts(self.origin.clone(), self.params.clone());

        let snapshot_post = self.get_state_snapshot();

        assert_eq!(actual_result, expected_result);
        if actual_result.is_ok() {
            self.verify_success_state(&snapshot_pre, &snapshot_post);
        } else {
            self.verify_error_state(&snapshot_pre, &snapshot_post);
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
                cumulative_reward_earned: DEFAULT_PAYOUT_CLAIMED,
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
        let origin = Origin::signed(self.sender);
        let channel_pre = Content::channel_by_id(self.item.channel_id);
        let channel_balance_pre = channel_reward_account_balance(self.item.channel_id);
        let council_budget_pre = <Test as Config>::CouncilBudgetManager::get_budget();

        let proof = if self.payments.is_empty() {
            vec![]
        } else {
            build_merkle_path_helper::<Test, _>(&self.payments, DEFAULT_PROOF_INDEX)
        };

        let actual_result = Content::claim_channel_reward(origin, self.actor, proof, self.item);

        let channel_post = Content::channel_by_id(self.item.channel_id);
        let channel_balance_post = channel_reward_account_balance(self.item.channel_id);
        let council_budget_post = <Test as Config>::CouncilBudgetManager::get_budget();

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            let cashout = self
                .item
                .cumulative_reward_earned
                .saturating_sub(channel_pre.cumulative_reward_claimed);
            assert_eq!(
                channel_balance_post.saturating_sub(channel_balance_pre),
                cashout
            );
            assert_eq!(
                channel_post.cumulative_reward_claimed,
                self.item.cumulative_reward_earned
            );
            assert_eq!(
                council_budget_post,
                council_budget_pre.saturating_sub(cashout)
            );
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::Content(RawEvent::ChannelRewardUpdated(
                    self.item.cumulative_reward_earned,
                    self.item.channel_id
                ))
            );
        } else {
            assert_eq!(council_budget_post, council_budget_pre);
            assert_eq!(channel_balance_post, channel_balance_pre);
            assert_eq!(channel_post, channel_pre);
        }
    }
}

pub struct WithdrawFromChannelBalanceFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: ChannelId,
    amount: BalanceOf<Test>,
}

impl WithdrawFromChannelBalanceFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            channel_id: ChannelId::one(),
            amount: DEFAULT_PAYOUT_EARNED,
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

    pub fn with_amount(self, amount: BalanceOf<Test>) -> Self {
        Self { amount, ..self }
    }

    fn balance_of(
        dest: &ChannelFundsDestination<<Test as frame_system::Config>::AccountId>,
    ) -> BalanceOf<Test> {
        match dest {
            ChannelFundsDestination::AccountId(account_id) => {
                Balances::<Test>::usable_balance(account_id)
            }
            ChannelFundsDestination::CouncilBudget => {
                <Test as Config>::CouncilBudgetManager::get_budget()
            }
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);

        let channel_pre = Content::channel_by_id(self.channel_id);
        let channel_balance_pre = channel_reward_account_balance(self.channel_id);
        let expected_dest = match channel_pre.owner {
            ChannelOwner::Member(member_id) => {
                ChannelFundsDestination::<<Test as frame_system::Config>::AccountId>::AccountId(
                    TestMemberships::controller_account_id(member_id).unwrap_or_default(),
                )
            }
            ChannelOwner::CuratorGroup(..) => {
                ChannelFundsDestination::<<Test as frame_system::Config>::AccountId>::CouncilBudget
            }
        };
        let dest_balance_pre = Self::balance_of(&expected_dest);

        let actual_result = Content::withdraw_from_channel_balance(
            origin,
            self.actor,
            self.channel_id,
            self.amount,
        );

        let channel_post = Content::channel_by_id(self.channel_id);
        let channel_balance_post = channel_reward_account_balance(self.channel_id);
        let dest_balance_post = Self::balance_of(&expected_dest);

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                dest_balance_post,
                dest_balance_pre.saturating_add(self.amount)
            );
            assert_eq!(
                channel_balance_post,
                channel_balance_pre.saturating_sub(self.amount)
            );
            assert_eq!(channel_post, channel_pre);
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::Content(RawEvent::ChannelFundsWithdrawn(
                    self.actor,
                    self.channel_id,
                    self.amount,
                    expected_dest,
                ))
            );
        } else {
            assert_eq!(channel_balance_post, channel_balance_pre);
            assert_eq!(dest_balance_post, dest_balance_pre);
            assert_eq!(channel_post, channel_pre);
        }
    }
}

pub struct ClaimAndWithdrawChannelRewardFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    payments: Vec<PullPayment<Test>>,
    item: PullPayment<Test>,
}

impl ClaimAndWithdrawChannelRewardFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            payments: create_some_pull_payments_helper(),
            item: PullPayment::<Test> {
                channel_id: ChannelId::one(),
                cumulative_reward_earned: DEFAULT_PAYOUT_CLAIMED,
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

    fn balance_of(
        dest: &ChannelFundsDestination<<Test as frame_system::Config>::AccountId>,
    ) -> BalanceOf<Test> {
        match dest {
            ChannelFundsDestination::AccountId(account_id) => {
                Balances::<Test>::usable_balance(account_id)
            }
            ChannelFundsDestination::CouncilBudget => {
                <Test as Config>::CouncilBudgetManager::get_budget()
            }
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);
        let channel_pre = Content::channel_by_id(&self.item.channel_id);
        let channel_balance_pre = channel_reward_account_balance(self.item.channel_id);
        let expected_dest = match channel_pre.owner {
            ChannelOwner::Member(member_id) => {
                ChannelFundsDestination::<<Test as frame_system::Config>::AccountId>::AccountId(
                    TestMemberships::controller_account_id(member_id).unwrap_or_default(),
                )
            }
            ChannelOwner::CuratorGroup(..) => {
                ChannelFundsDestination::<<Test as frame_system::Config>::AccountId>::CouncilBudget
            }
        };
        let dest_balance_pre = Self::balance_of(&expected_dest);
        let council_budget_pre = <Test as Config>::CouncilBudgetManager::get_budget();

        let proof = if self.payments.is_empty() {
            vec![]
        } else {
            build_merkle_path_helper::<Test, _>(&self.payments, DEFAULT_PROOF_INDEX)
        };

        let actual_result =
            Content::claim_and_withdraw_channel_reward(origin, self.actor, proof, self.item);

        let channel_post = Content::channel_by_id(&self.item.channel_id);
        let channel_balance_post = channel_reward_account_balance(self.item.channel_id);
        let dest_balance_post = Self::balance_of(&expected_dest);
        let council_budget_post = <Test as Config>::CouncilBudgetManager::get_budget();

        assert_eq!(actual_result, expected_result);

        let amount_claimed = self
            .item
            .cumulative_reward_earned
            .saturating_sub(channel_pre.cumulative_reward_claimed);

        if actual_result.is_ok() {
            assert_eq!(
                channel_post.cumulative_reward_claimed,
                self.item.cumulative_reward_earned
            );
            assert_eq!(
                (dest_balance_post, council_budget_post),
                match expected_dest {
                    // Funds are first claimed from, then withdrawn into the council budget
                    ChannelFundsDestination::CouncilBudget =>
                        (dest_balance_pre, council_budget_pre),
                    // Funds are taken from council budget and withdrawn into an account
                    _ => (
                        dest_balance_pre.saturating_add(amount_claimed),
                        council_budget_pre.saturating_sub(amount_claimed)
                    ),
                }
            );
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::Content(RawEvent::ChannelRewardClaimedAndWithdrawn(
                    self.actor,
                    self.item.channel_id,
                    amount_claimed,
                    expected_dest,
                ))
            );
        } else {
            assert_eq!(council_budget_post, council_budget_pre);
            assert_eq!(channel_balance_post, channel_balance_pre);
            assert_eq!(dest_balance_post, dest_balance_pre);
            assert_eq!(channel_post, channel_pre);
        }
    }
}

pub struct IssueCreatorTokenFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: ChannelId,
    params: TokenIssuanceParametersOf<Test>,
}

impl IssueCreatorTokenFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            channel_id: ChannelId::one(),
            params: TokenIssuanceParametersOf::<Test> {
                symbol: Hashing::hash_of(b"CRT"),
                patronage_rate: DEFAULT_PATRONAGE_RATE,
                revenue_split_rate: DEFAULT_SPLIT_RATE,
                ..Default::default()
            },
        }
        .with_initial_allocation_to(DEFAULT_MEMBER_ID)
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn with_initial_allocation_to(self, member_id: MemberId) -> Self {
        Self {
            params: TokenIssuanceParametersOf::<Test> {
                initial_allocation: [(
                    member_id,
                    TokenAllocationOf::<Test> {
                        amount: DEFAULT_CREATOR_TOKEN_ISSUANCE,
                        vesting_schedule_params: None,
                    },
                )]
                .iter()
                .cloned()
                .collect(),
                ..self.params
            },
            ..self
        }
    }

    pub fn with_initial_allocation(
        self,
        initial_allocation: BTreeMap<MemberId, TokenAllocationOf<Test>>,
    ) -> Self {
        Self {
            params: TokenIssuanceParametersOf::<Test> {
                initial_allocation,
                ..self.params
            },
            ..self
        }
    }

    pub fn with_transfer_policy(self, transfer_policy: TransferPolicyParamsOf<Test>) -> Self {
        Self {
            params: TokenIssuanceParametersOf::<Test> {
                transfer_policy,
                ..self.params
            },
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);

        let expected_token_id = project_token::Module::<Test>::next_token_id();
        let channel_pre = Content::channel_by_id(self.channel_id);

        let actual_result =
            Content::issue_creator_token(origin, self.actor, self.channel_id, self.params.clone());

        let channel_post = Content::channel_by_id(self.channel_id);

        if expected_result.is_ok() {
            assert_ok!(actual_result);
            assert_eq!(
                channel_post,
                Channel::<Test> {
                    creator_token_id: Some(expected_token_id),
                    ..channel_pre
                }
            );
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::Content(RawEvent::CreatorTokenIssued(
                    self.actor,
                    self.channel_id,
                    expected_token_id
                ))
            );
        } else {
            assert_noop!(actual_result, expected_result.err().unwrap());
        }
    }
}

pub struct InitCreatorTokenSaleFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: ChannelId,
    params: TokenSaleParamsOf<Test>,
}

impl InitCreatorTokenSaleFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            channel_id: ChannelId::one(),
            params: TokenSaleParamsOf::<Test> {
                unit_price: DEFAULT_CREATOR_TOKEN_SALE_UNIT_PRICE,
                upper_bound_quantity: DEFAULT_CREATOR_TOKEN_ISSUANCE,
                starts_at: None,
                duration: DEFAULT_CREATOR_TOKEN_SALE_DURATION,
                vesting_schedule_params: None,
                cap_per_member: None,
                metadata: None,
            },
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn with_start_block(self, start_block: u64) -> Self {
        Self {
            params: TokenSaleParamsOf::<Test> {
                starts_at: Some(start_block),
                ..self.params
            },
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);

        let actual_result = Content::init_creator_token_sale(
            origin,
            self.actor,
            self.channel_id,
            self.params.clone(),
        );

        if expected_result.is_ok() {
            assert_ok!(actual_result);
        } else {
            assert_noop!(actual_result, expected_result.err().unwrap());
        }
    }
}

pub struct UpdateUpcomingCreatorTokenSaleFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: ChannelId,
    new_start_block: Option<u64>,
    new_duration: Option<u64>,
}

impl UpdateUpcomingCreatorTokenSaleFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            channel_id: ChannelId::one(),
            new_start_block: Some(123),
            new_duration: Some(DEFAULT_CREATOR_TOKEN_SALE_DURATION + 1),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);

        let actual_result = Content::update_upcoming_creator_token_sale(
            origin,
            self.actor,
            self.channel_id,
            self.new_start_block,
            self.new_duration,
        );

        if expected_result.is_ok() {
            assert_ok!(actual_result);
        } else {
            assert_noop!(actual_result, expected_result.err().unwrap());
        }
    }
}

pub struct CreatorTokenIssuerTransferFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: ChannelId,
    outputs: TransferWithVestingOutputsOf<Test>,
    metadata: Vec<u8>,
}

impl CreatorTokenIssuerTransferFixture {
    pub fn default() -> Self {
        let outputs = TransferWithVestingOutputsOf::<Test>::try_from(
            vec![(SECOND_MEMBER_ID, DEFAULT_ISSUER_TRANSFER_AMOUNT)]
                .into_iter()
                .map(|(member, amount)| (member, amount.into()))
                .collect::<BTreeMap<_, _>>(),
        )
        .ok()
        .unwrap();
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            channel_id: ChannelId::one(),
            outputs,
            metadata: b"metadata".to_vec(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);

        let actual_result = Content::creator_token_issuer_transfer(
            origin,
            self.actor,
            self.channel_id,
            self.outputs.clone(),
            self.metadata.clone(),
        );

        if expected_result.is_ok() {
            assert_ok!(actual_result);
        } else {
            assert_noop!(actual_result, expected_result.err().unwrap());
        }
    }
}

pub struct ReduceCreatorTokenPatronageRateFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: ChannelId,
    target_rate: YearlyRate,
}

impl ReduceCreatorTokenPatronageRateFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            channel_id: ChannelId::one(),
            target_rate: YearlyRate(
                DEFAULT_PATRONAGE_RATE
                    .0
                    .saturating_sub(Permill::from_perthousand(5)),
            ),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);

        let actual_result = Content::reduce_creator_token_patronage_rate_to(
            origin,
            self.actor,
            self.channel_id,
            self.target_rate,
        );

        if expected_result.is_ok() {
            assert_ok!(actual_result);
        } else {
            assert_noop!(actual_result, expected_result.err().unwrap());
        }
    }
}

pub struct ClaimCreatorTokenPatronageCreditFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: ChannelId,
}

impl ClaimCreatorTokenPatronageCreditFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            channel_id: ChannelId::one(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);

        let actual_result =
            Content::claim_creator_token_patronage_credit(origin, self.actor, self.channel_id);

        if expected_result.is_ok() {
            assert_ok!(actual_result);
        } else {
            assert_noop!(actual_result, expected_result.err().unwrap());
        }
    }
}

pub struct MakeCreatorTokenPermissionlessFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: ChannelId,
}

impl MakeCreatorTokenPermissionlessFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            channel_id: ChannelId::one(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);

        let actual_result =
            Content::make_creator_token_permissionless(origin, self.actor, self.channel_id);

        if expected_result.is_ok() {
            assert_ok!(actual_result);
        } else {
            assert_noop!(actual_result, expected_result.err().unwrap());
        }
    }
}

pub struct IssueRevenueSplitFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: ChannelId,
    start: Option<u64>,
    duration: u64,
}

impl IssueRevenueSplitFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            channel_id: ChannelId::one(),
            start: None,
            duration: DEFAULT_REVENUE_SPLIT_DURATION,
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn with_starting_block(self, block: u64) -> Self {
        Self {
            start: Some(block),
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);

        let actual_result = Content::issue_revenue_split(
            origin,
            self.actor,
            self.channel_id,
            self.start,
            self.duration,
        );

        if expected_result.is_ok() {
            assert_ok!(actual_result);
        } else {
            assert_noop!(actual_result, expected_result.err().unwrap());
        }
    }
}

pub struct FinalizeRevenueSplitFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: ChannelId,
}

impl FinalizeRevenueSplitFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            channel_id: ChannelId::one(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);

        let actual_result = Content::finalize_revenue_split(origin, self.actor, self.channel_id);

        if expected_result.is_ok() {
            assert_ok!(actual_result);
        } else {
            assert_noop!(actual_result, expected_result.err().unwrap());
        }
    }
}

pub struct ActivateAmmFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: ChannelId,
    params: AmmParamsOf<Test>,
}

impl ActivateAmmFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            channel_id: ChannelId::one(),
            params: AmmParamsOf::<Test> {
                slope: 10u32.into(),
                intercept: Zero::zero(),
            },
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);

        let actual_result =
            Content::activate_amm(origin, self.actor, self.channel_id, self.params.clone());

        if expected_result.is_ok() {
            assert_ok!(actual_result);
        } else {
            assert_noop!(actual_result, expected_result.err().unwrap());
        }
    }
}
pub struct DeactivateAmmFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: ChannelId,
}

impl DeactivateAmmFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            channel_id: ChannelId::one(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);

        let actual_result = Content::deactivate_amm(origin, self.actor, self.channel_id);

        if expected_result.is_ok() {
            assert_ok!(actual_result);
        } else {
            assert_noop!(actual_result, expected_result.err().unwrap());
        }
    }
}

pub struct FinalizeCreatorTokenSaleFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: ChannelId,
}

impl FinalizeCreatorTokenSaleFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            channel_id: ChannelId::one(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);

        let council_budget_pre = <Test as Config>::CouncilBudgetManager::get_budget();
        let channel = Content::channel_by_id(self.channel_id);
        let joy_collected = channel.creator_token_id.map_or(0, |t_id| {
            project_token::Module::<Test>::token_info_by_id(t_id)
                .sale
                .map_or(0, |s| s.funds_collected)
        });

        let actual_result =
            Content::finalize_creator_token_sale(origin, self.actor, self.channel_id);

        let council_budget_post = <Test as Config>::CouncilBudgetManager::get_budget();

        if expected_result.is_ok() {
            assert_ok!(actual_result);
            if let ChannelOwner::CuratorGroup(_) = channel.owner {
                assert_eq!(
                    council_budget_post,
                    council_budget_pre.saturating_add(joy_collected)
                );
            } else {
                assert_eq!(council_budget_post, council_budget_pre);
            }
        } else {
            assert_noop!(actual_result, expected_result.err().unwrap());
        }
    }
}

pub struct UpdateChannelStateBloatBondFixture {
    sender: AccountId,
    new_channel_state_bloat_bond: BalanceOf<Test>,
}

impl UpdateChannelStateBloatBondFixture {
    pub fn default() -> Self {
        Self {
            sender: LEAD_ACCOUNT_ID,
            new_channel_state_bloat_bond: DEFAULT_CHANNEL_STATE_BLOAT_BOND,
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_channel_state_bloat_bond(
        self,
        new_channel_state_bloat_bond: BalanceOf<Test>,
    ) -> Self {
        Self {
            new_channel_state_bloat_bond,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);
        let channel_state_bloat_bond_pre = Content::channel_state_bloat_bond_value();

        let actual_result =
            Content::update_channel_state_bloat_bond(origin, self.new_channel_state_bloat_bond);

        let channel_state_bloat_bond_post = Content::channel_state_bloat_bond_value();

        assert_eq!(actual_result, expected_result);
        if actual_result.is_ok() {
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::Content(RawEvent::ChannelStateBloatBondValueUpdated(
                    self.new_channel_state_bloat_bond
                ))
            );
            assert_eq!(
                channel_state_bloat_bond_post,
                self.new_channel_state_bloat_bond
            );
        } else {
            assert_eq!(channel_state_bloat_bond_post, channel_state_bloat_bond_pre);
        }
    }
}

pub struct UpdateVideoStateBloatBondFixture {
    sender: AccountId,
    new_video_state_bloat_bond: BalanceOf<Test>,
}

impl UpdateVideoStateBloatBondFixture {
    pub fn default() -> Self {
        Self {
            sender: LEAD_ACCOUNT_ID,
            new_video_state_bloat_bond: DEFAULT_VIDEO_STATE_BLOAT_BOND,
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_video_state_bloat_bond(self, new_video_state_bloat_bond: BalanceOf<Test>) -> Self {
        Self {
            new_video_state_bloat_bond,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);
        let video_state_bloat_bond_pre = Content::video_state_bloat_bond_value();

        let actual_result =
            Content::update_video_state_bloat_bond(origin, self.new_video_state_bloat_bond);

        let video_state_bloat_bond_post = Content::video_state_bloat_bond_value();

        assert_eq!(actual_result, expected_result);
        if actual_result.is_ok() {
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::Content(RawEvent::VideoStateBloatBondValueUpdated(
                    self.new_video_state_bloat_bond
                ))
            );
            assert_eq!(video_state_bloat_bond_post, self.new_video_state_bloat_bond);
        } else {
            assert_eq!(video_state_bloat_bond_post, video_state_bloat_bond_pre);
        }
    }
}

pub struct DeissueCreatorTokenFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: ChannelId,
}

impl DeissueCreatorTokenFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            channel_id: ChannelId::one(),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender);

        let channel_pre = Content::channel_by_id(self.channel_id);

        let actual_result = Content::deissue_creator_token(origin, self.actor, self.channel_id);

        let channel_post = Content::channel_by_id(self.channel_id);

        if expected_result.is_ok() {
            assert_ok!(actual_result);

            assert_eq!(
                channel_post,
                Channel::<Test> {
                    creator_token_id: None,
                    ..channel_pre
                }
            );
        } else {
            assert_noop!(actual_result, expected_result.err().unwrap());
        }
    }
}

pub struct CancelChannelTransferFixture {
    origin: RawOrigin<U256>,
    channel_id: u64,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
}

impl CancelChannelTransferFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID),
            channel_id: ChannelId::one(),
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self {
            origin: RawOrigin::Signed(sender),
            ..self
        }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn with_channel_id(self, channel_id: ChannelId) -> Self {
        Self { channel_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Content::cancel_channel_transfer(
            self.origin.clone().into(),
            self.channel_id,
            self.actor,
        );

        assert_eq!(actual_result, expected_result);
    }
}

pub struct InitializeChannelTransferFixture {
    origin: RawOrigin<U256>,
    channel_id: u64,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    transfer_params: InitTransferParametersOf<Test>,
}

impl InitializeChannelTransferFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID),
            channel_id: ChannelId::one(),
            actor: ContentActor::Member(DEFAULT_MEMBER_ID),
            transfer_params: InitTransferParametersOf::<Test> {
                new_collaborators: BTreeMap::new(),
                price: BalanceOf::<Test>::zero(),
                new_owner: ChannelOwner::Member(SECOND_MEMBER_ID),
            },
        }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self {
            origin: RawOrigin::Signed(sender),
            ..self
        }
    }

    pub fn with_origin(self, origin: RawOrigin<U256>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn with_channel_id(self, channel_id: ChannelId) -> Self {
        Self { channel_id, ..self }
    }

    pub fn with_collaborators(
        self,
        new_collaborators: BTreeMap<MemberId, ChannelAgentPermissions>,
    ) -> Self {
        Self {
            transfer_params: InitTransferParametersOf::<Test> {
                new_collaborators,
                ..self.transfer_params
            },
            ..self
        }
    }

    pub fn with_price(self, price: u64) -> Self {
        Self {
            transfer_params: InitTransferParametersOf::<Test> {
                price,
                ..self.transfer_params
            },
            ..self
        }
    }

    pub fn with_new_member_channel_owner(self, member_id: MemberId) -> Self {
        Self {
            transfer_params: InitTransferParametersOf::<Test> {
                new_owner: ChannelOwner::Member(member_id),
                ..self.transfer_params
            },
            ..self
        }
    }

    pub fn with_new_channel_owner(self, new_owner: ChannelOwner<MemberId, CuratorGroupId>) -> Self {
        Self {
            transfer_params: InitTransferParametersOf::<Test> {
                new_owner,
                ..self.transfer_params
            },
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Content::initialize_channel_transfer(
            self.origin.clone().into(),
            self.channel_id,
            self.actor,
            self.transfer_params.clone(),
        );

        assert_eq!(actual_result, expected_result);
    }
}

pub struct AcceptChannelTransferFixture {
    origin: RawOrigin<U256>,
    channel_id: u64,
    params: TransferCommitmentWitnessOf<Test>,
}

impl AcceptChannelTransferFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(DEFAULT_MEMBER_ACCOUNT_ID),
            channel_id: ChannelId::one(),
            params: TransferCommitmentParameters {
                transfer_id: TransferId::one(),
                price: DEFAULT_CHANNEL_TRANSFER_PRICE,
                ..Default::default()
            },
        }
    }

    pub fn with_origin(self, origin: RawOrigin<U256>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_channel_id(self, channel_id: ChannelId) -> Self {
        Self { channel_id, ..self }
    }

    pub fn with_transfer_params(self, params: TransferCommitmentWitnessOf<Test>) -> Self {
        Self { params, ..self }
    }

    pub fn with_price(self, price: u64) -> Self {
        let old_transfer_params = self.params.clone();
        self.with_transfer_params(TransferCommitmentWitnessOf::<Test> {
            price,
            ..old_transfer_params
        })
    }

    pub fn with_transfer_id(self, id: u64) -> Self {
        let old_transfer_params = self.params.clone();
        self.with_transfer_params(TransferCommitmentWitnessOf::<Test> {
            transfer_id: id,
            ..old_transfer_params
        })
    }

    pub fn with_collaborators(
        self,
        new_collaborators: BTreeMap<MemberId, ChannelAgentPermissions>,
    ) -> Self {
        let old_transfer_params = self.params.clone();
        self.with_transfer_params(TransferCommitmentWitnessOf::<Test> {
            new_collaborators,
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
                new_channel.collaborators,
                try_into_stored_collaborators_map::<Test>(&self.params.new_collaborators).unwrap()
            );
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::Content(RawEvent::ChannelTransferAccepted(
                    self.channel_id,
                    self.params.clone()
                ))
            );
        } else {
            assert_eq!(new_channel.transfer_status, old_channel.transfer_status,);
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

    pub fn with_non_channel_owner(self, owner: MemberId) -> Self {
        let new_params = NftIssuanceParameters::<Test> {
            non_channel_owner: Some(owner),
            ..self.params.clone()
        };
        self.with_params(new_params)
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn with_init_status(
        self,
        init_transactional_status: InitTransactionalStatus<Test>,
    ) -> Self {
        let new_params = NftIssuanceParameters::<Test> {
            init_transactional_status,
            ..self.params.clone()
        };
        self.with_params(new_params)
    }

    pub fn with_royalty(self, royalty_pct: Perbill) -> Self {
        let new_params = NftIssuanceParameters::<Test> {
            royalty: Some(royalty_pct),
            ..self.params.clone()
        };
        self.with_params(new_params)
    }

    #[allow(dead_code)]
    pub fn with_video_id(self, video_id: VideoId) -> Self {
        Self { video_id, ..self }
    }

    pub fn with_params(self, params: NftIssuanceParameters<Test>) -> Self {
        Self { params, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let video_pre = Content::video_by_id(self.video_id);

        let actual_result = Content::issue_nft(
            Origin::signed(self.sender),
            self.actor,
            self.video_id,
            self.params.clone(),
        );

        assert_eq!(actual_result, expected_result);

        let video_post = Content::video_by_id(self.video_id);

        if actual_result.is_ok() {
            let expected_nft_status = match self.params.init_transactional_status.clone() {
                InitTransactionalStatus::<Test>::Idle => TransactionalStatus::<Test>::Idle,
                InitTransactionalStatus::<Test>::InitiatedOfferToMember(member, balance) => {
                    TransactionalStatus::<Test>::InitiatedOfferToMember(member, balance)
                }
                InitTransactionalStatus::<Test>::BuyNow(balance) => {
                    TransactionalStatus::<Test>::BuyNow(balance)
                }
                InitTransactionalStatus::<Test>::EnglishAuction(params) => {
                    let english_auction =
                        EnglishAuction::<Test>::try_new::<Test>(params, System::block_number())
                            .unwrap();
                    TransactionalStatus::<Test>::EnglishAuction(english_auction)
                }
                InitTransactionalStatus::<Test>::OpenAuction(params) => {
                    let open_auction = OpenAuction::<Test>::try_new::<Test>(
                        params,
                        Zero::zero(),
                        System::block_number(),
                    )
                    .unwrap();
                    TransactionalStatus::<Test>::OpenAuction(open_auction)
                }
            };
            assert!(video_post.nft_status.is_some());
            let nft_status = video_post.nft_status.unwrap();
            assert_eq!(
                nft_status.owner,
                self.params
                    .non_channel_owner
                    .map_or(NftOwner::ChannelOwner, NftOwner::Member)
            );
            assert_eq!(nft_status.transactional_status, expected_nft_status);
            assert_eq!(nft_status.creator_royalty, self.params.royalty);
            assert_eq!(
                nft_status.open_auctions_nonce,
                <Test as Config>::OpenAuctionId::zero()
            );
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::Content(RawEvent::NftIssued(
                    self.actor,
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
                starts_at: None,
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
            Origin::signed(self.sender),
            self.actor,
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
                    transactional_status: TransactionalStatus::<Test>::OpenAuction(
                        OpenAuction::<Test>::try_new::<Test>(
                            self.params.clone(),
                            pre_nft_status.open_auctions_nonce.saturating_add(1),
                            System::block_number()
                        )
                        .unwrap()
                    ),
                    open_auctions_nonce: pre_nft_status.open_auctions_nonce.saturating_add(1),
                    ..pre_nft_status
                }
            );
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::Content(RawEvent::OpenAuctionStarted(
                    self.actor,
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
                duration: Content::min_auction_duration(),
                min_bid_step: Content::min_bid_step(),
                starts_at: None,
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

    pub fn with_buy_now_price(self, price: BalanceOf<Test>) -> Self {
        Self {
            params: EnglishAuctionParams::<Test> {
                buy_now_price: Some(price),
                ..self.params
            },
            ..self
        }
    }

    pub fn with_min_bid_step(self, min_bid_step: BalanceOf<Test>) -> Self {
        Self {
            params: EnglishAuctionParams::<Test> {
                min_bid_step,
                ..self.params
            },
            ..self
        }
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
            Origin::signed(self.sender),
            self.actor,
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
                        EnglishAuction::<Test>::try_new::<Test>(
                            self.params.clone(),
                            System::block_number()
                        )
                        .unwrap()
                    ),
                    ..pre_nft_status
                }
            );
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::Content(RawEvent::EnglishAuctionStarted(
                    self.actor,
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

    pub fn with_to(self, to: MemberId) -> Self {
        Self { to, ..self }
    }

    pub fn with_price(self, price: Option<BalanceOf<Test>>) -> Self {
        Self { price, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let video_pre = Content::video_by_id(self.video_id);

        let actual_result = Content::offer_nft(
            Origin::signed(self.sender),
            self.video_id,
            self.actor,
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
                MetaEvent::Content(RawEvent::OfferStarted(
                    self.video_id,
                    self.actor,
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
        let winner_account = TestMemberships::controller_account_id(self.member_id).ok();
        let channel_account = ContentTreasury::<Test>::account_for_channel(video.in_channel);
        let owner_account = video.nft_status.as_ref().map(|s| match s.owner {
            NftOwner::Member(member_id) => {
                TestMemberships::controller_account_id(member_id).unwrap()
            }
            NftOwner::ChannelOwner => {
                ContentTreasury::<Test>::account_for_channel(video.in_channel)
            }
        });

        NftAuctionStateSnapshot {
            video: Content::video_by_id(self.video_id),
            winner_balance: winner_account.map(|a| Balances::<Test>::usable_balance(&a)),
            treasury_balance: ContentTreasury::<Test>::usable_balance(),
            owner_balance: owner_account.map(Balances::<Test>::usable_balance),
            channel_balance: Balances::<Test>::usable_balance(channel_account),
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let snapshot_pre = Self::create_auction_state_snapshot(self);
        let bid_pre = Content::open_auction_bid_by_video_and_member(self.video_id, self.member_id);

        let actual_result = Content::make_open_auction_bid(
            Origin::signed(self.sender),
            self.member_id,
            self.video_id,
            self.bid,
        );

        assert_eq!(actual_result, expected_result);

        let snapshot_post = Self::create_auction_state_snapshot(self);
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
                            MetaEvent::Content(RawEvent::AuctionBidMade(
                                self.member_id,
                                self.video_id,
                                self.bid,
                                None
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
                            MetaEvent::Content(RawEvent::BidMadeCompletingAuction(
                                self.member_id,
                                self.video_id,
                                None
                            ))
                        );
                    }
                }
                _ => panic!(),
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
        let winner_account = TestMemberships::controller_account_id(self.winner_id).ok();
        let channel_account = ContentTreasury::<Test>::account_for_channel(video.in_channel);

        NftAuctionStateSnapshot {
            video: Content::video_by_id(self.video_id),
            winner_balance: winner_account.map(|a| Balances::<Test>::usable_balance(&a)),
            treasury_balance: ContentTreasury::<Test>::usable_balance(),
            owner_balance: Some(Balances::<Test>::usable_balance(self.sender)),
            channel_balance: Balances::<Test>::usable_balance(channel_account),
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let snapshot_pre = Self::create_auction_state_snapshot(self);

        let actual_result = Content::pick_open_auction_winner(
            Origin::signed(self.sender),
            self.actor,
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
                MetaEvent::Content(RawEvent::OpenAuctionBidAccepted(
                    self.actor,
                    self.video_id,
                    self.winner_id,
                    self.commitment
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
            Origin::signed(self.sender),
            self.actor,
            self.video_id,
            self.msg.clone(),
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::Content(RawEvent::NftOwnerRemarked(
                    self.actor,
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

        let actual_result =
            Content::destroy_nft(Origin::signed(self.sender), self.actor, self.video_id);

        let video_post = Content::video_by_id(self.video_id);

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert!(video_post.nft_status.is_none());
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::Content(RawEvent::NftDestroyed(self.actor, self.video_id))
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
            Origin::signed(self.sender),
            self.actor,
            self.channel_id,
            self.msg.clone(),
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::Content(RawEvent::ChannelAgentRemarked(
                    self.actor,
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
    winner_balance: Option<BalanceOf<Test>>,
    treasury_balance: BalanceOf<Test>,
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
    assert!(snapshot_pre.winner_balance.is_some());
    assert!(snapshot_post.winner_balance.is_some());
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
    if was_new_bid {
        // If new bid immediately completed auction - expect winner balance decreased
        assert_eq!(
            snapshot_post.winner_balance.unwrap(),
            snapshot_pre.winner_balance.unwrap().saturating_sub(amount)
        );
    } else {
        // If already existing bid was chosen as a winner - expect treasury balance decreased
        assert_eq!(
            snapshot_post.treasury_balance,
            snapshot_pre.treasury_balance.saturating_sub(amount)
        );
    }
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
            Origin::signed(self.sender),
            self.video_id,
            self.actor,
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
                MetaEvent::Content(RawEvent::NftSellOrderMade(
                    self.video_id,
                    self.actor,
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

        let actual_result = call(Origin::signed(self.sender), self.actor, self.video_id);

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
                MetaEvent::Content(RawEvent::AuctionCanceled(self.actor, self.video_id,))
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

        let actual_result =
            Content::cancel_offer(Origin::signed(self.sender), self.actor, self.video_id);

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
                MetaEvent::Content(RawEvent::OfferCanceled(self.video_id, self.actor))
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

        let actual_result =
            Content::cancel_buy_now(Origin::signed(self.sender), self.actor, self.video_id);

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
                MetaEvent::Content(RawEvent::BuyNowCanceled(self.video_id, self.actor))
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
            Origin::signed(self.sender),
            self.actor,
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
                MetaEvent::Content(RawEvent::BuyNowPriceUpdated(
                    self.video_id,
                    self.actor,
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
            .with_sender(self.sender)
            .with_actor(self.actor)
            .call_and_assert(Ok(()));
        // Issue nft during video creation
        CreateVideoFixture::default()
            .with_sender(self.sender)
            .with_actor(self.actor)
            .with_nft_issuance(NftIssuanceParameters::<Test>::default())
            .call_and_assert(Ok(()));
        // Destroy nft
        DestroyNftFixture::default()
            .with_sender(self.sender)
            .with_actor(self.actor)
            .call_and_assert(Ok(()));
        // Issue nft during video update
        UpdateVideoFixture::default()
            .with_sender(self.sender)
            .with_actor(self.actor)
            .with_nft_issuance(NftIssuanceParameters::<Test>::default())
            .call_and_assert(Ok(()));
        // Start open auction
        StartOpenAuctionFixture::default()
            .with_sender(self.sender)
            .with_actor(self.actor)
            .call_and_assert(Ok(()));
        // Cancel open auction
        CancelAuctionFixture::default(AuctionType::Open)
            .with_sender(self.sender)
            .with_actor(self.actor)
            .call_and_assert(Ok(()));
        // Start english auction
        StartEnglishAuctionFixture::default()
            .with_sender(self.sender)
            .with_actor(self.actor)
            .call_and_assert(Ok(()));
        // Cancel english auction
        CancelAuctionFixture::default(AuctionType::English)
            .with_sender(self.sender)
            .with_actor(self.actor)
            .call_and_assert(Ok(()));
        // Offer nft
        OfferNftFixture::default()
            .with_sender(self.sender)
            .with_actor(self.actor)
            .call_and_assert(Ok(()));
        // Cancel nft offer
        CancelOfferFixture::default()
            .with_sender(self.sender)
            .with_actor(self.actor)
            .call_and_assert(Ok(()));
        // Sell nft
        SellNftFixture::default()
            .with_sender(self.sender)
            .with_actor(self.actor)
            .call_and_assert(Ok(()));
        // Update BuyNow price
        UpdateBuyNowPriceFixture::default()
            .with_sender(self.sender)
            .with_actor(self.actor)
            .call_and_assert(Ok(()));
        // Cancel BuyNow
        CancelBuyNowFixture::default()
            .with_sender(self.sender)
            .with_actor(self.actor)
            .call_and_assert(Ok(()));
        // NFT owner remark
        NftOwnerRemarkFixture::default()
            .with_sender(self.sender)
            .with_actor(self.actor)
            .call_and_assert(Ok(()));
        // Pick open auction winner
        increase_account_balance_helper(SECOND_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        StartOpenAuctionFixture::default()
            .with_sender(self.sender)
            .with_actor(self.actor)
            .call_and_assert(Ok(()));
        MakeOpenAuctionBidFixture::default().call_and_assert(Ok(()));
        PickOpenAuctionWinnerFixture::default()
            .with_sender(self.sender)
            .with_actor(self.actor)
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
        let mut updated_collaborators: BTreeMap<MemberId, ChannelAgentPermissions> =
            default_collaborators
                .into_inner()
                .iter()
                .map(|(k, v)| (*k, v.clone().into_inner()))
                .collect();

        // Add collaborator (as owner) will full permissions
        updated_collaborators.insert(
            SECOND_MEMBER_ID,
            BTreeSet::from_iter(ChannelActionPermission::iter()),
        );
        UpdateChannelFixture::default()
            .with_sender(self.owner_sender)
            .with_actor(self.owner_actor)
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
            .with_sender(self.agent_sender)
            .with_actor(self.agent_actor)
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
            .with_sender(self.agent_sender)
            .with_actor(self.agent_actor)
            .with_collaborators(updated_collaborators.clone())
            .call_and_assert(Ok(()));
        // Remove latest collaborator
        updated_collaborators.remove(&THIRD_MEMBER_ID);
        UpdateChannelFixture::default()
            .with_sender(self.agent_sender)
            .with_actor(self.agent_actor)
            .with_collaborators(updated_collaborators.clone())
            .call_and_assert(Ok(()));
    }
}

// helper functions
pub fn assert_group_has_permissions_for_actions(
    group: &CuratorGroup<Test>,
    privilege_level: <Test as Config>::ChannelPrivilegeLevel,
    allowed_actions: &Vec<ContentModerationAction>,
) {
    if !allowed_actions.is_empty() {
        assert_eq!(
            group.ensure_group_member_can_perform_moderation_actions::<Test>(
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
                                group.ensure_group_member_can_perform_moderation_actions::<Test>(
                                    &[ContentModerationAction::ChangeChannelFeatureStatus(feature)],
                                    privilege_level
                                ),
                                Err(Error::<Test>::CuratorModerationActionNotAllowed.into()),
                                "Expected curator group to NOT have {:?} action permissions for privilege_level {}",
                                action,
                                privilege_level
                            );
                    }
                }
            }
            _ => {
                if !allowed_actions.contains(&action) {
                    assert_eq!(
                            group.ensure_group_member_can_perform_moderation_actions::<Test>(
                                &[action.clone()],
                                privilege_level
                            ),
                            Err(Error::<Test>::CuratorModerationActionNotAllowed.into()),
                            "Expected curator group to NOT have {:?} action permissions for privilege_level {}",
                            action,
                            privilege_level
                        );
                }
            }
        }
    }
}

pub fn increase_account_balance_helper(account_id: U256, balance: u64) {
    let _ = Balances::<Test>::deposit_creating(&account_id, balance);
}

pub fn slash_account_balance_helper(account_id: U256) {
    let _ = Balances::<Test>::slash(&account_id, Balances::<Test>::total_balance(&account_id));
}

pub(crate) fn create_cid(i: u64) -> Vec<u8> {
    let bytes = i.to_be_bytes();
    let mut buffer: [u8; 46] = [0; 46];

    // Total CID = 46 bytes
    // 44 bytes
    for i in 0..46 {
        buffer[i] = bytes[i % 8]
    }

    buffer.to_vec()
}

pub fn create_data_object_candidates_helper(
    starting_ipfs_index: u8,
    number: u64,
) -> Vec<DataObjectCreationParameters> {
    let range = (starting_ipfs_index as u64)..((starting_ipfs_index as u64) + number);

    range
        .into_iter()
        .map(|idx| DataObjectCreationParameters {
            size: DEFAULT_OBJECT_SIZE,
            ipfs_content_id: create_cid(idx),
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

pub fn set_dynamic_bag_creation_policy_for_storage_numbers(storage_bucket_number: u32) {
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

pub fn set_data_object_state_bloat_bond(state_bloat_bond: u64) {
    assert_eq!(
        Storage::<Test>::update_data_object_state_bloat_bond(
            Origin::signed(STORAGE_WG_LEADER_ACCOUNT_ID),
            state_bloat_bond
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
    create_default_member_owned_channel_with_storage_buckets(
        true,
        Storage::<Test>::data_object_state_bloat_bond_value(),
        &[],
    )
}

pub fn create_default_member_owned_channel_with_collaborator_permissions(
    collaborator_permissions: &[ChannelActionPermission],
) {
    create_default_member_owned_channel_with_storage_buckets(
        true,
        Storage::<Test>::data_object_state_bloat_bond_value(),
        collaborator_permissions,
    )
}

pub fn create_default_member_owned_channel_with_storage_buckets(
    include_storage_buckets: bool,
    state_bloat_bond: u64,
    collaborator_permissions: &[ChannelActionPermission],
) {
    let mut channel_fixture = CreateChannelFixture::default()
        .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
        .with_channel_owner(ChannelOwner::Member(DEFAULT_MEMBER_ID))
        .with_data_object_state_bloat_bond(state_bloat_bond)
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
    data_object_state_bloat_bond: u64,
    curator_agent_permissions: &[ChannelActionPermission],
) {
    let curator_group_id =
        curators::add_curator_to_new_group(DEFAULT_CURATOR_ID, curator_agent_permissions);
    CreateChannelFixture::default()
        .with_default_storage_buckets()
        .with_sender(LEAD_ACCOUNT_ID)
        .with_channel_owner(ChannelOwner::CuratorGroup(curator_group_id))
        .with_data_object_state_bloat_bond(data_object_state_bloat_bond)
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
    state_bloat_bond: u64,
) {
    create_default_member_owned_channel_with_storage_buckets(
        include_storage_buckets,
        state_bloat_bond,
        &[],
    );

    set_default_nft_limits();

    CreateVideoFixture::default()
        .with_sender(DEFAULT_MEMBER_ACCOUNT_ID)
        .with_actor(ContentActor::Member(DEFAULT_MEMBER_ID))
        .with_data_object_state_bloat_bond(state_bloat_bond)
        .with_assets(StorageAssets::<Test> {
            expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
            object_creation_list: create_data_objects_helper(),
        })
        .with_channel_id(NextChannelId::<Test>::get() - 1)
        .call();
}

pub fn create_default_curator_owned_channel_with_video(
    state_bloat_bond: u64,
    permissions: &[ChannelActionPermission],
) {
    create_default_curator_owned_channel(state_bloat_bond, permissions);
    CreateVideoFixture::default()
        .with_sender(LEAD_ACCOUNT_ID)
        .with_actor(ContentActor::Lead)
        .with_assets(StorageAssets::<Test> {
            expected_data_size_fee: Storage::<Test>::data_object_per_mega_byte_fee(),
            object_creation_list: create_data_objects_helper(),
        })
        .with_channel_id(NextChannelId::<Test>::get() - 1)
        .call();
}

pub fn pause_channel_feature(channel_id: ChannelId, feature: PausableChannelFeature) {
    SetChannelPausedFeaturesAsModeratorFixture::default()
        .with_channel_id(channel_id)
        .with_new_paused_features(BTreeSet::from_iter(vec![feature]))
        .call_and_assert(Ok(()));
}

// generate some payments claims
pub fn create_some_pull_payments_helper_with_rewards(
    cumulative_reward_earned: u64,
) -> Vec<PullPayment<Test>> {
    let mut payments = Vec::new();
    for i in 0..PAYMENTS_NUMBER {
        payments.push(PullPayment::<Test> {
            channel_id: (i % 2),
            cumulative_reward_earned,
            reason: Hashing::hash_of(&b"reason".to_vec()),
        });
    }
    payments
}

pub fn create_some_pull_payments_helper() -> Vec<PullPayment<Test>> {
    create_some_pull_payments_helper_with_rewards(DEFAULT_PAYOUT_EARNED)
}

pub fn update_commit_value_with_payments_helper(payments: &[PullPayment<Test>]) {
    let commit = generate_merkle_root_helper::<Test, _>(payments)
        .pop()
        .unwrap();
    UpdateChannelPayoutsFixture::default()
        .with_commitment(Some(commit))
        .call_and_assert(Ok(()));
}

pub fn channel_reward_account_balance(channel_id: ChannelId) -> u64 {
    let reward_account = ContentTreasury::<Test>::account_for_channel(channel_id);
    Balances::<Test>::usable_balance(&reward_account)
}

pub fn default_curator_actor() -> ContentActor<CuratorGroupId, CuratorId, MemberId> {
    ContentActor::Curator(CuratorGroupId::one(), DEFAULT_CURATOR_ID)
}

pub fn ed() -> BalanceOf<Test> {
    <Test as balances::Config>::ExistentialDeposit::get().into()
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
            collaborators: Some(collaborators.iter().cloned().collect()),
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
            ContentActor::Lead => create_default_curator_owned_channel(
                DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND,
                &agent_permissions,
            ),
            ContentActor::Member(..) => {
                create_default_member_owned_channel_with_collaborator_permissions(
                    &agent_permissions,
                )
            }
            _ => panic!(),
        }

        // Setup claimable reward (optionally)
        if self.claimable_reward {
            let payments = create_some_pull_payments_helper();
            update_commit_value_with_payments_helper(&payments);
            <Test as Config>::CouncilBudgetManager::set_budget(DEFAULT_PAYOUT_CLAIMED);
        }

        // Set channel collaborators (optionally)
        if let Some(collaborators) = self.collaborators.as_ref() {
            UpdateChannelFixture::default()
                .with_sender(self.channel_owner_sender)
                .with_actor(self.channel_owner_actor)
                .with_collaborators(collaborators.clone())
                .call_and_assert(Ok(()));
        }

        // Create video (optionally)
        if self.create_video {
            CreateVideoFixture::default()
                .with_sender(self.channel_owner_sender)
                .with_actor(self.channel_owner_actor)
                .with_opt_assets(self.video_assets.clone())
                .call_and_assert(Ok(()));
        }

        // Create video nft (optinally)
        if self.create_video_nft {
            IssueNftFixture::default()
                .with_sender(self.channel_owner_sender)
                .with_actor(self.channel_owner_actor)
                .call_and_assert(Ok(()));
        }

        // Set nft status (optionally)
        match self.nft_status {
            NftTransactionalStatusType::Auction(auction_type) => match auction_type {
                AuctionType::Open => {
                    StartOpenAuctionFixture::default()
                        .with_sender(self.channel_owner_sender)
                        .with_actor(self.channel_owner_actor)
                        .call_and_assert(Ok(()));
                }
                AuctionType::English => {
                    StartEnglishAuctionFixture::default()
                        .with_sender(self.channel_owner_sender)
                        .with_actor(self.channel_owner_actor)
                        .call_and_assert(Ok(()));
                }
            },
            NftTransactionalStatusType::BuyNow => {
                SellNftFixture::default()
                    .with_sender(self.channel_owner_sender)
                    .with_actor(self.channel_owner_actor)
                    .call_and_assert(Ok(()));
            }
            NftTransactionalStatusType::Offer => {
                OfferNftFixture::default()
                    .with_sender(self.channel_owner_sender)
                    .with_actor(self.channel_owner_actor)
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

pub fn get_default_member_channel_invalid_contexts() -> Vec<ActorContextResult> {
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

pub fn get_default_curator_channel_invalid_contexts() -> Vec<ActorContextResult> {
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

pub fn run_all_fixtures_with_contexts(contexts: Vec<ActorContextResult>) {
    for (sender, actor, error) in contexts {
        let expected_err = Err(error.into());
        UpdateChannelFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        CreateVideoFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        UpdateVideoFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        DeleteChannelFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        DeleteVideoFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        IssueNftFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        StartOpenAuctionFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        StartEnglishAuctionFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        CancelAuctionFixture::default(AuctionType::Open)
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        CancelAuctionFixture::default(AuctionType::English)
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        OfferNftFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        CancelOfferFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        SellNftFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        CancelBuyNowFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        UpdateBuyNowPriceFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        PickOpenAuctionWinnerFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        NftOwnerRemarkFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        DestroyNftFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        ChannelAgentRemarkFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        InitializeChannelTransferFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        CancelChannelTransferFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);

        ClaimChannelRewardFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        WithdrawFromChannelBalanceFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        ClaimAndWithdrawChannelRewardFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        IssueCreatorTokenFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        InitCreatorTokenSaleFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        UpdateUpcomingCreatorTokenSaleFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        FinalizeCreatorTokenSaleFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        CreatorTokenIssuerTransferFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        MakeCreatorTokenPermissionlessFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        ReduceCreatorTokenPatronageRateFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        ClaimCreatorTokenPatronageCreditFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        IssueRevenueSplitFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        FinalizeRevenueSplitFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
        DeissueCreatorTokenFixture::default()
            .with_sender(sender)
            .with_actor(actor)
            .call_and_assert(expected_err);
    }
}

#[derive(Fixture, new)]
pub struct UpdateGlobalNftLimitFixture {
    #[new(value = "RawOrigin::Signed(LEAD_ACCOUNT_ID)")]
    origin: RawOrigin<U256>,

    #[new(default)]
    period: NftLimitPeriod,

    #[new(default)]
    limit: u64,
}

impl UpdateGlobalNftLimitFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let nft_limit_id = match self.period {
            NftLimitPeriod::Daily => NftLimitId::GlobalDaily,
            NftLimitPeriod::Weekly => NftLimitId::GlobalWeekly,
        };

        let old_limit = nft_limit_by_id(nft_limit_id);

        let actual_result =
            Content::update_global_nft_limit(self.origin.clone().into(), self.period, self.limit);

        assert_eq!(actual_result, expected_result);

        let new_limit = nft_limit_by_id(nft_limit_id);

        if actual_result.is_ok() {
            assert_eq!(
                LimitPerPeriod {
                    limit: self.limit,
                    ..old_limit
                },
                new_limit
            );

            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::Content(RawEvent::GlobalNftLimitUpdated(self.period, self.limit))
            );
        } else {
            assert_eq!(old_limit, new_limit);
        }
    }
}

#[derive(Fixture, new)]
pub struct UpdateChannelNftLimitFixture {
    #[new(value = "RawOrigin::Signed(DEFAULT_CURATOR_ACCOUNT_ID)")]
    origin: RawOrigin<U256>,

    #[new(value = "default_curator_actor()")]
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,

    #[new(default)]
    period: NftLimitPeriod,

    #[new(value = "ChannelId::one()")]
    channel_id: ChannelId,

    #[new(default)]
    limit: u64,
}

impl UpdateChannelNftLimitFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let nft_limit_id = match self.period {
            NftLimitPeriod::Daily => NftLimitId::ChannelDaily(self.channel_id),
            NftLimitPeriod::Weekly => NftLimitId::ChannelWeekly(self.channel_id),
        };

        let old_limit = nft_limit_by_id(nft_limit_id);

        let actual_result = Content::update_channel_nft_limit(
            self.origin.clone().into(),
            self.actor,
            self.period,
            self.channel_id,
            self.limit,
        );

        assert_eq!(actual_result, expected_result);

        let new_limit = nft_limit_by_id(nft_limit_id);

        if actual_result.is_ok() {
            assert_eq!(
                LimitPerPeriod {
                    limit: self.limit,
                    ..old_limit
                },
                new_limit
            );

            assert_eq!(
                System::events().last().unwrap().event,
                MetaEvent::Content(RawEvent::ChannelNftLimitUpdated(
                    self.actor,
                    self.period,
                    self.channel_id,
                    self.limit
                ))
            );
        } else {
            assert_eq!(old_limit, new_limit);
        }
    }
}

pub fn set_fees(
    data_size_fee: BalanceOf<Test>,
    data_obj_bloat_bond: BalanceOf<Test>,
    channel_state_bloat_bond: BalanceOf<Test>,
    video_state_bloat_bond: BalanceOf<Test>,
) {
    storage::DataObjectPerMegabyteFee::<Test>::set(data_size_fee);
    storage::DataObjectStateBloatBondValue::<Test>::set(data_obj_bloat_bond);
    ChannelStateBloatBondValue::<Test>::set(channel_state_bloat_bond);
    VideoStateBloatBondValue::<Test>::set(video_state_bloat_bond);
}

pub fn set_invitation_lock(
    who: &<Test as frame_system::Config>::AccountId,
    amount: BalanceOf<Test>,
) {
    <Test as membership::Config>::InvitedMemberStakingHandler::lock_with_reasons(
        &who,
        amount,
        WithdrawReasons::except(WithdrawReasons::TRANSACTION_PAYMENT),
    );
}

pub fn set_staking_candidate_lock(
    who: &<Test as frame_system::Config>::AccountId,
    amount: BalanceOf<Test>,
) {
    <Test as membership::Config>::StakingCandidateStakingHandler::lock(&who, amount);
}
