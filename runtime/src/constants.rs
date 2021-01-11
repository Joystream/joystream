use crate::{BlockNumber, Moment};
use frame_support::parameter_types;
use frame_support::traits::LockIdentifier;
use sp_std::collections::btree_set::BTreeSet;

/// Constants for Babe.

/// Since BABE is probabilistic this is the average expected block time that
/// we are targetting. Blocks will be produced at a minimum duration defined
/// by `SLOT_DURATION`, but some slots will not be allocated to any
/// authority and hence no block will be produced. We expect to have this
/// block time on average following the defined slot duration and the value
/// of `c` configured for BABE (where `1 - c` represents the probability of
/// a slot being empty).
/// This value is only used indirectly to define the unit constants below
/// that are expressed in blocks. The rest of the code should use
/// `SLOT_DURATION` instead (like the timestamp module for calculating the
/// minimum period).
/// <https://research.web3.foundation/en/latest/polkadot/BABE/Babe/#6-practical-results>
pub const MILLISECS_PER_BLOCK: Moment = 6000;
pub const SECS_PER_BLOCK: Moment = MILLISECS_PER_BLOCK / 1000;

pub const SLOT_DURATION: Moment = 6000;
pub const BONDING_DURATION: u32 = 24;

pub const EPOCH_DURATION_IN_BLOCKS: BlockNumber = 10 * MINUTES;
pub const EPOCH_DURATION_IN_SLOTS: u64 = {
    const SLOT_FILL_RATE: f64 = MILLISECS_PER_BLOCK as f64 / SLOT_DURATION as f64;

    (EPOCH_DURATION_IN_BLOCKS as f64 * SLOT_FILL_RATE) as u64
};

// These time units are defined in number of blocks.
pub const MINUTES: BlockNumber = 60 / (SECS_PER_BLOCK as BlockNumber);
pub const HOURS: BlockNumber = MINUTES * 60;
pub const DAYS: BlockNumber = HOURS * 24;

// 1 in 4 blocks (on average, not counting collisions) will be primary babe blocks.
pub const PRIMARY_PROBABILITY: (u64, u64) = (1, 4);

parameter_types! {
    pub const VotingLockId: LockIdentifier = [0; 8];
    pub const CandidacyLockId: LockIdentifier = [1; 8];
    pub const CouncilorLockId: LockIdentifier = [2; 8];
    pub const ProposalsLockId: LockIdentifier = [5; 8];
    pub const StorageWorkingGroupLockId: LockIdentifier = [6; 8];
    pub const ContentWorkingGroupLockId: LockIdentifier = [7; 8];
    pub const ForumGroupLockId: LockIdentifier = [8; 8];
    pub const MembershipWorkingGroupLockId: LockIdentifier = [9; 8];
    pub const InvitedMemberLockId: LockIdentifier = [10; 8];
}

lazy_static! {
    // pairs of allowed lock combinations
    pub static ref ALLOWED_LOCK_COMBINATIONS: BTreeSet<(LockIdentifier, LockIdentifier)> = [
        // format: `(lock_id, [all_compatible_lock_ids, ...])`
        (ForumGroupLockId::get(), [
            ContentWorkingGroupLockId::get(),
            StorageWorkingGroupLockId::get(),
            ProposalsLockId::get(),
            CandidacyLockId::get(),
            CouncilorLockId::get(),
            VotingLockId::get(),
            MembershipWorkingGroupLockId::get(),
            InvitedMemberLockId::get(),
        ]),
        (ContentWorkingGroupLockId::get(), [
            ForumGroupLockId::get(),
            StorageWorkingGroupLockId::get(),
            ProposalsLockId::get(),
            CandidacyLockId::get(),
            CouncilorLockId::get(),
            VotingLockId::get(),
            MembershipWorkingGroupLockId::get(),
            InvitedMemberLockId::get(),
        ]),
        (StorageWorkingGroupLockId::get(), [
            ForumGroupLockId::get(),
            ContentWorkingGroupLockId::get(),
            ProposalsLockId::get(),
            CandidacyLockId::get(),
            CouncilorLockId::get(),
            VotingLockId::get(),
            MembershipWorkingGroupLockId::get(),
            InvitedMemberLockId::get(),
        ]),
        (ProposalsLockId::get(), [
            ForumGroupLockId::get(),
            ContentWorkingGroupLockId::get(),
            StorageWorkingGroupLockId::get(),
            CandidacyLockId::get(),
            CouncilorLockId::get(),
            VotingLockId::get(),
            MembershipWorkingGroupLockId::get(),
            InvitedMemberLockId::get(),
        ]),
        (CandidacyLockId::get(), [
            ForumGroupLockId::get(),
            ContentWorkingGroupLockId::get(),
            StorageWorkingGroupLockId::get(),
            ProposalsLockId::get(),
            CouncilorLockId::get(),
            VotingLockId::get(),
            MembershipWorkingGroupLockId::get(),
            InvitedMemberLockId::get(),
        ]),
        (CouncilorLockId::get(), [
            ForumGroupLockId::get(),
            ContentWorkingGroupLockId::get(),
            StorageWorkingGroupLockId::get(),
            ProposalsLockId::get(),
            CandidacyLockId::get(),
            VotingLockId::get(),
            MembershipWorkingGroupLockId::get(),
            InvitedMemberLockId::get(),
        ]),
        (VotingLockId::get(), [
            ForumGroupLockId::get(),
            ContentWorkingGroupLockId::get(),
            StorageWorkingGroupLockId::get(),
            ProposalsLockId::get(),
            CandidacyLockId::get(),
            CouncilorLockId::get(),
            MembershipWorkingGroupLockId::get(),
            InvitedMemberLockId::get(),
        ]),
        (MembershipWorkingGroupLockId::get(), [
            ForumGroupLockId::get(),
            ContentWorkingGroupLockId::get(),
            StorageWorkingGroupLockId::get(),
            ProposalsLockId::get(),
            CandidacyLockId::get(),
            CouncilorLockId::get(),
            MembershipWorkingGroupLockId::get(),
            InvitedMemberLockId::get(),
        ]),
         (InvitedMemberLockId::get(), [
            ForumGroupLockId::get(),
            ContentWorkingGroupLockId::get(),
            StorageWorkingGroupLockId::get(),
            ProposalsLockId::get(),
            CandidacyLockId::get(),
            CouncilorLockId::get(),
            MembershipWorkingGroupLockId::get(),
            InvitedMemberLockId::get(),
        ]),
    ]
    .iter()
    .fold(BTreeSet::new(), |mut acc, item| {
        for lock_id in &item.1 {
            acc.insert((item.0, *lock_id));
        }

        acc
    });
}

/// Tests only
#[cfg(any(feature = "std", test))]
pub mod currency {
    use crate::primitives::Balance;

    pub const MILLICENTS: Balance = 1_000_000_000;
    pub const CENTS: Balance = 1_000 * MILLICENTS; // assume this is worth about a cent.
    pub const DOLLARS: Balance = 100 * CENTS;

    pub const fn deposit(items: u32, bytes: u32) -> Balance {
        items as Balance * 15 * CENTS + (bytes as Balance) * 6 * CENTS
    }
}
