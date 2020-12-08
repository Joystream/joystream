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

// The membership working group instance alias.
pub type MembershipWorkingGroupInstance = working_group::Instance4;

// Balance type alias
type BalanceOf<T> = <T as balances::Trait>::Balance;

pub trait Trait:
    frame_system::Trait + balances::Trait + pallet_timestamp::Trait + common::Trait
{
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    /// Defines the default membership fee.
    type MembershipFee: Get<BalanceOf<Self>>;
}

// Default user info constraints
const DEFAULT_MIN_HANDLE_LENGTH: u32 = 5;
const DEFAULT_MAX_HANDLE_LENGTH: u32 = 40;
const DEFAULT_MAX_AVATAR_URI_LENGTH: u32 = 1024;
const DEFAULT_MAX_ABOUT_TEXT_LENGTH: u32 = 2048;

/// Public membership object alias.
pub type Membership<T> = MembershipObject<
    <T as frame_system::Trait>::BlockNumber,
    <T as pallet_timestamp::Trait>::Moment,
    <T as frame_system::Trait>::AccountId,
>;

#[derive(Encode, Decode, Default)]
/// Stored information about a registered user
pub struct MembershipObject<BlockNumber, Moment, AccountId> {
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
    pub entry: EntryMethod,

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
    handle: Vec<u8>,
    avatar_uri: Vec<u8>,
    about: Vec<u8>,
}

#[derive(Encode, Decode, Debug, PartialEq)]
pub enum EntryMethod {
    Paid,
    Genesis,
}

/// Must be default constructible because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl Default for EntryMethod {
    fn default() -> Self {
        Self::Genesis
    }
}

decl_error! {
    /// Membership module predefined errors
    pub enum Error for Module<T: Trait> {
        /// New members not allowed
        NewMembersNotAllowed,

        /// Not enough balance to buy membership
        NotEnoughBalanceToBuyMembership,

        /// Controller account required
        ControllerAccountRequired,

        /// Root account required
        RootAccountRequired,

        /// Invalid origin
        UnsignedOrigin,

        /// Member profile not found (invalid member id).
        MemberProfileNotFound,

        /// Handle already registered
        HandleAlreadyRegistered,

        /// Handle too short
        HandleTooShort,

        /// Handle too long
        HandleTooLong,

        /// Avatar uri too long
        AvatarUriTooLong,

        /// Handle must be provided during registration
        HandleMustBeProvidedDuringRegistration,
    }
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

        /// Is the platform is accepting new members or not
        pub NewMembershipsAllowed get(fn new_memberships_allowed) : bool = true;

        // User Input Validation parameters - do these really need to be state variables
        // I don't see a need to adjust these in future?
        pub MinHandleLength get(fn min_handle_length) : u32 = DEFAULT_MIN_HANDLE_LENGTH;
        pub MaxHandleLength get(fn max_handle_length) : u32 = DEFAULT_MAX_HANDLE_LENGTH;
        pub MaxAvatarUriLength get(fn max_avatar_uri_length) : u32 = DEFAULT_MAX_AVATAR_URI_LENGTH;
        pub MaxAboutTextLength get(fn max_about_text_length) : u32 = DEFAULT_MAX_ABOUT_TEXT_LENGTH;

    }
    add_extra_genesis {
        config(members) : Vec<genesis::Member<T::MemberId, T::AccountId, T::Moment>>;
        build(|config: &GenesisConfig<T>| {
            for member in &config.members {
                let checked_user_info = <Module<T>>::check_user_registration_info(
                    Some(member.handle.clone().into_bytes()),
                    Some(member.avatar_uri.clone().into_bytes()),
                    Some(member.about.clone().into_bytes())
                ).expect("Importing Member Failed");

                let member_id = <Module<T>>::insert_member(
                    &member.root_account,
                    &member.controller_account,
                    &checked_user_info,
                    EntryMethod::Genesis,
                    T::BlockNumber::from(1),
                    member.registered_at_time
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
        MemberUpdatedAboutText(MemberId),
        MemberUpdatedAvatar(MemberId),
        MemberUpdatedHandle(MemberId),
        MemberSetRootAccount(MemberId, AccountId),
        MemberSetControllerAccount(MemberId, AccountId),
        MemberVerificationStatusUpdated(MemberId, bool),
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event() = default;

        /// Exports const - membership fee.
        const MembershipFee: BalanceOf<T> = T::MembershipFee::get();

        /// Non-members can buy membership
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn buy_membership(
            origin,
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

            let user_info = Self::check_user_registration_info(handle, avatar_uri, about)?;

            let member_id = Self::insert_member(
                &who,
                &who,
                &user_info,
                EntryMethod::Paid,
                <frame_system::Module<T>>::block_number(),
                <pallet_timestamp::Module<T>>::now()
            )?;

            let _ = balances::Module::<T>::slash(&who, fee);

            Self::deposit_event(RawEvent::MemberRegistered(member_id, who));
        }

        /// Change member's about text
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn change_member_about_text(origin, member_id: T::MemberId, text: Vec<u8>) {
            let sender = ensure_signed(origin)?;

            let membership = Self::ensure_membership(member_id)?;

            ensure!(membership.controller_account == sender, Error::<T>::ControllerAccountRequired);

            Self::_change_member_about_text(member_id, &text)?;
        }

        /// Change member's avatar
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn change_member_avatar(origin, member_id: T::MemberId, uri: Vec<u8>) {
            let sender = ensure_signed(origin)?;

            let membership = Self::ensure_membership(member_id)?;

            ensure!(membership.controller_account == sender, Error::<T>::ControllerAccountRequired);

            Self::_change_member_avatar(member_id, &uri)?;
        }

        /// Change member's handle. Will ensure new handle is unique and old one will be available
        /// for other members to use.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn change_member_handle(origin, member_id: T::MemberId, handle: Vec<u8>) {
            let sender = ensure_signed(origin)?;

            let membership = Self::ensure_membership(member_id)?;

            ensure!(membership.controller_account == sender, Error::<T>::ControllerAccountRequired);

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

            ensure!(membership.controller_account == sender, Error::<T>::ControllerAccountRequired);

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

            ensure!(membership.root_account == sender, Error::<T>::RootAccountRequired);

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

            ensure!(membership.root_account == sender, Error::<T>::RootAccountRequired);

            // only update if new root account is different than current one
            if membership.root_account != new_root_account {
                <MemberIdsByRootAccountId<T>>::mutate(&membership.root_account, |ids| {
                    ids.retain(|id| *id != member_id);
                });

                <MemberIdsByRootAccountId<T>>::mutate(&new_root_account, |ids| {
                    ids.push(member_id);
                });

                membership.root_account = new_root_account.clone();
                <MembershipById<T>>::insert(member_id, membership);
                Self::deposit_event(RawEvent::MemberSetRootAccount(member_id, new_root_account));
            }
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_profile_verification(
            origin,
            _worker_id: T::ActorId,
            target_member_id: T::MemberId,
            is_verified: bool
        ) {
            ensure_signed(origin)?;

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

    #[allow(clippy::ptr_arg)] // cannot change to the "&[u8]" suggested by clippy
    fn ensure_unique_handle(handle: &Vec<u8>) -> Result<(), Error<T>> {
        ensure!(
            !<MemberIdByHandle<T>>::contains_key(handle),
            Error::<T>::HandleAlreadyRegistered
        );
        Ok(())
    }

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

    fn validate_text(text: &[u8]) -> Vec<u8> {
        let mut text = text.to_owned();
        text.truncate(Self::max_about_text_length() as usize);
        text
    }

    fn validate_avatar(uri: &[u8]) -> Result<(), Error<T>> {
        ensure!(
            uri.len() <= Self::max_avatar_uri_length() as usize,
            Error::<T>::AvatarUriTooLong
        );
        Ok(())
    }

    /// Basic user input validation
    fn check_user_registration_info(
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

        Ok(ValidatedUserInfo {
            handle,
            avatar_uri,
            about,
        })
    }

    fn insert_member(
        root_account: &T::AccountId,
        controller_account: &T::AccountId,
        user_info: &ValidatedUserInfo,
        entry_method: EntryMethod,
        registered_at_block: T::BlockNumber,
        registered_at_time: T::Moment,
    ) -> Result<T::MemberId, Error<T>> {
        Self::ensure_unique_handle(&user_info.handle)?;

        let new_member_id = Self::members_created();

        let membership: Membership<T> = MembershipObject {
            handle: user_info.handle.clone(),
            avatar_uri: user_info.avatar_uri.clone(),
            about: user_info.about.clone(),
            registered_at_block,
            registered_at_time,
            entry: entry_method,
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

    fn _change_member_about_text(id: T::MemberId, text: &[u8]) -> Result<(), Error<T>> {
        let mut membership = Self::ensure_membership(id)?;
        let text = Self::validate_text(text);
        membership.about = text;
        Self::deposit_event(RawEvent::MemberUpdatedAboutText(id));
        <MembershipById<T>>::insert(id, membership);
        Ok(())
    }

    fn _change_member_avatar(id: T::MemberId, uri: &[u8]) -> Result<(), Error<T>> {
        let mut membership = Self::ensure_membership(id)?;
        Self::validate_avatar(uri)?;
        membership.avatar_uri = uri.to_owned();
        Self::deposit_event(RawEvent::MemberUpdatedAvatar(id));
        <MembershipById<T>>::insert(id, membership);
        Ok(())
    }

    fn _change_member_handle(id: T::MemberId, handle: Vec<u8>) -> Result<(), Error<T>> {
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

    pub fn ensure_member_root_account(
        signer_account: &T::AccountId,
        member_id: &T::MemberId,
    ) -> Result<(), Error<T>> {
        // Ensure member exists
        let membership = Self::ensure_membership(*member_id)?;

        ensure!(
            membership.root_account == *signer_account,
            Error::<T>::RootAccountRequired
        );

        Ok(())
    }
}
