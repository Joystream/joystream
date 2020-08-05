// TODO: module documentation

// NOTE: This module is instantiable pallet as described here https://substrate.dev/recipes/3-entrees/instantiable.html
// No default instance is provided.

/////////////////// Configuration //////////////////////////////////////////////
#![cfg_attr(not(feature = "std"), no_std)]

// used dependencies
use codec::{Codec, Decode, Encode};
use sr_primitives::traits::{MaybeSerialize, Member, One, SimpleArithmetic};
use srml_support::{decl_error, decl_event, decl_module, decl_storage, traits::Get, Parameter};
use std::marker::PhantomData;
use system::ensure_signed;

use std::collections::HashSet;

// conditioned dependencies
//#[cfg(feature = "std")]
//use serde_derive::{Deserialize, Serialize};

// declared modules
mod mock;
mod tests;

/////////////////// Data Structures ////////////////////////////////////////////

#[derive(Encode, Decode, PartialEq, Eq, Debug)]
pub enum ReferendumStage {
    Void,
    Voting,
    Revealing,
}

impl Default for ReferendumStage {
    fn default() -> ReferendumStage {
        ReferendumStage::Void
    }
}

#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct SealedVote<Hash, CurrencyBalance> {
    commitment: Hash,
    stake: CurrencyBalance,
}

#[derive(Encode, Decode, PartialEq, Eq, Debug)]
pub enum ReferendumResult<ReferendumOption> {
    Winner(ReferendumOption),
    MultipleWinners(Vec<ReferendumOption>),
    NoVotesRevealed,
}

impl<T> Default for ReferendumResult<T> {
    fn default() -> ReferendumResult<T> {
        ReferendumResult::NoVotesRevealed
    }
}

/////////////////// Trait, Storage, Errors, and Events /////////////////////////

pub trait Trait<I: Instance>: system::Trait {
    /// The overarching event type.
    type Event: From<Event<Self, I>> + Into<<Self as system::Trait>::Event>;

    // maximum number of options in one referendum
    type MaxReferendumOptions: Get<u64>;
    type ReferendumOption: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + From<u64>
        + Into<u64>;

    type CurrencyBalance: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    type VoteStageDuration: Get<Self::BlockNumber>;
    type RevealStageDuration: Get<Self::BlockNumber>;

    type MinimumStake: Get<Self::CurrencyBalance>;

    fn is_super_user(account_id: &<Self as system::Trait>::AccountId) -> bool;

    fn has_sufficient_balance(
        account: &<Self as system::Trait>::AccountId,
        balance: &Self::CurrencyBalance,
    ) -> bool;
    fn lock_currency(
        account: &<Self as system::Trait>::AccountId,
        balance: &Self::CurrencyBalance,
    ) -> bool;
    fn free_currency(
        account: &<Self as system::Trait>::AccountId,
        balance: &Self::CurrencyBalance,
    ) -> bool;
}

decl_storage! {
    trait Store for Module<T: Trait<I>, I: Instance> as Referendum {
        /// Current referendum stage
        pub Stage get(stage) config(): (ReferendumStage, T::BlockNumber);

        /// Options of current referendum
        pub ReferendumOptions get(referendum_options) config(): Option<Vec<T::ReferendumOption>>;

        /// Votes in current referendum
        pub Votes get(votes) config(): map T::AccountId => SealedVote<T::Hash, T::CurrencyBalance>;

        /// Revealed votes counter
        pub RevealedVotes get(revealed_votes) config(): map T::ReferendumOption => u64;
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
        <T as Trait<I>>::ReferendumOption,
        ReferendumResult = ReferendumResult<<T as Trait<I>>::ReferendumOption>,
        <T as Trait<I>>::CurrencyBalance,
        <T as system::Trait>::Hash,
        <T as system::Trait>::AccountId,
    {
        /// Referendum started
        ReferendumStarted(Vec<ReferendumOption>),

        /// Revealing phase has begun
        RevealingStageStarted(),

        /// Referendum ended and winning option was selected
        ReferendumFinished(ReferendumResult),

        /// User casted a vote in referendum
        VoteCasted(Hash, CurrencyBalance),

        /// User revealed his vote
        VoteRevealed(AccountId, ReferendumOption),
    }
}

decl_error! {
    #[derive(Copy)]
    /// Referendum errors
    pub enum Error {
        /// Origin doesn't correspond to any superuser
        OriginNotSuperUser,

        /// Referendum cannot run twice at the same time
        ReferendumAlreadyRunning,

        /// No options were given to referendum
        NoReferendumOptions,

        /// Number of referendum options exceeds the limit
        TooManyReferendumOptions,

        /// Not all referendum options are unique
        DuplicateReferendumOptions,

        /// Referendum is not running when expected to
        ReferendumNotRunning,

        /// Voting stage hasn't finished yet
        VotingNotFinishedYet,

        /// Revealing stage is not in progress right now
        RevealingNotInProgress,

        /// Revealing stage hasn't finished yet
        RevealingNotFinishedYet,

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

impl From<system::Error> for Error {
    fn from(error: system::Error) -> Self {
        match error {
            system::Error::Other(msg) => Error::Other(msg),
            system::Error::RequireRootOrigin => Error::OriginNotSuperUser,
            _ => Error::Other(error.into()),
        }
    }
}

/////////////////// Module definition and implementation ///////////////////////

decl_module! {
    pub struct Module<T: Trait<I>, I: Instance> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error;

        /// Setup events
        fn deposit_event() = default;

        /////////////////// Lifetime ///////////////////////////////////////////

        // start voting period
        pub fn start_referendum(origin, options: Vec<T::ReferendumOption>) -> Result<(), Error> {
            // ensure action can be started
            EnsureChecks::<T, I>::can_start_referendum(origin, &options)?;

            //
            // == MUTATION SAFE ==
            //

            // update state
            Mutations::<T, I>::start_voting_period(&options);

            // emit event
            Self::deposit_event(RawEvent::ReferendumStarted(options));

            Ok(())
        }

        // finish voting period
        pub fn finish_voting_start_revealing(origin) -> Result<(), Error> {
            // ensure action can be started
            EnsureChecks::<T, I>::can_finish_voting(origin)?;

            //
            // == MUTATION SAFE ==
            //

            // start revealing phase
            Mutations::<T, I>::start_revealing_period();

            // emit event
            Self::deposit_event(RawEvent::RevealingStageStarted());

            Ok(())
        }

        pub fn finish_revealing_period(origin) -> Result<(), Error> {
            // ensure action can be started
            EnsureChecks::<T, I>::can_finish_revealing(origin)?;

            //
            // == MUTATION SAFE ==
            //

            // start revealing phase
            let referendum_result = Mutations::<T, I>::conclude_referendum();

            // emit event
            Self::deposit_event(RawEvent::ReferendumFinished(referendum_result));

            Ok(())
        }

        /////////////////// User actions ///////////////////////////////////////

        pub fn vote(origin, commitment: T::Hash, stake: T::CurrencyBalance) -> Result<(), Error> {
            // ensure action can be started
            let account_id = EnsureChecks::<T, I>::can_vote(origin, &stake)?;

            //
            // == MUTATION SAFE ==
            //

            // start revealing phase - it can return error when stake fails to lock
            Mutations::<T, I>::vote(&account_id, &commitment, &stake)?;

            // emit event
            Self::deposit_event(RawEvent::VoteCasted(commitment, stake));

            Ok(())
        }

        pub fn reveal_vote(origin, salt: Vec<u8>, vote_option: T::ReferendumOption) -> Result<(), Error> {
            let (account_id, sealed_vote) = EnsureChecks::<T, I>::can_reveal_vote(origin, &salt, &vote_option)?;

            //
            // == MUTATION SAFE ==
            //

            // reveal the vote - it can return error when stake fails to unlock
            Mutations::<T, I>::reveal_vote(&account_id, &vote_option, &sealed_vote)?;

            // emit event
            Self::deposit_event(RawEvent::VoteRevealed(account_id, vote_option));

            Ok(())
        }
    }
}

/////////////////// Mutations //////////////////////////////////////////////////

struct Mutations<T: Trait<I>, I: Instance> {
    _dummy: PhantomData<(T, I)>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait<I>, I: Instance> Mutations<T, I> {
    fn start_voting_period(options: &Vec<T::ReferendumOption>) -> () {
        // change referendum state
        Stage::<T, I>::put((ReferendumStage::Voting, <system::Module<T>>::block_number()));

        // store new options
        ReferendumOptions::<T, I>::put(options.clone());
    }

    fn start_revealing_period() -> () {
        // change referendum state
        Stage::<T, I>::put((
            ReferendumStage::Revealing,
            <system::Module<T>>::block_number(),
        ));
    }

    fn conclude_referendum() -> ReferendumResult<T::ReferendumOption> {
        // select winning option
        // TODO - try to iterate ovet RevealedVotes when newer version of substrate is used (`RevealedVotes::<T, I>::iter_values(|option| ...)`)
        // TODO - decide what to do when two options recieve same amount of votes
        let mut max: (Option<Vec<&T::ReferendumOption>>, u64, bool) = (None, 0, false); // `(referendum_result, votes_count_for_winning_option, multiple_options_with_same_votes_count)`
        let options = ReferendumOptions::<T, I>::get();
        if let Some(tmp_options) = &options {
            for option in tmp_options.iter() {
                // skip option with 0 votes
                if !RevealedVotes::<T, I>::exists(option) {
                    continue;
                }
                let vote_sum = RevealedVotes::<T, I>::get(option);

                // skip this option if it is not a winner
                if vote_sum < max.1 {
                    continue;
                }

                // multiple votes have the same amount of votes?
                if vote_sum == max.1 {
                    let current_winners = match max.0 {
                        Some(tmp) => tmp,
                        None => vec![],
                    };

                    let new_winners = [current_winners, vec![option]].concat().to_vec();
                    max = (Some(new_winners), max.1, true);
                    continue;
                }

                max = (Some(vec![option]), vote_sum, false);
            }
        }
        let referendum_result = match max {
            (Some(winners), _, true) => ReferendumResult::MultipleWinners(winners.iter().map(|item| **item).collect()), // multiple options recieved the same amount of votes
            (Some(winners), _, false) => {
                if winners.len() > 0 {
                    return ReferendumResult::Winner(*winners[0]);
                }

                ReferendumResult::NoVotesRevealed
            },
            (None, _, false) => ReferendumResult::NoVotesRevealed,
            _ => ReferendumResult::NoVotesRevealed,
        };
        /*
        let referendum_result = match max.2 {
            true => None, // multiple options recieved the same amount of votes
            false => max.0,
        };
        */

        // reset referendum state
        Stage::<T, I>::put((ReferendumStage::Void, <system::Module<T>>::block_number()));
        ReferendumOptions::<T, I>::mutate(|_| None::<Vec<T::ReferendumOption>>);
        // TODO clear votes maps
        //RevealedVotes::...
        //Votes::...

        // return winning option
        referendum_result
    }

    /// Can return error when stake fails to lock
    fn vote(
        account_id: &T::AccountId,
        commitment: &T::Hash,
        stake: &T::CurrencyBalance,
    ) -> Result<(), Error> {
        // IMPORTANT - because locking currency can fail it has to be the first mutation!
        // lock stake amount
        if !T::lock_currency(&account_id, &stake) {
            return Err(Error::AccountStakeCurrencyFailed);
        }

        // store vote
        Votes::<T, I>::insert(account_id, SealedVote { commitment: *commitment, stake: *stake });

        Ok(())
    }

    fn reveal_vote(account_id: &T::AccountId, vote_option: &T::ReferendumOption, sealed_vote: &SealedVote<T::Hash, T::CurrencyBalance>) -> Result<(), Error> {
        // IMPORTANT - because unlocking currency can fail it has to be the first mutation!
        // unlock stake amount
        if !T::free_currency(&account_id, &sealed_vote.stake) {
            return Err(Error::AccountRelaseStakeCurrencyFailed);
        }

        // store revealed vote
        RevealedVotes::<T, I>::mutate(vote_option, |counter| *counter + 1);

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

    fn ensure_super_user(origin: T::Origin) -> Result<T::AccountId, Error> {
        let account_id = ensure_signed(origin)?;

        // ensure superuser requested action
        if !T::is_super_user(&account_id) {
            return Err(Error::OriginNotSuperUser);
        }

        Ok(account_id)
    }

    /////////////////// Action checks //////////////////////////////////////////

    fn can_start_referendum(
        origin: T::Origin,
        options: &[T::ReferendumOption],
    ) -> Result<(), Error> {
        // ensure superuser requested action
        Self::ensure_super_user(origin)?;

        // ensure referendum is not already running
        if Stage::<T, I>::get().0 != ReferendumStage::Void {
            return Err(Error::ReferendumAlreadyRunning);
        }

        // ensure some options were given
        if options.len() == 0 {
            return Err(Error::NoReferendumOptions);
        }

        // ensure number of options doesn't exceed limit
        if options.len() > T::MaxReferendumOptions::get() as usize {
            return Err(Error::TooManyReferendumOptions);
        }

        // ensure no two options are the same
        let mut options_by_id = HashSet::<u64>::new();
        for option in options {
            options_by_id.insert((*option).into());
        }
        if options_by_id.len() != options.len() {
            return Err(Error::DuplicateReferendumOptions);
        }

        Ok(())
    }

    fn can_finish_voting(origin: T::Origin) -> Result<(), Error> {
        // ensure superuser requested action
        Self::ensure_super_user(origin)?;

        let (stage, starting_block_number) = Stage::<T, I>::get();

        // ensure voting is running
        if stage != ReferendumStage::Voting {
            return Err(Error::ReferendumNotRunning);
        }

        let current_block = <system::Module<T>>::block_number();

        // ensure voting stage is complete
        if current_block < T::VoteStageDuration::get() + starting_block_number + One::one() {
            return Err(Error::VotingNotFinishedYet);
        }

        Ok(())
    }

    fn can_finish_revealing(origin: T::Origin) -> Result<(), Error> {
        // ensure superuser requested action
        Self::ensure_super_user(origin)?;

        let (stage, starting_block_number) = Stage::<T, I>::get();

        // ensure revealing is running
        if stage != ReferendumStage::Revealing {
            return Err(Error::RevealingNotInProgress);
        }

        let current_block = <system::Module<T>>::block_number();

        // ensure voting stage is complete
        if current_block < T::RevealStageDuration::get() + starting_block_number + One::one() {
            return Err(Error::RevealingNotFinishedYet);
        }

        // TODO: what should happen when 0 votes were cast/revealed???

        Ok(())
    }

    fn can_vote(origin: T::Origin, stake: &T::CurrencyBalance) -> Result<T::AccountId, Error> {
        // ensure superuser requested action
        let account_id = Self::ensure_super_user(origin)?;

        let (stage, starting_block_number) = Stage::<T, I>::get();

        // ensure referendum is running
        if stage != ReferendumStage::Voting {
            return Err(Error::ReferendumNotRunning);
        }

        let current_block = <system::Module<T>>::block_number();

        // ensure voting stage is not expired (it can happend when superuser haven't call `finish_voting_start_revealing` yet)
        if current_block >= T::VoteStageDuration::get() + starting_block_number + One::one() {
            return Err(Error::ReferendumNotRunning);
        }

        // ensure stake is enough for voting
        if stake < &T::MinimumStake::get() {
            return Err(Error::InsufficientStake);
        }

        // ensure account can lock the stake
        if !T::has_sufficient_balance(&account_id, &stake) {
            return Err(Error::InsufficientBalanceToStakeCurrency);
        }

        // ensure user haven't vote yet
        if Votes::<T, I>::exists(&account_id) {
            return Err(Error::AlreadyVoted);
        }

        Ok(account_id)
    }

    fn can_reveal_vote(origin: T::Origin, salt: &Vec<u8>, vote_option: &T::ReferendumOption) -> Result<(T::AccountId, SealedVote<T::Hash, T::CurrencyBalance>), Error> {
        fn calculate_commitment<T: Trait<I>, I: Instance>(account_id: &T::AccountId, salt: &Vec<u8>, vote_option: &T::ReferendumOption) -> T::Hash {
            let mut payload = account_id.encode();
            let mut mut_option = vote_option.clone().into().to_be_bytes().to_vec();
            let mut salt_tmp = salt.clone();

            payload.append(&mut salt_tmp);
            payload.append(&mut mut_option);

            <T::Hashing as sr_primitives::traits::Hash>::hash(&payload)
        }

        // ensure superuser requested action
        let account_id = Self::ensure_super_user(origin)?;

        let (stage, starting_block_number) = Stage::<T, I>::get();

        // ensure referendum is running
        if stage != ReferendumStage::Revealing {
            return Err(Error::RevealingNotInProgress);
        }

        let current_block = <system::Module<T>>::block_number();

        // ensure voting stage is not expired (it can happend when superuser haven't call `finish_voting_start_revealing` yet)
        if current_block >= T::RevealStageDuration::get() + starting_block_number + One::one() {
            return Err(Error::RevealingNotInProgress);
        }

        // ensure account voted
        if !Votes::<T, I>::exists(&account_id) {
            return Err(Error::NoVoteToReveal);
        }

        // ensure vote is ok
        match ReferendumOptions::<T, I>::get() {
            Some(options) => {
                // ensure vote option exists
                if (*vote_option).into() >= options.len() as u64 {
                    return Err(Error::InvalidVote);
                }
            }
            None => { // this branch shouldn't ever happen
                return Err(Error::InvalidReveal);
            }
        }

        let sealed_vote = Votes::<T, I>::get(&account_id);

        // ensure commitment corresponds to salt and vote option
        let commitment = calculate_commitment::<T, I>(&account_id, salt, vote_option);
        if commitment != sealed_vote.commitment {
            return Err(Error::InvalidReveal);
        }

        Ok((account_id, sealed_vote))
    }
}
