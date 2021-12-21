use super::mock::*;
use crate::*;

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
}
