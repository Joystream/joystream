use node_runtime::council::{CouncilStageUpdate, Trait as CouncilTrait};
use node_runtime::referendum::ReferendumStage;
use node_runtime::{NewCouncilConfig, ReferendumConfig, Runtime};

pub fn create_council_config() -> NewCouncilConfig {
    NewCouncilConfig {
        stage: CouncilStageUpdate::default(),
        council_members: vec![],
        candidates: vec![],
        announcement_period_nr: 0,
        budget: 0,
        next_reward_payments: 0,
        next_budget_refill: <Runtime as CouncilTrait>::BudgetRefillPeriod::get(),
    }
}

pub fn create_referendum_config() -> ReferendumConfig {
    ReferendumConfig {
        stage: ReferendumStage::default(),
        votes: vec![],
    }
}
