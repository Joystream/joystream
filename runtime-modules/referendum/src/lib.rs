// TODO: adjust all extrinsic weights

//! # Referendum module
//! General voting engine module for the the Joystream platform. Component of the council system.
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
//! - [release_stake](./struct.Module.html#method.release_stake)
//!
//! ## Notes
//! This module is instantiable pallet as described here https://substrate.dev/recipes/3-entrees/instantiable.html
//! No default instance is provided.

/////////////////// Configuration //////////////////////////////////////////////
#![cfg_attr(not(feature = "std"), no_std)]

// used dependencies
use codec::{Codec, Decode, Encode};
use frame_support::traits::{
    Currency, EnsureOrigin, Get, LockIdentifier, LockableCurrency, WithdrawReason,
};
use frame_support::{
    decl_error, decl_event, decl_module, decl_storage, error::BadOrigin, Parameter, StorageValue,
};
use sp_arithmetic::traits::BaseArithmetic;
use sp_runtime::traits::{MaybeSerialize, Member};
use std::marker::PhantomData;
use system::ensure_signed;

// declared modules
mod mock;
mod tests;

/////////////////// Data Structures ////////////////////////////////////////////

/// Possible referendum states.
#[derive(Encode, Decode, PartialEq, Eq, Debug)]
pub enum ReferendumStage<BlockNumber, VotePower> {
    /// The referendum is dormant and waiting to be started by external source.
    Inactive,
    /// In the voting stage, users can cast their sealed votes.
    Voting(ReferendumStageVoting<BlockNumber>),
    /// In the revealing stage, users can reveal votes they cast in the voting stage.
    Revealing(ReferendumStageRevealing<BlockNumber, VotePower>),
}

impl<BlockNumber, VotePower: Encode + Decode> Default for ReferendumStage<BlockNumber, VotePower> {
    fn default() -> ReferendumStage<BlockNumber, VotePower> {
        ReferendumStage::Inactive
    }
}

/// Representation for voting stage state.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct ReferendumStageVoting<BlockNumber> {
    started: BlockNumber,      // block in which referendum started
    winning_target_count: u64, // target number of winners
}

/// Representation for revealing stage state.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct ReferendumStageRevealing<BlockNumber, VotePower> {
    pub started: BlockNumber,      // block in which referendum started
    pub winning_target_count: u64, // target number of winners
    pub intermediate_winners: Vec<OptionResult<VotePower>>, // intermediate winning options
}

#[derive(Encode, Decode, PartialEq, Eq, Debug, Default, Clone)]
pub struct OptionResult<VotePower> {
    pub option_id: u64,
    pub vote_power: VotePower,
}

/// Vote cast in referendum. Vote target is concealed until user reveals commitment's proof.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct CastVote<Hash, Currency> {
    commitment: Hash, // a commitment that a user submits in the voting stage before revealing what this vote is actually for
    cycle_id: u64,    // current referendum cycle number
    stake: Currency,  // stake locked for vote
    vote_for: Option<u64>, // target option this vote favors; is `None` before the vote is revealed
}

/////////////////// Type aliases ///////////////////////////////////////////////

// `Ez` prefix in some of the following type aliases means *easy* and is meant to create unique short names
// aliasing existing structs and enums

// types simplifying access to common structs and enums
pub type Balance<T, I> =
    <<T as Trait<I>>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;
pub type CastVoteOf<T, I> = CastVote<<T as system::Trait>::Hash, Balance<T, I>>;
pub type ReferendumStageVotingOf<T> = ReferendumStageVoting<<T as system::Trait>::BlockNumber>;
pub type ReferendumStageRevealingOf<T, I> =
    ReferendumStageRevealing<<T as system::Trait>::BlockNumber, <T as Trait<I>>::VotePower>;

// types aliases for check functions return values
pub type CanRevealResult<T, I> = (
    ReferendumStageRevealingOf<T, I>,
    <T as system::Trait>::AccountId,
    CastVoteOf<T, I>,
);

/////////////////// Trait, Storage, Errors, and Events /////////////////////////

/// Trait that should be used by other modules to start the referendum, etc.
pub trait ReferendumManager<Origin, AccountId, Hash> {
    /// Power of vote(s) used to determine the referendum winner(s).
    type VotePower: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    /// Currency for referendum staking.
    type Currency: LockableCurrency<AccountId>;

    /// Start a new referendum.
    fn start_referendum(origin: Origin, extra_winning_target_count: u64) -> Result<(), ()>;

    /// Calculate commitment for a vote.
    fn calculate_commitment(
        account_id: &AccountId,
        salt: &[u8],
        cycle_id: &u64,
        vote_option_id: &u64,
    ) -> Hash;
}

/// The main Referendum module's trait.
pub trait Trait<I: Instance>: system::Trait {
    /// The overarching event type.
    type Event: From<Event<Self, I>> + Into<<Self as system::Trait>::Event>;

    /// Maximum length of vote commitment salt. Use length that ensures uniqueness for hashing e.g. std::u64::MAX.
    type MaxSaltLength: Get<u64>;

    /// Currency for referendum staking.
    type Currency: LockableCurrency<Self::AccountId, Moment = Self::BlockNumber>;

    /// Identifier for currency locks used for staking.
    type LockId: Get<LockIdentifier>;

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

    /// Duration of voting stage (in blocks)
    type VoteStageDuration: Get<Self::BlockNumber>;
    /// Duration of revealing stage (in blocks)
    type RevealStageDuration: Get<Self::BlockNumber>;

    /// Minimum stake needed for voting
    type MinimumStake: Get<Balance<Self, I>>;

    /// Calculate the vote's power for user and his stake.
    fn caclulate_vote_power(
        account_id: &<Self as system::Trait>::AccountId,
        stake: &Balance<Self, I>,
    ) -> <Self as Trait<I>>::VotePower;

    /// Checks if user can unlock his stake from the given vote.
    /// Gives runtime an ability to penalize user for not revealing stake, etc.
    fn can_release_voting_stake(vote: &CastVote<Self::Hash, Balance<Self, I>>) -> bool;

    /// Gives runtime an ability to react on referendum result.
    fn process_results(winners: &[OptionResult<Self::VotePower>]);

    /// Check if an option a user is voting for actually exists.
    fn is_valid_option_id(option_id: &u64) -> bool;

    // If the id is a valid alternative, the current total voting mass backing it is returned, otherwise nothing.
    fn get_option_power(option_id: &u64) -> Self::VotePower;

    // Increases voting mass behind given alternative by given amount, if present and return true, otherwise return false.
    fn increase_option_power(option_id: &u64, amount: &Self::VotePower);
}

decl_storage! {
    trait Store for Module<T: Trait<I>, I: Instance> as Referendum {
        /// Current referendum stage.
        pub Stage get(fn stage) config(): ReferendumStage<T::BlockNumber, T::VotePower>;

        /// Votes cast in the referendum. A new record is added to this map when a user casts a sealed vote.
        /// It is modified when a user reveals the vote's commitment proof.
        /// A record is finally removed when the user unstakes, which can happen during a voting stage or after the current cycle ends.
        /// A stake for a vote can be reused in future referendum cycles.
        pub Votes get(fn votes) config(): map hasher(blake2_128_concat) T::AccountId => CastVoteOf<T, I>;

        /// Index of the current referendum cycle. It is incremented everytime referendum ends.
        pub CurrentCycleId get(fn current_cycle_id) config(): u64;
    }
}

decl_event! {
    pub enum Event<T, I>
    where
        Balance = Balance<T, I>,
        <T as system::Trait>::Hash,
        <T as system::Trait>::AccountId,
        <T as Trait<I>>::VotePower,
    {
        /// Referendum started
        ReferendumStarted(u64),

        /// Revealing phase has begun
        RevealingStageStarted(),

        /// Referendum ended and winning option was selected
        ReferendumFinished(Vec<OptionResult<VotePower>>),

        /// User cast a vote in referendum
        VoteCast(AccountId, Hash, Balance),

        /// User revealed his vote
        VoteRevealed(AccountId, u64),

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

        /// Account can't stake enough currency (now)
        InsufficientBalanceToStakeCurrency,

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
    pub struct Module<T: Trait<I>, I: Instance> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error<T, I>;

        /// Setup events
        fn deposit_event() = default;

        /////////////////// Lifetime ///////////////////////////////////////////

        // No origin so this is a priviledged call
        fn on_finalize(now: T::BlockNumber) {
            Self::try_progress_stage(now);
        }

        /////////////////// User actions ///////////////////////////////////////

        /// Cast a sealed vote in the referendum.
        #[weight = 10_000_000]
        pub fn vote(origin, commitment: T::Hash, stake: Balance<T, I>) -> Result<(), Error<T, I>> {
            // ensure action can be started
            let account_id = EnsureChecks::<T, I>::can_vote(origin, &stake)?;

            //
            // == MUTATION SAFE ==
            //

            // start revealing phase - it can return error when stake fails to lock
            Mutations::<T, I>::vote(&account_id, &commitment, &stake)?;

            // emit event
            Self::deposit_event(RawEvent::VoteCast(account_id, commitment, stake));

            Ok(())
        }

        /// Reveal a sealed vote in the referendum.
        #[weight = 10_000_000]
        pub fn reveal_vote(origin, salt: Vec<u8>, vote_option_id: u64) -> Result<(), Error<T, I>> {
            let (stage_data, account_id, cast_vote) = EnsureChecks::<T, I>::can_reveal_vote::<Self>(origin, &salt, &vote_option_id)?;

            //
            // == MUTATION SAFE ==
            //

            // reveal the vote - it can return error when stake fails to unlock
            Mutations::<T, I>::reveal_vote(stage_data, &account_id, &vote_option_id, cast_vote)?;

            // emit event
            Self::deposit_event(RawEvent::VoteRevealed(account_id, vote_option_id));

            Ok(())
        }


        /// Release a locked stake.
        #[weight = 10_000_000]
        pub fn release_stake(origin) -> Result<(), Error<T, I>> {
            let account_id = EnsureChecks::<T, I>::can_release_stake(origin)?;

            //
            // == MUTATION SAFE ==
            //

            // reveal the vote - it can return error when stake fails to unlock
            Mutations::<T, I>::release_stake(&account_id);

            // emit event
            Self::deposit_event(RawEvent::StakeReleased(account_id));

            Ok(())
        }
    }
}

/////////////////// Inner logic ////////////////////////////////////////////////

impl<T: Trait<I>, I: Instance> Module<T, I> {
    /// Checkout expire of referendum stage.
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

    /// Finish voting and start ravealing.
    fn end_voting_period(stage_data: ReferendumStageVotingOf<T>) {
        // start revealing phase
        Mutations::<T, I>::start_revealing_period(stage_data);

        // emit event
        Self::deposit_event(RawEvent::RevealingStageStarted());
    }

    /// Conclude the referendum.
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

impl<T: Trait<I>, I: Instance> ReferendumManager<T::Origin, T::AccountId, T::Hash>
    for Module<T, I>
{
    type VotePower = T::VotePower;
    type Currency = T::Currency;

    /// Start new referendum run.
    fn start_referendum(origin: T::Origin, extra_winning_target_count: u64) -> Result<(), ()> {
        let winning_target_count = extra_winning_target_count + 1;

        // ensure action can be started
        EnsureChecks::<T, I>::can_start_referendum(origin)?;

        //
        // == MUTATION SAFE ==
        //

        // update state
        Mutations::<T, I>::start_voting_period(&winning_target_count);

        // emit event
        Self::deposit_event(RawEvent::ReferendumStarted(winning_target_count));

        Ok(())
    }

    /// Calculate commitment for a vote.
    fn calculate_commitment(
        account_id: &<T as system::Trait>::AccountId,
        salt: &[u8],
        cycle_id: &u64,
        vote_option_id: &u64,
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
    /// Change the referendum stage from inactive to voting stage.
    fn start_voting_period(winning_target_count: &u64) {
        // change referendum state
        Stage::<T, I>::put(ReferendumStage::Voting(ReferendumStageVoting::<
            T::BlockNumber,
        > {
            started: <system::Module<T>>::block_number(),
            winning_target_count: *winning_target_count,
        }));
    }

    /// Change the referendum stage from inactive to the voting stage.
    fn start_revealing_period(old_stage: ReferendumStageVotingOf<T>) {
        // change referendum state
        Stage::<T, I>::put(ReferendumStage::Revealing(ReferendumStageRevealingOf::<
            T,
            I,
        > {
            started: <system::Module<T>>::block_number(),
            winning_target_count: old_stage.winning_target_count,
            intermediate_winners: vec![],
        }));
    }

    /// Conclude referendum, count votes, and select the winners.
    fn conclude_referendum(
        revealing_stage: ReferendumStageRevealingOf<T, I>,
    ) -> Vec<OptionResult<<T as Trait<I>>::VotePower>> {
        // reset referendum state
        Self::reset_referendum();

        // return winning option
        revealing_stage.intermediate_winners
    }

    /// Change the referendum stage from revealing to the inactive stage.
    fn reset_referendum() {
        Stage::<T, I>::put(ReferendumStage::Inactive);
        CurrentCycleId::<I>::put(CurrentCycleId::<I>::get() + 1);
    }

    /// Cast a user's sealed vote for the current referendum cycle.
    fn vote(
        account_id: &<T as system::Trait>::AccountId,
        commitment: &T::Hash,
        stake: &Balance<T, I>,
    ) -> Result<(), Error<T, I>> {
        // lock stake amount
        T::Currency::set_lock(
            T::LockId::get(),
            account_id,
            *stake,
            WithdrawReason::Transfer.into(),
        );

        // store vote
        Votes::<T, I>::insert(
            account_id,
            CastVote {
                commitment: *commitment,
                stake: *stake,
                cycle_id: CurrentCycleId::<I>::get(),
                vote_for: None,
            },
        );

        Ok(())
    }

    /// Reveal user's vote target and check the commitment proof.
    fn reveal_vote(
        stage_data: ReferendumStageRevealingOf<T, I>,
        account_id: &<T as system::Trait>::AccountId,
        option_id: &u64,
        cast_vote: CastVoteOf<T, I>,
    ) -> Result<(), Error<T, I>> {
        // prepare new values
        let vote_power = T::caclulate_vote_power(&account_id, &cast_vote.stake);
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

    /// Release stake associated to the user's last vote.
    fn release_stake(account_id: &<T as system::Trait>::AccountId) {
        // lock stake amount
        T::Currency::remove_lock(T::LockId::get(), account_id);

        // remove vote record
        Votes::<T, I>::remove(account_id);
    }

    /// Tries to insert option to the proper place in the winners list. Utility for reaveal_vote() function.
    fn try_winner_insert(
        option_result: OptionResult<T::VotePower>,
        current_winners: &[OptionResult<T::VotePower>],
        winning_target_count: u64,
    ) -> Vec<OptionResult<T::VotePower>> {
        /// Tries to place record to temporary place in the winning list.
        fn place_record_to_winner_list<T: Trait<I>, I: Instance>(
            option_result: OptionResult<T::VotePower>,
            current_winners: &[OptionResult<T::VotePower>],
            winning_target_count: u64,
        ) -> (Vec<OptionResult<T::VotePower>>, Option<usize>) {
            let current_winners_count = current_winners.len();

            // check if option is already somewhere in list
            let current_winners_index_of_vote_recipient: Option<usize> = current_winners
                .iter()
                .enumerate()
                .find(|(_, value)| option_result.option_id == value.option_id)
                .map(|(index, _)| index);

            // espace when item is currently not in winning list and still has not enough vote power to make it to already full list
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

    fn can_vote(origin: T::Origin, stake: &Balance<T, I>) -> Result<T::AccountId, Error<T, I>> {
        fn prevent_repeated_vote<T: Trait<I>, I: Instance>(
            account_id: &T::AccountId,
        ) -> Result<(), Error<T, I>> {
            if !Votes::<T, I>::contains_key(&account_id) {
                return Ok(());
            }

            let existing_vote = Votes::<T, I>::get(&account_id);

            // don't allow repeated vote
            if existing_vote.cycle_id == CurrentCycleId::<I>::get() {
                return Err(Error::<T, I>::AlreadyVotedThisCycle);
            }

            Ok(())
        }

        // ensure superuser requested action
        let account_id = Self::ensure_regular_user(origin)?;

        let stage = Stage::<T, I>::get();

        // ensure referendum is running
        match stage {
            ReferendumStage::Voting(_) => (),
            _ => return Err(Error::ReferendumNotRunning),
        };

        // prevent repeated vote
        prevent_repeated_vote::<T, I>(&account_id)?;

        // ensure stake is enough for voting
        if stake < &T::MinimumStake::get() {
            return Err(Error::InsufficientStake);
        }

        // ensure account can lock the stake
        if T::Currency::total_balance(&account_id) < *stake {
            return Err(Error::InsufficientBalanceToStakeCurrency);
        }

        Ok(account_id)
    }

    fn can_reveal_vote<R: ReferendumManager<T::Origin, T::AccountId, T::Hash>>(
        origin: T::Origin,
        salt: &[u8],
        vote_option_id: &u64,
    ) -> Result<CanRevealResult<T, I>, Error<T, I>> {
        let cycle_id = CurrentCycleId::<I>::get();

        // ensure superuser requested action
        let account_id = Self::ensure_regular_user(origin)?;

        let stage = Stage::<T, I>::get();

        // ensure referendum is running
        let stage_data = match stage {
            ReferendumStage::Revealing(tmp_stage_data) => tmp_stage_data,
            _ => return Err(Error::RevealingNotInProgress),
        };

        let cast_vote = Self::ensure_vote_exists(&account_id)?;

        // ask runtime if option is valid
        if !T::is_valid_option_id(vote_option_id) {
            return Err(Error::InvalidVote);
        }

        // ensure vote was cast for the running referendum
        if cycle_id != cast_vote.cycle_id {
            return Err(Error::InvalidVote);
        }

        // ensure salt is not too long
        if salt.len() as u64 > T::MaxSaltLength::get() {
            return Err(Error::SaltTooLong);
        }

        // ensure commitment corresponds to salt and vote option
        let commitment = R::calculate_commitment(&account_id, salt, &cycle_id, vote_option_id);
        if commitment != cast_vote.commitment {
            return Err(Error::InvalidReveal);
        }

        Ok((stage_data, account_id, cast_vote))
    }

    fn can_release_stake(origin: T::Origin) -> Result<T::AccountId, Error<T, I>> {
        let cycle_id = CurrentCycleId::<I>::get();

        // ensure superuser requested action
        let account_id = Self::ensure_regular_user(origin)?;

        let cast_vote = Self::ensure_vote_exists(&account_id)?;

        // allow release only for past cycles
        if cycle_id == cast_vote.cycle_id {
            return Err(Error::UnstakingVoteInSameCycle);
        }

        // ask runtime if stake can be released
        if !T::can_release_voting_stake(&cast_vote) {
            return Err(Error::UnstakingForbidden);
        }

        Ok(account_id)
    }

    fn ensure_vote_exists(account_id: &T::AccountId) -> Result<CastVoteOf<T, I>, Error<T, I>> {
        // ensure there is some vote with locked stake
        if !Votes::<T, I>::contains_key(account_id) {
            return Err(Error::VoteNotExisting);
        }

        let cast_vote = Votes::<T, I>::get(account_id);

        Ok(cast_vote)
    }
}
