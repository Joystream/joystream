// TODO: module documentation
// TODO: adjust all extrinsic weights

// NOTE: This module is instantiable pallet as described here https://substrate.dev/recipes/3-entrees/instantiable.html
// No default instance is provided.

/////////////////// Configuration //////////////////////////////////////////////
#![allow(clippy::type_complexity)]
#![cfg_attr(not(feature = "std"), no_std)]

// used dependencies
use codec::{Codec, Decode, Encode};
use frame_support::{
    decl_error, decl_event, decl_module, decl_storage, error::BadOrigin, traits::Get, Parameter,
    StorageValue,
};
use sp_arithmetic::traits::{BaseArithmetic, One};
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
    Inactive,
    Voting(ReferendumStageVoting<BlockNumber>),
    Revealing(ReferendumStageRevealing<BlockNumber, VotePower>),
}

impl<BlockNumber, VotePower> Default for ReferendumStage<BlockNumber, VotePower> {
    fn default() -> ReferendumStage<BlockNumber, VotePower> {
        ReferendumStage::Inactive
    }
}

/// Representation for voting stage state.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct ReferendumStageVoting<BlockNumber> {
    start: BlockNumber,
    winning_target_count: u64,
    options_count: u64,
}

/// Representation for revealing stage state.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct ReferendumStageRevealing<BlockNumber, VotePower> {
    start: BlockNumber,
    winning_target_count: u64,
    options_count: u64,
    revealed_votes: Vec<VotePower>,
}

/// Vote casted in referendum but not revealed yet.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct SealedVote<Hash, CurrencyBalance> {
    commitment: Hash,
    cycle_id: u64,
    balance: CurrencyBalance,
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
    fn start_referendum(options_count: u64, winning_target_count: u64) -> Result<(), Error<T, I>>;

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

    /// Currency balance used for stakes.
    type CurrencyBalance: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

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
    type MinimumStake: Get<Self::CurrencyBalance>;

    /// Decide if user can control referendum (start referendum) via extrinsic(s).
    fn is_super_user(account_id: &<Self as system::Trait>::AccountId) -> bool;

    /// Calculate the vote's power for user and his stake.
    fn caclulate_vote_power(
        account_id: &<Self as system::Trait>::AccountId,
        stake: &<Self as Trait<I>>::CurrencyBalance,
    ) -> <Self as Trait<I>>::VotePower;

    /// Check if user can lock the stake.
    fn can_stake_for_vote(
        account_id: &<Self as system::Trait>::AccountId,
        stake: &<Self as Trait<I>>::CurrencyBalance,
    ) -> bool;

    // Try to lock the stake lock.
    fn lock_currency(
        account_id: &<Self as system::Trait>::AccountId,
        stake: &<Self as Trait<I>>::CurrencyBalance,
    ) -> bool;

    // Try to release the stake lock.
    fn free_currency(
        account_id: &<Self as system::Trait>::AccountId,
        stake: &<Self as Trait<I>>::CurrencyBalance,
    ) -> bool;
}

decl_storage! {
    trait Store for Module<T: Trait<I>, I: Instance> as Referendum {
        /// Current referendum stage
        pub Stage get(fn stage) config(): ReferendumStage<T::BlockNumber, T::VotePower>;

        /// Votes in current referendum
        pub Votes get(fn votes) config(): map hasher(blake2_128_concat) T::AccountId => SealedVote<T::Hash, T::CurrencyBalance>;

        /// Index of the current referendum cycle.
        pub CurrentCycle get(fn current_cycle) config(): u64;
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
        <T as Trait<I>>::CurrencyBalance,
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

        /// User casted a vote in referendum
        VoteCasted(AccountId, Hash, CurrencyBalance),

        /// User revealed his vote
        VoteRevealed(AccountId, u64),
    }
}

decl_error! {
    /// Referendum errors
    pub enum Error for Module<T: Trait<I>, I: Instance> {
        /// Origin is invalid
        BadOrigin,

        /// Origin doesn't correspond to any superuser
        OriginNotSuperUser,

        /// Referendum cannot run twice at the same time
        ReferendumAlreadyRunning,

        /// No options were given to referendum
        NoReferendumOptions,

        /// Number of referendum options exceeds the limit
        TooManyReferendumOptions,

        /// Referendum is not running when expected to
        ReferendumNotRunning,

        /// Revealing stage is not in progress right now
        RevealingNotInProgress,

        /// Account can't stake enough currency (now)
        InsufficientBalanceToStakeCurrency,

        /// An error occured during locking the stake
        AccountStakeCurrencyFailed,

        /// An error occured during unlocking the stake
        AccountRelaseStakeCurrencyFailed,

        /// Insufficient stake provided to cast a vote
        InsufficientStake,

        /// Account already voted
        AlreadyVoted,

        /// Salt and referendum option provided don't correspond to the commitment
        InvalidReveal,

        /// Vote for not existing option was revealed
        InvalidVote,

        /// Trying to reveal vote that was not casted
        NoVoteToReveal,
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

        /// Start a new referendum.
        #[weight = 10_000_000]
        pub fn start_referendum(origin, options_count: u64, winning_target_count: u64) -> Result<(), Error<T, I>> {
            EnsureChecks::<T, I>::can_start_referendum_extrinsic(origin, options_count)?;

            <Self as ReferendumManager<T, I>>::start_referendum(options_count, winning_target_count)
        }

        /////////////////// User actions ///////////////////////////////////////

        /// Cast a sealed vote in the referendum.
        #[weight = 10_000_000]
        pub fn vote(origin, commitment: T::Hash, balance: T::CurrencyBalance) -> Result<(), Error<T, I>> {
            // ensure action can be started
            let account_id = EnsureChecks::<T, I>::can_vote(origin, &balance)?;

            //
            // == MUTATION SAFE ==
            //

            // start revealing phase - it can return error when stake fails to lock
            Mutations::<T, I>::vote(&account_id, &commitment, &balance)?;

            // emit event
            Self::deposit_event(RawEvent::VoteCasted(account_id, commitment, balance));

            Ok(())
        }

        /// Reveal a sealed vote in the referendum.
        #[weight = 10_000_000]
        pub fn reveal_vote(origin, salt: Vec<u8>, vote_option_index: u64) -> Result<(), Error<T, I>> {
            let cycle_id = CurrentCycle::<I>::get();
            let (account_id, sealed_vote) = EnsureChecks::<T, I>::can_reveal_vote::<Self>(origin, &salt, &vote_option_index, &cycle_id)?;

            //
            // == MUTATION SAFE ==
            //

            // reveal the vote - it can return error when stake fails to unlock
            Mutations::<T, I>::reveal_vote(&account_id, &vote_option_index, &sealed_vote)?;

            // emit event
            Self::deposit_event(RawEvent::VoteRevealed(account_id, vote_option_index));

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
                if now == stage_data.start + T::VoteStageDuration::get() {
                    Self::end_voting_period(stage_data);
                }
            }
            ReferendumStage::Revealing(stage_data) => {
                if now == stage_data.start + T::RevealStageDuration::get() {
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
    fn start_referendum(options_count: u64, winning_target_count: u64) -> Result<(), Error<T, I>> {
        // ensure action can be started
        EnsureChecks::<T, I>::can_start_referendum(options_count)?;

        //
        // == MUTATION SAFE ==
        //

        // update state
        Mutations::<T, I>::start_voting_period(&options_count, &winning_target_count);

        // emit event
        Self::deposit_event(RawEvent::ReferendumStarted(
            options_count,
            winning_target_count,
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
        let mut mut_salt = salt.encode();//.to_vec();
        let mut mut_cycle_id = cycle_id.encode();//.to_vec();

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
    fn start_voting_period(options_count: &u64, winning_target_count: &u64) {
        // change referendum state
        Stage::<T, I>::put(ReferendumStage::Voting(ReferendumStageVoting::<
            T::BlockNumber,
        > {
            start: <system::Module<T>>::block_number(),
            winning_target_count: *winning_target_count,
            options_count: *options_count,
        }));
    }

    fn start_revealing_period(old_stage: ReferendumStageVoting<T::BlockNumber>) {
        // change referendum state
        Stage::<T, I>::put(ReferendumStage::Revealing(ReferendumStageRevealing::<
            T::BlockNumber,
            T::VotePower,
        > {
            start: <system::Module<T>>::block_number(),
            winning_target_count: old_stage.winning_target_count,
            options_count: old_stage.options_count,
            revealed_votes: (0..old_stage.options_count).map(|_| 0.into()).collect(),
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

            for i in 0..revealing_stage.options_count {
                let vote_sum: T::VotePower = revealing_stage.revealed_votes[i as usize];

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
        Self::reset_referendum();

        // return winning option
        referendum_result
    }

    fn reset_referendum() {
        Stage::<T, I>::put(ReferendumStage::Inactive);
        Votes::<T, I>::remove_all();
    }

    /// Can return error when stake fails to lock
    fn vote(
        account_id: &<T as system::Trait>::AccountId,
        commitment: &T::Hash,
        balance: &T::CurrencyBalance,
    ) -> Result<(), Error<T, I>> {
        // IMPORTANT - because locking currency can fail it has to be the first mutation!
        // lock stake amount
        if !T::lock_currency(&account_id, &balance) {
            return Err(Error::AccountStakeCurrencyFailed);
        }

        // store vote
        Votes::<T, I>::insert(
            account_id,
            SealedVote {
                commitment: *commitment,
                balance: *balance,
                cycle_id: CurrentCycle::<I>::get(),
            },
        );

        Ok(())
    }

    fn reveal_vote(
        account_id: &<T as system::Trait>::AccountId,
        option_index: &u64,
        sealed_vote: &SealedVote<T::Hash, T::CurrencyBalance>,
    ) -> Result<(), Error<T, I>> {
        // IMPORTANT - because unlocking currency can fail it has to be the first mutation!
        // unlock stake amount
        if !T::free_currency(&account_id, &sealed_vote.balance) {
            return Err(Error::AccountRelaseStakeCurrencyFailed);
        }

        let distribute_vote =
            |stage_data: &mut ReferendumStageRevealing<T::BlockNumber, T::VotePower>| {
                // calculate vote power
                let vote_power = T::caclulate_vote_power(account_id, &sealed_vote.balance);
                stage_data.revealed_votes[*option_index as usize] += vote_power;
            };

        // store revealed vote
        Stage::<T, I>::mutate(|stage| {
            match stage {
                ReferendumStage::Revealing(stage_data) => distribute_vote(stage_data),
                _ => panic!("Invalid state"), // will never happen
            }
        });

        // remove user commitment to prevent repeated revealing
        Votes::<T, I>::remove(account_id);

        Ok(())
    }
}

/////////////////// Ensure checks //////////////////////////////////////////////

struct EnsureChecks<T: Trait<I>, I: Instance> {
    _dummy: PhantomData<(T, I)>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait<I>, I: Instance> EnsureChecks<T, I> {
    /////////////////// Common checks //////////////////////////////////////////

    fn ensure_super_user(origin: T::Origin) -> Result<T::AccountId, Error<T, I>> {
        let account_id = ensure_signed(origin)?;

        // ensure superuser requested action
        if !T::is_super_user(&account_id) {
            return Err(Error::OriginNotSuperUser);
        }

        Ok(account_id)
    }

    fn ensure_regular_user(
        origin: T::Origin,
    ) -> Result<T::AccountId, Error<T, I>> {
        let account_id = ensure_signed(origin)?;

        Ok(account_id)
    }

    /////////////////// Action checks //////////////////////////////////////////

    fn can_start_referendum_extrinsic(
        origin: T::Origin,
        _options_count: u64,
    ) -> Result<(), Error<T, I>> {
        // ensure superuser requested action
        Self::ensure_super_user(origin)?;

        Ok(())
    }

    fn can_start_referendum(options_count: u64) -> Result<(), Error<T, I>> {
        // ensure referendum is not already running
        if Stage::<T, I>::get() != ReferendumStage::Inactive {
            return Err(Error::ReferendumAlreadyRunning);
        }

        // ensure some options were given
        if options_count == 0 {
            return Err(Error::NoReferendumOptions);
        }

        // ensure number of options doesn't exceed limit
        if options_count > T::MaxReferendumOptions::get() {
            return Err(Error::TooManyReferendumOptions);
        }

        Ok(())
    }

    fn can_vote(
        origin: T::Origin,
        balance: &T::CurrencyBalance
    ) -> Result<T::AccountId, Error<T, I>> {
        // ensure superuser requested action
        let account_id = Self::ensure_regular_user(origin)?;

        let stage = Stage::<T, I>::get();

        // ensure referendum is running
        let voting_stage = match stage {
            ReferendumStage::Voting(stage_data) => (stage_data),
            _ => return Err(Error::ReferendumNotRunning),
        };

        let current_block = <system::Module<T>>::block_number();

        // ensure voting stage is not expired (it can happend when superuser haven't call `finish_voting_start_revealing` yet)
        if current_block >= T::VoteStageDuration::get() + voting_stage.start + One::one() {
            return Err(Error::ReferendumNotRunning);
        }

        // ensure stake is enough for voting
        if balance < &T::MinimumStake::get() {
            return Err(Error::InsufficientStake);
        }

        // ensure account can lock the stake
        if !T::can_stake_for_vote(&account_id, &balance) {
            return Err(Error::InsufficientBalanceToStakeCurrency);
        }

        // ensure user haven't vote yet
        if Votes::<T, I>::contains_key(&account_id) {
            return Err(Error::AlreadyVoted);
        }

        Ok(account_id)
    }

    fn can_reveal_vote<R: ReferendumManager<T, I>>(
        origin: T::Origin,
        salt: &[u8],
        vote_option_index: &u64,
        cycle_id: &u64,
    ) -> Result<
        (
            T::AccountId,
            SealedVote<T::Hash, T::CurrencyBalance>,
        ),
        Error<T, I>,
    > {
        // ensure superuser requested action
        let account_id = Self::ensure_regular_user(origin)?;

        let stage = Stage::<T, I>::get();

        // ensure referendum is running
        let stage_data = match stage {
            ReferendumStage::Revealing(tmp_stage_data) => (tmp_stage_data),
            _ => return Err(Error::RevealingNotInProgress),
        };

        let current_block = <system::Module<T>>::block_number();

        // ensure voting stage is not expired (it can happend when superuser haven't call `finish_voting_start_revealing` yet)
        if current_block >= T::RevealStageDuration::get() + stage_data.start + One::one() {
            return Err(Error::RevealingNotInProgress);
        }

        // ensure account haven't voted yet
        if !Votes::<T, I>::contains_key(&account_id) {
            return Err(Error::NoVoteToReveal);
        }

        if vote_option_index >= &stage_data.options_count {
            return Err(Error::InvalidVote);
        }

        let sealed_vote = Votes::<T, I>::get(&account_id);

        // ensure commitment corresponds to salt and vote option
        let commitment = R::calculate_commitment(&account_id, salt, cycle_id, vote_option_index);
        if commitment != sealed_vote.commitment {
            return Err(Error::InvalidReveal);
        }

        Ok((account_id, sealed_vote))
    }
}
