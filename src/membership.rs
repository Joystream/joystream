#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;
use parity_codec::Codec;
use parity_codec_derive::{Encode, Decode};
use srml_support::{StorageMap, StorageValue, dispatch::Result, decl_module, decl_storage, decl_event, ensure, Parameter};
use srml_support::traits::{Currency};
use runtime_primitives::traits::{Zero, SimpleArithmetic, As, Member, MaybeSerializeDebug};
use system::{self, ensure_signed};
use crate::governance::{GovernanceCurrency, BalanceOf };
//use runtime_io::print;
use {timestamp};

pub trait Trait: system::Trait + GovernanceCurrency + timestamp::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type MemberId: Parameter + Member + SimpleArithmetic + Codec + Default + Copy + As<usize> + As<u64> + MaybeSerializeDebug;

    type PaidTermId: Parameter + Member + SimpleArithmetic + Codec + Default + Copy + As<usize> + As<u32> + MaybeSerializeDebug;

    type SubscriptionId: Parameter + Member + SimpleArithmetic + Codec + Default + Copy + As<usize> + As<u32> + MaybeSerializeDebug;
}

const DEFAULT_FIRST_MEMBER_ID: u64 = 1;
const FIRST_PAID_TERMS_ID: u64 = 1;

// Default paid membership terms
const DEFAULT_PAID_TERM_ID: u64 = 0;
const DEFAULT_PAID_TERM_FEE: u64 = 100; // Can be overidden in genesis config
const DEFAULT_PAID_TERM_TEXT: &str = "Default Paid Term TOS...";

//#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode)]
pub struct Profile<T: Trait> {
    id: T::MemberId,
    handle: Vec<u8>,
    avatar_uri: Vec<u8>,
    about: Vec<u8>,
    registered_at_block: T::BlockNumber,
    registered_at_time: T::Moment,
    entry: EntryMethod<T>,
    suspended: bool,
    subscription: Option<T::SubscriptionId>
}

//#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode)]
pub enum EntryMethod<T: Trait> {
    Paid(T::PaidTermId),
    Screening(T::AccountId),
}

//#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode)]
pub struct PaidMembershipTerms<T: Trait> {
    /// Unique identifier - the term id
    id: T::PaidTermId,
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

decl_storage! {
    trait Store for Module<T: Trait> as Membership {
        /// MemberId's start at this value
        FirstMemberId get(first_member_id) config(first_member_id): T::MemberId = T::MemberId::sa(DEFAULT_FIRST_MEMBER_ID);

        /// MemberId to assign to next member that is added to the registry
        NextMemberId get(next_member_id) build(|config: &GenesisConfig<T>| config.first_member_id): T::MemberId = T::MemberId::sa(DEFAULT_FIRST_MEMBER_ID);

        /// Mapping of member ids to their corresponding accountid
        AccountIdByMemberId get(account_id_by_member_id) : map T::MemberId => T::AccountId;

        /// Mapping of members' accountid to their member id
        MemberIdByAccountId get(member_id_by_account_id) : map T::AccountId => T::MemberId;

        /// Mapping of member's id to their membership profile
        // Value is Option<Profile> because it is not meaningful to have a Default value for Profile
        MemberProfile get(member_profile_preview) : map T::MemberId => Option<Profile<T>>;

        /// Registered unique handles and their mapping to their owner
        Handles get(handles) : map Vec<u8> => Option<T::MemberId>;

        /// Next paid membership terms id
        NextPaidMembershipTermsId get(next_paid_membership_terms_id) : T::PaidTermId = T::PaidTermId::sa(FIRST_PAID_TERMS_ID);

        /// Paid membership terms record
        // Remember to add _genesis_phantom_data: std::marker::PhantomData{} to membership
        // genesis config if not providing config() or extra_genesis
        PaidMembershipTermsById get(paid_membership_terms_by_id) build(|config: &GenesisConfig<T>| {
            // This method only gets called when initializing storage, and is
            // compiled as native code. (Will be called when building `raw` chainspec)
            // So it can't be relied upon to initialize storage for runtimes updates.
            // Initialization for updated runtime is done in run_migration()
            let mut terms: PaidMembershipTerms<T> = Default::default();
            terms.fee = BalanceOf::<T>::sa(config.default_paid_membership_fee);
            vec![(terms.id, terms)]
        }) : map T::PaidTermId => Option<PaidMembershipTerms<T>>;

        /// Active Paid membership terms
        ActivePaidMembershipTerms get(active_paid_membership_terms) : Vec<T::PaidTermId> = vec![T::PaidTermId::sa(DEFAULT_PAID_TERM_ID)];

        /// Is the platform is accepting new members or not
        NewMembershipsAllowed get(new_memberships_allowed) : bool = true;

        /// If we should run a migration and initialize new storage values introduced in new runtime
        // This will initialize to false if starting at genesis (because the build() method will run),
        // for a runtime upgrade it will return the default value when reading the first time.
        ShouldRunMigration get(should_run_migration) build(|_| false) : bool = true;
    }
    add_extra_genesis {
        config(default_paid_membership_fee): u64;
    }
}

decl_event! {
    pub enum Event<T> where
      <T as system::Trait>::AccountId,
      <T as Trait>::MemberId {
        MemberRegistered(MemberId, AccountId),
    }
}

impl<T: Trait> Module<T> {
    fn run_migration() {
        if Self::should_run_migration() {
            let default_terms: PaidMembershipTerms<T> = Default::default();
            <PaidMembershipTermsById<T>>::insert(T::PaidTermId::sa(0), default_terms);
            <ShouldRunMigration<T>>::put(false);
        }
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        fn on_initialise(_now: T::BlockNumber) {
            Self::run_migration();
        }

        fn on_finalise(_now: T::BlockNumber) {

        }

    }
}
