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

pub const ERROR_CLASS_LIMIT_REACHED: &str = "Maximum number of classes limit reached";
pub const ERROR_CLASS_SCHEMAS_LIMIT_REACHED: &str =
    "Maximum number of given class schemas limit reached";
pub const ERROR_CLASS_PROPERTIES_LIMIT_REACHED: &str =
    "Maximum number of properties in schema limit reached";
pub const ERROR_PER_CONTROLLER_ENTITIES_CREATION_LIMIT_EXCEEDS_OVERALL_LIMIT: &str =
    "Entities creation limit per controller should be less than overall entities creation limit";
pub const ERROR_ENTITIES_NUMBER_PER_CLASS_CONSTRAINT_VIOLATED: &str =
    "Number of entities per class is to big";
pub const ERROR_NUMBER_OF_CLASS_ENTITIES_PER_ACTOR_CONSTRAINT_VIOLATED: &str =
    "Number of class entities per actor constraint violated";
pub const ERROR_INDIVIDUAL_NUMBER_OF_CLASS_ENTITIES_PER_ACTOR_IS_TOO_BIG: &str =
    "Individual number of class entities per actor is too big";
pub const ERROR_NEW_ENTITIES_MAX_COUNT_IS_LESS_THAN_NUMBER_OF_ALREADY_CREATED: &str =
    "Cannot set voucher entities count to be less than number of already created entities";

// Main logic errors
// --------------------------------------

pub const ERROR_CLASS_NOT_FOUND: &str = "Class was not found by id";
pub const ERROR_UNKNOWN_CLASS_SCHEMA_ID: &str = "Unknown class schema id";
pub const ERROR_CLASS_SCHEMA_NOT_ACTIVE: &str = "Given class schema is not active";
pub const ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_PROP_INDEX: &str =
    "New class schema refers to an unknown property index";
pub const ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_CLASS: &str =
    "New class schema refers to an unknown class id";
pub const ERROR_NO_PROPS_IN_CLASS_SCHEMA: &str =
    "Cannot add a class schema with an empty list of properties";
pub const ERROR_ENTITY_NOT_FOUND: &str = "Entity was not found by id";
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
pub const ERROR_PROP_NAME_NOT_UNIQUE_IN_A_CLASS: &str =
    "Property name is not unique within its class";
pub const ERROR_MISSING_REQUIRED_PROP: &str =
    "Some required property was not found when adding schema support to entity";
pub const ERROR_UNKNOWN_ENTITY_PROP_ID: &str = "Some of the provided property ids cannot be found on the current list of propery values of this entity";
pub const ERROR_TEXT_PROP_IS_TOO_LONG: &str = "Text property is too long";
pub const ERROR_VEC_PROP_IS_TOO_LONG: &str = "Vector property is too long";
pub const ERROR_ENTITY_PROP_VALUE_VECTOR_IS_TOO_LONG: &str =
    "Propery value vector can`t contain more values";
pub const ERROR_ENTITY_PROP_VALUE_VECTOR_INDEX_IS_OUT_OF_RANGE: &str =
    "Given property value vector index is out of range";
pub const ERROR_PROP_VALUE_TYPE_DOESNT_MATCH_INTERNAL_ENTITY_VECTOR_TYPE: &str =
    "Propery value type does not match internal entity vector type";
pub const ERROR_PROP_DOES_NOT_MATCH_ITS_CLASS: &str = "Internal property does not match its class";
pub const ERROR_ENTITY_RC_DOES_NOT_EQUAL_TO_ZERO: &str =
    "Entity removal can`t be completed, as there are some property values pointing to given entity";
pub const ERROR_ENTITY_INBOUND_SAME_OWNER_RC_DOES_NOT_EQUAL_TO_ZERO: &str =
    "Entity ownership transfer can`t be completed, as there are some property values pointing to given entity with same owner flag set";
pub const ERROR_CLASS_PROP_NOT_FOUND: &str = "Class property under given index not found";

// Permission errors

pub const ERROR_ALL_PROP_WERE_LOCKED_ON_CLASS_LEVEL: &str =
    "All property values, related to a given entity were locked on class level";
pub const ERROR_CURATOR_IS_NOT_A_MEMBER_OF_A_GIVEN_CURATOR_GROUP: &str =
    "Curator under provided curator id is not a member of curaror group under given id";
pub const ERROR_CURATOR_GROUP_ALREADY_EXISTS: &str = "Given curator group already exist";
pub const ERROR_CURATOR_GROUP_DOES_NOT_EXIST: &str = "Given curator group does not exist";
pub const ERROR_SAME_CONTROLLER_CONSTRAINT_VIOLATION: &str =
    "Entity should be referenced from the entity, owned by the same controller";
pub const ERROR_MAINTAINER_DOES_NOT_EXIST: &str = "Given maintainer does not exist";
pub const ERROR_MAINTAINER_ALREADY_EXISTS: &str = "Given maintainer already exist";
pub const ERROR_ACTOR_CAN_NOT_CREATE_ENTITIES: &str =
    "Provided actor can`t create entities of given class";
pub const ERROR_MAX_NUMBER_OF_ENTITIES_PER_CLASS_LIMIT_REACHED: &str =
    "Maximum numbers of entities per class limit reached";
pub const ERROR_ENTITY_CREATION_BLOCKED: &str = "Current class entities creation blocked";
pub const ERROR_VOUCHER_LIMIT_REACHED: &str = "Entities voucher limit reached";
pub const ERROR_LEAD_AUTH_FAILED: &str = "Lead authentication failed";
pub const ERROR_MEMBER_AUTH_FAILED: &str = "Member authentication failed";
pub const ERROR_CURATOR_AUTH_FAILED: &str = "Curator authentication failed";
pub const ERROR_BAD_ORIGIN: &str = "Expected root or signed origin";
pub const ERROR_ENTITY_REMOVAL_ACCESS_DENIED: &str = "Entity removal access denied";
pub const ERROR_ENTITY_ADD_SCHEMA_SUPPORT_ACCESS_DENIED: &str =
    "Add entity schema support access denied";
pub const ERROR_CLASS_ACCESS_DENIED: &str = "Class access denied";
pub const ERROR_ENTITY_ACCESS_DENIED: &str = "Entity access denied";
pub const ERROR_ENTITY_CAN_NOT_BE_REFRENCED: &str = "Given entity can`t be referenced";
pub const ERROR_CLASS_PROPERTY_TYPE_IS_LOCKED_FOR_GIVEN_ACTOR: &str =
    "Given class property type is locked for updating";
pub const ERROR_NUMBER_OF_MAINTAINERS_PER_CLASS_LIMIT_REACHED: &str =
    "Class maintainers limit reached";
pub const ERROR_NUMBER_OF_CURATORS_PER_GROUP_LIMIT_REACHED: &str =
    "Max number of curators per group limit reached";
pub const ERROR_CURATOR_GROUP_IS_NOT_ACTIVE: &str = "Curator group is not active";
pub const ERROR_ORIGIN_CANNOT_BE_MADE_INTO_RAW_ORIGIN: &str =
    "Origin cannot be made into raw origin";
pub const ERROR_PROPERTY_VALUE_SHOULD_BE_UNIQUE: &str =
    "Provided property value should be unique across all entity property values";
