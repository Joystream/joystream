//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{Weight, constants::RocksDbWeight as DbWeight};

pub struct WeightInfo;
impl proposals_codex::WeightInfo for WeightInfo {
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_signal(i: u32, d: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((722_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((486_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_runtime_upgrade(i: u32, d: u32, ) -> Weight {
		(898_727_000 as Weight)
			.saturating_add((540_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((521_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_funding_request(i: u32, d: u32, ) -> Weight {
		(1_817_412_000 as Weight)
			.saturating_add((35_017_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((123_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_max_validator_count(t: u32, d: u32, ) -> Weight {
		(1_162_998_000 as Weight)
			.saturating_add((1_653_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((384_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(8 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_veto_proposal(d: u32, ) -> Weight {
		(1_450_384_000 as Weight)
			.saturating_add((302_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_create_working_group_lead_opening(i: u32, t: u32, d: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((666_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((12_815_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((684_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_fill_working_group_lead_opening(d: u32, ) -> Weight {
		(1_547_002_000 as Weight)
			.saturating_add((256_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_update_working_group_budget(t: u32, d: u32, ) -> Weight {
		(1_174_815_000 as Weight)
			.saturating_add((3_575_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((367_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_decrease_working_group_lead_stake(d: u32, ) -> Weight {
		(1_545_987_000 as Weight)
			.saturating_add((333_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_slash_working_group_lead(d: u32, ) -> Weight {
		(1_332_220_000 as Weight)
			.saturating_add((339_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_set_working_group_lead_reward(d: u32, ) -> Weight {
		(1_721_498_000 as Weight)
			.saturating_add((291_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_terminate_working_group_lead(d: u32, ) -> Weight {
		(1_599_595_000 as Weight)
			.saturating_add((231_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_amend_constitution(i: u32, d: u32, ) -> Weight {
		(202_453_000 as Weight)
			.saturating_add((562_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((632_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_cancel_working_group_lead_opening(d: u32, ) -> Weight {
		(1_421_292_000 as Weight)
			.saturating_add((352_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_membership_price(t: u32, d: u32, ) -> Weight {
		(1_390_088_000 as Weight)
			.saturating_add((1_090_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((280_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_council_budget_increment(t: u32, d: u32, ) -> Weight {
		(1_071_431_000 as Weight)
			.saturating_add((5_095_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((372_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_councilor_reward(t: u32, d: u32, ) -> Weight {
		(1_222_881_000 as Weight)
			.saturating_add((2_370_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((379_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_initial_invitation_balance(t: u32, d: u32, ) -> Weight {
		(1_408_586_000 as Weight)
			.saturating_add((682_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((285_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_initial_invitation_count(t: u32, d: u32, ) -> Weight {
		(1_162_994_000 as Weight)
			.saturating_add((3_764_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((347_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_membership_lead_invitation_quota(d: u32, ) -> Weight {
		(1_354_398_000 as Weight)
			.saturating_add((303_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_referral_cut(t: u32, d: u32, ) -> Weight {
		(1_139_938_000 as Weight)
			.saturating_add((4_339_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((339_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_create_blog_post(t: u32, d: u32, h: u32, b: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((40_994_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((1_155_000 as Weight).saturating_mul(d as Weight))
			.saturating_add((460_000 as Weight).saturating_mul(h as Weight))
			.saturating_add((523_000 as Weight).saturating_mul(b as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_edit_blog_post(t: u32, d: u32, h: u32, b: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((59_295_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((1_234_000 as Weight).saturating_mul(d as Weight))
			.saturating_add((475_000 as Weight).saturating_mul(h as Weight))
			.saturating_add((527_000 as Weight).saturating_mul(b as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_lock_blog_post(d: u32, ) -> Weight {
		(1_392_776_000 as Weight)
			.saturating_add((368_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_unlock_blog_post(t: u32, d: u32, ) -> Weight {
		(1_474_112_000 as Weight)
			.saturating_add((577_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((280_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_veto_bounty(t: u32, d: u32, ) -> Weight {
		(1_130_290_000 as Weight)
			.saturating_add((4_088_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((386_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_withdraw_bounty_funding(d: u32, ) -> Weight {
		(1_592_947_000 as Weight)
			.saturating_add((339_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
}
