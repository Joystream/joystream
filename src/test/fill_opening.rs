use super::*;
use crate::mock::*;

use add_application::AddApplicationFixture;
use add_opening::AddOpeningFixture;
use deactivate_application::DeactivateApplicationFixture;

use rstd::collections::btree_set::BTreeSet;
use rstd::result::Result;
/*
Not covered:
- ApplicationDeactivatedHandler
- Application content check
- Opening content check

- staking state checks:
i.application.active_role_staking_id;
ii.application.active_application_staking_id;
*/

pub struct FillOpeningFixture {
    pub opening_id: OpeningId,
    pub successful_applications: BTreeSet<<mock::Test as Trait>::ApplicationId>,
    pub opt_successful_applicant_application_stake_unstaking_period: Option<BlockNumber>,
    pub opt_failed_applicant_application_stake_unstaking_period: Option<BlockNumber>,
    pub opt_failed_applicant_role_stake_unstaking_period: Option<BlockNumber>,
}

impl FillOpeningFixture {
    pub(crate) fn default_for_opening(opening_id: OpeningId) -> Self {
        FillOpeningFixture {
            opening_id,
            successful_applications: BTreeSet::new(),
            opt_successful_applicant_application_stake_unstaking_period: None,
            opt_failed_applicant_application_stake_unstaking_period: None,
            opt_failed_applicant_role_stake_unstaking_period: None,
        }
    }

    fn call_and_assert(&self, expected_result: Result<(), FillOpeningError<mock::Test>>) {
        let old_applications = self.extract_successful_applications();

        let fill_opening_result = self.fill_opening();

        assert_eq!(fill_opening_result, expected_result);

        if !fill_opening_result.is_ok() {
            self.assert_same_applications(old_applications);
        }
    }

    fn assert_same_applications(
        &self,
        old_applications: BTreeMap<ApplicationId, Application<OpeningId, BlockNumber, StakeId>>,
    ) {
        for (app_id, application) in old_applications {
            let test_application = <ApplicationById<Test>>::get(app_id);
            assert_eq!(application, test_application)
        }
    }

    fn extract_successful_applications(&self) -> BTreeMap<ApplicationId, Application<OpeningId, BlockNumber, StakeId>> {
        self.successful_applications
            .iter()
            .map(|app_id| (*app_id, <ApplicationById<Test>>::get(app_id)))
            .collect::<BTreeMap<ApplicationId, Application<OpeningId, BlockNumber, StakeId>>>()
    }

    pub(crate) fn fill_opening(&self) -> Result<(), FillOpeningError<mock::Test>> {
        Hiring::fill_opening(
            self.opening_id,
            self.successful_applications.clone(),
            self.opt_successful_applicant_application_stake_unstaking_period,
            self.opt_failed_applicant_application_stake_unstaking_period,
            self.opt_failed_applicant_role_stake_unstaking_period,
        )
    }
}

#[test]
fn fill_opening_fails_due_to_opening_not_existing() {
    build_test_externalities().execute_with(|| {
        let fill_opening_fixture = FillOpeningFixture::default_for_opening(0);
        fill_opening_fixture.call_and_assert(Err(FillOpeningError::OpeningDoesNotExist));
    });
}

#[test]
fn fill_opening_fails_due_to_opening_is_not_active() {
    build_test_externalities().execute_with(|| {
        let mut opening_fixture = AddOpeningFixture::default();
        opening_fixture.activate_at = ActivateOpeningAt::ExactBlock(5);

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let fill_opening_fixture = FillOpeningFixture::default_for_opening(opening_id);
        fill_opening_fixture.call_and_assert(Err(FillOpeningError::OpeningNotInReviewPeriodStage));
    });
}

#[test]
fn fill_opening_fails_due_to_redundant_successful_application_unstaking_period() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();
        assert!(Hiring::begin_review(opening_id).is_ok());

        let mut fill_opening_fixture = FillOpeningFixture::default_for_opening(opening_id);
        fill_opening_fixture.opt_successful_applicant_application_stake_unstaking_period = Some(50);
        fill_opening_fixture.call_and_assert(Err(
            FillOpeningError::RedundantUnstakingPeriodProvided(
                StakePurpose::Application,
                ApplicationOutcomeInFilledOpening::Success,
            ),
        ));
    });
}

#[test]
fn fill_opening_fails_due_too_short_successful_application_unstaking_period() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();
        assert!(Hiring::begin_review(opening_id).is_ok());

        let mut fill_opening_fixture = FillOpeningFixture::default_for_opening(opening_id);
        fill_opening_fixture.opt_successful_applicant_application_stake_unstaking_period = Some(0);
        fill_opening_fixture.call_and_assert(Err(FillOpeningError::UnstakingPeriodTooShort(
            StakePurpose::Application,
            ApplicationOutcomeInFilledOpening::Success,
        )));
    });
}

#[test]
fn fill_opening_fails_due_to_redundant_failed_application_unstaking_period() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();
        assert!(Hiring::begin_review(opening_id).is_ok());

        let mut fill_opening_fixture = FillOpeningFixture::default_for_opening(opening_id);
        fill_opening_fixture.opt_failed_applicant_application_stake_unstaking_period = Some(50);
        fill_opening_fixture.call_and_assert(Err(
            FillOpeningError::RedundantUnstakingPeriodProvided(
                StakePurpose::Application,
                ApplicationOutcomeInFilledOpening::Failure,
            ),
        ));
    });
}

#[test]
fn fill_opening_fails_due_too_short_failed_application_unstaking_period() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();
        assert!(Hiring::begin_review(opening_id).is_ok());

        let mut fill_opening_fixture = FillOpeningFixture::default_for_opening(opening_id);
        fill_opening_fixture.opt_failed_applicant_application_stake_unstaking_period = Some(0);
        fill_opening_fixture.call_and_assert(Err(FillOpeningError::UnstakingPeriodTooShort(
            StakePurpose::Application,
            ApplicationOutcomeInFilledOpening::Failure,
        )));
    });
}

#[test]
fn fill_opening_fails_due_to_redundant_failed_role_unstaking_period() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();
        assert!(Hiring::begin_review(opening_id).is_ok());

        let mut fill_opening_fixture = FillOpeningFixture::default_for_opening(opening_id);
        fill_opening_fixture.opt_failed_applicant_role_stake_unstaking_period = Some(50);
        fill_opening_fixture.call_and_assert(Err(
            FillOpeningError::RedundantUnstakingPeriodProvided(
                StakePurpose::Role,
                ApplicationOutcomeInFilledOpening::Failure,
            ),
        ));
    });
}

#[test]
fn fill_opening_fails_due_too_short_failed_role_unstaking_period() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();
        assert!(Hiring::begin_review(opening_id).is_ok());

        let mut fill_opening_fixture = FillOpeningFixture::default_for_opening(opening_id);
        fill_opening_fixture.opt_failed_applicant_role_stake_unstaking_period = Some(0);
        fill_opening_fixture.call_and_assert(Err(FillOpeningError::UnstakingPeriodTooShort(
            StakePurpose::Role,
            ApplicationOutcomeInFilledOpening::Failure,
        )));
    });
}

#[test]
fn fill_opening_fails_due_not_existing_application() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();
        assert!(Hiring::begin_review(opening_id).is_ok());

        let mut fill_opening_fixture = FillOpeningFixture::default_for_opening(opening_id);
        let mut apps = BTreeSet::new();
        let invalid_app_id = 10;
        apps.insert(invalid_app_id);
        fill_opening_fixture.successful_applications = apps;
        fill_opening_fixture.call_and_assert(Err(FillOpeningError::ApplicationDoesNotExist(
            invalid_app_id,
        )));
    });
}

#[test]
fn fill_opening_fails_due_not_active_application() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        let deactivate_application_fixture =
            DeactivateApplicationFixture::default_for_application_id(application_id);

        assert!(deactivate_application_fixture
            .deactivate_application()
            .is_ok());
        assert!(Hiring::begin_review(opening_id).is_ok());

        let mut fill_opening_fixture = FillOpeningFixture::default_for_opening(opening_id);
        let mut apps = BTreeSet::new();
        apps.insert(application_id);

        fill_opening_fixture.successful_applications = apps;
        fill_opening_fixture.call_and_assert(Err(FillOpeningError::ApplicationNotInActiveStage(
            application_id,
        )));
    });
}

#[test]
fn fill_opening_succeeds() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let to_deactivate_app_result = application_fixture.add_application();
        let to_deactivate_app_id = to_deactivate_app_result.unwrap().application_id_added;

        assert!(Hiring::deactive_application(to_deactivate_app_id, None, None).is_ok());

        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        assert!(Hiring::begin_review(opening_id).is_ok());

        let mut fill_opening_fixture = FillOpeningFixture::default_for_opening(opening_id);
        let mut apps = BTreeSet::new();
        apps.insert(application_id);

        fill_opening_fixture.successful_applications = apps;
        fill_opening_fixture.call_and_assert(Ok(()));
    });
}
