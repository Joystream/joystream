use super::*;
use crate::mock::*;

use add_application::AddApplicationFixture;
use add_opening::AddOpeningFixture;

/*
Not covered:
- ApplicationDeactivatedHandler

- staking state checks:
i.application.active_role_staking_id;
ii.application.active_application_staking_id;
*/

pub struct CancelOpeningFixture {
    pub opening_id: u64,
    pub application_stake_unstaking_period: Option<u64>,
    pub role_stake_unstaking_period: Option<u64>,
}

impl CancelOpeningFixture {
    pub(crate) fn default_for_opening(opening_id: u64) -> Self {
        CancelOpeningFixture {
            opening_id,
            application_stake_unstaking_period: None,
            role_stake_unstaking_period: None,
        }
    }

    fn call_and_assert(&self, expected_result: Result<OpeningCancelled, CancelOpeningError>) {
        //		let old_opening = <OpeningById<Test>>::get(self.opening_id);
        //		let old_application = <ApplicationById<Test>>::get(self.application_id);

        let unstaked_result = self.cancel_opening();

        assert_eq!(unstaked_result, expected_result);

        //		self.assert_application_content(old_application.clone(), unstaked_result);
        //
        //		self.assert_opening_content(old_opening, unstaked_result);
    }

    pub(crate) fn cancel_opening(&self) -> Result<OpeningCancelled, CancelOpeningError> {
        Hiring::cancel_opening(
            self.opening_id,
            self.application_stake_unstaking_period,
            self.role_stake_unstaking_period,
        )
    }
}

#[test]
fn cancel_opening_fails_due_to_opening_not_existing() {
    build_test_externalities().execute_with(|| {
        let cancel_opening_fixture = CancelOpeningFixture::default_for_opening(0);
        cancel_opening_fixture.call_and_assert(Err(CancelOpeningError::OpeningDoesNotExist));
    });
}

#[test]
fn cancel_opening_succeeds() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let cancel_opening_fixture = CancelOpeningFixture::default_for_opening(opening_id);
        cancel_opening_fixture.call_and_assert(Ok(OpeningCancelled {
            number_of_unstaking_applications: 0,
            number_of_deactivated_applications: 0,
        }));
    });
}

#[test]
fn cancel_opening_fails_due_to_opening_is_not_active() {
    build_test_externalities().execute_with(|| {
        let mut opening_fixture = AddOpeningFixture::default();
        opening_fixture.activate_at = ActivateOpeningAt::ExactBlock(5);

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let cancel_opening_fixture = CancelOpeningFixture::default_for_opening(opening_id);
        cancel_opening_fixture
            .call_and_assert(Err(CancelOpeningError::OpeningNotInCancellableStage));
    });
}

#[test]
fn cancel_opening_fails_due_to_opening_not_in_cancellable_stage() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let cancel_opening_fixture = CancelOpeningFixture::default_for_opening(opening_id);
        assert!(cancel_opening_fixture.cancel_opening().is_ok());
        cancel_opening_fixture
            .call_and_assert(Err(CancelOpeningError::OpeningNotInCancellableStage));
    });
}

#[test]
fn cancel_opening_fails_due_to_redundant_application_unstaking_period() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let mut cancel_opening_fixture = CancelOpeningFixture::default_for_opening(opening_id);
        cancel_opening_fixture.application_stake_unstaking_period = Some(0);
        cancel_opening_fixture
            .call_and_assert(Err(CancelOpeningError::UnstakingPeriodTooShort(StakePurpose::Application)));
    });
}

#[test]
fn cancel_opening_fails_due_to_redundant_role_unstaking_period() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let mut cancel_opening_fixture = CancelOpeningFixture::default_for_opening(opening_id);
        cancel_opening_fixture.role_stake_unstaking_period = Some(50);
        cancel_opening_fixture
            .call_and_assert(Err(CancelOpeningError::RedundantUnstakingPeriodProvided(StakePurpose::Role)));
    });
}

#[test]
fn cancel_opening_fails_due_to_too_short_application_unstaking_period() {
    build_test_externalities().execute_with(|| {
        let mut opening_fixture = AddOpeningFixture::default();
        opening_fixture.application_staking_policy = Some(StakingPolicy {
            amount: 100,
            amount_mode: StakingAmountLimitMode::AtLeast,
            crowded_out_unstaking_period_length: None,
            review_period_expired_unstaking_period_length: None,
        });
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let mut cancel_opening_fixture = CancelOpeningFixture::default_for_opening(opening_id);
        cancel_opening_fixture.application_stake_unstaking_period = Some(0);
        cancel_opening_fixture
            .call_and_assert(Err(CancelOpeningError::UnstakingPeriodTooShort(StakePurpose::Application)));
    });
}

#[test]
fn cancel_opening_fails_due_to_too_short_role_unstaking_period() {
    build_test_externalities().execute_with(|| {
        let mut opening_fixture = AddOpeningFixture::default();
        opening_fixture.role_staking_policy = Some(StakingPolicy {
            amount: 100,
            amount_mode: StakingAmountLimitMode::AtLeast,
            crowded_out_unstaking_period_length: None,
            review_period_expired_unstaking_period_length: None,
        });
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let mut cancel_opening_fixture = CancelOpeningFixture::default_for_opening(opening_id);
        cancel_opening_fixture.role_stake_unstaking_period = Some(0);
        cancel_opening_fixture
            .call_and_assert(Err(CancelOpeningError::UnstakingPeriodTooShort(StakePurpose::Role)));
    });
}
