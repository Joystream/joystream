
use frame_support::decl_error;

pub const ERROR_CURATOR_IS_NOT_A_MEMBER_OF_A_GIVEN_CURATOR_GROUP: &str =
    "Curator under provided curator id is not a member of curaror group under given id";
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
pub const ERROR_ENTITY_CAN_NOT_BE_REFERENCED: &str = "Given entity can`t be referenced";
pub const ERROR_CLASS_PROPERTY_TYPE_IS_LOCKED_FOR_GIVEN_ACTOR: &str =
    "Given class property type is locked for given actor";
pub const ERROR_NUMBER_OF_MAINTAINERS_PER_CLASS_LIMIT_REACHED: &str =
    "Class maintainers limit reached";
pub const ERROR_NUMBER_OF_CURATORS_PER_GROUP_LIMIT_REACHED: &str =
    "Max number of curators per group limit reached";
pub const ERROR_CURATOR_GROUP_IS_NOT_ACTIVE: &str = "Curator group is not active";
pub const ERROR_ORIGIN_CANNOT_BE_MADE_INTO_RAW_ORIGIN: &str =
    "Origin cannot be made into raw origin";
pub const ERROR_PROPERTY_VALUE_SHOULD_BE_UNIQUE: &str =
    "Property value should be unique across all Entities of this Class";

decl_error! {
    #[derive(Copy)]
    /// Content directory errors
    pub enum Error {

        /// Validation errors
        /// --------------------------------------


        /// Property name is too short
        PropertyNameTooShort,

        /// Property name is too long
        PropertyNameTooLong,

        /// Property description is too short 
        PropertyDescriptionTooShort,

        /// Property description is too long 
        PropertyDescriptionTooLong,

        /// Class name is too short
        ClassNameTooShort,

        /// Class name is too long
        ClassNameTooLong,

        /// Class description is too short
        ClassDescriptionTooShort,

        /// Class description is too long
        ClassDescriptionTooLong,

        /// Maximum number of classes limit reached
        ClassLimitReached,

        /// Maximum number of given class schemas limit reached
        ClassSchemasLimitReached,

        /// Maximum number of properties in schema limit reached
        SchemaPropertiesLimitReached,

        /// Entities creation limit per controller should be less than overall entities creation limit
        PerControllerEntitiesCreationLimitExceedsOverallLimit,

        /// Number of entities per class is to big
        EntitiesNumberPerClassConstraintViolated,

        /// Number of class entities per actor constraint violated
        NumberOfClassEntitiesPerActorConstraintViolated,

        /// Individual number of class entities per actor is too big
        IndividualNumberOfClassEntitiesPerActorIsTooBig,

        /// Cannot set voucher entities count to be less than number of already created entities
        NewEntitiesMaxCountIsLessThanNumberOfAlreadyCreated,

        /// Number of operations during atomic batching limit reached
        NumberOfOperationsDuringAtomicBatchingLimitReached,

        /// Text property is too long
        TextPropertyTooLong,

        /// Text property to be hashed is too long
        HashedTextPropertyTooLong,

        /// Vector property is too long
        VecPropertyTooLong,

        /// Propery value vector can`t contain more values
        EntityPropertyValueVectorIsTooLong,

        /// Given property value vector index is out of range
        EntityPropValueVectorIndexIsOutOfRange,


        /// Main logic errors
        /// --------------------------------------


        /// Class was not found by id
        ClassNotFound,

        /// Class property under given index not found
        ClassPropertyNotFound,

        /// Unknown class schema id
        UnknownClassSchemaId,

        /// Given class schema is not active
        ClassSchemaNotActive,

        /// New class schema refers to an unknown property index
        ClassSchemaRefersUnknownPropertyIndex,

        /// New class schema refers to an unknown class id
        ClassSchemaRefersUnknownClass,

        /// Cannot add a class schema with an empty list of properties
        NoPropertiesInClassSchema,

        /// Entity was not found by id
        EntityNotFound,

        /// Cannot add a schema that is already added to this entity
        SchemaAlreadyAddedToTheEntity,

        /// Some of the provided property values don't match the expected property type
        PropertyValueDoNotMatchType,

        /// Property value don't match the expected vector property type
        PropertyValueDoNotMatchVecType,

        /// Property value under given index is not a vector
        PropertyValueUnderGivenIndexIsNotAVector,

        /// Current property value vector nonce does not equal to provided one
        PropertyValueVecNoncesDoesNotMatch,

        /// Property name is not unique within its class
        PropertyNameNotUniqueInAClass,

        /// Some required property was not found when adding schema support to entity
        MissingRequiredProperty,

        /// Schema under provided schema_id does not contain given property
        SchemaDoesNotContainProvidedPropertyId,

        /// Some of the provided property ids cannot be found on the current list of propery values of this entity
        UnknownEntityPropertyId,

        /// Entity already contains property under provided index
        EntityAlreadyContainsGivenPropertyId,

        /// Propery value type does not match internal entity vector type
        PropertyValueTypeDoesNotMatchInternalVectorType,

        /// Provided property references entity, which class_id is not equal to class_id, declared in corresponding property type
        ReferencedEntityDoesNotMatchItsClass,

        /// Entity removal can`t be completed, as there are some property values pointing to given entity
        EntityRcDoesNotEqualToZero,

        /// Entity removal can`t be completed, as there are some property value references with same owner flag set pointing to given entity
        EntitySameOwnerRcDoesNotEqualToZero,

        /// Entity ownership transfer can`t be completed, as there are some property values pointing to given entity with same owner flag set
        EntityInboundSameOwnerRcDoesNotEqualToZero,

        /// Provided entity controller is equal to the current one
        ProvidedEntityControllerIsEqualToTheCurrentOne

        /// All ids of new property value references with same owner flag set should match their respective Properties defined on Class level
        AllProvidedPropertyValueIdsMustBeReferencesWithSameOwnerFlagSet

        /// Permission errors
        /// --------------------------------------

        /// Curator group can`t be removed, as it currently maintains at least one class
        CuratorGroupRemovalForbidden,

        /// All property values, related to a given Entity were locked on Class level
        AllPropertiesWereLockedOnClassLevel

    }
}