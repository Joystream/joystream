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

mod benchmarking;
mod checks;
mod errors;
#[cfg(test)]
mod tests;
mod types;

use codec::Codec;
use frame_support::traits::{Currency, Get};
use frame_support::weights::Weight;
use frame_support::IterableStorageMap;
use frame_support::{decl_event, decl_module, decl_storage, ensure, Parameter, StorageValue};
use frame_system::{ensure_root, ensure_signed};
use sp_arithmetic::traits::{BaseArithmetic, One, Zero};
use sp_runtime::traits::{Hash, MaybeSerialize, Member, SaturatedConversion, Saturating};
use sp_std::collections::{btree_map::BTreeMap, btree_set::BTreeSet};
use sp_std::vec::Vec;

pub use errors::Error;
pub use types::{
    ApplicationId, ApplyOnOpeningParameters, BalanceOf, JobApplication, JobOpening, OpeningId,
    OpeningType, Penalty, RewardPolicy, StakePolicy, WorkerId,
};
use types::{ApplicationInfo, GroupWorker, MemberId, WorkerInfo};

pub use checks::{ensure_origin_is_active_leader, ensure_worker_signed};

use common::origin::ActorOriginValidator;
use membership::staking_handler::StakingHandler;

/// The _Group_ main _Trait_
pub trait Trait<I: Instance = DefaultInstance>:
    frame_system::Trait + membership::Trait + balances::Trait
{
    /// OpeningId type
    type OpeningId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    /// ApplicationId type
    type ApplicationId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    /// _Administration_ event type.
    type Event: From<Event<Self, I>> + Into<<Self as frame_system::Trait>::Event>;

    /// Defines max workers number in the group.
    type MaxWorkerNumberLimit: Get<u32>;

    /// Stakes and balance locks handler.
    type StakingHandler: StakingHandler<Self>;

    /// Validates member id and origin combination
    type MemberOriginValidator: ActorOriginValidator<Self::Origin, MemberId<Self>, Self::AccountId>;

    /// Defines min unstaking period in the group.
    type MinUnstakingPeriodLimit: Get<Self::BlockNumber>;

    /// Defines the period every worker gets paid in blocks.
    type RewardPeriod: Get<u32>;
}

decl_event!(
    /// _Group_ events
    pub enum Event<T, I = DefaultInstance>
    where
       <T as Trait<I>>::OpeningId,
       <T as Trait<I>>::ApplicationId,
       ApplicationIdToWorkerIdMap = BTreeMap<<T as Trait<I>>::ApplicationId, WorkerId<T>>,
       WorkerId = WorkerId<T>,
       <T as frame_system::Trait>::AccountId,
       Balance = BalanceOf<T>,
    {
        /// Emits on adding new job opening.
        /// Params:
        /// - Opening id
        OpeningAdded(OpeningId),

        /// Emits on adding the application for the worker opening.
        /// Params:
        /// - Opening id
        /// - Application id
        AppliedOnOpening(OpeningId, ApplicationId),

        /// Emits on filling the job opening.
        /// Params:
        /// - Worker opening id
        /// - Worker application id to the worker id dictionary
        OpeningFilled(OpeningId, ApplicationIdToWorkerIdMap),

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
        WorkerExited(WorkerId),

        /// Emits on terminating the worker.
        /// Params:
        /// - worker id.
        TerminatedWorker(WorkerId),

        /// Emits on terminating the leader.
        /// Params:
        /// - leader worker id.
        TerminatedLeader(WorkerId),

        /// Emits on slashing the regular worker/lead stake.
        /// Params:
        /// - regular worker/lead id.
        /// - actual slashed balance.
        StakeSlashed(WorkerId, Balance),

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
        StatusTextChanged(Vec<u8>),

        /// Emits on updating the status text of the working group.
        /// Params:
        /// - status text hash
        BudgetSpending(AccountId, Balance),
    }
);

decl_storage! {
    trait Store for Module<T: Trait<I>, I: Instance=DefaultInstance> as WorkingGroup {
        /// Next identifier value for new job opening.
        pub NextOpeningId get(fn next_opening_id): T::OpeningId;

        /// Maps identifier to job opening.
        pub OpeningById get(fn opening_by_id): map hasher(blake2_128_concat)
            T::OpeningId => JobOpening<T::BlockNumber, BalanceOf<T>>;

        /// Count of active workers.
        pub ActiveWorkerCount get(fn active_worker_count): u32;

        /// Maps identifier to worker application on opening.
        pub ApplicationById get(fn application_by_id) : map hasher(blake2_128_concat)
            T::ApplicationId => JobApplication<T>;

        /// Next identifier value for new worker application.
        pub NextApplicationId get(fn next_application_id) : T::ApplicationId;

        /// Next identifier for a new worker.
        pub NextWorkerId get(fn next_worker_id) : WorkerId<T>;

        /// Maps identifier to corresponding worker.
        pub WorkerById get(fn worker_by_id) : map hasher(blake2_128_concat)
            WorkerId<T> => GroupWorker<T>;

        /// Current group lead.
        pub CurrentLead get(fn current_lead) : Option<WorkerId<T>>;

        /// Budget for the working group.
        pub Budget get(fn budget) : BalanceOf<T>;

        /// Status text hash.
        pub StatusTextHash get(fn status_text_hash) : Vec<u8>;
    }
}

decl_module! {
    /// _Working group_ substrate module.
    pub struct Module<T: Trait<I>, I: Instance=DefaultInstance> for enum Call where origin: T::Origin {
        /// Default deposit_event() handler
        fn deposit_event() = default;

        /// Predefined errors
        type Error = Error<T, I>;

        /// Exports const -  max simultaneous active worker number.
        const MaxWorkerNumberLimit: u32 = T::MaxWorkerNumberLimit::get();

        fn on_initialize() -> Weight {
            let leaving_workers = Self::get_workers_with_finished_unstaking_period();

            leaving_workers.iter().for_each(|wi| {
                Self::remove_worker(&wi.worker_id, &wi.worker, RawEvent::WorkerExited(wi.worker_id));
            });

            if Self::is_reward_block() {
                WorkerById::<T, I>::iter().for_each(|(worker_id, worker)| {
                    Self::reward_worker(&worker_id, &worker);
                });
            }

            10_000_000 //TODO: adjust weight
        }

        /// Add a job opening for a regular worker/lead role.
        /// Require signed leader origin or the root (to add opening for the leader position).
        #[weight = 10_000_000] // TODO: adjust weight: it should also consider a description length
        pub fn add_opening(
            origin,
            description: Vec<u8>,
            opening_type: OpeningType,
            stake_policy: Option<StakePolicy<T::BlockNumber, BalanceOf<T>>>,
            reward_policy: Option<RewardPolicy<BalanceOf<T>>>
        ){
            checks::ensure_origin_for_opening_type::<T, I>(origin, opening_type)?;

            checks::ensure_valid_stake_policy::<T, I>(&stake_policy)?;

            checks::ensure_valid_reward_policy::<T, I>(&reward_policy)?;

            //
            // == MUTATION SAFE ==
            //

            let hashed_description = T::Hashing::hash(&description);

            // Create and add worker opening.
            let new_opening = JobOpening{
                opening_type,
                created: Self::current_block(),
                description_hash: hashed_description.as_ref().to_vec(),
                stake_policy,
                reward_policy,
            };

            let new_opening_id = NextOpeningId::<T, I>::get();

            OpeningById::<T, I>::insert(new_opening_id, new_opening);

            // Update NextOpeningId
            NextOpeningId::<T, I>::mutate(|id| *id += <T::OpeningId as One>::one());

            Self::deposit_event(RawEvent::OpeningAdded(new_opening_id));
        }

        /// Apply on a worker opening.
        #[weight = 10_000_000] // TODO: adjust weight: it should also consider a description length
        pub fn apply_on_opening(origin, p : ApplyOnOpeningParameters<T, I>) {
            // Ensure the origin of a member with given id.
            T::MemberOriginValidator::ensure_actor_origin(origin, p.member_id)?;

            // Ensure job opening exists.
            let opening = checks::ensure_opening_exists::<T, I>(&p.opening_id)?;

            // Ensure that proposed stake is enough for the opening.
            checks::ensure_application_stake_match_opening::<T, I>(&opening, &p.stake_parameters)?;

            // Checks external conditions for staking.
            if let Some(sp) = p.stake_parameters.clone() {
                ensure!(
                    T::StakingHandler::is_member_staking_account(&p.member_id, &sp.staking_account_id),
                    Error::<T, I>::InvalidStakingAccountForMember
                );

                ensure!(
                    T::StakingHandler::is_account_free_of_conflicting_stakes(&sp.staking_account_id),
                    Error::<T, I>::ConflictStakesOnAccount
                );

                ensure!(
                    T::StakingHandler::is_enough_balance_for_stake(&sp.staking_account_id, sp.stake),
                    Error::<T, I>::InsufficientBalanceToCoverStake
                );
            }

            //
            // == MUTATION SAFE ==
            //

            if let Some(sp) = p.stake_parameters.clone() {
                T::StakingHandler::lock(&sp.staking_account_id, sp.stake);
            }

            let hashed_description = T::Hashing::hash(&p.description);

            // Make regular/lead application.
            let application = JobApplication::<T>::new(
                &p.role_account_id,
                &p.reward_account_id,
                &p.stake_parameters.map(|sp| sp.staking_account_id),
                &p.member_id,
                hashed_description.as_ref().to_vec(),
            );

            // Get id of new worker/lead application
            let new_application_id = NextApplicationId::<T, I>::get();

            // Store an application.
            ApplicationById::<T, I>::insert(new_application_id, application);

            // Update the next application identifier value.
            NextApplicationId::<T, I>::mutate(|id| *id += <T::ApplicationId as One>::one());

            // Trigger the event.
            Self::deposit_event(RawEvent::AppliedOnOpening(p.opening_id, new_application_id));
        }

        /// Fill opening for the regular/lead position.
        /// Require signed leader origin or the root (to fill opening for the leader position).
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn fill_opening(
            origin,
            opening_id: T::OpeningId,
            successful_application_ids: BTreeSet<T::ApplicationId>,
        ) {
            // Ensure job opening exists.
            let opening = checks::ensure_opening_exists::<T, I>(&opening_id)?;

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
                ensure!(!<CurrentLead<T,I>>::exists(), Error::<T, I>::CannotHireLeaderWhenLeaderExists);
            }

            let checked_applications_info = checks::ensure_succesful_applications_exist::<T, I>(&successful_application_ids)?;

            // Check for a single application for a leader.
            if matches!(opening.opening_type, OpeningType::Leader) {
                ensure!(successful_application_ids.len() == 1, Error::<T, I>::CannotHireMultipleLeaders);
            }

            //
            // == MUTATION SAFE ==
            //

            // Process successful applications
            let application_id_to_worker_id = Self::fulfill_successful_applications(
                &opening,
                checked_applications_info
            );

            // Remove the opening.
            <OpeningById::<T, I>>::remove(opening_id);

            // Trigger event
            Self::deposit_event(RawEvent::OpeningFilled(opening_id, application_id_to_worker_id));
        }

        /// Update the associated role account of the active regular worker/lead.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_role_account(
            origin,
            worker_id: WorkerId<T>,
            new_role_account_id: T::AccountId
        ) {
            // Ensuring worker actually exists
            let worker = checks::ensure_worker_exists::<T, I>(&worker_id)?;

            // Ensure that origin is signed by member with given id.
            checks::ensure_origin_signed_by_member::<T, I>(origin, &worker.member_id)?;

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
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn leave_role(
            origin,
            worker_id: WorkerId<T>,
        ) {
            // Ensure there is a signer which matches role account of worker corresponding to provided id.
            let worker = checks::ensure_worker_signed::<T, I>(origin, &worker_id)?;

            // Ensure the worker is active.
            ensure!(!worker.is_leaving(), Error::<T, I>::WorkerIsLeaving);

            //
            // == MUTATION SAFE ==
            //

            if Self::can_leave_immediately(&worker){
                Self::remove_worker(&worker_id, &worker, RawEvent::WorkerExited(worker_id));
            } else{
                WorkerById::<T, I>::mutate(worker_id, |worker| {
                    worker.started_leaving_at = Some(Self::current_block())
                });
            }
        }

        /// Terminate the active worker by the lead.
        /// Requires signed leader origin or the root (to terminate the leader role).
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn terminate_role(
            origin,
            worker_id: WorkerId<T>,
            penalty: Option<Penalty<BalanceOf<T>>>,
        ) {
            // Ensure lead is set or it is the council terminating the leader.
            let is_sudo = checks::ensure_origin_for_worker_operation::<T,I>(origin, worker_id)?;

            // Ensuring worker actually exists.
            let worker = checks::ensure_worker_exists::<T,I>(&worker_id)?;

            if penalty.is_some() {
                // Ensure worker has a stake.
                ensure!(
                    worker.staking_account_id.is_some(),
                    Error::<T, I>::CannotChangeStakeWithoutStakingAccount
                );
            }

            //
            // == MUTATION SAFE ==
            //

            if let Some(penalty) = penalty {
                if let Some(staking_account_id) = worker.staking_account_id.clone() {
                    Self::slash(worker_id, &staking_account_id, Some(penalty.slashing_amount));
                }
            }

            // Trigger the event
            let event = if is_sudo {
                RawEvent::TerminatedLeader(worker_id)
            } else {
                RawEvent::TerminatedWorker(worker_id)
            };

            Self::remove_worker(&worker_id, &worker, event);
        }

        /// Slashes the regular worker stake, demands a leader origin. No limits, no actions on zero stake.
        /// If slashing balance greater than the existing stake - stake is slashed to zero.
        /// Requires signed leader origin or the root (to slash the leader stake).
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn slash_stake(origin, worker_id: WorkerId<T>, penalty: Penalty<BalanceOf<T>>) {
            // Ensure lead is set or it is the council slashing the leader.
            checks::ensure_origin_for_worker_operation::<T,I>(origin, worker_id)?;

            // Ensuring worker actually exists.
            let worker = checks::ensure_worker_exists::<T,I>(&worker_id)?;

            // Ensure worker has a stake.
            ensure!(
                worker.staking_account_id.is_some(),
                Error::<T, I>::CannotChangeStakeWithoutStakingAccount
            );

            ensure!(
                penalty.slashing_amount != <BalanceOf<T>>::zero(),
                Error::<T, I>::StakeBalanceCannotBeZero
            );

            //
            // == MUTATION SAFE ==
            //

            if let Some(staking_account_id) = worker.staking_account_id {
                Self::slash(worker_id, &staking_account_id, Some(penalty.slashing_amount))
            }
        }

        /// Decreases the regular worker/lead stake and returns the remainder to the
        /// worker staking_account_id. Can be decreased to zero, no actions on zero stake.
        /// Accepts the stake amount to decrease.
        /// Requires signed leader origin or the root (to decrease the leader stake).
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn decrease_stake(origin, worker_id: WorkerId<T>, stake_balance_delta: BalanceOf<T>) {
            // Ensure lead is set or it is the council decreasing the leader's stake.
            checks::ensure_origin_for_worker_operation::<T,I>(origin, worker_id)?;

            let worker = checks::ensure_worker_exists::<T,I>(&worker_id)?;

            // Ensure worker has a stake.
            ensure!(
                worker.staking_account_id.is_some(),
                Error::<T, I>::CannotChangeStakeWithoutStakingAccount
            );

            // Ensure the worker is active.
            ensure!(!worker.is_leaving(), Error::<T, I>::WorkerIsLeaving);

            // Ensure non-zero stake delta.
            ensure!(
                stake_balance_delta != <BalanceOf<T>>::zero(),
                Error::<T, I>::StakeBalanceCannotBeZero
            );

            // Ensure enough stake to decrease.
            if let Some(staking_account_id) = worker.staking_account_id.clone(){
                let current_stake = T::StakingHandler::current_stake(&staking_account_id);

                ensure!(
                    current_stake > stake_balance_delta,
                    Error::<T, I>::CannotDecreaseStakeDeltaGreaterThanStake
                );
            }

            //
            // == MUTATION SAFE ==
            //

             if let Some(staking_account_id) = worker.staking_account_id{
                let current_stake = T::StakingHandler::current_stake(&staking_account_id);

                // Cannot possibly overflow because of the already performed check.
                let new_stake = current_stake.saturating_sub(stake_balance_delta);

                // This external module call both checks and mutates the state.
                T::StakingHandler::set_stake(&staking_account_id, new_stake)?;

                Self::deposit_event(RawEvent::StakeDecreased(worker_id, stake_balance_delta));
            }
        }

        /// Increases the regular worker/lead stake, demands a worker origin.
        /// Locks tokens from the worker staking_account_id equal to new stake. No limits on the stake.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn increase_stake(origin, worker_id: WorkerId<T>, stake_balance_delta: BalanceOf<T>) {
            // Checks worker origin and worker existence.
            let worker = checks::ensure_worker_signed::<T, I>(origin, &worker_id)?;

            // Ensure the worker is active.
            ensure!(!worker.is_leaving(), Error::<T, I>::WorkerIsLeaving);

            // Ensure worker has a stake.
            ensure!(
                worker.staking_account_id.is_some(),
                Error::<T, I>::CannotChangeStakeWithoutStakingAccount
            );

            ensure!(
                stake_balance_delta != <BalanceOf<T>>::zero(),
                Error::<T, I>::StakeBalanceCannotBeZero
            );

            if let Some(staking_account_id) = worker.staking_account_id.clone() {
                ensure!(
                    T::StakingHandler::is_enough_balance_for_stake(&staking_account_id, stake_balance_delta),
                    Error::<T, I>::InsufficientBalanceToCoverStake
                );
            }

            //
            // == MUTATION SAFE ==
            //

            if let Some(staking_account_id) = worker.staking_account_id {
                let current_stake = T::StakingHandler::current_stake(&staking_account_id);

                let new_stake = current_stake.saturating_add(stake_balance_delta);

                // This external module call both checks and mutates the state.
                T::StakingHandler::set_stake(&staking_account_id, new_stake)?;

                Self::deposit_event(RawEvent::StakeIncreased(worker_id, stake_balance_delta));
            }
        }

        /// Withdraw the worker application. Can be done by the worker only.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn withdraw_application(
            origin,
            application_id: T::ApplicationId
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

            if let Some(staking_account_id) = application_info.application.staking_account_id.clone() {
                T::StakingHandler::unlock(&staking_account_id);
            }
            // Remove an application.
            <ApplicationById<T, I>>::remove(application_info.application_id);

            // Trigger event
            Self::deposit_event(RawEvent::ApplicationWithdrawn(application_id));
        }

        /// Cancel an opening for the regular worker/lead position.
        /// Require signed leader origin or the root (to cancel opening for the leader position).
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn cancel_opening(
            origin,
            opening_id: T::OpeningId,
        ) {
            // Ensure job opening exists.
            let opening = checks::ensure_opening_exists::<T, I>(&opening_id)?;

            checks::ensure_origin_for_opening_type::<T, I>(origin, opening.opening_type)?;

            //
            // == MUTATION SAFE ==
            //

            // Remove the opening.
            <OpeningById::<T, I>>::remove(opening_id);

            // Trigger event
            Self::deposit_event(RawEvent::OpeningCanceled(opening_id));
        }

        /// Sets a new budget for the working group.
        /// Requires root origin.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn set_budget(
            origin,
            new_budget: BalanceOf<T>,
        ) {
            ensure_root(origin)?;

            //
            // == MUTATION SAFE ==
            //

            // Update the budget.
            <Budget::<T, I>>::put(new_budget);

            // Trigger event
            Self::deposit_event(RawEvent::BudgetSet(new_budget));
        }

        /// Update the reward account associated with a set reward relationship for the active worker.
        #[weight = 10_000_000] // TODO: adjust weight
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
        #[weight = 10_000_000] // TODO: adjust weight
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
        #[weight = 10_000_000] // TODO: adjust weight
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
                .map(|status_text| {
                        let hashed = T::Hashing::hash(&status_text);

                        hashed.as_ref().to_vec()
                    })
                .unwrap_or_default();

            // Update the status text hash.
            <StatusTextHash<I>>::put(status_text_hash.clone());

            // Trigger event
            Self::deposit_event(RawEvent::StatusTextChanged(status_text_hash));
        }

        /// Transfers specified amount to any account.
        /// Requires leader origin.
        #[weight = 10_000_000] // TODO: adjust weight
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
            Self::deposit_event(RawEvent::BudgetSpending(account_id, amount));
        }
    }
}

impl<T: Trait<I>, I: Instance> Module<T, I> {
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
        opening: &JobOpening<T::BlockNumber, BalanceOf<T>>,
        successful_applications_info: Vec<ApplicationInfo<T, I>>,
    ) -> BTreeMap<T::ApplicationId, WorkerId<T>> {
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
        opening: &JobOpening<T::BlockNumber, BalanceOf<T>>,
        application_info: &ApplicationInfo<T, I>,
    ) -> WorkerId<T> {
        // Get worker id.
        let new_worker_id = <NextWorkerId<T, I>>::get();

        // Construct a worker.
        let worker = GroupWorker::<T>::new(
            &application_info.application.member_id,
            &application_info.application.role_account_id,
            &application_info.application.reward_account_id,
            &application_info.application.staking_account_id,
            opening
                .stake_policy
                .as_ref()
                .map_or(Zero::zero(), |sp| sp.leaving_unstaking_period),
            opening.reward_policy.as_ref().map(|rp| rp.reward_per_block),
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
    fn remove_worker(worker_id: &WorkerId<T>, worker: &GroupWorker<T>, event: Event<T, I>) {
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

        if let Some(staking_account_id) = worker.staking_account_id.clone() {
            T::StakingHandler::unlock(&staking_account_id);
        }

        Self::deposit_event(event);
    }

    // Slash the stake.
    fn slash(
        worker_id: WorkerId<T>,
        staking_account_id: &T::AccountId,
        balance: Option<BalanceOf<T>>,
    ) {
        let slashed_balance = T::StakingHandler::slash(staking_account_id, balance);
        Self::deposit_event(RawEvent::StakeSlashed(worker_id, slashed_balance));
    }

    // Reward a worker using reward presets and working group budget.
    fn reward_worker(worker_id: &WorkerId<T>, worker: &GroupWorker<T>) {
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
                Self::pay_from_budget(&worker.reward_account_id, actual_reward);
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

    // Tries to pay missed reward if the reward is enabled for worker and there is enough of group budget.
    fn try_to_pay_missed_reward(worker_id: &WorkerId<T>, worker: &GroupWorker<T>) {
        if let Some(missed_reward) = worker.missed_reward {
            let (could_be_paid_reward, insufficient_amount) =
                Self::calculate_possible_payment(missed_reward);

            // Checks if the budget allows any payment.
            if could_be_paid_reward > Zero::zero() {
                Self::pay_from_budget(&worker.reward_account_id, could_be_paid_reward);

                let new_missed_reward = if insufficient_amount > Zero::zero() {
                    Some(insufficient_amount)
                } else {
                    None
                };

                // Update worker missed reward.
                WorkerById::<T, I>::mutate(worker_id, |worker| {
                    worker.missed_reward = new_missed_reward;
                });
            }
        }
    }

    // Saves missed reward for a worker.
    fn save_missed_reward(worker_id: &WorkerId<T>, worker: &GroupWorker<T>, reward: BalanceOf<T>) {
        // Save unpaid reward.
        let missed_reward_so_far = worker.missed_reward.map_or(Zero::zero(), |val| val);

        let new_missed_reward = missed_reward_so_far + reward;

        // Update worker missed reward.
        WorkerById::<T, I>::mutate(worker_id, |worker| {
            worker.missed_reward = Some(new_missed_reward);
        });
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
                    if started_leaving_at + worker.job_unstaking_period >= Self::current_block() {
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

    // Defines whether the worker staking parameters allow to leave without unstaking period.
    fn can_leave_immediately(worker: &GroupWorker<T>) -> bool {
        if worker.job_unstaking_period == Zero::zero() {
            return true;
        }

        if let Some(staking_account_id) = worker.staking_account_id.clone() {
            if T::StakingHandler::current_stake(&staking_account_id) == Zero::zero() {
                return true;
            }
        }

        false
    }
}
