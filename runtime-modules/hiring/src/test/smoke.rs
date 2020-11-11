use super::*;
use crate::mock::*;

use sp_std::collections::btree_set::BTreeSet;

/**
Main hiring workflow:
1. add_opening
1.1 (optional) ensure_can_add_application
2. add_application
3. begin_review
4. fill_opening
Not covered:
- begin_accepting_applications
- unstaked
- cancel_opening
- deactive_application

Smoke-test concept:
https://en.wikipedia.org/wiki/Smoke_testing_(software)
**/
#[test]
fn full_hiring_workflow_successful_path() {
    build_test_externalities().execute_with(|| {
        // 1. Add opening
        let expected_opening_id = 0;

        let activation_at = ActivateOpeningAt::CurrentBlock;
        let max_review_period_length = 672;
        let application_rationing_policy = None;
        let application_staking_policy = None;
        let role_staking_policy = None;
        let human_readable_text = "human_readable_text!!!".as_bytes().to_vec();
        let application_readable_text = "hrt!!".as_bytes().to_vec();

        // Add an opening, check that the returned value is Zero
        assert_eq!(
            Hiring::add_opening(
                activation_at,
                max_review_period_length,
                application_rationing_policy,
                application_staking_policy,
                role_staking_policy,
                human_readable_text.clone()
            ),
            Ok(expected_opening_id)
        );

        // Check that next opening id has been updated
        assert_eq!(Hiring::next_opening_id(), expected_opening_id + 1);

        // Check that our opening actually was added
        assert!(<OpeningById<Test>>::contains_key(expected_opening_id));

        let found_opening = Hiring::opening_by_id(expected_opening_id);

        // Check opening content
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
                max_review_period_length,
                application_rationing_policy: None,
                application_staking_policy: None,
                role_staking_policy: None,
                human_readable_text: human_readable_text.clone()
            }
        );
        let current_opening_id = expected_opening_id;

        // 1.1 (optional) ensure_can_add_application
        let ensure_can_add_application_result =
            Hiring::ensure_can_add_application(current_opening_id, None, None);

        // Check ensure_can_add_application result
        assert!(ensure_can_add_application_result.is_ok());

        // Check returned content
        let destructured_app_data = ensure_can_add_application_result.unwrap();
        let expected = DestructuredApplicationCanBeAddedEvaluation {
            opening: Opening {
                created: FIRST_BLOCK_HEIGHT,
                stage: OpeningStage::Active {
                    stage: ActiveOpeningStage::AcceptingApplications {
                        started_accepting_applicants_at_block: FIRST_BLOCK_HEIGHT,
                    },
                    applications_added: BTreeSet::new(),
                    active_application_count: 0,
                    unstaking_application_count: 0,
                    deactivated_application_count: 0,
                },
                max_review_period_length: 672,
                application_rationing_policy: None,
                application_staking_policy: None,
                role_staking_policy: None,
                human_readable_text: human_readable_text.clone(),
            },
            active_stage: ActiveOpeningStage::AcceptingApplications {
                started_accepting_applicants_at_block: FIRST_BLOCK_HEIGHT,
            },
            applications_added: BTreeSet::new(),
            active_application_count: 0,
            unstaking_application_count: 0,
            deactivated_application_count: 0,
            would_get_added_success: ApplicationAddedSuccess::Unconditionally,
        };

        assert_eq!(destructured_app_data, expected);

        // 2. add_application
        let add_application_result = Hiring::add_application(
            current_opening_id,
            None,
            None,
            application_readable_text.clone(),
        );

        // Check add_application result
        assert!(add_application_result.is_ok());

        // Check that application wasn't crowded_out
        let app_added = add_application_result.unwrap();
        assert_eq!(app_added.application_id_crowded_out, None);

        let new_application_id = app_added.application_id_added;

        // Check that our application actually was added
        assert!(<ApplicationById<Test>>::contains_key(new_application_id));

        let new_application = Hiring::application_by_id(new_application_id);

        // Check application content
        assert_eq!(
            new_application,
            Application {
                opening_id: 0,
                application_index_in_opening: 0,
                add_to_opening_in_block: FIRST_BLOCK_HEIGHT,
                active_role_staking_id: None,
                active_application_staking_id: None,
                stage: ApplicationStage::Active,
                human_readable_text: application_readable_text.clone()
            }
        );

        // 3. begin_review
        let begin_review_result = Hiring::begin_review(current_opening_id);

        // Check begin_review result
        assert!(begin_review_result.is_ok());

        let updated_opening_after_begin_review = Hiring::opening_by_id(current_opening_id);

        let mut expected_added_apps_in_opening = BTreeSet::new();
        expected_added_apps_in_opening.insert(0);

        // Check updated opening content
        assert_eq!(
            updated_opening_after_begin_review,
            Opening {
                created: FIRST_BLOCK_HEIGHT,
                stage: OpeningStage::Active {
                    stage: ActiveOpeningStage::ReviewPeriod {
                        started_accepting_applicants_at_block: FIRST_BLOCK_HEIGHT,
                        started_review_period_at_block: FIRST_BLOCK_HEIGHT
                    },
                    applications_added: expected_added_apps_in_opening.clone(),
                    active_application_count: 1,
                    unstaking_application_count: 0,
                    deactivated_application_count: 0
                },
                max_review_period_length,
                application_rationing_policy: None,
                application_staking_policy: None,
                role_staking_policy: None,
                human_readable_text: human_readable_text.clone()
            }
        );
        // 4. fill_opening
        let applications = [new_application_id]
            .iter()
            .map(|&x| x)
            .collect::<BTreeSet<_>>();
        let fill_opening_result =
            Hiring::fill_opening(current_opening_id, applications, None, None, None);

        // Check fill_opening result
        assert!(fill_opening_result.is_ok());

        let updated_opening_fill_opening = Hiring::opening_by_id(current_opening_id);

        // Check updated opening content
        assert_eq!(
            updated_opening_fill_opening,
            Opening {
                created: FIRST_BLOCK_HEIGHT,
                stage: OpeningStage::Active {
                    stage: ActiveOpeningStage::Deactivated {
                        cause: OpeningDeactivationCause::Filled,
                        deactivated_at_block: FIRST_BLOCK_HEIGHT,
                        started_accepting_applicants_at_block: FIRST_BLOCK_HEIGHT,
                        started_review_period_at_block: Some(FIRST_BLOCK_HEIGHT)
                    },
                    applications_added: expected_added_apps_in_opening,
                    active_application_count: 0,
                    unstaking_application_count: 0,
                    deactivated_application_count: 1
                },
                max_review_period_length,
                application_rationing_policy: None,
                application_staking_policy: None,
                role_staking_policy: None,
                human_readable_text: human_readable_text.clone()
            }
        );

        let current_application_id = new_application_id;
        let application_after_fill_opening = Hiring::application_by_id(current_application_id);

        // Check updated application content
        assert_eq!(
            application_after_fill_opening,
            Application {
                opening_id: 0,
                application_index_in_opening: 0,
                add_to_opening_in_block: FIRST_BLOCK_HEIGHT,
                active_role_staking_id: None,
                active_application_staking_id: None,
                stage: ApplicationStage::Inactive {
                    deactivation_initiated: FIRST_BLOCK_HEIGHT,
                    deactivated: FIRST_BLOCK_HEIGHT,
                    cause: ApplicationDeactivationCause::Hired
                },
                human_readable_text: application_readable_text.clone()
            }
        );
    });
}
