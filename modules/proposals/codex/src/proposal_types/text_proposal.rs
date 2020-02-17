use codec::{Decode, Encode};
use rstd::prelude::*;

use rstd::str::from_utf8;
use srml_support::{dispatch, print};

use crate::{ProposalExecutable, ProposalType};

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
