pub(crate) mod parameters;

use codec::{Decode, Encode};
use rstd::vec::Vec;
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

use crate::ElectionParameters;

/// Proposal details provide voters the information required for the perceived voting.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Debug)]
pub enum ProposalDetails<MintedBalance, CurrencyBalance, BlockNumber, AccountId, MemberId> {
    /// The text of the `text proposal`
    Text(Vec<u8>),

    /// The hash of wasm code for the `runtime upgrade proposal`
    RuntimeUpgrade(Vec<u8>),

    /// Election parameters for the `set election parameters proposal`
    SetElectionParameters(ElectionParameters<CurrencyBalance, BlockNumber>),

    /// Balance and destination account for the `spending proposal`
    Spending(MintedBalance, AccountId),

    /// New leader memberId and account_id for the `set lead proposal`
    SetLead(Option<(MemberId, AccountId)>),

    /// Balance for the `set council mint capacity proposal`
    SetCouncilMintCapacity(MintedBalance),

    /// Balance for the `set content working group mint capacity proposal`
    SetContentWorkingGroupMintCapacity(MintedBalance),
}

impl<MintedBalance, CurrencyBalance, BlockNumber, AccountId, MemberId> Default
    for ProposalDetails<MintedBalance, CurrencyBalance, BlockNumber, AccountId, MemberId>
{
    fn default() -> Self {
        ProposalDetails::Text(b"invalid proposal details".to_vec())
    }
}
