#![warn(missing_docs)]

use crate::{BalanceOf, Config};
use codec::{Decode, Encode, MaxEncodedLen};
use common::{bloat_bond::RepayableBloatBond, MembershipTypes};
use frame_support::storage::bounded_btree_set::BoundedBTreeSet;
use scale_info::TypeInfo;
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

/// Represents a discussion thread
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, TypeInfo, MaxEncodedLen)]
pub struct DiscussionThread<MemberId, BlockNumber, ThreadWhitelist> {
    /// When thread was established.
    pub activated_at: BlockNumber,

    /// Author of the thread.
    pub author_id: MemberId,

    /// Thread permission mode.
    pub mode: ThreadMode<ThreadWhitelist>,
}

/// Post for the discussion thread
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, TypeInfo, MaxEncodedLen)]
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
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo, MaxEncodedLen)]
pub enum ThreadMode<ThreadWhitelist> {
    /// Every member can post on the thread.
    Open,

    /// Only author, councilor or whitelisted member could post on the thread.
    Closed(ThreadWhitelist),
}

impl<MemberId> Default for ThreadMode<MemberId> {
    fn default() -> Self {
        Self::Open
    }
}

// Aliases

/// Alias for DiscussionThread
pub type DiscussionThreadOf<T> = DiscussionThread<
    <T as MembershipTypes>::MemberId,
    <T as frame_system::Config>::BlockNumber,
    ThreadWhitelistOf<T>,
>;

/// Alias for DiscussionPost
pub type DiscussionPostOf<T> = DiscussionPost<
    <T as MembershipTypes>::MemberId,
    <T as frame_system::Config>::BlockNumber,
    RepayableBloatBond<<T as frame_system::Config>::AccountId, BalanceOf<T>>,
>;

/// Alias for BoundedBTreeSet<MemberId, MaxWhiteListSize>
pub type ThreadWhitelistOf<T> =
    BoundedBTreeSet<<T as MembershipTypes>::MemberId, <T as Config>::MaxWhiteListSize>;
