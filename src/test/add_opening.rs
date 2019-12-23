#![cfg(test)]

use super::*;
use crate::mock::*;
use crate::StakingAmountLimitMode::Exact;
use rstd::collections::btree_set::BTreeSet;

static FIRST_BLOCK_HEIGHT: <Test as system::Trait>::BlockNumber = 1;
static OPENING_HUMAN_READABLE_TEXT: &[u8] = b"OPENING_HUMAN_READABLE_TEXT!!!!";

/*
Not covered:
- ApplicationRationingPolicy (no ensures yet in add_opening)
*/

struct AddOpeningFixture<Balance> {
    activate_at: ActivateOpeningAt<u64>,
    max_review_period_length: u64,
    application_rationing_policy: Option<ApplicationRationingPolicy>,
    application_staking_policy: Option<StakingPolicy<Balance, u64>>,
    role_staking_policy: Option<StakingPolicy<Balance, u64>>,
    human_readable_text: Vec<u8>,
}

impl<Balance> Default for AddOpeningFixture<Balance> {
    fn default() -> Self {
        AddOpeningFixture {
            activate_at: ActivateOpeningAt::CurrentBlock,
            max_review_period_length: 672,
            application_rationing_policy: None,
            application_staking_policy: None,
            role_staking_policy: None,
            human_readable_text: OPENING_HUMAN_READABLE_TEXT.to_vec(),
        }
    }
}

impl AddOpeningFixture<u64> {
    pub fn call_and_assert(&self, expected_result: Result<u64, AddOpeningError>) {
        let expected_opening_id = Hiring::next_opening_id();

        let add_opening_result = Hiring::add_opening(
            self.activate_at.clone(),
            self.max_review_period_length,
            self.application_rationing_policy.clone(),
            self.application_staking_policy.clone(),
            self.role_staking_policy.clone(),
            self.human_readable_text.clone(),
        );
        assert_eq!(add_opening_result, expected_result);

        if add_opening_result.is_ok() {
            // Check next opening id has been updated
            assert_eq!(Hiring::next_opening_id(), expected_opening_id + 1);
            // Check opening exists
            assert!(<OpeningById<Test>>::exists(expected_opening_id));
        } else {
            // Check next opening id has not been updated
            assert_eq!(Hiring::next_opening_id(), expected_opening_id);
            // Check opening does not exist
            assert!(!<OpeningById<Test>>::exists(expected_opening_id));
        };

        //Check opening content
        if add_opening_result.is_ok() {
            let found_opening = Hiring::opening_by_id(expected_opening_id);

            assert_eq!(
                found_opening,
                Opening {
                    created: FIRST_BLOCK_HEIGHT,
                    stage: OpeningStage::Active {
                        stage: ActiveOpeningStage::AcceptingApplications {
                            started_accepting_applicants_at_block: FIRST_BLOCK_HEIGHT
                        },
                        applications_added: BTreeSet::new(),
                        active_application_count: 0,
                        unstaking_application_count: 0,
                        deactivated_application_count: 0
                    },
                    max_review_period_length: self.max_review_period_length,
                    application_rationing_policy: self.application_rationing_policy.clone(),
                    application_staking_policy: self.application_staking_policy.clone(),
                    role_staking_policy: self.role_staking_policy.clone(),
                    human_readable_text: OPENING_HUMAN_READABLE_TEXT.to_vec()
                }
            );
        }
    }
}

#[test]
fn add_opening_success_waiting_to_begin() {
    build_test_externalities().execute_with(|| {
        let opening_data = AddOpeningFixture::default();

        let expected_opening_id = 0;

        // Add an opening, check that the returned value is Zero
        opening_data.call_and_assert(Ok(expected_opening_id));
    });
}

#[test]
fn add_opening_fails_due_to_activation_in_the_past() {
    build_test_externalities().execute_with(|| {
        let mut opening_data = AddOpeningFixture::default();
        opening_data.activate_at = ActivateOpeningAt::ExactBlock(0);

        opening_data.call_and_assert(Err(AddOpeningError::OpeningMustActivateInTheFuture));
    });
}

#[test]
fn add_opening_succeeds_or_fails_due_to_application_staking_policy() {
    build_test_externalities().execute_with(|| {
        let mut opening_data = AddOpeningFixture::default();
        //Valid stake amount
        opening_data.application_staking_policy = Some(StakingPolicy {
            amount: 300,
            amount_mode: Exact,
            crowded_out_unstaking_period_length: None,
            review_period_expired_unstaking_period_length: None,
        });

        opening_data.call_and_assert(Ok(0));

        //Invalid stake amount
        opening_data.application_staking_policy = Some(StakingPolicy {
            amount: 1,
            amount_mode: Exact,
            crowded_out_unstaking_period_length: None,
            review_period_expired_unstaking_period_length: None,
        });

        opening_data.call_and_assert(Err(
            AddOpeningError::StakeAmountLessThanMinimumCurrencyBalance(StakePurpose::Application),
        ));
    });
}

#[test]
fn add_opening_succeeds_or_fails_due_to_role_staking_policy() {
    build_test_externalities().execute_with(|| {
        let mut opening_data = AddOpeningFixture::default();
        //Valid stake amount
        opening_data.role_staking_policy = Some(StakingPolicy {
            amount: 100,
            amount_mode: Exact,
            crowded_out_unstaking_period_length: None,
            review_period_expired_unstaking_period_length: None,
        });

        opening_data.call_and_assert(Ok(0));

        //Invalid stake amount
        opening_data.role_staking_policy = Some(StakingPolicy {
            amount: 1,
            amount_mode: Exact,
            crowded_out_unstaking_period_length: None,
            review_period_expired_unstaking_period_length: None,
        });

        opening_data.call_and_assert(Err(
            AddOpeningError::StakeAmountLessThanMinimumCurrencyBalance(StakePurpose::Role),
        ));
    });
}
