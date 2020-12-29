#![warn(missing_docs)]

mod council_origin_validator;
mod proposal_encoder;

pub use council_origin_validator::CouncilManager;
pub use proposal_encoder::ExtrinsicProposalEncoder;
