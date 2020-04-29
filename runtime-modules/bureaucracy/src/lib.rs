// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

mod constraints;
mod types;


use rstd::collections::btree_set::BTreeSet;
use rstd::vec::Vec;
use sr_primitives::traits::One;
use srml_support::traits::Currency;
use srml_support::{decl_module, decl_storage, dispatch, ensure};
use system::{ensure_root, ensure_signed};

use constraints::InputValidationLengthConstraint;
use membership::role_types::{ActorInRole, Role};
use types::{CuratorOpening, Lead, LeadRoleState, OpeningPolicyCommitment};

//TODO: convert messages to the decl_error! entries
pub static MSG_ORIGIN_IS_NOT_LEAD: &str = "Origin is not lead";
pub static MSG_CURRENT_LEAD_NOT_SET: &str = "Current lead is not set";
pub static MSG_CURRENT_LEAD_ALREADY_SET: &str = "Current lead is already set";
pub static MSG_IS_NOT_LEAD_ACCOUNT: &str = "Not a lead account";
pub static MSG_CHANNEL_DESCRIPTION_TOO_SHORT: &str = "Channel description too short";
pub static MSG_CHANNEL_DESCRIPTION_TOO_LONG: &str = "Channel description too long";

/// Alias for the _Lead_ type
pub type LeadOf<T> =
    Lead<<T as membership::members::Trait>::MemberId, <T as system::Trait>::AccountId>;

/// Type for the identifier for an opening for a curator.
pub type CuratorOpeningId<T> = <T as hiring::Trait>::OpeningId;

/// Type for the identifier for an application as a curator.
pub type CuratorApplicationId<T> = <T as hiring::Trait>::ApplicationId;

/// Balance type of runtime
pub type BalanceOf<T> =
    <<T as stake::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

/// The bureaucracy main _Trait_
pub trait Trait<I: Instance>:
    system::Trait + recurringrewards::Trait + membership::members::Trait + hiring::Trait
{
}

decl_event!(
    /// Proposals engine events
    pub enum Event<T, I>
    where
        <T as membership::members::Trait>::MemberId,
        <T as system::Trait>::AccountId
    {
        /// Emits on setting the leader.
        /// Params:
        /// - Member id of the leader.
        /// - Role account id of the leader.
        LeaderSet(MemberId, AccountId),
    }
);

decl_storage! {
    trait Store for Module<T: Trait<I>, I: Instance> as Bureaucracy {
        /// The current lead.

        pub CurrentLead get(current_lead) : Option<LeadOf<T>>;

        /// Next identifier value for new curator opening.
        pub NextCuratorOpeningId get(next_curator_opening_id): CuratorOpeningId<T>;

        /// Maps identifier to curator opening.
        pub CuratorOpeningById get(curator_opening_by_id): linked_map CuratorOpeningId<T> => CuratorOpening<T::OpeningId, T::BlockNumber, BalanceOf<T>, CuratorApplicationId<T>>;

        pub OpeningHumanReadableText get(opening_human_readable_text): InputValidationLengthConstraint;

    }
}

decl_module! {
    pub struct Module<T: Trait<I>, I: Instance> for enum Call where origin: T::Origin {
        /// Default deposit_event() handler
        fn deposit_event() = default;
            /// Add an opening for a curator role.
        pub fn add_curator_opening(origin, activate_at: hiring::ActivateOpeningAt<T::BlockNumber>, commitment: OpeningPolicyCommitment<T::BlockNumber, BalanceOf<T>>, human_readable_text: Vec<u8>)  {

            // Ensure lead is set and is origin signer
            Self::ensure_origin_is_set_lead(origin)?;

            Self::ensure_opening_human_readable_text_is_valid(&human_readable_text)?;

            // Add opening
            // NB: This call can in principle fail, because the staking policies
            // may not respect the minimum currency requirement.

            let policy_commitment = commitment.clone();

            // let opening_id = ensure_on_wrapped_error!(
            //     hiring::Module::<T>::add_opening(
            //         activate_at,
            //         commitment.max_review_period_length,
            //         commitment.application_rationing_policy,
            //         commitment.application_staking_policy,
            //         commitment.role_staking_policy,
            //         human_readable_text,
            //     ))?;

            let opening_id = hiring::Module::<T>::add_opening(
                activate_at,
                commitment.max_review_period_length,
                commitment.application_rationing_policy,
                commitment.application_staking_policy,
                commitment.role_staking_policy,
                human_readable_text,
            ).unwrap(); //TODO

            //
            // == MUTATION SAFE ==
            //

            let new_curator_opening_id = NextCuratorOpeningId::<T, I>::get();

            // Create and add curator opening.
            let new_opening_by_id = CuratorOpening::<CuratorOpeningId<T>, T::BlockNumber, BalanceOf<T>, CuratorApplicationId<T>> {
                opening_id : opening_id,
                curator_applications: BTreeSet::new(),
                policy_commitment: policy_commitment
            };

            CuratorOpeningById::<T, I>::insert(new_curator_opening_id, new_opening_by_id);

            // Update NextCuratorOpeningId
            NextCuratorOpeningId::<T, I>::mutate(|id| *id += <CuratorOpeningId<T> as One>::one());

            // Trigger event
            //Self::deposit_event(RawEvent::CuratorOpeningAdded(new_curator_opening_id));
    }


        /// Introduce a lead when one is not currently set.
        pub fn set_lead(origin, member_id: T::MemberId, role_account_id: T::AccountId) -> dispatch::Result {
            ensure_root(origin)?;

            // Construct lead
            let new_lead = Lead {
                member_id,
                role_account_id: role_account_id.clone(),
            };

            // mutation

            // Update current lead
            <CurrentLead<T, I>>::put(new_lead);

            // Trigger an event
            Self::deposit_event(RawEvent::LeaderSet(member_id, role_account_id));

            Ok(())
        }
}
}

impl<T: Trait<I>, I: Instance> Module<T, I> {
    /// Checks that provided lead account id belongs to the current bureaucracy leader
    pub fn ensure_is_lead_account(lead_account_id: T::AccountId) -> Result<(), &'static str> {
        let lead = <CurrentLead<T, I>>::get();

        if let Some(lead) = lead {
            if lead.role_account_id != lead_account_id {
                return Err(MSG_IS_NOT_LEAD_ACCOUNT);
            }
        } else {
            return Err(MSG_CURRENT_LEAD_NOT_SET);
        }

        Ok(())
    }
}

impl<Origin, T, I> EnsureOrigin<Origin> for Module<T, I>
where
    Origin: Into<Result<RawOrigin<T::AccountId>, Origin>> + From<RawOrigin<T::AccountId>>,
    T: Trait<I>,
    I: Instance,
{
    type Success = ();

    fn try_origin(o: Origin) -> Result<Self::Success, Origin> {
        o.into().and_then(|o| match o {
            RawOrigin::Signed(account_id) => {
                Self::ensure_is_lead_account(account_id).map_err(|_| RawOrigin::None.into())
            }
            _ => Err(RawOrigin::None.into()),
        })
    }

    fn ensure_opening_human_readable_text_is_valid(text: &Vec<u8>) -> dispatch::Result {
        <OpeningHumanReadableText<I>>::get().ensure_valid(
            text.len(),
            MSG_CHANNEL_DESCRIPTION_TOO_SHORT,
            MSG_CHANNEL_DESCRIPTION_TOO_LONG,
        )
    }

    fn ensure_origin_is_set_lead(
        origin: T::Origin,
    ) -> Result<
        (
            LeadId<T>,
            Lead<T::AccountId, T::RewardRelationshipId, T::BlockNumber>,
        ),
        &'static str,
    > {
        // Ensure lead is actually set
        let (lead_id, lead) = Self::ensure_lead_is_set()?;

        // Ensure is signed
        let signer = ensure_signed(origin)?;

        // Ensure signer is lead
        ensure!(signer == lead.role_account, MSG_ORIGIN_IS_NOT_LEAD);

        Ok((lead_id, lead))
    }

    pub fn ensure_lead_is_set() -> Result<
        (
            LeadId<T>,
            Lead<T::AccountId, T::RewardRelationshipId, T::BlockNumber>,
        ),
        &'static str,
    > {
        // Ensure lead id is set
        let lead_id = Self::ensure_lead_id_set()?;

        // If so, grab actual lead
        let lead = <LeadById<T, I>>::get(lead_id);

        // and return both
        Ok((lead_id, lead))
    }
}
