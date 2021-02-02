use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_runtime::DispatchResult;
use sp_std::vec::Vec;

#[derive(Clone, Encode, Decode, PartialEq, Eq, Debug)]
pub struct ContentParameters<ContentId, DataObjectTypeId> {
    pub content_id: ContentId,
    pub type_id: DataObjectTypeId,
    pub size: u64,
    pub ipfs_content_id: Vec<u8>,
}

// TODO Reuse enum in ../working_group.rs
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Clone, Encode, Decode, PartialEq, Eq, Debug)]
pub enum WorkingGroupType {
    ContentDirectory,
    Builders,
    StorageProviders,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Clone, Encode, Decode, PartialEq, Eq, Debug)]
pub enum AbstractStorageObjectOwner<ChannelId, DAOId> {
    Channel(ChannelId), // acts through content directory module, where again DAOs can own channels for example
    DAO(DAOId),         // acts through upcoming `content_finance` module
    Council,            // acts through proposal system
    WorkingGroup(WorkingGroupType), // acts through new extrinsic in working group
}

// New owner type for storage object struct
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Clone, Encode, Decode, PartialEq, Eq, Debug)]
pub enum StorageObjectOwner<MemberId, ChannelId, DAOId> {
    Member(MemberId),
    AbstractStorageObjectOwner(AbstractStorageObjectOwner<ChannelId, DAOId>),
}

// To be implemented by current storage data_directory runtime module.
// Defined in 'common' package
pub trait StorageSystem<T: crate::StorageOwnership + crate::MembershipTypes> {
    // Should hook into call on storage system,
    // but requires rich error (with reasons)  types.
    // caller already knows the `ContentId`s as they are part of
    // the ContentUploadParameters
    fn atomically_add_content(
        owner: StorageObjectOwner<T::MemberId, T::ChannelId, T::DAOId>,
        content_parameters: Vec<ContentParameters<T::ContentId, T::DataObjectTypeId>>,
    ) -> DispatchResult;
}
