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
//! - [set_referral_cut](./struct.Module.html#method.set_referral_cut) -
//! updates the referral cut percent value.
//! - [transfer_invites](./struct.Module.html#method.transfer_invites) - transfers the invites
//! from one member to another.
//!
//! [Joystream handbook description](https://joystream.gitbook.io/joystream-handbook/subsystems/membership)

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
#![allow(clippy::unused_unit)]

pub mod benchmarking;
#[cfg(test)]
mod tests;
pub mod weights;
pub use weights::WeightInfo;

use codec::{Decode, Encode};
use frame_support::dispatch::DispatchError;
use frame_support::traits::{Currency, ExistenceRequirement, Get, LockIdentifier, WithdrawReasons};
pub use frame_support::weights::Weight;
use frame_support::{decl_error, decl_event, decl_module, decl_storage, ensure};
use frame_system::{ensure_root, ensure_signed};
use scale_info::TypeInfo;
use sp_arithmetic::{
    traits::{One, Zero},
    Perbill,
};
use sp_runtime::{
    traits::{Hash, Saturating},
    SaturatedConversion,
};
use sp_std::convert::TryInto;
use sp_std::vec::Vec;

use common::membership::{MemberOriginValidator, MembershipInfoProvider};
use common::working_group::{WorkingGroupAuthenticator, WorkingGroupBudgetHandler};
use staking_handler::StakingHandler;

#[cfg(feature = "runtime-benchmarks")]
pub use benchmarking::MembershipWorkingGroupHelper;

// Balance type alias
type BalanceOf<T> = <T as balances::Config>::Balance;

type WeightInfoMembership<T> = <T as Config>::WeightInfo;

pub trait Config:
    frame_system::Config
    + balances::Config
    + pallet_timestamp::Config
    + common::membership::MembershipTypes
{
    /// Membership module event type.
    type Event: From<Event<Self>> + Into<<Self as frame_system::Config>::Event>;

    /// Defines the default membership fee.
    type DefaultMembershipPrice: Get<BalanceOf<Self>>;

    /// Defines the maximum percent value of the membership fee for the referral cut.
    type ReferralCutMaximumPercent: Get<u8>;

    /// Working group pallet integration.
    type WorkingGroup: common::working_group::WorkingGroupAuthenticator<Self>
        + common::working_group::WorkingGroupBudgetHandler<Self::AccountId, BalanceOf<Self>>;

    /// Defines the default balance for the invited member.
    type DefaultInitialInvitationBalance: Get<BalanceOf<Self>>;

    /// Staking handler used for invited member staking.
    type InvitedMemberStakingHandler: StakingHandler<
        Self::AccountId,
        BalanceOf<Self>,
        Self::MemberId,
        LockIdentifier,
    >;

    /// Staking handler used for staking candidate.
    type StakingCandidateStakingHandler: StakingHandler<
        Self::AccountId,
        BalanceOf<Self>,
        Self::MemberId,
        LockIdentifier,
    >;

    /// Weight information for extrinsics in this pallet.
    type WeightInfo: WeightInfo;

    /// Stake needed to candidate as staking account.
    type CandidateStake: Get<BalanceOf<Self>>;
}

pub(crate) const DEFAULT_MEMBER_INVITES_COUNT: u32 = 5;

/// Public membership profile alias.
pub type Membership<T> = MembershipObject<<T as frame_system::Config>::AccountId>;

#[derive(Encode, Decode, PartialEq, Debug, Clone, TypeInfo)]
/// Stored information about a registered user.
pub struct MembershipObject<AccountId: Ord> {
    /// The hash of the handle chosen by member.
    pub handle_hash: Vec<u8>,

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

// Contain staking account to member binding and its confirmation.
#[derive(Encode, Decode, Default, Debug, PartialEq, TypeInfo)]
pub struct StakingAccountMemberBinding<MemberId> {
    /// Member id that we bind account to.
    pub member_id: MemberId,

    /// Confirmation that an account id is bound to a member.
    pub confirmed: bool,
}

/// Parameters for the buy_membership extrinsic.
#[derive(Encode, Decode, Clone, PartialEq, Debug, Eq, TypeInfo)]
pub struct BuyMembershipParameters<AccountId, MemberId> {
    /// New member root account.
    pub root_account: AccountId,

    /// New member controller account.
    pub controller_account: AccountId,

    /// New member handle.
    pub handle: Option<Vec<u8>>,

    /// Metadata concerning new member.
    pub metadata: Vec<u8>,

    /// Referrer member id.
    pub referrer_id: Option<MemberId>,
}

#[derive(Encode, Decode, Clone, PartialEq, Debug, Eq, TypeInfo)]
pub struct GiftMembershipParameters<AccountId, Balance> {
    /// New member root account.
    pub root_account: AccountId,

    /// New member controller account.
    pub controller_account: AccountId,

    /// New member handle.
    pub handle: Option<Vec<u8>>,

    /// Metadata concerning new member.
    pub metadata: Vec<u8>,

    /// Amount to transfer to controller_account
    pub credit_controller_account: Balance,

    /// Amount to lock of funds transferred to controller_account. If Some(x),
    /// x must be lte credit_controller_account_balance.
    pub apply_controller_account_invitation_lock: Option<Balance>,

    /// Amount to transfer to root_account
    pub credit_root_account: Balance,

    /// Amount to lock from funds transferred to root_account. If Some(x),
    /// x must be lte credit_root_account_balance
    pub apply_root_account_invitation_lock: Option<Balance>,
}

/// Parameters for the invite_member extrinsic.
#[derive(Encode, Decode, Clone, PartialEq, Debug, Eq, TypeInfo)]
pub struct InviteMembershipParameters<AccountId, MemberId> {
    /// Inviting member id.
    pub inviting_member_id: MemberId,

    /// New member root account.
    pub root_account: AccountId,

    /// New member controller account.
    pub controller_account: AccountId,

    /// New member handle.
    pub handle: Option<Vec<u8>>,

    /// Metadata concerning new member.
    pub metadata: Vec<u8>,
}

/// Parameters for the create_founding_member extrinsic.
#[derive(Encode, Decode, Clone, PartialEq, Debug, Eq, TypeInfo)]
pub struct CreateFoundingMemberParameters<AccountId> {
    /// New member root account.
    pub root_account: AccountId,

    /// New member controller account.
    pub controller_account: AccountId,

    /// New member handle.
    pub handle: Vec<u8>,

    /// Metadata concerning new member.
    pub metadata: Vec<u8>,
}

decl_error! {
    /// Membership module predefined errors
    pub enum Error for Module<T: Config> {
        /// Not enough balance to buy membership.
        NotEnoughBalanceToBuyMembership,

        /// Controller account required.
        ControllerAccountRequired,

        /// Root account required.
        RootAccountRequired,

        /// Unsigned origin.
        UnsignedOrigin,

        /// Member profile not found (invalid member id).
        MemberProfileNotFound,

        /// Handle already registered.
        HandleAlreadyRegistered,

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

        /// Staking account is registered for some member.
        StakingAccountIsAlreadyRegistered,

        /// Staking account for membership doesn't exist.
        StakingAccountDoesntExist,

        /// Staking account has already been confirmed.
        StakingAccountAlreadyConfirmed,

        /// Cannot invite a member. Working group balance is not sufficient to set the default
        /// balance.
        WorkingGroupBudgetIsNotSufficientForInviting,

        /// Cannot invite a member. The controller account has an existing conflicting lock.
        ConflictingLock,

        /// Cannot set a referral cut percent value. The limit was exceeded.
        CannotExceedReferralCutPercentLimit,

        /// Staking account contains conflicting stakes.
        ConflictStakesOnAccount,

        /// Insufficient balance to cover stake.
        InsufficientBalanceToCoverStake,

        /// Locked amount is greater than credit amount
        GifLockExceedsCredit,

        /// Gifter doesn't have sufficient balance to credit
        InsufficientBalanceToGift,
    }
}

decl_storage! {
    trait Store for Module<T: Config> as Membership {
        /// MemberId to assign to next member that is added to the registry, and is also the
        /// total number of members created. MemberIds start at Zero.
        pub NextMemberId get(fn members_created) : T::MemberId;

        /// Mapping of member's id to their membership profile.
        pub MembershipById get(fn membership) : map hasher(blake2_128_concat)
            T::MemberId => Option<Membership<T>>;

        /// Registered unique handles hash and their mapping to their owner.
        pub MemberIdByHandleHash get(fn handles) : map hasher(blake2_128_concat)
            Vec<u8> => T::MemberId;

        /// Referral cut percent of the membership fee to receive on buying the membership.
        pub ReferralCut get(fn referral_cut) : u8;

        /// Current membership price.
        pub MembershipPrice get(fn membership_price) : BalanceOf<T> =
            T::DefaultMembershipPrice::get();

        /// Initial invitation count for the newly bought membership.
        pub InitialInvitationCount get(fn initial_invitation_count) : u32  =
            DEFAULT_MEMBER_INVITES_COUNT;

        /// Initial invitation balance for the invited member.
        pub InitialInvitationBalance get(fn initial_invitation_balance) : BalanceOf<T> =
            T::DefaultInitialInvitationBalance::get();

        /// Double of a staking account id and member id to the confirmation status.
        pub(crate) StakingAccountIdMemberStatus get(fn staking_account_id_member_status):
            map hasher(blake2_128_concat) T::AccountId => StakingAccountMemberBinding<T::MemberId>;
    }
}

decl_event! {
    pub enum Event<T> where
        <T as common::membership::MembershipTypes>::MemberId,
        Balance = BalanceOf<T>,
        <T as frame_system::Config>::AccountId,
        BuyMembershipParameters = BuyMembershipParameters<
            <T as frame_system::Config>::AccountId,
            <T as common::membership::MembershipTypes>::MemberId,
            >,
        <T as common::membership::MembershipTypes>::ActorId,
        InviteMembershipParameters = InviteMembershipParameters<
            <T as frame_system::Config>::AccountId,
            <T as common::membership::MembershipTypes>::MemberId,
        >,
        CreateFoundingMemberParameters = CreateFoundingMemberParameters<
            <T as frame_system::Config>::AccountId
        >,
      GiftMembershipParameters = GiftMembershipParameters<
        <T as frame_system::Config>::AccountId,
        BalanceOf<T>,
      >,
    {
        MemberInvited(MemberId, InviteMembershipParameters),
        MembershipGifted(MemberId, GiftMembershipParameters),
        MembershipBought(MemberId, BuyMembershipParameters),
        MemberProfileUpdated(
            MemberId,
            Option<Vec<u8>>,
            Option<Vec<u8>>,
        ),
        MemberAccountsUpdated(MemberId, Option<AccountId>, Option<AccountId>),
        MemberVerificationStatusUpdated(MemberId, bool, ActorId),
        ReferralCutUpdated(u8),
        InvitesTransferred(MemberId, MemberId, u32),
        MembershipPriceUpdated(Balance),
        InitialInvitationBalanceUpdated(Balance),
        LeaderInvitationQuotaUpdated(u32),
        InitialInvitationCountUpdated(u32),
        StakingAccountAdded(AccountId, MemberId),
        StakingAccountRemoved(AccountId, MemberId),
        StakingAccountConfirmed(AccountId, MemberId),
        MemberRemarked(MemberId, Vec<u8>),
        FoundingMemberCreated(MemberId, CreateFoundingMemberParameters),
    }
}

decl_module! {
    pub struct Module<T: Config> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error<T>;

        fn deposit_event() = default;

        /// Exports const - default membership fee.
        const DefaultMembershipPrice: BalanceOf<T> = T::DefaultMembershipPrice::get();

        /// Exports const - maximum percent value of the membership fee for the referral cut.
        const ReferralCutMaximumPercent: u8 = T::ReferralCutMaximumPercent::get();

        /// Exports const - default balance for the invited member.
        const DefaultInitialInvitationBalance: BalanceOf<T> =
            T::DefaultInitialInvitationBalance::get();

        /// Exports const - Stake needed to candidate as staking account.
        const CandidateStake: BalanceOf<T> = T::CandidateStake::get();

        /// Exports const - invited member lock id.
        const InvitedMemberLockId: LockIdentifier = T::InvitedMemberStakingHandler::lock_id();

        /// Exports const - staking candidate lock id.
        const StakingCandidateLockId: LockIdentifier = T::StakingCandidateStakingHandler::lock_id();

        /// Non-members can buy membership.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (W + V + X + Y)` where:
        /// - `W` is the member name
        /// - `V` is the member handle
        /// - `X` is the member avatar uri
        /// - `Y` is the member about
        /// - DB:
        ///    - O(V)
        /// # </weight>
        #[weight = Module::<T>::calculate_weight_for_buy_membership(params)]
        pub fn buy_membership(
            origin,
            params: BuyMembershipParameters<T::AccountId, T::MemberId>
        ) {
            let who = ensure_signed(origin)?;

            let fee = Self::membership_price();

            // Ensure enough free balance to cover membership fee.
            ensure!(
                balances::Pallet::<T>::usable_balance(&who) >= fee,
                Error::<T>::NotEnoughBalanceToBuyMembership
            );

            let handle_hash = Self::get_handle_hash(
                &params.handle,
            )?;

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
                handle_hash,
                Self::initial_invitation_count(),
                false
            );

            // Collect membership fee (just burn it).
            let _ = balances::Pallet::<T>::slash(&who, fee);

            // Reward the referring member.
            if let Some(referrer) = referrer {
                let referral_cut: BalanceOf<T> = Self::get_referral_bonus();

                if referral_cut > Zero::zero() {
                    let _ = balances::Pallet::<T>::deposit_creating(
                        &referrer.controller_account,
                        referral_cut
                    );
                }
            }

            // Fire the event.
            Self::deposit_event(RawEvent::MembershipBought(member_id, params));
        }

        /// Update member's all or some of name, handle, avatar and about text.
        /// No effect if no changed fields.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (W)` where:
        /// - `W` is the handle length
        /// - DB:
        ///    - O(W)
        /// # </weight>
        #[weight = WeightInfoMembership::<T>::update_profile(
            handle.as_ref()
                .map(|handle| handle.len().saturated_into())
                .unwrap_or_default())
        ]
        pub fn update_profile(
            origin,
            member_id: T::MemberId,
            handle: Option<Vec<u8>>,
            metadata: Option<Vec<u8>>,
        ) {
            // No effect if no changes.
            if handle.is_none() && metadata.is_none() {
                return Ok(())
            }

            Self::ensure_member_controller_account_origin_signed(origin, &member_id)?;

            let membership = Self::ensure_membership(member_id)?;

            let new_handle_hash = handle.clone()
                .map(|handle| Self::get_handle_hash(&Some(handle)))
                .transpose()?;

            //
            // == MUTATION SAFE ==
            //

            if let Some(new_handle_hash) = new_handle_hash {
                // remove old handle hash
                <MemberIdByHandleHash<T>>::remove(&membership.handle_hash);

                <MemberIdByHandleHash<T>>::insert(new_handle_hash.clone(), member_id);

                <MembershipById<T>>::insert(&member_id, Membership::<T> {
                    handle_hash: new_handle_hash,
                    ..membership
                });
            }

            Self::deposit_event(RawEvent::MemberProfileUpdated(member_id, handle, metadata));
        }

        /// Updates member root or controller accounts. No effect if both new accounts are empty.
        ///
        /// <weight>
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = Module::<T>::calculate_weight_for_update_account(new_root_account, new_controller_account)]
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
            let membership = Self::ensure_membership(member_id)?;

            ensure!(membership.root_account == sender, Error::<T>::RootAccountRequired);

            //
            // == MUTATION SAFE ==
            //

            <MembershipById<T>>::insert(member_id, Membership::<T> {
                root_account: new_root_account.clone().unwrap_or(membership.root_account),
                controller_account: new_controller_account.clone().unwrap_or(membership.controller_account),
                ..membership
            });

            Self::deposit_event(RawEvent::MemberAccountsUpdated(
                member_id,
                new_root_account,
                new_controller_account
            ));
        }

        /// Updates member profile verification status. Requires working group member origin.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoMembership::<T>::update_profile_verification()]
        pub fn update_profile_verification(
            origin,
            worker_id: T::ActorId,
            target_member_id: T::MemberId,
            is_verified: bool
        ) {
            T::WorkingGroup::ensure_worker_origin(origin, &worker_id)?;

            let membership = Self::ensure_membership(target_member_id)?;

            //
            // == MUTATION SAFE ==
            //

            <MembershipById<T>>::insert(&target_member_id, Membership::<T> {
                verified: is_verified,
                ..membership
            });

            Self::deposit_event(
                RawEvent::MemberVerificationStatusUpdated(target_member_id, is_verified, worker_id)
            );
        }

        /// Updates membership referral cut percent value. Requires root origin.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoMembership::<T>::set_referral_cut()]
        pub fn set_referral_cut(origin, percent_value: u8) {
            ensure_root(origin)?;

            ensure!(
                percent_value <= T::ReferralCutMaximumPercent::get(),
                Error::<T>::CannotExceedReferralCutPercentLimit
            );

            //
            // == MUTATION SAFE ==
            //

            ReferralCut::put(percent_value);

            Self::deposit_event(RawEvent::ReferralCutUpdated(percent_value));
        }

        /// Transfers invites from one member to another.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoMembership::<T>::transfer_invites()]
        pub fn transfer_invites(
            origin,
            source_member_id: T::MemberId,
            target_member_id: T::MemberId,
            number_of_invites: u32
        ) {
            Self::ensure_member_controller_account_origin_signed(origin, &source_member_id)?;

            let source_membership = Self::ensure_membership(source_member_id)?;
            let target_membership = Self::ensure_membership_with_error(
                target_member_id,
                Error::<T>::CannotTransferInvitesForNotMember
            )?;

            ensure!(source_membership.invites >= number_of_invites, Error::<T>::NotEnoughInvites);

            //
            // == MUTATION SAFE ==
            //

            // Decrease source member invite number.
            <MembershipById<T>>::insert(&source_member_id, Membership::<T> {
                invites: source_membership.invites.saturating_sub(number_of_invites),
                ..source_membership
            });

            // Increase target member invite number.
            <MembershipById<T>>::insert(&target_member_id, Membership::<T> {
                invites: target_membership.invites.saturating_add(number_of_invites),
                ..target_membership
            });

            Self::deposit_event(RawEvent::InvitesTransferred(
                source_member_id,
                target_member_id,
                number_of_invites
            ));
        }

        /// Invite a new member.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (W + V + X + Y)` where:
        /// - `W` is the member name
        /// - `V` is the member handle
        /// - `X` is the member avatar uri
        /// - `Y` is the member about
        /// - DB:
        ///    - O(V)
        /// # </weight>
        // TODO: adjust weight
        #[weight = WeightInfoMembership::<T>::invite_member(
            Module::<T>::text_length_unwrap_or_default(&params.handle),
            params.metadata.len().saturated_into(),
        )]
        pub fn invite_member(
            origin,
            params: InviteMembershipParameters<T::AccountId, T::MemberId>
        ) {
            let membership = Self::ensure_member_controller_account_origin_signed(
                origin,
                &params.inviting_member_id
            )?;

            ensure!(membership.invites > Zero::zero(), Error::<T>::NotEnoughInvites);

            let handle_hash = Self::get_handle_hash(
                &params.handle,
            )?;

            let current_wg_budget = T::WorkingGroup::get_budget();
            let invitation_balance = Self::initial_invitation_balance();

            ensure!(
                invitation_balance <= current_wg_budget,
                Error::<T>::WorkingGroupBudgetIsNotSufficientForInviting
            );

            // Check for existing invitation locks.
            ensure!(
                T::InvitedMemberStakingHandler::is_account_free_of_conflicting_stakes(
                    &params.controller_account
                ),
                Error::<T>::ConflictingLock,
            );

            //
            // == MUTATION SAFE ==
            //

            let invited_member_id = Self::insert_member(
                &params.root_account,
                &params.controller_account,
                handle_hash,
                Zero::zero(),
                false
            );

            // Save the updated profile.
            <MembershipById<T>>::insert(&params.inviting_member_id, Membership::<T> {
                invites: membership.invites.saturating_sub(1),
                ..membership
            });

            // Transfer the balance from tne WG budget to the controller account.
            T::WorkingGroup::withdraw(&params.controller_account, invitation_balance);

            // Lock invitation balance. Allow only transaction payments.
            T::InvitedMemberStakingHandler::lock_with_reasons(
                &params.controller_account,
                invitation_balance,
                WithdrawReasons::except(WithdrawReasons::TRANSACTION_PAYMENT)
            );

            // Fire the event.
            Self::deposit_event(RawEvent::MemberInvited(invited_member_id, params));
        }

        /// Gift a membership using own funds. Gifter does not need to be a member.
        /// Can optinally apply a lock on a portion of the funds transferred to root and controller
        /// accounts. Gifter also pays the membership fee.
        #[weight = WeightInfoMembership::<T>::gift_membership(
            Module::<T>::text_length_unwrap_or_default(&params.handle),
            params.metadata.len().saturated_into(),
        )]
        pub fn gift_membership(
            origin,
            params: GiftMembershipParameters<T::AccountId, BalanceOf<T>>,
        ) {
            let gifter = ensure_signed(origin)?;

            let handle_hash = Self::get_handle_hash(
                &params.handle,
            )?;

            // Check that gifter has sufficient funds
            let membership_fee = Self::membership_price();
            let gifter_usable_balance = balances::Pallet::<T>::usable_balance(&gifter);
            let total_credit = params
                .credit_controller_account
                .saturating_add(params.credit_root_account);

            ensure!(
                balances::Pallet::<T>::can_slash(&gifter, membership_fee.saturating_add(total_credit)),
                Error::<T>::InsufficientBalanceToGift
            );

            ensure!(
                gifter_usable_balance >= total_credit,
                Error::<T>::InsufficientBalanceToGift
            );

            if let Some(locked) = params.apply_controller_account_invitation_lock {
                ensure!(
                    params.credit_controller_account >= locked,
                    Error::<T>::GifLockExceedsCredit
                );
            };

            if let Some(locked) = params.apply_root_account_invitation_lock {
                ensure!(
                    params.credit_root_account >= locked,
                    Error::<T>::GifLockExceedsCredit
                );
            };

            // Check for existing invitation locks on controller account.
            ensure!(
                T::InvitedMemberStakingHandler::is_account_free_of_conflicting_stakes(
                    &params.controller_account
                ),
                Error::<T>::ConflictingLock,
            );

            // Check for existing invitation locks on root account if not same
            // as controller account.
            if params.root_account != params.controller_account {
                ensure!(
                    T::InvitedMemberStakingHandler::is_account_free_of_conflicting_stakes(
                        &params.root_account
                    ),
                    Error::<T>::ConflictingLock,
                );
            }

            //
            // == MUTATION SAFE ==
            //

            // Transfer funds to controller account
            <balances::Pallet::<T> as Currency<T::AccountId>>::transfer(
                &gifter,
                &params.controller_account,
                params.credit_controller_account,
                ExistenceRequirement::KeepAlive
            )?;

            // Transfer funds to root account
            <balances::Pallet::<T> as Currency<T::AccountId>>::transfer(
                &gifter,
                &params.root_account,
                params.credit_root_account,
                ExistenceRequirement::KeepAlive
            )?;

            // slash fee, balance_not_slashed should be zero
            let (_negative_imbalance, balance_not_slashed) = balances::Pallet::<T>::slash(
                &gifter,
                membership_fee
            );

            // Ensure the entire fee was slashed. This should not fail
            // since we checked for sufficient usable balance.
            ensure!(
                balance_not_slashed == Zero::zero(),
                Error::<T>::InsufficientBalanceToGift
            );

            if params.root_account != params.controller_account {
                // Lock credited balance. Allow only transaction payments.
                if let Some(locked_balance) = params.apply_root_account_invitation_lock {
                    T::InvitedMemberStakingHandler::lock_with_reasons(
                        &params.root_account,
                        locked_balance,
                        WithdrawReasons::except(WithdrawReasons::TRANSACTION_PAYMENT)
                    );
                };
                // Lock credited balance. Allow only transaction payments.
                if let Some(locked_balance) = params.apply_controller_account_invitation_lock {
                    T::InvitedMemberStakingHandler::lock_with_reasons(
                        &params.controller_account,
                        locked_balance,
                        WithdrawReasons::except(WithdrawReasons::TRANSACTION_PAYMENT)
                    );
                };
            } else {
                let locked_balance: BalanceOf<T> = params
                    .apply_controller_account_invitation_lock
                    .unwrap_or_else(Zero::zero)
                    .saturating_add(
                        params
                            .apply_root_account_invitation_lock
                            .unwrap_or_else(Zero::zero),
                    )
                    .saturated_into();

                if !locked_balance.is_zero() {
                    T::InvitedMemberStakingHandler::lock_with_reasons(
                        &params.root_account,
                        locked_balance,
                        WithdrawReasons::except(WithdrawReasons::TRANSACTION_PAYMENT)
                    );
                }
            }

            // Create new membership
            let invited_member_id = Self::insert_member(
                &params.root_account,
                &params.controller_account,
                handle_hash,
                Zero::zero(),
                false,
            );

            Self::deposit_event(RawEvent::MembershipGifted(invited_member_id, params));
        }

        /// Updates membership price. Requires root origin.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoMembership::<T>::set_membership_price()]
        pub fn set_membership_price(origin, new_price: BalanceOf<T>) {
            ensure_root(origin)?;

            //
            // == MUTATION SAFE ==
            //

            <MembershipPrice<T>>::put(new_price);

            Self::deposit_event(RawEvent::MembershipPriceUpdated(new_price));
        }

        /// Updates leader invitation quota. Requires root origin.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoMembership::<T>::set_leader_invitation_quota()]
        pub fn set_leader_invitation_quota(origin, invitation_quota: u32) {
            ensure_root(origin)?;

            let leader_member_id = T::WorkingGroup::get_leader_member_id();

            // ensure!(leader_member_id.is_some(), Error::<T>::WorkingGroupLeaderNotSet);

            let member_id = leader_member_id.ok_or(Error::<T>::WorkingGroupLeaderNotSet)?;

            // Membership must exist!
            let membership = Self::ensure_membership(member_id)?;

            //
            // == MUTATION SAFE ==
            //

            <MembershipById<T>>::insert(member_id, Membership::<T> {
                invites: invitation_quota,
                ..membership
            });

            Self::deposit_event(RawEvent::LeaderInvitationQuotaUpdated(invitation_quota));
        }

        /// Updates initial invitation balance for a invited member. Requires root origin.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoMembership::<T>::set_initial_invitation_balance()]
        pub fn set_initial_invitation_balance(origin, new_initial_balance: BalanceOf<T>) {
            ensure_root(origin)?;

            //
            // == MUTATION SAFE ==
            //

            <InitialInvitationBalance<T>>::put(new_initial_balance);

            Self::deposit_event(RawEvent::InitialInvitationBalanceUpdated(new_initial_balance));
        }

        /// Updates initial invitation count for a member. Requires root origin.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoMembership::<T>::set_initial_invitation_count()]
        pub fn set_initial_invitation_count(origin, new_invitation_count: u32) {
            ensure_root(origin)?;

            //
            // == MUTATION SAFE ==
            //

            InitialInvitationCount::put(new_invitation_count);

            Self::deposit_event(RawEvent::InitialInvitationCountUpdated(new_invitation_count));
        }

        /// Add staking account candidate for a member.
        /// The membership must be confirmed before usage.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoMembership::<T>::add_staking_account_candidate()]
        pub fn add_staking_account_candidate(origin, member_id: T::MemberId) {
            let staking_account_id = ensure_signed(origin)?;

            ensure!(
                !Self::staking_account_registered(&staking_account_id),
                Error::<T>::StakingAccountIsAlreadyRegistered
            );

            Self::ensure_membership(member_id)?;

            ensure!(
              T::StakingCandidateStakingHandler::is_account_free_of_conflicting_stakes(
                  &staking_account_id
              ),
              Error::<T>::ConflictStakesOnAccount
            );

            ensure!(
                T::StakingCandidateStakingHandler::is_enough_balance_for_stake(
                    &staking_account_id,
                    T::CandidateStake::get()
                ),
                Error::<T>::InsufficientBalanceToCoverStake
            );

            //
            // == MUTATION SAFE ==
            //

            T::StakingCandidateStakingHandler::lock(
                &staking_account_id,
                T::CandidateStake::get(),
            );

            <StakingAccountIdMemberStatus<T>>::insert(
                staking_account_id.clone(),
                StakingAccountMemberBinding {
                    member_id,
                    confirmed: false,
                }
            );

            Self::deposit_event(RawEvent::StakingAccountAdded(staking_account_id, member_id));
        }

        /// Remove staking account for a member.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoMembership::<T>::remove_staking_account()]
        pub fn remove_staking_account(origin, member_id: T::MemberId) {
            let staking_account_id = ensure_signed(origin)?;

            Self::ensure_membership(member_id)?;

            ensure!(
                Self::staking_account_registered_for_member(&staking_account_id, &member_id),
                Error::<T>::StakingAccountDoesntExist
            );

            //
            // == MUTATION SAFE ==
            //

            T::StakingCandidateStakingHandler::unlock(&staking_account_id);

            <StakingAccountIdMemberStatus<T>>::remove(staking_account_id.clone());

            Self::deposit_event(RawEvent::StakingAccountRemoved(staking_account_id, member_id));
        }

        /// Confirm staking account candidate for a member.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoMembership::<T>::confirm_staking_account()]
        pub fn confirm_staking_account(
            origin,
            member_id: T::MemberId,
            staking_account_id: T::AccountId,
        ) {
            Self::ensure_member_controller_account_origin_signed(origin, &member_id)?;

            ensure!(
                Self::staking_account_registered_for_member(&staking_account_id, &member_id),
                Error::<T>::StakingAccountDoesntExist
            );

            ensure!(
                !Self::staking_account_confirmed(&staking_account_id, &member_id),
                Error::<T>::StakingAccountAlreadyConfirmed
            );

            //
            // == MUTATION SAFE ==
            //

            <StakingAccountIdMemberStatus<T>>::insert(
                staking_account_id.clone(),
                StakingAccountMemberBinding {
                    member_id,
                    confirmed: true,
                }
            );

            Self::deposit_event(RawEvent::StakingAccountConfirmed(staking_account_id, member_id));
        }

        /// Member makes a remark
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoMembership::<T>::member_remark()]
        pub fn member_remark(origin, member_id: T::MemberId, msg: Vec<u8>) {
            let sender = ensure_signed(origin)?;
            Self::ensure_is_controller_account_for_member(&member_id, &sender)?;

            //
            // == MUTATION SAFE ==
            //

            Self::deposit_event(RawEvent::MemberRemarked(member_id, msg));
        }

        /// Create a founding member profile as root.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (I + J)` where:
        /// - `I` is the length of the handle
        /// - `J` is the length of the metadata
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoMembership::<T>::create_founding_member(
            params.handle.len() as u32,
            params.metadata.len() as u32
        )]
        pub fn create_founding_member(
            origin,
            params: CreateFoundingMemberParameters<T::AccountId>
        ) {
            ensure_root(origin)?;

            let handle_hash = Self::get_handle_hash(&Some(params.handle.clone()))?;

            //
            // == MUTATION SAFE ==
            //

            let member_id = Self::insert_member(
                &params.root_account,
                &params.controller_account,
                handle_hash,
                Self::initial_invitation_count(),
                true
            );

            // Fire the event.
            Self::deposit_event(RawEvent::FoundingMemberCreated(member_id, params));
        }
    }
}

impl<T: Config> Module<T> {
    // Helper for update_account extrinsic weight calculation
    fn calculate_weight_for_update_account(
        new_root_account: &Option<T::AccountId>,
        new_controller_account: &Option<T::AccountId>,
    ) -> Weight {
        match (new_root_account.is_some(), new_controller_account.is_some()) {
            (true, true) => WeightInfoMembership::<T>::update_accounts_both(),
            (false, true) => WeightInfoMembership::<T>::update_accounts_root(),
            (true, false) => WeightInfoMembership::<T>::update_accounts_controller(),
            _ => WeightInfoMembership::<T>::update_accounts_both(),
        }
    }

    // Helper for buy_membership extrinsic weight calculation
    // TODO: adjust weight
    fn calculate_weight_for_buy_membership(
        params: &BuyMembershipParameters<T::AccountId, T::MemberId>,
    ) -> Weight {
        if params.referrer_id.is_some() {
            WeightInfoMembership::<T>::buy_membership_with_referrer(
                Self::text_length_unwrap_or_default(&params.handle),
                params.metadata.len().saturated_into(),
            )
        } else {
            WeightInfoMembership::<T>::buy_membership_without_referrer(
                Self::text_length_unwrap_or_default(&params.handle),
                params.metadata.len().saturated_into(),
            )
        }
    }

    fn text_length_unwrap_or_default(text: &Option<Vec<u8>>) -> u32 {
        text.as_ref()
            .map(|handle| handle.len().saturated_into())
            .unwrap_or_default()
    }

    /// Provided that the member_id exists return its membership. Returns error otherwise.
    pub fn ensure_membership(member_id: T::MemberId) -> Result<Membership<T>, Error<T>> {
        Self::ensure_membership_with_error(member_id, Error::<T>::MemberProfileNotFound)
    }

    /// Provided that the member_id exists return its membership. Returns provided error otherwise.
    fn ensure_membership_with_error(
        id: T::MemberId,
        error: Error<T>,
    ) -> Result<Membership<T>, Error<T>> {
        Self::membership(id).ok_or(error)
    }

    // Ensure possible member handle hash is unique.
    fn ensure_unique_handle_hash(handle_hash: Vec<u8>) -> Result<(), Error<T>> {
        ensure!(
            !<MemberIdByHandleHash<T>>::contains_key(handle_hash),
            Error::<T>::HandleAlreadyRegistered
        );
        Ok(())
    }

    // Validate handle and return its hash.
    fn get_handle_hash(handle: &Option<Vec<u8>>) -> Result<Vec<u8>, Error<T>> {
        // Handle is required during registration
        let handle = handle
            .as_ref()
            .ok_or(Error::<T>::HandleMustBeProvidedDuringRegistration)?;

        if handle.is_empty() {
            return Err(Error::<T>::HandleMustBeProvidedDuringRegistration);
        }

        let hashed = T::Hashing::hash(handle);
        let handle_hash = hashed.as_ref().to_vec();

        Self::ensure_unique_handle_hash(handle_hash.clone())?;

        Ok(handle_hash)
    }

    // Inserts a member using a validated information. Sets handle, accounts caches, etc..
    fn insert_member(
        root_account: &T::AccountId,
        controller_account: &T::AccountId,
        handle_hash: Vec<u8>,
        allowed_invites: u32,
        verified: bool,
    ) -> T::MemberId {
        let new_member_id = Self::members_created();

        let membership: Membership<T> = MembershipObject {
            handle_hash: handle_hash.clone(),
            root_account: root_account.clone(),
            controller_account: controller_account.clone(),
            verified,
            invites: allowed_invites,
        };

        <MembershipById<T>>::insert(new_member_id, membership);
        <MemberIdByHandleHash<T>>::insert(handle_hash, new_member_id);

        <NextMemberId<T>>::put(new_member_id + One::one());

        new_member_id
    }

    // Ensure origin corresponds to the controller account of the member.
    fn ensure_member_controller_account_origin_signed(
        origin: T::Origin,
        member_id: &T::MemberId,
    ) -> Result<Membership<T>, Error<T>> {
        // Ensure transaction is signed.
        let signer_account_id = ensure_signed(origin).map_err(|_| Error::<T>::UnsignedOrigin)?;

        Self::ensure_is_controller_account_for_member(member_id, &signer_account_id)
    }

    // Ensure that given member has given account as the controller account
    fn ensure_is_controller_account_for_member(
        member_id: &T::MemberId,
        account: &T::AccountId,
    ) -> Result<Membership<T>, Error<T>> {
        let membership = Self::ensure_membership(*member_id)?;

        ensure!(
            membership.controller_account == *account,
            Error::<T>::ControllerAccountRequired
        );

        Ok(membership)
    }

    // Calculate current referral bonus as a percent of the membership fee.
    pub(crate) fn get_referral_bonus() -> BalanceOf<T> {
        let membership_fee = Self::membership_price();
        let referral_cut = Self::referral_cut();

        let referral_cut = Perbill::from_percent(referral_cut.into()) * membership_fee;

        // Cannot be greater than 100%
        referral_cut.min(membership_fee)
    }

    // Verifies registration of the staking account for ANY member.
    fn staking_account_registered(staking_account_id: &T::AccountId) -> bool {
        <StakingAccountIdMemberStatus<T>>::contains_key(staking_account_id)
    }

    // Verifies registration of the staking account for SOME member.
    fn staking_account_registered_for_member(
        staking_account_id: &T::AccountId,
        member_id: &T::MemberId,
    ) -> bool {
        if !Self::staking_account_registered(staking_account_id) {
            return false;
        }

        let member_status = Self::staking_account_id_member_status(staking_account_id);

        member_status.member_id == *member_id
    }

    // Verifies confirmation of the staking account.
    fn staking_account_confirmed(
        staking_account_id: &T::AccountId,
        member_id: &T::MemberId,
    ) -> bool {
        if !Self::staking_account_registered_for_member(staking_account_id, member_id) {
            return false;
        }

        let member_status = Self::staking_account_id_member_status(staking_account_id);

        member_status.confirmed
    }
}

impl<T: Config> common::StakingAccountValidator<T> for Module<T> {
    fn is_member_staking_account(
        member_id: &common::MemberId<T>,
        account_id: &T::AccountId,
    ) -> bool {
        Self::staking_account_confirmed(account_id, member_id)
    }
}

impl<T: Config> MemberOriginValidator<T::Origin, T::MemberId, T::AccountId> for Module<T> {
    fn ensure_member_controller_account_origin(
        origin: T::Origin,
        actor_id: T::MemberId,
    ) -> Result<T::AccountId, DispatchError> {
        let signer_account_id = ensure_signed(origin).map_err(|_| Error::<T>::UnsignedOrigin)?;

        Self::ensure_is_controller_account_for_member(&actor_id, &signer_account_id)?;

        Ok(signer_account_id)
    }

    fn is_member_controller_account(member_id: &T::MemberId, account_id: &T::AccountId) -> bool {
        Self::ensure_is_controller_account_for_member(member_id, account_id).is_ok()
    }
}

impl<T: Config> MembershipInfoProvider<T> for Module<T> {
    fn controller_account_id(
        member_id: common::MemberId<T>,
    ) -> Result<T::AccountId, DispatchError> {
        let membership = Self::ensure_membership(member_id)?;

        Ok(membership.controller_account)
    }
}
