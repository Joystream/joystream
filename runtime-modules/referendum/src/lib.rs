// TODO: module documentation
// TODO: adjust all extrinsic weights

// NOTE: This module is instantiable pallet as described here https://substrate.dev/recipes/3-entrees/instantiable.html
// No default instance is provided.

/////////////////// Configuration //////////////////////////////////////////////
#![allow(clippy::type_complexity)]
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
    Inactive(ReferendumStageInactive<VotePower>),
    Voting(ReferendumStageVoting<BlockNumber>),
    Revealing(ReferendumStageRevealing<BlockNumber, VotePower>),
}

impl<BlockNumber, VotePower> Default for ReferendumStage<BlockNumber, VotePower> {
    fn default() -> ReferendumStage<BlockNumber, VotePower> {
        ReferendumStage::Inactive(ReferendumStageInactive {
            previous_cycle_result: ReferendumResult::NoVotesRevealed,
        })
    }
}

/// Representation for inactive stage state.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct ReferendumStageInactive<VotePower> {
    previous_cycle_result: ReferendumResult<u64, VotePower>,
}

/// Representation for voting stage state.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct ReferendumStageVoting<BlockNumber> {
    started: BlockNumber,
    extra_options_count: u64, // number of options that exceeding the number of winners
    extra_winning_target_count: u64, // positive number when there are more than 1 winner
}

/// Representation for revealing stage state.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct ReferendumStageRevealing<BlockNumber, VotePower> {
    started: BlockNumber,
    winning_target_count: u64, // positive number when there are more than 1 winner
    intermediate_results: Vec<VotePower>,
}

/// Vote cast in referendum. Vote target is concealed until user reveals commitment's proof.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct CastVote<Hash, Currency> {
    commitment: Hash,
    cycle_id: u64,
    balance: Currency,
    vote_for: Option<u64>,
}

/// Possible referendum outcomes.
#[derive(Clone, Encode, Decode, PartialEq, Eq, Debug)]
pub enum ReferendumResult<ReferendumOption, VotePower> {
    /// There are X winners as requested.
    Winners(Vec<(ReferendumOption, VotePower)>),
    /// X winners were expected, but Xth winning option has the same number of votes (X+1)th option.
    /// In other words, can't decide only X winners because there is a tie in a significant place.
    ExtraWinners(Vec<(ReferendumOption, VotePower)>),
    /// X winners were expected, but only Y (Y < X) options received any votes.
    NotEnoughWinners(Vec<(ReferendumOption, VotePower)>),
    /// Nobody revealed a valid vote in a referendum.
    NoVotesRevealed,
}

impl<T, U> Default for ReferendumResult<T, U> {
    fn default() -> ReferendumResult<T, U> {
        ReferendumResult::NoVotesRevealed
    }
}

/////////////////// Trait, Storage, Errors, and Events /////////////////////////

// TODO: get rid of dependency on Error<T, I> - create some nongeneric error
/// Trait enabling referendum start and vote commitment calculation.
pub trait ReferendumManager<T: Trait<I>, I: Instance> {
    /// Start a new referendum.
    fn start_referendum(
        origin: T::Origin,
        extra_options_count: u64,
        extra_winning_target_count: u64,
    ) -> Result<(), Error<T, I>>;

    /// Calculate commitment for a vote.
    fn calculate_commitment(
        account_id: &<T as system::Trait>::AccountId,
        salt: &[u8],
        cycle_id: &u64,
        vote_option_index: &u64,
    ) -> T::Hash;
}

pub trait Trait<I: Instance>: system::Trait /* + ReferendumManager<Self, I>*/ {
    /// The overarching event type.
    type Event: From<Event<Self, I>> + Into<<Self as system::Trait>::Event>;

    /// Maximum number of options in one referendum.
    type MaxReferendumOptions: Get<u64>;

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

    /// Decide if user can control referendum (start referendum) via extrinsic(s).
    fn is_super_user(account_id: &<Self as system::Trait>::AccountId) -> bool;

    /// Calculate the vote's power for user and his stake.
    fn caclulate_vote_power(
        account_id: &<Self as system::Trait>::AccountId,
        stake: &Balance<Self, I>,
    ) -> <Self as Trait<I>>::VotePower;

    /// Check if user can lock the stake.
    fn can_stake_for_vote(
        account_id: &<Self as system::Trait>::AccountId,
        stake: &Balance<Self, I>,
    ) -> bool;
}

decl_storage! {
    trait Store for Module<T: Trait<I>, I: Instance> as Referendum {
        /// Current referendum stage
        pub Stage get(fn stage) config(): ReferendumStage<T::BlockNumber, T::VotePower>;

        /// Votes in current referendum
        pub Votes get(fn votes) config(): map hasher(blake2_128_concat) T::AccountId => CastVote<T::Hash, Balance<T, I>>;

        /// Index of the current referendum cycle. It is incremented everytime referendum ends.
        pub CurrentCycleId get(fn current_cycle_id) config(): u64;
    }

    /* This might be needed in some cases
    // add_extra_genesis has to be present in Instantiable Modules - see https://github.com/paritytech/substrate/blob/master/frame/support/procedural/src/lib.rs#L217
    add_extra_genesis {
        config(phantom): PhantomData<I>;
    }
    */
}

decl_event! {
    pub enum Event<T, I>
    where
        Balance = Balance<T, I>,
        ReferendumResult = ReferendumResult<u64, <T as Trait<I>>::VotePower>,
        <T as system::Trait>::Hash,
        <T as system::Trait>::AccountId,
    {
        /// Referendum started
        ReferendumStarted(u64, u64),

        /// Revealing phase has begun
        RevealingStageStarted(),

        /// Referendum ended and winning option was selected
        ReferendumFinished(ReferendumResult),

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

        /// Referendum cannot run twice at the same time
        ReferendumAlreadyRunning,

        /// Number of referendum options exceeds the limit
        TooManyReferendumOptions,

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

        /// Invalid time to release the locked stake
        InvalidTimeToRelease,
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

/////////////////// Type aliases ///////////////////////////////////////////////

type Balance<T, I> =
    <<T as Trait<I>>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

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
        pub fn vote(origin, commitment: T::Hash, balance: Balance<T, I>) -> Result<(), Error<T, I>> {
            // ensure action can be started
            let account_id = EnsureChecks::<T, I>::can_vote(origin, &balance)?;

            //
            // == MUTATION SAFE ==
            //

            // start revealing phase - it can return error when stake fails to lock
            Mutations::<T, I>::vote(&account_id, &commitment, &balance)?;

            // emit event
            Self::deposit_event(RawEvent::VoteCast(account_id, commitment, balance));

            Ok(())
        }

        /// Reveal a sealed vote in the referendum.
        #[weight = 10_000_000]
        pub fn reveal_vote(origin, salt: Vec<u8>, vote_option_index: u64) -> Result<(), Error<T, I>> {
            let (stage_data, account_id, cast_vote) = EnsureChecks::<T, I>::can_reveal_vote::<Self>(origin, &salt, &vote_option_index)?;

            //
            // == MUTATION SAFE ==
            //

            // reveal the vote - it can return error when stake fails to unlock
            Mutations::<T, I>::reveal_vote(stage_data, &account_id, &vote_option_index, cast_vote)?;

            // emit event
            Self::deposit_event(RawEvent::VoteRevealed(account_id, vote_option_index));

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
            ReferendumStage::Inactive(_) => (),
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
    fn end_voting_period(stage_data: ReferendumStageVoting<T::BlockNumber>) {
        // start revealing phase
        Mutations::<T, I>::start_revealing_period(stage_data);

        // emit event
        Self::deposit_event(RawEvent::RevealingStageStarted());
    }

    /// Conclude the referendum.
    fn end_reveal_period(stage_data: ReferendumStageRevealing<T::BlockNumber, T::VotePower>) {
        // conclude referendum
        let referendum_result = Mutations::<T, I>::conclude_referendum(stage_data);

        // emit event
        Self::deposit_event(RawEvent::ReferendumFinished(referendum_result));
    }
}

/////////////////// ReferendumManager //////////////////////////////////////////

impl<T: Trait<I>, I: Instance> ReferendumManager<T, I> for Module<T, I> {
    /// Start new referendum run.
    fn start_referendum(
        origin: T::Origin,
        extra_options_count: u64,
        extra_winning_target_count: u64,
    ) -> Result<(), Error<T, I>> {
        let total_winners = extra_winning_target_count + 1;
        let total_options = total_winners + extra_options_count;

        // ensure action can be started
        EnsureChecks::<T, I>::can_start_referendum(origin, total_options)?;

        //
        // == MUTATION SAFE ==
        //

        // update state
        Mutations::<T, I>::start_voting_period(&extra_options_count, &extra_winning_target_count);

        // emit event
        Self::deposit_event(RawEvent::ReferendumStarted(
            total_options,
            total_winners,
        ));

        Ok(())
    }

    /// Calculate commitment for a vote.
    fn calculate_commitment(
        account_id: &<T as system::Trait>::AccountId,
        salt: &[u8],
        cycle_id: &u64,
        vote_option_index: &u64,
    ) -> T::Hash {
        let mut payload = account_id.encode();
        let mut mut_option_index = vote_option_index.encode();
        let mut mut_salt = salt.encode(); //.to_vec();
        let mut mut_cycle_id = cycle_id.encode(); //.to_vec();

        payload.append(&mut mut_option_index);
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
    fn start_voting_period(extra_options_count: &u64, extra_winning_target_count: &u64) {
        // change referendum state
        Stage::<T, I>::put(ReferendumStage::Voting(ReferendumStageVoting::<
            T::BlockNumber,
        > {
            started: <system::Module<T>>::block_number(),
            extra_options_count: *extra_options_count,
            extra_winning_target_count: *extra_winning_target_count,
        }));
    }

    fn start_revealing_period(old_stage: ReferendumStageVoting<T::BlockNumber>) {
        let total_options = old_stage.extra_options_count + old_stage.extra_winning_target_count + 1;

        // change referendum state
        Stage::<T, I>::put(ReferendumStage::Revealing(ReferendumStageRevealing::<
            T::BlockNumber,
            T::VotePower,
        > {
            started: <system::Module<T>>::block_number(),
            winning_target_count: old_stage.extra_winning_target_count + 1,
            intermediate_results: (0..total_options).map(|_| 0.into()).collect(),
        }));
    }

    fn conclude_referendum(
        revealing_stage: ReferendumStageRevealing<T::BlockNumber, T::VotePower>,
    ) -> ReferendumResult<u64, T::VotePower> {
        // select winning option
        fn calculate_votes<T: Trait<I>, I: Instance>(
            revealing_stage: ReferendumStageRevealing<T::BlockNumber, T::VotePower>,
        ) -> ReferendumResult<u64, T::VotePower> {
            let mut winning_order: Vec<(u64, T::VotePower)> = vec![];

            for i in 0..(revealing_stage.intermediate_results.len() as u64) {
                let vote_sum: T::VotePower = revealing_stage.intermediate_results[i as usize];

                // skip option with 0 votes
                if vote_sum == 0.into() {
                    continue;
                }

                winning_order.push((i, vote_sum));
            }

            // no votes revealed?
            if winning_order.is_empty() {
                return ReferendumResult::NoVotesRevealed;
            }

            // sort winners
            winning_order.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap().reverse());

            let voted_options_count = winning_order.len();
            let target_count = revealing_stage.winning_target_count;

            // is there enough options with votes to have requested amount of winners?
            if (voted_options_count as u64) < target_count {
                return ReferendumResult::NotEnoughWinners(winning_order);
            }

            // is there as many options voted for as requested winner count?
            if (voted_options_count as u64) == target_count {
                return ReferendumResult::Winners(winning_order);
            }

            // is there draw in the last winning place?
            if winning_order[(target_count as usize) - 1].1
                == winning_order[target_count as usize].1
            {
                let mut draw_end_index = target_count as usize;
                while voted_options_count > draw_end_index + 1
                    && winning_order[draw_end_index].1 == winning_order[draw_end_index + 1].1
                {
                    draw_end_index += 1;
                }

                return ReferendumResult::ExtraWinners(
                    winning_order[..(draw_end_index as usize + 1)].to_vec(),
                );
            }

            // return winning options
            ReferendumResult::Winners(winning_order[..(target_count as usize)].to_vec())
        }

        // calculate votes and select winner(s)
        let referendum_result = calculate_votes::<T, I>(revealing_stage);

        // reset referendum state
        Self::reset_referendum(&referendum_result);

        // return winning option
        referendum_result
    }

    fn reset_referendum(previous_cycle_result: &ReferendumResult<u64, T::VotePower>) {
        Stage::<T, I>::put(ReferendumStage::Inactive(ReferendumStageInactive {
            previous_cycle_result: previous_cycle_result.clone(),
        }));
        CurrentCycleId::<I>::put(CurrentCycleId::<I>::get() + 1);
    }

    /// Can return error when stake fails to lock
    fn vote(
        account_id: &<T as system::Trait>::AccountId,
        commitment: &T::Hash,
        balance: &Balance<T, I>,
    ) -> Result<(), Error<T, I>> {
        // lock stake amount
        T::Currency::set_lock(
            T::LockId::get(),
            account_id,
            *balance,
            WithdrawReason::Transfer.into(),
        );

        // store vote
        Votes::<T, I>::insert(
            account_id,
            CastVote {
                commitment: *commitment,
                balance: *balance,
                cycle_id: CurrentCycleId::<I>::get(),
                vote_for: None,
            },
        );

        Ok(())
    }

    fn reveal_vote(
        stage_data: ReferendumStageRevealing<T::BlockNumber, T::VotePower>,
        account_id: &<T as system::Trait>::AccountId,
        option_index: &u64,
        cast_vote: CastVote<T::Hash, Balance<T, I>>,
    ) -> Result<(), Error<T, I>> {
        let vote_power = T::caclulate_vote_power(&account_id, &cast_vote.balance);

        let new_stage_data = ReferendumStageRevealing {
            intermediate_results: stage_data
                .intermediate_results
                .iter()
                .enumerate()
                .map(|(i, current_vote_power)| {
                    if i as u64 == *option_index {
                        return *current_vote_power + vote_power;
                    }

                    *current_vote_power
                })
                .collect(),
            ..stage_data
        };

        // store revealed vote
        Stage::<T, I>::mutate(|stage| *stage = ReferendumStage::Revealing(new_stage_data));

        // remove user commitment to prevent repeated revealing
        Votes::<T, I>::mutate(account_id, |vote| (*vote).vote_for = Some(*option_index));

        Ok(())
    }

    fn release_stake(account_id: &<T as system::Trait>::AccountId) {
        // lock stake amount
        T::Currency::remove_lock(T::LockId::get(), account_id);

        // remove vote record
        Votes::<T, I>::remove(account_id);
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

    fn can_start_referendum(origin: T::Origin, options_count: u64) -> Result<(), Error<T, I>> {
        T::ManagerOrigin::ensure_origin(origin)?;

        // ensure referendum is not already running
        match Stage::<T, I>::get() {
            ReferendumStage::Inactive(_) => Ok(()),
            _ => Err(Error::ReferendumAlreadyRunning),
        }?;

        // ensure number of options doesn't exceed limit
        if options_count > T::MaxReferendumOptions::get() {
            return Err(Error::TooManyReferendumOptions);
        }

        Ok(())
    }

    fn can_vote(origin: T::Origin, balance: &Balance<T, I>) -> Result<T::AccountId, Error<T, I>> {
        // ensure superuser requested action
        let account_id = Self::ensure_regular_user(origin)?;

        let stage = Stage::<T, I>::get();

        // ensure referendum is running
        match stage {
            ReferendumStage::Voting(_) => (),
            _ => return Err(Error::ReferendumNotRunning),
        };

        // ensure stake is enough for voting
        if balance < &T::MinimumStake::get() {
            return Err(Error::InsufficientStake);
        }

        // ensure account can lock the stake
        if T::Currency::total_balance(&account_id) < *balance {
            return Err(Error::InsufficientBalanceToStakeCurrency);
        }

        Ok(account_id)
    }

    fn can_reveal_vote<R: ReferendumManager<T, I>>(
        origin: T::Origin,
        salt: &[u8],
        vote_option_index: &u64,
    ) -> Result<
        (
            ReferendumStageRevealing<T::BlockNumber, T::VotePower>,
            T::AccountId,
            CastVote<T::Hash, Balance<T, I>>,
        ),
        Error<T, I>,
    > {
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

        if vote_option_index >= &(stage_data.intermediate_results.len() as u64) {
            return Err(Error::InvalidVote);
        }

        // ensure vote was cast for the running referendum
        if cycle_id != cast_vote.cycle_id {
            return Err(Error::InvalidVote);
        }

        // ensure commitment corresponds to salt and vote option
        let commitment = R::calculate_commitment(&account_id, salt, &cycle_id, vote_option_index);
        if commitment != cast_vote.commitment {
            return Err(Error::InvalidReveal);
        }

        Ok((stage_data, account_id, cast_vote))
    }

    fn can_release_stake(origin: T::Origin) -> Result<T::AccountId, Error<T, I>> {
        fn voted_for_winner_last_cycle<T: Trait<I>, I: Instance>(
            previous_cycle_result: ReferendumResult<u64, T::VotePower>,
            option_voted_for: Option<u64>,
        ) -> bool {
            let voted_for = match option_voted_for {
                Some(tmp_vote) => tmp_vote,
                None => return false,
            };

            let previous_winners = match previous_cycle_result {
                ReferendumResult::Winners(tmp_winners) => tmp_winners,
                ReferendumResult::ExtraWinners(tmp_winners) => tmp_winners,
                ReferendumResult::NotEnoughWinners(tmp_winners) => tmp_winners,
                ReferendumResult::NoVotesRevealed => vec![],
            };

            let voted_for_winner = previous_winners.iter().position(|item| item.0 == voted_for);

            voted_for_winner.is_some()
        }

        let cycle_id = CurrentCycleId::<I>::get();

        // ensure superuser requested action
        let account_id = Self::ensure_regular_user(origin)?;

        let cast_vote = Self::ensure_vote_exists(&account_id)?;

        // enable stake release in current cycle only during voting stage
        if cycle_id == cast_vote.cycle_id {
            match Stage::<T, I>::get() {
                ReferendumStage::Voting(_) => Ok(()),
                _ => Err(Error::InvalidTimeToRelease),
            }?;
        }

        // enable unlocking stake locked in the last cycle only when option didn't win;
        // or after the next inactive stage when voted for winning option
        if cycle_id == cast_vote.cycle_id + 1 {
            fn check_inactive_stage<T: Trait<I>, I: Instance>(
                stage_data: ReferendumStageInactive<T::VotePower>,
                vote_for: Option<u64>,
            ) -> Result<(), Error<T, I>> {
                let voted_winner =
                    voted_for_winner_last_cycle::<T, I>(stage_data.previous_cycle_result, vote_for);
                if voted_winner {
                    return Err(Error::InvalidTimeToRelease);
                }

                Ok(())
            }

            match Stage::<T, I>::get() {
                ReferendumStage::Inactive(stage_data) => {
                    check_inactive_stage::<T, I>(stage_data, cast_vote.vote_for)
                }
                _ => Ok(()),
            }?;
        }

        // eliminate possibility of unexpected cycle_id
        if cycle_id < cast_vote.cycle_id {
            return Err(Error::InvalidTimeToRelease);
        }

        Ok(account_id)
    }

    fn ensure_vote_exists(
        account_id: &T::AccountId,
    ) -> Result<CastVote<T::Hash, Balance<T, I>>, Error<T, I>> {
        // ensure there is some vote with locked stake
        if !Votes::<T, I>::contains_key(account_id) {
            return Err(Error::VoteNotExisting);
        }

        let cast_vote = Votes::<T, I>::get(account_id);

        Ok(cast_vote)
    }
}
