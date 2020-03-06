use crate::currency::{BalanceOf, GovernanceCurrency};
use codec::{Codec, Decode, Encode};

use rstd::prelude::*;
use sr_primitives::traits::{MaybeSerialize, Member, One, SimpleArithmetic};
use srml_support::traits::{Currency, Get};
use srml_support::{decl_event, decl_module, decl_storage, dispatch, ensure, Parameter};

use system::{self, ensure_root, ensure_signed};
use timestamp;

pub use super::role_types::*;

pub trait Trait: system::Trait + GovernanceCurrency + timestamp::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type MemberId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    type PaidTermId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    type SubscriptionId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    type ActorId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + Ord;

    /// Initial balance of members created at genesis
    type InitialMembersBalance: Get<BalanceOf<Self>>;
}

const FIRST_PAID_TERMS_ID: u32 = 1;

// Default paid membership terms
pub const DEFAULT_PAID_TERM_ID: u32 = 0;

// Default user info constraints
const DEFAULT_MIN_HANDLE_LENGTH: u32 = 5;
const DEFAULT_MAX_HANDLE_LENGTH: u32 = 40;
const DEFAULT_MAX_AVATAR_URI_LENGTH: u32 = 1024;
const DEFAULT_MAX_ABOUT_TEXT_LENGTH: u32 = 2048;

//#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode)]
/// Stored information about a registered user
pub struct Profile<T: Trait> {
    /// The unique handle chosen by member
    pub handle: Vec<u8>,

    /// A Url to member's Avatar image
    pub avatar_uri: Vec<u8>,

    /// Short text chosen by member to share information about themselves
    pub about: Vec<u8>,

    /// Blocknumber when member was registered
    pub registered_at_block: T::BlockNumber,

    /// Timestamp when member was registered
    pub registered_at_time: T::Moment,

    /// How the member was registered
    pub entry: EntryMethod<T>,

    /// Wether the member is suspended or not.
    pub suspended: bool,

    /// The type of subsction the member has purchased if any.
    pub subscription: Option<T::SubscriptionId>,

    /// Member's root account id. Only the root account is permitted to set a new root account
    /// and update the controller account. Other modules may only allow certain actions if
    /// signed with root account. It is intended to be an account that can remain offline and
    /// potentially hold a member's funds, and be a source for staking roles.
    pub root_account: T::AccountId,

    /// Member's controller account id. This account is intended to be used by
    /// a member to act under their identity in other modules. It will usually be used more
    /// online and will have less funds in its balance.
    pub controller_account: T::AccountId,

    /// The set of registered roles the member has enrolled in.
    pub roles: ActorInRoleSet<T::ActorId>,
}

#[derive(Clone, Debug, Encode, Decode, PartialEq)]
/// A "Partial" struct used to batch user configurable profile information when registering or updating info
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
#[derive(Encode, Decode, Debug, PartialEq)]
pub enum EntryMethod<T: Trait> {
    Paid(T::PaidTermId),
    Screening(T::AccountId),
    Genesis,
}

//#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Eq, PartialEq)]
pub struct PaidMembershipTerms<T: Trait> {
    /// Quantity of native tokens which must be provably burned
    pub fee: BalanceOf<T>,
    /// String of capped length describing human readable conditions which are being agreed upon
    pub text: Vec<u8>,
}

decl_storage! {
    trait Store for Module<T: Trait> as Membership {
        /// MemberId to assign to next member that is added to the registry, and is also the
        /// total number of members created. MemberIds start at Zero.
        pub MembersCreated get(members_created) : T::MemberId;

        /// Mapping of member's id to their membership profile
        pub MemberProfile get(member_profile) : map T::MemberId => Option<Profile<T>>;

        /// Mapping of a root account id to vector of member ids it controls
        pub MemberIdsByRootAccountId get(member_ids_by_root_account_id) : map T::AccountId => Vec<T::MemberId>;

        /// Mapping of a controller account id to vector of member ids it controls
        pub MemberIdsByControllerAccountId get(member_ids_by_controller_account_id) : map T::AccountId => Vec<T::MemberId>;

        /// Registered unique handles and their mapping to their owner
        pub Handles get(handles) : map Vec<u8> => T::MemberId;

        /// Next paid membership terms id
        pub NextPaidMembershipTermsId get(next_paid_membership_terms_id) : T::PaidTermId = T::PaidTermId::from(FIRST_PAID_TERMS_ID);

        /// Paid membership terms record
        // Remember to add _genesis_phantom_data: std::marker::PhantomData{} to membership
        // genesis config if not providing config() or extra_genesis
        pub PaidMembershipTermsById get(paid_membership_terms_by_id) build(|config: &GenesisConfig<T>| {
            // This method only gets called when initializing storage, and is
            // compiled as native code. (Will be called when building `raw` chainspec)
            // So it can't be relied upon to initialize storage for runtimes updates.
            // Initialization for updated runtime is done in run_migration()
            let terms = PaidMembershipTerms {
                fee:  config.default_paid_membership_fee,
                text: Vec::default(),
            };
            vec![(T::PaidTermId::from(DEFAULT_PAID_TERM_ID), terms)]
        }) : map T::PaidTermId => Option<PaidMembershipTerms<T>>;

        /// Active Paid membership terms
        pub ActivePaidMembershipTerms get(active_paid_membership_terms) : Vec<T::PaidTermId> = vec![T::PaidTermId::from(DEFAULT_PAID_TERM_ID)];

        /// Is the platform is accepting new members or not
        pub NewMembershipsAllowed get(new_memberships_allowed) : bool = true;

        pub ScreeningAuthority get(screening_authority) : Option<T::AccountId>;

        // User Input Validation parameters - do these really need to be state variables
        // I don't see a need to adjust these in future?
        pub MinHandleLength get(min_handle_length) : u32 = DEFAULT_MIN_HANDLE_LENGTH;
        pub MaxHandleLength get(max_handle_length) : u32 = DEFAULT_MAX_HANDLE_LENGTH;
        pub MaxAvatarUriLength get(max_avatar_uri_length) : u32 = DEFAULT_MAX_AVATAR_URI_LENGTH;
        pub MaxAboutTextLength get(max_about_text_length) : u32 = DEFAULT_MAX_ABOUT_TEXT_LENGTH;

        pub MembershipIdByActorInRole get(membership_id_by_actor_in_role): map ActorInRole<T::ActorId> => T::MemberId;
    }
    add_extra_genesis {
        config(default_paid_membership_fee): BalanceOf<T>;
        config(members) : Vec<(T::AccountId, String, String, String)>;
        build(|config: &GenesisConfig<T>| {
            for (who, handle, avatar_uri, about) in &config.members {
                let user_info = CheckedUserInfo {
                    handle: handle.clone().into_bytes(), avatar_uri: avatar_uri.clone().into_bytes(), about: about.clone().into_bytes()
                };

                <Module<T>>::insert_member(&who, &user_info, EntryMethod::Genesis);

                // Give member starting balance
                T::Currency::deposit_creating(&who, T::InitialMembersBalance::get());
            }
        });
    }
}

decl_event! {
    pub enum Event<T> where
      <T as system::Trait>::AccountId,
      <T as Trait>::MemberId,
      <T as Trait>::ActorId, {
        MemberRegistered(MemberId, AccountId),
        MemberUpdatedAboutText(MemberId),
        MemberUpdatedAvatar(MemberId),
        MemberUpdatedHandle(MemberId),
        MemberSetRootAccount(MemberId, AccountId),
        MemberSetControllerAccount(MemberId, AccountId),
        MemberRegisteredRole(MemberId, ActorInRole<ActorId>),
        MemberUnregisteredRole(MemberId, ActorInRole<ActorId>),
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event() = default;

        /// Non-members can buy membership
        pub fn buy_membership(origin, paid_terms_id: T::PaidTermId, user_info: UserInfo) {
            let who = ensure_signed(origin)?;

            // make sure we are accepting new memberships
            ensure!(Self::new_memberships_allowed(), "new members not allowed");

            // ensure paid_terms_id is active
            let terms = Self::ensure_active_terms_id(paid_terms_id)?;

            // ensure enough free balance to cover terms fees
            ensure!(T::Currency::can_slash(&who, terms.fee), "not enough balance to buy membership");

            let user_info = Self::check_user_registration_info(user_info)?;

            // ensure handle is not already registered
            Self::ensure_unique_handle(&user_info.handle)?;

            let _ = T::Currency::slash(&who, terms.fee);
            let member_id = Self::insert_member(&who, &user_info, EntryMethod::Paid(paid_terms_id));

            Self::deposit_event(RawEvent::MemberRegistered(member_id, who.clone()));
        }

        /// Change member's about text
        pub fn change_member_about_text(origin, member_id: T::MemberId, text: Vec<u8>) {
            let sender = ensure_signed(origin)?;

            let profile = Self::ensure_profile(member_id)?;

            ensure!(profile.controller_account == sender, "only controller account can update member about text");

            Self::_change_member_about_text(member_id, &text)?;
        }

        /// Change member's avatar
        pub fn change_member_avatar(origin, member_id: T::MemberId, uri: Vec<u8>) {
            let sender = ensure_signed(origin)?;

            let profile = Self::ensure_profile(member_id)?;

            ensure!(profile.controller_account == sender, "only controller account can update member avatar");

            Self::_change_member_avatar(member_id, &uri)?;
        }

        /// Change member's handle. Will ensure new handle is unique and old one will be available
        /// for other members to use.
        pub fn change_member_handle(origin, member_id: T::MemberId, handle: Vec<u8>) {
            let sender = ensure_signed(origin)?;

            let profile = Self::ensure_profile(member_id)?;

            ensure!(profile.controller_account == sender, "only controller account can update member handle");

            Self::_change_member_handle(member_id, handle)?;
        }

        /// Update member's all or some of handle, avatar and about text.
        pub fn update_profile(origin, member_id: T::MemberId, user_info: UserInfo) {
            let sender = ensure_signed(origin)?;

            let profile = Self::ensure_profile(member_id)?;

            ensure!(profile.controller_account == sender, "only controller account can update member info");

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

        pub fn set_controller_account(origin, member_id: T::MemberId, new_controller_account: T::AccountId) {
            let sender = ensure_signed(origin)?;

            let mut profile = Self::ensure_profile(member_id)?;

            ensure!(profile.root_account == sender, "only root account can set new controller account");

            // only update if new_controller_account is different than current one
            if profile.controller_account != new_controller_account {
                <MemberIdsByControllerAccountId<T>>::mutate(&profile.controller_account, |ids| {
                    ids.retain(|id| *id != member_id);
                });

                <MemberIdsByControllerAccountId<T>>::mutate(&new_controller_account, |ids| {
                    ids.push(member_id);
                });

                profile.controller_account = new_controller_account.clone();
                <MemberProfile<T>>::insert(member_id, profile);
                Self::deposit_event(RawEvent::MemberSetControllerAccount(member_id, new_controller_account));
            }
        }

        pub fn set_root_account(origin, member_id: T::MemberId, new_root_account: T::AccountId) {
            let sender = ensure_signed(origin)?;

            let mut profile = Self::ensure_profile(member_id)?;

            ensure!(profile.root_account == sender, "only root account can set new root account");

            // only update if new root account is different than current one
            if profile.root_account != new_root_account {
                <MemberIdsByRootAccountId<T>>::mutate(&profile.root_account, |ids| {
                    ids.retain(|id| *id != member_id);
                });

                <MemberIdsByRootAccountId<T>>::mutate(&new_root_account, |ids| {
                    ids.push(member_id);
                });

                profile.root_account = new_root_account.clone();
                Self::deposit_event(RawEvent::MemberSetRootAccount(member_id, new_root_account));
            }
        }

        pub fn add_screened_member(origin, new_member_account: T::AccountId, user_info: UserInfo) {
            // ensure sender is screening authority
            let sender = ensure_signed(origin)?;

            if let Some(screening_authority) = Self::screening_authority() {
                ensure!(sender == screening_authority, "not screener");
            } else {
                // no screening authority defined. Cannot accept this request
                return Err("no screening authority defined");
            }

            // make sure we are accepting new memberships
            ensure!(Self::new_memberships_allowed(), "new members not allowed");

            let user_info = Self::check_user_registration_info(user_info)?;

            // ensure handle is not already registered
            Self::ensure_unique_handle(&user_info.handle)?;

            let member_id = Self::insert_member(&new_member_account, &user_info, EntryMethod::Screening(sender));

            Self::deposit_event(RawEvent::MemberRegistered(member_id, new_member_account));
        }

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
    /// Provided that the memberid exists return its profile. Returns error otherwise.
    pub fn ensure_profile(id: T::MemberId) -> Result<Profile<T>, &'static str> {
        Self::member_profile(&id).ok_or("member profile not found")
    }

    /// Ensure that given member has given account as the controller account
    pub fn ensure_is_controller_account_for_member(
        member_id: &T::MemberId,
        account: &T::AccountId,
    ) -> Result<Profile<T>, ControllerAccountForMemberCheckFailed> {
        if MemberProfile::<T>::exists(member_id) {
            let profile = MemberProfile::<T>::get(member_id).unwrap();

            if profile.controller_account == *account {
                Ok(profile)
            } else {
                Err(ControllerAccountForMemberCheckFailed::NotControllerAccount)
            }
        } else {
            Err(ControllerAccountForMemberCheckFailed::NotMember)
        }
    }

    /// Returns true if account is either a member's root or controller account
    pub fn is_member_account(who: &T::AccountId) -> bool {
        <MemberIdsByRootAccountId<T>>::exists(who)
            || <MemberIdsByControllerAccountId<T>>::exists(who)
    }

    fn ensure_active_terms_id(
        terms_id: T::PaidTermId,
    ) -> Result<PaidMembershipTerms<T>, &'static str> {
        let active_terms = Self::active_paid_membership_terms();
        ensure!(
            active_terms.iter().any(|&id| id == terms_id),
            "paid terms id not active"
        );
        let terms = Self::paid_membership_terms_by_id(terms_id)
            .ok_or("paid membership term id does not exist")?;
        Ok(terms)
    }

    fn ensure_unique_handle(handle: &Vec<u8>) -> dispatch::Result {
        ensure!(!<Handles<T>>::exists(handle), "handle already registered");
        Ok(())
    }

    fn validate_handle(handle: &Vec<u8>) -> dispatch::Result {
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

    fn validate_text(text: &Vec<u8>) -> Vec<u8> {
        let mut text = text.clone();
        text.truncate(Self::max_about_text_length() as usize);
        text
    }

    fn validate_avatar(uri: &Vec<u8>) -> dispatch::Result {
        ensure!(
            uri.len() <= Self::max_avatar_uri_length() as usize,
            "avatar uri too long"
        );
        Ok(())
    }

    /// Basic user input validation
    fn check_user_registration_info(user_info: UserInfo) -> Result<CheckedUserInfo, &'static str> {
        // Handle is required during registration
        let handle = user_info
            .handle
            .ok_or("handle must be provided during registration")?;
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

    fn insert_member(
        who: &T::AccountId,
        user_info: &CheckedUserInfo,
        entry_method: EntryMethod<T>,
    ) -> T::MemberId {
        let new_member_id = Self::members_created();

        let profile: Profile<T> = Profile {
            handle: user_info.handle.clone(),
            avatar_uri: user_info.avatar_uri.clone(),
            about: user_info.about.clone(),
            registered_at_block: <system::Module<T>>::block_number(),
            registered_at_time: <timestamp::Module<T>>::now(),
            entry: entry_method,
            suspended: false,
            subscription: None,
            root_account: who.clone(),
            controller_account: who.clone(),
            roles: ActorInRoleSet::new(),
        };

        <MemberIdsByRootAccountId<T>>::mutate(who, |ids| {
            ids.push(new_member_id);
        });
        <MemberIdsByControllerAccountId<T>>::mutate(who, |ids| {
            ids.push(new_member_id);
        });

        <MemberProfile<T>>::insert(new_member_id, profile);
        <Handles<T>>::insert(user_info.handle.clone(), new_member_id);
        <MembersCreated<T>>::put(new_member_id + One::one());

        new_member_id
    }

    fn _change_member_about_text(id: T::MemberId, text: &Vec<u8>) -> dispatch::Result {
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

    /// Determines if the signing account is a controller account of a member that has the registered
    /// actor_in_role.
    pub fn key_can_sign_for_role(
        signing_account: &T::AccountId,
        actor_in_role: ActorInRole<T::ActorId>,
    ) -> bool {
        Self::member_ids_by_controller_account_id(signing_account)
            .iter()
            .any(|member_id| {
                let profile = Self::member_profile(member_id).unwrap(); // must exist
                profile.roles.has_registered_role(&actor_in_role)
            })
    }

    /// Returns true if member identified by their member id occupies a Role at least once
    pub fn member_is_in_role(member_id: T::MemberId, role: Role) -> bool {
        Self::ensure_profile(member_id)
            .ok()
            .map_or(false, |profile| profile.roles.occupies_role(role))
    }

    pub fn ensure_member_controller_account_signed(
        origin: T::Origin,
        member_id: &T::MemberId,
    ) -> Result<T::AccountId, MemberControllerAccountDidNotSign> {
        // Ensure transaction is signed.
        let signer_account =
            ensure_signed(origin).map_err(|_| MemberControllerAccountDidNotSign::UnsignedOrigin)?;

        // Ensure member exists
        let profile = Self::ensure_profile(member_id.clone())
            .map_err(|_| MemberControllerAccountDidNotSign::MemberIdInvalid)?;

        ensure!(
            profile.controller_account == signer_account,
            MemberControllerAccountDidNotSign::SignerControllerAccountMismatch
        );

        Ok(signer_account)
    }

    pub fn ensure_member_controller_account(
        signer_account: &T::AccountId,
        member_id: &T::MemberId,
    ) -> Result<(), MemberControllerAccountMismatch> {
        // Ensure member exists
        let profile = Self::ensure_profile(member_id.clone())
            .map_err(|_| MemberControllerAccountMismatch::MemberIdInvalid)?;

        ensure!(
            profile.controller_account == *signer_account,
            MemberControllerAccountMismatch::SignerControllerAccountMismatch
        );

        Ok(())
    }

    pub fn ensure_member_root_account(
        signer_account: &T::AccountId,
        member_id: &T::MemberId,
    ) -> Result<(), MemberRootAccountMismatch> {
        // Ensure member exists
        let profile = Self::ensure_profile(member_id.clone())
            .map_err(|_| MemberRootAccountMismatch::MemberIdInvalid)?;

        ensure!(
            profile.root_account == *signer_account,
            MemberRootAccountMismatch::SignerRootAccountMismatch
        );

        Ok(())
    }

    // policy across all roles is:
    // members can only occupy a role at most once at a time
    // members can enter any role
    // no limit on total number of roles a member can enter
    // ** Note ** Role specific policies should be enforced by the client modules
    // this method should handle higher level policies
    pub fn can_register_role_on_member(
        member_id: &T::MemberId,
        actor_in_role: &ActorInRole<T::ActorId>,
    ) -> Result<Profile<T>, &'static str> {
        // Ensure member exists
        let profile = Self::ensure_profile(*member_id)?;

        // ensure is active member
        ensure!(!profile.suspended, "SuspendedMemberCannotEnterRole");

        // guard against duplicate ActorInRole
        ensure!(
            !<MembershipIdByActorInRole<T>>::exists(actor_in_role),
            "ActorInRoleAlreadyExists"
        );

        /*
        Disabling this temporarily for Rome, later we will drop all this
        integration with Membership module anyway:
        https://github.com/Joystream/substrate-runtime-joystream/issues/115
        ensure!(
            !profile.roles.occupies_role(actor_in_role.role),
            "MemberAlreadyInRole"
        );
        */

        // Other possible checks:
        // How long the member has been registered
        // Minimum balance
        // EntryMethod

        Ok(profile)
    }

    pub fn register_role_on_member(
        member_id: T::MemberId,
        actor_in_role: &ActorInRole<T::ActorId>,
    ) -> Result<(), &'static str> {
        // Policy check
        let mut profile = Self::can_register_role_on_member(&member_id, actor_in_role)?;

        assert!(profile.roles.register_role(actor_in_role));

        <MemberProfile<T>>::insert(member_id, profile);
        <MembershipIdByActorInRole<T>>::insert(actor_in_role, member_id);
        Self::deposit_event(RawEvent::MemberRegisteredRole(member_id, *actor_in_role));
        Ok(())
    }

    pub fn can_unregister_role(actor_in_role: ActorInRole<T::ActorId>) -> Result<(), &'static str> {
        ensure!(
            <MembershipIdByActorInRole<T>>::exists(&actor_in_role),
            "ActorInRoleNotFound"
        );

        Ok(())
    }

    pub fn unregister_role(actor_in_role: ActorInRole<T::ActorId>) -> Result<(), &'static str> {
        Self::can_unregister_role(actor_in_role)?;

        let member_id = <MembershipIdByActorInRole<T>>::get(actor_in_role);

        let mut profile = Self::ensure_profile(member_id)?; // .expect().. ?

        assert!(profile.roles.unregister_role(&actor_in_role));

        // Note we do do not remove the mapping by convention, so attempting to register
        // same actor_in_role in future would fail. If the intent is to register it
        // again on another member, use transfer_role() instead.
        // ** Isn't is simpler to just remove it from map than to introduce a transfer function?

        <MemberProfile<T>>::insert(member_id, profile);

        Self::deposit_event(RawEvent::MemberUnregisteredRole(member_id, actor_in_role));

        Ok(())
    }

    pub fn can_transfer_role_to_member(
        actor_in_role: ActorInRole<T::ActorId>,
        member_id: T::MemberId,
    ) -> Result<(), &'static str> {
        // Ensure member exists
        let profile = Self::ensure_profile(member_id)?;

        // ensure is active member
        ensure!(!profile.suspended, "SuspendedMemberCannotEnterRole");

        // TODO: if above policy checks are identical to ones in can_register_role_on_member() factor them out
        // to a separate function

        // cannot transfer no-existant role
        ensure!(
            <MembershipIdByActorInRole<T>>::exists(actor_in_role),
            "CannotTransferNonExistentActorInRole"
        );
        Ok(())
    }

    pub fn transfer_role(
        actor_in_role: ActorInRole<T::ActorId>,
        new_member_id: T::MemberId,
    ) -> Result<(), &'static str> {
        Self::can_transfer_role_to_member(actor_in_role, new_member_id)?;
        Self::unregister_role(actor_in_role)?;
        let _ = <MembershipIdByActorInRole<T>>::remove(&actor_in_role);
        Self::register_role_on_member(new_member_id, &actor_in_role)
    }
}
