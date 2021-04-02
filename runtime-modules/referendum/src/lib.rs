//! # Referendum module
//! General voting engine module for the the Joystream platform. Component of the council frame_system.
//!
//! ## Overview
//!
//! Referendum is an abstract module that enables priviliged network participants to vote on the given topic.
//! The module has no notion on the topic that is actually voted on focuses and rather focuses on enabling
//! users to cast their votes and selecting the winning option after voting concludes.
//!
//! The voting itself is divided into three phases. In the default Idle phase, the module waits
//! for the new voting round initiation by the runtime. In the Voting phase, users can submit sealed commitment
//! of their vote that they can later reveal in the Revealing phase. After the Revealing phase ends,
//! the Referendum becomes Idle again and waits for the new cycle start.
//!
//! The module supports an unlimited number of options for voting and one or multiple winners of the referendum.
//! Depending on the runtime implementation, users can be required to stake at least a minimum amount of currency,
//! and the winning options can be decided by the total number of votes received or the total amount staked
//! behind them.
//!
//! ## Supported extrinsics
//!
//! - [vote](./struct.Module.html#method.vote)
//! - [reveal_vote](./struct.Module.html#method.reveal_vote)
//! - [release_vote_stake](./struct.Module.html#method.release_vote_stake)
//!
//! ## Notes
//! This module is instantiable pallet as described here https://substrate.dev/recipes/3-entrees/instantiable.html
//! No default instance is provided.

/////////////////// Configuration //////////////////////////////////////////////
#![cfg_attr(not(feature = "std"), no_std)]

// used dependencies
use codec::{Codec, Decode, Encode};
use core::marker::PhantomData;
use frame_support::traits::{EnsureOrigin, Get};
use frame_support::weights::Weight;
use frame_support::{
    decl_error, decl_event, decl_module, decl_storage, ensure, error::BadOrigin, Parameter,
    StorageValue,
};
use frame_system::ensure_signed;
use sp_arithmetic::traits::BaseArithmetic;
use sp_runtime::traits::{MaybeSerialize, Member};
use sp_runtime::SaturatedConversion;
use sp_std::vec;
use sp_std::vec::Vec;

use staking_handler::StakingHandler;

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

// We need to re-expose this to implement in the runtime
#[cfg(feature = "runtime-benchmarks")]
pub use benchmarking::OptionCreator;

// declared modules
mod benchmarking;
mod mock;
mod tests;

/////////////////// Data Structures ////////////////////////////////////////////

/// Possible referendum states.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, PartialEq, Eq, Debug)]
pub enum ReferendumStage<BlockNumber, MemberId, VotePower> {
    /// The referendum is dormant and waiting to be started by external source.
    Inactive,
    /// In the voting stage, users can cast their sealed votes.
    Voting(ReferendumStageVoting<BlockNumber>),
    /// In the revealing stage, users can reveal votes they cast in the voting stage.
    Revealing(ReferendumStageRevealing<BlockNumber, MemberId, VotePower>),
}

impl<BlockNumber, MemberId, VotePower: Encode + Decode> Default
    for ReferendumStage<BlockNumber, MemberId, VotePower>
{
    fn default() -> ReferendumStage<BlockNumber, MemberId, VotePower> {
        ReferendumStage::Inactive
    }
}

/// Representation for voting stage state.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct ReferendumStageVoting<BlockNumber> {
    pub started: BlockNumber,      // block in which referendum started
    pub winning_target_count: u64, // target number of winners
    pub current_cycle_id: u64,     // index of current election
}

/// Representation for revealing stage state.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct ReferendumStageRevealing<BlockNumber, MemberId, VotePower> {
    // block in which referendum started
    pub started: BlockNumber,
    // target number of winners
    pub winning_target_count: u64,
    // intermediate winning options
    pub intermediate_winners: Vec<OptionResult<MemberId, VotePower>>,
    // index of current election
    pub current_cycle_id: u64,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default, Clone)]
pub struct OptionResult<MemberId, VotePower> {
    pub option_id: MemberId,
    pub vote_power: VotePower,
}

/// Vote cast in referendum. Vote target is concealed until user reveals commitment's proof.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct CastVote<Hash, Currency, MemberId> {
    // A commitment that a user submits in the voting stage before revealing what this vote is
    // actually for
    pub commitment: Hash,
    // current referendum cycle number
    pub cycle_id: u64,
    // stake locked for vote
    pub stake: Currency,
    // target option this vote favors; is `None` before the vote is revealed
    pub vote_for: Option<MemberId>,
}

/////////////////// Type aliases ///////////////////////////////////////////////

// `Ez` prefix in some of the following type aliases means *easy* and is meant to create unique
// short names aliasing existing structs and enums

// types simplifying access to common structs and enums
pub type BalanceOf<T> = <T as balances::Trait>::Balance;
pub type CastVoteOf<T> = CastVote<
    <T as frame_system::Trait>::Hash,
    BalanceOf<T>,
    <T as common::membership::Trait>::MemberId,
>;
pub type ReferendumStageVotingOf<T> =
    ReferendumStageVoting<<T as frame_system::Trait>::BlockNumber>;
pub type ReferendumStageRevealingOf<T, I> = ReferendumStageRevealing<
    <T as frame_system::Trait>::BlockNumber,
    <T as common::membership::Trait>::MemberId,
    <T as Trait<I>>::VotePower,
>;
pub type OptionResultOf<T, I> =
    OptionResult<<T as common::membership::Trait>::MemberId, <T as Trait<I>>::VotePower>;

// types aliases for check functions return values
pub type CanRevealResult<T, I> = (
    ReferendumStageRevealingOf<T, I>,
    <T as frame_system::Trait>::AccountId,
    CastVoteOf<T>,
);

/////////////////// Traits, Storage, Errors, and Events /////////////////////////

/// referendum WeightInfo
/// Note: This was auto generated through the benchmark CLI using the `--weight-trait` flag
pub trait WeightInfo {
    fn on_initialize_revealing(i: u32) -> Weight;
    fn on_initialize_voting() -> Weight;
    fn vote() -> Weight;
    fn reveal_vote_space_for_new_winner(i: u32) -> Weight;
    fn reveal_vote_space_not_in_winners(i: u32) -> Weight;
    fn reveal_vote_space_replace_last_winner(i: u32) -> Weight;
    fn reveal_vote_already_existing(i: u32) -> Weight;
    fn release_vote_stake() -> Weight;
}

type ReferendumWeightInfo<T, I> = <T as Trait<I>>::WeightInfo;

/// Trait that should be used by other modules to start the referendum, etc.
pub trait ReferendumManager<Origin, AccountId, MemberId, Hash> {
    /// Power of vote(s) used to determine the referendum winner(s).
    type VotePower: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    /// Start a new referendum.
    fn start_referendum(
        origin: Origin,
        extra_winning_target_count: u64,
        cycle_id: u64,
    ) -> Result<(), ()>;

    /// Start referendum independent of the current state.
    /// If an election is running before calling this function, it will be discontinued without
    /// any winners selected.
    /// If it is called with a bigger winning target count greated than the max allowed the max
    /// will be used
    fn force_start(extra_winning_target_count: u64, cycle_id: u64);

    /// Calculate commitment for a vote.
    fn calculate_commitment(
        account_id: &AccountId,
        salt: &[u8],
        cycle_id: &u64,
        vote_option_id: &MemberId,
    ) -> Hash;
}

/// The main Referendum module's trait.
pub trait Trait<I: Instance = DefaultInstance>:
    frame_system::Trait + common::membership::Trait + balances::Trait
{
    /// The overarching event type.
    type Event: From<Event<Self, I>> + Into<<Self as frame_system::Trait>::Event>;

    /// Maximum length of vote commitment salt. Use length that ensures uniqueness for hashing
    /// e.g. std::u64::MAX.
    type MaxSaltLength: Get<u64>;

    /// Stakes and balance locks handler.
    type StakingHandler: StakingHandler<Self::AccountId, BalanceOf<Self>, Self::MemberId>;

    /// Origin from which the referendum can be started.
    type ManagerOrigin: EnsureOrigin<Self::Origin>;

    /// Power of vote(s) used to determine the referendum winner(s).
    type VotePower: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    /// Duration of voting stage (number of blocks)
    type VoteStageDuration: Get<Self::BlockNumber>;
    /// Duration of revealing stage (number of blocks)
    type RevealStageDuration: Get<Self::BlockNumber>;

    /// Minimum stake needed for voting
    type MinimumStake: Get<BalanceOf<Self>>;

    /// Weight information for extrinsics in this pallet.
    type WeightInfo: WeightInfo;

    /// Maximum number of winning target count
    type MaxWinnerTargetCount: Get<u64>;

    /// Calculate the vote's power for user and his stake.
    fn calculate_vote_power(
        account_id: &<Self as frame_system::Trait>::AccountId,
        stake: &BalanceOf<Self>,
    ) -> <Self as Trait<I>>::VotePower;

    /// Checks if user can unlock his stake from the given vote.
    /// Gives runtime an ability to penalize user for not revealing stake, etc.
    fn can_unlock_vote_stake(vote: &CastVote<Self::Hash, BalanceOf<Self>, Self::MemberId>) -> bool;

    /// Gives runtime an ability to react on referendum result.
    fn process_results(winners: &[OptionResult<Self::MemberId, Self::VotePower>]);

    /// Check if an option a user is voting for actually exists.
    fn is_valid_option_id(option_id: &Self::MemberId) -> bool;

    /// If the id is a valid alternative, the current total voting mass backing it is returned,
    /// otherwise nothing.
    fn get_option_power(option_id: &Self::MemberId) -> Self::VotePower;

    /// Increases voting mass behind given alternative by given amount, if present and return true,
    /// otherwise return false.
    fn increase_option_power(option_id: &Self::MemberId, amount: &Self::VotePower);
}

decl_storage! {
    trait Store for Module<T: Trait<I>, I: Instance = DefaultInstance> as Referendum {
        /// Current referendum stage.
        pub Stage get(fn stage) config():
            ReferendumStage<T::BlockNumber, T::MemberId, T::VotePower>;

        /// Votes cast in the referendum. A new record is added to this map when a user casts a
        /// sealed vote.
        /// It is modified when a user reveals the vote's commitment proof.
        /// A record is finally removed when the user unstakes, which can happen during a voting
        /// stage or after the current cycle ends.
        /// A stake for a vote can be reused in future referendum cycles.
        pub Votes get(fn votes) config(): map hasher(blake2_128_concat)
                                          T::AccountId => CastVoteOf<T>;
    }
}

decl_event! {
    pub enum Event<T, I = DefaultInstance>
    where
        Balance = BalanceOf<T>,
        <T as frame_system::Trait>::Hash,
        <T as frame_system::Trait>::AccountId,
        <T as Trait<I>>::VotePower,
        <T as common::membership::Trait>::MemberId,
    {
        /// Referendum started
        ReferendumStarted(u64),

        /// Referendum started
        ReferendumStartedForcefully(u64),

        /// Revealing phase has begun
        RevealingStageStarted(),

        /// Referendum ended and winning option was selected
        ReferendumFinished(Vec<OptionResult<MemberId, VotePower>>),

        /// User cast a vote in referendum
        VoteCast(AccountId, Hash, Balance),

        /// User revealed his vote
        VoteRevealed(AccountId, MemberId, Vec<u8>),

        /// User released his stake
        StakeReleased(AccountId),
    }
}

decl_error! {
    /// Referendum errors
    pub enum Error for Module<T: Trait<I>, I: Instance> {
        /// Origin is invalid
        BadOrigin,

        /// Referendum is not running when expected to
        ReferendumNotRunning,

        /// Revealing stage is not in progress right now
        RevealingNotInProgress,

        /// Staking account contains conflicting stakes.
        ConflictStakesOnAccount,

        /// Account Insufficient Free Balance (now)
        InsufficientBalanceToStake,

        /// Insufficient stake provided to cast a vote
        InsufficientStake,

        /// Salt and referendum option provided don't correspond to the commitment
        InvalidReveal,

        /// Vote for not existing option was revealed
        InvalidVote,

        /// Trying to reveal vote that was not cast
        VoteNotExisting,

        /// Trying to vote multiple time in the same cycle
        AlreadyVotedThisCycle,

        /// Invalid time to release the locked stake
        UnstakingVoteInSameCycle,

        /// Salt is too long
        SaltTooLong,

        /// Unstaking has been forbidden for the user (at least for now)
        UnstakingForbidden,
    }
}

impl<T: Trait<I>, I: Instance> PartialEq for Error<T, I> {
    fn eq(&self, other: &Self) -> bool {
        self.as_u8() == other.as_u8()
    }
}

impl<T: Trait<I>, I: Instance> From<BadOrigin> for Error<T, I> {
    fn from(_error: BadOrigin) -> Self {
        Error::<T, I>::BadOrigin
    }
}

/////////////////// Module definition and implementation ///////////////////////

decl_module! {
    pub struct Module<T: Trait<I>, I: Instance = DefaultInstance> for enum Call
        where origin: T::Origin {
        /// Predefined errors
        type Error = Error<T, I>;

        /// Setup events
        fn deposit_event() = default;

        /// Maximum length of vote commitment salt. Use length that ensures uniqueness for hashing
        /// e.g. std::u64::MAX.
        const MaxSaltLength: u64 = T::MaxSaltLength::get();
        /// Duration of voting stage (number of blocks)
        const VoteStageDuration: T::BlockNumber = T::VoteStageDuration::get();
        /// Duration of revealing stage (number of blocks)
        const RevealStageDuration: T::BlockNumber = T::RevealStageDuration::get();
        /// Minimum stake needed for voting
        const MinimumStake: BalanceOf<T> = T::MinimumStake::get();

        /////////////////// Lifetime ///////////////////////////////////////////

        // No origin so this is a priviledged call
        fn on_initialize() -> Weight {
            Self::try_progress_stage(frame_system::Module::<T>::block_number());

            ReferendumWeightInfo::<T, I>::on_initialize_voting()
                .max(ReferendumWeightInfo::<T, I>::on_initialize_revealing(
                        T::MaxWinnerTargetCount::get().saturated_into()
                ))
        }

        /////////////////// User actions ///////////////////////////////////////

        /// Cast a sealed vote in the referendum.
        ///
        /// # <weight>
        ///
        /// ## weight
        /// `O (1)`
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight = ReferendumWeightInfo::<T, I>::vote()]
        pub fn vote(origin, commitment: T::Hash, stake: BalanceOf<T>) -> Result<(), Error<T, I>> {
            // ensure action can be started
            let (current_cycle_id, account_id) = EnsureChecks::<T, I>::can_vote(origin, &stake)?;

            //
            // == MUTATION SAFE ==
            //

            // start revealing phase - it can return error when stake fails to lock
            Mutations::<T, I>::vote(&account_id, &commitment, &stake, &current_cycle_id)?;

            // emit event
            Self::deposit_event(RawEvent::VoteCast(account_id, commitment, stake));

            Ok(())
        }

        /// Reveal a sealed vote in the referendum.
        ///
        /// # <weight>
        ///
        /// ## Weight
        /// `O (W)` where:
        /// - `W` is the number of `intermediate_winners` stored in the current
        ///     `Stage::<T, I>::get()`
        /// - DB:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight = Module::<T, I>::calculate_reveal_vote_weight(
            T::MaxWinnerTargetCount::get().saturated_into()
        )]
        pub fn reveal_vote(
            origin,
            salt: Vec<u8>,
            vote_option_id: <T as common::membership::Trait>::MemberId
        ) -> Result<(), Error<T, I>> {
            let (stage_data, account_id, cast_vote) =
                EnsureChecks::<T, I>::can_reveal_vote::<Self>(origin, &salt, &vote_option_id)?;

            //
            // == MUTATION SAFE ==
            //

            // reveal the vote - it can return error when stake fails to unlock
            Mutations::<T, I>::reveal_vote(stage_data, &account_id, &vote_option_id, cast_vote)?;

            // emit event
            Self::deposit_event(RawEvent::VoteRevealed(account_id, vote_option_id, salt));

            Ok(())
        }

        /// Release a locked stake.
        /// # <weight>
        ///
        /// ## weight
        /// `O (1)`
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight = ReferendumWeightInfo::<T, I>::release_vote_stake()]
        pub fn release_vote_stake(origin) -> Result<(), Error<T, I>> {
            let account_id = EnsureChecks::<T, I>::can_release_vote_stake(origin)?;

            //
            // == MUTATION SAFE ==
            //

            // reveal the vote - it can return error when stake fails to unlock
            Mutations::<T, I>::release_vote_stake(&account_id);

            // emit event
            Self::deposit_event(RawEvent::StakeReleased(account_id));

            Ok(())
        }
    }
}

/////////////////// Inner logic ////////////////////////////////////////////////

impl<T: Trait<I>, I: Instance> Module<T, I> {
    // Calculate reveal_vote weight
    fn calculate_reveal_vote_weight(number_of_winners: u32) -> Weight {
        ReferendumWeightInfo::<T, I>::reveal_vote_space_for_new_winner(number_of_winners)
            .max(ReferendumWeightInfo::<T, I>::reveal_vote_space_not_in_winners(number_of_winners))
            .max(
                ReferendumWeightInfo::<T, I>::reveal_vote_space_replace_last_winner(
                    number_of_winners,
                ),
            )
            .max(
                ReferendumWeightInfo::<T, I>::reveal_vote_space_replace_last_winner(
                    number_of_winners,
                ),
            )
            .max(ReferendumWeightInfo::<T, I>::reveal_vote_already_existing(
                number_of_winners,
            ))
    }

    // Checkout expire of referendum stage.
    fn try_progress_stage(now: T::BlockNumber) {
        match Stage::<T, I>::get() {
            ReferendumStage::Inactive => (),
            ReferendumStage::Voting(stage_data) => {
                if now == stage_data.started + T::VoteStageDuration::get() {
                    Self::end_voting_period(stage_data);
                }
            }
            ReferendumStage::Revealing(stage_data) => {
                if now == stage_data.started + T::RevealStageDuration::get() {
                    Self::end_reveal_period(stage_data);
                }
            }
        }
    }

    // Finish voting and start ravealing.
    fn end_voting_period(stage_data: ReferendumStageVotingOf<T>) {
        // start revealing phase
        Mutations::<T, I>::start_revealing_period(stage_data);

        // emit event
        Self::deposit_event(RawEvent::RevealingStageStarted());
    }

    // Conclude the referendum.
    fn end_reveal_period(stage_data: ReferendumStageRevealingOf<T, I>) {
        // conclude referendum
        let winners = Mutations::<T, I>::conclude_referendum(stage_data);

        // let runtime know about referendum results
        T::process_results(&winners);

        // emit event
        Self::deposit_event(RawEvent::ReferendumFinished(winners));
    }
}

/////////////////// ReferendumManager //////////////////////////////////////////

impl<T: Trait<I>, I: Instance> ReferendumManager<T::Origin, T::AccountId, T::MemberId, T::Hash>
    for Module<T, I>
{
    type VotePower = T::VotePower;

    // Start new referendum run.
    fn start_referendum(
        origin: T::Origin,
        extra_winning_target_count: u64,
        cycle_id: u64,
    ) -> Result<(), ()> {
        let winning_target_count = extra_winning_target_count + 1;

        // ensure action can be started
        EnsureChecks::<T, I>::can_start_referendum(origin)?;

        // ensure that the winning target count doesn't go over the limit
        ensure!(winning_target_count <= T::MaxWinnerTargetCount::get(), ());

        //
        // == MUTATION SAFE ==
        //

        // update state
        Mutations::<T, I>::start_voting_period(&winning_target_count, &cycle_id);

        // emit event
        Self::deposit_event(RawEvent::ReferendumStarted(winning_target_count));

        Ok(())
    }

    // Start referendum independent of the current state.
    // If an election is running before calling this function, it will be discontinued without any
    // winners selected.
    fn force_start(extra_winning_target_count: u64, cycle_id: u64) {
        let winning_target_count = extra_winning_target_count + 1;

        // If a greater than the max allowed target count is used the max will be used in its place
        let winning_target_count = winning_target_count.min(T::MaxWinnerTargetCount::get());

        // remember if referendum is running
        let referendum_running = !matches!(Stage::<T, I>::get(), ReferendumStage::Inactive);

        // update state
        Mutations::<T, I>::start_voting_period(&winning_target_count, &cycle_id);

        // emit event
        if referendum_running {
            Self::deposit_event(RawEvent::ReferendumStartedForcefully(winning_target_count));
        } else {
            Self::deposit_event(RawEvent::ReferendumStarted(winning_target_count));
        }
    }

    // Calculate commitment for a vote.
    fn calculate_commitment(
        account_id: &<T as frame_system::Trait>::AccountId,
        salt: &[u8],
        cycle_id: &u64,
        vote_option_id: &<T as common::membership::Trait>::MemberId,
    ) -> T::Hash {
        let mut payload = account_id.encode();
        let mut mut_option_id = vote_option_id.encode();
        let mut mut_salt = salt.encode(); //.to_vec();
        let mut mut_cycle_id = cycle_id.encode(); //.to_vec();

        payload.append(&mut mut_option_id);
        payload.append(&mut mut_salt);
        payload.append(&mut mut_cycle_id);

        <T::Hashing as sp_runtime::traits::Hash>::hash(&payload)
    }
}

/////////////////// Mutations //////////////////////////////////////////////////

struct Mutations<T: Trait<I>, I: Instance> {
    _dummy: PhantomData<(T, I)>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait<I>, I: Instance> Mutations<T, I> {
    // Change the referendum stage from inactive to voting stage.
    fn start_voting_period(winning_target_count: &u64, cycle_id: &u64) {
        // change referendum state
        Stage::<T, I>::put(ReferendumStage::Voting(ReferendumStageVoting::<
            T::BlockNumber,
        > {
            started: <frame_system::Module<T>>::block_number(),
            winning_target_count: *winning_target_count,
            current_cycle_id: *cycle_id,
        }));
    }

    // Change the referendum stage from inactive to the voting stage.
    fn start_revealing_period(old_stage: ReferendumStageVotingOf<T>) {
        // change referendum state
        Stage::<T, I>::put(ReferendumStage::Revealing(ReferendumStageRevealingOf::<
            T,
            I,
        > {
            started: <frame_system::Module<T>>::block_number(),
            winning_target_count: old_stage.winning_target_count,
            intermediate_winners: vec![],
            current_cycle_id: old_stage.current_cycle_id,
        }));
    }

    // Conclude referendum, count votes, and select the winners.
    fn conclude_referendum(
        revealing_stage: ReferendumStageRevealingOf<T, I>,
    ) -> Vec<OptionResult<<T as common::membership::Trait>::MemberId, <T as Trait<I>>::VotePower>>
    {
        // reset referendum state
        Stage::<T, I>::put(ReferendumStage::Inactive);

        // return winning option
        revealing_stage.intermediate_winners
    }

    // Cast a user's sealed vote for the current referendum cycle.
    fn vote(
        account_id: &<T as frame_system::Trait>::AccountId,
        commitment: &T::Hash,
        stake: &BalanceOf<T>,
        current_cycle_id: &u64,
    ) -> Result<(), Error<T, I>> {
        // Should call after `can_vote`
        T::StakingHandler::lock(account_id, *stake);

        // store vote
        Votes::<T, I>::insert(
            account_id,
            CastVote {
                commitment: *commitment,
                stake: *stake,
                cycle_id: *current_cycle_id,
                vote_for: None,
            },
        );

        Ok(())
    }

    // Reveal user's vote target and check the commitment proof.
    fn reveal_vote(
        stage_data: ReferendumStageRevealingOf<T, I>,
        account_id: &<T as frame_system::Trait>::AccountId,
        option_id: &<T as common::membership::Trait>::MemberId,
        cast_vote: CastVoteOf<T>,
    ) -> Result<(), Error<T, I>> {
        // prepare new values
        let vote_power = T::calculate_vote_power(&account_id, &cast_vote.stake);
        let option_result = OptionResult {
            option_id: *option_id,
            vote_power,
        };
        // try to insert option to winner list or update it's value when already present
        let new_winners = Self::try_winner_insert(
            option_result,
            &stage_data.intermediate_winners,
            stage_data.winning_target_count,
        );
        let new_stage_data = ReferendumStageRevealing {
            intermediate_winners: new_winners,
            ..stage_data
        };

        // let runtime update option's vote power
        T::increase_option_power(option_id, &vote_power);

        // store revealed vote
        Stage::<T, I>::mutate(|stage| *stage = ReferendumStage::Revealing(new_stage_data));

        // remove user commitment to prevent repeated revealing
        Votes::<T, I>::mutate(account_id, |vote| (*vote).vote_for = Some(*option_id));

        Ok(())
    }

    // Release stake associated to the user's last vote.
    fn release_vote_stake(account_id: &<T as frame_system::Trait>::AccountId) {
        // unlock stake amount
        T::StakingHandler::unlock(account_id);

        // remove vote record
        Votes::<T, I>::remove(account_id);
    }

    // Tries to insert option to the proper place in the winners list. Utility for reaveal_vote()
    // function.
    fn try_winner_insert(
        option_result: OptionResultOf<T, I>,
        current_winners: &[OptionResultOf<T, I>],
        winning_target_count: u64,
    ) -> Vec<OptionResultOf<T, I>> {
        // Tries to place record to temporary place in the winning list.
        fn place_record_to_winner_list<T: Trait<I>, I: Instance>(
            option_result: OptionResultOf<T, I>,
            current_winners: &[OptionResultOf<T, I>],
            winning_target_count: u64,
        ) -> (Vec<OptionResultOf<T, I>>, Option<usize>) {
            let current_winners_count = current_winners.len();

            // check if option is already somewhere in list
            let current_winners_index_of_vote_recipient: Option<usize> = current_winners
                .iter()
                .enumerate()
                .find(|(_, value)| option_result.option_id == value.option_id)
                .map(|(index, _)| index);

            // espace when item is currently not in winning list and still has not enough vote
            // power to make it to already full list
            if current_winners_index_of_vote_recipient.is_none()
                && current_winners_count as u64 == winning_target_count
                && option_result.vote_power <= current_winners[current_winners_count - 1].vote_power
            {
                return (current_winners.to_vec(), None);
            }

            let mut new_winners = current_winners.to_vec();

            // update record in list when it is already present
            if let Some(index) = current_winners_index_of_vote_recipient {
                let old_option_total = T::get_option_power(&option_result.option_id);
                let new_option_total = old_option_total + option_result.vote_power;

                new_winners[index] = OptionResult {
                    option_id: option_result.option_id,
                    vote_power: new_option_total,
                };

                return (new_winners, Some(index));
            }

            // at this point record needs to be added to list

            // replace last winner if list is already full
            if current_winners_count as u64 == winning_target_count {
                let last_index = current_winners_count - 1;
                new_winners[last_index] = option_result;

                return (new_winners, Some(last_index));
            }

            // append winner to incomplete list
            new_winners.push(option_result);

            (new_winners, Some(current_winners_count))
        }

        // if there are no winners right now return list with only current option
        if current_winners.is_empty() {
            return vec![option_result];
        }

        // get new possibly updated list and record's position in it
        let (mut new_winners, current_record_index) = place_record_to_winner_list::<T, I>(
            option_result,
            current_winners,
            winning_target_count,
        );

        // resort list in case it was updated
        if let Some(index) = current_record_index {
            for i in (1..=index).rev() {
                if new_winners[i].vote_power <= new_winners[i - 1].vote_power {
                    break;
                }

                new_winners.swap(i, i - 1);
            }
        }

        new_winners.to_vec()
    }
}

/////////////////// Ensure checks //////////////////////////////////////////////

struct EnsureChecks<T: Trait<I>, I: Instance> {
    _dummy: PhantomData<(T, I)>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait<I>, I: Instance> EnsureChecks<T, I> {
    /////////////////// Common checks //////////////////////////////////////////

    fn ensure_regular_user(origin: T::Origin) -> Result<T::AccountId, Error<T, I>> {
        let account_id = ensure_signed(origin)?;

        Ok(account_id)
    }

    /////////////////// Action checks //////////////////////////////////////////

    fn can_start_referendum(origin: T::Origin) -> Result<(), ()> {
        T::ManagerOrigin::ensure_origin(origin).map_err(|_| ())?;

        // ensure referendum is not already running
        match Stage::<T, I>::get() {
            ReferendumStage::Inactive => Ok(()),
            _ => Err(()),
        }?;

        Ok(())
    }

    fn can_vote(
        origin: T::Origin,
        stake: &BalanceOf<T>,
    ) -> Result<(u64, T::AccountId), Error<T, I>> {
        fn prevent_repeated_vote<T: Trait<I>, I: Instance>(
            cycle_id: &u64,
            account_id: &T::AccountId,
        ) -> Result<(), Error<T, I>> {
            if !Votes::<T, I>::contains_key(&account_id) {
                return Ok(());
            }

            let existing_vote = Votes::<T, I>::get(&account_id);

            // don't allow repeated vote
            if existing_vote.cycle_id == *cycle_id {
                return Err(Error::<T, I>::AlreadyVotedThisCycle);
            }

            Ok(())
        }

        // ensure superuser requested action
        let account_id = Self::ensure_regular_user(origin)?;

        // ensure referendum is running
        let current_cycle_id = match Stage::<T, I>::get() {
            ReferendumStage::Voting(tmp_stage_data) => tmp_stage_data.current_cycle_id,
            _ => return Err(Error::ReferendumNotRunning),
        };

        // prevent repeated vote
        prevent_repeated_vote::<T, I>(&current_cycle_id, &account_id)?;

        // ensure stake is enough for voting
        ensure!(stake >= &T::MinimumStake::get(), Error::InsufficientStake);

        // Ensure account doesn't have conflicting stakes
        ensure!(
            T::StakingHandler::is_account_free_of_conflicting_stakes(&account_id),
            Error::ConflictStakesOnAccount
        );

        // ensure stake is enough for voting
        ensure!(
            T::StakingHandler::is_enough_balance_for_stake(&account_id, *stake),
            Error::InsufficientStake
        );

        Ok((current_cycle_id, account_id))
    }

    fn can_reveal_vote<R: ReferendumManager<T::Origin, T::AccountId, T::MemberId, T::Hash>>(
        origin: T::Origin,
        salt: &[u8],
        vote_option_id: &<T as common::membership::Trait>::MemberId,
    ) -> Result<CanRevealResult<T, I>, Error<T, I>> {
        // ensure superuser requested action
        let account_id = Self::ensure_regular_user(origin)?;

        // ensure referendum is running
        let stage_data = match Stage::<T, I>::get() {
            ReferendumStage::Revealing(tmp_stage_data) => tmp_stage_data,
            _ => return Err(Error::RevealingNotInProgress),
        };

        let cast_vote = Self::ensure_vote_exists(&account_id)?;

        // ask runtime if option is valid
        if !T::is_valid_option_id(vote_option_id) {
            return Err(Error::InvalidVote);
        }

        // ensure vote was cast for the running referendum
        if stage_data.current_cycle_id != cast_vote.cycle_id {
            return Err(Error::InvalidVote);
        }

        // ensure salt is not too long
        if salt.len() as u64 > T::MaxSaltLength::get() {
            return Err(Error::SaltTooLong);
        }

        // ensure commitment corresponds to salt and vote option
        let commitment = R::calculate_commitment(
            &account_id,
            salt,
            &stage_data.current_cycle_id,
            vote_option_id,
        );
        if commitment != cast_vote.commitment {
            return Err(Error::InvalidReveal);
        }

        Ok((stage_data, account_id, cast_vote))
    }

    fn can_release_vote_stake(origin: T::Origin) -> Result<T::AccountId, Error<T, I>> {
        // ensure superuser requested action
        let account_id = Self::ensure_regular_user(origin)?;

        let cast_vote = Self::ensure_vote_exists(&account_id)?;

        // ask runtime if stake can be released
        if !T::can_unlock_vote_stake(&cast_vote) {
            return Err(Error::UnstakingForbidden);
        }

        Ok(account_id)
    }

    fn ensure_vote_exists(account_id: &T::AccountId) -> Result<CastVoteOf<T>, Error<T, I>> {
        // ensure there is some vote with locked stake
        if !Votes::<T, I>::contains_key(account_id) {
            return Err(Error::VoteNotExisting);
        }

        let cast_vote = Votes::<T, I>::get(account_id);

        Ok(cast_vote)
    }
}
