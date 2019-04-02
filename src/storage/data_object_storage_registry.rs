#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;
use parity_codec::Codec;
use parity_codec_derive::{Encode, Decode};
use srml_support::{StorageMap, StorageValue, decl_module, decl_storage, decl_event, Parameter, dispatch, ensure};
use runtime_primitives::traits::{SimpleArithmetic, As, Member, MaybeSerializeDebug, MaybeDebug};
use system::{self, ensure_signed};
use crate::traits::{IsActiveMember, ContentIdExists, ContentHasStorage};
use crate::storage::data_directory::Trait as DDTrait;

pub trait Trait: timestamp::Trait + system::Trait + DDTrait + MaybeDebug {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type DataObjectStorageRelationshipId: Parameter + Member + SimpleArithmetic + Codec + Default + Copy
        + As<usize> + As<u64> + MaybeSerializeDebug + PartialEq;

    type IsActiveMember: IsActiveMember<Self>;
    type ContentIdExists: ContentIdExists<Self>;
}

static MSG_CID_NOT_FOUND: &str = "Content with this ID not found!";
static MSG_DOSR_NOT_FOUND: &str = "No data object storage relationship found for this ID.";
static MSG_ONLY_STORAGE_PROVIDER_MAY_CLAIM_READY: &str = "Only the storage provider in a DOSR can decide whether they're ready.";

const DEFAULT_FIRST_RELATIONSHIP_ID: u64 = 1;

#[derive(Clone, Encode, Decode, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub struct DataObjectStorageRelationship<T: Trait> {
    pub content_id: <T as DDTrait>::ContentId,
    pub storage_provider: T::AccountId,
    pub ready: bool,
}

decl_storage! {
    trait Store for Module<T: Trait> as DataObjectStorageRegistry {
        // Start at this value
        pub FirstRelationshipId get(first_relationship_id) config(first_relationship_id): T::DataObjectStorageRelationshipId = T::DataObjectStorageRelationshipId::sa(DEFAULT_FIRST_RELATIONSHIP_ID);

        // Increment
        pub NextRelationshipId get(next_relationship_id) build(|config: &GenesisConfig<T>| config.first_relationship_id): T::DataObjectStorageRelationshipId = T::DataObjectStorageRelationshipId::sa(DEFAULT_FIRST_RELATIONSHIP_ID);

        // Mapping of Data object types
        pub Relationships get(relationships): map T::DataObjectStorageRelationshipId => Option<DataObjectStorageRelationship<T>>;

        // Keep a list of storage relationships per CID
        pub RelationshipsByContentId get(relationships_by_content_id): map T::ContentId => Vec<T::DataObjectStorageRelationshipId>;
    }
}

decl_event! {
    pub enum Event<T> where
        <T as DDTrait>::ContentId,
        <T as Trait>::DataObjectStorageRelationshipId,
        <T as system::Trait>::AccountId
    {
        DataObjectStorageRelationshipAdded(DataObjectStorageRelationshipId, ContentId, AccountId),
        DataObjectStorageRelationshipReadyUpdated(DataObjectStorageRelationshipId, bool),
    }
}

impl<T: Trait> ContentHasStorage<T> for Module<T> {
    fn has_storage_provider(which: &T::ContentId) -> bool {
        let dosr_list = Self::relationships_by_content_id(which);
        return dosr_list.iter().any(|&dosr_id| Self::relationships(dosr_id).unwrap().ready);
    }

    fn is_ready_at_storage_provider(which: &T::ContentId, provider: &T::AccountId) -> bool {
        let dosr_list = Self::relationships_by_content_id(which);
        return dosr_list.iter().any(|&dosr_id| {
            let dosr = Self::relationships(dosr_id).unwrap();
            dosr.storage_provider == *provider && dosr.ready
        });
    }
}



decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        pub fn add_relationship(origin, cid: T::ContentId) {
            // Origin has to be a storage provider
            let who = ensure_signed(origin)?;
            // TODO check for being staked as a storage provider
            // if !T::IsActiveMember::is_active_member(&who) {
            //     return Err(MSG_CREATOR_MUST_BE_MEMBER);
            // }

            // Content ID must exist
            ensure!(T::ContentIdExists::has_content(&cid), MSG_CID_NOT_FOUND);

            // Create new ID, data.
            let new_id = Self::next_relationship_id();
            let dosr: DataObjectStorageRelationship<T> = DataObjectStorageRelationship {
                content_id: cid.clone(),
                storage_provider: who.clone(),
                ready: false,
            };

            <Relationships<T>>::insert(new_id, dosr);
            <NextRelationshipId<T>>::mutate(|n| { *n += T::DataObjectStorageRelationshipId::sa(1); });

            // Also add the DOSR to the list of DOSRs for the CID. Uniqueness is guaranteed
            // by the map, so we can just append the new_id to the list.
            let mut dosr_list = Self::relationships_by_content_id(cid.clone());
            dosr_list.push(new_id);

            // Emit event
            Self::deposit_event(RawEvent::DataObjectStorageRelationshipAdded(new_id, cid, who));
        }

        // A storage provider may flip their own ready state, but nobody else.
        pub fn set_relationship_ready(origin, id: T::DataObjectStorageRelationshipId) {
            Self::toggle_dosr_ready(origin, id, true)?;
        }

        pub fn unset_relationship_ready(origin, id: T::DataObjectStorageRelationshipId) {
            Self::toggle_dosr_ready(origin, id, false)?;
        }
    }
}

impl <T: Trait> Module<T> {
    fn toggle_dosr_ready(origin: T::Origin, id: T::DataObjectStorageRelationshipId, ready: bool) -> dispatch::Result {
        // Origin has to be the storage provider mentioned in the DOSR
        let who = ensure_signed(origin)?;

        // For that, we need to fetch the identified DOSR
        let found = Self::relationships(id).ok_or(MSG_DOSR_NOT_FOUND);
        let mut dosr = found.unwrap();
        ensure!(dosr.storage_provider == who, MSG_ONLY_STORAGE_PROVIDER_MAY_CLAIM_READY);

        // Flip to ready
        dosr.ready = ready;

        // Update DOSR and fire event.
        <Relationships<T>>::insert(id, dosr);
        Self::deposit_event(RawEvent::DataObjectStorageRelationshipReadyUpdated(id, true));

        Ok(())
    }
}
