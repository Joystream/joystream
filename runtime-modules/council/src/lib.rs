// TODO: adjust all extrinsic weights

//! # Council module
//! Council module for the the Joystream platform.
//!
//! ## Overview
//!
//! The Council module let's privileged network users elect their voted representation.
//!
//! Each council cycle is composed of three phases. The default phase is the candidacy announcement phase,
//! during which users can announce their candidacy to the next council. After a fixed amount of time
//! (network blocks) candidacy announcement phase concludes, and the next phase starts if a minimum
//! number of candidates is announced; restarts the announcement phase otherwise. The next phase
//! is the Election phase, during which users can vote for their selected candidate. The election
//! itself is handled by the Referendum module. After elections end and a minimum amount of candidates
//! received votes, a new council is appointed, and the Council module enters an Idle phase for the fixed
//! amount of time before another round's candidacy announcements begin.
//!
//! The module supports requiring staking currency for the both candidacy and voting.
//!
//! ## Implementation
//! Module expects that association of a particular account id to a membership id is never broken.
//! Reassociation of an account id to a different membership id behind the scenes that the Council module
//! can't be aware of will result in unexpected behavior.
//!
//! When implementing runtime for this module, don't forget to call all ReferendumConnection trait functions
//! at proper places. See the trait details for more information.
//!
//! ## Supported extrinsics
//! - [announce_candidacy](./struct.Module.html#method.announce_candidacy)
//! - [release_candidacy_stake](./struct.Module.html#method.release_candidacy_stake)
//! - [set_candidacy_note](./struct.Module.html#method.set_candidacy_note)
//! - [set_budget](./struct.Module.html#method.set_budget)
//! - [plan_budget_refill](./struct.Module.html#method.plan_budget_refill)
//!
//! ## Important functions
//! These functions have to be called by the runtime for the council to work properly.
//! - [recieve_referendum_results](./trait.ReferendumConnection.html#method.recieve_referendum_results)
//! - [can_unlock_vote_stake](./trait.ReferendumConnection.html#method.can_unlock_vote_stake)
//!
//! ## Dependencies:
//! - [referendum](../referendum/index.html)
//!
//! NOTE: When implementing runtime for this module, don't forget to call all ReferendumConnection
//!       trait functions at proper places.

/////////////////// Configuration //////////////////////////////////////////////
#![cfg_attr(not(feature = "std"), no_std)]

// used dependencies
use codec::{Codec, Decode, Encode};
use frame_support::traits::{Currency, Get};
use frame_support::{
    decl_error, decl_event, decl_module, decl_storage, ensure, error::BadOrigin, Parameter,
};

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_arithmetic::traits::BaseArithmetic;
use sp_runtime::traits::{Hash, MaybeSerialize, Member, SaturatedConversion, Saturating};
use std::marker::PhantomData;
use system::{ensure_root, ensure_signed};

use referendum::{CastVote, OptionResult, ReferendumManager};

// declared modules
mod mock;
mod staking_handler;
mod tests;

use staking_handler::StakingHandler2;

/////////////////// Data Structures ////////////////////////////////////////////

/// Information about council's current state and when it changed the last time.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct CouncilStageUpdate<BlockNumber> {
    stage: CouncilStage,
    changed_at: BlockNumber,
}

/// Possible council states.
#[derive(Encode, Decode, PartialEq, Eq, Debug)]
pub enum CouncilStage {
    /// Candidacy announcement period.
    Announcing(CouncilStageAnnouncing),
    /// Election of the new council.
    Election(CouncilStageElection),
    /// The idle phase - no new council election is running now.
    Idle,
}

impl Default for CouncilStage {
    fn default() -> CouncilStage {
        CouncilStage::Announcing(CouncilStageAnnouncing {
            candidates_count: 0,
        })
    }
}

/// Representation for announcing candidacy stage state.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct CouncilStageAnnouncing {
    candidates_count: u64,
}

/// Representation for new council members election stage state.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct CouncilStageElection {
    candidates_count: u64,
}

/// Candidate representation.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default, Clone)]
pub struct Candidate<AccountId, Balance, Hash> {
    staking_account_id: AccountId,
    reward_account_id: AccountId,
    cycle_id: u64,
    stake: Balance,
    note_hash: Option<Hash>,
}

/// Council member representation.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default, Clone)]
pub struct CouncilMember<AccountId, MembershipId, Balance, BlockNumber> {
    staking_account_id: AccountId,
    reward_account_id: AccountId,
    membership_id: MembershipId,
    stake: Balance,

    last_payment_block: BlockNumber,
    unpaid_reward: Balance,
}

impl<AccountId, MembershipId, Balance, Hash, BlockNumber>
    From<(
        Candidate<AccountId, Balance, Hash>,
        MembershipId,
        BlockNumber,
        Balance,
    )> for CouncilMember<AccountId, MembershipId, Balance, BlockNumber>
{
    fn from(
        from: (
            Candidate<AccountId, Balance, Hash>,
            MembershipId,
            BlockNumber,
            Balance,
        ),
    ) -> Self {
        Self {
            staking_account_id: from.0.staking_account_id,
            reward_account_id: from.0.reward_account_id,
            membership_id: from.1,
            stake: from.0.stake,

            last_payment_block: from.2,
            unpaid_reward: from.3,
        }
    }
}

/////////////////// Type aliases ///////////////////////////////////////////////

pub type Balance<T> = <<<T as Trait>::Referendum as ReferendumManager<
    <T as system::Trait>::Origin,
    <T as system::Trait>::AccountId,
    <T as system::Trait>::Hash,
>>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;
pub type VotePowerOf<T> = <<T as Trait>::Referendum as ReferendumManager<
    <T as system::Trait>::Origin,
    <T as system::Trait>::AccountId,
    <T as system::Trait>::Hash,
>>::VotePower;
pub type CastVoteOf<T> = CastVote<<T as system::Trait>::Hash, Balance<T>>;

pub type CouncilMemberOf<T> = CouncilMember<
    <T as system::Trait>::AccountId,
    <T as Trait>::MembershipId,
    Balance<T>,
    <T as system::Trait>::BlockNumber,
>;
pub type CandidateOf<T> =
    Candidate<<T as system::Trait>::AccountId, Balance<T>, <T as system::Trait>::Hash>;
pub type CouncilStageUpdateOf<T> = CouncilStageUpdate<<T as system::Trait>::BlockNumber>;

/////////////////// Trait, Storage, Errors, and Events /////////////////////////

/// The main council trait.
pub trait Trait: system::Trait {
    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    /// Representation for council membership.
    type MembershipId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + From<u64>
        + Into<u64>;

    /// Referendum used for council elections.
    type Referendum: ReferendumManager<Self::Origin, Self::AccountId, Self::Hash>;

    /// Minimum number of extra candidates needed for the valid election.
    /// Number of total candidates is equal to council size plus extra candidates.
    type MinNumberOfExtraCandidates: Get<u64>;
    /// Council member count
    type CouncilSize: Get<u64>;
    /// Minimum stake candidate has to lock
    type MinCandidateStake: Get<Balance<Self>>;

    /// Identifier for currency lock used for candidacy staking.
    type CandidacyLock: StakingHandler2<Self::AccountId, Balance<Self>, Self::MembershipId>;
    /// Identifier for currency lock used for candidacy staking.
    type ElectedMemberLock: StakingHandler2<Self::AccountId, Balance<Self>, Self::MembershipId>;

    /// Duration of annoncing period
    type AnnouncingPeriodDuration: Get<Self::BlockNumber>;
    /// Duration of idle period
    type IdlePeriodDuration: Get<Self::BlockNumber>;

    /// The value elected members will be awarded each block of their reign.
    type ElectedMemberRewardPerBlock: Get<Balance<Self>>;
    /// Interval for automatic reward payments.
    type ElectedMemberRewardPeriod: Get<Self::BlockNumber>;

    /// Amount that will be added to the budget balance on every refill.
    type BudgetRefillAmount: Get<Balance<Self>>;
    /// Interval between automatic budget refills.
    type BudgetRefillPeriod: Get<Self::BlockNumber>;

    /// Checks that the user account is indeed associated with the member.
    fn is_council_member_account(
        membership_id: &Self::MembershipId,
        account_id: &<Self as system::Trait>::AccountId,
    ) -> bool;
}

/// Trait with functions that MUST be called by the runtime with values received from the referendum module.
pub trait ReferendumConnection<T: Trait> {
    /// Process referendum results. This function MUST be called in runtime's implementation of referendum's `process_results()`.
    fn recieve_referendum_results(winners: &[OptionResult<VotePowerOf<T>>]);

    /// Process referendum results. This function MUST be called in runtime's implementation of referendum's `can_release_voting_stake()`.
    fn can_unlock_vote_stake(
        vote: &CastVoteOf<T>,
        current_voting_cycle_id: &u64,
    ) -> Result<(), Error<T>>;

    /// Checks that user is indeed candidating. This function MUST be called in runtime's implementation of referendum's `is_valid_option_id()`.
    fn is_valid_candidate_id(membership_id: &T::MembershipId) -> bool;
}

decl_storage! {
    trait Store for Module<T: Trait> as Council {
        /// Current council voting stage
        pub Stage get(fn stage) config(): CouncilStageUpdate<T::BlockNumber>;

        /// Current council members
        pub CouncilMembers get(fn council_members) config(): Vec<CouncilMemberOf<T>>;

        /// Map of all candidates that ever candidated and haven't unstake yet.
        pub Candidates get(fn candidates) config(): map hasher(blake2_128_concat) T::MembershipId => Candidate<T::AccountId, Balance::<T>, T::Hash>;

        /// Index of the current candidacy period. It is incremented everytime announcement period starts.
        pub AnnouncementPeriodNr get(fn announcement_period_nr) config(): u64;

        /// Budget for the council's elected members rewards.
        pub Budget get(fn budget) config(): Balance<T>;

        /// The next block in which the elected council member rewards will be payed.
        pub NextRewardPayments get(fn next_reward_payments) config(): T::BlockNumber;

        /// The next block in which the budget will be increased.
        pub NextBudgetRefill get(fn next_budget_refill) config(): T::BlockNumber;
    }
}

decl_event! {
    pub enum Event<T>
    where
        Balance = Balance::<T>,
        <T as system::Trait>::BlockNumber,
        <T as Trait>::MembershipId,
        <T as system::Trait>::AccountId,
    {
        /// New council was elected
        AnnouncingPeriodStarted(),

        /// Announcing period can't finish because of insufficient candidtate count
        NotEnoughCandidates(),

        /// Candidates are announced and voting starts
        VotingPeriodStarted(u64),

        /// New candidate announced
        NewCandidate(MembershipId, Balance),

        /// New council was elected and appointed
        NewCouncilElected(Vec<MembershipId>),

        /// New council was elected and appointed
        NewCouncilNotElected(),

        /// Candidacy stake that was no longer needed was released
        CandidacyStakeRelease(MembershipId),

        /// Candidate has withdrawn his candidacy
        CandidacyWithdraw(MembershipId),

        /// The candidate has set a new note for their candidacy
        CandidacyNoteSet(MembershipId, Vec<u8>),

        /// The whole reward was paid to the council member.
        RewardPayment(MembershipId, AccountId, Balance, Balance),

        /// Budget balance was changed by the root.
        BudgetBalanceSet(Balance),

        /// Budget balance was increased by automatic refill.
        BudgetRefill(Balance),

        /// The next budget refill was planned.
        BudgetRefillPlanned(BlockNumber),
    }
}

decl_error! {
    /// Council errors
    pub enum Error for Module<T: Trait> {
        /// Origin is invalid.
        BadOrigin,

        /// User tried to announce candidacy outside of the candidacy announcement period.
        CantCandidateNow,

        /// User tried to release stake outside of the revealing period.
        CantReleaseStakeNow,

        /// Candidate haven't provided sufficient stake.
        CandidacyStakeTooLow,

        /// User tried to announce candidacy twice in the same elections.
        CantCandidateTwice,

        /// User tried to announce candidacy with an account that has the conflicting type of stake
        /// with candidacy stake and has not enough balance for staking for both purposes.
        ConflictingStake,

        /// Council member and candidates can't withdraw stake yet.
        StakeStillNeeded,

        /// User tried to release stake when no stake exists.
        NoStake,

        /// Insufficient balance for candidacy staking.
        InsufficientBalanceForStaking,

        /// Candidate can't vote for himself.
        CantVoteForYourself,

        /// Invalid membership.
        MembershipIdNotMatchAccount,

        /// The combination of membership id and account id is invalid for unstaking an existing candidacy stake.
        InvalidAccountToStakeReuse,

        /// User tried to withdraw candidacy when not candidating.
        NotCandidatingNow,

        /// Can't withdraw candidacy outside of the candidacy announcement period.
        CantWithdrawCandidacyNow,
    }
}

impl<T: Trait> PartialEq for Error<T> {
    fn eq(&self, other: &Self) -> bool {
        self.as_u8() == other.as_u8()
    }
}

impl<T: Trait> From<BadOrigin> for Error<T> {
    fn from(_error: BadOrigin) -> Self {
        Error::<T>::BadOrigin
    }
}

/////////////////// Module definition and implementation ///////////////////////

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error<T>;

        /// Setup events
        fn deposit_event() = default;

        /////////////////// Lifetime ///////////////////////////////////////////

        // No origin so this is a priviledged call
        fn on_finalize(now: T::BlockNumber) {
            // council stage progress
            Self::try_progress_stage(now);

            // budget reward payment + budget refill
            Self::try_process_budget(now);
        }

        /////////////////// Election-related ///////////////////////////////////

        /// Subscribe candidate
        #[weight = 10_000_000]
        pub fn announce_candidacy(origin, membership_id: T::MembershipId, staking_account_id: T::AccountId, reward_account_id: T::AccountId, stake: Balance<T>) -> Result<(), Error<T>> {
            // ensure action can be started
            let (stage_data, previous_staking_account_id) = EnsureChecks::<T>::can_announce_candidacy(origin, &membership_id, &staking_account_id, &reward_account_id, &stake)?;

            // prepare candidate
            let candidate = Self::prepare_new_candidate(staking_account_id, reward_account_id, stake);

            //
            // == MUTATION SAFE ==
            //
            if let Some(tmp_account_id) = previous_staking_account_id {
                Mutations::<T>::release_candidacy_stake(&membership_id, &tmp_account_id);
            }

            // update state
            Mutations::<T>::announce_candidacy(&stage_data, &membership_id, &candidate, &stake);

            // emit event
            Self::deposit_event(RawEvent::NewCandidate(membership_id, stake));

            Ok(())
        }

        /// Release candidacy stake that is no longer needed.
        #[weight = 10_000_000]
        pub fn release_candidacy_stake(origin, membership_id: T::MembershipId) -> Result<(), Error<T>> {
            let staking_account_id = EnsureChecks::<T>::can_release_candidacy_stake(origin, &membership_id)?;

            //
            // == MUTATION SAFE ==
            //

            // update state
            Mutations::<T>::release_candidacy_stake(&membership_id, &staking_account_id);

            // emit event
            Self::deposit_event(RawEvent::CandidacyStakeRelease(membership_id));

            Ok(())
        }

        /// Withdraw candidacy and release candidacy stake.
        #[weight = 10_000_000]
        pub fn withdraw_candidacy(origin, membership_id: T::MembershipId) -> Result<(), Error<T>> {
            let staking_account_id = EnsureChecks::<T>::can_withdraw_candidacy(origin, &membership_id)?;

            //
            // == MUTATION SAFE ==
            //

            // update state
            Mutations::<T>::release_candidacy_stake(&membership_id, &staking_account_id);

            // emit event
            Self::deposit_event(RawEvent::CandidacyWithdraw(membership_id));

            Ok(())
        }

        /// Set short description for the user's candidacy. Can be called anytime during user's candidacy.
        #[weight = 10_000_000]
        pub fn set_candidacy_note(origin, membership_id: T::MembershipId, note: Vec<u8>) -> Result<(), Error<T>> {
            // ensure action can be started
            EnsureChecks::<T>::can_set_candidacy_note(origin, &membership_id)?;

            //
            // == MUTATION SAFE ==
            //

            // calculate note's hash
            let note_hash = T::Hashing::hash(note.as_slice());

            // update state
            Mutations::<T>::set_candidacy_note(&membership_id, &note_hash);

            // emit event
            Self::deposit_event(RawEvent::CandidacyNoteSet(membership_id, note));

            Ok(())
        }

        /// Sets the budget balance.
        #[weight = 10_000_000]
        pub fn set_budget(origin, balance: Balance<T>) -> Result<(), Error<T>> {
            // ensure action can be started
            EnsureChecks::<T>::can_set_budget(origin)?;

            //
            // == MUTATION SAFE ==
            //

            // update state
            Mutations::<T>::set_budget(&balance);

            // emit event
            Self::deposit_event(RawEvent::BudgetBalanceSet(balance));

            Ok(())
        }

        /// Plan the next budget refill.
        #[weight = 10_000_000]
        pub fn plan_budget_refill(origin, next_refill: T::BlockNumber) -> Result<(), Error<T>> {
            // ensure action can be started
            EnsureChecks::<T>::can_plan_budget_refill(origin)?;

            //
            // == MUTATION SAFE ==
            //

            // update state
            Mutations::<T>::plan_budget_refill(&next_refill);

            // emit event
            Self::deposit_event(RawEvent::BudgetRefillPlanned(next_refill));

            Ok(())
        }
    }
}

/////////////////// Inner logic ////////////////////////////////////////////////

impl<T: Trait> Module<T> {
    /////////////////// Lifetime ///////////////////////////////////////////

    /// Checkout expire of referendum stage.
    fn try_progress_stage(now: T::BlockNumber) {
        // election progress
        match Stage::<T>::get().stage {
            CouncilStage::Announcing(stage_data) => {
                if now
                    == Stage::<T>::get().changed_at + T::AnnouncingPeriodDuration::get() - 1.into()
                {
                    Self::end_announcement_period(stage_data);
                }
            }
            CouncilStage::Idle => {
                if now == Stage::<T>::get().changed_at + T::IdlePeriodDuration::get() - 1.into() {
                    Self::end_idle_period();
                }
            }
            _ => (),
        }
    }

    /// Checkout elected council members reward payments.
    fn try_process_budget(now: T::BlockNumber) {
        // budget autorefill
        if now == NextBudgetRefill::<T>::get() {
            Self::refill_budget(now);
        }

        // council members rewards
        if now == NextRewardPayments::<T>::get() {
            Self::pay_elected_member_rewards(now);
        }
    }

    /// Finish voting and start ravealing.
    fn end_announcement_period(stage_data: CouncilStageAnnouncing) {
        let candidate_count = T::CouncilSize::get() + T::MinNumberOfExtraCandidates::get();

        // reset announcing period when not enough candidates registered
        if stage_data.candidates_count < candidate_count {
            Mutations::<T>::start_announcing_period();

            // emit event
            Self::deposit_event(RawEvent::NotEnoughCandidates());

            return;
        }

        // update state
        Mutations::<T>::finalize_announcing_period(&stage_data);

        // emit event
        Self::deposit_event(RawEvent::VotingPeriodStarted(stage_data.candidates_count));
    }

    /// Conclude election period and elect new council if possible.
    fn end_election_period(winners: &[OptionResult<VotePowerOf<T>>]) {
        let council_size = T::CouncilSize::get();
        if winners.len() as u64 != council_size {
            // reset candidacy announcement period
            Mutations::<T>::start_announcing_period();

            // emit event
            Self::deposit_event(RawEvent::NewCouncilNotElected());

            return;
        }

        let now: T::BlockNumber = <system::Module<T>>::block_number();

        // prepare candidates that got elected
        let elected_members: Vec<CouncilMemberOf<T>> = winners
            .iter()
            .map(|item| {
                let membership_id = item.option_id.into();
                let candidate = Candidates::<T>::get(membership_id);

                // clear candidate record and unlock their candidacy stake
                Mutations::<T>::clear_candidate(&membership_id, &candidate);

                (candidate, membership_id, now, 0.into()).into()
            })
            .collect();
        // prepare council users for event
        let elected_council_users = elected_members
            .iter()
            .map(|item| item.membership_id)
            .collect();

        // update state
        Mutations::<T>::elect_new_council(elected_members.as_slice(), now);

        // emit event
        Self::deposit_event(RawEvent::NewCouncilElected(elected_council_users));
    }

    /// Finish idle period and start new council election cycle (announcing period).
    fn end_idle_period() {
        // update state
        Mutations::<T>::start_announcing_period();

        // emit event
        Self::deposit_event(RawEvent::AnnouncingPeriodStarted());
    }

    /////////////////// Budget-related /////////////////////////////////////

    /// Refill (increase) the budget's balance.
    fn refill_budget(now: T::BlockNumber) {
        // get refill amount
        let refill_amount = T::BudgetRefillAmount::get();

        // refill budget
        Mutations::<T>::refill_budget(&refill_amount);

        // calculate next refill block number
        let refill_period = T::BudgetRefillPeriod::get();
        let next_refill = now + refill_period;

        // plan next budget refill
        Mutations::<T>::plan_budget_refill(&next_refill);

        // emit events
        Self::deposit_event(RawEvent::BudgetRefill(refill_amount));
        Self::deposit_event(RawEvent::BudgetRefillPlanned(next_refill));
    }

    /// Pay rewards to elected council members.
    fn pay_elected_member_rewards(now: T::BlockNumber) {
        let reward_per_block = T::ElectedMemberRewardPerBlock::get();
        let starting_balance = Budget::<T>::get();

        // pay reward to all council members
        let new_balance = CouncilMembers::<T>::get().iter().enumerate().fold(
            starting_balance,
            |balance, (member_index, council_member)| {
                // calculate unpaid reward
                let unpaid_reward =
                    Calculations::<T>::get_current_reward(&council_member, reward_per_block, now);

                // depleted budget or no accumulated reward to be paid?
                if balance == 0.into() || unpaid_reward == 0.into() {
                    // no need to save anything because unpaid_reward will be recalculated next time rewards are paid

                    // emit event
                    Self::deposit_event(RawEvent::RewardPayment(
                        council_member.membership_id,
                        council_member.reward_account_id.clone(),
                        0.into(),
                        unpaid_reward,
                    ));
                    return balance;
                }

                // calculate withdrawable balance
                let (available_balance, missing_balance) =
                    Calculations::<T>::payable_reward(&balance, &unpaid_reward);

                // pay reward
                Mutations::<T>::pay_reward(
                    member_index,
                    &council_member.reward_account_id,
                    &available_balance,
                    &missing_balance,
                    &now,
                );

                // emit event
                Self::deposit_event(RawEvent::RewardPayment(
                    council_member.membership_id,
                    council_member.reward_account_id.clone(),
                    available_balance,
                    missing_balance,
                ));

                // return new balance
                balance - available_balance
            },
        );

        // update state
        Mutations::<T>::finish_reward_payments(new_balance, now);
    }

    /////////////////// Utils //////////////////////////////////////////////////

    /// Construct a new candidate for council election.
    fn prepare_new_candidate(
        staking_account_id: T::AccountId,
        reward_account_id: T::AccountId,
        stake: Balance<T>,
    ) -> CandidateOf<T> {
        Candidate {
            staking_account_id,
            reward_account_id,
            cycle_id: AnnouncementPeriodNr::get(),
            stake,
            note_hash: None,
        }
    }
}

impl<T: Trait> ReferendumConnection<T> for Module<T> {
    /// Process candidates' results recieved from the referendum.
    fn recieve_referendum_results(winners: &[OptionResult<VotePowerOf<T>>]) {
        //
        // == MUTATION SAFE ==
        //

        // conclude election
        Self::end_election_period(winners);
    }

    /// Check that it is a proper time to release stake.
    fn can_unlock_vote_stake(
        vote: &CastVoteOf<T>,
        current_voting_cycle_id: &u64,
    ) -> Result<(), Error<T>> {
        // allow release for very old votes
        if *current_voting_cycle_id > vote.cycle_id + 1 {
            return Ok(());
        }

        let voting_for_winner = CouncilMembers::<T>::get()
            .iter()
            .map(|council_member| council_member.membership_id)
            .any(|membership_id| vote.vote_for == Some(membership_id.into()));

        // allow release for vote from previous elections only when not voted for winner
        if *current_voting_cycle_id == vote.cycle_id + 1 {
            // ensure vote was not cast for the one of winning candidates / council members
            if voting_for_winner {
                return Err(Error::CantReleaseStakeNow);
            }

            return Ok(());
        }

        // at this point vote.cycle_id == current_voting_cycle_id

        // ensure election has ended and voter haven't voted for winner
        if voting_for_winner || !matches!(Stage::<T>::get().stage, CouncilStage::Idle) {
            return Err(Error::CantReleaseStakeNow);
        }

        Ok(())
    }

    /// Checks that user is indeed candidating.
    fn is_valid_candidate_id(membership_id: &T::MembershipId) -> bool {
        if !Candidates::<T>::contains_key(membership_id) {
            return false;
        }

        let candidate = Candidates::<T>::get(membership_id);

        candidate.cycle_id == AnnouncementPeriodNr::get()
    }
}

/////////////////// Calculations ///////////////////////////////////////////////

struct Calculations<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> Calculations<T> {
    /// Calculate current reward for the recipient.
    fn get_current_reward(
        council_member: &CouncilMemberOf<T>,
        reward_per_block: Balance<T>,
        now: T::BlockNumber,
    ) -> Balance<T> {
        // calculate currently unpaid reward for elected council member
        // previously_unpaid_reward + (current_block_number - last_payment_block_number) * reward_per_block
        council_member.unpaid_reward.saturating_add(
            now.saturating_sub(council_member.last_payment_block)
                .saturated_into()
                .saturating_mul(reward_per_block.saturated_into())
                .saturated_into(),
        )
    }

    /// Retrieve current budget's balance and calculate missing balance for reward payment.
    fn payable_reward(
        budget_balance: &Balance<T>,
        reward_amount: &Balance<T>,
    ) -> (Balance<T>, Balance<T>) {
        // check if reward has enough balance
        if reward_amount <= budget_balance {
            return (*reward_amount, 0.into());
        }

        // calculate missing balance
        let missing_balance = reward_amount.saturating_sub(*budget_balance);

        (*budget_balance, missing_balance)
    }
}

/////////////////// Mutations //////////////////////////////////////////////////

struct Mutations<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> Mutations<T> {
    /////////////////// Election-related ///////////////////////////////////

    /// Change the council stage to candidacy announcing stage.
    fn start_announcing_period() {
        let stage_data = CouncilStageAnnouncing {
            candidates_count: 0,
        };

        let block_number = <system::Module<T>>::block_number();

        // set stage
        Stage::<T>::put(CouncilStageUpdate {
            stage: CouncilStage::Announcing(stage_data),
            changed_at: block_number + 1.into(), // set next block as the start of next phase (this function is invoke on block finalization)
        });

        // increase anouncement cycle id
        AnnouncementPeriodNr::mutate(|value| *value += 1);
    }

    /// Change the council stage from the announcing to the election stage.
    fn finalize_announcing_period(stage_data: &CouncilStageAnnouncing) {
        let extra_winning_target_count = T::CouncilSize::get() - 1;

        // start referendum
        T::Referendum::force_start(extra_winning_target_count, AnnouncementPeriodNr::get());

        let block_number = <system::Module<T>>::block_number();

        // change council state
        Stage::<T>::put(CouncilStageUpdate {
            stage: CouncilStage::Election(CouncilStageElection {
                candidates_count: stage_data.candidates_count,
            }),
            changed_at: block_number + 1.into(), // set next block as the start of next phase (this function is invoke on block finalization)
        });
    }

    /// Elect new council after successful election.
    fn elect_new_council(elected_members: &[CouncilMemberOf<T>], now: T::BlockNumber) {
        let block_number = <system::Module<T>>::block_number();

        // change council state
        Stage::<T>::mutate(|value| {
            *value = CouncilStageUpdate {
                stage: CouncilStage::Idle,
                changed_at: block_number + 1.into(), // set next block as the start of next phase
            }
        });

        // try to pay any unpaid rewards (any unpaid rewards after this will be discarded call)
        Module::<T>::pay_elected_member_rewards(now);

        // release stakes for previous council members
        for council_member in CouncilMembers::<T>::get() {
            T::ElectedMemberLock::unlock(&council_member.staking_account_id);
        }

        // set new council
        CouncilMembers::<T>::put(elected_members.to_vec());

        // setup elected member lock for new council's members
        for council_member in CouncilMembers::<T>::get() {
            // lock council member stake
            T::ElectedMemberLock::lock(&council_member.staking_account_id, council_member.stake);
        }
    }

    /// Announce user's candidacy.
    fn announce_candidacy(
        stage_data: &CouncilStageAnnouncing,
        membership_id: &T::MembershipId,
        candidate: &CandidateOf<T>,
        stake: &Balance<T>,
    ) {
        // insert candidate to candidate registery
        Candidates::<T>::insert(membership_id, candidate.clone());

        // prepare new stage
        let new_stage_data = CouncilStageAnnouncing {
            candidates_count: stage_data.candidates_count + 1,
        };

        // store new candidacy list
        Stage::<T>::mutate(|value| {
            *value = CouncilStageUpdate {
                stage: CouncilStage::Announcing(new_stage_data),

                // keep changed_at (and other values) - stage phase haven't changed
                ..*value
            }
        });

        // lock candidacy stake
        T::CandidacyLock::lock(&candidate.staking_account_id, *stake);
    }

    /// Release user's stake that was used for candidacy.
    fn release_candidacy_stake(membership_id: &T::MembershipId, account_id: &T::AccountId) {
        // release stake amount
        T::CandidacyLock::unlock(&account_id);

        // remove candidate record
        Candidates::<T>::remove(membership_id);
    }

    /// Set a new candidacy note for a candidate in the current election.
    fn set_candidacy_note(membership_id: &T::MembershipId, note_hash: &T::Hash) {
        Candidates::<T>::mutate(membership_id, |value| value.note_hash = Some(*note_hash));
    }

    /// Removes member's candidacy record.
    fn clear_candidate(membership_id: &T::MembershipId, candidate: &CandidateOf<T>) {
        // unlock candidacy stake
        T::CandidacyLock::unlock(&candidate.staking_account_id);

        // clear candidate record
        Candidates::<T>::remove(membership_id);
    }

    /////////////////// Budget-related /////////////////////////////////////////

    /// Set budget balance
    fn set_budget(balance: &Balance<T>) {
        Budget::<T>::put(balance);
    }

    /// Refill budget's balance.
    fn refill_budget(refill_amount: &Balance<T>) {
        Budget::<T>::mutate(|balance| *balance += *refill_amount);
    }

    // Plan next budget refill.
    fn plan_budget_refill(refill_at: &T::BlockNumber) {
        NextBudgetRefill::<T>::put(refill_at);
    }

    /// Pay reward to a single elected council member.
    fn pay_reward(
        member_index: usize,
        account_id: &T::AccountId,
        amount: &Balance<T>,
        missing_balance: &Balance<T>,
        now: &T::BlockNumber,
    ) {
        // mint tokens into reward account
        <<<T as Trait>::Referendum as ReferendumManager<
            <T as system::Trait>::Origin,
            <T as system::Trait>::AccountId,
            <T as system::Trait>::Hash,
        >>::Currency as Currency<<T as system::Trait>::AccountId>>::deposit_creating(
            account_id, *amount,
        );

        // update elected council member
        CouncilMembers::<T>::mutate(|members| {
            members[member_index].last_payment_block = *now;
            members[member_index].unpaid_reward = *missing_balance;
        });
    }

    /// Save reward-payments-related changes and plan the next reward payout.
    fn finish_reward_payments(new_balance: Balance<T>, now: T::BlockNumber) {
        // update budget's balance
        Budget::<T>::put(new_balance);

        // plan next rewards payment
        let next_reward_block = now + T::ElectedMemberRewardPeriod::get();
        NextRewardPayments::<T>::put(next_reward_block);
    }
}

/////////////////// Ensure checks //////////////////////////////////////////////

struct EnsureChecks<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> EnsureChecks<T> {
    /////////////////// Common checks //////////////////////////////////////////

    fn ensure_user_membership(
        origin: T::Origin,
        membership_id: &T::MembershipId,
    ) -> Result<T::AccountId, Error<T>> {
        let account_id = ensure_signed(origin)?;

        ensure!(
            T::is_council_member_account(membership_id, &account_id),
            Error::MembershipIdNotMatchAccount,
        );

        Ok(account_id)
    }

    /////////////////// Action checks //////////////////////////////////////////

    /// Ensures there is no problem in announcing candidacy.
    fn can_announce_candidacy(
        origin: T::Origin,
        membership_id: &T::MembershipId,
        staking_account_id: &T::AccountId,
        reward_account_id: &T::AccountId,
        stake: &Balance<T>,
    ) -> Result<(CouncilStageAnnouncing, Option<T::AccountId>), Error<T>> {
        // ensure user's membership
        Self::ensure_user_membership(origin, membership_id)?;

        // ensure staking account's membership
        if !T::CandidacyLock::is_member_staking_account(&membership_id, &staking_account_id) {
            return Err(Error::MembershipIdNotMatchAccount);
        }

        // ensure there are no conflicting stake types for the account
        if !T::CandidacyLock::is_account_free_of_conflicting_stakes(&staking_account_id) {
            return Err(Error::ConflictingStake);
        }

        if !T::is_council_member_account(&membership_id, &reward_account_id) {
            return Err(Error::MembershipIdNotMatchAccount);
        }

        let stage_data = match Stage::<T>::get().stage {
            CouncilStage::Announcing(stage_data) => stage_data,
            _ => return Err(Error::CantCandidateNow),
        };

        // when previous candidacy record is present, ensure user is not candidating twice & prepare old stake for unlocking
        let mut existing_staking_account_id = None;
        if Candidates::<T>::contains_key(membership_id) {
            let candidate = Candidates::<T>::get(membership_id);

            // prevent user from candidating twice in the same election
            if candidate.cycle_id == AnnouncementPeriodNr::get() {
                return Err(Error::CantCandidateTwice);
            }

            // remember old staking account
            existing_staking_account_id = Some(candidate.staking_account_id);
        }

        // ensure stake is above minimal threshold
        if stake < &T::MinCandidateStake::get() {
            return Err(Error::CandidacyStakeTooLow);
        }

        // ensure user has enough balance - includes any already locked candidacy stake as it will be reused
        if !T::CandidacyLock::is_enough_balance_for_stake(&staking_account_id, *stake) {
            return Err(Error::InsufficientBalanceForStaking);
        }

        Ok((stage_data, existing_staking_account_id))
    }

    /// Ensures there is no problem in releasing old candidacy stake.
    fn can_release_candidacy_stake(
        origin: T::Origin,
        membership_id: &T::MembershipId,
    ) -> Result<T::AccountId, Error<T>> {
        // ensure user's membership
        Self::ensure_user_membership(origin, membership_id)?;

        // escape when no previous candidacy stake is present
        if !Candidates::<T>::contains_key(membership_id) {
            return Err(Error::NoStake);
        }

        let candidate = Candidates::<T>::get(membership_id);

        // prevent user from releasing candidacy stake during election
        if candidate.cycle_id == AnnouncementPeriodNr::get()
            && !matches!(Stage::<T>::get().stage, CouncilStage::Idle)
        {
            return Err(Error::StakeStillNeeded);
        }

        Ok(candidate.staking_account_id)
    }

    /// Ensures there is no problem in withdrawing already announced candidacy.
    fn can_withdraw_candidacy(
        origin: T::Origin,
        membership_id: &T::MembershipId,
    ) -> Result<T::AccountId, Error<T>> {
        // ensure user's membership
        Self::ensure_user_membership(origin, membership_id)?;

        // escape when no previous candidacy stake is present
        if !Candidates::<T>::contains_key(membership_id) {
            return Err(Error::NotCandidatingNow);
        }

        let candidate = Candidates::<T>::get(membership_id);

        // ensure candidacy announcing period is running now
        match Stage::<T>::get().stage {
            CouncilStage::Announcing(_) => {
                // ensure candidacy was announced in current election cycle
                if candidate.cycle_id != AnnouncementPeriodNr::get() {
                    return Err(Error::NotCandidatingNow);
                }
            }
            _ => return Err(Error::CantWithdrawCandidacyNow),
        };

        Ok(candidate.staking_account_id)
    }

    /// Ensures there is no problem in setting new note for the candidacy.
    fn can_set_candidacy_note(
        origin: T::Origin,
        membership_id: &T::MembershipId,
    ) -> Result<(), Error<T>> {
        // ensure user's membership
        Self::ensure_user_membership(origin, membership_id)?;

        // escape when no previous candidacy stake is present
        if !Candidates::<T>::contains_key(membership_id) {
            return Err(Error::NotCandidatingNow);
        }

        let candidate = Candidates::<T>::get(membership_id);

        // ensure candidacy was announced in current election cycle
        if candidate.cycle_id != AnnouncementPeriodNr::get() {
            return Err(Error::NotCandidatingNow);
        }

        // ensure election hasn't ended yet
        if let CouncilStage::Idle = Stage::<T>::get().stage {
            return Err(Error::NotCandidatingNow);
        }

        Ok(())
    }

    // Ensures there is no problem in setting the budget balance.
    fn can_set_budget(origin: T::Origin) -> Result<(), Error<T>> {
        ensure_root(origin)?;

        Ok(())
    }

    // Ensures there is no problem in planning next budget refill.
    fn can_plan_budget_refill(origin: T::Origin) -> Result<(), Error<T>> {
        ensure_root(origin)?;

        Ok(())
    }
}
