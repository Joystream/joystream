//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{Weight, constants::RocksDbWeight as DbWeight};

pub struct WeightInfo;
impl proposals_codex::WeightInfo for WeightInfo {
	fn create_proposal_signal(i: u32, t: u32, d: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((549_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((10_247_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((572_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_runtime_upgrade(i: u32, t: u32, d: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((561_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((10_816_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((678_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_funding_request(i: u32, d: u32, ) -> Weight {
		(1_418_107_000 as Weight)
			.saturating_add((36_533_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((262_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_max_validator_count(t: u32, d: u32, ) -> Weight {
		(1_073_987_000 as Weight)
			.saturating_add((5_532_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((369_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(8 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_veto_proposal(d: u32, ) -> Weight {
		(1_848_148_000 as Weight)
			.saturating_add((272_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_create_working_group_lead_opening(i: u32, t: u32, d: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((718_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((50_149_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((1_029_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_fill_working_group_lead_opening(d: u32, ) -> Weight {
		(1_498_001_000 as Weight)
			.saturating_add((663_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_update_working_group_budget(t: u32, d: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((29_301_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((844_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_decrease_working_group_lead_stake(t: u32, d: u32, ) -> Weight {
		(609_999_000 as Weight)
			.saturating_add((21_091_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((666_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_slash_working_group_lead(d: u32, ) -> Weight {
		(1_813_512_000 as Weight)
			.saturating_add((271_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_set_working_group_lead_reward(d: u32, ) -> Weight {
		(2_115_508_000 as Weight)
			.saturating_add((449_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_terminate_working_group_lead(d: u32, ) -> Weight {
		(1_686_171_000 as Weight)
			.saturating_add((356_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_amend_constitution(i: u32, t: u32, d: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((648_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((10_232_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((1_255_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_cancel_working_group_lead_opening(t: u32, d: u32, ) -> Weight {
		(1_486_113_000 as Weight)
			.saturating_add((4_763_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((248_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_set_membership_price(d: u32, ) -> Weight {
		(1_842_678_000 as Weight)
			.saturating_add((247_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_council_budget_increment(t: u32, d: u32, ) -> Weight {
		(855_500_000 as Weight)
			.saturating_add((10_440_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((526_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_set_councilor_reward(d: u32, ) -> Weight {
		(1_588_567_000 as Weight)
			.saturating_add((346_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_initial_invitation_balance(t: u32, d: u32, ) -> Weight {
		(228_836_000 as Weight)
			.saturating_add((26_831_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((601_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_initial_invitation_count(t: u32, d: u32, ) -> Weight {
		(1_742_872_000 as Weight)
			.saturating_add((175_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((524_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_set_membership_lead_invitation_quota(d: u32, ) -> Weight {
		(1_329_579_000 as Weight)
			.saturating_add((706_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_referral_cut(t: u32, d: u32, ) -> Weight {
		(1_284_161_000 as Weight)
			.saturating_add((6_727_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((367_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_create_blog_post(d: u32, h: u32, b: u32, ) -> Weight {
		(2_911_771_000 as Weight)
			.saturating_add((1_247_000 as Weight).saturating_mul(d as Weight))
			.saturating_add((428_000 as Weight).saturating_mul(h as Weight))
			.saturating_add((535_000 as Weight).saturating_mul(b as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_edit_blog_post(t: u32, d: u32, h: u32, b: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((71_642_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((1_848_000 as Weight).saturating_mul(d as Weight))
			.saturating_add((579_000 as Weight).saturating_mul(h as Weight))
			.saturating_add((577_000 as Weight).saturating_mul(b as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_lock_blog_post(d: u32, ) -> Weight {
		(1_822_698_000 as Weight)
			.saturating_add((334_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_unlock_blog_post(t: u32, d: u32, ) -> Weight {
		(853_790_000 as Weight)
			.saturating_add((14_283_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((563_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
}
