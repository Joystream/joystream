// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

mod types;

use sr_primitives::traits::One;
use srml_support::traits::Currency;
use srml_support::{decl_module, decl_storage, dispatch, ensure};
use system::ensure_root;

use types::{Lead, LeadRoleState};

//TODO: convert messages to the decl_error! entries
pub static MSG_ORIGIN_IS_NOT_LEAD: &str = "Origin is not lead";
pub static MSG_CURRENT_LEAD_NOT_SET: &str = "Current lead is not set";
pub static MSG_CURRENT_LEAD_ALREADY_SET: &str = "Current lead is already set";
pub static MSG_IS_NOT_LEAD_ACCOUNT: &str = "Not a lead account";

/// Type identifier for lead role, which must be same as membership actor identifier
pub type LeadId<T> = <T as membership::members::Trait>::ActorId;

/// Type of minting reward relationship identifiers
pub type RewardRelationshipId<T> = <T as recurringrewards::Trait>::RewardRelationshipId;

/// Balance type of runtime
pub type BalanceOf<T> =
    <<T as stake::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

/// The bureaucracy main _Trait_
pub trait Trait<I: Instance>:
    system::Trait + recurringrewards::Trait + membership::members::Trait
{
}

decl_storage! {
    trait Store for Module<T: Trait<I>, I: Instance> as Bureaucracy {
        /// The current lead.
        pub CurrentLeadId get(current_lead_id) : Option<LeadId<T>>;

        /// Maps identifier to corresponding lead.
        pub LeadById get(lead_by_id): linked_map LeadId<T> => Lead<T::MemberId, T::AccountId, T::RewardRelationshipId, T::BlockNumber>;

        /// Next identifier for new current lead.
        pub NextLeadId get(next_lead_id): LeadId<T>;
    }
}

decl_module! {
    pub struct Module<T: Trait<I>, I: Instance> for enum Call where origin: T::Origin {
    /// Introduce a lead when one is not currently set.
    pub fn set_lead(origin, member: T::MemberId, role_account: T::AccountId) -> dispatch::Result {
        ensure_root(origin)?;

        // Ensure there is no current lead
        ensure!(
            <CurrentLeadId<T, I>>::get().is_none(),
            MSG_CURRENT_LEAD_ALREADY_SET
        );

        let new_lead_id = <NextLeadId<T, I>>::get();

        // Construct lead
        let new_lead = Lead {
            member_id: member,
            role_account,
            reward_relationship: None,
            inducted: <system::Module<T>>::block_number(),
            stage: LeadRoleState::Active,
        };

        // mutation

        // Store lead
        <LeadById<T, I>>::insert(new_lead_id, new_lead);

        // Update current lead
        <CurrentLeadId<T, I>>::put(new_lead_id);

        // Update next lead counter
        <NextLeadId<T, I>>::mutate(|id| *id += <LeadId<T> as One>::one());

        // Trigger event: TODO: create bureaucracy events
        //        Self::deposit_event(RawEvent::LeadSet(new_lead_id));

        Ok(())
    }
    }
}

impl<T: Trait<I>, I: Instance> Module<T, I> {
    /// Checks that provided lead account id belongs to the current bureaucracy leader
    pub fn ensure_is_lead_account(lead_account_id: T::AccountId) -> Result<(), &'static str> {
        // Ensure lead id is set
        let lead_id = Self::ensure_lead_id_set()?;

        // If so, grab actual lead
        let lead = <LeadById<T, I>>::get(lead_id);

        if lead.role_account != lead_account_id {
            return Err(MSG_IS_NOT_LEAD_ACCOUNT);
        }

        Ok(())
    }

    // checks that storage contains lead_id
    fn ensure_lead_id_set() -> Result<LeadId<T>, &'static str> {
        let opt_current_lead_id = <CurrentLeadId<T, I>>::get();

        if let Some(lead_id) = opt_current_lead_id {
            Ok(lead_id)
        } else {
            Err(MSG_CURRENT_LEAD_NOT_SET)
        }
    }
}
