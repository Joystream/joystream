use crate::mock::*;
use crate::test::*;

use crate::hiring::*;
use sp_std::collections::btree_set::BTreeSet;

#[test]
fn ensure_can_add_application_fails_with_no_opening() {
    build_test_externalities().execute_with(|| {
        assert_eq!(
            Hiring::ensure_can_add_application(2, None, None),
            Err(AddApplicationError::OpeningDoesNotExist)
        );
    });
}

#[test]
fn ensure_can_add_application_fails_with_redundant_role_stake() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        assert_eq!(
            Hiring::ensure_can_add_application(opening_id, Some(200), None),
            Err(AddApplicationError::StakeProvidedWhenRedundant(
                StakePurpose::Role
            ))
        );
    });
}

#[test]
fn ensure_can_add_application_fails_with_too_low_role_stake_amout() {
    build_test_externalities().execute_with(|| {
        let mut opening_fixture = AddOpeningFixture::default();
        opening_fixture.role_staking_policy = Some(StakingPolicy {
            amount: 100,
            amount_mode: StakingAmountLimitMode::Exact,
            crowded_out_unstaking_period_length: None,
            review_period_expired_unstaking_period_length: None,
        });

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        assert_eq!(
            Hiring::ensure_can_add_application(opening_id, Some(200), None),
            Err(AddApplicationError::StakeAmountTooLow(StakePurpose::Role))
        );
    });
}

#[test]
fn ensure_can_add_application_fails_with_missing_role_stake_when_required() {
    build_test_externalities().execute_with(|| {
        //**** stake provided when redundant
        let mut opening_fixture = AddOpeningFixture::default();
        opening_fixture.role_staking_policy = Some(StakingPolicy {
            amount: 100,
            amount_mode: StakingAmountLimitMode::Exact,
            crowded_out_unstaking_period_length: None,
            review_period_expired_unstaking_period_length: None,
        });

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        assert_eq!(
            Hiring::ensure_can_add_application(opening_id, None, None),
            Err(AddApplicationError::StakeMissingWhenRequired(
                StakePurpose::Role
            ))
        );
    });
}

#[test]
fn ensure_can_add_application_fails_with_redundant_application_stake() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        assert_eq!(
            Hiring::ensure_can_add_application(opening_id, None, Some(200),),
            Err(AddApplicationError::StakeProvidedWhenRedundant(
                StakePurpose::Application
            ))
        );
    });
}

#[test]
fn ensure_can_add_application_fails_with_too_low_application_stake_amout() {
    build_test_externalities().execute_with(|| {
        let mut opening_fixture = AddOpeningFixture::default();
        opening_fixture.application_staking_policy = Some(StakingPolicy {
            amount: 100,
            amount_mode: StakingAmountLimitMode::Exact,
            crowded_out_unstaking_period_length: None,
            review_period_expired_unstaking_period_length: None,
        });

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        assert_eq!(
            Hiring::ensure_can_add_application(opening_id, None, Some(200),),
            Err(AddApplicationError::StakeAmountTooLow(
                StakePurpose::Application
            ))
        );
    });
}

#[test]
fn ensure_can_add_application_fails_with_missing_application_stake_when_required() {
    build_test_externalities().execute_with(|| {
        //**** stake provided when redundant
        let mut opening_fixture = AddOpeningFixture::default();
        opening_fixture.application_staking_policy = Some(StakingPolicy {
            amount: 100,
            amount_mode: StakingAmountLimitMode::Exact,
            crowded_out_unstaking_period_length: None,
            review_period_expired_unstaking_period_length: None,
        });

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        assert_eq!(
            Hiring::ensure_can_add_application(opening_id, None, None),
            Err(AddApplicationError::StakeMissingWhenRequired(
                StakePurpose::Application
            ))
        );
    });
}

#[test]
fn ensure_can_add_application_fails_with_non_active_opening() {
    build_test_externalities().execute_with(|| {
        let mut opening_fixture = AddOpeningFixture::default();
        opening_fixture.activate_at = ActivateOpeningAt::ExactBlock(22);
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        assert_eq!(
            Hiring::ensure_can_add_application(opening_id, None, None),
            Err(AddApplicationError::OpeningNotInAcceptingApplicationsStage)
        );
    });
}

#[test]
fn ensure_can_add_application_fails_with_non_accepting_application_stage() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        assert_eq!(Hiring::begin_review(opening_id), Ok(()));

        assert_eq!(
            Hiring::ensure_can_add_application(opening_id, None, None),
            Err(AddApplicationError::OpeningNotInAcceptingApplicationsStage)
        );
    });
}

#[test]
fn ensure_can_add_application_succeeds_with_application_rationing_policy() {
    build_test_externalities().execute_with(|| {
        let mut opening_fixture = AddOpeningFixture::default();
        opening_fixture.application_rationing_policy = Some(hiring::ApplicationRationingPolicy {
            max_active_applicants: 1,
        });
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        assert!(Hiring::ensure_can_add_application(opening_id, None, None).is_ok(),);
    });
}

#[test]
fn ensure_can_add_application_fails_with_application_rationing_policy() {
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

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let mut application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        application_fixture.opt_application_stake_imbalance =
            Some(stake::NegativeImbalance::<Test>::new(100));

        assert!(application_fixture.add_application().is_ok());

        assert_eq!(
            Hiring::ensure_can_add_application(opening_id, None, Some(100)),
            Err(AddApplicationError::NewApplicationWasCrowdedOut)
        );
    });
}

#[test]
fn ensure_can_add_application_succeeds() {
    build_test_externalities().execute_with(|| {
        let mut opening_fixture = AddOpeningFixture::default();
        opening_fixture.application_staking_policy = Some(StakingPolicy {
            amount: 100,
            amount_mode: StakingAmountLimitMode::Exact,
            crowded_out_unstaking_period_length: None,
            review_period_expired_unstaking_period_length: None,
        });
        opening_fixture.role_staking_policy = Some(StakingPolicy {
            amount: 100,
            amount_mode: StakingAmountLimitMode::Exact,
            crowded_out_unstaking_period_length: None,
            review_period_expired_unstaking_period_length: None,
        });
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let ensure_can_add_application_result =
            Hiring::ensure_can_add_application(opening_id, Some(100), Some(100));

        assert_eq!(
            ensure_can_add_application_result,
            Ok(DestructuredApplicationCanBeAddedEvaluation {
                opening: Opening {
                    created: FIRST_BLOCK_HEIGHT,
                    stage: hiring::OpeningStage::Active {
                        stage: hiring::ActiveOpeningStage::AcceptingApplications {
                            started_accepting_applicants_at_block: FIRST_BLOCK_HEIGHT
                        },
                        applications_added: BTreeSet::new(),
                        active_application_count: 0,
                        unstaking_application_count: 0,
                        deactivated_application_count: 0
                    },
                    max_review_period_length: 672,
                    application_rationing_policy: None,
                    application_staking_policy: Some(StakingPolicy {
                        amount: 100,
                        amount_mode: StakingAmountLimitMode::Exact,
                        crowded_out_unstaking_period_length: None,
                        review_period_expired_unstaking_period_length: None
                    }),
                    role_staking_policy: Some(StakingPolicy {
                        amount: 100,
                        amount_mode: StakingAmountLimitMode::Exact,
                        crowded_out_unstaking_period_length: None,
                        review_period_expired_unstaking_period_length: None
                    }),
                    human_readable_text: HUMAN_READABLE_TEXT.to_vec()
                },
                active_stage: hiring::ActiveOpeningStage::AcceptingApplications {
                    started_accepting_applicants_at_block: FIRST_BLOCK_HEIGHT
                },
                applications_added: BTreeSet::new(),
                active_application_count: 0,
                unstaking_application_count: 0,
                deactivated_application_count: 0,
                would_get_added_success: ApplicationAddedSuccess::Unconditionally
            })
        );
    });
}

#[test]
fn ensure_can_add_application_new_application_should_be_crowded_out_with_exact_stake() {
    ensure_can_add_application_new_application_should_be_crowded_out_with_staking_policy(
        StakingPolicy {
            amount: 100,
            amount_mode: StakingAmountLimitMode::Exact,
            crowded_out_unstaking_period_length: None,
            review_period_expired_unstaking_period_length: None,
        },
    );
}

#[test]
fn ensure_can_add_application_new_application_should_be_crowded_out_with_atleast_stake() {
    ensure_can_add_application_new_application_should_be_crowded_out_with_staking_policy(
        StakingPolicy {
            amount: 100,
            amount_mode: StakingAmountLimitMode::AtLeast,
            crowded_out_unstaking_period_length: None,
            review_period_expired_unstaking_period_length: None,
        },
    );
}

fn ensure_can_add_application_new_application_should_be_crowded_out_with_staking_policy(
    staking_policy: StakingPolicy<Balance, BlockNumber>,
) {
    build_test_externalities().execute_with(|| {
        let mut opening_fixture = AddOpeningFixture::default();
        opening_fixture.application_rationing_policy = Some(hiring::ApplicationRationingPolicy {
            max_active_applicants: 1,
        });
        opening_fixture.application_staking_policy = Some(staking_policy);

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let mut application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        application_fixture.opt_application_stake_imbalance =
            Some(stake::NegativeImbalance::<Test>::new(100));

        assert!(application_fixture.add_application().is_ok());

        assert_eq!(
            Hiring::ensure_can_add_application(opening_id, None, Some(100)),
            Err(AddApplicationError::NewApplicationWasCrowdedOut)
        );
    });
}

#[test]
fn ensure_can_add_application_should_crowd_out_application() {
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

        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let mut application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        application_fixture.opt_application_stake_imbalance =
            Some(stake::NegativeImbalance::<Test>::new(100));

        assert!(application_fixture.add_application().is_ok());

        let destructered_app_result = Hiring::ensure_can_add_application(opening_id, None, Some(101));
        assert!(destructered_app_result.is_ok());

        let destructered_app = destructered_app_result.unwrap();

        if let ApplicationAddedSuccess::CrowdsOutExistingApplication(application_id) = destructered_app.would_get_added_success {
            assert_eq!(0, application_id);
        } else {
            panic!("Expected ApplicationAddedSuccess::CrowdsOutExistingApplication(application_id == 0)")
        }
    });
}
