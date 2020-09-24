#![warn(missing_docs)]

use codec::{Decode, Encode};

use common::currency::GovernanceCurrency;
use frame_support::traits::Currency;

use frame_support::dispatch::DispatchResult;
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

/// Team job application type alias.
pub type JobApplication<T> = Application<<T as system::Trait>::AccountId, MemberId<T>>;

/// Member identifier in membership::member module.
pub type MemberId<T> = <T as membership::Trait>::MemberId;

/// Type identifier for a worker role, which must be same as membership actor identifier.
pub type TeamWorkerId<T> = <T as membership::Trait>::ActorId;

// ApplicationId - JobApplication - helper struct.
pub(crate) struct ApplicationInfo<T: crate::Trait<I>, I: crate::Instance> {
    pub application_id: T::ApplicationId,
    pub application: JobApplication<T>,
}

/// Team worker type alias.
pub type TeamWorker<T> = Worker<<T as system::Trait>::AccountId, MemberId<T>>;

/// Balance alias for GovernanceCurrency from `common` module. TODO: replace with BalanceOf
pub type BalanceOfCurrency<T> =
    <<T as common::currency::GovernanceCurrency>::Currency as Currency<
        <T as system::Trait>::AccountId,
    >>::Balance;

/// Job opening for the normal or leader position.
/// An opening represents the process of hiring one or more new actors into some available role.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Default, Clone, PartialEq, Eq)]
pub struct JobOpening<BlockNumber: Ord, Balance> {
    /// Defines opening type: Leader or worker.
    pub opening_type: JobOpeningType,

    /// Block at which opening was added.
    pub created: BlockNumber,

    /// Hash of the opening description.
    pub description_hash: Vec<u8>,

    /// Stake policy for the job opening.
    pub stake_policy: Option<StakePolicy<BlockNumber, Balance>>,
}

/// Defines type of the opening: regular working group fellow or group leader.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Clone, PartialEq, Eq, Copy)]
pub enum JobOpeningType {
    /// Group leader.
    Leader,

    /// Regular worker.
    Regular,
}

/// Must be default constructible because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl Default for JobOpeningType {
    fn default() -> Self {
        Self::Regular
    }
}

/// An application for the regular worker/lead role opening.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct Application<AccountId, MemberId> {
    /// Account used to authenticate in this role.
    pub role_account_id: AccountId,

    /// Account used to stake in this role.
    pub staking_account_id: AccountId,

    /// Member applying.
    pub member_id: MemberId,

    /// Hash of the application description.
    pub description_hash: Vec<u8>,
}

impl<AccountId: Clone, MemberId: Clone> Application<AccountId, MemberId> {
    /// Creates a new job application using parameters.
    pub fn new(
        role_account_id: &AccountId,
        staking_account_id: &AccountId,
        member_id: &MemberId,
        description_hash: Vec<u8>,
    ) -> Self {
        Application {
            role_account_id: role_account_id.clone(),
            staking_account_id: staking_account_id.clone(),
            member_id: member_id.clone(),
            description_hash,
        }
    }
}

/// Working team participant: regular worker or lead.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct Worker<AccountId, MemberId> {
    /// Member id related to the worker/lead.
    pub member_id: MemberId,

    /// Account used to authenticate in this role.
    pub role_account_id: AccountId,

    /// Account used to stake in this role.
    pub staking_account_id: AccountId,
}

impl<AccountId: Clone, MemberId: Clone> Worker<AccountId, MemberId> {
    /// Creates a new _TeamWorker_ using parameters.
    pub fn new(
        member_id: &MemberId,
        role_account_id: &AccountId,
        staking_account_id: &AccountId,
    ) -> Self {
        Worker {
            member_id: member_id.clone(),
            role_account_id: role_account_id.clone(),
            staking_account_id: staking_account_id.clone(),
        }
    }
}

/// Stake policy for the job opening.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Clone, Default, PartialEq, Eq)]
pub struct StakePolicy<BlockNumber, Balance> {
    /// Stake amount for applicants..
    pub stake_amount: Balance,

    /// Unstaking period for the stake. Zero means no unstaking period.
    pub unstaking_period: BlockNumber,
}

/// Defines abstract staking handler to manage user stakes for different activities
/// like adding a proposal. Implementation should use built-in LockableCurrency
/// and LockIdentifier to lock balance consistently with pallet_staking.
pub trait StakingHandler<T: system::Trait + membership::Trait + GovernanceCurrency> {
    /// Locks the specified balance on the account using specific lock identifier.
    fn lock(account_id: &T::AccountId, amount: BalanceOfCurrency<T>);

    /// Removes the specified lock on the account.
    fn unlock(account_id: &T::AccountId);

    /// Slash the specified balance on the account using specific lock identifier.
    /// No limits, no actions on zero stake.
    /// If slashing balance greater than the existing stake - stake is slashed to zero.
    /// Returns actually slashed balance.
    fn slash(
        account_id: &T::AccountId,
        amount: Option<BalanceOfCurrency<T>>,
    ) -> BalanceOfCurrency<T>;

    /// Decreases the stake for to a given amount.
    fn decrease_stake(account_id: &T::AccountId, new_stake: BalanceOfCurrency<T>);

    /// Increases the stake for to a given amount.
    fn increase_stake(account_id: &T::AccountId, new_stake: BalanceOfCurrency<T>)
        -> DispatchResult;

    /// Verifies that staking account bound to the member.
    fn is_member_staking_account(member_id: &MemberId<T>, account_id: &T::AccountId) -> bool;

    /// Verifies that there no conflicting stakes on the staking account.
    fn is_account_free_of_conflicting_stakes(account_id: &T::AccountId) -> bool;

    /// Verifies that staking account balance is sufficient for staking.
    /// During the balance check we should consider already locked stake. Effective balance to check
    /// is 'already locked funds' + 'usable funds'.
    fn is_enough_balance_for_stake(account_id: &T::AccountId, amount: BalanceOfCurrency<T>)
        -> bool;
}
