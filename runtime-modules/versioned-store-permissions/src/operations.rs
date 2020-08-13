use codec::{Decode, Encode};
use sp_std::collections::btree_map::BTreeMap;
use sp_std::vec;
use sp_std::vec::Vec;
use versioned_store::{ClassId, ClassPropertyValue, EntityId, PropertyValue};

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub enum ParametrizedPropertyValue {
    /// Same fields as normal PropertyValue
    PropertyValue(PropertyValue),

    /// This is the index of an operation creating an entity in the transaction/batch operations
    InternalEntityJustAdded(u32), // should really be usize but it doesn't have Encode/Decode support

    /// Vector of mix of Entities already existing and just added in a recent operation
    InternalEntityVec(Vec<ParameterizedEntity>),
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub enum ParameterizedEntity {
    InternalEntityJustAdded(u32),
    ExistingEntity(EntityId),
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct ParametrizedClassPropertyValue {
    /// Index is into properties vector of class.
    pub in_class_index: u16,

    /// Value of property with index `in_class_index` in a given class.
    pub value: ParametrizedPropertyValue,
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct CreateEntityOperation {
    pub class_id: ClassId,
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct UpdatePropertyValuesOperation {
    pub entity_id: ParameterizedEntity,
    pub new_parametrized_property_values: Vec<ParametrizedClassPropertyValue>,
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct AddSchemaSupportToEntityOperation {
    pub entity_id: ParameterizedEntity,
    pub schema_id: u16,
    pub parametrized_property_values: Vec<ParametrizedClassPropertyValue>,
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

pub fn parametrized_entity_to_entity_id(
    created_entities: &BTreeMap<usize, EntityId>,
    entity: ParameterizedEntity,
) -> Result<EntityId, &'static str> {
    match entity {
        ParameterizedEntity::ExistingEntity(entity_id) => Ok(entity_id),
        ParameterizedEntity::InternalEntityJustAdded(op_index_u32) => {
            let op_index = op_index_u32 as usize;
            if created_entities.contains_key(&op_index) {
                let entity_id = created_entities.get(&op_index).unwrap();
                Ok(*entity_id)
            } else {
                Err("EntityNotCreatedByOperation")
            }
        }
    }
}

pub fn parametrized_property_values_to_property_values(
    created_entities: &BTreeMap<usize, EntityId>,
    parametrized_property_values: Vec<ParametrizedClassPropertyValue>,
) -> Result<Vec<ClassPropertyValue>, &'static str> {
    let mut class_property_values: Vec<ClassPropertyValue> = vec![];

    for parametrized_class_property_value in parametrized_property_values.into_iter() {
        let property_value = match parametrized_class_property_value.value {
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
                    return Err("EntityNotCreatedByOperation");
                }
            }
            ParametrizedPropertyValue::InternalEntityVec(parametrized_entities) => {
                let mut entities: Vec<EntityId> = vec![];

                for parametrized_entity in parametrized_entities.into_iter() {
                    match parametrized_entity {
                        ParameterizedEntity::ExistingEntity(id) => entities.push(id),
                        ParameterizedEntity::InternalEntityJustAdded(
                            entity_created_in_operation_index,
                        ) => {
                            let op_index = entity_created_in_operation_index as usize;
                            if created_entities.contains_key(&op_index) {
                                let entity_id = created_entities.get(&op_index).unwrap();
                                entities.push(*entity_id);
                            } else {
                                return Err("EntityNotCreatedByOperation");
                            }
                        }
                    }
                }

                PropertyValue::InternalVec(entities)
            }
        };

        class_property_values.push(ClassPropertyValue {
            in_class_index: parametrized_class_property_value.in_class_index,
            value: property_value,
        });
    }

    Ok(class_property_values)
}
