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

use std::collections::HashSet;

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

#[derive(Clone, Encode, Decode, PartialEq, Eq, Debug)]
pub enum ReferendumResult<ReferendumOption, VotePower> {
    Winners(Vec<(ReferendumOption, VotePower)>),
    ExtraWinners(Vec<(ReferendumOption, VotePower)>),
    NotEnoughWinners(Vec<(ReferendumOption, VotePower)>),
    NoVotesRevealed,
}

impl<T, U> Default for ReferendumResult<T, U> {
    fn default() -> ReferendumResult<T, U> {
        ReferendumResult::NoVotesRevealed
    }
}

/////////////////// Trait, Storage, Errors, and Events /////////////////////////

// TODO: get rid of dependency on Error<T, I> - create some nongeneric error
pub trait ReferendumManager<T: Trait<I>, I: Instance> {
    fn start_referendum(options: Vec<T::ReferendumOption>, winning_target_count: u64) -> Result<(), Error<T, I>>;
}

pub trait Trait<I: Instance>: system::Trait/* + ReferendumManager<Self, I>*/ {
    /// The overarching event type.
    type Event: From<Event<Self, I>> + Into<<Self as system::Trait>::Event>;

    /// Maximum number of options in one referendum.
    type MaxReferendumOptions: Get<u64>;
    type ReferendumOption: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + From<u64>
        + Into<u64>;

    /// Currency balance used for stakes.
    type CurrencyBalance: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + From<u64>
        + Into<u64>;

    type VotePower: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + From<u64>
        + Into<u64>;

    type VoteStageDuration: Get<Self::BlockNumber>;
    type RevealStageDuration: Get<Self::BlockNumber>;

    type MinimumStake: Get<Self::CurrencyBalance>;

    fn is_super_user(account_id: &<Self as system::Trait>::AccountId) -> bool;

    fn caclulate_vote_power(
        account_id: &<Self as system::Trait>::AccountId,
        stake: <Self as Trait<I>>::CurrencyBalance,
    ) -> <Self as Trait<I>>::VotePower;

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
        pub Stage get(fn stage) config(): (ReferendumStage, T::BlockNumber);

        /// Options of current referendum
        pub ReferendumOptions get(fn referendum_options) config(): Option<Vec<T::ReferendumOption>>;

        /// Votes in current referendum
        pub Votes get(fn votes) config(): map hasher(blake2_128_concat) T::AccountId => SealedVote<T::Hash, T::CurrencyBalance>;

        /// Revealed votes counter
        pub RevealedVotes get(fn revealed_votes) config(): map hasher(blake2_128_concat) T::ReferendumOption => T::VotePower;

        /// Target count of referendum winners
        pub WinningTargetCount get(fn winning_target_count) config(): u64;
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
        <T as Trait<I>>::CurrencyBalance,
        ReferendumResult = ReferendumResult<<T as Trait<I>>::ReferendumOption, <T as Trait<I>>::VotePower>,
        <T as system::Trait>::Hash,
        <T as system::Trait>::AccountId,
    {
        /// Referendum started
        ReferendumStarted(Vec<ReferendumOption>, u64),

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

        /// Not all referendum options are unique
        DuplicateReferendumOptions,

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

        // start voting period
        #[weight = 10_000_000]
        pub fn start_referendum(origin, options: Vec<T::ReferendumOption>, winning_target_count: u64) -> Result<(), Error<T, I>> {
            EnsureChecks::<T, I>::can_start_referendum_extrinsic(origin, &options)?;

            <Self as ReferendumManager<T, I>>::start_referendum(options, winning_target_count)
        }

        /////////////////// User actions ///////////////////////////////////////

        #[weight = 10_000_000]
        pub fn vote(origin, commitment: T::Hash, stake: T::CurrencyBalance) -> Result<(), Error<T, I>> {
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

        #[weight = 10_000_000]
        pub fn reveal_vote(origin, salt: Vec<u8>, vote_option: T::ReferendumOption) -> Result<(), Error<T, I>> {
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

/////////////////// Inner logic ////////////////////////////////////////////////

impl<T: Trait<I>, I: Instance> Module<T, I> {
    fn try_progress_stage(now: T::BlockNumber) {
        let (stage, start_block_number) = Stage::<T, I>::get();
        match stage {
            ReferendumStage::Void => (),
            ReferendumStage::Voting => {
                if now == start_block_number + T::VoteStageDuration::get() {
                    Self::end_voting_period();
                }
            }
            ReferendumStage::Revealing => {
                if now == start_block_number + T::RevealStageDuration::get() {
                    Self::end_reveal_period();
                }
            }
        }
    }

    fn end_voting_period() {
        // start revealing phase
        Mutations::<T, I>::start_revealing_period();

        // emit event
        Self::deposit_event(RawEvent::RevealingStageStarted());
    }

    fn end_reveal_period() {
        // conclude referendum
        let referendum_result = Mutations::<T, I>::conclude_referendum();

        // emit event
        Self::deposit_event(RawEvent::ReferendumFinished(referendum_result));
    }
}

/////////////////// ReferendumManager //////////////////////////////////////////

impl<T: Trait<I>, I: Instance> ReferendumManager<T, I> for Module<T, I> {

    fn start_referendum(options: Vec<T::ReferendumOption>, winning_target_count: u64) -> Result<(), Error<T, I>> {
        // ensure action can be started
        EnsureChecks::<T, I>::can_start_referendum(&options)?;

        //
        // == MUTATION SAFE ==
        //

        // update state
        Mutations::<T, I>::start_voting_period(&options, &winning_target_count);

        // emit event
        Self::deposit_event(RawEvent::ReferendumStarted(options, winning_target_count));

        Ok(())
    }
}

/////////////////// Mutations //////////////////////////////////////////////////

struct Mutations<T: Trait<I>, I: Instance> {
    _dummy: PhantomData<(T, I)>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait<I>, I: Instance> Mutations<T, I> {
    fn start_voting_period(options: &[T::ReferendumOption], winning_target_count: &u64) {
        // change referendum state
        Stage::<T, I>::put((ReferendumStage::Voting, <system::Module<T>>::block_number()));

        // store new options
        ReferendumOptions::<T, I>::put(options);

        // store winning target
        WinningTargetCount::<I>::put(winning_target_count);
    }

    fn start_revealing_period() {
        // change referendum state
        Stage::<T, I>::put((
            ReferendumStage::Revealing,
            <system::Module<T>>::block_number(),
        ));
    }

    fn conclude_referendum() -> ReferendumResult<T::ReferendumOption, T::VotePower> {
        // select winning option
        fn calculate_votes<T: Trait<I>, I: Instance>(
        ) -> ReferendumResult<T::ReferendumOption, T::VotePower> {
            //let mut max: (Option<Vec<&T::ReferendumOption>>, T::VotePower, bool) = (None, 0.into(), false); // `(referendum_result, votes_power_sum, multiple_options_with_same_votes_count)`

            // ordered vector - order from the most to the least
            let mut winning_order: Vec<(T::ReferendumOption, T::VotePower)> = vec![];

            // walk through all options
            let options = ReferendumOptions::<T, I>::get();
            if let Some(tmp_options) = &options {
                // formal condition - there will always be options
                for option in tmp_options.iter() {
                    // skip option with 0 votes
                    if !RevealedVotes::<T, I>::contains_key(option) {
                        continue;
                    }
                    let vote_sum = RevealedVotes::<T, I>::get(option);

                    // skip option with 0 votes
                    if vote_sum.into() == 0 {
                        continue;
                    }

                    winning_order.push((*option, vote_sum));
                }
            }

            // no votes revealed?
            if winning_order.is_empty() {
                return ReferendumResult::NoVotesRevealed;
            }

            // sort winners
            winning_order.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap().reverse());

            let voted_options_count = winning_order.len();
            let target_count = WinningTargetCount::<I>::get();

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
        let referendum_result = calculate_votes::<T, I>();

        // reset referendum state
        Self::reset_referendum();

        // return winning option
        referendum_result
    }

    fn reset_referendum() {
        Stage::<T, I>::put((ReferendumStage::Void, <system::Module<T>>::block_number()));
        ReferendumOptions::<T, I>::mutate(|value| *value = None::<Vec<T::ReferendumOption>>);
        Votes::<T, I>::remove_all();
        RevealedVotes::<T, I>::remove_all();
        WinningTargetCount::<I>::put(0);
    }

    /// Can return error when stake fails to lock
    fn vote(
        account_id: &T::AccountId,
        commitment: &T::Hash,
        stake: &T::CurrencyBalance,
    ) -> Result<(), Error<T, I>> {
        // IMPORTANT - because locking currency can fail it has to be the first mutation!
        // lock stake amount
        if !T::lock_currency(&account_id, &stake) {
            return Err(Error::AccountStakeCurrencyFailed);
        }

        // store vote
        Votes::<T, I>::insert(
            account_id,
            SealedVote {
                commitment: *commitment,
                stake: *stake,
            },
        );

        Ok(())
    }

    fn reveal_vote(
        account_id: &T::AccountId,
        vote_option: &T::ReferendumOption,
        sealed_vote: &SealedVote<T::Hash, T::CurrencyBalance>,
    ) -> Result<(), Error<T, I>> {
        // IMPORTANT - because unlocking currency can fail it has to be the first mutation!
        // unlock stake amount
        if !T::free_currency(&account_id, &sealed_vote.stake) {
            return Err(Error::AccountRelaseStakeCurrencyFailed);
        }

        // calculate vote power
        let vote_power = T::caclulate_vote_power(account_id, sealed_vote.stake);

        // store revealed vote
        RevealedVotes::<T, I>::mutate(vote_option, |counter| *counter += vote_power);

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

    fn ensure_regular_user(origin: T::Origin) -> Result<T::AccountId, Error<T, I>> {
        let account_id = ensure_signed(origin)?;

        Ok(account_id)
    }

    /////////////////// Action checks //////////////////////////////////////////

    fn can_start_referendum_extrinsic(
        origin: T::Origin,
        _options: &[T::ReferendumOption],
    ) -> Result<(), Error<T, I>> {
        // ensure superuser requested action
        Self::ensure_super_user(origin)?;

        Ok(())
    }

    fn can_start_referendum(
        options: &[T::ReferendumOption],
    ) -> Result<(), Error<T, I>> {
        // ensure referendum is not already running
        if Stage::<T, I>::get().0 != ReferendumStage::Void {
            return Err(Error::ReferendumAlreadyRunning);
        }

        // ensure some options were given
        if options.is_empty() {
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

    fn can_vote(
        origin: T::Origin,
        stake: &T::CurrencyBalance,
    ) -> Result<T::AccountId, Error<T, I>> {
        // ensure superuser requested action
        let account_id = Self::ensure_regular_user(origin)?;

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
        if Votes::<T, I>::contains_key(&account_id) {
            return Err(Error::AlreadyVoted);
        }

        Ok(account_id)
    }

    fn can_reveal_vote(
        origin: T::Origin,
        salt: &[u8],
        vote_option: &T::ReferendumOption,
    ) -> Result<(T::AccountId, SealedVote<T::Hash, T::CurrencyBalance>), Error<T, I>> {
        fn calculate_commitment<T: Trait<I>, I: Instance>(
            account_id: &T::AccountId,
            salt: &[u8],
            vote_option: &T::ReferendumOption,
        ) -> T::Hash {
            let mut payload = account_id.encode();
            let mut mut_option = vote_option.clone().into().to_be_bytes().to_vec();
            let mut salt_tmp = salt.to_vec();

            payload.append(&mut salt_tmp);
            payload.append(&mut mut_option);

            <T::Hashing as sp_runtime::traits::Hash>::hash(&payload)
        }

        // ensure superuser requested action
        let account_id = Self::ensure_regular_user(origin)?;

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
        if !Votes::<T, I>::contains_key(&account_id) {
            return Err(Error::NoVoteToReveal);
        }

        // ensure vote is ok
        match ReferendumOptions::<T, I>::get() {
            Some(options) => {
                // ensure vote option exists
                let mut vote_exists = false;
                for tmp_option in options.iter() {
                    if vote_option == tmp_option {
                        vote_exists = true;
                        break;
                    }
                }
                if !vote_exists {
                    return Err(Error::InvalidVote);
                }
            }
            None => {
                // this branch shouldn't ever happen
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
