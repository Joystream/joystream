use crate::versioned_store_types::{PropertyIndex, SchemaId};
use codec::{Decode, Encode};
use versioned_store::{ClassId, EntityId, PropertyValue};

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub enum ParametrizedPropertyValue {
    /// Same fields as normal PropertyValue
    PropertyValue(PropertyValue),

    /// This is the index of an operation creating an entity in the transaction/batch operations
    InternalEntityJustAdded(u32),
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
