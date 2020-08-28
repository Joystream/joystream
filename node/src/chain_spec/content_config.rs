use node_runtime::{
    data_directory::DataObject,
    primitives::{BlockNumber, Credential},
    versioned_store::{Class, ClassId, Entity, EntityId, InputValidationLengthConstraint},
    versioned_store_permissions::ClassPermissions,
    ContentId, Runtime, VersionedStoreConfig,
};

use serde::Deserialize;

#[derive(Deserialize)]
pub struct ClassAndPermissions {
    class: Class,
    permissions: ClassPermissions<ClassId, Credential, u16, BlockNumber>,
}

#[derive(Deserialize)]
pub struct EntityAndMaintainer {
    entity: Entity,
    maintainer: Option<Credential>,
}

#[derive(Deserialize)]
pub struct DataObjectAndContentId {
    content_id: ContentId,
    // data_object: DataObjectInternal<u64, BlockNumber, Moment, u64, ActorId>,
    data_object: DataObject<Runtime>,
}

#[derive(Deserialize)]
pub struct ContentData {
    /// classes and their associted permissions
    classes: Vec<ClassAndPermissions>,
    /// entities and their associated maintainer
    entities: Vec<EntityAndMaintainer>,
    /// DataObject(s) and ContentId
    data_objects: Vec<DataObjectAndContentId>,
}

use std::{fs, path::Path};

fn parse_content_data(data_file: &Path) -> ContentData {
    let data = fs::read_to_string(data_file).expect("Failed reading file");
    serde_json::from_str(&data).expect("failed parsing members data")
}

pub fn versioned_store_config_from_json(data_file: &Path) -> VersionedStoreConfig {
    let content = parse_content_data(data_file);
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
