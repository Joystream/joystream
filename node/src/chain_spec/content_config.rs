use codec::Decode;
use node_runtime::{
    common::storage::StorageObjectOwner,
    data_directory::{DataObject, Quota},
    ChannelId, ContentId, DAOId, DataDirectoryConfig, MemberId, Runtime,
};
use serde::Deserialize;
use std::{fs, path::Path};

// Because of the way that the @joystream/types were implemented the getters for
// the string types return a `string` not the `Text` type so when we are serializing
// them to json we get a string rather than an array of bytes, so deserializing them
// is failing. So we are relying on parity codec encoding instead..
#[derive(Decode)]
struct Content {
    content_id: ContentId,
    data_object: DataObject<Runtime>,
    storage_object_owner: StorageObjectOwner<MemberId, ChannelId, DAOId>,
    quota: Quota,
}

#[derive(Decode)]
struct ContentData {
    /// DataObject(s) and ContentId
    data_objects: Vec<Content>,
    quota_size_limit_upper_bound: u64,
    quota_objects_limit_upper_bound: u64,
    global_quota: Quota,
    uploading_blocked: bool,
}

#[derive(Deserialize)]
struct EncodedContent {
    /// hex encoded ContentId
    content_id: String,
    /// hex encoded DataObject<Runtime>
    data_object: String,
    /// hex encoded StorageObjectOwner
    storage_object_owner: String,
    /// hex encoded Quota
    quota: String,
}

impl EncodedContent {
    fn decode(&self) -> Content {
        // hex string must not include '0x' prefix!
        let encoded_content_id = hex::decode(&self.content_id[2..].as_bytes())
            .expect("failed to parse content_id hex string");
        let encoded_data_object = hex::decode(&self.data_object[2..].as_bytes())
            .expect("failed to parse data_object hex string");
        let encoded_storage_object_owner = hex::decode(&self.storage_object_owner[2..].as_bytes())
            .expect("failed to parse content_id hex string");
        let encoded_quota = hex::decode(&self.quota[2..].as_bytes())
            .expect("failed to parse data_object hex string");
        Content {
            content_id: Decode::decode(&mut encoded_content_id.as_slice()).unwrap(),
            data_object: Decode::decode(&mut encoded_data_object.as_slice()).unwrap(),
            storage_object_owner: Decode::decode(&mut encoded_storage_object_owner.as_slice())
                .unwrap(),
            quota: Decode::decode(&mut encoded_quota.as_slice()).unwrap(),
        }
    }
}

#[derive(Deserialize)]
struct EncodedContentData {
    /// EncodedContent
    data_objects: Vec<EncodedContent>,
    /// hex encoded QuotaSizeLimitUpperBound
    quota_size_limit_upper_bound: String,
    /// hex encoded QuotaObjectsLimitUpperBound
    quota_objects_limit_upper_bound: String,
    /// hex encoded GlobalQuota
    global_quota: String,
    /// hex encoded UploadingBlocked flag
    uploading_blocked: String,
}

fn parse_content_data(data_file: &Path) -> EncodedContentData {
    let data = fs::read_to_string(data_file).expect("Failed reading file");
    serde_json::from_str(&data).expect("failed parsing content data")
}

impl EncodedContentData {
    pub fn decode(&self) -> ContentData {
        ContentData {
            data_objects: self
                .data_objects
                .iter()
                .map(|data_objects| data_objects.decode())
                .collect(),
            quota_size_limit_upper_bound: {
                let encoded_quota_size_limit_upper_bound =
                    hex::decode(&self.quota_size_limit_upper_bound[2..].as_bytes())
                        .expect("failed to parse data_object hex string");

                Decode::decode(&mut encoded_quota_size_limit_upper_bound.as_slice()).unwrap()
            },
            quota_objects_limit_upper_bound: {
                let encoded_quota_objects_limit_upper_bound =
                    hex::decode(&self.quota_objects_limit_upper_bound[2..].as_bytes())
                        .expect("failed to parse data_object hex string");

                Decode::decode(&mut encoded_quota_objects_limit_upper_bound.as_slice()).unwrap()
            },
            global_quota: {
                let encoded_global_quota = hex::decode(&self.global_quota[2..].as_bytes())
                    .expect("failed to parse data_object hex string");

                Decode::decode(&mut encoded_global_quota.as_slice()).unwrap()
            },
            uploading_blocked: {
                let encoded_uploading_blocked =
                    hex::decode(&self.uploading_blocked[2..].as_bytes())
                        .expect("failed to parse data_object hex string");

                Decode::decode(&mut encoded_uploading_blocked.as_slice()).unwrap()
            },
        }
    }
}

/// Generates a basic empty `DataDirectoryConfig` genesis config
pub fn empty_data_directory_config() -> DataDirectoryConfig {
    DataDirectoryConfig {
        data_object_by_content_id: vec![],
        quotas: vec![],
        quota_size_limit_upper_bound: 20000,
        quota_objects_limit_upper_bound: 200,
        global_quota: Quota::new(2000000, 2000),
        uploading_blocked: false,
    }
}

/// Generates a `DataDirectoryConfig` genesis config
/// pre-populated with data objects and known content ids parsed from
/// a json file serialized as a `ContentData` struct
pub fn data_directory_config_from_json(data_file: &Path) -> DataDirectoryConfig {
    let content = parse_content_data(data_file).decode();

    DataDirectoryConfig {
        data_object_by_content_id: content
            .data_objects
            .iter()
            .map(|object| (object.content_id, object.data_object.clone()))
            .collect(),
        quotas: content
            .data_objects
            .iter()
            .map(|object| (object.storage_object_owner.clone(), object.quota))
            .collect(),
        quota_size_limit_upper_bound: content.quota_size_limit_upper_bound,
        quota_objects_limit_upper_bound: content.quota_objects_limit_upper_bound,
        global_quota: content.global_quota,
        uploading_blocked: content.uploading_blocked,
    }
}
