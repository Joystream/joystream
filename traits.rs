// council
pub trait WeightInfo {
	fn set_budget_increment() -> Weight;
	fn set_councilor_reward() -> Weight;
	fn funding_request() -> Weight;
	fn try_process_budget() -> Weight;
	fn try_progress_stage_idle() -> Weight;
	fn try_progress_stage_announcing_start_election(i: u32, ) -> Weight;
	fn try_progress_stage_announcing_restart() -> Weight;
	fn announce_candidacy() -> Weight;
	fn release_candidacy_stake() -> Weight;
	fn set_candidacy_note(i: u32, ) -> Weight;
	fn withdraw_candidacy() -> Weight;
	fn set_budget() -> Weight;
	fn plan_budget_refill() -> Weight;
}
