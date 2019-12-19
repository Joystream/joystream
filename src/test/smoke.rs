#![cfg(test)]

use super::*;
use crate::mock::*;

static FIRST_BLOCK_HEIGHT: <Test as system::Trait>::BlockNumber = 1;

use rstd::collections::btree_set::BTreeSet;

/**
Main hiring workflow:
1. add_opening
2. add_application
3. begin_review
4. fill_opening
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
        assert!(<OpeningById<Test>>::exists(expected_opening_id));

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
                max_review_period_length,
                application_rationing_policy: None, //application_rationing_policy,
                application_staking_policy: None,   //application_staking_policy,
                role_staking_policy: None,          //role_staking_policy,
                human_readable_text: human_readable_text.clone()
            }
        );

        //        // 2. begin_accepting_applications
        //        let current_opening_id = expected_opening_id;
        //        let begin_accepting_apps_result = Hiring::begin_accepting_applications(current_opening_id);
        //
        //        //assert_eq!(begin_accepting_apps_result.is_ok(), true);
        //        if !begin_accepting_apps_result.is_ok() {
        //            println!("{:?}", begin_accepting_apps_result.unwrap_err());
        //        }

        // 2. add_application
        let current_opening_id = expected_opening_id;
        let add_application_result =
            Hiring::add_application(current_opening_id, None, None, application_readable_text.clone());

        assert!(add_application_result.is_ok());

        let new_application_id = add_application_result.unwrap().application_id_added;

        /*
        // DONE
        let application_added_result = ApplicationAdded {
            application_id_added: new_application_id,
            application_id_crowded_out: match can_be_added_destructured.would_get_added_success {
                ApplicationAddedSuccess::CrowdsOutExistingApplication(id) => Some(id),
                _ => None,
            },
        };
        */

        // Check that our application actually was added
        assert!(<ApplicationById<Test>>::exists(new_application_id));

        let new_application = Hiring::application_by_id(new_application_id);

        assert_eq!(
            new_application,
            Application {
                opening_id: 0,
                application_index_in_opening: 0,
                add_to_opening_in_block: 1,
                active_role_staking_id: None,
                active_application_staking_id: None,
                stage: ApplicationStage::Active,
                human_readable_text: application_readable_text.clone()
            }
        );

        // 3. begin_review
        let begin_review_result = Hiring::begin_review(current_opening_id);

        assert!(begin_review_result.is_ok());

        let updated_opening_after_begin_review = Hiring::opening_by_id(current_opening_id);

        assert_eq!(
            updated_opening_after_begin_review,
            Opening {
                created: 1,
                stage: OpeningStage::Active {
                    stage: ActiveOpeningStage::ReviewPeriod {
                        started_accepting_applicants_at_block: 1,
                        started_review_period_at_block: 1
                    },
                    applications_added: BTreeSet::new(),
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

        assert!(fill_opening_result.is_ok());

        let updated_opening_fill_opening = Hiring::opening_by_id(current_opening_id);

        assert_eq!(
            updated_opening_fill_opening,
            Opening {
                created: 1,
                stage: OpeningStage::Active {
                    stage: ActiveOpeningStage::Deactivated {
                        cause: OpeningDeactivationCause::Filled,
                        deactivated_at_block: 1,
                        started_accepting_applicants_at_block: 1,
                        started_review_period_at_block: Some(1)
                    },
                    applications_added: BTreeSet::new(),
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

        let current_application_id = new_application_id;
        let application_after_fill_opening = Hiring::application_by_id(current_application_id);

        assert_eq!(
            application_after_fill_opening,
            Application {
                opening_id: 0,
                application_index_in_opening: 0,
                add_to_opening_in_block: 1,
                active_role_staking_id: None,
                active_application_staking_id: None,
                stage: ApplicationStage::Inactive {
                    deactivation_initiated: 1,
                    deactivated: 1,
                    cause: ApplicationDeactivationCause::Hired
                },
                human_readable_text: application_readable_text.clone()
            }
        );
    });
}
