use super::*;
use crate::mock::*;

use add_application::AddApplicationFixture;
use add_opening::AddOpeningFixture;

/*
Not covered:
- application content checks
- opening content checks

- staking state checks:
i.application.active_role_staking_id;
ii.application.active_application_staking_id;
*/

pub struct DeactivateApplicationFixture {
    pub application_id: u64,
    pub application_stake_unstaking_period: Option<u64>,
    pub role_stake_unstaking_period: Option<u64>,
}

impl DeactivateApplicationFixture {
    pub fn default_for_application_id(application_id: u64) -> Self {
        DeactivateApplicationFixture {
            application_id,
            application_stake_unstaking_period: None,
            role_stake_unstaking_period: None,
        }
    }

    pub fn deactivate_application(&self) -> Result<(), DeactivateApplicationError> {
        Hiring::deactive_application(
            self.application_id,
            self.application_stake_unstaking_period,
            self.role_stake_unstaking_period,
        )
    }

    fn call_and_assert(&self, expected_result: Result<(), DeactivateApplicationError>) {
        let deactivate_application_result = self.deactivate_application();

        assert_eq!(deactivate_application_result, expected_result);
    }
}

#[test]
fn deactivate_application_success() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        let deactivate_application_fixture =
            DeactivateApplicationFixture::default_for_application_id(application_id);

        deactivate_application_fixture.call_and_assert(Ok(()))
    });
}

#[test]
fn deactivate_application_fails_with_no_application() {
    build_test_externalities().execute_with(|| {
        let deactivate_application_fixture =
            DeactivateApplicationFixture::default_for_application_id(0);

        deactivate_application_fixture
            .call_and_assert(Err(DeactivateApplicationError::ApplicationDoesNotExist));
    });
}

#[test]
fn deactivate_application_fails_with_redundant_application_staking_period_provided() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        let mut deactivate_application_fixture =
            DeactivateApplicationFixture::default_for_application_id(application_id);
        deactivate_application_fixture.application_stake_unstaking_period = Some(3);

        deactivate_application_fixture.call_and_assert(Err(
            DeactivateApplicationError::RedundantUnstakingPeriodProvided(StakePurpose::Application),
        ))
    });
}

#[test]
fn deactivate_application_fails_with_redundant_role_staking_period_provided() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        let mut deactivate_application_fixture =
            DeactivateApplicationFixture::default_for_application_id(application_id);
        deactivate_application_fixture.role_stake_unstaking_period = Some(3);

        deactivate_application_fixture.call_and_assert(Err(
            DeactivateApplicationError::RedundantUnstakingPeriodProvided(StakePurpose::Role),
        ))
    });
}

#[test]
fn deactivate_application_fails_for_already_deactivated_application() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        let deactivate_application_fixture =
            DeactivateApplicationFixture::default_for_application_id(application_id);

        // deactivate first
        assert!(deactivate_application_fixture
            .deactivate_application()
            .is_ok());

        // try again to deactivate
        deactivate_application_fixture
            .call_and_assert(Err(DeactivateApplicationError::ApplicationNotActive))
    });
}

#[test]
fn deactivate_application_for_opening_not_accepting_applications() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        assert!(Hiring::begin_review(opening_id).is_ok());

        let deactivate_application_fixture =
            DeactivateApplicationFixture::default_for_application_id(application_id);

        deactivate_application_fixture.call_and_assert(Err(
            DeactivateApplicationError::OpeningNotAcceptingApplications,
        ))
    });
}

#[test]
fn deactivate_application_fails_with_too_short_application_unstaking_period_provided() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        let mut deactivate_application_fixture =
            DeactivateApplicationFixture::default_for_application_id(application_id);
        deactivate_application_fixture.application_stake_unstaking_period = Some(0);

        deactivate_application_fixture.call_and_assert(Err(
            DeactivateApplicationError::UnstakingPeriodTooShort(StakePurpose::Application),
        ))
    });
}

#[test]
fn deactivate_application_fails_with_too_short_role_unstaking_period_provided() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        let mut deactivate_application_fixture =
            DeactivateApplicationFixture::default_for_application_id(application_id);
        deactivate_application_fixture.role_stake_unstaking_period = Some(0);

        deactivate_application_fixture.call_and_assert(Err(
            DeactivateApplicationError::UnstakingPeriodTooShort(StakePurpose::Role),
        ))
    });
}
