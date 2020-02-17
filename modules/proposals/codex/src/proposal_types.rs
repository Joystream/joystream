use codec::{Decode, Encode};
use num_enum::{IntoPrimitive, TryFromPrimitive};
use rstd::convert::TryFrom;
use rstd::prelude::*;

use rstd::str::from_utf8;
use srml_support::{dispatch, print};

use crate::{ProposalCodeDecoder, ProposalExecutable};

/// Defines allowed proposals types. Integer value serves as proposal_type_id.
#[derive(Debug, Eq, PartialEq, TryFromPrimitive, IntoPrimitive)]
#[repr(u32)]
pub enum ProposalType {
    /// Text(signal) proposal type
    Text = 1,
}

impl ProposalType {
    fn compose_executable(
        &self,
        proposal_data: Vec<u8>,
    ) -> Result<Box<dyn ProposalExecutable>, &'static str> {
        match self {
            ProposalType::Text => TextProposalExecutable::decode(&mut &proposal_data[..])
                .map_err(|err| err.what())
                .map(|obj| Box::new(obj) as Box<dyn ProposalExecutable>),
        }
    }
}

impl ProposalCodeDecoder for ProposalType {
    fn decode_proposal(
        proposal_type: u32,
        proposal_code: Vec<u8>,
    ) -> Result<Box<dyn ProposalExecutable>, &'static str> {
        Self::try_from(proposal_type)
            .map_err(|_| "Unsupported proposal type")?
            .compose_executable(proposal_code)
    }
}

/// Text (signal) proposal executable code wrapper. Prints its content on execution.
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Default)]
pub struct TextProposalExecutable {
    /// Text proposal title
    pub title: Vec<u8>,

    /// Text proposal body (description)
    pub body: Vec<u8>,

    /// Text proposal main text
    pub text: Vec<u8>,
}

impl TextProposalExecutable {
    /// Converts text proposal type to proposal_type_id
    pub fn proposal_type(&self) -> u32 {
        ProposalType::Text.into()
    }
}

impl ProposalExecutable for TextProposalExecutable {
    fn execute(&self) -> dispatch::Result {
        print("Proposal: ");
        print(from_utf8(self.title.as_slice()).unwrap());
        print("Description:");
        print(from_utf8(self.body.as_slice()).unwrap());

        Ok(())
    }
}
