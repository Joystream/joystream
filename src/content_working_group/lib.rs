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

        /// Maps identifier to corresponding channel.
        pub ChannelById get(channel_by_id) config(): linked_map T::ChannelId => Channel<T::MemberId, T::AccountId, T::BlockNumber>;

        /// Identifier to be used by the next channel introduced.
        pub NextChannelId get(next_channel_id) config(): T::ChannelId;

        /// Maps (unique+immutable) channel handle to the corresponding identifier for the channel.
        /// Mapping is required to allow efficient (O(log N)) on-chain verification that a proposed handle is indeed unique 
        /// at the time it is being proposed.
        pub ChannelIdByHandle get(channel_id_by_handle) config(): linked_map Vec<u8> => T::ChannelId;

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

        /// Whether it is currently possible to create a channel via `create_channel` extrinsic.
        pub ChannelCreationEnabled get(channel_creation_enabled) config(): bool;


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

        /*
         * Channel management
         */

        /// Create a new channel.
        pub fn create_channel(origin, handle: Vec<u8>, description: Vec<u8>, content: ChannelContentType, owner: T::MemberId, role_account: T::AccountId) {

            // Ensure is signed by "who".

            // Ensure it is currently possible to create channels (ChannelCreationEnabled).

            // Ensure handle is acceptable length

            // Ensure description is acceptable length

            // Ensure tx signer "who" is allowed to do this under owner id by dialing out to
            // membership module and asking.

            //
            // == MUTATION SAFE ==
            //

            // Get id of new channel 

            // Construct channel

            // Add channel to ChannelById under id

            // Add id to ChannelIdByHandle under handle

            // Increment NextChannelId

            // Dial out to membership module and inform about new role as channe owner.

            // event?

        }

        /// An owner transfers channel ownership to a new owner.
        /// 
        /// Notice that working group participants cannot do this.
        /// Notice that censored or unpublished channel may still be transferred.
        pub fn transfer_channel_ownership(origin, channel_id: T::ChannelId, new_owner: T::MemberId, new_role_account: T::AccountId) {

            // Ensure extrinsic is signed by "who"

            // Ensure channel id is valid

            // Ensure "who" matches role account of channel

            // Ensure new owner is allowed to do this under new owner id by dialing out to
            // membership module and asking

            //
            // == MUTATION SAFE ==
            //

            // Construct new channel with altered properties

            // Overwrite entry in ChannelById

            // Dial out to membership module and inform about removal of role as channle owner for old owner.

            // Dial out to membership module and inform about new role as channe owner for new owner.

            // event?
    
        }

        // perhaps curation can be done here in one go.

        /// Update channel curation status of a channel.
        /// 
        /// Can 
        pub fn update_channel_curation_status(origin, WorkingGroupActor) {



        }

        /*
         * Credential management for versioned store permissions.
         * 
         * Lead credential is managed as non-dispatchable.
         */

        pub fn update_any_member_credential() {
            
        }

        pub fn update_any_curator_credential() {
            
        }

        pub fn create_dynamic_credential() {

        }

        pub fn update_dynamic_credential() {
            
        }





        /// ...
        pub fn update_channel_as_owner(origin) {

        }

        /// ...
        pub fn update_channel_as_curator(origin) {

        }



        /// ..
        pub fn create_version_store_credential(origin)  {


        }

        /// ...
        pub fn update_lead_role_account(origin) {

        }

        /// ...
        pub fn update_lead_reward_account(origin)  {

        }

        /// ...
        pub fn add_curator_opening(origin)  {

        }

        /// ...
        pub fn accept_curator_applications(origin)  {

        }

        /// ...
        pub fn begin_curator_applicant_review(origin) {
        }

        /// ...
        pub fn fill_curator_opening(origin) {

        }

        /// ...
        pub fn update_curator_reward(origin) {

        }

        /// ...
        pub fn slash_curator(origin) {

        }

        /// ...
        pub fn terminate_curator(origin) {

        }

        /// ...
        pub fn apply_on_curator_opening(origin) {

        }

        /// ...
        pub fn update_curator_role_account(origin) {


        }

        /// ...
        pub fn update_curator_reward_account(origin) {

        }

        /// ...
        pub fn exit_curator_role(origin) {

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

    pub fn update_lead_credential();
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