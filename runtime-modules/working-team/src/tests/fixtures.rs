use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::StorageMap;
use sp_runtime::traits::Hash;
use sp_std::collections::{btree_map::BTreeMap, btree_set::BTreeSet};
use system::{EventRecord, Phase, RawOrigin};

use super::mock::{Membership, System, Test, TestEvent, TestWorkingTeam, TestWorkingTeamInstance};
use crate::{JobApplication, JobOpening, JobOpeningType, RawEvent, TeamWorker};

pub struct EventFixture;
impl EventFixture {
    pub fn assert_last_crate_event(
        expected_raw_event: RawEvent<u64, u64, BTreeMap<u64, u64>, TestWorkingTeamInstance>,
    ) {
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
    description: Vec<u8>,
    opening_type: JobOpeningType,
    starting_block: u64,
}

impl Default for AddJobOpeningFixture {
    fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(1),
            //            activate_at: hiring::ActivateOpeningAt::CurrentBlock,
            //            commitment: <OpeningPolicyCommitment<u64, u64>>::default(),
            description: b"human_text".to_vec(),
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

            let expected_hash = <Test as system::Trait>::Hashing::hash(&self.description);
            let expected_opening = JobOpening {
                applications: BTreeSet::new(),
                //                policy_commitment: self.commitment.clone(),
                created: self.starting_block,
                description_hash: expected_hash.as_ref().to_vec(),
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
            self.description.clone(),
            self.opening_type,
        )?;

        Ok(saved_opening_next_id)
    }

    pub fn with_text(self, text: Vec<u8>) -> Self {
        Self {
            description: text,
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
}

pub struct ApplyOnOpeningFixture {
    origin: RawOrigin<u64>,
    member_id: u64,
    opening_id: u64,
    role_account_id: u64,
    // opt_role_stake_balance: Option<u64>,
    // opt_application_stake_balance: Option<u64>,
    description: Vec<u8>,
}

impl ApplyOnOpeningFixture {
    pub fn with_text(self, text: Vec<u8>) -> Self {
        Self {
            description: text,
            ..self
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>, member_id: u64) -> Self {
        Self {
            origin,
            member_id,
            ..self
        }
    }

    // pub fn with_role_stake(self, stake: Option<u64>) -> Self {
    //     Self {
    //         opt_role_stake_balance: stake,
    //         ..self
    //     }
    // }
    //
    // pub fn with_application_stake(self, stake: u64) -> Self {
    //     Self {
    //         opt_application_stake_balance: Some(stake),
    //         ..self
    //     }
    // }

    pub fn default_for_opening_id(opening_id: u64) -> Self {
        Self {
            origin: RawOrigin::Signed(1),
            member_id: 1,
            opening_id,
            role_account_id: 1,
            // opt_role_stake_balance: None,
            // opt_application_stake_balance: None,
            description: b"human_text".to_vec(),
        }
    }

    pub fn call(&self) -> Result<u64, DispatchError> {
        let saved_application_next_id = TestWorkingTeam::next_application_id();
        TestWorkingTeam::apply_on_opening(
            self.origin.clone().into(),
            self.member_id,
            self.opening_id,
            self.role_account_id,
            // self.opt_role_stake_balance,
            // self.opt_application_stake_balance,
            self.description.clone(),
        )?;

        Ok(saved_application_next_id)
    }
    pub fn call_and_assert(&self, expected_result: DispatchResult) -> u64 {
        let saved_application_next_id = TestWorkingTeam::next_application_id();

        let actual_result = self.call().map(|_| ());
        assert_eq!(actual_result.clone(), expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                TestWorkingTeam::next_application_id(),
                saved_application_next_id + 1
            );
            let application_id = saved_application_next_id;

            let actual_application = TestWorkingTeam::application_by_id(application_id);

            let expected_hash = <Test as system::Trait>::Hashing::hash(&self.description);
            let expected_application = JobApplication::<Test, TestWorkingTeamInstance> {
                role_account_id: self.role_account_id,
                opening_id: self.opening_id,
                member_id: self.member_id,
                description_hash: expected_hash.as_ref().to_vec(),
            };

            assert_eq!(actual_application, expected_application);

            let current_opening = TestWorkingTeam::opening_by_id(self.opening_id);
            assert!(current_opening.applications.contains(&application_id));
        }

        saved_application_next_id
    }
}

pub fn setup_members(count: u8) {
    let authority_account_id = 1;
    Membership::set_screening_authority(RawOrigin::Root.into(), authority_account_id).unwrap();

    for i in 0..count {
        let account_id: u64 = i as u64;
        let handle: [u8; 20] = [i; 20];
        Membership::add_screened_member(
            RawOrigin::Signed(authority_account_id).into(),
            account_id,
            Some(handle.to_vec()),
            None,
            None,
        )
        .unwrap();
    }
}

pub struct FillOpeningFixture {
    origin: RawOrigin<u64>,
    opening_id: u64,
    successful_application_ids: BTreeSet<u64>,
    role_account_id: u64,
}

impl FillOpeningFixture {
    pub fn default_for_ids(opening_id: u64, application_ids: Vec<u64>) -> Self {
        let application_ids: BTreeSet<u64> = application_ids.iter().map(|x| *x).collect();

        Self {
            origin: RawOrigin::Signed(1),
            opening_id,
            successful_application_ids: application_ids,
            role_account_id: 1,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn call(&self) -> Result<u64, DispatchError> {
        let saved_worker_next_id = TestWorkingTeam::next_worker_id();
        TestWorkingTeam::fill_opening(
            self.origin.clone().into(),
            self.opening_id,
            self.successful_application_ids.clone(),
        )?;

        Ok(saved_worker_next_id)
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) -> u64 {
        let saved_worker_count = TestWorkingTeam::active_worker_count();
        let saved_worker_next_id = TestWorkingTeam::next_worker_id();
        let actual_result = self.call().map(|_| ());
        assert_eq!(actual_result.clone(), expected_result);

        if actual_result.is_ok() {
            assert_eq!(TestWorkingTeam::next_worker_id(), saved_worker_next_id + 1);
            let worker_id = saved_worker_next_id;

            assert!(
                !<crate::OpeningById<Test, TestWorkingTeamInstance>>::contains_key(self.opening_id)
            );

            for application_id in self.successful_application_ids.iter() {
                assert!(
                    !<crate::ApplicationById<Test, TestWorkingTeamInstance>>::contains_key(
                        application_id
                    )
                );
            }
            //let _opening = TestWorkingTeam::opening_by_id(self.opening_id);

            // let role_stake_profile = if opening
            //     .policy_commitment
            //     .application_staking_policy
            //     .is_some()
            //     || opening.policy_commitment.role_staking_policy.is_some()
            // {
            //     let stake_id = 0;
            //     Some(RoleStakeProfile::new(
            //         &stake_id,
            //         &opening
            //             .policy_commitment
            //             .terminate_role_stake_unstaking_period,
            //         &opening.policy_commitment.exit_role_stake_unstaking_period,
            //     ))
            // } else {
            //     None
            // };
            // let reward_relationship = self.reward_policy.clone().map(|_| 0);

            let expected_worker = TeamWorker::<Test> {
                member_id: 1,
                role_account_id: self.role_account_id,
            };

            let actual_worker = TestWorkingTeam::worker_by_id(worker_id);

            assert_eq!(actual_worker, expected_worker);

            let expected_worker_count =
                saved_worker_count + (self.successful_application_ids.len() as u32);

            assert_eq!(
                TestWorkingTeam::active_worker_count(),
                expected_worker_count
            );
        }

        saved_worker_next_id
    }
}
