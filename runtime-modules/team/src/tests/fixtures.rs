use frame_support::dispatch::{DispatchError, DispatchResult};
use sp_runtime::traits::Hash;
use system::{EventRecord, Phase, RawOrigin};

use super::mock::{System, Test, TestEvent, TestWorkingTeam, TestWorkingTeamInstance};
use crate::{JobOpening, JobOpeningType, RawEvent};

pub struct EventFixture;
impl EventFixture {
    pub fn assert_last_crate_event(expected_raw_event: RawEvent<u64, TestWorkingTeamInstance>) {
        let converted_event = TestEvent::working_team_TestWorkingTeamInstance(expected_raw_event);

        Self::assert_last_global_event(converted_event)
    }

    pub fn assert_last_global_event(expected_event: TestEvent) {
        let expected_event = EventRecord {
            phase: Phase::Initialization,
            event: expected_event,
            topics: vec![],
        };

        assert_eq!(System::events().pop().unwrap(), expected_event);
    }
}

pub struct AddJobOpeningFixture {
    origin: RawOrigin<u64>,
    //    activate_at: hiring::ActivateOpeningAt<u64>,
    //    commitment: OpeningPolicyCommitment<u64, u64>,
    human_readable_text: Vec<u8>,
    opening_type: JobOpeningType,
    starting_block: u64,
}

impl Default for AddJobOpeningFixture {
    fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(1),
            //            activate_at: hiring::ActivateOpeningAt::CurrentBlock,
            //            commitment: <OpeningPolicyCommitment<u64, u64>>::default(),
            human_readable_text: b"human_text".to_vec(),
            opening_type: JobOpeningType::Regular,
            starting_block: 0,
        }
    }
}

impl AddJobOpeningFixture {
    // pub fn with_policy_commitment(
    //     self,
    //     policy_commitment: OpeningPolicyCommitment<u64, u64>,
    // ) -> Self {
    //     Self {
    //         commitment: policy_commitment,
    //         ..self
    //     }
    // }

    pub fn call_and_assert(&self, expected_result: DispatchResult) -> u64 {
        let saved_opening_next_id = TestWorkingTeam::next_opening_id();
        let actual_result = self.call().map(|_| ());

        assert_eq!(actual_result.clone(), expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                TestWorkingTeam::next_opening_id(),
                saved_opening_next_id + 1
            );
            let opening_id = saved_opening_next_id;

            let actual_opening = TestWorkingTeam::opening_by_id(opening_id);

            let expected_hash = <Test as system::Trait>::Hashing::hash(&self.human_readable_text);
            let expected_opening = JobOpening::<u64> {
                //                hiring_opening_id: opening_id,
                //                applications: BTreeSet::new(),
                //                policy_commitment: self.commitment.clone(),
                created: self.starting_block,
                description_hash: expected_hash.as_ref().to_vec(),
                is_active: true,
                opening_type: self.opening_type,
            };

            assert_eq!(actual_opening, expected_opening);
        }

        saved_opening_next_id
    }

    pub fn call(&self) -> Result<u64, DispatchError> {
        let saved_opening_next_id = TestWorkingTeam::next_opening_id();
        TestWorkingTeam::add_opening(
            self.origin.clone().into(),
            //           self.activate_at.clone(),
            //           self.commitment.clone(),
            self.human_readable_text.clone(),
            self.opening_type,
        )?;

        Ok(saved_opening_next_id)
    }

    pub fn with_text(self, text: Vec<u8>) -> Self {
        Self {
            human_readable_text: text,
            ..self
        }
    }

    pub fn with_opening_type(self, opening_type: JobOpeningType) -> Self {
        Self {
            opening_type,
            ..self
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_starting_block(self, starting_block: u64) -> Self {
        Self {
            starting_block,
            ..self
        }
    }

    // pub fn with_activate_at(self, activate_at: hiring::ActivateOpeningAt<u64>) -> Self {
    //     Self {
    //         activate_at,
    //         ..self
    //     }
    // }
}
