use frame_support::dispatch::{DispatchError, DispatchResult};
use system::RawOrigin;

use crate::tests::fixtures::{
    setup_members, AddOpeningFixture, ApplyOnOpeningFixture, FillOpeningFixture, HireLeadFixture,
};
use crate::tests::mock::TestWorkingTeam;
use crate::JobOpeningType;

#[derive(Clone)]
struct HiringWorkflowApplication {
    stake: Option<u64>,
    worker_handle: Vec<u8>,
    origin: RawOrigin<u64>,
    member_id: u64,
}

pub struct HiringWorkflow {
    opening_type: JobOpeningType,
    expected_result: DispatchResult,
    role_stake: Option<u64>,
    applications: Vec<HiringWorkflowApplication>,
    setup_environment: bool,
}

impl Default for HiringWorkflow {
    fn default() -> Self {
        Self {
            opening_type: JobOpeningType::Regular,
            expected_result: Ok(()),
            role_stake: None,
            applications: Vec::new(),
            setup_environment: true,
        }
    }
}

impl HiringWorkflow {
    pub fn expect(self, result: DispatchResult) -> Self {
        Self {
            expected_result: result,
            ..self
        }
    }

    pub fn with_setup_environment(self, setup_environment: bool) -> Self {
        Self {
            setup_environment,
            ..self
        }
    }

    pub fn with_opening_type(self, opening_type: JobOpeningType) -> Self {
        Self {
            opening_type,
            ..self
        }
    }

    pub fn add_default_application(self) -> Self {
        let worker_handle = b"default".to_vec();

        self.add_application(worker_handle)
    }

    pub fn add_application(self, worker_handle: Vec<u8>) -> Self {
        self.add_application_with_origin(worker_handle, RawOrigin::Signed(1), 1)
    }

    pub fn add_application_with_origin(
        self,
        worker_handle: Vec<u8>,
        origin: RawOrigin<u64>,
        member_id: u64,
    ) -> Self {
        let mut applications = self.applications;
        applications.push(HiringWorkflowApplication {
            worker_handle,
            stake: self.role_stake.clone(),
            origin,
            member_id,
        });

        Self {
            applications,
            ..self
        }
    }

    fn setup_environment(&self) {
        if matches!(self.opening_type, JobOpeningType::Regular) {
            HireLeadFixture::default().hire_lead();
        }
        setup_members(6);
    }

    pub fn execute(&self) -> Option<u64> {
        if self.setup_environment {
            self.setup_environment()
        }

        let result = self.fill_worker_position();

        let check_result = result.clone().map(|_| ());

        assert_eq!(check_result, self.expected_result);

        result.ok()
    }

    fn fill_worker_position(&self) -> Result<u64, DispatchError> {
        let origin = match self.opening_type {
            JobOpeningType::Leader => RawOrigin::Root,
            JobOpeningType::Regular => {
                let leader_worker_id = TestWorkingTeam::current_lead().unwrap();
                let leader = TestWorkingTeam::worker_by_id(leader_worker_id);
                let lead_account_id = leader.role_account_id;

                RawOrigin::Signed(lead_account_id)
            }
        };

        // create the opening
        let add_worker_opening_fixture = AddOpeningFixture::default()
            .with_opening_type(self.opening_type)
            .with_origin(origin.clone());

        let opening_id = add_worker_opening_fixture.call()?;

        // Fill applications.
        let mut application_ids = Vec::new();
        for application in self.applications.clone() {
            let apply_on_worker_opening_fixture =
                ApplyOnOpeningFixture::default_for_opening_id(opening_id)
                    .with_text(application.worker_handle)
                    .with_origin(application.origin, application.member_id);

            let application_id = apply_on_worker_opening_fixture.call()?;
            application_ids.push(application_id);
        }

        // fill opening
        let fill_opening_fixture = FillOpeningFixture::default_for_ids(opening_id, application_ids)
            .with_origin(origin.clone());

        let worker_id = fill_opening_fixture.call()?;

        Ok(worker_id)
    }
}
