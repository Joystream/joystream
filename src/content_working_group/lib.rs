// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;
use srml_support::{
    decl_module, decl_storage, ensure, StorageMap, StorageValue,
};
//use rstd::collections::btree_map::BTreeMap;
use rstd::collections::btree_set::BTreeSet;

use versioned_store_permissions;

pub use super::types::{*};

use system;

decl_storage! {
    trait Store for Module<T: Trait> as ContentWorkingGroup {

        /// The mint currently funding the rewards for this module.
        pub Mint get(mint) config(): T::TokenMintId; 

        /// The current lead.
        pub CurrentLeadId get(current_lead_id) config(): Option<T::LeadId>;

        /// Maps identifier to corresponding lead.
        pub LeadById get(lead_by_id) config(): linked_map T::LeadId => Lead<T::AccountId, T::RewardRelationshipId, T::BlockNumber>;

        /// Next identifier for new current lead.
        pub NextLeadId get(next_lead_id) config(): T::LeadId;

        /// Set of identifiers for all openings originated from this group.
        /// Using map to model a set.
        pub Openings get(openings) config(): linked_map T::OpeningId => ();

        pub ChannelById get(channel_by_id) config(): linked_map T::ChannelId => Channel<T::MemberId, T::AccountId, T::BlockNumber>;

        /// Maps identifier to corresponding curator.
        pub CuratorById get(curator_by_id) config(): linked_map T::CuratorId => Curator<T::AccountId, T::RewardRelationshipId, T::StakeId, T::BlockNumber, T::LeadId, T::ApplicationId>;
        
        /// Next identifier for new curator.
        pub NextCuratorId get(next_curator_id) config(): T::CuratorId;

        /// The constraints lead must respect when creating a new curator opening.
        /// Lack of policy is interpreted as blocking any new openings at all.
        pub OpeningPolicy get(opening_policy) config(): Option<OpeningPolicy<T::BlockNumber, hiring::StakingPolicy<BalanceOf<T>, T::BlockNumber>>>;

        /// Credentials for built in roles.
        pub LeadCredential get(lead_credential) config(): LeadCredential;

        /// The "any curator" credential.
        pub AnyCuratorCredential get(any_curator_credential) config(): AnyCuratorCredential;

        /// The "any member" credential.
        pub AnyMemberCredential get(any_member_credential) config(): AnyMemberCredential;

        /// Maps dynamic credential by
        pub DynamicCredentialById get(dynamic_credential_by_id) config(): linked_map DynamicCredentialId => DynamicCredential<T::CuratorId, T::ChannelId, T::BlockNumber>;

        /// ...
        pub NextDynamicCredentialId get(next_dynamic_credential_id) config(): T::DynamicCredentialId;


        // Input guards

        // TODO: use proper input constraint types

        /// Upper bound for character length of description field of any new or updated PermissionGroup 
        pub MaxPermissionGroupDescriptionLength get(max_permission_group_description_length) config(): u16;

        /// Upper bound for character length of the rationale_text field of any new CuratorRoleStage.
        pub MaxCuratorExitRationaleTextLength get(max_curator_exit_rationale_text_length) config(): u16;

    }
}
        /*
/// Substrate module events.
decl_event! {
    pub enum Event<T> where
      <T as system::Trait>::AccountId,
      <T as Trait>::MemberId,
      <T as Trait>::ActorId, 
      {

        LeadSet
        LeadUnset
        OpeningPolicySet
        LeadRewardUpdated
        LeadRoleAccountUpdated
        LeadRewardAccountUpdated
        PermissionGroupAdded
        PermissionGroupUpdated
        CuratorOpeningAdded
        AcceptedCuratorApplications
        BeganCuratorApplicationReview
        CuratorOpeningFilled
        CuratorSlashed
        TerminatedCurator
        AppliedOnCuratorOpening
        CuratorRewardUpdated
        CuratorRoleAccountUpdated
        CuratorRewardAccountUpdated
        CuratorExited
        
    }
}
*/

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        fn deposit_event() = default;

        /// ...
        pub fn create_channel(origin, channel_type: ChannelType, owner: T::MemberId) {

            // DONE
            Ok(())
        }

        /// ...
        pub fn transfer_channel_ownerhsip(origin, channel_id: T::ChannelId) {

            // DONE
            Ok(())
        }

        // perhaps curation can be done here in one go.



        /// ...
        pub fn update_channel_as_owner(origin) {

            // DONE
            Ok(())
        }

        /// ...
        pub fn update_channel_as_curator(origin) {

            // DONE
            Ok(())
        }

        /// ..
        pub fn create_version_store_credential(origin)  {

            // DONE
            Ok(())
        }

        /// ...
        pub fn update_lead_role_account(origin) {

            // DONE
            Ok(())
        }

        /// ...
        pub fn update_lead_reward_account(origin)  {

            // DONE
            Ok(())
        }

        /// ...
        pub fn add_curator_opening(origin)  {

            // DONE
            Ok(())
        }

        /// ...
        pub fn accept_curator_applications(origin)  {

            // DONE
            Ok(())
        }

        /// ...
        pub fn begin_curator_applicant_review(origin) {

            // DONE
            Ok(())
        }

        /// ...
        pub fn fill_curator_opening(origin) {

            // DONE
            Ok(())
        }

        /// ...
        pub fn update_curator_reward(origin) {

            // DONE
            Ok(())
        }

        /// ...
        pub fn slash_curator(origin) {

            // DONE
            Ok(())
        }

        /// ...
        pub fn terminate_curator(origin) {

            // DONE
            Ok(())
        }

        /// ...
        pub fn apply_on_curator_opening(origin) {

            // DONE
            Ok(())
        }

        /// ...
        pub fn update_curator_role_account(origin) {

            // DONE
            Ok(())
        }

        /// ...
        pub fn update_curator_reward_account(origin) {

            // DONE
            Ok(())
        }

        /// ...
        pub fn exit_curator_role(origin) {

            // DONE
            Ok(())
        }

        fn on_finalize(now: T::BlockNumber) {

        }
    }
}

impl<T: Trait> Module<T> {

    /*  
    /// ...
    pub fn set_lead();

    /// ...
    pub fn unset_lead();
    
    /// ...
    pub fn set_opening_policy();

    /// ...
    pub fn update_lead_reward();
    
    /// ...
    pub fn account_is_in_group();
    */
}

/*
 *  ======== ======== ======== ======== =======
 *  ======== PRIVATE TYPES AND METHODS ========
 *  ======== ======== ======== ======== =======
 */

/// ...
enum Credential<CuratorId, ChannelId, BlockNumber> {
    Lead(LeadCredential),
    AnyCurator(AnyCuratorCredential),
    AnyMember(AnyMemberCredential),
    Dynamic(DynamicCredential<CuratorId, ChannelId, BlockNumber>)
}

/// Holder of a credential.
enum CredentialHolder<DynamicCredentialId> {

    /// Built in credential holder.
    BuiltInCredentialHolder(BuiltInCredentialHolder),

    /// A possible dynamic credendtial holder.
    CandidateDynamicCredentialId(DynamicCredentialId)
}

impl<T: Trait> Module<T> {

    /// Maps a permission module credential identifier to a credential holder.
    /// 
    /// **CRITICAL**: 
    /// 
    /// Credential identifiers are stored in the permissions module, this means that
    /// the mapping in this function _must_ not disturb how it maps any id that is actually in use
    /// across runtime upgrades, _unless_ one is also prepared to make the corresponding migrations
    /// in the permissions module. Best to keep mapping stable.
    /// 
    /// In practice the only way one may want augment this map is to support new
    /// built in credentials. In this case, the mapping has to be written and deployed while
    /// no new dynamic credentials are created, and a new case of the form below must be introcued
    /// in the match: CandidateDynamicCredentialId(credential_id - X), where X = #ChannelIds mapped so far.
    fn credential_id_to_holder(credential_id: T::PrincipalId) -> CredentialHolder<DynamicCredentialId<T>> {

        // Credential identifiers for built in credential holder types.
        let LEAD_CREDENTIAL_ID = T::PrincipalId::from(0);
        let ANY_CURATOR_CREDENTIAL_ID = T::PrincipalId::from(1);
        let ANY_MEMBER_CREDENTIAL_ID = T::PrincipalId::from(2);

        match credential_id {

            LEAD_CREDENTIAL_ID => CredentialHolder(BuiltInCredentialHolder(BuiltInCredentialHolder::Lead)),
            ANY_CURATOR_CREDENTIAL_ID => CredentialHolder(BuiltInCredentialHolder(BuiltInCredentialHolder::AnyCurator)),
            ANY_MEMBER_CREDENTIAL_ID => CredentialHolder(BuiltInCredentialHolder(BuiltInCredentialHolder::AnyMember)),
            _ => CredentialHolder(CandidateDynamicCredentialId(credential_id - 3)) // will map first dynamic id to 0

            /*
            Add new built in credentials here below
            */
        }
    }
    
    /// .
    fn credential_from_id(credential_id: T::PrincipalId) -> Option<DynamicCredential<T::CuratorId, T::ChannelId, T::BlockNumber>> {

        //let  = credential_id_to_built_in_credential_holder(credential_id);

        // 2. 


        None
    }
    
}