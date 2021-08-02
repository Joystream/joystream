use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_runtime::DispatchResult;
#[cfg(feature = "std")]
use strum_macros::EnumIter;

/// Defines well-known working groups.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, EnumIter))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Copy, Debug)]
pub enum WorkingGroup {
    /// Forum working group: working_group::Instance1.
    Forum,
    /// Storage working group: working_group::Instance2.
    Storage,
    /// Content directory working group: working_group::Instance3.
    Content,
    /// Membership working group: working_group::Instance4.
    Membership,
}

/// Working group interface to work with its members - workers and leaders.
pub trait WorkingGroupAuthenticator<T: crate::membership::Config> {
    /// Validate origin for the worker.
    fn ensure_worker_origin(origin: T::Origin, worker_id: &T::ActorId) -> DispatchResult;

    /// Validate origin for the active leader.
    fn ensure_leader_origin(origin: T::Origin) -> DispatchResult;

    /// Get member ID of the current leader.
    fn get_leader_member_id() -> Option<T::MemberId>;

    /// Verifies that given account ID belongs to the leader.
    fn is_leader_account_id(account_id: &T::AccountId) -> bool;

    /// Verifies that given account ID and worker ID belong to the working group member.
    fn is_worker_account_id(account_id: &T::AccountId, worker_id: &T::ActorId) -> bool;
}

/// Working group interface to work with the its budget.
pub trait WorkingGroupBudgetHandler<T: balances::Config> {
    /// Returns current working group balance.
    fn get_budget() -> T::Balance;

    /// Sets new working broup balance
    fn set_budget(new_value: T::Balance);
}
