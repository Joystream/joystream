#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;
use parity_codec::Codec;
use parity_codec_derive::{Encode, Decode};
use srml_support::{StorageMap, decl_module, decl_storage, decl_event, ensure, Parameter, dispatch};
use runtime_primitives::traits::{SimpleArithmetic, As, Member, MaybeSerializeDebug, MaybeDebug};
use system::{self, ensure_signed};
use primitives::{Ed25519AuthorityId};
use crate::traits::{IsActiveMember, IsActiveDataObjectType, ContentIdExists};
use crate::membership::{members};
use crate::storage::data_object_type_registry::Trait as DOTRTrait;

pub trait Trait: timestamp::Trait + system::Trait + DOTRTrait + MaybeDebug {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type ContentId: Parameter + Member + Codec + Default + Copy
        + MaybeSerializeDebug + PartialEq;

    type IsActiveMember: IsActiveMember<Self>;
    type IsActiveDataObjectType: IsActiveDataObjectType<Self>;
}

static MSG_DUPLICATE_CID: &str = "Content with this ID already exists!";
static MSG_CID_NOT_FOUND: &str = "Content with this ID not found!";
static MSG_LIAISON_REQUIRED: &str = "Only the liaison for the content may modify its status!";
static MSG_CREATOR_MUST_BE_MEMBER: &str = "Only active members may create content!";
static MSG_DO_TYPE_MUST_BE_ACTIVE: &str = "Cannot create content for inactive of missing data object type!";

#[derive(Clone, Encode, Decode, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub enum LiaisonJudgement
{
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
    pub size: u64,
    pub added_at_block: T::BlockNumber,
    pub added_at_time: T::Moment,
    pub origin: T::AccountId,
    pub liaison: T::AccountId,
    pub liaison_judgement: LiaisonJudgement,
}

decl_storage! {
    trait Store for Module<T: Trait> as DataDirectory {
        // Mapping of Content ID to Data Object
        pub ContentMap get(content): map T::ContentId => Option<DataObject<T>>;
    }
}

decl_event! {
    pub enum Event<T> where
        <T as Trait>::ContentId,
        <T as system::Trait>::AccountId
    {
        ContentAdded(ContentId, AccountId),
        ContentAccepted(ContentId),
        ContentRejected(ContentId),
    }
}

impl<T: Trait> ContentIdExists<T> for Module<T> {
    fn has_content(which: &T::ContentId) -> bool {
        match Self::content(*which) {
            Some(_content) => true,
            None => false,
        }
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        pub fn add_content(origin, data_object_type_id: <T as DOTRTrait>::DataObjectTypeId,
                           id: T::ContentId, size: u64) {
            // Origin has to be a member
            let who = ensure_signed(origin).clone().unwrap();
            if !T::IsActiveMember::is_active_member(&who) {
                return Err(MSG_CREATOR_MUST_BE_MEMBER);
            }

            // Data object type has to be active
            if !T::IsActiveDataObjectType::is_active_data_object_type(&data_object_type_id) {
                return Err(MSG_DO_TYPE_MUST_BE_ACTIVE);
            }

            // We essentially accept the content ID and size at face value. All we
            // need to know is that it doesn't yet exist.
            let found = Self::content(&id);
            ensure!(found.is_none(), MSG_DUPLICATE_CID);

            // The liaison is something we need to take from staked roles. The idea
            // is to select the liaison, for now randomly.
            // FIXME without that module, we're currently hardcoding it, to the
            // origin, which is wrong on many levels.
            let liaison = who.clone();

            // Let's create the entry then
            let data: DataObject<T> = DataObject {
                data_object_type: data_object_type_id,
                size: size,
                added_at_block: <system::Module<T>>::block_number(),
                added_at_time: <timestamp::Module<T>>::now(),
                origin: who,
                liaison: liaison.clone(),
                liaison_judgement: LiaisonJudgement::Pending,
            };

            // If we've constructed the data, we can store it and send an event.
            <ContentMap<T>>::insert(id, data);
            Self::deposit_event(RawEvent::ContentAdded(id, liaison));
        }

        // The LiaisonJudgement can be updated, but only by the liaison.
        fn accept_content(origin, id: T::ContentId)
        {
            Self::update_content_judgement(origin, id, LiaisonJudgement::Accepted)?;
            Self::deposit_event(RawEvent::ContentAccepted(id));
        }

        fn reject_content(origin, id: T::ContentId)
        {
            Self::update_content_judgement(origin, id, LiaisonJudgement::Rejected)?;
            Self::deposit_event(RawEvent::ContentAccepted(id));
        }
    }
}

impl <T: Trait> Module<T> {
    fn update_content_judgement(origin: T::Origin, id: T::ContentId, judgement: LiaisonJudgement) -> dispatch::Result
    {
        let who = ensure_signed(origin);

        // Find the data
        let found = Self::content(&id).ok_or(MSG_CID_NOT_FOUND);

        // Make sure the liaison matches
        let mut data = found.unwrap();
        if data.liaison != who.unwrap() {
            return Err(MSG_LIAISON_REQUIRED);
        }

        // At this point we can update the data.
        data.liaison_judgement = judgement;

        // Update and send event.
        <ContentMap<T>>::insert(id, data);

        Ok(())
    }
}
