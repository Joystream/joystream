#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;
use parity_codec::Codec;
use parity_codec_derive::{Encode, Decode};
use srml_support::{StorageMap, StorageValue, decl_module, decl_storage, decl_event, ensure, Parameter, dispatch};
use runtime_primitives::traits::{SimpleArithmetic, As, Member, MaybeSerializeDebug, MaybeDebug};
use system::{self, ensure_signed};
use primitives::{Ed25519AuthorityId};
use crate::traits::{IsActiveMember, ContentIdExists};
use crate::membership::{members};
use crate::storage::data_directory::Trait as DDTrait;

pub trait Trait: timestamp::Trait + system::Trait + DDTrait + MaybeDebug {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type DataObjectStorageRelationshipId: Parameter + Member + SimpleArithmetic + Codec + Default + Copy
        + As<usize> + As<u64> + MaybeSerializeDebug + PartialEq;

    type IsActiveMember: IsActiveMember<Self>;
    type ContentIdExists: ContentIdExists<Self>;
}

static MSG_CID_NOT_FOUND: &str = "Content with this ID not found!";

const DEFAULT_FIRST_DATA_OBJECT_STORAGE_RELATIONSHIP_ID: u64 = 1;

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
        pub FirstDataObjectStorageRelationshipId get(first_data_object_storage_relationship_id) config(first_data_object_storage_relationship_id): T::DataObjectStorageRelationshipId = T::DataObjectStorageRelationshipId::sa(DEFAULT_FIRST_DATA_OBJECT_STORAGE_RELATIONSHIP_ID);

        // Increment
        pub NextDataObjectStorageRelationshipId get(next_data_object_storage_relationship_id) build(|config: &GenesisConfig<T>| config.first_data_object_storage_relationship_id): T::DataObjectStorageRelationshipId = T::DataObjectStorageRelationshipId::sa(DEFAULT_FIRST_DATA_OBJECT_STORAGE_RELATIONSHIP_ID);

        // Mapping of Data object types
        pub DataObjectStorageRelationshipMap get(data_object_storage_relationship): map T::DataObjectStorageRelationshipId => Option<DataObjectStorageRelationship<T>>;
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


decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        pub fn add_data_object_storage_relationship(origin, cid: T::ContentId) {
            // Origin has to be a storage provider
            let who = ensure_signed(origin).clone().unwrap();
            // TODO
            // if !T::IsActiveMember::is_active_member(&who) {
            //     return Err(MSG_CREATOR_MUST_BE_MEMBER);
            // }

            // Content ID must exist
            if !T::ContentIdExists::has_content(&cid) {
                return Err(MSG_CID_NOT_FOUND);
            }

            // Create new ID, data.
            let new_id = Self::next_data_object_storage_relationship_id();
            let dosr: DataObjectStorageRelationship<T> = DataObjectStorageRelationship {
                content_id: cid.clone(),
                storage_provider: who.clone(),
                ready: false,
            };

            <DataObjectStorageRelationshipMap<T>>::insert(new_id, dosr);
            <NextDataObjectStorageRelationshipId<T>>::mutate(|n| { *n += T::DataObjectStorageRelationshipId::sa(1); });

            // Emit event
            Self::deposit_event(RawEvent::DataObjectStorageRelationshipAdded(new_id, cid, who));
        }
    }

    // TODO storage provider may flip their own ready state
}

impl <T: Trait> Module<T> {
}
