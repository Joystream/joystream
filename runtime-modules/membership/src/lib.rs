//! Joystream membership module.
//!
//! Memberships are the stable identifier under which actors occupy roles,
//! submit proposals and communicate on the platform.
//!
//! ### Overview
//! A membership is a representation of an actor on the platform,
//! and it exist to serve the profile and reputation purposes.
//!
//! #### Profile
//! A membership has an associated rich profile that includes information that support presenting
//! the actor in a human friendly way in applications, much more so than raw accounts in isolation.
//!
//! #### Reputation
//!
//! Facilitates the consolidation of all activity under one stable identifier,
//! allowing an actor to invest in the reputation of a membership through prolonged participation
//! with good conduct. This gives honest and competent actors a practical way to signal quality,
//! and this quality signal is a key screening parameter allowing entry into more important and
//! sensitive activities. While nothing technically prevents an actor from registering for multiple
//! memberships, the value of doing a range of activities under one membership should be greater
//! than having it fragmented, since reputation, in essence, increases with the length and scope of
//! the history of consistent good conduct.
//!
//! It's important to be aware that a membership is not an account, but a higher level concept that
//! involves accounts for authentication. The membership subsystem is responsible for storing and
//! managing all memberships on the platform, as well as enabling the creation of new memberships,
//! and the terms under which this may happen.
//!
//! Supported extrinsics:
//! - [update_profile](./struct.Module.html#method.update_profile) - updates profile parameters.
//! - [buy_membership](./struct.Module.html#method.buy_membership) - allows to buy membership
//! for non-members.
//! - [update_accounts](./struct.Module.html#method.update_accounts) - updates member accounts.
//! - [update_profile_verification](./struct.Module.html#method.update_profile_verification) -
//! updates member profile verification status.
//!
//! [Joystream handbook description](https://joystream.gitbook.io/joystream-handbook/subsystems/membership)

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

pub mod genesis;
mod tests;

use codec::{Decode, Encode};
use frame_support::traits::{Currency, Get};
use frame_support::{decl_error, decl_event, decl_module, decl_storage, ensure};
use frame_system::ensure_signed;
use sp_arithmetic::traits::One;
use sp_std::borrow::ToOwned;
use sp_std::vec::Vec;

use common::working_group::WorkingGroupIntegration;

/// The membership working group instance alias.
pub type MembershipWorkingGroupInstance = working_group::Instance4;

// Balance type alias
type BalanceOf<T> = <T as balances::Trait>::Balance;

pub trait Trait:
    frame_system::Trait + balances::Trait + pallet_timestamp::Trait + common::Trait
{
    /// Membership module event type.
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    /// Defines the default membership fee.
    type MembershipFee: Get<BalanceOf<Self>>;

    /// Working group pallet integration.
    type WorkingGroup: common::working_group::WorkingGroupIntegration<Self>;
}

// Default user info constraints
const DEFAULT_MIN_HANDLE_LENGTH: u32 = 5;
const DEFAULT_MAX_HANDLE_LENGTH: u32 = 40;
const DEFAULT_MAX_AVATAR_URI_LENGTH: u32 = 1024;
const DEFAULT_MAX_ABOUT_TEXT_LENGTH: u32 = 2048;
const DEFAULT_MAX_NAME_LENGTH: u32 = 200;

/// Public membership profile alias.
pub type Membership<T> = MembershipObject<<T as frame_system::Trait>::AccountId>;

#[derive(Encode, Decode, Default)]
/// Stored information about a registered user.
pub struct MembershipObject<AccountId> {
    /// User name.
    pub name: Vec<u8>,

    /// The unique handle chosen by member.
    pub handle: Vec<u8>,

    /// A Url to member's Avatar image.
    pub avatar_uri: Vec<u8>,

    /// Short text chosen by member to share information about themselves.
    pub about: Vec<u8>,

    /// Member's root account id. Only the root account is permitted to set a new root account
    /// and update the controller account. Other modules may only allow certain actions if
    /// signed with root account. It is intended to be an account that can remain offline and
    /// potentially hold a member's funds, and be a source for staking roles.
    pub root_account: AccountId,

    /// Member's controller account id. This account is intended to be used by
    /// a member to act under their identity in other modules. It will usually be used more
    /// online and will have less funds in its balance.
    pub controller_account: AccountId,

    /// An indicator that reflects whether the implied real world identity in the profile
    /// corresponds to the true actor behind the membership.
    pub verified: bool,
}

// Contains valid or default user details
struct ValidatedUserInfo {
    name: Vec<u8>,
    handle: Vec<u8>,
    avatar_uri: Vec<u8>,
    about: Vec<u8>,
}

decl_error! {
    /// Membership module predefined errors
    pub enum Error for Module<T: Trait> {
        /// New members not allowed.
        NewMembersNotAllowed,

        /// Not enough balance to buy membership.
        NotEnoughBalanceToBuyMembership,

        /// Controller account required.
        ControllerAccountRequired,

        /// Root account required.
        RootAccountRequired,

        /// Invalid origin.
        UnsignedOrigin,

        /// Member profile not found (invalid member id).
        MemberProfileNotFound,

        /// Handle already registered.
        HandleAlreadyRegistered,

        /// Handle too short.
        HandleTooShort,

        /// Handle too long.
        HandleTooLong,

        /// Avatar uri too long.
        AvatarUriTooLong,

        /// Name too long.
        NameTooLong,

        /// Handle must be provided during registration.
        HandleMustBeProvidedDuringRegistration,
    }
}

decl_storage! {
    trait Store for Module<T: Trait> as Membership {
        /// MemberId to assign to next member that is added to the registry, and is also the
        /// total number of members created. MemberIds start at Zero.
        pub NextMemberId get(fn members_created) : T::MemberId;

        /// Mapping of member's id to their membership profile.
        pub MembershipById get(fn membership) : map hasher(blake2_128_concat)
            T::MemberId => Membership<T>;

        /// Mapping of a root account id to vector of member ids it controls.
        pub(crate) MemberIdsByRootAccountId : map hasher(blake2_128_concat)
            T::AccountId => Vec<T::MemberId>;

        /// Mapping of a controller account id to vector of member ids it controls.
        pub(crate) MemberIdsByControllerAccountId : map hasher(blake2_128_concat)
            T::AccountId => Vec<T::MemberId>;

        /// Registered unique handles and their mapping to their owner.
        pub MemberIdByHandle get(fn handles) : map hasher(blake2_128_concat)
            Vec<u8> => T::MemberId;

        /// Is the platform is accepting new members or not.
        pub NewMembershipsAllowed get(fn new_memberships_allowed) : bool = true;

        /// Minimum allowed handle length.
        pub MinHandleLength get(fn min_handle_length) : u32 = DEFAULT_MIN_HANDLE_LENGTH;

        /// Maximum allowed handle length.
        pub MaxHandleLength get(fn max_handle_length) : u32 = DEFAULT_MAX_HANDLE_LENGTH;

        /// Maximum allowed avatar URI length.
        pub MaxAvatarUriLength get(fn max_avatar_uri_length) : u32 = DEFAULT_MAX_AVATAR_URI_LENGTH;

        /// Maximum allowed 'about' text length.
        pub MaxAboutTextLength get(fn max_about_text_length) : u32 = DEFAULT_MAX_ABOUT_TEXT_LENGTH;

        /// Maximum allowed name length.
        pub MaxNameLength get(fn max_name_length) : u32 = DEFAULT_MAX_NAME_LENGTH;
    }
    add_extra_genesis {
        config(members) : Vec<genesis::Member<T::MemberId, T::AccountId>>;
        build(|config: &GenesisConfig<T>| {
            for member in &config.members {
                let checked_user_info = <Module<T>>::check_user_registration_info(
                    Some(member.name.clone().into_bytes()),
                    Some(member.handle.clone().into_bytes()),
                    Some(member.avatar_uri.clone().into_bytes()),
                    Some(member.about.clone().into_bytes())
                ).expect("Importing Member Failed");

                let member_id = <Module<T>>::insert_member(
                    &member.root_account,
                    &member.controller_account,
                    &checked_user_info,
                ).expect("Importing Member Failed");

                // ensure imported member id matches assigned id
                assert_eq!(member_id, member.member_id, "Import Member Failed: MemberId Incorrect");
            }
        });
    }
}

decl_event! {
    pub enum Event<T> where
      <T as frame_system::Trait>::AccountId,
      <T as common::Trait>::MemberId,
    {
        MemberRegistered(MemberId, AccountId),
        MemberProfileUpdated(MemberId),
        MemberAccountsUpdated(MemberId),
        MemberVerificationStatusUpdated(MemberId, bool),
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event() = default;

        /// Exports const - membership fee.
        const MembershipFee: BalanceOf<T> = T::MembershipFee::get();

        /// Non-members can buy membership.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn buy_membership(
            origin,
            name: Option<Vec<u8>>,
            handle: Option<Vec<u8>>,
            avatar_uri: Option<Vec<u8>>,
            about: Option<Vec<u8>>
        ) {
            let who = ensure_signed(origin)?;

            // make sure we are accepting new memberships
            ensure!(Self::new_memberships_allowed(), Error::<T>::NewMembersNotAllowed);

            let fee = T::MembershipFee::get();

            // ensure enough free balance to cover terms fees
            ensure!(
                balances::Module::<T>::usable_balance(&who) >= fee,
                Error::<T>::NotEnoughBalanceToBuyMembership
            );

            let user_info = Self::check_user_registration_info(name, handle, avatar_uri, about)?;

            let member_id = Self::insert_member(
                &who,
                &who,
                &user_info,
            )?;

            let _ = balances::Module::<T>::slash(&who, fee);

            Self::deposit_event(RawEvent::MemberRegistered(member_id, who));
        }

        /// Update member's all or some of name, handle, avatar and about text.
        /// No effect if no changed fields.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_profile(
            origin,
            member_id: T::MemberId,
            name: Option<Vec<u8>>,
            handle: Option<Vec<u8>>,
            avatar_uri: Option<Vec<u8>>,
            about: Option<Vec<u8>>
        ) {
            // No effect if no changes.
            if name.is_none() && handle.is_none() && avatar_uri.is_none() && about.is_none() {
                return Ok(())
            }

            Self::ensure_member_controller_account_signed(origin, &member_id)?;

            let mut membership = Self::ensure_membership(member_id)?;

            // Prepare for possible handle change;
            let old_handle = membership.handle.clone();
            let mut new_handle: Option<Vec<u8>> = None;

            // Update fields if needed
            if let Some(uri) = avatar_uri {
                Self::validate_avatar(&uri)?;
                membership.avatar_uri = uri;
            }
            if let Some(name) = name {
                Self::validate_name(&name)?;
                membership.name = name;
            }
            if let Some(about) = about {
                let text = Self::validate_text(&about);
                membership.about = text;
            }
            if let Some(handle) = handle {
                Self::validate_handle(&handle)?;
                Self::ensure_unique_handle(&handle)?;

                new_handle = Some(handle.clone());
                membership.handle = handle;
            }

            //
            // == MUTATION SAFE ==
            //

            <MembershipById<T>>::insert(member_id, membership);

            if let Some(new_handle) = new_handle {
                <MemberIdByHandle<T>>::remove(&old_handle);
                <MemberIdByHandle<T>>::insert(new_handle, member_id);
            }

            Self::deposit_event(RawEvent::MemberProfileUpdated(member_id));
        }

        /// Updates member root or controller accounts. No effect if both new accounts are empty.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_accounts(
            origin,
            member_id: T::MemberId,
            new_root_account: Option<T::AccountId>,
            new_controller_account: Option<T::AccountId>,
        ) {
            // No effect if no changes.
            if new_root_account.is_none() && new_controller_account.is_none() {
                return Ok(())
            }

            let sender = ensure_signed(origin)?;
            let mut membership = Self::ensure_membership(member_id)?;

            ensure!(membership.root_account == sender, Error::<T>::RootAccountRequired);

            //
            // == MUTATION SAFE ==
            //

            if let Some(root_account) = new_root_account {
                <MemberIdsByRootAccountId<T>>::mutate(&membership.root_account, |ids| {
                    ids.retain(|id| *id != member_id);
                });

                <MemberIdsByRootAccountId<T>>::mutate(&root_account, |ids| {
                    ids.push(member_id);
                });

                membership.root_account = root_account;
            }

            if let Some(controller_account) = new_controller_account {
                <MemberIdsByControllerAccountId<T>>::mutate(&membership.controller_account, |ids| {
                    ids.retain(|id| *id != member_id);
                });

                <MemberIdsByControllerAccountId<T>>::mutate(&controller_account, |ids| {
                    ids.push(member_id);
                });

                membership.controller_account = controller_account;
            }

            <MembershipById<T>>::insert(member_id, membership);
            Self::deposit_event(RawEvent::MemberAccountsUpdated(member_id));
        }

        /// Updates member profile verification status. Requires working group member origin.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_profile_verification(
            origin,
            worker_id: T::ActorId,
            target_member_id: T::MemberId,
            is_verified: bool
        ) {
            T::WorkingGroup::ensure_worker_origin(origin, &worker_id)?;

            Self::ensure_membership(target_member_id)?;

            //
            // == MUTATION SAFE ==
            //

            <MembershipById<T>>::mutate(&target_member_id, |membership| {
                    membership.verified = is_verified;
            });

            Self::deposit_event(
                RawEvent::MemberVerificationStatusUpdated(target_member_id, is_verified)
            );
        }
    }
}

impl<T: Trait> Module<T> {
    /// Provided that the member_id exists return its membership. Returns error otherwise.
    pub fn ensure_membership(id: T::MemberId) -> Result<Membership<T>, Error<T>> {
        if <MembershipById<T>>::contains_key(&id) {
            Ok(Self::membership(&id))
        } else {
            Err(Error::<T>::MemberProfileNotFound)
        }
    }

    /// Ensure that given member has given account as the controller account
    pub fn ensure_is_controller_account_for_member(
        member_id: &T::MemberId,
        account: &T::AccountId,
    ) -> Result<Membership<T>, Error<T>> {
        if MembershipById::<T>::contains_key(member_id) {
            let membership = MembershipById::<T>::get(member_id);

            if membership.controller_account == *account {
                Ok(membership)
            } else {
                Err(Error::<T>::ControllerAccountRequired)
            }
        } else {
            Err(Error::<T>::MemberProfileNotFound)
        }
    }

    /// Returns true if account is either a member's root or controller account
    pub fn is_member_account(who: &T::AccountId) -> bool {
        <MemberIdsByRootAccountId<T>>::contains_key(who)
            || <MemberIdsByControllerAccountId<T>>::contains_key(who)
    }

    // Ensure possible member handle is unique.
    #[allow(clippy::ptr_arg)] // cannot change to the "&[u8]" suggested by clippy
    fn ensure_unique_handle(handle: &Vec<u8>) -> Result<(), Error<T>> {
        ensure!(
            !<MemberIdByHandle<T>>::contains_key(handle),
            Error::<T>::HandleAlreadyRegistered
        );
        Ok(())
    }

    // Provides possible handle validation.
    fn validate_handle(handle: &[u8]) -> Result<(), Error<T>> {
        ensure!(
            handle.len() >= Self::min_handle_length() as usize,
            Error::<T>::HandleTooShort
        );
        ensure!(
            handle.len() <= Self::max_handle_length() as usize,
            Error::<T>::HandleTooLong
        );
        Ok(())
    }

    // Provides possible member about text validation.
    fn validate_text(text: &[u8]) -> Vec<u8> {
        let mut text = text.to_owned();
        text.truncate(Self::max_about_text_length() as usize);
        text
    }

    // Provides possible member avatar uri validation.
    fn validate_avatar(uri: &[u8]) -> Result<(), Error<T>> {
        ensure!(
            uri.len() <= Self::max_avatar_uri_length() as usize,
            Error::<T>::AvatarUriTooLong
        );
        Ok(())
    }

    // Provides possible member name validation.
    fn validate_name(name: &[u8]) -> Result<(), Error<T>> {
        ensure!(
            name.len() <= Self::max_name_length() as usize,
            Error::<T>::NameTooLong
        );
        Ok(())
    }

    // Basic user input validation
    fn check_user_registration_info(
        name: Option<Vec<u8>>,
        handle: Option<Vec<u8>>,
        avatar_uri: Option<Vec<u8>>,
        about: Option<Vec<u8>>,
    ) -> Result<ValidatedUserInfo, Error<T>> {
        // Handle is required during registration
        let handle = handle.ok_or(Error::<T>::HandleMustBeProvidedDuringRegistration)?;
        Self::validate_handle(&handle)?;

        let about = Self::validate_text(&about.unwrap_or_default());
        let avatar_uri = avatar_uri.unwrap_or_default();
        Self::validate_avatar(&avatar_uri)?;
        let name = name.unwrap_or_default();
        Self::validate_name(&name)?;

        Ok(ValidatedUserInfo {
            name,
            handle,
            avatar_uri,
            about,
        })
    }

    // Inserts a member using a validated information. Sets handle, accounts caches.
    fn insert_member(
        root_account: &T::AccountId,
        controller_account: &T::AccountId,
        user_info: &ValidatedUserInfo,
    ) -> Result<T::MemberId, Error<T>> {
        Self::ensure_unique_handle(&user_info.handle)?;

        let new_member_id = Self::members_created();

        let membership: Membership<T> = MembershipObject {
            name: user_info.name.clone(),
            handle: user_info.handle.clone(),
            avatar_uri: user_info.avatar_uri.clone(),
            about: user_info.about.clone(),
            root_account: root_account.clone(),
            controller_account: controller_account.clone(),
            verified: false,
        };

        <MemberIdsByRootAccountId<T>>::mutate(root_account, |ids| {
            ids.push(new_member_id);
        });
        <MemberIdsByControllerAccountId<T>>::mutate(controller_account, |ids| {
            ids.push(new_member_id);
        });

        <MembershipById<T>>::insert(new_member_id, membership);
        <MemberIdByHandle<T>>::insert(user_info.handle.clone(), new_member_id);

        <NextMemberId<T>>::put(new_member_id + One::one());
        Ok(new_member_id)
    }

    /// Ensure origin corresponds to the controller account of the member.
    pub fn ensure_member_controller_account_signed(
        origin: T::Origin,
        member_id: &T::MemberId,
    ) -> Result<T::AccountId, Error<T>> {
        // Ensure transaction is signed.
        let signer_account = ensure_signed(origin).map_err(|_| Error::<T>::UnsignedOrigin)?;

        // Ensure member exists
        let membership = Self::ensure_membership(*member_id)?;

        ensure!(
            membership.controller_account == signer_account,
            Error::<T>::ControllerAccountRequired
        );

        Ok(signer_account)
    }

    /// Validates that a member has the controller account.
    pub fn ensure_member_controller_account(
        signer_account: &T::AccountId,
        member_id: &T::MemberId,
    ) -> Result<(), Error<T>> {
        // Ensure member exists
        let membership = Self::ensure_membership(*member_id)?;

        ensure!(
            membership.controller_account == *signer_account,
            Error::<T>::ControllerAccountRequired
        );

        Ok(())
    }
}
