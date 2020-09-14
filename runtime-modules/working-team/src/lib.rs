//! # Working team pallet
//! Working team pallet for the Joystream platform.
//! Contains abstract working team workflow.
//!
//! Exact working group (eg.: forum working group) should create an instance of the Working group module.
//!
//! ## Supported extrinsics
//!
//! - [add_opening](./struct.Module.html#method.add_opening) - Add an opening for a regular worker/lead role.
//! - [apply_on_opening](./struct.Module.html#method.apply_on_opening) - Apply on a regular/lead opening.
//! - [fill_opening](./struct.Module.html#method.fill_opening) - Fill opening for regular worker/lead role.
//! - [update_role_account](./struct.Module.html#method.update_role_account) -  Update the role account of the worker/lead.
//! - [leave_role](./struct.Module.html#method.leave_role) - Leave the role by the active worker/lead.
//! - [terminate_role](./struct.Module.html#method.terminate_role) - Terminate the worker/lead role.

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
use frame_support::traits::Get;
use frame_support::{decl_event, decl_module, decl_storage, ensure, Parameter, StorageValue};
use sp_arithmetic::traits::{BaseArithmetic, One};
use sp_runtime::traits::{Hash, MaybeSerialize, Member};
use sp_std::collections::{btree_map::BTreeMap, btree_set::BTreeSet};
use system::ensure_signed;

pub use errors::Error;
use types::{ApplicationInfo, MemberId, TeamWorker, TeamWorkerId};
pub use types::{JobApplication, JobOpening, JobOpeningType, StakePolicy};

pub trait StakingHandler {}

/// The _Team_ main _Trait_
pub trait Trait<I: Instance>: system::Trait + membership::Trait + balances::Trait {
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

    //    type StakingHandler: StakingHandler;
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
    }
);

decl_storage! {
    trait Store for Module<T: Trait<I>, I: Instance> as WorkingTeam {
        /// Next identifier value for new job opening.
        pub NextOpeningId get(fn next_opening_id): T::OpeningId;

        /// Maps identifier to job opening.
        pub OpeningById get(fn opening_by_id): map hasher(blake2_128_concat)
            T::OpeningId => JobOpening<T::BlockNumber, T::Balance>;

        /// Count of active workers.
        pub ActiveWorkerCount get(fn active_worker_count): u32;

        /// Maps identifier to worker application on opening.
        pub ApplicationById get(fn application_by_id) : map hasher(blake2_128_concat)
            T::ApplicationId => JobApplication<T, I>;

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

        // ****************** Hiring flow **********************

        /// Add a job opening for a regular worker/lead role.
        /// Require signed leader origin or the root (to add opening for the leader position).
        #[weight = 10_000_000] // TODO: adjust weight: it should also consider a description length
        pub fn add_opening(
            origin,
            description: Vec<u8>,
            opening_type: JobOpeningType,
            stake_policy: Option<StakePolicy<T::BlockNumber, T::Balance>>
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
            description: Vec<u8>
        ) {
            // Ensure origin which will server as the source account for staked funds is signed
            let source_account = ensure_signed(origin)?;

            // Ensure the source_account is either the controller or root account of member with given id
            ensure!(
                membership::Module::<T>::ensure_member_controller_account(&source_account, &member_id).is_ok() ||
                membership::Module::<T>::ensure_member_root_account(&source_account, &member_id).is_ok(),
                Error::<T, I>::OriginIsNeitherMemberControllerOrRoot
            );

            // Ensure job opening exists.
            checks::ensure_opening_exists::<T, I>(&opening_id)?;

            //
            // == MUTATION SAFE ==
            //

            let hashed_description = T::Hashing::hash(&description);

            // Make regular/lead application.
            let application = JobApplication::<T, I>::new(
                &role_account_id,
                &opening_id,
                &member_id,
                hashed_description.as_ref().to_vec()
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
            checks::ensure_worker_signed::<T, I>(origin, &worker_id)?;

            //
            // == MUTATION SAFE ==
            //

            Self::deactivate_worker(&worker_id);

            Self::deposit_event(RawEvent::WorkerExited(worker_id));
        }

        /// Terminate the active worker by the lead.
        /// Require signed leader origin or the root (to terminate the leader role).
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn terminate_role(
            origin,
            worker_id: TeamWorkerId<T>,
        ) {
            // Ensure lead is set or it is the council terminating the leader.
            let is_sudo = checks::ensure_origin_for_terminate_worker::<T,I>(origin, worker_id)?;

            // Ensuring worker actually exists.
            checks::ensure_worker_exists::<T,I>(&worker_id)?;

            //
            // == MUTATION SAFE ==
            //

            Self::deactivate_worker(&worker_id);

            // Trigger the event
            let event = if is_sudo {
                RawEvent::TerminatedLeader(worker_id)
            } else {
                RawEvent::TerminatedWorker(worker_id)
            };

            Self::deposit_event(event);
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
        opening: &JobOpening<T::BlockNumber, T::Balance>,
        successful_applications_info: Vec<ApplicationInfo<T, I>>,
    ) -> BTreeMap<T::ApplicationId, TeamWorkerId<T>> {
        let mut application_id_to_worker_id = BTreeMap::new();

        successful_applications_info
            .iter()
            .for_each(|(application_id, application)| {
                // Get worker id
                let new_worker_id = <NextWorkerId<T, I>>::get();

                // Construct worker
                let worker =
                    TeamWorker::<T>::new(&application.member_id, &application.role_account_id);

                // Store a worker
                <WorkerById<T, I>>::insert(new_worker_id, worker);
                Self::increase_active_worker_counter();

                // Update next worker id
                <NextWorkerId<T, I>>::mutate(|id| *id += <TeamWorkerId<T> as One>::one());

                // Remove an application.
                <ApplicationById<T, I>>::remove(application_id);

                application_id_to_worker_id.insert(*application_id, new_worker_id);

                // Sets a leader on successful opening when opening is for leader.
                if matches!(opening.opening_type, JobOpeningType::Leader) {
                    Self::set_lead(new_worker_id);
                }
            });

        application_id_to_worker_id
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
    fn deactivate_worker(worker_id: &TeamWorkerId<T>) {
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
    }
}
