use crate::*;
use frame_support::decl_error;

decl_error! {
    /// Content directory errors
    pub enum Error for Module<T: Config> {

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
        EntityPropertyValueVectorIndexIsOutOfRange,


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

        /// Entity ownership transfer can`t be completed, as there are some property values pointing to given entity with same owner flag set
        EntityInboundSameOwnerRcDoesNotEqualToZero,

        /// Provided entity controller is equal to the current one
        ProvidedEntityControllerIsEqualToTheCurrentOne,

        /// All ids of new property value references with same owner flag set should match their respective Properties defined on Class level
        AllProvidedPropertyValueIdsMustBeReferencesWithSameOwnerFlagSet,

        /// Entity was not created in batched transaction
        EntityNotCreatedByOperation,

        /// Permission errors
        /// --------------------------------------

        /// Curator group can`t be removed, as it currently maintains at least one class
        CuratorGroupRemovalForbidden,

        /// All property values, related to a given Entity were locked on Class level
        AllPropertiesWereLockedOnClassLevel,

        /// Curator under provided curator id is not a member of curaror group under given id
        CuratorIsNotAMemberOfGivenCuratorGroup,

        /// Curator under provided curator id is already a member of curaror group under given id
        CuratorIsAlreadyAMemberOfGivenCuratorGroup,

        /// Given curator group does not exist
        CuratorGroupDoesNotExist,

        /// Entity should be referenced from the entity, owned by the same controller
        SameControllerConstraintViolation,

        /// Given maintainer does not exist
        MaintainerDoesNotExist,

        /// Given maintainer already exist
        MaintainerAlreadyExists,

        /// Provided actor can`t create entities of given class
        ActorCanNotCreateEntities,

        /// Maximum numbers of entities per class limit reached
        NumberOfEntitiesPerClassLimitReached,

        /// Current class entities creation blocked
        EntitiesCreationBlocked,

        /// Entities voucher limit reached
        VoucherLimitReached,

        /// Lead authentication failed
        LeadAuthFailed,

        /// Member authentication failed
        MemberAuthFailed,

        /// Curator authentication failed
        CuratorAuthFailed,

        /// Expected root or signed origin
        BadOrigin,

        /// Entity removal access denied
        EntityRemovalAccessDenied,

        /// Add entity schema support access denied
        EntityAddSchemaSupportAccessDenied,

        /// Class access denied
        ClassAccessDenied,

        /// Entity access denied
        EntityAccessDenied,

        /// Given entity can`t be referenced
        EntityCanNotBeReferenced,

        /// Given class property type is locked for given actor
        ClassPropertyTypeLockedForGivenActor,

        /// Number of maintainers per class limit reached
        ClassMaintainersLimitReached,

        /// Max number of curators per group limit reached
        CuratorsPerGroupLimitReached,

        /// Curator group is not active
        CuratorGroupIsNotActive,

        /// Origin cannot be made into raw origin
        OriginCanNotBeMadeIntoRawOrigin,

        /// Property value should be unique across all Entities of this Class
        PropertyValueShouldBeUnique
    }
}
