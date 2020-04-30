// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

mod types;

use sr_primitives::traits::EnsureOrigin;
use srml_support::{decl_event, decl_module, decl_storage, dispatch};
use system::{ensure_root, RawOrigin};

use types::Lead;

//TODO: convert messages to the decl_error! entries
pub static MSG_ORIGIN_IS_NOT_LEAD: &str = "Origin is not lead";
pub static MSG_CURRENT_LEAD_NOT_SET: &str = "Current lead is not set";
pub static MSG_CURRENT_LEAD_ALREADY_SET: &str = "Current lead is already set";
pub static MSG_IS_NOT_LEAD_ACCOUNT: &str = "Not a lead account";

/// Alias for the _Lead_ type
pub type LeadOf<T> =
    Lead<<T as membership::members::Trait>::MemberId, <T as system::Trait>::AccountId>;

/// The bureaucracy main _Trait_
pub trait Trait<I: Instance>: system::Trait + membership::members::Trait {
    /// Bureaucracy event type.
    type Event: From<Event<Self, I>> + Into<<Self as system::Trait>::Event>;
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
    }
}

decl_module! {
    pub struct Module<T: Trait<I>, I: Instance> for enum Call where origin: T::Origin {
        /// Default deposit_event() handler
        fn deposit_event() = default;

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
}
