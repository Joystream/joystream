// TODO: module documentation
// TODO: adjust all extrinsic weights

/////////////////// Configuration //////////////////////////////////////////////
#![cfg_attr(not(feature = "std"), no_std)]

// used dependencies
use codec::{Codec, Decode, Encode};
use frame_support::traits::{Currency, Get, LockIdentifier, LockableCurrency, WithdrawReason};
use frame_support::{
    decl_error, decl_event, decl_module, decl_storage, error::BadOrigin, Parameter,
};
use sp_arithmetic::traits::{BaseArithmetic, One};
use sp_runtime::traits::{MaybeSerialize, Member};

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use std::marker::PhantomData;
use system::{ensure_signed, RawOrigin};

use referendum::Instance as ReferendumInstanceGeneric;
use referendum::ReferendumManager;
use referendum::Trait as ReferendumTrait;

// declared modules
mod mock;
mod tests;

/////////////////// Data Structures ////////////////////////////////////////////

#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct CouncilStageInfo<AccountId, Currency, BlockNumber> {
    stage: CouncilStage<AccountId, Currency>,
    changed_at: BlockNumber,
}

#[derive(Encode, Decode, PartialEq, Eq, Debug)]
pub enum CouncilStage<AccountId, Balance> {
    Void, // init state - behaves the same way as IdlePeriod but can be immediately changed to `Election`
    Announcing(CouncilStageAnnouncing<AccountId, Balance>), // candidacy announcment period
    Election(CouncilStageElection<AccountId, Balance>),
    Idle,
}

impl<AccountId, Balance> Default for CouncilStage<AccountId, Balance> {
    fn default() -> CouncilStage<AccountId, Balance> {
        CouncilStage::<AccountId, Balance>::Void
    }
}

#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct CouncilStageAnnouncing<AccountId, Balance> {
    candidates: Vec<Candidate<AccountId, Balance>>,
}

#[derive(Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct CouncilStageElection<AccountId, Balance> {
    candidates: Vec<Candidate<AccountId, Balance>>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default, Clone)]
pub struct Candidate<AccountId, Balance> {
    account_id: AccountId,
    stake: Balance,
}

/////////////////// Type aliases ///////////////////////////////////////////////

// Alias for referendum's storage.
pub(crate) type Referendum<T> = referendum::Module<T, ReferendumInstance>;

pub type Balance<T> = <<T as referendum::Trait<ReferendumInstance>>::Currency as Currency<
    <T as system::Trait>::AccountId,
>>::Balance;

pub type EzCandidate<T> = Candidate<<T as system::Trait>::AccountId, Balance<T>>;
pub type EzCouncilStageAnnouncing<T> = CouncilStageAnnouncing<<T as system::Trait>::AccountId, Balance<T>>;
pub type EzCouncilStageElection<T> = CouncilStageElection<<T as system::Trait>::AccountId, Balance<T>>;

/////////////////// Trait, Storage, Errors, and Events /////////////////////////

// TODO: look for ways to check that selected instance is only used in this module to prevent unexpected behaviour
// The storage alias for referendum instance.
pub(crate) type ReferendumInstance = referendum::Instance0;

pub trait Trait: system::Trait + referendum::Trait<ReferendumInstance> {
    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    /// Minimum number of candidates needed to conclude announcing period
    type MinNumberOfCandidates: Get<u64>;
    /// Council member count
    type CouncilSize: Get<u64>;
    /// Minimum stake candidate has to lock
    type MinCandidateStake: Get<Balance::<Self>>;

    /// Identifier for currency locks used for staking.
    type LockId: Get<LockIdentifier>;

    /// Duration of annoncing period
    type AnnouncingPeriodDuration: Get<Self::BlockNumber>;
    /// Duration of idle period
    type IdlePeriodDuration: Get<Self::BlockNumber>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Referendum {
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
    }
}

impl<T: Trait, RT: ReferendumTrait<I>, I: ReferendumInstanceGeneric> From<referendum::Error<RT, I>>
    for Error<T>
{
    fn from(other: referendum::Error<RT, I>) -> Error<T> {
        panic!(format!("{:?}", other)); // temporary debug
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

        /*
        // TODO reconsider this function. It is meant as temporary solution for recieving referendum results
        #[weight = 10_000_000]
        pub fn recieve_referendum_winners(origin, winners: &ReferendumResult<u64, Self::VotePower>, all_options_results: &[Self::VotePower]) -> Result<(), Error<T>> {
            ensure_root(origin)?;


            let stage_data = match Stage::<T>::get().stage {
                CouncilStage::Election(stage_data) => stage_data,
                _ => return Err(Error::BadOrigin), // TODO: if this part of code stay, create new proper error for this situation
            };

            Self::end_election_period(stage_data, );
        }
        */
        #[weight = 10_000_000]
        pub fn release_candidacy_stake(origin) -> Result<(), Error<T>> {
            let account_id = EnsureChecks::<T>::can_release_candidacy_stake(origin.clone())?;

            // update state
            Mutations::<T>::release_candidacy_stake(&account_id);

            Ok(())
        }

        /////////////////// Referendum Wrap ////////////////////////////////////
        // start voting period
        #[weight = 10_000_000]
        pub fn vote(origin, commitment: T::Hash, balance: Balance<T>) -> Result<(), Error<T>> {
            // call referendum vote extrinsic
            <Referendum<T>>::vote(origin, commitment, balance)?;

            Ok(())
        }

        #[weight = 10_000_000]
        pub fn reveal_vote(origin, salt: Vec<u8>, vote_option_index: u64) -> Result<(), Error<T>> {
            // call referendum reveal vote extrinsic
            <Referendum<T>>::reveal_vote(origin, salt, vote_option_index)?;

            Ok(())
        }

        #[weight = 10_000_000]
        pub fn release_vote_stake(origin) -> Result<(), Error<T>> {
            EnsureChecks::<T>::can_release_vote_stake(origin.clone())?;

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
            },
            CouncilStage::Idle => {
                if now == Stage::<T>::get().changed_at + T::IdlePeriodDuration::get() {
                    Self::end_idle_period();
                }
            },
            _ => (),
        }
    }

    /// Finish voting and start ravealing.
    fn end_announcement_period(stage_data: EzCouncilStageAnnouncing<T>) {
        // prolong announcing period when not enough candidates registered
        if (stage_data.candidates.len() as u64) < T::MinNumberOfCandidates::get() {
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

    // TODO: invoke this somehow
    fn end_election_period(_stage_data: EzCouncilStageElection<T>, elected_members: Vec<EzCandidate<T>>) {
        //let elected_members = vec![]; // TODO

        // update state
        Mutations::<T>::finalize_election_period(&elected_members);

        // emit event
        Self::deposit_event(RawEvent::NewCouncilElected(elected_members));
    }

    fn end_idle_period() {
        // update state
        Mutations::<T>::start_announcing_period();

        // emit event
        Self::deposit_event(RawEvent::AnnouncingPeriodStarted());
    }
}

/////////////////// Mutations //////////////////////////////////////////////////

struct Mutations<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> Mutations<T> {

    fn start_announcing_period() {
        let stage_data = EzCouncilStageAnnouncing::<T> {
            candidates: vec![],
        };

        Self::prolong_announcing_period(stage_data);
    }

    fn prolong_announcing_period(stage_data: EzCouncilStageAnnouncing<T>) {
        let block_number = <system::Module<T>>::block_number();

        Stage::<T>::mutate(|value| {
            *value = CouncilStageInfo {
                stage: CouncilStage::Announcing(stage_data),
                changed_at: block_number,
            }
        });
    }

    fn finalize_announcing_period(stage_data: &EzCouncilStageAnnouncing<T>) -> Result<(), Error<T>> {
        let extra_options_count = stage_data.candidates.len() as u64 - 1;
        let origin = RawOrigin::Root;

        // IMPORTANT - because starting referendum can fail it has to be the first mutation!
        <Referendum<T> as ReferendumManager<T, ReferendumInstance>>::start_referendum(
            origin.into(),
            extra_options_count,
        )?;

        let block_number = <system::Module<T>>::block_number();

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

    fn finalize_election_period(elected_members: &Vec<EzCandidate<T>>) -> () {
        let block_number = <system::Module<T>>::block_number();

        Stage::<T>::mutate(|value| {
            *value = CouncilStageInfo {
                stage: CouncilStage::Idle,
                changed_at: block_number,
            }
        });

        CouncilMembers::<T>::mutate(|value| *value = elected_members.clone());
    }

    fn candidate(
        stage_data: &EzCouncilStageAnnouncing<T>,
        candidate: &EzCandidate<T>,
        stake: &Balance<T>,
    ) -> () {
        fn try_candidate_insert<T: Trait>(
            current_candidates: &[EzCandidate<T>],
            new_candidate: &EzCandidate<T>,
            stake: &Balance<T>,
        ) -> Vec<EzCandidate<T>> {
            let council_size = T::CouncilSize::get() as usize;
            let full_candadite_list = current_candidates.len() == council_size;

            let mut target: Option<usize> = None;
            for (i, c) in current_candidates.iter().enumerate() {
                if stake > &c.stake {
                    target = Some(i);
                    break;
                }
            }

            match target {
                Some(target_index) => {
                    let tmp = [new_candidate.clone()];

                    // somebody has to slide out of candidacy list?
                    if full_candadite_list {
                        return [
                            &current_candidates[0..target_index],
                            &tmp[..],
                            &current_candidates[target_index..council_size - 1],
                        ]
                        .concat();
                    }

                    // insert candidate without anybody sliding from candidacy list
                    [
                        &current_candidates[0..target_index],
                        &tmp[..],
                        &current_candidates[target_index..council_size],
                    ]
                    .concat()
                }
                None => {
                    // stake not high enough to make it to the list?
                    if full_candadite_list {
                        return current_candidates.to_vec();
                    }

                    let tmp = [new_candidate.clone()];

                    // append candidate to the end of the list
                    [current_candidates, &tmp[..]].concat()
                }
            }
        }

        let new_stage_data = CouncilStageAnnouncing {
            candidates: try_candidate_insert::<T>(
                stage_data.candidates.as_slice(),
                candidate,
                stake,
            ),
            ..*stage_data
        };

        // exit when no changes are necessary
        if new_stage_data.candidates == stage_data.candidates {
            return;
        }

        // lock stake
        T::Currency::set_lock(
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

    fn release_candidacy_stake(account_id: &T::AccountId) {
        // release stake amount
        T::Currency::remove_lock(<T as Trait>::LockId::get(), account_id);
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
            return Err(Error::CandidacyStakeTooLow)
        }

        let candidate = Candidate {
            account_id,
            stake: *stake
        };

        Ok((stage_data, candidate))
    }

    fn can_release_candidacy_stake(origin: T::Origin) -> Result<T::AccountId, Error<T>> {
        // ensure regular user requested action
        let account_id = Self::ensure_regular_user(origin)?;

        // ensure user is not current council member
        let members = CouncilMembers::<T>::get();
        let council_member = members
           .iter()
           .find(|item| item.account_id == account_id);
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
        let candidate = candidates
           .iter()
           .find(|item| item.account_id == account_id);
        if candidate.is_some() {
            return Err(Error::StakeStillNeeded);
        }

        Ok(account_id)
    }

    fn can_release_vote_stake(origin: T::Origin) -> Result<T::AccountId, Error<T>> {
        // ensure regular user requested action
        let account_id = Self::ensure_regular_user(origin)?;

        match Stage::<T>::get().stage {
            CouncilStage::Idle => (),
            _ => return Err(Error::CantReleaseStakeNow),
        };

        Ok(account_id)
    }
}
