// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

#[cfg(feature = "std")]
//use serde_derive::{Deserialize, Serialize};
use rstd::prelude::*;

use codec::{Codec, Decode, Encode};
use runtime_primitives::traits::{MaybeSerializeDebug, Member, One, SimpleArithmetic};
use srml_support::traits::Currency;
use srml_support::{
    decl_module, decl_storage, ensure, EnumerableStorageMap, Parameter, StorageMap, StorageValue,
};
use std::iter::Iterator;

use runtime_primitives::traits::Zero;

//use crate::sr_api_hidden_includes_decl_storage::hidden_include::traits::Imbalance;

use rstd::collections::btree_map::BTreeMap;
use rstd::collections::btree_set::BTreeSet;

mod types;
mod macroes;
mod mock;
mod test;

use hiring::*;
use system;

use stake;

/// Module configuration trait for this Substrate module.
pub trait Trait: system::Trait + minting::Trait + RecurringReward::Trait + stake::Trait + Hiring::Trait + VersionedStorePermissions::Trait + Membership::Trait + Sized {

    /// Type for identifier for curators.
    type CuratorId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerializeDebug
        + PartialEq;

    /// Type for identifier for channels.
    type ChannelId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerializeDebug
        + PartialEq;

    /// Type for identifier for dynamic version store credential.
    type DynamicVersionedStoreCredentialId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerializeDebug
        + PartialEq;
}

pub type BalanceOf<T> =
    <<T as stake::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

pub type NegativeImbalance<T> =
    <<T as stake::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::NegativeImbalance;

decl_storage! {
    trait Store for Module<T: Trait> as ContentWorkingGroup {

        /// 
        /// 

        /// Whether
        pub LeadCredential get(lead_credential): BuiltInVersionStoreCredential;

        /// ...
        pub DynamicVersionedStoreCredentialById get(dynamic_versioned_store_credential_by_id): linked_map T::DynamicVersionedStoreCredentialId => DynamicVersionedStoreCredential<T>

        /// ...
        pub NextDynamicVersionedStoreCredentialId: T::DynamicVersionedStoreCredentialId;

    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        /*

        /// ...
        pub fn create_channel(type: ChannelType, owner: Trait::MemberId);

        /// ...
        pub fn transfer_channel_ownerhsip(channel_id: T::ChannelId);

        // perhaps curation can be done here in one go.

        /// ...
        pub fn update_channel_as_owner();

        /// ...
        pub fn update_channel_as_curator();

        /// ...
        pub fn update_lead_role_account();

        /// ...
        pub fn update_lead_reward_account();

        /// ...
        pub fn add_permission_group();

        /// ...
        pub fn update_permission_group();

        /// ...
        pub fn add_curator_opening();

        /// ...
        pub fn accept_curator_applications();

        /// ...
        pub fn begin_curator_applicant_review();

        /// ...
        pub fn fill_curator_opening();

        /// ...
        pub fn update_curator_reward();

        /// ...
        pub fn slash_curator();

        /// ...
        pub fn terminate_curator();

        /// ...
        pub fn apply_on_curator_opening();

        /// ...
        pub fn update_curator_role_account();

        /// ...
        pub fn update_curator_reward_account();

        /// ...
        pub fn exit_curator_role();
        */


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

enum GetCredentialFromIdResult {
    InvalidId
    BuiltIn(BuiltInVersionStoreCredential),
    Dynamic(DynamicVersionedStoreCredential)
}

impl<T: Trait> Module<T> {
    


    fn get_credential_from_id(credential_id: VersionedStorePermissions::Trait::CredentialId) -> GetCredentialFromIdResult {

        let  = credential_id_to_built_in_credential_holder(credential_id);

        // 2. 

        

    }
    
}