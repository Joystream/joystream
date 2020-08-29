use node_runtime::{
    data_directory::DataObject,
    primitives::{BlockNumber, Credential},
    versioned_store::{Class, ClassId, Entity, EntityId, InputValidationLengthConstraint},
    versioned_store_permissions::ClassPermissions,
    ContentId, Runtime, VersionedStoreConfig, VersionedStorePermissionsConfig,
};

use codec::Decode;
use serde::Deserialize;
use std::{fs, path::Path};

// Because of the way that the @joystream/types were implemented the getters for
// the string types return a `string` not the `Text` type so when we are serializing
// them to json we get a string rather than an array of bytes, so deserializing them
// is failing. So we are relying on parity codec encoding instead..
#[derive(Decode)]
struct ClassAndPermissions {
    class: Class,
    permissions: ClassPermissions<ClassId, Credential, u16, BlockNumber>,
}

#[derive(Decode)]
struct EntityAndMaintainer {
    entity: Entity,
    maintainer: Option<Credential>,
}

#[derive(Decode)]
struct DataObjectAndContentId {
    content_id: ContentId,
    data_object: DataObject<Runtime>,
}

#[derive(Decode)]
struct ContentData {
    /// classes and their associted permissions
    classes: Vec<ClassAndPermissions>,
    /// entities and their associated maintainer
    entities: Vec<EntityAndMaintainer>,
    /// DataObject(s) and ContentId
    data_objects: Vec<DataObjectAndContentId>,
}

#[derive(Deserialize)]
struct EncodedClassAndPermissions {
    /// hex encoded Class
    class: String,
    /// hex encoded ClassPermissions<ClassId, Credential, u16, BlockNumber>,
    permissions: String,
}

impl EncodedClassAndPermissions {
    fn decode(&self) -> ClassAndPermissions {
        // hex string must not include '0x' prefix!
        let encoded_class =
            hex::decode(&self.class[2..].as_bytes()).expect("failed to parse class hex string");
        let encoded_permissions = hex::decode(&self.permissions[2..].as_bytes())
            .expect("failed to parse class permissions hex string");
        ClassAndPermissions {
            class: Decode::decode(&mut encoded_class.as_slice()).unwrap(),
            permissions: Decode::decode(&mut encoded_permissions.as_slice()).unwrap(),
        }
    }
}

#[derive(Deserialize)]
struct EncodedEntityAndMaintainer {
    /// hex encoded Entity
    entity: String,
    /// hex encoded Option<Credential>
    maintainer: Option<String>,
}

impl EncodedEntityAndMaintainer {
    fn decode(&self) -> EntityAndMaintainer {
        // hex string must not include '0x' prefix!
        let encoded_entity =
            hex::decode(&self.entity[2..].as_bytes()).expect("failed to parse entity hex string");
        let encoded_maintainer = self.maintainer.as_ref().map(|maintainer| {
            hex::decode(&maintainer[2..].as_bytes()).expect("failed to parse maintainer hex string")
        });
        EntityAndMaintainer {
            entity: Decode::decode(&mut encoded_entity.as_slice()).unwrap(),
            maintainer: encoded_maintainer
                .map(|maintainer| Decode::decode(&mut maintainer.as_slice()).unwrap()),
        }
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
    classes: Vec<EncodedClassAndPermissions>,
    /// entities and their associated maintainer
    entities: Vec<EncodedEntityAndMaintainer>,
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
            classes: self
                .classes
                .iter()
                .map(|class_and_perm| class_and_perm.decode())
                .collect(),
            entities: self
                .entities
                .iter()
                .map(|entities_and_maintainer| entities_and_maintainer.decode())
                .collect(),
            data_objects: self
                .data_objects
                .iter()
                .map(|data_objects| data_objects.decode())
                .collect(),
        }
    }
}

pub fn versioned_store_config_from_json(data_file: &Path) -> VersionedStoreConfig {
    let content = parse_content_data(data_file).decode();
    let base_config = empty_versioned_store_config();
    let first_id = 1;

    let next_class_id: ClassId = content
        .classes
        .last()
        .map_or(first_id, |class_and_perm| class_and_perm.class.id + 1);
    assert_eq!(next_class_id, (content.classes.len() + 1) as ClassId);

    let next_entity_id: EntityId = content
        .entities
        .last()
        .map_or(first_id, |entity_and_maintainer| {
            entity_and_maintainer.entity.id + 1
        });
    assert_eq!(next_entity_id, (content.entities.len() + 1) as EntityId);

    VersionedStoreConfig {
        class_by_id: content
            .classes
            .into_iter()
            .map(|class_and_permissions| {
                (class_and_permissions.class.id, class_and_permissions.class)
            })
            .collect(),
        entity_by_id: content
            .entities
            .into_iter()
            .map(|entity_and_maintainer| {
                (
                    entity_and_maintainer.entity.id,
                    entity_and_maintainer.entity,
                )
            })
            .collect(),
        next_class_id,
        next_entity_id,
        ..base_config
    }
}

fn new_validation(min: u16, max_min_diff: u16) -> InputValidationLengthConstraint {
    InputValidationLengthConstraint { min, max_min_diff }
}

pub fn empty_versioned_store_config() -> VersionedStoreConfig {
    VersionedStoreConfig {
        class_by_id: vec![],
        entity_by_id: vec![],
        next_class_id: 1,
        next_entity_id: 1,
        property_name_constraint: new_validation(1, 99),
        property_description_constraint: new_validation(1, 999),
        class_name_constraint: new_validation(1, 99),
        class_description_constraint: new_validation(1, 999),
    }
}

pub fn empty_versioned_store_permissions_config() -> VersionedStorePermissionsConfig {
    VersionedStorePermissionsConfig {
        class_permissions_by_class_id: vec![],
        entity_maintainer_by_entity_id: vec![],
    }
}

pub fn versioned_store_permissions_config_from_json(
    data_file: &Path,
) -> VersionedStorePermissionsConfig {
    let content = parse_content_data(data_file).decode();

    VersionedStorePermissionsConfig {
        class_permissions_by_class_id: content
            .classes
            .into_iter()
            .map(|class_and_perm| (class_and_perm.class.id, class_and_perm.permissions))
            .collect(),
        entity_maintainer_by_entity_id: content
            .entities
            .into_iter()
            .filter_map(|entity_and_maintainer| {
                entity_and_maintainer
                    .maintainer
                    .map(|maintainer| (entity_and_maintainer.entity.id, maintainer))
            })
            .collect(),
    }
}
