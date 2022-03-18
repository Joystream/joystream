use node_runtime::{
    constants::{DAYS, HOURS, MINUTES},
    ContentConfig,
};
use sp_runtime::Perbill;

pub fn production_config() -> ContentConfig {
    ContentConfig {
        next_curator_group_id: 1,
        next_channel_category_id: 1,
        next_channel_id: 1,
        next_video_category_id: 1,
        next_video_id: 1,
        next_video_post_id: 1,
        max_reward_allowed: 1000,
        min_cashout_allowed: 1,
        min_auction_duration: MINUTES * 30,
        max_auction_duration: DAYS * 90,
        min_auction_extension_period: 0,
        max_auction_extension_period: HOURS * 6,
        min_bid_lock_duration: MINUTES * 1,
        max_bid_lock_duration: HOURS * 24,
        min_starting_price: 1,
        max_starting_price: 1_000_000_000,
        min_creator_royalty: Perbill::from_percent(1),
        max_creator_royalty: Perbill::from_percent(50),
        min_bid_step: 1,
        max_bid_step: 1_000_000,
        platform_fee_percentage: Perbill::from_percent(1),
        auction_starts_at_max_delta: DAYS * 30,
        max_auction_whitelist_length: 100,
    }
}

pub fn testing_config() -> ContentConfig {
    ContentConfig {
        next_curator_group_id: 1,
        next_channel_category_id: 1,
        next_channel_id: 1,
        next_video_category_id: 1,
        next_video_id: 1,
        next_video_post_id: 1,
        max_reward_allowed: 1000,
        min_cashout_allowed: 1,
        min_auction_duration: MINUTES / 2,
        max_auction_duration: DAYS * 90,
        min_auction_extension_period: 0,
        max_auction_extension_period: HOURS * 6,
        min_bid_lock_duration: MINUTES / 2,
        max_bid_lock_duration: HOURS * 24,
        min_starting_price: 1,
        max_starting_price: 1_000_000_000,
        min_creator_royalty: Perbill::from_percent(1),
        max_creator_royalty: Perbill::from_percent(50),
        min_bid_step: 1,
        max_bid_step: 1_000_000,
        platform_fee_percentage: Perbill::from_percent(1),
        auction_starts_at_max_delta: DAYS * 30,
        max_auction_whitelist_length: 100,
    }
}
