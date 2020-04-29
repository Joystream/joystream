// Validation errors
// --------------------------------------

pub const ERROR_PROPERTY_NAME_TOO_SHORT: &str = "Property name is too short";
pub const ERROR_PROPERTY_NAME_TOO_LONG: &str = "Property name is too long";
pub const ERROR_PROPERTY_DESCRIPTION_TOO_SHORT: &str = "Property description is too long";
pub const ERROR_PROPERTY_DESCRIPTION_TOO_LONG: &str = "Property description is too long";

pub const ERROR_CLASS_NAME_TOO_SHORT: &str = "Class name is too short";
pub const ERROR_CLASS_NAME_TOO_LONG: &str = "Class name is too long";
pub const ERROR_CLASS_DESCRIPTION_TOO_SHORT: &str = "Class description is too long";
pub const ERROR_CLASS_DESCRIPTION_TOO_LONG: &str = "Class description is too long";

// Main logic errors
// --------------------------------------

pub const ERROR_CLASS_NOT_FOUND: &str = "Class was not found by id";
pub const ERROR_UNKNOWN_CLASS_SCHEMA_ID: &str = "Unknown class schema id";
pub const ERROR_CLASS_SCHEMA_NOT_ACTIVE: &str = "Given class schema is not active";
pub const ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_PROP_INDEX: &str =
    "New class schema refers to an unknown property index";
pub const ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_INTERNAL_ID: &str =
    "New class schema refers to an unknown internal class id";
pub const ERROR_NO_PROPS_IN_CLASS_SCHEMA: &str =
    "Cannot add a class schema with an empty list of properties";
pub const ERROR_ENTITY_NOT_FOUND: &str = "Entity was not found by id";
// pub const ERROR_ENTITY_ALREADY_DELETED: &str = "Entity is already deleted";
pub const ERROR_SCHEMA_ALREADY_ADDED_TO_ENTITY: &str =
    "Cannot add a schema that is already added to this entity";
pub const ERROR_PROP_VALUE_DONT_MATCH_TYPE: &str =
    "Some of the provided property values don't match the expected property type";
pub const ERROR_PROP_VALUE_DONT_MATCH_VEC_TYPE: &str =
    "Property value don't match the expected vector property type";
pub const ERROR_PROP_VALUE_UNDER_GIVEN_INDEX_IS_NOT_A_VECTOR: &str =
    "Property value under given index is not a vector";
pub const ERROR_PROP_VALUE_VEC_NONCES_DOES_NOT_MATCH: &str =
    "Current property value vector nonce does not equal to provided one";
pub const ERROR_PROP_NAME_NOT_UNIQUE_IN_CLASS: &str =
    "Property name is not unique within its class";
pub const ERROR_MISSING_REQUIRED_PROP: &str =
    "Some required property was not found when adding schema support to entity";
pub const ERROR_UNKNOWN_ENTITY_PROP_ID: &str = "Some of the provided property ids cannot be found on the current list of propery values of this entity";
pub const ERROR_TEXT_PROP_IS_TOO_LONG: &str = "Text propery is too long";
pub const ERROR_VEC_PROP_IS_TOO_LONG: &str = "Vector propery is too long";
pub const ERROR_ENTITY_PROP_VALUE_VECTOR_IS_TOO_LONG: &str =
    "Propery value vector can`t contain more values";
pub const ERROR_ENTITY_PROP_VALUE_VECTOR_INDEX_IS_OUT_OF_RANGE: &str =
    "Given property value vector index is out of range";
pub const ERROR_PROP_VALUE_TYPE_DOESNT_MATCH_INTERNAL_ENTITY_VECTOR_TYPE: &str =
    "Propery value type does not match internal entity vector type";
pub const ERROR_INTERNAL_PROP_DOES_NOT_MATCH_ITS_CLASS: &str =
    "Internal property does not match its class";
pub const ERROR_ENTITY_REFERENCE_COUNTER_DOES_NOT_EQUAL_TO_ZERO: &str =
    "Entity removal can`t be completed, as there are some property values pointing to given entity";
pub const ERROR_ENTITY_CREATOR_ALREADY_EXIST: &str = "Given entity creator already exist";
pub const ERROR_ENTITY_MAINTAINER_ALREADY_EXIST: &str = "Given entity maintainer already exist";
pub const ERROR_ENTITY_CREATOR_DOES_NOT_EXIST: &str = "Given entity creator does not exist";
pub const ERROR_ENTITY_MAINTAINER_DOES_NOT_EXIST: &str = "Given entity maintainer does not exist";
pub const ERROR_ENTITY_CREATION_VOUCHER_DOES_NOT_EXIST: &str =
    "Given entity creation voucher does not exist";
pub const ERROR_MAX_NUMBER_OF_ENTITIES_PER_CLASS_LIMIT_REACHED: &str =
    "Maximum numbers of entities per class limit reached";
pub const ERROR_VOUCHER_LIMIT_REACHED: &str = "Entities voucher limit reached";
