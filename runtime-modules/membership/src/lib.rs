// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
// Clippy linter requirement.
// Disable it because of the substrate lib design
// Example:  pub PaidMembershipTermsById get(paid_membership_terms_by_id) build(|config: &GenesisConfig<T>| {}
#![allow(clippy::redundant_closure_call)]

pub mod genesis;
pub(crate) mod mock;
mod tests;

use codec::{Codec, Decode, Encode};
use frame_support::traits::Currency;
use frame_support::{decl_event, decl_module, decl_storage, ensure, Parameter};
use sp_arithmetic::traits::{BaseArithmetic, One};
use sp_runtime::traits::{MaybeSerialize, Member};
use sp_std::borrow::ToOwned;
use sp_std::vec;
use sp_std::vec::Vec;
use system::{ensure_root, ensure_signed};

use common::currency::{BalanceOf, GovernanceCurrency};

//TODO: Convert errors to the Substrate decl_error! macro.
/// Result with string error message. This exists for backward compatibility purpose.
pub type DispatchResult = Result<(), &'static str>;

pub trait Trait: system::Trait + GovernanceCurrency + pallet_timestamp::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type MemberId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    type PaidTermId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    type SubscriptionId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    /// Describes the common type for the working group members (workers).
    type ActorId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + Ord;
}

const FIRST_PAID_TERMS_ID: u8 = 1;

// Default paid membership terms
pub const DEFAULT_PAID_TERM_ID: u8 = 0;

// Default user info constraints
const DEFAULT_MIN_HANDLE_LENGTH: u32 = 5;
const DEFAULT_MAX_HANDLE_LENGTH: u32 = 40;
const DEFAULT_MAX_AVATAR_URI_LENGTH: u32 = 1024;
const DEFAULT_MAX_ABOUT_TEXT_LENGTH: u32 = 2048;

/// Public membership object alias.
pub type Membership<T> = MembershipObject<
    <T as system::Trait>::BlockNumber,
    <T as pallet_timestamp::Trait>::Moment,
    <T as Trait>::PaidTermId,
    <T as Trait>::SubscriptionId,
    <T as system::Trait>::AccountId,
>;

#[derive(Encode, Decode, Default)]
/// Stored information about a registered user
pub struct MembershipObject<BlockNumber, Moment, PaidTermId, SubscriptionId, AccountId> {
    /// The unique handle chosen by member
    pub handle: Vec<u8>,

    /// A Url to member's Avatar image
    pub avatar_uri: Vec<u8>,

    /// Short text chosen by member to share information about themselves
    pub about: Vec<u8>,

    /// Block number when member was registered
    pub registered_at_block: BlockNumber,

    /// Timestamp when member was registered
    pub registered_at_time: Moment,

    /// How the member was registered
    pub entry: EntryMethod<PaidTermId, AccountId>,

    /// Whether the member is suspended or not.
    pub suspended: bool,

    /// The type of subscription the member has purchased if any.
    pub subscription: Option<SubscriptionId>,

    /// Member's root account id. Only the root account is permitted to set a new root account
    /// and update the controller account. Other modules may only allow certain actions if
    /// signed with root account. It is intended to be an account that can remain offline and
    /// potentially hold a member's funds, and be a source for staking roles.
    pub root_account: AccountId,

    /// Member's controller account id. This account is intended to be used by
    /// a member to act under their identity in other modules. It will usually be used more
    /// online and will have less funds in its balance.
    pub controller_account: AccountId,
}

// Contains valid or default user details
struct ValidatedUserInfo {
    handle: Vec<u8>,
    avatar_uri: Vec<u8>,
    about: Vec<u8>,
}

#[derive(Encode, Decode, Debug, PartialEq)]
pub enum EntryMethod<PaidTermId, AccountId> {
    Paid(PaidTermId),
    Screening(AccountId),
    Genesis,
}

/// Must be default constructible because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl<PaidTermId, AccountId> Default for EntryMethod<PaidTermId, AccountId> {
    fn default() -> Self {
        Self::Genesis
    }
}

#[derive(Encode, Decode, Eq, PartialEq, Default)]
pub struct PaidMembershipTerms<Balance> {
    /// Quantity of native tokens which must be provably burned
    pub fee: Balance,
    /// String of capped length describing human readable conditions which are being agreed upon
    pub text: Vec<u8>,
}

decl_storage! {
    trait Store for Module<T: Trait> as Membership {
        /// MemberId to assign to next member that is added to the registry, and is also the
        /// total number of members created. MemberIds start at Zero.
        pub NextMemberId get(fn members_created) : T::MemberId;

        /// Mapping of member's id to their membership profile
        pub MembershipById get(fn membership) : map hasher(blake2_128_concat)
            T::MemberId => Membership<T>;

        /// Mapping of a root account id to vector of member ids it controls.
        pub(crate) MemberIdsByRootAccountId : map hasher(blake2_128_concat)
            T::AccountId => Vec<T::MemberId>;

        /// Mapping of a controller account id to vector of member ids it controls
        pub(crate) MemberIdsByControllerAccountId : map hasher(blake2_128_concat)
            T::AccountId => Vec<T::MemberId>;

        /// Registered unique handles and their mapping to their owner
        pub MemberIdByHandle get(fn handles) : map hasher(blake2_128_concat)
            Vec<u8> => T::MemberId;

        /// Next paid membership terms id
        pub NextPaidMembershipTermsId get(fn next_paid_membership_terms_id) :
            T::PaidTermId = T::PaidTermId::from(FIRST_PAID_TERMS_ID);

        /// Paid membership terms record
        // Remember to add _genesis_phantom_data: std::marker::PhantomData{} to membership
        // genesis config if not providing config() or extra_genesis
        pub PaidMembershipTermsById get(fn paid_membership_terms_by_id) build(|config: &GenesisConfig<T>| {
            // This method only gets called when initializing storage, and is
            // compiled as native code. (Will be called when building `raw` chainspec)
            // So it can't be relied upon to initialize storage for runtimes updates.
            // Initialization for updated runtime is done in run_migration()
            let terms = PaidMembershipTerms {
                fee:  config.default_paid_membership_fee,
                text: Vec::default(),
            };
            vec![(T::PaidTermId::from(DEFAULT_PAID_TERM_ID), terms)]
        }) : map hasher(blake2_128_concat) T::PaidTermId => PaidMembershipTerms<BalanceOf<T>>;

        /// Active Paid membership terms
        pub ActivePaidMembershipTerms get(fn active_paid_membership_terms) :
            Vec<T::PaidTermId> = vec![T::PaidTermId::from(DEFAULT_PAID_TERM_ID)];

        /// Is the platform is accepting new members or not
        pub NewMembershipsAllowed get(fn new_memberships_allowed) : bool = true;

        pub ScreeningAuthority get(fn screening_authority) : T::AccountId;

        // User Input Validation parameters - do these really need to be state variables
        // I don't see a need to adjust these in future?
        pub MinHandleLength get(fn min_handle_length) : u32 = DEFAULT_MIN_HANDLE_LENGTH;
        pub MaxHandleLength get(fn max_handle_length) : u32 = DEFAULT_MAX_HANDLE_LENGTH;
        pub MaxAvatarUriLength get(fn max_avatar_uri_length) : u32 = DEFAULT_MAX_AVATAR_URI_LENGTH;
        pub MaxAboutTextLength get(fn max_about_text_length) : u32 = DEFAULT_MAX_ABOUT_TEXT_LENGTH;

    }
    add_extra_genesis {
        config(default_paid_membership_fee): BalanceOf<T>;
        config(members) : Vec<(T::AccountId, String, String, String)>;
        build(|config: &GenesisConfig<T>| {
            for (who, handle, avatar_uri, about) in &config.members {
                let user_info = ValidatedUserInfo {
                    handle: handle.clone().into_bytes(),
                    avatar_uri: avatar_uri.clone().into_bytes(),
                    about: about.clone().into_bytes()
                };

                <Module<T>>::insert_member(&who, &user_info, EntryMethod::Genesis);
            }
        });
    }
}

decl_event! {
    pub enum Event<T> where
      <T as system::Trait>::AccountId,
      <T as Trait>::MemberId,
    {
        MemberRegistered(MemberId, AccountId),
        MemberUpdatedAboutText(MemberId),
        MemberUpdatedAvatar(MemberId),
        MemberUpdatedHandle(MemberId),
        MemberSetRootAccount(MemberId, AccountId),
        MemberSetControllerAccount(MemberId, AccountId),
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event() = default;

        /// Non-members can buy membership
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn buy_membership(
            origin,
            paid_terms_id: T::PaidTermId,
            handle: Option<Vec<u8>>,
            avatar_uri: Option<Vec<u8>>,
            about: Option<Vec<u8>>
        ) {
            let who = ensure_signed(origin)?;

            // make sure we are accepting new memberships
            ensure!(Self::new_memberships_allowed(), "new members not allowed");

            // ensure paid_terms_id is active
            let terms = Self::ensure_active_terms_id(paid_terms_id)?;

            // ensure enough free balance to cover terms fees
            ensure!(T::Currency::can_slash(&who, terms.fee), "not enough balance to buy membership");

            let user_info = Self::check_user_registration_info(handle, avatar_uri, about)?;

            // ensure handle is not already registered
            Self::ensure_unique_handle(&user_info.handle)?;

            let _ = T::Currency::slash(&who, terms.fee);
            let member_id = Self::insert_member(&who, &user_info, EntryMethod::Paid(paid_terms_id));

            Self::deposit_event(RawEvent::MemberRegistered(member_id, who));
        }

        /// Change member's about text
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn change_member_about_text(origin, member_id: T::MemberId, text: Vec<u8>) {
            let sender = ensure_signed(origin)?;

            let membership = Self::ensure_membership(member_id)?;

            ensure!(membership.controller_account == sender, "only controller account can update member about text");

            Self::_change_member_about_text(member_id, &text)?;
        }

        /// Change member's avatar
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn change_member_avatar(origin, member_id: T::MemberId, uri: Vec<u8>) {
            let sender = ensure_signed(origin)?;

            let membership = Self::ensure_membership(member_id)?;

            ensure!(membership.controller_account == sender, "only controller account can update member avatar");

            Self::_change_member_avatar(member_id, &uri)?;
        }

        /// Change member's handle. Will ensure new handle is unique and old one will be available
        /// for other members to use.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn change_member_handle(origin, member_id: T::MemberId, handle: Vec<u8>) {
            let sender = ensure_signed(origin)?;

            let membership = Self::ensure_membership(member_id)?;

            ensure!(membership.controller_account == sender, "only controller account can update member handle");

            Self::_change_member_handle(member_id, handle)?;
        }

        /// Update member's all or some of handle, avatar and about text.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_membership(
            origin,
            member_id: T::MemberId,
            handle: Option<Vec<u8>>,
            avatar_uri: Option<Vec<u8>>,
            about: Option<Vec<u8>>
        ) {
            let sender = ensure_signed(origin)?;

            let membership = Self::ensure_membership(member_id)?;

            ensure!(membership.controller_account == sender, "only controller account can update member info");

            if let Some(uri) = avatar_uri {
                Self::_change_member_avatar(member_id, &uri)?;
            }
            if let Some(about) = about {
                Self::_change_member_about_text(member_id, &about)?;
            }
            if let Some(handle) = handle {
                Self::_change_member_handle(member_id, handle)?;
            }
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn set_controller_account(origin, member_id: T::MemberId, new_controller_account: T::AccountId) {
            let sender = ensure_signed(origin)?;

            let mut membership = Self::ensure_membership(member_id)?;

            ensure!(membership.root_account == sender, "only root account can set new controller account");

            // only update if new_controller_account is different than current one
            if membership.controller_account != new_controller_account {
                <MemberIdsByControllerAccountId<T>>::mutate(&membership.controller_account, |ids| {
                    ids.retain(|id| *id != member_id);
                });

                <MemberIdsByControllerAccountId<T>>::mutate(&new_controller_account, |ids| {
                    ids.push(member_id);
                });

                membership.controller_account = new_controller_account.clone();
                <MembershipById<T>>::insert(member_id, membership);
                Self::deposit_event(RawEvent::MemberSetControllerAccount(member_id, new_controller_account));
            }
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn set_root_account(origin, member_id: T::MemberId, new_root_account: T::AccountId) {
            let sender = ensure_signed(origin)?;

            let mut membership = Self::ensure_membership(member_id)?;

            ensure!(membership.root_account == sender, "only root account can set new root account");

            // only update if new root account is different than current one
            if membership.root_account != new_root_account {
                <MemberIdsByRootAccountId<T>>::mutate(&membership.root_account, |ids| {
                    ids.retain(|id| *id != member_id);
                });

                <MemberIdsByRootAccountId<T>>::mutate(&new_root_account, |ids| {
                    ids.push(member_id);
                });

                membership.root_account = new_root_account.clone();
                Self::deposit_event(RawEvent::MemberSetRootAccount(member_id, new_root_account));
            }
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn add_screened_member(
            origin,
            new_member_account: T::AccountId,
            handle: Option<Vec<u8>>,
            avatar_uri: Option<Vec<u8>>,
            about: Option<Vec<u8>>
        ) {
            // ensure sender is screening authority
            let sender = ensure_signed(origin)?;

            if <ScreeningAuthority<T>>::exists() {
                ensure!(sender == Self::screening_authority(), "not screener");
            } else {
                // no screening authority defined. Cannot accept this request
                return Err("no screening authority defined".into());
            }

            // make sure we are accepting new memberships
            ensure!(Self::new_memberships_allowed(), "new members not allowed");

            let user_info = Self::check_user_registration_info(handle, avatar_uri, about)?;

            // ensure handle is not already registered
            Self::ensure_unique_handle(&user_info.handle)?;

            let member_id = Self::insert_member(&new_member_account, &user_info, EntryMethod::Screening(sender));

            Self::deposit_event(RawEvent::MemberRegistered(member_id, new_member_account));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn set_screening_authority(origin, authority: T::AccountId) {
            ensure_root(origin)?;
            <ScreeningAuthority<T>>::put(authority);
        }
    }
}

/// Reason why a given member id does not have a given account as the controller account.
pub enum ControllerAccountForMemberCheckFailed {
    NotMember,
    NotControllerAccount,
}

pub enum MemberControllerAccountDidNotSign {
    UnsignedOrigin,
    MemberIdInvalid,
    SignerControllerAccountMismatch,
}

pub enum MemberControllerAccountMismatch {
    MemberIdInvalid,
    SignerControllerAccountMismatch,
}
pub enum MemberRootAccountMismatch {
    MemberIdInvalid,
    SignerRootAccountMismatch,
}

impl<T: Trait> Module<T> {
    /// Provided that the member_id exists return its membership. Returns error otherwise.
    pub fn ensure_membership(id: T::MemberId) -> Result<Membership<T>, &'static str> {
        if <MembershipById<T>>::contains_key(&id) {
            Ok(Self::membership(&id))
        } else {
            Err("member profile not found")
        }
    }

    /// Ensure that given member has given account as the controller account
    pub fn ensure_is_controller_account_for_member(
        member_id: &T::MemberId,
        account: &T::AccountId,
    ) -> Result<Membership<T>, ControllerAccountForMemberCheckFailed> {
        if MembershipById::<T>::contains_key(member_id) {
            let membership = MembershipById::<T>::get(member_id);

            if membership.controller_account == *account {
                Ok(membership)
            } else {
                Err(ControllerAccountForMemberCheckFailed::NotControllerAccount)
            }
        } else {
            Err(ControllerAccountForMemberCheckFailed::NotMember)
        }
    }

    /// Returns true if account is either a member's root or controller account
    pub fn is_member_account(who: &T::AccountId) -> bool {
        <MemberIdsByRootAccountId<T>>::contains_key(who)
            || <MemberIdsByControllerAccountId<T>>::contains_key(who)
    }

    fn ensure_active_terms_id(
        terms_id: T::PaidTermId,
    ) -> Result<PaidMembershipTerms<BalanceOf<T>>, &'static str> {
        let active_terms = Self::active_paid_membership_terms();
        ensure!(
            active_terms.iter().any(|&id| id == terms_id),
            "paid terms id not active"
        );

        if <PaidMembershipTermsById<T>>::contains_key(terms_id) {
            Ok(Self::paid_membership_terms_by_id(terms_id))
        } else {
            Err("paid membership term id does not exist")
        }
    }

    #[allow(clippy::ptr_arg)] // cannot change to the "&[u8]" suggested by clippy
    fn ensure_unique_handle(handle: &Vec<u8>) -> DispatchResult {
        ensure!(
            !<MemberIdByHandle<T>>::contains_key(handle),
            "handle already registered"
        );
        Ok(())
    }

    fn validate_handle(handle: &[u8]) -> DispatchResult {
        ensure!(
            handle.len() >= Self::min_handle_length() as usize,
            "handle too short"
        );
        ensure!(
            handle.len() <= Self::max_handle_length() as usize,
            "handle too long"
        );
        Ok(())
    }

    fn validate_text(text: &[u8]) -> Vec<u8> {
        let mut text = text.to_owned();
        text.truncate(Self::max_about_text_length() as usize);
        text
    }

    fn validate_avatar(uri: &[u8]) -> DispatchResult {
        ensure!(
            uri.len() <= Self::max_avatar_uri_length() as usize,
            "avatar uri too long"
        );
        Ok(())
    }

    /// Basic user input validation
    fn check_user_registration_info(
        handle: Option<Vec<u8>>,
        avatar_uri: Option<Vec<u8>>,
        about: Option<Vec<u8>>,
    ) -> Result<ValidatedUserInfo, &'static str> {
        // Handle is required during registration
        let handle = handle.ok_or("handle must be provided during registration")?;
        Self::validate_handle(&handle)?;

        let about = Self::validate_text(&about.unwrap_or_default());
        let avatar_uri = avatar_uri.unwrap_or_default();
        Self::validate_avatar(&avatar_uri)?;

        Ok(ValidatedUserInfo {
            handle,
            avatar_uri,
            about,
        })
    }

    fn insert_member(
        who: &T::AccountId,
        user_info: &ValidatedUserInfo,
        entry_method: EntryMethod<T::PaidTermId, T::AccountId>,
    ) -> T::MemberId {
        let new_member_id = Self::members_created();

        let membership: Membership<T> = MembershipObject {
            handle: user_info.handle.clone(),
            avatar_uri: user_info.avatar_uri.clone(),
            about: user_info.about.clone(),
            registered_at_block: <system::Module<T>>::block_number(),
            registered_at_time: <pallet_timestamp::Module<T>>::now(),
            entry: entry_method,
            suspended: false,
            subscription: None,
            root_account: who.clone(),
            controller_account: who.clone(),
        };

        <MemberIdsByRootAccountId<T>>::mutate(who, |ids| {
            ids.push(new_member_id);
        });
        <MemberIdsByControllerAccountId<T>>::mutate(who, |ids| {
            ids.push(new_member_id);
        });

        <MembershipById<T>>::insert(new_member_id, membership);
        <MemberIdByHandle<T>>::insert(user_info.handle.clone(), new_member_id);
        <NextMemberId<T>>::put(new_member_id + One::one());

        new_member_id
    }

    fn _change_member_about_text(id: T::MemberId, text: &[u8]) -> DispatchResult {
        let mut membership = Self::ensure_membership(id)?;
        let text = Self::validate_text(text);
        membership.about = text;
        Self::deposit_event(RawEvent::MemberUpdatedAboutText(id));
        <MembershipById<T>>::insert(id, membership);
        Ok(())
    }

    fn _change_member_avatar(id: T::MemberId, uri: &[u8]) -> DispatchResult {
        let mut membership = Self::ensure_membership(id)?;
        Self::validate_avatar(uri)?;
        membership.avatar_uri = uri.to_owned();
        Self::deposit_event(RawEvent::MemberUpdatedAvatar(id));
        <MembershipById<T>>::insert(id, membership);
        Ok(())
    }

    fn _change_member_handle(id: T::MemberId, handle: Vec<u8>) -> DispatchResult {
        let mut membership = Self::ensure_membership(id)?;
        Self::validate_handle(&handle)?;
        Self::ensure_unique_handle(&handle)?;
        <MemberIdByHandle<T>>::remove(&membership.handle);
        <MemberIdByHandle<T>>::insert(handle.clone(), id);
        membership.handle = handle;
        Self::deposit_event(RawEvent::MemberUpdatedHandle(id));
        <MembershipById<T>>::insert(id, membership);
        Ok(())
    }

    pub fn ensure_member_controller_account_signed(
        origin: T::Origin,
        member_id: &T::MemberId,
    ) -> Result<T::AccountId, MemberControllerAccountDidNotSign> {
        // Ensure transaction is signed.
        let signer_account =
            ensure_signed(origin).map_err(|_| MemberControllerAccountDidNotSign::UnsignedOrigin)?;

        // Ensure member exists
        let membership = Self::ensure_membership(*member_id)
            .map_err(|_| MemberControllerAccountDidNotSign::MemberIdInvalid)?;

        ensure!(
            membership.controller_account == signer_account,
            MemberControllerAccountDidNotSign::SignerControllerAccountMismatch
        );

        Ok(signer_account)
    }

    pub fn ensure_member_controller_account(
        signer_account: &T::AccountId,
        member_id: &T::MemberId,
    ) -> Result<(), MemberControllerAccountMismatch> {
        // Ensure member exists
        let membership = Self::ensure_membership(*member_id)
            .map_err(|_| MemberControllerAccountMismatch::MemberIdInvalid)?;

        ensure!(
            membership.controller_account == *signer_account,
            MemberControllerAccountMismatch::SignerControllerAccountMismatch
        );

        Ok(())
    }

    pub fn ensure_member_root_account(
        signer_account: &T::AccountId,
        member_id: &T::MemberId,
    ) -> Result<(), MemberRootAccountMismatch> {
        // Ensure member exists
        let membership = Self::ensure_membership(*member_id)
            .map_err(|_| MemberRootAccountMismatch::MemberIdInvalid)?;

        ensure!(
            membership.root_account == *signer_account,
            MemberRootAccountMismatch::SignerRootAccountMismatch
        );

        Ok(())
    }
}
