//! # Working group pallet
//! Working group pallet for the Joystream platform.
//! Contains abstract working group workflow.
//!
//! Exact working group (eg.: forum working group) should create an instance of the Working group module.
//!
//! ## Supported extrinsics
//!
//! - [add_opening](./struct.Module.html#method.add_opening) - Add an opening for a regular worker/lead role.
//! - [apply_on_opening](./struct.Module.html#method.apply_on_opening) - Apply on a regular worker/lead opening.
//! - [fill_opening](./struct.Module.html#method.fill_opening) - Fill opening for regular worker/lead role.
//! - [update_role_account](./struct.Module.html#method.update_role_account) -  Update the role account of the regular worker/lead.
//! - [leave_role](./struct.Module.html#method.leave_role) - Leave the role by the active regular worker/lead.
//! - [terminate_role](./struct.Module.html#method.terminate_role) - Terminate the regular worker/lead role.
//! - [slash_stake](./struct.Module.html#method.slash_stake) - Slashes the regular worker/lead stake.
//! - [decrease_stake](./struct.Module.html#method.decrease_stake) - Decreases the regular worker/lead stake and returns the remainder to the worker _role_account_.
//! - [increase_stake](./struct.Module.html#method.increase_stake) - Increases the regular worker/lead stake.
//! - [cancel_opening](./struct.Module.html#method.cancel_opening) - Cancel opening for a regular worker/lead.
//! - [withdraw_application](./struct.Module.html#method.withdraw_application) - Withdraw the regular worker/lead application.
//! - [set_budget](./struct.Module.html#method.set_budget) - Sets the working group budget.
//! - [update_reward_account](./struct.Module.html#method.update_reward_account) -  Update the reward account of the regular worker/lead.
//! - [update_reward_amount](./struct.Module.html#method.update_reward_amount) -  Update the reward amount of the regular worker/lead.
//! - [set_status_text](./struct.Module.html#method.set_status_text) - Sets the working group status.
//! - [spend_from_budget](./struct.Module.html#method.spend_from_budget) - Spend tokens from the group budget.

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

// Do not delete! Cannot be uncommented by default, because of Parity decl_module! issue.
//#![warn(missing_docs)]

// TODO after Olympia-master (Sumer) merge:
// - change module comment
// - benchmark new extrinsics
// - fix `ensure_worker_role_storage_text_is_valid` incorrect cast

pub mod benchmarking;

mod checks;
mod errors;
#[cfg(test)]
mod tests;
mod types;

use frame_support::traits::{Currency, Get, LockIdentifier};
use frame_support::weights::Weight;
use frame_support::IterableStorageMap;
use frame_support::{decl_event, decl_module, decl_storage, ensure, StorageValue};
use frame_system::{ensure_root, ensure_signed};
use sp_arithmetic::traits::{One, Zero};
use sp_runtime::traits::{Hash, SaturatedConversion, Saturating};
use sp_std::collections::{btree_map::BTreeMap, btree_set::BTreeSet};
use sp_std::vec::Vec;

pub use errors::Error;
pub use types::{
    Application, ApplicationId, ApplyOnOpeningParameters, BalanceOf, Opening, OpeningId,
    OpeningType, RewardPaymentType, StakeParameters, StakePolicy, Worker, WorkerId,
};
use types::{ApplicationInfo, WorkerInfo};

use common::membership::MemberOriginValidator;
use common::{MemberId, StakingAccountValidator};
use frame_support::dispatch::DispatchResult;
use staking_handler::StakingHandler;

type WeightInfoWorkingGroup<T, I> = <T as Trait<I>>::WeightInfo;
type Balances<T> = balances::Module<T>;

/// Working group WeightInfo
/// Note: This was auto generated through the benchmark CLI using the `--weight-trait` flag
pub trait WeightInfo {
    fn on_initialize_leaving(i: u32) -> Weight;
    fn on_initialize_rewarding_with_missing_reward(i: u32) -> Weight;
    fn on_initialize_rewarding_with_missing_reward_cant_pay(i: u32) -> Weight;
    fn on_initialize_rewarding_without_missing_reward(i: u32) -> Weight;
    fn apply_on_opening(i: u32) -> Weight;
    fn fill_opening_lead() -> Weight;
    fn fill_opening_worker(i: u32) -> Weight;
    fn update_role_account() -> Weight;
    fn cancel_opening() -> Weight;
    fn withdraw_application() -> Weight;
    fn slash_stake(i: u32) -> Weight;
    fn terminate_role_worker(i: u32) -> Weight;
    fn terminate_role_lead(i: u32) -> Weight;
    fn increase_stake() -> Weight;
    fn decrease_stake() -> Weight;
    fn spend_from_budget() -> Weight;
    fn update_reward_amount() -> Weight;
    fn set_status_text(i: u32) -> Weight;
    fn update_reward_account() -> Weight;
    fn set_budget() -> Weight;
    fn add_opening(i: u32) -> Weight;
    fn leave_role(i: u32) -> Weight;
    fn lead_remark() -> Weight;
    fn worker_remark() -> Weight;
}

/// The _Group_ main _Trait_
pub trait Trait<I: Instance = DefaultInstance>:
    frame_system::Trait + balances::Trait + common::membership::MembershipTypes
{
    /// _Administration_ event type.
    type Event: From<Event<Self, I>> + Into<<Self as frame_system::Trait>::Event>;

    /// Defines max workers number in the group.
    type MaxWorkerNumberLimit: Get<u32>;

    /// Stakes and balance locks handler.
    type StakingHandler: StakingHandler<
        Self::AccountId,
        BalanceOf<Self>,
        MemberId<Self>,
        LockIdentifier,
    >;

    /// Validates staking account ownership for a member.
    type StakingAccountValidator: common::StakingAccountValidator<Self>;

    /// Validates member id and origin combination.
    type MemberOriginValidator: MemberOriginValidator<Self::Origin, MemberId<Self>, Self::AccountId>;

    /// Defines min unstaking period in the group.
    type MinUnstakingPeriodLimit: Get<Self::BlockNumber>;

    /// Defines the period every worker gets paid in blocks.
    type RewardPeriod: Get<u32>;

    /// Weight information for extrinsics in this pallet.
    type WeightInfo: WeightInfo;

    /// Minimum stake required for applying into an opening.
    type MinimumApplicationStake: Get<Self::Balance>;

    /// Stake needed to create an opening
    type LeaderOpeningStake: Get<Self::Balance>;
}

decl_event!(
    /// _Group_ events
    pub enum Event<T, I = DefaultInstance>
    where
       OpeningId = OpeningId,
       ApplicationId = ApplicationId,
       ApplicationIdToWorkerIdMap = BTreeMap<ApplicationId, WorkerId<T>>,
       WorkerId = WorkerId<T>,
       <T as frame_system::Trait>::AccountId,
       Balance = BalanceOf<T>,
       OpeningType = OpeningType,
       StakePolicy = StakePolicy<<T as frame_system::Trait>::BlockNumber, BalanceOf<T>>,
       ApplyOnOpeningParameters = ApplyOnOpeningParameters<T>,
    {
        /// Emits on adding new job opening.
        /// Params:
        /// - Opening id
        /// - Description
        /// - Opening Type(Lead or Worker)
        /// - Stake Policy for the opening
        /// - Reward per block
        OpeningAdded(OpeningId, Vec<u8>, OpeningType, StakePolicy, Option<Balance>),

        /// Emits on adding the application for the worker opening.
        /// Params:
        /// - Opening parameteres
        /// - Application id
        AppliedOnOpening(ApplyOnOpeningParameters, ApplicationId),

        /// Emits on filling the job opening.
        /// Params:
        /// - Worker opening id
        /// - Worker application id to the worker id dictionary
        /// - Applicationd ids used to fill the opening
        OpeningFilled(OpeningId, ApplicationIdToWorkerIdMap, BTreeSet<ApplicationId>),

        /// Emits on setting the group leader.
        /// Params:
        /// - Group worker id.
        LeaderSet(WorkerId),

        /// Emits on updating the role account of the worker.
        /// Params:
        /// - Id of the worker.
        /// - Role account id of the worker.
        WorkerRoleAccountUpdated(WorkerId, AccountId),

        /// Emits on un-setting the leader.
        LeaderUnset(),

        /// Emits on exiting the worker.
        /// Params:
        /// - worker id.
        /// - Rationale.
        WorkerExited(WorkerId),

        /// Emits when worker started leaving their role.
        /// Params:
        /// - Worker id.
        /// - Rationale.
        WorkerStartedLeaving(WorkerId, Option<Vec<u8>>),

        /// Emits on terminating the worker.
        /// Params:
        /// - worker id.
        /// - Penalty.
        /// - Rationale.
        TerminatedWorker(WorkerId, Option<Balance>, Option<Vec<u8>>),

        /// Emits on terminating the leader.
        /// Params:
        /// - leader worker id.
        /// - Penalty.
        /// - Rationale.
        TerminatedLeader(WorkerId, Option<Balance>, Option<Vec<u8>>),

        /// Emits on slashing the regular worker/lead stake.
        /// Params:
        /// - regular worker/lead id.
        /// - actual slashed balance.
        /// - Requested slashed balance.
        /// - Rationale.
        StakeSlashed(WorkerId, Balance, Balance, Option<Vec<u8>>),

        /// Emits on decreasing the regular worker/lead stake.
        /// Params:
        /// - regular worker/lead id.
        /// - stake delta amount
        StakeDecreased(WorkerId, Balance),

        /// Emits on increasing the regular worker/lead stake.
        /// Params:
        /// - regular worker/lead id.
        /// - stake delta amount
        StakeIncreased(WorkerId, Balance),

        /// Emits on withdrawing the application for the regular worker/lead opening.
        /// Params:
        /// - Job application id
        ApplicationWithdrawn(ApplicationId),

        /// Emits on canceling the job opening.
        /// Params:
        /// - Opening id
        OpeningCanceled(OpeningId),

        /// Emits on setting the budget for the working group.
        /// Params:
        /// - new budget
        BudgetSet(Balance),

        /// Emits on updating the reward account of the worker.
        /// Params:
        /// - Id of the worker.
        /// - Reward account id of the worker.
        WorkerRewardAccountUpdated(WorkerId, AccountId),

        /// Emits on updating the reward amount of the worker.
        /// Params:
        /// - Id of the worker.
        /// - Reward per block
        WorkerRewardAmountUpdated(WorkerId, Option<Balance>),

        /// Emits on updating the status text of the working group.
        /// Params:
        /// - status text hash
        /// - status text
        StatusTextChanged(Vec<u8>, Option<Vec<u8>>),

        /// Emits on budget from the working group being spent
        /// Params:
        /// - Receiver Account Id.
        /// - Balance spent.
        /// - Rationale.
        BudgetSpending(AccountId, Balance, Option<Vec<u8>>),

        /// Emits on paying the reward.
        /// Params:
        /// - Id of the worker.
        /// - Receiver Account Id.
        /// - Reward
        /// - Payment type (missed reward or regular one)
        RewardPaid(WorkerId, AccountId, Balance, RewardPaymentType),

        /// Emits on reaching new missed reward.
        /// Params:
        /// - Worker ID.
        /// - Missed reward (optional). None means 'no missed reward'.
        NewMissedRewardLevelReached(WorkerId, Option<Balance>),

        /// Emits on updating the worker storage role.
        /// Params:
        /// - Id of the worker.
        /// - Raw storage field.
        WorkerStorageUpdated(WorkerId, Vec<u8>),

        /// Emits on Lead making a remark message
        /// Params:
        /// - message
        LeadRemarked(Vec<u8>),

        /// Emits on Lead making a remark message
        /// Params:
        /// - worker
        /// - message
        WorkerRemarked(WorkerId, Vec<u8>),
    }
);

decl_storage! {
    trait Store for Module<T: Trait<I>, I: Instance=DefaultInstance> as WorkingGroup {
        /// Next identifier value for new job opening.
        pub NextOpeningId get(fn next_opening_id): OpeningId;

        /// Maps identifier to job opening.
        pub OpeningById get(fn opening_by_id): map hasher(blake2_128_concat)
            OpeningId => Opening<T::BlockNumber, BalanceOf<T>>;

        /// Count of active workers.
        pub ActiveWorkerCount get(fn active_worker_count): u32;

        /// Maps identifier to worker application on opening.
        pub ApplicationById get(fn application_by_id) : map hasher(blake2_128_concat)
            ApplicationId => Application<T>;

        /// Next identifier value for new worker application.
        pub NextApplicationId get(fn next_application_id) : ApplicationId;

        /// Next identifier for a new worker.
        pub NextWorkerId get(fn next_worker_id) : WorkerId<T>;

        /// Maps identifier to corresponding worker.
        pub WorkerById get(fn worker_by_id) : map hasher(blake2_128_concat)
            WorkerId<T> => Worker<T>;

        /// Current group lead.
        pub CurrentLead get(fn current_lead) : Option<WorkerId<T>>;

        /// Budget for the working group.
        pub Budget get(fn budget) : BalanceOf<T>;

        /// Status text hash.
        pub StatusTextHash get(fn status_text_hash) : Vec<u8>;

        /// Maps identifier to corresponding worker storage.
        pub WorkerStorage get(fn worker_storage): map hasher(blake2_128_concat)
            WorkerId<T> => Vec<u8>;

        /// Worker storage size upper bound.
        pub WorkerStorageSize get(fn worker_storage_size) : u16 = default_storage_size_constraint();
    }
}

decl_module! {
    /// _Working group_ substrate module.
    pub struct Module<T: Trait<I>, I: Instance=DefaultInstance> for enum Call where origin: T::Origin {
        /// Default deposit_event() handler
        fn deposit_event() = default;

        /// Predefined errors
        type Error = Error<T, I>;

        /// Exports const

        /// Max simultaneous active worker number.
        const MaxWorkerNumberLimit: u32 = T::MaxWorkerNumberLimit::get();

        /// Defines min unstaking period in the group.
        const MinUnstakingPeriodLimit: T::BlockNumber = T::MinUnstakingPeriodLimit::get();

        /// Minimum stake required for applying into an opening.
        const MinimumApplicationStake: T::Balance = T::MinimumApplicationStake::get();

        /// Stake needed to create an opening.
        const LeaderOpeningStake: T::Balance = T::LeaderOpeningStake::get();

        /// Defines the period every worker gets paid in blocks.
        const RewardPeriod: u32 = T::RewardPeriod::get();

        /// Staking handler lock id.
        const StakingHandlerLockId: LockIdentifier = T::StakingHandler::lock_id();

        /// # <weight>
        ///
        /// ## Weight
        /// `O (W)` where:
        /// - `W` is the number of workers currently present in the `working_group`
        /// - DB:
        ///    - O(W)
        /// # </weight>
        fn on_initialize() -> Weight {
            let leaving_workers = Self::get_workers_with_finished_unstaking_period();
            let mut biggest_number_of_processed_workers = leaving_workers.len();

            leaving_workers.iter().for_each(|wi| {
                Self::remove_worker(
                    &wi.worker_id,
                    &wi.worker,
                    RawEvent::WorkerExited(wi.worker_id)
                );
            });

            if Self::is_reward_block() {
                // We count the number of workers that will be processed to not be so pessimistic
                // when calculating the weight for this function
                let mut count_number_of_workers = 0;
                WorkerById::<T, I>::iter().for_each(|(worker_id, worker)| {
                    Self::reward_worker(&worker_id, &worker);
                    count_number_of_workers += 1;
                });

                biggest_number_of_processed_workers = biggest_number_of_processed_workers.max(count_number_of_workers);
            }

            Self::calculate_weight_on_initialize(biggest_number_of_processed_workers.saturated_into())
        }

        /// Add a job opening for a regular worker/lead role.
        /// Require signed leader origin or the root (to add opening for the leader position).
        ///
        /// # <weight>
        ///
        /// ## Weight
        /// `O (D)` where:
        /// - `D` is the length of `description`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoWorkingGroup::<T, I>::add_opening(description.len().saturated_into())]
        pub fn add_opening(
            origin,
            description: Vec<u8>,
            opening_type: OpeningType,
            stake_policy: StakePolicy<T::BlockNumber, BalanceOf<T>>,
            reward_per_block: Option<BalanceOf<T>>
        ){
            checks::ensure_origin_for_opening_type::<T, I>(origin.clone(), opening_type)?;

            checks::ensure_valid_stake_policy::<T, I>(&stake_policy)?;

            checks::ensure_valid_reward_per_block::<T, I>(&reward_per_block)?;

            checks::ensure_stake_for_opening_type::<T, I>(origin, opening_type)?;

            //
            // == MUTATION SAFE ==
            //

            let mut creation_stake = BalanceOf::<T>::zero();
            if opening_type == OpeningType::Regular {
                // Lead must be set for ensure_origin_for_openig_type in the
                // case of regular.
                let lead = Self::worker_by_id(checks::ensure_lead_is_set::<T, I>()?);
                let current_stake = T::StakingHandler::current_stake(&lead.staking_account_id);
                creation_stake = T::LeaderOpeningStake::get();
                T::StakingHandler::set_stake(
                    &lead.staking_account_id,
                    creation_stake.saturating_add(current_stake)
                )?;
            }

            let hashed_description = T::Hashing::hash(&description);

            // Create and add worker opening.
            let new_opening = Opening{
                opening_type,
                created: Self::current_block(),
                description_hash: hashed_description.as_ref().to_vec(),
                stake_policy: stake_policy.clone(),
                reward_per_block,
                creation_stake,
            };

            let new_opening_id = NextOpeningId::<I>::get();

            OpeningById::<T, I>::insert(new_opening_id, new_opening);

            // Update NextOpeningId
            NextOpeningId::<I>::mutate(|id| *id += <OpeningId as One>::one());

            Self::deposit_event(RawEvent::OpeningAdded(
                    new_opening_id,
                    description,
                    opening_type,
                    stake_policy,
                    reward_per_block,
                ));
        }

        /// Apply on a worker opening.
        ///
        /// # <weight>
        ///
        /// ## Weight
        /// `O (D)` where:
        /// - `D` is the length of `p.description`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoWorkingGroup::<T, I>::apply_on_opening(p.description.len().saturated_into())]
        pub fn apply_on_opening(origin, p : ApplyOnOpeningParameters<T>) {
            // Ensure the origin of a member with given id.
            T::MemberOriginValidator::ensure_member_controller_account_origin(origin, p.member_id)?;

            // Ensure job opening exists.
            let opening = checks::ensure_opening_exists::<T, I>(p.opening_id)?;

            // Ensure that proposed stake is enough for the opening.
            checks::ensure_application_stake_match_opening::<T, I>(&opening, &p.stake_parameters)?;

            // Checks external conditions for staking.
            ensure!(
                  T::StakingAccountValidator::is_member_staking_account(
                      &p.member_id,
                      &p.stake_parameters.staking_account_id
                  ),
                  Error::<T, I>::InvalidStakingAccountForMember
            );

            ensure!(
              T::StakingHandler::is_account_free_of_conflicting_stakes(
                  &p.stake_parameters.staking_account_id
              ),
              Error::<T, I>::ConflictStakesOnAccount
            );

              ensure!(
                  T::StakingHandler::is_enough_balance_for_stake(
                    &p.stake_parameters.staking_account_id,
                    p.stake_parameters.stake
                  ),
                  Error::<T, I>::InsufficientBalanceToCoverStake
              );

            //
            // == MUTATION SAFE ==
            //

            T::StakingHandler::lock(&p.stake_parameters.staking_account_id, p.stake_parameters.stake);

            let hashed_description = T::Hashing::hash(&p.description);

            // Make regular/lead application.
            let application = Application::<T>::new(
                &p.role_account_id,
                &p.reward_account_id,
                &p.stake_parameters.staking_account_id,
                &p.member_id,
                p.opening_id,
                hashed_description.as_ref().to_vec(),
            );

            // Get id of new worker/lead application
            let new_application_id = NextApplicationId::<I>::get();

            // Store an application.
            ApplicationById::<T, I>::insert(new_application_id, application);

            // Update the next application identifier value.
            NextApplicationId::<I>::mutate(|id| *id += <ApplicationId as One>::one());

            // Trigger the event.
            Self::deposit_event(RawEvent::AppliedOnOpening(p, new_application_id));
        }

        /// Fill opening for the regular/lead position.
        /// Require signed leader origin or the root (to fill opening for the leader position).
        /// # <weight>
        ///
        /// ## Weight
        /// `O (A)` where:
        /// - `A` is the length of `successful_application_ids`
        /// - DB:
        ///    - O(A)
        /// # </weight>
        #[weight =
            WeightInfoWorkingGroup::<T, I>::fill_opening_worker(
                successful_application_ids.len().saturated_into()
            )
            .max(WeightInfoWorkingGroup::<T, I>::fill_opening_lead())
        ]
        pub fn fill_opening(
            origin,
            opening_id: OpeningId,
            successful_application_ids: BTreeSet<ApplicationId>,
        ) {
            // Ensure job opening exists.
            let opening = checks::ensure_opening_exists::<T, I>(opening_id)?;

            checks::ensure_origin_for_opening_type::<T, I>(origin, opening.opening_type)?;

            // Ensure we're not exceeding the maximum worker number.
            let potential_worker_number =
                Self::active_worker_count() + (successful_application_ids.len() as u32);

            ensure!(
                potential_worker_number <= T::MaxWorkerNumberLimit::get(),
                Error::<T, I>::MaxActiveWorkerNumberExceeded
            );

            // Cannot hire a lead when another leader exists.
            if matches!(opening.opening_type, OpeningType::Leader) {
                ensure!(
                    !<CurrentLead<T,I>>::exists(),
                    Error::<T, I>::CannotHireLeaderWhenLeaderExists
                );
            }

            let checked_applications_info =
                checks::ensure_succesful_applications_exist::<T, I>(&successful_application_ids)?;

            // Check that all applications are for the intended opening
            ensure!(
                checked_applications_info.iter()
                .all(|info| info.application.opening_id == opening_id),
                Error::<T, I>::ApplicationsNotForOpening
            );


            // Check for a single application for a leader.
            if matches!(opening.opening_type, OpeningType::Leader) {
                ensure!(
                    successful_application_ids.len() == 1,
                    Error::<T, I>::CannotHireMultipleLeaders
                );
            }

            //
            // == MUTATION SAFE ==
            //

            if opening.opening_type == OpeningType::Regular {
                // Lead must be set for ensure_origin_for_openig_type in the
                // case of regular.
                let lead = Self::worker_by_id(checks::ensure_lead_is_set::<T, I>()?);
                let current_stake = T::StakingHandler::current_stake(&lead.staking_account_id);
                T::StakingHandler::set_stake(
                    &lead.staking_account_id,
                    current_stake.saturating_sub(opening.creation_stake)
                )?;
            }

            // Process successful applications
            let application_id_to_worker_id = Self::fulfill_successful_applications(
                &opening,
                checked_applications_info
            );

            // Remove the opening.
            <OpeningById::<T, I>>::remove(opening_id);

            // Trigger event
            Self::deposit_event(RawEvent::OpeningFilled(
                    opening_id,
                    application_id_to_worker_id,
                    successful_application_ids
                ));
        }

        /// Update the associated role account of the active regular worker/lead.
        ///
        /// # <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoWorkingGroup::<T, I>::update_role_account()]
        pub fn update_role_account(
            origin,
            worker_id: WorkerId<T>,
            new_role_account_id: T::AccountId
        ) {
            // Ensuring worker actually exists
            let worker = checks::ensure_worker_exists::<T, I>(&worker_id)?;

            // Ensure the origin of a member with given id.
            T::MemberOriginValidator::ensure_member_controller_account_origin(origin, worker.member_id)?;

            // Ensure the worker is active.
            ensure!(!worker.is_leaving(), Error::<T, I>::WorkerIsLeaving);

            //
            // == MUTATION SAFE ==
            //

            // Update role account
            WorkerById::<T, I>::mutate(worker_id, |worker| {
                worker.role_account_id = new_role_account_id.clone()
            });

            // Trigger event
            Self::deposit_event(RawEvent::WorkerRoleAccountUpdated(worker_id, new_role_account_id));
        }

        /// Leave the role by the active worker.
        /// # <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = Module::<T, I>::leave_role_weight(&rationale)]
        pub fn leave_role(
            origin,
            worker_id: WorkerId<T>,
            rationale: Option<Vec<u8>>
        ) {
            // Ensure there is a signer which matches role account of worker corresponding to provided id.
            let worker = checks::ensure_worker_signed::<T, I>(origin, &worker_id)?;

            // Ensure the worker is active.
            ensure!(!worker.is_leaving(), Error::<T, I>::WorkerIsLeaving);

            //
            // == MUTATION SAFE ==
            //

            WorkerById::<T, I>::mutate(worker_id, |worker| {
                worker.started_leaving_at = Some(Self::current_block())
            });

            // Trigger event
            Self::deposit_event(RawEvent::WorkerStartedLeaving(worker_id, rationale));
        }

        /// Terminate the active worker by the lead.
        /// Requires signed leader origin or the root (to terminate the leader role).
        /// # <weight>
        ///
        /// ## Weight
        /// `O (P)` where:
        /// - `P` is the length of `penalty.slashing_text`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = Module::<T, I>::terminate_role_weight(&rationale)]
        pub fn terminate_role(
            origin,
            worker_id: WorkerId<T>,
            penalty: Option<BalanceOf<T>>,
            rationale: Option<Vec<u8>>,
        ) {
            // Ensure lead is set or it is the council terminating the leader.
            let is_sudo = checks::ensure_origin_for_worker_operation::<T,I>(origin, worker_id)?;

            // Ensuring worker actually exists.
            let worker = checks::ensure_worker_exists::<T,I>(&worker_id)?;

            //
            // == MUTATION SAFE ==
            //

            if let Some(penalty) = penalty {
                Self::slash(worker_id, &worker.staking_account_id, penalty, rationale.clone());
            }

            // Trigger the event
            let event = if is_sudo {
                RawEvent::TerminatedLeader(worker_id, penalty, rationale)
            } else {
                RawEvent::TerminatedWorker(worker_id, penalty, rationale)
            };

            Self::remove_worker(&worker_id, &worker, event);
        }

        /// Slashes the regular worker stake, demands a leader origin. No limits, no actions on zero stake.
        /// If slashing balance greater than the existing stake - stake is slashed to zero.
        /// Requires signed leader origin or the root (to slash the leader stake).
        /// # <weight>
        ///
        /// ## Weight
        /// `O (P)` where:
        /// - `P` is the length of `penality.slashing_text`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = Module::<T, I>::slash_stake_weight(&rationale)]
        pub fn slash_stake(
            origin,
            worker_id: WorkerId<T>,
            penalty: BalanceOf<T>,
            rationale: Option<Vec<u8>>
        ) {
            // Ensure lead is set or it is the council slashing the leader.
            checks::ensure_origin_for_worker_operation::<T,I>(origin, worker_id)?;

            // Ensuring worker actually exists.
            let worker = checks::ensure_worker_exists::<T,I>(&worker_id)?;

            ensure!(
                penalty != <BalanceOf<T>>::zero(),
                Error::<T, I>::StakeBalanceCannotBeZero
            );

            //
            // == MUTATION SAFE ==
            //

            Self::slash(worker_id, &worker.staking_account_id, penalty, rationale)
        }

        /// Decreases the regular worker/lead stake and returns the remainder to the
        /// worker staking_account_id. Can be decreased to zero, no actions on zero stake.
        /// Accepts the stake amount to decrease.
        /// Requires signed leader origin or the root (to decrease the leader stake).
        ///
        /// # <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoWorkingGroup::<T, I>::decrease_stake()]
        pub fn decrease_stake(origin, worker_id: WorkerId<T>, stake_balance_delta: BalanceOf<T>) {
            // Ensure lead is set or it is the council decreasing the leader's stake.
            checks::ensure_origin_for_worker_operation::<T,I>(origin, worker_id)?;

            let worker = checks::ensure_worker_exists::<T,I>(&worker_id)?;

            // Ensure the worker is active.
            ensure!(!worker.is_leaving(), Error::<T, I>::WorkerIsLeaving);

            // Ensure non-zero stake delta.
            ensure!(
                stake_balance_delta != <BalanceOf<T>>::zero(),
                Error::<T, I>::StakeBalanceCannotBeZero
            );

            // Ensure enough stake to decrease.
            let current_stake = T::StakingHandler::current_stake(&worker.staking_account_id);

            ensure!(
                current_stake > stake_balance_delta,
                Error::<T, I>::CannotDecreaseStakeDeltaGreaterThanStake
            );

            //
            // == MUTATION SAFE ==
            //

            let current_stake = T::StakingHandler::current_stake(&worker.staking_account_id);

            // Cannot possibly overflow because of the already performed check.
            let new_stake = current_stake.saturating_sub(stake_balance_delta);

            // This external module call both checks and mutates the state.
            T::StakingHandler::set_stake(&worker.staking_account_id, new_stake)?;

            Self::deposit_event(RawEvent::StakeDecreased(worker_id, stake_balance_delta));
        }

        /// Increases the regular worker/lead stake, demands a worker origin.
        /// Locks tokens from the worker staking_account_id equal to new stake. No limits on the stake.
        ///
        /// # <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoWorkingGroup::<T, I>::increase_stake()]
        pub fn increase_stake(origin, worker_id: WorkerId<T>, stake_balance_delta: BalanceOf<T>) {
            // Checks worker origin and worker existence.
            let worker = checks::ensure_worker_signed::<T, I>(origin, &worker_id)?;

            // Ensure the worker is active.
            ensure!(!worker.is_leaving(), Error::<T, I>::WorkerIsLeaving);

            ensure!(
                stake_balance_delta != <BalanceOf<T>>::zero(),
                Error::<T, I>::StakeBalanceCannotBeZero
            );

            ensure!(
                T::StakingHandler::is_enough_balance_for_stake(
                    &worker.staking_account_id,
                    stake_balance_delta
                ),
                Error::<T, I>::InsufficientBalanceToCoverStake
            );

            //
            // == MUTATION SAFE ==
            //

            let current_stake = T::StakingHandler::current_stake(&worker.staking_account_id);

            let new_stake = current_stake.saturating_add(stake_balance_delta);

            // This external module call both checks and mutates the state.
            T::StakingHandler::set_stake(&worker.staking_account_id, new_stake)?;

            Self::deposit_event(RawEvent::StakeIncreased(worker_id, stake_balance_delta));
        }

        /// Withdraw the worker application. Can be done by the worker only.
        ///
        /// # <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoWorkingGroup::<T, I>::withdraw_application()]
        pub fn withdraw_application(
            origin,
            application_id: ApplicationId
        ) {
            // Ensuring worker application actually exists
            let application_info = checks::ensure_application_exists::<T, I>(&application_id)?;

            // Ensure that it is signed
            let signer_account = ensure_signed(origin)?;

            // Ensure that signer is applicant role account
            ensure!(
                signer_account == application_info.application.role_account_id,
                Error::<T, I>::OriginIsNotApplicant
            );

            //
            // == MUTATION SAFE ==
            //

            T::StakingHandler::unlock(&application_info.application.staking_account_id);

            // Remove an application.
            <ApplicationById<T, I>>::remove(application_info.application_id);

            // Trigger event
            Self::deposit_event(RawEvent::ApplicationWithdrawn(application_id));
        }

        /// Cancel an opening for the regular worker/lead position.
        /// Require signed leader origin or the root (to cancel opening for the leader position).
        ///
        /// # <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoWorkingGroup::<T, I>::cancel_opening()]
        pub fn cancel_opening(
            origin,
            opening_id: OpeningId,
        ) {
            // Ensure job opening exists.
            let opening = checks::ensure_opening_exists::<T, I>(opening_id)?;

            checks::ensure_origin_for_opening_type::<T, I>(origin, opening.opening_type)?;

            //
            // == MUTATION SAFE ==
            //

            // Remove opening stake
            if opening.opening_type == OpeningType::Regular {
                // Lead must be set for ensure_origin_for_openig_type in the
                // case of regular.
                let lead = Self::worker_by_id(checks::ensure_lead_is_set::<T, I>()?);
                let current_stake = T::StakingHandler::current_stake(&lead.staking_account_id);
                T::StakingHandler::set_stake(
                    &lead.staking_account_id,
                    current_stake.saturating_sub(opening.creation_stake)
                )?;
            }

            // Remove the opening.
            <OpeningById::<T, I>>::remove(opening_id);

            // Trigger event
            Self::deposit_event(RawEvent::OpeningCanceled(opening_id));
        }

        /// Sets a new budget for the working group.
        /// Requires root origin.
        ///
        /// # <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoWorkingGroup::<T, I>::set_budget()]
        pub fn set_budget(
            origin,
            new_budget: BalanceOf<T>,
        ) {
            ensure_root(origin)?;

            //
            // == MUTATION SAFE ==
            //

            // Update the budget.
            Self::set_working_group_budget(new_budget);

            // Trigger event
            Self::deposit_event(RawEvent::BudgetSet(new_budget));
        }

        /// Update the reward account associated with a set reward relationship for the active worker.
        ///
        /// # <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoWorkingGroup::<T, I>::update_reward_account()]
        pub fn update_reward_account(
            origin,
            worker_id: WorkerId<T>,
            new_reward_account_id: T::AccountId
        ) {
            // Ensure there is a signer which matches role account of worker corresponding to provided id.
            let worker = checks::ensure_worker_signed::<T, I>(origin, &worker_id)?;

            // Ensure the worker actually has a recurring reward.
            checks::ensure_worker_has_recurring_reward::<T, I>(&worker)?;

            //
            // == MUTATION SAFE ==
            //

            // Update worker reward account.
            WorkerById::<T, I>::mutate(worker_id, |worker| {
                worker.reward_account_id = new_reward_account_id.clone();
            });

            // Trigger event
            Self::deposit_event(RawEvent::WorkerRewardAccountUpdated(worker_id, new_reward_account_id));
        }

        /// Update the reward per block for the active worker.
        /// Require signed leader origin or the root (to update leader's reward amount).
        ///
        /// # <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoWorkingGroup::<T, I>::update_reward_amount()]
        pub fn update_reward_amount(
            origin,
            worker_id: WorkerId<T>,
            reward_per_block: Option<BalanceOf<T>>
        ) {
            // Ensure lead is set or it is the council setting the leader's reward.
            checks::ensure_origin_for_worker_operation::<T,I>(origin, worker_id)?;

            // Ensuring worker actually exists
            checks::ensure_worker_exists::<T,I>(&worker_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Update worker reward amount.
            WorkerById::<T, I>::mutate(worker_id, |worker| {
                worker.reward_per_block = reward_per_block;
            });

            // Trigger event
            Self::deposit_event(RawEvent::WorkerRewardAmountUpdated(worker_id, reward_per_block));
        }

        /// Sets a new status text for the working group.
        /// Requires root origin.
        ///
        /// # <weight>
        ///
        /// ## Weight
        /// `O (S)` where:
        /// - `S` is the length of the contents of `status_text` when it is not none
        ///
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoWorkingGroup::<T, I>::set_status_text(
            status_text.as_ref().map(|status_text| status_text.len().saturated_into()).unwrap_or_default()
        )]
        pub fn set_status_text(
            origin,
            status_text: Option<Vec<u8>>,
        ) {
            // Ensure group leader privilege.
            checks::ensure_origin_is_active_leader::<T,I>(origin)?;

            //
            // == MUTATION SAFE ==
            //

            let status_text_hash = status_text
                .as_ref()
                .map(|status_text| {
                        let hashed = T::Hashing::hash(&status_text);

                        hashed.as_ref().to_vec()
                    })
                .unwrap_or_default();

            // Update the status text hash.
            <StatusTextHash<I>>::put(status_text_hash.clone());

            // Trigger event
            Self::deposit_event(RawEvent::StatusTextChanged(status_text_hash, status_text));
        }

        /// Transfers specified amount to any account.
        /// Requires leader origin.
        ///
        /// # <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoWorkingGroup::<T, I>::spend_from_budget()]
        pub fn spend_from_budget(
            origin,
            account_id: T::AccountId,
            amount: BalanceOf<T>,
            rationale: Option<Vec<u8>>,
        ) {
            // Ensure group leader privilege.
            checks::ensure_origin_is_active_leader::<T,I>(origin)?;

            ensure!(amount > Zero::zero(), Error::<T, I>::CannotSpendZero);

            // Ensures that the budget is sufficient for the spending of specified amount
            let (_, potential_missed_payment) = Self::calculate_possible_payment(amount);
            ensure!(
                potential_missed_payment == Zero::zero(),
                Error::<T, I>::InsufficientBudgetForSpending
            );

            //
            // == MUTATION SAFE ==
            //

            Self::pay_from_budget(&account_id, amount);

            // Trigger event
            Self::deposit_event(RawEvent::BudgetSpending(account_id, amount, rationale));
        }

        /// Update the associated role storage.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_role_storage(
            origin,
            worker_id: WorkerId<T>,
            storage: Vec<u8>
        ) {

            // Ensure there is a signer which matches role account of worker corresponding to provided id.
            checks::ensure_worker_signed::<T,I>(origin, &worker_id)?;

            // Ensure valid text.
            checks::ensure_worker_role_storage_text_is_valid::<T,I>(&storage)?;

            //
            // == MUTATION SAFE ==
            //

            // Complete the role storage update
            WorkerStorage::<T, I>::insert(worker_id, storage.clone());

            // Trigger event
            Self::deposit_event(RawEvent::WorkerStorageUpdated(worker_id, storage));
        }

        /// Lead remark message
        ///
        /// # <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoWorkingGroup::<T,I>::lead_remark()]
        pub fn lead_remark(origin, msg: Vec<u8>) {
            let _ = checks::ensure_origin_is_active_leader::<T, I>(origin);

            //
            // == MUTATION SAFE ==
            //

            Self::deposit_event(RawEvent::LeadRemarked(msg));
        }

        /// Worker remark message
        ///
        /// # <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoWorkingGroup::<T,I>::worker_remark()]
        pub fn worker_remark(origin, worker_id: WorkerId<T>,msg: Vec<u8>) {
            let _ = checks::ensure_worker_signed::<T, I>(origin, &worker_id).map(|_| ());

            //
            // == MUTATION SAFE ==
            //

            Self::deposit_event(RawEvent::WorkerRemarked(worker_id, msg));
        }

    }
}

impl<T: Trait<I>, I: Instance> Module<T, I> {
    // Calculate weight for on_initialize
    // We assume worst case scenario in a safe manner
    // We take the most number of workers that will be processed and use it as input of the most costly function
    fn calculate_weight_on_initialize(workers: u32) -> Weight {
        WeightInfoWorkingGroup::<T, I>::on_initialize_rewarding_without_missing_reward(
            workers,
        )
        .max(
            WeightInfoWorkingGroup::<T, I>::on_initialize_rewarding_with_missing_reward_cant_pay(
                workers,
            ),
        )
        .max(
            WeightInfoWorkingGroup::<T, I>::on_initialize_rewarding_with_missing_reward(
                workers,
            ),
        )
        .max(WeightInfoWorkingGroup::<T, I>::on_initialize_leaving(
            workers,
        ))
    }

    // Calculate weight for `leave_role`
    fn leave_role_weight(rationale: &Option<Vec<u8>>) -> Weight {
        WeightInfoWorkingGroup::<T, I>::leave_role(
            rationale
                .as_ref()
                .map(|rationale| rationale.len().saturated_into())
                .unwrap_or_default(),
        )
    }

    // Calculate weights for terminate_role
    fn terminate_role_weight(penalty: &Option<Vec<u8>>) -> Weight {
        WeightInfoWorkingGroup::<T, I>::terminate_role_lead(
            penalty
                .as_ref()
                .map(|penalty| penalty.len().saturated_into())
                .unwrap_or_default(),
        )
        .max(WeightInfoWorkingGroup::<T, I>::terminate_role_worker(
            penalty
                .as_ref()
                .map(|penalty| penalty.len().saturated_into())
                .unwrap_or_default(),
        ))
    }

    // Calculates slash_stake weight
    fn slash_stake_weight(rationale: &Option<Vec<u8>>) -> Weight {
        WeightInfoWorkingGroup::<T, I>::slash_stake(
            rationale
                .as_ref()
                .map(|text| text.len().saturated_into())
                .unwrap_or_default(),
        )
    }

    // Wrapper-function over frame_system::block_number()
    fn current_block() -> T::BlockNumber {
        <frame_system::Module<T>>::block_number()
    }

    // Increases active worker counter (saturating).
    fn increase_active_worker_counter() {
        let next_active_worker_count_value = Self::active_worker_count().saturating_add(1);
        <ActiveWorkerCount<I>>::put(next_active_worker_count_value);
    }

    // Decreases active worker counter (saturating).
    fn decrease_active_worker_counter() {
        let next_active_worker_count_value = Self::active_worker_count().saturating_sub(1);
        <ActiveWorkerCount<I>>::put(next_active_worker_count_value);
    }

    // Processes successful application during the fill_opening().
    fn fulfill_successful_applications(
        opening: &Opening<T::BlockNumber, BalanceOf<T>>,
        successful_applications_info: Vec<ApplicationInfo<T, I>>,
    ) -> BTreeMap<ApplicationId, WorkerId<T>> {
        let mut application_id_to_worker_id = BTreeMap::new();

        successful_applications_info
            .iter()
            .for_each(|application_info| {
                let new_worker_id = Self::create_worker_by_application(&opening, &application_info);

                application_id_to_worker_id.insert(application_info.application_id, new_worker_id);

                // Sets a leader on successful opening when opening is for leader.
                if matches!(opening.opening_type, OpeningType::Leader) {
                    Self::set_lead(new_worker_id);
                }
            });

        application_id_to_worker_id
    }

    // Creates worker by the application. Deletes application from the storage.
    fn create_worker_by_application(
        opening: &Opening<T::BlockNumber, BalanceOf<T>>,
        application_info: &ApplicationInfo<T, I>,
    ) -> WorkerId<T> {
        // Get worker id.
        let new_worker_id = <NextWorkerId<T, I>>::get();

        // Construct a worker.
        let worker = Worker::<T>::new(
            &application_info.application.member_id,
            &application_info.application.role_account_id,
            &application_info.application.reward_account_id,
            &application_info.application.staking_account_id,
            opening.stake_policy.leaving_unstaking_period,
            opening.reward_per_block,
            Self::current_block(),
        );

        // Store a worker.
        <WorkerById<T, I>>::insert(new_worker_id, worker);
        Self::increase_active_worker_counter();

        // Update the next worker id.
        <NextWorkerId<T, I>>::mutate(|id| *id += <WorkerId<T> as One>::one());

        // Remove an application.
        <ApplicationById<T, I>>::remove(application_info.application_id);

        new_worker_id
    }

    // Set worker id as a leader id.
    pub(crate) fn set_lead(worker_id: WorkerId<T>) {
        // Update current lead
        <CurrentLead<T, I>>::put(worker_id);

        // Trigger an event
        Self::deposit_event(RawEvent::LeaderSet(worker_id));
    }

    // Evict the currently set lead.
    pub(crate) fn unset_lead() {
        if checks::ensure_lead_is_set::<T, I>().is_ok() {
            // Update current lead
            <CurrentLead<T, I>>::kill();

            Self::deposit_event(RawEvent::LeaderUnset());
        }
    }

    // Fires the worker. Unsets the leader if necessary. Decreases active worker counter.
    // Deposits an event.
    fn remove_worker(worker_id: &WorkerId<T>, worker: &Worker<T>, event: Event<T, I>) {
        // Unset lead if the leader is leaving.
        let leader_worker_id = <CurrentLead<T, I>>::get();
        if let Some(leader_worker_id) = leader_worker_id {
            if leader_worker_id == *worker_id {
                Self::unset_lead();
            }
        }

        Self::try_to_pay_missed_reward(worker_id, worker);

        // Remove the worker from the storage.
        WorkerById::<T, I>::remove(worker_id);
        Self::decrease_active_worker_counter();

        T::StakingHandler::unlock(&worker.staking_account_id);

        Self::deposit_event(event);
    }

    // Slash the stake.
    fn slash(
        worker_id: WorkerId<T>,
        staking_account_id: &T::AccountId,
        balance: BalanceOf<T>,
        rationale: Option<Vec<u8>>,
    ) {
        let slashed_balance = T::StakingHandler::slash(staking_account_id, Some(balance));
        Self::deposit_event(RawEvent::StakeSlashed(
            worker_id,
            slashed_balance,
            balance,
            rationale,
        ));
    }

    // Reward a worker using reward presets and working group budget.
    fn reward_worker(worker_id: &WorkerId<T>, worker: &Worker<T>) {
        // If reward period is not set.
        let mut rewarding_period: u32 = T::RewardPeriod::get();
        if rewarding_period == 0u32 {
            rewarding_period = One::one();
        }

        // Modify rewarding period for new workers.
        let block_from_worker_creation: u128 =
            (Self::current_block() - worker.created_at).saturated_into();
        if block_from_worker_creation < rewarding_period.into() {
            rewarding_period = block_from_worker_creation.saturated_into();
        }

        if let Some(reward_per_block) = worker.reward_per_block {
            let reward = reward_per_block * rewarding_period.into();

            let (actual_reward, missed_reward) = Self::calculate_possible_payment(reward);

            // Check whether the budget is not zero.
            if actual_reward > Zero::zero() {
                Self::pay_reward(
                    worker_id,
                    &worker.reward_account_id,
                    actual_reward,
                    RewardPaymentType::RegularReward,
                );
            }

            // Check whether the budget is insufficient.
            if missed_reward > Zero::zero() {
                Self::save_missed_reward(worker_id, worker, missed_reward);
            } else {
                Self::try_to_pay_missed_reward(worker_id, worker);
            }
        }
    }

    // Transfers the tokens if budget is sufficient. Infallible!
    // Should be accompanied with previous budget check.
    fn pay_from_budget(account_id: &T::AccountId, amount: BalanceOf<T>) {
        let budget = Self::budget();

        let new_budget = budget.saturating_sub(amount);
        <Budget<T, I>>::put(new_budget);

        let _ = <balances::Module<T>>::deposit_creating(account_id, amount);
    }

    // Helper-function joining the reward payment with the event.
    fn pay_reward(
        worker_id: &WorkerId<T>,
        account_id: &T::AccountId,
        amount: BalanceOf<T>,
        reward_payment_type: RewardPaymentType,
    ) {
        Self::pay_from_budget(account_id, amount);
        Self::deposit_event(RawEvent::RewardPaid(
            *worker_id,
            account_id.clone(),
            amount,
            reward_payment_type,
        ));
    }

    // Tries to pay missed reward if the reward is enabled for worker and there is enough of group budget.
    fn try_to_pay_missed_reward(worker_id: &WorkerId<T>, worker: &Worker<T>) {
        if let Some(missed_reward) = worker.missed_reward {
            let (could_be_paid_reward, insufficient_amount) =
                Self::calculate_possible_payment(missed_reward);

            // Checks if the budget allows any payment.
            if could_be_paid_reward > Zero::zero() {
                Self::pay_reward(
                    worker_id,
                    &worker.reward_account_id,
                    could_be_paid_reward,
                    RewardPaymentType::MissedReward,
                );

                let new_missed_reward = if insufficient_amount > Zero::zero() {
                    Some(insufficient_amount)
                } else {
                    None
                };

                Self::update_worker_missed_reward(worker_id, new_missed_reward);
            }
        }
    }

    // Update worker missed reward.
    fn update_worker_missed_reward(
        worker_id: &WorkerId<T>,
        new_missed_reward: Option<BalanceOf<T>>,
    ) {
        WorkerById::<T, I>::mutate(worker_id, |worker| {
            worker.missed_reward = new_missed_reward;
        });

        Self::deposit_event(RawEvent::NewMissedRewardLevelReached(
            *worker_id,
            new_missed_reward,
        ));
    }

    // Saves missed reward for a worker.
    fn save_missed_reward(worker_id: &WorkerId<T>, worker: &Worker<T>, reward: BalanceOf<T>) {
        // Save unpaid reward.
        let missed_reward_so_far = worker.missed_reward.map_or(Zero::zero(), |val| val);

        let new_missed_reward = missed_reward_so_far + reward;

        Self::update_worker_missed_reward(worker_id, Some(new_missed_reward));
    }

    // Returns allowed payment by the group budget and possible missed payment
    fn calculate_possible_payment(amount: BalanceOf<T>) -> (BalanceOf<T>, BalanceOf<T>) {
        let budget = Self::budget();

        if budget >= amount {
            (amount, Zero::zero())
        } else {
            (budget, amount - budget)
        }
    }

    // Returns a collection of workers with finished unstaking period.
    fn get_workers_with_finished_unstaking_period() -> Vec<WorkerInfo<T>> {
        WorkerById::<T, I>::iter()
            .filter_map(|(worker_id, worker)| {
                if let Some(started_leaving_at) = worker.started_leaving_at {
                    if started_leaving_at + worker.job_unstaking_period <= Self::current_block() {
                        return Some((worker_id, worker).into());
                    }
                }

                None
            })
            .collect::<Vec<_>>()
    }

    // Defines whether the current block is a reward block.
    fn is_reward_block() -> bool {
        let current_block = Self::current_block();

        // Don't reward at genesis.
        if current_block == Zero::zero() {
            return false;
        }

        let reward_period: u32 = T::RewardPeriod::get();

        // Special case for not set reward_period. Treats as reward_period == 1.
        if reward_period == 0u32 {
            return true;
        }

        // Check whether current block is a reward block.
        current_block % reward_period.into() == Zero::zero()
    }

    // Sets the working group budget.
    fn set_working_group_budget(new_budget: BalanceOf<T>) {
        <Budget<T, I>>::put(new_budget);
    }

    /// Returns all existing worker id list.
    pub fn get_all_worker_ids() -> Vec<WorkerId<T>> {
        <WorkerById<T, I>>::iter()
            .map(|(worker_id, _)| worker_id)
            .collect()
    }
}

impl<T: Trait<I>, I: Instance> common::working_group::WorkingGroupAuthenticator<T>
    for Module<T, I>
{
    fn ensure_worker_origin(origin: T::Origin, worker_id: &WorkerId<T>) -> DispatchResult {
        checks::ensure_worker_signed::<T, I>(origin, worker_id).map(|_| ())
    }

    fn ensure_leader_origin(origin: T::Origin) -> DispatchResult {
        checks::ensure_origin_is_active_leader::<T, I>(origin)
    }

    fn get_leader_member_id() -> Option<T::MemberId> {
        checks::ensure_lead_is_set::<T, I>()
            .map(Self::worker_by_id)
            .map(|worker| worker.member_id)
            .ok()
    }

    fn is_leader_account_id(account_id: &T::AccountId) -> bool {
        checks::ensure_is_lead_account::<T, I>(account_id.clone()).is_ok()
    }

    fn is_worker_account_id(account_id: &T::AccountId, worker_id: &WorkerId<T>) -> bool {
        checks::ensure_worker_exists::<T, I>(worker_id)
            .map(|worker| worker.role_account_id == account_id.clone())
            .unwrap_or(false)
    }

    fn worker_exists(worker_id: &T::ActorId) -> bool {
        checks::ensure_worker_exists::<T, I>(worker_id).is_ok()
    }

    fn ensure_worker_exists(worker_id: &WorkerId<T>) -> DispatchResult {
        checks::ensure_worker_exists::<T, I>(worker_id)
            .map(|_| ())
            .map_err(|err| err.into())
    }
}

impl<T: Trait<I>, I: Instance>
    common::working_group::WorkingGroupBudgetHandler<T::AccountId, BalanceOf<T>> for Module<T, I>
{
    fn get_budget() -> BalanceOf<T> {
        Self::budget()
    }

    fn set_budget(new_value: BalanceOf<T>) {
        Self::set_working_group_budget(new_value);
    }

    fn try_withdraw(account_id: &T::AccountId, amount: BalanceOf<T>) -> DispatchResult {
        ensure!(
            Self::get_budget() >= amount,
            Error::<T, I>::InsufficientBalanceForTransfer
        );

        let _ = Balances::<T>::deposit_creating(account_id, amount);

        let current_budget = Self::get_budget();
        let new_budget = current_budget.saturating_sub(amount);
        <Self as common::working_group::WorkingGroupBudgetHandler<T::AccountId, BalanceOf<T>>>::set_budget(
            new_budget,
        );

        Ok(())
    }
}

// Creates default storage size constraint.
pub(crate) fn default_storage_size_constraint() -> u16 {
    2048
}
