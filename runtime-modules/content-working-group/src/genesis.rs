#![cfg(test)]

use crate::{Trait, *};
use sp_std::map;

use common::constraints::InputValidationLengthConstraint;

/// Builder of genesis configuration of content working group.
pub struct GenesisConfigBuilder<T: Trait> {
    mint_capacity: minting::BalanceOf<T>,
    channel_creation_enabled: bool,
    channel_handle_constraint: InputValidationLengthConstraint,
    channel_description_constraint: InputValidationLengthConstraint,
    curator_application_human_readable_text: InputValidationLengthConstraint,
    curator_exit_rationale_text: InputValidationLengthConstraint,
    channel_title_constraint: InputValidationLengthConstraint,
    channel_avatar_constraint: InputValidationLengthConstraint,
    channel_banner_constraint: InputValidationLengthConstraint,
    opening_human_readable_text: InputValidationLengthConstraint,
}

impl<T: Trait> GenesisConfigBuilder<T> {
    pub fn with_mint_capacity(mut self, capacity: minting::BalanceOf<T>) -> Self {
        self.mint_capacity = capacity;
        self
    }

    pub fn build(self) -> GenesisConfig<T> {
        GenesisConfig {
            mint_capacity: self.mint_capacity,
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
            curator_application_human_readable_text: self.curator_application_human_readable_text,
            curator_exit_rationale_text: self.curator_exit_rationale_text,
            channel_title_constraint: self.channel_title_constraint,
            channel_avatar_constraint: self.channel_avatar_constraint,
            channel_banner_constraint: self.channel_banner_constraint,
            opening_human_readable_text: self.opening_human_readable_text,
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
            mint_capacity: minting::BalanceOf::<T>::from(10000),
            channel_creation_enabled: true,
            channel_handle_constraint: default_constraint.clone(),
            channel_description_constraint: default_constraint.clone(),
            curator_application_human_readable_text: default_constraint.clone(),
            curator_exit_rationale_text: default_constraint.clone(),
            channel_title_constraint: default_constraint.clone(),
            channel_avatar_constraint: default_constraint.clone(),
            channel_banner_constraint: default_constraint.clone(),
            opening_human_readable_text: default_constraint.clone(),
        }
    }
}
