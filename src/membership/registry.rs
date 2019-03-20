#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;
use parity_codec::Codec;
use parity_codec_derive::{Encode, Decode};
use srml_support::{StorageMap, StorageValue, dispatch, decl_module, decl_storage, decl_event, ensure, Parameter};
use srml_support::traits::{Currency};
use runtime_primitives::traits::{Zero, SimpleArithmetic, As, Member, MaybeSerializeDebug};
use system::{self, ensure_signed};
use crate::governance::{GovernanceCurrency, BalanceOf };
use runtime_io::print;
use {timestamp};
use crate::{VERSION};
use crate::traits;

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
const DEFAULT_MIN_HANDLE_LENGTH: u32 = 5;
const DEFAULT_MAX_HANDLE_LENGTH: u32 = 40;
const DEFAULT_MAX_AVATAR_URI_LENGTH: u32 = 1024;
const DEFAULT_MAX_ABOUT_TEXT_LENGTH: u32 = 2048;

//#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode)]
/// Stored information about a registered user
pub struct Profile<T: Trait> {
    pub id: T::MemberId,
    pub handle: Vec<u8>,
    pub avatar_uri: Vec<u8>,
    pub about: Vec<u8>,
    pub registered_at_block: T::BlockNumber,
    pub registered_at_time: T::Moment,
    pub entry: EntryMethod<T>,
    pub suspended: bool,
    pub subscription: Option<T::SubscriptionId>,
    pub sub_accounts: Vec<T::AccountId>
}

#[derive(Clone, Debug, Encode, Decode, PartialEq)]
/// Structure used to batch user configurable profile information when registering or updating info
pub struct UserInfo {
    pub handle: Option<Vec<u8>>,
    pub avatar_uri: Option<Vec<u8>>,
    pub about: Option<Vec<u8>>,
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
#[derive(Encode, Decode, Eq, PartialEq)]
pub struct PaidMembershipTerms<T: Trait> {
    /// Unique identifier - the term id
    pub id: T::PaidTermId,
    /// Quantity of native tokens which must be provably burned
    pub fee: BalanceOf<T>,
    /// String of capped length describing human readable conditions which are being agreed upon
    pub text: Vec<u8>
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
        /// Records at what runtime spec version the store was initialized. This allows the runtime
        /// to know when to run initialize code if it was installed as an update.
        pub StoreSpecVersion get(store_spec_version) build(|_| Some(VERSION.spec_version)) : Option<u32>;

        /// MemberId's start at this value
        pub FirstMemberId get(first_member_id) config(first_member_id): T::MemberId = T::MemberId::sa(DEFAULT_FIRST_MEMBER_ID);

        /// MemberId to assign to next member that is added to the registry
        pub NextMemberId get(next_member_id) build(|config: &GenesisConfig<T>| config.first_member_id): T::MemberId = T::MemberId::sa(DEFAULT_FIRST_MEMBER_ID);

        /// Mapping of member ids to their corresponding primary accountid
        pub AccountIdByMemberId get(account_id_by_member_id) : map T::MemberId => T::AccountId;

        /// Mapping of members' accountid ids to their member id.
        /// A member can have one primary account and multiple sub accounts associated with their profile
        pub MemberIdByAccountId get(member_id_by_account_id) : map T::AccountId => Option<T::MemberId>;

        /// Mapping of member's id to their membership profile
        // Value is Option<Profile> because it is not meaningful to have a Default value for Profile
        pub MemberProfile get(member_profile) : map T::MemberId => Option<Profile<T>>;

        /// Registered unique handles and their mapping to their owner
        pub Handles get(handles) : map Vec<u8> => Option<T::MemberId>;

        /// Next paid membership terms id
        pub NextPaidMembershipTermsId get(next_paid_membership_terms_id) : T::PaidTermId = T::PaidTermId::sa(FIRST_PAID_TERMS_ID);

        /// Paid membership terms record
        // Remember to add _genesis_phantom_data: std::marker::PhantomData{} to membership
        // genesis config if not providing config() or extra_genesis
        pub PaidMembershipTermsById get(paid_membership_terms_by_id) build(|config: &GenesisConfig<T>| {
            // This method only gets called when initializing storage, and is
            // compiled as native code. (Will be called when building `raw` chainspec)
            // So it can't be relied upon to initialize storage for runtimes updates.
            // Initialization for updated runtime is done in run_migration()
            let mut terms: PaidMembershipTerms<T> = Default::default();
            terms.fee = config.default_paid_membership_fee;
            vec![(terms.id, terms)]
        }) : map T::PaidTermId => Option<PaidMembershipTerms<T>>;

        /// Active Paid membership terms
        pub ActivePaidMembershipTerms get(active_paid_membership_terms) : Vec<T::PaidTermId> = vec![T::PaidTermId::sa(DEFAULT_PAID_TERM_ID)];

        /// Is the platform is accepting new members or not
        pub NewMembershipsAllowed get(new_memberships_allowed) : bool = true;

        // User Input Validation parameters - do these really need to be state variables
        // I don't see a need to adjust these in future?
        pub MinHandleLength get(min_handle_length) : u32 = DEFAULT_MIN_HANDLE_LENGTH;
        pub MaxHandleLength get(max_handle_length) : u32 = DEFAULT_MAX_HANDLE_LENGTH;
        pub MaxAvatarUriLength get(max_avatar_uri_length) : u32 = DEFAULT_MAX_AVATAR_URI_LENGTH;
        pub MaxAboutTextLength get(max_about_text_length) : u32 = DEFAULT_MAX_ABOUT_TEXT_LENGTH;
    }
    add_extra_genesis {
        config(default_paid_membership_fee): BalanceOf<T>;
    }
}

decl_event! {
    pub enum Event<T> where
      <T as system::Trait>::AccountId,
      <T as Trait>::MemberId {
        MemberRegistered(MemberId, AccountId),
        MemberUpdatedAboutText(MemberId),
        MemberUpdatedAvatar(MemberId),
        MemberUpdatedHandle(MemberId),
        MemberChangedPrimaryAccount(MemberId, AccountId),
        MemberAddedSubAccount(MemberId, AccountId),
        MemberRemovedSubAccount(MemberId, AccountId),
    }
}

impl<T: Trait> Module<T> {
    /// Initialization step that runs when the runtime is installed as a runtime upgrade
    /// Remember to remove this code in next release, or guard the code with the spec version
    // Given it is easy to forget to do this, we need a better arrangement.
    fn runtime_initialization(spec_version: u32) {
        if 5 == spec_version {
            print("Running New Runtime Init Code");
            let default_terms: PaidMembershipTerms<T> = Default::default();
            <PaidMembershipTermsById<T>>::insert(T::PaidTermId::sa(0), default_terms);
        }
    }
}

impl<T: Trait> traits::IsActiveMember<T> for Module<T> {
    fn is_active_member(who: &T::AccountId) -> bool {
        match Self::ensure_is_member(who)
            .and_then(|member_id| Self::ensure_profile(member_id))
        {
            Ok(profile) => !profile.suspended,
            Err(err) => false
        }
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        fn on_initialise(_now: T::BlockNumber) {
            if Self::store_spec_version().map_or(true, |spec_version| VERSION.spec_version > spec_version) {
                // Mark store version with latest so we don't run initialization code again
                <StoreSpecVersion<T>>::put(VERSION.spec_version);
                Self::runtime_initialization(VERSION.spec_version);
            }
        }

        fn on_finalise(_now: T::BlockNumber) {

        }

        /// Non-members can buy membership
        pub fn buy_membership(origin, paid_terms_id: T::PaidTermId, user_info: UserInfo) {
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

        pub fn change_member_about_text(origin, text: Vec<u8>) {
            let who = ensure_signed(origin)?;
            let member_id = Self::ensure_is_member_primary_account(who.clone())?;
            Self::_change_member_about_text(member_id, &text)?;
        }

        pub fn change_member_avatar(origin, uri: Vec<u8>) {
            let who = ensure_signed(origin)?;
            let member_id = Self::ensure_is_member_primary_account(who.clone())?;
            Self::_change_member_avatar(member_id, &uri)?;
        }

        /// Change member's handle.
        pub fn change_member_handle(origin, handle: Vec<u8>) {
            let who = ensure_signed(origin)?;
            let member_id = Self::ensure_is_member_primary_account(who.clone())?;
            Self::_change_member_handle(member_id, handle)?;
        }

        pub fn update_profile(origin, user_info: UserInfo) {
            let who = ensure_signed(origin)?;
            let member_id = Self::ensure_is_member_primary_account(who.clone())?;

            if let Some(uri) = user_info.avatar_uri {
                Self::_change_member_avatar(member_id, &uri)?;
            }
            if let Some(about) = user_info.about {
                Self::_change_member_about_text(member_id, &about)?;
            }
            if let Some(handle) = user_info.handle {
                Self::_change_member_handle(member_id, handle)?;
            }
        }

        // Notes:
        // Ability to change primary account and add/remove sub accounts should be restricted
        // to accounts that are not actively being used in other roles in the platform?
        // Other roles in the platform should be associated directly with member_id instead of an account_id,
        // but can still use a seprate account/key to sign extrinsics, have a seprate balance from primary account,
        // and a way to limit damage from a compromised sub account.
        // Maybe should also not be allowed if member is suspended?
        // Main usecase for changing primary account is for identity recoverability
        pub fn change_member_primary_account(origin, new_primary_account: T::AccountId) {
            let who = ensure_signed(origin)?;

            // only primary account can assign new primary account
            let member_id = Self::ensure_is_member_primary_account(who.clone())?;

            // ensure new_primary_account isn't already associated with any existing member
            Self::ensure_not_member(&new_primary_account)?;

            // update associated accounts
            <MemberIdByAccountId<T>>::remove(&who);
            <MemberIdByAccountId<T>>::insert(&new_primary_account, member_id);

            // update primary account
            <AccountIdByMemberId<T>>::insert(member_id, new_primary_account.clone());
            Self::deposit_event(RawEvent::MemberChangedPrimaryAccount(member_id, new_primary_account));
        }

        pub fn add_member_sub_account(origin, sub_account: T::AccountId) {
            let who = ensure_signed(origin)?;
            // only primary account can manage sub accounts
            let member_id = Self::ensure_is_member_primary_account(who.clone())?;
            // ensure sub_account isn't already associated with any existing member
            Self::ensure_not_member(&sub_account)?;

            let mut profile = Self::ensure_profile(member_id)?;
            profile.sub_accounts.push(sub_account.clone());
            <MemberProfile<T>>::insert(member_id, profile);
            <MemberIdByAccountId<T>>::insert(&sub_account, member_id);
            Self::deposit_event(RawEvent::MemberAddedSubAccount(member_id, sub_account));
        }

        pub fn remove_member_sub_account(origin, sub_account: T::AccountId) {
            let who = ensure_signed(origin)?;
            // only primary account can manage sub accounts
            let member_id = Self::ensure_is_member_primary_account(who.clone())?;

            // ensure account is a sub account
            // primary account cannot be added as a subaccount in add_member_sub_account()
            ensure!(who != sub_account, "not sub account");

            // ensure sub_account is associated with member
            let sub_account_member_id = Self::ensure_is_member(&sub_account)?;
            ensure!(member_id == sub_account_member_id, "not member sub account");

            let mut profile = Self::ensure_profile(member_id)?;

            profile.sub_accounts = profile.sub_accounts.into_iter().filter(|account| !(*account == sub_account)).collect();

            <MemberProfile<T>>::insert(member_id, profile);
            <MemberIdByAccountId<T>>::remove(&sub_account);
            Self::deposit_event(RawEvent::MemberRemovedSubAccount(member_id, sub_account));
        }
    }
}

impl<T: Trait> Module<T> {
    fn ensure_not_member(who: &T::AccountId) -> dispatch::Result {
        ensure!(!<MemberIdByAccountId<T>>::exists(who), "account already associated with a membership");
        Ok(())
    }

    fn ensure_is_member(who: &T::AccountId) -> Result<T::MemberId, &'static str> {
        let member_id = Self::member_id_by_account_id(who).ok_or("no member id found for accountid")?;
        Ok(member_id)
    }

    fn ensure_is_member_primary_account(who: T::AccountId) -> Result<T::MemberId, &'static str> {
        let member_id = Self::ensure_is_member(&who)?;
        ensure!(Self::account_id_by_member_id(member_id) == who, "not primary account");
        Ok(member_id)
    }

    fn ensure_profile(id: T::MemberId) -> Result<Profile<T>, &'static str> {
        let profile = Self::member_profile(&id).ok_or("member profile not found")?;
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

    fn validate_avatar(uri: &Vec<u8>) -> dispatch::Result {
        ensure!(uri.len() <= Self::max_avatar_uri_length() as usize, "avatar uri too long");
        Ok(())
    }

    /// Basic user input validation
    fn check_user_registration_info(user_info: UserInfo) -> Result<CheckedUserInfo, &'static str> {
        // Handle is required during registration
        let handle = user_info.handle.ok_or("handle must be provided during registration")?;
        Self::validate_handle(&handle)?;

        let about = Self::validate_text(&user_info.about.unwrap_or_default());
        let avatar_uri = user_info.avatar_uri.unwrap_or_default();
        Self::validate_avatar(&avatar_uri)?;

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
            sub_accounts: vec![],
        };

        <MemberIdByAccountId<T>>::insert(who.clone(), new_member_id);
        <AccountIdByMemberId<T>>::insert(new_member_id, who.clone());
        <MemberProfile<T>>::insert(new_member_id, profile);
        <Handles<T>>::insert(user_info.handle.clone(), new_member_id);
        <NextMemberId<T>>::mutate(|n| { *n += T::MemberId::sa(1); });

        new_member_id
    }

    fn _change_member_about_text (id: T::MemberId, text: &Vec<u8>) -> dispatch::Result {
        let mut profile = Self::ensure_profile(id)?;
        let text = Self::validate_text(text);
        profile.about = text;
        Self::deposit_event(RawEvent::MemberUpdatedAboutText(id));
        <MemberProfile<T>>::insert(id, profile);
        Ok(())
    }

    fn _change_member_avatar(id: T::MemberId, uri: &Vec<u8>) -> dispatch::Result {
        let mut profile = Self::ensure_profile(id)?;
        Self::validate_avatar(uri)?;
        profile.avatar_uri = uri.clone();
        Self::deposit_event(RawEvent::MemberUpdatedAvatar(id));
        <MemberProfile<T>>::insert(id, profile);
        Ok(())
    }

    fn _change_member_handle(id: T::MemberId, handle: Vec<u8>) -> dispatch::Result {
        let mut profile = Self::ensure_profile(id)?;
        Self::validate_handle(&handle)?;
        Self::ensure_unique_handle(&handle)?;
        <Handles<T>>::remove(&profile.handle);
        <Handles<T>>::insert(handle.clone(), id);
        profile.handle = handle;
        Self::deposit_event(RawEvent::MemberUpdatedHandle(id));
        <MemberProfile<T>>::insert(id, profile);
        Ok(())
    }
}