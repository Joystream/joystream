use crate::Runtime;
use proposals_codex::{ProposalDetails, ProposalDetailsOf, ProposalEncoder, ProposalsEnabled};

pub struct ProposalsSelector;
impl ProposalsEnabled<Runtime> for ProposalsSelector {
    fn is_proposal_enabled(proposal_details: &ProposalDetailsOf<Runtime>) -> bool {
        match proposal_details {
            ProposalDetailsOf::<Runtime>::UpdateGlobalNftLimit(..) => false,
            ProposalDetailsOf::<Runtime>::UpdateChannelPayouts(..) => false,
            _ => true,
        }
    }
}
