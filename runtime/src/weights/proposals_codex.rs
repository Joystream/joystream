//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{Weight, constants::RocksDbWeight as DbWeight};

pub struct WeightInfo;
impl proposals_codex::WeightInfo for WeightInfo {
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_signal(i: u32, d: u32, ) -> Weight {
		(605_974_000 as Weight)
			.saturating_add((532_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((501_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_runtime_upgrade(i: u32, t: u32, d: u32, ) -> Weight {
		(291_987_000 as Weight)
			.saturating_add((547_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((2_703_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((504_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_funding_request(i: u32, d: u32, ) -> Weight {
		(1_592_398_000 as Weight)
			.saturating_add((36_113_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((225_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_max_validator_count(t: u32, d: u32, ) -> Weight {
		(1_292_969_000 as Weight)
			.saturating_add((697_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((321_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(8 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_veto_proposal(t: u32, d: u32, ) -> Weight {
		(1_267_147_000 as Weight)
			.saturating_add((614_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((321_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_create_working_group_lead_opening(i: u32, t: u32, d: u32, ) -> Weight {
		(137_284_000 as Weight)
			.saturating_add((635_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((6_720_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((532_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_fill_working_group_lead_opening(t: u32, d: u32, ) -> Weight {
		(1_314_162_000 as Weight)
			.saturating_add((515_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((325_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_update_working_group_budget(t: u32, d: u32, ) -> Weight {
		(1_272_167_000 as Weight)
			.saturating_add((1_578_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((327_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_decrease_working_group_lead_stake(d: u32, ) -> Weight {
		(1_316_655_000 as Weight)
			.saturating_add((331_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_slash_working_group_lead(t: u32, d: u32, ) -> Weight {
		(1_231_232_000 as Weight)
			.saturating_add((2_292_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((335_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_working_group_lead_reward(t: u32, d: u32, ) -> Weight {
		(1_302_024_000 as Weight)
			.saturating_add((341_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((334_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_terminate_working_group_lead(t: u32, d: u32, ) -> Weight {
		(1_274_120_000 as Weight)
			.saturating_add((901_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((341_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_amend_constitution(i: u32, d: u32, ) -> Weight {
		(320_790_000 as Weight)
			.saturating_add((555_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((629_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_cancel_working_group_lead_opening(t: u32, d: u32, ) -> Weight {
		(1_254_180_000 as Weight)
			.saturating_add((1_486_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((324_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_membership_price(t: u32, d: u32, ) -> Weight {
		(1_240_223_000 as Weight)
			.saturating_add((1_268_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((329_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_set_council_budget_increment(d: u32, ) -> Weight {
		(1_334_929_000 as Weight)
			.saturating_add((314_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_councilor_reward(t: u32, d: u32, ) -> Weight {
		(1_178_006_000 as Weight)
			.saturating_add((2_257_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((336_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_set_initial_invitation_balance(d: u32, ) -> Weight {
		(1_372_648_000 as Weight)
			.saturating_add((310_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_set_initial_invitation_count(d: u32, ) -> Weight {
		(1_262_969_000 as Weight)
			.saturating_add((315_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_membership_lead_invitation_quota(t: u32, d: u32, ) -> Weight {
		(1_225_881_000 as Weight)
			.saturating_add((763_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((325_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_set_referral_cut(d: u32, ) -> Weight {
		(1_290_118_000 as Weight)
			.saturating_add((309_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_create_blog_post(t: u32, d: u32, h: u32, b: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((46_071_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((1_101_000 as Weight).saturating_mul(d as Weight))
			.saturating_add((426_000 as Weight).saturating_mul(h as Weight))
			.saturating_add((493_000 as Weight).saturating_mul(b as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_edit_blog_post(t: u32, d: u32, h: u32, b: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((35_503_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((987_000 as Weight).saturating_mul(d as Weight))
			.saturating_add((457_000 as Weight).saturating_mul(h as Weight))
			.saturating_add((491_000 as Weight).saturating_mul(b as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_lock_blog_post(d: u32, ) -> Weight {
		(1_322_056_000 as Weight)
			.saturating_add((311_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_unlock_blog_post(t: u32, d: u32, ) -> Weight {
		(1_252_224_000 as Weight)
			.saturating_add((1_251_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((313_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
}
