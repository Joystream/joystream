//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{Weight, constants::RocksDbWeight as DbWeight};

pub struct WeightInfo;
impl storage::WeightInfo for WeightInfo {
	fn delete_storage_bucket() -> Weight {
		(291_000_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn update_uploading_blocked_status() -> Weight {
		(224_000_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn update_data_size_fee() -> Weight {
		(230_000_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn update_storage_buckets_per_bag_limit() -> Weight {
		(208_000_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn update_storage_buckets_voucher_max_limits() -> Weight {
		(215_000_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(2 as Weight))
	}
	fn update_number_of_storage_buckets_in_dynamic_bag_creation_policy() -> Weight {
		(249_000_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn update_blacklist(i: u32, j: u32, ) -> Weight {
		(266_016_000 as Weight)
			.saturating_add((30_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((31_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn create_storage_bucket() -> Weight {
		(273_000_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(2 as Weight))
	}
	fn update_storage_buckets_for_bag(i: u32, j: u32, ) -> Weight {
		(398_012_000 as Weight)
			.saturating_add((300_857_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((223_934_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(j as Weight)))
			.saturating_add(DbWeight::get().writes(1 as Weight))
			.saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(j as Weight)))
	}
	fn cancel_storage_bucket_operator_invite() -> Weight {
		(329_000_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn invite_storage_bucket_operator() -> Weight {
		(519_000_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn remove_storage_bucket_operator() -> Weight {
		(373_000_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn update_storage_bucket_status() -> Weight {
		(348_000_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn set_storage_bucket_voucher_limits() -> Weight {
		(344_000_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn accept_storage_bucket_invitation() -> Weight {
		(337_000_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
}
