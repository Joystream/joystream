use frame_support::parameter_types;
use frame_support::traits::LockIdentifier;

parameter_types! {
    pub const VotingLockId: LockIdentifier = *b"voting  ";
    pub const CandidacyLockId: LockIdentifier = *b"candidac";
    pub const CouncilorLockId: LockIdentifier = *b"councilo";
    pub const ProposalsLockId: LockIdentifier = *b"proposal";
    pub const StorageWorkingGroupLockId: LockIdentifier = *b"wg-storg";
    pub const ContentWorkingGroupLockId: LockIdentifier = *b"wg-contt";
    pub const ForumGroupLockId: LockIdentifier = *b"wg-forum";
    pub const MembershipWorkingGroupLockId: LockIdentifier = *b"wg-membr";
    pub const InvitedMemberLockId: LockIdentifier = *b"invitemb";
    pub const BoundStakingAccountLockId: LockIdentifier = *b"boundsta";
    pub const BountyLockId: LockIdentifier = *b"bounty  ";
    pub const OperationsWorkingGroupAlphaLockId: LockIdentifier = *b"wg-opera";
    pub const AppWorkingGroupLockId: LockIdentifier = *b"wg-gatew";
    pub const OperationsWorkingGroupBetaLockId: LockIdentifier = *b"wg-operb";
    pub const OperationsWorkingGroupGammaLockId: LockIdentifier = *b"wg-operg";
    pub const DistributionWorkingGroupLockId: LockIdentifier = *b"wg-distr";
}

// Staking lock ID used by nomination and validation in the staking pallet.
// This is a copy because the current Substrate staking lock ID is not exported.
pub const STAKING_LOCK_ID: LockIdentifier = *b"staking ";

pub const VESTING_LOCK_ID: LockIdentifier = *b"vesting ";
