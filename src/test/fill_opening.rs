use super::*;
use crate::mock::*;

use add_application::AddApplicationFixture;
use add_opening::AddOpeningFixture;

use rstd::collections::btree_set::BTreeSet;
use rstd::result::Result;
/*
Not covered:
- ApplicationDeactivatedHandler

- staking state checks:
i.application.active_role_staking_id;
ii.application.active_application_staking_id;
*/


pub struct FillOpeningFixture {
    pub opening_id: u64,
    pub successful_applications: BTreeSet<<mock::Test as Trait>::ApplicationId>,
    pub opt_successful_applicant_application_stake_unstaking_period: Option<u64>,
    pub opt_failed_applicant_application_stake_unstaking_period: Option<u64>,
    pub opt_failed_applicant_role_stake_unstaking_period: Option<u64>,
}

impl FillOpeningFixture {
    pub(crate) fn default_for_opening(opening_id: u64) -> Self {
        FillOpeningFixture {
            opening_id,
            successful_applications: BTreeSet::new(),
            opt_successful_applicant_application_stake_unstaking_period: None,
            opt_failed_applicant_application_stake_unstaking_period: None,
            opt_failed_applicant_role_stake_unstaking_period: None,
        }
    }

    fn call_and_assert(&self, expected_result: Result<(), FillOpeningError<mock::Test>>) {
        //		let old_opening = <OpeningById<Test>>::get(self.opening_id);
        //		let old_applications = self.extract_applications();

        let fill_opening_result = self.fill_opening();

        assert_eq!(fill_opening_result, expected_result);

        //		self.assert_opening_content(old_opening, unstaked_result.clone());
        //
        //		if !unstaked_result.is_ok() {
        //			self.assert_same_applications(old_applications);
        //		}
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
fn cancel_opening_fails_due_to_opening_is_not_active() {
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
fn cancel_opening_fails_due_to_redundant_successful_application_unstaking_period() {
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
fn cancel_opening_fails_due_too_short_successful_application_unstaking_period() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();
        assert!(Hiring::begin_review(opening_id).is_ok());

        let mut fill_opening_fixture = FillOpeningFixture::default_for_opening(opening_id);
        fill_opening_fixture.opt_successful_applicant_application_stake_unstaking_period = Some(0);
        fill_opening_fixture.call_and_assert(Err(
            FillOpeningError::UnstakingPeriodTooShort(
                StakePurpose::Application,
				ApplicationOutcomeInFilledOpening::Success,
            ),
        ));
    });
}

#[test]
fn cancel_opening_fails_due_to_redundant_failed_application_unstaking_period() {
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
fn cancel_opening_fails_due_too_short_failed_application_unstaking_period() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();
        assert!(Hiring::begin_review(opening_id).is_ok());

        let mut fill_opening_fixture = FillOpeningFixture::default_for_opening(opening_id);
        fill_opening_fixture.opt_failed_applicant_application_stake_unstaking_period = Some(0);
        fill_opening_fixture.call_and_assert(Err(
            FillOpeningError::UnstakingPeriodTooShort(
                StakePurpose::Application,
				ApplicationOutcomeInFilledOpening::Failure,
            ),
        ));
    });
}

#[test]
fn cancel_opening_fails_due_to_redundant_failed_role_unstaking_period() {
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
fn cancel_opening_fails_due_too_short_failed_role_unstaking_period() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();
        assert!(Hiring::begin_review(opening_id).is_ok());

        let mut fill_opening_fixture = FillOpeningFixture::default_for_opening(opening_id);
        fill_opening_fixture.opt_failed_applicant_role_stake_unstaking_period = Some(0);
        fill_opening_fixture.call_and_assert(Err(
            FillOpeningError::UnstakingPeriodTooShort(
                StakePurpose::Role,
				ApplicationOutcomeInFilledOpening::Failure,
            ),
        ));
    });
}
