mod add_application;
mod add_opening;
mod deactivate_application;

mod begin_accepting_applications;
mod begin_review;
mod cancel_opening;
mod ensure_can_add_application;
mod fill_opening;
mod on_finalize;
mod unstaked;

pub use add_application::AddApplicationFixture;
pub use add_opening::{AddOpeningFixture, HUMAN_READABLE_TEXT};
pub use deactivate_application::DeactivateApplicationFixture;

use crate::mock::Test;
use sp_std::cell::RefCell;
use sp_std::collections::btree_map::BTreeMap;
use sp_std::rc::Rc;

fn default_mock_for_creating_stake() -> Rc<RefCell<crate::MockStakeHandler<Test>>> {
    let mut mock = crate::MockStakeHandler::<Test>::new();

    mock.expect_stake().times(1).returning(|_, _| Ok(()));
    mock.expect_create_stake().times(1).returning(|| 0);

    Rc::new(sp_std::cell::RefCell::new(mock))
}

fn default_mock_for_unstaking() -> Rc<RefCell<crate::MockStakeHandler<Test>>> {
    let mut mock = crate::MockStakeHandler::<Test>::new();
    mock.expect_stake_exists().returning(|_| true);

    mock.expect_initiate_unstaking()
        .times(1)
        .returning(|_, _| Ok(()));

    mock.expect_get_stake().returning(|_| stake::Stake {
        created: 1,
        staking_status: stake::StakingStatus::Staked(stake::StakedState {
            staked_amount: 100,
            staked_status: stake::StakedStatus::Normal,
            next_slash_id: 0,
            ongoing_slashes: BTreeMap::new(),
        }),
    });

    Rc::new(RefCell::new(mock))
}
