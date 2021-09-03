use super::*;

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Eq, PartialEq, Default, Clone)]
pub struct Class<
    EntityId: Default + BaseArithmetic + Clone + Copy,
    ClassId: Default + BaseArithmetic + Clone + Copy,
    CuratorGroupId: Ord + Default,
> {
    /// Permissions for an instance of a Class.
    class_permissions: ClassPermissions<CuratorGroupId>,
    /// All properties that have been used on this class across different class schemas.
    /// Unlikely to be more than roughly 20 properties per class, often less.
    /// For Person, think "height", "weight", etc.
    properties: Vec<Property<ClassId>>,

    /// All schemas that are available for this class, think v0.0 Person, v.1.0 Person, etc.
    schemas: Vec<Schema>,

    name: Vec<u8>,

    description: Vec<u8>,

    /// The maximum number of entities which can be created.
    maximum_entities_count: EntityId,

    /// The current number of entities which exist.
    current_number_of_entities: EntityId,

    /// How many entities a given controller may create at most.
    default_entity_creation_voucher_upper_bound: EntityId,
}

impl<
        EntityId: Default + BaseArithmetic + Clone + Copy,
        ClassId: Default + BaseArithmetic + Clone + Copy,
        CuratorGroupId: Ord + Default,
    > Class<EntityId, ClassId, CuratorGroupId>
{
    /// Create new `Class` with provided parameters
    pub fn new(
        class_permissions: ClassPermissions<CuratorGroupId>,
        name: Vec<u8>,
        description: Vec<u8>,
        maximum_entities_count: EntityId,
        default_entity_creation_voucher_upper_bound: EntityId,
    ) -> Self {
        Self {
            class_permissions,
            properties: vec![],
            schemas: vec![],
            name,
            description,
            maximum_entities_count,
            current_number_of_entities: EntityId::zero(),
            default_entity_creation_voucher_upper_bound,
        }
    }

    pub fn get_name(&self) -> &[u8] {
        &self.name
    }

    pub fn get_description(&self) -> &[u8] {
        &self.description
    }

    pub fn set_name(&mut self, name: Vec<u8>) {
        self.name = name;
    }

    pub fn set_description(&mut self, description: Vec<u8>) {
        self.description = description;
    }

    /// Used to update `Schema` status under given `schema_index`
    pub fn update_schema_status(&mut self, schema_index: SchemaId, schema_status: bool) {
        if let Some(schema) = self.schemas.get_mut(schema_index as usize) {
            schema.set_status(schema_status);
        };
    }

    /// Used to update `Class` permissions
    pub fn update_permissions(&mut self, permissions: ClassPermissions<CuratorGroupId>) {
        self.class_permissions = permissions
    }

    /// Get Class schemas by mutable reference
    pub fn get_schemas_mut(&mut self) -> &mut Vec<Schema> {
        &mut self.schemas
    }

    /// Get Class schemas by reference
    pub fn get_schemas(&self) -> &Vec<Schema> {
        &self.schemas
    }

    /// Increment number of entities, associated with this class
    pub fn increment_entities_count(&mut self) {
        self.current_number_of_entities += EntityId::one();
    }

    /// Decrement number of entities, associated with this class
    pub fn decrement_entities_count(&mut self) {
        self.current_number_of_entities -= EntityId::one();
    }

    /// Retrieve `ClassPermissions` by mutable reference
    pub fn get_permissions_mut(&mut self) -> &mut ClassPermissions<CuratorGroupId> {
        &mut self.class_permissions
    }

    /// Retrieve `ClassPermissions` by reference
    pub fn get_permissions_ref(&self) -> &ClassPermissions<CuratorGroupId> {
        &self.class_permissions
    }

    /// Retrieve `ClassPermissions` by value
    pub fn get_permissions(self) -> ClassPermissions<CuratorGroupId> {
        self.class_permissions
    }

    /// Retrieve `Class` properties by value  
    pub fn get_properties(self) -> Vec<Property<ClassId>> {
        self.properties
    }

    /// Replace `Class` properties with updated_class_properties
    pub fn set_properties(&mut self, updated_class_properties: Vec<Property<ClassId>>) {
        self.properties = updated_class_properties;
    }

    /// Get per controller `Class`- specific limit
    pub fn get_default_entity_creation_voucher_upper_bound(&self) -> EntityId {
        self.default_entity_creation_voucher_upper_bound
    }

    /// Retrive the maximum entities count, which can be created for given `Class`
    pub fn get_maximum_entities_count(&self) -> EntityId {
        self.maximum_entities_count
    }

    /// Set per controller `Class`- specific limit
    pub fn set_default_entity_creation_voucher_upper_bound(
        &mut self,
        new_default_entity_creation_voucher_upper_bound: EntityId,
    ) {
        self.default_entity_creation_voucher_upper_bound =
            new_default_entity_creation_voucher_upper_bound;
    }

    /// Set the maximum entities count, which can be created for given `Class`
    pub fn set_maximum_entities_count(&mut self, maximum_entities_count: EntityId) {
        self.maximum_entities_count = maximum_entities_count;
    }

    /// Ensure `Class` `Schema` under given index exist, return corresponding `Schema`
    pub fn ensure_schema_exists<T: Config>(
        &self,
        schema_index: SchemaId,
    ) -> Result<&Schema, Error<T>> {
        self.schemas
            .get(schema_index as usize)
            .ok_or(Error::<T>::UnknownClassSchemaId)
    }

    /// Ensure `schema_id` is a valid index of `Class` schemas vector
    pub fn ensure_schema_id_exists<T: Config>(&self, schema_id: SchemaId) -> Result<(), Error<T>> {
        ensure!(
            schema_id < self.schemas.len() as SchemaId,
            Error::<T>::UnknownClassSchemaId
        );
        Ok(())
    }

    /// Ensure `Schema`s limit per `Class` not reached
    pub fn ensure_schemas_limit_not_reached<T: Config>(&self) -> Result<(), Error<T>> {
        ensure!(
            (self.schemas.len() as MaxNumber) < T::MaxNumberOfSchemasPerClass::get(),
            Error::<T>::ClassSchemasLimitReached
        );
        Ok(())
    }

    /// Ensure properties limit per `Schema` not reached
    pub fn ensure_properties_limit_not_reached<T: Config>(
        &self,
        new_properties: &[Property<ClassId>],
    ) -> Result<(), Error<T>> {
        ensure!(
            T::MaxNumberOfPropertiesPerSchema::get()
                >= (self.properties.len() + new_properties.len()) as MaxNumber,
            Error::<T>::SchemaPropertiesLimitReached
        );
        Ok(())
    }

    /// Ensure `Class` specific entities limit not reached
    pub fn ensure_maximum_entities_count_limit_not_reached<T: Config>(
        &self,
    ) -> Result<(), Error<T>> {
        ensure!(
            self.current_number_of_entities < self.maximum_entities_count,
            Error::<T>::NumberOfEntitiesPerClassLimitReached
        );
        Ok(())
    }

    /// Ensure `Property` under given `PropertyId` is unlocked from actor with given `EntityAccessLevel`
    /// return corresponding `Property` by value
    pub fn ensure_class_property_type_unlocked_from<T: Config>(
        self,
        in_class_schema_property_id: PropertyId,
        entity_access_level: EntityAccessLevel,
    ) -> Result<Property<ClassId>, Error<T>> {
        // Ensure property values were not locked on Class level
        self.ensure_property_values_unlocked()?;

        // Get class-level information about this `Property`
        let class_property = self
            .properties
            .get(in_class_schema_property_id as usize)
            // Throw an error if a property was not found on class
            // by an in-class index of a property.
            .ok_or(Error::<T>::ClassPropertyNotFound)?;

        // Ensure Property is unlocked from Actor with given EntityAccessLevel
        class_property.ensure_unlocked_from::<T>(entity_access_level)?;

        Ok(class_property.clone())
    }

    /// Ensure property values were not locked on `Class` level
    pub fn ensure_property_values_unlocked<T: Config>(&self) -> Result<(), Error<T>> {
        ensure!(
            !self
                .get_permissions_ref()
                .all_entity_property_values_locked(),
            Error::<T>::AllPropertiesWereLockedOnClassLevel
        );
        Ok(())
    }
}
