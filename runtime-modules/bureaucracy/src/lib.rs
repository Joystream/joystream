// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

mod types;

use sr_primitives::traits::One;
use srml_support::traits::Currency;
use srml_support::{decl_module, decl_storage, dispatch, ensure};
use system::{self, ensure_signed};

use membership::role_types::{ActorInRole, Role};
use types::{Lead, LeadRoleState};

pub static MSG_CHANNEL_DESCRIPTION_TOO_SHORT: &str = "Channel description too short";
pub static MSG_CHANNEL_DESCRIPTION_TOO_LONG: &str = "Channel description too long";
pub static MSG_ORIGIN_IS_NOT_LEAD: &str = "Origin is not lead";
pub static MSG_CURRENT_LEAD_NOT_SET: &str = "Current lead is not set";
pub static MSG_CURRENT_LEAD_ALREADY_SET: &str = "Current lead is already set";

/// Type identifier for lead role, which must be same as membership actor identifier
pub type LeadId<T> = <T as membership::members::Trait>::ActorId;

/// Type of minting reward relationship identifiers
pub type RewardRelationshipId<T> = <T as recurringrewards::Trait>::RewardRelationshipId;

/// Balance type of runtime
pub type BalanceOf<T> =
    <<T as stake::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

pub trait Trait<I: Instance>:
    system::Trait + hiring::Trait + recurringrewards::Trait + membership::members::Trait
{
}

decl_storage! {
    trait Store for Module<T: Trait<I>, I: Instance> as Bureaucracy {
        /// The current lead.
        pub CurrentLeadId get(current_lead_id) : Option<LeadId<T>>;

        /// Maps identifier to corresponding lead.
        pub LeadById get(lead_by_id): linked_map LeadId<T> => Lead<T::AccountId, T::RewardRelationshipId, T::BlockNumber>;

        /// Next identifier for new current lead.
        pub NextLeadId get(next_lead_id): LeadId<T>;
    }
}

decl_module! {
    pub struct Module<T: Trait<I>, I: Instance> for enum Call where origin: T::Origin {

    }
}

impl<T: Trait<I>, I: Instance> Module<T, I> {
    /// Introduce a lead when one is not currently set.
    pub fn set_lead(member: T::MemberId, role_account: T::AccountId) -> dispatch::Result {
        // Ensure there is no current lead
        ensure!(
            <CurrentLeadId<T, I>>::get().is_none(),
            MSG_CURRENT_LEAD_ALREADY_SET
        );

        let new_lead_id = <NextLeadId<T, I>>::get();

        let new_lead_role = ActorInRole::new(Role::CuratorLead, new_lead_id);

        //
        // == MUTATION SAFE ==
        //

        // Register in role - will fail if member cannot become lead
        membership::members::Module::<T>::register_role_on_member(member, &new_lead_role)?;

        // Construct lead
        let new_lead = Lead {
            role_account: role_account.clone(),
            reward_relationship: None,
            inducted: <system::Module<T>>::block_number(),
            stage: LeadRoleState::Active,
        };

        // Store lead
        <LeadById<T, I>>::insert(new_lead_id, new_lead);

        // Update current lead
        <CurrentLeadId<T, I>>::put(new_lead_id); // Some(new_lead_id)

        // Update next lead counter
        <NextLeadId<T, I>>::mutate(|id| *id += <LeadId<T> as One>::one());

        // Trigger event
//        Self::deposit_event(RawEvent::LeadSet(new_lead_id));

        Ok(())
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
        let lead = <LeadById<T,I>>::get(lead_id);

        // and return both
        Ok((lead_id, lead))
    }

    fn ensure_lead_id_set() -> Result<LeadId<T>, &'static str> {
        let opt_current_lead_id = <CurrentLeadId<T, I>>::get();

        if let Some(lead_id) = opt_current_lead_id {
            Ok(lead_id)
        } else {
            Err(MSG_CURRENT_LEAD_NOT_SET)
        }
    }

    pub fn ensure_origin_is_set_lead(
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
}
