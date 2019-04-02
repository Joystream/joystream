#![cfg_attr(not(feature = "std"), no_std)]

use crate::storage::data_object_type_registry::Trait as DOTRTrait;
use crate::traits::Members;
use parity_codec::Codec;
use parity_codec_derive::{Decode, Encode};
use rstd::prelude::*;
use runtime_primitives::traits::{As, MaybeDebug, MaybeSerializeDebug, Member, SimpleArithmetic};
use srml_support::{
    decl_event, decl_module, decl_storage, ensure, Parameter, StorageMap, StorageValue,
};
use system::{self, ensure_signed};

pub trait Trait: timestamp::Trait + system::Trait + DOTRTrait + MaybeDebug {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type MetadataId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + As<usize>
        + As<u64>
        + MaybeSerializeDebug
        + PartialEq;

    // Schema ID should be defined in a different Trait in future
    type SchemaId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + As<usize>
        + As<u64>
        + MaybeSerializeDebug
        + PartialEq;

    type Members: Members<Self>;
}

static MSG_CREATOR_MUST_BE_MEMBER: &str = "Only active members may create content!";
// TODO for future: static MSG_INVALID_SCHEMA_ID: &str = "The metadata schema is not known or invalid!";
static MSG_METADATA_NOT_FOUND: &str = "Metadata with the given ID cannot be found!";
static MSG_ONLY_OWNER_MAY_PUBLISH: &str = "Only metadata owners may publish their metadata!";

const DEFAULT_FIRST_METADATA_ID: u64 = 1;

#[derive(Clone, Encode, Decode, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub enum MetadataState {
    Draft,
    Published,
}

impl Default for MetadataState {
    fn default() -> Self {
        MetadataState::Draft
    }
}

// Content metadata contains two fields: one is the numeric ID of the metadata
// scheme to use, which is currently related to off-chain definitions ONLY.
// The other is the serialized metadata.
#[derive(Clone, Encode, Decode, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub struct ContentMetadata<T: Trait> {
    pub schema: T::SchemaId,
    pub metadata: Vec<u8>,
    pub origin: T::AccountId,
    pub state: MetadataState,
}

decl_event! {
    pub enum Event<T> where
        <T as Trait>::MetadataId
    {
        MetadataDraftCreated(MetadataId),
        MetadataPublished(MetadataId),
    }
}

decl_storage! {
    trait Store for Module<T: Trait> as ContentDirectory {
        // Start at this value
        pub FirstMetadataId get(first_metadata_id) config(first_metadata_id): T::MetadataId = T::MetadataId::sa(DEFAULT_FIRST_METADATA_ID);

        // Increment
        pub NextMetadataId get(next_metadata_id) build(|config: &GenesisConfig<T>| config.first_metadata_id): T::MetadataId = T::MetadataId::sa(DEFAULT_FIRST_METADATA_ID);

        // Mapping of Data object types
        pub MetadataMap get(metadata): map T::MetadataId => Option<ContentMetadata<T>>;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        pub fn add_metadata(origin, schema: T::SchemaId, metadata: Vec<u8>)
        {
            // Origin has to be a member
            let who = ensure_signed(origin)?;
            ensure!(T::Members::is_active_member(&who), MSG_CREATOR_MUST_BE_MEMBER);

            // TODO in future, we want the schema IDs to correspond to a schema
            // registry, and validate the data. For now, we just allow the
            // following schema IDs:
            // 1 - Video (schema TBD, i.e. handled in UI only)
            // 2 - Podcast (schema TBD, i.e. handled in UI only)
            // Pseudocode
            // if schema not in (1, 2) {
            //     return Err(MSG_INVALID_SCHEMA_ID);
            // }

            // New and data
            let new_id = Self::next_metadata_id();
            let data: ContentMetadata<T> = ContentMetadata {
                origin: who.clone(),
                schema: schema,
                metadata: metadata.clone(),
                state: MetadataState::Draft,
            };

            // Store
            <MetadataMap<T>>::insert(new_id, data);
            <NextMetadataId<T>>::mutate(|n| { *n += T::MetadataId::sa(1); });

            // Publish event
            Self::deposit_event(RawEvent::MetadataDraftCreated(new_id));
        }

        pub fn publish_metadata(origin, id: T::MetadataId)
        {
            // Ensure signed account
            let who = ensure_signed(origin)?;

            // Try t find metadata
            let mut data = Self::metadata(id).ok_or(MSG_METADATA_NOT_FOUND)?;

            // Ensure it's the metadata creator who publishes
            ensure!(data.origin == who, MSG_ONLY_OWNER_MAY_PUBLISH);

            // Modify
            data.state = MetadataState::Published;

            // Store
            <MetadataMap<T>>::insert(id, data);

            // Publish event
            Self::deposit_event(RawEvent::MetadataPublished(id));
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::storage::mock::*;

    #[test]
    fn add_metadata() {
        with_default_mock_builder(|| {
            let res =
                TestContentDirectory::add_metadata(Origin::signed(1), 1, "foo".as_bytes().to_vec());
            assert!(res.is_ok());
        });
    }

    #[test]
    fn publish_metadata() {
        with_default_mock_builder(|| {
            let res =
                TestContentDirectory::add_metadata(Origin::signed(1), 1, "foo".as_bytes().to_vec());
            assert!(res.is_ok());

            // Grab ID from event
            let metadata_id = match System::events().last().unwrap().event {
                MetaEvent::content_directory(
                    content_directory::RawEvent::MetadataDraftCreated(metadata_id),
                ) => metadata_id,
                _ => 0xdeadbeefu64, // invalid value, unlikely to match
            };
            assert_ne!(metadata_id, 0xdeadbeefu64);

            // Publishing a bad ID should fail
            let res = TestContentDirectory::publish_metadata(Origin::signed(1), metadata_id + 1);
            assert!(res.is_err());

            // Publishing should not work for non-owners
            let res = TestContentDirectory::publish_metadata(Origin::signed(2), metadata_id);
            assert!(res.is_err());

            // For the owner, it should work however
            let res = TestContentDirectory::publish_metadata(Origin::signed(1), metadata_id);
            assert!(res.is_ok());
        });
    }
}
