use crate::Runtime;
use proposals_codex::{ProposalDetails, ProposalDetailsOf, ProposalEncoder, ProposalsEnabled};

pub struct ProposalsSelector;

#[cfg(not(feature = "runtime-benchmarks"))]
impl ProposalsEnabled<Runtime> for ProposalsSelector {
    fn is_proposal_enabled(proposal_details: &ProposalDetailsOf<Runtime>) -> bool {
        match proposal_details {
            ProposalDetailsOf::<Runtime>::UpdateGlobalNftLimit(..) => false,
            ProposalDetailsOf::<Runtime>::UpdateChannelPayouts(..) => false,
            _ => true,
        }
    }
}

#[cfg(feature = "runtime-benchmarks")]
impl ProposalsEnabled<Runtime> for ProposalsSelector {
    fn is_proposal_enabled(_proposal_details: &ProposalDetailsOf<Runtime>) -> bool {
        true
    }
}
