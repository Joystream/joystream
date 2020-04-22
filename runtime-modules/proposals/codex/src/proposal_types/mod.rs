pub(crate) mod parameters;

use codec::{Decode, Encode};
use rstd::vec::Vec;
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

use crate::ElectionParameters;
use roles::actors::RoleParameters;

/// Encodes proposal using its details information.
pub trait ProposalEncoder<T: crate::Trait> {
    /// Encodes proposal using its details information.
    fn encode_proposal(proposal_details: ProposalDetailsOf<T>) -> Vec<u8>;
}

/// _ProposalDetails_ alias for type simplification
pub type ProposalDetailsOf<T> = ProposalDetails<
    crate::BalanceOfMint<T>,
    crate::BalanceOfGovernanceCurrency<T>,
    <T as system::Trait>::BlockNumber,
    <T as system::Trait>::AccountId,
    crate::MemberId<T>,
>;

/// Proposal details provide voters the information required for the perceived voting.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Debug)]
pub enum ProposalDetails<MintedBalance, CurrencyBalance, BlockNumber, AccountId, MemberId> {
    /// The text of the `text` proposal
    Text(Vec<u8>),

    /// The hash of wasm code for the `runtime upgrade` proposal. The runtime upgrade proposal has
    /// two proposal details: wasm and wasm hash. This is an exception for the optimization.
    RuntimeUpgradeHash(Vec<u8>),

    /// The wasm code for the `runtime upgrade` proposal. The runtime upgrade proposal has
    /// two proposal details: wasm and wasm hash. This is an exception for the optimization.
    RuntimeUpgrade(Vec<u8>),

    /// Election parameters for the `set election parameters` proposal
    SetElectionParameters(ElectionParameters<CurrencyBalance, BlockNumber>),

    /// Balance and destination account for the `spending` proposal
    Spending(MintedBalance, AccountId),

    /// New leader memberId and account_id for the `set lead` proposal
    SetLead(Option<(MemberId, AccountId)>),

    /// Balance for the `set content working group mint capacity` proposal
    SetContentWorkingGroupMintCapacity(MintedBalance),

    /// AccountId for the `evict storage provider` proposal
    EvictStorageProvider(AccountId),

    /// Validator count for the `set validator count` proposal
    SetValidatorCount(u32),

    /// Role parameters for the `set storage role parameters` proposal
    SetStorageRoleParameters(RoleParameters<CurrencyBalance, BlockNumber>),
}

impl<MintedBalance, CurrencyBalance, BlockNumber, AccountId, MemberId> Default
    for ProposalDetails<MintedBalance, CurrencyBalance, BlockNumber, AccountId, MemberId>
{
    fn default() -> Self {
        ProposalDetails::Text(b"invalid proposal details".to_vec())
    }
}
