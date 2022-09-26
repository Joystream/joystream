//! This pallet works with crowd funded bounties that allows a member, or the council, to crowd
//! fund work on projects with a public benefit.
//!
//! ### Bounty stages
//! - Funding - a bounty is being funded.
//! - NoFundingContributed - a bounty is expired. It can be only canceled.
//! - WorkSubmission - interested participants can submit their work.
//! - Judgment - working periods ended and the oracle should provide their judgment,
//!     winner work entrants receive their rewards, losers are slashed.
//!  for his work.
//! - SuccessfulBountyWithdrawal - contributors' funder state bloat bonds can be withdrawn,
//!     none judged work entrants can unlock their stakes, Oracle can withdraw his reward
//! - FailedBountyWithdrawal - contributors' funds +  funder state bloat bonds can be withdrawn
//!     along with a split cherry, none judged work entrants can unlock their stakes,
//!     Oracle can withdraw his reward,
//!
//! A detailed description could be found [here](https://github.com/Joystream/joystream/issues/1998).
//!
//! ### Supported extrinsics
//! - [create_bounty](./struct.Module.html#method.create_bounty) - creates a bounty
//!
//! #### Funding stage
//! - [terminate_bounty](./struct.Module.html#method.terminate_bounty) - terminate bounty (into failed stage or remove bounty).
//! - [fund_bounty](./struct.Module.html#method.fund_bounty) - provide funding for a bounty
//! - [switch_oracle](./struct.Module.html#method.switch_oracle) - switch the current oracle by another one.
//!
//! #### NoFundingContributed stage
//! - [terminate_bounty](./struct.Module.html#method.terminate_bounty) - terminate bounty (into failed stage or remove bounty).
//! - [switch_oracle](./struct.Module.html#method.switch_oracle) - switch the current oracle by another one.
//!
//! #### Work submission stage
//! - [announce_work_entry](./struct.Module.html#method.announce_work_entry) - announce
//! work entry for a successful bounty.
//! - [switch_oracle](./struct.Module.html#method.switch_oracle) - switch the current oracle
//! by another one.
//! - [submit_work](./struct.Module.html#method.submit_work) - submit work for a bounty.
//! - [end_working_period](./struct.Module.html#method.end_working_period) - end working period by oracle.
//! - [terminate_bounty](./struct.Module.html#method.terminate_bounty) - terminate bounty (into failed stage or remove bounty).
//!
//! #### Judgment stage
//! - [submit_oracle_judgment](./struct.Module.html#method.submit_oracle_judgment) - submits an
//! oracle judgment for a bounty.
//!  - [switch_oracle](./struct.Module.html#method.switch_oracle) - switch the current oracle
//! by another one.
//! - [terminate_bounty](./struct.Module.html#method.terminate_bounty) - terminate bounty (into failed stage or remove bounty).
//!
//! #### SuccessfulBountyWithdrawal stage
//! - [withdraw_entrant_stake](./struct.Module.html#method.withdraw_entrant_stake) -
//! unlock stake accounts refering to none judged work entries.
//!  - [withdraw_funding](./struct.Module.html#method.withdraw_funding) -
//! withdraw contributor's state bloat bond.
//!
//! #### FailedBountyWithdrawal stage
//!  - [withdraw_entrant_stake](./struct.Module.html#method.withdraw_entrant_stake) -
//! unlock stake accounts refering to none judged work entries.
//! - [withdraw_funding](./struct.Module.html#method.withdraw_funding) - Contributors can withdraw
//! funding for a failed bounty + a cherry fraction + state bloat bond.

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
#![allow(clippy::unused_unit)]
#![cfg_attr(
    not(any(test, feature = "runtime-benchmarks")),
    deny(clippy::panic),
    deny(clippy::panic_in_result_fn),
    deny(clippy::unwrap_used),
    deny(clippy::expect_used),
    deny(clippy::indexing_slicing),
    deny(clippy::integer_arithmetic),
    deny(clippy::match_on_vec_items),
    deny(clippy::unreachable)
)]

#[cfg(not(any(test, feature = "runtime-benchmarks")))]
#[allow(unused_imports)]
#[macro_use]
extern crate common;

#[cfg(test)]
pub(crate) mod tests;

mod actors;
mod stages;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;

pub mod weights;
pub use weights::WeightInfo;

type WeightInfoBounty<T> = <T as Config>::WeightInfo;

pub(crate) use actors::BountyActorManager;

// use council::Balance;
pub(crate) use stages::BountyStageCalculator;

use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

use common::council::CouncilBudgetManager;
use common::membership::{
    MemberId, MemberOriginValidator, MembershipInfoProvider, StakingAccountValidator,
};
use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::traits::{Currency, ExistenceRequirement, Get, LockIdentifier};
use frame_support::weights::Weight;
use frame_support::{
    decl_error, decl_event, decl_module, decl_storage, ensure, PalletId, Parameter,
};
use frame_system::ensure_root;
use scale_info::TypeInfo;
use sp_arithmetic::traits::{One, Saturating, Zero};
use sp_runtime::traits::AccountIdConversion;
use sp_runtime::{Perbill, SaturatedConversion};
use sp_std::collections::btree_map::BTreeMap;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::convert::TryInto;
use sp_std::vec::Vec;
use staking_handler::StakingHandler;

/// Main pallet-bounty trait.
pub trait Config:
    frame_system::Config + balances::Config + common::membership::MembershipTypes
{
    /// Events
    type Event: From<Event<Self>> + Into<<Self as frame_system::Config>::Event>;

    /// The bounty's module id, used for deriving its sovereign account ID.
    type ModuleId: Get<PalletId>;

    /// Bounty Id type
    type BountyId: From<u32> + Parameter + Default + Copy;

    /// Validates staking account ownership for a member, member ID and origin combination and
    /// providers controller id for a member.
    type Membership: StakingAccountValidator<Self>
        + MembershipInfoProvider<Self>
        + MemberOriginValidator<Self::Origin, MemberId<Self>, Self::AccountId>;

    /// Weight information for extrinsics in this pallet.
    type WeightInfo: WeightInfo;

    /// Provides an access for the council budget.
    type CouncilBudgetManager: CouncilBudgetManager<Self::AccountId, BalanceOf<Self>>;

    /// Provides stake logic implementation.
    type StakingHandler: StakingHandler<
        Self::AccountId,
        BalanceOf<Self>,
        MemberId<Self>,
        LockIdentifier,
    >;

    /// Work entry Id type
    type EntryId: From<u32> + Parameter + Default + Copy + Ord + One;

    /// Defines max work entry number for a closed assurance type contract bounty.
    type ClosedContractSizeLimit: Get<u32>;

    /// Defines min work entrant stake for a bounty.
    type MinWorkEntrantStake: Get<BalanceOf<Self>>;

    /// Current state bloat bond a funder has to pay to contribute (one time payment).
    /// The funder can withdraw the bond after deleting the BountyContributions entry belonging to him
    type FunderStateBloatBondAmount: Get<BalanceOf<Self>>;

    /// Current state bloat bond a creator has to pay to create a bounty.
    /// The creator can withdraw the bond after he or someone else removes the bounty
    type CreatorStateBloatBondAmount: Get<BalanceOf<Self>>;
}

/// Alias type for the BountyParameters.
pub type BountyCreationParameters<T> = BountyParameters<
    BalanceOf<T>,
    <T as frame_system::Config>::BlockNumber,
    <T as common::membership::MembershipTypes>::MemberId,
>;

/// Defines who can submit the work.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo)]
pub enum AssuranceContractType<MemberId: Ord> {
    /// Anyone can submit the work.
    Open,

    /// Only specific members can submit the work.
    Closed(BTreeSet<MemberId>),
}

impl<MemberId: Ord> Default for AssuranceContractType<MemberId> {
    fn default() -> Self {
        AssuranceContractType::Open
    }
}

/// Defines funding conditions.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo)]
pub enum FundingType<BlockNumber, Balance> {
    /// Funding has no time limits.
    Perpetual {
        /// Desired funding.
        target: Balance,
    },

    /// Funding has a time limitation.
    Limited {
        /// Desired funding.
        target: Balance,

        /// target allowed funding period.
        funding_period: BlockNumber,
    },
}

impl<BlockNumber, Balance: Default> Default for FundingType<BlockNumber, Balance> {
    fn default() -> Self {
        Self::Perpetual {
            target: Default::default(),
        }
    }
}

/// Defines parameters for the bounty creation.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug, TypeInfo)]
pub struct BountyParameters<Balance, BlockNumber, MemberId: Ord> {
    /// Origin that will select winner(s), is either a given member or a council.
    pub oracle: BountyActor<MemberId>,

    /// Contract type defines who can submit the work.
    pub contract_type: AssuranceContractType<MemberId>,

    /// Bounty creator: could be a member or a council.
    pub creator: BountyActor<MemberId>,

    /// An amount of funding provided by the creator which will be split among all other
    /// contributors should the bounty be successful. If not successful, cherry is returned to
    /// the creator. When council is creating bounty, this comes out of their budget, when a member
    /// does it, it comes from an account.
    pub cherry: Balance,

    /// A reward provided by the creator which will be attributed to the
    /// oracle should the oracle submit a Judgment. even if this Judgment is negative, this reward should be attributed to
    /// the oracle. When council is creating bounty, this comes out of their budget, when a member
    /// does it, it comes from an account.
    pub oracle_reward: Balance,

    /// Amount of stake required to enter bounty as entrant.
    pub entrant_stake: Balance,

    /// Defines parameters for different funding types.
    pub funding_type: FundingType<BlockNumber, Balance>,
}

/// Bounty actor to perform operations for a bounty.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo)]
pub enum BountyActor<MemberId> {
    /// Council performs operations for a bounty.
    Council,

    /// Member performs operations for a bounty.
    Member(MemberId),
}

impl<MemberId> Default for BountyActor<MemberId> {
    fn default() -> Self {
        BountyActor::Council
    }
}

/// Defines current bounty stage.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Copy)]
pub enum BountyStage {
    /// Bounty funding stage.
    Funding {
        /// Bounty has already some contributions.
        has_contributions: bool,
    },

    /// Bounty funding period expired with no contributions.
    NoFundingContributed,

    /// A bounty has gathered necessary funds and ready to accept work submissions.
    WorkSubmission,

    /// Working periods ended and the oracle should provide their judgment.
    Judgment,

    /// Indicates a withdrawal on bounty success. Workers get rewards and their stake.
    SuccessfulBountyWithdrawal,

    /// Indicates a withdrawal on bounty failure. Workers get their stake back. Funders
    /// get their contribution back as well as part of the cherry.
    FailedBountyWithdrawal,
}

/// Defines current bounty state.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo)]
pub enum BountyMilestone<BlockNumber> {
    /// Bounty was created at given block number.
    ///
    /// Boolean value defines whether the bounty has some funding contributions.
    ///
    /// This state will tranlate into:
    /// - BountyStage::Funding while now <= (created_at + funding_period) and total_funding < target
    /// - BountyStage::NoFundingContributed if now > (created_at + funding_period) and
    ///     has_contributions is false (total_funding = 0)
    /// - BountyStage::WorkSubmission if total_funding >= target and if now > (created_at + funding_period)
    Created {
        /// Bounty creation block.
        created_at: BlockNumber,
        /// Bounty has already some contributions.
        has_contributions: bool,
    },

    /// A bounty funding was successful and it exceeded max funding amount.
    ///
    /// This state will tranlate into:
    /// - BountyStage::WorkSubmission if total_funding >= target
    BountyMaxFundingReached,

    /// Oracle ended the work submission stage.
    ///
    /// This state will tranlate into:
    /// - BountyStage::Judgment if active_work_entry_count > 0
    WorkSubmitted,

    /// Council terminated this bounty
    ///
    /// This state will tranlate into
    /// - BountyStage::FailedBountyWithdrawal if bounty stage is in
    ///     Funding (with contributions and/or oracle reward),
    ///     NoFundingContributed (with oracle reward), WorkSubmission or Judgment
    Terminated,

    /// A judgment was submitted for a bounty.
    ///
    /// This state will tranlate into:
    /// - BountyStage::FailedBountyWithdrawal if successful_bounty is false
    /// - BountyStage::SuccessfulBountyWithdrawal if successful_bounty is true
    JudgmentSubmitted {
        ///This flag indicates the judgment result (there is at least one work entrant winner),
        successful_bounty: bool,
    },
}

impl<BlockNumber: Default> Default for BountyMilestone<BlockNumber> {
    fn default() -> Self {
        BountyMilestone::Created {
            created_at: Default::default(),
            has_contributions: false,
        }
    }
}

/// Alias type for the Bounty.
pub type Bounty<T> = BountyRecord<
    BalanceOf<T>,
    <T as frame_system::Config>::BlockNumber,
    <T as common::membership::MembershipTypes>::MemberId,
>;

/// Crowdfunded bounty record.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug, TypeInfo)]
pub struct BountyRecord<Balance, BlockNumber, MemberId: Ord> {
    /// Bounty creation parameters.
    pub creation_params: BountyParameters<Balance, BlockNumber, MemberId>,

    /// Total funding balance reached so far.
    /// Includes initial funding by a creator and other members funding.
    pub total_funding: Balance,

    /// Bounty current milestone(state). It represents fact known about the bounty, eg.:
    /// it was canceled or max funding amount was reached.
    pub milestone: BountyMilestone<BlockNumber>,

    /// Current active work entry counter.
    pub active_work_entry_count: u32,

    ///This flag is set to false, if oracle called withdraw_oracle_reward.
    pub has_unpaid_oracle_reward: bool,
}

impl<Balance: PartialOrd + Clone, BlockNumber: Clone, MemberId: Ord>
    BountyRecord<Balance, BlockNumber, MemberId>
{
    // Increments bounty active work entry counter.
    fn increment_active_work_entry_counter(&mut self) {
        self.active_work_entry_count = self.active_work_entry_count.saturating_add(1);
    }

    // Decrements bounty active work entry counter. Nothing happens on zero counter.
    fn decrement_active_work_entry_counter(&mut self) {
        if self.active_work_entry_count > 0 {
            self.active_work_entry_count = self.active_work_entry_count.saturating_sub(1);
        }
    }

    // Defines whether the target funding amount will be reached for the current funding type.
    fn is_target_funding_reached(&self, total_funding: Balance) -> bool {
        let target = match self.creation_params.funding_type {
            FundingType::Perpetual { ref target } => target.clone(),
            FundingType::Limited { ref target, .. } => target.clone(),
        };

        total_funding >= target
    }

    // Returns the target funding amount for the current funding type.
    pub(crate) fn target_funding(&self) -> Balance {
        match self.creation_params.funding_type {
            FundingType::Perpetual { ref target } => target.clone(),
            FundingType::Limited { ref target, .. } => target.clone(),
        }
    }
}

/// Alias type for the Entry.
pub type Entry<T> = EntryRecord<
    <T as frame_system::Config>::AccountId,
    <T as common::membership::MembershipTypes>::MemberId,
    <T as frame_system::Config>::BlockNumber,
>;

/// Work entry.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug, TypeInfo)]
pub struct EntryRecord<AccountId, MemberId, BlockNumber> {
    /// Work entrant member ID.
    pub member_id: MemberId,

    /// Account ID for staking lock.
    pub staking_account_id: AccountId,

    /// Work entry submission block.
    pub submitted_at: BlockNumber,

    /// Signifies that an entry has at least one submitted work.
    pub work_submitted: bool,
}

/// Defines the oracle judgment for the work entry.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo)]
pub enum OracleWorkEntryJudgment<Balance> {
    /// The work entry is selected as a winner.
    Winner { reward: Balance },

    /// The work entry is considered harmful. The stake will be slashed.
    Rejected {
        ///The percent share (0 - 1) to slash.
        slashing_share: Perbill,

        /// After slash takes place the rest of the locked balance will be unlocked,
        /// the council has the option to give description why slash happened.
        action_justification: Vec<u8>,
    },
}

impl<Balance> OracleWorkEntryJudgment<Balance> {
    // Work entry judgment helper. Returns true for winners.
    pub(crate) fn is_winner(&self) -> bool {
        matches!(*self, Self::Winner { .. })
    }
}

/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as balances::Config>::Balance;

// Entrant stake helper struct.
struct RequiredStakeInfo<T: Config> {
    // stake amount
    amount: BalanceOf<T>,
    // staking_account_id
    account_id: T::AccountId,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo)]
#[scale_info(skip_type_params(T))]
pub struct Contribution<T: Config> {
    // contribution amount
    amount: BalanceOf<T>,
    // amount of bloat bond a funder had to paid
    funder_state_bloat_bond_amount: BalanceOf<T>,
}
impl<T: Config> Contribution<T> {
    ///Adds amount_to_add to the contribution amount,
    fn add_funds(&self, amount_to_add: BalanceOf<T>) -> Contribution<T> {
        Contribution::<T> {
            amount: self.amount.saturating_add(amount_to_add),
            funder_state_bloat_bond_amount: self.funder_state_bloat_bond_amount,
        }
    }

    ///Returns the sum of state bloat and amount
    fn total_bloat_bond_and_funding(&self) -> BalanceOf<T> {
        self.amount
            .saturating_add(self.funder_state_bloat_bond_amount)
    }
}

impl<T: Config> Default for Contribution<T> {
    fn default() -> Self {
        Self {
            amount: Zero::zero(),
            funder_state_bloat_bond_amount: T::FunderStateBloatBondAmount::get(),
        }
    }
}
/// An alias for the OracleJudgment.
pub type OracleJudgmentOf<T> = OracleJudgment<<T as Config>::EntryId, BalanceOf<T>>;

/// The collection of the oracle judgments for the work entries.
pub type OracleJudgment<EntryId, Balance> = BTreeMap<EntryId, OracleWorkEntryJudgment<Balance>>;

/// Represents a valid stage for doing withdrawals,
/// is used as a safe internal representation of validation step in `withdraw_funding` extrinsic.
enum ValidWithdrawalStage {
    FailedBountyWithdrawal,
    SuccessfulBountyWithdrawal,
}

/// Represents a valid stage for terminating a bounty,
/// is used as a safe internal representation of validation step in `terminate_bounty` extrinsic.
enum ValidTerminateBountyStage {
    ValidTerminationRemoveBounty,
    ValidTerminationToFailedStage,
}

decl_storage! {
    trait Store for Module<T: Config> as Bounty {
        /// Bounty storage.
        pub Bounties get(fn bounties) : map hasher(blake2_128_concat) T::BountyId => Bounty<T>;

        /// Double map for bounty funding. It stores a member or council funding for bounties.
        pub BountyContributions get(fn contribution_by_bounty_by_actor): double_map
            hasher(blake2_128_concat) T::BountyId,
            hasher(blake2_128_concat) BountyActor<MemberId<T>> => Contribution<T>;

        /// Count of all bounties that have been created.
        pub BountyCount get(fn bounty_count): u32;

        /// Work entry storage map.
        pub Entries get(fn entries): double_map
            hasher(blake2_128_concat) T::BountyId,
            hasher(blake2_128_concat) T::EntryId => Option<Entry<T>>;

        /// Count of all work entries that have been created.
        pub EntryCount get(fn entry_count): u32;
    }
}

decl_event! {
    pub enum Event<T>
    where
        <T as Config>::BountyId,
        <T as Config>::EntryId,
        Balance = BalanceOf<T>,
        MemberId = MemberId<T>,
        <T as frame_system::Config>::AccountId,
        BountyCreationParameters = BountyCreationParameters<T>,
        OracleJudgment = OracleJudgmentOf<T>,
    {
        /// A bounty was created.
        /// Params:
        /// - bounty ID
        /// - creation parameters
        /// - bounty metadata
        BountyCreated(BountyId, BountyCreationParameters, Vec<u8>),

        /// Bounty Oracle Switched by current oracle or council.
        /// Params:
        /// - bounty ID
        /// - switcher
        /// - current_oracle,
        /// - new oracle
        BountyOracleSwitched(BountyId, BountyActor<MemberId>, BountyActor<MemberId>, BountyActor<MemberId>),

        /// A bounty was terminated by council.
        /// Params:
        /// - bounty ID
        /// - bounty terminator
        /// - bounty creator
        /// - bounty oracle
        BountyTerminated(BountyId, BountyActor<MemberId>, BountyActor<MemberId>, BountyActor<MemberId>),

        /// A bounty was funded by a member or a council.
        /// Params:
        /// - bounty ID
        /// - bounty funder
        /// - funding amount
        BountyFunded(BountyId, BountyActor<MemberId>, Balance),

        /// A bounty has reached its target funding amount.
        /// Params:
        /// - bounty ID
        BountyMaxFundingReached(BountyId),

        /// A member or a council has withdrawn the funding.
        /// Params:
        /// - bounty ID
        /// - bounty funder
        BountyFundingWithdrawal(BountyId, BountyActor<MemberId>),

        /// A bounty creator has withdrawn the cherry (member or council).
        /// Params:
        /// - bounty ID
        /// - bounty creator
        BountyCreatorCherryWithdrawal(BountyId, BountyActor<MemberId>),

        /// A bounty creator has withdrawn the oracle reward (member or council).
        /// Params:
        /// - bounty ID
        /// - bounty creator
        BountyCreatorOracleRewardWithdrawal(BountyId, BountyActor<MemberId>),

        /// A Oracle has withdrawn the oracle reward (member or council).
        /// Params:
        /// - bounty ID
        /// - bounty creator
        /// - Oracle Reward
        BountyOracleRewardWithdrawal(BountyId, BountyActor<MemberId>, Balance),

        /// A bounty was removed.
        /// Params:
        /// - bounty ID
        BountyRemoved(BountyId),

        /// Work entry was announced.
        /// Params:
        /// - bounty ID
        /// - created entry ID
        /// - entrant member ID
        /// - staking account ID
        /// - work description
        WorkEntryAnnounced(BountyId, EntryId, MemberId, AccountId, Vec<u8>),

        /// Submit work.
        /// Params:
        /// - bounty ID
        /// - created entry ID
        /// - entrant member ID
        /// - work data (description, URL, BLOB, etc.)
        WorkSubmitted(BountyId, EntryId, MemberId, Vec<u8>),

        /// Submit oracle judgment.
        /// Params:
        /// - bounty ID
        /// - oracle
        /// - judgment data
        /// - rationale
        OracleJudgmentSubmitted(BountyId, BountyActor<MemberId>, OracleJudgment, Vec<u8>),

        /// Work entry was slashed.
        /// Params:
        /// - bounty ID
        /// - entry ID
        /// - entrant member ID
        WorkEntrantFundsWithdrawn(BountyId, EntryId, MemberId),

        /// Bounty contributor made a message remark
        /// Params:
        /// - contributor
        /// - bounty id
        /// - message
        BountyContributorRemarked(BountyActor<MemberId>, BountyId, Vec<u8>),

        /// Bounty oracle made a message remark
        /// Params:
        /// - oracle
        /// - bounty id
        /// - message
        BountyOracleRemarked(BountyActor<MemberId>, BountyId, Vec<u8>),

        /// Bounty entrant made a message remark
        /// Params:
        /// - entrant_id
        /// - bounty id
        /// - entry id
        /// - message
        BountyEntrantRemarked(MemberId, BountyId, EntryId, Vec<u8>),

        /// Bounty creator made a message remark
        /// Params:
        /// - creator
        /// - bounty id
        /// - message
        BountyCreatorRemarked(BountyActor<MemberId>, BountyId, Vec<u8>),

        /// Work entry was slashed.
        /// Params:
        /// - bounty ID
        /// - oracle (caller)
        WorkSubmissionPeriodEnded(BountyId, BountyActor<MemberId>),

        /// Work entry stake unlocked.
        /// Params:
        /// - bounty ID
        /// - entry ID
        /// - stake account
        WorkEntrantStakeUnlocked(
            BountyId,
            EntryId,
            AccountId),

        /// Work entry stake slashed.
        /// Params:
        /// - bounty ID
        /// - entry ID
        /// - stake account
        /// - slashed amount
        WorkEntrantStakeSlashed(
            BountyId,
            EntryId,
            AccountId,
            Balance),

        /// A member or a council funder has withdrawn the funder state bloat bond.
        /// Params:
        /// - bounty ID
        /// - bounty funder
        /// - funder State bloat bond amount
        FunderStateBloatBondWithdrawn(
            BountyId,
            BountyActor<MemberId>,
            Balance),

        /// A member or a council creator has withdrawn the creator state bloat bond.
        /// Params:
        /// - bounty ID
        /// - bounty creator
        /// - Creator State bloat bond amount
        CreatorStateBloatBondWithdrawn(
            BountyId,
            BountyActor<MemberId>,
            Balance),
    }
}

decl_error! {
    /// Bounty pallet predefined errors
    pub enum Error for Module<T: Config> {
        /// Unexpected arithmetic error (overflow / underflow)
        ArithmeticError,

        /// Min funding amount cannot be greater than max amount.
        MinFundingAmountCannotBeGreaterThanMaxAmount,

        /// Bounty doesnt exist.
        BountyDoesntExist,

        /// Origin is root, so switching oracle is not allowed in this extrinsic. (call switch_oracle_as_root)
        SwitchOracleOriginIsRoot,

        /// Unexpected bounty stage for an operation: Funding.
        InvalidStageUnexpectedFunding,

        /// Unexpected bounty stage for an operation: NoFundingContributed.
        InvalidStageUnexpectedNoFundingContributed,

        /// Unexpected bounty stage for an operation: Cancelled.
        InvalidStageUnexpectedCancelled,

        /// Unexpected bounty stage for an operation: WorkSubmission.
        InvalidStageUnexpectedWorkSubmission,

        /// Unexpected bounty stage for an operation: Judgment.
        InvalidStageUnexpectedJudgment,

        /// Unexpected bounty stage for an operation: SuccessfulBountyWithdrawal.
        InvalidStageUnexpectedSuccessfulBountyWithdrawal,

        /// Unexpected bounty stage for an operation: FailedBountyWithdrawal.
        InvalidStageUnexpectedFailedBountyWithdrawal,

        /// Insufficient balance for a bounty cherry.
        InsufficientBalanceForBounty,

        /// Cannot found bounty contribution.
        NoBountyContributionFound,

        /// There is not enough balance for a stake.
        InsufficientBalanceForStake,

        /// The conflicting stake discovered. Cannot stake.
        ConflictingStakes,

        /// Work entry doesnt exist.
        WorkEntryDoesntExist,

        /// Cherry less than minimum allowed.
        CherryLessThenMinimumAllowed,

        /// Incompatible assurance contract type for a member: cannot submit work to the 'closed
        /// assurance' bounty contract.
        CannotSubmitWorkToClosedContractBounty,

        /// Cannot create a 'closed assurance contract' bounty with empty member list.
        ClosedContractMemberListIsEmpty,

        /// Cannot create a 'closed assurance contract' bounty with member list larger
        /// than allowed max work entry limit.
        ClosedContractMemberListIsTooLarge,

        /// 'closed assurance contract' bounty member list can only include existing members
        ClosedContractMemberNotFound,

        /// Provided oracle member id does not belong to an existing member
        InvalidOracleMemberId,

        /// Staking account doesn't belong to a member.
        InvalidStakingAccountForMember,

        /// Cannot set zero reward for winners.
        ZeroWinnerReward,

        /// The total reward for winners should be equal to total bounty funding.
        TotalRewardShouldBeEqualToTotalFunding,

        /// Cannot create a bounty with an entrant stake is less than required minimum.
        EntrantStakeIsLessThanMininum,

        /// Cannot create a bounty with zero funding amount parameter.
        FundingAmountCannotBeZero,

        /// Cannot create a bounty with zero funding period parameter.
        FundingPeriodCannotBeZero,

        /// Invalid judgment - all winners should have work submissions.
        WinnerShouldHasWorkSubmission,

        /// Bounty contributor not found
        InvalidContributorActorSpecified,

        /// Bounty oracle not found
        InvalidOracleActorSpecified,

        /// Member specified is not an entrant worker
        InvalidEntrantWorkerSpecified,

        /// Invalid Creator Actor for Bounty specified
        InvalidCreatorActorSpecified,

        ///Worker tried to access a work entry that doesn't belong to him
        WorkEntryDoesntBelongToWorker,

        ///Oracle have already been withdrawn
        OracleRewardAlreadyWithdrawn
    }
}

decl_module! {
    /// Bounty pallet Substrate Module
    pub struct Module<T: Config> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error<T>;

        /// Emits an event. Default substrate implementation.
        fn deposit_event() = default;

        /// Exports const - max work entry number for a closed assurance type contract bounty.
        const ClosedContractSizeLimit: u32 = T::ClosedContractSizeLimit::get();

        /// Exports const - min work entrant stake for a bounty.
        const MinWorkEntrantStake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        /// Exports const - funder state bloat bond amount for a bounty.
        const FunderStateBloatBondAmount: BalanceOf<T> = T::FunderStateBloatBondAmount::get();

        /// Exports const - creator state bloat bond amount for a bounty.
        const CreatorStateBloatBondAmount: BalanceOf<T> = T::CreatorStateBloatBondAmount::get();

        /// Creates a bounty. Metadata stored in the transaction log but discarded after that.
        /// <weight>
        ///
        /// ## Weight
        /// `O (W)` where:
        /// - `W` is the _metadata length.
        /// - `M` is closed contract member list length.
        /// - DB:
        ///    - O(M) (O(1) on open contract)
        /// # </weight>
        #[weight = Module::<T>::create_bounty_weight(params, metadata)]
        pub fn create_bounty(origin, params: BountyCreationParameters<T>, metadata: Vec<u8>) {

            let bounty_creator_manager = BountyActorManager::<T>::ensure_bounty_actor_manager(
                origin,
                params.creator.clone()
            )?;

            Self::ensure_create_bounty_parameters_valid(&params)?;

            let amount = params.cherry
            .saturating_add(params.oracle_reward)
            .saturating_add(T::CreatorStateBloatBondAmount::get());
            bounty_creator_manager.validate_balance_sufficiency(amount)?;

            //
            // == MUTATION SAFE ==
            //

            let next_bounty_count_value = Self::bounty_count().saturating_add(1);
            let bounty_id = T::BountyId::from(next_bounty_count_value);

            bounty_creator_manager.transfer_funds_to_bounty_account(bounty_id, amount);

            let created_bounty_milestone = BountyMilestone::Created {
                created_at: Self::current_block(),
                has_contributions: false, // just created - no contributions
            };

            let bounty = Bounty::<T> {
                total_funding: Zero::zero(),
                creation_params: params.clone(),
                milestone: created_bounty_milestone,
                active_work_entry_count: 0,
                has_unpaid_oracle_reward: params.oracle_reward > Zero::zero()
            };

            <Bounties<T>>::insert(bounty_id, bounty);
            BountyCount::mutate(|count| {
                *count = next_bounty_count_value
            });
            Self::deposit_event(RawEvent::BountyCreated(bounty_id, params, metadata));
        }

        /// Provides bounty funding.
        /// # <weight>
        ///
        /// ## weight
        /// `O (1)`
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoBounty::<T>::fund_bounty_by_member()
              .max(WeightInfoBounty::<T>::fund_bounty_by_council())]
        pub fn fund_bounty(
            origin,
            funder: BountyActor<MemberId<T>>,
            bounty_id: T::BountyId,
            amount: BalanceOf<T>
        ) {
            let bounty_funder_manager = BountyActorManager::<T>::ensure_bounty_actor_manager(
                origin,
                funder.clone(),
            )?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);

            ensure!(
                matches!(current_bounty_stage, BountyStage::Funding{..}),
                Self::unexpected_bounty_stage_error(current_bounty_stage),
            );

            let is_target_funding_reached = bounty.is_target_funding_reached(
                bounty.total_funding.saturating_add(amount));

            //contribution is adjusted to prevent exceeding target funding.
            //If funder already contributed transfer_amount is equal to adjusted_amount
            let (current_contribution,
                adjusted_amount,
                transfer_amount
                ) = Self::get_adjusted_contribution(
                    &bounty_id,
                    &bounty,
                    &funder,
                    amount,
                    is_target_funding_reached);

            bounty_funder_manager.validate_balance_sufficiency(
                transfer_amount)?;

            //
            // == MUTATION SAFE ==
            //

            bounty_funder_manager.transfer_funds_to_bounty_account(
                bounty_id,
                transfer_amount);

            let new_milestone = Self::get_bounty_milestone_on_funding(
                is_target_funding_reached,
                bounty.milestone);

            // Update bounty record.
            <Bounties<T>>::mutate(bounty_id, |bounty| {
                //Updates only the funds not the bloat bond.
                bounty.total_funding = bounty.total_funding.saturating_add(adjusted_amount);
                bounty.milestone = new_milestone;
            });

            //Update member funding record
            <BountyContributions<T>>::insert(
                bounty_id, funder.clone(),
                current_contribution.add_funds(adjusted_amount)
                );

            // Fire events.
            Self::deposit_event(RawEvent::BountyFunded(bounty_id, funder, adjusted_amount));

            if is_target_funding_reached{
                Self::deposit_event(RawEvent::BountyMaxFundingReached(bounty_id));
            }
        }

        /// Terminates a bounty in funding, funding expired,
        /// worksubmission, judging period.
        /// # <weight>
        ///
        /// ## weight
        /// `O (1)`
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoBounty::<T>::terminate_bounty_w_oracle_reward_funding_expired()
              .max(WeightInfoBounty::<T>::terminate_bounty_wo_oracle_reward_funding_expired())
              .max(WeightInfoBounty::<T>::terminate_bounty_w_oracle_reward_wo_funds_funding())
              .max(WeightInfoBounty::<T>::terminate_bounty_wo_oracle_reward_wo_funds_funding())
              .max(WeightInfoBounty::<T>::terminate_bounty_w_oracle_reward_w_funds_funding())
              .max(WeightInfoBounty::<T>::terminate_bounty_wo_oracle_reward_w_funds_funding())
              .max(WeightInfoBounty::<T>::terminate_bounty_work_or_judging_period())]
        pub fn terminate_bounty(origin, bounty_id: T::BountyId) {

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;


            let terminate_bounty_actor_manager = BountyActorManager::<T>::ensure_bounty_actor_manager(
                origin,
                bounty.creation_params.creator.clone(),
            )?;

            //If origin is council then
            //Stage can be NoFundingContributed, Funding, WorkSubmission or Judgment

            ////If origin is creator (not council) then
            //Stage can be NoFundingContributed, Funding

            let terminate_bounty_validation = Self::ensure_terminate_bounty_stage(&bounty_id,
                &bounty,
                &terminate_bounty_actor_manager)?;

            //
            // == MUTATION SAFE ==
            //

            match terminate_bounty_validation {
                ValidTerminateBountyStage::ValidTerminationRemoveBounty => {
                    //The origin is council or creator
                    Self::return_bounty_cherry_to_creator(bounty_id, &bounty, &terminate_bounty_actor_manager);
                    Self::remove_bounty(&bounty_id, &bounty, &terminate_bounty_actor_manager);
                },
                ValidTerminateBountyStage::ValidTerminationToFailedStage=> {
                    //The origin is council and
                    //stage is funding, funding expired, WorkSubmission or Judgment,

                    //In case funding expired
                    if !Self::contributions_exist(&bounty_id) {
                        //funding expired | funding
                        //oracle reward > 0 | Contributions = 0 | work entries = 0
                        //If Contributions > 0 then cherry will not go to creator, it goes to funders by calling withdraw_funding
                        Self::return_bounty_cherry_to_creator(bounty_id, &bounty, &terminate_bounty_actor_manager);
                    }

                    <Bounties<T>>::mutate(bounty_id, |bounty| {
                        bounty.milestone = BountyMilestone::Terminated
                    });

                    Self::deposit_event(RawEvent::BountyTerminated(
                        bounty_id,
                        terminate_bounty_actor_manager.get_bounty_actor(),
                        bounty.creation_params.creator,
                        bounty.creation_params.oracle,
                    ));
                },


            }

        }

        ///Oracle switches himself to a new one
        /// # <weight>
        ///
        /// ## weight
        /// `O (1)`
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        ///
        #[weight = WeightInfoBounty::<T>::switch_oracle_to_council_by_oracle_member()
        .max(WeightInfoBounty::<T>::switch_oracle_to_member_by_oracle_member())
        .max(WeightInfoBounty::<T>::switch_oracle_to_member_by_oracle_council())
        .max(WeightInfoBounty::<T>::switch_oracle_to_member_by_council())
        .max(WeightInfoBounty::<T>::switch_oracle_to_council_by_council_successful())]
        pub fn switch_oracle(
            origin,
            new_oracle: BountyActor<MemberId<T>>,
            bounty_id: T::BountyId,
        ) {
            let bounty = Self::ensure_bounty_exists(&bounty_id)?;
            let current_oracle = bounty.creation_params.oracle.clone();

            let switcher = Self::ensure_switch_oracle_actors(
                origin, current_oracle.clone(), new_oracle.clone())?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);

            ensure!(
                matches!(current_bounty_stage,
                    BountyStage::Funding{..} |
                    BountyStage::WorkSubmission |
                    BountyStage::Judgment
                ),
                Self::unexpected_bounty_stage_error(current_bounty_stage)
            );

            //
            // == MUTATION SAFE ==
            //

            //Mutates the bounty params replacing the current oracle
            <Bounties<T>>::mutate(bounty_id, |bounty| {
                bounty.creation_params.oracle  = new_oracle.clone()
            });

            Self::deposit_event(RawEvent::BountyOracleSwitched(
                bounty_id,
                switcher,
                current_oracle,
                new_oracle));
        }

        /// Withdraw bounty funding by a member or a council.
        /// # <weight>
        ///
        /// ## weight
        /// `O (1)`
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoBounty::<T>::withdraw_funding_by_member()
              .max(WeightInfoBounty::<T>::withdraw_funding_by_council())
              .max(WeightInfoBounty::<T>::withdraw_funding_state_bloat_bond_by_member())
              .max(WeightInfoBounty::<T>::withdraw_funding_state_bloat_bond_by_council())]
        pub fn withdraw_funding(
            origin,
            funder: BountyActor<MemberId<T>>,
            bounty_id: T::BountyId,
        ) {
            let bounty_funder_manager = BountyActorManager::<T>::ensure_bounty_actor_manager(
                origin,
                funder.clone(),
            )?;


            let bounty = Self::ensure_bounty_exists(&bounty_id)?;
            let valid_withdrawal_stage = Self::ensure_withdraw_funding_in_valid_stage(&bounty)?;

            let funding = Self::ensure_bounty_contribution_exists(&bounty_id, &funder)?;

            let bounty_creator_manager = BountyActorManager::<T>::get_bounty_actor_manager(
                bounty.creation_params.creator.clone(),
            )?;

            //
            // == MUTATION SAFE ==
            //

            match valid_withdrawal_stage{
                ValidWithdrawalStage::FailedBountyWithdrawal => {
                    Self::withdraw_funding_mutation(
                        &bounty_id,
                        &bounty,
                        funder,
                        &bounty_funder_manager,
                        funding);
                },
                ValidWithdrawalStage::SuccessfulBountyWithdrawal => {
                    Self::withdraw_funding_state_bloat_bond_mutation(
                        &bounty_id,
                        funder,
                        &bounty_funder_manager,
                        funding);
                }
            }

            if Self::can_remove_bounty(&bounty_id, &bounty) {
                Self::remove_bounty(
                    &bounty_id,
                    &bounty,
                    &bounty_creator_manager
                );
            }
        }

        /// Announce work entry for a successful bounty.
        /// # <weight>
        ///
        /// ## weight
        /// `O (W + M)` where:
        /// - `W` is the work_description length.
        /// - `M` is closed contract member list length.
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoBounty::<T>::announce_work_entry(
            T::ClosedContractSizeLimit::get().saturated_into(),
            work_description.len().saturated_into())]
        pub fn announce_work_entry(
            origin,
            member_id: MemberId<T>,
            bounty_id: T::BountyId,
            staking_account_id: T::AccountId,
            work_description: Vec<u8>

        ) {
            T::Membership::ensure_member_controller_account_origin(origin, member_id)?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);

            Self::ensure_bounty_stage(current_bounty_stage, BountyStage::WorkSubmission)?;

            let stake = Self::validate_entrant_stake(
                member_id,
                &bounty,
                staking_account_id.clone()
            )?;

            Self::ensure_valid_contract_type(&bounty, &member_id)?;

            //
            // == MUTATION SAFE ==
            //

            let next_entry_count_value = Self::entry_count().saturating_add(1);
            let entry_id = T::EntryId::from(next_entry_count_value);

            // Lock stake balance for bounty if the stake is required.
            if let Some(stake) = stake {
                T::StakingHandler::lock(&stake.account_id, stake.amount);
            }

            let entry = Entry::<T> {
                member_id,
                staking_account_id: staking_account_id.clone(),
                submitted_at: Self::current_block(),
                work_submitted: false,
            };

            <Entries<T>>::insert(bounty_id, entry_id, entry);
            EntryCount::mutate(|count| {
                *count = next_entry_count_value
            });

            // Increment work entry counter and update bounty record.
            <Bounties<T>>::mutate(bounty_id, |bounty| {
                bounty.increment_active_work_entry_counter();
            });

            Self::deposit_event(RawEvent::WorkEntryAnnounced(
                bounty_id,
                entry_id,
                member_id,
                staking_account_id,
                work_description
            ));
        }

        /// Submit work for a bounty.
        /// # <weight>
        ///
        /// ## weight
        /// `O (N)`
        /// - `N` is the work_data length,
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight =  WeightInfoBounty::<T>::submit_work(work_data.len().saturated_into())]
        pub fn submit_work(
            origin,
            member_id: MemberId<T>,
            bounty_id: T::BountyId,
            entry_id: T::EntryId,
            work_data: Vec<u8>
        ) {
            T::Membership::ensure_member_controller_account_origin(origin, member_id)?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);

            Self::ensure_bounty_stage(current_bounty_stage, BountyStage::WorkSubmission)?;

            let entry = Self::ensure_work_entry_exists(&bounty_id, &entry_id)?;

            Self::ensure_work_entry_ownership(&entry, &member_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Update entry
            <Entries<T>>::mutate(bounty_id, entry_id, |entry| {
                if let Some(e) = entry.as_mut() { e.work_submitted = true; };
            });

            Self::deposit_event(RawEvent::WorkSubmitted(bounty_id, entry_id, member_id, work_data));
        }

        /// end bounty working period.
        /// # <weight>
        ///
        /// ## weight
        /// `O (1)`
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoBounty::<T>::end_working_period()]
        pub fn end_working_period(
            origin,
            bounty_id: T::BountyId,
        ) {
            let bounty = Self::ensure_bounty_exists(&bounty_id)?;
            let current_oracle = bounty.creation_params.oracle.clone();

            //Checks if the function caller (origin) is current oracle
            BountyActorManager::<T>::ensure_bounty_actor_manager(
                origin,
                current_oracle.clone(),
            )?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);

            Self::ensure_bounty_stage(current_bounty_stage, BountyStage::WorkSubmission)?;

            //
            // == MUTATION SAFE ==
            //

            <Bounties<T>>::mutate(bounty_id, |bounty| {
                bounty.milestone = BountyMilestone::WorkSubmitted;
            });
            Self::deposit_event(RawEvent::WorkSubmissionPeriodEnded(bounty_id, current_oracle));
        }

        /// Submits an oracle judgment for a bounty, slashing the entries rejected
        /// by an arbitrary percentage and rewarding the winners by an arbitrary amount
        /// (not surpassing the total fund amount)
        /// # <weight>
        ///
        /// ## weight
        /// `O (J + K + W + R)`
        /// - `J` is rationale length,
        /// - `K` is the sum of all action_justification lengths (inside OracleJudgment),
        /// - `W` is number of winner judgment entries,
        /// - `R` is number of rejected judgment entries,
        /// - db:
        ///    - `O(W + R)`
        /// # </weight>
        #[weight = Module::<T>::submit_oracle_judgment_weight(
            judgment,
            rationale.len().saturated_into())]
        pub fn submit_oracle_judgment(
            origin,
            bounty_id: T::BountyId,
            judgment: OracleJudgment<T::EntryId, BalanceOf<T>>,
            rationale: Vec<u8>,
        ) {
            let bounty = Self::ensure_bounty_exists(&bounty_id)?;
            BountyActorManager::<T>::ensure_bounty_actor_manager(
                origin,
                bounty.creation_params.oracle.clone(),
            )?;

            let bounty_creator_manager = Self::ensure_creator_actor_manager(&bounty)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);

            Self::ensure_bounty_stage(current_bounty_stage, BountyStage::Judgment)?;

            Self::validate_judgment(&bounty_id, &bounty, &judgment)?;

            // Lookup for any winners in the judgment.
            let successful_bounty = Self::judgment_has_winners(&judgment);

            //
            // == MUTATION SAFE ==
            //

            // Return a cherry to a creator.
            if successful_bounty {
                Self::return_bounty_cherry_to_creator(bounty_id, &bounty, &bounty_creator_manager);
            }

            // Update bounty record.
            <Bounties<T>>::mutate(bounty_id, |bounty| {
                bounty.milestone = BountyMilestone::JudgmentSubmitted{
                    successful_bounty
                };
            });

            // Judgments triage.
            for (entry_id, work_entry_judgment) in judgment.iter() {

                let entry = Self::ensure_work_entry_exists(&bounty_id, entry_id)?;

                // Update work entries for winners.
                match *work_entry_judgment{
                    OracleWorkEntryJudgment::Winner{ reward } => {

                        // Unstake the full work entry state.
                        let worker_account_id = T::Membership::controller_account_id(entry.member_id)?;

                        T::StakingHandler::unlock(&entry.staking_account_id);
                        // Claim the winner reward.

                        Self::transfer_funds_from_bounty_account(
                            &worker_account_id,
                            bounty_id,
                            reward
                        );
                        // Delete the work entry record from the storage.
                        Self::remove_work_entry(&bounty_id, entry_id);

                        // Fire an event.
                        Self::deposit_event(RawEvent::WorkEntrantFundsWithdrawn(bounty_id, *entry_id, entry.member_id));

                    },
                    OracleWorkEntryJudgment::Rejected{
                        slashing_share,
                        ..
                    } => {

                        let slashing_amount = slashing_share * bounty.creation_params.entrant_stake;

                        if slashing_amount > Zero::zero() {
                            T::StakingHandler::slash(&entry.staking_account_id, Some(slashing_amount));
                        }

                        T::StakingHandler::unlock(&entry.staking_account_id);

                        Self::remove_work_entry(&bounty_id, entry_id);

                        // Fire a WorkEntrantStakeSlashed event.
                        Self::deposit_event(RawEvent::WorkEntrantStakeSlashed(
                            bounty_id,
                            *entry_id,
                            entry.staking_account_id,
                            slashing_amount
                        ));
                    }
                }
            }
            // Fire a judgment event.
            Self::deposit_event(RawEvent::OracleJudgmentSubmitted(
                bounty_id,
                bounty.creation_params.oracle,
                judgment,
                rationale,
            ));
        }

        ///Unlocks the stake related to a work entry
        ///After the oracle makes the judgment or the council terminates the bounty by calling terminate_bounty(...),
        ///each worker whose entry has not been judged, can unlock the totality of their stake.
        /// # <weight>
        ///
        /// ## weight
        /// `O (1)`
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoBounty::<T>::withdraw_entrant_stake()]
        pub fn withdraw_entrant_stake(
            origin,
            member_id: MemberId<T>,
            bounty_id: T::BountyId,
            entry_id: T::EntryId,
        ) {
            T::Membership::ensure_member_controller_account_origin(origin, member_id)?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);

            ensure!(
                matches!(current_bounty_stage,
                    BountyStage::FailedBountyWithdrawal |
                    BountyStage::SuccessfulBountyWithdrawal ),
                Self::unexpected_bounty_stage_error(current_bounty_stage)
            );

            let entry = Self::ensure_work_entry_exists(&bounty_id, &entry_id)?;

            Self::ensure_work_entry_ownership(&entry, &member_id)?;

            let bounty_creator_manager = BountyActorManager::<T>::get_bounty_actor_manager(
                bounty.creation_params.creator.clone(),
            )?;

            //
            // == MUTATION SAFE ==
            //

            T::StakingHandler::unlock(&entry.staking_account_id);

            Self::deposit_event(
                RawEvent::WorkEntrantStakeUnlocked(
                    bounty_id,
                    entry_id,
                    entry.staking_account_id)
            );

            Self::remove_work_entry(&bounty_id, &entry_id);

            if Self::can_remove_bounty(&bounty_id, &bounty) {
                Self::remove_bounty(
                    &bounty_id,
                    &bounty,
                    &bounty_creator_manager
                );
            }
        }

        ///Withraws the oracle reward to oracle
        ///If bounty is successfully, Failed or Cancelled oracle must call this
        ///extrinsic to withdraw the oracle reward,
        /// # <weight>
        ///
        /// ## weight
        /// `O (1)`
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoBounty::<T>::withdraw_oracle_reward_by_oracle_council()
        .max(WeightInfoBounty::<T>::withdraw_oracle_reward_by_oracle_member())]
        pub fn withdraw_oracle_reward(
            origin,
            bounty_id: T::BountyId,
        ) {
            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            let bounty_oracle_manager = BountyActorManager::<T>::ensure_bounty_actor_manager(
                origin,
                bounty.creation_params.oracle.clone(),
            )?;

            let oracle_reward = bounty.creation_params.oracle_reward;
            let current_bounty_stage = Self::get_bounty_stage(&bounty);

            ensure!(
                matches!(current_bounty_stage,
                    BountyStage::FailedBountyWithdrawal |
                    BountyStage::SuccessfulBountyWithdrawal ),
                Self::unexpected_bounty_stage_error(current_bounty_stage)
            );
            ensure!(bounty.has_unpaid_oracle_reward, Error::<T>::OracleRewardAlreadyWithdrawn);

            let bounty_creator_manager = BountyActorManager::<T>::get_bounty_actor_manager(
                bounty.creation_params.creator.clone(),
            )?;

            //
            // == MUTATION SAFE ==
            //

            bounty_oracle_manager.transfer_funds_from_bounty_account(bounty_id, oracle_reward);

            <Bounties<T>>::mutate(bounty_id, |bounty| {
                bounty.has_unpaid_oracle_reward = false;
            });

            Self::deposit_event(RawEvent::BountyOracleRewardWithdrawal(
                bounty_id,
                bounty.creation_params.oracle.clone(),
                oracle_reward
            ));

            if Self::has_no_contributions_and_no_work_entries(&bounty_id) {
                Self::remove_bounty(
                    &bounty_id,
                    &bounty,
                    &bounty_creator_manager
                );
            }
        }

        /// Bounty Contributor made a remark
        ///
        /// # <weight>
        ///
        /// ## weight
        /// `O (N)`
        /// - `N` is msg length
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoBounty::<T>::contributor_remark(msg.len().saturated_into())]
        pub fn contributor_remark(
            origin,
            contributor: BountyActor<MemberId<T>>,
            bounty_id: T::BountyId,
            msg: Vec<u8>,
        ) {
            let _ = BountyActorManager::<T>::ensure_bounty_actor_manager(origin, contributor.clone())?;
            ensure!(
                BountyContributions::<T>::contains_key(&bounty_id, &contributor),
                Error::<T>::InvalidContributorActorSpecified,
                );

            //
            // == MUTATION SAFE ==
            //

            Self::deposit_event(RawEvent::BountyContributorRemarked(contributor, bounty_id, msg));
        }

        /// Bounty Oracle made a remark
        ///
        /// # <weight>
        ///
        /// ## weight
        /// `O (N)`
        /// - `N` is msg length
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoBounty::<T>::oracle_remark(msg.len().saturated_into())]
        pub fn oracle_remark(
            origin,
            oracle: BountyActor<MemberId<T>>,
            bounty_id: T::BountyId,
            msg: Vec<u8>,
        ) {

            let _ = BountyActorManager::<T>::ensure_bounty_actor_manager(
                origin,
                oracle.clone(),
            )?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;
            ensure!(
                bounty.creation_params.oracle == oracle,
                Error::<T>::InvalidOracleActorSpecified,
            );

            //
            // == MUTATION SAFE ==
            //


            Self::deposit_event(RawEvent::BountyOracleRemarked(oracle, bounty_id, msg));
        }

        /// Bounty Entrant Worker made a remark
        ///
        /// # <weight>
        ///
        /// ## weight
        /// `O (N)`
        /// - `N` is msg length
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoBounty::<T>::entrant_remark(msg.len().saturated_into())]
        pub fn entrant_remark(
            origin,
            entrant_id: MemberId<T>,
            bounty_id: T::BountyId,
            entry_id: T::EntryId,
            msg: Vec<u8>,
        ) {

            T::Membership::ensure_member_controller_account_origin(origin, entrant_id)?;

            let entry = Self::ensure_work_entry_exists(&bounty_id, &entry_id)?;

            ensure!(
                entry.member_id == entrant_id,
                Error::<T>::InvalidEntrantWorkerSpecified,
            );

            //
            // == MUTATION SAFE ==
            //

            Self::deposit_event(RawEvent::BountyEntrantRemarked(entrant_id, bounty_id, entry_id, msg));
        }

        /// Bounty Oracle made a remark
        ///
        /// # <weight>
        ///
        /// ## weight
        /// `O (N)`
        /// - `N` is msg length
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoBounty::<T>::creator_remark(msg.len().saturated_into())]
        pub fn creator_remark(
            origin,
            creator: BountyActor<MemberId<T>>,
            bounty_id: T::BountyId,
            msg: Vec<u8>,
        ) {

            let _ = BountyActorManager::<T>::ensure_bounty_actor_manager(
                origin,
                creator.clone(),
            )?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;
            ensure!(
                bounty.creation_params.creator == creator,
                Error::<T>::InvalidCreatorActorSpecified,
            );

            //
            // == MUTATION SAFE ==
            //

            Self::deposit_event(RawEvent::BountyCreatorRemarked(creator, bounty_id, msg));
        }

    }
}

impl<T: Config> Module<T> {
    fn withdraw_funding_mutation(
        bounty_id: &T::BountyId,
        bounty: &Bounty<T>,
        funder: BountyActor<MemberId<T>>,
        bounty_funder_manager: &BountyActorManager<T>,
        funding: Contribution<T>,
    ) {
        let cherry_fraction = Self::get_cherry_fraction_for_member(bounty, funding.amount);

        let withdrawal_amount = funding
            .total_bloat_bond_and_funding()
            .saturating_add(cherry_fraction);

        bounty_funder_manager.transfer_funds_from_bounty_account(*bounty_id, withdrawal_amount);

        <BountyContributions<T>>::remove(&bounty_id, &funder);

        Self::deposit_event(RawEvent::FunderStateBloatBondWithdrawn(
            *bounty_id,
            funder.clone(),
            T::FunderStateBloatBondAmount::get(),
        ));

        Self::deposit_event(RawEvent::BountyFundingWithdrawal(*bounty_id, funder));
    }

    fn withdraw_funding_state_bloat_bond_mutation(
        bounty_id: &T::BountyId,
        funder: BountyActor<MemberId<T>>,
        bounty_funder_manager: &BountyActorManager<T>,
        funding: Contribution<T>,
    ) {
        bounty_funder_manager
            .transfer_funds_from_bounty_account(*bounty_id, funding.funder_state_bloat_bond_amount);

        //Remove contribution from
        <BountyContributions<T>>::remove(&bounty_id, &funder);

        Self::deposit_event(RawEvent::FunderStateBloatBondWithdrawn(
            *bounty_id,
            funder,
            T::FunderStateBloatBondAmount::get(),
        ));
    }

    fn ensure_withdraw_funding_in_valid_stage(
        bounty: &Bounty<T>,
    ) -> Result<ValidWithdrawalStage, DispatchError> {
        let current_bounty_stage = Self::get_bounty_stage(bounty);
        match current_bounty_stage {
            BountyStage::FailedBountyWithdrawal => Ok(ValidWithdrawalStage::FailedBountyWithdrawal),
            BountyStage::SuccessfulBountyWithdrawal => {
                Ok(ValidWithdrawalStage::SuccessfulBountyWithdrawal)
            }
            _ => Err(Self::unexpected_bounty_stage_error(current_bounty_stage)),
        }
    }

    // Wrapper-function over System::block_number()
    pub(crate) fn current_block() -> T::BlockNumber {
        <frame_system::Pallet<T>>::block_number()
    }

    // Validates parameters for a bounty creation.
    fn ensure_create_bounty_parameters_valid(
        params: &BountyCreationParameters<T>,
    ) -> DispatchResult {
        match params.funding_type {
            FundingType::Perpetual { target } => {
                ensure!(
                    target != Zero::zero(),
                    Error::<T>::FundingAmountCannotBeZero
                );
            }
            FundingType::Limited {
                target,
                funding_period,
            } => {
                ensure!(
                    target != Zero::zero(),
                    Error::<T>::FundingAmountCannotBeZero
                );

                ensure!(
                    funding_period != Zero::zero(),
                    Error::<T>::FundingPeriodCannotBeZero
                );
            }
        }

        ensure!(
            params.entrant_stake >= T::MinWorkEntrantStake::get(),
            Error::<T>::EntrantStakeIsLessThanMininum
        );

        if let AssuranceContractType::Closed(ref member_ids) = params.contract_type {
            ensure!(
                !member_ids.is_empty(),
                Error::<T>::ClosedContractMemberListIsEmpty
            );

            ensure!(
                member_ids.len() <= T::ClosedContractSizeLimit::get().saturated_into(),
                Error::<T>::ClosedContractMemberListIsTooLarge
            );

            for member_id in member_ids {
                ensure!(
                    T::Membership::controller_account_id(*member_id).is_ok(),
                    Error::<T>::ClosedContractMemberNotFound
                );
            }
        }

        if let BountyActor::Member(member_id) = params.oracle {
            ensure!(
                T::Membership::controller_account_id(member_id).is_ok(),
                Error::<T>::InvalidOracleMemberId
            );
        }

        Ok(())
    }

    // Verifies that member balance is sufficient for a bounty.
    fn check_balance_for_account(amount: BalanceOf<T>, account_id: &T::AccountId) -> bool {
        balances::Pallet::<T>::usable_balance(account_id) >= amount
    }

    fn ensure_creator_actor_manager(
        bounty: &Bounty<T>,
    ) -> Result<BountyActorManager<T>, DispatchError> {
        let creator = bounty.creation_params.creator.clone();
        BountyActorManager::<T>::get_bounty_actor_manager(creator)
    }

    fn ensure_switch_oracle_actors(
        origin: T::Origin,
        current_oracle: BountyActor<MemberId<T>>,
        new_oracle: BountyActor<MemberId<T>>,
    ) -> Result<BountyActor<MemberId<T>>, DispatchError> {
        //Checks if the function caller (origin) is current oracle
        let switcher_actor_manager =
            BountyActorManager::<T>::ensure_bounty_actor_manager(origin.clone(), current_oracle);

        let switcher = match switcher_actor_manager {
            Ok(oracle_switcher_manager) => oracle_switcher_manager.get_bounty_actor(),
            Err(_) => {
                ensure_root(origin)?;
                BountyActor::Council
            }
        };

        //Check if new oracle is a member
        BountyActorManager::<T>::get_bounty_actor_manager(new_oracle)?;
        Ok(switcher)
    }

    fn ensure_terminate_bounty_stage(
        bounty_id: &T::BountyId,
        bounty: &Bounty<T>,
        terminate_bounty_actor: &BountyActorManager<T>,
    ) -> Result<ValidTerminateBountyStage, DispatchError> {
        let current_bounty_stage = Self::get_bounty_stage(bounty);
        match terminate_bounty_actor {
            BountyActorManager::Council => {
                ensure!(
                    matches!(
                        current_bounty_stage,
                        BountyStage::Funding { .. }
                            | BountyStage::NoFundingContributed
                            | BountyStage::WorkSubmission
                            | BountyStage::Judgment
                    ),
                    Self::unexpected_bounty_stage_error(current_bounty_stage)
                );
            }
            BountyActorManager::Member(_, _) => {
                ensure!(
                    matches!(
                        current_bounty_stage,
                        BountyStage::Funding { .. } | BountyStage::NoFundingContributed
                    ),
                    Self::unexpected_bounty_stage_error(current_bounty_stage)
                );
            }
        };

        Ok(match Self::can_remove_bounty(bounty_id, bounty) {
            true => ValidTerminateBountyStage::ValidTerminationRemoveBounty,
            false => ValidTerminateBountyStage::ValidTerminationToFailedStage,
        })
    }

    // Transfer funds from the member account to the bounty account.
    fn transfer_funds_to_bounty_account(
        account_id: &T::AccountId,
        bounty_id: T::BountyId,
        amount: BalanceOf<T>,
    ) {
        let bounty_account_id = Self::bounty_account_id(bounty_id);

        let _ = <balances::Pallet<T> as Currency<T::AccountId>>::transfer(
            account_id,
            &bounty_account_id,
            amount,
            ExistenceRequirement::AllowDeath,
        );
    }

    // Transfer funds from the bounty account to the member account.
    fn transfer_funds_from_bounty_account(
        account_id: &T::AccountId,
        bounty_id: T::BountyId,
        amount: BalanceOf<T>,
    ) {
        let bounty_account_id = Self::bounty_account_id(bounty_id);

        let _ = <balances::Pallet<T> as Currency<T::AccountId>>::transfer(
            &bounty_account_id,
            account_id,
            amount,
            ExistenceRequirement::AllowDeath,
        );
    }

    // Verifies bounty existence and retrieves a bounty from the storage.
    fn ensure_bounty_exists(bounty_id: &T::BountyId) -> Result<Bounty<T>, DispatchError> {
        ensure!(
            <Bounties<T>>::contains_key(bounty_id),
            Error::<T>::BountyDoesntExist
        );

        let bounty = <Bounties<T>>::get(bounty_id);

        Ok(bounty)
    }

    fn ensure_bounty_contribution_exists(
        bounty_id: &T::BountyId,
        funder: &BountyActor<MemberId<T>>,
    ) -> Result<Contribution<T>, DispatchError> {
        ensure!(
            <BountyContributions<T>>::contains_key(&bounty_id, &funder),
            Error::<T>::NoBountyContributionFound,
        );

        let funding = <BountyContributions<T>>::get(&bounty_id, &funder);

        Ok(funding)
    }
    // Calculate cherry fraction to reward member for an unsuccessful bounty.
    // Cherry fraction = cherry * (member funding / total funding).
    fn get_cherry_fraction_for_member(
        bounty: &Bounty<T>,
        funding_amount: BalanceOf<T>,
    ) -> BalanceOf<T> {
        let funding_share = Perbill::from_rational(funding_amount, bounty.total_funding);

        // cherry share
        funding_share * bounty.creation_params.cherry
    }

    /// Remove bounty and all related info from the storage.
    fn remove_bounty(
        bounty_id: &T::BountyId,
        bounty: &Bounty<T>,
        bounty_creator_manager: &BountyActorManager<T>,
    ) {
        bounty_creator_manager
            .transfer_funds_from_bounty_account(*bounty_id, T::CreatorStateBloatBondAmount::get());

        Self::deposit_event(RawEvent::CreatorStateBloatBondWithdrawn(
            *bounty_id,
            bounty.creation_params.creator.clone(),
            T::CreatorStateBloatBondAmount::get(),
        ));

        <Bounties<T>>::remove(bounty_id);

        Self::deposit_event(RawEvent::BountyRemoved(*bounty_id));
    }

    // Verifies that the bounty has no pending fund withdrawals left.
    fn has_no_contributions_and_no_work_entries(bounty_id: &T::BountyId) -> bool {
        let has_no_contributions = !Self::contributions_exist(bounty_id);
        let has_no_work_entries = Self::bounties(bounty_id).active_work_entry_count == 0;
        // All work entrants withdrew their stakes and all funders withdrew cherry and
        // provided funds.
        has_no_contributions && has_no_work_entries
    }

    // Verifies that bounty has some contribution to withdraw.
    // Should be O(1) because of the single inner call of the next() function of the iterator.
    pub(crate) fn contributions_exist(bounty_id: &T::BountyId) -> bool {
        <BountyContributions<T>>::iter_prefix_values(bounty_id)
            .peekable()
            .peek()
            .is_some()
    }

    // Verifies that bounty has some contribution to withdraw.
    pub(crate) fn can_remove_bounty(bounty_id: &T::BountyId, bounty: &Bounty<T>) -> bool {
        !bounty.has_unpaid_oracle_reward
            && Self::has_no_contributions_and_no_work_entries(bounty_id)
    }

    // The account ID of a bounty account. Tests require AccountID type to be at least u128.
    pub(crate) fn bounty_account_id(bounty_id: T::BountyId) -> T::AccountId {
        T::ModuleId::get().into_sub_account_truncating(bounty_id)
    }

    // Calculates bounty milestone on member funding.
    fn get_bounty_milestone_on_funding(
        target_funding_reached: bool,
        previous_milestone: BountyMilestone<T::BlockNumber>,
    ) -> BountyMilestone<T::BlockNumber> {
        if target_funding_reached {
            // Bounty target funding reached.
            BountyMilestone::BountyMaxFundingReached
        // No previous contributions.
        } else if let BountyMilestone::Created {
            created_at,
            has_contributions: false,
        } = previous_milestone
        {
            // The bounty has some contributions now.
            BountyMilestone::Created {
                created_at,
                has_contributions: true,
            }
        } else {
            // No changes.
            previous_milestone
        }
    }

    fn get_adjusted_contribution(
        bounty_id: &T::BountyId,
        bounty: &Bounty<T>,
        funder: &BountyActor<MemberId<T>>,
        amount: T::Balance,
        is_target_funding_reached: bool,
    ) -> (Contribution<T>, BalanceOf<T>, BalanceOf<T>) {
        //The contribution should be saturated to the target funding,
        //in case of target funding is reached.
        let adjusted_amount = match is_target_funding_reached {
            true => bounty.target_funding().saturating_sub(bounty.total_funding),
            false => amount,
        };

        //Check if is the first time a funder is contributiong
        //returns Contribution
        match <BountyContributions<T>>::contains_key(&bounty_id, &funder) {
            //Adds funds to an existing amount, is_first_contribution will be set to false
            true => (
                Self::contribution_by_bounty_by_actor(bounty_id, &funder),
                adjusted_amount,
                adjusted_amount,
            ),
            //Sets the first contribution amount, is_first_contribution is true.
            false => (
                Contribution::default(),
                adjusted_amount,
                adjusted_amount.saturating_add(T::FunderStateBloatBondAmount::get()),
            ),
        }
    }

    // Validates stake on announcing the work entry.
    fn validate_entrant_stake(
        member_id: MemberId<T>,
        bounty: &Bounty<T>,
        staking_account_id: T::AccountId,
    ) -> Result<Option<RequiredStakeInfo<T>>, DispatchError> {
        let staking_balance = bounty.creation_params.entrant_stake;

        ensure!(
            T::Membership::is_member_staking_account(&member_id, &staking_account_id),
            Error::<T>::InvalidStakingAccountForMember
        );

        ensure!(
            T::StakingHandler::is_account_free_of_conflicting_stakes(&staking_account_id),
            Error::<T>::ConflictingStakes
        );

        ensure!(
            T::StakingHandler::is_enough_balance_for_stake(&staking_account_id, staking_balance),
            Error::<T>::InsufficientBalanceForStake
        );

        Ok(Some(RequiredStakeInfo {
            amount: staking_balance,
            account_id: staking_account_id,
        }))
    }

    // Verifies work entry existence and retrieves an entry from the storage.
    pub(crate) fn ensure_work_entry_exists(
        bounty_id: &T::BountyId,
        entry_id: &T::EntryId,
    ) -> Result<Entry<T>, DispatchError> {
        match Self::entries(bounty_id, entry_id) {
            Some(entry) => Ok(entry),
            None => Err(Error::<T>::WorkEntryDoesntExist.into()),
        }
    }

    // Ensures entry record ownership for a member.
    fn ensure_work_entry_ownership(
        entry: &Entry<T>,
        owner_member_id: &MemberId<T>,
    ) -> DispatchResult {
        ensure!(
            entry.member_id == *owner_member_id,
            Error::<T>::WorkEntryDoesntBelongToWorker
        );

        Ok(())
    }

    // Validates the contract type for a bounty
    fn ensure_valid_contract_type(bounty: &Bounty<T>, member_id: &MemberId<T>) -> DispatchResult {
        if let AssuranceContractType::Closed(ref valid_members) =
            bounty.creation_params.contract_type
        {
            ensure!(
                valid_members.contains(member_id),
                Error::<T>::CannotSubmitWorkToClosedContractBounty
            );
        }

        Ok(())
    }

    // Computes the stage of a bounty based on its creation parameters and the current state.
    pub(crate) fn get_bounty_stage(bounty: &Bounty<T>) -> BountyStage {
        let sc = BountyStageCalculator::<T> {
            now: Self::current_block(),
            bounty,
        };

        sc.get_bounty_stage()
    }

    // Validates oracle judgment.
    fn validate_judgment(
        bounty_id: &T::BountyId,
        bounty: &Bounty<T>,
        judgment: &OracleJudgmentOf<T>,
    ) -> DispatchResult {
        // Total judgment reward accumulator.
        let mut reward_sum_from_judgment: BalanceOf<T> = Zero::zero();

        // Validate all work entry Judgments.
        for (entry_id, work_entry_judgment) in judgment.iter() {
            let entry = Self::ensure_work_entry_exists(bounty_id, entry_id)?;
            //checks if member_id exists
            T::Membership::controller_account_id(entry.member_id)?;
            if let OracleWorkEntryJudgment::Winner { reward } = work_entry_judgment {
                // Check for zero reward.
                ensure!(*reward != Zero::zero(), Error::<T>::ZeroWinnerReward);
                // Check winner work submission.
                ensure!(
                    entry.work_submitted,
                    Error::<T>::WinnerShouldHasWorkSubmission
                );
                reward_sum_from_judgment = reward_sum_from_judgment.saturating_add(*reward);
            }
        }

        // Check for invalid total sum for successful bounty.
        if reward_sum_from_judgment != Zero::zero() {
            ensure!(
                reward_sum_from_judgment == bounty.total_funding, // 100% bounty distribution
                Error::<T>::TotalRewardShouldBeEqualToTotalFunding
            );
        }

        Ok(())
    }

    // Removes the work entry and decrements active entry count in a bounty.
    fn remove_work_entry(bounty_id: &T::BountyId, entry_id: &T::EntryId) {
        <Entries<T>>::remove(bounty_id, entry_id);

        // Decrement work entry counter and update bounty record.
        <Bounties<T>>::mutate(bounty_id, |bounty| {
            bounty.decrement_active_work_entry_counter();
        });
    }

    // Bounty stage validator.
    fn ensure_bounty_stage(
        actual_stage: BountyStage,
        expected_stage: BountyStage,
    ) -> DispatchResult {
        ensure!(
            actual_stage == expected_stage,
            Self::unexpected_bounty_stage_error(actual_stage)
        );

        Ok(())
    }

    // Provides fined-grained errors for a bounty stages
    fn unexpected_bounty_stage_error(unexpected_stage: BountyStage) -> DispatchError {
        match unexpected_stage {
            BountyStage::Funding { .. } => Error::<T>::InvalidStageUnexpectedFunding.into(),
            BountyStage::NoFundingContributed => {
                Error::<T>::InvalidStageUnexpectedNoFundingContributed.into()
            }
            BountyStage::WorkSubmission => Error::<T>::InvalidStageUnexpectedWorkSubmission.into(),
            BountyStage::Judgment => Error::<T>::InvalidStageUnexpectedJudgment.into(),
            BountyStage::SuccessfulBountyWithdrawal => {
                Error::<T>::InvalidStageUnexpectedSuccessfulBountyWithdrawal.into()
            }
            BountyStage::FailedBountyWithdrawal => {
                Error::<T>::InvalidStageUnexpectedFailedBountyWithdrawal.into()
            }
        }
    }

    // Oracle judgment helper. Returns true if a Judgment contains at least one winner.
    pub(crate) fn judgment_has_winners(judgment: &OracleJudgmentOf<T>) -> bool {
        judgment.iter().any(|(_, j)| j.is_winner())
    }

    // Transfers cherry back to the bounty creator and fires an event.
    fn return_bounty_cherry_to_creator(
        bounty_id: T::BountyId,
        bounty: &Bounty<T>,
        bounty_creator_manager: &BountyActorManager<T>,
    ) {
        bounty_creator_manager
            .transfer_funds_from_bounty_account(bounty_id, bounty.creation_params.cherry);

        Self::deposit_event(RawEvent::BountyCreatorCherryWithdrawal(
            bounty_id,
            bounty.creation_params.creator.clone(),
        ));
    }

    // Calculates weight for create_bounty extrinsic.
    fn create_bounty_weight(params: &BountyCreationParameters<T>, metadata: &[u8]) -> Weight {
        let metadata_length = metadata.len().saturated_into();
        let member_list_length =
            if let AssuranceContractType::Closed(ref members) = params.contract_type {
                members.len().saturated_into()
            } else {
                1 // consider open contract member list as one.
            };

        WeightInfoBounty::<T>::create_bounty_by_member(metadata_length, member_list_length).max(
            WeightInfoBounty::<T>::create_bounty_by_council(metadata_length, member_list_length),
        )
    }

    // Calculates weight for submit_oracle_Judgment extrinsic.
    fn submit_oracle_judgment_weight(judgment_map: &OracleJudgmentOf<T>, rationale: u32) -> Weight {
        //j - rationale size,
        //k - sum of each action_justification size
        //w - total winner entries
        //r - total rejected entries

        let j = rationale;

        let (w, r, k) =
            judgment_map.iter().fold(
                (0u32, 0u32, 0u32),
                |(w, r, k), (_, judgment)| match judgment {
                    OracleWorkEntryJudgment::Winner { .. } => (w.saturating_add(1), r, k),
                    OracleWorkEntryJudgment::Rejected {
                        action_justification,
                        ..
                    } => (
                        w,
                        r.saturating_add(1),
                        k.saturating_add(action_justification.len() as u32),
                    ),
                },
            );

        WeightInfoBounty::<T>::submit_oracle_judgment_by_council(j, k, w, r).max(
            WeightInfoBounty::<T>::submit_oracle_judgment_by_member(j, k, w, r),
        )
    }
}
