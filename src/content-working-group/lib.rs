// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;
use codec::{Codec, Decode, Encode};
use runtime_primitives::traits::{MaybeSerializeDebug, Member, One, SimpleArithmetic};
use srml_support::traits::Currency;
use srml_support::{
    decl_module, decl_storage, ensure, EnumerableStorageMap, Parameter, StorageMap, StorageValue,
};
use std::iter::Iterator;

use rstd::collections::btree_map::BTreeMap;
use rstd::collections::btree_set::BTreeSet;

mod types;
mod macroes;
mod mock;
mod test;

pub use types;

use system;

decl_storage! {
    trait Store for Module<T: Trait> as ContentWorkingGroup {

        /// The mint currently funding the rewards for this module.
        pub Mint get(mint) config(): T::TokenMintId; 

        /// The current lead.
        pub CurrentLead get(current_lead) config(): Option<T::LeadId>;

        /// Maps identifier to corresponding lead.
        pub LeadById get(lead_by_id) config(): linked_map T::LeadId => Lead<T::AccountId, RewardRelationshipId, T::BlockNumber>;

        /// Next identifier for new current lead.
        pub NextLeadId get(next_lead_id) config(): T::LeadId;

        /// Set of identifiers for all openings originated from this group.
        /// Using map to model a set.
        pub Openings get(openings) config(): linked_map T::OpeningId => ();

        /// Maps identifier to corresponding curator.
        pub CuratorById get(curator_by_id) config(): linked_map T::CuratorId => Curator<T>;
        
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
        pub DynamicCredentialById get(dynamic_credential_by_id) config(): linked_map DynamicCredentialId => DynamicCredential<T::CuratorId, T::ChannelId>;

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
        pub fn create_channel(type: ChannelType, owner: Trait::MemberId) {

            // DONE
            Ok(())
        }

        /// ...
        pub fn transfer_channel_ownerhsip(channel_id: T::ChannelId) {

            // DONE
            Ok(())
        }

        // perhaps curation can be done here in one go.

        

        /// ...
        pub fn update_channel_as_owner() {

            // DONE
            Ok(())
        }

        /// ...
        pub fn update_channel_as_curator() {

            // DONE
            Ok(())
        }

        /// ..
        pub fn create_version_store_credential()  {

            // DONE
            Ok(())
        }

        /// ...
        pub fn update_lead_role_account() {

            // DONE
            Ok(())
        }

        /// ...
        pub fn update_lead_reward_account()  {

            // DONE
            Ok(())
        }

        /// ...
        pub fn add_curator_opening()  {

            // DONE
            Ok(())
        }

        /// ...
        pub fn accept_curator_applications()  {

            // DONE
            Ok(())
        }

        /// ...
        pub fn begin_curator_applicant_review() {

            // DONE
            Ok(())
        }

        /// ...
        pub fn fill_curator_opening() {

            // DONE
            Ok(())
        }

        /// ...
        pub fn update_curator_reward() {

            // DONE
            Ok(())
        }

        /// ...
        pub fn slash_curator() {

            // DONE
            Ok(())
        }

        /// ...
        pub fn terminate_curator() {

            // DONE
            Ok(())
        }

        /// ...
        pub fn apply_on_curator_opening() {

            // DONE
            Ok(())
        }

        /// ...
        pub fn update_curator_role_account() {

            // DONE
            Ok(())
        }

        /// ...
        pub fn update_curator_reward_account() {

            // DONE
            Ok(())
        }

        /// ...
        pub fn exit_curator_role() {

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
enum Credential {
    Lead(LeadCredential),
    AnyCurator(AnyCuratorCredential),
    AnyMember(AnyMemberCredential)
    Dynamic(DynamicVersionedStoreCredential)
}

impl<T: Trait> Module<T> {
    
    /// .
    fn credential_from_id(credential_id: VersionedStorePermissions::Trait::CredentialId) -> Option<Credential> {

        let  = credential_id_to_built_in_credential_holder(credential_id);

        // 2. 



    }
    
}