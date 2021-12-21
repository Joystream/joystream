use super::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

pub struct CreateChannelFixture {
    origin: Origin,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    params: ChannelCreationParameters<Test>,
}

impl CreateChannelFixture {
    pub fn default() -> Self {
        Self {
            origin: Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            actor: ContentActor::Member(DEFAULT_MEMBER_ACCOUNT_ID),
            params: ChannelCreationParameters::<Test> {
                assets: None,
                meta: None,
                reward_account: None,
                collaborators: BTreeSet::new(),
            },
        }
    }

    pub fn with_origin(self, origin: Origin) -> Self {
        Self { origin, ..self }
    }

    pub fn with_actor(self, actor: ContentActor<CuratorGroupId, CuratorId, MemberId>) -> Self {
        Self { actor, ..self }
    }

    pub fn with_params(self, params: ChannelCreationParameters<Test>) -> Self {
        Self { params, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let channel_id = Content::next_channel_id();
        if expected_result.is_ok() {
            // ensure channel is on chain
            assert_ok!(Content::ensure_channel_exists(&channel_id));

            // channel counter increased
            assert_eq!(
                Content::next_channel_id(),
                channel_id.saturating_add(One::one())
            );

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

            // TODO: parameters upload refine test
        }
    }
}
