use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Member<MemberId, AccountId, Moment> {
    pub member_id: MemberId,
    pub root_account: AccountId,
    pub controller_account: AccountId,
    pub handle: String,
    pub avatar_uri: String,
    pub about: String,
    pub registered_at_time: Moment,
}
