use super::mock::*;
use crate::*;
use frame_support::traits::Currency;
use frame_support::{assert_err, assert_ok};

// type aliases
type AccountId = <Test as frame_system::Trait>::AccountId;

// helper functions
pub fn increase_account_balance_helper(account_id: &u64, balance: u64) {
    let _ = Balances::deposit_creating(&account_id, balance);
}

// fixture
pub struct CreateChannelFixture {
    sender: AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    params: ChannelCreationParameters<Test>,
}

impl CreateChannelFixture {
    pub fn default() -> Self {
        Self {
            sender: DEFAULT_MEMBER_ACCOUNT_ID,
            actor: ContentActor::Member(DEFAULT_MEMBER_ACCOUNT_ID),
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

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let origin = Origin::signed(self.sender.clone());
        let actual_result =
            Content::create_channel(origin, self.actor.clone(), self.params.clone());

        assert_eq!(actual_result, expected_result);

        let balance_pre = Balances::usable_balance(self.sender);

        if expected_result.is_ok() {
            let channel_id = Content::next_channel_id();

            // ensure channel is on chain
            assert_ok!(Content::ensure_channel_exists(&channel_id));

            // channel counter increased
            assert_eq!(
                Content::next_channel_id(),
                channel_id.saturating_add(One::one())
            );

            // dynamic bag for channel is created
            let channel_bag_id = Content::bag_id_for_channel(&channel_id);
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
                let balance_post = Balances::usable_balance(self.sender);
                let bag_deletion_prize = BalanceOf::<Test>::one();
                let objects_deletion_prize = assets.object_creation_list.iter().fold(
                    BalanceOf::<Test>::zero(),
                    |acc, obj| {
                        acc.saturating_add(<Test as storage::Trait>::DataObjectDeletionPrize::get())
                    },
                );

                assert_eq!(
                    balance_pre.saturating_sub(balance_post),
                    bag_deletion_prize.saturating_add(objects_deletion_prize),
                );

                // objects uploaded: check for the number of objects uploaded
                assert_eq!(
                    storage::DataObjectsById::<Test>::iter_prefix(channel_bag_id).count(),
                    assets.object_creation_list.len(),
                );
            }
        }
    }
}
