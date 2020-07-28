use crate::mock::*;
use crate::test::*;

use crate::test::public_api::*;
use sp_std::collections::btree_map::BTreeMap;

/*
Not covered:
- Application content check
*/

pub struct CancelOpeningFixture {
    pub opening_id: OpeningId,
    pub application_stake_unstaking_period: Option<BlockNumber>,
    pub role_stake_unstaking_period: Option<BlockNumber>,
}

impl CancelOpeningFixture {
    pub(crate) fn default_for_opening(opening_id: OpeningId) -> Self {
        CancelOpeningFixture {
            opening_id,
            application_stake_unstaking_period: None,
            role_stake_unstaking_period: None,
        }
    }

    fn call_and_assert(&self, expected_result: Result<OpeningCancelled, CancelOpeningError>) {
        let old_opening = <OpeningById<Test>>::get(self.opening_id);
        let old_applications = self.extract_applications();

        let cancel_opening_result = self.cancel_opening();

        assert_eq!(cancel_opening_result, expected_result);

        self.assert_opening_content(old_opening, cancel_opening_result.clone());

        if !cancel_opening_result.is_ok() {
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

    fn extract_applications(
        &self,
    ) -> BTreeMap<ApplicationId, Application<OpeningId, BlockNumber, StakeId>> {
        let opening = <OpeningById<Test>>::get(self.opening_id);

        if let OpeningStage::Active {
            applications_added, ..
        } = opening.stage
        {
            applications_added
                .iter()
                .map(|app_id| (*app_id, <ApplicationById<Test>>::get(app_id)))
                .collect::<BTreeMap<ApplicationId, Application<OpeningId, BlockNumber, StakeId>>>()
        } else {
            BTreeMap::new()
        }
    }

    pub(crate) fn cancel_opening(&self) -> Result<OpeningCancelled, CancelOpeningError> {
        Hiring::cancel_opening(
            self.opening_id,
            self.application_stake_unstaking_period,
            self.role_stake_unstaking_period,
        )
    }

    fn assert_opening_content(
        &self,
        old_opening: Opening<Balance, BlockNumber, ApplicationId>,
        cancel_opening_result: Result<OpeningCancelled, CancelOpeningError>,
    ) {
        let new_opening = <OpeningById<Test>>::get(self.opening_id);
        let mut expected_opening = old_opening.clone();

        if cancel_opening_result.is_ok() {
            if let hiring::OpeningStage::Active {
                stage,
                applications_added,
                ..
            } = old_opening.stage
            {
                // compose expected stage
                let expected_active_stage = match stage {
                    ActiveOpeningStage::AcceptingApplications {
                        started_accepting_applicants_at_block,
                    } => ActiveOpeningStage::Deactivated {
                        cause: OpeningDeactivationCause::CancelledAcceptingApplications,
                        deactivated_at_block: FIRST_BLOCK_HEIGHT,
                        started_accepting_applicants_at_block,
                        started_review_period_at_block: None,
                    },
                    ActiveOpeningStage::ReviewPeriod {
                        started_accepting_applicants_at_block,
                        started_review_period_at_block,
                    } => ActiveOpeningStage::Deactivated {
                        cause: OpeningDeactivationCause::CancelledInReviewPeriod,
                        deactivated_at_block: FIRST_BLOCK_HEIGHT,
                        started_accepting_applicants_at_block,
                        started_review_period_at_block: Some(started_review_period_at_block),
                    },
                    ActiveOpeningStage::Deactivated { .. } => {
                        panic!("OpeningNotInCancellableStage")
                    }
                };

                // calculate application counters
                let mut deactivated_app_count = 0;
                let mut unstaking_app_count = 0;
                for app_id in applications_added.clone() {
                    let application = <ApplicationById<Test>>::get(app_id);

                    match application.stage {
                        ApplicationStage::Active => panic!("Cannot be in active stage"),
                        ApplicationStage::Inactive { .. } => {
                            deactivated_app_count += 1;
                        }
                        ApplicationStage::Unstaking { .. } => {
                            unstaking_app_count += 1;
                        }
                    }
                }

                expected_opening.stage = hiring::OpeningStage::Active {
                    stage: expected_active_stage,
                    applications_added,
                    active_application_count: 0,
                    unstaking_application_count: unstaking_app_count,
                    deactivated_application_count: deactivated_app_count,
                };
            } else {
                panic!("old opening stage MUST be active")
            }
        };

        assert_eq!(expected_opening, new_opening);
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
fn cancel_opening_succeeds_with_single_crowded_out_application() {
    build_test_externalities().execute_with(|| {
        let mut opening_fixture = AddOpeningFixture::default();
        opening_fixture.application_rationing_policy = Some(hiring::ApplicationRationingPolicy {
            max_active_applicants: 1,
        });
        opening_fixture.application_staking_policy = Some(StakingPolicy {
            amount: 100,
            amount_mode: StakingAmountLimitMode::AtLeast,
            crowded_out_unstaking_period_length: None,
            review_period_expired_unstaking_period_length: None,
        });
        opening_fixture.role_staking_policy = Some(StakingPolicy {
            amount: 100,
            amount_mode: StakingAmountLimitMode::AtLeast,
            crowded_out_unstaking_period_length: None,
            review_period_expired_unstaking_period_length: None,
        });

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let mut application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        application_fixture.opt_application_stake_imbalance =
            Some(stake::NegativeImbalance::<Test>::new(100));
        application_fixture.opt_role_stake_imbalance =
            Some(stake::NegativeImbalance::<Test>::new(100));

        assert!(application_fixture.add_application().is_ok());

        application_fixture.opt_application_stake_imbalance =
            Some(stake::NegativeImbalance::<Test>::new(101));
        application_fixture.opt_role_stake_imbalance =
            Some(stake::NegativeImbalance::<Test>::new(101));

        assert!(application_fixture.add_application().is_ok());

        let cancel_opening_fixture = CancelOpeningFixture::default_for_opening(opening_id);
        cancel_opening_fixture.call_and_assert(Ok(OpeningCancelled {
            number_of_unstaking_applications: 1,
            number_of_deactivated_applications: 0,
        }));
    });
}

#[test]
fn cancel_opening_succeeds_with_single_unstaking_application() {
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

        let mut application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        application_fixture.opt_application_stake_imbalance =
            Some(stake::NegativeImbalance::<Test>::new(100));

        let app_application_result = application_fixture.add_application();
        assert!(app_application_result.is_ok());

        let cancel_opening_fixture = CancelOpeningFixture::default_for_opening(opening_id);
        cancel_opening_fixture.call_and_assert(Ok(OpeningCancelled {
            number_of_unstaking_applications: 1,
            number_of_deactivated_applications: 0,
        }));
    });
}

#[test]
fn cancel_opening_succeeds_with_single_deactivated_application() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let app_application_result = application_fixture.add_application();
        assert!(app_application_result.is_ok());

        let cancel_opening_fixture = CancelOpeningFixture::default_for_opening(opening_id);
        cancel_opening_fixture.call_and_assert(Ok(OpeningCancelled {
            number_of_unstaking_applications: 0,
            number_of_deactivated_applications: 1,
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

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let app_application_result = application_fixture.add_application();
        assert!(app_application_result.is_ok());

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
        cancel_opening_fixture.call_and_assert(Err(CancelOpeningError::UnstakingPeriodTooShort(
            StakePurpose::Application,
        )));
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
        cancel_opening_fixture.call_and_assert(Err(
            CancelOpeningError::RedundantUnstakingPeriodProvided(StakePurpose::Role),
        ));
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
        cancel_opening_fixture.call_and_assert(Err(CancelOpeningError::UnstakingPeriodTooShort(
            StakePurpose::Application,
        )));
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
        cancel_opening_fixture.call_and_assert(Err(CancelOpeningError::UnstakingPeriodTooShort(
            StakePurpose::Role,
        )));
    });
}

#[test]
fn cancel_opening_succeeds_with_single_unstaking_application_with_application_stake_checks() {
    handle_mock(|| {
        build_test_externalities().execute_with(|| {
            let mock = default_mock_for_creating_stake();
            set_stake_handler_impl(mock.clone());

            let mut opening_fixture = AddOpeningFixture::default();
            opening_fixture.application_staking_policy = Some(StakingPolicy {
                amount: 100,
                amount_mode: StakingAmountLimitMode::AtLeast,
                crowded_out_unstaking_period_length: None,
                review_period_expired_unstaking_period_length: None,
            });
            let add_opening_result = opening_fixture.add_opening();
            let opening_id = add_opening_result.unwrap();

            let mut application_fixture = AddApplicationFixture::default_for_opening(opening_id);
            application_fixture.opt_application_stake_imbalance =
                Some(stake::NegativeImbalance::<Test>::new(100));

            let app_application_result = application_fixture.add_application();
            let application_id = app_application_result.unwrap().application_id_added;

            let mock2 = default_mock_for_unstaking();
            set_stake_handler_impl(mock2.clone());

            let cancel_opening_fixture = CancelOpeningFixture::default_for_opening(opening_id);
            cancel_opening_fixture.call_and_assert(Ok(OpeningCancelled {
                number_of_unstaking_applications: 1,
                number_of_deactivated_applications: 0,
            }));

            TestApplicationDeactivatedHandler::assert_deactivated_application(
                application_id,
                ApplicationDeactivationCause::OpeningCancelled,
            );
        })
    });
}

#[test]
fn cancel_opening_succeeds_with_single_unstaking_application_with_role_stake_checks() {
    handle_mock(|| {
        build_test_externalities().execute_with(|| {
            let mock = default_mock_for_creating_stake();
            set_stake_handler_impl(mock.clone());

            let mut opening_fixture = AddOpeningFixture::default();
            opening_fixture.role_staking_policy = Some(StakingPolicy {
                amount: 100,
                amount_mode: StakingAmountLimitMode::AtLeast,
                crowded_out_unstaking_period_length: None,
                review_period_expired_unstaking_period_length: None,
            });
            let add_opening_result = opening_fixture.add_opening();
            let opening_id = add_opening_result.unwrap();

            let mut application_fixture = AddApplicationFixture::default_for_opening(opening_id);
            application_fixture.opt_role_stake_imbalance =
                Some(stake::NegativeImbalance::<Test>::new(100));

            let app_application_result = application_fixture.add_application();
            assert!(app_application_result.is_ok());

            let mock2 = default_mock_for_unstaking();
            set_stake_handler_impl(mock2.clone());

            let cancel_opening_fixture = CancelOpeningFixture::default_for_opening(opening_id);
            cancel_opening_fixture.call_and_assert(Ok(OpeningCancelled {
                number_of_unstaking_applications: 1,
                number_of_deactivated_applications: 0,
            }));
        })
    });
}
