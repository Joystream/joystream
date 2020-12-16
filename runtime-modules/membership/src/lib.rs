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
//! - [set_referral_cut](./struct.Module.html#method.set_referral_cut) - updates the referral cut.
//! - [transfer_invites](./struct.Module.html#method.transfer_invites) - transfers the invites
//! from one member to another.
//!
//! [Joystream handbook description](https://joystream.gitbook.io/joystream-handbook/subsystems/membership)

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

pub mod genesis;
mod tests;

use codec::{Decode, Encode};
use frame_support::traits::{Currency, Get};
use frame_support::{decl_error, decl_event, decl_module, decl_storage, ensure};
use frame_system::ensure_root;
use frame_system::ensure_signed;
use sp_arithmetic::traits::{One, Zero};
use sp_std::borrow::ToOwned;
use sp_std::vec::Vec;

use common::working_group::WorkingGroupIntegration;

// Balance type alias
type BalanceOf<T> = <T as balances::Trait>::Balance;

pub trait Trait:
    frame_system::Trait + balances::Trait + pallet_timestamp::Trait + common::Trait
{
    /// Membership module event type.
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    /// Defines the default membership fee.
    type DefaultMembershipPrice: Get<BalanceOf<Self>>;

    /// Working group pallet integration.
    type WorkingGroup: common::working_group::WorkingGroupIntegration<Self>;

    /// Defines the default balance for the invited member.
    type DefaultInitialInvitationBalance: Get<BalanceOf<Self>>;
}

// Default user info constraints
const DEFAULT_MIN_HANDLE_LENGTH: u32 = 5;
const DEFAULT_MAX_HANDLE_LENGTH: u32 = 40;
const DEFAULT_MAX_AVATAR_URI_LENGTH: u32 = 1024;
const DEFAULT_MAX_ABOUT_TEXT_LENGTH: u32 = 2048;
const DEFAULT_MAX_NAME_LENGTH: u32 = 200;
pub(crate) const DEFAULT_MEMBER_INVITES_COUNT: u32 = 5;

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

    /// Defines how many invitations this member has
    pub invites: u32,
}

// Contains valid or default user details
struct ValidatedUserInfo {
    name: Vec<u8>,
    handle: Vec<u8>,
    avatar_uri: Vec<u8>,
    about: Vec<u8>,
}

/// Parameters for the buy_membership extrinsic.
#[derive(Encode, Decode, Default, Clone, PartialEq, Debug)]
pub struct BuyMembershipParameters<AccountId, MemberId> {
    /// New member root account.
    pub root_account: AccountId,

    /// New member controller account.
    pub controller_account: AccountId,

    /// New member user name.
    pub name: Option<Vec<u8>>,

    /// New member handle.
    pub handle: Option<Vec<u8>>,

    /// New member avatar URI.
    pub avatar_uri: Option<Vec<u8>>,

    /// New member 'about' text.
    pub about: Option<Vec<u8>>,

    /// Referrer member id.
    pub referrer_id: Option<MemberId>,
}

/// Parameters for the invite_member extrinsic.
#[derive(Encode, Decode, Default, Clone, PartialEq, Debug)]
pub struct InviteMembershipParameters<AccountId, MemberId> {
    /// Inviting member id.
    pub inviting_member_id: MemberId,

    /// New member root account.
    pub root_account: AccountId,

    /// New member controller account.
    pub controller_account: AccountId,

    /// New member user name.
    pub name: Option<Vec<u8>>,

    /// New member handle.
    pub handle: Option<Vec<u8>>,

    /// New member avatar URI.
    pub avatar_uri: Option<Vec<u8>>,

    /// New member 'about' text.
    pub about: Option<Vec<u8>>,
}

decl_error! {
    /// Membership module predefined errors
    pub enum Error for Module<T: Trait> {
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

        /// Cannot find a membership for a provided referrer id.
        ReferrerIsNotMember,

        /// Should be a member to receive invites.
        CannotTransferInvitesForNotMember,

        /// Not enough invites to perform an operation.
        NotEnoughInvites,

        /// Membership working group leader is not set.
        WorkingGroupLeaderNotSet,
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

        /// Referral cut to receive during on buying the membership.
        pub ReferralCut get(fn referral_cut) : BalanceOf<T>;

        /// Current membership price.
        pub MembershipPrice get(fn membership_price) : BalanceOf<T> =
            T::DefaultMembershipPrice::get();

        /// Initial invitation count for the newly bought membership.
        pub InitialInvitationCount get(fn initial_invitation_count) : u32  =
            DEFAULT_MEMBER_INVITES_COUNT;

        /// Initial invitation balance for the invited member.
        pub InitialInvitationBalance get(fn initial_invitation_balance) : BalanceOf<T> =
            T::DefaultInitialInvitationBalance::get();
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
                    Zero::zero(),
                ).expect("Importing Member Failed");

                // ensure imported member id matches assigned id
                assert_eq!(member_id, member.member_id, "Import Member Failed: MemberId Incorrect");
            }
        });
    }
}

decl_event! {
    pub enum Event<T> where
      <T as common::Trait>::MemberId,
      Balance = BalanceOf<T>,
    {
        MemberRegistered(MemberId),
        MemberProfileUpdated(MemberId),
        MemberAccountsUpdated(MemberId),
        MemberVerificationStatusUpdated(MemberId, bool),
        ReferralCutUpdated(Balance),
        InvitesTransferred(MemberId, MemberId, u32),
        MembershipPriceUpdated(Balance),
        InitialInvitationBalanceUpdated(Balance),
        LeaderInvitationQuotaUpdated(u32),
        InitialInvitationCountUpdated(u32),
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event() = default;

        /// Non-members can buy membership.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn buy_membership(
            origin,
            params: BuyMembershipParameters<T::AccountId, T::MemberId>
        ) {
            let who = ensure_signed(origin)?;

            let fee = Self::membership_price();

            // Ensure enough free balance to cover membership fee.
            ensure!(
                balances::Module::<T>::usable_balance(&who) >= fee,
                Error::<T>::NotEnoughBalanceToBuyMembership
            );

            // Verify user parameters.
            let user_info = Self::check_user_registration_info(
                params.name,
                params.handle,
                params.avatar_uri,
                params.about)
            ?;

            let referrer = params
                .referrer_id
                .map(|referrer_id| {
                    Self::ensure_membership_with_error(referrer_id, Error::<T>::ReferrerIsNotMember)
                })
                .transpose()?;

            //
            // == MUTATION SAFE ==
            //

            let member_id = Self::insert_member(
                &params.root_account,
                &params.controller_account,
                &user_info,
                Self::initial_invitation_count(),
            )?;

            // Collect membership fee (just burn it).
            let _ = balances::Module::<T>::slash(&who, fee);

            // Reward the referring member.
            if let Some(referrer) = referrer{
                let referral_cut: BalanceOf<T> = Self::get_referral_bonus();

                if referral_cut > Zero::zero() {
                    let _ = balances::Module::<T>::deposit_creating(
                        &referrer.controller_account,
                        referral_cut
                    );
                }
            }

            // Fire the event.
            Self::deposit_event(RawEvent::MemberRegistered(member_id));
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

        /// Updates membership referral cut. Requires root origin.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn set_referral_cut(origin, value: BalanceOf<T>) {
            ensure_root(origin)?;

            //
            // == MUTATION SAFE ==
            //

            <ReferralCut<T>>::put(value);

            Self::deposit_event(RawEvent::ReferralCutUpdated(value));
        }

        /// Transfers invites from one member to another.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn transfer_invites(
            origin,
            source_member_id: T::MemberId,
            target_member_id: T::MemberId,
            number_of_invites: u32
        ) {
            Self::ensure_member_controller_account_signed(origin, &source_member_id)?;

            let mut source_membership = Self::ensure_membership(source_member_id)?;
            let mut target_membership = Self::ensure_membership_with_error(
                target_member_id,
                Error::<T>::CannotTransferInvitesForNotMember
            )?;

            ensure!(source_membership.invites >= number_of_invites, Error::<T>::NotEnoughInvites);

            //
            // == MUTATION SAFE ==
            //

            source_membership.invites -= number_of_invites;
            target_membership.invites += number_of_invites;

            <MembershipById<T>>::insert(&source_member_id, source_membership);
            <MembershipById<T>>::insert(&target_member_id, target_membership);

            Self::deposit_event(RawEvent::InvitesTransferred(
                source_member_id,
                target_member_id,
                number_of_invites
            ));
        }

        /// Invite a new member.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn invite_member(
            origin,
            params: InviteMembershipParameters<T::AccountId, T::MemberId>
        ) {
            Self::ensure_member_controller_account_signed(origin, &params.inviting_member_id)?;

            let mut inviting_membership = Self::ensure_membership(params.inviting_member_id)?;
            ensure!(inviting_membership.invites > Zero::zero(), Error::<T>::NotEnoughInvites);

            // Verify user parameters.
            let user_info = Self::check_user_registration_info(
                params.name,
                params.handle,
                params.avatar_uri,
                params.about
            )?;

            //
            // == MUTATION SAFE ==
            //

            let member_id = Self::insert_member(
                &params.root_account,
                &params.controller_account,
                &user_info,
                Zero::zero(),
            )?;

            // Decrement the available invites counter.
            inviting_membership.invites = inviting_membership.invites.saturating_sub(1);

            // Save the updated profile.
            <MembershipById<T>>::insert(&params.inviting_member_id, inviting_membership);

            // Fire the event.
            Self::deposit_event(RawEvent::MemberRegistered(member_id));
        }

        /// Updates membership price. Requires root origin.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn set_membership_price(origin, new_price: BalanceOf<T>) {
            ensure_root(origin)?;

            //
            // == MUTATION SAFE ==
            //

            <MembershipPrice<T>>::put(new_price);

            Self::deposit_event(RawEvent::MembershipPriceUpdated(new_price));
        }

        /// Updates leader invitation quota. Requires root origin.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn set_leader_invitation_quota(origin, invitation_quota: u32) {
            ensure_root(origin)?;

            let leader_member_id = T::WorkingGroup::get_leader_member_id();

            if let Some(member_id) = leader_member_id{
                Self::ensure_membership(member_id)?;
            }

            ensure!(leader_member_id.is_some(), Error::<T>::WorkingGroupLeaderNotSet);

            //
            // == MUTATION SAFE ==
            //

            if let Some(member_id) = leader_member_id{
                <MembershipById<T>>::mutate(&member_id, |membership| {
                        membership.invites = invitation_quota;
                });

                Self::deposit_event(RawEvent::LeaderInvitationQuotaUpdated(invitation_quota));
            }
        }

        /// Updates initial invitation balance for a invited member. Requires root origin.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn set_initial_invitation_balance(origin, new_initial_balance: BalanceOf<T>) {
            ensure_root(origin)?;

            //
            // == MUTATION SAFE ==
            //

            <InitialInvitationBalance<T>>::put(new_initial_balance);

            Self::deposit_event(RawEvent::InitialInvitationBalanceUpdated(new_initial_balance));
        }

        /// Updates initial invitation count for a member. Requires root origin.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn set_initial_invitation_count(origin, new_invitation_count: u32) {
            ensure_root(origin)?;

            //
            // == MUTATION SAFE ==
            //

            InitialInvitationCount::put(new_invitation_count);

            Self::deposit_event(RawEvent::InitialInvitationCountUpdated(new_invitation_count));
        }
    }
}

impl<T: Trait> Module<T> {
    /// Provided that the member_id exists return its membership. Returns error otherwise.
    pub fn ensure_membership(member_id: T::MemberId) -> Result<Membership<T>, Error<T>> {
        Self::ensure_membership_with_error(member_id, Error::<T>::MemberProfileNotFound)
    }

    /// Provided that the member_id exists return its membership. Returns provided error otherwise.
    fn ensure_membership_with_error(
        id: T::MemberId,
        error: Error<T>,
    ) -> Result<Membership<T>, Error<T>> {
        if <MembershipById<T>>::contains_key(&id) {
            Ok(Self::membership(&id))
        } else {
            Err(error)
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
        Self::ensure_unique_handle(&handle)?;
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

    // Inserts a member using a validated information. Sets handle, accounts caches, etc..
    fn insert_member(
        root_account: &T::AccountId,
        controller_account: &T::AccountId,
        user_info: &ValidatedUserInfo,
        allowed_invites: u32,
    ) -> Result<T::MemberId, Error<T>> {
        let new_member_id = Self::members_created();

        let membership: Membership<T> = MembershipObject {
            name: user_info.name.clone(),
            handle: user_info.handle.clone(),
            avatar_uri: user_info.avatar_uri.clone(),
            about: user_info.about.clone(),
            root_account: root_account.clone(),
            controller_account: controller_account.clone(),
            verified: false,
            invites: allowed_invites,
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

    // Ensure origin corresponds to the controller account of the member.
    fn ensure_member_controller_account_signed(
        origin: T::Origin,
        member_id: &T::MemberId,
    ) -> Result<Membership<T>, Error<T>> {
        // Ensure transaction is signed.
        let signer_account_id = ensure_signed(origin).map_err(|_| Error::<T>::UnsignedOrigin)?;

        Self::ensure_is_controller_account_for_member(member_id, &signer_account_id)
    }

    /// Ensure that given member has given account as the controller account
    pub fn ensure_is_controller_account_for_member(
        member_id: &T::MemberId,
        account: &T::AccountId,
    ) -> Result<Membership<T>, Error<T>> {
        ensure!(
            MembershipById::<T>::contains_key(member_id),
            Error::<T>::MemberProfileNotFound
        );

        let membership = MembershipById::<T>::get(member_id);

        ensure!(
            membership.controller_account == *account,
            Error::<T>::ControllerAccountRequired
        );

        Ok(membership)
    }

    // Calculate current referral bonus. It minimum between membership fee and referral cut.
    pub(crate) fn get_referral_bonus() -> BalanceOf<T> {
        let membership_fee = Self::membership_price();
        let referral_cut = Self::referral_cut();

        membership_fee.min(referral_cut)
    }
}
