use crate::{AccountId, Credential, Runtime};

use frame_support::traits::{Currency, Imbalance};
use frame_support::{parameter_types, IterableStorageMap, StorageMap};

parameter_types! {
    pub const CurrentLeadCredential: Credential = 0;
    pub const AnyActiveCuratorCredential: Credential = 1;
    pub const AnyActiveChannelOwnerCredential: Credential = 2;
    pub const PrincipalIdMappingStartsAtCredential: Credential = 1000;
}

pub struct ContentWorkingGroupCredentials {}
impl versioned_store_permissions::CredentialChecker<Runtime> for ContentWorkingGroupCredentials {
    fn account_has_credential(
        account: &AccountId,
        credential: <Runtime as versioned_store_permissions::Trait>::Credential,
    ) -> bool {
        match credential {
            // Credentials from 0..999 represents groups or more complex requirements
            // Current Lead if set
            credential if credential == CurrentLeadCredential::get() => {
                match <content_working_group::Module<Runtime>>::ensure_lead_is_set() {
                    Ok((_, lead)) => lead.role_account == *account,
                    _ => false,
                }
            }
            // Any Active Curator
            credential if credential == AnyActiveCuratorCredential::get() => {
                // Look for a Curator with a matching role account
                for (_principal_id, principal) in
                    <content_working_group::PrincipalById<Runtime>>::iter()
                {
                    if let content_working_group::Principal::Curator(curator_id) = principal {
                        let curator =
                            <content_working_group::CuratorById<Runtime>>::get(curator_id);
                        if curator.role_account == *account
                            && curator.stage == content_working_group::CuratorRoleStage::Active
                        {
                            return true;
                        }
                    }
                }

                false
            }
            // Any Active Channel Owner
            credential if credential == AnyActiveChannelOwnerCredential::get() => {
                // Look for a ChannelOwner with a matching role account
                for (_principal_id, principal) in
                    <content_working_group::PrincipalById<Runtime>>::iter()
                {
                    if let content_working_group::Principal::ChannelOwner(channel_id) = principal {
                        let channel =
                            <content_working_group::ChannelById<Runtime>>::get(channel_id);
                        if channel.role_account == *account {
                            return true; // should we also take publishing_status/curation_status into account ?
                        }
                    }
                }

                false
            }
            // mapping to working group principal id
            n if n >= PrincipalIdMappingStartsAtCredential::get() => {
                <content_working_group::Module<Runtime>>::account_has_credential(
                    account,
                    n - PrincipalIdMappingStartsAtCredential::get(),
                )
            }
            _ => false,
        }
    }
}

pub struct ContentWorkingGroupStakingEventHandler {}
impl stake::StakingEventsHandler<Runtime> for ContentWorkingGroupStakingEventHandler {
    fn unstaked(
        stake_id: &<Runtime as stake::Trait>::StakeId,
        _unstaked_amount: stake::BalanceOf<Runtime>,
        remaining_imbalance: stake::NegativeImbalance<Runtime>,
    ) -> stake::NegativeImbalance<Runtime> {
        if !hiring::ApplicationIdByStakingId::<Runtime>::contains_key(stake_id) {
            // Stake not related to a staked role managed by the hiring module
            return remaining_imbalance;
        }

        let application_id = hiring::ApplicationIdByStakingId::<Runtime>::get(stake_id);

        if !content_working_group::CuratorApplicationById::<Runtime>::contains_key(application_id) {
            // Stake not for a Curator
            return remaining_imbalance;
        }

        // Notify the Hiring module - is there a potential re-entrancy bug if
        // instant unstaking is occuring?
        hiring::Module::<Runtime>::unstaked(*stake_id);

        // Only notify working group module if non instantaneous unstaking occured
        if content_working_group::UnstakerByStakeId::<Runtime>::contains_key(stake_id) {
            content_working_group::Module::<Runtime>::unstaked(*stake_id);
        }

        // Determine member id of the curator
        let curator_application =
            content_working_group::CuratorApplicationById::<Runtime>::get(application_id);
        let member_id = curator_application.member_id;

        // get member's profile
        let member_profile = membership::MembershipById::<Runtime>::get(member_id);

        // deposit funds to member's root_account
        // The application doesn't recorded the original source_account from which staked funds were
        // provided, so we don't really have another option at the moment.
        <Runtime as stake::Trait>::Currency::resolve_creating(
            &member_profile.root_account,
            remaining_imbalance,
        );

        stake::NegativeImbalance::<Runtime>::zero()
    }

    // Handler for slashing event
    fn slashed(
        _id: &<Runtime as stake::Trait>::StakeId,
        _slash_id: Option<<Runtime as stake::Trait>::SlashId>,
        _slashed_amount: stake::BalanceOf<Runtime>,
        _remaining_stake: stake::BalanceOf<Runtime>,
        remaining_imbalance: stake::NegativeImbalance<Runtime>,
    ) -> stake::NegativeImbalance<Runtime> {
        // Check if the stake is associated with a hired curator or applicant
        // if their stake goes below minimum required for the role,
        // they should get deactivated.
        // Since we don't currently implement any slash initiation in working group,
        // there is nothing to do for now.

        // Not interested in transfering the slashed amount anywhere for now,
        // so return it to next handler.
        remaining_imbalance
    }
}
