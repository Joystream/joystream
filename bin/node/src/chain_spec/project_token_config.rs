use node_runtime::{
    days, hours, ExpectedBlockTime, ProjectTokenAccountBloatBond, ProjectTokenConfig,
};
use sp_runtime::Permill;

pub fn production_config() -> ProjectTokenConfig {
    ProjectTokenConfig {
        next_token_id: 0,
        bloat_bond: ProjectTokenAccountBloatBond::get(),
        min_sale_duration: days!(1),
        min_revenue_split_duration: days!(21),
        min_revenue_split_time_to_start: 0,
        sale_platform_fee: Permill::from_percent(2),
        ..Default::default()
    }
}

pub fn testing_config() -> ProjectTokenConfig {
    ProjectTokenConfig {
        next_token_id: 0,
        bloat_bond: ProjectTokenAccountBloatBond::get(),
        min_sale_duration: 1,
        min_revenue_split_duration: 5,
        min_revenue_split_time_to_start: 0,
        sale_platform_fee: Permill::from_percent(2),
        ..Default::default()
    }
}
