#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;
use parity_codec::Codec;
use parity_codec_derive::{Encode, Decode};
use srml_support::{StorageMap, StorageValue, dispatch, decl_module, decl_storage, decl_event, ensure, Parameter};
use srml_support::traits::{Currency};
use runtime_primitives::traits::{Zero, SimpleArithmetic, As, Member, MaybeSerializeDebug};
use system::{self, ensure_signed};
use crate::governance::{GovernanceCurrency, BalanceOf };
//use runtime_io::print;
use {timestamp};

pub trait Trait: system::Trait + GovernanceCurrency + timestamp::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type MemberId: Parameter + Member + SimpleArithmetic + Codec + Default + Copy
        + As<usize> + As<u64> + MaybeSerializeDebug + PartialEq;

    type PaidTermId: Parameter + Member + SimpleArithmetic + Codec + Default + Copy
        + As<usize> + As<u64> + MaybeSerializeDebug + PartialEq;

    type SubscriptionId: Parameter + Member + SimpleArithmetic + Codec + Default + Copy
        + As<usize> + As<u64> + MaybeSerializeDebug + PartialEq;
}

const DEFAULT_FIRST_MEMBER_ID: u64 = 1;
const FIRST_PAID_TERMS_ID: u64 = 1;

// Default paid membership terms
const DEFAULT_PAID_TERM_ID: u64 = 0;
const DEFAULT_PAID_TERM_FEE: u64 = 100; // Can be overidden in genesis config
const DEFAULT_PAID_TERM_TEXT: &str = "Default Paid Term TOS...";

// Default user info constraints
const DEFAULT_MIN_HANDLE_LENGTH: u32 = 4;
const DEFAULT_MAX_HANDLE_LENGTH: u32 = 20;
const DEFAULT_MAX_AVATAR_URI_LENGTH: u32 = 512;
const DEFAULT_MAX_ABOUT_TEXT_LENGTH: u32 = 1024;

//#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode)]
/// Stored information about a registered user
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

#[derive(Clone, Debug, Encode, Decode, PartialEq)]
/// Structure used to batch user configurable profile information when registering or updating info
pub struct UserInfo {
    handle: Option<Vec<u8>>,
    avatar_uri: Option<Vec<u8>>,
    about: Option<Vec<u8>>,
}

struct CheckedUserInfo {
    handle: Vec<u8>,
    avatar_uri: Vec<u8>,
    about: Vec<u8>,
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
        MemberIdByAccountId get(member_id_by_account_id) : map T::AccountId => Option<T::MemberId>;

        /// Mapping of member's id to their membership profile
        // Value is Option<Profile> because it is not meaningful to have a Default value for Profile
        MemberProfile get(member_profile) : map T::MemberId => Option<Profile<T>>;

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

        // User Input Validation parameters - do these really need to be state variables
        // I don't see a need to adjust these in future?
        MinHandleLength get(min_handle_length) : u32 = DEFAULT_MIN_HANDLE_LENGTH;
        MaxHandleLength get(max_handle_length) : u32 = DEFAULT_MAX_HANDLE_LENGTH;
        MaxAvatarUriLength get(max_avatar_uri_length) : u32 = DEFAULT_MAX_AVATAR_URI_LENGTH;
        MaxAboutTextLength get(max_about_text_length) : u32 = DEFAULT_MAX_ABOUT_TEXT_LENGTH;
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
        MemberUpdatedAboutText(MemberId),
        MemberUpdatedAvatar(MemberId),
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

        /// Non-members can buy membership
        fn buy_membership(origin, paid_terms_id: T::PaidTermId, user_info: UserInfo) {
            let who = ensure_signed(origin)?;

            // make sure we are accepting new memberships
            ensure!(Self::new_memberships_allowed(), "new members not allowed");

            // ensure key not associated with an existing membership
            Self::ensure_not_member(&who)?;

            // ensure paid_terms_id is active
            let terms = Self::ensure_active_terms_id(paid_terms_id)?;

            // ensure enough free balance to cover terms fees
            ensure!(T::Currency::can_slash(&who, terms.fee), "not enough balance to buy membership");

            let user_info = Self::check_user_registration_info(user_info)?;

            // ensure handle is not already registered
            Self::ensure_unique_handle(&user_info.handle)?;

            let _ = T::Currency::slash(&who, terms.fee);
            let member_id = Self::insert_new_paid_member(&who, paid_terms_id, &user_info);

            Self::deposit_event(RawEvent::MemberRegistered(member_id, who.clone()));
        }

        fn change_member_about_text(origin, text: Vec<u8>) {
            let who = ensure_signed(origin)?;
            Self::_change_member_about_text(&who, &text)?;
        }

        fn change_member_avatar(origin, uri: Vec<u8>) {
            let who = ensure_signed(origin)?;
            Self::_change_member_avatar(&who, &uri)?;
        }

        /// Change member's handle.
        fn change_member_handle(origin, handle: Vec<u8>) {
            let who = ensure_signed(origin)?;
            Self::_change_member_handle(&who, handle)?;
        }

        fn batch_change_member_profile(origin, user_info: UserInfo) {
            let who = ensure_signed(origin)?;
            user_info.avatar_uri.map(|uri| Self::_change_member_avatar(&who, &uri)).ok_or("uri not changed");
            user_info.about.map(|about| Self::_change_member_about_text(&who, &about)).ok_or("about text not changed");
            user_info.handle.map(|handle| Self::_change_member_handle(&who, handle)).ok_or("handle not changed");
        }

        /// Buy the default membership (if it is active) and only provide handle - for testing
        fn buy_default_membership_testing(origin, handle: Vec<u8>) {
            Self::buy_membership(origin, T::PaidTermId::sa(0), UserInfo {
                handle: Some(handle.clone()),
                avatar_uri: None,
                about: None
            })?;
        }
    }
}

impl<T: Trait> Module<T> {
    fn ensure_not_member(who: &T::AccountId) -> dispatch::Result {
        ensure!(!<MemberIdByAccountId<T>>::exists(who), "Account already associated with a membership");
        Ok(())
    }

    fn ensure_is_member(who: &T::AccountId) -> Result<T::MemberId, &'static str> {
        let member_id = Self::member_id_by_account_id(who).ok_or("no member id found for accountid")?;
        Ok(member_id)
    }

    fn ensure_has_profile(who: &T::AccountId) -> Result<Profile<T>, &'static str> {
        let member_id = Self::ensure_is_member(who)?;
        let profile = Self::member_profile(&member_id).ok_or("member profile not found")?;
        Ok(profile)
    }

    fn ensure_active_terms_id(terms_id: T::PaidTermId) -> Result<PaidMembershipTerms<T>, &'static str> {
        let active_terms = Self::active_paid_membership_terms();
        ensure!(active_terms.iter().any(|&id| id == terms_id), "paid terms id not active");
        let terms = Self::paid_membership_terms_by_id(terms_id).ok_or("paid membership term id does not exist")?;
        Ok(terms)
    }

    fn ensure_unique_handle(handle: &Vec<u8> ) -> dispatch::Result {
        ensure!(!<Handles<T>>::exists(handle), "handle already registered");
        Ok(())
    }

    fn validate_handle(handle: &Vec<u8>) -> dispatch::Result {
        ensure!(handle.len() >= Self::min_handle_length() as usize, "handle too short");
        ensure!(handle.len() <= Self::max_handle_length() as usize, "handle too long");
        Ok(())
    }

    fn validate_text(text: &Vec<u8>) -> Vec<u8> {
        let mut text = text.clone();
        text.truncate(Self::max_about_text_length() as usize);
        text
    }

    fn validate_avatar(uri: &Vec<u8>) -> Vec<u8> {
        let mut uri = uri.clone();
        uri.truncate(Self::max_avatar_uri_length() as usize);
        uri
    }

    /// Basic user input validation
    fn check_user_registration_info(user_info: UserInfo) -> Result<CheckedUserInfo, &'static str> {
        // Handle is required during registration
        let handle = user_info.handle.ok_or("handle must be provided during registration")?;
        Self::validate_handle(&handle)?;

        let about = Self::validate_text(&user_info.about.unwrap_or_default());
        let avatar_uri = Self::validate_avatar(&user_info.avatar_uri.unwrap_or_default());

        Ok(CheckedUserInfo {
            handle,
            avatar_uri,
            about,
        })
    }

    // Mutating methods

    fn insert_new_paid_member(who: &T::AccountId, paid_terms_id: T::PaidTermId, user_info: &CheckedUserInfo) -> T::MemberId {
        let new_member_id = Self::next_member_id();

        let profile: Profile<T> = Profile {
            id: new_member_id,
            handle: user_info.handle.clone(),
            avatar_uri: user_info.avatar_uri.clone(),
            about: user_info.about.clone(),
            registered_at_block: <system::Module<T>>::block_number(),
            registered_at_time: <timestamp::Module<T>>::now(),
            entry: EntryMethod::Paid(paid_terms_id),
            suspended: false,
            subscription: None,
        };

        <MemberIdByAccountId<T>>::insert(who.clone(), new_member_id);
        <AccountIdByMemberId<T>>::insert(new_member_id, who.clone());
        <MemberProfile<T>>::insert(new_member_id, profile);
        <Handles<T>>::insert(user_info.handle.clone(), new_member_id);
        <NextMemberId<T>>::mutate(|n| { *n += T::MemberId::sa(1); });

        new_member_id
    }

    fn _change_member_about_text (who: &T::AccountId, text: &Vec<u8>) -> dispatch::Result {
        let mut profile = Self::ensure_has_profile(&who)?;
        let text = Self::validate_text(text);
        profile.about = text;
        Self::deposit_event(RawEvent::MemberUpdatedAboutText(profile.id));
        <MemberProfile<T>>::insert(profile.id, profile);
        Ok(())
    }

    fn _change_member_avatar(who: &T::AccountId, uri: &Vec<u8>) -> dispatch::Result {
        let mut profile = Self::ensure_has_profile(who)?;
        let uri = Self::validate_avatar(uri);
        profile.avatar_uri = uri;
        Self::deposit_event(RawEvent::MemberUpdatedAvatar(profile.id));
        <MemberProfile<T>>::insert(profile.id, profile);
        Ok(())
    }

    fn _change_member_handle(who: &T::AccountId, handle: Vec<u8>) -> dispatch::Result {
        let mut profile = Self::ensure_has_profile(who)?;
        Self::validate_handle(&handle)?;
        Self::ensure_unique_handle(&handle)?;
        <Handles<T>>::remove(&profile.handle);
        <Handles<T>>::insert(handle.clone(), profile.id);
        profile.handle = handle;
        <MemberProfile<T>>::insert(profile.id, profile);
        Ok(())
    }
}