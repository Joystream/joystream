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
//! ## Supported extrinsics
//! - [announce_candidacy](./struct.Module.html#method.announce_candidacy)
//! - [release_candidacy_stake](./struct.Module.html#method.release_candidacy_stake)
//!
//! ## Important functions
//! These functions have to be called by the runtime for the council to work properly.
//! - [recieve_referendum_results](./trait.ReferendumConnection.html#method.recieve_referendum_results)
//! - [can_release_vote_stake](./trait.ReferendumConnection.html#method.can_release_vote_stake)
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
use sp_runtime::traits::{MaybeSerialize, Member};
use std::marker::PhantomData;
use system::{ensure_signed, RawOrigin};

use referendum::Instance as ReferendumInstanceGeneric;
use referendum::Trait as ReferendumTrait;
use referendum::{OptionResult, ReferendumManager};

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
pub struct Candidate<AccountId, Balance> {
    account_id: AccountId,
    cycle_id: u64,
    order_index: u64,
    stake: Balance,
}

/// Council member representation.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default, Clone)]
pub struct CouncilMember<AccountId, CouncilUserId, Balance> {
    account_id: AccountId,
    council_user_id: CouncilUserId,
    stake: Balance,
}

impl<AccountId, CouncilUserId, Balance> From<(Candidate<AccountId, Balance>, CouncilUserId)>
    for CouncilMember<AccountId, CouncilUserId, Balance>
{
    fn from(candidate_and_user_id: (Candidate<AccountId, Balance>, CouncilUserId)) -> Self {
        Self {
            account_id: candidate_and_user_id.0.account_id,
            council_user_id: candidate_and_user_id.1,
            stake: candidate_and_user_id.0.stake,
        }
    }
}

/////////////////// Type aliases ///////////////////////////////////////////////

pub type Balance<T> = <<<T as Trait>::Referendum as ReferendumManager<
    <T as system::Trait>::Origin,
    <T as system::Trait>::AccountId,
    <T as system::Trait>::Hash,
>>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;
pub type BalanceReferendum<T> = Balance<T>;
pub type VotePowerOf<T> = <<T as Trait>::Referendum as ReferendumManager<
    <T as system::Trait>::Origin,
    <T as system::Trait>::AccountId,
    <T as system::Trait>::Hash,
>>::VotePower;

pub type CouncilMemberOf<T> =
    CouncilMember<<T as system::Trait>::AccountId, <T as Trait>::CouncilUserId, Balance<T>>;
pub type CandidateOf<T> = Candidate<<T as system::Trait>::AccountId, Balance<T>>;
pub type CouncilStageUpdateOf<T> = CouncilStageUpdate<<T as system::Trait>::BlockNumber>;

/////////////////// Trait, Storage, Errors, and Events /////////////////////////

/// The main council trait.
pub trait Trait: system::Trait {
    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    /// Representation for council membership.
    type CouncilUserId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + From<u64>;

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
    type CandidacyLock: StakingHandler2<Self::AccountId, Balance<Self>, Self::CouncilUserId>;
    /// Identifier for currency lock used for candidacy staking.
    type ElectedMemberLock: StakingHandler2<Self::AccountId, Balance<Self>, Self::CouncilUserId>;

    /// Duration of annoncing period
    type AnnouncingPeriodDuration: Get<Self::BlockNumber>;
    /// Duration of idle period
    type IdlePeriodDuration: Get<Self::BlockNumber>;
}

/// Trait with functions that MUST be called by the runtime with values received from the referendum module.
pub trait ReferendumConnection<T: Trait> {
    /// Process referendum results. This function MUST be called in runtime's implementation of referendum's `process_results()`.
    fn recieve_referendum_results(winners: &[OptionResult<VotePowerOf<T>>])
        -> Result<(), Error<T>>;

    /// Process referendum results. This function MUST be called in runtime's implementation of referendum's `process_results()`.
    fn can_release_vote_stake() -> Result<(), Error<T>>;

    fn is_valid_candidate_id(council_user_id: &T::CouncilUserId) -> bool;
}

decl_storage! {
    trait Store for Module<T: Trait> as Council {
        /// Current council voting stage
        pub Stage get(fn stage) config(): CouncilStageUpdate<T::BlockNumber>;

        /// Current council members
        pub CouncilMembers get(fn council_members) config(): Vec<CouncilMemberOf<T>>;

        /// Map of all candidates that ever candidated and haven't unstake yet.
        pub Candidates get(fn candidates) config(): map hasher(blake2_128_concat) T::CouncilUserId => Candidate<T::AccountId, Balance::<T>>;

        /// Index of the current candidacy period. It is incremented everytime announcement period is.
        pub CurrentAnnouncementCycleId get(fn current_announcement_cycle_id) config(): u64;
    }
}

decl_event! {
    pub enum Event<T>
    where
        Balance = Balance::<T>,
        <T as system::Trait>::AccountId,
        <T as Trait>::CouncilUserId,
    {
        /// New council was elected
        AnnouncingPeriodStarted(),

        /// Announcing period can't finish because of insufficient candidtate count
        NotEnoughCandidates(),

        /// Candidates are announced and voting starts
        VotingPeriodStarted(u64),

        /// New candidate announced
        NewCandidate(Candidate<AccountId, Balance>),

        /// New council was elected and appointed
        NewCouncilElected(Vec<CouncilMember<AccountId, CouncilUserId, Balance>>),

        /// New council was elected and appointed
        NewCouncilNotElected(),
    }
}

decl_error! {
    /// Council errors
    pub enum Error for Module<T: Trait> {
        /// Origin is invalid
        BadOrigin,

        /// User tried to candidate outside of the announcement period
        CantCandidateNow,

        /// User tried to release stake before reveal period
        CantReleaseStakeNow,

        /// Candidate haven't provide sufficient stake
        CandidacyStakeTooLow,

        /// User tried to candidate twice in the same elections.
        CantCandidateTwice,

        /// Council member and candidates can't withdraw stake
        StakeStillNeeded,

        /// Candidate can't vote for himself
        CantVoteForYourself,

        /// Invalid runtime implementation broke the council. This error shouldn't happen
        /// and in case of bad implementation should be discovered in the first block when referendum start will fail.
        InvalidRuntimeImplementation,

        /// Invalid membership
        CouncilUserIdNotMatchAccount,
    }
}

impl<T: Trait, RT: ReferendumTrait<I>, I: ReferendumInstanceGeneric> From<referendum::Error<RT, I>>
    for Error<T>
{
    fn from(_other: referendum::Error<RT, I>) -> Error<T> {
        //panic!(format!("{:?}", other)); // temporary debug
        Error::<T>::BadOrigin // TODO: find way to select proper error
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
            Self::try_progress_stage(now);
        }

        /// Subscribe candidate
        #[weight = 10_000_000]
        pub fn announce_candidacy(origin, council_user_id: T::CouncilUserId, stake: Balance<T>) -> Result<(), Error<T>> {
            // ensure action can be started
            let (stage_data, account_id) = EnsureChecks::<T>::can_announce_candidacy(origin, &council_user_id, &stake)?;

            // prepare candidate
            let candidate = Self::prepare_new_candidate(account_id, stage_data.candidates_count, stake);

            //
            // == MUTATION SAFE ==
            //

            // update state
            Mutations::<T>::announce_candidacy(&stage_data, &council_user_id, &candidate, &stake);

            // emit event
            Self::deposit_event(RawEvent::NewCandidate(candidate));

            Ok(())
        }

        #[weight = 10_000_000]
        pub fn release_candidacy_stake(origin, council_user_id: T::CouncilUserId) -> Result<(), Error<T>> {
            let account_id = EnsureChecks::<T>::can_release_candidacy_stake(origin, &council_user_id)?;

            //
            // == MUTATION SAFE ==
            //

            // update state
            Mutations::<T>::release_candidacy_stake(&account_id, &council_user_id);

            Ok(())
        }
    }
}

/////////////////// Inner logic ////////////////////////////////////////////////

impl<T: Trait> Module<T> {
    /// Checkout expire of referendum stage.
    fn try_progress_stage(now: T::BlockNumber) {
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

    /// Finish voting and start ravealing.
    fn end_announcement_period(stage_data: CouncilStageAnnouncing) {
        let candidate_count = T::CouncilSize::get() + T::MinNumberOfExtraCandidates::get();

        // reset announcing period when not enough candidates registered
        if stage_data.candidates_count < candidate_count {
            Mutations::<T>::next_announcing_cycle();
            Mutations::<T>::start_announcing_period();

            // emit event
            Self::deposit_event(RawEvent::NotEnoughCandidates());

            return;
        }

        // TODO: try to find way how to get rid of unwrap here or staticly ensure it will not fail here
        // update state
        Mutations::<T>::finalize_announcing_period(&stage_data).unwrap(); // starting referendum should always start if implementation is valid - unwrap

        // emit event
        Self::deposit_event(RawEvent::VotingPeriodStarted(stage_data.candidates_count));
    }

    /// Conclude election period and elect new council if possible.
    fn end_election_period(winners: &[OptionResult<VotePowerOf<T>>]) {
        let council_size = T::CouncilSize::get();
        if winners.len() as u64 != council_size {
            // reset candidacy announcement period
            Mutations::<T>::next_announcing_cycle();
            Mutations::<T>::start_announcing_period();

            // emit event
            Self::deposit_event(RawEvent::NewCouncilNotElected());

            return;
        }

        // prepare candidates that got elected
        let elected_members: Vec<CouncilMemberOf<T>> = winners
            .iter()
            .map(|item| {
                println!("{:?}", item.option_id);
                let council_user_id = item.option_id.into();
                let candidate = Candidates::<T>::get(council_user_id);

                // clear candidate record
                Candidates::<T>::remove(council_user_id);

                (candidate, council_user_id).into()
            })
            .collect();

        // update state
        Mutations::<T>::elect_new_council(elected_members.as_slice());

        // emit event
        Self::deposit_event(RawEvent::NewCouncilElected(elected_members));
    }

    /// Finish idle period and start new council election cycle (announcing period).
    fn end_idle_period() {
        // update state
        Mutations::<T>::start_announcing_period();

        // emit event
        Self::deposit_event(RawEvent::AnnouncingPeriodStarted());
    }

    /// Construct a new candidate for council election.
    fn prepare_new_candidate(
        account_id: T::AccountId,
        current_candidate_count: u64,
        stake: Balance<T>,
    ) -> CandidateOf<T> {
        Candidate {
            account_id,
            cycle_id: CurrentAnnouncementCycleId::get(),
            order_index: current_candidate_count,
            stake,
        }
    }
}

impl<T: Trait> ReferendumConnection<T> for Module<T> {
    /// Process candidates' results recieved from the referendum.
    fn recieve_referendum_results(
        winners: &[OptionResult<VotePowerOf<T>>],
    ) -> Result<(), Error<T>> {
        //
        // == MUTATION SAFE ==
        //

        // conclude election
        Self::end_election_period(winners);

        Ok(())
    }

    fn can_release_vote_stake() -> Result<(), Error<T>> {
        // ensure it's proper time to release stake
        match Stage::<T>::get().stage {
            CouncilStage::Idle => (),
            _ => return Err(Error::CantReleaseStakeNow),
        };

        Ok(())
    }

    fn is_valid_candidate_id(council_user_id: &T::CouncilUserId) -> bool {
        if !Candidates::<T>::contains_key(council_user_id) {
            return false;
        }

        let candidate = Candidates::<T>::get(council_user_id);

        candidate.cycle_id == CurrentAnnouncementCycleId::get()
    }
}

/////////////////// Mutations //////////////////////////////////////////////////

struct Mutations<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> Mutations<T> {
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
    }

    /// Increases announcing cycle index. It should be called after election phase ends or before announcing period is reset.
    fn next_announcing_cycle() {
        // increase anouncement cycle id
        CurrentAnnouncementCycleId::mutate(|value| *value += 1);
    }

    /// Change the council stage from the announcing to the election stage.
    fn finalize_announcing_period(stage_data: &CouncilStageAnnouncing) -> Result<(), Error<T>> {
        let extra_winning_target_count = T::CouncilSize::get() - 1;
        let origin = RawOrigin::Root;

        // IMPORTANT - because starting referendum can fail it has to be the first mutation!
        // start referendum
        T::Referendum::start_referendum(origin.into(), extra_winning_target_count)
            .map_err(|_| Error::<T>::InvalidRuntimeImplementation)?;

        let block_number = <system::Module<T>>::block_number();

        // change council state
        Stage::<T>::put(CouncilStageUpdate {
            stage: CouncilStage::Election(CouncilStageElection {
                candidates_count: stage_data.candidates_count,
            }),
            changed_at: block_number + 1.into(), // set next block as the start of next phase (this function is invoke on block finalization)
        });

        Ok(())
    }

    /// Elect new council after successful election.
    fn elect_new_council(elected_members: &[CouncilMemberOf<T>]) {
        let block_number = <system::Module<T>>::block_number();

        // change council state
        Mutations::<T>::next_announcing_cycle();
        Stage::<T>::mutate(|value| {
            *value = CouncilStageUpdate {
                stage: CouncilStage::Idle,
                changed_at: block_number + 1.into(), // set next block as the start of next phase
            }
        });

        // release stakes for previous council members
        CouncilMembers::<T>::get()
            .iter()
            .for_each(|council_member| {
                T::ElectedMemberLock::unlock(&council_member.account_id);
            });

        // set new council
        CouncilMembers::<T>::put(elected_members.to_vec());

        // setup elected member lock to new council's members
        CouncilMembers::<T>::get()
            .iter()
            .for_each(|council_member| {
                // unlock candidacy stake
                T::CandidacyLock::unlock(&council_member.account_id);

                // lock council member stake
                T::ElectedMemberLock::lock(&council_member.account_id, council_member.stake);
            });
    }

    /// Announce user's candidacy.
    fn announce_candidacy(
        stage_data: &CouncilStageAnnouncing,
        council_user_id: &T::CouncilUserId,
        candidate: &CandidateOf<T>,
        stake: &Balance<T>,
    ) {
        // insert candidate to candidate registery
        Candidates::<T>::insert(council_user_id, candidate.clone());

        // prepare new stage
        let new_stage_data = CouncilStageAnnouncing {
            candidates_count: stage_data.candidates_count + 1,
        };

        // lock candidacy stake
        T::CandidacyLock::lock(&candidate.account_id, *stake);

        // store new candidacy list
        Stage::<T>::mutate(|value| {
            *value = CouncilStageUpdate {
                stage: CouncilStage::Announcing(new_stage_data),

                // keep changed_at (and other values) - stage phase haven't changed
                ..*value
            }
        });
    }

    /// Release user's stake that was used for candidacy.
    fn release_candidacy_stake(account_id: &T::AccountId, council_user_id: &T::CouncilUserId) {
        // release stake amount
        T::CandidacyLock::unlock(&account_id);

        let candidate = Candidates::<T>::get(council_user_id);

        // remove candidate record
        Candidates::<T>::remove(council_user_id);

        // escape if order index is in use again
        if let CouncilStage::Announcing(stage_data) = Stage::<T>::get().stage {
            if stage_data.candidates_count > candidate.order_index {
                return;
            }
        }
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
        council_user_id: &T::CouncilUserId,
    ) -> Result<T::AccountId, Error<T>> {
        let account_id = ensure_signed(origin)?;

        ensure!(
            T::CandidacyLock::is_member_staking_account(&council_user_id, &account_id),
            Error::CouncilUserIdNotMatchAccount,
        );

        Ok(account_id)
    }

    /////////////////// Action checks //////////////////////////////////////////

    fn can_announce_candidacy(
        origin: T::Origin,
        council_user_id: &T::CouncilUserId,
        stake: &Balance<T>,
    ) -> Result<(CouncilStageAnnouncing, T::AccountId), Error<T>> {
        // ensure user's membership
        let account_id = Self::ensure_user_membership(origin, &council_user_id)?;

        let stage_data = match Stage::<T>::get().stage {
            CouncilStage::Announcing(stage_data) => stage_data,
            _ => return Err(Error::CantCandidateNow),
        };

        // prevent user from candidating twice in the same election
        if Candidates::<T>::contains_key(council_user_id)
            && Candidates::<T>::get(council_user_id).order_index
                == CurrentAnnouncementCycleId::get()
        {
            return Err(Error::CantCandidateTwice);
        }

        if stake < &T::MinCandidateStake::get() {
            return Err(Error::CandidacyStakeTooLow);
        }

        Ok((stage_data, account_id))
    }

    fn can_release_candidacy_stake(
        origin: T::Origin,
        council_user_id: &T::CouncilUserId,
    ) -> Result<T::AccountId, Error<T>> {
        // ensure user's membership
        let account_id = Self::ensure_user_membership(origin, council_user_id)?;

        // ensure user is not current council member
        let members = CouncilMembers::<T>::get();
        let council_member = members.iter().find(|item| item.account_id == account_id);
        if council_member.is_some() {
            return Err(Error::StakeStillNeeded);
        }

        // ensure user is not candidating in current announcement cycle
        if Candidates::<T>::contains_key(council_user_id)
            && Candidates::<T>::get(council_user_id).cycle_id == CurrentAnnouncementCycleId::get()
        {
            return Err(Error::StakeStillNeeded);
        }

        Ok(account_id)
    }
}
