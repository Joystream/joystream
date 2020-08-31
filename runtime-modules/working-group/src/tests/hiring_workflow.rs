use frame_support::dispatch::{DispatchError, DispatchResult};
use system::RawOrigin;

use crate::tests::fixtures::{
    create_mint, increase_total_balance_issuance_using_account_id, set_mint_id, setup_members,
    AddWorkerOpeningFixture, ApplyOnWorkerOpeningFixture, BeginReviewWorkerApplicationsFixture,
    FillWorkerOpeningFixture, SetLeadFixture,
};
use crate::tests::mock::TestWorkingGroup;
use crate::{OpeningPolicyCommitment, OpeningType, RewardPolicy};

#[derive(Clone)]
struct HiringWorkflowApplication {
    stake: Option<u64>,
    worker_handle: Vec<u8>,
    origin: RawOrigin<u64>,
    member_id: u64,
}

pub struct HiringWorkflow {
    opening_type: OpeningType,
    expected_result: DispatchResult,
    role_stake: Option<u64>,
    applications: Vec<HiringWorkflowApplication>,
    setup_environment: bool,
    reward_policy: Option<RewardPolicy<u64, u64>>,
}

impl Default for HiringWorkflow {
    fn default() -> Self {
        Self {
            opening_type: OpeningType::Worker,
            expected_result: Ok(()),
            role_stake: None,
            applications: Vec::new(),
            setup_environment: true,
            reward_policy: None,
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

    pub fn disable_setup_environment(self) -> Self {
        Self {
            setup_environment: false,
            ..self
        }
    }

    pub fn with_setup_environment(self, setup_environment: bool) -> Self {
        Self {
            setup_environment,
            ..self
        }
    }

    pub fn with_opening_type(self, opening_type: OpeningType) -> Self {
        Self {
            opening_type,
            ..self
        }
    }

    pub fn with_role_stake(self, role_stake: Option<u64>) -> Self {
        Self { role_stake, ..self }
    }

    pub fn with_reward_policy(self, reward_policy: Option<RewardPolicy<u64, u64>>) -> Self {
        Self {
            reward_policy,
            ..self
        }
    }

    pub fn add_default_application(self) -> Self {
        let worker_handle = b"default worker handle".to_vec();

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
        if matches!(self.opening_type, OpeningType::Worker) {
            SetLeadFixture::default().set_lead();
        }
        increase_total_balance_issuance_using_account_id(1, 10000);
        setup_members(4);
        set_mint_id(create_mint());
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
            OpeningType::Leader => RawOrigin::Root,
            OpeningType::Worker => {
                let leader_worker_id = TestWorkingGroup::current_lead().unwrap();
                let leader = TestWorkingGroup::worker_by_id(leader_worker_id);
                let lead_account_id = leader.role_account_id;

                RawOrigin::Signed(lead_account_id)
            }
        };

        // create the opening
        let mut add_worker_opening_fixture = AddWorkerOpeningFixture::default()
            .with_opening_type(self.opening_type)
            .with_origin(origin.clone());

        if let Some(stake) = self.role_stake.clone() {
            add_worker_opening_fixture =
                add_worker_opening_fixture.with_policy_commitment(OpeningPolicyCommitment {
                    role_staking_policy: Some(hiring::StakingPolicy {
                        amount: stake,
                        amount_mode: hiring::StakingAmountLimitMode::AtLeast,
                        crowded_out_unstaking_period_length: None,
                        review_period_expired_unstaking_period_length: None,
                    }),
                    ..OpeningPolicyCommitment::default()
                });
        }

        let opening_id = add_worker_opening_fixture.call()?;

        // Fill applications.
        let mut application_ids = Vec::new();
        for application in self.applications.clone() {
            let apply_on_worker_opening_fixture =
                ApplyOnWorkerOpeningFixture::default_for_opening_id(opening_id)
                    .with_text(application.worker_handle)
                    .with_origin(application.origin, application.member_id)
                    .with_role_stake(self.role_stake);

            let application_id = apply_on_worker_opening_fixture.call()?;
            application_ids.push(application_id);
        }

        // begin application review

        let begin_review_worker_applications_fixture =
            BeginReviewWorkerApplicationsFixture::default_for_opening_id(opening_id)
                .with_origin(origin.clone());
        begin_review_worker_applications_fixture.call_and_assert(Ok(()));

        // fill opening
        let mut fill_worker_opening_fixture =
            FillWorkerOpeningFixture::default_for_ids(opening_id, application_ids)
                .with_origin(origin.clone());

        if let Some(reward_policy) = self.reward_policy.clone() {
            fill_worker_opening_fixture =
                fill_worker_opening_fixture.with_reward_policy(reward_policy);
        }

        let worker_id = fill_worker_opening_fixture.call()?;

        Ok(worker_id)
    }
}
