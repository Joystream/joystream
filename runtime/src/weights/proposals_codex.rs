//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{Weight, constants::RocksDbWeight as DbWeight};

pub struct WeightInfo;
impl proposals_codex::WeightInfo for WeightInfo {
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_signal(i: u32, d: u32, ) -> Weight {
		(3_903_309_000 as Weight)
			.saturating_add((781_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((853_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_runtime_upgrade(i: u32, d: u32, ) -> Weight {
		(1_555_422_000 as Weight)
			.saturating_add((1_128_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((1_740_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_funding_request(i: u32, d: u32, ) -> Weight {
		(1_386_615_000 as Weight)
			.saturating_add((36_876_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((554_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_max_validator_count(t: u32, d: u32, ) -> Weight {
		(1_189_280_000 as Weight)
			.saturating_add((11_312_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((377_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(8 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_veto_proposal(t: u32, d: u32, ) -> Weight {
		(965_948_000 as Weight)
			.saturating_add((13_844_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((401_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_create_working_group_lead_opening(i: u32, t: u32, d: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((681_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((24_849_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((778_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_fill_working_group_lead_opening(d: u32, ) -> Weight {
		(2_084_931_000 as Weight)
			.saturating_add((165_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_update_working_group_budget(t: u32, d: u32, ) -> Weight {
		(1_291_827_000 as Weight)
			.saturating_add((599_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((353_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_decrease_working_group_lead_stake(d: u32, ) -> Weight {
		(1_474_370_000 as Weight)
			.saturating_add((291_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_slash_working_group_lead(d: u32, ) -> Weight {
		(1_619_955_000 as Weight)
			.saturating_add((289_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_working_group_lead_reward(t: u32, d: u32, ) -> Weight {
		(1_171_171_000 as Weight)
			.saturating_add((1_151_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((318_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_terminate_working_group_lead(t: u32, d: u32, ) -> Weight {
		(1_133_994_000 as Weight)
			.saturating_add((3_236_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((327_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_amend_constitution(i: u32, d: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((559_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((824_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_cancel_working_group_lead_opening(t: u32, d: u32, ) -> Weight {
		(725_661_000 as Weight)
			.saturating_add((11_445_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((421_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_membership_price(t: u32, d: u32, ) -> Weight {
		(1_521_682_000 as Weight)
			.saturating_add((547_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((183_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_council_budget_increment(t: u32, d: u32, ) -> Weight {
		(1_170_480_000 as Weight)
			.saturating_add((894_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((290_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_councilor_reward(t: u32, d: u32, ) -> Weight {
		(1_130_765_000 as Weight)
			.saturating_add((2_280_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((295_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_initial_invitation_balance(t: u32, d: u32, ) -> Weight {
		(314_698_000 as Weight)
			.saturating_add((16_838_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((623_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_set_initial_invitation_count(d: u32, ) -> Weight {
		(3_802_967_000 as Weight)
			.saturating_add((291_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_set_membership_lead_invitation_quota(d: u32, ) -> Weight {
		(2_227_025_000 as Weight)
			.saturating_add((318_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_set_referral_cut(d: u32, ) -> Weight {
		(1_962_695_000 as Weight)
			.saturating_add((527_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_create_blog_post(d: u32, h: u32, b: u32, ) -> Weight {
		(6_227_278_000 as Weight)
			.saturating_add((528_000 as Weight).saturating_mul(d as Weight))
			.saturating_add((450_000 as Weight).saturating_mul(h as Weight))
			.saturating_add((581_000 as Weight).saturating_mul(b as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_edit_blog_post(t: u32, d: u32, h: u32, b: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((194_027_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((1_381_000 as Weight).saturating_mul(d as Weight))
			.saturating_add((566_000 as Weight).saturating_mul(h as Weight))
			.saturating_add((367_000 as Weight).saturating_mul(b as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_lock_blog_post(t: u32, d: u32, ) -> Weight {
		(1_433_065_000 as Weight)
			.saturating_add((16_661_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((321_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_unlock_blog_post(t: u32, d: u32, ) -> Weight {
		(1_182_678_000 as Weight)
			.saturating_add((1_117_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((306_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_veto_bounty(d: u32, ) -> Weight {
		(1_244_851_000 as Weight)
			.saturating_add((292_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_withdraw_bounty_funding(t: u32, d: u32, ) -> Weight {
		(1_187_290_000 as Weight)
			.saturating_add((674_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((287_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
}
