// TODO: module documentation
// TODO: adjust all extrinsic weights

/////////////////// Configuration //////////////////////////////////////////////
#![cfg_attr(not(feature = "std"), no_std)]

// used dependencies
use codec::{Decode, Encode};
use frame_support::traits::{Currency, Get, LockIdentifier, LockableCurrency, WithdrawReason};
use frame_support::{decl_error, decl_event, decl_module, decl_storage, error::BadOrigin};

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use std::marker::PhantomData;
use system::{ensure_signed, RawOrigin};

use referendum::Instance as ReferendumInstanceGeneric;
use referendum::Trait as ReferendumTrait;
use referendum::{OptionResult, ReferendumManager};

// declared modules
mod mock;
mod tests;

/////////////////// Data Structures ////////////////////////////////////////////

/// Information about council's current state and when it changed the last time.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct CouncilStageInfo<AccountId, Currency, BlockNumber> {
    stage: CouncilStage<AccountId, Currency>,
    changed_at: BlockNumber,
}

/// Possible council states.
#[derive(Encode, Decode, PartialEq, Eq, Debug)]
pub enum CouncilStage<AccountId, Balance> {
    /// Candidacy announcement period.
    Announcing(CouncilStageAnnouncing<AccountId, Balance>),
    /// Election of the new council.
    Election(CouncilStageElection<AccountId, Balance>),
    /// The idle phase - no new council election is running now.
    Idle,
}

impl<AccountId, Balance> Default for CouncilStage<AccountId, Balance> {
    fn default() -> CouncilStage<AccountId, Balance> {
        CouncilStage::<AccountId, Balance>::Announcing(CouncilStageAnnouncing {
            candidates: vec![],
        })
    }
}

/// Representation for announcing candidacy stage state.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct CouncilStageAnnouncing<AccountId, Balance> {
    candidates: Vec<Candidate<AccountId, Balance>>,
}

/// Representation for new council members election stage state.
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct CouncilStageElection<AccountId, Balance> {
    candidates: Vec<Candidate<AccountId, Balance>>,
}

/// Candidate / council member representation.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default, Clone)]
pub struct Candidate<AccountId, Balance> {
    account_id: AccountId,
    stake: Balance,
}

/////////////////// Type aliases ///////////////////////////////////////////////

pub(crate) type ReferendumInstance = referendum::Instance0;

// `Ez` prefix in some of the following type aliases means *easy* and is meant to create unique short names
// aliasing existing structs and enums

// Alias for referendum's storage.
pub(crate) type Referendum<T> = referendum::Module<T, ReferendumInstance>;

pub type EzCurrency<T> = <T as referendum::Trait<ReferendumInstance>>::Currency;
pub type Balance<T> = <<T as referendum::Trait<ReferendumInstance>>::Currency as Currency<
    <T as system::Trait>::AccountId,
>>::Balance;
pub type BalanceReferendum<T> = Balance<T>;
pub type EzVotePower<T> = <T as referendum::Trait<ReferendumInstance>>::VotePower;

pub type EzCandidate<T> = Candidate<<T as system::Trait>::AccountId, Balance<T>>;
pub type EzCouncilStageInfo<T> = CouncilStageInfo<
    <T as system::Trait>::AccountId,
    Balance<T>,
    <T as system::Trait>::BlockNumber,
>;
pub type EzCouncilStageAnnouncing<T> =
    CouncilStageAnnouncing<<T as system::Trait>::AccountId, Balance<T>>;
pub type EzCouncilStageElection<T> =
    CouncilStageElection<<T as system::Trait>::AccountId, Balance<T>>;

/////////////////// Trait, Storage, Errors, and Events /////////////////////////

pub trait Trait: system::Trait + referendum::Trait<ReferendumInstance> {
    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    /// Minimum number of extra candidates needed for the valid election.
    /// Number of total candidates is equal to council size plus extra candidates.
    type MinNumberOfExtraCandidates: Get<u64>;
    /// Council member count
    type CouncilSize: Get<u64>;
    /// Minimum stake candidate has to lock
    type MinCandidateStake: Get<Balance<Self>>;

    /// Identifier for currency locks used for staking.
    type LockId: Get<LockIdentifier>;

    /// Duration of annoncing period
    type AnnouncingPeriodDuration: Get<Self::BlockNumber>;
    /// Duration of idle period
    type IdlePeriodDuration: Get<Self::BlockNumber>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Council {
        /// Current council voting stage
        pub Stage get(fn stage) config(): CouncilStageInfo<T::AccountId, Balance::<T>, T::BlockNumber>;

        /// Current council members
        pub CouncilMembers get(fn council_members) config(): Vec<EzCandidate<T>>;

    }
}

decl_event! {
    pub enum Event<T>
    where
        Balance = Balance::<T>,
        <T as system::Trait>::AccountId,
    {
        /// New council was elected
        AnnouncingPeriodStarted(),

        /// Announcing period can't finish because of insufficient candidtate count
        NotEnoughCandidates(),

        /// Candidates are announced and voting starts
        VotingPeriodStarted(Vec<Candidate<AccountId, Balance>>),

        /// New candidate announced
        NewCandidate(Candidate<AccountId, Balance>),

        /// New council was elected and appointed
        NewCouncilElected(Vec<Candidate<AccountId, Balance>>),

        /// New council was elected and appointed
        NewCouncilNotElected(),
    }
}

decl_error! {
    /// Referendum errors
    pub enum Error for Module<T: Trait> {
        /// Origin is invalid
        BadOrigin,

        /// User tried to candidate outside of the announcement period
        CantCandidateNow,

        /// User tried to candidate outside of the announcement period
        CantReleaseStakeNow,

        /// Candidate haven't provide sufficient stake
        CandidacyStakeTooLow,

        /// Council member and candidates can't withdraw stake
        StakeStillNeeded,

        /// Candidate can't vote for himself
        CantVoteForYourself,

        // TODO: try to get rid of this error if possible
        InvalidRuntimeImplementation,
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
        pub fn candidate(origin, stake: Balance<T>) -> Result<(), Error<T>> {
            // ensure action can be started
            let (stage_data, candidate) = EnsureChecks::<T>::can_candidate(origin, &stake)?;

            //
            // == MUTATION SAFE ==
            //

            // update state
            Mutations::<T>::candidate(&stage_data, &candidate, &stake);

            // emit event
            Self::deposit_event(RawEvent::NewCandidate(candidate));

            Ok(())
        }

        #[weight = 10_000_000]
        pub fn release_candidacy_stake(origin) -> Result<(), Error<T>> {
            let account_id = EnsureChecks::<T>::can_release_candidacy_stake(origin)?;

            //
            // == MUTATION SAFE ==
            //

            // update state
            Mutations::<T>::release_candidacy_stake(&account_id);

            Ok(())
        }

        /////////////////// Referendum Wrap ////////////////////////////////////
        // start voting period
        #[weight = 10_000_000]
        pub fn vote(origin, commitment: T::Hash, balance: Balance<T>) -> Result<(), Error<T>> {
            //
            // == MUTATION SAFE ==
            //

            // call referendum vote extrinsic
            <Referendum<T>>::vote(origin, commitment, balance)?;

            Ok(())
        }

        #[weight = 10_000_000]
        pub fn reveal_vote(origin, salt: Vec<u8>, vote_option_index: u64) -> Result<(), Error<T>> {
            EnsureChecks::<T>::can_reveal_vote(origin.clone(), vote_option_index)?;

            //
            // == MUTATION SAFE ==
            //

            // call referendum reveal vote extrinsic
            <Referendum<T>>::reveal_vote(origin, salt, vote_option_index)?;

            Ok(())
        }

        #[weight = 10_000_000]
        pub fn release_vote_stake(origin) -> Result<(), Error<T>> {
            EnsureChecks::<T>::can_release_vote_stake(origin.clone())?;

            //
            // == MUTATION SAFE ==
            //

            // call referendum reveal vote extrinsic
            <Referendum<T>>::release_stake(origin)?;

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
                if now == Stage::<T>::get().changed_at + T::AnnouncingPeriodDuration::get() {
                    Self::end_announcement_period(stage_data);
                }
            }
            CouncilStage::Idle => {
                if now == Stage::<T>::get().changed_at + T::IdlePeriodDuration::get() {
                    Self::end_idle_period();
                }
            }
            _ => (),
        }
    }

    /// Finish voting and start ravealing.
    fn end_announcement_period(stage_data: EzCouncilStageAnnouncing<T>) {
        let candidate_count = T::CouncilSize::get() + T::MinNumberOfExtraCandidates::get();

        // prolong announcing period when not enough candidates registered
        if (stage_data.candidates.len() as u64) < candidate_count {
            Mutations::<T>::prolong_announcing_period(stage_data);

            // emit event
            Self::deposit_event(RawEvent::NotEnoughCandidates());

            return;
        }

        // TODO: try to find way how to get rid of unwrap here or staticly ensure it will not fail here
        // update state
        Mutations::<T>::finalize_announcing_period(&stage_data).unwrap(); // starting referendum should always start if implementation is valid - unwrap

        // emit event
        Self::deposit_event(RawEvent::VotingPeriodStarted(stage_data.candidates));
    }

    /// Conclude election period and elect new council if possible.
    fn end_election_period(
        stage_data: EzCouncilStageElection<T>,
        winners: &[OptionResult<EzVotePower<T>>],
    ) {
        let council_size = T::CouncilSize::get();
        if winners.len() as u64 != council_size {
            // this should be same as `winners.len() < council_size`, but let's use `!=` for code safety
            // TODO: select new council from tied candidates or reset election

            // update state
            Mutations::<T>::finalize_election_period();

            // emit event
            Self::deposit_event(RawEvent::NewCouncilNotElected());

            return;
        }

        // prepare candidates that got elected
        let elected_members: Vec<EzCandidate<T>> = winners
            .iter()
            .map(|item| stage_data.candidates[item.option_id as usize].clone())
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

    /// Process candidates' results recieved from the referendum.
    pub fn recieve_referendum_results(
        winners: &[OptionResult<EzVotePower<T>>],
    ) -> Result<(), Error<T>> {
        // ensure this method was called during election stage
        let stage_data = match Stage::<T>::get().stage {
            CouncilStage::Election(stage_data) => stage_data,
            _ => return Err(Error::InvalidRuntimeImplementation),
        };

        // conclude election
        Self::end_election_period(stage_data, winners);

        Ok(())
    }
}

/////////////////// Mutations //////////////////////////////////////////////////

struct Mutations<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> Mutations<T> {
    /// Change the council stage from idle to candidacy announcing stage.
    fn start_announcing_period() {
        let stage_data = EzCouncilStageAnnouncing::<T> { candidates: vec![] };

        Self::prolong_announcing_period(stage_data);
    }

    /// Prolong the announcing period when not enought candidates were announced.
    fn prolong_announcing_period(stage_data: EzCouncilStageAnnouncing<T>) {
        let block_number = <system::Module<T>>::block_number();

        Stage::<T>::mutate(|value| {
            *value = CouncilStageInfo {
                stage: CouncilStage::Announcing(stage_data),
                changed_at: block_number,
            }
        });
    }

    /// Change the council stage from the announcing to the election stage.
    fn finalize_announcing_period(
        stage_data: &EzCouncilStageAnnouncing<T>,
    ) -> Result<(), Error<T>> {
        let extra_winning_target_count = T::CouncilSize::get() - 1;
        let origin = RawOrigin::Root;

        // IMPORTANT - because starting referendum can fail it has to be the first mutation!
        // start referendum
        <Referendum<T> as ReferendumManager<T, ReferendumInstance>>::start_referendum(
            origin.into(),
            extra_winning_target_count,
        )?;

        let block_number = <system::Module<T>>::block_number();

        // change council state
        Stage::<T>::mutate(|value| {
            *value = CouncilStageInfo {
                stage: CouncilStage::Election(EzCouncilStageElection::<T> {
                    candidates: stage_data.candidates.clone(),
                }),
                changed_at: block_number,
            }
        });

        Ok(())
    }

    /// Elect new council after successful election.
    fn elect_new_council(elected_members: &[EzCandidate<T>]) {
        Self::finalize_election_period();

        CouncilMembers::<T>::mutate(|value| *value = elected_members.to_vec());
    }

    /// Change the council stage from the election to the idle stage.
    fn finalize_election_period() {
        let block_number = <system::Module<T>>::block_number();

        // change council state
        Stage::<T>::mutate(|value| {
            *value = CouncilStageInfo {
                stage: CouncilStage::Idle,
                changed_at: block_number,
            }
        });
    }

    /// Announce user's candidacy.
    fn candidate(
        stage_data: &EzCouncilStageAnnouncing<T>,
        candidate: &EzCandidate<T>,
        stake: &Balance<T>,
    ) {
        fn try_candidate_insert<T: Trait>(
            current_candidates: &[EzCandidate<T>],
            new_candidate: &EzCandidate<T>,
            stake: &Balance<T>,
        ) -> Vec<EzCandidate<T>> {
            let max_candidates =
                (T::CouncilSize::get() + T::MinNumberOfExtraCandidates::get()) as usize;
            let full_candidate_list = current_candidates.len() == max_candidates;

            let mut target: Option<usize> = None;
            for (i, c) in current_candidates.iter().enumerate() {
                if stake > &c.stake {
                    target = Some(i);
                    break;
                }
            }

            // TODO: consider notable simplifying the following match statement by always concatenating 3 parts list
            //       (seen in Some -> full_candidate_list branch) and cutting off any extra candidates from the end of list.
            match target {
                Some(target_index) => {
                    let tmp = [new_candidate.clone()];

                    // somebody has to slide out of candidacy list?
                    if full_candidate_list {
                        return [
                            &current_candidates[0..target_index],
                            &tmp[..],
                            &current_candidates[target_index..max_candidates - 1],
                        ]
                        .concat();
                    }

                    // insert candidate without anybody sliding from candidacy list
                    [
                        &current_candidates[0..target_index],
                        &tmp[..],
                        &current_candidates[target_index..max_candidates],
                    ]
                    .concat()
                }
                None => {
                    // stake not high enough to make it to the list?
                    if full_candidate_list {
                        return current_candidates.to_vec();
                    }

                    let tmp = [new_candidate.clone()];

                    // append candidate to the end of the list
                    [current_candidates, &tmp[..]].concat()
                }
            }
        }

        // prepare new stage
        let new_stage_data = CouncilStageAnnouncing {
            candidates: try_candidate_insert::<T>(
                stage_data.candidates.as_slice(),
                candidate,
                stake,
            ),
            //..*stage_data
        };

        // exit when no changes are necessary (candidate didn't make it to candidacy list)
        if new_stage_data.candidates == stage_data.candidates {
            return;
        }

        // lock candidacy stake
        EzCurrency::<T>::set_lock(
            <T as Trait>::LockId::get(),
            &candidate.account_id,
            *stake,
            WithdrawReason::Transfer.into(),
        );

        let block_number = <system::Module<T>>::block_number();

        // store new candidacy list
        Stage::<T>::mutate(|value| {
            *value = CouncilStageInfo {
                stage: CouncilStage::Announcing(new_stage_data),
                changed_at: block_number,
            }
        });
    }

    /// Release user's stake that was used for candidacy.
    fn release_candidacy_stake(account_id: &T::AccountId) {
        // release stake amount
        EzCurrency::<T>::remove_lock(<T as Trait>::LockId::get(), account_id);
    }
}

/////////////////// Ensure checks //////////////////////////////////////////////

struct EnsureChecks<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> EnsureChecks<T> {
    /////////////////// Common checks //////////////////////////////////////////

    fn ensure_regular_user(origin: T::Origin) -> Result<T::AccountId, Error<T>> {
        let account_id = ensure_signed(origin)?;

        Ok(account_id)
    }

    /////////////////// Action checks //////////////////////////////////////////

    fn can_candidate(
        origin: T::Origin,
        stake: &Balance<T>,
    ) -> Result<(EzCouncilStageAnnouncing<T>, EzCandidate<T>), Error<T>> {
        // ensure regular user requested action
        let account_id = Self::ensure_regular_user(origin)?;

        let stage_data = match Stage::<T>::get().stage {
            CouncilStage::Announcing(stage_data) => stage_data,
            _ => return Err(Error::CantCandidateNow),
        };

        if stake < &T::MinCandidateStake::get() {
            return Err(Error::CandidacyStakeTooLow);
        }

        let candidate = Candidate {
            account_id,
            stake: *stake,
        };

        Ok((stage_data, candidate))
    }

    fn can_reveal_vote(
        origin: T::Origin,
        vote_option_index: u64,
    ) -> Result<T::AccountId, Error<T>> {
        // ensure regular user requested action
        let account_id = Self::ensure_regular_user(origin)?;

        // eliminate candidate voting for himself
        if let CouncilStage::Election(stage_data) = Stage::<T>::get().stage {
            if vote_option_index < (stage_data.candidates.len() as u64)
                && stage_data.candidates[vote_option_index as usize].account_id == account_id
            {
                return Err(Error::CantVoteForYourself);
            }
        }

        Ok(account_id)
    }

    fn can_release_candidacy_stake(origin: T::Origin) -> Result<T::AccountId, Error<T>> {
        // ensure regular user requested action
        let account_id = Self::ensure_regular_user(origin)?;

        // ensure user is not current council member
        let members = CouncilMembers::<T>::get();
        let council_member = members.iter().find(|item| item.account_id == account_id);
        if council_member.is_some() {
            return Err(Error::StakeStillNeeded);
        }

        // get candidates if any
        let candidates = match Stage::<T>::get().stage {
            CouncilStage::Announcing(tmp_stage_data) => tmp_stage_data.candidates,
            CouncilStage::Election(tmp_stage_data) => tmp_stage_data.candidates,
            _ => return Ok(account_id),
        };

        // ensure user is not council candidate
        let candidate = candidates.iter().find(|item| item.account_id == account_id);
        if candidate.is_some() {
            return Err(Error::StakeStillNeeded);
        }

        Ok(account_id)
    }

    fn can_release_vote_stake(origin: T::Origin) -> Result<T::AccountId, Error<T>> {
        // ensure regular user requested action
        let account_id = Self::ensure_regular_user(origin)?;

        // ensure it's proper time to release stake
        match Stage::<T>::get().stage {
            CouncilStage::Idle => (),
            _ => return Err(Error::CantReleaseStakeNow),
        };

        Ok(account_id)
    }
}
