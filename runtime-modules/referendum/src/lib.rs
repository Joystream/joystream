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

/// Implement secure ways to retrieve expected referendum stage's state data.
impl<BlockNumber, VotePower> ReferendumStage<BlockNumber, VotePower> {
    /// Get voting stage state.
    fn voting(self) -> ReferendumStageVoting<BlockNumber> {
        match self {
            ReferendumStage::Voting(stage_data) => stage_data,
            _ => panic!("Invalid state"),
        }
    }

    /// Get revealing stage state.
    fn revealing(self) -> ReferendumStageRevealing<BlockNumber, VotePower> {
        match self {
            ReferendumStage::Revealing(stage_data) => stage_data,
            _ => panic!("Invalid state"),
        }
    }
}

/// Representation for voting stage state.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct ReferendumStageVoting<BlockNumber> {
    start: BlockNumber,
    winning_target_count: u64,
}

/// Representation for revealing stage state.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct ReferendumStageRevealing<BlockNumber, VotePower> {
    start: BlockNumber,
    winning_target_count: u64,
    revealed_votes: Vec<VotePower>,
}

/// Vote casted in referendum but not revealed yet.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct SealedVote<Hash, CurrencyBalance, AccountId> {
    commitment: Hash,
    stake_distribution: StakeDistribution<AccountId, CurrencyBalance>,
}

/// Part of the vote designated for one referendum option.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default, Clone)]
pub struct SubVote<CurrencyBalance> {
    option_index: u64,
    balance: CurrencyBalance,
}

/// Distribution of user's vote and stake among referendum options.
pub type VoteDistribution<CurrencyBalance> = Vec<SubVote<CurrencyBalance>>;

// TODO: remove when this issue is solved https://github.com/rust-lang/rust-clippy/issues/3381
pub type VoteDistributionArg<CurrencyBalance> = [SubVote<CurrencyBalance>];

/// Part of the stake designated for one referendum option.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default, Clone)]
pub struct SubStake<AccountId, CurrencyBalance> {
    account_id: AccountId,
    balance: CurrencyBalance,
}

/// Distribution of user's stake among his accounts.
pub type StakeDistribution<AccountId, CurrencyBalance> = Vec<SubStake<AccountId, CurrencyBalance>>;

// TODO: remove when this issue is solved https://github.com/rust-lang/rust-clippy/issues/3381
pub type StakeDistributionArg<AccountId, CurrencyBalance> =
    [SubStake<AccountId, CurrencyBalance>];

pub trait StakeDistributionSum<CurrencyBalance> {
    fn sum_substakes(&self) -> CurrencyBalance;
}

impl<AccountId, CurrencyBalance: BaseArithmetic + Default + Clone>
    StakeDistributionSum<CurrencyBalance> for StakeDistribution<AccountId, CurrencyBalance>
{
    fn sum_substakes(&self) -> CurrencyBalance {
        self.iter().fold(CurrencyBalance::default(), |acc, item| {
            acc + item.balance.clone()
        })
    }
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
    fn start_referendum(
        options: Vec<T::ReferendumOption>,
        winning_target_count: u64,
    ) -> Result<(), Error<T, I>>;

    fn calculate_commitment(
        referendum_user_id: &T::ReferendumUserId,
        salt: &[u8],
        vote: &VoteDistributionArg<T::CurrencyBalance>,
    ) -> T::Hash;
}

pub trait Trait<I: Instance>: system::Trait /* + ReferendumManager<Self, I>*/ {
    /// The overarching event type.
    type Event: From<Event<Self, I>> + Into<<Self as system::Trait>::Event>;

    /// Maximum number of options in one referendum.
    type MaxReferendumOptions: Get<u64>;

    // Representation of the referendum option that can be voted for.
    type ReferendumOption: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

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

    /// User that can vote in referendum.
    type ReferendumUserId: Parameter
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

    /// Decide if user can vote in referendum.
    fn is_referendum_member(
        account_id: &<Self as system::Trait>::AccountId,
        referendum_user_id: &Self::ReferendumUserId,
    ) -> bool;

    /// Calculate the vote's power for user and his stake.
    fn caclulate_vote_power(
        referendum_user_id: &Self::ReferendumUserId,
        stake: <Self as Trait<I>>::CurrencyBalance,
    ) -> <Self as Trait<I>>::VotePower;

    /// Check if user can lock the stake.
    fn can_stake_for_vote(
        referendum_user_id: &Self::ReferendumUserId,
        stake_distribution: &StakeDistributionArg<
            <Self as system::Trait>::AccountId,
            Self::CurrencyBalance,
        >,
    ) -> bool;

    // Try to lock the stake lock.
    fn lock_currency(
        referendum_user_id: &Self::ReferendumUserId,
        stake_distribution: &StakeDistributionArg<
            <Self as system::Trait>::AccountId,
            Self::CurrencyBalance,
        >,
    ) -> bool;

    // Try to release the stake lock.
    fn free_currency(
        referendum_user_id: &Self::ReferendumUserId,
        stake_distribution: &StakeDistributionArg<
            <Self as system::Trait>::AccountId,
            Self::CurrencyBalance,
        >,
    ) -> bool;
}

decl_storage! {
    trait Store for Module<T: Trait<I>, I: Instance> as Referendum {
        /// Current referendum stage
        pub Stage get(fn stage) config(): ReferendumStage<T::BlockNumber, T::VotePower>;

        /// Options of current referendum
        pub ReferendumOptions get(fn referendum_options) config(): Option<Vec<T::ReferendumOption>>;

        /// Votes in current referendum
        pub Votes get(fn votes) config(): map hasher(blake2_128_concat) T::ReferendumUserId => SealedVote<T::Hash, T::CurrencyBalance, T::AccountId>;
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
        <T as Trait<I>>::ReferendumUserId,
        <T as system::Trait>::AccountId,
    {
        /// Referendum started
        ReferendumStarted(Vec<ReferendumOption>, u64),

        /// Revealing phase has begun
        RevealingStageStarted(),

        /// Referendum ended and winning option was selected
        ReferendumFinished(ReferendumResult),

        /// User casted a vote in referendum
        VoteCasted(Hash, StakeDistribution<AccountId, CurrencyBalance>),

        /// User revealed his vote
        VoteRevealed(ReferendumUserId, VoteDistribution<CurrencyBalance>),
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

        /// Referendum user id not match its account.
        ReferendumUserIdNotMatchAccount,

        /// One account was used twice for staking.
        DuplicateStakingAccount,

        /// Referendum option was refered twice in one vote.
        DuplicateVoteOption,
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
        pub fn start_referendum(origin, options: Vec<T::ReferendumOption>, winning_target_count: u64) -> Result<(), Error<T, I>> {
            EnsureChecks::<T, I>::can_start_referendum_extrinsic(origin, &options)?;

            <Self as ReferendumManager<T, I>>::start_referendum(options, winning_target_count)
        }

        /////////////////// User actions ///////////////////////////////////////

        /// Cast a sealed vote in the referendum.
        #[weight = 10_000_000]
        pub fn vote(origin, referendum_user_id: T::ReferendumUserId, commitment: T::Hash, stake_distribution: StakeDistribution<T::AccountId, T::CurrencyBalance>) -> Result<(), Error<T, I>> {
            // ensure action can be started
            EnsureChecks::<T, I>::can_vote(origin, &referendum_user_id, &stake_distribution)?;

            //
            // == MUTATION SAFE ==
            //

            // start revealing phase - it can return error when stake fails to lock
            Mutations::<T, I>::vote(&referendum_user_id, &commitment, &stake_distribution)?;

            // emit event
            Self::deposit_event(RawEvent::VoteCasted(commitment, stake_distribution));

            Ok(())
        }

        /// Reveal a sealed vote in the referendum.
        #[weight = 10_000_000]
        pub fn reveal_vote(origin, referendum_user_id: T::ReferendumUserId, salt: Vec<u8>, vote_distribution: VoteDistribution<T::CurrencyBalance>) -> Result<(), Error<T, I>> {
            let (_, sealed_vote) = EnsureChecks::<T, I>::can_reveal_vote::<Self>(origin, &referendum_user_id, &salt, &vote_distribution)?;

            //
            // == MUTATION SAFE ==
            //

            // reveal the vote - it can return error when stake fails to unlock
            Mutations::<T, I>::reveal_vote(&referendum_user_id, &vote_distribution, &sealed_vote)?;

            // emit event
            Self::deposit_event(RawEvent::VoteRevealed(referendum_user_id, vote_distribution));

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
                    Self::end_voting_period();
                }
            }
            ReferendumStage::Revealing(stage_data) => {
                if now == stage_data.start + T::RevealStageDuration::get() {
                    Self::end_reveal_period();
                }
            }
        }
    }

    /// Finish voting and start ravealing.
    fn end_voting_period() {
        // start revealing phase
        Mutations::<T, I>::start_revealing_period();

        // emit event
        Self::deposit_event(RawEvent::RevealingStageStarted());
    }

    /// Conclude the referendum.
    fn end_reveal_period() {
        // conclude referendum
        let referendum_result = Mutations::<T, I>::conclude_referendum();

        // emit event
        Self::deposit_event(RawEvent::ReferendumFinished(referendum_result));
    }
}

/////////////////// ReferendumManager //////////////////////////////////////////

impl<T: Trait<I>, I: Instance> ReferendumManager<T, I> for Module<T, I> {
    /// Start new referendum run.
    fn start_referendum(
        options: Vec<T::ReferendumOption>,
        winning_target_count: u64,
    ) -> Result<(), Error<T, I>> {
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

    /// Calculate commitment for a vote.
    fn calculate_commitment(
        referendum_user_id: &T::ReferendumUserId,
        salt: &[u8],
        vote: &VoteDistributionArg<T::CurrencyBalance>,
    ) -> T::Hash {
        let mut payload = referendum_user_id.encode();
        let mut mut_option = vote.encode();
        let mut salt_tmp = salt.to_vec();

        payload.append(&mut salt_tmp);
        payload.append(&mut mut_option);

        <T::Hashing as sp_runtime::traits::Hash>::hash(&payload)
    }
}

/////////////////// Mutations //////////////////////////////////////////////////

struct Mutations<T: Trait<I>, I: Instance> {
    _dummy: PhantomData<(T, I)>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait<I>, I: Instance> Mutations<T, I> {
    fn start_voting_period(options: &[T::ReferendumOption], winning_target_count: &u64) {
        // change referendum state
        Stage::<T, I>::put(ReferendumStage::Voting(ReferendumStageVoting::<
            T::BlockNumber,
        > {
            start: <system::Module<T>>::block_number(),
            winning_target_count: *winning_target_count,
        }));

        // store new options
        ReferendumOptions::<T, I>::put(options);
    }

    fn start_revealing_period() {
        let options_len = ReferendumOptions::<T, I>::get().unwrap().len();
        let old_stage = Stage::<T, I>::get().voting();

        // change referendum state
        Stage::<T, I>::put(ReferendumStage::Revealing(ReferendumStageRevealing::<
            T::BlockNumber,
            T::VotePower,
        > {
            start: <system::Module<T>>::block_number(),
            winning_target_count: old_stage.winning_target_count,
            revealed_votes: (0..options_len).map(|_| 0.into()).collect(),
        }));
    }

    fn conclude_referendum() -> ReferendumResult<T::ReferendumOption, T::VotePower> {
        // select winning option
        fn calculate_votes<T: Trait<I>, I: Instance>(
        ) -> ReferendumResult<T::ReferendumOption, T::VotePower> {
            // ordered vector - order from the most to the least
            let mut winning_order: Vec<(T::ReferendumOption, T::VotePower)> = vec![];

            let revealing_stage = Stage::<T, I>::get().revealing();

            // walk through all options
            let options = ReferendumOptions::<T, I>::get();
            if let Some(tmp_options) = &options {
                // formal condition - there will always be options
                for (i, option) in tmp_options.iter().enumerate() {
                    let vote_sum = revealing_stage.revealed_votes[i];

                    // skip option with 0 votes
                    if vote_sum == 0.into() {
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
        let referendum_result = calculate_votes::<T, I>();

        // reset referendum state
        Self::reset_referendum();

        // return winning option
        referendum_result
    }

    fn reset_referendum() {
        Stage::<T, I>::put(ReferendumStage::Inactive);
        ReferendumOptions::<T, I>::mutate(|value| *value = None::<Vec<T::ReferendumOption>>);
        Votes::<T, I>::remove_all();
    }

    /// Can return error when stake fails to lock
    fn vote(
        referendum_user_id: &T::ReferendumUserId,
        commitment: &T::Hash,
        stake_distribution: &StakeDistributionArg<T::AccountId, T::CurrencyBalance>,
    ) -> Result<(), Error<T, I>> {
        // IMPORTANT - because locking currency can fail it has to be the first mutation!
        // lock stake amount
        if !T::lock_currency(&referendum_user_id, &stake_distribution) {
            return Err(Error::AccountStakeCurrencyFailed);
        }

        // store vote
        Votes::<T, I>::insert(
            referendum_user_id,
            SealedVote {
                commitment: *commitment,
                stake_distribution: stake_distribution.to_vec(),
            },
        );

        Ok(())
    }

    fn reveal_vote(
        referendum_user_id: &T::ReferendumUserId,
        vote_distribution: &VoteDistributionArg<T::CurrencyBalance>,
        sealed_vote: &SealedVote<T::Hash, T::CurrencyBalance, T::AccountId>,
    ) -> Result<(), Error<T, I>> {
        // IMPORTANT - because unlocking currency can fail it has to be the first mutation!
        // unlock stake amount
        if !T::free_currency(&referendum_user_id, &sealed_vote.stake_distribution) {
            return Err(Error::AccountRelaseStakeCurrencyFailed);
        }

        let distribute_vote =
            |stage_data: &mut ReferendumStageRevealing<T::BlockNumber, T::VotePower>| {
                for subvote in vote_distribution {
                    // calculate vote power
                    let vote_power = T::caclulate_vote_power(referendum_user_id, subvote.balance);
                    stage_data.revealed_votes[subvote.option_index as usize] += vote_power;
                }
            };

        // store revealed vote
        Stage::<T, I>::mutate(|stage| {
            match stage {
                ReferendumStage::Revealing(stage_data) => distribute_vote(stage_data),
                _ => panic!("Invalid state"), // will never happen
            }
        });

        // remove user commitment to prevent repeated revealing
        Votes::<T, I>::remove(referendum_user_id);

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
        referendum_user_id: &T::ReferendumUserId,
    ) -> Result<T::AccountId, Error<T, I>> {
        let account_id = ensure_signed(origin)?;

        let is_member = T::is_referendum_member(&account_id, referendum_user_id);
        if !is_member {
            return Err(Error::ReferendumUserIdNotMatchAccount);
        }

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

    fn can_start_referendum(options: &[T::ReferendumOption]) -> Result<(), Error<T, I>> {
        // ensure referendum is not already running
        if Stage::<T, I>::get() != ReferendumStage::Inactive {
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
        if has_duplicates(options.to_vec()) {
            return Err(Error::DuplicateReferendumOptions);
        }

        Ok(())
    }

    fn can_vote(
        origin: T::Origin,
        referendum_user_id: &T::ReferendumUserId,
        stake_distribution: &StakeDistributionArg<T::AccountId, T::CurrencyBalance>,
    ) -> Result<T::AccountId, Error<T, I>> {
        // ensure superuser requested action
        let account_id = Self::ensure_regular_user(origin, referendum_user_id)?;

        let stage = Stage::<T, I>::get();

        // ensure referendum is running
        match stage {
            ReferendumStage::Voting(_) => (),
            _ => return Err(Error::ReferendumNotRunning),
        };

        let voting_stage = stage.voting();

        let current_block = <system::Module<T>>::block_number();

        // ensure voting stage is not expired (it can happend when superuser haven't call `finish_voting_start_revealing` yet)
        if current_block >= T::VoteStageDuration::get() + voting_stage.start + One::one() {
            return Err(Error::ReferendumNotRunning);
        }

        // ensure stake is enough for voting
        if stake_distribution.to_vec().sum_substakes() < T::MinimumStake::get() {
            return Err(Error::InsufficientStake);
        }

        // ensure no account is used twice for staking
        let tmp = stake_distribution
            .iter()
            .map(|item| &item.account_id)
            .collect::<Vec<&T::AccountId>>();
        if has_duplicates(tmp) {
            return Err(Error::DuplicateStakingAccount);
        }

        // ensure account can lock the stake
        if !T::can_stake_for_vote(&referendum_user_id, &stake_distribution) {
            return Err(Error::InsufficientBalanceToStakeCurrency);
        }

        // ensure user haven't vote yet
        if Votes::<T, I>::contains_key(&referendum_user_id) {
            return Err(Error::AlreadyVoted);
        }

        Ok(account_id)
    }

    fn can_reveal_vote<R: ReferendumManager<T, I>>(
        origin: T::Origin,
        referendum_user_id: &T::ReferendumUserId,
        salt: &[u8],
        vote_distribution: &VoteDistributionArg<T::CurrencyBalance>,
    ) -> Result<
        (
            T::AccountId,
            SealedVote<T::Hash, T::CurrencyBalance, T::AccountId>,
        ),
        Error<T, I>,
    > {
        // ensure superuser requested action
        let account_id = Self::ensure_regular_user(origin, referendum_user_id)?;

        let stage = Stage::<T, I>::get();

        // ensure referendum is running
        match stage {
            ReferendumStage::Revealing(_) => (),
            _ => return Err(Error::RevealingNotInProgress),
        };

        let stage_data = stage.revealing();
        let current_block = <system::Module<T>>::block_number();

        // ensure voting stage is not expired (it can happend when superuser haven't call `finish_voting_start_revealing` yet)
        if current_block >= T::RevealStageDuration::get() + stage_data.start + One::one() {
            return Err(Error::RevealingNotInProgress);
        }

        // ensure account haven't voted yet
        if !Votes::<T, I>::contains_key(&referendum_user_id) {
            return Err(Error::NoVoteToReveal);
        }

        // ensure each option is selected max once
        let tmp = vote_distribution
            .iter()
            .map(|item| &item.option_index)
            .collect::<Vec<&u64>>();
        if has_duplicates(tmp) {
            return Err(Error::DuplicateVoteOption);
        }

        // ensure vote is ok
        match ReferendumOptions::<T, I>::get() {
            Some(options) => {
                let options_count = options.len() as u64;
                for subvote in vote_distribution {
                    if subvote.option_index >= options_count {
                        return Err(Error::InvalidVote);
                    }
                }
            }
            None => {
                // this branch shouldn't ever happen
                return Err(Error::InvalidReveal);
            }
        }

        let sealed_vote = Votes::<T, I>::get(&referendum_user_id);

        // ensure commitment corresponds to salt and vote option
        let commitment = R::calculate_commitment(&referendum_user_id, salt, vote_distribution);
        if commitment != sealed_vote.commitment {
            return Err(Error::InvalidReveal);
        }

        Ok((account_id, sealed_vote))
    }
}

/////////////////// Utils //////////////////////////////////////////////////////
fn has_duplicates<T: Clone + Ord>(vector: Vec<T>) -> bool {
    let vector_len = vector.len();
    let mut tmp = vector;
    tmp.sort();
    tmp.dedup();
    let no_duplicates_len = tmp.len();

    vector_len != no_duplicates_len
}
