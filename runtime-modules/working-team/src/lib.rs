//! # Working team pallet
//! Working team pallet for the Joystream platform.
//! Contains abstract working team workflow.
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
//!
// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

// Do not delete! Cannot be uncommented by default, because of Parity decl_module! issue.
//#![warn(missing_docs)]

mod checks;
mod errors;
#[cfg(test)]
mod tests;
mod types;

use codec::Codec;
use frame_support::traits::{Get, LockIdentifier};
use frame_support::weights::Weight;
use frame_support::IterableStorageMap;
use frame_support::{decl_event, decl_module, decl_storage, ensure, Parameter, StorageValue};
use sp_arithmetic::traits::{BaseArithmetic, One, Zero};
use sp_runtime::traits::{Hash, MaybeSerialize, Member};
use sp_std::collections::{btree_map::BTreeMap, btree_set::BTreeSet};
use system::ensure_signed;

pub use errors::Error;
use types::{ApplicationInfo, BalanceOfCurrency, MemberId, TeamWorker, TeamWorkerId};
pub use types::{JobApplication, JobOpening, JobOpeningType, StakePolicy, StakingHandler};

/// The _Team_ main _Trait_
pub trait Trait<I: Instance>:
    system::Trait + membership::Trait + balances::Trait + common::currency::GovernanceCurrency
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
    type Event: From<Event<Self, I>> + Into<<Self as system::Trait>::Event>;

    /// Defines max workers number in the team.
    type MaxWorkerNumberLimit: Get<u32>;

    /// Stakes and balance locks handler.
    type StakingHandler: StakingHandler<Self>;

    /// Defines work team ID for balance locking.
    type LockId: Get<LockIdentifier>;
}

decl_event!(
    /// _Team_ events
    pub enum Event<T, I>
    where
       <T as Trait<I>>::OpeningId,
       <T as Trait<I>>::ApplicationId,
       ApplicationIdToWorkerIdMap = BTreeMap<<T as Trait<I>>::ApplicationId, TeamWorkerId<T>>,
       TeamWorkerId = TeamWorkerId<T>,
       <T as system::Trait>::AccountId,
       Balance = BalanceOfCurrency<T>,
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

        /// Emits on setting the team leader.
        /// Params:
        /// - Team worker id.
        LeaderSet(TeamWorkerId),

        /// Emits on updating the role account of the worker.
        /// Params:
        /// - Id of the worker.
        /// - Role account id of the worker.
        WorkerRoleAccountUpdated(TeamWorkerId, AccountId),

        /// Emits on un-setting the leader.
        LeaderUnset(),

        /// Emits on exiting the worker.
        /// Params:
        /// - worker id.
        WorkerExited(TeamWorkerId),

        /// Emits on terminating the worker.
        /// Params:
        /// - worker id.
        TerminatedWorker(TeamWorkerId),

        /// Emits on terminating the leader.
        /// Params:
        /// - leader worker id.
        TerminatedLeader(TeamWorkerId),

        /// Emits on slashing the regular worker/lead stake.
        /// Params:
        /// - regular worker/lead id.
        /// - actual slashed balance.
        StakeSlashed(TeamWorkerId, Balance),

        /// Emits on decreasing the regular worker/lead stake.
        /// Params:
        /// - regular worker/lead id.
        /// - new stake amount
        StakeDecreased(TeamWorkerId, Balance),

        /// Emits on increasing the regular worker/lead stake.
        /// Params:
        /// - regular worker/lead id.
        /// - new stake amount
        StakeIncreased(TeamWorkerId, Balance),

        /// Emits on withdrawing the application for the regular worker/lead opening.
        /// Params:
        /// - Job application id
        ApplicationWithdrawn(ApplicationId),

        /// Emits on canceling the job opening.
        /// Params:
        /// - Opening id
        OpeningCanceled(OpeningId),
    }
);

decl_storage! {
    trait Store for Module<T: Trait<I>, I: Instance> as WorkingTeam {
        /// Next identifier value for new job opening.
        pub NextOpeningId get(fn next_opening_id): T::OpeningId;

        /// Maps identifier to job opening.
        pub OpeningById get(fn opening_by_id): map hasher(blake2_128_concat)
            T::OpeningId => JobOpening<T::BlockNumber, BalanceOfCurrency<T>>;

        /// Count of active workers.
        pub ActiveWorkerCount get(fn active_worker_count): u32;

        /// Maps identifier to worker application on opening.
        pub ApplicationById get(fn application_by_id) : map hasher(blake2_128_concat)
            T::ApplicationId => JobApplication<T>;

        /// Next identifier value for new worker application.
        pub NextApplicationId get(fn next_application_id) : T::ApplicationId;

        /// Next identifier for a new worker.
        pub NextWorkerId get(fn next_worker_id) : TeamWorkerId<T>;

        /// Maps identifier to corresponding worker.
        pub WorkerById get(fn worker_by_id) : map hasher(blake2_128_concat)
            TeamWorkerId<T> => TeamWorker<T>;

        /// Current team lead.
        pub CurrentLead get(fn current_lead) : Option<TeamWorkerId<T>>;
    }
}

decl_module! {
    /// _Working group_ substrate module.
    pub struct Module<T: Trait<I>, I: Instance> for enum Call where origin: T::Origin {
        /// Default deposit_event() handler
        fn deposit_event() = default;

        /// Predefined errors
        type Error = Error<T, I>;

        /// Exports const -  max simultaneous active worker number.
        const MaxWorkerNumberLimit: u32 = T::MaxWorkerNumberLimit::get();

        fn on_initialize() -> Weight{
            let mut workers_to_leave = Vec::new();
            WorkerById::<T, I>::iter().for_each(|(worker_id, worker)| {
                if let Some(started_leaving_at) = worker.started_leaving_at {
                    if started_leaving_at + worker.job_unstaking_period == Self::current_block(){
                        workers_to_leave.push((worker_id, worker));
                    }
                }
            });

            workers_to_leave.iter().for_each(|(worker_id, worker)| {
                Self::deactivate_worker(&worker_id, &worker, RawEvent::WorkerExited(*worker_id));
            });

            10_000_000 //TODO: adjust weight
        }

        /// Add a job opening for a regular worker/lead role.
        /// Require signed leader origin or the root (to add opening for the leader position).
        #[weight = 10_000_000] // TODO: adjust weight: it should also consider a description length
        pub fn add_opening(
            origin,
            description: Vec<u8>,
            opening_type: JobOpeningType,
            stake_policy: Option<StakePolicy<T::BlockNumber, BalanceOfCurrency<T>>>
        ){
            checks::ensure_origin_for_opening_type::<T, I>(origin, opening_type)?;

            checks::ensure_valid_stake_policy::<T, I>(&stake_policy)?;

            //
            // == MUTATION SAFE ==
            //

            let hashed_description = T::Hashing::hash(&description);

            // Create and add worker opening.
            let new_opening = JobOpening{
                opening_type,
                created: Self::current_block(),
                description_hash: hashed_description.as_ref().to_vec(),
                stake_policy
            };

            let new_opening_id = NextOpeningId::<T, I>::get();

            OpeningById::<T, I>::insert(new_opening_id, new_opening);

            // Update NextOpeningId
            NextOpeningId::<T, I>::mutate(|id| *id += <T::OpeningId as One>::one());

            Self::deposit_event(RawEvent::OpeningAdded(new_opening_id));
        }

        /// Apply on a worker opening.
        #[weight = 10_000_000] // TODO: adjust weight: it should also consider a description length
        pub fn apply_on_opening(
            origin,
            member_id: T::MemberId,
            opening_id: T::OpeningId,
            role_account_id: T::AccountId,
            staking_account_id: T::AccountId,
            description: Vec<u8>,
            stake: Option<BalanceOfCurrency<T>>,
        ) {
            // Ensure origin which will server as the source account for staked funds is signed.
            let source_account = ensure_signed(origin)?;

            // Ensure the source_account is either the controller or root account of member with given id.
            ensure!(
                membership::Module::<T>::ensure_member_controller_account(&source_account, &member_id).is_ok() ||
                membership::Module::<T>::ensure_member_root_account(&source_account, &member_id).is_ok(),
                Error::<T, I>::OriginIsNeitherMemberControllerOrRoot
            );

            // Ensure job opening exists.
            let opening = checks::ensure_opening_exists::<T, I>(&opening_id)?;

            // Ensure that there is sufficient balance to cover the proposed stake.
            checks::ensure_enough_balance_for_staking::<T, I>(&staking_account_id, &stake)?;

            // Ensure that proposed stake is enough for the opening.
            checks::ensure_application_stake_match_opening::<T, I>(&opening, &stake)?;

            // Checks external conditions for staking.
            if let Some(amount) = stake {
                T::StakingHandler::ensure_can_make_stake(&staking_account_id, amount)?;
            }

            //
            // == MUTATION SAFE ==
            //

            if let Some(amount) = stake {
                T::StakingHandler::lock(T::LockId::get(), &staking_account_id, amount);
            }

            let hashed_description = T::Hashing::hash(&description);

            // Make regular/lead application.
            let application = JobApplication::<T>::new(
                &role_account_id,
                &staking_account_id,
                &member_id,
                hashed_description.as_ref().to_vec(),
            );

            // Get id of new worker/lead application
            let new_application_id = NextApplicationId::<T, I>::get();

            // Store an application.
            ApplicationById::<T, I>::insert(new_application_id, application);

            // Update the next application identifier value.
            NextApplicationId::<T, I>::mutate(|id| *id += <T::ApplicationId as One>::one());

            // Trigger the event.
            Self::deposit_event(RawEvent::AppliedOnOpening(opening_id, new_application_id));
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
            if matches!(opening.opening_type, JobOpeningType::Leader) {
                ensure!(!<CurrentLead<T,I>>::exists(), Error::<T, I>::CannotHireLeaderWhenLeaderExists);
            }

            let checked_applications_info = checks::ensure_succesful_applications_exist::<T, I>(&successful_application_ids)?;

            // Check for a single application for a leader.
            if matches!(opening.opening_type, JobOpeningType::Leader) {
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
            worker_id: TeamWorkerId<T>,
            new_role_account_id: T::AccountId
        ) {
            // Ensuring worker actually exists
            let worker = checks::ensure_worker_exists::<T, I>(&worker_id)?;

            // Ensure that origin is signed by member with given id.
            checks::ensure_origin_signed_by_member::<T, I>(origin, &worker.member_id)?;

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
            worker_id: TeamWorkerId<T>,
        ) {
            // Ensure there is a signer which matches role account of worker corresponding to provided id.
            let worker = checks::ensure_worker_signed::<T, I>(origin, &worker_id)?;

            //
            // == MUTATION SAFE ==
            //

            if worker.job_unstaking_period == Zero::zero(){
                Self::deactivate_worker(&worker_id, &worker, RawEvent::WorkerExited(worker_id));
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
            worker_id: TeamWorkerId<T>,
            slash_stake: bool,
        ) {
            // Ensure lead is set or it is the council terminating the leader.
            let is_sudo = checks::ensure_origin_for_worker_operation::<T,I>(origin, worker_id)?;

            // Ensuring worker actually exists.
            let worker = checks::ensure_worker_exists::<T,I>(&worker_id)?;

            //
            // == MUTATION SAFE ==
            //

            if slash_stake {
                Self::slash(worker_id, &worker.staking_account_id, None)
            }

            // Trigger the event
            let event = if is_sudo {
                RawEvent::TerminatedLeader(worker_id)
            } else {
                RawEvent::TerminatedWorker(worker_id)
            };

            Self::deactivate_worker(&worker_id, &worker, event);
        }

        /// Slashes the regular worker stake, demands a leader origin. No limits, no actions on zero stake.
        /// If slashing balance greater than the existing stake - stake is slashed to zero.
        /// Requires signed leader origin or the root (to slash the leader stake).
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn slash_stake(origin, worker_id: TeamWorkerId<T>, balance: BalanceOfCurrency<T>) {
            // Ensure lead is set or it is the council slashing the leader.
            checks::ensure_origin_for_worker_operation::<T,I>(origin, worker_id)?;

            // Ensuring worker actually exists.
            let worker = checks::ensure_worker_exists::<T,I>(&worker_id)?;

            ensure!(balance != <BalanceOfCurrency<T>>::zero(), Error::<T, I>::StakeBalanceCannotBeZero);

            //
            // == MUTATION SAFE ==
            //

            Self::slash(worker_id, &worker.staking_account_id, Some(balance))
        }

        /// Decreases the regular worker/lead stake and returns the remainder to the
        /// worker staking_account_id. Can be decreased to zero, no actions on zero stake.
        /// Requires signed leader origin or the root (to decrease the leader stake).
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn decrease_stake(origin, worker_id: TeamWorkerId<T>, new_stake_balance: BalanceOfCurrency<T>) {
            // Ensure lead is set or it is the council decreasing the leader's stake.
            checks::ensure_origin_for_worker_operation::<T,I>(origin, worker_id)?;

            let worker = checks::ensure_worker_exists::<T,I>(&worker_id)?;

            ensure!(
                new_stake_balance != <BalanceOfCurrency<T>>::zero(),
                Error::<T, I>::StakeBalanceCannotBeZero
            );

            T::StakingHandler::ensure_can_decrease_stake(
                T::LockId::get(),
                &worker.staking_account_id,
                new_stake_balance,
            )?;

            //
            // == MUTATION SAFE ==
            //

            // This external module call both checks and mutates the state.
            T::StakingHandler::decrease_stake(
                T::LockId::get(),
                &worker.staking_account_id,
                new_stake_balance,
            )?;

            Self::deposit_event(RawEvent::StakeDecreased(worker_id, new_stake_balance));
        }

        /// Increases the regular worker/lead stake, demands a worker origin.
        /// Locks tokens from the worker staking_account_id equal to new stake. No limits on the stake.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn increase_stake(origin, worker_id: TeamWorkerId<T>, new_stake_balance: BalanceOfCurrency<T>) {
            // Checks worker origin and worker existence.
            let worker = checks::ensure_worker_signed::<T, I>(origin, &worker_id)?;

            ensure!(
                new_stake_balance != <BalanceOfCurrency<T>>::zero(),
                Error::<T, I>::StakeBalanceCannotBeZero
            );

            T::StakingHandler::ensure_can_increase_stake(
                T::LockId::get(),
                &worker.staking_account_id,
                new_stake_balance,
            )?;

            //
            // == MUTATION SAFE ==
            //

            // This external module call both checks and mutates the state.
            T::StakingHandler::increase_stake(
                T::LockId::get(),
                &worker.staking_account_id,
                new_stake_balance,
            )?;

            Self::deposit_event(RawEvent::StakeIncreased(worker_id, new_stake_balance));
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

            T::StakingHandler::unlock(T::LockId::get(), &application_info.application.staking_account_id);

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
    }
}

impl<T: Trait<I>, I: Instance> Module<T, I> {
    // Wrapper-function over system::block_number()
    fn current_block() -> T::BlockNumber {
        <system::Module<T>>::block_number()
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
        opening: &JobOpening<T::BlockNumber, BalanceOfCurrency<T>>,
        successful_applications_info: Vec<ApplicationInfo<T, I>>,
    ) -> BTreeMap<T::ApplicationId, TeamWorkerId<T>> {
        let mut application_id_to_worker_id = BTreeMap::new();

        successful_applications_info
            .iter()
            .for_each(|application_info| {
                let new_worker_id = Self::create_worker_by_application(&opening, &application_info);

                application_id_to_worker_id.insert(application_info.application_id, new_worker_id);

                // Sets a leader on successful opening when opening is for leader.
                if matches!(opening.opening_type, JobOpeningType::Leader) {
                    Self::set_lead(new_worker_id);
                }
            });

        application_id_to_worker_id
    }

    // Creates worker by the application. Deletes application from the storage.
    fn create_worker_by_application(
        opening: &JobOpening<T::BlockNumber, BalanceOfCurrency<T>>,
        application_info: &ApplicationInfo<T, I>,
    ) -> TeamWorkerId<T> {
        // Get worker id
        let new_worker_id = <NextWorkerId<T, I>>::get();

        // Construct worker
        let worker = TeamWorker::<T>::new(
            &application_info.application.member_id,
            &application_info.application.role_account_id,
            &application_info.application.staking_account_id,
            opening
                .stake_policy
                .as_ref()
                .map_or(Zero::zero(), |sp| sp.unstaking_period),
        );

        // Store a worker
        <WorkerById<T, I>>::insert(new_worker_id, worker);
        Self::increase_active_worker_counter();

        // Update next worker id
        <NextWorkerId<T, I>>::mutate(|id| *id += <TeamWorkerId<T> as One>::one());

        // Remove an application.
        <ApplicationById<T, I>>::remove(application_info.application_id);

        new_worker_id
    }

    // Set worker id as a leader id.
    pub(crate) fn set_lead(worker_id: TeamWorkerId<T>) {
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
    fn deactivate_worker(worker_id: &TeamWorkerId<T>, worker: &TeamWorker<T>, event: Event<T, I>) {
        // Unset lead if the leader is leaving.
        let leader_worker_id = <CurrentLead<T, I>>::get();
        if let Some(leader_worker_id) = leader_worker_id {
            if leader_worker_id == *worker_id {
                Self::unset_lead();
            }
        }

        // Remove the worker from the storage.
        WorkerById::<T, I>::remove(worker_id);
        Self::decrease_active_worker_counter();

        T::StakingHandler::unlock(T::LockId::get(), &worker.staking_account_id);

        Self::deposit_event(event);
    }

    // Slash the stake.
    fn slash(
        worker_id: TeamWorkerId<T>,
        staking_account_id: &T::AccountId,
        balance: Option<BalanceOfCurrency<T>>,
    ) {
        let slashed_balance =
            T::StakingHandler::slash(T::LockId::get(), staking_account_id, balance);
        Self::deposit_event(RawEvent::StakeSlashed(worker_id, slashed_balance));
    }
}
