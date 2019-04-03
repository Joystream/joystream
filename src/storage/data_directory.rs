#![cfg_attr(not(feature = "std"), no_std)]

use crate::storage::data_object_type_registry::Trait as DOTRTrait;
use crate::traits::{ContentIdExists, IsActiveDataObjectType, Members};
use parity_codec::Codec;
use parity_codec_derive::{Decode, Encode};
use primitives::ed25519::Signature as Ed25519Signature;
use rstd::prelude::*;
use runtime_primitives::traits::{
    As, MaybeDebug, MaybeSerializeDebug, Member, SimpleArithmetic, Verify,
};
use srml_support::{
    decl_event, decl_module, decl_storage, dispatch, ensure, Parameter, StorageMap, StorageValue,
};
use system::{self, ensure_signed};

pub type Ed25519AuthorityId = <Ed25519Signature as Verify>::Signer;

pub trait Trait: timestamp::Trait + system::Trait + DOTRTrait + MaybeDebug {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type ContentId: Parameter
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
    type IsActiveDataObjectType: IsActiveDataObjectType<Self>;
}

static MSG_CID_NOT_FOUND: &str = "Content with this ID not found.";
static MSG_LIAISON_REQUIRED: &str = "Only the liaison for the content may modify its status.";
static MSG_CREATOR_MUST_BE_MEMBER: &str = "Only active members may create content.";
static MSG_DO_TYPE_MUST_BE_ACTIVE: &str =
    "Cannot create content for inactive or missing data object type.";

const DEFAULT_FIRST_CONTENT_ID: u64 = 1;

#[derive(Clone, Encode, Decode, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub enum LiaisonJudgement {
    Pending,
    Rejected,
    Accepted,
}

impl Default for LiaisonJudgement {
    fn default() -> Self {
        LiaisonJudgement::Pending
    }
}

#[derive(Clone, Encode, Decode, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub struct DataObject<T: Trait> {
    pub data_object_type: <T as DOTRTrait>::DataObjectTypeId,
    pub signing_key: Option<Ed25519AuthorityId>,
    pub size: u64,
    pub added_at_block: T::BlockNumber,
    pub added_at_time: T::Moment,
    pub owner: T::AccountId,
    pub liaison: T::AccountId,
    pub liaison_judgement: LiaisonJudgement,
}

decl_storage! {
    trait Store for Module<T: Trait> as DataDirectory {
        // Start at this value
        pub FirstContentId get(first_content_id) config(first_content_id): T::ContentId = T::ContentId::sa(DEFAULT_FIRST_CONTENT_ID);

        // Increment
        pub NextContentId get(next_content_id) build(|config: &GenesisConfig<T>| config.first_content_id): T::ContentId = T::ContentId::sa(DEFAULT_FIRST_CONTENT_ID);

        // Mapping of Content ID to Data Object
        pub Contents get(contents): map T::ContentId => Option<DataObject<T>>;
    }
}

decl_event! {
    pub enum Event<T> where
        <T as Trait>::ContentId,
        <T as system::Trait>::AccountId
    {
        // The account is the Liaison that was selected
        ContentAdded(ContentId, AccountId),

        // The account is the liaison again - only they can reject or accept
        ContentAccepted(ContentId, AccountId),
        ContentRejected(ContentId, AccountId),
    }
}

impl<T: Trait> ContentIdExists<T> for Module<T> {
    fn has_content(which: &T::ContentId) -> bool {
        Self::contents(which.clone()).is_some()
    }

    fn get_data_object(which: &T::ContentId) -> Result<DataObject<T>, &'static str> {
        match Self::contents(which.clone()) {
            None => Err(MSG_CID_NOT_FOUND),
            Some(data) => Ok(data),
        }
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        pub fn add_content(origin, data_object_type_id: <T as DOTRTrait>::DataObjectTypeId,
                           size: u64, signing_key: Option<Ed25519AuthorityId>) {
            // Origin has to be a member
            let who = ensure_signed(origin)?;
            ensure!(T::Members::is_active_member(&who), MSG_CREATOR_MUST_BE_MEMBER);

            // Data object type has to be active
            ensure!(T::IsActiveDataObjectType::is_active_data_object_type(&data_object_type_id), MSG_DO_TYPE_MUST_BE_ACTIVE);

            // The liaison is something we need to take from staked roles. The idea
            // is to select the liaison, for now randomly.
            // FIXME without that module, we're currently hardcoding it, to the
            // origin, which is wrong on many levels.
            let liaison = who.clone();

            // Let's create the entry then
            let new_id = Self::next_content_id();
            let data: DataObject<T> = DataObject {
                data_object_type: data_object_type_id,
                signing_key: signing_key,
                size: size,
                added_at_block: <system::Module<T>>::block_number(),
                added_at_time: <timestamp::Module<T>>::now(),
                owner: who,
                liaison: liaison.clone(),
                liaison_judgement: LiaisonJudgement::Pending,
            };

            // If we've constructed the data, we can store it and send an event.
            <Contents<T>>::insert(new_id, data);
            <NextContentId<T>>::mutate(|n| { *n += T::ContentId::sa(1); });

            Self::deposit_event(RawEvent::ContentAdded(new_id, liaison));
        }

        // The LiaisonJudgement can be updated, but only by the liaison.
        fn accept_content(origin, id: T::ContentId) {
            let who = ensure_signed(origin)?;
            Self::update_content_judgement(&who, id.clone(), LiaisonJudgement::Accepted)?;
            Self::deposit_event(RawEvent::ContentAccepted(id, who));
        }

        fn reject_content(origin, id: T::ContentId) {
            let who = ensure_signed(origin)?;
            Self::update_content_judgement(&who, id.clone(), LiaisonJudgement::Rejected)?;
            Self::deposit_event(RawEvent::ContentRejected(id, who));
        }
    }
}

impl<T: Trait> Module<T> {
    fn update_content_judgement(
        who: &T::AccountId,
        id: T::ContentId,
        judgement: LiaisonJudgement,
    ) -> dispatch::Result {
        // Find the data
        let mut data = Self::contents(&id).ok_or(MSG_CID_NOT_FOUND)?;

        // Make sure the liaison matches
        ensure!(data.liaison == *who, MSG_LIAISON_REQUIRED);

        // At this point we can update the data.
        data.liaison_judgement = judgement;

        // Update and send event.
        <Contents<T>>::insert(id, data);

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use crate::storage::mock::*;

    #[test]
    fn succeed_adding_content() {
        with_default_mock_builder(|| {
            // Register a content with 1234 bytes of type 1, which should be recognized.
            let res = TestDataDirectory::add_content(Origin::signed(1), 1, 1234, None);
            assert!(res.is_ok());
        });
    }

    #[test]
    fn accept_content_as_liaison() {
        with_default_mock_builder(|| {
            let res = TestDataDirectory::add_content(Origin::signed(1), 1, 1234, None);
            assert!(res.is_ok());

            // An appropriate event should have been fired.
            let (content_id, liaison) = match System::events().last().unwrap().event {
                MetaEvent::data_directory(data_directory::RawEvent::ContentAdded(
                    content_id,
                    liaison,
                )) => (content_id, liaison),
                _ => (0u64, 0xdeadbeefu64), // invalid value, unlikely to match
            };
            assert_ne!(liaison, 0xdeadbeefu64);

            // Accepting content should not work with some random origin
            let res = TestDataDirectory::accept_content(Origin::signed(42), content_id);
            assert!(res.is_err());

            // However, with the liaison as origin it should.
            let res = TestDataDirectory::accept_content(Origin::signed(liaison), content_id);
            assert!(res.is_ok());
        });
    }

    #[test]
    fn reject_content_as_liaison() {
        with_default_mock_builder(|| {
            let res = TestDataDirectory::add_content(Origin::signed(1), 1, 1234, None);
            assert!(res.is_ok());

            // An appropriate event should have been fired.
            let (content_id, liaison) = match System::events().last().unwrap().event {
                MetaEvent::data_directory(data_directory::RawEvent::ContentAdded(
                    content_id,
                    liaison,
                )) => (content_id, liaison),
                _ => (0u64, 0xdeadbeefu64), // invalid value, unlikely to match
            };
            assert_ne!(liaison, 0xdeadbeefu64);

            // Rejecting content should not work with some random origin
            let res = TestDataDirectory::reject_content(Origin::signed(42), content_id);
            assert!(res.is_err());

            // However, with the liaison as origin it should.
            let res = TestDataDirectory::reject_content(Origin::signed(liaison), content_id);
            assert!(res.is_ok());
        });
    }
}
