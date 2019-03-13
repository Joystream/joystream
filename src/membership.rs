#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;
use parity_codec::Codec;
use parity_codec_derive::{Encode, Decode};
use srml_support::{StorageMap, dispatch::Result, decl_module, decl_storage, decl_event, ensure, Parameter};
use srml_support::traits::{Currency};
use runtime_primitives::traits::{Zero, SimpleArithmetic, As, Member, MaybeSerializeDebug};
use system::{self, ensure_signed};
use crate::governance::{GovernanceCurrency, BalanceOf };

pub trait Trait: system::Trait + GovernanceCurrency {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type MemberId: Parameter + Member + SimpleArithmetic + Codec + Default + Copy + As<usize> + As<u64> + MaybeSerializeDebug;

    type PaidTermId: Parameter + Member + SimpleArithmetic + Codec + Default + Copy + As<usize> + As<u32> + MaybeSerializeDebug;

    type SubscriptionId: Parameter + Member + SimpleArithmetic + Codec + Default + Copy + As<usize> + As<u32> + MaybeSerializeDebug;
}

const FIRST_MEMBER_ID: u64 = 1;
const FIRST_PAID_TERMS_ID: u64 = 1;

// Default "implicit" paid terms
const DEFAULT_PAID_TERM_ID: u64 = 0;
const DEFAULT_PAID_TERM_FEE: u64 = 100;
const DEFAULT_PAID_TERM_TEXT: &str = "Default Paid Term TOS...";

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode)]
pub struct Profile<T: Trait> {
    id: T::MemberId, // is it necessary to have the id in the struct?
    handle: u32,
    avatarUri: Vec<u8>,
    description: Vec<u8>,
    added: T::BlockNumber,
    entry: EntryMethod<T>,
    suspended: bool,
    subscription: Option<T::SubscriptionId>
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode)]
pub enum EntryMethod<T: Trait> {
    Paid(T::PaidTermId),
    Screening(T::AccountId),
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode)]
pub struct PaidMembershipTerms<T: Trait> {
    /// Unique identifier - the term id
    id: T::PaidTermId, // is it necessary to have id in the struct?
    /// Quantity of native tokens which must be provably burned
    fee: BalanceOf<T>,
    /// String of capped length describing human readable conditions which are being agreed upon
    text: Vec<u8>
}

impl<T: Trait> Default for PaidMembershipTerms<T> {
    fn default() -> Self {
        PaidMembershipTerms {
            id: T::PaidTermId::sa(DEFAULT_PAID_TERM_ID),
            fee: BalanceOf::<T>::sa(DEFAULT_PAID_TERM_FEE),
            text: DEFAULT_PAID_TERM_TEXT.as_bytes().to_vec()
        }
    }
}

// TEST: do initial values and build methods get called for store items when the runtime is
// an upgrade? if not we need a differnet way to set them...
decl_storage! {
    trait Store for Module<T: Trait> as MembersipRegistry {
        FirstMemberId get(first_member_id) : T::MemberId = T::MemberId::sa(FIRST_MEMBER_ID);

        /// Id to assign to next member that is added to the registry
        NextMemberId get(next_member_id) : T::MemberId = T::MemberId::sa(FIRST_MEMBER_ID);

        /// Mapping of member ids to their corresponding accountid
        MembersById get(members_by_id) : map T::MemberId => T::AccountId;

        /// Mapping of members' accountid to their member id
        MemberByAccount get(members_by_account) : map T::AccountId => T::MemberId;

        /// Mapping of member's id to their membership profile
        // Value is Option<Profile> because it is not meaningful to have a Default value for Profile
        MemberProfile get(member_profile_preview) : map T::MemberId => Option<Profile<T>>;

        /// Next paid membership terms id - 1 reserved for initial terms, (avoid 0 -> default value)
        NextPaidMembershipTermsId get(next_paid_membership_terms_id) : T::PaidTermId = T::PaidTermId::sa(FIRST_PAID_TERMS_ID);

        /// Paid membership terms record
        PaidMembershipTermsById get(paid_membership_terms_by_id) : map T::PaidTermId => PaidMembershipTerms<T>;

        /// Active Paid membership terms
        ActivePaidMembershipTerms get(active_paid_membership_terms) : Vec<T::PaidTermId> = vec![T::PaidTermId::sa(DEFAULT_PAID_TERM_ID)];

        /// Is the platform is accepting new members or not
        PlatformAcceptingNewMemberships get(platform_accepting_new_memberships) : bool = true;
    }
}

decl_event! {
    pub enum Event<T> where
      <T as system::Trait>::AccountId,
      <T as Trait>::MemberId {
        MemberAdded(MemberId, AccountId),
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;
    }
}
