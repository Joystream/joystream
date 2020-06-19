use crate::tests::fixtures::{
    create_mint, increase_total_balance_issuance_using_account_id, set_mint_id, setup_members,
    AddWorkerOpeningFixture, ApplyOnWorkerOpeningFixture, BeginReviewWorkerApplicationsFixture,
    FillWorkerOpeningFixture, SetLeadFixture,
};
use crate::Error;
use crate::{OpeningPolicyCommitment, OpeningType, RewardPolicy};
use system::RawOrigin;

#[derive(Clone)]
struct HiringWorkflowApplication {
    stake: Option<u64>,
    worker_handle: Vec<u8>,
}

pub struct HiringWorkflow {
    opening_type: OpeningType,
    expected_result: Result<(), Error>,
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
        .add_default_application()
    }
}

impl HiringWorkflow {
    fn expect(self, result: Result<(), Error>) -> Self {
        Self {
            expected_result: result,
            ..self
        }
    }

    fn disable_setup_environment(self) -> Self {
        Self {
            setup_environment: false,
            ..self
        }
    }

    fn with_role_stake(self, role_stake: u64) -> Self {
        Self {
            role_stake: Some(role_stake),
            ..self
        }
    }

    fn with_reward_policy(self, reward_policy: RewardPolicy<u64, u64>) -> Self {
        Self {
            reward_policy: Some(reward_policy),
            ..self
        }
    }

    pub fn add_default_application(self) -> Self {
        let worker_handle = b"default worker handle".to_vec();

        let mut applications = self.applications;
        applications.push(HiringWorkflowApplication {
            worker_handle,
            stake: self.role_stake.clone(),
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
        setup_members(2);
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

    fn fill_worker_position(
        &self,

    ) -> Result<u64, Error> {
        let lead_account_id = 1;

        let origin = match self.opening_type {
            OpeningType::Leader => RawOrigin::Root,
            OpeningType::Worker => RawOrigin::Signed(lead_account_id),
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

        // fill applications
        let mut application_ids = Vec::new();
        for application in self.applications.clone(){
            let mut apply_on_worker_opening_fixture = ApplyOnWorkerOpeningFixture::default_for_opening_id(opening_id).with_text(application.worker_handle);
            if let Some(stake) = self.role_stake.clone() {
                apply_on_worker_opening_fixture = apply_on_worker_opening_fixture.with_role_stake(stake);
            }

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

        let worker_id = fill_worker_opening_fixture.call_and_assert(Ok(()));

        Ok(worker_id)
    }
}
