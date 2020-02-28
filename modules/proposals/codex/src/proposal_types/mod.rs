use codec::Decode;
use num_enum::{IntoPrimitive, TryFromPrimitive};
use rstd::convert::TryFrom;
use rstd::prelude::*;

use crate::{ProposalCodeDecoder, ProposalExecutable};

pub mod parameters;
mod runtime_upgrade;
mod text_proposal;

pub use runtime_upgrade::RuntimeUpgradeProposalExecutable;
pub use text_proposal::TextProposalExecutable;

/// Defines allowed proposals types. Integer value serves as proposal_type_id.
#[derive(Debug, Eq, PartialEq, TryFromPrimitive, IntoPrimitive)]
#[repr(u32)]
pub enum ProposalType {
    /// Text(signal) proposal type
    Text = 1,

    /// Runtime upgrade proposal type
    RuntimeUpgrade = 2,
}

impl ProposalType {
    fn compose_executable<T: system::Trait>(
        &self,
        proposal_data: Vec<u8>,
    ) -> Result<Box<dyn ProposalExecutable>, &'static str> {
        match self {
            ProposalType::Text => TextProposalExecutable::decode(&mut &proposal_data[..])
                .map_err(|err| err.what())
                .map(|obj| Box::new(obj) as Box<dyn ProposalExecutable>),
            ProposalType::RuntimeUpgrade => {
                <RuntimeUpgradeProposalExecutable<T>>::decode(&mut &proposal_data[..])
                    .map_err(|err| err.what())
                    .map(|obj| Box::new(obj) as Box<dyn ProposalExecutable>)
            }
        }
    }
}

impl<T: system::Trait> ProposalCodeDecoder<T> for ProposalType {
    fn decode_proposal(
        proposal_type: u32,
        proposal_code: Vec<u8>,
    ) -> Result<Box<dyn ProposalExecutable>, &'static str> {
        Self::try_from(proposal_type)
            .map_err(|_| "Unsupported proposal type")?
            .compose_executable::<T>(proposal_code)
    }
}
