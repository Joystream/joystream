use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

/// Working group lead: curator lead
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct Lead<MemberId, AccountId> {
    /// Member id of the leader
    pub member_id: MemberId,

    /// Account used to authenticate in this role,
    pub role_account_id: AccountId,
}
