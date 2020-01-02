use super::*;
use crate::mock::*;

use runtime_primitives::traits::OnFinalize;
use add_opening::AddOpeningFixture;

#[test]
fn on_finalize_should_work_on_empty_data() {
	build_test_externalities().execute_with(|| {
		<Module<Test> as OnFinalize<u64>>::on_finalize(42);
	});
}

#[test]
fn on_finalize_should_not_change_opening_prematurely() {
	build_test_externalities().execute_with(|| {
		let mut opening_fixture = AddOpeningFixture::default();
		opening_fixture.activate_at = ActivateOpeningAt::ExactBlock(2);
		let add_opening_result = opening_fixture.add_opening();
		let opening_id = add_opening_result.unwrap();

		let old_opening = <OpeningById<Test>>::get(opening_id);
		<Module<Test> as OnFinalize<u64>>::on_finalize(1);
		let new_opening = <OpeningById<Test>>::get(opening_id);

		assert_eq!(old_opening, new_opening);
	});
}

#[test]
fn on_finalize_should_change_waiting_to_begin_opening_stage_to_active_and_acception_application() {
	build_test_externalities().execute_with(|| {
		let mut opening_fixture = AddOpeningFixture::default();
		opening_fixture.activate_at = ActivateOpeningAt::ExactBlock(2);
		let add_opening_result = opening_fixture.add_opening();
		let opening_id = add_opening_result.unwrap();

		let old_opening = <OpeningById<Test>>::get(opening_id);
		// ensure preparation are valid
		if let OpeningStage::WaitingToBegin{..} = old_opening.stage {
			// expected
		} else {
			panic!("planned to be WaitingToBegin")
		}

		<Module<Test> as OnFinalize<u64>>::on_finalize(2);

		// ensure on_finalize worked
		let new_opening = <OpeningById<Test>>::get(opening_id);
		if let OpeningStage::Active {stage, ..} = new_opening.stage {
			if let ActiveOpeningStage::AcceptingApplications{..} = stage {
				// expected
			} else {
				panic!("expected to be AcceptingApplications")
			}
		} else {
			panic!("expected to be Active")
		}
	});
}
