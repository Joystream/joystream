#![warn(missing_docs)]

use crate::BalanceOf;
use codec::{Decode, Encode};
use common::{bloat_bond::RepayableBloatBond, MembershipTypes};
use scale_info::TypeInfo;
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_std::vec::Vec;

/// Represents a discussion thread
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, TypeInfo)]
pub struct DiscussionThread<MemberId, BlockNumber> {
    /// When thread was established.
    pub activated_at: BlockNumber,

    /// Author of the thread.
    pub author_id: MemberId,

    /// Thread permission mode.
    pub mode: ThreadMode<MemberId>,
}

/// Post for the discussion thread
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, TypeInfo)]
pub struct DiscussionPost<MemberId, BlockNumber, RepayableBloatBond> {
    /// Author of the post.
    pub author_id: MemberId,

    /// Cleanup pay off
    pub cleanup_pay_off: RepayableBloatBond,

    /// Last time post was created/edited
    pub last_edited: BlockNumber,
}

/// Discussion thread permission modes.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo)]
pub enum ThreadMode<MemberId> {
    /// Every member can post on the thread.
    Open,

    /// Only author, councilor or white member list could post on the thread.
    Closed(Vec<MemberId>),
}

impl<MemberId> Default for ThreadMode<MemberId> {
    fn default() -> Self {
        Self::Open
    }
}

// Aliases
pub type DiscussionThreadOf<T> =
    DiscussionThread<<T as MembershipTypes>::MemberId, <T as frame_system::Config>::BlockNumber>;

pub type DiscussionPostOf<T> = DiscussionPost<
    <T as MembershipTypes>::MemberId,
    <T as frame_system::Config>::BlockNumber,
    RepayableBloatBond<<T as frame_system::Config>::AccountId, BalanceOf<T>>,
>;
