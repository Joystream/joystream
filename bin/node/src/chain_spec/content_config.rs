use node_runtime::{
    constants::{currency, MINUTES},
    days, dollars, hours, ChannelStateBloatBondValue, ContentConfig, ExpectedBlockTime,
    VideoStateBloatBondValue,
};
use sp_runtime::Perbill;

pub fn production_config() -> ContentConfig {
    ContentConfig {
        next_curator_group_id: 1,
        next_channel_id: 1,
        next_video_id: 1,
        next_transfer_id: 1,
        max_cashout_allowed: dollars!(100_000),
        min_cashout_allowed: dollars!(10),
        channel_cashouts_enabled: true,
        min_auction_duration: hours!(1),
        max_auction_duration: days!(30),
        min_auction_extension_period: 0,
        max_auction_extension_period: days!(30),
        min_bid_lock_duration: 0,
        max_bid_lock_duration: hours!(1),
        min_starting_price: dollars!(1),
        max_starting_price: dollars!(500_000),
        min_creator_royalty: Perbill::from_percent(0),
        max_creator_royalty: Perbill::from_percent(10),
        min_bid_step: dollars!(1),
        max_bid_step: dollars!(10_000),
        platform_fee_percentage: Perbill::from_percent(2),
        auction_starts_at_max_delta: days!(100),
        nft_limits_enabled: true,
        channel_state_bloat_bond_value: ChannelStateBloatBondValue::get(),
        video_state_bloat_bond_value: VideoStateBloatBondValue::get(),
    }
}

pub fn testing_config() -> ContentConfig {
    ContentConfig {
        next_curator_group_id: 1,
        next_channel_id: 1,
        next_video_id: 1,
        next_transfer_id: 1,
        max_cashout_allowed: dollars!(100_000),
        min_cashout_allowed: dollars!(10),
        channel_cashouts_enabled: true,
        min_auction_duration: MINUTES,
        max_auction_duration: days!(30),
        min_auction_extension_period: 0,
        max_auction_extension_period: days!(30),
        min_bid_lock_duration: 0,
        max_bid_lock_duration: hours!(1),
        min_starting_price: dollars!(1),
        max_starting_price: dollars!(500_000),
        min_creator_royalty: Perbill::from_percent(0),
        max_creator_royalty: Perbill::from_percent(10),
        min_bid_step: dollars!(1),
        max_bid_step: dollars!(10_000),
        platform_fee_percentage: Perbill::from_percent(2),
        auction_starts_at_max_delta: days!(100),
        nft_limits_enabled: false,
        channel_state_bloat_bond_value: ChannelStateBloatBondValue::get(),
        video_state_bloat_bond_value: VideoStateBloatBondValue::get(),
    }
}
