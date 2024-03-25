use sp_runtime::DispatchResult;

// Proc macro (EnumIter) clippy::integer_arithmetic disable hack
#[allow(clippy::integer_arithmetic)]
pub mod iterable_enums {
    use codec::{Decode, Encode, MaxEncodedLen};
    use scale_info::TypeInfo;
    #[cfg(feature = "std")]
    use serde::{Deserialize, Serialize};
    #[cfg(feature = "std")]
    use strum_macros::EnumIter;

    /// Defines well-known working groups.
    #[cfg_attr(feature = "std", derive(Serialize, Deserialize, EnumIter))]
    #[derive(
        Encode, Decode, Clone, PartialEq, Eq, Copy, Debug, PartialOrd, Ord, TypeInfo, MaxEncodedLen,
    )]
    pub enum WorkingGroup {
        /// Forum working group: working_group::Instance1.
        Forum,

        /// Storage working group: working_group::Instance2.
        Storage,

        /// Storage working group: working_group::Instance3.
        Content,

        /// Operations working group: working_group::Instance4.
        OperationsAlpha,

        /// App working group: working_group::Instance5.
        App,

        /// Distribution working group: working_group::Instance9.
        Distribution,

        /// Operations working group: working_group::Instance7.
        OperationsBeta,

        /// Operations working group: working_group::Instance8.
        OperationsGamma,

        /// Membership Working Group: working_group::Instanc6.
        Membership,
    }
}

pub use iterable_enums::WorkingGroup;

/// Working group interface to work with its members - workers and leaders.
pub trait WorkingGroupAuthenticator<T: crate::MembershipTypes> {
    /// Validate origin for the worker.
    fn ensure_worker_origin(origin: T::RuntimeOrigin, worker_id: &T::ActorId) -> DispatchResult;

    /// Validate origin for the active leader.
    fn ensure_leader_origin(origin: T::RuntimeOrigin) -> DispatchResult;

    /// Get member ID of the current leader.
    fn get_leader_member_id() -> Option<T::MemberId>;

    /// Get member ID of the specified worker.
    fn get_worker_member_id(worker_id: &T::ActorId) -> Option<T::MemberId>;

    /// Verifies that given account ID belongs to the leader.
    fn is_leader_account_id(account_id: &T::AccountId) -> bool;

    /// Verifies that given account ID and worker ID belong to the working group member.
    fn is_worker_account_id(account_id: &T::AccountId, worker_id: &T::ActorId) -> bool;

    /// Verifies that a worker belongs to the working group.
    fn worker_exists(worker_id: &T::ActorId) -> bool;

    fn ensure_worker_exists(worker_id: &T::ActorId) -> DispatchResult;
}

/// Provides an interface for the working group budget.
pub use crate::BudgetManager as WorkingGroupBudgetHandler;
