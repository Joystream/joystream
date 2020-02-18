use codec::{Decode, Encode};
use rstd::marker::PhantomData;
use rstd::prelude::*;

use runtime_primitives::traits::ModuleDispatchError;
use srml_support::dispatch;

use crate::{ProposalExecutable, ProposalType};

/// Text (signal) proposal executable code wrapper. Prints its content on execution.
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Default)]
pub struct RuntimeUpgradeProposalExecutable<T> {
    /// Proposal title
    pub title: Vec<u8>,

    /// Proposal body (description)
    pub body: Vec<u8>,

    /// Text proposal main text
    pub wasm: Vec<u8>,

    /// Marker for the system::Trait. Required to execute runtime upgrade proposal on exact runtime.
    pub marker: PhantomData<T>,
}

impl<T> RuntimeUpgradeProposalExecutable<T> {
    /// Converts runtime proposal type to proposal_type_id
    pub fn proposal_type(&self) -> u32 {
        ProposalType::RuntimeUpgrade.into()
    }
}

impl<T: system::Trait> ProposalExecutable for RuntimeUpgradeProposalExecutable<T> {
    fn execute(&self) -> dispatch::Result {
        // Update wasm code of node's runtime:
        <system::Module<T>>::set_code(system::RawOrigin::Root.into(), self.wasm.clone())
            .map_err(|err| err.as_str())
    }
}
