use codec::Codec;
use frame_support::dispatch::DispatchError;
use frame_support::Parameter;
use sp_arithmetic::traits::BaseArithmetic;
use sp_runtime::traits::{MaybeSerialize, MaybeSerializeDeserialize, Member};

/// Member id type alias
pub type MemberId<T> = <T as MembershipTypes>::MemberId;

/// Actor id type alias
pub type ActorId<T> = <T as MembershipTypes>::ActorId;

/// Generic trait for membership dependent pallets.
pub trait MembershipTypes: frame_system::Trait {
    /// Describes the common type for the members.
    type MemberId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + Ord
        + PartialEq;

    /// Describes the common type for the working group members (workers).
    type ActorId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + MaybeSerializeDeserialize
        + Ord
        + PartialEq;
}

/// Validates staking account ownership for a member.
pub trait StakingAccountValidator<T: MembershipTypes> {
    /// Verifies that staking account bound to the member.
    fn is_member_staking_account(member_id: &MemberId<T>, account_id: &T::AccountId) -> bool;
}

/// Membership validator for the origin(account_id) and member_id (eg.: thread author id).
pub trait MemberOriginValidator<Origin, MemberId, AccountId> {
    /// Check for valid combination of origin and member_id. Returns member controller account ID.
    fn ensure_member_controller_account_origin(
        origin: Origin,
        member_id: MemberId,
    ) -> Result<AccountId, DispatchError>;

    /// Verifies that provided account is the controller account of the member
    fn is_member_controller_account(member_id: &MemberId, account_id: &AccountId) -> bool;
}

/// Gives access to some membership information.
pub trait MembershipInfoProvider<T: MembershipTypes> {
    /// Returns current controller account for a member.
    fn controller_account_id(member_id: MemberId<T>) -> Result<T::AccountId, DispatchError>;
}
