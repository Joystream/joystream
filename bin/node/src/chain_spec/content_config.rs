use node_runtime::{
    constants::{currency, ExistentialDeposit, DAYS, HOURS, MINUTES},
    ContentConfig,
};
use sp_runtime::Perbill;

pub fn production_config() -> ContentConfig {
    ContentConfig {
        next_curator_group_id: 1,
        next_channel_id: 1,
        next_video_id: 1,
        next_transfer_id: 1,
        max_cashout_allowed: 200_000_000_000_000_000,
        min_cashout_allowed: ExistentialDeposit::get(),
        channel_cashouts_enabled: true,
        min_auction_duration: MINUTES * 30,
        max_auction_duration: DAYS * 90,
        min_auction_extension_period: 0,
        max_auction_extension_period: HOURS * 6,
        min_bid_lock_duration: MINUTES * 1,
        max_bid_lock_duration: HOURS * 24,
        min_starting_price: ExistentialDeposit::get(),
        max_starting_price: 200_000_000_000_000_000,
        min_creator_royalty: Perbill::from_percent(1),
        max_creator_royalty: Perbill::from_percent(50),
        min_bid_step: ExistentialDeposit::get(),
        max_bid_step: 200_000_000_000_000_000,
        platform_fee_percentage: Perbill::from_percent(1),
        auction_starts_at_max_delta: DAYS * 30,
        max_auction_whitelist_length: 100,
        nft_limits_enabled: false,
        channel_state_bloat_bond_value: ExistentialDeposit::get() + 10 * currency::CENTS, // Must be higher than ExistentialDeposit!
        video_state_bloat_bond_value: 2 * currency::CENTS,
    }
}

pub fn testing_config() -> ContentConfig {
    ContentConfig {
        next_curator_group_id: 1,
        next_channel_id: 1,
        next_video_id: 1,
        next_transfer_id: 1,
        max_cashout_allowed: 200_000_000_000_000_000,
        min_cashout_allowed: ExistentialDeposit::get(),
        channel_cashouts_enabled: true,
        min_auction_duration: MINUTES / 2,
        max_auction_duration: DAYS * 90,
        min_auction_extension_period: 0,
        max_auction_extension_period: HOURS * 6,
        min_bid_lock_duration: MINUTES / 2,
        max_bid_lock_duration: HOURS * 24,
        min_starting_price: ExistentialDeposit::get(),
        max_starting_price: 200_000_000_000_000_000,
        min_creator_royalty: Perbill::from_percent(1),
        max_creator_royalty: Perbill::from_percent(50),
        min_bid_step: ExistentialDeposit::get(),
        max_bid_step: 200_000_000_000_000_000,
        platform_fee_percentage: Perbill::from_percent(1),
        auction_starts_at_max_delta: DAYS * 30,
        max_auction_whitelist_length: 100,
        nft_limits_enabled: false,
        channel_state_bloat_bond_value: ExistentialDeposit::get() + 10 * currency::CENTS, // Must be higher than ExistentialDeposit!
        video_state_bloat_bond_value: 2 * currency::CENTS,
    }
}
