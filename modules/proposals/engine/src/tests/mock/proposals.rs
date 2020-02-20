use codec::{Decode, Encode};
use num_enum::{IntoPrimitive, TryFromPrimitive};
use rstd::convert::TryFrom;
use rstd::prelude::*;

use srml_support::dispatch;

use crate::{ProposalCodeDecoder, ProposalExecutable};

use super::*;

/// Defines allowed proposals types. Integer value serves as proposal_type_id.
#[derive(Debug, Eq, PartialEq, TryFromPrimitive, IntoPrimitive)]
#[repr(u32)]
pub enum ProposalType {
    /// Dummy(Text) proposal type
    Dummy = 1,

    /// Testing proposal type for faults
    Faulty = 10001,
}

impl ProposalType {
    fn compose_executable(
        &self,
        proposal_data: Vec<u8>,
    ) -> Result<Box<dyn ProposalExecutable>, &'static str> {
        match self {
            ProposalType::Dummy => DummyExecutable::decode(&mut &proposal_data[..])
                .map_err(|err| err.what())
                .map(|obj| Box::new(obj) as Box<dyn ProposalExecutable>),
            ProposalType::Faulty => FaultyExecutable::decode(&mut &proposal_data[..])
                .map_err(|err| err.what())
                .map(|obj| Box::new(obj) as Box<dyn ProposalExecutable>),
        }
    }
}

impl ProposalCodeDecoder<Test> for ProposalType {
    fn decode_proposal(
        proposal_type: u32,
        proposal_code: Vec<u8>,
    ) -> Result<Box<dyn ProposalExecutable>, &'static str> {
        Self::try_from(proposal_type)
            .map_err(|_| "Unsupported proposal type")?
            .compose_executable(proposal_code)
    }
}

/// Testing proposal type
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Default)]
pub struct DummyExecutable {
    pub title: Vec<u8>,
    pub body: Vec<u8>,
}

impl DummyExecutable {
    pub fn proposal_type(&self) -> u32 {
        ProposalType::Dummy.into()
    }
}

impl ProposalExecutable for DummyExecutable {
    fn execute(&self) -> dispatch::Result {
        Ok(())
    }
}

/// Faulty proposal executable code wrapper. Used for failed proposal execution tests.
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Default)]
pub struct FaultyExecutable;
impl ProposalExecutable for FaultyExecutable {
    fn execute(&self) -> dispatch::Result {
        Err("ExecutionFailed")
    }
}

impl FaultyExecutable {
    /// Converts faulty proposal type to proposal_type_id
    pub fn proposal_type(&self) -> u32 {
        ProposalType::Faulty.into()
    }
}
