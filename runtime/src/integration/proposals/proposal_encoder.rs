use crate::integration::proposals::MemberId;
use crate::*;
use proposals_codex::{ProposalDetails, ProposalEncoder};

pub struct ExtrinsicProposalEncoder;

impl ProposalEncoder<Runtime> for ExtrinsicProposalEncoder {
    fn encode_proposal(
        proposal_details: ProposalDetails<
            Balance,
            Balance,
            BlockNumber,
            AccountId,
            MemberId<Runtime>,
        >,
    ) -> Vec<u8> {
        match proposal_details {
            ProposalDetails::Text(text) => {
                crate::Call::ProposalsCodex(proposals_codex::Call::execute_text_proposal(text))
                    .encode()
            }
            _ => unreachable!(),
        }
    }
}
