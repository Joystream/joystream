#![cfg(test)]

use super::lib::{Trait, *};
pub use primitives::{map, Blake2Hasher, H256};
use rstd::prelude::*;

/// DIRTY IMPORT BECAUSE
/// InputValidationLengthConstraint has not been factored out yet!!!
use forum::InputValidationLengthConstraint;

/// The way a map (linked_map) is represented in the GenesisConfig produced by decl_storage
//pub type GenesisConfigMap<K, V> = std::vec::Vec<(K, V)>;

/// Builder of genesis configuration of content working group.
pub struct GenesisConfigBuilder<T: Trait> {
    mint: <T as minting::Trait>::MintId,

    /*
    lead_by_id: GenesisConfigMap<LeadId<T>, Lead<T::AccountId, T::RewardRelationshipId, T::BlockNumber>>,
    next_lead_id: LeadId<T>,
    curator_opening_by_id: GenesisConfigMap<CuratorOpeningId<T>, CuratorOpening<T::OpeningId, T::BlockNumber, BalanceOf<T>, CuratorApplicationId<T>>>,
    next_curator_opening_id: CuratorOpeningId<T>,
    curator_application_by_id: GenesisConfigMap<CuratorApplicationId<T>, CuratorApplication<T::AccountId, CuratorOpeningId<T>, T::MemberId, T::ApplicationId>>,
    next_curator_application_id: CuratorApplicationId<T>,
    channel_by_id: GenesisConfigMap<ChannelId<T>, Channel<T::MemberId, T::AccountId, T::BlockNumber, PrincipalId<T>>>,
    next_channel_id: ChannelId<T>,
    channel_id_by_handle: GenesisConfigMap<Vec<u8>, ChannelId<T>>,
    curator_by_id: GenesisConfigMap<CuratorId<T>, Curator<T::AccountId, T::RewardRelationshipId, T::StakeId, T::BlockNumber, LeadId<T>, CuratorApplicationId<T>, PrincipalId<T>>>,
    next_curator_id: CuratorId<T>,
    principal_by_id: GenesisConfigMap<PrincipalId<T>, Principal<CuratorId<T>, ChannelId<T>>>,
    next_principal_id: PrincipalId<T>,

    unstaker_by_stake_id: GenesisConfigMap<TestStakeId, WorkingGroupUnstaker<LeadId<T>, CuratorId<T>>>,
    */
    channel_creation_enabled: bool,
    channel_handle_constraint: InputValidationLengthConstraint,
    channel_description_constraint: InputValidationLengthConstraint,
    opening_human_readble_text: InputValidationLengthConstraint,
    curator_application_human_readable_text: InputValidationLengthConstraint,
    curator_exit_rationale_text: InputValidationLengthConstraint,
}

impl<T: Trait> GenesisConfigBuilder<T> {
    /*
    pub fn set_mint(mut self, mint: <T as minting::Trait>::MintId) -> Self {
        self.mint = mint;
        self
    }
    pub fn set_channel_handle_constraint(mut self, constraint: InputValidationLengthConstraint) -> Self {
        self.channel_description_constraint = constraint;
        self
    }
    pub fn set_channel_description_constraint(mut self, constraint: InputValidationLengthConstraint) -> Self {
        self.channel_description_constraint = constraint;
        self
    }
    pub fn set_channel_creation_enabled(mut self, channel_creation_enabled: bool) -> Self {
        self.channel_creation_enabled = channel_creation_enabled;
        self
    }
    */
    pub fn build(self) -> GenesisConfig<T> {
        GenesisConfig {
            mint: self.mint,

            // WE HAVE TO PROVIDE SOME VALUE FOR THESE FOR NOW
            // USING DEFAULT FOR NOW.
            lead_by_id: map![], //GenesisConfigMap<LeadId, Lead>,
            next_lead_id: LeadId::<T>::default(),
            curator_opening_by_id: map![], //GenesisConfigMap<CuratorOpeningId, Opening>,
            next_curator_opening_id: CuratorOpeningId::<T>::default(),
            curator_application_by_id: map![], //GenesisConfigMap<CuratorApplicationId,CuratorApplication>,
            next_curator_application_id: CuratorApplicationId::<T>::default(),

            channel_by_id: map![], //GenesisConfigMap<ChannelId, Channel>,
            next_channel_id: ChannelId::<T>::default(),
            channel_id_by_handle: map![], //GenesisConfigMap<Vec<u8>, ChannelId>,
            curator_by_id: map![],        //GenesisConfigMap<CuratorId, Curator>,
            next_curator_id: CuratorId::<T>::default(),
            principal_by_id: map![], //GenesisConfigMap<PrinicipalId, Prinicipal>,
            next_principal_id: PrincipalId::<T>::default(),
            channel_creation_enabled: self.channel_creation_enabled,
            unstaker_by_stake_id: map![], //GenesisConfigMap<LeadId, CuratorId>,

            channel_handle_constraint: self.channel_handle_constraint,
            channel_description_constraint: self.channel_description_constraint,
            opening_human_readble_text: self.opening_human_readble_text,
            curator_application_human_readable_text: self.curator_application_human_readable_text,
            curator_exit_rationale_text: self.curator_exit_rationale_text,
        }
    }
}

impl<T: Trait> Default for GenesisConfigBuilder<T> {
    fn default() -> Self {
        let default_constraint = InputValidationLengthConstraint {
            min: 8,
            max_min_diff: 44,
        };

        Self {
            mint: <T as minting::Trait>::MintId::default(),

            /*
            current_lead_id: LeadId::<T>::default(), //Option<LeadId>,
            lead_by_id: map![], //GenesisConfigMap<LeadId, Lead>,
            next_lead_id: 0,
            curator_opening_by_id: map![], //GenesisConfigMap<CuratorOpeningId, Opening>,
            next_curator_opening_id: 0,
            curator_application_by_id: map![], //GenesisConfigMap<CuratorApplicationId,CuratorApplication>,
            next_curator_application_id: 0,
            channel_by_id: map![], //GenesisConfigMap<ChannelId, Channel>,
            next_channel_id: 0,
            channel_id_by_handle: map![], //GenesisConfigMap<Vec<u8>, ChannelId>,
            curator_by_id: map![], //GenesisConfigMap<CuratorId, Curator>,
            next_curator_id: 0,
            principal_by_id: map![], //GenesisConfigMap<PrinicipalId, Prinicipal>,
            next_principal_id: 0,

            unstaker_by_stake_id: map![], //GenesisConfigMap<LeadId, CuratorId>,
            */
            channel_creation_enabled: true,
            channel_handle_constraint: default_constraint.clone(),
            channel_description_constraint: default_constraint.clone(),
            opening_human_readble_text: default_constraint.clone(),
            curator_application_human_readable_text: default_constraint.clone(),
            curator_exit_rationale_text: default_constraint.clone(),
        }
    }
}
