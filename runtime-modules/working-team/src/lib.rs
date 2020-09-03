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
//use frame_support::storage::IterableStorageMap;
//use frame_support::traits::{Currency, ExistenceRequirement, Get, Imbalance, WithdrawReasons};
use frame_support::traits::Get;
use frame_support::{decl_event, decl_module, decl_storage, ensure, Parameter, StorageValue}; // print,
use sp_arithmetic::traits::{BaseArithmetic, One};
use sp_runtime::traits::{Hash, MaybeSerialize, Member};
use sp_std::collections::{btree_map::BTreeMap, btree_set::BTreeSet};
// use sp_std::vec;
// use sp_std::vec::Vec;
use system::ensure_signed;
// use system::{ensure_root, ensure_signed};

use common::constraints::InputValidationLengthConstraint;

pub use errors::Error;
use types::{ApplicationInfo, TeamWorker, TeamWorkerId};
pub use types::{JobApplication, JobOpening, JobOpeningType};

/// The _Team_ main _Trait_
pub trait Trait<I: Instance>: system::Trait + membership::Trait {
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
}

decl_event!(
    /// _Team_ events
    pub enum Event<T, I>
    where
       <T as Trait<I>>::OpeningId,
       <T as Trait<I>>::ApplicationId,
       ApplicationIdToWorkerIdMap = BTreeMap<<T as Trait<I>>::ApplicationId, TeamWorkerId<T>>,
       TeamWorkerId = TeamWorkerId<T>
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
    }
);

decl_storage! {
    trait Store for Module<T: Trait<I>, I: Instance> as WorkingTeam {
        /// Next identifier value for new job opening.
        pub NextOpeningId get(fn next_opening_id): T::OpeningId;

        /// Maps identifier to job opening.
        pub OpeningById get(fn opening_by_id): map hasher(blake2_128_concat)
            T::OpeningId => JobOpening<T::BlockNumber, T::ApplicationId>;

        /// Count of active workers.
        pub ActiveWorkerCount get(fn active_worker_count): u32;

        /// Opening human readable text length limits.
        pub OpeningDescriptionTextLimit get(fn opening_description_text_limit):
            InputValidationLengthConstraint;

                /// Maps identifier to worker application on opening.
        pub ApplicationById get(fn application_by_id) : map hasher(blake2_128_concat)
            T::ApplicationId => JobApplication<T, I>;

        /// Next identifier value for new worker application.
        pub NextApplicationId get(fn next_application_id) : T::ApplicationId;

        /// Job application description text length limits.
        pub ApplicationDescriptionTextLimit get(fn application_description_text_limit):
            InputValidationLengthConstraint;

        /// Next identifier for a new worker.
        pub NextWorkerId get(fn next_worker_id) : TeamWorkerId<T>;

        /// Maps identifier to corresponding worker.
        pub WorkerById get(fn worker_by_id) : map hasher(blake2_128_concat)
            TeamWorkerId<T> => TeamWorker<T>;

        /// Current team lead.
        pub CurrentLead get(fn current_lead) : Option<TeamWorkerId<T>>;
    }
    add_extra_genesis {
        config(opening_description_constraint): InputValidationLengthConstraint;
        config(application_description_constraint): InputValidationLengthConstraint;
        build(|config: &GenesisConfig| {
            Module::<T, I>::initialize_working_group(
                config.opening_description_constraint,
                config.application_description_constraint,
            );
        });
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
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn add_opening(
            origin,
            description: Vec<u8>,
            opening_type: JobOpeningType,
        ){
            checks::ensure_origin_for_opening_type::<T, I>(origin, opening_type)?;

            checks::ensure_opening_description_is_valid::<T, I>(&description)?;

            // Self::ensure_opening_policy_commitment_is_valid(&commitment)?;


            //
            // == MUTATION SAFE ==
            //

           let hashed_description = T::Hashing::hash(&description);

            // Create and add worker opening.
            let new_opening = JobOpening{
                applications: BTreeSet::new(),
//                policy_commitment,
                opening_type,
                created: Self::current_block(),
                description_hash: hashed_description.as_ref().to_vec(),
            };

             let new_opening_id = NextOpeningId::<T, I>::get();

            OpeningById::<T, I>::insert(new_opening_id, new_opening);

            // Update NextOpeningId
            NextOpeningId::<T, I>::mutate(|id| *id += <T::OpeningId as One>::one());

            Self::deposit_event(RawEvent::OpeningAdded(new_opening_id));
        }

        /// Apply on a worker opening.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn apply_on_opening(
            origin,
            member_id: T::MemberId,
            opening_id: T::OpeningId,
            role_account_id: T::AccountId,
//            opt_role_stake_balance: Option<BalanceOf<T>>,
//            opt_application_stake_balance: Option<BalanceOf<T>>,
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
            let opening = checks::ensure_opening_exists::<T, I>(&opening_id)?;

            // // Ensure that there is sufficient balance to cover stake proposed
            // Self::ensure_can_make_stake_imbalance(
            //     vec![&opt_role_stake_balance, &opt_application_stake_balance],
            //     &source_account
            // )
            // .map_err(|_| Error::<T, I>::InsufficientBalanceToApply)?;

            // Ensure application text is valid
            checks::ensure_application_description_is_valid::<T, I>(&description)?;

            // // Ensure application can actually be added
            // ensure_on_wrapped_error!(
            //     hiring::Module::<T>::ensure_can_add_application(
            //         opening.hiring_opening_id,
            //         opt_role_stake_balance,
            //         opt_application_stake_balance)
            // )?;

            // Ensure member does not have an active application to this opening
            checks::ensure_member_has_no_active_application_on_opening::<T, I>(
                opening.applications,
                member_id
            )?;

            //
            // == MUTATION SAFE ==
            //

            // // Make imbalances for staking
            // let opt_role_stake_imbalance = Self::make_stake_opt_imbalance(&opt_role_stake_balance, &source_account);
            // let opt_application_stake_imbalance = Self::make_stake_opt_imbalance(&opt_application_stake_balance, &source_account);

            // Save member id to refund the stakes. This piece of date should outlive the 'worker'.
//            <MemberIdByHiringApplicationId<T, I>>::insert(hiring_application_id, member_id);

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

            // Add application to set of application in the job opening.
            OpeningById::<T, I>::mutate(opening_id, |opening| {
                opening.applications.insert(new_application_id);
            });

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
//            reward_policy: Option<RewardPolicy<minting::BalanceOf<T>, T::BlockNumber>>
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

            // Ensure a mint exists if lead is providing a reward for positions being filled
            // let create_reward_settings = if let Some(policy) = reward_policy {
            //
            //     // A reward will need to be created so ensure our configured mint exists
            //     let mint_id = Self::mint();
            //
            //     // Make sure valid parameters are selected for next payment at block number
            //     ensure!(policy.next_payment_at_block > <system::Module<T>>::block_number(),
            //         Error::<T, I>::FillOpeningInvalidNextPaymentBlock);
            //
            //     // The verified reward settings to use
            //     Some((mint_id, policy))
            // } else {
            //     None
            // };

            let checked_applications_info = checks::ensure_succesful_applications_exist::<T, I>(&successful_application_ids)?;

            // Check for a single application for a leader.
            if matches!(opening.opening_type, JobOpeningType::Leader) {
                ensure!(successful_application_ids.len() == 1, Error::<T, I>::CannotHireMultipleLeaders);
            }

            // // NB: Combined ensure check and mutation in hiring module
            // ensure_on_wrapped_error!(
            //     hiring::Module::<T>::fill_opening(
            //         opening.hiring_opening_id,
            //         successful_application_ids,
            //         opening.policy_commitment.fill_opening_successful_applicant_application_stake_unstaking_period,
            //         opening.policy_commitment.fill_opening_failed_applicant_application_stake_unstaking_period,
            //         opening.policy_commitment.fill_opening_failed_applicant_role_stake_unstaking_period
            //     )
            // )?;

            //
            // == MUTATION SAFE ==
            //

            // Process successful applications
            let application_id_to_worker_id = Self::fulfill_successful_applications(
                &opening,
                //create_reward_settings,
                checked_applications_info
            );

            // Remove the opening.
            <OpeningById::<T, I>>::remove(opening_id);

            // Trigger event
            Self::deposit_event(RawEvent::OpeningFilled(opening_id, application_id_to_worker_id));
        }
    }
}

impl<T: Trait<I>, I: Instance> Module<T, I> {
    // Initialize working group constraints and mint.
    pub(crate) fn initialize_working_group(
        opening_description_constraint: InputValidationLengthConstraint,
        application_description_constraint: InputValidationLengthConstraint,
    ) {
        // Create constraints
        <OpeningDescriptionTextLimit<I>>::put(opening_description_constraint);
        <ApplicationDescriptionTextLimit<I>>::put(application_description_constraint);
    }

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
        opening: &JobOpening<T::BlockNumber, T::ApplicationId>,
        //        reward_settings: Option<RewardSettings<T>>,
        successful_applications_info: Vec<ApplicationInfo<T, I>>,
    ) -> BTreeMap<T::ApplicationId, TeamWorkerId<T>> {
        let mut application_id_to_worker_id = BTreeMap::new();

        successful_applications_info
            .iter()
            .for_each(|(application_id, application)| {
                // // Create a reward relationship.
                // let reward_relationship = if let Some((mint_id, checked_policy)) =
                // reward_settings.clone()
                // {
                //     // Create a new recipient for the new relationship.
                //     let recipient = <recurringrewards::Module<T>>::add_recipient();
                //
                //     // Member must exist, since it was checked that it can enter the role.
                //     let member_profile =
                //         <membership::Module<T>>::membership(successful_application.member_id);
                //
                //     // Rewards are deposited in the member's root account.
                //     let reward_destination_account = member_profile.root_account;
                //
                //     // Values have been checked so this should not fail!
                //     let relationship_id = <recurringrewards::Module<T>>::add_reward_relationship(
                //         mint_id,
                //         recipient,
                //         reward_destination_account,
                //         checked_policy.amount_per_payout,
                //         checked_policy.next_payment_at_block,
                //         checked_policy.payout_interval,
                //     )
                //         .expect("Failed to create reward relationship!");
                //
                //     Some(relationship_id)
                // } else {
                //     None
                // };
                //
                // // Get possible stake for role
                // let application =
                //     hiring::ApplicationById::<T>::get(successful_application.hiring_application_id);
                //
                // // Staking profile for worker
                // let stake_profile = if let Some(ref stake_id) = application.active_role_staking_id {
                //     Some(RoleStakeProfile::new(
                //         stake_id,
                //         &opening
                //             .policy_commitment
                //             .terminate_role_stake_unstaking_period,
                //         &opening.policy_commitment.exit_role_stake_unstaking_period,
                //     ))
                // } else {
                //     None
                // };

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
}
