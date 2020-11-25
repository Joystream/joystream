#![allow(dead_code)]

use codec::Decode;
use node_runtime::{
    content_directory::{ClassOf, EntityOf},
    data_directory::DataObject,
    ContentId, DataDirectoryConfig, Runtime,
};
use serde::Deserialize;
use std::{fs, path::Path};

// Because of the way that the @joystream/types were implemented the getters for
// the string types return a `string` not the `Text` type so when we are serializing
// them to json we get a string rather than an array of bytes, so deserializing them
// is failing. So we are relying on parity codec encoding instead..
#[derive(Decode)]
struct DataObjectAndContentId {
    content_id: ContentId,
    data_object: DataObject<Runtime>,
}

#[derive(Decode)]
struct ContentData {
    /// classes
    classes: Vec<ClassOf<Runtime>>,
    /// entities
    entities: Vec<EntityOf<Runtime>>,
    /// DataObject(s) and ContentId
    data_objects: Vec<DataObjectAndContentId>,
}

#[derive(Deserialize)]
struct EncodedClass {
    /// hex encoded Class
    class: String,
}

impl EncodedClass {
    fn decode(&self) -> ClassOf<Runtime> {
        // hex string must not include '0x' prefix!
        let encoded_class =
            hex::decode(&self.class[2..].as_bytes()).expect("failed to parse class hex string");
        Decode::decode(&mut encoded_class.as_slice()).unwrap()
    }
}

#[derive(Deserialize)]
struct EncodedEntity {
    /// hex encoded Entity
    entity: String,
}

impl EncodedEntity {
    fn decode(&self) -> EntityOf<Runtime> {
        // hex string must not include '0x' prefix!
        let encoded_entity =
            hex::decode(&self.entity[2..].as_bytes()).expect("failed to parse entity hex string");
        Decode::decode(&mut encoded_entity.as_slice()).unwrap()
    }
}

#[derive(Deserialize)]
struct EncodedDataObjectAndContentId {
    /// hex encoded ContentId
    content_id: String,
    /// hex encoded DataObject<Runtime>
    data_object: String,
}

impl EncodedDataObjectAndContentId {
    fn decode(&self) -> DataObjectAndContentId {
        // hex string must not include '0x' prefix!
        let encoded_content_id = hex::decode(&self.content_id[2..].as_bytes())
            .expect("failed to parse content_id hex string");
        let encoded_data_object = hex::decode(&self.data_object[2..].as_bytes())
            .expect("failed to parse data_object hex string");
        DataObjectAndContentId {
            content_id: Decode::decode(&mut encoded_content_id.as_slice()).unwrap(),
            data_object: Decode::decode(&mut encoded_data_object.as_slice()).unwrap(),
        }
    }
}

#[derive(Deserialize)]
struct EncodedContentData {
    /// classes and their associted permissions
    classes: Vec<EncodedClass>,
    /// entities and their associated maintainer
    entities: Vec<EncodedEntity>,
    /// DataObject(s) and ContentId
    data_objects: Vec<EncodedDataObjectAndContentId>,
}

fn parse_content_data(data_file: &Path) -> EncodedContentData {
    let data = fs::read_to_string(data_file).expect("Failed reading file");
    serde_json::from_str(&data).expect("failed parsing content data")
}

impl EncodedContentData {
    pub fn decode(&self) -> ContentData {
        ContentData {
            classes: self.classes.iter().map(|class| class.decode()).collect(),
            entities: self.entities.iter().map(|entity| entity.decode()).collect(),
            data_objects: self
                .data_objects
                .iter()
                .map(|data_object| data_object.decode())
                .collect(),
        }
    }
}

/// Generates a basic empty `DataDirectoryConfig` genesis config
pub fn empty_data_directory_config() -> DataDirectoryConfig {
    DataDirectoryConfig {
        data_object_by_content_id: vec![],
        known_content_ids: vec![],
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
        known_content_ids: content
            .data_objects
            .into_iter()
            .map(|object| object.content_id)
            .collect(),
    }
}
