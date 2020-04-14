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
pub const ERROR_PROP_NAME_NOT_UNIQUE_IN_CLASS: &str =
    "Property name is not unique within its class";
pub const ERROR_MISSING_REQUIRED_PROP: &str =
    "Some required property was not found when adding schema support to entity";
pub const ERROR_UNKNOWN_ENTITY_PROP_ID: &str = "Some of the provided property ids cannot be found on the current list of propery values of this entity";
pub const ERROR_TEXT_PROP_IS_TOO_LONG: &str = "Text propery is too long";
pub const ERROR_VEC_PROP_IS_TOO_LONG: &str = "Vector propery is too long";
pub const ERROR_ENTITY_PROP_VALUE_VECTOR_IS_TOO_LONG: &str =
    "Propery value vector can`t contain more values";
pub const ERROR_INTERNAL_RPOP_DOES_NOT_MATCH_ITS_CLASS: &str =
    "Internal property does not match its class";