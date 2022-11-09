use node_runtime::{
    constants::currency, council::CouncilStageUpdate, days, dollars, hours,
    monthly_dollars_to_per_block, Balance, CouncilConfig, ExpectedBlockTime,
};

pub fn create_council_config() -> CouncilConfig {
    CouncilConfig {
        stage: CouncilStageUpdate::default(),
        announcement_period_nr: 0,
        budget: 0,
        next_reward_payments: 0,
        next_budget_refill: 1,
        budget_increment: dollars!(22_000),
        councilor_reward: monthly_dollars_to_per_block!(10_000),
    }
}
