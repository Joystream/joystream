#![warn(missing_docs)]

pub(crate) mod parameters;

use codec::{Decode, Encode};
use rstd::vec::Vec;
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

use crate::ElectionParameters;

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

    /// The wasm code for the `runtime upgrade` proposal
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
}

impl<MintedBalance, CurrencyBalance, BlockNumber, AccountId, MemberId> Default
    for ProposalDetails<MintedBalance, CurrencyBalance, BlockNumber, AccountId, MemberId>
{
    fn default() -> Self {
        ProposalDetails::Text(b"invalid proposal details".to_vec())
    }
}

/// Contains proposal config parameters. Default values are used by migration and genesis config.
pub struct ProposalsConfigParameters {
    /// 'Set validator count' proposal voting period
    pub set_validator_count_proposal_voting_period: u32,

    /// 'Set validator count' proposal grace period
    pub set_validator_count_proposal_grace_period: u32,

    /// 'Runtime upgrade' proposal voting period
    pub runtime_upgrade_proposal_voting_period: u32,

    /// 'Runtime upgrade' proposal grace period
    pub runtime_upgrade_proposal_grace_period: u32,

    /// 'Text' proposal voting period
    pub text_proposal_voting_period: u32,

    /// 'Text' proposal grace period
    pub text_proposal_grace_period: u32,

    /// 'Set election parameters' proposal voting period
    pub set_election_parameters_proposal_voting_period: u32,

    /// 'Set election parameters' proposal grace period
    pub set_election_parameters_proposal_grace_period: u32,

    /// 'Set content working group mint capacity' proposal voting period
    pub set_content_working_group_mint_capacity_proposal_voting_period: u32,

    /// 'Set content working group mint capacity' proposal grace period
    pub set_content_working_group_mint_capacity_proposal_grace_period: u32,

    /// 'Set lead' proposal voting period
    pub set_lead_proposal_voting_period: u32,

    /// 'Set lead' proposal grace period
    pub set_lead_proposal_grace_period: u32,

    /// 'Spending' proposal voting period
    pub spending_proposal_voting_period: u32,

    /// 'Spending' proposal grace period
    pub spending_proposal_grace_period: u32,

    /// 'Evict storage provider' proposal voting period
    pub evict_storage_provider_proposal_voting_period: u32,

    /// 'Evict storage provider' proposal grace period
    pub evict_storage_provider_proposal_grace_period: u32,
}

impl Default for ProposalsConfigParameters {
    fn default() -> Self {
        ProposalsConfigParameters {
            set_validator_count_proposal_voting_period: 43200u32,
            set_validator_count_proposal_grace_period: 0u32,
            runtime_upgrade_proposal_voting_period: 72000u32,
            runtime_upgrade_proposal_grace_period: 72000u32,
            text_proposal_voting_period: 72000u32,
            text_proposal_grace_period: 0u32,
            set_election_parameters_proposal_voting_period: 72000u32,
            set_election_parameters_proposal_grace_period: 201_601_u32,
            set_content_working_group_mint_capacity_proposal_voting_period: 43200u32,
            set_content_working_group_mint_capacity_proposal_grace_period: 0u32,
            set_lead_proposal_voting_period: 43200u32,
            set_lead_proposal_grace_period: 0u32,
            spending_proposal_voting_period: 72000u32,
            spending_proposal_grace_period: 14400u32,
            evict_storage_provider_proposal_voting_period: 43200u32,
            evict_storage_provider_proposal_grace_period: 0u32,
        }
    }
}
