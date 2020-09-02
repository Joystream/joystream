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
use sp_std::collections::btree_set::BTreeSet;
// use sp_std::collections::{btree_map::BTreeMap, btree_set::BTreeSet};
// use sp_std::vec;
// use sp_std::vec::Vec;
use system::ensure_signed;
// use system::{ensure_root, ensure_signed};

use common::constraints::InputValidationLengthConstraint;

pub use errors::Error;
pub use types::{JobApplication, JobOpening, JobOpeningType};

// Type simplification
type JobApplicationRecord<T, I> =
    JobApplication<<T as system::Trait>::AccountId, <T as Trait<I>>::OpeningId, MemberId<T>>;

/// Member identifier in membership::member module.
pub type MemberId<T> = <T as membership::Trait>::MemberId;

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
    }
);

decl_storage! {
    trait Store for Module<T: Trait<I>, I: Instance> as Team {
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
            T::ApplicationId => JobApplicationRecord<T, I>;

        /// Next identifier value for new worker application.
        pub NextApplicationId get(fn next_application_id) : T::ApplicationId;

        /// Job application description text length limits.
        pub ApplicationDescriptionTextLimit get(fn application_description_text_limit):
            InputValidationLengthConstraint;
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
                is_active: true,
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
            let application = JobApplication::new(
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
}
