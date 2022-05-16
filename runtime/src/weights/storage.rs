//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl storage::WeightInfo for WeightInfo {
    fn delete_storage_bucket() -> Weight {
        (317_413_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_uploading_blocked_status() -> Weight {
        (189_782_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_data_size_fee() -> Weight {
        (196_115_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_storage_buckets_per_bag_limit() -> Weight {
        (182_889_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_storage_buckets_voucher_max_limits() -> Weight {
        (190_419_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_number_of_storage_buckets_in_dynamic_bag_creation_policy() -> Weight {
        (232_678_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_blacklist(i: u32, j: u32) -> Weight {
        (13_645_053_000 as Weight)
            .saturating_add((83_597_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((37_380_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(j as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
    }
    fn create_storage_bucket() -> Weight {
        (240_467_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_storage_buckets_for_bag(i: u32, j: u32) -> Weight {
        (270_490_000 as Weight)
            .saturating_add((269_565_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((212_258_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(j as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(j as Weight)))
    }
    fn cancel_storage_bucket_operator_invite() -> Weight {
        (297_014_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn invite_storage_bucket_operator() -> Weight {
        (422_034_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn remove_storage_bucket_operator() -> Weight {
        (346_469_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_storage_bucket_status() -> Weight {
        (292_900_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_storage_bucket_voucher_limits() -> Weight {
        (305_285_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn accept_storage_bucket_invitation() -> Weight {
        (296_288_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_storage_operator_metadata(i: u32) -> Weight {
        (278_785_000 as Weight)
            .saturating_add((165_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
    }
    fn accept_pending_data_objects(i: u32) -> Weight {
        (291_655_000 as Weight)
            .saturating_add((140_696_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
    }
    fn create_distribution_bucket_family() -> Weight {
        (222_147_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn delete_distribution_bucket_family() -> Weight {
        (426_333_000 as Weight)
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn create_distribution_bucket() -> Weight {
        (356_622_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_distribution_bucket_status() -> Weight {
        (281_274_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn delete_distribution_bucket() -> Weight {
        (318_750_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_distribution_buckets_for_bag(i: u32, j: u32) -> Weight {
        (0 as Weight)
            .saturating_add((138_846_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((162_318_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(j as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(j as Weight)))
    }
    fn update_distribution_buckets_per_bag_limit() -> Weight {
        (194_614_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_distribution_bucket_mode() -> Weight {
        (279_984_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_families_in_dynamic_bag_creation_policy(i: u32) -> Weight {
        (239_918_000 as Weight)
            .saturating_add((44_315_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn invite_distribution_bucket_operator() -> Weight {
        (416_879_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn cancel_distribution_bucket_operator_invite() -> Weight {
        (291_868_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn remove_distribution_bucket_operator() -> Weight {
        (295_730_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_distribution_bucket_family_metadata(i: u32) -> Weight {
        (228_419_000 as Weight)
            .saturating_add((175_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
    }
    fn accept_distribution_bucket_invitation() -> Weight {
        (300_696_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_distribution_operator_metadata(i: u32) -> Weight {
        (248_844_000 as Weight)
            .saturating_add((210_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
    }
    fn storage_operator_remark(i: u32) -> Weight {
        (301_223_000 as Weight)
            .saturating_add((147_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
    }
    fn distribution_operator_remark(i: u32) -> Weight {
        (273_244_000 as Weight)
            .saturating_add((136_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
    }
}
