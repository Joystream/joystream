//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{Weight, constants::RocksDbWeight as DbWeight};

pub struct WeightInfo;
impl proposals_codex::WeightInfo for WeightInfo {
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_signal(i: u32, d: u32, ) -> Weight {
		(414_054_000 as Weight)
			.saturating_add((615_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((675_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_runtime_upgrade(i: u32, d: u32, ) -> Weight {
		(340_375_000 as Weight)
			.saturating_add((613_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((714_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_funding_request(i: u32, d: u32, ) -> Weight {
		(2_041_052_000 as Weight)
			.saturating_add((41_129_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((175_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_set_max_validator_count(d: u32, ) -> Weight {
		(1_541_545_000 as Weight)
			.saturating_add((354_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(8 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_veto_proposal(t: u32, d: u32, ) -> Weight {
		(1_419_790_000 as Weight)
			.saturating_add((1_787_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((356_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_create_working_group_lead_opening(i: u32, t: u32, d: u32, ) -> Weight {
		(613_646_000 as Weight)
			.saturating_add((681_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((2_483_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((546_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_fill_working_group_lead_opening(t: u32, d: u32, ) -> Weight {
		(1_446_233_000 as Weight)
			.saturating_add((199_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((350_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_update_working_group_budget(t: u32, d: u32, ) -> Weight {
		(1_293_274_000 as Weight)
			.saturating_add((2_283_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((385_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_decrease_working_group_lead_stake(d: u32, ) -> Weight {
		(1_437_517_000 as Weight)
			.saturating_add((345_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_slash_working_group_lead(t: u32, d: u32, ) -> Weight {
		(1_375_714_000 as Weight)
			.saturating_add((1_254_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((347_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_working_group_lead_reward(t: u32, d: u32, ) -> Weight {
		(1_307_801_000 as Weight)
			.saturating_add((2_552_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((360_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_terminate_working_group_lead(t: u32, d: u32, ) -> Weight {
		(1_394_079_000 as Weight)
			.saturating_add((638_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((366_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_amend_constitution(i: u32, t: u32, d: u32, ) -> Weight {
		(348_400_000 as Weight)
			.saturating_add((591_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((2_231_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((644_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_cancel_working_group_lead_opening(d: u32, ) -> Weight {
		(1_456_290_000 as Weight)
			.saturating_add((334_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_membership_price(t: u32, d: u32, ) -> Weight {
		(1_322_446_000 as Weight)
			.saturating_add((1_900_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((350_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_council_budget_increment(t: u32, d: u32, ) -> Weight {
		(1_421_681_000 as Weight)
			.saturating_add((780_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((343_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_councilor_reward(t: u32, d: u32, ) -> Weight {
		(1_293_820_000 as Weight)
			.saturating_add((3_909_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((367_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_initial_invitation_balance(t: u32, d: u32, ) -> Weight {
		(1_370_362_000 as Weight)
			.saturating_add((2_382_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((354_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_initial_invitation_count(t: u32, d: u32, ) -> Weight {
		(1_438_050_000 as Weight)
			.saturating_add((1_358_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((353_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_membership_lead_invitation_quota(t: u32, d: u32, ) -> Weight {
		(1_460_414_000 as Weight)
			.saturating_add((283_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((359_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_set_referral_cut(t: u32, d: u32, ) -> Weight {
		(1_392_708_000 as Weight)
			.saturating_add((1_513_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((359_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_create_blog_post(t: u32, d: u32, h: u32, b: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((52_953_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((1_321_000 as Weight).saturating_mul(d as Weight))
			.saturating_add((483_000 as Weight).saturating_mul(h as Weight))
			.saturating_add((555_000 as Weight).saturating_mul(b as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_edit_blog_post(t: u32, d: u32, h: u32, b: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((50_337_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((1_483_000 as Weight).saturating_mul(d as Weight))
			.saturating_add((465_000 as Weight).saturating_mul(h as Weight))
			.saturating_add((556_000 as Weight).saturating_mul(b as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	fn create_proposal_lock_blog_post(t: u32, d: u32, ) -> Weight {
		(1_378_362_000 as Weight)
			.saturating_add((2_250_000 as Weight).saturating_mul(t as Weight))
			.saturating_add((368_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_unlock_blog_post(d: u32, ) -> Weight {
		(1_471_029_000 as Weight)
			.saturating_add((358_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_veto_bounty(d: u32, ) -> Weight {
		(1_517_260_000 as Weight)
			.saturating_add((330_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
	// WARNING! Some components were not used: ["t"]
	fn create_proposal_withdraw_bounty_funding(d: u32, ) -> Weight {
		(1_458_404_000 as Weight)
			.saturating_add((353_000 as Weight).saturating_mul(d as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(9 as Weight))
	}
}
