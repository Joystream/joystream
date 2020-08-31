use crate::mock::*;
use crate::test::*;

use frame_support::traits::{OnFinalize, OnInitialize};

// Recommendation from Parity on testing on_finalize
// https://substrate.dev/docs/en/next/development/module/tests
fn run_to_block(n: u64) {
    while System::block_number() < n {
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        <Hiring as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
        <Hiring as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}

fn run_to_block_and_finalize(n: u64) {
    run_to_block(n);
    <Hiring as OnFinalize<u64>>::on_finalize(n);
}

#[test]
fn on_finalize_should_work_on_empty_data() {
    build_test_externalities().execute_with(|| {
        run_to_block_and_finalize(42);
    });
}

#[test]
fn on_finalize_should_not_change_opening_prematurely() {
    build_test_externalities().execute_with(|| {
        let opening_activation_block = 2;
        let mut opening_fixture = AddOpeningFixture::default();
        opening_fixture.activate_at = ActivateOpeningAt::ExactBlock(opening_activation_block);
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let old_opening = <OpeningById<Test>>::get(opening_id);

        let block_to_finalize = opening_activation_block - 1;
        run_to_block_and_finalize(block_to_finalize);

        let new_opening = <OpeningById<Test>>::get(opening_id);

        assert_eq!(old_opening, new_opening);
    });
}

#[test]
fn on_finalize_should_change_waiting_to_begin_opening_stage_to_active_and_acception_application() {
    build_test_externalities().execute_with(|| {
        let opening_activation_block = 2;
        let mut opening_fixture = AddOpeningFixture::default();
        opening_fixture.activate_at = ActivateOpeningAt::ExactBlock(opening_activation_block);
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let old_opening = <OpeningById<Test>>::get(opening_id);
        // ensure preparation are valid
        if let OpeningStage::WaitingToBegin { .. } = old_opening.stage {
            // expected
        } else {
            panic!("planned to be WaitingToBegin")
        }

        let block_to_finalize = opening_activation_block;
        run_to_block_and_finalize(block_to_finalize);

        // ensure on_finalize worked
        let new_opening = <OpeningById<Test>>::get(opening_id);
        if let OpeningStage::Active { stage, .. } = new_opening.stage {
            if let ActiveOpeningStage::AcceptingApplications { .. } = stage {
                // expected
            } else {
                panic!("should be AcceptingApplications")
            }
        } else {
            panic!("should be Active")
        }
    });
}

#[test]
fn on_finalize_should_not_change_opening_to_begin_review_stage_prematurely() {
    build_test_externalities().execute_with(|| {
        let mut opening_fixture = AddOpeningFixture::default();
        opening_fixture.max_review_period_length = 2;
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        assert!(Hiring::begin_review(opening_id).is_ok());

        let old_opening = <OpeningById<Test>>::get(opening_id);

        let block_to_finalize = opening_fixture.max_review_period_length - 1;
        run_to_block_and_finalize(block_to_finalize);

        let new_opening = <OpeningById<Test>>::get(opening_id);

        assert_eq!(old_opening, new_opening);
    });
}

#[test]
fn on_finalize_should_deactivate_opening_on_begin_review_stage() {
    build_test_externalities().execute_with(|| {
        let mut opening_fixture = AddOpeningFixture::default();
        opening_fixture.max_review_period_length = 2;
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        assert!(Hiring::begin_review(opening_id).is_ok());

        let old_opening = <OpeningById<Test>>::get(opening_id);
        if let OpeningStage::Active { stage, .. } = old_opening.stage {
            if let ActiveOpeningStage::ReviewPeriod { .. } = stage {
                // expected
            } else {
                panic!("should be BeginReview")
            }
        } else {
            panic!("should be Active")
        }

        let block_to_finalize = opening_fixture.max_review_period_length + 1;
        run_to_block_and_finalize(block_to_finalize);

        let new_opening = <OpeningById<Test>>::get(opening_id);
        if let OpeningStage::Active { stage, .. } = new_opening.stage {
            if let ActiveOpeningStage::Deactivated { .. } = stage {
                // expected
            } else {
                panic!("should be Deactivated")
            }
        } else {
            panic!("should be Active")
        }
    });
}

#[test]
fn on_finalize_should_deactivate_application_with_review_period_expired_cause() {
    build_test_externalities().execute_with(|| {
        let mut opening_fixture = AddOpeningFixture::default();
        opening_fixture.max_review_period_length = 2;
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        assert!(Hiring::begin_review(opening_id).is_ok());

        let old_application = <ApplicationById<Test>>::get(application_id);
        if let ApplicationStage::Active = old_application.stage {
            // expected
        } else {
            panic!("should be Active")
        }

        let block_to_finalize = opening_fixture.max_review_period_length + 1;
        run_to_block_and_finalize(block_to_finalize);

        let new_application = <ApplicationById<Test>>::get(application_id);
        if let ApplicationStage::Inactive { cause, .. } = new_application.stage {
            if let ApplicationDeactivationCause::ReviewPeriodExpired = cause {
                // expected
            } else {
                panic!("should be ReviewPeriodExpired")
            }
        } else {
            panic!("should be Active")
        }
    });
}
