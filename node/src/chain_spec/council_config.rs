use node_runtime::council::{Config as CouncilTrait, CouncilStageUpdate};
use node_runtime::referendum::ReferendumStage;
use node_runtime::{CouncilConfig, ReferendumConfig, Runtime};

pub fn create_council_config() -> CouncilConfig {
    CouncilConfig {
        stage: CouncilStageUpdate::default(),
        council_members: vec![],
        candidates: vec![],
        announcement_period_nr: 0,
        budget: 0,
        next_reward_payments: 0,
        next_budget_refill: <Runtime as CouncilTrait>::BudgetRefillPeriod::get(),
        budget_increment: 1,
        councilor_reward: 100,
    }
}

pub fn create_referendum_config() -> ReferendumConfig {
    ReferendumConfig {
        stage: ReferendumStage::default(),
        votes: vec![],
    }
}
