//! # Proposals codex module
//! Proposals `codex` module for the Joystream platform. Version 2.
//! Component of the proposals system. It contains preset proposal types.
//!
//! ## Overview
//!
//! The proposals codex module serves as a facade and entry point of the proposals system. It uses
//! proposals `engine` module to maintain a lifecycle of the proposal and to execute proposals.
//! During the proposal creation, `codex` also create a discussion thread using the `discussion`
//! proposals module. `Codex` uses predefined parameters (eg.:`voting_period`) for each proposal and
//! encodes extrinsic calls from dependency modules in order to create proposals inside the `engine`
//! module. For each proposal, [its crucial details](./enum.ProposalDetails.html) are saved to the
//! `ProposalDetailsByProposalId` map.
//!
//! ### Supported extrinsics (proposal types)
//! - [create_text_proposal](./struct.Module.html#method.create_text_proposal)
//! - [create_runtime_upgrade_proposal](./struct.Module.html#method.create_runtime_upgrade_proposal)
//! - [create_set_election_parameters_proposal](./struct.Module.html#method.create_set_election_parameters_proposal)
//! - [create_set_council_mint_capacity_proposal](./struct.Module.html#method.create_set_council_mint_capacity_proposal)
//! - [create_set_content_working_group_mint_capacity_proposal](./struct.Module.html#method.create_set_content_working_group_mint_capacity_proposal)
//! - [create_spending_proposal](./struct.Module.html#method.create_spending_proposal)
//! - [create_set_lead_proposal](./struct.Module.html#method.create_set_lead_proposal)
//! - [create_evict_storage_provider_proposal](./struct.Module.html#method.create_evict_storage_provider_proposal)
//! - [create_set_validator_count_proposal](./struct.Module.html#method.create_set_validator_count_proposal)
//! - [create_set_storage_role_parameters_proposal](./struct.Module.html#method.create_set_storage_role_parameters_proposal)
//!
//! ### Proposal implementations of this module
//! - execute_text_proposal - prints the proposal to the log
//! - execute_runtime_upgrade_proposal - sets the runtime code
//!
//! ### Dependencies:
//! - [proposals engine](../substrate_proposals_engine_module/index.html)
//! - [proposals discussion](../substrate_proposals_discussion_module/index.html)
//! - [membership](../substrate_membership_module/index.html)
//! - [governance](../substrate_governance_module/index.html)
//! - [content_working_group](../substrate_content_working_group_module/index.html)
//!

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

// Do not delete! Cannot be uncommented by default, because of Parity decl_module! issue.
// #![warn(missing_docs)]

mod proposal_types;
#[cfg(test)]
mod tests;

use codec::Encode;
use common::origin_validator::ActorOriginValidator;
use governance::election_params::ElectionParameters;
use proposal_engine::ProposalParameters;
use roles::actors::{Role, RoleParameters};
use rstd::clone::Clone;
use rstd::convert::TryInto;
use rstd::prelude::*;
use rstd::str::from_utf8;
use rstd::vec::Vec;
use runtime_io::blake2_256;
use sr_primitives::traits::SaturatedConversion;
use sr_primitives::traits::{One, Zero};
use sr_primitives::Perbill;
use srml_support::dispatch::DispatchResult;
use srml_support::traits::{Currency, Get};
use srml_support::{decl_error, decl_module, decl_storage, ensure, print};
use system::{ensure_root, RawOrigin};

pub use proposal_types::ProposalDetails;

// Percentage of the total token issue as max mint balance value. Shared with spending
// proposal max balance percentage.
const COUNCIL_MINT_MAX_BALANCE_PERCENT: u32 = 2;

/// 'Proposals codex' substrate module Trait
pub trait Trait:
    system::Trait
    + proposal_engine::Trait
    + proposal_discussion::Trait
    + membership::members::Trait
    + governance::election::Trait
    + content_working_group::Trait
    + roles::actors::Trait
    + staking::Trait
{
    /// Defines max allowed text proposal length.
    type TextProposalMaxLength: Get<u32>;

    /// Defines max wasm code length of the runtime upgrade proposal.
    type RuntimeUpgradeWasmProposalMaxLength: Get<u32>;

    /// Defines allowed proposers (by member id list) for the runtime upgrade proposal.
    type RuntimeUpgradeProposalAllowedProposers: Get<Vec<MemberId<Self>>>;

    /// Validates member id and origin combination
    type MembershipOriginValidator: ActorOriginValidator<
        Self::Origin,
        MemberId<Self>,
        Self::AccountId,
    >;
}

/// Balance alias for `stake` module
pub type BalanceOf<T> =
    <<T as stake::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

/// Currency alias for `stake` module
pub type CurrencyOf<T> = <T as stake::Trait>::Currency;

/// Balance alias for GovernanceCurrency from `common` module. TODO: replace with BalanceOf
pub type BalanceOfGovernanceCurrency<T> =
    <<T as common::currency::GovernanceCurrency>::Currency as Currency<
        <T as system::Trait>::AccountId,
    >>::Balance;

/// Balance alias for token mint balance from `token mint` module. TODO: replace with BalanceOf
pub type BalanceOfMint<T> =
    <<T as mint::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

/// Negative imbalance alias for staking
pub type NegativeImbalance<T> =
    <<T as stake::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::NegativeImbalance;

type MemberId<T> = <T as membership::members::Trait>::MemberId;

decl_error! {
    /// Codex module predefined errors
    pub enum Error {
        /// The size of the provided text for text proposal exceeded the limit
        TextProposalSizeExceeded,

        /// Provided text for text proposal is empty
        TextProposalIsEmpty,

        /// The size of the provided WASM code for the runtime upgrade proposal exceeded the limit
        RuntimeProposalSizeExceeded,

        /// Provided WASM code for the runtime upgrade proposal is empty
        RuntimeProposalIsEmpty,

        /// Runtime upgrade proposal can be created only by hardcoded members
        RuntimeProposalProposerNotInTheAllowedProposersList,

        /// Invalid balance value for the spending proposal
        InvalidSpendingProposalBalance,

        /// Invalid validator count for the 'set validator count' proposal
        InvalidValidatorCount,

        /// Require root origin in extrinsics
        RequireRootOrigin,

        /// Invalid storage role parameter - min_actors
        InvalidStorageRoleParameterMinActors,

        /// Invalid storage role parameter - max_actors
        InvalidStorageRoleParameterMaxActors,

        /// Invalid storage role parameter - reward_period
        InvalidStorageRoleParameterRewardPeriod,

        /// Invalid storage role parameter - bonding_period
        InvalidStorageRoleParameterBondingPeriod,

        /// Invalid storage role parameter - unbonding_period
        InvalidStorageRoleParameterUnbondingPeriod,

        /// Invalid storage role parameter - min_service_period
        InvalidStorageRoleParameterMinServicePeriod,

        /// Invalid storage role parameter - startup_grace_period
        InvalidStorageRoleParameterStartupGracePeriod,

        /// Invalid council election parameter - council_size
        InvalidCouncilElectionParameterCouncilSize,

        /// Invalid council election parameter - candidacy-limit
        InvalidCouncilElectionParameterCandidacyLimit,

        /// Invalid council election parameter - min-voting_stake
        InvalidCouncilElectionParameterMinVotingStake,

        /// Invalid council election parameter - new_term_duration
        InvalidCouncilElectionParameterNewTermDuration,

        /// Invalid council election parameter - min_council_stake
        InvalidCouncilElectionParameterMinCouncilStake,

        /// Invalid council election parameter - revealing_period
        InvalidCouncilElectionParameterRevealingPeriod,

        /// Invalid council election parameter - voting_period
        InvalidCouncilElectionParameterVotingPeriod,

        /// Invalid council election parameter - announcing_period
        InvalidCouncilElectionParameterAnnouncingPeriod,

        /// Invalid council election parameter - min_stake
        InvalidStorageRoleParameterMinStake,

        /// Invalid council election parameter - reward
        InvalidStorageRoleParameterReward,

        /// Invalid council election parameter - entry_request_fee
        InvalidStorageRoleParameterEntryRequestFee,

        /// Invalid working group mint capacity parameter
        InvalidStorageWorkingGroupMintCapacity,

        /// Invalid council mint capacity parameter
        InvalidStorageCouncilMintCapacity,

        /// Invalid 'set lead proposal' parameter - proposed lead cannot be a councilor
        InvalidSetLeadParameterCannotBeCouncilor
    }
}

impl From<system::Error> for Error {
    fn from(error: system::Error) -> Self {
        match error {
            system::Error::Other(msg) => Error::Other(msg),
            system::Error::RequireRootOrigin => Error::RequireRootOrigin,
            _ => Error::Other(error.into()),
        }
    }
}

impl From<proposal_engine::Error> for Error {
    fn from(error: proposal_engine::Error) -> Self {
        match error {
            proposal_engine::Error::Other(msg) => Error::Other(msg),
            proposal_engine::Error::RequireRootOrigin => Error::RequireRootOrigin,
            _ => Error::Other(error.into()),
        }
    }
}

impl From<proposal_discussion::Error> for Error {
    fn from(error: proposal_discussion::Error) -> Self {
        match error {
            proposal_discussion::Error::Other(msg) => Error::Other(msg),
            proposal_discussion::Error::RequireRootOrigin => Error::RequireRootOrigin,
            _ => Error::Other(error.into()),
        }
    }
}

// Storage for the proposals codex module
decl_storage! {
    pub trait Store for Module<T: Trait> as ProposalCodex{
        /// Map proposal id to its discussion thread id
        pub ThreadIdByProposalId get(fn thread_id_by_proposal_id):
            map T::ProposalId => T::ThreadId;

        /// Map proposal id to proposal details
        pub ProposalDetailsByProposalId get(fn proposal_details_by_proposal_id):
            map T::ProposalId => ProposalDetails<
                BalanceOfMint<T>,
                BalanceOfGovernanceCurrency<T>,
                T::BlockNumber,
                T::AccountId,
                T::MemberId
            >;
    }
}

decl_module! {
    /// Proposal codex substrate module Call
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error;

        /// Create 'Text (signal)' proposal type.
        pub fn create_text_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            stake_balance: Option<BalanceOf<T>>,
            text: Vec<u8>,
        ) {
            ensure!(!text.is_empty(), Error::TextProposalIsEmpty);
            ensure!(text.len() as u32 <=  T::TextProposalMaxLength::get(),
                Error::TextProposalSizeExceeded);

            let proposal_parameters = proposal_types::parameters::text_proposal::<T>();
            let proposal_code =
                <Call<T>>::execute_text_proposal(title.clone(), description.clone(), text.clone());

            Self::create_proposal(
                origin,
                member_id,
                title,
                description,
                stake_balance,
                proposal_code.encode(),
                proposal_parameters,
                ProposalDetails::Text(text),
            )?;
        }

        /// Create 'Runtime upgrade' proposal type. Runtime upgrade can be initiated only by
        /// members from the hardcoded list `RuntimeUpgradeProposalAllowedProposers`
        pub fn create_runtime_upgrade_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            stake_balance: Option<BalanceOf<T>>,
            wasm: Vec<u8>,
        ) {
            ensure!(!wasm.is_empty(), Error::RuntimeProposalIsEmpty);
            ensure!(wasm.len() as u32 <= T::RuntimeUpgradeWasmProposalMaxLength::get(),
                Error::RuntimeProposalSizeExceeded);

            ensure!(
                T::RuntimeUpgradeProposalAllowedProposers::get().contains(&member_id),
                Error::RuntimeProposalProposerNotInTheAllowedProposersList
            );

            let wasm_hash = blake2_256(&wasm);

            let proposal_code =
                <Call<T>>::execute_runtime_upgrade_proposal(title.clone(), description.clone(), wasm);

            let proposal_parameters = proposal_types::parameters::runtime_upgrade_proposal::<T>();

            Self::create_proposal(
                origin,
                member_id,
                title,
                description,
                stake_balance,
                proposal_code.encode(),
                proposal_parameters,
                ProposalDetails::RuntimeUpgrade(wasm_hash.to_vec()),
            )?;
        }

        /// Create 'Set election parameters' proposal type. This proposal uses `set_election_parameters()`
        /// extrinsic from the `governance::election module`.
        pub fn create_set_election_parameters_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            stake_balance: Option<BalanceOf<T>>,
            election_parameters: ElectionParameters<BalanceOfGovernanceCurrency<T>, T::BlockNumber>,
        ) {
            election_parameters.ensure_valid()?;

            Self::ensure_council_election_parameters_valid(&election_parameters)?;

            let proposal_code =
                <governance::election::Call<T>>::set_election_parameters(election_parameters.clone());

            let proposal_parameters =
                proposal_types::parameters::set_election_parameters_proposal::<T>();

            Self::create_proposal(
                origin,
                member_id,
                title,
                description,
                stake_balance,
                proposal_code.encode(),
                proposal_parameters,
                ProposalDetails::SetElectionParameters(election_parameters),
            )?;
        }

        /// Create 'Set council mint capacity' proposal type. This proposal uses `set_mint_capacity()`
        /// extrinsic from the `governance::council` module.
        pub fn create_set_council_mint_capacity_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            stake_balance: Option<BalanceOf<T>>,
            mint_balance: BalanceOfMint<T>,
        ) {

            let max_mint_capacity: u32 = get_required_stake_by_fraction::<T>(
                COUNCIL_MINT_MAX_BALANCE_PERCENT,
                100
            )
            .try_into()
            .unwrap_or_default() as u32;

            ensure!(
                mint_balance < <BalanceOfMint<T>>::from(max_mint_capacity),
                Error::InvalidStorageCouncilMintCapacity
            );

            let proposal_code =
                <governance::council::Call<T>>::set_council_mint_capacity(mint_balance.clone());

            let proposal_parameters =
                proposal_types::parameters::set_council_mint_capacity_proposal::<T>();

            Self::create_proposal(
                origin,
                member_id,
                title,
                description,
                stake_balance,
                proposal_code.encode(),
                proposal_parameters,
                ProposalDetails::SetCouncilMintCapacity(mint_balance),
            )?;
        }

        /// Create 'Set content working group mint capacity' proposal type.
        /// This proposal uses `set_mint_capacity()` extrinsic from the `content-working-group`  module.
        pub fn create_set_content_working_group_mint_capacity_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            stake_balance: Option<BalanceOf<T>>,
            mint_balance: BalanceOfMint<T>,
        ) {

            let max_mint_capacity: u32 = get_required_stake_by_fraction::<T>(1, 100)
                .try_into()
                .unwrap_or_default() as u32;
            ensure!(
                mint_balance < <BalanceOfMint<T>>::from(max_mint_capacity),
                Error::InvalidStorageWorkingGroupMintCapacity
            );

            let proposal_code =
                <content_working_group::Call<T>>::set_mint_capacity(mint_balance.clone());

            let proposal_parameters =
                proposal_types::parameters::set_content_working_group_mint_capacity_proposal::<T>();

            Self::create_proposal(
                origin,
                member_id,
                title,
                description,
                stake_balance,
                proposal_code.encode(),
                proposal_parameters,
                ProposalDetails::SetContentWorkingGroupMintCapacity(mint_balance),
            )?;
        }

        /// Create 'Spending' proposal type.
        /// This proposal uses `spend_from_council_mint()` extrinsic from the `governance::council`  module.
        pub fn create_spending_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            stake_balance: Option<BalanceOf<T>>,
            balance: BalanceOfMint<T>,
            destination: T::AccountId,
        ) {
            ensure!(balance != BalanceOfMint::<T>::zero(), Error::InvalidSpendingProposalBalance);

            let max_balance: u32 = get_required_stake_by_fraction::<T>(
                COUNCIL_MINT_MAX_BALANCE_PERCENT,
                100
            )
            .try_into()
            .unwrap_or_default() as u32;

            ensure!(
                balance < <BalanceOfMint<T>>::from(max_balance),
                Error::InvalidSpendingProposalBalance
            );

            let proposal_code = <governance::council::Call<T>>::spend_from_council_mint(
                balance.clone(),
                destination.clone()
            );

            let proposal_parameters =
                proposal_types::parameters::spending_proposal::<T>();

            Self::create_proposal(
                origin,
                member_id,
                title,
                description,
                stake_balance,
                proposal_code.encode(),
                proposal_parameters,
                ProposalDetails::Spending(balance, destination),
            )?;
        }


        /// Create 'Set lead' proposal type.
        /// This proposal uses `replace_lead()` extrinsic from the `content_working_group`  module.
        pub fn create_set_lead_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            stake_balance: Option<BalanceOf<T>>,
            new_lead: Option<(T::MemberId, T::AccountId)>
        ) {
            if let Some(lead) = new_lead.clone() {
                let account_id = lead.1;
                ensure!(
                    !<governance::council::Module<T>>::is_councilor(&account_id),
                    Error::InvalidSetLeadParameterCannotBeCouncilor
                );
            }

            let proposal_code =
                <content_working_group::Call<T>>::replace_lead(new_lead.clone());

            let proposal_parameters =
                proposal_types::parameters::set_lead_proposal::<T>();

            Self::create_proposal(
                origin,
                member_id,
                title,
                description,
                stake_balance,
                proposal_code.encode(),
                proposal_parameters,
                ProposalDetails::SetLead(new_lead),
            )?;
        }

        /// Create 'Evict storage provider' proposal type.
        /// This proposal uses `remove_actor()` extrinsic from the `roles::actors`  module.
        pub fn create_evict_storage_provider_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            stake_balance: Option<BalanceOf<T>>,
            actor_account: T::AccountId,
        ) {
            let proposal_code =
                <roles::actors::Call<T>>::remove_actor(actor_account.clone());

            let proposal_parameters =
                proposal_types::parameters::evict_storage_provider_proposal::<T>();

            Self::create_proposal(
                origin,
                member_id,
                title,
                description,
                stake_balance,
                proposal_code.encode(),
                proposal_parameters,
                ProposalDetails::EvictStorageProvider(actor_account),
            )?;
        }

        /// Create 'Evict storage provider' proposal type.
        /// This proposal uses `set_validator_count()` extrinsic from the Substrate `staking`  module.
        pub fn create_set_validator_count_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            stake_balance: Option<BalanceOf<T>>,
            new_validator_count: u32,
        ) {
            ensure!(
                new_validator_count >= <staking::Module<T>>::minimum_validator_count(),
                Error::InvalidValidatorCount
            );

            ensure!(
                new_validator_count <= 1000, // max validator count
                Error::InvalidValidatorCount
            );

            let proposal_code =
                <staking::Call<T>>::set_validator_count(new_validator_count);

            let proposal_parameters =
                proposal_types::parameters::set_validator_count_proposal::<T>();

            Self::create_proposal(
                origin,
                member_id,
                title,
                description,
                stake_balance,
                proposal_code.encode(),
                proposal_parameters,
                ProposalDetails::SetValidatorCount(new_validator_count),
            )?;
        }

        /// Create 'Set storage roles parameters' proposal type.
        /// This proposal uses `set_role_parameters()` extrinsic from the Substrate `roles::actors`  module.
        pub fn create_set_storage_role_parameters_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            stake_balance: Option<BalanceOf<T>>,
            role_parameters: RoleParameters<BalanceOfGovernanceCurrency<T>, T::BlockNumber>
        ) {
            Self::ensure_storage_role_parameters_valid(&role_parameters)?;

            let proposal_code = <roles::actors::Call<T>>::set_role_parameters(
                Role::StorageProvider,
                role_parameters.clone()
            );

            let proposal_parameters =
                proposal_types::parameters::set_storage_role_parameters_proposal::<T>();

            Self::create_proposal(
                origin,
                member_id,
                title,
                description,
                stake_balance,
                proposal_code.encode(),
                proposal_parameters,
                ProposalDetails::SetStorageRoleParameters(role_parameters),
            )?;
        }

// *************** Extrinsic to execute

        /// Text proposal extrinsic. Should be used as callable object to pass to the `engine` module.
        fn execute_text_proposal(
            origin,
            title: Vec<u8>,
            _description: Vec<u8>,
            _text: Vec<u8>,
        ) {
            ensure_root(origin)?;
            print("Text proposal: ");
            let title_string_result = from_utf8(title.as_slice());
            if let Ok(title_string) = title_string_result{
                print(title_string);
            }
        }

        /// Runtime upgrade proposal extrinsic.
        /// Should be used as callable object to pass to the `engine` module.
        fn execute_runtime_upgrade_proposal(
            origin,
            title: Vec<u8>,
            _description: Vec<u8>,
            wasm: Vec<u8>,
        ) {
            let (cloned_origin1, cloned_origin2) =  Self::double_origin(origin);
            ensure_root(cloned_origin1)?;

            print("Runtime upgrade proposal: ");
            let title_string_result = from_utf8(title.as_slice());
            if let Ok(title_string) = title_string_result{
                print(title_string);
            }

            <system::Module<T>>::set_code(cloned_origin2, wasm)?;
        }
    }
}

impl<T: Trait> Module<T> {
    // Multiplies the T::Origin.
    // In our current substrate version system::Origin doesn't support clone(),
    // but it will be supported in latest up-to-date substrate version.
    // TODO: delete when T::Origin will support the clone()
    fn double_origin(origin: T::Origin) -> (T::Origin, T::Origin) {
        let coerced_origin = origin.into().ok().unwrap_or(RawOrigin::None);

        let (cloned_origin1, cloned_origin2) = match coerced_origin {
            RawOrigin::None => (RawOrigin::None, RawOrigin::None),
            RawOrigin::Root => (RawOrigin::Root, RawOrigin::Root),
            RawOrigin::Signed(account_id) => (
                RawOrigin::Signed(account_id.clone()),
                RawOrigin::Signed(account_id),
            ),
        };

        (cloned_origin1.into(), cloned_origin2.into())
    }

    // Generic template proposal builder
    fn create_proposal(
        origin: T::Origin,
        member_id: MemberId<T>,
        title: Vec<u8>,
        description: Vec<u8>,
        stake_balance: Option<BalanceOf<T>>,
        proposal_code: Vec<u8>,
        proposal_parameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>,
        proposal_details: ProposalDetails<
            BalanceOfMint<T>,
            BalanceOfGovernanceCurrency<T>,
            T::BlockNumber,
            T::AccountId,
            T::MemberId,
        >,
    ) -> DispatchResult<Error> {
        let account_id =
            T::MembershipOriginValidator::ensure_actor_origin(origin, member_id.clone())?;

        <proposal_engine::Module<T>>::ensure_create_proposal_parameters_are_valid(
            &proposal_parameters,
            &title,
            &description,
            stake_balance,
        )?;

        <proposal_discussion::Module<T>>::ensure_can_create_thread(member_id.clone(), &title)?;

        let discussion_thread_id =
            <proposal_discussion::Module<T>>::create_thread(member_id, title.clone())?;

        let proposal_id = <proposal_engine::Module<T>>::create_proposal(
            account_id,
            member_id,
            proposal_parameters,
            title,
            description,
            stake_balance,
            proposal_code,
        )?;

        <ThreadIdByProposalId<T>>::insert(proposal_id, discussion_thread_id);
        <ProposalDetailsByProposalId<T>>::insert(proposal_id, proposal_details);

        Ok(())
    }

    // validates storage role parameters for the 'Set storage role parameters' proposal
    fn ensure_storage_role_parameters_valid(
        role_parameters: &RoleParameters<BalanceOfGovernanceCurrency<T>, T::BlockNumber>,
    ) -> Result<(), Error> {
        ensure!(
            role_parameters.min_actors <= 5,
            Error::InvalidStorageRoleParameterMinActors
        );

        ensure!(
            role_parameters.max_actors >= 5,
            Error::InvalidStorageRoleParameterMaxActors
        );

        ensure!(
            role_parameters.max_actors < 100,
            Error::InvalidStorageRoleParameterMaxActors
        );

        ensure!(
            role_parameters.reward_period >= T::BlockNumber::from(600),
            Error::InvalidStorageRoleParameterRewardPeriod
        );

        ensure!(
            role_parameters.reward_period <= T::BlockNumber::from(3600),
            Error::InvalidStorageRoleParameterRewardPeriod
        );

        ensure!(
            role_parameters.bonding_period >= T::BlockNumber::from(600),
            Error::InvalidStorageRoleParameterBondingPeriod
        );

        ensure!(
            role_parameters.bonding_period <= T::BlockNumber::from(28800),
            Error::InvalidStorageRoleParameterBondingPeriod
        );

        ensure!(
            role_parameters.unbonding_period >= T::BlockNumber::from(600),
            Error::InvalidStorageRoleParameterUnbondingPeriod
        );

        ensure!(
            role_parameters.unbonding_period <= T::BlockNumber::from(28800),
            Error::InvalidStorageRoleParameterUnbondingPeriod
        );

        ensure!(
            role_parameters.min_service_period >= T::BlockNumber::from(600),
            Error::InvalidStorageRoleParameterMinServicePeriod
        );

        ensure!(
            role_parameters.min_service_period <= T::BlockNumber::from(28800),
            Error::InvalidStorageRoleParameterMinServicePeriod
        );

        ensure!(
            role_parameters.startup_grace_period >= T::BlockNumber::from(600),
            Error::InvalidStorageRoleParameterStartupGracePeriod
        );

        ensure!(
            role_parameters.startup_grace_period <= T::BlockNumber::from(28800),
            Error::InvalidStorageRoleParameterStartupGracePeriod
        );

        ensure!(
            role_parameters.min_stake > <BalanceOfGovernanceCurrency<T>>::from(0u32),
            Error::InvalidStorageRoleParameterMinStake
        );

        let max_min_stake: u32 = get_required_stake_by_fraction::<T>(1, 100)
            .try_into()
            .unwrap_or_default() as u32;

        ensure!(
            role_parameters.min_stake < <BalanceOfGovernanceCurrency<T>>::from(max_min_stake),
            Error::InvalidStorageRoleParameterMinStake
        );

        ensure!(
            role_parameters.entry_request_fee > <BalanceOfGovernanceCurrency<T>>::from(0u32),
            Error::InvalidStorageRoleParameterEntryRequestFee
        );

        let max_entry_request_fee: u32 = get_required_stake_by_fraction::<T>(1, 100)
            .try_into()
            .unwrap_or_default() as u32;

        ensure!(
            role_parameters.entry_request_fee
                < <BalanceOfGovernanceCurrency<T>>::from(max_entry_request_fee),
            Error::InvalidStorageRoleParameterEntryRequestFee
        );

        ensure!(
            role_parameters.reward > <BalanceOfGovernanceCurrency<T>>::from(0u32),
            Error::InvalidStorageRoleParameterReward
        );

        let max_reward: u32 = get_required_stake_by_fraction::<T>(1, 1000)
            .try_into()
            .unwrap_or_default() as u32;

        ensure!(
            role_parameters.reward < <BalanceOfGovernanceCurrency<T>>::from(max_reward),
            Error::InvalidStorageRoleParameterReward
        );

        Ok(())
    }

    /*
    entry_request_fee [tJOY]	>0	<1%	NA
    * Not enforced by runtime. Should not be displayed in the UI, or at least grayed out.
    ** Should not be displayed in the UI, or at least grayed out.
        */

    // validates council election parameters for the 'Set election parameters' proposal
    pub(crate) fn ensure_council_election_parameters_valid(
        election_parameters: &ElectionParameters<BalanceOfGovernanceCurrency<T>, T::BlockNumber>,
    ) -> Result<(), Error> {
        ensure!(
            election_parameters.council_size >= 4,
            Error::InvalidCouncilElectionParameterCouncilSize
        );

        ensure!(
            election_parameters.council_size <= 20,
            Error::InvalidCouncilElectionParameterCouncilSize
        );

        ensure!(
            election_parameters.candidacy_limit >= 25,
            Error::InvalidCouncilElectionParameterCandidacyLimit
        );

        ensure!(
            election_parameters.candidacy_limit <= 100,
            Error::InvalidCouncilElectionParameterCandidacyLimit
        );

        ensure!(
            election_parameters.min_voting_stake >= <BalanceOfGovernanceCurrency<T>>::one(),
            Error::InvalidCouncilElectionParameterMinVotingStake
        );

        ensure!(
            election_parameters.min_voting_stake
                <= <BalanceOfGovernanceCurrency<T>>::from(100000u32),
            Error::InvalidCouncilElectionParameterMinVotingStake
        );

        ensure!(
            election_parameters.new_term_duration >= T::BlockNumber::from(14400),
            Error::InvalidCouncilElectionParameterNewTermDuration
        );

        ensure!(
            election_parameters.new_term_duration <= T::BlockNumber::from(432000),
            Error::InvalidCouncilElectionParameterNewTermDuration
        );

        ensure!(
            election_parameters.revealing_period >= T::BlockNumber::from(14400),
            Error::InvalidCouncilElectionParameterRevealingPeriod
        );

        ensure!(
            election_parameters.revealing_period <= T::BlockNumber::from(43200),
            Error::InvalidCouncilElectionParameterRevealingPeriod
        );

        ensure!(
            election_parameters.voting_period >= T::BlockNumber::from(14400),
            Error::InvalidCouncilElectionParameterVotingPeriod
        );

        ensure!(
            election_parameters.voting_period <= T::BlockNumber::from(43200),
            Error::InvalidCouncilElectionParameterVotingPeriod
        );

        ensure!(
            election_parameters.announcing_period >= T::BlockNumber::from(14400),
            Error::InvalidCouncilElectionParameterAnnouncingPeriod
        );

        ensure!(
            election_parameters.announcing_period <= T::BlockNumber::from(43200),
            Error::InvalidCouncilElectionParameterAnnouncingPeriod
        );

        ensure!(
            election_parameters.min_council_stake >= <BalanceOfGovernanceCurrency<T>>::one(),
            Error::InvalidCouncilElectionParameterMinCouncilStake
        );

        ensure!(
            election_parameters.min_council_stake
                <= <BalanceOfGovernanceCurrency<T>>::from(100000u32),
            Error::InvalidCouncilElectionParameterMinCouncilStake
        );

        Ok(())
    }
}

// calculates required stake value using total issuance value and stake percentage. Truncates to
// lowest integer value. Value fraction is defined by numerator and denominator.
pub(crate) fn get_required_stake_by_fraction<T: crate::Trait>(
    numerator: u32,
    denominator: u32,
) -> BalanceOf<T> {
    let total_issuance: u128 = <CurrencyOf<T>>::total_issuance().try_into().unwrap_or(0) as u128;
    let required_stake =
        Perbill::from_rational_approximation(numerator, denominator) * total_issuance;

    let balance: BalanceOf<T> = required_stake.saturated_into();

    balance
}
