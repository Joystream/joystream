use crate::versioned_store_types::{PropertyIndex, SchemaId};
use codec::{Decode, Encode};
use rstd::collections::btree_map::BTreeMap;
use rstd::prelude::*;
use versioned_store::{ClassId, ClassPropertyValue, EntityId, PropertyValue};

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub enum ParametrizedPropertyValue {
    /// Same fields as normal PropertyValue
    PropertyValue(PropertyValue),

    /// This is the index of an operation creating an entity in the transaction/batch operations
    InternalEntityJustAdded(u32), // should really be usize but it doesn't have Encode/Decode support

                                  // InternalVec(Vec<DualType>),  // DualType -> enum EntityJustAdded, EntityId
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct ParametrizedClassPropertyValue {
    /// Index is into properties vector of class.
    pub in_class_index: PropertyIndex,

    /// Value of property with index `in_class_index` in a given class.
    pub value: ParametrizedPropertyValue,
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct CreateEntityOperation {
    pub class_id: ClassId,
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct UpdatePropertyValuesOperation {
    pub entity_id: EntityId,
    pub new_parametrised_property_values: Vec<ParametrizedClassPropertyValue>,
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct AddSchemaSupportToEntityOperation {
    pub entity_id: EntityId,
    pub schema_id: SchemaId,
    pub parametrised_property_values: Vec<ParametrizedClassPropertyValue>,
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub enum OperationType {
    CreateEntity(CreateEntityOperation),
    UpdatePropertyValues(UpdatePropertyValuesOperation),
    AddSchemaSupportToEntity(AddSchemaSupportToEntityOperation),
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct Operation<Credential> {
    pub with_credential: Option<Credential>,
    pub as_entity_maintainer: bool,
    pub operation_type: OperationType,
}

pub fn parametrised_property_values_to_property_values(
    created_entities: &BTreeMap<usize, EntityId>,
    parametrised_property_values: Vec<ParametrizedClassPropertyValue>,
) -> Result<Vec<ClassPropertyValue>, &'static str> {
    let mut class_property_values: Vec<ClassPropertyValue> = vec![];

    for parametrised_class_property_value in parametrised_property_values.into_iter() {
        let property_value = match parametrised_class_property_value.value {
            ParametrizedPropertyValue::PropertyValue(value) => value,
            ParametrizedPropertyValue::InternalEntityJustAdded(
                entity_created_in_operation_index,
            ) => {
                // Verify that referenced entity was indeed created created
                let op_index = entity_created_in_operation_index as usize;
                if created_entities.contains_key(&op_index) {
                    let entity_id = created_entities.get(&op_index).unwrap();
                    PropertyValue::Internal(*entity_id)
                } else {
                    return Err("EntityDoesNotExist");
                }
            }
        };

        class_property_values.push(ClassPropertyValue {
            in_class_index: parametrised_class_property_value.in_class_index,
            value: property_value,
        });
    }

    Ok(class_property_values)
}
