/*
 * XXX This module is not really supposed to be used this way, and therefore also lacks tests.
 *
 *     This is a straightforward implementation of the whitepaper's specs, and is intended to
 *     be iterated over. Please don't use it as-is.
 */

use crate::storage::data_directory::Trait as DDTrait;
use crate::storage::data_object_storage_registry::Trait as DOSRTrait;
use crate::traits::{ContentHasStorage, ContentIdExists};
use codec::{Codec, Decode, Encode};
use rstd::prelude::*;
use runtime_primitives::traits::{MaybeSerializeDebug, Member, SimpleArithmetic};
use srml_support::{
    decl_event, decl_module, decl_storage, ensure, Parameter, StorageMap, StorageValue,
};
use system::{self, ensure_signed};

pub trait Trait: timestamp::Trait + system::Trait + DOSRTrait + DDTrait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type DownloadSessionId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerializeDebug
        + PartialEq;

    type ContentHasStorage: ContentHasStorage<Self>;
}

static MSG_SESSION_NOT_FOUND: &str = "Download session with the given ID not found.";
static MSG_SESSION_HAS_ENDED: &str = "Download session with the given ID has already ended.";
static MSG_CONSUMER_REQUIRED: &str = "Download session can only be modified by the downloader.";
static MSG_INVALID_TRANSMITTED_VALUE: &str = "Invalid update to transmitted bytes value.";
static MSG_NEED_STORAGE_PROVIDER: &str =
    "Cannnot download without at least one active storage relationship.";

const DEFAULT_FIRST_DOWNLOAD_SESSION_ID: u32 = 1;

#[derive(Clone, Encode, Decode, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub enum DownloadState {
    Started,
    Ended,
}

impl Default for DownloadState {
    fn default() -> Self {
        DownloadState::Started
    }
}

#[derive(Clone, Encode, Decode, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub struct DownloadSession<T: Trait> {
    pub content_id: <T as DDTrait>::ContentId,
    pub consumer: T::AccountId,
    pub distributor: T::AccountId,
    // TODO use BlockAndTime instead
    pub initiated_at_block: T::BlockNumber,
    pub initiated_at_time: T::Moment,
    pub state: DownloadState,
    pub transmitted_bytes: u64,
}

decl_storage! {
    trait Store for Module<T: Trait> as DownloadSessions {
        // Start at this value
        pub FirstDownloadSessionId get(first_download_session_id) config(first_download_session_id): T::DownloadSessionId = T::DownloadSessionId::from(DEFAULT_FIRST_DOWNLOAD_SESSION_ID);

        // Increment
        pub NextDownloadSessionId get(next_download_session_id) build(|config: &GenesisConfig<T>| config.first_download_session_id): T::DownloadSessionId = T::DownloadSessionId::from(DEFAULT_FIRST_DOWNLOAD_SESSION_ID);

        // Mapping of Data object types
        pub DownloadSessions get(download_sessions): map T::DownloadSessionId => Option<DownloadSession<T>>;
    }
}

decl_event! {
    pub enum Event<T> where
        <T as DDTrait>::ContentId
    {
        // We send the content ID *only* because while we already leak download
        // session information by storing it on the public chain, there's no
        // need to advertise each download even more.
        DownloadStarted(ContentId),

        // Transmitted size is included in the ended event.
        DownloadEnded(ContentId, u64),
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        // Origin starts a download from distributor. It's the origin's responsibility to
        // start this, and hand the session ID to the distributor as proof they did.
        pub fn start_download(origin, content_id: <T as DDTrait>::ContentId, from: T::AccountId) {
            // Origin can be anyone, it doesn't have to be a member.
            let who = ensure_signed(origin)?;

            // There has to be a storage relationship for the content ID and storage provider.
            ensure!(T::ContentHasStorage::is_ready_at_storage_provider(&content_id, &from), MSG_NEED_STORAGE_PROVIDER);

            // Let's create the entry then
            let new_id = Self::next_download_session_id();
            let session: DownloadSession<T> = DownloadSession {
                content_id: content_id.clone(),
                consumer: who,
                distributor: from.clone(),
                initiated_at_block: <system::Module<T>>::block_number(),
                initiated_at_time: <timestamp::Module<T>>::now(),
                state: DownloadState::Started,
                transmitted_bytes: 0u64,
            };

            <DownloadSessions<T>>::insert(new_id, session);
            <NextDownloadSessionId<T>>::mutate(|n| { *n += T::DownloadSessionId::from(1); });

            // Fire off event
            Self::deposit_event(RawEvent::DownloadStarted(content_id));
        }

        // The downloader can also update the transmitted size, as long as it's
        // strictly larger.
        pub fn update_transmitted(origin, session_id: T::DownloadSessionId, transmitted_bytes: u64)
        {
            // Origin can be anyone, it doesn't have to be a member.
            let who = ensure_signed(origin)?;

            // Get session
            let mut session = Self::download_sessions(session_id).ok_or(MSG_SESSION_NOT_FOUND)?;

            // Ensure that the session hasn't ended yet.
            ensure!(session.state == DownloadState::Started, MSG_SESSION_HAS_ENDED);

            // Ensure that the origin is the consumer
            ensure!(session.consumer == who, MSG_CONSUMER_REQUIRED);

            // Ensure that the new transmitted size is larger than the old one
            ensure!(transmitted_bytes > session.transmitted_bytes, MSG_INVALID_TRANSMITTED_VALUE);

            // By fetching the content information, we can ensure that the transmitted
            // field also does not exceed the content size. Furthermore, we can
            // automatically detect when the download ended.
            let data_object = T::ContentIdExists::get_data_object(&session.content_id)?;
            ensure!(transmitted_bytes <= data_object.size, MSG_INVALID_TRANSMITTED_VALUE);

            let finished = transmitted_bytes == data_object.size;

            // Ok we can update the data.
            session.transmitted_bytes = transmitted_bytes;
            session.state = match finished {
                true => DownloadState::Ended,
                false => DownloadState::Started,
            };
            let content_id = session.content_id.clone();
            <DownloadSessions<T>>::insert(session_id, session);

            // Also announce if the download finished
            if finished {
                Self::deposit_event(RawEvent::DownloadEnded(content_id, transmitted_bytes));
            }
        }
    }
}
